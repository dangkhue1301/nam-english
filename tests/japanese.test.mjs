import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildCsvPreview } from "../core.js";
import {
  JA_SCHEMA,
  JA_SUBJECT,
  JA_CSV_HEADERS,
  JA_QUESTION_TYPES,
  JA_SECTIONS,
  JA_LEVELS,
  JA_TYPE_LABELS,
  parseRubyTokens,
  renderRubyHtml,
  stripRuby,
  parseJapaneseCsv,
  japaneseQuestionsToCsv,
  evaluateJapaneseAnswer,
  formatJapaneseSentence,
  escapeHtml,
  escapeCsvCell,
} from "../japanese.js";

// Helper to construct a valid base Japanese question row for negative testing
function baseQuestion(overrides = {}) {
  return {
    schema: "ja-v1",
    subject: "japanese",
    id: "g001",
    level: "N5",
    chapter: "1",
    lesson: "1",
    section: "grammar",
    topic: "Thì quá khứ",
    type: "ja_grammar_choice",
    prompt: "Chọn đáp án đúng.",
    context: "きのう、友達と映画を{{gap}}。",
    target: "",
    options: JSON.stringify([
      { id: "o1", text: "見ます" },
      { id: "o2", text: "見ました" },
      { id: "o3", text: "見る" },
      { id: "o4", text: "見ません" },
    ]),
    answer: "o2",
    accepted_orders: "",
    star_position: "",
    explanation: "きのう nghĩa là hôm qua. 見ました là quá khứ.",
    theory: "Động từ lịch sự quá khứ dùng ました.",
    hint: "",
    learning_key: "",
    ...overrides,
  };
}

function questionRowToCsv(raw) {
  const lines = [
    JA_CSV_HEADERS.join(","),
    JA_CSV_HEADERS.map((h) => escapeCsvCell(raw[h] ?? "")).join(","),
  ];
  return lines.join("\r\n");
}

function questionsRowsToCsv(rawList) {
  const lines = [JA_CSV_HEADERS.join(",")];
  rawList.forEach((raw) => {
    lines.push(JA_CSV_HEADERS.map((h) => escapeCsvCell(raw[h] ?? "")).join(","));
  });
  return lines.join("\r\n");
}

// -------------------------------------------------------------
// 1. Constants & Exports
// -------------------------------------------------------------
test("Hằng số và cấu hình tiếng Nhật ja-v1 đầy đủ", () => {
  assert.equal(JA_SCHEMA, "ja-v1");
  assert.equal(JA_SUBJECT, "japanese");
  assert.equal(JA_CSV_HEADERS.length, 20);
  assert.deepEqual(JA_CSV_HEADERS, [
    "schema", "subject", "id", "level", "chapter", "lesson", "section", "topic",
    "type", "prompt", "context", "target", "options", "answer", "accepted_orders",
    "star_position", "explanation", "theory", "hint", "learning_key",
  ]);
  assert.equal(JA_QUESTION_TYPES.length, 8);
  assert.deepEqual(JA_SECTIONS, ["kanji", "grammar", "vocabulary"]);
  assert.deepEqual(JA_LEVELS, ["N5", "N4", "N3", "N2", "N1"]);
  assert.equal(Object.keys(JA_TYPE_LABELS).length, 8);
  JA_QUESTION_TYPES.forEach((type) => {
    assert.ok(JA_TYPE_LABELS[type], `Thiếu nhãn tiếng Việt cho ${type}`);
  });
});

