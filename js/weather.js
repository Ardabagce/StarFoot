// Hava durumu, maç topu seçimi ve lige özel skorbord stilleri

const WEATHER = {
  clear: { id: 'clear', l: 'Açık', fric: 1, wind: 0, sigma: 1, vis: 0 },
  rain: { id: 'rain', l: 'Yağmurlu', fric: 0.72, wind: 0, sigma: 1.15, vis: 0.1, note: 'Islak zeminde top daha çok kayar, vuruşlar biraz daha az isabetli.' },
  snow: { id: 'snow', l: 'Karlı', fric: 1.7, wind: 0, sigma: 1.1, vis: 0.15, note: 'Karda top çabuk durur. Turuncu kış topu oyunda.' },
  wind: { id: 'wind', l: 'Rüzgarlı', fric: 1, wind: 0, sigma: 1.05, vis: 0, note: 'Havadaki toplar rüzgarla sürüklenir.' },
  fog: { id: 'fog', l: 'Sisli', fric: 1, wind: 0, sigma: 1, vis: 0.5, note: 'Sis yüzünden vuruş önizlemesi kısa kalır.' },
};

const Weather = {
  // Kuzey ligleri kışın daha soğuk ve yağışlı
  pick(ctx, state) {
    const round = state && state.season ? state.season.round : 10;
    const winter = round >= 12 && round <= 26;
    const lg = ctx.lg || '';
    const north = ['ENG', 'ENG2', 'GER', 'GER2', 'TR1', 'TR2', 'NED', 'BEL', 'SCO', 'AUT', 'SUI', 'DEN', 'CZE', 'POL', 'UKR', 'youth', 'ucl', 'uel', 'uecl'].includes(lg);
    const summer = ['wc', 'euro', 'intl', 'street', 'BRA', 'ARG', 'csa', 'KSA', 'MEX', 'ccc', 'acl'].includes(lg);
    const w = {
      clear: summer ? 70 : 50,
      rain: (lg === 'ENG' ? 28 : 18) + (winter ? 6 : 0),
      wind: 10,
      fog: lg === 'ENG' || (winter && north) ? 8 : 3,
      snow: winter && north && !summer ? 12 : 0,
    };
    const id = U.weighted(Object.keys(w), (k) => w[k]);
    const base = WEATHER[id];
    const temp = id === 'snow' ? U.randi(-6, 1) : summer ? U.randi(20, 31) : winter ? U.randi(1, 12) : U.randi(9, 24);
    const out = Object.assign({}, base, { temp });
    if (id === 'wind') {
      const kmh = U.randi(22, 48);
      out.kmh = kmh;
      out.dir = U.pick([-1, 1]);
      out.wind = out.dir * kmh / 18;
    }
    return out;
  },

  label(w) {
    if (!w) return '';
    return `${w.l} · ${w.temp}°C${w.kmh ? ` · ${w.dir > 0 ? '→' : '←'} ${w.kmh} km/s rüzgar` : ''}`;
  },

  apply(w) {
    BallPhys.env = { fric: w ? w.fric : 1, wind: w ? w.wind : 0 };
  },

  reset() { BallPhys.env = { fric: 1, wind: 0 }; },

  // Canvas üstüne hava efekti; parçacıklar w._fx içinde tutulur
  draw(ctx, w, W, H, dpr, t) {
    if (!w || w.id === 'clear') return;
    if (w.id === 'rain' || w.id === 'snow') {
      const fx = w._fx || (w._fx = Array.from({ length: w.id === 'rain' ? 140 : 90 }, () => ({ x: Math.random(), y: Math.random(), s: U.rand(0.6, 1.2) })));
      if (w.id === 'rain') {
        ctx.fillStyle = 'rgba(20,40,80,0.18)'; ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = 'rgba(200,225,255,0.5)'; ctx.lineWidth = 1.2 * dpr;
        ctx.beginPath();
        fx.forEach((p) => {
          const y = ((p.y + t * 1.6 * p.s) % 1) * H, x = ((p.x + t * 0.25) % 1) * W;
          ctx.moveTo(x, y); ctx.lineTo(x - 4 * dpr, y + 16 * dpr * p.s);
        });
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(235,245,255,0.14)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        fx.forEach((p) => {
          const y = ((p.y + t * 0.18 * p.s) % 1) * H, x = ((p.x + Math.sin(t + p.y * 9) * 0.02) % 1 + 1) % 1 * W;
          ctx.beginPath(); ctx.arc(x, y, 2.2 * dpr * p.s, 0, Math.PI * 2); ctx.fill();
        });
      }
    } else if (w.id === 'fog') {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, 'rgba(210,220,230,0.75)'); g.addColorStop(0.45, 'rgba(210,220,230,0.25)'); g.addColorStop(1, 'rgba(210,220,230,0.08)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    } else if (w.id === 'wind') {
      const fx = w._fx || (w._fx = Array.from({ length: 18 }, () => ({ x: Math.random(), y: Math.random(), s: U.rand(0.6, 1.4) })));
      ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 2 * dpr; ctx.lineCap = 'round';
      fx.forEach((p) => {
        const x = (((p.x + t * 0.35 * p.s * w.dir) % 1) + 1) % 1 * W, y = p.y * H;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - w.dir * 34 * dpr * p.s, y); ctx.stroke();
      });
      ctx.lineCap = 'butt';
    }
  },
};

