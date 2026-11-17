// Kariyer kayıtları: sıkıştırılmış saklama (lz-string, ~6 kat küçük).
// iPhone'da tarayıcı depolaması uygulama başına ~5 MB; sıkıştırmasız 3 kariyerden sonra 4. kayıt sığmıyordu.
// Yazma: kayıt hemen bellekte tutulur, sıkıştırma arka planda (Web Worker) yapılır; uygulama arka plana geçerken
// bekleyen kayıt anında yazılır. Okuma: önce bellekteki bekleyen kayıt, yoksa diskteki (eski düz kayıtlar da okunur).
const Store = {
  PFX: 'LZ1:',
  pending: {}, // key -> { str, seq }
  seq: 0,
  timer: 0,
  worker: null,
  failed: false,
  dec(raw) {
    if (raw == null) return null;
    if (raw.startsWith(Store.PFX)) { const s = LZString.decompressFromUTF16(raw.slice(Store.PFX.length)); return s == null || s === '' ? null : s; }
    return raw;
  },
  enc(str) { return Store.PFX + LZString.compressToUTF16(str); },
  read(key) {
    const p = Store.pending[key];
    if (p) return p.str;
    try { return Store.dec(localStorage.getItem(key)); } catch (e) { return null; }
  },
  put(key, val) {
    try { localStorage.setItem(key, val); SaveBak.later(key); return true; } catch (e) {
      SaveBak.later(key, val); // tarayıcı deposu dolsa bile kayıt dosyaya yazılır
      // eski kopyayı kaldırıp bir kez daha dene (yer açılır); bulut yedeği silinmesin diye ham silme
      if (SaveBak.ok(key)) {
        try { (typeof Cloud !== 'undefined' && Cloud.raw ? Cloud.raw.rm : Storage.prototype.removeItem).call(localStorage, key); localStorage.setItem(key, val); return true; } catch (e2) { /* yine olmadı */ }
      }
      if (!Store.failed && typeof Game !== 'undefined' && Game.toast) { Store.failed = true; Game.toast('Kayıt alanı doldu: kullanmadığın bir kariyeri silmen gerekebilir.', 'bad'); }
      return false;
    }
  },
  write(key, str) {
    Store.pending[key] = { str, seq: ++Store.seq };
    clearTimeout(Store.timer);
    Store.timer = setTimeout(() => Store.flush(false), 700);
  },
  remove(key) {
    delete Store.pending[key];
    try { localStorage.removeItem(key); } catch (e) { /* yok */ }
    SaveBak.drop(key);
  },
  initWorker() {
    if (Store.worker !== null || typeof Worker === 'undefined' || location.protocol === 'file:') return;
    try {
      Store.worker = new Worker('js/lzworker.js');
      Store.worker.onmessage = (e) => {
        const { key, seq, z } = e.data;
        const p = Store.pending[key];
        if (!p || p.seq !== seq) return; // bu arada daha yeni kayıt geldi
        if (z == null) { Store.flushKey(key); return; }
        if (Store.put(key, Store.PFX + z)) delete Store.pending[key];
      };
      Store.worker.onerror = () => { Store.worker = false; Store.flush(true); };
    } catch (e) { Store.worker = false; }
  },
  flushKey(key) {
    const p = Store.pending[key];
    if (!p) return;
    let val;
    try { val = Store.enc(p.str); } catch (e) { val = p.str; }
    if (Store.put(key, val)) delete Store.pending[key];
  },
  // sync: true → hemen, ana iş parçacığında yaz (uygulama arka plana geçerken)
  flush(sync) {
    clearTimeout(Store.timer);
    Store.initWorker();
    Object.keys(Store.pending).forEach((key) => {
      if (sync || !Store.worker) Store.flushKey(key);
      else { const p = Store.pending[key]; Store.worker.postMessage({ key, seq: p.seq, str: p.str }); }
    });
  },
  // eski düz kayıtları arka planda sıkıştır (alan açılır)
  migrate(keys) {
    keys.forEach((key) => {
      let raw = null;
      try { raw = localStorage.getItem(key); } catch (e) { /* yok */ }
      if (raw && !raw.startsWith(Store.PFX) && raw.length > 4000 && !Store.pending[key]) Store.write(key, raw);
    });
  },
};
document.addEventListener('visibilitychange', () => { if (document.hidden) { Store.flush(true); SaveBak.flush(); if (typeof Durable !== 'undefined') Durable.save(); } });
window.addEventListener('pagehide', () => { Store.flush(true); SaveBak.flush(); if (typeof Durable !== 'undefined') Durable.save(); });

