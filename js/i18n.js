// Dil desteği: oyun metinleri Türkçe yazılır, başka dil seçiliyse ekrana çıkarken çevrilir.
// Kayıtlar ve oyun mantığı Türkçe kalır; yalnız görünen metin (DOM, canvas, başlıklar) değişir.
const I18N = {
  lang: 'tr',
  // Desteklenen diller: Türkçe asıl metin, diğerleri js/lang-<kod>.js sözlüğüyle çevrilir
  LANGS: { tr: 'Türkçe', en: 'English', es: 'Español', pt: 'Português', de: 'Deutsch', fr: 'Français', it: 'Italiano', id: 'Bahasa Indonesia', ar: 'العربية', ja: '日本語' },
  memo: new Map(),
  outs: new Set(),
  rev: new Map(),
  // sağdan sola yazılan diller
  rtl() { return I18N.lang === 'ar'; },
  dict() { return (window.LANGS || {})[I18N.lang]; },
  // Kayıtlı seçim yoksa telefonun dili; desteklenmeyen dillerde İngilizce
  pick() {
    let l = null;
    try { l = localStorage.getItem('starfoot_lang'); } catch (e) { /* yok */ }
    return l && I18N.LANGS[l] ? l : I18N.deviceLang();
  },
  init() {
    const l = I18N.pick();
    if (l === 'tr' || (window.LANGS && window.LANGS[l])) return I18N.boot(l);
    // sözlük henüz yüklenmedi: sayfa ayrıştırılırken eşzamanlı yükle, ardından başlat
    if (document.readyState === 'loading') {
      document.write(`<script src="js/lang-${l}.js"><\/script><script>I18N.boot(${JSON.stringify(l)})<\/script>`);
    } else I18N.load(l).then(() => I18N.boot(l), () => I18N.boot('en'));
  },
  boot(l) {
    I18N.lang = l !== 'tr' && window.LANGS && window.LANGS[l] ? l : (l !== 'tr' && window.LANGS && window.LANGS.en ? 'en' : 'tr');
    document.documentElement.lang = I18N.lang; document.documentElement.dir = I18N.rtl() ? 'rtl' : 'ltr';
    if (I18N.lang !== 'tr') I18N.enable();
  },
  load(l) {
    if (window.LANGS && window.LANGS[l]) return Promise.resolve();
    return new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = `js/lang-${l}.js`; sc.onload = res; sc.onerror = rej; document.head.appendChild(sc); });
  },
  // dile göre varsayılan oyuncu adı ve ülke (senaryolar, kariyer oluşturma)
  defName() { return { tr: ['Emre', 'Yıldız'], en: ['Alex', 'Stone'], es: ['Diego', 'Romero'], pt: ['Lucas', 'Silva'], de: ['Lukas', 'Becker'], fr: ['Hugo', 'Martin'], it: ['Marco', 'Rossi'], id: ['Rizky', 'Pratama'], ar: ['عمر', 'الحداد'], ja: ['タクミ', 'ホシノ'] }[I18N.lang] || ['Alex', 'Stone']; },
  home() { return { tr: 'TUR', en: 'ENG', es: 'ESP', pt: 'BRA', de: 'GER', fr: 'FRA', it: 'ITA', id: 'ENG', ar: 'KSA', ja: 'JPN' }[I18N.lang] || 'ENG'; },
  deviceLang() {
    const list = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || '']).filter(Boolean);
    for (const x of list) { const c = String(x).slice(0, 2).toLowerCase(); if (I18N.LANGS[c]) return c; if (c === 'in') return 'id'; }
    return 'en';
  },
  // Sözlüğü, canvas yamasını ve gözlemciyi kurar (dil değişince sözlük yenilenir); sonra sayfadaki metni çevirir
  enable() {
    const D = I18N.dict();
    if (I18N.built !== I18N.lang) {
      I18N.built = I18N.lang;
      I18N.memo.clear(); I18N.outs.clear();
      I18N.exact = new Map(Object.entries(D.exact));
      I18N.pats = D.pats.map(([k, v]) => {
        const lits = k.split('{}');
        // "{}-{}" skor kalıbı: iki tarafı da sayı
        const re = new RegExp('^' + lits.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('(.+?)').replace(/\(\.\+\?\)-\(\.\+\?\)/g, '(\\d+)-(\\d+)') + '$', 's');
        const hint = lits.reduce((a, b) => (b.length > a.length ? b : a), '');
        return { re, v, hint, adj: k.includes('{}{}') };
      });
      // Birleştirmeyle oluşan cümle parçaları ("…'na katılma hakkı kazandık!" gibi)
      I18N.tails = []; I18N.heads = [];
      I18N.exact.forEach((v, k) => {
        if (k.length < 4) return;
        if (/^[a-zçğışöü'’,.:;!?)\-]/.test(k)) I18N.tails.push(k);
        if (/[:(\-–—]$/.test(k)) I18N.heads.push(k);
      });
      I18N.tails.sort((a, b) => b.length - a.length);
      I18N.heads.sort((a, b) => b.length - a.length);
    }
    if (!I18N.ready) {
      I18N.ready = true;
      I18N.patchCanvas();
      const watch = () => new MutationObserver(I18N.onMut).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['title', 'aria-label', 'placeholder'] });
      if (document.body) watch(); else document.addEventListener('DOMContentLoaded', watch);
    }
    document.title = 'StarFoot';
    if (document.body) I18N.apply(document.body); else document.addEventListener('DOMContentLoaded', () => I18N.apply(document.body));
  },
  // Sayfayı yenilemeden dil değiştirir (iOS uygulamasında yenileme sorun çıkarıyordu)
  set(l) {
    if (!I18N.LANGS[l]) l = 'en';
    try { localStorage.setItem('starfoot_lang', l); } catch (e) { /* yok */ }
    if (l === I18N.lang) return Promise.resolve();
    // önce sayfadaki çevrilmiş metinleri Türkçe asıllarına döndür
    // gözlemci, sözlük yüklenirken eski dile geri çevirmesin diye geçici olarak Türkçeye dön
    if (I18N.lang !== 'tr') { I18N.restore(document.body); I18N.lang = 'tr'; }
    const done = () => {
      document.documentElement.lang = I18N.lang; document.documentElement.dir = I18N.rtl() ? 'rtl' : 'ltr';
      if (typeof I18N.onChange === 'function') I18N.onChange(I18N.lang);
    };
    if (l === 'tr') { I18N.lang = 'tr'; done(); return Promise.resolve(); }
    return I18N.load(l).then(() => { I18N.lang = l; I18N.enable(); done(); }, () => { I18N.lang = 'en'; I18N.enable(); done(); });
  },
  // Çevrilmiş metinleri Türkçe asıllarına döndürür
  restore(root) {
    if (!root) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n;
    while ((n = w.nextNode())) {
      if (n.nodeType === 3) { const o = I18N.rev.get(n.nodeValue); if (o !== undefined) n.nodeValue = o; }
      else for (const a of ['title', 'aria-label', 'placeholder']) { const v = n.getAttribute(a); if (v && I18N.rev.has(v)) n.setAttribute(a, I18N.rev.get(v)); }
    }
  },
  // Tek bir metni çevirir (önce birebir, sonra kalıp, sonra parçalara bölerek)
  t(s) {
    if (I18N.lang === 'tr' || s == null) return s;
    s = String(s);
    if (!s || I18N.outs.has(s)) return s;
    const hit = I18N.memo.get(s);
    if (hit !== undefined) return hit;
    const m = s.match(/^(\s*)([\s\S]*?)(\s*)$/);
    let core = m[2];
    let r = core ? I18N.tr(core.replace(/\s+/g, ' '), 0) : null;
    let out = r == null ? s : m[1] + I18N.ord(r) + m[3];
    // sağdan sola: baştaki +/− işaretleri sayının sağına kaymasın (soldan sağa işaretiyle sabitle)
    if (I18N.rtl() && out !== s) out = out.replace(/(^|[\s(·])([+\-−±])(?=\d)/g, '$1\u200e$2');
    if (I18N.memo.size > 20000) { I18N.memo.clear(); I18N.outs.clear(); }
    I18N.memo.set(s, out);
    I18N.outs.add(out);
    if (out !== s) { if (I18N.rev.size > 30000) I18N.rev.clear(); I18N.rev.set(out, s); }
    return out;
  },
  tr(s, d) {
    if (d > 7 || !/[A-Za-zÇĞİŞÖÜçğışöü]/.test(s)) return null;
    const ex = I18N.exact.get(s);
    if (ex !== undefined) return ex;
    for (const p of I18N.pats) {
      if (p.hint && !s.includes(p.hint)) continue;
      // yan yana "{}{}" ayraçlı metinde parçayı yanlış böler ("YER"+"DEN"); ayraçla bölme daha doğru çalışır
      if (p.adj && s.includes(' · ')) continue;
      const mm = p.re.exec(s);
      // Ayraç içeren yakalama büyük olasılıkla yanlış eşleşmedir ("Başlık · cümle")
      if (!mm || mm.slice(1).some((x) => x.includes(' · '))) continue;
      const g = mm.slice(1).map((x) => { const y = I18N.tr(x, d + 1); return y == null ? x : y; });
      let i = 0;
      return p.v.replace(/\{(\d*)\}/g, (_, n) => (n === '' ? (g[i++] ?? '') : (g[+n] ?? '')));
    }
    // Emojisiz hali
    const pl = s.replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{200D}]/gu, '').replace(/\s{2,}/g, ' ').trim();
    if (pl !== s && pl) { const y = I18N.tr(pl, d + 1); if (y != null) return y; }
    // Ayraçlarla bölünmüş metin
    for (const sep of [' · ', ' — ', ' | ', ' • ', ' – ']) {
      if (s.includes(sep)) return I18N.join(s.split(sep), sep, d);
    }
    // Cümlelere böl
    const sent = s.split(/(?<=[.!?…])\s+(?=[A-ZÇĞİŞÖÜ"“0-9])/);
    if (sent.length > 1) return I18N.join(sent, ' ', d);
    // Sondaki "(1/3)" gibi ekler
    const par = s.match(/^(.*\S)(\s*\([^()]*\)|\s+[+−-]?\d+([.,/]\d+)?%?|\s+U\d\d|\s*[:!.]+)$/);
    if (par) {
      const y = I18N.tr(par[1], d + 1);
      if (y != null) { const z = I18N.tr(par[2].trim(), d + 1); return y + (z != null ? par[2].replace(par[2].trim(), z) : par[2]); }
    }
    // Büyük/küçük harf farkı (cümle içindeki tek kelimeler)
    if (s.length < 30) {
      const up = s.charAt(0).toLocaleUpperCase('tr') + s.slice(1);
      if (up !== s && I18N.exact.has(up)) { const y = I18N.exact.get(up); return y.charAt(0).toLowerCase() + y.slice(1); }
    }
    // Başına/sonuna eklenmiş sabit parçalar
    for (const k of I18N.tails) {
      if (k.length < s.length && s.endsWith(k)) {
        const pre = s.slice(0, s.length - k.length);
        const y = I18N.tr(pre.trim(), d + 1);
        return (y == null ? pre : y + (/\s$/.test(pre) ? ' ' : '')) + I18N.exact.get(k);
      }
    }
    for (const k of I18N.heads) {
      if (k.length < s.length && s.startsWith(k)) {
        const post = s.slice(k.length);
        const y = I18N.tr(post.trim(), d + 1);
        return I18N.exact.get(k) + (/^\s/.test(post) ? ' ' : '') + (y == null ? post.trim() : y);
      }
    }
    // "Metin:" + değer
    const c = s.match(/^([^:]{2,40}):\s+(.+)$/);
    if (c) {
      const a = I18N.tr(c[1], d + 1), b = I18N.tr(c[2], d + 1);
      if (a != null || b != null) return (a ?? c[1]) + ': ' + (b ?? c[2]);
    }
    // Skor satırı: "Takım A 2-1 Takım B (pen.)"
    const sc = s.match(/^(.+?) (\d+ ?- ?\d+) (.+?)( \(pen\.\))?$/);
    if (sc) {
      const a = I18N.tr(sc[1], d + 1), b = I18N.tr(sc[3], d + 1);
      if (a != null || b != null) return (a ?? sc[1]) + ' ' + sc[2] + ' ' + (b ?? sc[3]) + (sc[4] || '');
    }
    // İki bilinen parçadan oluşan kısa metin ("Avrupa Kupası" + "Son 16")
    const ws = s.split(' ');
    if (ws.length > 1 && ws.length <= 9) {
      for (let i = ws.length - 1; i >= 1; i--) {
        const L = ws.slice(0, i).join(' '), R = ws.slice(i).join(' ');
        const a = I18N.exact.get(L), b = I18N.exact.get(R);
        if (a !== undefined && (b !== undefined || !/[A-Za-zÇĞİŞÖÜçğışöü]/.test(R))) return a + ' ' + (b ?? R);
        if (b !== undefined && !/[A-Za-zÇĞİŞÖÜçğışöü]/.test(L)) return L + ' ' + b;
      }
    }
    return null;
  },
  join(parts, sep, d) {
    let any = false;
    const o = parts.map((x) => { const y = I18N.tr(x.trim(), d + 1); if (y != null) any = true; return y == null ? x : y; });
    return any ? o.join(sep) : null;
  },
  // 1th → 1st, 2th → 2nd …
  ord(s) {
    if (I18N.lang !== 'en') return s;
    return s.replace(/\b(\d+)th\b/g, (_, n) => {
      const v = +n % 100, e = +n % 10;
      return n + (v >= 11 && v <= 13 ? 'th' : e === 1 ? 'st' : e === 2 ? 'nd' : e === 3 ? 'rd' : 'th');
    });
  },
  skip(el) { return el && (el.closest && el.closest('script,style,textarea,[contenteditable],[data-noi18n]')); },
  node(n) {
    const p = n.parentNode;
    if (!p || p.nodeType !== 1 || I18N.skip(p)) return;
    const v = n.nodeValue;
    if (!v) return;
    if (!/[A-Za-zÇĞİŞÖÜçğışöü]/.test(v)) {
      // yalnız sayı içeren metin ("+0.44", "−12"): sağdan sola düzende işaret doğru tarafta kalsın
      // (işaret zaten eklendiyse dokunma: değişiklik gözlemciyi yeniden tetikler)
      if (I18N.rtl() && !v.includes('\u200e') && (/^\s*[+\-−±]\s?\d/.test(v) || /\d\s*['’%]\s*$/.test(v))) n.nodeValue = '\u200e' + v;
      return;
    }
    const t = I18N.t(v);
    if (t !== v) n.nodeValue = t;
  },
  attrs(el) {
    if (I18N.skip(el)) return;
    for (const a of ['title', 'aria-label', 'placeholder']) {
      const v = el.getAttribute(a);
      if (v) { const t = I18N.t(v); if (t !== v) el.setAttribute(a, t); }
    }
  },
  apply(root) {
    if (I18N.lang === 'tr' || !root) return;
    if (root.nodeType === 3) return I18N.node(root);
    if (root.nodeType !== 1 && root.nodeType !== 11) return;
    if (root.nodeType === 1) { if (I18N.skip(root)) return; I18N.attrs(root); }
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n;
    while ((n = w.nextNode())) {
      if (n.nodeType === 3) I18N.node(n);
      else if (n.hasAttribute('title') || n.hasAttribute('aria-label') || n.hasAttribute('placeholder')) I18N.attrs(n);
    }
  },
  onMut(list) {
    if (I18N.lang === 'tr') return;
    for (const m of list) {
      if (m.type === 'characterData') I18N.node(m.target);
      else if (m.type === 'attributes') I18N.attrs(m.target);
      else m.addedNodes.forEach((n) => I18N.apply(n));
    }
  },
  patchCanvas() {
    const P = CanvasRenderingContext2D.prototype;
    ['fillText', 'strokeText', 'measureText'].forEach((fn) => {
      const orig = P[fn];
      P[fn] = function (txt, ...rest) { return orig.call(this, typeof txt === 'string' ? I18N.t(txt) : txt, ...rest); };
    });
  },
};
I18N.init();
