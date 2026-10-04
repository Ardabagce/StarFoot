// Gol sevinçleri ve şampiyonluk kupa kaldırma töreni (canvas animasyonları)

const CELEBRATIONS = [
  { id: 'arms', name: 'Kollar Havada', desc: 'Klasik: koş, kolları aç, takım arkadaşlarına sarıl.', goals: 0 },
  { id: 'slide', name: 'Diz Kayması', desc: 'Köşe bayrağına doğru çimde kayarak.', goals: 0 },
  { id: 'plane', name: 'Uçak', desc: 'Kollar yana açık, sağa sola yatarak koş.', goals: 3 },
  { id: 'heart', name: 'Kalp', desc: 'Tribünlere kollarla kalp yap.', goals: 8 },
  { id: 'dance', name: 'Köşe Dansı', desc: 'Köşe bayrağının yanında dans.', goals: 15 },
  { id: 'fans', name: 'Tribüne Koşu', desc: 'Kameraya doğru koş, taraftarla buluş.', goals: 25 },
  { id: 'siu', name: 'Zıpla ve Dön', desc: 'Havada dönüp kollar açık yere bas.', goals: 40 },
  { id: 'flip', name: 'Ters Takla', desc: 'Havada ters takla atıp yere kon.', goals: 70 },
];

