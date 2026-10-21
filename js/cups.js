// Avrupa kulüp kupaları ve milli turnuvalar (Dünya Kupası, Avrupa Şampiyonası)

const NAT_COLORS = {
  TUR: ['#c8102e', '#ffffff'], ARG: ['#75aadb', '#ffffff'], FRA: ['#1d2c5e', '#ffffff'], ESP: ['#c8102e', '#ffcc00'],
  ENG: ['#ffffff', '#1d2c5e'], BRA: ['#ffdf00', '#009639'], POR: ['#8e1b1b', '#006600'], GER: ['#ffffff', '#111111'],
  NED: ['#f36c21', '#ffffff'], ITA: ['#1f4fa3', '#ffffff'], BEL: ['#c8102e', '#111111'], CRO: ['#ffffff', '#c8102e'],
  NOR: ['#c8102e', '#1d2c5e'], USA: ['#1d2c5e', '#ffffff'], MEX: ['#006847', '#ffffff'], JPN: ['#0b2a7a', '#ffffff'], KSA: ['#006c35', '#ffffff'], SCO: ['#0b2a5a', '#ffffff'], AUT: ['#c8102e', '#ffffff'], SUI: ['#c8102e', '#ffffff'], GRE: ['#0d5eaf', '#ffffff'], DEN: ['#c8102e', '#ffffff'], CZE: ['#ffffff', '#c8102e'], UKR: ['#ffd500', '#005bbb'], EGY: ['#c8102e', '#ffffff'], POL: ['#ffffff', '#c8102e'], GEO: ['#ffffff', '#c8102e'], AZE: ['#0092bc', '#c8102e'],
};
const EURO_NATIONS = ['TUR', 'FRA', 'ESP', 'ENG', 'POR', 'GER', 'NED', 'ITA', 'BEL', 'CRO', 'NOR', 'POL', 'GEO', 'AZE', 'SCO', 'AUT', 'SUI', 'GRE', 'DEN', 'CZE', 'UKR'];
const STAGE_NAMES = { 32: 'Son 32', 16: 'Son 16', 8: 'Çeyrek Final', 4: 'Yarı Final', 2: 'Final' };
// Ülke kupaları: Avrupa kupası haftalarıyla çakışmayan takvim
const DOM_CUPS = [
  { id: 'cupTR', country: 'TR', leagues: ['TR1', 'TR2'], name: 'Türkiye Kupası', size: 32, fame: 1.2 },
  { id: 'cupENG', country: 'ENG', leagues: ['ENG', 'ENG2'], name: 'İngiltere Kupası', size: 32, fame: 1.4 },
  { id: 'cupESP', country: 'ESP', leagues: ['ESP', 'ESP2'], name: 'Kral Kupası', size: 32, fame: 1.4 },
  { id: 'cupGER', country: 'GER', leagues: ['GER', 'GER2'], name: 'Almanya Kupası', size: 32, fame: 1.3 },
  { id: 'cupITA', country: 'ITA', leagues: ['ITA', 'ITA2'], name: 'İtalya Kupası', size: 32, fame: 1.3 },
  { id: 'cupFRA', country: 'FRA', leagues: ['FRA', 'FRA2'], name: 'Fransa Kupası', size: 32, fame: 1.2 },
  { id: 'cupNED', country: 'NED', leagues: ['NED'], name: 'Hollanda Kupası', size: 16, fame: 1.0 },
  { id: 'cupPOR', country: 'POR', leagues: ['POR'], name: 'Portekiz Kupası', size: 16, fame: 1.0 },
  { id: 'cupBRA', country: 'BRA', leagues: ['BRA'], name: 'Brezilya Kupası', size: 16, fame: 1.1 },
  { id: 'cupARG', country: 'ARG', leagues: ['ARG'], name: 'Arjantin Kupası', size: 16, fame: 1.0 },
  { id: 'cupBEL', country: 'BEL', leagues: ['BEL'], name: 'Belçika Kupası', size: 16, fame: 0.9 },
  { id: 'cupSCO', country: 'SCO', leagues: ['SCO'], name: 'İskoçya Kupası', size: 8, fame: 0.8 },
  { id: 'cupAUT', country: 'AUT', leagues: ['AUT'], name: 'Avusturya Kupası', size: 8, fame: 0.7 },
  { id: 'cupSUI', country: 'SUI', leagues: ['SUI'], name: 'İsviçre Kupası', size: 8, fame: 0.7 },
  { id: 'cupGRE', country: 'GRE', leagues: ['GRE'], name: 'Yunanistan Kupası', size: 8, fame: 0.7 },
  { id: 'cupDEN', country: 'DEN', leagues: ['DEN'], name: 'Danimarka Kupası', size: 8, fame: 0.7 },
  { id: 'cupCRO', country: 'CRO', leagues: ['CRO'], name: 'Hırvatistan Kupası', size: 8, fame: 0.7 },
  { id: 'cupCZE', country: 'CZE', leagues: ['CZE'], name: 'Çekya Kupası', size: 8, fame: 0.7 },
  { id: 'cupPOL', country: 'POL', leagues: ['POL'], name: 'Polonya Kupası', size: 8, fame: 0.7 },
  { id: 'cupUKR', country: 'UKR', leagues: ['UKR'], name: 'Ukrayna Kupası', size: 8, fame: 0.7 },
  { id: 'cupUSA', country: 'USA', leagues: ['USA'], name: 'ABD Açık Kupası', size: 16, fame: 0.9 },
  { id: 'cupMEX', country: 'MEX', leagues: ['MEX'], name: 'Meksika Kupası', size: 16, fame: 0.9 },
  { id: 'cupKSA', country: 'KSA', leagues: ['KSA'], name: 'Suudi Kral Kupası', size: 16, fame: 1.0 },
  { id: 'cupJPN', country: 'JPN', leagues: ['JPN'], name: 'İmparator Kupası', size: 16, fame: 0.8 },
];
const countryOf = (lid) => LEAGUE_CC[lid] || lid;
const regionOf = (lid) => ({ BRA: 'sa', ARG: 'sa', USA: 'na', MEX: 'na', KSA: 'as', JPN: 'as' }[countryOf(lid)] || 'eu');

