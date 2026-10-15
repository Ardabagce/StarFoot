// Yardımcı fonksiyonlar
const U = {
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
