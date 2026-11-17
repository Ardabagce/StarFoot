// Efsaneler Salonu → emekli kariyerin Starpedia sayfası
// Emeklilikte (kariyer silinmeden hemen önce) sayfanın kopyası alınır, sıkıştırılıp cihazda saklanır.
// Salonda her kariyerin yanında "Starpedia" düğmesi çıkar; sayfa aynı ansiklopedi görünümüyle açılır.
const HofWiki = (() => {
  const K = 'sf_hofw_';
  const key = (at) => K + at;
  function snap() {
    if (typeof Star === 'undefined' || !Game.state || !Game.p) return null;
    try {
      Star._snap = true;
      const el = Star.wiki(Game.p, Game.state);
      if (!el) return null;
      el.querySelectorAll('.sp-edit, .sp-doc, .sp-taste').forEach((x) => x.remove());
      const cv = el.querySelector('canvas.sp-fig');
      if (cv) {
        // küçük, sıkıştırılmış fotoğraf (kayıt alanı az yer kaplasın)
        const sm = document.createElement('canvas'); sm.width = 220; sm.height = 220;
        sm.getContext('2d').drawImage(cv, 0, 0, 220, 220);
        const img = document.createElement('img');
        img.className = 'sp-fig'; img.alt = ''; img.width = 300; img.height = 300;
        img.src = sm.toDataURL('image/jpeg', 0.78);
        cv.replaceWith(img);
      }
      return el.innerHTML;
    } catch (e) { console.error(e); return null; } finally { Star._snap = false; }
  }
  const has = (at) => { try { return !!localStorage.getItem(key(at)); } catch (e) { return false; } };
  function prune() {
    try {
      const keep = new Set(Legacy.list().map((x) => key(x.at)));
      const del = [];
      for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(K) && !keep.has(k)) del.push(k); }
      del.forEach((k) => localStorage.removeItem(k));
    } catch (e) { /* yok */ }
  }
  function open(at) {
    if (typeof Star !== 'undefined' && !Star.has() && Star.on()) return Star.pitch('Starpedia sayfası', 'hof_wiki', "Efsaneler Salonu'ndaki kariyerlerinin Starpedia sayfaları Premium ile açılır.");
    let html = null;
    try { const raw = localStorage.getItem(key(at)); html = raw && LZString.decompressFromUTF16(raw); } catch (e) { html = null; }
    if (!html) return Game.toast('Bu kariyerin Starpedia sayfası bulunamadı.', 'bad');
    const m = document.getElementById('modal'); if (m) { m.classList.add('hidden'); m.innerHTML = ''; }
    const old = document.getElementById('spedia'); if (old) old.remove();
    const el = document.createElement('div');
    el.id = 'spedia'; el.className = 'sp'; el.dataset.hof = '1';
    el.innerHTML = html;
    // ana menüde kariyer yokken de çalışsın: kapat ve içindekiler bağlantıları burada
    el.addEventListener('click', (e) => {
      const b = e.target.closest && e.target.closest('[data-star]');
      if (!b) return;
      e.stopPropagation();
      if (b.dataset.star === 'wiki-close') Star.wikiClose();
      else if (b.dataset.star === 'wiki-go') { const t = el.querySelector('#sp-' + b.dataset.key); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
    Star.cover(el, 'sp-open');
    if (typeof UI !== 'undefined' && UI.strip) UI.strip(el);
    el.scrollTop = 0;
  }
  function install() {
    if (typeof Legacy === 'undefined') return;
    const rec = Legacy.record;
    Legacy.record = function () {
      const html = snap();
      const r = rec.apply(this, arguments);
      try {
        if (html && r && r.e) {
          try { localStorage.setItem(key(r.e.at), LZString.compressToUTF16(html)); } catch (e) { /* yer yoksa sayfa saklanmaz */ }
          prune();
        }
      } catch (e) { /* yok */ }
      return r;
    };
    const show = Legacy.show;
    Legacy.show = function () {
      const out = show.apply(this, arguments);
      try {
        const L = Legacy.list(), m = document.getElementById('modal');
        m.querySelectorAll('.hof-r').forEach((row, i) => {
          const x = L[i];
          if (!x || !has(x.at)) return;
          const b = document.createElement('button');
          b.className = 'hof-wiki'; b.type = 'button'; b.textContent = 'Starpedia';
          b.onclick = () => open(x.at);
          row.appendChild(b);
        });
        if (typeof UI !== 'undefined' && UI.strip) UI.strip(m);
      } catch (e) { console.error(e); }
      return out;
    };
    // salondan açılan sayfa kapanınca salona dön
    if (typeof Star !== 'undefined') {
      const close = Star.wikiClose;
      Star.wikiClose = function () {
        const el = document.getElementById('spedia'), hof = el && el.dataset.hof;
        const r = close.apply(this, arguments);
        if (hof) setTimeout(() => Legacy.show(), 30);
        return r;
      };
    }
  }
  install();
  return { snap, open, has, prune };
})();
