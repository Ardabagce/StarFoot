// StarFoot Premium: tek seferlik satın alma (App Store / Google Play).
// Geçiş reklamlarını kaldırır; ödüllü reklam ödülleri reklam izlemeden verilir. Tüm kariyerlerde geçerli.
const PREMIUM_ID = 'starfoot_premium';
const Premium = {
  active: (() => { try { return localStorage.getItem('starfoot_premium') === '1'; } catch (e) { return false; } })(),
  price: '',
  plugin() {
    const C = window.Capacitor;
    return C && C.isNativePlatform && C.isNativePlatform() && C.Plugins && C.Plugins.NativePurchases ? C.Plugins.NativePurchases : null;
  },
  available() { return !!Premium.plugin(); },
  set(v) {
    Premium.active = !!v;
    try { localStorage.setItem('starfoot_premium', v ? '1' : '0'); } catch (e) { /* yok */ }
  },
  owned(list) {
    return (list || []).some((t) => t && t.productIdentifier === PREMIUM_ID && !/pending|refund|revok/i.test(String(t.purchaseState || '')));
  },
  // Açılışta fiyatı ve önceki satın alımı mağazadan okur (yeniden kurulumda Premium kendiliğinden geri gelir)
  async init() {
    const P = Premium.plugin();
    if (!P) return;
    try {
      const r = await P.getProducts({ productIdentifiers: [PREMIUM_ID], productType: 'inapp' });
      const pr = r && r.products && r.products[0];
      if (pr && pr.priceString) Premium.price = pr.priceString;
    } catch (e) { /* ürün henüz mağazada yok */ }
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
      const t = await P.purchaseProduct({ productIdentifier: PREMIUM_ID, productType: 'inapp' });
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
    </section>`;
  },
};

// Premium'da ödüllü reklam gösterilmez, ödül doğrudan verilir
if (typeof Ads !== 'undefined') {
  const show = Ads.show;
  Ads.show = function () { return Premium.active ? Promise.resolve(true) : show.apply(this, arguments); };
}
if (document.readyState === 'complete') Premium.init(); else window.addEventListener('load', () => Premium.init());