// Kariyer kayıtlarının ikinci kopyası: uygulamanın kendi dosya alanında (yalnız iPhone/Android uygulamasında).
// iOS, yer darlığında web deposunu (localStorage) temizleyebiliyor; o zaman kariyer bu dosyadan geri gelir.
// Dosya, web deposundakiyle birebir aynı (sıkıştırılmış) metindir. Kariyer silinince dosyası da silinir.
const SaveBak = {
  DIR: 'LIBRARY',
  timers: {},
  vals: {},
  fs() {
    const C = window.Capacitor;
    return C && C.isNativePlatform && C.isNativePlatform() && C.Plugins && C.Plugins.Filesystem ? C.Plugins.Filesystem : null;
  },
  ok: (key) => /^starfoot_slot_/.test(key),
  path: (key) => `saves/${key}.txt`,
  // birkaç saniye bekleyip yazar (her hamlede dosyaya yazmasın)
  later(key, val) {
    if (!SaveBak.ok(key) || !SaveBak.fs()) return;
    if (val != null) SaveBak.vals[key] = val; else delete SaveBak.vals[key];
    clearTimeout(SaveBak.timers[key]);
    // Durable kalıcı kaydı da aynı kariyeri yazıyor; bu ikinci kopya daha seyrek yazılır (arka plana geçerken hemen yazılır)
    SaveBak.timers[key] = setTimeout(() => SaveBak.write(key), 15000);
  },
  async write(key) {
    const F = SaveBak.fs(); if (!F) return;
    clearTimeout(SaveBak.timers[key]); delete SaveBak.timers[key];
    let val = SaveBak.vals[key];
    if (val == null) try { val = localStorage.getItem(key); } catch (e) { val = null; }
    delete SaveBak.vals[key];
    if (!val) return;
    try { await F.writeFile({ path: SaveBak.path(key), data: val, directory: SaveBak.DIR, encoding: 'utf8', recursive: true }); } catch (e) { /* sonraki kayıtta yeniden denenir */ }
  },
  flush() { Object.keys(SaveBak.timers).forEach((k) => SaveBak.write(k)); },
  drop(key) {
    const F = SaveBak.fs(); if (!F || !SaveBak.ok(key)) return;
    clearTimeout(SaveBak.timers[key]); delete SaveBak.timers[key]; delete SaveBak.vals[key];
    F.deleteFile({ path: SaveBak.path(key), directory: SaveBak.DIR }).catch(() => {});
  },
  async read(key) {
    const F = SaveBak.fs(); if (!F) return null;
    try { const r = await F.readFile({ path: SaveBak.path(key), directory: SaveBak.DIR, encoding: 'utf8' }); return r && typeof r.data === 'string' && r.data ? r.data : null; } catch (e) { return null; }
  },
  // açılışta: web deposunda olmayan ya da açılamayan kariyerleri dosyadan geri getir; dosyası olmayanların dosyasını oluştur
  async check(keys) {
    const F = SaveBak.fs(); if (!F) return 0;
    let n = 0;
    for (const key of keys) {
      let cur = null;
      try { cur = localStorage.getItem(key); } catch (e) { /* yok */ }
      let good = false;
      try { good = !!cur && Store.dec(cur) != null; } catch (e) { good = false; }
      if (good) { SaveBak.later(key); continue; }
      const bak = await SaveBak.read(key);
      let bg = false;
      try { bg = !!bak && Store.dec(bak) != null; } catch (e) { bg = false; }
      if (!bg) continue;
      try { localStorage.setItem(key, bak); n++; } catch (e) { /* yer yok */ }
    }
    return n;
  },
};

