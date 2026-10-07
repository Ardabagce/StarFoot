// Sosyal medya gönderi görselleri: fotoğraf hissi veren canvas sahneleri
// (stadyum ışıkları, alan derinliği, kalabalık, renk filtresi, vinyet ve gren)

const SocialArt = {
  W: 540,
  H: 675,
  cache: new Map(),

  rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },

  // Gönderinin sahnesi metne ve türe göre belirlenir
  sceneFor(kind, text) {
    const t = text || '';
    if (kind === 'sponsor') return 'sponsor';
    if (kind === 'goal') return /Mahalle/.test(t) ? 'street' : 'goal';
    if (kind === 'motm') return 'motm';
    if (kind === 'trophy') return /kaptan/i.test(t) ? 'captain' : /Gelecek sezon/.test(t) ? 'europe' : 'trophy';
    if (kind === 'transfer') return 'transfer';
    if (kind === 'life') {
      if (/araba|SUV|Araba/i.test(t)) return 'car';
      if (/yat|Ada|tekne/i.test(t)) return 'yacht';
      if (/gitar|müzik|Stüdyo|Podcast|Kulaklık/i.test(t)) return 'music';
      if (/Villa|Çatı/i.test(t)) return 'home';
      if (/Köpek/i.test(t)) return 'pet';
      if (/çekim/i.test(t)) return 'studio';
      return 'city';
    }
    if (/Efsane/.test(t)) return 'legend';
    if (/kamp/i.test(t)) return 'camp';
    if (/numara/i.test(t)) return 'number';
    return 'training';
  },

  locFor(scene, club) {
    const cityByCC = { TR: 'İstanbul', ENG: 'Londra', ESP: 'Madrid', GER: 'Münih', ITA: 'Milano', FRA: 'Paris', NED: 'Amsterdam', POR: 'Lizbon', BRA: 'Rio de Janeiro', ARG: 'Buenos Aires', BEL: 'Brüksel', SCO: 'Glazgov', USA: 'Maymi', MEX: 'Mexiko', KSA: 'Riyad', JPN: 'Tokyo', AUT: 'Viyana', SUI: 'Zürih', GRE: 'Atina', DEN: 'Kopenhag', CRO: 'Zagreb', CZE: 'Prag', POL: 'Varşova', UKR: 'Kiev' };
    const city = club ? cityByCC[LEAGUE_CC[club.league]] || 'İstanbul' : 'Mahalle';
    const n = club ? club.name : '';
    return {
      goal: `${n} Stadyumu`, motm: `${n} Stadyumu`, trophy: `${n} Stadyumu`, europe: `${n} Stadyumu`, captain: `${n} Stadyumu`,
      transfer: `${n} Basın Salonu`, training: `${n} Antrenman Merkezi`, number: `${n} Tesisleri`, legend: `${n} Tesisleri`,
      camp: 'Milli Takım Kampı', street: 'Mahalle sahası', yacht: 'Akdeniz', car: city, home: city, music: city, pet: city, studio: city, city,
    }[scene] || city;
  },

  // Gönderinin görseli (önbellekli, 540x675)
  get(post) {
    const key = post.id + '|' + post.seed;
    if (SocialArt.cache.has(key)) return SocialArt.cache.get(key);
    const c = document.createElement('canvas');
    c.width = SocialArt.W; c.height = SocialArt.H;
    try { SocialArt.draw(c.getContext('2d'), post); } catch (e) { console.error(e); }
    SocialArt.cache.set(key, c);
    if (SocialArt.cache.size > 40) SocialArt.cache.delete(SocialArt.cache.keys().next().value);
    return c;
  },

  // Sayfadaki tüm gönderi canvas'larını çizer (crop: kare ızgara için ortadan kırpar)
  paint(root) {
    const so = Game.p && Game.p.social;
    if (!so) return;
    U.$$('canvas[data-pid]', root || document).forEach((cv) => {
      const post = so.posts.find((x) => String(x.id) === cv.dataset.pid);
      if (!post) return;
      const img = SocialArt.get(post);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(60, Math.round(cv.clientWidth || 300));
      const square = cv.dataset.crop === '1';
      const h = square ? w : Math.round(w * 1.25);
      cv.width = w * dpr; cv.height = h * dpr;
      const c = cv.getContext('2d');
      const sy = square ? (SocialArt.H - SocialArt.W) * 0.35 : 0;
      c.drawImage(img, 0, sy, SocialArt.W, square ? SocialArt.W : SocialArt.H, 0, 0, cv.width, cv.height);
    });
    U.$$('canvas[data-story]', root || document).forEach((cv) => SocialArt.storyAvatar(cv));
  },

  // Gündemdeki yıldızın hikâye halkası içindeki portresi
  storyAvatar(cv) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const S = 60 * dpr;
    cv.width = S; cv.height = S;
    const c = cv.getContext('2d');
    const name = cv.dataset.story;
    const w = Game.state.world;
    const L = (w.legends || []).find((x) => x.n === name);
    const club = (L && w.clubs[L.club]) || { id: 'X', c1: '#2a6fdb', c2: '#ffffff' };
    let seed = 0; for (const ch of name) seed = (seed * 31 + ch.charCodeAt(0)) % 9973;
    const g = c.createLinearGradient(0, 0, 0, S);
    g.addColorStop(0, Sprites.shade(club.c1, -0.35)); g.addColorStop(1, '#0b1020');
    c.fillStyle = g; c.fillRect(0, 0, S, S);
    Sprites.figure(c, S * 0.5, S * 1.9, S * 1.75, { kit: Sprites.kit(club, false), look: Sprites.look(seed), facing: 'down', noShadow: true, t: 0 });
  },

  // ---------- çizim yardımcıları ----------
  noise: null,
  grain(c, W, H, a) {
    if (!SocialArt.noise) {
      const n = document.createElement('canvas'); n.width = n.height = 128;
      const nc = n.getContext('2d'), d = nc.createImageData(128, 128);
      for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
      nc.putImageData(d, 0, 0);
      SocialArt.noise = n;
    }
    c.save(); c.globalAlpha = a; c.globalCompositeOperation = 'overlay';
    c.fillStyle = c.createPattern(SocialArt.noise, 'repeat'); c.fillRect(0, 0, W, H);
    c.restore();
  },
  glow(c, x, y, r, col, a = 1) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.save(); c.globalAlpha = a; c.globalCompositeOperation = 'lighter'; c.fillStyle = g;
    c.fillRect(x - r, y - r, r * 2, r * 2); c.restore();
  },
  // Figürü ayrı katmanda çizer: üstten ışık, alttan gölge ve yere düşen yumuşak gölge
  lit(c, fn) {
    const W = SocialArt.W, H = SocialArt.H;
    const L = document.createElement('canvas'); L.width = W; L.height = H;
    const l = L.getContext('2d');
    fn(l);
    l.globalCompositeOperation = 'source-atop';
    const g = l.createLinearGradient(W * 0.2, 0, W * 0.8, H);
    g.addColorStop(0, 'rgba(255,246,228,0.22)'); g.addColorStop(0.45, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.38)');
    l.fillStyle = g; l.fillRect(0, 0, W, H);
    const v = l.createLinearGradient(0, H * 0.3, 0, H);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.25)');
    l.fillStyle = v; l.fillRect(0, 0, W, H);
    c.save();
    c.shadowColor = 'rgba(0,0,0,0.5)'; c.shadowBlur = 26; c.shadowOffsetX = 8; c.shadowOffsetY = 10;
    c.drawImage(L, 0, 0);
    c.restore();
  },
  rgba(hex, a) { const [r, g, b] = Sprites.hexRgb(hex.startsWith('#') ? hex : '#888888'); return `rgba(${r},${g},${b},${a})`; },
  // Arka planı ayrı katmanda çizip hafif bulanıklaştırır (alan derinliği)
  blurred(c, W, H, px, fn) {
    const b = document.createElement('canvas'); b.width = W; b.height = H;
    fn(b.getContext('2d'));
    if (typeof c.filter === 'string') { c.filter = `blur(${px}px)`; c.drawImage(b, 0, 0); c.filter = 'none'; }
    else c.drawImage(b, 0, 0);
  },

  // Gece stadyumu: projektörler, tribün kalabalığı, LED panolar, çim
  stadium(c, W, H, r, P, day) {
    const sky = c.createLinearGradient(0, 0, 0, H * 0.4);
    if (day) { sky.addColorStop(0, '#5f9ee6'); sky.addColorStop(1, '#bcd9f5'); }
    else { sky.addColorStop(0, '#02040b'); sky.addColorStop(1, '#0d1838'); }
    c.fillStyle = sky; c.fillRect(0, 0, W, H);
    // çatı ve tribün
    c.fillStyle = day ? '#3a4150' : '#0a0d16';
    c.beginPath(); c.moveTo(0, H * 0.1); c.lineTo(W, H * 0.06); c.lineTo(W, H * 0.13); c.lineTo(0, H * 0.17); c.fill();
    c.fillStyle = day ? '#4b5262' : '#151a28';
    c.fillRect(0, H * 0.15, W, H * 0.43);
    // kalabalık: uzak sıralar küçük ve koyu
    const cols = [P.c1, P.c1, P.c1, P.c2, '#1c1f26', '#2c3140', '#e8d2b8', '#8a5a3b'];
    for (let y = H * 0.16; y < H * 0.56; y += 6.5) {
      const k = (y - H * 0.16) / (H * 0.4);
      const sz = 2 + k * 2.6, step = 4.6 + k * 3.4;
      if (Math.abs(y - H * 0.35) < 4) { c.fillStyle = day ? '#2b303c' : '#0b0e16'; c.fillRect(0, y - 2, W, 7); continue; }
      for (let x = (r() * step); x < W; x += step * (0.8 + r() * 0.4)) {
        c.fillStyle = cols[Math.floor(r() * cols.length)];
        c.globalAlpha = (day ? 0.75 : 0.45) + k * 0.5;
        c.fillRect(x, y + r() * 2, sz, sz * 1.5);
        if (r() < 0.05) { c.fillStyle = '#ffffff'; c.globalAlpha = 0.9; c.fillRect(x, y - sz, 1.5, 1.5); }
      }
    }
    c.globalAlpha = 1;
    // bayraklar / pankart
    c.fillStyle = P.c1; c.fillRect(W * (0.1 + r() * 0.2), H * 0.39, W * 0.22, H * 0.05);
    c.fillStyle = P.c2; c.fillRect(W * (0.6 + r() * 0.1), H * 0.4, W * 0.2, H * 0.045);
    // LED panolar
    const ly = H * 0.555;
    const lg = c.createLinearGradient(0, ly, 0, ly + H * 0.045);
    lg.addColorStop(0, Sprites.shade(P.c1, 0.25)); lg.addColorStop(1, Sprites.shade(P.c1, -0.3));
    c.fillStyle = lg; c.fillRect(0, ly, W, H * 0.045);
    c.font = `800 ${Math.round(H * 0.028)}px "Saira Condensed", "Arial Narrow", sans-serif`; c.textBaseline = 'middle';
    c.fillStyle = Sprites.colorDist(P.c1, '#ffffff') < 90 ? '#111' : '#fff';
    for (let x = -r() * 120; x < W; x += 150) c.fillText(x / 150 % 2 < 1 ? (P.short || 'STARFOOT') : 'STARFOOT', x, ly + H * 0.024);
    // çim: perspektifli biçme şeritleri
    const py = H * 0.6;
    for (let i = 0; i < 9; i++) {
      const y0 = py + (H - py) * Math.pow(i / 9, 1.6), y1 = py + (H - py) * Math.pow((i + 1) / 9, 1.6);
      c.fillStyle = i % 2 ? (day ? '#3c9a45' : '#1f6e34') : (day ? '#348d3e' : '#1a612e');
      c.fillRect(0, y0, W, y1 - y0 + 1);
    }
    c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(0, py + H * 0.07); c.lineTo(W, py + H * 0.05); c.stroke();
    if (!day) {
      // projektör ışıkları
      [[W * 0.1, H * 0.05], [W * 0.9, H * 0.03]].forEach(([x, y]) => {
        SocialArt.glow(c, x, y, W * 0.45, 'rgba(255,248,225,0.55)');
        c.fillStyle = '#fffbe9';
        for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) c.fillRect(x - 18 + i * 9, y - 10 + j * 7, 6, 4);
      });
      const pg = c.createLinearGradient(0, py, 0, H);
      pg.addColorStop(0, 'rgba(255,250,220,0.12)'); pg.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = pg; c.fillRect(0, py, W, H - py);
    }
  },

  // Basın duvarı: tekrar eden kulüp logosu ve yazısı
  backdrop(c, W, H, P, label) {
    const base = Sprites.colorDist(P.c1, '#ffffff') < 80 ? '#e9ecf2' : '#f2f3f6';
    c.fillStyle = base; c.fillRect(0, 0, W, H);
    c.font = `800 ${Math.round(H * 0.03)}px "Saira Condensed", "Arial Narrow", sans-serif`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 5; col++) {
        const x = col * 130 + (row % 2) * 65, y = row * 82 + 30;
        if ((row + col) % 2) {
          c.fillStyle = P.c1; c.beginPath(); c.arc(x, y, 20, 0, Math.PI * 2); c.fill();
          c.fillStyle = P.c2; c.beginPath(); c.arc(x, y, 12, 0, Math.PI * 2); c.fill();
          c.fillStyle = P.c1; c.font = `800 ${Math.round(H * 0.018)}px "Saira Condensed", sans-serif`; c.fillText((P.short || '').slice(0, 3), x, y + 1);
        } else {
          c.fillStyle = Sprites.colorDist(P.c1, base) < 60 ? '#1d2433' : P.c1;
          c.font = `800 ${Math.round(H * 0.026)}px "Saira Condensed", sans-serif`;
          c.fillText(label, x, y);
        }
      }
    }
    c.textAlign = 'left';
  },

  trophyCup(c, x, y, s) {
    const g = c.createLinearGradient(x - s, 0, x + s, 0);
    g.addColorStop(0, '#8a6212'); g.addColorStop(0.35, '#ffe9a0'); g.addColorStop(0.55, '#f0b92c'); g.addColorStop(1, '#7a520c');
    c.fillStyle = g; c.strokeStyle = g; c.lineWidth = s * 0.14;
    c.beginPath(); c.moveTo(x - s * 0.7, y - s); c.quadraticCurveTo(x - s * 0.75, y + s * 0.2, x, y + s * 0.35); c.quadraticCurveTo(x + s * 0.75, y + s * 0.2, x + s * 0.7, y - s); c.closePath(); c.fill();
    c.beginPath(); c.arc(x - s * 0.72, y - s * 0.55, s * 0.32, Math.PI * 0.5, Math.PI * 1.5); c.stroke();
    c.beginPath(); c.arc(x + s * 0.72, y - s * 0.55, s * 0.32, Math.PI * 1.5, Math.PI * 0.5); c.stroke();
    c.fillRect(x - s * 0.12, y + s * 0.3, s * 0.24, s * 0.5);
    c.fillRect(x - s * 0.45, y + s * 0.78, s * 0.9, s * 0.22);
    SocialArt.glow(c, x - s * 0.25, y - s * 0.55, s * 0.6, 'rgba(255,255,230,0.6)');
  },

  confetti(c, W, H, r, P) {
    const cols = ['#ffd84a', '#ffffff', P.c1, P.c2, '#ffb02e'];
    for (let i = 0; i < 160; i++) {
      c.save(); c.translate(r() * W, r() * H * 0.85); c.rotate(r() * Math.PI);
      c.fillStyle = cols[Math.floor(r() * cols.length)]; c.globalAlpha = 0.6 + r() * 0.4;
      const s = 3 + r() * 7; c.fillRect(-s / 2, -s / 4, s, s / 2); c.restore();
    }
  },

  bokeh(c, W, H, r, cols, n, y0 = 0, y1 = 1) {
    for (let i = 0; i < n; i++) {
      const x = r() * W, y = H * (y0 + r() * (y1 - y0)), rad = 8 + r() * 34;
      SocialArt.glow(c, x, y, rad, cols[Math.floor(r() * cols.length)], 0.35 + r() * 0.4);
    }
  },

  casual(r, P) {
    const tops = ['#f4f4f4', '#1b1d22', '#2b3a55', '#7a8597', '#c9b28c', P.c1];
    const shirt = tops[Math.floor(r() * tops.length)];
    return { shirt, alt: shirt, pattern: 'plain', shorts: r() < 0.5 ? '#2a3a5c' : '#1b1d22', socks: '#f2f2f2' };
  },

  car(c, x, y, w, col) {
    const h = w * 0.28;
    const g = c.createLinearGradient(0, y - h, 0, y);
    g.addColorStop(0, Sprites.shade(col, 0.35)); g.addColorStop(0.5, col); g.addColorStop(1, Sprites.shade(col, -0.45));
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(x, y - h * 0.25); c.quadraticCurveTo(x + w * 0.02, y - h * 0.6, x + w * 0.22, y - h * 0.62);
    c.quadraticCurveTo(x + w * 0.38, y - h * 1.05, x + w * 0.6, y - h * 0.98);
    c.quadraticCurveTo(x + w * 0.8, y - h * 0.7, x + w, y - h * 0.5);
    c.lineTo(x + w, y - h * 0.12); c.lineTo(x, y - h * 0.08); c.closePath(); c.fill();
    c.fillStyle = 'rgba(20,28,40,0.85)';
    c.beginPath(); c.moveTo(x + w * 0.3, y - h * 0.66); c.quadraticCurveTo(x + w * 0.42, y - h * 0.95, x + w * 0.58, y - h * 0.9); c.lineTo(x + w * 0.72, y - h * 0.64); c.closePath(); c.fill();
    SocialArt.glow(c, x + w * 0.45, y - h * 0.85, w * 0.12, 'rgba(255,255,255,0.5)');
    [[0.2, 0], [0.8, 0]].forEach(([k]) => {
      c.fillStyle = '#0d0f13'; c.beginPath(); c.arc(x + w * k, y - h * 0.08, h * 0.3, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#9aa3b0'; c.beginPath(); c.arc(x + w * k, y - h * 0.08, h * 0.16, 0, Math.PI * 2); c.fill();
    });
    c.fillStyle = '#ffe9b0'; c.fillRect(x + w * 0.95, y - h * 0.42, w * 0.04, h * 0.1);
  },

  // ---------- sahne ----------
  draw(c, post) {
    const W = SocialArt.W, H = SocialArt.H;
    const r = SocialArt.rng(post.seed || 7);
    const p = Game.p;
    const club = (post.cid && Game.state.world.clubs[post.cid]) || (Game.inStreet() ? null : Game.club());
    const P = { c1: post.c1 || (club ? club.c1 : '#2a6fdb'), c2: post.c2 || (club ? club.c2 : '#ffffff'), short: post.short || (club ? club.short : '') };
    const kit = post.cid || club ? Sprites.kit({ id: post.cid || (club && club.id), c1: P.c1, c2: P.c2 }, false) : { shirt: P.c1, alt: P.c2, pattern: 'plain', shorts: P.c2, socks: P.c1 };
    const look = Sprites.look(post.lookSeed || 7);
    const num = post.num || p.shirt;
    const scene = post.scene || SocialArt.sceneFor(post.kind, post.text);
    const fig = (sx, sy, h, o) => SocialArt.lit(c, (l) => Sprites.figure(l, sx, sy, h, Object.assign({ kit, look, facing: 'down', noShadow: true, t: 0 }, o)));
    let tone = 'warm';

    if (['goal', 'trophy', 'europe', 'captain', 'number'].includes(scene)) {
      const day = scene === 'number' ? r() < 0.6 : r() < 0.15;
      SocialArt.blurred(c, W, H, 2.5, (b) => {
        SocialArt.stadium(b, W, H, r, P, day);
        if (scene === 'goal') {
          // arkadan koşan takım arkadaşları
          const mk = (x, s) => Sprites.figure(b, x, H * 0.93, H * 0.42, { kit, look: Sprites.look(s), facing: 'down', dive: 1, noShadow: true, t: 0 });
          mk(W * 0.12, 3); mk(W * 0.9, 11);
        }
      });
      tone = day ? 'none' : 'cool';
    }

    if (scene === 'goal') {
      const back = r() < 0.55;
      SocialArt.glow(c, W * 0.5, H * 0.45, W * 0.5, 'rgba(255,245,215,0.25)');
      fig(W * (0.46 + r() * 0.08), H * 1.06, H * 0.8, { facing: back ? 'up' : 'down', dive: 1, number: num });
    } else if (scene === 'trophy') {
      SocialArt.glow(c, W * 0.5, H * 0.2, W * 0.45, 'rgba(255,215,120,0.35)');
      const h = H * 0.72, sx = W * 0.5, sy = H * 1.02;
      fig(sx, sy, h, { dive: 1, number: num });
      SocialArt.trophyCup(c, sx, sy - h * 1.2, h * 0.17);
      SocialArt.confetti(c, W, H, r, P);
      tone = 'warm';
    } else if (scene === 'europe' || scene === 'captain') {
      SocialArt.glow(c, W * 0.5, H * 0.45, W * 0.45, 'rgba(255,245,215,0.22)');
      fig(W * 0.5, H * 1.1, H * 0.85, { number: num });
      if (scene === 'captain') { c.fillStyle = '#ffd84a'; c.fillRect(W * 0.5 - H * 0.2, H * 0.52, H * 0.075, H * 0.035); }
    } else if (scene === 'number') {
      fig(W * 0.5, H * 1.2, H * 0.95, { facing: 'up', number: num });
    } else if (scene === 'sponsor') {
      // reklam çekimi: marka duvarı, ürünle poz
      SocialArt.backdrop(c, W, H, P, (P.short || 'MARKA').toLocaleUpperCase('tr'));
      SocialArt.glow(c, W * 0.15, H * 0.2, W * 0.4, 'rgba(255,255,255,0.7)');
      const cas = SocialArt.casual(r, P);
      const h = H * 0.8, sx = W * 0.45, sy = H * 1.08;
      SocialArt.lit(c, (l) => Sprites.figure(l, sx, sy, h, { kit: cas, look, facing: 'down', noShadow: true, t: 0, armA: 0.5 }));
      const px = sx + h * 0.32, py = sy - h * 0.62;
      c.save(); c.shadowColor = 'rgba(0,0,0,0.4)'; c.shadowBlur = 16;
      const b = post.brand;
      if (b === 'boot') { c.fillStyle = P.c1; c.beginPath(); c.ellipse(px, py, h * 0.11, h * 0.04, -0.2, 0, Math.PI * 2); c.fill(); c.fillStyle = P.c2; c.fillRect(px - h * 0.05, py - h * 0.02, h * 0.1, h * 0.012); }
      else if (b === 'drink') { c.fillStyle = P.c1; c.fillRect(px - h * 0.03, py - h * 0.08, h * 0.06, h * 0.14); c.fillStyle = P.c2; c.fillRect(px - h * 0.03, py - h * 0.03, h * 0.06, h * 0.03); }
      else if (b === 'watch') { c.fillStyle = '#c9a063'; c.beginPath(); c.arc(px, py, h * 0.045, 0, Math.PI * 2); c.fill(); c.fillStyle = '#111'; c.beginPath(); c.arc(px, py, h * 0.032, 0, Math.PI * 2); c.fill(); }
      else if (b === 'car') { SocialArt.car(c, W * 0.52, H * 0.98, W * 0.46, P.c1); }
      else { c.fillStyle = '#111'; c.fillRect(px - h * 0.035, py - h * 0.065, h * 0.07, h * 0.13); c.fillStyle = P.c2; c.fillRect(px - h * 0.028, py - h * 0.055, h * 0.056, h * 0.1); }
      c.restore();
      c.font = `800 ${Math.round(H * 0.05)}px "Saira Condensed", sans-serif`; c.textAlign = 'right'; c.fillStyle = P.c1;
      c.fillText((P.short || '').toLocaleUpperCase('tr'), W * 0.95, H * 0.1); c.textAlign = 'left';
      tone = 'none';
    } else if (scene === 'motm' || scene === 'transfer') {
      SocialArt.backdrop(c, W, H, P, scene === 'motm' ? 'MAÇIN OYUNCUSU' : (P.short || 'STARFOOT'));
      // fotoğrafçı flaşları
      SocialArt.bokeh(c, W, H, r, ['rgba(255,255,255,0.9)'], 4, 0.1, 0.5);
      const h = H * 0.78, sx = W * 0.5, sy = H * 1.08;
      if (scene === 'transfer') {
        fig(sx, sy, h, { dive: 1, number: num });
        const hy = sy - h * 1.13;
        const sw = h * 0.62, sh = h * 0.085;
        c.fillStyle = P.c1; c.fillRect(sx - sw / 2, hy - sh / 2, sw, sh);
        c.fillStyle = P.c2; for (let i = 0; i < 6; i++) c.fillRect(sx - sw / 2 + i * sw / 6 + sw / 24, hy - sh / 2, sw / 24, sh);
        c.fillStyle = P.c1; c.fillRect(sx - sw * 0.28, hy - sh * 0.4, sw * 0.56, sh * 0.8);
        c.font = `800 ${Math.round(sh * 0.62)}px "Saira Condensed", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = Sprites.colorDist(P.c1, P.c2) < 90 ? '#fff' : P.c2; c.fillText((P.short || '').toLocaleUpperCase('tr'), sx, hy + 1); c.textAlign = 'left';
      } else {
        fig(sx, sy, h, { number: num });
        SocialArt.trophyCup(c, sx - h * 0.02, sy - h * 0.62, h * 0.08);
      }
      tone = 'none';
    } else if (scene === 'training' || scene === 'camp' || scene === 'legend') {
      SocialArt.blurred(c, W, H, 2, (b) => {
        const sky = b.createLinearGradient(0, 0, 0, H * 0.5);
        sky.addColorStop(0, '#6aa8ea'); sky.addColorStop(1, '#d7ecfb');
        b.fillStyle = sky; b.fillRect(0, 0, W, H);
        for (let i = 0; i < 5; i++) SocialArt.glow(b, r() * W, H * (0.05 + r() * 0.2), 40 + r() * 60, 'rgba(255,255,255,0.5)');
        b.fillStyle = '#2f5b33';
        for (let x = 0; x < W; x += 26) { b.beginPath(); b.arc(x, H * 0.43, 24 + r() * 16, 0, Math.PI * 2); b.fill(); }
        b.fillStyle = '#25472a'; b.fillRect(0, H * 0.43, W, H * 0.04);
        b.strokeStyle = 'rgba(40,50,60,0.6)'; b.lineWidth = 1;
        for (let x = 0; x < W; x += 12) { b.beginPath(); b.moveTo(x, H * 0.4); b.lineTo(x, H * 0.47); b.stroke(); }
        for (let i = 0; i < 8; i++) {
          const y0 = H * 0.47 + (H * 0.53) * Math.pow(i / 8, 1.5), y1 = H * 0.47 + (H * 0.53) * Math.pow((i + 1) / 8, 1.5);
          b.fillStyle = i % 2 ? '#4caf50' : '#43a047'; b.fillRect(0, y0, W, y1 - y0 + 1);
        }
        for (let i = 0; i < 6; i++) {
          const x = W * (0.08 + i * 0.17), y = H * (0.55 + (i % 2) * 0.05);
          b.fillStyle = '#ff7a1a'; b.beginPath(); b.moveTo(x, y - 18); b.lineTo(x - 10, y); b.lineTo(x + 10, y); b.fill();
        }
      });
      if (scene === 'legend') {
        const old = { shirt: '#1d2433', alt: '#1d2433', pattern: 'plain', shorts: '#1d2433', socks: '#f2f2f2' };
        SocialArt.lit(c, (l) => Sprites.figure(l, W * 0.66, H * 1.1, H * 0.82, { kit: old, look: Object.assign(Sprites.look(23), { hair: '#bfbfbf' }), facing: 'down', noShadow: true, t: 0 }));
        fig(W * 0.36, H * 1.12, H * 0.82, { number: num });
      } else {
        const h = H * 0.7, sx = W * 0.48, sy = H * 0.98;
        fig(sx, sy, h, { number: num });
        Sprites.ball(c, sx + h * 0.18, sy - h * 0.04, h * 0.055, 0.6, Sprites.curBall || BALL_STYLES.classic);
      }
      tone = 'warm';
    } else if (scene === 'street') {
      c.fillStyle = '#7d7468'; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 9; i++) for (let j = 0; j < 7; j++) { c.fillStyle = (i + j) % 2 ? '#857b6e' : '#776e62'; c.fillRect(j * 80 + (i % 2) * 40, i * 34, 78, 32); }
      ['#e63973', '#2fbf71', '#4fb3ff', '#ffcf3f'].forEach((col) => SocialArt.glow(c, r() * W, H * (0.1 + r() * 0.3), 60 + r() * 50, SocialArt.rgba(col, 0.5)));
      c.fillStyle = '#4a4a4d'; c.fillRect(0, H * 0.58, W, H * 0.42);
      c.strokeStyle = '#eee'; c.lineWidth = 6; c.strokeRect(W * 0.62, H * 0.38, W * 0.32, H * 0.2);
      fig(W * 0.36, H * 1.0, H * 0.72, {});
      Sprites.ball(c, W * 0.52, H * 0.96, H * 0.04, 0.3, BALL_STYLES.street);
      tone = 'warm';
    } else {
      // yaşam sahneleri
      const cas = SocialArt.casual(r, P);
      const person = (sx, sy, h, o) => SocialArt.lit(c, (l) => Sprites.figure(l, sx, sy, h, Object.assign({ kit: cas, look, facing: 'down', noShadow: true, t: 0 }, o)));
      if (scene === 'car') {
        const sky = c.createLinearGradient(0, 0, 0, H * 0.6);
        sky.addColorStop(0, '#3b2a6b'); sky.addColorStop(0.6, '#ff7e5f'); sky.addColorStop(1, '#ffc477');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);
        SocialArt.glow(c, W * 0.7, H * 0.5, W * 0.4, 'rgba(255,200,120,0.6)');
        c.fillStyle = '#2a1f3d';
        for (let x = 0; x < W; x += 34) { const bh = 40 + r() * 140; c.fillRect(x, H * 0.58 - bh, 30, bh); }
        c.fillStyle = '#2b2d33'; c.fillRect(0, H * 0.58, W, H * 0.42);
        c.fillStyle = 'rgba(255,190,120,0.25)'; c.fillRect(0, H * 0.58, W, 6);
        SocialArt.car(c, W * 0.04, H * 0.9, W * 0.7, r() < 0.5 ? '#c8102e' : r() < 0.5 ? '#1b1d22' : '#e9e9ec');
        person(W * 0.82, H * 0.98, H * 0.66, {});
      } else if (scene === 'yacht') {
        const sky = c.createLinearGradient(0, 0, 0, H * 0.45);
        sky.addColorStop(0, '#2f8fe0'); sky.addColorStop(1, '#bfe4ff');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);
        SocialArt.glow(c, W * 0.8, H * 0.12, W * 0.35, 'rgba(255,250,220,0.8)');
        const sea = c.createLinearGradient(0, H * 0.45, 0, H);
        sea.addColorStop(0, '#1e88c8'); sea.addColorStop(1, '#0b4f7a');
        c.fillStyle = sea; c.fillRect(0, H * 0.45, W, H * 0.55);
        c.fillStyle = 'rgba(255,255,255,0.35)';
        for (let i = 0; i < 60; i++) c.fillRect(r() * W, H * (0.46 + r() * 0.5), 10 + r() * 30, 2);
        c.fillStyle = '#f7f7f7';
        c.beginPath(); c.moveTo(W * 0.05, H * 0.5); c.lineTo(W * 0.62, H * 0.5); c.lineTo(W * 0.52, H * 0.57); c.lineTo(W * 0.1, H * 0.57); c.fill();
        c.fillRect(W * 0.15, H * 0.45, W * 0.3, H * 0.05);
        c.fillStyle = '#1b2a3a'; c.fillRect(W * 0.18, H * 0.46, W * 0.24, H * 0.02);
        person(W * 0.68, H * 1.08, H * 0.78, {});
      } else if (scene === 'home') {
        const sky = c.createLinearGradient(0, 0, 0, H * 0.5);
        sky.addColorStop(0, '#1d2b5a'); sky.addColorStop(1, '#f39c6b');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);
        c.fillStyle = '#e9e4da'; c.fillRect(W * 0.05, H * 0.22, W * 0.9, H * 0.3); c.fillRect(W * 0.3, H * 0.12, W * 0.55, H * 0.12);
        c.fillStyle = '#ffd28a';
        for (let i = 0; i < 5; i++) { c.fillRect(W * (0.1 + i * 0.17), H * 0.3, W * 0.12, H * 0.14); SocialArt.glow(c, W * (0.16 + i * 0.17), H * 0.37, 50, 'rgba(255,200,120,0.4)'); }
        const pool = c.createLinearGradient(0, H * 0.55, 0, H);
        pool.addColorStop(0, '#3fd0ff'); pool.addColorStop(1, '#0c79b8');
        c.fillStyle = '#cfc8bb'; c.fillRect(0, H * 0.52, W, H * 0.48);
        c.fillStyle = pool; c.fillRect(W * 0.04, H * 0.6, W * 0.56, H * 0.3);
        c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 2;
        for (let i = 0; i < 12; i++) { const y = H * (0.62 + r() * 0.26), x = W * 0.05 + r() * W * 0.45; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 20, y - 5, x + 40, y); c.stroke(); }
        person(W * 0.79, H * 1.02, H * 0.66, {});
      } else if (scene === 'music') {
        c.fillStyle = '#0b0820'; c.fillRect(0, 0, W, H);
        SocialArt.glow(c, W * 0.2, H * 0.3, W * 0.5, 'rgba(160,60,255,0.6)');
        SocialArt.glow(c, W * 0.85, H * 0.2, W * 0.45, 'rgba(40,160,255,0.55)');
        c.fillStyle = '#16122e'; for (let i = 0; i < 9; i++) c.fillRect(i * 62, H * 0.1, 50, H * 0.42);
        c.fillStyle = '#c9c9d4'; c.fillRect(W * 0.22, H * 0.4, 6, H * 0.6); c.beginPath(); c.ellipse(W * 0.225, H * 0.38, 16, 24, 0, 0, Math.PI * 2); c.fill();
        person(W * 0.6, H * 1.06, H * 0.78, {});
        tone = 'cool';
      } else if (scene === 'pet') {
        SocialArt.blurred(c, W, H, 3, (b) => {
          b.fillStyle = '#9ccf6e'; b.fillRect(0, 0, W, H);
          SocialArt.bokeh(b, W, H, r, ['rgba(255,255,200,0.8)', 'rgba(140,200,90,0.8)'], 30, 0, 0.5);
          b.fillStyle = '#4e8a3a'; b.fillRect(0, H * 0.55, W, H * 0.45);
        });
        person(W * 0.36, H * 1.02, H * 0.74, {});
        const dx = W * 0.68, dy = H * 0.9;
        c.fillStyle = '#c58b4a'; c.beginPath(); c.ellipse(dx, dy, 60, 34, 0, 0, Math.PI * 2); c.fill();
        c.beginPath(); c.ellipse(dx + 58, dy - 40, 30, 26, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#7a5226'; c.beginPath(); c.ellipse(dx + 74, dy - 60, 10, 18, 0.4, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#c58b4a'; [[-40, 30], [-15, 34], [25, 34], [45, 30]].forEach(([x, y]) => c.fillRect(dx + x, dy + y - 10, 12, 36));
        c.fillStyle = '#111'; c.beginPath(); c.arc(dx + 84, dy - 38, 4, 0, Math.PI * 2); c.fill();
      } else if (scene === 'studio') {
        const g = c.createRadialGradient(W * 0.5, H * 0.4, 20, W * 0.5, H * 0.5, W * 0.8);
        g.addColorStop(0, '#8b919c'); g.addColorStop(1, '#2a2d33');
        c.fillStyle = g; c.fillRect(0, 0, W, H);
        SocialArt.glow(c, W * 0.05, H * 0.2, W * 0.4, 'rgba(255,255,255,0.6)');
        SocialArt.glow(c, W * 0.95, H * 0.25, W * 0.35, 'rgba(255,255,255,0.45)');
        person(W * 0.5, H * 1.08, H * 0.86, { kit: kit, number: num });
        tone = 'none';
      } else {
        // şehir gecesi selfie
        SocialArt.blurred(c, W, H, 4, (b) => {
          b.fillStyle = '#0d1022'; b.fillRect(0, 0, W, H);
          SocialArt.bokeh(b, W, H, r, ['rgba(255,190,90,0.9)', 'rgba(255,90,120,0.8)', 'rgba(90,170,255,0.8)', 'rgba(255,255,255,0.7)'], 40, 0, 0.9);
        });
        person(W * 0.5, H * 1.12, H * 0.86, {});
        tone = 'warm';
      }
    }

    // fotoğraf işleme: ton, vinyet, gren
    if (tone !== 'none') {
      c.save(); c.globalCompositeOperation = 'soft-light';
      c.fillStyle = tone === 'warm' ? 'rgba(255,160,70,0.35)' : 'rgba(70,120,255,0.3)';
      c.fillRect(0, 0, W, H); c.restore();
    }
    const v = c.createRadialGradient(W / 2, H * 0.45, W * 0.35, W / 2, H * 0.5, W * 0.85);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.5)');
    c.fillStyle = v; c.fillRect(0, 0, W, H);
    SocialArt.grain(c, W, H, 0.12);
  },
};

// Instagram tarzı ikonlar (satır içi SVG)
const IG = {
  i(path, cls = '', fill = 'none') { return `<svg class="igi ${cls}" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`; },
  heart(on) { return IG.i('<path d="M12 21s-7.5-4.6-9.6-9.2C1 8.6 3 5 6.6 5c2.2 0 3.6 1.2 5.4 3.2C13.8 6.2 15.2 5 17.4 5 21 5 23 8.6 21.6 11.8 19.5 16.4 12 21 12 21z"/>', on ? 'on' : '', on ? 'currentColor' : 'none'); },
  comment() { return IG.i('<path d="M20.7 16.4A9 9 0 1 0 17 20.1L21 21z"/>'); },
  send() { return IG.i('<path d="M22 3 9.2 10.1"/><path d="M22 3 15 21l-5.8-10.9L2 7z"/>'); },
  save() { return IG.i('<path d="M19 21 12 16 5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1z"/>'); },
  more() { return IG.i('<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>', '', 'currentColor'); },
  grid() { return IG.i('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>'); },
  reels() { return IG.i('<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M3 8h18M8 3l3 5M14 3l3 5"/><path d="m10 12 5 3-5 3z" fill="currentColor"/>'); },
  tag() { return IG.i('<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="12" cy="10" r="3"/><path d="M6.5 19c1.2-2.4 3.2-3.5 5.5-3.5s4.3 1.1 5.5 3.5"/>'); },
  multi() { return IG.i('<rect x="7" y="7" width="13" height="13" rx="2" fill="currentColor"/><path d="M4 16V5a1 1 0 0 1 1-1h11"/>'); },
  verified() { return '<svg class="igv" viewBox="0 0 40 40"><path fill="#0095f6" d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Z"/><path fill="#fff" d="m17.2 27.7-7-6.9 2.5-2.5 4.5 4.4 9.6-9.6 2.5 2.5z"/></svg>'; },
};
