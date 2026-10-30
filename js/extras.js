// Madalyalar, kupa vitrini, tek kullanımlık ürünler, sürpriz paketler ve ek olaylar

// ---------- Madalyalar (başarımlar) ----------
// Kategoriler: eşik listelerinden otomatik üretilir; eski kayıtlarla uyum için bazı kimlikler korunur
const ACH_CATS = [
  { id: 'goal', l: 'Gol' }, { id: 'assist', l: 'Asist' }, { id: 'apps', l: 'Maç' }, { id: 'match', l: 'Maç Performansı' },
  { id: 'special', l: 'Özel Goller' }, { id: 'trophy', l: 'Kupalar ve Ödüller' }, { id: 'intl', l: 'Milli Takım' },
  { id: 'career', l: 'Kariyer' }, { id: 'skill', l: 'Yetenek' }, { id: 'fame', l: 'Ün ve Sosyal Medya' }, { id: 'life', l: 'Yaşam' },
];
const ACHIEVEMENTS = (() => {
  const list = [];
  const tier = (i, n) => (i < n / 3 ? 'bronze' : i < (2 * n) / 3 ? 'silver' : 'gold');
  const ladder = (cat, key, steps, name, desc, get, ids = {}) => steps.forEach((v, i) => list.push({
    id: ids[v] || `${key}${v}`, cat, tier: tier(i, steps.length), name: name(v), desc: desc(v), check: (p) => get(p) >= v,
  }));
  const fmt = (n) => (n >= 1e6 ? `${n / 1e6} milyon` : n >= 1000 ? `${n / 1000} bin` : `${n}`);
  const tr = (re) => (p) => p.trophies.filter((t) => re.test(t)).length;
  const b = (p) => p.best || {};
  const gt = (p) => p.gt || {};

  ladder('goal', 'g', [1, 10, 25, 50, 100, 150, 200, 300], (v) => (v === 1 ? 'İlk Gol' : `${v} Gol`), (v) => (v === 1 ? 'Kariyerinin ilk golünü attın' : `Kariyerinde ${v} gole ulaştın`), (p) => p.totals.goals, { 1: 'goal1', 50: 'goal50', 150: 'goal150' });
  ladder('assist', 'a', [1, 10, 25, 50, 100, 200], (v) => (v === 1 ? 'İlk Asist' : v === 50 ? 'Pas Ustası' : `${v} Asist`), (v) => `Kariyerinde ${v} asist yaptın`, (p) => p.totals.assists, { 50: 'assist50' });
  ladder('apps', 'm', [1, 25, 50, 100, 200, 300], (v) => (v === 1 ? 'İlk Maç' : `${v} Maç`), (v) => (v === 1 ? 'İlk resmi maçına çıktın' : `${v} maçta forma giydin`), (p) => p.totals.apps, { 1: 'debut', 100: 'apps100' });
  ladder('match', 'motm', [1, 5, 10, 25, 50], (v) => (v === 1 ? 'Maçın Adamı' : `${v}× Maçın Adamı`), (v) => (v === 1 ? 'İlk kez maçın adamı seçildin' : `${v} kez maçın adamı seçildin`), (p) => p.totals.motm, { 1: 'motm1' });
  list.push(
    { id: 'hat', cat: 'match', tier: 'silver', name: 'Hat-trick', desc: 'Bir maçta 3 gol attın', check: (p) => (p.flags || {}).hattrick || b(p).g >= 3 },
    { id: 'poker', cat: 'match', tier: 'gold', name: 'Poker', desc: 'Bir maçta 4 gol attın', check: (p) => b(p).g >= 4 },
    { id: 'five', cat: 'match', tier: 'gold', name: 'Beşlik', desc: 'Bir maçta 5 gol attın', check: (p) => b(p).g >= 5 },
    { id: 'ast3', cat: 'match', tier: 'silver', name: 'Pas Şov', desc: 'Bir maçta 3 asist yaptın', check: (p) => b(p).a >= 3 },
    { id: 'ga4', cat: 'match', tier: 'gold', name: 'Tek Kişilik Ordu', desc: 'Bir maçta 4 gole katkı (gol + asist)', check: (p) => b(p).ga >= 4 },
    { id: 'r9', cat: 'match', tier: 'silver', name: 'Kusursuza Yakın', desc: 'Bir maçta 9.0 reyting aldın', check: (p) => b(p).r >= 9 },
    { id: 'r10', cat: 'match', tier: 'gold', name: 'Mükemmel 10', desc: 'Bir maçta 10 reyting aldın', check: (p) => b(p).r >= 10 },
  );
  ladder('match', 'streak', [3, 5], (v) => `${v} Maç Üst Üste Gol`, (v) => `Arka arkaya ${v} maçta gol attın`, (p) => b(p).streak || 0);
  ladder('special', 'fk', [1, 5, 15], (v) => (v === 1 ? 'Frikik Golü' : `${v} Frikik Golü`), (v) => `Frikikten ${v} gol attın`, (p) => gt(p).freekick || 0);
  ladder('special', 'pen', [1, 10], (v) => (v === 1 ? 'Penaltı Golü' : `${v} Penaltı Golü`), (v) => `Penaltıdan ${v} gol attın`, (p) => gt(p).penalty || 0);
  ladder('special', 'hd', [1, 10], (v) => (v === 1 ? 'Kafa Golü' : `${v} Kafa Golü`), (v) => `Kafayla ${v} gol attın`, (p) => gt(p).header || 0);
  ladder('special', 'bg', [1], () => 'Avrupa Gecesi', () => 'Avrupa kupalarında gol attın', (p) => gt(p).cup || 0);
  ladder('trophy', 'tr', [1, 3, 5, 10, 20], (v) => (v === 1 ? 'İlk Kupa' : `${v} Kupa ve Ödül`), (v) => (v === 1 ? 'İlk kupanı ya da ödülünü kazandın' : `Vitrininde ${v} kupa ve ödül var`), (p) => p.trophies.length, { 1: 'trophy1' });
  list.push(
    { id: 'league1', cat: 'trophy', tier: 'silver', name: 'Lig Şampiyonu', desc: 'Profesyonel ligde şampiyon oldun', check: (p) => p.trophies.some((t) => /Lig Şampiyonu|Ligi Şampiyonu|League Şampiyonu|Liga Şampiyonu|Serie A Şampiyonu|Bundesliga Şampiyonu|Ligue 1 Şampiyonu/.test(t)) || p.trophies.some((t) => /Şampiyonu/.test(t) && !/U1\d|U\d|Kupa|Şampiyonası/.test(t)) },
    { id: 'youthcup', cat: 'trophy', tier: 'bronze', name: 'Altyapı Şampiyonu', desc: 'Altyapı liginde şampiyon oldun', check: (p) => p.trophies.some((t) => /U\d+.*Şampiyonu/.test(t)) },
    { id: 'ucl', cat: 'trophy', tier: 'gold', name: 'Avrupa\'nın En İyisi', desc: 'Avrupa Şampiyonlar Kupası\'nı kazandın', check: (p) => p.trophies.some((t) => /Şampiyonlar Kupası/.test(t)) },
    { id: 'uecl', cat: 'trophy', tier: 'silver', name: 'Kıta Zaferi', desc: 'Avrupa Kıta Kupası\'nı kazandın', check: (p) => p.trophies.some((t) => /Kıta Kupası/.test(t)) },
    { id: 'ccc', cat: 'trophy', tier: 'gold', name: 'Kuzeyin Hakimi', desc: 'Kuzey Amerika Kupası\'nı kazandın', check: (p) => p.trophies.some((t) => /Kuzey Amerika Kupası/.test(t)) },
    { id: 'acl', cat: 'trophy', tier: 'gold', name: 'Asya\'nın Zirvesi', desc: 'Asya Şampiyonlar Kupası\'nı kazandın', check: (p) => p.trophies.some((t) => /Asya Şampiyonlar Kupası/.test(t)) },
    { id: 'csa', cat: 'trophy', tier: 'gold', name: 'Kıtanın Kralı', desc: 'Güney Amerika Kupası\'nı kazandın', check: (p) => p.trophies.some((t) => /Güney Amerika Kupası/.test(t)) },
    { id: 'europe', cat: 'career', tier: 'bronze', name: 'Avrupa Bileti', desc: 'Takımınla Avrupa kupasına katılım hakkı kazandın', check: (p) => (p.flags || {}).europe },
    { id: 'ygl', cat: 'trophy', tier: 'silver', name: 'Avrupa\'nın Gençleri', desc: 'Avrupa Gelişim Ligi\'ni (U19) kazandın', check: (p) => p.trophies.some((t) => /Gelişim Ligi/.test(t)) },
    { id: 'domcup', cat: 'trophy', tier: 'silver', name: 'Kupa Şampiyonu', desc: 'Ülkenin kupasını kazandın', check: (p) => p.trophies.some((t) => /(Türkiye|İngiltere|Kral|Almanya|İtalya|Fransa|Hollanda|Portekiz|Brezilya|Arjantin|Belçika|İskoçya|Meksika|İmparator|ABD Açık) Kupası Şampiyonu/.test(t)) },
    { id: 'double', cat: 'trophy', tier: 'gold', name: 'Çifte Kupa', desc: 'Aynı sezon hem ligi hem ülke kupasını kazandın', check: (p) => { const by = {}; p.trophies.forEach((t) => { const y = t.split(':')[0]; by[y] = by[y] || {}; if (/(Türkiye|İngiltere|Kral|Almanya|İtalya|Fransa|Hollanda|Portekiz|Brezilya|Arjantin|Belçika|İskoçya|Meksika|İmparator|ABD Açık) Kupası Şampiyonu/.test(t)) by[y].c = 1; else if (/Şampiyonu/.test(t) && !/U\d|Kupa|Şampiyonası/.test(t)) by[y].l = 1; }); return Object.values(by).some((x) => x.c && x.l); } },
    { id: 'uel', cat: 'trophy', tier: 'silver', name: 'Federasyon Kupası', desc: 'Avrupa Federasyon Kupası\'nı kazandın', check: (p) => p.trophies.some((t) => /Federasyon Kupası/.test(t)) },
    { id: 'wc', cat: 'trophy', tier: 'gold', name: 'Dünya Şampiyonu', desc: 'Dünya Şampiyonası\'nı kazandın', check: (p) => p.trophies.some((t) => /Dünya Şampiyonası Şampiyonu/.test(t)) },
    { id: 'nl', cat: 'trophy', tier: 'silver', name: 'Milletler Ligi', desc: 'Milletler Ligi Finalleri\'ni kazandın', check: (p) => p.trophies.some((t) => /Milletler Ligi/.test(t)) },
    { id: 'euro', cat: 'trophy', tier: 'gold', name: 'Avrupa Şampiyonu', desc: 'Avrupa Milletler Şampiyonası\'nı kazandın', check: (p) => p.trophies.some((t) => /Avrupa Milletler Şampiyonası Şampiyonu/.test(t)) },
    { id: 'boot', cat: 'trophy', tier: 'silver', name: 'Gol Kralı', desc: 'Bir sezon gol krallığını kazandın', check: (p) => tr(/Gol Kralı/)(p) >= 1 },
    { id: 'boot3', cat: 'trophy', tier: 'gold', name: 'Seri Gol Kralı', desc: '3 kez gol kralı oldun', check: (p) => tr(/Gol Kralı/)(p) >= 3 },
    { id: 'poty', cat: 'trophy', tier: 'silver', name: 'Sezonun Oyuncusu', desc: 'Ligde sezonun oyuncusu seçildin', check: (p) => tr(/Sezonun Oyuncusu/)(p) >= 1 },
    { id: 'young', cat: 'trophy', tier: 'silver', name: 'Yılın Genci', desc: 'Yılın genç oyuncusu seçildin', check: (p) => tr(/Genç Oyuncu/)(p) >= 1 },
    { id: 'ybest', cat: 'trophy', tier: 'bronze', name: 'Altyapı Yıldızı', desc: 'Altyapı liginin en iyi oyuncusu oldun', check: (p) => tr(/En İyi Oyuncu/)(p) >= 1 },
    { id: 'ballon', cat: 'trophy', tier: 'gold', name: 'Altın Yıldız', desc: 'Yılın futbolcusu seçildin', check: (p) => tr(/Altın Yıldız/)(p) >= 1 },
    { id: 'ballon3', cat: 'trophy', tier: 'gold', name: 'Efsane', desc: '3 kez Altın Yıldız kazandın', check: (p) => tr(/Altın Yıldız/)(p) >= 3 },
  );
  ladder('intl', 'cap', [1, 10, 25, 50, 100], (v) => (v === 1 ? 'Milli Forma' : v === 50 ? 'Milli Takım Efsanesi' : `${v} Milli Maç`), (v) => (v === 1 ? 'Milli takımda forma giydin' : `${v} milli maça çıktın`), (p) => p.intl.caps, { 1: 'cap1', 50: 'cap50' });
  ladder('intl', 'ig', [1, 10, 25, 50], (v) => (v === 1 ? 'Milli Gol' : `${v} Milli Gol`), (v) => `Milli takımda ${v} gol attın`, (p) => p.intl.goals);
  list.push(
    { id: 'pro', cat: 'career', tier: 'silver', name: 'Profesyonel', desc: 'İlk profesyonel sözleşmeni imzaladın', check: () => !Game.isYouth() },
    { id: 'abroad', cat: 'career', tier: 'silver', name: 'Gurbetçi', desc: 'Yurt dışında bir kulübe transfer oldun', check: () => !Game.isYouth() && !Game.inStreet() && !Game.club().league.startsWith('TR') },
    { id: 'captain', cat: 'career', tier: 'silver', name: 'Pazubant', desc: 'Takım kaptanı seçildin', check: (p) => (p.captaincies || 0) >= 1 },
    { id: 'captain2', cat: 'career', tier: 'gold', name: 'Doğuştan Lider', desc: 'İki farklı takımda kaptan oldun', check: (p) => (p.captaincies || 0) >= 2 },
    { id: 'clubs3', cat: 'career', tier: 'bronze', name: 'Göçebe', desc: '3 farklı takımda oynadın', check: (p) => new Set(p.history.map((h) => h.club.replace(/ U\d+$/, ''))).size >= 3 },
    { id: 'clubs5', cat: 'career', tier: 'silver', name: 'Valiz Hazır', desc: '5 farklı takımda oynadın', check: (p) => new Set(p.history.map((h) => h.club.replace(/ U\d+$/, ''))).size >= 5 },
    { id: 'age35', cat: 'career', tier: 'silver', name: 'Yaş Sadece Sayı', desc: '35 yaşında hâlâ sahadasın', check: (p) => p.age >= 35 && !Game.isYouth() },
    { id: 'age38', cat: 'career', tier: 'gold', name: 'Bitmeyen Enerji', desc: '38 yaşında hâlâ sahadasın', check: (p) => p.age >= 38 && !Game.isYouth() },
  );
  ladder('career', 'sz', [5, 10, 15], (v) => `${v} Sezon`, (v) => `${v} sezon futbol oynadın`, (p) => p.history.length);
  ladder('skill', 'ovr', [60, 70, 80, 85, 90], (v) => (v === 80 ? 'Dünya Yıldızı' : `Genel Güç ${v}`), (v) => `Genel gücün ${v}'e ulaştı`, (p) => Player.overall(p), { 80: 'ovr80' });
  STATS.filter((st) => ['pace', 'shooting', 'passing', 'dribbling', 'defending'].includes(st.k)).forEach((st) => list.push({ id: `st_${st.k}`, cat: 'skill', tier: 'gold', name: `${st.l} Ustası`, desc: `${st.l} statın 90'a ulaştı`, check: (p) => p.stats[st.k] >= 90 }));
  ladder('fame', 'fame', [10, 25, 50, 75], (v) => (v === 75 ? 'Herkes Seni Tanıyor' : `Ün ${v}`), (v) => `Ünün ${v}'e ulaştı`, (p) => p.fame, { 75: 'fame75' });
  ladder('fame', 'fol', [1000, 10000, 100000, 1000000], (v) => `${fmt(v)} Takipçi`, (v) => `Sosyal medyada ${fmt(v)} takipçiye ulaştın`, (p) => (p.social ? p.social.followers : 0));
  ladder('life', 'money', [10000, 100000, 1000000, 10000000], (v) => (v === 1e6 ? 'İlk Milyon' : U.money(v)), (v) => `Hesabında ${U.money(v)} birikti`, (p) => p.money, { 1000000: 'million' });
  ladder('life', 'items', [1, 5, 10], (v) => (v === 1 ? 'İlk Alışveriş' : `${v} Eşya`), (v) => `${v} eşyaya sahip oldun`, (p) => p.items.length);
  return list;
})();

