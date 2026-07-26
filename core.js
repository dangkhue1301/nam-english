export const QUESTION_TYPES = [
  "mcq",
  "multiple_select",
  "fill_blank",
  "error_correction",
  "sentence_transformation",
  "word_formation",
  "ordering",
  "matching",
];

export const SESSION_QUESTION_LIMIT = 30;

export const TYPE_LABELS = {
  mcq: "Chọn đáp án",
  multiple_select: "Chọn nhiều",
  fill_blank: "Điền chỗ trống",
  error_correction: "Sửa lỗi",
  sentence_transformation: "Viết lại câu",
  word_formation: "Dạng từ",
  ordering: "Sắp xếp",
  matching: "Ghép cặp",
};

export const CSV_HEADERS = [
  "id",
  "domain",
  "type",
  "level",
  "topic",
  "subtopic",
  "prompt",
  "context",
  "options",
  "answer",
  "explanation",
  "theory",
  "hint",
  "tags",
  "difficulty",
  "learning_key",
];

export function splitList(value) {
  return String(value ?? "")
    .split("||")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      field = "";
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }

  if (inQuotes) throw new Error("CSV có dấu ngoặc kép chưa đóng.");
  row.push(field);
  if (row.some((cell) => cell.trim())) rows.push(row);
  return rows;
}

export function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.!?]+$/g, "")
    .toLocaleLowerCase("en");
}

function tokenBag(parts) {
  return parts
    .flatMap((part) => String(part).split(/\s+/))
    .map(normalizeText)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "en"));
}

export function orderingAnswerUsesOptions(options, answers) {
  const optionTokens = tokenBag(options);
  return answers.some((answer) => {
    const answerTokens = tokenBag([answer]);
    return (
      optionTokens.length === answerTokens.length &&
      optionTokens.every((token, index) => token === answerTokens[index])
    );
  });
}

