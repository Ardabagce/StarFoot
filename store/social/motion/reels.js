// Instagram Reels (organik): profil linkine yönlendiren 3 video, İngilizce ve Türkçe.
// ads.js + us.js yardımcılarını kullanır. Render: PAGE=reels.html node render.js <id> <klasör>
let RTR = false;
const T = (en, tr) => (RTR ? tr : en);
const RED = { id: 'RED1', c1: '#dc2626', c2: '#f8fafc', short: 'SFC' };

// Kapanış: "Link profilde" (yukarıyı gösteren zıplayan ok)
function endBio(t, t0, tag) {
  const k = seg(t, t0, t0 + 0.4);
  if (k <= 0) return;
  c.save(); c.globalAlpha = E.out(k);
  const g = c.createRadialGradient(W / 2, H * 0.4, 60, W / 2, H * 0.45, H * 0.8);
  g.addColorStop(0, '#1d3f95'); g.addColorStop(0.45, '#0d1f4f'); g.addColorStop(1, '#030714');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  confetti(t, t0 - 0.3, 60, ['#ffd84a', '#ffffff', '#ffb02e', '#7fb2ff']);
  const dt = t - t0;
  // ok ve yazı (en üstte, profile işaret eder)
  const ak = seg(t, t0 + 0.15, t0 + 0.5), bob = Math.sin(dt * 7) * 22;
  c.save(); c.globalAlpha *= ak; c.translate(W / 2, 330 + bob);
  c.fillStyle = '#ffcf3f'; c.beginPath(); c.moveTo(0, -120); c.lineTo(95, -10); c.lineTo(35, -10); c.lineTo(35, 90); c.lineTo(-35, 90); c.lineTo(-35, -10); c.lineTo(-95, -10); c.closePath();
  c.shadowColor = 'rgba(255,207,63,.6)'; c.shadowBlur = 50; c.fill(); c.restore();
  txt(T('LINK IN BIO', 'LİNK PROFİLDE'), W / 2, 540, 150, { grad: GOLD, alpha: ak, scale: 0.8 + 0.2 * E.back(ak) });
  const is = 280 * E.back(seg(t, t0 + 0.3, t0 + 0.8));
  if (icon.complete && is > 1) {
    c.save(); c.shadowColor = 'rgba(255,207,63,.45)'; c.shadowBlur = 70;
    rr(W / 2 - is / 2, 900 - is / 2, is, is, is * 0.22); c.clip();
    c.drawImage(icon, W / 2 - is / 2, 900 - is / 2, is, is); c.restore();
  }
  const lk = seg(t, t0 + 0.5, t0 + 0.85);
  txt('STAR', W / 2 - 130, 1170, 140, { alpha: lk });
  txt('FOOT', W / 2 + 130, 1170, 140, { alpha: lk, color: '#ffcf3f' });
  const tk = seg(t, t0 + 0.7, t0 + 1.05);
  txt(tag, W / 2, 1320, 74, { alpha: tk });
  txt(T('Free on iPhone & Android', 'iPhone ve Android\'de ücretsiz'), W / 2, 1410, 46, { alpha: tk, font: FONT_B, weight: 600, skew: 0, color: '#cdd7f4' });
  c.restore();
}
function numBadge(n, x, y, s, k) {
  if (k <= 0) return;
  c.save(); c.translate(x, y); c.scale(E.back(k), E.back(k));
  c.fillStyle = '#ffcf3f'; c.beginPath(); c.arc(0, 0, s, 0, Math.PI * 2); c.fill();
  txt(String(n), 0, 6, s * 1.3, { color: '#0a1530', shadow: 0, skew: 0 });
  c.restore();
}