// -------------------------------------------------------------
// 2. Ruby parsing, rendering & stripping
// -------------------------------------------------------------
test("parseRubyTokens: parse chính xác text thuần và ruby {base|rt}", () => {
  assert.deepEqual(parseRubyTokens(""), []);
  assert.deepEqual(parseRubyTokens(null), []);

  const plain = parseRubyTokens("毎朝、新聞を読みます。");
  assert.deepEqual(plain, [{ type: "text", text: "毎朝、新聞を読みます。" }]);

  const ruby = parseRubyTokens("明日の{約束|やくそく}を忘れないでください。");
  assert.deepEqual(ruby, [
    { type: "text", text: "明日の" },
    { type: "ruby", base: "約束", rt: "やくそく" },
    { type: "text", text: "を忘れないでください。" },
  ]);

  const multiRuby = parseRubyTokens("{私|わたし}は{日本|にほん}に{行|い}きます。");
  assert.deepEqual(multiRuby, [
    { type: "ruby", base: "私", rt: "わたし" },
    { type: "text", text: "は" },
    { type: "ruby", base: "日本", rt: "にほん" },
    { type: "text", text: "に" },
    { type: "ruby", base: "行", rt: "い" },
    { type: "text", text: "きます。" },
  ]);
});

test("parseRubyTokens: bảo tồn token chỗ trống {{gap}} và {{slots}}", () => {
  const gapTokens = parseRubyTokens("きのう、友達と映画を{{gap}}。");
  assert.deepEqual(gapTokens, [{ type: "text", text: "きのう、友達と映画を{{gap}}。" }]);

  const slotsTokens = parseRubyTokens("これは{{slots}}です。");
  assert.deepEqual(slotsTokens, [{ type: "text", text: "これは{{slots}}です。" }]);
});

test("parseRubyTokens: từ chối cú pháp lỗi, lồng token, rỗng, hoặc HTML", () => {
  assert.throws(() => parseRubyTokens("{a|{b|c}}"), /lồng token|không hợp lệ/);
  assert.throws(() => parseRubyTokens("{{a|b}|c}"), /lồng token|không hợp lệ/);
  assert.throws(() => parseRubyTokens("{|かな}"), /để trống base hoặc rt/);
  assert.throws(() => parseRubyTokens("{漢字|}"), /để trống base hoặc rt/);
  assert.throws(() => parseRubyTokens("{ | }"), /để trống base hoặc rt/);
  assert.throws(() => parseRubyTokens("{漢字}"), /thiếu dấu '\|'/);
  assert.throws(() => parseRubyTokens("{漢字|かな|ふりがな}"), /nhiều hơn một dấu '\|'/);
  assert.throws(() => parseRubyTokens("unclosed {bracket"), /chưa đóng/);
  assert.throws(() => parseRubyTokens("stray}bracket"), /đóng thừa/);
  assert.throws(() => parseRubyTokens("{\n漢字|かな}"), /xuống dòng/);
  assert.throws(() => parseRubyTokens("{<b>漢字</b>|かな}"), /HTML không được phép/);
  assert.throws(() => parseRubyTokens("<b>test</b>"), /HTML không được phép/);
  assert.throws(() => parseRubyTokens("{{other}}"), /Token không hợp lệ/);
});

test("renderRubyHtml: chuyển đổi an toàn sang HTML và hỗ trợ bật/tắt, hideTarget", () => {
  const text = "明日の{約束|やくそく}を忘れないでください。";

  // showRuby: true (default)
  const htmlFull = renderRubyHtml(text);
  assert.equal(htmlFull, "明日の<ruby>約束<rt>やくそく</rt></ruby>を忘れないでください。");

  // showRuby: false -> chỉ hiển thị base
  const htmlNoRuby = renderRubyHtml(text, { showRuby: false });
  assert.equal(htmlNoRuby, "明日の約束を忘れないでください。");

  // hideTarget = "約束" -> không sinh <rt> cho từ đích (chống lộ đáp án K1)
  const htmlHideTarget = renderRubyHtml(text, { showRuby: true, hideTarget: "約束" });
  assert.equal(htmlHideTarget, "明日の約束を忘れないでください。");

  // hideTarget khác không ảnh hưởng ruby của từ khác
  const multiText = "{毎朝|まいあさ}、{新聞|しんぶん}を読みます。";
  const htmlHideOne = renderRubyHtml(multiText, { showRuby: true, hideTarget: "新聞" });
  assert.equal(htmlHideOne, "<ruby>毎朝<rt>まいあさ</rt></ruby>、新聞を読みます。");

  // XSS protection
  const unsafeText = "{A&B|c<d}";
  const htmlEscaped = renderRubyHtml(unsafeText);
  assert.equal(htmlEscaped, "<ruby>A&amp;B<rt>c&lt;d</rt></ruby>");
});

