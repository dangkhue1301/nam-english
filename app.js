const SAMPLE_CSV = "\"id\",\"domain\",\"type\",\"level\",\"topic\",\"subtopic\",\"prompt\",\"context\",\"options\",\"answer\",\"explanation\",\"theory\",\"hint\",\"tags\",\"difficulty\",\"learning_key\"\r\n\"g-b1-present-001\",\"grammar\",\"mcq\",\"B1\",\"Present simple & continuous\",\"actions now\",\"Choose the correct option.\",\"Please be quiet. Mia ___ an online lesson right now.\",\"takes||is taking||took||has taken\",\"is taking\",\"Right now describes an action in progress, so use the present continuous.\",\"Present continuous: am/is/are + verb-ing for an action happening around now.\",\"Look at right now.\",\"present-continuous||time-marker\",\"1\",\"\"\r\n\"g-b1-perfect-001\",\"grammar\",\"fill_blank\",\"B1\",\"Present perfect\",\"experience\",\"Complete the sentence with the correct verb form.\",\"I ___ never ___ sushi before. (try)\",\"\",\"have never tried\",\"Use have + past participle with I. Never goes between the auxiliary and the participle.\",\"Present perfect: have/has + past participle. Use it for life experience when no finished time is given.\",\"There is no finished past time.\",\"present-perfect||experience\",\"2\",\"\"\r\n\"g-b1-past-001\",\"grammar\",\"error_correction\",\"B1\",\"Past simple & continuous\",\"finished past\",\"Correct the sentence.\",\"We have visited the museum last Saturday.\",\"\",\"We visited the museum last Saturday.\",\"Last Saturday is a finished past time, so the past simple is required.\",\"Use the past simple with a stated, finished past time such as yesterday or last Saturday.\",\"Focus on the time phrase.\",\"past-simple||time-marker\",\"2\",\"\"\r\n\"g-b1-passive-001\",\"grammar\",\"sentence_transformation\",\"B1\",\"Passive voice\",\"present passive\",\"Rewrite in the passive voice.\",\"People speak English in many countries.\",\"\",\"English is spoken in many countries.\",\"The object English becomes the subject; present simple passive is is + past participle.\",\"Passive voice: be in the correct tense + past participle. Include the agent only when it matters.\",\"Start with English.\",\"passive||present-simple\",\"2\",\"\"\r\n\"g-b2-wordform-001\",\"grammar\",\"word_formation\",\"B2\",\"Adjectives & adverbs\",\"adverb formation\",\"Complete with the correct form of SUCCESSFUL.\",\"The team completed the project ___.\",\"\",\"successfully\",\"Completed is a verb, so it is modified by the adverb successfully.\",\"Adverbs commonly modify verbs. Many are formed with adjective + -ly.\",\"Ask what kind of word modifies completed.\",\"word-formation||adverbs\",\"2\",\"\"\r\n\"g-b2-cond-001\",\"grammar\",\"ordering\",\"B2\",\"Conditionals\",\"third conditional\",\"Put the words in the correct order.\",\"\",\"would||the||If||we||caught||had||train||left||have||earlier,||we\",\"If we had left earlier, we would have caught the train\",\"The third conditional describes an unreal past situation and its imagined result.\",\"Third conditional: if + past perfect, would have + past participle.\",\"Build the if-clause first.\",\"third-conditional||ordering\",\"3\",\"\"\r\n\"g-b2-modal-001\",\"grammar\",\"multiple_select\",\"B2\",\"Modal verbs\",\"deduction\",\"Select every sentence that can express a strong present deduction.\",\"\",\"She must be at work.||She can't be at work.||She might be at work.||She should be at work.\",\"She must be at work.||She can't be at work.\",\"Must expresses strong positive deduction; can't expresses strong negative deduction. Might is only a possibility.\",\"For present deduction: must + base verb for strong certainty; can't + base verb for strong impossibility.\",\"Choose both positive and negative strong deductions.\",\"modals||deduction\",\"3\",\"\"\r\n\"g-b2-relative-001\",\"grammar\",\"matching\",\"B2\",\"Relative clauses\",\"relative words\",\"Match each relative word with its usual reference.\",\"\",\"who=>people||which=>things||where=>places||whose=>possession\",\"\",\"Who refers to people, which to things, where to places, and whose shows possession.\",\"Relative clauses add information about a noun. The relative word is chosen by meaning and grammatical role.\",\"One item shows ownership.\",\"relative-clauses||matching\",\"2\",\"\"\r\n\"g-b1-article-001\",\"grammar\",\"mcq\",\"B1\",\"Articles\",\"first mention\",\"Choose the correct article.\",\"I saw ___ unusual bird near the lake.\",\"a||an||the||no article\",\"an\",\"The noun is singular and first mentioned; unusual begins with a vowel sound.\",\"Use a/an for one non-specific singular countable noun. Choose an before a vowel sound.\",\"Listen to the first sound of unusual.\",\"articles||indefinite-article\",\"1\",\"\"\r\n\"g-b2-report-001\",\"grammar\",\"sentence_transformation\",\"B2\",\"Reported speech\",\"backshift\",\"Report the sentence.\",\"Lena said, “I am feeling tired.”\",\"\",\"Lena said that she was feeling tired.||Lena said she was feeling tired.\",\"In past reporting, am feeling normally backshifts to was feeling and I changes to she.\",\"Reported speech often backshifts the tense when the reporting verb is in the past.\",\"Change both the pronoun and the tense.\",\"reported-speech||backshift\",\"3\",\"\"\r\n\"g-b1-compare-001\",\"grammar\",\"fill_blank\",\"B1\",\"Comparatives\",\"comparative adjectives\",\"Complete with the comparative form of RELIABLE.\",\"This train service is ___ than the old one.\",\"\",\"more reliable\",\"Reliable is a longer adjective, so form the comparative with more.\",\"Use -er with many short adjectives; use more with most longer adjectives.\",\"Do not add -er to reliable.\",\"comparatives||adjectives\",\"1\",\"\"\r\n\"g-b2-future-001\",\"grammar\",\"mcq\",\"B2\",\"Future forms\",\"future perfect\",\"Choose the best form.\",\"By next June, I ___ this course.\",\"will finish||will have finished||am finishing||have finished\",\"will have finished\",\"By next June sets a future deadline before which the action will be complete.\",\"Future perfect: will have + past participle for an action completed before a future point.\",\"Look at by + future time.\",\"future-perfect||deadline\",\"3\",\"\"\r\n\"v-b1-allocate-001\",\"vocabulary\",\"fill_blank\",\"B1\",\"Work & study\",\"allocate\",\"allocate /ˈæləkeɪt/ (verb)\",\"The manager allocated extra time and budget to the new project.\",\"\",\"phân bổ, cấp cho (tiền bạc, thời gian, nguồn lực)\",\"allocate /ˈæləkeɪt/ (động từ): chính thức chỉ định một phần tài nguyên cho mục đích cụ thể. Danh từ: allocation.\",\"\",\"\",\"work||resources||verb\",\"2\",\"vocab:allocate:verb:set-aside\"\r\n\"v-a2-reliable-001\",\"vocabulary\",\"fill_blank\",\"A2\",\"People & things\",\"reliable\",\"reliable /rɪˈlaɪəbl/ (adjective)\",\"A reliable colleague always keeps promises and finishes tasks on time.\",\"\",\"đáng tin cậy, chắc chắn\",\"reliable /rɪˈlaɪəbl/ (tính từ): người hoặc vật có thể tin tưởng được để hành động đúng hẹn. Trái nghĩa: unreliable.\",\"\",\"\",\"character||adjective\",\"1\",\"vocab:reliable:adjective:trusted\"\r\n\"v-b2-mitigate-001\",\"vocabulary\",\"fill_blank\",\"B2\",\"Society & environment\",\"mitigate\",\"mitigate /ˈmɪtɪɡeɪt/ (verb)\",\"Planting trees can help mitigate the harmful effects of urban heat.\",\"\",\"giảm nhẹ, làm dịu bớt (tác hại, rủi ro)\",\"mitigate /ˈmɪtɪɡeɪt/ (động từ): làm cho điều gì bớt nghiêm trọng hoặc bớt gây hại.\",\"\",\"\",\"environment||academic||verb\",\"3\",\"vocab:mitigate:verb:reduce-severity\"\r\n\"v-b1-carryout-001\",\"vocabulary\",\"fill_blank\",\"B1\",\"Phrasal verbs\",\"carry out\",\"carry out /ˌkæri ˈaʊt/ (phrasal verb)\",\"Scientists carried out several tests before releasing the final vaccine.\",\"\",\"tiến hành, thực hiện (kế hoạch, thí nghiệm, nhiệm vụ)\",\"carry out (cụm động từ): thực hiện hoặc hoàn thành một kế hoạch, khảo sát hoặc thí nghiệm.\",\"\",\"\",\"phrasal-verb||research\",\"2\",\"vocab:carry-out:phrasal-verb:perform\"\r\n\"v-b2-compelling-001\",\"vocabulary\",\"fill_blank\",\"B2\",\"Communication\",\"compelling\",\"compelling /kəmˈpelɪŋ/ (adjective)\",\"She gave a compelling argument that convinced everyone in the room.\",\"\",\"thuyết phục, lôi cuốn khó cưỡng\",\"compelling /kəmˈpelɪŋ/ (tính từ): rất có sức thuyết phục hoặc khiến người khác không thể phớt lờ.\",\"\",\"\",\"communication||adjective\",\"3\",\"vocab:compelling:adjective:convincing\"\r\n\"v-a2-journey-001\",\"vocabulary\",\"fill_blank\",\"A2\",\"Travel & transport\",\"journey\",\"journey /ˈdʒɜːni/ (noun)\",\"They set off on a long journey across the mountains by bicycle.\",\"\",\"chuyến đi, hành trình dài (từ nơi này sang nơi khác)\",\"journey /ˈdʒɜːni/ (danh từ): quá trình đi từ điểm này đến điểm khác, thường mất nhiều thời gian.\",\"\",\"\",\"travel||nouns\",\"1\",\"vocab:journey:noun:travel-distance\"\r\n\"v-b1-deadline-001\",\"vocabulary\",\"fill_blank\",\"B1\",\"Work & study\",\"deadline\",\"deadline /ˈdedlaɪn/ (noun)\",\"We worked late into the night to meet the strict project deadline.\",\"\",\"hạn chót, thời hạn hoàn thành\",\"meet a deadline: hoàn thành công việc trước hoặc đúng ngày giờ quy định.\",\"\",\"\",\"collocation||work\",\"2\",\"vocab:meet-a-deadline:collocation:finish-on-time\"\r\n\"v-b2-scarce-001\",\"vocabulary\",\"fill_blank\",\"B2\",\"Society & environment\",\"scarce\",\"scarce /skeəs/ (adjective)\",\"Fresh drinking water became scarce during the prolonged summer drought.\",\"\",\"khan hiếm, ít ỏi, không đủ dùng\",\"scarce /skeəs/ (tính từ): không đủ về số lượng so với nhu cầu. Trái nghĩa: plentiful, abundant.\",\"\",\"\",\"synonyms||adjective\",\"2\",\"vocab:scarce:adjective:insufficient\"\r\n\"v-b1-putoff-001\",\"vocabulary\",\"fill_blank\",\"B1\",\"Phrasal verbs\",\"put off\",\"put off /ˌpʊt ˈɒf/ (phrasal verb)\",\"They decided to put off the outdoor meeting until Friday due to heavy rain.\",\"\",\"hoãn lại, dời lịch sang thời điểm khác\",\"put off (cụm động từ): trì hoãn một sự kiện hoặc hoạt động. Đồng nghĩa: postpone, delay.\",\"\",\"\",\"phrasal-verb||scheduling\",\"2\",\"vocab:put-off:phrasal-verb:postpone\"\r\n\"v-c1-ubiquitous-001\",\"vocabulary\",\"fill_blank\",\"C1\",\"Academic vocabulary\",\"ubiquitous\",\"ubiquitous /juːˈbɪkwɪtəs/ (adjective)\",\"Smartphones are now ubiquitous across almost every modern city.\",\"\",\"có mặt ở khắp nơi, nhan nhản, phổ biến\",\"ubiquitous /juːˈbɪkwɪtəs/ (tính từ học thuật): xuất hiện hoặc được tìm thấy ở khắp mọi nơi.\",\"\",\"\",\"academic||adjective\",\"4\",\"vocab:ubiquitous:adjective:everywhere\"\r\n\"v-b2-substantial-001\",\"vocabulary\",\"fill_blank\",\"B2\",\"Academic vocabulary\",\"substantial\",\"substantial /səbˈstænʃl/ (adjective)\",\"The community project received substantial financial support from local businesses.\",\"\",\"đáng kể, quan trọng, có giá trị lớn\",\"substantial /səbˈstænʃl/ (tính từ): lớn về số lượng, giá trị hoặc tầm quan trọng. Đồng nghĩa: considerable.\",\"\",\"\",\"academic||adjective\",\"3\",\"vocab:substantial:adjective:large-amount\"\r\n\"v-a2-destination-001\",\"vocabulary\",\"fill_blank\",\"A2\",\"Travel & transport\",\"destination\",\"destination /ˌdestɪˈneɪʃn/ (noun)\",\"Da Nang has become a famous holiday destination for tourists worldwide.\",\"\",\"điểm đến, đích đến\",\"destination /ˌdestɪˈneɪʃn/ (danh từ): địa điểm mà một người hoặc phương tiện đang hướng tới.\",\"\",\"\",\"travel||nouns\",\"1\",\"vocab:destination:noun:place-to-go\"\r\n";

