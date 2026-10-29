// 29 Ekim Cumhuriyet Bayramı story'si (1080x1920, ~11 sn).
// Bayrak resmi oranlarla çiziliyor (Türk Bayrağı Kanunu ölçüleri), telifsiz; figür ve stadyum oyunun kendi çizimi.
for (const k in VIDEOS) delete VIDEOS[k];

const RED = '#E30A17';
// ---------- Bayrak (1200x800, G = 800) ----------
const FLAG = document.createElement('canvas'); FLAG.width = 1200; FLAG.height = 800;
(() => {
  const f = FLAG.getContext('2d');
  f.fillStyle = RED; f.fillRect(0, 0, 1200, 800);
  f.fillStyle = '#fff'; f.beginPath(); f.arc(400, 400, 200, 0, Math.PI * 2); f.fill();      // ayın dış dairesi (B = G/2)
  f.fillStyle = RED; f.beginPath(); f.arc(450, 400, 160, 0, Math.PI * 2); f.fill();         // iç daire (C = G/16, D = 0.4G)
  // yıldız: çevrel daire çapı G/4, bir ucu göndere bakar
  const cx = 583.334, cy = 400, R = 100, r = R * Math.cos(2 * Math.PI / 5) / Math.cos(Math.PI / 5);
  f.fillStyle = '#fff'; f.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = Math.PI + i * Math.PI / 5, rad = i % 2 ? r : R;
    f.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
  }
  f.closePath(); f.fill();
})();

// Dalgalanan bayrak: dikey şeritler halinde kaydırılır, kıvrıma göre gölgelenir
function flag(x, y, w, t, o = {}) {
  const { amp = 0.045, speed = 3.2, waves = 1.6, alpha = 1, pole = true } = o;
  const h = w / 1.5, N = 120, sw = w / N;
  c.save(); c.globalAlpha *= alpha;
  if (pole) {
    const pg = c.createLinearGradient(x - 22, 0, x, 0); pg.addColorStop(0, '#9aa3b5'); pg.addColorStop(0.5, '#f4f6fa'); pg.addColorStop(1, '#7b8396');
    // direğin alt kısmı yavaşça kaybolur (yazıların üstüne binmesin)
    c.fillStyle = pg; c.fillRect(x - 20, y - 30, 16, h * 0.95);
    for (let j = 0; j < 16; j++) { c.save(); c.globalAlpha *= 1 - (j + 1) / 17; c.fillRect(x - 20, y - 30 + h * 0.95 + j * h * 0.025, 16, h * 0.025 + 1); c.restore(); }
    c.fillStyle = '#e8c45a'; c.beginPath(); c.arc(x - 12, y - 34, 16, 0, Math.PI * 2); c.fill();
  }
  for (let i = 0; i < N; i++) {
    const u = i / N, k = u * u * 0.6 + u * 0.4;           // göndere yakın taraf az oynar
    const ph = u * Math.PI * 2 * waves - t * speed;
    const dy = Math.sin(ph) * amp * w * k;
    const sl = Math.cos(ph) * k;                           // eğim: ışık/gölge
    const sx = u * 1200, sws = 1200 / N + 0.6;
    c.drawImage(FLAG, sx, 0, sws, 800, x + i * sw, y + dy, sw + 0.8, h);
    c.fillStyle = sl > 0 ? `rgba(255,255,255,${sl * 0.14})` : `rgba(0,0,0,${-sl * 0.28})`;
    c.fillRect(x + i * sw, y + dy, sw + 0.8, h);
  }
  c.restore();
}

