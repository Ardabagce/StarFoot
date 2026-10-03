// Avrupa kulüp kupaları ve milli turnuvalar (Dünya Kupası, Avrupa Şampiyonası)

const NAT_COLORS = {
  TUR: ['#c8102e', '#ffffff'], ARG: ['#75aadb', '#ffffff'], FRA: ['#1d2c5e', '#ffffff'], ESP: ['#c8102e', '#ffcc00'],
  ENG: ['#ffffff', '#1d2c5e'], BRA: ['#ffdf00', '#009639'], POR: ['#8e1b1b', '#006600'], GER: ['#ffffff', '#111111'],
  NED: ['#f36c21', '#ffffff'], ITA: ['#1f4fa3', '#ffffff'], BEL: ['#c8102e', '#111111'], CRO: ['#ffffff', '#c8102e'],
  NOR: ['#c8102e', '#1d2c5e'], EGY: ['#c8102e', '#ffffff'], POL: ['#ffffff', '#c8102e'], GEO: ['#ffffff', '#c8102e'], AZE: ['#0092bc', '#c8102e'],
};
const EURO_NATIONS = ['TUR', 'FRA', 'ESP', 'ENG', 'POR', 'GER', 'NED', 'ITA', 'BEL', 'CRO', 'NOR', 'POL', 'GEO', 'AZE'];
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
];
const countryOf = (lid) => LEAGUE_CC[lid] || lid;
const regionOf = (lid) => (['BRA', 'ARG'].includes(countryOf(lid)) ? 'sa' : 'eu');

