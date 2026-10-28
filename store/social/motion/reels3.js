// Reels (Dünya Şampiyonası, Efsanelerin İzinde, Starpedia): stok görüntü + oyun ekranları + animasyon.
// ads.js'in yardımcılarını kullanır (txt, hook, endCard, phoneFrame, confetti, flash...).
// Görseller: ?a=<klasör> (shots/*.png oyun ekranları, fr/<sahne>/0001.jpg stok kareleri)
const A = new URLSearchParams(location.search).get('a') || '.';
const IMG = {};
function img(src) {
  if (IMG[src]) return IMG[src];
  const i = new Image(); i.src = A + '/' + src; IMG[src] = i; return i;
}
const shot = (n) => img(`shots/${n}.png`);
const frameOf = (clip, k, n) => img(`fr/${clip}/${String(Math.min(n, Math.max(1, k + 1))).padStart(4, '0')}.jpg`);
// Stok klip karesi (t: sahne içi süre)
function clip(name, n, lt, zoom = 1, dx = 0, dy = 0) {
  const im = frameOf(name, Math.floor(lt * 30), n);
  if (im.complete && im.naturalWidth) drawBg(im, zoom, dx, dy);
}
// Görseli alana "cover" olarak çiz (sy: dikey kaydırma 0..1)
function cover(im, x, y, w, h, zoom = 1, sy = 0.5, sx = 0.5) {
  if (!im.complete || !im.naturalWidth) return;
  const s = Math.max(w / im.naturalWidth, h / im.naturalHeight) * zoom;
  const dw = im.naturalWidth * s, dh = im.naturalHeight * s;
  c.drawImage(im, x + (w - dw) * sx, y + (h - dh) * sy, dw, dh);
}
// Telefon içinde oyun ekranı (hafif yakınlaşma)
function phoneShot(name, lt, d, o = {}) {
  const { zoom0 = 1, zoom1 = 1.06, sy = 0, ox = 0, sc = 1, rot = 0 } = o;
  const k = E.io(seg(lt, 0, d));
  phoneFrame((x, y, w, h) => {
    c.fillStyle = '#0a1530'; c.fillRect(x, y, w, h);
    cover(shot(name), x, y, w, h, lerp(zoom0, zoom1, k), sy);
  }, sc, ox, 0, rot);
}
// Uzun ekranı telefon içinde kaydır (p: 0..1 ilerleme)
function phoneScroll(name, p, o = {}) {
  const im = shot(name);
  phoneFrame((x, y, w, h) => {
    c.fillStyle = '#fff'; c.fillRect(x, y, w, h);
    if (!im.complete || !im.naturalWidth) return;
    const s = w / im.naturalWidth, dh = im.naturalHeight * s;
    c.drawImage(im, x, y - (dh - h) * p, w, dh);
  }, o.sc || 1, o.ox || 0);
}
// Arka plan: koyu, bulanık stadyum
function darkBg(P, label, t) {
  drawBg(bgBackdrop(P, label), 1.08 + Math.sin(t * 0.6) * 0.01);
  c.fillStyle = 'rgba(3,6,18,.55)'; c.fillRect(0, 0, W, H);
  vignette(0.7);
}
// Bir bölgeyi bulanıklaştır (stok görüntüdeki arma/logo)
const BLR = document.createElement('canvas'); BLR.width = W; BLR.height = H;
function blurRect(x, y, w, h, px = 22) {
  const bc = BLR.getContext('2d'); bc.clearRect(0, 0, W, H);
  bc.filter = `blur(${px}px)`; bc.drawImage(cv, x - px * 2, y - px * 2, w + px * 4, h + px * 4, x - px * 2, y - px * 2, w + px * 4, h + px * 4); bc.filter = 'none';
  c.save(); rr(x, y, w, h, 60); c.clip(); c.drawImage(BLR, 0, 0); c.restore();
}
// Alt yazı bandı (stok görüntülerde altı da örter)
function bottomBand(a = 0.85) {
  const g = c.createLinearGradient(0, H * 0.62, 0, H);
  g.addColorStop(0, 'rgba(3,6,18,0)'); g.addColorStop(0.35, `rgba(3,6,18,${a * 0.75})`); g.addColorStop(1, `rgba(3,6,18,${a})`);
  c.fillStyle = g; c.fillRect(0, H * 0.62, W, H * 0.38);
}
// İki satırlık yazı, sahne içi zamanla (pop giriş + çıkış)
function cap(lt, d, a, b, y = 250, s1 = 88, s2 = 124) { hook(lt, a, b, 0.05, d - 0.25, y, s1, s2); }
// Küçük etiket (üstte hap)
function chip(s, y, alpha = 1, col = '#ffcf3f', ink = '#0a1530') {
  if (alpha <= 0) return;
  c.save(); c.globalAlpha *= alpha; c.font = `800 44px ${FONT_H}`;
  const w = c.measureText(s).width + 70;
  c.fillStyle = col; rr(W / 2 - w / 2, y - 38, w, 76, 38); c.fill();
  txt(s, W / 2, y + 2, 44, { color: ink, shadow: 0, skew: 0 });
  c.restore();
}
// Sahne çizelgesi yardımcısı: [ [süre, fn(lt, d, t)], ... ]
function timeline(list) {
  let t0 = 0;
  const L = list.map(([d, f]) => { const o = { t0, d, f }; t0 += d; return o; });
  const f = (t) => { const s = L.find((x) => t < x.t0 + x.d) || L[L.length - 1]; s.f(t - s.t0, s.d, t); };
  f.dur = t0;
  return f;
}
function whoosh(lt) { flash(lt, 0, 0.18, 0.6); }

