// Clean-share demo service worker — cache-first, offline after first load.
// No analytics, no network calls for the app itself.
const CACHE = "clean-share-demo-v1";
const ASSETS = [
  "./",
  "index.html",
  "app.js",
  "style.css",
  "manifest.json",
  "icon.svg",
  "i18n/en.json",
  "../core/clean-share.js",
  "clean-whatsapp-link.html",
  "remove-utm-from-link.html",
  "wa-me-link-generator.html",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => Promise.allSettled(ASSETS.map((u) => cache.add(u)))).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => cached || fetch(event.request))
  );
});