const Ach = {
  check() {
    const p = Game.p;
    p.ach = p.ach || {};
    const got = [];
    ACHIEVEMENTS.forEach((a) => {
      if (p.ach[a.id]) return;
      let ok = false;
      try { ok = a.check(p); } catch (e) { ok = false; }
      if (ok) { p.ach[a.id] = Game.state.season.year; got.push(a); }
    });
    got.forEach((a) => {
      Game.news(`Yeni madalya: <b>${a.name}</b> · ${a.desc}`, 'good');
      Game.toast(`Yeni madalya: ${a.name}`, 'good');
    });
    return got;
  },
};

// ---------- Kupa vitrini çizimleri ----------
const Trophy = {
  kind(text) {
    if (/Altın Yıldız/.test(text)) return 'ball';
    if (/Gol Kralı/.test(text)) return 'boot';
    if (/Şampiyon/.test(text)) return 'cup';
    if (/Genç/.test(text)) return 'young';
    return 'star';
  },
  svg(kind) {
    const gold = 'url(#tg)';
    const defs = '<defs><linearGradient id="tg" x1="0" x2="1"><stop offset="0" stop-color="#b8860b"/><stop offset=".45" stop-color="#ffe27a"/><stop offset="1" stop-color="#c99a1e"/></linearGradient><linearGradient id="ts" x1="0" x2="1"><stop offset="0" stop-color="#8a96a8"/><stop offset=".5" stop-color="#eef3f8"/><stop offset="1" stop-color="#9aa6b8"/></linearGradient></defs>';
    const base = '<rect x="18" y="56" width="28" height="6" fill="#3a2a14"/><rect x="22" y="50" width="20" height="7" fill="#5a4020"/>';
    const shapes = {
      cup: `<path d="M18 8h28v10c0 10-6 17-14 18-8-1-14-8-14-18z" fill="${gold}"/><path d="M18 11h-6c0 8 3 12 8 13M46 11h6c0 8-3 12-8 13" fill="none" stroke="${gold}" stroke-width="3"/><rect x="29" y="35" width="6" height="10" fill="${gold}"/><rect x="24" y="44" width="16" height="6" fill="${gold}"/>`,
      boot: `<path d="M14 40c0-5 3-8 8-8h6l4-18h8l2 18 10 4c3 1 3 4 3 6v4H14z" fill="${gold}"/><path d="M18 48v3M24 48v3M30 48v3M36 48v3M42 48v3" stroke="#3a2a14" stroke-width="2"/>`,
      ball: `<circle cx="32" cy="26" r="17" fill="${gold}"/><path d="M32 17l7 5-3 8h-8l-3-8z" fill="#8a6410"/><rect x="28" y="43" width="8" height="8" fill="${gold}"/>`,
      young: `<circle cx="32" cy="28" r="14" fill="url(#ts)"/><path d="M26 6l6 10 6-10" fill="none" stroke="#2f6fd6" stroke-width="5"/><path d="M32 22c-4 0-6 3-6 6M32 22c4 0 6 3 6 6M32 22v12" stroke="#2f8c45" stroke-width="3" fill="none"/>`,
      motm: `<path d="M32 4l7.6 15.4 17 2.5-12.3 12 2.9 16.9L32 42.8l-15.2 8 2.9-16.9-12.3-12 17-2.5z" fill="${gold}" stroke="#8a6410" stroke-width="1.5"/><path d="M32 14l4 8.2 9 1.3-6.5 6.4 1.5 9L32 34.6l-8 4.3 1.5-9-6.5-6.4 9-1.3z" fill="rgba(138,100,16,.35)"/>`,
      star: `<path d="M26 4l6 10 6-10" fill="none" stroke="#c8102e" stroke-width="5"/><circle cx="32" cy="30" r="15" fill="${gold}"/><path d="M32 20l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="#8a6410"/>`,
    };
    return `<svg viewBox="0 0 64 64" aria-hidden="true">${defs}${shapes[kind]}${kind === 'young' || kind === 'star' ? '' : kind === 'motm' ? '<rect x="26" y="50" width="12" height="6" fill="#5a4020"/><rect x="20" y="56" width="24" height="6" fill="#3a2a14"/>' : base}</svg>`;
  },
  medal(tier, earned) {
    const col = { bronze: ['#8a4b1f', '#e0995a'], silver: ['#7d8794', '#eef3f8'], gold: ['#a77a0a', '#ffe27a'] }[tier];
    const id = 'm' + Math.random().toString(36).slice(2, 7);
    return `<svg viewBox="0 0 48 56" aria-hidden="true" class="${earned ? '' : 'locked'}"><defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="${col[0]}"/><stop offset=".5" stop-color="${col[1]}"/><stop offset="1" stop-color="${col[0]}"/></linearGradient></defs><path d="M14 2h8l4 14h-8zM34 2h-8l-4 14h8z" fill="#c8102e"/><path d="M22 2h4l-2 14z" fill="#f3f1ea"/><circle cx="24" cy="34" r="16" fill="url(#${id})"/><circle cx="24" cy="34" r="11" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="2"/><path d="M24 26l2.4 5 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4-3.9-3.8 5.4-.8z" fill="rgba(0,0,0,.28)"/></svg>`;
  },
};

