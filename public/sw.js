// ================================================================
// يالا نلعب — Service Worker v3.0 (Star Wars Edition)
// ================================================================

const CACHE_NAME = "yalanelab-v3";
const STATIC_CACHE = "yalanelab-static-v3";
const API_CACHE = "yalanelab-api-v3";

// Static assets to precache
const PRECACHE_URLS = [
  "/",
  "/offline",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// API routes to cache with network-first strategy
const API_ROUTES = [
  "/api/country-war",
  "/api/online-count",
  "/api/leaderboard",
];

// ── Install ──────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS.map(url => new Request(url, { cache: "reload" })));
    }).then(() => self.skipWaiting())
  );
});

// ── Activate ─────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME && key !== STATIC_CACHE && key !== API_CACHE)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, non-same-origin
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Skip Next.js internals
  if (url.pathname.startsWith("/_next/webpack-hmr") ||
      url.pathname.startsWith("/_next/static/chunks") ||
      url.pathname.includes("__nextjs")) return;

  // API routes — Network first, cache fallback (5s timeout)
  if (url.pathname.startsWith("/api/")) {
    const isApiRoute = API_ROUTES.some(r => url.pathname.startsWith(r));
    if (!isApiRoute) return;

    event.respondWith(
      Promise.race([
        fetch(request.clone()).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(API_CACHE).then(cache => {
              cache.put(request, clone);
            });
          }
          return res;
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 5000))
      ]).catch(() => caches.match(request))
    );
    return;
  }

  // Static assets — Cache first
  if (url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/icons/") ||
      url.pathname.startsWith("/images/") ||
      url.pathname.endsWith(".png") ||
      url.pathname.endsWith(".jpg") ||
      url.pathname.endsWith(".svg") ||
      url.pathname.endsWith(".woff2")) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(STATIC_CACHE).then(cache => cache.put(request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // HTML pages — Network first, offline fallback
  if (request.headers.get("Accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return res;
        })
        .catch(() =>
          caches.match(request)
            .then(cached => cached || caches.match("/offline") || caches.match("/"))
        )
    );
    return;
  }
});

// ── Push Notifications ────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try { payload = event.data.json(); }
  catch { payload = { title: "يالا نلعب", body: event.data.text() }; }

  const options = {
    body: payload.body || "لديك إشعار جديد",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-96.png",
    tag: payload.tag || "yalanelab",
    renotify: true,
    dir: "rtl",
    lang: "ar",
    vibrate: [200, 100, 200],
    data: { url: payload.url || "/" },
    actions: payload.actions || [
      { action: "open",    title: "فتح" },
      { action: "dismiss", title: "إغلاق" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || "يالا نلعب", options)
  );
});

// ── Notification Click ────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;

  const urlToOpen = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url === urlToOpen && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    })
  );
});

// ── Background Sync ───────────────────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-game-data") {
    event.waitUntil(
      // Try to sync any queued game actions
      fetch("/api/sync", { method: "POST" }).catch(() => {})
    );
  }
});

// ── Message Handler ───────────────────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") self.skipWaiting();
  if (event.data === "clearCache") {
    caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
  }
});
