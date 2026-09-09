import assert from "node:assert/strict";
import test from "node:test";
import { IDBFactory } from "fake-indexeddb";
import { createRepository, exportBackup, getSessionQuestions, readDashboard, validateBackup } from "../storage.js";
import { practice, question, vocabulary } from "./helpers.mjs";

const KEY = "nam-english:workspace-v5";
async function setup(t, mode, seed = {}) {
  const descriptors = Object.fromEntries(["indexedDB", "localStorage"].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const values = new Map(Object.entries(seed)), repos = [];
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: (key) => values.delete(key) };
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
  if (mode === "IndexedDB") Object.defineProperty(globalThis, "indexedDB", { configurable: true, value: new IDBFactory() });
  else delete globalThis.indexedDB;
  t.after(() => { repos.forEach((r) => r.close()); for (const [key, descriptor] of Object.entries(descriptors)) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; } });
  const open = async () => { const r = await createRepository(); repos.push(r); return r; };
  return { values, storage, open, repo: await open() };
}

for (const mode of ["localStorage", "IndexedDB"]) {
  test(`${mode}: kho ban đầu trống và nhập hai file trùng ID vẫn độc lập`, async (t) => {
    const { repo } = await setup(t, mode);
    assert.equal(repo.mode, mode);
    assert.equal((await repo.snapshot()).questions.length, 0);
    const a = await repo.importQuestions([question()], "bo.csv"), b = await repo.importQuestions([question()], "bo.csv");
    assert.equal(b.name, "bo (2)");
    const w = await repo.snapshot();
    assert.equal(new Set(w.questions.map((q) => q.id)).size, 2);
    assert.ok(w.questions.every((q) => q.originalId === "g-1"));
    await repo.selectSet(a.id);
    assert.equal((await readDashboard(repo)).selectedSetId, a.id);
    await repo.renameSet(a.id, "Bộ mới có dấu");
    assert.equal((await repo.snapshot()).imports[0].name, "Bộ mới có dấu");
    assert.equal((await getSessionQuestions(repo, { setId: b.id, domain: "grammar" })).length, 1);
  });

  test(`${mode}: 50 Grammar chia 30 + 20, sai vẫn không lặp, hoàn thành rồi tải lại an toàn`, async (t) => {
    const { repo, open } = await setup(t, mode);
    const set = await repo.importQuestions(Array.from({ length: 50 }, (_, i) => question({ id: `g${i}` })), "50.csv");
    const other = await repo.importQuestions([question()], "other.csv");
    let session = await repo.startSession({ setId: set.id, mode: "grammar", limit: 300 });
    const first = new Set(session.queue);
    assert.equal(session.target, 30);
    const complete = async (r) => {
      let s;
      while ((s = (await r.snapshot()).session)) { await r.submit(s.id, s.step, s.step % 2 ? "is" : "wrong"); await r.advance(s.id, s.step); }
    };
    await complete(repo);
    const reloaded = await open();
    assert.equal((await reloaded.snapshot()).session, null);
    assert.equal((await reloaded.snapshot()).summary.total, 30);
    session = await reloaded.startSession({ setId: set.id, mode: "grammar" });
    assert.equal(session.target, 20);
    assert.ok(session.queue.every((id) => !first.has(id)));
    await complete(reloaded);
    assert.equal((await reloaded.snapshot()).attempts.length, 50);
    assert.equal((await getSessionQuestions(reloaded, { setId: set.id, domain: "grammar" })).length, 0);
    assert.equal((await getSessionQuestions(reloaded, { setId: other.id, domain: "grammar" })).length, 1);
  });

  test(`${mode}: practice theo lớp chia 30 + 20, sai không lặp và không tạo SRS`, async (t) => {
    const { repo, open } = await setup(t, mode);
    const physics = await repo.importQuestions(
      Array.from({ length: 50 }, (_, index) => practice({ id: `p${index}` })),
      "physics-8.csv",
    );
    const chemistry = await repo.importQuestions(
      [practice({ subject: "chemistry", grade: "9", id: "p0", topic: "Công thức hóa học" })],
      "chemistry-9.csv",
    );
    const vocabularySet = await repo.importQuestions([vocabulary()], "english-vocab.csv");
    const complete = async (repository) => {
      let session;
      while ((session = (await repository.snapshot()).session)) {
        await repository.submit(session.id, session.step, session.step % 2 ? "N" : "sai");
        await repository.advance(session.id, session.step);
      }
    };

    let session = await repo.startSession({ setId: physics.id, mode: "practice", grade: "8", limit: 99 });
    const first = new Set(session.queue);
    assert.equal(session.target, 30);
    assert.deepEqual(session.filters, { level: "all", topic: "all", grade: "8" });
    await complete(repo);
    let state = await (await open()).snapshot();
    assert.equal(state.summary.mode, "practice");
    assert.equal(state.summary.total, 30);
    assert.equal(state.reviews.length, 0);

    session = await repo.startSession({ setId: physics.id, mode: "practice", grade: "8" });
    assert.equal(session.target, 20);
    assert.ok(session.queue.every((id) => !first.has(id)));
    await complete(repo);
    state = await repo.snapshot();
    assert.equal(state.attempts.filter((attempt) => attempt.setId === physics.id).length, 50);
    assert.equal(state.reviews.length, 0);
    assert.equal((await getSessionQuestions(repo, { setId: physics.id, domain: "practice", grade: "8" })).length, 0);
    assert.equal((await getSessionQuestions(repo, { setId: chemistry.id, domain: "practice", grade: "9" })).length, 1);
    assert.equal((await getSessionQuestions(repo, { setId: vocabularySet.id, domain: "vocabulary" })).length, 1);
  });

  test(`${mode}: các bộ nhiều môn/lớp giữ ID gốc trùng mà không trộn tiến độ`, async (t) => {
    const { repo } = await setup(t, mode);
    const english = await repo.importQuestions([question({ id: "shared" })], "english.csv");
    const chemistry = await repo.importQuestions([practice({ subject: "chemistry", grade: "6", id: "shared" })], "chemistry.csv");
    const physics = await repo.importQuestions([practice({ subject: "physics", grade: "7", id: "shared" })], "physics.csv");
    const biology = await repo.importQuestions([practice({ subject: "biology", grade: "8", id: "shared" })], "biology.csv");
    const state = await repo.snapshot();
    assert.equal(new Set(state.questions.map((question) => question.id)).size, 4);
    assert.deepEqual(new Set(state.questions.map((question) => question.originalId)), new Set(["shared"]));
    for (const [set, subject, grade, domain] of [
      [english, "english", "", "grammar"],
      [chemistry, "chemistry", "6", "practice"],
      [physics, "physics", "7", "practice"],
      [biology, "biology", "8", "practice"],
    ]) {
      const dashboard = await readDashboard(repo, set.id);
      assert.equal(dashboard.selectedSetId, set.id);
      assert.equal(dashboard.questions[0].subject, subject);
      assert.equal(dashboard.questions[0].grade, grade);
      assert.equal((await getSessionQuestions(repo, { setId: set.id, domain, grade })).length, 1);
    }
  });

  test(`${mode}: practice case-sensitive chấm Co khác CO và không vào SRS`, async (t) => {
    const { repo } = await setup(t, mode);
    const set = await repo.importQuestions([practice({
      subject: "chemistry", grade: "8", id: "co", type: "fill_blank", topic: "Công thức hóa học",
      prompt: "Điền đúng công thức của carbon monoxide.", context: "", options: [], answer: ["CO"],
      explanation: "CO khác Co vì kí hiệu có phân biệt hoa/thường.",
      theory: "Công thức hóa học phân biệt chữ hoa và chữ thường.", tags: ["case-sensitive"],
    })], "case.csv");
    const session = await repo.startSession({ setId: set.id, mode: "practice", grade: "8" });
    const result = await repo.submit(session.id, 0, "Co");
    assert.equal(result.correct, false);
    await repo.advance(session.id, 0);
    const state = await repo.snapshot();
    assert.equal(state.attempts[0].correct, false);
    assert.equal(state.reviews.length, 0);
    assert.equal((await getSessionQuestions(repo, { setId: set.id, domain: "practice", grade: "8" })).length, 0);
  });

  test(`${mode}: summary practice giữ filter lớp cho lượt tiếp theo`, async (t) => {
    const { repo } = await setup(t, mode);
    const set = await repo.importQuestions([
      practice({ id: "p7", grade: "7" }),
      practice({ id: "p8", grade: "8" }),
    ], "physics-mixed-grades.csv");
    const session = await repo.startSession({ setId: set.id, mode: "practice", grade: "7" });
    await repo.submit(session.id, 0, "N");
    await repo.advance(session.id, 0);
    const summary = (await repo.snapshot()).summary;
    assert.deepEqual(summary.filters, { level: "all", topic: "all", grade: "7" });
    assert.equal((await getSessionQuestions(repo, { setId: set.id, mode: "practice", domain: "practice", grade: "7" })).length, 0);
    assert.equal((await getSessionQuestions(repo, { setId: set.id, domain: "practice", grade: "8" })).length, 1);
    await assert.rejects(repo.startSession({ setId: set.id, mode: "practice", ...summary.filters }), /Đã hết câu phù hợp/);
  });

  test(`${mode}: đáp án, nháp và kết quả được giữ khi tải lại; chấm trùng chỉ lưu một lần`, async (t) => {
    const { repo, open } = await setup(t, mode);
    const set = await repo.importQuestions([question()], "resume.csv");
    const s = await repo.startSession({ setId: set.id, mode: "grammar" });
    const draft = { text: "is", selected: [], ordered: [], matches: {} };
    await repo.saveDraft(s.id, s.step, draft);
    const second = await open();
    assert.deepEqual((await second.snapshot()).session.draft, draft);
    await Promise.all([repo.submit(s.id, 0, "is", draft), second.submit(s.id, 0, "wrong")]);
    const w = await second.snapshot();
    assert.equal(w.attempts.length, 1);
    assert.equal(w.session.result.correct, true);
    assert.deepEqual(w.session.result.draft, draft);
    await second.advance(s.id, 0);
    await assert.rejects(repo.advance(s.id, 0), /Lượt học/);
    const third = await open();
    assert.equal((await third.snapshot()).session, null);
    assert.equal((await third.snapshot()).summary.correct, 1);
  });

  test(`${mode}: session rỗng hoặc trỏ câu đã mất không được phục hồi (lỗi context)`, async (t) => {
    const { repo, open } = await setup(t, mode);
    const set = await repo.importQuestions([question()], "one.csv");
    const s = await repo.startSession({ setId: set.id, mode: "grammar" });
    await repo.change((w) => { w.session = { ...s, queue: [], done: 1 }; });
    assert.equal((await (await open()).snapshot()).session, null);
    await repo.change((w) => { w.session = { ...s, queue: ["missing"] }; });
    assert.equal((await (await open()).snapshot()).session, null);
  });

  test(`${mode}: session/summary hỏng bị dọn riêng, dữ liệu học hợp lệ vẫn giữ`, async (t) => {
    const { repo, open } = await setup(t, mode);
    const set = await repo.importQuestions([question()], "state-check.csv");
    const start = async () => repo.startSession({ setId: set.id, mode: "grammar" });
    const corruptions = [
      (session) => ({ ...session, id: "" }),
      (session) => ({ ...session, startedAt: "không-phải-thời-gian" }),
      (session) => ({ ...session, log: [{ questionId: session.queue[0], correct: true, answer: "is" }] }),
      (session) => ({ ...session, result: { correct: true, received: "is", expected: "is", dueAt: null, draft: null } }),
    ];
    for (const corrupt of corruptions) {
      const session = await start();
      await repo.change((workspace) => { workspace.session = corrupt(session); });
      const reloaded = await open();
      assert.equal((await reloaded.snapshot()).session, null);
      assert.equal((await reloaded.snapshot()).questions.length, 1);
    }

    const session = await start();
    await assert.rejects(repo.submit(session.id, 0, null), /Câu trả lời không hợp lệ/);
    await assert.rejects(repo.saveDraft(session.id, 0, { selected: ["x"] }), /Bản nháp không hợp lệ/);
    assert.equal((await repo.snapshot()).attempts.length, 0);
    await assert.rejects(repo.endSession("lượt-cũ"), /Lượt học đã đổi/);
    assert.equal((await repo.snapshot()).session.id, session.id);
    await repo.submit(session.id, 0, "is");
    await repo.advance(session.id, 0);
    await repo.change((workspace) => { workspace.summary = { ...workspace.summary, results: [] }; });
    const repaired = await open();
    const state = await repaired.snapshot();
    assert.equal(state.session, null);
    assert.equal(state.summary, null);
    assert.equal(state.questions.length, 1);
    assert.equal(state.attempts.length, 1);
  });

  test(`${mode}: từ sai quay lại, đúng mới hoàn thành; SRS giữ riêng và dùng chung key giữa bộ`, async (t) => {
    const { repo, open } = await setup(t, mode);
    const a = await repo.importQuestions([vocabulary()], "A.csv"), b = await repo.importQuestions([vocabulary()], "B.csv");
    let s = await repo.startSession({ setId: a.id, mode: "vocabulary" });
    await repo.submit(s.id, 0, "wrong"); await repo.advance(s.id, 0);
    s = (await repo.snapshot()).session;
    assert.equal(s.done, 0); assert.equal(s.queue.length, 1); assert.equal(s.step, 1);
    await repo.submit(s.id, 1, "reliable"); await repo.advance(s.id, 1);
    const w = await (await open()).snapshot();
    assert.equal(w.summary.repeats, 1); assert.equal(w.summary.correct, 0);
    assert.equal(w.reviews.length, 1); assert.ok(w.reviews[0].firstCompletedAt);
    assert.equal(w.reviews[0].intervalDays, 1);
    assert.equal((await getSessionQuestions(repo, { setId: a.id, domain: "vocabulary" })).length, 0);
    assert.equal((await getSessionQuestions(repo, { setId: b.id, domain: "vocabulary" })).length, 1);
    await repo.change((state) => { state.reviews[0].dueAt = 0; });
    assert.equal((await getSessionQuestions(repo, { setId: a.id, domain: "vocabulary" })).length, 1);
  });

  test(`${mode}: thẻ ghi nhớ dùng lịch ôn chung, không chấp nhận kết quả giả sai kiểu`, async (t) => {
    const { repo } = await setup(t, mode);
    const set = await repo.importQuestions([vocabulary()], "cards.csv");
    const s = await repo.startSession({ setId: set.id, mode: "flashcards" });
    await assert.rejects(repo.submit(s.id, 0, "true"), /Đã nhớ/);
    await repo.submit(s.id, 0, true); await repo.advance(s.id, 0);
    assert.equal((await repo.snapshot()).reviews[0].repetitions, 1);
  });

  test(`${mode}: xóa bộ không xóa nhầm lịch ôn của từ còn nằm trong bộ khác`, async (t) => {
    const { repo } = await setup(t, mode);
    const a = await repo.importQuestions([vocabulary()], "A.csv"), b = await repo.importQuestions([vocabulary()], "B.csv");
    const s = await repo.startSession({ setId: a.id, mode: "vocabulary" });
    await repo.submit(s.id, 0, "reliable");
    await repo.deleteSet(a.id);
    let w = await repo.snapshot();
    assert.equal(w.session, null); assert.equal(w.reviews.length, 1); assert.equal(w.attempts.length, 0);
    assert.equal(w.recovery.data.questions.length, 2);
    await repo.deleteSet(b.id); w = await repo.snapshot();
    assert.equal(w.reviews.length, 0); assert.equal(w.selectedSetId, null);
  });

  test(`${mode}: xóa và khôi phục có bản phục hồi, file sai không thay đổi kho`, async (t) => {
    const { repo, open } = await setup(t, mode);
    const set = await repo.importQuestions([question(), vocabulary()], "backup.csv");
    const s = await repo.startSession({ setId: set.id, mode: "grammar" });
    await repo.submit(s.id, 0, "is"); await repo.advance(s.id, 0);
    const backup = exportBackup(await repo.snapshot());
    const invalid = structuredClone(backup); invalid.snapshot.questions[0].setId = "missing";
    assert.throws(() => repo.replaceAll(invalid), /không thuộc bộ/);
    assert.equal((await repo.snapshot()).questions.length, 2);
    await repo.clearAll();
    const w = await (await open()).snapshot();
    assert.equal(w.questions.length, 0); assert.equal(w.attempts.length, 0); assert.equal(w.session, null);
    assert.equal(w.recovery.data.questions.length, 2);
    await repo.replaceAll(exportBackup(w.recovery.data));
    assert.deepEqual(exportBackup(await repo.snapshot()).snapshot, validateBackup(backup));
    assert.equal((await readDashboard(repo)).stats.grammarRemaining, 0);
  });

  test(`${mode}: sao lưu đa môn giữ bộ riêng, từ chối bộ trộn môn`, async (t) => {
    const { repo } = await setup(t, mode);
    const english = await repo.importQuestions([question({ id: "shared" }), vocabulary({ id: "word" })], "english.csv");
    const chemistry = await repo.importQuestions([practice({ subject: "chemistry", grade: "8", id: "shared" })], "chemistry.csv");
    const biology = await repo.importQuestions([practice({ subject: "biology", grade: "9", id: "shared" })], "biology.csv");
    const vocabSession = await repo.startSession({ setId: english.id, mode: "vocabulary" });
    await repo.submit(vocabSession.id, 0, "reliable");
    await repo.advance(vocabSession.id, 0);
    const backup = exportBackup(await repo.snapshot());
    const restored = validateBackup(backup);
    assert.deepEqual(restored.imports.map((set) => set.subject), ["english", "chemistry", "biology"]);
    assert.deepEqual(restored.imports.map((set) => set.count), [2, 1, 1]);
    assert.equal(restored.reviews.length, 1);
    assert.equal(new Set(restored.questions.map((question) => question.id)).size, 4);

    const wrongDeclaredSubject = structuredClone(backup);
    wrongDeclaredSubject.snapshot.imports.find((set) => set.id === chemistry.id).subject = "physics";
    assert.throws(() => validateBackup(wrongDeclaredSubject), /trộn nhiều môn/);
    const mixedSet = structuredClone(backup);
    mixedSet.snapshot.questions.find((question) => question.setId === biology.id).setId = chemistry.id;
    assert.throws(() => validateBackup(mixedSet), /trộn nhiều môn/);

    await repo.clearAll();
    await repo.replaceAll(backup);
    const state = await repo.snapshot();
    assert.equal(state.imports.length, 3);
    assert.equal(state.questions.length, 4);
    assert.equal(state.reviews.length, 1);
  });

  test(`${mode}: transaction lỗi không lưu dở; file nhập sai cũng không thêm một phần`, async (t) => {
    const { repo } = await setup(t, mode);
    await repo.importQuestions([question()], "one.csv");
    const before = await repo.snapshot();
    await assert.rejects(repo.change((w) => { w.questions = []; throw new Error("test abort"); }), /test abort/);
    assert.deepEqual(await repo.snapshot(), before);
    assert.throws(() => repo.importQuestions([question(), question()], "duplicates.csv"), /trùng/);
    assert.deepEqual(await repo.snapshot(), before);
  });
}

