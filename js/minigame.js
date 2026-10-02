// Maç içi mini oyunlar: kaydırarak şut / dokunarak pas sahnesi ve halka zamanlama

const PITCH = { W: 52, GOAL_W: 3.66, BAR: 2.44 };

const Scenes = {
  // type: open | deep | close | freekick | penalty
  // o.skill: 0 (çok kolay) .. 1 (çok zor), o.narrow: dikey ekran
  make(type, o) {
    const s = o.skill;
    const nx = o.narrow ? 6.5 : 14; // takım arkadaşlarının toptan yatay uzaklığı
    const sc = { type, defenders: [], mates: [], keeper: { x: 0, y: 0.7 }, ball: null, timeLimit: 0, creep: 0 };
    const mateNames = U.shuffle(o.mates || []);
    const free = (x, y, minD = 2.2) =>
      Math.abs(x) < 24 && y > 1.5 && y < 33 &&
      [sc.ball, ...sc.defenders, ...sc.mates].every((e) => !e || Math.hypot(e.x - x, e.y - y) > minD);
    const place = (gen, minD) => {
      for (let i = 0; i < 80; i++) {
        const [x, y] = gen();
        if (free(x, y, minD)) return [x, y];
      }
      return null;
    };

    if (type === 'penalty') {
      sc.ball = { x: 0, y: 11 };
      sc.timeLimit = 14;
      return sc;
    }

    if (type === 'freekick') {
      const dist = U.rand(18, 26);
      const ang = U.rand(-0.5, 0.5) * (o.narrow ? 0.6 : 1);
      sc.ball = { x: Math.sin(ang) * dist, y: Math.cos(ang) * dist };
      const dx = -sc.ball.x / dist, dy = -sc.ball.y / dist;
      const n = 2 + (dist < 22 ? 1 : 0) + (s > 0.35 ? 1 : 0) + (s > 0.65 ? 1 : 0);
      const cx = sc.ball.x + dx * 9.15, cy = sc.ball.y + dy * 9.15;
      const px = -dy, py = dx;
      const shift = (sc.ball.x > 0 ? 1 : -1) * 0.5;
      for (let i = 0; i < n; i++) {
        const off = (i - (n - 1) / 2) * 0.7 + shift;
        sc.defenders.push({ x: cx + px * off, y: cy + py * off, h: 2.0, wall: true });
      }
      sc.keeper.x = U.clamp(-sc.ball.x * 0.08, -1.5, 1.5);
      sc.timeLimit = 16;
      return sc;
    }

    const bxr = o.narrow ? 5 : 12;
    if (type === 'close') sc.ball = { x: U.rand(-8, 8), y: U.rand(8, 13) };
    else if (type === 'deep') sc.ball = { x: U.rand(-bxr * 0.7, bxr * 0.7), y: U.rand(27, 31) };
    else sc.ball = { x: U.rand(-bxr, bxr), y: o.position === 'FW' ? U.rand(13, o.narrow ? 19 : 22) : U.rand(17, o.narrow ? 23 : 26) };

    const nPress = type === 'close' ? (s > 0.5 ? 1 : 0) : 1 + (s > 0.45 ? 1 : 0) + (s > 0.75 ? 1 : 0);
    for (let i = 0; i < nPress; i++) {
      const p = place(() => {
        const a = type === 'close' ? U.pick([-1, 1]) * U.rand(1.2, 2.2) + Math.PI / 2 : U.rand(-1.0, 1.0) - Math.PI / 2;
        const d = type === 'close' ? U.rand(2.8, 4) : U.rand(4.5, o.narrow ? 6 : 7.5);
        return [sc.ball.x + Math.cos(a) * d, sc.ball.y + Math.sin(a) * d];
      }, 2.5);
      if (p) sc.defenders.push({ x: p[0], y: p[1], h: 1.9, presser: true });
    }

    const nMates = type === 'close' ? 1 : type === 'deep' ? 3 : 2 + (o.position === 'MF' ? 1 : 0);
    for (let i = 0; i < nMates; i++) {
      const p = place(() => {
        const x = U.clamp(sc.ball.x + U.rand(-nx, nx), -19, 19);
        if (type === 'deep') return [x, U.rand(12, sc.ball.y - 7)];
        const ymin = Math.max(4, sc.ball.y - 16);
        return [x, U.rand(ymin, Math.max(ymin + 2, sc.ball.y - 3))];
      }, 4.5);
      if (p) {
        sc.mates.push({ x: p[0], y: p[1], name: mateNames[i] || 'Takım arkadaşı', num: U.randi(2, 23) });
        if (U.chance(0.2 + 0.45 * s)) {
          const m = place(() => [p[0] + U.rand(-1.8, 1.8), p[1] - U.rand(1.4, 2.6)], 1.2);
          if (m) sc.defenders.push({ x: m[0], y: m[1], h: 1.9 });
        }
      }
    }
    if (type === 'open' && U.chance(0.12 + 0.5 * s)) {
      const p = place(() => [U.rand(-6, 6), U.rand(4, 9)], 2);
      if (p) sc.defenders.push({ x: p[0], y: p[1], h: 1.9 });
    }
    sc.keeper.x = U.clamp(sc.ball.x * 0.15, -2, 2);
    sc.timeLimit = (type === 'close' ? 5 : 6.5) + (o.pace || 50) / 40 - s * 1.5;
    sc.creep = 0.2 + 0.7 * s;
    return sc;
  },
};

