import assert from "node:assert/strict";
import { createHash, webcrypto } from "node:crypto";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";

const root = new URL("../", import.meta.url);
const pwaSource = await readFile(new URL("pwa.js", root), "utf8");
const workerSource = await readFile(new URL("sw.js", root), "utf8");
const VERSION = "0123456789ab";
const SCOPE = "https://example.test/nam-english/";
const PRECACHE_FILES = [
  "index.html",
  "styles.css",
  "app.js",
  "pwa.js",
  "core.js",
  "storage.js",
  "stats.js",
  "speech.js",
  "manifest.webmanifest",
  "favicon.svg",
  "QUESTION_CSV_GUIDE.md",
];
let moduleNumber = 0;

function eventHub(properties = {}) {
  const handlers = new Map();
  return Object.assign({
    addEventListener(type, listener) {
      if (!handlers.has(type)) handlers.set(type, new Set());
      handlers.get(type).add(listener);
    },
    removeEventListener(type, listener) {
      handlers.get(type)?.delete(listener);
    },
    emit(type, event = {}) {
      for (const listener of [...(handlers.get(type) || [])]) listener(event);
    },
    listeners(type) {
      return [...(handlers.get(type) || [])];
    },
  }, properties);
}

function replaceGlobal(name, value) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  return () => {
    if (previous) Object.defineProperty(globalThis, name, previous);
    else delete globalThis[name];
  };
}

async function withBrowser(globals, callback) {
  const restore = Object.entries(globals).map(([name, value]) => replaceGlobal(name, value));
  try {
    return await callback();
  } finally {
    restore.reverse().forEach((reset) => reset());
  }
}

async function loadPwaModule() {
  const source = pwaSource.replaceAll("__BUILD_VERSION__", VERSION);
  const dataUrl = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}#${moduleNumber += 1}`;
  return import(dataUrl);
}

async function flushAsyncWork() {
  await Promise.resolve();
  await new Promise((resolve) => setImmediate(resolve));
}

function versionedAssets(version) {
  return PRECACHE_FILES.map((file) => `./${file}?v=${version}`);
}

function urlFor(value, scope = SCOPE) {
  return new URL(typeof value === "string" ? value : value.url, scope).href;
}

function createCacheStorage(scope = SCOPE) {
  const entries = new Map();
  const caches = {
    async open(name) {
      if (!entries.has(name)) {
        const cache = {
          added: [],
          values: new Map(),
          async put(request, response) {
            const url = urlFor(request, scope);
            this.added.push(url);
            this.values.set(url, response);
          },
          async match(request) {
            return this.values.get(urlFor(request, scope));
          },
        };
        entries.set(name, cache);
      }
      return entries.get(name);
    },
    async keys() {
      return [...entries.keys()];
    },
    async delete(name) {
      return entries.delete(name);
    },
  };
  return { caches, entries };
}

function compileWorker({ version = VERSION, scope = SCOPE, storage = createCacheStorage(scope), responseForAsset } = {}) {
  const handlers = new Map();
  const self = {
    registration: { scope },
    crypto: webcrypto,
    addEventListener(type, listener) {
      if (!handlers.has(type)) handlers.set(type, []);
      handlers.get(type).push(listener);
    },
    // Both throw if the worker takes an eager-update path by mistake.
    skipWaiting() { throw new Error("worker must not force activation"); },
    clients: { claim() { throw new Error("worker must not force control"); } },
  };
  const networkRequests = [];
  const bodies = Object.fromEntries(versionedAssets(version).map((asset) => [urlFor(asset, scope), `precache:${asset}`]));
  const digests = Object.fromEntries(versionedAssets(version).map((asset) => {
    const url = urlFor(asset, scope);
    return [asset, createHash("sha256").update(bodies[url]).digest("hex")];
  }));
  const fetch = async (request) => {
    const url = urlFor(request, scope);
    networkRequests.push(url);
    if (responseForAsset) return responseForAsset(url, request);
    return new Response(bodies[url] ?? "not found", { status: bodies[url] ? 200 : 404 });
  };
  const source = workerSource
    .replaceAll("__BUILD_VERSION__", version)
    .replaceAll("__PRECACHE_ASSETS__", JSON.stringify(versionedAssets(version)))
    .replaceAll("__PRECACHE_DIGESTS__", JSON.stringify(digests));
  vm.runInNewContext(source, { self, caches: storage.caches, fetch, URL, Set, Promise, Request, Response, Uint8Array });
  return { handlers, networkRequests, storage };
}

