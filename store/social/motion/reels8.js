// Reels 8: üç reklam kancası (Instagram/TikTok, 9:16, ~16 sn, hızlı kesme).
//  a8_hikaye   : "17 yaşında kimse inanmadı → 4 yıl sonra finaldesin" (drama/merak)
//  a8_hata     : "Kariyerlerin çoğu yanlış kararla biter" → geri sar → doğru seçim (meydan okuma)
//  a8_cevrimdisi: "İnternet yok? Sorun değil" → hızlı oyun montajı (fayda)
// Görseller: assets8/shots (capture8.js + önceki reels ekranları). Tüm sahneler oyunun gerçek ekranları.
// Render: cd store/social/motion && PAGE=reels8.html ASSETS=$PWD/assets8 node render_any.js all ../reels8
// Ses: node sfx8.js ../reels8

// ---------- ortak parçalar ----------
// Oyunun gerçek ekranı, telefonda, hafif yakınlaşma + üstte etiket
function scene(name, label, top, bottom, lt, d, o = {}) {
  darkBg(o.bg || BLUE, o.tag || 'STARFOOT', lt);
  phoneShot(name, lt, d, { sy: o.sy || 0, zoom0: 1.0, zoom1: o.z || 1.07, sc: o.sc || 1 });
  if (o.stamp) stamp(lt, o.stamp, o.stampCol);
  if (top) cap(lt, d, top, bottom, o.y || 230, o.s1 || 84, o.s2 || 118);
  if (label) chip(label, 1858, seg(lt, 0.05, 0.25));
}
// Sahne üstüne "ONAY/RED" damgası
function stamp(lt, s, col = '#ff3b30') {
  const k = E.back(seg(lt, 0.25, 0.5));
  if (k <= 0) return;
  c.save(); c.translate(W / 2, 1050); c.rotate(-0.16); c.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k); c.globalAlpha = Math.min(1, k);
  c.font = `900 120px ${FONT_H}`;
  const w = c.measureText(s).width + 90;
  c.lineWidth = 14; c.strokeStyle = col; rr(-w / 2, -95, w, 190, 26); c.stroke();
  txt(s, 0, 6, 120, { color: col, shadow: 0, skew: 0 });
  c.restore();
}
// Hızlı kesme geçişi
const cut = (lt) => flash(lt, 0, 0.12, 0.55);
// Ekranda "dokunma" halkası
function tap(lt, x, y, t0 = 0.35) { if (typeof tapRing === 'function') tapRing(lt, x, y, t0); }

// Güç sayacı: 64 → 89 (oyunun güç puanı), altın halka
function ovrCount(lt, d) {
  darkBg(GOLDP, 'GÜÇ', lt);
  const k = E.io(seg(lt, 0.1, d - 0.25));
  const v = Math.round(lerp(64, 89, k));
  const r = 300;
  c.save(); c.translate(W / 2, 960);
  c.lineWidth = 34; c.strokeStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.stroke();
  c.strokeStyle = '#ffcf3f'; c.shadowColor = 'rgba(255,207,63,.7)'; c.shadowBlur = 50; c.lineCap = 'round';
  c.beginPath(); c.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (v / 99)); c.stroke(); c.shadowBlur = 0;
  c.restore();
  txt(String(v), W / 2, 930, 300, { grad: GOLD, skew: -0.08 });
  txt('GÜÇ PUANI', W / 2, 1150, 64, { weight: 800 });
  if (v >= 89) flash(lt, d - 0.3, 0.2, 0.5, '255,207,63');
  cap(lt, d, 'GÜCÜN', 'FIRLADI', 230, 84, 128);
}

