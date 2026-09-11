import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildCsvPreview, buildStats, CSV_HEADERS, evaluateAnswer, nextReview, normalizeText, parseCsv, QUESTION_TYPES, selectQuestions, stableShuffle, encodeSharePayload, decodeSharePayload, MAX_SHARE_BYTES } from "../core.js";
import { questionsToCsv } from "../stats.js";
import { question, vocabulary } from "./helpers.mjs";

test("24 câu kiểm thử bao phủ cả 8 dạng, xuất CSV rồi nhập lại không mất nội dung", async () => {
  const source = await readFile(new URL("./fixtures/exercises.csv", import.meta.url), "utf8");
  const parsed = buildCsvPreview(source);
  assert.deepEqual(parsed.errors, []);
  assert.equal(parsed.rows.length, 24);
  assert.deepEqual([...new Set(parsed.rows.map((q) => q.type))].sort(), [...QUESTION_TYPES].sort());
  const exported = questionsToCsv(parsed.rows);
  assert.equal(exported[0], "\uFEFF");
  assert.notEqual(exported[1], "\uFEFF");
  assert.deepEqual(buildCsvPreview(exported).rows, parsed.rows);
});

test("mọi ví dụ CSV trong guide nhập được thành từng file một môn", async () => {
  const guide = await readFile(new URL("../QUESTION_CSV_GUIDE.md", import.meta.url), "utf8");
  const blocks = [...guide.matchAll(/```csv\r?\n([\s\S]*?)```/g)].map((m) => m[1]);
  assert.deepEqual(blocks.length, 4);
  const expectedSubjects = ["english", "chemistry", "physics", "biology"];
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
