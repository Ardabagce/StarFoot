// ABD (İngilizce) reklam videoları. ads.js'in yardımcılarını kullanır.
// Render: PAGE=us.html node render.js us_keeper|us_career|us_ovr <klasör>

// Tarafsız, kurgusal takımlar (gerçek kulüp renklerine benzemesin)
const US_A = { id: 'USA1', c1: '#0f766e', c2: '#f8fafc', short: 'SFC' };
const US_B = { id: 'USB1', c1: '#6d28d9', c2: '#f8fafc', short: 'STR' };

// İngilizce kapanış kartı
function endCardEN(t, t0, tag, sub) {
  const k = seg(t, t0, t0 + 0.45);
  if (k <= 0) return;
  c.save(); c.globalAlpha = E.out(k);
  const g = c.createRadialGradient(W / 2, H * 0.32, 60, W / 2, H * 0.4, H * 0.8);
  g.addColorStop(0, '#1d3f95'); g.addColorStop(0.45, '#0d1f4f'); g.addColorStop(1, '#030714');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  [[-140, -0.38], [W + 140, 0.38]].forEach(([x, a]) => {
    c.save(); c.translate(x, -200); c.rotate(a + Math.sin(t * 0.8) * 0.03);
    const bg = c.createLinearGradient(0, 0, 0, 1700); bg.addColorStop(0, 'rgba(255,244,214,.22)'); bg.addColorStop(1, 'rgba(255,244,214,0)');
    c.fillStyle = bg; c.fillRect(-260, 0, 520, 1700); c.restore();
  });
  const dt = t - t0;
  confetti(t, t0 - 0.3, 70, ['#ffd84a', '#ffffff', '#ffb02e', '#7fb2ff']);
  const is = 330 * E.back(seg(t, t0 + 0.1, t0 + 0.6));
  if (icon.complete && is > 1) {
    c.save(); c.shadowColor = 'rgba(255,207,63,.45)'; c.shadowBlur = 80;
    rr(W / 2 - is / 2, 470 - is / 2, is, is, is * 0.22); c.clip();
    c.drawImage(icon, W / 2 - is / 2, 470 - is / 2, is, is); c.restore();
  }
  const lk = seg(t, t0 + 0.35, t0 + 0.7);
  txt('STAR', W / 2 - 150, 790, 160, { alpha: lk, scale: 0.8 + 0.2 * E.back(lk) });
  txt('FOOT', W / 2 + 150, 790, 160, { alpha: lk, color: '#ffcf3f', scale: 0.8 + 0.2 * E.back(lk) });
  const tk = seg(t, t0 + 0.6, t0 + 0.95);
  txt(tag, W / 2, 960, 84, { alpha: tk, scale: 0.85 + 0.15 * E.out(tk) });
  if (sub) txt(sub, W / 2, 1050, 46, { alpha: tk, weight: 600, font: FONT_B, skew: 0, color: '#cdd7f4' });
  const bk = seg(t, t0 + 0.85, t0 + 1.2), pulse = 1 + Math.max(0, Math.sin((dt - 1.2) * 5)) * 0.035 * (dt > 1.2);
  if (bk > 0) {
    c.save(); c.globalAlpha *= bk; c.translate(W / 2, 1200); const s = pulse * (0.8 + 0.2 * E.back(bk)); c.scale(s, s);
    c.shadowColor = 'rgba(255,207,63,.45)'; c.shadowBlur = 50;
    c.fillStyle = '#ffcf3f'; rr(-300, -62, 600, 124, 62); c.fill(); c.shadowBlur = 0;
    txt('PLAY FREE NOW', 0, 4, 62, { color: '#0a1530', shadow: 0, skew: 0 });
    c.restore();
    txt('App Store  ·  Google Play', W / 2, 1320, 40, { alpha: bk, weight: 600, font: FONT_B, skew: 0, color: '#cdd7f4', shadow: 0 });
  }
  c.restore();
}

