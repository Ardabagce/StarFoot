// Google Play (Android) için 3 Reels: ilk 3 saniyede kanca, sonda "Link profilde".
// ads.js + us.js yardımcılarını kullanır. Render: PAGE=play.html node render.js <id|all> <klasör>
let PTR = true;
const P = (tr, en) => (PTR ? tr : en);
const PGREEN = '#3ddc84';

// Kapanış: yukarıyı gösteren ok + "LİNK PROFİLDE" + Google Play'de ücretsiz
function endPlay(t, t0, tag) {
  const k = seg(t, t0, t0 + 0.4);
  if (k <= 0) return;
  c.save(); c.globalAlpha = E.out(k);
  const g = c.createRadialGradient(W / 2, H * 0.4, 60, W / 2, H * 0.45, H * 0.8);
  g.addColorStop(0, '#12406a'); g.addColorStop(0.45, '#0a2140'); g.addColorStop(1, '#030714');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  confetti(t, t0 - 0.3, 60, ['#ffd84a', '#ffffff', PGREEN, '#7fb2ff']);
  const dt = t - t0;
  const ak = seg(t, t0 + 0.15, t0 + 0.5), bob = Math.sin(dt * 7) * 22;
  c.save(); c.globalAlpha *= ak; c.translate(W / 2, 320 + bob);
  c.fillStyle = '#ffcf3f'; c.beginPath(); c.moveTo(0, -120); c.lineTo(95, -10); c.lineTo(35, -10); c.lineTo(35, 90); c.lineTo(-35, 90); c.lineTo(-35, -10); c.lineTo(-95, -10); c.closePath();
  c.shadowColor = 'rgba(255,207,63,.6)'; c.shadowBlur = 50; c.fill(); c.restore();
  txt(P('LİNK PROFİLDE', 'LINK IN BIO'), W / 2, 530, 150, { grad: GOLD, alpha: ak, scale: 0.8 + 0.2 * E.back(ak) });
  const is = 280 * E.back(seg(t, t0 + 0.3, t0 + 0.8));
  if (icon.complete && is > 1) {
    c.save(); c.shadowColor = 'rgba(61,220,132,.45)'; c.shadowBlur = 70;
    rr(W / 2 - is / 2, 880 - is / 2, is, is, is * 0.22); c.clip();
    c.drawImage(icon, W / 2 - is / 2, 880 - is / 2, is, is); c.restore();
  }
  const lk = seg(t, t0 + 0.5, t0 + 0.85);
  txt('STAR', W / 2 - 130, 1150, 140, { alpha: lk });
  txt('FOOT', W / 2 + 130, 1150, 140, { alpha: lk, color: '#ffcf3f' });
  const tk = seg(t, t0 + 0.7, t0 + 1.05);
  txt(tag, W / 2, 1300, 74, { alpha: tk });
  // yeşil hap: Google Play'de ücretsiz (nabız)
  const bk = seg(t, t0 + 0.9, t0 + 1.25), pulse = 1 + Math.max(0, Math.sin((dt - 1.25) * 5)) * 0.04 * (dt > 1.25);
  if (bk > 0) {
    c.save(); c.globalAlpha *= bk; c.translate(W / 2, 1460); const s = pulse * (0.8 + 0.2 * E.back(bk)); c.scale(s, s);
    c.shadowColor = 'rgba(61,220,132,.5)'; c.shadowBlur = 50;
    c.fillStyle = PGREEN; rr(-370, -66, 740, 132, 66); c.fill(); c.shadowBlur = 0;
    txt(P("GOOGLE PLAY'DE ÜCRETSİZ", 'FREE ON GOOGLE PLAY'), 0, 4, 58, { color: '#05261a', shadow: 0, skew: 0 });
    c.restore();
    txt(P('Android · iPhone', 'Android · iPhone'), W / 2, 1585, 42, { alpha: bk, weight: 600, font: FONT_B, skew: 0, color: '#cdd7f4', shadow: 0 });
  }
  c.restore();
}

