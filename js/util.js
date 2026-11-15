// Yardımcı fonksiyonlar
const U = {
  // Lisans nedeniyle değişen turnuva/ödül adları: eski kayıtlarda da yeni adla görünsün (eski adlar kaçışlı)
  OLD_NAMES: [
    ['\u0046\u0049\u0046\u0041\u0027\u006e\u0131\u006e', "Federasyonun"],
    ['\u0046\u0049\u0046\u0041', "Federasyon"],
    ['\u0044\u00fc\u006e\u0079\u0061\u0020\u004b\u0075\u0070\u0061\u0073\u0131', "Dünya Şampiyonası"],
    ['\u0044\u00dc\u004e\u0059\u0041\u0020\u004b\u0055\u0050\u0041\u0053\u0049', "DÜNYA ŞAMPİYONASI"],
    ['\u0041\u0076\u0072\u0075\u0070\u0061\u0020\u015e\u0061\u006d\u0070\u0069\u0079\u006f\u006e\u0061\u0073\u0131', "Avrupa Milletler Şampiyonası"],
    ['\u0041\u0056\u0052\u0055\u0050\u0041\u0020\u015e\u0041\u004d\u0050\u0130\u0059\u004f\u004e\u0041\u0053\u0049', "AVRUPA MİLLETLER ŞAMPİYONASI"],
    ['\u0055\u006c\u0075\u0073\u006c\u0061\u0072\u0020\u004c\u0069\u0067\u0069', "Milletler Ligi"],
    ['\u0041\u0076\u0072\u0075\u0070\u0061\u0020\u004b\u006f\u006e\u0066\u0065\u0072\u0061\u006e\u0073\u0020\u004b\u0075\u0070\u0061\u0073\u0131', "Avrupa Kıta Kupası"],
    ['\u004b\u006f\u006e\u0066\u0065\u0072\u0061\u006e\u0073\u0020\u004b\u0075\u0070\u0061\u0073\u0131', "Kıta Kupası"],
    ['\u004b\u006f\u006e\u0066\u0065\u0072\u0061\u006e\u0073\u0020\u004b\u002e', "Kıta K."],
    ['\u004b\u006f\u006e\u0066\u0065\u0072\u0061\u006e\u0073\u0020\u005a\u0061\u0066\u0065\u0072\u0069', "Kıta Zaferi"],
    ['\u0041\u006c\u0074\u0131\u006e\u0020\u0054\u006f\u0070\u0027\u0075', "Altın Yıldız'ı"],
    ['\u0041\u006c\u0074\u0131\u006e\u0020\u0054\u006f\u0070', "Altın Yıldız"],
    ['\u0041\u004c\u0054\u0049\u004e\u0020\u0054\u004f\u0050', "ALTIN YILDIZ"],
    ['\u0041\u006c\u0074\u0131\u006e\u0020\u0041\u0079\u0061\u006b\u006b\u0061\u0062\u0131', "Gol Kralı Kupası"],
    ['\u0042\u0072\u0069\u0074\u0061\u006e\u0079\u0061\u0020\u0050\u0072\u0065\u006d\u0069\u0065\u0072\u0020\u004c\u0069\u0067\u0069', "Britanya Birinci Ligi"],
    ['\u0042\u0072\u0069\u0074\u0061\u006e\u0079\u0061\u0020\u015e\u0061\u006d\u0070\u0069\u0079\u006f\u006e\u006c\u0075\u006b\u0020\u004c\u0069\u0067\u0069', "Britanya İkinci Ligi"],
    ['\u0041\u006c\u0070\u006c\u0065\u0072\u0020\u0053\u00fc\u0070\u0065\u0072\u0020\u004c\u0069\u0067\u0069', "Helvetya Ligi"],
    ['\u00c7\u0069\u007a\u006d\u0065\u0020\u0042\u0020\u004c\u0069\u0067\u0069', "Çizme 2. Ligi"],
  ],
  renameOld(raw) {
    if (!raw || typeof raw !== 'string') return raw;
    for (const [a, b] of U.OLD_NAMES) if (raw.includes(a)) raw = raw.split(a).join(b);
    return raw;
  },
  rand: (a, b) => a + Math.random() * (b - a),
  randi: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
  chance: (p) => Math.random() < p,
  clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
  sigmoid: (x) => 1 / (1 + Math.exp(-x)),
  gauss() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  },
  poisson(lambda) {
    const L = Math.exp(-lambda);
    let k = 0, p = 1;
    do { k++; p *= Math.random(); } while (p > L);
    return k - 1;
  },
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },
  weighted(items, wfn) {
    const total = items.reduce((s, it) => s + wfn(it), 0);
    let r = Math.random() * total;
    for (const it of items) {
      r -= wfn(it);
      if (r <= 0) return it;
    }
    return items[items.length - 1];
  },
  // Rengin parlaklığı (0-1), yazı rengi seçmek için
  lum(hex) {
    const h = hex.replace('#', '');
    const v = h.length === 3 ? h.split('').map((c) => parseInt(c + c, 16)) : [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    return (0.299 * v[0] + 0.587 * v[1] + 0.114 * v[2]) / 255;
  },
  // Para birimi: oyun içi tutarlar TL'dir; ekranda telefonun bölgesine göre ₺ / $ / € / £ gösterilir
  CUR: { TRY: { sym: '₺', rate: 1 }, USD: { sym: '$', rate: 1 / 42 }, EUR: { sym: '€', rate: 1 / 48 }, GBP: { sym: '£', rate: 1 / 56 } },
  curAuto() {
    const loc = (typeof navigator !== 'undefined' && ((navigator.languages && navigator.languages[0]) || navigator.language)) || 'tr-TR';
    const [lang, reg] = loc.replace('_', '-').split('-').map((x) => (x || '').toUpperCase());
    const EZ = ['DE', 'FR', 'ES', 'IT', 'NL', 'PT', 'BE', 'AT', 'IE', 'FI', 'GR', 'SK', 'SI', 'EE', 'LV', 'LT', 'LU', 'MT', 'CY', 'HR'];
    if (reg === 'TR' || (!reg && lang === 'TR')) return 'TRY';
    if (reg === 'GB') return 'GBP';
    if (EZ.includes(reg) || (!reg && ['DE', 'FR', 'ES', 'IT', 'NL', 'PT', 'EL', 'FI'].includes(lang))) return 'EUR';
    if (lang === 'TR') return 'TRY';
    return 'USD';
  },
  cur() {
    let c = null;
    try { c = localStorage.getItem('starfoot_cur'); } catch (e) { /* yok */ }
    return U.CUR[c] ? c : U.curAuto();
  },
  money(n) {
    const code = U.cur(), C = U.CUR[code];
    const en = typeof I18N !== 'undefined' && I18N.lang !== 'tr';
    const v = n * C.rate, abs = Math.abs(v);
    const dec = code !== 'TRY' && abs < 10 && abs > 0 ? 2 : 0;
    let s;
    if (en) {
      if (abs >= 1e9) s = (v / 1e9).toFixed(2) + 'B';
      else if (abs >= 1e6) s = (v / 1e6).toFixed(2) + 'M';
      else s = (dec ? v : Math.round(v)).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
      return (v < 0 ? '-' : '') + C.sym + s.replace('-', '');
    }
    if (abs >= 1e9) s = (v / 1e9).toFixed(2).replace('.', ',') + ' Mr';
    else if (abs >= 1e6) s = (v / 1e6).toFixed(2).replace('.', ',') + ' Mn';
    else s = (dec ? v : Math.round(v)).toLocaleString('tr-TR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    return s + ' ' + C.sym;
  },
  // Emojileri ve bayrakları metinden ayıklar (arayüz kendi ikonlarını kullanır)
  plain(s) {
    return String(s)
      .replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{200D}\u{1F3FB}-\u{1F3FF}\u{E0020}-\u{E007F}\u{20E3}]/gu, '')
      .replace(/^\s+/, '')
      .replace(/\s{2,}/g, ' ');
  },
  esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },
  el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  },
  $(sel, root = document) { return root.querySelector(sel); },
  $$(sel, root = document) { return Array.from(root.querySelectorAll(sel)); },
};

