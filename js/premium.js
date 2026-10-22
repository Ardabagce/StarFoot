// StarFoot Premium: tek seferlik satın alma (App Store / Google Play).
// Geçiş reklamlarını kaldırır; ödüllü reklam ödülleri reklam izlemeden verilir. Tüm kariyerlerde geçerli.
const PREMIUM_ID = 'starfoot_premium';
// Premium açık; şimdilik yalnız iPhone'da (Google Play'de ürün tanımlanınca 'android' eklenir)
const PREMIUM_ENABLED = true;
const PREMIUM_PLATFORMS = ['ios'];
const Premium = {
  active: PREMIUM_ENABLED && (() => { try { return localStorage.getItem('starfoot_premium') === '1'; } catch (e) { return false; } })(),
  price: '',
  plugin() {
    const C = window.Capacitor;
    if (!C || !C.isNativePlatform || !C.isNativePlatform() || !PREMIUM_PLATFORMS.includes(C.getPlatform && C.getPlatform())) return null;
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
    const o = { item_id: PREMIUM_ID, item_name: 'StarFoot Premium' };
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
    } catch (e) { /* yok */ }
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
      if (Premium.owned(r && r.purchases)) { Premium.set(true); Premium.track('premium_restore'); Game.toast('⭐ Premium geri yüklendi.', 'good'); }
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
      return `<section class="card prem on"><div class="prem-h"><i>⭐</i><span><b>Premium aktif</b><small>Geçiş reklamı yok · ödüller reklamsız</small></span></div></section>`;
    }
    return `<section class="card prem">
      <div class="prem-h"><i>⭐</i><span><b>StarFoot Premium</b><small>Tek seferlik satın alma · tüm kariyerlerinde geçerli</small></span></div>
      <ul class="prem-l">
        <li>Geçiş reklamları tamamen kalkar</li>
        <li>Hediye paketi ×2/×3, +1 aksiyon hakkı, enerji, sakatlık −1 hafta ve "tekrar dene" ödülleri <b>reklam izlemeden</b></li>
      </ul>
      <button class="btn btn-play" data-prem-buy>${Icon('star')} Premium al${Premium.price ? ` · ${U.esc(Premium.price)}` : ''}</button>
      <button class="btn btn-ghost prem-restore" data-prem-restore>Satın alımları geri yükle</button>
      ${!Premium.loaded && Premium.err ? `<p class="prem-err">${Premium.err === 'empty' ? 'Ürün bilgisi App Store\'dan alınamadı (ürün bulunamadı).' : `Mağazaya ulaşılamadı: ${U.esc(Premium.err)}`}</p>` : ''}
    </section>`;
  },
};

// Premium'da ödüllü reklam gösterilmez, ödül doğrudan verilir
if (typeof Ads !== 'undefined') {
  const show = Ads.show;
  Ads.show = function () { return Premium.active ? Promise.resolve(true) : show.apply(this, arguments); };
}
if (document.readyState === 'complete') Premium.init(); else window.addEventListener('load', () => Premium.init());
