import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

const OUTPUT_FILES = [
  ".nojekyll",
  "QUESTION_CSV_GUIDE.md",
  "app.js",
  "core.js",
  "favicon.svg",
  "index.html",
  "manifest.webmanifest",
  "pwa.js",
  "speech.js",
  "stats.js",
  "storage.js",
  "styles.css",
  "sw.js",
];
const PRECACHE_FILES = OUTPUT_FILES.filter((file) => file !== ".nojekyll" && file !== "sw.js");

test("build Pages tạo shell PWA cùng phiên bản, digest và danh sách tài nguyên chính xác", async () => {
  const root = new URL("../", import.meta.url);
  execFileSync(process.execPath, ["scripts/build.mjs"], { cwd: fileURLToPath(root) });
  const files = await readdir(new URL("dist/", root));
  assert.deepEqual(files.sort(), OUTPUT_FILES);
  assert.equal(files.some((file) => /sample|test|fixture|\.csv$/.test(file)), false);

  const html = await readFile(new URL("dist/index.html", root), "utf8");
  const version = html.match(/name="build-version" content="([a-f0-9]{12})"/)?.[1];
  assert.ok(version);
  for (const asset of ["app.js", "styles.css", "manifest.webmanifest", "favicon.svg"]) {
    assert.ok(html.includes(`./${asset}?v=${version}`), asset);
  }
  assert.doesNotMatch(html, /(?:href|src)=["']\//);

  const manifest = JSON.parse(await readFile(new URL("dist/manifest.webmanifest", root), "utf8"));
  assert.equal(manifest.start_url, "./");
  assert.equal(manifest.scope, "./");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.icons[0].src, `./favicon.svg?v=${version}`);
  assert.deepEqual(manifest.shortcuts.map((shortcut) => shortcut.url), [
    "./?view=home", "./?view=library", "./?view=stats", "./?view=data",
  ]);

  for (const file of files.filter((name) => name.endsWith(".js") && name !== "sw.js")) {
    const source = await readFile(new URL(`dist/${file}`, root), "utf8");
    assert.doesNotMatch(source, /__BUILD_VERSION__/);
    for (const match of source.matchAll(/from "\.\/([^\"]+)"/g)) {
      assert.ok(match[1].endsWith(`?v=${version}`), `${file}: ${match[1]}`);
      assert.ok(files.includes(match[1].split("?")[0]));
    }
  }
  const app = await readFile(new URL("dist/app.js", root), "utf8");
  assert.match(app, new RegExp(`from "\\./pwa\\.js\\?v=${version}"`));
  assert.ok(app.includes(`./QUESTION_CSV_GUIDE.md?v=${version}`));

  const worker = await readFile(new URL("dist/sw.js", root), "utf8");
  assert.ok(worker.includes(`const BUILD_VERSION = "${version}";`));
  assert.doesNotMatch(worker, /__BUILD_VERSION__|__PRECACHE_ASSETS__|__PRECACHE_DIGESTS__/);
  const shell = JSON.parse(worker.match(/const APP_SHELL = (\[[^\r\n]*\]);/)?.[1] || "null");
  const digests = JSON.parse(worker.match(/const APP_ASSET_DIGESTS = (\{[^\r\n]*\});/)?.[1] || "null");
  const expectedAssets = PRECACHE_FILES.map((file) => `./${file}?v=${version}`);
  assert.deepEqual([...shell].sort(), [...expectedAssets].sort());
  assert.deepEqual(Object.keys(digests).sort(), [...expectedAssets].sort());
  for (const asset of expectedAssets) {
    const file = asset.slice(2).split("?")[0];
    const bytes = await readFile(new URL(`dist/${file}`, root));
    assert.equal(digests[asset], createHash("sha256").update(bytes).digest("hex"), file);
  }

  const sourceBuild = await readFile(new URL("scripts/build.mjs", root), "utf8");
  assert.match(sourceBuild, /hash\.update\(file\); hash\.update\("\\0"\); hash\.update\(source\)/);
  assert.match(sourceBuild, /const precacheFiles = files\.filter/);
});

test("nguồn UI chỉ nối PWA tùy chọn và Enter tôn trọng control tương tác", async () => {
  const root = new URL("../", import.meta.url);
  const app = await readFile(new URL("app.js", root), "utf8");
  const index = await readFile(new URL("index.html", root), "utf8");
  assert.match(app, /import \{ initPwa \} from "\.\/pwa\.js"/);
  assert.match(app, /initPwa\(\{/);
  assert.match(app, /onConnectivityChange:/);
  assert.match(app, /onUpdateReady:/);
  assert.match(app, /onInstallAvailable:/);
  assert.match(app, /const interactiveTarget = target\?\.closest\("button, a, summary/);
  assert.match(app, /if \(session\.result\) invokeAction\(\{ dataset: \{ action: "next" \} \}\);/);
  assert.doesNotMatch(app, /serviceWorker\.register\("\.\/sw\.js"\)/);
  assert.match(index, /id="pwa-status"/);
  assert.match(index, /id="pwa-install"/);
});

test("nguồn UI tích hợp đầy đủ thống kê, theme toggle, phím tắt và timer", async () => {
  const root = new URL("../", import.meta.url);
  const app = await readFile(new URL("app.js", root), "utf8");
  assert.match(app, /\["stats",\s*"Thống kê"\]/);
  assert.match(app, /function statsMarkup\(\)/);
  assert.match(app, /activity-chart/);
  assert.match(app, /heatmap/);
  assert.match(app, /domain-accuracy/);
  assert.match(app, /mastery-list/);
  assert.match(app, /achievements-grid/);
  assert.match(app, /toggle-theme/);
  assert.match(app, /toggle-timer/);
  assert.match(app, /help-shortcuts/);
  assert.match(app, /shortcut-list/);
  assert.match(app, /event\.key === "Escape"/);
  assert.match(app, /event\.key === "\?"/);
});