async function fireWorker(worker, type, event = {}) {
  const waiters = [];
  const payload = {
    ...event,
    waitUntil(value) { waiters.push(Promise.resolve(value)); },
  };
  for (const listener of worker.handlers.get(type) || []) listener(payload);
  await Promise.all(waiters);
}

async function fetchFromWorker(worker, request) {
  let response;
  let responded = false;
  for (const listener of worker.handlers.get("fetch") || []) {
    listener({
      request,
      respondWith(value) {
        responded = true;
        response = Promise.resolve(value);
      },
    });
  }
  return { responded, response: responded ? await response : undefined };
}

test("PWA là tùy chọn: trình duyệt không hỗ trợ và callback lỗi không chặn việc học", async () => {
  const window = eventHub();
  const navigator = { onLine: true };
  await withBrowser({ window, document: { baseURI: SCOPE }, navigator }, async () => {
    const { initPwa } = await loadPwaModule();
    const unsupported = initPwa();
    assert.equal(typeof unsupported.promptInstall, "function");
    unsupported.dispose();

    const controller = initPwa({
      onConnectivityChange() { throw new Error("callback optional"); },
      onUpdateReady() { throw new Error("callback optional"); },
      onInstallAvailable() { throw new Error("callback optional"); },
    });
    assert.doesNotThrow(() => window.emit("offline"));
    assert.doesNotThrow(() => window.emit("beforeinstallprompt", { preventDefault() {} }));
    assert.doesNotThrow(() => window.emit("appinstalled"));
    controller.dispose();

    navigator.serviceWorker = { async register() { throw new Error("registration blocked"); } };
    const rejectedRegistration = initPwa();
    await flushAsyncWork();
    rejectedRegistration.dispose();
  });
});

test("PWA báo mạng và chỉ đưa nút cài đặt khi có beforeinstallprompt thật", async () => {
  const window = eventHub();
  const navigator = { onLine: true };
  await withBrowser({ window, document: { baseURI: SCOPE }, navigator }, async () => {
    const { initPwa } = await loadPwaModule();
    const connectivity = [];
    const installs = [];
    const controller = initPwa({
      onConnectivityChange: ({ online }) => connectivity.push(online),
      onInstallAvailable: (details) => installs.push(details),
    });
    assert.deepEqual(connectivity, [true]);
    navigator.onLine = false;
    window.emit("offline");
    assert.deepEqual(connectivity, [true, false]);

    let prevented = false;
    let prompted = false;
    window.emit("beforeinstallprompt", {
      preventDefault() { prevented = true; },
      async prompt() { prompted = true; },
      userChoice: Promise.resolve({ outcome: "accepted" }),
    });
    assert.equal(prevented, true);
    assert.equal(typeof installs.at(-1).promptInstall, "function");
    assert.equal(await installs.at(-1).promptInstall(), true);
    assert.equal(prompted, true);
    assert.equal(installs.at(-1).promptInstall, null);

    controller.dispose();
    navigator.onLine = true;
    window.emit("online");
    assert.deepEqual(connectivity, [true, false]);
  });
});

test("PWA chờ lifecycle mặc định và dispose được race updatefound an toàn", async () => {
  const window = eventHub();
  const registration = eventHub({ waiting: {}, installing: null });
  const registerCalls = [];
  const navigator = {
    onLine: true,
    serviceWorker: {
      controller: {},
      async register(url, options) {
        registerCalls.push({ url, options });
        return registration;
      },
    },
  };
  await withBrowser({ window, document: { baseURI: SCOPE }, navigator }, async () => {
    const { initPwa } = await loadPwaModule();
    const updates = [];
    const controller = initPwa({ onUpdateReady: (...args) => updates.push(args) });
    await flushAsyncWork();
    assert.equal(registerCalls.length, 1);
    assert.equal(registerCalls[0].url.href, `${SCOPE}sw.js?v=${VERSION}`);
    assert.deepEqual(registerCalls[0].options, { scope: "./", updateViaCache: "none" });
    assert.deepEqual(updates, [[]]);

    const installing = eventHub({ state: "installing" });
    registration.installing = installing;
    registration.emit("updatefound");
    const staleUpdateListener = registration.listeners("updatefound")[0];
    const staleStateListener = installing.listeners("statechange")[0];
    installing.state = "installed";
    installing.emit("statechange");
    assert.equal(updates.length, 2);

    controller.dispose();
    assert.equal(registration.listeners("updatefound").length, 0);
    assert.equal(installing.listeners("statechange").length, 0);
    assert.doesNotThrow(() => staleUpdateListener());
    assert.doesNotThrow(() => staleStateListener());
    assert.equal(updates.length, 2);
  });
});