// Ekranın altında etiket şeridi
function caption(t, s, t0, t1, y = 1500, size = 104, sub) {
  if (t < t0 || t > t1 + 0.2) return;
  const k = E.back(seg(t, t0, t0 + 0.3)), out = 1 - seg(t, t1, t1 + 0.2);
  txt(s, W / 2, y, size, { grad: GOLD, alpha: out * seg(t, t0, t0 + 0.15), scale: 0.7 + 0.3 * k, stroke: 10, strokeColor: 'rgba(0,0,0,.4)' });
  if (sub) txt(sub, W / 2, y + size * 0.85, 48, { alpha: out * seg(t, t0 + 0.1, t0 + 0.3), font: FONT_B, weight: 700, skew: 0 });
}
function tapRing(t, x, y, t0, dur = 0.45) {
  const k = seg(t, t0, t0 + dur); if (k <= 0 || k >= 1) return;
  c.save(); c.globalAlpha = 1 - k; c.strokeStyle = '#fff'; c.lineWidth = 9;
  c.beginPath(); c.arc(x, y, 30 + k * 110, 0, Math.PI * 2); c.stroke(); c.restore();
}

// ============================================================
// US 1: Kaleci bakış açısı. 90+4 penaltı, sen kalecisin.
// ============================================================
// Birinci şahıs eldiven
function glove(x, y, s, rot, side) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s * side, s);
  // kol (aşağı doğru)
  c.fillStyle = GK_KITS[0].shirt; rr(-70, 120, 140, 700, 50); c.fill();
  c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(30, 120, 40, 700);
  // bilek bandı
  c.fillStyle = '#1b1b1b'; rr(-82, 70, 164, 80, 24); c.fill();
  c.fillStyle = '#c6f135'; c.fillRect(-82, 100, 164, 14);
  // avuç + parmaklar
  c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 30;
  c.fillStyle = '#f4f4f4'; rr(-95, -110, 190, 200, 60); c.fill();
  [[-78, -260, 40], [-30, -290, 42], [20, -280, 42], [66, -240, 38]].forEach(([fx, fy, fw]) => { rr(fx - fw / 2, fy, fw, 200, fw / 2); c.fill(); });
  c.save(); c.translate(-95, -10); c.rotate(-0.9); rr(-24, -120, 50, 150, 25); c.fill(); c.restore();
  c.shadowBlur = 0;
  c.fillStyle = '#c6f135'; rr(-95, -10, 190, 34, 10); c.fill();
  c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 5; rr(-95, -110, 190, 200, 60); c.stroke();
  c.restore();
}
function povPitch(t, tilt) {
  drawBg(bgStadium(US_B, false, 21), 1.15, 0, -330);
  const hz = 900;
  for (let i = 0; i < 12; i++) {
    const y0 = hz + (H - hz) * Math.pow(i / 12, 1.6), y1 = hz + (H - hz) * Math.pow((i + 1) / 12, 1.6);
    c.fillStyle = i % 2 ? '#1f7a37' : '#1a6a30'; c.fillRect(-200, y0, W + 400, y1 - y0 + 1);
  }
  const lg = c.createLinearGradient(0, hz, 0, H); lg.addColorStop(0, 'rgba(255,250,220,.1)'); lg.addColorStop(1, 'rgba(0,0,0,.3)'); c.fillStyle = lg; c.fillRect(-200, hz, W + 400, H - hz);
  // ceza sahası (karşıdan)
  c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 7;
  c.beginPath(); c.moveTo(-300, 1080); c.lineTo(W + 300, 1080); c.stroke();
  c.beginPath(); c.moveTo(250, 1080); c.lineTo(80, 1500); c.moveTo(830, 1080); c.lineTo(1000, 1500); c.stroke();
  c.beginPath(); c.moveTo(-300, 1880); c.lineTo(W + 300, 1880); c.stroke();
  c.fillStyle = '#fff'; c.beginPath(); c.ellipse(540, 1215, 22, 8, 0, 0, Math.PI * 2); c.fill();
  // direkler (yakın)
  c.fillStyle = '#f7f7f7'; c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 20;
  c.fillRect(-10, 0, 70, 1900); c.fillRect(W - 60, 0, 70, 1900); c.fillRect(-10, 0, W + 20, 60);
  c.shadowBlur = 0;
  c.strokeStyle = 'rgba(235,240,250,.25)'; c.lineWidth = 3;
  for (let x = 60; x < W - 60; x += 70) { c.beginPath(); c.moveTo(x, 60); c.lineTo(x + (x - 540) * 0.08, 0); c.stroke(); }
}
function vKeeper(t) {
  // 0-2.7 kanca, 2.7-3.9 yön seç, 3.9 koşu, 4.35 şut, 4.8 kurtarış, 6.3 özellikler, 9.9 kapanış
  const SPOT = { x: 540, y: 1205 }, TGT = { x: 360, y: 760 };
  const hb = t < 3.9 ? Math.pow(Math.max(0, Math.sin(t * Math.PI * 1.7)), 8) : 0;
  const CATCH = 4.8;
  if (t < 6.3) {
    const shake = t > CATCH && t < CATCH + 0.5 ? 1 - seg(t, CATCH, CATCH + 0.5) : 0;
    const tilt = E.out(seg(t, 4.35, CATCH)) * -0.16;
    const zoom = 1 + hb * 0.025 + E.io(seg(t, 0, 3.9)) * 0.06;
    c.save();
    c.translate(Math.sin(t * 70) * 26 * shake, Math.cos(t * 60) * 18 * shake);
    c.translate(W / 2, H * 0.6); c.rotate(tilt); c.scale(zoom, zoom); c.translate(-W / 2, -H * 0.6);
    povPitch(t, tilt);
    // atıcı: bekler, sonra koşar
    const run = seg(t, 3.9, 4.35);
    const sx = 690 - run * 120, sy = 1150 + run * 50, sh = 480 + run * 90;
    groundShadow(sx, sy, sh * 0.22);
    fig(sx, sy, sh, { kit: kitOf(US_B), number: 9, look: Sprites.look(14), run: run * 14, speed: run > 0 && run < 1 ? 1 : 0, kick: t > 4.2 && t < 4.55 ? seg(t, 4.2, 4.55) : 0 });
    // top
    const p = E.in ? E.in(seg(t, 4.35, CATCH)) : seg(t, 4.35, CATCH) ** 2;
    let bx = lerp(SPOT.x, TGT.x, p), by = lerp(SPOT.y, TGT.y, p) - Math.sin(p * Math.PI) * 120, br = lerp(22, 120, p * p);
    // eldivenler: aşağıda bekler, şutla birlikte topa uzanır
    const dk = E.out(seg(t, 4.4, CATCH));
    const idle = Math.sin(t * 5) * 14 * (1 - dk);
    const ready = E.out(seg(t, 2.6, 3.2));
    const lx = lerp(330, TGT.x - 175, dk), ly = lerp(1820 - ready * 120, TGT.y + 40, dk) + idle;
    const rx = lerp(750, TGT.x + 175, dk), ry = lerp(1820 - ready * 120, TGT.y + 40, dk) - idle;
    const gs = lerp(1.05, 0.85, dk);
    if (t >= CATCH) { bx = TGT.x; by = TGT.y; br = 120; }
    if (t > 4.35 && t < CATCH) for (let k = 1; k <= 4; k++) { const q = Math.max(0, p - k * 0.04); c.globalAlpha = 0.1 * (5 - k); Sprites.ball(c, lerp(SPOT.x, TGT.x, q), lerp(SPOT.y, TGT.y, q) - Math.sin(q * Math.PI) * 120, lerp(22, 120, q * q), t * 20, BALL_STYLES.classic); }
    c.globalAlpha = 1;
    const drawBall = () => Sprites.ball(c, bx, by, br, t < CATCH ? t * 20 : CATCH * 20, BALL_STYLES.classic);
    if (dk < 0.85) drawBall();
    glove(lx, ly, gs, lerp(0.15, 0.35, dk), 1);
    glove(rx, ry, gs, lerp(-0.15, -0.35, dk), -1);
    if (dk >= 0.85) drawBall();
    c.restore();
    vignette(0.55 + hb * 0.35, hb > 0.05 ? '120,0,0' : '0,0,0');
    // skor
    c.fillStyle = 'rgba(5,9,24,.88)'; rr(290, 90, 500, 110, 24); c.fill();
    txt('1 - 1', 540, 148, 74, { shadow: 0, color: '#ffcf3f' });
    const pp = 0.7 + Math.abs(Math.sin(t * 4)) * 0.3;
    c.globalAlpha = pp; c.fillStyle = '#e11d2e'; rr(450, 214, 180, 64, 14); c.fill(); c.globalAlpha = 1;
    txt("90+4'", 540, 248, 50, { shadow: 0, skew: 0 });
    hook(t, "90+4'. PENALTY.", "YOU'RE THE KEEPER", 0.06, 2.65, 520, 96, 132);
    if (t > 2.7 && t < 4.4) {
      const a = seg(t, 2.7, 2.95) * (1 - seg(t, 4.2, 4.4));
      txt('PICK A SIDE', W / 2, 470, 140, { grad: GOLD, alpha: a, scale: 0.8 + 0.2 * E.back(seg(t, 2.7, 3.05)) });
      const pul = 1 + Math.sin(t * 12) * 0.08;
      txt('◀', 200, 900, 150 * pul, { alpha: a, color: t > 3.6 ? '#ffcf3f' : '#fff', skew: 0 });
      txt('▶', 880, 900, 150 * (t > 3.6 ? 1 : pul), { alpha: a * (t > 3.6 ? 0.35 : 1), skew: 0 });
    }
    tapRing(t, 200, 900, 3.6);
    if (t >= CATCH) {
      const sk = seg(t, CATCH + 0.05, CATCH + 0.35);
      txt('SAVED!', W / 2, 520, 250, { grad: GOLD, alpha: sk, scale: 0.6 + 0.4 * E.back(sk) + Math.sin(t * 9) * 0.015, stroke: 12, strokeColor: 'rgba(0,0,0,.4)' });
      const bk = E.back(seg(t, CATCH + 0.4, CATCH + 0.7));
      if (bk > 0) {
        c.save(); c.translate(W / 2, 760); c.scale(bk, bk);
        c.fillStyle = '#22c55e'; rr(-230, -50, 460, 100, 50); c.fill();
        txt('✓  +1 RATING', 0, 4, 56, { shadow: 0, skew: 0 }); c.restore();
      }
      confetti(t, CATCH, 150, ['#c6f135', '#ffffff', '#ffd84a', '#ffb02e']);
    }
    flash(t, CATCH, 0.3, 0.9);
  } else {
    // özellikler: kaleci kariyeri
    const dt = t - 6.3;
    drawBg(bgStadium(US_A, false, 24), 1.06 + dt * 0.02);
    flashes(t, 8, 0.1, 0.5, 10);
    const MOVES = ['1-ON-1s', 'CROSSES', 'REFLEX SAVES', 'PENALTIES'];
    const i = Math.min(3, Math.floor(dt / 0.85)), lt = dt - i * 0.85;
    const dir = i % 2 ? -1 : 1, dk = E.out(cl(lt / 0.35));
    const x = 540 + dir * dk * 60, y = 1640 - dk * 150, h = 860;
    groundShadow(540 + dir * 120, 1760, 300);
    fig(x, y, h, { kit: GK_KITS[i % 3], gk: true, gloves: true, look, dive: 1, armA: 1.4 }, dir * dk * 0.6);
    if (i > 0) flash(t, 6.3 + i * 0.85, 0.2, 0.5);
    vignette(0.5);
    const hk = seg(dt, 0, 0.3);
    c.fillStyle = '#c6f135'; c.globalAlpha = hk; rr(310, 255, 460, 80, 40); c.fill(); c.globalAlpha = 1;
    txt('NEW', 540, 297, 58, { color: '#0a1530', shadow: 0, skew: 0, alpha: hk });
    txt('GOALKEEPER CAREER', W / 2, 430, 118, { alpha: hk, scale: 0.8 + 0.2 * E.back(hk) });
    txt(MOVES[i], W / 2, 590, 130, { grad: GOLD, scale: 0.7 + 0.3 * E.back(cl(lt / 0.3)) });
    // sayaçlar
    const ck = E.io(seg(dt, 0.2, 3.3));
    c.fillStyle = 'rgba(5,9,24,.82)'; rr(90, 1530, 900, 210, 30); c.fill();
    txt(String(Math.round(ck * 147)), 300, 1610, 100, { grad: GOLD });
    txt('SAVES', 300, 1690, 40, { font: FONT_B, weight: 700, skew: 0 });
    txt(String(Math.round(ck * 62)), 780, 1610, 100, { grad: GOLD });
    txt('CLEAN SHEETS', 780, 1690, 40, { font: FONT_B, weight: 700, skew: 0 });
  }
  endCardEN(t, 9.9, 'BE THE HERO IN GOAL', 'Play a full career as a striker or a keeper');
  grain();
}

