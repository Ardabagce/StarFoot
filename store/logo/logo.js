// StarFoot uygulama ikonu konseptleri (1024x1024), tamamen kod ile çizilir: telifsiz.
// window.draw(id) ilgili konsepti #cv canvas'ına çizer.
const S = 1024;
const cv = document.getElementById('cv');
const c = cv.getContext('2d');
const PHI = (1 + Math.sqrt(5)) / 2;
const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const slerp = (a, b, t) => norm(add(mul(a, 1 - t), mul(b, t)));
function rng(s) { return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

// ---------- Gerçekçi futbol topu (kesik ikosahedron, küre üzerine izdüşüm) ----------
const ICO = [];
[[0, 1, PHI], [0, -1, PHI], [0, 1, -PHI], [0, -1, -PHI]].forEach(([a, b, d]) => { ICO.push([a, b, d], [b, d, a], [d, a, b]); });
const ICOn = ICO.map(norm);
const NB = ICOn.map((v, i) => ICOn.map((w, j) => [j, dot(v, w)]).filter(([j, d]) => j !== i && d > 0.4).map(([j]) => j));
function pentagon(i) { // komşulara doğru 1/3 noktalar, açıya göre sıralı
  const cc = ICO[i];
  const pts = NB[i].map((j) => norm(add(cc, mul(sub(ICO[j], cc), 1 / 3))));
  const ref = norm(sub(pts[0], mul(ICOn[i], dot(pts[0], ICOn[i]))));
  const ax2 = [ICOn[i][1] * ref[2] - ICOn[i][2] * ref[1], ICOn[i][2] * ref[0] - ICOn[i][0] * ref[2], ICOn[i][0] * ref[1] - ICOn[i][1] * ref[0]];
  return pts.map((p, k) => [p, Math.atan2(dot(p, ax2), dot(p, ref)), NB[i][k]]).sort((a, b) => a[1] - b[1]);
}
const PENTS = ICOn.map((_, i) => pentagon(i));
function rot(v, rx, ry, rz) {
  let [x, y, z] = v;
  [y, z] = [y * Math.cos(rx) - z * Math.sin(rx), y * Math.sin(rx) + z * Math.cos(rx)];
  [x, z] = [x * Math.cos(ry) + z * Math.sin(ry), -x * Math.sin(ry) + z * Math.cos(ry)];
  [x, y] = [x * Math.cos(rz) - y * Math.sin(rz), x * Math.sin(rz) + y * Math.cos(rz)];
  return [x, y, z];
}
function ball(cx, cy, R, o = {}) {
  const { rx = 0.5, ry = 0.35, rz = 0.2, panel = '#0d1020', light = [-0.45, -0.6, 0.66] } = o;
  const P = (v) => { const r = rot(v, rx, ry, rz); return [cx + r[0] * R, cy + r[1] * R, r[2]]; };
  c.save();
  // gölge
  if (o.shadow !== false) {
    const sg = c.createRadialGradient(cx + R * 0.15, cy + R * 1.02, R * 0.1, cx + R * 0.15, cy + R * 1.02, R * 1.0);
    sg.addColorStop(0, 'rgba(0,0,0,.55)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = sg; c.beginPath(); c.ellipse(cx + R * 0.15, cy + R * 1.02, R * 1.0, R * 0.22, 0, 0, Math.PI * 2); c.fill();
  }
  c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.clip();
  // beyaz deri
  const g = c.createRadialGradient(cx - R * 0.38, cy - R * 0.45, R * 0.05, cx, cy, R * 1.05);
  g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, '#eef1f6'); g.addColorStop(0.8, '#b9c0cf'); g.addColorStop(1, '#6c7488');
  c.fillStyle = g; c.fillRect(cx - R, cy - R, R * 2, R * 2);
  // dikiş çizgileri (altıgen kenarları)
  c.lineCap = 'round'; c.lineJoin = 'round';
  const seam = (a, b) => {
    c.beginPath(); let on = false;
    for (let k = 0; k <= 16; k++) {
      const p = P(slerp(a, b, k / 16));
      if (p[2] > 0) { on ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); on = true; } else on = false;
    }
    c.stroke();
  };
  c.strokeStyle = 'rgba(70,80,100,.55)'; c.lineWidth = R * 0.018;
  PENTS.forEach((pts, i) => pts.forEach(([p, , j]) => { if (j > i) { const q = PENTS[j].find((x) => x[2] === i); seam(p, q[0]); } }));
  // beşgen paneller
  PENTS.forEach((pts, i) => {
    const cz = rot(ICOn[i], rx, ry, rz)[2];
    if (cz < -0.35) return;
    c.beginPath();
    pts.forEach(([p], k) => { const q = pts[(k + 1) % 5][0]; for (let s = 0; s <= 8; s++) { const pp = P(slerp(p, q, s / 8)); (k === 0 && s === 0) ? c.moveTo(pp[0], pp[1]) : c.lineTo(pp[0], pp[1]); } });
    c.closePath();
    const n = rot(ICOn[i], rx, ry, rz), lit = Math.max(0, dot(n, norm(light)));
    const pc = c.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
    pc.addColorStop(0, panel); pc.addColorStop(1, '#000');
    c.fillStyle = pc; c.fill();
    c.fillStyle = `rgba(150,170,210,${lit * 0.35})`; c.fill();
    c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = R * 0.012; c.stroke();
  });
  // hacim: kenar karartma + parlama
  const v = c.createRadialGradient(cx - R * 0.2, cy - R * 0.25, R * 0.55, cx, cy, R);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(10,15,35,.55)');
  c.fillStyle = v; c.fillRect(cx - R, cy - R, R * 2, R * 2);
  const hl = c.createRadialGradient(cx - R * 0.42, cy - R * 0.5, 0, cx - R * 0.42, cy - R * 0.5, R * 0.45);
  hl.addColorStop(0, 'rgba(255,255,255,.85)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = hl; c.fillRect(cx - R, cy - R, R * 2, R * 2);
  if (o.rim) { const rg = c.createRadialGradient(cx, cy, R * 0.82, cx, cy, R); rg.addColorStop(0, 'rgba(255,200,80,0)'); rg.addColorStop(1, o.rim); c.fillStyle = rg; c.fillRect(cx - R, cy - R, R * 2, R * 2); }
  c.restore();
}

// ---------- Metalik altın yıldız (eğimli yüzeyler) ----------
function starPts(cx, cy, R, r, rotA = -Math.PI / 2) {
  const a = [];
  for (let i = 0; i < 10; i++) { const ang = rotA + i * Math.PI / 5, rad = i % 2 ? r : R; a.push([cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad]); }
  return a;
}
function goldStar(cx, cy, R, o = {}) {
  const { glow = true, rotA = -Math.PI / 2, depth = 1 } = o;
  const pts = starPts(cx, cy, R, R * 0.43, rotA);
  c.save();
  if (glow) { c.shadowColor = 'rgba(255,190,40,.75)'; c.shadowBlur = R * 0.5; c.fillStyle = '#e8a913'; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath(); c.fill(); c.shadowBlur = 0; }
  // her kol iki yüz: ışığa bakan açık, diğeri koyu
  const L = norm([-0.5, -0.8, 0.6]);
  for (let i = 0; i < 10; i++) {
    const a = pts[i], b = pts[(i + 1) % 10];
    const mx = (a[0] + b[0]) / 2 - cx, my = (a[1] + b[1]) / 2 - cy;
    const n = norm([mx, my, R * 0.55 * depth]);
    const k = Math.max(0, dot(n, L));
    const g = c.createLinearGradient(cx, cy, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    const hi = 0.45 + k * 0.75;
    const col = (m) => `rgb(${Math.min(255, Math.round(255 * m))},${Math.min(255, Math.round(196 * m))},${Math.min(255, Math.round(58 * m * 0.8))})`;
    g.addColorStop(0, col(hi * 1.15)); g.addColorStop(1, col(hi * 0.85));
    c.fillStyle = g; c.beginPath(); c.moveTo(cx, cy); c.lineTo(...a); c.lineTo(...b); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,245,200,.35)'; c.lineWidth = R * 0.008; c.stroke();
  }
  // dış kenar
  c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(...p) : c.moveTo(...p))); c.closePath();
  c.strokeStyle = 'rgba(120,70,0,.6)'; c.lineWidth = R * 0.02; c.stroke();
  // parlama
  const sh = c.createRadialGradient(cx - R * 0.25, cy - R * 0.35, 0, cx - R * 0.25, cy - R * 0.35, R * 0.6);
  sh.addColorStop(0, 'rgba(255,255,240,.55)'); sh.addColorStop(1, 'rgba(255,255,240,0)');
  c.save(); c.clip(); c.fillStyle = sh; c.fillRect(cx - R, cy - R, R * 2, R * 2); c.restore();
  c.restore();
}
function sparkle(x, y, s, a = 1) {
  c.save(); c.globalAlpha *= a; c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, y, 0, x, y, s);
  g.addColorStop(0, 'rgba(255,250,220,1)'); g.addColorStop(0.2, 'rgba(255,220,120,.6)'); g.addColorStop(1, 'rgba(255,200,80,0)');
  c.fillStyle = g; c.beginPath(); c.arc(x, y, s, 0, Math.PI * 2); c.fill();
  c.fillStyle = 'rgba(255,250,230,.9)';
  c.beginPath(); c.moveTo(x - s * 1.6, y); c.lineTo(x, y - s * 0.08); c.lineTo(x + s * 1.6, y); c.lineTo(x, y + s * 0.08); c.fill();
  c.beginPath(); c.moveTo(x, y - s * 1.6); c.lineTo(x + s * 0.08, y); c.lineTo(x, y + s * 1.6); c.lineTo(x - s * 0.08, y); c.fill();
  c.restore();
}
// Gece stadyumu zemini: lacivert gökyüzü, projektör bokeh'i
function nightBg(seed = 3, top = '#0a1a4a', bot = '#030714') {
  const g = c.createLinearGradient(0, 0, 0, S); g.addColorStop(0, top); g.addColorStop(1, bot);
  c.fillStyle = g; c.fillRect(0, 0, S, S);
  const r = rng(seed);
  c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 26; i++) {
    const x = r() * S, y = r() * S * 0.55, s = 12 + r() * 46, a = 0.05 + r() * 0.16;
    const bg = c.createRadialGradient(x, y, 0, x, y, s);
    bg.addColorStop(0, `rgba(200,220,255,${a})`); bg.addColorStop(1, 'rgba(200,220,255,0)');
    c.fillStyle = bg; c.beginPath(); c.arc(x, y, s, 0, Math.PI * 2); c.fill();
  }
  c.restore();
}
function floodlight(x, y, ang, len, w, a = 0.22) {
  c.save(); c.translate(x, y); c.rotate(ang); c.globalCompositeOperation = 'lighter';
  const g = c.createLinearGradient(0, 0, 0, len); g.addColorStop(0, `rgba(235,240,255,${a})`); g.addColorStop(1, 'rgba(235,240,255,0)');
  c.fillStyle = g; c.beginPath(); c.moveTo(-w * 0.08, 0); c.lineTo(w * 0.08, 0); c.lineTo(w, len); c.lineTo(-w, len); c.closePath(); c.fill();
  const h = c.createRadialGradient(0, 0, 0, 0, 0, 60); h.addColorStop(0, 'rgba(255,255,255,.95)'); h.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = h; c.beginPath(); c.arc(0, 0, 60, 0, Math.PI * 2); c.fill();
  c.restore();
}
function pitch(horizon, col1 = '#1f7a3a', col2 = '#16612d') {
  // perspektifli çim şeritleri
  for (let i = 0; i < 9; i++) {
    const y0 = horizon + Math.pow(i / 9, 1.7) * (S - horizon), y1 = horizon + Math.pow((i + 1) / 9, 1.7) * (S - horizon);
    c.fillStyle = i % 2 ? col1 : col2; c.fillRect(0, y0, S, y1 - y0 + 1);
  }
  const g = c.createLinearGradient(0, horizon, 0, S); g.addColorStop(0, 'rgba(3,7,20,.65)'); g.addColorStop(0.4, 'rgba(3,7,20,0)'); g.addColorStop(1, 'rgba(3,7,20,.35)');
  c.fillStyle = g; c.fillRect(0, horizon, S, S - horizon);
}
function vignette(a = 0.5) {
  const v = c.createRadialGradient(S / 2, S / 2, S * 0.3, S / 2, S / 2, S * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${a})`);
  c.fillStyle = v; c.fillRect(0, 0, S, S);
}

const CONCEPTS = {
  // 1) Altın yıldızın önünde gerçekçi top: sade, küçük boyutta en okunaklı
  yildiz() {
    nightBg(5, '#12307a', '#040a1e');
    floodlight(120, -40, -0.35, 1100, 380, 0.16); floodlight(S - 120, -40, 0.35, 1100, 380, 0.16);
    goldStar(S / 2, 430, 400, { depth: 1.1 });
    ball(S / 2, 690, 230, { rx: 0.4, ry: 0.6, rz: 0.15 });
    sparkle(770, 220, 40); sparkle(255, 330, 26, 0.8);
    vignette(0.45);
  },
  // 2) Gece stadyumu: penaltı noktasında top, gökyüzünde yıldız
  stadyum() {
    nightBg(9, '#0b2266', '#050b22');
    // tribün silüeti ve projektörler
    c.fillStyle = '#060a18'; c.beginPath(); c.moveTo(0, 520); c.quadraticCurveTo(S / 2, 430, S, 520); c.lineTo(S, 600); c.lineTo(0, 600); c.fill();
    const r = rng(4); c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 260; i++) { const x = r() * S, y = 470 + r() * 120; c.fillStyle = `rgba(255,255,255,${r() * 0.25})`; c.fillRect(x, y, 3, 3); }
    c.restore();
    floodlight(90, 300, -0.55, 900, 300, 0.2); floodlight(S - 90, 300, 0.55, 900, 300, 0.2);
    pitch(590);
    // penaltı noktası ve çizgi
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 8; c.beginPath(); c.ellipse(S / 2, 1180, 560, 300, 0, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
    ball(S / 2, 790, 190, { rx: 0.9, ry: 0.4, rz: -0.2 });
    goldStar(S / 2, 290, 210, { depth: 1 });
    sparkle(S / 2 + 230, 190, 30);
    vignette(0.5);
  },
  // 3) 10 numaralı forma sırtı: oyunun kimliği (yıldız oyuncu olmak)
  forma() {
    const g = c.createRadialGradient(S / 2, S * 0.35, 50, S / 2, S / 2, S * 0.8);
    g.addColorStop(0, '#2b4fb3'); g.addColorStop(0.5, '#102563'); g.addColorStop(1, '#040a1e');
    c.fillStyle = g; c.fillRect(0, 0, S, S);
    floodlight(S / 2, -80, 0, 1150, 520, 0.18);
    // forma gövdesi
    const shirt = () => {
      c.beginPath();
      c.moveTo(320, 250); c.quadraticCurveTo(S / 2, 300, 704, 250);       // yaka
      c.lineTo(900, 340); c.lineTo(960, 560); c.lineTo(820, 600);        // sağ kol
      c.lineTo(800, 520); c.lineTo(790, 960); c.quadraticCurveTo(S / 2, 990, 234, 960);
      c.lineTo(224, 520); c.lineTo(204, 600); c.lineTo(64, 560); c.lineTo(124, 340); c.closePath();
    };
    c.save(); c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 60; c.shadowOffsetY = 20; shirt(); c.fillStyle = '#c8102e'; c.fill(); c.restore();
    c.save(); shirt(); c.clip();
    const sg = c.createLinearGradient(64, 0, 960, 0);
    sg.addColorStop(0, '#7d0718'); sg.addColorStop(0.3, '#d8162f'); sg.addColorStop(0.55, '#e2253c'); sg.addColorStop(0.8, '#b10e25'); sg.addColorStop(1, '#6d0614');
    c.fillStyle = sg; c.fillRect(0, 0, S, S);
    // kumaş kıvrımları
    [[380, 0.08], [520, 0.06], [650, 0.08]].forEach(([x, a]) => { const fg = c.createLinearGradient(x - 60, 0, x + 60, 0); fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(0.5, `rgba(0,0,0,${a * 2})`); fg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = fg; c.fillRect(x - 60, 300, 120, 700); });
    // altın kol bantları ve yaka
    c.fillStyle = '#f2b51f'; c.save(); c.translate(0, 0);
    c.beginPath(); c.moveTo(64, 560); c.lineTo(204, 600); c.lineTo(212, 570); c.lineTo(72, 530); c.fill();
    c.beginPath(); c.moveTo(960, 560); c.lineTo(820, 600); c.lineTo(812, 570); c.lineTo(952, 530); c.fill(); c.restore();
    c.strokeStyle = '#f2b51f'; c.lineWidth = 26; c.beginPath(); c.moveTo(330, 258); c.quadraticCurveTo(S / 2, 318, 694, 258); c.stroke();
    // ışık
    const lg = c.createRadialGradient(S / 2, 200, 50, S / 2, 400, 600); lg.addColorStop(0, 'rgba(255,255,255,.22)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = lg; c.fillRect(0, 0, S, S);
    c.restore();
    // 10 numara
    c.save(); c.font = '900 470px "Saira Condensed", "Arial Narrow", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 12; c.shadowOffsetY = 8;
    const ng = c.createLinearGradient(0, 470, 0, 880); ng.addColorStop(0, '#fff6cf'); ng.addColorStop(0.5, '#ffcf3f'); ng.addColorStop(1, '#d98a0c');
    c.fillStyle = ng; c.fillText('10', S / 2, 680); c.lineWidth = 8; c.strokeStyle = 'rgba(120,60,0,.55)'; c.strokeText('10', S / 2, 680); c.restore();
    goldStar(S / 2, 150, 120, { depth: 1 });
    sparkle(S / 2 + 150, 95, 22);
    vignette(0.35);
  },
  // 4) Arma: altın kalkan, yıldız ve top (kulüp rozeti hissi)
  arma() {
    const g = c.createRadialGradient(S / 2, S * 0.4, 60, S / 2, S / 2, S * 0.8);
    g.addColorStop(0, '#16367f'); g.addColorStop(1, '#040a1e'); c.fillStyle = g; c.fillRect(0, 0, S, S);
    const shield = (k) => {
      const w = 340 * k, top = 150 + (1 - k) * 340, bot = 920 - (1 - k) * 180;
      c.beginPath(); c.moveTo(S / 2, top - 30 * k);
      c.quadraticCurveTo(S / 2 + w * 0.55, top + 40 * k, S / 2 + w, top + 10 * k);
      c.lineTo(S / 2 + w, top + 330 * k); c.quadraticCurveTo(S / 2 + w * 0.92, bot - 150 * k, S / 2, bot);
      c.quadraticCurveTo(S / 2 - w * 0.92, bot - 150 * k, S / 2 - w, top + 330 * k);
      c.lineTo(S / 2 - w, top + 10 * k); c.quadraticCurveTo(S / 2 - w * 0.55, top + 40 * k, S / 2, top - 30 * k); c.closePath();
    };
    c.save(); c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 50; c.shadowOffsetY = 18; shield(1); c.fillStyle = '#c99317'; c.fill(); c.restore();
    shield(1); const gg = c.createLinearGradient(170, 120, 860, 920); gg.addColorStop(0, '#fff1b8'); gg.addColorStop(0.3, '#f1bf3a'); gg.addColorStop(0.6, '#b8830f'); gg.addColorStop(1, '#ffd65a'); c.fillStyle = gg; c.fill();
    shield(0.9); const ig = c.createLinearGradient(0, 200, 0, 900); ig.addColorStop(0, '#1c3f99'); ig.addColorStop(1, '#0a1a4a'); c.fillStyle = ig; c.fill();
    // diyagonal şerit
    c.save(); shield(0.9); c.clip(); c.fillStyle = 'rgba(200,16,46,.9)'; c.beginPath(); c.moveTo(150, 640); c.lineTo(870, 380); c.lineTo(870, 480); c.lineTo(150, 740); c.fill();
    const hl = c.createLinearGradient(0, 200, 0, 520); hl.addColorStop(0, 'rgba(255,255,255,.2)'); hl.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = hl; c.fillRect(0, 0, S, S); c.restore();
    ball(S / 2, 610, 165, { rx: 0.5, ry: -0.5, shadow: false });
    goldStar(S / 2, 330, 150, { depth: 1 });
    sparkle(760, 170, 30);
    vignette(0.4);
  },
  // 5) Kuyruklu yıldız: hızla giden top, arkasında altın iz (hareket ve heyecan)
  komet() {
    nightBg(12, '#0e2a72', '#03081a');
    const bx = 610, by = 420, R = 205;
    // alev izi: topun arkasında sol alta doğru genişleyen altın şerit
    c.save(); c.globalCompositeOperation = 'lighter';
    const ang = Math.atan2(560, -520), len = 760;
    c.translate(bx, by); c.rotate(ang - Math.PI / 2);
    for (let k = 0; k < 3; k++) {
      const w = [R * 1.0, R * 0.7, R * 0.38][k], col = [[255, 150, 30, 0.35], [255, 200, 70, 0.45], [255, 245, 200, 0.6]][k];
      const g = c.createLinearGradient(0, 0, 0, len);
      g.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${col[3]})`); g.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
      c.fillStyle = g; c.beginPath(); c.moveTo(-w, 0); c.quadraticCurveTo(-w * 0.6, len * 0.6, 0, len); c.quadraticCurveTo(w * 0.6, len * 0.6, w, 0); c.closePath(); c.fill();
    }
    c.restore();
    const r = rng(7);
    for (let i = 0; i < 46; i++) { const t = r(), sp = (r() - 0.5) * (1 - t) * 300; const x = bx - t * 520 + sp * 0.73, y = by + t * 560 + sp * 0.68; sparkle(x, y, 5 + r() * 14, 0.9 * (1 - t)); }
    [[180, 210, 40], [880, 760, 30], [250, 470, 22]].forEach(([x, y, s]) => goldStar(x, y, s, { glow: true }));
    // topun etrafında hız halesi
    c.save(); c.globalCompositeOperation = 'lighter';
    const h = c.createRadialGradient(bx, by, R * 0.95, bx, by, R * 1.35); h.addColorStop(0, 'rgba(255,200,80,.45)'); h.addColorStop(1, 'rgba(255,200,80,0)');
    c.fillStyle = h; c.beginPath(); c.arc(bx, by, R * 1.35, 0, Math.PI * 2); c.fill(); c.restore();
    ball(bx, by, R, { rx: 0.3, ry: 0.9, rz: 0.5, shadow: false });
    goldStar(845, 150, 90, { depth: 1 });
    vignette(0.4);
  },
};
window.CONCEPTS = Object.keys(CONCEPTS);
window.draw = (id) => { c.save(); c.clearRect(0, 0, S, S); CONCEPTS[id](); c.restore(); };
window.ready = () => document.fonts.load('900 100px "Saira Condensed"', '10').then(() => document.fonts.ready);
