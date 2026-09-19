import {
  JA_QUESTION_TYPES,
  JA_TYPE_LABELS,
  parseJapaneseCsv,
  evaluateJapaneseAnswer,
  japaneseQuestionsToCsv,
  stripRuby,
  renderRubyHtml,
  escapeHtml,
  formatJapaneseSentence,
  JA_CSV_HEADERS,
} from "./japanese.js";

export {
  JA_QUESTION_TYPES,
  JA_TYPE_LABELS,
  parseJapaneseCsv,
  evaluateJapaneseAnswer,
  japaneseQuestionsToCsv,
  stripRuby,
  renderRubyHtml,
  formatJapaneseSentence,
};

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

export const SUBJECTS = {
  english: { name: "Tiếng Anh", short: "Anh", description: "Ngữ pháp và từ vựng" },
  chemistry: { name: "Hóa học", short: "Hóa", description: "Chất, phản ứng và tính toán" },
  physics: { name: "Vật lí", short: "Lí", description: "Hiện tượng, quy luật và bài tập" },
  biology: { name: "Sinh học", short: "Sinh", description: "Sự sống và thế giới tự nhiên" },
  japanese: { name: "Tiếng Nhật", short: "Nhật", description: "Hán tự, ngữ pháp và từ vựng" },
};

export const TYPE_LABELS = {
  mcq: "Chọn đáp án",
  multiple_select: "Chọn nhiều",
  fill_blank: "Điền chỗ trống",
  error_correction: "Sửa lỗi",
  sentence_transformation: "Viết lại câu",
  word_formation: "Dạng từ",
  ordering: "Sắp xếp",
  matching: "Ghép cặp",
  ...JA_TYPE_LABELS,
};

export const CSV_HEADERS = [
  "subject",
  "grade",
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
  let closedQuote = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        index += 1;
      } else if (inQuotes) {
        inQuotes = false;
        closedQuote = true;
      } else if (!field && !closedQuote) {
        inQuotes = true;
      } else {
        throw new Error('CSV có dấu ngoặc kép sai vị trí. Dấu " trong ô phải viết thành "" và bọc cả ô bằng ngoặc kép.');
      }
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      closedQuote = false;
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      field = "";
      closedQuote = false;
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
    } else {
      if (closedQuote && !inQuotes) throw new Error("CSV có ký tự thừa sau dấu ngoặc kép đóng.");
      field += char;
    }
  }

  if (inQuotes) throw new Error("CSV có dấu ngoặc kép chưa đóng.");
  row.push(field);
  if (row.some((cell) => cell.trim())) rows.push(row);
  return rows;
}

export function normalizeText(value, { caseSensitive = false } = {}) {
  const text = String(value ?? "")
    .normalize("NFKC")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.!?]+$/g, "");
  return caseSensitive ? text : text.toLocaleLowerCase("en");
}

function tokenBag(parts, settings = {}) {
  return parts
    .flatMap((part) => String(part).split(/\s+/))
    .map((part) => normalizeText(part, settings))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "en"));
}

export function orderingAnswerUsesOptions(options, answers, settings = {}) {
  const optionTokens = tokenBag(options, settings);
  return answers.length > 0 && answers.every((answer) => {
    const answerTokens = tokenBag([answer], settings);
    return (
      optionTokens.length === answerTokens.length &&
      optionTokens.every((token, index) => token === answerTokens[index])
    );
  });
}