test("stripRuby: loại bỏ hoàn toàn furigana giữ nguyên chữ gốc", () => {
  assert.equal(stripRuby("明日の{約束|やくそく}を忘れないでください。"), "明日の約束を忘れないでください。");
  assert.equal(stripRuby("{毎朝|まいあさ}、{新聞|しんぶん}を読みます。"), "毎朝、新聞を読みます。");
  assert.equal(stripRuby("きのう、友達と映画を{{gap}}。"), "きのう、友達と映画を{{gap}}。");
  assert.equal(stripRuby(""), "");
});

// -------------------------------------------------------------
// 3. Parser mẫu 8 câu trong JAPANESE_CSV_GUIDE.md thành công 0 lỗi
// -------------------------------------------------------------
test("buildCsvPreview: nhận diện đúng file CSV tiếng Nhật khi header có BOM UTF-8 và dấu ngoặc kép", () => {
  const csv = `\uFEFF"schema","subject","id","level","chapter","lesson","section","topic","type","prompt","context","target","options","answer","accepted_orders","star_position","explanation","theory","hint","learning_key"\r\n"ja-v1","japanese","1","N5","1","1","grammar","topic","ja_grammar_choice","prompt","Đây là {{gap}} sách.","","[{""id"":""o1"",""text"":""1""},{""id"":""o2"",""text"":""2""},{""id"":""o3"",""text"":""3""},{""id"":""o4"",""text"":""4""}]","o1","","","Giải thích có bản dịch","theory","",""`;
  const result = buildCsvPreview(csv, "test.csv");
  assert.equal(result.errors.length, 0);
  assert.equal(result.rows.length, 1);
  assert.equal(result.rows[0].subject, "japanese");
});

test("Parse bộ mẫu 8 câu trong JAPANESE_CSV_GUIDE.md thành công 0 lỗi", async () => {
  const guide = await readFile(new URL("../JAPANESE_CSV_GUIDE.md", import.meta.url), "utf8");
  const blocks = [...guide.matchAll(/```csv\r?\n([\s\S]*?)```/g)].map((m) => m[1]);
  const sampleCsv = blocks.find((b) => b.includes("g001"));
  assert.ok(sampleCsv, "Không tìm thấy khối CSV 8 câu trong JAPANESE_CSV_GUIDE.md");

  const parsed = parseJapaneseCsv(sampleCsv, "sample-8.csv");

  assert.deepEqual(parsed.errors, []);
  assert.equal(parsed.rows.length, 8);
  assert.equal(parsed.questions.length, 8);

  const parsedTypes = parsed.rows.map((q) => q.type);
  assert.deepEqual(parsedTypes, JA_QUESTION_TYPES);

  // Kiểm tra từng dạng câu
  const [g1, g2, g3, v1, v2, v3, k1, k2] = parsed.rows;

  // G1
  assert.equal(g1.id, "g001");
  assert.equal(g1.type, "ja_grammar_choice");
  assert.equal(g1.answer, "o2");
  assert.equal(g1.options.length, 4);
  assert.equal(g1.accepted_orders, null);
  assert.equal(g1.star_position, null);

  // G2
  assert.equal(g2.id, "g002");
  assert.equal(g2.type, "ja_grammar_star");
  assert.equal(g2.star_position, 3);
  assert.equal(g2.starPosition, 3);
  assert.equal(g2.answer, "o4");
  assert.deepEqual(g2.accepted_orders, [["o3", "o2", "o4", "o1"]]);

  // G3
  assert.equal(g3.id, "g003");
  assert.equal(g3.type, "ja_grammar_order");
  assert.equal(g3.answer, "");
  assert.equal(g3.options.length, 4);
  assert.deepEqual(g3.accepted_orders, [["p4", "p3", "p1", "p2"]]);

  // V1
  assert.equal(v1.id, "v001");
  assert.equal(v1.type, "ja_vocab_context");
  assert.equal(v1.target, "約束");
  assert.equal(v1.learning_key, "ja:vocab:yakusoku:promise");
  assert.ok(v1.context.includes("\n"));

  // V2
  assert.equal(v2.id, "v002");
  assert.equal(v2.type, "ja_vocab_paraphrase");
  assert.equal(v2.target, "約束");

  // V3
  assert.equal(v3.id, "v003");
  assert.equal(v3.type, "ja_vocab_usage");
  assert.equal(v3.target, "約束");

  // K1
  assert.equal(k1.id, "k001");
  assert.equal(k1.type, "ja_kanji_reading");
  assert.equal(k1.target, "新聞");
  assert.equal(k1.learning_key, "");

  // K2
  assert.equal(k2.id, "k002");
  assert.equal(k2.type, "ja_kanji_writing");
  assert.equal(k2.target, "あたらしい");
  assert.equal(k2.learning_key, "");
});

