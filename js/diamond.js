// StarFoot Diamond (1.0.19): her şey dahil tek satın alma.
// Premium + Premium+ + tüm oyun modları (Dünya Şampiyonası, Efsaneler, Teknik Direktör) + gelecekteki modlar
// + Altın koleksiyon (altın/elmas krampon, platin saç, elmas rozet). Premium+ sahiplerine indirimli yükseltme.
// Fiyat kademeleri (ABD): full 7.99 · u599 5.99 · upg 3.99 · u199 1.99 · u099 0.99.
// Sahip olunan paketlerin değeri düşülür: Premium 1.99, Premium+ 3.99 (DŞ ve Efsaneler dahil), DŞ/Efsaneler 1.99'ar, Teknik Direktör 3.99.
const DIA_IDS = { full: 'starfoot_diamond', u599: 'starfoot_diamond_u599', upg: 'starfoot_diamond_upg', u199: 'starfoot_diamond_u199', u099: 'starfoot_diamond_u099' };
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
  // sahip olunanların değeri (USD): Premium+ kapsamı en fazla 3.99, Teknik Direktör 3.99
  owned() {
    const raw = (k) => { try { return localStorage.getItem(Packs.key(k)) === '1'; } catch (e) { return false; } };
    const plus = typeof Plus !== 'undefined' && Plus.active;
    const base = plus ? 3.99 : Math.min(3.99, (Premium.active ? 1.99 : 0) + (raw('wc') ? 1.99 : 0) + (raw('legends') ? 1.99 : 0));
    return base + (raw('coach') ? 3.99 : 0);
  },
  ideal() {
    const r = 7.99 - Diamond.owned();
    return r > 7 ? 'full' : r > 5 ? 'u599' : r > 3 ? 'upg' : r > 1.5 ? 'u199' : 'u099';
  },
  // mağazada henüz açılmamış (onay bekleyen) kademe varsa bir üst kademe kullanılır; satın alma hiç kırılmaz
  key() {
    const order = ['u099', 'u199', 'upg', 'u599', 'full'], want = Diamond.ideal();
    if (!Object.keys(Diamond.prices).length) return want;
    for (let i = order.indexOf(want); i < order.length; i++) if (Diamond.prices[order[i]]) return order[i];
    return want;
  },
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
    if (!Diamond.prices[Diamond.key()]) await Diamond.load();
    const k = Diamond.key();
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
      if (!/cancel/i.test(msg)) { Premium.track('premium_fail', { reason: msg.slice(0, 90), item_id: id }); Game.toast(/not found|network|offline|internet|çevrimdışı/i.test(msg) ? 'Mağazaya ulaşılamadı. İnternet bağlantını kontrol edip tekrar dene.' : 'Satın alma tamamlanamadı. Biraz sonra tekrar dene.', 'bad'); }
    }
    Premium.busy = false;
    if (Game.state) Game.render();
    return ok;
  },
  perks() {
    const mode = (ic, t, d) => `<div class="dia-mode"><canvas class="dia-cv" data-dm="${ic}" width="240" height="150"></canvas><span>${Icon(ic)}</span><b>${t}</b><small>${d}</small></div>`;
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
  // mod kartlarındaki metinsiz küçük çizimler (her dilde aynı)
  paintModes(root) {
    if (!root || typeof Sprites === 'undefined') return;
    U.$$('canvas.dia-cv', root).forEach((cv) => {
      const c = cv.getContext('2d'), W = cv.width, H = cv.height, k = cv.dataset.dm;
      const bg = c.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, k === 'coach' ? '#1f3d2b' : k === 'globe' ? '#1b2f63' : '#3a2a08'); bg.addColorStop(1, '#0b1020');
      c.fillStyle = bg; c.fillRect(0, 0, W, H);
      // ışık huzmeleri
      c.save(); c.globalAlpha = 0.18; c.fillStyle = k === 'star' ? '#ffd76a' : '#ffffff';
      for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(30 + i * 60, 0); c.lineTo(60 + i * 60, 0); c.lineTo(W / 2 + (i - 1.5) * 18, H); c.closePath(); c.fill(); }
      c.restore();
      c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(0, H * 0.82, W, H * 0.18);
      const look = { skin: SKINS[2], hair: HAIRS[0], style: 'short' };
      if (k === 'coach') {
        const kit = { shirt: '#1d2433', alt: '#ffffff', pattern: 'plain', shorts: '#1d2433', socks: '#1d2433', pants: '#1d2433', coat: 'suit', tie: '#c8102e' };
        // taktik tahtası
        c.fillStyle = '#2e7d4f'; c.fillRect(W * 0.06, H * 0.2, W * 0.26, H * 0.36); c.strokeStyle = '#fff'; c.lineWidth = 2; c.strokeRect(W * 0.06, H * 0.2, W * 0.26, H * 0.36);
        c.fillStyle = '#ffcf3f'; [[0.12, 0.3], [0.2, 0.42], [0.26, 0.28]].forEach(([x, y]) => { c.beginPath(); c.arc(W * x, H * y, 4, 0, Math.PI * 2); c.fill(); });
        Sprites.figure(c, W * 0.55, H * 0.97, H * 0.9, { kit, look: Object.assign(look, { beard: 'stubble', boots: '#111' }), facing: 'down', number: null, t: 0, longSleeve: true });
      } else if (k === 'globe') {
        Sprites.figure(c, W * 0.4, H * 0.97, H * 0.88, { kit: { shirt: '#ffd400', alt: '#0a7d3b', pattern: 'plain', shorts: '#0a3d8f', socks: '#ffffff' }, look, facing: 'down', number: 10, t: 0 });
        if (typeof SocialArt !== 'undefined' && SocialArt.trophyCup) SocialArt.trophyCup(c, W * 0.75, H * 0.55, H * 0.55);
      } else {
        c.save(); c.shadowColor = '#ffd76a'; c.shadowBlur = 30;
        Sprites.figure(c, W * 0.5, H * 0.97, H * 0.9, { kit: { shirt: '#f4f4f4', alt: '#c9a227', pattern: 'band', shorts: '#16181d', socks: '#f4f4f4' }, look: Object.assign(look, { style: 'long', hair: HAIRS[1] }), facing: 'down', number: 7, t: 0 });
        c.restore();
        c.fillStyle = '#ffd76a';
        [[0.18, 0.25, 7], [0.82, 0.3, 9], [0.12, 0.55, 5], [0.88, 0.6, 6]].forEach(([x, y, r]) => { if (Sprites.star) Sprites.star(c, W * x, H * y, r, 0); });
      }
    });
  },
  // tanıtım penceresi
  pitch(src) {
    const can = Premium.available();
    Premium.track('diamond_view', { source: src || 'menu' });
    if (Diamond.active) { const m0 = Game.modal(`<div class="dia-hero">${Diamond.gem()}<h2 lang="en">StarFoot Diamond</h2><p>Diamond sende! Her şey açık.</p></div>${Diamond.perks()}`, [{ t: 'Harika', cls: 'btn-big' }], { wide: true }); Diamond.paintModes(m0); return m0; }
    if (can && (!Diamond.prices[Diamond.key()] || !Diamond.prices.full)) Diamond.load().then(() => { U.$$('.dia-price, .dia-price2').forEach((el) => { if (Diamond.priceOf()) el.textContent = Diamond.priceOf(); }); const w = document.querySelector('.dia-was'); if (w && Diamond.prices.full && Diamond.key() !== 'full') w.innerHTML = `<s>${U.esc(Diamond.priceOf('full'))}</s> yerine <b class="dia-price2">${U.esc(Diamond.priceOf())}</b>`; });
    const up = Diamond.key() !== 'full';
    const btns = [{ t: 'Kapat', cls: 'btn-ghost' }];
    if (can) btns.push({ t: `<span lang="en">💎 ${up ? 'Yükselt' : 'Diamond al'}</span> · <span class="dia-price">${U.esc(Diamond.priceOf() || '')}</span>`, cls: 'btn-big dia-btn', fn: () => Diamond.buy(src) });
    const dm = Game.modal(`<div class="dia-hero">${Diamond.gem()}<div class="ev-tag dia-tag">Çıkışa özel fiyat</div><h2 lang="en">StarFoot Diamond</h2><p>${up ? 'Sahip olduğun paketler fiyattan düşüldü: Diamond’a indirimli yükselt.' : 'Tek seferlik satın alma, her şey sonsuza kadar senin.'}</p>${up ? `<p class="dia-was muted">${Diamond.prices.full ? `<s>${U.esc(Diamond.priceOf('full'))}</s> yerine` : ''} <b class="dia-price2">${U.esc(Diamond.priceOf() || '')}</b></p>` : ''}</div>${Diamond.perks()}
      ${can ? '<p class="muted">Tek seferlik satın alma. Abonelik yok, tüm cihazlarında geri yükleyebilirsin.</p>' : '<p class="muted">Diamond App Store ve Google Play uygulamasında satın alınabilir.</p>'}`, btns, { wide: true });
    Diamond.paintModes(dm);
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
