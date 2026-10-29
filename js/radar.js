// Maç radarı: dakika dakika akışın üstünde küçük saha. İki takım nokta olarak dizilir, top dolaşır.
// Hücum yönü: ev sahibi soldan sağa. Gol, pozisyon ve oyuncunun kritik anları radara yansır.
const Radar = {
  // 4-4-2 temel dizilişi (ev sahibi, x: 0 kendi kalesi → 1 rakip kale)
  F442: [[0.04, 0.5], [0.2, 0.15], [0.17, 0.38], [0.17, 0.62], [0.2, 0.85], [0.42, 0.14], [0.38, 0.4], [0.38, 0.6], [0.42, 0.86], [0.6, 0.38], [0.6, 0.62]],
  ME: { DF: 2, MF: 6, FW: 9 },
  // mahalle maçı: 7'ye 7
  F7: [[0.05, 0.5], [0.24, 0.3], [0.24, 0.7], [0.44, 0.2], [0.42, 0.5], [0.44, 0.8], [0.64, 0.5]],
  ME7: { DF: 1, MF: 4, FW: 6 },

  start(cv, o) {
    if (!cv || !cv.getContext) return null;
    const R = {
      cv, ctx: cv.getContext('2d'), o, speed: 1, run: true, t: 0, last: 0,
      ball: { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, v: 0.6 }, own: 'H', hold: 0, pos: 'H', next: 0.4,
      bias: 0, flash: null, me: o.mePos != null ? (o.street ? Radar.ME7 : Radar.ME)[o.mePos] : null, onPitch: false,
    };
    const mk = (side) => (o.street ? Radar.F7 : Radar.F442).map(([x, y], i) => {
      const bx = side === 'H' ? x : 1 - x, by = side === 'H' ? y : 1 - y;
      return { side, i, bx, by, x: bx, y: by, ph: Math.random() * 6.28 };
    });
    R.H = mk('H'); R.A = mk('A');
    R.all = R.H.concat(R.A);
    const fit = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1), w = cv.clientWidth || 300, h = cv.clientHeight || 110;
      if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
      R.dpr = dpr; R.w = w; R.h = h;
    };
    fit();
    R.fit = fit;
    const loop = (now) => {
      if (!R.run) return;
      if (!document.body.contains(cv)) { R.run = false; return; }
      const dt = Math.min(0.05, (now - (R.last || now)) / 1000); R.last = now;
      if (!document.hidden && cv.offsetParent !== null) { Radar.step(R, dt * (0.7 + R.speed * 0.3)); Radar.draw(R); }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    // dışarıdan çağrılanlar
    R.minute = (homeR, awayR, onPitch) => { R.bias = U.clamp((homeR - awayR) / 40, -0.35, 0.35); R.onPitch = onPitch; };
    R.goal = (side) => { const gx = side === 'H' ? 1.01 : -0.01; Object.assign(R.ball, { tx: gx, ty: 0.5 + (Math.random() - 0.5) * 0.12, v: 2.2 }); R.pos = side; R.flash = { side, t: 0 }; R.hold = 2.2; R.kick = side === 'H' ? 'A' : 'H'; };
    R.chance = (side) => { const x = side === 'H' ? 0.84 : 0.16; Object.assign(R.ball, { tx: x, ty: 0.3 + Math.random() * 0.4, v: 1.3 }); R.pos = side; R.next = 1.1; };
    R.moment = (side) => {
      // kritik an: top oyuncunun ayağına
      const me = R.me != null ? R[side][R.me] : null;
      R.pos = side;
      if (me) { Object.assign(R.ball, { tx: me.x, ty: me.y, v: 1.4 }); R.next = 1.5; }
    };
    R.stop = () => { R.run = false; };
    return R;
  },

  step(R, dt) {
    R.t += dt;
    const b = R.ball;
    // gol sonrası: santra
    if (R.hold > 0) {
      R.hold -= dt;
      if (R.hold <= 0 && R.kick) { Object.assign(b, { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 }); R.pos = R.kick; R.kick = null; R.next = 0.8; R.all.forEach((p) => { p.x = p.bx; p.y = p.by; }); }
    } else {
      R.next -= dt;
      if (R.next <= 0) Radar.pass(R);
    }
    // top hareketi
    const dx = b.tx - b.x, dy = b.ty - b.y, d = Math.hypot(dx, dy);
    const sp = b.v * dt;
    if (d > sp) { b.x += (dx / d) * sp; b.y += (dy / d) * sp; } else { b.x = b.tx; b.y = b.ty; }
    // oyuncular: blok top tarafına kayar, en yakın iki kişi topa basar
    const press = (team) => {
      const att = team[0].side === R.pos;
      const dir = team[0].side === 'H' ? 1 : -1;
      const shiftX = (b.x - 0.5) * 0.55 + (att ? 0.06 : -0.05) * dir;
      const shiftY = (b.y - 0.5) * 0.35;
      const near = team.slice(1).map((p) => [Math.hypot(p.x - b.x, p.y - b.y), p]).sort((a, c) => a[0] - c[0]);
      team.forEach((p) => {
        let tx = p.i === 0 ? U.clamp(p.bx + (b.x - 0.5) * 0.06, 0.02, 0.98) : p.bx + shiftX * (p.i <= 4 ? 0.8 : 1);
        let ty = p.i === 0 ? 0.5 + (b.y - 0.5) * 0.25 : p.by + shiftY;
        if (p.i && (p === near[0][1] || (!att && p === near[1][1]))) { tx = b.x - dir * 0.015; ty = b.y; }
        tx += Math.sin(R.t * 1.3 + p.ph) * 0.008; ty += Math.cos(R.t * 1.1 + p.ph) * 0.012;
        tx = U.clamp(tx, 0.015, 0.985); ty = U.clamp(ty, 0.04, 0.96);
        const k = Math.min(1, dt * (p === near[0][1] ? 3.5 : 1.6));
        p.x += (tx - p.x) * k; p.y += (ty - p.y) * k;
      });
    };
    press(R.H); press(R.A);
    if (R.flash) { R.flash.t += dt; if (R.flash.t > 2.4) R.flash = null; }
  },

  // topa sahip takım ileri ya da yana pas verir; arada top kaybı olur
  pass(R) {
    const team = R[R.pos], dir = R.pos === 'H' ? 1 : -1, b = R.ball;
    const keep = 0.72 + (R.pos === 'H' ? R.bias : -R.bias) * 0.4;
    if (Math.random() > keep) R.pos = R.pos === 'H' ? 'A' : 'H';
    const t2 = R[R.pos], d2 = R.pos === 'H' ? 1 : -1;
    const cands = t2.filter((p) => p.i && (p.x - b.x) * d2 > -0.12);
    const to = (cands.length ? cands : t2)[Math.floor(Math.random() * (cands.length || t2.length))];
    Object.assign(b, { tx: to.x + d2 * 0.01, ty: to.y, v: 0.5 + Math.random() * 0.45 });
    R.next = 0.6 + Math.random() * 0.9;
    void team; void dir;
  },

  draw(R) {
    const c = R.ctx, w = R.w, h = R.h, d = R.dpr, o = R.o;
    c.setTransform(d, 0, 0, d, 0, 0);
    // saha
    const pad = 6, W = w - pad * 2, H = h - pad * 2;
    const X = (x) => pad + x * W, Y = (y) => pad + y * H;
    c.fillStyle = o.street ? '#b9945c' : '#2f7d3a'; c.fillRect(0, 0, w, h);
    if (!o.street) { c.fillStyle = 'rgba(255,255,255,0.05)'; for (let i = 0; i < 10; i += 2) c.fillRect(X(i / 10), pad, W / 10, H); }
    c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 1;
    c.strokeRect(X(0), Y(0), W, H);
    c.beginPath(); c.moveTo(X(0.5), Y(0)); c.lineTo(X(0.5), Y(1)); c.stroke();
    c.beginPath(); c.arc(X(0.5), Y(0.5), H * 0.17, 0, Math.PI * 2); c.stroke();
    c.strokeRect(X(0), Y(0.22), W * 0.14, H * 0.56); c.strokeRect(X(0.86), Y(0.22), W * 0.14, H * 0.56);
    c.strokeRect(X(0) - 3, Y(0.42), 3, H * 0.16); c.strokeRect(X(1), Y(0.42), 3, H * 0.16);
    // gol parlaması
    if (R.flash) {
      const a = Math.max(0, 1 - R.flash.t / 2.4), gx = R.flash.side === 'H' ? X(1) : X(0);
      const g = c.createRadialGradient(gx, Y(0.5), 2, gx, Y(0.5), H * 0.9);
      g.addColorStop(0, `rgba(255,214,64,${0.75 * a})`); g.addColorStop(1, 'rgba(255,214,64,0)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
    }
    // oyuncular
    const r = Math.max(3, Math.min(5, H / 22));
    const dot = (p, col, rim) => {
      c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.arc(X(p.x) + 1, Y(p.y) + 1.2, r, 0, Math.PI * 2); c.fill();
      c.fillStyle = col; c.beginPath(); c.arc(X(p.x), Y(p.y), r, 0, Math.PI * 2); c.fill();
      c.strokeStyle = rim; c.lineWidth = 1.2; c.stroke();
    };
    R.H.forEach((p) => dot(p, p.i === 0 ? o.hk : o.hc, o.hr));
    R.A.forEach((p) => dot(p, p.i === 0 ? o.ak : o.ac, o.ar));
    // oyuncunun kendisi: parlayan halka
    if (R.me != null && R.onPitch) {
      const me = R[o.meSide][R.me];
      const pulse = 0.5 + 0.5 * Math.sin(R.t * 5);
      c.strokeStyle = `rgba(255,214,64,${0.55 + 0.45 * pulse})`; c.lineWidth = 2;
      c.beginPath(); c.arc(X(me.x), Y(me.y), r + 2.5 + pulse * 1.5, 0, Math.PI * 2); c.stroke();
      if (h > 80) { c.font = '700 9px "Barlow Semi Condensed", sans-serif'; c.textAlign = 'center'; c.fillStyle = '#ffd640'; c.fillText(String(o.num), X(me.x), Y(me.y) - r - 5); }
    }
    // top
    c.fillStyle = '#fff'; c.beginPath(); c.arc(X(R.ball.x), Y(R.ball.y), Math.max(2.2, r * 0.6), 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 0.8; c.stroke();
  },
};
