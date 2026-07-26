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
  SESSION_QUESTION_LIMIT,
  selectQuestions,
} from "../core.js";
import {
  clearStudySession,
  createRepository,
  getSessionQuestions,
  readDashboard,
  readSelectedQuestionSet,
  restoreStudySession,
  saveSelectedQuestionSet,
  saveStudySession,
} from "../storage.js";

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

test("CSV báo rõ khi file không còn đúng mã hóa UTF-8", () => {
  const preview = buildCsvPreview(
    `${CSV_HEADERS.join(",")}\n\uFFFD`,
    "loi-ma-hoa.csv",
  );
  assert.equal(preview.rows.length, 0);
  assert.match(preview.errors[0], /CSV UTF-8/);
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
    completedLearningKeys: ["vocab:allocate"],
  });
  assert.deepEqual(selected.map((item) => item.id), ["v-3"]);
});

test("50 câu Grammar được chia thành lượt 30 + 20, không lặp câu đã làm", () => {
  const questions = Array.from({ length: 50 }, (_, index) => ({
    id: `grammar-${index + 1}`,
    domain: "grammar",
    level: "B1",
    topic: "Mixed grammar",
    active: true,
  }));

  const first = selectQuestions(questions, [], {
    domain: "grammar",
    limit: SESSION_QUESTION_LIMIT,
  });
  assert.equal(first.length, 30);

  const firstIds = new Set(first.map((question) => question.id));
  const second = selectQuestions(questions, [], {
    domain: "grammar",
    limit: SESSION_QUESTION_LIMIT,
    completedQuestionIds: [...firstIds],
  });
  assert.equal(second.length, 20);
  assert.equal(
    second.some((question) => firstIds.has(question.id)),
    false,
  );
  assert.equal(
    new Set([...first, ...second].map((question) => question.id)).size,
    50,
  );

  const third = selectQuestions(questions, [], {
    domain: "grammar",
    completedQuestionIds: [...first, ...second].map(
      (question) => question.id,
    ),
  });
  assert.equal(third.length, 0);
});

test("mỗi CSV là một bộ riêng: ID trùng vẫn độc lập, 30 + 20 không trộn bộ", async () => {
  const values = new Map();
  const hadIndexedDb = "indexedDB" in globalThis;
  const originalIndexedDb = globalThis.indexedDB;
  const originalLocalStorage = globalThis.localStorage;
  delete globalThis.indexedDB;
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };

  const grammarRows = (topic) =>
    Array.from({ length: 50 }, (_, index) => ({
      id: `duplicate-${index + 1}`,
      domain: "grammar",
      level: "B1",
      topic,
      type: "mcq",
      options: ["is", "are"],
      answer: ["is"],
      active: true,
    }));
  const vocabularyRow = (topic) => ({
    id: "duplicate-vocabulary",
    domain: "vocabulary",
    level: "B1",
    topic,
    type: "fill_blank",
    answer: ["allocate"],
    learningKey: "vocab:allocate",
    active: true,
  });

  try {
    const repository = await createRepository();
    const setA = await repository.importQuestions(
      [...grammarRows("Bộ A"), vocabularyRow("Bộ A")],
      "bo-a.csv",
    );
    const setB = await repository.importQuestions(
      [...grammarRows("Bộ B"), vocabularyRow("Bộ B")],
      "bo-b.csv",
    );
    const snapshot = await repository.snapshot();

    assert.equal(snapshot.questions.length, 102);
    assert.equal(new Set(snapshot.questions.map((item) => item.id)).size, 102);
    assert.equal(
      snapshot.questions.filter(
        (item) => item.originalId === "duplicate-1",
      ).length,
      2,
    );

    const firstA = await getSessionQuestions(repository, {
      setId: setA.id,
      domain: "grammar",
      limit: SESSION_QUESTION_LIMIT,
    });
    assert.equal(firstA.length, 30);
    assert.ok(firstA.every((item) => item.setId === setA.id));
    for (const question of firstA) {
      await repository.recordAttempt(question, "is", true);
    }

    const secondA = await getSessionQuestions(repository, {
      setId: setA.id,
      domain: "grammar",
      limit: SESSION_QUESTION_LIMIT,
    });
    assert.equal(secondA.length, 20);
    assert.ok(secondA.every((item) => item.setId === setA.id));
    assert.equal(
      secondA.some((item) =>
        firstA.some((first) => first.id === item.id),
      ),
      false,
    );

    const firstB = await getSessionQuestions(repository, {
      setId: setB.id,
      domain: "grammar",
      limit: SESSION_QUESTION_LIMIT,
    });
    assert.equal(firstB.length, 30);
    assert.ok(firstB.every((item) => item.setId === setB.id));

    const vocabA = await getSessionQuestions(repository, {
      setId: setA.id,
      domain: "vocabulary",
      limit: SESSION_QUESTION_LIMIT,
    });
    assert.equal(vocabA.length, 1);
    await repository.recordAttempt(vocabA[0], "allocate", true);
    assert.equal(
      (
        await getSessionQuestions(repository, {
          setId: setA.id,
          domain: "vocabulary",
          limit: SESSION_QUESTION_LIMIT,
        })
      ).length,
      0,
    );

    // SRS dùng chung learning_key, nhưng hoàn thành lần đầu vẫn tính riêng
    // theo từng bộ nên bộ B không bị bỏ qua.
    const vocabB = await getSessionQuestions(repository, {
      setId: setB.id,
      domain: "vocabulary",
      limit: SESSION_QUESTION_LIMIT,
    });
    assert.equal(vocabB.length, 1);
    assert.equal(vocabB[0].setId, setB.id);

    const dashboardA = await readDashboard(repository, setA.id);
    const dashboardB = await readDashboard(repository, setB.id);
    assert.equal(dashboardA.stats.grammarRemaining, 20);
    assert.equal(dashboardA.stats.vocabularyRemaining, 0);
    assert.equal(dashboardB.stats.grammarRemaining, 50);
    assert.equal(dashboardB.stats.vocabularyRemaining, 1);
    assert.ok(
      dashboardA.topics.every((item) => item.topic === "Bộ A"),
    );
    assert.ok(
      dashboardB.topics.every((item) => item.topic === "Bộ B"),
    );

    const setACopy = await repository.importQuestions(
      [vocabularyRow("Bộ A bản sao")],
      "bo-a.csv",
    );
    assert.equal(setA.name, "bo-a");
    assert.equal(setACopy.name, "bo-a (2)");

    saveSelectedQuestionSet(setA.id);
    assert.equal(readSelectedQuestionSet(), setA.id);
  } finally {
    if (hadIndexedDb) globalThis.indexedDB = originalIndexedDb;
    else delete globalThis.indexedDB;
    if (originalLocalStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = originalLocalStorage;
  }
});