// ---------- Havai fişek ----------
function firework(t, t0, x, y, col, n = 46, R = 260) {
  const dt = t - t0;
  if (dt < 0 || dt > 2.2) return;
  const r = RNG(Math.floor(x * 7 + y));
  if (dt < 0.35) { // yükselen iz
    const k = dt / 0.35;
    c.fillStyle = `rgba(255,240,210,${1 - k * 0.3})`; c.beginPath(); c.arc(x, y + (1 - E.out(k)) * 700, 5, 0, Math.PI * 2); c.fill();
    return;
  }
  const k = (dt - 0.35) / 1.85, rad = R * E.out(Math.min(1, k * 1.4)), fall = k * k * 120;
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r() * 0.1, rr2 = rad * (0.75 + r() * 0.3);
    const px = x + Math.cos(a) * rr2, py = y + Math.sin(a) * rr2 + fall;
    const al = (1 - k) * (0.6 + 0.4 * Math.sin(t * 30 + i));
    c.fillStyle = col.replace('A', al.toFixed(2));
    c.beginPath(); c.arc(px, py, 6.5 * (1 - k * 0.5), 0, Math.PI * 2); c.fill();
    c.strokeStyle = col.replace('A', (al * 0.35).toFixed(2)); c.lineWidth = 2;
    c.beginPath(); c.moveTo(px, py); c.lineTo(x + Math.cos(a) * rr2 * 0.82, y + Math.sin(a) * rr2 * 0.82 + fall); c.stroke();
  }
  if (k < 0.15) { const g = c.createRadialGradient(x, y, 0, x, y, 160); g.addColorStop(0, `rgba(255,240,220,${0.4 * (1 - k / 0.15)})`); g.addColorStop(1, 'rgba(255,240,220,0)'); c.fillStyle = g; c.fillRect(x - 160, y - 160, 320, 320); }
  c.restore();
}
const FW = [[0.3, 230, 330, 'rgba(255,60,70,A)'], [0.9, 840, 260, 'rgba(255,255,255,A)'], [1.6, 560, 200, 'rgba(255,210,90,A)'],
  [2.4, 300, 420, 'rgba(255,255,255,A)'], [3.1, 790, 470, 'rgba(255,60,70,A)'], [7.6, 250, 300, 'rgba(255,60,70,A)'],
  [8.2, 830, 340, 'rgba(255,255,255,A)'], [8.9, 540, 230, 'rgba(255,210,90,A)'], [9.6, 320, 380, 'rgba(255,255,255,A)'], [10.2, 780, 260, 'rgba(255,60,70,A)']];
const fireworks = (t) => FW.forEach(([t0, x, y, col]) => firework(t, t0, x, y, col, 64, 300));

