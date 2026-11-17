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
    suit: { n: 'Takım elbise', cat: 'wear', p: [80, 300, 1500, 6000], md: ['Slim', 'Classic', 'Milano', 'Double', 'Gala', 'Tuxedo'] },
    hoodie: { n: 'Kapüşonlu sweatshirt', cat: 'wear', p: [20, 70, 250, 1200], md: ['Essential', 'Oversize', 'Tech', 'College', 'Zip', 'Logo'] },
    cap: { n: 'Şapka', cat: 'wear', p: [12, 35, 120, 600], md: ['Classic', 'Trucker', 'Snapback', 'Dad', 'Sport', 'Wool'] },
    dressshoe: { n: 'Klasik ayakkabı', cat: 'shoe', p: [40, 150, 450, 1400], md: ['Oxford', 'Loafer', 'Derby', 'Brogue', 'Monk', 'Chelsea'] },
    ring: { n: 'Yüzük', cat: 'jewel', p: [20, 250, 2500, 25000], md: ['Solitaire', 'Halo', 'Eternity', 'Signet', 'Vintage', 'Royal'] },
    necklace: { n: 'Kolye', cat: 'jewel', p: [15, 180, 1800, 18000], md: ['Drop', 'Pendant', 'Riviera', 'Star', 'Heart', 'Lumière'] },
    pen: { n: 'Dolma kalem', cat: 'jewel', p: [5, 40, 500, 3000], md: ['Classic', 'Signature', 'Executive', 'Heritage', 'Meister', 'Slim'] },
    wallet: { n: 'Cüzdan', cat: 'acc', p: [12, 60, 300, 900], md: ['Bifold', 'Card', 'Zip', 'Slim', 'Travel', 'Classic'] },
    backpack: { n: 'Sırt çantası', cat: 'acc', p: [25, 90, 400, 2500], md: ['Daypack', 'Urban', 'Trek', 'Campus', 'City', 'Roll-top'] },
    suitcase: { n: 'Valiz', cat: 'acc', p: [60, 250, 800, 4000], md: ['Cabin', 'Check-in', 'Trunk', 'Voyager', 'Globe', 'Aero'] },
    tv: { n: 'Televizyon', cat: 'tech', p: [300, 900, 2500, 12000], md: ['55"', '65"', '75"', '85" OLED', 'Frame', 'Cinema'] },
    console: { n: 'Oyun konsolu', cat: 'tech', p: [300, 500, 700, 2500], md: ['Mini', 'S', 'Pro', 'X', 'Elite', 'Edition'] },
    camera: { n: 'Fotoğraf makinesi', cat: 'tech', p: [300, 900, 2500, 8000], md: ['Z50', 'R7', 'Alpha', 'Classic M', 'Vlog', 'Pro X'] },
    drone: { n: 'Drone', cat: 'tech', p: [100, 500, 1500, 5000], md: ['Mini', 'Air', 'Pro', 'Cine', 'FPV', 'Explorer'] },
    tablet: { n: 'Tablet', cat: 'tech', p: [150, 450, 1100, 2500], md: ['Tab 10', 'Tab 11', 'Pro 12', 'Air', 'Mini', 'Studio'] },
    smartwatch: { n: 'Akıllı saat', cat: 'tech', p: [40, 200, 500, 2000], md: ['Fit', 'Active', 'Sport', 'Pro', 'Ultra', 'Edition'] },
    speaker: { n: 'Hoparlör', cat: 'tech', p: [30, 150, 500, 3000], md: ['Go', 'Boom', 'Home', 'Party', 'Studio', 'Tower'] },
    bike: { n: 'Bisiklet', cat: 'hobby', p: [200, 700, 3500, 12000], md: ['City', 'Road', 'Gravel', 'Aero', 'Carbon', 'E-Bike'] },
    guitar: { n: 'Gitar', cat: 'hobby', p: [100, 450, 2000, 9000], md: ['Acoustic', 'Classic', 'Electric', 'Jumbo', 'Custom', 'Vintage'] },
    chess: { n: 'Satranç takımı', cat: 'hobby', p: [15, 80, 500, 5000], md: ['Club', 'Tournament', 'Walnut', 'Marble', 'Royal', 'Travel'] },
    sofa: { n: 'Koltuk', cat: 'home', p: [300, 1200, 4500, 25000], md: ['Loft', 'Chester', 'Nordic', 'Lounge', 'Modular', 'Velvet'] },
    painting: { n: 'Tablo', cat: 'home', p: [40, 400, 5000, 80000], md: ['Abstract', 'Landscape', 'Geometry', 'Horizon', 'Color Field', 'Study'] },
    lamp: { n: 'Abajur', cat: 'home', p: [25, 120, 600, 4000], md: ['Classic', 'Arc', 'Bell', 'Deco', 'Atelier', 'Glow'] },
    coffee: { n: 'Kahve makinesi', cat: 'home', p: [60, 300, 1200, 6000], md: ['Barista', 'Espresso', 'Duo', 'Pro', 'Bar', 'Café'] },
    gamechair: { n: 'Oyuncu koltuğu', cat: 'home', p: [120, 350, 900, 3000], md: ['Racer', 'Pro', 'Titan', 'Ergo', 'Elite', 'Stream'] },
    toycar: { n: 'Uzaktan kumandalı araba', cat: 'kids', p: [20, 60, 200, 800], md: ['Racer', 'Rally', 'Monster', 'Drift', 'Turbo', 'Speed'] },
    plush: { n: 'Peluş ayı', cat: 'kids', p: [10, 30, 90, 400], md: ['Mini', 'Classic', 'Jumbo', 'Cuddle', 'Teddy', 'Royal'] },
  };
  const CATS = { wear: 'Giyim', shoe: 'Ayakkabı', acc: 'Aksesuar', jewel: 'Mücevher', tech: 'Elektronik', beauty: 'Kozmetik', home: 'Ev ve dekor', hobby: 'Hobi ve spor', kids: 'Çocuk' };
  const COL = [['Siyah', '#17191d'], ['Beyaz', '#f1f0ec'], ['Lacivert', '#1b2a4a'], ['Kırmızı', '#c8102e'], ['Bej', '#d6c0a0'], ['Taba', '#8b5a2b'], ['Haki', '#4b5a3a'], ['Gri', '#8a8f98'], ['Bordo', '#6d1a2a'], ['Mavi', '#2563eb'], ['Pembe', '#e58aa8'], ['Yeşil', '#1f6e4a'], ['Krem', '#efe4cf'], ['Turuncu', '#e8742a'], ['Mor', '#5b3a8c'], ['Antrasit', '#3a3e45']];
  // oyunun kendi markaları (gerçek markalarla ilgisi yoktur)
  const BRANDS = [
    { id: 'kumo', n: 'Kumo', seg: 'eco', t: ['sneaker', 'jacket', 'headphones', 'glasses', 'hoodie', 'cap', 'backpack'], mono: 'K', pal: [0, 1, 2, 7, 9, 13] },
    { id: 'basico', n: 'Basico', seg: 'eco', t: ['bag', 'jacket', 'perfume', 'watch', 'wallet', 'dressshoe', 'suit'], mono: 'B', pal: [0, 1, 4, 6, 7, 10] },
    { id: 'trendo', n: 'Trendo', seg: 'eco', t: ['sneaker', 'glasses', 'bag', 'perfume', 'cap', 'hoodie', 'necklace'], mono: 'T', pal: [3, 9, 10, 13, 14, 1] },
    { id: 'pratik', n: 'Pratik', seg: 'eco', t: ['laptop', 'headphones', 'watch', 'tv', 'tablet', 'speaker', 'smartwatch', 'console'], mono: 'P', pal: [0, 7, 15, 9, 1] },
    { id: 'nordline', n: 'Nordline', seg: 'mid', t: ['jacket', 'sneaker', 'bag', 'glasses', 'backpack', 'suitcase', 'bike', 'hoodie'], mono: 'N', pal: [2, 6, 0, 13, 7, 11] },
    { id: 'urbanika', n: 'Urbanika', seg: 'mid', t: ['sneaker', 'jacket', 'bag', 'perfume', 'hoodie', 'cap', 'suit', 'dressshoe'], mono: 'U', pal: [0, 1, 4, 8, 10, 14] },
    { id: 'pulsar', n: 'Pulsar', seg: 'mid', t: ['headphones', 'laptop', 'watch', 'tv', 'console', 'camera', 'drone', 'tablet', 'smartwatch', 'speaker'], mono: 'P', pal: [0, 9, 1, 15, 3] },
    { id: 'tempora', n: 'Tempora', seg: 'mid', t: ['watch', 'glasses', 'perfume', 'pen', 'wallet', 'ring'], mono: 'T', pal: [2, 0, 12, 5, 11] },
    { id: 'ardent', n: 'Ardent Studio', seg: 'prem', t: ['jacket', 'bag', 'sneaker', 'perfume', 'suit', 'dressshoe', 'wallet'], mono: 'A', pal: [0, 4, 8, 2, 12, 6] },
    { id: 'vektor', n: 'Vektor', seg: 'prem', t: ['laptop', 'headphones', 'watch', 'tv', 'camera', 'drone', 'tablet', 'smartwatch', 'speaker'], mono: 'V', pal: [15, 7, 0, 1, 9] },
    { id: 'halden', n: 'Halden & Co', seg: 'prem', t: ['watch', 'bag', 'glasses', 'pen', 'wallet', 'suitcase'], mono: 'H', pal: [2, 5, 0, 11, 12] },
    { id: 'lumen', n: 'Lumen Paris', seg: 'prem', t: ['perfume', 'glasses', 'sneaker', 'necklace', 'ring'], mono: 'L', pal: [10, 1, 4, 14, 3] },
    { id: 'marchetti', n: 'Marchetti', seg: 'prem', t: ['bag', 'jacket', 'sneaker', 'dressshoe', 'suit', 'wallet', 'backpack'], mono: 'M', pal: [5, 0, 8, 4, 12] },
    { id: 'valmonte', n: 'Valmonte', seg: 'lux', t: ['jacket', 'bag', 'sneaker', 'glasses', 'suit', 'hoodie', 'cap', 'suitcase'], mono: 'V', pal: [0, 12, 8, 2, 4] },
    { id: 'ardelle', n: 'Maison Ardelle', seg: 'lux', t: ['bag', 'perfume', 'glasses', 'wallet', 'necklace', 'suitcase'], mono: 'MA', pal: [5, 0, 10, 4, 8] },
    { id: 'castelli', n: 'Aurelio Castelli', seg: 'lux', t: ['sneaker', 'jacket', 'bag', 'perfume', 'dressshoe', 'suit', 'backpack'], mono: 'AC', pal: [1, 0, 8, 11, 2] },
    { id: 'kronberg', n: 'Kronberg', seg: 'lux', t: ['watch', 'pen', 'smartwatch'], mono: 'K', pal: [2, 0, 11, 1, 12] },
    { id: 'solenne', n: 'Solenne', seg: 'lux', t: ['watch', 'glasses', 'perfume', 'ring', 'necklace'], mono: 'S', pal: [10, 12, 0, 14, 4] },
    { id: 'yuva', n: 'Yuva Home', seg: 'eco', t: ['sofa', 'lamp', 'coffee', 'painting', 'gamechair', 'chess'], mono: 'Y', pal: [7, 4, 1, 2, 11, 6] },
    { id: 'minik', n: 'Minik', seg: 'eco', t: ['toycar', 'plush', 'bike', 'cap'], mono: 'M', pal: [3, 9, 13, 10, 11, 14] },
    { id: 'casalino', n: 'Casalino', seg: 'mid', t: ['sofa', 'lamp', 'coffee', 'painting', 'chess'], mono: 'C', pal: [7, 4, 2, 11, 12, 8] },
    { id: 'ritmo', n: 'Ritmo', seg: 'mid', t: ['guitar', 'speaker', 'headphones', 'gamechair'], mono: 'R', pal: [3, 0, 5, 9, 14] },
    { id: 'oyunbaz', n: 'Oyunbaz', seg: 'mid', t: ['toycar', 'plush', 'console', 'gamechair'], mono: 'O', pal: [3, 9, 13, 11, 14, 10] },
    { id: 'velocita', n: 'Velocita', seg: 'prem', t: ['bike', 'drone', 'smartwatch', 'backpack'], mono: 'V', pal: [3, 0, 1, 13, 9] },
    { id: 'nordhaus', n: 'Nordhaus', seg: 'prem', t: ['sofa', 'lamp', 'coffee', 'painting', 'chess'], mono: 'N', pal: [7, 12, 2, 6, 15] },
    { id: 'orion', n: 'Orion Optics', seg: 'prem', t: ['camera', 'drone', 'glasses'], mono: 'O', pal: [0, 15, 1, 5] },
    { id: 'lumokids', n: 'Lumo Kids', seg: 'prem', t: ['toycar', 'plush', 'bike'], mono: 'L', pal: [9, 10, 13, 4, 11] },
    { id: 'bellacourt', n: 'Bellacourt', seg: 'lux', t: ['ring', 'necklace', 'watch', 'pen'], mono: 'B', pal: [9, 3, 11, 14, 1, 8] },
    { id: 'domus', n: 'Domus Aurea', seg: 'lux', t: ['sofa', 'painting', 'lamp', 'coffee', 'chess'], mono: 'DA', pal: [12, 0, 8, 2, 11, 4] },
    { id: 'aeronyx', n: 'Aeronyx', seg: 'lux', t: ['laptop', 'headphones', 'tv', 'speaker', 'camera', 'console', 'drone'], mono: 'A', pal: [0, 15, 12, 1] },
  ];
  const SEGI = { eco: 0, mid: 1, prem: 2, lux: 3 };
  const SCR = ['#2563eb', '#7c3aed', '#0f8b8d', '#e5383b', '#f59e0b', '#16a34a', '#db2777'];
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

  // ---------- araçlar ve evler (Arabalar ve Evim Emlak uygulamalarında satılır) ----------
  // gövde: 0 hatchback, 1 sedan, 2 SUV, 3 coupe, 4 süper spor, 5 klasik, 6 cabrio, 7 pickup
  const BODY = ['Hatchback', 'Sedan', 'SUV', 'Coupe', 'Süper spor', 'Klasik', 'Cabrio', 'Pickup'];
  const BODYF = [1, 1.1, 1.3, 1.45, 2.6, 2.2, 1.5, 1.15], BODYHP = [0.8, 0.95, 1.05, 1.25, 1.9, 1.2, 1.2, 1.0];
  const MAKERS = [
    { id: 'volta', n: 'Volta', seg: 'eco', mono: 'V', bd: [0, 1, 2, 7], pal: [1, 9, 3, 7, 0, 13], md: ['City', 'Neo', 'Cross', 'Work'] },
    { id: 'kestrel', n: 'Kestrel Motors', seg: 'mid', mono: 'K', bd: [1, 2, 3, 0, 7], pal: [0, 2, 7, 3, 15, 1], md: ['Sedan', 'Terra', 'GT', 'Hatch', 'Ranger'] },
    { id: 'avanti', n: 'Avanti', seg: 'mid', mono: 'A', bd: [0, 6, 3, 1], pal: [3, 1, 9, 13, 14], md: ['Uno', 'Spyder', 'Coupé', 'Berlina'] },
    { id: 'brennar', n: 'Brennar', seg: 'prem', mono: 'B', bd: [1, 2, 3, 6], pal: [0, 7, 2, 1, 15], md: ['S', 'X', 'C', 'Roadster'] },
    { id: 'halcyon', n: 'Halcyon', seg: 'prem', mono: 'H', bd: [2, 1, 4], pal: [1, 0, 9, 7, 11], md: ['Electra', 'Volt', 'Apex'] },
    { id: 'sterling', n: 'Sterlingham', seg: 'lux', mono: 'S', bd: [1, 2, 6, 3], pal: [0, 2, 8, 12, 11], md: ['Regent', 'Monarch', 'Belvedere', 'Ascot'] },
    { id: 'vallardi', n: 'Vallardi', seg: 'lux', mono: 'V', bd: [4, 4, 6, 3], pal: [3, 13, 0, 1, 9], md: ['Furia', 'Tempesta', 'Aperta', 'GT Lusso'] },
    { id: 'orsini', n: 'Orsini Classic', seg: 'lux', mono: 'O', bd: [5, 5, 6], pal: [3, 2, 12, 11, 0], md: ['1962', 'Spider 58', 'Berlinetta'] },
  ];
  const CARBASE = { eco: 16000, mid: 32000, prem: 78000, lux: 300000 };
  // evler: [çizim, tür adı, dolar tabanı, kademe, oda, m²]
  const HOMES = [[0, 'Daire', 180000, 'eco', '2+1', 95], [7, 'Loft', 520000, 'mid', '2+1', 140], [5, 'Sahil evi', 900000, 'mid', '3+1', 180], [4, 'Dağ evi', 1100000, 'prem', '4+1', 220], [2, 'Modern villa', 3200000, 'prem', '5+2', 420], [1, 'Çatı katı', 4500000, 'lux', '4+1', 360], [3, 'Malikâne', 9000000, 'lux', '8+3', 900], [6, 'Özel ada', 45000000, 'lux', '6+2', 1200]];
  const CITIES = { 0: ['İstanbul', 'Madrid', 'Lizbon', 'Amsterdam', 'Münih'], 7: ['Londra', 'Amsterdam', 'Milano', 'İstanbul'], 5: ['Bodrum', 'Miami', 'Lizbon', 'Rio de Janeiro'], 4: ['Alpler', 'Kapadokya', 'Aspen'], 2: ['Dubai', 'Miami', 'Bodrum', 'Marbella', 'Los Angeles'], 1: ['Londra', 'Paris', 'Dubai', 'New York', 'İstanbul'], 3: ['Londra', 'Paris', 'Milano', 'Madrid'], 6: ['Maldivler', 'Karayipler', 'Bodrum'] };
  const DIST = ['Şehir merkezi', 'Sahil', 'Tepe', 'Marina', 'Park', 'Bahçeli'];
  const HOUSEC = ['#e9e1d4', '#f2f2ef', '#d6c0a0', '#c9ced6', '#efe4cf'];
  function buildBig(out, y) {
    MAKERS.forEach((mk) => {
      const one = (k, j, tag) => {
        const h = hs(`${mk.id}|${k}|${tag || ''}`), hc = hs(`${mk.id}|${k}|${j}|${tag || ''}`), body = mk.bd[k % mk.bd.length];
        const ci = mk.pal[(h + j * 3) % mk.pal.length];
        const usd = CARBASE[mk.seg] * BODYF[body] * (0.85 + ((h >>> 5) % 65) / 100) * (tag === 'new' ? 1.08 : 1);
        const hp = Math.round((90 + Math.log2(Math.max(1, usd / 10000)) * 85) * BODYHP[body] / 5) * 5;
        out.push({
          id: `car.${mk.id}.${tag ? 'n' : ''}${k}.${j}`, b: mk.id, bn: mk.n, seg: mk.seg, t: 'car', tn: BODY[body], cat: 'auto',
          md: tag === 'new' ? `${mk.md[k % mk.md.length]} ${y}` : mk.md[k % mk.md.length], col: COL[ci][0],
          art: { t: 'car', c: COL[ci][1], metal: mk.seg === 'lux' ? ['gold', 'silver', 'black'][hc % 3] : ['silver', 'black'][hc % 2], v: body, m: mk.mono },
          price: priceIn(usd), was: 0, tag, rate: Math.round((4 + ((hc >>> 7) % 10) / 10) * 10) / 10, rev: Math.round([900, 400, 120, 25][SEGI[mk.seg]] * (0.3 + ((hc >>> 11) % 100) / 70)),
          minAge: 18, spec: { hp, top: Math.min(400, Math.round(150 + hp * 0.3)), acc: Math.max(2.3, Math.round((12.8 - hp / 75) * 10) / 10) },
        });
      };
      mk.md.forEach((_, k) => { for (let j = 0; j < 3; j++) one(k, j); });
      for (let j = 0; j < 3; j++) one(mk.md.length + (y % 2), j, 'new');
    });
    HOMES.forEach(([v, n, base, seg, rooms, m2]) => (CITIES[v] || []).forEach((city, ci) => [0, 1].forEach((j) => {
      const h = hs(`home|${v}|${city}|${j}|${y % 2}`);
      const usd = base * (0.75 + ((h >>> 3) % 90) / 100) * (['Londra', 'Paris', 'New York', 'Dubai', 'Monako'].includes(city) ? 1.4 : 1);
      out.push({
        id: `home.${v}.${ci}.${j}`, b: 'home', bn: city, seg, t: 'house', tn: n, cat: 'estate', md: DIST[(h >>> 6) % DIST.length], col: '',
        art: { t: 'house', v, c: HOUSEC[(h >>> 9) % HOUSEC.length], c2: ['#2e3a4a', '#7a2e1f', '#3a4a2e', '#2a2d33'][(h >>> 12) % 4] },
        price: priceIn(usd), was: 0, rate: Math.round((4.2 + ((h >>> 7) % 8) / 10) * 10) / 10, rev: 3 + ((h >>> 13) % 40), minAge: 20,
        spec: { rooms, m2: Math.round(m2 * (0.8 + ((h >>> 15) % 50) / 100)) },
      });
    })));
  }

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
        col: COL[ci][0], art: { t, c: COL[ci][1], c2: t === 'chess' ? '#efe3c8' : ['tv', 'laptop', 'tablet'].includes(t) ? SCR[(h >>> 9) % SCR.length] : COL[ci2][1], metal: metalOf(b, hc), v: k, m: b.mono, lux: b.seg === 'lux' || undefined },
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
    buildBig(out, y);
    CAT = out; CATY = key;
    return out;
  }
  const snap = (id, v) => Object.assign({ id, rate: 4.5, rev: 0, minAge: 0 }, v);
  const byId = (id) => build().find((x) => x.id === id) || (Game.p && Game.p.mall && Game.p.mall.own[id] && typeof Game.p.mall.own[id] === 'object' ? snap(id, Game.p.mall.own[id]) : null);

  // ---------- oyuncu verisi ----------
  const D = () => { const p = Game.p; p.mall = p.mall || { own: {}, log: [], spent: 0 }; return p.mall; };
  const wnum = () => { const s = Game.state; return s.season.year * 100 + s.season.round; };
  const owns = (id) => !!D().own[id];
  // haftanın fırsatları: haftaya göre 8 ürün, %15-40 indirim
  let DEALS = null, DEALK = null;
  function deals() {
    const k = `${wnum()}|${U.cur()}|${Math.round(Math.log2(Math.max(2, Game.p.money)))}`;
    if (DEALS && DEALK === k) return DEALS;
    const w = wnum(), all = build(), p = Game.p, out = [];
    for (let i = 0; out.length < 8 && i < 60; i++) {
      const it = all[hs(`${w}|deal|${i}`) % all.length];
      if (out.some((x) => x.id === it.id) || it.tag === 'old' || it.cat === 'auto' || it.cat === 'estate') continue;
      if (it.price > Math.max(2000, p.money * 3) && i < 40) continue;
      const np = priceIn(it.price * U.CUR.USD.rate * (0.6 + (hs(`${w}|d${i}`) % 26) / 100));
      // yuvarlama sonrası gerçek indirim kalmadıysa fırsat sayılmaz (ör. 9,00 € yerine 9,00 €)
      if (!(np <= it.price * 0.92) || U.money(np) === U.money(it.price)) continue;
      out.push(Object.assign({}, it, { was: it.price, price: np, deal: true }));
    }
    DEALS = out; DEALK = k;
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
    if (it.t === 'car' && typeof LifeX !== 'undefined' && LifeX.needLicense({ art: 'car' }) && !Object.values(D().own).some((x) => x && x.t === 'car')) {
      st.confirm = null;
      return Game.modal('<h3>🚗 Önce ehliyet almalısın</h3><p>Araba kullanmak için ehliyet gerekiyor. Sınav 3 sorudan oluşuyor.</p>', [{ t: 'Vazgeç', cls: 'btn-ghost' }, { t: 'Sınava gir', cls: 'btn-big', fn: () => LifeX.licenseExam((ok) => { if (ok) buy(id); else if (Phone.open) Phone.render(); }) }]);
    }
    const ef = effect(it);
    p.money -= it.price;
    const m = D();
    // kalıcı katalog ürünleri yalnız yıl saklar; sezonluk ürünler, araçlar ve evler kısa özetle saklanır (kayıt küçük kalır)
    m.own[id] = it.tag || it.cat === 'auto' || it.cat === 'estate' ? { y: s.season.year, b: it.b, bn: it.bn, seg: it.seg, t: it.t, tn: it.tn, cat: it.cat, md: it.md, col: it.col, art: it.art, price: it.price, spec: it.spec } : s.season.year;
    m.spent += it.price;
    m.log.push({ id, w: wnum(), p: it.price, fame: ef.fame });
    if (m.log.length > 60) m.log.splice(0, m.log.length - 60);
    Player.addMorale(p, ef.mor);
    if (ef.fame) Player.addFame(p, ef.fame);
    if (it.t === 'car') Social.post('life', `Yeni araba: ${it.bn} ${it.md}.`, 1.3);
    else if (it.t === 'house') Social.post('life', `Yeni evimin anahtarlarını aldım. ${it.bn}!`, 1.4);
    else if (it.seg === 'lux' && U.chance(0.4)) Social.post('life', `Yeni ${it.bn} parçam geldi.`, 1.15);
    const fx = `Moral +${ef.mor}${ef.fame ? ` · Ün +${ef.fame}` : ''}`;
    Game.toast(it.t === 'house' ? `Tapun hazır, yeni evin hayırlı olsun! ${fx}` : it.t === 'car' ? `Araban teslim edildi, iyi yolculuklar! ${fx}` : `Siparişin yolda! ${fx}`, 'good');
    Mall.st.confirm = null;
    Game.save();
    if (typeof Phone !== 'undefined' && Phone.open) Phone.render(); else Game.render();
  }

  // ---------- görünüm ----------
  const st = { pg: 'home', cat: null, seg: null, brand: null, q: '', id: null, sort: 'pop', confirm: null, bseg: null };
  const esc = (x) => U.esc(String(x));
  const money = (n) => U.money(n);
  const loc = () => (typeof I18N !== 'undefined' && I18N.lang && I18N.lang !== 'tr' ? 'en-US' : 'tr-TR');
  const pct = (n) => (typeof I18N !== 'undefined' && I18N.lang && I18N.lang !== 'tr' ? `-${n}%` : `-%${n}`);
  const stars = (r) => { const f = Math.round(r * 2) / 2; return `<span class="vt-st" aria-label="${r}">${[1, 2, 3, 4, 5].map((i) => `<i class="${f >= i ? 'f' : f >= i - 0.5 ? 'h' : ''}"></i>`).join('')}</span>`; };
  const nameH = (it) => `<span class="vt-nm"><span>${esc(it.md)}</span> <span>${esc(it.tn)}</span></span>`;
  const img = (it, big) => `<img class="vt-img${big ? ' big' : ''}" alt="" loading="lazy" src="${MallArt.url(it.art)}">`;
  function card(it0) {
    const it = it0.deal ? it0 : priceOf(it0), own = owns(it.id), off = it.was ? Math.round((1 - it.price / it.was) * 100) : 0;
    return `<button class="vt-card ${it.seg}" data-ml="item:${it.id}" type="button">
      <span class="vt-imw">${img(it)}${off ? `<em class="vt-off">${pct(off)}</em>` : it.tag === 'new' ? '<em class="vt-new">Yeni</em>' : ''}${own ? '<em class="vt-own">Sende</em>' : ''}</span>
      <span class="vt-br">${esc(it.bn)}</span>${nameH(it)}<span class="vt-col">${esc(it.col)}</span>
      <span class="vt-rt">${stars(it.rate)}<small>${it.rev.toLocaleString(loc())}</small></span>
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
    let l = build().filter((x) => x.cat !== 'auto' && x.cat !== 'estate');
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
    const all = build().filter((x) => x.cat !== 'auto' && x.cat !== 'estate'), p = Game.p;
    const afford = all.filter((x) => x.price <= Math.max(500, p.money * 0.25) && !owns(x.id) && x.tag !== 'old').sort((a, b) => b.price - a.price).slice(0, 10);
    const fresh = all.filter((x) => x.tag === 'new').sort((a, b) => hs(a.id) - hs(b.id)).slice(0, 10);
    return `${chips()}
      <div class="vt-tiers">${Object.entries(SEG).map(([k, s]) => `<button class="vt-tier ${k}" data-ml="seg:${k}" type="button"><b>${s.n}</b><small><span>${build().filter((x) => x.seg === k && x.cat !== 'auto' && x.cat !== 'estate').length}</span> <span>ürün</span></small></button>`).join('')}</div>
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
    const sib = it.cat === 'estate' ? [] : build().filter((x) => x.b === it.b && x.t === it.t && x.md === it.md);
    const more = build().filter((x) => x.b === it.b && x.id !== it.id && x.md !== it.md).slice(0, 8);
    const btn = own ? '<span class="vt-buy own">Dolabında</span>' : p.age < it.minAge ? `<span class="vt-buy off"><span>${it.minAge}</span> <span>yaşında açılır</span></span>` : p.money < it.price ? '<span class="vt-buy off">Bakiyen yetersiz</span>' : `<button class="vt-buy ${conf ? 'conf' : ''}" data-ml="buy:${it.id}" type="button">${conf ? `<span>Onayla</span> · <span>${money(it.price)}</span>` : 'Hemen al'}</button>`;
    return `<div class="vt-pd">${img(it, true)}
      <button class="vt-brl" data-ml="brand:${it.b}" type="button">${esc(it.bn)} <small>${SEG[it.seg].n}</small></button>
      <h3>${nameH(it)}</h3><div class="vt-rt">${stars(it.rate)}<small>${it.rate.toFixed(1)} · <span>${it.rev.toLocaleString(loc())}</span> <span>değerlendirme</span></small></div>
      <div class="vt-pr big"><b>${money(it.price)}</b>${it.was ? `<s>${money(it.was)}</s>` : ''}</div>
      <div class="vt-sw">${sib.map((x) => `<button class="${x.id === it.id ? 'on' : ''}" data-ml="item:${x.id}" type="button" style="background:${x.art.c}" aria-label="${esc(x.col)}"></button>`).join('')}<span>${esc(it.col)}</span></div>
      <div class="vt-ef"><span>Moral <b>+${ef.mor}</b></span>${ef.fame ? `<span>Ün <b>+${ef.fame}</b></span>` : '<span class="mut">Ün etkisi yok</span>'}<small>${it.seg === 'lux' ? 'Lüks markalar daha çok moral ve biraz ün verir.' : it.seg === 'prem' ? 'Premium ürünler biraz ün verir.' : 'Günlük kullanım: moral verir.'} Aynı hafta çok alışveriş yapınca etkisi azalır.</small></div>
      ${btn}
      <div class="vt-ship2"><span>${it.seg === 'lux' ? 'Butikten özel teslimat' : 'Ücretsiz kargo · yarın kapında'}</span></div>
      ${more.length ? row('Bu markadan', more) : ''}</div>`;
  }
  function ordersV() {
    const m = D(), cat = build();
    const own = Object.entries(m.own).map(([id, v]) => (v && typeof v === 'object' ? snap(id, v) : cat.find((x) => x.id === id))).filter(Boolean).reverse();
    const bySeg = Object.keys(SEG).map((k) => [k, own.filter((x) => x.seg === k).length]);
    return `<div class="vt-lh"><b>Dolabım</b><small><span>${Object.keys(m.own).length}</span> <span>ürün</span></small></div>
      <div class="vt-stats"><div><span>Toplam harcama</span><b>${money(m.spent)}</b></div>${bySeg.map(([k, n]) => `<div><span>${SEG[k].n}</span><b>${n}</b></div>`).join('')}</div>
      ${own.length ? grid(own) : '<p class="vt-empty">Henüz bir şey almadın. Fırsatlara göz at!</p>'}`;
  }
  // telefonun Arabalar ve Evim Emlak uygulamaları için listeler
  const SEGB = (k) => `<div class="vt-sort dark">${Object.entries(SEG).map(([s2, x]) => `<button class="seg ${st.bseg === s2 ? 'on' : ''}" data-ml="bseg:${s2}" type="button">${x.n}</button>`).join('')}</div>`;
  function buyBtnBig(it) {
    const p = Game.p, own = owns(it.id), conf = st.confirm === it.id;
    if (own) return `<span class="ph-buy ${it.t === 'car' ? 'red' : 'em'} own">${it.t === 'car' ? 'Garajında' : 'Senin'}</span>`;
    if (p.age < it.minAge) return `<span class="ph-buy lock"><span>${it.minAge}</span> <span>yaşında açılır</span></span>`;
    return `<button class="ph-buy ${it.t === 'car' ? 'red' : 'em'} ${conf ? 'conf' : ''}" data-ml="buy:${it.id}" type="button" ${p.money < it.price ? 'disabled' : ''}>${conf ? `<span>Onayla</span> · <span>${money(it.price)}</span>` : money(it.price)}</button>`;
  }
  function carsHtml() {
    const l = build().filter((x) => x.cat === 'auto' && (!st.bseg || x.seg === st.bseg)).sort((a, b) => a.price - b.price);
    const show = l.filter((x, i) => owns(x.id) || i % 3 === 0 || st.bseg).slice(0, st.bseg ? 60 : 24);
    return `<div class="ph-secl">Galeri</div>${SEGB()}${show.map((it) => `<div class="ph-car"><div class="stage"><img class="vt-car k-car" alt="" loading="lazy" src="${MallArt.url(it.art)}">${owns(it.id) ? '<span class="gar">GARAJINDA</span>' : it.tag === 'new' ? '<span class="gar new">YENİ</span>' : ''}</div><div class="inf"><h4><span>${esc(it.bn)}</span> <span>${esc(it.md)}</span></h4><small class="vt-cs"><span>${esc(it.tn)}</span> · <span>${esc(it.col)}</span></small>
      <div class="spec"><div><span>Azami hız</span><b>${it.spec.top} km/sa</b></div><div><span>0-100</span><b>${String(it.spec.acc).replace('.', ',')} sn</b></div><div><span>Motor gücü</span><b>${it.spec.hp} bg</b></div></div>
      <div class="row">${buyBtnBig(it)}</div></div></div>`).join('')}${!st.bseg ? '<p class="ph-note">Tüm modelleri görmek için bir kademe seç.</p>' : ''}`;
  }
  function homesHtml() {
    const l = build().filter((x) => x.cat === 'estate' && (!st.bseg || x.seg === st.bseg)).sort((a, b) => a.price - b.price);
    return `<div class="ph-secl">Yeni ilanlar</div>${SEGB()}${l.map((it) => `<div class="ph-listing"><div class="pic"><img class="vt-home" alt="" loading="lazy" src="${MallArt.url(it.art)}">${owns(it.id) ? '<span class="own3">Senin</span>' : ''}</div><div class="inf"><div class="row"><div><div class="pr3">${money(it.price)}</div><div class="tt"><span>${esc(it.tn)}</span> · <span>${esc(it.bn)}</span></div></div>${buyBtnBig(it)}</div><div class="mt"><span>${esc(it.spec.rooms)}</span> · <span>${it.spec.m2} m²</span> · <span>${esc(it.md)}</span></div></div></div>`).join('')}`;
  }
  // oturduğun ev: sahip olunan en pahalı ev (eski evler dahil)
  function homeOf() {
    const own = Object.entries(D().own).map(([id, v]) => (v && typeof v === 'object' ? Object.assign({ id }, v) : null)).filter((x) => x && x.t === 'house').sort((a, b) => b.price - a.price);
    return own[0] || null;
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
    if (k === 'bseg') { st.bseg = st.bseg === v ? null : v; st.confirm = null; return Phone.render(); }
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
    if (typeof Phone === 'undefined' || !Phone.el) return;
    if (Phone.app === 'cars' || Phone.app === 'emlak') { const a = Phone.el.querySelector('.ph-appv'); if (a) bindCards(a); return; }
    if (Phone.app !== 'shop') return;
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
  return { st, view, build, buy, byId, effect, fameFor, deals, carsHtml, homesHtml, homeOf, brands: BRANDS, types: TYPES, reset: () => { hist.length = 0; Object.assign(st, { pg: 'home', cat: null, seg: null, brand: null, q: '', id: null, confirm: null, bseg: null }); } };
})();