test("worker precache đúng phiên bản, không đụng cache khác và không ép cập nhật", async () => {
  const storage = createCacheStorage();
  const worker = compileWorker({ storage });
  await fireWorker(worker, "install");
  const prefix = "nam-english:/nam-english/:v";
  const currentName = `${prefix}${VERSION}`;
  const current = await storage.caches.open(currentName);
  assert.deepEqual(current.added, versionedAssets(VERSION).map((asset) => urlFor(asset)));
  assert.ok(current.added.every((asset) => asset.endsWith(`?v=${VERSION}`)));
  assert.equal(workerSource.includes("caches.match("), false);
  assert.equal(workerSource.includes("skipWaiting"), false);
  assert.equal(workerSource.includes("clients.claim"), false);

  storage.entries.set(`${prefix}older`, { foreign: false });
  storage.entries.set("nam-english:/another-app/:volder", { foreign: true });
  storage.entries.set("other-product-cache", { foreign: true });
  await fireWorker(worker, "activate");
  assert.equal(storage.entries.has(`${prefix}older`), false);
  assert.equal(storage.entries.has(currentName), true);
  assert.equal(storage.entries.has("nam-english:/another-app/:volder"), true);
  assert.equal(storage.entries.has("other-product-cache"), true);
});

test("worker tách bundle cũ/mới và chặn URL cũ hoặc cache miss để không trộn mã", async () => {
  const oldVersion = "aaaaaaaaaaaa";
  const newVersion = "bbbbbbbbbbbb";
  const storage = createCacheStorage();
  const oldWorker = compileWorker({ version: oldVersion, storage });
  const newWorker = compileWorker({ version: newVersion, storage });
  await fireWorker(oldWorker, "install");
  await fireWorker(newWorker, "install");

  const prefix = "nam-english:/nam-english/:v";
  const oldCache = await storage.caches.open(`${prefix}${oldVersion}`);
  const newCache = await storage.caches.open(`${prefix}${newVersion}`);
  oldCache.values.set(urlFor(`./index.html?v=${oldVersion}`), { source: "old-index" });
  newCache.values.set(urlFor(`./index.html?v=${newVersion}`), { source: "new-index" });
  oldCache.values.set(urlFor(`./styles.css?v=${oldVersion}`), { source: "old-style" });
  newCache.values.set(urlFor(`./styles.css?v=${newVersion}`), { source: "new-style" });
  newCache.values.set(urlFor(`./QUESTION_CSV_GUIDE.md?v=${newVersion}`), { source: "new-guide" });

  const oldNavigation = await fetchFromWorker(oldWorker, {
    method: "GET", mode: "navigate", url: SCOPE,
  });
  const newNavigation = await fetchFromWorker(newWorker, {
    method: "GET", mode: "navigate", url: SCOPE,
  });
  assert.equal(oldNavigation.response.source, "old-index");
  assert.equal(newNavigation.response.source, "new-index");
  const guideNavigation = await fetchFromWorker(newWorker, {
    method: "GET", mode: "navigate", url: urlFor(`./QUESTION_CSV_GUIDE.md?v=${newVersion}`),
  });
  assert.equal(guideNavigation.response.source, "new-guide");

  const oldAsset = await fetchFromWorker(oldWorker, {
    method: "GET", mode: "cors", url: urlFor(`./styles.css?v=${oldVersion}`),
  });
  assert.equal(oldAsset.response.source, "old-style");
  const requestsBeforeStaleAsset = newWorker.networkRequests.length;
  const staleAsset = await fetchFromWorker(newWorker, {
    method: "GET", mode: "cors", url: urlFor(`./styles.css?v=${oldVersion}`),
  });
  assert.equal(staleAsset.responded, true);
  assert.equal(staleAsset.response.status, 503);
  assert.equal(newWorker.networkRequests.length, requestsBeforeStaleAsset);

  const emptyStorage = createCacheStorage();
  const missWorker = compileWorker({ storage: emptyStorage });
  const expectedRequest = {
    method: "GET", mode: "cors", url: urlFor(`./styles.css?v=${VERSION}`),
  };
  // Với self-repair: cache rỗng + server cùng version = repair thành công
  const cacheMiss = await fetchFromWorker(missWorker, expectedRequest);
  assert.notEqual(cacheMiss.response.status, 503, "repair phải thành công khi server cùng bản");
  assert.ok(missWorker.networkRequests.length > 0, "repair phải fetch từ server");
  const navigationMiss = await fetchFromWorker(missWorker, {
    method: "GET", mode: "navigate", url: SCOPE,
  });
  assert.notEqual(navigationMiss.response.status, 503, "navigation sau repair phải thành công");
});