// Gece gökyüzü (yıldızlı, şafak kızıllığı)
function sky(t) {
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#04060f'); g.addColorStop(0.45, '#0b1430'); g.addColorStop(0.8, '#3a0d16'); g.addColorStop(1, '#6b0f17');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const r = RNG(29);
  for (let i = 0; i < 160; i++) {
    const x = r() * W, y = r() * H * 0.6, s = r() * 2.2 + 0.4;
    c.fillStyle = `rgba(255,255,255,${0.25 + 0.5 * Math.abs(Math.sin(t * 1.5 + i))})`; c.fillRect(x, y, s, s);
  }
}
function redGlow(a = 0.35) {
  const g = c.createRadialGradient(W / 2, H * 0.95, 50, W / 2, H, H * 0.7);
  g.addColorStop(0, `rgba(227,10,23,${a})`); g.addColorStop(1, 'rgba(227,10,23,0)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
}
// Kırmızı-beyaz konfeti
const RW = ['#e30a17', '#ffffff', '#ff4b55', '#f3f3f3'];
function line2(s, y, size, o = {}) { txt(s, W / 2, y, size, Object.assign({ skew: -0.1 }, o)); }

const TUR29 = { id: 'TUR', c1: '#e30a17', c2: '#ffffff', short: 'TÜR' };
const v29 = timeline([
  // 1) Gece, dalgalanan büyük bayrak ve havai fişekler
  [3.6, (lt, d, t) => {
    sky(t); fireworks(t); redGlow(0.3);
    const rise = E.out(seg(lt, 0, 1.2));
    flag(150, 560 + (1 - rise) * 120, 860, t, { alpha: rise, amp: 0.05 });
    const ck = seg(lt, 0.5, 0.8);
    if (ck > 0) chip('29 EKİM 1923', 1300, ck, '#ffffff', RED);
    const k = seg(lt, 0.8, 1.2);
    line2('CUMHURİYETİMİZİN', 1450, 96, { alpha: k, scale: 0.7 + 0.3 * E.back(k) });
    const k2 = seg(lt, 1.1, 1.5);
    txt('103. YILI', W / 2, 1610, 210, { alpha: k2, scale: 0.6 + 0.4 * E.back(k2), grad: [[0, '#ffffff'], [0.55, '#ffe2e4'], [1, '#ff6670']], skew: -0.1 });
    const k3 = seg(lt, 1.5, 1.9);
    line2('KUTLU OLSUN', 1775, 100, { alpha: k3, scale: 0.7 + 0.3 * E.back(k3) });
    vignette(0.5);
    flash(lt, d - 0.15, 0.3, 0.7);
  }],
  // 2) Stadyum: milli formalı oyuncu sırtı dönük, tribünde dev bayrak; Atatürk'ün sporcu sözü
  [4.2, (lt, d, t) => {
    drawBg(bgStadium(TUR29, false, 7), 1.06 + lt * 0.012, 0, -60);
    c.fillStyle = 'rgba(3,6,18,.35)'; c.fillRect(0, 0, W, H);
    flashes(t, 26, 0.1, 0.42, 7);
    // tribüne açılmış dev bayrak
    flag(70, 330, 940, t * 0.8, { amp: 0.03, waves: 1.2, pole: false });
    const sh = c.createLinearGradient(0, 330, 0, 330 + 627); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.25)');
    c.fillStyle = sh; c.fillRect(70, 330, 940, 640);
    redGlow(0.25);
    // oyuncu (arkadan), kollar yavaşça havaya
    const arm = 0.2 + E.io(seg(lt, 0.6, 1.8)) * 2.4;
    groundShadow(W / 2, 1585, 120, 0.45);
    fig(W / 2, 1590, 560, { kit: kitOf(TUR29), facing: 'up', number: 10, armA: arm });
    confetti(t, 3.6, 110, RW);
    bottomBand(0.88);
    const k = seg(lt, 0.4, 0.9);
    txt('“Ben sporcunun zeki, çevik', W / 2, 1640, 58, { alpha: k, weight: 600, font: FONT_B, skew: 0 });
    txt('ve aynı zamanda ahlaklısını severim.”', W / 2, 1712, 58, { alpha: k, weight: 600, font: FONT_B, skew: 0 });
    const k2 = seg(lt, 1.1, 1.5);
    txt('MUSTAFA KEMAL ATATÜRK', W / 2, 1810, 52, { alpha: k2, color: '#ffd0d3', ls: 4, skew: 0 });
    vignette(0.45);
  }],
  // 3) Kapanış: bayrak, "Nice yüzyıllara" ve küçük StarFoot imzası
  [3.4, (lt, d, t) => {
    sky(t); fireworks(t); redGlow(0.4);
    const fk = E.out(seg(lt, 0, 0.6));
    flag(200, 420, 760, t, { alpha: fk, amp: 0.05 });
    const k = seg(lt, 0.3, 0.7);
    line2('NİCE', 1130, 120, { alpha: k, scale: 0.7 + 0.3 * E.back(k) });
    const k2 = seg(lt, 0.5, 0.9);
    txt('YÜZYILLARA', W / 2, 1270, 170, { alpha: k2, scale: 0.6 + 0.4 * E.back(k2), grad: [[0, '#ffffff'], [0.55, '#ffe2e4'], [1, '#ff6670']], skew: -0.1 });
    const k3 = seg(lt, 1.0, 1.4);
    txt('Cumhuriyet Bayramımız kutlu olsun', W / 2, 1400, 54, { alpha: k3, weight: 600, font: FONT_B, skew: 0, color: '#f2f4fb' });
    // StarFoot imzası
    const k4 = seg(lt, 1.4, 1.8);
    if (k4 > 0) {
      c.save(); c.globalAlpha *= k4;
      const s = 120, x = W / 2 - 230, y = 1630;
      if (icon.complete) { c.save(); rr(x, y - s / 2, s, s, s * 0.22); c.clip(); c.drawImage(icon, x, y - s / 2, s, s); c.restore(); }
      txt('STAR', x + s + 30, y + 4, 92, { align: 'left', shadow: 10 });
      c.font = `900 92px ${FONT_H}`; const sw = c.measureText('STAR').width;
      txt('FOOT', x + s + 30 + sw + 8, y + 4, 92, { align: 'left', color: '#ffcf3f', shadow: 10 });
      c.restore();
    }
    vignette(0.4);
    confetti(t, 7.6, 60, RW);
  }],
]);
VIDEOS.cumhuriyet = { dur: v29.dur, f: v29 };
window.preload = () => Promise.resolve();