// ============================================================
// US 2: Sokaktan Altın Top'a (yaş sayacı)
// ============================================================
const US_STAGES = [
  { a: 0.0, age: 8, w: 'STREET SOCCER' },
  { a: 2.1, age: 12, w: 'ACADEMY' },
  { a: 3.8, age: 17, w: 'PRO DEBUT' },
  { a: 5.5, age: 21, w: 'RECORD TRANSFER' },
  { a: 7.2, age: 24, w: 'CAPTAIN' },
  { a: 8.9, age: 27, w: 'GOLDEN BALL' },
];
function vCareer(t) {
  const END = 10.9;
  let i = US_STAGES.length - 1;
  while (i > 0 && t < US_STAGES[i].a) i--;
  const S = US_STAGES[i], lt = t - S.a;
  const tk = E.out(cl(lt / 0.28));
  c.save();
  if (i > 0 && tk < 1) {
    c.save(); c.translate(-W * 0.35 * tk, 0); stageScene(i - 1, t, t - US_STAGES[i - 1].a); c.restore();
    c.translate(W * (1 - tk) * 0.9, 0);
  }
  stageScene(i, t, lt);
  c.restore();
  if (i > 0) flash(t, S.a, 0.25, 0.55);
  vignette(0.5);
  if (t < END && t > 2.0) {
    const ak = E.back(cl(lt / 0.35));
    const prev = i > 0 ? US_STAGES[i - 1].age : null;
    c.save(); c.beginPath(); c.rect(0, 380, W, 340); c.clip();
    if (prev != null && ak < 1) txt(String(prev), 90, 560 - ak * 300, 300, { align: 'left', grad: GOLD, alpha: 1 - ak });
    txt(String(S.age), 90, 560 + (1 - ak) * 300, 300, { align: 'left', grad: GOLD });
    c.restore();
    txt('AGE', 90 + (S.age >= 10 ? 330 : 175), 610, 70, { align: 'left' });
    const wk = E.out(cl((lt - 0.1) / 0.3));
    txt(S.w, 92, 760, 88, { align: 'left', alpha: wk, maxW: W - 180 });
    c.fillStyle = '#ffcf3f'; c.save(); c.transform(1, 0, -0.3, 1, 0, 0); c.fillRect(92 + 230, 820, 160 * wk, 12); c.restore();
  }
  // seçim kartları: her durakta "senin kararın" hissi
  const CH = { 1: ['STAY LOYAL', 'GO ABROAD'], 3: ['€120M OFFER', 'STAY HOME'], 4: ['ACCEPT', 'DECLINE'] };
  if (CH[i] && lt > 0.55 && lt < 1.6) {
    const ck = E.back(seg(lt, 0.55, 0.8)), pick = lt > 1.05;
    CH[i].forEach((s, j) => {
      const x = j ? 790 : 290, y = 1560;
      c.save(); c.translate(x, y); c.scale(ck * (pick && j === 0 ? 1.08 : 1), ck);
      c.globalAlpha = pick && j ? 0.35 : 1;
      c.fillStyle = pick && j === 0 ? '#ffcf3f' : 'rgba(5,9,24,.85)'; rr(-220, -62, 440, 124, 26); c.fill();
      c.strokeStyle = '#ffcf3f'; c.lineWidth = 5; rr(-220, -62, 440, 124, 26); c.stroke();
      txt(s, 0, 4, 54, { color: pick && j === 0 ? '#0a1530' : '#fff', shadow: 0, skew: 0, maxW: 400 });
      c.restore();
    });
    tapRing(t, 290, 1560, S.a + 1.0);
  }
  hook(t, 'FROM STREET SOCCER', 'TO THE GOLDEN BALL', 0.08, 1.95, 250, 92, 124);
  if (i === 5) caption(t, 'YOUR CHOICES. YOUR STORY.', S.a + 0.6, END - 0.1, 1560, 84);
  endCardEN(t, END, 'WRITE YOUR LEGEND', 'From the streets to the Golden Ball');
  grain();
}

