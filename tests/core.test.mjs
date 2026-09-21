import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildCsvPreview, buildStats, CSV_HEADERS, evaluateAnswer, evaluateTrueFalseDetails, normalizeShortAnswer, displayAnswer, formatExplanationHtml, formatInlineMarkdown, isReviewDue, nextReview, normalizeText, parseCsv, QUESTION_TYPES, ENGLISH_QUESTION_TYPES, ALLOWED_SUBJECT_TYPES, resolveEscapeAction, selectQuestions, splitExplanationSections, stableShuffle, encodeSharePayload, decodeSharePayload, MAX_SHARE_BYTES } from "../core.js";
import { questionsToCsv } from "../stats.js";
import { question, vocabulary } from "./helpers.mjs";

test("24 câu kiểm thử bao phủ cả 8 dạng, xuất CSV rồi nhập lại không mất nội dung", async () => {
  const source = await readFile(new URL("./fixtures/exercises.csv", import.meta.url), "utf8");
  const parsed = buildCsvPreview(source);
  assert.deepEqual(parsed.errors, []);
  assert.equal(parsed.rows.length, 24);
  assert.deepEqual([...new Set(parsed.rows.map((q) => q.type))].sort(), [...ENGLISH_QUESTION_TYPES].sort());
  const exported = questionsToCsv(parsed.rows);
  assert.equal(exported[0], "\uFEFF");
  assert.notEqual(exported[1], "\uFEFF");
  assert.deepEqual(buildCsvPreview(exported).rows, parsed.rows);
});

test("mọi ví dụ CSV trong guide nhập được thành từng file một môn", async () => {
  const guide = await readFile(new URL("../QUESTION_CSV_GUIDE.md", import.meta.url), "utf8");
  const blocks = [...guide.matchAll(/```csv\r?\n([\s\S]*?)```/g)].map((m) => m[1]);
  assert.deepEqual(blocks.length, 6);
  const expectedSubjects = ["english", "chemistry", "physics", "biology", "history", "geography"];
  blocks.forEach((block, index) => {
    const parsed = buildCsvPreview(block, `guide-${index}.csv`);
    assert.deepEqual(parsed.errors, []);
    assert.ok(parsed.rows.length >= 2);
    assert.deepEqual([...new Set(parsed.rows.map((q) => q.subject))], [expectedSubjects[index]]);
    assert.ok(parseCsv(block).every((row) => row.length === CSV_HEADERS.length));
  });
});

test("fixture Vật lí dùng để thử upload có 18 cột và chỉ practice lớp 8", async () => {
  const source = await readFile(new URL("./fixtures/physics.csv", import.meta.url), "utf8");
  const parsed = buildCsvPreview(source, "physics.csv");
  assert.deepEqual(parsed.errors, []);
  assert.equal(parsed.rows.length, 2);
  assert.ok(parsed.rows.every((question) => question.subject === "physics" && question.grade === "8" && question.domain === "practice"));
});

test("CSV đọc đúng dấu phẩy, xuống dòng, ngoặc kép và tiếng Việt", () => {
  const q = question({ explanation: 'Ví dụ: "Hello, Mai!"\nĐây là dòng thứ hai.' });
  assert.deepEqual(buildCsvPreview(questionsToCsv([q])).rows[0], q);
  assert.deepEqual(parseCsv('"a,b","He said ""hi"""\r\n"dòng\nmới",x'), [["a,b", 'He said "hi"'], ["dòng\nmới", "x"]]);
});

test("CSV từ chối ngoặc kép lỗi, sai cột, header sai, ký tự lỗi mã hóa", () => {
  for (const value of ['a,"b', 'a,b"c', '"a"x,b']) assert.throws(() => parseCsv(value));
  assert.match(buildCsvPreview('a,"b').errors[0], /ngoặc kép/);
  const csv = questionsToCsv([question()]);
  assert.match(buildCsvPreview(csv.replace("subject,grade", "grade,subject")).errors[0], /đúng 18 cột/);
  assert.match(buildCsvPreview(csv.replace("subject,grade", "subject,subject")).errors[0], /trùng/);
  assert.match(buildCsvPreview(csv.replace("She", "\uFFFD")).errors[0], /UTF-8/);
  assert.match(buildCsvPreview(csv.trim() + ",thua").errors[0], /có 19 cột/);
});

test("CSV 18 cột hỗ trợ bốn môn, còn file Tiếng Anh 16 cột cũ vẫn hợp lệ", () => {
  const science = [
    ["chemistry", "6"],
    ["physics", "7"],
    ["biology", "8"],
  ].map(([subject, grade]) => question({
    subject,
    grade,
    id: `${subject}-1`,
    domain: "practice",
    level: "mixed",
    topic: "Kiến thức cơ bản",
    prompt: "Chọn đáp án đúng.",
    context: "Dữ kiện có đáp án rõ ràng.",
    theory: "Lý thuyết ngắn bằng tiếng Việt có dấu.",
  }));
  for (const q of science) {
    const preview = buildCsvPreview(questionsToCsv([q]));
    assert.deepEqual(preview.errors, []);
    assert.equal(preview.rows[0].subject, q.subject);
    assert.equal(preview.rows[0].grade, q.grade);
    assert.equal(preview.rows[0].domain, "practice");
  }
  const legacy = [
    "id,domain,type,level,topic,subtopic,prompt,context,options,answer,explanation,theory,hint,tags,difficulty,learning_key",
    '"old-1","grammar","fill_blank","A2","Be","","Complete.","She ___ here.","","is","She đi với is.","Hiện tại đơn của be.","","","1",""',
  ].join("\r\n");
  const parsedLegacy = buildCsvPreview(legacy, "english-old.csv");
  assert.deepEqual(parsedLegacy.errors, []);
  assert.equal(parsedLegacy.rows[0].subject, "english");
  assert.equal(parsedLegacy.rows[0].grade, "");
});

