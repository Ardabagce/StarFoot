// StarFoot service worker: oyun dosyalarını önbelleğe alır, çevrimdışı oynanabilir.
// Oyun web'de gizli sayfada (oyna-r8k4tq.html); ana sayfa (index.html) yalnız tanıtım sayfası ve önbelleğe alınmaz.
const CACHE = 'starfoot-v70';
const ASSETS = [
  './oyna-r8k4tq.html', './manifest.webmanifest', './css/style.css',
  './js/util.js', './js/lang-en.js', './js/lang-es.js', './js/lang-pt.js', './js/lang-de.js', './js/lang-fr.js', './js/lang-it.js', './js/lang-id.js', './js/lang-ar.js', './js/lang-ja.js', './fonts/cairo-arabic-400-normal.woff2', './fonts/cairo-arabic-600-normal.woff2', './fonts/cairo-arabic-700-normal.woff2', './fonts/cairo-arabic-900-normal.woff2', './js/i18n.js', './js/ads-config.js', './js/admob.js', './js/icons.js', './js/data.js', './js/player.js', './js/league.js', './js/legends.js', './js/cups.js',
  './js/sprites.js', './js/shopart.js', './js/weather.js', './js/minigame.js', './js/drills.js', './js/tutorial.js', './js/match.js', './js/game.js', './js/extras.js', './js/socialart.js', './js/celebrate.js', './js/life.js', './js/captain.js', './js/premium.js', './js/meta.js', './js/legacy.js', './js/wc.js', './js/wcx.js', './js/lpath.js', './js/star.js', './js/app.js',
  './privacy.html', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-192.png', './icons/icon-maskable-512.png',
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
// Önce ağ, olmazsa önbellek: güncellemeler hemen gelir, internet yoksa oyun yine açılır
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request)),
  );
});
