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
  "core.js",
  "storage.js",
  "stats.js",
  "speech.js",
  "sw.js",
  "manifest.webmanifest",
  "favicon.svg",
  "QUESTION_CSV_GUIDE.md",
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

// Mọi mô-đun dùng chung phiên bản tính từ nội dung để tránh trộn bản cũ và mới.
const sources = await Promise.all(files.filter((file) => /\.(js|css)$/.test(file)).map((file) => readFile(path.join(projectDirectory, file))));
const hash = createHash("sha256");
sources.forEach((source) => hash.update(source));
const version = hash.digest("hex").slice(0, 12);
for (const file of files.filter((file) => /\.(js|html)$/.test(file))) {
  const location = path.join(outputDirectory, file);
  let content = await readFile(location, "utf8");
  if (file.endsWith(".js") && file !== "sw.js") {
    content = content.replace(/from "\.\/([a-z-]+\.js)"/g, `from "./$1?v=${version}"`);
  }
  if (file === "index.html") {
    content = content.replace(/\.\/(app\.js|styles\.css)(?:\?[^"']*)?/g, `./$1?v=${version}`);
    content = content.replace("<head>", `<head>\n    <meta name="build-version" content="${version}">`);
  }
  await writeFile(location, content, "utf8");
}

console.log(`Đã tạo ${files.length} tệp, phiên bản ${version}.`);
