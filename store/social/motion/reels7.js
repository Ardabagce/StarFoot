// Reels 7: gerçek çekim (Mixkit, Free License) + oyunun gerçek penaltı kaydı + oyun ekranları.
// Kalıp aynı: gizemli cümle → "O FUTBOLCU SENSİN" → oyundan görüntüler → "LİNK PROFİLDE".
// Görseller: node prep7.js <klipler> <oyun kareleri> <assets7>  (fr/<sahne>/0001.jpg…, shots/*.jpg)
// Render: cd store/social/motion && PAGE=reels7.html ASSETS=<assets7> COVER=75 node render_any.js r7_penalti ../reels7
// Ses: node sfx7.js ../reels7

const FR = { pen1: 69, pen2: 65, stad: 66, kid1: 64, kid2: 65, sun: 65, game: 195 };
const frImg = (name, k) => { const n = Math.max(1, Math.min(FR[name], k)); const src = `${A}/fr/${name}/${String(n).padStart(4, '0')}.jpg`; if (!IMG[src]) { const i = new Image(); i.src = src; IMG[src] = i; } return IMG[src]; };
// Gerçek çekim arka planı: yavaş yakınlaşma + alt karartma (yazı okunaklı olsun)
function footage(name, lt, z0 = 1.02, z1 = 1.1, d = 2, from = 1, dark = 0) {
  const im = frImg(name, from + Math.floor(lt * 30));
  c.fillStyle = '#05070f'; c.fillRect(0, 0, W, H);
  if (im.complete && im.naturalWidth) drawBg(im, lerp(z0, z1, cl(lt / d)));
  if (dark) { c.fillStyle = `rgba(3,6,18,${dark})`; c.fillRect(0, 0, W, H); }
  const g = c.createLinearGradient(0, H * 0.5, 0, H);
  g.addColorStop(0, 'rgba(3,6,18,0)'); g.addColorStop(1, 'rgba(3,6,18,.78)');
  c.fillStyle = g; c.fillRect(0, H * 0.5, W, H * 0.5);
  const g2 = c.createLinearGradient(0, 0, 0, H * 0.22);
  g2.addColorStop(0, 'rgba(3,6,18,.55)'); g2.addColorStop(1, 'rgba(3,6,18,0)');
  c.fillStyle = g2; c.fillRect(0, 0, W, H * 0.22);
}
// Telefonun içinde oyunun gerçek kaydı
function phoneGame(lt, from = 1, sc = 1, speed = 1) {
  const im = frImg('game', from + Math.floor(lt * 30 * speed));
  phoneFrame((x, y, w, h) => { c.fillStyle = '#0a1530'; c.fillRect(x, y, w, h); cover(im, x, y, w, h, 1, 0.5); }, sc, 0, 0, 0);
}
// Tam ekran oyun kaydı
function fullGame(lt, from, z = 1.04, speed = 1) {
  const im = frImg('game', from + Math.floor(lt * 30 * speed));
  c.fillStyle = '#0a1530'; c.fillRect(0, 0, W, H);
  cover(im, 0, 0, W, H, z + lt * 0.012, 0.5);
  const g = c.createLinearGradient(0, H * 0.62, 0, H);
  g.addColorStop(0, 'rgba(3,6,18,0)'); g.addColorStop(1, 'rgba(3,6,18,.8)');
  c.fillStyle = g; c.fillRect(0, H * 0.62, W, H * 0.38);
}
// Skor tabelası etiketi: "CANLI · 90+3'"
function liveTag(lt, label) {
  const k = E.out(seg(lt, 0.05, 0.35));
  if (k <= 0) return;
  c.save(); c.globalAlpha = k; c.translate(W / 2, 250 - (1 - k) * 40);
  c.font = `800 46px ${FONT_H}`;
  const w = c.measureText(label).width + 150;
  c.fillStyle = 'rgba(8,12,28,.82)'; rr(-w / 2, -44, w, 88, 18); c.fill();
  c.fillStyle = '#ff3b30'; c.globalAlpha = k * (0.55 + 0.45 * Math.sin(lt * 9)); c.beginPath(); c.arc(-w / 2 + 44, 0, 13, 0, Math.PI * 2); c.fill();
  c.globalAlpha = k; txt(label, 26, 3, 46, { shadow: 0, skew: 0 });
  c.restore();
}
// İkinci yarı arka planı: çekim karesi koyulaştırılmış (telefon sahneleri)
function backdrop(name, k, lt) { footage(name, lt, 1.25, 1.32, 3, k, 0.62); vignette(0.7); }

