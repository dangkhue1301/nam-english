// Các hàm thống kê, gamification và xuất dữ liệu. Tất cả đều thuần
// (không đụng DOM hay storage) để test được bằng Node.

import { CSV_HEADERS, learningKeyFor, displayAnswer, SUBJECTS } from "./core.js";

const DAY_MS = 24 * 60 * 60 * 1_000;

export function startOfDay(timestamp) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function dayKey(timestamp) {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function attemptsByDay(attempts) {
  const byDay = new Map();
  attempts.forEach((attempt) => {
    const key = dayKey(attempt.attemptedAt);
    const entry = byDay.get(key) ?? { count: 0, correct: 0 };
    entry.count += 1;
    if (attempt.correct) entry.correct += 1;
    byDay.set(key, entry);
  });
  return byDay;
}

export function computeStreaks(attempts, now = Date.now()) {
  const byDay = attemptsByDay(attempts);
  const today = startOfDay(now);
  const todayEntry = byDay.get(dayKey(today));

  let current = 0;
  let cursor = todayEntry ? today : today - DAY_MS;
  while (byDay.has(dayKey(cursor))) {
    current += 1;
    cursor -= DAY_MS;
  }

  let longest = 0;
  const studiedDays = [...byDay.keys()]
    .map((key) => startOfDay(new Date(`${key}T12:00:00`).getTime()))
    .sort((a, b) => a - b);
  let run = 0;
  let previous = null;
  studiedDays.forEach((day) => {
    run = previous != null && day - previous === DAY_MS ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = day;
  });

  return {
    current,
    longest,
    todayCount: todayEntry?.count ?? 0,
    studiedToday: Boolean(todayEntry),
  };
}

const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export function dailyActivity(attempts, days = 14, now = Date.now()) {
  const byDay = attemptsByDay(attempts);
  const today = startOfDay(now);
  const result = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const ts = today - offset * DAY_MS;
    const date = new Date(ts);
    const entry = byDay.get(dayKey(ts)) ?? { count: 0, correct: 0 };
    result.push({
      key: dayKey(ts),
      ts,
      count: entry.count,
      correct: entry.correct,
      label: `${date.getDate()}/${date.getMonth() + 1}`,
      weekday: WEEKDAY_LABELS[(date.getDay() + 6) % 7],
    });
  }
  return result;
}

export function heatmapLevel(count) {
  if (count <= 0) return 0;
  if (count < 5) return 1;
  if (count < 10) return 2;
  if (count < 20) return 3;
  return 4;
}

export function heatmapWeeks(attempts, weeks = 17, now = Date.now()) {
  const byDay = attemptsByDay(attempts);
  const today = startOfDay(now);
  const weekdayIndex = (new Date(today).getDay() + 6) % 7;
  const currentMonday = today - weekdayIndex * DAY_MS;
  const firstMonday = currentMonday - (weeks - 1) * 7 * DAY_MS;

  const grid = [];
  for (let week = 0; week < weeks; week += 1) {
    const column = [];
    for (let day = 0; day < 7; day += 1) {
      const ts = firstMonday + (week * 7 + day) * DAY_MS;
      const entry = byDay.get(dayKey(ts));
      const date = new Date(ts);
      column.push({
        key: dayKey(ts),
        ts,
        future: ts > today,
        count: entry?.count ?? 0,
        level: entry ? heatmapLevel(entry.count) : 0,
        label: `${date.getDate()}/${date.getMonth() + 1}`,
        monthStart: date.getDate() === 1,
      });
    }
    grid.push(column);
  }
  return grid;
}

export const XP_CORRECT = 10;
export const XP_INCORRECT = 2;

export function xpFromAttempts(attempts) {
  return attempts.reduce(
    (total, attempt) =>
      total + (attempt.correct ? XP_CORRECT : XP_INCORRECT),
    0,
  );
}

export function levelCost(level) {
  return 100 + (level - 1) * 50;
}