// ============================================================
// R1: "Sen olsan ne yapardın?" İki teklif, oylama, iki sonuç
// ============================================================
function vChoice(t) {
  const END = 9.0;
  // bölünmüş ekran: sol = sadık kal, sağ = dev transfer
  const half = (side, fn) => { c.save(); c.beginPath(); c.rect(side ? W / 2 : 0, 0, W / 2, H); c.clip(); fn(side ? W / 2 : 0); c.restore(); };
  const reveal = t > 5.0;
  half(0, (x0) => {
    c.save(); c.translate(x0 - W / 4, 0);
    drawBg(bgStadium(RED, false, 31), 1.05 + t * 0.01);
    if (reveal) { flashes(t, 5, 0.1, 0.4, 8); }
    const lift = reveal ? E.out(seg(t, 5.1, 5.6)) : 0;
    fig(W / 2, 1640 - lift * 20, 900, { kit: kitOf(RED), number: 10, dive: reveal ? 1 : 0 });
    if (reveal) { SocialArt.trophyCup(c, W / 2, 1640 - 900 * 1.22 - lift * 60, 140); confetti(t, 5.1, 60, ['#dc2626', '#ffffff', '#ffd84a']); }
    c.restore();
  });
  half(1, (x0) => {
    c.save(); c.translate(x0 - W / 4, 0);
    drawBg(bgBackdrop(RMG, RMG.label), 1.05 + t * 0.01);
    flashes(t, 6, 0.1, 0.6, 10);
    const lift = reveal ? E.out(seg(t, 5.6, 6.1)) : 0;
    fig(W / 2, 1640 - lift * 20, 900, { kit: kitOf(RMG), number: 10, dive: reveal ? 1 : 0 });
    if (reveal && t > 5.6) goldBall(W / 2, 1640 - 900 * 1.2 - lift * 60, 90 * E.back(seg(t, 5.6, 6.0)), t * 1.4);
    c.restore();
  });
  // orta çizgi ve VS
  c.fillStyle = 'rgba(255,255,255,.9)'; c.fillRect(W / 2 - 4, 0, 8, H);
  const vk = E.back(seg(t, 0.5, 0.9));
  if (vk > 0 && t < END) { c.save(); c.translate(W / 2, 1060); c.scale(vk, vk); c.fillStyle = '#0a1530'; c.beginPath(); c.arc(0, 0, 80, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#ffcf3f'; c.lineWidth = 8; c.stroke(); txt('VS', 0, 6, 70, { color: '#ffcf3f', shadow: 0 }); c.restore(); }
  vignette(0.45);
  // seçenek kartları
  const opt = [[T('STAY LOYAL', 'SADIK KAL'), T('Boyhood club · captain', 'Çocukluk kulübün · kaptan')], [T('€120M MOVE', '€120M TRANSFER'), T('Giant club · big stage', 'Dev kulüp · büyük sahne')]];
  opt.forEach(([a, b], i) => {
    const k = E.back(seg(t, 0.35 + i * 0.15, 0.7 + i * 0.15));
    if (k <= 0 || t > END) return;
    const x = i ? W * 0.75 : W * 0.25;
    c.save(); c.translate(x, 1330); c.scale(k, k);
    c.fillStyle = 'rgba(5,9,24,.88)'; rr(-250, -95, 500, 190, 30); c.fill();
    c.strokeStyle = '#ffcf3f'; c.lineWidth = 5; rr(-250, -95, 500, 190, 30); c.stroke();
    numBadge(i + 1, 0, -95, 46, 1);
    txt(a, 0, 5, 62, { shadow: 0, maxW: 470 });
    txt(b, 0, 62, 32, { shadow: 0, font: FONT_B, weight: 600, skew: 0, color: '#cdd7f4', maxW: 470 });
    c.restore();
  });
  // oylama çubukları
  if (t > 1.6 && t < 5.0) {
    const vk2 = E.io(seg(t, 1.8, 3.6)), a = Math.round(47 * vk2), b = Math.round(53 * vk2);
    const al = seg(t, 1.6, 1.9) * (1 - seg(t, 4.8, 5.0));
    c.save(); c.globalAlpha = al;
    c.fillStyle = 'rgba(5,9,24,.85)'; rr(90, 1530, 900, 150, 30); c.fill();
    c.fillStyle = '#dc2626'; rr(110, 1550, 860 * (a / 100), 110, 20); c.fill();
    c.fillStyle = '#1d4ed8'; rr(110 + 860 * (a / 100), 1550, 860 * (b / 100), 110, 20); c.fill();
    txt(`1 · ${a}%`, 150, 1606, 56, { align: 'left', shadow: 0 });
    txt(`${b}% · 2`, 930, 1606, 56, { align: 'right', shadow: 0 });
    c.restore();
    for (let i = 0; i < 6; i++) tapRing(t, 200 + hash(i) * 680, 1250 + hash(i + 3) * 200, 1.9 + i * 0.4, 0.5);
    txt(T('COMMENT 1 OR 2', 'YORUMA 1 YA DA 2 YAZ'), W / 2, 1790, 74, { grad: GOLD, alpha: al * (0.75 + 0.25 * Math.sin(t * 8)) });
  }
  // kanca
  hook(t, T('AGE 21. TWO OFFERS.', '21 YAŞ. İKİ TEKLİF.'), T('WHAT WOULD YOU DO?', 'SEN OLSAN NE YAPARDIN?'), 0.05, 4.6, 300, 84, 120);
  if (reveal && t < END) {
    flash(t, 5.0, 0.3, 0.7);
    caption(t, T('IN STARFOOT, YOU DECIDE', "STARFOOT'TA KARAR SENİN"), 5.2, END - 0.1, 300, 88, T('Every choice changes your story', 'Her seçim hikâyeni değiştirir'));
  }
  endBio(t, END, T('YOUR CAREER, YOUR CHOICE', 'KARİYERİN, SEÇİMİN'));
  grain();
}

// ============================================================
// R2: "Bu futbol oyununda yapabileceğin 3 şey"
// ============================================================
function vThings(t) {
  const END = 11.0, S = [1.6, 4.7, 7.8];
  let i = -1; S.forEach((a, k) => { if (t >= a) i = k; });
  const lt = i >= 0 ? t - S[i] : t;
  if (i <= 0) {
    // kanca arka planı ve 1: kaleci
    drawBg(bgStadium(US_A, false, 41), 1.06 + t * 0.02);
    flashes(t, 6, 0.1, 0.5, 9);
    if (i === 0) {
      const dk = E.out(seg(lt, 0.2, 0.7)), dir = 1;
      groundShadow(560, 1720, 300);
      fig(470 + dk * 70, 1620 - dk * 160, 860, { kit: GK_KITS[0], gk: true, gloves: true, look, dive: 1, armA: 1.4 }, dk * 0.7 * dir);
      const bp = seg(lt, 0.15, 0.7);
      Sprites.ball(c, lerp(-80, 760, bp), lerp(1100, 860, bp), 60, t * 20, BALL_STYLES.classic);
      if (lt > 0.75) { const sk = seg(lt, 0.75, 1.0); txt(T('SAVED!', 'KURTARDIN!'), W / 2, 1450, 170, { grad: GOLD, alpha: sk, scale: 0.6 + 0.4 * E.back(sk), stroke: 10 }); }
    } else {
      fig(540, 1700, 820, { kit: kitOf(US_A), number: 10, look });
    }
  } else if (i === 1) {
    // 2: kötü maçı geri al (geri sarma efekti)
    drawBg(bgStadium(US_B, false, 43), 1.05);
    vignette(0.6);
    const rw = seg(lt, 0.9, 2.0), score = rw < 0.5 ? '0 - 3' : rw < 0.8 ? '0 - 1' : '0 - 0';
    c.save(); c.translate(W / 2, 980);
    c.fillStyle = 'rgba(5,9,24,.9)'; rr(-330, -150, 660, 300, 40); c.fill();
    txt(score, 0, -20, 170, { color: rw >= 1 ? '#7cf0a0' : rw > 0 ? '#ffcf3f' : '#ff6b6b', shadow: 0 });
    txt(rw >= 1 ? T('PLAY IT AGAIN', 'YENİDEN OYNA') : T('BAD LOSS', 'KÖTÜ YENİLGİ'), 0, 100, 52, { shadow: 0, font: FONT_B, weight: 700, skew: 0 });
    c.restore();
    if (rw > 0 && rw < 1) {
      // VHS çizgileri ve ⏪
      for (let k = 0; k < 14; k++) { const y = (hash(k + Math.floor(t * 20)) * H); c.fillStyle = `rgba(255,255,255,${0.05 + hash(k) * 0.12})`; c.fillRect(0, y, W, 4 + hash(k + 9) * 14); }
      c.save(); c.translate(W / 2, 1380); c.fillStyle = '#fff';
      [-70, 30].forEach((ox) => { c.beginPath(); c.moveTo(ox + 70, -60); c.lineTo(ox, 0); c.lineTo(ox + 70, 60); c.closePath(); c.fill(); });
      c.restore();
    }
    if (rw >= 1) confetti(t, S[1] + 2.0, 60, ['#7cf0a0', '#ffffff', '#ffd84a']);
  } else {
    // 3: kendi futbol evrenini kur (editör)
    c.fillStyle = '#0b1230'; c.fillRect(0, 0, W, H);
    SocialArt.glow(c, W * 0.8, H * 0.25, 500, 'rgba(80,160,255,.3)');
    SocialArt.glow(c, W * 0.2, H * 0.75, 500, 'rgba(255,207,63,.22)');
    const cols = ['#dc2626', '#1d4ed8', '#16a34a', '#7c3aed', '#f59e0b'], ci = Math.min(4, Math.floor(lt / 0.45));
    const club = T('LIONS FC', 'ASLANLAR SK'), pl = T('YOUR NAME', 'SENİN ADIN');
    const tk = (s, a) => s.slice(0, Math.round(s.length * seg(lt, a, a + 0.8)));
    c.save(); c.translate(W / 2, 1000);
    c.fillStyle = 'rgba(255,255,255,.08)'; rr(-420, -330, 840, 660, 40); c.fill(); c.strokeStyle = 'rgba(255,255,255,.2)'; c.lineWidth = 3; rr(-420, -330, 840, 660, 40); c.stroke();
    txt(T('CLUB NAME', 'KULÜP ADI'), -380, -260, 36, { align: 'left', font: FONT_B, weight: 700, skew: 0, shadow: 0, color: '#9fb0d8' });
    c.fillStyle = 'rgba(0,0,0,.35)'; rr(-380, -225, 760, 100, 20); c.fill();
    txt(tk(club, 0.1) + (Math.sin(t * 12) > 0 ? '|' : ''), -350, -172, 64, { align: 'left', shadow: 0, skew: 0 });
    txt(T('KIT', 'FORMA'), -380, -70, 36, { align: 'left', font: FONT_B, weight: 700, skew: 0, shadow: 0, color: '#9fb0d8' });
    cols.forEach((col, k) => { c.fillStyle = col; c.beginPath(); c.arc(-330 + k * 120, 0, 44, 0, Math.PI * 2); c.fill(); if (k === ci) { c.strokeStyle = '#fff'; c.lineWidth = 8; c.stroke(); } });
    txt(T('PLAYER', 'OYUNCU'), -380, 110, 36, { align: 'left', font: FONT_B, weight: 700, skew: 0, shadow: 0, color: '#9fb0d8' });
    c.fillStyle = 'rgba(0,0,0,.35)'; rr(-380, 145, 760, 100, 20); c.fill();
    txt(tk(pl, 1.0), -350, 198, 64, { align: 'left', shadow: 0, skew: 0 });
    c.restore();
    const kit = { shirt: cols[ci], alt: '#ffffff', pattern: 'plain', shorts: '#ffffff', socks: cols[ci] };
    fig(W / 2, 1860, 520, { kit, number: 10, look, dive: lt > 1.8 ? 1 : 0 });
  }
  vignette(0.4);
  // başlıklar
  const TT = [T('PLAY AS THE GOALKEEPER', 'KALECİ OLARAK OYNA'), T('UNDO A BAD MATCH', 'KÖTÜ MAÇI GERİ AL'), T('BUILD YOUR OWN UNIVERSE', 'KENDİ EVRENİNİ KUR')];
  if (i >= 0 && t < END) {
    const k = seg(lt, 0, 0.3);
    numBadge(i + 1, W / 2, 230, 70, k);
    txt(TT[i], W / 2, 400, 104, { alpha: k, scale: 0.8 + 0.2 * E.back(k), maxW: W - 100 });
    if (lt < 0.25) flash(t, S[i], 0.25, 0.6);
  }
  hook(t, T('3 THINGS YOU CAN DO', 'BU FUTBOL OYUNUNDA'), T('IN THIS SOCCER GAME', 'YAPABİLECEĞİN 3 ŞEY'), 0.05, 1.45, 300, 92, 112);
  endBio(t, END, T('ALL IN ONE GAME', 'HEPSİ TEK OYUNDA'));
  grain();
}

// ============================================================
// R3: "15 sezon sonra..." Starpedia tarzı kariyer sayfası, sayılar yükselir
// ============================================================
function vStats(t) {
  const END = 10.0;
  c.fillStyle = '#050509'; c.fillRect(0, 0, W, H);
  drawBg(bgStadium(RMG, false, 47), 1.1 + t * 0.015);
  c.fillStyle = 'rgba(5,7,18,.55)'; c.fillRect(0, 0, W, H);
  flashes(t, 5, 0.05, 0.35, 7);
  // sayfa kartı
  const pk = E.out(seg(t, 1.2, 1.7)), sc = t > 1.2 ? 0.92 + 0.08 * pk : 0;
  if (sc > 0 && t < END) {
    c.save(); c.globalAlpha = pk; c.translate(W / 2, 1060); c.scale(sc, sc);
    c.fillStyle = '#f4f1ea'; rr(-450, -700, 900, 1360, 34); c.fill();
    c.fillStyle = '#1b1f2b';
    txt('STARPEDIA', -400, -630, 40, { align: 'left', color: '#8a7d5c', shadow: 0, skew: 0, ls: 4 });
    txt(T('Alex Star', 'Emre Yıldız'), -400, -545, 88, { align: 'left', color: '#14161d', shadow: 0, skew: 0, font: FONT_B, weight: 700 });
    txt(T('Striker · Royal City · Legend', 'Forvet · Royal City · Efsane'), -400, -470, 36, { align: 'left', color: '#5b5f6b', shadow: 0, skew: 0, font: FONT_B, weight: 500 });
    c.fillStyle = '#d8d2c2'; c.fillRect(-400, -430, 800, 4);
    // portre
    c.save(); rr(160, -410, 240, 300, 18); c.clip(); c.fillStyle = '#1b2440'; c.fillRect(160, -410, 240, 300);
    Sprites.figure(c, 280, 230, 560, { kit: kitOf(RMG), look, facing: 'down', noShadow: true, t: 0, number: 10 }); c.restore();
    // satırlar
    const rows = [[T('Goals', 'Gol'), 612, ''], [T('Assists', 'Asist'), 248, ''], [T('Trophies', 'Kupa'), 27, ''], [T('Golden Balls', 'Altın Top'), 5, ''], [T('Market value', 'Piyasa değeri'), 180, 'M €'], [T('Followers', 'Takipçi'), 48, 'M']];
    rows.forEach(([l, v, u], k) => {
      const a = 1.9 + k * 0.7, rk = seg(t, a, a + 0.6);
      if (rk <= 0) return;
      const y = -60 + k * 112;
      c.globalAlpha = pk * seg(t, a, a + 0.15);
      txt(l, -400, y, 48, { align: 'left', color: '#3a3f4c', shadow: 0, skew: 0, font: FONT_B, weight: 600 });
      const val = Math.round(v * E.out(rk));
      txt(val.toLocaleString('en-US') + (u ? ' ' + u : ''), 400, y, 66, { align: 'right', color: rk < 1 ? '#c8860a' : '#14161d', shadow: 0, skew: 0, scale: rk < 1 ? 1.04 : 1 });
      c.fillStyle = '#e4dfd2'; c.fillRect(-400, y + 46, 800, 2);
    });
    c.globalAlpha = pk;
    // EFSANE damgası
    const st = seg(t, 6.4, 6.7);
    if (st > 0) {
      c.save(); c.translate(170, 615); c.rotate(-0.12); c.scale(1.6 - 0.6 * E.out(st), 1.6 - 0.6 * E.out(st)); c.globalAlpha = pk * st;
      c.strokeStyle = '#c8102e'; c.lineWidth = 12; rr(-240, -70, 480, 140, 20); c.stroke();
      txt(T('LEGEND', 'EFSANE'), 0, 6, 100, { color: '#c8102e', shadow: 0, skew: 0 }); c.restore();
    }
    c.restore();
  }
  flash(t, 6.4, 0.2, 0.5);
  vignette(0.45);
  hook(t, T('MY PLAYER', 'OYUNCUM'), T('15 SEASONS LATER...', '15 SEZON SONRA...'), 0.05, 1.3, 860, 96, 140);
  if (t > 7.1 && t < END) caption(t, T('CAN YOU BEAT IT?', 'SEN GEÇEBİLİR MİSİN?'), 7.1, END - 0.1, 260, 116);
  endBio(t, END, T('WRITE YOUR LEGEND', 'EFSANENİ YAZ'));
  grain();
}

const rv = (f, tr) => usWrap((t) => { RTR = tr; try { f(t); } finally { RTR = false; } });
Object.assign(VIDEOS, {
  reel_choice_en: { dur: 12.0, f: rv(vChoice, false) }, reel_choice_tr: { dur: 12.0, f: rv(vChoice, true) },
  reel_things_en: { dur: 14.0, f: rv(vThings, false) }, reel_things_tr: { dur: 14.0, f: rv(vThings, true) },
  reel_stats_en: { dur: 13.0, f: rv(vStats, false) }, reel_stats_tr: { dur: 13.0, f: rv(vStats, true) },
});
