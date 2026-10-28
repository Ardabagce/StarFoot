// StarFoot Premium: tek seferlik satın alma (App Store / Google Play).
// Geçiş reklamlarını kaldırır; ödüllü reklam ödülleri reklam izlemeden verilir. Tüm kariyerlerde geçerli.
const PREMIUM_ID = 'starfoot_premium';
// Premium açık; şimdilik yalnız iPhone'da (Google Play'de ürün tanımlanınca 'android' eklenir)
const PREMIUM_ENABLED = true;
const PREMIUM_PLATFORMS = ['ios'];

// RevenueCat (App Store satın almaları). Herkese açık SDK anahtarı; gizli değildir.
const RC_KEYS = { ios: 'appl_tpkurfIlsSGEYVvWSdgVWMUUnDt' };
const RC_ENT = { starfoot_football_career_pro: 'starfoot_premium', wc: 'starfoot_wc', legends: 'starfoot_legends' };
// Oyunun geri kalanı eski eklentinin (getProducts / getPurchases / purchaseProduct / restorePurchases)
// biçimini kullanır; bu katman aynı biçimi RevenueCat üzerinden verir.
const RCStore = {
  cfg: null, info: null, prods: {},
  rc() { return window.Capacitor.Plugins.Purchases; },
  ready() {
    if (!RCStore.cfg) {
      RCStore.cfg = (async () => {
        const R = RCStore.rc();
        const key = RC_KEYS[window.Capacitor.getPlatform()];
        if (!key) throw new Error('no key');
        const c = await R.isConfigured().catch(() => ({ isConfigured: false }));
        if (!c || !c.isConfigured) await R.configure({ apiKey: key });
        // RevenueCat'ten önce yapılmış satın almalar bir kez aktarılır (StoreKit 2'de giriş istemez)
        let synced = false;
        try { synced = localStorage.getItem('starfoot_rc_synced') === '1'; } catch (e) { /* yok */ }
        if (!synced) {
          try { await R.syncPurchases(); localStorage.setItem('starfoot_rc_synced', '1'); } catch (e) { /* sonra yeniden denenir */ }
        }
      })();
      RCStore.cfg.catch(() => { RCStore.cfg = null; });
    }
    return RCStore.cfg;
  },
  // CustomerInfo -> eski biçimde satın alma listesi
  list(info) {
    const out = [];
    const seen = new Set();
    ((info && info.nonSubscriptionTransactions) || []).forEach((t) => {
      if (t && t.productIdentifier && !seen.has(t.productIdentifier)) { seen.add(t.productIdentifier); out.push({ productIdentifier: t.productIdentifier, transactionId: t.transactionIdentifier, purchaseState: 'purchased' }); }
    });
    const act = (info && info.entitlements && info.entitlements.active) || {};
    Object.entries(RC_ENT).forEach(([ent, pid]) => { if (act[ent] && !seen.has(pid)) { seen.add(pid); out.push({ productIdentifier: pid, purchaseState: 'purchased' }); } });
    return out;
  },
  async getProducts({ productIdentifiers }) {
    await RCStore.ready();
    const r = await RCStore.rc().getProducts({ productIdentifiers, type: 'NON_SUBSCRIPTION' });
    const products = ((r && r.products) || []).map((p) => {
      RCStore.prods[p.identifier] = p;
      return { identifier: p.identifier, priceString: p.priceString, price: p.price, currencyCode: p.currencyCode, title: p.title };
    });
    return { products };
  },
  async getPurchases() {
    await RCStore.ready();
    const r = await RCStore.rc().getCustomerInfo();
    RCStore.info = r && r.customerInfo;
    return { purchases: RCStore.list(RCStore.info) };
  },
  async purchaseProduct({ productIdentifier }) {
    await RCStore.ready();
    if (!RCStore.prods[productIdentifier]) await RCStore.getProducts({ productIdentifiers: [productIdentifier] });
    const product = RCStore.prods[productIdentifier];
    if (!product) throw new Error('product not found');
    try {
      const r = await RCStore.rc().purchaseStoreProduct({ product });
      RCStore.info = r && r.customerInfo;
      const t = r && r.transaction;
      return { productIdentifier, transactionId: t && t.transactionIdentifier };
    } catch (e) {
      if (e && (e.userCancelled || (e.data && e.data.userCancelled) || String(e.code) === '1' || /cancel/i.test(String(e.message || '')))) throw new Error('cancelled');
      throw e;
    }
  },
  async restorePurchases() {
    await RCStore.ready();
    const r = await RCStore.rc().restorePurchases();
    RCStore.info = r && r.customerInfo;
    return { purchases: RCStore.list(RCStore.info) };
  },
};
const Premium = {
  active: PREMIUM_ENABLED && (() => { try { return localStorage.getItem('starfoot_premium') === '1'; } catch (e) { return false; } })(),
  price: '',
  plugin() {
    const C = window.Capacitor;
    if (!C || !C.isNativePlatform || !C.isNativePlatform() || !PREMIUM_PLATFORMS.includes(C.getPlatform && C.getPlatform())) return null;
    if (C.Plugins && C.Plugins.Purchases) return RCStore;
    return C.Plugins && C.Plugins.NativePurchases ? C.Plugins.NativePurchases : null;
  },
  available() { return PREMIUM_ENABLED && !!Premium.plugin(); },
  // Firebase Analytics'e olay gönderir (Realtime ekranında anında görünür). Hata oyunu etkilemez.
  track(name, params = {}) {
    try {
      const F = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.FirebaseAnalytics;
      if (F && F.logEvent) F.logEvent({ name, params }).catch(() => {});
    } catch (e) { /* analytics yok */ }
  },
  // Ürünün sayısal fiyatı ve para birimi (gelir olarak raporlanır)
  money() {
    const o = { item_id: PREMIUM_ID, item_name: 'StarFoot Premium', source: Premium.src || 'card' };
    if (Premium.amount > 0) o.value = Premium.amount;
    if (Premium.currency) o.currency = Premium.currency;
    return o;
  },
  set(v) {
    Premium.active = !!v;
    try { localStorage.setItem('starfoot_premium', v ? '1' : '0'); } catch (e) { /* yok */ }
  },
  owned(list) {
    return (list || []).some((t) => t && t.productIdentifier === PREMIUM_ID && !/pending|refund|revok/i.test(String(t.purchaseState || '')));
  },
  // Açılışta fiyatı ve önceki satın alımı mağazadan okur (yeniden kurulumda Premium kendiliğinden geri gelir)
  // Ürün bilgisini (yerel fiyatıyla) mağazadan yükler; başarısız olursa false
  async loadProduct() {
    const P = Premium.plugin();
    if (!P) return false;
    try {
      const r = await P.getProducts({ productIdentifiers: [PREMIUM_ID], productType: 'inapp' });
      const pr = r && r.products && r.products[0];
      if (pr) {
        Premium.price = pr.priceString || Premium.price; Premium.loaded = true; Premium.err = '';
        Premium.amount = Number(pr.price) || 0;
        Premium.currency = pr.currencyCode || '';
      }
      else Premium.err = 'empty';
    } catch (e) { Premium.err = String((e && (e.message || e.code)) || e).slice(0, 80); /* bağlantı yok */ }
    return !!Premium.loaded;
  },
  async init() {
    const P = Premium.plugin();
    if (!P || !PREMIUM_ENABLED) return;
    if (!(await Premium.loadProduct())) setTimeout(() => Premium.loadProduct().then((ok) => { if (ok && Game.state) Game.render(); }), 8000);
    try {
      const r = await P.getPurchases({ productType: 'inapp' });
      if (Premium.owned(r && r.purchases)) Premium.set(true);
      Packs.sync(r && r.purchases);
    } catch (e) { /* yok */ }
    Packs.load();
    if (typeof Game !== 'undefined' && Game.state && !document.getElementById('hub').classList.contains('hidden')) Game.render();
  },
  async buy() {
    const P = Premium.plugin();
    if (!P || Premium.busy) return;
    Premium.busy = true;
    try {
      // satın almadan önce ürün yüklenmediyse yeniden dene (StoreKit ürünü tanımadan satın alma başlatılamaz)
      if (!Premium.loaded && !(await Premium.loadProduct())) {
        Game.toast('Mağazaya şu an ulaşılamıyor. İnternet bağlantını kontrol edip tekrar dene.', 'bad');
        Premium.busy = false;
        return;
      }
      Premium.track('premium_tap', Premium.money());
      const t = await P.purchaseProduct({ productIdentifier: PREMIUM_ID, productType: 'inapp', quantity: 1 });
      if (t) {
        Premium.set(true);
        Game.toast('⭐ Premium aktif! Desteğin için teşekkürler.', 'good');
        const m = Premium.money();
        if (t.transactionId) m.transaction_id = String(t.transactionId);
        Premium.track('premium_purchase', m);
        Premium.track('purchase', m); // Firebase'in standart gelir olayı
      }
    } catch (e) {
      const msg = String((e && (e.message || e.code)) || e);
      if (/cancel/i.test(msg)) Premium.track('premium_cancel');
      else { Premium.track('premium_fail', { reason: msg.slice(0, 90) }); Game.toast('Satın alma tamamlanamadı. Biraz sonra tekrar dene.', 'bad'); }
    }
    Premium.busy = false;
    Game.render();
  },
  async restore() {
    const P = Premium.plugin();
    if (!P || Premium.busy) return;
    Premium.busy = true;
    try {
      await P.restorePurchases();
      const r = await P.getPurchases({ productType: 'inapp' });
      const packs = Packs.sync(r && r.purchases);
      if (Premium.owned(r && r.purchases)) { Premium.set(true); Premium.track('premium_restore'); Game.toast('⭐ Premium geri yüklendi.', 'good'); }
      else if (packs) Game.toast('Satın aldığın paketler geri yüklendi.', 'good');
      else Game.toast('Bu hesapta Premium satın alımı bulunamadı.', 'info');
    } catch (e) {
      Game.toast('Geri yükleme yapılamadı. İnternet bağlantını kontrol et.', 'bad');
    }
    Premium.busy = false;
    Game.render();
  },
  // Ödüllü reklam düğmelerindeki ön ek
  lbl() { return Premium.active ? '⭐ Premium' : 'Reklam izle'; },
  // Mağaza ve Profil'de gösterilen kart (yalnız App Store / Google Play uygulamasında)
  card() {
    if (!Premium.available()) return '';
    if (Premium.active) {
      return `<section class="card prem on"><div class="prem-h"><i>⭐</i><span><b>Premium aktif</b><small>Yıldız gibi yaşa: rozet, Starpedia, lüks vitrin, reklamsız</small></span></div></section>`;
    }
    return `<section class="card prem">
      <div class="prem-h"><i>⭐</i><span><b>Yıldız gibi yaşa</b><small>StarFoot Premium · tek seferlik satın alma, tüm kariyerlerinde geçerli</small></span></div>
      ${typeof Star !== 'undefined' ? Star.perksHtml() : `<ul class="prem-l">
        <li>Geçiş reklamları tamamen kalkar</li>
        <li>Hediye paketi ×2/×3, +1 aksiyon hakkı, enerji, sakatlık −1 hafta ve "tekrar dene" ödülleri <b>reklam izlemeden</b></li>
      </ul>`}
      <button class="btn btn-play" data-prem-buy>${Icon('star')} Premium al${Premium.price ? ` · ${U.esc(Premium.price)}` : ''}</button>
      <button class="btn btn-ghost prem-restore" data-prem-restore>Satın alımları geri yükle</button>
      ${!Premium.loaded && Premium.err ? `<p class="prem-err">${Premium.err === 'empty' ? 'Ürün bilgisi App Store\'dan alınamadı (ürün bulunamadı).' : `Mağazaya ulaşılamadı: ${U.esc(Premium.err)}`}</p>` : ''}
    </section>`;
  },
};