// -------------------------------------------------------------
// 4. Round-trip: parse CSV -> japaneseQuestionsToCsv -> parse lại deepEqual 100%
// -------------------------------------------------------------
test("Round-trip: parse CSV -> japaneseQuestionsToCsv -> parse lại deepEqual 100%", async () => {
  const guide = await readFile(new URL("../JAPANESE_CSV_GUIDE.md", import.meta.url), "utf8");
  const blocks = [...guide.matchAll(/```csv\r?\n([\s\S]*?)```/g)].map((m) => m[1]);
  const sampleCsv = blocks.find((b) => b.includes("g001"));

  const parsed1 = parseJapaneseCsv(sampleCsv, "original.csv");
  assert.deepEqual(parsed1.errors, []);
  assert.equal(parsed1.rows.length, 8);

  const exportedCsv = japaneseQuestionsToCsv(parsed1.rows);

  // Có UTF-8 BOM
  assert.equal(exportedCsv.charCodeAt(0), 0xFEFF);

  const parsed2 = parseJapaneseCsv(exportedCsv, "exported.csv");
  assert.deepEqual(parsed2.errors, []);
  assert.equal(parsed2.rows.length, 8);

  // Deep equal 100%
  assert.deepEqual(parsed2.rows, parsed1.rows);
});

// -------------------------------------------------------------
// 5. Negative fixtures testing
// -------------------------------------------------------------
test("Negative: sai header, thiếu/thừa cột, trùng cột, file quá lớn", () => {
  // Thiếu 1 cột (19 cột)
  const header19 = JA_CSV_HEADERS.slice(0, 19).join(",");
  const p1 = parseJapaneseCsv(`${header19}\r\n${"dummy,".repeat(18)}dummy\r\n`);
  assert.match(p1.errors[0], /đúng 20 cột/);

  // Header trùng cột
  const dupHeader = [...JA_CSV_HEADERS.slice(0, 19), JA_CSV_HEADERS[0]].join(",");
  const p2 = parseJapaneseCsv(`${dupHeader}\r\n${"dummy,".repeat(19)}dummy\r\n`);
  assert.match(p2.errors[0], /trùng/);

  // File trống / chỉ có header
  const p3 = parseJapaneseCsv(`${JA_CSV_HEADERS.join(",")}\r\n`);
  assert.match(p3.errors[0], /chưa có dòng dữ liệu/);

  // Ký tự encoding lỗi \uFFFD
  const p4 = parseJapaneseCsv(`${JA_CSV_HEADERS.join(",")}\r\nja-v1,\uFFFD`);
  assert.match(p4.errors[0], /UTF-8/);
});

test("Negative: sai id hoặc id trùng trong file", () => {
  const q1 = baseQuestion({ id: "dup-1" });
  const q2 = baseQuestion({ id: "dup-1" });
  const pDup = parseJapaneseCsv(questionsRowsToCsv([q1, q2]));
  assert.match(pDup.errors[0], /id bị trùng: dup-1/);

  const qInvalidId = baseQuestion({ id: "-bad_start" });
  const pBad = parseJapaneseCsv(questionRowToCsv(qInvalidId));
  assert.match(pBad.errors[0], /id chỉ dùng/);
});

