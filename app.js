import {
  buildCsvPreview,
  displayAnswer,
  evaluateAnswer,
  formatDate,
  SESSION_QUESTION_LIMIT,
  stableShuffle,
  shuffle,
  TYPE_LABELS,
} from "./core.js";
import {
  accuracyByDomain,
  buildAchievements,
  collectVocabularyKeys,
  computeStreaks,
  dailyActivity,
  dueForecast,
  formatDuration,
  formatRelativeTime,
  heatmapWeeks,
  lastAttemptByQuestion,
  levelInfo,
  mistakeQuestions,
  parseLearningKey,
  questionsToCsv,
  topicMastery,
  xpFromAttempts,
  XP_CORRECT,
  XP_INCORRECT,
} from "./stats.js";
import {
  clearStudySession,
  createRepository,
  getSessionQuestions,
  questionSetIdOf,
  readDashboard,
  readSelectedQuestionSet,
  readSettings,
  restoreStudySession,
  saveSelectedQuestionSet,
  saveSettings,
  saveStudySession,
} from "./storage.js";
import {
  speakEnglish,
  speechAvailable,
  stopSpeaking,
  warmUpSpeech,
} from "./speech.js";

/* ============================================================
   Dữ liệu tĩnh
   ============================================================ */

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

const FLASHCARD_LIMIT = 20;

const ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M10 21v-6h4v6"/></svg>',
  library:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/></svg>',
  chart:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/></svg>',
  settings:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/><circle cx="9" cy="6" r="2" fill="var(--surface)"/><circle cx="15" cy="12" r="2" fill="var(--surface)"/><circle cx="8" cy="18" r="2" fill="var(--surface)"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5 5l1.7 1.7M17.3 17.3 19 19M19 5l-1.7 1.7M6.7 17.3 5 19"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 14.1A8.6 8.6 0 1 1 9.9 3.5a7 7 0 0 0 10.6 10.6z"/></svg>',
  volume:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6.5 9H3v6h3.5L11 19z"/><path d="M15 9a4.2 4.2 0 0 1 0 6"/><path d="M17.7 6.3a8 8 0 0 1 0 11.4"/></svg>',
  pencil:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  trash:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/><path d="M10 11v6M14 11v6"/></svg>',
  download:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>',
};

/* ============================================================
   Trạng thái
   ============================================================ */

const state = {
  view: "home",
  loading: false,
  notice: null,
  storageMode: "trình duyệt",
  // dashboard
  stats: EMPTY_STATS,
  topics: [],
  sets: [],
  selectedSetId: null,
  mistakesCount: 0,
  snapshot: { questions: [], reviews: [], attempts: [], imports: [] },
  setQuestions: [],
  setAttempts: [],
  // filters
  levelFilter: "all",
  topicFilter: "all",
  // session
  session: null,
  answer: null,
  // flashcards
  flash: null,
  // summary
  summary: null,
  // library
  csvPreview: null,
  dragActive: false,
  libSearch: "",
  libDomain: "all",
  libType: "all",
  libLimit: 30,
  renamingSetId: null,
  // settings
  settings: null,
};

const root = document.querySelector("#app");
let repository;
let toastTimer = null;
let lastFocusedQuestionId = null;

/* ============================================================
   Tiện ích
   ============================================================ */

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatNumber(value) {
  return Number(value ?? 0).toLocaleString("vi-VN");
}

function showToast(text, kind = "info") {
  state.notice = { text, kind };
  render();
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    state.notice = null;
    toastTimer = null;
    render();
  }, 4_500);
}

function dismissToast() {
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = null;
  state.notice = null;
  render();
}

function resolveTheme(setting) {
  if (setting === "light" || setting === "dark") return setting;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme() {
  document.documentElement.dataset.theme = resolveTheme(
    state.settings.theme,
  );
}

function updateSettings(patch) {
  state.settings = { ...state.settings, ...patch };
  saveSettings(state.settings);
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5_000);
}

function speakText(text) {
  if (!state.settings.ttsEnabled) return;
  speakEnglish(text, { rate: state.settings.ttsRate });
}

function maybeAutoSpeak(question) {
  if (!question || question.domain !== "vocabulary") return;
  if (!state.settings.autoSpeak || !state.settings.ttsEnabled) return;
  speakText(question.context || question.prompt);
}

/* ============================================================
   Nạp dữ liệu
   ============================================================ */

async function refreshDashboard({ repaint = true } = {}) {
  const dashboard = await readDashboard(repository, state.selectedSetId);
  state.stats = dashboard.stats;
  state.topics = dashboard.topics;
  state.sets = dashboard.sets;
  state.selectedSetId = dashboard.selectedSetId;
  state.snapshot = dashboard.snapshot;
  state.setQuestions = dashboard.questions;
  state.setAttempts = dashboard.attempts;
  state.mistakesCount = dashboard.mistakes;
  saveSelectedQuestionSet(state.selectedSetId);
  if (repaint) render();
}

function availableLevels() {
  return [
    ...new Set(state.topics.map((item) => item.level).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));
}

function availableTopics() {
  return [
    ...new Set(
      state.topics
        .filter(
          (item) =>
            state.levelFilter === "all" || item.level === state.levelFilter,
        )
        .map((item) => item.topic),
    ),
  ].sort((a, b) => a.localeCompare(b));
}

/* ============================================================
   Điều hướng
   ============================================================ */

function changeView(view) {
  if (state.session && state.session.queue.length > 0) {
    const leave = window.confirm(
      "Thoát lượt học đang làm? Các câu đã chấm vẫn được lưu.",
    );
    if (!leave) return;
  }
  stopSpeaking();
  clearStudySession();
  state.view = view;
  state.session = null;
  state.flash = null;
  state.summary = null;
  state.answer = null;
  state.renamingSetId = null;
  render();
  window.scrollTo({ top: 0 });
}

/* ============================================================
   Phiên học (grammar / vocabulary / mistakes)
   ============================================================ */

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

function persistCurrentSession() {
  const session = state.session;
  if (!session) return;
  saveStudySession({
    queue: session.queue,
    selectedSetId: state.selectedSetId,
    sessionDomain:
      session.mode === "mistakes" ? null : session.mode,
    sessionMode: session.mode,
    sessionTarget: session.target,
    sessionDone: session.done,
    sessionCorrect: session.correct,
    result: session.result,
  });
}

async function beginSession(mode) {
  if (state.loading) return;
  if (!state.selectedSetId) {
    showToast("Hãy nhập hoặc chọn một bộ câu hỏi trước.", "error");
    return;
  }
  clearStudySession();
  state.loading = true;
  state.session = null;
  state.summary = null;
  render();

  try {
    let questions = [];
    if (mode === "mistakes") {
      questions = shuffle(
        mistakeQuestions(state.setQuestions, state.setAttempts),
      ).slice(0, SESSION_QUESTION_LIMIT);
    } else {
      const topicExists =
        state.topicFilter === "all" ||
        state.topics.some(
          (item) => item.domain === mode && item.topic === state.topicFilter,
        );
      questions = await getSessionQuestions(repository, {
        setId: state.selectedSetId,
        domain: mode,
        level: state.levelFilter,
        topic: topicExists ? state.topicFilter : "all",
        limit: SESSION_QUESTION_LIMIT,
      });
    }

    if (questions.length === 0) {
      showToast(
        mode === "vocabulary"
          ? "Bạn đã làm hết từ mới và hiện chưa có từ đến hạn."
          : mode === "mistakes"
            ? "Không còn câu sai nào để luyện lại. Tuyệt!"
            : "Bạn đã làm hết câu Grammar phù hợp trong bộ này.",
      );
      return;
    }

    state.session = {
      mode,
      queue: questions,
      target: questions.length,
      done: 0,
      correct: 0,
      results: [],
      result: null,
      startedAt: Date.now(),
    };
    resetAnswer(questions[0]);
    persistCurrentSession();
    maybeAutoSpeak(questions[0]);
  } catch (error) {
    showToast(
      error instanceof Error ? error.message : "Không thể bắt đầu buổi học.",
      "error",
    );
  } finally {
    state.loading = false;
    render();
  }
}

function startWrongReview(questions) {
  if (!questions.length) return;
  clearStudySession();
  state.summary = null;
  state.session = {
    mode: "mistakes",
    queue: shuffle(questions),
    target: questions.length,
    done: 0,
    correct: 0,
    results: [],
    result: null,
    startedAt: Date.now(),
  };
  resetAnswer(state.session.queue[0]);
  persistCurrentSession();
  render();
}

function currentAnswer() {
  const question = state.session?.queue[0];
  if (!question || !state.answer) return "";
  if (question.type === "matching") return state.answer.matches;
  if (question.type === "multiple_select") return state.answer.selected;
  if (question.type === "mcq") return state.answer.selected[0] ?? "";
  if (question.type === "ordering") return state.answer.ordered.join(" ");
  return state.answer.text;
}

function answerReady() {
  const question = state.session?.queue[0];
  if (!question || !state.answer) return false;
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
      state.answer.remaining.length === 0 && state.answer.ordered.length > 0
    );
  }
  return state.answer.text.trim().length > 0;
}

