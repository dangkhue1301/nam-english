import assert from "node:assert/strict";
import test from "node:test";
import { buildCsvPreview } from "../core.js";
import {
  accuracyByDomain,
  buildAchievements,
  collectVocabularyKeys,
  computeStreaks,
  dailyActivity,
  dueForecast,
  heatmapLevel,
  heatmapWeeks,
  levelInfo,
  mistakeQuestions,
  parseLearningKey,
  questionsToCsv,
  xpFromAttempts,
  XP_CORRECT,
  XP_INCORRECT,
  searchQuestions,
  generateReportMarkdown,
  generateReportCsv,
} from "../stats.js";

const DAY = 24 * 60 * 60 * 1_000;

function at(dayOffset, now, hour = 12) {
  const date = new Date(now);
  date.setHours(hour, 0, 0, 0);
  return date.getTime() + dayOffset * DAY;
}

test("chuỗi ngày học tính đúng: hôm nay, hôm qua và chuỗi dài nhất", () => {
  const now = new Date("2026-07-27T20:00:00").getTime();
  const attempt = (offset) => ({ attemptedAt: at(offset, now), correct: true });

  // Học hôm nay + 2 ngày trước đó -> chuỗi 3.
  let streaks = computeStreaks(
    [attempt(0), attempt(-1), attempt(-2)],
    now,
  );
  assert.equal(streaks.current, 3);
  assert.equal(streaks.studiedToday, true);

  // Chưa học hôm nay nhưng học hôm qua -> chuỗi vẫn giữ.
  streaks = computeStreaks([attempt(-1), attempt(-2)], now);
  assert.equal(streaks.current, 2);
  assert.equal(streaks.studiedToday, false);

  // Đứt quãng hai ngày -> chuỗi hiện tại 0, dài nhất vẫn nhớ.
  streaks = computeStreaks(
    [attempt(-3), attempt(-4), attempt(-5), attempt(-6)],
    now,
  );
  assert.equal(streaks.current, 0);
  assert.equal(streaks.longest, 4);
});

test("XP và cấp độ: mỗi cấp cần nhiều XP hơn cấp trước", () => {
  const attempts = [
    { correct: true },
    { correct: true },
    { correct: false },
  ];
  assert.equal(xpFromAttempts(attempts), XP_CORRECT * 2 + XP_INCORRECT);

  assert.equal(levelInfo(0).level, 1);
  assert.equal(levelInfo(99).level, 1);
  assert.equal(levelInfo(100).level, 2);
  // Cấp 2 -> 3 cần 150 XP nữa (tổng 250).
  assert.equal(levelInfo(249).level, 2);
  assert.equal(levelInfo(250).level, 3);
  const info = levelInfo(120);
  assert.equal(info.intoLevel, 20);
  assert.equal(info.needed, 150);
});

test("heatmap có đúng số tuần, đánh dấu ô tương lai và mức nhiệt", () => {
  const now = new Date("2026-07-27T12:00:00").getTime(); // thứ Hai
  const grid = heatmapWeeks(
    [{ attemptedAt: now, correct: true }],
    17,
    now,
  );
  assert.equal(grid.length, 17);
  assert.equal(grid[0].length, 7);
  const lastWeek = grid[16];
  // Thứ Hai là hôm nay -> không phải tương lai; Chủ nhật cuối là tương lai.
  assert.equal(lastWeek[0].future, false);
  assert.equal(lastWeek[0].count, 1);
  assert.equal(lastWeek[6].future, true);

  assert.equal(heatmapLevel(0), 0);
  assert.equal(heatmapLevel(3), 1);
  assert.equal(heatmapLevel(7), 2);
  assert.equal(heatmapLevel(12), 3);
  assert.equal(heatmapLevel(25), 4);
});

test("dailyActivity trả về đủ 14 ngày theo thứ tự cũ đến mới", () => {
  const now = new Date("2026-07-27T12:00:00").getTime();
  const days = dailyActivity(
    [{ attemptedAt: now, correct: true }],
    14,
    now,
  );
  assert.equal(days.length, 14);
  assert.equal(days[13].count, 1);
  assert.equal(days[0].count, 0);
});

