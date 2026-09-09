// Gỡ bộ đệm cũ. Dữ liệu bài học nằm trong IndexedDB, không nằm ở đây.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("nam-english-")).map((key) => caches.delete(key)));
    await self.registration.unregister();
    await self.clients.claim();
  })());
});