test("CSV từ chối môn/lớp/domain sai và trộn nhiều môn trong một file", () => {
  const chemistry = question({ subject: "chemistry", grade: "8", id: "c-1", domain: "practice", level: "mixed", theory: "Lý thuyết." });
  for (const invalid of [
    { ...question({ id: "missing-subject" }), subject: "" },
    { ...chemistry, grade: "10" },
    { ...chemistry, grade: "" },
    { ...chemistry, domain: "grammar" },
    { ...chemistry, subject: "astronomy" },
  ]) {
    assert.ok(buildCsvPreview(questionsToCsv([invalid])).errors.length);
  }
  const biology = { ...chemistry, id: "b-1", subject: "biology", grade: "7" };
  assert.match(buildCsvPreview(questionsToCsv([chemistry, biology])).errors[0], /một môn/);
});

test("CSV kiểm tra bắt buộc và không nhập một phần nếu có dòng sai", () => {
  const invalid = [
    question({ id: "bad id" }), question({ topic: "" }), question({ prompt: "" }), question({ theory: "" }),
    question({ explanation: "" }), question({ domain: "other" }), question({ type: "essay" }),
    question({ difficulty: 6 }), question({ difficulty: 1.5 }), question({ answer: [] }), vocabulary({ learningKey: "" }),
  ];
  for (const q of invalid) {
    const preview = buildCsvPreview(questionsToCsv([question({ id: "valid" }), q]));
    assert.ok(preview.errors.length, JSON.stringify(q));
    assert.equal(preview.rows.length, 0);
  }
  assert.match(buildCsvPreview(questionsToCsv([question(), question()])).errors[0], /trùng/);
});

test("CSV giới hạn kích thước, số dòng, số lựa chọn và độ dài ô", () => {
  assert.match(buildCsvPreview("a".repeat(5 * 1024 * 1024 + 1)).errors[0], /5 MB/);
  assert.match(buildCsvPreview(questionsToCsv([question({ prompt: "a".repeat(10001) })])).errors[0], /10.000/);
  assert.match(buildCsvPreview(questionsToCsv(Array.from({ length: 2001 }, (_, i) => question({ id: `q${i}` })))).errors[0], /2.000/);
  const q = question({ type: "mcq", options: Array.from({ length: 31 }, (_, i) => `${i}`), answer: ["0"] });
  assert.match(buildCsvPreview(questionsToCsv([q])).errors[0], /30 options/);
});

test("Các dạng lựa chọn từ chối trùng, thiếu và đáp án nằm ngoài options", () => {
  const cases = [
    question({ type: "mcq", options: ["is", "IS."], answer: ["is"] }),
    question({ type: "mcq", options: ["is", "are"], answer: ["am"] }),
    question({ type: "mcq", options: ["is", "are"], answer: ["is", "are"] }),
    question({ type: "multiple_select", options: ["is", "are"], answer: ["is"] }),
    question({ type: "multiple_select", options: ["is", "are"], answer: ["is", "is"] }),
    question({ type: "matching", options: [{ left: "a", right: "x" }, { left: "A.", right: "y" }], answer: {} }),
    question({ type: "matching", options: [{ left: "a", right: "x" }, { left: "b", right: "x" }], answer: {} }),
    question({ type: "ordering", options: ["She", "is", "here"], answer: ["She is here", "She is not here"] }),
  ];
  for (const q of cases) assert.ok(buildCsvPreview(questionsToCsv([q])).errors.length, q.type);
});

test("Chấm văn bản chuẩn hóa Unicode, dấu câu, khoảng trắng; không chấp nhận trống", () => {
  assert.equal(normalizeText("  SHE  IS HERE! "), "she is here");
  assert.equal(evaluateAnswer(["isn't"], "ISN’T.", "fill_blank"), true);
  assert.equal(evaluateAnswer(["is not"], "isn't", "fill_blank"), false);
  assert.equal(evaluateAnswer(["is not", "isn't"], "isn't", "fill_blank"), true);
  assert.equal(evaluateAnswer(["café"], "cafe\u0301", "fill_blank"), true);
  assert.equal(evaluateAnswer([""], "", "fill_blank"), false);
});

test("Chấm chọn nhiều và matching yêu cầu đúng đủ toàn bộ", () => {
  assert.equal(evaluateAnswer(["a", "b"], ["B", "A"], "multiple_select"), true);
  for (const answer of [["a"], ["a", "b", "c"], "a"]) assert.equal(evaluateAnswer(["a", "b"], answer, "multiple_select"), false);
  const expected = { borrow: "take", lend: "give" };
  assert.equal(evaluateAnswer(expected, { lend: "Give.", borrow: "TAKE" }, "matching"), true);
  for (const answer of [{ borrow: "take" }, { ...expected, extra: "x" }, null, []]) assert.equal(evaluateAnswer(expected, answer, "matching"), false);
});

test("Ordering giữ đủ số lượng từ trùng và xáo trộn ổn định", () => {
  const q = question({ type: "ordering", options: ["I", "think", "that", "that", "is", "right"], answer: ["I think that that is right."] });
  assert.deepEqual(buildCsvPreview(questionsToCsv([q])).errors, []);
  assert.equal(evaluateAnswer(q.answer, q.options, "ordering"), true);
  assert.deepEqual(stableShuffle(q.options, "key"), stableShuffle(q.options, "key"));
});

test("case-sensitive giữ nhất quán ở options, ordering và chấm Unicode", () => {
  const q = question({
    subject: "chemistry",
    grade: "8",
    id: "co-order-1",
    domain: "practice",
    type: "ordering",
    level: "mixed",
    topic: "Công thức hóa học",
    prompt: "Sắp xếp câu đúng.",
    options: ["CO", "là", "khí"],
    answer: ["CO là khí"],
    theory: "Công thức hóa học phân biệt chữ hoa và chữ thường.",
    tags: ["case-sensitive"],
  });
  assert.deepEqual(buildCsvPreview(questionsToCsv([q])).errors, []);
  assert.ok(buildCsvPreview(questionsToCsv([{ ...q, answer: ["Co là khí"] }])).errors.length);
  assert.equal(evaluateAnswer(q.answer, "CO là khí", "ordering", { caseSensitive: true }), true);
  assert.equal(evaluateAnswer(q.answer, "Co là khí", "ordering", { caseSensitive: true }), false);
  assert.equal(evaluateAnswer(["Café"], "Cafe\u0301", "fill_blank", { caseSensitive: true }), true);
});

