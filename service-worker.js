// Service worker minimal - hanya nge-cache "app shell" (index.html + icon) supaya:
// 1) browser menganggap ini installable (syarat PWA: punya manifest + service worker)
// 2) app tetap bisa kebuka (tampilan kosong/login) walau sinyal lagi jelek banget.
// Data laporan (getData dkk) TETAP selalu diambil langsung dari API Apps Script,
// TIDAK di-cache, jadi datanya selalu yang terbaru.
const CACHE_NAME = 'selisih-hisana-shell-v1';
const SHELL_FILES = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  // Jangan cache panggilan ke API Apps Script - data harus selalu fresh/live.
  if (url.includes('script.google.com')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => cached);
    })
  );
});