export function buildCsvPreview(text, filename = "questions.csv") {
  const content = String(text).replace(/^\uFEFF/, "");
  if (content.includes("\uFFFD")) {
    return {
      filename,
      rows: [],
      errors: [
        "File có ký tự lỗi mã hóa. Hãy lưu lại dưới dạng CSV UTF-8 rồi thử lại.",
      ],
    };
  }

  const matrix = parseCsv(content);
  if (matrix.length < 2) {
    return { filename, rows: [], errors: ["File chưa có dòng dữ liệu."] };
  }

  const headers = matrix[0].map((header) => header.trim());
  if (new Set(headers).size !== headers.length) {
    return { filename, rows: [], errors: ["Header có cột bị trùng."] };
  }

  const headerIsExact =
    headers.length === CSV_HEADERS.length &&
    CSV_HEADERS.every((header, index) => headers[index] === header);
  if (!headerIsExact) {
    return {
      filename,
      rows: [],
      errors: [
        `Header phải có đúng 16 cột theo thứ tự: ${CSV_HEADERS.join(",")}`,
      ],
    };
  }

  if (matrix.length - 1 > 2_000) {
    return {
      filename,
      rows: [],
      errors: ["Mỗi file nhận tối đa 2.000 câu."],
    };
  }

  const rows = [];
  const errors = [];
  const ids = new Set();

  matrix.slice(1).forEach((cells, index) => {
    try {
      if (cells.length !== headers.length) {
        throw new Error(
          `có ${cells.length} cột, cần đúng ${headers.length}; hãy kiểm tra dấu phẩy và ngoặc kép`,
        );
      }

      const raw = Object.fromEntries(
        headers.map((header, column) => [header, (cells[column] ?? "").trim()]),
      );
      const id = raw.id;
      const domain =
        raw.domain.toLowerCase() === "vocab"
          ? "vocabulary"
          : raw.domain.toLowerCase();
      const type = raw.type.toLowerCase();

      if (!id || ids.has(id)) {
        throw new Error(ids.has(id) ? `id bị trùng: ${id}` : "thiếu id");
      }
      if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(id)) {
        throw new Error(
          "id chỉ dùng chữ, số, dấu chấm, gạch ngang hoặc gạch dưới",
        );
      }
      if (!["grammar", "vocabulary"].includes(domain)) {
        throw new Error("domain phải là grammar hoặc vocabulary");
      }
      if (!QUESTION_TYPES.includes(type)) {
        throw new Error(`type không hỗ trợ: ${raw.type}`);
      }
      if (!raw.topic || !raw.prompt) {
        throw new Error("thiếu topic hoặc prompt");
      }
      if (domain === "grammar" && !raw.theory) {
        throw new Error("grammar cần theory bằng tiếng Việt có dấu");
      }
      if (domain === "vocabulary" && !raw.learning_key) {
        throw new Error("vocabulary cần learning_key");
      }

      const optionItems = splitList(raw.options);
      let options = optionItems;
      let answer = splitList(raw.answer);

      if (type === "matching") {
        const pairs = optionItems.map((item) => {
          const separator = item.indexOf("=>");
          if (separator < 1) {
            throw new Error("matching dùng left=>right trong options");
          }
          return {
            left: item.slice(0, separator).trim(),
            right: item.slice(separator + 2).trim(),
          };
        });
        if (pairs.length < 2 || pairs.some((pair) => !pair.left || !pair.right)) {
          throw new Error("matching cần ít nhất 2 cặp hợp lệ");
        }
        if (
          new Set(pairs.map((pair) => pair.left)).size !== pairs.length ||
          new Set(pairs.map((pair) => pair.right)).size !== pairs.length
        ) {
          throw new Error(
            "matching không được trùng vế trái hoặc vế phải",
          );
        }
        options = pairs;
        answer = Object.fromEntries(
          pairs.map((pair) => [pair.left, pair.right]),
        );
      } else {
        const answers = splitList(raw.answer);
        if (answers.length === 0) throw new Error("thiếu answer");
        if (
          ["mcq", "multiple_select", "ordering"].includes(type) &&
          optionItems.length < 2
        ) {
          throw new Error(`${type} cần ít nhất 2 options`);
        }
        if (type === "mcq" && answers.length !== 1) {
          throw new Error("mcq cần đúng 1 đáp án");
        }
        if (
          ["mcq", "multiple_select"].includes(type) &&
          !answers.every((item) =>
            optionItems.some(
              (option) =>
                option.toLocaleLowerCase("en") ===
                item.toLocaleLowerCase("en"),
            ),
          )
        ) {
          throw new Error("answer phải nằm trong options");
        }
        if (
          type === "ordering" &&
          !orderingAnswerUsesOptions(optionItems, answers)
        ) {
          throw new Error("answer không dùng đúng tập token trong options");
        }
        answer = answers;
      }

      ids.add(id);
      rows.push({
        id,
        domain,
        type,
        level: raw.level || "mixed",
        topic: raw.topic,
        subtopic: raw.subtopic,
        prompt: raw.prompt,
        context: raw.context,
        options,
        answer,
        explanation: raw.explanation,
        theory: raw.theory,
        hint: raw.hint,
        tags: splitList(raw.tags),
        difficulty: Math.min(
          5,
          Math.max(1, Number(raw.difficulty) || 2),
        ),
        learningKey: raw.learning_key,
        active: true,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "dữ liệu không hợp lệ";
      if (errors.length < 12) errors.push(`Dòng ${index + 2}: ${message}`);
    }
  });

  return { filename, rows: errors.length ? [] : rows, errors };
}

export function evaluateAnswer(expected, received, type) {
  if (type === "matching") {
    if (
      !received ||
      typeof received !== "object" ||
      Array.isArray(received) ||
      Array.isArray(expected)
    ) {
      return false;
    }
    const expectedEntries = Object.entries(expected);
    return (
      expectedEntries.length > 0 &&
      expectedEntries.every(
        ([left, right]) =>
          normalizeText(received[left]) === normalizeText(right),
      )
    );
  }

  if (type === "multiple_select") {
    if (!Array.isArray(expected) || !Array.isArray(received)) return false;
    const expectedSet = new Set(expected.map(normalizeText));
    const receivedSet = new Set(received.map(normalizeText));
    return (
      expectedSet.size === receivedSet.size &&
      [...expectedSet].every((answer) => receivedSet.has(answer))
    );
  }

  if (!Array.isArray(expected)) return false;
  const submitted = normalizeText(
    Array.isArray(received) ? received.join(" ") : received,
  );
  return expected.some((answer) => normalizeText(answer) === submitted);
}

export function displayAnswer(expected) {
  if (Array.isArray(expected)) return expected.join(" / ");
  return Object.entries(expected)
    .map(([left, right]) => `${left} → ${right}`)
    .join(" · ");
}

export function nextReview(previous, correct, now = Date.now()) {
  const oldEase = previous?.ease ?? 2.5;
  const oldInterval = previous?.intervalDays ?? 0;
  const oldRepetitions = previous?.repetitions ?? 0;
  const oldLapses = previous?.lapses ?? 0;

  if (!correct) {
    return {
      dueAt: now + 10 * 60 * 1_000,
      intervalDays: 0,
      ease: Math.max(1.3, oldEase - 0.2),
      repetitions: 0,
      lapses: oldLapses + 1,
      lastGrade: 1,
      lastReviewedAt: now,
      updatedAt: now,
    };
  }

  const ease = Math.min(3, oldEase + 0.05);
  const repetitions = oldRepetitions + 1;
  const intervalDays =
    oldRepetitions === 0
      ? 1
      : oldRepetitions === 1
        ? 6
        : Math.max(4, Math.round(oldInterval * ease));

  return {
    dueAt: now + intervalDays * 24 * 60 * 60 * 1_000,
    intervalDays,
    ease,
    repetitions,
    lapses: oldLapses,
    lastGrade: 4,
    lastReviewedAt: now,
    updatedAt: now,
  };
}

export function learningKeyFor(question) {
  return question.learningKey || question.id;
}

export function vocabularyFirstPassComplete(review) {
  return Boolean(
    review?.firstCompletedAt != null ||
      (Number.isFinite(review?.repetitions) && review.repetitions > 0) ||
      (Number.isFinite(review?.lastGrade) && review.lastGrade >= 3) ||
      (review &&
        review.lastGrade == null &&
        Number.isFinite(review.dueAt)),
  );
}

export function shuffle(values, random = Math.random) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

export function stableShuffle(values, key) {
  let seed =
    [...String(key)].reduce(
      (total, character) => total + character.charCodeAt(0),
      0,
    ) || 1;
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    seed = (seed * 9301 + 49297) % 233280;
    const target = Math.floor((seed / 233280) * (index + 1));
    [copy[index], copy[target]] = [copy[target], copy[index]];
  }
  return copy;
}

