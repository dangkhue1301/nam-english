import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import vm from "node:vm";
import { IDBFactory } from "fake-indexeddb";
import * as core from "../core.js";
import * as stats from "../stats.js";
import { createRepository, exportBackup, validateBackup, remainingQuestionCount, readDashboard } from "../storage.js";
import { question, vocabulary } from "./helpers.mjs";

const fixture = core.buildCsvPreview(fs.readFileSync(new URL("../japanese-sample-test.csv", import.meta.url), "utf8")).rows;
const jaVocab = fixture.find(q => q.type === "ja_vocab_context");
const vp = (overrides = {}) => question({ domain: "vocabulary_practice", learningKey: "", ...overrides });

async function setup(t, mode) {
  const descriptors = Object.fromEntries(["indexedDB", "localStorage"].map(k => [k, Object.getOwnPropertyDescriptor(globalThis, k)]));
  const values = new Map(), repos = [];
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: k => values.get(k) ?? null, setItem: (k, v) => values.set(k, v), removeItem: k => values.delete(k) } });
  if (mode === "IndexedDB") Object.defineProperty(globalThis, "indexedDB", { configurable: true, value: new IDBFactory() });
  else delete globalThis.indexedDB;
  const open = async () => { const repo = await createRepository(); repos.push(repo); return repo; };
  t.after(() => { repos.forEach(r => r.close()); for (const [k, d] of Object.entries(descriptors)) { if (d) Object.defineProperty(globalThis, k, d); else delete globalThis[k]; } });
  return { repo: await open(), open };
}

function actionContext(repo, session) {
  const source = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
  const state = { busy: false, view: "study", draftRevision: session.draftRevision || 0,
    draftDirty: true, draftConflict: false, draft: { text: "is" }, data: { snapshot: { session } } };
  const context = { state, repository: repo, currentSession: () => state.data.snapshot.session,
    structuredClone, clearTimeout: () => {}, draftTimer: null, draftWrite: Promise.resolve(),
    stopSpeaking: () => {}, render: () => {}, window: { scrollTo: () => {} } };
  vm.createContext(context);
  const persistStart = source.indexOf("async function persistDraft(");
  if (persistStart >= 0) vm.runInContext(source.slice(persistStart, source.indexOf("function saveDraft(", persistStart)), context);
  vm.runInContext(source.slice(source.indexOf("async function invokeAction("), source.indexOf('document.addEventListener("click"')), context);
  return context;
}