import { buildCsvPreview, buildStats, displayAnswer, isReviewDue, resolveEscapeAction, stableShuffle, TYPE_LABELS, learningKeyFor, normalizeText, SUBJECTS, encodeSharePayload, decodeSharePayload, MAX_SHARE_BYTES } from "./core.js";
import { createRepository, readDashboard, exportBackup, validateBackup } from "./storage.js";
import {
  questionsToCsv,
  searchQuestions,
  generateReportMarkdown,
  generateReportCsv,
  computeStreaks,
  dailyActivity,
  heatmapWeeks,
  xpFromAttempts,
  levelInfo,
  accuracyByDomain,
  topicMastery,
  dueForecast,
  dueCountToday,
  dayKey,
  buildAchievements,
  mistakeQuestions,
  collectVocabularyKeys,
  parseLearningKey,
} from "./stats.js";
import { speakEnglish, speechAvailable, stopSpeaking } from "./speech.js";
import { initPwa } from "./pwa.js";

const root = document.querySelector("#app");
const modal = document.querySelector("#modal");
const notice = document.querySelector("#notice");
const pwaStatus = document.querySelector("#pwa-status");
const pwaStatusText = document.querySelector("#pwa-status-text");
const pwaInstall = document.querySelector("#pwa-install");
const state = { view: "home", data: null, busy: false, subject: "all", grade: "all", level: "all", topic: "all", type: "all", limit: 30, search: "", searchMode: "sets", draft: null, draftKey: "", flipped: false, timerVisible: false, studyStartedAt: null };
let studyTimerInterval = null;

function currentTheme() {
  return document.documentElement.dataset.theme || "auto";
}
function applyTheme(theme) {
  if (theme === "light" || theme === "dark") {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("nam-theme", theme); } catch {}
  } else {
    delete document.documentElement.dataset.theme;
    try { localStorage.removeItem("nam-theme"); } catch {}
  }
}
function cycleTheme() {
  const current = currentTheme();
  const next = current === "auto" ? "light" : current === "light" ? "dark" : "auto";
  applyTheme(next);
  const labels = { auto: "Giao diện: Tự động (theo thiết bị)", light: "Giao diện: Sáng", dark: "Giao diện: Tối" };
  toast(labels[next] || "Đã đổi giao diện");
}

function currentFontSize() {
  try {
    const saved = localStorage.getItem("nam-font-size");
    if (saved && !isNaN(Number(saved))) {
      return Math.max(14, Math.min(26, Number(saved)));
    }
  } catch {}
  return 16;
}

function applyFontSize(size) {
  const clamped = Math.max(14, Math.min(26, Number(size) || 16));
  document.documentElement.style.fontSize = clamped + "px";
  try { localStorage.setItem("nam-font-size", String(clamped)); } catch {}
  if (modal.open && modalAction === "font-size") {
    renderFontSizeModal();
  }
}

function renderFontSizeModal() {
  modalAction = "font-size";
  const size = currentFontSize();
  const presets = [
    { label: "Nhỏ (14px)", val: 14 },
    { label: "Chuẩn (16px)", val: 16 },
    { label: "Vừa (18px)", val: 18 },
    { label: "Lớn (20px)", val: 20 },
    { label: "Rất lớn (22px)", val: 22 },
  ];
  showModal(`<h2>Cỡ chữ hiển thị</h2>
    <p class="modal-description">Tùy chỉnh cỡ chữ toàn bộ giao diện cho phù hợp với mắt bạn.</p>
    <div class="font-size-control-wrap">
      <div class="font-size-stepper">
        ${button("- Giảm", "font-size-dec", "button subtle", size <= 14 ? "disabled" : "")}
        <div class="font-size-current-display">
          <strong>${size}</strong><span>px</span>
        </div>
        ${button("+ Tăng", "font-size-inc", "button subtle", size >= 26 ? "disabled" : "")}
      </div>
      <div class="font-size-presets">
        ${presets.map((p) => button(p.label, "font-size-set", `button ${p.val === size ? "primary" : "subtle"}`, `data-size="${p.val}"`)).join("")}
      </div>
      <div class="font-size-preview-box">
        <p class="font-size-preview-sample">The quick brown fox jumps over the lazy dog.</p>
        <p class="font-size-preview-sample-vi">Học một chút, nhớ thêm một ít. NẮM vững kiến thức mỗi ngày.</p>
      </div>
    </div>
    <div class="modal-actions">
      ${button("Mặc định (16px)", "font-size-reset", "button subtle")}
      ${button("Xong", "close-modal", "button primary large")}
    </div>`);
}

function canUseNotification() {
  return typeof window !== "undefined" && "Notification" in window;
}

async function requestDueNotificationPermission() {
  if (!canUseNotification()) {
    toast("Trình duyệt không hỗ trợ tính năng thông báo.", true);
    return;
  }
  try {
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      toast("Đã bật nhắc nhở ôn từ vựng trên trình duyệt!");
      checkAndSendDueNotification(true);
    } else if (perm === "denied") {
      toast("Quyền thông báo đã bị chặn trong cài đặt trình duyệt.", true);
    }
  } catch (err) {
    toast("Không thể kích hoạt thông báo: " + err.message, true);
  }
}

function checkAndSendDueNotification(force = false) {
  if (!canUseNotification() || Notification.permission !== "granted") return;
  if (!state.data?.snapshot) return;

  const allDue = dueCountForSets();
  if (allDue <= 0) return;

  const todayStr = dayKey(Date.now());
  const lastNotified = localStorage.getItem("nam-due-notified-date");
  if (!force && lastNotified === todayStr) {
    return;
  }

  try {
    const notif = new Notification("NẮM Học tập — Từ vựng đến hạn", {
      body: `Hôm nay bạn có ${allDue} từ vựng cần ôn lại theo chu trình SRS. Hãy bấm để ôn ngay!`,
      icon: "./favicon.svg",
      tag: "nam-due-vocab-" + todayStr,
    });
    notif.onclick = () => {
      window.focus();
      void invokeAction({ dataset: { action: "start-due-vocab" } });
    };
    localStorage.setItem("nam-due-notified-date", todayStr);
  } catch {}
}

function dueCountForSet(setId, now = Date.now()) {
  const w = state.data?.snapshot;
  if (!w) return 0;
  const questions = w.questions.filter((q) => q.setId === setId && q.active !== false && q.domain === "vocabulary");
  const keys = collectVocabularyKeys(questions);
  return dueCountToday(w.reviews, keys, now);
}

function dueCountForSets(setIds = null, now = Date.now()) {
  const w = state.data?.snapshot;
  if (!w) return 0;
  const targetIds = setIds ? new Set(setIds) : null;
  const questions = w.questions.filter((q) => (!targetIds || targetIds.has(q.setId)) && q.active !== false && q.domain === "vocabulary");
  const keys = collectVocabularyKeys(questions);
  return dueCountToday(w.reviews, keys, now);
}

function updateTimerDisplay() {
  const el = document.getElementById("study-timer-text");
  if (!el || !state.studyStartedAt) return;
  const elapsed = Math.max(0, Math.floor((Date.now() - state.studyStartedAt) / 1000));
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;
  el.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function ensureTimerInterval() {
  if (state.view === "study" && state.timerVisible && currentSession()) {
    if (!state.studyStartedAt) state.studyStartedAt = Date.now();
    if (!studyTimerInterval) {
      studyTimerInterval = setInterval(updateTimerDisplay, 1000);
    }
    updateTimerDisplay();
  } else {
    if (studyTimerInterval) {
      clearInterval(studyTimerInterval);
      studyTimerInterval = null;
    }
  }
}
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
  theme: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.73 12.73 1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>',
  fontSize: '<path d="M4 19h2.4l1.2-3.5h4.8l1.2 3.5H16L11 5H9L4 19zm4.2-5.7L10 8.3l1.8 5H8.2zM18 9v6m-3-3h6"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
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

let installPromptHandler = null;
if (pwaInstall) {
  pwaInstall.addEventListener("click", async () => {
    if (installPromptHandler) await installPromptHandler();
  });
}

function updatePwaUi({ online = navigator.onLine !== false, updateReady = false } = {}) {
  if (!pwaStatus) return;
  if (!online) {
    if (pwaStatusText) pwaStatusText.textContent = "Đang dùng ngoại tuyến.";
    pwaStatus.hidden = false;
  } else if (updateReady) {
    if (pwaStatusText) pwaStatusText.textContent = "Có bản cập nhật mới. Đóng các tab cũ để áp dụng.";
    pwaStatus.hidden = false;
  } else if (!installPromptHandler) {
    pwaStatus.hidden = true;
  }
}

initPwa({
  onConnectivityChange: ({ online }) => {
    updatePwaUi({ online });
  },
  onUpdateReady: () => {
    updatePwaUi({ updateReady: true });
  },
  onInstallAvailable: ({ promptInstall }) => {
    installPromptHandler = promptInstall;
    if (pwaInstall) pwaInstall.hidden = !promptInstall;
    if (pwaStatus) {
      if (promptInstall) pwaStatus.hidden = false;
      else if (navigator.onLine !== false) pwaStatus.hidden = true;
    }
  },
});


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
    state.level = state.topic = state.grade = state.type = "all"; state.limit = 30;
    if (state.subject !== "all") state.subject = selectedSet()?.subject || "all";
  }
  syncDraft();
  render();
  checkAndSendDueNotification(false);
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
  const vocabQuestions = questions.filter((q) => q.domain === "vocabulary");
  const words = new Set(vocabQuestions.map(learningKeyFor)).size;
  const dueToday = dueCountToday(w.reviews, collectVocabularyKeys(vocabQuestions));
  const total = stats.grammar + stats.practice + words;
  const done = total - stats.grammarRemaining - stats.practiceRemaining - stats.vocabularyRemaining;
  return { ...stats, total, done, words, dueToday, progress: total ? Math.round(done * 100 / total) : 0 };
}

function filteredStats() {
  const questions = state.data.questions.filter((q) => (state.grade === "all" || q.grade === state.grade) && (state.level === "all" || q.level === state.level) && (state.topic === "all" || q.topic === state.topic) && (state.type === "all" || q.type === state.type));
  const ids = new Set(questions.map((q) => q.id));
  return buildStats(questions, state.data.snapshot.reviews, state.data.attempts.filter((a) => ids.has(a.questionId)), []);
}

function header() {
  const studying = state.view === "study";
  return `<header class="header"><div class="header-inner">
    <a class="brand" href="#" data-action="home" aria-label="NẮM — Trang học"><span class="brand-symbol">${icon("book")}</span><span>NẮM<span class="brand-sub">HỌC TẬP</span></span></a>
    ${studying ? `<span class="header-note">Tập trung vào một câu mỗi lần.</span>` : `<nav aria-label="Điều hướng chính">${[["home", "Luyện tập"], ["library", "Bộ bài"], ["stats", "Thống kê"], ["data", "Dữ liệu"]].map(([view, label]) => button(label, view, `nav-link${state.view === view ? " active" : ""}`, `aria-current="${state.view === view ? "page" : "false"}"`)).join("")}</nav>`}
    <div class="header-actions">
      ${button(icon("fontSize"), "open-font-size", "icon-button font-size-toggle", 'aria-label="Điều chỉnh cỡ chữ" title="Cỡ chữ (A)"')}
      ${button(icon("theme"), "toggle-theme", "icon-button theme-toggle", 'aria-label="Đổi giao diện sáng/tối" title="Đổi giao diện sáng/tối"')}
      ${button(icon("help"), "help-shortcuts", "icon-button", 'aria-label="Phím tắt" title="Phím tắt (?)"')}
      ${studying ? button("Lưu và thoát", "pause", "button subtle") : button(`${icon("plus")}<span>Thêm bộ CSV</span>`, "import", "button primary header-import")}
    </div>
  </div></header>`;
}

function intro(title, description, tag = "KHÔNG GIAN HỌC TẬP") {
  const streaks = state.data?.attempts ? computeStreaks(state.data.attempts) : { current: 0 };
  const streakMarkup = streaks.current > 0 ? `<span class="streak-badge" title="Chuỗi ${streaks.current} ngày học liên tục">🔥 ${streaks.current} ngày</span>` : "";
  return `<div class="page-heading"><div><span class="eyebrow">${tag}</span><h1>${title}</h1><p>${description}</p></div><div style="display:flex;align-items:center;gap:10px;">${streakMarkup}<span class="date-note">${icon("clock")}${day(Date.now())}</span></div></div>`;
}

function emptyMarkup() {
  return `${intro("Học một chút.<br><em>Nhớ thêm một ít.</em>", "Thêm bộ bài của bạn. Chọn một lượt học. Bắt đầu ngay.")}
    <div class="onboard-grid"><section class="empty-card drop-zone" data-drop-zone>
      <div class="file-illustration" aria-hidden="true"><div class="paper-line"></div>${icon("file")}<span>CSV</span></div>
      <span class="eyebrow">BẮT ĐẦU TỪ ĐÂY</span><h2>Bộ bài đầu tiên của bạn.</h2>
      <p>Kéo file CSV vào đây hoặc chọn file từ máy.</p>
      <div class="empty-actions" style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin:16px 0 8px;">
        ${button(`${icon("plus")} Thêm bộ bài`, "import", "button primary large")}
        ${button(`${icon("book")} Thử bộ câu hỏi mẫu`, "load-sample", "button subtle large")}
      </div>
      <small>CSV UTF-8 · Tối đa 2.000 câu / file · Hoặc bắt đầu ngay với bộ mẫu 24 câu</small>
    </section><aside class="quick-start"><span class="eyebrow">BA BƯỚC NHỎ</span><h2>Từ file đến<br>buổi học.</h2>
      <ol class="steps"><li><span>01</span><div><strong>Tạo bộ câu hỏi</strong><p>Gửi hướng dẫn bên dưới cho AI bạn dùng.</p></div></li><li><span>02</span><div><strong>Thêm file CSV</strong><p>Website kiểm tra và tách thành một bộ riêng.</p></div></li><li><span>03</span><div><strong>Học theo nhịp của bạn</strong><p>Mỗi lượt tối đa 30 câu, tiến độ tự lưu.</p></div></li></ol>
      <a class="guide-link" href="./QUESTION_CSV_GUIDE.md" download>${icon("download")} Hướng dẫn tạo CSV cho AI</a>
    </aside></div>
    <div class="principles"><span><i class="dot green"></i>Tiếng Anh · Hóa · Lí · Sinh</span><span><i class="dot rust"></i>Từ vựng có lịch ôn riêng</span><span><i class="dot gray"></i>Tiến độ lưu trên thiết bị</span></div>`;
}

