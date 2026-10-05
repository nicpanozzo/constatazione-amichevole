// Cache dell'app per funzionare anche senza connessione sul luogo dell'incidente.
const CACHE = 'cai-v3';
const ASSETS = ['./', 'index.html', 'style.css', 'app.js', 'icon.svg', 'manifest.webmanifest', 'vendor/qrcode.js',
  'pdf.js', 'ocr.js', 'vendor/jspdf.umd.min.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Rete prima (per avere sempre l'ultima versione), cache se offline.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.hostname.includes('nominatim')) return;
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
  );
});