const Celebrate = {
  // Oyuncunun seçtiği sevinç (kilitliyse kollar havada)
  pick(p) {
    const id = p.celeb || 'arms';
    if (id === 'random') return U.pick(Celebrate.unlocked(p)).id;
    const c = CELEBRATIONS.find((x) => x.id === id);
    return c && p.totals.goals >= c.goals ? id : 'arms';
  },
  unlocked(p) { return CELEBRATIONS.filter((c) => p.totals.goals >= c.goals); },

  // Kadrajı dolduran canvas ve stadyum arka planı
  stage(host, P, day) {
    host.innerHTML = '';
    const cv = document.createElement('canvas');
    cv.className = 'celeb-cv';
    host.appendChild(cv);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = Math.round((host.clientWidth || 360) * dpr), H = Math.round((host.clientHeight || 480) * dpr);
    cv.width = W; cv.height = H;
    const bg = document.createElement('canvas'); bg.width = W; bg.height = H;
    const r = SocialArt.rng(U.randi(1, 1e9));
    SocialArt.blurred(bg.getContext('2d'), W, H, 2 * dpr, (b) => SocialArt.stadium(b, W, H, r, P, day));
    return { cv, c: cv.getContext('2d'), W, H, dpr, bg };
  },

  flashes(c, W, H, t, n) {
    for (let i = 0; i < n; i++) {
      const k = Math.floor(t * 9) * 31 + i * 17;
      const x = ((Math.sin(k) * 43758.5) % 1 + 1) % 1, y = ((Math.sin(k * 1.7) * 12345.6) % 1 + 1) % 1;
      SocialArt.glow(c, x * W, H * (0.18 + y * 0.35), 14 + y * 18, 'rgba(255,255,255,0.9)', 0.7);
    }
  },

  // Bir oyuncu figürü: dönüş, yatay ölçek ve dikey sıçrama ile
  fig(c, x, y, h, o, rot = 0, sx = 1) {
    c.save();
    c.translate(x, y - h * 0.5);
    if (rot) c.rotate(rot);
    if (sx !== 1) c.scale(sx, 1);
    Sprites.figure(c, 0, h * 0.5, h, Object.assign({ facing: 'down', noShadow: true, t: 0 }, o));
    c.restore();
  },

  title(c, W, H, dpr, t, big, small, col = '#ffcf3f') {
    const s = Math.min(1, t * 4);
    const pop = 1 + Math.max(0, 0.25 - t) * 1.6;
    c.save();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.globalAlpha = s;
    c.font = `italic 800 ${Math.round(Math.min(W * 0.16, 64 * dpr) * pop)}px "Saira Condensed", "Arial Narrow", sans-serif`;
    c.lineWidth = 6 * dpr; c.strokeStyle = 'rgba(0,0,0,0.55)';
    c.strokeText(big, W / 2, H * 0.12); c.fillStyle = col; c.fillText(big, W / 2, H * 0.12);
    if (small) {
      c.font = `700 ${Math.round(16 * dpr)}px "Barlow Semi Condensed", "Segoe UI", sans-serif`;
      c.fillStyle = '#ffffff'; c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 4 * dpr;
      c.strokeText(small, W / 2, H * 0.12 + 40 * dpr); c.fillText(small, W / 2, H * 0.12 + 40 * dpr);
    }
    c.restore();
  },

  // ---------- Gol sevinci ----------
  goal(host, o) {
    return new Promise((resolve) => {
      const P = { c1: o.c1 || '#c8102e', c2: o.c2 || '#ffffff', short: o.short || '' };
      const S = Celebrate.stage(host, P, false);
      const { c, W, H, dpr, bg } = S;
      const kit = o.kit, look = Sprites.look(7);
      const type = o.type || 'arms';
      const D = 3.4;
      const mates = [Sprites.look(3), Sprites.look(11), Sprites.look(22)];
      const ground = H * 0.95, h0 = Math.min(H * 0.5, W * 0.9);
      let t = 0, last = performance.now(), done = false, raf;
      const finish = () => { if (done) return; done = true; cancelAnimationFrame(raf); host.innerHTML = ''; resolve(); };
      host.onclick = finish;
      MiniGame._abort = finish;
      const frame = (now) => {
        t += Math.min(0.05, (now - last) / 1000); last = now;
        c.drawImage(bg, 0, 0);
        Celebrate.flashes(c, W, H, t, 3);
        const k = Math.min(1, t / 0.9);
        let x = W * (0.18 + 0.32 * (1 - Math.pow(1 - k, 2))), y = ground, h = h0, rot = 0, sx = 1;
        const f = { kit, look, number: o.number, run: t * 11, speed: t < 0.9 ? 1 : 0 };
        if (type === 'arms') {
          if (t > 0.9) { f.dive = 1; y -= Math.abs(Math.sin((t - 0.9) * 7)) * h * 0.08; }
        } else if (type === 'slide') {
          if (t > 0.7) { const s = Math.min(1, (t - 0.7) / 0.9); x = W * (0.42 + 0.2 * (1 - Math.pow(1 - s, 3))); rot = -0.32 * Math.min(1, s * 3); y = ground + h * 0.06; f.speed = 0; f.dive = 1; }
        } else if (type === 'plane') {
          x = W * (0.5 + Math.sin(t * 2.2) * 0.28); rot = Math.cos(t * 2.2) * 0.22; f.armA = Math.PI / 2; f.speed = 1;
        } else if (type === 'heart') {
          f.speed = t < 0.9 ? 1 : 0;
          if (t > 0.9) { f.armA = Math.min(2.75, (t - 0.9) * 6); rot = Math.sin(t * 3) * 0.04; }
          if (t > 1.3) {
            const hx = x, hy = y - h * 1.18, s = h * 0.09 * (1 + Math.sin(t * 8) * 0.08);
            c.save(); c.fillStyle = '#ff3d6e'; c.shadowColor = '#ff3d6e'; c.shadowBlur = 20 * dpr;
            c.beginPath(); c.moveTo(hx, hy + s); c.bezierCurveTo(hx - s * 2, hy - s * 0.4, hx - s * 0.8, hy - s * 1.8, hx, hy - s * 0.7);
            c.bezierCurveTo(hx + s * 0.8, hy - s * 1.8, hx + s * 2, hy - s * 0.4, hx, hy + s); c.fill(); c.restore();
          }
        } else if (type === 'dance') {
          x = W * 0.42; f.speed = 0;
          const fx = W * 0.8;
          c.fillStyle = '#f2f2f2'; c.fillRect(fx, ground - h * 0.9, 3 * dpr, h * 0.9);
          c.fillStyle = '#ffcf3f'; c.beginPath(); c.moveTo(fx + 3 * dpr, ground - h * 0.9); c.lineTo(fx + 3 * dpr + h * 0.18 + Math.sin(t * 9) * 4 * dpr, ground - h * 0.83); c.lineTo(fx + 3 * dpr, ground - h * 0.76); c.fill();
          if (t > 0.5) { x += Math.sin(t * 7) * h * 0.12; y -= Math.abs(Math.sin(t * 7)) * h * 0.05; f.armA = 0.6 + Math.sin(t * 14) * 0.5; f.run = t * 14; f.speed = 0.6; }
        } else if (type === 'fans') {
          const s = Math.min(1, t / 2.2);
          h = h0 * (0.55 + s * 0.75); x = W * 0.5 + Math.sin(t * 5) * W * 0.02; y = ground + h * 0.1 * s; f.speed = 1;
          if (t > 2.2) { f.dive = 1; f.speed = 0; }
          Celebrate.flashes(c, W, H, t + 7, 6);
        } else if (type === 'siu') {
          if (t > 0.8 && t < 1.6) { const s = (t - 0.8) / 0.8; y -= Math.sin(s * Math.PI) * h * 0.35; sx = Math.cos(s * Math.PI * 2); if (sx < 0) f.facing = 'up'; sx = Math.max(0.15, Math.abs(sx)); f.speed = 0; }
          if (t >= 1.6) { f.armA = 0.95; f.speed = 0; }
        } else if (type === 'flip') {
          if (t > 0.8 && t < 1.6) { const s = (t - 0.8) / 0.8; y -= Math.sin(s * Math.PI) * h * 0.45; rot = -s * Math.PI * 2; f.speed = 0; }
          if (t >= 1.6) { f.dive = 1; f.speed = 0; }
        }
        // takım arkadaşları koşarak gelir
        if (t > 1.8 && type !== 'fans') {
          const s = Math.min(1, (t - 1.8) / 0.9);
          mates.forEach((L, i) => {
            const from = i % 2 ? W * 1.2 : -W * 0.2;
            const to = x + (i % 2 ? 1 : -1) * h * (0.32 + i * 0.12);
            Celebrate.fig(c, from + (to - from) * s, ground + h * 0.04 * i, h * 0.92, { kit, look: L, run: t * 11, speed: s < 1 ? 1 : 0, dive: s >= 1 ? 1 : 0 });
          });
        }
        Celebrate.fig(c, x, y, h, f, rot, sx);
        // vinyet
        const v = c.createRadialGradient(W / 2, H * 0.5, W * 0.3, W / 2, H * 0.5, W * 0.9);
        v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.45)');
        c.fillStyle = v; c.fillRect(0, 0, W, H);
        const name = type === 'siu' && t > 1.5 ? 'SİUUU!' : 'GOOOL!';
        Celebrate.title(c, W, H, dpr, t, name, `${o.name} · ${o.min}'  ·  ${o.score}`);
        if (t >= D) return finish();
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    });
  },

  // ---------- Şampiyonluk töreni: kupa kaldırma, konfeti, havai fişek ----------
  trophy(o) {
    return new Promise((resolve) => {
      const el = document.createElement('div');
      el.className = 'cer-trophy';
      el.innerHTML = `<div class="ct-host"></div><div class="ct-foot"><b>${U.esc(o.title || 'ŞAMPİYON')}</b><small>${U.esc(o.sub || '')}</small><button class="btn btn-big">Devam</button></div>`;
      document.body.appendChild(el);
      const host = el.querySelector('.ct-host');
      const P = { c1: o.c1 || '#c8102e', c2: o.c2 || '#ffffff', short: o.short || '' };
      const S = Celebrate.stage(host, P, false);
      const { c, W, H, dpr, bg } = S;
      const kit = o.kit, look = Sprites.look(7);
      const ground = H * 0.97, h = Math.min(H * 0.5, W * 0.62);
      const mates = Array.from({ length: 6 }, (_, i) => ({ L: Sprites.look(31 + i * 7), x: (i < 3 ? -1 : 1) * (0.24 + (i % 3) * 0.12), ph: i * 0.7, num: [4, 6, 8, 3, 14, 23][i] }));
      const conf = [];
      const fw = [];
      const cols = ['#ffd84a', '#ffffff', P.c1, P.c2, '#ffb02e'];
      let t = 0, last = performance.now(), raf, burst = false;
      const close = () => { cancelAnimationFrame(raf); el.remove(); resolve(); };
      el.querySelector('button').onclick = close;
      const frame = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000); t += dt; last = now;
        c.drawImage(bg, 0, 0);
        // havai fişekler
        if (t > 2 && Math.random() < dt * 2.2) {
          const fx = W * (0.15 + Math.random() * 0.7), fy = H * (0.08 + Math.random() * 0.22), col = cols[Math.floor(Math.random() * cols.length)];
          for (let i = 0; i < 46; i++) { const a = (i / 46) * Math.PI * 2, sp = (60 + Math.random() * 90) * dpr; fw.push({ x: fx, y: fy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1.3, col }); }
        }
        c.save(); c.globalCompositeOperation = 'lighter';
        for (let i = fw.length - 1; i >= 0; i--) {
          const q = fw[i]; q.life -= dt; if (q.life <= 0) { fw.splice(i, 1); continue; }
          q.vy += 60 * dpr * dt; q.x += q.vx * dt; q.y += q.vy * dt;
          c.globalAlpha = Math.min(1, q.life); c.fillStyle = q.col; c.fillRect(q.x, q.y, 2.5 * dpr, 2.5 * dpr);
        }
        c.restore();
        Celebrate.flashes(c, W, H, t, t > 1.6 ? 6 : 2);
        // sahne
        const sg = c.createLinearGradient(0, ground - h * 0.12, 0, H);
        sg.addColorStop(0, '#1b1f2b'); sg.addColorStop(1, '#0a0c12');
        c.fillStyle = sg; c.fillRect(W * 0.04, ground - h * 0.1, W * 0.92, H - ground + h * 0.1);
        c.fillStyle = P.c1; c.fillRect(W * 0.04, ground - h * 0.1, W * 0.92, 4 * dpr);
        // takım arkadaşları
        const lifted = t > 1.4;
        mates.forEach((m) => {
          const jump = lifted ? Math.abs(Math.sin(t * 6 + m.ph)) * h * 0.07 : 0;
          Celebrate.fig(c, W * 0.5 + m.x * W, ground - h * 0.2 - jump, h * 0.68, { kit, look: m.L, number: m.num === o.number ? 5 : m.num, dive: lifted ? 1 : 0 });
        });
        // oyuncu: kupayı göğüsten başın üstüne kaldırır
        const px = W * 0.5, py = ground - h * 0.04;
        const a = U.clamp((t - 0.6) / 0.8, 0, 1) * 2.85;
        Celebrate.fig(c, px, py, h, { kit, look, number: o.number, armA: a });
        const shY = py - h * 0.82 + h * 0.03, L = h * 0.32;
        const th = 0.12 - a;
        const handY = shY + L * Math.cos(th);
        const ty = Math.min(py - h * 0.55, handY) - h * 0.06;
        SocialArt.glow(c, px, ty, h * 0.35, 'rgba(255,220,120,0.45)', lifted ? 1 : 0.4);
        SocialArt.trophyCup(c, px, ty, h * 0.13);
        // konfeti
        if (lifted && !burst) {
          burst = true;
          for (let i = 0; i < 260; i++) conf.push({ x: W * Math.random(), y: -H * Math.random() * 0.6, vy: (60 + Math.random() * 120) * dpr, vx: (Math.random() - 0.5) * 40 * dpr, r: Math.random() * 6, vr: (Math.random() - 0.5) * 8, col: cols[Math.floor(Math.random() * cols.length)], s: (4 + Math.random() * 6) * dpr });
        }
        conf.forEach((q) => {
          q.y += q.vy * dt; q.x += q.vx * dt + Math.sin(t * 3 + q.r) * 0.6 * dpr; q.r += q.vr * dt;
          if (q.y > H) { q.y = -10; q.x = W * Math.random(); }
          c.save(); c.translate(q.x, q.y); c.rotate(q.r); c.fillStyle = q.col; c.fillRect(-q.s / 2, -q.s / 4, q.s, q.s / 2); c.restore();
        });
        if (lifted) Celebrate.title(c, W, H, dpr, t - 1.4, o.big || 'ŞAMPİYON!', o.year ? String(o.year) : '');
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    });
  },

  // Oyuncunun forması/kulübüyle tören
  champion(title, sub, intl) {
    const s = Game.state, p = s.player;
    let team;
    if (intl) {
      const col = NAT_COLORS[p.nation] || ['#c8102e', '#ffffff'];
      team = { id: p.nation, c1: col[0], c2: col[1], short: p.nation };
    } else team = Game.club() || { id: 'X', c1: '#c8102e', c2: '#ffffff', short: '' };
    const kit = Sprites.kit(team, false);
    return Celebrate.trophy({ kit, c1: team.c1, c2: team.c2, short: team.short, number: p.shirt, big: 'ŞAMPİYON!', title, sub, year: s.season.year });
  },
};