function resumeBanner() {
  const session = currentSession();
  if (!session) return "";
  const isReview = session.purpose === "review";
  const set = isReview ? null : state.data.sets.find((item) => item.id === session.setId);
  const title = isReview ? "Ôn riêng các câu sai" : html(set?.name);
  return `<div class="resume-banner"><span class="resume-icon">${icon("clock")}</span><div><strong>Bạn còn một lượt ${isReview ? "ôn câu sai" : "đang học"}</strong><p>${title} · Đã xong ${session.done}/${session.target} câu</p></div>${button("Tiếp tục học", "resume", "button primary")}${button(icon("close"), "end", "icon-button", 'aria-label="Kết thúc lượt đang học"')}</div>`;
}

function mistakeReviewBanner() {
  const mistakes = state.data?.mistakes || [];
  if (!mistakes.length || currentSession()) return "";
  const count = Math.min(20, mistakes.length);
  return `<div class="mistake-review-banner"><span class="mistake-icon">${icon("clock")}</span><div><strong>Bạn có ${mistakes.length} câu cần ôn lại</strong><p>Tập hợp các câu có lần trả lời gần nhất chưa đúng.</p></div>${button(`Ôn ${count} câu sai ${icon("arrow")}`, "review-mistakes", "button primary")}` + `</div>`;
}

function dueReminderBanner() {
  if (currentSession()) return "";
  const set = selectedSet();
  const currentSetDue = set ? (summaryForSet(set.id).dueToday || 0) : 0;
  const allDue = dueCountForSets();

  const notifPermission = canUseNotification() ? Notification.permission : "unsupported";
  const notifButton = notifPermission === "default"
    ? `${button("🔔 Bật thông báo", "enable-due-notifications", "button subtle small due-notif-btn", 'title="Nhận thông báo trên trình duyệt khi có từ đến hạn ôn"')}`
    : "";

  if (currentSetDue > 0) {
    const count = Math.min(state.limit || 30, currentSetDue);
    return `<section class="due-reminder">
      <div>
        <strong>🔔 Hôm nay có ${currentSetDue} từ vựng đến hạn ôn trong bộ “${html(set.name)}”!</strong>
        <p>Ôn lại đúng thời điểm giúp củng cố trí nhớ dài hạn theo phương pháp lặp lại ngắt quãng (SRS).</p>
      </div>
      <div class="due-reminder-actions">
        ${notifButton}
        ${button(`Ôn ngay ${count} từ đến hạn ${icon("arrow")}`, "start-due-vocab", "button primary", `data-set-id="${html(set.id)}"`)}
      </div>
    </section>`;
  }

  if (allDue > 0) {
    const setsWithDue = state.data.sets.filter((s) => s.subject === "english" && (summaryForSet(s.id).dueToday || 0) > 0);
    if (setsWithDue.length > 0) {
      const targetSet = setsWithDue[0];
      const targetDue = summaryForSet(targetSet.id).dueToday || 0;
      const count = Math.min(state.limit || 30, targetDue);
      return `<section class="due-reminder">
        <div>
          <strong>🔔 Hôm nay có ${allDue} từ vựng đến hạn ôn trong ${setsWithDue.length} bộ bài!</strong>
          <p>Bộ “${html(targetSet.name)}” có ${targetDue} từ cần ôn lại hôm nay.</p>
        </div>
        <div class="due-reminder-actions">
          ${notifButton}
          ${button(`Ôn ngay ${count} từ bộ ${html(targetSet.name)} ${icon("arrow")}`, "start-due-vocab", "button primary", `data-set-id="${html(targetSet.id)}"`)}
        </div>
      </section>`;
    }
  }

  return "";
}

function homeMarkup() {
  const availableSets = state.data.sets.filter((set) => state.subject === "all" || set.subject === state.subject);
  if (!availableSets.length) return resumeBanner() + emptyMarkup();
  const set = selectedSet(), stats = filteredStats(), full = summaryForSet(set.id);
  const attempts = state.data.attempts || [];
  const xp = xpFromAttempts(attempts);
  const level = levelInfo(xp);
  const xpMarkup = attempts.length ? `<div class="home-xp" style="margin-bottom:20px;">
    <div><strong>Cấp ${level.level}</strong><span>${number(level.current)} / ${number(level.cost)} XP</span></div>
    <div class="progress-track" aria-label="Tiến độ lên cấp"><span style="width:${level.progress}%;"></span></div>
  </div>` : "";
  const english = set.subject === "english";
  const subjects = [...new Set(state.data.sets.map((item) => item.subject))].sort();
  const levels = [...new Set(state.data.questions.map((q) => q.level))].sort();
  const grades = [...new Set(state.data.questions.map((q) => q.grade).filter(Boolean))].sort();
  const topics = [...new Set(state.data.questions.filter((q) => (state.level === "all" || q.level === state.level) && (state.grade === "all" || q.grade === state.grade) && (state.type === "all" || q.type === state.type)).map((q) => q.topic))].sort();
  const types = [...new Set(state.data.questions.filter((q) => (state.level === "all" || q.level === state.level) && (state.grade === "all" || q.grade === state.grade) && (state.topic === "all" || q.topic === state.topic)).map((q) => q.type).filter(Boolean))].sort();
  const modeCard = (mode, title, description, total, label, style, index) => {
    const isVocab = isVocabulary(mode);
    const startMode = isVocab ? "flashcards" : mode;
    const buttonText = isVocab
      ? (total ? `Học ${Math.min(state.limit || 30, total)} thẻ ghi nhớ ${icon("arrow")}` : "Đã ôn hết thẻ đến hạn")
      : (total ? `Bắt đầu ${Math.min(state.limit || 30, total)} câu bài tập ${icon("arrow")}` : "Đã hoàn thành các câu");
    return `<article class="mode-card ${style}"><div class="mode-top"><span class="mode-index">${index}</span><span class="pill">${isVocab ? "Từ vựng · Thẻ ghi nhớ" : mode === "grammar" ? "Ngữ pháp · Áp dụng" : subjectName(set.subject)}</span></div><h2>${title}</h2><p>${description}</p><div class="mode-count"><strong>${number(total)}</strong><span>${label}</span></div>
      ${button(buttonText, "begin", "button mode-start", `data-mode="${startMode}" ${!total || currentSession() ? "disabled" : ""}`)}
      <span class="mode-footnote">${isVocab ? "Học theo thẻ ghi nhớ lặp lại ngắt quãng (SRS); chưa nhớ sẽ ôn lại đến khi thuộc." : "Làm bài tập nhiều dạng; câu đã làm sẽ không lặp lại."}</span></article>`;
  };

  const vocabModeCard = () => {
    const dueToday = full.dueToday || 0;
    const newRemaining = stats.vocabularyRemaining || 0;
    const hasDue = dueToday > 0;
    const hasNew = newRemaining > 0;

    let countMarkup;
    let buttonMarkup;

    if (hasDue && hasNew) {
      countMarkup = `<div class="mode-count-vocab">
        <div class="mode-count-item">
          <strong class="accent-text">${number(dueToday)}</strong>
          <span>từ đến hạn ôn</span>
        </div>
        <div class="mode-count-divider"></div>
        <div class="mode-count-item">
          <strong>${number(newRemaining)}</strong>
          <span>từ mới</span>
        </div>
      </div>`;
      buttonMarkup = `${button(`Ôn ngay ${Math.min(state.limit || 30, dueToday)} từ đến hạn ${icon("arrow")}`, "start-due-vocab", "button primary mode-start", currentSession() ? "disabled" : "")}
        ${button(`Học ${Math.min(state.limit || 30, newRemaining)} từ mới`, "begin", "button subtle mode-start-secondary", `data-mode="flashcards" ${currentSession() ? "disabled" : ""}`)}`;
    } else if (hasDue) {
      countMarkup = `<div class="mode-count"><strong class="accent-text">${number(dueToday)}</strong><span>từ đến hạn ôn hôm nay</span></div>`;
      buttonMarkup = button(`Ôn ngay ${Math.min(state.limit || 30, dueToday)} từ đến hạn ${icon("arrow")}`, "start-due-vocab", "button primary mode-start", currentSession() ? "disabled" : "");
    } else if (hasNew) {
      countMarkup = `<div class="mode-count"><strong>${number(newRemaining)}</strong><span>thẻ từ mới cần học</span></div>`;
      buttonMarkup = button(`Học ${Math.min(state.limit || 30, newRemaining)} thẻ ghi nhớ ${icon("arrow")}`, "begin", "button mode-start", `data-mode="flashcards" ${currentSession() ? "disabled" : ""}`);
    } else {
      countMarkup = `<div class="mode-count"><strong>0</strong><span>Đã ôn hết thẻ đến hạn</span></div>`;
      buttonMarkup = button("Đã ôn hết thẻ đến hạn", "begin", "button mode-start", 'data-mode="flashcards" disabled');
    }

    return `<article class="mode-card vocabulary"><div class="mode-top"><span class="mode-index">01</span><span class="pill">Từ vựng · Thẻ ghi nhớ</span></div><h2>Vocabulary</h2><p>Nạp từ mới và ôn thẻ ghi nhớ theo nhịp nhớ lâu (SRS).</p>${countMarkup}
      ${buttonMarkup}
      <span class="mode-footnote">Học theo thẻ ghi nhớ lặp lại ngắt quãng (SRS); chưa nhớ sẽ ôn lại đến khi thuộc.</span></article>`;
  };

  return `${intro("Hôm nay, học bộ nào?", "Một lượt ngắn, thêm một bước tiến.")}${resumeBanner()}${dueReminderBanner()}${mistakeReviewBanner()}${xpMarkup}
    <section class="set-focus"><div class="set-focus-head"><label for="set-picker" class="eyebrow">BỘ ĐANG CHỌN</label><span>${full.done}/${full.total} mục đã học</span>${full.dueToday ? `<span class="pill due-pill" title="Hôm nay có ${full.dueToday} từ đến hạn ôn tập">🔔 ${full.dueToday} từ cần ôn</span>` : ""}${availableSets.length > 1 ? button(`${icon("book")} Trộn nhiều bộ`, "open-mix-modal", "button subtle mix-button") : ""}</div>
      <select id="set-picker" data-filter="set" aria-label="Chọn bộ bài">${availableSets.map((item) => `<option value="${html(item.id)}" ${item.id === set.id ? "selected" : ""}>${subjectName(item.subject)} · ${html(item.name)}</option>`).join("")}</select>
      <div class="progress-track" role="progressbar" aria-valuenow="${full.progress}" aria-valuemin="0" aria-valuemax="100" aria-label="Tiến độ bộ bài"><span style="width:${full.progress}%"></span></div>
      <div class="filter-row">${subjects.length > 1 ? `<label>Môn<select data-filter="subject">${option("all", "Tất cả môn", state.subject)}${subjects.map((subject) => option(subject, subjectName(subject), state.subject)).join("")}</select></label>` : ""}${english ? `<label>Trình độ<select data-filter="level">${option("all", "Tất cả trình độ", state.level)}${levels.map((level) => option(level, level, state.level)).join("")}</select></label>` : ""}${grades.length ? `<label>Lớp<select data-filter="grade">${option("all", "Tất cả lớp", state.grade)}${grades.map((grade) => option(grade, `Lớp ${grade}`, state.grade)).join("")}</select></label>` : ""}<label>Chủ điểm<select data-filter="topic">${option("all", "Tất cả chủ điểm", state.topic)}${topics.map((topic) => option(topic, topic, state.topic)).join("")}</select></label>${types.length > 1 ? `<label>Dạng câu<select data-filter="type">${option("all", "Tất cả dạng", state.type)}${types.map((type) => option(type, TYPE_LABELS[type] || type, state.type)).join("")}</select></label>` : ""}<label>Số câu<select data-filter="limit">${option("10", "10 câu", String(state.limit))}${option("20", "20 câu", String(state.limit))}${option("30", "30 câu", String(state.limit))}</select></label><span class="filter-note">Tối đa ${state.limit || 30} câu mỗi lượt</span></div>
    </section><div class="mode-grid">${english ? vocabModeCard() + modeCard("grammar", "Grammar & Áp dụng", "Làm bài tập nhiều dạng để áp dụng từ vựng và cấu trúc câu.", stats.grammarRemaining, "câu bài tập chưa làm", "grammar", "02") : modeCard("practice", subjectName(set.subject), "Làm bài tập nhiều dạng, có lý thuyết và giải thích sau mỗi câu.", stats.practiceRemaining, "câu chưa làm", "practice", "01")}</div>
    <div class="home-foot"><span>${icon("check")} Tiến độ được lưu tự động trên máy này.</span><a href="./QUESTION_CSV_GUIDE.md" download>Hướng dẫn tạo bộ bài ${icon("arrow")}</a></div>`;
}
function option(value, label, selected) { return `<option value="${html(value)}" ${value === selected ? "selected" : ""}>${html(label)}</option>`; }

