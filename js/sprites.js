// Oyuncu figürleri, top ve saha çizimleri (canvas)

const KIT_PATTERNS = {
  GAL: 'halves', FNK: 'stripes', BJK: 'stripes', TRB: 'stripes', GOZ: 'halves', ANT: 'band',
  BAR: 'stripes', JUV: 'stripes', INT: 'stripes', MIL: 'stripes', ATM: 'stripes', ATH: 'stripes',
  BET: 'stripes', NEW: 'stripes', BOL: 'halves', PSG: 'band', ASM: 'halves', VFB: 'band', SGE: 'plain',
  ESK: 'stripes', SIV: 'stripes', DEN: 'stripes', MAN: 'stripes', SAM: 'band', KAY: 'stripes', TOR: 'plain',
  CLT: 'hoops', CLB: 'stripes', MTY: 'stripes', ATS: 'stripes', UAN: 'plain', CHA: 'stripes', SKC: 'plain',
  RCL: 'stripes', NIC: 'stripes', BRE: 'plain', SEV: 'band', VAL: 'band', BVB: 'plain', NAP: 'plain', BMG: 'hoops',
};

const SKINS = ['#f3cfb1', '#e7b48f', '#cf9871', '#a86f4c', '#7a4e33', '#563522'];
const HAIRS = ['#1c140f', '#3b2618', '#5a3a22', '#8a5a33', '#c9a063', '#0d0d0d'];
const GK_KITS = [
  { shirt: '#c6f135', alt: '#1b1b1b', pattern: 'plain', shorts: '#1b1b1b', socks: '#c6f135' },
  { shirt: '#ff8a1f', alt: '#1b1b1b', pattern: 'plain', shorts: '#1b1b1b', socks: '#ff8a1f' },
  { shirt: '#7b3fe4', alt: '#f5f5f5', pattern: 'plain', shorts: '#2a1650', socks: '#7b3fe4' },
];

// Top tasarımları
function rrect(c, x, y, w, h, r) { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); }
const skins2 = ['#f1c9a5', '#c68642', '#e0ac69', '#8d5524'];
const BALL_STYLES = {
  classic: { name: 'Klasik', base: '#fbfbfb', panel: '#1b1d22', pattern: 'classic' },
  retro: { name: 'Deri Top', base: '#a8652f', base2: '#6b3a16', panel: '#5a3012', accent: '#e8d5b0', pattern: 'retro' },
  winter: { name: 'Kış Topu', base: '#ff8a1f', panel: '#1b1d22', pattern: 'classic' },
  tr: { name: 'Türkiye Ligi', base: '#fbfbfb', panel: '#d61f2c', accent: '#1b1d22', pattern: 'swirl' },
  eng: { name: 'İngiltere Ligi', base: '#fbfbfb', panel: '#5a1e8a', accent: '#00d2ff', pattern: 'stripe' },
  esp: { name: 'İspanya Ligi', base: '#fbfbfb', panel: '#ff6b1a', accent: '#1b1d22', pattern: 'swirl' },
  ger: { name: 'Almanya Ligi', base: '#fbfbfb', panel: '#d2001f', accent: '#1b1d22', pattern: 'stripe' },
  ita: { name: 'İtalya Ligi', base: '#fbfbfb', panel: '#0a5ad6', accent: '#16a34a', pattern: 'swirl' },
  fra: { name: 'Fransa Ligi', base: '#fbfbfb', panel: '#0b2a6b', accent: '#e11d48', pattern: 'stripe' },
  ned: { name: 'Hollanda Ligi', base: '#fbfbfb', panel: '#f36f21', accent: '#1b1d22', pattern: 'stripe' },
  por: { name: 'Portekiz Ligi', base: '#fbfbfb', panel: '#006a44', accent: '#c8102e', pattern: 'swirl' },
  bra: { name: 'Brezilya Ligi', base: '#ffdf00', panel: '#009c3b', accent: '#002776', pattern: 'swirl' },
  arg: { name: 'Arjantin Ligi', base: '#fbfbfb', panel: '#75aadb', accent: '#1b1d22', pattern: 'stripe' },
  uecl: { name: 'Kıta Kupası', base: '#fbfbfb', panel: '#0b7a3e', pattern: 'star' },
  csa: { name: 'Güney Amerika Kupası', base: '#fbfbfb', panel: '#c8a227', accent: '#1f2a44', pattern: 'swirl' },
  ucl: { name: 'Şampiyonlar Kupası', base: '#fbfbfb', panel: '#0b1f4d', pattern: 'star' },
  uel: { name: 'Federasyon Kupası', base: '#fbfbfb', panel: '#f97316', pattern: 'star' },
  wc: { name: 'Dünya Şampiyonası', base: '#fbfbfb', panel: '#c8a227', accent: '#1b1d22', pattern: 'swirl' },
  euro: { name: 'Avrupa Milletler Şampiyonası', base: '#fbfbfb', panel: '#1d4ed8', accent: '#e11d48', pattern: 'swirl' },
  // mağaza kozmetikleri
  neon: { name: 'Neon Top', base: '#e6ff3a', panel: '#111111', pattern: 'classic' },
  gold: { name: 'Yaldızlı Top', base: '#ffe27a', base2: '#b8860b', panel: '#fff7d6', pattern: 'star' },
  fire: { name: 'Ateş Topu', base: '#ffb02e', base2: '#e11d48', panel: '#7a0a0a', pattern: 'flame' },
  ice: { name: 'Buz Topu', base: '#e0f7ff', base2: '#7dd3fc', panel: '#0369a1', pattern: 'flame' },
  galaxy: { name: 'Galaksi Topu', base: '#3b0764', base2: '#0b1f4d', panel: '#f0abfc', pattern: 'star' },
  camo: { name: 'Kamuflaj Top', base: '#6b7b3a', base2: '#3f4a22', panel: '#2a3116', accent: '#a3a86b', pattern: 'swirl' },
  pink: { name: 'Pembe Şimşek', base: '#fbfbfb', panel: '#ff4fa3', accent: '#7a1050', pattern: 'stripe' },
  night: { name: 'Gece Mavisi', base: '#14213d', base2: '#0b1226', panel: '#c0c8d8', pattern: 'star' },
  lava: { name: 'Lav Topu', base: '#1b1b1f', base2: '#3a0a0a', panel: '#ff6a00', pattern: 'flame' },
  rainbow: { name: 'Gökkuşağı Top', base: '#ffffff', panel: '#e11d48', accent: '#2563eb', pattern: 'swirl' },
  diamond: { name: 'Elmas Top', base: '#f0fbff', base2: '#bfe9ff', panel: '#7dd3fc', accent: '#ffffff', pattern: 'star' },
  street: { name: 'Sokak Topu', base: '#fbfbfb', panel: '#16a34a', accent: '#1b1d22', pattern: 'stripe' },
};