// ============================================================
// 1) HİKÂYE: 17 yaşında kimse inanmadı… 4 yıl sonra finaldesin
// ============================================================
function moment(lt, d) {
  // Final anı: oyun donar, iki seçenek
  const z = 1.04 + lt * 0.015;
  full('moment17', z, 0.5, 0.55);
  c.fillStyle = `rgba(3,6,18,${0.35 + 0.25 * seg(lt, 0.2, 0.6)})`; c.fillRect(0, 0, W, H);
  // donma efekti: kenar mavi parıltı
  const fk = seg(lt, 0.15, 0.4);
  if (fk > 0) { c.save(); c.globalAlpha = fk * 0.8; c.lineWidth = 26; c.strokeStyle = '#7fb2ff'; c.shadowColor = '#7fb2ff'; c.shadowBlur = 60; c.strokeRect(13, 13, W - 26, H - 26); c.restore(); }
  liveBadge(lt, "FİNAL · 0-0 · 90+2'");
  hook(lt, 'SON DAKİKA', 'TOP SENDE', 0.1, 1.6, 520, 90, 150);
  // iki seçenek kartı
  const ok = seg(lt, 1.5, 1.9);
  if (ok > 0) {
    [['⚽ ŞUTU ÇEK', -1, '#ffcf3f', '#0a1530'], ['🤝 PAS VER', 1, 'rgba(255,255,255,.14)', '#fff']].forEach(([s, side, bg, ink], i) => {
      const kk = E.back(seg(lt, 1.5 + i * 0.12, 1.9 + i * 0.12));
      c.save(); c.globalAlpha = Math.min(1, kk); c.translate(W / 2 + side * 250, 1180); c.scale(0.7 + 0.3 * kk, 0.7 + 0.3 * kk);
      c.fillStyle = bg; rr(-220, -80, 440, 160, 30); c.fill();
      c.lineWidth = 4; c.strokeStyle = 'rgba(255,255,255,.35)'; c.stroke();
      txt(s, 0, 4, 64, { color: ink, shadow: 0, skew: 0 });
      c.restore();
    });
    // nabız gibi atan soru
    const qk = seg(lt, 2.2, 2.6);
    txt('SEN OLSAN NE YAPARDIN?', W / 2, 1420, 76, { alpha: qk, scale: 1 + 0.03 * Math.sin(lt * 9) * qk, grad: GOLD });
  }
}
function liveBadge(lt, label) {
  const k = E.out(seg(lt, 0.05, 0.35));
  if (k <= 0) return;
  c.save(); c.globalAlpha = k; c.translate(W / 2, 250);
  c.font = `800 50px ${FONT_H}`;
  const w = c.measureText(label).width + 150;
  c.fillStyle = 'rgba(8,12,28,.85)'; rr(-w / 2, -46, w, 92, 20); c.fill();
  c.fillStyle = '#ff3b30'; c.globalAlpha = k * (0.55 + 0.45 * Math.sin(lt * 9)); c.beginPath(); c.arc(-w / 2 + 46, 0, 14, 0, Math.PI * 2); c.fill();
  c.globalAlpha = k; txt(label, 26, 3, 50, { shadow: 0, skew: 0 });
  c.restore();
}

const vHikaye = timeline([
  // 0–3 sn: kanca
  [1.5, (lt, d) => { full('kid_hub', 1.06 + lt * 0.03, 0.5, 0.3); c.fillStyle = 'rgba(3,6,18,.62)'; c.fillRect(0, 0, W, H); vignette(0.8); hook(lt, '17 YAŞINDA', 'KİMSE İNANMADI', 0.05, d - 0.05, 900, 104, 132); }],
  [1.5, (lt, d) => { full('match17', 1.05 + lt * 0.03, 0.5, 0.5); c.fillStyle = 'rgba(3,6,18,.5)'; c.fillRect(0, 0, W, H); flash(lt, 0, 0.2, 0.8); hook(lt, '4 YIL SONRA', 'FİNALDESİN', 0.0, d - 0.05, 900, 104, 150); }],
  // 3–9 sn: yükseliş montajı (her sahne ~1 sn)
  [1.1, (lt, d) => { cut(lt); scene('hub17', 'İLK SÖZLEŞME', 'KÜÇÜK KULÜPTE', 'İLK İMZA', lt, d); }],
  [1.1, (lt, d) => { cut(lt); scene('match17', 'HER MAÇ ŞANS', 'GOLLER', 'GELMEYE BAŞLADI', lt, d, { sy: 0.3 }); }],
  [1.6, (lt, d) => { cut(lt); ovrCount(lt, d); }],
  [1.1, (lt, d) => { cut(lt); scene('mv_val', 'PİYASA DEĞERİ', 'DEĞERİN', 'KATLANDI', lt, d, { bg: GOLDP, tag: 'DEĞER', sy: 0.3 }); }],
  [1.1, (lt, d) => { cut(lt); scene('offers', 'TRANSFER', 'DEV KULÜP', 'KAPINDA', lt, d, { bg: RED, tag: 'TRANSFER', sy: 0.2, stamp: 'KABUL', stampCol: '#46e08f' }); }],
  // 9–14 sn: kırılma anı
  [4.6, (lt, d) => { cut(lt); moment(lt, d); }],
  // 14–17 sn: kupa + çağrı
  [1.2, (lt, d) => { full('gstar', 1.04 + lt * 0.04, 0.5, 0.3); flash(lt, 0, 0.25, 0.9, '255,207,63'); confetti(lt, 0, 90, ['#ffd84a', '#ffffff', '#ffb02e']); }],
  [3.2, (lt) => endCard(lt, 0, 'HİKÂYENİ SEN YAZ', "StarFoot'u ücretsiz indir")],
]);