// Maç topu: kozmetik top seçiliyse o, değilse lig/turnuva topu (kar yağınca kış topu)
const Balls = {
  forMatch(ctx, w, year) {
    const p = Game.p;
    if (p.ballSkin && BALL_STYLES[p.ballSkin]) return BALL_STYLES[p.ballSkin];
    if (w && w.id === 'snow') return BALL_STYLES.winter;
    const lg = ctx.lg || '';
    if (lg === 'street') return BALL_STYLES.street;
    if (year < 1993 && !['ucl', 'uel', 'wc', 'euro'].includes(lg)) return year < 1986 ? BALL_STYLES.retro : BALL_STYLES.classic;
    const map = { TR1: 'tr', TR2: 'tr', ENG: 'eng', ENG2: 'eng', ESP: 'esp', ESP2: 'esp', GER: 'ger', GER2: 'ger', ITA: 'ita', ITA2: 'ita', FRA: 'fra', FRA2: 'fra', NED: 'ned', POR: 'por', BRA: 'bra', ARG: 'arg', BEL: 'ned', SCO: 'eng', USA: 'eng', MEX: 'arg', KSA: 'wc', JPN: 'ita', ccc: 'csa', acl: 'wc', ucl: 'ucl', uel: 'uel', uecl: 'uecl', csa: 'csa', wc: 'wc', euro: 'euro', youth: 'classic', intl: 'classic' };
    return BALL_STYLES[map[lg] || 'classic'];
  },
  forTraining() {
    const p = Game.p;
    return p.ballSkin && BALL_STYLES[p.ballSkin] ? BALL_STYLES[p.ballSkin] : BALL_STYLES.classic;
  },
  // Mağaza ürünü ya da önizleme için küçük topu SVG yerine canvas'tan data URL olarak çizer
  thumb(style, size = 64) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    Sprites.ball(c.getContext('2d'), size / 2, size / 2, size * 0.42, 0.4, style);
    return c.toDataURL();
  },
};

// Turnuva temaları: Maç Günü kartı ve maç ekranı (renk + desen)
const COMP_THEMES = {
  ucl: { c1: '#071538', c2: '#1d3c8f', a: '#c0d6ff', fx: 'stars', l: 'Şampiyonlar Kupası Gecesi' },
  uel: { c1: '#1b1d22', c2: '#7a2e08', a: '#ff8a3d', fx: 'rays', l: 'Federasyon Kupası Gecesi' },
  uecl: { c1: '#05261a', c2: '#0b7a3e', a: '#5ee39a', fx: 'rays', l: 'Konferans Kupası Gecesi' },
  csa: { c1: '#141b30', c2: '#6b5414', a: '#ffcf3f', fx: 'stars', l: 'Güney Amerika Kupası' },
  ccc: { c1: '#081a33', c2: '#0e7490', a: '#67e8f9', fx: 'stars', l: 'Kuzey Amerika Kupası' },
  acl: { c1: '#1c0b2e', c2: '#6b21a8', a: '#e9b8ff', fx: 'stars', l: 'Asya Şampiyonlar Kupası' },
  ygl: { c1: '#160b33', c2: '#4c1d95', a: '#c4b5fd', fx: 'stars', l: 'Avrupa Gelişim Ligi' },
  dom: { c1: '#2a0a10', c2: '#8a1328', a: '#ffd166', fx: 'rays', l: 'Kupa Maçı' },
  wc: { c1: '#2e0812', c2: '#7a1a2e', a: '#ffcf3f', fx: 'gold', l: 'Dünya Kupası' },
  euro: { c1: '#071a4a', c2: '#1d4ed8', a: '#93c5fd', fx: 'rays', l: 'Avrupa Şampiyonası' },
  nl: { c1: '#04201d', c2: '#0f766e', a: '#5eead4', fx: 'rays', l: 'Uluslar Ligi Finalleri' },
};
const CompTheme = {
  // milli maçta ülke renkleri kullanılır
  get(key, nat) {
    if (key === 'intl') {
      const col = (typeof NAT_COLORS !== 'undefined' && NAT_COLORS[nat]) || ['#c8102e', '#ffffff'];
      const dark = Sprites.colorDist(col[0], '#ffffff') < 60 ? col[1] : col[0];
      return { c1: '#060b1c', c2: dark, a: Sprites.colorDist(col[1], '#000000') < 80 ? '#ffffff' : col[1], fx: 'rays', l: 'Milli Maç' };
    }
    return COMP_THEMES[key] || null;
  },
  vars(t) { return t ? `--ct1:${t.c1};--ct2:${t.c2};--cta:${t.a}` : ''; },
  cls(t) { return t ? `themed fx-${t.fx}` : ''; },
};