for (const mode of ["localStorage", "IndexedDB"]) {
  test(mode + ": flashcard summary XP includes every retry and survives reopening", async t => {
    const { repo, open } = await setup(t, mode);
    const set = await repo.importQuestions([vocabulary()], "xp.csv");
    const s = await repo.startSession({ setId: set.id, mode: "flashcards" });
    for (const [step, answer] of [false, false, true].entries()) {
      await repo.submit(s.id, step, answer);
      await repo.advance(s.id, step);
    }
    const snapshot = await (await open()).snapshot();
    assert.equal(snapshot.summary.repeats, 2);
    assert.equal(snapshot.summary.results.length, 1);
    assert.equal(snapshot.summary.earnedXp, stats.xpFromAttempts(snapshot.attempts));
    assert.equal(snapshot.summary.earnedXp, 14);
  });

  for (const language of ["english", "japanese"]) {
    test(mode + ": " + language + " vocabulary exercises: 30+20, wrong once, mistakes, no SRS, backup", async t => {
      const { repo, open } = await setup(t, mode);
      const make = language === "english" ? vp : o => ({ ...jaVocab, learningKey: "", learning_key: "", ...o });
      const domain = language === "english" ? "vocabulary_practice" : "vocabulary";
      const set = await repo.importQuestions(Array.from({ length: 50 }, (_, i) => make({ id: "v" + i })), "vocab.csv");
      const originalIds = new Set();
      for (const count of [30, 20]) {
        let s = await repo.startSession({ setId: set.id, mode: domain });
        assert.equal(s.target, count);
        for (const id of s.queue) { assert.ok(!originalIds.has(id)); originalIds.add(id); }
        while ((s = (await repo.snapshot()).session)) {
          await repo.submit(s.id, s.step, language === "english" ? "wrong" : "invalid-option");
          await repo.advance(s.id, s.step);
        }
        assert.equal((await repo.snapshot()).summary.repeats, 0);
      }
      const restored = await open();
      const w = await restored.snapshot();
      assert.equal(w.attempts.length, 50);
      assert.equal(w.reviews.length, 0);
      assert.equal(w.srsEvents.length, 0);
      assert.equal(remainingQuestionCount(w, { setId: set.id, domain }), 0);
      const progress = core.buildStats(w.questions, w.reviews, w.attempts, w.imports);
      assert.equal(progress.vocabularyPracticeRemaining, 0);
      assert.equal((await readDashboard(restored)).mistakes.length, 50);
      await assert.rejects(restored.startSession({ setId: set.id, mode: domain }), /hết câu/i);
      const review = await restored.startMistakesSession();
      const q = w.questions.find(q => q.id === review.queue[0]);
      await restored.submit(review.id, 0, language === "english" ? q.answer[0] : q.answer);
      await restored.advance(review.id, 0);
      assert.equal((await readDashboard(restored)).mistakes.length, 49);
      await restored.endSession(review.id);
      const backup = validateBackup(exportBackup(await restored.snapshot()));
      assert.equal(backup.questions.length, 50);
      assert.equal(backup.attempts.length, 51);
      assert.equal(backup.reviews.length, 0);
    });
  }

  test(mode + ": exercises leave flashcard schedules intact and reject wrong subjects", async t => {
    const { repo } = await setup(t, mode);
    const cards = await repo.importQuestions([vocabulary()], "cards.csv");
    let s = await repo.startSession({ setId: cards.id, mode: "flashcards" });
    await repo.submit(s.id, 0, true); await repo.advance(s.id, 0);
    const before = (await repo.snapshot()).reviews;
    const set = await repo.importQuestions([vp()], "exercises.csv");
    s = await repo.startSession({ setId: set.id, mode: "vocabulary_practice" });
    await repo.submit(s.id, 0, "wrong"); await repo.advance(s.id, 0);
    assert.deepEqual((await repo.snapshot()).reviews, before);
    assert.equal((await readDashboard(repo)).mistakes.length, 1);
    const ja = await repo.importQuestions([jaVocab], "ja.csv");
    await assert.rejects(repo.startSession({ setId: ja.id, mode: "vocabulary_practice" }), /Tiếng Anh/);
    await assert.rejects(repo.startSession({ setId: ja.id, mode: "vocabulary", dueOnly: true }), /đến hạn/);
  });

  test(mode + ": filtered and mixed remaining counts agree with actual next batch", async t => {
    const { repo } = await setup(t, mode);
    const a = await repo.importQuestions([vp({ id: "m", type: "mcq", options: ["is", "are"] }), vp({ id: "f" })], "a.csv");
    const b = await repo.importQuestions([vp({ id: "m", type: "mcq", options: ["is", "are"] })], "b.csv");
    let s = await repo.startSession({ setId: a.id, mode: "vocabulary_practice", type: "mcq" });
    await repo.submit(s.id, 0, "is"); await repo.advance(s.id, 0);
    const w = await repo.snapshot();
    assert.equal(remainingQuestionCount(w, { setId: a.id, domain: "vocabulary_practice", type: "mcq" }), 0);
    assert.equal(remainingQuestionCount(w, { setIds: [a.id, b.id], domain: "vocabulary_practice", type: "mcq" }), 1);
    s = await repo.startSession({ setIds: [a.id, b.id], mode: "vocabulary_practice", type: "mcq" });
    assert.equal(s.target, 1);
    assert.equal(s.filters.type, "mcq");
  });

  test(mode + ": draft CAS rejects delayed writes and duplicate submit is idempotent", async t => {
    const { repo, open } = await setup(t, mode);
    const set = await repo.importQuestions([vp()], "a.csv");
    const s = await repo.startSession({ setId: set.id, mode: "vocabulary_practice" });
    const other = await open();
    assert.equal(await repo.saveDraft(s.id, 0, { text: "remote" }, 0), 1);
    await assert.rejects(other.saveDraft(s.id, 0, { text: "stale" }, 0), /Bản nháp đã đổi/);
    await assert.rejects(other.submit(s.id, 0, "is", { text: "stale" }, 0), /Bản nháp đã đổi/);
    assert.equal((await repo.snapshot()).session.draft.text, "remote");
    const r = await other.submit(s.id, 0, "is", { text: "is" }, 1);
    assert.deepEqual(await repo.submit(s.id, 0, "wrong"), r);
    assert.equal((await repo.snapshot()).attempts.length, 1);
  });

  test(mode + ": real pause/navigation/resume actions keep draft revision and allow grading", async t => {
    const { repo } = await setup(t, mode);
    const set = await repo.importQuestions([vp()], "pause.csv");
    const s = await repo.startSession({ setId: set.id, mode: "vocabulary_practice" });
    const context = actionContext(repo, s);
    for (const action of ["pause", "home", "library", "stats", "data", "pause"]) {
      await context.invokeAction({ dataset: { action } });
      const saved = (await repo.snapshot()).session;
      assert.equal(context.state.draftRevision, saved.draftRevision);
      assert.equal(context.state.data.snapshot.session.draftRevision, saved.draftRevision);
      assert.equal(saved.draft.text, "is");
      await context.invokeAction({ dataset: { action: "resume" } });
    }
    const result = await repo.submit(s.id, 0, "is", context.state.draft, context.state.draftRevision);
    assert.equal(result.correct, true);
    assert.equal((await repo.snapshot()).attempts.length, 1);
  });

  test(mode + ": Escape reports a remote draft conflict, preserves typed text and permits explicit recovery", async t => {
    const { repo, open } = await setup(t, mode);
    const set = await repo.importQuestions([vp()], "conflict.csv");
    const s = await repo.startSession({ setId: set.id, mode: "vocabulary_practice" });
    await (await open()).saveDraft(s.id, s.step, { text: "remote" }, 0);
    const c = actionContext(repo, s), source = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
    const messages = [];
    let keydown, pending;
    c.toast = (message, error) => messages.push({ message, error });
    c.modal = { open: false };
    c.document = { addEventListener: (event, handler) => { if (event === "keydown") keydown = handler; } };
    c.resolveEscapeAction = core.resolveEscapeAction;
    const dispatch = c.dispatchAction;
    c.dispatchAction = target => { pending = dispatch(target); return pending; };
    vm.runInContext(source.slice(source.indexOf('document.addEventListener("keydown"'), source.indexOf('document.addEventListener("dragover"')), c);
    const target = { tagName: "INPUT", closest() { return this; } };
    keydown({ key: "Escape", target, preventDefault: () => {} });
    assert.ok(pending);
    await pending;
    assert.equal(c.state.view, "study");
    assert.equal(c.state.draft.text, "is");
    assert.equal(c.state.draftConflict, true);
    assert.equal(messages.length, 1);
    assert.equal(messages[0].error, true);
    assert.match(messages[0].message, /Bản nháp đã đổi/);
    assert.equal((await repo.snapshot()).session.draft.text, "remote");
    vm.runInContext(source.slice(source.indexOf("function syncDraft("), source.indexOf("async function refresh(")), c);
    c.refresh = async () => { c.state.data = await readDashboard(repo); c.syncDraft(); };
    await c.dispatchAction({ dataset: { action: "reload-draft" } });
    assert.equal(c.state.draftConflict, false);
    assert.equal(c.state.draft.text, "remote");
    assert.equal(c.state.draftRevision, 1);
    assert.equal((await repo.submit(s.id, s.step, "is", { text: "is" }, c.state.draftRevision)).correct, true);
  });

  test(mode + ": non-Japanese braces and formula hints import and restore without ruby parsing", async t => {
    const { repo } = await setup(t, mode);
    const rows = [question({ subject: "physics", grade: "8", domain: "practice", type: "short_answer",
      level: "mixed", answer: ["v_{0}"], hint: "Xét đại lượng {vận tốc ban đầu}." })];
    const preview = core.buildCsvPreview(stats.questionsToCsv(rows));
    assert.deepEqual(preview.errors, []);
    await repo.importQuestions(preview.rows, "formula.csv");
    const snapshot = await repo.snapshot();
    await repo.replaceAll(exportBackup(snapshot));
    assert.equal((await repo.snapshot()).questions[0].hint, rows[0].hint);
    assert.equal(core.safeQuestionHint(vp({ hint: "Xét cụm {time marker} trong câu." })).text, "Xét cụm {time marker} trong câu.");
  });

  test(mode + ": migrate Japanese retry queue once, preserve current draft and archived schedules", async t => {
    const { repo, open } = await setup(t, mode);
    const set = await repo.importQuestions([jaVocab, { ...jaVocab, id: "second" }], "a.csv");
    const s = await repo.startSession({ setId: set.id, mode: "vocabulary" });
    await repo.submit(s.id, 0, "wrong"); await repo.advance(s.id, 0);
    await repo.saveDraft(s.id, 1, { selected: [1] });
    await repo.backend.run(w => {
      delete w.session.policyVersion;
      w.session.queue.push(s.queue[0]); w.session.done = 0;
      w.reviews = [{ learningKey: jaVocab.learningKey, dueAt: 123, repetitions: 1, interval: 1, ease: 2.5, lapses: 0, lastReviewedAt: 100, updatedAt: 100 }];
    });
    const reload = await open();
    const w = await reload.snapshot();
    assert.equal(w.session.queue.length, 1);
    assert.equal(w.session.done, 1);
    assert.equal(w.session.target, 2);
    assert.deepEqual(w.session.draft.selected, [1]);
    assert.equal(w.session.policyVersion, 2);
    const before = w.reviews;
    await reload.submit(s.id, 1, "wrong"); await reload.advance(s.id, 1);
    assert.deepEqual((await reload.snapshot()).reviews, before);
    assert.equal((await open()).mode, mode);
  });

  test(mode + ": legacy Japanese false outcomes survive new visible-chip grading and backup", async t => {
    const { repo } = await setup(t, mode);
    const jaOrder = { ...fixture.find(q => q.type === "ja_grammar_order"), id: "ruby", options: [{ id: "a", text: "{方|かた}" }, { id: "b", text: "{方|ほう}" }], acceptedOrders: [["a", "b"]], accepted_orders: [["a", "b"]] };
    const set = await repo.importQuestions([jaOrder], "a.csv");
    const q = (await repo.snapshot()).questions.find(q => q.setId === set.id);
    await repo.recordAttempt(q, ["b", "a"], false, { gradingVersion: 1 });
    assert.equal(validateBackup(exportBackup(await repo.snapshot())).attempts[0].correct, false);
    const s = await repo.startMistakesSession();
    const r = await repo.submit(s.id, 0, ["b", "a"]);
    assert.equal(r.correct, true);
    await repo.advance(s.id, 0);
    assert.equal(validateBackup(exportBackup(await repo.snapshot())).attempts[1].gradingVersion, 2);
  });
}

