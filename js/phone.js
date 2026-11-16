// 1.0.24: Oyuncunun akıllı telefonu (alt menüde Profil'in yanında).
// Telefondaki her işlem oyunun MEVCUT fonksiyonlarını çağırır (Life.act, Game.act, mağaza satın alma, Star/Premium ekranları);
// ayrı bir ekonomi ya da kopya mantık yoktur. Sohbet cevaplarının bir kısmı yalnız sohbettir, istatistik değiştirmez.
// Kayıt: p.phone = { wall, rep: { kişi: hafta }, seen: { kişi: hafta } } (eski kayıtlarda yoksa ilk açılışta eklenir).
(function () {
  if (typeof Game === 'undefined' || typeof UI === 'undefined') return;

  // ---------------- telefon modelleri: 1. kademe oyundaki "Akıllı Telefon", 2-3 yeni ürünler ----------------
  if (typeof ITEMS !== 'undefined' && !ITEMS.some((i) => i.id === 'phone_pro')) {
    ITEMS.push(
      { id: 'phone_pro', cat: 'style', art: 'phone', name: 'Orion Pro', price: 180000, minAge: 16, morale: 1, fame: 2, desc: 'Her hafta moral +1, Ün +2' },
      { id: 'phone_gold', cat: 'style', art: 'phone', name: 'Aurum Edition', price: 2500000, minAge: 18, morale: 2, fame: 4, desc: 'Her hafta moral +2, Ün +4' },
    );
  }
  const TIERS = [
    { n: 'Nokta A2', item: null, mp: 8, boost: 0.92, bat: 23, walls: [0, 1], frame: 't0' },
    { n: 'Akıllı Telefon', item: 'life3', mp: 24, boost: 1, bat: 64, walls: [0, 1, 2, 3], frame: 't1' },
    { n: 'Orion Pro', item: 'phone_pro', mp: 64, boost: 1.12, bat: 88, walls: [0, 1, 2, 3, 4], frame: 't2' },
    { n: 'Aurum Edition', item: 'phone_gold', mp: 108, boost: 1.25, bat: 100, walls: [0, 1, 2, 3, 4, 5], frame: 't3' },
  ];
  const WALLS = [
    { n: 'Gece', bg: 'radial-gradient(120% 70% at 50% 0%, #2a4a9c 0%, #0b1838 55%, #050a1c 100%)' },
    { n: 'Stat ışıkları', bg: 'radial-gradient(60% 30% at 20% 12%, rgba(255,240,200,.55), transparent 70%), radial-gradient(60% 30% at 80% 12%, rgba(255,240,200,.5), transparent 70%), linear-gradient(180deg, #0b1838 0%, #12306b 50%, #1f7a3a 72%, #145a2a 100%)' },
    { n: 'Çim', bg: 'repeating-linear-gradient(180deg, #2e8b43 0 48px, #2a7f3d 48px 96px)' },
    { n: 'Gün batımı', bg: 'linear-gradient(180deg, #ff8a5b 0%, #c2416b 42%, #3a1f5d 75%, #120b2a 100%)' },
    { n: 'Titan', bg: 'radial-gradient(90% 60% at 30% 20%, #6a7385, transparent 60%), linear-gradient(160deg, #23272f, #0d0f14)' },
    { n: 'Altın', bg: 'radial-gradient(70% 45% at 50% 22%, rgba(255,233,160,.9), rgba(217,165,32,.6) 45%, transparent 75%), linear-gradient(180deg, #3a2a05, #120c02)' },
  ];

  const Phone = {
    open: false, app: null, sub: null, el: null, month: null, day: null,
    p() { return Game.state && Game.state.player; },
    on() { const s = Game.state; return !!(s && s.player && s.mode !== 'wc'); },
    data() { const p = Phone.p(); if (!p.phone || typeof p.phone !== 'object') p.phone = {}; const d = p.phone; d.rep = d.rep || {}; d.seen = d.seen || {}; if (d.wall == null) d.wall = 0; return d; },
    week() { const s = Game.state; return `${s.season.year}-${s.season.round}`; },
    tier() { const p = Phone.p(); if (!p) return 0; let t = 0; TIERS.forEach((x, i) => { if (x.item && (p.items || []).includes(x.item)) t = i; }); return t; },
  };
  window.Phone = Phone;

  // StarFeed paylaşımları telefonun kamerasına göre biraz daha çok/az etkileşim alır (yumuşak etki)
  if (typeof Social !== 'undefined' && Social.post && !Social._phoneWrap) {
    const post0 = Social.post;
    Social.post = function (kind, text, boost, opts) {
      let b = boost == null ? 1 : boost;
      try { if (Game.state && Game.state.player) b *= TIERS[Phone.tier()].boost; } catch (e) { /* etkisiz */ }
      return post0.call(this, kind, text, b, opts);
    };
    Social._phoneWrap = true;
  }

  // ---------------- ikonlar ----------------
  const svg = (p, f = 'none', s = '#fff', w = 2) => `<svg viewBox="0 0 24 24" fill="${f}" stroke="${s}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const IC = {
    msg: '<svg viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M12 3C6.5 3 2 6.8 2 11.5c0 2.6 1.4 4.9 3.6 6.5L5 22l4.3-2.3c.9.2 1.8.3 2.7.3 5.5 0 10-3.8 10-8.5S17.5 3 12 3z"/></svg>',
    feed: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2l2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.1l-5.1 2.8L8 13.2 3.7 9.2l5.8-.7z" fill="#ffcf3f"/><path d="M19.5 3.5a9 9 0 012 3.3M4.5 3.5a9 9 0 00-2 3.3" stroke="#7fb2ff" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg>',
    wiki: svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>', 'none', '#202122', 1.6),
    bank: svg('<path d="M3 10l9-6 9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>'),
    agent: svg('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M3 13h18"/>', 'none', '#0a1530'),
    emlak: svg('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><circle cx="12" cy="14" r="2.2" fill="#fff"/><path d="M12 16.2V19"/>'),
    cars: svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5" fill="#fff"/><path d="M3.5 10.5c3-1.2 5.8-1.5 8.5-1.5s5.5.3 8.5 1.5M12 14.5V21"/>'),
    shop: svg('<path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 10V6a3 3 0 016 0v4"/>'),
    store: svg('<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>'),
    prem: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.4 5 5.5.7-4 3.8 1 5.4L12 15l-4.9 2.7 1-5.4-4-3.8 5.5-.7z" fill="#2a1c00"/><path d="M18.5 15.5v6M15.5 18.5h6" stroke="#2a1c00" stroke-width="2.2" stroke-linecap="round"/></svg>',
    set: svg('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>'),
    back: svg('<path d="M15 5l-7 7 7 7"/>', 'none', 'currentColor', 2.4),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>', 'none', 'currentColor', 2.2),
    lock: svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>', 'none', 'currentColor'),
    tab: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M10.5 18.5h3"/></svg>',
  };
  const calIcon = (d, wd) => `<svg viewBox="0 0 24 24" aria-hidden="true"><text x="12" y="8.2" text-anchor="middle" font-size="5" font-weight="700" font-family="Barlow Semi Condensed, sans-serif" fill="#e5383b">${wd}</text><text x="12" y="19.5" text-anchor="middle" font-size="11.5" font-weight="500" font-family="Barlow Semi Condensed, sans-serif" fill="#111">${d}</text></svg>`;
  const photosIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4" fill="#ffcf3f"/><circle cx="17" cy="12" r="4" fill="#ff6f8a" opacity=".9"/><circle cx="12" cy="17" r="4" fill="#7fb2ff" opacity=".9"/><circle cx="7" cy="12" r="4" fill="#46e08f" opacity=".9"/></svg>';

  // ---------------- tarih: sezon haftaları takvime dönüştürülür ----------------
  const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const WD = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const WDL = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  // lig haftası r: sezonun ikinci Ağustos cumartesisinden itibaren haftada bir
  const seasonStart = (y) => { const d = new Date(y, 7, 1); const add = (6 - d.getDay() + 7) % 7; d.setDate(1 + add + 7); return d; };
  const roundDate = (r) => { const d = seasonStart(Game.state.season.year); d.setDate(d.getDate() + 7 * r); return d; };
  const today = () => { const d = roundDate(Math.min(Game.state.season.round, Math.max(0, Game.rounds() - 1))); d.setDate(d.getDate() - 1); return d; };
  const mon = (d) => (d.getDay() + 6) % 7; // Pzt=0
  const key = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  function events() {
    const s = Game.state, out = {};
    const add = (d, e) => { (out[key(d)] = out[key(d)] || []).push(e); };
    if (Game.inStreet()) return out;
    const lg = Game.league();
    if (lg && lg.fixtures) {
      lg.fixtures.forEach((round, i) => {
        const f = round.find(([h, a]) => h === s.clubId || a === s.clubId);
        if (!f) return;
        const home = f[0] === s.clubId, opp = home ? f[1] : f[0];
        const r = (lg.results || []).find((x) => x.round === i && (x.h === s.clubId || x.a === s.clubId));
        let res = '';
        if (r) { const gf = r.h === s.clubId ? r.hs : r.as, ga = r.h === s.clubId ? r.as : r.hs; res = `${gf}-${ga}`; }
        add(roundDate(i), { k: 'match', h: '19:00', t: Game.teamName(opp), s: `${Game.leagueName()} · ${home ? 'İç saha' : 'Deplasman'}`, res, win: r ? (r.h === s.clubId ? r.hs - r.as : r.as - r.hs) : null });
        // hafta içi antrenmanlar
        [5, 4, 2].forEach((back) => { const d = roundDate(i); d.setDate(d.getDate() - back); add(d, { k: 'train', h: '10:00', t: 'Takım antrenmanı', s: Game.teamName() }); });
      });
    }
    try {
      Object.values(s.cups || {}).forEach((cup) => {
        if (!!cup.youth !== Game.isYouth() || !Cups.everIn(s, cup)) return;
        (Cups.weeks(Game.rounds(), cup) || []).forEach((w) => { const d = roundDate(w); d.setDate(d.getDate() - 3); add(d, { k: 'cup', h: '21:45', t: cup.name || 'Kupa', s: 'Kupa haftası' }); });
      });
    } catch (e) { /* kupa takvimi yok */ }
    // çocukların doğum günleri (1.0.24)
    const L = s.player.life;
    (L && L.kids || []).forEach((k) => { const w = ((k.by * 7) % 30) + 3; if (w < Game.rounds()) add(roundDate(w), { k: 'fam', h: '17:00', t: `${k.n} doğum günü`, s: 'Aile' }); });
    return out;
  }

  // ---------------- kişiler ve haftalık mesajlar ----------------
  const pick = (arr, salt) => { const s = Game.state; const i = (s.season.year * 7 + s.season.round * 3 + salt) % arr.length; return arr[i]; };
  function contacts() {
    const s = Game.state, p = s.player, L = Life.ensure(p), out = [];
    const gfName = L.gf ? L.gf.name : null;
    out.push({ id: 'mom', n: 'Annem', role: 'Aile', c: 'linear-gradient(135deg,#46e08f,#1f9d5c)', i: 'A',
      m: pick(['Oğlum maçı izledim, seninle gurur duyuyorum.', 'Yemek yiyor musun düzgün? Kendine iyi bak.', 'Pazar yemeğe gel, en sevdiğin yemeği yapıyorum.', 'Komşular hep seni soruyor, çok ünlü oldun!', 'Babanla seni konuşuyorduk, seni çok özledik.'], 1),
      r: [{ t: 'Bu akşam size geliyorum', act: () => Life.act('family'), ap: 1, ok: 'Oh çok sevindim! Hemen sofrayı kuruyorum.' }, { t: 'Ben de seni seviyorum anne', ok: 'Canım oğlum. Kendine dikkat et.' }] });
    out.push({ id: 'dad', n: 'Babam', role: 'Aile', c: 'linear-gradient(135deg,#34c4b0,#147a6c)', i: 'B',
      m: pick(['Dünkü maçta kanatta çok yalnız kaldın, dikkat et.', 'Antrenmanlarını aksatma, yetenek tek başına yetmez.', 'Eski maçlarını izledim, ne günlerdi!', 'Bir gün seni tribünden izlemeye geleceğim.', 'Mahalledekiler senin formanı giyiyor, haberin olsun.'], 2),
      r: [{ t: 'Hafta sonu beraber maç izleyelim', act: () => Life.act('family'), ap: 1, ok: 'Çekirdekler benden!' }, { t: 'Haklısın baba', ok: 'Aferin oğlum. Ben senin ilk hocanım, unutma.' }] });
    if (gfName) out.push({ id: 'gf', n: gfName, role: L.gf.married ? 'Eşin' : 'Sevgilin', c: 'linear-gradient(135deg,#ff6f8a,#c2416b)', i: gfName[0], heart: true,
      m: pick(['Bu akşam boş musun? Seni özledim.', 'Maçtaki sevincin çok tatlıydı.', 'Hafta sonu bir yerlere kaçalım mı?', 'Yeni bir restoran açılmış, gidelim mi?', 'Bugün aklım hep sendeydi.'], 3),
      r: [{ t: 'Bu akşam buluşalım', act: () => Life.act('date'), ap: 1, ok: 'Harika! Hazır olurum.' }, { t: 'Seni seviyorum', ok: 'Ben de seni seviyorum.' }] });
    if (!Game.inStreet()) out.push({ id: 'coach', n: 'Hoca', role: `Teknik direktör · ${Game.teamName()}`, c: 'linear-gradient(135deg,#9aa6c4,#4b5878)', i: 'H',
      m: pick(['Antrenmanda daha fazla çalışmanı istiyorum.', 'Bu hafta seni izliyorum, hazır ol.', 'Takım savunmasına daha çok yardım et.', 'Formun iyi, böyle devam.', 'Maçtan önce taktik toplantısını kaçırma.'], 4),
      r: [{ t: 'Ofisinize geleyim hocam, konuşalım', act: () => Game.act('talk'), ap: 1, ok: 'Gel bakalım, kapım açık.', once: () => !Game.state.week || !Game.state.week.coachTalk }, { t: 'Anlaşıldı hocam', ok: 'Güzel. Sahada görelim.' }] });
    if (!Game.inStreet()) out.push({ id: 'team', n: 'Takım Grubu', role: Game.teamName(), c: 'linear-gradient(135deg,#7fb2ff,#1e5bd8)', i: 'T',
      m: pick(['Akşam hep beraber yemeğe çıkıyoruz, geliyor musun?', 'Yarın antrenmandan önce kahve?', 'Maçtan sonra kutlama var!', 'Yeni gelen çocuğa hoş geldin diyelim.'], 5),
      r: [{ t: 'Geliyorum!', act: () => Game.act('team'), ap: 1, ok: 'Süper, masa ayırtıyoruz.' }, { t: 'Bu sefer pas, dinleneceğim', ok: 'Tamam, kendine iyi bak.' }] });
    if (L.manager) out.push({ id: 'agent', n: L.manager.name, role: 'Menajer', c: 'linear-gradient(135deg,#ffcf3f,#e08d0c)', i: L.manager.name[0],
      m: L.offers && L.offers.length ? `${L.offers.length} sponsor teklifi seni bekliyor. Menajer uygulamasına koydum.` : pick(['Transfer dönemi yaklaşıyor, kulaklarımız açık.', 'Bir marka seninle çalışmak istiyor olabilir, takipteyim.', 'Performansın değerini artırıyor, böyle devam.'], 6),
      r: [{ t: 'Teklifleri göster', open: 'agent', ok: 'Hepsini uygulamaya koydum.' }, { t: 'Teşekkürler, sen bilirsin', ok: 'Merak etme, işimi biliyorum.' }] });
    (Friends && Friends.on && Friends.on() ? Friends.list() : []).slice(0, 3).forEach((f, i) => out.push({ id: 'fr' + i, n: f.n, role: 'Arkadaşın', c: 'linear-gradient(135deg,#c792ff,#7b3fe4)', i: (f.n.trim()[0] || '?'),
      m: pick(['Kanka maçını izledim, efsaneydin!', 'Hafta sonu eski mahalle ekibiyle halı saha var, haberin olsun.', 'Ne zaman görüşüyoruz? Çok oldu!', 'İmzalı forma lazım, kuzenim deli hayranın.'], 7 + i),
      r: [{ t: 'Yakında buluşalım', ok: 'Söz mü? Bekliyorum!' }, { t: 'Sağ ol kanka', ok: 'Her zaman!' }] }));
    (L.kids || []).forEach((k, i) => {
      const a = Math.max(0, s.season.year - k.by);
      if (a < 7 || typeof Life.kidActs !== 'function') return;
      const acts = Life.kidActs(a); const ak = acts && acts[0];
      out.push({ id: 'kid' + i, n: k.n, role: `${a} yaş`, c: 'linear-gradient(135deg,#ffb36b,#e0672b)', i: k.n[0],
        m: pick(a >= 18 ? ['Baba bu hafta yemeğe gelebilir miyim?', 'İşte her şey yolunda, merak etme.'] : ['Baba bugün top oynayalım mı?', 'Okulda herkes senin maçını konuştu!', 'Bana yeni krampon alır mısın?'], 11 + i),
        r: ak ? [{ t: ak[1], act: () => Life.kidAct(i, ak[0]), ap: 1, ok: 'Yaşasın!' }, { t: 'Seni seviyorum', ok: 'Ben de seni!' }] : [{ t: 'Seni seviyorum', ok: 'Ben de seni!' }] });
    });
    return out;
  }
  function unread() {
    if (!Phone.on()) return 0;
    const d = Phone.data(), w = Phone.week();
    let n = 0;
    try { contacts().forEach((c) => { if (d.seen[c.id] !== w) n++; }); } catch (e) { return 0; }
    return n;
  }

  // ---------------- çizimler ----------------
  function houseSvg(kind) {
    const sky = { flat: ['#9ec9ff', '#e8f3ff'], penthouse: ['#0d1b3d', '#36507f'], villa: ['#ffb36b', '#ffe3b5'], island: ['#5ec8ff', '#d6f3ff'] }[kind] || ['#9ec9ff', '#e8f3ff'];
    const win = (x, y, w, h, n, m, lit) => { let s = ''; for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) s += `<rect x="${x + i * (w + 6)}" y="${y + j * (h + 8)}" width="${w}" height="${h}" rx="1.5" fill="${lit && (i + j) % 3 ? '#ffd76a' : '#bcd7f0'}"/>`; return s; };
    const B = {
      flat: `<rect x="0" y="150" width="320" height="50" fill="#9aa5b1"/><rect x="40" y="40" width="110" height="120" fill="#e9e1d4"/><rect x="160" y="70" width="120" height="90" fill="#d9cdb9"/>${win(52, 52, 16, 14, 4, 4)}${win(172, 82, 18, 14, 4, 3)}<rect x="88" y="132" width="16" height="28" fill="#7a5a3a"/>`,
      penthouse: `${Array.from({ length: 30 }, (_, i) => `<circle cx="${(i * 73) % 320}" cy="${(i * 37) % 90}" r="${i % 3 ? 0.8 : 1.3}" fill="#fff" opacity=".8"/>`).join('')}<rect x="10" y="120" width="50" height="80" fill="#1b2a4a"/>${win(16, 128, 8, 8, 3, 6, 1)}<rect x="250" y="100" width="60" height="100" fill="#1b2a4a"/>${win(256, 108, 9, 8, 4, 8, 1)}<rect x="110" y="40" width="100" height="160" fill="#22355e"/>${win(118, 80, 12, 10, 6, 7, 1)}<rect x="104" y="34" width="112" height="34" rx="2" fill="#ffd76a" opacity=".95"/><rect x="116" y="42" width="88" height="18" fill="#fff3c4" opacity=".7"/>`,
      villa: `<circle cx="250" cy="70" r="26" fill="#ffd27a" opacity=".9"/><rect x="0" y="120" width="320" height="30" fill="#2f78c4"/><rect x="0" y="146" width="320" height="54" fill="#e9dcc3"/><rect x="40" y="88" width="200" height="62" fill="#fbf8f2"/><rect x="40" y="80" width="200" height="10" fill="#d8d0c2"/><rect x="120" y="58" width="120" height="30" fill="#f4efe6"/><rect x="50" y="98" width="70" height="40" fill="#7fc7f2" opacity=".85"/><rect x="132" y="98" width="96" height="40" fill="#7fc7f2" opacity=".85"/><rect x="60" y="160" width="170" height="26" rx="4" fill="#35b7e6"/><rect x="262" y="96" width="5" height="54" fill="#6b4a2b"/><path d="M264 98c-16-10-28-4-34 2M264 98c14-12 28-8 34-2M264 98c-4-14-16-20-24-18M264 98c6-14 18-18 26-14" stroke="#2f8c45" stroke-width="5" fill="none" stroke-linecap="round"/>`,
      island: `<rect x="0" y="110" width="320" height="90" fill="#1fa2d6"/><path d="M0 130 Q160 115 320 132 V200 H0z" fill="#1891c4"/><ellipse cx="160" cy="140" rx="120" ry="26" fill="#f0dca8"/><ellipse cx="160" cy="132" rx="95" ry="20" fill="#5cb85c"/><rect x="128" y="104" width="70" height="28" fill="#fbf8f2"/><rect x="134" y="110" width="58" height="14" fill="#7fc7f2"/><rect x="80" y="96" width="4" height="40" fill="#6b4a2b"/><path d="M82 98c-12-8-22-3-26 2M82 98c10-10 22-7 26-2M82 98c-2-12-12-16-18-14" stroke="#2f8c45" stroke-width="4" fill="none" stroke-linecap="round"/>`,
    }[kind] || '';
    return `<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="phsk${kind}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient></defs><rect width="320" height="200" fill="url(#phsk${kind})"/>${B}</svg>`;
  }
  const HOUSE_KIND = { penthouse: 'penthouse', life5: 'villa', island: 'island' };
  const CAR_KIND = { hatch: 'hatch', suv: 'suv', life4: 'sport', classic: 'classic' };
  const CAR_COL = { hatch: '#e8e8ec', suv: '#2b2f3a', sport: '#ffcf3f', classic: '#9b1c1c' };
  // araç özellikleri: [hız, 0-100 (sn), güç, birim] — birimler çevrilebilir kalıplarla yazılır
  const CAR_SPEC = { hatch: [185, '9,8', 110, 'bg'], suv: [250, '5,4', 420, 'bg'], life4: [330, '2,9', 720, 'bg'], classic: [240, '6,2', 350, 'bg'], moto: [245, '3,1', 160, 'bg'], scooter: [25, '', 1, 'kW'], ebike: [25, '', 250, 'W'], life6: [0, '', 3600, 'bg', 38], jet: [950, '', 12, 'kişi'] };
  const specTxt = (id) => { const x = CAR_SPEC[id]; if (!x) return ['—', '—', '—']; const pw = x[3] === 'bg' ? `${x[2]} bg` : x[3] === 'kişi' ? `${x[2]} kişi` : `${x[2]} ${x[3]}`; return [x[4] ? `${x[4]} knot` : `${x[0]} km/sa`, x[1] ? `${x[1]} sn` : '—', pw]; };
  function carSvg(kind, col) {
    const wheel = (x) => `<circle cx="${x}" cy="128" r="20" fill="#111"/><circle cx="${x}" cy="128" r="11" fill="#9aa0ab"/><circle cx="${x}" cy="128" r="3" fill="#333"/>`;
    const glass = '#9fc8e8';
    const sh = {
      hatch: `<path d="M30 124 L38 92 Q46 76 70 74 L150 72 Q176 72 196 92 L232 100 Q262 104 266 118 L268 124 Z" fill="${col}"/><path d="M78 80 L144 78 Q164 79 180 94 L74 96 Z" fill="${glass}"/><path d="M122 79v17" stroke="${col}" stroke-width="4"/>${wheel(78)}${wheel(222)}`,
      suv: `<path d="M24 124 L26 92 Q30 70 56 66 L170 64 Q196 66 214 86 L250 92 Q274 96 276 114 L276 124 Z" fill="${col}"/><path d="M60 72 L168 70 Q186 72 200 88 L58 90 Z" fill="${glass}"/><path d="M112 71v19M156 71v19" stroke="${col}" stroke-width="4"/>${wheel(74)}${wheel(226)}`,
      sport: `<path d="M18 124 Q20 106 46 100 L96 92 Q130 70 170 72 Q206 76 234 94 L276 104 Q294 108 296 120 L296 124 Z" fill="${col}"/><path d="M104 92 Q134 76 168 78 Q196 80 214 94 Z" fill="#1d2433" opacity=".85"/>${wheel(72)}${wheel(242)}`,
      classic: `<path d="M20 124 Q18 104 40 100 L70 98 Q90 72 130 70 L178 70 Q206 72 222 96 L262 100 Q286 104 284 124 Z" fill="${col}"/><path d="M98 98 Q108 78 132 76 L176 76 Q196 78 208 98 Z" fill="${glass}"/><path d="M152 77v21" stroke="${col}" stroke-width="4"/><path d="M20 120h264" stroke="#d9d9d9" stroke-width="4"/>${wheel(70)}${wheel(232)}`,
    };
    return `<svg viewBox="0 0 310 160" aria-hidden="true"><ellipse cx="155" cy="148" rx="140" ry="9" fill="rgba(0,0,0,.45)"/>${sh[kind] || ''}</svg>`;
  }
  const itemArt = (it) => (typeof ShopArt !== 'undefined' ? ShopArt.svg(it.art, ShopArt.tierColor(it.price)) : '');

  // ---------------- ortak parçalar ----------------
  const esc = (s) => U.esc(String(s));
  const money = (n) => U.money(n);
  const owns = (id) => (Phone.p().items || []).includes(id);
  const visible = (it) => owns(it.id) || (Phone.p().age >= it.minAge && (!it.maxAge || Phone.p().age <= it.maxAge));
  const buyBtn = (it, cls = 'ph-buy') => (owns(it.id) ? `<span class="${cls} own">Sende</span>` : Phone.p().age < it.minAge ? `<span class="${cls} lock">${it.minAge} yaşında açılır</span>` : `<button class="${cls}" data-buy="${it.id}" ${Phone.p().money < it.price ? 'disabled' : ''}>${money(it.price)}</button>`);
  const top = (title, cls = '', right = '') => `<div class="ph-top ${cls}"><button class="ph-back" data-ph-back type="button">${IC.back}<span>${Phone.sub ? 'Geri' : 'Ana ekran'}</span></button><h2>${title}</h2>${right}</div>`;
  const statusBar = (dark) => {
    const t = TIERS[Phone.tier()], nw = new Date();
    return `<div class="ph-status ${dark ? 'dark' : ''}"><span>${String(nw.getHours()).padStart(2, '0')}:${String(nw.getMinutes()).padStart(2, '0')}</span><span class="ph-sico"><svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor" aria-hidden="true"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="4.5" y="5" width="3" height="6" rx="1"/><rect x="9" y="2.5" width="3" height="8.5" rx="1"/><rect x="13.5" y="0" width="3" height="11" rx="1" opacity="${Phone.tier() ? 1 : 0.35}"/></svg><span>${Phone.tier() >= 2 ? '5G' : '4G'}</span><span class="ph-batt ${t.bat < 30 ? 'low' : ''}"><i style="width:${t.bat}%"></i></span></span></div>`;
  };

  // ---------------- ekranlar ----------------
  const APPS = [
    { k: 'wiki', n: 'Starpedia', bg: '#ffffff' },
    { k: 'agent', n: 'Menajer', bg: 'linear-gradient(135deg,#ffd76a,#e0a10e)' },
    { k: 'emlak', n: 'Evim Emlak', bg: 'linear-gradient(135deg,#14a08d,#0b5e53)' },
    { k: 'cars', n: 'Arabalar', bg: 'linear-gradient(135deg,#2a2a31,#0d0d10)' },
    { k: 'shop', n: 'alışveriş', bg: 'linear-gradient(135deg,#a855f7,#6d28d9)' },
    { k: 'store', n: 'TeknoPazar', bg: 'linear-gradient(135deg,#ff7a45,#e0283e)' },
    { k: 'prem', n: 'StarFoot+', bg: 'linear-gradient(140deg,#fff1b8,#ffcf3f 45%,#c98a06)' },
    { k: 'set', n: 'Ayarlar', bg: 'linear-gradient(135deg,#8a93a6,#4b5363)' },
  ];
  const DOCK = [
    { k: 'msg', n: 'Mesajlar', bg: 'linear-gradient(135deg,#5ee27a,#1fa646)' },
    { k: 'feed', n: 'StarFeed', bg: 'linear-gradient(150deg,#16306f,#0a1530)' },
    { k: 'cal', n: 'Takvim', bg: '#ffffff' },
    { k: 'bank', n: 'Banka', bg: 'linear-gradient(135deg,#1f4fbf,#0e2a6b)' },
  ];
  function appIcon(a) {
    const L = Phone.p().life || {};
    const badge = a.k === 'msg' ? unread() : a.k === 'agent' ? (L.offers || []).length : 0;
    const td = today();
    const ic = a.k === 'cal' ? calIcon(td.getDate(), WD[mon(td)].toUpperCase()) : IC[a.k];
    return `<button class="ph-app" data-ph-open="${a.k}" type="button" aria-label="${a.n}"><span class="ph-ic" style="background:${a.bg}">${ic}${badge ? `<span class="ph-badge">${badge}</span>` : ''}</span><span class="ph-an">${a.n}</span></button>`;
  }
  function homeView() {
    const s = Game.state, p = s.player;
    const nf = Game.nextFixture ? Game.nextFixture() : null;
    let next = '<span class="ph-big">Mahalle maçı</span><small>Scout izliyor olabilir</small>';
    if (nf) { const home = nf.home === s.clubId, opp = home ? nf.away : nf.home; next = `<span class="ph-big">${esc(Game.teamName(opp))}</span><small>${esc(Game.leagueName())} · ${home ? 'İç saha' : 'Deplasman'}</small>`; }
    const bar = (l, v, c) => `<div><span>${l}</span><div class="ph-bar"><i style="width:${U.clamp(v, 0, 100)}%;background:${c}"></i></div></div>`;
    return `<div class="ph-home">
      <div class="ph-wgs">
        <button class="ph-wg" data-ph-open="cal" type="button"><span class="ph-lbl">Sıradaki maç</span>${next}<small class="ph-wk">${s.season.year} · ${Math.min(s.season.round + 1, Game.rounds())}. hafta</small></button>
        <div class="ph-wg"><span class="ph-lbl">Durum</span><div class="ph-mini">${bar('Aile', p.rel.family, '#46e08f')}${bar('Hoca', p.rel.coach, '#9aa6c4')}${bar('Moral', p.morale, '#ffcf3f')}${bar('Enerji', p.energy, '#7fb2ff')}</div><small class="ph-wk">${s.ap} aksiyon hakkı</small></div>
      </div>
      <div class="ph-apps">${APPS.map(appIcon).join('')}</div>
      <div class="ph-dock">${DOCK.map(appIcon).join('')}</div>
    </div>`;
  }
  function msgList() {
    const d = Phone.data(), w = Phone.week();
    return `<div class="ph-appv">${top('Mesajlar')}<div class="ph-body">${contacts().map((c) => `<button class="ph-thr" data-ph-th="${c.id}" type="button"><span class="ph-av" style="background:${c.c}">${esc(c.i)}</span><span class="ph-thr-t"><b><span>${d.seen[c.id] !== w ? '<i class="ph-dot"></i>' : ''}${esc(c.n)}</span><small>${d.seen[c.id] !== w ? 'yeni' : d.rep[c.id] === w ? 'cevaplandı' : 'okundu'}</small></b><em>${esc(c.role)}</em><p>${esc(d.rep[c.id] === w ? d.last && d.last[c.id] || c.m : c.m)}</p></span></button>`).join('')}</div></div>`;
  }
  function chatView(id) {
    const c = contacts().find((x) => x.id === id);
    if (!c) { Phone.sub = null; return msgList(); }
    const d = Phone.data(), w = Phone.week();
    d.seen[id] = w;
    const replied = d.rep[id] === w, my = d.my && d.my[id], back = d.last && d.last[id];
    const ap = Game.state.ap;
    return `<div class="ph-appv">${top(`<span class="ph-ct"><span class="ph-av sm" style="background:${c.c}">${esc(c.i)}</span><span><span class="ph-ctn">${esc(c.n)}</span><small>${esc(c.role)}</small></span></span>`)}
      <div class="ph-body" id="ph-chat"><div class="ph-chat" data-emo><div class="ph-day">Bu hafta</div><div class="ph-bub in">${esc(c.m)}</div>${replied && my ? `<div class="ph-bub out">${esc(my)}</div>` : ''}${replied && back ? `<div class="ph-bub in">${esc(back)}</div>` : ''}</div></div>
      ${replied ? '<div class="ph-replies"><span class="ph-lbl2">Gelecek hafta yeni mesajlar gelir.</span></div>' : `<div class="ph-replies"><span class="ph-lbl2">Cevabın</span>${c.r.map((r, i) => { const dis = (r.ap && ap < r.ap) || (r.once && !r.once()); return `<button class="ph-rep" data-ph-rep="${i}" type="button" ${dis ? 'disabled' : ''}><span>${esc(r.t)}</span>${r.ap ? `<em>${r.ap} aksiyon</em>` : r.open ? '<em>uygulamayı aç</em>' : ''}</button>`; }).join('')}</div>`}
    </div>`;
  }
  function feedView() {
    return `<div class="ph-appv ph-feed">${top('StarFeed')}<div class="ph-body">${Social.render(true)}</div></div>`;
  }
  function wikiView() {
    const p = Phone.p();
    return `<div class="ph-appv ph-wiki">${top('Starpedia')}<div class="ph-body">
      <div class="ph-wk-card"><div class="ph-wk-logo">STARPEDIA</div><small>Özgür futbol ansiklopedisi</small>
      <div class="ph-wk-search">${IC.search}<span>${esc(Player.fullName(p))}</span></div>
      <button class="ph-cta" data-star="wiki" type="button">Sayfanı aç</button></div>
      <p class="ph-note">Ansiklopedi sayfan kariyerin ilerledikçe kendiliğinden güncellenir.</p>
    </div></div>`;
  }
  function bankView() {
    const p = Phone.p(), inc = Game.weeklyIncome(), sp = Life.sponsorIncome(p), cut = Life.managerCut(p);
    const assets = (p.items || []).map((id) => ITEMS.find((i) => i.id === id)).filter((it) => it && ['style', 'ride'].includes(it.cat) && it.price >= 20000).sort((a, b) => b.price - a.price);
    const worth = assets.reduce((t, x) => t + x.price, 0);
    return `<div class="ph-appv ph-bank">${top('Banka')}<div class="ph-body">
      <div class="ph-bal"><span>Vadesiz hesap</span><b>${money(p.money)}</b><small>${esc(Player.fullName(p))}</small></div>
      <div class="ph-inc"><div><span>Haftalık maaş</span><b class="pos">${money(inc)}</b></div><div><span>Sponsor geliri</span><b class="pos">${money(sp)}</b></div><div><span>Menajer payı</span><b class="${cut ? 'neg' : ''}">${cut ? '-' + money(cut) : '—'}</b></div><div><span>Haftalık net</span><b class="pos">${money(inc + sp - cut)}</b></div></div>
      <div class="ph-secl">Varlıkların</div>
      ${assets.length ? assets.map((it) => `<div class="ph-tx"><span class="ph-ti">${itemArt(it)}</span><span>${esc(it.name)}<small>${esc(it.desc)}</small></span><b>${money(it.price)}</b></div>`).join('') + `<div class="ph-tx tot"><span></span><span>Toplam değer</span><b>${money(worth)}</b></div>` : '<p class="ph-note">Henüz ev, araba ya da lüks bir eşyan yok. Evim Emlak ve Arabalar uygulamalarına göz at.</p>'}
    </div></div>`;
  }
  function calView() {
    const td = today();
    if (!Phone.month) Phone.month = new Date(td.getFullYear(), td.getMonth(), 1);
    const m = Phone.month, ev = events();
    const sel = Phone.day || key(td);
    const first = mon(new Date(m.getFullYear(), m.getMonth(), 1)), days = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    let cells = '';
    for (let i = 0; i < first; i++) cells += '<span class="ph-blank"></span>';
    const col = { match: '#e5383b', cup: '#f59e0b', train: '#2f6ee8', fam: '#22a55a' };
    for (let dd = 1; dd <= days; dd++) {
      const d = new Date(m.getFullYear(), m.getMonth(), dd), k = key(d), es = ev[k] || [];
      const kinds = [...new Set(es.map((e) => e.k))].slice(0, 3);
      cells += `<button class="${mon(d) >= 5 ? 'we' : ''} ${k === key(td) ? 'today' : ''} ${k === sel ? 'sel' : ''}" data-ph-day="${k}" type="button"><span class="n">${dd}</span><span class="dots">${kinds.map((x) => `<i style="background:${col[x]}"></i>`).join('')}</span></button>`;
    }
    const [sy, sm, sd] = sel.split('-').map(Number), sdate = new Date(sy, sm, sd);
    const list = (ev[sel] || []).slice().sort((a, b) => a.h.localeCompare(b.h));
    const tint = { match: ['#fde8e8', '#8f1d1f', '#e5383b'], cup: ['#fef3e2', '#8a5a07', '#f59e0b'], train: ['#e6efff', '#1b3f8f', '#2f6ee8'], fam: ['#e4f7ec', '#14653a', '#22a55a'] };
    return `<div class="ph-appv ph-cal">${top('Takvim')}<div class="ph-body">
      <div class="ph-mhead"><h3><span class="mn">${MONTHS[m.getMonth()]}</span> <span>${m.getFullYear()}</span></h3><div class="ph-mnav"><button type="button" data-ph-mon="-1" aria-label="Önceki ay">‹</button><button type="button" data-ph-mon="0">Bugün</button><button type="button" data-ph-mon="1" aria-label="Sonraki ay">›</button></div></div>
      <div class="ph-wkd">${WD.map((x) => `<span>${x}</span>`).join('')}</div>
      <div class="ph-mgrid">${cells}</div>
      <div class="ph-agenda"><h4><span>${sdate.getDate()}</span> <span>${MONTHS[sdate.getMonth()]}</span> <span>${WDL[mon(sdate)]}</span>${sel === key(td) ? ' · <span>Bugün</span>' : ''}</h4>
        ${list.length ? list.map((e) => `<div class="ph-ag"><span class="tm">${e.h}</span><div class="bx" style="background:${tint[e.k][0]};color:${tint[e.k][1]};border-left:4px solid ${tint[e.k][2]}">${e.k === 'match' ? `${esc(e.t)}${e.res ? ` <b class="${e.win > 0 ? 'w' : e.win < 0 ? 'l' : 'd'}">${e.res}</b>` : ''}` : esc(e.t)}<small>${esc(e.s)}</small></div></div>`).join('') : '<div class="ph-noev">Etkinlik yok. Dinlenme günü.</div>'}
      </div>
    </div></div>`;
  }
  // Menajer ve sponsor kartları: Yaşam ekranındaki kartların aynısı (aynı düğmeler, aynı işlemler)
  function lifeSections() {
    const html = Phone._life0 ? Phone._life0() : '';
    const grab = (marker) => {
      const i = html.indexOf(marker); if (i < 0) return '';
      const a = html.lastIndexOf('<section', i), b = html.indexOf('</section>', i);
      return a >= 0 && b > i ? html.slice(a, b + 10) : '';
    };
    return { mgr: grab(Icon('contract') + ' Menajer'), sp: grab(Icon('coin') + ' Sponsorluklar') };
  }
  function agentView() {
    const p = Phone.p(), sec = lifeSections();
    const body = p.age < 16 || Game.inStreet() ? '<p class="ph-note">Menajer ve sponsorluklar 16 yaşından sonra açılır.</p>' : (sec.mgr + sec.sp) || '<p class="ph-note">Henüz bir menajerin yok.</p>';
    return `<div class="ph-appv ph-agent">${top('Menajer')}<div class="ph-body">${body}</div></div>`;
  }
  function emlakView() {
    const list = ITEMS.filter((it) => HOUSE_KIND[it.id] && (owns(it.id) || Phone.p().age + 6 >= it.minAge)).sort((a, b) => a.price - b.price);
    const live = list.filter((it) => owns(it.id)).sort((a, b) => b.price - a.price)[0];
    return `<div class="ph-appv ph-emlak">${top('Evim Emlak')}<div class="ph-body">
      <div class="ph-search">${IC.search}<span>Satılık evler</span></div>
      <div class="ph-listing cur"><div class="pic">${houseSvg('flat')}${live ? '' : '<span class="own3">Şu an yaşadığın</span>'}</div><div class="inf"><div class="pr3">${live ? 'Eski evin' : 'Kiradasın'}</div><div class="tt">Kiralık daire</div><div class="mt">2+1 · 95 m² · Şehir merkezi</div></div></div>
      ${list.map((it) => `<div class="ph-listing"><div class="pic">${houseSvg(HOUSE_KIND[it.id])}${live === it ? '<span class="own3">Burada yaşıyorsun</span>' : owns(it.id) ? '<span class="own3">Senin</span>' : ''}</div><div class="inf"><div class="row"><div><div class="pr3">${money(it.price)}</div><div class="tt">${esc(it.name)}</div></div>${buyBtn(it, 'ph-buy em')}</div><div class="fx3">${esc(it.desc)}</div></div></div>`).join('')}
    </div></div>`;
  }
  function carsView() {
    const list = ITEMS.filter((it) => it.cat === 'ride' && visible(it)).sort((a, b) => a.price - b.price);
    const locked = ITEMS.filter((it) => it.cat === 'ride' && !visible(it)).sort((a, b) => a.minAge - b.minAge).slice(0, 2);
    const card = (it) => { const k = CAR_KIND[it.id], sp = specTxt(it.id); return `<div class="ph-car"><div class="stage">${k ? carSvg(k, CAR_COL[k]) : `<span class="art">${itemArt(it)}</span>`}${owns(it.id) ? '<span class="gar">GARAJINDA</span>' : ''}</div><div class="inf"><h4>${esc(it.name)}</h4>
        <div class="spec"><div><span>Azami hız</span><b>${sp[0]}</b></div><div><span>0-100</span><b>${sp[1]}</b></div><div><span>Motor gücü</span><b>${sp[2]}</b></div></div>
        <div class="ds">${esc(it.desc)}</div><div class="row">${buyBtn(it, 'ph-buy red')}</div></div></div>`; };
    return `<div class="ph-appv ph-cars">${top('<span class="r">Arabalar</span>')}<div class="ph-body">${list.map(card).join('')}${locked.map(card).join('')}${!list.length && !locked.length ? '<p class="ph-note">Şu an satışta araç yok.</p>' : ''}<p class="ph-note">Araba ve motor için ehliyet gerekir.</p></div></div>`;
  }
  function shopView() {
    return `<div class="ph-appv ph-shop">${top('alışveriş')}<div class="ph-body"><div class="ph-promo"><b>Yıldız indirimi</b><small>Çanta, bakım, ekipman ve yaşam tarzı ürünleri</small></div>${UI.shop()}</div></div>`;
  }
  function storeView() {
    const t = Phone.tier(), p = Phone.p();
    return `<div class="ph-appv ph-store">${top('TeknoPazar')}<div class="ph-body">
      <div class="ph-sbal"><span>Bakiyen</span><b>${money(p.money)}</b></div>
      ${TIERS.map((x, i) => { const it = x.item && ITEMS.find((q) => q.id === x.item); return `<div class="ph-pr ${t === i ? 'cur' : ''}"><div class="ph-mini-ph f${i}"><i style="background:${WALLS[x.walls[x.walls.length - 1]].bg}"></i></div><div class="inf"><h4>${esc(it ? it.name : x.n)}</h4>
        <ul><li>${x.mp} MP kamera</li><li>${x.walls.length} duvar kâğıdı</li>${it ? `<li>${esc(it.desc)}</li>` : '<li>İlk telefonun</li>'}</ul>
        <div class="row">${t === i ? '<span class="ph-buy own">Kullanılıyor</span>' : it ? (owns(it.id) ? '<span class="ph-buy own">Sende</span>' : buyBtn(it, 'ph-buy blue')) : '<span class="ph-buy own">Sende</span>'}</div></div></div>`; }).join('')}
      <p class="ph-note">En iyi telefonun kullanılır. İyi kamera, StarFeed paylaşımlarında biraz daha fazla etkileşim getirir.</p>
    </div></div>`;
  }
  function premView() {
    const avail = typeof Premium !== 'undefined' && Premium.available && Premium.available();
    const rows = [
      ['premium', 'Premium', 'Reklamsız oyun ve yıldız ayrıcalıkları', typeof Star !== 'undefined' && Star.has()],
      ['plus', 'Premium+', 'Premium dahil her şey: tüm modlar ve ek ayrıcalıklar', typeof Plus !== 'undefined' && Plus.has()],
      ['diamond', 'Diamond', 'Altın görünümler, senaryolar, erken erişim', typeof Diamond !== 'undefined' && Diamond.active],
      ['coach', 'Teknik Direktör', 'Takımın başına geç', typeof Packs !== 'undefined' && Packs.owns('coach')],
      ['wc', 'Dünya Şampiyonası Rüyası', 'Milli takımınla tek bir turnuva', typeof Packs !== 'undefined' && Packs.owns('wc')],
      ['legends', 'Efsanelerin İzinde', '6 efsane kariyeri', typeof Packs !== 'undefined' && Packs.owns('legends')],
    ];
    return `<div class="ph-appv ph-prem">${top('')}<div class="ph-body">
      <div class="ph-phero"><div class="logo2">${IC.prem}</div><h3>STARFOOT<span>+</span></h3><p>Satın alımların ve paketler</p></div>
      <div class="ph-plans">${rows.map(([k, n, d, own]) => `<button class="ph-plan ${own ? 'own' : ''}" data-ph-prem="${k}" type="button"><b>${n}</b><small>${d}</small><span class="st">${own ? '✓ Sende' : 'İncele'}</span></button>`).join('')}</div>
      ${avail ? '<button class="ph-restore" data-ph-restore type="button">Satın alımları geri yükle</button>' : '<p class="ph-note">Satın alımlar App Store ve Google Play sürümünde yapılır.</p>'}
    </div></div>`;
  }
  function setView() {
    const t = TIERS[Phone.tier()], d = Phone.data();
    return `<div class="ph-appv">${top('Ayarlar')}<div class="ph-body">
      <div class="ph-secl">Duvar kâğıdı</div>
      <div class="ph-walls">${WALLS.map((w, i) => { const ok = t.walls.includes(i); return `<button class="${d.wall === i ? 'on' : ''}" data-ph-wall="${i}" type="button" ${ok ? '' : 'disabled'} style="background:${w.bg}"><span>${ok ? w.n : w.n}</span>${ok ? '' : `<i>${IC.lock}</i>`}</button>`; }).join('')}</div>
      <div class="ph-secl">Cihaz</div>
      <div class="ph-row">Model<span>${esc(TIERS[Phone.tier()].item ? ITEMS.find((q) => q.id === t.item).name : t.n)}</span></div><div class="ph-row">Kamera<span>${t.mp} MP</span></div><div class="ph-row">Pil<span>%${t.bat}</span></div>
      <button class="ph-cta ghost" data-ph-settings type="button">Oyun ayarları</button>
      <button class="ph-cta ghost" data-ph-close type="button">Telefonu kapat</button>
    </div></div>`;
  }
  const VIEWS = { feed: feedView, wiki: wikiView, bank: bankView, cal: calView, agent: agentView, emlak: emlakView, cars: carsView, shop: shopView, store: storeView, prem: premView, set: setView };
  const LIGHT = ['wiki', 'cal', 'store', 'shop'];

  // ---------------- çizim ve olaylar ----------------
  Phone.render = function () {
    if (!Phone.open || !Phone.el) return;
    if (!Phone.on()) return Phone.close();
    const d = Phone.data(), t = TIERS[Phone.tier()];
    if (!t.walls.includes(d.wall)) d.wall = t.walls[t.walls.length - 1];
    const scr = Phone.el.querySelector('.ph-screen');
    const prev = scr.querySelector('.ph-body');
    const keep = prev ? prev.scrollTop : 0, same = Phone._last === `${Phone.app}|${Phone.sub}`;
    Phone.el.querySelector('.ph-dev').className = `ph-dev ${t.frame}`;
    scr.querySelector('.ph-wall').style.background = WALLS[d.wall].bg;
    let html = '';
    try {
      if (!Phone.app) html = homeView();
      else if (Phone.app === 'msg') html = Phone.sub ? chatView(Phone.sub) : msgList();
      else html = (VIEWS[Phone.app] || homeView)();
    } catch (e) { console.error(e); Phone.app = null; Phone.sub = null; html = homeView(); }
    const v = scr.querySelector('.ph-view');
    v.innerHTML = statusBar(LIGHT.includes(Phone.app)) + html;
    Phone._last = `${Phone.app}|${Phone.sub}`;
    const body = v.querySelector('.ph-body');
    if (body) { if (same) { body.scrollTop = keep; v.querySelector('.ph-appv').classList.add('still'); } else if (Phone.app === 'msg' && Phone.sub) body.scrollTop = body.scrollHeight; }
    Phone.el.querySelector('.ph-homebar').classList.toggle('dark', LIGHT.includes(Phone.app));
    try { UI.strip(v); } catch (e) { /* yok */ }
    // oyunun kendi bağlayıcıları: satın alma, menajer/sponsor, StarFeed gönderileri, mağaza sekmeleri
    try { UI.bind(v); } catch (e) { console.error(e); }
    try { if (Phone.app === 'feed' || Phone.app === 'shop') Social.drawAvatar(v); } catch (e) { /* yok */ }
    bind(v);
    Phone.badge();
  };
  function bind(v) {
    const on = (sel, fn) => v.querySelectorAll(sel).forEach((b) => (b.onclick = (e) => fn(b, e)));
    on('[data-ph-open]', (b) => { Phone.app = b.dataset.phOpen; Phone.sub = null; Phone.day = null; Phone.month = null; Phone.render(); });
    on('[data-ph-back]', () => { if (Phone.sub) Phone.sub = null; else Phone.app = null; Phone.render(); });
    on('[data-ph-th]', (b) => { Phone.sub = b.dataset.phTh; Phone.render(); });
    on('[data-ph-rep]', (b) => reply(+b.dataset.phRep));
    on('[data-ph-day]', (b) => { Phone.day = b.dataset.phDay; Phone.render(); });
    on('[data-ph-mon]', (b) => {
      const k = +b.dataset.phMon;
      if (!k) { const td = today(); Phone.month = new Date(td.getFullYear(), td.getMonth(), 1); Phone.day = null; } else Phone.month = new Date(Phone.month.getFullYear(), Phone.month.getMonth() + k, 1);
      Phone.render();
    });
    on('[data-ph-wall]', (b) => { Phone.data().wall = +b.dataset.phWall; Game.save(); Phone.render(); });
    on('[data-ph-settings]', () => { Phone.close(); if (typeof SetSheet !== 'undefined') SetSheet.open(); });
    on('[data-ph-close]', () => Phone.close());
    on('[data-ph-restore]', () => { try { Premium.restore().then(() => Phone.render()); } catch (e) { /* yok */ } });
    on('[data-ph-prem]', (b) => {
      const k = b.dataset.phPrem;
      try {
        if (k === 'premium') Star.pitch(null, 'phone');
        else if (k === 'plus') Plus.pitch(null, 'phone');
        else if (k === 'diamond') Diamond.pitch('phone');
        else if (Packs.owns(k)) { Phone.close(); Packs.open(k); } else Packs.offer(k);
      } catch (e) { console.error(e); }
    });
  }
  function reply(i) {
    const id = Phone.sub, c = contacts().find((x) => x.id === id);
    if (!c) return;
    const r = c.r[i], d = Phone.data(), w = Phone.week(), s = Game.state;
    if (!r || d.rep[id] === w) return;
    if (r.open) { d.rep[id] = w; (d.my = d.my || {})[id] = r.t; (d.last = d.last || {})[id] = r.ok; Game.save(); Phone.app = r.open; Phone.sub = null; return Phone.render(); }
    if (r.act) {
      const ap0 = s.ap;
      try { r.act(); } catch (e) { console.error(e); }
      if (Game.state.ap >= ap0) { Phone.render(); return; } // hak harcanmadıysa (para yok, hak yok vb.) cevap gönderilmemiş sayılır
    }
    d.rep[id] = w; (d.my = d.my || {})[id] = r.t; (d.last = d.last || {})[id] = r.ok;
    Game.save();
    Phone.render();
  }
  Phone.badge = function () {
    const b = document.querySelector('#tabs [data-phone]');
    if (!b) return;
    b.hidden = !Phone.on();
    let n = 0; try { n = unread() + ((Phone.p() && Phone.p().life && Phone.p().life.offers) || []).length; } catch (e) { n = 0; }
    const i = b.querySelector('.ph-tabn');
    if (i) { i.textContent = n > 9 ? '9+' : String(n); i.hidden = !n; }
  };
  Phone.show = function (app) {
    if (!Phone.on()) return;
    if (!Phone.el) {
      Phone.el = document.createElement('div');
      Phone.el.className = 'ph-ov';
      Phone.el.innerHTML = '<div class="ph-dev t0"><div class="ph-screen"><div class="ph-wall"></div><div class="ph-cam"></div><div class="ph-view"></div><button class="ph-homebar" type="button" aria-label="Ana ekran"></button></div></div>';
      document.body.appendChild(Phone.el);
      Phone.el.addEventListener('click', (e) => { if (e.target === Phone.el) Phone.close(); });
      Phone.el.querySelector('.ph-homebar').onclick = () => { if (!Phone.app) return Phone.close(); Phone.app = null; Phone.sub = null; Phone.render(); };
    }
    Phone.open = true; Phone.app = app || null; Phone.sub = null; Phone.day = null; Phone.month = null; Phone._last = null;
    Phone.el.classList.add('on');
    document.documentElement.classList.add('ph-open');
    Phone.render();
  };
  Phone.close = function () {
    Phone.open = false;
    if (Phone.el) Phone.el.classList.remove('on');
    document.documentElement.classList.remove('ph-open');
    Phone.badge();
  };

  // ---------------- oyuna bağlantı ----------------
  // Oyun yeniden çizildiğinde açık telefon da güncellenir (satın alma, aksiyon, menajer işlemleri sonrası)
  const render0 = Game.render;
  Game.render = function () {
    const out = render0.apply(this, arguments);
    try { Phone.badge(); if (Phone.open) Phone.render(); } catch (e) { console.error(e); }
    return out;
  };
  // maç başlarken, ana menüye dönerken telefon kapanır
  const play0 = Game.playNext;
  Game.playNext = function () { try { Phone.close(); } catch (e) { /* yok */ } return play0.apply(this, arguments); };
  const show0 = Game.show;
  Game.show = function (id) { if (id !== 'hub') try { Phone.close(); } catch (e) { /* yok */ } return show0.apply(this, arguments); };

  // Yaşam sekmesi: menajer ve sponsor kartları telefona taşındı; yerlerinde kısa bir kart kalır (hiçbir işlem kaybolmaz)
  if (typeof Life !== 'undefined') {
    const screen0 = Life.screen;
    Phone._life0 = function () { return screen0.apply(Life, arguments); };
    Life.screen = function () {
      const html = screen0.apply(this, arguments);
      try {
        const p = Game.state.player;
        if (p.age < 16 || Game.inStreet()) return html;
        const sec = lifeSections();
        if (!sec.mgr && !sec.sp) return html;
        const L = Life.ensure(p);
        const card = `<section class="card ph-short"><div class="card-h"><span>${Icon('contract')} Menajer ve sponsorlar</span><small class="muted">Telefonunda</small></div>
          <div class="ph-short-row"><button class="ph-short-b" data-phone-open="agent" type="button"><b>${L.manager ? esc(L.manager.name) : 'Menajer bul'}</b><small>${L.manager ? `%${Math.round(L.manager.cut * 100)} pay` : 'Teklifleri artırır'}</small></button>
          <button class="ph-short-b" data-phone-open="agent" type="button"><b>${L.sponsors.length} aktif sponsor</b><small>${L.offers.length ? `${L.offers.length} yeni teklif` : `Haftalık ${money(Life.sponsorIncome(p))}`}</small>${L.offers.length ? '<i class="ph-short-dot"></i>' : ''}</button></div></section>`;
        let out = html;
        if (sec.mgr) out = out.replace(sec.mgr, card);
        if (sec.sp) out = out.replace(sec.sp, sec.mgr ? '' : card);
        return out;
      } catch (e) { return html; }
    };
  }
  // Profil sekmesi: StarFeed profili telefona taşındı; yerinde son gönderilerle kısa bir kart kalır
  if (typeof Social !== 'undefined') {
    const player0 = UI.player;
    UI.player = function () {
      const html = player0.apply(this, arguments);
      try {
        const full = Social.render(true);
        if (!full || html.indexOf(full) < 0) return html;
        const p = Game.p, so = Social.ensure(p);
        const card = `<section class="card ph-short sf"><div class="card-h"><span>${Icon('star')} StarFeed</span><small class="muted">${Social.fmt(so.followers)} takipçi</small></div>
          ${so.posts.length ? `<div class="ph-sf-row">${so.posts.slice(0, 3).map((x) => `<button class="ph-sf-t" data-post="${x.id}" type="button"><canvas data-pid="${x.id}" data-crop="1" aria-hidden="true"></canvas></button>`).join('')}</div>` : '<p class="muted">Henüz paylaşım yok.</p>'}
          <button class="btn btn-ghost ph-sf-open" data-phone-open="feed" type="button">${Icon('star')} Profilini telefonunda aç</button></section>`;
        return html.replace(full, card);
      } catch (e) { return html; }
    };
  }
  // her yerden "telefonda aç" düğmeleri
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('[data-phone-open], #tabs [data-phone]');
    if (!b || !Game.state || !Game.state.player) return;
    e.preventDefault();
    Phone.show(b.dataset.phoneOpen || null);
  });
  // alt menüye telefon düğmesi (Profil'in yanında)
  function addTab() {
    const tabs = document.getElementById('tabs');
    if (!tabs || tabs.querySelector('[data-phone]')) return;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'tab-phone'; b.setAttribute('data-phone', '1');
    b.innerHTML = `${IC.tab}<span>Telefon</span><i class="ph-tabn" hidden>0</i>`;
    tabs.appendChild(b);
    tabs.classList.add('has-phone');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addTab); else addTab();
})();