// ---------- Çizim alanı koruması (iOS) ----------
// iOS'ta tüm canvas'ların toplam bellek sınırı dolunca getContext('2d') null döner ve çizim kodu hata verir.
// Önce önbellekteki görseller boşaltılıp yeniden denenir; yine olmazsa hata vermeyen boş bir bağlam döner
// (o kare çizilmez ama oyun çökmez).
(() => {
  if (typeof HTMLCanvasElement === 'undefined') return;
  const orig = HTMLCanvasElement.prototype.getContext;
  const dummy = (cv) => {
    let px;
    const fn = () => px;
    px = new Proxy(fn, {
      get(t, k) {
        if (k === 'canvas') return cv;
        if (k === 'measureText') return () => ({ width: 0 });
        if (k === 'getImageData' || k === 'createImageData') return (a, b, w, h) => new ImageData(Math.max(1, w || a | 0 || 1), Math.max(1, h || b | 0 || 1));
        if (k === 'isPointInPath' || k === 'isPointInStroke') return () => false;
        if (k === 'getLineDash') return () => [];
        if (k === Symbol.toPrimitive) return () => '';
        return fn;
      },
      set() { return true; },
      apply() { return px; },
    });
    return px;
  };
  HTMLCanvasElement.prototype.getContext = function (type, opts) {
    let c = orig.call(this, type, opts);
    if (c || (type !== '2d')) return c;
    try {
      if (typeof SocialArt !== 'undefined' && SocialArt.cache) SocialArt.cache.clear();
      if (typeof Sprites !== 'undefined') { Sprites._turf = {}; if (Sprites._tile) Sprites._tile = null; }
    } catch (e) { /* yok */ }
    c = orig.call(this, type, opts);
    if (c) return c;
    if (!window.__cvLow) {
      window.__cvLow = 1;
      try { const F = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.FirebaseAnalytics; if (F && F.logEvent) F.logEvent({ name: 'canvas_low', params: { w: this.width, h: this.height } }).catch(() => {}); } catch (e) { /* yok */ }
    }
    return dummy(this);
  };
})();

