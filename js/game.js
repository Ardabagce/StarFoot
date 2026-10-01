// Oyun durumu, kariyer akışı ve arayüz

const SAVE_KEY = 'starfoot_save_v1';
const ROUNDS = 18;
const INTL_AFTER = [5, 10, 15];

const Game = {
  state: null,
  tab: 'home',

  // ---------- Kaydet / Yükle ----------
  save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(Game.state)); } catch (e) { /* depolama yok */ }
  },
  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  },
  wipe() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* yok */ } },

  // ---------- Yardımcılar ----------
  get p() { return Game.state.player; },
  club(id) { return Game.state.world.clubs[id || Game.state.clubId]; },
  isYouth() { return Game.state.contract.type === 'youth'; },
  league() { return Game.isYouth() ? Game.state.youth : Game.state.world.leagues[Game.club().league]; },
  leagueName() {
    if (Game.isYouth()) return `${LEAGUES.find((l) => l.id === Game.state.youth.leagueId).name} ${Game.state.youth.group}`;
    return LEAGUES.find((l) => l.id === Game.club().league).name;
  },
  teamName(id) {
    const c = Game.club(id);
    return Game.isYouth() ? `${c.name} ${Game.state.youth.group}` : c.name;
  },
  teamRating(id) { return Game.isYouth() ? Game.state.youth.strength[id] : Game.state.world.clubs[id].rating; },
  teamRoster(id) { return Game.isYouth() ? Game.state.youth.rosters[id] : Game.state.world.clubs[id].roster; },
  nation() { return NATIONS.find((n) => n.code === Game.p.nation) || NATIONS[0]; },
  facility() { return 0.9 + 0.35 * U.clamp((Game.club().rating - 48) / 40, 0, 1); },
  weeklyIncome() {
    const c = Game.state.contract;
    return c.type === 'youth' ? 100 + (Game.p.age - 8) * 40 : c.wage;
  },
  wageFor(rating, ovr) {
    return Math.round((1500 * Math.pow(1.13, rating - 45) * Math.pow(U.clamp(ovr / rating, 0.6, 1.3), 2)) / 100) * 100;
  },
  nextFixture() {
    const lg = Game.league();
    const fx = lg.fixtures[Game.state.season.round];
    if (!fx) return null;
    const f = fx.find(([h, a]) => h === Game.state.clubId || a === Game.state.clubId);
    return f ? { home: f[0], away: f[1] } : null;
  },
  news(txt, type = '') {
    const s = Game.state;
    s.news.unshift({ t: txt, type, w: `${s.season.year} H${s.season.round + 1}` });
    s.news = s.news.slice(0, 40);
  },
  toast(msg, type = '') {
    const box = document.getElementById('toasts');
    const d = U.el(`<div class="toast ${type}">${U.plain(msg)}</div>`);
    box.appendChild(d);
    while (box.children.length > 4) box.firstChild.remove();
    setTimeout(() => d.classList.add('out'), 2600);
    setTimeout(() => d.remove(), 3100);
  },
  show(id) {
    ['title', 'create', 'hub', 'end'].forEach((s) => document.getElementById(s).classList.toggle('hidden', s !== id));
  },

  // ---------- Başlangıç ----------
  init() {
    const save = Game.load();
    const cont = document.getElementById('btn-continue');
    if (save && save.player) {
      cont.classList.remove('hidden');
      cont.textContent = `Devam Et — ${save.player.name} ${save.player.surname} (${save.player.age} yaş)`;
    }
    cont.onclick = () => { Game.state = Game.load(); Game.enterHub(); };
    document.getElementById('btn-new').onclick = () => Create.open();
    Game.show('title');
  },

  newCareer(opts) {
    const world = World.create();
    const player = Player.create(opts);
    Game.state = {
      v: 1,
      player,
      world,
      clubId: opts.clubId,
      contract: { type: 'youth', clubId: opts.clubId, wage: 0, years: 0 },
      season: { year: 2026, round: 0, stats: Game.blankSeason(), intlDone: [] },
      youth: Youth.create(world, opts.clubId, 8),
      ap: 3,
      week: { coachTalk: false },
      trainFocus: POSITIONS[opts.position] ? Object.keys(POSITIONS[opts.position].w)[0] : 'shooting',
      news: [],
      offers: [],
      pendingIntl: null,
      pendingEvent: null,
      seasonEnd: null,
    };
    Game.news(`${opts.name}, ${Game.club().name} altyapısına katıldı! Futbol serüveni 8 yaşında başlıyor. ⚽`, 'good');
    Game.news(`${Game.state.youth.group} takımında ilk sezonuna hazırlan. Antrenman yap, maçlarda kendini göster!`);
    Game.save();
    Game.enterHub();
    Game.modal(`
      <h2>Hoş geldin, ${U.esc(opts.name)}!</h2>
      <p>8 yaşındasın ve <b>${U.esc(Game.club().name)}</b> altyapısında ilk gününü yaşıyorsun.</p>
      <ul class="tips">
        <li>Her hafta <b>3 aksiyon hakkın</b> var: antrenman, dinlenme, takım arkadaşlarıyla vakit geçirme...</li>
        <li><b>Maçlarda</b> kritik anlar gelince oyun duraklar: topun arkasına doğru <b>sürükleyip bırakarak</b> şut çeker veya pas verirsin.</li>
        <li>Statların ne kadar yüksekse vuruşların o kadar sert ve isabetli olur.</li>
        <li>Hocayla ilişkin iyi olursa ilk 11'de oynarsın. Enerjin düşükse performansın düşer.</li>
        <li>18 yaşına geldiğinde profesyonel sözleşme imzalayıp A takıma çıkacaksın!</li>
      </ul>`, [{ t: 'Başlayalım!', cls: 'btn-big' }]);
  },

  blankSeason() { return { apps: 0, goals: 0, assists: 0, ratingSum: 0, motm: 0, minutes: 0 }; },

  enterHub() {
    Game.show('hub');
    Game.tab = 'home';
    Game.render();
    Game.checkPending();
  },

  checkPending() {
    const s = Game.state;
    if (s.seasonEnd) return SeasonEnd.show();
    if (s.pendingEvent) return Events.show();
  },

  // ---------- Haftalık aksiyonlar ----------
  act(kind) {
    const s = Game.state, p = s.player;
    if (s.ap <= 0) return Game.toast('Bu hafta için aksiyon hakkın kalmadı. Maça çık!', 'bad');
    const injured = p.injuryWeeks > 0;
    const focus = s.trainFocus;
    const lbl = STATS.find((x) => x.k === focus).l;
    const fmt = (g) => `+${g.toFixed(2)} ${lbl}`;
    switch (kind) {
      case 'train': {
        if (injured) return Game.toast('Sakatken antrenman yapamazsın.', 'bad');
        if (p.energy < 12) return Game.toast('Antrenman için enerjin yetersiz.', 'bad');
        Player.addEnergy(p, -12);
        const g = Player.train(p, focus, 1, Game.facility());
        Game.toast(`🏃 Antrenman: ${fmt(g)}`, 'good');
        break;
      }
      case 'intense': {
        if (injured) return Game.toast('Sakatken antrenman yapamazsın.', 'bad');
        if (p.energy < 24) return Game.toast('Yoğun antrenman için enerjin yetersiz.', 'bad');
        Player.addEnergy(p, -24);
        const g = Player.train(p, focus, 1.8, Game.facility());
        Game.toast(`🔥 Yoğun antrenman: ${fmt(g)}`, 'good');
        if (U.chance(Player.injuryChance(p, 0.035))) Game.injure(U.randi(1, 3), 'yoğun antrenmanda');
        break;
      }
      case 'coach': {
        if (injured) return Game.toast('Sakatken antrenman yapamazsın.', 'bad');
        const cost = Game.coachCost();
        if (p.money < cost) return Game.toast(`Özel hoca için ${U.money(cost)} gerekiyor.`, 'bad');
        if (p.energy < 14) return Game.toast('Enerjin yetersiz.', 'bad');
        p.money -= cost;
        Player.addEnergy(p, -14);
        const g = Player.train(p, focus, 2.3, Game.facility());
        Game.toast(`👨‍🏫 Özel hoca: ${fmt(g)}`, 'good');
        break;
      }
      case 'rest': {
        Player.addEnergy(p, 20);
        Player.addMorale(p, 2);
        Game.toast('😴 Dinlendin: Enerji +20', 'good');
        break;
      }
      case 'team': {
        const cost = Game.isYouth() ? 50 : Math.round(Game.weeklyIncome() * 0.02);
        if (p.money < cost) return Game.toast('Yeterli paran yok.', 'bad');
        p.money -= cost;
        Player.addEnergy(p, -5);
        Player.addRel(p, 'team', U.randi(3, 6));
        Player.addMorale(p, 3);
        Game.toast('🍕 Takım arkadaşlarınla vakit geçirdin: Takım ilişkisi arttı', 'good');
        break;
      }
      case 'talk': {
        if (s.week.coachTalk) return Game.toast('Bu hafta hocayla zaten konuştun.', 'bad');
        s.week.coachTalk = true;
        const g = p.rel.coach < 40 ? U.randi(3, 6) : U.randi(1, 4);
        Player.addRel(p, 'coach', g);
        Game.toast(`🗣️ Hocayla konuştun: Hoca ilişkisi +${g}`, 'good');
        break;
      }
      case 'fans': {
        Player.addEnergy(p, -3);
        Player.addRel(p, 'fans', U.randi(2, 4));
        Player.addFame(p, Game.isYouth() ? 0.1 : 0.4);
        Game.toast('📱 Taraftarlarla etkileşim: Taraftar ilişkisi arttı', 'good');
        break;
      }
    }
    s.ap--;
    Game.save();
    Game.render();
  },

  coachCost() { return Game.isYouth() ? 300 + (Game.p.age - 8) * 50 : Math.max(2000, Math.round(Game.weeklyIncome() * 0.25)); },

  injure(weeks, where) {
    const p = Game.p;
    p.injuryWeeks = Math.max(p.injuryWeeks, weeks);
    Player.addMorale(p, -6);
    Game.news(`🤕 ${where} sakatlandın. ${weeks} hafta sahalardan uzak kalacaksın.`, 'bad');
    Game.toast(`🤕 Sakatlandın! (${weeks} hafta)`, 'bad');
  },

  // ---------- Maç ----------
  // Mini oyun zorluğu: yaş grubu ve lig seviyesiyle artar
  levelBase(intl) {
    if (intl) return 0.55;
    if (Game.isYouth()) return { U10: 0.08, U12: 0.15, U14: 0.22, U16: 0.29, U19: 0.35 }[Game.state.youth.group] || 0.3;
    const lg = Game.club().league;
    return lg === 'TR2' ? 0.38 : lg === 'TR1' ? 0.45 : 0.52;
  },

  roleFor(ovr, teamR, youth, preview = false) {
    const p = Game.p;
    const margin = ovr - teamR + (p.rel.coach - 50) / 8 + (p.energy < 35 ? -3 : 0);
    if (youth) return margin >= -6 ? 'starter' : 'bench';
    if (margin >= -3) return 'starter';
    if (margin >= -12) return 'bench';
    return !preview && U.chance(0.3) ? 'bench' : 'out';
  },

  async playNext() {
    const s = Game.state, p = s.player;
    if (s.pendingIntl) return Game.playIntl();
    const fx = Game.nextFixture();
    if (!fx) return Game.endSeason();
    const youth = Game.isYouth();
    const mk = (id) => {
      const c = s.world.clubs[id];
      return { id, name: Game.teamName(id), short: c.short, rating: Game.teamRating(id), c1: c.c1, c2: c.c2, roster: Game.teamRoster(id) };
    };
    const ctx = {
      home: mk(fx.home), away: mk(fx.away),
      side: fx.home === s.clubId ? 'home' : 'away',
      compName: `${Game.leagueName()} • ${s.season.round + 1}. Hafta`,
      levelBase: Game.levelBase(false),
    };
    const ovr = Player.overall(p, true);
    if (p.injuryWeeks > 0) {
      ctx.role = 'out';
      Game.toast('Sakat olduğun için bu maçta oynayamıyorsun.', 'bad');
    } else {
      ctx.role = Game.roleFor(ovr, Game.teamRating(s.clubId), youth);
      ctx.subChance = youth ? 0.85 : 0.6;
    }
    const sum = await Match.run(ctx, s);
    Game.applyMatch(sum, ctx, 'league');
    // ligin geri kalanı
    const lg = Game.league();
    World.record(lg, fx.home, fx.away, sum.hs, sum.as);
    lg.results.push({ round: s.season.round, h: fx.home, a: fx.away, hs: sum.hs, as: sum.as });
    const ownId = s.clubId, oppId = ctx.side === 'home' ? fx.away : fx.home;
    sum.ownScorers.forEach((n) => World.addScorer(lg, n, ownId));
    sum.oppScorers.forEach((n) => World.addScorer(lg, n, oppId));
    if (youth) World.simRound(lg, s.season.round, (id) => s.youth.rosters[id], (id) => s.youth.strength[id], [fx.home, fx.away]);
    LEAGUES.forEach((l) => {
      const skip = !youth && l.id === Game.club().league ? [fx.home, fx.away] : null;
      World.simRound(s.world.leagues[l.id], s.season.round, (id) => s.world.clubs[id].roster, (id) => s.world.clubs[id].rating, skip);
    });
    s.season.round++;
    Game.advanceWeek();
  },

  async playIntl() {
    const s = Game.state, p = s.player;
    const nat = Game.nation();
    const opp = s.pendingIntl;
    const oppNat = NATIONS.find((n) => n.code === opp);
    const mkRoster = (n) => {
      const r = n.stars.map((name, i) => ({ n: name, pos: i < 2 ? 'FW' : 'MF', r: n.rating + 3 }));
      while (r.length < 14) r.push({ n: World.genName(n.code === 'TUR' ? 'TR' : 'XX'), pos: U.pick(['DF', 'MF', 'DF', 'FW']), r: n.rating - 3 });
      return r;
    };
    const ownRoster = mkRoster(nat).filter((x) => x.n !== Player.fullName(p));
    const home = U.chance(0.5);
    const ownT = { id: nat.code, name: nat.name, rating: nat.rating, c1: '#c8102e', c2: '#ffffff', roster: ownRoster };
    const oppT = { id: oppNat.code, name: oppNat.name, rating: oppNat.rating, c1: '#1d3c8f', c2: '#ffffff', roster: mkRoster(oppNat) };
    const ctx = {
      home: home ? ownT : oppT, away: home ? oppT : ownT, side: home ? 'home' : 'away',
      compName: `Milli Maç • ${nat.name} - ${oppNat.name}`,
      levelBase: Game.levelBase(true),
    };
    ctx.role = p.injuryWeeks > 0 ? 'out' : Game.roleFor(Player.overall(p, true), nat.rating, false);
    if (ctx.role === 'out' && p.injuryWeeks === 0) ctx.role = 'bench';
    ctx.subChance = 0.7;
    const sum = await Match.run(ctx, s);
    s.pendingIntl = null;
    Game.applyMatch(sum, ctx, 'intl');
    Game.advanceWeek(true);
  },

  applyMatch(sum, ctx, comp) {
    const s = Game.state, p = s.player;
    const youth = Game.isYouth() && comp !== 'intl';
    const lg = LEAGUES.find((l) => l.id === Game.club().league);
    const fameMult = comp === 'intl' ? 2 : youth ? 0.15 : lg.fame;
    const oppName = ctx.side === 'home' ? ctx.away.name : ctx.home.name;
    const resTxt = { W: 'kazandı', D: 'berabere kaldı', L: 'kaybetti' }[sum.res];
    const teamTxt = comp === 'intl' ? Game.nation().name : Game.teamName();

    if (sum.played) {
      if (comp === 'intl') {
        p.intl.caps++; p.intl.goals += sum.goals;
      } else {
        const ss = s.season.stats;
        ss.apps++; ss.goals += sum.goals; ss.assists += sum.assists; ss.ratingSum += sum.rating; ss.minutes += sum.minutes;
        if (sum.motm) ss.motm++;
      }
      p.totals.apps++; p.totals.goals += sum.goals; p.totals.assists += sum.assists; p.totals.ratingSum += sum.rating;
      if (sum.motm) p.totals.motm++;

      const r = sum.rating;
      Player.addRel(p, 'coach', (r - 6.3) * 4);
      Player.addRel(p, 'team', (sum.res === 'W' ? 2 : sum.res === 'L' ? -1 : 0.5) + sum.assists);
      Player.addRel(p, 'fans', sum.goals * 2 + (r - 6.5) * 3);
      const fameGain = (sum.goals * 0.45 + sum.assists * 0.25 + (r >= 8 ? 0.5 : 0) + (sum.motm ? 0.5 : 0)) * fameMult;
      if (youth) p.fame = Math.max(p.fame, Math.min(p.fame + fameGain, 4 + (p.age - 8) * 1.5));
      else Player.addFame(p, fameGain);
      Player.addMorale(p, (sum.res === 'W' ? 4 : sum.res === 'L' ? -4 : 0) + (r - 6.5) * 2);
      const stam = p.stats.stamina;
      Player.addEnergy(p, -(15 + (sum.minutes / 90) * 25) * (1.3 - stam / 150));
      Player.matchXp(p, sum.statsUsed.length ? sum.statsUsed : ['stamina']);
      Player.matchXp(p, ['stamina']);
      if (U.chance(Player.injuryChance(p, 0.025) * (sum.minutes / 90))) Game.injure(U.randi(1, 6), 'Maçta');

      // primler
      let bonus = 0;
      if (youth) bonus = sum.goals * 50 + sum.assists * 25;
      else if (comp === 'intl') bonus = 0;
      else bonus = Math.round(s.contract.wage * (sum.goals * 0.1 + sum.assists * 0.05 + (sum.res === 'W' ? 0.15 : 0)));
      if (bonus > 0) p.money += bonus;
      if (sum.red) {
        Player.addRel(p, 'coach', -6);
        Game.news('🟥 Kırmızı kart gördün. Hoca hiç memnun değil.', 'bad');
      }

      let line = `${teamTxt}, ${oppName} karşısında ${sum.gf}-${sum.ga} ${resTxt}. Reytingin: <b>${sum.rating.toFixed(1)}</b>`;
      if (sum.goals) line += ` • ⚽ ${sum.goals} gol`;
      if (sum.assists) line += ` • 🎯 ${sum.assists} asist`;
      if (sum.motm) line += ' • ⭐ Maçın adamı';
      Game.news(line, sum.res === 'W' ? 'good' : sum.res === 'L' ? 'bad' : '');
      if (bonus > 0) Game.news(`💰 Maç primi: ${U.money(bonus)}`);
    } else {
      Player.addMorale(p, -3);
      if (p.injuryWeeks === 0) Player.addRel(p, 'coach', 0.5);
      Game.news(`${teamTxt}, ${oppName} karşısında ${sum.gf}-${sum.ga} ${resTxt}. (Forma giymedin)`, sum.res === 'W' ? 'good' : sum.res === 'L' ? 'bad' : '');
    }
    if (comp === 'intl' && sum.played) Game.news(`🇹🇷 Milli formayla ${p.intl.caps}. maçına çıktın!`, 'good');
  },

  advanceWeek(intl = false) {
    const s = Game.state, p = s.player;
    s.ap = 3;
    s.week = { coachTalk: false };
    Player.addEnergy(p, Player.energyRegen(p));
    // gelir
    const inc = Game.weeklyIncome();
    p.money += inc;
    // yaşam tarzı
    let morale = 0;
    p.items.forEach((id) => { const it = ITEMS.find((i) => i.id === id); if (it && it.morale) morale += it.morale; });
    Player.addMorale(p, morale + (p.morale < 50 ? 1 : -0.5));
    if (p.injuryWeeks > 0) {
      p.injuryWeeks--;
      if (p.injuryWeeks === 0) Game.news('💪 Sakatlığın geçti, tekrar sahalara dönebilirsin!', 'good');
    }
    // hoca ilişkisi zamanla ortalamaya döner
    p.rel.coach += (50 - p.rel.coach) * 0.02;
    p.rel.fans += (35 - p.rel.fans) * 0.01;
    if (!Game.isYouth()) Player.addFame(p, -0.08);

    if (!intl) {
      const r = s.season.round;
      // milli takım
      if (INTL_AFTER.includes(r)) Game.checkCallup();
      // ara transfer dönemi
      if (r === 9 && !Game.isYouth()) {
        const offers = Game.makeOffers(U.randi(0, 2), false);
        if (offers.length) {
          s.offers = offers;
          Game.news(`📨 Ara transfer döneminde ${offers.length} teklif aldın! Ana sayfadan inceleyebilirsin.`, 'good');
        }
      }
      if (r === 11) s.offers = [];
      if (r >= ROUNDS) {
        Game.save();
        return Game.endSeason();
      }
    }
    if (!s.pendingEvent && U.chance(0.33)) Events.roll();
    Game.save();
    Game.render();
    Game.checkPending();
  },

  checkCallup() {
    const s = Game.state, p = s.player;
    const nat = Game.nation();
    const ovr = Player.overall(p, true);
    const need = nat.rating - 7 - (p.fame > 40 ? 2 : 0);
    if (p.age >= 17 && ovr >= need && p.injuryWeeks === 0) {
      const opp = U.pick(NATIONS.filter((n) => n.code !== nat.code));
      s.pendingIntl = opp.code;
      Game.news(`${nat.flag} MİLLİ TAKIMA ÇAĞRILDIN! ${opp.flag} ${opp.name} maçı seni bekliyor.`, 'good');
      Game.toast(`${nat.flag} Milli takıma çağrıldın!`, 'good');
      Player.addMorale(p, 8);
      Player.addFame(p, 1.5);
    }
  },

  makeOffers(n, mandatory) {
    const s = Game.state, p = s.player;
    const ovr = Player.overall(p, true);
    const cur = s.clubId;
    let cands = Object.values(s.world.clubs).filter((c) => {
      if (c.id === cur) return false;
      const lf = LEAGUES.find((l) => l.id === c.league).fame;
      if (lf > 1.05 && p.fame < 12 && ovr < c.rating - 1) return false;
      return c.rating >= ovr - 10 && c.rating <= ovr + 5 + p.fame / 15;
    });
    if (mandatory && cands.length < 2) {
      cands = Object.values(s.world.clubs).filter((c) => c.id !== cur).sort((a, b) => Math.abs(a.rating - ovr) - Math.abs(b.rating - ovr)).slice(0, 4);
    }
    cands = U.shuffle(cands).sort((a, b) => b.rating - a.rating);
    const picks = U.shuffle(cands.slice(0, Math.max(n * 2, 3))).slice(0, n).sort((a, b) => b.rating - a.rating);
    return picks.map((c) => ({
      clubId: c.id,
      wage: Game.wageFor(c.rating, ovr),
      years: U.randi(2, 5),
      fee: Math.round(Game.wageFor(c.rating, ovr) * U.rand(40, 120) / 1000) * 1000,
    }));
  },

  acceptOffer(i) {
    const s = Game.state;
    const o = s.offers[i];
    if (!o) return;
    const old = Game.club().name;
    Game.joinClub(o.clubId, o.wage, o.years);
    s.offers = [];
    Game.news(`✍️ ${old}'dan ${Game.club().name}'a transfer oldun! Haftalık maaş: ${U.money(o.wage)}`, 'good');
    Game.toast(`✍️ ${Game.club().name} ile sözleşme imzaladın!`, 'good');
    Game.save();
    Game.render();
  },

  // Sezon ortasında kulüp değişimi: lig fikstürü farklı olabilir, tur sayısı aynı.
  joinClub(id, wage, years) {
    const s = Game.state, p = s.player;
    s.clubId = id;
    s.contract = { type: 'pro', clubId: id, wage, years };
    p.rel.coach = 50; p.rel.team = 45; p.rel.fans = Math.max(25, p.rel.fans * 0.5);
  },

  // ---------- Sezon sonu ----------
  endSeason() {
    const s = Game.state, p = s.player;
    const youth = Game.isYouth();
    const lg = Game.league();
    const table = World.sortedTable(lg);
    const pos = table.findIndex((r) => r.id === s.clubId) + 1;
    const ss = s.season.stats;
    const avg = ss.apps ? ss.ratingSum / ss.apps : 0;
    const trophies = [];
    const compName = Game.leagueName();
    if (pos === 1) trophies.push(`🏆 ${compName} Şampiyonu`);
    const top = World.topScorers(lg, 1)[0];
    if (ss.goals > 0 && top && ss.goals >= top.g) trophies.push(`👟 ${compName} Gol Kralı (${ss.goals})`);
    if (!youth && avg >= 7.6 && ss.apps >= 10) trophies.push(`⭐ ${compName} Sezonun Oyuncusu`);
    if (youth && avg >= 7.4 && ss.apps >= 8) trophies.push(`🌟 ${s.youth.group} Ligi En İyi Oyuncu`);
    if (!youth && p.age <= 21 && avg >= 7.2 && ss.apps >= 10) trophies.push('🌱 Yılın Genç Oyuncusu');
    const ovr = Player.overall(p);
    const lgFame = youth ? 0 : LEAGUES.find((l) => l.id === Game.club().league).fame;
    if (!youth && lgFame >= 1.3 && pos <= 3 && ss.apps >= 12 && (ss.goals + ss.assists >= 32 || avg >= 8.3) && ovr >= 87 && p.fame >= 75 && U.chance(0.75)) trophies.push('🥇 Altın Top (Yılın Futbolcusu)');
    trophies.forEach((t) => p.trophies.push(`${s.season.year}: ${t}`));
    trophies.forEach(() => Player.addFame(p, youth ? 0.5 : 3));

    p.history.push({
      year: s.season.year, age: p.age, club: Game.teamName(), league: compName, pos,
      apps: ss.apps, goals: ss.goals, assists: ss.assists, avg: Math.round(avg * 100) / 100, motm: ss.motm, ovr,
    });

    // dünya
    const prevLeague = Game.club().league;
    const rel = World.endSeason(s.world);
    const ageBefore = p.age;
    const changes = Player.ageUp(p);
    const ovrAfter = Player.overall(p);

    // sözleşmeler ve teklifler
    let offers = [], mandatory = false, ownOffer = null, msg = [];
    if (youth) {
      const own = Game.club();
      if (p.age >= 17 && ovrAfter >= own.rating - 12) {
        ownOffer = { clubId: own.id, wage: Game.wageFor(own.rating, ovrAfter), years: 3, own: true, pro: true };
        msg.push(`${own.name} sana <b>A takım profesyonel sözleşmesi</b> teklif ediyor!`);
      }
      if (p.age >= 18) {
        mandatory = true;
        offers = Game.makeOffers(3, true).map((o) => Object.assign(o, { pro: true }));
        if (!ownOffer) msg.push('Altyapı dönemin bitti. Profesyonel kariyerine başlamak için bir kulüp seçmelisin.');
      } else if (p.age < 17 && ovrAfter >= expectedAtAge(p.age) + 6) {
        const bigger = Object.values(s.world.clubs).filter((c) => c.rating > own.rating + 3 && (c.league.startsWith('TR') || (p.age >= 14 && ovrAfter >= expectedAtAge(p.age) + 12)));
        offers = U.shuffle(bigger).slice(0, U.randi(1, 2)).map((c) => ({ clubId: c.id, youth: true }));
        if (offers.length) msg.push('Performansın dikkat çekti! Daha büyük kulüplerin altyapıları seni istiyor.');
      } else if (p.age >= 17 && !ownOffer) {
        msg.push('Henüz A takım için hazır görülmüyorsun. Bir sezon daha U19\'da kendini kanıtla!');
      }
    } else {
      s.contract.years--;
      if (s.contract.years <= 0) {
        mandatory = true;
        const own = Game.club();
        if (p.rel.coach >= 35 && ovrAfter >= own.rating - 12) {
          ownOffer = { clubId: own.id, wage: Game.wageFor(own.rating, ovrAfter), years: U.randi(1, 4), own: true, pro: true };
        }
        offers = Game.makeOffers(3, true).map((o) => Object.assign(o, { pro: true }));
        msg.push('Sözleşmen sona erdi! Yeni bir sözleşme imzalamalısın.');
      } else {
        offers = Game.makeOffers(U.randi(0, 3), false).map((o) => Object.assign(o, { pro: true }));
        if (offers.length) msg.push(`Sözleşmenin bitmesine ${s.contract.years} yıl var. Gelen teklifleri değerlendirebilirsin.`);
      }
    }
    if (ownOffer) offers.unshift(ownOffer);

    s.seasonEnd = {
      year: s.season.year, pos, compName, stats: ss, avg, trophies, changes, ageBefore, ovrBefore: ovr, ovrAfter,
      offers, mandatory, msg, relegated: rel.down.includes(s.clubId) && !youth, promoted: rel.up.includes(s.clubId) && !youth,
      prevLeague, canRetire: p.age >= 33, forceRetire: p.age >= 40 || (p.age >= 34 && ovrAfter < 50),
    };
    Game.save();
    SeasonEnd.show();
  },

  startNewSeason(choice) {
    const s = Game.state, p = s.player;
    const se = s.seasonEnd;
    if (choice) {
      if (choice.youth) {
        const old = Game.club().name;
        s.clubId = choice.clubId;
        s.contract = { type: 'youth', clubId: choice.clubId, wage: 0, years: 0 };
        p.rel.coach = 50; p.rel.team = 45;
        Game.news(`✍️ ${old} altyapısından ${Game.club().name} altyapısına transfer oldun!`, 'good');
      } else if (choice.pro) {
        const wasYouth = Game.isYouth();
        if (choice.own) {
          s.contract = { type: 'pro', clubId: choice.clubId, wage: choice.wage, years: choice.years };
          Game.news(wasYouth ? `🎉 ${Game.club().name} A takımıyla ilk profesyonel sözleşmeni imzaladın! Haftalık ${U.money(choice.wage)}` : `✍️ ${Game.club().name} ile sözleşmeni ${choice.years} yıl uzattın.`, 'good');
        } else {
          Game.joinClub(choice.clubId, choice.wage, choice.years);
          Game.news(`✍️ ${Game.club().name} ile ${choice.years} yıllık profesyonel sözleşme imzaladın! Haftalık ${U.money(choice.wage)}`, 'good');
        }
      }
    }
    s.season = { year: se.year + 1, round: 0, stats: Game.blankSeason(), intlDone: [] };
    if (Game.isYouth()) {
      s.youth = Youth.create(s.world, s.clubId, p.age);
      Game.news(`📅 ${s.season.year} sezonu başladı. Artık ${s.youth.group} takımındasın!`);
    } else {
      s.youth = null;
      Game.news(`📅 ${s.season.year} sezonu başladı. ${Game.club().name} • ${LEAGUES.find((l) => l.id === Game.club().league).name}`);
      if (se.relegated) Game.news('📉 Kulübün geçen sezon küme düştü.', 'bad');
      if (se.promoted) Game.news('📈 Kulübün bir üst lige yükseldi!', 'good');
    }
    s.seasonEnd = null;
    s.offers = [];
    s.pendingIntl = null;
    s.ap = 3;
    p.energy = 100;
    Game.save();
    Game.tab = 'home';
    Game.render();
  },

  retire() {
    const s = Game.state, p = s.player;
    Game.wipe();
    const t = p.totals;
    const avg = t.apps ? (t.ratingSum / t.apps).toFixed(2) : '-';
    const legend = Math.round(t.goals * 1 + t.assists * 0.6 + p.trophies.length * 8 + p.intl.caps * 1.5 + p.fame * 2);
    const title = legend > 900 ? 'Efsane' : legend > 500 ? 'Süperstar' : legend > 250 ? 'Saygın Profesyonel' : legend > 100 ? 'Emektar Futbolcu' : 'Sıradan Bir Kariyer';
    const el = document.getElementById('end');
    el.innerHTML = `
      <div class="end-card">
        <h1>🏁 Kariyer Sona Erdi</h1>
        <h2>${U.esc(Player.fullName(p))}</h2>
        <div class="end-title">${title}</div>
        <div class="ms-grid big">
          <div><span>Yaş</span><b>${p.age}</b></div>
          <div><span>Maç</span><b>${t.apps}</b></div>
          <div><span>Gol</span><b>${t.goals}</b></div>
          <div><span>Asist</span><b>${t.assists}</b></div>
          <div><span>Ort. Reyting</span><b>${avg}</b></div>
          <div><span>Milli Maç</span><b>${p.intl.caps} (${p.intl.goals} gol)</b></div>
          <div><span>Servet</span><b>${U.money(p.money)}</b></div>
          <div><span>Efsane Puanı</span><b>${legend}</b></div>
        </div>
        <h3>Kupalar ve Ödüller</h3>
        <ul class="trophies">${p.trophies.map((x) => `<li>${U.esc(x)}</li>`).join('') || '<li>Ödül yok</li>'}</ul>
        <button class="btn btn-big" onclick="location.reload()">Ana Menü</button>
      </div>`;
    UI.strip(el);
    Game.show('end');
  },

  // ---------- Arayüz ----------
  render() {
    const s = Game.state, p = s.player;
    document.getElementById('hdr-info').innerHTML = `
      <span class="hi-club">${UI.shirt(Game.club())}${U.esc(Game.teamName())}</span>
      <span class="hi-week">${s.season.year} · <b>${Math.min(s.season.round + 1, ROUNDS)}</b>/${ROUNDS}. HAFTA</span>
      <span class="hi-money">${U.money(p.money)}</span>`;
    U.$$('#tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === Game.tab));
    document.getElementById('side').innerHTML = UI.playerCard();
    UI.drawFigure();
    const main = document.getElementById('main');
    main.innerHTML = UI[Game.tab]();
    UI.strip(main);
    UI.bind(main);
  },
};

