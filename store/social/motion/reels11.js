// Reels 11: iOS + Android, 1.0.24 yenilikleri. Yöntem: ilk 3 sn kanca, her 2 sn'de "AMA / BU YÜZDEN" ile yeni zirve,
// ~12-15. sn'de "bunu ... gönder" paylaşım çağrısı, sonda iki mağaza.
//  r11_oglum : "Oğlum: Ben de senin gibi futbolcu olacağım" (kariyer, çocuklar, yeni nesil)
//  r11_td    : "Yönetim: Bu 11'le küme düşersin" (Teknik Direktör: sürükle-bırak, gelişim planı, oyun tarzı)
//  r11_sen   : "Bu sayfa bir futbolcuya ait... o futbolcu sensin" (Starpedia formatı, kariyerin tamamı)
// Render: cd store/social/motion && PAGE=reels11.html ASSETS=$PWD/assets11 node render_any.js all ../reels11
// Ses: node sfx11.js ../reels11

const cutF = (lt) => flash(lt, 0, 0.12, 0.55);
// Kırmızı alarm yanıp sönmesi (kanca)
function alarm(lt, t0, n = 3) {
  for (let i = 0; i < n; i++) flash(lt, t0 + i * 0.32, 0.2, 0.32, '255,40,60');
}
// Paylaşım çağrısı: kağıt uçaklı büyük balon
function shareAsk(lt, d, a, b, y = 1430) {
  const k = E.back(seg(lt, 0.1, 0.45)), out = 1 - seg(lt, d - 0.2, d);
  if (k <= 0) return;
  c.save(); c.globalAlpha = Math.min(1, seg(lt, 0.1, 0.3)) * out;
  c.translate(W / 2, y); const sc = 0.7 + 0.3 * k + Math.max(0, Math.sin((lt - 0.6) * 6)) * 0.02 * (lt > 0.6); c.scale(sc, sc);
  c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 40; c.shadowOffsetY = 12;
  c.fillStyle = '#ffffff'; rr(-470, -150, 940, 300, 70); c.fill(); c.shadowBlur = 0; c.shadowOffsetY = 0;
  // kağıt uçak
  c.save(); c.translate(-350, 0); c.rotate(-0.25 + Math.sin(lt * 4) * 0.05);
  c.fillStyle = '#1e5bd8'; c.beginPath(); c.moveTo(-58, -6); c.lineTo(62, -48); c.lineTo(18, 56); c.lineTo(4, 12); c.closePath(); c.fill();
  c.fillStyle = '#7fb2ff'; c.beginPath(); c.moveTo(4, 12); c.lineTo(62, -48); c.lineTo(-4, 30); c.closePath(); c.fill();
  c.restore();
  txt(a, 60, -52, 58, { color: '#0a1530', shadow: 0, skew: -0.06, maxW: 700 });
  txt(b, 60, 40, 76, { color: '#c8102e', shadow: 0, skew: -0.08, maxW: 700 });
  c.restore();
}
// Sürükleme ipucu: el/parmak halkası A noktasından B'ye
function dragHint(lt, x0, y0, x1, y1, t0, t1) {
  const k = E.io(seg(lt, t0, t1)); if (lt < t0 - 0.1 || lt > t1 + 0.4) return;
  const x = lerp(x0, x1, k), y = lerp(y0, y1, k);
  c.save(); c.globalAlpha = 0.9;
  c.strokeStyle = 'rgba(255,207,63,.9)'; c.lineWidth = 8; c.setLineDash([18, 16]);
  c.beginPath(); c.moveTo(x0, y0); c.lineTo(x, y); c.stroke(); c.setLineDash([]);
  c.fillStyle = 'rgba(255,255,255,.95)'; c.beginPath(); c.arc(x, y, 34, 0, Math.PI * 2); c.fill();
  c.strokeStyle = '#ffcf3f'; c.lineWidth = 8; c.beginPath(); c.arc(x, y, 50 + Math.sin(lt * 10) * 4, 0, Math.PI * 2); c.stroke();
  c.restore();
}
// Telefon içinde odaklı yakın plan (görüntünün belli bölgesi)
function phoneFocus(name, lt, d, sy, z0, z1) {
  phoneFrame((x, y, w, h) => { c.fillStyle = '#0a1530'; c.fillRect(x, y, w, h); cover(shot(name), x, y, w, h, lerp(z0, z1, E.io(seg(lt, 0, d))), sy); });
}
// Alt köşede "App Store · Google Play" rozeti (her sahnede: iki mağazada da var)
function stores(lt) {
  c.save(); c.globalAlpha = 0.92 * seg(lt, 0, 0.2);
  c.fillStyle = 'rgba(8,12,28,.82)'; rr(W / 2 - 300, H - 132, 600, 72, 36); c.fill();
  txt('App Store  ·  Google Play', W / 2, H - 95, 38, { color: '#cdd7f4', shadow: 0, skew: 0, weight: 700, font: FONT_B });
  c.restore();
}
// Kapanış: link profilde + iki mağaza
function endBoth(lt, tag) { endBio4(lt, tag); }