async function submitAnswer() {
  const session = state.session;
  const question = session?.queue[0];
  if (!question || session.result || state.loading || !answerReady()) return;

  state.loading = true;
  render();
  try {
    const received = currentAnswer();
    const correct = evaluateAnswer(question.answer, received, question.type);
    const review = await repository.recordAttempt(
      question,
      received,
      correct,
      { mode: session.mode },
    );
    session.result = {
      correct,
      correctAnswer: displayAnswer(question.answer),
      review: review ?? null,
    };
    persistCurrentSession();
    await refreshDashboard({ repaint: false });
  } catch (error) {
    showToast(
      error instanceof Error ? error.message : "Chấm bài thất bại.",
      "error",
    );
  } finally {
    state.loading = false;
    render();
  }
}

function continueSession() {
  const session = state.session;
  const current = session?.queue[0];
  if (!current || !session.result) return;

  const result = session.result;
  const firstEncounter = !session.results.some(
    (item) => item.questionId === current.id,
  );
  if (firstEncounter) {
    session.results.push({
      questionId: current.id,
      question: current,
      prompt: current.context || current.prompt,
      type: current.type,
      correct: result.correct,
    });
    if (result.correct) session.correct += 1;
  }

  const shouldRepeat =
    session.mode === "vocabulary" &&
    current.domain === "vocabulary" &&
    !result.correct;
  if (!shouldRepeat) session.done += 1;
  session.queue = shouldRepeat
    ? [...session.queue.slice(1), current]
    : session.queue.slice(1);
  session.result = null;

  if (session.queue.length === 0) {
    finishSession();
    return;
  }
  resetAnswer(session.queue[0]);
  persistCurrentSession();
  render();
  maybeAutoSpeak(session.queue[0]);
}

function finishSession() {
  const session = state.session;
  if (!session) return;
  clearStudySession();
  const results = session.results;
  const wrong = results.filter((item) => !item.correct);
  state.summary = {
    kind: "session",
    mode: session.mode,
    target: session.target,
    correct: session.correct,
    results,
    wrongQuestions: wrong.map((item) => item.question),
    xp:
      session.correct * XP_CORRECT +
      (results.length - session.correct) * XP_INCORRECT,
    durationMs: Date.now() - session.startedAt,
  };
  state.session = null;
  state.answer = null;
  render();
  void refreshDashboard();
}

function exitSession() {
  const session = state.session;
  if (session && session.queue.length > 0 && session.done > 0) {
    const leave = window.confirm(
      "Thoát lượt học? Các câu đã chấm vẫn được lưu.",
    );
    if (!leave) return;
  }
  stopSpeaking();
  clearStudySession();
  state.session = null;
  state.summary = null;
  state.answer = null;
  render();
}

/* ============================================================
   Flashcards
   ============================================================ */

async function beginFlashcards() {
  if (state.loading) return;
  if (!state.selectedSetId) {
    showToast("Hãy nhập hoặc chọn một bộ câu hỏi trước.", "error");
    return;
  }
  state.loading = true;
  state.summary = null;
  render();
  try {
    const cards = await getSessionQuestions(repository, {
      setId: state.selectedSetId,
      domain: "vocabulary",
      level: state.levelFilter,
      topic: "all",
      limit: FLASHCARD_LIMIT,
    });
    if (cards.length === 0) {
      showToast("Chưa có thẻ từ vựng nào đến hạn hoặc còn mới.");
      return;
    }
    state.flash = {
      queue: cards,
      target: cards.length,
      done: 0,
      flipped: false,
      results: [],
    };
    maybeAutoSpeak(cards[0]);
  } catch (error) {
    showToast(
      error instanceof Error ? error.message : "Không mở được flashcards.",
      "error",
    );
  } finally {
    state.loading = false;
    render();
  }
}

async function gradeFlashcard(correct) {
  const flash = state.flash;
  const card = flash?.queue[0];
  if (!card || state.loading) return;

  state.loading = true;
  render();
  try {
    await repository.recordAttempt(card, "flashcard", correct, {
      mode: "flashcard",
    });
    const firstEncounter = !flash.results.some(
      (item) => item.questionId === card.id,
    );
    if (firstEncounter) {
      flash.results.push({
        questionId: card.id,
        question: card,
        prompt: flashWordFor(card) || card.context || card.prompt,
        correct,
      });
    }
    if (correct) {
      flash.done += 1;
      flash.queue = flash.queue.slice(1);
    } else {
      flash.queue = [...flash.queue.slice(1), card];
    }
    flash.flipped = false;

    if (flash.queue.length === 0) {
      const results = flash.results;
      const rememberedFirstTry = results.filter(
        (item) => item.correct,
      ).length;
      state.summary = {
        kind: "flashcards",
        mode: "flashcards",
        target: flash.target,
        correct: rememberedFirstTry,
        results,
        wrongQuestions: [],
        xp:
          rememberedFirstTry * XP_CORRECT +
          (results.length - rememberedFirstTry) * XP_INCORRECT,
        durationMs: 0,
      };
      state.flash = null;
      await refreshDashboard({ repaint: false });
    } else {
      maybeAutoSpeak(flash.queue[0]);
    }
  } catch (error) {
    showToast(
      error instanceof Error ? error.message : "Không lưu được thẻ.",
      "error",
    );
  } finally {
    state.loading = false;
    render();
  }
}

function flashWordFor(card) {
  const parsed = parseLearningKey(card.learningKey);
  return parsed?.word ?? "";
}

/* ============================================================
   Nhập CSV & quản lý bộ
   ============================================================ */

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
    showToast(
      error instanceof Error ? error.message : "Không tải được bộ mẫu.",
      "error",
    );
  } finally {
    state.loading = false;
    render();
  }
}

async function importCsv() {
  const preview = state.csvPreview;
  if (
    !preview ||
    preview.errors.length > 0 ||
    preview.rows.length === 0 ||
    state.loading
  ) {
    return;
  }

  state.loading = true;
  render();
  try {
    const importedSet = await repository.importQuestions(
      preview.rows,
      preview.filename,
    );
    state.selectedSetId = importedSet.id;
    saveSelectedQuestionSet(importedSet.id);
    state.levelFilter = "all";
    state.topicFilter = "all";
    state.csvPreview = null;
    await refreshDashboard({ repaint: false });
    showToast(
      `Đã tạo bộ “${importedSet.name}” với ${preview.rows.length} câu.`,
      "success",
    );
  } catch (error) {
    showToast(
      error instanceof Error
        ? error.message
        : "Không thể nhập bộ câu hỏi.",
      "error",
    );
  } finally {
    state.loading = false;
    render();
  }
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
  state.session = null;
  state.summary = null;
  state.levelFilter = "all";
  state.topicFilter = "all";
  state.loading = true;
  render();
  try {
    await refreshDashboard({ repaint: false });
  } catch (error) {
    showToast(
      error instanceof Error ? error.message : "Không thể đổi bộ câu hỏi.",
      "error",
    );
  } finally {
    state.loading = false;
    render();
  }
}

async function renameSet(setId, name) {
  try {
    await repository.renameSet(setId, name);
    state.renamingSetId = null;
    await refreshDashboard({ repaint: false });
    showToast("Đã đổi tên bộ.", "success");
  } catch (error) {
    showToast(
      error instanceof Error ? error.message : "Không đổi được tên.",
      "error",
    );
  }
  render();
}

async function deleteSet(setId) {
  const set = state.sets.find((item) => item.id === setId);
  if (!set) return;
  const sure = window.confirm(
    `Xóa bộ “${set.name}” (${set.count} câu)? Toàn bộ lịch sử làm bài của bộ này sẽ bị xóa.`,
  );
  if (!sure) return;
  state.loading = true;
  render();
  try {
    await repository.deleteSet(setId);
    if (state.selectedSetId === setId) state.selectedSetId = null;
    await refreshDashboard({ repaint: false });
    showToast(`Đã xóa bộ “${set.name}”.`, "success");
  } catch (error) {
    showToast(
      error instanceof Error ? error.message : "Không xóa được bộ.",
      "error",
    );
  } finally {
    state.loading = false;
    render();
  }
}

function exportSetCsv(setId) {
  const set = state.sets.find((item) => item.id === setId);
  if (!set) return;
  const questions = state.snapshot.questions
    .filter((question) => questionSetIdOf(question) === setId)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  if (questions.length === 0) {
    showToast("Bộ này không có câu hỏi để xuất.", "error");
    return;
  }
  const safeName = set.name.replace(/[^\p{L}\p{N}]+/gu, "-").slice(0, 40);
  downloadFile(
    `${safeName || "bo-cau-hoi"}.csv`,
    questionsToCsv(questions),
    "text/csv;charset=utf-8",
  );
  showToast("Đã tải file CSV của bộ.", "success");
}

/* ============================================================
   Sao lưu & khôi phục
   ============================================================ */

function exportBackup() {
  const payload = {
    app: "nam-english",
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: state.settings,
    data: state.snapshot,
  };
  const stamp = new Date().toISOString().slice(0, 10);
  downloadFile(
    `nam-english-backup-${stamp}.json`,
    JSON.stringify(payload, null, 2),
    "application/json",
  );
  showToast("Đã tải file sao lưu.", "success");
}

