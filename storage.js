import {
  buildLibrary,
  buildStats,
  learningKeyFor,
  nextReview,
  selectQuestions,
} from "./core.js";

const DATABASE_NAME = "nam-english-local";
const DATABASE_VERSION = 2;
const LOCAL_PREFIX = "nam-english:";
const ACTIVE_SESSION_KEY = `${LOCAL_PREFIX}active-session`;
const SELECTED_SET_KEY = `${LOCAL_PREFIX}selected-set`;
const LEGACY_SET_ID = "legacy-v1";

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Không đọc được dữ liệu."));
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Không thể lưu dữ liệu."));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("Đã hủy thao tác lưu."));
  });
}

function firstCompletedAtFor(previous, correct, now) {
  if (previous?.firstCompletedAt != null) return previous.firstCompletedAt;
  if ((previous?.repetitions ?? 0) > 0) {
    return previous.lastReviewedAt ?? now;
  }
  return correct ? now : undefined;
}

function createId() {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function setNameFromFilename(filename) {
  const clean = String(filename || "Bộ câu hỏi")
    .replace(/\.csv$/i, "")
    .replaceAll("_", " ")
    .trim();
  return clean || "Bộ câu hỏi";
}

function questionSetId(question) {
  return question.setId || LEGACY_SET_ID;
}

function newQuestionSet(filename, count, existingImports = []) {
  const importedAt = Date.now();
  const id = `set-${importedAt}-${createId()}`;
  const baseName = setNameFromFilename(filename);
  const sameFilenameCount = existingImports.filter(
    (item) => item.filename === filename,
  ).length;
  return {
    id,
    setId: id,
    name:
      sameFilenameCount > 0
        ? `${baseName} (${sameFilenameCount + 1})`
        : baseName,
    filename,
    count,
    importedAt,
  };
}

function prepareImportedQuestions(rows, set) {
  return rows.map((question, index) => ({
    ...question,
    id: `${set.id}::${createId()}`,
    originalId: question.originalId || question.id,
    setId: set.id,
    position: index,
    importedAt: set.importedAt,
  }));
}

function legacySetRecord(questions, imports) {
  const timestamps = [
    ...questions.map((question) => Number(question.importedAt) || 0),
    ...imports.map((item) => Number(item.importedAt) || 0),
  ].filter(Boolean);
  const importedAt = timestamps.length ? Math.max(...timestamps) : Date.now();
  return {
    id: LEGACY_SET_ID,
    setId: LEGACY_SET_ID,
    name: "Dữ liệu cũ",
    filename: "Dữ liệu đã nhập trước đây",
    count: questions.length,
    importedAt,
    isLegacy: true,
  };
}

function openIndexedDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    let blocked = false;

    request.onupgradeneeded = () => {
      const database = request.result;
      let questions;
      if (!database.objectStoreNames.contains("questions")) {
        questions = database.createObjectStore("questions", {
          keyPath: "id",
        });
        questions.createIndex("domain", "domain", { unique: false });
        questions.createIndex("learningKey", "learningKey", { unique: false });
      } else {
        questions = request.transaction.objectStore("questions");
      }
      if (!questions.indexNames.contains("setId")) {
        questions.createIndex("setId", "setId", { unique: false });
      }
      if (!database.objectStoreNames.contains("reviews")) {
        database.createObjectStore("reviews", { keyPath: "learningKey" });
      }
      if (!database.objectStoreNames.contains("attempts")) {
        const attempts = database.createObjectStore("attempts", {
          keyPath: "id",
          autoIncrement: true,
        });
        attempts.createIndex("attemptedAt", "attemptedAt", { unique: false });
      }
      if (!database.objectStoreNames.contains("imports")) {
        database.createObjectStore("imports", { keyPath: "id" });
      }
    };

    request.onsuccess = () => {
      const database = request.result;
      if (blocked) {
        database.close();
        return;
      }
      database.onversionchange = () => database.close();
      resolve(database);
    };
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB chưa sẵn sàng."));
    request.onblocked = () => {
      blocked = true;
      const error = new Error(
        "Kho dữ liệu đang được mở ở một thẻ cũ. Hãy đóng thẻ đó rồi tải lại trang.",
      );
      error.name = "DatabaseBlockedError";
      reject(error);
    };
  });
}

class IndexedDatabaseRepository {
  constructor(database) {
    this.database = database;
    this.mode = "IndexedDB";
  }

  async all(storeName) {
    const transaction = this.database.transaction(storeName, "readonly");
    return requestResult(transaction.objectStore(storeName).getAll());
  }