// İçerik paketleri: tek seferlik satın alınan oyun modları (App Store)
const PACKS = {
  wc: { id: 'starfoot_wc', ic: 'star', t: 'Dünya Şampiyonası Rüyası', d: '18 yaşında seçtiğin milli takımla tek bir Dünya Şampiyonası\'na odaklanan, kendi kaydı olan ayrı bir mod.',
    f: ['65 milli takım arasından ülkeni seç, 48 takımlı turnuvada oyna', 'Hazırlık kampı, hazırlık maçları ve kadro açıklaması', 'Maçlar arası günler: antrenman, taktik, röportaj, kamp olayları', 'Eleme turlarında penaltı atışları: penaltını sen atarsın', 'Gol Kralı Kupası, Altın Yıldız ve En İyi Genç Oyuncu ödülleri', 'Aynı oyuncuyla 4 turnuvalık milli takım kariyeri (2026–2038)', 'Rakip analizi, taktik seçimi ve 26 çıkartmalık hedef albümü'] },
  legends: { id: 'starfoot_legends', ic: 'fire', t: 'Efsanelerin İzinde', d: 'Futbol tarihinin efsanelerinden esinlenen 6 kurgusal kariyer: onların doğduğu yılda, onların altyapısında ve yetenekleriyle başla.',
    f: ['6 efsane hikâyesi: Arjantin, Portekiz, Brezilya ve Fransa\'dan', 'Efsanenin kulüplerinden gelen hikâye transferleri ve dönüm noktaları', 'Başlangıçta özel yetenek ve efsanenin oyun tarzına uygun özellikler', 'Efsanenin başarılarına göre hedefler ve emeklilikte karşılaştırma'] },
};
const Packs = {
  price: {},
  key(k) { return 'starfoot_pack_' + k; },
  owns(k) { try { return localStorage.getItem(Packs.key(k)) === '1'; } catch (e) { return false; } },
  set(k) { try { localStorage.setItem(Packs.key(k), '1'); } catch (e) { /* yok */ } },
  // mağazadaki satın alımlara göre sahiplik; yeni paket bulunduysa true
  sync(list) {
    let got = false;
    Object.entries(PACKS).forEach(([k, x]) => {
      const has = (list || []).some((t) => t && t.productIdentifier === x.id && !/pending|refund|revok/i.test(String(t.purchaseState || '')));
      if (has && !Packs.owns(k)) { Packs.set(k); got = true; }
    });
    return got;
  },
  async load() {
    const P = Premium.plugin();
    if (!P) return false;
    try {
      const r = await P.getProducts({ productIdentifiers: Object.values(PACKS).map((x) => x.id), productType: 'inapp' });
      (r && r.products || []).forEach((pr) => { const k = Object.keys(PACKS).find((x) => PACKS[x].id === pr.identifier); if (k) Packs.price[k] = { s: pr.priceString, n: Number(pr.price) || 0, c: pr.currencyCode || '' }; });
      return true;
    } catch (e) { return false; }
  },
  async buy(k) {
    const P = Premium.plugin(), x = PACKS[k];
    if (!P || Premium.busy) return false;
    Premium.busy = true;
    let ok = false;
    try {
      if (!Packs.price[k]) await Packs.load();
      Premium.track('pack_tap', { item_id: x.id });
      const t = await P.purchaseProduct({ productIdentifier: x.id, productType: 'inapp', quantity: 1 });
      if (t) {
        Packs.set(k); ok = true;
        const pr = Packs.price[k] || {};
        const m = { item_id: x.id, item_name: x.t };
        if (pr.n) m.value = pr.n;
        if (pr.c) m.currency = pr.c;
        if (t.transactionId) m.transaction_id = String(t.transactionId);
        Premium.track('pack_purchase', m);
        Premium.track('purchase', m);
        Game.toast(`${x.t} açıldı! İyi eğlenceler.`, 'good');
      }
    } catch (e) {
      const msg = String((e && (e.message || e.code)) || e);
      if (!/cancel/i.test(msg)) { Premium.track('premium_fail', { reason: msg.slice(0, 90), item_id: x.id }); Game.toast('Satın alma tamamlanamadı. Biraz sonra tekrar dene.', 'bad'); }
    }
    Premium.busy = false;
    return ok;
  },
  // Paket tanıtımı ve satın alma penceresi
  offer(k) {
    const x = PACKS[k];
    const can = Premium.available();
    const pr = Packs.price[k];
    const btns = [{ t: 'Kapat', cls: 'btn-ghost' }];
    if (can) {
      btns.push({ t: 'Satın alımları geri yükle', cls: 'btn-ghost', fn: () => Premium.restore().then(() => { if (Packs.owns(k)) Packs.open(k); }) });
      btns.push({ t: `${Icon(x.ic)} Satın al${pr ? ` · ${U.esc(pr.s)}` : ''}`, cls: 'btn-big', fn: () => Packs.buy(k).then((ok) => { if (ok) Packs.open(k); }) });
    }
    Game.modal(`<div class="ev-tag">Yeni mod</div><h2>${Icon(x.ic)} ${x.t}</h2><p>${x.d}</p>
      <ul class="prem-l">${x.f.map((t) => `<li>${t}</li>`).join('')}</ul>
      ${can ? '<p class="muted">Tek seferlik satın alma. Reklam yok, tüm cihazlarında geri yükleyebilirsin.</p>' : '<p class="muted">Bu mod App Store uygulamasında satın alınabilir.</p>'}`, btns, { wide: true });
  },
  open(k) { if (k === 'wc') WC.menu(); else LPath.menu(); },
};

// Premium'da ödüllü reklam gösterilmez, ödül doğrudan verilir
if (typeof Ads !== 'undefined') {
  const show = Ads.show;
  Ads.show = function () { return Premium.active ? Promise.resolve(true) : show.apply(this, arguments); };
}
if (document.readyState === 'complete') Premium.init(); else window.addEventListener('load', () => Premium.init());
