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
    life: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.4-9C1.2 8.2 3.3 4.6 7 4.6c2.1 0 3.6 1.2 5 3.1 1.4-1.9 2.9-3.1 5-3.1 3.7 0 5.8 3.6 4.4 6.9-1.9 4.4-9.4 9.1-9.4 9.1z" fill="#fff"/></svg>',
    school: svg('<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c2 1.6 4 2.4 6 2.4s4-.8 6-2.4v-5"/><path d="M22 9v6"/>', 'none', '#1d3a8a', 2),
    sport: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="#fff"/><path d="M12 7.2l3.6 2.6-1.4 4.2H9.8L8.4 9.8z" fill="#0b5e2e"/><path d="M12 7.2V3.3M15.6 9.8l3.6-1.3M14.2 14l2.3 3.3M9.8 14l-2.3 3.3M8.4 9.8L4.8 8.5" stroke="#0b5e2e" stroke-width="1.4" stroke-linecap="round"/></svg>',
    lux: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8l4.5 3.5L12 4l4.5 7.5L21 8l-2 11H5z" fill="#ffcf3f"/><path d="M5 19h14" stroke="#ffe9a0" stroke-width="1.6"/></svg>',
    dia: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.5h12l4 5.5-10 12L2 9z" fill="#bff1ff"/><path d="M2 9h20M8.5 3.5L12 21l3.5-17.5M6 3.5L8.5 9 12 3.5 15.5 9 18 3.5" stroke="#3a8dff" stroke-width="1.1" fill="none" stroke-linejoin="round"/></svg>',
    tab: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M10.5 18.5h3"/></svg>',
  };
  const calIcon = (d, wd) => `<svg viewBox="0 0 24 24" aria-hidden="true"><text x="12" y="8.2" text-anchor="middle" font-size="5" font-weight="700" font-family="Barlow Semi Condensed, sans-serif" fill="#e5383b">${wd}</text><text x="12" y="19.5" text-anchor="middle" font-size="11.5" font-weight="500" font-family="Barlow Semi Condensed, sans-serif" fill="#111">${d}</text></svg>`;
  const photosIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7" r="4" fill="#ffcf3f"/><circle cx="17" cy="12" r="4" fill="#ff6f8a" opacity=".9"/><circle cx="12" cy="17" r="4" fill="#7fb2ff" opacity=".9"/><circle cx="7" cy="12" r="4" fill="#46e08f" opacity=".9"/></svg>';

  // ---------------- tarih: sezon haftaları gerçek takvime yayılır (Ağustos → Mayıs) ----------------
  // Lig maçı Cumartesi 19:00, kupa maçı aynı haftanın Çarşamba 21:45, milli maç Salı 20:45.
  // Ana ekrandaki Maç Günü kartı, telefon widget'ı, takvim ve Okul/Ehliyet/Bayram gibi olaylar bu tek takvimi kullanır.
  const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const WD = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const WDL = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  const SEASON_WEEKS = 41; // Ağustos'un 2. cumartesisinden Mayıs sonuna
  const seasonStart = (y) => { const d = new Date(y, 7, 1); const add = (6 - d.getDay() + 7) % 7; d.setDate(1 + add + 7); return d; };
  const nRounds = () => Math.max(2, Game.rounds());
  const roundWeek = (r) => { const n = nRounds(), span = Math.max(n - 1, SEASON_WEEKS - 1); return Math.round(Math.max(0, Math.min(r, n - 1)) * span / (n - 1)); };
  const roundDate = (r, y) => { const d = seasonStart(y != null ? y : Game.state.season.year); d.setDate(d.getDate() + 7 * roundWeek(r)); return d; };
  const KOFF = { match: 0, league: 0, street: 0, cup: -3, intl: -4 };
  const KHOUR = { match: '19:00', league: '19:00', street: '17:00', cup: '21:45', intl: '20:45' };
  const matchDate = (k, r) => { const d = roundDate(r); d.setDate(d.getDate() + (KOFF[k] || 0)); return d; };
  const mon = (d) => (d.getDay() + 6) % 7; // Pzt=0
  const key = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  // sıradaki maç: ana ekrandaki Maç Günü kartıyla aynı sıra (önce kupa, sonra milli maç, sonra lig)
  function nextMatch() {
    const s = Game.state, r = s.season.round;
    if (Game.inStreet()) return { k: 'street', t: s.street && s.street.trials ? 'Seçme Günü' : 'Mahalle maçı', sub: s.street && s.street.trials ? 'Altyapı seçmeleri' : 'Scout izliyor olabilir', date: matchDate('street', r), h: KHOUR.street };
    if (s.pendingCup && s.cups && s.cups[s.pendingCup]) {
      const cup = s.cups[s.pendingCup], op = Cups.opponent(s, cup);
      if (op) return { k: 'cup', t: (Game.club(op.opp) || {}).name || '', sub: `${cup.name} · ${op.stage}`, home: op.h === s.clubId, date: matchDate('cup', r), h: KHOUR.cup };
    }
    if (s.pendingIntl) { const o = Game.nat(s.pendingIntl) || {}, cat = Game.intlCat(); return { k: 'intl', t: `${o.name || ''}${cat ? ' ' + cat : ''}`, sub: cat ? `${cat} milli maç` : 'Milli maç', date: matchDate('intl', r), h: KHOUR.intl }; }
    const fx = Game.nextFixture();
    if (fx) { const home = fx.home === s.clubId; return { k: 'match', t: Game.teamName(home ? fx.away : fx.home), sub: `${Game.leagueName()} · ${home ? 'İç saha' : 'Deplasman'}`, home, date: matchDate('league', r), h: KHOUR.league }; }
    return null;
  }
  // bugün = sıradaki maçın günü (Maç Günü); sezon bittiyse son lig haftası
  const today = () => { const m = Game.state && Game.state.player ? nextMatch() : null; return m ? new Date(m.date) : roundDate(nRounds() - 1); };
  const dateLbl = (d) => `<span>${WDL[mon(d)]}</span> <span>${d.getDate()}</span> <span>${MONTHS[d.getMonth()]}</span>`;
  // oyuncunun doğum günü: ay sabit (p.bm), gün isimden türetilir
  const hstr0 = (t) => { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const bdayOf = (y) => { const p = Phone.p(); if (!p || p.bm == null) return null; return new Date(y, p.bm, (hstr0(Player.fullName(p)) % 28) + 1); };
  // doğum günü haftası: doğum günü (bu haftanın maçından önceki 7 gün içinde) — LifeX bu hafta kutlar
  Phone.isBdayRound = (r) => {
    const s = Game.state; if (!s || !s.player) return false;
    return [s.season.year, s.season.year + 1].some((y) => { const b = bdayOf(y); return b && inRound(r, b); });
  };
  Phone.monthOf = (r) => roundDate(r).getMonth();
  // verilen gün bu lig haftasına mı düşüyor (önceki haftanın maçından sonra, bu haftanın maçına kadar)
  // gün geldi mi: sezon içinde ve bu haftanın maçına kadar (olay bayrağı sezonda bir kez kutlatır; araya başka olay girerse sonraki hafta gelir)
  const inRound = (r, day) => {
    const n = nRounds(), end = roundDate(r), start = new Date(roundDate(0).getTime() - 7 * 864e5);
    if (day > start && day <= end) return true;
    return r === n - 1 && day > end && day - end < 30 * 864e5; // sezon bittikten kısa süre sonraki gün son haftada kutlanır
  };
  const mothersDay = (y) => { const d = new Date(y, 4, 1); d.setDate(1 + ((7 - d.getDay()) % 7) + 7); return d; };
  Phone.holidayRound = (k, r) => { const y = Game.state.season.year; return k === 'ny' ? inRound(r, new Date(y + 1, 0, 1)) : k === 'md' ? inRound(r, mothersDay(y + 1)) : false; };
  Phone.nextMatch = () => nextMatch();
  Phone.matchLabel = () => { const m = nextMatch(); return m ? `${dateLbl(m.date)} · ${m.h}` : ''; };

  function events() {
    const s = Game.state, p = s.player, out = {}, y = s.season.year, r0 = s.season.round;
    const add = (d, e) => { (out[key(d)] = out[key(d)] || []).push(e); };
    const busy = new Set();
    // oynanan kupa ve milli maçlar (sonuçlarıyla)
    ((Phone.data().cal) || []).filter((e) => e.y === y).forEach((e) => { const d = matchDate(e.k, e.r); busy.add(key(d)); add(d, { k: e.k === 'intl' ? 'intl' : 'cup', h: KHOUR[e.k] || '20:00', t: e.t, s: e.s, res: e.res, win: e.win }); });
    const nm = nextMatch();
    if (nm && (nm.k === 'cup' || nm.k === 'intl')) { busy.add(key(nm.date)); add(nm.date, { k: nm.k, h: nm.h, t: nm.t, s: nm.sub }); }
    if (Game.inStreet()) { if (nm) add(nm.date, { k: 'match', h: nm.h, t: nm.t, s: nm.sub }); }
    else {
      // gelecek kupa turları (yalnız hâlâ kupadaysan; rakip kura ile belli olur)
      try {
        Object.values(s.cups || {}).forEach((cup) => {
          if (cup.winner || !!cup.youth !== Game.isYouth() || !Cups.inCup(s, cup)) return;
          (Cups.weeks(nRounds(), cup) || []).forEach((w, i) => {
            if (i < cup.stage || w < r0 || (w === r0 && s.pendingCup === cup.id)) return;
            const d = matchDate('cup', w); if (busy.has(key(d))) return;
            busy.add(key(d)); add(d, { k: 'cup', h: KHOUR.cup, t: cup.name || 'Kupa', s: 'Rakip kura ile belli olacak' });
          });
        });
      } catch (e) { /* kupa takvimi yok */ }
      const lg = Game.league();
      if (lg && lg.fixtures) {
        lg.fixtures.forEach((round, i) => {
          const f = round.find(([h, a]) => h === s.clubId || a === s.clubId);
          if (!f) return;
          const home = f[0] === s.clubId, opp = home ? f[1] : f[0];
          const r = (lg.results || []).find((x) => x.round === i && (x.h === s.clubId || x.a === s.clubId));
          let res = '';
          if (r) { const gf = r.h === s.clubId ? r.hs : r.as, ga = r.h === s.clubId ? r.as : r.hs; res = `${gf}-${ga}`; }
          add(matchDate('league', i), { k: 'match', h: KHOUR.league, t: Game.teamName(opp), s: `${Game.leagueName()} · ${home ? 'İç saha' : 'Deplasman'}`, res, win: r ? (r.h === s.clubId ? r.hs - r.as : r.as - r.hs) : null });
          // hafta içi antrenmanlar (kupa ya da milli maç gününe denk gelmez)
          [5, 4, 2].forEach((back) => { const d = matchDate('league', i); d.setDate(d.getDate() - back); if (!busy.has(key(d))) add(d, { k: 'train', h: '10:00', t: 'Takım antrenmanı', s: Game.teamName() }); });
        });
      }
    }
    // çocukların doğum günleri: ana ekrandaki haber de bu haftada gelir
    const L = p.life;
    (L && L.kids || []).forEach((k) => { const w = ((k.by * 7) % 30) + 3; if (w < nRounds()) { const d = matchDate('league', w); d.setDate(d.getDate() - 2); add(d, { k: 'fam', h: '17:00', t: `${k.n} doğum günü`, s: 'Aile' }); } });
    // senin doğum günün, yılbaşı, anneler günü
    [y, y + 1].forEach((yy) => {
      const b = bdayOf(yy); if (b) add(b, { k: 'fam', h: '', t: 'Doğum günün', s: 'Kutlama' });
      add(new Date(yy, 0, 1), { k: 'fam', h: '', t: 'Yılbaşı', s: 'Tatil' });
      add(mothersDay(yy), { k: 'fam', h: '', t: 'Anneler Günü', s: 'Aile' });
    });
    return out;
  }

  // ---------------- kişiler ve haftalık mesajlar ----------------
  // Her mesajın bir türü var (davet, tebrik, teselli, soru, istek...). Cevap seçenekleri o mesaja göre gelir:
  // tebrik edene "teşekkürler", davet edene "geliyorum / bu sefer olmaz", soru sorana cevap.
  // Maça, gole, sakatlığa, kadroda olmamaya, mevkiye, üne, yaşa ve sıradaki rakibe göre seçilir; aynı mesaj üst üste gelmez.
  const hstr = (t) => { let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  function ctxNow() {
    const s = Game.state, p = s.player, r = s.lastReport;
    const f = !!(r && r.w && String(r.w).indexOf(String(s.season.year)) === 0 && s.season.round > 0);
    const pl = f && r.rating != null;
    let nx = null; try { nx = nextMatch(); } catch (e) { /* yok */ }
    const street = Game.inStreet();
    let comp = 'league'; try { comp = Phone.data().lastComp || 'league'; } catch (e) { /* yok */ }
    let mo = 8; try { mo = Phone.monthOf(s.season.round); } catch (e) { /* yok */ }
    return {
      f, played: pl, win: f && r.res === 'W', loss: f && r.res === 'L', draw: f && r.res === 'D', sc: f ? `${r.gf}-${r.ga}` : '', opp: f ? r.opp || '' : '', comp,
      goals: pl && r.goals > 0, nG: pl ? r.goals || 0 : 0, ast: pl && r.assists > 0, cs: pl && r.ga === 0, star: pl && r.rating >= 7.5, poor: pl && r.rating < 6, motm: pl && !!r.motm,
      bench: f && !pl && !p.injuryWeeks, inj: p.injuryWeeks > 0, injLong: p.injuryWeeks >= 3,
      young: p.age <= 17, kid: p.age <= 12, gk: p.position === 'GK', pos: p.position, fame: p.fame || 0, street, youth: Game.isYouth(),
      nx, nxL: !!(nx && nx.k === 'match' && !street), nxHome: !!(nx && nx.k === 'match' && nx.home && !street), winter: [10, 11, 0, 1, 2].includes(mo), summer: [5, 6, 7].includes(mo),
    };
  }
  const recent = (id) => { try { const w = Phone.week(), l = (Phone.data().log || {})[String(id).replace(/^fr(?=\d)/, 'f')] || []; return l.filter((e) => e.wk && e.w !== w).slice(-3).map((e) => e.t); } catch (e) { return []; } };
  const pickW = (id, arr) => arr[hstr(`${id}|${Phone.week()}|r`) % arr.length];
  // E(tür, metin, koşul, bağlamlı mı, özel cevaplar): koşul yanlışsa mesaj havuza girmez
  const E = (k, t, c = true, x = false, r = null) => (c && t ? { k, t, x, r } : null);
  // bağlamlı (maça/duruma bağlı) mesaj varsa çoğunlukla onu seçer; son 3 haftanın mesajını tekrar etmez
  function pickMsg(id, list) {
    const all = list.filter(Boolean), h = hstr(`${id}|${Phone.week()}`), rc = recent(id);
    const fresh = (arr) => { const f = arr.filter((e) => !rc.includes(e.t)); return f.length ? f : arr; };
    const c = fresh(all.filter((e) => e.x)), g = fresh(all.filter((e) => !e.x));
    if (c.length && (h % 10 < 8 || !g.length)) return c[(h >>> 4) % c.length];
    return g.length ? g[(h >>> 8) % g.length] : { k: 'def', t: '👋', x: false };
  }
  // kişinin bu haftaki mesajı + o mesaja uygun cevaplar
  function conv(id, list, R) { const e = pickMsg(id, list); return { m: e.t, mk: e.k, ctx: !!e.x, R, r: e.r || R[e.k] || R.def }; }
  const T = (t, ok) => ({ t, ok });
  const A = (t, ok, act, more) => Object.assign({ t, ok, act, ap: 1 }, more || {});
  // arkadaşla buluşma: 1 aksiyon hakkı, arkadaşlık ve moral artar
  function friendMeet(f) {
    const s = Game.state, p = s.player;
    if (s.ap <= 0) return Game.toast('Bu hafta için aksiyon hakkın kalmadı. Maça çık!', 'bad');
    s.ap -= 1; f.rel = U.clamp((f.rel || 60) + 8, 0, 100); Player.addMorale(p, 3);
    Game.toast(`${f.n} ile güzel vakit geçirdiniz. Arkadaşlık +8`, 'good');
    Game.save(); Game.render();
  }
  function contacts() {
    const s = Game.state, p = s.player, L = Life.ensure(p), out = [], X = ctxNow();
    const fam = () => Life.act('family'), date = () => Life.act('date'), talk = () => Game.act('talk'), team = () => Game.act('team');
    const once = () => !Game.state.week || !Game.state.week.coachTalk;
    const W = (id, arr) => pickW(id, arr);
    const pos = X.pos, out11 = pos !== 'GK';
    const car = (p.items || []).some((id) => { const it = ITEMS.find((q) => q.id === id); return it && it.art === 'car'; });
    // ---- Annem ----
    const home = X.young ? W('mh', ['Bu akşam evdeyim anne, beraber oturalım', 'Akşam erken geleceğim, beraber yemek yiyelim']) : W('mh', ['Bu akşam size geliyorum', 'Hafta sonu kahvaltıya geliyorum', 'Akşam yemeğe uğrarım']);
    const homeOk = W('mho', ['Oh çok sevindim! Hemen sofrayı kuruyorum.', 'Yaşasın! En sevdiğin yemeği yapıyorum.', 'Gözüm yollarda olacak!']);
    const momR = {
      care: [A(home, homeOk, fam), T(W('mc', ['Tamam anne, merak etme', 'Söz anne, dikkat ediyorum']), W('mco', ['Aferin benim oğluma.', 'Canım oğlum, kendine iyi bak.']))],
      school: [T('Ödevlerimi bitirdim anne', 'Aferin! Ders de en az futbol kadar önemli.'), T('Bu akşam çalışacağım, söz', 'Söz verdin bak, kontrol edeceğim!')],
      invite: [A('Tamam anne, geliyorum', homeOk, fam), T('Bu hafta çok yoğunum anne, sonra gelirim', 'Peki oğlum, ama çok özledik.')],
      proud: [T(W('mp', ['Haha, onlara selam söyle', 'Abartmayın anne ya']), W('mpo', ['Söylerim, hepsi seni çok seviyor.', 'Abartmıyoruz, gurur duyuyoruz!'])), A(home, homeOk, fam)],
      ask: [T('Tamam, bir forma imzalayıp getiririm', 'Teyzen çok sevinecek!'), T('Bu ara zor anne, sonra bakarım', 'Peki, ben ona söylerim.')],
      congrats: [T(W('mg', ['Sağ ol anne, sizin için oynuyorum', 'Sağ ol anne, dualarınız sayesinde']), 'Canım oğlum, gurur duyuyorum.'), A(X.young ? 'Akşam beraber kutlayalım anne' : 'Bu akşam gelip beraber kutlayalım', 'Pasta yapıyorum, çabuk gel!', fam)],
      console: [T('Sağ ol anne, toparlanacağız', 'Biliyorum, sen güçlüsün.'), A(X.young ? 'Akşam biraz seninle oturayım anne' : 'Bu akşam size geleyim, kafam dağılsın', 'Gel oğlum, sıcak çorba yaptım.', fam)],
      inj: [T('Daha iyiyim anne, merak etme', 'Çabuk iyileş, dua ediyorum.'), A(X.young ? 'Bugün evdeyim, yanımda ol yeter' : 'Bu hafta biraz yanınızda kalayım', 'Gel, sana ben bakarım.', fam)],
      bench: [T('Hoca başka tercih yaptı, çalışmaya devam', 'Sen çalış, zamanı gelince oynarsın.'), T('Bilmiyorum anne, moralim biraz bozuk', 'Üzülme, sen bizim için hep birincisin.')],
      love: [T('Ben de seni seviyorum anne', 'Canım oğlum benim.'), A(home, homeOk, fam)],
    };
    momR.def = momR.love;
    out.push({ id: 'mom', n: 'Annem', role: 'Aile', c: 'linear-gradient(135deg,#46e08f,#1f9d5c)', i: 'A',
      ...conv('mom', [
        E('care', 'Uyku düzenine dikkat et oğlum.'),
        E('care', 'Bu hafta soğuk olacakmış, kalın giyin.', X.winter), E('care', 'Hava çok sıcak, bol su iç oğlum.', X.summer),
        E('care', 'Akşam yemeği 7\'de, geç kalma!', X.young), E('care', 'Kramponlarını kapının önüne bırakma!', X.young), E('care', 'Antrenmandan sonra doğru eve.', X.young), E('care', 'Çantanı hazırladım, su şişeni unutma.', X.young),
        E('school', 'Ödevlerini bitirdin mi?', X.young && typeof School !== 'undefined' && School.on()), E('school', 'Sınavın ne zaman? Biraz ders çalış.', X.young && typeof School !== 'undefined' && School.on()),
        E('care', 'Yemek yiyor musun düzgün? Kendine iyi bak.', !X.young),
        E('invite', 'Pazar yemeğe gel, en sevdiğin yemeği yapıyorum.', !X.young), E('love', 'Babanla seni konuşuyorduk, seni çok özledik.', !X.young), E('love', 'Dua ediyorum hep senin için.'),
        E('proud', 'Komşular hep seni soruyor, maçlarını takip ediyorlar!', X.fame >= 5 && X.fame < 25), E('proud', 'Fotoğrafını gazetede gördüm, çerçeveletiyorum!', X.fame >= 15), E('proud', 'Bugün televizyonda senden bahsettiler, ağladım valla.', X.fame >= 25),
        E('ask', 'Teyzen aradı, imzalı forma istiyor.', !X.street && !X.youth),
        E('congrats', `Maçı izledim, ${X.sc} kazandınız! Mahallede bayram var!`, X.win && X.played && !X.goals, true),
        E('congrats', 'Golünü izlerken sesim kısıldı! Aferin oğlum.', X.nG === 1, true), E('congrats', 'İki gol! Komşular kapıya dayandı, aferin oğlum.', X.nG === 2, true), E('congrats', 'Üç gol! Babanla televizyonun başında zıpladık!', X.nG >= 3, true),
        E('congrats', 'Kalene gol yedirmedin! Aferin oğlum.', X.gk && X.cs, true),
        E('console', `Maç ${X.sc} bitti, moralini bozma oğlum. Bir dahakini kazanırsınız.`, X.loss && !X.inj, true),
        E('inj', 'Sakatlığın nasıl? İlaçlarını aksatma, merak ediyorum.', X.inj, true),
        E('bench', 'Bu hafta neden oynamadın? Hoca seni neden almadı?', X.bench, true),
      ], momR) });
    // ---- Babam ----
    const dadR = {
      advice: [T(W('da', ['Haklısın baba', 'Not aldım baba']), W('dao', ['Aferin. Ben senin ilk hocanım, unutma.', 'Bildiğin gibi devam et.'])), T('Biliyorum baba, çalışıyorum', 'Çalışan kazanır oğlum.')],
      nost: [T('O günleri ben de özledim', 'Sen o zaman da farklıydın.'), A('Bu akşam gel beraber izleyelim', 'Çayı demliyorum!', fam)],
      proud: [T('Ciddi mi? Çok güzel', 'Herkes seni konuşuyor.'), A(X.young ? 'Akşam beraber yürüyüşe çıkalım baba' : 'Hafta sonu mahalleye gelirim', 'Herkese haber veriyorum!', fam)],
      cheer: [T(W('dch', ['Gel baba, seni gururlandıracağım', 'Gel baba, tribünde seni arayacağım']), 'Tribünde en çok ben bağıracağım!'), T('Bilet ayarlattım baba, kapıda adın yazılı', 'Kralsın oğlum!')],
      scout: [T('Not aldım baba, sağ ol', 'Hadi bakalım, göster kendini.'), T('Hocamız da aynısını söyledi', 'Demek ki ben de hoca olabilirmişim!')],
      car: [T('Değiştirdim baba', 'Aferin, bakımı ihmal etme.'), T('Unuttum, bu hafta yaptırırım', 'Unutma, motor yanar sonra.')],
      goalQ: [T(pos === 'FW' ? 'En az 15, söz baba' : 'En az 8, söz baba', 'Tuttum seni, sayıyorum!'), T('Gol değil, takım kazansın yeter', 'İşte benim oğlum.')],
      gkQ: [T('En az 10 maç, söz baba', 'Tuttum seni, sayıyorum!'), T('Takım kazansın, gerisi önemli değil', 'İşte benim oğlum.')],
      run: [T('Aferin baba, devam!', 'Senin gibi değil ama idare ediyor!'), A('Yarın beraber koşalım', 'Sabah 7\'de kapıdayım!', fam)],
      congrats: [T('Sağ ol baba, senin sayende', 'Ben sadece topu aldım, gerisi sende.'), A('Hafta sonu gel, maçın özetini beraber izleyelim', 'Özetini kaydettim bile!', fam)],
      console: [T('Haklısın baba, kafam yukarıda', 'İşte benim oğlum.'), A('Akşam gel baba, biraz konuşalım', 'Geliyorum, çayı koy.', fam)],
      inj: [T('Her gün gidiyorum baba', 'Aferin, sabır.'), T('Canım sıkılıyor baba, oynamak istiyorum', 'Biliyorum. Acele edersen daha uzun kalırsın.')],
    };
    dadR.def = dadR.advice;
    const inv = (t, acc, ok, decl, dok, act) => E('invite', t, true, false, [A(acc, ok, act || fam), T(decl, dok)]);
    const posTip = { FW: 'Ceza sahasında daha soğukkanlı ol, gol gelir.', MF: 'Topu ayağında fazla tutma, oyunu hızlandır.', DF: 'Ofsayt çizgisini iyi tut, bir adım geride kalma.', GK: 'Çıkışlarında daha kararlı ol, kale senin evin.' }[pos];
    const winTxt = X.comp === 'intl' ? 'Milli formayla kazandın, gururlandım!' : X.comp === 'cup' ? 'Kupada bir tur daha! Aferin.' : '3 puan! Böyle devam.';
    out.push({ id: 'dad', n: 'Babam', role: 'Aile', c: 'linear-gradient(135deg,#34c4b0,#147a6c)', i: 'B',
      ...conv('dad', [
        X.young ? inv('Hafta sonu parka gidip şut çalışalım mı?', 'Olur baba, topu ben getiririm', 'Anlaştık, sabah 9\'da parktayız!', 'Bu hafta yorgunum baba, sonra', 'Tamam oğlum, dinlen.') : inv('Hafta sonu beraber maç izleyelim mi?', 'Olur baba, çekirdekleri sen al', 'Çekirdekler benden!', 'Bu hafta yoğunum baba, sonra', 'Tamam oğlum, sen bilirsin.'),
        !X.young ? inv('Bu hafta balığa gidelim mi?', 'Olur baba, gidelim', 'Anlaştık, oltaları hazırlıyorum!', 'Bu hafta olmaz baba, maç var', 'Peki, sezon arası gideriz.') : null,
        E('advice', 'Antrenmanlarını aksatma, yetenek tek başına yetmez.', !X.inj), E('advice', posTip, !X.inj),
        E('nost', 'Eski maçlarını izledim, ne günlerdi!', !X.young),
        E('proud', 'Mahalledekiler senin formanı giyiyor, haberin olsun.', X.fame >= 10),
        E('cheer', `${X.nx ? X.nx.t : ''} maçına tribüne geliyorum!`, X.nxHome && !X.inj),
        E('scout', `${X.nx ? X.nx.t : ''} maçlarını izledim, savunmaları yavaş. Hızlı oyna.`, X.nxL && out11 && !X.inj),
        E('car', 'Arabanın yağını değiştirdin mi?', car),
        E('goalQ', 'Bu sezon kaç gol hedefliyorsun?', pos === 'FW' || pos === 'MF'), E('gkQ', 'Bu sezon kaç maçta kalende gol görmeyeceksin?', X.gk),
        E('run', 'Sabah koşusuna çıktım, senden ilham aldım!'),
        E('congrats', winTxt, X.win && X.played, true), E('congrats', 'O golü ben de atardım gençken... Şaka şaka, harikaydın!', X.goals, true), E('congrats', 'Maçın en iyisi sendin, gurur duydum.', X.star || X.motm, true),
        E('console', 'Yenilgi de oyunun parçası. Kafanı kaldır.', X.loss, true),
        E('inj', 'Fizyoterapiste düzenli git, acele etme.', X.inj, true),
        E('advice', 'Kenarda kalmak da öğretir. Antrenmanda hocaya kendini göster.', X.bench, true),
      ], dadR) });
    // ---- Sevgili / eş ----
    if (L.gf) {
      const gfName = L.gf.name, mar = !!L.gf.married;
      const no = T('Bu hafta yoğunum, telafi edeceğim', 'Peki... ama söz verdin.');
      const ginv = (t, acc, ok) => E('invite', t, true, false, [A(acc, ok, date), no]);
      const gfR = {
        love: [T('Benim de aklım sende', 'Tatlısın.'), A('Akşam buluşalım o zaman', 'Tamam, bekliyorum!', date)],
        care: [T('Haklısın, bu akşam erken yatacağım', 'Aferin, iyi uykular.'), A('Gel beraber dinlenelim', 'Geliyorum, film açarız.', date)],
        congrats: [T('Sağ ol, sahada seni düşündüm', 'Tatlısın. Kutlayalım mı?'), A('Akşam kutlayalım mı?', 'Hazırlanıyorum!', date)],
        console: [T('Sen varken üzülmem', 'Ben hep buradayım.'), A('Bu akşam yanıma gelir misin?', 'Hemen geliyorum.', date)],
        inj: [T('Sen olmasan ne yapardım', 'Abartma, iç çorbanı!'), A('Gel, beraber film izleyelim', 'Geliyorum, battaniye bende.', date)],
      };
      gfR.def = gfR.love;
      out.push({ id: 'gf', n: gfName, role: mar ? 'Eşin' : 'Sevgilin', c: 'linear-gradient(135deg,#ff6f8a,#c2416b)', i: gfName[0], heart: true,
        ...conv('gf', [
          mar ? ginv('Bu akşam dışarıda yemek yiyelim mi?', 'Olur, 8\'de hazır ol', 'Harika, hazırlanıyorum!') : ginv('Bu akşam boş musun? Seni özledim.', 'Boşum, 8\'de alırım seni', 'Hazır olurum!'),
          ginv('Yeni bir restoran açılmış, gidelim mi?', 'Gidelim, rezervasyonu ben yapıyorum', 'Harika, sabırsızlanıyorum!'),
          ginv('Hafta sonu bir yerlere kaçalım mı?', 'Kaçalım, sahile gidelim', 'Bavulumu hazırlıyorum!'),
          ginv('Yeni bir dizi başladım, beraber izleyelim mi?', 'Akşam geliyorum, patlamışlar benden', 'Anlaştık, battaniyeyi hazırlıyorum.'),
          E('love', 'Bugün aklım hep sendeydi.'),
          E('song', 'Sana bir şarkı gönderdim, dinle!', true, false, [T('Dinledim, çok güzelmiş', 'Bizim şarkımız olsun o zaman.'), T('Antrenmandan sonra dinleyeceğim', 'Unutma ama!')]),
          E('mom', 'Annen beni yemeğe çağırdı, çok tatlı.', !mar, false, [T('Annem seni çok seviyor', 'Ben de onu çok seviyorum.'), A('Hadi beraber gidelim', 'Tamam, tatlıyı ben yaparım!', fam)]),
          E('care', 'Bu hafta çok yorgun görünüyorsun, biraz dinlen.'),
          E('congrats', 'Kazandınız! Seninle gurur duyuyorum.', X.win && X.played && !X.goals, true), E('congrats', 'Gol attığında çığlık attım!', X.goals, true),
          E('wave', 'Tribünden sana el salladım, gördün mü?', X.played && !X.inj, true, [T('Gördüm tabii, seni hemen fark ettim', 'Yalancı, ama tatlısın.'), T('Maçta göremedim, kızma', 'Kızmadım ama bir dahaki sefere bak!')]),
          E('console', 'Üzülme, ben hep yanındayım.', X.loss, true),
          E('inj', 'Sana çorba yaptım, iyileşene kadar sana ben bakarım.', X.inj, true),
        ], gfR) });
    }
    // ---- Hoca ----
    if (!X.street) {
      const meet = (t, ok) => A(t, ok, talk, { once });
      const coachR = {
        instr: [T(W('ci', ['Anlaşıldı hocam', 'Tamam hocam']), W('cio', ['Güzel. Sahada görelim.', 'Göreceğiz.'])), meet('Ofisinize geleyim hocam, konuşalım', 'Gel bakalım, kapım açık.')],
        info: [T('Orada olacağım hocam', 'İyi. Rakibi iyi çalış.'), meet('Toplantıdan önce sizinle konuşabilir miyim?', 'Gel, 15 dakikam var.')],
        praise: [T('Teşekkürler hocam, daha iyisi gelecek', 'Ben de bunu bekliyorum.'), T('Takım sayesinde hocam', 'Alçakgönüllülüğün hoşuma gidiyor.')],
        crit: [T('Haklısınız hocam, düzelteceğim', 'Antrenmanda göster.'), meet('Hocam, bunu yüz yüze konuşabilir miyiz?', 'Yarın sabah ofisime gel.')],
        bench: [T('Hazırım hocam, fırsat bekliyorum', 'Antrenmanda görelim.'), meet('Neden oynamadığımı konuşmak istiyorum hocam', 'Gel, açık konuşalım.')],
        inj: [T('Teşekkürler hocam, sabırla çalışıyorum', 'Doğrusu bu.'), T('Bir an önce dönmek istiyorum hocam', 'Acele edersen daha uzun kalırsın.')],
      };
      coachR.def = coachR.instr;
      out.push({ id: 'coach', n: 'Hoca', role: `Teknik direktör · ${Game.teamName()}`, c: 'linear-gradient(135deg,#9aa6c4,#4b5878)', i: 'H',
        ...conv('coach', [
          ...(X.inj ? [E('inj', 'Rehabilitasyon programını aksatma, takım seni bekliyor.'), E('inj', 'Fizyoterapistten iyi haberler alıyorum, sabırlı ol.')] : [
            E('instr', 'Antrenmanda daha fazla çalışmanı istiyorum.'), E('instr', 'Bu hafta seni izliyorum, hazır ol.'), E('instr', 'Dinlenmeyi ihmal etme, fikstür yoğun.'),
            E('instr', 'Takım savunmasına daha çok yardım et.', pos === 'FW' || pos === 'MF'), E('instr', 'Pres yaparken daha agresif ol.', out11), E('instr', 'İlk dokunuşun çok önemli, üzerinde çalış.', out11),
            E('instr', 'Topu kaybettikten sonraki 5 saniye çok önemli.', out11), E('instr', 'Uzun degajlarını daha isabetli at.', X.gk), E('instr', 'Duran toplarda savunmayı sen yönet.', X.gk || pos === 'DF'),
            E('info', `Bu hafta rakip ${X.nx ? X.nx.t : ''}. Perşembe 10:00'da taktik toplantısı var.`, X.nxL)]),
          E('praise', 'Formun iyi, böyle devam.', X.played && !X.poor && !X.loss),
          E('praise', 'İyi oyundu, golün takımı rahatlattı.', X.win && X.goals, true), E('praise', 'Son maçta harikaydın, devam.', X.star || X.motm, true),
          E('instr', 'Bu yenilgiyi hepimiz analiz edeceğiz. Yarın video toplantısı var.', X.loss && !X.poor, true),
          E('crit', 'Son maçta beklentimin altındaydın.', X.poor, true),
          E('bench', 'Bu hafta antrenmanda kendini göster, şansın gelecek.', X.bench, true),
          E('inj', 'Sağlık ekibiyle konuştum, acele etmiyoruz.', X.inj, true),
        ], coachR) });
    }
    // ---- Takım grubu ----
    if (!X.street) {
      const tinv = (t, acc, ok, c = true, x = false) => E('invite', t, c, x, [A(acc, ok, team), T('Bu sefer pas, dinleneceğim', 'Tamam, kendine iyi bak.')]);
      const teamR = { def: [T('Aynen beyler', 'Haha, aynen!')] };
      out.push({ id: 'team', n: 'Takım Grubu', role: Game.teamName(), c: 'linear-gradient(135deg,#7fb2ff,#1e5bd8)', i: 'T',
        ...conv('team', [
          tinv('Akşam hep beraber yemeğe çıkıyoruz, geliyor musun?', 'Geliyorum!', 'Süper, masa ayırtıyoruz.'),
          tinv('Yarın antrenmandan önce kahve?', 'Ben varım!', 'Saat 9\'da kafede.'),
          E('chat', 'Malzemeci yine forma numaralarını karıştırmış.', true, false, [T('Hahaha, yine mi?', 'Her hafta aynı hikâye!'), T('Benimki doğru geldi neyse ki', 'Şanslısın!')]),
          E('chat', 'Soyunma odasında müzik sırası kimde?', true, false, [T('Bende! Listeyi hazırladım', 'Yine mi o şarkılar...'), T('Kaptan seçsin', 'Kaptan da hep aynı şarkıyı açıyor!')]),
          E('chat', 'Kaptan doğum günü pastası getirdi!', true, false, [T('Bana bir dilim ayırın!', 'Çabuk gel, bitiyor!'), T('İyi ki doğdun kaptan!', 'Kaptan: Sağ olun beyler!')]),
          E('chat', 'Kim konsol turnuvasına katılıyor?', true, false, [A('Ben varım, kupayı alırım!', 'Görürüz bakalım!', team), T('Bu sefer izleyeceğim', 'Korktun mu yoksa?')]),
          E('chat', 'Yeni gelen çocuğa hoş geldin diyelim.', true, false, [T('Hoş geldin kardeşim!', 'Yeni oyuncu: Teşekkürler abi!'), A('Akşam onu yemeğe götürelim', 'Süper fikir, ben ayarlıyorum.', team)]),
          E('chat', 'Antrenmana en geç gelen kahveleri ısmarlıyor!', true, false, [T('Ben erkenciyim, sizden bilirim', 'Göreceğiz yarın!'), T('Eyvah, ben genelde son gelirim', 'Cüzdanı hazırla!')]),
          tinv('Kazandık! Akşam kutlama var!', 'Ben de geliyorum!', 'Masa ayırttık!', X.win, true),
          E('console', 'Kafalar dik, hafta sonu telafi ederiz.', X.loss, true, [T('Aynen, hep beraber kalkacağız', 'Böyle konuş işte!'), T('Antrenmanda daha çok çalışalım', 'Varız!')]),
          E('star', X.nG >= 2 ? 'Golcümüz şov yaptı!' : 'Golün çok güzeldi kardeşim!', X.goals, true, [T('Takım olarak kazandık beyler', 'Alçakgönüllü yıldız!'), A('Bu akşam yemekler benden!', 'Duydunuz beyler!', team)]),
          E('star', 'Kalede duvar ördün kardeşim!', X.gk && X.cs, true, [T('Savunma sayesinde beyler', 'Hep beraber!'), A('Bu akşam yemekler benden!', 'Duydunuz beyler!', team)]),
          E('inj', 'Geçmiş olsun kardeşim, seni bekliyoruz.', X.inj, true, [T('Sağ olun beyler, yakında dönüyorum', 'Çabuk dön!'), T('Maçta sizi izleyeceğim', 'Senin için kazanacağız!')]),
        ], teamR) });
    }
    // ---- Menajer ----
    if (L.manager) {
      const agR = {
        info: [T('Teşekkürler, sen bilirsin', 'Merak etme, işimi biliyorum.'), T('Büyük kulüp gelirse haber ver', 'İlk sen duyarsın.')],
        scout: [T('Harika, elimden geleni yapacağım', 'Rahat oyna, baskı yapma kendine.'), T('Hangi kulüp?', 'Şimdilik söyleyemem, ama büyük bir kulüp.')],
        tv: [T('Şimdilik maçlara odaklanayım', 'Anlıyorum, nazikçe reddederim.'), T('Olur, tarih ayarla', 'Tamam, ayarlayınca haber veririm.')],
        hot: [T('Sen telefonu açık tut', 'Hiç kapatmıyorum zaten!'), T('Önce sahada, sonra pazarlık', 'Doğru düşünüyorsun.')],
      };
      agR.def = agR.info;
      out.push({ id: 'agent', n: L.manager.name, role: 'Menajer', c: 'linear-gradient(135deg,#ffcf3f,#e08d0c)', i: L.manager.name[0],
        ...(L.offers && L.offers.length ? { m: `${L.offers.length} sponsor teklifi seni bekliyor. Menajer uygulamasına koydum.`, mk: 'offers', force: true, r: [{ t: 'Teklifleri göster', open: 'agent', ok: 'Hepsini uygulamaya koydum.' }, T('Sonra bakarım', 'Tamam, beklemede tutuyorum.')] }
          : conv('agent', [
            E('info', 'Transfer dönemi yaklaşıyor, kulaklarımız açık.'), E('info', 'Sözleşme maddelerini tekrar gözden geçirdim.'), E('info', 'Performansın değerini artırıyor, böyle devam.', X.played && !X.poor),
            E('info', 'Bir marka seninle çalışmak istiyor olabilir, takipteyim.', X.fame >= 10),
            E('scout', 'Bir kulübün scout\'u seni izlemeye geldi.'), E('tv', 'Bir televizyon programı seni konuk etmek istiyor.', X.fame >= 25),
            E('hot', 'Gol attıkça telefonum susmuyor!', X.goals, true), E('hot', 'Son performansın değerini yükseltti.', X.star || X.motm, true),
          ], agR)) });
    }
    // ---- Arkadaşlar ----
    const FJ = (meet, busy) => ({
      journalist: E('job', 'Seninle kısa bir röportaj yapabilir miyim?', true, false, [T('Olur, ama kulüp izin verirse', 'Anlaştık, menajerine yazarım.'), T('Arkadaşa röportaj olmaz, kahve içeriz', 'Haha, haklısın!')]),
      agent: E('job', 'Menajerlik işleri iyi gidiyor, bir gün beraber çalışalım.', true, false, [T('Neden olmasın, konuşuruz', 'Sözünü tutacağım!'), T('Şimdilik menajerimden memnunum', 'Anlıyorum, kapım açık.')]),
      pro: E('job', 'Bu hafta bizim maç zor geçti, seninki nasıldı?', X.f, false, [T(X.win ? 'İyi geçti, kazandık' : X.loss ? 'Bizimki de zor geçti, kaybettik' : 'Berabere bitti, idare eder', 'Sezon uzun, devam!'), T('Sizin maçı izledim, iyi mücadele ettiniz', 'Sağ ol kanka!')]),
      doctor: E('job', 'Kendine dikkat et, sakatlık şakaya gelmez!', true, false, [T('Sağ ol doktor, dikkat ediyorum', 'Isınmayı ihmal etme!'), T('Bir şey olursa ilk seni ararım', 'Her zaman buradayım.')]),
      chef: E('job', 'Restorana gel, sana özel bir menü hazırlarım.', true, false, [meet('Bu hafta gelirim!', 'Masan hazır olacak!'), busy]),
      teacher: E('job', 'Öğrencilerim senin posterini duvara astı!', true, false, [T('Onlara selamımı söyle', 'Çok sevinecekler!'), T('Bir gün okula gelip onlarla tanışayım', 'Ciddi mi? Bayılacaklar!')]),
      coach: E('job', 'Altyapıda çocuklara seni örnek gösteriyorum.', true, false, [T('Onlara iyi bak hocam', 'Merak etme, senin gibi yetişecekler.'), T('Çok gurur duydum, sağ ol', 'Hak ediyorsun.')]),
      other: E('job', 'Yeni bir iş buldum, kutlayalım!', true, false, [meet('Tebrikler! Bu hafta kutlayalım', 'Yeri ben seçiyorum!'), T('Tebrikler kanka, çok sevindim', 'Sağ ol kanka!')]),
    });
    (typeof Friends !== 'undefined' && Friends.on && Friends.on() ? Friends.list() : []).forEach((f, i) => {
      const fid = 'f' + (f.id != null ? f.id : i), key = 'fr' + (f.id || i);
      const meet = (t, ok) => A(t, ok, () => friendMeet(f));
      const busy = X.kid ? T('Bugün antrenmanım var, yarın oynarız', 'Tamam, yarın!') : T(W(key + 'b', ['Yoğun dönem kanka, sezon arası buluşalım', 'Bu hafta olmaz kanka, maç haftası']), W(key + 'bo', ['Tamam ama unutma!', 'Anlaşıldı, haberleşiriz.']));
      const job = f.job ? FJ(meet, busy)[f.job] || null : null;
      const frR = {
        invite: [meet(X.kid ? 'Olur, topu ben getiririm!' : W(key + 'm', ['Bu hafta buluşalım', 'Akşam bir kahve içelim']), W(key + 'mo', ['Söz mü? Bekliyorum!', 'Süper, görüşürüz!', 'Harika, çok özledim!'])), busy],
        nost: [T('O günleri çok özledim', 'Ben de kanka, ne günlerdi.'), meet('Bu hafta buluşalım, eski günleri konuşuruz', 'Süper, eski ekibi de çağırırım!')],
        ask: [T('Tamam, bir tane ayarlarım', 'Kralsın! Bayılacak.'), T('Kulüpten sorayım, söz vermeyeyim', 'Tamam kanka, sorun değil.')],
        congrats: [T(W(key + 'c', ['Sağ ol kanka!', 'Eyvallah kanka!']), W(key + 'co', ['Hep arkandayız!', 'Daha çok gol bekliyoruz!'])), meet('Bu akşam kutlayalım', 'Yeri ben seçiyorum!')],
        console: [T('Sağ ol kanka, toparlanacağız', 'Biliyorum, sen yaparsın.'), meet('Bu akşam çıkalım, kafam dağılsın', 'Tamam, 8\'de seni alıyorum.')],
        inj: [T('Sağ ol kanka, iyiyim', 'Bir şey lazım olursa ara.'), meet('Gel bir kahve iç, evdeyim', 'Geliyorum, tatlı da getiriyorum.')],
        ticket: [T('Süper, bağır da duyayım!', 'Sesim kısılana kadar!'), meet('Maçtan sonra buluşalım', 'Anlaştık, stadın önünde beklerim.')],
        hw: [T('Yaptım, teneffüste gösteririm', 'Sen bir tanesin!'), T('Ben de yapmadım daha', 'Eyvah, öğretmen kızacak!')],
      };
      frR.def = frR.invite;
      out.push({ id: fid, n: f.n, role: f.job && typeof FR_JOB !== 'undefined' ? FR_JOB[f.job] : 'Arkadaşın', c: 'linear-gradient(135deg,#c792ff,#7b3fe4)', i: (f.n.trim()[0] || '?'),
        ...conv(key, [
          E('invite', 'Teneffüste top oynayalım mı?', X.kid), E('hw', 'Ödevi yaptın mı? Bana da gösterir misin?', X.kid), E('invite', 'Yarın okula yeni topumu getiriyorum!', X.kid),
          E('invite', 'Ne zaman görüşüyoruz? Çok oldu!', !X.kid),
          E('invite', 'Hafta sonu eski mahalle ekibiyle halı saha var, haberin olsun.', !X.kid && !X.inj, false, [meet('Gelirim, ama yavaş oynayın!', 'Sana özel kurallar, söz!'), T('Kulüp izin vermez kanka, sakatlanma riski', 'Haklısın, biz de seni tribünden izleriz.')]),
          E('nost', 'Eski okulun önünden geçtim, seni andım.', !X.kid), E('nost', 'Hâlâ o eski topunu saklıyor musun?'),
          E('ask', 'İmzalı forma lazım, kuzenim deli hayranın.', !X.street && !X.youth), E('ask', 'Kanka bana da bir forma ayarla!', !X.street),
          job,
          E('ticket', `${X.nx ? X.nx.t : ''} maçına biletimi aldım, tribündeyim!`, X.nxHome && !X.kid && !X.inj),
          E('congrats', 'Kanka maçını izledim, efsaneydin!', X.star || X.motm, true), E('congrats', 'Golünü izledim, ekrana sarıldım!', X.goals, true),
          E('console', 'Kanka kafana takma, bir maç sadece.', X.loss, true),
          E('inj', 'Geçmiş olsun kanka, bir şey lazımsa söyle.', X.inj, true),
        ], frR) });
    });
    // ---- Çocuklar ----
    (L.kids || []).forEach((k, i) => {
      const a = Math.max(0, s.season.year - k.by);
      if (a < 7 || typeof Life.kidActs !== 'function') return;
      const acts = Life.kidActs(a) || [], byKey = (key) => acts.find((x) => x[0] === key) || acts[0];
      const ka = (key, ok) => { const ak = byKey(key); return ak ? A(ak[1], ok, () => Life.kidAct(i, ak[0])) : T('Seni seviyorum', 'Ben de seni!'); };
      const kidR = {
        play: [ka('ball', 'Yaşasın!'), T('Bugün yorgunum, yarın oynarız', 'Söz mü baba?')],
        school: [T('Hepsine selam söyle!', 'Söylerim baba!'), ka(a <= 12 ? 'match' : 'talk', 'Yaşasın!')],
        ask: [T('Hafta sonu beraber bakarız', 'Yaşasın! Söz mü?'), T('Eskileri daha yeni, biraz daha giy', 'Ama baba...')],
        art: [T('Hemen buzdolabına asıyorum!', 'Hihi! Bir tane daha çizeceğim.'), T('Ressam olacaksın galiba', 'Hayır, futbolcu olacağım!')],
        congrats: [T('Bir gün sen de atacaksın şampiyon!', 'Söz baba!'), ka('ball', 'Bana da öğret!')],
        console: [T('Sağ ol canım, sen benim en büyük taraftarımsın', 'Hep öyle olacağım!'), ka(a <= 12 ? 'ball' : 'talk', 'Yaşasın!')],
        adult: [ka('dinner', 'Harika, akşam görüşürüz!'), T('Gurur duyuyorum seninle', 'Sağ ol baba.')],
        love: [T('Seni seviyorum', 'Ben de seni!'), ka(acts[0] ? acts[0][0] : 'ball', 'Yaşasın!')],
      };
      kidR.def = kidR.love;
      out.push({ id: 'kid' + i, n: k.n, role: `${a} yaş`, c: 'linear-gradient(135deg,#ffb36b,#e0672b)', i: k.n[0],
        ...conv('kid' + i, a >= 18 ? [
          E('adult', 'Baba bu hafta yemeğe gelebilir miyim?'), E('love', 'İşte her şey yolunda, merak etme.'), E('love', 'Senin eski maçlarını arkadaşlarıma izlettim!'), E('adult', 'Baba bir tavsiyene ihtiyacım var.', true, false, [ka('talk', 'Teşekkürler baba.'), T('Ne zaman istersen ara', 'Biliyorum baba.')]),
        ] : [
          E('play', 'Baba bugün top oynayalım mı?', a <= 12), E('play', 'Baba bana şut çekmeyi öğretir misin?', a <= 12),
          E('school', 'Okulda herkes senin maçını konuştu!', X.f), E('ask', 'Bana yeni krampon alır mısın?'), E('art', 'Baba okulda resim yaptım, seni çizdim!', a <= 12), E('school', 'Arkadaşlarım imzanı istiyor!'),
          E('love', 'Baba bu akşam erken gelir misin?', a > 12, false, [ka('talk', 'Yaşasın!'), T('Bu akşam geç kalacağım, yarın söz', 'Tamam baba.')]),
          E('congrats', 'Baba golünü gördüm! Ben de senin gibi olacağım!', X.goals, true),
          E('console', 'Üzülme baba, sen yine de en iyisisin.', X.loss, true),
        ], kidR) });
    });
    // herkes her hafta yazmaz: kişiye göre olasılık (bağlamlı bir sebep varsa daha olası)
    const PR = { mom: 0.5, dad: 0.35, gf: 0.6, coach: 0.3, team: 0.35, agent: 0.35 };
    out.forEach((c) => { c.pr = PR[c.id] != null ? PR[c.id] : c.id.indexOf('kid') === 0 ? 0.45 : 0.22; });
    return out;
  }
  // ---------------- sohbet geçmişi (kalıcı) ve gelen kutusu ----------------
  // d.log[kişi] = [{ w, d: 'in'|'out'|'sys', t?, h?, n?, wk? }]  (son 30 satır)
  // d.inbox = [{ id, key, w, y, src, html, btns: [etiket], seen?, keep?, ... }]  oyunun olayları (seçimli)
  const LOGMAX = 30;
  const logOf = (k) => { const d = Phone.data(); d.log = d.log || {}; return (d.log[k] = d.log[k] || []); };
  const pushLog = (k, e) => { const l = logOf(k); l.push(Object.assign({ w: Phone.week() }, e)); if (l.length > LOGMAX) l.splice(0, l.length - LOGMAX); };
  const wNum = (w) => { const [y, r] = String(w).split('-').map(Number); return (y || 0) * 100 + (r || 0); };
  const writes = (c) => c.force || Phone._all || (hstr(`${c.id}|${Phone.week()}|pr`) % 100) < ((c.pr || 0.3) + (c.ctx ? 0.25 : 0)) * 100;
  const XT = {
    Ajanda: ['Hatırlatmalar', 'linear-gradient(135deg,#7fb2ff,#1e5bd8)'], Okul: ['Okul', 'linear-gradient(135deg,#ffe58a,#f5b70a)'], Basın: ['Spor muhabiri', 'linear-gradient(135deg,#ff7a45,#e0283e)'],
    Dedem: ['Aile', 'linear-gradient(135deg,#46e08f,#1f9d5c)'], 'Taraftar Derneği': ['Taraftarlar', 'linear-gradient(135deg,#c792ff,#7b3fe4)'], 'Sağlık Ekibi': ['Kulüp', 'linear-gradient(135deg,#34c4b0,#147a6c)'],
    Vakıf: ['Yardım kuruluşu', 'linear-gradient(135deg,#ffb36b,#e0672b)'], Kulüp: ['Kulüp', 'linear-gradient(135deg,#9aa6c4,#4b5878)'],
  };
  function threadInfo(k, cs) {
    const c = (cs || contacts()).find((x) => x.id === k);
    if (c) return c;
    if (String(k).indexOf('x:') === 0) { const n = k.slice(2), x = XT[n] || ['', 'linear-gradient(135deg,#9aa6c4,#4b5878)']; return { id: k, n, role: x[0], c: x[1], i: n[0], r: [] }; }
    return null;
  }
  // bu hafta yazan kişilerin mesajı geçmişe bir kez eklenir
  function syncWeek(cs) {
    const w = Phone.week();
    cs.forEach((c) => { if (writes(c) && !logOf(c.id).some((e) => e.w === w && e.wk)) pushLog(c.id, { d: 'in', t: c.m, wk: 1, mk: c.mk }); });
  }
  // bu haftaki mesaja uygun cevaplar (kayıttaki mesaj bugünkü seçimden farklıysa türüne göre)
  function repliesOf(info, k) {
    const w = Phone.week(), e = logOf(k).filter((x) => x.w === w && x.wk).pop();
    if (!e || e.t === info.m || !e.mk || !info.R) return info.r || [];
    return info.R[e.mk] || info.R.def || info.r || [];
  }
  const pending = (k) => Inbox.list().filter((it) => it.key === k);
  function isNew(k) {
    const d = Phone.data(), w = Phone.week();
    return pending(k).some((it) => !it.seen) || (d.seen[k] !== w && logOf(k).some((e) => e.w === w && e.wk));
  }
  function unread() {
    if (!Phone.on()) return 0;
    try {
      Inbox.sweep();
      const cs = contacts(); syncWeek(cs);
      const keys = new Set(cs.map((c) => c.id).concat(Inbox.list().map((it) => it.key)));
      let n = 0; keys.forEach((k) => { if (isNew(k)) n++; });
      return n;
    } catch (e) { console.error(e); return 0; }
  }
  const lastTxt = (k) => {
    const it = pending(k)[0];
    if (it) { const t = document.createElement('div'); t.innerHTML = it.html; return t.textContent.trim(); }
    const l = logOf(k), e = l[l.length - 1];
    if (!e) return '';
    if (e.h) { const t = document.createElement('div'); t.innerHTML = e.h; return t.textContent.trim(); }
    return e.t || (e.n || []).join(' · ');
  };
  function msgList() {
    const cs = contacts(); syncWeek(cs);
    const d = Phone.data(), w = Phone.week();
    const keys = new Set(cs.map((c) => c.id).concat(Object.keys(d.log || {})).concat(Inbox.list().map((it) => it.key)));
    const rows = [...keys].map((k) => { const info = threadInfo(k, cs); const l = logOf(k); return info && (l.length || pending(k).length) ? { k, info, nw: isNew(k), lw: Math.max(l.length ? wNum(l[l.length - 1].w) : 0, ...pending(k).map((it) => wNum(it.w))) } : null; }).filter(Boolean)
      .sort((a, b) => (b.nw - a.nw) || (b.lw - a.lw));
    const body = rows.length ? rows.map(({ k, info, nw }) => `<button class="ph-thr" data-ph-th="${esc(k)}" type="button"><span class="ph-av" style="background:${info.c}">${esc(info.i)}</span><span class="ph-thr-t"><b><span>${nw ? '<i class="ph-dot"></i>' : ''}${esc(info.n)}</span><small>${pending(k).length ? 'cevap bekliyor' : nw ? 'yeni' : d.rep[k] === w ? 'cevaplandı' : ''}</small></b><em>${esc(info.role)}</em><p>${esc(lastTxt(k))}</p></span></button>`).join('')
      : '<p class="ph-note">Henüz mesaj yok. Ailen, arkadaşların ve takımın zaman zaman yazacak.</p>';
    return `<div class="ph-appv">${top('Mesajlar')}<div class="ph-body">${body}</div></div>`;
  }
  const weekLbl = (w) => { if (w === Phone.week()) return '<span>Bu hafta</span>'; const [y, r] = String(w).split('-').map(Number); return `<span>${y}</span> · <span>${(r || 0) + 1}. hafta</span>`; };
  function chatView(k) {
    const cs = contacts(); syncWeek(cs);
    const info = threadInfo(k, cs);
    if (!info) { Phone.sub = null; return msgList(); }
    const d = Phone.data(), w = Phone.week(), ap = Game.state.ap;
    d.seen[k] = w;
    const its = pending(k); its.forEach((it) => (it.seen = 1));
    let lastW = null; const parts = [];
    logOf(k).forEach((e) => {
      if (e.w !== lastW) { parts.push(`<div class="ph-day">${weekLbl(e.w)}</div>`); lastW = e.w; }
      if (e.d === 'sys') parts.push(`<div class="ph-sys">${(e.n || [e.t]).filter(Boolean).map((x) => `<span>${esc(x)}</span>`).join('')}</div>`);
      else if (e.h) parts.push(`<div class="ph-bub in ph-ev">${e.h}</div>`);
      else parts.push(`<div class="ph-bub ${e.d === 'out' ? 'out' : 'in'}">${esc(e.t)}</div>`);
    });
    const it = its[0];
    const RR = repliesOf(info, k);
    const weekly = RR.length && logOf(k).some((e) => e.w === w && e.wk) && d.rep[k] !== w;
    let foot;
    if (it) foot = `<div class="ph-replies"><span class="ph-lbl2">Cevabın</span>${it.btns.map((t, i) => `<button class="ph-rep" data-ph-ibtn="${esc(it.id)}:${i}" type="button"><span>${esc(t)}</span></button>`).join('')}</div>`;
    else if (weekly) foot = `<div class="ph-replies"><span class="ph-lbl2">Cevabın</span>${RR.map((r, i) => { const dis = (r.ap && ap < r.ap) || (r.once && !r.once()); return `<button class="ph-rep" data-ph-rep="${i}" type="button" ${dis ? 'disabled' : ''}><span>${esc(r.t)}</span>${r.ap ? `<em>${r.ap} aksiyon</em>` : r.open ? '<em>uygulamayı aç</em>' : ''}</button>`; }).join('')}</div>`;
    else foot = '<div class="ph-replies"><span class="ph-lbl2">Yeni mesaj gelince burada görünür.</span></div>';
    return `<div class="ph-appv">${top(`<span class="ph-ct"><span class="ph-av sm" style="background:${info.c}">${esc(info.i)}</span><span><span class="ph-ctn">${esc(info.n)}</span><small>${esc(info.role)}</small></span></span>`)}
      <div class="ph-body" id="ph-chat"><div class="ph-chat" data-emo>${parts.join('')}${it ? `<div class="ph-bub in ph-ev">${it.html}</div>` : ''}</div></div>${foot}</div>`;
  }

  // ---------------- çizimler ----------------
  // 1.0.25: görseller Vitrin stilinde (MallArt) çizilir
  const HV = { flat: 0, penthouse: 1, villa: 2, island: 6 }, CV = { hatch: 0, suv: 2, sport: 4, classic: 5 };
  const ARTI = (o) => `<img class="vt-${o.t === 'house' ? 'home' : 'car'} k-${o.t}" alt="" loading="lazy" src="${MallArt.url(o)}">`;
  function houseSvg(kind) {
    if (typeof MallArt !== 'undefined') return ARTI({ t: 'house', v: HV[kind] != null ? HV[kind] : 0, c: kind === 'flat' ? '#d9cdb9' : '#efe4cf', c2: '#2e3a4a' });
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
  const ART2 = { moto: { t: 'moto', c: '#c8102e', metal: 'silver' }, scooter: { t: 'scooter', c: '#2a2d33' }, ebike: { t: 'bike', c: '#1f6e4a', metal: 'silver', v: 5, show: 1 }, life6: { t: 'yacht' }, jet: { t: 'jet' } };
  // araç özellikleri: [hız, 0-100 (sn), güç, birim] — birimler çevrilebilir kalıplarla yazılır
  const CAR_SPEC = { hatch: [185, '9,8', 110, 'bg'], suv: [250, '5,4', 420, 'bg'], life4: [330, '2,9', 720, 'bg'], classic: [240, '6,2', 350, 'bg'], moto: [245, '3,1', 160, 'bg'], scooter: [25, '', 1, 'kW'], ebike: [25, '', 250, 'W'], life6: [0, '', 3600, 'bg', 38], jet: [950, '', 12, 'kişi'] };
  const specTxt = (id) => { const x = CAR_SPEC[id]; if (!x) return ['—', '—', '—']; const pw = x[3] === 'bg' ? `${x[2]} bg` : x[3] === 'kişi' ? `${x[2]} kişi` : `${x[2]} ${x[3]}`; return [x[4] ? `${x[4]} knot` : `${x[0]} km/sa`, x[1] ? `${x[1]} sn` : '—', pw]; };
  function carSvg(kind, col) {
    if (typeof MallArt !== 'undefined') return ARTI({ t: 'car', v: CV[kind] != null ? CV[kind] : 0, c: col, metal: kind === 'sport' || kind === 'classic' ? 'gold' : 'silver' });
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
  // Ücretli uygulamalar: yalnız sahibi içini görür; diğerleri kilitli simgeye dokununca tanıtımı görür (ürünler gösterilmez)
  const hasStar = () => typeof Star !== 'undefined' && Star.has();
  const hasDia = () => typeof Diamond !== 'undefined' && !!Diamond.active;
  const sellable = () => typeof Premium !== 'undefined' && Premium.available && Premium.available();
  const LOCK = { lux: () => !hasStar(), dia: () => !hasDia() };
  function apps() {
    const out = [{ k: 'life', n: 'Hayatım', bg: 'linear-gradient(135deg,#ff6f8a,#c2416b)' }];
    if (typeof School !== 'undefined' && School.on()) out.push({ k: 'school', n: 'Okul', bg: 'linear-gradient(135deg,#ffe58a,#f5b70a)' });
    out.push(
      { k: 'agent', n: 'Menajer', bg: 'linear-gradient(135deg,#ffd76a,#e0a10e)' },
      { k: 'wiki', n: 'Starpedia', bg: '#ffffff' },
      { k: 'emlak', n: 'Evim Emlak', bg: 'linear-gradient(135deg,#14a08d,#0b5e53)' },
      { k: 'cars', n: 'Arabalar', bg: 'linear-gradient(135deg,#2a2a31,#0d0d10)' },
      { k: 'sport', n: 'Spor Mağazası', bg: 'linear-gradient(135deg,#2bd46a,#0b7a3a)' },
      { k: 'shop', n: 'Alışveriş', bg: 'linear-gradient(135deg,#a855f7,#6d28d9)' },
      { k: 'store', n: 'TeknoPazar', bg: 'linear-gradient(135deg,#ff7a45,#e0283e)' },
    );
    if (typeof Star !== 'undefined' && !Game.inStreet() && (hasStar() || sellable())) out.push({ k: 'lux', n: 'Lüks', bg: 'linear-gradient(150deg,#2b2213,#0d0a05)' });
    if (typeof Diamond !== 'undefined' && Diamond.enabled() && (hasDia() || sellable())) out.push({ k: 'dia', n: 'Diamond', bg: 'linear-gradient(150deg,#123a6b,#061833)' });
    (Phone.ext || []).forEach((a) => { try { if (!a.on || a.on()) out.push(a); } catch (e) { /* yok */ } });
    out.push({ k: 'prem', n: 'StarFoot+', bg: 'linear-gradient(140deg,#fff1b8,#ffcf3f 45%,#c98a06)' }, { k: 'set', n: 'Ayarlar', bg: 'linear-gradient(135deg,#8a93a6,#4b5363)' });
    return out;
  }
  const DOCK = [
    { k: 'msg', n: 'Mesajlar', bg: 'linear-gradient(135deg,#5ee27a,#1fa646)' },
    { k: 'feed', n: 'StarFeed', bg: 'linear-gradient(150deg,#16306f,#0a1530)' },
    { k: 'cal', n: 'Takvim', bg: '#ffffff' },
    { k: 'bank', n: 'Banka', bg: 'linear-gradient(135deg,#1f4fbf,#0e2a6b)' },
  ];
  function appIcon(a) {
    const L = Phone.p().life || {};
    let badge = a.k === 'msg' ? unread() : a.k === 'agent' ? (L.offers || []).length : a.k === 'life' ? (L.babyNew ? 1 : 0) : 0;
    if (a.badge) try { badge = a.badge() || 0; } catch (e) { badge = 0; }
    const lk = LOCK[a.k] && LOCK[a.k]();
    const td = today();
    const ic = a.k === 'cal' ? calIcon(td.getDate(), WD[mon(td)].toUpperCase()) : a.ic || IC[a.k];
    return `<button class="ph-app" data-ph-open="${a.k}" type="button" aria-label="${a.n}"><span class="ph-ic" style="background:${a.bg}">${ic}${badge ? `<span class="ph-badge">${badge}</span>` : ''}${lk ? `<span class="ph-lk">${IC.lock}</span>` : ''}</span><span class="ph-an">${a.n}</span></button>`;
  }
  function homeView() {
    const s = Game.state, p = s.player;
    const nm = nextMatch();
    const next = nm ? `<span class="ph-big">${esc(nm.t)}</span><small>${esc(nm.sub)}</small>` : '<span class="ph-big">Sezon bitti</span><small>Yeni sezonu bekle</small>';
    const whenTxt = nm ? `<small class="ph-wk">${dateLbl(nm.date)} · ${nm.h}</small>` : '';
    const bar = (l, v, c) => `<div><span>${l}</span><div class="ph-bar"><i style="width:${U.clamp(v, 0, 100)}%;background:${c}"></i></div></div>`;
    return `<div class="ph-home">
      <div class="ph-wgs">
        <button class="ph-wg" data-ph-open="cal" type="button"><span class="ph-lbl">Sıradaki maç</span>${next}${whenTxt}</button>
        <button class="ph-wg" data-ph-open="stat" type="button"><span class="ph-lbl">Durum <i class="ph-more">›</i></span><div class="ph-mini">${bar('Aile', p.rel.family, '#46e08f')}${bar('Hoca', p.rel.coach, '#9aa6c4')}${bar('Moral', p.morale, '#ffcf3f')}${bar('Enerji', p.energy, '#7fb2ff')}</div><small class="ph-wk">${s.ap} aksiyon hakkı</small></button>
      </div>
      <div class="ph-apps">${apps().map(appIcon).join('')}</div>
      <div class="ph-dock">${DOCK.map(appIcon).join('')}</div>
    </div>`;
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
      ${Phone.bankExtra ? Phone.bankExtra() : ''}<div class="ph-inc"><div><span>Haftalık maaş</span><b class="pos">${money(inc)}</b></div><div><span>Sponsor geliri</span><b class="pos">${money(sp)}</b></div><div><span>Menajer payı</span><b class="${cut ? 'neg' : ''}">${cut ? '-' + money(cut) : '—'}</b></div><div><span>Haftalık net</span><b class="pos">${money(inc + sp - cut)}</b></div></div>
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
    const col = { match: '#e5383b', cup: '#f59e0b', intl: '#7b3fe4', train: '#2f6ee8', fam: '#22a55a' };
    for (let dd = 1; dd <= days; dd++) {
      const d = new Date(m.getFullYear(), m.getMonth(), dd), k = key(d), es = ev[k] || [];
      const kinds = [...new Set(es.map((e) => e.k))].slice(0, 3);
      cells += `<button class="${mon(d) >= 5 ? 'we' : ''} ${k === key(td) ? 'today' : ''} ${k === sel ? 'sel' : ''}" data-ph-day="${k}" type="button"><span class="n">${dd}</span><span class="dots">${kinds.map((x) => `<i style="background:${col[x]}"></i>`).join('')}</span></button>`;
    }
    const [sy, sm, sd] = sel.split('-').map(Number), sdate = new Date(sy, sm, sd);
    const list = (ev[sel] || []).slice().sort((a, b) => a.h.localeCompare(b.h));
    const tint = { match: ['#fde8e8', '#8f1d1f', '#e5383b'], cup: ['#fef3e2', '#8a5a07', '#f59e0b'], intl: ['#f1e8fe', '#4c1d95', '#7b3fe4'], train: ['#e6efff', '#1b3f8f', '#2f6ee8'], fam: ['#e4f7ec', '#14653a', '#22a55a'] };
    return `<div class="ph-appv ph-cal">${top('Takvim')}<div class="ph-body">
      <div class="ph-mhead"><h3><span class="mn">${MONTHS[m.getMonth()]}</span> <span>${m.getFullYear()}</span></h3><div class="ph-mnav"><button type="button" data-ph-mon="-1" aria-label="Önceki ay">‹</button><button type="button" data-ph-mon="0">Bugün</button><button type="button" data-ph-mon="1" aria-label="Sonraki ay">›</button></div></div>
      <div class="ph-wkd">${WD.map((x) => `<span>${x}</span>`).join('')}</div>
      <div class="ph-mgrid">${cells}</div>
      <div class="ph-agenda"><h4><span>${sdate.getDate()}</span> <span>${MONTHS[sdate.getMonth()]}</span> <span>${WDL[mon(sdate)]}</span>${sel === key(td) ? ' · <span>Bugün</span>' : ''}</h4>
        ${list.length ? list.map((e) => `<div class="ph-ag"><span class="tm">${e.h || 'Tüm gün'}</span><div class="bx" style="background:${tint[e.k][0]};color:${tint[e.k][1]};border-left:4px solid ${tint[e.k][2]}">${e.k === 'match' || e.k === 'cup' || e.k === 'intl' ? `${esc(e.t)}${e.res ? ` <b class="${e.win > 0 ? 'w' : e.win < 0 ? 'l' : 'd'}">${e.res}</b>` : ''}` : esc(e.t)}<small>${esc(e.s)}</small></div></div>`).join('') : '<div class="ph-noev">Etkinlik yok. Dinlenme günü.</div>'}
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
    const live0 = list.filter((it) => owns(it.id)).sort((a, b) => b.price - a.price)[0];
    const nh = typeof Mall !== 'undefined' ? Mall.homeOf() : null;
    const live = nh && (!live0 || nh.price > live0.price) ? null : live0;
    const liveNew = nh && !live ? nh : null;
    return `<div class="ph-appv ph-emlak">${top('Evim Emlak')}<div class="ph-body">
      <div class="ph-search">${IC.search}<span>Satılık evler</span></div>
      ${liveNew ? `<div class="ph-listing cur"><div class="pic">${ARTI(liveNew.art)}<span class="own3">Burada yaşıyorsun</span></div><div class="inf"><div class="pr3">${money(liveNew.price)}</div><div class="tt"><span>${esc(liveNew.tn)}</span> · <span>${esc(liveNew.bn)}</span></div></div></div>` : ''}<div class="ph-listing cur"><div class="pic">${houseSvg('flat')}${live || liveNew ? '' : '<span class="own3">Şu an yaşadığın</span>'}</div><div class="inf">${Phone.p().age < 18 ? `<div class="pr3">${live || liveNew ? 'Eski evin' : 'Ailenle yaşıyorsun'}</div><div class="tt">Aile evi</div><div class="mt">3+1 · 120 m² · Mahalle</div>` : `<div class="pr3">${live || liveNew ? 'Eski evin' : 'Kiradasın'}</div><div class="tt">Kiralık daire</div><div class="mt">2+1 · 95 m² · Şehir merkezi</div>`}</div></div>
      ${typeof Mall !== 'undefined' ? Mall.homesHtml() : ''}<div class="ph-secl">Özel portföy</div>
      ${list.map((it) => `<div class="ph-listing"><div class="pic">${houseSvg(HOUSE_KIND[it.id])}${live === it ? '<span class="own3">Burada yaşıyorsun</span>' : owns(it.id) ? '<span class="own3">Senin</span>' : ''}</div><div class="inf"><div class="row"><div><div class="pr3">${money(it.price)}</div><div class="tt">${esc(it.name)}</div></div>${buyBtn(it, 'ph-buy em')}</div><div class="fx3">${esc(it.desc)}</div></div></div>`).join('')}
    </div></div>`;
  }
  function carsView() {
    const list = ITEMS.filter((it) => it.cat === 'ride' && visible(it)).sort((a, b) => a.price - b.price);
    const locked = ITEMS.filter((it) => it.cat === 'ride' && !visible(it)).sort((a, b) => a.minAge - b.minAge).slice(0, 2);
    const card = (it) => { const k = CAR_KIND[it.id], sp = specTxt(it.id); return `<div class="ph-car"><div class="stage">${k ? carSvg(k, CAR_COL[k]) : typeof MallArt !== 'undefined' && ART2[it.id] ? ARTI(ART2[it.id]) : `<span class="art">${itemArt(it)}</span>`}${owns(it.id) ? '<span class="gar">GARAJINDA</span>' : ''}</div><div class="inf"><h4>${esc(it.name)}</h4>
        <div class="spec"><div><span>Azami hız</span><b>${sp[0]}</b></div><div><span>0-100</span><b>${sp[1]}</b></div><div><span>Motor gücü</span><b>${sp[2]}</b></div></div>
        <div class="ds">${esc(it.desc)}</div><div class="row">${buyBtn(it, 'ph-buy red')}</div></div></div>`; };
    return `<div class="ph-appv ph-cars">${top('<span class="r">Arabalar</span>')}<div class="ph-body">${list.map(card).join('')}${locked.map(card).join('')}${typeof Mall !== 'undefined' ? '<div class="ph-secl">Garaj klasikleri</div>' : ''}${!list.length && !locked.length ? '<p class="ph-note">Şu an satışta araç yok.</p>' : ''}<p class="ph-note">Araba ve motor için ehliyet gerekir.</p>${typeof Mall !== 'undefined' ? Mall.carsHtml() : ''}</div></div>`;
  }
  // evler Evim Emlak'ta, telefonlar TeknoPazar'da, araçlar Arabalar'da satılır; alışveriş'te hobi, eğlence ve stil kalır
  const shopExcl = () => Object.keys(HOUSE_KIND).concat(TIERS.map((t) => t.item).filter(Boolean));
  Phone.shopExcl = () => shopExcl();
  function shopView() {
    if (typeof Mall !== 'undefined') return Mall.view();
    return `<div class="ph-appv ph-shop">${top('Alışveriş')}<div class="ph-body"><div class="ph-promo"><b>Yıldız indirimi</b><small>Hobi, eğlence, stil ve lüks ürünler</small></div>${UI.shop({ tabs: ['lux'], luxCats: ['life', 'style'], excl: shopExcl(), title: 'Yaşam Tarzı' })}</div></div>`;
  }
  function sportView() {
    return `<div class="ph-appv ph-sport">${top('Spor Mağazası')}<div class="ph-body"><div class="ph-promo"><b>Sahaya hazır ol</b><small>Enerji içeceği, fizyoterapi, krampon, ekipman, beslenme ve toplar</small></div>${UI.shop({ tabs: ['bag', 'cons', 'kit', 'balls'], title: 'Spor Mağazası' })}</div></div>`;
  }
  // ---------------- StarFeed: akış (hikâyeler + gönderiler) ve profil ----------------
  const AVC = ['#ff6f8a', '#7fb2ff', '#46e08f', '#ffcf3f', '#c792ff', '#ffb36b', '#34c4b0', '#9aa6c4'];
  const avatar = (name, cls = '') => { const n = String(name || '?').trim(); const c = AVC[hstr(n) % AVC.length]; return `<span class="ph-fav ${cls}" style="background:${c}">${esc(n[0] || '?')}</span>`; };
  const handleOf = (n) => '@' + String(n).toLocaleLowerCase('tr').replace(/[^a-z0-9çğıöşü]+/g, '').slice(0, 18);
  // fotoğraf sahneleri (özgün çizimler)
  const SCN = {
    stadium: '<defs><linearGradient id="sa" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1433"/><stop offset=".55" stop-color="#1b2f6b"/><stop offset=".56" stop-color="#2b8a46"/><stop offset="1" stop-color="#1c6a34"/></linearGradient><radialGradient id="sb"><stop offset="0" stop-color="#fff8d8"/><stop offset="1" stop-color="#fff8d8" stop-opacity="0"/></radialGradient></defs><rect width="320" height="240" fill="url(#sa)"/><path d="M0 132 L40 104 L280 104 L320 132 Z" fill="#101a3a"/><g fill="#22305e">' + Array.from({ length: 16 }, (_, i) => `<rect x="${44 + i * 15}" y="108" width="11" height="20" rx="2"/>`).join('') + '</g><circle cx="40" cy="38" r="44" fill="url(#sb)"/><circle cx="280" cy="38" r="44" fill="url(#sb)"/><rect x="38" y="36" width="4" height="70" fill="#9aa6c4"/><rect x="278" y="36" width="4" height="70" fill="#9aa6c4"/><path d="M0 200 Q160 170 320 200" stroke="rgba(255,255,255,.55)" stroke-width="2" fill="none"/><ellipse cx="160" cy="196" rx="34" ry="9" stroke="rgba(255,255,255,.55)" stroke-width="2" fill="none"/>',
    gym: '<rect width="320" height="240" fill="#1b2340"/><rect y="180" width="320" height="60" fill="#2a2f45"/><g fill="#4b5878"><rect x="40" y="40" width="8" height="140"/><rect x="272" y="40" width="8" height="140"/><rect x="40" y="70" width="240" height="6"/></g><g fill="#c9d3ef"><rect x="70" y="150" width="180" height="8" rx="4"/><rect x="58" y="128" width="16" height="52" rx="5"/><rect x="246" y="128" width="16" height="52" rx="5"/></g><g fill="#ffcf3f"><rect x="110" y="200" width="40" height="10" rx="5"/><rect x="170" y="200" width="40" height="10" rx="5"/></g>',
    train: '<rect width="320" height="240" fill="#2e8b43"/>' + Array.from({ length: 6 }, (_, i) => `<rect y="${i * 40}" width="320" height="20" fill="#2a7f3d"/>`).join('') + '<g fill="#ff8a3d">' + [[60, 70], [110, 110], [160, 70], [210, 110], [260, 70]].map(([x, y]) => `<path d="M${x} ${y}l9 22h-18z"/>`).join('') + '</g><circle cx="160" cy="180" r="16" fill="#fff"/><path d="M160 170l7 5-3 8h-8l-3-8z" fill="#111"/>',
    plane: '<rect width="320" height="240" fill="#0d1b3d"/><rect x="70" y="20" width="180" height="200" rx="80" fill="#cfe6ff"/><rect x="82" y="32" width="156" height="176" rx="70" fill="url(#pl)"/><defs><linearGradient id="pl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5ab0ff"/><stop offset="1" stop-color="#d9efff"/></linearGradient></defs><g fill="#fff"><ellipse cx="130" cy="150" rx="40" ry="14"/><ellipse cx="190" cy="128" rx="34" ry="11"/><ellipse cx="160" cy="176" rx="48" ry="12"/></g>',
    food: '<rect width="320" height="240" fill="#6b4a2b"/><rect width="320" height="240" fill="url(#fw)" opacity=".35"/><defs><pattern id="fw" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M0 20h40" stroke="#4e3420" stroke-width="3"/></pattern></defs><circle cx="160" cy="120" r="84" fill="#f4f1ea"/><circle cx="160" cy="120" r="64" fill="#fff"/><g><circle cx="140" cy="108" r="16" fill="#46e08f"/><circle cx="174" cy="102" r="14" fill="#ff6f64"/><rect x="138" y="128" width="50" height="22" rx="10" fill="#e8b46b"/></g>',
    run: '<defs><linearGradient id="rn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a5b"/><stop offset=".6" stop-color="#ffd08a"/><stop offset=".61" stop-color="#3d4a5c"/><stop offset="1" stop-color="#2a3442"/></linearGradient></defs><rect width="320" height="240" fill="url(#rn)"/><circle cx="160" cy="140" r="34" fill="#fff3c4"/><path d="M150 240 L170 240 L164 146 L156 146 Z" fill="#c9d3ef" opacity=".7"/>',
    locker: '<rect width="320" height="240" fill="#1d2433"/>' + [0, 1, 2, 3].map((i) => `<rect x="${20 + i * 72}" y="20" width="64" height="200" rx="4" fill="#2c3650"/><rect x="${30 + i * 72}" y="60" width="44" height="54" rx="6" fill="${['#e5383b', '#2f6ee8', '#ffcf3f', '#46e08f'][i]}"/><text x="${52 + i * 72}" y="96" text-anchor="middle" font-size="22" font-weight="900" fill="#fff" font-family="Barlow Semi Condensed, sans-serif">${[7, 10, 4, 23][i]}</text>`).join(''),
  };
  const scene = (k) => `<div class="ph-fimg"><svg viewBox="0 0 320 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${SCN[k] || SCN.train}</svg></div>`;
  const FANS = ['tribundeyiz', 'futbol_ask', 'kale_arkasi', 'ofsayt_degil', 'forvetsever', 'yesil_saha', 'son_dakika_gol', 'taraftar_ruhu'];
  const CM = {
    win: ['Helal olsun!', 'Böyle devam!', 'Bu takım başka!', 'Üç puan cebimizde!'], loss: ['Toparlanacağız.', 'Her zaman arkanızdayız.', 'Kafalar dik!'], draw: ['Bir puan da puan.', 'Daha iyisini yaparız.'],
    me: ['Kral!', 'Yıldız doğuyor!', 'Formasını aldım bile.', 'Bu çocuk çok iyi olacak.'], gen: ['Harika kare!', 'Efsane!', 'Başarılar!', 'Bayıldım.'], news: ['Vay be!', 'Bunu bekliyordum.', 'Sonunda!'],
    pre: ['Hadi çocuklar!', 'Bugün bizim günümüz!', 'Üç puan istiyoruz!', 'Stattayız!'], stat: ['Yarış kızışıyor.', 'Bu sezon bizim!', 'Takipteyiz.'],
  };
  const comments = (id, pool) => { const h = hstr(`${Phone.week()}|c|${id}`), P = CM[pool] || CM.gen; const a = (h >>> 1) % P.length, b = (a + 1 + ((h >>> 6) % (P.length - 1))) % P.length, f = (h >>> 11) % FANS.length; return [a, b].map((t, i) => ({ u: FANS[(f + i * 3) % FANS.length] + ((h >>> (i * 3 + 2)) % 90 + 10), t: P[t] })); };
  function feedPosts() {
    const s = Game.state, p = s.player, w = Phone.week(), out = [], me = Player.fullName(p), X = ctxNow(), r = s.lastReport;
    const n = (k, a, b) => a + (hstr(`${w}|${k}`) % (b - a));
    const hrs = (k, a, b) => n('t' + k, a, b);
    if (!Game.inStreet()) {
      const cn = Game.teamName(), club = Game.club() || {};
      const big = Math.max(1, (Game.teamRating(s.clubId) || 60) - 40);
      const nm = nextMatch();
      // kulüp: maç günü afişi (tarih ve saat takvimle aynı)
      if (nm && (nm.k === 'match' || nm.k === 'cup')) out.push({ id: 'pre', who: cn, club: true, h: hrs('pre', 1, 6), loc: club.city || '', kind: 'poster', nm, txt: 'Maç günü! Hep birlikte!', likes: n('pre', 300, 900) * big, cm: comments('pre', 'pre'), nc: n('prec', 20, 200) });
      const intlRes = Phone.data().lastComp === 'intl';
      if ((X.win || X.loss || X.draw) && intlRes) {
        const nat = Game.nation() || {};
        out.push({ id: 'res', who: `${nat.name || ''}`, natTeam: true, h: hrs('res', 14, 40), kind: 'score', a: nat.name || '', b: r.opp, ga: r.gf, gb: r.ga, res: r.res, scorer: r.goals > 0 ? me : '', txt: r.res === 'W' ? 'Galibiyet! Desteğiniz için teşekkürler.' : r.res === 'L' ? 'Bugün olmadı. Toparlanıp geri döneceğiz.' : 'Bir puanla dönüyoruz.', likes: n('res', 5000, 40000), cm: comments('res', X.win ? 'win' : X.loss ? 'loss' : 'draw'), nc: n('resc', 200, 3000) });
      } else if (X.win || X.loss || X.draw) {
        out.push({ id: 'res', who: cn, club: true, h: hrs('res', 14, 40), kind: 'score', a: cn, b: r.opp, ga: r.gf, gb: r.ga, res: r.res, scorer: r.goals > 0 ? me : '', txt: r.res === 'W' ? 'Galibiyet! Desteğiniz için teşekkürler.' : r.res === 'L' ? 'Bugün olmadı. Toparlanıp geri döneceğiz.' : 'Bir puanla dönüyoruz.', likes: n('res', 500, 1500) * big, cm: comments('res', X.win ? 'win' : X.loss ? 'loss' : 'draw'), nc: n('resc', 40, 400) });
        if (X.goals && !intlRes) out.push({ id: 'goal', who: cn, club: true, h: hrs('goal', 16, 30), kind: 'goal', name: me, num: p.shirt, txt: `GOL! ${me}`, likes: n('goal', 600, 1800) * big, cm: comments('goal', 'me'), nc: n('goalc', 30, 300) });
        if (X.star || X.motm || X.nG >= 2) out.push({ id: 'fan', who: 'Tribün Sesi', h: hrs('fan', 10, 22), kind: 'quote', txt: `${me} bugün sahanın en iyisiydi!`, likes: n('fan', 200, 3000), cm: comments('fan', 'me'), nc: n('fanc', 10, 120) });
      }
      const ro = (Game.teamRoster(s.clubId) || []).filter((x) => x && x.n && x.n !== me);
      const TP = [['gym', 'Bugün ağırlık günüydü. Yarın daha güçlü!'], ['train', 'Topla geçen bir gün daha.'], ['locker', 'Soyunma odasında moraller yüksek.'], ['plane', 'Deplasman yolundayız!'], ['food', 'Maç öncesi beslenme her şey.'], ['run', 'Sabah koşusu tamam. Hedef büyük.'], ['stadium', 'Hafta sonu için hazırız.']];
      [0, 1, 2].forEach((k) => { if (!ro.length) return; const m = ro[hstr(`${w}|tm${k}`) % ro.length]; const tp = TP[hstr(`${w}|tp${k}`) % TP.length]; if (!out.some((x) => x.who === m.n)) out.push({ id: 'tm' + k, who: m.n, sub: cn, h: hrs('tm' + k, 2, 30), kind: 'photo', art: tp[0], txt: tp[1], likes: n('tm' + k, 60, 1800), cm: comments('tm' + k, 'gen'), nc: n('tmc' + k, 3, 60) }); });
      try {
        const lg = Game.league();
        if (lg && lg.table && s.season.round > 0) {
          const t = World.sortedTable(lg).slice(0, 3);
          out.push({ id: 'lg', who: Game.leagueName(), lg: true, h: hrs('lg', 18, 40), kind: 'table', rows: t.map((x) => [Game.teamName(x.id), x.pts, x.id === s.clubId]), txt: `${s.season.round}. hafta sonunda zirve`, likes: n('lg', 400, 6000), cm: comments('lg', 'stat'), nc: n('lgc', 20, 300) });
          const sc = World.topScorers ? World.topScorers(lg, 3) : [];
          if (sc.length && sc[0].g > 0) out.push({ id: 'gk', who: Game.leagueName(), lg: true, h: hrs('gk', 20, 44), kind: 'scorers', rows: sc.map((x) => [x.name, x.g, x.name === me]), txt: 'Gol krallığı yarışı', likes: n('gk', 300, 4000), cm: comments('gk', 'stat'), nc: n('gkc', 10, 200) });
        }
      } catch (e) { /* tablo yok */ }
      // transfer kulisi: gerçekten teklif varsa
      if ((s.offers || []).length) { const o = s.offers[0], cl = Game.club(o.clubId); if (cl) out.push({ id: 'tr', who: 'SporHaber', news: true, h: hrs('tr', 3, 12), kind: 'news', tag: 'TRANSFER', txt: `Transfer kulisi: ${cl.name}, ${me} için harekete geçti.`, likes: n('tr', 400, 4000), cm: comments('tr', 'news'), nc: n('trc', 20, 300) }); }
    }
    (s.news || []).filter((x) => x && x.t && x.type !== 'bad').slice(0, 2).forEach((x, k) => out.push({ id: 'nw' + k, who: 'SporHaber', news: true, h: hrs('nw' + k, 4, 40), kind: 'news', tag: 'SON DAKİKA', txt: U.plain(String(x.t)), likes: n('nw' + k, 100, 2500), cm: comments('nw' + k, 'news'), nc: n('nwc' + k, 5, 120) }));
    const FP = [['food', 'Akşam yemeği dostlarla.'], ['train', 'Halı saha klasiği.'], ['plane', 'Kısa bir tatil molası.'], ['run', 'Bugün 10 kilometre koştum!']];
    (typeof Friends !== 'undefined' && Friends.on && Friends.on() ? Friends.list() : []).slice(0, 2).forEach((f, k) => { const fp = FP[hstr(`${w}|fp${f.n}`) % FP.length]; out.push({ id: 'fr' + k, who: f.n, h: hrs('fr' + k, 1, 44), kind: 'photo', art: fp[0], txt: fp[1], likes: n('fr' + k, 10, 300), cm: comments('fr' + k, 'gen'), nc: n('frc' + k, 1, 20) }); });
    // senin bu haftaki ve geçen haftaki gönderilerin akışta görünür
    try {
      const so = Social.ensure(p);
      so.posts.filter((x) => x.y === s.season.year && x.r >= s.season.round - 1).slice(0, 2).forEach((x, k) => out.push({ id: 'me' + x.id, who: me, mine: true, h: x.r === s.season.round ? hrs('me' + k, 1, 8) : hrs('me' + k, 26, 48), kind: 'mine', pid: x.id, loc: x.loc, txt: x.text, likes: x.likes, cm: (x.comments || []).slice(0, 2), nc: x.nc || 0 }));
    } catch (e) { /* yok */ }
    return out.sort((a, b) => a.h - b.h);
  }
  const ago = (h) => (h < 24 ? `<span>${h} sa</span>` : `<span>${Math.floor(h / 24)} g</span>`);
  function media(x) {
    const club = Game.club() || {};
    if (x.kind === 'poster') {
      const o = x.nm;
      return `<div class="ph-fpo" style="--c1:${club.c1 || '#1d3a8a'};--c2:${club.c2 || '#fff'}"><small>${x.nm.k === 'cup' ? 'KUPA MAÇI' : 'MAÇ GÜNÜ'}</small><div class="vs"><span>${esc(Game.teamName())}</span><i>VS</i><span>${esc(o.t)}</span></div><em>${dateLbl(o.date)} · ${o.h}</em><b>${esc(o.sub)}</b></div>`;
    }
    if (x.kind === 'score') return `<div class="ph-fsc res-${x.res}" style="--c1:${club.c1 || '#16306f'}"><small>MAÇ SONUCU</small><div><span>${esc(x.a)}</span><b>${x.ga} - ${x.gb}</b><span>${esc(x.b)}</span></div>${x.scorer ? `<em>⚽ ${esc(x.scorer)}</em>` : ''}</div>`;
    if (x.kind === 'goal') return `<div class="ph-fgo" style="--c1:${club.c1 || '#e5383b'};--c2:${club.c2 || '#fff'}"><b>GOL!</b><i>${x.num || ''}</i><span>${esc(x.name)}</span></div>`;
    if (x.kind === 'table' || x.kind === 'scorers') return `<div class="ph-ftb"><small>${x.kind === 'table' ? 'PUAN DURUMU' : 'GOL KRALLIĞI'}</small>${x.rows.map((r, i) => `<div class="${r[2] ? 'me' : ''}"><i>${i + 1}</i><span>${esc(r[0])}</span><b>${r[1]}</b></div>`).join('')}</div>`;
    if (x.kind === 'photo') return scene(x.art);
    if (x.kind === 'news') return `<div class="ph-fnw"><small>${esc(x.tag || 'SON DAKİKA')}</small><p>${esc(x.txt)}</p></div>`;
    if (x.kind === 'quote') return `<div class="ph-fq">“${esc(x.txt)}”</div>`;
    if (x.kind === 'mine') return `<div class="ph-fimg mine"><canvas data-pid="${x.pid}" data-crop="1" aria-hidden="true"></canvas></div>`;
    return '';
  }
  function feedCard(x) {
    const d = Phone.data(), on = !!(d.cheer && d.cheer[`${Phone.week()}|${x.id}`]);
    let av = avatar(x.who);
    if (x.club) { try { av = `<span class="ph-fav ph-fav-club">${UI.shirt(Game.club())}</span>`; } catch (e) { /* yok */ } }
    if (x.lg) av = `<span class="ph-fav ph-fav-lg">${IC.feed}</span>`;
    if (x.news) av = '<span class="ph-fav ph-fav-nw" data-noi18n>SH</span>';
    if (x.mine) av = '<span class="ph-fav ph-fav-me"><canvas class="so-avatar" aria-hidden="true"></canvas></span>';
    const ver = x.club || x.lg || x.news || x.natTeam || (x.mine && Phone.p().fame >= 35);
    const sub = [x.sub ? esc(x.sub) : x.loc ? esc(x.loc) : '', ago(x.h)].filter(Boolean).join(' · ');
    const cap = x.kind === 'news' || x.kind === 'quote' ? '' : `<p class="ph-fcap"><b>${esc(handleOf(x.who))}</b> ${esc(x.txt)}</p>`;
    const cm = (x.cm || []).map((c) => `<p class="ph-fcm"><b>${esc('@' + String(c.u).replace(/^@/, ''))}</b> <span>${esc(c.t)}</span></p>`).join('');
    return `<article class="ph-fpost"><header>${av}<span><b>${esc(x.who)}${ver ? `<i class="ph-fv">${IC.feed}</i>` : ''}</b><small>${sub}</small></span></header>${media(x)}
      <div class="ph-fact"><button type="button" class="${on ? 'on' : ''}" data-ph-cheer="${x.id}" aria-label="Alkış">${svg('<path d="M12 3.2l2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.1l-5.1 2.8L8 13.2 3.7 9.2l5.8-.7z"/>', on ? '#ffcf3f' : 'none', on ? '#ffcf3f' : 'currentColor', 1.8)}<span>${Social.fmt(x.likes + (on ? 1 : 0))}</span></button><span class="ph-fic">${svg('<path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z"/>', 'none', 'currentColor', 1.8)}<span>${Social.fmt(x.nc || 0)}</span></span><span class="ph-fic">${svg('<path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M12 3v12M7 8l5-5 5 5"/>', 'none', 'currentColor', 1.8)}</span></div>${cap}${cm}${x.nc > 2 ? `<p class="ph-fmore"><span>${Social.fmt(x.nc)} yorumun tümünü gör</span></p>` : ''}</article>`;
  }
  // hikâyeler: kulüp (maç afişi), takım arkadaşları ve arkadaşlar
  function stories(posts) {
    const seen = new Set();
    return posts.filter((x) => (x.kind === 'poster' || x.kind === 'photo' || x.kind === 'goal' || x.kind === 'table') && !seen.has(x.who) && seen.add(x.who)).slice(0, 8);
  }
  function feedView() {
    const me = Phone.sub === 'me';
    const seg = `<div class="ph-seg"><button type="button" class="${me ? '' : 'on'}" data-ph-ftab="">Akış</button><button type="button" class="${me ? 'on' : ''}" data-ph-ftab="me">Profilim</button></div>`;
    if (me) return `<div class="ph-appv ph-feed">${top('StarFeed')}${seg}<div class="ph-body">${Social.render(true)}</div></div>`;
    const posts = feedPosts(), st = stories(posts), d = Phone.data(), w = Phone.week();
    const stBar = st.length ? `<div class="ph-stories">${st.map((x, i) => { const seen = d.stSeen && d.stSeen[`${w}|${x.id}`]; const av = x.club ? `<span class="ph-fav ph-fav-club">${UI.shirt(Game.club())}</span>` : x.lg ? `<span class="ph-fav ph-fav-lg">${IC.feed}</span>` : avatar(x.who); return `<button type="button" class="ph-st1 ${seen ? 'seen' : ''}" data-ph-story="${i}">${av}<small>${esc(String(x.who).split(' ')[0])}</small></button>`; }).join('')}</div>` : '';
    let ov = '';
    if (Phone.story != null && st[Phone.story]) {
      const x = st[Phone.story];
      (d.stSeen = d.stSeen || {})[`${w}|${x.id}`] = 1;
      ov = `<div class="ph-story" data-ph-snext><div class="bars">${st.map((_, i) => `<i class="${i < Phone.story ? 'done' : i === Phone.story ? 'cur' : ''}"></i>`).join('')}</div><header>${avatar(x.who)}<b>${esc(x.who)}</b><small>${ago(x.h)}</small><button type="button" class="x" data-ph-sclose aria-label="Kapat">✕</button></header><div class="sm">${media(x)}</div><p>${esc(x.txt)}</p></div>`;
    }
    return `<div class="ph-appv ph-feed">${top('StarFeed')}${seg}<div class="ph-body ph-fbody">${stBar}${posts.length ? posts.map(feedCard).join('') : '<p class="ph-note">Akış şimdilik sessiz. Maçlar başladıkça takım arkadaşların ve kulübün paylaşım yapacak.</p>'}</div>${ov}</div>`;
  }
  // ---------------- Durum ayrıntısı (ana ekrandaki Durum kartı) ----------------
  function statView() {
    const s = Game.state, p = s.player, L = Life.ensure(p), so = Social.ensure(p);
    const row = (ic, l, v, c, tip, txt) => `<div class="ph-st"><span class="ph-st-i" style="background:${c}">${ic}</span><div><div class="ph-st-h"><b>${l}</b><em>${txt != null ? txt : Math.round(v)}</em></div>${v != null ? `<div class="ph-bar"><i style="width:${U.clamp(v, 0, 100)}%;background:${c}"></i></div>` : ''}<small>${tip}</small></div></div>`;
    const i = (d) => svg(d, 'none', '#fff', 2.2);
    const H = { e: i('<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'), m: i('<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>'), f: i('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>'), c: i('<circle cx="12" cy="7" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/>'), t: i('<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3 3-6 6-6s6 3 6 6M15 14c3 0 6 2 6 5"/>'), fa: i('<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>'), h: i('<path d="M12 20s-7-4.4-9-8.6C1.6 8.3 3.5 5 7 5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.5 0 5.4 3.3 4 6.4-2 4.2-9 8.6-9 8.6z"/>'), s: i('<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>'), hp: i('<path d="M12 5v14M5 12h14"/>'), ap: i('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>') };
    return `<div class="ph-appv ph-stat">${top('Durum')}<div class="ph-body">
      <div class="ph-st-top"><div><small>Güç</small><b>${Player.overall(p, true)}</b></div><div><small>Aksiyon hakkı</small><b>${s.ap}</b></div><div><small>Sağlık</small><b class="${p.injuryWeeks ? 'bad' : 'ok'}">${p.injuryWeeks ? `${p.injuryWeeks} hf` : '✓'}</b></div></div>
      <div class="ph-secl">Bedenin ve aklın</div>
      ${row(H.e, 'Enerji', p.energy, '#7fb2ff', 'Maçtaki performansını belirler. Dinlenme, beslenme ve enerji içeceği artırır; yoğun antrenman düşürür.')}
      ${row(H.m, 'Moral', p.morale, '#ffcf3f', 'Kazanmak, gol atmak, ailen ve sevdiklerinle vakit geçirmek moralini yükseltir.')}
      ${p.injuryWeeks ? row(H.hp, 'Sakatlık', null, '#ff5a64', 'Fizyoterapi seansı iyileşmeyi hızlandırır. Spor Mağazası\'ndan alabilirsin.', `${p.injuryWeeks} hafta`) : ''}
      <div class="ph-secl">İlişkilerin</div>
      ${row(H.f, 'Aile', p.rel.family, '#46e08f', 'Ailenle vakit geçirmek bağınızı güçlendirir; uzun süre ilgisiz kalırsan düşer.')}
      ${L.gf ? row(H.h, L.gf.married ? 'Eşin' : 'Sevgilin', L.gf.rel, '#ff6f8a', 'Buluşmalar ilişkini güçlendirir. Çok düşerse ayrılık gelebilir.') : ''}
      ${!Game.inStreet() ? row(H.c, 'Hoca', p.rel.coach, '#9aa6c4', 'Hocayla iyi ilişki daha çok forma şansı demek. Antrenman ve konuşmalar artırır.') : ''}
      ${!Game.inStreet() ? row(H.t, 'Takım', p.rel.team, '#7fb2ff', 'Takım arkadaşlarınla vakit geçirmek uyumu ve maç içi pasları artırır.') : ''}
      ${!Game.inStreet() ? row(H.fa, 'Taraftar', p.rel.fans, '#c792ff', 'İyi maçlar ve goller taraftarın sevgisini kazandırır.') : ''}
      <div class="ph-secl">Ünün</div>
      ${row(H.s, 'Ün', p.fame, '#ffb36b', 'Ün arttıkça sponsorlar, transfer teklifleri ve takipçiler gelir.')}
      ${row(IC.feed, 'StarFeed takipçisi', null, '#16306f', 'Paylaşımlar ve iyi maçlar takipçi getirir.', Social.fmt(so.followers))}
    </div></div>`;
  }
  // ---------------- Hayatım (telefon uygulaması tasarımı) ----------------
  const ring = (v, c, l, sub) => `<div class="ph-ring"><span style="background:conic-gradient(${c} ${U.clamp(v, 0, 100) * 3.6}deg, rgba(255,255,255,.08) 0)"><i><b>${Math.round(v)}</b></i></span><small>${l}</small>${sub ? `<em>${esc(sub)}</em>` : ''}</div>`;
  function lifeView() {
    const s = Game.state, p = s.player, L = Life.ensure(p), gf = L.gf, adult = Life.adult(p), ap = s.ap;
    const kidsL = L.kids || [];
    const act = (k, ic, t, d, dis) => `<button type="button" class="ph-la" data-life="${k}" ${dis || ap <= 0 ? 'disabled' : ''}><span class="ic">${ic}</span><b>${t}</b><small>${d}</small></button>`;
    const I = (d) => svg(d, 'none', '#fff', 2);
    const status = gf ? (gf.married ? `${gf.name} ile evli` : `${gf.name} ile birlikte`) : 'Yalnız';
    const acts = [
      act('family', I('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>'), 'Ailenle vakit geçir', 'Aile ilişkisi ve moral artar'),
      gf ? act('date', I('<path d="M12 20s-7-4.4-9-8.6C1.6 8.3 3.5 5 7 5c2 0 3.4 1.1 5 3 1.6-1.9 3-3 5-3 3.5 0 5.4 3.3 4 6.4-2 4.2-9 8.6-9 8.6z"/>'), `${gf.name} ile buluş`, 'İlişki güçlenir, moral artar') : act('meet', I('<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-6 6-6s6 3 6 6M17 8v6M14 11h6"/>'), 'Yeni biriyle tanış', p.age < 16 ? '16 yaşından sonra' : 'Ünün ve moralin şansını artırır', p.age < 16),
      gf && !gf.married && gf.rel >= 85 && s.season.year > gf.since && adult ? act('propose', I('<circle cx="12" cy="14" r="6"/><path d="M9 3h6l-3 5z"/>'), 'Evlilik teklif et', `${gf.name} hazır olabilir`) : '',
      act('night', I('<path d="M20 14A8 8 0 019.5 3.6 8 8 0 1020 14z"/>'), 'Gece hayatı', adult ? 'Moral +10, enerji -18 · paparazzi riski' : '18 yaşından sonra', !adult),
    ].join('');
    const kidAge = (k) => Math.max(0, s.season.year - k.by);
    const baby = L.babyNew ? `<div class="ph-lbaby"><b>${L.babyNew.sex === 'b' ? 'Bir oğlun oldu!' : 'Bir kızın oldu!'}</b><small>Anne ve bebek çok iyi. Ona hangi adı vereceksiniz?</small><div class="ph-lchips" data-noi18n>${L.babyNew.names.map((n) => `<button type="button" data-kname="${esc(n)}">${esc(n)}</button>`).join('')}</div></div>` : '';
    const person = (avc, name, sub, v, c, extra = '', cls = '') => `<div class="ph-lp ${cls}">${avc}<div class="t"><b>${name}</b><small>${sub}</small>${v != null ? `<div class="ph-bar"><i style="width:${U.clamp(v, 0, 100)}%;background:${c}"></i></div>` : ''}${extra}</div></div>`;
    const fam = [
      person(avatar('Annem'), 'Annem', 'Aile', null, '', '<button type="button" class="ph-lmsg" data-ph-chat="mom">Mesaj</button>'),
      person(avatar('Babam'), 'Babam', 'Aile', null, '', '<button type="button" class="ph-lmsg" data-ph-chat="dad">Mesaj</button>'),
      gf ? person(avatar(gf.name), esc(gf.name), `<span>${gf.married ? 'Eşin' : 'Sevgilin'}</span> · <span>${esc(gf.job)}</span> · <span>${gf.since}'den beri</span>`, gf.rel, '#ff6f8a', '<button type="button" class="ph-lmsg" data-ph-chat="gf">Mesaj</button>') : '',
      ...kidsL.map((k, i) => { const a = kidAge(k), ka = typeof Life.kidActs === 'function' ? Life.kidActs(a) : []; return person(avatar(k.n), `<span data-noi18n>${esc(k.n)}</span>`, `<span>${a} yaş</span>${k.dream ? ' · <span>futbolcu olmak istiyor</span>' : ''}`, k.bond == null ? 60 : k.bond, '#7fb2ff', `<div class="ph-lchips">${ka.map(([key, t]) => `<button type="button" data-kid="${i}" data-kact="${key}" ${ap <= 0 ? 'disabled' : ''}>${t}</button>`).join('')}</div>`, 'ph-lkid'); }),
      gf && gf.married && !kidsL.length && !L.babyNew ? '<div class="ph-lp ph-lkid-none"><span></span><div class="t"><small>Henüz çocuğunuz yok. Evliliğinizin ilk yılından sonra güzel bir haber gelebilir.</small></div></div>' : '',
    ].join('');
    const fr = typeof Friends !== 'undefined' && Friends.on && Friends.on() ? Friends.list() : [];
    const frHtml = fr.length ? `<div class="ph-secl">Arkadaşların</div><div class="ph-lfr">${fr.map((f) => `<div>${avatar(f.n)}<b>${esc(f.n.split(' ')[0])}</b><small>${esc(f.job && typeof FR_JOB !== 'undefined' ? FR_JOB[f.job] : (typeof FR_KIND !== 'undefined' ? FR_KIND[f.kind] : ''))}</small></div>`).join('')}</div>` : '';
    const docs = [];
    if (typeof LifeX !== 'undefined' && LifeX.on()) {
      if (p.age >= 18) docs.push(`<div class="ph-ldoc"><span>Ehliyet</span>${p.license ? '<em class="ok">Var</em>' : '<button type="button" data-ph-lic>Sınava gir</button>'}</div>`);
      if (p.uni) docs.push(`<div class="ph-ldoc"><span>Açık öğretim</span><em>${p.uni.done ? 'Mezun' : `${p.uni.yr}. sınıf`}</em></div>`);
      const cl = LifeX.clubLang();
      if (cl && cl !== LifeX.native(p)) docs.push(`<div class="ph-ldoc"><span>${typeof LX_LNAME !== 'undefined' ? esc(LX_LNAME[cl] || '') : ''}</span><em>${LifeX.langLvl(p, cl)}/3</em></div>`);
    }
    const origin = p.parents ? `<p class="ph-note">Baba memleketi: <b>${esc((Game.nat(p.parents.f) || {}).name || '')}</b> · Anne memleketi: <b>${esc((Game.nat(p.parents.m) || {}).name || '')}</b>${p.parents.f !== p.parents.m ? (p.natLocked ? ` · Milli tercihin: <b>${esc(Game.nation().name)}</b>` : ' · İki milli takıma da uygunsun') : ''}</p>` : '';
    const mgr = p.age >= 16 && !Game.inStreet() ? `<button type="button" class="ph-lrow" data-ph-open="agent"><span class="ic" style="background:linear-gradient(135deg,#ffd76a,#e0a10e)">${IC.agent}</span><span><b>Menajer ve sponsorlar</b><small>${L.manager ? `<span data-noi18n>${esc(L.manager.name)}</span>` : '<span>Menajer bul</span>'} · <span>${L.sponsors.length} aktif sponsor</span>${L.offers.length ? ` · <span>${L.offers.length} yeni teklif</span>` : ''}</small></span><i>›</i></button>` : '';
    return `<div class="ph-appv ph-life">${top('Hayatım')}<div class="ph-body">
      <div class="ph-lhero">${avatar(Player.fullName(p), 'ph-fav-xl')}<div><b>${esc(Player.fullName(p))}</b><small><span>${p.age} yaş</span> · <span>${esc(status)}</span></small></div></div>
      ${L.ban > 0 ? `<div class="ph-lban"><b>Federasyon men cezası: ${L.ban} hafta</b><small>Ceza bitene kadar maçlarda forma giyemezsin.</small></div>` : ''}
      <div class="ph-rings">${ring(p.rel.family, '#46e08f', 'Aile')}${ring(gf ? gf.rel : 0, '#ff6f8a', gf ? (gf.married ? 'Eşin' : 'Sevgilin') : 'İlişki', gf ? '' : 'Yalnız')}${ring(p.morale, '#ffcf3f', 'Moral')}</div>
      <div class="ph-secl ph-secl2"><span>Bu hafta</span><em>${ap} aksiyon hakkı</em></div>
      <div class="ph-las">${acts}</div>
      ${baby}
      <div class="ph-secl">Ailem</div><div class="ph-lgrp">${fam}</div>
      ${frHtml}
      ${docs.length ? `<div class="ph-secl">Belgeler ve beceriler</div><div class="ph-lgrp">${docs.join('')}</div>` : ''}
      ${mgr}
      ${origin}
      ${gf ? `<button type="button" class="ph-lend" data-life="${gf.married ? 'divorce' : 'breakup'}">${gf.married ? 'Boşan' : 'Ayrıl'}</button>` : ''}
    </div></div>`;
  }
  const SUBJ = { corners: 'Geometri', math: 'Matematik', pattern: 'Mantık', flag: 'Coğrafya', count: 'Matematik', clock: 'Hayat Bilgisi' };
  function schoolView() {
    if (typeof School === 'undefined' || !School.on()) return `<div class="ph-appv ph-school">${top('Okul')}<div class="ph-body"><p class="ph-note">Okul yılların tamamlandı.</p></div></div>`;
    const s = Game.state, p = s.player, sc = School.ensure(s), mid = School.mid(), r = s.season.round;
    const iq = Math.round(School.iq(p));
    const grade = (x) => (x ? `<b class="sc-g">${x.score}/${x.of}</b>` : '<b class="sc-g none">—</b>');
    const lessons = sc.l.map((x) => `<div class="ph-les"><span class="d ${x.seen ? 'ok' : 'miss'}">${x.seen ? '✓' : '✕'}</span><span><b>${SUBJ[x.k] || 'Ders'}</b><small>${x.t === 'mid' ? 'Ara dönem' : 'Sezon sonu'} · ${x.seen ? 'Derse katıldın' : 'Antrenmanı seçtin'}</small></span></div>`).join('');
    const upcoming = (sc.plan || []).filter((w) => w >= r).slice(0, 3).map((w) => `<div class="ph-les"><span class="d up">${w + 1}</span><span><b>Ders haftası</b><small>O hafta okula ya da antrenmana gideceksin</small></span></div>`).join('');
    const hist = (sc.hist || []).slice(0, 6).map((h) => `<div class="ph-krow"><span>${h.y} · ${h.age} yaş</span><b>${h.avg}</b>${h.b ? `<em>${esc(h.b)}</em>` : '<em></em>'}</div>`).join('');
    return `<div class="ph-appv ph-school">${top('Okul')}<div class="ph-body">
      <div class="ph-sch-h"><div><span>${p.age} yaş</span><b>${esc(Player.fullName(p))}</b></div><div class="iq"><small>Zeka</small><b>${iq}</b></div></div>
      <div class="ph-bar sc"><i style="width:${U.clamp(iq, 0, 100)}%;background:#2f6ee8"></i></div>
      <p class="ph-note">Zeka antrenman verimini artırır. Derste işlenen konular dönem sınavında çıkar.</p>
      ${(() => { const mi = Inbox.list().find((it) => it.src === 'mid'); return mi ? `<button class="ph-cta" data-ph-ibtn="${esc(mi.id)}:0" type="button">Ara dönem sınavına gir</button>` : ''; })()}
      <div class="ph-secl">Sınavlar</div>
      <div class="ph-exams"><div><span>Ara dönem</span>${grade(sc.ex.mid)}<small>${sc.ex.mid ? 'Tamamlandı' : `${mid + 1}. hafta`}</small></div><div><span>Sezon sonu</span>${grade(sc.ex.fin)}<small>${sc.ex.fin ? 'Tamamlandı' : 'Sezonun sonunda'}</small></div></div>
      <div class="ph-secl">Bu yılın dersleri</div>
      ${lessons || '<p class="ph-note">Bu yıl henüz ders işlenmedi.</p>'}${upcoming}
      ${hist ? `<div class="ph-secl">Karneler</div><div class="ph-kar">${hist}</div>` : ''}
    </div></div>`;
  }
  // kilitli ücretli uygulama: içerik gösterilmez, yalnız tanıtım düğmesi
  function lockedView(k) {
    const t = k === 'lux' ? ['Lüks', 'Lüks yaşam vitrini Premium ve Premium+ sahiplerine özeldir.', 'Premium\'u incele'] : ['Diamond', 'Diamond sevinçleri ve kariyer posteri Diamond sahiplerine özeldir.', 'Diamond\'u incele'];
    return `<div class="ph-appv ph-locked ph-${k}">${top(t[0])}<div class="ph-body"><div class="ph-lock-c"><span class="ph-lock-i">${IC.lock}</span><h3>${t[0]}</h3><p>${t[1]}</p><button class="ph-cta" data-ph-prem="${k === 'lux' ? 'premium' : 'diamond'}" type="button">${t[2]}</button></div></div></div>`;
  }
  function luxView() {
    if (LOCK.lux()) return lockedView('lux');
    return `<div class="ph-appv ph-lux">${top('Lüks')}<div class="ph-body"><div class="ph-lux-h"><small>Özel koleksiyon</small><b>Yıldızlara özel</b></div>${Star.luxCard()}</div></div>`;
  }
  function diaView() {
    if (LOCK.dia()) return lockedView('dia');
    const p = Phone.p(), cur = p.celeb || 'arms';
    const cels = (typeof CELEBRATIONS !== 'undefined' ? CELEBRATIONS : []).filter((c) => c.dia);
    return `<div class="ph-appv ph-dia">${top('Diamond')}<div class="ph-body">
      <div class="ph-dia-h">${IC.dia}<b>Diamond</b><small>Senin ayrıcalıkların</small></div>
      ${cels.length ? `<div class="ph-secl">Diamond sevinçleri</div><div class="cb-grid">${cels.map((c) => `<button class="cb dia ${cur === c.id ? 'on' : ''}" data-celeb="${c.id}"><b><span data-emo>${c.ic}</span> ${c.name}</b><small>${c.desc}</small></button>`).join('')}</div>` : ''}
      ${typeof Poster !== 'undefined' ? `<div class="ph-secl">Kariyer posteri</div><button class="ph-cta" data-poster type="button">Kariyer posterini oluştur</button>` : ''}
    </div></div>`;
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
  const VIEWS = { feed: feedView, wiki: wikiView, bank: bankView, cal: calView, agent: agentView, emlak: emlakView, cars: carsView, shop: shopView, sport: sportView, life: lifeView, stat: statView, school: schoolView, lux: luxView, dia: diaView, store: storeView, prem: premView, set: setView };
  const LIGHT = ['wiki', 'cal', 'store', 'school'];

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
      else html = (VIEWS[Phone.app] || (Phone.views && Phone.views[Phone.app]) || homeView)();
    } catch (e) { console.error(e); Phone.app = null; Phone.sub = null; html = homeView(); }
    const v = scr.querySelector('.ph-view');
    v.innerHTML = statusBar(LIGHT.includes(Phone.app)) + html;
    Phone._last = `${Phone.app}|${Phone.sub}`;
    if (!same) { const pl = scr.querySelector('.ph-pill'); if (pl) pl.classList.remove('on'); }
    const body = v.querySelector('.ph-body');
    if (body) { if (same) { body.scrollTop = keep; v.querySelector('.ph-appv').classList.add('still'); } else if (Phone.app === 'msg' && Phone.sub) body.scrollTop = body.scrollHeight; }
    Phone.el.querySelector('.ph-homebar').classList.toggle('dark', LIGHT.includes(Phone.app));
    try { UI.strip(v); } catch (e) { /* yok */ }
    // oyunun kendi bağlayıcıları: satın alma, menajer/sponsor, StarFeed gönderileri, mağaza sekmeleri
    try { UI.bind(v); } catch (e) { console.error(e); }
    try { if (Phone.app === 'feed' || Phone.app === 'shop' || Phone.app === 'sport') Social.drawAvatar(v); } catch (e) { /* yok */ }
    bind(v);
    Phone.badge();
  };
  function bind(v) {
    const on = (sel, fn) => v.querySelectorAll(sel).forEach((b) => (b.onclick = (e) => fn(b, e)));
    on('[data-ph-open]', (b) => { if (b.dataset.phOpen === 'shop' && typeof Mall !== 'undefined') Mall.reset(); Phone.app = b.dataset.phOpen; Phone.sub = null; Phone.day = null; Phone.month = null; Phone.story = null; Phone.render(); });
    on('[data-ph-back]', () => { Phone.story = null; if (Phone.sub) Phone.sub = null; else Phone.app = null; Phone.render(); });
    on('[data-ph-th]', (b) => { Phone.sub = b.dataset.phTh; Phone.render(); });
    on('[data-ph-chat]', (b) => { Phone.app = 'msg'; Phone.sub = b.dataset.phChat; Phone.render(); });
    on('[data-ph-ftab]', (b) => { Phone.sub = b.dataset.phFtab || null; Phone.story = null; Phone.render(); });
    on('[data-ph-story]', (b) => { Phone.story = +b.dataset.phStory; Phone.render(); });
    on('[data-ph-sclose]', (b, e) => { e.stopPropagation(); Phone.story = null; Game.save(); Phone.render(); });
    on('[data-ph-snext]', () => { const n = v.querySelectorAll('.ph-st1').length; Phone.story = Phone.story + 1 < n ? Phone.story + 1 : null; if (Phone.story == null) Game.save(); Phone.render(); });
    on('[data-ph-lic]', () => { try { LifeX.licenseExam(() => Game.render()); } catch (e) { console.error(e); } });
    on('[data-ph-cheer]', (b) => {
      const d = Phone.data(), k = `${Phone.week()}|${b.dataset.phCheer}`;
      d.cheer = d.cheer || {};
      if (d.cheer[k]) delete d.cheer[k]; else d.cheer[k] = 1;
      const ks = Object.keys(d.cheer); if (ks.length > 60) ks.slice(0, ks.length - 60).forEach((x) => delete d.cheer[x]);
      Game.save(); Phone.render();
    });
    on('[data-ph-rep]', (b) => reply(+b.dataset.phRep));
    on('[data-sl]', (b) => { try { if (Phone.extClick) Phone.extClick(b); } catch (e) { console.error(e); } });
    on('[data-ph-ibtn]', (b) => { const [id, i] = b.dataset.phIbtn.split(':'); Inbox.resolve(id, +i); });
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
    const k = Phone.sub, c = contacts().find((x) => x.id === k);
    if (!c) return;
    const r = repliesOf(c, k)[i], d = Phone.data(), w = Phone.week(), s = Game.state;
    if (!r || d.rep[k] === w) return;
    if (r.open) { d.rep[k] = w; pushLog(k, { d: 'out', t: r.t }); pushLog(k, { d: 'in', t: r.ok }); Game.save(); Phone.app = r.open; Phone.sub = null; return Phone.render(); }
    let note = null;
    if (r.act) {
      const ap0 = s.ap;
      Phone._cap = [];
      try { r.act(); } catch (e) { console.error(e); }
      const cap = Phone._cap; Phone._cap = null;
      if (Game.state.ap >= ap0) { cap.forEach((m) => flash(m.msg, m.type)); Phone.render(); return; } // hak harcanmadıysa (para yok, hak yok vb.) cevap gönderilmemiş sayılır
      note = cap.map((m) => m.msg).slice(0, 3);
    }
    d.rep[k] = w;
    pushLog(k, { d: 'out', t: r.t }); pushLog(k, { d: 'in', t: r.ok });
    if (note && note.length) pushLog(k, { d: 'sys', n: note });
    Game.save();
    Phone.render();
  }

  // ---------------- oyunun seçimli olayları telefona gelir (ana ekranda pencere açılmaz, hızlı ilerleme durmaz) ----------------
  const EV_FROM = { mom_bday: 'mom', mom: 'mom', school: 'mom', dad_match: 'dad', gf_trip: 'gf', marriage_crisis: 'gf', gf_leaves: 'gf', gf_jealous: 'gf', party: 'team', senior_tip: 'team', veteran: 'team', extra: 'coach', u_promo: 'coach', captain_fk: 'coach', sponsor: 'agent', scout: 'agent', interview: 'x:Basın', tvshow: 'x:Basın', gift: 'x:Dedem', signing: 'x:Taraftar Derneği', ankle: 'x:Sağlık Ekibi', physio: 'x:Sağlık Ekibi', charity: 'x:Vakıf' };
  const LX_FROM = { lic: 'x:Ajanda', uni: 'x:Ajanda', md: 'x:Ajanda', ny: 'mom', bay: 'mom', bd: 'team', lang: 'x:Kulüp' };
  function keyFor(k) {
    const L = Life.ensure(Phone.p());
    if (k === 'gf' && !L.gf) return 'x:Ajanda';
    if (k === 'agent' && !L.manager) return 'x:Ajanda';
    if ((k === 'coach' || k === 'team') && Game.inStreet()) return k === 'team' ? 'mom' : 'x:Ajanda';
    return k;
  }
  const stripTag = (html) => { const t = document.createElement('div'); t.innerHTML = html; t.querySelectorAll('.ev-tag').forEach((x) => x.remove()); return t.innerHTML.trim(); };
  const Inbox = {
    fns: {}, _busy: false,
    list() { const d = Phone.data(); return (d.inbox = d.inbox || []); },
    add(it, fns) {
      it.id = `i${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`;
      it.w = Phone.week(); it.y = Game.state.season.year;
      Inbox.list().push(it);
      if (fns) Inbox.fns[it.id] = fns;
    },
    // olayın penceresini açmadan yakalar: { html, btns }
    capture(run) {
      const m0 = Game.modal; let got = null;
      Inbox._busy = true;
      Game.modal = function (html, btns) { if (!got) { got = { html, btns: (btns || []).filter(Boolean) }; return document.createElement('div'); } return m0.apply(this, arguments); };
      try { run(); } catch (e) { console.error(e); } finally { Game.modal = m0; Inbox._busy = false; }
      return got;
    },
    addCaptured(key, src, extra, got) {
      if (!got) return;
      Inbox.add(Object.assign({ key, src, html: stripTag(got.html), btns: got.btns.map((b) => b.t) }, extra), got.btns.map((b) => b.fn || (() => {})));
    },
    // kayıt yeniden yüklendiyse seçeneklerin işlevleri yeniden kurulur
    rebuild(it) {
      const s = Game.state;
      if (it.src === 'ev') {
        const ev = Events.list.find((e) => e.id === it.ev);
        if (!ev) return null;
        return ev.opts.map((o) => () => {
          Object.assign(Events, it.cache || {});
          let res; try { res = o.fx(Game.state.player); } finally { Events.reset(); }
          Game.save(); Game.render(); if (res) Game.toast(res, 'good');
        });
      }
      if (it.src === 'mid') return [midFn];
      let got = null;
      if (it.src === 'lesson') got = Inbox.capture(() => School.lesson());
      else if (it.src === 'fr' && it.fev && it.fev.k !== 'join' && Friends.get(it.fev.id)) { s.pendingFriend = it.fev; got = Inbox.capture(() => Fr0.call(Friends)); s.pendingFriend = null; }
      else if (it.src === 'lx' && it.lk && it.lk !== 'bd') { s.pendingLX = it.lk; got = Inbox.capture(() => Lx0.call(LifeX)); s.pendingLX = null; }
      return got ? got.btns.map((b) => b.fn || (() => {})) : null;
    },
    resolve(id, idx) {
      const L = Inbox.list(), it = L.find((x) => x.id === id);
      if (!it) return Phone.render();
      const fns = Inbox.fns[id] || Inbox.rebuild(it);
      L.splice(L.indexOf(it), 1); delete Inbox.fns[id];
      pushLog(it.key, { d: 'in', h: it.html }); pushLog(it.key, { d: 'out', t: it.btns[idx] || '' });
      if (!fns || !fns[idx]) { pushLog(it.key, { d: 'sys', n: ['Bu konu kapandı.'] }); Game.save(); return Phone.render(); }
      Phone._cap = [];
      try { fns[idx](); } catch (e) { console.error(e); }
      const cap = Phone._cap || []; Phone._cap = null;
      const n = cap.map((m) => m.msg).filter(Boolean).slice(0, 3);
      if (n.length) pushLog(it.key, { d: 'sys', n });
      Game.save();
      Phone.render();
    },
    // hafta geçince cevapsız kalan olaylar kapanır; tek seçenekli (bilgi) olaylar kendiliğinden uygulanır
    sweep() {
      if (Inbox._sw) return;
      const s = Game.state, w = Phone.week(), L = Inbox.list();
      const old = L.filter((it) => (it.keep ? (it.y !== s.season.year || (s.school && s.school.ex && s.school.ex.mid) || !(typeof School !== 'undefined' && School.on())) : it.w !== w));
      if (!old.length) return;
      Inbox._sw = true;
      try {
        old.forEach((it) => {
          L.splice(L.indexOf(it), 1);
          pushLog(it.key, Object.assign({ d: 'in', h: it.html }, { w: it.w }));
          if (it.src === 'ev' && it.btns.length === 1) {
            const fns = Inbox.fns[it.id] || Inbox.rebuild(it);
            Phone._cap = [];
            try { if (fns && fns[0]) fns[0](); } catch (e) { console.error(e); }
            const n = (Phone._cap || []).map((m) => m.msg).filter(Boolean).slice(0, 3); Phone._cap = null;
            if (n.length) pushLog(it.key, { d: 'sys', n, w: it.w });
          }
          delete Inbox.fns[it.id];
        });
      } finally { Inbox._sw = false; }
    },
  };
  Phone.inbox = Inbox;
  Phone.ui = { top: (t, c, r) => top(t, c, r), esc: (x) => esc(x), money: (n) => money(n), nextMatch: () => nextMatch() };
  Phone.contacts = () => contacts(); Phone.writes = (c) => writes(c);
  const midFn = () => { if (typeof School !== 'undefined') School.exam('mid').then(() => { Game.save(); Game.render(); }); };
  // zincir: yakalama sırasında oyunun "sıradaki bekleyen" çağrısı ertelenir, olay kaydedilince devam eder
  const cp0 = Game.checkPending;
  Game.checkPending = function () { if (Inbox._busy) return; return cp0.apply(this, arguments); };
  const after = () => { Game.save(); try { Phone.badge(); if (Phone.open) Phone.render(); } catch (e) { /* yok */ } Game.checkPending(); };
  let Fr0 = null, Lx0 = null;
  if (typeof Events !== 'undefined') {
    const Ev0 = Events.show;
    Events.show = function () {
      const s = Game.state, ev = Events.list.find((e) => e.id === s.pendingEvent);
      if (!Phone.on() || !ev) return Ev0.apply(this, arguments);
      Events.reset();
      let text = ''; try { text = ev.text(); } catch (e) { console.error(e); s.pendingEvent = null; return Game.checkPending(); }
      const cache = { _mate: Events._mate, _amt: Events._amt, _senior: Events._senior, _legend: Events._legend, _tip: Events._tip };
      s.pendingEvent = null;
      Inbox.add({ key: keyFor(EV_FROM[ev.id] || 'x:Ajanda'), src: 'ev', ev: ev.id, cache, html: `<h3>${U.esc(text)}</h3>`, btns: ev.opts.map((o) => o.t) });
      after();
    };
  }
  if (typeof Friends !== 'undefined') {
    Fr0 = Friends.show;
    Friends.show = function () {
      const s = Game.state, fev = s.pendingFriend, f = fev && Friends.get(fev.id);
      if (!Phone.on() || !f || !Friends.on()) return Fr0.apply(this, arguments);
      Inbox.addCaptured('f' + f.id, 'fr', { fev }, Inbox.capture(() => Fr0.call(Friends)));
      after();
    };
  }
  if (typeof LifeX !== 'undefined') {
    Lx0 = LifeX.show;
    LifeX.show = function () {
      const s = Game.state, lk = s.pendingLX;
      if (!Phone.on() || !LifeX.on() || !lk) return Lx0.apply(this, arguments);
      Inbox.addCaptured(keyFor(LX_FROM[lk] || 'x:Ajanda'), 'lx', { lk }, Inbox.capture(() => Lx0.call(LifeX)));
      after();
    };
  }
  // hızlı ilerleme sırasında hediye paketi bekler (ilerleme bölünmez); sonraki haftada ana ekranda açılır
  if (typeof Gift !== 'undefined' && Gift.show) {
    const Gf0 = Gift.show;
    Gift.show = function () { if (typeof FF !== 'undefined' && FF.on) return; return Gf0.apply(this, arguments); };
  }
  if (typeof School !== 'undefined') {
    const Sc0 = School.show;
    School.show = function () {
      const s = Game.state, k = s.pendingSchool;
      if (!Phone.on() || !School.on() || !k) return Sc0.apply(this, arguments);
      if (k === 'mid') {
        s.pendingSchool = null;
        if (!Inbox.list().some((it) => it.src === 'mid')) Inbox.add({ key: 'x:Okul', src: 'mid', keep: 1, html: '<h3>Ara dönem sınavı zamanı!</h3><p>Derste işlenen konular çıkacak. Hazır olduğunda sınava gir.</p>', btns: ['Sınava gir'] }, [midFn]);
        return after();
      }
      Inbox.addCaptured('x:Okul', 'lesson', {}, Inbox.capture(() => Sc0.call(School)));
      after();
    };
  }
  // Telefon açıkken oyunun köşe bildirimleri gösterilmez: sohbette etkisi konuşmanın içinde küçük bir satır olur,
  // diğer uygulamalarda telefon ekranının altında kısa bir not belirir. Bildirim geçmişine (zil) yine kaydedilir.
  function flash(msg, type) {
    if (!Phone.el) return;
    const scr = Phone.el.querySelector('.ph-screen');
    let el = scr.querySelector('.ph-pill');
    if (!el) { el = document.createElement('div'); el.className = 'ph-pill'; el.setAttribute('role', 'status'); scr.appendChild(el); }
    el.className = `ph-pill on ${type || ''}`;
    el.textContent = U.plain(String(msg));
    clearTimeout(Phone._pt);
    Phone._pt = setTimeout(() => el.classList.remove('on'), 2600);
  }
  if (!Game._phoneToast) {
    const toast0 = Game.toast;
    Game.toast = function (msg, type) {
      if (!Phone.open && !Phone._cap) return toast0.apply(this, arguments);
      try { if (typeof Notifs !== 'undefined' && Notifs.push) Notifs.push(msg, type); } catch (e) { /* yok */ }
      const m = { msg: U.plain(String(msg)), type: type || '' };
      if (Phone._cap) Phone._cap.push(m); else flash(m.msg, m.type);
    };
    Game._phoneToast = true;
  }
  Phone.badge = function () {
    const b = document.querySelector('#tabs [data-phone]');
    if (!b) return;
    b.hidden = !Phone.on();
    let n = 0; try { const L = (Phone.p() && Phone.p().life) || {}; n = unread() + (L.offers || []).length + (L.babyNew ? 1 : 0); } catch (e) { n = 0; }
    b.classList.toggle('on', !!Phone.open);
    document.querySelectorAll('#tabs button[data-tab]').forEach((x) => x.classList.toggle('ph-off', !!Phone.open));
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
    Phone.open = true; Phone.app = app || null; Phone.sub = null; Phone.day = null; Phone.month = null; Phone.story = null; Phone._last = null;
    Phone.el.classList.add('on');
    document.documentElement.classList.add('ph-open');
    fitTabs();
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
  // oynanan kupa ve milli maçlar takvime sonucuyla yazılır
  const am0 = Game.applyMatch;
  Game.applyMatch = function (sum, ctx, comp) {
    const out = am0.apply(this, arguments);
    try {
      const s = Game.state;
      if (s && s.player && s.mode !== 'wc') Phone.data().lastComp = comp;
      if (s && s.player && s.mode !== 'wc' && (comp === 'cup' || comp === 'intl') && sum) {
        const d = Phone.data(), opp = ctx.side === 'home' ? ctx.away.name : ctx.home.name;
        d.cal = (d.cal || []).filter((e) => e.y >= s.season.year - 1);
        const gf = sum.gf != null ? sum.gf : (ctx.side === 'home' ? sum.hs : sum.as), ga = sum.ga != null ? sum.ga : (ctx.side === 'home' ? sum.as : sum.hs);
        if (gf != null && ga != null) d.cal.push({ y: s.season.year, r: Math.min(s.season.round, nRounds() - 1), k: comp, t: opp, s: ctx.compName || '', res: `${gf}-${ga}`, win: gf - ga });
      }
    } catch (e) { console.error(e); }
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
    // alt menüdeki Telefon düğmesi aç/kapa çalışır
    if (!b.dataset.phoneOpen && Phone.open) return Phone.close();
    Phone.show(b.dataset.phoneOpen || null);
  });
  // telefon açıkken alt menüden başka bir sekmeye basınca telefon kapanır ve o sekme açılır
  document.addEventListener('click', (e) => {
    const t = e.target.closest && e.target.closest('#tabs button[data-tab]');
    if (t && Phone.open) Phone.close();
  }, true);
  // mobilde telefon alt menünün üstünde durur (alt menü görünür kalır)
  function fitTabs() {
    const t = document.getElementById('tabs');
    const h = t && getComputedStyle(t).position === 'fixed' ? t.getBoundingClientRect().height : 0;
    document.documentElement.style.setProperty('--ph-tabs', `${Math.round(h)}px`);
  }
  window.addEventListener('resize', () => { if (Phone.open) fitTabs(); });
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