  async snapshot() {
    const [questions, reviews, attempts, imports] = await Promise.all([
      this.all("questions"),
      this.all("reviews"),
      this.all("attempts"),
      this.all("imports"),
    ]);
    return { questions, reviews, attempts, imports };
  }

  async migrateLegacyData() {
    const snapshot = await this.snapshot();
    const untaggedQuestions = snapshot.questions.filter(
      (question) => !question.setId,
    );
    const legacyQuestions = snapshot.questions.filter(
      (question) => questionSetId(question) === LEGACY_SET_ID,
    );
    const needsLegacySet = !snapshot.imports.some(
      (item) => (item.setId || item.id) === LEGACY_SET_ID,
    );
    const legacyIds = new Set(legacyQuestions.map((question) => question.id));
    const attemptsToTag = snapshot.attempts.filter(
      (attempt) =>
        !attempt.setId && legacyIds.has(attempt.questionId),
    );
    if (
      legacyQuestions.length === 0 ||
      (untaggedQuestions.length === 0 &&
        attemptsToTag.length === 0 &&
        !needsLegacySet)
    ) {
      return;
    }

    const transaction = this.database.transaction(
      ["questions", "attempts", "imports"],
      "readwrite",
    );
    const questionStore = transaction.objectStore("questions");
    untaggedQuestions.forEach((question) => {
      questionStore.put({
        ...question,
        originalId: question.originalId || question.id,
        setId: LEGACY_SET_ID,
      });
    });

    const attemptStore = transaction.objectStore("attempts");
    attemptsToTag.forEach((attempt) =>
      attemptStore.put({ ...attempt, setId: LEGACY_SET_ID }),
    );

    if (needsLegacySet) {
      transaction
        .objectStore("imports")
        .put(legacySetRecord(legacyQuestions, snapshot.imports));
    }
    await transactionDone(transaction);
  }

  async importQuestions(rows, filename) {
    const set = newQuestionSet(
      filename,
      rows.length,
      await this.all("imports"),
    );
    const questions = prepareImportedQuestions(rows, set);
    const transaction = this.database.transaction(
      ["questions", "imports"],
      "readwrite",
    );
    const questionsStore = transaction.objectStore("questions");
    questions.forEach((question) => questionsStore.put(question));
    transaction.objectStore("imports").put(set);
    await transactionDone(transaction);
    return set;
  }

  async recordAttempt(question, answer, correct) {
    const now = Date.now();
    const stores =
      question.domain === "vocabulary"
        ? ["attempts", "reviews"]
        : ["attempts"];
    const transaction = this.database.transaction(stores, "readwrite");

    transaction.objectStore("attempts").add({
      questionId: question.id,
      originalQuestionId: question.originalId || question.id,
      setId: questionSetId(question),
      answer,
      correct,
      grade: correct ? 4 : 1,
      attemptedAt: now,
    });

    let review;
    if (question.domain === "vocabulary") {
      const key = learningKeyFor(question);
      const reviewStore = transaction.objectStore("reviews");
      const previous = await requestResult(reviewStore.get(key));
      review = {
        ...nextReview(previous, correct, now),
        learningKey: key,
        lastQuestionId: question.id,
        lastSetId: questionSetId(question),
        firstCompletedAt: firstCompletedAtFor(previous, correct, now),
      };
      reviewStore.put(review);
    }

    await transactionDone(transaction);
    return review;
  }
}

class LocalStorageRepository {
  constructor() {
    this.mode = "localStorage";
  }

  read(name) {
    try {
      return JSON.parse(localStorage.getItem(`${LOCAL_PREFIX}${name}`) ?? "[]");
    } catch {
      return [];
    }
  }

  write(name, value) {
    localStorage.setItem(`${LOCAL_PREFIX}${name}`, JSON.stringify(value));
  }

  async snapshot() {
    return {
      questions: this.read("questions"),
      reviews: this.read("reviews"),
      attempts: this.read("attempts"),
      imports: this.read("imports"),
    };
  }

