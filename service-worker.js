// Service worker minimal - nge-cache "app shell" (index.html + icon) supaya:
// 1) browser menganggap ini installable (syarat PWA: punya manifest + service worker)
// 2) app tetap bisa kebuka (tampilan kosong/login) walau sinyal lagi jelek banget.
// Data laporan (getData dkk) TETAP selalu diambil langsung dari API Apps Script,
// TIDAK di-cache, jadi datanya selalu yang terbaru.
//
// Strategi: NETWORK-FIRST. Tiap buka app, selalu coba ambil versi TERBARU dari
// internet dulu (biar update kode/fix ke-download otomatis, gak perlu install
// ulang). Kalau gagal (offline/sinyal jelek), baru pakai salinan terakhir yang
// sempat ke-cache.
const CACHE_NAME = 'selisih-hisana-shell-v2';
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
  // Jangan sentuh panggilan ke API Apps Script - data harus selalu fresh/live,
  // biar tetap jalan normal juga kalau ada request non-GET (POST simpan data dll).
  if (url.includes('script.google.com')) return;

  event.respondWith(
    fetch(event.request)
      .then((fresh) => {
        // Berhasil dapet versi terbaru dari internet -> update juga cache-nya
        // buat cadangan offline berikutnya.
        const copy = fresh.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return fresh;
      })
      .catch(() => caches.match(event.request)) // offline -> pakai cache terakhir
  );
});

