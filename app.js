import { buildCsvPreview, buildStats, displayAnswer, stableShuffle, TYPE_LABELS, learningKeyFor, normalizeText, SUBJECTS } from "./core.js";
import { createRepository, readDashboard, exportBackup, validateBackup } from "./storage.js";
import { questionsToCsv } from "./stats.js";
import { speakEnglish, speechAvailable, stopSpeaking } from "./speech.js";

const root = document.querySelector("#app");
const modal = document.querySelector("#modal");
const notice = document.querySelector("#notice");
const state = { view: "home", data: null, busy: false, subject: "all", grade: "all", level: "all", topic: "all", search: "", draft: null, draftKey: "", flipped: false };
let repository, csvPreview, pendingBackup, modalAction, loadToken = 0, noticeTimer, draftTimer, syncTimer;
const html = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const number = (value) => Number(value || 0).toLocaleString("vi-VN");
const day = (value) => new Intl.DateTimeFormat("vi-VN", { day: "numeric", month: "numeric", year: "numeric" }).format(value);
const icons = {
  book: '<path d="M3 5c4-1 6-1 9 1 3-2 5-2 9-1v14c-4-1-6-1-9 1-3-2-5-2-9-1z"/><path d="M12 6v14"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  back: '<path d="M19 12H5m6-6-6 6 6 6"/>',
  upload: '<path d="M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6"/>',
  download: '<path d="M12 3v13m-5-5 5 5 5-5M4 17v4h16v-4"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  file: '<path d="M14 2H5v20h14V7zM14 2v5h5M8 12h8M8 16h5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  sound: '<path d="m11 5-5 4H3v6h3l5 4zM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/>',
  search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
  more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
};
const icon = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.book}</svg>`;
const button = (label, action, css = "button", attrs = "") => `<button type="button" class="${css}" data-action="${action}" ${attrs} ${state.busy ? "disabled" : ""}>${label}</button>`;
const currentSession = () => state.data?.snapshot.session;
const currentQuestion = () => state.data?.snapshot.questions.find((q) => q.id === currentSession()?.queue[0]);
const selectedSet = () => state.data?.sets.find((set) => set.id === state.data.selectedSetId);
const isVocabulary = (mode) => ["vocabulary", "flashcards"].includes(mode);
const subjectName = (subject) => SUBJECTS[subject]?.name || "Tiếng Anh";

function toast(message, error = false) {
  clearTimeout(noticeTimer);
  notice.textContent = message;
  notice.className = `notice visible${error ? " error" : ""}`;
  noticeTimer = setTimeout(() => { notice.className = "notice"; }, error ? 8500 : 5000);
}

function syncDraft() {
  const session = currentSession();
  const key = session ? `${session.id}:${session.step}:${Boolean(session.result)}` : "";
  if (key !== state.draftKey) {
    state.draftKey = key;
    const saved = session?.result?.draft || session?.draft;
    state.draft = {
      text: typeof saved?.text === "string" ? saved.text : "",
      selected: Array.isArray(saved?.selected) ? saved.selected.filter(Number.isInteger) : [],
      ordered: Array.isArray(saved?.ordered) ? saved.ordered.filter(Number.isInteger) : [],
      matches: saved?.matches && typeof saved.matches === "object" ? saved.matches : {},
    };
    state.flipped = false;
  }
}

async function refresh() {
  const previousSet = state.data?.selectedSetId;
  state.data = await readDashboard(repository);
  if (previousSet !== state.data.selectedSetId) {
    state.level = state.topic = state.grade = "all";
    if (state.subject !== "all") state.subject = selectedSet()?.subject || "all";
  }
  syncDraft();
  render();
}

async function run(work) {
  if (state.busy) return;
  state.busy = true;
  render();
  try { await work(); }
  catch (error) { toast(error.message || "Chưa thực hiện được. Hãy thử lại.", true); }
  finally {
    state.busy = false;
    try { await refresh(); } catch (error) { toast(error.message, true); render(); }
    modal.querySelectorAll("button").forEach((element) => { element.disabled = false; });
  }
}

function saveDraft() {
  clearTimeout(draftTimer);
  const s = currentSession();
  if (!s || s.result) return;
  const draft = structuredClone(state.draft);
  draftTimer = setTimeout(() => {
    repository.saveDraft(s.id, s.step, draft).catch((error) => toast(error.message, true));
  }, 200);
}

function download(filename, content, mime = "application/json") {
  const url = URL.createObjectURL(new Blob([content], { type: `${mime};charset=utf-8` }));
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function summaryForSet(setId, filters = null) {
  const w = state.data.snapshot;
  const questions = w.questions.filter((q) => q.setId === setId &&
    (!filters || !filters.grade || filters.grade === "all" || q.grade === filters.grade) &&
    (!filters || !filters.level || filters.level === "all" || q.level === filters.level) &&
    (!filters || !filters.topic || filters.topic === "all" || q.topic === filters.topic));
  const ids = new Set(questions.map((q) => q.id));
  const stats = buildStats(questions, w.reviews, w.attempts.filter((a) => ids.has(a.questionId)), []);
  const words = new Set(questions.filter((q) => q.domain === "vocabulary").map(learningKeyFor)).size;
  const total = stats.grammar + stats.practice + words;
  const done = total - stats.grammarRemaining - stats.practiceRemaining - stats.vocabularyRemaining;
  return { ...stats, total, done, words, progress: total ? Math.round(done * 100 / total) : 0 };
}

function filteredStats() {
  const questions = state.data.questions.filter((q) => (state.grade === "all" || q.grade === state.grade) && (state.level === "all" || q.level === state.level) && (state.topic === "all" || q.topic === state.topic));
  const ids = new Set(questions.map((q) => q.id));
  return buildStats(questions, state.data.snapshot.reviews, state.data.attempts.filter((a) => ids.has(a.questionId)), []);
}

function header() {
  const studying = state.view === "study";
  return `<header class="header"><div class="header-inner">
    <a class="brand" href="#" data-action="home" aria-label="NẮM — Trang học"><span class="brand-symbol">${icon("book")}</span><span>NẮM<span class="brand-sub">HỌC TẬP</span></span></a>
    ${studying ? `<span class="header-note">Tập trung vào một câu mỗi lần.</span>` : `<nav aria-label="Điều hướng chính">${[["home", "Luyện tập"], ["library", "Bộ bài"], ["data", "Dữ liệu"]].map(([view, label]) => button(label, view, `nav-link${state.view === view ? " active" : ""}`, `aria-current="${state.view === view ? "page" : "false"}"`)).join("")}</nav>`}
    ${studying ? button("Lưu và thoát", "pause", "button subtle") : button(`${icon("plus")}<span>Thêm bộ CSV</span>`, "import", "button primary header-import")}
  </div></header>`;
}

function intro(title, description, tag = "KHÔNG GIAN HỌC TẬP") {
  return `<div class="page-heading"><div><span class="eyebrow">${tag}</span><h1>${title}</h1><p>${description}</p></div><span class="date-note">${icon("clock")}${day(Date.now())}</span></div>`;
}

function emptyMarkup() {
  return `${intro("Học một chút.<br><em>Nhớ thêm một ít.</em>", "Thêm bộ bài của bạn. Chọn một lượt học. Bắt đầu ngay.")}
    <div class="onboard-grid"><section class="empty-card drop-zone" data-drop-zone>
      <div class="file-illustration" aria-hidden="true"><div class="paper-line"></div>${icon("file")}<span>CSV</span></div>
      <span class="eyebrow">BẮT ĐẦU TỪ ĐÂY</span><h2>Bộ bài đầu tiên của bạn.</h2>
      <p>Kéo file CSV vào đây hoặc chọn file từ máy.</p>
      ${button(`${icon("plus")} Thêm bộ bài`, "import", "button primary large")}
      <small>CSV UTF-8 · Tối đa 2.000 câu / file</small>
    </section><aside class="quick-start"><span class="eyebrow">BA BƯỚC NHỎ</span><h2>Từ file đến<br>buổi học.</h2>
      <ol class="steps"><li><span>01</span><div><strong>Tạo bộ câu hỏi</strong><p>Gửi hướng dẫn bên dưới cho AI bạn dùng.</p></div></li><li><span>02</span><div><strong>Thêm file CSV</strong><p>Website kiểm tra và tách thành một bộ riêng.</p></div></li><li><span>03</span><div><strong>Học theo nhịp của bạn</strong><p>Mỗi lượt tối đa 30 câu, tiến độ tự lưu.</p></div></li></ol>
      <a class="guide-link" href="./QUESTION_CSV_GUIDE.md" download>${icon("download")} Hướng dẫn tạo CSV cho AI</a>
    </aside></div>
    <div class="principles"><span><i class="dot green"></i>Tiếng Anh · Hóa · Lí · Sinh</span><span><i class="dot rust"></i>Từ vựng có lịch ôn riêng</span><span><i class="dot gray"></i>Tiến độ lưu trên thiết bị</span></div>`;
}

function resumeBanner() {
  const session = currentSession();
  if (!session) return "";
  const set = state.data.sets.find((item) => item.id === session.setId);
  return `<div class="resume-banner"><span class="resume-icon">${icon("clock")}</span><div><strong>Bạn còn một lượt đang học</strong><p>${html(set?.name)} · Đã xong ${session.done}/${session.target} câu</p></div>${button("Tiếp tục học", "resume", "button primary")}${button(icon("close"), "end", "icon-button", 'aria-label="Kết thúc lượt đang học"')}</div>`;
}

function homeMarkup() {
  const availableSets = state.data.sets.filter((set) => state.subject === "all" || set.subject === state.subject);
  if (!availableSets.length) return resumeBanner() + emptyMarkup();
  const set = selectedSet(), stats = filteredStats(), full = summaryForSet(set.id);
  const english = set.subject === "english";
  const subjects = [...new Set(state.data.sets.map((item) => item.subject))].sort();
  const levels = [...new Set(state.data.questions.map((q) => q.level))].sort();
  const grades = [...new Set(state.data.questions.map((q) => q.grade).filter(Boolean))].sort();
  const topics = [...new Set(state.data.questions.filter((q) => (state.level === "all" || q.level === state.level) && (state.grade === "all" || q.grade === state.grade)).map((q) => q.topic))].sort();
  const modeCard = (mode, title, description, total, label, style, index) => `<article class="mode-card ${style}"><div class="mode-top"><span class="mode-index">${index}</span><span class="pill">${mode === "grammar" ? "Ngữ pháp" : mode === "practice" ? subjectName(set.subject) : "Từ vựng"}</span></div><h2>${title}</h2><p>${description}</p><div class="mode-count"><strong>${number(total)}</strong><span>${label}</span></div>
    ${button(`${total ? `Bắt đầu ${Math.min(30, total)} ${isVocabulary(mode) ? "từ" : "câu"}` : (isVocabulary(mode) ? "Chưa có từ cần học" : "Đã hoàn thành")} ${icon("arrow")}`, "begin", "button mode-start", `data-mode="${mode}" ${!total || currentSession() ? "disabled" : ""}`)}
    ${mode === "vocabulary" ? button("Học bằng thẻ ghi nhớ", "begin", "text-button", `data-mode="flashcards" ${!total || currentSession() ? "disabled" : ""}`) : `<span class="mode-footnote">Câu đã làm sẽ không lặp lại.</span>`}</article>`;
  return `${intro("Hôm nay, học bộ nào?", "Một lượt ngắn, thêm một bước tiến.")}${resumeBanner()}
    <section class="set-focus"><div class="set-focus-head"><label for="set-picker" class="eyebrow">BỘ ĐANG CHỌN</label><span>${full.done}/${full.total} mục đã học</span></div>
      <select id="set-picker" data-filter="set" aria-label="Chọn bộ bài">${availableSets.map((item) => `<option value="${html(item.id)}" ${item.id === set.id ? "selected" : ""}>${subjectName(item.subject)} · ${html(item.name)}</option>`).join("")}</select>
      <div class="progress-track" role="progressbar" aria-valuenow="${full.progress}" aria-valuemin="0" aria-valuemax="100" aria-label="Tiến độ bộ bài"><span style="width:${full.progress}%"></span></div>
      <div class="filter-row">${subjects.length > 1 ? `<label>Môn<select data-filter="subject">${option("all", "Tất cả môn", state.subject)}${subjects.map((subject) => option(subject, subjectName(subject), state.subject)).join("")}</select></label>` : ""}${english ? `<label>Trình độ<select data-filter="level">${option("all", "Tất cả trình độ", state.level)}${levels.map((level) => option(level, level, state.level)).join("")}</select></label>` : ""}${grades.length ? `<label>Lớp<select data-filter="grade">${option("all", "Tất cả lớp", state.grade)}${grades.map((grade) => option(grade, `Lớp ${grade}`, state.grade)).join("")}</select></label>` : ""}<label>Chủ điểm<select data-filter="topic">${option("all", "Tất cả chủ điểm", state.topic)}${topics.map((topic) => option(topic, topic, state.topic)).join("")}</select></label><span class="filter-note">Tối đa 30 câu mỗi lượt</span></div>
    </section><div class="mode-grid">${english ? modeCard("grammar", "Grammar", "Luyện cấu trúc câu, hiểu cách dùng.", stats.grammarRemaining, "câu chưa làm", "grammar", "01") + modeCard("vocabulary", "Vocabulary", "Ôn lại đúng lúc để nhớ lâu hơn.", stats.due, stats.vocabularyRemaining ? "từ mới cần học" : "từ đến hạn ôn", "vocabulary", "02") : modeCard("practice", subjectName(set.subject), "Có lý thuyết và giải thích sau mỗi câu.", stats.practiceRemaining, "câu chưa làm", "practice", "01")}</div>
    <div class="home-foot"><span>${icon("check")} Tiến độ được lưu tự động trên máy này.</span><a href="./QUESTION_CSV_GUIDE.md" download>Hướng dẫn tạo bộ bài ${icon("arrow")}</a></div>`;
}
function option(value, label, selected) { return `<option value="${html(value)}" ${value === selected ? "selected" : ""}>${html(label)}</option>`; }

function setCard(set) {
  const summary = summaryForSet(set.id);
  return `<article class="set-card"><div class="set-card-top"><span class="set-icon">${icon("book")}</span><details class="set-menu"><summary aria-label="Quản lý bộ ${html(set.name)}">${icon("more")}</summary><div>${button("Đổi tên", "rename", "menu-button", `data-id="${html(set.id)}"`)}${button("Tải CSV", "export-set", "menu-button", `data-id="${html(set.id)}"`)}${button("Xóa bộ này", "delete-set", "menu-button danger-text", `data-id="${html(set.id)}"`)}</div></details></div>
    <h2>${html(set.name)}</h2><p class="set-meta">${number(set.count)} câu · ${day(set.importedAt)}</p><div class="set-labels">${summary.practice ? `<span class="pill">${subjectName(set.subject)} · ${summary.practice}</span>` : ""}${summary.grammar ? `<span class="pill">Grammar · ${summary.grammar}</span>` : ""}${summary.words ? `<span class="pill rust">Vocab · ${summary.words} từ</span>` : ""}</div>
    <div class="set-progress"><span>${summary.done}/${summary.total} mục đã học</span><strong>${summary.progress}%</strong></div><div class="progress-track"><span style="width:${summary.progress}%"></span></div>
    ${button(`Chọn bộ này ${icon("arrow")}`, "choose", "button subtle card-link", `data-id="${html(set.id)}"`)}</article>`;
}

function libraryMarkup() {
  const sets = state.data.sets.filter((set) => set.name.toLocaleLowerCase("vi").includes(state.search.toLocaleLowerCase("vi")));
  return `${intro("Bộ bài của bạn.", "Mỗi file CSV là một bộ riêng. Chọn bộ bạn muốn học.", "THƯ VIỆN CÁ NHÂN")}
    <div class="library-tools"><span>${state.data.sets.length} bộ bài</span><label class="search-box">${icon("search")}<input type="search" data-search placeholder="Tìm theo tên bộ..." value="${html(state.search)}" aria-label="Tìm bộ bài"></label></div>
    <div class="library-grid" id="set-list">${sets.map(setCard).join("")}${!sets.length && state.search ? `<p class="search-empty">Chưa tìm thấy bộ nào khớp tên này.</p>` : ""}<button class="add-card" data-action="import">${icon("plus")}<strong>Thêm bộ mới</strong><span>Từ file CSV của bạn</span></button></div>`;
}

function dataMarkup() {
  const snapshot = state.data.snapshot;
  return `${intro("Dữ liệu trong tay bạn.", "Tải bản sao lưu để chuyển tiến độ sang máy khác.", "LƯU TRỮ & SAO LƯU")}
    <section class="data-panel"><div class="data-overview"><span class="set-icon">${icon("book")}</span><div><h2>${snapshot.imports.length} bộ · ${number(snapshot.questions.length)} câu</h2><p>Được lưu trên trình duyệt và thiết bị đang dùng.</p></div><span class="pill">Tự động lưu</span></div>
      <div class="data-row"><div><h3>Sao lưu toàn bộ</h3><p>Gồm câu hỏi, kết quả và lịch ôn từ vựng.</p></div>${button(`${icon("download")} Tải sao lưu`, "backup", "button subtle")}</div>
      <div class="data-row"><div><h3>Khôi phục trên máy này</h3><p>Nhập file JSON đã sao lưu để thay kho hiện tại.</p></div>${button("Chọn bản sao lưu", "restore", "button subtle")}</div>
      ${snapshot.recovery ? `<div class="data-row"><div><h3>Bản trước khi dọn kho</h3><p>Lưu ngày ${day(snapshot.recovery.savedAt)}. Tải về nếu cần lấy lại nội dung cũ.</p></div>${button("Tải bản cũ", "recovery", "button subtle")}</div>` : ""}
      <div class="data-row"><div><h3>Làm trống kho bài</h3><p>Xóa các bộ bài và tiến độ hiện tại trên máy này.</p></div>${button("Xóa nội dung", "clear", "button danger-outline", !snapshot.questions.length ? "disabled" : "")}</div>
    </section><aside class="data-help"><h2>Dùng cùng học sinh</h2><p>Gửi <a href="https://dangkhue1301.github.io/nam-english/">đường dẫn website</a> và file CSV cho học sinh. Mỗi bạn nhập file trên máy của mình, rồi chọn bộ để học. Tiến độ và bộ bài không tự đồng bộ giữa các máy.</p><a class="guide-link" href="./QUESTION_CSV_GUIDE.md" download>${icon("download")} Hướng dẫn tạo CSV cho AI</a></aside>`;
}

function answerMarkup(q, result) {
  const d = state.draft;
  const disabled = result || state.busy ? "disabled" : "";
  if (["mcq", "multiple_select"].includes(q.type)) {
    return `<fieldset class="choices"><legend class="sr-only">${q.type === "mcq" ? "Chọn một đáp án" : "Chọn tất cả đáp án đúng"}</legend>${q.options.map((value, index) => {
      const selected = d.selected.includes(index);
      const settings = { caseSensitive: q.tags?.includes("case-sensitive") };
      const right = result && q.answer.some((answer) => normalizeText(answer, settings) === normalizeText(value, settings));
      return `<button type="button" data-action="option" data-index="${index}" class="choice${selected ? " selected" : ""}${right ? " correct" : result && selected ? " incorrect" : ""}" aria-pressed="${selected}" ${disabled}><span class="choice-letter">${String.fromCharCode(65 + index)}</span><span>${html(value)}</span>${right ? icon("check") : ""}</button>`;
    }).join("")}</fieldset>`;
  }
  if (q.type === "matching") {
    const rights = stableShuffle(q.options.map((pair) => pair.right), q.id);
    return `<fieldset class="matching"><legend class="sr-only">Ghép từng mục với đáp án tương ứng</legend>${q.options.map((pair, index) => `<label><span>${html(pair.left)}</span><select data-match="${index}" ${disabled}>${option("", "Chọn phần phù hợp", d.matches[index] ?? "")}${rights.map((right, ri) => option(String(ri), right, d.matches[index] ?? "")).join("")}</select></label>`).join("")}</fieldset>`;
  }
  if (q.type === "ordering") {
    const order = stableShuffle(q.options.map((_, index) => index), q.id);
    return `<div><label class="answer-label">Sắp xếp thành câu hoàn chỉnh</label><div class="sentence-builder" aria-label="Câu đang sắp xếp">${d.ordered.length ? d.ordered.map((index) => button(`${html(q.options[index])}<span aria-hidden="true">×</span>`, "remove-token", "token selected", `data-index="${index}" ${disabled} aria-label="Bỏ ${html(q.options[index])}"`)).join("") : '<span class="muted">Chạm các từ bên dưới để xếp câu...</span>'}</div><div class="token-bank">${order.filter((index) => !d.ordered.includes(index)).map((index) => button(html(q.options[index]), "add-token", "token", `data-index="${index}" ${disabled}`)).join("")}</div></div>`;
  }
  const placeholder = q.subject === "english" ? "Nhập câu trả lời bằng tiếng Anh..." : "Nhập câu trả lời đúng theo đáp án đã cho...";
  return `<label class="answer-label" for="answer-text">${["error_correction", "sentence_transformation"].includes(q.type) ? "Viết câu hoàn chỉnh" : "Câu trả lời của bạn"}</label><textarea id="answer-text" data-answer rows="3" placeholder="${placeholder}" spellcheck="false" autocomplete="off" maxlength="10000" ${disabled}>${html(d.text)}</textarea>`;
}

function receivedAnswer(q) {
  const d = state.draft;
  if (q.type === "mcq") return q.options[d.selected[0]] || "";
  if (q.type === "multiple_select") return d.selected.map((index) => q.options[index]);
  if (q.type === "ordering") return d.ordered.map((index) => q.options[index]).join(" ");
  if (q.type === "matching") {
    const rights = stableShuffle(q.options.map((pair) => pair.right), q.id);
    return Object.fromEntries(q.options.map((pair, index) => [pair.left, rights[Number(d.matches[index])]]));
  }
  return d.text.trim();
}
function answerReady() {
  const q = currentQuestion(), d = state.draft;
  if (!q || !d) return false;
  if (q.type === "mcq") return d.selected.length === 1;
  if (q.type === "multiple_select") return d.selected.length > 0;
  if (q.type === "ordering") return d.ordered.length === q.options.length;
  if (q.type === "matching") return q.options.every((_, index) => d.matches[index] != null && d.matches[index] !== "");
  return Boolean(d.text.trim());
}
function updateSubmit() { const submit = root.querySelector("[data-submit]"); if (submit) submit.disabled = state.busy || !answerReady(); }

function sessionMarkup() {
  const s = currentSession(), q = currentQuestion();
  if (!s || !q) return homeMarkup();
  const set = state.data.sets.find((item) => item.id === s.setId);
  const result = s.result, isFlash = s.mode === "flashcards";
  const englishQuestion = q.subject === "english";
  const caption = isFlash ? "Thẻ ghi nhớ" : TYPE_LABELS[q.type];
  const percent = Math.round(s.done * 100 / s.target);
  const subjectLabel = s.mode === "grammar" ? "GRAMMAR" : isFlash ? "VOCABULARY" : `${subjectName(q.subject).toLocaleUpperCase("vi")}${q.grade ? ` / LỚP ${q.grade}` : ""}`;
  const levelLabel = englishQuestion && q.level ? `<span> / ${html(q.level)}</span>` : "";
  return `<div class="study-wrap"><div class="study-heading">${button(`${icon("back")} Bộ bài`, "pause", "text-button")}<span>${html(set?.name)}</span><strong>${s.done}/${s.target} <span>đã xong</span></strong></div><div class="progress-track study-progress" role="progressbar" aria-valuenow="${s.done}" aria-valuemin="0" aria-valuemax="${s.target}" aria-label="Tiến độ lượt học"><span style="width:${percent}%"></span></div>
    <div class="study-grid"><section class="question-card"><div class="question-meta"><span class="eyebrow">${subjectLabel}${levelLabel}</span><span class="pill">${html(caption)}</span></div>
      <div class="question-title"><h1>${html(q.prompt)}</h1>${englishQuestion && speechAvailable() ? button(icon("sound"), "speak", "icon-button", 'aria-label="Đọc câu hỏi tiếng Anh"') : ""}</div>
      ${q.context ? `<p class="question-context">${html(q.context)}</p>` : ""}
      ${isFlash ? `<div class="flash-answer ${state.flipped || result ? "revealed" : ""}">${state.flipped || result ? `<span class="eyebrow">ĐÁP ÁN</span><strong>${html(displayAnswer(q.answer))}</strong>` : `<span>Thử nhớ đáp án trước khi lật thẻ.</span>${button("Lật thẻ", "flip", "button subtle")}`}</div>` : `<form data-answer-form>${answerMarkup(q, result)}</form>`}
      ${result ? `<div class="feedback ${result.correct ? "success" : "wrong"}" role="status"><div class="feedback-title">${icon(result.correct ? "check" : "close")}<strong>${result.correct ? "Chính xác!" : "Chưa đúng, cùng xem lại nhé."}</strong></div>${!result.correct ? `<p class="expected"><span>Đáp án đúng</span><strong>${html(result.expected)}</strong></p>` : ""}<p>${html(q.explanation)}</p>${isVocabulary(s.mode) && !result.correct ? '<small>Từ này sẽ xuất hiện lại ở cuối lượt học.</small>' : result.dueAt ? `<small>Hẹn ôn lại: ${day(result.dueAt)}</small>` : ""}</div>` : ""}
      <div class="answer-footer"><span>${result ? "Đã lưu kết quả" : isFlash ? "Tự đánh giá sau khi lật thẻ" : q.type === "multiple_select" ? "Chọn tất cả đáp án đúng" : "Enter để chấm"}</span>${result ? button(`Tiếp theo ${icon("arrow")}`, "next", "button primary large") : isFlash ? `<div class="flash-grades">${button("Chưa nhớ", "grade-forgot", "button subtle", !state.flipped ? "disabled" : "")}${button("Đã nhớ", "grade-remember", "button primary", !state.flipped ? "disabled" : "")}</div>` : button(`Chấm câu này ${icon("check")}`, "submit", "button primary large", `data-submit ${!answerReady() ? "disabled" : ""}`)}</div>
    </section><aside class="study-aside"><span class="eyebrow">CHỦ ĐIỂM</span><h2>${html(q.topic)}</h2>${q.subtopic ? `<p>${html(q.subtopic)}</p>` : ""}${q.theory ? `<details class="theory"><summary>${icon("book")} Nhắc lý thuyết</summary><p>${html(q.theory)}</p></details>` : ""}${q.hint ? `<details class="theory"><summary>Gợi ý nhỏ</summary><p>${html(q.hint)}</p></details>` : ""}<p class="study-tip">Cứ làm theo nhịp của bạn.<br>Tiến độ luôn được lưu lại.</p></aside></div></div>`;
}

function resultMarkup() {
  const result = state.data.snapshot.summary;
  if (!result) return homeMarkup();
  const set = state.data.sets.find((item) => item.id === result.setId);
  const stats = summaryForSet(result.setId, result.filters);
  const vocabularyMode = isVocabulary(result.mode);
  const remaining = result.mode === "grammar" ? stats.grammarRemaining : result.mode === "practice" ? stats.practiceRemaining : stats.due;
  const unit = vocabularyMode ? "từ" : "câu";
  const wrong = result.results.filter((item) => !item.correct);
  return `<section class="result-page"><div class="result-mark">${icon("check")}</div><span class="eyebrow">HOÀN THÀNH LƯỢT HỌC</span><h1>Thêm một bước tiến.</h1><p>${html(set?.name)} · ${result.total} ${unit} đã hoàn thành</p>
    <div class="result-stats"><div><strong>${result.correct}<small>/${result.total}</small></strong><span>đúng lần đầu</span></div><div><strong>${Math.round(result.correct * 100 / result.total)}<small>%</small></strong><span>độ chính xác</span></div><div><strong>${Math.max(1, Math.round(result.durationMs / 60000))}</strong><span>phút tập trung</span></div></div>
    ${result.repeats ? `<p>Bạn đã ôn lại ${result.repeats} lần để nhớ chắc hơn.</p>` : ""}
    <div class="result-actions">${remaining ? button(`Học tiếp ${Math.min(30, remaining)} ${vocabularyMode ? "từ" : "câu"} ${icon("arrow")}`, "next-batch", "button primary large") : `<span class="completed-note">${vocabularyMode ? "Đã xong lượt này. Hẹn bạn khi có từ đến hạn ôn!" : "Đã hoàn thành các câu phù hợp trong bộ này."}</span>`}${button("Về bộ bài", "close-result", "button subtle")}</div>
    ${wrong.length ? `<details class="result-review"><summary>Xem lại ${wrong.length} câu chưa đúng lần đầu</summary>${wrong.map((item) => { const q = state.data.snapshot.questions.find((q) => q.id === item.questionId); return q ? `<article><h3>${html(q.context || q.prompt)}</h3><p class="muted">Bạn trả lời: ${html(typeof item.answer === "object" ? displayAnswer(item.answer) : item.answer)}</p><p><strong>${html(displayAnswer(q.answer))}</strong></p><p>${html(q.explanation)}</p></article>` : ""; }).join("")}</details>` : ""}</section>`;
}

function render() {
  if (!state.data) return;
  const active = root.contains(document.activeElement) ? document.activeElement : null;
  const focus = active ? { id: active.id, action: active.dataset.action, index: active.dataset.index, filter: active.dataset.filter, mode: active.dataset.mode } : null;
  const markup = state.view === "study" ? currentSession() ? sessionMarkup() : resultMarkup()
    : state.view === "library" ? libraryMarkup() : state.view === "data" ? dataMarkup() : homeMarkup();
  root.innerHTML = `${header()}<main id="main" class="main ${state.view === "study" ? "study-main" : ""}" aria-busy="${state.busy}">${markup}</main><footer class="footer"><span>NẮM HỌC TẬP</span><span>Mỗi ngày một chút, nhớ lâu hơn.</span></footer>`;
  if (focus) {
    const replacement = focus.id ? document.getElementById(focus.id) : [...root.querySelectorAll("button, select")].find((el) =>
      (focus.action || focus.filter) && el.dataset.action === focus.action && el.dataset.index === focus.index && el.dataset.filter === focus.filter && el.dataset.mode === focus.mode);
    replacement?.focus({ preventScroll: true });
  }
}

function showModal(content) {
  modal.innerHTML = `<div class="modal-top"><span class="eyebrow">NẮM HỌC TẬP</span><button class="icon-button" data-action="close-modal" aria-label="Đóng">${icon("close")}</button></div>${content}`;
  if (!modal.open) modal.showModal();
}
function closeModal() { loadToken += 1; modal.close(); csvPreview = null; pendingBackup = null; modalAction = null; }
function confirmation(title, text, action, label = "Xác nhận") {
  modalAction = action;
  showModal(`<h2>${title}</h2><p class="modal-description">${text}</p><div class="modal-actions">${button("Quay lại", "close-modal", "button subtle")}${button(label, "confirm", "button primary")}</div>`);
}
function importMarkup(message = "") {
  showModal(`<h2>Thêm một bộ bài.</h2><p class="modal-description">Mỗi file CSV trở thành một bộ riêng để bạn chọn học.</p><label class="upload-area" data-drop-zone>${icon("upload")}<strong>Chọn file hoặc kéo CSV vào đây</strong><span>UTF-8 · Tối đa 5 MB · 2.000 câu</span><input type="file" accept=".csv,text/csv" data-csv aria-label="Chọn file CSV"></label><div id="csv-preview">${message}</div><a class="guide-link" href="./QUESTION_CSV_GUIDE.md" download>${icon("download")} Hướng dẫn tạo CSV cho AI</a>`);
}
async function loadCsv(file) {
  if (state.busy) return;
  const token = ++loadToken;
  importMarkup('<p class="muted" role="status">Đang kiểm tra file...</p>');
  try {
    if (!/\.csv$/i.test(file.name)) throw new Error("Hãy chọn file có đuôi .csv.");
    if (file.size > 5 * 1024 * 1024) throw new Error("File vượt quá 5 MB.");
    const text = await file.text();
    if (token !== loadToken || !modal.open) return;
    csvPreview = buildCsvPreview(text, file.name);
    if (csvPreview.errors.length) {
      document.querySelector("#csv-preview").innerHTML = `<div class="validation error" role="alert"><strong>File chưa đúng định dạng</strong><ul>${csvPreview.errors.map((error) => `<li>${html(error)}</li>`).join("")}</ul><small>Chưa có câu nào được thêm. Sửa file theo hướng dẫn rồi chọn lại.</small></div>`;
      return;
    }
    const subject = csvPreview.rows[0].subject;
    const grammar = csvPreview.rows.filter((q) => q.domain === "grammar").length;
    const vocabulary = csvPreview.rows.filter((q) => q.domain === "vocabulary").length;
    const grades = [...new Set(csvPreview.rows.map((q) => q.grade).filter(Boolean))].sort();
    const detail = subject === "english"
      ? `${grammar} Grammar · ${vocabulary} Vocabulary`
      : `${subjectName(subject)}${grades.length ? ` · Lớp ${grades.join(", ")}` : ""} · Practice`;
    const name = file.name.replace(/\.csv$/i, "").replaceAll("_", " ");
    document.querySelector("#csv-preview").innerHTML = `<div class="validation success"><strong>${icon("check")} ${csvPreview.rows.length} câu hợp lệ</strong><span>${html(detail)}</span></div><label class="field-label" for="set-name">Tên bộ bài<input id="set-name" maxlength="120" value="${html(name)}"></label><div class="modal-actions">${button("Thêm vào kho", "save-csv", "button primary large")}</div>`;
  } catch (error) {
    if (token !== loadToken) return;
    csvPreview = null;
    document.querySelector("#csv-preview").innerHTML = `<p class="validation error" role="alert">${html(error.message)}</p>`;
  }
}

async function submit(answer) {
  const s = currentSession();
  if (!s || s.result) return;
  clearTimeout(draftTimer);
  const draft = structuredClone(state.draft);
  await run(() => repository.submit(s.id, s.step, answer, draft));
  root.querySelector(".feedback")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

async function action(target) {
  const name = target.dataset.action;
  if (state.busy) return;
  if (["home", "library", "data", "pause"].includes(name)) {
    const s = currentSession();
    if (s && !s.result) { clearTimeout(draftTimer); await repository.saveDraft(s.id, s.step, state.draft); }
    state.view = name === "pause" ? "home" : name; stopSpeaking(); render(); window.scrollTo(0, 0); return;
  }
  if (name === "import") { csvPreview = null; importMarkup(); return; }
  if (name === "close-modal") { closeModal(); return; }
  if (name === "confirm") {
    const callback = modalAction;
    closeModal();
    await run(callback); return;
  }
  if (name === "resume") { state.view = "study"; render(); return; }
  if (name === "end") {
    const sessionId = currentSession()?.id;
    confirmation("Kết thúc lượt đang học?", "Các câu đã chấm được giữ lại. Câu chưa làm sẽ nằm trong lượt tiếp theo.", () => repository.endSession(sessionId), "Kết thúc lượt");
    return;
  }
  if (name === "begin") {
    await run(async () => { await repository.startSession({ setId: state.data.selectedSetId, mode: target.dataset.mode, level: state.level, topic: state.topic, grade: state.grade }); state.view = "study"; });
    window.scrollTo(0, 0); return;
  }
  if (name === "option") {
    if (currentSession()?.result) return;
    const index = Number(target.dataset.index);
    state.draft.selected = currentQuestion().type === "mcq" ? [index] : state.draft.selected.includes(index) ? state.draft.selected.filter((i) => i !== index) : [...state.draft.selected, index];
    saveDraft(); render(); return;
  }
  if (["add-token", "remove-token"].includes(name)) {
    if (currentSession()?.result) return;
    const index = Number(target.dataset.index);
    if (name === "add-token" && !state.draft.ordered.includes(index)) state.draft.ordered.push(index);
    else if (name === "remove-token") state.draft.ordered = state.draft.ordered.filter((i) => i !== index);
    saveDraft(); render(); return;
  }
  if (name === "submit" && answerReady()) { await submit(receivedAnswer(currentQuestion())); return; }
  if (name === "next") { const s = currentSession(); if (s) await run(() => repository.advance(s.id, s.step)); window.scrollTo(0, 0); return; }
  if (name === "flip") { state.flipped = true; render(); return; }
  if (["grade-forgot", "grade-remember"].includes(name) && state.flipped) { await submit(name === "grade-remember"); return; }
  if (name === "speak") { const q = currentQuestion(); if (q?.subject === "english") speakEnglish(q.context || q.prompt); return; }
  if (name === "choose") {
    const set = state.data.sets.find((item) => item.id === target.dataset.id);
    await run(async () => { await repository.selectSet(target.dataset.id); state.subject = set?.subject || "all"; state.level = state.topic = state.grade = "all"; state.view = "home"; });
    window.scrollTo(0, 0);
    return;
  }
  if (name === "close-result") { await run(async () => { await repository.dismissSummary(); state.view = "home"; }); return; }
  if (name === "next-batch") {
    const result = state.data.snapshot.summary;
    await run(() => repository.startSession({ setId: result.setId, mode: result.mode, ...(result.filters ?? {}) }));
    return;
  }
  if (name === "save-csv") {
    if (!csvPreview || csvPreview.errors.length) return;
    const preview = csvPreview, setName = document.querySelector("#set-name").value.trim();
    if (!setName) { toast("Hãy đặt tên cho bộ bài.", true); return; }
    target.disabled = true;
    await run(async () => { await repository.importQuestions(preview.rows, preview.filename, setName); closeModal(); state.view = "home"; state.level = state.topic = "all"; toast(`Đã thêm ${preview.rows.length} câu vào bộ mới.`); }); return;
  }
  if (name === "rename") {
    const set = state.data.sets.find((item) => item.id === target.dataset.id);
    modalAction = async () => repository.renameSet(set.id, modal.querySelector("input").value);
    showModal(`<h2>Đổi tên bộ bài</h2><label class="field-label">Tên bộ<input id="rename-name" maxlength="120" value="${html(set.name)}"></label><div class="modal-actions">${button("Lưu tên", "save-name", "button primary")}</div>`); return;
  }
  if (name === "save-name") { const setName = modal.querySelector("input").value.trim(); if (!setName) { toast("Tên bộ không được trống.", true); return; } const callback = modalAction; await run(async () => { await callback(); closeModal(); }); return; }
  if (name === "delete-set") {
    const set = state.data.sets.find((item) => item.id === target.dataset.id);
    confirmation("Xóa bộ bài này?", `“${html(set.name)}” và tiến độ của bộ sẽ được dọn. Bản trước khi xóa có thể tải ở mục Dữ liệu.`, () => repository.deleteSet(set.id), "Xóa bộ bài"); return;
  }
  if (name === "clear") { confirmation("Làm trống kho bài?", "Toàn bộ câu hỏi, kết quả và lịch ôn hiện tại sẽ được dọn. Website giữ một bản trước khi dọn để bạn tải về.", () => repository.clearAll(), "Xóa nội dung"); return; }
  if (name === "export-set") {
    const set = state.data.sets.find((item) => item.id === target.dataset.id);
    download(`${set.name.replace(/[<>:"/\\|?*]/g, "-")}.csv`, questionsToCsv(state.data.snapshot.questions.filter((q) => q.setId === set.id)), "text/csv"); return;
  }
  if (name === "backup" || name === "recovery") {
    const source = name === "recovery" ? state.data.snapshot.recovery.data : state.data.snapshot;
    download(`nam-english-${name}-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(exportBackup(source), null, 2)); return;
  }
  if (name === "restore") { showModal(`<h2>Khôi phục từ bản sao lưu</h2><p class="modal-description">Chọn file JSON được tải từ NẮM Học tập.</p><label class="upload-area">${icon("upload")}<strong>Chọn file JSON</strong><input type="file" data-backup accept=".json,application/json" aria-label="Chọn bản sao lưu JSON"></label><div id="backup-preview"></div>`); return; }
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  event.preventDefault();
  void action(target).catch((error) => toast(error.message, true));
});
document.addEventListener("input", (event) => {
  const target = event.target;
  if (target.matches("[data-answer]")) { state.draft.text = target.value; saveDraft(); updateSubmit(); }
  if (target.matches("[data-search]")) {
    state.search = target.value;
    const container = root.querySelector("#set-list");
    const sets = state.data.sets.filter((set) => set.name.toLocaleLowerCase("vi").includes(state.search.toLocaleLowerCase("vi")));
    container.innerHTML = sets.map(setCard).join("") || '<p class="search-empty">Chưa tìm thấy bộ nào khớp tên này.</p>';
  }
});
document.addEventListener("change", async (event) => {
  const target = event.target;
  if (target.matches("[data-csv]") && target.files[0]) { void loadCsv(target.files[0]); return; }
  if (target.matches("[data-match]")) { state.draft.matches[target.dataset.match] = target.value; saveDraft(); updateSubmit(); return; }
  if (target.dataset.filter === "set") { await run(async () => { await repository.selectSet(target.value); state.level = state.topic = state.grade = "all"; }); return; }
  if (target.dataset.filter === "subject") {
    state.subject = target.value;
    const first = state.data.sets.find((set) => state.subject === "all" || set.subject === state.subject);
    if (first && first.id !== state.data.selectedSetId) {
      await run(async () => { await repository.selectSet(first.id); state.level = state.topic = state.grade = "all"; });
    } else {
      state.level = state.topic = state.grade = "all";
      render();
    }
    return;
  }
  if (target.dataset.filter === "level") { state.level = target.value; state.topic = "all"; render(); }
  if (target.dataset.filter === "grade") { state.grade = target.value; state.topic = "all"; render(); }
  if (target.dataset.filter === "topic") { state.topic = target.value; render(); }
  if (target.matches("[data-backup]") && target.files[0]) {
    const token = ++loadToken;
    try {
      const file = target.files[0];
      if (file.size > 50 * 1024 * 1024) throw new Error("File sao lưu vượt quá 50 MB.");
      const text = await file.text();
      if (token !== loadToken || !modal.open) return;
      pendingBackup = validateBackup(JSON.parse(text));
      const payload = pendingBackup;
      confirmation("Thay kho hiện tại bằng bản sao lưu?", `File hợp lệ: ${payload.imports.length} bộ, ${payload.questions.length} câu. Bản hiện tại sẽ được lưu trước khi thay.`, async () => { await repository.replaceAll(payload); toast("Đã khôi phục dữ liệu."); }, "Khôi phục");
    } catch (error) { const preview = document.querySelector("#backup-preview"); if (token === loadToken && preview) preview.innerHTML = `<p class="validation error" role="alert">${html(error instanceof SyntaxError ? "File JSON không hợp lệ." : error.message)}</p>`; }
  }
});
document.addEventListener("submit", (event) => { if (event.target.matches("[data-answer-form]")) { event.preventDefault(); if (answerReady()) void submit(receivedAnswer(currentQuestion())); } });
document.addEventListener("keydown", (event) => {
  if (modal.open || state.busy || state.view !== "study" || event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
  const session = currentSession(); if (!session) return;
  const field = ["INPUT", "SELECT", "TEXTAREA"].includes(event.target.tagName);
  if (event.key === "Enter" && !event.shiftKey && (event.target.matches("[data-answer]") || !field && event.target.tagName !== "BUTTON")) {
    event.preventDefault();
    if (session.result) void run(() => repository.advance(session.id, session.step));
    else if (session.mode !== "flashcards" && answerReady()) void submit(receivedAnswer(currentQuestion()));
  }
  if (!field && !session.result && /^[1-9]$/.test(event.key)) {
    const choice = root.querySelector(`[data-action="option"][data-index="${Number(event.key) - 1}"]`);
    if (choice) { event.preventDefault(); void action(choice); }
  }
});
document.addEventListener("dragover", (event) => { if (event.target.closest("[data-drop-zone]")) { event.preventDefault(); event.target.closest("[data-drop-zone]").classList.add("dragging"); } });
document.addEventListener("dragleave", (event) => { event.target.closest?.("[data-drop-zone]")?.classList.remove("dragging"); });
document.addEventListener("drop", (event) => {
  if (!event.target.closest("[data-drop-zone]")) return;
  event.preventDefault(); event.target.closest("[data-drop-zone]").classList.remove("dragging");
  if (event.dataTransfer.files[0]) void loadCsv(event.dataTransfer.files[0]);
});
modal.addEventListener("cancel", () => { loadToken += 1; csvPreview = null; });

async function start() {
  // Bỏ service worker cũ để các bản mới dùng cùng một gói tài nguyên.
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
  try {
    repository = await createRepository();
    state.data = await readDashboard(repository);
    state.view = state.data.snapshot.session || state.data.snapshot.summary ? "study" : "home";
    syncDraft(); render();
    repository.subscribe(() => { clearTimeout(syncTimer); syncTimer = setTimeout(() => { if (!state.busy) void refresh().catch((e) => toast(e.message, true)); }, 250); });
  } catch (error) {
    root.innerHTML = `<main class="boot-error"><span class="brand-symbol">${icon("book")}</span><h1>Chưa mở được kho bài.</h1><p>${html(error.message)}</p><button class="button primary" onclick="location.reload()">Thử lại</button><small>Các bộ bài đã lưu vẫn nằm trên thiết bị.</small></main>`;
  }
}
void start();
