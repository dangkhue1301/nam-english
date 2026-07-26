import {
  copyFile,
  mkdir,
  readFile,
  rm,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptsDirectory, "..");
const outputDirectory = path.join(projectDirectory, "dist");
const files = [
  "index.html",
  "styles.css",
  "app.js",
  "core.js",
  "storage.js",
  "stats.js",
  "speech.js",
  "sw.js",
  "manifest.webmanifest",
  "favicon.svg",
  "sample_questions.csv",
  "QUESTION_CSV_GUIDE.md",
  "og.png",
  ".nojekyll",
];

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

console.log(`Đã tạo bản tĩnh gồm ${files.length} tệp trong dist/.`);
