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
    try { localStorage.setItem(key, val); return true; } catch (e) {
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
document.addEventListener('visibilitychange', () => { if (document.hidden) Store.flush(true); });
window.addEventListener('pagehide', () => Store.flush(true));