// ======================= 1) OĞLUM =======================
const vOglum = timeline([
  // KANCA (0-2.9): oğlunun cümlesi, ekranın üstünde oyundaki bildirim
  [2.9, (lt, d) => {
    full('k_dream', 1.0 + lt * 0.03, 0.5, 0.0);
    c.fillStyle = 'rgba(3,6,18,.25)'; c.fillRect(0, 0, W, H);
    hook(lt, 'OĞLUM: "BEN DE SENİN GİBİ', 'FUTBOLCU OLACAĞIM"', 0.0, d - 0.1, 1420, 82, 120);
    chip('BU OYUNDA 30 YILIMI ALDI', 1700, seg(lt, 1.1, 1.4));
  }],
  [1.7, (lt, d) => { cutF(lt); scene('kid_hub', '', '30 YIL ÖNCE', 'MAHALLEDE BAŞLADIM', lt, d, { sy: 0.1 }); stores(lt); }],
  [1.8, (lt, d) => { cutF(lt); full('moment17', 1.05 + lt * 0.05, 0.5, 0.55); hook(lt, 'AMA SCOUT İZLİYORDU', 'KRİTİK ANI BEN OYNADIM', 0.0, d - 0.05, 1450, 80, 108); }],
  [1.6, (lt, d) => { cutF(lt); scene('offers', '', 'BU YÜZDEN', 'DEV KULÜPLER BENİ İSTEDİ', lt, d, { bg: RED, tag: 'TRANSFER', sy: 0.2 }); stores(lt); }],
  [1.6, (lt, d) => { cutF(lt); scene('ceremony', '', 'KUPALARI', 'TOPLADIM', lt, d, { bg: GOLDP, tag: 'ŞAMPİYON', sy: 0.15 }); confetti(lt, 0.15, 60, ['#ffd84a', '#ffffff']); }],
  [2.1, (lt, d) => { cutF(lt); darkBg(BLUE, 'AİLE', lt); phoneFocus('k_baby', lt, d, 0.12, 1.25, 1.32); cap(lt, d, 'AMA EN GÜZEL GOLÜM', 'OĞLUMUN DOĞUMUYDU', 230, 80, 112); chip('İSMİNİ SEN SEÇİYORSUN', 1760, seg(lt, 0.5, 0.8)); }],
  [2.6, (lt, d) => { cutF(lt); darkBg(BLUE, 'AİLE', lt); phoneFocus('k_card', lt, d, 0.12, 1.2, 1.28); cap(lt, d, 'TOP OYNADIK, MAÇIMA GELDİ', 'BAĞIMIZ HER HAFTA BÜYÜDÜ', 230, 70, 100); shareAsk(lt, d, 'BUNU FUTBOL DELİSİ', 'BABANA GÖNDER', 1520); }],
  [2.2, (lt, d) => { cutF(lt); darkBg(GOLDP, 'YENİ NESİL', lt); phoneFocus('k_retire', lt, d, 0.5, 1.0, 1.05); cap(lt, d, 'BU YÜZDEN EMEKLİ OLUNCA', 'OĞLUMLA DEVAM ETTİM', 230, 76, 108); stores(lt); }],
  [3.6, (lt) => endBoth(lt, 'HİKÂYENİ SEN YAZ')],
]);

// ======================= 2) TEKNİK DİREKTÖR =======================
const vTD = timeline([
  // KANCA: yönetimin uyarısı, kırmızı alarm
  [2.9, (lt, d) => {
    darkBg(RED, 'TEKNİK DİREKTÖR', lt); phoneFocus('t_lineup', lt, d, 0.2, 1.05, 1.1);
    alarm(lt, 0.0, 3);
    hook(lt, 'YÖNETİM: "BU 11\'LE', 'KÜME DÜŞERSİN!"', 0.0, d - 0.1, 1450, 90, 132);
  }],
  [2.0, (lt, d) => { cutF(lt); darkBg(BLUE, 'YEDEKLER', lt); phoneFocus('t_lineup_full', lt, d, 0.62, 1.0, 1.06); cap(lt, d, 'AMA YEDEKTE', '17 YAŞINDA BİR ÇOCUK VAR', 230, 84, 108); stores(lt); }],
  [2.3, (lt, d) => {
    cutF(lt); darkBg(BLUE, 'SÜRÜKLE-BIRAK', lt); phoneFocus('t_drag', lt, d, 0.25, 1.15, 1.2);
    cap(lt, d, 'SÜRÜKLE, BIRAK:', 'İLK 11\'DE!', 230, 90, 140);
    dragHint(lt, 330, 1450, 330, 860, 0.2, 1.3);
  }],
  [2.1, (lt, d) => { cutF(lt); darkBg(GOLDP, 'GELİŞİM PLANI', lt); phoneFocus('t_plan2', lt, d, 0.55, 1.12, 1.2); cap(lt, d, 'BU YÜZDEN ONA', 'ÖZEL GELİŞİM PLANI', 230, 86, 116); }],
  [2.1, (lt, d) => { cutF(lt); darkBg(BLUE, 'OYUN TARZI', lt); phoneFocus('t_news', lt, d, 0.45, 1.15, 1.22); cap(lt, d, '8 HAFTA SONRA', 'YENİ OYUN TARZINI ÖĞRENDİ', 230, 86, 104); stores(lt); }],
  [2.5, (lt, d) => { cutF(lt); darkBg(BLUE, 'TAKTİK', lt); phoneFocus('t_after', lt, d, 0.3, 1.1, 1.16); cap(lt, d, 'SENİN 11\'İN,', 'SENİN TAKTİĞİN', 230, 86, 124); shareAsk(lt, d, 'BUNU TAKTİK DEHASI', 'ARKADAŞINA GÖNDER', 1520); }],
  [1.8, (lt, d) => { cutF(lt); scene('ceremony', '', 'VE KÜME DÜŞMEK YERİNE', 'ŞAMPİYONLUK!', lt, d, { bg: GOLDP, tag: 'ŞAMPİYON', sy: 0.15 }); confetti(lt, 0.1, 80, ['#ffd84a', '#ffffff']); }],
  [3.6, (lt) => endBoth(lt, 'TAKIMIN BAŞINA GEÇ')],
]);

