import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import vm from "node:vm";
import * as core from "../core.js";
import * as stats from "../stats.js";
import { remainingQuestionCount } from "../storage.js";
import { question, vocabulary, practice } from "./helpers.mjs";

const source = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
function ui(functions, state = {}) {
  const context = vm.createContext({ ...core, ...stats, state, remainingQuestionCount,
    html: v => String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;"), number: String, subjectName: String, icon: () => "",
    button: (label, action, cls, extra = "") => `<button data-action="${action}" ${extra}>${label}</button>`,
    currentFurigana: () => false, disclosureState: {}, intro: () => "" });
  for (const name of functions) {
    const start = source.indexOf("function " + name + "(");
    assert.ok(start >= 0, name);
    const rest = source.slice(start), end = rest.slice(1).search(/\r?\n(?:async )?function /);
    vm.runInContext(end < 0 ? rest : rest.slice(0, end + 1), context);
  }
  return context;
}

const set = { id: "en", subject: "english", name: "English" };
const questions = [question({ id: "g", setId: "en" }), question({ id: "vp", setId: "en", domain: "vocabulary_practice" }), vocabulary({ setId: "en", type: "flashcard" })];
const snapshot = () => ({ questions: structuredClone(questions), attempts: [], reviews: [] });

test("home offers English vocabulary exercises first, with counts matching the real session selector", () => {
  const c = ui(["studyModeOptions", "chooseStudyMode"]), w = snapshot();
  const modes = c.studyModeOptions(w, set);
  assert.deepEqual(Array.from(modes, m => m.mode), ["vocabulary_practice", "grammar", "flashcards"]);
  assert.equal(c.chooseStudyMode(modes), "vocabulary_practice");
  for (const mode of modes) assert.equal(mode.remaining, remainingQuestionCount(w, { setId: set.id, domain: mode.domain }));
  w.attempts.push({ questionId: "vp", correct: false, purpose: "study" });
  assert.equal(c.chooseStudyMode(c.studyModeOptions(w, set)), "grammar");
});

test("zero-result filters preserve the selected study mode and report zero without hiding it", () => {
  const c = ui(["studyModeOptions", "chooseStudyMode"]);
  const modes = c.studyModeOptions(snapshot(), set, { topic: "No matching topic" });
  assert.equal(modes.length, 3);
  assert.ok(modes.every(m => m.remaining === 0));
  assert.equal(c.chooseStudyMode(modes, "grammar"), "grammar");
  assert.equal(c.chooseStudyMode(modes, "vocabulary_practice"), "vocabulary_practice");
});

test("flashcard totals count shared learning keys once, matching session and progress counts", () => {
  const c = ui(["studyModeOptions"]), w = snapshot();
  w.questions.push({ ...w.questions[2], id: "same-word-another-question" });
  const flashcards = c.studyModeOptions(w, set).find(m => m.mode === "flashcards");
  assert.equal(flashcards.total, 1);
  assert.equal(flashcards.remaining, 1);
});

test("Japanese prioritizes grammar and vocabulary remains an exercise mode under chapter/section filters", () => {
  const c = ui(["studyModeOptions", "chooseStudyMode"]);
  const ja = { id: "ja", subject: "japanese" };
  const w = { questions: ["grammar", "vocabulary", "kanji"].map((domain, i) => question({ id: "j" + i, setId: "ja", subject: "japanese", domain, chapter: "2", lesson: "1" })), attempts: [], reviews: [] };
  const modes = c.studyModeOptions(w, ja);
  assert.deepEqual(Array.from(modes, m => m.mode), ["grammar", "vocabulary", "kanji"]);
  assert.equal(c.chooseStudyMode(modes), "grammar");
  const scoped = c.studyModeOptions(w, ja, { chapter: "2", section: "vocabulary" });
  assert.deepEqual(Array.from(scoped, m => m.remaining), [0, 1, 0]);
  assert.equal(c.chooseStudyMode(scoped), "vocabulary");
});

test("science and single-domain sets show only available modes", () => {
  const c = ui(["studyModeOptions", "chooseStudyMode"]);
  assert.deepEqual(Array.from(c.studyModeOptions({ questions: [questions[0]], attempts: [], reviews: [] }, set), m => m.mode), ["grammar"]);
  const p = { id: "p", subject: "physics" };
  const modes = c.studyModeOptions({ questions: [practice({ setId: "p" })], attempts: [], reviews: [] }, p);
  assert.equal(modes.length, 1); assert.equal(modes[0].mode, "practice"); assert.equal(modes[0].remaining, 1);
});

test("library combines subject filtering with Vietnamese case-insensitive search", () => {
  const state = { librarySubject: "english", search: "du LỊCH", data: { sets: [{ ...set, name: "Bài tập Du lịch" }, { id: "ja", subject: "japanese", name: "Du lịch Nhật" }] } };
  const c = ui(["librarySets"], state);
  assert.equal(c.librarySets().length, 1); assert.equal(c.librarySets()[0].id, "en");
  state.librarySubject = "all"; assert.equal(c.librarySets().length, 2);
  state.search = "missing"; assert.equal(c.librarySets().length, 0);
});

test("result shows actual earned XP, individual wrong-answer disclosures and the next mistake-review action", () => {
  const w = snapshot(); w.questions = [questions[0]];
  w.attempts = [{ questionId: "g", correct: false, purpose: "study" }];
  w.summary = { setId: "en", mode: "grammar", purpose: "study", total: 1, correct: 0, durationMs: 60000, results: [{ questionId: "g", correct: false, answer: "are" }] };
  const state = { data: { sets: [set], snapshot: w, mistakes: [questions[0]] } };
  const c = ui(["summaryForSet", "resultMarkup"], state);
  const markup = c.resultMarkup();
  assert.match(markup, /\+2 XP trong lượt này/);
  assert.match(markup, /data-action="review-mistakes"/);
  assert.match(markup, /class="result-question"/);
  assert.match(markup, /Bạn trả lời/);
  assert.doesNotMatch(markup, /NaN/);
});

test("statistics disclosures keep their chosen state and achievements are open by default", () => {
  const c = ui(["statsDisclosureOpen"]);
  assert.equal(c.statsDisclosureOpen("achievements", true), "open");
  assert.equal(c.statsDisclosureOpen("mastery"), "");
  c.disclosureState.achievements = false;
  assert.equal(c.statsDisclosureOpen("achievements", true), "");
});

test("flashcard results include XP from retries without changing first-attempt accuracy", () => {
  const w = snapshot();
  w.summary = { setId: "en", mode: "flashcards", total: 1, correct: 0, repeats: 2, durationMs: 60000,
    earnedXp: 14, results: [{ questionId: w.questions[2].id, correct: false, answer: "Chưa nhớ" }] };
  const c = ui(["summaryForSet", "resultMarkup"], { data: { sets: [set], snapshot: w, mistakes: [] } });
  assert.match(c.resultMarkup(), /\+14 XP trong lượt này/);
  assert.match(c.resultMarkup(), /<strong>0<small>\/1<\/small>/);
  assert.match(c.resultMarkup(), /nhớ ngay lần đầu/);
  assert.match(c.resultMarkup(), /tỷ lệ nhớ lần đầu/);
  delete w.summary.earnedXp;
  assert.match(c.resultMarkup(), /\+2 XP từ lần trả lời đầu/);
  assert.doesNotMatch(c.resultMarkup(), /XP trong lượt này/);
});