// ---------- Tek kullanımlık ürünler ----------
const Shop = {
  priceScale() {
    return Game.isYouth() ? 1 + (Game.p.age - 8) * 0.25 : Math.max(3, Game.weeklyIncome() / 400);
  },
  price(c) { return Math.round((c.base * Shop.priceScale()) / 10) * 10; },
  available(c) {
    const p = Game.p;
    return p.age >= c.minAge && (!c.maxAge || p.age <= c.maxAge);
  },
  usedThisSeason(c) {
    const u = Game.p.used || {};
    return ['camp', 'clinic', 'analysis', 'yoga', 'heading'].includes(c.id) && u[c.id] === Game.state.season.year;
  },
  // Stoklanabilen ürünler: çantada en fazla bu kadar taşınır
  STOCK: { drink: 10, physio: 5 },
  stock(id) { return (Game.p.stock || {})[id] || 0; },
  buyStock(id, n = 1) {
    const p = Game.p, c = CONSUMABLES.find((x) => x.id === id), max = Shop.STOCK[id];
    const k = Math.min(n, max - Shop.stock(id));
    if (k <= 0) return Game.toast(`Çantan dolu (en fazla ${max}).`, 'bad');
    const cost = Shop.price(c) * k;
    if (p.money < cost) return Game.toast('Yeterli paran yok.', 'bad');
    p.money -= cost;
    p.stock = p.stock || {};
    p.stock[id] = Shop.stock(id) + k;
    if (typeof Sfx !== 'undefined') Sfx.play('coin');
    Game.toast(`${c.name} ×${k} çantana eklendi (${p.stock[id]}/${max})`, 'good');
    Game.save();
    Game.render();
  },
  useStock(id) {
    const p = Game.p, c = CONSUMABLES.find((x) => x.id === id);
    if (Shop.stock(id) < 1) return Game.toast('Çantanda yok. Mağazadan stok alabilirsin.', 'bad');
    const msg = Shop.effect(id);
    if (msg == null) return;
    p.stock[id]--;
    Game.toast(`${c.name}: ${msg} · ${p.stock[id]} kaldı`, 'good');
    Game.save();
    Game.render();
  },
  use(id) {
    const p = Game.p, s = Game.state;
    const c = CONSUMABLES.find((x) => x.id === id);
    const price = Shop.price(c);
    if (p.money < price) return Game.toast('Yeterli paran yok.', 'bad');
    if (Shop.usedThisSeason(c)) return Game.toast('Bunu bu sezon zaten kullandın.', 'bad');
    const msg = Shop.effect(id);
    if (msg == null) return;
    p.money -= price;
    p.used = p.used || {};
    p.used[id] = s.season.year;
    Game.toast(`${c.name}: ${msg}`, 'good');
    Game.save();
    Game.render();
  },
  // ürünün etkisi; uygulanamazsa null döner
  effect(id) {
    const p = Game.p, s = Game.state;
    let msg = '';
    if (id === 'drink') { Player.addEnergy(p, 25); msg = 'Enerji +25'; }
    if (id === 'massage') { Player.addEnergy(p, 15); Player.addMorale(p, 6); msg = 'Enerji +15, moral +6'; }
    if (id === 'nap') { Player.addEnergy(p, 20); Player.addMorale(p, 3); msg = 'Enerji +20, moral +3'; }
    if (id === 'mental') { Player.addMorale(p, 15); msg = 'Moral +15'; }
    if (id === 'meet') { Player.addRel(p, 'fans', 8); Player.addFame(p, Game.isYouth() ? 0.3 : 1); msg = 'Taraftarlar seni çok sevdi'; }
    if (id === 'analysis') { msg = ['technique', 'passing'].map((k) => `${STATS.find((x) => x.k === k).l} +${Player.train(p, k, 2.2, 1).toFixed(1)}`).join(', '); }
    if (id === 'ice') { Player.addEnergy(p, 12); Player.addMorale(p, 2); msg = 'Enerji +12, kasların tazelendi'; }
    if (id === 'spa') { Player.addEnergy(p, 10); Player.addMorale(p, 10); msg = 'Enerji +10, moral +10'; }
    if (id === 'family') { Player.addMorale(p, 12); msg = 'Ailen çok mutlu oldu. Moral +12'; }
    if (id === 'shoot') { Player.addFame(p, Game.isYouth() ? 0.4 : 1.5); Social.post('life', 'Yeni çekimden kareler. Sizce hangisi?', 1.6); msg = 'Fotoğraflar sosyal medyada çok beğenildi'; }
    if (id === 'yoga') { msg = ['stamina', 'physical'].map((k) => `${STATS.find((x) => x.k === k).l} +${Player.train(p, k, 2.2, 1).toFixed(1)}`).join(', '); }
    if (id === 'heading') { msg = ['heading', 'defending'].map((k) => `${STATS.find((x) => x.k === k).l} +${Player.train(p, k, 2.2, 1).toFixed(1)}`).join(', '); }
    if (id === 'physio') {
      if (!p.injuryWeeks) { Game.toast('Sakat değilsin, fizyoterapiye gerek yok.', 'bad'); return null; }
      p.injuryWeeks = Math.max(0, p.injuryWeeks - 2);
      msg = p.injuryWeeks ? `Sakatlık ${p.injuryWeeks} haftaya indi` : 'Sakatlığın tamamen geçti';
    }
    if (id === 'camp') {
      const ks = U.shuffle(STATS.map((x) => x.k)).slice(0, 3);
      msg = ks.map((k) => `${STATS.find((x) => x.k === k).l} +${Player.train(p, k, 3, 1.1).toFixed(1)}`).join(', ');
    }
    if (id === 'clinic') {
      const k = s.trainFocus;
      msg = `${STATS.find((x) => x.k === k).l} +${Player.train(p, k, 5, 1.15).toFixed(1)}`;
    }
    return msg;
  },
};