test("ordering validates intact chips, duplicate chips and punctuation", () => {
  assert.equal(core.orderingAnswerUsesOptions(["I am", "happy today"], ["I happy am today"]), false);
  assert.equal(core.orderingAnswerUsesOptions(["I am", "happy today"], ["I am happy today."]), true);
  assert.equal(core.orderingAnswerUsesOptions(["had", "had", "We"], ["We had had"]), true);
  assert.equal(core.orderingAnswerUsesOptions(["Hello.", "world"], ["Hello world"]), false);
  assert.ok(core.buildCsvPreview(stats.questionsToCsv([vp({ type: "ordering", options: ["I am", "happy today"], answer: ["I happy am today"] })])).errors.length);
});

test("CSV hints block actual answers, partial solutions and option instructions without substring false positives", () => {
  for (const hint of ["Đáp án là is.", "Chọn A.", "Loại B và C.", "Choose option A.", "Start with the subject.", "All statements are true.", "x".repeat(181)]) assert.equal(core.safeQuestionHint(vp({ hint })).blocked, true);
  assert.equal(core.safeQuestionHint(vp({ answer: ["an"], hint: "Analyse the context." })).blocked, false);
  assert.equal(core.safeQuestionHint(vp({ answer: ["will have finished"], hint: "Dùng will have rồi chia động từ." })).blocked, true);
  assert.equal(core.safeQuestionHint({ ...jaVocab, hint: jaVocab.options.find(o => o.id === jaVocab.answer).text }).blocked, true);
  assert.equal(core.safeQuestionHint({ ...jaVocab, hint: "Đọc toàn bộ ngữ cảnh." }).blocked, false);
  assert.ok(core.buildCsvPreview(stats.questionsToCsv([vp({ hint: "Đáp án là is." })])).warnings.length);
});