async function importBackup(file) {
  let payload;
  try {
    payload = JSON.parse(await file.text());
  } catch {
    showToast("File sao lưu không đúng định dạng JSON.", "error");
    return;
  }
  const data = payload?.data;
  if (
    payload?.app !== "nam-english" ||
    !data ||
    !Array.isArray(data.questions) ||
    !Array.isArray(data.reviews) ||
    !Array.isArray(data.attempts) ||
    !Array.isArray(data.imports)
  ) {
    showToast("Đây không phải file sao lưu của NẮM English.", "error");
    return;
  }
  const sure = window.confirm(
    `Khôi phục ${data.questions.length} câu hỏi và toàn bộ lịch học từ file này? Dữ liệu hiện tại sẽ bị thay thế.`,
  );
  if (!sure) return;

  state.loading = true;
  render();
  try {
    await repository.replaceAll(data);
    if (payload.settings && typeof payload.settings === "object") {
      updateSettings(payload.settings);
      applyTheme();
    }
    state.selectedSetId = null;
    await refreshDashboard({ repaint: false });
    showToast("Đã khôi phục dữ liệu từ file sao lưu.", "success");
  } catch (error) {
    showToast(
      error instanceof Error ? error.message : "Không khôi phục được.",
      "error",
    );
  } finally {
    state.loading = false;
    render();
  }
}

async function resetAllData() {
  const first = window.confirm(
    "Xóa TOÀN BỘ dữ liệu: câu hỏi, lịch sử và lịch ôn tập?",
  );
  if (!first) return;
  const second = window.confirm(
    "Chắc chắn chứ? Hành động này không thể hoàn tác.",
  );
  if (!second) return;
  state.loading = true;
  render();
  try {
    await repository.clearAll();
    clearStudySession();
    state.selectedSetId = null;
    saveSelectedQuestionSet(null);
    await refreshDashboard({ repaint: false });
    showToast("Đã xóa toàn bộ dữ liệu.", "success");
  } catch (error) {
    showToast(
      error instanceof Error ? error.message : "Không xóa được dữ liệu.",
      "error",
    );
  } finally {
    state.loading = false;
    render();
  }
}

/* ============================================================
   Markup dùng chung
   ============================================================ */

function ringMarkup(percent, { size, stroke, label, cls = "" }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, percent));
  const offset = circumference * (1 - clamped);
  const center = size / 2;
  return `
    <svg class="${cls}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${escapeHtml(label)}">
      <circle class="ring-bg" cx="${center}" cy="${center}" r="${radius}" fill="none" stroke-width="${stroke}"></circle>
      <circle
        class="ring-fill"
        cx="${center}" cy="${center}" r="${radius}" fill="none"
        stroke-width="${stroke}" stroke-linecap="round"
        stroke-dasharray="${circumference.toFixed(1)}"
        stroke-dashoffset="${offset.toFixed(1)}"
        transform="rotate(-90 ${center} ${center})"
      ></circle>
      <text x="${center}" y="${center}" text-anchor="middle" dominant-baseline="central" font-size="${size * 0.24}">${escapeHtml(label)}</text>
    </svg>
  `;
}

function speakButtonMarkup(text, ariaLabel = "Đọc to") {
  if (!speechAvailable() || !state.settings.ttsEnabled || !text) return "";
  return `
    <button
      class="speak-button"
      data-action="speak"
      data-speak-text="${escapeHtml(text)}"
      type="button"
      aria-label="${escapeHtml(ariaLabel)}"
    >${ICONS.volume}</button>
  `;
}

function navMarkup() {
  const items = [
    ["home", "Học", ICONS.home],
    ["library", "Thư viện", ICONS.library],
    ["progress", "Tiến độ", ICONS.chart],
    ["settings", "Cài đặt", ICONS.settings],
  ];
  const nav = items
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
  const tabs = items
    .map(
      ([key, label, icon]) => `
        <button
          class="tab-item${state.view === key ? " active" : ""}"
          data-action="nav"
          data-view="${key}"
          type="button"
        >${icon}<span>${label}</span></button>
      `,
    )
    .join("");
  return { nav, tabs };
}

function topbarMarkup() {
  const streaks = computeStreaks(state.snapshot.attempts);
  const theme = resolveTheme(state.settings.theme);
  const { nav } = navMarkup();
  return `
    <header class="topbar">
      <button class="brand" data-action="nav" data-view="home" type="button" aria-label="Về trang học">
        <span class="brand-mark">N</span><span>NẮM</span>
      </button>
      <nav class="main-nav" aria-label="Điều hướng chính">${nav}</nav>
      <div class="top-actions">
        <span class="streak-chip${streaks.current === 0 ? " cold" : ""}" title="Chuỗi ngày học liên tiếp">
          🔥 ${streaks.current}
        </span>
        <button
          class="icon-button"
          data-action="toggle-theme"
          type="button"
          aria-label="${theme === "dark" ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}"
        >${theme === "dark" ? ICONS.sun : ICONS.moon}</button>
      </div>
    </header>
  `;
}

/* ============================================================
   Trang chủ
   ============================================================ */

function greetingText() {
  const hour = new Date().getHours();
  if (hour < 11) return "Chào buổi sáng";
  if (hour < 13) return "Chào buổi trưa";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

function homeHeadMarkup() {
  const attempts = state.snapshot.attempts;
  const xp = xpFromAttempts(attempts);
  const level = levelInfo(xp);
  const dateLabel = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "numeric",
  }).format(new Date());
  return `
    <div class="home-head">
      <div class="greeting">
        <h1>${greetingText()} 👋</h1>
        <p>${escapeHtml(dateLabel)} · Học đều mỗi ngày để giữ chuỗi.</p>
      </div>
      <div class="head-chips">
        <span class="level-chip" title="${formatNumber(xp)} XP tổng cộng">
          <strong>Cấp ${level.level} · ${formatNumber(level.intoLevel)}/${formatNumber(level.needed)} XP</strong>
          <span class="level-bar"><span style="width:${Math.round(level.progress * 100)}%"></span></span>
        </span>
      </div>
    </div>
  `;
}

function goalCardMarkup() {
  const goal = state.settings.dailyGoal;
  const streaks = computeStreaks(state.snapshot.attempts);
  const today = streaks.todayCount;
  const done = today >= goal;
  const ring = ringMarkup(goal > 0 ? today / goal : 0, {
    size: 76,
    stroke: 8,
    label: `${today}`,
    cls: `goal-ring${done ? " done" : ""}`,
  });
  return `
    <div class="goal-card">
      ${ring}
      <div class="goal-copy">
        <strong>${
          done
            ? "Đã đạt mục tiêu hôm nay 🎉"
            : `Mục tiêu hôm nay: ${goal} câu`
        }</strong>
        <span>${
          done
            ? `${today}/${goal} câu — làm thêm càng nhớ lâu.`
            : today > 0
              ? `Đã làm ${today} câu, còn ${goal - today} câu nữa.`
              : "Bắt đầu với một lượt ngắn thôi cũng được."
        }</span>
      </div>
    </div>
  `;
}