export function levelInfo(xp) {
  let level = 1;
  let remaining = Math.max(0, xp);
  while (remaining >= levelCost(level)) {
    remaining -= levelCost(level);
    level += 1;
  }
  const needed = levelCost(level);
  return {
    level,
    intoLevel: remaining,
    needed,
    progress: Math.min(1, remaining / needed),
  };
}

export function accuracyByDomain(questions, attempts) {
  const domainById = new Map(
    questions.map((question) => [question.id, question.domain]),
  );
  const totals = {
    grammar: { total: 0, correct: 0 },
    vocabulary: { total: 0, correct: 0 },
    practice: { total: 0, correct: 0 },
  };
  attempts.forEach((attempt) => {
    const domain = domainById.get(attempt.questionId);
    if (!totals[domain]) return;
    totals[domain].total += 1;
    if (attempt.correct) totals[domain].correct += 1;
  });
  const rate = (entry) =>
    entry.total > 0 ? Math.round((entry.correct / entry.total) * 100) : null;
  return {
    grammar: { ...totals.grammar, accuracy: rate(totals.grammar) },
    vocabulary: { ...totals.vocabulary, accuracy: rate(totals.vocabulary) },
    practice: { ...totals.practice, accuracy: rate(totals.practice) },
  };
}

export function topicMastery(questions, attempts) {
  const active = questions.filter((question) => question.active !== false);
  const byId = new Map(active.map((question) => [question.id, question]));
  const topics = new Map();

  active.forEach((question) => {
    const key = `${question.domain}\u0000${question.topic}`;
    const entry = topics.get(key) ?? {
      topic: question.topic,
      domain: question.domain,
      total: 0,
      attempted: new Set(),
      attempts: 0,
      correct: 0,
    };
    entry.total += 1;
    topics.set(key, entry);
  });

  attempts.forEach((attempt) => {
    const question = byId.get(attempt.questionId);
    if (!question) return;
    const entry = topics.get(`${question.domain}\u0000${question.topic}`);
    if (!entry) return;
    entry.attempted.add(question.id);
    entry.attempts += 1;
    if (attempt.correct) entry.correct += 1;
  });

  return [...topics.values()]
    .map((entry) => ({
      topic: entry.topic,
      domain: entry.domain,
      total: entry.total,
      attempted: entry.attempted.size,
      coverage: entry.total > 0 ? entry.attempted.size / entry.total : 0,
      accuracy:
        entry.attempts > 0
          ? Math.round((entry.correct / entry.attempts) * 100)
          : null,
    }))
    .sort((a, b) => b.attempted - a.attempted || b.total - a.total);
}

export function dueForecast(reviews, vocabularyKeys, days = 7, now = Date.now()) {
  const keySet = new Set(vocabularyKeys);
  const today = startOfDay(now);
  const buckets = Array.from({ length: days }, () => 0);
  reviews.forEach((review) => {
    if (!keySet.has(review.learningKey)) return;
    const offset = Math.floor((startOfDay(review.dueAt) - today) / DAY_MS);
    if (offset < 0) buckets[0] += 1;
    else if (offset < days) buckets[offset] += 1;
  });
  return buckets;
}

export function dueCountToday(reviews, vocabularyKeys, now = Date.now()) {
  return dueForecast(reviews, vocabularyKeys, 1, now)[0] || 0;
}

export function lastAttemptByQuestion(attempts) {
  const latest = new Map();
  attempts.forEach((attempt) => {
    const previous = latest.get(attempt.questionId);
    if (!previous || attempt.attemptedAt >= previous.attemptedAt) {
      latest.set(attempt.questionId, attempt);
    }
  });
  return latest;
}

export function mistakeQuestions(questions, attempts) {
  const latest = lastAttemptByQuestion(attempts);
  return questions
    .filter((question) => {
      if (question.active === false) return false;
      // Thẻ từ vựng học theo chu trình SRS riêng; "Chưa nhớ" là để học lại chứ không phải bài tập sai
      if (question.domain === "vocabulary") return false;
      const attempt = latest.get(question.id);
      return attempt && !attempt.correct;
    })
    .sort(
      (a, b) =>
        latest.get(b.id).attemptedAt - latest.get(a.id).attemptedAt,
    );
}

