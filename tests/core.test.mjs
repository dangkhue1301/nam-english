import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  buildCsvPreview,
  buildStats,
  CSV_HEADERS,
  evaluateAnswer,
  nextReview,
  QUESTION_TYPES,
  selectQuestions,
} from "../core.js";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(testDirectory, "..");

test("CSV mẫu có đúng 16 header và đủ 8 dạng bài", async () => {
  const text = await readFile(
    path.join(projectDirectory, "sample_questions.csv"),
    "utf8",
  );
  const firstLine = text.replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0];
  const header = firstLine
    .split(",")
    .map((item) => item.replaceAll('"', ""));
  assert.deepEqual(header, CSV_HEADERS);

  const preview = buildCsvPreview(text, "sample_questions.csv");
  assert.deepEqual(preview.errors, []);
  assert.equal(preview.rows.length, 24);
  assert.deepEqual(
    [...new Set(preview.rows.map((row) => row.type))].sort(),
    [...QUESTION_TYPES].sort(),
  );
});

test("CSV từ chối header sai thứ tự hoặc không đúng 16 cột", () => {
  const wrong = [
    [...CSV_HEADERS].reverse().join(","),
    Array.from({ length: 16 }, () => "x").join(","),
  ].join("\n");
  const preview = buildCsvPreview(wrong, "wrong.csv");
  assert.equal(preview.rows.length, 0);
  assert.match(preview.errors[0], /đúng 16 cột theo thứ tự/);

  const uppercaseHeader = [
    CSV_HEADERS.map((header) => header.toUpperCase()).join(","),
    Array.from({ length: 16 }, () => "x").join(","),
  ].join("\n");
  assert.match(
    buildCsvPreview(uppercaseHeader, "uppercase.csv").errors[0],
    /đúng 16 cột theo thứ tự/,
  );
});

test("grammar bắt buộc có phần theory", () => {
  const row = {
    id: "grammar-no-theory",
    domain: "grammar",
    type: "mcq",
    level: "B1",
    topic: "Present simple",
    subtopic: "",
    prompt: "Choose.",
    context: "",
    options: "is||are",
    answer: "is",
    explanation: "Is đi với chủ ngữ số ít.",
    theory: "",
    hint: "",
    tags: "",
    difficulty: "1",
    learning_key: "",
  };
  const escape = (value) => `"${String(value).replaceAll('"', '""')}"`;
  const csv = [
    CSV_HEADERS.join(","),
    CSV_HEADERS.map((header) => escape(row[header])).join(","),
  ].join("\n");
  const preview = buildCsvPreview(csv, "no-theory.csv");
  assert.equal(preview.rows.length, 0);
  assert.match(preview.errors[0], /grammar cần theory/);
});

test("chấm văn bản có chuẩn hóa dấu câu, khoảng trắng và Unicode", () => {
  assert.equal(
    evaluateAnswer(["Lena said she was tired."], "  Lena said she was tired! ", "fill_blank"),
    true,
  );
  assert.equal(
    evaluateAnswer(["don't"], "don’t", "fill_blank"),
    true,
  );
});

test("chấm chọn nhiều không phụ thuộc thứ tự và ghép cặp phải khớp toàn bộ", () => {
  assert.equal(
    evaluateAnswer(
      ["must", "can't"],
      ["can't", "must"],
      "multiple_select",
    ),
    true,
  );
  assert.equal(
    evaluateAnswer(
      { who: "people", where: "places" },
      { where: "places", who: "people" },
      "matching",
    ),
    true,
  );
  assert.equal(
    evaluateAnswer(
      { who: "people", where: "places" },
      { where: "people", who: "places" },
      "matching",
    ),
    false,
  );
});

test("SRS dùng nhịp 1 ngày, 6 ngày rồi giãn theo ease", () => {
  const now = Date.UTC(2026, 6, 26);
  const first = nextReview(undefined, true, now);
  assert.equal(first.intervalDays, 1);
  assert.equal(first.dueAt, now + 24 * 60 * 60 * 1_000);

  const second = nextReview(first, true, now);
  assert.equal(second.intervalDays, 6);

  const third = nextReview(second, true, now);
  assert.ok(third.intervalDays >= 15);

  const lapse = nextReview(third, false, now);
  assert.equal(lapse.intervalDays, 0);
  assert.equal(lapse.dueAt, now + 10 * 60 * 1_000);
  assert.equal(lapse.repetitions, 0);
});

test("vocabulary cùng learning_key chỉ xuất hiện một biến thể và dùng chung lịch", () => {
  const questions = [
    {
      id: "v-1",
      domain: "vocabulary",
      level: "B1",
      topic: "Work",
      learningKey: "vocab:allocate",
      active: true,
    },
    {
      id: "v-2",
      domain: "vocabulary",
      level: "B1",
      topic: "Work",
      learningKey: "vocab:allocate",
      active: true,
    },
    {
      id: "v-3",
      domain: "vocabulary",
      level: "B1",
      topic: "Work",
      learningKey: "vocab:reliable",
      active: true,
    },
  ];
  const now = Date.UTC(2026, 6, 26);
  const reviews = [
    {
      learningKey: "vocab:allocate",
      dueAt: now + 86_400_000,
    },
  ];
  const selected = selectQuestions(questions, reviews, {
    domain: "vocabulary",
    limit: 10,
    now,
  });
  assert.deepEqual(selected.map((item) => item.id), ["v-3"]);
});

test("thống kê từ đến hạn khử trùng learning_key", () => {
  const questions = [
    {
      id: "v-1",
      domain: "vocabulary",
      topic: "Work",
      learningKey: "vocab:allocate",
    },
    {
      id: "v-2",
      domain: "vocabulary",
      topic: "Work",
      learningKey: "vocab:allocate",
    },
  ];
  const stats = buildStats(questions, [], [], [], Date.now());
  assert.equal(stats.vocabulary, 2);
  assert.equal(stats.due, 1);
});

test("mọi tài nguyên trong HTML dùng đường dẫn tương đối", async () => {
  const html = await readFile(
    path.join(projectDirectory, "index.html"),
    "utf8",
  );
  const app = await readFile(path.join(projectDirectory, "app.js"), "utf8");
  assert.doesNotMatch(html, /(?:href|src)=["']\//i);
  assert.doesNotMatch(app, /fetch\(["']\//);
  assert.match(html, /<meta charset="UTF-8">/);
});