test("precache thất bại không làm hỏng cache phiên bản đang hoạt động", async () => {
  const storage = createCacheStorage();
  const prefix = "nam-english:/nam-english/:v";
  const current = await storage.caches.open(`${prefix}${VERSION}`);
  current.values.set(urlFor(`./index.html?v=${VERSION}`), { source: "active-shell" });
  const worker = compileWorker({
    storage,
    responseForAsset: () => new Response("changed during deploy", { status: 200 }),
  });
  await assert.rejects(fireWorker(worker, "install"), /Không thể kiểm tra tài nguyên PWA/);
  assert.equal(storage.entries.has(`${prefix}${VERSION}`), true);
  assert.equal((await storage.caches.open(`${prefix}${VERSION}`)).values.get(urlFor(`./index.html?v=${VERSION}`)).source, "active-shell");

  const freshStorage = createCacheStorage();
  const freshWorker = compileWorker({
    storage: freshStorage,
    responseForAsset: () => new Response("changed during deploy", { status: 200 }),
  });
  await assert.rejects(fireWorker(freshWorker, "install"), /Không thể kiểm tra tài nguyên PWA/);
  assert.equal(freshStorage.entries.has(`${prefix}${VERSION}`), false);
});

test("cache mất hoàn toàn nhưng server cùng bản: repair tải lại và trả response đúng", async () => {
  // Bước 1: cài worker thành công để có cache
  const storage = createCacheStorage();
  const worker = compileWorker({ storage });
  await fireWorker(worker, "install");
  const prefix = "nam-english:/nam-english/:v";
  const cacheName = `${prefix}${VERSION}`;
  assert.equal(storage.entries.has(cacheName), true);

  // Bước 2: xóa toàn bộ cache — giả lập browser eviction
  storage.entries.delete(cacheName);
  assert.equal(storage.entries.has(cacheName), false);

  // Bước 3: navigation request phải repair cache rồi trả response
  const nav = await fetchFromWorker(worker, {
    method: "GET", mode: "navigate", url: SCOPE,
  });
  assert.equal(nav.responded, true);
  assert.notEqual(nav.response.status, 503, "navigation không được trả 503 sau repair");
  // Worker đã fetch lại các assets
  assert.ok(worker.networkRequests.length > 0, "phải có network request để repair");

  // Bước 4: asset request cũng phải thành công
  const asset = await fetchFromWorker(worker, {
    method: "GET", mode: "cors", url: urlFor(`./styles.css?v=${VERSION}`),
  });
  assert.equal(asset.responded, true);
  assert.notEqual(asset.response.status, 503, "asset không được trả 503 sau repair");

  // Bước 5: cache đã được phục hồi
  assert.equal(storage.entries.has(cacheName), true);
});

test("cache mất một phần: repair chỉ tải asset thiếu, không tải lại toàn bộ", async () => {
  const storage = createCacheStorage();
  const worker = compileWorker({ storage });
  await fireWorker(worker, "install");
  const prefix = "nam-english:/nam-english/:v";
  const cacheName = `${prefix}${VERSION}`;
  const cache = await storage.caches.open(cacheName);

  // Xóa chỉ một asset khỏi cache
  const removedUrl = urlFor(`./styles.css?v=${VERSION}`);
  cache.values.delete(removedUrl);
  const requestsBefore = worker.networkRequests.length;

  // Request trực tiếp asset bị xóa — phải trigger repair
  const asset = await fetchFromWorker(worker, {
    method: "GET", mode: "cors", url: urlFor(`./styles.css?v=${VERSION}`),
  });
  assert.equal(asset.responded, true);
  assert.notEqual(asset.response.status, 503, "asset bị thiếu phải được repair");

  // Repair phải đã fetch chỉ asset thiếu (styles.css), không phải toàn bộ
  const repairRequests = worker.networkRequests.slice(requestsBefore);
  assert.ok(repairRequests.length > 0, "phải fetch asset thiếu");
  assert.ok(repairRequests.length < PRECACHE_FILES.length, "không fetch lại toàn bộ");

  // Navigation vẫn phải OK (index.html không bao giờ bị mất)
  const nav = await fetchFromWorker(worker, {
    method: "GET", mode: "navigate", url: SCOPE,
  });
  assert.equal(nav.responded, true);
  assert.notEqual(nav.response.status, 503);
});

