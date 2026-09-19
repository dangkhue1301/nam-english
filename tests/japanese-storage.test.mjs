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

  test(`${mode}: SRS không tăng lịch ôn trước hạn khi từ đang trong chu kỳ lapse (dueAt > now và interval = 0)`, async (t) => {
    const { repo } = await setup(t, mode);
    const key = "ja:vocab:test:lapse";
    const v1 = makeJaVocab({ id: "v101", learning_key: key, prompt: "Câu 1" });
    const v2 = makeJaVocab({ id: "v102", learning_key: key, prompt: "Câu 2" });
    const set = await repo.importQuestions([v1, v2], "lapse.csv");

    // Lượt 1: làm v1 sai -> rơi vào lapse 10 phút
    let s = await repo.startSession({ setId: set.id, mode: "vocabulary", limit: 1 });
    await repo.submit(s.id, s.step, "o2"); // sai
    await repo.advance(s.id, s.step);
    s = (await repo.snapshot()).session;
    await repo.submit(s.id, s.step, "o1"); // retry đúng để kết thúc phiên
    await repo.advance(s.id, s.step);
    
    let w = await repo.snapshot();
    let rev = w.reviews.find((r) => r.learningKey === key);
    assert.equal(rev.intervalDays, 0);
    assert.equal(rev.lapses, 1);
    const initialDueAt = rev.dueAt;

    // Lượt 2: làm biến thể mới v2 (cùng key) đúng trước khi hết hạn 10 phút
    s = await repo.startSession({ setId: set.id, mode: "vocabulary", limit: 1 });
    await repo.submit(s.id, s.step, "o1"); // v2 đúng
    await repo.advance(s.id, s.step);
    
    w = await repo.snapshot();
    rev = w.reviews.find((r) => r.learningKey === key);
    // KHÔNG được đẩy lịch lên 1 ngày, vẫn giữ trong chu kỳ lapse
    assert.equal(rev.intervalDays, 0);
    assert.equal(rev.dueAt, initialDueAt);
  });

  test(`${mode}: endSession sớm khi đã làm 1/3 câu đúng KHÔNG bị tính là lapse/sai`, async (t) => {
    const { repo } = await setup(t, mode);
    const key = "ja:vocab:test:early";
    const v1 = makeJaVocab({ id: "v201", learning_key: key, prompt: "Câu 1" });
    const v2 = makeJaVocab({ id: "v202", learning_key: key, prompt: "Câu 2" });
    const v3 = makeJaVocab({ id: "v203", learning_key: key, prompt: "Câu 3" });
    const set = await repo.importQuestions([v1, v2, v3], "early.csv");
    
    let s = await repo.startSession({ setId: set.id, mode: "vocabulary" });
    await repo.submit(s.id, s.step, "o1"); // v1 đúng
    await repo.advance(s.id, s.step);
    
    // Thoát sớm khi mới làm 1/3 câu
    await repo.endSession(s.id);
    
    const w = await repo.snapshot();
    const event = w.srsEvents.find(e => e.learningKey === key);
    assert.ok(event, "Có sự kiện SRS được lưu");
    assert.equal(event.applied, true, "Đã chốt sự kiện");
    const rev = w.reviews.find(r => r.learningKey === key);
    assert.ok(rev, "Đã tạo bản ghi review");
    assert.equal(rev.lastGrade, 4, "Chốt đúng trên các câu đã làm");
    assert.equal(rev.lapses, 0, "Không bị phạt lapse thành sai");
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

  test(`${mode}: B2 - validateBackup từ chối nghiêm ngặt các sự kiện SRS hỏng trong v3 và giữ nguyên kho`, async (t) => {
    const { repo } = await setup(t, mode);
    const v1 = makeJaVocab({ id: "v901", learning_key: "ja:vocab:test:safe" });
    const set = await repo.importQuestions([v1], "safe.csv");

    const snap = await repo.snapshot();
    const backup = exportBackup(snap);
    assert.equal(backup.version, 3, "Backup xuất version 3");

    const qId = snap.questions[0].id;

    // 1. Timestamp không hợp lệ trong srsEvents -> PHẢI BỊ TỪ CHỐI
    const corruptTsBackup = structuredClone(backup);
    corruptTsBackup.snapshot.srsEvents = [
      {
        id: "e1",
        sessionId: "sess-1",
        learningKey: "ja:vocab:test:safe",
        questionIds: [qId],
        firstAnswers: { [qId]: true },
        applied: false,
        createdAt: NaN,
        updatedAt: Date.now(),
      },
    ];
    assert.throws(
      () => validateBackup(corruptTsBackup),
      /mốc thời gian không hợp lệ/,
      "Phải từ chối timestamp NaN"
    );

    // 2. ID câu hỏi không tồn tại trong questionIds
    const corruptQIdBackup = structuredClone(backup);
    corruptQIdBackup.snapshot.srsEvents = [
      {
        id: "e2",
        sessionId: "sess-1",
        learningKey: "ja:vocab:test:safe",
        questionIds: ["non-existent-q"],
        firstAnswers: { "non-existent-q": true },
        applied: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
    assert.throws(
      () => validateBackup(corruptQIdBackup),
      /trỏ đến câu hỏi không tồn tại/,
      "Phải từ chối câu hỏi không tồn tại"
    );

    // 3. firstAnswers không phải boolean (ví dụ chuỗi "true")
    const corruptAnsBackup = structuredClone(backup);
    corruptAnsBackup.snapshot.srsEvents = [
      {
        id: "e3",
        sessionId: "sess-1",
        learningKey: "ja:vocab:test:safe",
        questionIds: [qId],
        firstAnswers: { [qId]: "true" },
        applied: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
    assert.throws(
      () => validateBackup(corruptAnsBackup),
      /không phải boolean/,
      "Phải từ chối câu trả lời không phải boolean"
    );

    // 4. applied là chuỗi "false" thay vì boolean false
    const corruptAppliedBackup = structuredClone(backup);
    corruptAppliedBackup.snapshot.srsEvents = [
      {
        id: "e4",
        sessionId: "sess-1",
        learningKey: "ja:vocab:test:safe",
        questionIds: [qId],
        firstAnswers: { [qId]: true },
        applied: "false",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
    assert.throws(
      () => validateBackup(corruptAppliedBackup),
      /trạng thái applied không phải boolean/,
      "Phải từ chối applied dạng chuỗi 'false'"
    );

    // 5. Trùng lặp event ID
    const corruptDupBackup = structuredClone(backup);
    corruptDupBackup.snapshot.srsEvents = [
      {
        id: "dup-1",
        sessionId: "sess-1",
        learningKey: "ja:vocab:test:safe",
        questionIds: [qId],
        firstAnswers: { [qId]: true },
        applied: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: "dup-1",
        sessionId: "sess-1",
        learningKey: "ja:vocab:test:safe",
        questionIds: [qId],
        firstAnswers: { [qId]: true },
        applied: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
    assert.throws(
      () => validateBackup(corruptDupBackup),
      /bị lỗi hoặc trùng ID/,
      "Phải từ chối trùng ID sự kiện"
    );

    // 6. Chứng minh kho hiện tại hoàn toàn không bị ảnh hưởng khi replaceAll bản backup lỗi
    const beforeSnap = await repo.snapshot();
    await assert.rejects(async () => {
      await repo.replaceAll(corruptTsBackup);
    });
    const afterSnap = await repo.snapshot();
    assert.equal(afterSnap.questions.length, beforeSnap.questions.length);
    assert.equal(afterSnap.imports.length, beforeSnap.imports.length);
  });

  test(`${mode}: B1 - Nâng cấp workspace cũ có phiên dở dang: bảo toàn SRS pending khi xuất và khôi phục`, async (t) => {
    const { repo, open, values, storage } = await setup(t, mode);
    const key1 = "ja:vocab:taberu:eat";
    const key2 = "ja:vocab:nomu:drink";
    const q1 = makeJaVocab({ id: "v911", learning_key: key1 });
    const q2 = makeJaVocab({ id: "v912", learning_key: key1 });
    const q3 = makeJaVocab({ id: "v913", learning_key: key2 });
    const set = await repo.importQuestions([q1, q2, q3], "legacy-session.csv");

    const answerTime = Date.now() - 3600000;
    // Bắt đầu một session vocabulary và trả lời sai q1 (thuộc key1), chưa trả lời q2 (thuộc key1) và q3 (thuộc key2)
    let s = await repo.startSession({ setId: set.id, mode: "vocabulary" });
    await repo.change((w) => {
      // Giả lập workspace bản cũ: xóa srsEvents hoàn toàn nhưng session đang dở có firstAnswers
      delete w.srsEvents;
      w.session.firstAnswers = { [w.questions[0].id]: false };
      w.session.keyEvaluated = { [key1]: false };
      w.attempts.push({
        id: `${w.session.id}:0`,
        questionId: w.questions[0].id,
        originalQuestionId: w.questions[0].originalId,
        setId: set.id,
        answer: "o2",
        correct: false,
        grade: 1,
        attemptedAt: answerTime,
        mode: "vocabulary",
        purpose: "study",
        origin: "ja_unseen",
      });
    });

    // Xuất backup ngay lập tức từ snapshot
    const snapBefore = await repo.snapshot();
    const backup = exportBackup(snapBefore);
    assert.equal(backup.version, 3);
    assert.ok(Array.isArray(backup.snapshot.srsEvents));
    assert.equal(backup.snapshot.srsEvents.length, 1, "Đã migrate sự kiện pending vào backup");
    const ev = backup.snapshot.srsEvents[0];
    assert.equal(ev.learningKey, key1);
    assert.equal(ev.applied, false);
    assert.equal(ev.firstAnswers[snapBefore.questions[0].id], false);
    assert.equal(ev.createdAt, answerTime, "Thời gian lấy từ attempt gốc");

    // Khôi phục vào một repository mới
    const repo2 = await open();
    await repo2.clearAll();
    await repo2.replaceAll(backup);

    const snapRestored = await repo2.snapshot();
    assert.equal(snapRestored.questions.length, 3);
    assert.equal(snapRestored.attempts.length, 1);
    // Kiểm tra review đã được tạo đúng với kết quả sai (lapse = 1, interval = 0) theo thời điểm gốc
    const rev = snapRestored.reviews.find((r) => r.learningKey === key1);
    assert.ok(rev, "Review đã được tạo từ sự kiện pending");
    assert.equal(rev.repetitions, 0);
    assert.equal(rev.intervalDays, 0);
    assert.equal(rev.lapses, 1);
    assert.equal(rev.lastReviewedAt, answerTime, "Thời gian review đúng theo lúc trả lời gốc");

    // Kiểm tra tính idempotent: chạy lại checkWorkspace hoặc replaceAll lần nữa không nhân đôi review
    await repo2.replaceAll(backup);
    const snapAgain = await repo2.snapshot();
    assert.equal(snapAgain.reviews.filter((r) => r.learningKey === key1).length, 1);
  });

  test(`${mode}: P1 - deleteSet dọn dẹp srsEvents trỏ đến câu hỏi trong bộ bị xóa, backup xuất ra khôi phục an toàn`, async (t) => {
    const { repo } = await setup(t, mode);
    const v1 = makeJaVocab({ id: "v101", learning_key: "ja:vocab:inu:dog" });
    const v2 = makeJaVocab({ id: "v102", learning_key: "ja:vocab:neko:cat" });
    const set1 = await repo.importQuestions([v1], "set1.csv", "Bộ 1");
    const set2 = await repo.importQuestions([v2], "set2.csv", "Bộ 2");

    const snap = await repo.snapshot();
    const q1 = snap.questions.find((q) => q.originalId === "v101" || q.id === "v101");
    const q2 = snap.questions.find((q) => q.originalId === "v102" || q.id === "v102");

    await repo.change((w) => {
      w.srsEvents = [
        {
          id: "ev1",
          sessionId: "s1",
          learningKey: "ja:vocab:inu:dog",
          questionIds: [q1.id],
          firstAnswers: { [q1.id]: true },
          applied: false,
          appliedAt: null,
          createdAt: Date.now() - 1000,
          updatedAt: Date.now() - 1000,
        },
        {
          id: "ev2",
          sessionId: "s2",
          learningKey: "ja:vocab:neko:cat",
          questionIds: [q2.id],
          firstAnswers: { [q2.id]: true },
          applied: false,
          appliedAt: null,
          createdAt: Date.now() - 500,
          updatedAt: Date.now() - 500,
        },
      ];
    });

    // Xóa set1
    await repo.deleteSet(set1.id);

    // Snapshot sau xóa: ev1 bị dọn vì trỏ đến q1 đã xóa, ev2 vẫn còn
    const snapAfterDelete = await repo.snapshot();
    assert.equal(snapAfterDelete.srsEvents.length, 1);
    assert.equal(snapAfterDelete.srsEvents[0].id, "ev2");

    // Export backup và restore: không bị ném lỗi validateBackup trỏ đến câu không tồn tại
    const backup = exportBackup(snapAfterDelete);
    const validated = validateBackup(backup);
    assert.ok(validated);

    await repo.replaceAll(backup);
    const snapRestored = await repo.snapshot();
    assert.equal(snapRestored.questions.length, 1);
    assert.equal(snapRestored.reviews.length, 1);
    assert.equal(snapRestored.reviews[0].learningKey, "ja:vocab:neko:cat");
  });

  test(`${mode}: P1 - replaceAll chỉ khử trùng lặp trong cùng phiên (sessionId + learningKey), không gộp các phiên khác nhau`, async (t) => {
    const { repo } = await setup(t, mode);
    const v1 = makeJaVocab({ id: "v201", learning_key: "ja:vocab:tori:bird" });
    await repo.importQuestions([v1], "birds.csv", "Bộ chim");

    const snap = await repo.snapshot();
    const q = snap.questions[0];

    const baseTime = Date.now() - 600000;
    const backup = exportBackup(snap);
    backup.snapshot.srsEvents = [
      {
        id: "ev_dup_1",
        sessionId: "sess_a",
        learningKey: "ja:vocab:tori:bird",
        questionIds: [q.id],
        firstAnswers: { [q.id]: false },
        applied: false,
        appliedAt: null,
        createdAt: baseTime,
        updatedAt: baseTime,
      },
      {
        id: "ev_dup_2",
        sessionId: "sess_a",
        learningKey: "ja:vocab:tori:bird",
        questionIds: [q.id],
        firstAnswers: { [q.id]: false },
        applied: false,
        appliedAt: null,
        createdAt: baseTime + 1000,
        updatedAt: baseTime + 1000,
      },
      {
        id: "ev_sess_2",
        sessionId: "sess_b",
        learningKey: "ja:vocab:tori:bird",
        questionIds: [q.id],
        firstAnswers: { [q.id]: true },
        applied: false,
        appliedAt: null,
        createdAt: baseTime + 300000,
        updatedAt: baseTime + 300000,
      },
    ];

    await repo.replaceAll(backup);

    const snapAfter = await repo.snapshot();
    const revs = snapAfter.reviews.filter((r) => r.learningKey === "ja:vocab:tori:bird");
    assert.equal(revs.length, 1, "Chỉ có đúng 1 bản ghi review");
    assert.equal(revs[0].intervalDays, 0, "Đúng trong 10 phút sau khi sai giữ interval = 0 ngày, không bị mất phiên trước");
    assert.equal(revs[0].lapses, 1, "Lapses phải là 1 từ phiên trước");
  });

  test(`${mode}: P2 - xóa bộ trong phiên trộn chốt SRS còn hợp lệ trước khi đóng phiên`, async (t) => {
    const { repo } = await setup(t, mode);
    const v1 = makeJaVocab({ id: "v501", learning_key: "ja:vocab:ringo:apple" });
    const v2 = makeJaVocab({ id: "v502", learning_key: "ja:vocab:mikan:orange" });
    const set1 = await repo.importQuestions([v1], "apples.csv", "Bộ Táo");
    const set2 = await repo.importQuestions([v2], "oranges.csv", "Bộ Cam");

    const snap = await repo.snapshot();
    const q1 = snap.questions.find((q) => q.originalId === "v501" || q.id === "v501");
    const q2 = snap.questions.find((q) => q.originalId === "v502" || q.id === "v502");

    await repo.change((w) => {
      w.session = {
        id: "mixed_sess_1",
        mode: "vocabulary",
        setId: set1.id,
        setIds: [set1.id, set2.id],
        startedAt: Date.now() - 5000,
        updatedAt: Date.now() - 1000,
        keyQuestions: {
          "ja:vocab:ringo:apple": [q1.id],
          "ja:vocab:mikan:orange": [q2.id],
        },
        firstAnswers: {
          [q2.id]: true,
        },
        keyEvaluated: {},
      };
      w.srsEvents = [
        {
          id: `mixed_sess_1:ja:vocab:mikan:orange`,
          sessionId: "mixed_sess_1",
          learningKey: "ja:vocab:mikan:orange",
          questionIds: [q2.id],
          firstAnswers: { [q2.id]: true },
          applied: false,
          appliedAt: null,
          createdAt: Date.now() - 1000,
          updatedAt: Date.now() - 1000,
        },
      ];
    });

    await repo.deleteSet(set1.id);

    const snapAfter = await repo.snapshot();
    assert.equal(snapAfter.session, null);
    const revOrange = snapAfter.reviews.find((r) => r.learningKey === "ja:vocab:mikan:orange");
    assert.ok(revOrange, "Phải có review cho từ của bộ còn lại ngay sau khi xóa bộ kia");
    assert.equal(revOrange.repetitions, 1);
    assert.equal(revOrange.intervalDays, 1);

    const evOrange = snapAfter.srsEvents.find((e) => e.learningKey === "ja:vocab:mikan:orange");
    assert.ok(evOrange);
    assert.equal(evOrange.applied, true, "Sự kiện SRS của bộ còn lại phải được đánh dấu applied: true");
  });

  test(`${mode}: P2 - migrateSessionSrsEvents chỉ lấy attempt của session hiện tại, không lấy nhầm attempt phiên cũ`, async (t) => {
    const { repo } = await setup(t, mode);
    const v1 = makeJaVocab({ id: "v301", learning_key: "ja:vocab:uma:horse" });
    await repo.importQuestions([v1], "horse.csv");

    const snap = await repo.snapshot();
    const q = snap.questions[0];

    const oldSessionTime = 1000000;
    const currentSessionTime = 2000000;

    await repo.change((w) => {
      w.attempts = [
        {
          id: "old_session_123:v301",
          questionId: q.id,
          answer: "o1",
          correct: true,
          grade: 1,
          attemptedAt: oldSessionTime,
          mode: "vocabulary",
          purpose: "study",
        },
      ];
      w.session = {
        id: "current_session_456",
        mode: "vocabulary",
        startedAt: currentSessionTime,
        updatedAt: currentSessionTime,
        keyQuestions: {
          "ja:vocab:uma:horse": [q.id],
        },
        firstAnswers: {
          [q.id]: true,
        },
        keyEvaluated: {},
      };
      delete w.srsEvents;
    });

    const snapAfter = await repo.snapshot();
    const ev = snapAfter.srsEvents.find((e) => e.learningKey === "ja:vocab:uma:horse");
    assert.ok(ev, "Sự kiện được migrate thành công");
    assert.equal(ev.createdAt, currentSessionTime, "Mốc thời gian phải theo session hiện tại, không nhặt của session cũ");
  });

  test(`${mode}: P2 - dataOnly cắt tỉa sự kiện SRS applied vượt quá 5.000, đảm bảo backup hợp lệ với validateBackup`, async (t) => {
    const { repo } = await setup(t, mode);
    const v1 = makeJaVocab({ id: "v401", learning_key: "ja:vocab:sakana:fish" });
    await repo.importQuestions([v1], "fish.csv");

    const snap = await repo.snapshot();
    const q = snap.questions[0];

    await repo.change((w) => {
      w.srsEvents = [];
      const base = Date.now() - 10000000;
      for (let i = 0; i < 5010; i++) {
        w.srsEvents.push({
          id: `applied_${i}`,
          sessionId: `sess_${i}`,
          learningKey: "ja:vocab:sakana:fish",
          questionIds: [q.id],
          firstAnswers: { [q.id]: true },
          applied: true,
          appliedAt: base + i * 10,
          createdAt: base + i * 10,
          updatedAt: base + i * 10,
        });
      }
      w.srsEvents.push({
        id: "pending_1",
        sessionId: "sess_pending",
        learningKey: "ja:vocab:sakana:fish",
        questionIds: [q.id],
        firstAnswers: { [q.id]: true },
        applied: false,
        appliedAt: null,
        createdAt: Date.now() - 100,
        updatedAt: Date.now() - 100,
      });
    });

    const snapWithManyEvents = await repo.snapshot();
    assert.equal(snapWithManyEvents.srsEvents.length, 5011);

    const backup = exportBackup(snapWithManyEvents);
    assert.ok(backup.snapshot.srsEvents.length <= 5000, `Số lượng event xuất ra phải <= 5000, thực tế: ${backup.snapshot.srsEvents.length}`);
    assert.ok(backup.snapshot.srsEvents.some((e) => e.id === "pending_1"), "Phải giữ lại pending event");

    const validated = validateBackup(backup);
    assert.ok(validated);
    await repo.replaceAll(backup);

    const restoredSnap = await repo.snapshot();
    assert.ok(restoredSnap.srsEvents.length <= 5000);
  });

  test(`${mode}: P2 - dataOnly cắt tỉa khi có hơn 5.000 pending events, backup xuất ra luôn <= 5000 và khôi phục hợp lệ`, async (t) => {
    const { repo } = await setup(t, mode);
    const v1 = makeJaVocab({ id: "v601", learning_key: "ja:vocab:kame:turtle" });
    await repo.importQuestions([v1], "turtle.csv");

    const snap = await repo.snapshot();
    const q = snap.questions[0];

    await repo.change((w) => {
      w.srsEvents = [];
      const base = Date.now() - 10000000;
      for (let i = 0; i < 5005; i++) {
        w.srsEvents.push({
          id: `pending_only_${i}`,
          sessionId: `sess_p_${i}`,
          learningKey: "ja:vocab:kame:turtle",
          questionIds: [q.id],
          firstAnswers: { [q.id]: true },
          applied: false,
          appliedAt: null,
          createdAt: base + i * 10,
          updatedAt: base + i * 10,
        });
      }
    });

    const snapWithManyPending = await repo.snapshot();
    assert.equal(snapWithManyPending.srsEvents.length, 5005);

    const backup = exportBackup(snapWithManyPending);
    assert.ok(backup.snapshot.srsEvents.length <= 5000, `Số lượng event xuất ra phải <= 5000, thực tế: ${backup.snapshot.srsEvents.length}`);
    assert.equal(backup.snapshot.srsEvents.length, 5000);

    const validated = validateBackup(backup);
    assert.ok(validated);
    await repo.replaceAll(backup);

    const restoredSnap = await repo.snapshot();
    assert.ok(restoredSnap.srsEvents.length <= 5000);
  });
}


