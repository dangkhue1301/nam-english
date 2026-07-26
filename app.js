import {
  buildCsvPreview,
  displayAnswer,
  evaluateAnswer,
  formatDate,
  SESSION_QUESTION_LIMIT,
  stableShuffle,
  TYPE_LABELS,
} from "./core.js";
import {
  clearStudySession,
  createRepository,
  getSessionQuestions,
  readDashboard,
  readSelectedQuestionSet,
  restoreStudySession,
  saveSelectedQuestionSet,
  saveStudySession,
} from "./storage.js";

const CAMBRIDGE_TOPICS = [
  "Unit 1 · Present tenses",
  "Unit 2 · Past tenses 1",
  "Unit 3 · Past tenses 2",
  "Unit 4 · Present perfect",
  "Unit 5 · Future forms 1",
  "Unit 6 · Future forms 2",
  "Unit 7 · Countable & uncountable nouns",
  "Unit 8 · Referring to nouns",
  "Unit 9 · Pronouns & referencing",
  "Unit 10 · Adjectives & adverbs",
  "Unit 11 · Comparatives & comparisons",
  "Unit 12 · The noun phrase",
  "Unit 13 · Modal verbs 1",
  "Unit 14 · Modal verbs 2",
  "Unit 15 · Reported speech",
  "Unit 16 · Conditionals",
  "Unit 17 · The passive",
  "Unit 18 · Relative clauses",
  "Unit 19 · Linking ideas",
  "Unit 20 · Giving reasons & results",
  "Unit 21 · Verb + to-infinitive or -ing",
  "Unit 22 · Verbs & prepositions",
  "Unit 23 · Phrasal verbs",
  "Unit 24 · The subjunctive",
  "Unit 25 · Word order",
];

const DESTINATION_B1_TOPICS = [
  "Unit 1 · Present simple, present continuous & stative verbs",
  "Unit 2 · Past simple, past continuous & used to",
  "Unit 4 · Present perfect simple & continuous",
  "Unit 5 · Past perfect simple & continuous",
  "Unit 7 · Future time",
  "Unit 8 · Prepositions of time & place",
  "Unit 10 · Passive voice 1",
  "Unit 11 · Passive voice 2",
  "Unit 13 · Countable & uncountable nouns",
  "Unit 14 · Articles",
  "Unit 16 · Pronouns & possessive determiners",
  "Unit 17 · Relative clauses",
  "Unit 19 · Modals: ability, permission & advice",
  "Unit 20 · Modals: obligation, probability & possibility",
  "Unit 22 · Modal perfect",
  "Unit 23 · Questions, tags & indirect questions",
  "Unit 25 · So/such & too/enough",
  "Unit 26 · Comparatives & superlatives",
  "Unit 28 · Zero, first & second conditionals",
  "Unit 29 · Third conditional",
  "Unit 31 · Reported speech",
  "Unit 32 · Reported questions, orders & requests",
  "Unit 34 · Direct & indirect objects",
  "Unit 35 · Wish",
  "Unit 37 · -ing forms & infinitives",
  "Unit 38 · Both/either/neither & so/nor",
  "Unit 40 · Connectives",
  "Unit 41 · Causative",
];

const DESTINATION_B2_TOPICS = [
  "Unit 1 · Present time",
  "Unit 3 · Past time",
  "Unit 5 · Future time & time/place prepositions",
  "Unit 7 · Articles, nouns & quantifiers",
  "Unit 9 · Conditionals",
  "Unit 11 · Comparatives, so/such, enough & too",
  "Unit 13 · Modal verbs",
  "Unit 15 · Passive, causative & objects",
  "Unit 17 · -ing forms & infinitives",
  "Unit 19 · Questions, tags & indirect questions",
  "Unit 21 · Reported speech & reporting verbs",
  "Unit 23 · Relative clauses & participles",
  "Unit 25 · Unreal past, wishes & contrast",
  "Unit 27 · Inversions & possessives",
];

const EMPTY_STATS = {
  grammar: 0,
  grammarRemaining: 0,
  vocabulary: 0,
  vocabularyRemaining: 0,
  due: 0,
  today: 0,
  topics: 0,
  accuracy: 0,
  lastImport: null,
};

const state = {
  view: "learn",
  stats: EMPTY_STATS,
  topics: [],
  imports: [],
  sets: [],
  selectedSetId: null,
  queue: [],
  sessionDomain: null,
  sessionTarget: 0,
  sessionDone: 0,
  sessionCorrect: 0,
  result: null,
  loading: false,
  levelFilter: "all",
  topicFilter: "all",
  notice: "",
  csvPreview: null,
  dragActive: false,
  storageMode: "trình duyệt",
  answer: {
    text: "",
    selected: [],
    ordered: [],
    remaining: [],
    matches: {},
    hintOpen: false,
  },
};

