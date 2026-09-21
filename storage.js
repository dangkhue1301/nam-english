import { buildCsvPreview, buildLibrary, buildStats, displayAnswer, evaluateAnswer, isReviewDue, learningKeyFor, nextReview, QUESTION_TYPES, JA_QUESTION_TYPES, selectQuestions } from "./core.js";
import { questionsToCsv, mistakeQuestions } from "./stats.js";

const DB_NAME = "nam-english-local";
const STORE = "workspace";
const LOCAL_KEY = "nam-english:workspace-v5";
const PARTS = ["questions", "reviews", "attempts", "imports"];
const CHANNEL = "nam-english-workspace";
const MODES = ["grammar", "practice", "vocabulary", "flashcards", "kanji", "review"];
const ALL_QUESTION_TYPES = [...QUESTION_TYPES, ...JA_QUESTION_TYPES];
const MAX_TIMESTAMP = 8.64e15;
const copy = (value) => structuredClone(value);
const newId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const fail = (message) => { throw new Error(message); };
export const questionSetIdOf = (q) => q?.setId || "legacy-v1";
const emptyData = () => ({ questions: [], reviews: [], attempts: [], imports: [] });
const fresh = () => ({ ...emptyData(), revision: 0, session: null, summary: null, selectedSetId: null, recovery: null, srsEvents: [] });
const dataOnly = (w) => {
  if (w?.session) migrateSessionSrsEvents(w);
  const allEvents = copy(w?.srsEvents ?? []);
  const allPending = allEvents.filter((e) => !e.applied);
  const pending = allPending.length > 5000
    ? allPending.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5000).reverse()
    : allPending;
  const cap = Math.max(0, 5000 - pending.length);
  const applied = cap > 0
    ? allEvents.filter((e) => e.applied)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        .slice(0, cap)
    : [];
  return {
    ...Object.fromEntries(PARTS.map((part) => [part, copy(w?.[part] ?? [])])),
    srsEvents: [...pending, ...applied],
  };
};
const hasData = (w) => PARTS.some((part) => w?.[part]?.length);
const validTimestamp = (value) => Number.isFinite(value) && Math.abs(value) <= MAX_TIMESTAMP;
const domainForMode = (mode) => {
  if (mode === "flashcards") return "vocabulary";
  return mode;
};
const isPlainObject = (value) => value != null && typeof value === "object" && !Array.isArray(value);

function isStoredAnswer(value) {
  if (["string", "number", "boolean"].includes(typeof value)) return true;
  if (Array.isArray(value)) return value.every((item) => typeof item === "string");
  return isPlainObject(value) && Object.entries(value).every(([key, item]) => key && typeof item === "string");
}

function validDraft(draft) {
  if (draft == null) return true;
  return isPlainObject(draft) &&
    (draft.text == null || typeof draft.text === "string") &&
    (draft.selected == null || Array.isArray(draft.selected) && draft.selected.every(Number.isInteger)) &&
    (draft.ordered == null || Array.isArray(draft.ordered) && draft.ordered.every(Number.isInteger)) &&
    (draft.matches == null || isPlainObject(draft.matches) && Object.values(draft.matches).every((item) => typeof item === "string")) &&
    (draft.trueFalse == null || (Array.isArray(draft.trueFalse) && draft.trueFalse.length === 4 && draft.trueFalse.every((v) => ["", "true", "false"].includes(v))));
}

function legacyLocal() {
  const result = emptyData();
  try {
    for (const part of PARTS) {
      const value = JSON.parse(localStorage.getItem(`nam-english:${part}`) ?? "[]");
      if (Array.isArray(value)) result[part] = value;
    }
  } catch { /* Giữ nguyên các khóa cũ nếu không đọc được. */ }
  return result;
}
function fromLegacy(legacy) {
  const w = fresh();
  if (hasData(legacy)) {
    const data = dataOnly(legacy);
    data.questions = data.questions.map((q) => ({ ...q, setId: q.setId || "legacy-v1", originalId: q.originalId || q.id }));
    const sets = new Set(data.imports.map((s) => s.setId || s.id));
    for (const q of data.questions) {
      if (!sets.has(q.setId)) {
        sets.add(q.setId);
        data.imports.push({ id: q.setId, setId: q.setId, name: "Bộ bài cũ", filename: "du-lieu-cu.csv", importedAt: Date.now() });
      }
    }
    w.recovery = { savedAt: Date.now(), data };
  }
  return w;
}
function migrateSessionSrsEvents(w) {
  if (!w) return;
  w.srsEvents ??= [];
  const s = w.session;
  if (!s || s.mode !== "vocabulary" || !s.keyQuestions || !s.firstAnswers) return;
  const sessionTime = validTimestamp(s.startedAt) ? s.startedAt : (validTimestamp(s.updatedAt) ? s.updatedAt : Date.now());
  for (const [key, qIds] of Object.entries(s.keyQuestions)) {
    if (!Array.isArray(qIds)) continue;
    const answeredIds = qIds.filter((id) => s.firstAnswers[id] !== undefined);
    if (answeredIds.length === 0) continue;

    let eventTime = null;
    for (const qId of answeredIds) {
      const att = w.attempts?.find((a) => a.questionId === qId && a.id?.startsWith?.(`${s.id}:`));
      if (att && validTimestamp(att.attemptedAt)) {
        eventTime = eventTime != null ? Math.max(eventTime, att.attemptedAt) : att.attemptedAt;
      }
    }
    if (eventTime == null) {
      eventTime = sessionTime;
    }
    const isApplied = Boolean(s.keyEvaluated?.[key]);
    const eventId = `${s.id}:${key}`;
    let event = w.srsEvents.find((e) => e.id === eventId);
    if (!event) {
      w.srsEvents.push({
        id: eventId,
        sessionId: s.id,
        learningKey: key,
        questionIds: [...qIds],
        firstAnswers: Object.fromEntries(answeredIds.map((id) => [id, s.firstAnswers[id]])),
        applied: isApplied,
        appliedAt: isApplied ? eventTime : null,
        createdAt: eventTime,
        updatedAt: eventTime,
      });
    } else {
      for (const id of answeredIds) {
        if (event.firstAnswers[id] === undefined) {
          event.firstAnswers[id] = s.firstAnswers[id];
        }
      }
      if (isApplied && !event.applied) {
        event.applied = true;
        event.appliedAt = eventTime;
      }
    }
  }
}

function checkWorkspace(w) {
  if (!w || !PARTS.every((part) => Array.isArray(w[part]))) fail("Kho dữ liệu không hợp lệ. Hãy thử mở lại trang hoặc dùng bản sao lưu.");
  migrateSessionSrsEvents(w);
  return w;
}
function storageError(error) {
  return error?.name === "QuotaExceededError"
    ? new Error("Bộ nhớ đã đầy. Hãy sao lưu rồi xóa bớt bộ bài trước khi lưu tiếp.")
    : error instanceof Error ? error : new Error("Không thể lưu trên thiết bị này.");
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    let abandoned = false;
    const request = indexedDB.open(DB_NAME, 3);
    const blocked = () => {
      abandoned = true;
      clearTimeout(timer);
      const error = new Error("Đóng các tab NẮM đang mở ở bản cũ, rồi tải lại trang này.");
      error.name = "DatabaseBlockedError";
      reject(error);
    };
    const timer = setTimeout(blocked, 8000);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (db.objectStoreNames.contains(STORE)) return;
      const store = db.createObjectStore(STORE);
      const tx = request.transaction;
      const legacy = emptyData();
      const existing = PARTS.filter((part) => db.objectStoreNames.contains(part));
      let remaining = existing.length;
      const finish = () => {
        store.put(fromLegacy(hasData(legacy) ? legacy : legacyLocal()), "current");
        existing.forEach((part) => tx.objectStore(part).clear());
      };
      if (!remaining) finish();
      for (const part of existing) {
        const read = tx.objectStore(part).getAll();
        read.onsuccess = () => { legacy[part] = read.result; if (--remaining === 0) finish(); };
      }
    };
    request.onsuccess = () => {
      clearTimeout(timer);
      const db = request.result;
      if (abandoned) { db.close(); return; }
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onerror = () => { clearTimeout(timer); reject(request.error); };
    request.onblocked = () => { clearTimeout(timer); blocked(); };
  });
}