const Cups = {
  // ---------- Avrupa kulüp kupaları ----------
  // Lig sıralamasına göre katılım: Şampiyonlar → Federasyon → Konferans (ör. İngiltere'de ilk 7)
  defs: [
    { id: 'ucl', name: 'Avrupa Şampiyonlar Kupası', fame: 2.2, region: 'eu', quota: { ENG: 3, ESP: 3, GER: 3, ITA: 2, FRA: 2, TR1: 1, NED: 1, POR: 1 } },
    { id: 'uel', name: 'Avrupa Federasyon Kupası', fame: 1.5, region: 'eu', quota: { ENG: 2, ESP: 2, GER: 2, ITA: 2, FRA: 2, TR1: 2, NED: 2, POR: 2 } },
    { id: 'uecl', name: 'Avrupa Konferans Kupası', fame: 1.1, region: 'eu', quota: { ENG: 2, ESP: 2, GER: 2, ITA: 2, FRA: 2, TR1: 2, NED: 2, POR: 2 } },
    { id: 'csa', name: 'Güney Amerika Kupası', fame: 1.4, region: 'sa', quota: { BRA: 8, ARG: 8 } },
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

  weeks(n, cup) { return ((cup && cup.fr) || [0.2, 0.42, 0.63, 0.84]).map((f) => Math.round(n * f)); },

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
  playStage(s, cup, mine) {
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
      cup.log.push({ stage: cup.alive.length, h, a, hs: r.a, as: r.b, pens: r.pens, w: winner });
      lines.push(`${w.clubs[h].name} ${r.a}-${r.b} ${w.clubs[a].name}${r.pens ? ' (pen.)' : ''}`);
    }
    const stageName = STAGE_NAMES[cup.alive.length];
    cup.alive = next;
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
      if (s.pendingCup && cup.alive.includes(s.clubId)) { Cups.playStage(s, cup, null); return; }
      const eligible = cup.youth ? Game.isYouth() : !Game.isYouth();
      if (eligible && cup.alive.includes(s.clubId)) s.pendingCup = cup.id;
      else Cups.playStage(s, cup, null);
    });
  },

  // Oyuncunun kupa maçı
  async playMine(s) {
    const cup = s.cups[s.pendingCup];
    const i = cup.alive.indexOf(s.clubId);
    const j = i % 2 === 0 ? i + 1 : i - 1;
    const h = cup.alive[Math.min(i, j)], a = cup.alive[Math.max(i, j)];
    const stageName = STAGE_NAMES[cup.alive.length];
    const mk = (id) => { const c = s.world.clubs[id]; return cup.youth ? { id, name: `${c.name} U19`, short: c.short, rating: cup.str[id], c1: c.c1, c2: c.c2, roster: cup.ros[id] } : { id, name: c.name, short: c.short, rating: c.rating, c1: c.c1, c2: c.c2, roster: c.roster }; };
    const ctx = {
      home: mk(h), away: mk(a), side: h === s.clubId ? 'home' : 'away',
      compName: `${cup.name} · ${stageName}`, levelBase: Game.levelBase(false) + (cup.youth ? 0.05 : cup.dom ? 0.01 : 0.04),
      captain: Captain.is(), lg: cup.youth ? 'ucl' : cup.dom ? s.world.clubs[s.clubId].league : cup.id, sbTag: cup.youth ? 'GELİŞİM LİGİ' : cup.dom ? cup.name.toLocaleUpperCase('tr') : null,
    };
    const p = s.player;
    ctx.role = p.injuryWeeks > 0 ? 'out' : cup.youth ? Game.roleFor(Player.overall(p, true), cup.str[s.clubId], true) : Game.roleFor(Player.overall(p, true), s.world.clubs[s.clubId].rating, false);
    ctx.subChance = 0.6;
    const sum = await Match.run(ctx, s);
    let win = sum.hs > sum.as ? 0 : sum.as > sum.hs ? 1 : null, pens = null;
    if (win === null) {
      pens = true;
      win = U.chance(0.5 + (ctx.side === 'home' ? 1 : -1) * (ctx.home.rating - ctx.away.rating) / 80) ? 0 : 1;
    }
    Game.applyMatch(sum, ctx, 'cup');
    const weWon = (win === 0) === (ctx.side === 'home');
    Cups.playStage(s, cup, { h, a, r: { a: sum.hs, b: sum.as, win, pens } });
    if (pens) Game.news(`${cup.name} ${stageName} maçı penaltılara gitti: ${weWon ? 'penaltılarla tur atladık!' : 'penaltılarla elendik.'}`, weWon ? 'good' : 'bad');
    else Game.news(`${cup.name} ${stageName}: ${weWon ? 'tur atladık!' : 'kupaya veda ettik.'}`, weWon ? 'good' : 'bad');
    if (cup.winner === s.clubId) {
      p.trophies.push(`${s.season.year}: 🏆 ${cup.name} Şampiyonu`);
      Player.addFame(p, cup.youth ? 1.5 : cup.dom ? 3 : 6);
      Social.post('trophy', cup.youth ? `${cup.name} şampiyonuyuz! Avrupa'nın en iyi altyapısı bizde.` : cup.dom ? `${cup.name} bizim! Bu kupa taraftarımıza armağan.` : cup.region === 'sa' ? `${cup.name} bizim! Kıtanın zirvesindeyiz.` : `${cup.name} bizim! Avrupa'nın zirvesindeyiz.`, cup.dom ? 2.2 : 3);
    }
    s.pendingCup = null;
    Game.advanceWeek(true);
  },

  // ---------- Milli turnuvalar ----------
  tourType(year) {
    if (year % 4 === 2) return 'wc';
    if (year % 4 === 0 && year >= 1984) return 'euro';
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
    const name = type === 'wc' ? `${s.season.year} Dünya Kupası` : `${s.season.year} Avrupa Şampiyonası`;
    let pool = type === 'wc' ? Game.nations() : Game.nations().filter((n) => EURO_NATIONS.includes(n.code));
    let size = type === 'wc' ? 16 : 8;
    while (size > pool.length) size /= 2;
    // güce göre ama biraz sürprizle seçilir
    pool = pool.map((n) => ({ n, k: n.rating + U.rand(-6, 6) })).sort((a, b) => b.k - a.k).map((x) => x.n.code).slice(0, size);
    const p = s.player;
    const nat = Game.nation();
    const called = p.age >= 17 && p.injuryWeeks === 0 && pool.includes(nat.code) && Player.overall(p, true) >= nat.rating - 7 - (p.fame > 40 ? 2 : 0);
    s.tournament = { type, name, alive: U.shuffle(pool), called, inPool: pool.includes(nat.code), done: false, myGoals: 0 };
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
      Social.post('daily', `${t.name} için milli takım kampındayım. Ay-yıldızlı forma için her şeyimi vereceğim!`, 1.6);
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
        const ctx = { home: Cups.natTeam(h), away: Cups.natTeam(a), side: h === nat.code ? 'home' : 'away', compName: `${t.name} · ${stageName}`, levelBase: Game.levelBase(true) + 0.03, lg: t.type };
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
      p.trophies.push(`${s.season.year}: 🏆 ${t.type === 'wc' ? 'Dünya Kupası' : 'Avrupa Şampiyonası'} Şampiyonu`);
      Player.addFame(p, t.type === 'wc' ? 15 : 9);
      Social.post('trophy', `${t.name} ŞAMPİYONUYUZ! Bu kupa tüm ülkemizin.`, 6);
    }
    t.done = true;
    Game.save();
    await Cups.ask(`<div class="ev-tag">${t.name}</div><h2>Şampiyon: ${champ.name}</h2><p>${t.called ? (champ.code === nat.code ? 'Tarih yazdın! Kupayı kaldıran takımın parçasıydın.' : `Turnuvada ${t.myGoals} gol attın. Bir dahaki sefere!`) : 'Turnuvayı televizyondan izledin.'}</p>`, 'Sezon Sonuna Geç');
  },

  ask(html, btn) {
    return new Promise((res) => Game.modal(html, [{ t: btn, cls: 'btn-big', fn: res }]));
  },

  // Lig sekmesindeki kupa kartı
  render(s) {
    if (!s.cups) return '';
    const w = s.world;
    const name = (id) => (w.clubs[id] ? w.clubs[id].name : id);
    const block = (cup) => {
      const stages = {};
      cup.log.forEach((m) => { (stages[m.stage] = stages[m.stage] || []).push(m); });
      const keys = Object.keys(stages).map(Number).sort((a, b) => b - a);
      const last = keys.length ? stages[keys[0]] : null;
      const mine = cup.alive.includes(s.clubId) || cup.log.some((m) => m.h === s.clubId || m.a === s.clubId);
      return `<div class="cup">
        <div class="cup-h"><b>${U.esc(cup.name)}</b><small>${cup.winner ? `Şampiyon: ${U.esc(name(cup.winner))}` : `${STAGE_NAMES[cup.alive.length] || ''} · ${cup.alive.length} takım kaldı`}</small></div>
        ${last ? `<div class="cup-list">${last.map((m) => `<div class="cm ${m.h === s.clubId || m.a === s.clubId ? 'me' : ''}"><span class="${m.w === m.h ? 'w' : ''}">${U.esc(name(m.h))}</span><b>${m.hs}-${m.as}${m.pens ? 'p' : ''}</b><span class="${m.w === m.a ? 'w' : ''}">${U.esc(name(m.a))}</span></div>`).join('')}</div>`
          : `<div class="cup-teams">${cup.alive.map((id) => `<span class="${id === s.clubId ? 'me' : ''}">${UI.shirt(w.clubs[id])}${U.esc(name(id))}</span>`).join('')}</div>`}
        ${mine && !cup.winner && cup.alive.includes(s.clubId) ? '<p class="cup-in">Kulübün bu kupada yarışıyor.</p>' : ''}
      </div>`;
    };
    const tourNext = [0, 1, 2, 3].map((k) => s.season.year + k).find((y) => Cups.tourType(y));
    const hist = (s.cupHistory || []).slice(0, 8);
    return `<section class="card">
      <div class="card-h"><span>${Icon('career')} Kupalar</span><small class="muted">Sıradaki milli turnuva: ${tourNext} ${Cups.tourType(tourNext) === 'wc' ? 'Dünya Kupası' : 'Avrupa Şampiyonası'}</small></div>
      <div class="cups">${Object.values(s.cups).filter((c) => (c.dom ? c.country === Cups.myCountry(s) : c.youth || !c.region || c.region === regionOf(s.world.clubs[s.clubId] ? s.world.clubs[s.clubId].league : 'TR1'))).map(block).join('')}</div>
      ${hist.length ? `<div class="lbl">Geçmiş şampiyonlar</div><div class="cup-hist">${hist.map((h) => `<div><small>${h.year}</small><span>${U.esc(h.comp)}</span><b>${U.esc(h.winner)}</b></div>`).join('')}</div>` : ''}
    </section>`;
  },
};
