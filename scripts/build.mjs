import {
  copyFile,
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptsDirectory, "..");
const outputDirectory = path.join(projectDirectory, "dist");
const files = [
  "index.html",
  "styles.css",
  "app.js",
  "pwa.js",
  "core.js",
  "storage.js",
  "stats.js",
  "speech.js",
  "japanese.js",
  "sw.js",
  "manifest.webmanifest",
  "favicon.svg",
  "QUESTION_CSV_GUIDE.md",
  "JAPANESE_CSV_GUIDE.md",
  ".nojekyll",
];
// Tất cả tài nguyên công khai mà giao diện cần khi mất mạng. Worker không tự
// có trong cache này vì trình duyệt quản lý worker theo URL có phiên bản riêng.
const precacheFiles = files.filter((file) => file !== "sw.js" && file !== ".nojekyll");
if (path.dirname(outputDirectory) !== projectDirectory) {
  throw new Error("Thư mục build không nằm trong dự án.");
}

const html = await readFile(
  path.join(projectDirectory, "index.html"),
  "utf8",
);
if (/(?:href|src)=["']\//i.test(html)) {
  throw new Error(
    "index.html có URL bắt đầu bằng /, sẽ lỗi khi chạy trong repository con.",
  );
}

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
await Promise.all(
  files.map((file) =>
    copyFile(
      path.join(projectDirectory, file),
      path.join(outputDirectory, file),
    ),
  ),
);

// Mọi phần của app shell cùng tham gia tạo phiên bản. Nhờ vậy HTML, manifest,
// icon và mọi mô-đun luôn đi cùng một cache PWA, không trộn bundle cũ/mới.
const versionSources = await Promise.all(files.map(async (file) => ({
  file,
  source: await readFile(path.join(projectDirectory, file)),
})));
const hash = createHash("sha256");
versionSources.forEach(({ file, source }) => {
  hash.update(file); hash.update("\0"); hash.update(source); hash.update("\0");
});
const version = hash.digest("hex").slice(0, 12);
const precacheAssets = precacheFiles.map((file) => `./${file}?v=${version}`);
for (const file of files.filter((file) => /\.(js|html|webmanifest)$/.test(file) && file !== "sw.js")) {
  const location = path.join(outputDirectory, file);
  let content = await readFile(location, "utf8");
  content = content.replaceAll("__BUILD_VERSION__", version);
  if (file.endsWith(".js") && file !== "sw.js") {
    content = content.replace(/from "\.\/([a-z-]+\.js)"/g, `from "./$1?v=${version}"`);
    content = content.replace(/\.\/QUESTION_CSV_GUIDE\.md(?:\?[^"']*)?/g, `./QUESTION_CSV_GUIDE.md?v=${version}`);
  }
  if (file === "index.html") {
    content = content.replace(/\.\/(app\.js|styles\.css|manifest\.webmanifest|favicon\.svg)(?:\?[^"']*)?/g, `./$1?v=${version}`);
    content = content.replace("<head>", `<head>\n    <meta name="build-version" content="${version}">`);
  }
  if (file === "manifest.webmanifest") content = content.replace(/\.\/favicon\.svg(?:\?[^"']*)?/g, `./favicon.svg?v=${version}`);
  await writeFile(location, content, "utf8");
}

const precacheDigests = Object.fromEntries(await Promise.all(precacheFiles.map(async (file) => {
  const source = await readFile(path.join(outputDirectory, file));
  return [`./${file}?v=${version}`, createHash("sha256").update(source).digest("hex")];
})));
const workerLocation = path.join(outputDirectory, "sw.js");
let worker = await readFile(workerLocation, "utf8");
worker = worker.replaceAll("__BUILD_VERSION__", version);
worker = worker.replaceAll("__PRECACHE_ASSETS__", JSON.stringify(precacheAssets));
worker = worker.replaceAll("__PRECACHE_DIGESTS__", JSON.stringify(precacheDigests));
await writeFile(workerLocation, worker, "utf8");

console.log(`Đã tạo ${files.length} tệp, phiên bản ${version}.`);
