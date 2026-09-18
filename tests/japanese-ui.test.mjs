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
  assert.match(app, /data-filter="chapter"/);
  assert.match(app, /data-filter="lesson"/);
  assert.match(app, /data-filter="section"/);

  // Verify section mapping: Hán tự (kanji), Ngữ pháp (grammar), Từ vựng (vocabulary)
  assert.match(app, /val: "kanji", label: "Hán tự/);
  assert.match(app, /val: "grammar", label: "Ngữ pháp/);
  assert.match(app, /val: "vocabulary", label: "Từ vựng/);

  // Verify 3 distinct metrics in tree scope card
  assert.match(app, /ja-tree-scope-card/);
  assert.match(app, /Đã làm/);
  assert.match(app, /Cần luyện lại/);
  assert.match(app, /Đến hạn ôn/);
});

test("Phase C: app.js strictly blocks flashcards for Japanese", async () => {
  const app = await readFile(new URL("../app.js", import.meta.url), "utf8");

  // In homeMarkup: jaModeCards() does not render flashcards
  assert.match(app, /isJapanese \? jaModeCards\(\) :/);
  assert.doesNotMatch(app, /jaModeCards[\s\S]*?modeCard\("flashcards"/);

  // In vocabulary mode card for Japanese, only practice exercises and SRS due review
  assert.match(app, /câu từ vựng/);
  assert.match(app, /start-due-vocab/);
  assert.match(app, /từ đến hạn ôn/);

  // In start-due-vocab, Japanese uses mode: "vocabulary", NOT "flashcards"
  assert.match(app, /mode: isJapanese \? "vocabulary" : "flashcards"/);

  // In setCard, Japanese labels do not mention flashcards/mục đã học
  assert.match(app, /isJapanese \? "câu đã làm" : "mục đã học"/);

  // In resultMarkup, unit is "câu", not "thẻ"
  assert.match(app, /unit = isReview \? "câu sai" : isJapanese \? "câu" :/);
});

test("Phase C: Anti-leak rules in app.js and no furigana toggle", async () => {
  const app = await readFile(new URL("../app.js", import.meta.url), "utf8");

  // Furigana toggle functions and button removed
  assert.doesNotMatch(app, /function currentFurigana\(\)/);
  assert.doesNotMatch(app, /function applyFurigana\(val\)/);
  assert.doesNotMatch(app, /function toggleFurigana\(\)/);
  assert.doesNotMatch(app, /localStorage\.getItem\("nam-furigana"\)/);
  assert.doesNotMatch(app, /"toggle-furigana"/);
  assert.doesNotMatch(app, /furigana-toggle/);

  // Anti-leak K1: Target kanji in context must hide ruby before grading
  assert.match(app, /hideTarget: result \? null : q\.target/);

  // Anti-leak K2: Kanji options must not show ruby before grading
  assert.match(app, /isKanjiWriting && !result \? false : true/);
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
  assert.match(app, /s\.firstAnswers && s\.firstAnswers\[q\.id\] !== undefined/);
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
  assert.doesNotMatch(css, /\.furigana-toggle/);

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
  assert.match(css, /\.ja-scope-metrics/);
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
  assert.match(css, /\.ja-filter-row/);

  // Prompt does not force lang="ja"
  assert.doesNotMatch(app, /<h1 lang="ja">\$\{html\(q\.prompt\)\}<\/h1>/);
  assert.match(app, /<h1>\$\{html\(q\.prompt\)\}<\/h1>/);

  // Sentence builder wrapper does not force lang="ja"
  assert.doesNotMatch(app, /class="ja-sentence-builder"[^>]*lang="ja"/);
  assert.match(app, /class="muted ja-builder-placeholder" lang="vi"/);

  // Japanese set-focus header displays "câu đã làm" instead of "mục đã học"
  assert.match(app, /isJapanese \? "câu đã làm" : "mục đã học"/);

  // ja_grammar_order context uses ja-order-meaning with lang="vi"
  assert.match(app, /class="question-context ja-order-meaning" lang="vi"/);
});

test("JLPT authenticity: Furigana hidden across app and styles", async () => {
  const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
  const app = await readFile(new URL("../app.js", import.meta.url), "utf8");

  // In app.js, renderRubyHtml enforces showRuby: false
  assert.match(app, /renderRubyHtmlBase\(text,\s*\{\s*\.\.\.options,\s*showRuby:\s*false\s*\}\)/);

  // In styles.css, rt elements are hidden with display: none !important
  assert.match(css, /rt\s*\{[\s\S]*?display:\s*none\s*!important;/);
});