export function selectQuestions(
  questions,
  reviews,
  {
    setId = null,
    domain,
    level = "all",
    topic = "all",
    limit = SESSION_QUESTION_LIMIT,
    now = Date.now(),
    completedQuestionIds = [],
    completedLearningKeys = [],
  },
) {
  const completedQuestions = new Set(completedQuestionIds);
  const completedVocabulary = new Set(completedLearningKeys);
  const filtered = questions.filter(
    (question) =>
      question.active !== false &&
      (!setId || question.setId === setId) &&
      question.domain === domain &&
      (level === "all" ||
        question.level.toLocaleLowerCase("en") ===
          level.toLocaleLowerCase("en")) &&
      (topic === "all" ||
        question.topic.toLocaleLowerCase("en") ===
          topic.toLocaleLowerCase("en")),
  );

  if (domain === "grammar") {
    return shuffle(
      filtered.filter((question) => !completedQuestions.has(question.id)),
    ).slice(0, limit);
  }

  const variants = new Map();
  for (const question of shuffle(filtered)) {
    const key = learningKeyFor(question);
    if (!variants.has(key)) variants.set(key, question);
  }

  const reviewByKey = new Map(
    reviews.map((review) => [review.learningKey, review]),
  );
  const unseen = [];
  const due = [];

  for (const [key, question] of variants) {
    const review = reviewByKey.get(key);
    // Việc "đã học lần đầu" thuộc bộ đang chọn. Lịch ôn của từ vẫn dùng
    // chung toàn cục, nhưng không được làm một từ ở bộ A rồi bỏ qua từ đó
    // khi học bộ B lần đầu.
    const firstPassComplete = completedVocabulary.has(key);

    if (!firstPassComplete) unseen.push(question);
    else if (review && review.dueAt <= now) due.push(question);
  }

  // Không để câu SRS cũ chen vào trước những từ chưa từng làm đúng.
  const candidates = unseen.length > 0 ? unseen : due;
  return shuffle(candidates).slice(0, limit);
}