class IndexedBackend {
  constructor(db) { this.db = db; this.mode = "IndexedDB"; }
  run(reducer) {
    return new Promise((resolve, reject) => {
      let result, reducerError, tx;
      try { tx = this.db.transaction(STORE, reducer ? "readwrite" : "readonly"); }
      catch { reject(new Error("Kho dữ liệu vừa đổi ở tab khác. Hãy tải lại trang.")); return; }
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(storageError(reducerError ?? tx.error));
      tx.onabort = () => reject(storageError(reducerError ?? tx.error));
      const store = tx.objectStore(STORE);
      const read = store.get("current");
      read.onsuccess = () => {
        try {
          const w = checkWorkspace(read.result ?? fresh());
          if (reducer) { result = reducer(w); w.revision += 1; store.put(w, "current"); }
          else result = w;
        } catch (error) { reducerError = error; tx.abort(); }
      };
    });
  }
  close() { this.db.close(); }
}

class LocalBackend {
  constructor() { this.mode = "localStorage"; this.pending = Promise.resolve(); }
  async run(reducer) {
    const operation = () => {
      try {
        const raw = localStorage.getItem(LOCAL_KEY);
        const w = raw ? checkWorkspace(JSON.parse(raw)) : fromLegacy(legacyLocal());
        const result = reducer ? reducer(w) : copy(w);
        if (reducer || !raw) { w.revision += 1; localStorage.setItem(LOCAL_KEY, JSON.stringify(w)); }
        return copy(result);
      } catch (error) { throw storageError(error); }
    };
    const run = () => globalThis.navigator?.locks ? navigator.locks.request(CHANNEL, async () => operation()) : operation();
    const task = this.pending.then(run, run);
    this.pending = task.catch(() => {});
    return task;
  }
  close() {}
}

const setQuestions = (w, setId) => w.questions.filter((q) => questionSetIdOf(q) === setId);
function selection(w, { setId, setIds, domain, level = "all", topic = "all", grade = "all", type = "all", chapter = "all", lesson = "all", limit = 30, now, dueOnly = false }) {
  const targetSets = Array.isArray(setIds) && setIds.length > 0 ? new Set(setIds) : (setId ? new Set([setId]) : null);
  const questions = targetSets ? w.questions.filter((q) => targetSets.has(questionSetIdOf(q))) : w.questions;
  const byId = new Map(questions.map((q) => [q.id, q]));
  const done = new Set();
  const completedKeysBySet = new Map();

  for (const attempt of w.attempts) {
    if (attempt.purpose === "review") continue;
    const q = byId.get(attempt.questionId);
    if (!q) continue;
    if (q.subject === "japanese") {
      done.add(q.id);
    } else {
      if (q.domain !== "vocabulary") done.add(q.id);
      else if (attempt.correct) {
        const qSetId = questionSetIdOf(q);
        if (!completedKeysBySet.has(qSetId)) completedKeysBySet.set(qSetId, new Set());
        completedKeysBySet.get(qSetId).add(learningKeyFor(q));
      }
    }
  }

  const isJapanese = questions.some((q) => q.subject === "japanese");

  if (isJapanese) {
    return selectQuestions(questions, w.reviews, {
      setId: null,
      domain,
      level,
      topic,
      grade,
      type,
      chapter,
      lesson,
      now,
      limit: Math.max(1, Math.min(30, Number(limit) || 30)),
      completedQuestionIds: [...done],
      completedLearningKeys: [],
      dueOnly: Boolean(dueOnly),
    });
  }

  let vocabularyKeysCompleted = [];
  let candidateQuestions = questions;

  if (domain === "vocabulary") {
    if (dueOnly) {
      const currentTime = now || Date.now();
      const dueReviewKeys = new Set(
        w.reviews
          .filter((r) => isReviewDue(r, currentTime))
          .map((r) => r.learningKey)
      );

      candidateQuestions = questions.filter((q) => {
        if (q.domain !== "vocabulary") return false;
        const k = learningKeyFor(q);
        const sId = questionSetIdOf(q);
        return dueReviewKeys.has(k) && (completedKeysBySet.get(sId)?.has(k) || w.reviews.some((r) => r.learningKey === k));
      });
      vocabularyKeysCompleted = [...new Set(candidateQuestions.map(learningKeyFor))];
    } else {
      const keySets = new Map();
      for (const q of questions) {
        if (q.domain === "vocabulary") {
          const k = learningKeyFor(q);
          if (!keySets.has(k)) keySets.set(k, new Set());
          keySets.get(k).add(questionSetIdOf(q));
        }
      }
      const fullyCompletedKeys = new Set();
      for (const [k, sIds] of keySets) {
        const allDone = [...sIds].every((sId) => completedKeysBySet.get(sId)?.has(k));
        if (allDone) fullyCompletedKeys.add(k);
      }
      vocabularyKeysCompleted = [...fullyCompletedKeys];

      candidateQuestions = questions.filter((q) => {
        if (q.domain !== "vocabulary") return true;
        const k = learningKeyFor(q);
        if (fullyCompletedKeys.has(k)) return true;
        const sId = questionSetIdOf(q);
        return !completedKeysBySet.get(sId)?.has(k);
      });
    }
  }

  return selectQuestions(candidateQuestions, w.reviews, {
    setId: null, domain, level, topic, grade, type, now, limit: Math.max(1, Math.min(30, Number(limit) || 30)),
    completedQuestionIds: [...done], completedLearningKeys: vocabularyKeysCompleted,
    dueOnly: Boolean(dueOnly),
  });
}