// Bildirim kartı (telefon ekranında)
function notif(x, y, w, title, body, k) {
  if (k <= 0) return;
  c.save(); c.globalAlpha *= cl(k * 3); c.translate(0, (1 - E.back(k)) * -140);
  c.fillStyle = 'rgba(255,255,255,.2)'; rr(x, y, w, 160, 40); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 2; rr(x, y, w, 160, 40); c.stroke();
  if (icon.complete) { c.save(); rr(x + 26, y + 36, 88, 88, 22); c.clip(); c.drawImage(icon, x + 26, y + 36, 88, 88); c.restore(); }
  txt(title, x + 136, y + 60, 38, { align: 'left', font: FONT_B, weight: 700, skew: 0, shadow: 0 });
  txt(P('şimdi', 'now'), x + w - 30, y + 60, 30, { align: 'right', font: FONT_B, weight: 500, skew: 0, shadow: 0, color: 'rgba(255,255,255,.6)' });
  txt(body, x + 136, y + 110, 34, { align: 'left', font: FONT_B, weight: 500, skew: 0, shadow: 0, color: 'rgba(255,255,255,.92)', maxW: w - 160 });
  c.restore();
}

// ============================================================
// P1: "Android'ciler, bekleyiş bitti" — telefon titrer, bildirim, oyundan 3 sahne
// ============================================================
function vAndroid(t) {
  const END = 9.4, S = [3.0, 5.1, 7.2];
  if (t < S[0]) {
    drawBg(bgStadium(US_A, false, 61), 1.18 + t * 0.01);
    c.fillStyle = 'rgba(2,4,14,.6)'; c.fillRect(0, 0, W, H);
    // titreşim: bildirim anlarında sarsıntı
    let sh = 0;
    [0.5, 1.2].forEach((a) => { const q = seg(t, a, a + 0.3); if (q > 0 && q < 1) sh = Math.sin(q * Math.PI * 10) * (1 - q) * 18; });
    const intro = E.back(seg(t, 0, 0.45));
    phoneFrame((x, y, w, h) => {
      const gr = c.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, '#0d3b2e'); gr.addColorStop(0.55, '#0b1a35'); gr.addColorStop(1, '#1d0f3d');
      c.fillStyle = gr; c.fillRect(x, y, w, h);
      SocialArt.glow(c, x + w * 0.8, y + h * 0.25, 420, 'rgba(61,220,132,.35)');
      SocialArt.glow(c, x + w * 0.1, y + h * 0.75, 460, 'rgba(80,160,255,.3)');
      txt('21:47', x + w / 2, y + 260, 180, { font: FONT_B, weight: 700, skew: 0, shadow: 0 });
      notif(x + 24, y + 430, w - 48, 'StarFoot', P("Google Play'de yayında! ⚽", 'Now on Google Play! ⚽'), seg(t, 0.5, 0.85));
      notif(x + 24, y + 610, w - 48, P('Menajerin', 'Your agent'), P('Kariyerin seni bekliyor.', 'Your career is waiting.'), seg(t, 1.2, 1.55));
      tapRing(t, x + w / 2, y + 510, 2.1, 0.45);
      const wk = seg(t, 2.6, 3.0); if (wk > 0) { c.fillStyle = `rgba(255,255,255,${wk * 0.95})`; c.fillRect(x, y, w, h); }
    }, (0.88 + 0.08 * intro) * (1 + 0.25 * E.io(seg(t, 2.5, 3.0))), sh, (1 - intro) * 400 + 120, sh * 0.002);
    hook(t, P("ANDROID'CİLER", 'ANDROID USERS'), P('BEKLEYİŞ BİTTİ', 'THE WAIT IS OVER'), 0.05, 2.8, 250, 96, 136);
  } else if (t < END) {
    const i = t < S[1] ? 0 : t < S[2] ? 1 : 2, lt = t - S[i];
    if (i === 0) {
      // mahalleden başla
      drawBg(bgStreet(), 1.08 + lt * 0.03);
      const run = lt * 12;
      groundShadow(540, 1720, 260);
      fig(540, 1700, 900, { kit: { shirt: '#e63946', alt: '#e63946', pattern: 'plain', shorts: '#1d2433', socks: '#eee' }, number: null, run, speed: 1, look });
      Sprites.ball(c, 700 + Math.sin(lt * 6) * 30, 1640 - Math.abs(Math.sin(lt * 6)) * 120, 55, lt * 12, BALL_STYLES.classic);
    } else if (i === 1) {
      // dev stadyum, gol sevinci
      drawBg(bgStadium(US_B, false, 63), 1.06 + lt * 0.03);
      flashes(t, 10, 0.1, 0.55, 12);
      groundShadow(540, 1760, 280);
      fig(540, 1750, 1000, { kit: kitOf(US_B), number: 10, dive: 1, look });
      confetti(t, S[1], 120, ['#ffd84a', '#ffffff', '#6d28d9']);
    } else {
      // kupa ve Altın Top
      drawBg(bgStadium(US_A, false, 65), 1.06 + lt * 0.02);
      flashes(t, 8, 0.1, 0.5, 9);
      const lift = E.out(seg(lt, 0.1, 0.6));
      groundShadow(540, 1760, 280);
      fig(540, 1750 - lift * 30, 1000, { kit: kitOf(US_A), number: 10, dive: 1, look });
      SocialArt.trophyCup(c, 540, 1750 - 1000 * 1.22 - lift * 70, 150);
      if (lt > 0.6) goldBall(820, 760, 90 * E.back(seg(lt, 0.6, 1.0)), t * 1.4);
      confetti(t, S[2], 150, ['#ffd84a', '#ffffff', '#febe10', '#ffb02e']);
    }
    vignette(0.45);
    if (lt < 0.25) flash(t, S[i], 0.25, 0.7);
    const L = [[P('MAHALLEDEN BAŞLA', 'START ON THE STREET'), P('8 yaşında, ilk maçın', 'Age 8, your first match')], [P('DEV STADYUMLARDA OYNA', 'PLAY IN GIANT STADIUMS'), P('Kritik anı sen oyna', 'You play the key moments')], [P('EFSANE OL', 'BECOME A LEGEND'), P('Kupalar, Altın Top, milyonlarca takipçi', 'Trophies, Golden Ball, millions of fans')]][i];
    caption(t, L[0], S[i] + 0.05, (S[i + 1] || END) - 0.15, 330, 100, L[1]);
    txt(P('ARTIK ANDROID\'DE', 'NOW ON ANDROID'), W / 2, 1830, 54, { color: PGREEN, alpha: seg(t, S[0], S[0] + 0.3), font: FONT_B, weight: 700, skew: 0 });
  }
  flash(t, 3.0, 0.3, 0.9);
  endPlay(t, END, P('KARİYERİNİ SEN YAZ', 'WRITE YOUR CAREER'));
  grain();
}