test("Vocabulary ưu tiên 20 từ chưa đúng trước các từ SRS cũ đến hạn", () => {
  const now = Date.UTC(2026, 6, 26);
  const questions = Array.from({ length: 50 }, (_, index) => ({
    id: `vocabulary-${index + 1}`,
    domain: "vocabulary",
    level: "B1",
    topic: "Mixed vocabulary",
    learningKey: `vocab:key-${index + 1}`,
    active: true,
  }));
  const firstCompletedKeys = questions
    .slice(0, 30)
    .map((question) => question.learningKey);
  const reviews = firstCompletedKeys.map((learningKey) => ({
    learningKey,
    firstCompletedAt: now - 86_400_000,
    dueAt: now - 1,
    repetitions: 1,
  }));

  const second = selectQuestions(questions, reviews, {
    domain: "vocabulary",
    limit: SESSION_QUESTION_LIMIT,
    now,
    completedLearningKeys: firstCompletedKeys,
  });
  assert.equal(second.length, 20);
  assert.ok(
    second.every(
      (question) => !firstCompletedKeys.includes(question.learningKey),
    ),
  );

  const allReviews = [
    ...reviews,
    ...questions.slice(30).map((question) => ({
      learningKey: question.learningKey,
      firstCompletedAt: now - 1,
      dueAt: now - 1,
      repetitions: 1,
    })),
  ];
  const srsBatch = selectQuestions(questions, allReviews, {
    domain: "vocabulary",
    limit: SESSION_QUESTION_LIMIT,
    now,
    completedLearningKeys: questions.map(
      (question) => question.learningKey,
    ),
  });
  assert.equal(srsBatch.length, 30);
});

