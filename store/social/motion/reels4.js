// Reels 4 (Starpedia tarzı "bu bir futbolcuya ait... o futbolcu sensin"): değer, röportaj, profil.
// Görseller: capture4.js ile alınan oyun ekranları (?a=<klasör>, shots/*.jpg).
// Render: PAGE=reels4.html ASSETS=$PWD/assets4 node render3.js all <çıktı>
const A = new URLSearchParams(location.search).get('a') || '.';
const IMG = {};
const shot = (n) => { const src = A + '/shots/' + n + '.jpg'; if (!IMG[src]) { const i = new Image(); i.src = src; IMG[src] = i; } return IMG[src]; };
function cover(im, x, y, w, h, zoom = 1, sy = 0.5, sx = 0.5) {
  if (!im.complete || !im.naturalWidth) return;
  const s = Math.max(w / im.naturalWidth, h / im.naturalHeight) * zoom;
  const dw = im.naturalWidth * s, dh = im.naturalHeight * s;
  c.drawImage(im, x + (w - dw) * sx, y + (h - dh) * sy, dw, dh);
}
function phoneShot(name, lt, d, o = {}) {
  const { zoom0 = 1, zoom1 = 1.06, sy = 0, sc = 1 } = o;
  const k = E.io(seg(lt, 0, d));
  phoneFrame((x, y, w, h) => { c.fillStyle = '#0a1530'; c.fillRect(x, y, w, h); cover(shot(name), x, y, w, h, lerp(zoom0, zoom1, k), sy); }, sc, 0, 0, 0);
}
function phoneScroll(name, p) {
  const im = shot(name);
  phoneFrame((x, y, w, h) => {
    c.fillStyle = '#0a1530'; c.fillRect(x, y, w, h);
    if (!im.complete || !im.naturalWidth) return;
    const s = w / im.naturalWidth, dh = im.naturalHeight * s;
    c.drawImage(im, x, y - Math.max(0, dh - h) * p, w, dh);
  });
}
function darkBg(P, label, t) {
  drawBg(bgBackdrop(P, label), 1.08 + Math.sin(t * 0.6) * 0.01);
  c.fillStyle = 'rgba(3,6,18,.55)'; c.fillRect(0, 0, W, H);
  vignette(0.7);
}
// Tam ekran oyun görüntüsü (yavaş yakınlaşma, odak noktası fx/fy)
function full(name, z, fx = 0.5, fy = 0.5) { c.fillStyle = '#0a1530'; c.fillRect(0, 0, W, H); cover(shot(name), 0, 0, W, H, z, fy, fx); }
function cap(lt, d, a, b, y = 250, s1 = 88, s2 = 124) { hook(lt, a, b, 0.05, d - 0.25, y, s1, s2); }
function chip(s, y, alpha = 1, col = '#ffcf3f', ink = '#0a1530') {
  if (alpha <= 0) return;
  c.save(); c.globalAlpha *= alpha; c.font = `800 44px ${FONT_H}`;
  const w = c.measureText(s).width + 70;
  c.fillStyle = col; rr(W / 2 - w / 2, y - 38, w, 76, 38); c.fill();
  txt(s, W / 2, y + 2, 44, { color: ink, shadow: 0, skew: 0 });
  c.restore();
}
function timeline(list) {
  let t0 = 0;
  const L = list.map(([d, f]) => { const o = { t0, d, f }; t0 += d; return o; });
  const f = (t) => { const s = L.find((x) => t < x.t0 + x.d) || L[L.length - 1]; s.f(t - s.t0, s.d, t); grain(); };
  f.dur = t0;
  return f;
}
const whoosh = (lt) => flash(lt, 0, 0.18, 0.6);
// Kapanış: link profilde, iki mağaza
function endBio4(lt, tag) {
  const t0 = 0, t = lt, dt = lt;
  const k = seg(t, t0, t0 + 0.4);
  c.save(); c.globalAlpha = E.out(k);
  const g = c.createRadialGradient(W / 2, H * 0.4, 60, W / 2, H * 0.45, H * 0.8);
  g.addColorStop(0, '#1d3f95'); g.addColorStop(0.45, '#0d1f4f'); g.addColorStop(1, '#030714');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  confetti(t, t0 - 0.3, 60, ['#ffd84a', '#ffffff', '#ffb02e', '#7fb2ff']);
  const ak = seg(t, 0.15, 0.5), bob = Math.sin(dt * 7) * 22;
  c.save(); c.globalAlpha *= ak; c.translate(W / 2, 320 + bob);
  c.fillStyle = '#ffcf3f'; c.beginPath(); c.moveTo(0, -120); c.lineTo(95, -10); c.lineTo(35, -10); c.lineTo(35, 90); c.lineTo(-35, 90); c.lineTo(-35, -10); c.lineTo(-95, -10); c.closePath();
  c.shadowColor = 'rgba(255,207,63,.6)'; c.shadowBlur = 50; c.fill(); c.restore();
  txt('LİNK PROFİLDE', W / 2, 530, 150, { grad: GOLD, alpha: ak, scale: 0.8 + 0.2 * E.back(ak) });
  const is = 280 * E.back(seg(t, 0.3, 0.8));
  if (icon.complete && is > 1) { c.save(); c.shadowColor = 'rgba(255,207,63,.45)'; c.shadowBlur = 70; rr(W / 2 - is / 2, 880 - is / 2, is, is, is * 0.22); c.clip(); c.drawImage(icon, W / 2 - is / 2, 880 - is / 2, is, is); c.restore(); }
  const lk = seg(t, 0.5, 0.85);
  txt('STAR', W / 2 - 130, 1150, 140, { alpha: lk });
  txt('FOOT', W / 2 + 130, 1150, 140, { alpha: lk, color: '#ffcf3f' });
  const tk = seg(t, 0.7, 1.05);
  txt(tag, W / 2, 1300, 74, { alpha: tk });
  const bk = seg(t, 0.9, 1.25), pulse = 1 + Math.max(0, Math.sin((dt - 1.25) * 5)) * 0.04 * (dt > 1.25);
  if (bk > 0) {
    c.save(); c.globalAlpha *= bk; c.translate(W / 2, 1460); const s = pulse * (0.8 + 0.2 * E.back(bk)); c.scale(s, s);
    c.shadowColor = 'rgba(255,207,63,.45)'; c.shadowBlur = 50; c.fillStyle = '#ffcf3f'; rr(-330, -66, 660, 132, 66); c.fill(); c.shadowBlur = 0;
    txt('ÜCRETSİZ İNDİR', 0, 4, 62, { color: '#0a1530', shadow: 0, skew: 0 });
    c.restore();
    txt('App Store  ·  Google Play', W / 2, 1585, 44, { alpha: bk, weight: 600, font: FONT_B, skew: 0, color: '#cdd7f4', shadow: 0 });
  }
  c.restore();
}
const BLUE = { id: 'BLU', c1: '#1e5bd8', c2: '#ffffff' };
const GOLDP = { id: 'GLD', c1: '#7a5a12', c2: '#ffffff' };
const RED = { id: 'RDX', c1: '#b3122e', c2: '#ffffff' };

