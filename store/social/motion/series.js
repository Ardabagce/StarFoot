// Hikâye serisi: "Bir Futbolcunun Hikâyesi" — 8 yaşındaki bir çocuğun yükselişi (oyunun gerçek ekranlarıyla).
// Yapı (viral video anatomisi): ilk 3 sn kanca → her sahne "AMA / BU YÜZDEN" ile yeni bir tepe →
// ~12. sn'de paylaşım çağrısı → sonda "Bölüm 2'de…" merak kancası.
// Render: cd store/social/motion && PAGE=series.html ASSETS=$PWD/assets8 node render_any.js all ../series
// Ses: node sfx_series.js ../series

// Üstte seri rozeti: "BİR FUTBOLCUNUN HİKÂYESİ · BÖLÜM n"
function badge(n, lt) {
  const k = E.out(seg(lt, 0, 0.3));
  c.save(); c.globalAlpha = k; c.translate(W / 2, 120);
  c.font = `800 38px ${FONT_H}`;
  const s = `BİR FUTBOLCUNUN HİKÂYESİ · BÖLÜM ${n}`;
  const w = c.measureText(s).width + 70;
  c.fillStyle = 'rgba(8,12,28,.82)'; rr(-w / 2, -36, w, 72, 36); c.fill();
  c.strokeStyle = 'rgba(255,207,63,.6)'; c.lineWidth = 3; c.stroke();
  txt(s, 0, 2, 38, { color: '#ffcf3f', shadow: 0, skew: 0 });
  c.restore();
}
// Bağlaç etiketi: AMA (kırmızı) / BU YÜZDEN (yeşil) — her sahnenin başında "yeni tepe"
function beat(lt, word) {
  const k = E.back(seg(lt, 0.02, 0.3));
  if (k <= 0) return;
  const col = word === 'AMA' ? '#ff3b30' : word === 'BU YÜZDEN' ? '#46e08f' : '#ffcf3f';
  c.save(); c.translate(W / 2, 330); c.scale(0.7 + 0.3 * k, 0.7 + 0.3 * k); c.globalAlpha = Math.min(1, k);
  c.font = `900 64px ${FONT_H}`;
  const w = c.measureText(word).width + 80;
  c.fillStyle = col; rr(-w / 2, -48, w, 96, 20); c.fill();
  txt(word, 0, 4, 64, { color: word === 'AMA' ? '#fff' : '#0a1530', shadow: 0 });
  c.restore();
}
// Paylaşım çağrısı (alt şerit, nabız gibi)
function share(lt, text) {
  const k = E.out(seg(lt, 0.1, 0.45));
  if (k <= 0) return;
  c.save(); c.globalAlpha = k; c.translate(W / 2, 1700 + (1 - k) * 60);
  const pulse = 1 + 0.025 * Math.sin(lt * 7);
  c.scale(pulse, pulse);
  c.font = `800 44px ${FONT_B}`;
  const w = Math.min(W - 70, c.measureText(text).width + 150);
  c.fillStyle = '#ffffff'; rr(-w / 2, -60, w, 120, 60); c.fill();
  txt('📤', -w / 2 + 62, 2, 52, { shadow: 0, skew: 0 });
  txt(text, 34, 2, 44, { color: '#0a1530', shadow: 0, skew: 0, font: FONT_B, weight: 800, maxW: w - 120 });
  c.restore();
}
// Telefon içinde oyun ekranı + kısa yazı
function epShot(name, lt, d, top, bottom, o = {}) {
  darkBg(o.bg || BLUE, o.tag || 'STARFOOT', lt);
  phoneShot(name, lt, d, { sy: o.sy || 0, zoom0: 1.0, zoom1: o.z || 1.07, sc: o.sc || 0.92 });
  if (top) hook(lt, top, bottom, 0.12, d - 0.05, o.y || 1560, o.s1 || 80, o.s2 || 104);
}
// Bölüm sonu: merak kancası + mini kapanış
function cliff(lt, d, next) {
  const g = c.createRadialGradient(W / 2, H * 0.4, 60, W / 2, H * 0.45, H * 0.8);
  g.addColorStop(0, '#1d3f95'); g.addColorStop(0.45, '#0d1f4f'); g.addColorStop(1, '#030714');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const k = seg(lt, 0.05, 0.4);
  txt('DEVAMI', W / 2, 640, 90, { alpha: k });
  txt(next, W / 2, 760, 112, { alpha: k, grad: GOLD, maxW: W - 120 });
  txt('TAKİPTE KAL', W / 2, 900, 64, { alpha: seg(lt, 0.4, 0.7), color: '#cdd7f4', weight: 800 });
  const ik = E.back(seg(lt, 0.7, 1.1)), is = 200 * ik;
  if (icon.complete && is > 1) { c.save(); rr(W / 2 - is / 2, 1120 - is / 2, is, is, is * 0.22); c.clip(); c.drawImage(icon, W / 2 - is / 2, 1120 - is / 2, is, is); c.restore(); }
  const bk = seg(lt, 1.0, 1.3);
  if (bk > 0) {
    c.save(); c.globalAlpha = bk; c.translate(W / 2, 1340);
    c.fillStyle = '#ffcf3f'; rr(-360, -58, 720, 116, 58); c.fill();
    txt("STARFOOT · APP STORE'DA ÜCRETSİZ", 0, 4, 46, { color: '#0a1530', shadow: 0, skew: 0 });
    c.restore();
  }
}

