// Service worker: guarda o app no aparelho para funcionar sem internet.
const CACHE = 'ponteiro-v7';
const ARQUIVOS = ['./', './index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// App: cache primeiro (abre no campo sem sinal). Outros pedidos (ex.: preços): rede primeiro.
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // Fontes: guarda uma cópia para o visual se manter sem sinal.
  if (url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com') {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
      const copia = resp.clone(); caches.open(CACHE).then(c => c.put(e.request, copia)); return resp;
    }).catch(() => new Response('', {status: 504}))));
    return;
  }
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request).then(resp => {
        const copia = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, copia));
        return resp;
      }))
    );
  }
});