test("SRS: đúng giãn 1 ngày, 6 ngày; sai hẹn 10 phút, hệ số trong giới hạn", () => {
  const now = 1_000_000, day = 86_400_000;
  const first = nextReview(null, true, now), second = nextReview(first, true, now);
  assert.equal(first.dueAt, now + day);
  assert.equal(second.dueAt, now + 6 * day);
  assert.ok(nextReview(second, true, now).intervalDays > 6);
  let failed = second;
  for (let i = 0; i < 20; i++) failed = nextReview(failed, false, now);
  assert.equal(failed.dueAt, now + 600_000);
  assert.equal(failed.repetitions, 0);
  assert.equal(failed.ease, 1.3);
});

test("Vocabulary ưu tiên học hết từ mới trước từ SRS đến hạn, khử trùng key", () => {
  const questions = Array.from({ length: 50 }, (_, i) => vocabulary({ id: `v${i}`, learningKey: `key${i}` }));
  const completedLearningKeys = questions.slice(0, 30).map((q) => q.learningKey);
  const reviews = completedLearningKeys.map((learningKey) => ({ learningKey, dueAt: 0 }));
  const selected = selectQuestions([...questions, { ...questions[49], id: "variant" }], reviews, { domain: "vocabulary", completedLearningKeys });
  assert.equal(selected.length, 20);
  assert.equal(new Set(selected.map((q) => q.learningKey)).size, 20);
  assert.ok(selected.every((q) => !completedLearningKeys.includes(q.learningKey)));
  const stats = buildStats(questions, reviews, questions.slice(0, 30).map((q) => ({ questionId: q.id, correct: true })), []);
  assert.equal(stats.vocabularyRemaining, 20);
  assert.equal(stats.due, 20);
});

test("chia sẻ qua link: encode/decode round-trip tiếng Việt, công thức khoa học, giới hạn 50 KB và bắt lỗi hỏng", async () => {
  const source = await readFile(new URL("./fixtures/exercises.csv", import.meta.url), "utf8");
  const parsed = buildCsvPreview(source);
  assert.equal(parsed.errors.length, 0);

  // 1. Round-trip với 24 câu đủ dạng
  const csv = questionsToCsv(parsed.rows);
  const encoded = encodeSharePayload(csv);
  assert.ok(typeof encoded === "string" && encoded.length > 0);
  assert.ok(/^[A-Za-z0-9+/=]+$/.test(encoded));

  const decoded = decodeSharePayload(encoded);
  assert.equal(decoded, csv);

  const reimported = buildCsvPreview(decoded);
  assert.deepEqual(reimported.errors, []);
  assert.equal(reimported.rows.length, 24);

  // 2. Kiểm tra giới hạn 50 KB (51.200 bytes)
  const hugePayload = "A".repeat(50 * 1024 + 1);
  assert.throws(() => decodeSharePayload(hugePayload), /vượt quá giới hạn 50 KB/);

  // 3. Base64 bị hỏng
  assert.throws(() => decodeSharePayload("Not-Valid-Base64!!#$"), /Base64/);

  // 4. UTF-8 bị hỏng
  // 0xFF 0xFF là byte UTF-8 không hợp lệ
  const invalidUtf8Base64 = btoa(String.fromCharCode(0xff, 0xff, 0xff));
  assert.throws(() => decodeSharePayload(invalidUtf8Base64), /UTF-8/);
});

test("selectQuestions với dueOnly: true chỉ chọn đúng các thẻ từ vựng đến hạn ôn SRS", () => {
  const now = new Date("2026-09-11T12:00:00").getTime();
  const day = 86_400_000;
  const questions = [
    vocabulary({ id: "v1", learningKey: "key1" }),
    vocabulary({ id: "v2", learningKey: "key2" }),
    vocabulary({ id: "v3", learningKey: "key3" }),
    vocabulary({ id: "v4", learningKey: "key4" }),
  ];
  const reviews = [
    { learningKey: "key1", dueAt: now - day },
    { learningKey: "key2", dueAt: now + 2 * 3600 * 1000 },
    { learningKey: "key3", dueAt: now + day },
  ];
  const completedLearningKeys = ["key1", "key2", "key3"];

  // Khi dueOnly: false và còn từ mới v4 -> chọn từ mới trước
  const defaultSelected = selectQuestions(questions, reviews, {
    domain: "vocabulary",
    now,
    completedLearningKeys,
    dueOnly: false,
  });
  assert.equal(defaultSelected.length, 1);
  assert.equal(defaultSelected[0].id, "v4");

  // Khi dueOnly: true -> bỏ qua từ mới v4, chỉ chọn v1 và v2 (đến hạn hôm nay hoặc quá hạn)
  const dueSelected = selectQuestions(questions, reviews, {
    domain: "vocabulary",
    now,
    completedLearningKeys,
    dueOnly: true,
  });
  assert.equal(dueSelected.length, 2);
  const selectedKeys = new Set(dueSelected.map((q) => q.learningKey));
  assert.ok(selectedKeys.has("key1"));
  assert.ok(selectedKeys.has("key2"));
  assert.ok(!selectedKeys.has("key3")); // ngày mai
  assert.ok(!selectedKeys.has("key4")); // từ mới
});