test("Negative: sai level, chapter, lesson, schema, subject", () => {
  assert.match(
    parseJapaneseCsv(questionRowToCsv(baseQuestion({ schema: "ja-v2" }))).errors[0],
    /schema phải là ja-v1/,
  );
  assert.match(
    parseJapaneseCsv(questionRowToCsv(baseQuestion({ subject: "english" }))).errors[0],
    /subject phải là japanese/,
  );
  assert.match(
    parseJapaneseCsv(questionRowToCsv(baseQuestion({ level: "B2" }))).errors[0],
    /level phải là một trong/,
  );
  assert.match(
    parseJapaneseCsv(questionRowToCsv(baseQuestion({ chapter: "0" }))).errors[0],
    /chapter phải là số nguyên từ 1 đến 999/,
  );
  assert.match(
    parseJapaneseCsv(questionRowToCsv(baseQuestion({ lesson: "1000" }))).errors[0],
    /lesson phải là số nguyên từ 1 đến 999/,
  );
});

test("Negative: section không khớp type", () => {
  const qMismatch = baseQuestion({
    type: "ja_grammar_choice",
    section: "vocabulary", // must be grammar
  });
  const p = parseJapaneseCsv(questionRowToCsv(qMismatch));
  assert.match(p.errors[0], /section "vocabulary" không khớp với type "ja_grammar_choice"/);
});

test("Negative: sai JSON options hoặc không đủ 4 options", () => {
  const badJson = baseQuestion({ options: "[{id: 'o1'}]" });
  assert.match(parseJapaneseCsv(questionRowToCsv(badJson)).errors[0], /options phải là JSON/);

  const threeOptions = baseQuestion({
    options: JSON.stringify([
      { id: "o1", text: "A" },
      { id: "o2", text: "B" },
      { id: "o3", text: "C" },
    ]),
  });
  assert.match(parseJapaneseCsv(questionRowToCsv(threeOptions)).errors[0], /cần đúng 4 options/);

  const dupOptionText = baseQuestion({
    options: JSON.stringify([
      { id: "o1", text: "見ます" },
      { id: "o2", text: "見ます" },
      { id: "o3", text: "見る" },
      { id: "o4", text: "見ません" },
    ]),
  });
  assert.match(parseJapaneseCsv(questionRowToCsv(dupOptionText)).errors[0], /không được có chữ hiển thị trùng nhau/);
});

test("Negative: G2 star_position không khớp answer (câu mơ hồ)", () => {
  const g2 = baseQuestion({
    type: "ja_grammar_star",
    section: "grammar",
    context: "これは{{slots}}です。",
    options: JSON.stringify([
      { id: "o1", text: "本" },
      { id: "o2", text: "に" },
      { id: "o3", text: "友達" },
      { id: "o4", text: "もらった" },
    ]),
    answer: "o2", // tại pos 3 order dưới có o4, nhưng khai báo o2 -> mơ hồ!
    accepted_orders: JSON.stringify([["o3", "o2", "o4", "o1"]]),
    star_position: "3",
  });
  const p = parseJapaneseCsv(questionRowToCsv(g2));
  assert.match(p.errors[0], /Câu mơ hồ: tại vị trí star_position 3/);
});

test("Negative: G2 với nhiều accepted_orders nhưng một order cho đáp án ★ khác", () => {
  const g2Multi = baseQuestion({
    type: "ja_grammar_star",
    section: "grammar",
    context: "これは{{slots}}です。",
    options: JSON.stringify([
      { id: "o1", text: "本" },
      { id: "o2", text: "に" },
      { id: "o3", text: "友達" },
      { id: "o4", text: "もらった" },
    ]),
    answer: "o4",
    accepted_orders: JSON.stringify([
      ["o3", "o2", "o4", "o1"], // pos 3 = o4 (đúng)
      ["o1", "o2", "o3", "o4"], // pos 3 = o3 (khác o4!)
    ]),
    star_position: "3",
  });
  const p = parseJapaneseCsv(questionRowToCsv(g2Multi));
  assert.match(p.errors[0], /Câu mơ hồ: tại vị trí star_position 3/);
});

