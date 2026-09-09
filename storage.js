import { buildCsvPreview, buildLibrary, buildStats, displayAnswer, evaluateAnswer, learningKeyFor, nextReview, selectQuestions } from "./core.js";
import { questionsToCsv } from "./stats.js";

const DB_NAME = "nam-english-local";
const STORE = "workspace";
const LOCAL_KEY = "nam-english:workspace-v5";
const PARTS = ["questions", "reviews", "attempts", "imports"];
const CHANNEL = "nam-english-workspace";
const MODES = ["grammar", "practice", "vocabulary", "flashcards"];
const MAX_TIMESTAMP = 8.64e15;
const copy = (value) => structuredClone(value);
const newId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const fail = (message) => { throw new Error(message); };
export const questionSetIdOf = (q) => q?.setId || "legacy-v1";
const emptyData = () => ({ questions: [], reviews: [], attempts: [], imports: [] });
const fresh = () => ({ ...emptyData(), revision: 0, session: null, summary: null, selectedSetId: null, recovery: null });
const dataOnly = (w) => Object.fromEntries(PARTS.map((part) => [part, copy(w[part] ?? [])]));
const hasData = (w) => PARTS.some((part) => w?.[part]?.length);
const validTimestamp = (value) => Number.isFinite(value) && Math.abs(value) <= MAX_TIMESTAMP;
const domainForMode = (mode) => mode === "flashcards" ? "vocabulary" : mode;
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
    (draft.matches == null || isPlainObject(draft.matches) && Object.values(draft.matches).every((item) => typeof item === "string"));
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
function checkWorkspace(w) {
  if (!w || !PARTS.every((part) => Array.isArray(w[part]))) fail("Kho dữ liệu không hợp lệ. Hãy thử mở lại trang hoặc dùng bản sao lưu.");
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
function selection(w, { setId, domain, level = "all", topic = "all", grade = "all", limit = 30, now }) {
  const questions = setQuestions(w, setId);
  const byId = new Map(questions.map((q) => [q.id, q]));
  const done = new Set(), vocabulary = new Set();
  for (const attempt of w.attempts) {
    const q = byId.get(attempt.questionId);
    if (!q) continue;
    if (q.domain !== "vocabulary") done.add(q.id);
    else if (attempt.correct) vocabulary.add(learningKeyFor(q));
  }
  return selectQuestions(questions, w.reviews, {
    setId, domain, level, topic, grade, now, limit: Math.max(1, Math.min(30, Number(limit) || 30)),
    completedQuestionIds: [...done], completedLearningKeys: [...vocabulary],
  });
}

function validSession(s, w) {
  if (!isPlainObject(s) || typeof s.id !== "string" || !s.id || typeof s.setId !== "string" || !s.setId ||
      !Array.isArray(s.queue) || !s.queue.length || !MODES.includes(s.mode) ||
      !Number.isInteger(s.done) || s.done < 0 || !Number.isInteger(s.target) || s.target < 1 || s.target > 30 ||
      s.done + s.queue.length !== s.target || !Number.isInteger(s.step) || s.step < 0 ||
      !Array.isArray(s.log) || !validTimestamp(s.startedAt) || new Set(s.queue).size !== s.queue.length ||
      !w.imports.some((set) => set?.id === s.setId)) return false;

  const domain = domainForMode(s.mode);
  const questions = new Map(
    w.questions
      .filter((q) => questionSetIdOf(q) === s.setId && q?.active !== false && q?.domain === domain)
      .map((q) => [q.id, q]),
  );
  if (!s.queue.every((id) => typeof id === "string" && questions.has(id))) return false;
  if (!s.log.every((entry) => isPlainObject(entry) && typeof entry.questionId === "string" &&
      questions.has(entry.questionId) && typeof entry.correct === "boolean" && isStoredAnswer(entry.answer))) return false;
  if (s.step !== s.log.length - (s.result ? 1 : 0)) return false;

  const loggedIds = new Set(s.log.map((entry) => entry.questionId));
  const queuedIds = new Set(s.queue);
  if (new Set([...loggedIds, ...queuedIds]).size !== s.target ||
      [...loggedIds].filter((id) => !queuedIds.has(id)).length !== s.done) return false;

  if (s.filters != null && (!isPlainObject(s.filters) ||
      !["level", "topic", "grade"].every((key) => typeof s.filters[key] === "string"))) return false;
  if (s.result == null) return validDraft(s.draft);
  if (!isPlainObject(s.result) || typeof s.result.correct !== "boolean" ||
      typeof s.result.expected !== "string" || !isStoredAnswer(s.result.received) ||
      (s.result.dueAt != null && !validTimestamp(s.result.dueAt)) || !validDraft(s.result.draft)) return false;
  const latest = s.log.at(-1);
  const current = s.queue[0];
  return Boolean(latest && latest.questionId === current && latest.correct === s.result.correct &&
    s.result.expected === displayAnswer(questions.get(current).answer));
}

function validSummary(summary, w) {
  if (summary == null) return true;
  if (!isPlainObject(summary) || typeof summary.setId !== "string" || !summary.setId || !MODES.includes(summary.mode) ||
      !Number.isInteger(summary.total) || summary.total < 1 || summary.total > 30 ||
      !Number.isInteger(summary.correct) || summary.correct < 0 || summary.correct > summary.total ||
      !Number.isInteger(summary.repeats) || summary.repeats < 0 || !Array.isArray(summary.results) ||
      summary.results.length !== summary.total || !Number.isFinite(summary.durationMs) || summary.durationMs < 0 ||
      !w.imports.some((set) => set?.id === summary.setId)) return false;
  if (summary.filters != null && (!isPlainObject(summary.filters) ||
      !["level", "topic", "grade"].every((key) => typeof summary.filters[key] === "string"))) return false;
  const domain = domainForMode(summary.mode);
  const questions = new Map(
    w.questions
      .filter((q) => questionSetIdOf(q) === summary.setId && q?.domain === domain)
      .map((q) => [q.id, q]),
  );
  if (!summary.results.every((entry) => isPlainObject(entry) && typeof entry.questionId === "string" &&
      questions.has(entry.questionId) && typeof entry.correct === "boolean" && isStoredAnswer(entry.answer))) return false;
  return new Set(summary.results.map((entry) => entry.questionId)).size === summary.results.length &&
    summary.correct === summary.results.filter((entry) => entry.correct).length;
}

function addAttempt(w, q, answer, correct, extra = {}) {
  const now = Date.now(), attemptId = extra.id || newId();
  if (w.attempts.some((a) => a.id === attemptId)) return;
  w.attempts.push({ id: attemptId, questionId: q.id, originalQuestionId: q.originalId || q.id,
    setId: questionSetIdOf(q), answer, correct, grade: correct ? 4 : 1, attemptedAt: now, mode: extra.mode || q.domain });
  if (q.domain !== "vocabulary") return null;
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
    if (declaredSubject && !["english", "chemistry", "physics", "biology"].includes(declaredSubject)) {
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
        typeof attempt.correct !== "boolean" || !validTimestamp(attempt.attemptedAt) || !isStoredAnswer(answer)) {
      fail("Lịch sử trong sao lưu không hợp lệ.");
    }
    const mode = attempt.mode ?? question.domain;
    const allowedMode = question.domain === "vocabulary"
      ? ["vocabulary", "flashcards"].includes(mode)
      : mode === question.domain;
    if (!allowedMode || (attempt.setId != null && attempt.setId !== question.setId)) fail("Lịch sử trong sao lưu không hợp lệ.");
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
  return { questions, reviews, attempts, imports };
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
    const removed = new Set(setQuestions(w, setId).map((q) => q.id));
    w.questions = w.questions.filter((q) => !removed.has(q.id));
    w.attempts = w.attempts.filter((a) => !removed.has(a.questionId));
    w.imports = w.imports.filter((set) => set.id !== setId);
    const keys = new Set(w.questions.filter((q) => q.domain === "vocabulary").map(learningKeyFor));
    w.reviews = w.reviews.filter((r) => keys.has(r.learningKey));
    if (w.session?.setId === setId) w.session = null;
    if (w.selectedSetId === setId) w.selectedSetId = w.imports[0]?.id ?? null;
    w.summary = null;
  }); }
  clearAll() { return this.change((w) => { archive(w); Object.assign(w, emptyData(), { session: null, summary: null, selectedSetId: null }); }); }
  replaceAll(value) {
    const data = validateBackup(value);
    return this.change((w) => { archive(w); Object.assign(w, data, { session: null, summary: null, selectedSetId: data.imports[0]?.id ?? null }); });
  }
  startSession(filters) { return this.change((w) => {
    if (validSession(w.session, w)) fail("Hãy tiếp tục hoặc kết thúc lượt đang học trước.");
    const mode = filters?.mode;
    const setId = filters?.setId;
    if (!MODES.includes(mode)) fail("Chế độ học không hợp lệ.");
    if (typeof setId !== "string" || !w.imports.some((set) => set?.id === setId)) fail("Bộ bài đã bị xóa ở tab khác.");
    const sessionFilters = {
      level: typeof filters?.level === "string" ? filters.level : "all",
      topic: typeof filters?.topic === "string" ? filters.topic : "all",
      grade: typeof filters?.grade === "string" ? filters.grade : "all",
    };
    const questions = selection(w, { setId, ...sessionFilters, domain: domainForMode(mode), limit: filters?.limit });
    if (!questions.length) fail("Đã hết câu phù hợp. Đổi bộ lọc hoặc quay lại khi có từ đến hạn.");
    w.session = { id: newId(), setId, mode, filters: sessionFilters, queue: questions.map((q) => q.id), target: questions.length,
      done: 0, step: 0, result: null, draft: null, log: [], startedAt: Date.now() };
    w.selectedSetId = setId; w.summary = null;
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
    if (s.mode === "flashcards" && typeof answer !== "boolean") fail("Hãy chọn Đã nhớ hoặc Chưa nhớ.");
    if (s.mode !== "flashcards" && !isStoredAnswer(answer)) fail("Câu trả lời không hợp lệ.");
    if (!validDraft(draft)) fail("Bản nháp không hợp lệ.");
    if (!q) fail("Câu hỏi hiện tại không còn tồn tại. Hãy tải lại trang.");
    const correct = s.mode === "flashcards" ? answer : evaluateAnswer(q.answer, answer, q.type, { caseSensitive: q.tags?.includes("case-sensitive") });
    const received = s.mode === "flashcards" ? (answer ? "Đã nhớ" : "Chưa nhớ") : answer;
    const review = addAttempt(w, q, received, correct, { id: `${s.id}:${step}`, mode: s.mode });
    s.log.push({ questionId: q.id, correct, answer: received });
    s.result = { correct, received, expected: displayAnswer(q.answer), dueAt: review?.dueAt ?? null, draft: copy(draft) };
    s.draft = null;
    return copy(s.result);
  }); }
  advance(sessionId, step) { return this.change((w) => {
    const s = w.session;
    if (!validSession(s, w) || s.id !== sessionId || s.step !== step || !s.result) fail("Lượt học đã đổi. Hãy tải lại trạng thái.");
    const current = s.queue.shift();
    if (["vocabulary", "flashcards"].includes(s.mode) && !s.result.correct) s.queue.push(current); else s.done += 1;
    s.step += 1; s.result = null; s.draft = null;
    if (!s.queue.length) {
      const first = new Map();
      for (const a of s.log) if (!first.has(a.questionId)) first.set(a.questionId, a);
      w.summary = { setId: s.setId, mode: s.mode, total: s.target, correct: [...first.values()].filter((a) => a.correct).length,
        repeats: s.log.length - first.size, results: [...first.values()], durationMs: Date.now() - s.startedAt,
        filters: copy(s.filters ?? { level: "all", topic: "all", grade: "all" }) };
      w.session = null;
    }
  }); }
  endSession(sessionId) { return this.change((w) => {
    if (!w.session || w.session.id !== sessionId) fail("Lượt học đã đổi ở tab khác. Hãy tải lại trạng thái.");
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
  return { ...buildLibrary(questions, sets), sets, selectedSetId: selected?.id ?? null, snapshot, questions, attempts,
    stats: buildStats(questions, snapshot.reviews, attempts, selected ? [selected] : []) };
}
export async function getSessionQuestions(repository, filters) { return selection(await repository.snapshot(), filters); }
export function exportBackup(snapshot) { return { app: "nam-english", version: 2, exportedAt: new Date().toISOString(), snapshot: dataOnly(snapshot) }; }