test("isReviewDue: phân biệt đúng thẻ lapse 10 phút (intervalDays = 0) và chu kỳ ngày dài (intervalDays >= 1)", () => {
  const now = new Date("2026-09-12T10:00:00").getTime();
  const minute = 60_000;
  const day = 86_400_000;

  // Thẻ vừa bấm "Chưa nhớ" (lapse 10 phút):
  const lapsedFuture = { dueAt: now + 10 * minute, intervalDays: 0 };
  assert.equal(isReviewDue(lapsedFuture, now), false, "Lapse 10 phút chưa hết giờ không được coi là đến hạn");

  const lapsedAlmost = { dueAt: now + 1, intervalDays: 0 };
  assert.equal(isReviewDue(lapsedAlmost, now), false, "Lapse còn 1ms cũng chưa đến hạn");

  const lapsedExact = { dueAt: now, intervalDays: 0 };
  assert.equal(isReviewDue(lapsedExact, now), true, "Lapse đúng thời điểm now là đến hạn");

  const lapsedExpired = { dueAt: now - 5 * minute, intervalDays: 0 };
  assert.equal(isReviewDue(lapsedExpired, now), true, "Lapse đã qua 10 phút là đến hạn");

  // Thẻ có chu kỳ ngày dài (intervalDays >= 1):
  const dayLaterToday = { dueAt: now + 4 * 3600 * 1000, intervalDays: 1 };
  assert.equal(isReviewDue(dayLaterToday, now), true, "Chu kỳ ngày đến hạn trong ngày hôm nay phải coi là đến hạn");

  const dayOverdue = { dueAt: now - day, intervalDays: 3 };
  assert.equal(isReviewDue(dayOverdue, now), true, "Chu kỳ ngày quá hạn phải coi là đến hạn");

  const dayTomorrow = { dueAt: now + day, intervalDays: 1 };
  assert.equal(isReviewDue(dayTomorrow, now), false, "Chu kỳ ngày mai chưa đến hạn");

  // Invalid / null
  assert.equal(isReviewDue(null, now), false);
  assert.equal(isReviewDue({}, now), false);
  assert.equal(isReviewDue({ dueAt: NaN }, now), false);
});

test("selectQuestions với dueOnly: true không chọn thẻ lapse 10 phút chưa hết thời gian chờ", () => {
  const now = new Date("2026-09-12T10:00:00").getTime();
  const questions = [
    vocabulary({ id: "v1", learningKey: "key1" }),
    vocabulary({ id: "v2", learningKey: "key2" }),
  ];
  // key1: thẻ lapse vừa trả lời Chưa nhớ (10 phút sau)
  // key2: thẻ lapse đã quá 10 phút
  const reviews = [
    { learningKey: "key1", dueAt: now + 10 * 60_000, intervalDays: 0 },
    { learningKey: "key2", dueAt: now - 1000, intervalDays: 0 },
  ];
  const completedLearningKeys = ["key1", "key2"];

  const selected = selectQuestions(questions, reviews, {
    domain: "vocabulary",
    now,
    completedLearningKeys,
    dueOnly: true,
  });

  assert.equal(selected.length, 1);
  assert.equal(selected[0].id, "v2");

  // Khi thời gian trôi qua 10 phút, key1 cũng được chọn
  const laterSelected = selectQuestions(questions, reviews, {
    domain: "vocabulary",
    now: now + 10 * 60_000,
    completedLearningKeys,
    dueOnly: true,
  });
  assert.equal(laterSelected.length, 2);
});

test("resolveEscapeAction: khi học Flashcards ở mặt sau thì unflip trước, chỉ khi ở mặt trước mới pause", () => {
  // Modal mở -> đóng modal
  assert.equal(resolveEscapeAction({ modalOpen: true, view: "study", sessionMode: "flashcards", flipped: true }), "close-modal");
  assert.equal(resolveEscapeAction({ modalOpen: true, view: "home" }), "close-modal");

  // Flashcards đang học và đang lật mặt sau (!result && flipped) -> unflip
  assert.equal(resolveEscapeAction({ modalOpen: false, view: "study", sessionMode: "flashcards", sessionResult: null, flipped: true }), "unflip");

  // Flashcards đang ở mặt trước (flipped: false) -> pause
  assert.equal(resolveEscapeAction({ modalOpen: false, view: "study", sessionMode: "flashcards", sessionResult: null, flipped: false }), "pause");

  // Flashcards đã chấm xong (result truthy) -> pause (không unflip)
  assert.equal(resolveEscapeAction({ modalOpen: false, view: "study", sessionMode: "flashcards", sessionResult: { correct: true }, flipped: true }), "pause");

  // Chế độ grammar/practice trong study -> pause
  assert.equal(resolveEscapeAction({ modalOpen: false, view: "study", sessionMode: "grammar", flipped: false }), "pause");

  // Ngoài màn hình study -> null (không làm gì)
  assert.equal(resolveEscapeAction({ modalOpen: false, view: "home" }), null);
  assert.equal(resolveEscapeAction({ modalOpen: false, view: "library" }), null);
});