// ---------- Maç sonrası gerçekçi ödüller (kutu yok) ----------
const Loot = {
  roll(rating) {
    if (rating == null || Game.inStreet()) return;
    const s = Game.state, p = s.player;
    const chance = rating >= 8.5 ? 0.35 : rating >= 8 ? 0.18 : 0;
    if (!U.chance(chance)) return;
    if (Game.isYouth()) {
      const opts = [
        () => {
          // A takım hocası seni bir antrenmana çağırır
          const k = s.trainFocus;
          const g = Player.train(p, k, 1.6, Game.facility());
          Player.addRel(p, 'coach', 2);
          return `A takım teknik direktörü maçını izledi ve seni bu hafta bir A takım antrenmanına çağırdı. ${STATS.find((x) => x.k === k).l} +${g.toFixed(2)}`;
        },
        () => {
          Player.addMorale(p, 6); Player.addFame(p, 0.6);
          return 'Yerel gazete performansını "altyapının parlayan yıldızı" başlığıyla yazdı. Ailen gazeteyi çerçeveletti.';
        },
      ];
      const t = U.pick(opts)();
      Game.news(t, 'good');
      Game.toast(t, 'good');
    } else {
      const a = Math.round(Game.weeklyIncome() * U.rand(0.25, 0.5) / 100) * 100;
      p.money += a;
      const t = `Kulüp başkanı soyunma odasına gelip performansın için ${U.money(a)} prim verdi.`;
      Game.news(t, 'good');
      Game.toast(t, 'good');
    }
  },
  // Eski kayıtlardaki bekleyen paketleri temizler
  show() { Game.state.pendingLoot = null; },
};

// ---------- Mağaza puanı ----------
// iPhone'da Apple'ın kendi "Bu oyunu değerlendir" penceresi, yalnız mutlu anlarda (kupa, hat-trick, Altın Yıldız) istenir.
// Apple pencereyi yılda en fazla 3 kez gösterir; biz de ilk günü ve son istekten sonraki 60 günü atlarız.
const Review = {
  KEY: 'sf_review',
  plugin() {
    const C = window.Capacitor;
    if (!C || !C.isNativePlatform || !C.isNativePlatform() || C.getPlatform() !== 'ios') return null;
    try { return C.registerPlugin ? C.registerPlugin('StarfootReview') : C.Plugins.StarfootReview; } catch (e) { return null; }
  },
  maybe(delay = 1800) {
    const pl = Review.plugin();
    if (!pl) return;
    let st = {};
    try { st = JSON.parse(localStorage.getItem(Review.KEY) || '{}'); } catch (e) {}
    const now = Date.now(), day = 864e5;
    if (!st.first) { st.first = now; try { localStorage.setItem(Review.KEY, JSON.stringify(st)); } catch (e) {} return; }
    if (now - st.first < day || (st.last && now - st.last < 60 * day)) return;
    st.last = now;
    try { localStorage.setItem(Review.KEY, JSON.stringify(st)); } catch (e) {}
    setTimeout(() => { try { pl.request().catch(() => {}); } catch (e) {} }, delay);
  },
  // ilk açılış zamanını kaydeder (ilk gün istenmez)
  init() { try { if (!localStorage.getItem(Review.KEY)) localStorage.setItem(Review.KEY, JSON.stringify({ first: Date.now() })); } catch (e) {} },
};
Review.init();

// ---------- Reklam ----------
// Android uygulamasında js/admob.js gerçek AdMob reklamını gösterir (window.StarfootAds).
// Web sürümünde 5 saniyelik temsili reklam ekranı gösterilir.
const Ads = {
  show() {
    if (window.StarfootAds && typeof window.StarfootAds.show === 'function') {
      return Promise.resolve(window.StarfootAds.show()).then((ok) => !!ok).catch(() => false);
    }
    return new Promise((resolve) => {
      const el = document.createElement('div');
      el.className = 'ad-ov';
      let left = 5;
      el.innerHTML = `<div class="ad-box"><div class="ad-tag">REKLAM</div><div class="ad-art"><b>ANADOLU ENERJİ</b><span>Maç günü enerjin hep tam!</span></div><div class="ad-cnt">Ödülün <b id="ad-n">${left}</b> sn sonra hazır</div><button class="btn btn-ghost" id="ad-x" disabled>Kapat</button></div>`;
      document.body.appendChild(el);
      const n = el.querySelector('#ad-n'), x = el.querySelector('#ad-x');
      const iv = setInterval(() => {
        left--;
        if (left > 0) { n.textContent = left; return; }
        clearInterval(iv);
        el.querySelector('.ad-cnt').textContent = 'Ödülün hazır!';
        x.disabled = false; x.textContent = 'Ödülü Al'; x.classList.remove('btn-ghost');
      }, 1000);
      x.onclick = () => { if (x.disabled) return; el.remove(); resolve(true); };
    });
  },
};

// ---------- Hediye paketi: reklam izlersen x2-x3, izlemezsen x1 ----------
const Gift = {
  roll(rating) {
    const s = Game.state;
    if (rating == null || Game.inStreet() || s.pendingGift) return;
    const ch = rating >= 8 ? 0.3 : rating >= 7 ? 0.14 : 0.05;
    if (!U.chance(ch)) return;
    const kinds = ['money', 'energy', 'stat', 'morale'];
    s.pendingGift = { kind: U.pick(kinds), stat: U.pick(STATS).k, mult: U.pick([2, 2, 3]) };
  },
  base(g) {
    const p = Game.p;
    const money = Game.isYouth() ? 120 + (p.age - 8) * 40 : Math.round(Game.weeklyIncome() * 0.25 / 10) * 10;
    return { money, energy: 15, stat: 0.6, morale: 6 }[g.kind];
  },
  label(g, m) {
    const v = Gift.base(g) * m;
    const st = STATS.find((x) => x.k === g.stat).l;
    return { money: U.money(v), energy: `+${v} enerji`, stat: `${st} +${v.toFixed(1)}`, morale: `+${v} moral ve ün` }[g.kind];
  },
  apply(g, m) {
    const p = Game.p;
    const v = Gift.base(g) * m;
    if (g.kind === 'money') p.money += v;
    else if (g.kind === 'energy') Player.addEnergy(p, v);
    else if (g.kind === 'stat') p.stats[g.stat] = U.clamp(p.stats[g.stat] + v, 1, 99);
    else { Player.addMorale(p, v); Player.addFame(p, 0.2 * m); }
    return Gift.label(g, m);
  },
  show() {
    const s = Game.state, g = s.pendingGift;
    const icon = { money: 'coin', energy: 'bolt', stat: 'train', morale: 'star' }[g.kind];
    const finish = (m) => {
      const res = Gift.apply(g, m);
      if (typeof Sfx !== 'undefined') { Sfx.play('coin'); Sfx.buzz('success'); }
      s.pendingGift = null;
      Game.save(); Game.render();
      Game.toast(`Hediye paketi: ${res}${m > 1 ? ` (x${m})` : ''}`, 'good');
      Game.checkPending();
    };
    Game.modal(`
      <div class="gift">
        <div class="ev-tag">Hediye Paketi</div>
        <div class="gift-box"><i></i>${Icon(icon)}</div>
        <h3>Sana bir hediye var!</h3>
        <p class="muted">Paketi hemen açabilir ya da kısa bir reklam izleyip ödülünü <b>x${g.mult}</b> yapabilirsin.</p>
        <div class="gift-opts">
          <div class="gift-opt"><span>Normal</span><b>${Gift.label(g, 1)}</b></div>
          <div class="gift-opt hot"><span>Reklamla x${g.mult}</span><b>${Gift.label(g, g.mult)}</b></div>
        </div>
      </div>`, [
      { t: `${Icon('play')} ${typeof Premium !== 'undefined' && Premium.active ? '⭐ Premium' : 'Reklam İzle'} · x${g.mult}`, cls: 'btn-big', fn: () => Ads.show().then((ok) => finish(ok ? g.mult : 1)) },
      { t: 'Normal Aç (x1)', cls: 'btn-ghost', fn: () => finish(1) },
    ]);
  },
};

// ---------- Kulüpteki gerçek oyunculardan mentorlar ----------
const POS_TR = { FW: 'Forvet', MF: 'Orta Saha', DF: 'Defans', GK: 'Kaleci' };
const Mentors = {
  TIPS: {
    FW: [
      { say: 'Şut atarken kaleciye değil, boş köşeye bak. Topu oraya yerleştir.', k: ['shooting', 'technique'] },
      { say: 'Defansın arkasına koşuyu pas çıkmadan bir saniye önce başlat.', k: ['pace', 'shooting'] },
      { say: 'Kafa vururken gözlerini kapatma, alnının ortasıyla vur.', k: ['heading', 'shooting'] },
    ],
    MF: [
      { say: 'Topu almadan önce omzunun üstünden bak. İyi pas ilk dokunuştan başlar.', k: ['passing', 'technique'] },
      { say: 'Topu ayağında fazla tutma. Pas ver, sonra boşa koş.', k: ['passing', 'stamina'] },
      { say: 'Dar alanda vücudunu topla rakip arasına koy.', k: ['dribbling', 'technique'] },
    ],
    DF: [
      { say: 'Topa değil, rakibin kalçasına bak. Kalça nereye dönerse oraya gider.', k: ['defending', 'pace'] },
      { say: 'Hava topunda rakibinden önce zıpla, kollarını denge için kullan.', k: ['heading', 'physical'] },
      { say: 'Kayarak müdahale son çaredir. Ayakta kal, sabırlı ol.', k: ['defending', 'physical'] },
    ],
    GK: [
      { say: 'Kalecilerin en sevmediği şut yere vuran, köşeye giden şuttur.', k: ['shooting', 'technique'] },
      { say: 'Kaleciyi oyuna sokmadan önce bakışınla kandır.', k: ['technique', 'dribbling'] },
    ],
  },
  tip(pos) {
    if (!Events._tip) Events._tip = U.pick(Mentors.TIPS[pos] || Mentors.TIPS.MF);
    return Events._tip;
  },
  // A takımın tanınmış oyuncusu (önce dönem yıldızları, sonra en yüksek reytingli oyuncu)
  senior() {
    if (Events._senior) return Events._senior;
    const s = Game.state, c = s.world.clubs[s.clubId];
    if (!c || !c.roster || !c.roster.length) return null;
    const me = Player.fullName(s.player);
    const pool = c.roster.filter((x) => x.n !== me && (x.age || 25) >= 22);
    if (!pool.length) return null;
    const stars = pool.filter((x) => x.star);
    const same = (stars.length ? stars : pool).filter((x) => x.pos === s.player.position);
    const list = (same.length && U.chance(0.6) ? same : stars.length ? stars : pool).slice().sort((a, b) => b.r - a.r);
    return (Events._senior = U.pick(list.slice(0, 3)));
  },
  // Kulüpte forma giymiş, artık emekli bir efsane
  oldLegend() {
    if (Events._legend) return Events._legend;
    const s = Game.state, w = s.world;
    if (!w.legends) return null;
    const L = U.pick(w.legends.filter((x) => x.state === 'retired' && x.club === s.clubId));
    return L ? (Events._legend = L) : null;
  },
  veteran() {
    const s = Game.state, c = s.world.clubs[s.clubId];
    if (!c) return null;
    const v = c.roster.filter((x) => (x.age || 0) >= 31).sort((a, b) => b.age - a.age)[0];
    return v || null;
  },
};

