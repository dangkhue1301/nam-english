import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { IDBFactory } from "fake-indexeddb";
import {
  createRepository,
  exportBackup,
  getSessionQuestions,
  readDashboard,
  validateBackup,
} from "../storage.js";
import { parseJapaneseCsv } from "../japanese.js";

async function setup(t, mode, seed = {}) {
  const descriptors = Object.fromEntries(
    ["indexedDB", "localStorage"].map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
  );
  const values = new Map(Object.entries(seed));
  const repos = [];
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  });
  if (mode === "IndexedDB") {
    Object.defineProperty(globalThis, "indexedDB", {
      configurable: true,
      value: new IDBFactory(),
    });
  } else {
    delete globalThis.indexedDB;
  }
  t.after(() => {
    repos.forEach((r) => r.close());
    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  const open = async () => {
    const r = await createRepository();
    repos.push(r);
    return r;
  };
  return { values, storage, open, repo: await open() };
}

async function loadSample8() {
  const guide = await readFile(
    new URL("../JAPANESE_CSV_GUIDE.md", import.meta.url),
    "utf8",
  );
  const blocks = [...guide.matchAll(/```csv\r?\n([\s\S]*?)```/g)].map(
    (m) => m[1],
  );
  const sampleCsv = blocks.find((b) => b.includes("g001"));
  const parsed = parseJapaneseCsv(sampleCsv, "sample-8.csv");
  assert.deepEqual(parsed.errors, []);
  return parsed.rows;
}

function makeJaQuestion(overrides = {}) {
  return {
    schema: "ja-v1",
    subject: "japanese",
    id: "g001",
    level: "N5",
    chapter: "1",
    lesson: "1",
    section: "grammar",
    domain: "grammar",
    topic: "Thì quá khứ",
    type: "ja_grammar_choice",
    prompt: "Chọn đáp án đúng.",
    context: "きのう、友達と映画を{{gap}}。",
    target: "",
    options: [
      { id: "o1", text: "見ます" },
      { id: "o2", text: "見ました" },
      { id: "o3", text: "見る" },
      { id: "o4", text: "見ません" },
    ],
    answer: "o2",
    acceptedOrders: null,
    accepted_orders: null,
    starPosition: null,
    star_position: null,
    explanation: "きのう là hôm qua.",
    theory: "Dùng ました cho quá khứ.",
    hint: "",
    learning_key: "",
    learningKey: "",
    active: true,
    ...overrides,
  };
}

function makeJaVocab(overrides = {}) {
  return {
    schema: "ja-v1",
    subject: "japanese",
    id: "v001",
    level: "N5",
    chapter: "1",
    lesson: "1",
    section: "vocabulary",
    domain: "vocabulary",
    topic: "Từ vựng N5",
    type: "ja_vocab_context",
    prompt: "Chọn từ thích hợp điền vào chỗ trống.",
    context: "毎朝、{{gap}}を読みます。",
    target: "新聞",
    options: [
      { id: "o1", text: "新聞" },
      { id: "o2", text: "雑誌" },
      { id: "o3", text: "本" },
      { id: "o4", text: "手紙" },
    ],
    answer: "o1",
    acceptedOrders: null,
    accepted_orders: null,
    starPosition: null,
    star_position: null,
    explanation: "新聞 là báo.",
    theory: "",
    hint: "",
    learning_key: "ja:vocab:shinbun:newspaper",
    learningKey: "ja:vocab:shinbun:newspaper",
    active: true,
    ...overrides,
  };
}

function makeJaKanji(overrides = {}) {
  return {
    schema: "ja-v1",
    subject: "japanese",
    id: "k001",
    level: "N5",
    chapter: "1",
    lesson: "1",
    section: "kanji",
    domain: "kanji",
    topic: "Hán tự N5",
    type: "ja_kanji_reading",
    prompt: "Chọn cách đọc đúng của chữ Hán.",
    context: "日本語の勉強。",
    target: "語",
    options: [
      { id: "o1", text: "ご" },
      { id: "o2", text: "こ" },
      { id: "o3", text: "ぎ" },
      { id: "o4", text: "き" },
    ],
    answer: "o1",
    acceptedOrders: null,
    accepted_orders: null,
    starPosition: null,
    star_position: null,
    explanation: "語 đọc là ご.",
    theory: "",
    hint: "",
    learning_key: "",
    learningKey: "",
    active: true,
    ...overrides,
  };
}

for (const mode of ["localStorage", "IndexedDB"]) {
  test(`${mode}: Nhập fixture 8 câu tiếng Nhật chuẩn, kiểm tra sets, snapshot và dashboard`, async (t) => {
    const { repo } = await setup(t, mode);
    const sample8 = await loadSample8();
    const importedSet = await repo.importQuestions(sample8, "japanese-sample.csv", "Bộ mẫu 8 câu");

    assert.equal(importedSet.subject, "japanese");
    assert.equal(importedSet.count, 8);

    const w = await repo.snapshot();
    assert.equal(w.questions.length, 8);
    assert.equal(w.imports.length, 1);
    assert.equal(w.imports[0].subject, "japanese");

    // Kiểm tra cấu trúc câu hỏi
    const g3 = w.questions.find((q) => q.type === "ja_grammar_order");
    assert.ok(g3, "ja_grammar_order tồn tại");
    assert.ok(Array.isArray(g3.options), "options là array");
    assert.ok(Array.isArray(g3.acceptedOrders), "acceptedOrders là array");

    const g2 = w.questions.find((q) => q.type === "ja_grammar_star");
    assert.ok(g2, "ja_grammar_star tồn tại");
    assert.equal(typeof g2.starPosition, "number");

    // Dashboard
    const dashboard = await readDashboard(repo);
    assert.equal(dashboard.selectedSetId, importedSet.id);
    assert.equal(dashboard.sets[0].subject, "japanese");
    assert.equal(dashboard.questions.length, 8);
    assert.ok(dashboard.topics.length > 0, "topics được tạo trong thư viện");
  });

  test(`${mode}: 50 câu tiếng Nhật chia 30 + 20, lượt thứ 3 hết câu mới`, async (t) => {
    const { repo, open } = await setup(t, mode);
    const questions50 = Array.from({ length: 50 }, (_, i) =>
      makeJaQuestion({
        id: `g${String(i).padStart(3, "0")}`,
        prompt: `Câu số ${i}`,
      }),
    );

    const set = await repo.importQuestions(questions50, "50-ja.csv", "50 câu Nhật");

    // Lượt 1: tối đa 30 câu
    let s = await repo.startSession({ setId: set.id, mode: "grammar", limit: 30 });
    assert.equal(s.target, 30);
    const round1Ids = new Set(s.queue);
    assert.equal(round1Ids.size, 30);

    // Hoàn thành lượt 1
    while (s && s.queue.length > 0) {
      await repo.submit(s.id, s.step, "o2");
      await repo.advance(s.id, s.step);
      s = (await repo.snapshot()).session;
    }

    // Lượt 2: còn lại 20 câu
    s = await repo.startSession({ setId: set.id, mode: "grammar", limit: 30 });
    assert.equal(s.target, 20);
    for (const qId of s.queue) {
      assert.ok(!round1Ids.has(qId), "Câu lượt 2 không trùng lượt 1");
    }

    // Hoàn thành lượt 2
    while (s && s.queue.length > 0) {
      await repo.submit(s.id, s.step, "o2");
      await repo.advance(s.id, s.step);
      s = (await repo.snapshot()).session;
    }

    const w = await repo.snapshot();
    assert.equal(w.attempts.length, 50);

    // Lượt 3: hết câu mới, phải báo lỗi
    await assert.rejects(
      repo.startSession({ setId: set.id, mode: "grammar", limit: 30 }),
      /Đã hết câu phù hợp/,
    );
  });

  test(`${mode}: 3 biến thể từ vựng cùng learning_key KHÔNG bị khử trùng trong chế độ câu mới`, async (t) => {
    const { repo } = await setup(t, mode);
    const key = "ja:vocab:taberu:eat";
    const v1 = makeJaVocab({ id: "v101", learning_key: key, prompt: "Dạng 1" });
    const v2 = makeJaVocab({ id: "v102", learning_key: key, prompt: "Dạng 2" });
    const v3 = makeJaVocab({ id: "v103", learning_key: key, prompt: "Dạng 3" });

    const set = await repo.importQuestions([v1, v2, v3], "3-variants.csv");
    const s = await repo.startSession({ setId: set.id, mode: "vocabulary", limit: 30 });

    assert.equal(s.target, 3);
    assert.equal(s.queue.length, 3);
    assert.ok(s.queue.some((id) => id.endsWith(":0")));
    assert.ok(s.queue.some((id) => id.endsWith(":1")));
    assert.ok(s.queue.some((id) => id.endsWith(":2")));
  });

  test(`${mode}: Từ vựng sai được đưa về cuối hàng đợi, làm lại đúng KHÔNG tăng repetitions`, async (t) => {
    const { repo } = await setup(t, mode);
    const key = "ja:vocab:nomu:drink";
    const v = makeJaVocab({ id: "v201", learning_key: key });
    const set = await repo.importQuestions([v], "retry-vocab.csv");

    let s = await repo.startSession({ setId: set.id, mode: "vocabulary" });
    assert.equal(s.queue.length, 1);
    const currentQId = s.queue[0];

    // Lần 1: Trả lời SAI
    const res1 = await repo.submit(s.id, s.step, "o2"); // đáp án đúng là o1
    assert.equal(res1.correct, false);

    // Sau submit lần 1 sai: key bị lapse 10 phút, repetitions = 0
    let w = await repo.snapshot();
    let rev = w.reviews.find((r) => r.learningKey === key);
    assert.ok(rev, "review được tạo khi hoàn thành câu đầu tiên của key");
    assert.equal(rev.repetitions, 0);
    assert.equal(rev.lapses, 1);
    assert.equal(rev.intervalDays, 0);

    // Advance: câu sai quay lại cuối hàng đợi
    await repo.advance(s.id, s.step);
    s = (await repo.snapshot()).session;
    assert.ok(s, "session chưa kết thúc vì câu sai được đưa lại vào queue");
    assert.equal(s.queue.length, 1);
    assert.equal(s.queue[0], currentQId);
    assert.equal(s.done, 0);

    // Lần 2 (Retry): Trả lời ĐÚNG
    const res2 = await repo.submit(s.id, s.step, "o1");
    assert.equal(res2.correct, true);

    // Advance: hoàn thành
    await repo.advance(s.id, s.step);
    w = await repo.snapshot();
    assert.equal(w.session, null, "session hoàn thành");

    // KIỂM TRA QUAN TRỌNG: Retry đúng KHÔNG được tăng repetitions hay xóa lapse!
    rev = w.reviews.find((r) => r.learningKey === key);
    assert.equal(rev.repetitions, 0, "repetitions vẫn giữ 0");
    assert.equal(rev.lapses, 1, "lapses vẫn giữ 1");
    assert.equal(rev.intervalDays, 0, "interval vẫn 0 (lapse 10 phút)");

    // Kiểm tra attempts: lần 1 origin=ja_unseen, lần 2 origin=ja_retry
    assert.equal(w.attempts.length, 2);
    assert.equal(w.attempts[0].correct, false);
    assert.equal(w.attempts[0].origin, "ja_unseen");
    assert.equal(w.attempts[1].correct, true);
    assert.equal(w.attempts[1].origin, "ja_retry");
  });

  test(`${mode}: SRS 1 sự kiện / key / phiên: 3 câu cùng key (đúng/sai/đúng) -> 1 lapse (10 min), repetition = 0`, async (t) => {
    const { repo } = await setup(t, mode);
    const key = "ja:vocab:iku:go";
    const v1 = makeJaVocab({ id: "v301", learning_key: key, prompt: "Câu 1" });
    const v2 = makeJaVocab({ id: "v302", learning_key: key, prompt: "Câu 2" });
    const v3 = makeJaVocab({ id: "v303", learning_key: key, prompt: "Câu 3" });

    const set = await repo.importQuestions([v1, v2, v3], "3-same-key.csv");
    let s = await repo.startSession({ setId: set.id, mode: "vocabulary" });
    assert.equal(s.queue.length, 3);

    // Câu 1 (v1): Đúng
    await repo.submit(s.id, s.step, "o1");
    await repo.advance(s.id, s.step);
    s = (await repo.snapshot()).session;

    // Câu 2 (v2): Sai
    await repo.submit(s.id, s.step, "o2"); // sai
    await repo.advance(s.id, s.step);
    s = (await repo.snapshot()).session;

    // Câu 3 (v3): Đúng
    await repo.submit(s.id, s.step, "o1");
    await repo.advance(s.id, s.step);
    s = (await repo.snapshot()).session;

    // Lúc này cả 3 câu đều đã có first attempt (true, false, true).
    // Key phải bị đánh giá là lapse (10 min), repetitions = 0
    let w = await repo.snapshot();
    let rev = w.reviews.find((r) => r.learningKey === key);
    assert.ok(rev, "review đã được tạo");
    assert.equal(rev.repetitions, 0, "repetitions phải là 0 vì có câu sai trong lần đầu");
    assert.equal(rev.lapses, 1, "lapses = 1");
    assert.equal(rev.intervalDays, 0, "intervalDays = 0 (lapse 10 phút)");

    // Câu 2 quay lại ở cuối queue (retry)
    assert.ok(s, "session còn câu retry");
    assert.equal(s.queue.length, 1);

    // Retry câu 2: đúng
    await repo.submit(s.id, s.step, "o1");
    await repo.advance(s.id, s.step);

    w = await repo.snapshot();
    assert.equal(w.session, null, "session hoàn thành");

    // Review không bị thay đổi bởi retry
    rev = w.reviews.find((r) => r.learningKey === key);
    assert.equal(rev.repetitions, 0);
    assert.equal(rev.lapses, 1);
    assert.equal(rev.intervalDays, 0);
  });

  test(`${mode}: SRS thành công: 3 câu cùng key đều đúng lần đầu -> grade 4, repetitions = 1`, async (t) => {
    const { repo } = await setup(t, mode);
    const key = "ja:vocab:miru:see";
    const v1 = makeJaVocab({ id: "v401", learning_key: key, prompt: "Câu 1" });
    const v2 = makeJaVocab({ id: "v402", learning_key: key, prompt: "Câu 2" });
    const v3 = makeJaVocab({ id: "v403", learning_key: key, prompt: "Câu 3" });

    const set = await repo.importQuestions([v1, v2, v3], "3-success.csv");
    let s = await repo.startSession({ setId: set.id, mode: "vocabulary" });

    for (let i = 0; i < 3; i++) {
      await repo.submit(s.id, s.step, "o1");
      await repo.advance(s.id, s.step);
      s = (await repo.snapshot()).session;
    }

    const w = await repo.snapshot();
    assert.equal(w.session, null);
    const rev = w.reviews.find((r) => r.learningKey === key);
    assert.ok(rev);
    assert.equal(rev.repetitions, 1);
    assert.equal(rev.intervalDays, 1);
    assert.equal(rev.lastGrade, 4);
    assert.equal(rev.lapses, 0);
  });

  test(`${mode}: Hán tự (kanji) và Ngữ pháp (grammar) KHÔNG tham gia SRS`, async (t) => {
    const { repo } = await setup(t, mode);
    const k = makeJaKanji({ id: "k501" });
    const g = makeJaQuestion({ id: "g501" });

    const set = await repo.importQuestions([k, g], "kanji-grammar.csv");

    // Học Kanji
    let s = await repo.startSession({ setId: set.id, mode: "kanji" });
    assert.equal(s.queue.length, 1);
    await repo.submit(s.id, s.step, "o1");
    await repo.advance(s.id, s.step);

    let w = await repo.snapshot();
    assert.equal(w.reviews.length, 0, "Kanji không tạo review SRS");

    // Học Grammar
    s = await repo.startSession({ setId: set.id, mode: "grammar" });
    assert.equal(s.queue.length, 1);
    await repo.submit(s.id, s.step, "o2");
    await repo.advance(s.id, s.step);

    w = await repo.snapshot();
    assert.equal(w.reviews.length, 0, "Grammar không tạo review SRS");
    assert.equal(w.attempts.length, 2, "Cả 2 câu đều có lịch sử attempt");
  });

  test(`${mode}: Chặn flashcards cho Tiếng Nhật ở startSession và validateBackup`, async (t) => {
    const { repo } = await setup(t, mode);
    const set = await repo.importQuestions([makeJaVocab()], "ja-flash.csv");

    // startSession phải từ chối flashcards với tiếng Nhật
    await assert.rejects(
      repo.startSession({ setId: set.id, mode: "flashcards" }),
      /Tiếng Nhật không hỗ trợ thẻ ghi nhớ \(flashcards\)/,
    );

    // validateBackup phải từ chối attempt flashcards nếu subject là japanese
    const backup = exportBackup(await repo.snapshot());
    const invalidBackup = structuredClone(backup);
    invalidBackup.snapshot.attempts = [
      {
        id: "att-1",
        questionId: invalidBackup.snapshot.questions[0].id,
        answer: "Đã nhớ",
        correct: true,
        attemptedAt: Date.now(),
        mode: "flashcards",
        purpose: "study",
      },
    ];

    assert.throws(
      () => validateBackup(invalidBackup),
      /Tiếng Nhật không có flashcards/,
    );
  });

  test(`${mode}: Ôn tập từ vựng đến hạn (dueOnly: true) luân phiên biến thể giữa các câu đã học`, async (t) => {
    const { repo } = await setup(t, mode);
    const key = "ja:vocab:taberu:eat";
    const v1 = makeJaVocab({ id: "v601", learning_key: key, prompt: "Biến thể 1" });
    const v2 = makeJaVocab({ id: "v602", learning_key: key, prompt: "Biến thể 2" });

    const set = await repo.importQuestions([v1, v2], "variants-due.csv");

    // Học cả 2 biến thể trong unseen mode để cả 2 câu đều là câu đã học
    let s = await repo.startSession({ setId: set.id, mode: "vocabulary" });
    assert.equal(s.queue.length, 2);
    // Câu 1: đúng
    await repo.submit(s.id, s.step, "o1");
    await repo.advance(s.id, s.step);
    s = (await repo.snapshot()).session;
    // Câu 2: đúng
    await repo.submit(s.id, s.step, "o1");
    await repo.advance(s.id, s.step);

    let w = await repo.snapshot();
    let rev = w.reviews.find((r) => r.learningKey === key);
    assert.ok(rev);

    // Chỉnh dueAt về quá khứ để thẻ đến hạn ôn tập
    const pastTime = Date.now() - 2 * 24 * 60 * 60 * 1000;
    await repo.change((workspace) => {
      const r = workspace.reviews.find((item) => item.learningKey === key);
      r.dueAt = pastTime;
      r.lastQuestionId = workspace.questions[0].id; // gán đã làm biến thể 1
    });

    // Bắt đầu session dueOnly: true
    s = await repo.startSession({ setId: set.id, mode: "vocabulary", dueOnly: true });
    assert.equal(s.target, 1, "Chỉ chọn 1 biến thể cho mỗi key đến hạn");
    assert.equal(s.queue[0], w.questions[1].id, "Luân phiên sang biến thể 2");
  });

  test(`${mode}: Lọc theo chapter và lesson cho Tiếng Nhật`, async (t) => {
    const { repo } = await setup(t, mode);
    const q1 = makeJaQuestion({ id: "q701", chapter: "1", lesson: "1" });
    const q2 = makeJaQuestion({ id: "q702", chapter: "1", lesson: "1" });
    const q3 = makeJaQuestion({ id: "q703", chapter: "1", lesson: "2" });
    const q4 = makeJaQuestion({ id: "q704", chapter: "2", lesson: "1" });

    const set = await repo.importQuestions([q1, q2, q3, q4], "chapter-lesson.csv");

    // Lọc chapter 1, lesson 1
    let s = await repo.startSession({
      setId: set.id,
      mode: "grammar",
      chapter: "1",
      lesson: "1",
    });
    assert.equal(s.target, 2);

    // Hủy session
    await repo.endSession(s.id);

    // Lọc chapter 2
    s = await repo.startSession({
      setId: set.id,
      mode: "grammar",
      chapter: "2",
    });
    assert.equal(s.target, 1);
    assert.equal(s.queue[0], (await repo.snapshot()).questions[3].id);
  });

  test(`${mode}: Sao lưu & Khôi phục (Backup & Restore) bảo tồn 100% metadata tiếng Nhật`, async (t) => {
    const { repo, open } = await setup(t, mode);
    const sample8 = await loadSample8();
    const set = await repo.importQuestions(sample8, "ja-backup.csv", "Bộ 8 câu sao lưu");

    // Thực hiện 1 attempt ngữ pháp
    let s = await repo.startSession({ setId: set.id, mode: "grammar", limit: 1 });
    await repo.submit(s.id, s.step, "o2");
    await repo.advance(s.id, s.step);

    const snapshot = await repo.snapshot();
    const backup = exportBackup(snapshot);

    // Validate backup
    const validated = validateBackup(backup);
    assert.equal(validated.questions.length, 8);
    assert.equal(validated.attempts.length, 1);
    assert.equal(validated.imports[0].subject, "japanese");

    // Kiểm tra các trường đặc thù của tiếng Nhật trong câu đã validate
    const g3 = validated.questions.find((q) => q.type === "ja_grammar_order");
    assert.ok(Array.isArray(g3.options), "options giữ dạng mảng object");
    assert.ok(Array.isArray(g3.acceptedOrders), "acceptedOrders được giữ");
    assert.ok(g3.chapter, "chapter được giữ");
    assert.ok(g3.lesson, "lesson được giữ");

    const g2 = validated.questions.find((q) => q.type === "ja_grammar_star");
    assert.equal(g2.starPosition, 3, "starPosition được giữ");

    const v1 = validated.questions.find((q) => q.type === "ja_vocab_context");
    assert.equal(v1.target, "約束", "target được giữ");
    assert.equal(v1.learningKey, "ja:vocab:yakusoku:promise", "learningKey được giữ");

    const k1 = validated.questions.find((q) => q.type === "ja_kanji_reading");
    assert.equal(k1.target, "新聞", "target của kanji được giữ");

    // replaceAll và khôi phục vào kho mới
    await repo.clearAll();
    assert.equal((await repo.snapshot()).questions.length, 0);

    await repo.replaceAll(backup);
    const restoredSnapshot = await repo.snapshot();
    assert.equal(restoredSnapshot.questions.length, 8);
    assert.equal(restoredSnapshot.attempts.length, 1);
    assert.equal(restoredSnapshot.attempts[0].origin, "ja_unseen");
  });
}