// 1) DEĞER: "Bu futbolcu dünyanın en değerli oyuncusu... O futbolcu sensin"
const vDeger = timeline([
  [1.6, (lt, d) => { full('mv_top', 1.22 + lt * 0.04, 0.35, 0.4); hook(lt, 'BU FUTBOLCU', 'DÜNYANIN EN DEĞERLİSİ', 0.0, d - 0.05, 1480, 96, 112); }],
  [1.6, (lt, d) => { full('mv_top', 1.4 + lt * 0.06, 0.3, 0.4); flash(lt, 0, 0.18, 0.5); hook(lt, 'O FUTBOLCU', 'SENSİN', 0.0, d - 0.1, 1480, 96, 170); }],
  [2.5, (lt, d) => { darkBg(GOLDP, 'STARDEĞER', lt); whoosh(lt); phoneShot('mv_val', lt, d, { sy: 0.3, zoom0: 1.0, zoom1: 1.08 }); cap(lt, d, 'PİYASA DEĞERİN', 'MAÇ MAÇ YÜKSELİYOR', 230, 86, 112); }],
  [2.2, (lt, d) => { darkBg(BLUE, 'TRANSFER', lt); whoosh(lt); phoneShot('mv_buzz', lt, d, { sy: 0.4, zoom0: 1.04, zoom1: 1.1 }); cap(lt, d, 'DEV KULÜPLER', 'SENİ KONUŞUYOR', 230, 86, 120); }],
  [2.2, (lt, d) => { darkBg(BLUE, 'STARPEDIA', lt); whoosh(lt); phoneShot('wiki', lt, d, { sy: 0.1, zoom0: 1.0, zoom1: 1.06 }); cap(lt, d, 'ANSİKLOPEDİ SAYFAN', 'SENİ ANLATIYOR', 230, 86, 120); }],
  [3.4, (lt) => endBio4(lt, 'DÜNYANIN EN DEĞERLİSİ OL')],
]);