const LOW = 1470; // yazıların dikey konumu (alt üçte bir)

// 1) PENALTI: "Skor 0-0, penaltı. Topun başında bir futbolcu var… O futbolcu sensin"
const vPenalti = timeline([
  [1.9, (lt, d) => { footage('pen1', lt, 1.02, 1.1, d); liveTag(lt, 'CANLI · 0-0'); hook(lt, 'SKOR 0-0', 'PENALTI!', 0.1, d - 0.05, LOW, 100, 170); }],
  [1.8, (lt, d) => { footage('pen2', lt, 1.02, 1.09, d); whoosh(lt); liveTag(lt, 'CANLI · 0-0'); hook(lt, 'TOPUN BAŞINDA', 'BİR FUTBOLCU VAR', 0.05, d - 0.05, LOW, 96, 116); }],
  [1.7, (lt, d) => { footage('stad', lt, 1.0, 1.16, d); flash(lt, 0, 0.22, 0.85); hook(lt, 'O FUTBOLCU', 'SENSİN', 0.0, d - 0.1, LOW, 100, 190); }],
  [4.5, (lt, d) => {
    backdrop('stad', 40, lt); whoosh(lt);
    const goal = lt >= 2.25; // oyun kaydında top ağlara ~68. karede gidiyor
    phoneGame(lt, 1, goal ? 1 + 0.03 * Math.max(0, 1 - (lt - 2.25) * 3) : 1);
    if (!goal) cap(lt, 2.3, 'ŞİMDİ', 'SEN VUR', 230, 92, 150);
    else { flash(lt, 2.25, 0.25, 0.8); confetti(lt, 2.25, 150, ['#ffd84a', '#ffffff', '#ffb02e', '#46e08f']); hook(lt, 'VE', 'GOOOL!', 2.3, d - 0.1, 230, 80, 190); }
  }],
  [2.0, (lt, d) => { fullGame(lt, 150, 1.04, 0.75); whoosh(lt); hook(lt, 'TRİBÜNLER', 'SENİN ADINI HAYKIRSIN', 0.05, d - 0.1, LOW + 60, 92, 104); }],
  [3.4, (lt) => endBio4(lt, 'PENALTIYI SEN KULLAN')],
]);

// 2) ÇOCUK: "Bu çocuk bir gün dünya yıldızı olacak… O çocuk sensin"
const vCocuk = timeline([
  [1.9, (lt, d) => { footage('kid1', lt, 1.02, 1.1, d); hook(lt, 'BU ÇOCUK BİR GÜN', 'DÜNYA YILDIZI OLACAK', 0.1, d - 0.05, LOW, 96, 108); }],
  [1.7, (lt, d) => { footage('kid2', lt, 1.0, 1.12, d); flash(lt, 0, 0.22, 0.85); hook(lt, 'O ÇOCUK', 'SENSİN', 0.0, d - 0.1, LOW, 100, 190); }],
  [2.4, (lt, d) => { backdrop('sun', 30, lt); whoosh(lt); phoneGame(lt, 1); cap(lt, d, 'SAHAYA ÇIK', 'GOLÜNÜ AT', 230, 88, 140); }],
  [2.1, (lt, d) => { darkBg(RED, 'TRANSFER', lt); whoosh(lt); phoneShot('offers', lt, d, { sy: 0.2, zoom0: 1.0, zoom1: 1.06 }); cap(lt, d, 'DEV KULÜPLER', 'SENİ İSTESİN', 230, 88, 128); }],
  [2.1, (lt, d) => { darkBg(GOLDP, 'ŞAMPİYON', lt); whoosh(lt); confetti(lt, 0.2, 70, ['#ffd84a', '#ffffff', '#ffb02e']); phoneShot('ceremony', lt, d, { sy: 0.15, zoom0: 1.0, zoom1: 1.06 }); cap(lt, d, 'KUPALARI', 'SEN KALDIR', 230, 88, 140); }],
  [2.1, (lt, d) => { darkBg(BLUE, 'STARPEDIA', lt); whoosh(lt); phoneShot('wiki', lt, d, { sy: 0.1, zoom0: 1.0, zoom1: 1.06 }); cap(lt, d, 'ADIN', 'TARİHE YAZILSIN', 230, 88, 124); }],
  [3.4, (lt) => endBio4(lt, 'HAYALİNİ SEN YAZ')],
]);