// ============================================================
// 1) DÜNYA ŞAMPİYONASI: "Bütün ülke seni izliyor"
// ============================================================
const TURK = { id: 'TUR', c1: '#e30a17', c2: '#ffffff', short: 'TÜR' };
const vWC = timeline([
  [2.2, (lt, d) => { // kanca: gergin taraftar
    clip('fanA', 66, lt, 1.02 + lt * 0.02); vignette(0.5);
    chip("FİNAL · 120+1'", 150, seg(lt, 0, 0.15));
    hook(lt, 'BÜTÜN ÜLKE', 'SENİ İZLİYOR', 0.0, 2.0, 330, 96, 140);
  }],
  [1.5, (lt) => { // patlama
    clip('fanB', 45, lt, 1.04); blurRect(0, 1380, W, 540, 26); bottomBand(0.8);
    confetti(lt, 0.05, 120, ['#e30a17', '#ffffff', '#ffd84a', '#ffcf3f']);
    flash(lt, 0, 0.3, 0.95);
    const k = E.back(seg(lt, 0.05, 0.4));
    txt('GOOOL!', W / 2, 1560, 210, { grad: GOLD, scale: 0.4 + 0.6 * k, alpha: seg(lt, 0.05, 0.15), stroke: 10, strokeColor: 'rgba(0,0,0,.35)' });
  }],
  [2.0, (lt, d) => { // bayrağa sarılan taraftar
    clip('fanC', 60, lt, 1.03 + lt * 0.015); blurRect(0, 1280, W, 640, 26); bottomBand(0.92);
    hook(lt, 'BU SEFER O GOLÜ', 'SEN ATIYORSUN', 0.05, d - 0.2, 1560, 84, 120);
  }],
  [2.0, (lt, d) => { darkBg(TURK, 'TÜRKİYE', lt); whoosh(lt); phoneShot('wc_pick', lt, d, { sy: 0.15, zoom1: 1.05 }); cap(lt, d, '18 YAŞINDASIN', 'ÜLKENİ SEÇ', 230); }],
  [2.0, (lt, d) => { darkBg(TURK, 'TÜRKİYE', lt + 2); whoosh(lt); phoneShot('wc_scout', lt, d, { sy: 0.35, zoom0: 1.04, zoom1: 1.12 }); cap(lt, d, 'RAKİBİ ANALİZ ET', 'TAKTİĞİ SEN SEÇ', 230); }],
  [1.8, (lt, d) => { darkBg(TURK, 'TÜRKİYE', lt + 4); whoosh(lt); phoneShot('wc_pens', lt, d, { sy: 0.5, zoom0: 1.1, zoom1: 1.22 }); cap(lt, d, 'PENALTILAR', 'SON VURUŞ SENDE', 230); }],
  [1.8, (lt, d) => { darkBg(TURK, 'TÜRKİYE', lt + 6); whoosh(lt); phoneShot('wc_award', lt, d, { sy: 0.45, zoom0: 1.08, zoom1: 1.18 }); cap(lt, d, 'ÖDÜL GECESİ', 'ALTIN YILDIZ SENİN', 230); }],
  [1.5, (lt, d) => { // turnuva kartı
    darkBg(TURK, 'TÜRKİYE', lt + 8); flash(lt, 0, 0.25, 0.9);
    const k = E.back(seg(lt, 0, 0.45));
    c.save(); c.translate(W / 2, 1060); c.scale(0.7 + 0.3 * k, 0.7 + 0.3 * k); c.rotate((1 - k) * -0.08);
    c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 60;
    const im = shot('wc_card'); if (im.complete && im.naturalWidth) { rr(-430, -538, 860, 1075, 36); c.clip(); c.drawImage(im, -430, -538, 860, 1075); }
    c.restore();
    confetti(lt, 0.1, 140, ['#e30a17', '#ffffff', '#ffd84a']);
    txt('DÜNYA ŞAMPİYONU', W / 2, 330, 120, { grad: GOLD, alpha: seg(lt, 0.15, 0.35), scale: 0.8 + 0.2 * E.back(seg(lt, 0.15, 0.5)) });
  }],
  [1.6, (lt, d) => { // 4 turnuva, tek kariyer
    darkBg(TURK, 'TÜRKİYE', lt + 9);
    const years = [2026, 2030, 2034, 2038];
    const n = Math.min(4, 1 + Math.floor(lt / 0.22));
    years.slice(0, n).forEach((y, i) => {
      const k = E.back(seg(lt, i * 0.22, i * 0.22 + 0.3));
      txt(String(y), W / 2, 760 + i * 170, 150, { grad: i === n - 1 ? GOLD : null, color: 'rgba(255,255,255,.85)', scale: 0.6 + 0.4 * k, alpha: k });
    });
    hook(lt, '4 TURNUVA', 'TEK KARİYER', 0.0, d, 360, 100, 140);
  }],
  [3.4, (lt) => endCard(lt, 0, 'DÜNYA ŞAMPİYONASI RÜYASI', 'Ülkeni seç, tarihi sen yaz')],
]);

