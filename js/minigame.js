// Maç içi mini oyunlar: kaydırarak şut / dokunarak pas sahnesi ve halka zamanlama

const PITCH = { W: 52, GOAL_W: 3.66, BAR: 2.44 };

// Zor seviyede kaleci ve rakipler sertleşir (kolay ve orta aynı kalır)
const HARD = () => typeof Game !== 'undefined' && Game.state && Game.state.difficulty === 'hard';
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
      const dist = U.rand(17, 25);
      const ang = U.rand(-0.5, 0.5) * (o.narrow ? 0.6 : 1);
      sc.ball = { x: Math.sin(ang) * dist, y: Math.cos(ang) * dist };
      const dx = -sc.ball.x / dist, dy = -sc.ball.y / dist;
      const n = 2 + (dist < 21 ? 1 : 0) + (s > 0.45 ? 1 : 0) + (s > 0.7 ? 1 : 0);
      sc.dist = dist;
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
    // Ofsayt çizgisi: kaleye en yakın saha oyuncusu (kaleci son adam sayılır)
    if (type === 'open' || type === 'deep') {
      if (!sc.defenders.some((d) => d.y < sc.ball.y - 3)) {
        const p = place(() => [U.rand(-8, 8), U.rand(6, Math.max(7, sc.ball.y - 6))], 2);
        if (p) sc.defenders.push({ x: p[0], y: p[1], h: 1.9 });
      }
      const line = Math.min(...sc.defenders.map((d) => d.y), sc.ball.y);
      // çoğu arkadaş çizgide durur, bazen biri ofsayta düşer
      sc.mates.forEach((m) => { if (m.y < line && U.chance(0.7)) m.y = Math.min(sc.ball.y - 1.5, line + U.rand(0.3, 1.6)); });
      sc.offside = line;
    }
    sc.keeper.x = HARD() ? U.clamp(sc.ball.x * 0.24, -2.6, 2.6) : U.clamp(sc.ball.x * 0.15, -2, 2);
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
// env: hava durumuna göre zemin sürtünmesi ve rüzgar (m/s², +x sağa)
const BallPhys = {
  env: { fric: 1, wind: 0 },
  step(b, dt) {
    const E = BallPhys.env;
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
      b.vx += E.wind * dt;
    } else {
      const ns = Math.max(0, hs - 3.2 * E.fric * dt);
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

// Dokunuş tarzı falso: topun dokunulan noktası, topun kale çizgisinde ne kadar kıvrılacağını belirler.
// Gereken dönüş fizikle çözülür; böylece şutun gücü, yüksekliği ya da mesafesi ne olursa olsun
// aynı noktaya dokunmak aynı (öngörülebilir) kavisi verir.
const TouchCurl = {
  // kale çizgisinde istenen yana kayma (m): kenar (|ck|=1) yakın mesafede ~1,9 m, 20 m'de ~2,8 m, 30 m'de ~3,8 m
  bend(ck, dist, technique) {
    return ck * Math.min(4.2, 0.6 + 0.11 * dist) * (0.88 + (technique || 60) / 500);
  },
  // topu uçurur; kale çizgisini geçtiği andaki x konumunu verir (geçmezse 2 sn sonraki konumu)
  latAt(b0, ang, speed, lift, spin) {
    const b = { x: b0.x, y: b0.y, z: 0, vx: 0, vy: 0, vz: 0, spin: 0 };
    BallPhys.launch(b, ang, speed, lift, spin);
    let px = b.x, py = b.y;
    for (let i = 0; i < 480; i++) {
      px = b.x; py = b.y;
      BallPhys.step(b, 1 / 240);
      if (b.y <= 0) return py > 0 ? px + (b.x - px) * (py / (py - b.y)) : b.x;
    }
    return b.x;
  },
  // istenen kaymayı veren dönüşü bulur (ikiye bölme); ulaşılamıyorsa sınırda kalır
  solve(b0, ang, speed, lift, want, smax) {
    const x0 = TouchCurl.latAt(b0, ang, speed, lift, 0);
    const f = (sp) => TouchCurl.latAt(b0, ang, speed, lift, sp) - x0 - want;
    let lo = -smax, hi = smax, flo = f(lo), fhi = f(hi);
    // çözüm aralıkta değilse (çok yumuşak, sekerek giden toplar): yönü doğru, ölçülü bir dönüş
    if (flo * fhi > 0) {
      // istenen kavise ulaşılamıyor: doğru yöne en çok kıvıran uç (çok sert, yakın şut); o da yoksa ölçülü dönüş
      const dl = flo + want, dh = fhi + want;
      const ok = [[lo, dl], [hi, dh]].filter(([, d]) => Math.sign(d) === Math.sign(want)).sort((u, v) => Math.abs(u[1] - want) - Math.abs(v[1] - want));
      return ok.length ? ok[0][0] : -Math.sign(want) * Math.min(smax, Math.abs(want) * 3);
    }
    for (let i = 0; i < 16; i++) {
      const mid = (lo + hi) / 2, fm = f(mid);
      if (fm * flo > 0) { lo = mid; flo = fm; } else hi = mid;
    }
    return (lo + hi) / 2;
  },
};

const MiniGame = {
  seen: 0,
  // Vuruş tarzı (Ayarlar): 'swipe' = StarFoot (geri çek ve bırak, varsayılan), 'aim' = Hedef (kaleye dokun, gücü durdur)
  style() { try { return localStorage.getItem('starfoot_shot') === 'aim' ? 'aim' : 'swipe'; } catch (e) { return 'swipe'; } },
  // Gol tekrarı (ağır çekim, 0.75x): ayarlardan kapatılabilir
  replayOn() { try { return localStorage.getItem('starfoot_replay') !== 'off'; } catch (e) { return true; } },
  setReplay(on) { try { localStorage.setItem('starfoot_replay', on ? 'on' : 'off'); } catch (e) { /* yok */ } },
  setStyle(v) {
    try { localStorage.setItem('starfoot_shot', v === 'aim' ? 'aim' : 'swipe'); } catch (e) { /* yok */ }
    try {
      if (typeof Premium !== 'undefined' && Premium.track) Premium.track('shot_style', { style: v === 'aim' ? 'aim' : 'swipe' });
      const F = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.FirebaseAnalytics;
      if (F && F.setUserProperty) F.setUserProperty({ key: 'shot_style', value: v === 'aim' ? 'aim' : 'swipe' }).catch(() => {});
    } catch (e) { /* yok */ }
  },
  aimSeen: 0,

  // Kaydırarak şut / dokunarak pas sahnesi. Promise<{outcome, mate?}>
  play(host, scene, o) {
    return new Promise((resolve) => {
      const defLift = scene.type === 'freekick' ? 1 : 0;
      host.innerHTML = `
        <div class="mg">
          <div class="mg-stage"><canvas class="mg-canvas"></canvas></div>
          <div class="mg-lift" role="group" aria-label="Vuruş tipi"${MiniGame.style() === 'aim' ? ' style="display:none"' : ''}>
            ${LIFTS.map((l, i) => `<button type="button" data-lift="${i}" class="${i === defLift ? 'on' : ''}"><b>${l.l}</b><small>${l.d}</small></button>`).join('')}
          </div>
        </div>`;
      const stage = host.querySelector('.mg-stage');
      const cv = host.querySelector('canvas');
      const ctx = cv.getContext('2d');
      let liftIdx = defLift;
      let phase = 'aim';
      let gesture = null, preview = null, passTarget = null, offAtKick = new Set();
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
      const isFK = scene.type === 'freekick';
      // Uzak frikiklerde daha güçlü vuruş ve daha çok falso
      const fkFar = isFK ? U.clamp(((scene.dist || 20) - 17) / 8, 0, 1) : 0;
      const maxSpeed = 21 + st.shooting * 0.12 + (scene.type === 'penalty' ? 2 : 0) + (isFK ? 3 + fkFar * 3 : 0);
      const curveMax = (2.2 + st.technique * 0.075) * (isFK ? 1.3 : 1);
      const wx = o.weather || null;
      const angSigma = ((1 - st.technique / 100) * 2.8 + 0.3) * cond * (0.55 + 0.8 * s) * Math.PI / 180 * (wx ? wx.sigma : 1) * (HARD() ? 1.2 : 1);
      const passSigma = ((1 - st.passing / 100) * 2.4 + 0.25) * cond * (0.6 + 0.6 * s) * Math.PI / 180;
      const assist = U.clamp(0.75 - s, 0, 0.6); // nişan yardımı (düşük seviyelerde güçlü)
      const previewFrac = U.clamp(0.65 + st.technique / 200 + assist * 0.4, 0.65, 1) * (wx && wx.vis ? 1 - wx.vis * 0.5 : 1) * (HARD() ? 0.85 : 1);
      const POWER_M = 14;

      const ball = { x: scene.ball.x, y: scene.ball.y, z: 0, vx: 0, vy: 0, vz: 0, spin: 0, rot: 0 };
      const mk = (e, seed, extra) => Object.assign({ px: e.x, py: e.y, run: 0, spd: 0, look: Sprites.look(seed) }, e, extra);
      const shooter = mk({ x: scene.ball.x - 0.6, y: scene.ball.y + 0.7 }, 7, { num: o.number || 10, look: Sprites.me() });
      const kp = scene.keeper;
      const keeper = mk({ x: kp.x, y: kp.y }, 3, {
        delay: (0.34 - 0.2 * s + fkFar * 0.12) * (HARD() ? 0.7 : 1), speed: (1.6 + 3.0 * s) * (1 - fkFar * 0.25) * (HARD() ? 1.22 : 1), reach: (0.5 + 0.55 * s) * (1 - fkFar * 0.15) * (HARD() ? 1.18 : 1), dive: (0.2 + 0.6 * s) * (HARD() ? 1.2 : 1),
        tx: kp.x, pen: scene.type === 'penalty', diveAmt: 0,
      });
      const defs = scene.defenders.map((d, i) => mk(d, 11 + i * 3, { num: [4, 5, 6, 3, 2, 8, 14, 22][i % 8] }));
      const mates = scene.mates.map((m, i) => mk(m, 31 + i * 5));
      const dSpeed = (0.8 + 2.4 * s) * (HARD() ? 1.3 : 1);
      const dDelay = (0.26 - 0.12 * s) * (HARD() ? 0.65 : 1);
      const kits = o.kits;

      let t = 0, kickT = -9, endT = 0;
      // Süre ve rakip baskısı oyuncu topa ilk dokunduğunda başlar (düşünme süresi serbest)
      let touched = false, aimT = 0, chipKick = false;
      // Dokunuş tarzı: önce geri çekip nişan alınır (yön + güç), sonra büyük topun bir noktasına dokunulur:
      // yanlar falso, alt kısım aşırtma/yükseklik, üst kısım sert ve alçak vuruş
      const aimStyle = MiniGame.style() === 'aim';
      let aimSt = null; // { ang, power }
      const showAimHint = aimStyle && MiniGame.aimSeen++ < 4;
      // nişandan sonra ayrı yakın plan sahnesi: ekranın ortasında büyük top
      const touchBall = () => ({ x: W / 2, y: H * 0.48, R: Math.min(W * 0.36, H * 0.24) });
      let result = null, resultText = '', resultColor = '#fff';
      let slowmo = 1, particles = [], netShake = 0, flash = 0;
      // görsel efektler: top izi, kamera sarsıntısı ve yakınlaşma, filede çarpma noktası
      let trail = [], camShake = 0, camZoom = 0, zoomAt = null, netHitX = null, netBall = false, netHit = false;
      let last = performance.now(), raf = 0;
      const showHint = MiniGame.seen++ < 3;
      // gol tekrarı: vuruştan golün biraz sonrasına kadar her kare kaydedilir
      const REC = MiniGame.replayOn() && !(typeof Game !== 'undefined' && Game.ff) ? [] : null;
      let replaying = false;

      // ---- kamera: ekran oranına göre top, kale ve oyuncuları kapsar ----
      let W = 0, H = 0, PX = 1, dpr = 1, view = null, bg = null;
      const tx = (x) => (x - view.x0) * PX;
      const ty = (y, z = 0) => (y - view.y0) * PX - z * PX * 0.8;
      const toWorld = (cx, cy) => ({ x: cx / PX + view.x0, y: cy / PX + view.y0 });
      const layout = () => {
        const cw = Math.max(200, stage.clientWidth), ch = Math.max(200, stage.clientHeight);
        dpr = Perf.dpr();
        W = Math.round(cw * dpr); H = Math.round(ch * dpr);
        cv.width = W; cv.height = H;
        cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
        const pts = [scene.ball, ...scene.defenders, ...scene.mates, { x: -4.5, y: -1 }, { x: 4.5, y: -1 }];
        const mx = cw / ch < 0.9 ? 1.8 : 3.5;
        let x0 = Math.min(...pts.map((e) => e.x)) - mx, x1 = Math.max(...pts.map((e) => e.x)) + mx;
        // kale arkasındaki tribün ve pankart görünsün diye kamera biraz geriden başlar (mahallede duvar yeterli)
        let y0 = Sprites.surface === 'sand' ? -4.6 : -6.8, y1 = Math.max(...pts.map((e) => e.y)) + 3;
        const A = cw / ch;
        // kaleye yakın sahnelerde kamera fazla yaklaşmasın: en az bu kadar saha görünür
        y1 = Math.max(y1, y0 + (A < 0.9 ? 28 : 24));
        if (x1 - x0 < 18) { const c = (x0 + x1) / 2; x0 = c - 9; x1 = c + 9; }
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
        const me = typeof Game !== 'undefined' && Game.p ? Game.p : null;
        Sprites.crowd = { c1: kits.own.shirt, c2: kits.own.pattern === 'plain' ? kits.own.alt : kits.own.alt || '#ffffff', name: me ? me.surname || me.name : '', number: o.number || 10 };
        Sprites.grass(b, W, H, tx, ty, PX, view);
        Sprites.stands(b, W, tx, ty, PX, view, dpr);
        Sprites.lines(b, tx, ty, PX);
      };
      layout();
      const onResize = () => layout();
      window.addEventListener('resize', onResize);
      MiniGame.dbg = { ball, keeper, defs, mates, scene, get tb() { return touchBall(); }, get view() { return view; }, get PX() { return PX; }, get dpr() { return dpr; } };

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
        const spin = aimStyle ? 0 : curve * curveMax;
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

      // Aşırtma: güç, topu üst direğin altından kalecinin üstüne düşürecek hıza doğru çekilir (teknik arttıkça daha isabetli)
      const chipSpeed = (ang, sp) => {
        if (liftIdx !== 2) return sp;
        const dy = -Math.sin(ang);
        if (dy < 0.2) return sp;
        const D = ball.y / dy, th = LIFTS[2].v * 0.62, Hs = 2.0;
        if (D * Math.tan(th) <= Hs + 0.4) return sp;
        const ideal = Math.min(maxSpeed * 1.05, Math.sqrt((9.8 * D * D) / (2 * Math.cos(th) ** 2 * (D * Math.tan(th) - Hs))) * 1.02);
        const k = U.clamp(0.35 + st.technique / 250 + assist * 0.4, 0.35, 0.85);
        return sp * (1 - k) + ideal * k;
      };

      const simulate = (pr) => {
        const b = { x: ball.x, y: ball.y, z: 0, vx: 0, vy: 0, vz: 0, spin: 0 };
        const a0 = assistAngle(pr.ang);
        BallPhys.launch(b, a0, chipSpeed(a0, pr.power * maxSpeed), LIFTS[liftIdx].v, pr.spin);
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
        if (aimStyle && aimSt) {
          const p = toCanvas(e), tb = touchBall();
          touched = true;
          e.preventDefault();
          let dx = (p[0] - tb.x) / tb.R, dy = (p[1] - tb.y) / tb.R;
          const r = Math.hypot(dx, dy);
          // topun dışına dokunmak: nişanı iptal et, yeniden çek
          if (r > 1.25) { aimSt = null; return; }
          if (r > 1) { dx /= r; dy /= r; }
          const rr = Math.min(1, r);
          // falso eğrisi: merkezde yumuşak, kenara doğru güçlenir
          const ck = Math.sign(dx) * Math.pow(Math.abs(dx), 0.85);
          // dikey: üst = alçak ve sert, orta = yarım yükseklik, alt = aşırtma
          // yandan vuruşta top hafif havalanır
          const liftV = Math.max(U.clamp((dy + 0.25) / 1.15, 0, 1) * 0.62, 0.16 * Math.abs(ck));
          liftIdx = liftV > 0.42 ? 2 : liftV > 0.1 ? 1 : 0;
          const power = U.clamp(aimSt.power * (1 + 0.06 * Math.max(0, -dy)), 0.15, 1);
          // top nişan yönünde çıkar, sonra falso yönüne kıvrılır; sol tarafa vurmak topu sağa (+x) götürür
          const dirY = Math.sin(aimSt.ang);
          const dist = dirY < -0.15 ? Math.min(ball.y / -dirY, 40) : 20;
          // topun kenarına vurmak: çok hafif rastgele sapma (falsonun miktarı değişmez)
          const edge = Math.max(0, rr - 0.85) / 0.15;
          const ang = assistAngle(aimSt.ang) + U.gauss() * 0.012 * edge;
          const sp = chipSpeed(ang, power * maxSpeed);
          const want = -TouchCurl.bend(ck, dist, st.technique);
          const spin = Math.abs(ck) < 0.02 ? 0 : TouchCurl.solve(ball, ang, sp, liftV, want, curveMax * 4);
          MiniGame.lastAim = { power, dx, dy, liftV, want, spin, dist };
          aimSt = null;
          kick(ang, power, spin, false, liftV);
          return;
        }
        cv.setPointerCapture(e.pointerId);
        const p = toCanvas(e);
        const w0 = toWorld(p[0], p[1]);
        // Kaptan: arkadaşına basılı tutup sürükleyerek yerini değiştirir
        gesture = { pts: [p], world: [w0], mate: o.captain ? mateAt(w0) : null, drag: false };
        touched = true;
        preview = null;
        e.preventDefault();
      });
      cv.addEventListener('pointermove', (e) => {
        if (!gesture) return;
        const p = toCanvas(e);
        const lp = gesture.pts[gesture.pts.length - 1];
        if (Math.hypot(p[0] - lp[0], p[1] - lp[1]) < 3 * dpr) return;
        if (gesture.mate) {
          const g0 = gesture.pts[0];
          if (!gesture.drag && Math.hypot(p[0] - g0[0], p[1] - g0[1]) > 14 * dpr) gesture.drag = true;
          if (gesture.drag) {
            const m = gesture.mate, w = toWorld(p[0], p[1]);
            if (m.ox == null) { m.ox = m.x; m.oy = m.y; }
            m.x = U.clamp(U.clamp(w.x, m.ox - 8, m.ox + 8), -20, 20);
            m.y = U.clamp(U.clamp(w.y + 0.6, m.oy - 8, m.oy + 8), 2, 33);
            preview = null;
            e.preventDefault();
            return;
          }
        }
        gesture.pts.push(p);
        gesture.world.push(toWorld(p[0], p[1]));
        refreshPreview();
        e.preventDefault();
      });
      cv.addEventListener('pointerup', () => {
        if (!gesture || phase !== 'aim') return;
        const g = gesture;
        gesture = null;
        if (g.drag) { preview = null; return; }
        const p0 = g.pts[0], p1 = g.pts[g.pts.length - 1];
        if (Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) < 12 * dpr) {
          const m = mateAt(g.world[0]);
          preview = null;
          if (m) passTo(m);
          return;
        }
        const pr = params(g);
        preview = null;
        if (pr && aimStyle) { aimSt = { ang: pr.ang, power: pr.power, t0: t }; return; }
        if (pr) kick(assistAngle(pr.ang), pr.power, pr.spin, false);
      });
      cv.addEventListener('pointercancel', () => { gesture = null; preview = null; });

      function passTo(m) {
        // Ofsayt: pas anında son savunmacının gerisinde ve topun önündeyse
        if (scene.offside != null && m.y < scene.offside - 0.15 && m.y < ball.y) {
          m.offside = true;
          return finish('offside', 'OFSAYT!', '#ffcf3f', { mate: m.name });
        }
        const tgx = m.x, tgy = m.y - 0.6;
        const D = Math.hypot(tgx - ball.x, tgy - ball.y);
        // pasta yükseklik: yarım = orta yay, aşırtma = savunmanın üstünden yüksek yay
        const lift = [0, 0.8, 1.25][liftIdx];
        let speed;
        if (lift === 0) speed = Math.sqrt(9.5 * 9.5 + 2 * 3.2 * D);
        else {
          const th = lift * 0.62;
          speed = Math.sqrt((D * 9.8) / Math.max(0.2, Math.sin(2 * th))) * 0.95;
        }
        speed = Math.min(speed, maxSpeed);
        passTarget = m;
        kick(Math.atan2(tgy - ball.y, tgx - ball.x), speed / maxSpeed, 0, true, lift);
      }

      function kick(ang, power, spin, isPass, liftV) {
        if (typeof Sfx !== 'undefined') { Sfx.play('kick'); Sfx.buzz(isPass ? 'light' : 'medium'); }
        // vuruş anında ofsayttaki arkadaşlar: top onlara ulaşırsa ofsayt (dokunarak pas vermesen de)
        offAtKick = scene.offside != null ? new Set(mates.filter((m) => m.y < scene.offside - 0.15 && m.y < ball.y)) : new Set();
        const sig = isPass ? passSigma : angSigma * (0.6 + 0.5 * power);
        const a = ang + U.gauss() * sig;
        const sp = (isPass ? power * maxSpeed : chipSpeed(a, power * maxSpeed)) * (1 + U.gauss() * 0.035 * cond);
        chipKick = !isPass && liftIdx === 2;
        BallPhys.launch(ball, a, sp, (liftV != null ? liftV : LIFTS[liftIdx].v) * (1 + U.gauss() * 0.05 * cond), spin * (1 + U.gauss() * 0.08 * cond));
        phase = 'fly';
        kickT = t;
        if (keeper.pen) {
          let side = U.weighted([-1, 0, 1], (v) => (v === 0 ? 0.2 : 0.4));
          // Zor: kaleci vuruşu daha sık doğru okur (topun gideceği tarafa atlar)
          if (HARD() && ball.vy < -0.5 && U.chance(0.45)) { const px = ball.x + ball.vx * (ball.y / -ball.vy); side = Math.abs(px) < 0.9 ? 0 : Math.sign(px); }
          keeper.tx = side * U.rand(1.6, 3.0);
          keeper.delay = HARD() ? 0.12 : 0.16;
          keeper.speed = (2.8 + 2.0 * s) * (HARD() ? 1.15 : 1);
          keeper.reach = (0.55 + 0.35 * s) * (HARD() ? 1.12 : 1);
          keeper.dive = (0.25 + 0.4 * s) * (HARD() ? 1.15 : 1);
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
        if (typeof Sfx !== 'undefined') {
          if (outcome === 'goal') { Sfx.play('net'); setTimeout(() => Sfx.play(Sprites.surface === 'sand' ? 'cheer' : 'roar'), 180); }
          else if (outcome === 'saved') Sfx.play('save');
          else if (outcome === 'post' || outcome === 'bar') { Sfx.play('post'); Sfx.play('ooh'); Sfx.buzz('medium'); }
          else if (outcome === 'miss') Sfx.play('ooh');
        }
        if (outcome === 'saved' || outcome === 'claimed') { camZoom = 1; zoomAt = [tx(keeper.x), ty(keeper.y) - FIG() * 0.5]; }
        if (outcome === 'goal' || (extra && extra.mateGoal)) {
          netShake = 0.3; flash = 1; camShake = 1; netHitX = ball.x; netBall = true;
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
          const since = keeper.diveT0 != null ? t - keeper.diveT0 : -1;
          if (since < 0.5 && (since < 0 || Math.sign(d) === keeper.diveDir)) keeper.x += Math.sign(d) * Math.min(Math.abs(d), (ms.goal ? 2.6 : 5) * dt);
          if (ball.y < 7 && keeper.diveT0 == null) {
            keeper.diveDir = Math.sign(ms.tx - keeper.x) || 1;
            keeper.diveT0 = t;
            keeper.diveHigh = ball.z > 1.2;
            keeper.diveAmt = 1;
          }
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
          if (touched) aimT += dt;
          if (scene.creep && touched) {
            defs.forEach((d) => {
              if (!d.presser) return;
              const dx = ball.x - d.x, dy = ball.y - d.y, dist = Math.hypot(dx, dy);
              if (dist > 0.01) { d.x += (dx / dist) * scene.creep * dt; d.y += (dy / dist) * scene.creep * dt; }
              if (dist < 1.05) finish('lost', 'TOPU KAPTIRDIN', '#ff6b6b');
            });
          }
          if (aimT > scene.timeLimit) finish('lost', scene.creep ? 'TOPU KAPTIRDIN' : 'SÜRE DOLDU', '#ff6b6b');
          keeper.x += (U.clamp(ball.x * (HARD() ? 0.24 : 0.15), HARD() ? -2.6 : -2, HARD() ? 2.6 : 2) - keeper.x) * Math.min(1, dt * (HARD() ? 3 : 2));
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
          // uçuş: hızlı sıçrama, yere inince kayma yok
          const since = keeper.diveT0 != null ? t - keeper.diveT0 : -1;
          const lunge = since >= 0 ? 1.8 : 1;
          // uçuş başladıktan sonra yalnızca atladığı yöne kayar (gövde ile hareket hep aynı yönde)
          if (since < 0.5 && (since < 0 || Math.sign(d) === keeper.diveDir)) keeper.x += Math.sign(d) * Math.min(Math.abs(d), keeper.speed * lunge * dt);
          if (ball.y < 8 && keeper.diveT0 == null && (Math.abs(d) > 0.45 || (ball.z > 1.4 && Math.abs(ball.x - keeper.x) > 0.3))) {
            // yön: topun kale çizgisinden geçeceği nokta (falsolu şutta anlık konum ters tarafta kalabiliyordu)
            keeper.diveDir = Math.abs(d) > 0.05 ? Math.sign(d) : (Math.sign(ball.x - keeper.x) || 1);
            keeper.diveT0 = t;
            keeper.diveHigh = ball.z > 1.2;
          }
          if (keeper.diveT0 != null) keeper.diveAmt = 1;
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
            if (offAtKick.has(m)) { m.offside = true; return finish('offside', 'OFSAYT!', '#ffcf3f', { mate: m.name }); }
            return startMateShot(m);
          }
        }
        // Zor: kaleci açıyı daha iyi kapatır, köşelere ve yüksek toplara daha iyi uzanır
        const HD = HARD();
        const reach = keeper.reach + (ball.y < 5 ? keeper.dive : 0) + (HD ? 0.25 : 0);
        if (prevY >= keeper.y && ball.y < keeper.y) {
          // aşırtmada kaleci düşen topa geriye doğru uzanamaz: yüksek top sınırı daha alçak
          const maxZ = chipKick ? 1.85 + 0.35 * s + (HD ? 0.1 : 0) : 2.2 + 0.3 * s + (HD ? 0.1 : 0);
          const r = ball.z > 1.7 ? reach * (HD ? 0.82 : 0.75) : reach;
          if (Math.abs(ball.x - keeper.x) < r && ball.z < maxZ) return finish('saved', 'KALECİ KURTARDI', '#ffd166');
        }
        if (ball.y < 6 && ball.y > keeper.y && Math.hypot(ball.x - keeper.x, ball.y - keeper.y) < (HD ? 1.2 : 1.0) && ball.z < 2.3 && hs < (HD ? 10.5 : 9)) {
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

      function drawAim() {
        const fs = dpr;
        const since = t - aimSt.t0;
        const k = U.clamp(since / 0.22, 0, 1), ek = 1 - (1 - k) * (1 - k);
        const tb = touchBall(), R = tb.R * (0.55 + 0.45 * ek);
        ctx.save();
        ctx.globalAlpha = ek;
        // yakın plan çim: perspektifli şeritler ve kenar gölgesi
        const g0 = ctx.createLinearGradient(0, 0, 0, H);
        g0.addColorStop(0, '#1d5a2c'); g0.addColorStop(1, '#2f8a43');
        ctx.fillStyle = g0; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        for (let i = 0; i < 9; i++) { const y0 = H * Math.pow(i / 9, 1.6), y1 = H * Math.pow((i + 0.5) / 9, 1.6); ctx.fillRect(0, y0, W, y1 - y0); }
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        for (let i = 0; i < 160; i++) { const x = ((i * 97) % 1000) / 1000 * W, y = ((i * 571) % 1000) / 1000 * H; ctx.fillRect(x, y, 2 * fs, 6 * fs); }
        const vg = ctx.createRadialGradient(W / 2, H * 0.5, Math.min(W, H) * 0.25, W / 2, H * 0.5, Math.max(W, H) * 0.75);
        vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
        ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
        // gölge
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath(); ctx.ellipse(tb.x + R * 0.12, tb.y + R * 0.95, R * 0.95, R * 0.2, 0, 0, Math.PI * 2); ctx.fill();
        // top
        const gr = ctx.createRadialGradient(tb.x - R * 0.35, tb.y - R * 0.4, R * 0.1, tb.x, tb.y, R);
        gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#c3ccdd');
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.arc(tb.x, tb.y, R, 0, Math.PI * 2); ctx.fill();
        ctx.save();
        ctx.beginPath(); ctx.arc(tb.x, tb.y, R, 0, Math.PI * 2); ctx.clip();
        ctx.fillStyle = '#1b2236';
        const pent = (cx, cy, r, rot) => { ctx.beginPath(); for (let i = 0; i < 5; i++) { const a = rot + (i * Math.PI * 2) / 5; ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r, cy + Math.sin(a) * r); } ctx.closePath(); ctx.fill(); };
        pent(tb.x, tb.y, R * 0.24, -Math.PI / 2);
        for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + Math.PI / 5 + (i * Math.PI * 2) / 5; pent(tb.x + Math.cos(a) * R * 0.92, tb.y + Math.sin(a) * R * 0.92, R * 0.24, a); }
        ctx.restore();
        ctx.strokeStyle = 'rgba(255,61,240,0.55)'; ctx.lineWidth = 1.5 * fs; ctx.setLineDash([4 * fs, 5 * fs]);
        ctx.beginPath(); ctx.moveTo(tb.x - R, tb.y); ctx.lineTo(tb.x + R, tb.y); ctx.moveTo(tb.x, tb.y - R); ctx.lineTo(tb.x, tb.y + R); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = 'rgba(5,11,29,0.9)'; ctx.lineWidth = 2.5 * fs;
        ctx.beginPath(); ctx.arc(tb.x, tb.y, R, 0, Math.PI * 2); ctx.stroke();
        // yanlarda falso okları
        const curl = (side) => {
          const a = side > 0 ? 0 : Math.PI, rr = R * 1.14;
          ctx.strokeStyle = '#ff3df0'; ctx.fillStyle = '#ff3df0'; ctx.lineWidth = 4 * fs; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.arc(tb.x, tb.y, rr, a - 0.42, a + 0.42); ctx.stroke();
          const ea = a - 0.42 * side, ex = tb.x + Math.cos(ea) * rr, ey = tb.y + Math.sin(ea) * rr;
          const hx = Math.sin(ea) * side, hy = -Math.cos(ea) * side;
          ctx.beginPath(); ctx.moveTo(ex + hx * 9 * fs, ey + hy * 9 * fs); ctx.lineTo(ex - hy * 6 * fs, ey + hx * 6 * fs); ctx.lineTo(ex + hy * 6 * fs, ey - hx * 6 * fs); ctx.closePath(); ctx.fill();
          ctx.lineCap = 'butt';
        };
        curl(-1); curl(1);
        ctx.font = `800 ${Math.round(14 * fs)}px "Barlow Semi Condensed", "Arial Narrow", sans-serif`;
        ctx.textAlign = 'center';
        const lab = (txt, x, y) => { const w = ctx.measureText(txt).width + 14 * fs; ctx.fillStyle = 'rgba(5,11,29,0.82)'; ctx.fillRect(x - w / 2, y - 15 * fs, w, 21 * fs); ctx.fillStyle = '#fff'; ctx.fillText(txt, x, y); };
        lab('SERT', tb.x, tb.y - R * 1.14 - 12 * fs);
        lab('AŞIRTMA', tb.x, tb.y + R * 1.14 + 24 * fs);
        // üstte süre çubuğu ve nişanın gücü
        const rem = U.clamp(1 - aimT / scene.timeLimit, 0, 1);
        ctx.fillStyle = 'rgba(10,16,32,0.6)'; ctx.fillRect(0, 0, W, 7 * fs);
        ctx.fillStyle = rem > 0.35 ? '#ffcf3f' : '#ff5a4f'; ctx.fillRect(0, 0, W * rem, 7 * fs);
        const pw = Math.min(W * 0.5, 180 * fs), px = W / 2 - pw / 2, py = 26 * fs;
        ctx.fillStyle = 'rgba(5,11,29,0.75)'; ctx.fillRect(px - 30 * fs, py - 4 * fs, pw + 38 * fs, 18 * fs);
        ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.round(13 * fs)}px sans-serif`; ctx.fillText('⚡', px - 16 * fs, py + 10 * fs);
        ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(px, py, pw, 10 * fs);
        ctx.fillStyle = aimSt.power > 0.85 ? '#ff785a' : '#ffcf3f'; ctx.fillRect(px, py, pw * aimSt.power, 10 * fs);
        ctx.restore();
        pill(since < 2.5 ? 'TOPUN BİR NOKTASINA DOKUN' : since < 5.5 ? 'YANLAR FALSO  ·  ALT KISIM AŞIRTMA' : 'DIŞARI DOKUN: YENİDEN NİŞAN');
      }

      function drawPreview() {
        if (!preview || !preview.pts.length) return;
        const pts = preview.pts;
        const n = Math.max(2, Math.floor(pts.length * previewFrac));
        // her zeminde görünsün: koyu gölge + beyaz çekirdek
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(5,11,29,0.55)'; ctx.lineWidth = 7 * dpr;
        ctx.beginPath(); ctx.moveTo(tx(ball.x), ty(ball.y));
        for (let i = 0; i < n; i++) ctx.lineTo(tx(pts[i][0]), ty(pts[i][1], pts[i][2]));
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 3 * dpr; ctx.setLineDash([2 * dpr, 9 * dpr]);
        ctx.beginPath(); ctx.moveTo(tx(ball.x), ty(ball.y));
        for (let i = 0; i < n; i++) ctx.lineTo(tx(pts[i][0]), ty(pts[i][1], pts[i][2]));
        ctx.stroke(); ctx.setLineDash([]); ctx.lineCap = 'butt';
        const e = pts[n - 1];
        const ex = tx(e[0]), ey = ty(e[1], e[2]), r = 11 * dpr;
        ctx.strokeStyle = 'rgba(5,11,29,0.8)'; ctx.lineWidth = 6 * dpr;
        ctx.beginPath(); ctx.arc(ex, ey, r, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = '#ff3df0'; ctx.lineWidth = 3 * dpr;
        ctx.beginPath(); ctx.arc(ex, ey, r, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ex - r * 1.7, ey); ctx.lineTo(ex - r * 0.6, ey); ctx.moveTo(ex + r * 0.6, ey); ctx.lineTo(ex + r * 1.7, ey);
        ctx.moveTo(ex, ey - r * 1.7); ctx.lineTo(ex, ey - r * 0.6); ctx.moveTo(ex, ey + r * 0.6); ctx.lineTo(ex, ey + r * 1.7);
        ctx.stroke();
      }

      function drawHud() {
        const fs = dpr;
        if (phase === 'aim') {
          const rem = U.clamp(1 - aimT / scene.timeLimit, 0, 1);
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
          pill(`GÜÇ ${Math.round(preview.power * 100)}   ·   ${Math.abs(c) < 0.12 ? 'DÜZ' : c > 0 ? '◀ FALSO' : 'FALSO ▶'}   ·   ${LIFTS[liftIdx].l.toUpperCase()}${isFK ? `   ·   ${Math.round(scene.dist)} M` : ''}`);
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
        if (o.captain && phase === 'aim' && !gesture && !preview && t < 3.5 && scene.mates.length) {
          pill('KAPTANSIN: ARKADAŞINI BASILI TUTUP SÜRÜKLE');
        } else if ((showHint || showAimHint) && !aimSt && phase === 'aim' && !gesture && !preview) {
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
        // kamera: golde kısa sarsıntı, kurtarışta kaleciye hafif yakınlaşma
        ctx.save();
        if (camShake > 0) ctx.translate(Math.sin(t * 61) * 7 * dpr * camShake, Math.cos(t * 47) * 5 * dpr * camShake);
        if (camZoom > 0 && zoomAt) { const z = 1 + 0.07 * Math.sin(Math.min(1, camZoom) * Math.PI / 2); ctx.translate(zoomAt[0], zoomAt[1]); ctx.scale(z, z); ctx.translate(-zoomAt[0], -zoomAt[1]); }
        ctx.drawImage(bg, 0, 0);
        Sprites.standsFx(ctx, t, result && result.outcome === 'goal' ? U.clamp((t - endT) * 3, 0, 1) : 0);
        // file: top arka fileye çarpınca geriye doğru cep yapar ve yavaşça sönümlenir
        const sh = netShake > 0 ? (netHit ? -(0.6 + 0.4 * Math.cos(t * 16)) * 11 * dpr * netShake : Math.sin(t * 50) * 4 * dpr * netShake) : 0;
        Sprites.net(ctx, tx, ty, PX, sh, netHitX);
        if (scene.offside != null && (phase === 'aim' || (result && result.outcome === 'offside'))) {
          // TV tarzı ofsayt çizgisi
          const oy = ty(scene.offside);
          ctx.strokeStyle = result && result.outcome === 'offside' ? 'rgba(255,207,63,0.95)' : 'rgba(120,200,255,0.55)';
          ctx.lineWidth = 2.5 * dpr; ctx.setLineDash([12 * dpr, 8 * dpr]);
          ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(W, oy); ctx.stroke(); ctx.setLineDash([]);
          ctx.font = `700 ${Math.round(11 * dpr)}px "Barlow Semi Condensed", sans-serif`;
          ctx.fillStyle = 'rgba(120,200,255,0.9)'; ctx.textAlign = 'left';
          ctx.fillText('OFSAYT ÇİZGİSİ', 8 * dpr, oy - 5 * dpr);
        }
        if (phase === 'aim') drawPreview();
        const h = FIG();
        const lab = (txt) => (phase === 'aim' ? txt : null);
        const ents = [];
        ents.push({ y: 0, d: () => Sprites.frame(ctx, tx, ty, PX) });
        ents.push({ y: keeper.y, d: () => {
          const gx = tx(keeper.x), gy = ty(keeper.y);
          if (keeper.diveT0 == null) {
            // hazır duruş: dizler hafif kırık, kollar yana açık, parmak ucunda küçük yaylanma
            const moving = keeper.spd > 0.15;
            const bob = moving ? 0 : Math.abs(Math.sin(t * 5.5)) * h * 0.018;
            ctx.fillStyle = 'rgba(0,0,0,0.26)';
            ctx.beginPath(); ctx.ellipse(gx + h * 0.05, gy + h * 0.02, h * 0.26, h * 0.07, 0, 0, Math.PI * 2); ctx.fill();
            return Sprites.figure(ctx, gx, gy - bob, h * 0.96, { kit: kits.gk, look: keeper.look, facing: 'down', number: 1, run: keeper.run, speed: moving ? Math.max(keeper.spd, 0.5) : 0, armA: moving ? 0.35 : 0.62 + Math.sin(t * 5.5) * 0.04, gloves: true, noShadow: true, t });
          }
          // Uçuş: kısa çömelme ile itiş, kavisli uçuş (gövde topa doğru uzanır), yere iniş ve yerde kalış
          const since = Math.max(0, t - keeper.diveT0);
          const dir = keeper.diveDir || 1, high = keeper.diveHigh;
          const ease = (k) => 1 - Math.pow(1 - k, 3);
          const push = U.clamp(since / 0.07, 0, 1);                 // itiş
          const fly = U.clamp((since - 0.05) / 0.4, 0, 1);         // uçuş
          const land = U.clamp((since - 0.42) / 0.16, 0, 1);       // iniş
          const rotMax = high ? 1.12 : 1.38;
          const rot = dir * (ease(fly) * rotMax + land * (1.5 - rotMax));
          const air = Math.sin(fly * Math.PI) * (high ? 0.68 : 0.36) * (1 - land);
          const crouch = (1 - fly) * push * 0.06;
          // gölge yerde kalır, uçuşta küçülür
          ctx.fillStyle = 'rgba(0,0,0,0.25)';
          ctx.beginPath(); ctx.ellipse(gx + dir * h * 0.3 * ease(fly), gy, h * (0.34 + 0.18 * ease(fly)) * (1 - air * 0.35), h * 0.08, 0, 0, Math.PI * 2); ctx.fill();
          // iniş tozu
          if (land > 0 && land < 1) {
            ctx.fillStyle = `rgba(225,230,205,${0.32 * (1 - land)})`;
            for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(gx + dir * h * (0.1 + k * 0.28), gy - h * 0.02, h * (0.06 + land * 0.12), 0, Math.PI * 2); ctx.fill(); }
          }
          ctx.save();
          ctx.translate(gx, gy - h * 0.5 * Math.cos(rot) * (1 - land * 0.35) - air * h + crouch * h);
          ctx.rotate(rot);
          ctx.scale(1, 1 + 0.07 * Math.sin(fly * Math.PI)); // uçuşta gövde uzar
          Sprites.figure(ctx, 0, h * 0.5, h, { kit: kits.gk, look: keeper.look, facing: 'down', gloves: true, dive: 1, noShadow: true, kick: fly > 0 && land < 1 ? 0.35 : 0, t });
          ctx.restore();
        } });
        defs.forEach((d) => ents.push({ y: d.y, d: () => Sprites.figure(ctx, tx(d.x), ty(d.y), h * (d.wall ? 1.02 : 1), { kit: kits.opp, look: d.look, facing: 'down', number: d.num, run: d.run, speed: d.spd, dive: d.wall && phase !== 'aim' ? 0.5 : 0, t }) }));
        mates.forEach((m) => ents.push({ y: m.y, d: () => Sprites.figure(ctx, tx(m.x), ty(m.y), h, { kit: kits.own, look: m.look, facing: 'up', run: m.run, speed: m.spd, number: m.num, kick: mateShot && mateShot.m === m && t - mateShot.kickT < 0.35 ? (t - mateShot.kickT) / 0.35 : 0, label: lab(m.name.split(' ').slice(-1)[0].toUpperCase()), labelScale: dpr, ring: phase === 'aim' ? 'rgba(124,240,160,0.95)' : null, t }) }));
        const kickA = phase !== 'aim' && t - kickT < 0.35 ? (t - kickT) / 0.35 : 0;
        ents.push({ y: shooter.y, d: () => Sprites.figure(ctx, tx(shooter.x), ty(shooter.y), h, { kit: kits.own, look: shooter.look, facing: 'up', number: shooter.num, kick: kickA, label: lab('SEN'), labelScale: dpr, labelColor: 'rgba(214,40,57,0.92)', t }) });
        ents.push({
          y: ball.y + 0.01, d: () => {
            const br = Math.max(3.5 * dpr, 0.22 * PX) * (1 + ball.z * 0.05);
            // sert vuruşta topun arkasında solan iz
            if (trail.length > 1) {
              ctx.lineCap = 'round';
              for (let k = 1; k < trail.length; k++) {
                const a = trail[k - 1], b = trail[k], f = k / trail.length;
                ctx.strokeStyle = `rgba(255,255,255,${0.32 * f})`; ctx.lineWidth = br * 1.3 * f;
                ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
              }
              ctx.lineCap = 'butt';
            }
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath(); ctx.ellipse(tx(ball.x) + ball.z * PX * 0.15, ty(ball.y), br * 1.1, br * 0.45, 0, 0, Math.PI * 2); ctx.fill();
            Sprites.ball(ctx, tx(ball.x), ty(ball.y, ball.z) - br * 0.8, br, ball.rot);
          },
        });
        ents.sort((a, b) => a.y - b.y).forEach((e) => e.d());
        ctx.restore();
        Weather.draw(ctx, wx, W, H, dpr, t);
        if (wx && wx.kmh && phase === 'aim') {
          // rüzgar göstergesi
          const x0 = W - 96 * dpr, y0 = 18 * dpr;
          ctx.fillStyle = 'rgba(10,16,32,0.7)'; ctx.fillRect(x0, y0, 86 * dpr, 26 * dpr);
          ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(12 * dpr)}px "Barlow Semi Condensed", sans-serif`; ctx.textAlign = 'center';
          ctx.fillText(`${wx.dir > 0 ? '➜' : '⬅'} ${wx.kmh} km/s`, x0 + 43 * dpr, y0 + 17 * dpr);
        }

        drawHud();
        // Dokunuş tarzı: nişandan sonra ayrı yakın plan sahnesi (her şeyin üstünde)
        if (aimStyle && aimSt && phase === 'aim') drawAim();

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

      const perfWatch = Perf.watch();
      function loop(now) {
        const rdt = Math.min(0.05, (now - last) / 1000);
        last = now;
        perfWatch(now); // yavaş cihazda hafif mod (sonraki sahnelerden itibaren 1x çözünürlük)
        const dt = rdt * slowmo;
        const n = Math.ceil(dt / (1 / 240));
        for (let i = 0; i < n && phase !== 'done'; i++) step(dt / n);
        if (phase === 'done') t += rdt;
        // golde top filenin içine kadar gider; arka fileye çarpınca file şişer ve top yere düşer
        if (phase === 'done' && netBall) {
          const sd = rdt * 0.55;
          BallPhys.step(ball, sd);
          ball.rot += Math.hypot(ball.vx, ball.vy) * sd * 1.6;
          if (ball.y < -1.75) {
            ball.y = -1.75; ball.vy = 0; ball.vx *= 0.3;
            if (!netHit) { netHit = true; netShake = 1; netHitX = ball.x; if (typeof Sfx !== 'undefined') Sfx.buzz('light'); }
          }
          if (Math.abs(ball.x) > PITCH.GOAL_W - 0.25) { ball.x = Math.sign(ball.x) * (PITCH.GOAL_W - 0.25); ball.vx *= -0.2; }
          if (ball.z > 2.2) { ball.z = 2.2; ball.vz = Math.min(0, ball.vz); }
        }
        netShake = Math.max(0, netShake - rdt * 1.1);
        camShake = Math.max(0, camShake - rdt * 2.4);
        camZoom = Math.max(0, camZoom - rdt * 0.9);
        if ((phase === 'fly' || phase === 'mfly') && Math.hypot(ball.vx, ball.vy) > 17) {
          trail.push([tx(ball.x), ty(ball.y, ball.z) - Math.max(3.5 * dpr, 0.22 * PX) * 0.8]);
          if (trail.length > 9) trail.shift();
        } else if (trail.length) trail.shift();
        flash = Math.max(0, flash - rdt * 3);
        draw(rdt);
        if (REC && kickT > -9 && REC.length < 900 && (phase !== 'done' || t - endT < 0.9)) REC.push(snap());
        if (phase === 'done' && t - endT > (result.outcome === 'goal' || result.mateGoal ? 2.0 : 1.5)) {
          if (REC && result.outcome === 'goal' && REC.length > 8) return startReplay();
          cleanup();
          resolve(result);
          return;
        }
        raf = requestAnimationFrame(loop);
      }
      const ents = () => [ball, keeper, shooter, ...defs, ...mates];
      function snap() {
        return {
          t, phase, netShake, netHitX, netBall, netHit, camShake, camZoom, zoomAt, flash, slowmo,
          trail: trail.map((x) => x.slice()), ms: mateShot ? Object.assign({}, mateShot) : null,
          e: ents().map((x) => Object.assign({}, x)),
        };
      }
      function restore(f) {
        ({ t, phase, netShake, netHitX, netBall, netHit, camShake, camZoom, zoomAt, flash, slowmo } = f);
        trail = f.trail.map((x) => x.slice());
        mateShot = f.ms ? Object.assign({}, f.ms) : null;
        ents().forEach((x, i) => Object.assign(x, f.e[i]));
      }
      // Ağır çekim tekrar (0.75x): "Geç" ile atlanır, sonunda sonuç normal şekilde döner
      function startReplay() {
        replaying = true; particles = [];
        const lb = host.querySelector('.mg-lift'); if (lb) lb.style.visibility = 'hidden';
        const t0 = REC[0].t, span = REC[REC.length - 1].t - t0;
        const skip = document.createElement('button');
        skip.type = 'button'; skip.className = 'mg-skip'; skip.textContent = 'Geç ▶▶';
        stage.appendChild(skip);
        const badge = document.createElement('div');
        badge.className = 'mg-replay'; badge.innerHTML = '<i></i>TEKRAR · 0.75x';
        stage.appendChild(badge);
        let pt = 0, prev = performance.now(), i = 0, over = false;
        const end = () => {
          if (over) return; over = true;
          cancelAnimationFrame(raf); skip.remove(); badge.remove();
          cleanup(); resolve(result);
        };
        skip.onclick = end;
        MiniGame._abort = end;
        const rl = (now) => {
          if (over) return;
          pt += Math.min(0.05, (now - prev) / 1000) * 0.75; prev = now;
          while (i < REC.length - 1 && REC[i + 1].t - t0 <= pt) i++;
          restore(REC[i]);
          draw(0);
          // tekrar karesi: kenarlarda hafif karartma
          ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, 0, W, H);
          if (pt >= span + 0.35) return end();
          raf = requestAnimationFrame(rl);
        };
        raf = requestAnimationFrame(rl);
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
        dpr = Perf.dpr();
        W = Math.round(cw * dpr); H = Math.round(ch * dpr);
        cv.width = W; cv.height = H; cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
        U0 = Math.min(W, H) / 300;
      };
      layout();
      window.addEventListener('resize', layout);
      const kits = o.kits;
      const lookMe = Sprites.me(), lookOpp = Sprites.look(13);
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
        Sprites.turf(ctx, W, H, 10);
        const vg = ctx.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, Math.max(W, H) * 0.7);
        vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.5)');
        ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
        const cx = W / 2 + ox * W, cy = H * 0.5;
        const fh = Math.min(92 * U0, H * 0.3);
        const me = { kit: kits.own, look: lookMe, facing: 'up', number: o.number || 10, run: T * 9, speed: 0.6, t: T };
        const op = { kit: kits.opp, look: lookOpp, facing: 'down', number: 5, run: T * 9 + 1, speed: 0.6, t: T };
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
        Sprites.ball(ctx, cx, ry + (o.kind === 'header' ? Math.sin(T * 3) * 4 * U0 : 0), 7.5 * U0, T * 5);
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
          <div class="tg-foot"><b>Durmadan, hızlı hızlı dokun</b> · ne kadar hızlı basarsan o kadar hızlı koşarsın · <kbd>Boşluk</kbd></div>
        </div>`;
      const box = host.querySelector('.tg');
      const stage = host.querySelector('.tg-stage');
      const cv = host.querySelector('canvas');
      const ctx = cv.getContext('2d');
      let W, H, dpr;
      const layout = () => {
        const cw = Math.max(200, stage.clientWidth), ch = Math.max(200, stage.clientHeight);
        dpr = Perf.dpr();
        W = Math.round(cw * dpr); H = Math.round(ch * dpr);
        cv.width = W; cv.height = H; cv.style.width = cw + 'px'; cv.style.height = ch + 'px';
      };
      layout();
      window.addEventListener('resize', layout);
      const L = 28;
      const vmax = 6 + (o.pace || 30) / 15;
      const oppV = (4.5 + o.skill * 2.6) * U.rand(0.95, 1.05) * (HARD() ? 1.1 : 1);
      const me = { y: 0, v: 0, run: 0 }, op = { y: 0, v: 0, run: 1 };
      let t = 0, done = false, raf = 0, last = performance.now(), msg = '', msgCol = '#fff', taps = 0;
      const lookMe = Sprites.me(), lookOp = Sprites.look(19);
      // hız, son yarım saniyedeki dokunuş sıklığına bağlı: ne kadar hızlı basarsan o kadar hızlı koşarsın
      const TAPS_MAX = 11; // en yüksek hız için saniyedeki dokunuş
      const hits = [];
      const tap = () => { if (done || t < 0.6) return; taps++; hits.push(t); };
      const finish = (ok) => {
        done = true;
        msg = ok ? 'TOPA SEN ULAŞTIN!' : 'RAKİP DAHA HIZLIYDI';
        msgCol = ok ? '#7cf0a0' : '#ff6b6b';
        setTimeout(() => { cleanup(); resolve({ result: ok ? 'success' : 'fail' }); }, 1100);
      };
      const draw = () => {
        const top = H * 0.16, bot = H * 0.9;
        const yOf = (d) => bot - (d / L) * (bot - top);
        Sprites.turf(ctx, W, H, 12);
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3 * dpr;
        ctx.beginPath(); ctx.moveTo(W * 0.12, top); ctx.lineTo(W * 0.88, top); ctx.stroke();
        ctx.setLineDash([10 * dpr, 10 * dpr]); ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath(); ctx.moveTo(W / 2, top); ctx.lineTo(W / 2, bot); ctx.stroke(); ctx.setLineDash([]);
        Sprites.ball(ctx, W / 2, top - 10 * dpr, 9 * dpr, t * 2);
        const fh = Math.min(H * 0.2, W * 0.22);
        Sprites.figure(ctx, W * 0.66, yOf(op.y), fh, { kit: o.kits.opp, look: lookOp, facing: 'up', number: 3, run: op.run, speed: 0.9, t });
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
          while (hits.length && hits[0] < t - 0.5) hits.shift();
          const rate = hits.length / 0.5;
          const want = Math.min(vmax, (rate / TAPS_MAX) * vmax);
          me.v += (want - me.v) * Math.min(1, dt * (want > me.v ? 5 : 3));
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

  // Ortak tuval kurulumu (dokunma tabanlı mini oyunlar)
  _canvas(host, foot) {
    host.innerHTML = `
      <div class="tg">
        <div class="tg-stage"><canvas class="tg-canvas"></canvas></div>
        <div class="tg-foot">${foot}</div>
      </div>`;
    const g = { box: host.querySelector('.tg'), stage: host.querySelector('.tg-stage'), cv: host.querySelector('canvas') };
    g.ctx = g.cv.getContext('2d');
    g.layout = () => {
      const cw = Math.max(200, g.stage.clientWidth), ch = Math.max(200, g.stage.clientHeight);
      g.dpr = Perf.dpr();
      g.W = Math.round(cw * g.dpr); g.H = Math.round(ch * g.dpr);
      g.cv.width = g.W; g.cv.height = g.H; g.cv.style.width = cw + 'px'; g.cv.style.height = ch + 'px';
    };
    g.layout();
    window.addEventListener('resize', g.layout);
    // Zemin: gerçek çim dokusu + yumuşak biçme şeritleri (önbellekten)
    g.grass = () => Sprites.turf(g.ctx, g.W, g.H, 12);
    g.text = (txt, y, size, col = '#fff') => {
      const c = g.ctx;
      c.textAlign = 'center'; c.fillStyle = col;
      c.font = `italic 800 ${Math.round(size * g.dpr)}px "Saira Condensed", "Arial Narrow", sans-serif`;
      c.lineWidth = 4 * g.dpr; c.strokeStyle = 'rgba(5,11,29,0.7)'; c.strokeText(txt, g.W / 2, y); c.fillText(txt, g.W / 2, y);
    };
    return g;
  },

  // Çalım: rakip üstüne gelir ve bir tarafa hamle yapar; o anda topu ters tarafa çek (sola/sağa dokun ya da kaydır)
  dribble(host, o) {
    return new Promise((resolve) => {
      const g = MiniGame._canvas(host, 'Rakip hamle yapınca <b>topu ters tarafa çek</b> · ekranın sol/sağına dokun ya da kaydır · <kbd>←</kbd> <kbd>→</kbd>');
      const { ctx } = g;
      const rounds = o.rounds || 2;
      const drib = o.dribbling || 40;
      const win = U.clamp(0.42 + drib / 350 - o.skill * 0.22, 0.25, 0.75); // hamleden sonra tepki süresi
      const closing = (6.5 + o.skill * 3.5) * (HARD() ? 1.15 : 1); // rakibin yaklaşma hızı (m/sn)
      const me = { x: 0, tx: 0, run: 0 };
      let t = 0, done = false, raf = 0, last = performance.now(), beaten = 0, scroll = 0, msg = '', msgCol = '#fff', msgT = 0;
      const lookMe = Sprites.me();
      const mkDef = (i) => ({ num: [4, 6, 15, 23][i % 4], d: 11 + i * 0.5, x: me.tx + U.rand(-0.4, 0.4), side: U.pick([-1, 1]), state: 'come', lt: 0, look: Sprites.look(41 + i * 7) });
      let def = mkDef(0);
      const say = (m, c) => { msg = m; msgCol = c; msgT = 0.9; };
      const end = (res, text, col) => { done = true; say(text, col); msgT = 9; setTimeout(() => { cleanup(); resolve({ result: res }); }, 1200); };
      const move = (dir) => {
        if (done || t < 0.5 || !def || def.state === 'beaten' || def.state === 'won') return;
        if (def.state === 'come') {
          if (def.d < 7) { // erken hamle: rakip okur
            def.state = 'won'; me.tx = U.clamp(me.tx + dir * 1.6, -2.6, 2.6); def.x = me.tx;
            return beaten ? end('partial', 'ERKEN DAVRANDIN, TOP KAÇTI', '#ffcf3f') : end('fail', 'RAKİP HAMLENİ OKUDU', '#ff6b6b');
          }
          return;
        }
        // hamle sırasında: ters tarafa çekmek gerekiyor
        if (dir === -def.side) {
          def.state = 'beaten'; beaten++;
          me.tx = U.clamp(me.tx + dir * 1.8, -2.6, 2.6);
          say(U.pick(['ÇALIM!', 'GEÇTİN!', 'NEFİS!']), '#7cf0a0');
        } else {
          def.state = 'won'; me.tx = U.clamp(me.tx + dir * 1.8, -2.6, 2.6);
          beaten ? end('partial', 'TOPU KAPTIRDIN', '#ffcf3f') : end('fail', 'RAKİBİN AYAĞINA ÇEKTİN', '#ff6b6b');
        }
      };
      const draw = () => {
        const { W, H, dpr } = g;
        const M = H / 15; // metre başına piksel
        // kayan saha
        Sprites.turf(ctx, W, H, 0, scroll * M, M * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2 * dpr;
        const ly = ((scroll * M) % (M * 10));
        ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(W, ly); ctx.stroke();
        const cx = W / 2, sx = (x) => cx + x * M * 1.2;
        const py = H * 0.78, fh = Math.min(H * 0.17, W * 0.24);
        // rakip
        if (def) {
          const dy = py - def.d * M;
          let dx = def.x, lean = 0;
          if (def.state === 'lunge' || def.state === 'won') { const k = U.clamp((t - def.lt) / win, 0, 1); dx = def.x + def.side * k * 1.4; lean = def.side * k; }
          if (def.state === 'beaten') { const k = U.clamp((t - def.lt) / 0.4, 0, 1); dx = def.x + def.side * (1.4 + k * 0.6); lean = def.side * (1 - k * 0.3); }
          ctx.save(); ctx.translate(sx(dx), dy); ctx.rotate(lean * 0.35);
          Sprites.figure(ctx, 0, 0, fh, { kit: o.kits.opp, look: def.look, facing: 'down', number: def.num, run: t * 9, speed: def.state === 'come' ? 0.9 : 0.4, t });
          ctx.restore();
          if (def.state === 'lunge') {
            // hamle uyarısı: rakibin gittiği taraf kırmızı, kaçman gereken taraf yeşil ok
            const ay = dy - fh * 1.15;
            ctx.fillStyle = 'rgba(255,90,80,0.9)'; ctx.font = `800 ${Math.round(26 * dpr)}px "Saira Condensed", sans-serif`; ctx.textAlign = 'center';
            ctx.fillText('!', sx(dx), ay);
            const gx = sx(me.x) - def.side * W * 0.22;
            ctx.fillStyle = 'rgba(124,240,160,0.95)';
            ctx.beginPath(); ctx.moveTo(gx - def.side * 26 * dpr, py - fh * 0.5); ctx.lineTo(gx, py - fh * 0.5 - 18 * dpr); ctx.lineTo(gx, py - fh * 0.5 + 18 * dpr); ctx.closePath(); ctx.fill();
            // kalan süre halkası
            const k = 1 - U.clamp((t - def.lt) / win, 0, 1);
            ctx.strokeStyle = '#ffcf3f'; ctx.lineWidth = 4 * dpr;
            ctx.beginPath(); ctx.arc(sx(me.x), py - fh * 0.5, fh * 0.75, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); ctx.stroke();
          }
        }
        // oyuncu ve top
        const bx = sx(me.x) + (me.tx - me.x) * M * 0.6;
        Sprites.figure(ctx, sx(me.x), py, fh, { kit: o.kits.own, look: lookMe, facing: 'up', number: o.number, run: me.run, speed: 0.9, label: 'SEN', labelScale: dpr, labelColor: 'rgba(214,40,57,0.92)', t });
        Sprites.ball(ctx, bx + fh * 0.12, py - fh * 0.1, Math.max(6 * dpr, fh * 0.06), me.run);
        g.text(`${beaten} / ${rounds} RAKİP`, H * 0.07, 26);
        if (msgT > 0) g.text(msg, H * 0.42, 34, msgCol);
        else if (t < 0.5) g.text('TOP SENDE!', H * 0.42, 32);
      };
      const loop = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now; t += dt;
        msgT = Math.max(0, msgT - dt);
        me.x += (me.tx - me.x) * Math.min(1, dt * 10);
        if (!done && t > 0.5) {
          scroll += dt * 4; me.run += dt * 9;
          if (def) {
            if (def.state === 'come') {
              def.d -= closing * dt;
              def.x += (me.x - def.x) * Math.min(1, dt * 2);
              if (def.d <= 3.2) { def.state = 'lunge'; def.lt = t; }
            } else if (def.state === 'lunge') {
              def.d -= closing * 0.35 * dt;
              if (t - def.lt > win) { def.state = 'won'; beaten ? end('partial', 'TOPU KAPTIRDIN', '#ffcf3f') : end('fail', 'RAKİP TOPU ALDI', '#ff6b6b'); }
            } else if (def.state === 'beaten') {
              def.d -= closing * dt;
              if (def.d < -2) {
                if (beaten >= rounds) { def = null; end('success', 'HEPSİNİ GEÇTİN!', '#7cf0a0'); } else def = mkDef(beaten);
              }
            }
          }
        }
        draw();
        raf = requestAnimationFrame(loop);
      };
      let down = null;
      const pd = (e) => { e.preventDefault(); down = { x: e.clientX }; };
      const pu = (e) => {
        if (!down) return;
        const dx = e.clientX - down.x;
        const r = g.cv.getBoundingClientRect();
        const dir = Math.abs(dx) > 18 ? Math.sign(dx) : (e.clientX < r.left + r.width / 2 ? -1 : 1);
        down = null; move(dir);
      };
      const key = (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); move(-1); }
        if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); move(1); }
      };
      const cleanup = () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', key); g.box.removeEventListener('pointerup', pu); window.removeEventListener('resize', g.layout); };
      g.box.addEventListener('pointerdown', pd);
      g.box.addEventListener('pointerup', pu);
      document.addEventListener('keydown', key);
      raf = requestAnimationFrame(loop);
      MiniGame._abort = () => { if (done) return; done = true; cleanup(); resolve({ result: 'auto' }); };
    });
  },

  // Kaleci: forvet şut çeker; doğru köşeye uç (sol/sağa dokun ya da kaydır, ortada kalmak için ortaya dokun).
  // mode 'shot': vuruştan sonra tepki süresi; 'pen': penaltıda tahmin (vuruştan hemen önce de uçabilirsin)
  keeper(host, o) {
    return new Promise((resolve) => {
      const pen = o.mode === 'pen';
      const g = MiniGame._canvas(host, pen
        ? 'Penaltı! Forvetin <b>bakışını oku</b>, vuruş anında <b>bir köşeye uç</b> · sol / orta / sağa dokun · <kbd>←</kbd> <kbd>↑</kbd> <kbd>→</kbd>'
        : 'Şut geliyor! Top ayaktan çıkınca <b>doğru köşeye uç</b> · sol / orta / sağa dokun ya da kaydır · <kbd>←</kbd> <kbd>↑</kbd> <kbd>→</kbd>');
      const { ctx } = g;
      const reflex = o.reflex || 40, handling = o.handling || 40;
      // topun uçuş süresi: refleks arttıkça daha geniş algılanır, rakip güçlüyse kısalır
      const flight = U.clamp((pen ? 0.5 : 0.62) + reflex / 900 - o.skill * 0.16, pen ? 0.36 : 0.42, 1.0) * (HARD() ? 0.9 : 1);
      const tKick = U.rand(1.0, 1.6);
      const side = U.pick([-1, 0, 1, -1, 1]); // köşeler daha sık
      const high = U.chance(0.4);
      // ipucu: forvet vuruştan önce gideceği tarafa bakar (yüksek tutuş/refleks daha belirgin ipucu)
      const hintAt = tKick - U.clamp(0.25 + handling / 600 - o.skill * 0.12, 0.12, 0.45);
      const lie = !pen && U.chance(0.12 + o.skill * 0.15); // bazen aldatır
      const hintSide = lie ? (side === 0 ? U.pick([-1, 1]) : -side) : side;
      let t = 0, done = false, raf = 0, last = performance.now(), dive = null, msg = '', msgCol = '#fff', msgT = 0;
      const lookMe = Sprites.me(), lookOpp = Sprites.look(63);
      const say = (m, c) => { msg = m; msgCol = c; msgT = 0.9; };
      const end = (res, text, col) => {
        done = true; say(text, col); msgT = 9;
        if (typeof Sfx !== 'undefined') { if (res === 'success') { Sfx.play('cheer'); Sfx.buzz('success'); } else if (res === 'fail') { Sfx.play('groan'); Sfx.buzz('warning'); } else Sfx.buzz('medium'); }
        setTimeout(() => { cleanup(); resolve({ result: res }); }, 1500);
      };
      const act = (dir) => {
        if (done || dive || t < 0.3) return;
        dive = { dir, t };
        if (!pen && t < tKick - 0.05) {
          // erken uçtun: forvet boş köşeye çevirir
          return setTimeout(() => !done && end('fail', 'ERKEN UÇTUN, KÖŞEYİ AÇTIN', '#ff6b6b'), Math.max(0, (tKick - t + flight) * 1000));
        }
      };
      const resolveShot = () => {
        if (done) return;
        if (!dive) return end('fail', 'GOL! UÇAMADIN', '#ff6b6b');
        const reactLate = dive.t > tKick + flight * 0.82;
        if (dive.dir === side) {
          if (reactLate) return end('partial', 'TOPA DOKUNDUN, DÖNEN TOP!', '#ffcf3f');
          return end('success', U.pick(['MÜTHİŞ KURTARIŞ!', 'KÖŞEDEN ÇIKARDIN!', 'DEV KALECİ!']), '#7cf0a0');
        }
        if (side === 0 && Math.abs(dive.dir) === 1 && U.chance(0.25)) return end('partial', 'AYAKLA ÇIKARDIN!', '#ffcf3f');
        return end('fail', 'GOL! YANLIŞ KÖŞE', '#ff6b6b');
      };
      const draw = () => {
        const { W, H, dpr } = g;
        Sprites.turf(ctx, W, H, 12);
        const cx = W / 2;
        const gw = Math.min(W * 0.86, H * 0.9), gh = gw * 0.33; // kale ağzı
        const gy = H * 0.86; // kale çizgisi
        // ceza sahası çizgileri
        ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2 * dpr;
        ctx.strokeRect(cx - gw * 0.9, gy - H * 0.42, gw * 1.8, H * 0.42);
        ctx.strokeRect(cx - gw * 0.55, gy - H * 0.16, gw * 1.1, H * 0.16);
        ctx.beginPath(); ctx.arc(cx, gy - H * 0.3, 3 * dpr, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
        // forvet ve top
        const sy = pen ? gy - H * 0.3 : gy - H * 0.52 + Math.min(1, t / tKick) * H * 0.12;
        const fh = Math.min(H * 0.16, W * 0.22);
        const kicked = t >= tKick;
        const lean = t >= hintAt && !kicked ? hintSide * 0.25 : 0;
        ctx.save(); ctx.translate(cx, sy); ctx.rotate(lean);
        Sprites.figure(ctx, 0, 0, fh, { kit: o.kits.opp, look: lookOpp, facing: 'down', number: 9, run: kicked ? 0 : t * 8, speed: kicked ? 0.2 : 0.7, t });
        ctx.restore();
        // ipucu oku (bakış)
        if (t >= hintAt && !kicked) {
          ctx.fillStyle = 'rgba(255,207,63,0.85)';
          const ax = cx + hintSide * fh * 0.7, ay = sy - fh * 1.05;
          ctx.beginPath(); ctx.moveTo(ax + hintSide * 14 * dpr, ay); ctx.lineTo(ax, ay - 10 * dpr); ctx.lineTo(ax, ay + 10 * dpr); ctx.closePath(); if (hintSide) ctx.fill();
          if (!hintSide) { ctx.beginPath(); ctx.arc(cx, ay, 6 * dpr, 0, Math.PI * 2); ctx.fill(); }
        }
        // kale
        const tx = cx + side * gw * 0.38, ty = gy - (high ? gh * 0.78 : gh * 0.28);
        let bx = cx, by = sy - fh * 0.05, br = Math.max(5 * dpr, fh * 0.06);
        if (kicked) {
          const k = U.clamp((t - tKick) / flight, 0, 1.15);
          bx = cx + (tx - cx) * k; by = by + (ty - by) * k; br *= 1 + k * 0.9;
        }
        // kaleci: arkası bize dönük, kale çizgisinde
        const kh = Math.min(H * 0.24, W * 0.3);
        let kx = cx, ky = gy, rot = 0;
        if (dive) {
          const k = U.clamp((t - dive.t) / 0.28, 0, 1);
          kx = cx + dive.dir * gw * 0.36 * k; ky = gy - (high && dive.dir ? kh * 0.25 * k : 0); rot = dive.dir * k * 1.15;
        }
        ctx.save(); ctx.translate(kx, ky); ctx.rotate(rot);
        Sprites.figure(ctx, 0, 0, kh, { kit: o.kits.gk || o.kits.own, look: lookMe, facing: 'up', number: o.number, run: 0, speed: 0.1, t, label: 'SEN', labelScale: dpr, labelColor: 'rgba(214,40,57,0.92)' });
        ctx.restore();
        // direkler ve file (önde)
        ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 6 * dpr;
        ctx.beginPath(); ctx.moveTo(cx - gw / 2, gy + 4 * dpr); ctx.lineTo(cx - gw / 2, gy - gh); ctx.lineTo(cx + gw / 2, gy - gh); ctx.lineTo(cx + gw / 2, gy + 4 * dpr); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1 * dpr;
        for (let i = 1; i < 12; i++) { const x = cx - gw / 2 + (gw / 12) * i; ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x, gy - gh); ctx.stroke(); }
        Sprites.ball(ctx, bx, by, br, t * 6);
        if (msgT > 0) g.text(msg, H * 0.18, 32, msgCol);
        else if (!kicked) g.text(pen ? 'PENALTI' : 'ŞUT GELİYOR!', H * 0.12, 28);
      };
      const loop = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now; t += dt; msgT = Math.max(0, msgT - dt);
        if (!done && t >= tKick + flight) resolveShot();
        draw();
        raf = requestAnimationFrame(loop);
      };
      let down = null;
      const pd = (e) => { e.preventDefault(); down = { x: e.clientX, y: e.clientY }; };
      const pu = (e) => {
        if (!down) return;
        const dx = e.clientX - down.x, dy = e.clientY - down.y;
        const r = g.cv.getBoundingClientRect();
        let dir;
        if (Math.abs(dx) > 18 || Math.abs(dy) > 18) dir = Math.abs(dx) > Math.abs(dy) ? Math.sign(dx) : 0;
        else { const fx = (e.clientX - r.left) / r.width; dir = fx < 0.36 ? -1 : fx > 0.64 ? 1 : 0; }
        down = null; act(dir);
      };
      const key = (e) => {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') { e.preventDefault(); act(-1); }
        if (e.code === 'ArrowRight' || e.code === 'KeyD') { e.preventDefault(); act(1); }
        if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') { e.preventDefault(); act(0); }
      };
      const cleanup = () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', key); g.box.removeEventListener('pointerup', pu); window.removeEventListener('resize', g.layout); };
      g.box.addEventListener('pointerdown', pd);
      g.box.addEventListener('pointerup', pu);
      document.addEventListener('keydown', key);
      raf = requestAnimationFrame(loop);
      MiniGame._abort = () => { if (done) return; done = true; cleanup(); resolve({ result: 'auto' }); };
    });
  },

  // ---------- Kaleci mini oyunları: ortak sahne (kalenin arkasından sahaya bakış) ----------
  _gk(g, o) {
    const { ctx, W, H, dpr } = g;
    Sprites.turf(ctx, W, H, 12);
    const cx = W / 2, gw = Math.min(W * 0.86, H * 0.9), gh = gw * 0.33, gy = H * 0.86;
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2 * dpr;
    ctx.strokeRect(cx - gw * 0.9, gy - H * 0.42, gw * 1.8, H * 0.42);
    ctx.strokeRect(cx - gw * 0.55, gy - H * 0.16, gw * 1.1, H * 0.16);
    const kh = Math.min(H * 0.24, W * 0.3);
    const keeper = (kx, ky, rot, dive) => {
      ctx.save(); ctx.translate(kx, ky); ctx.rotate(rot || 0);
      Sprites.figure(ctx, 0, 0, kh, { kit: o.kits.own, look: Sprites.me(), facing: 'up', number: o.number, speed: 0.1, t: 0, dive: dive ? 1 : 0, label: 'SEN', labelScale: dpr, labelColor: 'rgba(214,40,57,0.92)' });
      ctx.restore();
    };
    const goal = () => {
      ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 6 * dpr;
      ctx.beginPath(); ctx.moveTo(cx - gw / 2, gy + 4 * dpr); ctx.lineTo(cx - gw / 2, gy - gh); ctx.lineTo(cx + gw / 2, gy - gh); ctx.lineTo(cx + gw / 2, gy + 4 * dpr); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1 * dpr;
      for (let i = 1; i < 12; i++) { const x = cx - gw / 2 + (gw / 12) * i; ctx.beginPath(); ctx.moveTo(x, gy); ctx.lineTo(x, gy - gh); ctx.stroke(); }
    };
    return { cx, gw, gh, gy, kh, keeper, goal, M: H / 34 };
  },
  // ortak döngü: talimat ekranı (dokununca başlar), sonuç rozeti, ses ve titreşim
  _gkLoop(g, step, input, resolve, intro) {
    let raf = 0, last = performance.now(), done = false;
    const st = { t: 0, msg: '', col: '#fff', msgT: 0, ready: !intro, res: null, resT: 0 };
    const finish = (res, text, col) => {
      if (done) return; done = true; st.msg = text; st.col = col; st.msgT = 9; st.res = res; st.resT = 0;
      if (typeof Sfx !== 'undefined') {
        if (res === 'success') { Sfx.play('cheer'); Sfx.buzz('success'); }
        else if (res === 'partial') Sfx.buzz('medium');
        else { Sfx.play('groan'); Sfx.buzz('warning'); }
      }
      setTimeout(() => { cleanup(); resolve({ result: res }); }, 1700);
    };
    const badge = () => {
      const { ctx, W, H, dpr } = g, k = Math.min(1, st.resT / 0.25);
      const ok = st.res === 'success', mid = st.res === 'partial';
      const col = ok ? '#2fbf6a' : mid ? '#e0a22a' : '#d6453a';
      const r = Math.min(W, H) * 0.13 * (0.6 + 0.4 * k);
      ctx.save(); ctx.globalAlpha = Math.min(1, k * 1.5);
      ctx.fillStyle = 'rgba(5,11,29,0.45)'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(W / 2, H * 0.42, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = r * 0.14; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
      if (ok) { ctx.moveTo(W / 2 - r * 0.45, H * 0.42); ctx.lineTo(W / 2 - r * 0.1, H * 0.42 + r * 0.35); ctx.lineTo(W / 2 + r * 0.5, H * 0.42 - r * 0.35); }
      else if (mid) { ctx.moveTo(W / 2 - r * 0.45, H * 0.42); ctx.lineTo(W / 2 + r * 0.45, H * 0.42); }
      else { ctx.moveTo(W / 2 - r * 0.38, H * 0.42 - r * 0.38); ctx.lineTo(W / 2 + r * 0.38, H * 0.42 + r * 0.38); ctx.moveTo(W / 2 + r * 0.38, H * 0.42 - r * 0.38); ctx.lineTo(W / 2 - r * 0.38, H * 0.42 + r * 0.38); }
      ctx.stroke(); ctx.restore();
      g.text(st.msg, H * 0.42 + r + 44 * dpr, st.msg.length > 24 ? 22 : 28, '#fff');
      g.text(ok ? 'BAŞARILI' : mid ? 'YARIM KALDI' : 'BAŞARISIZ', H * 0.42 - r - 18 * dpr, 22, col);
    };
    const panel = () => {
      const { ctx, W, H, dpr } = g;
      ctx.fillStyle = 'rgba(5,11,29,0.72)'; ctx.fillRect(0, 0, W, H);
      g.text(intro.title, H * 0.3, 34, '#ffd65a');
      intro.lines.forEach((l, i) => g.text(l, H * 0.4 + i * 34 * dpr, 21, '#fff'));
      const pulse = 0.6 + 0.4 * Math.sin(performance.now() / 260);
      g.text('BAŞLAMAK İÇİN DOKUN', H * 0.72, 24, `rgba(124,240,160,${pulse})`);
    };
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (st.ready) { st.t += dt; st.msgT = Math.max(0, st.msgT - dt); if (st.res) st.resT += dt; }
      step(st.ready ? dt : 0, st, finish, done);
      if (!st.ready) panel();
      else if (st.res) badge();
      else if (st.msgT > 0) g.text(st.msg, g.H * 0.18, 32, st.col);
      raf = requestAnimationFrame(loop);
    };
    let down = null;
    const pd = (e) => { e.preventDefault(); down = { x: e.clientX, y: e.clientY }; if (st.ready && input.down && !done) input.down(e); };
    const pm = (e) => { if (st.ready && input.move && !done) input.move(e); };
    const pu = (e) => { if (!down) return; const d = down; down = null; if (!st.ready) { st.ready = true; return; } if (input.up && !done) input.up(e, d); };
    const key = (e) => { if (!st.ready) { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); st.ready = true; } return; } if (input.key && !done) input.key(e); };
    const cleanup = () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', key); g.box.removeEventListener('pointerdown', pd); g.box.removeEventListener('pointermove', pm); g.box.removeEventListener('pointerup', pu); window.removeEventListener('resize', g.layout); };
    g.box.addEventListener('pointerdown', pd); g.box.addEventListener('pointermove', pm); g.box.addEventListener('pointerup', pu);
    document.addEventListener('keydown', key);
    raf = requestAnimationFrame(loop);
    MiniGame._abort = () => { if (done) return; done = true; cleanup(); resolve({ result: 'auto' }); };
    return st;
  },

  // Karşı karşıya: forvet topu sürerek geliyor. Alttaki çubuk YEŞİL olduğunda (top ayağından açıldı) ÇIK'a bas.
  // Kırmızı: çok uzak (aşırtır) ya da top ayağında (çalımla geçer); sarı: çok yakın, faul riski.
  gkOne(host, o) {
    return new Promise((resolve) => {
      const g = MiniGame._canvas(host, 'Üstteki çubuk <b>YEŞİL</b> olunca <b>ÇIK</b>: top forvetin ayağından açıldı demek · <kbd>Boşluk</kbd>');
      const sk = o.skill || 0.4, pos = o.pos || 40;
      let d = 22, lead = 0.5, heavy = false, touchT = 0.6, rush = null, ended = false, fin = null;
      const speed = (4.4 + sk * 2) * (HARD() ? 1.1 : 1);
      const heavyP = U.clamp(0.38 + pos / 400 - sk * 0.12, 0.28, 0.65);
      const lookOpp = Sprites.look(71);
      // pencere durumu: 'far' (çok uzak), 'tight' (top ayağında), 'go' (fırsat), 'close' (faul riski)
      const zone = () => (d > 15 ? 'far' : heavy && lead >= 1.3 ? 'go' : d < 6.5 ? 'close' : 'tight');
      const go = () => {
        if (rush || ended || !fin) return;
        const z = zone(); rush = { t: 0, z };
        const out = {
          far: [U.chance(0.3) ? 'partial' : 'fail', 'ÇOK ERKEN ÇIKTIN, AŞIRTTI', '#ff6b6b'],
          go: ['success', U.pick(['TOPU AYAĞINDAN ALDIN!', 'MÜKEMMEL ÇIKIŞ!']), '#7cf0a0'],
          close: ['partial', 'GEÇ KALDIN: FAUL, PENALTI', '#ffcf3f'],
          tight: ['fail', 'TOP AYAĞINDAYDI, ÇALIMLA GEÇTİ', '#ff6b6b'],
        }[z];
        setTimeout(() => fin(...out), 550);
      };
      MiniGame._gkLoop(g, (dt, st, finish) => {
        fin = finish;
        const G = MiniGame._gk(g, o), { ctx, W, H, dpr } = g;
        if (!ended && st.ready && st.t > 0.3 && !rush) {
          d -= speed * dt;
          touchT -= dt;
          if (touchT <= 0) { heavy = d <= 16 && U.chance(heavyP); lead = heavy ? U.rand(1.9, 2.6) : U.rand(0.5, 0.9); touchT = heavy ? U.rand(0.75, 0.95) : U.rand(0.5, 0.75); }
          lead = Math.max(0.4, lead - dt * (heavy ? 1.1 : 1.3));
          if (lead < 1.2) heavy = false;
          if (d <= 4.5) { ended = true; finish(U.chance(0.15) ? 'partial' : 'fail', U.chance(0.15) ? 'ŞUT DİREKTEN DÖNDÜ' : 'ÇIKMADIN, ŞUT GOL OLDU', '#ff6b6b'); }
        }
        if (rush) rush.t += dt;
        const yOf = (m) => G.gy - Math.min(m, 30) * G.M * 1.05;
        const sy = yOf(d), fh = Math.min(H * 0.16, W * 0.22) * (1.15 - d / 60);
        Sprites.figure(ctx, G.cx, sy, fh, { kit: o.kits.opp, look: lookOpp, facing: 'down', number: 9, run: st.t * 9, speed: rush ? 0.3 : 0.9, t: st.t });
        const by = yOf(d - lead), br = Math.max(5 * dpr, fh * 0.07);
        const z = zone();
        if (z === 'go' && !rush) { ctx.strokeStyle = '#7cf0a0'; ctx.lineWidth = 4 * dpr; ctx.beginPath(); ctx.arc(G.cx, by, br * 2.8, 0, Math.PI * 2); ctx.stroke(); }
        Sprites.ball(ctx, G.cx, by, br, st.t * 8);
        const ky = rush ? G.gy - Math.min(rush.t / 0.45, 1) * (G.gy - by) * 0.85 : G.gy;
        G.goal(); G.keeper(G.cx, ky, 0, !!rush && rush.t > 0.3);
        // fırsat çubuğu + ÇIK düğmesi
        if (st.ready && !st.res) {
          const col = { far: '#d6453a', tight: '#d6453a', go: '#2fbf6a', close: '#e0a22a' }[z];
          const lbl = { far: 'ÇOK UZAK · BEKLE', tight: 'TOP AYAĞINDA · BEKLE', go: 'ŞİMDİ ÇIK!', close: 'ÇOK YAKIN · FAUL RİSKİ' }[z];
          const bw = W * 0.84, bx = (W - bw) / 2, byy = H * 0.07, bh = 34 * dpr;
          ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx, byy, bw, bh, 10 * dpr) : ctx.rect(bx, byy, bw, bh); ctx.fill();
          g.text(lbl, byy + bh * 0.72, 22, '#fff');
          g.text(`${Math.max(0, Math.round(d))} m`, byy + bh + 28 * dpr, 20, 'rgba(255,255,255,0.85)');
          if (!rush) {
            const bw2 = W * 0.5, bx2 = (W - bw2) / 2, by2 = H * 0.9, bh2 = 46 * dpr;
            ctx.fillStyle = z === 'go' ? '#ffd65a' : 'rgba(255,214,90,0.55)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx2, by2 - bh2 / 2, bw2, bh2, 12 * dpr) : ctx.rect(bx2, by2 - bh2 / 2, bw2, bh2); ctx.fill();
            g.text('ÇIK!', by2 + 10 * dpr, 28, '#111');
          }
        }
      }, { up: () => go(), key: (e) => { if (e.code === 'Space') { e.preventDefault(); go(); } } }, resolve,
      { title: 'KARŞI KARŞIYA', lines: ['Forvet topu sürerek geliyor.', 'Üstteki çubuk YEŞİL olunca ÇIK\'a bas.', 'Kırmızıyken bekle: çok erken ya da top ayağında.'] });
    });
  },

  // Orta: top kanattan geliyor. Basılı tutup kaleciyi düşeceği yere götür, top ellerine inerken bırak ve yakala.
  gkCross(host, o) {
    return new Promise((resolve) => {
      const g = MiniGame._canvas(host, '<b>Basılı tut</b>, kaleciyi topun düşeceği gölgeye götür · top ellerine inerken <b>bırak</b> ve yakala');
      const air = o.air || 40, sk = o.skill || 0.4;
      const from = U.pick([-1, 1]);
      const flight = U.clamp(1.5 - sk * 0.3 + air / 600, 1.1, 1.8);
      const landX = U.rand(-0.32, 0.32); // kale genişliğine göre
      const reach = U.clamp(0.11 + air / 900, 0.1, 0.2);
      let kx = 0, target = null, jump = null, start = 0.5;
      let fin = null;
      const at = (st) => U.clamp((st.t - start) / flight, 0, 1.2);
      const release = () => {
        if (jump || !fin) return;
        const st0 = stRef; const k = at(st0);
        jump = { t: st0.t };
        const bx = from * 0.95 + (landX - from * 0.95) * Math.min(k, 1);
        const dx = Math.abs(bx - kx);
        let res;
        if (k >= 0.7 && k <= 0.93 && dx < reach) res = ['success', U.pick(['HAVADA YAKALADIN!', 'GÜVENLİ ELLER!']), '#7cf0a0'];
        else if (k >= 0.6 && k <= 1 && dx < reach * 1.8) res = ['partial', 'YUMRUKLA UZAKLAŞTIRDIN', '#ffcf3f'];
        else res = ['fail', k < 0.6 ? 'ERKEN ZIPLADIN!' : 'TOPU KAÇIRDIN!', '#ff6b6b'];
        setTimeout(() => fin(...res), 350);
      };
      let stRef = null;
      MiniGame._gkLoop(g, (dt, st, finish, done) => {
        fin = finish; stRef = st;
        const G = MiniGame._gk(g, o), { ctx, H, dpr } = g;
        if (target != null && !jump) kx += U.clamp(target - kx, -dt * 0.9, dt * 0.9);
        const k = at(st);
        if (!jump && k >= 1.1 && !done) finish(U.chance(0.45) ? 'fail' : 'partial', 'TOP KAFAYA GELDİ!', '#ff6b6b');
        const bxN = from * 0.95 + (landX - from * 0.95) * Math.min(k, 1);
        const lx = G.cx + landX * G.gw, ly = G.gy - G.gh * 0.25;
        // düşeceği yer (gölge)
        ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(lx, ly + G.gh * 0.2, 18 * dpr, 7 * dpr, 0, 0, Math.PI * 2); ctx.fill();
        G.goal();
        const jk = jump ? Math.min((st.t - jump.t) / 0.25, 1) : 0;
        G.keeper(G.cx + kx * G.gw, G.gy - jk * G.kh * 0.25, 0, jump ? 1 : 0);
        // top: yüksekliği parabol
        const h = Math.sin(Math.PI * Math.min(k, 1)) * H * 0.38 + (1 - Math.min(k, 1)) * H * 0.05;
        const bx = G.cx + bxN * G.gw, by = ly - h * 0.5 - G.gh * 0.6 * Math.min(k, 1);
        Sprites.ball(ctx, bx, by, Math.max(6 * dpr, G.kh * 0.07 * (1 + Math.sin(Math.PI * Math.min(k, 1)) * 0.5)), st.t * 7);
        if (k > 0.68 && k < 0.93 && !jump) { ctx.strokeStyle = '#7cf0a0'; ctx.lineWidth = 3 * dpr; ctx.beginPath(); ctx.arc(bx, by, 22 * dpr, 0, Math.PI * 2); ctx.stroke(); }
        if (st.msgT <= 0 && k < 0.05) g.text('ORTA GELİYOR!', H * 0.1, 28);
      }, {
        down: (e) => { const r = g.cv.getBoundingClientRect(); target = ((e.clientX - r.left) / r.width - 0.5) * (g.W / Math.min(g.W * 0.86, g.H * 0.9)); },
        move: (e) => { if (target == null) return; const r = g.cv.getBoundingClientRect(); target = U.clamp(((e.clientX - r.left) / r.width - 0.5) * (g.W / Math.min(g.W * 0.86, g.H * 0.9)), -0.5, 0.5); },
        up: () => release(),
        key: (e) => { if (e.code === 'ArrowLeft') target = U.clamp(NZ(target, kx) - 0.12, -0.5, 0.5); if (e.code === 'ArrowRight') target = U.clamp(NZ(target, kx) + 0.12, -0.5, 0.5); if (e.code === 'Space') { e.preventDefault(); release(); } },
      }, resolve, { title: 'ORTA GELİYOR', lines: ['Parmağını basılı tut, kaleciyi gölgeye götür.', 'Topun etrafında yeşil halka çıkınca bırak.', 'Doğru anda bırakırsan topu yakalarsın.'] });
    });
  },

  // Yakın mesafe: kale ağzında karambol, art arda 3 şut. Topun gideceği yer bir an parlar; o tarafa dokun.
  gkReflex(host, o) {
    return new Promise((resolve) => {
      const g = MiniGame._canvas(host, 'Kale ağzında karambol! Art arda şutlar geliyor · parlayan tarafa <b>hızla dokun</b> (sol / orta / sağ) · <kbd>←</kbd> <kbd>↑</kbd> <kbd>→</kbd>');
      const rf = o.reflex || 40, sk = o.skill || 0.4;
      const flight = U.clamp(0.42 + rf / 700 - sk * 0.12, 0.3, 0.7) * (HARD() ? 0.9 : 1);
      const shots = 3;
      let n = 0, side = 0, high = false, shotT = 0.9, dive = null, saved = 0, fin = null, stRef = null, shooter = 1;
      const atk = [-0.28, 0.04, 0.3], lookA = [Sprites.look(81), Sprites.look(83), Sprites.look(85)];
      const next = (st) => { side = U.pick([-1, 0, 1]); high = U.chance(0.4); shooter = U.randi(0, 2); shotT = st.t + U.rand(0.5, 0.9); dive = null; };
      const act = (dir) => { if (!stRef || dive || stRef.t < shotT - 0.25) return; dive = { dir, t: stRef.t }; };
      MiniGame._gkLoop(g, (dt, st, finish, done) => {
        fin = finish; stRef = st;
        const G = MiniGame._gk(g, o), { ctx, H, dpr } = g;
        if (st.t < 0.05) next(st);
        const arrive = shotT + flight;
        if (!done && st.t >= arrive) {
          if (dive && dive.dir === side) {
            saved++; n++;
            if (n >= shots) finish('success', 'ÜÇÜNÜ DE ÇIKARDIN!', '#7cf0a0');
            else { st.msg = 'KURTARDIN! DÖNEN TOP…'; st.col = '#7cf0a0'; st.msgT = 0.6; next(st); }
          } else finish(saved ? 'partial' : 'fail', saved ? 'SONUNDA AĞLARDA…' : 'GOL!', '#ff6b6b');
        }
        // parlama: şuttan hemen önce
        const tx = G.cx + side * G.gw * 0.36, ty = G.gy - (high ? G.gh * 0.75 : G.gh * 0.25);
        if (st.t > shotT - 0.22 && st.t < arrive) { ctx.fillStyle = 'rgba(255,207,63,0.35)'; ctx.beginPath(); ctx.arc(tx, ty, G.gh * 0.32, 0, Math.PI * 2); ctx.fill(); }
        // kale ağzındaki rakipler; şutu çeken öne eğilir
        const ay = G.gy - H * 0.26, ah = G.kh * 0.72;
        atk.forEach((x, i) => Sprites.figure(ctx, G.cx + x * G.gw, ay, ah, { kit: o.kits.opp, look: lookA[i], facing: 'down', number: [9, 10, 7][i], t: st.t, kick: i === shooter && st.t > shotT - 0.15 && st.t < shotT + 0.2 ? 0.6 : 0 }));
        const ox = G.cx + atk[shooter] * G.gw, oy = ay - ah * 0.04;
        if (st.t < shotT) Sprites.ball(ctx, ox + ah * 0.12, oy, Math.max(6 * dpr, G.kh * 0.05), 0);
        G.goal();
        let kx = G.cx, rot = 0;
        if (dive) { const k = Math.min((st.t - dive.t) / 0.2, 1); kx = G.cx + dive.dir * G.gw * 0.34 * k; rot = dive.dir * k * 1.1; }
        G.keeper(kx, G.gy, rot, !!dive);
        if (st.t >= shotT) { const k = Math.min((st.t - shotT) / flight, 1); Sprites.ball(ctx, ox + (tx - ox) * k, oy + (ty - oy) * k, Math.max(6 * dpr, G.kh * 0.06 * (1 + k)), st.t * 9); }
        if (st.msgT <= 0) g.text(`ŞUT ${Math.min(n + 1, shots)} / ${shots}`, H * 0.1, 26);
      }, {
        up: (e, d) => { const r = g.cv.getBoundingClientRect(); const dx = e.clientX - d.x; let dir; if (Math.abs(dx) > 18) dir = Math.sign(dx); else { const fx = (e.clientX - r.left) / r.width; dir = fx < 0.36 ? -1 : fx > 0.64 ? 1 : 0; } act(dir); },
        key: (e) => { if (e.code === 'ArrowLeft') act(-1); if (e.code === 'ArrowRight') act(1); if (e.code === 'ArrowUp' || e.code === 'Space') { e.preventDefault(); act(0); } },
      }, resolve, { title: 'KALE AĞZINDA KARAMBOL', lines: ['Rakipler art arda 3 şut çekecek.', 'Kalede sarı parlayan tarafa hızla dokun.', 'Sol, orta ya da sağ. Üçünü de çıkar!'] });
    });
  },

  // Oyun başlatma: top elinde. Üstünde BOŞ yazan takım arkadaşına dokun, top ona atılır.
  gkDist(host, o) {
    return new Promise((resolve) => {
      const g = MiniGame._canvas(host, 'Üstünde <b>BOŞ</b> yazan arkadaşına dokun · <b>MARKAJDA</b> yazana atarsan top kesilir · süre dolmadan');
      const ps = o.passing || 40, sk = o.skill || 0.4;
      const limit = U.clamp(4.2 + ps / 100 - sk, 3.2, 5.2);
      // en az biri her an boş kalsın diye fazlar eşit aralıklı
      const base = U.rand(0, 6);
      const mates = [-0.62, 0, 0.62].map((x, i) => ({ x, y: [0.42, 0.6, 0.45][i], ph: base + i * 2.1, sp: U.rand(0.8, 1.1) * (1 + sk * 0.3), num: [3, 8, 11][i] }));
      const free = (m, t) => Math.sin(t * m.sp + m.ph); // >0.35 boş, <-0.1 markajda
      const lookM = [Sprites.look(21), Sprites.look(33), Sprites.look(45)], lookO = Sprites.look(57);
      let pick = null, fin = null, stRef = null;
      const choose = (i) => {
        if (pick != null || !stRef || !fin) return;
        const f = free(mates[i], stRef.t);
        pick = { i, t: stRef.t, ok: f > 0.35 ? 'yes' : f > -0.1 ? 'mid' : 'no' };
        const out = { yes: ['success', 'PAS ULAŞTI, HÜCUM BAŞLADI!', '#7cf0a0'], mid: ['partial', 'PAS ULAŞTI AMA BASKI ALTINDA', '#ffcf3f'], no: ['fail', 'MARKAJDAKİNE ATTIN, TOP KESİLDİ', '#ff6b6b'] }[pick.ok];
        setTimeout(() => fin(...out), 750);
      };
      MiniGame._gkLoop(g, (dt, st, finish, done) => {
        fin = finish; stRef = st;
        const G = MiniGame._gk(g, o), { ctx, W, H, dpr } = g;
        const left = Math.max(0, limit - st.t);
        if (!done && st.ready && pick == null && left <= 0) finish('partial', 'SÜRE DOLDU, UZUN VURDUN', '#ffcf3f');
        const fh = Math.min(H * 0.12, W * 0.17);
        mates.forEach((m, i) => {
          const x = G.cx + m.x * W * 0.62, y = H * m.y, f = pick && pick.i === i ? free(m, pick.t) : free(m, st.t);
          const fr = f > 0.35, mid = !fr && f > -0.1;
          const ox = x + (fr ? 1.25 : mid ? 0.7 : 0.32) * fh * (m.x >= 0 ? 1 : -1), oy = y + fh * 0.04;
          Sprites.figure(ctx, ox, oy, fh, { kit: o.kits.opp, look: lookO, facing: 'down', number: 5 + i, t: st.t });
          Sprites.figure(ctx, x, y, fh, { kit: o.kits.own, look: lookM[i], facing: 'down', number: m.num, t: st.t });
          const col = fr ? '#2fbf6a' : mid ? '#e0a22a' : '#d6453a';
          ctx.strokeStyle = col; ctx.lineWidth = 4 * dpr;
          ctx.beginPath(); ctx.ellipse(x, y, fh * 0.42, fh * 0.14, 0, 0, Math.PI * 2); ctx.stroke();
          // etiket
          const tl = fr ? 'BOŞ' : mid ? 'BASKIDA' : 'MARKAJDA', ty = y - fh * 1.15;
          ctx.font = `800 ${Math.round(14 * dpr)}px "Saira Condensed", sans-serif`; const tw = ctx.measureText(tl).width + 14 * dpr;
          ctx.fillStyle = col; ctx.fillRect(x - tw / 2, ty - 15 * dpr, tw, 20 * dpr);
          ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(tl, x, ty);
          m.sx = x; m.sy = y - fh * 0.5; m.r = fh * 0.75;
        });
        G.goal(); G.keeper(G.cx, G.gy, 0, false);
        // atılan top
        if (pick) {
          const m = mates[pick.i], k = Math.min(1, (st.t - pick.t) / 0.6);
          const sx = G.cx, sy = G.gy - G.kh * 0.6, ex = m.sx, ey = m.sy + fh * 0.4;
          const bx = sx + (ex - sx) * k, by = sy + (ey - sy) * k - Math.sin(Math.PI * k) * H * 0.12;
          Sprites.ball(ctx, bx, by, Math.max(6 * dpr, fh * 0.08), st.t * 9);
        }
        if (st.ready && !st.res) {
          ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(W * 0.2, H * 0.08, W * 0.6, 8 * dpr);
          ctx.fillStyle = left < 1.2 ? '#ff6b6b' : '#ffcf3f'; ctx.fillRect(W * 0.2, H * 0.08, W * 0.6 * (left / limit), 8 * dpr);
          g.text('BOŞ OLANA DOKUN', H * 0.15, 22);
        }
      }, {
        up: (e) => {
          const r = g.cv.getBoundingClientRect(), px = (e.clientX - r.left) * (g.W / r.width), py = (e.clientY - r.top) * (g.H / r.height);
          let best = -1, bd = 1e9; mates.forEach((m, i) => { const dd = Math.hypot(px - m.sx, py - m.sy); if (dd < bd) { bd = dd; best = i; } });
          if (best >= 0 && bd < mates[best].r * 2.4) choose(best);
        },
        key: (e) => { if (e.code === 'ArrowLeft') choose(0); if (e.code === 'ArrowUp') choose(1); if (e.code === 'ArrowRight') choose(2); },
      }, resolve, { title: 'OYUNU BAŞLAT', lines: ['Top elinde, takım arkadaşlarından birine at.', 'Üstünde yeşil BOŞ yazana dokun.', 'MARKAJDA yazana atarsan top kesilir.'] });
    });
  },

  // Kafa vuruşu: köşeden gelen ortaya doğru anda yüksel; kale ağzında dokunduğun yere vurursun.
  // Dokunma anı zamanlama, dokunulan yer yön; kaleci ekranda durduğu yerden uzanır.
  header(host, o) {
    return new Promise((resolve) => {
      const g = MiniGame._canvas(host, '<b>Top kafana gelirken kalede vurmak istediğin yere dokun</b> · dokunduğun an zamanlama, dokunduğun yer yön · <kbd>Boşluk</kbd>');
      const { ctx } = g;
      const head = o.heading || 40, phys = o.physical || 40;
      const flight = U.clamp(1.55 - o.skill * 0.35, 1.1, 1.6);
      const win = U.clamp(0.09 + head / 900 - o.skill * 0.03, 0.06, 0.18); // mükemmel zamanlama penceresi (sn)
      const side = U.pick([-1, 1]);
      const keeperX = U.rand(-0.25, 0.25);
      let t = 0, done = false, raf = 0, last = performance.now(), tapT = null, aimAt = 0, shot = null, msg = '', msgCol = '#fff';
      // klavye için yedek nişan (dokunmada yön dokunulan yerden gelir)
      const sweep = 1.1 + o.skill * 0.9;
      const aim = () => Math.sin(t * sweep * 2.2 + side) * 0.95;
      const lean = () => (!shot ? side * U.clamp(t / flight, 0, 1) * 0.08 : 0);
      const lookMe = Sprites.me(), lookDef = Sprites.look(29), lookGk = Sprites.look(3);
      const finish = (res, text, col) => {
        done = true; msg = text; msgCol = col;
        setTimeout(() => { cleanup(); resolve({ result: res }); }, 1300);
      };
      const tap = (want) => {
        if (done || tapT != null || t < 0.35) return;
        tapT = t; aimAt = want == null ? aim() : want;
        const err = Math.abs(tapT - flight);
        const timing = err < win ? 'perfect' : err < win * 2.3 ? 'good' : 'miss';
        // ikili mücadele: kötü zamanlamada savunmacı kazanabilir
        const duel = timing === 'miss' ? false : U.chance(U.clamp(0.75 + (phys - 50) / 200 + (timing === 'perfect' ? 0.15 : 0) - o.skill * 0.15, 0.35, 0.97));
        if (timing === 'miss' || !duel) {
          shot = { miss: true };
          return finish('fail', timing === 'miss' ? (tapT < flight ? 'ERKEN YÜKSELDİN' : 'GEÇ KALDIN') : 'SAVUNMA ÖNCE DAVRANDI', '#ff6b6b');
        }
        // isabet: zamanlama ve kafa vuruşu yeteneği
        const spread = (timing === 'perfect' ? 0.07 : 0.2) * U.clamp(1.25 - head / 200, 0.7, 1.2);
        const tx = U.clamp(aimAt + U.rand(-spread, spread), -1.3, 1.3);
        // kaleci o an durduğu yerden uzanır (ekranda görünen konum)
        const kp = keeperX + lean();
        // kaleci vuruşun yönünü biraz sezer (zorlukla artar); köşeler yine en iyi seçenek
        const read = (0.1 + o.skill * 0.2) * (HARD() ? 1.2 : 1);
        const reach = (0.38 + o.skill * 0.3) * (HARD() ? 1.15 : 1) + read;
        const wide = Math.abs(tx) > 1;
        const saved = !wide && Math.abs(tx - kp) < reach;
        shot = { tx, t0: t, saved, wide, kp };
        setTimeout(() => {
          if (wide) finish('partial', 'AZ FARKLA DIŞARIDA', '#ffcf3f');
          else if (saved) finish('partial', 'KALECİ ÇIKARDI', '#ffcf3f');
          else finish('success', 'KAFAYLA GOL!', '#7cf0a0');
        }, 650);
      };
      const draw = () => {
        const { W, H, dpr } = g;
        g.grass();
        const fh = Math.min(H * 0.17, W * 0.2);
        // gerçek oran (7,32 x 2,44 m): kale kaleciden belirgin yüksek
        const gw = Math.min(W * 0.66, H * 0.46), gh = Math.max(gw * 0.36, fh * 1.25);
        const gx0 = W / 2 - gw / 2, gy = gh + H * 0.06, dep = gh * 0.28;
        // ağ: arka çerçeve perspektifle içeride ve yukarıda
        const bx0 = gx0 + gw * 0.06, bw = gw * 0.88, by0 = gy - dep * 0.35, btop = gy - gh - dep * 0.6;
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        ctx.beginPath(); ctx.moveTo(gx0, gy); ctx.lineTo(gx0, gy - gh); ctx.lineTo(gx0 + gw, gy - gh); ctx.lineTo(gx0 + gw, gy); ctx.lineTo(bx0 + bw, by0); ctx.lineTo(bx0 + bw, btop); ctx.lineTo(bx0, btop); ctx.lineTo(bx0, by0); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1 * dpr;
        for (let i = 0; i <= 14; i++) { const x = bx0 + (bw / 14) * i; ctx.beginPath(); ctx.moveTo(x, btop); ctx.lineTo(x, by0); ctx.stroke(); }
        for (let j = 0; j <= 6; j++) { const y = btop + ((by0 - btop) / 6) * j; ctx.beginPath(); ctx.moveTo(bx0, y); ctx.lineTo(bx0 + bw, y); ctx.stroke(); }
        // yan ağlar ve tavan ağı
        [[gx0, bx0], [gx0 + gw, bx0 + bw]].forEach(([fx, bx]) => {
          for (let j = 0; j <= 6; j++) { const k = j / 6; ctx.beginPath(); ctx.moveTo(fx, gy - gh + gh * k); ctx.lineTo(bx, btop + (by0 - btop) * k); ctx.stroke(); }
        });
        for (let i = 0; i <= 8; i++) { const k = i / 8; ctx.beginPath(); ctx.moveTo(gx0 + gw * k, gy - gh); ctx.lineTo(bx0 + bw * k, btop); ctx.stroke(); }
        // kale çizgisi ve ceza sahası
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2 * dpr;
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
        ctx.strokeRect(W / 2 - gw * 0.85, gy, gw * 1.7, H * 0.36);
        // direkler ve üst direk (gölgeli, kalın)
        const pw = Math.max(4, gw * 0.022);
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(gx0 - pw / 2 + 3 * dpr, gy - gh + 3 * dpr, pw, gh); ctx.fillRect(gx0 + gw - pw / 2 + 3 * dpr, gy - gh + 3 * dpr, pw, gh);
        ctx.fillStyle = '#c9ced6';
        ctx.fillRect(gx0 - pw / 2, gy - gh - pw / 2, pw, gh + pw / 2);
        ctx.fillRect(gx0 + gw - pw / 2, gy - gh - pw / 2, pw, gh + pw / 2);
        ctx.fillRect(gx0 - pw / 2, gy - gh - pw / 2, gw + pw, pw);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(gx0 - pw / 2, gy - gh - pw / 2, pw * 0.7, gh + pw / 2);
        ctx.fillRect(gx0 + gw - pw / 2, gy - gh - pw / 2, pw * 0.7, gh + pw / 2);
        ctx.fillRect(gx0 - pw / 2, gy - gh - pw / 2, gw + pw, pw * 0.7);
        const toGoal = (v) => W / 2 + v * gw / 2;
        g.goal = { cx: W / 2, hw: gw / 2 };
        // kaleci: hazır duruşta yaylanır; vuruşta topun gittiği yöne itiş-uçuş-iniş ile atlar
        let kx = toGoal(keeperX);
        const k0 = shot && !shot.miss ? shot.kp : keeperX;
        const dir = shot && !shot.miss ? (Math.sign(shot.tx - k0) || 1) : 0;
        const since = shot && !shot.miss ? t - shot.t0 : -1;
        ctx.fillStyle = 'rgba(0,0,0,0.24)';
        if (since > 0) {
          const ease = (k) => 1 - Math.pow(1 - k, 3);
          const fly = U.clamp((since - 0.03) / 0.46, 0, 1), land = U.clamp((since - 0.62) / 0.18, 0, 1);
          // kurtarışta topa uzanır; golde topa yetişemeden yere iner
          const reachX = shot.saved ? shot.tx - k0 : dir * U.clamp(Math.abs(shot.tx - k0) - 0.62, 0.08, 0.3);
          kx = toGoal(k0 + reachX * ease(fly));
          const rot = dir * (ease(fly) * 1.15 + land * 0.35);
          // top kale ağzının üst yarısına gidiyor: kurtarışta ellerin topa ulaşacağı kadar yükselir, sonra yere iner
          const peak = shot.saved ? Math.max(fh * 0.3, gh * 0.55 - fh * 0.45) : fh * 0.3;
          const air = (fly < 0.75 ? Math.sin((fly / 0.75) * Math.PI / 2) : 1 - (fly - 0.75) / 0.25 * 0.5) * peak * (1 - land);
          ctx.beginPath(); ctx.ellipse(kx, gy + fh * 0.08, fh * 0.4, fh * 0.07, 0, 0, Math.PI * 2); ctx.fill();
          ctx.save(); ctx.translate(kx, gy + fh * 0.08 - fh * 0.5 * Math.cos(rot) * (1 - land * 0.35) - air); ctx.rotate(rot);
          ctx.scale(1, 1 + 0.07 * Math.sin(fly * Math.PI));
          Sprites.figure(ctx, 0, fh * 0.5, fh, { kit: o.kits.gk, look: lookGk, facing: 'down', gloves: true, dive: 1, noShadow: true, kick: fly > 0 && land < 1 ? 0.35 : 0, t });
          ctx.restore();
        } else {
          // top kanattan gelirken orta tarafa doğru adım adım kayar
          const ln = lean();
          kx = toGoal(keeperX + ln);
          const bob = Math.abs(Math.sin(t * 5.5)) * fh * 0.018;
          ctx.beginPath(); ctx.ellipse(kx + fh * 0.05, gy + fh * 0.1, fh * 0.26, fh * 0.07, 0, 0, Math.PI * 2); ctx.fill();
          Sprites.figure(ctx, kx, gy + fh * 0.08 - bob, fh * 0.96, { kit: o.kits.gk, look: lookGk, facing: 'down', number: 1, gloves: true, armA: 0.62 + Math.sin(t * 5.5) * 0.04, noShadow: true, run: t * 4, speed: ln ? 0.25 : 0, t });
        }
        // hedef: dokunulan yer (vuruştan sonra görünür)
        if (shot && !shot.miss) {
          const ax = toGoal(aimAt);
          ctx.strokeStyle = 'rgba(5,11,29,0.8)'; ctx.lineWidth = 6 * dpr;
          ctx.beginPath(); ctx.arc(ax, gy - gh * 0.55, 12 * dpr, 0, Math.PI * 2); ctx.stroke();
          ctx.strokeStyle = '#ff3df0'; ctx.lineWidth = 3 * dpr;
          ctx.beginPath(); ctx.arc(ax, gy - gh * 0.55, 12 * dpr, 0, Math.PI * 2); ctx.stroke();
        } else if (!shot && t > 0.35) {
          // kale ağzı dokunma bölgesi ipucu
          ctx.save(); ctx.globalAlpha = 0.35 + 0.15 * Math.sin(t * 6);
          ctx.setLineDash([8 * dpr, 6 * dpr]); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2 * dpr;
          ctx.strokeRect(gx0 + pw, gy - gh + pw, gw - pw * 2, gh - pw * 1.5);
          ctx.restore();
        }
        // oyuncu ve savunmacı
        const px = W / 2, py = H * 0.68;
        const jump = tapT != null && !(shot && shot.miss && tapT < flight - win * 2.3) ? Math.sin(U.clamp((t - tapT) / 0.6, 0, 1) * Math.PI) * fh * 0.35 : 0;
        Sprites.figure(ctx, px + fh * 0.42, py + fh * 0.1, fh, { kit: o.kits.opp, look: lookDef, facing: 'up', number: 5, t, run: t * 3, speed: 0.3 });
        Sprites.figure(ctx, px, py - jump, fh, { kit: o.kits.own, look: lookMe, facing: 'up', number: o.number, label: 'SEN', labelScale: dpr, labelColor: 'rgba(214,40,57,0.92)', t });
        // top: köşeden kavisli orta, gölgesi yerde
        const headY = py - fh * 0.95 - jump;
        let bx, by, bz;
        if (!shot || shot.miss) {
          const k = Math.min(t / flight, 1.4);
          const sx = side > 0 ? W * 1.02 : -W * 0.02, sy = gy + 8 * dpr;
          bx = sx + (px - sx) * k; by = sy + (py - sy) * k; bz = Math.sin(Math.min(k, 1) * Math.PI) * fh * 1.4 + fh * 0.95 * Math.min(k, 1);
          if (k > 1) { bx = px + (px - sx) * (k - 1); by = py + (py - sy) * (k - 1); bz = fh * 0.95 * (1 - (k - 1) * 2); }
          if (!shot && k >= 1.35) { shot = { miss: true }; finish('fail', 'TOPU KAÇIRDIN', '#ff6b6b'); }
        } else {
          const k = U.clamp((t - shot.t0) / 0.5, 0, 1);
          const ex = toGoal(shot.tx), ey = gy - gh * 0.55;
          bx = px + (ex - px) * k; by = headY + fh * 0.95 + (ey - headY - fh * 0.95) * k; bz = fh * 0.95 * (1 - k) + jump * (1 - k);
          if (shot.saved && k >= 0.85) { bx = kx; }
        }
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(bx, by, 9 * dpr, 3.5 * dpr, 0, 0, Math.PI * 2); ctx.fill();
        Sprites.ball(ctx, bx, by - bz, 8 * dpr, t * 6);
        // zamanlama halkası (top kafaya yaklaşınca daralır)
        if (!tapT && !done) {
          const k = U.clamp(1 - Math.abs(t - flight) / 0.9, 0, 1);
          ctx.strokeStyle = Math.abs(t - flight) < win ? '#7cf0a0' : 'rgba(255,255,255,0.55)';
          ctx.lineWidth = 3 * dpr;
          ctx.beginPath(); ctx.arc(px, headY, (14 + (1 - k) * 40) * dpr, 0, Math.PI * 2); ctx.stroke();
        }
        if (done) g.text(msg, H * 0.5, 34, msgCol);
        else if (t < 0.35) g.text('KORNER!', H * 0.5, 34);
      };
      const loop = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now; t += dt;
        draw();
        raf = requestAnimationFrame(loop);
      };
      const key = (e) => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); tap(); } };
      const cleanup = () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', key); window.removeEventListener('resize', g.layout); };
      g.box.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const r = g.cv.getBoundingClientRect();
        const x = (e.clientX - r.left) * g.dpr;
        tap(g.goal ? U.clamp((x - g.goal.cx) / g.goal.hw, -1.25, 1.25) : null);
      });
      document.addEventListener('keydown', key);
      raf = requestAnimationFrame(loop);
      MiniGame._abort = () => { if (done) return; done = true; cleanup(); resolve({ result: 'auto' }); };
    });
  },

  // Korner vuruşu (geniş yayın açısı, perspektif): önce hedef bölgeyi seç (yakın direk / penaltı noktası / arka direk;
  // biri boşta), sonra gücü zamanla. Top falsoyla havadan ceza sahasına gider, takım arkadaşın kafayı vurur.
  // Dünya koordinatı (metre): x kale ortasından sağa +, y kale çizgisinden sahaya doğru +, h yükseklik.
  corner(host, o) {
    return new Promise((resolve) => {
      const g = MiniGame._canvas(host, '<b>Önce boştaki arkadaşına dokun</b>, sonra çubuk yeşile gelince tekrar dokun · <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> · <kbd>Boşluk</kbd>');
      const { ctx } = g;
      const pass = o.passing || 50;
      // hedef bölgeler: 0 yakın direk, 1 penaltı noktası, 2 arka direk (korner sağ köşeden)
      const Z = [{ x: 3.2, y: 5.8, n: 'YAKIN DİREK' }, { x: -0.5, y: 11.5, n: 'PENALTI NOKTASI' }, { x: -4.2, y: 6.4, n: 'ARKA DİREK' }];
      const free = U.randi(0, 2);
      const green = U.clamp(0.1 + pass / 700 - o.skill * 0.04, 0.07, 0.2);
      const gc = U.rand(0.35, 0.75);
      // ceza sahasındaki diğer oyuncular (sabit dizilim + hafif kıpırdanma)
      const extraOwn = [{ x: 0.5, y: 15.2 }, { x: 8, y: 12.5 }, { x: -8.5, y: 11.8 }];
      const extraDef = [{ x: 0.6, y: 3.6 }, { x: -1.9, y: 3.9 }, { x: 0.8, y: 9.2 }, { x: 6.6, y: 10.6 }, { x: 3.6, y: 0.6 }];
      let phase = 'aim', t = 0, pt = 0, pick = null, q = null, ft = 0, out = null, done = false, raf = 0, last = performance.now(), msg = '', msgCol = '#fff';
      const lookMe = Sprites.me(), lookDef = Sprites.look(29), lookGk = Sprites.look(3);
      const looksO = [41, 57, 73, 88, 102, 117].map((k) => Sprites.look(k)), looksD = [12, 23, 35, 47, 61, 79, 95].map((k) => Sprites.look(k));
      const finish = (res, text, col) => { done = true; msg = text; msgCol = col; setTimeout(() => { cleanup(); resolve({ result: res }); }, 1400); };
      // perspektif: kale çizgisi üstte (uzak), saha aşağıda (yakın)
      const cam = () => {
        const { W, H } = g;
        // gerçek izdüşüm: yüksek yayın (taktik) kamerası (y = 45 m, h = 70 m), kaleye bakar; hafif perspektif
        const Yc = 45, Hc = 70, f = W * 0.75, cx = W * 0.37;
        const hz = H * 0.28 - f * Hc / Yc; // kale çizgisi ekranın %28'inde
        const P = (x, y, h = 0) => { const d = Math.max(3, Yc - y), k = f / d; return { x: cx + x * k, y: hz + (Hc - h) * k, k }; };
        return { W, H, top: H * 0.28, ppm: 1, P };
      };
      const choose = (i) => { if (phase !== 'aim' || done) return; pick = i; phase = 'power'; pt = 0; };
      const meter = () => (Math.sin(pt * (2.4 + o.skill * 1.6)) + 1) / 2;
      const strike = () => {
        if (phase !== 'power' || done) return;
        const m = meter(), err = Math.abs(m - gc);
        q = err < green / 2 ? 'perfect' : err < green * 1.4 ? 'good' : 'miss';
        phase = 'flight'; ft = 0;
        const isFree = pick === free;
        if (q === 'miss') out = 'clear';
        else {
          const pg = (isFree ? (q === 'perfect' ? 0.72 : 0.42) : (q === 'perfect' ? 0.3 : 0.12)) * (1 - o.skill * 0.25);
          out = U.chance(pg) ? 'goal' : U.chance(isFree ? 0.7 : 0.45) ? 'saved' : 'clear';
        }
      };
      const tap = (x, y) => {
        if (done) return;
        if (phase === 'aim') {
          const C = cam();
          let best = -1, bd = 1e9;
          Z.forEach((z, i) => { const a = C.P(z.x, z.y, 1); const d = Math.hypot(a.x - x, a.y - y); if (d < bd) { bd = d; best = i; } });
          if (best >= 0 && bd < C.H * 0.16) choose(best);
        } else if (phase === 'power') strike();
      };
      const line = (C, pts, w = 2) => { ctx.beginPath(); pts.forEach(([x, y], i) => { const a = C.P(x, y); if (i) ctx.lineTo(a.x, a.y); else ctx.moveTo(a.x, a.y); }); ctx.lineWidth = w * g.dpr; ctx.stroke(); };
      const fig = (C, x, y, kit, look, extra = {}) => { const a = C.P(x, y); const fh = 1.85 * a.k * 2; Sprites.figure(ctx, a.x, a.y - (extra.jump || 0) * C.ppm * a.k, fh, Object.assign({ kit, look, t }, extra)); return { a, fh }; };
      const draw = () => {
        const C = cam(), { W, H, top, P } = C, dpr = g.dpr;
        g.grass();
        // tribün ve reklam panoları (kale çizgisinin arkası)
        const bh = P(0, -2.2).k * 0.9;
        const gl = P(-40, 0), gr = P(40, 0);
        const sg = ctx.createLinearGradient(0, 0, 0, top);
        sg.addColorStop(0, '#0b1224'); sg.addColorStop(1, '#1b2640');
        ctx.fillStyle = sg; ctx.fillRect(0, 0, W, P(0, -2.2).y - bh);
        for (let r = 0; r < 7; r++) for (let c2 = 0; c2 < 46; c2++) {
          const x = (c2 + (r % 2) * 0.5) / 46 * W, y = (r + 0.5) / 7 * (P(0, -2.2).y - bh * 1.2);
          ctx.fillStyle = ['#c8102e', '#ffffff', '#7a8aa8', '#f2c94c', '#1e5bd8'][(r * 7 + c2 * 3) % 5];
          ctx.globalAlpha = 0.35 + ((r + c2) % 3) * 0.15; ctx.fillRect(x, y + Math.sin(t * 3 + c2) * dpr, 3 * dpr, 4 * dpr);
        }
        ctx.globalAlpha = 1;
        const ads = ['STARFOOT', 'SF SPORT', 'STARFEED', 'VİTRİN', 'STARFOOT', 'SF SPORT'];
        for (let i = 0; i < 6; i++) {
          const a = P(-44 + i * 16, -2.2), b = P(-28 + i * 16, -2.2);
          ctx.fillStyle = i % 2 ? '#0d1f4f' : '#c8102e'; ctx.fillRect(a.x, a.y - bh, b.x - a.x, bh);
          ctx.fillStyle = '#fff'; ctx.font = `italic 800 ${Math.round(bh * 0.62)}px "Saira Condensed", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(ads[i], (a.x + b.x) / 2, a.y - bh / 2);
        }
        ctx.textBaseline = 'alphabetic';
        // saha çizgileri: kale çizgisi, ceza sahası (40,3 x 16,5), kale alanı (18,3 x 5,5), penaltı noktası ve yay, korner yayı
        ctx.strokeStyle = 'rgba(255,255,255,0.88)';
        line(C, [[-40, 0], [40, 0]]);
        line(C, [[-20.15, 0], [-20.15, 16.5], [20.15, 16.5], [20.15, 0]]);
        line(C, [[-9.15, 0], [-9.15, 5.5], [9.15, 5.5], [9.15, 0]]);
        { const ps = P(0, 11); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(ps.x, ps.y, 2.5 * dpr, 1.4 * dpr, 0, 0, Math.PI * 2); ctx.fill(); }
        { const arc = []; for (let a2 = -53; a2 <= 53; a2 += 6) { const r = 9.15, x = Math.sin(a2 * Math.PI / 180) * r, y = 11 + Math.cos(a2 * Math.PI / 180) * r; if (y >= 16.5) arc.push([x, y]); } if (arc.length > 1) line(C, arc); }
        { const arc = []; for (let a2 = 90; a2 <= 180; a2 += 10) arc.push([34 + Math.cos(a2 * Math.PI / 180), Math.sin(a2 * Math.PI / 180)]); line(C, arc); }
        line(C, [[34, 0], [34, 32]]);
        // kale (7,32 x 2,44 m) ve file
        const g0 = P(-3.66, 0), g1 = P(3.66, 0), gh = 2.44 * C.ppm * g0.k, dep = 1.6 * C.ppm * g0.k;
        ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(g0.x + dep * 0.25, g0.y - gh - dep * 0.35, g1.x - g0.x - dep * 0.5, gh + dep * 0.35);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = dpr;
        for (let i = 0; i <= 16; i++) { const x = g0.x + (g1.x - g0.x) * i / 16; ctx.beginPath(); ctx.moveTo(x, g0.y - gh); ctx.lineTo(x, g0.y); ctx.stroke(); }
        for (let j = 0; j <= 5; j++) { const y = g0.y - gh + gh * j / 5; ctx.beginPath(); ctx.moveTo(g0.x, y); ctx.lineTo(g1.x, y); ctx.stroke(); }
        const pw = Math.max(3, 0.12 * C.ppm * g0.k * 1.4);
        ctx.fillStyle = '#eef1f6'; ctx.fillRect(g0.x - pw / 2, g0.y - gh, pw, gh); ctx.fillRect(g1.x - pw / 2, g1.y - gh, pw, gh); ctx.fillRect(g0.x - pw / 2, g0.y - gh - pw / 2, g1.x - g0.x + pw, pw);
        // korner bayrağı
        const cf = P(34, 0), ch = 1.5 * C.ppm * cf.k;
        ctx.strokeStyle = '#e8e8e8'; ctx.lineWidth = 2 * dpr; ctx.beginPath(); ctx.moveTo(cf.x, cf.y); ctx.lineTo(cf.x, cf.y - ch); ctx.stroke();
        ctx.fillStyle = '#ffcf3f'; ctx.beginPath(); ctx.moveTo(cf.x, cf.y - ch); ctx.lineTo(cf.x - ch * 0.45, cf.y - ch * 0.82); ctx.lineTo(cf.x, cf.y - ch * 0.66); ctx.fill();
        // çizim sırası: uzaktan yakına (y küçükten büyüğe)
        const ents = [];
        const gkx = phase === 'flight' && pick != null ? Z[pick].x * 0.35 * U.clamp(ft, 0, 1) : Math.sin(t * 1.8) * 0.4;
        ents.push({ y: 0.9, f: () => fig(C, gkx, 0.9, o.kits.gk, lookGk, { facing: 'down', gloves: true, number: 1 }) });
        extraDef.forEach((d, i) => ents.push({ y: d.y, f: () => fig(C, d.x + Math.sin(t * 1.3 + i) * 0.15, d.y, o.kits.opp, looksD[i], { facing: 'up', number: 3 + i }) }));
        extraOwn.forEach((d, i) => ents.push({ y: d.y, f: () => fig(C, d.x + Math.sin(t * 1.1 + i) * 0.2, d.y, o.kits.own, looksO[3 + i], { facing: 'up', number: 14 + i }) }));
        Z.forEach((z, i) => {
          const isFree = i === free, sel = pick === i;
          if (!isFree) ents.push({ y: z.y + 0.6, f: () => fig(C, z.x + 0.7, z.y + 0.6, o.kits.opp, lookDef, { facing: 'up', number: 5 + i * 2, run: t * 2, speed: 0.12 }) });
          ents.push({ y: z.y, f: () => {
            const jump = phase === 'flight' && sel && ft > 0.95 ? Math.sin(U.clamp((ft - 0.95) / 0.5, 0, 1) * Math.PI) * 0.7 : 0;
            const r = fig(C, z.x, z.y, o.kits.own, looksO[i], { facing: 'up', number: 7 + i * 2, jump });
            if (phase === 'aim') {
              ctx.save(); ctx.globalAlpha = 0.55 + 0.3 * Math.sin(t * 5 + i);
              ctx.strokeStyle = isFree ? '#7cf0a0' : '#ff8a8a'; ctx.lineWidth = 3 * dpr; ctx.setLineDash([6 * dpr, 5 * dpr]);
              ctx.beginPath(); ctx.ellipse(r.a.x, r.a.y, r.fh * 0.55, r.fh * 0.18, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
            }
            const lab = `${i + 1} · ${isFree ? 'BOŞ' : 'MARKAJDA'}`;
            ctx.font = `800 ${Math.round(10.5 * dpr)}px "Barlow Semi Condensed", sans-serif`; ctx.textAlign = 'center';
            const tw = ctx.measureText(lab).width + 12 * dpr, ly = r.a.y - r.fh * 1.12 - (i === 0 ? 14 * dpr : 0), lx = r.a.x + (i === 0 ? tw * 0.35 : i === 2 ? -tw * 0.35 : 0);
            ctx.fillStyle = isFree ? 'rgba(20,140,70,0.92)' : 'rgba(170,30,40,0.88)';
            ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(lx - tw / 2, ly - 9 * dpr, tw, 16 * dpr, 8 * dpr); else ctx.rect(lx - tw / 2, ly - 9 * dpr, tw, 16 * dpr); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.fillText(lab, lx, ly + 3 * dpr);
          } });
        });
        // sen: korner bayrağının yanında
        const kick = phase === 'flight' ? U.clamp(ft / 0.25, 0, 1) : 0;
        ents.push({ y: 0.7, f: () => fig(C, 34.2, 0.7, o.kits.own, lookMe, { facing: 'left', number: o.number, label: 'SEN', labelScale: dpr, labelColor: 'rgba(214,40,57,0.92)', kick }) });
        ents.sort((a, b) => a.y - b.y).forEach((e) => e.f());
        // top: köşeden falsolu yay (yükseklik metre cinsinden)
        let bx = 33.6, by = 0.5, bh2 = 0.11;
        if (phase === 'flight' && pick != null) {
          const z = Z[pick], k = U.clamp((ft - 0.2) / 1.0, 0, 1);
          const tx = q === 'miss' ? z.x + 6 : z.x, ty = q === 'miss' ? z.y + 7 : z.y;
          if (k < 1) {
            // falso: düz çizgiden kaleye doğru bükülür
            const lx = bx + (tx - bx) * k, ly = by + (ty - by) * k;
            const curl = Math.sin(k * Math.PI) * (q === 'miss' ? 1 : 3.2);
            bx = lx; by = ly - curl; bh2 = Math.sin(k * Math.PI) * 7.5 + k * 2.1;
          } else {
            const k2 = U.clamp((ft - 1.2) / 0.5, 0, 1);
            const ex = out === 'goal' ? U.clamp(z.x * 0.8, -3.2, 3.2) : out === 'saved' ? gkx + 0.6 : tx + 8, ey = out === 'clear' ? ty + 14 : 0.2;
            bx = tx + (ex - tx) * k2; by = ty + (ey - ty) * k2; bh2 = out === 'clear' ? 2.1 + Math.sin(k2 * Math.PI) * 5 : 2.1 + (1.4 - 2.1) * k2;
            if (k2 >= 1 && !done) {
              if (out === 'goal') finish('success', 'GOL! ASİST SENDEN', '#7cf0a0');
              else if (out === 'saved') finish('partial', 'KALECİ KURTARDI', '#ffcf3f');
              else finish('fail', q === 'miss' ? 'KÖTÜ ORTA, SAVUNMA UZAKLAŞTIRDI' : 'SAVUNMA UZAKLAŞTIRDI', '#ff6b6b');
            }
          }
        }
        const sh = P(bx, by), ba = P(bx, by, bh2);
        ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(sh.x, sh.y, 0.32 * sh.k, 0.12 * sh.k, 0, 0, Math.PI * 2); ctx.fill();
        Sprites.ball(ctx, ba.x, ba.y, Math.max(4.5 * dpr, 0.34 * ba.k), t * 6);
        // güç çubuğu
        if (phase === 'power') {
          const bw = W * 0.72, bhh = 16 * dpr, x0 = W / 2 - bw / 2, y0 = H * 0.9;
          ctx.fillStyle = 'rgba(5,11,29,0.75)'; ctx.fillRect(x0 - 3 * dpr, y0 - 3 * dpr, bw + 6 * dpr, bhh + 6 * dpr);
          ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x0, y0, bw, bhh);
          ctx.fillStyle = 'rgba(255,207,63,0.75)'; ctx.fillRect(x0 + bw * (gc - green * 1.4), y0, bw * green * 2.8, bhh);
          ctx.fillStyle = '#22c55e'; ctx.fillRect(x0 + bw * (gc - green / 2), y0, bw * green, bhh);
          ctx.fillStyle = '#fff'; ctx.fillRect(x0 + bw * meter() - 2 * dpr, y0 - 6 * dpr, 4 * dpr, bhh + 12 * dpr);
          g.text('YEŞİLDE DOKUN!', y0 - 14 * dpr, 20);
        }
        if (done) g.text(msg, H * 0.5, 30, msgCol);
        else if (phase === 'aim') g.text(t < 1.2 ? 'KORNER!' : 'BOŞTAKİ ARKADAŞINA DOKUN', H * 0.92, t < 1.2 ? 34 : 22);
      };
      const loop = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now; t += dt;
        if (phase === 'power') pt += dt;
        if (phase === 'flight') ft += dt;
        if (phase === 'aim' && t > 7 && !done) choose(U.randi(0, 2));
        if (phase === 'power' && pt > 5 && !done) { q = 'miss'; phase = 'flight'; ft = 0; out = 'clear'; }
        draw();
        raf = requestAnimationFrame(loop);
      };
      const key = (e) => {
        if (['Digit1', 'Digit2', 'Digit3'].includes(e.code)) { e.preventDefault(); choose(+e.code.slice(-1) - 1); }
        else if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); if (phase === 'aim') choose(free); else strike(); }
      };
      const cleanup = () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', key); window.removeEventListener('resize', g.layout); };
      g.box.addEventListener('pointerdown', (e) => { e.preventDefault(); const r = g.cv.getBoundingClientRect(); tap((e.clientX - r.left) * g.dpr, (e.clientY - r.top) * g.dpr); });
      document.addEventListener('keydown', key);
      raf = requestAnimationFrame(loop);
      MiniGame._abort = () => { if (done) return; done = true; cleanup(); resolve({ result: 'auto' }); };
    });
  },

  // Tempo koşusu (dayanıklılık): basılı tutunca hızlanırsın; hız ibresini hareket eden yeşil bantta tut
  tempo(host, o) {
    return new Promise((resolve) => {
      const g = MiniGame._canvas(host, '<b>Basılı tut: hızlan</b>, bırak: yavaşla · ibreyi yeşil bantta tut · <kbd>Boşluk</kbd>');
      const { ctx } = g;
      const DUR = 12;
      const stam = o.stamina || 40;
      const band = U.clamp(0.16 + stam / 700 - o.skill * 0.04, 0.12, 0.28);
      let t = 0, done = false, raf = 0, last = performance.now(), pace = 0.3, hold = false, inBand = 0, target = 0.45, tgtGoal = 0.45, nextShift = 2, dist = 0;
      const look = Sprites.me();
      const finish = () => {
        done = true;
        const q = inBand / DUR;
        setTimeout(() => { cleanup(); resolve({ result: q >= 0.7 ? 'success' : q >= 0.45 ? 'partial' : 'fail' }); }, 1200);
      };
      const draw = () => {
        const { W, H, dpr } = g;
        // pist
        ctx.fillStyle = '#b5482f'; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 2 * dpr;
        for (let i = 1; i < 6; i++) { const y = H * 0.18 + i * H * 0.1; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
        const off = (dist * 60 * dpr) % (W / 4);
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        for (let x = -off; x < W; x += W / 4) ctx.fillRect(x, H * 0.18, 4 * dpr, H * 0.5);
        const fh = Math.min(H * 0.24, W * 0.3);
        Sprites.figure(ctx, W * 0.42, H * 0.6, fh, { kit: o.kits.own, look, facing: 'down', number: o.number, run: dist * 6, speed: U.clamp(pace * 1.4, 0.2, 1), t });
        // tempo göstergesi
        const bx = W * 0.08, bw = W * 0.84, by = H * 0.8, bh = 26 * dpr;
        ctx.fillStyle = 'rgba(10,16,32,0.8)'; ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = 'rgba(124,240,160,0.85)'; ctx.fillRect(bx + bw * (target - band / 2), by, bw * band, bh);
        const nx = bx + bw * pace;
        ctx.fillStyle = Math.abs(pace - target) < band / 2 ? '#fff' : '#ffcf3f';
        ctx.fillRect(nx - 3 * dpr, by - 8 * dpr, 6 * dpr, bh + 16 * dpr);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2 * dpr; ctx.strokeRect(bx, by, bw, bh);
        ctx.font = `700 ${Math.round(12 * dpr)}px "Barlow Semi Condensed", sans-serif`; ctx.fillStyle = '#fff';
        ctx.textAlign = 'left'; ctx.fillText('YAVAŞ', bx, by + bh + 16 * dpr); ctx.textAlign = 'right'; ctx.fillText('SÜRAT', bx + bw, by + bh + 16 * dpr);
        g.text(done ? `Tempoda: %${Math.round((inBand / DUR) * 100)}` : t < 0.6 ? 'HAZIR...' : `${Math.max(0, DUR - t + 0.6).toFixed(1)} sn`, H * 0.1, 30, done ? '#7cf0a0' : '#fff');
      };
      const loop = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now; t += dt;
        if (!done && t > 0.6) {
          pace = U.clamp(pace + (hold ? 0.55 : -0.42) * dt, 0, 1);
          dist += pace * dt * 2;
          nextShift -= dt;
          if (nextShift <= 0) { tgtGoal = U.rand(0.2, 0.85); nextShift = U.rand(1.6, 2.6) - o.skill * 0.6; }
          target += (tgtGoal - target) * Math.min(1, dt * 1.6);
          if (Math.abs(pace - target) < band / 2) inBand += dt;
          if (t > DUR + 0.6) finish();
        }
        draw();
        raf = requestAnimationFrame(loop);
      };
      const kd = (e) => { if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat) { e.preventDefault(); hold = true; } };
      const ku = (e) => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); hold = false; } };
      const pu = () => { hold = false; };
      const cleanup = () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); window.removeEventListener('pointerup', pu); window.removeEventListener('resize', g.layout); };
      g.box.addEventListener('pointerdown', (e) => { e.preventDefault(); hold = true; });
      window.addEventListener('pointerup', pu);
      document.addEventListener('keydown', kd); document.addEventListener('keyup', ku);
      raf = requestAnimationFrame(loop);
      MiniGame._abort = () => { if (done) return; done = true; cleanup(); resolve({ result: 'auto' }); };
    });
  },

  // Top sektirme: top ayağa inerken (yeşil bölge) dokun, yere düşürme
  juggle(host, o) {
    return new Promise((resolve) => {
      const g = MiniGame._canvas(host, '<b>Top yeşil bölgeye inince dokun</b> · erken dokunursan ritmin bozulur · <kbd>Boşluk</kbd>');
      const { ctx } = g;
      const GOAL = 10;
      const tech = o.technique || 40;
      const grav = 12 + o.skill * 5;
      const zone = U.clamp(0.16 + tech / 500 - o.skill * 0.05, 0.12, 0.34); // bölgenin yüksekliği (0-1)
      const ball = { h: 0.9, v: 0, x: 0 };
      let t = 0, done = false, raf = 0, last = performance.now(), touches = 0, best = 0, streak = 0, lives = 3, cool = 0, kick = 0, msg = '', msgT = 0, msgCol = '#fff';
      const look = Sprites.me();
      const say = (m, c) => { msg = m; msgCol = c; msgT = 0.8; };
      const tap = () => {
        if (done || t < 0.5 || cool > 0) return;
        if (ball.h <= zone && ball.v <= 0) {
          const perfect = ball.h < zone * 0.5;
          touches++; streak++; best = Math.max(best, streak);
          ball.v = 4.8 + U.rand(0, 0.5); ball.x = U.clamp(ball.x + U.rand(-0.12, 0.12), -0.3, 0.3);
          kick = 0.3;
          say(perfect ? 'MÜKEMMEL!' : 'İYİ', perfect ? '#7cf0a0' : '#fff');
          if (touches >= GOAL) finish();
        } else {
          cool = 0.35;
          say('ERKEN!', '#ffcf3f');
        }
      };
      const finish = () => {
        if (done) return;
        done = true;
        const r = touches >= GOAL ? 'success' : touches >= GOAL / 2 ? 'partial' : 'fail';
        say(r === 'success' ? `${touches} SEKTİRME!` : r === 'partial' ? `${touches} sektirme, fena değil` : 'TOP YERE DÜŞTÜ', r === 'fail' ? '#ff6b6b' : '#7cf0a0');
        msgT = 9;
        setTimeout(() => { cleanup(); resolve({ result: r }); }, 1200);
      };
      const draw = () => {
        const { W, H, dpr } = g;
        g.grass();
        const fh = Math.min(H * 0.34, W * 0.42);
        const footY = H * 0.86, topY = H * 0.14;
        const yOf = (h) => footY - fh * 0.12 - h * (footY - fh * 0.12 - topY);
        // bölge
        ctx.fillStyle = 'rgba(124,240,160,0.18)';
        ctx.fillRect(W * 0.2, yOf(zone), W * 0.6, yOf(0) - yOf(zone));
        ctx.strokeStyle = 'rgba(124,240,160,0.9)'; ctx.lineWidth = 2 * dpr; ctx.setLineDash([8 * dpr, 6 * dpr]);
        ctx.beginPath(); ctx.moveTo(W * 0.2, yOf(zone)); ctx.lineTo(W * 0.8, yOf(zone)); ctx.stroke(); ctx.setLineDash([]);
        Sprites.figure(ctx, W / 2, footY, fh, { kit: o.kits.own, look, facing: 'down', number: o.number, kick: kick > 0 ? 1 - kick / 0.3 : 0, t });
        const bx = W / 2 + ball.x * W * 0.3 + fh * 0.12, by = yOf(ball.h);
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(bx, footY, 12 * dpr, 4 * dpr, 0, 0, Math.PI * 2); ctx.fill();
        Sprites.ball(ctx, bx, by, Math.max(8 * dpr, fh * 0.055), t * 5);
        g.text(`${touches} / ${GOAL}`, H * 0.08, 34);
        ctx.font = `700 ${Math.round(15 * dpr)}px "Barlow Semi Condensed", sans-serif`; ctx.fillStyle = '#fff'; ctx.textAlign = 'right';
        ctx.fillText('♥'.repeat(lives) + '♡'.repeat(3 - lives), W - 14 * dpr, H * 0.08);
        if (msgT > 0) g.text(msg, H * 0.5, 30, msgCol);
        if (t < 0.5) g.text('HAZIR...', H * 0.5, 34);
      };
      const loop = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now; t += dt;
        cool = Math.max(0, cool - dt); kick = Math.max(0, kick - dt); msgT = Math.max(0, msgT - dt);
        if (!done && t > 0.5) {
          ball.v -= grav * dt * 0.5;
          ball.h += ball.v * dt * 0.5;
          if (ball.h < -0.02) {
            lives--; streak = 0;
            say('DÜŞTÜ!', '#ff6b6b');
            if (lives <= 0) finish();
            else { ball.h = 0.9; ball.v = 0; }
          }
          if (t > 30) finish();
        }
        draw();
        raf = requestAnimationFrame(loop);
      };
      const key = (e) => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); tap(); } };
      const cleanup = () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', key); window.removeEventListener('resize', g.layout); };
      g.box.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(); });
      document.addEventListener('keydown', key);
      raf = requestAnimationFrame(loop);
      MiniGame._abort = () => { if (done) return; done = true; cleanup(); resolve({ result: 'auto' }); };
    });
  },

  // Omuz omuza: basılı tut, güç dolsun; yeşil bantta bırak ve rakibi it
  shoulder(host, o) {
    return new Promise((resolve) => {
      const g = MiniGame._canvas(host, '<b>Basılı tut</b>, güç dolarken <b>yeşil bantta bırak</b> · <kbd>Boşluk</kbd>');
      const { ctx } = g;
      const ROUNDS = 3;
      const phys = o.physical || 40;
      const bandW = U.clamp(0.14 + phys / 600 - o.skill * 0.05, 0.1, 0.28);
      const fill = 0.9 + o.skill * 0.7; // saniyede dolma hızı
      let round = 0, wins = 0, power = 0, holding = false, band = 0, t = 0, done = false, raf = 0, last = performance.now();
      let push = 0, pushDir = 0, msg = '', msgCol = '#fff', msgT = 0, wait = 0.6;
      const lookMe = Sprites.me(), lookOp = Sprites.look(23);
      const newBand = () => { band = U.rand(0.45, 0.92 - bandW); power = 0; };
      newBand();
      const say = (m, c) => { msg = m; msgCol = c; msgT = 0.9; };
      const down = () => { if (done || wait > 0) return; holding = true; };
      const up = () => {
        if (!holding || done) return;
        holding = false;
        const ok = power >= band && power <= band + bandW;
        if (ok) { wins++; pushDir = 1; say('RAKİBİ İTTİN!', '#7cf0a0'); }
        else { pushDir = -1; say(power < band ? 'ZAYIF KALDI' : 'DENGENİ KAYBETTİN', '#ff6b6b'); }
        push = 0.6; round++; wait = 0.9;
        if (round >= ROUNDS) {
          done = true;
          const r = wins >= 3 ? 'success' : wins >= 2 ? 'partial' : 'fail';
          setTimeout(() => { cleanup(); resolve({ result: r }); }, 1100);
        }
      };
      const draw = () => {
        const { W, H, dpr } = g;
        g.grass();
        const fh = Math.min(H * 0.3, W * 0.3);
        const cx = W / 2, fy = H * 0.66;
        const off = push > 0 ? pushDir * (1 - Math.abs(push - 0.3) / 0.3) * W * 0.06 : 0;
        const lean = holding ? power * W * 0.02 : 0;
        Sprites.figure(ctx, cx + fh * 0.28 + off + lean * 0.3, fy, fh, { kit: o.kits.opp, look: lookOp, facing: 'up', number: 4, run: t * 2, speed: 0.4, t });
        Sprites.figure(ctx, cx - fh * 0.28 + lean, fy, fh, { kit: o.kits.own, look: lookMe, facing: 'up', number: o.number, run: t * 2, speed: 0.4, label: 'SEN', labelScale: dpr, labelColor: 'rgba(214,40,57,0.92)', t });
        Sprites.ball(ctx, cx, fy - fh * 1.25, 9 * dpr, t * 2);
        // güç barı
        const bx = W * 0.12, bw = W * 0.76, by = H * 0.84, bh = 22 * dpr;
        ctx.fillStyle = 'rgba(10,16,32,0.75)'; ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = 'rgba(124,240,160,0.85)'; ctx.fillRect(bx + bw * band, by, bw * bandW, bh);
        ctx.fillStyle = power > band + bandW ? '#ff6b6b' : '#ffcf3f'; ctx.fillRect(bx, by + bh * 0.3, bw * Math.min(1, power), bh * 0.4);
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2 * dpr; ctx.strokeRect(bx, by, bw, bh);
        g.text(`OMUZ ${Math.min(round + 1, ROUNDS)} / ${ROUNDS} · ${wins} KAZANDIN`, H * 0.08, 28);
        if (msgT > 0) g.text(msg, H * 0.3, 32, msgCol);
        else if (!done && wait <= 0 && !holding) g.text('BASILI TUT', H * 0.3, 28, '#ffcf3f');
      };
      const loop = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now; t += dt;
        wait = Math.max(0, wait - dt); push = Math.max(0, push - dt); msgT = Math.max(0, msgT - dt);
        if (wait <= 0 && !holding && power > 0 && !done && push <= 0) newBand();
        if (holding) { power += fill * dt; if (power > 1.08) up(); }
        draw();
        raf = requestAnimationFrame(loop);
      };
      const kd = (e) => { if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat) { e.preventDefault(); down(); } };
      const ku = (e) => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); up(); } };
      const pu = () => up();
      const cleanup = () => { cancelAnimationFrame(raf); document.removeEventListener('keydown', kd); document.removeEventListener('keyup', ku); window.removeEventListener('pointerup', pu); window.removeEventListener('resize', g.layout); };
      g.box.addEventListener('pointerdown', (e) => { e.preventDefault(); down(); });
      window.addEventListener('pointerup', pu);
      document.addEventListener('keydown', kd); document.addEventListener('keyup', ku);
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
        dpr = Perf.dpr();
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
        Sprites.turf(ctx, W, H, 10);
        const fh = Math.min(H * 0.17, W * 0.2);
        Sprites.figure(ctx, meP.x * W, meP.y * H + fh * 0.4, fh, { kit: o.kits.own, look: Sprites.me(), facing: 'up', number: o.number, label: 'SEN', labelScale: dpr, labelColor: 'rgba(214,40,57,0.92)', t });
        if (tgt) {
          const k = 1 - rt / win;
          Sprites.figure(ctx, tgt.x * W, tgt.y * H + fh * 0.4, fh, { kit: o.kits.own, look: tgt.look, facing: 'up', number: 7 + hits, label: tgt.name, labelScale: dpr, ring: 'rgba(124,240,160,0.95)', t });
          ctx.strokeStyle = k > 0.35 ? '#7cf0a0' : '#ff6b6b'; ctx.lineWidth = 6 * dpr;
          ctx.beginPath(); ctx.arc(tgt.x * W, tgt.y * H - fh * 0.2, fh * 0.75, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); ctx.stroke();
        }
        {
          const e = ballT;
          Sprites.ball(ctx, (ballFrom.x + (ballTo.x - ballFrom.x) * e) * W, (ballFrom.y + (ballTo.y - ballFrom.y) * e) * H + fh * 0.38, 7 * dpr, t * 8);
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
