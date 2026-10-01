// Uygulama kabuğu: PWA, dokunmatik ayarları ve başlık ekranı çizimi

(function () {
  // Çift dokunma ve kıstırma ile yakınlaşmayı engelle (iOS Safari viewport ayarını yok sayabiliyor)
  let lastTouch = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouch < 320 && !e.target.closest('input, select, textarea')) e.preventDefault();
    lastTouch = now;
  }, { passive: false });
  ['gesturestart', 'gesturechange', 'dblclick'].forEach((ev) => document.addEventListener(ev, (e) => e.preventDefault(), { passive: false }));
  document.addEventListener('touchmove', (e) => { if (e.touches && e.touches.length > 1) e.preventDefault(); }, { passive: false });

  // Çevrimdışı oynanabilsin diye service worker (yalnızca http/https altında)
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => { /* desteklenmiyor */ });
    });
  }

  // Başlık ekranındaki gece maçı sahnesi
  const drawTitle = () => {
    const cv = document.getElementById('title-art');
    if (!cv || typeof Sprites === 'undefined') return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = window.innerWidth, h = window.innerHeight;
    cv.width = w * dpr; cv.height = h * dpr;
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    const c = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    // gökyüzü ve projektörler
    const sky = c.createLinearGradient(0, 0, 0, H * 0.55);
    sky.addColorStop(0, '#060d1f'); sky.addColorStop(1, '#142a5c');
    c.fillStyle = sky; c.fillRect(0, 0, W, H);
    [[0.12, 0.08], [0.88, 0.08]].forEach(([fx, fy]) => {
      const g = c.createRadialGradient(W * fx, H * fy, 0, W * fx, H * fy, W * 0.6);
      g.addColorStop(0, 'rgba(255,240,200,0.55)'); g.addColorStop(0.25, 'rgba(255,230,170,0.12)'); g.addColorStop(1, 'rgba(255,230,170,0)');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.fillStyle = '#fff8e0';
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) c.fillRect(W * fx - 18 * dpr + i * 10 * dpr, H * fy + j * 8 * dpr, 7 * dpr, 5 * dpr);
    });
    // tribün
    const standTop = H * 0.3, standBot = H * 0.55;
    c.fillStyle = '#0d1a3a'; c.fillRect(0, standTop, W, standBot - standTop);
    const cols = ['#ffcf3f', '#e8e1d0', '#c8102e', '#2a6fdb', '#ffffff'];
    const step = 9 * dpr;
    for (let y = standTop + step; y < standBot - 4; y += step) {
      for (let x = (Math.floor(y / step) % 2) * step / 2; x < W; x += step) {
        if (Math.random() < 0.15) continue;
        c.globalAlpha = 0.35 + 0.5 * ((y - standTop) / (standBot - standTop));
        c.fillStyle = cols[(Math.random() * cols.length) | 0];
        c.beginPath(); c.arc(x, y, step * 0.28, 0, Math.PI * 2); c.fill();
      }
    }
    c.globalAlpha = 1;
    // reklam panosu
    c.fillStyle = '#ffcf3f'; c.fillRect(0, standBot, W, 16 * dpr);
    c.fillStyle = '#0a1530';
    c.font = `800 ${12 * dpr}px "Saira Condensed", "Arial Narrow", sans-serif`;
    c.textBaseline = 'middle';
    const ad = 'STARFOOT   ·   ANADOLU ENERJİ   ·   BOSFOR BANK   ·   ';
    const aw = c.measureText(ad).width;
    for (let x = 0; x < W; x += aw) c.fillText(ad, x, standBot + 8 * dpr);
    c.textBaseline = 'alphabetic';
    // çim
    for (let i = 0; i < 12; i++) {
      const y0 = standBot + 16 * dpr + (i * (H - standBot)) / 12;
      c.fillStyle = i % 2 ? '#2a8241' : '#33924b';
      c.fillRect(0, y0, W, (H - standBot) / 12 + 1);
    }
    const vg = c.createRadialGradient(W / 2, H * 0.8, H * 0.1, W / 2, H * 0.7, H);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
    c.fillStyle = vg; c.fillRect(0, 0, W, H);
    // yazının okunması için soldan karartma
    const lg = c.createLinearGradient(0, 0, W * 0.65, 0);
    lg.addColorStop(0, 'rgba(5,11,29,0.82)'); lg.addColorStop(1, 'rgba(5,11,29,0)');
    c.fillStyle = lg; c.fillRect(0, 0, W, H);
    // oyuncu
    const fh = Math.min(H * 0.32, 260 * dpr);
    const fx = W * (w > 700 ? 0.74 : 0.5), fy = H * 0.94;
    const kit = { shirt: '#c8102e', alt: '#ffcf3f', pattern: 'halves', shorts: '#ffffff', socks: '#c8102e' };
    Sprites.figure(c, fx, fy, fh, { kit, look: Sprites.look(7), facing: 'down', kick: 0.45, t: 0 });
    Sprites.ball(c, fx + fh * 0.32, fy - fh * 0.32, fh * 0.07, 0.6);
  };
  window.addEventListener('load', drawTitle);
  window.addEventListener('resize', () => { if (!document.getElementById('title').classList.contains('hidden')) drawTitle(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawTitle);
})();
