const CACHE = "volta-shell-v2";
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/manifest.webmanifest", "/volta-icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(PRECACHE);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("volta-shell-") && key !== CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (/\/(?:auth\/v1|rest\/v1|functions\/v1)\//.test(url.pathname)) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        const contentType = response.headers.get("content-type") || "";
        const cacheControl = response.headers.get("cache-control") || "";
        if (
          response.ok &&
          contentType.includes("text/html") &&
          !response.headers.has("set-cookie") &&
          !/no-store|private/i.test(cacheControl)
        ) {
          const cache = await caches.open(CACHE);
          await cache.put(request, response.clone());
          if (url.pathname === "/") await cache.put("/", response.clone());
        }
        return response;
      } catch {
        const cached = await caches.match(request) || await caches.match("/");
        return cached || await caches.match(OFFLINE_URL) || new Response("أنت غير متصل بالإنترنت. افتح التطبيق بعد الاتصال لتحديث البيانات.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }
    })());
    return;
  }

  if (/\.(?:js|css|svg|png|jpg|webp|woff2?)$/i.test(url.pathname)) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok && response.type === "basic") {
        const cache = await caches.open(CACHE);
        await cache.put(request, response.clone());
      }
      return response;
    })());
  }
});
