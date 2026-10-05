// StarFoot service worker: oyun dosyalarını önbelleğe alır, çevrimdışı oynanabilir
const CACHE = 'starfoot-v20';
const ASSETS = [
  './', './index.html', './manifest.webmanifest', './css/style.css',
  './js/util.js', './js/icons.js', './js/data.js', './js/player.js', './js/league.js', './js/legends.js', './js/cups.js',
  './js/sprites.js', './js/shopart.js', './js/weather.js', './js/minigame.js', './js/drills.js', './js/match.js', './js/game.js', './js/extras.js', './js/socialart.js', './js/celebrate.js', './js/life.js', './js/captain.js', './js/app.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png',
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
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html'))),
  );
});