function setCard(set) {
  const summary = summaryForSet(set.id);
  return `<article class="set-card"><div class="set-card-top"><span class="set-icon">${icon("book")}</span><details class="set-menu"><summary aria-label="Quản lý bộ ${html(set.name)}">${icon("more")}</summary><div>${button("Đổi tên", "rename", "menu-button", `data-id="${html(set.id)}"`)}${button("Chia sẻ bộ", "share-set", "menu-button", `data-id="${html(set.id)}"`)}${button("Tải CSV", "export-set", "menu-button", `data-id="${html(set.id)}"`)}${button("Xóa bộ này", "delete-set", "menu-button danger-text", `data-id="${html(set.id)}"`)}</div></details></div>
    <h2>${html(set.name)}</h2><p class="set-meta">${number(set.count)} câu · ${day(set.importedAt)}</p><div class="set-labels">${summary.practice ? `<span class="pill">${subjectName(set.subject)} · ${summary.practice}</span>` : ""}${summary.grammar ? `<span class="pill">Grammar · ${summary.grammar}</span>` : ""}${summary.words ? `<span class="pill rust">Vocab · ${summary.words} từ</span>` : ""}${summary.dueToday ? `<span class="pill due-pill" title="${summary.dueToday} từ đến hạn ôn hôm nay">🔔 ${summary.dueToday} từ cần ôn</span>` : ""}</div>
    <div class="set-progress"><span>${summary.done}/${summary.total} mục đã học</span><strong>${summary.progress}%</strong></div><div class="progress-track"><span style="width:${summary.progress}%"></span></div>
    ${button(`Chọn bộ này ${icon("arrow")}`, "choose", "button subtle card-link", `data-id="${html(set.id)}"`)}</article>`;
}

function questionSearchCard(q) {
  const set = state.data.sets.find((s) => s.id === q.setId);
  return `<article class="question-search-card">
    <div class="question-search-card-top"><span>${html(set?.name || "Bộ bài")}</span><span class="pill">${subjectName(q.subject)} · ${html(TYPE_LABELS[q.type] || q.type)}</span></div>
    <h3>${html(q.prompt)}</h3>
    ${q.context ? `<p class="question-context">${html(q.context)}</p>` : ""}
    <div class="search-q-answer"><strong>Đáp án:</strong><span>${html(displayAnswer(q.answer))}</span></div>
    <div class="question-search-meta"><span class="eyebrow">${html(q.topic)}${q.subtopic ? ` / ${html(q.subtopic)}` : ""}</span>${button(`Xem bộ bài ${icon("arrow")}`, "choose", "button subtle", `data-id="${html(q.setId)}"`)}</div>
  </article>`;
}

function questionSearchResultsMarkup() {
  if (!state.search.trim()) return '<p class="search-empty">Nhập từ khóa để tìm câu hỏi theo nội dung, ngữ cảnh, chủ điểm hoặc đáp án.</p>';
  const results = searchQuestions(state.data.snapshot.questions, state.search);
  if (!results.length) return '<p class="search-empty">Chưa tìm thấy câu hỏi nào khớp từ khóa này.</p>';
  const shown = results.slice(0, 50);
  return `<p class="search-summary">${results.length > 50 ? `Hiển thị 50 trong tổng số ${results.length} câu phù hợp` : `Tìm thấy ${results.length} câu phù hợp`}</p>
    <div class="question-search-grid">${shown.map(questionSearchCard).join("")}</div>`;
}

function libraryMarkup() {
  const isQuestionSearch = state.searchMode === "questions";
  const sets = state.data.sets.filter((set) => set.name.toLocaleLowerCase("vi").includes(state.search.toLocaleLowerCase("vi")));
  return `${intro("Bộ bài của bạn.", "Mỗi file CSV là một bộ riêng. Chọn bộ bạn muốn học.", "THƯ VIỆN CÁ NHÂN")}
    <div class="library-tools">
      <div class="search-tabs">
        <button type="button" class="tab-btn${!isQuestionSearch ? " active" : ""}" data-action="search-mode-sets">Tìm bộ bài (${state.data.sets.length})</button>
        <button type="button" class="tab-btn${isQuestionSearch ? " active" : ""}" data-action="search-mode-questions">Tìm câu hỏi (${state.data.snapshot.questions.length})</button>
      </div>
      <label class="search-box">${icon("search")}<input type="search" data-search placeholder="${isQuestionSearch ? "Tìm câu hỏi, đáp án, chủ điểm..." : "Tìm theo tên bộ..."}" value="${html(state.search)}" aria-label="${isQuestionSearch ? "Tìm câu hỏi" : "Tìm bộ bài"}"></label>
    </div>
    ${isQuestionSearch
      ? `<div id="question-search-results">${questionSearchResultsMarkup()}</div>`
      : `<div class="library-grid" id="set-list">${sets.map(setCard).join("")}${!sets.length && state.search ? `<p class="search-empty">Chưa tìm thấy bộ nào khớp tên này.</p>` : ""}${!state.data.sets.length ? `<button class="add-card" data-action="load-sample">${icon("book")}<strong>Nạp bộ câu hỏi mẫu</strong><span>24 câu Tiếng Anh B1–B2</span></button>` : ""}<button class="add-card" data-action="import">${icon("plus")}<strong>Thêm bộ mới</strong><span>Từ file CSV của bạn</span></button></div>`}`;
}