export function parseLearningKey(learningKey) {
  const match = /^vocab:([^:]+)(?::([^:]+))?(?::(.+))?$/.exec(
    String(learningKey ?? ""),
  );
  if (!match) return null;
  return {
    word: match[1].replaceAll("-", " "),
    pos: match[2] ?? "",
    sense: match[3] ? match[3].replaceAll("-", " ") : "",
  };
}

export function buildAchievements({
  attempts = [],
  imports = [],
  reviews = [],
  questions = [],
  now = Date.now(),
} = {}) {
  const streaks = computeStreaks(attempts, now);
  const correctCount = attempts.filter((attempt) => attempt.correct).length;
  const total = attempts.length;
  const accuracy = total > 0 ? (correctCount / total) * 100 : 0;
  const typeById = new Map(
    questions.map((question) => [question.id, question.type]),
  );
  const typesDone = new Set();
  let nightOwl = false;
  let earlyBird = false;
  attempts.forEach((attempt) => {
    const type = typeById.get(attempt.questionId);
    if (type) typesDone.add(type);
    const hour = new Date(attempt.attemptedAt).getHours();
    if (hour >= 23 || hour < 5) nightOwl = true;
    if (hour >= 5 && hour < 8) earlyBird = true;
  });
  const busiestDay = Math.max(
    0,
    ...[...attemptsByDay(attempts).values()].map((entry) => entry.count),
  );
  const matureReviews = reviews.filter(
    (review) => (review.intervalDays ?? 0) >= 21,
  ).length;

  const definitions = [
    // --- Khởi đầu & Kho bài ---
    {
      id: "first-question",
      tier: "Đồng",
      tierIcon: "🥉",
      tierClass: "tier-bronze",
      icon: "🌱",
      name: "Khởi đầu",
      description: "Trả lời câu hỏi đầu tiên",
      value: Math.min(total, 1),
      target: 1,
    },
    {
      id: "first-import",
      tier: "Đồng",
      tierIcon: "🥉",
      tierClass: "tier-bronze",
      icon: "📚",
      name: "Có kho riêng",
      description: "Nhập bộ câu hỏi đầu tiên",
      value: Math.min(imports.length, 1),
      target: 1,
    },
    {
      id: "import-multi",
      tier: "Bạc",
      tierIcon: "🥈",
      tierClass: "tier-silver",
      icon: "🗂️",
      name: "Nhà sưu tầm",
      description: "Nhập từ 3 bộ câu hỏi",
      value: Math.min(imports.length, 3),
      target: 3,
    },
    {
      id: "import-vip",
      tier: "Vàng",
      tierIcon: "🥇",
      tierClass: "tier-gold",
      icon: "🏛️",
      name: "Đại thư viện",
      description: "Nhập từ 6 bộ câu hỏi phong phú",
      value: Math.min(imports.length, 6),
      target: 6,
    },

    // --- Chuỗi ngày học (Streak Tiers) ---
    {
      id: "streak-3",
      tier: "Đồng",
      tierIcon: "🥉",
      tierClass: "tier-bronze",
      icon: "🔥",
      name: "Bén lửa",
      description: "Chuỗi 3 ngày học liên tiếp",
      value: Math.min(streaks.longest, 3),
      target: 3,
    },
    {
      id: "streak-7",
      tier: "Bạc",
      tierIcon: "🥈",
      tierClass: "tier-silver",
      icon: "⚡",
      name: "Trọn một tuần",
      description: "Chuỗi 7 ngày học liên tiếp",
      value: Math.min(streaks.longest, 7),
      target: 7,
    },
    {
      id: "streak-14",
      tier: "Vàng",
      tierIcon: "🥇",
      tierClass: "tier-gold",
      icon: "🌟",
      name: "Nửa tháng bền bỉ",
      description: "Chuỗi 14 ngày học liên tiếp",
      value: Math.min(streaks.longest, 14),
      target: 14,
    },
    {
      id: "streak-30",
      tier: "Bạch kim",
      tierIcon: "💠",
      tierClass: "tier-platinum",
      icon: "🏆",
      name: "Thói quen thép",
      description: "Chuỗi 30 ngày học liên tiếp",
      value: Math.min(streaks.longest, 30),
      target: 30,
    },
    {
      id: "streak-60",
      tier: "Kim cương",
      tierIcon: "💎",
      tierClass: "tier-diamond",
      icon: "💎",
      name: "Bất khả chiến bại",
      description: "Chuỗi 60 ngày học liên tiếp",
      value: Math.min(streaks.longest, 60),
      target: 60,
    },
    {
      id: "streak-100",
      tier: "Huyền thoại VIP",
      tierIcon: "👑",
      tierClass: "tier-vip",
      icon: "👑",
      name: "Huyền thoại kỷ luật",
      description: "Chuỗi 100 ngày kiên trì tuyệt đỉnh",
      value: Math.min(streaks.longest, 100),
      target: 100,
    },

    // --- Số câu đúng (Correct count tiers) ---
    {
      id: "correct-50",
      tier: "Đồng",
      tierIcon: "🥉",
      tierClass: "tier-bronze",
      icon: "🎯",
      name: "Vào guồng",
      description: "Trả lời đúng 50 câu",
      value: Math.min(correctCount, 50),
      target: 50,
    },
    {
      id: "correct-100",
      tier: "Bạc",
      tierIcon: "🥈",
      tierClass: "tier-silver",
      icon: "✅",
      name: "Trăm câu đúng",
      description: "Trả lời đúng 100 câu",
      value: Math.min(correctCount, 100),
      target: 100,
    },
    {
      id: "correct-250",
      tier: "Bạc+",
      tierIcon: "🥈",
      tierClass: "tier-silver",
      icon: "🚀",
      name: "Bứt phá",
      description: "Trả lời đúng 250 câu",
      value: Math.min(correctCount, 250),
      target: 250,
    },
    {
      id: "correct-500",
      tier: "Vàng",
      tierIcon: "🥇",
      tierClass: "tier-gold",
      icon: "💫",
      name: "Năm trăm",
      description: "Trả lời đúng 500 câu",
      value: Math.min(correctCount, 500),
      target: 500,
    },
    {
      id: "correct-1000",
      tier: "Bạch kim",
      tierIcon: "💠",
      tierClass: "tier-platinum",
      icon: "🎓",
      name: "Nghìn câu",
      description: "Trả lời đúng 1.000 câu",
      value: Math.min(correctCount, 1_000),
      target: 1_000,
    },
    {
      id: "correct-2500",
      tier: "Kim cương",
      tierIcon: "💎",
      tierClass: "tier-diamond",
      icon: "🔮",
      name: "Đại cao thủ",
      description: "Trả lời đúng 2.500 câu",
      value: Math.min(correctCount, 2_500),
      target: 2_500,
    },
    {
      id: "correct-5000",
      tier: "Huyền thoại VIP",
      tierIcon: "👑",
      tierClass: "tier-vip",
      icon: "🪐",
      name: "Bậc thầy tri thức",
      description: "Trả lời đúng 5.000 câu",
      value: Math.min(correctCount, 5_000),
      target: 5_000,
    },

    // --- Kỹ năng & Tốc độ ---
    {
      id: "sharp",
      tier: "Vàng",
      tierIcon: "🥇",
      tierClass: "tier-gold",
      icon: "🎯",
      name: "Thiện xạ",
      description: "Chính xác từ 85% với ít nhất 100 câu",
      value: total >= 100 && accuracy >= 85 ? 1 : 0,
      target: 1,
    },
    {
      id: "sharp-vip",
      tier: "Huyền thoại VIP",
      tierIcon: "👑",
      tierClass: "tier-vip",
      icon: "🔱",
      name: "Thần tiễn bất bại",
      description: "Chính xác từ 95% với ít nhất 300 câu",
      value: total >= 300 && accuracy >= 95 ? 1 : 0,
      target: 1,
    },
    {
      id: "all-types",
      tier: "Bạc",
      tierIcon: "🥈",
      tierClass: "tier-silver",
      icon: "🧩",
      name: "Toàn năng",
      description: "Làm đủ cả 8 dạng bài",
      value: Math.min(typesDone.size, 8),
      target: 8,
    },
    {
      id: "marathon",
      tier: "Bạc",
      tierIcon: "🥈",
      tierClass: "tier-silver",
      icon: "💪",
      name: "Chạy bền",
      description: "50 câu trong một ngày",
      value: Math.min(busiestDay, 50),
      target: 50,
    },
    {
      id: "marathon-gold",
      tier: "Vàng",
      tierIcon: "🥇",
      tierClass: "tier-gold",
      icon: "🏃‍♂️",
      name: "Siêu marathon",
      description: "100 câu trong một ngày",
      value: Math.min(busiestDay, 100),
      target: 100,
    },
    {
      id: "long-memory",
      tier: "Bạc",
      tierIcon: "🥈",
      tierClass: "tier-silver",
      icon: "🧠",
      name: "Nhớ dai",
      description: "10 nghĩa từ đạt lịch ôn từ 3 tuần",
      value: Math.min(matureReviews, 10),
      target: 10,
    },
    {
      id: "long-memory-vip",
      tier: "Kim cương",
      tierIcon: "💎",
      tierClass: "tier-diamond",
      icon: "🌌",
      name: "Trí nhớ siêu phàm",
      description: "30 nghĩa từ đạt lịch ôn từ 3 tuần",
      value: Math.min(matureReviews, 30),
      target: 30,
    },
    {
      id: "night-owl",
      tier: "Đồng",
      tierIcon: "🥉",
      tierClass: "tier-bronze",
      icon: "🦉",
      name: "Cú đêm",
      description: "Học sau 23 giờ",
      value: nightOwl ? 1 : 0,
      target: 1,
    },
    {
      id: "early-bird",
      tier: "Đồng",
      tierIcon: "🥉",
      tierClass: "tier-bronze",
      icon: "🌅",
      name: "Dậy sớm",
      description: "Học trước 8 giờ sáng",
      value: earlyBird ? 1 : 0,
      target: 1,
    },
  ];

  return definitions.map((definition) => ({
    ...definition,
    unlocked: definition.value >= definition.target,
  }));
}