function questionSetPickerMarkup() {
  if (state.sets.length === 0) return "";
  return `
    <section class="set-picker" aria-labelledby="set-picker-title">
      <div class="set-picker-heading">
        <h2 id="set-picker-title">Bộ câu hỏi</h2>
        <button class="text-button" data-action="nav" data-view="library" type="button">
          Quản lý bộ →
        </button>
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
                aria-pressed="${state.selectedSetId === set.id ? "true" : "false"}"
              >
                <span class="set-check" aria-hidden="true">${
                  state.selectedSetId === set.id ? "✓" : ""
                }</span>
                <span class="set-option-copy">
                  <strong>${escapeHtml(set.name)}</strong>
                  <small>${set.count} câu · ${formatDate(set.importedAt)}</small>
                </span>
              </button>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
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

function modeGridMarkup() {
  const stats = state.stats;
  const hasSet = Boolean(state.selectedSetId);
  const vocabAvailable =
    stats.vocabularyRemaining > 0 || stats.due > 0;
  const vocabLabel =
    stats.vocabularyRemaining > 0
      ? `${stats.vocabularyRemaining} từ chưa học`
      : stats.due > 0
        ? `${stats.due} từ đến hạn`
        : "Đã ôn hết hôm nay";

  const card = (mode, letter, title, sub, count, enabled, action = "begin") => `
    <button
      class="mode-card ${mode}"
      data-action="${action}"
      data-mode="${mode}"
      type="button"
      ${!enabled || state.loading || !hasSet ? "disabled" : ""}
    >
      <span class="mode-letter" aria-hidden="true">${letter}</span>
      <span class="mode-content">
        <small>${escapeHtml(count)}</small>
        <strong>${title}</strong>
        <span>${sub}</span>
      </span>
      <span class="mode-arrow" aria-hidden="true">→</span>
    </button>
  `;

  return `
    <div class="mode-grid">
      ${card(
        "grammar",
        "G",
        "Grammar",
        "Luyện đa dạng + nhắc lý thuyết",
        stats.grammarRemaining > 0
          ? `${stats.grammarRemaining} câu chưa làm`
          : "Đã làm hết",
        stats.grammarRemaining > 0,
      )}
      ${card(
        "vocabulary",
        "V",
        "Vocabulary",
        "Ôn theo spaced repetition",
        vocabLabel,
        vocabAvailable,
      )}
      ${card(
        "flashcards",
        "⚡",
        "Flashcards",
        "Lật thẻ nhanh, tự chấm nhớ/quên",
        vocabAvailable
          ? `${Math.min(FLASHCARD_LIMIT, stats.vocabularyRemaining || stats.due)} thẻ`
          : "Chưa có thẻ",
        vocabAvailable,
        "begin-flashcards",
      )}
      ${card(
        "mistakes",
        "↺",
        "Luyện câu sai",
        "Làm lại những câu trả lời sai",
        state.mistakesCount > 0
          ? `${state.mistakesCount} câu cần sửa`
          : "Không có câu sai",
        state.mistakesCount > 0,
      )}
    </div>
  `;
}

function homeMarkup() {
  const stats = state.stats;
  const goal = state.settings.dailyGoal;
  return `
    <section class="view home-view">
      ${homeHeadMarkup()}
      ${goalCardMarkup()}
      ${questionSetPickerMarkup()}

      <div class="quick-stats" aria-label="Tóm tắt tiến độ">
        <div><strong>${stats.due}</strong><span>từ đến hạn</span></div>
        <div><strong>${stats.grammarRemaining}</strong><span>grammar chưa làm</span></div>
        <div><strong>${stats.accuracy}%</strong><span>độ chính xác</span></div>
        <div><strong>${stats.today}/${goal}</strong><span>câu hôm nay</span></div>
      </div>

      ${state.sets.length > 0 ? filtersMarkup() : ""}
      ${modeGridMarkup()}

      ${
        stats.grammar + stats.vocabulary === 0
          ? `
            <div class="empty-library">
              <span>Kho câu hỏi đang trống. Nhập một file CSV để bắt đầu.</span>
              <button class="primary-button" data-action="nav" data-view="library" type="button">
                Nhập bộ đầu tiên
              </button>
            </div>
          `
          : ""
      }
    </section>
  `;
}

/* ============================================================
   Phiên học — markup
   ============================================================ */

function optionMarkup(question) {
  const result = state.session?.result;
  const expected = Array.isArray(question.answer)
    ? question.answer.map((item) => item.toLocaleLowerCase("en"))
    : [];
  return `
    <div class="option-list">
      ${question.options
        .map((option, index) => {
          const selected = state.answer.selected.includes(option);
          let reveal = "";
          if (result) {
            const isExpected = expected.includes(
              option.toLocaleLowerCase("en"),
            );
            if (isExpected) reveal = " reveal-correct";
            else if (selected) reveal = " reveal-wrong";
          }
          return `
            <button
              class="option${selected ? " selected" : ""}${reveal}"
              data-action="select-option"
              data-index="${index}"
              type="button"
              ${result ? "disabled" : ""}
              aria-pressed="${selected ? "true" : "false"}"
            >
              <span>${String.fromCharCode(65 + index)}</span>
              <strong>${escapeHtml(option)}</strong>
              <i>${
                result
                  ? expected.includes(option.toLocaleLowerCase("en"))
                    ? "✓"
                    : selected
                      ? "×"
                      : ""
                  : selected
                    ? "✓"
                    : ""
              }</i>
            </button>
          `;
        })
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
      autocapitalize="off"
      autocomplete="off"
      spellcheck="false"
      ${state.session?.result ? "disabled" : ""}
    >${escapeHtml(state.answer.text)}</textarea>
  `;
}

function orderingMarkup() {
  const result = state.session?.result;
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
                      result ? "disabled" : ""
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
                result ? "disabled" : ""
              }>${escapeHtml(token)}</button>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function matchingMarkup(question) {
  const result = state.session?.result;
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
              <select data-match-index="${index}" ${result ? "disabled" : ""}>
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
  if (question.type === "ordering") return orderingMarkup();
  if (question.type === "matching") return matchingMarkup(question);
  return "";
}

function feedbackMarkup(question) {
  const result = state.session?.result;
  if (!result) return "";
  const speakAnswer = Array.isArray(question.answer)
    ? question.answer[0]
    : "";
  const review = result.review;
  return `
    <div class="feedback ${result.correct ? "correct" : "incorrect"}" role="status">
      <div class="feedback-title">
        <span>${result.correct ? "✓" : "×"}</span>
        <strong>${result.correct ? "Đúng rồi" : "Chưa đúng"}</strong>
        ${speakButtonMarkup(speakAnswer, "Đọc đáp án")}
      </div>
      ${
        result.correct
          ? ""
          : `<p>Đáp án: <strong>${escapeHtml(result.correctAnswer)}</strong></p>`
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
        !result.correct &&
        question.domain === "vocabulary" &&
        state.session.mode === "vocabulary"
          ? '<small class="repeat-note">Câu này sẽ quay lại cuối lượt.</small>'
          : ""
      }
      ${
        result.correct && review?.dueAt
          ? `<small class="next-due">Hẹn ôn lại: ${escapeHtml(
              formatRelativeTime(review.dueAt),
            )}</small>`
          : ""
      }
      <button class="primary-button" data-action="continue" type="button">
        Tiếp tục →
      </button>
    </div>
  `;
}

function sessionMarkup() {
  const session = state.session;
  const question = session.queue[0];
  const progress = (session.done / Math.max(1, session.target)) * 100;
  const modeLabel =
    session.mode === "mistakes"
      ? "Luyện câu sai"
      : session.mode === "vocabulary"
        ? "Vocabulary"
        : "Grammar";
  const speakSource = question.context || question.prompt;

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
          session.done + 1,
          session.target,
        )}/${session.target}</span>
      </div>

      <article class="question-card">
        <div class="question-meta">
          <span class="chip accent">${escapeHtml(modeLabel)}</span>
          <span class="chip">${escapeHtml(question.level)}</span>
          <span class="chip">${escapeHtml(question.topic)}</span>
          <span class="chip blue">${escapeHtml(TYPE_LABELS[question.type])}</span>
          ${speakButtonMarkup(speakSource, "Đọc câu hỏi")}
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
                question.hint && !session.result
                  ? `
                    <button class="text-button" data-action="toggle-hint" type="button">
                      ${state.answer.hintOpen ? "Ẩn gợi ý" : "💡 Gợi ý"}
                    </button>
                  `
                  : ""
              }
              ${
                question.theory && !session.result
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
              !session.result
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
            state.answer.hintOpen && question.hint && !session.result
              ? `<div class="hint-box">${escapeHtml(question.hint)}</div>`
              : ""
          }
        </form>

        ${feedbackMarkup(question)}
        ${
          !session.result
            ? `
              <div class="kbd-hint" aria-hidden="true">
                ${
                  ["mcq", "multiple_select"].includes(question.type)
                    ? "<span><kbd>1</kbd>–<kbd>9</kbd> chọn đáp án</span>"
                    : ""
                }
                <span><kbd>Enter</kbd> chấm bài</span>
                ${question.hint ? "<span><kbd>H</kbd> gợi ý</span>" : ""}
              </div>
            `
            : '<div class="kbd-hint" aria-hidden="true"><span><kbd>Enter</kbd> tiếp tục</span></div>'
        }
      </article>
    </section>
  `;
}

/* ============================================================
   Tổng kết — markup
   ============================================================ */

function summaryMarkup() {
  const summary = state.summary;
  const accuracy =
    summary.target > 0
      ? Math.round((summary.correct / summary.target) * 100)
      : 0;
  const great = accuracy >= 80;
  const wrongCount = summary.wrongQuestions.length;
  const noFilters =
    state.levelFilter === "all" && state.topicFilter === "all";
  const remaining =
    summary.mode === "vocabulary"
      ? state.stats.vocabularyRemaining || state.stats.due
      : summary.mode === "grammar"
        ? state.stats.grammarRemaining
        : 0;
  const nextBatch =
    ["grammar", "vocabulary"].includes(summary.mode) && noFilters
      ? Math.min(SESSION_QUESTION_LIMIT, remaining)
      : 0;

  const heading = great
    ? summary.kind === "flashcards"
      ? "Nhớ tốt lắm!"
      : "Làm tốt lắm!"
    : "Xong một lượt.";

  return `
    <section class="view">
      <div class="summary-card">
        <span class="summary-kicker">HOÀN THÀNH</span>
        <h2>${heading}</h2>
        ${ringMarkup(summary.target > 0 ? summary.correct / summary.target : 0, {
          size: 132,
          stroke: 11,
          label: `${accuracy}%`,
          cls: `score-ring${great ? " great" : ""}`,
        })}
        <div class="summary-stats">
          <span>✅ ${summary.correct}/${summary.target} ${
            summary.kind === "flashcards" ? "thẻ nhớ ngay" : "câu đúng"
          }</span>
          <span>⚡ +${summary.xp} XP</span>
          ${
            summary.durationMs > 0
              ? `<span>⏱ ${escapeHtml(formatDuration(summary.durationMs))}</span>`
              : ""
          }
        </div>
        ${
          summary.results.length > 0
            ? `
              <div class="summary-list">
                ${summary.results
                  .map(
                    (item) => `
                      <div class="summary-row ${item.correct ? "correct" : "incorrect"}">
                        <i>${item.correct ? "✓" : "×"}</i>
                        <span>${escapeHtml(item.prompt)}</span>
                        <small>${escapeHtml(
                          summary.kind === "flashcards"
                            ? item.correct
                              ? "nhớ"
                              : "cần ôn"
                            : TYPE_LABELS[item.type] ?? "",
                        )}</small>
                      </div>
                    `,
                  )
                  .join("")}
              </div>
            `
            : ""
        }
        <div class="summary-actions">
          ${
            wrongCount > 0
              ? `
                <button class="primary-button" data-action="retry-wrong" type="button">
                  Luyện lại ${wrongCount} câu sai
                </button>
              `
              : ""
          }
          ${
            nextBatch > 0
              ? `
                <button
                  class="${wrongCount > 0 ? "ghost-button" : "primary-button"}"
                  data-action="${
                    summary.mode === "vocabulary" || summary.mode === "grammar"
                      ? "begin"
                      : "close-summary"
                  }"
                  data-mode="${escapeHtml(summary.mode)}"
                  type="button"
                >
                  Lượt tiếp theo · ${nextBatch} câu
                </button>
              `
              : ""
          }
          <button class="${
            wrongCount > 0 || nextBatch > 0 ? "text-button" : "primary-button"
          }" data-action="close-summary" type="button">
            Về trang học
          </button>
        </div>
      </div>
    </section>
  `;
}