// 2) RÖPORTAJ: "Bu futbolcu az önce hat-trick yaptı... O futbolcu sensin. Ne cevap verirsin?"
const vRoportaj = timeline([
  [1.7, (lt, d) => { full('iv_q1', 1.75 + lt * 0.04, 0.5, 0.0); chip('CANLI · MAÇ SONU', 1180, seg(lt, 0, 0.15), '#e11d2e', '#fff'); hook(lt, 'BU FUTBOLCU', 'AZ ÖNCE HAT-TRICK YAPTI', 0.0, d - 0.05, 1480, 96, 106); }],
  [1.6, (lt, d) => { full('iv_q1', 1.95 + lt * 0.06, 0.5, 0.0); flash(lt, 0, 0.18, 0.5); hook(lt, 'O FUTBOLCU', 'SENSİN', 0.0, d - 0.1, 1480, 96, 170); }],
  [3.4, (lt, d) => { // soru ve 3 cevap, oylama çağrısı
    full('iv_q1', 1.02 + lt * 0.01, 0.5, 0.75);
    const ys = [1385, 1530, 1675];
    ys.forEach((y, i) => { const a = seg(lt, 0.4 + i * 0.25, 0.6 + i * 0.25); if (a > 0) { c.save(); c.globalAlpha = a; c.fillStyle = '#ffcf3f'; c.beginPath(); c.arc(W - 70, y - 40, 34, 0, Math.PI * 2); c.fill(); c.restore(); txt(String(i + 1), W - 70, y - 36, 46, { color: '#0a1530', shadow: 0, skew: 0, alpha: a }); } });
    chip('NE CEVAP VERİRSİN?', 160, seg(lt, 0, 0.2));
    chip('YORUMA 1, 2 YA DA 3 YAZ', 260, seg(lt, 1.4, 1.6) * (0.75 + 0.25 * Math.sin(lt * 8)), '#ffffff', '#0a1530');
  }],
  [2.4, (lt, d) => { darkBg(RED, 'SF SPORT', lt); whoosh(lt); phoneShot('iv_q2', lt, d, { sy: 0.7, zoom0: 1.02, zoom1: 1.08 }); cap(lt, d, 'HER CEVABIN', 'BİR SONUCU VAR', 230, 86, 124); txt('Taraftar · Hoca · Takım arkadaşları', W / 2, 1860, 44, { font: FONT_B, weight: 700, skew: 0, alpha: seg(lt, 0.3, 0.6) }); }],
  [2.2, (lt, d) => { darkBg(BLUE, 'STARFEED', lt); whoosh(lt); phoneShot('post_trophy', lt, d, { sy: 0.3, zoom0: 1.04, zoom1: 1.1 }); cap(lt, d, 'SONRA DA', 'SOSYAL MEDYA ÇILDIRIR', 230, 86, 112); }],
  [3.4, (lt) => endBio4(lt, 'KRİTİK ANI SEN OYNA')],
]);

// 3) PROFİL: "Bu hesabın milyonlarca takipçisi var... Ve bu hesap senin"
const vProfil = timeline([
  [1.6, (lt, d) => { full('starfeed', 1.35 + lt * 0.05, 0.5, 0.12); hook(lt, 'BU HESABIN', 'MİLYONLARCA TAKİPÇİSİ VAR', 0.0, d - 0.05, 1480, 96, 100); }],
  [1.6, (lt, d) => { full('starfeed', 1.6 + lt * 0.08, 0.5, 0.14); flash(lt, 0, 0.18, 0.5); hook(lt, 'VE BU HESAP', 'SENİN', 0.0, d - 0.1, 1480, 96, 170); }],
  [2.6, (lt, d) => { darkBg(BLUE, 'STARFEED', lt); whoosh(lt); phoneScroll('starfeed', 0.05 + E.io(seg(lt, 0, d)) * 0.9); cap(lt, d, 'GOLLERİN, KUPALARIN', 'HEPSİ PAYLAŞILIYOR', 230, 86, 112); }],
  [2.2, (lt, d) => { darkBg(GOLDP, 'AİLE', lt); whoosh(lt); phoneShot('post_family', lt, d, { sy: 0.3, zoom0: 1.04, zoom1: 1.1 }); cap(lt, d, 'AİLEN, SEVGİLİN', 'TAKIM ARKADAŞLARIN', 230, 86, 112); }],
  [2.2, (lt, d) => { darkBg(BLUE, 'STARPEDIA', lt); whoosh(lt); phoneShot('wiki', lt, d, { sy: 0.1, zoom0: 1.0, zoom1: 1.06 }); cap(lt, d, 'KENDİ ANSİKLOPEDİ', 'SAYFAN BİLE VAR', 230, 86, 120); }],
  [3.4, (lt) => endBio4(lt, 'YILDIZ GİBİ YAŞA')],
]);

Object.assign(VIDEOS, { r4_deger: { dur: vDeger.dur, f: vDeger }, r4_roportaj: { dur: vRoportaj.dur, f: vRoportaj }, r4_profil: { dur: vProfil.dur, f: vProfil } });
['ig', 'yas', 'penalti'].forEach((k) => delete VIDEOS[k]);
window.preload = () => {
  const list = ['iv_q1', 'iv_q2', 'mv_val', 'mv_top', 'mv_buzz', 'post_family', 'post_trophy', 'starfeed', 'wiki'].map(shot);
  return Promise.all(list.map((i) => (i.complete && i.naturalWidth ? 1 : new Promise((r) => { i.onload = r; i.onerror = r; }))));
};