function validSession(s, w) {
  if (!isPlainObject(s) || typeof s.id !== "string" || !s.id ||
      !Array.isArray(s.queue) || !s.queue.length ||
      !Number.isInteger(s.done) || s.done < 0 || !Number.isInteger(s.target) || s.target < 1 ||
      s.done + s.queue.length !== s.target || !Number.isInteger(s.step) || s.step < 0 ||
      !Array.isArray(s.log) || !validTimestamp(s.startedAt) || new Set(s.queue).size !== s.queue.length) return false;

  const purpose = s.purpose || "study";
  if (!["study", "review"].includes(purpose)) return false;

  const validSets = new Set(w.imports.map((set) => set?.id));

  let questions;
  if (purpose === "review") {
    if (s.mode !== "review" || s.target > 20) return false;
    if (!Array.isArray(s.setIds) || !s.setIds.length || !s.setIds.every((id) => validSets.has(id))) return false;
    if (typeof s.setId !== "string" || !validSets.has(s.setId)) return false;
    questions = new Map(
      w.questions
        .filter((q) => validSets.has(questionSetIdOf(q)) && q?.active !== false)
        .map((q) => [q.id, q])
    );
  } else {
    if (typeof s.setId !== "string" || !s.setId || !validSets.has(s.setId)) return false;
    if (!MODES.includes(s.mode) || s.target > 30) return false;
    const domain = domainForMode(s.mode);
    if (s.setIds != null) {
      if (!Array.isArray(s.setIds) || !s.setIds.length || !s.setIds.every((id) => validSets.has(id))) return false;
      if (!s.setIds.includes(s.setId)) return false;
      const targetSetIds = new Set(s.setIds);
      questions = new Map(
        w.questions
          .filter((q) => targetSetIds.has(questionSetIdOf(q)) && q?.active !== false && q?.domain === domain)
          .map((q) => [q.id, q])
      );
    } else {
      questions = new Map(
        w.questions
          .filter((q) => questionSetIdOf(q) === s.setId && q?.active !== false && q?.domain === domain)
          .map((q) => [q.id, q])
      );
    }
    const isJapanese = [...questions.values()].some((q) => q.subject === "japanese");
    if (isJapanese && s.mode === "flashcards") return false;
  }

  if (!s.queue.every((id) => typeof id === "string" && questions.has(id))) return false;
  if (!s.log.every((entry) => {
    if (!isPlainObject(entry) || typeof entry.questionId !== "string" || !questions.has(entry.questionId) ||
        typeof entry.correct !== "boolean" || !isStoredAnswer(entry.answer)) return false;
    const q = questions.get(entry.questionId);
    if (q.type === "true_false" && (!Array.isArray(entry.answer) || entry.answer.length !== 4 || !entry.answer.every((item) => item === "true" || item === "false"))) return false;
    if (q.type === "short_answer" && (typeof entry.answer !== "string" || !entry.answer.trim())) return false;
    const mode = s.mode;
    const expectedCorrect = mode === "flashcards"
      ? (typeof entry.answer === "boolean" ? entry.answer : entry.answer === "Đã nhớ")
      : evaluateAnswer(q.answer, entry.answer, q.type, {
          caseSensitive: q.tags?.includes("case-sensitive"),
          options: q.options,
          acceptedOrders: q.acceptedOrders ?? q.accepted_orders,
          starPosition: q.starPosition ?? q.star_position,
        });
    if (entry.correct !== expectedCorrect) return false;
    return true;
  })) return false;
  if (s.step !== s.log.length - (s.result ? 1 : 0)) return false;

  const loggedIds = new Set(s.log.map((entry) => entry.questionId));
  const queuedIds = new Set(s.queue);
  if (new Set([...loggedIds, ...queuedIds]).size !== s.target ||
      [...loggedIds].filter((id) => !queuedIds.has(id)).length !== s.done) return false;

  if (s.filters != null && (!isPlainObject(s.filters) ||
      (s.filters.level != null && typeof s.filters.level !== "string") ||
      (s.filters.topic != null && typeof s.filters.topic !== "string") ||
      (s.filters.grade != null && typeof s.filters.grade !== "string") ||
      (s.filters.chapter != null && typeof s.filters.chapter !== "string" && typeof s.filters.chapter !== "number") ||
      (s.filters.lesson != null && typeof s.filters.lesson !== "string" && typeof s.filters.lesson !== "number") ||
      (s.filters.dueOnly != null && typeof s.filters.dueOnly !== "boolean") ||
      (s.filters.type != null && (typeof s.filters.type !== "string" || (!ALL_QUESTION_TYPES.includes(s.filters.type) && s.filters.type !== "all"))) ||
      (s.filters.limit != null && (!Number.isInteger(s.filters.limit) || s.filters.limit < 1 || s.filters.limit > 30)))) return false;
  if (s.result == null) return validDraft(s.draft);
  if (!isPlainObject(s.result) || typeof s.result.correct !== "boolean" ||
      typeof s.result.expected !== "string" || !isStoredAnswer(s.result.received) ||
      (s.result.dueAt != null && !validTimestamp(s.result.dueAt)) || !validDraft(s.result.draft)) return false;
  const current = s.queue[0];
  const currentQ = questions.get(current);
  if (currentQ?.type === "true_false" && (!Array.isArray(s.result.received) || s.result.received.length !== 4 || !s.result.received.every((item) => item === "true" || item === "false"))) return false;
  if (currentQ?.type === "short_answer" && (typeof s.result.received !== "string" || !s.result.received.trim())) return false;
  if (currentQ) {
    const resultMode = s.mode;
    const expectedResultCorrect = resultMode === "flashcards"
      ? (typeof s.result.received === "boolean" ? s.result.received : s.result.received === "Đã nhớ")
      : evaluateAnswer(currentQ.answer, s.result.received, currentQ.type, {
          caseSensitive: currentQ.tags?.includes("case-sensitive"),
          options: currentQ.options,
          acceptedOrders: currentQ.acceptedOrders ?? currentQ.accepted_orders,
          starPosition: currentQ.starPosition ?? currentQ.star_position,
        });
    if (s.result.correct !== expectedResultCorrect) return false;
  }
  const latest = s.log.at(-1);
  return Boolean(latest && latest.questionId === current && latest.correct === s.result.correct &&
    s.result.expected === displayAnswer(questions.get(current).answer, questions.get(current)));
}

function validSummary(summary, w) {
  if (summary == null) return true;
  if (!isPlainObject(summary) || !Number.isInteger(summary.total) || summary.total < 1 ||
      !Number.isInteger(summary.correct) || summary.correct < 0 || summary.correct > summary.total ||
      !Number.isInteger(summary.repeats) || summary.repeats < 0 || !Array.isArray(summary.results) ||
      summary.results.length !== summary.total || !Number.isFinite(summary.durationMs) || summary.durationMs < 0) return false;

  const purpose = summary.purpose || "study";
  if (!["study", "review"].includes(purpose)) return false;

  const validSets = new Set(w.imports.map((set) => set?.id));

  let questions;
  if (purpose === "review") {
    if (summary.mode !== "review" || summary.total > 20 || summary.repeats !== 0) return false;
    if (!Array.isArray(summary.setIds) || !summary.setIds.length || !summary.setIds.every((id) => validSets.has(id))) return false;
    if (typeof summary.setId !== "string" || !validSets.has(summary.setId)) return false;
    questions = new Map(
      w.questions
        .filter((q) => validSets.has(questionSetIdOf(q)))
        .map((q) => [q.id, q])
    );
  } else {
    if (typeof summary.setId !== "string" || !summary.setId || !validSets.has(summary.setId)) return false;
    if (!MODES.includes(summary.mode) || summary.total > 30) return false;
    const domain = domainForMode(summary.mode);
    if (summary.setIds != null) {
      if (!Array.isArray(summary.setIds) || !summary.setIds.length || !summary.setIds.every((id) => validSets.has(id))) return false;
      if (!summary.setIds.includes(summary.setId)) return false;
      const targetSetIds = new Set(summary.setIds);
      questions = new Map(
        w.questions
          .filter((q) => targetSetIds.has(questionSetIdOf(q)) && q?.domain === domain)
          .map((q) => [q.id, q])
      );
    } else {
      questions = new Map(
        w.questions
          .filter((q) => questionSetIdOf(q) === summary.setId && q?.domain === domain)
          .map((q) => [q.id, q])
      );
    }
    const isJapanese = [...questions.values()].some((q) => q.subject === "japanese");
    if (isJapanese && summary.mode === "flashcards") return false;
  }

  if (summary.filters != null && (!isPlainObject(summary.filters) ||
      (summary.filters.level != null && typeof summary.filters.level !== "string") ||
      (summary.filters.topic != null && typeof summary.filters.topic !== "string") ||
      (summary.filters.grade != null && typeof summary.filters.grade !== "string") ||
      (summary.filters.chapter != null && typeof summary.filters.chapter !== "string" && typeof summary.filters.chapter !== "number") ||
      (summary.filters.lesson != null && typeof summary.filters.lesson !== "string" && typeof summary.filters.lesson !== "number") ||
      (summary.filters.dueOnly != null && typeof summary.filters.dueOnly !== "boolean") ||
      (summary.filters.type != null && (typeof summary.filters.type !== "string" || (!ALL_QUESTION_TYPES.includes(summary.filters.type) && summary.filters.type !== "all"))) ||
      (summary.filters.limit != null && (!Number.isInteger(summary.filters.limit) || summary.filters.limit < 1 || summary.filters.limit > 30)))) return false;

  if (!summary.results.every((entry) => {
    if (!isPlainObject(entry) || typeof entry.questionId !== "string" || !questions.has(entry.questionId) ||
        typeof entry.correct !== "boolean" || !isStoredAnswer(entry.answer)) return false;
    const q = questions.get(entry.questionId);
    if (q.type === "true_false" && (!Array.isArray(entry.answer) || entry.answer.length !== 4 || !entry.answer.every((item) => item === "true" || item === "false"))) return false;
    if (q.type === "short_answer" && (typeof entry.answer !== "string" || !entry.answer.trim())) return false;
    const mode = summary.mode;
    const expectedCorrect = mode === "flashcards"
      ? (typeof entry.answer === "boolean" ? entry.answer : entry.answer === "Đã nhớ")
      : evaluateAnswer(q.answer, entry.answer, q.type, {
          caseSensitive: q.tags?.includes("case-sensitive"),
          options: q.options,
          acceptedOrders: q.acceptedOrders ?? q.accepted_orders,
          starPosition: q.starPosition ?? q.star_position,
        });
    if (entry.correct !== expectedCorrect) return false;
    return true;
  })) return false;
  return new Set(summary.results.map((entry) => entry.questionId)).size === summary.results.length &&
    summary.correct === summary.results.filter((entry) => entry.correct).length;
}

