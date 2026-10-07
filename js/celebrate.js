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
    SocialArt.blurred(bg.getContext('2d'), W, H, 2 * dpr, (b) => {
      if (Sprites.surface === 'sand') { Sprites.sand(b, W, H); Sprites.street(b, W, H * 0.55, 16 * dpr); }
      else SocialArt.stadium(b, W, H, r, P, day);
    });
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
      if (typeof Sfx !== 'undefined') { setTimeout(() => { Sfx.play('fanfare'); Sfx.play('roar'); Sfx.buzz('success'); }, 1400); }
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

// Transfer sonrası: havalimanı karşılaması ve imza töreni (iki adımlı canvas sahnesi)
const Welcome = {
  show(o) {
    return new Promise((resolve) => {
      const s = Game.state, p = s.player;
      const club = o.club;
      const P = { c1: club.c1, c2: club.c2, short: club.short || '' };
      const kit = Sprites.kit(club, false);
      const casual = { shirt: '#1b1d22', alt: '#1b1d22', pattern: 'plain', shorts: '#2a3a5c', socks: '#f2f2f2' };
      const suit = { shirt: '#232733', alt: '#232733', pattern: 'plain', shorts: '#232733', socks: '#111' };
      const look = Sprites.look(7);
      const sur = (p.surname || p.name || '').toLocaleUpperCase('tr');
      const fans = Math.round((300 + (p.fame || 0) * 120 + Math.max(0, club.rating - 50) * 70) / 50) * 50;
      const el = document.createElement('div');
      el.className = 'cer-trophy wel';
      el.innerHTML = `<div class="ct-host"></div><div class="ct-foot"><b></b><small></small><button class="btn btn-big"></button></div>`;
      document.body.appendChild(el);
      const host = el.querySelector('.ct-host');
      const fb = el.querySelector('.ct-foot b'), fs = el.querySelector('.ct-foot small'), btn = el.querySelector('.ct-foot button');
      host.innerHTML = '';
      const cv = document.createElement('canvas'); cv.className = 'celeb-cv'; host.appendChild(cv);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const W = Math.round((host.clientWidth || 360) * dpr), H = Math.round((host.clientHeight || 480) * dpr);
      cv.width = W; cv.height = H;
      const c = cv.getContext('2d');
      const fig = (x, y, h, opt) => Sprites.figure(c, x, y, h, Object.assign({ facing: 'down', noShadow: true, t: 0 }, opt));
      const font = (px, w = 800, it = false) => `${it ? 'italic ' : ''}${w} ${Math.round(px)}px "Saira Condensed", "Arial Narrow", sans-serif`;
      // ekrana sığan başlık (uzun takım adları taşmasın)
      const ttl = (t, big, small, y) => {
        const a = Math.min(1, t * 4), pop = 1 + Math.max(0, 0.25 - t) * 1.6;
        c.save(); c.globalAlpha = a; c.textAlign = 'center'; c.textBaseline = 'middle';
        let fz = Math.min(W * 0.14, 58 * dpr) * pop;
        c.font = font(fz, 800, true);
        const mw = c.measureText(big).width;
        if (mw > W * 0.9) { fz *= (W * 0.9) / mw; c.font = font(fz, 800, true); }
        c.lineWidth = 6 * dpr; c.strokeStyle = 'rgba(0,0,0,0.55)'; c.strokeText(big, W / 2, y); c.fillStyle = '#ffcf3f'; c.fillText(big, W / 2, y);
        if (small) {
          c.font = `700 ${Math.round(16 * dpr)}px "Barlow Semi Condensed", "Segoe UI", sans-serif`;
          c.fillStyle = '#fff'; c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 4 * dpr;
          c.strokeText(small, W / 2, y + fz * 0.62 + 4 * dpr, W * 0.9); c.fillText(small, W / 2, y + fz * 0.62 + 4 * dpr, W * 0.9);
        }
        c.restore();
      };
      const contrast = Sprites.colorDist(P.c1, P.c2) < 90 ? (Sprites.colorDist(P.c1, '#ffffff') < 120 ? '#111' : '#fff') : P.c2;

      // ---------- 1. sahne: havalimanı ----------
      const crowd = [];
      for (let row = 0; row < 3; row++) {
        const n = 7 + row * 2;
        for (let i = 0; i < n; i++) {
          const side = i % 2 ? 1 : -1, k = Math.floor(i / 2);
          crowd.push({ row, x: 0.5 + side * (0.2 + k * (0.34 / (n / 2)) + row * 0.02) + (Math.random() - 0.5) * 0.04, ph: Math.random() * 6, L: Sprites.look(100 + row * 17 + i * 5), up: Math.random() < 0.55, scarf: Math.random() < 0.6 });
        }
      }
      crowd.sort((a, b) => a.row - b.row);
      const smoke = [];
      const flares = [[0.12, 1], [0.88, 2], [0.3, 0], [0.7, 0]].map(([x, r]) => ({ x, r }));
      const airport = (t) => {
        const g = c.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#060b18'); g.addColorStop(0.55, '#14223d'); g.addColorStop(1, '#0a1020');
        c.fillStyle = g; c.fillRect(0, 0, W, H);
        // cam cephe ve pist
        const wy = H * 0.1, wh = H * 0.28;
        const sky = c.createLinearGradient(0, wy, 0, wy + wh);
        sky.addColorStop(0, '#0b1a3a'); sky.addColorStop(1, '#3a4f7a');
        c.fillStyle = sky; c.fillRect(0, wy, W, wh);
        for (let i = 0; i < 18; i++) { c.fillStyle = i % 3 ? 'rgba(255,214,120,0.8)' : 'rgba(120,200,255,0.8)'; c.fillRect(((i * 97 + t * 8 * dpr) % (W + 40)) - 20, wy + wh * 0.86, 3 * dpr, 2 * dpr); }
        // uçak silüeti
        const px = ((t * 26 * dpr) % (W * 1.6)) - W * 0.3, py = wy + wh * 0.5 - t * 3 * dpr % (wh * 0.3);
        c.fillStyle = 'rgba(10,16,30,0.9)';
        c.beginPath(); c.ellipse(px, py, 46 * dpr, 7 * dpr, -0.08, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.moveTo(px - 6 * dpr, py); c.lineTo(px - 26 * dpr, py + 22 * dpr); c.lineTo(px - 14 * dpr, py + 22 * dpr); c.lineTo(px + 10 * dpr, py); c.fill();
        c.beginPath(); c.moveTo(px - 38 * dpr, py - 2 * dpr); c.lineTo(px - 48 * dpr, py - 18 * dpr); c.lineTo(px - 40 * dpr, py - 18 * dpr); c.lineTo(px - 30 * dpr, py - 3 * dpr); c.fill();
        SocialArt.glow(c, px + 44 * dpr, py, 10 * dpr, 'rgba(255,80,80,0.9)', (Math.sin(t * 8) + 1) / 2);
        c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = 3 * dpr;
        for (let i = 1; i < 6; i++) { c.beginPath(); c.moveTo((W * i) / 6, wy); c.lineTo((W * i) / 6, wy + wh); c.stroke(); }
        // geliş tabelası
        c.fillStyle = '#0d1422'; c.fillRect(W * 0.06, H * 0.025, W * 0.88, H * 0.06);
        c.fillStyle = '#ffd23f'; c.font = font(H * 0.034); c.textBaseline = 'middle'; c.textAlign = 'left';
        c.fillText('✈ GELİŞ', W * 0.09, H * 0.056);
        c.textAlign = 'right'; c.fillStyle = '#7ee0a3'; c.fillText('İNDİ', W * 0.91, H * 0.056);
        // otomatik kapı
        const dx = W * 0.5, dw = W * 0.3, dTop = H * 0.4, dBot = H * 0.62;
        SocialArt.glow(c, dx, (dTop + dBot) / 2, dw, 'rgba(200,230,255,0.35)');
        const open = U.clamp(t / 0.8, 0, 1) * dw * 0.28;
        c.fillStyle = 'rgba(180,215,255,0.18)'; c.fillRect(dx - dw / 2 - open, dTop, dw / 2, dBot - dTop); c.fillRect(dx + open, dTop, dw / 2, dBot - dTop);
        c.strokeStyle = 'rgba(220,235,255,0.5)'; c.lineWidth = 2 * dpr; c.strokeRect(dx - dw / 2, dTop, dw, dBot - dTop);
        // zemin
        const fl = c.createLinearGradient(0, dBot, 0, H);
        fl.addColorStop(0, '#1d2a44'); fl.addColorStop(1, '#0b1222');
        c.fillStyle = fl; c.fillRect(0, dBot, W, H - dBot);
        // oyuncu kapıdan yürüyerek gelir
        const k = U.clamp((t - 0.5) / 2.4, 0, 1), e = 1 - Math.pow(1 - k, 2);
        const ph = Math.min(H * 0.5, W * 0.62);
        const pH = ph * (0.42 + 0.5 * e), pY = dBot + (H * 0.86 - dBot) * e;
        const wave = k >= 1 ? 0.6 + Math.sin(t * 5) * 0.5 : 0;
        // bariyer şeridi
        c.fillStyle = '#c9ced8';
        [0.18, 0.82].forEach((x) => { c.fillRect(W * x - 3 * dpr, H * 0.66, 6 * dpr, H * 0.08); });
        c.strokeStyle = P.c1; c.lineWidth = 5 * dpr; c.beginPath(); c.moveTo(W * 0.18, H * 0.67); c.lineTo(W * 0.82, H * 0.67); c.stroke();
        // taraftarlar: atkılar, kollar havada; ortada oyuncu için koridor
        const drawFan = (f) => {
          const fh = ph * (0.5 + f.row * 0.16), fy = H * (0.74 + f.row * 0.1);
          const jump = Math.abs(Math.sin(t * 5 + f.ph)) * fh * 0.05;
          const x = W * f.x;
          if (Math.abs(x - W * 0.5) < W * (0.16 + f.row * 0.04)) return;
          fig(x, fy - jump, fh, { kit, look: f.L, dive: f.up ? 1 : 0, armA: f.up ? 0 : 0.3 + Math.sin(t * 6 + f.ph) * 0.3 });
          if (f.scarf && f.up) {
            const sy = fy - jump - fh * 1.16, sw = fh * 0.5, sh = fh * 0.07;
            c.save(); c.translate(x, sy); c.rotate(Math.sin(t * 4 + f.ph) * 0.12);
            c.fillStyle = P.c1; c.fillRect(-sw / 2, -sh / 2, sw, sh);
            c.fillStyle = P.c2; for (let i = 0; i < 5; i++) c.fillRect(-sw / 2 + (i + 0.3) * sw / 5, -sh / 2, sw / 14, sh);
            c.restore();
          }
        };
        crowd.filter((f) => f.row < 2).forEach(drawFan);
        fig(W * 0.5, pY, pH, { kit: casual, look, run: k < 1 ? t * 9 : 0, speed: k < 1 ? 0.6 : 0, armA: wave });
        crowd.filter((f) => f.row >= 2).forEach(drawFan);
        // meşaleler ve duman
        flares.forEach((f) => {
          const fy = H * (0.74 + f.r * 0.1) - ph * (0.5 + f.r * 0.16) * 1.15, fx = W * f.x;
          SocialArt.glow(c, fx, fy, 60 * dpr, 'rgba(255,60,40,0.9)', 0.55 + Math.random() * 0.25);
          SocialArt.glow(c, fx, fy, 16 * dpr, 'rgba(255,230,180,1)', 0.9);
          if (Math.random() < 0.5) smoke.push({ x: fx, y: fy, r: 10 * dpr, a: 0.35, vx: (Math.random() - 0.5) * 20 * dpr });
        });
        for (let i = smoke.length - 1; i >= 0; i--) {
          const q = smoke[i]; q.y -= 40 * dpr / 60; q.x += q.vx / 60; q.r += 0.6 * dpr; q.a -= 0.004;
          if (q.a <= 0) { smoke.splice(i, 1); continue; }
          c.fillStyle = `rgba(255,140,140,${q.a * 0.35})`; c.beginPath(); c.arc(q.x, q.y, q.r, 0, Math.PI * 2); c.fill();
        }
        // pankart
        const by = H * 0.355, bw = W * 0.9, bh = H * 0.055;
        c.save(); c.translate(W / 2, by); c.rotate(Math.sin(t * 2) * 0.012);
        c.fillStyle = P.c1; c.fillRect(-bw / 2, -bh / 2, bw, bh);
        c.fillStyle = P.c2; c.fillRect(-bw / 2, -bh / 2, bw, bh * 0.12); c.fillRect(-bw / 2, bh * 0.38, bw, bh * 0.12);
        c.fillStyle = contrast; c.font = font(bh * 0.62, 800, true); c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(`HOŞ GELDİN ${sur}!`, 0, 1, bw * 0.92);
        c.restore();
        Celebrate.flashes(c, W, H, t, 5);
        if (t > 3) ttl(t - 3, `${fans.toLocaleString('tr-TR')} TARAFTAR`, 'seni bekliyordu', H * 0.2);
      };

      // ---------- 2. sahne: imza töreni ----------
      const wall = document.createElement('canvas'); wall.width = SocialArt.W; wall.height = SocialArt.H;
      SocialArt.backdrop(wall.getContext('2d'), SocialArt.W, SocialArt.H, P, P.short || 'STARFOOT');
      const conf = [];
      let signT = -1;
      const sig = Array.from({ length: 26 }, (_, i) => [i / 25, Math.sin(i * 1.7) * 0.5 + Math.sin(i * 0.6) * 0.4]);
      const jersey = (x, y, w) => {
        const h = w * 1.05;
        c.save(); c.translate(x, y);
        c.fillStyle = kit.shirt;
        c.beginPath();
        c.moveTo(-w * 0.32, -h / 2); c.lineTo(-w * 0.5, -h * 0.36); c.lineTo(-w * 0.42, -h * 0.14); c.lineTo(-w * 0.32, -h * 0.2);
        c.lineTo(-w * 0.32, h / 2); c.lineTo(w * 0.32, h / 2); c.lineTo(w * 0.32, -h * 0.2); c.lineTo(w * 0.42, -h * 0.14); c.lineTo(w * 0.5, -h * 0.36); c.lineTo(w * 0.32, -h / 2);
        c.quadraticCurveTo(0, -h * 0.36, -w * 0.32, -h / 2); c.fill();
        c.fillStyle = kit.alt; c.fillRect(-w * 0.32, -h * 0.02, w * 0.64, h * 0.05);
        const [r0, g0, b0] = Sprites.hexRgb(kit.shirt); const tc = r0 * 0.299 + g0 * 0.587 + b0 * 0.114 > 160 ? '#111' : '#fff';
        c.fillStyle = tc; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.font = font(w * 0.13); c.fillText(sur.slice(0, 12), 0, -h * 0.25);
        c.font = font(w * 0.42); c.fillText(String(o.number || p.shirt), 0, h * 0.18);
        c.restore();
      };
      const signing = (t) => {
        // basın duvarını kaplayacak şekilde çiz
        const sc = Math.max(W / wall.width, H / wall.height);
        c.drawImage(wall, (W - wall.width * sc) / 2, (H - wall.height * sc) / 2, wall.width * sc, wall.height * sc);
        const v = c.createLinearGradient(0, 0, 0, H); v.addColorStop(0, 'rgba(0,0,0,0.25)'); v.addColorStop(0.5, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.5)');
        c.fillStyle = v; c.fillRect(0, 0, W, H);
        const deskY = H * 0.7, ph = Math.min(H * 0.55, W * 0.7);
        const st = signT >= 0 ? U.clamp((t - signT - 1.4) / 0.6, 0, 1) : 0;
        const rise = st * ph * 0.12;
        // başkan ve oyuncu (masanın arkasında)
        fig(W * 0.28, deskY + ph * 0.5 - rise, ph, { kit: suit, look: { skin: SKINS[1], hair: '#b9b9b9', style: 'short', beard: false } });
        fig(W * 0.72, deskY + ph * 0.5 - rise, ph, { kit: casual, look, armA: st > 0.5 ? 0.9 : 0 });
        if (st > 0) jersey(W * 0.5, deskY - ph * 0.62 - rise * 0.6 + (1 - st) * ph * 0.3, ph * 0.42 * (0.6 + 0.4 * st));
        // masa
        c.fillStyle = '#10141f'; c.fillRect(W * 0.04, deskY, W * 0.92, H - deskY);
        c.fillStyle = P.c1; c.fillRect(W * 0.04, deskY + H * 0.03, W * 0.92, H * 0.12);
        c.fillStyle = P.c2; c.fillRect(W * 0.04, deskY + H * 0.03, W * 0.92, 3 * dpr);
        c.fillStyle = contrast; c.font = font(H * 0.06, 800, true); c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(club.name.toLocaleUpperCase('tr'), W / 2, deskY + H * 0.09, W * 0.84);
        // mikrofonlar
        [0.36, 0.64].forEach((x) => { c.fillStyle = '#2b2f38'; c.fillRect(W * x - 2 * dpr, deskY - H * 0.06, 4 * dpr, H * 0.06); c.fillStyle = '#0a0a0a'; c.beginPath(); c.ellipse(W * x, deskY - H * 0.065, 6 * dpr, 9 * dpr, 0, 0, Math.PI * 2); c.fill(); });
        // sözleşme ve imza
        const cx = W * 0.5, cy = deskY + H * 0.005, cw = W * 0.24, chh = H * 0.02;
        c.fillStyle = '#f5f1e6'; c.beginPath(); c.moveTo(cx - cw / 2, cy); c.lineTo(cx + cw / 2, cy); c.lineTo(cx + cw * 0.56, cy + chh); c.lineTo(cx - cw * 0.56, cy + chh); c.fill();
        if (signT >= 0) {
          const k = U.clamp((t - signT) / 1.2, 0, 1);
          c.strokeStyle = '#1b3fa0'; c.lineWidth = 1.6 * dpr; c.beginPath();
          sig.slice(0, Math.max(1, Math.round(k * sig.length))).forEach(([u, vv], i) => { const x = cx - cw * 0.35 + u * cw * 0.7, y = cy + chh * 0.5 + vv * chh * 0.35; if (i) c.lineTo(x, y); else c.moveTo(x, y); });
          c.stroke();
          if (k < 1) { const [u, vv] = sig[Math.round(k * (sig.length - 1))]; c.fillStyle = '#d9b44a'; c.save(); c.translate(cx - cw * 0.35 + u * cw * 0.7, cy + chh * 0.5 + vv * chh * 0.35); c.rotate(-0.7); c.fillRect(0, -2 * dpr, 26 * dpr, 4 * dpr); c.restore(); }
          if (st >= 1 && !conf.length) {
            const cols = ['#ffd84a', '#ffffff', P.c1, P.c2];
            for (let i = 0; i < 180; i++) conf.push({ x: W * Math.random(), y: -H * Math.random() * 0.5, vy: (60 + Math.random() * 110) * dpr, vx: (Math.random() - 0.5) * 40 * dpr, r: Math.random() * 6, vr: (Math.random() - 0.5) * 8, col: cols[i % 4], s: (4 + Math.random() * 5) * dpr });
          }
        }
        Celebrate.flashes(c, W, H, t, signT >= 0 && t - signT > 1.2 ? 7 : 2);
        conf.forEach((q) => {
          q.y += q.vy / 60; q.x += q.vx / 60; q.r += q.vr / 60;
          if (q.y > H) { q.y = -10; q.x = W * Math.random(); }
          c.save(); c.translate(q.x, q.y); c.rotate(q.r); c.fillStyle = q.col; c.fillRect(-q.s / 2, -q.s / 4, q.s, q.s / 2); c.restore();
        });
        if (st >= 1) ttl(t - signT - 2, 'İMZALAR ATILDI!', `${club.name} · ${o.years || 1} yıl`, H * 0.1);
      };

      let step = 0, t = 0, last = performance.now(), raf;
      const setFoot = () => {
        if (step === 0) {
          fb.textContent = 'Havalimanı Karşılaması';
          fs.textContent = `${fans.toLocaleString('tr-TR')} ${club.name} taraftarı seni karşılamaya geldi!`;
          btn.textContent = 'İmza Törenine Geç';
        } else if (signT < 0) {
          fb.textContent = 'İmza Töreni';
          fs.textContent = `${o.years || 1} yıllık sözleşme · Haftalık ${U.money(o.wage || 0)}${o.feeText ? ' · ' + o.feeText : ''}`;
          btn.textContent = 'İmzayı At';
        } else {
          fb.textContent = `${o.number || p.shirt} numara artık senin`;
          fs.textContent = `${club.name} formasıyla basına poz verdin.`;
          btn.textContent = 'Kulübe Başla';
        }
      };
      setFoot();
      if (typeof Sfx !== 'undefined') { Sfx.crowd(true); Sfx.play('cheer'); }
      const close = () => { cancelAnimationFrame(raf); el.remove(); if (typeof Sfx !== 'undefined') Sfx.crowd(false); resolve(); };
      btn.onclick = () => {
        if (step === 0) { step = 1; t = 0; setFoot(); return; }
        if (signT < 0) { signT = t; setFoot(); btn.disabled = true; if (typeof Sfx !== 'undefined') { [1300, 1500, 1750, 2100].forEach((d) => setTimeout(() => Sfx.play('shutter'), d)); setTimeout(() => { Sfx.play('cheer'); Sfx.buzz('success'); }, 1400); } setTimeout(() => { btn.disabled = false; }, 1800); return; }
        close();
      };
      const frame = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000); t += dt; last = now;
        if (step === 0) airport(t); else signing(t);
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    });
  },
};