// ======================= 3) O FUTBOLCU SENSİN =======================
const vSen = timeline([
  [1.6, (lt, d) => { full('wiki', 1.22 + lt * 0.04, 0.35, 0.3); hook(lt, 'BU SAYFA', 'BİR FUTBOLCUYA AİT', 0.0, d - 0.05, 1480, 96, 116); }],
  [1.5, (lt, d) => { full('wiki', 1.45 + lt * 0.06, 0.3, 0.35); flash(lt, 0, 0.18, 0.5); hook(lt, 'O FUTBOLCU', 'SENSİN', 0.0, d - 0.1, 1480, 96, 170); }],
  [1.7, (lt, d) => { cutF(lt); scene('kid_hub', '', '8 YAŞINDA', 'MAHALLEDE BAŞLADIN', lt, d, { sy: 0.1 }); stores(lt); }],
  [1.8, (lt, d) => { cutF(lt); scene('e_scout', '', 'AMA BİR SCOUT', 'SENİ İZLİYORDU', lt, d, { sy: 0.2 }); }],
  [1.7, (lt, d) => { cutF(lt); full('moment17', 1.05 + lt * 0.05, 0.5, 0.55); hook(lt, 'BU YÜZDEN', 'HER ŞUTU SEN ÇEKTİN', 0.0, d - 0.05, 1450, 88, 120); }],
  [1.8, (lt, d) => { cutF(lt); full('gstar', 1.04 + lt * 0.03, 0.5, 0.4); hook(lt, 'DÜNYANIN EN İYİSİ', 'ALTIN YILDIZ SENİN', 0.0, d - 0.05, 1480, 84, 116); confetti(lt, 0.1, 70, ['#ffd84a', '#ffffff']); }],
  [2.5, (lt, d) => { cutF(lt); darkBg(BLUE, 'AİLE', lt); phoneFocus('k_dream', lt, d, 0.08, 1.2, 1.26); cap(lt, d, 'OĞLUN DA', 'SENİN GİBİ OLMAK İSTİYOR', 230, 86, 104); shareAsk(lt, d, 'FUTBOLCU OLAMAYAN O', 'ARKADAŞINA GÖNDER', 1520); }],
  [2.0, (lt, d) => { cutF(lt); darkBg(GOLDP, 'YENİ NESİL', lt); phoneFocus('k_retire', lt, d, 0.5, 1.0, 1.05); cap(lt, d, 'VE HİKÂYEN', 'OĞLUNLA DEVAM EDİYOR', 230, 86, 108); stores(lt); }],
  [3.6, (lt) => endBoth(lt, 'KARİYERİNİ SEN YAZ')],
]);

Object.keys(VIDEOS).forEach((k) => delete VIDEOS[k]);
Object.assign(VIDEOS, {
  r11_oglum: { dur: vOglum.dur, f: vOglum },
  r11_td: { dur: vTD.dur, f: vTD },
  r11_sen: { dur: vSen.dur, f: vSen },
});
window.preload = () => {
  const list = ['k_dream', 'k_baby', 'k_card', 'k_retire', 'kid_hub', 'moment17', 'offers', 'ceremony', 't_lineup', 't_lineup_full', 't_drag', 't_plan2', 't_news', 't_after', 'wiki', 'e_scout', 'gstar'].map(shot);
  list.push(icon);
  return Promise.all(list.map((i) => (i.complete && i.naturalWidth ? 1 : new Promise((r) => { i.onload = r; i.onerror = r; }))));
};