// ---------- Ek rastgele olaylar ----------
Events.list.push(
  {
    id: 'idolcamp', w: 0.4, cond: (p) => p.age <= 16,
    text: () => `${Legends.idol(Game.state.world)}, şehrine gelip bir futbol okulu kampı düzenliyor. Seni de davet ettiler!`,
    opts: [
      { t: 'Kampa katıl', fx: (p) => { const a = Player.train(p, 'technique', 2, 1.1), b = Player.train(p, 'dribbling', 2, 1.1); Player.addEnergy(p, -15); Player.addMorale(p, 8); return `Hayatının günü! Teknik +${a.toFixed(1)}, Top Sürme +${b.toFixed(1)}`; } },
      { t: 'Katılamam', fx: () => 'Belki bir dahaki sefere.' },
    ],
  },
  {
    id: 'wallet', w: 0.25, cond: () => true,
    text: () => 'Antrenman dönüşü yolda içi para dolu bir cüzdan buldun.',
    opts: [
      { t: 'Sahibine götür', fx: (p) => { Player.addRel(p, 'fans', 4); Player.addMorale(p, 5); Player.addFame(p, 0.5); if (U.chance(0.45)) { const a = Game.isYouth() ? 300 : Math.round(Game.weeklyIncome() * 0.3); p.money += a; return `Sahibi çok sevindi ve sana ${U.money(a)} ödül verdi!`; } return 'Dürüstlüğün haberlere çıktı, taraftarlar seni sevdi.'; } },
      { t: 'Cüzdanı al', fx: (p) => { const a = Game.isYouth() ? 200 : Math.round(Game.weeklyIncome() * 0.2); p.money += a; Player.addMorale(p, -6); if (U.chance(0.35)) { Player.addRel(p, 'fans', -8); return 'Kameralara yakalandın! Taraftarlar hayal kırıklığına uğradı.'; } return `+${U.money(a)} ama vicdanın rahat değil.`; } },
    ],
  },
  {
    id: 'birthday', w: 0.5, cond: () => Game.state.season.round <= 2,
    text: () => 'Doğum günün kutlu olsun! Ailen ve arkadaşların sana sürpriz parti hazırladı.',
    opts: [{ t: 'Hediyeleri aç', fx: (p) => { const a = Game.isYouth() ? 250 + p.age * 30 : Math.round(Game.weeklyIncome() * 0.5); p.money += a; Player.addMorale(p, 10); return `Moral +10 ve ${U.money(a)} harçlık!`; } }],
  },
  {
    id: 'street', cond: (p) => p.age <= 15,
    text: () => 'Mahallede çocuklar maç yapıyor, seni de oynamaya çağırıyorlar.',
    opts: [
      { t: 'Oyna', fx: (p) => { const g = Player.train(p, 'dribbling', 1, 1); Player.addEnergy(p, -10); Player.addMorale(p, 5); return `Sokak futbolu gibisi yok! Top Sürme +${g.toFixed(2)}`; } },
      { t: 'Dinlenmem lazım', fx: (p) => { Player.addEnergy(p, 5); return 'Enerjini korudun.'; } },
    ],
  },
  {
    id: 'viral', w: 0.4, cond: (p) => p.fame >= 4,
    text: () => 'Antrenmanda attığın röveşata golü sosyal medyada viral oldu!',
    opts: [{ t: 'Paylaşımları izle', fx: (p) => { Player.addFame(p, 2); Player.addRel(p, 'fans', 5); Player.addMorale(p, 5); return 'Ünün ve taraftar desteğin arttı.'; } }],
  },


  {
    id: 'rain', cond: () => true,
    text: () => 'Bugünkü antrenman sağanak yağmur altında yapılacak.',
    opts: [
      { t: 'Yine de git', fx: (p) => { const g = Player.train(p, 'stamina', 1.2, 1); Player.addRel(p, 'coach', 3); Player.addEnergy(p, -10); if (U.chance(0.08)) Game.injure(1, 'Kaygan zeminde'); return `Hoca azmine hayran kaldı. Dayanıklılık +${g.toFixed(2)}`; } },
      { t: 'Evde kal', fx: (p) => { Player.addRel(p, 'coach', -2); Player.addEnergy(p, 6); return 'Kuru kaldın ama hoca not aldı.'; } },
    ],
  },
  {
    id: 'tvshow', cond: (p) => !Game.isYouth() && p.fame >= 15,
    text: () => 'Popüler bir spor programı seni canlı yayına konuk etmek istiyor.',
    opts: [
      { t: 'Programa çık', fx: (p) => { const a = Math.round(Game.weeklyIncome() * 0.4); p.money += a; Player.addFame(p, 3); Player.addEnergy(p, -8); return `Ün +3 ve ${U.money(a)} katılım ücreti.`; } },
      { t: 'Reddet', fx: () => 'Odağını futbola verdin.' },
    ],
  },
  {
    id: 'allstar', w: 0.5, cond: (p) => !Game.isYouth() && p.fame >= 30,
    text: () => { const a = Legends.active(Game.state.world).sort((x, y) => y.r - x.r); return `${a[0] ? a[0].n : 'Dünya yıldızları'}${a[1] ? ' ve ' + a[1].n : ''} gibi yıldızların oynayacağı bir yardım maçına davet edildin!`; },
    opts: [
      { t: 'Katıl', fx: (p) => { Player.addFame(p, 4); Player.addRel(p, 'fans', 6); Player.addMorale(p, 8); Player.addEnergy(p, -15); return 'Efsanelerle aynı sahayı paylaştın!'; } },
      { t: 'Dinlenmeyi seç', fx: (p) => { Player.addEnergy(p, 5); return 'Bir sonraki maça odaklandın.'; } },
    ],
  },
  // ---- Kulübün gerçek oyuncularıyla gelişim anları ----
  {
    id: 'senior_tip', w: 3, cond: (p) => Game.isYouth() && !Game.inStreet() && p.age >= 10 && !!Mentors.senior(),
    text: () => { const m = Mentors.senior(); const t = Mentors.tip(m.pos); return `A takımın ${m.star ? 'yıldızı' : 'tecrübeli oyuncusu'} ${m.n} (${POS_TR[m.pos] || 'Oyuncu'}) altyapı antrenmanını izlemeye geldi. Antrenmandan sonra yanına geldi: "${t.say}"`; },
    opts: [
      { t: 'Dikkatle dinle ve uygula', fx: (p) => { const m = Mentors.senior(); const t = Mentors.tip(m.pos); const res = t.k.map((k) => `${STATS.find((x) => x.k === k).l} +${Player.train(p, k, m.star ? 2 : 1.5, Game.facility()).toFixed(2)}`); Player.addMorale(p, 6); Player.addEnergy(p, -6); Game.news(`${m.n} altyapıda sana özel ders verdi. ${res.join(', ')}`, 'good'); return `${m.n} ile çalıştın: ${res.join(', ')}`; } },
      { t: 'Teşekkür edip forma iste', fx: (p) => { const m = Mentors.senior(); Player.addMorale(p, 10); return `${m.n} formasını imzalayıp sana verdi. Moral +10`; } },
    ],
  },
  {
    id: 'legend_visit', w: 1.5, cond: () => Game.isYouth() && !Game.inStreet() && !!Mentors.oldLegend(),
    text: () => { const L = Mentors.oldLegend(); return `Kulübün efsanesi ${L.n} altyapı tesislerini ziyaret etti ve gençlere bir antrenman yaptırdı. Seni ayrıca kenara çekti.`; },
    opts: [
      { t: 'Ondan bir şey öğren', fx: (p) => { const L = Mentors.oldLegend(); const t = Mentors.tip(L.pos); const k = t.k[0]; const g = Player.train(p, k, 2, Game.facility()); Player.addMorale(p, 8); return `"${t.say}" ${STATS.find((x) => x.k === k).l} +${g.toFixed(2)}`; } },
      { t: 'Hatıra fotoğrafı çek', fx: (p) => { const L = Mentors.oldLegend(); Player.addMorale(p, 6); Player.addFame(p, 0.4); Social.post('daily', `Efsane ${L.n} ile. Bir gün ben de...`, 1.4); return 'Fotoğrafın sosyal medyada çok beğenildi.'; } },
    ],
  },
  {
    id: 'u_promo', w: 1, cond: (p) => Game.isYouth() && !Game.inStreet() && p.age >= 15 && Player.overall(p) >= expectedAtAge(p.age) + 4,
    text: () => 'A takım teknik direktörü seni bu hafta profesyonellerle antrenmana çıkarmak istiyor. Tempo çok yüksek olacak.',
    opts: [
      { t: 'Hazırım', fx: (p) => { const k = Game.state.trainFocus; const g = Player.train(p, k, 2.2, Game.facility()); Player.addEnergy(p, -16); Player.addRel(p, 'coach', 3); if (U.chance(Player.injuryChance(p, 0.03))) Game.injure(1, 'A takım antrenmanında'); return `Profesyonellerin temposuna ayak uydurdun. ${STATS.find((x) => x.k === k).l} +${g.toFixed(2)}`; } },
      { t: 'Henüz erken', fx: (p) => { Player.addEnergy(p, 4); return 'Altyapıda çalışmaya devam ettin.'; } },
    ],
  },
  {
    id: 'captain_fk', w: 2, cond: () => !Game.isYouth() && !!Mentors.senior(),
    text: () => { const m = Mentors.senior(); return `Takımın ${m.star ? 'yıldızı' : 'kaptanı'} ${m.n} antrenman bitince seni yanına çağırdı: "Hadi, biraz ekstra çalışalım."`; },
    opts: [
      { t: 'Kal ve çalış', fx: (p) => { const m = Mentors.senior(); const t = Mentors.tip(m.pos); const k = U.pick(t.k); const g = Player.train(p, k, 1.6, Game.facility()); Player.addRel(p, 'team', 4); Player.addEnergy(p, -10); return `${m.n}: "${t.say}" ${STATS.find((x) => x.k === k).l} +${g.toFixed(2)}`; } },
      { t: 'Bugün yorgunum', fx: (p) => { Player.addEnergy(p, 4); Player.addRel(p, 'team', -1); return 'Başka bir gün çalışırsınız.'; } },
    ],
  },
  {
    id: 'veteran', w: 1.5, cond: (p) => !Game.isYouth() && p.age <= 22 && !!Mentors.veteran(),
    text: () => { const v = Mentors.veteran(); return `Takımın en tecrübeli oyuncusu ${v.n} (${v.age}) yemekte yanına oturdu ve profesyonellik üzerine konuştu.`; },
    opts: [
      { t: 'Tavsiyelerini dinle', fx: (p) => { const g = Player.train(p, 'stamina', 1.2, 1); Player.addMorale(p, 5); Player.addRel(p, 'team', 3); return `Beslenme ve uyku düzenini değiştirdin. Dayanıklılık +${g.toFixed(2)}`; } },
      { t: 'Kibarca dinle', fx: (p) => { Player.addRel(p, 'team', 1); return 'Sohbet keyifliydi.'; } },
    ],
  },
  {
    id: 'physio', w: 1, cond: (p) => !Game.inStreet() && p.energy < 70,
    text: () => 'Kulübün fizyoterapisti hareketlerini inceledi ve sana özel bir esneme programı hazırladı.',
    opts: [
      { t: 'Programı uygula', fx: (p) => { const g = Player.train(p, 'physical', 1, 1); Player.addEnergy(p, 8); return `Kendini daha hafif hissediyorsun. Enerji +8, Güç +${g.toFixed(2)}`; } },
      { t: 'Gerek yok', fx: () => 'Programı dosyaya kaldırdın.' },
    ],
  },
);

