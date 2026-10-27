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
  shade(h, f) {
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

    // bacaklar
    const legW = h * 0.1;
    const hipY = by - h * 0.46;
    const drawLeg = (dx, swing, kickA) => {
      ctx.save();
      ctx.translate(sx + dx, hipY);
      ctx.rotate(kickA || swing * 0.45);
      const L = h * 0.46;
      ctx.fillStyle = look.skin; ctx.fillRect(-legW / 2, 0, legW, L * 0.45);
      ctx.fillStyle = kit.socks; ctx.fillRect(-legW / 2, L * 0.42, legW, L * 0.5);
      ctx.fillStyle = Sprites.shade(kit.socks, -0.25); ctx.fillRect(-legW / 2, L * 0.42, legW, L * 0.06);
      ctx.fillStyle = look.boots || '#16181d';
      ctx.beginPath(); ctx.ellipse(0, L * 0.95, legW * 0.62, legW * 0.42, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };
    const kick = o.kick || 0; // 0..1
    drawLeg(-W * 0.2, -sw, 0);
    drawLeg(W * 0.2, sw, kick ? (up ? -1 : 1) * Math.sin(kick * Math.PI) * 1.1 : 0);

    // şort
    ctx.fillStyle = kit.shorts;
    ctx.beginPath();
    ctx.moveTo(sx - W * 0.47, hipY + h * 0.06);
    ctx.lineTo(sx - W * 0.5, hipY - h * 0.08);
    ctx.lineTo(sx + W * 0.5, hipY - h * 0.08);
    ctx.lineTo(sx + W * 0.47, hipY + h * 0.06);
    ctx.lineTo(sx + W * 0.04, hipY + h * 0.05);
    ctx.lineTo(sx, hipY - h * 0.01);
    ctx.lineTo(sx - W * 0.04, hipY + h * 0.05);
    ctx.closePath(); ctx.fill();

    // kollar (gövdenin arkasında kalan kısım)
    const shY = by - h * 0.82;
    const drawArm = (side, swing) => {
      ctx.save();
      ctx.translate(sx + side * W * 0.52, shY + h * 0.03);
      ctx.rotate(side * 0.12 - side * (o.armA || 0) + swing * 0.5);
      const aw = h * 0.085, L = h * 0.32;
      ctx.fillStyle = look.skin; ctx.fillRect(-aw / 2, 0, aw, L);
      ctx.fillStyle = kit.shirt; ctx.fillRect(-aw / 2 - 1, 0, aw + 2, L * 0.38);
      if (o.gloves) { ctx.fillStyle = '#f0f0f0'; const gw = o.dive ? aw * 1.7 : aw + 2; ctx.beginPath(); ctx.ellipse(0, L * 0.98, gw / 2, L * (o.dive ? 0.16 : 0.11), 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    };
    const armsUp = o.dive || 0;
    if (!armsUp) {
      drawArm(-1, sw);
      drawArm(1, -sw);
    }

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
    ctx.beginPath(); ctx.arc(sx, hy, hr, 0, Math.PI * 2); ctx.fill();
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
  ball(ctx, x, y, r, rot, style) {
    const B = style || Sprites.curBall || BALL_STYLES.classic;
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
  grass(ctx, W, H, tx, ty, PX, view) {
    if (Sprites.surface === 'sand') {
      Sprites.sand(ctx, W, H);
      ctx.fillStyle = 'rgba(90,60,30,0.25)';
      if (view.x0 < -26) ctx.fillRect(0, 0, tx(-26.5), H);
      if (view.x1 > 26) ctx.fillRect(tx(26.5), 0, W - tx(26.5), H);
      return;
    }
    ctx.fillStyle = '#1f6b34';
    ctx.fillRect(0, 0, W, H);
    // biçilmiş çim şeritleri
    for (let y = Math.floor(view.y0 / 5) * 5; y < view.y1; y += 5) {
      const i = Math.round(y / 5);
      ctx.fillStyle = Sprites.stripe(i);
      ctx.fillRect(0, ty(y), W, 5 * PX + 1);
    }
    for (let x = Math.floor(view.x0 / 6) * 6; x < view.x1; x += 6) {
      if (Math.round(x / 6) % 2) { ctx.fillStyle = 'rgba(255,255,255,0.035)'; ctx.fillRect(tx(x), 0, 6 * PX, H); }
    }
    // doku
    const n = Math.round((W * H) / 900);
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.04)';
      ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
    }
    // saha dışı
    ctx.fillStyle = '#1a5a2c';
    if (view.x0 < -26) ctx.fillRect(0, 0, tx(-26.5), H);
    if (view.x1 > 26) ctx.fillRect(tx(26.5), 0, W - tx(26.5), H);
  },

  // Kalenin arkasındaki reklam panoları ve tribün
  stands(ctx, W, tx, ty, PX, view, fs) {
    const boardY = ty(-3.2), boardH = 0.9 * PX;
    if (view.y0 > -3.2) return;
    if (Sprites.surface === 'sand') return Sprites.street(ctx, W, boardY, PX);
    // tribün
    const top = 0, bottom = boardY - boardH;
    if (bottom > top) {
      const g = ctx.createLinearGradient(0, top, 0, bottom);
      g.addColorStop(0, '#0d1424'); g.addColorStop(1, '#1d2a44');
      ctx.fillStyle = g; ctx.fillRect(0, top, W, bottom - top);
      const step = Math.max(5, PX * 0.55);
      const cols = ['#e8e1d0', '#c8102e', '#f4c430', '#2a6fdb', '#ffffff', '#1d2433'];
      for (let y = bottom - step * 0.6; y > top; y -= step) {
        for (let x = (Math.floor(y / step) % 2) * step * 0.5; x < W; x += step) {
          if (Math.random() < 0.12) continue;
          ctx.fillStyle = cols[(Math.random() * cols.length) | 0];
          ctx.globalAlpha = 0.55 + 0.4 * ((y - top) / Math.max(1, bottom - top));
          ctx.beginPath(); ctx.arc(x + Math.random() * 2, y, step * 0.28, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }
    // panolar
    const ads = [['STARFOOT', '#0f1b3d', '#ffcf3f'], ['ANADOLU ENERJİ', '#c8102e', '#ffffff'], ['KARTAL SİGORTA', '#123c7a', '#ffffff'], ['BOSFOR BANK', '#0b6e4f', '#ffffff'], ['YILDIZ KOLA', '#e30613', '#ffffff'], ['GALATA TELEKOM', '#ffcf3f', '#0f1b3d']];
    const pw = 9 * PX;
    let i = 0;
    for (let x = tx(-60); x < W; x += pw, i++) {
      const [txt, bg, fg] = ads[((i % ads.length) + ads.length) % ads.length];
      ctx.fillStyle = bg; ctx.fillRect(x, boardY - boardH, pw - 2, boardH);
      ctx.fillStyle = fg;
      ctx.font = `800 ${Math.round(boardH * 0.55)}px "Saira Condensed", "Arial Narrow", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(txt, x + pw / 2, boardY - boardH / 2);
      ctx.textBaseline = 'alphabetic';
    }
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, boardY, W, 0.25 * PX);
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
    ctx.strokeStyle = 'rgba(255,255,255,0.88)';
    ctx.lineWidth = Math.max(2, PX * 0.12);
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
  },

  // Kale: arka file + yan file (çerçeve ayrı çizilir)
  net(ctx, tx, ty, PX, shake) {
    const back = -2, bz = 1.7;
    const sh = shake || 0;
    ctx.fillStyle = 'rgba(240,240,240,0.10)';
    ctx.beginPath();
    ctx.moveTo(tx(-3.66), ty(0, 2.44)); ctx.lineTo(tx(3.66), ty(0, 2.44));
    ctx.lineTo(tx(3.66), ty(back, bz) + sh); ctx.lineTo(tx(-3.66), ty(back, bz) + sh);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(240,240,240,0.07)';
    ctx.fillRect(tx(-3.66), ty(back, bz) + sh, 7.32 * PX, ty(back) - ty(back, bz));
    ctx.strokeStyle = 'rgba(255,255,255,0.38)'; ctx.lineWidth = 1;
    for (let x = -3.66; x <= 3.67; x += 0.4) {
      ctx.beginPath(); ctx.moveTo(tx(x), ty(0, 2.44)); ctx.lineTo(tx(x), ty(back, bz) + sh); ctx.lineTo(tx(x), ty(back) + sh * 0.5); ctx.stroke();
    }
    for (let z = 0; z <= bz; z += 0.4) {
      ctx.beginPath(); ctx.moveTo(tx(-3.66), ty(back, z) + sh); ctx.lineTo(tx(3.66), ty(back, z) + sh); ctx.stroke();
    }
    for (let f = 0.2; f < 1; f += 0.2) {
      const y = 0 + (back - 0) * f, z = 2.44 + (bz - 2.44) * f;
      ctx.beginPath(); ctx.moveTo(tx(-3.66), ty(y, z) + sh * f); ctx.lineTo(tx(3.66), ty(y, z) + sh * f); ctx.stroke();
    }
  },

  frame(ctx, tx, ty, PX) {
    const lw = Math.max(3, PX * 0.16);
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.moveTo(tx(-3.66) + lw, ty(0) + lw * 0.3); ctx.lineTo(tx(3.66) + lw, ty(0) + lw * 0.3); ctx.stroke();
    ctx.strokeStyle = Sprites.surface === 'sand' ? '#b9c0c4' : '#ffffff'; ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(tx(-3.66), ty(0)); ctx.lineTo(tx(-3.66), ty(0, 2.44));
    ctx.lineTo(tx(3.66), ty(0, 2.44)); ctx.lineTo(tx(3.66), ty(0));
    ctx.stroke();
    ctx.lineCap = 'butt';
  },
};
