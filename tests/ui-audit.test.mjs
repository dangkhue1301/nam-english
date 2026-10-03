import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import vm from "node:vm";
import * as core from "../core.js";
import * as stats from "../stats.js";
import { remainingQuestionCount } from "../storage.js";
import { question } from "./helpers.mjs";

const source = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
function contextWith(names, extra = {}) {
  const context = vm.createContext({ ...core, ...stats, remainingQuestionCount,
    html: v => String(v ?? ""), icon: () => "", button: () => "", ...extra });
  for (const name of names) {
    let start = source.indexOf("function " + name + "(");
    assert.ok(start >= 0, name);
    if (source.slice(start - 6, start) === "async ") start -= 6;
    const firstLineEnd = source.indexOf("\n", start);
    const end = source.slice(start, firstLineEnd).trimEnd().endsWith("}") ? firstLineEnd : source.indexOf("\n}", start) + 2;
    vm.runInContext(source.slice(start, end), context);
  }
  return context;
}
const allFilters = () => Object.fromEntries(["grade", "level", "topic", "type", "chapter", "lesson", "section"].map(key => [key, "all"]));

test("a selected question type remains visible and removable after narrowing the level to zero matches", () => {
  const state = { ...allFilters(), level: "B2", type: "matching", filtersOpen: true };
  const set = { id: "en", subject: "english" };
  const c = contextWith(["option", "activeStudyFilters", "filterChips", "studyFiltersMarkup"], { state, selectedSet: () => set });
  const questions = [question({ type: "matching", level: "B1" }), question({ type: "mcq", level: "B2" })];
  let markup = c.studyFiltersMarkup(set, questions);
  const typeSelect = markup.match(/<select data-filter="type">([\s\S]*?)<\/select>/)?.[1];
  assert.match(typeSelect, /<option value="matching" selected>/);
  assert.match(typeSelect, /<option value="all"/);
  state.level = "C1";
  markup = c.studyFiltersMarkup(set, questions);
  assert.match(markup, /<select data-filter="type">[\s\S]*?<option value="matching" selected>/);
});

test("switching selected sets through a remote refresh clears Japanese scope filters", async () => {
  const nextSet = { id: "en", subject: "english" };
  const nextData = { selectedSetId: "en", sets: [nextSet], snapshot: { questions: [question({ setId: "en" })], attempts: [], reviews: [] } };
  const state = { ...allFilters(), subject: "japanese", chapter: "2", lesson: "1", section: "kanji", data: { selectedSetId: "ja" } };
  const c = contextWith(["activeStudyFilters", "studyModeOptions", "refresh"], { state, repository: {}, readDashboard: async () => nextData,
    selectedSet: () => nextSet, syncDraft: () => {}, render: () => {}, checkAndSendDueNotification: () => {} });
  await c.refresh();
  assert.equal(state.subject, "english");
  assert.equal(c.studyModeOptions(nextData.snapshot, nextSet, c.activeStudyFilters())[0].remaining, 1);
  assert.equal(state.section, "all");
});

function keyboardHarness(mode, result, tagName) {
  const calls = [];
  let handler;
  const target = { tagName, closest: selector => selector.startsWith("button, a, summary") && tagName !== "DIV" ? target : null, matches: () => false };
  const context = vm.createContext({ ...core, state: { view: "study", busy: false, flipped: true }, modal: { open: false },
    document: { addEventListener: (type, callback) => { if (type === "keydown") handler = callback; } },
    currentSession: () => ({ mode, result }), invokeAction: t => calls.push(t.dataset.action), dispatchAction: t => calls.push(t.dataset.action),
    answerReady: () => false, root: { querySelector: () => null } });
  vm.runInContext(source.slice(source.indexOf('document.addEventListener("keydown"'), source.indexOf('document.addEventListener("dragover"')), context);
  return { calls, press(key) { let prevented = false; handler({ key, target, preventDefault: () => { prevented = true; } }); return prevented; } };
}

test("flashcard shortcuts respect native Enter/Space activation on buttons, links and disclosures", () => {
  for (const tagName of ["BUTTON", "A", "SUMMARY"]) {
    for (const result of [null, { correct: true }]) {
      for (const key of ["Enter", " "]) {
        const h = keyboardHarness("flashcards", result, tagName);
        assert.equal(h.press(key), false, `${tagName} ${key} ${Boolean(result)}`);
        assert.deepEqual(h.calls, []);
      }
    }
  }
  const h = keyboardHarness("flashcards", null, "DIV");
  assert.equal(h.press(" "), true);
  assert.deepEqual(h.calls, ["unflip"]);
});