/* ============================================================
   Flashcards — markup
   ============================================================ */

function flashcardsMarkup() {
  const flash = state.flash;
  const card = flash.queue[0];
  const progress = (flash.done / Math.max(1, flash.target)) * 100;
  const parsed = parseLearningKey(card.learningKey);
  const answerText = displayAnswer(card.answer);
  const speakFront = card.context || card.prompt;

  return `
    <section class="flash-view">
      <div class="session-head">
        <button data-action="flash-exit" class="back-button" type="button">
          ← Thoát
        </button>
        <div class="session-progress" aria-label="Tiến độ flashcards">
          <span style="width:${Math.min(100, progress)}%"></span>
        </div>
        <span class="session-count">${Math.min(
          flash.done + 1,
          flash.target,
        )}/${flash.target}</span>
      </div>

      <div class="flash-card${flash.flipped ? " flipped" : ""}" data-action-zone="flash">
        <div class="flash-inner" data-action="flash-flip" role="button" tabindex="0" aria-label="Lật thẻ">
          <div class="flash-face front">
            <div class="flash-tag">
              <span class="chip gold">FLASHCARD</span>
              <span class="chip">${escapeHtml(card.topic)}</span>
              ${speakButtonMarkup(speakFront, "Đọc mặt trước")}
            </div>
            <p class="flash-question">${escapeHtml(card.prompt)}</p>
            ${
              card.context
                ? `<p class="flash-context">${escapeHtml(card.context)}</p>`
                : ""
            }
            <p class="flash-flip-note">Chạm để lật thẻ ↺</p>
          </div>
          <div class="flash-face back">
            <div class="flash-tag">
              ${
                parsed
                  ? `<span class="chip teal">${escapeHtml(parsed.word)}${
                      parsed.pos ? ` · ${escapeHtml(parsed.pos)}` : ""
                    }</span>`
                  : '<span class="chip teal">ĐÁP ÁN</span>'
              }
              ${speakButtonMarkup(
                Array.isArray(card.answer) ? card.answer[0] : "",
                "Đọc đáp án",
              )}
            </div>
            <p class="flash-answer">${escapeHtml(answerText)}</p>
            ${
              card.explanation
                ? `<p class="flash-explanation">${escapeHtml(card.explanation)}</p>`
                : ""
            }
            <p class="flash-flip-note">Bạn nhớ được không?</p>
          </div>
        </div>
      </div>

      <div class="flash-actions">
        <button class="flash-again" data-action="flash-grade" data-correct="false" type="button" ${
          state.loading ? "disabled" : ""
        }>
          Chưa nhớ
          <small>thẻ quay lại cuối lượt</small>
        </button>
        <button class="flash-good" data-action="flash-grade" data-correct="true" type="button" ${
          state.loading ? "disabled" : ""
        }>
          Đã nhớ
          <small>giãn lịch ôn tập</small>
        </button>
      </div>
      <div class="kbd-hint" aria-hidden="true">
        <span><kbd>Space</kbd> lật thẻ</span>
        <span><kbd>1</kbd> chưa nhớ</span>
        <span><kbd>2</kbd> đã nhớ</span>
      </div>
    </section>
  `;
}

/* ============================================================
   Thư viện — markup
   ============================================================ */

function setManageMarkup() {
  if (state.sets.length === 0) return "";
  return `
    <section aria-labelledby="sets-title">
      <div class="section-heading">
        <span class="eyebrow">BỘ CÂU HỎI</span>
        <h1 id="sets-title">Quản lý bộ</h1>
        <p>Chọn bộ để học, đổi tên, xuất lại CSV hoặc xóa hẳn.</p>
      </div>
      <div class="set-manage">
        ${state.sets
          .map((set) => {
            const selected = state.selectedSetId === set.id;
            const renaming = state.renamingSetId === set.id;
            return `
              <div class="set-row${selected ? " selected" : ""}">
                <span class="set-check${selected ? " selected" : ""}" aria-hidden="true"
                  style="${selected ? "background:var(--accent);border-color:var(--accent);" : ""}"
                >${selected ? "✓" : ""}</span>
                <div class="set-row-info">
                  <strong>${escapeHtml(set.name)}</strong>
                  <small>${set.count} câu · nhập ${formatDate(set.importedAt)}</small>
                </div>
                <div class="set-row-actions">
                  ${
                    selected
                      ? ""
                      : `<button class="ghost-button" data-action="select-set" data-set-id="${escapeHtml(
                          set.id,
                        )}" type="button" style="padding:7px 13px;font-size:0.86rem;">Chọn</button>`
                  }
                  <button class="icon-button" data-action="rename-set" data-set-id="${escapeHtml(
                    set.id,
                  )}" type="button" aria-label="Đổi tên bộ">${ICONS.pencil}</button>
                  <button class="icon-button" data-action="export-set" data-set-id="${escapeHtml(
                    set.id,
                  )}" type="button" aria-label="Xuất CSV">${ICONS.download}</button>
                  <button class="icon-button danger" data-action="delete-set" data-set-id="${escapeHtml(
                    set.id,
                  )}" type="button" aria-label="Xóa bộ">${ICONS.trash}</button>
                </div>
                ${
                  renaming
                    ? `
                      <form class="rename-form" data-rename-form data-set-id="${escapeHtml(set.id)}">
                        <input
                          type="text"
                          name="set-name"
                          value="${escapeHtml(set.name)}"
                          maxlength="80"
                          aria-label="Tên mới của bộ"
                        >
                        <button class="primary-button" type="submit" style="padding:9px 16px;">Lưu</button>
                        <button class="ghost-button" data-action="rename-cancel" type="button" style="padding:9px 14px;">Hủy</button>
                      </form>
                    `
                    : ""
                }
              </div>
            `;
          })
          .join("")}
      </div>
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

function importSectionMarkup() {
  return `
    <section aria-labelledby="import-title">
      <div class="section-heading">
        <span class="eyebrow">QUESTION BANK</span>
        <h1 id="import-title">Nhập câu hỏi</h1>
        <p>Một file CSV là một bộ riêng. Website kiểm tra kỹ trước khi lưu trên thiết bị.</p>
      </div>

      <label class="drop-zone${state.dragActive ? " dragging" : ""}" data-drop-zone>
        <input data-csv-file type="file" accept=".csv,text/csv">
        <span class="upload-mark">CSV</span>
        <strong>Thả file vào đây</strong>
        <span>hoặc bấm để chọn · tối đa 5 MB · 2.000 câu</span>
      </label>

      <div class="resource-row">
        <button data-action="load-sample" type="button" ${
          state.loading ? "disabled" : ""
        }>Xem bộ mẫu</button>
        <a href="./sample_questions.csv" download>Tải CSV mẫu</a>
        <a href="./QUESTION_CSV_GUIDE.md" download>Hướng dẫn cho AI soạn câu hỏi</a>
      </div>

      ${previewMarkup()}
    </section>
  `;
}

function browseListMarkup() {
  const latest = lastAttemptByQuestion(state.setAttempts);
  const term = state.libSearch.trim().toLocaleLowerCase("vi");
  const filtered = state.setQuestions.filter((question) => {
    if (state.libDomain !== "all" && question.domain !== state.libDomain) {
      return false;
    }
    if (state.libType !== "all" && question.type !== state.libType) {
      return false;
    }
    if (!term) return true;
    const haystack = [
      question.prompt,
      question.context,
      question.topic,
      question.subtopic,
      Array.isArray(question.answer) ? question.answer.join(" ") : "",
      question.learningKey,
    ]
      .join(" ")
      .toLocaleLowerCase("vi");
    return haystack.includes(term);
  });

  const visible = filtered.slice(0, state.libLimit);
  const rows = visible
    .map((question) => {
      const attempt = latest.get(question.id);
      const stateIcon = attempt ? (attempt.correct ? "✅" : "❌") : "▫️";
      const answerText =
        question.type === "matching"
          ? displayAnswer(question.answer)
          : (Array.isArray(question.answer)
              ? question.answer
              : [question.answer]
            ).join(" / ");
      return `
        <details class="browse-item">
          <summary>
            <span class="browse-state" title="${
              attempt
                ? attempt.correct
                  ? "Lần gần nhất: đúng"
                  : "Lần gần nhất: sai"
                : "Chưa làm"
            }">${stateIcon}</span>
            <span class="browse-prompt">${escapeHtml(
              question.context || question.prompt,
            )}</span>
            <span class="chip">${escapeHtml(
              TYPE_LABELS[question.type] ?? question.type,
            )}</span>
          </summary>
          <div class="browse-body">
            ${
              question.context
                ? `<span class="browse-label">CÂU HỎI</span>
                   <p>${escapeHtml(question.prompt)}</p>`
                : ""
            }
            <span class="browse-label">ĐÁP ÁN</span>
            <p class="browse-answer">${escapeHtml(answerText)}</p>
            ${
              question.explanation
                ? `<span class="browse-label">GIẢI THÍCH</span>
                   <p>${escapeHtml(question.explanation)}</p>`
                : ""
            }
            ${
              question.theory
                ? `<span class="browse-label">LÝ THUYẾT</span>
                   <p>${escapeHtml(question.theory)}</p>`
                : ""
            }
            <span class="browse-label">${escapeHtml(
              `${question.domain} · ${question.level} · ${question.topic}`,
            )}</span>
          </div>
        </details>
      `;
    })
    .join("");

  return `
    ${
      filtered.length === 0
        ? '<p class="browse-empty">Không tìm thấy câu hỏi phù hợp.</p>'
        : rows
    }
    ${
      filtered.length > state.libLimit
        ? `
          <button class="ghost-button lib-more" data-action="lib-more" type="button">
            Hiện thêm (${filtered.length - state.libLimit} câu)
          </button>
        `
        : ""
    }
  `;
}

function browseSectionMarkup() {
  if (!state.selectedSetId || state.setQuestions.length === 0) return "";
  const set = state.sets.find((item) => item.id === state.selectedSetId);
  return `
    <section aria-labelledby="browse-title">
      <div class="section-heading">
        <span class="eyebrow">DUYỆT CÂU HỎI</span>
        <h1 id="browse-title">Trong bộ “${escapeHtml(set?.name ?? "")}”</h1>
        <p>Tra nhanh đáp án, giải thích và trạng thái làm bài của từng câu.</p>
      </div>
      <div class="browse-tools">
        <input
          class="search-input"
          type="search"
          data-lib-search
          placeholder="Tìm theo câu hỏi, đáp án, chủ điểm…"
          value="${escapeHtml(state.libSearch)}"
          aria-label="Tìm câu hỏi"
        >
        <select data-lib-domain aria-label="Lọc theo domain">
          <option value="all"${state.libDomain === "all" ? " selected" : ""}>Grammar + Vocab</option>
          <option value="grammar"${state.libDomain === "grammar" ? " selected" : ""}>Grammar</option>
          <option value="vocabulary"${state.libDomain === "vocabulary" ? " selected" : ""}>Vocabulary</option>
        </select>
        <select data-lib-type aria-label="Lọc theo dạng bài">
          <option value="all"${state.libType === "all" ? " selected" : ""}>Mọi dạng bài</option>
          ${Object.entries(TYPE_LABELS)
            .map(
              ([value, label]) =>
                `<option value="${value}"${
                  state.libType === value ? " selected" : ""
                }>${escapeHtml(label)}</option>`,
            )
            .join("")}
        </select>
      </div>
      <div class="question-browser" data-lib-list>
        ${browseListMarkup()}
      </div>
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

