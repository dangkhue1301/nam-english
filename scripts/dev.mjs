import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
const port = Number(process.env.PORT || 4173);
const mime = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".md": "text/markdown", ".webmanifest": "application/manifest+json" };
http.createServer(async (req, res) => {
  try {
    let route = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    route = route.replace(/^\/nam-english/, "");
    const file = path.resolve(root, `.${route.endsWith("/") ? `${route}index.html` : route}`);
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    const bytes = await readFile(file);
    res.writeHead(200, { "Content-Type": `${mime[path.extname(file)] || "application/octet-stream"}; charset=utf-8`, "Cache-Control": "no-store" });
    res.end(bytes);
  } catch { res.writeHead(404).end("Not found"); }
}).listen(port, "127.0.0.1", () => console.log(`NẮM: http://127.0.0.1:${port}/nam-english/`));