test("an update notice survives offline/online changes and an install prompt being dismissed", () => {
  const pwaStatus = { hidden: true }, pwaStatusText = { textContent: "" }, pwaInstall = { hidden: true };
  let callbacks;
  const c = contextWith(["updatePwaUi"], { navigator: { onLine: true }, pwaUiState: { online: true, updateReady: false },
    pwaStatus, pwaStatusText, pwaInstall, installPromptHandler: null, initPwa: options => { callbacks = options; } });
  vm.runInContext(source.slice(source.indexOf("initPwa({"), source.indexOf("function syncDraft(")), c);
  callbacks.onUpdateReady();
  callbacks.onConnectivityChange({ online: false });
  callbacks.onConnectivityChange({ online: true });
  assert.equal(pwaStatus.hidden, false);
  assert.match(pwaStatusText.textContent, /bản cập nhật/);
  callbacks.onInstallAvailable({ promptInstall: null });
  assert.equal(pwaStatus.hidden, false);
  assert.match(pwaStatusText.textContent, /bản cập nhật/);
});

test("hints block Vietnamese ordinal choices and implicit option verdicts while retaining reasoning hints", () => {
  const q = question({ type: "mcq", options: ["red", "blue", "green", "yellow"], answer: ["blue"] });
  for (const hint of ["Chọn phương án thứ hai.", "Phương án B là phù hợp.", "Loại phương án đầu, ba và bốn.",
    "Chọn lựa chọn cuối cùng.", "Loại bỏ mục thứ tư.", "Phương án thứ hai là chính xác.", "Lựa chọn b không phù hợp."]) {
    const result = core.safeQuestionHint({ ...q, hint });
    assert.equal(result.blocked, true, hint);
    assert.notEqual(result.text, hint);
    const preview = core.buildCsvPreview(stats.questionsToCsv([{ ...q, hint }]));
    assert.deepEqual(preview.errors, []);
    assert.ok(preview.warnings.length, hint);
  }
  for (const hint of ["Mệnh đề đầu tiên là đúng.", "Ý thứ hai là sai."]) {
    assert.equal(core.safeQuestionHint({ type: "true_false", answer: ["true", "false", "true", "false"], hint }).blocked, true, hint);
  }
  for (const hint of ["Đối chiếu ý nghĩa của cả câu và cách kết hợp từ.", "Xét vai trò của thành phần thứ hai trong câu.",
    "Chọn từ phù hợp với ngữ cảnh.", "Loại trừ dựa vào cấu trúc ngữ pháp."]) {
    assert.deepEqual(core.safeQuestionHint({ ...q, hint }), { text: hint, blocked: false });
  }
});

test("rerendering retains the exact false radio and matching dropdown focus", () => {
  for (const dataset of [{ action: "tf-choice", index: "0", value: "false" }, { match: "1" }]) {
    let focused;
    const control = data => ({ id: "", dataset: data, matches: () => false, focus: () => { focused = data; } });
    const active = control(dataset);
    const controls = dataset.action ? [control({ ...dataset, value: "true" }), control(dataset)] : [control({ match: "0" }), control(dataset)];
    const main = { className: "main study-main", setAttribute: () => {} }, footer = { classList: { toggle: () => {} } };
    const root = { contains: () => true, querySelector: selector => selector === "#main" ? main : selector === ".header" ? { outerHTML: "header" } : footer,
      querySelectorAll: () => controls };
    const c = contextWith(["render"], { state: { data: {}, view: "study" }, root, document: { activeElement: active },
      ensureTimerInterval: () => {}, currentSession: () => ({}), sessionMarkup: () => "", header: () => "header" });
    c.render();
    assert.equal(focused, dataset);
  }
});

test("dispatching a failed action reports its error without rejecting", async () => {
  const messages = [];
  const c = contextWith(["dispatchAction"], { invokeAction: async () => { throw new Error("Lưu nháp thất bại."); }, toast: (...args) => messages.push(args) });
  await c.dispatchAction({ dataset: { action: "pause" } });
  assert.deepEqual(messages, [["Lưu nháp thất bại.", true]]);
});