// ---------- Sosyal medya (takipçi, paylaşım, beğeni) ----------
const SOCIAL_COMMENTS = {
  goal: ['Kral!', 'Bu çocuk ileride efsane olur', 'Gol makinesi çalışıyor', 'Kaleciye geçmiş olsun', 'Ben bunu çok önceden söylemiştim', 'Şu vuruşu 40 kez izledim', 'Rakip defans hâlâ seni arıyor', 'Formanı ver abi'],
  motm: ['Maçın adamı değil maçın kralı', 'Hoca bunu her maç oynat', 'Reyting değil roket', 'Bugün sahada tek kişi vardı'],
  trophy: ['Vitrine bir kupa daha!', 'Şampiyon olan kim? Biziz!', 'Bu daha başlangıç', 'Gözlerim doldu valla'],
  transfer: ['Yeni takımına hayırlı olsun', 'Eski takım üzgün yeni takım mutlu', 'Formanı şimdiden aldım', 'Bonservis kaç ya?'],
  sponsor: ['Reklam ama yakışmış', 'Ben de aldım bundan', 'Para kokuyor', 'Marka doğru adamı seçmiş', 'İndirim kodu var mı?'],
  life: ['Bu araba benim maaşımdan pahalı', 'Bir tur atalım mı?', 'Hak ettin kardeşim', 'Zenginlik yakışmış'],
  daily: ['Antrenmanda bile karizma', 'Takip edene takip', 'Bu selfie maç kazandırır', 'Saç modeli efsane', 'Beni de antrenmana götür', 'Annemle beraber hayranız'],
};