// ============================================================
// US 3: 48'den 99'a. Reyting kartı yükselir, her özellik bir sıçrama.
// ============================================================
function ovrCard(t, x, y, s, ovr, bump, gold) {
  c.save(); c.translate(x, y); c.scale(s * (1 + bump * 0.12), s * (1 + bump * 0.12));
  c.shadowColor = gold ? 'rgba(255,207,63,.7)' : 'rgba(0,0,0,.6)'; c.shadowBlur = 60 + bump * 80;
  const g = c.createLinearGradient(0, -330, 0, 330);
  if (gold) { g.addColorStop(0, '#fff3c4'); g.addColorStop(0.45, '#f5c542'); g.addColorStop(1, '#b8780c'); }
  else { g.addColorStop(0, '#d9dde6'); g.addColorStop(0.5, '#9aa3b5'); g.addColorStop(1, '#5d6678'); }
  c.beginPath(); c.moveTo(-230, -300); c.quadraticCurveTo(0, -360, 230, -300); c.lineTo(230, 230); c.quadraticCurveTo(0, 360, -230, 230); c.closePath();
  c.fillStyle = g; c.fill(); c.shadowBlur = 0;
  c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 6; c.stroke();
  c.save(); c.clip();
  Sprites.figure(c, 40, 330, 640, { kit: kitOf(gold ? RMG : ACA), look, facing: 'down', noShadow: true, t: 0, number: 10 });
  c.restore();
  const tc = gold ? '#3b2500' : '#1b2233';
  txt(String(ovr), -140, -200, 130, { color: tc, shadow: 0, skew: 0 });
  txt('ST', -140, -110, 56, { color: tc, shadow: 0, skew: 0 });
  c.fillStyle = 'rgba(0,0,0,.55)'; rr(-200, 160, 400, 80, 18); c.fill();
  txt('YOU', 0, 202, 60, { shadow: 0, skew: 0 });
  c.restore();
}
const OVR_BEATS = [
  { a: 0.0, ovr: 48, w: null },
  { a: 2.4, ovr: 64, w: 'TRAIN YOUR SKILLS' },
  { a: 4.3, ovr: 76, w: 'PLAY THE BIG MOMENTS' },
  { a: 6.2, ovr: 85, w: 'BLOW UP ON SOCIAL' },
  { a: 8.1, ovr: 93, w: 'SIGN WITH GIANTS' },
  { a: 9.9, ovr: 99, w: 'WIN THE GOLDEN BALL' },
];
function vOvr(t) {
  const END = 12.0;
  let i = OVR_BEATS.length - 1;
  while (i > 0 && t < OVR_BEATS[i].a) i--;
  const B = OVR_BEATS[i], lt = t - B.a;
  // arka plan sahneleri
  if (i === 0) { drawBg(bgStreet(), 1.05 + t * 0.02); }
  else if (i === 1) {
    drawBg(bgStadium(ACA, true, 8), 1.05 + lt * 0.03);
    for (let k = 0; k < 4; k++) { const cx = 160 + k * 260, cy = 1800 - (k % 2) * 30; c.fillStyle = '#ff7a1a'; c.beginPath(); c.moveTo(cx - 34, cy); c.lineTo(cx, cy - 80); c.lineTo(cx + 34, cy); c.fill(); }
  } else if (i === 2) {
    // hızlı penaltı golü
    const st = seg(lt, 0.2, 0.75);
    const tg = { x: 780, y: 820 };
    penaltyView(t, lt < 0.25 ? { x: tg.x, y: tg.y, a: 1 - seg(lt, 0.15, 0.25) } : null, st, E.out(seg(lt, 0.3, 0.7)) * -1, lt > 0.75 ? { x: tg.x, y: tg.y, k: Math.max(0, 1 - (lt - 0.75) * 1.6) } : null);
    if (lt < 0.75) { const p = st; Sprites.ball(c, lerp(540, tg.x, p), lerp(1580, tg.y, p) - Math.sin(p * Math.PI) * 200, lerp(50, 16, E.out(p)), t * 20, BALL_STYLES.classic); }
    if (lt > 0.75) { confetti(t, B.a + 0.75, 120); txt('GOAL!', W / 2, 1450, 200, { grad: GOLD, scale: 0.6 + 0.4 * E.back(seg(lt, 0.75, 1.05)), stroke: 10 }); }
    flash(t, B.a + 0.75, 0.3, 0.8);
  } else if (i === 3) {
    drawBg(bgBackdrop(RMG, 'STARFOOT'), 1.05);
    const fk = E.io(seg(lt, 0.2, 1.6)), fol = 1204 * Math.pow(10400000 / 1204, fk);
    hearts(t, B.a + 0.1, 820, 1700, 10);
    c.fillStyle = 'rgba(5,9,24,.85)'; rr(140, 1430, 800, 230, 34); c.fill();
    txt(fol >= 1e6 ? (fol / 1e6).toFixed(1) + 'M' : fol >= 1e3 ? Math.round(fol / 1e3) + 'K' : String(Math.round(fol)), W / 2, 1520, 130, { grad: GOLD, scale: 1 + Math.sin(t * 18) * 0.03 * (fk < 1) });
    txt('FOLLOWERS', W / 2, 1615, 50, { font: FONT_B, weight: 700, skew: 0 });
  } else if (i === 4) {
    drawBg(bgBackdrop(RMG, RMG.label), 1.05 + lt * 0.03);
    flashes(t, 10, 0.1, 0.75, 12);
    const pk = E.back(seg(lt, 0.2, 0.55));
    txt('€120M', W / 2, 1520, 180, { grad: GOLD, scale: pk, alpha: pk });
  } else {
    c.fillStyle = '#050509'; c.fillRect(0, 0, W, H);
    c.save(); c.globalCompositeOperation = 'lighter';
    const cone = c.createRadialGradient(W / 2, -200, 50, W / 2, H * 0.6, 1100); cone.addColorStop(0, 'rgba(255,230,160,.55)'); cone.addColorStop(1, 'rgba(255,230,160,0)');
    c.fillStyle = cone; c.beginPath(); c.moveTo(W / 2 - 120, -50); c.lineTo(W / 2 + 120, -50); c.lineTo(W + 200, H); c.lineTo(-200, H); c.fill();
    c.restore();
    SocialArt.bokeh(c, W, H, RNG(4), ['rgba(255,214,120,.6)', 'rgba(255,255,255,.5)'], 40, 0.05, 0.6);
    goldBall(W / 2, 1530, 120 * E.back(seg(lt, 0.3, 0.7)), lt * 1.4);
    confetti(t, B.a, 160, ['#ffd84a', '#ffffff', '#ffb02e']);
  }
  if (i > 0) flash(t, B.a, 0.25, 0.6);
  vignette(0.45);
  // reyting kartı: sayı bir önceki değerden sayarak çıkar
  const prev = i > 0 ? OVR_BEATS[i - 1].ovr : B.ovr;
  const ck = E.out(seg(lt, 0.05, 0.6));
  const ovr = Math.round(lerp(prev, B.ovr, ck));
  const bump = i > 0 ? Math.max(0, 1 - lt / 0.35) : 0;
  const cy = i === 2 ? 900 : 860, cs = i === 2 ? 0.0 : 1.05;
  if (cs > 0) ovrCard(t, W / 2, cy, cs * (0.85 + 0.15 * E.back(seg(t, 0, 0.4))), ovr, bump, ovr >= 85);
  else { // penaltı sırasında köşede küçük kart
    ovrCard(t, 880, 420, 0.42, ovr, bump, false);
  }
  if (i > 0 && lt < 0.9 && cs > 0) txt('+' + (B.ovr - prev), W / 2 + 290, cy - 330 - lt * 80, 110, { color: '#22e06b', alpha: 1 - seg(lt, 0.6, 0.9) });
  if (B.w) txt(B.w, W / 2, 260, 100, { alpha: seg(lt, 0, 0.2), scale: 0.8 + 0.2 * E.back(seg(lt, 0, 0.3)), maxW: W - 120 });
  hook(t, 'CAN YOU GO FROM', '48 TO 99?', 0.06, 2.3, 260, 96, 170);
  endCardEN(t, END, 'HOW HIGH CAN YOU GO?', 'The soccer career game where every choice counts');
  grain();
}

// ABD videolarında ortak sahnelerdeki takımları tarafsız renklere çevir
const US_SWAP = [[GAL, { id: 'USR', c1: '#dc2626', c2: '#f8fafc', short: 'SFC' }], [RMG, { id: 'USW', c1: '#f8fafc', c2: '#1d4ed8', short: 'RCY', label: 'ROYAL CITY' }], [ACA, { short: 'ACA' }]];
const usWrap = (f) => (t) => {
  const keep = US_SWAP.map(([o, n]) => { const k = {}; Object.keys(n).forEach((x) => (k[x] = o[x])); Object.assign(o, n); return k; });
  try { f(t); } finally { US_SWAP.forEach(([o], i) => { Object.keys(keep[i]).forEach((x) => (keep[i][x] === undefined ? delete o[x] : (o[x] = keep[i][x]))); }); }
};
Object.assign(VIDEOS, { us_keeper: { dur: 13.4, f: usWrap(vKeeper) }, us_career: { dur: 14.4, f: usWrap(vCareer) }, us_ovr: { dur: 15.5, f: usWrap(vOvr) } });