const root = document.querySelector("#app");
let repository;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function resetAnswer(question) {
  state.answer = {
    text: "",
    selected: [],
    ordered: [],
    remaining:
      question?.type === "ordering" && Array.isArray(question.options)
        ? [...question.options]
        : [],
    matches: {},
    hintOpen: false,
  };
}

function showNotice(message) {
  state.notice = message;
  render();
}

function persistCurrentSession() {
  saveStudySession({
    queue: state.queue,
    selectedSetId: state.selectedSetId,
    sessionDomain: state.sessionDomain,
    sessionTarget: state.sessionTarget,
    sessionDone: state.sessionDone,
    sessionCorrect: state.sessionCorrect,
    result: state.result,
  });
}

async function refreshDashboard({ repaint = true } = {}) {
  const dashboard = await readDashboard(repository, state.selectedSetId);
  state.stats = dashboard.stats;
  state.topics = dashboard.topics;
  state.imports = dashboard.imports;
  state.sets = dashboard.sets;
  state.selectedSetId = dashboard.selectedSetId;
  saveSelectedQuestionSet(state.selectedSetId);
  if (repaint) render();
}

function availableLevels() {
  return [...new Set(state.topics.map((item) => item.level).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b),
  );
}

function availableTopics() {
  return [
    ...new Set(
      state.topics
        .filter(
          (item) =>
            (!state.sessionDomain || item.domain === state.sessionDomain) &&
            (state.levelFilter === "all" ||
              item.level === state.levelFilter),
        )
        .map((item) => item.topic),
    ),
  ].sort((a, b) => a.localeCompare(b));
}

function changeView(view) {
  clearStudySession();
  state.view = view;
  state.queue = [];
  state.sessionDomain = null;
  state.sessionTarget = 0;
  state.sessionDone = 0;
  state.sessionCorrect = 0;
  state.result = null;
  state.notice = "";
  resetAnswer();
  render();
}

async function selectQuestionSet(setId) {
  if (
    state.loading ||
    !setId ||
    !state.sets.some((set) => set.id === setId)
  ) {
    return;
  }
  clearStudySession();
  state.selectedSetId = setId;
  saveSelectedQuestionSet(setId);
  state.queue = [];
  state.sessionDomain = null;
  state.sessionTarget = 0;
  state.sessionDone = 0;
  state.sessionCorrect = 0;
  state.result = null;
  state.levelFilter = "all";
  state.topicFilter = "all";
  state.notice = "";
  resetAnswer();
  state.loading = true;
  render();
  try {
    await refreshDashboard({ repaint: false });
  } catch (error) {
    state.notice =
      error instanceof Error ? error.message : "Không thể đổi bộ câu hỏi.";
  } finally {
    state.loading = false;
    render();
  }
}

async function beginSession(domain) {
  if (state.loading) return;
  if (!state.selectedSetId) {
    state.notice = "Hãy nhập hoặc chọn một bộ câu hỏi trước.";
    render();
    return;
  }
  clearStudySession();
  state.loading = true;
  state.notice = "";
  state.sessionDomain = null;
  state.queue = [];
  state.sessionTarget = 0;
  state.sessionDone = 0;
  state.sessionCorrect = 0;
  state.result = null;
  render();

  try {
    const topicExistsForDomain =
      state.topicFilter === "all" ||
      state.topics.some(
        (item) =>
          item.domain === domain && item.topic === state.topicFilter,
      );
    const questions = await getSessionQuestions(repository, {
      setId: state.selectedSetId,
      domain,
      level: state.levelFilter,
      topic: topicExistsForDomain ? state.topicFilter : "all",
      limit: SESSION_QUESTION_LIMIT,
    });

    if (questions.length === 0) {
      state.notice =
        domain === "vocabulary"
          ? "Bạn đã làm hết từ mới trong bộ này và hiện chưa có từ đến hạn."
          : "Bạn đã làm hết câu Grammar phù hợp trong bộ này.";
      return;
    }

    state.sessionDomain = domain;
    state.queue = questions;
    state.sessionTarget = questions.length;
    resetAnswer(questions[0]);
    persistCurrentSession();
  } catch (error) {
    state.notice =
      error instanceof Error ? error.message : "Không thể bắt đầu buổi học.";
  } finally {
    state.loading = false;
    render();
  }
}

function currentAnswer() {
  const question = state.queue[0];
  if (!question) return "";
  if (question.type === "matching") return state.answer.matches;
  if (question.type === "multiple_select") return state.answer.selected;
  if (question.type === "mcq") return state.answer.selected[0] ?? "";
  if (question.type === "ordering") return state.answer.ordered.join(" ");
  return state.answer.text;
}

function answerReady() {
  const question = state.queue[0];
  if (!question) return false;
  if (question.type === "matching") {
    return (
      question.options.length > 0 &&
      question.options.every((pair) => state.answer.matches[pair.left])
    );
  }
  if (["multiple_select", "mcq"].includes(question.type)) {
    return state.answer.selected.length > 0;
  }
  if (question.type === "ordering") {
    return (
      state.answer.remaining.length === 0 &&
      state.answer.ordered.length > 0
    );
  }
  return state.answer.text.trim().length > 0;
}

