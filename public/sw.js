const CACHE = "volta-shell-v4";
const OFFLINE_URL = "/offline.html";
const PRECACHE = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/volta-icon.svg",
  "/apple-touch-icon.png",
  "/icon-192.png",
  "/icon-512.png",
];

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
    await Promise.all(
      keys
        .filter((key) => key.startsWith("volta-shell-") && key !== CACHE)
        .map((key) => caches.delete(key)),
    );
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache authenticated API traffic.
  if (/\/(?:auth\/v1|rest\/v1|functions\/v1)\//.test(url.pathname)) return;

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          const cacheControl = response.headers.get("cache-control") || "";
          // Cache only the public root shell, never route-specific or account-specific pages.
          if (
            url.pathname === "/" &&
            !url.search &&
            response.ok &&
            (response.headers.get("content-type") || "").includes("text/html") &&
            !response.headers.has("set-cookie") &&
            !/no-store|private/i.test(cacheControl)
          ) {
            const cache = await caches.open(CACHE);
            await cache.put("/", response.clone());
          }
          return response;
        } catch {
          const shell = await caches.match("/");
          if (shell) return shell;
          const offline = await caches.match(OFFLINE_URL);
          return (
            offline ||
            new Response(
              "لا يوجد اتصال بالإنترنت. أعد فتح VOLTA عند عودة الاتصال؛ لن تُرسل العمليات المحفوظة إلا بعد استعادة جلسة المستخدم.",
              { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } },
            )
          );
        }
      })(),
    );
    return;
  }

  if (/\.(?:js|css|svg|png|jpg|jpeg|webp|woff2?)$/i.test(url.pathname)) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        const cacheControl = response.headers.get("cache-control") || "";
        if (
          response.ok &&
          response.type === "basic" &&
          !response.headers.has("set-cookie") &&
          !/no-store|private/i.test(cacheControl)
        ) {
          const cache = await caches.open(CACHE);
          await cache.put(request, response.clone());
        }
        return response;
      })(),
    );
  }
});
