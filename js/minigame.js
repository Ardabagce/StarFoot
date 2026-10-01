// Maç içi mini oyunlar: sapan tarzı şut/pas sahnesi ve zamanlama barı

const PITCH = { W: 52, Y0: -3, Y1: 34, PX: 15, GOAL_W: 3.66, BAR: 2.44 };

const Scenes = {
  // type: open | deep | close | freekick | penalty
  make(type, o) {
    const s = o.skill;
    const sc = { type, defenders: [], mates: [], keeper: { x: 0, y: 0.7 }, ball: null, timeLimit: 0, creep: 0 };
    const mateNames = U.shuffle(o.mates || []);
    const free = (x, y, minD = 2.2) =>
      Math.abs(x) < 24 && y > 1.5 && y < 33 &&
      [sc.ball, ...sc.defenders, ...sc.mates].every((e) => !e || Math.hypot(e.x - x, e.y - y) > minD);

    const place = (gen, minD) => {
      for (let i = 0; i < 60; i++) {
        const [x, y] = gen();
        if (free(x, y, minD)) return [x, y];
      }
      return null;
    };

    if (type === 'penalty') {
      sc.ball = { x: 0, y: 11 };
      sc.timeLimit = 12;
      return sc;
    }

    if (type === 'freekick') {
      const dist = U.rand(18, 27);
      const ang = U.rand(-0.6, 0.6);
      sc.ball = { x: Math.sin(ang) * dist, y: Math.cos(ang) * dist };
      const dx = -sc.ball.x / dist, dy = -sc.ball.y / dist; // kaleye yön
      const n = 3 + (dist < 22 ? 1 : 0) + (s > 0.6 ? 1 : 0);
      const cx = sc.ball.x + dx * 9.15, cy = sc.ball.y + dy * 9.15;
      const px = -dy, py = dx; // duvar doğrultusu
      const shift = (sc.ball.x > 0 ? 1 : -1) * 0.5;
      for (let i = 0; i < n; i++) {
        const off = (i - (n - 1) / 2) * 0.7 + shift;
        sc.defenders.push({ x: cx + px * off, y: cy + py * off, h: 2.15, wall: true });
      }
      sc.keeper.x = U.clamp(-sc.ball.x * 0.08, -1.5, 1.5);
      sc.timeLimit = 15;
      return sc;
    }

    // açık oyun sahneleri
    if (type === 'close') sc.ball = { x: U.rand(-9, 9), y: U.rand(8, 13) };
    else if (type === 'deep') sc.ball = { x: U.rand(-12, 12), y: U.rand(28, 32) };
    else sc.ball = { x: U.rand(-15, 15), y: o.position === 'FW' ? U.rand(14, 24) : U.rand(18, 28) };

    const nPress = type === 'close' ? 1 : 1 + (s > 0.35 ? 1 : 0) + (s > 0.7 ? 1 : 0);
    for (let i = 0; i < nPress; i++) {
      const p = place(() => {
        const a = type === 'close' ? U.pick([-1, 1]) * U.rand(1.2, 2.2) + Math.PI / 2 : U.rand(-1.0, 1.0) - Math.PI / 2;
        const d = type === 'close' ? U.rand(2.6, 4) : U.rand(4, 7);
        return [sc.ball.x + Math.cos(a) * d, sc.ball.y + Math.sin(a) * d];
      }, 2.5);
      if (p) sc.defenders.push({ x: p[0], y: p[1], h: 1.9, presser: true });
    }

    const nMates = type === 'close' ? 1 : type === 'deep' ? 3 : 2 + (o.position === 'MF' ? 1 : 0);
    for (let i = 0; i < nMates; i++) {
      const p = place(() => {
        if (type === 'deep') return [U.rand(-20, 20), U.rand(12, sc.ball.y - 7)];
        const ymin = Math.max(4, sc.ball.y - 18);
        return [U.rand(-19, 19), U.rand(ymin, Math.max(ymin + 2, sc.ball.y - 3))];
      }, 4.5);
      if (p) {
        sc.mates.push({ x: p[0], y: p[1], name: mateNames[i] || 'Takım arkadaşı' });
        if (U.chance(0.45 + 0.35 * s)) {
          const m = place(() => [p[0] + U.rand(-1.8, 1.8), p[1] - U.rand(1.2, 2.6)], 1.2);
          if (m) sc.defenders.push({ x: m[0], y: m[1], h: 1.9 });
        }
      }
    }
    // ceza sahası içinde bir stoper daha
    if (type === 'open' && U.chance(0.3 + 0.5 * s)) {
      const p = place(() => [U.rand(-6, 6), U.rand(4, 9)], 2);
      if (p) sc.defenders.push({ x: p[0], y: p[1], h: 1.9 });
    }
    sc.keeper.x = U.clamp(sc.ball.x * 0.15, -2, 2);
    sc.timeLimit = (type === 'close' ? 3.8 : 5) + (o.pace || 50) / 45;
    sc.creep = 0.35 + 0.75 * s;
    return sc;
  },
};