export function buildLibrary(questions, imports) {
  const grouped = new Map();
  questions
    .filter((question) => question.active !== false)
    .forEach((question) => {
      const key = `${question.domain}\u0000${question.level}\u0000${question.topic}`;
      const current = grouped.get(key);
      if (current) current.count += 1;
      else {
        grouped.set(key, {
          domain: question.domain,
          level: question.level,
          topic: question.topic,
          count: 1,
        });
      }
    });

  return {
    topics: [...grouped.values()].sort(
      (a, b) =>
        a.domain.localeCompare(b.domain) ||
        a.level.localeCompare(b.level) ||
        a.topic.localeCompare(b.topic),
    ),
    imports: [...imports]
      .sort((a, b) => b.importedAt - a.importedAt)
      .slice(0, 12),
  };
}

export function buildStats(
  questions,
  reviews,
  attempts,
  imports,
  now = Date.now(),
) {
  const active = questions.filter((question) => question.active !== false);
  const activeById = new Map(
    active.map((question) => [question.id, question]),
  );
  const completedGrammarIds = new Set();
  const completedVocabularyKeys = new Set();

  attempts.forEach((attempt) => {
    const question = activeById.get(attempt.questionId);
    if (!question) return;
    if (question.domain === "grammar") {
      completedGrammarIds.add(question.id);
    } else if (question.domain === "vocabulary" && attempt.correct) {
      completedVocabularyKeys.add(learningKeyFor(question));
    }
  });

  const reviewByKey = new Map(
    reviews.map((review) => [review.learningKey, review]),
  );
  const vocabularyKeys = new Set(
    active
      .filter((question) => question.domain === "vocabulary")
      .map(learningKeyFor),
  );
  const unseenKeys = new Set();

  vocabularyKeys.forEach((key) => {
    if (!completedVocabularyKeys.has(key)) unseenKeys.add(key);
  });

  const dueKeys =
    unseenKeys.size > 0
      ? unseenKeys
      : new Set(
          [...vocabularyKeys].filter((key) => {
            const review = reviewByKey.get(key);
            return review && review.dueAt <= now;
          }),
        );

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const todayAttempts = attempts.filter(
    (attempt) => attempt.attemptedAt >= today.getTime(),
  );
  const correct = attempts.filter((attempt) => attempt.correct).length;
  const lastImport = [...imports].sort(
    (a, b) => b.importedAt - a.importedAt,
  )[0];

  return {
    grammar: active.filter((question) => question.domain === "grammar").length,
    grammarRemaining: active.filter(
      (question) =>
        question.domain === "grammar" &&
        !completedGrammarIds.has(question.id),
    ).length,
    vocabulary: active.filter(
      (question) => question.domain === "vocabulary",
    ).length,
    vocabularyRemaining: unseenKeys.size,
    due: dueKeys.size,
    today: todayAttempts.length,
    topics: new Set(active.map((question) => question.topic)).size,
    accuracy:
      attempts.length > 0 ? Math.round((correct / attempts.length) * 100) : 0,
    lastImport: lastImport ?? null,
  };
}

export function formatDate(timestamp) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(timestamp));
}