async function submitAnswer() {
  const question = state.queue[0];
  if (!question || state.result || state.loading || !answerReady()) return;

  state.loading = true;
  render();
  try {
    const received = currentAnswer();
    const correct = evaluateAnswer(question.answer, received, question.type);
    const review = await repository.recordAttempt(question, received, correct);
    state.result = {
      correct,
      correctAnswer: displayAnswer(question.answer),
      review,
    };
    persistCurrentSession();
    await refreshDashboard({ repaint: false });
  } catch (error) {
    state.notice =
      error instanceof Error ? error.message : "Chấm bài thất bại.";
  } finally {
    state.loading = false;
    render();
  }
}

function continueSession() {
  const current = state.queue[0];
  if (!current || !state.result) return;

  const shouldRepeat =
    current.domain === "vocabulary" && !state.result.correct;
  if (state.result.correct) state.sessionCorrect += 1;
  if (!shouldRepeat) state.sessionDone += 1;
  state.queue = shouldRepeat
    ? [...state.queue.slice(1), current]
    : state.queue.slice(1);
  state.result = null;
  resetAnswer(state.queue[0]);
  persistCurrentSession();
  render();
}

function endSession() {
  clearStudySession();
  state.queue = [];
  state.sessionDomain = null;
  state.sessionTarget = 0;
  state.sessionDone = 0;
  state.sessionCorrect = 0;
  state.result = null;
  resetAnswer();
  render();
}

async function loadCsvFile(file) {
  if (!file.name.toLowerCase().endsWith(".csv")) {
    state.csvPreview = {
      filename: file.name,
      rows: [],
      errors: ["Chỉ nhận file .csv."],
    };
    render();
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    state.csvPreview = {
      filename: file.name,
      rows: [],
      errors: ["File lớn hơn 5 MB."],
    };
    render();
    return;
  }

  try {
    state.csvPreview = buildCsvPreview(await file.text(), file.name);
  } catch (error) {
    state.csvPreview = {
      filename: file.name,
      rows: [],
      errors: [
        error instanceof Error ? error.message : "Không đọc được file CSV.",
      ],
    };
  }
  render();
}

async function loadSample() {
  state.loading = true;
  render();
  try {
    const response = await fetch("./sample_questions.csv");
    if (!response.ok) throw new Error("Không tải được bộ mẫu.");
    state.csvPreview = buildCsvPreview(
      await response.text(),
      "sample_questions.csv",
    );
  } catch (error) {
    state.notice =
      error instanceof Error ? error.message : "Không tải được bộ mẫu.";
  } finally {
    state.loading = false;
    render();
  }
}

async function importCsv() {
  if (
    !state.csvPreview ||
    state.csvPreview.errors.length > 0 ||
    state.csvPreview.rows.length === 0 ||
    state.loading
  ) {
    return;
  }

  state.loading = true;
  render();
  try {
    const { rows, filename } = state.csvPreview;
    const importedSet = await repository.importQuestions(rows, filename);
    state.selectedSetId = importedSet.id;
    saveSelectedQuestionSet(importedSet.id);
    state.levelFilter = "all";
    state.topicFilter = "all";
    state.csvPreview = null;
    await refreshDashboard({ repaint: false });
    state.notice = `Đã tạo bộ “${importedSet.name}” với ${rows.length} câu.`;
  } catch (error) {
    state.notice =
      error instanceof Error ? error.message : "Không thể nhập bộ câu hỏi.";
  } finally {
    state.loading = false;
    render();
  }
}

function navMarkup() {
  const items = [
    ["learn", "Học"],
    ["import", "Nhập CSV"],
    ["topics", "Chủ điểm"],
    ["progress", "Tiến độ"],
  ];
  return items
    .map(
      ([key, label]) => `
        <button
          class="nav-item${state.view === key ? " active" : ""}"
          data-action="nav"
          data-view="${key}"
          type="button"
          ${state.view === key ? 'aria-current="page"' : ""}
        >${label}</button>
      `,
    )
    .join("");
}

function filtersMarkup() {
  const levels = availableLevels()
    .map(
      (level) =>
        `<option value="${escapeHtml(level)}"${
          state.levelFilter === level ? " selected" : ""
        }>${escapeHtml(level)}</option>`,
    )
    .join("");
  const topics = availableTopics()
    .map(
      (topic) =>
        `<option value="${escapeHtml(topic)}"${
          state.topicFilter === topic ? " selected" : ""
        }>${escapeHtml(topic)}</option>`,
    )
    .join("");

  return `
    <div class="filters-row">
      <label>
        <span>Level</span>
        <select data-filter="level" aria-label="Lọc theo trình độ">
          <option value="all">Tất cả</option>
          ${levels}
        </select>
      </label>
      <label>
        <span>Chủ điểm</span>
        <select data-filter="topic" aria-label="Lọc theo chủ điểm">
          <option value="all">Tất cả</option>
          ${topics}
        </select>
      </label>
    </div>
  `;
}

