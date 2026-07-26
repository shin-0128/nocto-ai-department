/* Nocto AI Department — Service Worker
   完全オフライン動作。App Shell を precache し、cache-first で返す。
   デモの性質上「通信ゼロで動く」ことが要件なので network はフォールバックのみ。 */
const CACHE = 'nocto-aidept-v4';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// stale-while-revalidate: キャッシュを即返しつつ裏で最新を取得して次回に反映。
// → オフラインでも動き、かつデプロイした更新が次の起動で自動反映される。
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.open(CACHE).then((cache) =>
      cache.match(e.request, { ignoreSearch: true }).then((cached) => {
        const network = fetch(e.request)
          .then((res) => { if (res && res.status === 200) cache.put(e.request, res.clone()); return res; })
          .catch(() => cached || cache.match('./index.html'));
        return cached || network;
      })
    )
  );
});