function applyJapaneseSrs(w, learningKey, correct, q, now = Date.now()) {
  const index = w.reviews.findIndex((r) => r.learningKey === learningKey);
  const previous = index !== -1 ? w.reviews[index] : null;

  if (previous) {
    if (correct) {
      if (!isReviewDue(previous, now)) {
        const updated = {
          ...previous,
          lastReviewedAt: now,
          updatedAt: now,
        };
        w.reviews[index] = updated;
        return updated;
      }
    } else {
      if (previous.intervalDays === 0 && previous.dueAt > now) {
        const updated = {
          ...previous,
          lastReviewedAt: now,
          updatedAt: now,
        };
        w.reviews[index] = updated;
        return updated;
      }
    }
  }

  const reviewUpdate = nextReview(previous, correct, now);
  const review = {
    ...reviewUpdate,
    learningKey,
    lastQuestionId: q?.id,
    lastSetId: q ? questionSetIdOf(q) : undefined,
    firstCompletedAt: previous?.firstCompletedAt ?? (correct ? now : undefined),
  };

  if (index === -1) {
    w.reviews.push(review);
  } else {
    w.reviews[index] = review;
  }
  return review;
}

function handleJapaneseSrsSubmit(w, s, q, received, correct, isRetry) {
  const now = Date.now();
  addAttempt(w, q, received, correct, {
    id: `${s.id}:${s.step}`,
    mode: s.mode,
    purpose: s.purpose || "study",
    isRetry,
    dueOnly: Boolean(s.filters?.dueOnly),
  });

  const key = learningKeyFor(q);
  if (!key) return null;

  s.firstAnswers ??= {};
  s.keyEvaluated ??= {};

  w.srsEvents ??= [];
  const eventId = `${s.id}:${key}`;
  let srsEvent = w.srsEvents.find((e) => e.id === eventId);
  const targetQIds = s.keyQuestions?.[key] ?? [q.id];
  if (!srsEvent) {
    srsEvent = {
      id: eventId,
      sessionId: s.id,
      learningKey: key,
      questionIds: targetQIds,
      firstAnswers: {},
      applied: false,
      appliedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    w.srsEvents.push(srsEvent);
  }

  if (!isRetry && s.firstAnswers[q.id] === undefined) {
    s.firstAnswers[q.id] = correct;
  }
  srsEvent.firstAnswers[q.id] = s.firstAnswers[q.id];
  srsEvent.updatedAt = now;

  const allAnswered = targetQIds.every((id) => s.firstAnswers[id] !== undefined);
  if (allAnswered && !s.keyEvaluated[key]) {
    const allCorrect = targetQIds.every((id) => s.firstAnswers[id] === true);
    const rev = applyJapaneseSrs(w, key, allCorrect, q, now);
    s.keyEvaluated[key] = true;
    srsEvent.applied = true;
    srsEvent.appliedAt = now;
    return rev;
  }

  return w.reviews.find((r) => r.learningKey === key) ?? null;
}

function finalizeSessionSrsEvents(w, s) {
  if (!s || s.mode !== "vocabulary" || !s.keyQuestions) return;
  const now = Date.now();
  s.firstAnswers ??= {};
  s.keyEvaluated ??= {};
  w.srsEvents ??= [];
  for (const [key, qIds] of Object.entries(s.keyQuestions)) {
    if (!s.keyEvaluated[key]) {
      const answeredIds = qIds.filter((id) => s.firstAnswers[id] !== undefined);
      if (answeredIds.length > 0) {
        const allCorrect = answeredIds.every((id) => s.firstAnswers[id] === true);
        const q = w.questions.find((item) => item.id === answeredIds[0]);
        applyJapaneseSrs(w, key, allCorrect, q, now);
        s.keyEvaluated[key] = true;

        const eventId = `${s.id}:${key}`;
        let srsEvent = w.srsEvents.find((e) => e.id === eventId);
        if (!srsEvent) {
          srsEvent = {
            id: eventId,
            sessionId: s.id,
            learningKey: key,
            questionIds: qIds,
            firstAnswers: { ...s.firstAnswers },
            applied: true,
            appliedAt: now,
            createdAt: now,
            updatedAt: now,
          };
          w.srsEvents.push(srsEvent);
        } else {
          srsEvent.applied = true;
          srsEvent.appliedAt = now;
          srsEvent.updatedAt = now;
        }
      }
    }
  }
}

function addAttempt(w, q, answer, correct, extra = {}) {
  const now = Date.now(), attemptId = extra.id || newId();
  if (w.attempts.some((a) => a.id === attemptId)) return null;
  const purpose = extra.purpose === "review" ? "review" : "study";
  const isJapanese = q.subject === "japanese";
  const isRetry = Boolean(extra.isRetry);
  const origin = extra.origin || (
    isJapanese
      ? (purpose === "review"
          ? "ja_mistakes"
          : (extra.dueOnly
              ? "ja_srs"
              : (isRetry ? "ja_retry" : "ja_unseen")))
      : undefined
  );
  w.attempts.push({ id: attemptId, questionId: q.id, originalQuestionId: q.originalId || q.id,
    setId: questionSetIdOf(q), answer, correct, grade: correct ? 4 : 1, attemptedAt: now, mode: extra.mode || q.domain, purpose,
    ...(origin ? { origin } : {}), ...(isRetry ? { isRetry: true } : {}) });
  if (purpose === "review") return null;
  if (q.domain !== "vocabulary") return null;
  if (isJapanese) return null;
  const learningKey = learningKeyFor(q);
  const index = w.reviews.findIndex((r) => r.learningKey === learningKey);
  const previous = w.reviews[index];
  const review = { ...nextReview(previous, correct, now), learningKey, lastQuestionId: q.id,
    lastSetId: questionSetIdOf(q), firstCompletedAt: previous?.firstCompletedAt ?? (correct ? now : undefined) };
  if (index === -1) w.reviews.push(review); else w.reviews[index] = review;
  return review;
}
function archive(w) { if (hasData(w)) w.recovery = { savedAt: Date.now(), data: dataOnly(w) }; }

export function validateBackup(value) {
  const s = value?.snapshot ?? value?.data ?? value;
  if (!s || !PARTS.every((part) => Array.isArray(s[part]))) fail("File không phải bản sao lưu của NẮM English.");
  if (s.questions.length > 50_000 || s.attempts.length > 500_000) fail("Bản sao lưu quá lớn.");
  const ids = new Set(), sets = new Map(), questions = [], questionsById = new Map();
  for (const sourceSet of s.imports) {
    const id = sourceSet?.setId || sourceSet?.id;
    if (!sourceSet || typeof sourceSet.id !== "string" || !sourceSet.id ||
        (sourceSet.setId != null && (typeof sourceSet.setId !== "string" || sourceSet.setId !== sourceSet.id)) ||
        typeof id !== "string" || !id || id.length > 200 || sets.has(id) ||
        (sourceSet.importedAt != null && !validTimestamp(sourceSet.importedAt))) {
      fail("Bộ bài trong sao lưu bị lỗi hoặc trùng ID.");
    }
    const declaredSubject = sourceSet.subject == null || sourceSet.subject === ""
      ? null
      : String(sourceSet.subject).trim().toLowerCase();
    if (declaredSubject && !["english", "chemistry", "physics", "biology", "history", "geography", "japanese"].includes(declaredSubject)) {
      fail("Môn học của bộ trong sao lưu không hợp lệ.");
    }
    sets.set(id, {
      id,
      setId: id,
      name: String(sourceSet.name || "Bộ bài cũ").trim().slice(0, 120) || "Bộ bài cũ",
      filename: String(sourceSet.filename || "bo-bai.csv").slice(0, 200),
      importedAt: sourceSet.importedAt ?? Date.now(),
      subject: declaredSubject,
      count: 0,
    });
  }
  for (const q of s.questions) {
    if (!q || typeof q.id !== "string" || !q.id || q.id.length > 300 || ids.has(q.id)) fail("Câu hỏi trong sao lưu bị lỗi hoặc trùng ID.");
    ids.add(q.id);
    const set = sets.get(q.setId);
    if (!set) fail("Một câu hỏi không thuộc bộ nào trong sao lưu.");
    if (!["domain", "type", "topic", "prompt", "explanation"].every((field) => typeof q[field] === "string") ||
        !Array.isArray(q.options) || (q.tags != null && !Array.isArray(q.tags))) fail("Nội dung câu hỏi trong sao lưu không hợp lệ.");
    let preview;
    try { preview = buildCsvPreview(questionsToCsv([{ ...q, type: q.type.toLowerCase(), id: "backup-check", originalId: "backup-check" }])); }
    catch { fail("Đáp án hoặc lựa chọn trong sao lưu không hợp lệ."); }
    if (preview.errors.length) fail(`Sao lưu có câu không hợp lệ: ${preview.errors[0]}`);
    const canonical = preview.rows[0];
    if (set.subject && set.subject !== canonical.subject) fail("Một bộ trong sao lưu đang trộn nhiều môn.");
    set.subject ??= canonical.subject;
    const originalId = q.originalId ?? q.id;
    if (typeof originalId !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(originalId)) fail("ID gốc của câu hỏi trong sao lưu không hợp lệ.");
    const question = {
      ...canonical,
      id: q.id,
      originalId,
      setId: q.setId,
      position: set.count,
      importedAt: set.importedAt,
      active: q.active !== false,
    };
    set.count += 1;
    questions.push(question);
    questionsById.set(question.id, question);
  }

  const attemptIds = new Set(), attempts = [];
  for (const attempt of s.attempts) {
    const question = questionsById.get(attempt?.questionId);
    const answer = attempt?.answer ?? "";
    if (!attempt || !["string", "number"].includes(typeof attempt.id) || attempt.id === "" ||
        (typeof attempt.id === "number" && !Number.isFinite(attempt.id)) || attemptIds.has(attempt.id) || !question ||
        typeof attempt.correct !== "boolean" || !validTimestamp(attempt.attemptedAt) || !isStoredAnswer(answer) ||
        (attempt.purpose != null && !["study", "review"].includes(attempt.purpose))) {
      fail("Lịch sử trong sao lưu không hợp lệ.");
    }
    if (question.type === "true_false" && (!Array.isArray(answer) || answer.length !== 4 || !answer.every((item) => item === "true" || item === "false"))) {
      fail("Lịch sử trong sao lưu không hợp lệ: câu Đúng/Sai phải có đủ 4 đáp án true hoặc false.");
    }
    if (question.type === "short_answer" && (typeof answer !== "string" || !answer.trim())) {
      fail("Lịch sử trong sao lưu không hợp lệ: câu trả lời ngắn không được để trống.");
    }
    const mode = attempt.mode ?? question.domain;
    const isReview = attempt.purpose === "review" || mode === "review";
    const isJapanese = question.subject === "japanese";
    let allowedMode = false;
    if (isJapanese) {
      if (mode === "flashcards") {
        fail("Lịch sử trong sao lưu không hợp lệ: Tiếng Nhật không có flashcards.");
      }
      allowedMode = isReview
        ? (mode === "review" || mode === question.domain)
        : (mode === question.domain);
    } else {
      allowedMode = isReview
        ? (mode === "review" || mode === question.domain || (question.domain === "vocabulary" && ["vocabulary", "flashcards"].includes(mode)))
        : (question.domain === "vocabulary"
          ? ["vocabulary", "flashcards"].includes(mode)
          : mode === question.domain);
    }
    if (!allowedMode || (attempt.setId != null && attempt.setId !== question.setId)) fail("Lịch sử trong sao lưu không hợp lệ.");

    const expectedCorrect = mode === "flashcards"
      ? (typeof answer === "boolean" ? answer : answer === "Đã nhớ")
      : evaluateAnswer(question.answer, answer, question.type, {
          caseSensitive: question.tags?.includes("case-sensitive"),
          options: question.options,
          acceptedOrders: question.acceptedOrders ?? question.accepted_orders,
          starPosition: question.starPosition ?? question.star_position,
        });
    if (mode === "flashcards" && typeof answer !== "boolean" && answer !== "Đã nhớ" && answer !== "Chưa nhớ") {
      fail("Lịch sử trong sao lưu không hợp lệ.");
    }
    if (attempt.correct !== expectedCorrect) {
      fail("Lịch sử trong sao lưu không hợp lệ: kết quả đúng/sai không khớp với đáp án.");
    }
    attemptIds.add(attempt.id);
    attempts.push({
      ...attempt,
      questionId: question.id,
      originalQuestionId: question.originalId,
      setId: question.setId,
      answer,
      correct: attempt.correct,
      grade: attempt.correct ? 4 : 1,
      attemptedAt: attempt.attemptedAt,
      mode,
      purpose: isReview ? "review" : "study",
      ...(attempt.origin ? { origin: attempt.origin } : {}),
    });
  }

  const reviewKeys = new Set(), reviews = [];
  for (const review of s.reviews) {
    if (!review || typeof review.learningKey !== "string" || !review.learningKey || reviewKeys.has(review.learningKey) ||
        !validTimestamp(review.dueAt) || !Number.isFinite(review.ease) || review.ease < 1.3 || review.ease > 3 ||
        !Number.isInteger(review.repetitions) || review.repetitions < 0 || !Number.isFinite(review.intervalDays) || review.intervalDays < 0 ||
        (review.firstCompletedAt != null && !validTimestamp(review.firstCompletedAt))) fail("Lịch ôn trong sao lưu không hợp lệ.");
    reviewKeys.add(review.learningKey);
    reviews.push({ ...review });
  }

  const imports = [...sets.values()].map((set) => ({
    id: set.id,
    setId: set.setId,
    name: set.name,
    filename: set.filename,
    importedAt: set.importedAt,
    subject: set.subject || "english",
    count: set.count,
  }));
  const result = { questions, reviews, attempts, imports };
  if (s.srsEvents !== undefined) {
    if (!Array.isArray(s.srsEvents) || s.srsEvents.length > 5000) {
      fail("Danh sách sự kiện SRS trong sao lưu không hợp lệ.");
    }
    const eventIds = new Set();
    result.srsEvents = [];
    for (const event of s.srsEvents) {
      if (!isPlainObject(event)) fail("Sự kiện SRS trong sao lưu không hợp lệ.");
      if (typeof event.id !== "string" || !event.id || event.id.length > 300 || eventIds.has(event.id)) {
        fail(`Sự kiện SRS (${event?.id || "không có ID"}) bị lỗi hoặc trùng ID.`);
      }
      eventIds.add(event.id);
      if (typeof event.sessionId !== "string" || !event.sessionId || event.sessionId.length > 300) {
        fail(`Sự kiện SRS (${event.id}) có sessionId không hợp lệ.`);
      }
      if (typeof event.learningKey !== "string" || !event.learningKey || event.learningKey.length > 500) {
        fail(`Sự kiện SRS (${event.id}) có learningKey không hợp lệ.`);
      }
      if (typeof event.applied !== "boolean") {
        fail(`Sự kiện SRS (${event.id}) có trạng thái applied không phải boolean.`);
      }
      if (!validTimestamp(event.createdAt) || !validTimestamp(event.updatedAt)) {
        fail(`Sự kiện SRS (${event.id}) có mốc thời gian không hợp lệ.`);
      }
      if (event.applied) {
        if (!validTimestamp(event.appliedAt)) {
          fail(`Sự kiện SRS (${event.id}) đã áp dụng nhưng thiếu appliedAt hợp lệ.`);
        }
      } else {
        if (event.appliedAt != null) {
          fail(`Sự kiện SRS (${event.id}) chưa áp dụng nhưng có appliedAt.`);
        }
      }
      if (!Array.isArray(event.questionIds) || !event.questionIds.length) {
        fail(`Sự kiện SRS (${event.id}) không có danh sách câu hỏi hợp lệ.`);
      }
      const qIdSet = new Set();
      for (const qId of event.questionIds) {
        if (typeof qId !== "string" || !qId || qIdSet.has(qId)) {
          fail(`Sự kiện SRS (${event.id}) chứa ID câu hỏi không hợp lệ hoặc trùng lặp.`);
        }
        qIdSet.add(qId);
        const q = questionsById.get(qId);
        if (!q) {
          fail(`Sự kiện SRS (${event.id}) trỏ đến câu hỏi không tồn tại: ${qId}.`);
        }
        if (q.subject !== "japanese" || q.domain !== "vocabulary") {
          fail(`Sự kiện SRS (${event.id}) trỏ đến câu hỏi không phải từ vựng tiếng Nhật.`);
        }
        if (learningKeyFor(q) !== event.learningKey) {
          fail(`Sự kiện SRS (${event.id}) trỏ đến câu hỏi không khớp learningKey.`);
        }
      }
      if (!isPlainObject(event.firstAnswers)) {
        fail(`Sự kiện SRS (${event.id}) có firstAnswers không phải plain object.`);
      }
      for (const [ansQId, ansVal] of Object.entries(event.firstAnswers)) {
        if (!qIdSet.has(ansQId)) {
          fail(`Sự kiện SRS (${event.id}) chứa câu trả lời cho câu không nằm trong questionIds: ${ansQId}.`);
        }
        if (typeof ansVal !== "boolean") {
          fail(`Sự kiện SRS (${event.id}) có câu trả lời không phải boolean cho câu: ${ansQId}.`);
        }
      }
      result.srsEvents.push({
        id: event.id,
        sessionId: event.sessionId,
        learningKey: event.learningKey,
        questionIds: [...event.questionIds],
        firstAnswers: { ...event.firstAnswers },
        applied: event.applied,
        appliedAt: event.applied ? event.appliedAt : null,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      });
    }
  } else {
    result.srsEvents = [];
    result.warning = "Bản sao lưu phiên bản cũ (v2); kết quả phiên đang dở sẽ không được tự động suy đoán.";
  }

  const sessionSource = s.session || value?.session;
  if (sessionSource && sessionSource.mode === "vocabulary" && sessionSource.keyQuestions && sessionSource.firstAnswers) {
    const started = validTimestamp(sessionSource.startedAt) ? sessionSource.startedAt : Date.now();
    for (const [key, qIds] of Object.entries(sessionSource.keyQuestions)) {
      if (Array.isArray(qIds) && !result.srsEvents.some((e) => e.learningKey === key)) {
        const validQIds = qIds.filter((id) => {
          const q = questionsById.get(id);
          return q && q.subject === "japanese" && q.domain === "vocabulary" && learningKeyFor(q) === key;
        });
        if (validQIds.length > 0) {
          const answered = Object.fromEntries(
            validQIds.filter((id) => typeof sessionSource.firstAnswers[id] === "boolean")
                .map((id) => [id, sessionSource.firstAnswers[id]])
          );
          if (Object.keys(answered).length > 0) {
            result.srsEvents.push({
              id: `${sessionSource.id || "recovered"}:${key}`,
              sessionId: sessionSource.id || "recovered",
              learningKey: key,
              questionIds: validQIds,
              firstAnswers: answered,
              applied: false,
              appliedAt: null,
              createdAt: started,
              updatedAt: started,
            });
          }
        }
      }
    }
  }

  if (value?.version === 2 && !result.warning) {
    result.warning = "Bản sao lưu phiên bản cũ (v2); kết quả phiên đang dở sẽ không được tự động suy đoán.";
  }
  return result;
}

class Repository {
  constructor(backend) { this.backend = backend; this.mode = backend.mode; this.channel = null; }
  snapshot() { return this.backend.run(); }
  async change(reducer) { const result = await this.backend.run(reducer); this.channel?.postMessage("changed"); return result; }
  subscribe(callback) {
    if (globalThis.BroadcastChannel) { this.channel = new BroadcastChannel(CHANNEL); this.channel.onmessage = callback; }
    this.listener = (event) => { if (event.key === LOCAL_KEY) callback(); };
    globalThis.addEventListener?.("storage", this.listener);
  }
  close() { this.channel?.close(); this.backend.close(); globalThis.removeEventListener?.("storage", this.listener); }
  importQuestions(rows, filename, name = "") {
    if (!Array.isArray(rows) || !rows.length || rows.length > 2000) fail("Mỗi bộ cần từ 1 đến 2.000 câu.");
    const checked = buildCsvPreview(questionsToCsv(rows));
    if (checked.errors.length) fail(checked.errors[0]);
    rows = checked.rows;
    return this.change((w) => {
      const base = (name || filename.replace(/\.csv$/i, "").replaceAll("_", " ")).trim().slice(0, 120) || "Bộ câu hỏi";
      let unique = base, suffix = 2;
      while (w.imports.some((set) => set.name === unique)) unique = `${base} (${suffix++})`;
      const key = `set-${newId()}`;
      const set = { id: key, setId: key, subject: rows[0].subject, name: unique, filename, count: rows.length, importedAt: Date.now() };
      const seen = new Set();
      const questions = rows.map((q, index) => {
        if (!q?.id || seen.has(q.id)) fail("ID câu hỏi bị thiếu hoặc trùng trong bộ.");
        seen.add(q.id);
        return { ...copy(q), id: `${key}:${index}`, originalId: q.originalId || q.id, setId: key, position: index, importedAt: set.importedAt };
      });
      w.questions.push(...questions); w.imports.push(set); w.selectedSetId = key;
      return set;
    });
  }
  selectSet(setId) { return this.change((w) => {
    if (!w.imports.some((set) => set.id === setId)) fail("Bộ bài đã bị xóa ở tab khác.");
    w.selectedSetId = setId;
  }); }
  renameSet(setId, name) {
    const trimmed = String(name).trim();
    if (!trimmed || trimmed.length > 120) fail("Tên bộ cần từ 1 đến 120 ký tự.");
    return this.change((w) => { const set = w.imports.find((item) => item.id === setId); if (!set) fail("Không tìm thấy bộ bài."); set.name = trimmed; });
  }
  deleteSet(setId) { return this.change((w) => {
    if (!w.imports.some((set) => set.id === setId)) fail("Không tìm thấy bộ bài.");
    archive(w);
    const removed = new Set(w.questions.filter((q) => q.setId === setId).map((q) => q.id));
    w.questions = w.questions.filter((q) => q.setId !== setId);
    w.attempts = w.attempts.filter((a) => !removed.has(a.questionId));
    w.imports = w.imports.filter((set) => set.id !== setId);
    const keys = new Set(w.questions.filter((q) => q.domain === "vocabulary").map(learningKeyFor));
    w.reviews = w.reviews.filter((r) => keys.has(r.learningKey));
    if (w.srsEvents?.length) {
      w.srsEvents = w.srsEvents.filter((e) => e.questionIds.some((id) => !removed.has(id)));
      for (const e of w.srsEvents) {
        const before = e.questionIds.length;
        e.questionIds = e.questionIds.filter((id) => !removed.has(id));
        for (const id of Object.keys(e.firstAnswers)) {
          if (removed.has(id)) delete e.firstAnswers[id];
        }
      }
    }
    if (w.session && (w.session.setId === setId || w.session.setIds?.includes(setId))) {
      if (w.session.mode === "vocabulary" && w.session.keyQuestions && w.session.firstAnswers) {
        for (const [key, qIds] of Object.entries(w.session.keyQuestions)) {
          const remainingQIds = qIds.filter((id) => !removed.has(id));
          if (remainingQIds.length > 0) {
            w.session.keyQuestions[key] = remainingQIds;
          } else {
            delete w.session.keyQuestions[key];
          }
        }
        for (const id of Object.keys(w.session.firstAnswers)) {
          if (removed.has(id)) delete w.session.firstAnswers[id];
        }
        finalizeSessionSrsEvents(w, w.session);
      }
      w.session = null;
    }
    if (w.summary && (w.summary.setId === setId || w.summary.setIds?.includes(setId))) w.summary = null;
    if (w.selectedSetId === setId) w.selectedSetId = w.imports[0]?.id ?? null;
    w.summary = null;
  }); }
  clearAll() { return this.change((w) => { archive(w); Object.assign(w, emptyData(), { session: null, summary: null, selectedSetId: null, srsEvents: [] }); }); }
  replaceAll(value) {
    const data = validateBackup(value);
    return this.change((w) => {
      archive(w);
      if (Array.isArray(data.srsEvents)) {
        const pending = data.srsEvents
          .filter((event) => !event.applied && event.firstAnswers)
          .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

        // Dedup: chỉ gộp trong cùng phiên (sessionId + learningKey), giữ event mới nhất trong phiên đó
        const bestBySessionAndKey = new Map();
        for (const event of pending) {
          const comboKey = `${event.sessionId}:${event.learningKey}`;
          const existing = bestBySessionAndKey.get(comboKey);
          if (!existing || (event.createdAt || 0) > (existing.createdAt || 0)) {
            bestBySessionAndKey.set(comboKey, event);
          }
        }
        const uniquePending = [];
        for (const event of pending) {
          const comboKey = `${event.sessionId}:${event.learningKey}`;
          if (bestBySessionAndKey.get(comboKey) === event) {
            uniquePending.push(event);
          } else {
            event.applied = true;
            event.appliedAt = event.createdAt || Date.now();
          }
        }

        for (const event of uniquePending) {
          const answeredIds = Object.keys(event.firstAnswers);
          if (answeredIds.length > 0) {
            const allCorrect = answeredIds.every((id) => event.firstAnswers[id] === true);
            const q = data.questions.find((item) => (item.learningKey || learningKeyFor(item)) === event.learningKey);
            if (q) {
              const ts = validTimestamp(event.updatedAt) ? event.updatedAt : (validTimestamp(event.createdAt) ? event.createdAt : Date.now());
              applyJapaneseSrs(data, event.learningKey, allCorrect, q, ts);
              event.applied = true;
              event.appliedAt = ts;
            }
          }
        }
      }
      Object.assign(w, data, { session: null, summary: null, selectedSetId: data.imports[0]?.id ?? null, srsEvents: data.srsEvents ?? [] });
      return { warning: data.warning ?? null };
    });
  }
  startMistakesSession({ limit = 20 } = {}) { return this.change((w) => {
    if (validSession(w.session, w)) fail("Hãy tiếp tục hoặc kết thúc lượt đang học trước.");
    const validSets = new Set(w.imports.map((set) => set.id));
    const eligible = mistakeQuestions(w.questions, w.attempts)
      .filter((q) => validSets.has(questionSetIdOf(q)));
    const cappedLimit = Math.max(1, Math.min(20, Number(limit) || 20));
    const questions = eligible.slice(0, cappedLimit);
    if (!questions.length) fail("Chưa có câu sai nào cần ôn tập.");
    const setIds = [...new Set(questions.map((q) => questionSetIdOf(q)))];
    w.session = {
      id: newId(),
      setId: setIds[0],
      setIds,
      mode: "review",
      purpose: "review",
      filters: { limit: questions.length },
      queue: questions.map((q) => q.id),
      target: questions.length,
      done: 0,
      step: 0,
      result: null,
      draft: null,
      log: [],
      startedAt: Date.now(),
    };
    w.summary = null;
    return copy(w.session);
  }); }
  startSession(filters) { return this.change((w) => {
    if (validSession(w.session, w)) fail("Hãy tiếp tục hoặc kết thúc lượt đang học trước.");
    if (filters?.purpose === "review" || filters?.mode === "review") {
      const validSets = new Set(w.imports.map((set) => set.id));
      const eligible = mistakeQuestions(w.questions, w.attempts)
        .filter((q) => validSets.has(questionSetIdOf(q)));
      const cappedLimit = Math.max(1, Math.min(20, Number(filters?.limit) || 20));
      const questions = eligible.slice(0, cappedLimit);
      if (!questions.length) fail("Chưa có câu sai nào cần ôn tập.");
      const setIds = [...new Set(questions.map((q) => questionSetIdOf(q)))];
      w.session = {
        id: newId(),
        setId: setIds[0],
        setIds,
        mode: "review",
        purpose: "review",
        filters: { limit: questions.length },
        queue: questions.map((q) => q.id),
        target: questions.length,
        done: 0,
        step: 0,
        result: null,
        draft: null,
        log: [],
        startedAt: Date.now(),
      };
      w.summary = null;
      return copy(w.session);
    }
    const mode = filters?.mode;
    let setId = filters?.setId;
    const setIds = filters?.setIds;
    if (!MODES.includes(mode)) fail("Chế độ học không hợp lệ.");
    const isMixed = Array.isArray(setIds) && setIds.length > 0;
    const targetSetIds = isMixed ? [...new Set(setIds)] : (setId ? [setId] : []);
    if (!targetSetIds.length) fail("Cần chọn ít nhất một bộ bài.");
    for (const sId of targetSetIds) {
      if (typeof sId !== "string" || !w.imports.some((set) => set?.id === sId)) {
        fail("Bộ bài đã bị xóa ở tab khác.");
      }
    }
    const domain = domainForMode(mode);
    const sets = targetSetIds.map((sId) => w.imports.find((set) => set?.id === sId));
    if (sets.some((s) => s.subject === "japanese") && mode === "flashcards") {
      fail("Tiếng Nhật không hỗ trợ thẻ ghi nhớ (flashcards). Hãy học bằng bài tập.");
    }
    const firstSubject = sets[0].subject || "english";
    if (!sets.every((s) => (s.subject || "english") === firstSubject)) {
      fail(domain === "practice" ? "Chỉ có thể trộn các bộ bài cùng môn." : (firstSubject === "japanese" ? "Chỉ có thể trộn các bộ bài Tiếng Nhật." : "Chỉ có thể trộn các bộ bài Tiếng Anh."));
    }
    if (domain === "grammar" || domain === "vocabulary") {
      if (firstSubject !== "english" && firstSubject !== "japanese") {
        fail("Chỉ có thể trộn các bộ bài Tiếng Anh.");
      }
    } else if (domain === "kanji") {
      if (firstSubject !== "japanese") {
        fail("Chỉ có thể học Hán tự với bộ bài Tiếng Nhật.");
      }
    }
    const primarySetId = setId && targetSetIds.includes(setId) ? setId : targetSetIds[0];
    const sessionFilters = {
      level: typeof filters?.level === "string" ? filters.level : "all",
      topic: typeof filters?.topic === "string" ? filters.topic : "all",
      grade: typeof filters?.grade === "string" ? filters.grade : "all",
    };
    if (filters?.chapter != null && filters.chapter !== "" && filters.chapter !== "all") {
      sessionFilters.chapter = filters.chapter;
    }
    if (filters?.lesson != null && filters.lesson !== "" && filters.lesson !== "all") {
      sessionFilters.lesson = filters.lesson;
    }
    if (typeof filters?.type === "string" && ALL_QUESTION_TYPES.includes(filters.type)) {
      sessionFilters.type = filters.type;
    }
    if (Number.isInteger(filters?.limit) && [10, 20, 30].includes(filters.limit)) {
      sessionFilters.limit = filters.limit;
    }
    if (filters?.dueOnly) {
      sessionFilters.dueOnly = true;
    }
    const requestedLimit = Number.isInteger(filters?.limit) && filters.limit >= 1 ? Math.min(30, filters.limit) : 30;
    const questions = selection(w, {
      setId: isMixed && targetSetIds.length > 1 ? null : primarySetId,
      setIds: isMixed && targetSetIds.length > 1 ? targetSetIds : undefined,
      ...sessionFilters,
      domain,
      limit: requestedLimit,
      dueOnly: Boolean(filters?.dueOnly),
    });
    if (!questions.length) {
      if (filters?.dueOnly) fail("Không có từ vựng nào đến hạn ôn hôm nay.");
      fail("Đã hết câu phù hợp. Đổi bộ lọc hoặc quay lại khi có từ đến hạn.");
    }
    const keyQuestions = {};
    for (const q of questions) {
      if (q.subject === "japanese" && q.domain === "vocabulary") {
        const k = learningKeyFor(q);
        keyQuestions[k] ??= [];
        keyQuestions[k].push(q.id);
      }
    }
    w.session = {
      id: newId(),
      setId: primarySetId,
      setIds: isMixed && targetSetIds.length > 1 ? targetSetIds : undefined,
      mode,
      purpose: "study",
      filters: sessionFilters,
      queue: questions.map((q) => q.id),
      target: questions.length,
      done: 0,
      step: 0,
      result: null,
      draft: null,
      log: [],
      startedAt: Date.now(),
      keyQuestions,
      firstAnswers: {},
      keyEvaluated: {},
    };
    if (!isMixed || targetSetIds.length <= 1) {
      w.selectedSetId = primarySetId;
    }
    w.summary = null;
    return copy(w.session);
  }); }
  saveDraft(sessionId, step, draft) { return this.change((w) => {
    const s = w.session;
    if (s?.id === sessionId && s.step === step && !s.result) {
      if (!validDraft(draft)) fail("Bản nháp không hợp lệ.");
      s.draft = copy(draft);
    }
  }); }
  submit(sessionId, step, answer, draft = null) { return this.change((w) => {
    const s = w.session;
    if (!validSession(s, w) || s.id !== sessionId || s.step !== step) fail("Lượt học đã đổi ở tab khác. Hãy thử lại.");
    if (s.result) return copy(s.result);
    const q = w.questions.find((item) => item.id === s.queue[0]);
    if (!q) fail("Câu hỏi hiện tại không còn tồn tại. Hãy tải lại trang.");
    if (s.mode === "flashcards" && typeof answer !== "boolean") fail("Hãy chọn Đã nhớ hoặc Chưa nhớ.");
    if (s.mode !== "flashcards" && !isStoredAnswer(answer)) fail("Câu trả lời không hợp lệ.");
    if (q.type === "true_false" && (!Array.isArray(answer) || answer.length !== 4 || !answer.every((item) => item === "true" || item === "false"))) {
      fail("Câu trả lời Đúng/Sai không hợp lệ.");
    }
    if (q.type === "short_answer" && (typeof answer !== "string" || !answer.trim())) {
      fail("Câu trả lời ngắn không được để trống.");
    }
    if (!validDraft(draft)) fail("Bản nháp không hợp lệ.");
    const isJapanese = q.subject === "japanese";
    const correct = s.mode === "flashcards"
      ? answer
      : evaluateAnswer(q.answer, answer, q.type, {
          caseSensitive: q.tags?.includes("case-sensitive"),
          options: q.options,
          acceptedOrders: q.acceptedOrders ?? q.accepted_orders,
          starPosition: q.starPosition ?? q.star_position,
        });
    const received = s.mode === "flashcards" ? (answer ? "Đã nhớ" : "Chưa nhớ") : answer;
    let isRetry = false;
    let review = null;
    if (isJapanese) {
      isRetry = Boolean(s.firstAnswers && s.firstAnswers[q.id] !== undefined);
      if (s.mode === "vocabulary" && s.purpose !== "review") {
        review = handleJapaneseSrsSubmit(w, s, q, received, correct, isRetry);
      } else {
        addAttempt(w, q, received, correct, {
          id: `${s.id}:${step}`,
          mode: s.mode,
          purpose: s.purpose || "study",
          isRetry,
          dueOnly: Boolean(s.filters?.dueOnly),
        });
      }
    } else {
      review = addAttempt(w, q, received, correct, { id: `${s.id}:${step}`, mode: s.mode, purpose: s.purpose || "study" });
    }
    s.log.push({ questionId: q.id, correct, answer: received });
    s.result = { correct, received, expected: displayAnswer(q.answer, q), dueAt: review?.dueAt ?? null, draft: copy(draft), isRetry };
    s.draft = null;
    return copy(s.result);
  }); }
  advance(sessionId, step) { return this.change((w) => {
    const s = w.session;
    if (!validSession(s, w) || s.id !== sessionId || s.step !== step || !s.result) fail("Lượt học đã đổi. Hãy tải lại trạng thái.");
    const current = s.queue.shift();
    if (s.purpose !== "review" && ["vocabulary", "flashcards"].includes(s.mode) && !s.result.correct) s.queue.push(current); else s.done += 1;
    s.step += 1; s.result = null; s.draft = null;
    if (!s.queue.length) {
      finalizeSessionSrsEvents(w, s);
      const first = new Map();
      for (const a of s.log) if (!first.has(a.questionId)) first.set(a.questionId, a);
      w.summary = { setId: s.setId, setIds: s.setIds, mode: s.mode, purpose: s.purpose || "study", total: s.target, correct: [...first.values()].filter((a) => a.correct).length,
        repeats: s.log.length - first.size, results: [...first.values()], durationMs: Date.now() - s.startedAt,
        filters: copy(s.filters ?? { level: "all", topic: "all", grade: "all" }) };
      w.session = null;
    }
  }); }
  endSession(sessionId) { return this.change((w) => {
    if (!w.session || w.session.id !== sessionId) fail("Lượt học đã đổi ở tab khác. Hãy tải lại trạng thái.");
    finalizeSessionSrsEvents(w, w.session);
    w.session = null;
  }); }
  dismissSummary() { return this.change((w) => { w.summary = null; }); }
  async repairSession() {
    const w = await this.snapshot();
    const sessionIsValid = !w.session || validSession(w.session, w);
    const summaryIsValid = validSummary(w.summary, w);
    if (!sessionIsValid || !summaryIsValid || w.session && w.summary) {
      await this.change((latest) => {
        if (latest.session && !validSession(latest.session, latest)) latest.session = null;
        if (!validSummary(latest.summary, latest) || latest.session) latest.summary = null;
      });
    }
  }
  recordAttempt(q, answer, correct, extra = {}) { return this.change((w) => addAttempt(w, q, answer, correct, extra)); }
}

export async function createRepository() {
  let fallbackExists = false, backend;
  try { fallbackExists = Boolean(localStorage.getItem(LOCAL_KEY)); } catch { /* Vẫn thử IndexedDB nếu localStorage bị chặn. */ }
  if (!fallbackExists && "indexedDB" in globalThis) {
    try { backend = new IndexedBackend(await openDatabase()); }
    catch (error) {
      // Chỉ dùng localStorage khi IndexedDB thực sự không dùng được trên trình duyệt.
      // Lỗi mở/ghi kho có thể che mất dữ liệu IndexedDB hiện có, nên phải báo ra.
      if (!["SecurityError", "InvalidStateError", "NotSupportedError"].includes(error?.name)) throw storageError(error);
    }
  }
  backend ??= new LocalBackend();
  const repository = new Repository(backend);
  await repository.repairSession();
  return repository;
}
export async function readDashboard(repository, requestedSetId = null) {
  const snapshot = await repository.snapshot();
  const questionsBySet = new Map();
  snapshot.questions.forEach((question) => {
    const setId = questionSetIdOf(question);
    const items = questionsBySet.get(setId) ?? [];
    items.push(question);
    questionsBySet.set(setId, items);
  });
  const sets = snapshot.imports.map((set) => {
    const questions = questionsBySet.get(set.id) ?? [];
    return { ...set, subject: set.subject || questions[0]?.subject || "english", count: questions.length };
  });
  const selected = sets.find((set) => set.id === (requestedSetId || snapshot.selectedSetId)) ?? sets[0] ?? null;
  const questions = selected ? questionsBySet.get(selected.id) ?? [] : [];
  const ids = new Set(questions.map((q) => q.id));
  const attempts = snapshot.attempts.filter((a) => ids.has(a.questionId));
  const mistakes = mistakeQuestions(snapshot.questions, snapshot.attempts).filter((q) => snapshot.imports.some((s) => s.id === questionSetIdOf(q)));
  return { ...buildLibrary(questions, sets), sets, selectedSetId: selected?.id ?? null, snapshot, questions, attempts, mistakes,
    stats: buildStats(questions, snapshot.reviews, attempts, selected ? [selected] : []) };
}
export async function getSessionQuestions(repository, filters) { return selection(await repository.snapshot(), filters); }
export function exportBackup(snapshot) { return { app: "nam-english", version: 3, exportedAt: new Date().toISOString(), snapshot: dataOnly(snapshot) }; }