test("Negative: K1 target bị ruby che phủ trong context", () => {
  const k1WithRuby = baseQuestion({
    type: "ja_kanji_reading",
    section: "kanji",
    context: "毎朝、{新聞|しんぶん}を読みます。",
    target: "新聞",
    options: JSON.stringify([
      { id: "o1", text: "しんぶん" },
      { id: "o2", text: "しんぷん" },
      { id: "o3", text: "しんもん" },
      { id: "o4", text: "しぶん" },
    ]),
    answer: "o1",
    theory: "",
  });
  const p = parseJapaneseCsv(questionRowToCsv(k1WithRuby));
  assert.match(p.errors[0], /ja_kanji_reading: context không được có ruby che phủ target "新聞"/);
});

test("Positive: K1 target không có ruby che phủ dù câu có ruby ở chữ khác (ví dụ 大学 và {学|まな})", () => {
  const k1Valid = baseQuestion({
    type: "ja_kanji_reading",
    section: "kanji",
    context: "大学で{学|まな}んでいます。",
    target: "大学",
    options: JSON.stringify([
      { id: "o1", text: "だいがく" },
      { id: "o2", text: "たいがく" },
      { id: "o3", text: "おおがく" },
      { id: "o4", text: "だいきゃく" },
    ]),
    answer: "o1",
    theory: "",
  });
  const p = parseJapaneseCsv(questionRowToCsv(k1Valid));
  assert.equal(p.errors.length, 0);
  assert.equal(p.questions.length, 1);
});

test("Negative: K1/K2 có ruby trong options trước khi chấm", () => {
  const k1OptRuby = baseQuestion({
    type: "ja_kanji_reading",
    section: "kanji",
    context: "毎朝、新聞を読みます。",
    target: "新聞",
    options: JSON.stringify([
      { id: "o1", text: "{新聞|しんぶん}" },
      { id: "o2", text: "しんぷん" },
      { id: "o3", text: "しんもん" },
      { id: "o4", text: "しぶん" },
    ]),
    answer: "o1",
    theory: "",
  });
  const p = parseJapaneseCsv(questionRowToCsv(k1OptRuby));
  assert.match(p.errors[0], /không được có ruby trong options/);
});

test("Negative: missing learning_key ở vocabulary hoặc có learning_key ở grammar/kanji", () => {
  const v1NoKey = baseQuestion({
    type: "ja_vocab_context",
    section: "vocabulary",
    context: "友達と{{gap}}をしました。",
    target: "約束",
    options: JSON.stringify([
      { id: "o1", text: "約束" },
      { id: "o2", text: "天気" },
      { id: "o3", text: "図書館" },
      { id: "o4", text: "机" },
    ]),
    answer: "o1",
    learning_key: "",
  });
  assert.match(parseJapaneseCsv(questionRowToCsv(v1NoKey)).errors[0], /ja_vocab_context cần learning_key/);

  const v1BadKey = baseQuestion({
    ...v1NoKey,
    learning_key: "vocab:yakusoku", // missing ja: prefix
  });
  assert.match(parseJapaneseCsv(questionRowToCsv(v1BadKey)).errors[0], /learning_key phải bắt đầu bằng ja:vocab:/);

  const g1WithKey = baseQuestion({
    learning_key: "ja:vocab:test:fail",
  });
  assert.match(parseJapaneseCsv(questionRowToCsv(g1WithKey)).errors[0], /phải để trống learning_key/);
});

test("Negative: missing theory ở 3 dạng grammar", () => {
  const g1NoTheory = baseQuestion({
    type: "ja_grammar_choice",
    theory: "",
  });
  assert.match(parseJapaneseCsv(questionRowToCsv(g1NoTheory)).errors[0], /cần theory nhắc quy tắc ngữ pháp/);
});

