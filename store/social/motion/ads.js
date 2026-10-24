// StarFoot reklam videoları: oyunun kendi çizimleriyle (Sprites, SocialArt) kare kare animasyon.
// window.frame(id, t) verilen videonun t saniyesindeki karesini 1080x1920 canvas'a çizer.
const W = 1080, H = 1920;
const cv = document.getElementById('cv');
const c = cv.getContext('2d');

// ---------- yardımcılar ----------
const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const seg = (t, a, b) => cl((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const E = {
  out: (x) => 1 - Math.pow(1 - x, 3),
  in: (x) => x * x * x,
  io: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  back: (x) => { const k = 1.9; return 1 + (k + 1) * Math.pow(x - 1, 3) + k * Math.pow(x - 1, 2); },
};
const hash = (n) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
const RNG = (s) => SocialArt.rng(s);

const FONT_H = '"Saira Condensed", "Arial Narrow", sans-serif';
const FONT_B = '"Barlow Semi Condensed", "Segoe UI", sans-serif';

function txt(s, x, y, size, o = {}) {
  const { color = '#fff', weight = 900, font = FONT_H, align = 'center', base = 'middle', skew = -0.12, alpha = 1, stroke = 0, strokeColor = 'rgba(0,0,0,.55)', shadow = 18, scale = 1, ls = 0, grad = null, maxW = W - 90 } = o;
  if (alpha <= 0) return;
  c.font = `${weight} ${size}px ${font}`;
  const mw = c.measureText(s).width * 1.06;
  if (mw > maxW) size = Math.floor(size * maxW / mw);
  c.save();
  c.globalAlpha *= alpha;
  c.translate(x, y);
  if (scale !== 1) c.scale(scale, scale);
  if (skew) c.transform(1, 0, skew, 1, 0, 0);
  c.font = `${weight} ${size}px ${font}`;
  c.textAlign = align; c.textBaseline = base;
  if (ls) c.letterSpacing = ls + 'px';
  if (shadow) { c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = shadow; c.shadowOffsetY = 6; }
  if (stroke) { c.lineJoin = 'round'; c.lineWidth = stroke; c.strokeStyle = strokeColor; c.strokeText(s, 0, 0); }
  if (grad) {
    const g = c.createLinearGradient(0, -size * 0.5, 0, size * 0.5);
    grad.forEach(([k, col]) => g.addColorStop(k, col));
    c.fillStyle = g;
  } else c.fillStyle = color;
  c.fillText(s, 0, 0);
  c.restore();
}
const GOLD = [[0, '#fff6cf'], [0.5, '#ffcf3f'], [1, '#e08d0c']];

// İki satırlık kanca yazısı (üst satır beyaz, alt satır altın); pop ile girer
function hook(t, a, b, t0, t1, y = 250, s1 = 92, s2 = 128) {
  if (t < t0 || t > t1 + 0.25) return;
  const k = seg(t, t0, t0 + 0.35), out = 1 - seg(t, t1, t1 + 0.25);
  const sc = 0.6 + 0.4 * E.back(k);
  c.save();
  // arka plan şeridi
  const g = c.createLinearGradient(0, y - 230, 0, y + 260);
  g.addColorStop(0, 'rgba(3,6,18,0)'); g.addColorStop(0.35, 'rgba(3,6,18,.62)'); g.addColorStop(0.7, 'rgba(3,6,18,.62)'); g.addColorStop(1, 'rgba(3,6,18,0)');
  c.globalAlpha = out * k; c.fillStyle = g; c.fillRect(0, y - 230, W, 490);
  c.restore();
  txt(a, W / 2, y - s1 * 0.55, s1, { alpha: k * out, scale: sc });
  txt(b, W / 2, y + s2 * 0.45, s2, { alpha: k * out, scale: sc, grad: GOLD, stroke: 0 });
}

function rr(x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }

// Oyuncu figürü (oyunun çizimi), ışık katmanı ve gölgeyle
const look = Sprites.look(7);
function fig(x, y, h, o = {}, rot = 0, sx = 1) {
  c.save();
  c.translate(x, y - h * 0.5);
  if (rot) c.rotate(rot);
  if (sx !== 1) c.scale(sx, 1);
  c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = h * 0.05; c.shadowOffsetY = h * 0.02;
  Sprites.figure(c, 0, h * 0.5, h, Object.assign({ look, facing: 'down', noShadow: true, t: 0 }, o));
  c.restore();
}
const groundShadow = (x, y, w, a = 0.35) => { c.save(); c.fillStyle = `rgba(0,0,0,${a})`; c.beginPath(); c.ellipse(x, y, w, w * 0.22, 0, 0, Math.PI * 2); c.fill(); c.restore(); };

// Kulüpler (oyundaki kurgusal adlar)
const GAL = { id: 'GAL', c1: '#c8102e', c2: '#fdb913', short: 'GAL', name: 'Galata Aslanları' };
const FNK = { id: 'FNK', c1: '#0a2f73', c2: '#ffd400', short: 'FNK', name: 'Fenerköy SK' };
const RMG = { id: 'RMA', c1: '#ffffff', c2: '#febe10', short: 'RMG', name: 'Real Madrigal' };
const TUR = { id: 'TUR', c1: '#e30a17', c2: '#ffffff', short: 'TÜR' };
const ACA = { id: 'ACA', c1: '#1e5bd8', c2: '#ffffff', short: 'ALT' };
const kitOf = (T, away) => Sprites.kit(T, away);
const suit = { shirt: '#15171d', alt: '#15171d', pattern: 'plain', shorts: '#15171d', socks: '#15171d' };

// Önbellekli arka planlar (yarı çözünürlükte çizilip bulanık büyütülür: alan derinliği)
const BG = {};
function bgStadium(P, day, seed = 3) {
  const key = 'st' + P.c1 + day + seed;
  if (BG[key]) return BG[key];
  const w = 540, h = 960, b = document.createElement('canvas'); b.width = W; b.height = H;
  const s = document.createElement('canvas'); s.width = w; s.height = h;
  SocialArt.stadium(s.getContext('2d'), w, h, RNG(seed), P, day);
  const bc = b.getContext('2d'); bc.filter = 'blur(5px)'; bc.drawImage(s, -20, -20, W + 40, H + 40); bc.filter = 'none';
  return (BG[key] = b);
}
function bgStreet() {
  if (BG.street) return BG.street;
  const w = 540, h = 960, b = document.createElement('canvas'); b.width = W; b.height = H;
  const s = document.createElement('canvas'); s.width = w; s.height = h; const sc = s.getContext('2d');
  // gün batımı gökyüzü, apartmanlar, sokak duvarı ve toprak saha
  const g = sc.createLinearGradient(0, 0, 0, h * 0.55); g.addColorStop(0, '#ff9a5a'); g.addColorStop(0.6, '#ffc98a'); g.addColorStop(1, '#ffe3b5');
  sc.fillStyle = g; sc.fillRect(0, 0, w, h);
  const r = RNG(11);
  for (let x = -10; x < w; x += 60 + r() * 30) {
    const bh = h * (0.18 + r() * 0.2), bw = 56 + r() * 40;
    sc.fillStyle = ['#7a4a3a', '#8c5a44', '#6b3f33', '#9a6a4f'][Math.floor(r() * 4)];
    sc.fillRect(x, h * 0.5 - bh, bw, bh);
    sc.fillStyle = 'rgba(255,224,150,.8)';
    for (let yy = h * 0.5 - bh + 10; yy < h * 0.48; yy += 18) for (let xx = x + 8; xx < x + bw - 10; xx += 16) if (r() < 0.5) sc.fillRect(xx, yy, 7, 9);
  }
  Sprites.sand(sc, w, h);
  sc.fillStyle = 'rgba(255,170,90,.18)'; sc.fillRect(0, 0, w, h);
  Sprites.street(sc, w, h * 0.5, 8);
  const bc = b.getContext('2d'); bc.filter = 'blur(4px)'; bc.drawImage(s, -20, -20, W + 40, H + 40); bc.filter = 'none';
  return (BG.street = b);
}
function bgBackdrop(P, label) {
  const key = 'bd' + P.c1 + label;
  if (BG[key]) return BG[key];
  const s = document.createElement('canvas'); s.width = 540; s.height = 960;
  SocialArt.backdrop(s.getContext('2d'), 540, 960, P, label);
  const b = document.createElement('canvas'); b.width = W; b.height = H; const bc = b.getContext('2d');
  bc.filter = 'blur(3px)'; bc.drawImage(s, -20, -20, W + 40, H + 40); bc.filter = 'none';
  return (BG[key] = b);
}
function drawBg(img, zoom = 1, dx = 0, dy = 0) {
  const w = W * zoom, h = H * zoom;
  c.drawImage(img, (W - w) / 2 + dx, (H - h) / 2 + dy, w, h);
}
function vignette(a = 0.55, col = '0,0,0') {
  const v = c.createRadialGradient(W / 2, H * 0.48, W * 0.35, W / 2, H * 0.5, W * 1.05);
  v.addColorStop(0, `rgba(${col},0)`); v.addColorStop(1, `rgba(${col},${a})`);
  c.fillStyle = v; c.fillRect(0, 0, W, H);
}
function flashes(t, n, y0 = 0.12, y1 = 0.5, rate = 9) {
  for (let i = 0; i < n; i++) {
    const k = Math.floor(t * rate) * 31 + i * 17;
    const x = hash(k), y = hash(k * 1.7 + 3);
    SocialArt.glow(c, x * W, H * (y0 + y * (y1 - y0)), 26 + y * 40, 'rgba(255,255,255,0.95)', 0.8);
  }
}
// Düşen konfeti: zamana bağlı, tekrarlanabilir
function confetti(t, t0, n = 140, cols = ['#ffd84a', '#ffffff', '#c8102e', '#fdb913', '#ffb02e']) {
  if (t < t0) return;
  const dt = t - t0;
  for (let i = 0; i < n; i++) {
    const sx = hash(i + 1) * W, sp = 380 + hash(i + 7) * 520, y = -60 - hash(i + 3) * 900 + dt * sp;
    if (y > H + 40 || y < -60) continue;
    const x = sx + Math.sin(dt * (1.5 + hash(i + 5) * 2) + i) * 50;
    c.save(); c.translate(x, y); c.rotate(dt * (3 + hash(i) * 5) + i);
    c.fillStyle = cols[i % cols.length]; const s = 14 + hash(i + 9) * 16;
    c.scale(1, Math.abs(Math.cos(dt * 6 + i)) * 0.8 + 0.2);
    c.fillRect(-s / 2, -s / 4, s, s / 2); c.restore();
  }
}
function flash(t, at, dur = 0.22, a = 0.85, col = '255,255,255') {
  const k = seg(t, at, at + dur);
  if (k <= 0 || k >= 1) return;
  c.fillStyle = `rgba(${col},${(1 - k) * a})`; c.fillRect(0, 0, W, H);
}
function grain() { SocialArt.grain(c, W, H, 0.05); }

// Kalp simgesi
function heart(x, y, s, col = '#ff3d6e') {
  c.save(); c.fillStyle = col; c.beginPath();
  c.moveTo(x, y + s); c.bezierCurveTo(x - s * 2, y - s * 0.4, x - s * 0.8, y - s * 1.8, x, y - s * 0.7);
  c.bezierCurveTo(x + s * 0.8, y - s * 1.8, x + s * 2, y - s * 0.4, x, y + s); c.fill(); c.restore();
}
// Mavi onay rozeti
function verified(x, y, r, sc = 1) {
  c.save(); c.translate(x, y); c.scale(sc, sc);
  c.fillStyle = '#1d9bf0'; c.beginPath();
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, rr2 = i % 2 ? r * 0.86 : r; c.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); }
  c.closePath(); c.fill();
  c.strokeStyle = '#fff'; c.lineWidth = r * 0.22; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(-r * 0.42, 0); c.lineTo(-r * 0.1, r * 0.32); c.lineTo(r * 0.45, -r * 0.3); c.stroke();
  c.restore();
}
// Altın top (ödül)
function goldBall(x, y, r, rot) {
  SocialArt.glow(c, x, y, r * 3.2, 'rgba(255,214,90,.55)');
  Sprites.ball(c, x, y, r, rot, BALL_STYLES.gold);
}

