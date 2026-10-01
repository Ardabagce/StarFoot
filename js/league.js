// Dünya: kulüpler, kadrolar, fikstür, lig simülasyonu

const World = {
  genName(pool) {
    const p = NAME_POOLS[pool] || NAME_POOLS.XX;
    return `${U.pick(p.f)} ${U.pick(p.l)}`;
  },

  genRoster(club, year) {
    const roster = [];
    // Günümüz kadrolarındaki tanınmış isimler yalnızca 2020 sonrası başlangıçlarda
    const legendNames = new Set(LEGENDS.map((x) => x[0]));
    const stars = (year >= 2020 ? STARS[club.id] || [] : []).filter((x) => !legendNames.has(x[0]));
    stars.forEach(([n, pos, r, nat]) => roster.push({ n, pos, r, nat, age: U.randi(22, 32), star: true }));
    const need = { GK: 2, DF: 6, MF: 6, FW: 4 };
    roster.forEach((pl) => (need[pl.pos] = Math.max(0, need[pl.pos] - 1)));
    for (const pos in need) {
      for (let i = 0; i < need[pos]; i++) {
        const foreign = U.chance(club.pool === 'TR' ? 0.3 : 0.35);
        roster.push({
          n: World.genName(foreign ? 'XX' : club.pool),
          pos,
          r: Math.round(U.clamp(club.rating + U.randi(-9, 3), 35, 92)),
          nat: foreign ? 'XX' : club.pool,
          age: U.randi(18, 34),
        });
      }
    }
    return roster;
  },

  create(year = 2026) {
    const clubs = {};
    CLUB_LIST.forEach(([id, name, short, league, rating, c1, c2, pool]) => {
      const club = { id, name, short, league, rating, c1, c2, pool };
      club.roster = World.genRoster(club, year);
      clubs[id] = club;
    });
    const world = { clubs, leagues: {}, year };
    Legends.init(world, year);
    LEAGUES.forEach((l) => {
      world.leagues[l.id] = World.newLeagueSeason(Object.values(clubs).filter((c) => c.league === l.id).map((c) => c.id));
    });
    return world;
  },

  newLeagueSeason(ids) {
    const table = {};
    ids.forEach((id) => (table[id] = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }));
    return { ids, fixtures: World.fixtures(ids), table, results: [], scorers: {} };
  },

  // Çift devreli lig fikstürü (çember yöntemi)
  fixtures(ids) {
    const t = U.shuffle(ids);
    if (t.length % 2) t.push(null);
    const n = t.length;
    const rounds = [];
    for (let r = 0; r < n - 1; r++) {
      const round = [];
      for (let i = 0; i < n / 2; i++) {
        const a = t[i], b = t[n - 1 - i];
        if (a && b) round.push(r % 2 === 0 ? [a, b] : [b, a]);
      }
      rounds.push(round);
      t.splice(1, 0, t.pop());
    }
    const second = rounds.map((r) => r.map(([a, b]) => [b, a]));
    return rounds.concat(second);
  },

  lambdas(rh, ra) {
    const d = (rh + 2 - ra) / 25;
    return [1.4 * Math.exp(d), 1.15 * Math.exp(-d)];
  },

  simScore(rh, ra) {
    const [lh, la] = World.lambdas(rh, ra);
    return [Math.min(U.poisson(lh), 9), Math.min(U.poisson(la), 9)];
  },

  pickScorer(roster) {
    const w = { FW: 5, MF: 2.2, DF: 0.6, GK: 0.01 };
    return U.weighted(roster, (pl) => w[pl.pos] * Math.pow(pl.r / 70, 3));
  },

  pickAssister(roster, scorer) {
    const w = { FW: 1.5, MF: 3, DF: 1, GK: 0.05 };
    return U.weighted(roster.filter((p) => p !== scorer), (pl) => w[pl.pos] * Math.pow(pl.r / 70, 2));
  },

  record(league, h, a, hs, as) {
    const th = league.table[h], ta = league.table[a];
    th.p++; ta.p++;
    th.gf += hs; th.ga += as; ta.gf += as; ta.ga += hs;
    if (hs > as) { th.w++; ta.l++; th.pts += 3; }
    else if (hs < as) { ta.w++; th.l++; ta.pts += 3; }
    else { th.d++; ta.d++; th.pts++; ta.pts++; }
  },

  addScorer(league, name, clubId) {
    const key = name + '|' + clubId;
    league.scorers[key] = (league.scorers[key] || 0) + 1;
  },

  // Ligin bir haftasını oynatır (skip: oyuncunun oynayacağı maç)
  simRound(lg, round, rosters, ratingFn, skip) {
    const fx = lg.fixtures[round];
    if (!fx) return;
    fx.forEach(([h, a]) => {
      if (skip && skip[0] === h && skip[1] === a) return;
      const [hs, as] = World.simScore(ratingFn(h), ratingFn(a));
      World.record(lg, h, a, hs, as);
      lg.results.push({ round, h, a, hs, as });
      for (let i = 0; i < hs; i++) World.addScorer(lg, World.pickScorer(rosters(h)).n, h);
      for (let i = 0; i < as; i++) World.addScorer(lg, World.pickScorer(rosters(a)).n, a);
    });
  },

  sortedTable(lg) {
    return Object.entries(lg.table)
      .map(([id, t]) => Object.assign({ id }, t))
      .sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf);
  },

  topScorers(lg, n = 10) {
    return Object.entries(lg.scorers)
      .map(([k, g]) => { const [name, club] = k.split('|'); return { name, club, g }; })
      .sort((a, b) => b.g - a.g)
      .slice(0, n);
  },

  // Sezon sonu: küme düşme, güç değişimi, kadro yenileme
  endSeason(world) {
    const tr1 = World.sortedTable(world.leagues.TR1);
    const tr2 = World.sortedTable(world.leagues.TR2);
    const down = tr1.slice(-3).map((r) => r.id);
    const up = tr2.slice(0, 3).map((r) => r.id);
    down.forEach((id) => (world.clubs[id].league = 'TR2'));
    up.forEach((id) => (world.clubs[id].league = 'TR1'));
    // Güç kayması: başarılı takımlar biraz güçlenir
    LEAGUES.forEach((l) => {
      const tbl = World.sortedTable(world.leagues[l.id]);
      tbl.forEach((row, i) => {
        const c = world.clubs[row.id];
        const drift = (tbl.length / 2 - i) * 0.25 + U.rand(-1.5, 1.5);
        const base = CLUB_LIST.find((x) => x[0] === c.id)[4];
        c.rating = Math.round(U.clamp(c.rating + drift + (base - c.rating) * 0.3, 42, 90));
        // kadroyu tazele
        c.roster.forEach((pl) => {
          pl.age++;
          if (!pl.star) pl.r = Math.round(U.clamp(c.rating + U.randi(-9, 3), 35, 92));
          else if (pl.lid == null && pl.age >= 31) pl.r = Math.max(50, pl.r - U.randi(1, 3));
        });
        c.roster = c.roster.filter((pl) => pl.lid != null || pl.age < 35 || U.chance(0.4));
        const need = { GK: 2, DF: 6, MF: 6, FW: 4 };
        c.roster.forEach((pl) => (need[pl.pos] = Math.max(0, need[pl.pos] - 1)));
        for (const pos in need) for (let i = 0; i < need[pos]; i++) {
          c.roster.push({ n: World.genName(U.chance(0.3) ? 'XX' : c.pool), pos, r: Math.round(U.clamp(c.rating + U.randi(-9, 3), 35, 92)), age: U.randi(18, 24) });
        }
      });
    });
    LEAGUES.forEach((l) => {
      world.leagues[l.id] = World.newLeagueSeason(Object.values(world.clubs).filter((c) => c.league === l.id).map((c) => c.id));
    });
    return { down, up };
  },

  teamAvg(club) {
    const top = club.roster.slice().sort((a, b) => b.r - a.r).slice(0, 11);
    return top.reduce((s, p) => s + p.r, 0) / top.length;
  },
};

// Altyapı ligi: oyuncunun kulübünün ligindeki takımların yaş grubu takımları
const Youth = {
  create(world, clubId, age) {
    const leagueId = world.clubs[clubId].league;
    const ids = Object.values(world.clubs).filter((c) => c.league === leagueId).map((c) => c.id);
    const exp = expectedAtAge(age);
    const strength = {};
    const rosters = {};
    ids.forEach((id) => {
      const r = world.clubs[id].rating;
      strength[id] = Math.round(exp * (0.82 + 0.36 * U.clamp((r - 48) / 40, 0, 1)) + U.randi(-2, 2));
      rosters[id] = Youth.roster(world.clubs[id], strength[id], age);
    });
    const lg = World.newLeagueSeason(ids);
    return Object.assign(lg, { group: ageGroupName(age), strength, rosters, leagueId });
  },

  roster(club, str, age) {
    const r = [];
    const need = { GK: 2, DF: 5, MF: 5, FW: 4 };
    for (const pos in need) for (let i = 0; i < need[pos]; i++) {
      r.push({ n: World.genName(club.pool), pos, r: Math.round(U.clamp(str + U.randi(-7, 5), 5, 80)), age });
    }
    return r;
  },
};