const Cups = {
  // ---------- Avrupa kulüp kupaları ----------
  // Lig sıralamasına göre katılım: Şampiyonlar → Federasyon → Konferans (ör. İngiltere'de ilk 7)
  defs: [
    // Şampiyonlar ve Federasyon: 32 takımlı lig aşaması (8 maç) → play-off → son 16 (güncel format)
    { id: 'ucl', name: 'Avrupa Şampiyonlar Kupası', fame: 2.2, region: 'eu', swiss: true, quota: { ENG: 4, ESP: 4, ITA: 4, GER: 4, FRA: 3, POR: 2, NED: 2, TR1: 2, BEL: 1, SCO: 1, AUT: 1, SUI: 1, GRE: 1, DEN: 1, CZE: 1 } },
    { id: 'uel', name: 'Avrupa Federasyon Kupası', fame: 1.5, region: 'eu', swiss: true, quota: { ENG: 2, ESP: 2, ITA: 2, GER: 2, FRA: 2, POR: 2, NED: 2, TR1: 2, BEL: 2, SCO: 1, AUT: 2, SUI: 2, GRE: 2, DEN: 1, CZE: 1, CRO: 2, UKR: 2, POL: 1 } },
    { id: 'uecl', name: 'Avrupa Konferans Kupası', fame: 1.1, region: 'eu', swiss: true, quota: { ENG: 1, ESP: 1, ITA: 1, GER: 1, FRA: 1, POR: 2, NED: 2, TR1: 2, BEL: 2, SCO: 2, AUT: 2, SUI: 2, GRE: 2, DEN: 2, CZE: 2, CRO: 2, UKR: 2, POL: 3 } },
    // Diğer kıtalar: 16 takımlı lig aşaması (6 maç) → ilk 8 çeyrek finale
    { id: 'csa', name: 'Güney Amerika Kupası', fame: 1.4, region: 'sa', swiss: true, quota: { BRA: 8, ARG: 8 } },
    { id: 'ccc', name: 'Kuzey Amerika Kupası', fame: 1.1, region: 'na', swiss: true, quota: { USA: 8, MEX: 8 } },
    { id: 'acl', name: 'Asya Şampiyonlar Kupası', fame: 1.2, region: 'as', swiss: true, quota: { KSA: 8, JPN: 8 } },
  ],
  // Kulübün lig sırasına göre gelecek sezon hangi kupaya gideceği
  qualifies(lid, pos) {
    let from = 0;
    for (const d of Cups.defs) {
      const q = d.quota[lid] || 0;
      if (pos > from && pos <= from + q) return d;
      from += q;
    }
    return null;
  },

  // Sezon başında katılımcılar: geçen sezonun sıralaması (yoksa güç) ile
  setup(s) {
    const w = s.world;
    s.cups = {};
    const taken = new Set();
    Cups.defs.forEach((d, k) => {
      const teams = [];
      Object.entries(d.quota).forEach(([lid, q]) => {
        if (!w.leagues[lid]) return;
        const order = (s.lastTables && s.lastTables[lid]) || Object.values(w.clubs).filter((c) => c.league === lid).sort((a, b) => b.rating - a.rating).map((c) => c.id);
        order.filter((id) => w.clubs[id] && w.clubs[id].league === lid && !taken.has(id)).slice(0, q).forEach((id) => { teams.push(id); taken.add(id); });
      });
      // eksik kalan yerler aynı liglerin en güçlü boştaki kulüpleriyle doldurulur (32 ya da 16 takım)
      if (d.swiss) {
        const want = Object.values(d.quota).reduce((a, b) => a + b, 0) >= 32 ? 32 : 16;
        if (teams.length < want) {
          Object.values(w.clubs).filter((c) => d.quota[c.league] && !taken.has(c.id)).sort((a, b) => b.rating - a.rating)
            .slice(0, want - teams.length).forEach((c) => { teams.push(c.id); taken.add(c.id); });
        }
        if (teams.length === 32 || teams.length === 16) { s.cups[d.id] = Cups.newSwiss(d, teams); return; }
      }
      if (teams.length < 2) return;
      const size = 1 << Math.floor(Math.log2(teams.length));
      s.cups[d.id] = { id: d.id, name: d.name, region: d.region, alive: U.shuffle(teams.slice(0, size)), stage: 0, log: [], winner: null };
    });
    // ülke kupaları: güçlüler garanti, kalan yerler kura ile
    DOM_CUPS.forEach((d) => {
      if (!d.leagues.every((l) => w.leagues[l])) return;
      const pool = Object.values(w.clubs).filter((c) => d.leagues.includes(c.league)).sort((a, b) => b.rating - a.rating);
      const size = Math.min(d.size, 1 << Math.floor(Math.log2(pool.length)));
      const seeded = pool.slice(0, Math.round(size * 0.6));
      const rest = U.shuffle(pool.slice(seeded.length)).slice(0, size - seeded.length);
      const teams = seeded.concat(rest).map((c) => c.id);
      const fr = size === 32 ? [0.13, 0.32, 0.53, 0.74, 0.95] : [0.32, 0.53, 0.74, 0.95];
      s.cups[d.id] = { id: d.id, name: d.name, dom: true, country: d.country, fr, alive: U.shuffle(teams), stage: 0, log: [], winner: null };
    });
    Cups.setupYouth(s);
  },

  // U19 Avrupa Gelişim Ligi: oyuncu U19'dayken kulübü Avrupa'nın güçlü altyapılarıyla eşleşir
  setupYouth(s) {
    if (!s.cups || s.cups.ygl || !Game.isYouth() || Game.inStreet() || !s.youth || s.youth.group !== 'U19') return;
    const w = s.world;
    const big = Object.values(w.clubs).filter((c) => ['ENG', 'ESP', 'GER', 'ITA', 'FRA', 'TR1'].includes(c.league) && c.id !== s.clubId).sort((a, b) => b.rating - a.rating);
    const teams = big.slice(0, 11).concat(U.shuffle(big.slice(11, 40)).slice(0, 4)).map((c) => c.id).concat([s.clubId]);
    const exp = expectedAtAge(18);
    const str = {}, ros = {};
    teams.forEach((id) => {
      const c = w.clubs[id];
      str[id] = id === s.clubId && s.youth.strength[id] ? s.youth.strength[id] : Math.round(exp * (0.82 + 0.36 * U.clamp((c.rating - 48) / 40, 0, 1)) + U.randi(-2, 2));
      ros[id] = id === s.clubId && s.youth.rosters[id] ? s.youth.rosters[id] : Youth.roster(c, str[id], 18);
    });
    s.cups.ygl = { id: 'ygl', name: 'Avrupa Gelişim Ligi (U19)', youth: true, fr: [0.24, 0.45, 0.66, 0.87], str, ros, alive: U.shuffle(teams), stage: 0, log: [], winner: null };
    Game.news(`${Game.club().name} U19 takımı bu sezon Avrupa Gelişim Ligi'nde! Avrupa'nın en iyi altyapılarıyla eşleşeceksin.`, 'good');
  },

  // Lig aşaması: herkes 8 (16 takımlıda 6) farklı rakiple oynar (çember yöntemi), tek tablo
  newSwiss(d, teams) {
    const t = U.shuffle(teams.slice());
    const n = t.length, fx = [], mds = n >= 32 ? 8 : 6;
    for (let r = 0; r < mds; r++) {
      const round = [];
      for (let i = 0; i < n / 2; i++) {
        const a = i === 0 ? t[0] : t[1 + ((i - 1 + r) % (n - 1))];
        const b = t[1 + ((n - 1 - i - 1 + r) % (n - 1))];
        round.push((r + i) % 2 ? [b, a] : [a, b]);
      }
      fx.push(round);
    }
    const table = {};
    t.forEach((id) => (table[id] = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }));
    return {
      id: d.id, name: d.name, region: d.region, fmt: 'swiss', phase: 'league', teams: t, table, fx, md: 0, mds, direct: [], out: [],
      // eleme turları (final hariç) iki maçlı: play-off, son 16, çeyrek ve yarı final
      legs2: true, leg: 1,
      fr: mds === 8
        ? [0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.47, 0.51, 0.57, 0.61, 0.69, 0.73, 0.83, 0.87, 0.97]
        : [0.05, 0.11, 0.18, 0.24, 0.29, 0.35, 0.55, 0.6, 0.76, 0.81, 0.97],
      alive: [], stage: 0, log: [], winner: null,
    };
  },

  swissTable(cup) {
    return Object.entries(cup.table).map(([id, r]) => Object.assign({ id }, r)).sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf);
  },

  // Kupada kulübün bu turdaki rakibi ve tur adı
  opponent(s, cup) {
    const me = s.clubId;
    if (cup.fmt === 'swiss' && cup.phase === 'league') {
      const f = (cup.fx[cup.md] || []).find(([h, a]) => h === me || a === me);
      return f ? { h: f[0], a: f[1], opp: f[0] === me ? f[1] : f[0], stage: `Lig Aşaması · ${cup.md + 1}. Maç` } : null;
    }
    const i = cup.alive.indexOf(me);
    if (i < 0) return null;
    const j = i % 2 === 0 ? i + 1 : i - 1;
    const base = cup.phase === 'po' ? 'Play-off' : STAGE_NAMES[cup.alive.length];
    if (Cups.twoLeg(cup)) {
      const B = cup.alive[Math.min(i, j)], W = cup.alive[Math.max(i, j)], leg = cup.leg || 1;
      const first = leg === 2 && cup.first ? cup.first[Math.min(i, j)] : null;
      return { h: leg === 1 ? W : B, a: leg === 1 ? B : W, opp: cup.alive[j], base, leg, first, stage: `${base} · ${Cups.legLabel(cup)}` };
    }
    return { h: cup.alive[Math.min(i, j)], a: cup.alive[Math.max(i, j)], opp: cup.alive[j], base, stage: base };
  },

  inCup(s, cup) {
    return cup.fmt === 'swiss' && cup.phase === 'league' ? cup.teams.includes(s.clubId) : cup.alive.includes(s.clubId);
  },

  // Lig aşamasında bir maç günü
  leagueDay(s, cup, mine) {
    const w = s.world;
    (cup.fx[cup.md] || []).forEach(([h, a]) => {
      let hs, as;
      if (mine && mine.h === h && mine.a === a) { hs = mine.r.a; as = mine.r.b; }
      else [hs, as] = World.simScore(w.clubs[h].rating + 1.5, w.clubs[a].rating);
      World.record(cup, h, a, hs, as);
      Cups.goals(s, cup, h, a, hs, as, mine);
      cup.log.push({ stage: `md${cup.md + 1}`, h, a, hs, as, w: hs > as ? h : as > hs ? a : null });
    });
    cup.md++; cup.stage++;
    const mds = cup.mds || 8;
    if (cup.md >= mds && mds < 8) {
      // 16 takımlı: ilk 8 çeyrek finale (1-8, 2-7 …), kalanlar elenir
      const tbl = Cups.swissTable(cup).map((r) => r.id);
      cup.direct = tbl.slice(0, 8); cup.out = tbl.slice(8);
      cup.alive = [];
      for (let i = 0; i < 4; i++) cup.alive.push(tbl[i], tbl[7 - i]);
      cup.phase = 'ko';
      const me = s.clubId, rk = tbl.indexOf(me) + 1;
      if (cup.direct.includes(me)) Game.news(`${cup.name} lig aşamasını ${rk}. bitirdik: çeyrek finaldeyiz!`, 'good');
      else if (rk > 0) Game.news(`${cup.name} lig aşamasında ${rk}. olduk ve elendik.`, 'bad');
    } else if (cup.md >= mds) {
      const tbl = Cups.swissTable(cup).map((r) => r.id);
      cup.direct = tbl.slice(0, 8);
      const po = tbl.slice(8, 24);
      cup.out = tbl.slice(24);
      cup.alive = [];
      for (let i = 0; i < 8; i++) cup.alive.push(po[i], po[15 - i]);
      cup.phase = 'po';
      const me = s.clubId;
      const near = !cup.region || cup.region === regionOf(w.clubs[me] ? w.clubs[me].league : 'TR1');
      if (cup.direct.includes(me)) Game.news(`${cup.name} lig aşamasını ${tbl.indexOf(me) + 1}. bitirdik: doğrudan son 16'dayız!`, 'good');
      else if (po.includes(me)) Game.news(`${cup.name} lig aşamasını ${tbl.indexOf(me) + 1}. bitirdik: play-off oynayacağız.`, '');
      else if (cup.out.includes(me)) Game.news(`${cup.name} lig aşamasında ${tbl.indexOf(me) + 1}. olduk ve elendik.`, 'bad');
      else if (near) Game.news(`${cup.name} lig aşaması tamamlandı. Lider: ${w.clubs[tbl[0]].name}.`, 'world');
    }
  },

  // Kupa gol/asist krallığı: oyuncunun maçında kendi gol ve asistleri işlenir
  goals(s, cup, h, a, hs, as, mine) {
    cup.scorers = cup.scorers || {};
    const ros = (id) => (cup.youth ? cup.ros[id] : s.world.clubs[id] && s.world.clubs[id].roster) || [];
    const isMine = mine && mine.h === h && mine.a === a && mine.sum;
    [[h, hs], [a, as]].forEach(([id, n]) => {
      let left = n;
      if (isMine && id === s.clubId) {
        const me = Player.fullName(s.player);
        const g = Math.min(left, mine.sum.goals || 0);
        for (let i = 0; i < g; i++) World.addScorer(cup, me, id);
        for (let i = 0; i < Math.min(n - g, mine.sum.assists || 0); i++) World.addAssist(cup, me, id);
        left -= g;
      }
      for (let i = 0; i < left; i++) World.goalWithAssist(cup, ros(id), id);
    });
  },

  // Kupa turu: lig aşaması günü ya da eleme turu
  advance(s, cup, mine) {
    if (cup.fmt === 'swiss' && cup.phase === 'league') return Cups.leagueDay(s, cup, mine);
    return Cups.playStage(s, cup, mine);
  },

  weeks(n, cup) {
    const wk = ((cup && cup.fr) || [0.2, 0.42, 0.63, 0.84]).map((f) => Math.round(n * f));
    // kısa liglerde iki tur aynı haftaya düşmesin (rövanş en az bir hafta sonra)
    for (let i = 1; i < wk.length; i++) if (wk[i] <= wk[i - 1]) wk[i] = wk[i - 1] + 1;
    return wk;
  },
  // Bu tur iki maçlı mı (çift maçlı kupada final hariç eleme turları)
  twoLeg(cup) { return !!cup.legs2 && !(cup.fmt === 'swiss' && cup.phase === 'league') && cup.alive.length > 2; },
  legLabel(cup) { return (cup.leg || 1) === 2 ? 'Rövanş' : 'İlk maç'; },

  myCountry(s) { const c = s.world.clubs[s.clubId]; return c ? countryOf(c.league) : null; },

  myCup(s) {
    if (!s.cups || Game.isYouth()) return null;
    return Object.values(s.cups).find((c) => !c.winner && c.alive.includes(s.clubId)) || null;
  },

  tie(rA, rB) {
    const [a, b] = World.simScore(rA + 2, rB);
    let win = a > b ? 0 : b > a ? 1 : null;
    let pens = null;
    if (win === null) { win = U.chance(U.sigmoid((rA - rB) / 12)) ? 0 : 1; pens = true; }
    return { a, b, win, pens };
  },

  // Bir turu oynatır; oyuncunun maçı varsa sonucu verilir
  // İki maçlı eleme turunun bir ayağı. Rövanşta toplam skor (eşitlikte penaltılar) turu belirler.
  playLeg(s, cup, mine) {
    const w = s.world, leg = cup.leg || 1, next = [], lines = [];
    const base = cup.phase === 'po' ? 'Play-off' : STAGE_NAMES[cup.alive.length];
    const rt = (id) => (cup.youth ? cup.str[id] : w.clubs[id].rating);
    if (leg === 1) cup.first = {};
    for (let i = 0; i < cup.alive.length; i += 2) {
      const B = cup.alive[i], W = cup.alive[i + 1]; // B: üst sıradaki, rövanşı evinde oynar
      const h = leg === 1 ? W : B, a = leg === 1 ? B : W;
      const isMine = !!(mine && mine.h === h && mine.a === a);
      const [hs, as] = isMine ? [mine.r.a, mine.r.b] : World.simScore(rt(h) + 2, rt(a));
      Cups.goals(s, cup, h, a, hs, as, isMine ? mine : null);
      const e = { stage: cup.phase === 'po' ? 'po' : cup.alive.length, leg, h, a, hs, as, w: null };
      if (leg === 1) cup.first[i] = { hs, as };
      else {
        const f = (cup.first && cup.first[i]) || { hs: 0, as: 0 };
        const gB = hs + f.as, gW = as + f.hs;
        let win = gB > gW ? B : gW > gB ? W : null;
        if (!win) { e.pens = true; win = U.chance(U.sigmoid((rt(B) - rt(W)) / 12 + 0.1)) ? B : W; }
        e.w = win; e.agg = [gB, gW];
        next.push(win);
        lines.push(`${w.clubs[B].name} ${gB}-${gW} ${w.clubs[W].name}${e.pens ? ' (pen.)' : ''}`);
      }
      cup.log.push(e);
    }
    cup.stage++;
    if (leg === 1) { cup.leg = 2; return { stageName: base, leg }; }
    cup.leg = 1; cup.first = null;
    if (cup.phase === 'po') {
      const al = [];
      for (let k = 0; k < 8; k++) al.push(cup.direct[k], next[7 - k] || next[k]);
      cup.alive = al;
      cup.phase = 'ko';
    } else cup.alive = next;
    const myLg = w.clubs[s.clubId] ? w.clubs[s.clubId].league : 'TR1';
    const near = cup.youth || !cup.region || cup.region === regionOf(myLg);
    if (!mine && near) Game.news(`${cup.name} ${base}: ${lines.slice(0, 3).join(' · ')}${lines.length > 3 ? ' ...' : ''}`, 'world');
    return { stageName: base, leg };
  },

  playStage(s, cup, mine) {
    if (Cups.twoLeg(cup)) return Cups.playLeg(s, cup, mine);
    const w = s.world;
    const next = [];
    const lines = [];
    for (let i = 0; i < cup.alive.length; i += 2) {
      const h = cup.alive[i], a = cup.alive[i + 1];
      let r;
      if (mine && (h === mine.h && a === mine.a)) r = mine.r;
      else r = cup.youth ? Cups.tie(cup.str[h], cup.str[a]) : Cups.tie(w.clubs[h].rating, w.clubs[a].rating);
      const winner = r.win === 0 ? h : a;
      next.push(winner);
      Cups.goals(s, cup, h, a, r.a, r.b, mine && h === mine.h && a === mine.a ? mine : null);
      cup.log.push({ stage: cup.alive.length, h, a, hs: r.a, as: r.b, pens: r.pens, w: winner });
      lines.push(`${w.clubs[h].name} ${r.a}-${r.b} ${w.clubs[a].name}${r.pens ? ' (pen.)' : ''}`);
    }
    const stageName = cup.phase === 'po' ? 'Play-off' : STAGE_NAMES[cup.alive.length];
    if (cup.phase === 'po') {
      cup.log.slice(-next.length).forEach((m) => (m.stage = 'po'));
      // play-off kazananları lig aşamasının ilk 8'iyle eşleşir
      const al = [];
      for (let i = 0; i < 8; i++) al.push(cup.direct[i], next[7 - i] || next[i]);
      cup.alive = al;
      cup.phase = 'ko';
    } else cup.alive = next;
    cup.stage++;
    const myLg = s.world.clubs[s.clubId] ? s.world.clubs[s.clubId].league : 'TR1';
    const near = cup.dom ? cup.country === Cups.myCountry(s) : (cup.youth || !cup.region || cup.region === regionOf(myLg));
    if (next.length === 1) {
      cup.winner = next[0];
      if (near) {
        s.cupHistory = s.cupHistory || [];
        s.cupHistory.unshift({ year: s.season.year, comp: cup.name, winner: w.clubs[next[0]].name });
      }
      Game.news(`${cup.name} finali: ${lines[0]}. Kupa ${w.clubs[next[0]].name} müzesine gidiyor!`, 'world');
    } else if (!mine && near) {
      Game.news(`${cup.name} ${stageName}: ${lines.slice(0, 3).join(' · ')}${lines.length > 3 ? ' ...' : ''}`, 'world');
    }
    return { stageName };
  },

  // Haftalık kontrol: bu hafta kupa turu var mı?
  week(s, r) {
    if (!s.cups) return;
    Object.values(s.cups).forEach((cup) => {
      const wk = Cups.weeks(Game.rounds(), cup);
      if (cup.winner || wk[cup.stage] !== r) return;
      const inIt = Cups.inCup(s, cup);
      const eligible = cup.youth ? Game.isYouth() : !Game.isYouth();
      if (eligible && inIt) {
        // aynı haftaya iki kupa maçı düşerse ikincisi sıraya alınır, atlanmaz
        if (s.pendingCup && s.pendingCup !== cup.id) { s.cupQueue = (s.cupQueue || []).filter((x) => x !== cup.id).concat(cup.id); return; }
        s.pendingCup = cup.id;
      } else Cups.advance(s, cup, null);
    });
  },

  // Sıradaki kupa maçı (aynı haftaya düşen ikinci kupa)
  nextQueued(s) {
    while (s.cupQueue && s.cupQueue.length) {
      const id = s.cupQueue.shift();
      const c = s.cups && s.cups[id];
      if (c && !c.winner && Cups.inCup(s, c)) { s.pendingCup = id; return true; }
    }
    return false;
  },

  // Oyuncunun kupa maçı
  async playMine(s) {
    const cup = s.cups[s.pendingCup];
    const op = Cups.opponent(s, cup);
    if (!op) { s.pendingCup = null; if (Cups.nextQueued(s)) { Game.save(); return Game.render(); } return Game.advanceWeek(true); }
    const { h, a } = op;
    const stageName = op.stage;
    const leaguePhase = cup.fmt === 'swiss' && cup.phase === 'league';
    const two = Cups.twoLeg(cup), leg = cup.leg || 1;
    const mk = (id) => { const c = s.world.clubs[id]; return cup.youth ? { id, name: `${c.name} U19`, short: c.short, rating: cup.str[id], c1: c.c1, c2: c.c2, roster: cup.ros[id] } : { id, name: c.name, short: c.short, rating: c.rating, c1: c.c1, c2: c.c2, roster: c.roster }; };
    const ctx = {
      home: mk(h), away: mk(a), side: h === s.clubId ? 'home' : 'away',
      compName: `${cup.name} · ${stageName}${op.first ? ` · İlk maç ${op.first.hs}-${op.first.as}` : ''}`, levelBase: Game.levelBase(false) + (cup.youth ? 0.05 : cup.dom ? 0.01 : 0.04),
      captain: Captain.is(), theme: cup.youth ? 'ygl' : cup.dom ? 'dom' : cup.id, lg: cup.youth ? 'ucl' : cup.dom ? s.world.clubs[s.clubId].league : cup.id, sbTag: cup.youth ? 'GELİŞİM LİGİ' : cup.dom ? cup.name.toLocaleUpperCase('tr') : null,
    };
    const p = s.player;
    ctx.role = p.injuryWeeks > 0 || Life.banned() ? 'out' : cup.youth ? Game.roleFor(Player.overall(p, true), cup.str[s.clubId], true) : Game.roleFor(Player.overall(p, true), s.world.clubs[s.clubId].rating, false);
    ctx.subChance = 0.6;
    if (typeof Big !== 'undefined' && !cup.youth) await Big.prepare(ctx, leaguePhase ? null : (op.base || stageName));
    const sum = await Match.run(ctx, s);
    let win = sum.hs > sum.as ? 0 : sum.as > sum.hs ? 1 : null, pens = null;
    if (win === null && !leaguePhase && !two) {
      pens = true;
      win = U.chance(0.5 + (ctx.side === 'home' ? 1 : -1) * (ctx.home.rating - ctx.away.rating) / 80) ? 0 : 1;
    }
    Game.applyMatch(sum, ctx, 'cup');
    let weWon = (win === 0) === (ctx.side === 'home');
    Cups.advance(s, cup, { h, a, sum, r: { a: sum.hs, b: sum.as, win, pens } });
    if (two) {
      const gf = ctx.side === 'home' ? sum.hs : sum.as, ga = ctx.side === 'home' ? sum.as : sum.hs;
      const e = cup.log.slice().reverse().find((m) => m.h === h && m.a === a && m.leg === leg) || {};
      if (leg === 1) Game.news(`${cup.name} ${op.base} ilk maçı: ${gf}-${ga}. Rövanş bir sonraki kupa haftasında.`, gf > ga ? 'good' : gf < ga ? 'bad' : '');
      else {
        weWon = e.w === s.clubId;
        const ag = e.h === s.clubId ? e.agg : [e.agg[1], e.agg[0]];
        if (e.pens) Game.news(`${cup.name} ${op.base}: toplam skor ${ag[0]}-${ag[1]}, ${weWon ? 'penaltılarla tur atladık!' : 'penaltılarla elendik.'}`, weWon ? 'good' : 'bad');
        else Game.news(`${cup.name} ${op.base}: toplamda ${ag[0]}-${ag[1]} ile ${weWon ? 'tur atladık!' : 'kupaya veda ettik.'}`, weWon ? 'good' : 'bad');
      }
    } else if (leaguePhase) {
      const gf = ctx.side === 'home' ? sum.hs : sum.as, ga = ctx.side === 'home' ? sum.as : sum.hs;
      const rank = Cups.swissTable(cup).findIndex((r) => r.id === s.clubId) + 1;
      Game.news(`${cup.name} ${stageName}: ${gf}-${ga} ${gf > ga ? 'galibiyet' : gf < ga ? 'mağlubiyet' : 'beraberlik'}. Lig aşamasında ${rank}. sıradayız.`, gf > ga ? 'good' : gf < ga ? 'bad' : '');
    } else if (pens) Game.news(`${cup.name} ${stageName} maçı penaltılara gitti: ${weWon ? 'penaltılarla tur atladık!' : 'penaltılarla elendik.'}`, weWon ? 'good' : 'bad');
    else Game.news(`${cup.name} ${stageName}: ${weWon ? 'tur atladık!' : 'kupaya veda ettik.'}`, weWon ? 'good' : 'bad');
    if (cup.winner === s.clubId) {
      p.trophies.push(`${s.season.year}: 🏆 ${cup.name} Şampiyonu`);
      Player.addFame(p, cup.youth ? 1.5 : cup.dom ? 3 : 6);
      Social.post('trophy', cup.youth ? `${cup.name} şampiyonuyuz! Avrupa'nın en iyi altyapısı bizde.` : cup.dom ? `${cup.name} bizim! Bu kupa taraftarımıza armağan.` : cup.region && cup.region !== 'eu' ? `${cup.name} bizim! Kıtanın zirvesindeyiz.` : `${cup.name} bizim! Avrupa'nın zirvesindeyiz.`, cup.dom ? 2.2 : 3);
    }
    s.pendingCup = null;
    if (cup.winner === s.clubId && typeof Celebrate !== 'undefined') await Celebrate.champion(`${cup.name} Şampiyonu`, Game.teamName());
    if (Cups.nextQueued(s)) { Game.save(); Game.render(); return; }
    Game.advanceWeek(true);
  },

  // ---------- Milli turnuvalar ----------
  tourType(year) {
    if (year % 4 === 2) return 'wc';
    if (year % 4 === 0 && year >= 1984) return 'euro';
    if (year % 2 === 1 && year >= 2019) return 'nl';
    return null;
  },

  natTeam(code) {
    const n = Game.nat(code);
    const col = NAT_COLORS[code] || ['#1d3c8f', '#ffffff'];
    const stars = Game.natStars(code);
    const roster = stars.map((name, i) => ({ n: name, pos: i < 2 ? 'FW' : 'MF', r: n.rating + 3 }));
    while (roster.length < 14) roster.push({ n: World.genName(code === 'TUR' ? 'TR' : 'XX'), pos: U.pick(['DF', 'MF', 'DF', 'FW']), r: n.rating - 3 });
    return { id: code, name: n.name, rating: n.rating, c1: col[0], c2: col[1], roster };
  },

  startTournament(s) {
    const type = Cups.tourType(s.season.year);
    const name = `${s.season.year} ${Cups.tourName(type)}`;
    let pool = type === 'wc' ? Game.nations() : Game.nations().filter((n) => EURO_NATIONS.includes(n.code));
    let size = type === 'wc' ? 16 : type === 'nl' ? 4 : 8;
    while (size > pool.length) size /= 2;
    if (type === 'nl') {
      // Uluslar Ligi: sıralamadaki en iyi 4 Avrupa takımı finallerde
      const rk = Nations.ranking(s).map((x) => x.code);
      pool = pool.map((n) => n.code).sort((a, b) => rk.indexOf(a) - rk.indexOf(b)).slice(0, size);
    } else {
      // güce göre ama biraz sürprizle seçilir
      pool = pool.map((n) => ({ n, k: n.rating + U.rand(-6, 6) })).sort((a, b) => b.k - a.k).map((x) => x.n.code).slice(0, size);
    }
    const p = s.player;
    // çifte vatandaş henüz seçim yapmadıysa turnuvada olan ve onu çağıran ülke seçilir (kalıcı)
    if (!p.natLocked && p.parents && p.parents.f !== p.parents.m) {
      const opt = Game.eligibleNats().map((c) => Game.nat(c)).find((n) => n && pool.includes(n.code) && Player.overall(p, true) >= n.rating - 7 - (p.fame > 40 ? 2 : 0));
      if (opt && p.age >= 17 && !Life.banned() && p.injuryWeeks === 0) { p.nation = opt.code; p.natLocked = true; Game.news(`${opt.name} milli takımını seçtin: turnuva kadrosundasın!`, 'good'); }
    }
    const nat = Game.nation();
    const called = p.age >= 17 && p.injuryWeeks === 0 && !Life.banned() && pool.includes(nat.code) && Player.overall(p, true) >= nat.rating - 7 - (p.fame > 40 ? 2 : 0);
    s.tournament = { type, name, alive: U.shuffle(pool), called, inPool: pool.includes(nat.code), done: false, myGoals: 0, teams: pool.slice(), elim: {} };
  },

  simTourStage(s, mine) {
    const t = s.tournament;
    const next = [];
    const lines = [];
    for (let i = 0; i < t.alive.length; i += 2) {
      const h = t.alive[i], a = t.alive[i + 1];
      const nh = Game.nat(h), na = Game.nat(a);
      const r = mine && mine.h === h && mine.a === a ? mine.r : Cups.tie(nh.rating - 2, na.rating);
      next.push(r.win === 0 ? h : a);
      t.elim = t.elim || {};
      t.elim[r.win === 0 ? a : h] = t.alive.length;
      lines.push(`${nh.name} ${r.a}-${r.b} ${na.name}${r.pens ? ' (pen.)' : ''}`);
    }
    const stageName = STAGE_NAMES[t.alive.length];
    t.alive = next;
    return { stageName, lines };
  },

  // Turnuvayı oynatır; oyuncu kadrodaysa maçlarını kendisi oynar
  async runTournament(s) {
    const t = s.tournament;
    const nat = Game.nation();
    const p = s.player;
    Game.news(`${t.name} başladı! ${t.called ? `${nat.name} kadrosundasın.` : t.inPool ? `${nat.name} turnuvada ama kadroya çağrılmadın.` : `${nat.name} turnuvaya katılamadı.`}`, t.called ? 'good' : '');
    if (t.called) {
      Social.post('daily', `${t.name} için milli takım kampındayım. Ay-yıldızlı forma için her şeyimi vereceğim!`, 1.6, Social.natOpts());
      await Cups.ask(`<div class="ev-tag">Milli turnuva</div><h2>${t.name}</h2><p><b>${nat.name}</b> kadrosuna çağrıldın! Turnuvada ${t.alive.length} takım var; eleme usulüyle oynanacak.</p>`, 'Turnuvaya Başla');
    }
    while (t.alive.length > 1) {
      const myIn = t.called && t.alive.includes(nat.code);
      if (myIn) {
        const i = t.alive.indexOf(nat.code);
        const j = i % 2 === 0 ? i + 1 : i - 1;
        const h = t.alive[Math.min(i, j)], a = t.alive[Math.max(i, j)];
        const oppCode = h === nat.code ? a : h;
        const opp = Game.nat(oppCode);
        const stageName = STAGE_NAMES[t.alive.length];
        await Cups.ask(`<div class="ev-tag">${t.name}</div><h2>${stageName}</h2><p><b>${nat.name}</b> vs <b>${opp.name}</b> · Rakibin yıldızları: ${U.esc(Game.natStars(oppCode).slice(0, 2).join(', ') || '—')}</p>`, 'Maça Çık');
        const ctx = { home: Cups.natTeam(h), away: Cups.natTeam(a), side: h === nat.code ? 'home' : 'away', compName: `${t.name} · ${stageName}`, levelBase: Game.levelBase(true) + 0.03, lg: t.type, theme: t.type };
        ctx.role = p.injuryWeeks > 0 ? 'out' : Game.roleFor(Player.overall(p, true), nat.rating, false);
        if (ctx.role === 'out' && p.injuryWeeks === 0) ctx.role = 'bench';
        ctx.subChance = 0.7;
        const sum = await Match.run(ctx, s);
        Game.applyMatch(sum, ctx, 'intl');
        t.myGoals += sum.goals;
        let win = sum.hs > sum.as ? 0 : sum.as > sum.hs ? 1 : null, pens = null;
        if (win === null) { pens = true; win = U.chance(0.5) ? 0 : 1; }
        const res = Cups.simTourStage(s, { h, a, r: { a: sum.hs, b: sum.as, win, pens } });
        const weWon = t.alive.includes(nat.code);
        Game.news(`${t.name} ${res.stageName}: ${nat.name} ${weWon ? 'tur atladı' : 'elendi'}${pens ? ' (penaltılar)' : ''}.`, weWon ? 'good' : 'bad');
      } else {
        const res = Cups.simTourStage(s, null);
        Game.news(`${t.name} ${res.stageName}: ${res.lines.slice(0, 4).join(' · ')}`, 'world');
      }
    }
    const champ = Game.nat(t.alive[0]);
    s.cupHistory = s.cupHistory || [];
    s.cupHistory.unshift({ year: s.season.year, comp: t.name.replace(/^\d+ /, ''), winner: champ.name });
    Game.news(`${t.name} şampiyonu: ${champ.name}!`, 'world');
    if (t.called && champ.code === nat.code) {
      p.trophies.push(`${s.season.year}: 🏆 ${Cups.tourName(t.type)} Şampiyonu`);
      Player.addFame(p, t.type === 'wc' ? 15 : t.type === 'nl' ? 5 : 9);
      Social.post('trophy', `${t.name} ŞAMPİYONUYUZ! Bu kupa tüm ülkemizin.`, 6, Social.natOpts());
      if (typeof Celebrate !== 'undefined') await Celebrate.champion(`${Cups.tourName(t.type)} Şampiyonu`, nat.name, true);
    }
    t.done = true;
    Nations.afterTournament(s, t, champ.code);
    Game.save();
    await Cups.ask(`<div class="ev-tag">${t.name}</div><h2>Şampiyon: ${champ.name}</h2><p>${t.called ? (champ.code === nat.code ? 'Tarih yazdın! Kupayı kaldıran takımın parçasıydın.' : `Turnuvada ${t.myGoals} gol attın. Bir dahaki sefere!`) : 'Turnuvayı televizyondan izledin.'}</p>`, 'Sezon Sonuna Geç');
  },

  ask(html, btn) {
    return new Promise((res) => Game.modal(html, [{ t: btn, cls: 'btn-big', fn: res }]));
  },

  // Lig sekmesindeki kupa ekranı: kupa seçici, lig aşaması tablosu, maçlarım, eleme turları
  screen(s) {
    if (!s.cups) return '<section class="card"><p class="muted">Bu sezon kupa yok.</p></section>';
    const w = s.world;
    const name = (id) => (w.clubs[id] ? w.clubs[id].name : id) + (s.cups[UI.cupSel] && s.cups[UI.cupSel].youth ? ' U19' : '');
    const myLg = w.clubs[s.clubId] ? w.clubs[s.clubId].league : 'TR1';
    const list = Object.values(s.cups).filter((c) => (c.dom ? c.country === Cups.myCountry(s) : c.youth || !c.region || c.region === regionOf(myLg)));
    const mineFirst = list.slice().sort((a, b) => (Cups.everIn(s, b) ? 1 : 0) - (Cups.everIn(s, a) ? 1 : 0));
    let sel = s.cups[UI.cupSel] && list.includes(s.cups[UI.cupSel]) ? s.cups[UI.cupSel] : mineFirst[0];
    if (!sel) return '<section class="card"><p class="muted">Bu sezon kupa yok.</p></section>';
    UI.cupSel = sel.id;
    const nm = (id) => (w.clubs[id] ? w.clubs[id].name : id) + (sel.youth ? ' U19' : '');
    const shirt = (id) => UI.shirt(w.clubs[id] || Game.club());
    const res = (m) => `<div class="cm2 ${m.h === s.clubId || m.a === s.clubId ? 'me' : ''}"><span class="t h ${m.w === m.h ? 'w' : ''}"><em>${U.esc(nm(m.h))}</em>${shirt(m.h)}</span><b>${m.hs}-${m.as}${m.pens ? '<small>p</small>' : ''}${m.leg ? `<small class="leg">${m.leg === 2 ? `Rövanş · Toplam ${m.agg[0]}-${m.agg[1]}` : 'İlk maç'}</small>` : ''}</b><span class="t a ${m.w === m.a ? 'w' : ''}">${shirt(m.a)}<em>${U.esc(nm(m.a))}</em></span></div>`;
    const status = sel.winner ? `Şampiyon: <b>${U.esc(nm(sel.winner))}</b>` : sel.fmt === 'swiss' && sel.phase === 'league' ? `Lig aşaması · ${sel.md}/${sel.mds || 8} maç oynandı` : `${sel.phase === 'po' ? 'Play-off' : STAGE_NAMES[sel.alive.length] || ''} · ${sel.alive.length} takım${Cups.twoLeg(sel) ? ` <em class="leg-tag">${Cups.legLabel(sel)}</em>` : ''}`;
    let body = '';
    if (sel.fmt === 'swiss') {
      const tbl = Cups.swissTable(sel);
      body += `<div class="lbl">Lig aşaması <small>${(sel.mds || 8) === 8 ? 'İlk 8 son 16 · 9-24 play-off · 25-32 elenir' : 'İlk 8 çeyrek final · 9-16 elenir'}</small></div>
        <div class="tscroll"><table class="tbl lgt sw">
          <tr><th>#</th><th class="l">Takım</th><th>O</th><th>AV</th><th>P</th></tr>
          ${tbl.map((r, i) => `<tr class="${r.id === s.clubId ? 'hl' : ''} ${i < 8 ? 'z-r16' : i < 24 && (sel.mds || 8) === 8 ? 'z-po' : 'z-out'}"><td><span class="rk">${i + 1}</span></td><td class="l"><span class="tm">${shirt(r.id)}${U.esc(nm(r.id))}</span></td><td>${r.p}</td><td class="${r.gf - r.ga > 0 ? 'pos' : r.gf - r.ga < 0 ? 'neg' : ''}">${r.gf - r.ga > 0 ? '+' : ''}${r.gf - r.ga}</td><td><b class="pts">${r.pts}</b></td></tr>`).join('')}
        </table></div>`;
      if (sel.teams.includes(s.clubId)) {
        body += `<div class="lbl">Lig aşaması maçların</div><div class="cup-my">${sel.fx.map((round, k) => {
          const f = round.find(([h, a]) => h === s.clubId || a === s.clubId);
          if (!f) return '';
          const m = sel.log.find((x) => x.stage === `md${k + 1}` && x.h === f[0] && x.a === f[1]);
          return m ? res(m) : `<div class="cm2 next"><span class="t h"><em>${U.esc(nm(f[0]))}</em>${shirt(f[0])}</span><b>${k}. maç</b><span class="t a">${shirt(f[1])}<em>${U.esc(nm(f[1]))}</em></span></div>`.replace(`${k}. maç`, `${k + 1}. maç`);
        }).join('')}</div>`;
      }
    }
    // eleme turları
    const stages = [];
    const order = ['po', 32, 16, 8, 4, 2];
    order.forEach((st) => {
      const ms = sel.log.filter((m) => m.stage === st);
      if (ms.length) stages.push([st === 'po' ? 'Play-off' : STAGE_NAMES[st], ms]);
    });
    if (stages.length) body += stages.map(([t, ms]) => `<div class="lbl">${t}</div><div class="cup-ko">${ms.map(res).join('')}</div>`).join('');
    else if (sel.fmt !== 'swiss') body += `<div class="lbl">Eşleşmeler</div><div class="cup-ko">${Array.from({ length: sel.alive.length / 2 }, (_, i) => `<div class="cm2 next ${sel.alive[i * 2] === s.clubId || sel.alive[i * 2 + 1] === s.clubId ? 'me' : ''}"><span class="t h"><em>${U.esc(nm(sel.alive[i * 2]))}</em>${shirt(sel.alive[i * 2])}</span><b>vs</b><span class="t a">${shirt(sel.alive[i * 2 + 1])}<em>${U.esc(nm(sel.alive[i * 2 + 1]))}</em></span></div>`).join('')}</div>`;
    const tourNext = [0, 1, 2, 3].map((k) => s.season.year + k).find((y) => Cups.tourType(y));
    const hist = (s.cupHistory || []).slice(0, 8);
    return `<section class="card cupscr">
      <div class="cup-sel">${list.map((c) => `<button class="${c === sel ? 'on' : ''} ${Cups.everIn(s, c) ? 'mine' : ''}" data-cupsel="${c.id}">${U.esc(c.name.replace('Avrupa ', ''))}</button>`).join('')}</div>
      <div class="cup-hd"><h3>${U.esc(sel.name)}</h3><small>${status}</small></div>
      ${body}
    </section>
    ${sel.scorers && Object.keys(sel.scorers).length ? UI.kings(sel, nm, (id) => w.clubs[id] || Game.club(), sel.name) : ''}
    <section class="card">
      ${hist.length ? `<div class="lbl">Geçmiş şampiyonlar</div><div class="cup-hist">${hist.map((h) => `<div><small>${h.year}</small><span>${U.esc(h.comp)}</span><b>${U.esc(h.winner)}</b></div>`).join('')}</div>` : ''}
      ${tourNext ? `<p class="muted">Sıradaki milli turnuva: ${tourNext} ${Cups.tourName(Cups.tourType(tourNext))}</p>` : ''}
    </section>`;
  },

  everIn(s, cup) {
    return (cup.teams || []).includes(s.clubId) || cup.alive.includes(s.clubId) || cup.log.some((m) => m.h === s.clubId || m.a === s.clubId);
  },

  tourName(t) { return { wc: 'Dünya Kupası', euro: 'Avrupa Şampiyonası', nl: 'Uluslar Ligi Finalleri' }[t] || ''; },
};