test("mistakeQuestions chỉ lấy câu có lần làm gần nhất bị sai", () => {
  const questions = [
    { id: "a", active: true },
    { id: "b", active: true },
    { id: "c", active: true },
    { id: "d", active: false },
  ];
  const attempts = [
    { questionId: "a", correct: false, attemptedAt: 1 },
    { questionId: "a", correct: true, attemptedAt: 2 }, // đã sửa được
    { questionId: "b", correct: true, attemptedAt: 1 },
    { questionId: "b", correct: false, attemptedAt: 5 }, // sai gần nhất
    { questionId: "d", correct: false, attemptedAt: 3 }, // câu đã tắt
  ];
  const mistakes = mistakeQuestions(questions, attempts);
  assert.deepEqual(
    mistakes.map((question) => question.id),
    ["b"],
  );
});

test("accuracyByDomain thống kê riêng practice cùng grammar và vocabulary", () => {
  const accuracy = accuracyByDomain(
    [
      { id: "g", domain: "grammar" },
      { id: "v", domain: "vocabulary" },
      { id: "p", domain: "practice" },
    ],
    [
      { questionId: "g", correct: true },
      { questionId: "v", correct: false },
      { questionId: "p", correct: true },
      { questionId: "p", correct: false },
    ],
  );
  assert.deepEqual(accuracy.grammar, { total: 1, correct: 1, accuracy: 100 });
  assert.deepEqual(accuracy.vocabulary, { total: 1, correct: 0, accuracy: 0 });
  assert.deepEqual(accuracy.practice, { total: 2, correct: 1, accuracy: 50 });
});

test("dueForecast gom lịch ôn về đúng ngày, quá hạn dồn vào hôm nay", () => {
  const now = new Date("2026-07-27T08:00:00").getTime();
  const reviews = [
    { learningKey: "k1", dueAt: now - 2 * DAY }, // quá hạn
    { learningKey: "k2", dueAt: now + 2 * 60 * 60 * 1_000 }, // hôm nay
    { learningKey: "k3", dueAt: now + DAY }, // ngày mai
    { learningKey: "k4", dueAt: now + 10 * DAY }, // ngoài 7 ngày
    { learningKey: "khac", dueAt: now }, // không thuộc bộ
  ];
  const buckets = dueForecast(reviews, ["k1", "k2", "k3", "k4"], 7, now);
  assert.equal(buckets[0], 2);
  assert.equal(buckets[1], 1);
  assert.equal(
    buckets.reduce((sum, count) => sum + count, 0),
    3,
  );
});

test("parseLearningKey tách từ, từ loại và nghĩa", () => {
  assert.deepEqual(parseLearningKey("vocab:set-aside:verb:keep-for-later"), {
    word: "set aside",
    pos: "verb",
    sense: "keep for later",
  });
  assert.equal(parseLearningKey("g-b1-001"), null);
  assert.equal(parseLearningKey(""), null);
});

test("thành tích: mở khóa đúng điều kiện và có tiến độ", () => {
  const now = new Date("2026-07-27T12:00:00").getTime();
  const questions = [{ id: "q1", type: "mcq" }];
  const attempts = Array.from({ length: 30 }, (_, index) => ({
    questionId: "q1",
    correct: true,
    attemptedAt: at(0, now, 10) + index,
  }));
  const achievements = buildAchievements({
    attempts,
    imports: [{ id: "s1" }],
    reviews: [],
    questions,
    now,
  });
  const byId = new Map(achievements.map((item) => [item.id, item]));
  assert.equal(byId.get("first-question").unlocked, true);
  assert.equal(byId.get("first-import").unlocked, true);
  assert.equal(byId.get("correct-100").unlocked, false);
  assert.equal(byId.get("correct-100").value, 30);
  assert.equal(byId.get("streak-3").unlocked, false);
});