// Kurgusal takımlarla skor çubuğu
function scoreBar2(t, a, b, hot) {
  const y = 150;
  c.save();
  c.fillStyle = 'rgba(5,9,24,.88)'; rr(150, y - 62, 780, 124, 26); c.fill();
  c.fillStyle = '#dc2626'; rr(150, y - 62, 18, 124, 9); c.fill(); c.fillStyle = '#6d28d9'; rr(912, y - 62, 18, 124, 9); c.fill();
  txt('SFC', 290, y + 4, 70, { shadow: 0 });
  txt('STR', 790, y + 4, 70, { shadow: 0 });
  c.fillStyle = '#ffcf3f'; rr(420, y - 50, 240, 100, 18); c.fill();
  txt(`${a} - ${b}`, 540, y + 6, 86, { color: '#0a1530', shadow: 0, scale: hot ? 1 + Math.max(0, 0.4 - hot) : 1 });
  c.globalAlpha = 0.7 + Math.abs(Math.sin(t * 4)) * 0.3; c.fillStyle = '#e11d2e'; rr(470, y + 72, 140, 64, 14); c.fill(); c.globalAlpha = 1;
  txt("90+4'", 540, y + 106, 50, { shadow: 0, skew: 0 });
  c.restore();
}

// ============================================================
// P2: "Bunu atabilen %1" — 90+4 penaltı, doksana gol
// ============================================================
function vPen(t) {
  const target = { x: 285, y: 790 }, END = 9.3;
  let aim = null, keeperK = 0, net = null;
  if (t >= 2.5 && t < 4.9) {
    const k = seg(t, 2.5, 4.2);
    const ax = t < 4.2 ? 540 + Math.sin(k * Math.PI * 2.5) * 240 : target.x;
    const ay = t < 4.2 ? 860 + Math.cos(k * Math.PI * 3) * 50 : target.y;
    const lockK = E.out(seg(t, 4.1, 4.4));
    aim = { x: lerp(ax, target.x, lockK), y: lerp(ay, target.y, lockK), a: seg(t, 2.5, 2.8) * (1 - seg(t, 4.75, 4.9)) };
  }
  const st = seg(t, 5.0, 5.9);
  const ballK = st < 0.5 ? st * 1.3 : 0.65 + (st - 0.5) * 0.7;
  if (t >= 5.1) keeperK = E.out(seg(t, 5.1, 5.7));
  if (t >= 5.9) net = { x: target.x, y: target.y, k: Math.max(0, 1 - (t - 5.9) * 1.6) };
  const shakeK = t > 5.9 && t < 6.4 ? (1 - seg(t, 5.9, 6.4)) : 0;
  const hb = t < 2.5 ? Math.pow(Math.max(0, Math.sin(t * Math.PI * 1.8)), 8) : 0;
  c.save();
  c.translate(Math.sin(t * 70) * 22 * shakeK, Math.cos(t * 60) * 16 * shakeK);
  if (t < 6.4) {
    const zoom = 1 + hb * 0.025 + E.io(seg(t, 4.9, 5.9)) * 0.12;
    c.translate(W / 2, H * 0.55); c.scale(zoom, zoom); c.translate(-W / 2, -H * 0.55);
    // kaleci ters köşeye uçar
    penaltyView(t, aim, ballK, keeperK, net);
    const run = seg(t, 4.7, 5.05);
    fig(760 - run * 150, 1980 - run * 220, 820 - run * 90, { kit: kitOf(GAL), number: 10, facing: 'up', run: run * 14, speed: run > 0 && run < 1 ? 1 : 0, kick: t > 4.95 && t < 5.3 ? seg(t, 4.95, 5.3) : 0 });
    if (t < 5.9) {
      const p = t < 5.0 ? 0 : cl(ballK);
      const q2 = (q) => [(1 - q) * (1 - q) * 540 + 2 * (1 - q) * q * 280 + q * q * target.x, (1 - q) * (1 - q) * 1580 + 2 * (1 - q) * q * 860 + q * q * target.y];
      if (p > 0) for (let k = 1; k <= 4; k++) { c.globalAlpha = 0.12 * (5 - k); const q = Math.max(0, p - k * 0.03); const [a, b] = q2(q); Sprites.ball(c, a, b, lerp(44, 16, E.out(q)), t * 20, BALL_STYLES.tr); }
      c.globalAlpha = 1;
      const [bx, by] = q2(p);
      Sprites.ball(c, bx, by, lerp(50, 16, E.out(p)), t * 20, BALL_STYLES.tr);
    }
    vignette(0.55 + hb * 0.35, hb > 0.05 ? '120,0,0' : '0,0,0');
  } else {
    const dt = t - 6.4;
    drawBg(bgStadium(GAL, false, 13), 1.08 + dt * 0.02);
    flashes(t, 10, 0.1, 0.55, 12);
    const x = W * (0.3 + 0.2 * E.out(seg(dt, 0, 0.8))), y = 1860, h = 1150, slide = seg(dt, 0.6, 1.3);
    groundShadow(x + slide * 90, y + 20, 280);
    fig(x + E.out(slide) * 90, y + slide * 50, h, { kit: kitOf(GAL), number: 10, run: dt * 12, speed: dt < 0.6 ? 1 : 0, dive: dt >= 0.6 ? 1 : 0 }, -0.28 * E.out(cl(slide * 2)));
    confetti(t, 6.4, 160, ['#ffd84a', '#ffffff', '#c8102e', '#fdb913']);
    vignette(0.45);
    const gk = seg(t, 6.45, 6.8);
    txt(P('DOKSANA!', 'TOP CORNER!'), W / 2, 560, 210, { grad: GOLD, scale: 0.6 + 0.4 * E.back(gk) + Math.sin(t * 9) * 0.015, alpha: gk, stroke: 10, strokeColor: 'rgba(0,0,0,.35)' });
    caption(t, P('SIRA SENDE', 'YOUR TURN'), 7.3, END - 0.1, 1450, 120, P('Şimdi Android\'de de', 'Now on Android too'));
  }
  c.restore();
  flash(t, 5.9, 0.35, 0.95);
  scoreBar2(t, t >= 6.05 ? 1 : 0, 0, t >= 6.05 ? t - 6.05 : 0);
  hook(t, P('BU PENALTIYI', 'ONLY 1% SCORE'), P('ATABİLEN %1', 'THIS PENALTY'), 0.05, 2.4, 470, 96, 150);
  if (t > 2.5 && t < 4.9) txt(P('NEREYE VURURSUN?', 'WHERE WOULD YOU SHOOT?'), W / 2, 470, 110, { grad: GOLD, alpha: seg(t, 2.5, 2.75) * (1 - seg(t, 4.65, 4.85)), scale: 0.8 + 0.2 * E.back(seg(t, 2.5, 2.85)) });
  tapRing(t, target.x, target.y, 4.1, 0.4);
  endPlay(t, END, P('KRİTİK ANI SEN OYNA', 'PLAY THE BIG MOMENTS'));
  grain();
}