test("lỗi mở IndexedDB giữ kho hiện có; chỉ lỗi không hỗ trợ mới chuyển localStorage", async (t) => {
  const descriptors = Object.fromEntries(["indexedDB", "localStorage"].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const values = new Map();
  let errorName = "QuotaExceededError";
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
  const failingIndexedDb = {
    open: () => {
      const request = {};
      queueMicrotask(() => {
        request.error = new DOMException("Không mở được IndexedDB", errorName);
        request.onerror?.();
      });
      return request;
    },
  };
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
  Object.defineProperty(globalThis, "indexedDB", { configurable: true, value: failingIndexedDb });
  t.after(() => {
    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });

  await assert.rejects(createRepository(), /Bộ nhớ đã đầy/);
  assert.equal(values.has(KEY), false);
  errorName = "AbortError";
  await assert.rejects(createRepository(), (error) => error?.name === "AbortError");
  assert.equal(values.has(KEY), false);
  errorName = "SecurityError";
  const fallback = await createRepository();
  assert.equal(fallback.mode, "localStorage");
  fallback.close();
});

test("localStorage báo đầy bộ nhớ, không báo lưu thành công hoặc xóa dữ liệu cũ", async (t) => {
  const { repo, storage } = await setup(t, "localStorage");
  await repo.importQuestions([question()], "one.csv");
  const before = await repo.snapshot();
  storage.setItem = () => { throw new DOMException("Quota", "QuotaExceededError"); };
  await assert.rejects(repo.clearAll(), /Bộ nhớ đã đầy/);
  assert.deepEqual(await repo.snapshot(), before);
});

test("localStorage lỗi JSON không tự xóa hay ghi đè kho", async (t) => {
  const { open, values } = await setup(t, "localStorage");
  values.set(KEY, "{bad json");
  await assert.rejects(open());
  assert.equal(values.get(KEY), "{bad json");
});

test("dữ liệu localStorage cũ chuyển vào bản phục hồi, kho mới chỉ dọn một lần", async (t) => {
  const { repo, open } = await setup(t, "localStorage", { "nam-english:questions": JSON.stringify([question()]) });
  const w = await repo.snapshot();
  assert.equal(w.questions.length, 0);
  assert.equal(validateBackup(w.recovery.data).questions.length, 1);
  await repo.importQuestions([vocabulary()], "new.csv");
  assert.equal((await (await open()).snapshot()).questions.length, 1);
});

test("nâng IndexedDB v2: lưu bản cũ và làm trống an toàn, không dọn lại khi mở lần sau", async (t) => {
  const { repo, open } = await setup(t, "IndexedDB");
  repo.close();
  await new Promise((resolve, reject) => { const r = indexedDB.deleteDatabase("nam-english-local"); r.onsuccess = resolve; r.onerror = () => reject(r.error); });
  await new Promise((resolve, reject) => {
    const r = indexedDB.open("nam-english-local", 2);
    r.onupgradeneeded = () => {
      for (const name of ["questions", "reviews", "attempts", "imports"]) r.result.createObjectStore(name, { keyPath: name === "reviews" ? "learningKey" : "id" });
      r.transaction.objectStore("questions").put(question());
    };
    r.onsuccess = () => { r.result.close(); resolve(); }; r.onerror = () => reject(r.error);
  });
  const upgraded = await open(), w = await upgraded.snapshot();
  assert.equal(w.questions.length, 0);
  assert.equal(validateBackup(w.recovery.data).questions.length, 1);
  await upgraded.importQuestions([vocabulary()], "new.csv");
  assert.equal((await (await open()).snapshot()).questions.length, 1);
});

test("khôi phục chuẩn hóa dữ liệu và từ chối lịch ôn / lịch sử hỏng", async (t) => {
  const { repo } = await setup(t, "localStorage");
  const set = await repo.importQuestions([vocabulary()], "one.csv");
  const s = await repo.startSession({ setId: set.id, mode: "vocabulary" });
  await repo.submit(s.id, 0, "reliable");
  const backup = exportBackup(await repo.snapshot());
  const upper = structuredClone(backup); upper.snapshot.questions[0].domain = "VOCAB"; upper.snapshot.questions[0].type = "WORD_FORMATION";
  assert.equal(validateBackup(upper).questions[0].domain, "vocabulary");
  for (const mutate of [(w) => w.reviews[0].ease = 0, (w) => w.attempts[0].correct = "yes", (w) => w.questions.push(w.questions[0]), (w) => w.imports[0].importedAt = 1e100]) {
    const bad = structuredClone(backup); mutate(bad.snapshot); assert.throws(() => validateBackup(bad));
  }
});