const MiniGame = {
  // Canvas sahnesini oynatır. Promise<{outcome, mate?}>
  play(host, scene, o) {
    return new Promise((resolve) => {
      const W = PITCH.W * PITCH.PX, H = (PITCH.Y1 - PITCH.Y0) * PITCH.PX;
      host.innerHTML = `
        <div class="mg">
          <canvas class="mg-canvas" width="${W}" height="${H}"></canvas>
          <div class="mg-controls">
            <label>Falso <span class="mg-val" data-v="curve">Düz</span>
              <input type="range" min="-100" max="100" value="0" step="5" data-k="curve"></label>
            <label>Yükseklik <span class="mg-val" data-v="lift">Yerden</span>
              <input type="range" min="0" max="100" value="${scene.type === 'freekick' ? 35 : 0}" step="5" data-k="lift"></label>
          </div>
          <div class="mg-help">Topun arkasına doğru <b>sürükle</b> (sapan gibi) ve <b>bırak</b>. Ok ne kadar uzunsa vuruş o kadar sert. Kaleye şut çek ya da takım arkadaşına pas ver.</div>
        </div>`;
      const cv = host.querySelector('canvas');
      const ctx = cv.getContext('2d');
      const curveIn = host.querySelector('[data-k=curve]');
      const liftIn = host.querySelector('[data-k=lift]');
      const lbl = (k) => host.querySelector(`[data-v=${k}]`);
      const upd = () => {
        const c = +curveIn.value;
        lbl('curve').textContent = c === 0 ? 'Düz' : c < 0 ? `◀ Sola ${-c}` : `Sağa ${c} ▶`;
        const l = +liftIn.value;
        lbl('lift').textContent = l === 0 ? 'Yerden' : l < 40 ? `Alçak ${l}` : `Yüksek ${l}`;
      };
      curveIn.oninput = liftIn.oninput = upd;
      upd();

      const st = o.stats;
      const s = o.skill;
      const cond = o.cond; // 0.6 .. 1.2 (yüksek = daha hatalı)
      const maxSpeed = 20 + st.shooting * 0.12 + (scene.type === 'penalty' ? 2 : 0);
      const curveMax = 2 + st.technique * 0.075;
      const angSigma = ((1 - st.technique / 100) * 4.2 + 0.4) * cond * Math.PI / 180;
      const passBonus = st.passing / 100;

      const ball = { x: scene.ball.x, y: scene.ball.y, z: 0, vx: 0, vy: 0, vz: 0, spin: 0 };
      const shooter = { x: scene.ball.x, y: scene.ball.y + 1.3 };
      const kp = scene.keeper;
      const keeper = {
        x: kp.x, y: kp.y,
        delay: 0.3 - 0.17 * s, speed: 2.1 + 2.6 * s, reach: 0.6 + 0.5 * s, dive: 0.3 + 0.55 * s,
        tx: kp.x, pen: scene.type === 'penalty',
      };
      const defs = scene.defenders.map((d) => Object.assign({}, d));
      const mates = scene.mates.map((m) => Object.assign({}, m));
      const dSpeed = 1.2 + 2.2 * s;
      const dDelay = 0.22 - 0.1 * s;

      let phase = 'aim';
      let t = 0, kickT = 0;
      MiniGame.dbg = { ball, keeper, defs, mates, scene, W, H };
      let drag = null;
      let result = null, resultText = '', resultColor = '#fff', endT = 0;
      let last = performance.now();
      let raf = 0;

      const tx = (x) => (x + PITCH.W / 2) * PITCH.PX;
      const ty = (y, z = 0) => (y - PITCH.Y0) * PITCH.PX - z * PITCH.PX * 0.8;

      const toCanvas = (e) => {
        const r = cv.getBoundingClientRect();
        return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
      };

      cv.addEventListener('pointerdown', (e) => {
        if (phase !== 'aim') return;
        cv.setPointerCapture(e.pointerId);
        const p = toCanvas(e);
        drag = { sx: p[0], sy: p[1], cx: p[0], cy: p[1] };
        e.preventDefault();
      });
      cv.addEventListener('pointermove', (e) => {
        if (!drag) return;
        const p = toCanvas(e);
        drag.cx = p[0]; drag.cy = p[1];
        e.preventDefault();
      });
      const release = (e) => {
        if (!drag || phase !== 'aim') return;
        const dx = drag.sx - drag.cx, dy = drag.sy - drag.cy;
        const len = Math.hypot(dx, dy);
        drag = null;
        if (len < 14) return;
        kick(Math.atan2(dy, dx), Math.min(1, len / 190));
      };
      cv.addEventListener('pointerup', release);
      cv.addEventListener('pointercancel', () => (drag = null));

      function kick(ang, power) {
        const a = ang + U.gauss() * angSigma * (0.6 + 0.5 * power);
        const lift = +liftIn.value / 100;
        let sp = power * maxSpeed * (1 + U.gauss() * 0.04 * cond);
        const theta = lift * 0.62 * (1 + U.gauss() * 0.05 * cond);
        ball.vx = Math.cos(a) * sp * Math.cos(theta);
        ball.vy = Math.sin(a) * sp * Math.cos(theta);
        ball.vz = sp * Math.sin(theta);
        ball.spin = (-(+curveIn.value) / 100) * curveMax * (1 + U.gauss() * 0.1 * cond);
        phase = 'fly';
        kickT = t;
        if (keeper.pen) {
          const side = U.weighted([-1, 0, 1], (v) => (v === 0 ? 0.2 : 0.4));
          keeper.tx = side * U.rand(1.6, 3.0);
          keeper.delay = 0.08;
          keeper.speed = 4.5 + 2.2 * s;
          keeper.reach = 0.8 + 0.35 * s;
        }
        curveIn.disabled = liftIn.disabled = true;
      }

      function finish(outcome, text, color, extra) {
        if (result) return;
        result = Object.assign({ outcome }, extra || {});
        resultText = text;
        resultColor = color;
        phase = 'done';
        endT = t;
      }

      function step(dt) {
        t += dt;
        if (phase === 'aim') {
          // baskı yapan rakipler yaklaşır
          if (scene.creep) {
            defs.forEach((d) => {
              if (!d.presser) return;
              const dx = ball.x - d.x, dy = ball.y - d.y, dist = Math.hypot(dx, dy);
              if (dist > 0.01) { d.x += (dx / dist) * scene.creep * dt; d.y += (dy / dist) * scene.creep * dt; }
              if (dist < 1.05) finish('lost', 'TOPU KAPTIRDIN!', '#ff6b6b');
            });
          }
          if (t > scene.timeLimit) finish('lost', scene.creep ? 'TOPU KAPTIRDIN!' : 'SÜRE DOLDU!', '#ff6b6b');
          // kaleci pozisyon alır
          keeper.x += (U.clamp(ball.x * 0.15, -2, 2) - keeper.x) * Math.min(1, dt * 2);
          return;
        }
        if (phase !== 'fly') return;
        const ft = t - kickT;
        const prevY = ball.y;
        // falso
        const hs = Math.hypot(ball.vx, ball.vy);
        if (hs > 3) {
          const lx = ball.vy / hs, ly = -ball.vx / hs;
          const f = ball.z > 0.05 ? 1 : 0.45;
          ball.vx += lx * ball.spin * f * dt;
          ball.vy += ly * ball.spin * f * dt;
        }
        if (ball.z > 0 || ball.vz > 0) {
          ball.vz -= 9.8 * dt;
          ball.vx *= 1 - 0.1 * dt; ball.vy *= 1 - 0.1 * dt;
        } else {
          const ns = Math.max(0, hs - 3.2 * dt);
          if (hs > 0) { ball.vx *= ns / hs; ball.vy *= ns / hs; }
          ball.spin *= 1 - 1.5 * dt;
        }
        ball.x += ball.vx * dt; ball.y += ball.vy * dt; ball.z += ball.vz * dt;
        if (ball.z < 0) {
          ball.z = 0;
          ball.vz = ball.vz < -1.5 ? -ball.vz * 0.4 : 0;
        }

        // kaleci
        if (ft > keeper.delay) {
          let target = keeper.tx;
          if (!keeper.pen) {
            target = keeper.x;
            if (ball.vy < -0.5) target = ball.x + ball.vx * ((ball.y - keeper.y) / -ball.vy);
            keeper.tx = U.clamp(target, -4.2, 4.2);
          }
          const d = keeper.tx - keeper.x;
          keeper.x += Math.sign(d) * Math.min(Math.abs(d), keeper.speed * dt);
        }
        // savunmacılar
        defs.forEach((d) => {
          if (d.wall || ft < dDelay) return;
          const px = ball.x + ball.vx * 0.25, py = ball.y + ball.vy * 0.25;
          const dx = px - d.x, dy = py - d.y, dist = Math.hypot(dx, dy);
          if (dist > 0.05) { d.x += (dx / dist) * dSpeed * dt; d.y += (dy / dist) * dSpeed * dt; }
        });

        // çarpışmalar
        for (const d of defs) {
          if (Math.hypot(ball.x - d.x, ball.y - d.y) < 0.62 && ball.z < d.h) {
            return finish('blocked', d.wall ? 'BARAJA ÇARPTI!' : 'RAKİP ARAYA GİRDİ!', '#ff6b6b');
          }
        }
        for (const m of mates) {
          const rr = 1.15 + passBonus * 0.5;
          if (Math.hypot(ball.x - m.x, ball.y - m.y) < rr && ball.z < 1.9 && hs < 31) {
            return finish('received', `PAS ${m.name.toUpperCase()}'A ULAŞTI!`, '#7cf0a0', { mate: m.name, mateY: m.y, mateX: m.x });
          }
        }
        // kaleci kurtarışı
        const reach = keeper.reach + (ball.y < 5 ? keeper.dive : 0);
        if (prevY >= keeper.y && ball.y < keeper.y) {
          const maxZ = 2.25 + 0.35 * s;
          const r = ball.z > 1.7 ? reach * 0.8 : reach;
          if (Math.abs(ball.x - keeper.x) < r && ball.z < maxZ) {
            return finish('saved', 'KALECİ KURTARDI!', '#ffd166');
          }
        }
        if (ball.y < 6 && ball.y > keeper.y && Math.hypot(ball.x - keeper.x, ball.y - keeper.y) < 1.0 && ball.z < 2.3 && hs < 9) {
          return finish(scene.mates.length ? 'claimed' : 'saved', 'KALECİ TOPU TOPLADI', '#ffd166');
        }
        // gol çizgisi
        if (ball.y <= 0) {
          const ax = Math.abs(ball.x);
          if (ax < PITCH.GOAL_W - 0.11 && ball.z < PITCH.BAR - 0.11) return finish('goal', 'GOOOL!', '#7cf0a0');
          if (ax < PITCH.GOAL_W + 0.15 && ball.z < PITCH.BAR + 0.15) {
            return finish(ax >= PITCH.GOAL_W - 0.11 ? 'post' : 'bar', ax >= PITCH.GOAL_W - 0.11 ? 'DİREKTEN DÖNDÜ!' : 'ÜST DİREK!', '#ff6b6b');
          }
          return finish('miss', 'AUTA GİTTİ', '#ff6b6b');
        }
        if (Math.abs(ball.x) > 26 || ball.y > 34) return finish('miss', 'TOP OYUN ALANI DIŞINDA', '#ff6b6b');
        if (hs < 0.4 && ball.z === 0) return finish('lost', 'TOP RAKİBE GEÇTİ', '#ff6b6b');
        if (ft > 5) return finish('lost', 'TOP RAKİBE GEÇTİ', '#ff6b6b');
      }

      function drawPlayer(x, y, fill, stroke, label) {
        const sx = tx(x), sy = ty(y);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath(); ctx.ellipse(sx, sy + 3, 9, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = fill; ctx.strokeStyle = stroke; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(sx, sy - 6, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        if (label) {
          ctx.font = 'bold 11px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = 'rgba(0,0,0,0.55)';
          const w = ctx.measureText(label).width + 8;
          ctx.fillRect(sx - w / 2, sy - 30, w, 15);
          ctx.fillStyle = '#fff';
          ctx.fillText(label, sx, sy - 19);
        }
      }

      function draw() {
        // çim
        for (let y = PITCH.Y0; y < PITCH.Y1; y += 3) {
          ctx.fillStyle = Math.floor((y + 30) / 3) % 2 ? '#2f8a3e' : '#349645';
          ctx.fillRect(0, ty(y), W, 3 * PITCH.PX + 1);
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, ty(0)); ctx.lineTo(W, ty(0));
        ctx.rect(tx(-20.16), ty(0), 40.32 * PITCH.PX, 16.5 * PITCH.PX);
        ctx.rect(tx(-9.16), ty(0), 18.32 * PITCH.PX, 5.5 * PITCH.PX);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(tx(0), ty(11), 9.15 * PITCH.PX, Math.asin(5.5 / 9.15), Math.PI - Math.asin(5.5 / 9.15));
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(tx(0), ty(11), 2.5, 0, Math.PI * 2); ctx.fill();
        // file
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(tx(-3.66), ty(-2, 0), 7.32 * PITCH.PX, 2 * PITCH.PX);
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1;
        for (let x = -3.66; x <= 3.66; x += 0.6) { ctx.beginPath(); ctx.moveTo(tx(x), ty(-2)); ctx.lineTo(tx(x), ty(0, PITCH.BAR)); ctx.stroke(); }

        // gölgeler ve oyuncular (y sırasına göre)
        const ents = [];
        ents.push({ y: keeper.y, d: () => drawPlayer(keeper.x, keeper.y, '#f4d03f', '#222', null) });
        defs.forEach((d) => ents.push({ y: d.y, d: () => drawPlayer(d.x, d.y, o.oppColor, o.oppColor2, null) }));
        mates.forEach((m) => ents.push({ y: m.y, d: () => drawPlayer(m.x, m.y, o.ownColor, o.ownColor2, m.name.split(' ').slice(-1)[0]) }));
        if (phase === 'aim' || t - kickT < 0.4) ents.push({ y: shooter.y, d: () => drawPlayer(shooter.x, shooter.y, o.ownColor, '#fff', 'SEN') });
        ents.sort((a, b) => a.y - b.y).forEach((e) => e.d());

        // kale çerçevesi
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(tx(-3.66), ty(0)); ctx.lineTo(tx(-3.66), ty(0, PITCH.BAR));
        ctx.lineTo(tx(3.66), ty(0, PITCH.BAR)); ctx.lineTo(tx(3.66), ty(0));
        ctx.stroke();

        // top
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.ellipse(tx(ball.x), ty(ball.y), 5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
        const br = 5 + ball.z * 0.6;
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(tx(ball.x), ty(ball.y, ball.z), br, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        // nişan oku
        if (phase === 'aim' && drag) {
          const dx = drag.sx - drag.cx, dy = drag.sy - drag.cy;
          const len = Math.hypot(dx, dy);
          const pw = Math.min(1, len / 190);
          if (len > 6) {
            const a = Math.atan2(dy, dx);
            const L = 40 + pw * 160;
            const bx = tx(ball.x), by = ty(ball.y);
            const ex = bx + Math.cos(a) * L, ey = by + Math.sin(a) * L;
            const c = +curveIn.value / 100;
            const mx = (bx + ex) / 2 + Math.sin(a) * c * L * 0.25, my = (by + ey) / 2 - Math.cos(a) * c * L * 0.25;
            const col = `hsl(${120 - pw * 120}, 90%, 55%)`;
            ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo(mx, my, ex, ey); ctx.stroke();
            const ha = Math.atan2(ey - my, ex - mx);
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.moveTo(ex + Math.cos(ha) * 10, ey + Math.sin(ha) * 10);
            ctx.lineTo(ex + Math.cos(ha + 2.4) * 12, ey + Math.sin(ha + 2.4) * 12);
            ctx.lineTo(ex + Math.cos(ha - 2.4) * 12, ey + Math.sin(ha - 2.4) * 12);
            ctx.fill();
            ctx.font = 'bold 13px system-ui, sans-serif'; ctx.textAlign = 'left';
            ctx.fillStyle = '#fff';
            ctx.fillText(`Güç %${Math.round(pw * 100)}`, 12, H - 14);
          }
        }
        // süre çubuğu
        if (phase === 'aim') {
          const rem = U.clamp(1 - t / scene.timeLimit, 0, 1);
          ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(W - 170, H - 24, 158, 12);
          ctx.fillStyle = rem > 0.35 ? '#7cf0a0' : '#ff6b6b'; ctx.fillRect(W - 170, H - 24, 158 * rem, 12);
          ctx.font = '11px system-ui, sans-serif'; ctx.fillStyle = '#fff'; ctx.textAlign = 'right';
          ctx.fillText(scene.creep ? 'Rakip baskısı' : 'Süre', W - 175, H - 14);
        }
        if (phase === 'done') {
          ctx.fillStyle = 'rgba(0,0,0,0.45)';
          ctx.fillRect(0, H / 2 - 40, W, 80);
          ctx.font = 'bold 40px system-ui, sans-serif'; ctx.textAlign = 'center';
          ctx.fillStyle = resultColor;
          ctx.fillText(resultText, W / 2, H / 2 + 14);
        }
      }

      function loop(now) {
        let dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const n = Math.ceil(dt / (1 / 240));
        for (let i = 0; i < n && phase !== 'done'; i++) step(dt / n);
        if (phase === 'done') t += dt;
        draw();
        if (phase === 'done' && t - endT > 1.5) {
          cancelAnimationFrame(raf);
          resolve(result);
          return;
        }
        raf = requestAnimationFrame(loop);
      }
      raf = requestAnimationFrame(loop);

      MiniGame._abort = () => {
        cancelAnimationFrame(raf);
        phase = 'done';
        resolve({ outcome: 'auto' });
      };
    });
  },

  // Zamanlama barı: top kapma, çalım, kafa vuruşu
  timing(host, o) {
    return new Promise((resolve) => {
      const rounds = o.rounds || 1;
      let round = 0;
      host.innerHTML = `
        <div class="tb">
          <div class="tb-title">${U.esc(o.title)}</div>
          <div class="tb-desc">${U.esc(o.desc)}</div>
          <div class="tb-rounds"></div>
          <div class="tb-bar"><div class="tb-y"></div><div class="tb-g"></div><div class="tb-m"></div></div>
          <button class="btn btn-big tb-btn">${U.esc(o.button || 'ŞİMDİ!')}</button>
          <div class="tb-res"></div>
        </div>`;
      const bar = host.querySelector('.tb-bar');
      const g = host.querySelector('.tb-g'), y = host.querySelector('.tb-y'), m = host.querySelector('.tb-m');
      const res = host.querySelector('.tb-res');
      const roundsEl = host.querySelector('.tb-rounds');
      const btn = host.querySelector('.tb-btn');
      let pos = 0, dir = 1, center = 0.5, done = false, raf = 0, last = performance.now(), waiting = false;
      let partial = false;

      const setup = () => {
        center = U.rand(0.25, 0.75);
        g.style.left = (center - o.green / 2) * 100 + '%';
        g.style.width = o.green * 100 + '%';
        y.style.left = (center - o.green / 2 - o.yellow) * 100 + '%';
        y.style.width = (o.green + o.yellow * 2) * 100 + '%';
        pos = U.chance(0.5) ? 0 : 1; dir = pos ? -1 : 1;
        roundsEl.innerHTML = rounds > 1 ? Array.from({ length: rounds }, (_, i) => `<span class="dot ${i < round ? 'ok' : ''}"></span>`).join('') : '';
        waiting = false;
      };
      const loop = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (!waiting) {
          pos += dir * o.speed * dt;
          if (pos > 1) { pos = 1; dir = -1; }
          if (pos < 0) { pos = 0; dir = 1; }
          m.style.left = pos * 100 + '%';
        }
        if (!done) raf = requestAnimationFrame(loop);
      };
      const end = (r) => {
        done = true;
        cancelAnimationFrame(raf);
        document.removeEventListener('keydown', key);
        setTimeout(() => resolve({ result: r }), 1100);
      };
      const press = () => {
        if (done || waiting) return;
        const d = Math.abs(pos - center);
        if (d <= o.green / 2) {
          round++;
          res.textContent = round >= rounds ? (o.okText || 'BAŞARILI!') : 'Güzel! Devam...';
          res.className = 'tb-res ok';
          if (round >= rounds) { roundsEl.innerHTML = Array.from({ length: rounds }, () => '<span class="dot ok"></span>').join(''); return end(partial ? 'partial' : 'success'); }
          waiting = true;
          setTimeout(setup, 450);
        } else if (d <= o.green / 2 + o.yellow) {
          res.textContent = o.partialText || 'Yarım kaldı...';
          res.className = 'tb-res mid';
          if (o.partialEnds !== false) return end('partial');
          partial = true; round++;
          if (round >= rounds) return end('partial');
          waiting = true;
          setTimeout(setup, 450);
        } else {
          res.textContent = o.failText || 'BAŞARISIZ!';
          res.className = 'tb-res bad';
          end('fail');
        }
      };
      const key = (e) => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); press(); } };
      btn.onclick = press;
      bar.onpointerdown = press;
      document.addEventListener('keydown', key);
      setup();
      raf = requestAnimationFrame(loop);
      MiniGame._abort = () => {
        if (done) return;
        done = true;
        cancelAnimationFrame(raf);
        document.removeEventListener('keydown', key);
        resolve({ result: 'auto' });
      };
    });
  },
};