// ---------- Ekranlar ----------
const UI = {
  // Metin düğümlerindeki emojileri temizler
  strip(root) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (w.nextNode()) nodes.push(w.currentNode);
    nodes.forEach((n) => { const t = U.plain(n.nodeValue); if (t !== n.nodeValue) n.nodeValue = t; });
  },

  bar(v, cls = '') {
    return `<div class="bar ${cls}"><div style="width:${U.clamp(v, 0, 100)}%"></div></div>`;
  },

  statColor(v) {
    return v >= 80 ? 'c-elite' : v >= 65 ? 'c-good' : v >= 45 ? 'c-mid' : v >= 25 ? 'c-low' : 'c-poor';
  },

  // Kulüp renkleriyle küçük forma ikonu
  shirt(club, cls = '') {
    const pat = (typeof KIT_PATTERNS !== 'undefined' && KIT_PATTERNS[club.id]) || 'plain';
    const id = 'sh' + Math.random().toString(36).slice(2, 8);
    let fill = '';
    if (pat === 'stripes') fill = `<rect x="7" y="0" width="3" height="24" fill="${club.c2}"/><rect x="14" y="0" width="3" height="24" fill="${club.c2}"/>`;
    else if (pat === 'halves') fill = `<rect x="12" y="0" width="12" height="24" fill="${club.c2}"/>`;
    else if (pat === 'hoops') fill = `<rect x="0" y="9" width="24" height="3" fill="${club.c2}"/><rect x="0" y="15" width="24" height="3" fill="${club.c2}"/>`;
    else if (pat === 'band') fill = `<rect x="10" y="0" width="4" height="24" fill="${club.c2}"/>`;
    else fill = `<rect x="0" y="3" width="5" height="7" fill="${club.c2}"/><rect x="19" y="3" width="5" height="7" fill="${club.c2}"/>`;
    const path = 'M8 2l4 2 4-2 6 3-2 6-3-1v12H7V10l-3 1-2-6z';
    return `<svg class="shirt ${cls}" viewBox="0 0 24 24" aria-hidden="true"><defs><clipPath id="${id}"><path d="${path}"/></clipPath></defs><g clip-path="url(#${id})"><rect width="24" height="24" fill="${club.c1}"/>${fill}</g><path d="${path}" fill="none" stroke="rgba(0,0,0,.45)" stroke-width="1"/></svg>`;
  },

  drawFigure() {
    const cv = document.querySelector('.pc-fig');
    if (!cv || typeof Sprites === 'undefined') return;
    const ctx = cv.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = 120 * dpr; cv.height = 150 * dpr;
    const kit = Sprites.kit(Game.club(), false);
    Sprites.figure(ctx, 60 * dpr, 140 * dpr, 118 * dpr, { kit, look: Sprites.look(7), facing: 'down', t: 0 });
  },

  playerCard() {
    const s = Game.state, p = s.player;
    const ovr = Player.overall(p);
    const ovrI = Player.overall(p, true);
    const exp = expectedAtAge(p.age);
    const club = Game.club();
    const stars = Math.round(U.clamp((p.potential - 75) / 4.5, 1, 5));
    const meter = (ic, l, v, cls) => `<div class="mt-row">${Icon(ic)}<span>${l}</span>${UI.bar(v, cls)}<b>${Math.round(v)}</b></div>`;
    return `
      <div class="pc">
        <div class="pc-hero" style="--c1:${club.c1};--c2:${club.c2}">
          <canvas class="pc-fig" aria-hidden="true"></canvas>
          <div class="pc-id">
            <div class="pc-num">${p.shirt}</div>
            <div class="pc-name">${U.esc(p.name)} <b>${U.esc(p.surname)}</b></div>
            <div class="pc-sub">${p.age} YAŞ · ${POSITIONS[p.position].l.toUpperCase()} · ${Game.nation().code}</div>
            <div class="pc-sub">${U.esc(Game.teamName())}</div>
          </div>
          <div class="pc-ovr ${UI.statColor(ovr)}"><b>${ovr}</b><span>GÜÇ${ovrI > ovr ? ` +${ovrI - ovr}` : ''}</span></div>
        </div>
        ${p.injuryWeeks ? `<div class="pc-inj">${Icon('injury')} Sakat · ${p.injuryWeeks} hafta</div>` : ''}
        <div class="pc-meta">
          <span class="pot">${'★'.repeat(stars)}<i>${'★'.repeat(5 - stars)}</i> potansiyel</span>
          ${Game.isYouth() ? `<span class="${ovr >= exp ? 'up' : 'down'}">Yaş ort. ${Math.round(exp)} · ${ovr >= exp + 8 ? 'çok üstündesin' : ovr >= exp ? 'üstündesin' : 'gerisindesin'}</span>` : ''}
        </div>
        <div class="pc-stats">
          ${STATS.map((st) => {
            const v = p.stats[st.k];
            return `<div class="ps" title="${U.esc(st.d)}"><b class="${UI.statColor(v)}">${Math.floor(v)}</b><span>${st.l}</span>${UI.bar(v, UI.statColor(v))}</div>`;
          }).join('')}
        </div>
        <div class="pc-sec">Durum</div>
        ${meter('bolt', 'Enerji', p.energy, 'c-energy')}
        ${meter('smile', 'Moral', p.morale, 'c-morale')}
        ${meter('star', 'Ün', p.fame, 'c-fame')}
        <div class="pc-sec">İlişkiler</div>
        ${meter('whistle', 'Hoca', p.rel.coach, 'c-rel')}
        ${meter('team', 'Takım', p.rel.team, 'c-rel')}
        ${meter('fans', 'Taraftar', p.rel.fans, 'c-rel')}
        <div class="pc-contract">${Icon('contract')}<span>${Game.isYouth()
          ? `Altyapı oyuncusu · Harçlık <b>${U.money(Game.weeklyIncome())}</b>/hafta`
          : `<b>${U.money(s.contract.wage)}</b>/hafta · ${s.contract.years} yıl kaldı`}</span></div>
      </div>`;
  },

  home() {
    const s = Game.state, p = s.player;
    const fx = Game.nextFixture();
    let next = '';
    const crest = (name, club, sub) => `<div class="nm-team">${club ? UI.shirt(club, 'big') : `<span class="nat">${sub}</span>`}<b>${U.esc(name)}</b></div>`;
    if (s.pendingIntl) {
      const n = Game.nation(), o = NATIONS.find((x) => x.code === s.pendingIntl);
      next = `<div class="nm-vs">${crest(n.name, null, n.code)}<span class="vs">VS</span>${crest(o.name, null, o.code)}</div>
        <div class="nm-meta">MİLLİ MAÇ · Rakip gücü ${o.rating} · Yıldızlar: ${U.esc(o.stars.slice(0, 2).join(', '))}</div>`;
    } else if (fx) {
      const opp = fx.home === s.clubId ? fx.away : fx.home;
      const oppC = Game.club(opp);
      const tbl = World.sortedTable(Game.league());
      const oppPos = tbl.findIndex((r) => r.id === opp) + 1;
      const star = !Game.isYouth() && (oppC.roster.find((x) => x.star) || null);
      next = `<div class="nm-vs">${crest(Game.teamName(fx.home), Game.club(fx.home))}<span class="vs">VS</span>${crest(Game.teamName(fx.away), Game.club(fx.away))}</div>
        <div class="nm-meta">${U.esc(Game.leagueName())} · ${s.season.round + 1}. HAFTA · ${fx.home === s.clubId ? 'İÇ SAHA' : 'DEPLASMAN'}</div>
        <div class="nm-meta">Rakip ${oppPos}. sırada · Güç ${Game.teamRating(opp)} / Senin takımın ${Game.teamRating(s.clubId)}${star ? ` · Yıldızı: ${U.esc(star.n)}` : ''}</div>`;
    }
    const ovr = Player.overall(p, true);
    const roleK = p.injuryWeeks ? 'inj' : Game.roleFor(ovr, s.pendingIntl ? Game.nation().rating : Game.teamRating(s.clubId), Game.isYouth() && !s.pendingIntl, true);
    const role = { inj: 'Sakatsın, bu maçta oynayamazsın', starter: "Muhtemelen ilk 11'desin", bench: 'Muhtemelen yedeksin', out: 'Kadroya girmen zor' }[roleK];
    const acts = [
      ['train', 'train', 'Antrenman', '−12 enerji'],
      ['intense', 'fire', 'Yoğun Antrenman', '−24 enerji · ×1.8 gelişim'],
      ['coach', 'coach', 'Özel Hoca', `${U.money(Game.coachCost())} · ×2.3 gelişim`],
      ['rest', 'rest', 'Dinlen', '+20 enerji'],
      ['team', 'team', 'Takımla Takıl', 'Takım ilişkisi artar'],
      ['talk', 'talk', 'Hocayla Konuş', s.week.coachTalk ? 'Bu hafta konuştun' : 'Hoca ilişkisi artar'],
      ['fans', 'phone', 'Taraftarlar', 'Taraftar ve ün artar'],
    ];
    return `
      <div class="grid2">
        <section class="card next">
          <div class="card-h"><span>${Icon('whistle')} Maç Günü</span><span class="tag role-${roleK}">${role}</span></div>
          ${next}
          ${p.energy < 40 ? `<div class="warn">${Icon('bolt')} Enerjin düşük. Performansın düşer, sakatlık riski artar.</div>` : ''}
          <button class="btn btn-play" data-go="match">${Icon('play')} Maça Çık</button>
          ${s.ap > 0 ? `<div class="hint">Bu hafta ${s.ap} aksiyon hakkın daha var.</div>` : ''}
        </section>
        <section class="card">
          <div class="card-h"><span>${Icon('train')} Haftalık Plan</span><span class="ap">${Array.from({ length: 3 }, (_, i) => `<i class="${i < s.ap ? 'on' : ''}"></i>`).join('')}</span></div>
          <div class="lbl">Antrenman odağı</div>
          <div class="chips">${STATS.map((st) => `<button class="chip ${s.trainFocus === st.k ? 'on' : ''}" data-focus="${st.k}">${st.l}<b>${Math.floor(p.stats[st.k])}</b></button>`).join('')}</div>
          <div class="acts">${acts.map(([k, ic, l, d]) => `<button class="act" data-act="${k}" ${s.ap <= 0 ? 'disabled' : ''}>${Icon(ic)}<span><b>${l}</b><small>${d}</small></span></button>`).join('')}</div>
        </section>
      </div>
      ${s.offers.length ? `
      <section class="card">
        <div class="card-h"><span>${Icon('mail')} Transfer Teklifleri</span></div>
        ${s.offers.map((o, i) => UI.offerRow(o, i, 'mid')).join('')}
        <button class="btn btn-ghost" data-reject="1">Teklifleri Reddet</button>
      </section>` : ''}
      <section class="card">
        <div class="card-h"><span>${Icon('news')} Haberler</span></div>
        <div class="news">${s.news.slice(0, 14).map((n) => `<div class="nw ${n.type}"><small>${n.w}</small><span>${n.t}</span></div>`).join('')}</div>
      </section>`;
  },

  offerRow(o, i, ctx) {
    const c = Game.club(o.clubId);
    const lg = LEAGUES.find((l) => l.id === c.league);
    return `<div class="offer">
      ${UI.shirt(c, 'big')}
      <div class="of-info"><b>${U.esc(c.name)}</b>${o.own ? ' <em>mevcut kulübün</em>' : ''}<small>${U.esc(lg.name)} · Güç ${c.rating}</small></div>
      <div class="of-terms">${o.youth ? `<b>Altyapı transferi</b><small>Daha iyi tesisler</small>` : `<b>${U.money(o.wage)}/hafta</b><small>${o.years} yıl</small>`}</div>
      <button class="btn" data-offer="${i}" data-ctx="${ctx}">${o.own ? 'İmzala' : 'Kabul Et'}</button>
    </div>`;
  },

  league() {
    const s = Game.state;
    const lg = Game.league();
    const tbl = World.sortedTable(lg);
    const name = (id) => Game.teamName(id);
    const myRes = lg.results.filter((r) => r.h === s.clubId || r.a === s.clubId);
    const fixtures = lg.fixtures.map((round, i) => {
      const f = round.find(([h, a]) => h === s.clubId || a === s.clubId);
      if (!f) return '';
      const r = myRes.find((x) => x.round === i);
      const res = r ? (() => { const gf = r.h === s.clubId ? r.hs : r.as, ga = r.h === s.clubId ? r.as : r.hs; return `<b class="${gf > ga ? 'w' : gf < ga ? 'l' : 'd'}">${r.hs}-${r.as}</b>`; })() : '<span class="muted">-</span>';
      return `<tr class="${i === s.season.round ? 'cur' : ''}"><td>${i + 1}</td><td>${U.esc(name(f[0]))}</td><td>${res}</td><td>${U.esc(name(f[1]))}</td></tr>`;
    }).join('');
    return `
      <div class="card">
        <div class="card-h"><span>${Icon('table')} ${U.esc(Game.leagueName())}</span><small class="muted">Puan durumu</small></div>
        ${UI.table(tbl, name, s.clubId)}
      </div>
      <div class="grid2">
        <div class="card"><div class="card-h"><span>${Icon('whistle')} Fikstürün</span></div><div class="tscroll"><table class="tbl fx">${fixtures}</table></div></div>
        <div class="card"><div class="card-h"><span>${Icon('ball')} Gol Krallığı</span></div>${UI.scorers(lg, name)}</div>
      </div>`;
  },

  table(tbl, name, hl) {
    return `<table class="tbl"><tr><th>#</th><th class="l">Takım</th><th>O</th><th>G</th><th>B</th><th>M</th><th>A</th><th>Y</th><th>AV</th><th>P</th></tr>
      ${tbl.map((r, i) => `<tr class="${r.id === hl ? 'hl' : ''}"><td>${i + 1}</td><td class="l">${U.esc(name(r.id))}</td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf}</td><td>${r.ga}</td><td>${r.gf - r.ga}</td><td><b>${r.pts}</b></td></tr>`).join('')}
    </table>`;
  },

  scorers(lg, name) {
    const me = Player.fullName(Game.p);
    const list = World.topScorers(lg, 12);
    if (!list.length) return '<div class="muted">Henüz gol atılmadı.</div>';
    return `<table class="tbl">${list.map((x, i) => `<tr class="${x.name === me ? 'hl' : ''}"><td>${i + 1}</td><td class="l">${U.esc(x.name)}<small class="muted"> ${U.esc(name(x.club))}</small></td><td><b>${x.g}</b></td></tr>`).join('')}</table>`;
  },

  squad() {
    const s = Game.state, p = s.player;
    const roster = Game.teamRoster(s.clubId).slice();
    roster.push({ n: Player.fullName(p) + ' (SEN)', pos: p.position, r: Player.overall(p), age: p.age, me: true });
    const order = { GK: 0, DF: 1, MF: 2, FW: 3 };
    roster.sort((a, b) => order[a.pos] - order[b.pos] || b.r - a.r);
    const posL = { GK: 'Kaleci', DF: 'Defans', MF: 'Orta Saha', FW: 'Forvet' };
    return `<div class="card">
      <div class="card-h"><span>${UI.shirt(Game.club())} ${U.esc(Game.teamName())}</span><small class="muted">Takım gücü ${Game.teamRating(s.clubId)}</small></div>
      <table class="tbl"><tr><th class="l">Oyuncu</th><th>Mevki</th><th>Yaş</th><th>Güç</th></tr>
      ${roster.map((x) => `<tr class="${x.me ? 'hl' : ''}"><td class="l">${x.star ? '⭐ ' : ''}${U.esc(x.n)}</td><td>${posL[x.pos]}</td><td>${x.age || '-'}</td><td><b class="${UI.statColor(x.r)}">${x.r}</b></td></tr>`).join('')}
      </table></div>`;
  },

  shop() {
    const p = Game.p;
    const cats = [['boots', 'Kramponlar', 'Maçlarda statlarına bonus verir (en iyisi geçerli).'], ['gear', 'Antrenman Ekipmanı', 'Antrenmandan aldığın gelişimi artırır (en iyisi geçerli).'], ['food', 'Beslenme', 'Haftalık enerji yenilenmesini artırır (en iyisi geçerli).'], ['life', 'Yaşam Tarzı', 'Her hafta moral verir, ünü artırır (hepsi birikir).']];
    return cats.map(([c, t, d]) => `
      <div class="card">
        <div class="card-h"><span>${Icon(c === 'boots' ? 'boot' : c)} ${t}</span><small class="muted">${d}</small></div>
        <div class="shop">${ITEMS.filter((i) => i.cat === c).map((it) => {
          const own = p.items.includes(it.id);
          return `<div class="item ${own ? 'own' : ''}">
            <div class="it-i">${Icon(c === 'boots' ? 'boot' : c)}</div>
            <div class="it-t"><b>${U.esc(it.name)}</b><small>${U.esc(it.desc)}</small></div>
            ${own ? '<span class="tag">Sende var</span>' : `<button class="btn" data-buy="${it.id}" ${p.money < it.price ? 'disabled' : ''}>${U.money(it.price)}</button>`}
          </div>`;
        }).join('')}</div>
      </div>`).join('');
  },

  career() {
    const p = Game.p, t = p.totals;
    const hist = p.history.slice().reverse();
    return `
      <div class="card">
        <div class="card-h"><span>${Icon('career')} Kariyer Özeti</span></div>
        <div class="ms-grid big">
          <div><span>Maç</span><b>${t.apps}</b></div>
          <div><span>Gol</span><b>${t.goals}</b></div>
          <div><span>Asist</span><b>${t.assists}</b></div>
          <div><span>Ort. Reyting</span><b>${t.apps ? (t.ratingSum / t.apps).toFixed(2) : '-'}</b></div>
          <div><span>Maçın Adamı</span><b>${t.motm}</b></div>
          <div><span>Milli Maç</span><b>${p.intl.caps} (${p.intl.goals} gol)</b></div>
        </div>
      </div>
      <div class="card">
        <div class="card-h"><span>${Icon('table')} Sezonlar</span></div>
        <table class="tbl"><tr><th>Sezon</th><th>Yaş</th><th class="l">Takım</th><th>Sıra</th><th>Maç</th><th>Gol</th><th>Asist</th><th>Ort.</th><th>Güç</th></tr>
        ${hist.map((h) => `<tr><td>${h.year}</td><td>${h.age}</td><td class="l">${U.esc(h.club)}<small class="muted"> ${U.esc(h.league)}</small></td><td>${h.pos}</td><td>${h.apps}</td><td>${h.goals}</td><td>${h.assists}</td><td>${h.avg ? h.avg.toFixed(2) : '-'}</td><td>${h.ovr}</td></tr>`).join('') || '<tr><td colspan="9" class="muted">İlk sezonun devam ediyor.</td></tr>'}
        </table>
      </div>
      <div class="card">
        <div class="card-h"><span>${Icon('career')} Kupalar ve Ödüller</span></div>
        <ul class="trophies">${p.trophies.slice().reverse().map((x) => `<li>${U.esc(x)}</li>`).join('') || '<li class="muted">Henüz ödülün yok. Çalışmaya devam!</li>'}</ul>
      </div>
      <div class="card">
        <div class="card-h"><span>${Icon('save')} Oyun</span></div>
        <div class="row-btns">
          <button class="btn btn-ghost" data-sys="save">${Icon('save')} Kaydet</button>
          <button class="btn btn-ghost" data-sys="menu">${Icon('exit')} Ana Menü</button>
          ${p.age >= 33 ? `<button class="btn btn-ghost" data-sys="retire">${Icon('wave')} Emekli Ol</button>` : ''}
          <button class="btn btn-danger" data-sys="delete">${Icon('trash')} Kariyeri Sil</button>
        </div>
      </div>`;
  },

  world() {
    const s = Game.state;
    const sel = UI.worldLeague || Game.club().league;
    const lg = s.world.leagues[sel];
    const name = (id) => s.world.clubs[id].name;
    return `
      <div class="card">
        <div class="card-h"><span>${Icon('globe')} Dünya Futbolu</span></div>
        <div class="chips">${LEAGUES.map((l) => `<button class="chip ${l.id === sel ? 'on' : ''}" data-wl="${l.id}">${U.esc(l.name)}</button>`).join('')}</div>
      </div>
      <div class="grid2">
        <div class="card"><div class="card-h"><span>${Icon('table')} Puan Durumu</span></div>${UI.table(World.sortedTable(lg), name, Game.isYouth() ? null : s.clubId)}</div>
        <div class="card"><div class="card-h"><span>${Icon('ball')} Gol Krallığı</span></div>${UI.scorers(lg, name)}</div>
      </div>
      <div class="card">
        <div class="card-h"><span>${Icon('shield')} Milli Takımlar</span></div>
        <table class="tbl"><tr><th class="l">Ülke</th><th>Güç</th><th class="l">Yıldızlar</th></tr>
        ${NATIONS.slice().sort((a, b) => b.rating - a.rating).map((n) => `<tr class="${n.code === s.player.nation ? 'hl' : ''}"><td class="l"><span class="code">${n.code}</span> ${U.esc(n.name)}</td><td>${n.rating}</td><td class="l"><small>${U.esc(n.stars.join(', '))}</small></td></tr>`).join('')}
        </table>
      </div>`;
  },

  bind(root) {
    U.$$('[data-focus]', root).forEach((b) => (b.onclick = () => { Game.state.trainFocus = b.dataset.focus; Game.render(); }));
    U.$$('[data-act]', root).forEach((b) => (b.onclick = () => Game.act(b.dataset.act)));
    U.$$('[data-go=match]', root).forEach((b) => (b.onclick = () => {
      const s = Game.state;
      if (s.ap > 0) {
        Game.modal(`<h3>Maça çıkılsın mı?</h3><p>Bu hafta kullanılmamış <b>${s.ap}</b> aksiyon hakkın var. Maça çıkarsan bu haklar kaybolacak.</p>`, [
          { t: 'Vazgeç', cls: 'btn-ghost' },
          { t: 'Maça Çık', fn: () => Game.playNext() },
        ]);
      } else Game.playNext();
    }));
    U.$$('[data-offer]', root).forEach((b) => (b.onclick = () => Game.acceptOffer(+b.dataset.offer)));
    U.$$('[data-reject]', root).forEach((b) => (b.onclick = () => { Game.state.offers = []; Game.save(); Game.render(); }));
    U.$$('[data-buy]', root).forEach((b) => (b.onclick = () => {
      const it = ITEMS.find((i) => i.id === b.dataset.buy);
      const p = Game.p;
      if (p.money < it.price) return;
      p.money -= it.price;
      p.items.push(it.id);
      if (it.fame) Player.addFame(p, it.fame);
      Game.toast(`${it.name} satın alındı`, 'good');
      Game.save();
      Game.render();
    }));
    U.$$('[data-wl]', root).forEach((b) => (b.onclick = () => { UI.worldLeague = b.dataset.wl; Game.render(); }));
    U.$$('[data-sys]', root).forEach((b) => (b.onclick = () => {
      const k = b.dataset.sys;
      if (k === 'save') { Game.save(); Game.toast('💾 Kaydedildi', 'good'); }
      if (k === 'menu') { Game.save(); location.reload(); }
      if (k === 'retire') Game.modal('<h3>Emekli olmak istediğine emin misin?</h3><p>Kariyerin sona erecek.</p>', [{ t: 'Vazgeç', cls: 'btn-ghost' }, { t: 'Emekli Ol', fn: () => Game.retire() }]);
      if (k === 'delete') Game.modal('<h3>Kariyer silinsin mi?</h3><p>Bu işlem geri alınamaz.</p>', [{ t: 'Vazgeç', cls: 'btn-ghost' }, { t: 'Sil', cls: 'btn-danger', fn: () => { Game.wipe(); location.reload(); } }]);
    }));
  },
};