test("hints block option IDs, numbered choices and explicit true/false verdicts", () => {
  for (const hint of ["Chọn " + jaVocab.answer + ".", "Chọn phương án số 1.", "Loại lựa chọn thứ 2.", "Select option number 3."]) {
    assert.equal(core.safeQuestionHint({ ...jaVocab, hint }).blocked, true, hint);
  }
  for (const hint of ["a: đúng; b: sai; c: đúng; d: sai", "a) true, b) false, c) true, d) false", "Tất cả đều đúng.", "Đúng, sai, đúng, sai."]) {
    assert.equal(core.safeQuestionHint({ type: "true_false", answer: ["true", "false", "true", "false"], hint }).blocked, true, hint);
  }
  assert.equal(core.safeQuestionHint({ ...jaVocab, hint: "Đọc toàn bộ ngữ cảnh trước khi chọn." }).blocked, false);
});

test("Japanese order hints check every accepted sentence and substantial partial answers without spaces", () => {
  const q = { subject: "japanese", type: "ja_grammar_order", answer: "",
    options: [{ id: "a", text: "私は" }, { id: "b", text: "昨日" }, { id: "c", text: "学校へ" }, { id: "d", text: "行った。" }],
    acceptedOrders: [["a", "b", "c", "d"], ["b", "a", "c", "d"]] };
  for (const hint of ["昨日私は学校へ行った。", "私は昨日学校へ", "Thứ tự: a → b → c → d", "私は昨日学校へ{行った|いった}。"]) {
    assert.equal(core.safeQuestionHint({ ...q, hint }).blocked, true, hint);
  }
  assert.equal(core.safeQuestionHint({ ...q, hint: "Xét quan hệ giữa các thành phần của câu." }).blocked, false);
});

