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


// Vuruş tipleri (yükseklik)
const LIFTS = [
  { k: 'low', l: 'Yerden', d: 'Sert ve alçak', v: 0 },
  { k: 'mid', l: 'Yarım Yükseklik', d: 'Savunmanın üstünden', v: 0.24 },
  { k: 'chip', l: 'Aşırtma', d: 'Kalecinin üstünden', v: 0.6 },
];

// Topun fiziği: hem gerçek vuruşta hem de nişan önizlemesinde kullanılır
const BallPhys = {
  step(b, dt) {
    const hs = Math.hypot(b.vx, b.vy);
    if (hs > 3) {
      const lx = b.vy / hs, ly = -b.vx / hs;
      const f = b.z > 0.05 ? 1 : 0.45;
      b.vx += lx * b.spin * f * dt;
      b.vy += ly * b.spin * f * dt;
    }
    if (b.z > 0 || b.vz > 0) {
      b.vz -= 9.8 * dt;
      b.vx *= 1 - 0.1 * dt; b.vy *= 1 - 0.1 * dt;
    } else {
      const ns = Math.max(0, hs - 3.2 * dt);
      if (hs > 0) { b.vx *= ns / hs; b.vy *= ns / hs; }
      b.spin *= 1 - 1.5 * dt;
    }
    b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt;
    if (b.z < 0) { b.z = 0; b.vz = b.vz < -1.5 ? -b.vz * 0.4 : 0; }
    return hs;
  },
  launch(b, ang, speed, lift, spin) {
    const theta = lift * 0.62;
    b.vx = Math.cos(ang) * speed * Math.cos(theta);
    b.vy = Math.sin(ang) * speed * Math.cos(theta);
    b.vz = speed * Math.sin(theta);
    b.spin = spin;
  },
};