// Milli takım sıralaması: güç + turnuva başarısı + milli maç sonuçları (puanlar yavaşça güce döner)
const Nations = {
  ensure(s) {
    s.natPts = s.natPts || {};
    Game.nations().forEach((n) => { if (s.natPts[n.code] == null) s.natPts[n.code] = Math.round(n.rating * 20 + U.randi(-25, 25)); });
    return s.natPts;
  },
  ranking(s) {
    const pts = Nations.ensure(s);
    return Game.nations().map((n) => ({ code: n.code, name: n.name, rating: n.rating, pts: Math.round(pts[n.code]) })).sort((a, b) => b.pts - a.pts);
  },
  add(s, code, v) { const pts = Nations.ensure(s); pts[code] = (pts[code] || 0) + v; },
  afterTournament(s, t, champ) {
    const bonus = { wc: [130, 80, 50, 25, 10], euro: [100, 60, 35, 18, 8], nl: [60, 35, 20, 10, 5] }[t.type] || [50, 30, 15, 8, 4];
    (t.teams || []).forEach((c) => {
      const el = (t.elim || {})[c];
      const v = c === champ ? bonus[0] : el === 2 ? bonus[1] : el === 4 ? bonus[2] : el === 8 ? bonus[3] : bonus[4];
      Nations.add(s, c, v);
    });
  },
  // sezon sonu: puanlar güce doğru biraz geri döner, sıralama değişimi için eski sıra saklanır
  season(s) {
    const pts = Nations.ensure(s);
    s.natPrevRank = {};
    Nations.ranking(s).forEach((r, i) => (s.natPrevRank[r.code] = i + 1));
    Game.nations().forEach((n) => { pts[n.code] = pts[n.code] * 0.85 + n.rating * 20 * 0.15; });
  },
  screen(s) {
    const rk = Nations.ranking(s);
    const prev = s.natPrevRank || {};
    const me = s.player.nation;
    const ty = [0, 1, 2, 3, 4].map((k) => s.season.year + k).map((y) => ({ y, t: Cups.tourType(y) })).filter((x) => x.t);
    const hist = (s.cupHistory || []).filter((h) => /Dünya Kupası|Avrupa Şampiyonası|Uluslar Ligi/.test(h.comp)).slice(0, 10);
    const p = s.player;
    return `<section class="card nat-rank">
      <div class="card-h"><span>${Icon('shield')} Milli Takım Sıralaması</span><small class="muted">${s.season.year}</small></div>
      <div class="nr-list">${rk.map((r, i) => {
        const d = prev[r.code] ? prev[r.code] - (i + 1) : 0;
        return `<div class="nr-row ${r.code === me ? 'me' : ''} ${i < 3 ? 'top' + (i + 1) : ''}">
          <span class="nr-rk">${i + 1}</span><span class="nr-mv ${d > 0 ? 'up' : d < 0 ? 'down' : ''}">${d > 0 ? '▲' + d : d < 0 ? '▼' + -d : '–'}</span>
          <span class="nr-code" style="--n1:${(NAT_COLORS[r.code] || ['#1d3c8f'])[0]};--n2:${(NAT_COLORS[r.code] || ['#1d3c8f', '#fff'])[1]};--nt:${U.lum((NAT_COLORS[r.code] || ['#1d3c8f'])[0]) > 0.6 ? '#0a1530' : '#fff'}">${r.code}</span>
          <span class="nr-t"><b>${U.esc(r.name)}</b><small>${U.esc(Game.natStars(r.code).slice(0, 2).join(', ') || '—')}</small></span>
          <span class="nr-p"><b>${r.pts}</b><small>puan</small></span></div>`;
      }).join('')}</div>
    </section>
    <div class="grid2">
      <section class="card">
        <div class="card-h"><span>${Icon('career')} Turnuva Takvimi</span></div>
        <div class="tour-cal">${ty.map((x) => `<div class="tc ${x.t}"><b>${x.y}</b><span>${Cups.tourName(x.t)}</span><small>${x.t === 'nl' ? 'Sıralamadaki en iyi 4 Avrupa takımı' : x.t === 'wc' ? '16 ülke, eleme' : '8 Avrupa ülkesi, eleme'}</small></div>`).join('')}</div>
        <div class="lbl">Senin milli kariyerin</div>
        <div class="ms-stats"><div class="mst"><i>${Icon('shield')}</i><b>${p.intl.caps}</b><span>Maç</span></div><div class="mst"><i>${Icon('ball')}</i><b>${p.intl.goals}</b><span>Gol</span></div><div class="mst"><i>${Icon('table')}</i><b>${rk.findIndex((r) => r.code === me) + 1 || '-'}</b><span>Ülke sırası</span></div></div>
      </section>
      <section class="card">
        <div class="card-h"><span>${Icon('star')} Geçmiş Şampiyonlar</span></div>
        ${hist.length ? `<div class="cup-hist">${hist.map((h) => `<div><small>${h.year}</small><span>${U.esc(h.comp)}</span><b>${U.esc(h.winner)}</b></div>`).join('')}</div>` : '<p class="muted">Kariyerinde henüz milli turnuva oynanmadı.</p>'}
      </section>
    </div>`;
  },
};