test("Negative: context gap/slots không đúng quy định", () => {
  // G1 không có gap
  const g1NoGap = baseQuestion({ context: "きのう、友達と映画を見ました。" });
  assert.match(parseJapaneseCsv(questionRowToCsv(g1NoGap)).errors[0], /phải có đúng 1 \{\{gap\}\}/);

  // G1 có 2 gaps
  const g1TwoGaps = baseQuestion({ context: "きのう{{gap}}、友達と映画を{{gap}}。" });
  assert.match(parseJapaneseCsv(questionRowToCsv(g1TwoGaps)).errors[0], /phải có đúng 1 \{\{gap\}\}/);

  // G2 không có slots
  const g2NoSlots = baseQuestion({
    type: "ja_grammar_star",
    context: "これは本です。",
    options: JSON.stringify([
      { id: "o1", text: "本" },
      { id: "o2", text: "に" },
      { id: "o3", text: "友達" },
      { id: "o4", text: "もらった" },
    ]),
    answer: "o4",
    accepted_orders: JSON.stringify([["o3", "o2", "o4", "o1"]]),
    star_position: "3",
  });
  assert.match(parseJapaneseCsv(questionRowToCsv(g2NoSlots)).errors[0], /phải có đúng 1 \{\{slots\}\}/);

  // G3 chứa gap
  const g3WithGap = baseQuestion({
    type: "ja_grammar_order",
    context: "Đây là {{gap}} của tôi.",
    options: JSON.stringify([
      { id: "p1", text: "本" },
      { id: "p2", text: "です。" },
    ]),
    answer: "",
    accepted_orders: JSON.stringify([["p1", "p2"]]),
  });
  assert.match(parseJapaneseCsv(questionRowToCsv(g3WithGap)).errors[0], /không được chứa \{\{gap\}\}/);
});

test("Negative: V1 phương án answer sau khi bỏ ruby không trùng target", () => {
  const v1Mismatch = baseQuestion({
    type: "ja_vocab_context",
    section: "vocabulary",
    context: "友達と{{gap}}をしました。",
    target: "約束",
    options: JSON.stringify([
      { id: "o1", text: "天気" }, // answer trỏ o1 nhưng text là 天気 != 約束
      { id: "o2", text: "約束" },
      { id: "o3", text: "図書館" },
      { id: "o4", text: "机" },
    ]),
    answer: "o1",
    learning_key: "ja:vocab:yakusoku:promise",
  });
  assert.match(parseJapaneseCsv(questionRowToCsv(v1Mismatch)).errors[0], /phương án answer "o1" \(天気\) phải trùng target "約束"/);
});

// -------------------------------------------------------------
// 6. Test evaluateJapaneseAnswer
// -------------------------------------------------------------
test("evaluateJapaneseAnswer: 7 dạng chọn so khớp ID chính xác", () => {
  const qChoice = {
    type: "ja_grammar_choice",
    answer: "o2",
  };

  // Đúng ID
  assert.equal(evaluateJapaneseAnswer(qChoice, "o2"), true);
  assert.equal(evaluateJapaneseAnswer(qChoice, { id: "o2" }), true);
  assert.equal(evaluateJapaneseAnswer(qChoice, { answer: "o2" }), true);
  assert.equal(evaluateJapaneseAnswer(qChoice, { selected: "o2" }), true);

  // Sai ID
  assert.equal(evaluateJapaneseAnswer(qChoice, "o1"), false);
  assert.equal(evaluateJapaneseAnswer(qChoice, { id: "o3" }), false);
  assert.equal(evaluateJapaneseAnswer(qChoice, ""), false);
  assert.equal(evaluateJapaneseAnswer(qChoice, null), false);
  assert.equal(evaluateJapaneseAnswer(qChoice, undefined), false);
});

