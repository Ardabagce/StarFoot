// StarFoot Diamond (1.0.19): her şey dahil tek satın alma.
// Premium + Premium+ + tüm oyun modları (Dünya Şampiyonası, Efsaneler, Teknik Direktör) + gelecekteki modlar
// + Altın koleksiyon (altın/elmas krampon, platin saç, elmas rozet). Premium+ sahiplerine indirimli yükseltme.
const DIA_IDS = { full: 'starfoot_diamond', upg: 'starfoot_diamond_upg' };
const DIA_ALL = Object.values(DIA_IDS);

const Diamond = {
  active: (() => { try { return localStorage.getItem('starfoot_diamond') === '1'; } catch (e) { return false; } })(),
  prices: {},
  enabled() { return typeof FEAT_V19 !== 'undefined' && FEAT_V19; },
  set(v) {
    Diamond.active = !!v;
    try { localStorage.setItem('starfoot_diamond', v ? '1' : '0'); } catch (e) { /* yok */ }
    if (v) { Plus.set(true); Premium.set(true); ['wc', 'legends', 'coach'].forEach((k) => Packs.set(k)); }
  },
  owned(list) { return (list || []).some((t) => t && DIA_ALL.includes(t.productIdentifier) && !/pending|refund|revok/i.test(String(t.purchaseState || ''))); },
  key() { return Plus.active ? 'upg' : 'full'; },
  priceOf(k) { const x = Diamond.prices[k || Diamond.key()]; return x ? x.s : ''; },
  async load() {
    const P = Premium.plugin();
    if (!P) return false;
    try {
      const r = await P.getProducts({ productIdentifiers: DIA_ALL, productType: 'inapp' });
      ((r && r.products) || []).forEach((pr) => { const k = Object.keys(DIA_IDS).find((x) => DIA_IDS[x] === pr.identifier); if (k) Diamond.prices[k] = { id: pr.identifier, s: pr.priceString, n: Number(pr.price) || 0, c: pr.currencyCode || '' }; });
      return true;
    } catch (e) { return false; }
  },
  async buy(src) {
    const P = Premium.plugin();
    if (!P || Premium.busy) return false;
    const k = Diamond.key();
    if (!Diamond.prices[k]) await Diamond.load();
    if (!Diamond.prices[k]) { Game.toast('Diamond çok yakında!', 'info'); return false; }
    Premium.busy = true;
    let ok = false;
    const id = Diamond.prices[k].id;
    try {
      Premium.track('diamond_tap', { item_id: id, source: src || 'card' });
      const t = await P.purchaseProduct({ productIdentifier: id, productType: 'inapp', quantity: 1 });
      if (t) {
        Diamond.set(true); ok = true;
        const pr = Diamond.prices[k];
        const m = { item_id: id, item_name: 'StarFoot Diamond', source: src || 'card' };
        if (pr.n) m.value = pr.n;
        if (pr.c) m.currency = pr.c;
        if (t.transactionId) m.transaction_id = String(t.transactionId);
        Premium.track('diamond_purchase', m);
        Premium.track('purchase', m);
        Game.toast('💎 Diamond aktif! Her şey senin.', 'good');
      }
    } catch (e) {
      const msg = String((e && (e.message || e.code)) || e);
      if (!/cancel/i.test(msg)) { Premium.track('premium_fail', { reason: msg.slice(0, 90), item_id: id }); Game.toast('Satın alma tamamlanamadı. Biraz sonra tekrar dene.', 'bad'); }
    }
    Premium.busy = false;
    if (Game.state) Game.render();
    return ok;
  },
  perks() {
    const mode = (ic, t, d) => `<div class="dia-mode"><span>${Icon(ic)}</span><b>${t}</b><small>${d}</small></div>`;
    const li = (t, d) => `<li><b>${t}</b><small>${d}</small></li>`;
    return `<div class="dia-sec">3 oyun modu dahil</div>
    <div class="dia-modes">
      ${mode('coach', 'Teknik Direktör', 'Kulüp yönet, transfer yap, maçı kenardan yönet')}
      ${mode('globe', 'Dünya Şampiyonası Rüyası', 'Milli takımınla kupayı kaldır')}
      ${mode('star', 'Efsanelerin İzinde', 'Efsanelerin kariyerini yeniden yaz')}
    </div>
    <div class="dia-sec">Premium'un tamamı</div>
    <ul class="prem-l star-perks dia-perks">
      ${li('Reklamsız', 'Geçiş reklamı yok, ödüller reklam izlemeden')}
      ${li('Starpedia ve kariyer belgeseli', 'Kendi ansiklopedi sayfan ve hikâyenin filmi')}
      ${li('Sınırsız transfer talebi', 'İstediğin kulübe her dönem istediğin kadar talep gönder')}
      ${li('Görünüm stüdyosu', 'Yeni saç modelleri, sakallar, saç bandı ve içlik dahil')}
      ${li('Lüks yaşam ve StarDeğer', 'Süper arabalar, villalar, yat, değer grafiğin ve söylentiler')}
    </ul>
    <div class="dia-sec">Premium+'ın tamamı</div>
    <ul class="prem-l star-perks dia-perks">
      ${li('Kaleci kariyeri', 'Kurtarışlar, penaltı düelloları, gol yememe')}
      ${li('10 kariyer slotu, geri al, hızlı ilerleme', 'Kötü giden maçı yeniden oyna, istediğin haftaya atla')}
      ${li('Detaylı kariyer istatistikleri', 'Kafa, penaltı ve frikik golleri, rakiplere göre dağılım')}
    </ul>
    <div class="dia-sec">Sadece Diamond'da</div>
    <ul class="prem-l star-perks dia-perks">
      ${li('Altın koleksiyon', 'Altın ve elmas krampon, platin saç rengi, profilinde elmas rozet')}
      ${li('Gelecekteki tüm modlar', 'Bundan sonra çıkan her yeni mod ücretsiz senin')}
    </ul>`;
  },
  // tanıtım penceresi
  pitch(src) {
    const can = Premium.available();
    Premium.track('diamond_view', { source: src || 'menu' });
    if (Diamond.active) return Game.modal(`<div class="dia-hero">${Diamond.gem()}<h2 lang="en">StarFoot Diamond</h2><p>Diamond sende! Her şey açık.</p></div>${Diamond.perks()}`, [{ t: 'Harika', cls: 'btn-big' }], { wide: true });
    if (can && !Diamond.prices[Diamond.key()]) Diamond.load().then(() => { const el = document.querySelector('.dia-price'); if (el && Diamond.priceOf()) el.textContent = Diamond.priceOf(); });
    const up = Plus.active;
    const btns = [{ t: 'Kapat', cls: 'btn-ghost' }];
    if (can) btns.push({ t: `<span lang="en">💎 ${up ? 'Yükselt' : 'Diamond al'}</span> · <span class="dia-price">${U.esc(Diamond.priceOf() || '')}</span>`, cls: 'btn-big dia-btn', fn: () => Diamond.buy(src) });
    Game.modal(`<div class="dia-hero">${Diamond.gem()}<div class="ev-tag dia-tag">Çıkışa özel fiyat</div><h2 lang="en">StarFoot Diamond</h2><p>${up ? 'Premium+ sahibisin: Diamond\'a indirimli yükselt.' : 'Tek seferlik satın alma, her şey sonsuza kadar senin.'}</p></div>${Diamond.perks()}
      ${can ? '<p class="muted">Tek seferlik satın alma. Abonelik yok, tüm cihazlarında geri yükleyebilirsin.</p>' : '<p class="muted">Diamond App Store ve Google Play uygulamasında satın alınabilir.</p>'}`, btns, { wide: true });
  },
  gem(size) {
    const s = size || 64;
    return `<svg class="dia-gem" width="${s}" height="${s}" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="dgm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8fbff"/><stop offset=".5" stop-color="#7fdcff"/><stop offset="1" stop-color="#3a8dff"/></linearGradient></defs><path fill="url(#dgm)" stroke="#fff" stroke-width="1.5" d="M14 8h36l12 16-30 34L2 24z"/><path fill="none" stroke="rgba(255,255,255,.75)" stroke-width="1.4" d="M2 24h60M22 8l-8 16 18 34 18-34-8-16M14 24l8-16M50 24l-8-16"/></svg>`;
  },
  // profil rozeti (Premium'un altın rozetinin yerine)
  badge() { return '<svg class="igv igv-dia" viewBox="0 0 40 40"><defs><linearGradient id="igvd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e8fbff"/><stop offset=".5" stop-color="#7fdcff"/><stop offset="1" stop-color="#3a8dff"/></linearGradient></defs><path fill="url(#igvd)" d="M9 5h22l8 10-19 22L1 15z"/><path fill="#fff" d="m16.6 26.6-6-6 2.3-2.3 3.7 3.7 9.3-9.3 2.3 2.3z"/></svg>'; },
  // Altın koleksiyon renkleri (yalnız Diamond)
  BOOTS: ['#e3b341', '#9be7ff'],
  HAIRS: ['#f4f1e8'],
};