// ---------- Ekran koruması ----------
// iOS WebView bazen bir pencere ya da tam ekran katman kapanınca alttaki sayfayı yeniden çizmiyor
// (boş/beyaz ekran). Kapanma anında sayfa zorla yeniden çizilir. Ayrıca beklenmeyen bir hata olursa
// ekran geri getirilir ve hata Firebase'e kaydedilir.
// ---------- Performans: zayıf cihazlarda (özellikle Android) hafif mod ----------
// Hafif mod: canvas çözünürlüğü 1x, daha az parçacık, radar 30 kare/sn, ağır CSS efektleri kapalı.
// Açılış: Android'de az çekirdek/bellek ya da oyun sırasında ölçülen düşük kare hızı. Karar cihazda hatırlanır.
const Perf = {
  KEY: 'starfoot_lite',
  android: /android/i.test(navigator.userAgent || ''),
  low: false,
  init() {
    let saved = null;
    try { saved = localStorage.getItem(Perf.KEY); } catch (e) { /* yok */ }
    const cores = navigator.hardwareConcurrency || 8, mem = navigator.deviceMemory || 8;
    Perf.low = saved === '1' || (saved !== '0' && Perf.android && (cores <= 4 || mem <= 3));
    Perf.apply();
  },
  apply() { if (document.body) document.body.classList.toggle('lite', Perf.low); else document.addEventListener('DOMContentLoaded', Perf.apply, { once: true }); },
  // kullanıcı tercihi: true/false sabitler, null otomatiğe döner
  set(v) {
    try { if (v == null) localStorage.removeItem(Perf.KEY); else localStorage.setItem(Perf.KEY, v ? '1' : '0'); } catch (e) { /* yok */ }
    if (v == null) Perf.init(); else { Perf.low = !!v; Perf.apply(); }
  },
  pref() { try { return localStorage.getItem(Perf.KEY); } catch (e) { return null; } },
  // canvas piksel oranı: hafif modda 1, Android'de en fazla 1.5, diğerlerinde 2
  dpr() { const d = window.devicePixelRatio || 1; return Perf.low ? 1 : Math.min(Perf.android ? 1.5 : 2, d); },
  // kare süresi izleyici: yavaşsa hafif moda geçer (kullanıcı elle kapattıysa dokunmaz)
  watch() {
    const s = { n: 0, slow: 0, last: 0 };
    return (now) => {
      if (Perf.low || Perf.pref() === '0' || document.hidden) { s.last = now; return false; }
      const dt = s.last ? now - s.last : 16; s.last = now;
      if (dt > 250) return false; // sekme/arka plan arası
      s.n++; if (dt > 30) s.slow++;
      if (s.n >= 90) {
        const bad = s.slow / s.n > 0.4;
        s.n = 0; s.slow = 0;
        if (bad) {
          Perf.low = true; Perf.apply();
          try { localStorage.setItem(Perf.KEY, '1'); } catch (e) { /* yok */ }
          try { const F = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.FirebaseAnalytics; if (F && F.logEvent) F.logEvent({ name: 'perf_lite', params: { cores: navigator.hardwareConcurrency || 0, mem: navigator.deviceMemory || 0 } }).catch(() => {}); } catch (e) { /* yok */ }
          return true;
        }
      }
      return false;
    };
  },
};
Perf.init();