function bookMapMarkup() {
  return `
    <section aria-labelledby="bookmap-title">
      <div class="section-heading">
        <span class="eyebrow">BOOK MAP</span>
        <h1 id="bookmap-title">Chủ điểm gợi ý</h1>
        <p>Dùng làm danh sách topic khi nhờ AI soạn câu hỏi mới.</p>
      </div>
      <div class="book-stack">
        ${topicBookMarkup("IELTS", "Cambridge Grammar for IELTS", CAMBRIDGE_TOPICS)}
        ${topicBookMarkup("B1", "Destination B1", DESTINATION_B1_TOPICS)}
        ${topicBookMarkup("B2", "Destination B2", DESTINATION_B2_TOPICS)}
      </div>
    </section>
  `;
}

function libraryMarkup() {
  return `
    <section class="view library-view">
      ${setManageMarkup()}
      ${importSectionMarkup()}
      ${browseSectionMarkup()}
      ${bookMapMarkup()}
    </section>
  `;
}

/* ============================================================
   Tiến độ — markup
   ============================================================ */

function heatmapMarkup(attempts) {
  const weeks = heatmapWeeks(attempts, 17);
  const cells = weeks
    .flat()
    .map(
      (cell) => `
        <span
          class="heat-cell${cell.future ? " future" : ""}"
          data-level="${cell.level}"
          title="${cell.count} câu · ${escapeHtml(cell.label)}"
        ></span>
      `,
    )
    .join("");
  return `
    <div class="panel">
      <div class="panel-head">
        <h2>Bản đồ chăm chỉ</h2>
        <span>17 tuần gần nhất</span>
      </div>
      <div class="heatmap-scroll">
        <div class="heatmap-grid">${cells}</div>
      </div>
      <div class="heatmap-legend">
        Ít
        <span class="heat-cell" data-level="0"></span>
        <span class="heat-cell" data-level="1"></span>
        <span class="heat-cell" data-level="2"></span>
        <span class="heat-cell" data-level="3"></span>
        <span class="heat-cell" data-level="4"></span>
        Nhiều
      </div>
    </div>
  `;
}

function activityChartMarkup(attempts) {
  const days = dailyActivity(attempts, 14);
  const max = Math.max(1, ...days.map((day) => day.count));
  const bars = days
    .map(
      (day) => `
        <div class="bar-col${day.count === 0 ? " empty" : ""}" title="${
          day.count
        } câu · ${escapeHtml(day.label)}">
          <span class="bar" style="height:${Math.max(
            2,
            Math.round((day.count / max) * 100),
          )}%"></span>
          <small>${escapeHtml(day.weekday)}</small>
        </div>
      `,
    )
    .join("");
  const total = days.reduce((sum, day) => sum + day.count, 0);
  return `
    <div class="panel">
      <div class="panel-head">
        <h2>14 ngày gần đây</h2>
        <span>${formatNumber(total)} câu</span>
      </div>
      <div class="bar-chart">${bars}</div>
    </div>
  `;
}

function accuracyPanelMarkup() {
  const acc = accuracyByDomain(
    state.snapshot.questions,
    state.snapshot.attempts,
  );
  const row = (label, entry, fill) => `
    <div class="domain-acc">
      <div class="domain-acc-head">
        <strong>${label}</strong>
        <span>${
          entry.accuracy == null
            ? "chưa có dữ liệu"
            : `${entry.accuracy}% · ${formatNumber(entry.total)} câu`
        }</span>
      </div>
      <div class="meter"><span class="${fill}" style="width:${
        entry.accuracy ?? 0
      }%"></span></div>
    </div>
  `;
  return `
    <div class="panel">
      <div class="panel-head">
        <h2>Độ chính xác</h2>
        <span>toàn bộ lịch sử</span>
      </div>
      ${row("Grammar", acc.grammar, "fill-blue")}
      ${row("Vocabulary", acc.vocabulary, "fill-teal")}
    </div>
  `;
}

function masteryPanelMarkup() {
  const mastery = topicMastery(state.setQuestions, state.setAttempts).slice(
    0,
    8,
  );
  if (mastery.length === 0) return "";
  const rows = mastery
    .map(
      (entry) => `
        <div class="mastery-row">
          <div class="mastery-name">
            <strong>${escapeHtml(entry.topic)}</strong>
            <small>${entry.domain === "grammar" ? "Grammar" : "Vocabulary"} · ${
              entry.attempted
            }/${entry.total} câu đã làm</small>
          </div>
          <div class="meter"><span class="${
            entry.domain === "grammar" ? "fill-blue" : "fill-teal"
          }" style="width:${Math.round(entry.coverage * 100)}%"></span></div>
          <small>${
            entry.accuracy == null ? "—" : `${entry.accuracy}%`
          }</small>
        </div>
      `,
    )
    .join("");
  return `
    <div class="panel">
      <div class="panel-head">
        <h2>Chủ điểm trong bộ đang chọn</h2>
        <span>độ phủ · độ chính xác</span>
      </div>
      <div class="mastery-list">${rows}</div>
    </div>
  `;
}

function forecastPanelMarkup() {
  const keys = collectVocabularyKeys(state.setQuestions);
  if (keys.length === 0) return "";
  const buckets = dueForecast(state.snapshot.reviews, keys, 7);
  const labels = ["Hôm nay", "Mai", "+2", "+3", "+4", "+5", "+6"];
  const cells = buckets
    .map(
      (count, index) => `
        <div class="forecast-cell${count > 0 && index === 0 ? " hot" : ""}">
          <strong>${count}</strong>
          <small>${labels[index]}</small>
        </div>
      `,
    )
    .join("");
  return `
    <div class="panel">
      <div class="panel-head">
        <h2>Lịch ôn 7 ngày tới</h2>
        <span>số nghĩa từ đến hạn</span>
      </div>
      <div class="forecast-row">${cells}</div>
    </div>
  `;
}