// ---------- Modal ----------
Game.modal = function (html, buttons, opts = {}) {
  const m = document.getElementById('modal');
  m.innerHTML = `<div class="modal-card ${opts.wide ? 'wide' : ''}">${html}<div class="modal-btns"></div></div>`;
  const box = m.querySelector('.modal-btns');
  (buttons || [{ t: 'Tamam' }]).forEach((b) => {
    const el = U.el(`<button class="btn ${b.cls || ''}">${b.t}</button>`);
    el.onclick = () => {
      if (!b.keep) { m.classList.add('hidden'); m.innerHTML = ''; }
      if (b.fn) b.fn();
    };
    box.appendChild(el);
  });
  UI.strip(m);
  m.classList.remove('hidden');
  return m;
};

// ---------- Sezon sonu ekranı ----------
const SeasonEnd = {
  show() {
    const s = Game.state, se = s.seasonEnd, p = s.player;
    if (se.forceRetire) {
      return Game.modal(`<h2>👋 Veda Zamanı</h2><p>${p.age} yaşındasın ve vücudun artık üst düzey futbolu kaldıramıyor. Kariyerini noktalama vakti geldi.</p>`, [{ t: 'Kariyer Özeti', fn: () => Game.retire() }]);
    }
    const ch = Object.entries(se.changes).filter(([, v]) => Math.abs(v) >= 0.5)
      .map(([k, v]) => `<span class="chg ${v > 0 ? 'up' : 'down'}">${STATS.find((x) => x.k === k).l} ${v > 0 ? '+' : ''}${v.toFixed(1)}</span>`).join('');
    const ss = se.stats;
    const html = `
      <h2>📅 ${se.year} Sezonu Sona Erdi</h2>
      <div class="ms-grid">
        <div><span>Lig Sırası</span><b>${se.pos}.</b></div>
        <div><span>Maç</span><b>${ss.apps}</b></div>
        <div><span>Gol</span><b>${ss.goals}</b></div>
        <div><span>Asist</span><b>${ss.assists}</b></div>
        <div><span>Ort. Reyting</span><b>${se.avg ? se.avg.toFixed(2) : '-'}</b></div>
        <div><span>Güç</span><b>${se.ovrBefore} → ${se.ovrAfter}</b></div>
      </div>
      ${se.trophies.length ? `<div class="tro">${se.trophies.map((t) => `<div>${U.esc(t)}</div>`).join('')}</div>` : ''}
      <p>🎂 Artık <b>${p.age}</b> yaşındasın! ${ch ? 'Doğal gelişim:' : ''}</p>
      <div class="chgs">${ch}</div>
      ${se.msg.map((m) => `<p class="se-msg">${m}</p>`).join('')}
      ${se.offers.length ? `<div class="offers">${se.offers.map((o, i) => UI.offerRow(o, i, 'end')).join('')}</div>` : ''}`;
    const btns = [];
    if (!se.mandatory) btns.push({ t: se.offers.length ? (Game.isYouth() ? 'Altyapıda Devam Et' : 'Kulübümde Kal') : 'Yeni Sezona Başla', fn: () => Game.startNewSeason(null) });
    if (se.canRetire) btns.push({ t: '👋 Emekli Ol', cls: 'btn-ghost', fn: () => Game.retire() });
    const m = Game.modal(html, btns, { wide: true });
    U.$$('[data-offer]', m).forEach((b) => (b.onclick = () => {
      const o = se.offers[+b.dataset.offer];
      m.classList.add('hidden'); m.innerHTML = '';
      Game.startNewSeason(o);
    }));
  },
};