// ============================================================
// 2) EFSANELERİN İZİNDE: "6 efsane. Sen hangisi olurdun?"
// ============================================================
const LEG = [
  { k: 'mezzi', n: 'KÜÇÜK BÜYÜCÜ', s: '"Boyun çok kısa" dediler', kit: { id: 'ARG', c1: '#75aadb', c2: '#ffffff' }, num: 10 },
  { k: 'ronalda', n: 'MADEİRA FIRTINASI', s: '12 yaşında evden ayrıldı', kit: { id: 'POR', c1: '#c8102e', c2: '#006600' }, num: 7 },
  { k: 'ronaldinyo', n: 'GÜLEN SİHİRBAZ', s: 'Sihri plajda başladı', kit: { id: 'BRA', c1: '#ffdf00', c2: '#009c3b' }, num: 10 },
  { k: 'zidan', n: 'USTA', s: 'Mahalleden dünyanın zirvesine', kit: { id: 'FRA', c1: '#0b2a6f', c2: '#ffffff' }, num: 10 },
  { k: 'nazario', n: 'FENOMEN', s: 'Antrenmana otobüs parası yoktu', kit: { id: 'BRA', c1: '#ffdf00', c2: '#0033a0' }, num: 9 },
  { k: 'mbappo', n: 'KAPLUMBAĞA', s: 'Odası idol posterleriyle doluydu', kit: { id: 'FRA', c1: '#13235b', c2: '#ffffff' }, num: 10 },
];
const NIGHT = { id: 'NGT', c1: '#1b2a55', c2: '#ffffff' };
function legendLineup(lt) {
  darkBg(NIGHT, 'EFSANELER', lt);
  // spot ışıkları
  [[220, -0.25], [860, 0.25]].forEach(([x, a]) => {
    c.save(); c.translate(x, -120); c.rotate(a + Math.sin(lt * 1.3) * 0.05);
    const g = c.createLinearGradient(0, 0, 0, 1900); g.addColorStop(0, 'rgba(255,240,200,.35)'); g.addColorStop(1, 'rgba(255,240,200,0)');
    c.fillStyle = g; c.beginPath(); c.moveTo(-40, 0); c.lineTo(40, 0); c.lineTo(320, 1900); c.lineTo(-320, 1900); c.fill(); c.restore();
  });
  const pos = [[200, 1320], [540, 1290], [880, 1320], [330, 1640], [750, 1640], [540, 1700]];
  LEG.forEach((L, i) => {
    const k = E.back(seg(lt, 0.25 + i * 0.16, 0.55 + i * 0.16));
    if (k <= 0) return;
    const [x, y] = pos[i], h = (i < 3 ? 430 : 470) * (0.6 + 0.4 * k);
    groundShadow(x, y, 90, 0.4);
    c.save(); c.globalAlpha = Math.min(1, k);
    fig(x, y, h, { kit: kitOf(L.kit), number: L.num, look: Sprites.look(11 + i * 7) });
    c.restore();
  });
}
const vLP = timeline([
  [2.9, (lt, d) => { legendLineup(lt); hook(lt, '6 EFSANE.', 'SEN HANGİSİ OLURDUN?', 0.0, d - 0.1, 330, 104, 112); }],
  [1.6, (lt, d) => { clip('trick', 48, lt, 1.05); bottomBand(0.9); flash(lt, 0, 0.2, 0.7); hook(lt, 'HEPSİ BİR', 'TOPLA BAŞLADI', 0.05, d - 0.15, 1560, 86, 120); }],
  ...LEG.map((L, i) => [1.3, (lt, d) => {
    darkBg(Object.assign({ short: L.kit.id }, L.kit), L.n, lt + i);
    whoosh(lt);
    const side = i % 2 ? 1 : -1, ink = E.out(seg(lt, 0, 0.3));
    phoneShot('lp_' + L.k, lt, d, { sy: 0.32, zoom0: 1.12, zoom1: 1.2, ox: side * (1 - ink) * 700, rot: side * (1 - ink) * 0.1, sc: 0.94 });
    chip(`${i + 1} / 6`, 170, seg(lt, 0.05, 0.2));
    txt(L.n, W / 2, 300, 104, { grad: GOLD, alpha: seg(lt, 0.08, 0.22), scale: 0.85 + 0.15 * E.back(seg(lt, 0.08, 0.35)) });
    txt(L.s, W / 2, 400, 52, { font: FONT_B, weight: 700, skew: 0, alpha: seg(lt, 0.2, 0.35), color: '#e6ecff' });
  }]),
  [2.0, (lt, d) => { darkBg(NIGHT, 'EFSANELER', lt); whoosh(lt); phoneShot('lp_menu', lt, d, { sy: 0.3, zoom0: 1.02, zoom1: 1.1 }); cap(lt, d, 'ONUN HAYATINI YAŞA', 'YA DA KENDİ EFSANENİ YAZ', 230, 80, 96); }],
  [3.4, (lt) => endCard(lt, 0, 'EFSANELERİN İZİNDE', 'Sen hangisi olurdun? Yorumlara yaz')],
]);