// 3) STADYUM: "Bu stadyum bir ismi haykırıyor… O isim senin"
const vStadyum = timeline([
  [1.9, (lt, d) => { footage('stad', lt, 1.0, 1.12, d); hook(lt, 'BU STADYUM', 'BİR İSMİ HAYKIRIYOR', 0.1, d - 0.05, LOW, 100, 112); }],
  [1.7, (lt, d) => { footage('pen1', lt, 1.0, 1.12, d, 14); flash(lt, 0, 0.22, 0.85); hook(lt, 'O İSİM', 'SENİN', 0.0, d - 0.1, LOW, 100, 200); }],
  [2.2, (lt, d) => { fullGame(lt, 148, 1.04, 0.72); whoosh(lt); confetti(lt, 0.1, 80, ['#ffd84a', '#ffffff', '#ffb02e']); hook(lt, 'GOLÜNÜ AT', 'TRİBÜNLER YIKILSIN', 0.05, d - 0.1, LOW + 60, 92, 112); }],
  [2.1, (lt, d) => { darkBg(BLUE, 'STARFEED', lt); whoosh(lt); phoneShot('starfeed', lt, d, { sy: 0.1, zoom0: 1.0, zoom1: 1.06 }); cap(lt, d, 'MİLYONLAR', 'SENİ TAKİP ETSİN', 230, 88, 120); }],
  [2.1, (lt, d) => { darkBg(GOLDP, 'DEĞER', lt); whoosh(lt); phoneShot('mv_val', lt, d, { sy: 0.3, zoom0: 1.0, zoom1: 1.08 }); cap(lt, d, 'DEĞERİN', 'HER MAÇ KATLANSIN', 230, 88, 116); }],
  [2.1, (lt, d) => { darkBg(GOLDP, 'ŞAMPİYON', lt); whoosh(lt); phoneShot('cabinet', lt, d, { sy: 0.3, zoom0: 1.0, zoom1: 1.06 }); cap(lt, d, 'VİTRİNİN', 'KUPALARLA DOLSUN', 230, 88, 116); }],
  [3.4, (lt) => endBio4(lt, 'TRİBÜNLER SENİ BEKLİYOR')],
]);

Object.assign(VIDEOS, {
  r7_penalti: { dur: vPenalti.dur, f: vPenalti },
  r7_cocuk: { dur: vCocuk.dur, f: vCocuk },
  r7_stadyum: { dur: vStadyum.dur, f: vStadyum },
});
['r4_deger', 'r4_roportaj', 'r4_profil'].forEach((k) => delete VIDEOS[k]);
window.preload = () => {
  const list = ['ceremony', 'cabinet', 'offers', 'wiki', 'starfeed', 'mv_val'].map(shot);
  Object.entries(FR).forEach(([n, cnt]) => { for (let k = 1; k <= cnt; k++) list.push(frImg(n, k)); });
  list.push(icon);
  return Promise.all(list.map((i) => (i.complete && i.naturalWidth ? 1 : new Promise((r) => { i.onload = r; i.onerror = r; }))));
};
