const CACHE_NAME = "travel-bucket-list-pwa-v2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  // Keep dynamic services fresh. Offline cache is mainly for the app shell.
  if (url.hostname.includes("firebase") ||
      url.hostname.includes("googleapis") ||
      url.hostname.includes("gstatic") ||
      url.hostname.includes("openstreetmap") ||
      url.hostname.includes("unpkg.com") ||
      url.hostname.includes("fonts.googleapis.com") ||
      url.hostname.includes("fonts.gstatic.com")) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      return response;
    }))
  );
});
