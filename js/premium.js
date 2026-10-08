// StarFoot Premium: tek seferlik satın alma (App Store / Google Play).
// Geçiş reklamlarını kaldırır; ödüllü reklam ödülleri reklam izlemeden verilir. Tüm kariyerlerde geçerli.
const PREMIUM_ID = 'starfoot_premium';
// Premium şimdilik kapalı (ilk App Store onayından sonra true yapılıp yeniden açılacak)
const PREMIUM_ENABLED = false;
const Premium = {
  active: PREMIUM_ENABLED && (() => { try { return localStorage.getItem('starfoot_premium') === '1'; } catch (e) { return false; } })(),
  price: '',
  plugin() {
    const C = window.Capacitor;
    return C && C.isNativePlatform && C.isNativePlatform() && C.Plugins && C.Plugins.NativePurchases ? C.Plugins.NativePurchases : null;
  },
  available() { return PREMIUM_ENABLED && !!Premium.plugin(); },
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
      if (pr) { Premium.price = pr.priceString || Premium.price; Premium.loaded = true; Premium.err = ''; }
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
      const t = await P.purchaseProduct({ productIdentifier: PREMIUM_ID, productType: 'inapp', quantity: 1 });
      if (t) { Premium.set(true); Game.toast('⭐ Premium aktif! Desteğin için teşekkürler.', 'good'); }
    } catch (e) {
      if (!/cancel/i.test(String((e && (e.message || e.code)) || e))) Game.toast('Satın alma tamamlanamadı. Biraz sonra tekrar dene.', 'bad');
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
      if (Premium.owned(r && r.purchases)) { Premium.set(true); Game.toast('⭐ Premium geri yüklendi.', 'good'); }
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
