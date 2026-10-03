import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  parseRubyTokens,
  renderRubyHtml,
  stripRuby,
  formatJapaneseSentence,
  evaluateJapaneseAnswer,
} from "../japanese.js";

test("Phase C: app.js contains Japanese tree navigation, filters, and numerical sorting", async () => {
  const app = await readFile(new URL("../app.js", import.meta.url), "utf8");

  // Verify numerical sorting for Japanese chapter and lesson
  assert.match(app, /\.sort\(\(a, b\) => String\(a\)\.localeCompare\(String\(b\), undefined, \{ numeric: true \}\)\)/);

  // Verify tree filter selectors
  assert.match(app, /field\("chapter", "Chương"/);
  assert.match(app, /field\("lesson", "Bài"/);
  assert.match(app, /field\("section", "Mục"/);

  // Verify section mapping: Hán tự (kanji), Ngữ pháp (grammar), Từ vựng (vocabulary)
  assert.match(app, /val: "kanji", label: "Hán tự/);
  assert.match(app, /val: "grammar", label: "Ngữ pháp/);
  assert.match(app, /val: "vocabulary", label: "Từ vựng/);

  // Japanese exercise progress has no due-date metric.
  assert.match(app, /class="ja-tree-scope-card"/);
  assert.match(app, /Đã làm/);
  assert.match(app, /class="home-review"/);
  assert.doesNotMatch(app, /ja-metric-label">Đến hạn ôn/);
});

test("Phase C: app.js strictly blocks flashcards for Japanese", async () => {
  const app = await readFile(new URL("../app.js", import.meta.url), "utf8");

  // Japanese mode choices stay in exercise domains.
  const japaneseModes = app.slice(app.indexOf(': set.subject === "japanese" ? ['), app.indexOf('] : [{ mode: "practice"'));
  assert.match(japaneseModes, /mode: "grammar"/);
  assert.match(japaneseModes, /mode: "vocabulary"/);
  assert.match(japaneseModes, /mode: "kanji"/);
  assert.doesNotMatch(japaneseModes, /flashcards/);

  // Japanese vocabulary uses one-pass exercises and the separate mistakes list.
  assert.match(app, /title: "Từ vựng", description: "Ngữ cảnh/);
  assert.match(app, /Chấm xong chuyển câu mới; câu sai được lưu vào mục Ôn câu sai/);
  assert.match(app, /Bài tập tính theo từng câu, không có lịch SRS/);

  // In setCard, Japanese labels do not mention flashcards/mục đã học
  assert.match(app, /isJapanese \? "câu đã làm" : "mục đã học"/);

  // In resultMarkup, unit is "câu", not "thẻ"
  assert.match(app, /unit = isReview \? "câu sai" : isJapanese \? "câu" :/);
});

test("Phase C: 8 Japanese question type renderers in app.js", async () => {
  const app = await readFile(new URL("../app.js", import.meta.url), "utf8");

  // G1: gap replacement
  assert.match(app, /ja-gap/);
  assert.match(app, /\[ &hellip; \]|\[ … \]/);

  // G2: Slots with star position
  assert.match(app, /ja-slots-group/);
  assert.match(app, /ja-slot-star/);
  assert.match(app, /star_position/);

  // G3: Sentence builder + token bank + undo/reset
  assert.match(app, /ja-sentence-builder/);
  assert.match(app, /ja-token-bank/);
  assert.match(app, /ja-order-undo/);
  assert.match(app, /ja-order-reset/);

  // V1, V2, V3, K1, K2: Target badges and single column options
  assert.match(app, /ja-target-badge/);
  assert.match(app, /choices-single-col/);
  assert.match(app, /highlightJapaneseTarget/);

  // Japanese G3 concatenation uses empty string "", NOT " "
  assert.match(app, /formatJapaneseSentence\(q\.options, firstOrder\)/);

  // Retry attempt badge
  assert.match(app, /isRetry = Boolean\(result\.isRetry\)/);
  assert.match(app, /retry-pill/);
});

test("Phase C: Guide download links in app.js and scripts/build.mjs", async () => {
  const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
  const buildScript = await readFile(new URL("../scripts/build.mjs", import.meta.url), "utf8");

  assert.ok(app.includes("./JAPANESE_CSV_GUIDE.md"));
  assert.ok(buildScript.includes("JAPANESE_CSV_GUIDE.md"));
  assert.ok(buildScript.includes("japanese.js"));
});

test("Phase C: styles.css contains Japanese system font stack, ruby/rt, G2/G3 styles", async () => {
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");

  // System font stack (no CDN)
  assert.match(css, /'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Meiryo', 'TakaoExGothic'/);

  // Sizing
  assert.match(css, /\.ja-context[\s\S]*?clamp\(1\.35rem/);
  assert.match(css, /\.ja-choice-text[\s\S]*?clamp\(1\.15rem/);

  // Ruby styles
  assert.match(css, /ruby\s*\{[\s\S]*?ruby-position:\s*over;/);
  assert.match(css, /rt\s*\{[\s\S]*?font-size:\s*0\.55em;/);


  // G2 slots
  assert.match(css, /\.ja-slots-group/);
  assert.match(css, /\.ja-slot/);
  assert.match(css, /\.ja-slot-star/);

  // G3 sentence builder and tokens
  assert.match(css, /\.ja-sentence-builder/);
  assert.match(css, /\.ja-token/);
  assert.match(css, /\.ja-token\.selected/);
  assert.match(css, /\.ja-order-actions/);

  // Target badge, highlight, and scope card
  assert.match(css, /\.ja-target-badge/);
  assert.match(css, /\.ja-target-highlight/);
  assert.match(css, /\.ja-tree-scope-card/);
  assert.match(css, /\.mode-picker/);
  assert.match(css, /\.retry-pill/);
});

test("Phase C: Numerical sorting works correctly for chapter/lesson numbers", () => {
  const chapters = ["10", "2", "1", "20", "3"];
  chapters.sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
  assert.deepEqual(chapters, ["1", "2", "3", "10", "20"]);

  const lessons = [12, 2, 1, 10, 5];
  lessons.sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }));
  assert.deepEqual(lessons, [1, 2, 5, 10, 12]);
});

test("Phase C: Anti-leak ruby hiding and revealing works as expected", () => {
  const k1Context = "{私|わたし}は{毎朝|まいあさ}{新聞|しんぶん}を{読|よ}みます。";
  // Before grading: target kanji "新聞" must NOT show ruby
  const hiddenHtml = renderRubyHtml(k1Context, { showRuby: true, hideTarget: "新聞" });
  assert.ok(hiddenHtml.includes("<ruby>私<rt>わたし</rt></ruby>"));
  assert.ok(hiddenHtml.includes("<ruby>毎朝<rt>まいあさ</rt></ruby>"));
  assert.ok(hiddenHtml.includes("新聞"));
  assert.ok(!hiddenHtml.includes("しんぶん"));

  // After grading: ruby is restored
  const gradedHtml = renderRubyHtml(k1Context, { showRuby: true, hideTarget: null });
  assert.ok(gradedHtml.includes("<ruby>新聞<rt>しんぶん</rt></ruby>"));

  // K2 choices before grading: showRuby: false
  const k2Opt = "{案内|あんない}";
  assert.equal(renderRubyHtml(k2Opt, { showRuby: false }), "案内");
  assert.equal(renderRubyHtml(k2Opt, { showRuby: true }), "<ruby>案内<rt>あんない</rt></ruby>");
});

test("Vietnamese font protection and Japanese responsive filter layout", async () => {
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  const app = await readFile(new URL("../app.js", import.meta.url), "utf8");

  // Font stack places Vietnamese-safe Latin fonts before Japanese fonts
  assert.match(css, /--ja-font:\s*"Segoe UI",[\s\S]*?'Hiragino Sans'/);

  // Dedicated Vietnamese context & placeholder classes
  assert.match(css, /\.ja-order-meaning/);
  assert.match(css, /\.ja-builder-placeholder/);
  assert.match(css, /\.filter-row/);

  // Prompt does not force lang="ja"
  assert.doesNotMatch(app, /<h1 lang="ja">\$\{html\(q\.prompt\)\}<\/h1>/);
  assert.match(app, /<h1>\$\{html\(q\.subject === "japanese" \? stripRuby\(q\.prompt\) : q\.prompt\)\}<\/h1>/);

  // Sentence builder wrapper does not force lang="ja"
  assert.doesNotMatch(app, /class="ja-sentence-builder"[^>]*lang="ja"/);
  assert.match(app, /class="muted ja-builder-placeholder" lang="vi"/);

  // Japanese set-focus header displays "câu đã làm" instead of "mục đã học"
  assert.match(app, /isJapanese \? "câu đã làm" : "mục đã học"/);

  // ja_grammar_order context uses ja-order-meaning with lang="vi"
  assert.match(app, /class="question-context ja-order-meaning" lang="vi"/);
});

test("Theory disclosure sits inside the question card after grading", async () => {
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
  assert.match(app, /!isFlash && result \? `<details class="study-reference"/);
  assert.match(app, /<summary>Chủ điểm và lý thuyết<\/summary>/);
  assert.match(css, /\.study-reference/);
  assert.doesNotMatch(app, /<aside class="study-aside"/);
});

test("HTML attribute injection: G3 chip aria-label escapes quotes", async () => {
  const { readFile } = await import("fs/promises");
  const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
  assert.match(app, /aria-label="Bỏ mảnh \$\{html\(stripRuby\(opt\?\.text \?\? ""\)\)\}"/);
});

test("Unified question context renderer: không lộ literal \\u2605, \\u2026, hiển thị ngôi sao đúng vị trí", async () => {
  const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
  // renderQuestionContext dùng chung cho study, thư viện và tổng kết
  assert.match(app, /function renderQuestionContext\(q,/);
  // Không chứa literal escape \u2605 hay \u2026 trong code thay thế
  assert.doesNotMatch(app, /\[\\u2605/);
  assert.doesNotMatch(app, /\[\\u2026/);
  // questionSearchCard và resultMarkup dùng renderQuestionContext
  assert.match(app, /renderQuestionContext\(q,\s*true\)/);
});

test("Furigana options: không ghi đè showRuby: true cố định khi người dùng tắt furigana", async () => {
  const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
  assert.doesNotMatch(app, /showOptRuby\s*=\s*isKanjiWriting\s*&&\s*!result\s*\?\s*false\s*:\s*true/);
  assert.match(app, /showOptRuby\s*=\s*isKanjiWriting\s*&&\s*!result\s*\?\s*false\s*:\s*undefined/);
});

test("Explanation renderer (U1 & U3): truyền currentFurigana() và tuân thủ design tokens trong styles.css", async () => {
  const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");

  // Truyền showRuby: currentFurigana() vào các điểm hiển thị lời giải
  assert.match(app, /formatExplanationHtml\(q\.explanation,\s*\{\s*isJapanese:\s*true,\s*showRuby:\s*currentFurigana\(\)\s*\}\)/);
  assert.match(app, /formatExplanationHtml\(q\.explanation,\s*\{\s*isJapanese:\s*isJa,\s*showRuby:\s*currentFurigana\(\)\s*\}\)/);

  // styles.css: .explanation-row có white-space: pre-wrap
  assert.match(css, /\.explanation-row\s*\{[^}]*white-space:\s*pre-wrap/);

  // Không dùng biến undefined --text trong explanation hay furigana-toggle
  assert.doesNotMatch(css, /\.explanation-translation\s*\{[^}]*var\(--text\)/);
  assert.doesNotMatch(css, /\.explanation-text\s*\{[^}]*var\(--text\)/);
  assert.doesNotMatch(css, /\.furigana-toggle\s*\{[^}]*var\(--border\)/);
  assert.doesNotMatch(css, /\.furigana-toggle\s*\{[^}]*var\(--card\)/);
  assert.doesNotMatch(css, /\.furigana-toggle\s*\{[^}]*var\(--text\)/);
});
