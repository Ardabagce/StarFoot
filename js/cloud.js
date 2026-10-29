// iCloud yedeği ve Game Center (yalnız iPhone/iPad uygulamasında)
// Cloud: her kariyer slotu sıkıştırılıp iCloud anahtar-değer deposuna yazılır (toplam sınır 1 MB).
//   Yeni cihazda ya da uygulama silinip yüklenince kayıtlar kendiliğinden geri gelir.
//   Hangi kopya yeniyse o kazanır; silinen kariyer diğer cihazlarda da silinir.
// GC: Game Center girişi, başarımlar ve liderlik tabloları.

const Cloud = {
  T_KEY: 'starfoot_cloud_t', // bu cihazdaki son değişiklik zamanları { s0: ms, ..., meta: ms }
  LIMIT: 960 * 1024, // Apple sınırı 1 MB; pay bırak
  pl: null, ok: false, busy: false, dirty: new Set(), timer: 0, lastPush: 0, note: '',
  // yedeğe girmeyen anahtarlar: kariyer slotları (ayrı yazılır), cihaza özel olanlar
  skipMeta: (k) => k.startsWith('starfoot_slot_') || k.startsWith('starfoot_sum_') || k.startsWith('starfoot_cloud') || ['starfoot_rc_synced', 'starfoot_save_v1', 'sf_notif', 'sf_notif_asked', 'sf_review'].includes(k),

  plugin(name) {
    const C = window.Capacitor;
    if (!C || !C.isNativePlatform || !C.isNativePlatform() || C.getPlatform() !== 'ios') return null;
    try { return C.registerPlugin ? C.registerPlugin(name) : C.Plugins[name]; } catch (e) { return null; }
  },
  times() { try { return JSON.parse(localStorage.getItem(Cloud.T_KEY) || '{}'); } catch (e) { return {}; } },
  setTimes(t) { try { Cloud.raw.set.call(localStorage, Cloud.T_KEY, JSON.stringify(t)); } catch (e) { /* yok */ } },
  touch(k) { const t = Cloud.times(); t[k] = Date.now(); Cloud.setTimes(t); Cloud.dirty.add(k); Cloud.later(); },
  later(ms = 5000) { if (!Cloud.ok) return; clearTimeout(Cloud.timer); Cloud.timer = setTimeout(() => Cloud.push(), ms); },

  // sıkıştırma: gzip + base64
  async zip(str) {
    const buf = await new Response(new Blob([str]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer();
    const b = new Uint8Array(buf); let s = '';
    for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
    return btoa(s);
  },
  async unzip(b64) {
    const bin = atob(b64); const b = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
    return new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  },
  metaBundle() {
    const o = {};
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (!Cloud.skipMeta(k)) o[k] = localStorage.getItem(k); }
    return JSON.stringify(o);
  },
  async idx() {
    try { const r = await Cloud.pl.get({ key: 'idx' }); return r && r.text ? JSON.parse(r.text) : {}; } catch (e) { return {}; }
  },

  async init() {
    if (typeof CompressionStream === 'undefined' || typeof DecompressionStream === 'undefined') return;
    Cloud.pl = Cloud.plugin('StarfootCloud');
    if (!Cloud.pl) return;
    try { const st = await Cloud.pl.status(); Cloud.ok = !!(st && st.available); } catch (e) { Cloud.ok = false; }
    if (!Cloud.ok) { Cloud.note = 'off'; return; }
    // ilk açılışta bu cihazdaki kayıtların zamanı yoksa "şimdi" say (ama buluttaki daha yeni bir kopyayı ezmesin diye 0)
    const t = Cloud.times();
    for (let i = 0; i < 5; i++) if (t['s' + i] === undefined && localStorage.getItem(Game.key(i))) t['s' + i] = 1;
    // ayarlar: bu cihazda kariyer varsa eski kurulum (1), yoksa yeni kurulum (0) say; buluttaki kopya yeni kurulumu doldurur
    if (t.meta === undefined) t.meta = [0, 1, 2, 3, 4].some((i) => localStorage.getItem(Game.key(i))) ? 1 : 0;
    Cloud.setTimes(t);
    try { Cloud.pl.addListener('change', () => Cloud.pull(true)); } catch (e) { /* yok */ }
    document.addEventListener('visibilitychange', () => { if (document.hidden && Cloud.dirty.size) Cloud.push(); });
    await Cloud.pull(false);
    // bulutta olmayan yerel kayıtları yükle
    const ix = await Cloud.idx();
    for (let i = 0; i < 5; i++) if (localStorage.getItem(Game.key(i)) && !(ix['s' + i] && !ix['s' + i].del)) Cloud.dirty.add('s' + i);
    if (!ix.meta) Cloud.dirty.add('meta');
    if (Cloud.dirty.size) Cloud.later(1500);
  },

  // buluttaki daha yeni kopyaları indir
  async pull(live) {
    if (!Cloud.ok || Cloud.busy) return 0;
    Cloud.busy = true;
    let n = 0;
    try {
      const ix = await Cloud.idx(), t = Cloud.times();
      for (const k of Object.keys(ix)) {
        const e = ix[k];
        if (!e || !(e.t > (t[k] || 0))) continue;
        // açık olan kariyerin üzerine oyun sırasında yazma; menüye dönünce alınır
        if (k === 's' + Game.slot && Game.state) continue;
        if (e.del) {
          if (k.startsWith('s')) { Store.remove(Game.key(+k.slice(1))); localStorage.removeItem(Game.sumKey(+k.slice(1))); }
        } else {
          const r = await Cloud.pl.get({ key: 'v_' + k });
          if (!r || !r.data) continue;
          const txt = await Cloud.unzip(r.data);
          if (k === 'meta') {
            const o = JSON.parse(txt);
            Object.entries(o).forEach(([kk, vv]) => { try { Cloud.raw.set.call(localStorage, kk, vv); } catch (er) { /* yok */ } });
          } else {
            JSON.parse(Store.dec(txt)); // bozuk veri yazılmasın (sıkıştırılmış ya da düz kayıt)
            const sk = +k.slice(1);
            delete Store.pending[Game.key(sk)];
            Cloud.raw.set.call(localStorage, Game.key(sk), txt);
            localStorage.removeItem(Game.sumKey(sk)); // menü özeti yeniden üretilsin
          }
        }
        t[k] = e.t; n++;
      }
      Cloud.setTimes(t);
    } catch (e) { /* ağ ya da veri sorunu: sonra yeniden denenir */ }
    Cloud.busy = false;
    if (n && !Game.state && document.getElementById('slots')) { Game.init(); Game.toast('☁️ Kariyerlerin iCloud\'dan geri yüklendi', 'good'); }
    return n;
  },

  // değişen kayıtları yükle; sığmazsa en eski kariyerler dışarıda kalır
  async push(force) {
    if (!Cloud.ok) return false;
    if (Cloud.busy) { Cloud.later(3000); return false; }
    if (!force && !Cloud.dirty.size) return true;
    Cloud.busy = true;
    let okAll = true;
    try {
      const ix = await Cloud.idx(), t = Cloud.times();
      const keys = force ? ['meta', 0, 1, 2, 3, 4].map((x) => (x === 'meta' ? x : 's' + x)) : [...Cloud.dirty];
      Cloud.dirty.clear();
      // önce silinenler ve meta, sonra en son oynanan kariyerden başlayarak
      keys.sort((a, b) => (a === 'meta' ? -1 : b === 'meta' ? 1 : (t[b] || 0) - (t[a] || 0)));
      for (const k of keys) {
        const raw = k === 'meta' ? Cloud.metaBundle() : localStorage.getItem(Game.key(+k.slice(1)));
        if (!raw) {
          if (ix[k] && !ix[k].del) { await Cloud.pl.remove({ key: 'v_' + k }); ix[k] = { t: t[k] || Date.now(), del: 1 }; }
          continue;
        }
        if (!(t[k] > 1)) t[k] = Date.now();
        const data = await Cloud.zip(raw);
        const size = Math.ceil(data.length * 0.75);
        const used = Object.entries(ix).reduce((a, [kk, e]) => a + (kk !== k && e && !e.del ? e.z || 0 : 0), 0);
        if (used + size > Cloud.LIMIT) { okAll = false; ix[k] = Object.assign({}, ix[k], { full: 1 }); continue; }
        await Cloud.pl.set({ key: 'v_' + k, data });
        ix[k] = { t: t[k] || Date.now(), z: size };
      }
      await Cloud.pl.set({ key: 'idx', text: JSON.stringify(ix) });
      Cloud.setTimes(t);
      Cloud.lastPush = Date.now();
      Cloud.note = okAll ? '' : 'full';
    } catch (e) { okAll = false; Cloud.later(30000); }
    Cloud.busy = false;
    return okAll;
  },

  // Ayarlar kartı
  card() {
    if (!Cloud.pl) return '';
    const sub = !Cloud.ok ? 'Bu cihazda iCloud kapalı. Ayarlar › Apple Hesabı › iCloud\'dan açabilirsin.'
      : Cloud.note === 'full' ? 'iCloud alanı doldu: en son oynadığın kariyerler yedekleniyor.'
      : Cloud.lastPush ? `Son yedek: ${new Date(Cloud.lastPush).toLocaleTimeString(I18N.lang === 'tr' ? 'tr-TR' : undefined, { hour: '2-digit', minute: '2-digit' })}` : 'Kariyerlerin otomatik olarak iCloud\'a yedeklenir.';
    return `<div class="set-row"><span><b>☁️ iCloud yedeği</b><small>${sub}</small></span>${Cloud.ok ? '<button class="btn btn-ghost" data-cloud="push">Şimdi yedekle</button>' : ''}</div>`;
  },
  bind(root) {
    U.$$('[data-cloud]', root).forEach((b) => (b.onclick = async () => {
      if (Game.state) Game.save();
      b.disabled = true;
      const ok = await Cloud.push(true);
      Game.toast(ok ? '☁️ iCloud\'a yedeklendi' : 'Yedekleme şu an yapılamadı, birazdan yeniden denenecek.', ok ? 'good' : 'bad');
      Game.render();
    }));
  },
};

// localStorage yazımlarını izle: kariyer slotu ya da yedeklenen diğer anahtarlar değişince bulut yüklemesi planlanır
Cloud.raw = { set: Storage.prototype.setItem, rm: Storage.prototype.removeItem };
Storage.prototype.setItem = function (k, v) {
  Cloud.raw.set.call(this, k, v);
  if (this !== window.localStorage || !Cloud.ok) return;
  const m = /^starfoot_slot_(\d)$/.exec(k);
  if (m) Cloud.touch('s' + m[1]); else if (!Cloud.skipMeta(k)) Cloud.touch('meta');
};
Storage.prototype.removeItem = function (k) {
  Cloud.raw.rm.call(this, k);
  if (this !== window.localStorage || !Cloud.ok) return;
  const m = /^starfoot_slot_(\d)$/.exec(k);
  if (m) Cloud.touch('s' + m[1]); else if (!Cloud.skipMeta(k)) Cloud.touch('meta');
};

// ---------- Game Center ----------
// Başarımlar: oyundaki madalyaların seçilmiş bir kısmı (Game Center'da en fazla 1000 puan)
const GC_ACH = {
  goal1: 10, g10: 10, goal50: 20, g100: 30, g200: 35, g300: 50, assist50: 20, a100: 25, debut: 5, apps100: 20, m300: 30,
  motm1: 10, motm25: 25, hat: 20, poker: 25, r10: 25, fk1: 10, pen1: 5, hd1: 5, trophy1: 10, tr10: 25, league1: 25, domcup: 20,
  ucl: 50, wc: 70, euro: 50, boot: 25, poty: 25, ballon: 60, ballon3: 80, cap1: 15, cap50: 30, pro: 10, abroad: 15, captain: 20,
  ovr80: 30, ovr90: 40, fame75: 20,
};
const GC_LB = {
  'sf.lb.goals': (p) => p.totals.goals,
  'sf.lb.trophies': (p) => p.trophies.length,
  'sf.lb.ovr': (p) => Player.overall(p),
  'sf.lb.followers': (p) => (p.social ? Math.floor(p.social.followers) : 0),
};
const GC = {
  pl: null, ok: false, sent: {},
  async init() {
    GC.pl = Cloud.plugin('StarfootGameCenter');
    if (!GC.pl) return;
    try { const r = await GC.pl.auth(); GC.ok = !!(r && r.ok); } catch (e) { GC.ok = false; }
    try { GC.pl.addListener('auth', (r) => { GC.ok = !!(r && r.ok); if (GC.ok) GC.sync(); }); } catch (e) { /* yok */ }
    if (GC.ok) GC.sync();
  },
  // açık kariyerin kazanılmış başarımlarını ve skorlarını gönder (tekrarları atlar)
  sync() {
    if (!GC.ok || !Game.state || !Game.p) return;
    const p = Game.p;
    const ids = Object.keys(p.ach || {}).filter((id) => GC_ACH[id] && !GC.sent['a' + id]);
    if (ids.length) { ids.forEach((id) => (GC.sent['a' + id] = 1)); GC.pl.achieve({ ids: ids.map((id) => 'sf.ach.' + id) }).catch(() => {}); }
    const scores = [];
    Object.entries(GC_LB).forEach(([id, f]) => { let v = 0; try { v = Math.max(0, Math.round(f(p) || 0)); } catch (e) { /* yok */ } if (v > 0 && GC.sent[id] !== v) { GC.sent[id] = v; scores.push({ id, value: v }); } });
    if (scores.length) GC.pl.submit({ scores }).catch(() => {});
  },
  show(view) { if (GC.pl) GC.pl.show({ view }).then((r) => { if (!r || !r.ok) Game.toast('Game Center\'a giriş yapılmadı. Ayarlar › Game Center\'dan açabilirsin.', 'bad'); }).catch(() => {}); },
  card() {
    if (!GC.pl) return '';
    return `<div class="set-row"><span><b>🏆 Game Center</b><small>${GC.ok ? 'Başarımların ve skorların dünyayla yarışıyor.' : 'Giriş yapılmadı. Telefon Ayarları › Game Center.'}</small></span><div class="seg"><button data-gc="leaderboards">Sıralama</button><button data-gc="achievements">Başarımlar</button></div></div>`;
  },
  bind(root) { U.$$('[data-gc]', root).forEach((b) => (b.onclick = () => GC.show(b.dataset.gc))); },
};

// Game Center: madalya kazanılınca ve her kayıtta (haftada bir) skorları güncelle
(() => {
  if (typeof Ach !== 'undefined') {
    const chk = Ach.check;
    Ach.check = function () { const got = chk.apply(this, arguments); if (got && got.length) GC.sync(); return got; };
  }
  // menüye dönünce başka cihazdaki yeni kayıtları al
  const gi = Game.init;
  Game.init = function () { gi.apply(this, arguments); if (Cloud.ok) setTimeout(() => Cloud.pull(true), 300); };
  const save = Game.save;
  let last = 0;
  Game.save = function () { save.apply(this, arguments); if (GC.ok && Date.now() - last > 20000) { last = Date.now(); GC.sync(); } };
})();

window.addEventListener('load', () => { setTimeout(() => { Cloud.init(); GC.init(); }, 800); });