const Sprites = {
  hexRgb(h) {
    const n = parseInt(h.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  },
  colorDist(a, b) {
    const x = Sprites.hexRgb(a), y = Sprites.hexRgb(b);
    return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
  },
  _sc: new Map(),
  shadeC(h, f) {
    const k = h + f; let v = Sprites._sc.get(k);
    if (!v) { v = Sprites.shade(h, f); if (Sprites._sc.size > 400) Sprites._sc.clear(); Sprites._sc.set(k, v); }
    return v;
  },
  shade(h, f) {
    if (h[0] !== '#') return h;
    const [r, g, b] = Sprites.hexRgb(h);
    const m = (v) => Math.round(U.clamp(f < 0 ? v * (1 + f) : v + (255 - v) * f, 0, 255));
    return `rgb(${m(r)},${m(g)},${m(b)})`;
  },

  // Takım forması: kulüp renklerinden
  kit(team, away) {
    const pattern = KIT_PATTERNS[team.id] || 'plain';
    const c1 = team.c1, c2 = team.c2;
    if (away) {
      // deplasman forması: ikinci renk ağırlıklı ya da beyaz
      const base = Sprites.colorDist(c2, '#ffffff') < 60 ? '#f4f4f4' : c2;
      return { shirt: base, alt: c1, pattern: 'plain', shorts: c1, socks: base };
    }
    const darkShorts = Sprites.colorDist(c1, '#ffffff') < 60 ? '#1d2433' : '#f4f4f4';
    return { shirt: c1, alt: c2, pattern, shorts: pattern === 'plain' ? c2 : darkShorts, socks: c1 };
  },

  // Mahalle maçı kıyafetleri: bizim taraf sıcak, rakipler soğuk renklerde (ayırt edilsin)
  streetKits() {
    const mk = (shirt, shorts, alt) => ({ shirt, alt: alt || shirt, pattern: 'plain', shorts, socks: '#eeeeee' });
    const own = [mk('#e63946', '#1d2433'), mk('#f4a261', '#3a4a6b'), mk('#ffd166', '#1d2433'), mk('#f1faee', '#2b2d42', '#e63946'), mk('#d62828', '#6c757d'), mk('#ff7b00', '#22223b'), mk('#ffffff', '#3d405b', '#f4a261')];
    const opp = [mk('#1d3557', '#adb5bd'), mk('#457b9d', '#1d2433'), mk('#2a9d8f', '#f1faee'), mk('#6c757d', '#1d2433'), mk('#5a189a', '#adb5bd'), mk('#212529', '#495057'), mk('#00b4d8', '#1d3557')];
    return {
      own: Object.assign({}, own[0], { variants: own }),
      opp: Object.assign({}, opp[0], { variants: opp }),
      gk: mk('#3a5a40', '#1d2433'),
    };
  },

  // Ev sahibi ile çakışıyorsa deplasman formasını seç
  kits(own, opp) {
    const a = Sprites.kit(own, false);
    let b = Sprites.kit(opp, false);
    if (Sprites.colorDist(a.shirt, b.shirt) < 110) b = Sprites.kit(opp, true);
    if (Sprites.colorDist(a.shirt, b.shirt) < 110) b = { shirt: '#f4f4f4', alt: '#1d2433', pattern: 'plain', shorts: '#1d2433', socks: '#f4f4f4' };
    const gk = GK_KITS.find((k) => Sprites.colorDist(k.shirt, a.shirt) > 120 && Sprites.colorDist(k.shirt, b.shirt) > 120) || GK_KITS[0];
    return { own: a, opp: b, gk };
  },

  // Görünüm: açık ve buğday tenler daha sık; saç modeli, saç rengi ve sakal çeşitli
  look(seed) {
    // eşit dağılımlı hash (|sin| uçlarda yığılıyordu, koyu ten fazla çıkıyordu)
    const r = (n) => { const v = Math.sin(seed * 12.9898 + n * 78.233) * 43758.5453; return v - Math.floor(v); };
    const pickW = (x, w) => { let s = w.reduce((a, b) => a + b, 0) * x; for (let i = 0; i < w.length; i++) { s -= w[i]; if (s <= 0) return i; } return w.length - 1; };
    const si = pickW(r(1), [30, 27, 18, 11, 8, 6]);
    const hi = si >= 3 ? pickW(r(2), [55, 15, 5, 0, 0, 25]) : pickW(r(2), [24, 26, 20, 12, 10, 8]);
    const styles = ['short', 'buzz', 'side', 'long', 'curly', 'mohawk', 'bun', 'bald'];
    const st = styles[pickW(r(3), si >= 3 ? [16, 24, 6, 4, 30, 8, 6, 6] : [28, 18, 16, 10, 8, 6, 6, 8])];
    return { skin: SKINS[si], hair: HAIRS[hi], style: st, bald: st === 'bald', beard: r(4) < 0.28 };
  },

  // Oyuncunun kendi görünümü (Premium görünüm stüdyosunda değiştirilebilir)
  me(p) {
    p = p || (typeof Game !== 'undefined' && Game.p);
    return (p && p.look) || Sprites.look(7);
  },

  // İnsan figürü. (sx, sy) ayakların ekran noktası, h ekrandaki boy (px)
  figure(ctx, sx, sy, h, o) {
    // Mahalle maçı: herkes farklı kıyafette (kit.variants), forma numarası yok
    let kit = o.kit;
    if (kit && kit.variants) {
      const v = kit.variants;
      let k = o.number != null ? o.number : 0;
      if (o.look && o.look.skin) k += o.look.skin.charCodeAt(2) + (o.look.style || '').length;
      kit = v[Math.abs(k) % v.length];
      if (o.number != null) o = Object.assign({}, o, { number: null });
    }
    const look = o.look || { skin: SKINS[1], hair: HAIRS[0] };
    const up = o.facing === 'up';
    const run = o.run || 0; // koşu fazı (radyan)
    const runAmt = U.clamp(o.speed || 0, 0, 1);
    const sw = Math.sin(run) * runAmt;
    const bob = Math.abs(Math.cos(run)) * runAmt * h * 0.02;
    const by = sy - bob;
    const W = h * 0.36;

    // gölge
    if (!o.noShadow) {
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.beginPath(); ctx.ellipse(sx + h * 0.06, sy + h * 0.02, h * 0.24, h * 0.07, 0, 0, Math.PI * 2); ctx.fill();
    }

    if (o.ring) {
      ctx.strokeStyle = o.ring; ctx.lineWidth = Math.max(2, h * 0.04);
      ctx.beginPath(); ctx.ellipse(sx, sy, h * 0.32 + Math.sin(o.t * 6) * h * 0.03, h * 0.1, 0, 0, Math.PI * 2); ctx.stroke();
    }

    // Uzuv: yuvarlak uçlu kalın çizgi + gölge tarafı (ışık sol üstten)
    const limb = (x1, y1, x2, y2, w, col, shadeK = -0.2) => {
      ctx.strokeStyle = col; ctx.lineWidth = w;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      if (h > 80) {
        const dx = y2 - y1, dy = x1 - x2, L = Math.hypot(dx, dy) || 1, o2 = w * 0.22;
        ctx.strokeStyle = Sprites.shadeC(col, shadeK); ctx.lineWidth = w * 0.4;
        ctx.beginPath(); ctx.moveTo(x1 - (dx / L) * o2, y1 - (dy / L) * o2); ctx.lineTo(x2 - (dx / L) * o2, y2 - (dy / L) * o2); ctx.stroke();
      }
    };
    ctx.lineCap = 'round';

    // bacaklar: kalça → diz → ayak. Koşarken biri yerden kalkıp bükülür, diğeri basar.
    const legW = h * 0.105;
    const hipY = by - h * 0.46;
    const kick = o.kick || 0; // 0..1
    const drawLeg = (side, phase, kickA) => {
      const hx = sx + side * W * 0.2, L = h * 0.46;
      let kx, ky, fx, fy;
      if (kickA) {
        const s1 = Math.sin(kickA), c1 = Math.cos(kickA);
        kx = hx - s1 * L * 0.5; ky = hipY + c1 * L * 0.5;
        fx = hx - s1 * L * 0.96; fy = hipY + c1 * L * 0.96;
      } else {
        const lift = runAmt * Math.max(0, Math.sin(run + phase)); // 0 basıyor, 1 havada
        const plant = runAmt * Math.max(0, -Math.sin(run + phase));
        fx = hx + side * (h * 0.012 + plant * h * 0.05 - lift * h * 0.012);
        fy = sy - bob * (1 - lift) - lift * h * 0.12 + plant * h * 0.006 - h * 0.03;
        kx = hx + side * (lift * h * 0.05 + plant * h * 0.02 + h * 0.006);
        ky = hipY + (fy - hipY) * 0.42 + lift * h * 0.02;
        // makas: arkadan/önden bakınca adım ayakların çaprazlanması gibi görünür
        const sc2 = -side * sw * h * 0.075; fx += sc2; kx += sc2 * 0.45;
      }
      // uyluk (ten), diz, kaval (çorap)
      limb(hx, hipY, kx, ky, legW * 1.18, look.skin);
      limb(kx, ky, fx, fy, legW * 0.98, kit.socks);
      // diz ve çorap ağzı: dizin hemen altı ten, sonra çorap
      limb(kx, ky, kx + (fx - kx) * 0.05, ky + (fy - ky) * 0.05, legW * 1.04, look.skin);
      if (h > 80) { ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = Math.max(1, h * 0.008); const cx = kx + (fx - kx) * 0.09, cy = ky + (fy - ky) * 0.09; ctx.beginPath(); ctx.moveTo(cx - legW * 0.45, cy); ctx.lineTo(cx + legW * 0.45, cy); ctx.stroke(); }
      // krampon: burun hafif dışa dönük
      ctx.fillStyle = look.boots || '#16181d';
      ctx.beginPath(); ctx.ellipse(fx + side * legW * 0.08, fy + legW * 0.22, legW * 0.6, legW * 0.4, side * 0.25, 0, Math.PI * 2); ctx.fill();
      if (h > 40) { ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.ellipse(fx + side * legW * 0.02, fy + legW * 0.08, legW * 0.32, legW * 0.12, side * 0.25, 0, Math.PI * 2); ctx.fill(); }
    };
    drawLeg(-1, 0, 0);
    drawLeg(1, Math.PI, kick ? (up ? -1 : 1) * Math.sin(kick * Math.PI) * 1.1 : 0);

    // şort
    ctx.fillStyle = kit.shorts;
    ctx.beginPath();
    ctx.moveTo(sx - W * 0.5, hipY + h * 0.07);
    ctx.lineTo(sx - W * 0.52, hipY - h * 0.08);
    ctx.lineTo(sx + W * 0.52, hipY - h * 0.08);
    ctx.lineTo(sx + W * 0.5, hipY + h * 0.07);
    ctx.lineTo(sx + W * 0.05, hipY + h * 0.055);
    ctx.lineTo(sx, hipY - h * 0.005);
    ctx.lineTo(sx - W * 0.05, hipY + h * 0.055);
    ctx.closePath(); ctx.fill();
    if (h > 34) { ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(sx + W * 0.18, hipY - h * 0.08, W * 0.34, h * 0.15); }

    // kollar: omuz → dirsek → el. Koşarken dirsekten bükülü, ileri-geri (arkadan bakınca kısalır)
    const shY = by - h * 0.82;
    const tilt = sw * h * 0.012;
    const drawArm = (side, phase) => {
      const ax = sx + side * W * 0.54, ay = shY + h * 0.05 + side * tilt;
      const armA = o.armA || 0, raise = U.clamp(armA / 1.6, 0, 1);
      const f = Math.sin(run + phase) * runAmt; // +: ileri
      const L1 = h * 0.18, L2 = h * 0.17;
      const p1 = 0.2 + Math.max(-0.1, armA - 0.12);
      const k1 = 1 - 0.18 * Math.abs(f) * (1 - raise);
      const ex = ax + side * Math.sin(p1) * L1, ey = ay + Math.cos(p1) * L1 * k1 - f * h * 0.012;
      const bend = (0.1 + 0.5 * runAmt) * (1 - raise);
      const p2 = p1 - bend * 0.45;
      const k2 = 1 - (0.15 + 0.35 * Math.max(0, f)) * runAmt * (1 - raise);
      let hx2 = ex + side * Math.sin(p2) * L2 * k2;
      const hy2 = ey + Math.cos(p2) * L2 * k2 - f * h * 0.025;
      if (raise < 0.5 && side * (hx2 - sx) < W * 0.56) hx2 = sx + side * W * 0.56; // el gövdenin arkasında kaybolmasın
      const aw = h * 0.088;
      limb(ax, ay, ex, ey, aw, look.skin);
      limb(ex, ey, hx2, hy2, aw * 0.88, look.skin);
      // kol ağzı (forma)
      limb(ax, ay, ax + (ex - ax) * 0.55, ay + (ey - ay) * 0.55, aw * 1.25, kit.shirt, -0.15);
      if (o.gloves) { ctx.fillStyle = '#f0f0f0'; ctx.beginPath(); ctx.ellipse(hx2, hy2, aw * 0.75, aw * 0.85, 0, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.fillStyle = look.skin; ctx.beginPath(); ctx.arc(hx2, hy2, aw * 0.55, 0, Math.PI * 2); ctx.fill(); }
    };
    const armsUp = o.dive || 0;
    if (!armsUp) {
      drawArm(-1, Math.PI);
      drawArm(1, 0);
    }
    ctx.lineCap = 'butt';

    // gövde (forma)
    const top = shY, bot = hipY - h * 0.06;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(sx - W * 0.56, top + h * 0.02);
    ctx.quadraticCurveTo(sx, top - h * 0.03, sx + W * 0.56, top + h * 0.02);
    ctx.lineTo(sx + W * 0.48, bot);
    ctx.lineTo(sx - W * 0.48, bot);
    ctx.closePath();
    ctx.fillStyle = kit.shirt; ctx.fill();
    ctx.clip();
    ctx.fillStyle = kit.alt;
    const tw = W * 1.2, x0 = sx - tw / 2;
    if (h > 30) {
      // yaka ve kol dikişleri
      ctx.save(); ctx.fillStyle = kit.pattern === 'plain' ? kit.alt : Sprites.shadeC(kit.shirt, -0.3);
      if (up) ctx.fillRect(sx - W * 0.2, top - h * 0.02, W * 0.4, h * 0.03);
      else { ctx.beginPath(); ctx.moveTo(sx - W * 0.2, top - h * 0.01); ctx.lineTo(sx, top + h * 0.06); ctx.lineTo(sx + W * 0.2, top - h * 0.01); ctx.lineTo(sx + W * 0.12, top - h * 0.01); ctx.lineTo(sx, top + h * 0.035); ctx.lineTo(sx - W * 0.12, top - h * 0.01); ctx.fill(); }
      ctx.restore();
    }
    if (kit.pattern === 'stripes') {
      for (let i = 0; i < 6; i++) if (i % 2) ctx.fillRect(x0 + (tw / 6) * i, top - h * 0.05, tw / 6, h * 0.5);
    } else if (kit.pattern === 'halves') {
      ctx.fillRect(sx, top - h * 0.05, tw, h * 0.5);
    } else if (kit.pattern === 'hoops') {
      for (let i = 0; i < 5; i++) if (i % 2) ctx.fillRect(x0, top + ((bot - top) / 5) * i, tw, (bot - top) / 5);
    } else if (kit.pattern === 'band') {
      ctx.fillRect(sx - W * 0.13, top - h * 0.05, W * 0.26, h * 0.5);
    }
    // gölgelendirme
    const g = ctx.createLinearGradient(sx - W * 0.6, 0, sx + W * 0.6, 0);
    g.addColorStop(0, 'rgba(255,255,255,0.18)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = g; ctx.fillRect(sx - W, top - h * 0.05, W * 2, h * 0.5);
    ctx.restore();

    // numara (sırtta) ya da arma (önde)
    if (o.number != null && h > 26) {
      // sırtta büyük numara; önden bakışta göğüste küçük numara
      const nx = up ? sx : sx + W * 0.2, ny = top + (bot - top) * (up ? 0.48 : 0.3);
      ctx.font = `800 ${Math.round(h * (up ? 0.17 : 0.09))}px "Saira Condensed", "Arial Narrow", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = Math.max(1, h * 0.02); ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      const nc = kit.pattern === 'plain' ? kit.alt : '#ffffff';
      ctx.strokeText(String(o.number), nx, ny);
      ctx.fillStyle = Sprites.colorDist(nc, kit.shirt) < 80 ? '#ffffff' : nc;
      ctx.fillText(String(o.number), nx, ny);
      ctx.textBaseline = 'alphabetic';
    } else if (!up) {
      ctx.fillStyle = kit.alt;
      ctx.beginPath(); ctx.arc(sx - W * 0.2, top + h * 0.08, h * 0.03, 0, Math.PI * 2); ctx.fill();
    }

    // boyun ve kafa
    const hr = h * 0.105;
    const hy = top - hr * 0.95;
    ctx.fillStyle = Sprites.shade(look.skin, -0.12); ctx.fillRect(sx - hr * 0.35, top - hr * 0.4, hr * 0.7, hr * 0.5);
    ctx.fillStyle = look.skin;
    if (!up && h > 40) { ctx.beginPath(); ctx.ellipse(sx - hr * 0.98, hy + hr * 0.08, hr * 0.17, hr * 0.27, 0, 0, Math.PI * 2); ctx.ellipse(sx + hr * 0.98, hy + hr * 0.08, hr * 0.17, hr * 0.27, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.beginPath(); ctx.ellipse(sx, hy, hr * 0.96, hr * 1.04, 0, 0, Math.PI * 2); ctx.fill();
    if (h > 34) { ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.beginPath(); ctx.ellipse(sx + hr * 0.3, hy + hr * 0.1, hr * 0.62, hr * 0.92, 0, -Math.PI / 2, Math.PI / 2); ctx.fill(); }
    if (!look.bald) {
      ctx.fillStyle = look.hair;
      const style = look.style || 'short';
      ctx.beginPath();
      if (style === 'mohawk') {
        if (up) { ctx.arc(sx, hy - hr * 0.05, hr * 1.02, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = look.skin; ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.arc(sx, hy, hr * 0.98, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; ctx.fillStyle = look.hair; ctx.beginPath(); }
        ctx.rect(sx - hr * 0.2, hy - hr * 1.3, hr * 0.4, up ? hr * 2.0 : hr * 0.75);
      } else if (style === 'buzz') {
        if (up) ctx.arc(sx, hy - hr * 0.05, hr * 1.0, 0, Math.PI * 2);
        else ctx.arc(sx, hy - hr * 0.12, hr * 0.94, Math.PI * 1.12, Math.PI * 1.88);
        ctx.globalAlpha = 0.85;
      } else if (style === 'curly') {
        ctx.arc(sx, hy - hr * 0.25, hr * 1.12, up ? 0 : Math.PI * 1.0, up ? Math.PI * 2 : Math.PI * 2);
        for (let k = 0; k < 7; k++) { const a = Math.PI * (1.05 + k * 0.15); ctx.moveTo(sx + Math.cos(a) * hr * 1.05, hy - hr * 0.25 + Math.sin(a) * hr * 1.05); ctx.arc(sx + Math.cos(a) * hr * 1.05, hy - hr * 0.25 + Math.sin(a) * hr * 1.05, hr * 0.3, 0, Math.PI * 2); }
      } else {
        if (up) ctx.arc(sx, hy - hr * 0.05, hr * 1.02, 0, Math.PI * 2);
        else if (style === 'side') { ctx.moveTo(sx - hr * 1.02, hy - hr * 0.05); ctx.arc(sx, hy - hr * 0.3, hr * 1.0, Math.PI * 1.0, Math.PI * 1.98); ctx.lineTo(sx - hr * 0.2, hy - hr * 0.55); }
        else ctx.arc(sx, hy - hr * 0.3, hr * 0.98, Math.PI * 1.05, Math.PI * 1.95);
        if (style === 'long') { ctx.rect(sx - hr * 1.08, hy - hr * 0.45, hr * 0.34, hr * 1.55); ctx.rect(sx + hr * 0.74, hy - hr * 0.45, hr * 0.34, hr * 1.55); if (up) ctx.rect(sx - hr * 0.9, hy, hr * 1.8, hr * 1.2); }
        if (style === 'bun') { ctx.moveTo(sx + hr * 0.45, hy - hr * 1.15); ctx.arc(sx, hy - hr * 1.15, hr * 0.45, 0, Math.PI * 2); }
      }
      ctx.fill();
      ctx.globalAlpha = 1;
      // arkadan bakışta ense ve kulaklar görünür
      if (up && h > 60) {
        ctx.fillStyle = look.skin;
        ctx.beginPath(); ctx.ellipse(sx, hy + hr * 0.9, hr * 0.36, hr * 0.16, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(sx - hr * 1.0, hy + hr * 0.1, hr * 0.16, hr * 0.26, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(sx + hr * 1.0, hy + hr * 0.1, hr * 0.16, hr * 0.26, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (!up) {
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(sx - hr * 0.42, hy + hr * 0.05, hr * 0.18, hr * 0.14);
      ctx.fillRect(sx + hr * 0.24, hy + hr * 0.05, hr * 0.18, hr * 0.14);
      if (look.beard && h > 30) {
        ctx.fillStyle = look.hair; ctx.globalAlpha = 0.8;
        ctx.beginPath(); ctx.arc(sx, hy + hr * 0.12, hr * 0.92, Math.PI * 0.08, Math.PI * 0.92);
        ctx.lineTo(sx - hr * 0.5, hy + hr * 0.45); ctx.quadraticCurveTo(sx, hy + hr * 0.62, sx + hr * 0.5, hy + hr * 0.45); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // kaleci uçuşu: iki kol başın üstünden topa uzanır (gövdenin önünde çizilir)
    if (armsUp) {
      const arm = (side) => {
        ctx.save();
        ctx.translate(sx + side * W * 0.42, shY + h * 0.03);
        ctx.rotate(side * -(Math.PI - 0.28));
        const aw = h * 0.085, L = h * 0.36;
        ctx.fillStyle = look.skin; ctx.fillRect(-aw / 2, 0, aw, L);
        ctx.fillStyle = kit.shirt; ctx.fillRect(-aw / 2 - 1, 0, aw + 2, L * 0.4);
        if (o.gloves) { ctx.fillStyle = '#f4f4f4'; ctx.beginPath(); ctx.ellipse(0, L, aw * 0.95, aw * 1.05, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = Math.max(1, h * 0.012); ctx.stroke(); }
        ctx.restore();
      };
      arm(-1); arm(1);
    }
    if (o.label) Sprites.tag(ctx, sx, hy - hr * 1.6, o.label, o.labelScale || 1, o.labelColor);
  },

  tag(ctx, x, y, text, fs, color) {
    ctx.font = `700 ${Math.round(12 * fs)}px "Barlow Semi Condensed", "Arial Narrow", sans-serif`;
    ctx.textAlign = 'center';
    const w = ctx.measureText(text).width + 12 * fs, hh = 18 * fs;
    ctx.fillStyle = color || 'rgba(10,16,30,0.82)';
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + 4 * fs, y - hh); ctx.lineTo(x + w / 2 + 4 * fs, y - hh);
    ctx.lineTo(x + w / 2 - 4 * fs, y); ctx.lineTo(x - w / 2 - 4 * fs, y); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText(text, x, y - hh * 0.28);
  },

  // Top tasarımları: lig toplarında ve mağazadaki kozmetik toplarda kullanılır
  // Gerçek top deseni: kesik ikosahedron (12 beşgen) küre üzerine izdüşüm; dönüşle paneller akar
  BALL3D: (() => {
    const F = (1 + Math.sqrt(5)) / 2, nr = (v) => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
    const V = [];
    [[0, 1, F], [0, -1, F], [0, 1, -F], [0, -1, -F]].forEach(([a, b, d]) => V.push([a, b, d], [b, d, a], [d, a, b]));
    const N = V.map(nr), dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    // her beşgen: merkezden komşulara 1/3 noktalar, açıya göre sıralı, kenar başına 3 ara nokta
    return N.map((c, i) => {
      const nb = N.map((w, j) => [j, dot(c, w)]).filter(([j, d]) => j !== i && d > 0.4).map(([j]) => j);
      const pts = nb.map((j) => nr([V[i][0] + (V[j][0] - V[i][0]) / 3, V[i][1] + (V[j][1] - V[i][1]) / 3, V[i][2] + (V[j][2] - V[i][2]) / 3]));
      const r0 = nr([pts[0][0] - c[0] * dot(pts[0], c), pts[0][1] - c[1] * dot(pts[0], c), pts[0][2] - c[2] * dot(pts[0], c)]);
      const r1 = [c[1] * r0[2] - c[2] * r0[1], c[2] * r0[0] - c[0] * r0[2], c[0] * r0[1] - c[1] * r0[0]];
      pts.sort((a, b) => Math.atan2(dot(a, r1), dot(a, r0)) - Math.atan2(dot(b, r1), dot(b, r0)));
      const ring = [];
      pts.forEach((p, k) => { const q = pts[(k + 1) % 5]; for (let s = 0; s < 3; s++) { const t = s / 3; ring.push(nr([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t])); } });
      return { c, ring };
    });
  })(),
  ball3d(ctx, x, y, r, rot, B) {
    const rx = rot * 0.9, ry = rot * 0.37 + 0.6;
    const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry);
    const R = (v) => { const y1 = v[1] * cx - v[2] * sx, z1 = v[1] * sx + v[2] * cx; return [v[0] * cy + z1 * sy, y1, -v[0] * sy + z1 * cy]; };
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
    const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.45, r * 0.05, x, y, r * 1.05);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, B.base || '#f4f5f8'); g.addColorStop(0.85, '#b9c0cc'); g.addColorStop(1, '#6d7588');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.fillStyle = B.panel || '#101421';
    ctx.beginPath();
    for (const P of Sprites.BALL3D) {
      if (R(P.c)[2] < -0.3) continue;
      P.ring.forEach((v, k) => { const q = R(v), px = x + q[0] * r, py = y + q[1] * r; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
      ctx.closePath();
    }
    ctx.fill();
    // hacim: kenar karartma ve parlama
    const v = ctx.createRadialGradient(x - r * 0.2, y - r * 0.25, r * 0.5, x, y, r);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(10,15,35,0.5)');
    ctx.fillStyle = v; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    const h = ctx.createRadialGradient(x - r * 0.42, y - r * 0.48, 0, x - r * 0.42, y - r * 0.48, r * 0.5);
    h.addColorStop(0, 'rgba(255,255,255,0.8)'); h.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = h; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = Math.max(0.8, r * 0.06);
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  },
  ball(ctx, x, y, r, rot, style) {
    const B = style || Sprites.curBall || BALL_STYLES.classic;
    // klasik top yeterince büyükse gerçek desen (küçük boyda eski hızlı çizim)
    if (B.pattern === 'classic' && r >= 5) return Sprites.ball3d(ctx, x, y, r, rot, B);
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    if (B.base2) {
      const bg = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
      bg.addColorStop(0, B.base); bg.addColorStop(1, B.base2);
      ctx.fillStyle = bg;
    } else ctx.fillStyle = B.base;
    ctx.fill();
    ctx.clip();
    const pat = B.pattern;
    if (pat === 'classic' || pat === 'retro') {
      ctx.fillStyle = B.panel;
      for (let i = 0; i < 5; i++) {
        const a = rot + (i * Math.PI * 2) / 5;
        Sprites.poly(ctx, x + Math.cos(a) * r * 0.75, y + Math.sin(a) * r * 0.75, r * 0.32, 5, a);
      }
      Sprites.poly(ctx, x + Math.cos(rot * 1.3) * r * 0.1, y + Math.sin(rot * 1.3) * r * 0.1, r * 0.34, 5, rot);
      if (pat === 'retro') {
        ctx.strokeStyle = B.accent; ctx.lineWidth = Math.max(1, r * 0.08);
        for (let i = 0; i < 3; i++) { const a = rot + i * 2.1; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); ctx.lineTo(x - Math.cos(a) * r, y - Math.sin(a) * r); ctx.stroke(); }
      }
    } else if (pat === 'swirl') {
      for (let i = 0; i < 3; i++) {
        const a = rot + (i * Math.PI * 2) / 3;
        ctx.fillStyle = i % 2 ? B.accent : B.panel;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + Math.cos(a + 0.6) * r * 1.2, y + Math.sin(a + 0.6) * r * 1.2, x + Math.cos(a + 1.1) * r, y + Math.sin(a + 1.1) * r);
        ctx.lineTo(x + Math.cos(a + 1.5) * r, y + Math.sin(a + 1.5) * r);
        ctx.quadraticCurveTo(x + Math.cos(a + 0.9) * r * 0.5, y + Math.sin(a + 0.9) * r * 0.5, x, y);
        ctx.fill();
      }
    } else if (pat === 'stripe') {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      ctx.fillStyle = B.panel; ctx.fillRect(-r, -r * 0.28, r * 2, r * 0.56);
      ctx.fillStyle = B.accent; ctx.fillRect(-r, -r * 0.08, r * 2, r * 0.16);
      ctx.restore();
    } else if (pat === 'star') {
      ctx.fillStyle = B.panel;
      for (let i = 0; i < 4; i++) {
        const a = rot + (i * Math.PI) / 2;
        Sprites.star(ctx, x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, r * 0.32, a);
      }
      Sprites.star(ctx, x, y, r * 0.3, rot);
    } else if (pat === 'flame') {
      ctx.fillStyle = B.panel;
      for (let i = 0; i < 4; i++) {
        const a = rot + (i * Math.PI) / 2;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
        ctx.quadraticCurveTo(x + Math.cos(a + 0.9) * r * 0.2, y + Math.sin(a + 0.9) * r * 0.2, x + Math.cos(a + 1.4) * r, y + Math.sin(a + 1.4) * r);
        ctx.quadraticCurveTo(x + Math.cos(a + 0.7) * r * 0.6, y + Math.sin(a + 0.7) * r * 0.6, x + Math.cos(a) * r, y + Math.sin(a) * r);
        ctx.fill();
      }
    }
    const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.1, x, y, r * 1.1);
    g.addColorStop(0, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = Math.max(1, r * 0.12);
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  },

  star(ctx, x, y, r, a) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const t = a + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
      i ? ctx.lineTo(x + Math.cos(t) * rr, y + Math.sin(t) * rr) : ctx.moveTo(x + Math.cos(t) * rr, y + Math.sin(t) * rr);
    }
    ctx.closePath(); ctx.fill();
  },

  poly(ctx, x, y, r, n, a) {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const t = a + (i * Math.PI * 2) / n;
      i ? ctx.lineTo(x + Math.cos(t) * r, y + Math.sin(t) * r) : ctx.moveTo(x + Math.cos(t) * r, y + Math.sin(t) * r);
    }
    ctx.closePath(); ctx.fill();
  },

  // Çim zemini: tx/ty dünya→ekran dönüşümleri, PX metre başına piksel
  // Zemin: çim şeritleri; mahalle maçında (surface = 'sand') kum/toprak saha
  surface: null,
  stripe(i) {
    if (Sprites.surface === 'sand') return i % 2 ? '#c49a5f' : '#caa266';
    return i % 2 ? '#2f8c45' : '#38994d';
  },
  sand(ctx, W, H) {
    ctx.fillStyle = '#c69d61'; ctx.fillRect(0, 0, W, H);
    // koyu ve açık lekeler, ayak izleri, çakıl taşları
    for (let i = 0; i < 26; i++) {
      const x = Math.random() * W, y = Math.random() * H, r = 20 + Math.random() * 90;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const c = Math.random() < 0.5 ? '150,110,60' : '226,196,140';
      g.addColorStop(0, `rgba(${c},0.35)`); g.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    const n = Math.round((W * H) / 500);
    for (let i = 0; i < n; i++) {
      const v = Math.random();
      ctx.fillStyle = v < 0.45 ? 'rgba(110,78,40,0.22)' : v < 0.9 ? 'rgba(255,240,205,0.18)' : 'rgba(90,90,90,0.5)';
      const s = v < 0.9 ? 2 : 3 + Math.random() * 3;
      ctx.fillRect(Math.random() * W, Math.random() * H, s, s);
    }
  },
  // Gerçek çim dokusu (img/grass.jpg, ambientCG Grass005, CC0) + biçilmiş şeritler, ışık ve kale ağzı aşınması.
  // Arka plan maç anı başında bir kez çizilir (önbellek), kare başına maliyeti yok.
  grassImg: (() => {
    if (typeof Image === 'undefined') return null;
    const im = new Image();
    im.onload = () => { Sprites.grassTile = null; Sprites._turf = {}; if (typeof window !== 'undefined') window.dispatchEvent(new Event('resize')); };
    im.src = 'img/grass.jpg';
    return im;
  })(),
  grassTile: null,
  // Dokuyu bir kez renklendirip küçük bir döşemeye çevirir (her maçta yeniden işlenmez)
  tile() {
    if (Sprites.grassTile) return Sprites.grassTile;
    const im = Sprites.grassImg;
    if (!im || !im.complete || !im.naturalWidth) return null;
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d');
    x.drawImage(im, 0, 0, 256, 256);
    // stadyum çimi rengine çek: hafif mavi-yeşil, daha az sarı
    x.globalCompositeOperation = 'multiply'; x.fillStyle = '#8fd39a'; x.fillRect(0, 0, 256, 256);
    x.globalCompositeOperation = 'source-over';
    return (Sprites.grassTile = c);
  },
  // Mini oyun zemini (dikey bantlı): gerçek çim dokusu + yumuşak biçme şeritleri.
  // scroll verilmezse sonuç önbellekten çizilir; scroll (piksel) verilirse doku ve şeritler kayar (çalım oyunu).
  _turf: {},
  turf(ctx, W, H, n = 12, scroll = null, band = null) {
    const tile = Sprites.surface === 'sand' ? null : Sprites.tile();
    const bh = band || H / n;
    if (!tile) {
      const off = scroll == null ? 0 : ((scroll % (bh * 2)) + bh * 2) % (bh * 2);
      for (let i = -2, y = off - bh * 2; y < H; i++, y += bh) { ctx.fillStyle = Sprites.stripe(i); ctx.fillRect(0, y, W, bh + 1); }
      return;
    }
    const paint = (c, off) => {
      c.fillStyle = '#2a7d3d'; c.fillRect(0, 0, W, H);
      const pat = c.createPattern(tile, 'repeat'), k = W / 5 / 256;
      if (pat.setTransform && typeof DOMMatrix !== 'undefined') pat.setTransform(new DOMMatrix([k, 0, 0, k, 0, off % (256 * k)]));
      c.fillStyle = pat; c.fillRect(0, 0, W, H);
      const o2 = ((off % (bh * 2)) + bh * 2) % (bh * 2);
      for (let i = 0, y = o2 - bh * 2; y < H; i++, y += bh) { c.fillStyle = i % 2 ? 'rgba(255,255,240,0.06)' : 'rgba(0,30,10,0.11)'; c.fillRect(0, y, W, bh + 1); }
    };
    if (scroll != null) {
      paint(ctx, scroll);
      const v = ctx.createLinearGradient(0, 0, W, 0); v.addColorStop(0, 'rgba(0,10,5,0.22)'); v.addColorStop(0.5, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,10,5,0.22)');
      ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
      return;
    }
    const key = W + 'x' + H + 'n' + n;
    let b = Sprites._turf[key];
    if (!b) {
      b = document.createElement('canvas'); b.width = W; b.height = H;
      const c = b.getContext('2d'); paint(c, 0);
      const L = c.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.15, W / 2, H * 0.5, Math.max(W, H) * 0.8);
      L.addColorStop(0, 'rgba(255,255,230,0.05)'); L.addColorStop(1, 'rgba(0,10,5,0.3)');
      c.fillStyle = L; c.fillRect(0, 0, W, H);
      Sprites._turf = { [key]: b }; // yalnız son boyut saklanır (bellek)
    }
    ctx.drawImage(b, 0, 0);
  },
  grass(ctx, W, H, tx, ty, PX, view) {
    if (Sprites.surface === 'sand') {
      Sprites.sand(ctx, W, H);
      ctx.fillStyle = 'rgba(90,60,30,0.25)';
      if (view.x0 < -26) ctx.fillRect(0, 0, tx(-26.5), H);
      if (view.x1 > 26) ctx.fillRect(tx(26.5), 0, W - tx(26.5), H);
      return;
    }
    ctx.fillStyle = '#2a7d3d';
    ctx.fillRect(0, 0, W, H);
    const tile = Sprites.tile();
    if (tile) {
      const pat = ctx.createPattern(tile, 'repeat');
      const k = (2.6 * PX) / 256; // bir döşeme yaklaşık 2,6 m
      if (pat.setTransform && typeof DOMMatrix !== 'undefined') pat.setTransform(new DOMMatrix([k, 0, 0, k * 0.85, tx(0) % (256 * k), 0]));
      ctx.fillStyle = pat; ctx.fillRect(0, 0, W, H);
    }
    // biçilmiş çim şeritleri: yumuşak kenarlı açık/koyu bantlar
    for (let y = Math.floor(view.y0 / 5) * 5; y < view.y1; y += 5) {
      const i = Math.round(y / 5), y0 = ty(y), h = 5 * PX + 1;
      const g = ctx.createLinearGradient(0, y0, 0, y0 + h);
      const a = i % 2 ? 'rgba(255,255,240,' : 'rgba(0,30,10,';
      const m = i % 2 ? 0.07 : 0.12;
      g.addColorStop(0, a + m * 0.6 + ')'); g.addColorStop(0.5, a + m + ')'); g.addColorStop(1, a + m * 0.6 + ')');
      ctx.fillStyle = g; ctx.fillRect(0, y0, W, h);
    }
    // kale ağzı ve penaltı noktasında aşınma
    const wear = (x, y, rx, ry, a) => {
      ctx.save(); ctx.translate(tx(x), ty(y)); ctx.scale(1, ry / rx);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx * PX);
      g.addColorStop(0, `rgba(150,140,85,${a})`); g.addColorStop(0.6, `rgba(150,140,85,${a * 0.45})`); g.addColorStop(1, 'rgba(150,140,85,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx * PX, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    };
    wear(0, 1.2, 3.4, 1.6, 0.32); wear(-1.6, 0.6, 1.4, 0.8, 0.18); wear(1.7, 0.7, 1.3, 0.8, 0.16); wear(0, 11, 1.0, 0.7, 0.2);
    // stadyum ışığı: ortası parlak, kenarlar ve uzak taraf hafif koyu
    const L = ctx.createRadialGradient(W * 0.5, H * 0.55, Math.min(W, H) * 0.15, W * 0.5, H * 0.5, Math.max(W, H) * 0.8);
    L.addColorStop(0, 'rgba(255,255,230,0.06)'); L.addColorStop(1, 'rgba(0,10,5,0.32)');
    ctx.fillStyle = L; ctx.fillRect(0, 0, W, H);
    // saha dışı
    ctx.fillStyle = 'rgba(8,40,18,0.45)';
    if (view.x0 < -26) ctx.fillRect(0, 0, tx(-26.5), H);
    if (view.x1 > 26) ctx.fillRect(tx(26.5), 0, W - tx(26.5), H);
  },

  // Kalenin arkası: kulüp renklerinde taraftar tribünü, oyuncunun adının yazdığı dev pankart ve kale yanında fotoğrafçılar.
  // Statik kısım arka plana bir kez çizilir; flaşlar ve bayraklar standsFx ile kare kare (az sayıda, ucuz).
  crowd: null, // { c1, c2, name, number } MiniGame.play ayarlar
  _fx: null,
  stands(ctx, W, tx, ty, PX, view, fs) {
    const boardY = ty(-3.2), boardH = 1.05 * PX;
    Sprites._fx = null;
    if (view.y0 > -3.2) return;
    if (Sprites.surface === 'sand') return Sprites.street(ctx, W, boardY, PX);
    const C = Sprites.crowd || { c1: '#c8102e', c2: '#fdb913', name: '', number: 10 };
    const A = Sprites.atmo || { lvl: 0.8, star: true, photogs: 8, club: '' };
    const seat = Sprites.shade(C.c1, -0.35);
    const rnd = (() => { let z = 1234567; return () => { z = (z * 16807) % 2147483647; return z / 2147483647; }; })();
    // tribün zemini
    const top = 0, bottom = boardY - boardH;
    if (bottom > top) {
      const g = ctx.createLinearGradient(0, top, 0, bottom);
      g.addColorStop(0, '#070b16'); g.addColorStop(1, '#182238');
      ctx.fillStyle = g; ctx.fillRect(0, top, W, bottom - top);
      // taraftarlar: uzak sıralar küçük ve koyu; çoğu kulüp renklerinde, bazıları kollar havada ya da atkılı
      const skins = ['#f1c9a5', '#e0ac69', '#c68642', '#8d5524', '#ffdbac'];
      const shirts = [C.c1, C.c1, C.c2, C.c1, C.c2, '#f2f2f2', '#1d2433'];
      const rows = [];
      let y = bottom - PX * 0.15;
      while (y > top - PX * 0.4) { const k = U.clamp((y - top) / Math.max(1, bottom - top), 0, 1); const sz = PX * (0.28 + 0.34 * k); rows.push([y, sz, k]); y -= sz * 1.05; }
      rows.reverse().forEach(([yy, sz, k]) => {
        const dim = 0.45 + 0.55 * k;
        for (let x = -sz * rnd(); x < W + sz; x += sz * (0.92 + rnd() * 0.25)) {
          const shirt = shirts[(rnd() * shirts.length) | 0], up = rnd() < 0.16 * (0.3 + A.lvl), scarf = !up && rnd() < 0.12 * A.lvl;
          ctx.globalAlpha = dim;
          if (rnd() > 0.12 + 0.88 * A.lvl) { // boş koltuk
            ctx.fillStyle = Sprites.shade(seat, -0.15 * (1 - k)); ctx.fillRect(x - sz * 0.36, yy + sz * 0.18, sz * 0.72, sz * 0.5);
            ctx.fillStyle = Sprites.shade(seat, 0.12); ctx.fillRect(x - sz * 0.36, yy + sz * 0.18, sz * 0.72, sz * 0.12);
            continue;
          }
          ctx.fillStyle = shirt;
          ctx.beginPath(); ctx.ellipse(x, yy + sz * 0.42, sz * 0.46, sz * 0.42, 0, Math.PI, 0); ctx.fill();
          ctx.fillRect(x - sz * 0.46, yy + sz * 0.42, sz * 0.92, sz * 0.4);
          ctx.fillStyle = skins[(rnd() * skins.length) | 0];
          ctx.beginPath(); ctx.arc(x, yy + sz * 0.05, sz * 0.24, 0, Math.PI * 2); ctx.fill();
          if (up) { ctx.strokeStyle = shirt; ctx.lineWidth = sz * 0.13; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - sz * 0.32, yy + sz * 0.3); ctx.lineTo(x - sz * 0.45, yy - sz * 0.45); ctx.moveTo(x + sz * 0.32, yy + sz * 0.3); ctx.lineTo(x + sz * 0.45, yy - sz * 0.45); ctx.stroke(); ctx.lineCap = 'butt'; }
          if (scarf) { ctx.fillStyle = C.c1; ctx.fillRect(x - sz * 0.7, yy - sz * 0.42, sz * 1.4, sz * 0.18); ctx.fillStyle = C.c2; for (let q = 0; q < 4; q++) ctx.fillRect(x - sz * 0.7 + q * sz * 0.35, yy - sz * 0.42, sz * 0.17, sz * 0.18); }
        }
      });
      ctx.globalAlpha = 1;
      // üstte projektör ışığı ve sis
      const hz = ctx.createLinearGradient(0, top, 0, bottom);
      hz.addColorStop(0, 'rgba(180,200,255,0.10)'); hz.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = hz; ctx.fillRect(0, top, W, bottom - top);
    }
    // dev pankart (reklam yerine): kulüp renkleri, yıldız ve oyuncunun adı
    const bt = boardY - boardH;
    const bg = ctx.createLinearGradient(0, bt, 0, boardY);
    bg.addColorStop(0, Sprites.shade(C.c1, 0.12)); bg.addColorStop(1, Sprites.shade(C.c1, -0.25));
    ctx.fillStyle = bg; ctx.fillRect(0, bt, W, boardH);
    ctx.fillStyle = C.c2; ctx.fillRect(0, bt, W, boardH * 0.1); ctx.fillRect(0, boardY - boardH * 0.1, W, boardH * 0.1);
    const label = (A.star ? ((C.name || '') + ' ' + (C.number || '')) : (A.club || 'STARFOOT')).toLocaleUpperCase('tr').trim() || 'STARFOOT';
    ctx.font = `900 italic ${Math.round(boardH * 0.6)}px "Saira Condensed", "Arial Narrow", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const seg = ctx.measureText(label).width + boardH * 2.2;
    for (let x = tx(0) - Math.ceil(tx(0) / seg) * seg; x < W + seg; x += seg) {
      ctx.fillStyle = '#ffffff'; ctx.fillText(label, x, bt + boardH * 0.53);
      ctx.fillStyle = C.c2; Sprites.star(ctx, x + seg / 2, bt + boardH * 0.5, boardH * 0.28, -Math.PI / 2);
    }
    ctx.textBaseline = 'alphabetic';
    // kumaş kıvrımı
    for (let x = 0; x < W; x += PX * 2.2) { const g2 = ctx.createLinearGradient(x, 0, x + PX * 2.2, 0); g2.addColorStop(0, 'rgba(0,0,0,0.12)'); g2.addColorStop(0.5, 'rgba(255,255,255,0.06)'); g2.addColorStop(1, 'rgba(0,0,0,0.12)'); ctx.fillStyle = g2; ctx.fillRect(x, bt, PX * 2.2, boardH); }
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillRect(0, boardY, W, 0.25 * PX);
    // fotoğrafçılar: kale direklerinin iki yanında, çömelmiş, objektifler sahaya dönük
    const ph = [];
    // ününe göre fotoğrafçı sayısı: önce kale yanları, sonra dışa doğru
    const spots = [-6.4, 6.4, -8.7, 8.6, -10.6, 10.5, -12.5, 12.6].slice(0, A.photogs);
    spots.forEach((x, i) => {
      if (x < view.x0 - 1 || x > view.x1 + 1) return;
      const px = tx(x), py = ty(-2.55 - (i % 2) * 0.25), sz = PX * 0.7;
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(px, py + sz * 0.5, sz * 0.55, sz * 0.14, 0, 0, Math.PI * 2); ctx.fill();
      // çömelmiş gövde (koyu mont) ve turuncu basın yeleği
      ctx.fillStyle = i % 3 ? '#262a33' : '#3b4150';
      rrect(ctx, px - sz * 0.42, py - sz * 0.2, sz * 0.84, sz * 0.68, sz * 0.2); ctx.fill();
      ctx.fillStyle = '#ff8a1e'; rrect(ctx, px - sz * 0.3, py - sz * 0.12, sz * 0.6, sz * 0.42, sz * 0.08); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(px - sz * 0.22, py + sz * 0.02, sz * 0.44, sz * 0.06);
      // baş ve şapka
      ctx.fillStyle = skins2[i % skins2.length]; ctx.beginPath(); ctx.arc(px, py - sz * 0.42, sz * 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = i % 2 ? '#1b1e25' : '#5a2a2a'; ctx.beginPath(); ctx.arc(px, py - sz * 0.47, sz * 0.2, Math.PI, 0); ctx.fill();
      // fotoğraf makinesi yüzün önünde, uzun objektif sahaya bakıyor
      ctx.fillStyle = '#121317'; rrect(ctx, px - sz * 0.26, py - sz * 0.4, sz * 0.52, sz * 0.24, sz * 0.05); ctx.fill();
      ctx.fillStyle = '#2a2c33'; ctx.beginPath(); ctx.arc(px + sz * 0.02, py - sz * 0.2, sz * 0.15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6f9be0'; ctx.beginPath(); ctx.arc(px + sz * 0.02, py - sz * 0.2, sz * 0.08, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(px - sz * 0.01, py - sz * 0.23, sz * 0.025, 0, Math.PI * 2); ctx.fill();
      ph.push([px, py - sz * 0.05, sz]);
    });
    // canlı efektler için konumlar
    const flags = [];
    for (let i = 0; i < Math.round(4 * A.lvl - 0.6); i++) flags.push([W * (0.1 + i * 0.27 + rnd() * 0.05), Math.max(PX * 0.3, bt - PX * (1.9 + rnd() * 1.0)), PX * (0.95 + rnd() * 0.4), i % 2]);
    Sprites._fx = { ph, flags, top: 0, bottom: Math.max(0, bt), W, C, PX, lvl: A.lvl };
  },
  // Kare kare: tribünde telefon flaşları, dalgalanan bayraklar, fotoğrafçı flaşları; hype (0..1) gol anında artar
  standsFx(ctx, t, hype = 0) {
    const F = Sprites._fx;
    if (!F || F.bottom < 4) return;
    const { W, C, PX } = F;
    // bayraklar
    F.flags.forEach(([x, y, w, alt], i) => {
      const h = w * 0.62, amp = w * (0.06 + hype * 0.06);
      ctx.strokeStyle = '#c9c9c9'; ctx.lineWidth = Math.max(1, PX * 0.05);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h * 1.9); ctx.stroke();
      ctx.beginPath();
      const N = 8;
      for (let k = 0; k <= N; k++) { const u = k / N; ctx.lineTo(x + u * w, y + Math.sin(u * 5 - t * (4 + hype * 4) + i) * amp * u); }
      for (let k = N; k >= 0; k--) { const u = k / N; ctx.lineTo(x + u * w, y + h + Math.sin(u * 5 - t * (4 + hype * 4) + i) * amp * u); }
      ctx.closePath(); ctx.fillStyle = alt ? C.c2 : C.c1; ctx.fill();
      ctx.fillStyle = alt ? C.c1 : C.c2; ctx.fillRect(x, y + h * 0.4, w * 0.25, h * 0.2);
    });
    // tribün flaşları
    const n = Math.round((3 + hype * 14) * F.lvl);
    for (let i = 0; i < n; i++) {
      const k = Math.floor(t * 7) * 13 + i * 7;
      const hx = Math.abs(Math.sin(k * 12.9898) * 43758.5453) % 1, hy = Math.abs(Math.sin(k * 78.233) * 12345.678) % 1;
      const x = hx * W, y = F.top + hy * (F.bottom - F.top), r = PX * (0.25 + hy * 0.3);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // fotoğrafçı flaşları
    F.ph.forEach(([x, y, sz], i) => {
      const on = ((Math.floor(t * (2.2 + hype * 6) + i * 1.7)) % 5) === 0;
      if (!on) return;
      const r = sz * (1.1 + hype * 0.6);
      const g = ctx.createRadialGradient(x, y - sz * 0.25, 0, x, y - sz * 0.25, r);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(230,240,255,0.6)'); g.addColorStop(1, 'rgba(230,240,255,0)');
      ctx.fillStyle = g; ctx.fillRect(x - r, y - sz * 0.25 - r, r * 2, r * 2);
    });
  },

  // Mahalle: kalenin arkasında apartmanlar ve boyalı duvar
  street(ctx, W, wallY, PX) {
    const sky = ctx.createLinearGradient(0, 0, 0, wallY);
    sky.addColorStop(0, '#7fb2df'); sky.addColorStop(1, '#cfe2f0');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, wallY);
    const cols = ['#d9c7a7', '#c98f6a', '#e7dcc6', '#b7a58a', '#d6b48c', '#a9b7b8'];
    let x = -Math.random() * 40;
    while (x < W) {
      const w = PX * (6 + Math.random() * 6), h = wallY * (0.45 + Math.random() * 0.5);
      const top = wallY - h;
      ctx.fillStyle = cols[(Math.random() * cols.length) | 0]; ctx.fillRect(x, top, w - 2, h);
      ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(x + w - 6, top, 4, h);
      const ww = Math.max(4, PX * 0.9), wh = Math.max(5, PX * 1.1);
      for (let yy = top + wh * 0.6; yy < wallY - wh * 2; yy += wh * 2) {
        for (let xx = x + ww * 0.7; xx < x + w - ww * 1.5; xx += ww * 2) {
          ctx.fillStyle = Math.random() < 0.25 ? '#ffe7a8' : '#4b5d73'; ctx.fillRect(xx, yy, ww, wh);
          if (Math.random() < 0.18) { ctx.fillStyle = '#8a6a4a'; ctx.fillRect(xx - 2, yy + wh, ww + 4, 3); }
        }
      }
      x += w;
    }
    // çamaşır ipi
    ctx.strokeStyle = 'rgba(40,40,40,0.5)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(W * 0.15, wallY * 0.35); ctx.quadraticCurveTo(W * 0.32, wallY * 0.45, W * 0.5, wallY * 0.36); ctx.stroke();
    ['#e63946', '#f1faee', '#457b9d', '#ffb703'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(W * (0.2 + i * 0.07), wallY * (0.38 + (i % 2) * 0.02), PX * 0.8, PX * 1.1); });
    // boyalı duvar
    const wh = Math.max(10, PX * 1.6);
    ctx.fillStyle = '#9aa1a6'; ctx.fillRect(0, wallY - wh, W, wh);
    ['#e76f51', '#2a9d8f', '#e9c46a', '#264653', '#f4a261'].forEach((c, i) => {
      ctx.fillStyle = c; ctx.globalAlpha = 0.75;
      ctx.beginPath(); ctx.ellipse(W * (0.1 + i * 0.2), wallY - wh * 0.5, PX * 2.4, wh * 0.32, (i - 2) * 0.2, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(0, wallY, W, 0.25 * PX);
  },

  lines(ctx, tx, ty, PX) {
    if (Sprites.surface === 'sand') {
      // tebeşirle çizilmiş silik kale alanı
      ctx.strokeStyle = 'rgba(255,250,235,0.45)';
      ctx.lineWidth = Math.max(2, PX * 0.1);
      ctx.setLineDash([PX * 0.9, PX * 0.35]);
      ctx.beginPath();
      ctx.moveTo(tx(-22), ty(0)); ctx.lineTo(tx(22), ty(0));
      ctx.rect(tx(-9), ty(0), 18 * PX, 8 * PX);
      ctx.stroke();
      ctx.setLineDash([]);
      return;
    }
    ctx.strokeStyle = 'rgba(250,252,245,0.82)';
    ctx.lineWidth = Math.max(2, PX * 0.12);
    ctx.shadowColor = 'rgba(255,255,255,0.35)'; ctx.shadowBlur = Math.max(1, PX * 0.05);
    ctx.beginPath();
    ctx.moveTo(tx(-26), ty(0)); ctx.lineTo(tx(26), ty(0));
    ctx.moveTo(tx(-26), ty(0)); ctx.lineTo(tx(-26), ty(40));
    ctx.moveTo(tx(26), ty(0)); ctx.lineTo(tx(26), ty(40));
    ctx.rect(tx(-20.16), ty(0), 40.32 * PX, 16.5 * PX);
    ctx.rect(tx(-9.16), ty(0), 18.32 * PX, 5.5 * PX);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(tx(0), ty(11), 9.15 * PX, Math.asin(5.5 / 9.15), Math.PI - Math.asin(5.5 / 9.15));
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(tx(0), ty(11), Math.max(2, PX * 0.15), 0, Math.PI * 2); ctx.fill();
    // korner yayları
    [-26, 26].forEach((x) => { ctx.beginPath(); ctx.arc(tx(x), ty(0), PX, x < 0 ? 0 : Math.PI / 2, x < 0 ? Math.PI / 2 : Math.PI); ctx.stroke(); });
    ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
    // kalenin çimdeki gölgesi (ışık önden-üstten)
    ctx.fillStyle = 'rgba(0,20,8,0.22)';
    ctx.beginPath(); ctx.moveTo(tx(-3.66), ty(0)); ctx.lineTo(tx(3.66), ty(0)); ctx.lineTo(tx(3.9), ty(-1.6)); ctx.lineTo(tx(-3.4), ty(-1.6)); ctx.closePath(); ctx.fill();
  },

  // Kale: arka ve yan fileler (eşkenar dörtgen ağ), file sallanması; çerçeve ayrı çizilir
  net(ctx, tx, ty, PX, shake) {
    const back = -2, bz = 1.7, sh = shake || 0;
    const sand = Sprites.surface === 'sand';
    // file içi hafif gölge (derinlik)
    const fg = ctx.createLinearGradient(0, ty(0, 2.44), 0, ty(back) + sh);
    fg.addColorStop(0, 'rgba(10,20,15,0.10)'); fg.addColorStop(1, 'rgba(10,20,15,0.28)');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(tx(-3.66), ty(0, 2.44)); ctx.lineTo(tx(3.66), ty(0, 2.44));
    ctx.lineTo(tx(3.66), ty(back, bz) + sh); ctx.lineTo(tx(3.66), ty(back) + sh * 0.5);
    ctx.lineTo(tx(-3.66), ty(back) + sh * 0.5); ctx.lineTo(tx(-3.66), ty(back, bz) + sh); ctx.closePath(); ctx.fill();
    // ağ: tek yolda çizilir (hızlı); çatı ve arka yüz, yan fileler
    const P = (x, y, z, f) => [tx(x), ty(y, z) + sh * f];
    const lerp = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
    ctx.strokeStyle = sand ? 'rgba(230,230,230,0.30)' : 'rgba(255,255,255,0.42)';
    ctx.lineWidth = Math.max(1, PX * 0.025);
    ctx.beginPath();
    const cols = 18, rows = 6;
    // arka yüz (üst arka çubuk -> zemin): eşkenar dörtgen için iki yönde çapraz çizgiler
    const tl = P(-3.66, back, bz, 1), tr = P(3.66, back, bz, 1), bl = P(-3.66, back, 0, 0.5), br = P(3.66, back, 0, 0.5);
    for (let i = -rows; i <= cols; i++) {
      for (const dir of [1, -1]) {
        const a0 = i / cols, a1 = (i + rows * dir) / cols;
        const p0 = lerp(tl, tr, Math.min(1, Math.max(0, a0))), p1 = lerp(bl, br, Math.min(1, Math.max(0, a1)));
        if ((a0 < 0 && a1 < 0) || (a0 > 1 && a1 > 1)) continue;
        ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]);
      }
    }
    // çatı (direk üstü -> arka üst): enine ve boyuna
    for (let k = 0; k <= 4; k++) { const f = k / 4, y = back * f, z = 2.44 + (bz - 2.44) * f; const a = P(-3.66, y, z, f), b = P(3.66, y, z, f); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
    for (let x = -3.66; x <= 3.67; x += 0.61) { const a = P(x, 0, 2.44, 0), b = P(x, back, bz, 1); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
    // yan fileler
    for (const sx of [-3.66, 3.66]) {
      for (let k = 1; k <= 3; k++) { const f = k / 4; const a = P(sx, back * f, 2.44 + (bz - 2.44) * f, f), b = P(sx, back * f, 0, f * 0.5); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
    }
    ctx.stroke();
    // arka direkler (file taşıyıcıları)
    ctx.strokeStyle = sand ? 'rgba(170,175,180,0.8)' : 'rgba(225,228,232,0.85)'; ctx.lineWidth = Math.max(1.5, PX * 0.05);
    ctx.beginPath();
    for (const sx of [-3.66, 3.66]) { const a = P(sx, 0, 2.44, 0), b = P(sx, back, bz, 1), c = P(sx, back, 0, 0.5); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); }
    const a2 = P(-3.66, back, bz, 1), b2 = P(3.66, back, bz, 1); ctx.moveTo(a2[0], a2[1]); ctx.lineTo(b2[0], b2[1]);
    ctx.stroke();
  },

  // Direkler ve üst direk: yuvarlak profil hissi (gölgeli beyaz boru)
  frame(ctx, tx, ty, PX) {
    const lw = Math.max(3, PX * 0.16);
    const sand = Sprites.surface === 'sand';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const path = (ox, oy) => { ctx.beginPath(); ctx.moveTo(tx(-3.66) + ox, ty(0) + oy); ctx.lineTo(tx(-3.66) + ox, ty(0, 2.44) + oy); ctx.lineTo(tx(3.66) + ox, ty(0, 2.44) + oy); ctx.lineTo(tx(3.66) + ox, ty(0) + oy); };
    // gölge
    ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = lw; path(lw * 0.5, lw * 0.35); ctx.stroke();
    // boru: koyu kenar, beyaz gövde, parlak çizgi
    ctx.strokeStyle = sand ? '#8f979c' : '#c9ced6'; ctx.lineWidth = lw * 1.12; path(0, 0); ctx.stroke();
    ctx.strokeStyle = sand ? '#b9c0c4' : '#ffffff'; ctx.lineWidth = lw * 0.82; path(-lw * 0.08, -lw * 0.06); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = Math.max(1, lw * 0.22); path(-lw * 0.22, -lw * 0.2); ctx.stroke();
    ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
  },
};