// ============================================================
// 2) HATA: kariyerlerin çoğu yanlış kararla biter → geri sar → doğru seçim
// ============================================================
function warnGraph(lt, d) {
  darkBg(RED, 'UYARI', lt);
  c.fillStyle = `rgba(120,0,10,${0.25 + 0.15 * Math.sin(lt * 10)})`; c.fillRect(0, 0, W, H);
  // düşen form grafiği
  const k = E.io(seg(lt, 0.2, d - 0.4));
  const pts = [[0, 0.25], [0.18, 0.2], [0.34, 0.32], [0.5, 0.45], [0.66, 0.62], [0.82, 0.78], [1, 0.92]];
  const gx = 120, gy = 760, gw = W - 240, gh = 560;
  c.save();
  c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 2;
  for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(gx, gy + (gh * i) / 4); c.lineTo(gx + gw, gy + (gh * i) / 4); c.stroke(); }
  c.beginPath(); c.lineWidth = 16; c.strokeStyle = '#ff3b30'; c.shadowColor = '#ff3b30'; c.shadowBlur = 40; c.lineJoin = 'round';
  let last = null;
  pts.forEach(([x, y], i) => { if (x > k) return; const px = gx + gw * x, py = gy + gh * y; if (!i) c.moveTo(px, py); else c.lineTo(px, py); last = [px, py]; });
  c.stroke(); c.shadowBlur = 0;
  if (last) { c.fillStyle = '#fff'; c.beginPath(); c.arc(last[0], last[1], 18, 0, Math.PI * 2); c.fill(); }
  c.restore();
  txt('⚠', W / 2, 600, 150, { color: '#ff3b30', alpha: 0.6 + 0.4 * Math.sin(lt * 10), skew: 0 });
  hook(lt, 'KARİYERLERİN ÇOĞU', 'YANLIŞ KARARLA BİTER', 0.05, d - 0.05, 1500, 88, 104);
}
// Geri sarma: tarama çizgileri, ◀◀ ve önceki sahnelerin tersten hızlı akışı
function rewind(lt, d) {
  const seq = ['mv_buzz', 'offers', 'hub17', 'kid_hub'];
  const i = Math.min(seq.length - 1, Math.floor((lt / d) * seq.length));
  full(seq[i], 1.1 - (lt % 0.25), 0.5, 0.4);
  c.save(); c.globalCompositeOperation = 'saturation'; c.fillStyle = 'hsl(0,0%,50%)'; c.fillRect(0, 0, W, H); c.restore();
  c.fillStyle = 'rgba(10,20,60,.35)'; c.fillRect(0, 0, W, H);
  for (let y = (lt * 2400) % 24; y < H; y += 24) { c.fillStyle = 'rgba(255,255,255,.07)'; c.fillRect(0, y, W, 3); }
  const off = Math.sin(lt * 80) * 18;
  c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(0, (lt * 3000) % H, W, 40 + off);
  txt('◀◀', W / 2, 900, 260, { alpha: 0.6 + 0.4 * Math.sin(lt * 20), skew: 0 });
  txt('GERİ SAR', W / 2, 1120, 90);
}
const vHata = timeline([
  [2.8, (lt, d) => warnGraph(lt, d)],
  // 3–9 sn: hata zinciri
  [1.9, (lt, d) => { cut(lt); scene('offers', 'HATA 1', 'SADECE PARA İÇİN', 'TRANSFER', lt, d, { bg: RED, tag: 'HATA', sy: 0.2, stamp: 'YANLIŞ' }); }],
  [1.9, (lt, d) => { cut(lt); scene('mv_buzz', 'HATA 2', 'FORMA YOK', 'DEĞERİN ÇAKILDI', lt, d, { bg: RED, tag: 'HATA', sy: 0.3, stamp: '▼ DÜŞÜŞ' }); }],
  [1.9, (lt, d) => { cut(lt); scene('starfeed', 'HATA 3', 'TARAFTAR', 'SIRT ÇEVİRDİ', lt, d, { bg: RED, tag: 'HATA', sy: 0.1, stamp: 'BİTTİ' }); }],
  // 9–14 sn: geri sar ve doğru hamle
  [1.1, (lt, d) => rewind(lt, d)],
  [1.4, (lt, d) => { cut(lt); scene('offers', 'DOĞRU HAMLE', 'BU SEFER', 'AVRUPA HEDEFİ', lt, d, { sy: 0.2, stamp: 'DOĞRU', stampCol: '#46e08f' }); }],
  [1.3, (lt, d) => { cut(lt); scene('hub17', 'DİSİPLİN', 'ANTRENMAN', 'VE SABIR', lt, d, { sy: 0.35 }); }],
  [1.4, (lt, d) => { full('gstar', 1.04 + lt * 0.04, 0.5, 0.3); flash(lt, 0, 0.25, 0.9, '255,207,63'); confetti(lt, 0, 90, ['#ffd84a', '#ffffff', '#ffb02e']); hook(lt, 'VE SONUNDA', 'ALTIN YILDIZ', 0.1, d - 0.05, 1500, 84, 128); }],
  // 14–17 sn: çağrı
  [3.2, (lt) => endCard(lt, 0, 'AYNI HATAYA DÜŞME', 'Kariyerini zirvede bitir')],
]);