test("every complete CSV example in both AI guides passes the real importer", () => {
  for (const file of ["QUESTION_CSV_GUIDE.md", "JAPANESE_CSV_GUIDE.md"]) {
    const content = fs.readFileSync(new URL("../" + file, import.meta.url), "utf8");
    const blocks = [...content.matchAll(/```csv\r?\n([\s\S]*?)```/g)].map(m => m[1]);
    let checked = 0;
    for (const csv of blocks) {
      if (!csv.startsWith("subject,") && !csv.startsWith("schema,")) continue;
      if (csv.trim().split("\n").length < 2) continue;
      const preview = core.buildCsvPreview(csv, file);
      assert.deepEqual(preview.errors, [], file);
      checked++;
    }
    assert.ok(checked);
  }
});

function renderContext(q) {
  const source = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
  const s = { id: "s", setId: "set", mode: q.type === "flashcard" ? "flashcards" : q.domain, purpose: "study", done: 0, target: 1, step: 0, draftRevision: 0, result: null, queue: [q.id] };
  const context = { ...core, ...stats, state: { busy: false, draftKey: "", topicOpen: true, draftRevision: 0, data: { sets: [{ id: "set", subject: q.subject, name: "Bộ bài" }], snapshot: { session: s, questions: [{ ...q, setId: "set" }], attempts: [], reviews: [] } } },
    speechAvailable: () => false, currentSession: () => s, currentQuestion: () => q, currentFurigana: () => false,
    renderRubyHtml: (text, options) => core.renderRubyHtml(text, { ...options, showRuby: false }),
    html: core.escapeHtml || (v => String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;")),
    icon: () => "", button: (label, action, css = "", extra = "") => '<button data-action="' + action + '" class="' + css + '" ' + extra + '>' + label + '</button>',
    number: v => String(v), day: () => "ngày", subjectName: v => v, isVocabulary: mode => mode === "flashcards", remainingQuestionCount };
  vm.createContext(context);
  for (const name of ["highlightWordInSentence", "getFlashcardData", "syncDraft", "summaryForSet", "answerMarkup", "answerReady", "shouldShowSubtopic", "isAnswerSpoiler", "highlightJapaneseTarget", "renderQuestionContext", "renderJapaneseQuestionContent", "sessionMarkup"]) {
    const start = source.indexOf("function " + name + "(");
    const rest = source.slice(start);
    const end = rest.slice(1).search(/\r?\n(?:async )?function /);
    vm.runInContext(end < 0 ? rest : rest.slice(0, end + 1), context);
  }
  context.syncDraft();
  return { context, s };
}

test("real study renderer gates theory/topic/explanation and keeps only checked hints before grading", () => {
  for (const q of [vp({ theory: "SECRET THEORY", explanation: "SECRET EXPLANATION", topic: "SECRET TOPIC", hint: "Đáp án là is." }), { ...jaVocab, theory: "SECRET THEORY", explanation: "SECRET EXPLANATION", topic: "SECRET TOPIC", hint: "Đọc toàn bộ ngữ cảnh." }]) {
    const { context, s } = renderContext(q);
    let markup = context.sessionMarkup();
    for (const secret of ["SECRET THEORY", "SECRET EXPLANATION", "SECRET TOPIC", "Đáp án là is."]) assert.ok(!markup.includes(secret));
    assert.match(markup, /Gợi ý nhỏ/);
    s.result = { correct: true, expected: "is", received: "is", draft: null };
    markup = context.sessionMarkup();
    for (const secret of ["SECRET THEORY", "SECRET EXPLANATION", "SECRET TOPIC"]) assert.ok(markup.includes(secret));
  }
});

test("real Japanese renderer strips legacy ruby everywhere, including prompt and chips", () => {
  const q = { ...fixture.find(q => q.type === "ja_grammar_order"), prompt: "{学校|がっこう}", options: [{ id: "a", text: "{方|かた}" }, { id: "b", text: "{方|ほう}" }], accepted_orders: [["a", "b"]], acceptedOrders: [["a", "b"]] };
  const { context } = renderContext(q);
  const markup = context.sessionMarkup();
  assert.ok(markup.includes("学校"));
  assert.doesNotMatch(markup, /<ruby>|<rt>|がっこう|toggle-furigana|\{方\|/);
});

test("flashcards hide the meaning and self-grading until the card is flipped", () => {
  const q = vocabulary({ type: "flashcard", prompt: "reliable", context: "", answer: ["SECRET MEANING"], explanation: "SECRET DETAIL" });
  const { context } = renderContext(q);
  let markup = context.sessionMarkup();
  assert.doesNotMatch(markup, /SECRET MEANING|SECRET DETAIL|data-action="grade-remember"/);
  assert.equal((markup.match(/data-action="flip"/g) || []).length, 1);
  context.state.flipped = true;
  markup = context.sessionMarkup();
  assert.match(markup, /SECRET DETAIL/);
  assert.match(markup, /data-action="grade-remember"/);
  assert.match(markup, /data-action="grade-forgot"/);
});

test("Japanese wrong-answer feedback describes separate mistake review without automatic repeats", () => {
  const { context, s } = renderContext(jaVocab);
  s.result = { correct: false, expected: "期待", received: "o2", draft: null, isRetry: true };
  const markup = context.sessionMarkup();
  assert.match(markup, /Câu sai được lưu vào mục Ôn câu sai/);
  assert.doesNotMatch(markup, /cuối lượt|Hẹn ôn lại/);
});

test("same-step remote draft refreshes a clean UI and retains dirty text on conflict", () => {
  const { context, s } = renderContext(vp());
  s.draft = { text: "remote" }; s.draftRevision = 1; context.syncDraft();
  assert.equal(context.state.draft.text, "remote");
  context.state.draft.text = "local unsaved"; context.state.draftDirty = true;
  s.draft = { text: "newer remote" }; s.draftRevision = 2; context.syncDraft();
  assert.equal(context.state.draft.text, "local unsaved");
  assert.equal(context.state.draftConflict, true);
  assert.equal(context.answerReady(), false);
  assert.match(context.sessionMarkup(), /Dùng bản nháp đã lưu/);
});

test("exercise progress counts wrong study answers, excludes review-only answers and respects type filters", () => {
  const q = vp({ id: "wrong-mcq", type: "mcq", options: ["is", "are"] });
  const { context } = renderContext(q);
  const w = context.state.data.snapshot;
  w.questions.push({ ...vp({ id: "unseen-fill" }), setId: "set" });
  w.attempts = [{ questionId: q.id, correct: false, purpose: "study" }];
  const all = context.summaryForSet("set");
  assert.equal(all.vocabularyPracticeRemaining, 1);
  const filtered = context.summaryForSet("set", { type: "mcq" });
  assert.equal(filtered.vocabularyPracticeRemaining, 0);
  w.attempts.push({ questionId: "unseen-fill", correct: true, purpose: "review" });
  assert.equal(context.summaryForSet("set").vocabularyPracticeRemaining, 1);
});

test("built-in English sample contains valid vocabulary exercises alongside existing flashcards", () => {
  const source = fs.readFileSync(new URL("../app.js", import.meta.url), "utf8");
  const end = source.indexOf("const JAPANESE_SAMPLE_CSV");
  const context = vm.createContext({});
  vm.runInContext(source.slice(0, end) + ";globalThis.csv = SAMPLE_CSV + VOCABULARY_PRACTICE_SAMPLE_CSV; globalThis.count = SAMPLE_QUESTION_COUNT;", context);
  const preview = core.buildCsvPreview(context.csv, "sample.csv");
  assert.deepEqual(preview.errors, []);
  assert.equal(preview.rows.length, context.count);
  assert.equal(preview.rows.filter(core.isVocabularyExercise).length, 4);
  assert.equal(preview.rows.filter(core.isFlashcardQuestion).length, 12);
});