test("questionsToCsv xuất lại được file mà buildCsvPreview chấp nhận", () => {
  const source = [
    "id,domain,type,level,topic,subtopic,prompt,context,options,answer,explanation,theory,hint,tags,difficulty,learning_key",
    '"g-1","grammar","mcq","B1","Tenses","","Choose.","She ___ now.","runs||is running","is running","Vì ""now"".","Hiện tại tiếp diễn: be + V-ing.","","tag1||tag2","2",""',
    '"v-1","vocabulary","matching","B1","Words","","Match.","","cat=>mèo||dog=>chó","","Cat là mèo; dog là chó.","","","","1","vocab:cat:noun:animal"',
  ].join("\r\n");
  const preview = buildCsvPreview(source, "test.csv");
  assert.equal(preview.errors.length, 0);
  assert.equal(preview.rows.length, 2);

  const exported = questionsToCsv(preview.rows);
  const reimported = buildCsvPreview(exported, "reexport.csv");
  assert.deepEqual(reimported.errors, []);
  assert.equal(reimported.rows.length, 2);
  assert.deepEqual(reimported.rows[0].answer, ["is running"]);
  assert.deepEqual(reimported.rows[1].answer, {
    cat: "mèo",
    dog: "chó",
  });
  assert.equal(reimported.rows[1].learningKey, "vocab:cat:noun:animal");
});

test("collectVocabularyKeys khử trùng lặp và bỏ câu đã tắt", () => {
  const keys = collectVocabularyKeys([
    { domain: "vocabulary", learningKey: "k1", active: true },
    { domain: "vocabulary", learningKey: "k1", active: true },
    { domain: "vocabulary", learningKey: "k2", active: false },
    { domain: "grammar", id: "g1", active: true },
  ]);
  assert.deepEqual(keys, ["k1"]);
});

test("searchQuestions tìm chính xác trên prompt, context, topic, subtopic và đáp án không ra [object Object]", () => {
  const questions = [
    { id: "q1", subject: "physics", topic: "Cơ học", subtopic: "Lực ma sát", prompt: "Đơn vị của lực?", context: "Trong hệ SI", answer: ["Newton", "N"], active: true },
    { id: "q2", subject: "english", topic: "Matching", subtopic: "", prompt: "Ghép từ", context: "", answer: { dog: "chó", cat: "mèo" }, active: true },
    { id: "q3", subject: "chemistry", topic: "Nguyên tử", subtopic: "", prompt: "<script>alert(1)</script>", context: "Phân tử", answer: ["H2O"], active: true },
    { id: "q4", subject: "biology", topic: "Tế bào", subtopic: "", prompt: "Cấu tạo tế bào?", context: "", answer: ["Màng sinh chất"], active: false },
  ];

  // Kho rỗng hoặc query rỗng
  assert.deepEqual(searchQuestions([], "lực"), []);
  assert.deepEqual(searchQuestions(questions, ""), []);
  assert.deepEqual(searchQuestions(questions, "   "), []);

  // Tìm theo prompt và context (tiếng Việt có dấu, case-insensitive)
  const byPrompt = searchQuestions(questions, "ĐƠN VỊ");
  assert.equal(byPrompt.length, 1);
  assert.equal(byPrompt[0].id, "q1");

  const bySubtopic = searchQuestions(questions, "ma sát");
  assert.equal(bySubtopic.length, 1);
  assert.equal(bySubtopic[0].id, "q1");

  // Tìm theo đáp án object (không stringify thành [object Object])
  const byAnswerObj = searchQuestions(questions, "mèo");
  assert.equal(byAnswerObj.length, 1);
  assert.equal(byAnswerObj[0].id, "q2");

  assert.deepEqual(searchQuestions(questions, "[object"), []);

  // Bỏ qua câu đã tắt (inactive)
  const byInactive = searchQuestions(questions, "Tế bào");
  assert.equal(byInactive.length, 0);

  // Không thay đổi dữ liệu gốc
  assert.equal(questions[0].id, "q1");
});