function dataMarkup() {
  const snapshot = state.data.snapshot;
  return `${intro("Dữ liệu trong tay bạn.", "Tải bản sao lưu để chuyển tiến độ sang máy khác.", "LƯU TRỮ & SAO LƯU")}
    <section class="data-panel"><div class="data-overview"><span class="set-icon">${icon("book")}</span><div><h2>${snapshot.imports.length} bộ · ${number(snapshot.questions.length)} câu</h2><p>Được lưu trên trình duyệt và thiết bị đang dùng.</p></div><span class="pill">Tự động lưu</span></div>
      <div class="data-row"><div><h3>Xuất báo cáo học tập</h3><p>Báo cáo chi tiết tiến độ, số câu đúng/sai theo môn và danh sách câu sai gần nhất.</p></div><div class="report-actions">${button(`${icon("download")} Markdown`, "export-report-md", "button subtle")}${button(`${icon("download")} CSV`, "export-report-csv", "button subtle")}</div></div>
      <div class="data-row"><div><h3>Sao lưu toàn bộ</h3><p>Gồm câu hỏi, kết quả và lịch ôn từ vựng.</p></div>${button(`${icon("download")} Tải sao lưu`, "backup", "button subtle")}</div>
      <div class="data-row"><div><h3>Khôi phục trên máy này</h3><p>Nhập file JSON đã sao lưu để thay kho hiện tại.</p></div>${button("Chọn bản sao lưu", "restore", "button subtle")}</div>
      ${snapshot.recovery ? `<div class="data-row"><div><h3>Bản trước khi dọn kho</h3><p>Lưu ngày ${day(snapshot.recovery.savedAt)}. Tải về nếu cần lấy lại nội dung cũ.</p></div>${button("Tải bản cũ", "recovery", "button subtle")}</div>` : ""}
      <div class="data-row"><div><h3>Thông báo nhắc ôn từ vựng</h3><p>${canUseNotification() ? (Notification.permission === "granted" ? "Đã bật nhắc nhở trình duyệt khi có từ đến hạn ôn hôm nay." : Notification.permission === "denied" ? "Quyền thông báo đã bị chặn trong cài đặt trình duyệt." : "Bật thông báo để được nhắc nhở ôn thẻ ghi nhớ đúng ngày.") : "Trình duyệt không hỗ trợ Web Notification API."}</p></div>${canUseNotification() ? button(Notification.permission === "granted" ? "Kiểm tra thông báo" : "Bật thông báo", "enable-due-notifications", "button subtle") : ""}</div>
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


function isAnswerSpoiler(subtopic, answer) {
  if (!subtopic || !answer) return false;
  const normSub = normalizeText(subtopic).trim();
  if (!normSub) return false;
  const answers = Array.isArray(answer) ? answer : [String(answer)];
  for (const ans of answers) {
    const normAns = normalizeText(ans).trim();
    if (!normAns) continue;
    if (normAns === normSub) return true;
    if (normAns.length >= 3 && normSub.includes(normAns)) return true;
    if (normSub.length >= 3 && normAns.includes(normSub)) return true;
    const subWords = normSub.split(/\s+/).filter((w) => w.length > 2);
    const ansWords = normAns.split(/\s+/).filter((w) => w.length > 2);
    for (const sw of subWords) {
      if (ansWords.includes(sw)) return true;
    }
  }
  return false;
}

function shouldShowSubtopic(q, result) {
  if (!q.subtopic) return false;
  if (result) return true;
  if (q.domain === "vocabulary") return false;
  if (isAnswerSpoiler(q.subtopic, q.answer)) return false;
  return true;
}

function highlightWordInSentence(sentence, word) {
  if (!sentence || !word) return sentence || "";
  const cleanWord = word.trim().replace(/-/g, " ");
  const escaped = cleanWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let regex = new RegExp(`\\b(${escaped}(?:s|es|ed|ing|d)?)\\b`, "gi");
  if (regex.test(sentence)) return sentence.replace(regex, '<mark class="vocab-highlight">$1</mark>');
  const parts = cleanWord.split(/\s+/);
  if (parts.length > 1) {
    const baseFirst = parts[0].replace(/(?:y|e)$/, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rest = parts.slice(1).join(" ").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    regex = new RegExp(`\\b(${baseFirst}(?:[a-z]{0,4})\\s+${rest})\\b`, "gi");
    if (regex.test(sentence)) return sentence.replace(regex, '<mark class="vocab-highlight">$1</mark>');
  } else {
    const stem = (cleanWord.length > 4 ? cleanWord.slice(0, -1) : cleanWord).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    regex = new RegExp(`\\b(${stem}[a-z]{0,4})\\b`, "gi");
    if (regex.test(sentence)) return sentence.replace(regex, '<mark class="vocab-highlight">$1</mark>');
  }
  return sentence;
}

function getFlashcardData(q) {
  let word = "";
  let pos = "";
  let ipa = "";
  let example = "";
  let meaning = "";
  let explanation = "";
  let meaningLabel = "NGHĨA TIẾNG VIỆT";

  const isInstruction = /^(choose|select|match|arrange|complete|correct|rewrite|replace|put\s+(?:the|all|each|in)|fill|find|order|use|give|identify)\b/i.test(q.prompt?.trim() || "");

  // 1. Get word & pos from learning_key
  const parsed = parseLearningKey(q.learning_key);
  if (parsed?.word && !/^[gqv]-[a-z0-9-]+$/.test(parsed.word)) {
    word = parsed.word;
    if (parsed.pos) pos = parsed.pos || "";
  }

  // 2. If prompt is not an instruction, clean word & extract IPA / pos
  if (!word && !isInstruction && q.prompt && q.prompt.length < 80) {
    const ipaMatch = q.prompt.match(/\/[^/]+\//);
    if (ipaMatch) ipa = ipaMatch[0];
    const posMatch = q.prompt.match(/\(([^)]+)\)/);
    if (posMatch && !pos) pos = posMatch[1];
    const cleanWord = q.prompt.replace(/\/[^/]+\//, "").replace(/\([^)]+\)/, "").trim();
    if (cleanWord) word = cleanWord;
  }

  // 3. Fallbacks for word: If prompt is an instruction or word still empty, look at subtopic & answer & explanation
  if (!word || isInstruction) {
    const rawAnswer = Array.isArray(q.answer) ? q.answer[0] : String(q.answer || "");
    const isAnswerEnglish = !/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(rawAnswer);

    // Prioritize subtopic if it's a valid vocabulary term (not an instruction)
    if (q.subtopic && !/^(choose|select|match|fill|arrange|rewrite|ordering)\b/i.test(q.subtopic.trim()) && q.subtopic.trim().length < 45) {
      word = q.subtopic.trim();
    } else if (isAnswerEnglish && rawAnswer.trim() && rawAnswer.length < 40 && !rawAnswer.includes("||")) {
      word = rawAnswer.trim();
    } else if (q.explanation) {
      const explMatch = q.explanation.match(/^([a-zA-Z\s-]{2,30})\s*(?:\/[^/]+\/)?\s*(?:\([^)]+\))?\s*(?:means|là|:|—)/i);
      if (explMatch) word = explMatch[1].trim();
    }
  }

  // If word is still not found, fallback to subtopic or topic
  if (!word) {
    word = (q.subtopic || q.topic || q.prompt || "").trim();
  }

  // 4. Extract IPA from theory, explanation or prompt if needed
  if (!ipa) {
    const ipaMatch = (q.theory || "").match(/\/[^/]+\//) || (q.explanation || "").match(/\/[^/]+\//) || (q.prompt || "").match(/\/[^/]+\//);
    if (ipaMatch) ipa = ipaMatch[0];
  }

  // 5. Extract POS
  if (!pos) {
    const posMatch = (q.theory || "").match(/\((verb|noun|adjective|adverb|phrasal verb|collocation|preposition|idiom)\)/i) ||
                     (q.explanation || "").match(/\((verb|noun|adjective|adverb|phrasal verb|collocation|preposition|động từ|danh từ|tính từ|phó từ|cụm động từ|từ ghép)\)/i) ||
                     (q.prompt || "").match(/\((verb|noun|adjective|adverb|phrasal verb|collocation|preposition)\)/i);
    if (posMatch) pos = posMatch[1];
    else if (q.tags?.includes("phrasal-verb")) pos = "phrasal verb";
    else if (q.tags?.includes("adjective")) pos = "adjective";
    else if (q.tags?.includes("noun")) pos = "noun";
    else if (q.tags?.includes("verb")) pos = "verb";
  }

  // 6. Example sentence
  if (q.type === "ordering" && Array.isArray(q.answer) && q.answer[0]) {
    example = q.answer[0];
  } else if (q.context) {
    if (q.context.includes("___")) {
      const fillWord = (Array.isArray(q.answer) ? q.answer[0] : String(q.answer)) || word;
      example = q.context.replace("___", fillWord);
    } else {
      example = q.context;
      if (/postponed/i.test(example) && word.toLowerCase() === "put off") {
        example = example.replace(/\bpostponed\b/i, "put off");
      }
    }
  }

  // 7. Meaning & Explanation (Vietnamese definition for back of card)
  const rawAnswer = displayAnswer(q.answer);
  const hasVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(rawAnswer);
  if (hasVietnamese && rawAnswer.trim()) {
    meaning = rawAnswer;
    meaningLabel = "NGHĨA TIẾNG VIỆT";
  } else {
    if (q.theory) meaning = q.theory.replace(/^[^:]+:\s*/, "").trim();
    if (!meaning && q.explanation) meaning = q.explanation.trim();
    if (!meaning) meaning = rawAnswer;
    meaningLabel = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(meaning) ? "NGHĨA TIẾNG VIỆT" : "ĐỊNH NGHĨA & Ý NGHĨA";
  }

  if (q.explanation && q.explanation !== meaning) {
    explanation = q.explanation;
  }

  return { word, pos, ipa, example, meaning, meaningLabel, explanation };
}

function sessionMarkup() {
  const s = currentSession(), q = currentQuestion();
  if (!s || !q) return homeMarkup();
  const isReview = s.purpose === "review";
  const set = state.data.sets.find((item) => item.id === (q.setId || s.setId));
  const result = s.result, isFlash = s.mode === "flashcards";
  const englishQuestion = q.subject === "english";
  const caption = isReview ? `Ôn câu sai · ${TYPE_LABELS[q.type] || q.type}` : isFlash ? "Thẻ ghi nhớ" : TYPE_LABELS[q.type];
  const percent = Math.round(s.done * 100 / s.target);
  const subjectLabel = isReview
    ? `ÔN CÂU SAI · ${subjectName(q.subject).toLocaleUpperCase("vi")}${q.grade ? ` / LỚP ${q.grade}` : ""}`
    : s.mode === "grammar" ? "GRAMMAR" : isFlash ? "VOCABULARY" : `${subjectName(q.subject).toLocaleUpperCase("vi")}${q.grade ? ` / LỚP ${q.grade}` : ""}`;
  const levelLabel = englishQuestion && q.level ? `<span> / ${html(q.level)}</span>` : "";
  return `<div class="study-wrap"><div class="study-heading">${button(`${icon("back")} ${isReview ? "Thoát" : "Bộ bài"}`, "pause", "text-button")}<span>${isReview ? "Ôn riêng các câu sai" : html(set?.name)}</span><strong>Câu ${s.done + 1}/${s.target}</strong>${state.timerVisible ? `<span class="study-timer" aria-live="off">${icon("clock")}<span id="study-timer-text">00:00</span></span>` : ""}${button(icon("clock"), "toggle-timer", "icon-button", `title="${state.timerVisible ? "Ẩn đồng hồ" : "Hiện đồng hồ"}" aria-label="Bật/tắt đồng hồ"`)}</div><div class="progress-track study-progress" role="progressbar" aria-valuenow="${s.done}" aria-valuemin="0" aria-valuemax="${s.target}" aria-label="Tiến độ lượt học"><span style="width:${percent}%"></span></div>
    <div class="study-grid"><section class="question-card ${isFlash ? "flash-card-container" : ""}">
      <div class="question-meta"><span class="eyebrow">${subjectLabel}${levelLabel}</span><span class="pill">${html(caption)}</span></div>
      ${isFlash ? (() => {
        const f = getFlashcardData(q);
        const highlightedExample = highlightWordInSentence(html(f.example), f.word);
        const isRevealed = Boolean(state.flipped || result);

        return `<div class="flashcard-scene">
          <div class="flashcard-card ${isRevealed ? "is-flipped" : ""}">
            ${!isRevealed ? `
              <!-- FRONT FACE: CHỈ HIỆN MẶT TRƯỚC, KHÔNG LỘ ĐÁP ÁN -->
              <div class="flashcard-face flashcard-face-front">
                <div class="flashcard-meta-row">
                  <span class="flashcard-badge">${icon("book")} MẶT TRƯỚC · TỪ VỰNG</span>
                  <span class="flashcard-side-hint">👆 Bấm [Lật thẻ] hoặc phím Space để xem nghĩa</span>
                </div>
                <div class="flashcard-center-content">
                  <div class="flashcard-word-wrap">
                    <h1 class="flashcard-word">${html(f.word)}</h1>
                    ${f.pos ? `<span class="flashcard-pos">(${html(f.pos)})</span>` : ""}
                    ${englishQuestion && speechAvailable() ? button(icon("sound"), "speak", "icon-button flash-sound-btn", `aria-label="Phát âm ${html(f.word)}" title="Nghe phát âm (Phím S)"`) : ""}
                  </div>
                  ${f.ipa ? `<div class="flashcard-ipa">${html(f.ipa)}</div>` : ""}
                </div>
                ${f.example ? `
                  <div class="flashcard-example-box">
                    <span class="flashcard-box-label">VÍ DỤ NGỮ CẢNH</span>
                    <p class="flashcard-example-text">“${highlightedExample}”</p>
                  </div>
                ` : ""}
                <div class="flashcard-action-bar">
                  ${button("👆 Lật thẻ xem nghĩa (Phím Space)", "flip", "button primary large flashcard-flip-main-btn")}
                </div>
              </div>
            ` : `
              <!-- BACK FACE: MẶT SAU HIỂN THỊ ĐÁP ÁN & GIẢI THÍCH -->
              <div class="flashcard-face flashcard-face-back">
                <div class="flashcard-meta-row">
                  <span class="flashcard-badge back-badge">${icon("check")} MẶT SAU · NGHĨA TỪ</span>
                  ${!result ? button("↺ Lật lại mặt trước", "unflip", "button subtle small flashcard-unflip-btn") : ""}
                </div>
                <div class="flashcard-back-header">
                  <strong class="flashcard-back-word">${html(f.word)}</strong>
                  ${f.pos ? `<span class="flashcard-pos">(${html(f.pos)})</span>` : ""}
                  ${f.ipa ? `<span class="flashcard-ipa-inline">${html(f.ipa)}</span>` : ""}
                  ${englishQuestion && speechAvailable() ? button(icon("sound"), "speak", "icon-button flash-sound-btn-sm", `aria-label="Phát âm ${html(f.word)}" title="Nghe phát âm"`) : ""}
                </div>
                <div class="flashcard-meaning-box">
                  <span class="flashcard-box-label highlight-label">${html(f.meaningLabel)}</span>
                  <div class="flashcard-meaning-value">${html(f.meaning)}</div>
                </div>
                ${f.explanation ? `
                  <div class="flashcard-expl-box">
                    <span class="flashcard-box-label">GIẢI THÍCH CHI TIẾT</span>
                    <p class="flashcard-expl-text">${html(f.explanation)}</p>
                  </div>
                ` : ""}
                ${f.example ? `
                  <div class="flashcard-example-box subtle">
                    <span class="flashcard-box-label">VÍ DỤ NGỮ CẢNH</span>
                    <p class="flashcard-example-text">“${highlightedExample}”</p>
                  </div>
                ` : ""}
              </div>
            `}
          </div>
        </div>`;
      })() : `
        <div class="question-title"><h1>${html(q.prompt)}</h1>${englishQuestion && speechAvailable() ? button(icon("sound"), "speak", "icon-button", 'aria-label="Đọc câu hỏi tiếng Anh"') : ""}</div>
        ${q.context ? `<p class="question-context">${html(q.context)}</p>` : ""}
        <form data-answer-form>${answerMarkup(q, result)}</form>
      `}
      ${result ? (isFlash ? `
        <div class="feedback ${result.correct ? "success" : "flash-repeat"}" role="status">
          <div class="feedback-title">
            ${result.correct ? icon("check") : '<span class="feedback-repeat-icon">↺</span>'}
            <strong>${result.correct ? "Đã ghi nhớ!" : "Chưa nhớ — Sẽ ôn lại"}</strong>
          </div>
          <p>${html(q.explanation || (result.correct ? "Bạn đã ghi nhớ tốt từ này." : "Đừng lo, thẻ này sẽ quay lại ở cuối lượt học để bạn ôn lại."))}</p>
          ${result.correct && result.dueAt ? `<small>Lịch hẹn ôn tiếp: ${day(result.dueAt)}</small>` : !result.correct ? '<small>Thẻ sẽ xuất hiện lại ở cuối lượt học để bạn ôn tập.</small>' : ""}
        </div>
      ` : `
        <div class="feedback ${result.correct ? "success" : "wrong"}" role="status">
          <div class="feedback-title">${icon(result.correct ? "check" : "close")}<strong>${result.correct ? "Chính xác!" : "Chưa đúng, cùng xem lại nhé."}</strong></div>
          ${!result.correct ? `<p class="expected"><span>Đáp án đúng</span><strong>${html(result.expected)}</strong></p>` : ""}
          <p>${html(q.explanation)}</p>
          ${!isReview && isVocabulary(s.mode) && !result.correct ? '<small>Từ này sẽ xuất hiện lại ở cuối lượt học.</small>' : result.dueAt ? `<small>Hẹn ôn lại: ${day(result.dueAt)}</small>` : ""}
        </div>
      `) : ""}
      <div class="answer-footer">
        <span>${result ? "Đã lưu kết quả" : isFlash ? (!state.flipped ? "Thử nhớ nghĩa và phát âm trước khi lật (Space để lật thẻ)" : "Tự đánh giá trí nhớ sau khi lật thẻ (← Chưa nhớ / → Đã nhớ)") : q.type === "multiple_select" ? "Chọn tất cả đáp án đúng" : "Enter để chấm"}</span>
        ${result ? button(`Tiếp theo ${icon("arrow")}`, "next", "button primary large") : isFlash ? (!state.flipped ? button(`Lật thẻ xem nghĩa ${icon("arrow")}`, "flip", "button primary large") : `<div class="flash-grades">${button("↺ Chưa nhớ (học lại)", "grade-forgot", "button subtle")}${button("✓ Đã nhớ", "grade-remember", "button primary")}</div>`) : button(`Chấm câu này ${icon("check")}`, "submit", "button primary large", `data-submit ${!answerReady() ? "disabled" : ""}`)}
      </div>
    </section><aside class="study-aside">
      <span class="eyebrow">CHỦ ĐIỂM</span>
      <h2>${html(q.topic)}</h2>
      ${isFlash ? `
        <div class="flashcard-aside-info">
          <span class="aside-badge">${icon("book")} Thẻ ghi nhớ</span>
          <p class="aside-tip-text">Tập trung nhớ từ vựng và ví dụ ngữ cảnh trước khi lật thẻ.</p>
          <div class="flash-shortcuts-box">
            <strong>Phím tắt nhanh:</strong>
            <ul>
              <li><kbd>Space</kbd> / <kbd>Enter</kbd> <span>Lật thẻ</span></li>
              <li><kbd>←</kbd> <span>Chưa nhớ (học lại)</span></li>
              <li><kbd>→</kbd> <span>Đã nhớ (SRS)</span></li>
            </ul>
          </div>
        </div>
      ` : `
        ${shouldShowSubtopic(q, result) ? `<p class="study-subtopic">${html(q.subtopic)}</p>` : ""}
        ${q.theory ? `<details class="theory"><summary>${icon("book")} Nhắc lý thuyết</summary><p>${html(q.theory)}</p></details>` : ""}
        ${q.hint ? `<details class="theory"><summary>Gợi ý nhỏ</summary><p>${html(q.hint)}</p></details>` : ""}
      `}
      <p class="study-tip">${isReview ? "Ôn lại để khắc sâu kiến thức.<br>Làm đúng sẽ loại khỏi danh sách sai." : "Cứ làm theo nhịp của bạn.<br>Tiến độ luôn được lưu lại."}</p>
    </aside></div></div>`;
}

function resultMarkup() {
  const result = state.data.snapshot.summary;
  if (!result) return homeMarkup();
  const isReview = result.purpose === "review";
  const set = !isReview ? state.data.sets.find((item) => item.id === result.setId) : null;
  const stats = !isReview ? summaryForSet(result.setId, result.filters) : null;
  const vocabularyMode = isVocabulary(result.mode);
  const mistakesCount = state.data?.mistakes?.length || 0;
  const remaining = isReview
    ? mistakesCount
    : result.mode === "grammar" ? stats?.grammarRemaining : result.mode === "practice" ? stats?.practiceRemaining : stats?.due;
  const unit = isReview ? "câu sai" : vocabularyMode ? "thẻ" : "câu";
  const wrong = result.results.filter((item) => !item.correct);
  return `<section class="result-page"><div class="result-mark">${icon("check")}</div><span class="eyebrow">${isReview ? "HOÀN THÀNH LƯỢT ÔN SAI" : vocabularyMode ? "HOÀN THÀNH LƯỢT THẺ GHI NHỚ" : "HOÀN THÀNH LƯỢT BÀI TẬP"}</span><h1>${isReview ? "Đã ôn tập xong." : vocabularyMode ? "Đã nạp xong từ vựng." : "Thêm một bước tiến."}</h1><p>${isReview ? "Ôn riêng các câu sai" : html(set?.name)} · ${result.total} ${unit} đã ${isReview ? "làm" : "hoàn thành"}</p>
    <div class="result-stats"><div><strong>${result.correct}<small>/${result.total}</small></strong><span>${vocabularyMode ? "đã nhớ" : "đúng"}</span></div><div><strong>${Math.round(result.correct * 100 / result.total)}<small>%</small></strong><span>${vocabularyMode ? "tỉ lệ nhớ" : "độ chính xác"}</span></div><div><strong>${Math.max(1, Math.round(result.durationMs / 60000))}</strong><span>phút tập trung</span></div></div>
    ${result.setIds && result.setIds.length > 1 ? `<div class="result-set-breakdown"><span class="eyebrow">KẾT QUẢ THEO TỪNG BỘ</span>${result.setIds.map((sId) => {
      const s = state.data.sets.find((item) => item.id === sId);
      const qs = result.results.filter((entry) => {
        const q = state.data.snapshot.questions.find((item) => item.id === entry.questionId);
        return q && q.setId === sId;
      });
      if (!qs.length) return "";
      const c = qs.filter((e) => e.correct).length;
      return `<div class="set-breakdown-row"><span>${html(s?.name || sId)}</span><strong>${c}/${qs.length} câu đúng (${Math.round(c * 100 / qs.length)}%)</strong></div>`;
    }).join("")}</div>` : ""}
    ${result.repeats ? `<p>Bạn đã ôn lại ${result.repeats} lần để nhớ chắc hơn.</p>` : ""}
    <div class="result-actions">${isReview
      ? (remaining ? button(`Ôn tiếp ${Math.min(20, remaining)} câu sai còn lại ${icon("arrow")}`, "review-mistakes", "button primary large") : '<span class="completed-note">Tuyệt vời! Bạn đã làm đúng hết các câu sai.</span>')
      : vocabularyMode
        ? (remaining ? button(`Ôn tiếp ${Math.min(30, remaining)} thẻ đến hạn ${icon("arrow")}`, "next-batch", "button primary large") : '<span class="completed-note">Đã xong lượt này. Hẹn bạn khi có từ đến hạn ôn tiếp!</span>')
        : (remaining ? button(`Làm tiếp ${Math.min(30, remaining)} câu ${icon("arrow")}`, "next-batch", "button primary large") : '<span class="completed-note">Đã hoàn thành các câu phù hợp trong bộ này.</span>')
    }${vocabularyMode && stats?.grammarRemaining ? button(`Làm bài tập áp dụng (Grammar) ${icon("arrow")}`, "begin", "button subtle", 'data-mode="grammar"') : ""}${button(isReview ? "Về trang chủ" : "Về bộ bài", "close-result", "button subtle")}</div>
    ${wrong.length ? `<details class="result-review"><summary>${vocabularyMode ? `Xem lại ${wrong.length} thẻ cần ôn thêm` : `Xem lại ${wrong.length} câu chưa đúng`}</summary>${wrong.map((item) => { const q = state.data.snapshot.questions.find((q) => q.id === item.questionId); return q ? `<article><h3>${html(q.context || q.prompt)}</h3><p class="muted">${vocabularyMode ? "Tự đánh giá: Chưa nhớ (đã xếp ôn lại)" : `Bạn trả lời: ${html(typeof item.answer === "object" ? displayAnswer(item.answer) : item.answer)}`}</p><p><strong>${html(displayAnswer(q.answer))}</strong></p><p>${html(q.explanation)}</p></article>` : ""; }).join("")}</details>` : ""}</section>`;
}


function statsMarkup() {
  const attempts = state.data?.snapshot?.attempts || state.data?.attempts || [];
  if (!attempts.length) {
    return `${intro("Thống kê học tập", "Theo dõi tiến độ, chuỗi ngày và thành tích của bạn.", "TIẾN TRÌNH")}
      <section class="empty-card stats-empty glass">
        <div class="stats-empty-icon">${icon("book")}</div>
        <h2>Chưa có dữ liệu học tập</h2>
        <p>Bắt đầu làm bài từ một bộ câu hỏi để theo dõi tiến độ, nhịp độ chuyên cần và mở khóa các huy hiệu thành tích.</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:16px;">
          ${button(`Bắt đầu học ngay ${icon("arrow")}`, "home", "button primary large")}
          ${!state.data?.sets?.length ? button(`${icon("book")} Thử bộ câu hỏi mẫu`, "load-sample", "button subtle large") : ""}
        </div>
      </section>`;
  }

  const xp = xpFromAttempts(attempts);
  const level = levelInfo(xp);
  const streaks = computeStreaks(attempts);
  const questions = state.data?.snapshot?.questions || [];
  const reviews = state.data?.snapshot?.reviews || [];
  const imports = state.data?.snapshot?.imports || [];
  const correctCount = attempts.filter((a) => a.correct).length;
  const accuracy = attempts.length ? Math.round((correctCount / attempts.length) * 100) : 0;
  const vocabularyKeys = collectVocabularyKeys(questions);
  const due = dueForecast(reviews, vocabularyKeys, 7);
  const dueToday = due[0] || 0;

  const activities = dailyActivity(attempts, 14);
  const maxActivity = Math.max(1, ...activities.map((a) => a.count));

  const weeks = heatmapWeeks(attempts, 17);
  const accByDomain = accuracyByDomain(questions, attempts);
  const masteryList = topicMastery(questions, attempts);
  const achievements = buildAchievements({ attempts, imports, reviews, questions });
  const mistakes = mistakeQuestions(questions, attempts);
  const maxForecast = Math.max(1, ...due);

  return `${intro("Thống kê học tập", "Theo dõi tiến độ, chuỗi ngày và thành tích của bạn.", "TIẾN TRÌNH")}
    <div class="stats-overview">
      <article class="overview-card glass">
        <span class="overview-label">CẤP ĐỘ HỌC TẬP</span>
        <strong>Cấp ${level.level}</strong>
        <small>${number(level.intoLevel)} / ${number(level.needed)} XP</small>
        <div class="progress-track" aria-label="Tiến độ lên cấp"><span style="width:${Math.round(level.progress * 100)}%;"></span></div>
      </article>
      <article class="overview-card glass">
        <span class="overview-label">CHUỖI NGÀY HỌC</span>
        <strong>${streaks.current} ngày</strong>
        <small>Kỷ lục: ${streaks.longest} ngày liên tiếp</small>
      </article>
      <article class="overview-card glass">
        <span class="overview-label">TỔNG LẦN LÀM</span>
        <strong>${number(attempts.length)} câu</strong>
        <small>${accuracy}% chính xác (${number(correctCount)} đúng)</small>
      </article>
      <article class="overview-card glass">
        <span class="overview-label">TỪ VỰNG ĐANG ÔN</span>
        <strong>${number(vocabularyKeys.length)} từ</strong>
        <small>${number(dueToday)} từ đến hạn hôm nay</small>
      </article>
    </div>

    <section class="stats-section glass">
      <div class="section-heading">
        <div><span class="eyebrow">CHUYÊN CẦN</span><h2>Hoạt động 14 ngày gần nhất</h2></div>
        <p>Số câu trả lời mỗi ngày kèm tỷ lệ làm đúng.</p>
      </div>
      <div class="activity-chart">
        ${activities.map((a) => {
          const height = Math.max(6, Math.round((a.count / maxActivity) * 100));
          const correctHeight = a.count > 0 ? Math.round((a.correct / a.count) * 100) : 0;
          const percent = a.count > 0 ? Math.round((a.correct / a.count) * 100) : 0;
          const detail = a.count > 0 ? `${a.count} câu (${a.correct} đúng · ${percent}% chính xác)` : "Chưa học ngày này";
          return `<div class="activity-column" tabindex="0" title="${html(a.label)}: ${detail}" aria-label="${html(a.label)}: ${detail}">
            <div class="column-tooltip">
              <strong>${html(a.label)}</strong>
              <span>${a.count} câu (${a.correct} đúng)</span>
              <strong class="tooltip-percent">${a.count > 0 ? `Tỉ lệ: ${percent}%` : "Chưa học"}</strong>
            </div>
            <span class="activity-bar" style="--bar-height:${height}%;"><i style="--correct-height:${correctHeight}%;"></i></span>
            <small>${html(a.label)}</small>
          </div>`;
        }).join("")}
      </div>
      <div class="chart-legend">
        <i class="legend-correct"></i><span>Đúng</span>
        <i class="legend-other"></i><span>Chưa đúng</span>
      </div>
    </section>

    <section class="stats-section glass">
      <div class="section-heading">
        <div><span class="eyebrow">NHỊP ĐỘ</span><h2>Lưới chuyên cần 17 tuần</h2></div>
        <p>Tần suất học tập theo từng ngày trong tuần.</p>
      </div>
      <div class="heatmap-wrap">
        <div class="heatmap-weekdays"><span></span><span>T2</span><span></span><span>T4</span><span></span><span>T6</span><span></span><span>CN</span></div>
        <div class="heatmap">
          ${weeks.map((week, idx) => {
            const monthDay = week.find((d) => d.monthStart);
            const monthLabel = monthDay ? `T${new Date(monthDay.ts).getMonth() + 1}` : "";
            return `<div class="heatmap-week" data-week="${idx}">
              <span class="heatmap-month">${monthLabel}</span>
              ${week.map((d) => `<span class="heat-cell ${d.future ? "heat-future" : `heat-${d.level}`}" title="${html(d.label)}: ${d.count} câu"></span>`).join("")}
            </div>`;
          }).join("")}
        </div>
      </div>
    </section>

    <section class="stats-section glass">
      <div class="section-heading">
        <div><span class="eyebrow">CHẤT LƯỢNG</span><h2>Tỷ lệ chính xác theo phân môn</h2></div>
        <p>Tỷ lệ trả lời đúng theo từng loại nội dung.</p>
      </div>
      <div class="domain-accuracy">
        <div class="accuracy-card glass">
          <div class="accuracy-ring" style="--accuracy:${accByDomain.grammar.accuracy ?? 0}%;">
            <span>${accByDomain.grammar.accuracy != null ? `${accByDomain.grammar.accuracy}%` : "—"}</span>
          </div>
          <div><h3>Ngữ pháp</h3><p>${number(accByDomain.grammar.correct)}/${number(accByDomain.grammar.total)} câu</p></div>
        </div>
        <div class="accuracy-card glass">
          <div class="accuracy-ring" style="--accuracy:${accByDomain.vocabulary.accuracy ?? 0}%;">
            <span>${accByDomain.vocabulary.accuracy != null ? `${accByDomain.vocabulary.accuracy}%` : "—"}</span>
          </div>
          <div><h3>Từ vựng (SRS)</h3><p>${number(accByDomain.vocabulary.correct)}/${number(accByDomain.vocabulary.total)} câu</p></div>
        </div>
        <div class="accuracy-card glass">
          <div class="accuracy-ring" style="--accuracy:${accByDomain.practice.accuracy ?? 0}%;">
            <span>${accByDomain.practice.accuracy != null ? `${accByDomain.practice.accuracy}%` : "—"}</span>
          </div>
          <div><h3>Khoa học tự nhiên</h3><p>${number(accByDomain.practice.correct)}/${number(accByDomain.practice.total)} câu</p></div>
        </div>
      </div>
    </section>

    <section class="stats-section glass">
      <div class="section-heading">
        <div><span class="eyebrow">CHỦ ĐIỂM</span><h2>Độ vững kiến thức theo chủ đề</h2></div>
        <p>Số câu đã thử sức và tỷ lệ làm đúng trên từng chủ điểm.</p>
      </div>
      ${masteryList.length ? `<div class="mastery-list">
        ${masteryList.map((m) => `<div class="mastery-row">
          <div class="mastery-title">
            <strong>${html(m.topic)}</strong>
            <span><span class="pill">${html(subjectName(m.subject || m.domain))}</span></span>
          </div>
          <div class="mastery-meter">
            <div class="progress-track"><span style="width:${Math.round(m.coverage * 100)}%;"></span></div>
            <small>Đã làm ${m.attempted}/${m.total} câu</small>
          </div>
          <div class="mastery-accuracy">
            <strong>${m.accuracy != null ? `${m.accuracy}%` : "—"}</strong>
            <small>chính xác</small>
          </div>
        </div>`).join("")}
      </div>` : '<p class="stats-inline-empty">Làm bài luyện tập để bắt đầu ghi nhận tiến độ chủ điểm.</p>'}
    </section>

    ${vocabularyKeys.length ? `<section class="stats-section glass">
      <div class="section-heading">
        <div><span class="eyebrow">LỊCH ÔN SRS</span><h2>Dự báo từ vựng đến hạn (7 ngày)</h2></div>
        <p>Số từ vựng đến hạn ôn tập trong tuần tới theo thuật toán SRS.</p>
      </div>
      <div class="forecast-chart">
        ${due.map((count, idx) => {
          const height = Math.max(8, Math.round((count / maxForecast) * 100));
          return `<div class="forecast-column">
            <strong>${count}</strong>
            <span class="forecast-bar" style="--forecast-height:${height}%;"></span>
            <small>${idx === 0 ? "Hôm nay" : `+${idx} ngày`}</small>
          </div>`;
        }).join("")}
      </div>
    </section>` : ""}

    <section class="stats-section glass">
      <div class="section-heading">
        <div><span class="eyebrow">THÀNH TÍCH</span><h2>Huy hiệu học tập</h2></div>
        <p>${achievements.filter((a) => a.unlocked).length}/${achievements.length} huy hiệu đã mở khóa.</p>
      </div>
      <div class="achievements-grid">
        ${achievements.map((a) => `<article class="achievement-card glass ${a.unlocked ? "unlocked" : "achievement-locked"} ${a.tierClass || ""}">
          <div class="achievement-top">
            <span class="achievement-icon">${a.icon}</span>
            <span class="tier-tag ${a.tierClass || ""}">${a.tierIcon || ""} ${html(a.tier || "")}</span>
          </div>
          <h3>${html(a.name)}</h3>
          <p>${html(a.description)}</p>
          ${!a.unlocked
            ? `<div class="progress-track"><span style="width:${Math.round((a.value * 100) / a.target)}%;"></span></div><small>${number(a.value)}/${number(a.target)}</small>`
            : '<small class="achievement-done">✓ Đã đạt</small>'}
        </article>`).join("")}
      </div>
    </section>

    ${mistakes.length ? `<section class="stats-section glass">
      <div class="section-heading">
        <div><span class="eyebrow">CẦN LƯU Ý</span><h2>Câu sai gần nhất</h2></div>
        <p>Các câu có lần trả lời gần đây nhất chưa đúng.</p>
      </div>
      <div class="mistakes-list">
        ${mistakes.map((q) => `<article>
          <div>
            <span class="pill">${subjectName(q.subject)}</span>
            <span class="pill">${html(q.topic)}</span>
          </div>
          <h3>${html(q.context || q.prompt)}</h3>
          <p>Đáp án đúng: <strong>${html(displayAnswer(q.answer))}</strong></p>
        </article>`).join("")}
      </div>
    </section>` : ""}`;
}

function render() {
  if (!state.data) return;
  try {
    const active = root.contains(document.activeElement) ? document.activeElement : null;
    const focus = active ? { id: active.id, action: active.dataset.action, index: active.dataset.index, filter: active.dataset.filter, mode: active.dataset.mode } : null;
    ensureTimerInterval();
    const markup = state.view === "study" ? currentSession() ? sessionMarkup() : resultMarkup()
      : state.view === "library" ? libraryMarkup()
      : state.view === "stats" ? statsMarkup()
      : state.view === "data" ? dataMarkup() : homeMarkup();
    let main = root.querySelector("#main");
    const headerEl = root.querySelector(".header");
    const footerEl = root.querySelector(".footer");
    const headerHtml = header();
    if (main && headerEl && footerEl) {
      if (headerEl.outerHTML !== headerHtml) headerEl.outerHTML = headerHtml;
      const newClass = `main ${state.view === "study" ? "study-main" : ""}`;
      if (main.className !== newClass) main.className = newClass;
      main.setAttribute("aria-busy", String(state.busy));
      main.innerHTML = markup;
    } else {
      root.innerHTML = `${headerHtml}<main id="main" class="main ${state.view === "study" ? "study-main" : ""}" aria-busy="${state.busy}">${markup}</main><footer class="footer"><span>NẮM HỌC TẬP</span><span>Mỗi ngày một chút, nhớ lâu hơn.</span></footer>`;
    }
    if (focus) {
      const replacement = focus.id ? document.getElementById(focus.id) : [...root.querySelectorAll("button, select, input, textarea")].find((el) =>
        (focus.action || focus.filter) && el.dataset.action === focus.action && el.dataset.index === focus.index && el.dataset.filter === focus.filter && el.dataset.mode === focus.mode);
      replacement?.focus({ preventScroll: true });
    }
  } catch (error) {
    console.error("Lỗi giao diện:", error);
    root.innerHTML = `${header()}<main id="main" class="main"><div class="validation error" role="alert" style="margin:40px auto;max-width:600px;padding:24px;border-radius:var(--radius);background:var(--red-light);border:1px solid var(--red-border);"><span class="eyebrow">ĐÃ XẢY RA LỖI GIAO DIỆN</span><h2 style="margin:8px 0;color:var(--red);">${html(error.message || "Không thể hiển thị trang này.")}</h2><p>Dữ liệu học tập của bạn vẫn an toàn trên thiết bị. Bạn hãy bấm <strong>Tải lại trang</strong> bên dưới (hoặc nhấn <code>Ctrl + Shift + R</code>) để nạp bản cập nhật mới nhất.</p><div style="display:flex;gap:12px;margin-top:16px;">${button("Tải lại trang", "reload-page", "button primary")}${button("Về trang Dữ liệu", "data", "button subtle")}</div></div></main><footer class="footer"><span>NẮM HỌC TẬP</span><span>Mỗi ngày một chút, nhớ lâu hơn.</span></footer>`;
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


function renderMixModal(subject, mode = null) {
  const sets = state.data.sets.filter((s) => s.subject === subject);
  const isEnglish = subject === "english";
  const defaultMode = mode || (isEnglish ? "grammar" : "practice");
  const subjects = [...new Set(state.data.sets.map((s) => s.subject))].sort();
  showModal(`<h2>Trộn nhiều bộ bài</h2><p class="modal-description">Chọn từ 2 bộ bài trở lên cùng môn để học chung một lượt.</p>
    ${subjects.length > 1 ? `<label class="field-label">Môn học<select id="mix-subject">${subjects.map((s) => option(s, subjectName(s), subject)).join("")}</select></label>` : ""}
    ${isEnglish ? `<label class="field-label">Chế độ học<select id="mix-mode">${option("flashcards", "Vocabulary (Từ vựng) — Thẻ ghi nhớ", defaultMode === "grammar" ? "" : "flashcards")}${option("grammar", "Grammar (Ngữ pháp) — Bài tập áp dụng nhiều dạng", defaultMode === "grammar" ? "grammar" : "")}</select></label>` : ""}
    <label class="field-label">Chọn các bộ muốn trộn (tối thiểu 2 bộ)</label>
    <div class="mix-set-list">${sets.map((s) => `<label class="mix-set-item"><input type="checkbox" name="mix-set" value="${html(s.id)}" checked><div><strong>${html(s.name)}</strong><small>${s.count} câu</small></div></label>`).join("")}</div>
    <label class="field-label">Số câu mỗi lượt<select id="mix-limit">${option("10", "10 câu", "30")}${option("20", "20 câu", "30")}${option("30", "30 câu", "30")}</select></label>
    <div class="modal-actions">${button("Hủy", "close-modal", "button subtle")}${button(`Bắt đầu trộn ${icon("arrow")}`, "start-mix", "button primary large")}</div>`);

  const subjectSelect = modal.querySelector("#mix-subject");
  if (subjectSelect) {
    subjectSelect.addEventListener("change", (e) => {
      renderMixModal(e.target.value);
    });
  }
}
async function invokeAction(target) {
  const name = target.dataset.action;
  if (state.busy) return;
  if (["home", "library", "stats", "data", "pause"].includes(name)) {
    const s = currentSession();
    if (s && !s.result) { clearTimeout(draftTimer); await repository.saveDraft(s.id, s.step, state.draft); }
    if (state.view === "study" && currentSession()) state.studyStartedAt = null;
    state.view = name === "pause" ? "home" : name; stopSpeaking(); render(); window.scrollTo(0, 0); return;
  }
  if (name === "toggle-theme") { cycleTheme(); return; }
  if (name === "toggle-timer") {
    state.timerVisible = !state.timerVisible;
    if (state.timerVisible && !state.studyStartedAt) state.studyStartedAt = Date.now();
    render();
    return;
  }
  if (name === "help-shortcuts") {
    showModal(`<h2>Phím tắt bàn phím</h2>
      <p class="modal-description">Học tập nhanh hơn và tiện lợi hơn trên máy tính.</p>
      <dl class="shortcut-list">
        <dt><kbd>Enter</kbd></dt><dd>Chấm bài hoặc chuyển sang câu tiếp theo</dd>
        <dt><kbd>1</kbd> – <kbd>9</kbd></dt><dd>Chọn nhanh đáp án trắc nghiệm</dd>
        <dt><kbd>Esc</kbd></dt><dd>Lưu nháp và tạm dừng lượt học</dd>
        <dt><kbd>Space</kbd></dt><dd>Lật thẻ ghi nhớ (Flashcards)</dd>
        <dt><kbd>←</kbd> / <kbd>→</kbd></dt><dd>Đánh giá Chưa nhớ / Đã nhớ trong Thẻ ghi nhớ</dd>
        <dt><kbd>H</kbd> <kbd>L</kbd> <kbd>S</kbd> <kbd>D</kbd></dt><dd>Chuyển nhanh giữa Luyện tập, Bộ bài, Thống kê, Dữ liệu</dd>
        <dt><kbd>A</kbd></dt><dd>Điều chỉnh cỡ chữ hiển thị</dd>
        <dt><kbd>?</kbd></dt><dd>Mở bảng trợ giúp phím tắt</dd>
      </dl>
      <div class="modal-actions">${button("Đã hiểu", "close-modal", "button primary large")}</div>`);
    return;
  }
  if (name === "load-sample") {
    await run(async () => {
      const preview = buildCsvPreview(SAMPLE_CSV, "tieng_anh_b1_b2_mau.csv");
      await repository.importQuestions(preview.rows, "tieng_anh_b1_b2_mau.csv", "Tiếng Anh B1–B2 (Bộ mẫu)");
      state.view = "home";
      state.level = state.topic = state.grade = state.type = "all";
      state.limit = 30;
      toast("Đã thêm bộ bài mẫu gồm 24 câu hỏi!");
    });
    return;
  }
  if (name === "import") { csvPreview = null; importMarkup(); return; }
  if (name === "close-modal") { closeModal(); return; }
  if (name === "confirm") {
    const callback = modalAction;
    closeModal();
    await run(callback); return;
  }
  if (name === "resume") { state.flipped = false; state.view = "study"; render(); return; }
  if (name === "review-mistakes") {
    state.flipped = false;
    await run(async () => {
      await repository.startMistakesSession({ limit: 20 });
      state.view = "study";
    });
    window.scrollTo(0, 0);
    return;
  }
  if (name === "open-mix-modal") {
    const currentSubj = selectedSet()?.subject || (state.subject !== "all" ? state.subject : state.data.sets[0]?.subject);
    renderMixModal(currentSubj);
    return;
  }
  if (name === "start-mix") {
    const checked = [...modal.querySelectorAll('input[name="mix-set"]:checked')].map((el) => el.value);
    if (checked.length < 2) {
      toast("Hãy chọn ít nhất 2 bộ bài để trộn.", true);
      return;
    }
    const subjEl = modal.querySelector("#mix-subject");
    const subj = subjEl ? subjEl.value : selectedSet()?.subject || state.data.sets[0]?.subject;
    const modeEl = modal.querySelector("#mix-mode");
    const mode = modeEl ? modeEl.value : (subj === "english" ? "grammar" : "practice");
    const limitEl = modal.querySelector("#mix-limit");
    const limit = Number(limitEl?.value) || 30;

    state.flipped = false;
    await run(async () => {
      await repository.startSession({ setIds: checked, mode, limit });
      closeModal();
      state.view = "study";
    });
    window.scrollTo(0, 0);
    return;
  }
  if (name === "end") {
    const sessionId = currentSession()?.id;
    confirmation("Kết thúc lượt đang học?", "Các câu đã chấm được giữ lại. Câu chưa làm sẽ nằm trong lượt tiếp theo.", () => repository.endSession(sessionId), "Kết thúc lượt");
    return;
  }
  if (name === "start-due-vocab") {
    state.flipped = false;
    const setId = target.dataset.setId || state.data.selectedSetId;
    let targetSetId = setId;
    const currentDue = summaryForSet(targetSetId).dueToday || 0;
    if (currentDue === 0) {
      const otherSet = state.data.sets.find((s) => s.subject === "english" && (summaryForSet(s.id).dueToday || 0) > 0);
      if (otherSet) targetSetId = otherSet.id;
    }
    const count = summaryForSet(targetSetId).dueToday || 0;
    if (count === 0) {
      toast("Không có từ vựng nào đến hạn ôn hôm nay.");
      return;
    }
    const limit = Math.min(Number(state.limit) || 30, count);
    await run(async () => {
      await repository.selectSet(targetSetId);
      await repository.startSession({
        setId: targetSetId,
        mode: "flashcards",
        dueOnly: true,
        limit,
      });
      state.view = "study";
    });
    window.scrollTo(0, 0);
    return;
  }
  if (name === "enable-due-notifications") {
    await requestDueNotificationPermission();
    render();
    return;
  }
  if (name === "open-font-size") { renderFontSizeModal(); return; }
  if (name === "font-size-inc") { applyFontSize(currentFontSize() + 1); return; }
  if (name === "font-size-dec") { applyFontSize(currentFontSize() - 1); return; }
  if (name === "font-size-set") { applyFontSize(Number(target.dataset.size)); return; }
  if (name === "font-size-reset") { applyFontSize(16); return; }
  if (name === "begin") {
    state.flipped = false;
    await run(async () => { await repository.startSession({ setId: state.data.selectedSetId, mode: target.dataset.mode, level: state.level, topic: state.topic, grade: state.grade, type: state.type, limit: Number(state.limit) || 30 }); state.view = "study"; });
    window.scrollTo(0, 0); return;
  }
  if (name === "option") {
    if (currentSession()?.result) return;
    const index = Number(target.dataset.index);
    const q = currentQuestion();
    if (!q) return;
    if (q.type === "mcq") {
      state.draft.selected = [index];
      const form = root.querySelector("[data-answer-form]");
      if (form) {
        form.querySelectorAll('[data-action="option"]').forEach((btn) => {
          const isSelected = Number(btn.dataset.index) === index;
          btn.classList.toggle("selected", isSelected);
          btn.setAttribute("aria-pressed", String(isSelected));
        });
        updateSubmit();
      } else {
        render();
      }
    } else {
      state.draft.selected = state.draft.selected.includes(index)
        ? state.draft.selected.filter((i) => i !== index)
        : [...state.draft.selected, index];
      target.classList.toggle("selected", state.draft.selected.includes(index));
      target.setAttribute("aria-pressed", String(state.draft.selected.includes(index)));
      updateSubmit();
    }
    saveDraft();
    return;
  }
  if (["add-token", "remove-token"].includes(name)) {
    if (currentSession()?.result) return;
    const index = Number(target.dataset.index);
    if (name === "add-token" && !state.draft.ordered.includes(index)) state.draft.ordered.push(index);
    else if (name === "remove-token") state.draft.ordered = state.draft.ordered.filter((i) => i !== index);
    saveDraft();
    const form = root.querySelector("[data-answer-form]");
    if (form) {
      form.innerHTML = answerMarkup(currentQuestion(), null);
      updateSubmit();
    } else {
      render();
    }
    return;
  }
  if (name === "submit" && answerReady()) { await submit(receivedAnswer(currentQuestion())); return; }
  if (name === "next") {
    state.flipped = false;
    const s = currentSession();
    if (s) await run(() => repository.advance(s.id, s.step));
    window.scrollTo(0, 0);
    return;
  }
  if (name === "flip") { state.flipped = true; render(); return; }
  if (name === "unflip") { state.flipped = false; render(); return; }
  if (["grade-forgot", "grade-remember"].includes(name) && state.flipped) { await submit(name === "grade-remember"); return; }
  if (name === "speak") {
    const q = currentQuestion();
    if (q?.subject === "english") {
      if (currentSession()?.mode === "flashcards") {
        const f = getFlashcardData(q);
        speakEnglish(f.word || q.prompt);
      } else {
        const cleanWord = q.prompt ? q.prompt.replace(/\s*\/[^/]+\/.*$/, "").replace(/\s*\(.*\)$/, "").trim() : "";
        speakEnglish(cleanWord || q.context || q.prompt);
      }
    }
    return;
  }
  if (name === "reload-page") {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      void navigator.serviceWorker.getRegistrations().then(async (regs) => {
        for (const reg of regs) { await reg.unregister(); }
        if (typeof caches !== "undefined") {
          const keys = await caches.keys();
          for (const key of keys) { await caches.delete(key); }
        }
        location.reload();
      }).catch(() => location.reload());
      return;
    }
    location.reload();
    return;
  }
  if (name === "search-mode-sets") { state.searchMode = "sets"; state.search = ""; render(); return; }
  if (name === "search-mode-questions") { state.searchMode = "questions"; state.search = ""; render(); return; }
  if (name === "export-report-md") {
    const md = generateReportMarkdown({
      questions: state.data.snapshot.questions,
      attempts: state.data.snapshot.attempts,
      imports: state.data.snapshot.imports,
    });
    download(`nam-english-report-${new Date().toISOString().slice(0, 10)}.md`, md, "text/markdown");
    return;
  }
  if (name === "export-report-csv") {
    const csv = generateReportCsv({
      questions: state.data.snapshot.questions,
      attempts: state.data.snapshot.attempts,
      imports: state.data.snapshot.imports,
    });
    download(`nam-english-report-${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv");
    return;
  }
  if (name === "choose") {
    const set = state.data.sets.find((item) => item.id === target.dataset.id);
    await run(async () => { await repository.selectSet(target.dataset.id); state.subject = set?.subject || "all"; state.level = state.topic = state.grade = state.type = "all"; state.limit = 30; state.view = "home"; });
    window.scrollTo(0, 0);
    return;
  }
  if (name === "close-result") { await run(async () => { await repository.dismissSummary(); state.view = "home"; }); return; }
  if (name === "next-batch") {
    const result = state.data.snapshot.summary;
    await run(() => repository.startSession({ setId: result.setId, setIds: result.setIds, mode: result.mode, ...(result.filters ?? {}) }));
    return;
  }
  if (name === "save-csv") {
    if (!csvPreview || csvPreview.errors.length) return;
    const preview = csvPreview, setName = document.querySelector("#set-name").value.trim();
    if (!setName) { toast("Hãy đặt tên cho bộ bài.", true); return; }
    target.disabled = true;
    await run(async () => { await repository.importQuestions(preview.rows, preview.filename, setName); closeModal(); state.view = "home"; state.level = state.topic = state.type = "all"; state.limit = 30; toast(`Đã thêm ${preview.rows.length} câu vào bộ mới.`); }); return;
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
  if (name === "share-set") {
    const set = state.data.sets.find((item) => item.id === target.dataset.id);
    if (!set) return;
    const qs = state.data.snapshot.questions.filter((q) => q.setId === set.id);
    const csv = questionsToCsv(qs);
    const encoded = encodeSharePayload(csv);
    if (encoded.length > MAX_SHARE_BYTES) {
      showModal(`<h2>Bộ bài vượt quá 50 KB</h2>
        <p class="modal-description">Bộ bài này (${Math.round(encoded.length / 1024)} KB) vượt quá giới hạn 50 KB để chia sẻ qua link URL. Hãy dùng tính năng “Tải CSV” để gửi file cho người học.</p>
        <div class="modal-actions">
          ${button("Đóng", "close-modal", "button subtle")}
          ${button("Tải CSV", "export-set", "button primary", `data-id="${html(set.id)}"`)}
        </div>`);
      return;
    }
    const shareUrl = `${location.origin}${location.pathname}#import=${encoded}`;
    showModal(`<h2>Chia sẻ bộ bài</h2>
      <p class="modal-description">Gửi đường dẫn này cho người học. Đường dẫn chứa toàn bộ nội dung câu hỏi và đáp án của bộ “${html(set.name)}”.</p>
      <label class="field-label" for="share-link-input">Đường dẫn chia sẻ
        <input id="share-link-input" readonly value="${html(shareUrl)}" onclick="this.select()">
      </label>
      <div class="modal-actions">
        ${button("Đóng", "close-modal", "button subtle")}
        ${button(`${icon("check")} Sao chép link`, "copy-share-link", "button primary large")}
      </div>`);
    return;
  }
  if (name === "copy-share-link") {
    const input = modal.querySelector("#share-link-input");
    if (input) {
      input.select();
      await navigator.clipboard?.writeText?.(input.value);
      toast("Đã sao chép đường dẫn chia sẻ vào bộ nhớ tạm!");
      closeModal();
    }
    return;
  }
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

const action = invokeAction;

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
    if (state.searchMode === "questions") {
      const container = root.querySelector("#question-search-results");
      if (container) container.innerHTML = questionSearchResultsMarkup();
    } else {
      const container = root.querySelector("#set-list");
      if (container) {
        const sets = state.data.sets.filter((set) => set.name.toLocaleLowerCase("vi").includes(state.search.toLocaleLowerCase("vi")));
        container.innerHTML = sets.map(setCard).join("") || '<p class="search-empty">Chưa tìm thấy bộ nào khớp tên này.</p>';
      }
    }
  }
});
document.addEventListener("change", async (event) => {
  const target = event.target;
  if (target.matches("[data-csv]") && target.files[0]) { void loadCsv(target.files[0]); return; }
  if (target.matches("[data-match]")) { state.draft.matches[target.dataset.match] = target.value; saveDraft(); updateSubmit(); return; }
  if (target.dataset.filter === "set") { await run(async () => { await repository.selectSet(target.value); state.level = state.topic = state.grade = state.type = "all"; state.limit = 30; }); return; }
  if (target.dataset.filter === "subject") {
    state.subject = target.value;
    const first = state.data.sets.find((set) => state.subject === "all" || set.subject === state.subject);
    if (first && first.id !== state.data.selectedSetId) {
      await run(async () => { await repository.selectSet(first.id); state.level = state.topic = state.grade = state.type = "all"; state.limit = 30; });
    } else {
      state.level = state.topic = state.grade = state.type = "all"; state.limit = 30;
      render();
    }
    return;
  }
  if (target.dataset.filter === "level") { state.level = target.value; state.topic = "all"; render(); }
  if (target.dataset.filter === "grade") { state.grade = target.value; state.topic = "all"; render(); }
  if (target.dataset.filter === "topic") { state.topic = target.value; render(); }
  if (target.dataset.filter === "type") { state.type = target.value; render(); }
  if (target.dataset.filter === "limit") { state.limit = Number(target.value) || 30; render(); }
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
  if (state.busy || event.ctrlKey || event.altKey || event.metaKey || event.isComposing) return;
  const target = event.target;
  const interactiveTarget = target?.closest("button, a, summary, input, select, textarea");
  const isInputField = interactiveTarget && ["INPUT", "SELECT", "TEXTAREA"].includes(interactiveTarget.tagName);

  if (event.key === "Escape") {
    const escapeAction = resolveEscapeAction({
      modalOpen: modal.open,
      view: state.view,
      sessionMode: currentSession()?.mode,
      sessionResult: currentSession()?.result,
      flipped: state.flipped,
    });
    if (escapeAction === "close-modal") {
      closeModal();
      return;
    }
    if (escapeAction === "unflip") {
      event.preventDefault();
      invokeAction({ dataset: { action: "unflip" } });
      return;
    }
    if (escapeAction === "pause") {
      event.preventDefault();
      invokeAction({ dataset: { action: "pause" } });
      return;
    }
  }

  if (modal.open) return;

  if (event.key === "?" && !isInputField) {
    event.preventDefault();
    invokeAction({ dataset: { action: "help-shortcuts" } });
    return;
  }

  if (!isInputField) {
    const k = event.key.toLowerCase();
    if (k === "a") {
      event.preventDefault();
      invokeAction({ dataset: { action: "open-font-size" } });
      return;
    }
  }

  if (state.view !== "study" && !isInputField) {
    const k = event.key.toLowerCase();
    if (k === "h") { state.view = "home"; render(); return; }
    if (k === "l") { state.view = "library"; render(); return; }
    if (k === "s") { state.view = "stats"; render(); return; }
    if (k === "d") { state.view = "data"; render(); return; }
  }

  if (state.view === "study" && currentSession()?.mode === "flashcards" && !isInputField) {
    const s = currentSession();
    if (s?.result) {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        invokeAction({ dataset: { action: "next" } });
        return;
      }
    } else {
      if (event.key === " " || (event.key === "Enter" && !state.flipped)) {
        event.preventDefault();
        invokeAction({ dataset: { action: state.flipped ? "unflip" : "flip" } });
        return;
      }
      if (event.key === "ArrowLeft" && state.flipped) {
        event.preventDefault();
        invokeAction({ dataset: { action: "grade-forgot" } });
        return;
      }
      if (event.key === "ArrowRight" && state.flipped) {
        event.preventDefault();
        invokeAction({ dataset: { action: "grade-remember" } });
        return;
      }
      if ((event.key === "ArrowUp" || event.key === "Escape") && state.flipped) {
        event.preventDefault();
        invokeAction({ dataset: { action: "unflip" } });
        return;
      }
    }
  }

  if (state.view !== "study") return;
  const session = currentSession(); if (!session) return;

  if (event.key === "Enter" && !event.shiftKey) {
    if (session.result) {
      if (!interactiveTarget || interactiveTarget.tagName === "INPUT") {
        event.preventDefault();
        if (session.result) invokeAction({ dataset: { action: "next" } });
      }
    } else if (session.mode !== "flashcards" && answerReady()) {
      if (target.matches("[data-answer]") || !interactiveTarget) {
        event.preventDefault();
        void submit(receivedAnswer(currentQuestion()));
      }
    }
  }
  if (!interactiveTarget && !session.result && /^[1-9]$/.test(event.key)) {
    const choice = root.querySelector(`[data-action="option"][data-index="${Number(event.key) - 1}"]`);
    if (choice) { event.preventDefault(); void invokeAction(choice); }
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


async function checkShareHash() {
  const hash = window.location.hash;
  if (!hash || !hash.startsWith("#import=")) return;
  if (state.busy) return;
  const encoded = hash.slice("#import=".length);
  history.replaceState(null, "", location.pathname + location.search);
  if (!encoded) return;

  if (encoded.length > MAX_SHARE_BYTES) {
    toast("Đường dẫn chia sẻ vượt quá giới hạn 50 KB.", true);
    return;
  }
  try {
    const csv = decodeSharePayload(encoded);
    csvPreview = buildCsvPreview(csv, "shared.csv");
    if (csvPreview.errors.length) {
      toast(`Dữ liệu chia sẻ bị lỗi: ${csvPreview.errors[0]}`, true);
      csvPreview = null;
      return;
    }
    const subject = csvPreview.rows[0].subject;
    const count = csvPreview.rows.length;
    const defaultName = `Bộ chia sẻ - ${subjectName(subject)}`;
    showModal(`<h2>Nhập bộ bài được chia sẻ</h2>
      <p class="modal-description">Bạn vừa nhận được một bộ bài gồm <strong>${count} câu hỏi</strong> môn <strong>${subjectName(subject)}</strong>.</p>
      <div class="validation success"><strong>${icon("check")} ${count} câu hợp lệ</strong><span>Sẵn sàng thêm vào kho bài trên máy này.</span></div>
      <label class="field-label" for="set-name">Tên bộ bài
        <input id="set-name" maxlength="120" value="${html(defaultName)}">
      </label>
      <div class="modal-actions">
        ${button("Hủy bỏ", "close-modal", "button subtle")}
        ${button("Thêm vào kho", "save-csv", "button primary large")}
      </div>`);
  } catch (err) {
    toast(err.message || "Đường dẫn chia sẻ không hợp lệ hoặc bị hỏng.", true);
  }
}
async function start() {
  try {
    try {
      const savedTheme = localStorage.getItem("nam-theme");
      if (savedTheme === "light" || savedTheme === "dark") document.documentElement.dataset.theme = savedTheme;
      const savedFontSize = localStorage.getItem("nam-font-size");
      if (savedFontSize && !isNaN(Number(savedFontSize))) {
        applyFontSize(Number(savedFontSize));
      }
    } catch {}
    repository = await createRepository();
    state.data = await readDashboard(repository);
    const queryView = new URLSearchParams(location.search).get("view");
    if (["home", "library", "stats", "data"].includes(queryView)) {
      state.view = queryView;
    } else {
      state.view = state.data.snapshot.session || state.data.snapshot.summary ? "study" : "home";
    }
    syncDraft(); render();
    checkAndSendDueNotification(false);
    void checkShareHash();
    window.addEventListener("hashchange", () => void checkShareHash());
    repository.subscribe(() => { clearTimeout(syncTimer); syncTimer = setTimeout(() => { if (!state.busy) void refresh().catch((e) => toast(e.message, true)); }, 250); });
  } catch (error) {
    root.innerHTML = `<main class="boot-error"><span class="brand-symbol">${icon("book")}</span><h1>Chưa mở được kho bài.</h1><p>${html(error.message)}</p><button class="button primary" onclick="location.reload()">Thử lại</button><small>Các bộ bài đã lưu vẫn nằm trên thiết bị.</small></main>`;
  }
}
void start();