// ============================================================
// 3) ÇEVRİMDIŞI: internet yok, sorun değil — hızlı montaj
// ============================================================
// Telefonun kontrol paneli (genel çizim): uçak modu açılır, Wi-Fi kapanır
function airplane(lt, d) {
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1a1f2e'); g.addColorStop(1, '#05070d');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const on = lt > 0.9;
  const tiles = [
    { x: 250, y: 760, ic: '✈', on, col: '#ff9f0a' },
    { x: 540, y: 760, ic: '📶', on: !on, col: '#30d158' },
    { x: 830, y: 760, ic: '◉', on: !on, col: '#0a84ff' },
  ];
  tiles.forEach((t, i) => {
    const k = E.back(seg(lt, 0.05 + i * 0.06, 0.35 + i * 0.06));
    c.save(); c.translate(t.x, t.y); c.scale(k, k);
    c.fillStyle = t.on ? t.col : 'rgba(255,255,255,.14)'; c.beginPath(); c.arc(0, 0, 110, 0, Math.PI * 2); c.fill();
    txt(t.ic, 0, 6, 110, { color: '#fff', shadow: 0, skew: 0, weight: 700 });
    c.restore();
  });
  if (lt > 0.85 && lt < 1.2) tap(lt, 250, 760, 0.85);
  txt(on ? 'UÇAK MODU: AÇIK' : 'UÇAK MODU', W / 2, 1000, 56, { weight: 800, color: on ? '#ff9f0a' : '#cdd7f4', skew: 0 });
  hook(lt, 'İNTERNET YOK?', 'SORUN DEĞİL', 1.0, d - 0.05, 1380, 100, 150);
}
function offline(lt) {
  // köşede küçük "çevrimdışı" rozeti
  c.save(); c.globalAlpha = 0.95; c.fillStyle = 'rgba(8,12,28,.85)'; rr(W - 360, 60, 310, 74, 37); c.fill();
  txt('✈ ÇEVRİMDIŞI', W - 205, 98, 40, { color: '#ff9f0a', shadow: 0, skew: 0 }); c.restore();
}
const vCevrimdisi = timeline([
  [2.6, (lt, d) => airplane(lt, d)],
  // 3–11 sn: hız ve derinlik (her sahne en fazla 1,5 sn)
  [1.4, (lt, d) => { cut(lt); scene('hub17', 'TEK DOKUNUŞ', 'MAÇA ÇIK', 'HEMEN OYNA', lt, d, { sy: 0.2 }); offline(lt); }],
  [1.5, (lt, d) => { cut(lt); full('moment17', 1.05 + lt * 0.04, 0.5, 0.55); hook(lt, 'SON DAKİKA', 'DERBİ GOLÜ', 0.05, d - 0.05, 1450, 88, 128); offline(lt); }],
  [1.4, (lt, d) => { cut(lt); scene('offers', 'PAZARLIK', 'TRANSFER', 'MASASI', lt, d, { bg: RED, tag: 'TRANSFER', sy: 0.2 }); offline(lt); }],
  [1.4, (lt, d) => { cut(lt); scene('starfeed', 'ŞÖHRET', 'SPONSORLAR', 'VE TAKİPÇİLER', lt, d, { sy: 0.1 }); offline(lt); }],
  [1.4, (lt, d) => { cut(lt); scene('ceremony', 'ŞAMPİYONLUK', 'KUPAYI', 'KALDIR', lt, d, { bg: GOLDP, tag: 'ŞAMPİYON', sy: 0.15 }); confetti(lt, 0.2, 60, ['#ffd84a', '#ffffff']); offline(lt); }],
  // 11–15 sn: çağrı
  [3.4, (lt) => endCard(lt, 0, 'ÇEVRİMDIŞI OYNA', 'Metroda, uçakta, molada')],
]);

Object.keys(VIDEOS).forEach((k) => delete VIDEOS[k]);
Object.assign(VIDEOS, {
  a8_hikaye: { dur: vHikaye.dur, f: vHikaye },
  a8_hata: { dur: vHata.dur, f: vHata },
  a8_cevrimdisi: { dur: vCevrimdisi.dur, f: vCevrimdisi },
});
window.preload = () => {
  const list = ['kid_hub', 'hub17', 'match17', 'moment17', 'mv_val', 'mv_buzz', 'offers', 'starfeed', 'ceremony', 'gstar'].map(shot);
  list.push(icon);
  return Promise.all(list.map((i) => (i.complete && i.naturalWidth ? 1 : new Promise((r) => { i.onload = r; i.onerror = r; }))));
};
