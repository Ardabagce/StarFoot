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
    const north = ['ENG', 'GER', 'TR1', 'TR2', 'youth', 'ucl', 'uel'].includes(lg);
    const summer = ['wc', 'euro', 'intl', 'street'].includes(lg);
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
    const map = { TR1: 'tr', TR2: 'tr', ENG: 'eng', ESP: 'esp', GER: 'ger', ITA: 'ita', FRA: 'fra', ucl: 'ucl', uel: 'uel', wc: 'wc', euro: 'euro', youth: 'classic', intl: 'classic' };
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

// Lige özel skorbord renkleri
const SCOREBOARDS = {
  TR1: { tag: 'SÜPER LİG', c1: '#e30a17', c2: '#ffffff' },
  TR2: { tag: '1. LİG', c1: '#0b4ea2', c2: '#ffffff' },
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