function achievementsMarkup() {
  const achievements = buildAchievements({
    attempts: state.snapshot.attempts,
    imports: state.snapshot.imports,
    reviews: state.snapshot.reviews,
    questions: state.snapshot.questions,
  });
  const unlockedCount = achievements.filter(
    (item) => item.unlocked,
  ).length;
  const cards = achievements
    .map(
      (item) => `
        <div class="achievement ${item.unlocked ? "unlocked" : "locked"}">
          <span class="ach-icon" aria-hidden="true">${item.icon}</span>
          <strong>${escapeHtml(item.name)}</strong>
          <small>${escapeHtml(item.description)}</small>
          ${
            !item.unlocked && item.target > 1
              ? `
                <div class="ach-progress">
                  <div class="meter"><span class="fill-accent" style="width:${Math.round(
                    (item.value / item.target) * 100,
                  )}%"></span></div>
                  <small>${formatNumber(item.value)}/${formatNumber(item.target)}</small>
                </div>
              `
              : ""
          }
        </div>
      `,
    )
    .join("");
  return `
    <div class="panel">
      <div class="panel-head">
        <h2>Thành tích</h2>
        <span>${unlockedCount}/${achievements.length} đã mở</span>
      </div>
      <div class="achievements-grid">${cards}</div>
    </div>
  `;
}

function progressMarkup() {
  const attempts = state.snapshot.attempts;
  const streaks = computeStreaks(attempts);
  const xp = xpFromAttempts(attempts);
  const level = levelInfo(xp);
  return `
    <section class="view progress-view">
      <div class="section-heading">
        <span class="eyebrow">YOUR PROGRESS</span>
        <h1>Tiến độ</h1>
        <p>Toàn cảnh việc học của bạn — trên mọi bộ câu hỏi.</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card coral"><strong>🔥 ${streaks.current}</strong><span>chuỗi hiện tại (dài nhất ${streaks.longest})</span></div>
        <div class="stat-card gold"><strong>Cấp ${level.level}</strong><span>${formatNumber(xp)} XP tổng</span></div>
        <div class="stat-card teal"><strong>${formatNumber(attempts.length)}</strong><span>câu đã làm</span></div>
        <div class="stat-card blue"><strong>${state.stats.due}</strong><span>từ đến hạn trong bộ đang chọn</span></div>
      </div>

      ${heatmapMarkup(attempts)}
      ${activityChartMarkup(attempts)}
      ${accuracyPanelMarkup()}
      ${masteryPanelMarkup()}
      ${forecastPanelMarkup()}
      ${achievementsMarkup()}
    </section>
  `;
}

/* ============================================================
   Cài đặt — markup
   ============================================================ */

function settingsMarkup() {
  const settings = state.settings;
  const themeButton = (value, label) => `
    <button
      class="${settings.theme === value ? "active" : ""}"
      data-action="set-theme"
      data-value="${value}"
      type="button"
    >${label}</button>
  `;
  return `
    <section class="view settings-view">
      <div class="section-heading">
        <span class="eyebrow">SETTINGS</span>
        <h1>Cài đặt</h1>
        <p>Tùy chỉnh giao diện, mục tiêu và dữ liệu học.</p>
      </div>

      <div class="settings-group">
        <h2>Giao diện</h2>
        <div class="setting-row">
          <div class="setting-copy">
            <strong>Chủ đề màu</strong>
            <small>“Hệ thống” tự đổi theo thiết bị.</small>
          </div>
          <div class="seg-control" role="group" aria-label="Chọn chủ đề màu">
            ${themeButton("system", "Hệ thống")}
            ${themeButton("light", "Sáng")}
            ${themeButton("dark", "Tối")}
          </div>
        </div>
      </div>

      <div class="settings-group">
        <h2>Học tập</h2>
        <div class="setting-row">
          <div class="setting-copy">
            <strong>Mục tiêu mỗi ngày</strong>
            <small>Số câu để lấp đầy vòng tiến độ ở trang học.</small>
          </div>
          <select data-setting="dailyGoal" aria-label="Mục tiêu mỗi ngày">
            ${[10, 20, 30, 50, 100]
              .map(
                (value) =>
                  `<option value="${value}"${
                    settings.dailyGoal === value ? " selected" : ""
                  }>${value} câu</option>`,
              )
              .join("")}
          </select>
        </div>
      </div>

      <div class="settings-group">
        <h2>Phát âm</h2>
        <div class="setting-row">
          <div class="setting-copy">
            <strong>Đọc to tiếng Anh</strong>
            <small>${
              speechAvailable()
                ? "Dùng giọng đọc có sẵn trên thiết bị."
                : "Trình duyệt này không hỗ trợ đọc to."
            }</small>
          </div>
          <label class="switch">
            <input type="checkbox" data-setting="ttsEnabled" ${
              settings.ttsEnabled ? "checked" : ""
            } ${speechAvailable() ? "" : "disabled"}>
            <span class="slider"></span>
          </label>
        </div>
        <div class="setting-row">
          <div class="setting-copy">
            <strong>Tự đọc câu từ vựng</strong>
            <small>Đọc câu hỏi ngay khi thẻ/câu từ vựng hiện ra.</small>
          </div>
          <label class="switch">
            <input type="checkbox" data-setting="autoSpeak" ${
              settings.autoSpeak ? "checked" : ""
            } ${settings.ttsEnabled && speechAvailable() ? "" : "disabled"}>
            <span class="slider"></span>
          </label>
        </div>
        <div class="setting-row">
          <div class="setting-copy">
            <strong>Tốc độ đọc</strong>
            <small><span data-rate-label>${settings.ttsRate.toFixed(2)}</span>×</small>
          </div>
          <input
            type="range"
            min="0.6"
            max="1.3"
            step="0.05"
            value="${settings.ttsRate}"
            data-setting="ttsRate"
            aria-label="Tốc độ đọc"
            ${settings.ttsEnabled && speechAvailable() ? "" : "disabled"}
          >
        </div>
      </div>

      <div class="settings-group">
        <h2>Dữ liệu</h2>
        <div class="setting-row">
          <div class="setting-copy">
            <strong>Sao lưu toàn bộ</strong>
            <small>Tải một file JSON gồm câu hỏi, lịch sử và lịch ôn. Dùng để chuyển máy hoặc đổi trình duyệt.</small>
          </div>
          <button class="ghost-button" data-action="backup-export" type="button">
            Tải sao lưu
          </button>
        </div>
        <div class="setting-row">
          <div class="setting-copy">
            <strong>Khôi phục từ file</strong>
            <small>Thay toàn bộ dữ liệu hiện tại bằng nội dung file sao lưu.</small>
          </div>
          <label class="ghost-button">
            Chọn file JSON
            <input type="file" accept=".json,application/json" data-backup-file class="sr-only">
          </label>
        </div>
        <div class="setting-row">
          <div class="setting-copy">
            <strong>Xóa toàn bộ dữ liệu</strong>
            <small>Xóa hết câu hỏi, lịch sử và lịch ôn trên thiết bị này.</small>
          </div>
          <button class="danger-button" data-action="reset-all" type="button">
            Xóa hết
          </button>
        </div>
      </div>

      <div class="settings-group">
        <h2>Về website</h2>
        <div class="setting-row">
          <p class="about-box">
            NẮM English lưu toàn bộ dữ liệu bằng <strong>${escapeHtml(
              state.storageMode,
            )}</strong> ngay trên thiết bị — không tài khoản, không máy chủ.
            Đổi trình duyệt hoặc xóa dữ liệu trang sẽ tạo một kho mới, nên hãy
            sao lưu định kỳ. Câu hỏi nhập từ CSV; xem
            <a href="./QUESTION_CSV_GUIDE.md" download>hướng dẫn soạn câu hỏi</a>.
          </p>
        </div>
      </div>
    </section>
  `;
}

/* ============================================================
   Render
   ============================================================ */

function currentContentMarkup() {
  if (state.session) return sessionMarkup();
  if (state.flash) return flashcardsMarkup();
  if (state.summary) return summaryMarkup();
  if (state.view === "library") return libraryMarkup();
  if (state.view === "progress") return progressMarkup();
  if (state.view === "settings") return settingsMarkup();
  return homeMarkup();
}

function render() {
  const { tabs } = navMarkup();
  root.innerHTML = `
    <main class="app-shell">
      ${topbarMarkup()}
      ${currentContentMarkup()}
      <footer>
        <span>NẮM English</span>
        <span>Lưu cục bộ · Không cần tài khoản · Không gửi dữ liệu đi đâu</span>
      </footer>
    </main>
    <nav class="tabbar" aria-label="Điều hướng chính">${tabs}</nav>
    ${
      state.notice
        ? `
          <div class="toast ${state.notice.kind}" role="status">
            <span>${escapeHtml(state.notice.text)}</span>
            <button data-action="dismiss-notice" type="button" aria-label="Đóng">×</button>
          </div>
        `
        : ""
    }
  `;
  focusAnswerIfNeeded();
}

function focusAnswerIfNeeded() {
  const question = state.session?.queue[0];
  if (
    !question ||
    state.session.result ||
    !window.matchMedia("(min-width: 761px)").matches
  ) {
    return;
  }
  if (lastFocusedQuestionId === question.id) return;
  const input = root.querySelector("[data-answer-text]");
  if (input) {
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }
  lastFocusedQuestionId = question.id;
}

function updateSubmitState() {
  const button = root.querySelector("[data-submit]");
  if (button) button.disabled = !answerReady() || state.loading;
}

function updateLibraryList() {
  const container = root.querySelector("[data-lib-list]");
  if (container) container.innerHTML = browseListMarkup();
}

/* ============================================================
   Sự kiện
   ============================================================ */

