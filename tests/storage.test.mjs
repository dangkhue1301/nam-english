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
  test(`${mode}: tùy chọn số câu 10/20/30: bộ 50 chia 10 + 10 + 30, bộ 7 câu lấy hết 7`, async (t) => {
    const { repo, open } = await setup(t, mode);
    const set50 = await repo.importQuestions(Array.from({ length: 50 }, (_, i) => question({ id: `q50_${i}` })), "50q.csv");
    let s1 = await repo.startSession({ setId: set50.id, mode: "grammar", limit: 10 });
    assert.equal(s1.target, 10);
    assert.equal(s1.filters.limit, 10);
    while (s1) {
      await repo.submit(s1.id, s1.step, "is");
      await repo.advance(s1.id, s1.step);
      s1 = (await repo.snapshot()).session;
    }
    const sum1 = (await repo.snapshot()).summary;
    assert.equal(sum1.total, 10);
    assert.equal(sum1.filters.limit, 10);

    let s2 = await repo.startSession({ setId: set50.id, mode: "grammar", limit: 10 });
    assert.equal(s2.target, 10);
    while (s2) {
      await repo.submit(s2.id, s2.step, "is");
      await repo.advance(s2.id, s2.step);
      s2 = (await repo.snapshot()).session;
    }

    let s3 = await repo.startSession({ setId: set50.id, mode: "grammar", limit: 30 });
    assert.equal(s3.target, 30);
    while (s3) {
      await repo.submit(s3.id, s3.step, "is");
      await repo.advance(s3.id, s3.step);
      s3 = (await repo.snapshot()).session;
    }
    assert.equal((await repo.snapshot()).attempts.filter((a) => a.setId === set50.id).length, 50);

    const set7 = await repo.importQuestions(Array.from({ length: 7 }, (_, i) => question({ id: `q7_${i}` })), "7q.csv");
    let s4 = await repo.startSession({ setId: set7.id, mode: "grammar", limit: 20 });
    assert.equal(s4.target, 7);
    assert.equal(s4.queue.length, 7);
    assert.equal(s4.filters.limit, 20);
  });

  test(`${mode}: lọc type chỉ lấy đúng câu thuộc type đó, giữ cấu hình qua reload và next-batch`, async (t) => {
    const { repo, open } = await setup(t, mode);
    const set = await repo.importQuestions([
      practice({ id: "mcq_1", type: "mcq" }),
      practice({ id: "mcq_2", type: "mcq" }),
      practice({ id: "fill_1", type: "fill_blank", answer: "H2O" }),
      practice({ id: "fill_2", type: "fill_blank", answer: "NaCl" }),
    ], "mixed-types.csv");

    let s = await repo.startSession({ setId: set.id, mode: "practice", type: "mcq", limit: 10 });
    assert.equal(s.target, 2);
    assert.equal(s.filters.type, "mcq");
    assert.equal(s.filters.limit, 10);
    const snap = await repo.snapshot();
    const qMap = new Map(snap.questions.map((q) => [q.id, q]));
    assert.deepEqual(s.queue.map((id) => qMap.get(id).originalId).sort(), ["mcq_1", "mcq_2"]);

    // Reload preserves session
    const reloaded = await open();
    let rs = (await reloaded.snapshot()).session;
    assert.equal(rs.id, s.id);
    assert.equal(rs.filters.type, "mcq");
    assert.equal(rs.filters.limit, 10);

    // Complete session
    await reloaded.submit(rs.id, 0, "N");
    await reloaded.advance(rs.id, 0);
    rs = (await reloaded.snapshot()).session;
    await reloaded.submit(rs.id, 1, "N");
    await reloaded.advance(rs.id, 1);

    const summary = (await reloaded.snapshot()).summary;
    assert.equal(summary.filters.type, "mcq");
    assert.equal(summary.filters.limit, 10);

    // Hết câu mcq, bắt đầu lại với cùng filter phải reject
    await assert.rejects(reloaded.startSession({ setId: set.id, mode: "practice", ...summary.filters }), /Đã hết câu phù hợp/);

    // Lọc fill_blank vẫn còn 2 câu
    let sFill = await reloaded.startSession({ setId: set.id, mode: "practice", type: "fill_blank", limit: 20 });
    assert.equal(sFill.target, 2);
    assert.deepEqual(sFill.queue.map((id) => qMap.get(id).originalId).sort(), ["fill_1", "fill_2"]);
  });

  test(`${mode}: ôn riêng các câu sai: tối đa 20 câu, nhiều bộ, submit idempotent, reload, không ảnh hưởng số câu thường và SRS, lần đúng loại khỏi danh sách sai, backup giữ purpose`, async (t) => {
    const { repo, open } = await setup(t, mode);

    // 1. Tạo 2 bộ: Set A (Vật lí, 10 câu), Set B (Grammar, 15 câu)
    const physicsQuestions = Array.from({ length: 10 }, (_, i) => ({
      subject: "physics",
      grade: "8",
      id: `phys-${i + 1}`,
      domain: "practice",
      type: "mcq",
      level: "A1",
      topic: "Lực",
      subtopic: "",
      prompt: `Câu hỏi vật lí số ${i + 1}`,
      context: "",
      options: ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
      answer: "Đáp án A",
      explanation: "Giải thích",
      theory: "Lý thuyết",
      hint: "",
      tags: [],
      difficulty: "1",
      learning_key: "",
    }));

    const grammarQuestions = Array.from({ length: 15 }, (_, i) => ({
      subject: "english",
      grade: "",
      id: `gram-${i + 1}`,
      domain: "grammar",
      type: "mcq",
      level: "B1",
      topic: "Tenses",
      subtopic: "",
      prompt: `Grammar question ${i + 1}`,
      context: "",
      options: ["Option A", "Option B", "Option C", "Option D"],
      answer: "Option A",
      explanation: "Explanation",
      theory: "Grammar theory",
      hint: "",
      tags: [],
      difficulty: "2",
      learning_key: "",
    }));

    const setA = await repo.importQuestions(physicsQuestions, "physics.csv", "Vật lí 8");
    const setB = await repo.importQuestions(grammarQuestions, "grammar.csv", "Grammar B1");

    // 2. Học Set A: làm 4 câu: 1 đúng (phys-1), 3 sai (phys-2, phys-3, phys-4) -> 6 câu còn lại
    let sessionA = await repo.startSession({ setId: setA.id, mode: "practice", limit: 4 });
    await repo.submit(sessionA.id, 0, "Đáp án A"); await repo.advance(sessionA.id, 0); // Đúng
    await repo.submit(sessionA.id, 1, "Đáp án B"); await repo.advance(sessionA.id, 1); // Sai
    await repo.submit(sessionA.id, 2, "Đáp án B"); await repo.advance(sessionA.id, 2); // Sai
    await repo.submit(sessionA.id, 3, "Đáp án B"); await repo.advance(sessionA.id, 3); // Sai

    // 3. Học Set B: làm 4 câu: 2 đúng (gram-1, gram-2), 2 sai (gram-3, gram-4) -> 11 câu còn lại
    let sessionB = await repo.startSession({ setId: setB.id, mode: "grammar", limit: 4 });
    await repo.submit(sessionB.id, 0, "Option A"); await repo.advance(sessionB.id, 0); // Đúng
    await repo.submit(sessionB.id, 1, "Option A"); await repo.advance(sessionB.id, 1); // Đúng
    await repo.submit(sessionB.id, 2, "Option B"); await repo.advance(sessionB.id, 2); // Sai
    await repo.submit(sessionB.id, 3, "Option B"); await repo.advance(sessionB.id, 3); // Sai

    // Kiểm tra số câu sai hiện tại: 3 câu từ Set A + 2 câu từ Set B = 5 câu
    const dashboardBefore = await readDashboard(repo);
    assert.equal(dashboardBefore.mistakes.length, 5);

    // Kiểm tra số câu còn lại trong chế độ thường trước khi ôn sai:
    const remainingABefore = (await getSessionQuestions(repo, { setId: setA.id, domain: "practice" })).length;
    const remainingBBefore = (await getSessionQuestions(repo, { setId: setB.id, domain: "grammar" })).length;
    assert.equal(remainingABefore, 6, "Set A phải còn 6 câu chưa làm");
    assert.equal(remainingBBefore, 11, "Set B phải còn 11 câu chưa làm");

    // 4. Bắt đầu lượt ôn sai (tối đa 20 câu)
    const reviewSession = await repo.startMistakesSession({ limit: 20 });
    assert.equal(reviewSession.purpose, "review");
    assert.equal(reviewSession.mode, "review");
    assert.equal(reviewSession.target, 5);
    assert.equal(reviewSession.queue.length, 5);
    assert.ok(Array.isArray(reviewSession.setIds));
    assert.equal(reviewSession.setIds.length, 2);

    // Không cho mở session mới khi đang có lượt ôn sai
    await assert.rejects(repo.startSession({ setId: setA.id, mode: "practice" }), /Hãy tiếp tục hoặc kết thúc lượt đang học trước/);

    // 5. Submit idempotent
    const q0Id = reviewSession.queue[0];
    const q0 = (await repo.snapshot()).questions.find((q) => q.id === q0Id);
    const sub1 = await repo.submit(reviewSession.id, 0, q0.answer);
    const sub2 = await repo.submit(reviewSession.id, 0, q0.answer);
    assert.deepEqual(sub1, sub2);
    const snapMid = await repo.snapshot();
    assert.equal(snapMid.attempts.filter((a) => a.id === `${reviewSession.id}:0`).length, 1);

    // 6. Reload giữa đáp án/kết quả
    const reloadedRepo = await open();
    const reloadedSnap = await reloadedRepo.snapshot();
    assert.ok(reloadedSnap.session);
    assert.equal(reloadedSnap.session.id, reviewSession.id);
    assert.equal(reloadedSnap.session.purpose, "review");
    assert.ok(reloadedSnap.session.result);

    // 7. Hoàn thành lượt ôn sai
    await reloadedRepo.advance(reviewSession.id, 0); // Đã làm đúng câu 0

    // Câu 1: trả lời ĐÚNG
    const q1Id = (await reloadedRepo.snapshot()).session.queue[0];
    const q1 = (await reloadedRepo.snapshot()).questions.find((q) => q.id === q1Id);
    await reloadedRepo.submit(reviewSession.id, 1, q1.answer);
    await reloadedRepo.advance(reviewSession.id, 1);

    // Câu 2: trả lời SAI
    await reloadedRepo.submit(reviewSession.id, 2, "Sai hoàn toàn");
    await reloadedRepo.advance(reviewSession.id, 2);

    // Câu 3: trả lời ĐÚNG
    const q3Id = (await reloadedRepo.snapshot()).session.queue[0];
    const q3 = (await reloadedRepo.snapshot()).questions.find((q) => q.id === q3Id);
    await reloadedRepo.submit(reviewSession.id, 3, q3.answer);
    await reloadedRepo.advance(reviewSession.id, 3);

    // Câu 4: trả lời SAI
    await reloadedRepo.submit(reviewSession.id, 4, "Sai hoàn toàn");
    await reloadedRepo.advance(reviewSession.id, 4);

    // Kết thúc lượt ôn: session null, summary có purpose: "review"
    const finishedSnap = await reloadedRepo.snapshot();
    assert.equal(finishedSnap.session, null);
    assert.ok(finishedSnap.summary);
    assert.equal(finishedSnap.summary.purpose, "review");
    assert.equal(finishedSnap.summary.total, 5);
    assert.equal(finishedSnap.summary.correct, 3);
    assert.equal(finishedSnap.summary.repeats, 0);

    // 8. BẤT BIẾN: Số câu còn lại trong chế độ thường KHÔNG THAY ĐỔI
    const remainingAAfter = (await getSessionQuestions(reloadedRepo, { setId: setA.id, domain: "practice" })).length;
    const remainingBAfter = (await getSessionQuestions(reloadedRepo, { setId: setB.id, domain: "grammar" })).length;
    assert.equal(remainingAAfter, 6, "Set A vẫn phải còn đúng 6 câu chưa làm");
    assert.equal(remainingBAfter, 11, "Set B vẫn phải còn đúng 11 câu chưa làm");

    // 9. Lần ôn ĐÚNG loại câu khỏi danh sách câu sai; câu vẫn SAI tiếp tục nằm trong danh sách
    const dashboardAfter = await readDashboard(reloadedRepo);
    assert.equal(dashboardAfter.mistakes.length, 2, "Chỉ còn 2 câu sai sau khi ôn đúng 3 câu");

    // 10. Backup giữ purpose và nhận backup cũ
    const backup = exportBackup(finishedSnap);
    const reviewAttempts = backup.snapshot.attempts.filter((a) => a.purpose === "review");
    assert.equal(reviewAttempts.length, 5);
    const validated = validateBackup(backup);
    assert.equal(validated.attempts.filter((a) => a.purpose === "review").length, 5);

    // Backup cũ không có purpose vẫn được nhận và mặc định là "study"
    const legacyBackup = structuredClone(backup);
    legacyBackup.snapshot.attempts.forEach((a) => {
      delete a.purpose;
      if (a.mode === "review") delete a.mode;
    });
    const validatedLegacy = validateBackup(legacyBackup);
    assert.ok(validatedLegacy.attempts.every((a) => a.purpose === "study"));

    // 11. Xóa một bộ trong lượt ôn sai: tab khác xóa bộ thì dọn session an toàn
    const reviewSession2 = await reloadedRepo.startMistakesSession({ limit: 20 });
    assert.equal(reviewSession2.target, 2);
    // Xóa Set A
    await reloadedRepo.deleteSet(setA.id);
    const snapAfterDelete = await reloadedRepo.snapshot();
    assert.equal(snapAfterDelete.session, null, "Session phải được dọn khi bộ trong setIds bị xóa");
  });

  test(`${mode}: trộn nhiều bộ: cùng mode, trùng ID gốc, hết câu, lọc type/grade, giới hạn, reload, xóa một bộ, vocabulary trùng key`, async (t) => {
    const { repo, open } = await setup(t, mode);

    // 1. Tạo 2 bộ Vật lí có ID gốc trùng nhau
    const physics1Rows = [
      practice({ id: "p1", prompt: "Bộ 1 - Lực là gì?", options: ["N", "J"], answer: ["N"] }),
      practice({ id: "p2", prompt: "Bộ 1 - Quán tính là gì?", options: ["A", "B"], answer: ["A"] }),
    ];
    const physics2Rows = [
      practice({ id: "p1", type: "multiple_select", prompt: "Bộ 2 - Các loại lực?", options: ["Ma sát", "Trọng lực", "Vận tốc"], answer: ["Ma sát", "Trọng lực"] }),
      practice({ id: "p2", prompt: "Bộ 2 - Câu 2?", options: ["X", "Y"], answer: ["X"] }),
      practice({ id: "p3", prompt: "Bộ 2 - Áp suất?", options: ["p=F/S", "p=F*S"], answer: ["p=F/S"] }),
      practice({ id: "p4", type: "multiple_select", prompt: "Bộ 2 - Các đơn vị?", options: ["N", "Pa", "m/s"], answer: ["N", "Pa"] }),
    ];

    const setP1 = await repo.importQuestions(physics1Rows, "physics1.csv", "Vật lí Bộ 1");
    const setP2 = await repo.importQuestions(physics2Rows, "physics2.csv", "Vật lí Bộ 2");

    // Từ chối trộn khác môn (ví dụ trộn Lý với Hóa)
    const chemRows = [
      practice({ subject: "chemistry", id: "c1", prompt: "Nguyên tử?", options: ["Hạt", "Sóng"], answer: ["Hạt"] }),
    ];
    const setChem = await repo.importQuestions(chemRows, "chem.csv", "Hóa học Bộ 1");
    await assert.rejects(
      repo.startSession({ setIds: [setP1.id, setChem.id], mode: "practice" }),
      /cùng môn/
    );

    // 2. Bắt đầu lượt trộn 2 bộ Vật lí (tổng 2 + 3 = 5 câu)
    const session = await repo.startSession({ setIds: [setP1.id, setP2.id], mode: "practice", limit: 10 });
    assert.equal(session.target, 6);
    assert.deepEqual(session.setIds.sort(), [setP1.id, setP2.id].sort());
    assert.equal(new Set(session.queue).size, 6);

    // Không tự đổi selectedSetId khi trộn
    const snapDuring = await repo.snapshot();
    assert.notEqual(snapDuring.selectedSetId, null);

    // 3. Chấm câu đầu tiên (thuộc Bộ 1 hoặc Bộ 2)
    const firstQId = session.queue[0];
    const firstQ = snapDuring.questions.find((q) => q.id === firstQId);
    const subResult = await repo.submit(session.id, 0, firstQ.type === "multiple_select" ? firstQ.answer : firstQ.answer[0], { text: firstQ.answer[0] });
    assert.equal(subResult.correct, true);

    // Reload giữ session và draft
    const reloadedRepo = await open();
    await reloadedRepo.repairSession();
    const reloadedSnap = await reloadedRepo.snapshot();
    assert.ok(reloadedSnap.session);
    assert.equal(reloadedSnap.session.result.correct, true);

    // Advance
    await reloadedRepo.advance(session.id, 0);

    // 4. Lọc type trong lượt trộn: chỉ lấy multiple_select (chỉ có 1 câu ở Bộ 2)
    await reloadedRepo.endSession(session.id);
    const filterSession = await reloadedRepo.startSession({
      setIds: [setP1.id, setP2.id],
      mode: "practice",
      type: "multiple_select",
      limit: 10,
    });
    assert.ok(filterSession.target >= 1 && filterSession.target <= 2);
    assert.ok(filterSession.queue[0].startsWith(setP2.id));
    await reloadedRepo.endSession(filterSession.id);

    // 5. Vocabulary với trùng learning_key giữa 2 bộ
    const vocab1 = [
      vocabulary({ id: "v1", prompt: "Bộ V1 - apple", learningKey: "vocab:apple:noun:táo" }),
      vocabulary({ id: "v2", prompt: "Bộ V1 - banana", learningKey: "vocab:banana:noun:chuối" }),
    ];
    const vocab2 = [
      vocabulary({ id: "v1", prompt: "Bộ V2 - apple", learningKey: "vocab:apple:noun:táo" }),
      vocabulary({ id: "v3", prompt: "Bộ V2 - cherry", learningKey: "vocab:cherry:noun:anh đào" }),
    ];

    const setV1 = await reloadedRepo.importQuestions(vocab1, "vocab1.csv", "Từ vựng Bộ 1");
    const setV2 = await reloadedRepo.importQuestions(vocab2, "vocab2.csv", "Từ vựng Bộ 2");

    // Lượt trộn vocabulary: khử trùng learning_key trong queue! (apple chỉ xuất hiện 1 lần)
    const vSession = await reloadedRepo.startSession({ setIds: [setV1.id, setV2.id], mode: "vocabulary", limit: 30 });
    // Tổng số từ khác nhau: apple, banana, cherry => 3 từ
    assert.equal(vSession.target, 3);
    const vQuestions = (await reloadedRepo.snapshot()).questions.filter((q) => vSession.queue.includes(q.id));
    const learningKeysInQueue = vQuestions.map((q) => q.learningKey);
    assert.equal(new Set(learningKeysInQueue).size, 3, "Queue trộn vocabulary không được trùng learning_key");

    // 6. Xóa một bộ trong lượt trộn: xóa setV1 -> session phải được dọn an toàn
    await reloadedRepo.deleteSet(setV1.id);
    const snapAfterDelete = await reloadedRepo.snapshot();
    assert.equal(snapAfterDelete.session, null, "Session trộn phải được dọn an toàn khi một bộ thành phần bị xóa");
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
