// Bộ đệm chỉ dành cho đúng scope NẮM hiện tại. Build thay thế hai placeholder
// dưới đây trước khi phát hành. Không ép worker mới kích hoạt hay nhận quyền:
// tab đang học giữ bundle cũ cho đến khi vòng đời mặc định an toàn.
const BUILD_VERSION = "__BUILD_VERSION__";
const SCOPE_URL = new URL(self.registration.scope);
const SCOPE_PATH = SCOPE_URL.pathname;
const CACHE_PREFIX = `nam-english:${SCOPE_PATH}:v`;
const CACHE_NAME = `${CACHE_PREFIX}${BUILD_VERSION}`;
const APP_SHELL = __PRECACHE_ASSETS__;
const APP_ASSET_DIGESTS = __PRECACHE_DIGESTS__;
const APP_ASSET_URLS = new Set(APP_SHELL.map((asset) => new URL(asset, SCOPE_URL).href));
const APP_ASSET_PATHS = new Set(APP_SHELL.map((asset) => new URL(asset, SCOPE_URL).pathname));
const OFFLINE_INDEX_URL = new URL(`./index.html?v=${BUILD_VERSION}`, SCOPE_URL).href;

function isInThisScope(url) {
  return url.origin === SCOPE_URL.origin && url.pathname.startsWith(SCOPE_PATH);
}

function isAppShellNavigation(url) {
  return url.pathname === SCOPE_PATH || url.pathname === `${SCOPE_PATH}index.html`;
}

async function versionCache() {
  return caches.open(CACHE_NAME);
}

async function cachedForThisVersion(request) {
  return (await versionCache()).match(request);
}

function unavailableResponse() {
  return new Response("Phiên bản tài nguyên này chưa sẵn sàng. Hãy đóng các tab NẮM và mở lại khi có mạng.", {
    status: 503,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

async function sha256Hex(buffer) {
  if (!self.crypto?.subtle) throw new Error("Trình duyệt không hỗ trợ kiểm tra tài nguyên PWA.");
  const digest = await self.crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function verifiedAsset(asset) {
  const request = new Request(new URL(asset, SCOPE_URL).href, { cache: "reload" });
  const response = await fetch(request);
  const expected = APP_ASSET_DIGESTS[asset];
  if (!response.ok || !expected || await sha256Hex(await response.clone().arrayBuffer()) !== expected) {
    throw new Error(`Không thể kiểm tra tài nguyên PWA: ${asset}`);
  }
  return [request, response];
}

async function precache() {
  const cacheExisted = (await caches.keys()).includes(CACHE_NAME);
  const cache = await versionCache();
  try {
    const assets = await Promise.all(APP_SHELL.map(verifiedAsset));
    await Promise.all(assets.map(([request, response]) => cache.put(request, response)));
  } catch (error) {
    // A reinstall can reuse the active cache name. Never erase that known
    // shell merely because a new install attempt failed.
    if (!cacheExisted) await caches.delete(CACHE_NAME);
    throw error;
  }
}

// Self-repair: khi cache bị mất (browser eviction, user xóa...) mà worker
// cùng phiên bản vẫn active, thử tải lại tài nguyên từ server và kiểm tra
// SHA-256. Chỉ ghi cache nếu digest khớp — không giả tài nguyên bản mới
// thành bản cũ. Serialize để nhiều tab không fetch trùng.
let repairPromise = null;

async function repairCache() {
  const cache = await versionCache();
  const missing = [];
  for (const asset of APP_SHELL) {
    const url = new URL(asset, SCOPE_URL).href;
    if (!await cache.match(url)) missing.push(asset);
  }
  if (!missing.length) return true;
  try {
    const fetched = await Promise.all(missing.map(verifiedAsset));
    await Promise.all(fetched.map(([request, response]) => cache.put(request, response)));
    return true;
  } catch {
    return false;
  }
}

async function ensureCacheIntegrity(request) {
  if (!repairPromise) {
    repairPromise = repairCache().finally(() => { repairPromise = null; });
  }
  const repaired = await repairPromise;
  if (repaired) return (await versionCache()).match(request);
  return null;
}

async function navigationResponse(request) {
  const cached = await cachedForThisVersion(OFFLINE_INDEX_URL);
  if (cached) return cached;
  const repaired = await ensureCacheIntegrity(new Request(OFFLINE_INDEX_URL));
  return repaired || unavailableResponse();
}

async function assetResponse(request) {
  const cached = await cachedForThisVersion(request);
  if (cached) return cached;
  const repaired = await ensureCacheIntegrity(request);
  return repaired || unavailableResponse();
}

self.addEventListener("install", (event) => {
  // Rejection keeps the currently active worker in control when precache fails.
  event.waitUntil(precache());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
        .map((key) => caches.delete(key)),
    )),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (!isInThisScope(url)) return;

  if (request.mode === "navigate" && isAppShellNavigation(url)) {
    event.respondWith(navigationResponse(request));
    return;
  }
  if (APP_ASSET_PATHS.has(url.pathname)) {
    event.respondWith(APP_ASSET_URLS.has(url.href) ? assetResponse(request) : unavailableResponse());
  }
});
