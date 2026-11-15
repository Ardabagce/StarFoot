// Reels 9: "StarFoot artık Android'de" duyurusu (Instagram/TikTok, 9:16, ~13 sn).
// Render: cd store/social/motion && PAGE=reels9.html ASSETS=$PWD/assets8 node render_any.js all ../reels9
// Ses: node sfx9.js ../reels9

const PLAY_COLS = ['#00d7fe', '#00f076', '#ffc900', '#ff3a44'];
// Google Play üçgeni (dört renkli, sade çizim)
function playLogo(x, y, s, a = 1) {
  c.save(); c.translate(x, y); c.scale(s / 100, s / 100); c.globalAlpha *= a;
  const tri = (pts, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach((p) => c.lineTo(p[0], p[1])); c.closePath(); c.fill(); };
  tri([[-46, -54], [14, 0], [-46, 54]], PLAY_COLS[0]);
  tri([[-46, -54], [30, -16], [14, 0]], PLAY_COLS[1]);
  tri([[14, 0], [30, -16], [54, -2], [54, 2], [30, 16]], PLAY_COLS[2]);
  tri([[-46, 54], [14, 0], [30, 16]], PLAY_COLS[3]);
  c.restore();
}

// 1) Giriş: Play logosu patlar, "ANDROID'DE YAYINDA!"
function intro(lt, d) {
  const g = c.createRadialGradient(W / 2, 760, 40, W / 2, 900, H * 0.8);
  g.addColorStop(0, '#16367f'); g.addColorStop(0.5, '#0b1a44'); g.addColorStop(1, '#02060f');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // dönen ışık halkası
  const rk = seg(lt, 0.15, 0.7);
  c.save(); c.translate(W / 2, 760); c.rotate(lt * 0.9);
  for (let i = 0; i < 4; i++) {
    c.strokeStyle = PLAY_COLS[i]; c.globalAlpha = 0.55 * rk; c.lineWidth = 16; c.lineCap = 'round';
    c.beginPath(); c.arc(0, 0, 260 + 30 * Math.sin(lt * 3 + i), i * Math.PI / 2, i * Math.PI / 2 + Math.PI / 3); c.stroke();
  }
  c.restore();
  const k = E.back(seg(lt, 0.1, 0.55));
  if (k > 0) {
    c.save(); c.shadowColor = 'rgba(0,240,118,.6)'; c.shadowBlur = 70;
    playLogo(W / 2 + 10, 760, 330 * k); c.restore();
  }
  flash(lt, 0.45, 0.18, 0.6, '255,255,255');
  confetti(lt, 0.5, 90, PLAY_COLS.concat(['#ffffff', '#ffd84a']));
  hook(lt, "ANDROID'DE", 'YAYINDA!', 0.55, d - 0.05, 1240, 110, 170);
  chip('STARFOOT', 1720, seg(lt, 0.9, 1.2));
}

// Oyunun gerçek ekranı, telefonda
function scene(name, label, top, bottom, lt, d, o = {}) {
  darkBg(o.bg || BLUE, o.tag || 'STARFOOT', lt);
  phoneShot(name, lt, d, { sy: o.sy || 0, zoom0: 1.0, zoom1: o.z || 1.07, sc: o.sc || 1 });
  if (top) cap(lt, d, top, bottom, o.y || 230, o.s1 || 84, o.s2 || 118);
  if (label) chip(label, 1858, seg(lt, 0.05, 0.25));
}
const cut = (lt) => flash(lt, 0, 0.12, 0.55);
// köşede küçük Android rozeti
function droid(lt) {
  c.save(); c.globalAlpha = 0.95; c.fillStyle = 'rgba(8,12,28,.85)'; rr(W - 330, 60, 280, 74, 37); c.fill();
  playLogo(W - 290, 97, 44);
  txt('ANDROID', W - 175, 98, 40, { color: '#00f076', shadow: 0, skew: 0 }); c.restore();
}

// Ücretsiz / internetsiz / abonelik yok
function perks(lt, d) {
  darkBg(BLUE, 'STARFOOT', lt);
  const items = [['ÜCRETSİZ', '#00f076'], ['İNTERNETSİZ', '#00d7fe'], ['ENERJİ BEKLEMEK YOK', '#ffc900'], ['ABONELİK YOK', '#ff6b72']];
  items.forEach(([s, col], i) => {
    const k = E.back(seg(lt, 0.1 + i * 0.22, 0.45 + i * 0.22));
    if (k <= 0) return;
    const y = 720 + i * 190;
    c.save(); c.translate(W / 2, y); c.scale(0.7 + 0.3 * k, 0.7 + 0.3 * k); c.globalAlpha = Math.min(1, k);
    c.fillStyle = 'rgba(255,255,255,.08)'; rr(-430, -78, 860, 156, 40); c.fill();
    c.fillStyle = col; c.beginPath(); c.arc(-350, 0, 34, 0, Math.PI * 2); c.fill();
    txt('✓', -350, 6, 54, { color: '#0a1530', shadow: 0, skew: 0 });
    txt(s, 40, 6, s.length > 12 ? 64 : 80, { shadow: 0, skew: -0.04 });
    c.restore();
  });
  cap(lt, d, 'TÜM KARİYER', 'CEBİNDE', 230, 84, 128);
}