export function buildCsvPreview(text, filename = "questions.csv") {
  const content = String(text).replace(/^\uFEFF/, "");

  // Detect Japanese CSV by parsed headers, not raw first line
  let isJapaneseCsv = false;
  try {
    const probeRows = parseCsv(content);
    if (probeRows.length > 0) {
      const parsedHeaders = probeRows[0].map(h => h.trim());
      isJapaneseCsv = (
        parsedHeaders.length === JA_CSV_HEADERS.length &&
        JA_CSV_HEADERS.every((h, i) => parsedHeaders[i] === h)
      );
    }
  } catch {
    // If CSV parsing fails at probe stage, fall through to legacy detection
    const firstLine = (content.split(/\r?\n/)[0] ?? "").trim();
    isJapaneseCsv =
      firstLine.startsWith("schema,subject") ||
      firstLine.includes("ja-v1") ||
      (firstLine.startsWith("schema") && firstLine.includes("japanese")) ||
      firstLine === JA_CSV_HEADERS.join(",");
  }

  if (isJapaneseCsv) {
    const parsed = parseJapaneseCsv(content, filename);
    return {
      filename,
      rows: parsed.rows ?? [],
      questions: parsed.questions ?? [],
      errors: parsed.errors ?? [],
    };
  }

  if (new TextEncoder().encode(content).length > 5 * 1024 * 1024) {
    return { filename, rows: [], errors: ["File vượt quá 5 MB."] };
  }
  if (content.includes("\uFFFD")) {
    return {
      filename,
      rows: [],
      errors: [
        "File có ký tự lỗi mã hóa. Hãy lưu lại dưới dạng CSV UTF-8 rồi thử lại.",
      ],
    };
  }

  let matrix;
  try {
    matrix = parseCsv(content);
  } catch (error) {
    return { filename, rows: [], errors: [error.message] };
  }
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
  const isLegacyEnglish = headers.length === 16 && CSV_HEADERS.slice(2).every((header, index) => headers[index] === header);
  if (!headerIsExact && !isLegacyEnglish) {
    return {
      filename,
      rows: [],
      errors: [
        `Header phải có đúng 18 cột theo thứ tự: ${CSV_HEADERS.join(",")}. File tiếng Anh cũ 16 cột vẫn được hỗ trợ.`,
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
      if (cells.some((cell) => cell.length > 10_000)) {
        throw new Error("mỗi ô chỉ được chứa tối đa 10.000 ký tự");
      }
      const id = raw.id;
      const subject = isLegacyEnglish ? "english" : raw.subject.toLowerCase();
      const grade = raw.grade || "";
      if (!Object.hasOwn(SUBJECTS, subject)) throw new Error("subject phải là english, chemistry, physics hoặc biology");
      if (subject !== "english" && !["6", "7", "8", "9"].includes(grade)) throw new Error("Hóa, Lí và Sinh cần grade là 6, 7, 8 hoặc 9");
      if (grade && !["6", "7", "8", "9"].includes(grade)) throw new Error("grade chỉ nhận lớp 6 đến lớp 9");
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
      if (subject === "english" ? !["grammar", "vocabulary"].includes(domain) : domain !== "practice") {
        throw new Error("Tiếng Anh dùng domain grammar/vocabulary; Hóa, Lí và Sinh dùng practice");
      }
      if (!QUESTION_TYPES.includes(type)) {
        throw new Error(`type không hỗ trợ: ${raw.type}`);
      }
      if (!raw.topic || !raw.prompt) {
        throw new Error("thiếu topic hoặc prompt");
      }
      if (!raw.explanation) throw new Error("thiếu explanation (giải thích đáp án)");
      if (raw.difficulty && !/^[1-5]$/.test(raw.difficulty)) {
        throw new Error("difficulty phải là số nguyên từ 1 đến 5");
      }
      if (domain !== "vocabulary" && !raw.theory) {
        throw new Error("grammar và practice cần theory bằng tiếng Việt có dấu");
      }
      if (domain === "vocabulary" && !raw.learning_key) {
        throw new Error("vocabulary cần learning_key");
      }

      const optionItems = splitList(raw.options);
      const tags = splitList(raw.tags);
      const normalize = (value) => normalizeText(value, { caseSensitive: tags.includes("case-sensitive") });
      if (optionItems.length > 30) throw new Error("mỗi câu nhận tối đa 30 options");
      if (["mcq", "multiple_select"].includes(type) &&
          new Set(optionItems.map(normalize)).size !== optionItems.length) {
        throw new Error("options bị trùng sau khi chuẩn hóa chữ và dấu câu");
      }
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
          new Set(pairs.map((pair) => normalize(pair.left))).size !== pairs.length ||
          new Set(pairs.map((pair) => normalize(pair.right))).size !== pairs.length
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
        if (type === "multiple_select" && (new Set(answers.map(normalize)).size < 2 || new Set(answers.map(normalize)).size !== answers.length)) {
          throw new Error("multiple_select cần ít nhất 2 đáp án đúng khác nhau");
        }
        if (
          ["mcq", "multiple_select"].includes(type) &&
          !answers.every((item) =>
            optionItems.some(
              (option) =>
                normalize(option) === normalize(item),
            ),
          )
        ) {
          throw new Error("answer phải nằm trong options");
        }
        if (
          type === "ordering" &&
          !orderingAnswerUsesOptions(optionItems, answers, {
            caseSensitive: tags.includes("case-sensitive"),
          })
        ) {
          throw new Error("answer không dùng đúng tập token trong options");
        }
        answer = answers;
      }

      ids.add(id);
      rows.push({
        subject,
        grade,
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
        tags,
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

  if (new Set(rows.map((row) => row.subject)).size > 1) errors.push("Mỗi CSV chỉ chứa một môn. Hãy tách thành file riêng cho từng môn.");
  return { filename, rows: errors.length ? [] : rows, errors };
}

export function evaluateAnswer(expected, received, type, settings = {}) {
  if (JA_QUESTION_TYPES.includes(type)) {
    return evaluateJapaneseAnswer(
      {
        answer: expected,
        acceptedOrders: settings?.acceptedOrders ?? settings?.accepted_orders,
        options: settings?.options,
        type,
        starPosition: settings?.starPosition ?? settings?.star_position,
      },
      received,
    );
  }

  const normalize = (value) => normalizeText(value, settings);
  if (type === "matching") {
    if (
      !expected || !received ||
      typeof received !== "object" ||
      Array.isArray(received) ||
      Array.isArray(expected)
    ) {
      return false;
    }
    const expectedEntries = Object.entries(expected);
    return (
      expectedEntries.length > 0 &&
      Object.keys(received).length === expectedEntries.length &&
      expectedEntries.every(
        ([left, right]) =>
          normalize(received[left]) === normalize(right),
      )
    );
  }

  if (type === "multiple_select") {
    if (!Array.isArray(expected) || !Array.isArray(received)) return false;
    const expectedSet = new Set(expected.map(normalize));
    const receivedSet = new Set(received.map(normalize));
    return (
      expectedSet.size === receivedSet.size &&
      [...expectedSet].every((answer) => receivedSet.has(answer))
    );
  }

  if (!Array.isArray(expected)) return false;
  const submitted = normalize(
    Array.isArray(received) ? received.join(" ") : received,
  );
  return Boolean(submitted) && expected.some((answer) => normalize(answer) === submitted);
}

export function displayAnswer(expected, optionsOrQuestion) {
  let opts = optionsOrQuestion;
  let target = expected;

  if (expected && typeof expected === "object" && !Array.isArray(expected) && (expected.type || expected.domain || expected.subject)) {
    opts = expected;
    target = expected.answer;
  }

  if (opts) {
    const questionObj = (opts && typeof opts === "object" && !Array.isArray(opts)) ? opts : null;
    const optList = Array.isArray(opts) ? opts : questionObj?.options;

    // G3: ordering — show sentence from submitted order or first accepted order
    if (questionObj?.type === "ja_grammar_order") {
      const orders = questionObj?.acceptedOrders ?? questionObj?.accepted_orders ?? [];
      const order = Array.isArray(target) ? target : (orders[0] ?? []);
      if (Array.isArray(optList)) {
        return formatJapaneseSentence(optList, order);
      }
    }

    // G2: star — show the selected fragment text, not the full sentence
    if (questionObj?.type === "ja_grammar_star") {
      if (Array.isArray(optList) && typeof target === "string") {
        const selectedOpt = optList.find((o) => o.id === target);
        if (selectedOpt) return selectedOpt.text;
      }
    }

    if (Array.isArray(optList) && optList.length > 0 && optList[0]?.id != null) {
      const match = optList.find((o) => o.id === target);
      if (match) return match.text;
    }
  }

  if (Array.isArray(target)) return target.join(" / ");
  return Object.entries(target ?? {})
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

export function startOfDay(timestamp) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function isReviewDue(review, now = Date.now()) {
  if (!review || !Number.isFinite(review.dueAt)) return false;
  if (review.intervalDays === 0) {
    return review.dueAt <= now;
  }
  return review.dueAt <= now || startOfDay(review.dueAt) <= startOfDay(now);
}

export function resolveEscapeAction({
  modalOpen = false,
  view = "home",
  sessionMode = null,
  sessionResult = null,
  flipped = false,
} = {}) {
  if (modalOpen) return "close-modal";
  if (view === "study") {
    if (sessionMode === "flashcards" && !sessionResult && flipped) {
      return "unflip";
    }
    return "pause";
  }
  return null;
}

export function selectQuestions(
  questions,
  reviews,
  {
    setId = null,
    domain,
    level = "all",
    topic = "all",
    grade = "all",
    type = "all",
    chapter = "all",
    lesson = "all",
    limit = SESSION_QUESTION_LIMIT,
    now = Date.now(),
    completedQuestionIds = [],
    completedLearningKeys = [],
    dueOnly = false,
  },
) {
  const completedQuestions = new Set(completedQuestionIds);
  const completedVocabulary = new Set(completedLearningKeys);
  const filtered = questions.filter(
    (question) =>
      question.active !== false &&
      (!setId || question.setId === setId) &&
      question.domain === domain &&
      (grade === "all" || question.grade === grade) &&
      (type === "all" || question.type === type) &&
      (chapter === "all" || String(question.chapter) === String(chapter)) &&
      (lesson === "all" || String(question.lesson) === String(lesson)) &&
      (level === "all" ||
        question.level?.toLocaleLowerCase("en") ===
          level.toLocaleLowerCase("en")) &&
      (topic === "all" ||
        question.topic?.toLocaleLowerCase("en") ===
          topic.toLocaleLowerCase("en")),
  );

  const isJapanese = filtered.some((q) => q.subject === "japanese");

  if (isJapanese) {
    if (domain !== "vocabulary") {
      if (dueOnly) return [];
      return shuffle(
        filtered.filter((question) => !completedQuestions.has(question.id)),
      ).slice(0, limit);
    }

    // Japanese Vocabulary
    if (dueOnly) {
      const reviewByKey = new Map(
        reviews.map((review) => [review.learningKey, review]),
      );
      const attemptedByKey = new Map();
      for (const question of filtered) {
        if (completedQuestions.has(question.id)) {
          const key = learningKeyFor(question);
          if (!attemptedByKey.has(key)) attemptedByKey.set(key, []);
          attemptedByKey.get(key).push(question);
        }
      }

      const dueVariants = [];
      for (const [key, variants] of attemptedByKey) {
        const review = reviewByKey.get(key);
        if (isReviewDue(review, now)) {
          let picked = variants[0];
          if (variants.length > 1 && review?.lastQuestionId) {
            const lastIdx = variants.findIndex((v) => v.id === review.lastQuestionId);
            if (lastIdx !== -1) {
              picked = variants[(lastIdx + 1) % variants.length];
            } else {
              picked = shuffle(variants)[0];
            }
          }
          dueVariants.push(picked);
        }
      }

      return shuffle(dueVariants).slice(0, limit);
    } else {
      // Câu mới tiếng Nhật: KHÔNG KHỬ TRÙNG THEO learning_key
      const unseen = filtered.filter((question) => !completedQuestions.has(question.id));
      return shuffle(unseen).slice(0, limit);
    }
  }

  if (domain !== "vocabulary") {
    if (dueOnly) return [];
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
    const isDue = isReviewDue(review, now);

    if (dueOnly) {
      if (isDue) due.push(question);
    } else {
      if (!firstPassComplete) unseen.push(question);
      else if (isDue) due.push(question);
    }
  }

  // Không để câu SRS cũ chen vào trước những từ chưa từng làm đúng (trừ khi do người dùng yêu cầu ôn đúng hạn).
  const candidates = dueOnly ? due : (unseen.length > 0 ? unseen : due);
  return shuffle(candidates).slice(0, limit);
}

export function buildLibrary(questions, imports) {
  const grouped = new Map();
  questions
    .filter((question) => question.active !== false)
    .forEach((question) => {
      const isJapanese = question.subject === "japanese";
      const key = isJapanese
        ? `${question.subject}\u0000${question.chapter ?? ""}\u0000${question.lesson ?? ""}\u0000${question.domain}\u0000${question.level}\u0000${question.topic}`
        : `${question.subject || "english"}\u0000${question.grade || ""}\u0000${question.domain}\u0000${question.level}\u0000${question.topic}`;
      const current = grouped.get(key);
      if (current) current.count += 1;
      else {
        grouped.set(key, {
          subject: question.subject || "english",
          grade: question.grade || "",
          chapter: question.chapter ?? null,
          lesson: question.lesson ?? null,
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
        a.subject.localeCompare(b.subject) ||
        (a.chapter != null && b.chapter != null ? a.chapter - b.chapter : 0) ||
        (a.lesson != null && b.lesson != null ? a.lesson - b.lesson : 0) ||
        a.grade.localeCompare(b.grade) ||
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
  const completedPracticeIds = new Set();
  const completedVocabularyKeys = new Set();

  attempts.forEach((attempt) => {
    const question = activeById.get(attempt.questionId);
    if (!question) return;
    if (question.domain === "grammar") {
      completedGrammarIds.add(question.id);
    } else if (question.domain === "practice") {
      completedPracticeIds.add(question.id);
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
            return isReviewDue(review, now);
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
    practice: active.filter((q) => q.domain === "practice").length,
    practiceRemaining: active.filter((q) => q.domain === "practice" && !completedPracticeIds.has(q.id)).length,
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

export const MAX_SHARE_BYTES = 50 * 1024;

export function encodeSharePayload(csvText) {
  if (typeof csvText !== "string") throw new Error("Dữ liệu chia sẻ phải là chuỗi CSV.");
  const bytes = new TextEncoder().encode(csvText);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function decodeSharePayload(base64Str) {
  if (typeof base64Str !== "string") throw new Error("Dữ liệu mã hóa không hợp lệ.");
  if (base64Str.length > MAX_SHARE_BYTES) {
    throw new Error("Dữ liệu chia sẻ vượt quá giới hạn 50 KB.");
  }
  let binary;
  try {
    binary = atob(base64Str);
  } catch {
    throw new Error("Dữ liệu Base64 bị hỏng hoặc không đúng định dạng.");
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  try {
    const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
    return decoder.decode(bytes);
  } catch {
    throw new Error("Dữ liệu UTF-8 không hợp lệ.");
  }
}

export function formatInlineMarkdown(text) {
  return String(text ?? "")
    .replace(/\*\*([^*\n]+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*([^*\s\n](?:[^*\n]*[^*\s\n])?)\*(?!\*)/g, "<em>$1</em>")
    .replace(/`([^`\n]+)`/g, "<code>$1</code>");
}

export function splitExplanationSections(text) {
  if (!text || typeof text !== "string") return [];

  const normalized = text.replace(/\r\n/g, "\n").trim();

  const markerRegex = /(?:^|[\s\n。、!?.,])(?:\*\*)?(Thứ tự đúng|Thứ tự|Câu hoàn chỉnh|Câu đúng|Dịch câu đúng|Dịch câu|Dịch ngữ cảnh|Dịch nghĩa|Dịch|Giải thích|Phân tích|Lưu ý|Cấu trúc|Ý nghĩa|Từ vựng|Ngữ pháp|Cách dùng)(?:\*\*)?\s*[:：](?:\*\*)?/gi;

  const matches = [];
  let m;
  while ((m = markerRegex.exec(normalized)) !== null) {
    const raw = m[0];
    const prefixLen = raw.match(/^[\s\n。、!?.,]*/)[0].length;
    const start = m.index + prefixLen;
    const label = m[1].trim();
    matches.push({
      start,
      label,
      rawMarker: raw.slice(prefixLen),
      markerLength: raw.length - prefixLen,
    });
  }

  if (matches.length === 0) {
    const lines = normalized.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    return lines.map((line) => ({ label: null, content: line }));
  }

  const sections = [];
  if (matches[0].start > 0) {
    const pre = normalized.slice(0, matches[0].start).trim();
    if (pre) sections.push({ label: null, content: pre });
  }

  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const contentStart = cur.start + cur.markerLength;
    const contentEnd = i + 1 < matches.length ? matches[i + 1].start : normalized.length;
    let content = normalized.slice(contentStart, contentEnd).trim();
    content = content.replace(/^\*\*\s*/, "").replace(/\s*\*\*$/, "").trim();

    if (/^Dịch/i.test(cur.label)) {
      const quoteMatch = content.match(/^("(?:[^"\\]|\\.)*"|“[^”]*”|'[^']*'|「[^」]*」|『[^』]*』)(?:\.|\s)*([\s\S]*)$/);
      if (quoteMatch && quoteMatch[2] && quoteMatch[2].trim()) {
        const trans = quoteMatch[1].trim();
        const trailing = quoteMatch[2].trim();
        sections.push({ label: cur.label, content: trans });

        const starSentenceMatch = trailing.match(/^(Mảnh ở vị trí [^.]+\.)\s*([\s\S]*)$/i);
        if (starSentenceMatch) {
          sections.push({ label: "Vị trí ★", content: starSentenceMatch[1].trim() });
          if (starSentenceMatch[2].trim()) {
            sections.push({ label: "Giải thích", content: starSentenceMatch[2].trim() });
          }
        } else {
          sections.push({ label: "Giải thích", content: trailing });
        }
        continue;
      }
    }

    if (/^Câu (?:hoàn chỉnh|đúng)/i.test(cur.label)) {
      const starMatch = content.match(/^(.*?)(?:[。.]\s*)(Mảnh ở vị trí [^.]+\.?)\s*([\s\S]*)$/i);
      if (starMatch && !/Dịch/i.test(starMatch[1])) {
        sections.push({ label: cur.label, content: starMatch[1].trim() });
        sections.push({ label: "Vị trí ★", content: starMatch[2].trim() });
        if (starMatch[3].trim()) {
          sections.push({ label: "Giải thích", content: starMatch[3].trim() });
        }
        continue;
      }
    }

    sections.push({ label: cur.label, content });
  }

  return sections;
}

export function formatExplanationHtml(text, { isJapanese = false } = {}) {
  if (!text) return "";
  const sections = splitExplanationSections(text);
  if (sections.length === 0) return "";

  const blocks = sections.map((sec) => {
    const rawContent = sec.content;
    let formattedContent = isJapanese ? renderRubyHtml(rawContent) : escapeHtml(rawContent);
    formattedContent = formatInlineMarkdown(formattedContent);

    if (!sec.label) {
      return `<div class="explanation-row"><span class="explanation-text">${formattedContent}</span></div>`;
    }

    const isSentence = /^Câu (?:hoàn chỉnh|đúng)/i.test(sec.label);
    const isTranslation = /^Dịch/i.test(sec.label);
    const isOrder = /^Thứ tự/i.test(sec.label);
    const isStar = /^Vị trí ★/i.test(sec.label);

    let rowClass = "explanation-row";
    if (isSentence) rowClass += " explanation-row-sentence";
    else if (isTranslation) rowClass += " explanation-row-translation";
    else if (isOrder) rowClass += " explanation-row-order";
    else if (isStar) rowClass += " explanation-row-star";
    else rowClass += " explanation-row-notes";

    const labelHtml = `<strong class="explanation-label">${escapeHtml(sec.label)}:</strong>`;

    let valueHtml = "";
    if (isSentence) {
      valueHtml = `<strong class="explanation-sentence" ${isJapanese ? 'lang="ja"' : ""}>${formattedContent}</strong>`;
    } else if (isTranslation) {
      valueHtml = `<span class="explanation-translation">${formattedContent}</span>`;
    } else {
      valueHtml = `<span class="explanation-text">${formattedContent}</span>`;
    }

    return `<div class="${rowClass}">${labelHtml} ${valueHtml}</div>`;
  });

  return `<div class="explanation-content">${blocks.join("")}</div>`;
}