test("báo cáo học tập: Markdown và CSV xử lý đủ 4 môn, topic trùng tên giữa môn, escape công thức, đối chiếu số liệu", () => {
  const now = new Date("2026-09-11T10:00:00Z").getTime();

  // 1. Kho trống: không crash
  const emptyMd = generateReportMarkdown({ questions: [], attempts: [], imports: [], now });
  assert.ok(emptyMd.includes("Số bộ bài") && emptyMd.includes("0"));
  assert.ok(emptyMd.includes("Tổng số câu hỏi") && emptyMd.includes("0"));
  assert.ok(emptyMd.includes("0%"));

  const emptyCsv = generateReportCsv({ questions: [], attempts: [], imports: [], now });
  assert.ok(emptyCsv.startsWith("\uFEFF"));
  assert.ok(emptyCsv.includes("TỔNG QUAN"));

  // 2. Dữ liệu 4 môn, trong đó Physics và Biology cùng có topic "Năng lượng"
  const imports = [
    { id: "s-eng", name: "English Set" },
    { id: "s-phy", name: "Physics Set" },
    { id: "s-bio", name: "Biology Set" },
    { id: "s-chm", name: "Chemistry Set" },
  ];
  const questions = [
    { id: "q-eng", setId: "s-eng", subject: "english", topic: "Tenses", prompt: "He ___ here.", answer: ["lives"], explanation: "Simple present.", active: true },
    { id: "q-phy", setId: "s-phy", subject: "physics", topic: "Năng lượng", prompt: "Định luật bảo toàn?", answer: ["Đúng"], explanation: "Năng lượng không tự mất đi.", active: true },
    { id: "q-bio", setId: "s-bio", subject: "biology", topic: "Năng lượng", prompt: "Quang hợp tạo gì?", answer: ["Glucose"], explanation: "Tạo chất hữu cơ.", active: true },
    { id: "q-chm", setId: "s-chm", subject: "chemistry", topic: "Phản ứng", prompt: "Phản ứng tỏa nhiệt?", answer: ["Tỏa nhiệt"], explanation: "Giải phóng năng lượng.", active: true },
  ];

  // Attempts:
  // q-eng: đúng lần đầu
  // q-phy: sai lần đầu, sai lần 2 -> sai gần nhất
  // q-bio: đúng
  // q-chm: chưa làm
  const attempts = [
    { id: "a1", questionId: "q-eng", correct: true, attemptedAt: now - 3600000, purpose: "study" },
    { id: "a2", questionId: "q-phy", correct: false, attemptedAt: now - 7200000, purpose: "study" },
    { id: "a3", questionId: "q-phy", correct: false, attemptedAt: now - 1800000, purpose: "study" },
    { id: "a4", questionId: "q-bio", correct: true, attemptedAt: now - 900000, purpose: "study" },
  ];

  // 3. Kiểm tra Markdown
  const md = generateReportMarkdown({ questions, attempts, imports, now });
  assert.ok(md.includes("Số bộ bài") && md.includes("4"));
  assert.ok(md.includes("Tổng số câu hỏi trong kho") && md.includes("4"));
  assert.ok(md.includes("Số câu duy nhất đã làm") && md.includes("3/4"));
  assert.ok(md.includes("Tổng số lần trả lời") && md.includes("4"));
  assert.ok(md.includes("Lần làm đúng") && md.includes("2"));
  assert.ok(md.includes("Lần làm chưa đúng") && md.includes("2"));
  assert.ok(md.includes("Độ chính xác trung bình") && md.includes("50%"));

  // Tách riêng topic trùng tên "Năng lượng" theo môn
  assert.ok(md.includes("| Vật lí | Năng lượng | 1 | 1 | 2 | 0 | 0% |"));
  assert.ok(md.includes("| Sinh học | Năng lượng | 1 | 1 | 1 | 1 | 100% |"));

  // Danh sách câu sai gần nhất chỉ có q-phy
  assert.ok(md.includes("Danh sách câu sai gần nhất (1 câu)"));
  assert.ok(md.includes("Định luật bảo toàn?"));

  // 4. Kiểm tra CSV và chống Formula Injection
  const injectionQ = [
    { id: "q-inj", setId: "s-phy", subject: "physics", topic: "=SUM(A1:A10)", prompt: "@dangerous_command", answer: ["+12345"], explanation: "-dangerous", active: true },
  ];
  const injectionAttempts = [
    { id: "ai", questionId: "q-inj", correct: false, attemptedAt: now, purpose: "study" },
  ];
  const csv = generateReportCsv({ questions: injectionQ, attempts: injectionAttempts, imports, now });
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.includes("=SUM(A1:A10)"));
  assert.ok(csv.includes("@dangerous_command"));
  assert.ok(csv.includes("+12345"));
  assert.ok(csv.includes("-dangerous"));
  assert.ok(csv.includes("'=SUM(A1:A10)"));
  assert.ok(csv.includes("'@dangerous_command"));
  assert.ok(csv.includes("'+12345"));
  assert.ok(csv.includes("'-dangerous"));
});
