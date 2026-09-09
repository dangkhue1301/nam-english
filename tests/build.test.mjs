import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

test("build cho Pages dùng cùng phiên bản tài nguyên, không xuất nội dung mẫu hay test", async () => {
  const root = new URL("../", import.meta.url);
  execFileSync(process.execPath, ["scripts/build.mjs"], { cwd: fileURLToPath(root) });
  const files = await readdir(new URL("dist/", root));
  assert.equal(files.length, 12);
  assert.equal(files.some((file) => /sample|test|fixture|\.csv$/.test(file)), false);
  const html = await readFile(new URL("dist/index.html", root), "utf8");
  const version = html.match(/name="build-version" content="([a-f0-9]+)"/)[1];
  assert.ok(html.includes(`app.js?v=${version}`)); assert.ok(html.includes(`styles.css?v=${version}`));
  assert.doesNotMatch(html, /(?:href|src)=["']\//);
  for (const file of files.filter((name) => name.endsWith(".js") && name !== "sw.js")) {
    const source = await readFile(new URL(`dist/${file}`, root), "utf8");
    for (const match of source.matchAll(/from "\.\/([^\"]+)"/g)) {
      assert.ok(match[1].endsWith(`?v=${version}`), `${file}: ${match[1]}`);
      assert.ok(files.includes(match[1].split("?")[0]));
    }
  }
});