root.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const { action } = button.dataset;

  if (action === "nav") {
    changeView(button.dataset.view);
  } else if (action === "toggle-theme") {
    const next = resolveTheme(state.settings.theme) === "dark"
      ? "light"
      : "dark";
    updateSettings({ theme: next });
    applyTheme();
    render();
  } else if (action === "set-theme") {
    updateSettings({ theme: button.dataset.value });
    applyTheme();
    render();
  } else if (action === "dismiss-notice") {
    dismissToast();
  } else if (action === "begin") {
    void beginSession(button.dataset.mode);
  } else if (action === "begin-flashcards") {
    void beginFlashcards();
  } else if (action === "select-set") {
    void selectQuestionSet(button.dataset.setId);
  } else if (action === "end-session") {
    exitSession();
  } else if (action === "close-summary") {
    state.summary = null;
    render();
  } else if (action === "retry-wrong") {
    startWrongReview(state.summary?.wrongQuestions ?? []);
  } else if (action === "select-option") {
    if (state.session?.result) return;
    const question = state.session?.queue[0];
    if (!question) return;
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
    if (state.session?.result) return;
    const index = Number(button.dataset.index);
    const [token] = state.answer.remaining.splice(index, 1);
    state.answer.ordered.push(token);
    render();
  } else if (action === "remove-token") {
    if (state.session?.result) return;
    const index = Number(button.dataset.index);
    const [token] = state.answer.ordered.splice(index, 1);
    state.answer.remaining.push(token);
    render();
  } else if (action === "toggle-hint") {
    state.answer.hintOpen = !state.answer.hintOpen;
    render();
  } else if (action === "continue") {
    continueSession();
  } else if (action === "speak") {
    speakText(button.dataset.speakText);
  } else if (action === "flash-flip") {
    if (state.flash) {
      state.flash.flipped = !state.flash.flipped;
      const card = root.querySelector(".flash-card");
      if (card) card.classList.toggle("flipped", state.flash.flipped);
      if (state.flash.flipped) {
        const current = state.flash.queue[0];
        if (state.settings.autoSpeak && Array.isArray(current?.answer)) {
          speakText(current.answer[0]);
        }
      }
    }
  } else if (action === "flash-grade") {
    void gradeFlashcard(button.dataset.correct === "true");
  } else if (action === "flash-exit") {
    stopSpeaking();
    state.flash = null;
    render();
    void refreshDashboard();
  } else if (action === "load-sample") {
    void loadSample();
  } else if (action === "close-preview") {
    state.csvPreview = null;
    render();
  } else if (action === "import-csv") {
    void importCsv();
  } else if (action === "rename-set") {
    state.renamingSetId =
      state.renamingSetId === button.dataset.setId
        ? null
        : button.dataset.setId;
    render();
    root.querySelector("[data-rename-form] input")?.focus();
  } else if (action === "rename-cancel") {
    state.renamingSetId = null;
    render();
  } else if (action === "delete-set") {
    void deleteSet(button.dataset.setId);
  } else if (action === "export-set") {
    exportSetCsv(button.dataset.setId);
  } else if (action === "lib-more") {
    state.libLimit += 50;
    updateLibraryList();
  } else if (action === "backup-export") {
    exportBackup();
  } else if (action === "reset-all") {
    void resetAllData();
  }
});

root.addEventListener("submit", (event) => {
  if (event.target.matches("[data-answer-form]")) {
    event.preventDefault();
    void submitAnswer();
    return;
  }
  if (event.target.matches("[data-rename-form]")) {
    event.preventDefault();
    const input = event.target.querySelector("input[name='set-name']");
    void renameSet(event.target.dataset.setId, input?.value ?? "");
  }
});

root.addEventListener("input", (event) => {
  const target = event.target;
  if (target.matches("[data-answer-text]")) {
    state.answer.text = target.value;
    updateSubmitState();
  } else if (target.matches("[data-lib-search]")) {
    state.libSearch = target.value;
    state.libLimit = 30;
    updateLibraryList();
  } else if (target.matches("[data-setting='ttsRate']")) {
    updateSettings({ ttsRate: Number(target.value) });
    const label = root.querySelector("[data-rate-label]");
    if (label) label.textContent = state.settings.ttsRate.toFixed(2);
  }
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
  } else if (target.matches("[data-backup-file]")) {
    const file = target.files?.[0];
    if (file) void importBackup(file);
    target.value = "";
  } else if (target.matches("[data-match-index]")) {
    const question = state.session?.queue[0];
    if (!question) return;
    const pair = question.options[Number(target.dataset.matchIndex)];
    state.answer.matches[pair.left] = target.value;
    updateSubmitState();
  } else if (target.matches("[data-lib-domain]")) {
    state.libDomain = target.value;
    state.libLimit = 30;
    updateLibraryList();
  } else if (target.matches("[data-lib-type]")) {
    state.libType = target.value;
    state.libLimit = 30;
    updateLibraryList();
  } else if (target.matches("[data-setting='dailyGoal']")) {
    updateSettings({ dailyGoal: Number(target.value) });
    render();
  } else if (target.matches("[data-setting='ttsEnabled']")) {
    updateSettings({ ttsEnabled: target.checked });
    if (!target.checked) stopSpeaking();
    render();
  } else if (target.matches("[data-setting='autoSpeak']")) {
    updateSettings({ autoSpeak: target.checked });
  }
});

root.addEventListener("dragenter", (event) => {
  if (!event.target.closest("[data-drop-zone]")) return;
  event.preventDefault();
  if (!state.dragActive) {
    state.dragActive = true;
    render();
  }
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
  else render();
});

document.addEventListener("keydown", (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const tag = event.target.tagName;
  const inField =
    tag === "TEXTAREA" ||
    tag === "INPUT" ||
    tag === "SELECT" ||
    event.target.isContentEditable;

  // Flashcards
  if (state.flash) {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      state.flash.flipped = !state.flash.flipped;
      const card = root.querySelector(".flash-card");
      if (card) card.classList.toggle("flipped", state.flash.flipped);
    } else if (event.key === "1") {
      void gradeFlashcard(false);
    } else if (event.key === "2") {
      void gradeFlashcard(true);
    }
    return;
  }

  const session = state.session;
  if (!session || !session.queue[0]) return;
  const question = session.queue[0];

  if (event.key === "Enter" && !inField) {
    event.preventDefault();
    if (session.result) continueSession();
    else if (answerReady()) void submitAnswer();
    return;
  }
  if (inField) {
    // Enter trong textarea: chấm luôn (Shift+Enter để xuống dòng).
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      tag === "TEXTAREA" &&
      !session.result
    ) {
      event.preventDefault();
      if (answerReady()) void submitAnswer();
    }
    return;
  }
  if (session.result) return;

  if (
    ["mcq", "multiple_select"].includes(question.type) &&
    /^[1-9]$/.test(event.key)
  ) {
    const index = Number(event.key) - 1;
    const option = question.options[index];
    if (option == null) return;
    if (question.type === "mcq") {
      state.answer.selected = [option];
    } else {
      state.answer.selected = state.answer.selected.includes(option)
        ? state.answer.selected.filter((item) => item !== option)
        : [...state.answer.selected, option];
    }
    render();
  } else if (event.key.toLowerCase() === "h" && question.hint) {
    state.answer.hintOpen = !state.answer.hintOpen;
    render();
  } else if (
    question.type === "ordering" &&
    /^[1-9]$/.test(event.key)
  ) {
    const index = Number(event.key) - 1;
    if (index < state.answer.remaining.length) {
      const [token] = state.answer.remaining.splice(index, 1);
      state.answer.ordered.push(token);
      render();
    }
  } else if (
    question.type === "ordering" &&
    event.key === "Backspace"
  ) {
    event.preventDefault();
    const token = state.answer.ordered.pop();
    if (token != null) {
      state.answer.remaining.push(token);
      render();
    }
  }
});

/* ============================================================
   Khởi động
   ============================================================ */

async function start() {
  state.settings = readSettings();
  applyTheme();
  warmUpSpeech();

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      if (state.settings.theme === "system") {
        applyTheme();
        render();
      }
    });

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // Offline cache là tính năng phụ; bỏ qua nếu không đăng ký được.
    });
  }

  try {
    repository = await createRepository();
    state.storageMode = repository.mode;
    state.selectedSetId = readSelectedQuestionSet();
    await refreshDashboard({ repaint: false });

    const restored = await restoreStudySession(repository);
    if (restored) {
      state.view = "home";
      state.selectedSetId = restored.selectedSetId;
      saveSelectedQuestionSet(restored.selectedSetId);
      await refreshDashboard({ repaint: false });
      state.session = {
        mode: restored.sessionMode,
        queue: restored.queue,
        target: restored.sessionTarget,
        done: restored.sessionDone,
        correct: restored.sessionCorrect,
        results: [],
        result: restored.result,
        startedAt: Date.now(),
      };
      resetAnswer(state.session.queue[0]);
    }
    render();
  } catch (error) {
    root.innerHTML = `
      <main class="app-shell">
        <header class="topbar">
          <span class="brand"><span class="brand-mark">N</span><span>NẮM</span></span>
        </header>
        <section class="boot-screen">
          <span class="eyebrow">CÓ LỖI KHI MỞ KHO DỮ LIỆU</span>
          <h1>${escapeHtml(
            error instanceof Error
              ? error.message
              : "Không khởi tạo được kho dữ liệu cục bộ.",
          )}</h1>
        </section>
      </main>
    `;
  }
}

void start();