test("evaluateJapaneseAnswer: G3 ja_grammar_order với nhiều accepted_orders", () => {
  const qOrder = {
    type: "ja_grammar_order",
    options: [
      { id: "p1", text: "今日" },
      { id: "p2", text: "は" },
      { id: "p3", text: "いい天気" },
      { id: "p4", text: "です" },
    ],
    accepted_orders: [
      ["p1", "p2", "p3", "p4"],
      ["p3", "p4", "p1", "p2"], // giả định thứ tự thứ 2
    ],
  };

  // Thứ tự 1 đúng
  assert.equal(evaluateJapaneseAnswer(qOrder, ["p1", "p2", "p3", "p4"]), true);
  assert.equal(evaluateJapaneseAnswer(qOrder, { order: ["p1", "p2", "p3", "p4"] }), true);

  // Thứ tự 2 đúng
  assert.equal(evaluateJapaneseAnswer(qOrder, ["p3", "p4", "p1", "p2"]), true);

  // Thứ tự sai
  assert.equal(evaluateJapaneseAnswer(qOrder, ["p1", "p3", "p2", "p4"]), false);

  // Thiếu mảnh
  assert.equal(evaluateJapaneseAnswer(qOrder, ["p1", "p2", "p3"]), false);

  // Mảnh lặp
  assert.equal(evaluateJapaneseAnswer(qOrder, ["p1", "p2", "p3", "p1"]), false);
});

test("evaluateJapaneseAnswer: G3 hỗ trợ mảnh tương đương (hoán đổi ID cùng chữ và ruby)", () => {
  // Hai mảnh "の" giống hệt nhau về chữ và ruby
  const qOrderEquiv = {
    type: "ja_grammar_order",
    options: [
      { id: "p1", text: "私" },
      { id: "p2", text: "の" }, // "の" thứ nhất
      { id: "p3", text: "友達" },
      { id: "p4", text: "の" }, // "の" thứ hai
      { id: "p5", text: "本" },
    ],
    accepted_orders: [
      ["p1", "p2", "p3", "p4", "p5"],
    ],
  };

  // Đúng ID gốc
  assert.equal(evaluateJapaneseAnswer(qOrderEquiv, ["p1", "p2", "p3", "p4", "p5"]), true);

  // Hoán đổi p2 và p4 (cả 2 đều là "の") -> VẪN ĐÚNG!
  assert.equal(evaluateJapaneseAnswer(qOrderEquiv, ["p1", "p4", "p3", "p2", "p5"]), true);

  // Nhưng không được lặp p2 và bỏ p4
  assert.equal(evaluateJapaneseAnswer(qOrderEquiv, ["p1", "p2", "p3", "p2", "p5"]), false);

  // Nếu 2 mảnh khác ruby thì KHÔNG được coi là tương đương
  const qDifferentRuby = {
    type: "ja_grammar_order",
    options: [
      { id: "p1", text: "{方|かた}" },
      { id: "p2", text: "{方|ほう}" },
    ],
    accepted_orders: [
      ["p1", "p2"],
    ],
  };
  assert.equal(evaluateJapaneseAnswer(qDifferentRuby, ["p1", "p2"]), true);
  assert.equal(evaluateJapaneseAnswer(qDifferentRuby, ["p2", "p1"]), false); // đảo ruby là sai!
});

test("formatJapaneseSentence: nối các mảnh tiếng Nhật bằng chuỗi rỗng không chèn khoảng trắng", () => {
  const options = [{ id: "o1", text: "本" }, { id: "o2", text: "です" }, { id: "o3", text: "これは" }];
  const sentence = formatJapaneseSentence(options, ["o3", "o1", "o2"]);
  assert.equal(sentence, "これは本です");
});

import { displayAnswer } from "../core.js";

test("displayAnswer: G2 (chỉ trả về mảnh tại ★ được chọn) và G3 (trả về câu ghép theo order)", () => {
  const qG2 = {
    type: "ja_grammar_star",
    options: [
      { id: "o1", text: "A" },
      { id: "o2", text: "B" },
      { id: "o3", text: "C" },
      { id: "o4", text: "D" }
    ],
    answer: "o3"
  };
  assert.equal(displayAnswer("o3", qG2), "C");

  const qG3 = {
    type: "ja_grammar_order",
    options: [
      { id: "o1", text: "本" },
      { id: "o2", text: "です" },
      { id: "o3", text: "これ" },
      { id: "o4", text: "は" }
    ],
    acceptedOrders: [["o3", "o4", "o1", "o2"]]
  };
  assert.equal(displayAnswer(null, qG3), "これは本です");
});