const Social = {
  ensure(p) {
    if (!p.social) {
      const base = (p.name + p.surname).toLowerCase().replace(/[^a-zçğıöşü]/g, '').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u');
      p.social = { handle: '@' + base + p.shirt, followers: 40 + U.randi(0, 60), following: U.randi(80, 260), posts: [] };
    }
    // eski kayıtlardaki gerçek dışı takipçi sayıları ünün izin verdiği tavana çekilir
    if (Game.state && p.social.followers > Social.cap(p)) p.social.followers = Social.cap(p);
    return p.social;
  },
  // Takipçi tavanı hedefin 1,6 katı
  cap(p) { return Math.round(Social.target(p) * 1.6); },
  // mevcut takipçi hedefe yaklaştıkça yeni takipçi kazanmak zorlaşır
  room(p) { const f = p.social ? p.social.followers : 0; return U.clamp(1.5 - f / Math.max(1, Social.target(p)), 0, 1); },
  // Takipçi hedefi: ün ve ligin görünürlüğü belirler; 200 binin üstü kariyer birikimiyle açılır
  // (profesyonel sezon, kupa, Altın Yıldız). Örn. 2 sezonluk genç yıldız ≈ 10-20 Mn, uzun kariyerli efsane ≈ 100 Mn+
  target(p) {
    const lg = !Game.state || Game.inStreet() || Game.isYouth() ? null : LEAGUES.find((l) => l.id === Game.club().league);
    const vis = lg ? U.clamp(0.7 + lg.fame * 0.25, 0.8, 1.1) : 0.7;
    const base = 120 * Math.exp(Math.min(p.fame, 100) * 0.135) * vis;
    const pro = (p.history || []).filter((h) => h.age >= 17 && h.apps > 0).length;
    const legacy = U.clamp(0.04 + pro * 0.05 + (p.trophies || []).length * 0.01 + (p.ballon || 0) * 0.08, 0.04, 1);
    return Math.round(Math.min(base, 2e5) + Math.max(0, base - 2e5) * legacy);
  },
  fmt(n) {
    n = Math.round(n);
    if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace('.', ',') + ' Mn';
    if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace('.', ',') + ' B';
    return String(n);
  },
  // Dünya gündemi: yıldızların veda, ilk maç ve transfer paylaşımları
  trend(x) {
    const so = Social.ensure(Game.p);
    so.trends = so.trends || [];
    const handle = '@' + x.L.n.toLowerCase().replace(/[^a-zçğıöşü]/g, '').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u');
    const text = { retire: 'Teşekkürler futbol. Her şey için minnettarım. Şimdi yeni bir sayfa.', debut: 'İlk profesyonel sözleşmemi imzaladım! Hayaller gerçek oluyor.', transfer: 'Yeni maceraya hazırım. Yeni formam çok yakıştı mı?' }[x.kind];
    const likes = Math.round(Math.exp(x.L.peak * 0.19) * U.rand(0.6, 1.4));
    so.trends.unshift({ u: handle, n: x.L.n, kind: x.kind, text, likes, y: Game.state.season.year + 1 });
    so.trends = so.trends.slice(0, 8);
  },
  week() {
    const p = Game.p, so = Social.ensure(p);
    const tgt = Social.target(p);
    // ünün altındaysan hızla yetişir; üstündeysen çok yavaş erir (maç kazanımları kalıcı olsun)
    const f = so.followers;
    const drift = f < tgt ? (tgt - f) * 0.08 : -(f - tgt) * 0.05;
    so.followers = U.clamp(Math.round(f + drift + f * U.rand(-0.002, 0.003)), 10, Social.cap(p));
  },
  post(kind, text, boost = 1, opts = {}) {
    const p = Game.p, so = Social.ensure(p), s = Game.state;
    const likes = Math.round(so.followers * U.rand(0.05, 0.12) * boost) + U.randi(1, 9);
    const pool = SOCIAL_COMMENTS[kind] || SOCIAL_COMMENTS.daily;
    const fans = ['futbolsever', 'tribunsesi', 'golkrali', 'altyapi_avcisi', 'mahallemizin_yildizi', 'sahakenari', 'cimbomkalbim', 'kanarya1907', 'kartalgozu', 'taraftar_ayse', 'deden_gururlu'];
    const comments = U.shuffle(pool).slice(0, 2).map((c) => ({ u: U.pick(fans) + U.randi(1, 99), t: c }));
    const club = Game.inStreet() ? null : Game.club();
    const scene = SocialArt.sceneFor(kind, text);
    so.seq = (so.seq || 0) + 1;
    so.posts.unshift({
      id: so.seq, seed: U.randi(1, 2e9), kind, scene, text, likes, comments, nc: Math.max(2, Math.round(likes * U.rand(0.01, 0.03))),
      w: `${s.season.year} H${s.season.round + 1}`, y: s.season.year, r: s.season.round,
      cid: opts.c1 ? null : club && club.id, c1: opts.c1 || (club && club.c1), c2: opts.c2 || (club && club.c2), short: opts.short || (club && club.short), num: p.shirt,
      loc: opts.loc || SocialArt.locFor(scene, club), brand: opts.brand,
    });
    so.posts = so.posts.slice(0, 15);
    so.followers = Math.min(Social.cap(p), so.followers + Math.round(likes * 0.03 * boost * Social.room(p)));
  },
  natOpts() {
    const code = Game.p.nation;
    const col = NAT_COLORS[code] || ['#c8102e', '#ffffff'];
    return { c1: col[0], c2: col[1], short: code, loc: 'Milli Takım' };
  },
  // Eski kayıtlardaki gönderilere kimlik ve görsel bilgisi
  migrate(so) {
    so.posts.forEach((x) => {
      if (x.id == null) { so.seq = (so.seq || 0) + 1; x.id = 1000 + so.seq; }
      if (x.seed == null) x.seed = x.id * 7919 + 13;
      if (!x.scene) x.scene = SocialArt.sceneFor(x.kind, x.text);
      if (x.nc == null) x.nc = Math.max(2, Math.round(x.likes * 0.02));
    });
  },
  ago(x) {
    const s = Game.state;
    if (x.y == null) return x.w;
    if (x.y !== s.season.year) return `${x.y}`;
    const d = s.season.round - x.r;
    return d <= 0 ? 'BU HAFTA' : `${d} HAFTA ÖNCE`;
  },
  afterMatch(sum, teamName) {
    if (!sum.played) return;
    if (sum.goals >= 3) Social.post('goal', `Hat-trick! ${teamName} formasıyla unutulmaz bir gece. Topu eve götürüyorum.`, 2.2);
    else if (sum.goals > 0) Social.post('goal', U.pick([`Golümü attım, 3 puanı aldık. Sıradaki maça!`, `Ağlar sallandı! Desteğiniz için teşekkürler.`, `Bu gol ailemize gelsin.`, `Çalıştık, kazandık. Gol bonusu da cabası.`]), 1.3);
    else if (sum.motm) Social.post('motm', `Maçın adamı ödülü takımımın. Birlikte daha güçlüyüz.`, 1.4);
    else if (sum.assists > 0 && U.chance(0.5)) Social.post('goal', `Asist de en az gol kadar güzel. Arkadaşımı tebrik ederim.`, 1.1);
  },
  // Instagram tarzı gönderi (akış kartı)
  postCard(x, so, verified) {
    return `<article class="ig-post">
      <header class="ig-ph"><span class="ig-pav"><canvas class="so-avatar sm" aria-hidden="true"></canvas></span>
        <span class="ig-pid"><b>${U.esc(so.handle.replace('@', ''))}${typeof Star !== 'undefined' ? Star.badge(verified) : verified ? IG.verified() : ''}</b><small>${U.esc(x.loc || '')}</small></span>${IG.more()}</header>
      <div class="ig-media"><canvas data-pid="${x.id}" aria-label="${U.esc(x.text)}"></canvas></div>
      <div class="ig-acts">${IG.heart(true)}${IG.comment()}${IG.send()}<span class="ig-sp"></span>${IG.save()}</div>
      <div class="ig-likes">${Social.fmt(x.likes)} beğenme</div>
      <div class="ig-cap"><b>${U.esc(so.handle.replace('@', ''))}</b> ${U.esc(x.text)}</div>
      <div class="ig-all">${x.nc} yorumun tümünü gör</div>
      ${x.comments.map((c) => `<div class="ig-cm"><b>${U.esc(c.u)}</b> ${U.esc(c.t)}${IG.heart(false)}</div>`).join('')}
      <time class="ig-time">${Social.ago(x)}</time>
    </article>`;
  },

  render(full) {
    const p = Game.p, so = Social.ensure(p);
    Social.migrate(so);
    const verified = p.fame >= 35;
    const club = Game.inStreet() ? null : Game.club();
    const lead = so.posts[0];
    if (!full) {
      return `<section class="card ig ig-home">
        <div class="ig-top"><b>${U.esc(so.handle.replace('@', ''))}${typeof Star !== 'undefined' ? Star.badge(verified) : verified ? IG.verified() : ''}</b><small>${Social.fmt(so.followers)} takipçi</small></div>
        ${lead ? Social.postCard(lead, so, verified) : '<p class="muted">Henüz paylaşım yok. Gol at ya da haftalık planda "Sosyal Medya" ile paylaşım yap.</p>'}
      </section>`;
    }
    const cat = Game.inStreet() ? 'Mahalle futbolcusu' : Game.isYouth() ? 'Genç futbolcu' : 'Sporcu';
    const bio = `${POSITIONS[p.position].l}${club ? ` · ${Game.teamName()}` : ''} · #${p.shirt}`;
    const tr = (so.trends || []).slice(0, 8);
    return `
      <section class="card ig">
        <div class="ig-top"><b>${U.esc(so.handle.replace('@', ''))}${typeof Star !== 'undefined' ? Star.badge(verified) : verified ? IG.verified() : ''}</b></div>
        <div class="ig-prof">
          <div class="ig-ring"><canvas class="so-avatar" aria-hidden="true"></canvas></div>
          <div class="ig-nums">
            <div><b>${so.posts.length}</b><span>gönderi</span></div>
            <div><b>${Social.fmt(so.followers)}</b><span>takipçi</span></div>
            <div><b>${Social.fmt(so.following)}</b><span>takip</span></div>
          </div>
        </div>
        <div class="ig-bio"><b>${U.esc(Player.fullName(p))}</b><small>${cat}</small><span>${U.esc(bio)}</span></div>
        ${typeof Star !== 'undefined' && Star.on() ? '<div class="ig-btns"><button data-star="studio">Profili düzenle</button><button data-star="wiki">Starpedia</button></div>' : ''}
        ${tr.length ? `<div class="ig-hl">${tr.map((x) => `<div class="ig-st ${x.kind}" data-trend="${U.esc(x.n)}"><i><canvas data-story="${U.esc(x.n)}"></canvas></i><small>${U.esc(x.n.split(' ').slice(-1)[0])}</small></div>`).join('')}</div>` : ''}
        <div class="ig-tabs"><span class="on">${IG.grid()}</span><span>${IG.reels()}</span><span>${IG.tag()}</span></div>
        ${so.posts.length ? `<div class="ig-grid">${so.posts.slice(0, 12).map((x) => `<button class="ig-tile" data-post="${x.id}" aria-label="${U.esc(x.text)}"><canvas data-pid="${x.id}" data-crop="1"></canvas>${x.kind === 'trophy' || x.kind === 'transfer' ? `<span class="ig-badge">${IG.multi()}</span>` : ''}<span class="ig-hov">${IG.heart(true)}${Social.fmt(x.likes)}</span></button>`).join('')}</div>` : '<p class="muted">Henüz paylaşım yok.</p>'}
        ${tr.length ? `<div class="lbl">Gündem</div><div class="so-trends">${tr.slice(0, 6).map((x) => `<div class="so-tr ${x.kind}"><b>${U.esc(x.u)}</b><span>${U.esc(x.text)}</span><small>${Icon('heart')}${Social.fmt(x.likes)} · ${x.y}</small></div>`).join('')}</div>` : ''}
      </section>`;
  },

  // Izgaradaki gönderiye dokununca tam gönderi açılır
  open(id) {
    const p = Game.p, so = Social.ensure(p);
    const x = so.posts.find((q) => String(q.id) === String(id));
    if (!x) return;
    const m = Game.modal(`<div class="ig ig-modal">${Social.postCard(x, so, p.fame >= 35)}</div>`, [{ t: 'Kapat', cls: 'btn-ghost' }]);
    Social.drawAvatar(m);
  },

  drawAvatar(root) {
    U.$$('.so-avatar', root || document).forEach((cv) => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = 72 * dpr; cv.height = 72 * dpr;
      const c = cv.getContext('2d');
      const club = Game.club() || { c1: '#2a6fdb', c2: '#fff', id: 'X' };
      const g = c.createLinearGradient(0, 0, 0, 72 * dpr);
      g.addColorStop(0, Sprites.shade(club.c1, -0.3)); g.addColorStop(1, '#0b1020');
      c.fillStyle = g; c.fillRect(0, 0, 72 * dpr, 72 * dpr);
      SocialArt.glow(c, 50 * dpr, 14 * dpr, 40 * dpr, 'rgba(255,240,210,0.35)');
      Sprites.figure(c, 36 * dpr, 128 * dpr, 118 * dpr, { kit: Sprites.kit(club, false), look: Sprites.me(), facing: 'down', noShadow: true, t: 0 });
    });
    SocialArt.paint(root);
  },
};