// ============================================================
// P3: "Telefonunda yer aç" — dev bir kariyer, küçük bir uygulama: yaşlar hızla akar
// ============================================================
const P3_ST = [
  { a: 8, bg: 'street', tr: 'Mahalle maçı', en: 'Street match' },
  { a: 17, bg: 'aca', tr: 'İlk profesyonel sözleşme', en: 'First pro contract' },
  { a: 21, bg: 'big', tr: '€120M transfer', en: '€120M transfer' },
  { a: 25, bg: 'cup', tr: 'Şampiyonlar Kupası', en: 'Champions Cup' },
  { a: 28, bg: 'ball', tr: 'Altın Top', en: 'Golden Ball' },
];
function vAge(t) {
  const END = 10.0, T0 = 2.6, D = 1.4;
  const i = t < T0 ? -1 : Math.min(P3_ST.length - 1, Math.floor((t - T0) / D)), lt = i < 0 ? t : t - T0 - i * D;
  if (i < 0) {
    // kanca: siyah ekran, büyük soru, sayaç gibi titreyen yazı
    c.fillStyle = '#04060f'; c.fillRect(0, 0, W, H);
    SocialArt.glow(c, W / 2, H * 0.45, 700, 'rgba(61,220,132,.22)');
    const k = seg(t, 0.05, 0.4);
    txt(P('8 YAŞINDAN', 'FROM AGE 8'), W / 2, 760, 130, { alpha: k, scale: 0.7 + 0.3 * E.back(k) });
    txt(P("ALTIN TOP'A", 'TO THE GOLDEN BALL'), W / 2, 920, 150, { grad: GOLD, alpha: seg(t, 0.35, 0.7), scale: 0.7 + 0.3 * E.back(seg(t, 0.35, 0.75)) });
    const k2 = seg(t, 1.1, 1.4);
    txt(P('10 SANİYEDE', 'IN 10 SECONDS'), W / 2, 1100, 110, { alpha: k2, color: PGREEN, scale: 0.8 + 0.2 * E.back(k2) + Math.sin(t * 10) * 0.01 });
    // geri sayım halkası
    const rk = seg(t, 1.5, 2.6);
    if (rk > 0) { c.save(); c.strokeStyle = '#ffcf3f'; c.lineWidth = 14; c.beginPath(); c.arc(W / 2, 1400, 110, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * rk); c.stroke(); c.restore(); txt(String(3 - Math.min(2, Math.floor(rk * 3))), W / 2, 1408, 140, { shadow: 0 }); }
  } else if (t < END) {
    const s = P3_ST[i];
    const z = 1.06 + lt * 0.04;
    if (s.bg === 'street') drawBg(bgStreet(), z);
    else if (s.bg === 'aca') drawBg(bgStadium(ACA, true, 71), z);
    else if (s.bg === 'big') drawBg(bgBackdrop(RMG, RMG.label || 'ROYAL CITY'), z);
    else drawBg(bgStadium(RMG, false, 73 + i), z);
    if (s.bg !== 'street' && s.bg !== 'aca') flashes(t, 9, 0.1, 0.5, 11);
    const kit = s.bg === 'street' ? { shirt: '#e63946', alt: '#e63946', pattern: 'plain', shorts: '#1d2433', socks: '#eee' } : s.bg === 'aca' ? kitOf(ACA) : kitOf(RMG);
    const h = s.bg === 'street' ? 760 : 980;
    groundShadow(540, 1760, 270);
    fig(540, 1750, h, { kit, number: s.bg === 'street' ? null : 10, look, dive: s.bg === 'cup' || s.bg === 'ball' ? 1 : 0, run: s.bg === 'street' ? lt * 12 : 0, speed: s.bg === 'street' ? 1 : 0 });
    if (s.bg === 'cup') { SocialArt.trophyCup(c, 540, 1750 - h * 1.22 - 40, 150); confetti(t, T0 + i * D, 120); }
    if (s.bg === 'ball') { goldBall(540, 1750 - h * 1.25 - 40, 110 * E.back(seg(lt, 0, 0.4)), t * 1.4); confetti(t, T0 + i * D, 160, ['#ffd84a', '#ffffff', '#ffb02e']); }
    if (s.bg === 'big') { const pk = E.back(seg(lt, 0.1, 0.5)); c.save(); c.translate(540, 1060); c.scale(pk, pk); c.fillStyle = 'rgba(5,9,24,.88)'; rr(-300, -80, 600, 160, 30); c.fill(); txt('€120.000.000', 0, 6, 86, { grad: GOLD, shadow: 0 }); c.restore(); }
    vignette(0.45);
    if (lt < 0.2) flash(t, T0 + i * D, 0.2, 0.6);
    // yaş sayacı (sol üst) ve sahne etiketi
    const prev = i > 0 ? P3_ST[i - 1].a : s.a, age = Math.round(lerp(prev, s.a, E.out(seg(lt, 0, 0.35))));
    c.save(); c.fillStyle = 'rgba(5,9,24,.85)'; rr(70, 150, 330, 190, 34); c.fill(); c.restore();
    txt(P('YAŞ', 'AGE'), 235, 195, 42, { shadow: 0, font: FONT_B, weight: 700, skew: 0, color: '#9fb0d8' });
    txt(String(age), 235, 275, 120, { grad: GOLD, shadow: 0 });
    { const g2 = c.createLinearGradient(0, 380, 0, 560); g2.addColorStop(0, 'rgba(3,6,18,0)'); g2.addColorStop(0.3, 'rgba(3,6,18,.7)'); g2.addColorStop(0.7, 'rgba(3,6,18,.7)'); g2.addColorStop(1, 'rgba(3,6,18,0)'); c.fillStyle = g2; c.fillRect(0, 380, W, 180); }
    txt(P(s.tr, s.en).toLocaleUpperCase(PTR ? 'tr-TR' : 'en-US'), W / 2, 470, 104, { alpha: seg(lt, 0, 0.2), scale: 0.85 + 0.15 * E.back(seg(lt, 0, 0.3)), stroke: 8, strokeColor: 'rgba(0,0,0,.4)' });
    // ilerleme çubuğu
    const pr = cl((t - T0) / (END - T0));
    c.fillStyle = 'rgba(255,255,255,.2)'; rr(90, 1840, 900, 16, 8); c.fill(); c.fillStyle = PGREEN; rr(90, 1840, 900 * pr, 16, 8); c.fill();
  }
  endPlay(t, END, P('SENİN KARİYERİN', 'YOUR CAREER'));
  grain();
}

const pv = (f, tr) => usWrap((t) => { PTR = tr; try { f(t); } finally { PTR = true; } });
Object.assign(VIDEOS, {
  play_android_tr: { dur: 12.4, f: pv(vAndroid, true) }, play_android_en: { dur: 12.4, f: pv(vAndroid, false) },
  play_penalti_tr: { dur: 12.3, f: pv(vPen, true) }, play_penalti_en: { dur: 12.3, f: pv(vPen, false) },
  play_yas_tr: { dur: 13.0, f: pv(vAge, true) }, play_yas_en: { dur: 13.0, f: pv(vAge, false) },
});
