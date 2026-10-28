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

// ---------- Ekran koruması ----------
// iOS WebView bazen bir pencere ya da tam ekran katman kapanınca alttaki sayfayı yeniden çizmiyor
// (boş/beyaz ekran). Kapanma anında sayfa zorla yeniden çizilir. Ayrıca beklenmeyen bir hata olursa
// ekran geri getirilir ve hata Firebase'e kaydedilir.
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
  report(msg, src, line) {
    if (ScreenGuard.errs++ > 8) return;
    try {
      const F = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.FirebaseAnalytics;
      if (F && F.logEvent) F.logEvent({ name: 'js_error', params: { m: String(msg || '').slice(0, 95), s: String(src || '').split('/').pop().slice(0, 30), l: line || 0 } }).catch(() => {});
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
    window.addEventListener('error', (e) => { ScreenGuard.report(e.message, e.filename, e.lineno); setTimeout(ScreenGuard.heal, 60); });
    window.addEventListener('unhandledrejection', (e) => { const r = e.reason; ScreenGuard.report(r && (r.message || r), 'promise', 0); setTimeout(ScreenGuard.heal, 60); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) ScreenGuard.repaint(); });
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