// ============================================================
// 3) STARPEDIA: "Bu sayfa bir futbolcuya ait. O futbolcu sensin."
// ============================================================
const BLUE = { id: 'BLU', c1: '#1e5bd8', c2: '#ffffff' };
function wikiFull(p, zoom = 1) {
  // tam ekran beyaz ansiklopedi sayfası, yukarıdan aşağı kayar
  const im = shot('st_wiki_full');
  c.fillStyle = '#fff'; c.fillRect(0, 0, W, H);
  if (!im.complete || !im.naturalWidth) return;
  const s = (W / im.naturalWidth) * zoom, dh = im.naturalHeight * s, dw = im.naturalWidth * s;
  c.drawImage(im, (W - dw) / 2, -(dh - H) * p, dw, dh);
}
const vST = timeline([
  [1.5, (lt, d) => { wikiFull(E.io(seg(lt, 0, d)) * 0.08, 1.0); hook(lt, 'BU SAYFA', 'BİR FUTBOLCUYA AİT', 0.0, d - 0.05, 1500, 96, 110); }],
  [1.6, (lt, d) => { wikiFull(0.08 + E.io(seg(lt, 0, d)) * 0.12, 1.0); flash(lt, 0, 0.18, 0.5); hook(lt, 'O FUTBOLCU', 'SENSİN', 0.0, d - 0.1, 1500, 96, 170); }],
  [2.4, (lt, d) => { darkBg(BLUE, 'STARPEDIA', lt); phoneScroll('st_wiki_full', 0.2 + E.io(seg(lt, 0, d)) * 0.62); cap(lt, d, 'KARİYERİN', 'SATIR SATIR YAZILIYOR', 230, 86, 112); }],
  [3.6, (lt, d) => { // belgesel bölümleri
    const i = Math.min(7, Math.floor(lt / 0.45)), l2 = lt - i * 0.45;
    cover(shot('st_doc_' + i), 0, 0, W, H, 1.02 + l2 * 0.06, 0.5);
    flash(l2, 0, 0.12, 0.35);
    chip('KARİYER BELGESELİN', 150, seg(lt, 0, 0.15));
  }],
  [2.0, (lt, d) => { darkBg({ id: 'GLD', c1: '#7a5a12', c2: '#ffffff' }, 'LÜKS', lt); whoosh(lt); phoneShot('st_lux', lt, d, { sy: 0.55, zoom0: 1.05, zoom1: 1.14 }); cap(lt, d, 'SÜPER ARABA, YAT, JET', 'YILDIZ GİBİ YAŞA', 230, 84, 118); }],
  [1.8, (lt, d) => { darkBg(BLUE, 'INSTAGRAM', lt); whoosh(lt); phoneShot('st_ig', lt, d, { sy: 0.62, zoom0: 1.1, zoom1: 1.2 }); cap(lt, d, 'ALTIN ONAY ROZETİ', 'MİLYONLARCA TAKİPÇİ', 230, 84, 110); }],
  [1.6, (lt, d) => { darkBg(BLUE, 'STÜDYO', lt); whoosh(lt); phoneShot('st_studio', lt, d, { sy: 0.3, zoom0: 1.04, zoom1: 1.1 }); cap(lt, d, 'SAÇ, SAKAL, KRAMPON', 'TARZINI SEN SEÇ', 230, 84, 118); }],
  [3.4, (lt) => endCard(lt, 0, 'YILDIZ GİBİ YAŞA', 'Starpedia sayfanı ücretsiz bir kez dene')],
]);

Object.assign(VIDEOS, { wc: { dur: vWC.dur, f: vWC }, efsane: { dur: vLP.dur, f: vLP }, starpedia: { dur: vST.dur, f: vST } });
// Tüm görselleri önceden yükle
window.preload = () => {
  const names = ['wc_pick', 'wc_scout', 'wc_pens', 'wc_award', 'wc_card', 'lp_menu', 'st_wiki_full', 'st_lux', 'st_ig', 'st_studio']
    .concat(LEG.map((L) => 'lp_' + L.k)).concat([0, 1, 2, 3, 4, 5, 6, 7].map((i) => 'st_doc_' + i));
  const list = names.map(shot);
  [['fanA', 66], ['fanB', 45], ['fanC', 60], ['trick', 48]].forEach(([k, n]) => { for (let i = 0; i < n; i++) list.push(frameOf(k, i, n)); });
  return Promise.all(list.map((i) => (i.complete && i.naturalWidth ? 1 : new Promise((r) => { i.onload = r; i.onerror = r; }))));
};