const MiniGame = {
  seen: 0,

  // Kaydırarak şut / dokunarak pas sahnesi. Promise<{outcome, mate?}>
  play(host, scene, o) {
    return new Promise((resolve) => {
      // Kamera: top, kale ve oyuncuları kapsayan bölgeye yakınlaş
      const narrow = (host.clientWidth || 800) < 600;
      const pts = [scene.ball, ...scene.defenders, ...scene.mates, { x: -6, y: 0 }, { x: 6, y: 0 }];
      let vx0 = Math.min(...pts.map((e) => e.x)) - 4, vx1 = Math.max(...pts.map((e) => e.x)) + 4;
      const VY0 = PITCH.Y0, vy1 = Math.min(PITCH.Y1, Math.max(14, Math.max(...pts.map((e) => e.y)) + 4));
      const minW = Math.max(narrow ? 20 : 30, (vy1 - VY0) * (narrow ? 0.75 : 1.25));
      if (vx1 - vx0 < minW) { const c = (vx0 + vx1) / 2; vx0 = c - minW / 2; vx1 = c + minW / 2; }
      if (vx0 < -PITCH.W / 2) { vx1 += -PITCH.W / 2 - vx0; vx0 = -PITCH.W / 2; }
      if (vx1 > PITCH.W / 2) { vx0 -= vx1 - PITCH.W / 2; vx1 = PITCH.W / 2; }
      vx0 = Math.max(vx0, -PITCH.W / 2);
      const W = 780;
      const PX = W / (vx1 - vx0);
      const H = Math.round((vy1 - VY0) * PX);
      const k = U.clamp(PX / 15, 1, 2.2); // oyuncu/top boyut çarpanı
      const defLift = scene.type === 'freekick' ? 1 : 0;
      host.innerHTML = `
        <div class="mg">
          <div class="mg-stage">
            <canvas class="mg-canvas" width="${W}" height="${H}"></canvas>
          </div>
          <div class="mg-bar">
            <div class="mg-lift" role="group" aria-label="Vuruş tipi">
              ${LIFTS.map((l, i) => `<button type="button" data-lift="${i}" class="${i === defLift ? 'on' : ''}"><b>${l.l}</b><small>${l.d}</small></button>`).join('')}
            </div>
          </div>
          <div class="mg-help">
            <span><i>☝️</i> Topu hedefe doğru <b>kaydır</b></span>
            <span><i>↪️</i> Kavisli çizersen <b>falso</b></span>
            ${scene.mates.length ? '<span><i>👆</i> Pas için arkadaşına <b>dokun</b></span>' : ''}
          </div>
        </div>`;
      const cv = host.querySelector('canvas');
      const ctx = cv.getContext('2d');
      let liftIdx = defLift;
      const liftBtns = U.$$('[data-lift]', host);
      const setLift = (i) => {
        if (phase !== 'aim') return;
        liftIdx = i;
        liftBtns.forEach((b, j) => b.classList.toggle('on', j === i));
      };
      liftBtns.forEach((b) => (b.onclick = () => setLift(+b.dataset.lift)));
      const onKey = (e) => {
        if (['Digit1', 'Digit2', 'Digit3'].includes(e.code)) setLift(+e.code.slice(-1) - 1);
      };
      document.addEventListener('keydown', onKey);

      const st = o.stats;
      const s = o.skill;
      const cond = o.cond; // ~0.75 .. 1.15 (yüksek = daha hatalı)
      const maxSpeed = 20 + st.shooting * 0.12 + (scene.type === 'penalty' ? 2 : 0);
      const curveMax = 2 + st.technique * 0.075;
      const angSigma = ((1 - st.technique / 100) * 4.2 + 0.4) * cond * Math.PI / 180;
      const passSigma = ((1 - st.passing / 100) * 3.2 + 0.3) * cond * Math.PI / 180;
      const previewFrac = U.clamp(0.42 + st.technique / 170, 0.45, 1);
      const POWER_M = 15; // tam güç için gereken kaydırma (metre)

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
      let t = 0, kickT = 0, endT = 0;
      let gesture = null; // { pts:[[cx,cy]], world:[{x,y}] }
      let preview = null; // { pts, power, curve }
      let passTarget = null;
      let result = null, resultText = '', resultColor = '#fff';
      let slowmo = 1;
      let particles = [];
      let netShake = 0;
      let last = performance.now();
      let raf = 0;
      const showHint = MiniGame.seen++ < 3;
      MiniGame.dbg = { ball, keeper, defs, mates, scene, W, H, vx0, VY0, PX };

      const tx = (x) => (x - vx0) * PX;
      const ty = (y, z = 0) => (y - VY0) * PX - z * PX * 0.8;
      const toWorld = (cx, cy) => ({ x: cx / PX + vx0, y: cy / PX + VY0 });
      let fs = 1; // ekrandaki yazı ölçeği
      const toCanvas = (e) => {
        const r = cv.getBoundingClientRect();
        return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
      };

      // Kaydırma hareketinden vuruş parametreleri
      const params = (world) => {
        const a = world[0], b = world[world.length - 1];
        const cx = b.x - a.x, cy = b.y - a.y;
        const L = Math.hypot(cx, cy);
        if (L < 0.9) return null;
        let dmax = 0;
        for (const p of world) {
          const d = (cx * (p.y - a.y) - cy * (p.x - a.x)) / L;
          if (Math.abs(d) > Math.abs(dmax)) dmax = d;
        }
        const curve = U.clamp((dmax / L) * 3.2, -1, 1);
        const power = U.clamp(L / POWER_M, 0.15, 1);
        const spin = curve * curveMax;
        // Kaydırma yönü hedeftir: falsonun yana kaydırmasını telafi edecek şekilde top dışa doğru çıkar
        const chord = Math.atan2(cy, cx);
        const dirY = Math.sin(chord);
        const dist = dirY < -0.15 ? Math.min(ball.y / -dirY, 40) : 20;
        const speed = power * maxSpeed;
        const comp = U.clamp((0.55 * spin * dist) / (speed * speed), -0.5, 0.5);
        return { ang: chord + comp, power, curve, spin };
      };

      const simulate = (pr) => {
        const b = { x: ball.x, y: ball.y, z: 0, vx: 0, vy: 0, vz: 0, spin: 0 };
        BallPhys.launch(b, pr.ang, pr.power * maxSpeed, LIFTS[liftIdx].v, pr.spin);
        const pts = [];
        for (let i = 0; i < 180; i++) {
          for (let k = 0; k < 4; k++) BallPhys.step(b, 1 / 240);
          pts.push([b.x, b.y, b.z]);
          if (b.y < -0.5 || Math.abs(b.x) > 26 || b.y > 34) break;
          if (Math.hypot(b.vx, b.vy) < 0.5 && b.z === 0) break;
        }
        return pts;
      };

      const mateAt = (w) => mates.find((m) => Math.hypot(m.x - w.x, m.y - w.y) < 2.2);

      cv.addEventListener('pointerdown', (e) => {
        if (phase !== 'aim') return;
        cv.setPointerCapture(e.pointerId);
        const p = toCanvas(e);
        gesture = { pts: [p], world: [toWorld(p[0], p[1])], t0: performance.now() };
        preview = null;
        e.preventDefault();
      });
      cv.addEventListener('pointermove', (e) => {
        if (!gesture) return;
        const p = toCanvas(e);
        const lp = gesture.pts[gesture.pts.length - 1];
        if (Math.hypot(p[0] - lp[0], p[1] - lp[1]) < 3) return;
        gesture.pts.push(p);
        gesture.world.push(toWorld(p[0], p[1]));
        const pr = params(gesture.world);
        preview = pr ? Object.assign(pr, { pts: simulate(pr) }) : null;
        e.preventDefault();
      });
      cv.addEventListener('pointerup', (e) => {
        if (!gesture || phase !== 'aim') return;
        const g = gesture;
        gesture = null;
        const p0 = g.pts[0], p1 = g.pts[g.pts.length - 1];
        const moved = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
        if (moved < 12) {
          const m = mateAt(g.world[0]);
          if (m) return passTo(m);
          preview = null;
          return;
        }
        const pr = params(g.world);
        preview = null;
        if (pr) kick(pr.ang, pr.power, pr.spin, false);
      });
      cv.addEventListener('pointercancel', () => { gesture = null; preview = null; });

      function passTo(m) {
        // ileriye doğru hafif önden pas
        const tgx = m.x, tgy = m.y - 0.6;
        const D = Math.hypot(tgx - ball.x, tgy - ball.y);
        const lift = LIFTS[liftIdx].v;
        let speed;
        if (lift === 0) speed = Math.sqrt(9.5 * 9.5 + 2 * 3.2 * D);
        else {
          // havadan pas: menzile göre hız
          const th = lift * 0.62;
          speed = Math.sqrt((D * 9.8) / Math.max(0.2, Math.sin(2 * th))) * 0.92;
        }
        speed = Math.min(speed, maxSpeed);
        passTarget = m;
        kick(Math.atan2(tgy - ball.y, tgx - ball.x), speed / maxSpeed, 0, true);
      }

      function kick(ang, power, spin, isPass) {
        const sig = isPass ? passSigma : angSigma * (0.6 + 0.5 * power);
        const a = ang + U.gauss() * sig;
        const sp = power * maxSpeed * (1 + U.gauss() * 0.04 * cond);
        BallPhys.launch(ball, a, sp, LIFTS[liftIdx].v * (1 + U.gauss() * 0.05 * cond), spin * (1 + U.gauss() * 0.1 * cond));
        phase = 'fly';
        kickT = t;
        if (keeper.pen) {
          const side = U.weighted([-1, 0, 1], (v) => (v === 0 ? 0.2 : 0.4));
          keeper.tx = side * U.rand(1.6, 3.0);
          keeper.delay = 0.08;
          keeper.speed = 4.5 + 2.2 * s;
          keeper.reach = 0.8 + 0.35 * s;
        }
        host.querySelector('.mg-lift').classList.add('locked');
      }

      function finish(outcome, text, color, extra) {
        if (result) return;
        result = Object.assign({ outcome }, extra || {});
        resultText = text;
        resultColor = color;
        phase = 'done';
        endT = t;
        slowmo = 1;
        if (outcome === 'goal') {
          netShake = 1;
          const cols = [o.ownColor, o.ownColor2, '#ffffff', '#ffd166'];
          for (let i = 0; i < 70; i++) {
            particles.push({ x: tx(ball.x), y: ty(0, 1.2), vx: U.rand(-260, 260), vy: U.rand(-380, -60), c: U.pick(cols), r: U.rand(2, 5), life: U.rand(1, 1.8) });
          }
          try { if (navigator.vibrate) navigator.vibrate(120); } catch (e) { /* yok */ }
        }
      }

      function step(dt) {
        t += dt;
        if (phase === 'aim') {
          if (scene.creep) {
            defs.forEach((d) => {
              if (!d.presser) return;
              const dx = ball.x - d.x, dy = ball.y - d.y, dist = Math.hypot(dx, dy);
              if (dist > 0.01) { d.x += (dx / dist) * scene.creep * dt; d.y += (dy / dist) * scene.creep * dt; }
              if (dist < 1.05) finish('lost', 'TOPU KAPTIRDIN!', '#ff6b6b');
            });
          }
          if (t > scene.timeLimit) finish('lost', scene.creep ? 'TOPU KAPTIRDIN!' : 'SÜRE DOLDU!', '#ff6b6b');
          keeper.x += (U.clamp(ball.x * 0.15, -2, 2) - keeper.x) * Math.min(1, dt * 2);
          return;
        }
        if (phase !== 'fly') return;
        const ft = t - kickT;
        const prevY = ball.y;
        const hs = BallPhys.step(ball, dt);

        // kaleci
        if (ft > keeper.delay) {
          if (!keeper.pen) {
            let target = keeper.x;
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
        // pası bekleyen arkadaş topa doğru hareketlenir
        if (passTarget) {
          const m = passTarget;
          const dx = ball.x - m.x, dy = ball.y - m.y, dist = Math.hypot(dx, dy);
          if (dist < 8 && dist > 0.05) { m.x += (dx / dist) * 2.6 * dt; m.y += (dy / dist) * 2.6 * dt; }
        }

        for (const d of defs) {
          if (Math.hypot(ball.x - d.x, ball.y - d.y) < 0.62 && ball.z < d.h) {
            return finish('blocked', d.wall ? 'BARAJA ÇARPTI!' : 'RAKİP ARAYA GİRDİ!', '#ff6b6b');
          }
        }
        for (const m of mates) {
          const rr = 1.15 + (st.passing / 100) * 0.5 + (m === passTarget ? 0.3 : 0);
          if (Math.hypot(ball.x - m.x, ball.y - m.y) < rr && ball.z < 1.9 && hs < 31) {
            return finish('received', `PAS ${m.name.toUpperCase()}'A ULAŞTI!`, '#7cf0a0', { mate: m.name, mateY: m.y, mateX: m.x });
          }
        }
        const reach = keeper.reach + (ball.y < 5 ? keeper.dive : 0);
        if (prevY >= keeper.y && ball.y < keeper.y) {
          const maxZ = 2.25 + 0.35 * s;
          const r = ball.z > 1.7 ? reach * 0.8 : reach;
          if (Math.abs(ball.x - keeper.x) < r && ball.z < maxZ) return finish('saved', 'KALECİ KURTARDI!', '#ffd166');
        }
        if (ball.y < 6 && ball.y > keeper.y && Math.hypot(ball.x - keeper.x, ball.y - keeper.y) < 1.0 && ball.z < 2.3 && hs < 9) {
          return finish(scene.mates.length ? 'claimed' : 'saved', 'KALECİ TOPU TOPLADI', '#ffd166');
        }
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
        // gole yaklaşırken ağır çekim
        slowmo = ball.y < 7 && ball.vy < 0 && Math.abs(ball.x) < 9 && !passTarget ? 0.38 : 1;
      }

      function drawPlayer(x, y, fill, stroke, label, ring) {
        const sx = tx(x), sy = ty(y);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath(); ctx.ellipse(sx, sy + 3 * k, 10 * k, 4.5 * k, 0, 0, Math.PI * 2); ctx.fill();
        if (ring) {
          const pr = (14 + Math.sin(t * 6) * 2.5) * k;
          ctx.strokeStyle = 'rgba(124,240,160,0.9)'; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.arc(sx, sy - 6 * k, pr, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.fillStyle = fill; ctx.strokeStyle = stroke; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.arc(sx, sy - 6 * k, 8.5 * k, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        if (label) {
          ctx.font = `600 ${Math.round(11 * fs)}px system-ui, sans-serif`;
          ctx.textAlign = 'center';
          const w = ctx.measureText(label).width + 10 * fs;
          const ly = sy - 16 * k - 18 * fs;
          ctx.fillStyle = 'rgba(8,14,24,0.72)';
          roundRect(sx - w / 2, ly, w, 17 * fs, 8.5 * fs); ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.fillText(label, sx, ly + 12.5 * fs);
        }
      }

      function pill(text) {
        ctx.font = `600 ${Math.round(13 * fs)}px system-ui, sans-serif`;
        const w = ctx.measureText(text).width + 20 * fs, h = 24 * fs;
        ctx.fillStyle = 'rgba(8,14,24,0.72)';
        roundRect(W / 2 - w / 2, H - h - 10 * fs, w, h, h / 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
        ctx.fillText(text, W / 2, H - 10 * fs - h * 0.3);
      }

      function roundRect(x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
      }

      function drawPitch() {
        for (let y = PITCH.Y0; y < vy1; y += 3) {
          ctx.fillStyle = Math.floor((y + 30) / 3) % 2 ? '#2d8540' : '#33924a';
          ctx.fillRect(0, ty(y), W, 3 * PX + 1);
        }
        const vg = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.2, W / 2, H * 0.5, H * 0.95);
        vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.28)');
        ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, ty(0)); ctx.lineTo(W, ty(0));
        ctx.rect(tx(-20.16), ty(0), 40.32 * PX, 16.5 * PX);
        ctx.rect(tx(-9.16), ty(0), 18.32 * PX, 5.5 * PX);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(tx(0), ty(11), 9.15 * PX, Math.asin(5.5 / 9.15), Math.PI - Math.asin(5.5 / 9.15));
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(tx(0), ty(11), 2.5, 0, Math.PI * 2); ctx.fill();
        // file
        const sh = netShake > 0 ? Math.sin(t * 60) * 3 * netShake : 0;
        ctx.fillStyle = 'rgba(255,255,255,0.14)';
        ctx.fillRect(tx(-3.66), ty(-2) + sh, 7.32 * PX, ty(0) - ty(-2));
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1;
        for (let x = -3.66; x <= 3.67; x += 0.5) { ctx.beginPath(); ctx.moveTo(tx(x), ty(-2) + sh); ctx.lineTo(tx(x), ty(0, PITCH.BAR)); ctx.stroke(); }
        for (let y = -2; y < 0; y += 0.5) { ctx.beginPath(); ctx.moveTo(tx(-3.66), ty(y) + sh); ctx.lineTo(tx(3.66), ty(y) + sh); ctx.stroke(); }
      }

      function drawPreview() {
        if (!preview || !preview.pts.length) return;
        const pts = preview.pts;
        const n = Math.max(2, Math.floor(pts.length * previewFrac));
        const col = preview.power > 0.85 ? '255,120,90' : preview.power > 0.55 ? '255,214,102' : '124,240,160';
        // yer gölgesi
        ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 3; ctx.setLineDash([2, 6]);
        ctx.beginPath(); ctx.moveTo(tx(ball.x), ty(ball.y));
        for (let i = 0; i < n; i++) ctx.lineTo(tx(pts[i][0]), ty(pts[i][1]));
        ctx.stroke(); ctx.setLineDash([]);
        for (let i = 0; i < n; i += 3) {
          const a = 1 - (i / n) * 0.75;
          ctx.fillStyle = `rgba(${col},${a})`;
          ctx.beginPath(); ctx.arc(tx(pts[i][0]), ty(pts[i][1], pts[i][2]), 3.2 - (i / n) * 1.4, 0, Math.PI * 2); ctx.fill();
        }
        const e = pts[n - 1];
        ctx.strokeStyle = `rgba(${col},0.9)`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(tx(e[0]), ty(e[1], e[2]), 7, 0, Math.PI * 2); ctx.stroke();
      }

      function drawHud() {
        // süre çubuğu (üstte)
        if (phase === 'aim') {
          const rem = U.clamp(1 - t / scene.timeLimit, 0, 1);
          ctx.fillStyle = 'rgba(8,14,24,0.55)'; ctx.fillRect(0, 0, W, 6 * fs);
          ctx.fillStyle = rem > 0.35 ? '#7cf0a0' : '#ff6b6b'; ctx.fillRect(0, 0, W * rem, 6 * fs);
        }
        // güç halkası
        if (phase === 'aim' && preview) {
          const bx = tx(ball.x), by = ty(ball.y);
          ctx.lineWidth = 5; ctx.lineCap = 'round';
          ctx.strokeStyle = 'rgba(8,14,24,0.5)';
          ctx.beginPath(); ctx.arc(bx, by, 20 * k, 0, Math.PI * 2); ctx.stroke();
          ctx.strokeStyle = preview.power > 0.85 ? '#ff785a' : preview.power > 0.55 ? '#ffd666' : '#7cf0a0';
          ctx.beginPath(); ctx.arc(bx, by, 20 * k, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * preview.power); ctx.stroke();
          ctx.lineCap = 'butt';
          const c = preview.curve;
          const info = `Güç %${Math.round(preview.power * 100)}  •  ${Math.abs(c) < 0.12 ? 'Düz' : c > 0 ? 'Falso ◀' : 'Falso ▶'}  •  ${LIFTS[liftIdx].l}`;
          pill(info);
        }
        // parmak izi
        if (gesture && gesture.pts.length > 1) {
          ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          ctx.beginPath(); ctx.moveTo(gesture.pts[0][0], gesture.pts[0][1]);
          gesture.pts.forEach((p) => ctx.lineTo(p[0], p[1]));
          ctx.stroke(); ctx.lineCap = 'butt';
        }
        // ilk anlarda yol gösterici ipucu
        if (showHint && phase === 'aim' && !gesture && !preview) {
          const k = (t % 1.6) / 1.6;
          const bx = tx(ball.x), by = ty(ball.y);
          const gx = tx(U.clamp(ball.x * 0.3, -2.5, 2.5)), gy = ty(1);
          const hx = bx + (gx - bx) * k * 0.6, hy = by + (gy - by) * k * 0.6;
          ctx.globalAlpha = 1 - k;
          ctx.font = `${Math.round(28 * fs)}px system-ui, sans-serif`; ctx.textAlign = 'center';
          ctx.fillText('👆', hx, hy + 30 * fs);
          ctx.globalAlpha = 1;
          pill(scene.mates.length ? 'Kaleye kaydır ya da arkadaşına dokun' : 'Kaleye doğru kaydır');
        }
      }

      function draw(dt) {
        fs = U.clamp(W / (cv.clientWidth || W), 1, 2.4);
        drawPitch();
        if (phase === 'aim') drawPreview();
        const ents = [];
        ents.push({ y: keeper.y, d: () => drawPlayer(keeper.x, keeper.y, '#f4d03f', '#222', null) });
        defs.forEach((d) => ents.push({ y: d.y, d: () => drawPlayer(d.x, d.y, o.oppColor, o.oppColor2, null) }));
        mates.forEach((m) => ents.push({ y: m.y, d: () => drawPlayer(m.x, m.y, o.ownColor, o.ownColor2, m.name.split(' ').slice(-1)[0], phase === 'aim') }));
        if (phase === 'aim' || t - kickT < 0.4) ents.push({ y: shooter.y, d: () => drawPlayer(shooter.x, shooter.y, o.ownColor, '#fff', 'SEN') });
        ents.sort((a, b) => a.y - b.y).forEach((e) => e.d());

        ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(tx(-3.66), ty(0)); ctx.lineTo(tx(-3.66), ty(0, PITCH.BAR));
        ctx.lineTo(tx(3.66), ty(0, PITCH.BAR)); ctx.lineTo(tx(3.66), ty(0));
        ctx.stroke();

        // top
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.ellipse(tx(ball.x), ty(ball.y), 5.5 * k, 2.5 * k, 0, 0, Math.PI * 2); ctx.fill();
        const br = (5.5 + ball.z * 0.6) * k;
        const bx = tx(ball.x), by = ty(ball.y, ball.z);
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#222';
        ctx.beginPath(); ctx.arc(bx + Math.cos(t * 9) * br * 0.35, by + Math.sin(t * 9) * br * 0.35, br * 0.32, 0, Math.PI * 2); ctx.fill();

        drawHud();

        // konfeti
        particles.forEach((p) => {
          p.vy += 520 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
          ctx.globalAlpha = U.clamp(p.life, 0, 1);
          ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, p.r, p.r * 1.6);
        });
        ctx.globalAlpha = 1;
        particles = particles.filter((p) => p.life > 0);

        if (phase === 'done') {
          const k = U.clamp((t - endT) / 0.25, 0, 1);
          const scale = 0.6 + 0.4 * (1 - Math.pow(1 - k, 3)) + (k >= 1 ? Math.sin((t - endT) * 5) * 0.02 : 0);
          ctx.fillStyle = `rgba(8,14,24,${0.5 * k})`;
          ctx.fillRect(0, H / 2 - 46 * fs, W, 92 * fs);
          ctx.save();
          ctx.translate(W / 2, H / 2);
          ctx.scale(scale, scale);
          ctx.font = `900 ${Math.round(Math.min(46 * fs, 90))}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,0.5)';
          ctx.strokeText(resultText, 0, 0);
          ctx.fillStyle = resultColor;
          ctx.fillText(resultText, 0, 0);
          ctx.restore();
          ctx.textBaseline = 'alphabetic';
        }
        if (slowmo < 1) {
          ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 10;
          ctx.strokeRect(0, 0, W, H);
        }
      }

      function cleanup() {
        cancelAnimationFrame(raf);
        document.removeEventListener('keydown', onKey);
      }

      function loop(now) {
        const rdt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const dt = rdt * slowmo;
        const n = Math.ceil(dt / (1 / 240));
        for (let i = 0; i < n && phase !== 'done'; i++) step(dt / n);
        if (phase === 'done') t += rdt;
        netShake = Math.max(0, netShake - rdt * 1.2);
        draw(rdt);
        if (phase === 'done' && t - endT > (result.outcome === 'goal' ? 1.9 : 1.4)) {
          cleanup();
          resolve(result);
          return;
        }
        raf = requestAnimationFrame(loop);
      }
      raf = requestAnimationFrame(loop);

      MiniGame._abort = () => {
        cleanup();
        phase = 'done';
        resolve({ outcome: 'auto' });
      };
    });
  },

  // Zamanlama anı: halka küçülür, hedef çembere oturduğu anda dokun
  timing(host, o) {
    return new Promise((resolve) => {
      const rounds = o.rounds || 1;
      const W = 640, H = 300;
      host.innerHTML = `
        <div class="tg" tabindex="0">
          <canvas class="tg-canvas" width="${W}" height="${H}"></canvas>
          <div class="tg-foot"><b>${U.esc(o.button || 'Dokun')}</b> • Halka yeşil bölgeye girince ekrana dokun ya da <kbd>Boşluk</kbd> tuşuna bas</div>
        </div>`;
      const box = host.querySelector('.tg');
      const cv = host.querySelector('canvas');
      const ctx = cv.getContext('2d');
      const r0 = 38;
      const R = r0 * 3.4;
      const D = 1.55 / o.speed; // halkanın hedefe varma süresi
      const v = (R - r0) / D;
      const g = U.clamp(o.green * 130, 6, 42);
      const yw = Math.max(6, o.yellow * 130);
      const icon = o.icon || '⚽';
      let round = 0, partial = false, done = false, raf = 0, last = performance.now();
      let rt = 0, cx = W / 2, cy = H / 2, state = 'run', msg = '', msgCol = '#fff', msgT = 0, flash = 0;

      const setup = () => {
        rt = 0; state = 'run';
        cx = U.rand(W * 0.3, W * 0.7); cy = U.rand(H * 0.42, H * 0.62);
      };
      const ringR = () => R - v * rt;

      const draw = () => {
        // saha zemini
        for (let i = 0; i < 8; i++) {
          ctx.fillStyle = i % 2 ? '#2d8540' : '#33924a';
          ctx.fillRect(0, (H / 8) * i, W, H / 8 + 1);
        }
        const vg = ctx.createRadialGradient(cx, cy, 20, cx, cy, W * 0.7);
        vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.45)');
        ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
        // başlık
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff'; ctx.font = '900 24px system-ui, sans-serif';
        ctx.fillText(o.title, W / 2, 36);
        // tur noktaları
        if (rounds > 1) {
          for (let i = 0; i < rounds; i++) {
            ctx.beginPath(); ctx.arc(W / 2 + (i - (rounds - 1) / 2) * 22, 58, 6, 0, Math.PI * 2);
            ctx.fillStyle = i < round ? '#7cf0a0' : 'rgba(8,14,24,0.5)'; ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
          }
        }
        // tolerans bantları
        ctx.lineWidth = yw;
        ctx.strokeStyle = 'rgba(255,209,102,0.55)';
        ctx.beginPath(); ctx.arc(cx, cy, r0 + g + yw / 2, 0, Math.PI * 2); ctx.stroke();
        if (r0 - g - yw / 2 > 4) { ctx.beginPath(); ctx.arc(cx, cy, r0 - g - yw / 2, 0, Math.PI * 2); ctx.stroke(); }
        ctx.lineWidth = g * 2;
        ctx.strokeStyle = 'rgba(124,240,160,0.65)';
        ctx.beginPath(); ctx.arc(cx, cy, r0, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 2; ctx.strokeStyle = '#fff';
        ctx.beginPath(); ctx.arc(cx, cy, r0, 0, Math.PI * 2); ctx.stroke();
        ctx.font = '30px system-ui, sans-serif'; ctx.textBaseline = 'middle';
        ctx.fillText(icon, cx, cy + 2);
        ctx.textBaseline = 'alphabetic';
        // küçülen halka
        if (state === 'run') {
          const r = ringR();
          if (r > 0) {
            const inG = Math.abs(r - r0) <= g;
            ctx.lineWidth = 5; ctx.strokeStyle = inG ? '#7cf0a0' : '#ffffff';
            ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
          }
        }
        if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash * 0.35})`; ctx.fillRect(0, 0, W, H); }
        if (msg) {
          const k = U.clamp(msgT / 0.2, 0, 1);
          ctx.save(); ctx.translate(W / 2, H - 34); ctx.scale(0.7 + 0.3 * k, 0.7 + 0.3 * k);
          ctx.font = '900 30px system-ui, sans-serif'; ctx.textAlign = 'center';
          ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.strokeText(msg, 0, 0);
          ctx.fillStyle = msgCol; ctx.fillText(msg, 0, 0);
          ctx.restore();
        }
      };

      const say = (m, c) => { msg = m; msgCol = c; msgT = 0; };
      const end = (r) => {
        done = true;
        setTimeout(() => { cleanup(); resolve({ result: r }); }, 1000);
      };
      const press = () => {
        if (done || state !== 'run') return;
        const d = ringR() - r0;
        flash = 1;
        if (Math.abs(d) <= g) {
          round++;
          if (round >= rounds) { say(o.okText || 'BAŞARILI!', '#7cf0a0'); state = 'hit'; return end(partial ? 'partial' : 'success'); }
          say(U.pick(['Harika!', 'Mükemmel!', 'Devam!']), '#7cf0a0');
          state = 'hit';
          setTimeout(setup, 420);
        } else if (Math.abs(d) <= g + yw) {
          say(o.partialText || 'Yarım kaldı...', '#ffd166');
          state = 'hit';
          if (o.partialEnds !== false) return end('partial');
          partial = true; round++;
          if (round >= rounds) return end('partial');
          setTimeout(setup, 420);
        } else {
          say(d > 0 ? 'ERKEN!' : 'GEÇ!', '#ff6b6b');
          state = 'hit';
          setTimeout(() => say(o.failText || 'BAŞARISIZ!', '#ff6b6b'), 350);
          end('fail');
        }
      };
      const loop = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (state === 'run' && !done) {
          rt += dt;
          if (ringR() < r0 - g - yw) { state = 'hit'; say('GEÇ KALDIN!', '#ff6b6b'); end('fail'); }
        }
        msgT += dt;
        flash = Math.max(0, flash - dt * 4);
        draw();
        raf = requestAnimationFrame(loop);
      };
      const key = (e) => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); press(); } };
      const cleanup = () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', key); };
      box.addEventListener('pointerdown', (e) => { e.preventDefault(); press(); });
      document.addEventListener('keydown', key);
      setup();
      raf = requestAnimationFrame(loop);
      MiniGame._abort = () => {
        if (done) return;
        done = true;
        cleanup();
        resolve({ result: 'auto' });
      };
    });
  },
};