// ============================================================
// BÖLÜM 1: Sokak — "8 yaşında kumda oynuyordu"
// ============================================================
const ep1 = timeline([
  // 0–2.6: kanca (söz: 10 yıl sonra dünya yıldızı)
  [2.6, (lt, d) => { full('e_street_mg', 1.06 + lt * 0.03, 0.5, 0.75); c.fillStyle = 'rgba(3,6,18,.45)'; c.fillRect(0, 0, W, H); vignette(0.75); badge(1, lt); hook(lt, '8 YAŞINDA KUMDA OYNUYORDU', '10 YIL SONRA DÜNYA YILDIZI', 0.05, d - 0.05, 900, 76, 104); }],
  // AMA kimse tanımıyordu
  [2.1, (lt, d) => { cut(lt); epShot('e_street_hub', lt, d, 'MAHALLE MAÇLARINDA', 'KİMSE ONU TANIMIYORDU', { sy: 0.1 }); badge(1, 1); beat(lt, 'AMA'); }],
  // AMA bir gün kenarda bir scout
  [2.1, (lt, d) => { cut(lt); epShot('e_welcome', lt, d, 'BİR GÜN KENARDA', 'BİR SCOUT BELİRDİ', { sy: 0.2 }); badge(1, 1); beat(lt, 'AMA'); }],
  // BU YÜZDEN hayatının maçı: serbest vuruş
  [2.5, (lt, d) => { cut(lt); full('e_street_mg', 1.02 + lt * 0.05, 0.5, 0.5); c.fillStyle = 'rgba(3,6,18,.25)'; c.fillRect(0, 0, W, H); badge(1, 1); beat(lt, 'BU YÜZDEN'); hook(lt, 'HAYATININ MAÇI', 'SON VURUŞ ONDA', 0.15, d - 0.05, 1480, 80, 112); }],
  // scout raporu + paylaşım çağrısı (~10–12 sn)
  [2.5, (lt, d) => { cut(lt); flash(lt, 0, 0.2, 0.7, '255,207,63'); epShot('e_scout', lt, d, 'REYTİNG 8.6', '3 KULÜP ONU İSTİYOR', { bg: GOLDP, tag: 'SCOUT', sy: 0.2 }); badge(1, 1); share(lt, 'Bunu küçükken futbolcu olmak isteyen arkadaşına gönder'); }],
  // AMA aynı hafta sınav
  [2.2, (lt, d) => { cut(lt); epShot('e_exam', lt, d, 'AYNI HAFTA', 'OKULDA SINAV VARDI', { bg: RED, tag: 'OKUL', sy: 0.35 }); badge(1, 1); beat(lt, 'AMA'); share(lt + 2.5, 'Bunu küçükken futbolcu olmak isteyen arkadaşına gönder'); }],
  // ikilem: okul mu antrenman mı? (soru = yorum)
  [3.0, (lt, d) => {
    cut(lt); epShot('dilemma', lt, d, null, null, { bg: BLUE, tag: 'SEÇİM', sy: 0.35, z: 1.12 });
    badge(1, 1);
    c.fillStyle = `rgba(3,6,18,${0.25 * seg(lt, 0.3, 0.8)})`; c.fillRect(0, 0, W, H);
    hook(lt, 'OKUL MU, ANTRENMAN MI?', 'SEN OLSAN NE SEÇERDİN?', 0.1, d - 0.05, 1560, 80, 96);
  }],
  // merak kancası
  [3.0, (lt, d) => cliff(lt, d, 'BÖLÜM 2’DE')],
]);