// Kapanış kartı
const icon = new Image(); icon.src = '../../icon-512.png';
function endCard(t, t0, tag, sub) {
  const k = seg(t, t0, t0 + 0.45);
  if (k <= 0) return;
  c.save(); c.globalAlpha = E.out(k);
  const g = c.createRadialGradient(W / 2, H * 0.32, 60, W / 2, H * 0.4, H * 0.8);
  g.addColorStop(0, '#1d3f95'); g.addColorStop(0.45, '#0d1f4f'); g.addColorStop(1, '#030714');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // ışık hüzmeleri
  [[-140, -0.38], [W + 140, 0.38]].forEach(([x, a]) => {
    c.save(); c.translate(x, -200); c.rotate(a + Math.sin(t * 0.8) * 0.03);
    const bg = c.createLinearGradient(0, 0, 0, 1700); bg.addColorStop(0, 'rgba(255,244,214,.22)'); bg.addColorStop(1, 'rgba(255,244,214,0)');
    c.fillStyle = bg; c.fillRect(-260, 0, 520, 1700); c.restore();
  });
  const dt = t - t0;
  confetti(t, t0 - 0.3, 70, ['#ffd84a', '#ffffff', '#ffb02e', '#7fb2ff']);
  const ip = E.back(seg(t, t0 + 0.1, t0 + 0.6));
  const is = 330 * ip;
  if (icon.complete && is > 1) {
    c.save(); c.shadowColor = 'rgba(255,207,63,.45)'; c.shadowBlur = 80;
    rr(W / 2 - is / 2, 470 - is / 2, is, is, is * 0.22); c.clip();
    c.drawImage(icon, W / 2 - is / 2, 470 - is / 2, is, is); c.restore();
  }
  const lk = seg(t, t0 + 0.35, t0 + 0.7);
  txt('STAR', W / 2 - 150, 790, 160, { alpha: lk, scale: 0.8 + 0.2 * E.back(lk) });
  txt('FOOT', W / 2 + 150, 790, 160, { alpha: lk, color: '#ffcf3f', scale: 0.8 + 0.2 * E.back(lk) });
  const tk = seg(t, t0 + 0.6, t0 + 0.95);
  txt(tag, W / 2, 960, 84, { alpha: tk, scale: 0.85 + 0.15 * E.out(tk) });
  if (sub) txt(sub, W / 2, 1050, 46, { alpha: tk, weight: 600, font: FONT_B, skew: 0, color: '#cdd7f4' });
  // App Store rozeti (nabız gibi)
  const bk = seg(t, t0 + 0.85, t0 + 1.2), pulse = 1 + Math.max(0, Math.sin((dt - 1.2) * 5)) * 0.035 * (dt > 1.2);
  if (bk > 0) {
    c.save(); c.globalAlpha *= bk; c.translate(W / 2, 1200); c.scale(pulse * (0.8 + 0.2 * E.back(bk)), pulse * (0.8 + 0.2 * E.back(bk)));
    c.shadowColor = 'rgba(255,207,63,.45)'; c.shadowBlur = 50;
    c.fillStyle = '#ffcf3f'; rr(-330, -62, 660, 124, 62); c.fill(); c.shadowBlur = 0;
    txt("APP STORE'DA ÜCRETSİZ", 0, 4, 56, { color: '#0a1530', shadow: 0, skew: 0 });
    c.restore();
  }
  c.restore();
}