  async migrateLegacyData() {
    const snapshot = await this.snapshot();
    const untaggedQuestions = snapshot.questions.filter(
      (question) => !question.setId,
    );
    const legacyQuestions = snapshot.questions.filter(
      (question) => questionSetId(question) === LEGACY_SET_ID,
    );
    const needsLegacySet = !snapshot.imports.some(
      (item) => (item.setId || item.id) === LEGACY_SET_ID,
    );
    if (legacyQuestions.length === 0) return;

    const legacyIds = new Set(legacyQuestions.map((question) => question.id));
    const attemptsToTag = snapshot.attempts.filter(
      (attempt) =>
        !attempt.setId && legacyIds.has(attempt.questionId),
    );
    if (
      untaggedQuestions.length === 0 &&
      attemptsToTag.length === 0 &&
      !needsLegacySet
    ) {
      return;
    }
    this.write(
      "questions",
      snapshot.questions.map((question) =>
        !question.setId
          ? {
              ...question,
              originalId: question.originalId || question.id,
              setId: LEGACY_SET_ID,
            }
          : question,
      ),
    );
    this.write(
      "attempts",
      snapshot.attempts.map((attempt) =>
        !attempt.setId && legacyIds.has(attempt.questionId)
          ? { ...attempt, setId: LEGACY_SET_ID }
          : attempt,
      ),
    );
    if (needsLegacySet) {
      this.write("imports", [
        ...snapshot.imports,
        legacySetRecord(legacyQuestions, snapshot.imports),
      ]);
    }
  }

  async importQuestions(rows, filename) {
    const imports = this.read("imports");
    const set = newQuestionSet(filename, rows.length, imports);
    this.write("questions", [
      ...this.read("questions"),
      ...prepareImportedQuestions(rows, set),
    ]);
    this.write("imports", [...imports, set]);
    return set;
  }

  async recordAttempt(question, answer, correct) {
    const now = Date.now();
    const attempts = this.read("attempts");
    attempts.push({
      id: `${now}-${createId()}`,
      questionId: question.id,
      originalQuestionId: question.originalId || question.id,
      setId: questionSetId(question),
      answer,
      correct,
      grade: correct ? 4 : 1,
      attemptedAt: now,
    });
    this.write("attempts", attempts);

    if (question.domain !== "vocabulary") return undefined;

    const key = learningKeyFor(question);
    const reviews = this.read("reviews");
    const index = reviews.findIndex((item) => item.learningKey === key);
    const previous = index >= 0 ? reviews[index] : undefined;
    const review = {
      ...nextReview(previous, correct, now),
      learningKey: key,
      lastQuestionId: question.id,
      lastSetId: questionSetId(question),
      firstCompletedAt: firstCompletedAtFor(previous, correct, now),
    };
    if (index >= 0) reviews[index] = review;
    else reviews.push(review);
    this.write("reviews", reviews);
    return review;
  }
}

function deriveQuestionSets(questions, imports) {
  const activeQuestions = questions.filter(
    (question) => question.active !== false,
  );
  const countBySet = new Map();
  activeQuestions.forEach((question) => {
    const setId = questionSetId(question);
    countBySet.set(setId, (countBySet.get(setId) ?? 0) + 1);
  });

  const setsById = new Map();
  imports
    .filter((item) => item.setId)
    .forEach((item) => {
      const id = item.setId;
      setsById.set(id, {
        ...item,
        id,
        setId: id,
        name: item.name || setNameFromFilename(item.filename),
        count: countBySet.get(id) ?? Number(item.count) ?? 0,
      });
    });

  countBySet.forEach((count, setId) => {
    if (setsById.has(setId)) return;
    const related = activeQuestions.filter(
      (question) => questionSetId(question) === setId,
    );
    setsById.set(setId, {
      id: setId,
      setId,
      name: setId === LEGACY_SET_ID ? "Dữ liệu cũ" : "Bộ câu hỏi",
      filename:
        setId === LEGACY_SET_ID
          ? "Dữ liệu đã nhập trước đây"
          : "Bộ câu hỏi",
      count,
      importedAt: Math.max(
        ...related.map((question) => Number(question.importedAt) || 0),
        0,
      ),
      isLegacy: setId === LEGACY_SET_ID,
    });
  });

  return [...setsById.values()]
    .filter((set) => set.count > 0)
    .sort(
      (a, b) =>
        b.importedAt - a.importedAt ||
        a.name.localeCompare(b.name, "vi"),
    );
}

export async function createRepository() {
  let repository;
  if ("indexedDB" in globalThis) {
    try {
      repository = new IndexedDatabaseRepository(
        await openIndexedDatabase(),
      );
    } catch (error) {
      if (error?.name === "DatabaseBlockedError") throw error;
      console.warn("Chuyển sang localStorage:", error);
    }
  }
  repository ??= new LocalStorageRepository();
  await repository.migrateLegacyData();
  return repository;
}

export function readSelectedQuestionSet() {
  try {
    return localStorage.getItem(SELECTED_SET_KEY);
  } catch {
    return null;
  }
}