// ============================================================
// BÖLÜM 2: Seçim — antrenmanı seçti, altyapıda ilk maç (taslak; Bölüm 1 verisine göre yön verilecek)
// ============================================================
const ep2 = timeline([
  // kanca: Bölüm 1'deki sorunun cevabı
  [2.6, (lt, d) => { full('dilemma', 1.08 + lt * 0.03, 0.5, 0.45); c.fillStyle = 'rgba(3,6,18,.55)'; c.fillRect(0, 0, W, H); vignette(0.75); badge(2, lt); hook(lt, 'OKULU DEĞİL', 'ANTRENMANI SEÇTİ', 0.05, d - 0.05, 900, 84, 116); }],
  // BU YÜZDEN ilk 11
  [2.3, (lt, d) => { cut(lt); epShot('e_kid_match', lt, d, 'U10 TAKIMINDA', 'İLK 11’DE BAŞLADI', { sy: 0.1 }); badge(2, 1); beat(lt, 'BU YÜZDEN'); }],
  // AMA sınav
  [2.3, (lt, d) => { cut(lt); epShot('e_exam', lt, d, 'AYNI HAFTA SINAVA', 'HAZIRLIKSIZ GİRDİ', { bg: RED, tag: 'OKUL', sy: 0.35 }); badge(2, 1); beat(lt, 'AMA'); }],
  // AMA maçta penaltı (paylaşım çağrısı)
  [3.0, (lt, d) => { cut(lt); full('e_kid_mg', 1.03 + lt * 0.05, 0.5, 0.55); badge(2, 1); beat(lt, 'AMA'); liveBadge(lt + 1, "33' · 1-1 · YAĞMUR"); hook(lt, '33. DAKİKA', 'PENALTI ONUN', 0.25, d - 0.05, 1440, 84, 120); share(lt - 0.6, 'Bunu penaltıda eli ayağı titreyen arkadaşına gönder'); }],
  // vuruştan hemen önce kes
  [2.4, (lt, d) => {
    cut(lt); full('e_kid_mg', 1.18 + lt * 0.08, 0.5, 0.62);
    c.fillStyle = `rgba(3,6,18,${0.2 + 0.3 * seg(lt, 0.4, 1.2)})`; c.fillRect(0, 0, W, H);
    badge(2, 1);
    hook(lt, '9 YAŞINDA, YAĞMUR ALTINDA', 'ATABİLECEK Mİ?', 0.1, d - 0.05, 1440, 74, 120);
    share(lt + 3, 'Bunu penaltıda eli ayağı titreyen arkadaşına gönder');
  }],
  [3.0, (lt, d) => cliff(lt, d, 'BÖLÜM 3’TE')],
]);

// ============================================================
// BÖLÜM 3: Penaltı — gol, AMA karne… (Bölüm 2 verisine göre devam edecek)
// ============================================================
const ep3 = timeline([
  [2.4, (lt, d) => { full('e_kid_mg', 1.1 + lt * 0.02, 0.5, 0.62); c.fillStyle = 'rgba(3,6,18,.5)'; c.fillRect(0, 0, W, H); badge(3, lt); hook(lt, 'PENALTI…', 'VE', 0.05, d - 0.05, 900, 96, 150); }],
  [2.6, (lt, d) => { full('e_kid_mg2', 1.02 + lt * 0.05, 0.5, 0.4); flash(lt, 0, 0.25, 0.9, '255,207,63'); confetti(lt, 0, 110, ['#ffd84a', '#ffffff', '#c8102e']); badge(3, 1); hook(lt, '9 YAŞINDA', 'İLK GOLÜ!', 0.1, d - 0.05, 1560, 84, 150); }],
  [2.4, (lt, d) => { cut(lt); epShot('kid_hub', lt, d, 'HOCA ONU', 'SEÇİLMİŞLER GRUBUNA ALDI', { sy: 0.45 }); badge(3, 1); beat(lt, 'BU YÜZDEN'); share(lt, 'Bunu ilk golünü hâlâ anlatan arkadaşına gönder'); }],
  [2.6, (lt, d) => { cut(lt); epShot('e_exam', lt, d, 'AMA SINAV SONUCU', 'EVE GELDİ…', { bg: RED, tag: 'OKUL', sy: 0.35 }); badge(3, 1); beat(lt, 'AMA'); share(lt + 2.4, 'Bunu ilk golünü hâlâ anlatan arkadaşına gönder'); }],
  [3.0, (lt, d) => cliff(lt, d, 'BÖLÜM 4’TE')],
]);

Object.keys(VIDEOS).forEach((k) => delete VIDEOS[k]);
Object.assign(VIDEOS, {
  hikaye_b1: { dur: ep1.dur, f: ep1 },
  hikaye_b2: { dur: ep2.dur, f: ep2 },
  hikaye_b3: { dur: ep3.dur, f: ep3 },
});
window.preload = () => {
  const list = ['e_street_mg', 'e_street_hub', 'e_welcome', 'e_scout', 'e_exam', 'dilemma', 'kid_hub', 'e_kid_match', 'e_kid_mg', 'e_kid_mg2'].map(shot);
  list.push(icon);
  return Promise.all(list.map((i) => (i.complete && i.naturalWidth ? 1 : new Promise((r) => { i.onload = r; i.onerror = r; }))));
};