// ============================================================
// VİDEO 1: Oyunda kendi Instagram'ın (telefon, bildirimler, takipçi patlaması)
// ============================================================
const PH = { x: 540 - 330, y: 470, w: 660, h: 1330, r: 96 };
const NOTES = [
  { app: 'Menajer', col: '#22c55e', g: '€', body: "Real Madrigal'dan resmi teklif!" },
  { app: 'Altın Top', col: '#f5b301', g: '★', body: 'Aday listesine girdin.' },
  { app: 'Milli Takım', col: '#e30a17', g: '☾', body: 'Dünya Kupası kadrosundasın.' },
  { app: 'Sponsor', col: '#111827', g: '$', body: 'Krampon anlaşması: 5 milyon €' },
  { app: 'Instagram', col: 'ig', g: '◎', body: 'Gönderin 1,2 milyon beğeni aldı' },
];
function appIcon(x, y, s, col, g) {
  c.save(); rr(x, y, s, s, s * 0.24);
  if (col === 'ig') {
    const gr = c.createLinearGradient(x, y + s, x + s, y); gr.addColorStop(0, '#feda75'); gr.addColorStop(0.35, '#fa7e1e'); gr.addColorStop(0.6, '#d62976'); gr.addColorStop(1, '#4f5bd5');
    c.fillStyle = gr; c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = s * 0.08; rr(x + s * 0.22, y + s * 0.22, s * 0.56, s * 0.56, s * 0.16); c.stroke();
    c.beginPath(); c.arc(x + s / 2, y + s / 2, s * 0.13, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(x + s * 0.66, y + s * 0.34, s * 0.04, 0, Math.PI * 2); c.fill();
  } else {
    c.fillStyle = col; c.fill();
    txt(g, x + s / 2, y + s / 2 + 2, s * 0.6, { skew: 0, shadow: 0, font: FONT_B, weight: 700, color: col === '#f5b301' ? '#3b2a00' : '#fff' });
  }
  c.restore();
}
// Gönderi küçük resimleri (oyunun sahneleri)
const TILES = [];
function tile(i) {
  if (TILES[i]) return TILES[i];
  const s = 420, b = document.createElement('canvas'); b.width = b.height = s; const bc = b.getContext('2d');
  const sc = (img) => bc.drawImage(img, 0, -H * 0.2 * (s / W), s, H * (s / W));
  const P = [RMG, GAL, TUR, RMG, GAL, RMG, TUR, GAL, RMG][i];
  const kit = P === TUR ? kitOf(TUR) : kitOf(P);
  const f = (x, y, h, o) => Sprites.figure(bc, x, y, h, Object.assign({ kit, look, facing: 'down', noShadow: true, t: 0, number: 10 }, o));
  if (i === 7) { bc.drawImage(bgStreet(), 0, -H * 0.3 * (s / W), s, H * (s / W)); f(s * 0.5, s * 0.95, s * 0.55, { kit: { shirt: '#e63946', alt: '#e63946', pattern: 'plain', shorts: '#1d2433', socks: '#eee' }, number: null }); }
  else if (i === 5) { sc(bgBackdrop(RMG, 'REAL MADRIGAL')); f(s * 0.5, s * 1.05, s * 0.85, { dive: 1 }); }
  else if (i === 8) { bc.fillStyle = '#07070c'; bc.fillRect(0, 0, s, s); const gg = bc.createRadialGradient(s / 2, s * 0.2, 10, s / 2, s * 0.5, s * 0.7); gg.addColorStop(0, 'rgba(255,220,140,.5)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); bc.fillStyle = gg; bc.fillRect(0, 0, s, s); Sprites.figure(bc, s * 0.42, s * 1.02, s * 0.85, { kit: suit, look, facing: 'down', noShadow: true, t: 0 }); const cc = c; window.__c = bc; Sprites.ball(bc, s * 0.72, s * 0.5, s * 0.1, 0.4, BALL_STYLES.gold); }
  else { sc(bgStadium(P, i === 4, 5 + i)); f(s * 0.5, s * 1.02, s * 0.8, { dive: [0, 2, 3, 6].includes(i) ? 1 : 0, armA: i === 1 ? 0 : 0 }); if (i === 2 || i === 0) SocialArt.trophyCup(bc, s * 0.5, s * 0.2, s * 0.11); if (i === 2) SocialArt.confetti(bc, s, s, RNG(9), P); }
  SocialArt.grain(bc, s, s, 0.06);
  return (TILES[i] = b);
}
function fmtF(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace('.', ',') + ' Mn';
  if (n >= 1e4) return Math.round(n / 1e3) + ' B';
  return Math.round(n).toLocaleString('tr-TR');
}
function phoneFrame(fn, sc = 1, ox = 0, oy = 0, rot = 0) {
  const { x, y, w, h, r } = PH;
  c.save();
  c.translate(x + w / 2 + ox, y + h / 2 + oy); c.rotate(rot); c.scale(sc, sc); c.translate(-(x + w / 2), -(y + h / 2));
  c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 90; c.shadowOffsetY = 40;
  c.fillStyle = '#0b0b0e'; rr(x - 22, y - 22, w + 44, h + 44, r + 20); c.fill();
  c.shadowBlur = 0; c.shadowOffsetY = 0;
  c.strokeStyle = '#3a3d46'; c.lineWidth = 4; rr(x - 22, y - 22, w + 44, h + 44, r + 20); c.stroke();
  c.save(); rr(x, y, w, h, r); c.clip();
  fn(x, y, w, h);
  c.restore();
  // dinamik ada
  c.fillStyle = '#000'; rr(x + w / 2 - 110, y + 26, 220, 62, 31); c.fill();
  c.restore();
}
function lockScreen(t, x, y, w, h) {
  const g = c.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, '#1a2b6b'); g.addColorStop(0.55, '#0b1335'); g.addColorStop(1, '#2a0f3d');
  c.fillStyle = g; c.fillRect(x, y, w, h);
  SocialArt.glow(c, x + w * 0.8, y + h * 0.25, 420, 'rgba(255,120,180,.35)');
  SocialArt.glow(c, x + w * 0.1, y + h * 0.7, 460, 'rgba(80,160,255,.35)');
  txt('Cumartesi 24 Ekim', x + w / 2, y + 170, 38, { font: FONT_B, weight: 600, skew: 0, shadow: 0, color: 'rgba(255,255,255,.85)' });
  txt('21:47', x + w / 2, y + 290, 190, { font: FONT_B, weight: 700, skew: 0, shadow: 0 });
  const times = [0.45, 0.85, 1.25, 1.65, 2.05];
  const n = times.filter((a) => t >= a).length;
  const nh = 150, gap = 18;
  for (let i = 0; i < n; i++) {
    const age = t - times[i];
    const pos = n - 1 - i; // en yenisi en üstte
    const ky = E.back(cl(age / 0.35));
    const ny = y + 430 + pos * (nh + gap) - (1 - ky) * 160;
    const N = NOTES[i];
    c.save(); c.globalAlpha = cl(age / 0.2);
    c.fillStyle = 'rgba(255,255,255,.17)'; rr(x + 26, ny, w - 52, nh, 40); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 2; c.stroke();
    appIcon(x + 50, ny + 33, 84, N.col, N.g);
    txt(N.app, x + 160, ny + 56, 36, { align: 'left', font: FONT_B, weight: 700, skew: 0, shadow: 0 });
    txt('şimdi', x + w - 56, ny + 56, 30, { align: 'right', font: FONT_B, weight: 500, skew: 0, shadow: 0, color: 'rgba(255,255,255,.6)' });
    txt(N.body, x + 160, ny + 104, 33, { align: 'left', font: FONT_B, weight: 500, skew: 0, shadow: 0, color: 'rgba(255,255,255,.92)' });
    c.restore();
  }
}
function profileScreen(t, x, y, w, h, t0) {
  const dt = t - t0;
  c.fillStyle = '#000'; c.fillRect(x, y, w, h);
  // üst çubuk
  txt('emre.yildiz10', x + 40, y + 150, 44, { align: 'left', font: FONT_B, weight: 700, skew: 0, shadow: 0 });
  const vk = E.back(seg(dt, 1.7, 2.1));
  if (vk > 0) verified(x + 340, y + 150, 22, vk);
  // profil fotoğrafı (halka + oyuncu)
  const ax = x + 120, ay = y + 300, ar = 86;
  const rg = c.createLinearGradient(ax - ar, ay + ar, ax + ar, ay - ar); rg.addColorStop(0, '#feda75'); rg.addColorStop(0.5, '#d62976'); rg.addColorStop(1, '#4f5bd5');
  c.strokeStyle = rg; c.lineWidth = 9; c.beginPath(); c.arc(ax, ay, ar + 10, 0, Math.PI * 2); c.stroke();
  c.save(); c.beginPath(); c.arc(ax, ay, ar, 0, Math.PI * 2); c.clip();
  c.fillStyle = '#1b2440'; c.fillRect(ax - ar, ay - ar, ar * 2, ar * 2);
  Sprites.figure(c, ax, ay + ar * 2.9, ar * 4.2, { kit: kitOf(RMG), look, facing: 'down', noShadow: true, t: 0 });
  c.restore();
  // sayılar
  const fk = E.io(seg(dt, 0.35, 2.6));
  const fol = 1204 * Math.pow(10400000 / 1204, fk);
  const cols = [[x + 330, '248', 'gönderi'], [x + 470, fmtF(fol), 'takipçi'], [x + 590, '61', 'takip']];
  cols.forEach(([cx, v, l], i) => {
    const pop = i === 1 ? 1 + Math.sin(dt * 18) * 0.03 * (fk < 1 && fk > 0) : 1;
    txt(v, cx, ay - 16, 44, { font: FONT_B, weight: 700, skew: 0, shadow: 0, scale: pop, color: i === 1 && fk > 0 && fk < 1 ? '#ffe28a' : '#fff' });
    txt(l, cx, ay + 32, 28, { font: FONT_B, weight: 500, skew: 0, shadow: 0, color: 'rgba(255,255,255,.75)' });
  });
  txt('Emre Yıldız', x + 40, y + 440, 36, { align: 'left', font: FONT_B, weight: 700, skew: 0, shadow: 0 });
  txt('Forvet · Real Madrigal · #10', x + 40, y + 486, 30, { align: 'left', font: FONT_B, weight: 500, skew: 0, shadow: 0, color: 'rgba(255,255,255,.8)' });
  c.fillStyle = '#26272c'; rr(x + 36, y + 530, (w - 88) / 2, 66, 16); c.fill(); rr(x + 52 + (w - 88) / 2, y + 530, (w - 88) / 2, 66, 16); c.fill();
  txt('Takip et', x + 36 + (w - 88) / 4, y + 564, 30, { font: FONT_B, weight: 700, skew: 0, shadow: 0 });
  txt('Mesaj', x + 52 + (w - 88) * 0.75, y + 564, 30, { font: FONT_B, weight: 700, skew: 0, shadow: 0 });
  // ızgara
  const gy = y + 630, ts = (w - 8) / 3;
  for (let i = 0; i < 9; i++) {
    const k = E.back(seg(dt, 0.4 + i * 0.12, 0.75 + i * 0.12));
    if (k <= 0) continue;
    const tx = x + (i % 3) * (ts + 4), ty = gy + Math.floor(i / 3) * (ts + 4);
    c.save(); c.translate(tx + ts / 2, ty + ts / 2); c.scale(k, k);
    c.drawImage(tile(i), -ts / 2, -ts / 2, ts, ts); c.restore();
  }
  return { gy, ts };
}
function hearts(t, t0, x, y, n = 14) {
  for (let i = 0; i < n; i++) {
    const st = t0 + i * 0.22;
    const a = t - st; if (a < 0 || a > 1.6) continue;
    const hx = x + Math.sin(a * 4 + i) * 40 - a * 30 * hash(i), hy = y - a * 520;
    c.save(); c.globalAlpha = 1 - a / 1.6; heart(hx, hy, 22 + hash(i + 2) * 14, ['#ff3d6e', '#ff5c8a', '#ffd166', '#ffffff'][i % 4]); c.restore();
  }
}
function trophyScene(t, t0, rect) {
  const dt = t - t0;
  const P = RMG;
  const { x, y, w, h } = rect;
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  c.translate(x, y); c.scale(w / W, h / H);
  drawBg(bgStadium(P, false, 4), 1.06 + dt * 0.02);
  flashes(t, 6);
  const fx = W / 2, fy = H * 1.0, fh = 1000;
  groundShadow(fx, fy, 260);
  const lift = E.out(seg(dt, 0.1, 0.6));
  fig(fx, fy - lift * 30, fh, { kit: kitOf(P), number: 10, dive: 1 });
  SocialArt.trophyCup(c, fx, fy - fh * 1.22 - lift * 70, 150);
  confetti(t, t0, 150, ['#ffd84a', '#ffffff', '#febe10', '#ffb02e']);
  vignette(0.5);
  c.restore();
}

function v1(t) {
  // 0-3.3: kilit ekranı ve bildirim yağmuru | 3.3-7.3: profil, takipçi patlaması | 7.3-10: kupa gönderisi tam ekran | 10-13: kapanış
  drawBg(bgStadium(RMG, false, 2), 1.15 + t * 0.01);
  c.fillStyle = 'rgba(2,4,14,.55)'; c.fillRect(0, 0, W, H);
  const times = [0.45, 0.85, 1.25, 1.65, 2.05];
  let shake = 0;
  times.forEach((a) => { const k = seg(t, a, a + 0.18); if (k > 0 && k < 1) shake = Math.sin(k * Math.PI * 6) * (1 - k) * 14; });
  const intro = E.back(seg(t, 0, 0.4));
  if (t < 7.3) {
    const zoom = t < 3.3 ? 0.9 + 0.1 * intro : 1 + 0.06 * E.io(seg(t, 3.3, 4.2));
    const oy = t < 3.3 ? (1 - intro) * 400 : -20 * E.io(seg(t, 3.3, 4.2));
    phoneFrame((x, y, w, h) => {
      if (t < 3.35) lockScreen(t, x, y, w, h);
      else profileScreen(t, x, y, w, h, 3.35);
      // dokunma halkası (Instagram bildirimi)
      const tk = seg(t, 2.85, 3.3);
      if (tk > 0 && tk < 1) { c.save(); c.globalAlpha = 1 - tk; c.strokeStyle = '#fff'; c.lineWidth = 8; c.beginPath(); c.arc(x + w * 0.55, y + 505, 40 + tk * 90, 0, Math.PI * 2); c.stroke(); c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(x + w * 0.55, y + 505, 44, 0, Math.PI * 2); c.fill(); c.restore(); }
      const wk = seg(t, 3.2, 3.5); if (wk > 0 && wk < 1) { c.fillStyle = `rgba(255,255,255,${Math.sin(wk * Math.PI) * 0.9})`; c.fillRect(x, y, w, h); }
    }, zoom, shake, oy, shake * 0.002);
    if (t > 4.6) hearts(t, 4.6, PH.x + PH.w - 40, PH.y + PH.h - 80, 12);
  }
  // kupa gönderisi ızgaradan büyüyerek tam ekran olur
  if (t >= 7.0) {
    const k = E.io(seg(t, 7.0, 7.55));
    const ts = (PH.w - 8) / 3, sx = PH.x + 2 * (ts + 4), sy = PH.y + 630; // 3. kare (kupa)
    const sc = 1.06, cx = PH.x + PH.w / 2, cy = PH.y + PH.h / 2 - 20;
    const tx = cx + (sx - cx) * sc, ty = cy + (sy - cy) * sc;
    const rect = { x: lerp(tx, 0, k), y: lerp(ty, 0, k), w: lerp(ts * sc, W, k), h: lerp(ts * sc, H, k) };
    trophyScene(t, 7.0, rect);
    if (t > 7.6) {
      // çift dokunma kalbi
      const hk = seg(t, 8.0, 8.7);
      if (hk > 0 && hk < 1) { c.save(); c.globalAlpha = hk < 0.7 ? 1 : (1 - hk) / 0.3; const s = 90 * E.back(cl(hk * 2.5)); c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 30; heart(W / 2, H * 0.66, s, '#ffffff'); c.restore(); }
      // beğeni sayacı
      const lk = E.out(seg(t, 8.0, 9.8));
      c.save(); c.globalAlpha = seg(t, 7.6, 7.9);
      heart(110, 1440, 26, '#ff3d6e');
      txt(fmtF(18000 + lk * 2400000) + ' beğeni', 160, 1440, 50, { align: 'left', font: FONT_B, weight: 700, skew: 0 });
      c.restore();
      hearts(t, 8.1, W - 120, 1500, 9);
    }
  }
  hook(t, 'YILDIZ OLUNCA', 'TELEFONUN SUSMAZ', 0.12, 3.15, 245);
  hook(t, 'OYUNDA KENDİ', "INSTAGRAM'IN VAR", 3.45, 6.95, 245);
  hook(t, 'KUPAYI KALDIR', 'DÜNYA BEĞENSİN', 7.75, 9.85, 245);
  endCard(t, 10.0, 'FUTBOLCU HAYATINI YAŞA', 'Ücretsiz indir, kariyerine başla');
  grain();
}

// ============================================================
// VİDEO 2: 8 yaşından Altın Top'a (yaş sayacı + hızlı sahneler)
// ============================================================
const STAGES = [
  { a: 0.0, age: 8, w: 'MAHALLE' },
  { a: 2.1, age: 12, w: 'ALTYAPI' },
  { a: 3.8, age: 17, w: 'İLK MAÇ' },
  { a: 5.5, age: 21, w: 'DEV TRANSFER' },
  { a: 7.2, age: 24, w: 'KAPTAN' },
  { a: 8.9, age: 27, w: 'ALTIN TOP' },
];
const V2END = 10.9;
function stageScene(i, t, lt) {
  const push = 1.04 + lt * 0.035;
  if (i === 0) {
    drawBg(bgStreet(), push);
    const x = 600, y = 1720, h = 700;
    // top sektirme
    const ph = (lt * 2.6) % 1, up = Math.sin(ph * Math.PI);
    groundShadow(x, y, 160);
    fig(x, y, h, { kit: { shirt: '#e63946', alt: '#e63946', pattern: 'plain', shorts: '#1d2433', socks: '#eeeeee' }, kick: ph < 0.25 ? ph * 4 * 0.5 : 0 });
    Sprites.ball(c, x + 150, y - 60 - up * 420, 46, lt * 8, BALL_STYLES.street);
    // izleyen çocuklar
    fig(170, 1560, 440, { kit: { shirt: '#457b9d', alt: '#457b9d', pattern: 'plain', shorts: '#1d2433', socks: '#eee' }, look: Sprites.look(22) });
    fig(950, 1540, 420, { kit: { shirt: '#ffd166', alt: '#ffd166', pattern: 'plain', shorts: '#3a4a6b', socks: '#eee' }, look: Sprites.look(31) });
  } else if (i === 1) {
    drawBg(bgStadium(ACA, true, 8), push);
    // dubalar
    for (let k = 0; k < 4; k++) { const cx = 160 + k * 260, cy = 1700 - (k % 2) * 30; c.fillStyle = '#ff7a1a'; c.beginPath(); c.moveTo(cx - 34, cy); c.lineTo(cx, cy - 80); c.lineTo(cx + 34, cy); c.fill(); c.fillStyle = '#fff'; c.fillRect(cx - 20, cy - 44, 40, 10); }
    const x = 150 + lt * 520, y = 1760;
    groundShadow(x, y, 190);
    fig(x, y, 860, { kit: kitOf(ACA), number: 7, run: lt * 13, speed: 1 });
    Sprites.ball(c, x + 120, y - 30, 40, lt * 14, BALL_STYLES.classic);
  } else if (i === 2) {
    drawBg(bgStadium(GAL, false, 6), push);
    flashes(t, 7);
    const k = E.out(cl(lt / 1.4));
    const h = 760 + k * 220, x = 600, y = 1780 + k * 80;
    groundShadow(x, y, h * 0.25);
    fig(x, y, h, { kit: kitOf(GAL), number: 17, run: lt * 12, speed: k < 1 ? 1 : 0.4 });
  } else if (i === 3) {
    drawBg(bgBackdrop(RMG, 'REAL MADRIGAL'), push);
    flashes(t, 10, 0.1, 0.75, 12);
    const x = 600, y = 1990, h = 1100;
    fig(x, y, h, { kit: kitOf(RMG), number: 10, dive: E.out(cl(lt / 0.4)) });
    const pk = E.back(seg(lt, 0.25, 0.65));
    txt('€120M', 840, 560, 130, { grad: GOLD, scale: pk, alpha: pk, skew: -0.14, maxW: 420 });
  } else if (i === 4) {
    drawBg(bgStadium(GAL, false, 9), push);
    flashes(t, 8);
    const x = 700, y = 1930, h = 1000, lift = E.out(cl(lt / 0.5));
    fig(x, y - lift * 20, h, { kit: kitOf(GAL), number: 10, dive: 1 });
    // kaptanlık bandı
    SocialArt.trophyCup(c, x, y - h * 1.22 - lift * 70, 160);
    confetti(t, STAGES[4].a, 160, ['#ffd84a', '#ffffff', '#c8102e', '#fdb913']);
  } else {
    // Altın Top töreni: karanlık sahne, spot ışığı
    c.fillStyle = '#050509'; c.fillRect(0, 0, W, H);
    const sg = c.createLinearGradient(0, 0, 0, H); sg.addColorStop(0, 'rgba(255,226,150,.0)'); sg.addColorStop(1, 'rgba(255,226,150,.0)');
    c.save(); c.globalCompositeOperation = 'lighter';
    const cone = c.createRadialGradient(W / 2, -200, 50, W / 2, H * 0.6, 1100); cone.addColorStop(0, 'rgba(255,230,160,.55)'); cone.addColorStop(1, 'rgba(255,230,160,0)');
    c.fillStyle = cone; c.beginPath(); c.moveTo(W / 2 - 120, -50); c.lineTo(W / 2 + 120, -50); c.lineTo(W + 200, H); c.lineTo(-200, H); c.fill();
    c.restore();
    SocialArt.bokeh(c, W, H, RNG(4), ['rgba(255,214,120,.6)', 'rgba(255,255,255,.5)'], 40, 0.05, 0.6);
    const x = 690, y = 1950, h = 1050, lift = E.out(cl(lt / 0.5));
    groundShadow(x, y - 20, 300, 0.5);
    fig(x, y - lift * 20, h, { kit: suit, dive: 1 });
    const bk = E.back(seg(lt, 0.05, 0.5));
    goldBall(x, y - h * 1.2 - lift * 60, 115 * bk, lt * 1.4);
    flashes(t, 4, 0.2, 0.7, 7);
  }
}
function v2(t) {
  let i = STAGES.length - 1;
  while (i > 0 && t < STAGES[i].a) i--;
  const S = STAGES[i], lt = t - S.a;
  // geçiş: yeni sahne sağdan kayarak gelir
  const tk = E.out(cl(lt / 0.28));
  c.save();
  if (i > 0 && tk < 1) {
    c.save(); c.translate(-W * 0.35 * tk, 0); stageScene(i - 1, t, t - STAGES[i - 1].a); c.restore();
    c.translate(W * (1 - tk) * 0.9, 0);
  }
  stageScene(i, t, lt);
  c.restore();
  if (i > 0) flash(t, S.a, 0.25, 0.55);
  vignette(0.5);
  // yaş sayacı (sol üst): sayı yukarı kayarak değişir
  if (t < V2END) {
    const ak = E.back(cl(lt / 0.35));
    const prev = i > 0 ? STAGES[i - 1].age : null;
    c.save();
    c.beginPath(); c.rect(0, 380, W, 340); c.clip();
    if (prev != null && ak < 1) txt(String(prev), 90, 560 - ak * 300, 300, { align: 'left', grad: GOLD, alpha: 1 - ak });
    txt(String(S.age), 90, 560 + (1 - ak) * 300, 300, { align: 'left', grad: GOLD });
    c.restore();
    txt('YAŞ', 90 + (S.age >= 10 ? 330 : 175), 610, 70, { align: 'left', alpha: 0.95 });
    const wk = E.out(cl((lt - 0.1) / 0.3));
    txt(S.w, 92, 760, 88, { align: 'left', alpha: wk, scale: 1, color: '#fff' });
    c.fillStyle = '#ffcf3f'; c.save(); c.transform(1, 0, -0.3, 1, 0, 0); c.fillRect(92 + 230, 820, 160 * wk, 12); c.restore();
  }
  hook(t, '8 YAŞINDAN', "ALTIN TOP'A", 0.1, 1.95, 220, 88, 136);
  endCard(t, V2END, 'KARİYERİNİ SEN YAZ', 'Mahalle maçından Altın Top\'a');
  grain();
}

// ============================================================
// VİDEO 3: 90+4' penaltı (arkadan kamera, nişan, gol, sevinç)
// ============================================================
const GOAL = { l: 200, r: 880, top: 720, base: 1080 };
function penaltyView(t, aim, ballK, keeperK, netHit) {
  drawBg(bgStadium(GAL, false, 12), 1.25, 0, -260);
  // çim
  const py = GOAL.base - 40;
  for (let i = 0; i < 10; i++) {
    const y0 = py + (H - py) * Math.pow(i / 10, 1.5), y1 = py + (H - py) * Math.pow((i + 1) / 10, 1.5);
    c.fillStyle = i % 2 ? '#1f7a37' : '#1a6a30'; c.fillRect(0, y0, W, y1 - y0 + 1);
  }
  const lg = c.createLinearGradient(0, py, 0, H); lg.addColorStop(0, 'rgba(255,250,220,.12)'); lg.addColorStop(1, 'rgba(0,0,0,.25)'); c.fillStyle = lg; c.fillRect(0, py, W, H - py);
  // ceza sahası çizgileri
  c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 8;
  c.beginPath(); c.moveTo(-200, GOAL.base); c.lineTo(W + 200, GOAL.base); c.stroke();
  c.beginPath(); c.moveTo(130, GOAL.base); c.lineTo(40, GOAL.base + 200); c.lineTo(W - 40, GOAL.base + 200); c.lineTo(W - 130, GOAL.base); c.stroke();
  c.fillStyle = '#fff'; c.beginPath(); c.ellipse(540, 1610, 30, 11, 0, 0, Math.PI * 2); c.fill();
  // file
  const bx = netHit ? netHit.x : 0, by2 = netHit ? netHit.y : 0, bulge = netHit ? netHit.k : 0;
  c.save(); c.strokeStyle = 'rgba(235,240,250,.45)'; c.lineWidth = 2.5;
  const nx = (x, y) => { if (!bulge) return [x, y]; const d = Math.hypot(x - bx, y - by2), f = Math.max(0, 1 - d / 220) * bulge; return [x + (x - bx) * f * 0.25, y + (y - by2) * f * 0.25 - f * 10]; };
  for (let x = GOAL.l; x <= GOAL.r; x += 26) { c.beginPath(); for (let y = GOAL.top; y <= GOAL.base; y += 20) { const [a, b] = nx(x, y); y === GOAL.top ? c.moveTo(a, b) : c.lineTo(a, b); } c.stroke(); }
  for (let y = GOAL.top; y <= GOAL.base; y += 26) { c.beginPath(); for (let x = GOAL.l; x <= GOAL.r; x += 20) { const [a, b] = nx(x, y); x === GOAL.l ? c.moveTo(a, b) : c.lineTo(a, b); } c.stroke(); }
  c.restore();
  // kaleci
  const gx = 540 + Math.sin(t * 3.1) * 40 * (1 - keeperK), gh = 330;
  const dive = keeperK;
  fig(gx + dive * 230, GOAL.base - dive * 120, gh, { kit: GK_KITS[1], gloves: true, look: Sprites.look(19), dive: dive > 0 ? 1 : 0, armA: dive ? 0 : 0.5 }, dive * 1.25);
  // direkler
  c.fillStyle = '#f7f7f7'; c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 12;
  c.fillRect(GOAL.l - 9, GOAL.top - 9, 18, GOAL.base - GOAL.top + 9); c.fillRect(GOAL.r - 9, GOAL.top - 9, 18, GOAL.base - GOAL.top + 9); c.fillRect(GOAL.l - 9, GOAL.top - 9, GOAL.r - GOAL.l + 18, 18);
  c.shadowBlur = 0;
  // nişan
  if (aim) {
    c.save(); c.globalAlpha = aim.a; c.strokeStyle = '#ffcf3f'; c.lineWidth = 8;
    c.setLineDash([22, 18]); c.lineDashOffset = -t * 120;
    c.beginPath(); c.moveTo(540, 1580); c.quadraticCurveTo((540 + aim.x) / 2 - 120, (1580 + aim.y) / 2 - 160, aim.x, aim.y); c.stroke(); c.setLineDash([]);
    c.beginPath(); c.arc(aim.x, aim.y, 46 + Math.sin(t * 10) * 5, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.moveTo(aim.x - 70, aim.y); c.lineTo(aim.x - 28, aim.y); c.moveTo(aim.x + 28, aim.y); c.lineTo(aim.x + 70, aim.y); c.moveTo(aim.x, aim.y - 70); c.lineTo(aim.x, aim.y - 28); c.moveTo(aim.x, aim.y + 28); c.lineTo(aim.x, aim.y + 70); c.stroke();
    c.restore();
  }
}
function scoreBar(t, a, b, hot) {
  const y = 150;
  c.save();
  c.fillStyle = 'rgba(5,9,24,.88)'; rr(150, y - 62, 780, 124, 26); c.fill();
  c.fillStyle = GAL.c1; rr(150, y - 62, 18, 124, 9); c.fill(); c.fillStyle = FNK.c1; rr(912, y - 62, 18, 124, 9); c.fill();
  txt('GAL', 290, y + 4, 70, { shadow: 0 });
  txt('FNK', 790, y + 4, 70, { shadow: 0 });
  c.fillStyle = '#ffcf3f'; rr(420, y - 50, 240, 100, 18); c.fill();
  txt(`${a} - ${b}`, 540, y + 6, 86, { color: '#0a1530', shadow: 0, scale: hot ? 1 + Math.max(0, 0.4 - hot) : 1 });
  const p = 0.7 + Math.abs(Math.sin(t * 4)) * 0.3;
  c.globalAlpha = p; c.fillStyle = '#e11d2e'; rr(470, y + 72, 140, 64, 14); c.fill(); c.globalAlpha = 1;
  txt("90+4'", 540, y + 106, 50, { shadow: 0, skew: 0 });
  c.restore();
}
function v3(t) {
  // 0-2.6 kanca, 2.6-4.9 nişan, 4.9-6.2 şut, 6.2 gol, 6.6-9.4 sevinç, 9.6 kapanış
  const target = { x: 330, y: 820 };
  let aim = null, ballK = 0, keeperK = 0, net = null;
  if (t >= 2.5 && t < 5.0) {
    const k = seg(t, 2.6, 4.4);
    const ax = t < 4.4 ? 540 + Math.sin(k * Math.PI * 2.5) * 230 : target.x;
    const ay = t < 4.4 ? 860 + Math.cos(k * Math.PI * 3) * 50 : target.y;
    const lockK = E.out(seg(t, 4.3, 4.6));
    aim = { x: lerp(ax, target.x, lockK), y: lerp(ay, target.y, lockK), a: seg(t, 2.5, 2.8) * (1 - seg(t, 4.85, 5.0)) };
  }
  // şut: ağır çekim (zaman eğrisi)
  const st = seg(t, 5.15, 6.2);
  ballK = st < 0.5 ? st * 1.3 : 0.65 + (st - 0.5) * 0.7;
  if (t >= 5.3) keeperK = E.out(seg(t, 5.3, 5.9));
  if (t >= 6.2) net = { x: target.x, y: target.y, k: Math.max(0, 1 - (t - 6.2) * 1.6) };
  const shakeK = t > 6.2 && t < 6.7 ? (1 - seg(t, 6.2, 6.7)) : 0;
  const hb = t < 2.6 ? Math.pow(Math.max(0, Math.sin(t * Math.PI * 1.6)), 8) : 0; // kalp atışı
  c.save();
  c.translate(Math.sin(t * 70) * 22 * shakeK, Math.cos(t * 60) * 16 * shakeK);
  if (t < 6.7) {
    const zoom = 1 + hb * 0.02 + E.io(seg(t, 5.0, 6.2)) * 0.12;
    c.translate(W / 2, H * 0.55); c.scale(zoom, zoom); c.translate(-W / 2, -H * 0.55);
    penaltyView(t, aim, ballK, keeperK, net);
    // atıcı (arkadan)
    const run = seg(t, 4.85, 5.2);
    const px = 760 - run * 150, py = 1980 - run * 220, ph = 820 - run * 90;
    fig(px, py, ph, { kit: kitOf(GAL), number: 10, facing: 'up', run: run * 14, speed: run > 0 && run < 1 ? 1 : 0, kick: t > 5.1 && t < 5.45 ? seg(t, 5.1, 5.45) : 0 });
    // top
    if (t < 6.2) {
      const p = t < 5.15 ? 0 : cl(ballK);
      const bx = (1 - p) * (1 - p) * 540 + 2 * (1 - p) * p * 300 + p * p * target.x;
      const by = (1 - p) * (1 - p) * 1580 + 2 * (1 - p) * p * 900 + p * p * target.y;
      const br = lerp(50, 16, E.out(p));
      if (p > 0) for (let k = 1; k <= 4; k++) { c.globalAlpha = 0.12 * (5 - k); const q = Math.max(0, p - k * 0.03); Sprites.ball(c, (1 - q) * (1 - q) * 540 + 2 * (1 - q) * q * 300 + q * q * target.x, (1 - q) * (1 - q) * 1580 + 2 * (1 - q) * q * 900 + q * q * target.y, lerp(44, 16, E.out(q)), t * 20, BALL_STYLES.tr); }
      c.globalAlpha = 1;
      Sprites.ball(c, bx, by, br, t * 20, BALL_STYLES.tr);
    }
    vignette(0.55 + hb * 0.35, hb > 0.05 ? '120,0,0' : '0,0,0');
  } else {
    // sevinç: karşıdan, stadyum patlıyor
    const dt = t - 6.7;
    drawBg(bgStadium(GAL, false, 13), 1.08 + dt * 0.02);
    flashes(t, 10, 0.1, 0.55, 12);
    const x = W * (0.3 + 0.2 * E.out(seg(dt, 0, 0.8))), y = 1860, h = 1150;
    const slide = seg(dt, 0.6, 1.3);
    groundShadow(x + slide * 90, y + 20, 280);
    fig(x + E.out(slide) * 90, y + slide * 50, h, { kit: kitOf(GAL), number: 10, run: dt * 12, speed: dt < 0.6 ? 1 : 0, dive: dt >= 0.6 ? 1 : 0 }, -0.28 * E.out(cl(slide * 2)));
    if (dt > 1.1) [Sprites.look(3), Sprites.look(11)].forEach((L, i) => {
      const s = E.out(seg(dt, 1.1, 1.8)), from = i ? W * 1.25 : -W * 0.25, to = x + (i ? 1 : -1) * 330;
      fig(from + (to - from) * s, y + 30, h * 0.9, { kit: kitOf(GAL), look: L, number: [7, 9][i], run: dt * 12, speed: s < 1 ? 1 : 0, dive: s >= 1 ? 1 : 0 });
    });
    confetti(t, 6.7, 160, ['#ffd84a', '#ffffff', '#c8102e', '#fdb913']);
    vignette(0.45);
    const gk = seg(t, 6.75, 7.1);
    txt('GOOOL!', W / 2, 560, 230, { grad: GOLD, scale: 0.6 + 0.4 * E.back(gk) + Math.sin(t * 9) * 0.015, alpha: gk, stroke: 10, strokeColor: 'rgba(0,0,0,.35)' });
  }
  c.restore();
  flash(t, 6.2, 0.35, 0.95);
  scoreBar(t, t >= 6.35 ? 1 : 0, 0, t >= 6.35 ? t - 6.35 : 0);
  // kanca ve nişan yazısı
  hook(t, 'DERBİ. SON DAKİKA.', 'PENALTI SENDE', 0.08, 2.45, 470, 80, 132);
  if (t > 2.55 && t < 5.0) txt('NEREYE?', W / 2, 470, 150, { grad: GOLD, alpha: seg(t, 2.55, 2.8) * (1 - seg(t, 4.75, 4.95)), scale: 0.8 + 0.2 * E.back(seg(t, 2.55, 2.9)) });
  // dokunma işareti
  const tp = seg(t, 4.3, 4.7);
  if (tp > 0 && tp < 1) { c.save(); c.globalAlpha = 1 - tp; c.strokeStyle = '#fff'; c.lineWidth = 8; c.beginPath(); c.arc(target.x, target.y, 30 + tp * 90, 0, Math.PI * 2); c.stroke(); c.restore(); }
  endCard(t, 9.5, 'KRİTİK ANI SEN OYNA', 'Şut, pas, frikik, penaltı: hepsi senin elinde');
  grain();
}

const VIDEOS = { ig: { dur: 13.2, f: v1 }, yas: { dur: 13.9, f: v2 }, penalti: { dur: 12.6, f: v3 } };
window.VIDEOS = VIDEOS;
window.frame = (id, t) => { c.save(); c.clearRect(0, 0, W, H); c.fillStyle = '#000'; c.fillRect(0, 0, W, H); VIDEOS[id].f(t); c.restore(); };
window.ready = () => Promise.all(['600','800','900'].map((w) => document.fonts.load(`${w} 100px "Saira Condensed"`, 'ŞİÇĞÜÖÂ')).concat(['500','600','700'].map((w) => document.fonts.load(`${w} 40px "Barlow Semi Condensed"`, 'ŞİÇĞÜÖ')))).then(() => document.fonts.ready).then(() => new Promise((r) => (icon.complete ? r() : (icon.onload = r))));

// ---------- gerçek görüntülü video için katmanlar (şeffaf PNG) ----------
// Kanca yazısı: tam görünür halde (giriş/çıkışı ffmpeg yapar)
window.textLayer = (a, b, y = 300, s1 = 92, s2 = 132) => {
  c.clearRect(0, 0, W, H);
  const g = c.createLinearGradient(0, y - 260, 0, y + 280);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.4, 'rgba(0,0,0,.45)'); g.addColorStop(0.65, 'rgba(0,0,0,.45)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(0, y - 260, W, 540);
  if (a) txt(a, W / 2, b ? y - s1 * 0.55 : y, b ? s1 : s2, b ? {} : { grad: GOLD });
  if (b) txt(b, W / 2, y + s2 * 0.45, s2, { grad: GOLD });
  return cv.toDataURL('image/png');
};
// Telefon çerçevesi: ekran bölgesi şeffaf
window.phoneLayer = () => {
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.shadowBlur = 0;
  c.clearRect(0, 0, W, H);
  const { x, y, w, h, r } = PH;
  c.save(); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 90; c.shadowOffsetY = 40;
  c.fillStyle = '#0b0b0e'; rr(x - 22, y - 22, w + 44, h + 44, r + 20); c.fill(); c.restore();
  c.strokeStyle = '#3a3d46'; c.lineWidth = 4; rr(x - 22, y - 22, w + 44, h + 44, r + 20); c.stroke();
  c.save(); rr(x, y, w, h, r); c.clip(); c.clearRect(x - 2, y - 2, w + 4, h + 4); c.restore();
  c.fillStyle = '#000'; rr(x + w / 2 - 110, y + 26, 220, 62, 31); c.fill();
  return cv.toDataURL('image/png');
};
window.PHONE = PH;
VIDEOS.end = { dur: 3.4, f: (t) => endCard(t, 0, 'KARİYERİNİ SEN YAZ', 'Ücretsiz indir, kariyerine başla') };