// Kapanış: ikon, STARFOOT, Google Play rozeti
function endPlay(t, t0) {
  const k = seg(t, t0, t0 + 0.45);
  if (k <= 0) return;
  c.save(); c.globalAlpha = E.out(k);
  const g = c.createRadialGradient(W / 2, H * 0.32, 60, W / 2, H * 0.4, H * 0.8);
  g.addColorStop(0, '#1d3f95'); g.addColorStop(0.45, '#0d1f4f'); g.addColorStop(1, '#030714');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const dt = t - t0;
  confetti(t, t0 - 0.3, 70, PLAY_COLS.concat(['#ffffff']));
  const ip = E.back(seg(t, t0 + 0.1, t0 + 0.6)), is = 330 * ip;
  if (icon.complete && is > 1) {
    c.save(); c.shadowColor = 'rgba(0,240,118,.4)'; c.shadowBlur = 80;
    rr(W / 2 - is / 2, 470 - is / 2, is, is, is * 0.22); c.clip();
    c.drawImage(icon, W / 2 - is / 2, 470 - is / 2, is, is); c.restore();
  }
  const lk = seg(t, t0 + 0.35, t0 + 0.7);
  txt('STAR', W / 2 - 150, 790, 160, { alpha: lk, scale: 0.8 + 0.2 * E.back(lk) });
  txt('FOOT', W / 2 + 150, 790, 160, { alpha: lk, color: '#ffcf3f', scale: 0.8 + 0.2 * E.back(lk) });
  const tk = seg(t, t0 + 0.6, t0 + 0.95);
  txt("ŞİMDİ ANDROID'DE", W / 2, 960, 84, { alpha: tk, scale: 0.85 + 0.15 * E.out(tk) });
  txt('Sokaktan efsaneye, futbol kariyerin', W / 2, 1050, 46, { alpha: tk, weight: 600, font: FONT_B, skew: 0, color: '#cdd7f4' });
  // Google Play rozeti (nabız gibi)
  const bk = seg(t, t0 + 0.85, t0 + 1.2), pulse = 1 + Math.max(0, Math.sin((dt - 1.2) * 5)) * 0.035 * (dt > 1.2);
  if (bk > 0) {
    c.save(); c.globalAlpha *= bk; c.translate(W / 2, 1210); c.scale(pulse * (0.8 + 0.2 * E.back(bk)), pulse * (0.8 + 0.2 * E.back(bk)));
    c.shadowColor = 'rgba(0,240,118,.4)'; c.shadowBlur = 50;
    c.fillStyle = '#000'; rr(-360, -80, 720, 160, 40); c.fill(); c.shadowBlur = 0;
    c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 3; rr(-360, -80, 720, 160, 40); c.stroke();
    playLogo(-250, 0, 110);
    txt("GOOGLE PLAY'DE", 60, -22, 40, { color: '#cdd7f4', shadow: 0, skew: 0, weight: 700, font: FONT_B });
    txt('ÜCRETSİZ İNDİR', 60, 30, 64, { color: '#fff', shadow: 0, skew: 0 });
    c.restore();
  }
  const ak = seg(t, t0 + 1.3, t0 + 1.7);
  txt('iPhone: App Store', W / 2, 1380, 40, { alpha: ak, weight: 600, font: FONT_B, skew: 0, color: '#8fa0cc' });
  c.restore();
}

const vAndroid = timeline([
  [2.4, (lt, d) => intro(lt, d)],
  [1.4, (lt, d) => { cut(lt); scene('kid_hub', '8 YAŞINDA BAŞLA', 'MAHALLEDEN', 'EFSANEYE', lt, d, { sy: 0.1 }); droid(lt); }],
  [1.5, (lt, d) => { cut(lt); full('moment17', 1.05 + lt * 0.04, 0.5, 0.55); hook(lt, 'KRİTİK ANI', 'SEN OYNA', 0.05, d - 0.05, 1450, 88, 128); droid(lt); }],
  [1.4, (lt, d) => { cut(lt); scene('offers', 'TRANSFER', 'DEV KULÜPLER', 'SENİ İSTİYOR', lt, d, { bg: RED, tag: 'TRANSFER', sy: 0.2 }); droid(lt); }],
  [1.4, (lt, d) => { cut(lt); scene('ceremony', 'ŞAMPİYONLUK', 'KUPAYI', 'KALDIR', lt, d, { bg: GOLDP, tag: 'ŞAMPİYON', sy: 0.15 }); confetti(lt, 0.2, 60, ['#ffd84a', '#ffffff']); droid(lt); }],
  [2.2, (lt, d) => { cut(lt); perks(lt, d); }],
  [3.4, (lt) => endPlay(lt, 0)],
]);

Object.keys(VIDEOS).forEach((k) => delete VIDEOS[k]);
Object.assign(VIDEOS, { a9_android: { dur: vAndroid.dur, f: vAndroid } });
window.preload = () => {
  const list = ['kid_hub', 'moment17', 'offers', 'ceremony'].map(shot);
  list.push(icon);
  return Promise.all(list.map((i) => (i.complete && i.naturalWidth ? 1 : new Promise((r) => { i.onload = r; i.onerror = r; }))));
};
