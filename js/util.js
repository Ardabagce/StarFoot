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
  money(n) {
    n = Math.round(n);
    const abs = Math.abs(n);
    let s;
    if (typeof I18N !== 'undefined' && I18N.lang === 'en') {
      if (abs >= 1e9) s = (n / 1e9).toFixed(2) + 'B';
      else if (abs >= 1e6) s = (n / 1e6).toFixed(2) + 'M';
      else s = n.toLocaleString('en-US');
      return '₺' + s;
    }
    if (abs >= 1e9) s = (n / 1e9).toFixed(2).replace('.', ',') + ' Mr';
    else if (abs >= 1e6) s = (n / 1e6).toFixed(2).replace('.', ',') + ' Mn';
    else s = n.toLocaleString('tr-TR');
    return s + ' ₺';
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
