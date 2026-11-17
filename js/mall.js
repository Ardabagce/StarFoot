// Vitrin: telefondaki alışveriş uygulaması (kendi tasarımımız; markalar oyunun kendi markaları)
// - 4 kademe: Ekonomik, Orta, Premium, Lüks · her kademede yüzlerce ürün (marka × tür × model × renk)
// - her sezon yeni koleksiyon, geçen sezonun koleksiyonu outlet'te indirimli, her hafta günün fırsatları
// - satın alma: bir kerelik moral (lüks daha çok); ün yalnız premium/lüksten, az ve azalan getirili
const Mall = (() => {
  const SEG = { eco: { n: 'Ekonomik', m: 2, f: 0 }, mid: { n: 'Orta', m: 3.5, f: 0 }, prem: { n: 'Premium', m: 5, f: 0.3 }, lux: { n: 'Lüks', m: 7, f: 0.75 } };
  // ürün türleri: ad, kategori, kademe taban fiyatları (dolar cinsinden; oyunun para birimine çevrilir), modeller (varyant sırası çizimi belirler)
  const TYPES = {
    watch: { n: 'Kol saati', cat: 'acc', p: [30, 280, 2600, 26000], md: ['Meridian', 'Chrono', 'Aqua', 'Heritage', 'Polaris', 'Equinox'] },
    sneaker: { n: 'Spor ayakkabı', cat: 'shoe', p: [30, 100, 280, 900], md: ['Sprint', 'Court', 'Street', 'High', 'Glide', 'Retro 88'] },
    bag: { n: 'Çanta', cat: 'acc', p: [25, 150, 1000, 5200], md: ['Tote', 'Flap', 'Bucket', 'Shopper', 'Saddle', 'Mini'] },
    glasses: { n: 'Güneş gözlüğü', cat: 'acc', p: [14, 100, 260, 700], md: ['Pilot', 'Round', 'Retro', 'Shield', 'Cat-Eye', 'Sport'] },
    headphones: { n: 'Kulaklık', cat: 'tech', p: [22, 130, 360, 1400], md: ['Studio', 'Pulse', 'Noise Zero', 'Tour', 'Bass', 'Pro'] },
    laptop: { n: 'Dizüstü bilgisayar', cat: 'tech', p: [380, 750, 1900, 4500], md: ['Book 13', 'Slim 14', 'Creator 16', 'Ultra 15', 'Neo 14', 'Gamer X'] },
    perfume: { n: 'Parfüm', cat: 'beauty', p: [14, 55, 140, 330], md: ['Oud Noir', 'Blue Hour', 'Amber', 'Citrus', 'Velvet Rose', 'Cedar'] },
    jacket: { n: 'Mont', cat: 'wear', p: [35, 150, 800, 3600], md: ['Puffer', 'Bomber', 'Blazer', 'Alpine', 'Flight', 'Tailored'] },
  };
  const CATS = { wear: 'Giyim', shoe: 'Ayakkabı', acc: 'Aksesuar', tech: 'Elektronik', beauty: 'Kozmetik' };
  const COL = [['Siyah', '#17191d'], ['Beyaz', '#f1f0ec'], ['Lacivert', '#1b2a4a'], ['Kırmızı', '#c8102e'], ['Bej', '#d6c0a0'], ['Taba', '#8b5a2b'], ['Haki', '#4b5a3a'], ['Gri', '#8a8f98'], ['Bordo', '#6d1a2a'], ['Mavi', '#2563eb'], ['Pembe', '#e58aa8'], ['Yeşil', '#1f6e4a'], ['Krem', '#efe4cf'], ['Turuncu', '#e8742a'], ['Mor', '#5b3a8c'], ['Antrasit', '#3a3e45']];
  // oyunun kendi markaları (gerçek markalarla ilgisi yoktur)
  const BRANDS = [
    { id: 'kumo', n: 'Kumo', seg: 'eco', t: ['sneaker', 'jacket', 'headphones', 'glasses'], mono: 'K', pal: [0, 1, 2, 7, 9, 13] },
    { id: 'basico', n: 'Basico', seg: 'eco', t: ['bag', 'jacket', 'perfume', 'watch'], mono: 'B', pal: [0, 1, 4, 6, 7, 10] },
    { id: 'trendo', n: 'Trendo', seg: 'eco', t: ['sneaker', 'glasses', 'bag', 'perfume'], mono: 'T', pal: [3, 9, 10, 13, 14, 1] },
    { id: 'pratik', n: 'Pratik', seg: 'eco', t: ['laptop', 'headphones', 'watch'], mono: 'P', pal: [0, 7, 15, 9, 1] },
    { id: 'nordline', n: 'Nordline', seg: 'mid', t: ['jacket', 'sneaker', 'bag', 'glasses'], mono: 'N', pal: [2, 6, 0, 13, 7, 11] },
    { id: 'urbanika', n: 'Urbanika', seg: 'mid', t: ['sneaker', 'jacket', 'bag', 'perfume'], mono: 'U', pal: [0, 1, 4, 8, 10, 14] },
    { id: 'pulsar', n: 'Pulsar', seg: 'mid', t: ['headphones', 'laptop', 'watch'], mono: 'P', pal: [0, 9, 1, 15, 3] },
    { id: 'tempora', n: 'Tempora', seg: 'mid', t: ['watch', 'glasses', 'perfume'], mono: 'T', pal: [2, 0, 12, 5, 11] },
    { id: 'ardent', n: 'Ardent Studio', seg: 'prem', t: ['jacket', 'bag', 'sneaker', 'perfume'], mono: 'A', pal: [0, 4, 8, 2, 12, 6] },
    { id: 'vektor', n: 'Vektor', seg: 'prem', t: ['laptop', 'headphones', 'watch'], mono: 'V', pal: [15, 7, 0, 1, 9] },
    { id: 'halden', n: 'Halden & Co', seg: 'prem', t: ['watch', 'bag', 'glasses'], mono: 'H', pal: [2, 5, 0, 11, 12] },
    { id: 'lumen', n: 'Lumen Paris', seg: 'prem', t: ['perfume', 'glasses', 'sneaker'], mono: 'L', pal: [10, 1, 4, 14, 3] },
    { id: 'marchetti', n: 'Marchetti', seg: 'prem', t: ['bag', 'jacket', 'sneaker'], mono: 'M', pal: [5, 0, 8, 4, 12] },
    { id: 'valmonte', n: 'Valmonte', seg: 'lux', t: ['jacket', 'bag', 'sneaker', 'glasses'], mono: 'V', pal: [0, 12, 8, 2, 4] },
    { id: 'ardelle', n: 'Maison Ardelle', seg: 'lux', t: ['bag', 'perfume', 'glasses'], mono: 'MA', pal: [5, 0, 10, 4, 8] },
    { id: 'castelli', n: 'Aurelio Castelli', seg: 'lux', t: ['sneaker', 'jacket', 'bag', 'perfume'], mono: 'AC', pal: [1, 0, 8, 11, 2] },
    { id: 'kronberg', n: 'Kronberg', seg: 'lux', t: ['watch'], mono: 'K', pal: [2, 0, 11, 1, 12] },
    { id: 'solenne', n: 'Solenne', seg: 'lux', t: ['watch', 'glasses', 'perfume'], mono: 'S', pal: [10, 12, 0, 14, 4] },
    { id: 'aeronyx', n: 'Aeronyx', seg: 'lux', t: ['laptop', 'headphones'], mono: 'A', pal: [0, 15, 12, 1] },
  ];
  const SEGI = { eco: 0, mid: 1, prem: 2, lux: 3 };
  const hs = (t) => { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const nice = (v) => { // fiyatı mağaza fiyatına yuvarlar: 349, 3.490, 48.900, 950.000
    if (v < 1000) return Math.round(v / 10) * 10 - 1;
    if (v < 10000) return Math.round(v / 100) * 100 - 10;
    if (v < 100000) return Math.round(v / 1000) * 1000 - 100;
    if (v < 1e6) return Math.round(v / 10000) * 10000;
    return Math.round(v / 50000) * 50000;
  };
  // dolar fiyatı → oyunun iç birimi; oyuncunun gördüğü para biriminde yuvarlanır (1.299 $, 49.900 ₺)
  const priceIn = (usd) => { const C = U.CUR[U.cur()] || U.CUR.TRY, intl = usd / U.CUR.USD.rate; return Math.max(1, nice(intl * C.rate)) / C.rate; };
  const metalOf = (b, h) => (b.seg === 'lux' ? ['gold', 'gold', 'rose', 'silver'][h % 4] : b.seg === 'prem' ? ['silver', 'gold', 'black'][h % 3] : ['silver', 'black'][h % 2]);
  const year = () => (Game.state && Game.state.season ? Game.state.season.year : 2026);

  // ---------- katalog (sezona göre üretilir, önbellekli) ----------
  let CAT = null, CATY = null;
  function build() {
    const y = year();
    const key = `${y}|${U.cur()}`;
    if (CAT && CATY === key) return CAT;
    const out = [];
    const mk = (b, t, k, j, tag) => {
      const T = TYPES[t], h = hs(`${b.id}|${t}|${k}|${tag || ''}`), hc = hs(`${b.id}|${t}|${k}|${j}|${tag || ''}`);
      const ci = b.pal[(h + j * 2) % b.pal.length], ci2 = b.pal[(h >>> 3) % b.pal.length] === ci ? b.pal[(ci + 1) % b.pal.length] : b.pal[(h >>> 3) % b.pal.length];
      const fac = 0.7 + ((h >>> 5) % 120) / 100; // 0.7 - 1.9
      let price = T.p[SEGI[b.seg]] * fac * (tag === 'new' ? 1.12 : 1);
      const id = `${b.id}.${t}.${tag ? tag[0] : ''}${k}.${j}`;
      out.push({
        id, b: b.id, bn: b.n, seg: b.seg, t, tn: T.n, cat: T.cat, md: tag === 'new' ? `${T.md[k % T.md.length]} ${y}` : tag === 'old' ? `${T.md[k % T.md.length]} ${y - 1}` : T.md[k % T.md.length],
        col: COL[ci][0], art: { t, c: COL[ci][1], c2: COL[ci2][1], metal: metalOf(b, hc), v: k, m: b.mono, lux: b.seg === 'lux' || undefined },
        price: priceIn(tag === 'old' ? price * 0.65 : price), was: tag === 'old' ? priceIn(price) : 0, tag,
        rate: Math.round((3.7 + ((hc >>> 7) % 13) / 10) * 10) / 10, rev: Math.round([2400, 900, 260, 60][SEGI[b.seg]] * (0.2 + ((hc >>> 11) % 100) / 60)),
        minAge: b.seg === 'lux' ? 16 : 8,
      });
    };
    BRANDS.forEach((b) => b.t.forEach((t) => {
      for (let k = 0; k < 4; k++) for (let j = 0; j < 3; j++) mk(b, t, k, j);
      // bu sezonun yeni koleksiyonu (2 model) ve geçen sezonun outlet'i
      for (let k = 4; k < 6; k++) for (let j = 0; j < 3; j++) mk(b, t, k + (y % 3), j, 'new');
      for (let j = 0; j < 2; j++) mk(b, t, 4 + ((y - 1) % 3), j, 'old');
    }));
    CAT = out; CATY = key;
    return out;
  }
  const byId = (id) => build().find((x) => x.id === id);

  // ---------- oyuncu verisi ----------
  const D = () => { const p = Game.p; p.mall = p.mall || { own: {}, log: [], spent: 0 }; return p.mall; };
  const wnum = () => { const s = Game.state; return s.season.year * 100 + s.season.round; };
  const owns = (id) => !!D().own[id];
  // haftanın fırsatları: haftaya göre 8 ürün, %15-40 indirim
  function deals() {
    const w = wnum(), all = build(), p = Game.p, out = [];
    for (let i = 0; out.length < 8 && i < 60; i++) {
      const it = all[hs(`${w}|deal|${i}`) % all.length];
      if (out.some((x) => x.id === it.id) || it.tag === 'old') continue;
      if (it.price > Math.max(2000, p.money * 3) && i < 40) continue;
      out.push(Object.assign({}, it, { was: it.price, price: priceIn(it.price * U.CUR.USD.rate * (0.6 + (hs(`${w}|d${i}`) % 26) / 100)), deal: true }));
    }
    return out;
  }
  const priceOf = (it) => { const d = deals().find((x) => x.id === it.id); return d ? d : it; };
  // etkiler: moral bir kerelik (haftada çok alınca azalır); ün yalnız premium/lüks, son 8 haftadaki alışveriş sayısıyla azalır
  function effect(it) {
    const m = D(), w = wnum();
    const wk = m.log.filter((x) => x.w === w).length, recent = m.log.filter((x) => w - x.w <= 8).length;
    const S = SEG[it.seg];
    const usd = it.price * U.CUR.USD.rate;
    const mor = Math.max(1, Math.round((S.m + Math.log10(Math.max(10, usd)) * 0.5) / (1 + wk * 0.5)));
    let fame = S.f ? (S.f * (0.6 + Math.log10(Math.max(1, usd / 200)) * 0.25)) / (1 + recent * 0.3) : 0;
    const famW = m.log.filter((x) => x.w === w).reduce((t, x) => t + (x.fame || 0), 0);
    fame = Math.max(0, Math.min(fame, 1.6 - famW));
    return { mor, fame: Math.round(fame * 10) / 10 };
  }
  // eski ürünlerin (ev, araba, yaşam tarzı) ünü de yavaşlatılır: yarısı ve son alışverişlerle azalan
  function fameFor(f) {
    if (!Game.p) return f;
    const m = D(), w = wnum(), recent = m.log.filter((x) => w - x.w <= 8).length;
    return Math.round(((f * 0.5) / (1 + recent * 0.3)) * 10) / 10;
  }
  function buy(id) {
    const s = Game.state, p = Game.p, it0 = byId(id);
    if (!it0 || owns(id)) return;
    const it = priceOf(it0);
    if (p.age < it.minAge) return Game.toast('Bu ürün için yaşın yetmiyor.', 'bad');
    if (p.money < it.price) return Game.toast('Yeterli paran yok.', 'bad');
    const ef = effect(it);
    p.money -= it.price;
    const m = D();
    m.own[id] = s.season.year; m.spent += it.price;
    m.log.push({ id, w: wnum(), p: it.price, fame: ef.fame });
    if (m.log.length > 60) m.log.splice(0, m.log.length - 60);
    Player.addMorale(p, ef.mor);
    if (ef.fame) Player.addFame(p, ef.fame);
    if (it.seg === 'lux' && U.chance(0.4)) Social.post('life', `Yeni ${it.bn} parçam geldi.`, 1.15);
    Game.toast(`Siparişin yolda! Moral +${ef.mor}${ef.fame ? ` · Ün +${ef.fame}` : ''}`, 'good');
    Mall.st.confirm = null;
    Game.save();
    if (typeof Phone !== 'undefined' && Phone.open) Phone.render(); else Game.render();
  }

  // ---------- görünüm ----------
  const st = { pg: 'home', cat: null, seg: null, brand: null, q: '', id: null, sort: 'pop', confirm: null };
  const esc = (x) => U.esc(String(x));
  const money = (n) => U.money(n);
  const stars = (r) => { const f = Math.round(r * 2) / 2; return `<span class="vt-st" aria-label="${r}">${[1, 2, 3, 4, 5].map((i) => `<i class="${f >= i ? 'f' : f >= i - 0.5 ? 'h' : ''}"></i>`).join('')}</span>`; };
  const nameH = (it) => `<span class="vt-nm"><span>${esc(it.md)}</span> <span>${esc(it.tn)}</span></span>`;
  const img = (it, big) => `<img class="vt-img${big ? ' big' : ''}" alt="" loading="lazy" src="${MallArt.url(it.art)}">`;
  function card(it0) {
    const it = it0.deal ? it0 : priceOf(it0), own = owns(it.id), off = it.was ? Math.round((1 - it.price / it.was) * 100) : 0;
    return `<button class="vt-card ${it.seg}" data-ml="item:${it.id}" type="button">
      <span class="vt-imw">${img(it)}${off ? `<em class="vt-off">-%${off}</em>` : it.tag === 'new' ? '<em class="vt-new">Yeni</em>' : ''}${own ? '<em class="vt-own">Sende</em>' : ''}</span>
      <span class="vt-br">${esc(it.bn)}</span>${nameH(it)}<span class="vt-col">${esc(it.col)}</span>
      <span class="vt-rt">${stars(it.rate)}<small>${it.rev.toLocaleString('tr-TR')}</small></span>
      <span class="vt-pr"><b>${money(it.price)}</b>${it.was ? `<s>${money(it.was)}</s>` : ''}</span>
      <span class="vt-ship">${it.seg === 'lux' ? 'Özel teslimat' : 'Yarın kapında'}</span>
    </button>`;
  }
  const grid = (list) => (list.length ? `<div class="vt-grid">${list.map(card).join('')}</div>` : '<p class="vt-empty">Aradığın kriterde ürün bulunamadı.</p>');
  const row = (t, list, more) => `<div class="vt-sec"><div class="vt-sh"><b>${t}</b>${more ? `<button data-ml="${more}" type="button">Tümünü gör ›</button>` : ''}</div><div class="vt-row">${list.map(card).join('')}</div></div>`;
  function header() {
    const p = Game.p;
    return `<div class="vt-top"><div class="vt-tb"><button class="vt-back" data-ml="back" type="button" aria-label="Geri">‹</button><span class="vt-logo">Vitrin</span><button class="vt-cart" data-ml="orders" type="button"><span>Dolabım</span><b>${Object.keys(D().own).length}</b></button></div>
      <label class="vt-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg><input id="vt-q" type="search" placeholder="Marka, ürün ya da renk ara" value="${esc(st.q)}" autocomplete="off"></label>
      <div class="vt-loc"><span>Bakiyen</span><b>${money(p.money)}</b></div></div>`;
  }
  const chips = () => `<div class="vt-chips">${Object.entries(CATS).map(([k, n]) => `<button class="${st.cat === k ? 'on' : ''}" data-ml="cat:${k}" type="button">${n}</button>`).join('')}</div>`;
  function filtered() {
    let l = build();
    if (st.cat) l = l.filter((x) => x.cat === st.cat);
    if (st.seg) l = l.filter((x) => x.seg === st.seg);
    if (st.brand) l = l.filter((x) => x.b === st.brand);
    if (st.pg === 'outlet') l = l.filter((x) => x.tag === 'old');
    if (st.pg === 'new') l = l.filter((x) => x.tag === 'new');
    if (st.q) { const q = st.q.toLocaleLowerCase('tr'); l = l.filter((x) => `${x.bn} ${x.md} ${x.tn} ${x.col} ${SEG[x.seg].n} ${CATS[x.cat]}`.toLocaleLowerCase('tr').includes(q)); }
    if (st.sort === 'asc') l = l.slice().sort((a, b) => a.price - b.price);
    else if (st.sort === 'desc') l = l.slice().sort((a, b) => b.price - a.price);
    else l = l.slice().sort((a, b) => b.rev * b.rate - a.rev * a.rate);
    return l;
  }
  function homeV() {
    const all = build(), p = Game.p;
    const afford = all.filter((x) => x.price <= Math.max(500, p.money * 0.25) && !owns(x.id) && x.tag !== 'old').sort((a, b) => b.price - a.price).slice(0, 10);
    const fresh = all.filter((x) => x.tag === 'new').sort((a, b) => hs(a.id) - hs(b.id)).slice(0, 10);
    return `${chips()}
      <div class="vt-tiers">${Object.entries(SEG).map(([k, s]) => `<button class="vt-tier ${k}" data-ml="seg:${k}" type="button"><b>${s.n}</b><small>${build().filter((x) => x.seg === k).length} ürün</small></button>`).join('')}</div>
      ${row('Günün fırsatları', deals(), 'deals')}
      ${row(`<span>${year()}</span> <span>koleksiyonu</span>`, fresh, 'new')}
      ${afford.length ? row('Bütçene uygun', afford) : ''}
      <div class="vt-sec"><div class="vt-sh"><b>Markalar</b></div><div class="vt-brands">${BRANDS.map((b) => `<button class="vt-bd ${b.seg}" data-ml="brand:${b.id}" type="button"><b>${esc(b.mono)}</b><span>${esc(b.n)}</span><small>${SEG[b.seg].n}</small></button>`).join('')}</div></div>
      <button class="vt-outlet" data-ml="outlet" type="button"><b>Outlet</b><span>Geçen sezonun koleksiyonu %35'e varan indirimle</span></button>
      ${legacyShop()}`;
  }
  // önceki sürümdeki hobi ve stil ürünleri (her hafta moral veren ev eşyaları) ayrı reyonda kalır
  function legacyShop() {
    try { return `<div class="vt-sec vt-legacy"><div class="vt-sh"><b>Ev ve hobi</b></div>${UI.shop({ tabs: ['lux'], luxCats: ['life', 'style'], excl: (typeof Phone !== 'undefined' && Phone.shopExcl ? Phone.shopExcl() : []), title: '' })}</div>`; } catch (e) { return ''; }
  }
  function listV(title) {
    const l = st.pg === 'deals' ? deals() : filtered();
    const sorts = [['pop', 'Önerilen'], ['asc', 'Fiyat: artan'], ['desc', 'Fiyat: azalan']];
    return `${chips()}<div class="vt-lh"><b>${title}</b><small><span>${l.length}</span> <span>ürün</span></small></div>
      <div class="vt-sort">${sorts.map(([k, n]) => `<button class="${st.sort === k ? 'on' : ''}" data-ml="sort:${k}" type="button">${n}</button>`).join('')}${Object.entries(SEG).map(([k, s]) => `<button class="seg ${st.seg === k ? 'on' : ''}" data-ml="segf:${k}" type="button">${s.n}</button>`).join('')}</div>
      <div id="vt-res">${grid(l.slice(0, 60))}</div>${l.length > 60 ? '<p class="vt-empty">Daha fazlası için aramayı daralt.</p>' : ''}`;
  }
  function itemV() {
    const it0 = byId(st.id);
    if (!it0) { st.pg = 'home'; return homeV(); }
    const it = priceOf(it0), own = owns(it.id), ef = effect(it), p = Game.p, conf = st.confirm === it.id;
    const sib = build().filter((x) => x.b === it.b && x.t === it.t && x.md === it.md);
    const more = build().filter((x) => x.b === it.b && x.id !== it.id && x.md !== it.md).slice(0, 8);
    const btn = own ? '<span class="vt-buy own">Dolabında</span>' : p.age < it.minAge ? `<span class="vt-buy off"><span>${it.minAge}</span> <span>yaşında açılır</span></span>` : p.money < it.price ? '<span class="vt-buy off">Bakiyen yetersiz</span>' : `<button class="vt-buy ${conf ? 'conf' : ''}" data-ml="buy:${it.id}" type="button">${conf ? `<span>Onayla</span> · <span>${money(it.price)}</span>` : 'Hemen al'}</button>`;
    return `<div class="vt-pd">${img(it, true)}
      <button class="vt-brl" data-ml="brand:${it.b}" type="button">${esc(it.bn)} <small>${SEG[it.seg].n}</small></button>
      <h3>${nameH(it)}</h3><div class="vt-rt">${stars(it.rate)}<small>${it.rate.toFixed(1)} · <span>${it.rev.toLocaleString('tr-TR')}</span> <span>değerlendirme</span></small></div>
      <div class="vt-pr big"><b>${money(it.price)}</b>${it.was ? `<s>${money(it.was)}</s>` : ''}</div>
      <div class="vt-sw">${sib.map((x) => `<button class="${x.id === it.id ? 'on' : ''}" data-ml="item:${x.id}" type="button" style="background:${x.art.c}" aria-label="${esc(x.col)}"></button>`).join('')}<span>${esc(it.col)}</span></div>
      <div class="vt-ef"><span>Moral <b>+${ef.mor}</b></span>${ef.fame ? `<span>Ün <b>+${ef.fame}</b></span>` : '<span class="mut">Ün etkisi yok</span>'}<small>${it.seg === 'lux' ? 'Lüks markalar daha çok moral ve biraz ün verir.' : it.seg === 'prem' ? 'Premium ürünler biraz ün verir.' : 'Günlük kullanım: moral verir.'} Aynı hafta çok alışveriş yapınca etkisi azalır.</small></div>
      ${btn}
      <div class="vt-ship2"><span>${it.seg === 'lux' ? 'Butikten özel teslimat' : 'Ücretsiz kargo · yarın kapında'}</span></div>
      ${more.length ? row('Bu markadan', more) : ''}</div>`;
  }
  function ordersV() {
    const m = D(), own = build().filter((x) => m.own[x.id]);
    const bySeg = Object.keys(SEG).map((k) => [k, own.filter((x) => x.seg === k).length]);
    return `<div class="vt-lh"><b>Dolabım</b><small><span>${Object.keys(m.own).length}</span> <span>ürün</span></small></div>
      <div class="vt-stats"><div><span>Toplam harcama</span><b>${money(m.spent)}</b></div>${bySeg.map(([k, n]) => `<div><span>${SEG[k].n}</span><b>${n}</b></div>`).join('')}</div>
      ${own.length ? grid(own) : '<p class="vt-empty">Henüz bir şey almadın. Fırsatlara göz at!</p>'}`;
  }
  function view() {
    let body;
    if (st.pg === 'item') body = itemV();
    else if (st.pg === 'orders') body = ordersV();
    else if (st.pg === 'home' && !st.q && !st.cat && !st.seg && !st.brand) body = homeV();
    else {
      const b = st.brand && BRANDS.find((x) => x.id === st.brand);
      const t = st.pg === 'deals' ? 'Günün fırsatları' : st.pg === 'outlet' ? 'Outlet' : st.pg === 'new' ? 'Yeni koleksiyon' : b ? b.n : st.q ? `"${st.q}"` : st.seg ? SEG[st.seg].n : st.cat ? CATS[st.cat] : 'Tüm ürünler';
      body = listV(t);
    }
    return `<div class="ph-appv vt">${header()}<div class="ph-body vt-body">${body}</div></div>`;
  }
  const hist = [];
  function go(next) { hist.push(JSON.stringify(st)); Object.assign(st, { confirm: null }, next); Phone.render(); const b = document.querySelector('.vt-body'); if (b) b.scrollTop = 0; }
  function click(b) {
    const [k, v] = b.dataset.ml.split(/:(.*)/);
    if (k === 'back') {
      if (hist.length) { Object.assign(st, JSON.parse(hist.pop()), { confirm: null }); return Phone.render(); }
      Phone.app = null; Phone.sub = null; return Phone.render();
    }
    if (k === 'item') return go({ pg: 'item', id: v });
    if (k === 'cat') return go({ pg: 'list', cat: st.cat === v ? null : v, brand: null });
    if (k === 'seg') return go({ pg: 'list', seg: v, brand: null, cat: null });
    if (k === 'segf') return go({ pg: st.pg === 'home' ? 'list' : st.pg, seg: st.seg === v ? null : v });
    if (k === 'brand') return go({ pg: 'list', brand: v, cat: null, seg: null, q: '' });
    if (k === 'sort') return go({ sort: v });
    if (k === 'deals' || k === 'outlet' || k === 'new') return go({ pg: k, cat: null, seg: null, brand: null, q: '' });
    if (k === 'orders') return go({ pg: 'orders' });
    if (k === 'buy') {
      if (st.confirm !== v) { st.confirm = v; return Phone.render(); }
      return buy(v);
    }
  }
  // arama: yazdıkça yalnız sonuç listesi yenilenir (klavye kapanmaz)
  function bindSearch(root) {
    const q = root.querySelector('#vt-q');
    if (!q) return;
    let t = null;
    q.oninput = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        st.q = q.value.trim();
        if (st.pg === 'item' || st.pg === 'orders' || st.pg === 'home') { hist.push(JSON.stringify(st)); st.pg = 'list'; }
        const res = root.querySelector('#vt-res');
        if (res && st.q) { res.innerHTML = grid(filtered().slice(0, 60)); bindCards(res); try { UI.strip(res); } catch (e) { /* yok */ } }
        else { Phone.render(); const q2 = document.getElementById('vt-q'); if (q2) { q2.focus(); q2.setSelectionRange(q2.value.length, q2.value.length); } }
      }, 220);
    };
    q.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); q.blur(); } };
  }
  const bindCards = (root) => root.querySelectorAll('[data-ml]').forEach((b) => (b.onclick = (e) => { e.preventDefault(); click(b); }));
  function after() {
    if (typeof Phone === 'undefined' || !Phone.el || Phone.app !== 'shop') return;
    const v = Phone.el.querySelector('.vt');
    if (!v) return;
    bindCards(v); bindSearch(v);
  }
  // telefona bağlanır
  function hook() {
    if (typeof Phone === 'undefined' || Phone._mall) return;
    Phone._mall = true;
    const r0 = Phone.render;
    Phone.render = function () { const out = r0.apply(this, arguments); try { after(); } catch (e) { console.error(e); } return out; };
  }
  if (typeof Phone !== 'undefined') hook();
  return { st, view, build, buy, byId, effect, fameFor, deals, brands: BRANDS, types: TYPES, reset: () => { hist.length = 0; Object.assign(st, { pg: 'home', cat: null, seg: null, brand: null, q: '', id: null, confirm: null }); } };
})();