test("formatExplanationHtml: tách dòng, in đậm câu hoàn chỉnh và nhãn giải thích", () => {
  const sample1 = 'Câu hoàn chỉnh: スケジュールに無理があることが分かったので、計画を立て直す必要がある。 Dịch câu: "Vì nhận thấy lịch trình có điểm bất hợp lý nên chúng tôi cần phải lập lại kế hoạch." Động từ 立てる bỏ ます thành 立て直す (lập lại, xây dựng lại kế hoạch).';
  const sections = splitExplanationSections(sample1);
  assert.equal(sections.length, 3);
  assert.equal(sections[0].label, "Câu hoàn chỉnh");
  assert.equal(sections[0].content, "スケジュールに無理があることが分かったので、計画を立て直す必要がある。");
  assert.equal(sections[1].label, "Dịch câu");
  assert.equal(sections[1].content, '"Vì nhận thấy lịch trình có điểm bất hợp lý nên chúng tôi cần phải lập lại kế hoạch."');
  assert.equal(sections[2].label, "Giải thích");
  assert.match(sections[2].content, /Động từ 立てる/);

  const html = formatExplanationHtml(sample1, { isJapanese: true });
  // Kiểm tra in đậm nhãn
  assert.match(html, /<strong class="explanation-label">Câu hoàn chỉnh:<\/strong>/);
  assert.match(html, /<strong class="explanation-label">Dịch câu:<\/strong>/);
  assert.match(html, /<strong class="explanation-label">Giải thích:<\/strong>/);
  // Kiểm tra in đậm câu tiếng Nhật
  assert.match(html, /<strong class="explanation-sentence" lang="ja">スケジュールに無理があることが分かったので、計画を立て直す必要がある。<\/strong>/);
  // Kiểm tra có đủ 3 dòng riêng biệt
  assert.equal((html.match(/class="explanation-row/g) || []).length, 3);
});

test("formatExplanationHtml: hỗ trợ ruby, thứ tự đúng G2 và markdown inline", () => {
  const sampleG2 = 'Thứ tự đúng: 友達 (3) → に (2) → もらった (4) → 本 (1). Câu hoàn chỉnh: これは{友達|ともだち}にもらった本です。Dịch câu: "Đây là sách bạn tặng." Mảnh ở vị trí ★ (số 3) là もらった.';
  const htmlG2 = formatExplanationHtml(sampleG2, { isJapanese: true });
  assert.match(htmlG2, /<strong class="explanation-label">Thứ tự đúng:<\/strong>/);
  assert.match(htmlG2, /<ruby>友達<rt>ともだち<\/rt><\/ruby>/);
  assert.match(htmlG2, /<strong class="explanation-sentence" lang="ja">/);
  assert.match(htmlG2, /<strong class="explanation-label">Dịch câu:<\/strong>/);
  assert.match(htmlG2, /<strong class="explanation-label">Vị trí ★:<\/strong>/);

  const sampleMd = '**Lưu ý:** Cần chú ý từ `test` và **in đậm**.';
  const htmlMd = formatExplanationHtml(sampleMd, { isJapanese: false });
  assert.match(htmlMd, /<strong class="explanation-label">Lưu ý:<\/strong>/);
  assert.match(htmlMd, /<code>test<\/code>/);
  assert.match(htmlMd, /<strong>in đậm<\/strong>/);
});

test("formatExplanationHtml (U1): tuân theo tùy chọn showRuby khi render tiếng Nhật", () => {
  const text = "Câu hoàn chỉnh: {学校|がっこう}へ行きます。";
  const withRuby = formatExplanationHtml(text, { isJapanese: true, showRuby: true });
  assert.match(withRuby, /<ruby>学校<rt>がっこう<\/rt><\/ruby>/);

  const withoutRuby = formatExplanationHtml(text, { isJapanese: true, showRuby: false });
  assert.doesNotMatch(withoutRuby, /<rt>/);
  assert.doesNotMatch(withoutRuby, /<ruby>/);
  assert.match(withoutRuby, /学校へ行きます。/);
});

test("formatExplanationHtml (U2): không làm mất hoặc lộ dấu markdown ở biên nội dung", () => {
  // Đậm bao quanh toàn bộ nội dung
  const t1 = "Giải thích: **Quan trọng**";
  const h1 = formatExplanationHtml(t1, { isJapanese: false });
  assert.match(h1, /<span class="explanation-text"><strong>Quan trọng<\/strong><\/span>/);

  // Đậm ở cuối nội dung
  const t2 = "Giải thích: Đây là **đáp án đúng**";
  const h2 = formatExplanationHtml(t2, { isJapanese: false });
  assert.match(h2, /Đây là <strong>đáp án đúng<\/strong>/);
  assert.doesNotMatch(h2, /\*\*/);

  // Đậm ở đầu nội dung
  const t3 = "Giải thích: **Quan trọng** ở đây.";
  const h3 = formatExplanationHtml(t3, { isJapanese: false });
  assert.match(h3, /<strong>Quan trọng<\/strong> ở đây\./);
  assert.doesNotMatch(h3, /\*\*/);

  // Nhãn có bao quanh bởi markdown **
  const t4 = "**Giải thích:** **Cần chú ý** điểm này.";
  const h4 = formatExplanationHtml(t4, { isJapanese: false });
  assert.match(h4, /<strong class="explanation-label">Giải thích:<\/strong>/);
  assert.match(h4, /<strong>Cần chú ý<\/strong> điểm này\./);
  assert.doesNotMatch(h4, /\*\*/);
});

test("formatExplanationHtml (U3): nhận diện trực tiếp nhãn Vị trí ★ và giữ nguyên newline nội bộ", () => {
  const text = 'Dịch câu: ① Câu thứ nhất.\n② Câu thứ hai.\nVị trí ★: o2\nGiải thích: Mẫu câu N4.';
  const sections = splitExplanationSections(text);
  assert.equal(sections.length, 3);
  assert.equal(sections[0].label, "Dịch câu");
  assert.equal(sections[0].content, "① Câu thứ nhất.\n② Câu thứ hai.");
  assert.equal(sections[1].label, "Vị trí ★");
  assert.equal(sections[1].content, "o2");
  assert.equal(sections[2].label, "Giải thích");
  assert.equal(sections[2].content, "Mẫu câu N4.");

  const html = formatExplanationHtml(text, { isJapanese: true });
  assert.match(html, /explanation-row-translation/);
  assert.match(html, /① Câu thứ nhất\.\n② Câu thứ hai\./);
  assert.match(html, /explanation-row-star/);
  assert.match(html, /<strong class="explanation-label">Vị trí ★:<\/strong>/);
});

test("formatInlineMarkdown (U4): bảo vệ nội dung inline code, không parse đậm/nghiêng bên trong code", () => {
  const input = "Dùng `**mẫu**` và `*nghiêng*` cùng **in đậm** ở đây.";
  const result = formatInlineMarkdown(input);
  assert.match(result, /<code>\*\*mẫu\*\*<\/code>/);
  assert.match(result, /<code>\*nghiêng\*<\/code>/);
  assert.match(result, /<strong>in đậm<\/strong>/);
  assert.doesNotMatch(result, /<code><strong>/);
  assert.doesNotMatch(result, /<code><em>/);
});

test("splitExplanationSections: không tách nhầm marker nằm bên trong inline code span", () => {
  const text = [
    "Câu hoàn chỉnh: きのう、友達と映画を見ました。",
    "Dịch câu: \"Hôm qua, tôi đã xem phim cùng bạn.\"",
    "Giải thích: Hãy chú ý đoạn `Dịch câu: ví dụ` hoặc `Vị trí ★: 3` không được coi là nhãn.",
  ].join("\n");

  const sections = splitExplanationSections(text);
  assert.equal(sections.length, 3);
  assert.equal(sections[0].label, "Câu hoàn chỉnh");
  assert.equal(sections[1].label, "Dịch câu");
  assert.equal(sections[2].label, "Giải thích");
  assert.ok(sections[2].content.includes("`Dịch câu: ví dụ`"));
  assert.ok(sections[2].content.includes("`Vị trí ★: 3`"));

  const html = formatExplanationHtml(text, { isJapanese: true });
  assert.match(html, /<code>Dịch câu: ví dụ<\/code>/);
  assert.match(html, /<code>Vị trí ★: 3<\/code>/);
});

test("buildCsvPreview: 13 tổ hợp môn và dạng bài THCS hợp lệ được phân tích chính xác", () => {
  const header = "subject,grade,id,domain,type,level,topic,subtopic,prompt,context,options,answer,explanation,theory,hint,tags,difficulty,learning_key\n";
  const validRows = [
    // Chemistry (3 types)
    `"chemistry","8","c1","practice","mcq","mixed","Hóa","","Chọn đáp án","","A||B||C||D","A","gt","lt","","","1",""`,
    `"chemistry","8","c2","practice","true_false","mixed","Hóa","","Đúng sai","","Ý 1||Ý 2||Ý 3||Ý 4","true||false||true||false","gt","lt","","","2",""`,
    `"chemistry","8","c3","practice","short_answer","mixed","Hóa","","Trả lời ngắn","","","18","gt","lt","","","2",""`,
    // Physics (3 types)
    `"physics","7","p1","practice","mcq","mixed","Lí","","Chọn đáp án","","A||B||C||D","B","gt","lt","","","1",""`,
    `"physics","7","p2","practice","true_false","mixed","Lí","","Đúng sai","","Ý 1||Ý 2||Ý 3||Ý 4","false||true||false||true","gt","lt","","","2",""`,
    `"physics","7","p3","practice","short_answer","mixed","Lí","","Trả lời ngắn","","","10 m/s","gt","lt","","","2",""`,
    // Biology (3 types)
    `"biology","6","b1","practice","mcq","mixed","Sinh","","Chọn đáp án","","A||B||C||D","C","gt","lt","","","1",""`,
    `"biology","6","b2","practice","true_false","mixed","Sinh","","Đúng sai","","Ý 1||Ý 2||Ý 3||Ý 4","true||true||true||true","gt","lt","","","2",""`,
    `"biology","6","b3","practice","short_answer","mixed","Sinh","","Trả lời ngắn","","","lục lạp","gt","lt","","","1",""`,
    // History (2 types)
    `"history","9","h1","practice","mcq","mixed","Sử","","Chọn đáp án","","A||B||C||D","D","gt","lt","","","2",""`,
    `"history","9","h2","practice","true_false","mixed","Sử","","Đúng sai","","Ý 1||Ý 2||Ý 3||Ý 4","false||false||true||false","gt","lt","","","2",""`,
    // Geography (2 types)
    `"geography","6","g1","practice","mcq","mixed","Địa","","Chọn đáp án","","A||B||C||D","A","gt","lt","","","1",""`,
    `"geography","6","g2","practice","true_false","mixed","Địa","","Đúng sai","","Ý 1||Ý 2||Ý 3||Ý 4","true||false||false||true","gt","lt","","","2",""`,
  ];

  // Test each row individually in its single-subject CSV
  for (const row of validRows) {
    const preview = buildCsvPreview(header + row);
    assert.deepEqual(preview.errors, [], `Lỗi khi parse row: ${row}`);
    assert.equal(preview.rows.length, 1);
  }

  // Check true_false properties
  const tfPreview = buildCsvPreview(header + validRows[1]);
  assert.equal(tfPreview.rows[0].type, "true_false");
  assert.deepEqual(tfPreview.rows[0].options, ["Ý 1", "Ý 2", "Ý 3", "Ý 4"]);
  assert.deepEqual(tfPreview.rows[0].answer, ["true", "false", "true", "false"]);

  // Check short_answer properties
  const saPreview = buildCsvPreview(header + validRows[2]);
  assert.equal(saPreview.rows[0].type, "short_answer");
  assert.deepEqual(saPreview.rows[0].options, []);
  assert.deepEqual(saPreview.rows[0].answer, ["18"]);
});

test("buildCsvPreview: từ chối các vi phạm về môn, lớp, dạng bài và cấu trúc câu hỏi THCS", () => {
  const header = "subject,grade,id,domain,type,level,topic,subtopic,prompt,context,options,answer,explanation,theory,hint,tags,difficulty,learning_key\n";

  // 1. Tiếng Anh từ chối true_false và short_answer
  const engTf = buildCsvPreview(header + `"english","","e1","grammar","true_false","B1","T","","P","","A||B||C||D","true||true||true||true","gt","lt","","","1",""`);
  assert.match(engTf.errors[0], /Tiếng Anh không hỗ trợ dạng bài Đúng\/Sai/);
  const engSa = buildCsvPreview(header + `"english","","e2","grammar","short_answer","B1","T","","P","","","ans","gt","lt","","","1",""`);
  assert.match(engSa.errors[0], /Tiếng Anh không hỗ trợ dạng bài Trả lời ngắn/);

  // 2. Sử và Địa từ chối short_answer
  const hisSa = buildCsvPreview(header + `"history","7","h1","practice","short_answer","mixed","T","","P","","","ans","gt","lt","","","1",""`);
  assert.match(hisSa.errors[0], /Môn Lịch sử chỉ hỗ trợ dạng mcq và true_false/);
  const geoSa = buildCsvPreview(header + `"geography","6","g1","practice","short_answer","mixed","T","","P","","","ans","gt","lt","","","1",""`);
  assert.match(geoSa.errors[0], /Môn Địa lí chỉ hỗ trợ dạng mcq và true_false/);

  // 3. Sử và Địa mcq bắt buộc đúng 4 lựa chọn
  const hisMcq3 = buildCsvPreview(header + `"history","7","h1","practice","mcq","mixed","T","","P","","A||B||C","A","gt","lt","","","1",""`);
  assert.match(hisMcq3.errors[0], /mcq môn Sử và Địa bắt buộc phải có đúng 4 phương án/);
  const geoMcq5 = buildCsvPreview(header + `"geography","6","g1","practice","mcq","mixed","T","","P","","A||B||C||D||E","A","gt","lt","","","1",""`);
  assert.match(geoMcq5.errors[0], /mcq môn Sử và Địa bắt buộc phải có đúng 4 phương án/);

  // 4. true_false cần đúng 4 mệnh đề không rỗng và đúng 4 đáp án true/false
  const tf3opt = buildCsvPreview(header + `"chemistry","8","c1","practice","true_false","mixed","T","","P","","A||B||C","true||true||true||true","gt","lt","","","1",""`);
  assert.match(tf3opt.errors[0], /true_false cần đúng 4 mệnh đề/);
  const tfEmptyOpt = buildCsvPreview(header + `"chemistry","8","c1","practice","true_false","mixed","T","","P","","A||B||||D","true||true||true||true","gt","lt","","","1",""`);
  assert.match(tfEmptyOpt.errors[0], /true_false cần đúng 4 mệnh đề/);
  const tf3ans = buildCsvPreview(header + `"chemistry","8","c1","practice","true_false","mixed","T","","P","","A||B||C||D","true||true||true","gt","lt","","","1",""`);
  assert.match(tf3ans.errors[0], /true_false cần đúng 4 đáp án true\/false/);
  const tfBadAns = buildCsvPreview(header + `"chemistry","8","c1","practice","true_false","mixed","T","","P","","A||B||C||D","true||yes||true||false","gt","lt","","","1",""`);
  assert.match(tfBadAns.errors[0], /Đáp án ý b của true_false phải là "true" hoặc "false"/);

  // 5. short_answer cần đáp án không rỗng
  const saEmpty = buildCsvPreview(header + `"chemistry","8","c1","practice","short_answer","mixed","T","","P","","","","gt","lt","","","1",""`);
  assert.match(saEmpty.errors[0], /short_answer cần ít nhất một đáp án hợp lệ/);

  // 6. THCS grade bắt buộc 6-9 và domain=practice
  const badGrade = buildCsvPreview(header + `"chemistry","5","c1","practice","mcq","mixed","T","","P","","A||B||C||D","A","gt","lt","","","1",""`);
  assert.match(badGrade.errors[0], /Hóa, Lí, Sinh, Sử và Địa cần grade là 6, 7, 8 hoặc 9/);
  const badDomain = buildCsvPreview(header + `"history","7","h1","grammar","mcq","mixed","T","","P","","A||B||C||D","A","gt","lt","","","1",""`);
  assert.match(badDomain.errors[0], /Hóa, Lí, Sinh, Sử và Địa dùng practice/);

  // 7. Cảnh báo warnings cho bộ Hóa/Lí/Sinh cũ
  const chemLegacy = buildCsvPreview(header + `"chemistry","8","c1","practice","fill_blank","mixed","T","","P","","","18","gt","lt","","","1",""`);
  assert.equal(chemLegacy.errors.length, 0);
  assert.ok(chemLegacy.warnings.length > 0);
  assert.match(chemLegacy.warnings[0], /Dạng bài "fill_blank" là dạng cũ/);

  const chemMcq3 = buildCsvPreview(header + `"chemistry","8","c1","practice","mcq","mixed","T","","P","","A||B||C","A","gt","lt","","","1",""`);
  assert.equal(chemMcq3.errors.length, 0);
  assert.ok(chemMcq3.warnings.length > 0);
  assert.match(chemMcq3.warnings[0], /mcq môn Hóa học nên có đúng 4 phương án/);
});

test("evaluateAnswer & evaluateTrueFalseDetails: chấm Đúng/Sai chính xác toàn bộ và chi tiết từng ý", () => {
  const expected = ["true", "false", "true", "false"];
  const options = ["Ý A", "Ý B", "Ý C", "Ý D"];

  // Đủ 4/4 ý đúng
  assert.equal(evaluateAnswer(expected, ["true", "false", "true", "false"], "true_false"), true);
  const d4 = evaluateTrueFalseDetails(expected, ["true", "false", "true", "false"], options);
  assert.equal(d4.correct, true);
  assert.equal(d4.correctCount, 4);
  assert.equal(d4.isComplete, true);
  assert.equal(d4.items[0].correct, true);
  assert.equal(d4.items[1].correct, true);
  assert.equal(d4.items[2].correct, true);
  assert.equal(d4.items[3].correct, true);

  // Đúng 3/4 ý -> câu trả lời bị tính là sai (correct = false)
  assert.equal(evaluateAnswer(expected, ["true", "false", "true", "true"], "true_false"), false);
  const d3 = evaluateTrueFalseDetails(expected, ["true", "false", "true", "true"], options);
  assert.equal(d3.correct, false);
  assert.equal(d3.correctCount, 3);
  assert.equal(d3.isComplete, true);
  assert.equal(d3.items[3].correct, false);
  assert.equal(d3.items[3].expected, "false");
  assert.equal(d3.items[3].received, "true");

  // Đúng 1/4 và 0/4
  assert.equal(evaluateAnswer(expected, ["true", "true", "false", "true"], "true_false"), false);
  const d1 = evaluateTrueFalseDetails(expected, ["true", "true", "false", "true"], options);
  assert.equal(d1.correctCount, 1);
  assert.equal(d1.correct, false);

  // Nhận chưa đủ 4 ý hoặc chứa chuỗi rỗng
  assert.equal(evaluateAnswer(expected, ["true", "false", ""], "true_false"), false);
  const incomplete = evaluateTrueFalseDetails(expected, ["true", "false", "", "true"], options);
  assert.equal(incomplete.isComplete, false);
  assert.equal(incomplete.correct, false);
  assert.equal(incomplete.correctCount, 2);
});

test("evaluateAnswer & normalizeShortAnswer: Trả lời ngắn chuẩn hóa chữ, khoảng trắng, số, dấu câu và tag case-sensitive", () => {
  // 1. Không case-sensitive: so sánh không phân biệt hoa thường
  assert.equal(evaluateAnswer(["18"], "18", "short_answer"), true);
  assert.equal(evaluateAnswer(["CO2"], "co2", "short_answer"), true);
  assert.equal(evaluateAnswer(["lục lạp"], "Lục lạp", "short_answer"), true);
  assert.equal(evaluateAnswer(["lục lạp"], "  lục   lạp  ", "short_answer"), true);

  // 2. Unicode NFKC (ký tự toàn giác/bán giác)
  assert.equal(evaluateAnswer(["18"], "１８", "short_answer"), true);

  // 3. Giữ nguyên số và dấu câu (không bị normalizeText cắt dấu câu)
  assert.equal(evaluateAnswer(["1.5"], "1.5", "short_answer"), true);
  assert.equal(evaluateAnswer(["1,5"], "1,5", "short_answer"), true);

  // 4. Có nhiều đáp án thay thế
  assert.equal(evaluateAnswer(["1,5", "1.5"], "1.5", "short_answer"), true);
  assert.equal(evaluateAnswer(["1,5", "1.5"], "1,5", "short_answer"), true);
  assert.equal(evaluateAnswer(["1,5", "1.5"], "2.0", "short_answer"), false);

  // 5. case-sensitive tag
  const csSettings = { tags: ["case-sensitive"] };
  assert.equal(evaluateAnswer(["CO"], "CO", "short_answer", csSettings), true);
  assert.equal(evaluateAnswer(["CO"], "Co", "short_answer", csSettings), false);
  assert.equal(evaluateAnswer(["Co"], "Co", "short_answer", csSettings), true);
  assert.equal(evaluateAnswer(["Co"], "CO", "short_answer", csSettings), false);

  // 6. Rỗng hoặc kiểu dữ liệu không hợp lệ
  assert.equal(evaluateAnswer(["18"], "", "short_answer"), false);
  assert.equal(evaluateAnswer(["18"], "   ", "short_answer"), false);
  assert.equal(evaluateAnswer(["18"], null, "short_answer"), false);
  assert.equal(evaluateAnswer(["18"], 18, "short_answer"), false);
});

test("displayAnswer: định dạng hiển thị cho câu hỏi Đúng/Sai và Trả lời ngắn", () => {
  const tfQ = {
    type: "true_false",
    answer: ["true", "false", "true", "false"],
    options: ["A", "B", "C", "D"],
  };
  assert.equal(displayAnswer(tfQ.answer, tfQ), "a: Đúng · b: Sai · c: Đúng · d: Sai");

  const saQ1 = {
    type: "short_answer",
    answer: ["18"],
  };
  assert.equal(displayAnswer(saQ1.answer, saQ1), "18");

  const saQ2 = {
    type: "short_answer",
    answer: ["1,5", "1.5"],
  };
  assert.equal(displayAnswer(saQ2.answer, saQ2), "1,5 / 1.5");
});

test("short_answer: từ chối options không rỗng và từ chối đáp án vượt quá 200 ký tự", () => {
  const header = `subject,grade,id,domain,type,level,topic,subtopic,prompt,context,options,answer,explanation,theory,hint,tags,difficulty,learning_key\n`;

  // 1. options không rỗng -> lỗi
  const withOptions = buildCsvPreview(header + `"chemistry","8","c1","practice","short_answer","mixed","T","","P","","A||B","18","gt","lt","","","1",""`);
  assert.equal(withOptions.rows.length, 0);
  assert.match(withOptions.errors[0], /short_answer không dùng options, trường options phải để trống/);

  // 2. answer > 200 ký tự -> lỗi
  const longAns = "a".repeat(201);
  const withLongAns = buildCsvPreview(header + `"chemistry","8","c2","practice","short_answer","mixed","T","","P","","","${longAns}","gt","lt","","","1",""`);
  assert.equal(withLongAns.rows.length, 0);
  assert.match(withLongAns.errors[0], /đáp án của short_answer không được vượt quá 200 ký tự/);

  // 3. answer đúng 200 ký tự -> hợp lệ
  const exact200 = "b".repeat(200);
  const withExact200 = buildCsvPreview(header + `"chemistry","8","c3","practice","short_answer","mixed","T","","P","","","${exact200}","gt","lt","","","1",""`);
  assert.equal(withExact200.errors.length, 0);
  assert.equal(withExact200.rows.length, 1);
  assert.equal(withExact200.rows[0].answer[0], exact200);
});

test("QUESTION_CSV_GUIDE: câu Lịch sử h-tf-002 có nội dung và đáp án lịch sử chính xác", async () => {
  const guide = await readFile(new URL("../QUESTION_CSV_GUIDE.md", import.meta.url), "utf8");
  assert.ok(guide.includes('"h-tf-002"'));
  assert.ok(guide.includes("false||true||false||true"));
  assert.ok(guide.includes("Ý a sai vì đạo thủy binh do Ô Mã Nhi và Phàn Tiếp chỉ huy"));
  assert.ok(guide.includes("Trần Hưng Đạo được phong Quốc công Tiết chế thống lĩnh toàn quân ở lần 2"));
});