const ScreenGuard = {
  t: 0,
  repaint() {
    cancelAnimationFrame(ScreenGuard.t);
    const els = [document.getElementById('hub'), document.getElementById('title')].filter(Boolean);
    els.forEach((el) => { el.style.opacity = '0.999'; });
    void document.body.offsetHeight;
    ScreenGuard.t = requestAnimationFrame(() => requestAnimationFrame(() => { els.forEach((el) => { el.style.opacity = ''; }); }));
  },
  errs: 0,
  // hatanın geçtiği ilk fonksiyonlar ve satırlar (ör. "Match.end@match.js:812>Game.applyMatch@game.js:990")
  stack(err) {
    const st = err && err.stack ? String(err.stack) : '';
    return st.split('\n').map((l) => { const m = /^\s*(?:at\s+)?([\w$.<>]*)\s*[@(]?.*?([\w-]+\.js):(\d+)/.exec(l); return m ? `${m[1] || '?'}@${m[2]}:${m[3]}` : ''; }).filter(Boolean).slice(0, 3).join('>').slice(0, 99);
  },
  report(msg, src, line, err) {
    if (ScreenGuard.errs++ > 8) return;
    try {
      const F = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.FirebaseAnalytics;
      if (F && F.logEvent) F.logEvent({ name: 'js_error', params: { m: String(msg || '').slice(0, 95), s: String(src || '').split('/').pop().slice(0, 30), l: line || 0, scr: ScreenGuard.where(), f: ScreenGuard.stack(err), v: typeof APP_VER !== 'undefined' ? APP_VER : '', t: ScreenGuard.tester() ? 1 : 0 } }).catch(() => {});
    } catch (e) { /* yok */ }
  },
  // hatanın olduğu ekran (ör. hub:life, match, drill, title)
  where() {
    try {
      const on = (id) => { const e = document.getElementById(id); return e && !e.classList.contains('hidden'); };
      if (on('match')) return 'match';
      if (on('drill')) return 'drill';
      const m = on('modal') ? '+modal' : '';
      if (on('hub')) return 'hub:' + (typeof Game !== 'undefined' ? Game.tab : '') + m;
      const sc = Array.from(document.querySelectorAll('.screen')).find((x) => !x.classList.contains('hidden'));
      return (sc ? sc.id : 'none') + m;
    } catch (e) { return '?'; }
  },
  // geliştirici cihazı: Ayarlar'daki sürüm yazısına 5 kez dokununca açılır/kapanır (Firebase'de ayırmak için)
  tester() { try { return localStorage.getItem('starfoot_tester') === '1'; } catch (e) { return false; } },
  setTester(on) {
    try { localStorage.setItem('starfoot_tester', on ? '1' : '0'); } catch (e) { /* yok */ }
    try {
      const F = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.FirebaseAnalytics;
      if (F && F.setUserProperty) F.setUserProperty({ key: 'tester', value: on ? '1' : '0' }).catch(() => {});
    } catch (e) { /* yok */ }
  },
  heal() {
    try {
      const vis = Array.from(document.querySelectorAll('.screen')).some((x) => !x.classList.contains('hidden'));
      if (!vis && typeof Game !== 'undefined') {
        if (Game.state) { Game.show('hub'); Game.render(); } else if (Game.toMenu) Game.toMenu();
      }
      ScreenGuard.repaint();
    } catch (e) { /* yok */ }
  },
  init() {
    window.addEventListener('error', (e) => { ScreenGuard.report(e.message, e.filename, e.lineno, e.error); setTimeout(ScreenGuard.heal, 60); });
    window.addEventListener('unhandledrejection', (e) => { const r = e.reason; ScreenGuard.report(r && (r.message || r), 'promise', 0, r); setTimeout(ScreenGuard.heal, 60); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) ScreenGuard.repaint(); });
    // iOS'ta çizim alanlarının (canvas) toplam bellek sınırı var; sayfadan kaldırılan canvas'lar hemen boşalmıyor
    // ve sınır dolunca getContext null dönüyor. Sayfadan çıkan canvas'ın belleği sıfırlanır.
    try {
      const free = [];
      new MutationObserver((ms) => {
        ms.forEach((m) => m.removedNodes.forEach((n) => {
          if (n.nodeType !== 1) return;
          if (n.tagName === 'CANVAS') free.push(n); else if (n.getElementsByTagName) free.push(...n.getElementsByTagName('canvas'));
        }));
        if (free.length) setTimeout(() => { free.splice(0).forEach((c) => { if (!c.isConnected && !c.dataset.keep) { c.width = 0; c.height = 0; } }); }, 0);
      }).observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) { /* yok */ }
    if (ScreenGuard.tester()) setTimeout(() => ScreenGuard.setTester(true), 3000);
    // Ayarlar'daki sürüm yazısına 5 hızlı dokunuş: geliştirici cihazı işaretini aç/kapat
    let taps = 0, tt = 0;
    document.addEventListener('click', (e) => {
      if (!e.target.closest || !e.target.closest('.set-ver')) return;
      clearTimeout(tt); tt = setTimeout(() => { taps = 0; }, 1500);
      if (++taps < 5) return;
      taps = 0;
      const on = !ScreenGuard.tester();
      ScreenGuard.setTester(on);
      if (typeof Game !== 'undefined' && Game.toast) Game.toast(on ? 'Geliştirici cihazı: açık (Firebase tester=1)' : 'Geliştirici cihazı: kapalı', 'info');
    });
    const start = () => {
      const mo = new MutationObserver((list) => {
        for (const r of list) {
          if (r.type === 'attributes' && r.target.id === 'modal' && r.target.classList.contains('hidden')) return ScreenGuard.repaint();
          if (r.type === 'childList' && r.removedNodes.length) {
            for (const n of r.removedNodes) if (n.nodeType === 1 && n.id !== 'toasts' && !(n.classList && n.classList.contains('toast'))) return ScreenGuard.repaint();
          }
        }
      });
      mo.observe(document.body, { childList: true });
      const m = document.getElementById('modal');
      if (m) mo.observe(m, { attributes: true, attributeFilter: ['class'] });
    };
    if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  },
};
ScreenGuard.init();