test("cache mất + server đã deploy bản mới (SHA-256 sai): trả 503 và không ghi cache sai", async () => {
  const storage = createCacheStorage();
  // Compile worker nhưng server trả nội dung khác (bản mới)
  const worker = compileWorker({
    storage,
    responseForAsset: () => new Response("content-from-newer-deploy", { status: 200 }),
  });
  // Không gọi install (giả lập cache đã mất, worker cùng version active)

  const nav = await fetchFromWorker(worker, {
    method: "GET", mode: "navigate", url: SCOPE,
  });
  assert.equal(nav.responded, true);
  assert.equal(nav.response.status, 503, "phải trả 503 khi server đã đổi bản");

  const asset = await fetchFromWorker(worker, {
    method: "GET", mode: "cors", url: urlFor(`./app.js?v=${VERSION}`),
  });
  assert.equal(asset.responded, true);
  assert.equal(asset.response.status, 503, "asset cũng phải 503");
});

test("cache mất + offline (fetch thất bại): trả 503", async () => {
  const storage = createCacheStorage();
  const worker = compileWorker({
    storage,
    responseForAsset: () => { throw new TypeError("Failed to fetch"); },
  });

  const nav = await fetchFromWorker(worker, {
    method: "GET", mode: "navigate", url: SCOPE,
  });
  assert.equal(nav.responded, true);
  assert.equal(nav.response.status, 503, "phải trả 503 khi offline");
});

test("cache mất + cache.put lỗi (quota): trả 503 và không crash", async () => {
  const storage = createCacheStorage();
  const worker = compileWorker({ storage });
  // Cài thành công để tạo cache, rồi xóa
  await fireWorker(worker, "install");
  const prefix = "nam-english:/nam-english/:v";
  const cacheName = `${prefix}${VERSION}`;
  storage.entries.delete(cacheName);

  // Patch cache.put để throw QuotaExceededError
  const originalOpen = storage.caches.open.bind(storage.caches);
  storage.caches.open = async (name) => {
    const cache = await originalOpen(name);
    const originalPut = cache.put.bind(cache);
    cache.put = async () => { throw new DOMException("quota exceeded", "QuotaExceededError"); };
    return cache;
  };

  const nav = await fetchFromWorker(worker, {
    method: "GET", mode: "navigate", url: SCOPE,
  });
  assert.equal(nav.responded, true);
  assert.equal(nav.response.status, 503, "phải trả 503 khi quota đầy");
});

test("hai request concurrent chỉ trigger repair một lần (serialize)", async () => {
  const storage = createCacheStorage();
  let fetchCount = 0;
  const worker = compileWorker({
    storage,
    responseForAsset: (url, request) => {
      fetchCount++;
      // Trả đúng nội dung (default behavior)
      const body = `precache:${new URL(url).pathname.split("/").pop()}`;
      return null; // Dùng null để fallback về default
    },
  });
  // Re-compile with proper tracking
  fetchCount = 0;
  const worker2 = compileWorker({ storage });
  await fireWorker(worker2, "install");
  const prefix = "nam-english:/nam-english/:v";
  const cacheName = `${prefix}${VERSION}`;
  storage.entries.delete(cacheName);

  const networkBefore = worker2.networkRequests.length;

  // Hai request đồng thời
  const [nav, asset] = await Promise.all([
    fetchFromWorker(worker2, { method: "GET", mode: "navigate", url: SCOPE }),
    fetchFromWorker(worker2, { method: "GET", mode: "cors", url: urlFor(`./app.js?v=${VERSION}`) }),
  ]);
  assert.equal(nav.responded, true);
  assert.equal(asset.responded, true);
  assert.notEqual(nav.response.status, 503);
  assert.notEqual(asset.response.status, 503);

  // Phải chỉ fetch mỗi asset một lần, không fetch trùng
  const repairRequests = worker2.networkRequests.slice(networkBefore);
  const uniqueRequests = new Set(repairRequests);
  assert.equal(repairRequests.length, uniqueRequests.size, "không fetch trùng asset");
});