// ---------- Kalıcı kayıt (yalnız uygulamada): web deposunun zaman damgalı kopyası uygulama dosyalarında ----------
// Android WebView web deposunu (localStorage) diske gecikmeli yazar; büyük kayıtlarda bu gecikme dakikalara çıkar.
// Uygulama arka planda kapatılınca yazılmamış ilerleme kaybolur (kariyer geriye gider, Premium/slot/ödüller sıfırlanır).
// Burada her değişiklik birkaç saniye içinde uygulamanın kendi dosyasına (hemen diske yazılır) zaman damgasıyla kopyalanır.
// Açılışta dosyadaki kopya web deposundan yeniyse web deposu dosyadan geri yüklenir ve sayfa bir kez yenilenir.
// Dosyalar iki kopya halinde dönüşümlü yazılır: yazma sırasında kapanırsa sağlam olan kopya kullanılır.
const Durable = {
  DIR: 'LIBRARY',
  T: '__sf_t', // web deposunda anlık görüntü zamanı; büyük anahtarlar için __sf_t:<anahtar>
  BIG: 30000,
  dirty: {},
  timer: 0,
  ready: false,
  busy: false,
  again: false,
  log: [], // son açılışta geri yüklenen anahtarlar (tanı için)
  snap: null, // son yazılan / okunan anlık görüntü: { t, side, kv, big: { k: { t, f } } }
  fs() { return SaveBak.fs(); },
  raw: { set: Storage.prototype.setItem, rm: Storage.prototype.removeItem },
  isBig(k, v) { return /^starfoot_slot_/.test(k) || (v != null && v.length > Durable.BIG); },
  mark(k) {
    if (k.startsWith(Durable.T)) return;
    Durable.dirty[k] = 1;
    clearTimeout(Durable.timer);
    // dosya yazımı köprü üzerinden gider; sık yazım zayıf Android cihazlarda ANR'ye yol açabiliyor (arka plana geçerken zaten hemen yazılır)
    Durable.timer = setTimeout(() => Durable.save(), 4000);
  },
  ls() { const o = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && !k.startsWith(Durable.T)) o[k] = localStorage.getItem(k); } } catch (e) { /* yok */ } return o; },
  async readJSON(path) {
    const F = Durable.fs();
    try { const r = await F.readFile({ path, directory: Durable.DIR, encoding: 'utf8' }); return JSON.parse(r.data); } catch (e) { return null; }
  },
  async write(path, data) { await Durable.fs().writeFile({ path, data, directory: Durable.DIR, encoding: 'utf8', recursive: true }); },
  async save() {
    const F = Durable.fs();
    if (!F) return;
    if (!Durable.ready || Durable.busy) { Durable.again = true; return; }
    clearTimeout(Durable.timer);
    const keys = Object.keys(Durable.dirty);
    if (!keys.length && Durable.snap) return;
    Durable.busy = true; Durable.again = false; Durable.dirty = {};
    try {
      const t = Date.now(), all = Durable.ls();
      const prev = Durable.snap || { kv: {}, big: {} };
      const big = Object.assign({}, prev.big);
      // büyük anahtarlar: değişenler ayrı dosyaya (dönüşümlü a/b)
      for (const k of (Durable.snap ? keys : Object.keys(all))) {
        const v = all[k];
        if (v == null) { delete big[k]; continue; }
        if (!Durable.isBig(k, v)) { delete big[k]; continue; }
        const f = big[k] && big[k].f === 'a' ? 'b' : 'a';
        await Durable.write(`saves/d_${k}_${f}.txt`, v);
        big[k] = { t, f };
        try { Durable.raw.set.call(localStorage, Durable.T + ':' + k, String(t)); } catch (e) { /* yok */ }
      }
      const kv = {};
      Object.keys(all).forEach((k) => { if (!big[k] && !Durable.isBig(k, all[k])) kv[k] = all[k]; });
      const side = prev.side === 'a' ? 'b' : 'a';
      const snap = { t, side, kv, big };
      await Durable.write(`saves/kv_${side}.json`, JSON.stringify(snap));
      Durable.snap = snap;
      try { Durable.raw.set.call(localStorage, Durable.T, String(t)); } catch (e) { /* yok */ }
    } catch (e) { /* bir sonraki değişiklikte yeniden denenir */ } finally {
      Durable.busy = false;
      if (Durable.again || Object.keys(Durable.dirty).length) { Durable.again = false; Durable.timer = setTimeout(() => Durable.save(), 800); }
    }
  },
  async boot() {
    const F = Durable.fs();
    if (!F) return;
    // açılış anındaki depo: dosya okunurken oyunun yazdıkları geri yükleme sanılmasın
    const base = Durable.ls();
    let lsT = 0;
    try { lsT = +localStorage.getItem(Durable.T) || 0; } catch (e) { /* yok */ }
    const same = (k) => { try { return localStorage.getItem(k) === (k in base ? base[k] : null); } catch (e) { return false; } };
    try {
      const [a, b] = await Promise.all([Durable.readJSON('saves/kv_a.json'), Durable.readJSON('saves/kv_b.json')]);
      const snap = [a, b].filter((x) => x && x.t && x.kv).sort((x, y) => y.t - x.t)[0] || null;
      if (!snap) { Durable.ready = true; Durable.save(); return; } // ilk kez: tam kopya oluştur
      Durable.snap = snap;
      let restored = 0;
      if (snap.t > lsT) {
        // web deposu dosyadan eski (ya da silinmiş): küçük değerleri geri yükle (açılıştan beri oyunun değiştirdiklerine dokunma)
        Object.entries(snap.kv).forEach(([k, v]) => { try { if (base[k] !== v && same(k)) { Durable.raw.set.call(localStorage, k, v); restored++; Durable.log.push(k); } } catch (e) { /* yer yok */ } });
      }
      for (const [k, m] of Object.entries(snap.big || {})) {
        let bt = 0;
        try { bt = +localStorage.getItem(Durable.T + ':' + k) || 0; } catch (e) { /* yok */ }
        if (m.t <= bt || !same(k)) continue;
        let v = null;
        try { v = (await F.readFile({ path: `saves/d_${k}_${m.f}.txt`, directory: Durable.DIR, encoding: 'utf8' })).data; } catch (e) { v = null; }
        if (!v || v === base[k]) { if (v) try { Durable.raw.set.call(localStorage, Durable.T + ':' + k, String(m.t)); } catch (e) { /* yok */ } continue; }
        try { Durable.raw.set.call(localStorage, k, v); Durable.raw.set.call(localStorage, Durable.T + ':' + k, String(m.t)); restored++; Durable.log.push(k); } catch (e) { /* yer yok */ }
      }
      if (snap.t > lsT) try { Durable.raw.set.call(localStorage, Durable.T, String(snap.t)); } catch (e) { /* yok */ }
      Durable.ready = true;
      if (restored) {
        // oyun eski değerlerle açılmış olabilir: bir kez yenile (döngüye girmesin)
        let once = false;
        try { once = sessionStorage.getItem('sf_restored') === '1'; sessionStorage.setItem('sf_restored', '1'); } catch (e) { /* yok */ }
        if (!once) { Durable.dirty = {}; clearTimeout(Durable.timer); location.reload(); return; }
      }
      if (Object.keys(Durable.dirty).length) Durable.save();
    } catch (e) { Durable.ready = true; }
  },
};
// Depo yazımları her zaman izlenir (uygulama köprüsü geç hazır olsa bile değişiklik kaçmasın); dosya işleri köprü hazır olunca başlar
(function () {
  const S = Storage.prototype;
  const set0 = S.setItem, rm0 = S.removeItem;
  Durable.raw = { set: set0, rm: rm0 };
  S.setItem = function (k, v) { set0.call(this, k, v); if (this === window.localStorage && Durable.on) Durable.mark(String(k)); };
  S.removeItem = function (k) { rm0.call(this, k); if (this === window.localStorage && Durable.on) Durable.mark(String(k)); };
  const start = () => { if (Durable.on || !Durable.fs()) return false; Durable.on = true; Durable.boot(); return true; };
  if (!start()) {
    // köprü sonradan gelirse: DOMContentLoaded ve kısa aralıklarla birkaç kez dene
    document.addEventListener('DOMContentLoaded', start, { once: true });
    let n = 0; const iv = setInterval(() => { if (start() || ++n > 20) clearInterval(iv); }, 250);
  }
})();
