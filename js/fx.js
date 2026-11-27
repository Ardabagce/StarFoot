// Görsel efektler (1.0.29): top izi, gol flaşı ve sarsıntısı, konfeti, kritik anda kamera yakınlaşması.
// Mevcut mini oyunlara ve kupa törenine dışarıdan bağlanır; oyunun kurallarını değiştirmez.
// "Hareketi azalt" açık cihazlarda sarsıntı, yakınlaşma ve konfeti kapalıdır.
const FX = {
  calm() { try { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } },

  // Kısa beyaz/renkli parlama
  flash(host, color) {
    if (!host || !host.appendChild) return;
    const d = document.createElement('div');
    d.className = 'fx-flash';
    if (color) d.style.background = color;
    host.appendChild(d);
    setTimeout(() => d.remove(), 450);
  },
  shake(host) {
    if (!host || FX.calm()) return;
    host.classList.remove('fx-shake'); void host.offsetWidth; host.classList.add('fx-shake');
    setTimeout(() => host.classList.remove('fx-shake'), 420);
  },
  // Kritik an başlarken hafif yakınlaşma (kamera topa yaklaşır)
  zoom(host) {
    if (!host || FX.calm()) return;
    host.classList.remove('fx-zoom'); void host.offsetWidth; host.classList.add('fx-zoom');
    setTimeout(() => host.classList.remove('fx-zoom'), 520);
  },
  // Ekranın üstünde kendi kendini temizleyen konfeti
  confetti(host, n, cols) {
    if (FX.calm()) return;
    const root = host && host.getBoundingClientRect ? host : document.body;
    const r = root.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const cv = document.createElement('canvas');
    cv.className = 'fx-conf';
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    Object.assign(cv.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    document.body.appendChild(cv);
    const c = cv.getContext('2d');
    const C = cols || ['#ffcf3f', '#ffffff', '#3ddc84', '#4aa3ff', '#ff5a5f'];
    const P = [];
    for (let i = 0; i < (n || 110); i++) {
      P.push({ x: cv.width * (0.2 + Math.random() * 0.6), y: cv.height * (0.35 + Math.random() * 0.2), vx: (Math.random() - 0.5) * 900 * dpr, vy: -(300 + Math.random() * 700) * dpr, w: (4 + Math.random() * 5) * dpr, h: (6 + Math.random() * 8) * dpr, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 14, c: C[i % C.length], life: 1.4 + Math.random() * 1.1 });
    }
    let last = performance.now(), t0 = last;
    const step = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      c.clearRect(0, 0, cv.width, cv.height);
      let alive = 0;
      P.forEach((p) => {
        p.life -= dt; if (p.life <= 0) return;
        alive++;
        p.vy += 1500 * dpr * dt; p.vx *= 0.99; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
        c.save(); c.globalAlpha = Math.min(1, p.life * 1.5); c.translate(p.x, p.y); c.rotate(p.rot);
        c.fillStyle = p.c; c.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot * 1.7)));
        c.restore();
      });
      if (alive && now - t0 < 3200) requestAnimationFrame(step); else cv.remove();
    };
    requestAnimationFrame(step);
  },
  goal(host, big) {
    FX.flash(host);
    FX.shake(host);
    if (big !== false) FX.confetti(host);
    try { if (typeof Sfx !== 'undefined' && Sfx.buzz) Sfx.buzz('heavy'); } catch (e) { /* yok */ }
  },

  // ---------- Top izi: hızlı giden topun arkasında solan iz ----------
  trail: new WeakMap(),
  drawTrail(ctx, x, y, r) {
    if (!ctx || !(r > 0)) return;
    const now = performance.now(), key = Math.round(r);
    let m = FX.trail.get(ctx);
    if (!m) { m = {}; FX.trail.set(ctx, m); }
    let e = m[key];
    if (!e || now - e.t > 90) { m[key] = { x, y, t: now, h: [] }; return; }
    const d = Math.hypot(x - e.x, y - e.y);
    if (d > r * 30) { e.h = []; }
    else if (d > r * 0.7) { e.h.push([e.x, e.y]); if (e.h.length > 7) e.h.shift(); }
    else if (e.h.length) e.h.shift();
    e.x = x; e.y = y; e.t = now;
    const n = e.h.length;
    if (n < 2) return;
    ctx.save();
    for (let i = 0; i < n; i++) {
      const k = (i + 1) / n;
      ctx.globalAlpha = 0.32 * k;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(e.h[i][0], e.h[i][1], r * (0.45 + 0.5 * k), 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  },

  init() {
    if (FX.done) return;
    FX.done = true;
    // top izi
    if (typeof Sprites !== 'undefined' && Sprites.ball && !Sprites.ball.fx) {
      const b0 = Sprites.ball;
      Sprites.ball = function (ctx, x, y, r) { try { FX.drawTrail(ctx, x, y, r); } catch (e) { /* iz çizilemedi */ } return b0.apply(this, arguments); };
      Sprites.ball.fx = true;
    }
    // mini oyunlar: başta yakınlaşma, başarıda gol efekti (ana şut sahnesi kendi efektlerini zaten çiziyor)
    if (typeof MiniGame !== 'undefined') {
      const KEEP = ['keeper', 'gkOne', 'gkCross', 'gkReflex', 'gkDist'];
      ['play', 'timing', 'sprint', 'dribble', 'keeper', 'gkOne', 'gkCross', 'gkReflex', 'gkDist', 'header', 'corner', 'tempo', 'juggle', 'shoulder', 'onetwo'].forEach((k) => {
        const f = MiniGame[k];
        if (typeof f !== 'function' || f.fx) return;
        MiniGame[k] = function (host) {
          try { FX.zoom(host); } catch (e) { /* yok */ }
          const pr = f.apply(this, arguments);
          if (k !== 'play' && pr && typeof pr.then === 'function') {
            pr.then((res) => {
              try {
                const r = res && (res.result || res.outcome);
                if (r === 'success' || r === 'goal') FX.goal(host && host.isConnected ? host : document.body, KEEP.indexOf(k) < 0);
              } catch (e) { /* yok */ }
            }, () => {});
          }
          return pr;
        };
        MiniGame[k].fx = true;
      });
    }
    // kupa töreni: konfeti
    if (typeof Celebrate !== 'undefined' && Celebrate.champion && !Celebrate.champion.fx) {
      const c0 = Celebrate.champion;
      Celebrate.champion = function () { setTimeout(() => { try { FX.confetti(document.body, 160); } catch (e) { /* yok */ } }, 600); return c0.apply(this, arguments); };
      Celebrate.champion.fx = true;
    }
  },
};
FX.init();