// Vuruş tipleri (yükseklik)
const LIFTS = [
  { k: 'low', l: 'Yerden', d: 'Sert ve alçak', v: 0 },
  { k: 'mid', l: 'Yarım', d: 'Savunmanın üstünden', v: 0.24 },
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
      const defLift = scene.type === 'freekick' ? 1 : 0;
      host.innerHTML = `
        <div class="mg">
          <div class="mg-stage"><canvas class="mg-canvas"></canvas></div>
          <div class="mg-lift" role="group" aria-label="Vuruş tipi">
            ${LIFTS.map((l, i) => `<button type="button" data-lift="${i}" class="${i === defLift ? 'on' : ''}"><b>${l.l}</b><small>${l.d}</small></button>`).join('')}
          </div>
        </div>`;
      const stage = host.querySelector('.mg-stage');
      const cv = host.querySelector('canvas');
      const ctx = cv.getContext('2d');
      let liftIdx = defLift;
      let phase = 'aim';
      let gesture = null, preview = null, passTarget = null;
      const liftBtns = U.$$('[data-lift]', host);
      const setLift = (i) => {
        if (phase !== 'aim') return;
        liftIdx = i;
        liftBtns.forEach((b, j) => b.classList.toggle('on', j === i));
        if (gesture) refreshPreview();
      };
      liftBtns.forEach((b) => (b.onclick = () => setLift(+b.dataset.lift)));
      const onKey = (e) => {
        if (['Digit1', 'Digit2', 'Digit3'].includes(e.code)) setLift(+e.code.slice(-1) - 1);
      };
      document.addEventListener('keydown', onKey);

      // ---- zorluk ve stat bazlı parametreler ----
      const st = o.stats;
      const s = o.skill;
      const cond = o.cond;
      const maxSpeed = 21 + st.shooting * 0.12 + (scene.type === 'penalty' ? 2 : 0);
      const curveMax = 2.2 + st.technique * 0.075;
      const angSigma = ((1 - st.technique / 100) * 2.8 + 0.3) * cond * (0.55 + 0.8 * s) * Math.PI / 180;
      const passSigma = ((1 - st.passing / 100) * 2.4 + 0.25) * cond * (0.6 + 0.6 * s) * Math.PI / 180;
      const assist = U.clamp(0.75 - s, 0, 0.6); // nişan yardımı (düşük seviyelerde güçlü)
      const previewFrac = U.clamp(0.65 + st.technique / 200 + assist * 0.4, 0.65, 1);
      const POWER_M = 14;

      const ball = { x: scene.ball.x, y: scene.ball.y, z: 0, vx: 0, vy: 0, vz: 0, spin: 0, rot: 0 };
      const mk = (e, seed, extra) => Object.assign({ px: e.x, py: e.y, run: 0, spd: 0, look: Sprites.look(seed) }, e, extra);
      const shooter = mk({ x: scene.ball.x - 0.6, y: scene.ball.y + 0.7 }, 7, { num: o.number || 10 });
      const kp = scene.keeper;
      const keeper = mk({ x: kp.x, y: kp.y }, 3, {
        delay: 0.34 - 0.2 * s, speed: 1.6 + 3.0 * s, reach: 0.5 + 0.55 * s, dive: 0.2 + 0.6 * s,
        tx: kp.x, pen: scene.type === 'penalty', diveAmt: 0,
      });
      const defs = scene.defenders.map((d, i) => mk(d, 11 + i * 3));
      const mates = scene.mates.map((m, i) => mk(m, 31 + i * 5));
      const dSpeed = 0.8 + 2.4 * s;
      const dDelay = 0.26 - 0.12 * s;
      const kits = o.kits;

      let t = 0, kickT = -9, endT = 0;
      let result = null, resultText = '', resultColor = '#fff';
      let slowmo = 1, particles = [], netShake = 0, flash = 0;
      let last = performance.now(), raf = 0;
      const showHint = MiniGame.seen++ < 3;

      // ---- kamera: ekran oranına göre top, kale ve oyuncuları kapsar ----
      let W = 0, H = 0, PX = 1, dpr = 1, view = null, bg = null;
      const tx = (x) => (x - view.x0) * PX;
      const ty = (y, z = 0) => (y - view.y0) * PX - z * PX * 0.8;
      const toWorld = (cx, cy) => ({ x: cx / PX + view.x0, y: cy / PX + view.y0 });
      const layout = () => {
        const cw = Math.max(200, stage.clientWidth), ch = Math.max(200, stage.clientHeight);
        dpr = Math.min(2, window.devicePixelRatio || 1);
        W = Math.round(cw * dpr); H = Math.round(ch * dpr);
        cv.width = W; cv.height = H;
        cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
        const pts = [scene.ball, ...scene.defenders, ...scene.mates, { x: -4.5, y: -1 }, { x: 4.5, y: -1 }];
        const mx = cw / ch < 0.9 ? 1.8 : 3.5;
        let x0 = Math.min(...pts.map((e) => e.x)) - mx, x1 = Math.max(...pts.map((e) => e.x)) + mx;
        let y0 = -4.6, y1 = Math.max(...pts.map((e) => e.y)) + 3;
        const A = cw / ch;
        if ((x1 - x0) / (y1 - y0) < A) {
          const w = (y1 - y0) * A, c = (x0 + x1) / 2;
          x0 = c - w / 2; x1 = c + w / 2;
        } else {
          y1 = y0 + (x1 - x0) / A;
          if (y1 > 40) { y0 -= y1 - 40; y1 = 40; }
        }
        view = { x0, x1, y0, y1 };
        PX = W / (x1 - x0);
        bg = document.createElement('canvas');
        bg.width = W; bg.height = H;
        const b = bg.getContext('2d');
        Sprites.grass(b, W, H, tx, ty, PX, view);
        Sprites.stands(b, W, tx, ty, PX, view, dpr);
        Sprites.lines(b, tx, ty, PX);
      };
      layout();
      const onResize = () => layout();
      window.addEventListener('resize', onResize);
      MiniGame.dbg = { ball, keeper, defs, mates, scene, get view() { return view; }, get PX() { return PX; }, get dpr() { return dpr; } };

      const toCanvas = (e) => {
        const r = cv.getBoundingClientRect();
        return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
      };

      // Sapan tarzı nişan: parmak geriye çekilir, top ters yöne gider.
      // Çekme uzunluğu gücü, çekilen yolun kavisi falsoyu belirler.
      const PULL_MAX = () => 0.42 * Math.min(W, H);
      const params = (g) => {
        const s0 = g.pts[0], s1 = g.pts[g.pts.length - 1];
        const Lpx = Math.hypot(s1[0] - s0[0], s1[1] - s0[1]);
        if (Lpx < 14 * dpr) return null;
        const a = g.world[0];
        const world = g.world.map((p) => ({ x: 2 * a.x - p.x, y: 2 * a.y - p.y }));
        const b = world[world.length - 1];
        const cx = b.x - a.x, cy = b.y - a.y;
        const L = Math.hypot(cx, cy);
        if (L < 0.05) return null;
        let dmax = 0;
        for (const p of world) {
          const d = (cx * (p.y - a.y) - cy * (p.x - a.x)) / L;
          if (Math.abs(d) > Math.abs(dmax)) dmax = d;
        }
        const curve = U.clamp((dmax / L) * 3.2, -1, 1);
        const power = U.clamp(Lpx / PULL_MAX(), 0.15, 1);
        const spin = curve * curveMax;
        const chord = Math.atan2(cy, cx);
        const dirY = Math.sin(chord);
        const dist = dirY < -0.15 ? Math.min(ball.y / -dirY, 40) : 20;
        const speed = power * maxSpeed;
        const comp = U.clamp((0.55 * spin * dist) / (speed * speed), -0.5, 0.5);
        return { ang: chord + comp, power, curve, spin };
      };

      // Nişan yardımı: kaleyi az farkla ıskalayacak şutları direklerin içine çeker
      const assistAngle = (ang) => {
        if (assist <= 0) return ang;
        const dy = Math.sin(ang);
        if (dy > -0.2) return ang;
        const gx = ball.x + Math.cos(ang) * (ball.y / -dy);
        if (Math.abs(gx) > 7.5) return ang;
        const lim = PITCH.GOAL_W - 0.55;
        const want = U.clamp(gx, -lim, lim);
        const nx = gx + (want - gx) * assist;
        return Math.atan2(-ball.y, nx - ball.x);
      };

      const simulate = (pr) => {
        const b = { x: ball.x, y: ball.y, z: 0, vx: 0, vy: 0, vz: 0, spin: 0 };
        BallPhys.launch(b, assistAngle(pr.ang), pr.power * maxSpeed, LIFTS[liftIdx].v, pr.spin);
        const pts = [];
        for (let i = 0; i < 180; i++) {
          for (let k = 0; k < 4; k++) BallPhys.step(b, 1 / 240);
          pts.push([b.x, b.y, b.z]);
          if (b.y < -0.5 || Math.abs(b.x) > 30 || b.y > 40) break;
          if (Math.hypot(b.vx, b.vy) < 0.5 && b.z === 0) break;
        }
        return pts;
      };

      const refreshPreview = () => {
        const pr = gesture && params(gesture);
        preview = pr ? Object.assign(pr, { pts: simulate(pr) }) : null;
      };

      const mateAt = (w) => {
        let best = null, bd = 2.6;
        mates.forEach((m) => { const d = Math.hypot(m.x - w.x, m.y - 0.6 - w.y); if (d < bd) { bd = d; best = m; } });
        return best;
      };

      cv.addEventListener('pointerdown', (e) => {
        if (phase !== 'aim') return;
        cv.setPointerCapture(e.pointerId);
        const p = toCanvas(e);
        gesture = { pts: [p], world: [toWorld(p[0], p[1])] };
        preview = null;
        e.preventDefault();
      });
      cv.addEventListener('pointermove', (e) => {
        if (!gesture) return;
        const p = toCanvas(e);
        const lp = gesture.pts[gesture.pts.length - 1];
        if (Math.hypot(p[0] - lp[0], p[1] - lp[1]) < 3 * dpr) return;
        gesture.pts.push(p);
        gesture.world.push(toWorld(p[0], p[1]));
        refreshPreview();
        e.preventDefault();
      });
      cv.addEventListener('pointerup', () => {
        if (!gesture || phase !== 'aim') return;
        const g = gesture;
        gesture = null;
        const p0 = g.pts[0], p1 = g.pts[g.pts.length - 1];
        if (Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) < 12 * dpr) {
          const m = mateAt(g.world[0]);
          preview = null;
          if (m) passTo(m);
          return;
        }
        const pr = params(g);
        preview = null;
        if (pr) kick(assistAngle(pr.ang), pr.power, pr.spin, false);
      });
      cv.addEventListener('pointercancel', () => { gesture = null; preview = null; });

      function passTo(m) {
        const tgx = m.x, tgy = m.y - 0.6;
        const D = Math.hypot(tgx - ball.x, tgy - ball.y);
        const lift = LIFTS[liftIdx].v;
        let speed;
        if (lift === 0) speed = Math.sqrt(9.5 * 9.5 + 2 * 3.2 * D);
        else {
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
        const sp = power * maxSpeed * (1 + U.gauss() * 0.035 * cond);
        BallPhys.launch(ball, a, sp, LIFTS[liftIdx].v * (1 + U.gauss() * 0.05 * cond), spin * (1 + U.gauss() * 0.08 * cond));
        phase = 'fly';
        kickT = t;
        if (keeper.pen) {
          const side = U.weighted([-1, 0, 1], (v) => (v === 0 ? 0.2 : 0.4));
          keeper.tx = side * U.rand(1.6, 3.0);
          keeper.delay = 0.16;
          keeper.speed = 2.8 + 2.0 * s;
          keeper.reach = 0.55 + 0.35 * s;
          keeper.dive = 0.25 + 0.4 * s;
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
        if (outcome === 'goal' || (extra && extra.mateGoal)) {
          netShake = 1; flash = 1;
          const cols = [kits.own.shirt, kits.own.alt, '#ffffff', '#ffcf3f'];
          for (let i = 0; i < 90; i++) {
            particles.push({ x: tx(ball.x), y: ty(-1, 1.5), vx: U.rand(-320, 320) * dpr, vy: U.rand(-460, -80) * dpr, c: U.pick(cols), r: U.rand(3, 6) * dpr, life: U.rand(1.1, 2), rot: U.rand(0, 6) });
          }
          try { if (navigator.vibrate) navigator.vibrate([60, 40, 120]); } catch (e) { /* yok */ }
        }
      }

      // Pas ulaştıktan sonra arkadaşın şutu: önce topu kontrol eder, sonra vurur
      let mateShot = null;
      function startMateShot(m) {
        const pr = o.mateChance ? o.mateChance(m.y) : 0.4;
        const goal = U.chance(pr);
        mateShot = { m, goal, miss: !goal && U.chance(0.35), t0: t, kickT: -9 };
        passTarget = null;
        ball.vx = ball.vy = ball.vz = 0; ball.z = 0; ball.spin = 0;
        ball.x = m.x + 0.35; ball.y = m.y - 0.55;
        phase = 'mate';
        slowmo = 1;
      }
      function mateStep(dt) {
        t += 0;
        const ms = mateShot;
        if (phase === 'mate') {
          keeper.x += (U.clamp(ball.x * 0.18, -2.2, 2.2) - keeper.x) * Math.min(1, dt * 3);
          defs.forEach((d) => {
            if (d.wall) return;
            const dx = ball.x - d.x, dy = ball.y - d.y, dist = Math.hypot(dx, dy);
            if (dist > 1.6) { d.x += (dx / dist) * 1.5 * dt; d.y += (dy / dist) * 1.5 * dt; }
          });
          [...defs, keeper].forEach((e) => moveEnt(e, dt));
          if (t - ms.t0 > 0.75) {
            const side = keeper.x > ball.x * 0.18 ? -1 : 1;
            ms.tx = ms.goal ? side * U.rand(2.4, 3.1) : ms.miss ? (U.chance(0.5) ? 1 : -1) * U.rand(4.4, 5.6) : keeper.x + U.rand(-0.3, 0.3);
            const ang = Math.atan2(-ball.y, ms.tx - ball.x);
            BallPhys.launch(ball, ang, 25, ms.miss ? 0.12 : 0.05, 0);
            ms.kickT = t;
            keeper.tx = ms.goal ? keeper.x + Math.sign(ms.tx - keeper.x) * 1.1 : ms.tx;
            phase = 'mfly';
          }
          return;
        }
        const prevY = ball.y;
        const hs = BallPhys.step(ball, dt);
        ball.rot += hs * dt * 1.6;
        if (t - ms.kickT > 0.12) {
          const d = keeper.tx - keeper.x;
          keeper.x += Math.sign(d) * Math.min(Math.abs(d), (ms.goal ? 2.2 : 5) * dt);
          if (ball.y < 7) keeper.diveAmt = Math.min(1, keeper.diveAmt + dt * 5);
        }
        [...defs, ...mates, keeper].forEach((e) => moveEnt(e, dt));
        slowmo = ball.y < 7 && Math.abs(ball.x) < 9 ? 0.4 : 1;
        const extra = { mate: ms.m.name, mateY: ms.m.y, mateX: ms.m.x, mateGoal: ms.goal };
        if (!ms.goal && !ms.miss && prevY >= keeper.y && ball.y < keeper.y + 0.05) return finish('received', 'KALECİ KURTARDI', '#ffd166', extra);
        if (ball.y <= 0) {
          if (ms.goal) return finish('received', 'ASİST! GOOOL!', '#7cf0a0', extra);
          return finish('received', 'AUTA GİTTİ', '#ff6b6b', extra);
        }
        if (t - ms.kickT > 3) return finish('received', 'KALECİ KURTARDI', '#ffd166', extra);
      }

      const moveEnt = (e, dt) => {
        const d = Math.hypot(e.x - e.px, e.y - e.py);
        e.spd = U.clamp(d / Math.max(dt, 1e-4) / 4, 0, 1) * 0.7 + e.spd * 0.3;
        e.run += d * 4.2;
        e.px = e.x; e.py = e.y;
      };

      function step(dt) {
        t += dt;
        if (phase === 'aim') {
          if (scene.creep) {
            defs.forEach((d) => {
              if (!d.presser) return;
              const dx = ball.x - d.x, dy = ball.y - d.y, dist = Math.hypot(dx, dy);
              if (dist > 0.01) { d.x += (dx / dist) * scene.creep * dt; d.y += (dy / dist) * scene.creep * dt; }
              if (dist < 1.05) finish('lost', 'TOPU KAPTIRDIN', '#ff6b6b');
            });
          }
          if (t > scene.timeLimit) finish('lost', scene.creep ? 'TOPU KAPTIRDIN' : 'SÜRE DOLDU', '#ff6b6b');
          keeper.x += (U.clamp(ball.x * 0.15, -2, 2) - keeper.x) * Math.min(1, dt * 2);
          [...defs, keeper].forEach((e) => moveEnt(e, dt));
          return;
        }
        if (phase === 'mate' || phase === 'mfly') return mateStep(dt);
        if (phase !== 'fly') return;
        const ft = t - kickT;
        const prevY = ball.y;
        const hs = BallPhys.step(ball, dt);
        ball.rot += hs * dt * 1.6;

        if (ft > keeper.delay) {
          if (!keeper.pen) {
            let target = keeper.x;
            if (ball.vy < -0.5) target = ball.x + ball.vx * ((ball.y - keeper.y) / -ball.vy);
            keeper.tx = U.clamp(target, -4.2, 4.2);
          }
          const d = keeper.tx - keeper.x;
          keeper.x += Math.sign(d) * Math.min(Math.abs(d), keeper.speed * dt);
          if (ball.y < 7 && Math.abs(d) > 0.6) keeper.diveAmt = Math.min(1, Math.abs(keeper.diveAmt) + dt * 5);
        }
        defs.forEach((d) => {
          if (d.wall || ft < dDelay) return;
          const px = ball.x + ball.vx * 0.25, py = ball.y + ball.vy * 0.25;
          const dx = px - d.x, dy = py - d.y, dist = Math.hypot(dx, dy);
          if (dist > 0.05) { d.x += (dx / dist) * dSpeed * dt; d.y += (dy / dist) * dSpeed * dt; }
        });
        if (passTarget) {
          const m = passTarget;
          const dx = ball.x - m.x, dy = ball.y - m.y, dist = Math.hypot(dx, dy);
          if (dist < 8 && dist > 0.05) { m.x += (dx / dist) * 2.8 * dt; m.y += (dy / dist) * 2.8 * dt; }
        }
        [...defs, ...mates, keeper].forEach((e) => moveEnt(e, dt));

        for (const d of defs) {
          if (Math.hypot(ball.x - d.x, ball.y - d.y) < 0.58 && ball.z < d.h) {
            return finish('blocked', d.wall ? 'BARAJA ÇARPTI' : 'ARAYA GİRDİLER', '#ff6b6b');
          }
        }
        for (const m of mates) {
          const rr = 1.2 + (st.passing / 100) * 0.5 + (m === passTarget ? 0.35 : 0);
          if (Math.hypot(ball.x - m.x, ball.y - m.y) < rr && ball.z < 1.9 && hs < 31) {
            return startMateShot(m);
          }
        }
        const reach = keeper.reach + (ball.y < 5 ? keeper.dive : 0);
        if (prevY >= keeper.y && ball.y < keeper.y) {
          const maxZ = 2.2 + 0.3 * s;
          const r = ball.z > 1.7 ? reach * 0.75 : reach;
          if (Math.abs(ball.x - keeper.x) < r && ball.z < maxZ) return finish('saved', 'KALECİ KURTARDI', '#ffd166');
        }
        if (ball.y < 6 && ball.y > keeper.y && Math.hypot(ball.x - keeper.x, ball.y - keeper.y) < 1.0 && ball.z < 2.3 && hs < 9) {
          return finish(scene.mates.length ? 'claimed' : 'saved', 'KALECİ TOPLADI', '#ffd166');
        }
        if (ball.y <= 0) {
          const ax = Math.abs(ball.x);
          if (ax < PITCH.GOAL_W - 0.11 && ball.z < PITCH.BAR - 0.11) return finish('goal', 'GOOOL!', '#7cf0a0');
          if (ax < PITCH.GOAL_W + 0.15 && ball.z < PITCH.BAR + 0.15) {
            return finish(ax >= PITCH.GOAL_W - 0.11 ? 'post' : 'bar', ax >= PITCH.GOAL_W - 0.11 ? 'DİREK!' : 'ÜST DİREK!', '#ff6b6b');
          }
          return finish('miss', 'AUTA GİTTİ', '#ff6b6b');
        }
        if (Math.abs(ball.x) > 27 || ball.y > 40) return finish('miss', 'TOP DIŞARIDA', '#ff6b6b');
        if (hs < 0.4 && ball.z === 0) return finish('lost', 'TOP RAKİBE GEÇTİ', '#ff6b6b');
        if (ft > 5) return finish('lost', 'TOP RAKİBE GEÇTİ', '#ff6b6b');
        slowmo = ball.y < 7 && ball.vy < 0 && Math.abs(ball.x) < 9 && !passTarget ? 0.38 : 1;
      }

      // ---- çizim ----
      const FIG = () => 1.85 * 0.8 * PX * 1.42;

      function pill(text) {
        const fs = dpr;
        ctx.font = `700 ${Math.round(14 * fs)}px "Barlow Semi Condensed", "Arial Narrow", sans-serif`;
        const w = ctx.measureText(text).width + 28 * fs, h = 30 * fs;
        const x = W / 2 - w / 2, y = H - h - 12 * fs;
        ctx.fillStyle = 'rgba(10,16,32,0.82)';
        ctx.beginPath();
        ctx.moveTo(x + 8 * fs, y); ctx.lineTo(x + w + 8 * fs, y); ctx.lineTo(x + w - 8 * fs, y + h); ctx.lineTo(x - 8 * fs, y + h); ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
        ctx.fillText(text, W / 2, y + h * 0.68);
      }

      function drawPreview() {
        if (!preview || !preview.pts.length) return;
        const pts = preview.pts;
        const n = Math.max(2, Math.floor(pts.length * previewFrac));
        const col = preview.power > 0.85 ? '255,120,90' : preview.power > 0.55 ? '255,207,63' : '124,240,160';
        ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 3 * dpr; ctx.setLineDash([3 * dpr, 7 * dpr]);
        ctx.beginPath(); ctx.moveTo(tx(ball.x), ty(ball.y));
        for (let i = 0; i < n; i++) ctx.lineTo(tx(pts[i][0]), ty(pts[i][1]));
        ctx.stroke(); ctx.setLineDash([]);
        for (let i = 0; i < n; i += 3) {
          const a = 1 - (i / n) * 0.7;
          ctx.fillStyle = `rgba(${col},${a})`;
          ctx.beginPath(); ctx.arc(tx(pts[i][0]), ty(pts[i][1], pts[i][2]), (4 - (i / n) * 1.8) * dpr, 0, Math.PI * 2); ctx.fill();
        }
        const e = pts[n - 1];
        ctx.strokeStyle = `rgba(${col},0.95)`; ctx.lineWidth = 2.5 * dpr;
        ctx.beginPath(); ctx.arc(tx(e[0]), ty(e[1], e[2]), 9 * dpr, 0, Math.PI * 2); ctx.stroke();
      }

      function drawHud() {
        const fs = dpr;
        if (phase === 'aim') {
          const rem = U.clamp(1 - t / scene.timeLimit, 0, 1);
          ctx.fillStyle = 'rgba(10,16,32,0.6)'; ctx.fillRect(0, 0, W, 7 * fs);
          ctx.fillStyle = rem > 0.35 ? '#ffcf3f' : '#ff5a4f'; ctx.fillRect(0, 0, W * rem, 7 * fs);
        }
        if (phase === 'aim' && preview) {
          const bx = tx(ball.x), by = ty(ball.y);
          const R = Math.max(18 * fs, PX * 0.9);
          ctx.lineWidth = 6 * fs; ctx.lineCap = 'round';
          ctx.strokeStyle = 'rgba(10,16,32,0.55)';
          ctx.beginPath(); ctx.arc(bx, by, R, 0, Math.PI * 2); ctx.stroke();
          ctx.strokeStyle = preview.power > 0.85 ? '#ff785a' : preview.power > 0.55 ? '#ffcf3f' : '#7cf0a0';
          ctx.beginPath(); ctx.arc(bx, by, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * preview.power); ctx.stroke();
          ctx.lineCap = 'butt';
          const c = preview.curve;
          pill(`GÜÇ ${Math.round(preview.power * 100)}   ·   ${Math.abs(c) < 0.12 ? 'DÜZ' : c > 0 ? '◀ FALSO' : 'FALSO ▶'}   ·   ${LIFTS[liftIdx].l.toUpperCase()}`);
        }
        if (phase === 'mate' && mateShot) pill(`PAS ULAŞTI · ${mateShot.m.name.split(' ').slice(-1)[0].toUpperCase()} VURUYOR...`);
        if (gesture && gesture.pts.length > 1) {
          // çekilen yol (soluk) ve başlangıç noktasından parmağa gerilen lastik
          const g0 = gesture.pts[0], g1 = gesture.pts[gesture.pts.length - 1];
          ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 5 * fs; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          ctx.beginPath(); ctx.moveTo(g0[0], g0[1]);
          gesture.pts.forEach((p) => ctx.lineTo(p[0], p[1]));
          ctx.stroke();
          ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 3 * fs; ctx.setLineDash([6 * fs, 6 * fs]);
          ctx.beginPath(); ctx.moveTo(g0[0], g0[1]); ctx.lineTo(g1[0], g1[1]); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.beginPath(); ctx.arc(g0[0], g0[1], 7 * fs, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 3 * fs;
          ctx.beginPath(); ctx.arc(g1[0], g1[1], 16 * fs, 0, Math.PI * 2); ctx.stroke();
          ctx.lineCap = 'butt';
        }
        if (showHint && phase === 'aim' && !gesture && !preview) {
          const k = (t % 1.6) / 1.6;
          const bx = tx(ball.x), by = ty(ball.y);
          const gx = tx(U.clamp(ball.x * 0.3, -2.5, 2.5)), gy = ty(1);
          const hx = bx - (gx - bx) * k * 0.35, hy = by - (gy - by) * k * 0.35;
          ctx.globalAlpha = 1 - k;
          ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 5 * fs;
          ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(hx, hy); ctx.stroke();
          ctx.fillStyle = '#fff';
          ctx.beginPath(); ctx.arc(hx, hy, 14 * fs, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
          pill(scene.mates.length ? 'GERİ ÇEK VE BIRAK: ŞUT  ·  DOKUN: PAS' : 'GERİ ÇEK VE BIRAK: ŞUT');
        }
      }

      function draw(dt) {
        ctx.drawImage(bg, 0, 0);
        const sh = netShake > 0 ? Math.sin(t * 50) * 6 * dpr * netShake : 0;
        Sprites.net(ctx, tx, ty, PX, sh);
        if (phase === 'aim') drawPreview();
        const h = FIG();
        const lab = (txt) => (phase === 'aim' ? txt : null);
        const ents = [];
        ents.push({ y: 0, d: () => Sprites.frame(ctx, tx, ty, PX) });
        ents.push({ y: keeper.y, d: () => Sprites.figure(ctx, tx(keeper.x), ty(keeper.y), h, { kit: kits.gk, look: keeper.look, facing: 'down', run: keeper.run, speed: keeper.spd, gloves: true, dive: keeper.diveAmt, t }) });
        defs.forEach((d) => ents.push({ y: d.y, d: () => Sprites.figure(ctx, tx(d.x), ty(d.y), h * (d.wall ? 1.02 : 1), { kit: kits.opp, look: d.look, facing: 'down', run: d.run, speed: d.spd, dive: d.wall && phase !== 'aim' ? 0.5 : 0, t }) }));
        mates.forEach((m) => ents.push({ y: m.y, d: () => Sprites.figure(ctx, tx(m.x), ty(m.y), h, { kit: kits.own, look: m.look, facing: 'up', run: m.run, speed: m.spd, number: m.num, kick: mateShot && mateShot.m === m && t - mateShot.kickT < 0.35 ? (t - mateShot.kickT) / 0.35 : 0, label: lab(m.name.split(' ').slice(-1)[0].toUpperCase()), labelScale: dpr, ring: phase === 'aim' ? 'rgba(124,240,160,0.95)' : null, t }) }));
        const kickA = phase !== 'aim' && t - kickT < 0.35 ? (t - kickT) / 0.35 : 0;
        ents.push({ y: shooter.y, d: () => Sprites.figure(ctx, tx(shooter.x), ty(shooter.y), h, { kit: kits.own, look: shooter.look, facing: 'up', number: shooter.num, kick: kickA, label: lab('SEN'), labelScale: dpr, labelColor: 'rgba(214,40,57,0.92)', t }) });
        ents.push({
          y: ball.y + 0.01, d: () => {
            const br = Math.max(4 * dpr, 0.22 * PX * 1.5) * (1 + ball.z * 0.05);
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath(); ctx.ellipse(tx(ball.x) + ball.z * PX * 0.15, ty(ball.y), br * 1.1, br * 0.45, 0, 0, Math.PI * 2); ctx.fill();
            Sprites.ball(ctx, tx(ball.x), ty(ball.y, ball.z) - br * 0.8, br, ball.rot);
          },
        });
        ents.sort((a, b) => a.y - b.y).forEach((e) => e.d());

        drawHud();

        particles.forEach((p) => {
          p.vy += 620 * dpr * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; p.rot += dt * 8;
          ctx.globalAlpha = U.clamp(p.life, 0, 1);
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.fillStyle = p.c; ctx.fillRect(-p.r / 2, -p.r, p.r, p.r * 2);
          ctx.restore();
        });
        ctx.globalAlpha = 1;
        particles = particles.filter((p) => p.life > 0);

        if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash * 0.4})`; ctx.fillRect(0, 0, W, H); }
        if (slowmo < 1) {
          const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.7);
          g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.45)');
          ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        }
        if (phase === 'done') {
          const k = U.clamp((t - endT) / 0.25, 0, 1);
          const e = 1 - Math.pow(1 - k, 3);
          const bandH = 96 * dpr;
          ctx.fillStyle = `rgba(10,16,32,${0.78 * k})`;
          ctx.beginPath();
          ctx.moveTo(-20, H / 2 - bandH / 2 + 10 * dpr); ctx.lineTo(W + 20, H / 2 - bandH / 2 - 10 * dpr);
          ctx.lineTo(W + 20, H / 2 + bandH / 2 - 10 * dpr); ctx.lineTo(-20, H / 2 + bandH / 2 + 10 * dpr); ctx.closePath(); ctx.fill();
          ctx.save();
          ctx.translate(W / 2 + (1 - e) * -W * 0.3, H / 2);
          ctx.font = `italic 800 ${Math.round(Math.min(58 * dpr, W / 9))}px "Saira Condensed", "Arial Narrow", sans-serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.globalAlpha = k;
          ctx.fillStyle = resultColor;
          ctx.fillText(resultText, 0, 0);
          ctx.restore();
          ctx.globalAlpha = 1;
          ctx.textBaseline = 'alphabetic';
        }
      }

      function cleanup() {
        cancelAnimationFrame(raf);
        document.removeEventListener('keydown', onKey);
        window.removeEventListener('resize', onResize);
      }

      function loop(now) {
        const rdt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const dt = rdt * slowmo;
        const n = Math.ceil(dt / (1 / 240));
        for (let i = 0; i < n && phase !== 'done'; i++) step(dt / n);
        if (phase === 'done') t += rdt;
        netShake = Math.max(0, netShake - rdt * 1.1);
        flash = Math.max(0, flash - rdt * 3);
        draw(rdt);
        if (phase === 'done' && t - endT > (result.outcome === 'goal' || result.mateGoal ? 2.0 : 1.5)) {
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
      host.innerHTML = `
        <div class="tg">
          <div class="tg-stage"><canvas class="tg-canvas"></canvas></div>
          <div class="tg-foot">Halka <b>yeşil</b> bölgeye girince ekrana dokun · <kbd>Boşluk</kbd></div>
        </div>`;
      const box = host.querySelector('.tg');
      const stage = host.querySelector('.tg-stage');
      const cv = host.querySelector('canvas');
      const ctx = cv.getContext('2d');
      let W, H, dpr, U0;
      const layout = () => {
        const cw = Math.max(200, stage.clientWidth), ch = Math.max(200, stage.clientHeight);
        dpr = Math.min(2, window.devicePixelRatio || 1);
        W = Math.round(cw * dpr); H = Math.round(ch * dpr);
        cv.width = W; cv.height = H; cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
        U0 = Math.min(W, H) / 300;
      };
      layout();
      window.addEventListener('resize', layout);
      const kits = o.kits;
      const lookMe = Sprites.look(7), lookOpp = Sprites.look(13);
      const D = 1.7 / o.speed;
      let round = 0, partial = false, done = false, raf = 0, last = performance.now();
      let rt = 0, state = 'run', msg = '', msgCol = '#fff', msgT = 0, flash = 0, T = 0, ox = 0;

      const geo = () => {
        const r0 = 34 * U0, R = r0 * 3.3;
        const g = U.clamp(o.green * 130, 7, 46) * U0, yw = Math.max(6, o.yellow * 130) * U0;
        return { r0, R, g, yw, v: (R - r0) / D };
      };
      const setup = () => { rt = 0; state = 'run'; ox = U.rand(-0.1, 0.1); };
      const ringR = () => { const G = geo(); return G.R - G.v * rt; };

      const draw = () => {
        const G = geo();
        for (let i = 0; i < 10; i++) {
          ctx.fillStyle = i % 2 ? '#2f8c45' : '#38994d';
          ctx.fillRect(0, (H / 10) * i, W, H / 10 + 1);
        }
        const vg = ctx.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, Math.max(W, H) * 0.7);
        vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.5)');
        ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
        const cx = W / 2 + ox * W, cy = H * 0.5;
        const fh = Math.min(92 * U0, H * 0.3);
        const me = { kit: kits.own, look: lookMe, facing: 'up', number: o.number || 10, run: T * 9, speed: 0.6, t: T };
        const op = { kit: kits.opp, look: lookOpp, facing: 'down', run: T * 9 + 1, speed: 0.6, t: T };
        let ry;
        ry = cy;
        if (o.kind === 'header') {
          Sprites.figure(ctx, cx - 26 * U0, cy + fh * 1.2, fh, op);
          Sprites.figure(ctx, cx + 20 * U0, cy + fh * 1.28, fh, me);
        } else if (o.kind === 'tackle') {
          Sprites.figure(ctx, cx + 30 * U0, cy - fh * 0.05, fh, op);
          Sprites.figure(ctx, cx - 44 * U0, cy + fh * 0.95, fh, me);
        } else {
          Sprites.figure(ctx, cx + 26 * U0, cy - fh * 0.15, fh, op);
          Sprites.figure(ctx, cx - 30 * U0, cy + fh * 0.75, fh, me);
        }
        Sprites.ball(ctx, cx, ry + (o.kind === 'header' ? Math.sin(T * 3) * 4 * U0 : 0), 10 * U0, T * 5);
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.font = `italic 800 ${Math.round(30 * U0)}px "Saira Condensed", "Arial Narrow", sans-serif`;
        ctx.fillText(o.title.toUpperCase(), W / 2, 40 * U0);
        if (rounds > 1) {
          for (let i = 0; i < rounds; i++) {
            const x = W / 2 + (i - (rounds - 1) / 2) * 24 * U0;
            ctx.fillStyle = i < round ? '#7cf0a0' : 'rgba(10,16,32,0.6)';
            ctx.beginPath(); ctx.arc(x, 62 * U0, 7 * U0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2 * U0; ctx.stroke();
          }
        }
        ctx.lineWidth = G.yw;
        ctx.strokeStyle = 'rgba(255,207,63,0.4)';
        ctx.beginPath(); ctx.arc(cx, ry, G.r0 + G.g + G.yw / 2, 0, Math.PI * 2); ctx.stroke();
        if (G.r0 - G.g - G.yw / 2 > 4) { ctx.beginPath(); ctx.arc(cx, ry, G.r0 - G.g - G.yw / 2, 0, Math.PI * 2); ctx.stroke(); }
        ctx.lineWidth = G.g * 2;
        ctx.strokeStyle = 'rgba(124,240,160,0.38)';
        ctx.beginPath(); ctx.arc(cx, ry, G.r0, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 2 * U0; ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath(); ctx.arc(cx, ry, G.r0, 0, Math.PI * 2); ctx.stroke();
        if (state === 'run') {
          const r = ringR();
          if (r > 0) {
            const inG = Math.abs(r - G.r0) <= G.g;
            ctx.lineWidth = 6 * U0; ctx.strokeStyle = inG ? '#7cf0a0' : '#ffffff';
            ctx.beginPath(); ctx.arc(cx, ry, r, 0, Math.PI * 2); ctx.stroke();
          }
        }
        if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash * 0.35})`; ctx.fillRect(0, 0, W, H); }
        if (msg) {
          const k = U.clamp(msgT / 0.2, 0, 1);
          ctx.save(); ctx.translate(W / 2, H - 30 * U0); ctx.scale(0.7 + 0.3 * k, 0.7 + 0.3 * k);
          ctx.font = `italic 800 ${Math.round(34 * U0)}px "Saira Condensed", "Arial Narrow", sans-serif`; ctx.textAlign = 'center';
          ctx.lineWidth = 6 * U0; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.strokeText(msg, 0, 0);
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
        const G = geo();
        const d = ringR() - G.r0;
        flash = 1;
        if (Math.abs(d) <= G.g) {
          round++;
          if (round >= rounds) { say(o.okText || 'BAŞARILI!', '#7cf0a0'); state = 'hit'; return end(partial ? 'partial' : 'success'); }
          say(U.pick(['HARİKA!', 'MÜKEMMEL!', 'DEVAM!']), '#7cf0a0');
          state = 'hit';
          setTimeout(setup, 420);
        } else if (Math.abs(d) <= G.g + G.yw) {
          say(o.partialText || 'YARIM KALDI', '#ffcf3f');
          state = 'hit';
          if (o.partialEnds !== false) return end('partial');
          partial = true; round++;
          if (round >= rounds) return end('partial');
          setTimeout(setup, 420);
        } else {
          say(d > 0 ? 'ERKEN!' : 'GEÇ!', '#ff6b6b');
          state = 'hit';
          setTimeout(() => say(o.failText || 'BAŞARISIZ', '#ff6b6b'), 350);
          end('fail');
        }
      };
      const loop = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        T += dt;
        if (state === 'run' && !done) {
          rt += dt;
          const G = geo();
          if (ringR() < G.r0 - G.g - G.yw) { state = 'hit'; say('GEÇ KALDIN', '#ff6b6b'); end('fail'); }
        }
        msgT += dt;
        flash = Math.max(0, flash - dt * 4);
        draw();
        raf = requestAnimationFrame(loop);
      };
      const key = (e) => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); press(); } };
      const cleanup = () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', key); window.removeEventListener('resize', layout); };
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

// ---------- Yeni mini oyunlar: kontra atak sprinti ve verkaç ----------
Object.assign(MiniGame, {
  // Hızlı hızlı dokunarak rakibinle topa doğru yarış
  sprint(host, o) {
    return new Promise((resolve) => {
      host.innerHTML = `
        <div class="tg">
          <div class="tg-stage"><canvas class="tg-canvas"></canvas></div>
          <div class="tg-foot"><b>Hızlı hızlı dokun</b> · rakibinden önce topa ulaş · <kbd>Boşluk</kbd></div>
        </div>`;
      const box = host.querySelector('.tg');
      const stage = host.querySelector('.tg-stage');
      const cv = host.querySelector('canvas');
      const ctx = cv.getContext('2d');
      let W, H, dpr;
      const layout = () => {
        const cw = Math.max(200, stage.clientWidth), ch = Math.max(200, stage.clientHeight);
        dpr = Math.min(2, window.devicePixelRatio || 1);
        W = Math.round(cw * dpr); H = Math.round(ch * dpr);
        cv.width = W; cv.height = H; cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
      };
      layout();
      window.addEventListener('resize', layout);
      const L = 28;
      const vmax = 6 + (o.pace || 30) / 15;
      const oppV = (4.5 + o.skill * 2.6) * U.rand(0.95, 1.05);
      const me = { y: 0, v: 0, run: 0 }, op = { y: 0, v: 0, run: 1 };
      let t = 0, done = false, raf = 0, last = performance.now(), msg = '', msgCol = '#fff', taps = 0;
      const lookMe = Sprites.look(7), lookOp = Sprites.look(19);
      const tap = () => { if (done || t < 0.6) return; taps++; me.v = Math.min(vmax, me.v + 1.6); };
      const finish = (ok) => {
        done = true;
        msg = ok ? 'TOPA SEN ULAŞTIN!' : 'RAKİP DAHA HIZLIYDI';
        msgCol = ok ? '#7cf0a0' : '#ff6b6b';
        setTimeout(() => { cleanup(); resolve({ result: ok ? 'success' : 'fail' }); }, 1100);
      };
      const draw = () => {
        const top = H * 0.16, bot = H * 0.9;
        const yOf = (d) => bot - (d / L) * (bot - top);
        for (let i = 0; i < 12; i++) { ctx.fillStyle = i % 2 ? '#2f8c45' : '#38994d'; ctx.fillRect(0, (H / 12) * i, W, H / 12 + 1); }
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3 * dpr;
        ctx.beginPath(); ctx.moveTo(W * 0.12, top); ctx.lineTo(W * 0.88, top); ctx.stroke();
        ctx.setLineDash([10 * dpr, 10 * dpr]); ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath(); ctx.moveTo(W / 2, top); ctx.lineTo(W / 2, bot); ctx.stroke(); ctx.setLineDash([]);
        Sprites.ball(ctx, W / 2, top - 12 * dpr, 12 * dpr, t * 2);
        const fh = Math.min(H * 0.2, W * 0.22);
        Sprites.figure(ctx, W * 0.66, yOf(op.y), fh, { kit: o.kits.opp, look: lookOp, facing: 'up', run: op.run, speed: 0.9, t });
        Sprites.figure(ctx, W * 0.34, yOf(me.y), fh, { kit: o.kits.own, look: lookMe, facing: 'up', number: o.number, run: me.run, speed: U.clamp(me.v / 5, 0.2, 1), label: 'SEN', labelScale: dpr, labelColor: 'rgba(214,40,57,0.92)', t });
        ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
        ctx.font = `italic 800 ${Math.round(30 * dpr)}px "Saira Condensed", "Arial Narrow", sans-serif`;
        ctx.fillText(t < 0.6 ? 'HAZIR...' : done ? msg : 'KOŞ!', W / 2, H * 0.08 + 12 * dpr);
        // hız göstergesi
        const bw = W * 0.5, bx = W * 0.25, by = H * 0.95;
        ctx.fillStyle = 'rgba(10,16,32,0.6)'; ctx.fillRect(bx, by, bw, 10 * dpr);
        ctx.fillStyle = me.v > oppV ? '#7cf0a0' : '#ffcf3f'; ctx.fillRect(bx, by, bw * (me.v / vmax), 10 * dpr);
        if (done) { ctx.fillStyle = msgCol; ctx.font = `italic 800 ${Math.round(34 * dpr)}px "Saira Condensed", "Arial Narrow", sans-serif`; ctx.fillText(msg, W / 2, H * 0.55); }
      };
      const loop = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        t += dt;
        if (!done && t > 0.6) {
          me.v = Math.max(0, me.v - 1.6 * dt);
          op.v = Math.min(oppV, op.v + 4 * dt);
          me.y += me.v * dt; op.y += op.v * dt;
          me.run += me.v * dt * 1.6; op.run += op.v * dt * 1.6;
          if (me.y >= L || op.y >= L) finish(me.y >= op.y);
          if (t > 12) finish(me.y > op.y);
        }
        draw();
        raf = requestAnimationFrame(loop);
      };
      const key = (e) => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); tap(); } };
      const cleanup = () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', key); window.removeEventListener('resize', layout); };
      box.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(); });
      document.addEventListener('keydown', key);
      raf = requestAnimationFrame(loop);
      MiniGame._abort = () => { if (done) return; done = true; cleanup(); resolve({ result: 'auto' }); };
    });
  },

  // Verkaç: beliren takım arkadaşlarına sırayla, süre bitmeden dokun
  onetwo(host, o) {
    return new Promise((resolve) => {
      host.innerHTML = `
        <div class="tg">
          <div class="tg-stage"><canvas class="tg-canvas"></canvas></div>
          <div class="tg-foot"><b>Parlayan arkadaşına dokun</b> · süre dolmadan pası ver</div>
        </div>`;
      const stage = host.querySelector('.tg-stage');
      const cv = host.querySelector('canvas');
      const ctx = cv.getContext('2d');
      let W, H, dpr;
      const layout = () => {
        const cw = Math.max(200, stage.clientWidth), ch = Math.max(200, stage.clientHeight);
        dpr = Math.min(2, window.devicePixelRatio || 1);
        W = Math.round(cw * dpr); H = Math.round(ch * dpr);
        cv.width = W; cv.height = H; cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
      };
      layout();
      window.addEventListener('resize', layout);
      const rounds = 3;
      const win = U.clamp(1.5 - 0.7 * o.skill + (o.passing || 30) / 200, 0.75, 1.8);
      let hits = 0, t = 0, rt = 0, done = false, raf = 0, last = performance.now(), msg = '', msgCol = '#fff';
      const meP = { x: 0.5, y: 0.82 };
      let tgt = null, ballFrom = meP, ballTo = meP, ballT = 1;
      const names = U.shuffle(o.mates || ['Arkadaş']);
      const looks = [Sprites.look(31), Sprites.look(36), Sprites.look(41)];
      const spawn = () => {
        const prev = tgt || meP;
        let x, y;
        do { x = U.rand(0.15, 0.85); y = U.rand(0.25, 0.7); } while (Math.hypot(x - prev.x, y - prev.y) < 0.3);
        tgt = { x, y, name: names[hits % names.length].split(' ').slice(-1)[0].toUpperCase(), look: looks[hits % 3] };
        rt = 0;
      };
      const end = (r, m, c) => {
        done = true; msg = m; msgCol = c;
        setTimeout(() => { cleanup(); resolve({ result: r }); }, 1000);
      };
      const press = (e) => {
        if (done || !tgt) return;
        const r = cv.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        const d = Math.hypot((px - tgt.x) * W, (py - tgt.y) * H);
        if (d < Math.max(70 * dpr, H * 0.11)) {
          hits++;
          ballFrom = ballTo;
          ballTo = { x: tgt.x, y: tgt.y };
          ballT = 0;
          if (hits >= rounds) { tgt = null; return end('success', 'MÜKEMMEL VERKAÇ!', '#7cf0a0'); }
          spawn();
        }
      };
      const draw = () => {
        for (let i = 0; i < 10; i++) { ctx.fillStyle = i % 2 ? '#2f8c45' : '#38994d'; ctx.fillRect(0, (H / 10) * i, W, H / 10 + 1); }
        const fh = Math.min(H * 0.17, W * 0.2);
        Sprites.figure(ctx, meP.x * W, meP.y * H + fh * 0.4, fh, { kit: o.kits.own, look: Sprites.look(7), facing: 'up', number: o.number, label: 'SEN', labelScale: dpr, labelColor: 'rgba(214,40,57,0.92)', t });
        if (tgt) {
          const k = 1 - rt / win;
          Sprites.figure(ctx, tgt.x * W, tgt.y * H + fh * 0.4, fh, { kit: o.kits.own, look: tgt.look, facing: 'up', number: 7 + hits, label: tgt.name, labelScale: dpr, ring: 'rgba(124,240,160,0.95)', t });
          ctx.strokeStyle = k > 0.35 ? '#7cf0a0' : '#ff6b6b'; ctx.lineWidth = 6 * dpr;
          ctx.beginPath(); ctx.arc(tgt.x * W, tgt.y * H - fh * 0.2, fh * 0.75, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); ctx.stroke();
        }
        {
          const e = ballT;
          Sprites.ball(ctx, (ballFrom.x + (ballTo.x - ballFrom.x) * e) * W, (ballFrom.y + (ballTo.y - ballFrom.y) * e) * H + fh * 0.38, 9 * dpr, t * 8);
        }
        ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
        ctx.font = `italic 800 ${Math.round(30 * dpr)}px "Saira Condensed", "Arial Narrow", sans-serif`;
        ctx.fillText(`VERKAÇ  ${hits}/${rounds}`, W / 2, H * 0.08 + 12 * dpr);
        if (done) { ctx.fillStyle = msgCol; ctx.font = `italic 800 ${Math.round(34 * dpr)}px "Saira Condensed", "Arial Narrow", sans-serif`; ctx.fillText(msg, W / 2, H * 0.5); }
      };
      const loop = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now; t += dt; ballT = Math.min(1, ballT + dt * 3);
        if (!done && tgt) {
          rt += dt;
          if (rt > win) { tgt = null; end(hits >= 2 ? 'partial' : 'fail', hits >= 2 ? 'PAS ARAYA GİTTİ' : 'TOPU KAPTIRDIN', '#ff6b6b'); }
        }
        draw();
        raf = requestAnimationFrame(loop);
      };
      const cleanup = () => { cancelAnimationFrame(raf); window.removeEventListener('resize', layout); };
      cv.addEventListener('pointerdown', (e) => { e.preventDefault(); press(e); });
      setTimeout(spawn, 500);
      raf = requestAnimationFrame(loop);
      MiniGame._abort = () => { if (done) return; done = true; cleanup(); resolve({ result: 'auto' }); };
    });
  },
});