// ---------- Rastgele olaylar ----------
const Events = {
  list: [
    {
      id: 'party', cond: () => true,
      text: () => `Takım arkadaşın ${Events.mate()} bu akşam doğum günü partisi veriyor. Sen de davetlisin.`,
      opts: [
        { t: '🎉 Partiye git', fx: (p) => { Player.addRel(p, 'team', 6); Player.addEnergy(p, -15); Player.addMorale(p, 5); return 'Harika bir gece! Takım arkadaşlarınla bağın güçlendi.'; } },
        { t: '🏠 Evde kal', fx: (p) => { Player.addRel(p, 'team', -2); Player.addEnergy(p, 5); return 'Erken yattın ama arkadaşların biraz bozuldu.'; } },
      ],
    },
    {
      id: 'interview', cond: (p) => !Game.isYouth() || p.fame > 8,
      text: () => 'Bir spor gazetecisi seninle röportaj yapmak istiyor.',
      opts: [
        { t: '🙂 Alçakgönüllü konuş', fx: (p) => { Player.addRel(p, 'coach', 3); Player.addRel(p, 'fans', 1); return 'Takım odaklı sözlerin hocanın hoşuna gitti.'; } },
        { t: '😎 İddialı konuş', fx: (p) => { Player.addRel(p, 'fans', 5); Player.addRel(p, 'coach', -3); Player.addFame(p, 2); return 'Manşetlere çıktın! Taraftarlar sevdi ama hoca pek memnun değil.'; } },
        { t: '🙅 Reddet', fx: (p) => { Player.addRel(p, 'fans', -2); return 'Röportajı reddettin.'; } },
      ],
    },
    {
      id: 'school', cond: (p) => p.age < 17,
      text: () => 'Okulda sınav haftası! Ailen bu hafta ders çalışmanı istiyor.',
      opts: [
        { t: '📚 Ders çalış', fx: (p) => { Player.addMorale(p, 4); Game.state.ap = Math.max(0, Game.state.ap - 1); return 'Sınavların iyi geçti, ailen gurur duyuyor. (1 aksiyon hakkı harcandı)'; } },
        { t: '⚽ Antrenmana git', fx: (p) => { const k = U.pick(STATS).k; const g = Player.train(p, k, 1, Game.facility()); Player.addMorale(p, -5); return `${STATS.find((x) => x.k === k).l} +${g.toFixed(2)} ama ailen sana kırgın.`; } },
      ],
    },
    {
      id: 'sponsor', cond: (p) => p.fame >= 20,
      text: () => `Bir spor markası seninle sponsorluk anlaşması yapmak istiyor: ${U.money(Events.sponsorAmt())}`,
      opts: [
        { t: '🤝 Kabul et', fx: (p) => { const a = Events.sponsorAmt(); p.money += a; Player.addFame(p, 2); return `${U.money(a)} hesabına yattı!`; } },
        { t: '❌ Reddet', fx: () => 'Teklifi geri çevirdin.' },
      ],
    },
    {
      id: 'charity', cond: () => true,
      text: () => 'Bir yardım kuruluşu, çocuklar için düzenlenen futbol şenliğine seni davet ediyor.',
      opts: [
        { t: '❤️ Katıl', fx: (p) => { Player.addRel(p, 'fans', 5); Player.addFame(p, 1); Player.addEnergy(p, -8); Player.addMorale(p, 4); return 'Çocukların mutluluğu sana da iyi geldi.'; } },
        { t: '🙁 Katılma', fx: () => 'Davete katılmadın.' },
      ],
    },
    {
      id: 'extra', cond: () => true,
      text: () => 'Hoca antrenman sonrası seninle ekstra çalışmak istiyor.',
      opts: [
        { t: '💪 Kal ve çalış', fx: (p) => { const k = Game.state.trainFocus; const g = Player.train(p, k, 1.2, Game.facility()); Player.addRel(p, 'coach', 3); Player.addEnergy(p, -12); return `Hoca etkilendi! ${STATS.find((x) => x.k === k).l} +${g.toFixed(2)}`; } },
        { t: '🏠 Eve git', fx: (p) => { Player.addRel(p, 'coach', -1); return 'Eve gittin, hoca biraz hayal kırıklığına uğradı.'; } },
      ],
    },
    {
      id: 'games', cond: () => true,
      text: () => 'Arkadaşların bütün gece oyun oynamak için seni çağırıyor.',
      opts: [
        { t: '🎮 Katıl', fx: (p) => { Player.addMorale(p, 6); Player.addEnergy(p, -18); return 'Çok eğlendin ama uykusuz kaldın.'; } },
        { t: '😴 Erken yat', fx: (p) => { Player.addEnergy(p, 6); return 'Dinlenmiş uyandın.'; } },
      ],
    },
    {
      id: 'rival', cond: () => true,
      text: () => `Takımdaki rakibin ${Events.mate()} basına senin hakkında laf attı.`,
      opts: [
        { t: '🗯️ Cevap ver', fx: (p) => { Player.addRel(p, 'fans', 3); Player.addRel(p, 'team', -5); return 'Taraftarlar arkanda ama soyunma odasında hava gergin.'; } },
        { t: '🤐 Görmezden gel', fx: (p) => { Player.addRel(p, 'coach', 2); Player.addMorale(p, -2); return 'Olgun davrandın, hoca bunu fark etti.'; } },
      ],
    },
    {
      id: 'scout', cond: () => Game.isYouth() && Object.values(Game.state.world.clubs).some((c) => c.rating > Game.club().rating),
      text: () => `Bir gözlemcinin ${U.pick(Object.values(Game.state.world.clubs).filter((c) => c.rating > Game.club().rating)).name} adına maçlarını izlediği konuşuluyor!`,
      opts: [{ t: '🔥 Kendimi göstereceğim', fx: (p) => { Player.addMorale(p, 5); Player.addFame(p, 0.5); return 'Motivasyonun tavan!'; } }],
    },
    {
      id: 'ankle', cond: (p) => p.injuryWeeks === 0,
      text: () => 'Antrenmanda bileğin hafifçe burkuldu.',
      opts: [
        { t: '🧊 Dinlen', fx: (p) => { Player.addEnergy(p, 8); Game.state.ap = Math.max(0, Game.state.ap - 1); return 'Bir gün dinlendin, ağrı geçti. (1 aksiyon hakkı harcandı)'; } },
        { t: '😤 Devam et', fx: (p) => { if (U.chance(0.4)) { Game.injure(2, 'Burkulan bileğin kötüleşti,'); return 'Maalesef sakatlık ciddileşti.'; } return 'Şanslıydın, sorun çıkmadı.'; } },
      ],
    },
    {
      id: 'gift', cond: (p) => Game.isYouth(),
      text: () => 'Deden futboldaki başarıların için sana harçlık gönderdi!',
      opts: [{ t: '😊 Teşekkürler dede!', fx: (p) => { const a = U.randi(2, 6) * 100; p.money += a; Player.addMorale(p, 3); return `+${U.money(a)}`; } }],
    },
    {
      id: 'signing', cond: (p) => !Game.isYouth(),
      text: () => 'Taraftar derneği bir imza günü düzenliyor.',
      opts: [
        { t: '✍️ Git', fx: (p) => { Player.addRel(p, 'fans', 6); Player.addFame(p, 1); Player.addEnergy(p, -6); return 'Yüzlerce taraftarla buluştun!'; } },
        { t: '🙁 Gitme', fx: (p) => { Player.addRel(p, 'fans', -2); return 'Taraftarlar biraz kırıldı.'; } },
      ],
    },
  ],

  mate() {
    const r = Game.teamRoster(Game.state.clubId);
    return Events._mate || (Events._mate = U.pick(r).n);
  },
  sponsorAmt() {
    if (!Events._amt) Events._amt = Math.round((Game.p.fame * Game.p.fame * (Game.isYouth() ? 20 : 800) + 1000) / 100) * 100;
    return Events._amt;
  },

  roll() {
    const p = Game.p;
    const ev = U.pick(Events.list.filter((e) => e.cond(p)));
    if (ev) Game.state.pendingEvent = ev.id;
  },

  show() {
    const s = Game.state;
    const ev = Events.list.find((e) => e.id === s.pendingEvent);
    if (!ev) { s.pendingEvent = null; return; }
    Events._mate = null; Events._amt = null;
    const text = ev.text();
    Game.modal(`<div class="ev-tag">Olay</div><h3>${U.esc(text)}</h3>`, ev.opts.map((o) => ({
      t: o.t,
      fn: () => {
        const res = o.fx(s.player);
        s.pendingEvent = null;
        Game.save();
        Game.render();
        Game.toast(res, 'good');
      },
    })));
  },
};