function escapeCsvCell(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export function questionsToCsv(questions) {
  const lines = [CSV_HEADERS.join(",")];
  questions.forEach((question) => {
    const options =
      question.type === "matching"
        ? question.options
            .map((pair) => `${pair.left}=>${pair.right}`)
            .join("||")
        : (question.options ?? []).join("||");
    const answer =
      question.type === "matching"
        ? ""
        : (Array.isArray(question.answer)
            ? question.answer
            : [question.answer]
          ).join("||");
    const row = {
      subject: question.subject ?? "english",
      grade: question.grade || "",
      id: question.originalId || question.id,
      domain: question.domain,
      type: question.type,
      level: question.level ?? "",
      topic: question.topic ?? "",
      subtopic: question.subtopic ?? "",
      prompt: question.prompt ?? "",
      context: question.context ?? "",
      options,
      answer,
      explanation: question.explanation ?? "",
      theory: question.theory ?? "",
      hint: question.hint ?? "",
      tags: (question.tags ?? []).join("||"),
      difficulty: question.difficulty ?? 2,
      learning_key: question.learningKey ?? "",
    };
    lines.push(
      CSV_HEADERS.map((header) => escapeCsvCell(row[header])).join(","),
    );
  });
  return `﻿${lines.join("\r\n")}\r\n`;
}

export function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.round(ms / 1_000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds} giây`;
  return `${minutes} phút ${String(seconds).padStart(2, "0")} giây`;
}

export function formatRelativeTime(targetTs, now = Date.now()) {
  const diff = targetTs - now;
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "ngay bây giờ";
  if (minutes < 60) return `${minutes} phút nữa`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} giờ nữa`;
  const days = Math.round(hours / 24);
  return `${days} ngày nữa`;
}