function questionSetPickerMarkup() {
  if (state.sets.length === 0) return "";
  return `
    <section class="set-picker" aria-labelledby="set-picker-title">
      <div class="set-picker-heading">
        <div>
          <span class="eyebrow">BỘ CÂU HỎI</span>
          <h2 id="set-picker-title">Chọn bộ muốn làm</h2>
        </div>
        <span>${state.sets.length} bộ đã lưu</span>
      </div>
      <div class="set-list">
        ${state.sets
          .map(
            (set) => `
              <button
                class="set-option${
                  state.selectedSetId === set.id ? " selected" : ""
                }"
                data-action="select-set"
                data-set-id="${escapeHtml(set.id)}"
                type="button"
                aria-pressed="${
                  state.selectedSetId === set.id ? "true" : "false"
                }"
              >
                <span class="set-check" aria-hidden="true">${
                  state.selectedSetId === set.id ? "✓" : ""
                }</span>
                <span class="set-option-copy">
                  <strong>${escapeHtml(set.name)}</strong>
                  <small>${set.count} câu · ${formatDate(
                    set.importedAt,
                  )}</small>
                </span>
              </button>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function learnHomeMarkup() {
  return `
    <section class="learn-home">
      <div class="hero-copy">
        <span class="eyebrow">GRAMMAR + VOCABULARY</span>
        <h1>Một câu mỗi lần.<br><span>Nhớ lâu hơn.</span></h1>
        <p>Mỗi lượt tối đa 30 câu. Chấm ngay, từ sai sẽ quay lại.</p>
      </div>

      ${questionSetPickerMarkup()}

      <div class="quick-stats" aria-label="Tóm tắt tiến độ">
        <div><strong>${state.stats.due}</strong><span>từ đến hạn</span></div>
        <div><strong>${state.stats.accuracy}%</strong><span>chính xác</span></div>
        <div><strong>${state.stats.today}</strong><span>câu hôm nay</span></div>
      </div>

      ${filtersMarkup()}

      <div class="mode-grid">
        <button class="mode-card grammar" data-action="begin" data-domain="grammar" type="button" ${
          state.loading || !state.selectedSetId ? "disabled" : ""
        }>
          <span class="mode-letter">G</span>
          <span class="mode-content">
            <small>${state.stats.grammarRemaining} câu chưa làm</small>
            <strong>Grammar</strong>
            <span>Luyện đa dạng + nhắc lý thuyết</span>
          </span>
          <span class="mode-arrow" aria-hidden="true">→</span>
        </button>
        <button class="mode-card vocabulary" data-action="begin" data-domain="vocabulary" type="button" ${
          state.loading || !state.selectedSetId ? "disabled" : ""
        }>
          <span class="mode-letter">V</span>
          <span class="mode-content">
            <small>${state.stats.due} đến hạn</small>
            <strong>Vocabulary</strong>
            <span>Ôn theo spaced repetition</span>
          </span>
          <span class="mode-arrow" aria-hidden="true">→</span>
        </button>
      </div>

      ${
        state.stats.grammar + state.stats.vocabulary === 0
          ? `
            <div class="empty-library">
              <span>Kho câu hỏi đang trống.</span>
              <button data-action="go-import" type="button">Nhập bộ đầu tiên</button>
            </div>
          `
          : ""
      }
    </section>
  `;
}

function optionMarkup(question) {
  return `
    <div class="option-list">
      ${question.options
        .map(
          (option, index) => `
            <button
              class="option${
                state.answer.selected.includes(option) ? " selected" : ""
              }"
              data-action="select-option"
              data-index="${index}"
              type="button"
              ${state.result ? "disabled" : ""}
              aria-pressed="${
                state.answer.selected.includes(option) ? "true" : "false"
              }"
            >
              <span>${String.fromCharCode(65 + index)}</span>
              <strong>${escapeHtml(option)}</strong>
              <i>${
                state.answer.selected.includes(option) ? "✓" : ""
              }</i>
            </button>
          `,
        )
        .join("")}
    </div>
  `;
}

function textAnswerMarkup(question) {
  const placeholder =
    question.type === "fill_blank"
      ? "Nhập phần còn thiếu…"
      : "Nhập câu trả lời…";
  const rows = question.type === "fill_blank" ? 2 : 3;
  return `
    <label class="sr-only" for="answer-text">Câu trả lời</label>
    <textarea
      id="answer-text"
      class="answer-input"
      data-answer-text
      placeholder="${placeholder}"
      rows="${rows}"
      ${state.result ? "disabled" : ""}
    >${escapeHtml(state.answer.text)}</textarea>
  `;
}