// ---------- Karakter oluşturma ----------
const Create = {
  alloc: {},
  points: 20,
  pos: 'FW',
  open() {
    Create.alloc = {};
    STATS.forEach((s) => (Create.alloc[s.k] = 0));
    Game.show('create');
    const el = document.getElementById('create');
    const clubOpts = LEAGUES.filter((l) => l.id.startsWith('TR')).map((l) => `<optgroup label="${l.name}">${CLUB_LIST.filter((c) => c[3] === l.id).map((c) => `<option value="${c[0]}">${c[1]} (Akademi ${'★'.repeat(Math.round(U.clamp((c[4] - 45) / 9, 1, 5)))})</option>`).join('')}</optgroup>`).join('')
      + LEAGUES.filter((l) => !l.id.startsWith('TR')).map((l) => `<optgroup label="${l.name}">${CLUB_LIST.filter((c) => c[3] === l.id).map((c) => `<option value="${c[0]}">${c[1]}</option>`).join('')}</optgroup>`).join('');
    el.innerHTML = `
      <div class="cr-card card">
        <h1>Yeni Kariyer</h1>
        <p class="muted">8 yaşında bir çocuksun ve futbolcu olma hayalinin peşindesin.</p>
        <div class="cr-grid">
          <label>Adın<input id="cr-name" maxlength="16" placeholder="Örn: Emre"></label>
          <label>Soyadın<input id="cr-sur" maxlength="18" placeholder="Örn: Yıldız"></label>
          <label>Uyruğun<select id="cr-nat">${NATIONS.map((n) => `<option value="${n.code}">${n.name}</option>`).join('')}</select></label>
          <label>Ayak<select id="cr-foot"><option value="R">Sağ</option><option value="L">Sol</option></select></label>
          <label class="full">Altyapısına katılacağın kulüp<select id="cr-club">${clubOpts}</select>
            <small class="muted">Büyük kulüplerin tesisleri daha iyidir (daha hızlı gelişim) ama rakipler de daha güçlüdür.</small></label>
        </div>
        <div class="lbl">Mevki</div>
        <div class="seg big" id="cr-pos">
          ${Object.entries(POSITIONS).map(([k, v]) => `<button data-pos="${k}" class="${k === Create.pos ? 'on' : ''}">${v.l}</button>`).join('')}
        </div>
        <div class="lbl">Yetenek puanlarını dağıt <b id="cr-pts"></b></div>
        <div class="cr-stats" id="cr-stats"></div>
        <div class="row-btns">
          <button class="btn btn-ghost" id="cr-back">Geri</button>
          <button class="btn btn-big" id="cr-go">Kariyere Başla ⚽</button>
        </div>
      </div>`;
    U.$$('#cr-pos button').forEach((b) => (b.onclick = () => {
      Create.pos = b.dataset.pos;
      U.$$('#cr-pos button').forEach((x) => x.classList.toggle('on', x === b));
      Create.drawStats();
    }));
    document.getElementById('cr-back').onclick = () => Game.init();
    document.getElementById('cr-go').onclick = () => {
      const name = document.getElementById('cr-name').value.trim() || 'Emre';
      const surname = document.getElementById('cr-sur').value.trim() || 'Yıldız';
      Game.newCareer({
        name, surname, nation: document.getElementById('cr-nat').value, foot: document.getElementById('cr-foot').value,
        position: Create.pos, clubId: document.getElementById('cr-club').value, alloc: Create.alloc,
      });
    };
    Create.drawStats();
  },
  left() { return Create.points - Object.values(Create.alloc).reduce((a, b) => a + b, 0); },
  drawStats() {
    const w = POSITIONS[Create.pos].w;
    document.getElementById('cr-pts').textContent = `(${Create.left()} puan kaldı)`;
    document.getElementById('cr-stats').innerHTML = STATS.map((s) => `
      <div class="cs ${w[s.k] >= 0.12 ? 'key' : ''}">
        <span title="${U.esc(s.d)}">${s.l}${w[s.k] >= 0.12 ? ' ★' : ''}</span>
        <button data-d="-1" data-k="${s.k}">−</button>
        <b>${12 + Create.alloc[s.k]}</b>
        <button data-d="1" data-k="${s.k}">+</button>
      </div>`).join('');
    U.$$('#cr-stats button').forEach((b) => (b.onclick = () => {
      const k = b.dataset.k, d = +b.dataset.d;
      const v = Create.alloc[k] + d;
      if (v < 0 || v > 8 || (d > 0 && Create.left() <= 0)) return;
      Create.alloc[k] = v;
      Create.drawStats();
    }));
  },
};

window.addEventListener('DOMContentLoaded', () => {
  U.$$('#tabs button').forEach((b) => (b.onclick = () => { Game.tab = b.dataset.tab; Game.render(); window.scrollTo(0, 0); }));
  document.getElementById('logo').onclick = () => { if (Game.state) { Game.tab = 'home'; Game.render(); } };
  Game.init();
});
