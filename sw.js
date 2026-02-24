const CACHE = "bingo-v1";
const APP_SHELL = ["./", "./index.html"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE ? caches.delete(k) : null)))
  );
  self.clients.claim();
});

// Cache-first for the app shell, network-first for everything else (like the Sheet CSV)
self.addEventListener("fetch", (e) => {
  const req = e.request;

  // Make navigations open offline
  if (req.mode === "navigate") {
    e.respondWith(caches.match("./index.html").then(r => r || fetch(req)));
    return;
  }

  // App shell: cache-first
  if (APP_SHELL.some(p => req.url.endsWith(p.replace("./","")))) {
    e.respondWith(caches.match(req).then(r => r || fetch(req)));
    return;
  }

  // Sheet CSV etc: network-first, fallback to cache
  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req))
  );
});
