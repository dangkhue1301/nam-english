import {
  buildLibrary,
  buildStats,
  learningKeyFor,
  nextReview,
  selectQuestions,
} from "./core.js";

const DATABASE_NAME = "nam-english-local";
const DATABASE_VERSION = 1;
const LOCAL_PREFIX = "nam-english:";

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

function openIndexedDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("questions")) {
        const questions = database.createObjectStore("questions", {
          keyPath: "id",
        });
        questions.createIndex("domain", "domain", { unique: false });
        questions.createIndex("learningKey", "learningKey", { unique: false });
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

    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB chưa sẵn sàng."));
    request.onblocked = () =>
      reject(new Error("Kho dữ liệu đang bị một thẻ khác khóa."));
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

  async importQuestions(rows, filename) {
    const importedAt = Date.now();
    const transaction = this.database.transaction(
      ["questions", "imports"],
      "readwrite",
    );
    const questionsStore = transaction.objectStore("questions");
    rows.forEach((question) =>
      questionsStore.put({ ...question, importedAt }),
    );
    transaction.objectStore("imports").put({
      id: `${importedAt}-${crypto.randomUUID()}`,
      filename,
      count: rows.length,
      importedAt,
    });
    await transactionDone(transaction);
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

  async importQuestions(rows, filename) {
    const importedAt = Date.now();
    const current = this.read("questions");
    const byId = new Map(current.map((question) => [question.id, question]));
    rows.forEach((question) =>
      byId.set(question.id, { ...question, importedAt }),
    );
    this.write("questions", [...byId.values()]);

    const imports = this.read("imports");
    imports.push({
      id: `${importedAt}-${crypto.randomUUID()}`,
      filename,
      count: rows.length,
      importedAt,
    });
    this.write("imports", imports);
  }

  async recordAttempt(question, answer, correct) {
    const now = Date.now();
    const attempts = this.read("attempts");
    attempts.push({
      id: `${now}-${crypto.randomUUID()}`,
      questionId: question.id,
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
    const review = {
      ...nextReview(index >= 0 ? reviews[index] : undefined, correct, now),
      learningKey: key,
      lastQuestionId: question.id,
    };
    if (index >= 0) reviews[index] = review;
    else reviews.push(review);
    this.write("reviews", reviews);
    return review;
  }
}

export async function createRepository() {
  if ("indexedDB" in globalThis) {
    try {
      return new IndexedDatabaseRepository(await openIndexedDatabase());
    } catch (error) {
      console.warn("Chuyển sang localStorage:", error);
    }
  }
  return new LocalStorageRepository();
}

export async function readDashboard(repository) {
  const snapshot = await repository.snapshot();
  return {
    ...buildLibrary(snapshot.questions, snapshot.imports),
    stats: buildStats(
      snapshot.questions,
      snapshot.reviews,
      snapshot.attempts,
      snapshot.imports,
    ),
  };
}

export async function getSessionQuestions(repository, filters) {
  const snapshot = await repository.snapshot();
  return selectQuestions(snapshot.questions, snapshot.reviews, filters);
}
