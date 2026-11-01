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
document.addEventListener('visibilitychange', () => { if (document.hidden) { Store.flush(true); SaveBak.flush(); } });
window.addEventListener('pagehide', () => { Store.flush(true); SaveBak.flush(); });

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
    SaveBak.timers[key] = setTimeout(() => SaveBak.write(key), 4000);
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