export function collectVocabularyKeys(questions) {
  return [
    ...new Set(
      questions
        .filter(
          (question) =>
            question.active !== false && question.domain === "vocabulary",
        )
        .map(learningKeyFor),
    ),
  ];
}

export function searchQuestions(questions, query) {
  if (!Array.isArray(questions) || typeof query !== "string") return [];
  const term = query.trim().toLocaleLowerCase("vi");
  if (!term) return [];
  return questions.filter((q) => {
    if (!q || q.active === false) return false;
    if (q.prompt && String(q.prompt).toLocaleLowerCase("vi").includes(term)) return true;
    if (q.context && String(q.context).toLocaleLowerCase("vi").includes(term)) return true;
    if (q.topic && String(q.topic).toLocaleLowerCase("vi").includes(term)) return true;
    if (q.subtopic && String(q.subtopic).toLocaleLowerCase("vi").includes(term)) return true;
    const ans = displayAnswer(q.answer);
    if (ans && String(ans).toLocaleLowerCase("vi").includes(term)) return true;
    return false;
  });
}

function escapeSpreadsheetCell(value) {
  const str = String(value ?? "");
  const sanitized = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  if (/[",\n\r]/.test(sanitized)) {
    return `"${sanitized.replaceAll('"', '""')}"`;
  }
  return sanitized;
}

export function generateReportMarkdown({ questions = [], attempts = [], imports = [], now = Date.now() }) {
  const dateStr = new Intl.DateTimeFormat("vi-VN", {
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"
  }).format(now);

  const totalQuestions = questions.length;
  const totalSets = imports.length;
  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter((a) => a.correct).length;
  const incorrectAttempts = totalAttempts - correctAttempts;
  const accuracy = totalAttempts > 0 ? Math.round((correctAttempts * 100) / totalAttempts) : 0;

  const attemptedQIds = new Set(attempts.map((a) => a.questionId));
  const distinctDone = questions.filter((q) => attemptedQIds.has(q.id)).length;

  const streaks = computeStreaks(attempts, now);
  const xp = xpFromAttempts(attempts);

  const topicsMap = new Map();
  for (const q of questions) {
    const subj = q.subject || "english";
    const subjName = SUBJECTS[subj]?.name || subj;
    const key = `${subj}:${q.topic || "Khác"}`;
    if (!topicsMap.has(key)) {
      topicsMap.set(key, { subjectName: subjName, topic: q.topic || "Khác", total: 0, done: 0, attempts: 0, correct: 0 });
    }
    const item = topicsMap.get(key);
    item.total += 1;
    if (attemptedQIds.has(q.id)) item.done += 1;
  }

  const byQ = new Map(questions.map((q) => [q.id, q]));
  for (const a of attempts) {
    const q = byQ.get(a.questionId);
    if (!q) continue;
    const subj = q.subject || "english";
    const key = `${subj}:${q.topic || "Khác"}`;
    const item = topicsMap.get(key);
    if (item) {
      item.attempts += 1;
      if (a.correct) item.correct += 1;
    }
  }

  const mistakes = mistakeQuestions(questions, attempts);
  const setMap = new Map(imports.map((s) => [s.id, s.name]));

  let md = `# Báo cáo kết quả học tập NẮM\n\n`;
  md += `- **Ngày xuất:** ${dateStr}\n`;
  md += `- **Nguồn dữ liệu:** Lưu trữ cục bộ trên thiết bị này\n\n`;

  md += `## 1. Tổng quan học tập\n\n`;
  md += `- **Số bộ bài:** ${totalSets}\n`;
  md += `- **Tổng số câu hỏi trong kho:** ${totalQuestions}\n`;
  md += `- **Số câu duy nhất đã làm:** ${distinctDone}/${totalQuestions}\n`;
  md += `- **Tổng số lần trả lời (attempts):** ${totalAttempts}\n`;
  md += `- **Lần làm đúng:** ${correctAttempts}\n`;
  md += `- **Lần làm chưa đúng:** ${incorrectAttempts}\n`;
  md += `- **Độ chính xác trung bình:** ${accuracy}%\n`;
  md += `- **Chuỗi ngày học liên tục:** ${streaks.current} ngày (dài nhất: ${streaks.longest} ngày)\n`;
  md += `- **Điểm kinh nghiệm (XP):** ${xp} XP\n\n`;

  md += `## 2. Thống kê theo môn & chủ điểm\n\n`;
  if (!topicsMap.size) {
    md += `*Chưa có dữ liệu chủ điểm.*\n\n`;
  } else {
    md += `| Môn học | Chủ điểm | Tổng số câu | Đã làm | Lần trả lời | Số lần đúng | Độ chính xác |\n`;
    md += `| :--- | :--- | :---: | :---: | :---: | :---: | :---: |\n`;
    for (const item of topicsMap.values()) {
      const acc = item.attempts > 0 ? `${Math.round((item.correct * 100) / item.attempts)}%` : "Chưa làm";
      md += `| ${item.subjectName} | ${item.topic} | ${item.total} | ${item.done} | ${item.attempts} | ${item.correct} | ${acc} |\n`;
    }
    md += `\n`;
  }

  md += `## 3. Danh sách câu sai gần nhất (${mistakes.length} câu)\n\n`;
  if (!mistakes.length) {
    md += `*Tuyệt vời! Không có câu nào đang bị sai gần nhất.*\n`;
  } else {
    mistakes.forEach((q, i) => {
      const sName = setMap.get(q.setId) || "Bộ bài";
      const subj = SUBJECTS[q.subject]?.name || q.subject || "";
      md += `### ${i + 1}. [${subj} · ${sName}] ${q.prompt}\n\n`;
      if (q.context) md += `*Ngữ cảnh:* ${q.context}\n\n`;
      md += `- **Đáp án đúng:** ${displayAnswer(q.answer)}\n`;
      if (q.explanation) md += `- **Giải thích:** ${q.explanation}\n`;
      md += `\n`;
    });
  }

  return md;
}

export function generateReportCsv({ questions = [], attempts = [], imports = [], now = Date.now() }) {
  const dateStr = new Intl.DateTimeFormat("vi-VN", {
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit"
  }).format(now);

  const attemptedQIds = new Set(attempts.map((a) => a.questionId));
  const distinctDone = questions.filter((q) => attemptedQIds.has(q.id)).length;
  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter((a) => a.correct).length;
  const accuracy = totalAttempts > 0 ? Math.round((correctAttempts * 100) / totalAttempts) : 0;
  const streaks = computeStreaks(attempts, now);
  const xp = xpFromAttempts(attempts);

  const topicsMap = new Map();
  for (const q of questions) {
    const subj = q.subject || "english";
    const subjName = SUBJECTS[subj]?.name || subj;
    const key = `${subj}:${q.topic || "Khác"}`;
    if (!topicsMap.has(key)) {
      topicsMap.set(key, { subjectName: subjName, topic: q.topic || "Khác", total: 0, done: 0, attempts: 0, correct: 0 });
    }
    const item = topicsMap.get(key);
    item.total += 1;
    if (attemptedQIds.has(q.id)) item.done += 1;
  }

  const byQ = new Map(questions.map((q) => [q.id, q]));
  for (const a of attempts) {
    const q = byQ.get(a.questionId);
    if (!q) continue;
    const subj = q.subject || "english";
    const key = `${subj}:${q.topic || "Khác"}`;
    const item = topicsMap.get(key);
    if (item) {
      item.attempts += 1;
      if (a.correct) item.correct += 1;
    }
  }

  const mistakes = mistakeQuestions(questions, attempts);
  const setMap = new Map(imports.map((s) => [s.id, s.name]));

  const lines = [];
  lines.push([escapeSpreadsheetCell("BÁO CÁO HỌC TẬP NẮM"), escapeSpreadsheetCell(`Ngày xuất: ${dateStr}`)].join(","));
  lines.push([escapeSpreadsheetCell("Lưu ý: Dữ liệu được lưu trữ cục bộ trên thiết bị này")].join(","));
  lines.push("");

  lines.push([escapeSpreadsheetCell("TỔNG QUAN")].join(","));
  lines.push([escapeSpreadsheetCell("Chỉ số"), escapeSpreadsheetCell("Giá trị")].join(","));
  lines.push([escapeSpreadsheetCell("Số bộ bài"), escapeSpreadsheetCell(imports.length)].join(","));
  lines.push([escapeSpreadsheetCell("Tổng số câu hỏi trong kho"), escapeSpreadsheetCell(questions.length)].join(","));
  lines.push([escapeSpreadsheetCell("Số câu duy nhất đã làm"), escapeSpreadsheetCell(distinctDone)].join(","));
  lines.push([escapeSpreadsheetCell("Tổng số lần trả lời (attempts)"), escapeSpreadsheetCell(totalAttempts)].join(","));
  lines.push([escapeSpreadsheetCell("Số lần trả lời đúng"), escapeSpreadsheetCell(correctAttempts)].join(","));
  lines.push([escapeSpreadsheetCell("Độ chính xác trung bình"), escapeSpreadsheetCell(`${accuracy}%`)].join(","));
  lines.push([escapeSpreadsheetCell("Chuỗi ngày học liên tục"), escapeSpreadsheetCell(`${streaks.current} ngày`)].join(","));
  lines.push([escapeSpreadsheetCell("Điểm kinh nghiệm (XP)"), escapeSpreadsheetCell(xp)].join(","));
  lines.push("");

  lines.push([escapeSpreadsheetCell("KẾT QUẢ THEO MÔN & CHỦ ĐIỂM")].join(","));
  lines.push([
    escapeSpreadsheetCell("Môn học"),
    escapeSpreadsheetCell("Chủ điểm"),
    escapeSpreadsheetCell("Tổng số câu"),
    escapeSpreadsheetCell("Số câu đã làm"),
    escapeSpreadsheetCell("Tổng lần trả lời"),
    escapeSpreadsheetCell("Số lần đúng"),
    escapeSpreadsheetCell("Độ chính xác"),
  ].join(","));

  for (const item of topicsMap.values()) {
    const acc = item.attempts > 0 ? `${Math.round((item.correct * 100) / item.attempts)}%` : "0%";
    lines.push([
      escapeSpreadsheetCell(item.subjectName),
      escapeSpreadsheetCell(item.topic),
      escapeSpreadsheetCell(item.total),
      escapeSpreadsheetCell(item.done),
      escapeSpreadsheetCell(item.attempts),
      escapeSpreadsheetCell(item.correct),
      escapeSpreadsheetCell(acc),
    ].join(","));
  }
  lines.push("");

  lines.push([escapeSpreadsheetCell(`DANH SÁCH CÂU SAI GẦN NHẤT (${mistakes.length} CÂU)`)].join(","));
  lines.push([
    escapeSpreadsheetCell("STT"),
    escapeSpreadsheetCell("Môn học"),
    escapeSpreadsheetCell("Bộ bài"),
    escapeSpreadsheetCell("Chủ điểm"),
    escapeSpreadsheetCell("Câu hỏi"),
    escapeSpreadsheetCell("Đáp án đúng"),
    escapeSpreadsheetCell("Giải thích"),
  ].join(","));

  mistakes.forEach((q, i) => {
    const sName = setMap.get(q.setId) || "Bộ bài";
    const subj = SUBJECTS[q.subject]?.name || q.subject || "";
    lines.push([
      escapeSpreadsheetCell(i + 1),
      escapeSpreadsheetCell(subj),
      escapeSpreadsheetCell(sName),
      escapeSpreadsheetCell(q.topic || ""),
      escapeSpreadsheetCell(q.prompt || ""),
      escapeSpreadsheetCell(displayAnswer(q.answer)),
      escapeSpreadsheetCell(q.explanation || ""),
    ].join(","));
  });

  return "\uFEFF" + lines.join("\r\n");
}