test("Vocabulary chỉ lưu firstCompletedAt khi đúng và giữ nguyên sau khi tải lại", async () => {
  const values = new Map();
  const hadIndexedDb = "indexedDB" in globalThis;
  const originalIndexedDb = globalThis.indexedDB;
  const originalLocalStorage = globalThis.localStorage;
  delete globalThis.indexedDB;
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };

  try {
    const question = {
      id: "vocab-persistent",
      domain: "vocabulary",
      learningKey: "vocab:persistent",
    };
    const repository = await createRepository();

    await repository.recordAttempt(question, "wrong", false);
    let snapshot = await repository.snapshot();
    assert.equal(snapshot.reviews[0].firstCompletedAt, undefined);

    await repository.recordAttempt(question, "correct", true);
    snapshot = await repository.snapshot();
    const firstCompletedAt = snapshot.reviews[0].firstCompletedAt;
    assert.ok(Number.isFinite(firstCompletedAt));

    await repository.recordAttempt(question, "wrong again", false);
    const reloadedRepository = await createRepository();
    snapshot = await reloadedRepository.snapshot();
    assert.equal(snapshot.reviews[0].firstCompletedAt, firstCompletedAt);
  } finally {
    if (hadIndexedDb) globalThis.indexedDB = originalIndexedDb;
    else delete globalThis.indexedDB;
    if (originalLocalStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = originalLocalStorage;
  }
});

test("lượt học đang làm được phục hồi đúng vị trí sau khi tải lại", async () => {
  const values = new Map();
  const hadIndexedDb = "indexedDB" in globalThis;
  const originalIndexedDb = globalThis.indexedDB;
  const originalLocalStorage = globalThis.localStorage;
  delete globalThis.indexedDB;
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };

  try {
    const question = {
      id: "grammar-resume",
      domain: "grammar",
      level: "B1",
      topic: "Present simple",
      active: true,
    };
    const repository = await createRepository();
    const set = await repository.importQuestions([question], "resume.csv");
    const storedQuestion = (await repository.snapshot()).questions.find(
      (item) => item.setId === set.id,
    );
    saveStudySession({
      queue: [storedQuestion],
      selectedSetId: set.id,
      sessionDomain: "grammar",
      sessionTarget: 13,
      sessionDone: 12,
      sessionCorrect: 9,
      result: null,
    });

    const reloadedRepository = await createRepository();
    const restored = await restoreStudySession(reloadedRepository);
    assert.equal(restored.queue[0].originalId, question.id);
    assert.equal(restored.selectedSetId, set.id);
    assert.equal(restored.sessionTarget, 13);
    assert.equal(restored.sessionDone, 12);
    assert.equal(restored.sessionCorrect, 9);

    clearStudySession();
    assert.equal(await restoreStudySession(reloadedRepository), null);
  } finally {
    if (hadIndexedDb) globalThis.indexedDB = originalIndexedDb;
    else delete globalThis.indexedDB;
    if (originalLocalStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = originalLocalStorage;
  }
});

test("dữ liệu phiên bản cũ được gom vào một bộ và giữ nguyên tiến độ", async () => {
  const values = new Map();
  const hadIndexedDb = "indexedDB" in globalThis;
  const originalIndexedDb = globalThis.indexedDB;
  const originalLocalStorage = globalThis.localStorage;
  delete globalThis.indexedDB;
  globalThis.localStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };

  const importedAt = Date.UTC(2026, 6, 1);
  values.set(
    "nam-english:questions",
    JSON.stringify([
      {
        id: "legacy-question",
        domain: "grammar",
        level: "B1",
        topic: "Present simple",
        active: true,
        importedAt,
      },
    ]),
  );
  values.set(
    "nam-english:attempts",
    JSON.stringify([
      {
        id: "legacy-attempt",
        questionId: "legacy-question",
        correct: true,
        attemptedAt: importedAt + 1,
      },
    ]),
  );
  values.set(
    "nam-english:imports",
    JSON.stringify([
      {
        id: "old-import-log",
        filename: "old.csv",
        count: 1,
        importedAt,
      },
    ]),
  );

  try {
    const repository = await createRepository();
    const snapshot = await repository.snapshot();
    assert.equal(snapshot.questions[0].setId, "legacy-v1");
    assert.equal(snapshot.questions[0].originalId, "legacy-question");
    assert.equal(snapshot.attempts[0].setId, "legacy-v1");

    const dashboard = await readDashboard(repository);
    assert.equal(dashboard.selectedSetId, "legacy-v1");
    assert.equal(dashboard.sets[0].name, "Dữ liệu cũ");
    assert.equal(dashboard.stats.grammar, 1);
    assert.equal(dashboard.stats.grammarRemaining, 0);
  } finally {
    if (hadIndexedDb) globalThis.indexedDB = originalIndexedDb;
    else delete globalThis.indexedDB;
    if (originalLocalStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = originalLocalStorage;
  }
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
