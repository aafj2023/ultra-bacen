// BCB Study — Service Worker (PWA offline).
// Convenção: ao mudar QUALQUER lib/versão do PRECACHE, bump em CACHE ('bcb-vN')
// e manter as URLs idênticas às tags do index.html (duplicação deliberada).
const CACHE = 'bcb-v1';
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png',
  'https://cdn.jsdelivr.net/npm/chart.js@4.5.0/dist/chart.umd.js',
  'https://cdn.jsdelivr.net/npm/dexie@4.4.4/dist/dexie.min.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js',
  'https://cdn.jsdelivr.net/npm/katex@0.17.0/dist/katex.min.css',
  'https://cdn.jsdelivr.net/npm/katex@0.17.0/dist/katex.min.js',
  'https://cdn.jsdelivr.net/npm/katex@0.17.0/dist/contrib/auto-render.min.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(PRECACHE.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      // limpa versões antigas do BCB e o cache órfão do app v1 (ultra-bacen-*);
      // NUNCA toca caches de outros apps do domínio (ex.: rplus-*)
      .then((ks) => Promise.all(ks
        .filter((k) => k !== CACHE && (k.startsWith('bcb') || k.startsWith('ultra-bacen')))
        .map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return; // não intercepta POST (Firestore)

  // Documento: network-first (sempre o mais novo online), cache offline
  if (req.mode === 'navigate' || req.destination === 'document') {
    e.respondWith(
      fetch(req)
        .then((r) => { const cp = r.clone(); caches.open(CACHE).then((c) => c.put('./index.html', cp)); return r; })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
    return;
  }

  // Libs/ícones: cache-first com atualização em segundo plano
  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((r) => {
        if (r && r.status === 200) { const cp = r.clone(); caches.open(CACHE).then((c) => c.put(req, cp)); }
        return r;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