function orderingMarkup() {
  return `
    <div class="ordering-area">
      <div class="ordered-line">
        ${
          state.answer.ordered.length === 0
            ? "<span>Chọn từ theo đúng thứ tự</span>"
            : state.answer.ordered
                .map(
                  (token, index) => `
                    <button data-action="remove-token" data-index="${index}" type="button" ${
                      state.result ? "disabled" : ""
                    }>${escapeHtml(token)}</button>
                  `,
                )
                .join("")
        }
      </div>
      <div class="token-bank">
        ${state.answer.remaining
          .map(
            (token, index) => `
              <button data-action="add-token" data-index="${index}" type="button" ${
                state.result ? "disabled" : ""
              }>${escapeHtml(token)}</button>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function matchingMarkup(question) {
  const rights = stableShuffle(
    question.options.map((pair) => pair.right),
    question.id,
  );
  return `
    <div class="matching-list">
      ${question.options
        .map(
          (pair, index) => `
            <label>
              <strong>${escapeHtml(pair.left)}</strong>
              <select data-match-index="${index}" ${
                state.result ? "disabled" : ""
              }>
                <option value="">Chọn nghĩa</option>
                ${rights
                  .map(
                    (right) => `
                      <option value="${escapeHtml(right)}"${
                        state.answer.matches[pair.left] === right
                          ? " selected"
                          : ""
                      }>${escapeHtml(right)}</option>
                    `,
                  )
                  .join("")}
              </select>
            </label>
          `,
        )
        .join("")}
    </div>
  `;
}

function answerControlMarkup(question) {
  if (["mcq", "multiple_select"].includes(question.type)) {
    return optionMarkup(question);
  }
  if (
    [
      "fill_blank",
      "error_correction",
      "sentence_transformation",
      "word_formation",
    ].includes(question.type)
  ) {
    return textAnswerMarkup(question);
  }
  if (question.type === "ordering") return orderingMarkup(question);
  if (question.type === "matching") return matchingMarkup(question);
  return "";
}

function feedbackMarkup(question) {
  if (!state.result) return "";
  const result = state.result;
  return `
    <div class="feedback ${result.correct ? "correct" : "incorrect"}" role="status">
      <div class="feedback-title">
        <span>${result.correct ? "✓" : "×"}</span>
        <strong>${result.correct ? "Đúng rồi" : "Chưa đúng"}</strong>
      </div>
      ${
        result.correct
          ? ""
          : `<p>Đáp án: <strong>${escapeHtml(
              result.correctAnswer,
            )}</strong></p>`
      }
      ${
        question.explanation
          ? `<p>${escapeHtml(question.explanation)}</p>`
          : ""
      }
      ${
        question.theory
          ? `
            <div class="theory-box">
              <small>NHẮC LÝ THUYẾT</small>
              <p>${escapeHtml(question.theory)}</p>
            </div>
          `
          : ""
      }
      ${
        !result.correct && question.domain === "vocabulary"
          ? '<small class="repeat-note">Câu này sẽ quay lại cuối lượt.</small>'
          : ""
      }
      <button class="primary-button" data-action="continue" type="button">
        Tiếp tục →
      </button>
    </div>
  `;
}

function questionMarkup(question) {
  const progress =
    (state.sessionDone / Math.max(1, state.sessionTarget)) * 100;
  return `
    <section class="session-view">
      <div class="session-head">
        <button data-action="end-session" class="back-button" type="button">
          ← Thoát
        </button>
        <div class="session-progress" aria-label="Tiến độ buổi học">
          <span style="width:${Math.min(100, progress)}%"></span>
        </div>
        <span class="session-count">${Math.min(
          state.sessionDone + 1,
          state.sessionTarget,
        )}/${state.sessionTarget}</span>
      </div>

      <article class="question-card">
        <div class="question-meta">
          <span>${escapeHtml(question.level)}</span>
          <span>${escapeHtml(question.topic)}</span>
          <span>${escapeHtml(TYPE_LABELS[question.type])}</span>
        </div>
        ${
          question.context
            ? `<p class="question-context">${escapeHtml(question.context)}</p>`
            : ""
        }
        <h1>${escapeHtml(question.prompt)}</h1>

        <form data-answer-form>
          ${answerControlMarkup(question)}
          <div class="question-tools">
            <div>
              ${
                question.hint && !state.result
                  ? `
                    <button class="text-button" data-action="toggle-hint" type="button">
                      ${state.answer.hintOpen ? "Ẩn gợi ý" : "Gợi ý"}
                    </button>
                  `
                  : ""
              }
              ${
                question.theory && !state.result
                  ? `
                    <details class="theory-inline">
                      <summary>Nhắc lý thuyết</summary>
                      <p>${escapeHtml(question.theory)}</p>
                    </details>
                  `
                  : ""
              }
            </div>
            ${
              !state.result
                ? `
                  <button class="primary-button" data-submit type="submit" ${
                    !answerReady() || state.loading ? "disabled" : ""
                  }>
                    ${state.loading ? "Đang chấm…" : "Chấm"}
                  </button>
                `
                : ""
            }
          </div>
          ${
            state.answer.hintOpen && question.hint && !state.result
              ? `<div class="hint-box">${escapeHtml(question.hint)}</div>`
              : ""
          }
        </form>

        ${feedbackMarkup(question)}
      </article>
    </section>
  `;
}

function finishMarkup() {
  const remaining =
    state.sessionDomain === "vocabulary"
      ? state.stats.due
      : state.stats.grammarRemaining;
  const hasActiveFilters =
    state.levelFilter !== "all" || state.topicFilter !== "all";
  const nextBatchSize = hasActiveFilters
    ? 0
    : Math.min(SESSION_QUESTION_LIMIT, remaining);

  return `
    <section class="finish-card">
      <span class="finish-kicker">HOÀN THÀNH</span>
      <h2>${
        state.sessionDomain === "vocabulary"
          ? "Đã nhớ hết."
          : "Xong một lượt."
      }</h2>
      <div class="finish-score">
        <strong>${state.sessionCorrect}</strong>
        <span>/ ${state.sessionTarget} câu đúng</span>
      </div>
      ${
        nextBatchSize > 0
          ? `
            <button
              data-action="begin"
              data-domain="${escapeHtml(state.sessionDomain)}"
              class="primary-button"
              type="button"
            >
              Làm lượt tiếp theo · ${nextBatchSize} câu
            </button>
            <button data-action="end-session" class="text-button" type="button">
              Về trang học
            </button>
          `
          : `
            <button data-action="end-session" class="primary-button" type="button">
              Về trang học
            </button>
          `
      }
    </section>
  `;
}

function previewMarkup() {
  const preview = state.csvPreview;
  if (!preview) return "";
  const grammar = preview.rows.filter(
    (row) => row.domain === "grammar",
  ).length;
  const vocabulary = preview.rows.filter(
    (row) => row.domain === "vocabulary",
  ).length;
  const topics = new Set(preview.rows.map((row) => row.topic)).size;

  return `
    <div class="preview-card">
      <div class="preview-head">
        <div>
          <small>${escapeHtml(preview.filename)}</small>
          <strong>${
            preview.errors.length
              ? "Cần sửa file"
              : `${preview.rows.length} câu hợp lệ`
          }</strong>
        </div>
        <button data-action="close-preview" type="button" aria-label="Đóng">×</button>
      </div>

      ${
        preview.errors.length
          ? `
            <ul class="error-list">
              ${preview.errors
                .map((error) => `<li>${escapeHtml(error)}</li>`)
                .join("")}
            </ul>
          `
          : `
            <div class="preview-metrics">
              <span>Grammar <strong>${grammar}</strong></span>
              <span>Vocab <strong>${vocabulary}</strong></span>
              <span>Topics <strong>${topics}</strong></span>
            </div>
            <div class="preview-table-wrap">
              <table>
                <thead>
                  <tr><th>ID</th><th>Loại</th><th>Topic</th><th>Câu hỏi</th></tr>
                </thead>
                <tbody>
                  ${preview.rows
                    .slice(0, 5)
                    .map(
                      (row) => `
                        <tr>
                          <td>${escapeHtml(row.id)}</td>
                          <td>${escapeHtml(TYPE_LABELS[row.type])}</td>
                          <td>${escapeHtml(row.topic)}</td>
                          <td>${escapeHtml(row.prompt)}</td>
                        </tr>
                      `,
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
            <button class="primary-button import-button" data-action="import-csv" type="button" ${
              state.loading ? "disabled" : ""
            }>
              ${
                state.loading
                  ? "Đang nhập…"
                  : `Nhập ${preview.rows.length} câu`
              }
            </button>
          `
      }
    </div>
  `;
}

function importMarkup() {
  return `
    <section class="content-view import-view">
      <div class="section-heading">
        <span class="eyebrow">QUESTION BANK</span>
        <h1>Nhập câu hỏi</h1>
        <p>Một file CSV. Website tự kiểm tra trước khi lưu trên thiết bị.</p>
      </div>

      <label class="drop-zone${state.dragActive ? " dragging" : ""}" data-drop-zone>
        <input data-csv-file type="file" accept=".csv,text/csv">
        <span class="upload-mark">CSV</span>
        <strong>Thả file vào đây</strong>
        <span>hoặc bấm để chọn · tối đa 5 MB</span>
      </label>

      <div class="resource-row">
        <button data-action="load-sample" type="button" ${
          state.loading ? "disabled" : ""
        }>Xem bộ mẫu</button>
        <a href="./sample_questions.csv" download>Tải CSV mẫu</a>
        <a href="./QUESTION_CSV_GUIDE.md" download>Hướng dẫn cho AI</a>
      </div>

      ${previewMarkup()}

      ${
        state.imports.length
          ? `
            <div class="recent-imports">
              <h2>Đã nhập gần đây</h2>
              ${state.imports
                .slice(0, 4)
                .map(
                  (item) => `
                    <div class="import-row">
                      <span>${escapeHtml(item.filename)}</span>
                      <span>${item.count} câu</span>
                      <time>${formatDate(item.importedAt)}</time>
                    </div>
                  `,
                )
                .join("")}
            </div>
          `
          : ""
      }
    </section>
  `;
}

function topicBookMarkup(level, title, topics) {
  return `
    <details class="book-card">
      <summary>
        <span class="book-level">${escapeHtml(level)}</span>
        <strong>${escapeHtml(title)}</strong>
        <span>${topics.length} nhóm</span>
      </summary>
      <div class="book-topics">
        ${topics
          .map(
            (topic, index) => `
              <span>
                <small>${String(index + 1).padStart(2, "0")}</small>
                ${escapeHtml(topic)}
              </span>
            `,
          )
          .join("")}
      </div>
    </details>
  `;
}

function topicsMarkup() {
  return `
    <section class="content-view topics-view">
      <div class="section-heading">
        <span class="eyebrow">BOOK MAP</span>
        <h1>Chủ điểm</h1>
        <p>Khung nội dung bám theo ba tài liệu bạn đã gửi.</p>
      </div>
      <div class="book-stack">
        ${topicBookMarkup(
          "IELTS",
          "Cambridge Grammar for IELTS",
          CAMBRIDGE_TOPICS,
        )}
        ${topicBookMarkup("B1", "Destination B1", DESTINATION_B1_TOPICS)}
        ${topicBookMarkup("B2", "Destination B2", DESTINATION_B2_TOPICS)}
      </div>

      ${
        state.topics.length
          ? `
            <div class="live-topics">
              <h2>Đã lưu trên thiết bị</h2>
              <div class="topic-chip-grid">
                ${state.topics
                  .map(
                    (item) => `
                      <span class="topic-chip">
                        ${escapeHtml(item.topic)}
                        <small>${item.count}</small>
                      </span>
                    `,
                  )
                  .join("")}
              </div>
            </div>
          `
          : ""
      }
    </section>
  `;
}

function statCard(value, label, accent) {
  return `
    <div class="stat-card ${accent}">
      <strong>${escapeHtml(value)}</strong>
      <span>${escapeHtml(label)}</span>
    </div>
  `;
}

function progressMarkup() {
  return `
    <section class="content-view progress-view">
      <div class="section-heading">
        <span class="eyebrow">YOUR PROGRESS</span>
        <h1>Tiến độ</h1>
        <p>Ít số liệu, đủ để biết hôm nay nên học gì.</p>
      </div>

      <div class="stats-grid">
        ${statCard(state.stats.due, "Từ đến hạn", "coral")}
        ${statCard(`${state.stats.accuracy}%`, "Độ chính xác", "blue")}
        ${statCard(state.stats.today, "Câu hôm nay", "green")}
        ${statCard(state.stats.topics, "Chủ điểm", "ink")}
      </div>

      <div class="srs-note">
        <div class="srs-orbit" aria-hidden="true">
          <span>1d</span><span>6d</span><span>+</span>
        </div>
        <div>
          <small>SPACED REPETITION</small>
          <h2>Sai thì quay lại. Đúng thì giãn lịch.</h2>
          <p>Mỗi nghĩa từ dùng chung một lịch, dù xuất hiện ở nhiều dạng câu.</p>
        </div>
      </div>

      <div class="database-summary">
        <div><span>Grammar</span><strong>${state.stats.grammar}</strong></div>
        <div><span>Vocabulary</span><strong>${state.stats.vocabulary}</strong></div>
        <div>
          <span>Lần nhập cuối</span>
          <strong>${escapeHtml(state.stats.lastImport?.filename ?? "—")}</strong>
        </div>
      </div>

      <p class="local-note">
        Dữ liệu nằm trong ${escapeHtml(
          state.storageMode,
        )} của thiết bị này. Khi đổi trình duyệt hoặc xóa dữ liệu trang, lịch học sẽ không đi theo.
      </p>
    </section>
  `;
}

function currentContentMarkup() {
  const sessionFinished =
    state.view === "learn" &&
    state.sessionDomain &&
    state.queue.length === 0 &&
    state.sessionTarget > 0;

  if (state.view === "learn" && state.sessionDomain && state.queue.length > 0) {
    return questionMarkup(state.queue[0]);
  }
  if (sessionFinished) return finishMarkup();
  if (state.view === "learn") return learnHomeMarkup();
  if (state.view === "import") return importMarkup();
  if (state.view === "topics") return topicsMarkup();
  return progressMarkup();
}

function render() {
  root.innerHTML = `
    <main class="app-shell">
      <header class="topbar">
        <button class="brand" data-action="nav" data-view="learn" type="button" aria-label="Về trang học">
          <span class="brand-mark">N</span><span>NẮM</span>
        </button>
        <nav class="main-nav" aria-label="Điều hướng chính">
          ${navMarkup()}
        </nav>
      </header>

      ${
        state.notice
          ? `
            <div class="notice" role="status">
              <span>${escapeHtml(state.notice)}</span>
              <button data-action="dismiss-notice" type="button" aria-label="Đóng">×</button>
            </div>
          `
          : ""
      }

      ${currentContentMarkup()}

      <footer>
        <span>NẮM English</span>
        <span>Lưu cục bộ · Không cần tài khoản · Không gửi dữ liệu lên máy chủ</span>
      </footer>
    </main>
  `;
}

function updateSubmitState() {
  const button = root.querySelector("[data-submit]");
  if (button) button.disabled = !answerReady() || state.loading;
}

root.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const { action } = button.dataset;

  if (action === "nav") {
    changeView(button.dataset.view);
  } else if (action === "go-import") {
    changeView("import");
  } else if (action === "dismiss-notice") {
    state.notice = "";
    render();
  } else if (action === "begin") {
    void beginSession(button.dataset.domain);
  } else if (action === "select-set") {
    void selectQuestionSet(button.dataset.setId);
  } else if (action === "end-session") {
    endSession();
  } else if (action === "select-option") {
    if (state.result) return;
    const question = state.queue[0];
    const option = question.options[Number(button.dataset.index)];
    if (question.type === "mcq") {
      state.answer.selected = [option];
    } else {
      state.answer.selected = state.answer.selected.includes(option)
        ? state.answer.selected.filter((item) => item !== option)
        : [...state.answer.selected, option];
    }
    render();
  } else if (action === "add-token") {
    if (state.result) return;
    const index = Number(button.dataset.index);
    const [token] = state.answer.remaining.splice(index, 1);
    state.answer.ordered.push(token);
    render();
  } else if (action === "remove-token") {
    if (state.result) return;
    const index = Number(button.dataset.index);
    const [token] = state.answer.ordered.splice(index, 1);
    state.answer.remaining.push(token);
    render();
  } else if (action === "toggle-hint") {
    state.answer.hintOpen = !state.answer.hintOpen;
    render();
  } else if (action === "continue") {
    continueSession();
  } else if (action === "load-sample") {
    void loadSample();
  } else if (action === "close-preview") {
    state.csvPreview = null;
    render();
  } else if (action === "import-csv") {
    void importCsv();
  }
});

root.addEventListener("submit", (event) => {
  if (!event.target.matches("[data-answer-form]")) return;
  event.preventDefault();
  void submitAnswer();
});

root.addEventListener("input", (event) => {
  if (!event.target.matches("[data-answer-text]")) return;
  state.answer.text = event.target.value;
  updateSubmitState();
});

root.addEventListener("change", (event) => {
  const target = event.target;
  if (target.matches("[data-filter='level']")) {
    state.levelFilter = target.value;
    state.topicFilter = "all";
    render();
  } else if (target.matches("[data-filter='topic']")) {
    state.topicFilter = target.value;
    render();
  } else if (target.matches("[data-csv-file]")) {
    const file = target.files?.[0];
    if (file) void loadCsvFile(file);
    target.value = "";
  } else if (target.matches("[data-match-index]")) {
    const question = state.queue[0];
    const pair = question.options[Number(target.dataset.matchIndex)];
    state.answer.matches[pair.left] = target.value;
    updateSubmitState();
  }
});

root.addEventListener("dragenter", (event) => {
  if (!event.target.closest("[data-drop-zone]")) return;
  event.preventDefault();
  state.dragActive = true;
  render();
});

root.addEventListener("dragover", (event) => {
  if (event.target.closest("[data-drop-zone]")) event.preventDefault();
});

root.addEventListener("dragleave", (event) => {
  if (!event.target.closest("[data-drop-zone]")) return;
  state.dragActive = false;
  render();
});

root.addEventListener("drop", (event) => {
  if (!event.target.closest("[data-drop-zone]")) return;
  event.preventDefault();
  state.dragActive = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) void loadCsvFile(file);
});

async function start() {
  render();
  try {
    repository = await createRepository();
    state.storageMode = repository.mode;
    state.selectedSetId = readSelectedQuestionSet();
    await refreshDashboard({ repaint: false });
    const restored = await restoreStudySession(repository);
    if (restored) {
      state.view = "learn";
      state.selectedSetId = restored.selectedSetId;
      saveSelectedQuestionSet(restored.selectedSetId);
      await refreshDashboard({ repaint: false });
      state.queue = restored.queue;
      state.sessionDomain = restored.sessionDomain;
      state.sessionTarget = restored.sessionTarget;
      state.sessionDone = restored.sessionDone;
      state.sessionCorrect = restored.sessionCorrect;
      state.result = restored.result;
      resetAnswer(state.queue[0]);
    }
    render();
  } catch (error) {
    showNotice(
      error instanceof Error
        ? error.message
        : "Không khởi tạo được kho dữ liệu cục bộ.",
    );
  }
}

void start();