// ---------- Derin bağlantılar (App Store etkinlikleri, paylaşımlar) ----------
// starfoot://star  -> Starpedia (kariyerdeysen hemen, değilsen kariyere girince)
// starfoot://wc    -> Dünya Şampiyonası Rüyası menüsü
// starfoot://coach -> Teknik Direktör menüsü (paketi yoksa satın alma penceresi)
// starfoot://comeback -> Teknik Direktör 'Büyük Dönüş' meydan okuması (herkese ücretsiz; App Store etkinliği)
const DeepLink = {
  pending: null,
  key(url) {
    const m = String(url || '').match(/^starfoot:\/\/([a-z]+)|\/go\/([a-z]+)/i);
    const k = m && (m[1] || m[2] || '').toLowerCase();
    return k === 'star' || k === 'wc' || k === 'coach' || k === 'comeback' ? k : null;
  },
  handle(url) {
    const k = DeepLink.key(url);
    if (!k) return;
    DeepLink.pending = k;
    if (typeof Premium !== 'undefined' && Premium.track) Premium.track('deeplink', { to: k });
    setTimeout(DeepLink.run, 400);
  },
  // Uygun bir ekrandaysak bekleyen bağlantıyı açar; açtıysa true döner
  run() {
    const k = DeepLink.pending;
    if (!k || typeof Game === 'undefined') return false;
    const vis = (id) => { const e = document.getElementById(id); return e && !e.classList.contains('hidden'); };
    if (vis('match') || document.body.classList.contains('wc-mode')) return false; // maç ya da turnuva sürerken bölme
    if (k === 'wc') {
      if (typeof WC === 'undefined') return false;
      DeepLink.pending = null;
      if (Game.state) { Game.save(); Game.init(); }
      Game.show('title');
      WC.menu();
      return true;
    }
    if (k === 'coach') {
      if (typeof Coach === 'undefined' || !Coach.enabled()) return false;
      if (Coach.s && document.getElementById('coach') && !document.getElementById('coach').classList.contains('hidden')) { DeepLink.pending = null; return true; }
      DeepLink.pending = null;
      if (Game.state) { Game.save(); Game.init(); }
      Game.show('title');
      Coach.menu();
      return true;
    }
    if (k === 'comeback') {
      if (typeof TDCh === 'undefined' || typeof Coach === 'undefined') return false;
      if (Coach.s && document.getElementById('coach') && !document.getElementById('coach').classList.contains('hidden')) return false; // maç/sezon sürerken bölme
      DeepLink.pending = null;
      if (Game.state) { Game.save(); Game.init(); }
      Game.show('title');
      const x = TDCh.def('comeback');
      if (x) TDCh.brief(x);
      return true;
    }
    if (k === 'star') {
      if (typeof Star === 'undefined') return false;
      if (!Game.state || !vis('hub')) {
        return false; // kariyere girince açılır
      }
      DeepLink.pending = null;
      Star.wiki();
      return true;
    }
    return false;
  },
  init() {
    const App = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
    if (!App) return;
    try {
      App.addListener('appUrlOpen', (e) => DeepLink.handle(e && e.url));
      if (App.getLaunchUrl) App.getLaunchUrl().then((r) => r && r.url && DeepLink.handle(r.url)).catch(() => {});
    } catch (e) { /* eklenti yok */ }
  },
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', DeepLink.init); else DeepLink.init();