export function saveSelectedQuestionSet(setId) {
  try {
    if (setId) localStorage.setItem(SELECTED_SET_KEY, setId);
    else localStorage.removeItem(SELECTED_SET_KEY);
  } catch (error) {
    console.warn("Không thể lưu bộ câu hỏi đã chọn:", error);
  }
}

export async function readDashboard(repository, requestedSetId = null) {
  const snapshot = await repository.snapshot();
  const sets = deriveQuestionSets(snapshot.questions, snapshot.imports);
  const selectedSet =
    sets.find((set) => set.id === requestedSetId) ?? sets[0] ?? null;
  const selectedSetId = selectedSet?.id ?? null;
  const questions = selectedSetId
    ? snapshot.questions.filter(
        (question) => questionSetId(question) === selectedSetId,
      )
    : [];
  const questionIds = new Set(questions.map((question) => question.id));
  const attempts = snapshot.attempts.filter((attempt) =>
    questionIds.has(attempt.questionId),
  );

  return {
    ...buildLibrary(questions, sets),
    sets,
    selectedSetId,
    stats: buildStats(
      questions,
      snapshot.reviews,
      attempts,
      selectedSet ? [selectedSet] : [],
    ),
  };
}

export function saveStudySession({
  queue,
  selectedSetId,
  sessionDomain,
  sessionTarget,
  sessionDone,
  sessionCorrect,
  result,
}) {
  if (!selectedSetId || !sessionDomain || sessionTarget <= 0) return;
  try {
    localStorage.setItem(
      ACTIVE_SESSION_KEY,
      JSON.stringify({
        version: 2,
        queueIds: queue.map((question) => question.id),
        selectedSetId,
        sessionDomain,
        sessionTarget,
        sessionDone,
        sessionCorrect,
        result,
        savedAt: Date.now(),
      }),
    );
  } catch (error) {
    console.warn("Không thể lưu lượt học đang làm:", error);
  }
}

export function clearStudySession() {
  try {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  } catch (error) {
    console.warn("Không thể xóa lượt học đã lưu:", error);
  }
}

export async function restoreStudySession(repository) {
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(ACTIVE_SESSION_KEY) ?? "null");
  } catch {
    clearStudySession();
    return null;
  }

  if (
    ![1, 2].includes(saved?.version) ||
    !["grammar", "vocabulary"].includes(saved.sessionDomain) ||
    !Array.isArray(saved.queueIds) ||
    !Number.isFinite(saved.sessionTarget) ||
    saved.sessionTarget <= 0
  ) {
    clearStudySession();
    return null;
  }

  const snapshot = await repository.snapshot();
  const questionsById = new Map(
    snapshot.questions.map((question) => [question.id, question]),
  );
  const queue = saved.queueIds
    .map((id) => questionsById.get(id))
    .filter(Boolean);
  const selectedSetId =
    saved.version === 2
      ? saved.selectedSetId
      : queue[0]
        ? questionSetId(queue[0])
        : LEGACY_SET_ID;
  const sessionDone = Math.max(0, Number(saved.sessionDone) || 0);

  if (
    !selectedSetId ||
    queue.some((question) => questionSetId(question) !== selectedSetId) ||
    queue.some((question) => question.domain !== saved.sessionDomain) ||
    sessionDone + queue.length !== saved.sessionTarget
  ) {
    clearStudySession();
    return null;
  }

  return {
    queue,
    selectedSetId,
    sessionDomain: saved.sessionDomain,
    sessionTarget: saved.sessionTarget,
    sessionDone,
    sessionCorrect: Math.max(0, Number(saved.sessionCorrect) || 0),
    result: saved.result ?? null,
  };
}

export async function getSessionQuestions(repository, filters) {
  if (!filters.setId) return [];
  const snapshot = await repository.snapshot();
  const questions = snapshot.questions.filter(
    (question) => questionSetId(question) === filters.setId,
  );
  const questionById = new Map(
    questions.map((question) => [question.id, question]),
  );
  const completedQuestionIds = new Set(
    filters.completedQuestionIds ?? [],
  );
  const completedLearningKeys = new Set(
    filters.completedLearningKeys ?? [],
  );

  snapshot.attempts.forEach((attempt) => {
    const question = questionById.get(attempt.questionId);
    if (!question) return;
    if (question.domain === "grammar") {
      completedQuestionIds.add(question.id);
    } else if (question.domain === "vocabulary" && attempt.correct) {
      completedLearningKeys.add(learningKeyFor(question));
    }
  });

  return selectQuestions(questions, snapshot.reviews, {
    ...filters,
    completedQuestionIds: [...completedQuestionIds],
    completedLearningKeys: [...completedLearningKeys],
  });
}