// ---------- Dünyadan haberler (tekrar etmeyen, ara ara mizahi) ----------
const WorldNews = {
  star() {
    const w = Game.state.world;
    const act = Legends.active(w);
    if (act.length) { const a = U.pick(act); return { n: a.n, club: (w.clubs[a.L.club] || {}).name || '', age: a.age || (a.L.by && Game.state.season ? Game.state.season.year - a.L.by : 0) }; }
    const c = U.pick(Object.values(w.clubs).filter((x) => x.rating >= 75));
    const pl = c.roster.slice().sort((a, b) => b.r - a.r)[0];
    return { n: pl.n, club: c.name, age: pl.age || 0 };
  },
  live(name) { return Game.state.world.legends && Game.state.world.legends.some((L) => L.n === name && L.state === 'active'); },
  bigClub() { return U.pick(Object.values(Game.state.world.clubs).filter((c) => c.rating >= 78)).name; },
  anyClub() { return U.pick(Object.values(Game.state.world.clubs)).name; },
  lastResults() {
    const s = Game.state, r = s.season.round - 1;
    const out = [];
    LEAGUES.forEach((l) => s.world.leagues[l.id].results.filter((x) => x.round === r).forEach((x) => out.push(Object.assign({ lg: l.name }, x))));
    return out;
  },
  templates: [
    { id: 'pajama', f: (W) => { const a = W.star(); return `${a.n} antrenmana pijamayla geldi. Teknik direktör: "En azından renkler kulübe uygundu."`; } },
    { id: 'hair', f: (W) => { const a = W.star(); return `Yeni saç modeliyle antrenmana gelen ${a.n} sosyal medyada gündem oldu. ${a.club} taraftarı ikiye bölündü.`; } },
    { id: 'icecream', f: (W) => { const a = W.star(); return `İddia: ${a.n} yeni sözleşmesine "her golden sonra bir dondurma" maddesi koydurdu.`; } },
    { id: 'radar', f: (W) => { const a = W.star(); return `${W.bigClub()}, ${a.n} için harekete geçti! Menajeri: "Telefonum o kadar çok çalıyor ki şarjım yetmiyor."`; } },
    { id: 'rewatch', f: (W) => { const a = W.star(); return `${a.n}, son golünü 47 kez izlediğini itiraf etti: "48. izleyişte daha da güzeldi."`; } },
    { id: 'president', f: (W) => `${W.anyClub()} başkanı transfer dönemi için konuştu: "Kasada para var, sadece anahtarı bulamadık."` },
    { id: 'mezzi', f: (W) => { const a = W.star(); return `${a.n} bu sezon maç başına ortalama 4 çalım atıyor. Rakip defanslar ortak bir terapiste gidiyor.`; } },
    { id: 'ronalda', f: (W) => { const a = W.star(); return `${a.n} yeni antrenman videosu paylaştı. Karın kaslarının ayrı bir hesap açacağı konuşuluyor.`; } },
    { id: 'lace', f: (W) => `${W.anyClub()} kalecisi bağcığını bağlarken gol yedi. Açıklaması kısa: "Bağcık bizim değildi."` },
    { id: 'watch', f: (W) => { const a = W.star(); return `${a.n} bu hafta maçta ${U.randi(12, 14)},${U.randi(1, 9)} km koştu. Akıllı saati "lütfen dur" uyarısı verdi.`; } },
    { id: 'emoji', f: (W) => { const a = W.star(), b = W.star(); return a.n === b.n ? null : `${a.n} ile ${b.n} arasında sosyal medyada "kim daha hızlı" tartışması çıktı. Yarış önerisi geldi.`; } },
    { id: 'mascot', f: (W) => `${W.anyClub()} maskotu devre arasında penaltıda 3'te 3 yaptı. Taraftarlar maskotun kadroya alınmasını istiyor.` },
    { id: 'lunch', f: (W) => { const a = W.star(); return `Transfer sorusuna ${a.n} kısa cevap verdi: "Şu an tek düşündüğüm öğle yemeği."`; } },
    { id: 'cat', f: (W) => { const a = W.star(); return `${a.n} hafif sakatlandı. Evde kedisine çalım atmaya çalışırken halıya takılmış.`; } },
    { id: 'mom', f: (W) => { const a = W.star(); return `${a.n} sahadayken annesi tribünde 90 dakika boyunca hakeme itiraz etti. Hakem: "Ben bile ikna oldum."`; } },
    { id: 'var', f: (W) => `${W.anyClub()} maçında VAR incelemesi 9 dakika sürdü. Seyirciler bu sürede çay demledi.` },
    { id: 'halland', f: (W) => { const a = W.star(); return `${a.n} kahvaltıda 14 yumurta yediğini açıkladı. Tavuk çiftlikleri vardiya ekledi.`; } },
    { id: 'yamel', f: (W) => { const a = W.star(); if (!a.age || a.age > 19) return null; return `${a.n} ödevini yetiştirdikten sonra hat-trick yaptı. Öğretmeni ek puan verdi.`; } },
    { id: 'bigwin', f: (W) => { const r = W.lastResults().sort((a, b) => Math.abs(b.hs - b.as) - Math.abs(a.hs - a.as))[0]; if (!r || Math.abs(r.hs - r.as) < 3) return null; const c = Game.state.world.clubs; const win = r.hs > r.as ? c[r.h].name : c[r.a].name, lose = r.hs > r.as ? c[r.a].name : c[r.h].name; return `${r.lg}'nde haftanın farkı: ${win}, ${lose} karşısında ${Math.max(r.hs, r.as)}-${Math.min(r.hs, r.as)} kazandı. Kaybeden teknik direktör: "Çim çok kaygandı."`; } },
    { id: 'upset', f: (W) => { const c = Game.state.world.clubs; const r = W.lastResults().find((x) => (x.hs > x.as && c[x.a].rating - c[x.h].rating >= 8) || (x.as > x.hs && c[x.h].rating - c[x.a].rating >= 8)); if (!r) return null; const win = r.hs > r.as ? c[r.h].name : c[r.a].name, lose = r.hs > r.as ? c[r.a].name : c[r.h].name; return `Haftanın sürprizi ${r.lg}'nden: ${win}, favori rakibi ${lose} karşısında ${Math.max(r.hs, r.as)}-${Math.min(r.hs, r.as)} kazandı.`; } },
    { id: 'leader', f: () => { const l = U.pick(LEAGUES); const t = World.sortedTable(Game.state.world.leagues[l.id])[0]; if (!t || !t.p) return null; return `${l.name}'nde zirvede ${Game.state.world.clubs[t.id].name} var (${t.pts} puan). Rakipleri takvim yaprağı koparmaktan çekinir oldu.`; } },
    { id: 'scorer', f: () => { const l = U.pick(LEAGUES); const t = World.topScorers(Game.state.world.leagues[l.id], 1)[0]; if (!t || t.g < 3) return null; return `${t.name}, ${t.g} golle ${l.name} gol krallığı yarışında önde. Kaleciler geceleri onu rüyasında görüyor.`; } },
    { id: 'scout', f: (W) => (Game.p.fame >= 8 ? `${W.bigClub()} gözlemcileri genç yetenek ${Game.p.name} ${Game.p.surname} için not defterini doldurdu.` : null) },
    { id: 'myfollow', f: () => { const so = Social.ensure(Game.p); return so.followers >= 5000 ? `Sosyal medyada ${Social.fmt(so.followers)} takipçiye ulaşan ${Game.p.name} ${Game.p.surname} için mahalledeki berber "o benim müşterim" diyor.` : null; } },
    { id: 'referee', f: (W) => `${W.anyClub()} maçının hakemi kartlarını soyunma odasında unuttu. Sarı kartı "zihinden" gösterdi.` },
    { id: 'drone', f: (W) => `${W.anyClub()} antrenmanını izleyen dron, kaleci tarafından yumrukla uzaklaştırıldı. Kaleci: "Refleks."` },
  ],
  // Haftanın yıldız haberi: dönemin en iyilerinden birinin son maçı
  starStory() {
    const s = Game.state, w = s.world;
    const top = Legends.active(w).sort((a, b) => b.r - a.r).slice(0, 14);
    const res = WorldNews.lastResults();
    const cand = U.shuffle(top).map((x) => { const r = res.find((q) => q.h === x.L.club || q.a === x.L.club); return r ? { x, r } : null; }).find(Boolean);
    if (!cand) return;
    const { x, r } = cand;
    const home = r.h === x.L.club;
    const gf = home ? r.hs : r.as, ga = home ? r.as : r.hs;
    const club = w.clubs[x.L.club], opp = w.clubs[home ? r.a : r.h];
    if (!club || !opp) return;
    let t;
    if (gf > ga && gf >= 3) t = `${x.n} şov yaptı! ${club.name}, ${opp.name} karşısında ${gf}-${ga} kazandı; yıldız oyuncu ${Math.min(gf, U.randi(2, 3))} golle maça damga vurdu.`;
    else if (gf > ga) t = `${x.n} yine sahnede! ${club.name}, ${opp.name} engelini ${gf}-${ga} aştı; galibiyet golü ondan geldi.`;
    else if (gf === ga) t = `${x.n} kilidi açamadı. ${club.name} ile ${opp.name} ${gf}-${ga} berabere kaldı.`;
    else t = `Şok sonuç: ${x.n}'li ${club.name} kayıp! ${opp.name} karşısında ${gf}-${ga} yenilen ekipte yıldız oyuncu eleştirilerin hedefinde.`;
    Game.news(t, 'world', { star: { n: x.n, club: club.id } });
  },

  roll() {
    const s = Game.state;
    s.newsUsed = s.newsUsed || [];
    const pool = U.shuffle(WorldNews.templates.filter((t) => !s.newsUsed.includes(t.id)));
    for (const t of pool) {
      let txt = null;
      try { txt = t.f(WorldNews); } catch (e) { txt = null; }
      if (!txt) continue;
      s.newsUsed.push(t.id);
      s.newsUsed = s.newsUsed.slice(-16);
      Game.news(txt, 'world');
      return;
    }
  },
};