// Lige özel skorbord renkleri
const SCOREBOARDS = {
  TR1: { tag: 'SÜPER LİG', c1: '#e30a17', c2: '#ffffff' },
  TR2: { tag: '1. LİG', c1: '#0b4ea2', c2: '#ffffff' },
  ENG2: { tag: 'ŞAMPİYONLUK', c1: '#1f2a44', c2: '#ffcf3f' },
  ESP2: { tag: 'LALİGA 2', c1: '#c8102e', c2: '#ffffff' },
  GER2: { tag: '2. BUNDESLİGA', c1: '#7a0a0a', c2: '#ffffff' },
  ITA2: { tag: 'SERİE B', c1: '#0b7a3e', c2: '#ffffff' },
  FRA2: { tag: 'LİGUE 2', c1: '#f36f21', c2: '#091c3e' },
  NED: { tag: 'LALE LİGİ', c1: '#f36f21', c2: '#ffffff' },
  POR: { tag: 'ATLANTİK', c1: '#006a44', c2: '#ffcf3f' },
  BRA: { tag: 'SAMBA LİGİ', c1: '#009c3b', c2: '#ffdf00' },
  ARG: { tag: 'TANGO LİGİ', c1: '#75aadb', c2: '#ffffff' },
  uecl: { tag: 'KONFERANS', c1: '#0b7a3e', c2: '#ffffff' },
  csa: { tag: 'GÜNEY AMERİKA', c1: '#1f2a44', c2: '#ffcf3f' },
  ccc: { tag: 'KUZEY AMERİKA', c1: '#0b1f4d', c2: '#ffffff' },
  acl: { tag: 'ASYA ŞAMPİYONLAR', c1: '#5b2c83', c2: '#ffcf3f' },
  BEL: { tag: 'FLAMAN LİGİ', c1: '#1d1d1b', c2: '#ffd200' },
  SCO: { tag: 'DAĞLILAR LİGİ', c1: '#0b2a5a', c2: '#ffffff' },
  AUT: { tag: 'ALP LİGİ', c1: '#c8102e', c2: '#ffffff' },
  SUI: { tag: 'ALPLER SÜPER LİG', c1: '#1b1d22', c2: '#e30613' },
  GRE: { tag: 'EGE LİGİ', c1: '#0d5eaf', c2: '#ffffff' },
  DEN: { tag: 'VİKİNG LİGİ', c1: '#c8102e', c2: '#ffffff' },
  CRO: { tag: 'ADRİYATİK', c1: '#171796', c2: '#ffffff' },
  CZE: { tag: 'BOHEMYA LİGİ', c1: '#11457e', c2: '#ffffff' },
  POL: { tag: 'VİSTÜL LİGİ', c1: '#1b1d22', c2: '#dc143c' },
  UKR: { tag: 'BOZKIR LİGİ', c1: '#005bbb', c2: '#ffd500' },
  USA: { tag: 'YILDIZLI LİG', c1: '#0b1f4d', c2: '#e31b23' },
  MEX: { tag: 'AZTEK LİGİ', c1: '#006847', c2: '#ffffff' },
  KSA: { tag: 'ÇÖL LİGİ', c1: '#006c35', c2: '#ffffff' },
  JPN: { tag: 'GÜNEŞ LİGİ', c1: '#ffffff', c2: '#bc002d' },
  ENG: { tag: 'PREMIER', c1: '#3d0a5b', c2: '#00ff85' },
  ESP: { tag: 'LA LİGA', c1: '#ff4b1f', c2: '#ffffff' },
  GER: { tag: 'BUNDESLİGA', c1: '#d20515', c2: '#ffffff' },
  ITA: { tag: 'SERİE A', c1: '#0a2a6b', c2: '#32c66e' },
  FRA: { tag: 'LİGUE 1', c1: '#091c3e', c2: '#dafc00' },
  ucl: { tag: 'ŞAMPİYONLAR', c1: '#0b1f4d', c2: '#c0d6ff' },
  uel: { tag: 'FEDERASYON', c1: '#f36f21', c2: '#1b1d22' },
  wc: { tag: 'DÜNYA KUPASI', c1: '#7a1a2e', c2: '#ffcf3f' },
  euro: { tag: 'EURO', c1: '#1d4ed8', c2: '#ffffff' },
  intl: { tag: 'MİLLİ MAÇ', c1: '#c8102e', c2: '#ffffff' },
  youth: { tag: 'ALTYAPI', c1: '#16a34a', c2: '#ffffff' },
  street: { tag: 'MAHALLE', c1: '#6b7280', c2: '#ffffff' },
};
