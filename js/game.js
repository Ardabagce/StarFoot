// Oyun durumu, kariyer akışı ve arayüz

const SAVE_KEY = 'starfoot_save_v1';
// Zorluk seviyeleri: mini oyun zorluğu, antrenman kazancı, hocanın tercihleri
const DIFFS = {
  easy: { l: 'Kolay', d: 'Kaleciler ve savunma daha zayıf, nişan yardımı güçlü, antrenmanda daha hızlı gelişirsin.', lvl: -0.12, train: 1.2, coach: 3 },
  normal: { l: 'Orta', d: 'Dengeli bir kariyer deneyimi.', lvl: 0, train: 1, coach: 0 },
  hard: { l: 'Zor', d: 'Kaleciler refleksli, savunma sert, gelişim yavaş. Gerçek bir meydan okuma.', lvl: 0.1, train: 0.85, coach: -3 },
};

const Game = {
  state: null,
  tab: 'home',

  // ---------- Kaydet / Yükle (5 kariyer slotu) ----------
  slot: 0,
  key(i) { return 'starfoot_slot_' + i; },
  save() {
    try { localStorage.setItem(Game.key(Game.slot), JSON.stringify(Game.state)); } catch (e) { /* depolama yok */ }
  },
  load(i = Game.slot) {
    try {
      const raw = localStorage.getItem(Game.key(i));
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  },
  wipe(i = Game.slot) { try { localStorage.removeItem(Game.key(i)); } catch (e) { /* yok */ } },
  // Eski tek kayıtlı sürümden geçiş
  migrate() {
    try {
      const old = localStorage.getItem(SAVE_KEY);
      if (old && !localStorage.getItem(Game.key(0))) localStorage.setItem(Game.key(0), old);
      if (old) localStorage.removeItem(SAVE_KEY);
    } catch (e) { /* yok */ }
  },

  // ---------- Yardımcılar ----------
  rounds() { const lg = Game.league(); return lg ? lg.fixtures.length : 38; },
  // Milli maç araları (sezon uzunluğuna göre)
  intlWeeks() { const n = Game.rounds(); return [Math.round(n * 0.22), Math.round(n * 0.45), Math.round(n * 0.75)]; },
  get p() { return Game.state.player; },
  club(id) { return Game.state.world.clubs[id || Game.state.clubId]; },
  isYouth() { return Game.state.contract.type === 'youth'; },
  inStreet() { return !!(Game.state.street && !Game.state.street.done); },
  league() { return Game.isYouth() ? Game.state.youth : Game.state.world.leagues[Game.club().league]; },
  leagueName() {
    if (Game.inStreet()) return 'Mahalle Maçları';
    if (Game.isYouth()) return `${LEAGUES.find((l) => l.id === Game.state.youth.leagueId).name} ${Game.state.youth.group}`;
    return LEAGUES.find((l) => l.id === Game.club().league).name;
  },
  teamName(id) {
    const c = Game.club(id);
    if (Game.inStreet()) return c.name;
    return Game.isYouth() ? `${c.name} ${Game.state.youth.group}` : c.name;
  },
  teamRating(id) { return Game.isYouth() && !Game.inStreet() ? Game.state.youth.strength[id] : Game.state.world.clubs[id].rating; },
  teamRoster(id) { return Game.isYouth() && !Game.inStreet() ? Game.state.youth.rosters[id] : Game.state.world.clubs[id].roster; },
  // Döneme göre milli takım (güç ve varlık yıla bağlı)
  nat(code) {
    const n = NATIONS.find((x) => x.code === code);
    if (!n) return null;
    const year = Game.state ? Game.state.season.year : 2026;
    const era = NAT_ERA[code];
    const dec = Math.min(2020, Math.floor(year / 10) * 10);
    return Object.assign({}, n, { rating: era && era[dec] != null ? era[dec] : n.rating });
  },
  nations() {
    const year = Game.state.season.year;
    return NATIONS.filter((n) => !NAT_FROM[n.code] || year >= NAT_FROM[n.code]).map((n) => Game.nat(n.code));
  },
  nation() { return Game.nat(Game.p.nation) || Game.nat('TUR'); },
  // O dönemin milli yıldızları
  natStars(code) {
    const act = Legends.active(Game.state.world, code).sort((a, b) => b.r - a.r).slice(0, 5).map((x) => x.n);
    if (act.length >= 2) return act;
    const n = NATIONS.find((x) => x.code === code);
    return act.concat(Game.state.season.year >= 2022 && n ? n.stars.filter((x) => !act.includes(x)) : []).slice(0, 5);
  },
  facility() { return (0.9 + 0.35 * U.clamp((Game.club().rating - 48) / 40, 0, 1)) * Game.diff().train; },
  diff() { return DIFFS[(Game.state && Game.state.difficulty) || 'normal']; },
  weeklyIncome() {
    const c = Game.state.contract;
    return c.type === 'youth' ? 100 + (Game.p.age - 8) * 40 : c.wage;
  },
  wageFor(rating, ovr) {
    return Math.round((1500 * Math.pow(1.13, rating - 45) * Math.pow(U.clamp(ovr / rating, 0.6, 1.3), 2)) / 100) * 100;
  },
  nextFixture() {
    if (Game.inStreet()) return null;
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
    Game.migrate();
    Game.state = null;
    const box = document.getElementById('slots');
    box.innerHTML = [0, 1, 2, 3, 4].map((i) => {
      const d = Game.load(i);
      if (!d || !d.player) return `<div class="slot empty"><span class="sl-n">${i + 1}</span><div class="sl-t"><b>Boş slot</b><small>Yeni bir kariyere başla</small></div><button class="btn" data-new="${i}">Yeni Kariyer</button></div>`;
      const club = d.world.clubs[d.clubId];
      return `<div class="slot"><span class="sl-n">${i + 1}</span><div class="sl-t"><b>${U.esc(d.player.name + ' ' + d.player.surname)}</b><small>${d.player.age} yaş · ${U.esc(club ? club.name : '')} · ${d.season.year}</small></div>
        <button class="btn btn-play" data-cont="${i}">Devam</button><button class="btn btn-ghost sl-del" data-del="${i}" aria-label="Kariyeri sil">${Icon('trash')}</button></div>`;
    }).join('');
    U.$$('[data-new]', box).forEach((b) => (b.onclick = () => { Game.slot = +b.dataset.new; Create.open(); }));
    U.$$('[data-cont]', box).forEach((b) => (b.onclick = () => { Game.slot = +b.dataset.cont; Game.state = Game.load(); Game.enterHub(); }));
    U.$$('[data-del]', box).forEach((b) => (b.onclick = () => {
      const i = +b.dataset.del;
      const d = Game.load(i);
      Game.modal(`<h3>Kariyer silinsin mi?</h3><p><b>${U.esc(d.player.name + ' ' + d.player.surname)}</b> kariyeri kalıcı olarak silinecek. Bu işlem geri alınamaz.</p>`, [
        { t: 'Vazgeç', cls: 'btn-ghost' },
        { t: 'Sil', cls: 'btn-danger', fn: () => { Game.wipe(i); Game.init(); } },
      ]);
    }));
    Game.show('title');
  },

  newCareer(opts) {
    const year = opts.year || 2026;
    const world = World.create(year);
    const player = Player.create(opts);
    // Kimse kulübünü seçmez: 8-12 yaş mahalle maçıyla, 13+ yaş seçmelerle scoutların gözüne girer
    const street = true;
    const trials = player.age >= 13;
    const exp = Math.round(expectedAtAge(player.age));
    world.clubs.STREET = { id: 'STREET', name: trials ? 'Seçme Kampı' : 'Bizim Sokak', short: trials ? 'SEÇ' : 'SOK', league: 'NONE', rating: exp, c1: trials ? '#ff7a1a' : '#e8e1d0', c2: '#2b2b2b', pool: 'TR', roster: Youth.roster({ pool: 'TR' }, exp, player.age) };
    const clubId = 'STREET';
    Game.state = {
      v: 2,
      player,
      world,
      clubId,
      contract: { type: 'youth', clubId, wage: 0, years: 0 },
      season: { year, round: 0, stats: Game.blankSeason(), intlDone: [] },
      youth: street ? null : Youth.create(world, clubId, player.age),
      street: { done: false, trials },
      startYear: year,
      difficulty: opts.difficulty || 'normal',
      ap: 3,
      week: { coachTalk: false },
      trainFocus: POSITIONS[opts.position] ? Object.keys(POSITIONS[opts.position].w)[0] : 'shooting',
      news: [],
      offers: [],
      pendingIntl: null,
      pendingEvent: null,
      seasonEnd: null,
    };
    Cups.setup(Game.state);
    if (!trials) {
      Game.news(`${opts.name} ${player.age} yaşında, ${year} yılında mahallede top koşturan bir çocuk. Bugün mahalleler arası maç var ve kenarda bir scout izliyor!`, 'good');
    } else {
      Game.news(`${opts.name} ${player.age} yaşında, ${year} yılında altyapı seçmelerine katılıyor. Tribünde farklı kulüplerin scoutları not alıyor!`, 'good');
    }
    Game.save();
    Game.enterHub();
    Game.modal(`
      <h2>Hoş geldin, ${U.esc(opts.name)}!</h2>
      <p>${year} yılındayız. ${!trials
        ? `${player.age} yaşındasın ve henüz bir kulübün yok. İlk maçın <b>mahalle maçı</b>: iyi oynarsan kenardaki <b>scout</b> seni bir altyapıya götürür!`
        : `${player.age} yaşındasın ve henüz bir kulübün yok. <b>Altyapı seçmelerinde</b> 3 istasyonda kendini göstereceksin. Ne kadar iyi olursan o kadar büyük kulüpler teklif yapar!`}</p>
      <ul class="tips">
        <li>Her hafta <b>3 aksiyon hakkın</b> var: antrenman, dinlenme, takım arkadaşlarıyla vakit geçirme...</li>
        <li>Maçlarda kritik anlar gelince oyun durur: parmağını topun tersine <b>geriye çekip bırakarak</b> şut çeker (sapan gibi), arkadaşına <b>dokunarak</b> pas verirsin.</li>
        <li>Statların ne kadar yüksekse vuruşların o kadar sert ve isabetli olur.</li>
        <li>Hocayla ilişkin iyi olursa ilk 11'de oynarsın. Enerjin düşükse performansın düşer.</li>
        <li>18 yaşına geldiğinde profesyonel sözleşme imzalayıp A takıma çıkarsın.</li>
      </ul>`, [{ t: 'Başlayalım!', cls: 'btn-big' }]);
  },

  // ---------- Sokak maçı ----------
  async playStreet() {
    const s = Game.state, p = s.player;
    const exp = Math.round(expectedAtAge(p.age));
    const home = s.world.clubs.STREET;
    const away = { id: 'ARK', name: 'Arka Sokak', short: 'ARK', rating: exp + U.randi(-1, 2), c1: '#2a6fdb', c2: '#ffffff', roster: Youth.roster({ pool: 'TR' }, exp, p.age) };
    const ctx = {
      home: { id: 'STREET', name: home.name, short: 'SOK', rating: home.rating, c1: home.c1, c2: home.c2, roster: home.roster },
      away, side: 'home', role: 'starter', compName: 'Mahalleler Arası Sokak Maçı · Scout izliyor', levelBase: Math.max(0, 0.03 + Game.diff().lvl), lg: 'street',
    };
    const sum = await Match.run(ctx, s);
    const r = sum.rating || 6;
    const perf = r + sum.goals * 0.3 + sum.assists * 0.2;
    Player.addEnergy(p, -15);
    Player.addMorale(p, sum.res === 'W' ? 8 : 2);
    if (sum.goals) Social.post('goal', `Mahalle maçında ${sum.goals} gol! Kenarda bir scout vardı...`, 1);
    Game.scoutOffers(perf, r);
  },

  // Performansa göre scout teklifleri (mahalle maçı ve seçmeler)
  scoutOffers(perf, r) {
    const s = Game.state, p = s.player;
    const trials = s.street.trials;
    const natLg = { TUR: 'TR', ENG: 'ENG', ESP: 'ESP', GER: 'GER', ITA: 'ITA', FRA: 'FRA' }[p.nation] || 'TR';
    const clubs = Object.values(s.world.clubs).filter((c) => c.league !== 'NONE' && c.league.startsWith(natLg));
    const sorted = clubs.sort((a, b) => b.rating - a.rating);
    const who = trials ? 'Scoutlar' : 'Scout';
    let pool, n, msg;
    if (perf >= 8.2) { pool = sorted.slice(0, 5); n = 3; msg = trials ? 'Seçmelerin yıldızı sendin! Büyük kulüplerin scoutları seni almak için sıraya girdi.' : 'Muhteşem oynadın! Scout hemen telefona sarıldı; büyük kulüplerin altyapıları seni istiyor.'; }
    else if (perf >= 7.2) { pool = sorted.slice(3, 14); n = 3; msg = `${who} performansından çok etkilendi. Birkaç kulübün altyapısı seni istiyor.`; }
    else if (perf >= 6.3) { pool = sorted.slice(10, 26); n = 2; msg = `Fena değildi! ${who} seni orta seviye kulüplere önerdi.`; }
    else { pool = sorted.slice(-10); n = 1; msg = `${who} pek etkilenmedi ama küçük bir kulüp sana yine de şans vermek istiyor.`; }
    const offers = U.shuffle(pool).slice(0, n).sort((a, b) => b.rating - a.rating);
    s.street.offers = offers.map((c) => c.id);
    s.street.msg = msg;
    s.street.rating = r;
    Game.save();
    Game.streetOffers();
  },

  // Seçmeler: mevkiye göre 3 istasyon, ortalama başarı teklifleri belirler
  async playTrials() {
    const s = Game.state, p = s.player;
    const stations = { FW: ['shooting', 'pace', 'dribbling'], MF: ['passing', 'technique', 'dribbling'], DF: ['defending', 'physical', 'heading'] }[p.position] || ['shooting', 'passing', 'pace'];
    const res = [];
    for (let i = 0; i < stations.length; i++) {
      const r = await Drill.run(stations[i], { tag: `SEÇME ${i + 1}/3` });
      res.push(r.q);
    }
    const q = res.reduce((a, b) => a + b, 0) / res.length;
    const rel = (Player.overall(p) - expectedAtAge(p.age)) / 8;
    const r = U.clamp(5.4 + q * 3.4 + rel, 4.5, 9.8);
    Player.addEnergy(p, -12);
    Player.addMorale(p, q > 0.6 ? 8 : 2);
    Game.scoutOffers(r, r);
  },

  streetOffers() {
    const s = Game.state;
    const st = s.street;
    const m = Game.modal(`
      <div class="ev-tag">${st.trials ? 'Seçme raporu' : 'Scout raporu'}</div>
      <h2>${st.trials ? 'Seçmeler bitti · Puanın' : 'Maç bitti · Reytingin'} ${st.rating.toFixed(1)}</h2>
      <p>${st.msg}</p>
      <div class="offers">${st.offers.map((id, i) => {
        const c = s.world.clubs[id];
        return `<div class="offer">${UI.shirt(c, 'big')}<div class="of-info"><b>${U.esc(c.name)}</b><small>${U.esc(LEAGUES.find((l) => l.id === c.league).name)} · Akademi ${'★'.repeat(Math.round(U.clamp((c.rating - 45) / 9, 1, 5)))}</small></div><button class="btn" data-street="${i}">Altyapıya Katıl</button></div>`;
      }).join('')}</div>`, [], { wide: true });
    U.$$('[data-street]', m).forEach((b) => (b.onclick = () => {
      const id = st.offers[+b.dataset.street];
      m.classList.add('hidden'); m.innerHTML = '';
      s.street.done = true;
      s.clubId = id;
      s.contract = { type: 'youth', clubId: id, wage: 0, years: 0 };
      delete s.world.clubs.STREET;
      s.youth = Youth.create(s.world, id, s.player.age);
      Cups.setupYouth(s);
      Game.news(`${s.player.name}, ${st.trials ? 'seçmelerdeki performansıyla' : 'scout sayesinde'} ${Game.club().name} altyapısına katıldı! ${s.youth.group} takımında sezon başlıyor.`, 'good');
      Social.post('transfer', `Artık ${Game.club().name} altyapısındayım! Hayalim gerçek oluyor.`, 1.5);
      Game.save();
      Game.tab = 'home';
      Game.render();
    }));
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
    if (s.pendingLoot) return Loot.show();
    if (s.pendingGift) return Gift.show();
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
        return Game.trainSession(1, 'Antrenman');
      }
      case 'intense': {
        if (injured) return Game.toast('Sakatken antrenman yapamazsın.', 'bad');
        if (p.energy < 24) return Game.toast('Yoğun antrenman için enerjin yetersiz.', 'bad');
        Player.addEnergy(p, -24);
        return Game.trainSession(1.8, 'Yoğun antrenman', () => {
          if (U.chance(Player.injuryChance(p, 0.035))) Game.injure(U.randi(1, 3), 'yoğun antrenmanda');
        });
      }
      case 'coach': {
        if (injured) return Game.toast('Sakatken antrenman yapamazsın.', 'bad');
        const cost = Game.coachCost();
        if (p.money < cost) return Game.toast(`Özel hoca için ${U.money(cost)} gerekiyor.`, 'bad');
        if (p.energy < 14) return Game.toast('Enerjin yetersiz.', 'bad');
        p.money -= cost;
        Player.addEnergy(p, -14);
        return Game.trainSession(2.3, 'Özel hoca');
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
        Player.addFame(p, Game.isYouth() ? 0.15 : 0.4);
        const cap = U.pick(['Antrenman sonrası mutluluk.', 'Bugün de çalıştık. Hedef büyük!', 'Yeni kramponlarla ilk gün.', 'Hafta sonu maçı için hazırız.', 'Sabah koşusu tamam.', 'Taraftarımıza selam olsun!']);
        Social.post('daily', cap, 1);
        Game.toast('Sosyal medyada paylaşım yaptın: takipçilerin arttı', 'good');
        break;
      }
    }
    s.ap--;
    Game.save();
    Game.render();
  },

  // Antrenman: açıksa odak statına uygun mini oyun oynanır, başarı gelişimi belirler
  async trainSession(intensity, label, after) {
    const s = Game.state, p = s.player, focus = s.trainFocus;
    if (Game._training) return;
    Game._training = true;
    s.ap--;
    Game.save();
    let mult = 1, note = '';
    try {
      if (s.drills !== false) {
        const r = await Drill.run(focus);
        mult = Drill.mult(r.q);
        note = r.auto ? '' : ` · ${Drill.grade(r.q)}`;
      }
    } catch (e) {
      console.error(e);
      Drill.close();
    } finally {
      Game._training = false;
    }
    const g = Player.train(p, focus, intensity * mult, Game.facility());
    Game.toast(`${label}: +${g.toFixed(2)} ${STATS.find((x) => x.k === focus).l}${note}`, 'good');
    if (after) after();
    Game.save();
    Game.render();
  },

  estGain(intensity) {
    const p = Game.p;
    const val = p.stats[Game.state.trainFocus];
    return Player.TRAIN_K * intensity * Player.ageMult(p.age) * Player.growthFactor(p, val) * (0.75 + 0.5 * (p.morale / 100)) * Game.facility() * Player.trainMult(p);
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
    return Math.max(0.02, Game.levelBaseRaw(intl) + Game.diff().lvl);
  },

  levelBaseRaw(intl) {
    if (intl) return 0.55;
    if (Game.inStreet() || (Game.isYouth() && !Game.state.youth)) return 0.06;
    if (Game.isYouth()) return { U10: 0.08, U12: 0.15, U14: 0.22, U16: 0.29, U19: 0.35 }[Game.state.youth.group] || 0.3;
    const lg = Game.club().league;
    return lg === 'TR2' ? 0.38 : lg === 'TR1' ? 0.45 : 0.52;
  },

  roleFor(ovr, teamR, youth, preview = false) {
    const p = Game.p;
    const margin = ovr - teamR + (p.rel.coach - 50) / 8 + (p.energy < 35 ? -3 : 0) + Game.diff().coach;
    if (youth) return margin >= -6 ? 'starter' : 'bench';
    if (margin >= -3) return 'starter';
    if (margin >= -12) return 'bench';
    return !preview && U.chance(0.3) ? 'bench' : 'out';
  },

  async playNext() {
    const s = Game.state, p = s.player;
    if (Game.inStreet()) return s.street.offers ? Game.streetOffers() : s.street.trials ? Game.playTrials() : Game.playStreet();
    if (s.pendingCup) return Cups.playMine(s);
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
      captain: Captain.is(),
      lg: youth ? 'youth' : Game.club().league,
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
    const oppNat = Game.nat(opp);
    const mkRoster = (n) => {
      const r = Game.natStars(n.code).map((name, i) => ({ n: name, pos: i < 2 ? 'FW' : 'MF', r: n.rating + 3 }));
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
      levelBase: Game.levelBase(true), lg: 'intl',
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
    const fameMult = comp === 'intl' ? 2 : youth ? 0.15 : comp === 'cup' ? lg.fame * 1.6 : lg.fame;
    const oppName = ctx.side === 'home' ? ctx.away.name : ctx.home.name;
    const resTxt = { W: 'kazandı', D: 'berabere kaldı', L: 'kaybetti' }[sum.res];
    const teamTxt = comp === 'intl' ? Game.nation().name : Game.teamName();

    // maç sonrası rapor için önceki değerler
    const so0 = Social.ensure(p);
    const before = { coach: p.rel.coach, team: p.rel.team, fans: p.rel.fans, fol: so0.followers, fame: p.fame, morale: p.morale, money: p.money };
    const why = [];
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
      const rk = youth ? 0.55 : 1;
      if (sum.goals >= 3) { p.flags = p.flags || {}; p.flags.hattrick = true; }
      // başarımlar için rekorlar ve gol türleri
      const best = p.best = p.best || { g: 0, a: 0, ga: 0, r: 0, run: 0, streak: 0 };
      best.g = Math.max(best.g, sum.goals); best.a = Math.max(best.a, sum.assists); best.ga = Math.max(best.ga, sum.goals + sum.assists);
      best.r = Math.max(best.r, sum.rating || 0);
      best.run = sum.goals ? (best.run || 0) + 1 : 0; best.streak = Math.max(best.streak || 0, best.run);
      const gt = p.gt = p.gt || {};
      Object.entries(sum.goalTypes || {}).forEach(([k, v]) => (gt[k] = (gt[k] || 0) + v));
      if (comp === 'cup' && sum.goals) gt.cup = (gt.cup || 0) + sum.goals;
      if (sum.motm) {
        p.motmAwards = p.motmAwards || [];
        p.motmAwards.push({ y: s.season.year, opp: oppName, r: sum.rating, g: sum.goals, a: sum.assists, c: comp });
        if (p.motmAwards.length > 60) p.motmAwards.shift();
      }
      // ilişkiler: performansa ve sahada yaptıklarına göre
      const defMind = p.position !== 'FW' ? (sum.tackles || 0) * 0.5 : 0;
      const coachD = ((r - 6.4) * 3 + defMind + (sum.motm ? 1.5 : 0) - (sum.yellow ? 1 : 0)) * rk;
      const teamD = ((sum.res === 'W' ? 1.5 : sum.res === 'L' ? -1 : 0.3) + sum.assists * 1 + (sum.keyPasses || 0) * 0.4 + sum.goals * 0.4 - (sum.red ? 3 : 0)) * rk;
      const fansD = (sum.goals * 1.5 + (r - 6.6) * 2.5 + (sum.motm ? 2 : 0) + (sum.res === 'W' ? 0.5 : 0) - (sum.red ? 3 : 0)) * rk;
      Player.addRel(p, 'coach', coachD);
      Player.addRel(p, 'team', teamD);
      Player.addRel(p, 'fans', fansD);
      if (r >= 7.5) why.push(`Reyting ${r.toFixed(1)}: hoca memnun`); else if (r < 6) why.push(`Reyting ${r.toFixed(1)}: hoca hayal kırıklığında`);
      if (sum.goals) why.push(`${sum.goals} gol: taraftar coştu`);
      if (sum.assists) why.push(`${sum.assists} asist: takım arkadaşların minnettar`);
      if (sum.keyPasses) why.push(`${sum.keyPasses} kilit pas`);
      if (defMind >= 1) why.push(`${sum.tackles} top kapma: hoca savunma katkını beğendi`);
      if (sum.motm) why.push('Maçın adamı');
      if (sum.red) why.push('Kırmızı kart: takım ve taraftar kırgın');
      else if (sum.yellow) why.push('Sarı kart');
      // takipçi: maçtaki performans sosyal medyaya yansır
      const folGain = Math.round(so0.followers * ((youth ? 0.002 : 0.004) + sum.goals * 0.012 + sum.assists * 0.005 + (sum.motm ? 0.018 : 0) + (r >= 8 ? 0.01 : r < 6 ? -0.006 : 0)));
      so0.followers = Math.max(10, so0.followers + folGain);
      Loot.roll(comp === 'intl' ? null : r);
      Gift.roll(comp === 'intl' ? null : r);
      const fameGain = (sum.goals * 0.45 + sum.assists * 0.25 + (r >= 8 ? 0.5 : 0) + (sum.motm ? 0.5 : 0)) * fameMult;
      if (youth) p.fame = Math.max(p.fame, Math.min(p.fame + fameGain, 4 + (p.age - 8) * 1.5));
      else Player.addFame(p, fameGain);
      Player.addMorale(p, (sum.res === 'W' ? 4 : sum.res === 'L' ? -4 : 0) + (r - 6.5) * 2);
      if (sum.energyEnd != null) p.energy = U.clamp(sum.energyEnd, 0, 100);
      else {
        const stam = p.stats.stamina;
        Player.addEnergy(p, -(15 + (sum.minutes / 90) * 25) * (1.3 - stam / 150));
        Player.addEnergy(p, sum.energySave || 0);
      }
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
    Social.afterMatch(sum, teamTxt);
    if (comp !== 'intl') Captain.afterMatch(sum.played);
    const so1 = Social.ensure(p);
    if (!sum.played) why.push(p.injuryWeeks ? 'Sakatlık nedeniyle oynamadın' : 'Forma giymedin');
    s.lastReport = {
      w: `${s.season.year} H${s.season.round + 1}`, opp: oppName, team: teamTxt, gf: sum.gf, ga: sum.ga, res: sum.res, rating: sum.played ? sum.rating : null,
      goals: sum.goals, assists: sum.assists, motm: sum.motm,
      d: { coach: p.rel.coach - before.coach, team: p.rel.team - before.team, fans: p.rel.fans - before.fans, fol: so1.followers - before.fol, fame: p.fame - before.fame, morale: p.morale - before.morale, money: p.money - before.money },
      why,
    };
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
    p.rel.coach += (50 - p.rel.coach) * 0.03;
    p.rel.team += (50 - p.rel.team) * 0.02;
    p.rel.fans += (35 - p.rel.fans) * 0.02;
    if (!Game.isYouth()) Player.addFame(p, -0.08);

    if (!intl) {
      const r = s.season.round;
      // milli takım
      if (Game.intlWeeks().includes(r)) Game.checkCallup();
      // ara transfer dönemi
      if (r === Math.floor(Game.rounds() / 2) && !Game.isYouth()) {
        const offers = Game.makeOffers(U.randi(0, 2), false);
        if (offers.length) {
          s.offers = offers;
          Game.news(`📨 Ara transfer döneminde ${offers.length} teklif aldın! Ana sayfadan inceleyebilirsin.`, 'good');
        }
      }
      if (r === Math.floor(Game.rounds() / 2) + 3) s.offers = [];
      if (!Game.inStreet()) Cups.week(s, r);
      if (r >= Game.rounds()) {
        Game.save();
        return Game.endSeason();
      }
    }
    if (!s.pendingEvent && U.chance(0.2)) Events.roll();
    Social.week();
    if (!intl && U.chance(0.7)) WorldNews.roll();
    Ach.check();
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
      const opp = U.pick(Game.nations().filter((n) => n.code !== nat.code));
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
    Social.post('transfer', `Yeni bir sayfa: ${Game.club().name}! Heyecanlıyım.`, 1.8);
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
    // Gerçek takvimle milli turnuva (Dünya Kupası / Avrupa Şampiyonası) sezon sonunda oynanır
    if (Cups.tourType(s.season.year) && !(s.tournament && s.tournament.done && s.tournament.year === s.season.year)) {
      Cups.startTournament(s);
      s.tournament.year = s.season.year;
      Game.render();
      Cups.runTournament(s).then(() => Game.endSeason());
      return;
    }
    s.lastTables = {};
    LEAGUES.forEach((l) => { s.lastTables[l.id] = World.sortedTable(s.world.leagues[l.id]).map((r) => r.id); });
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
    if (trophies.length) Social.post('trophy', `${U.plain(trophies[0])}! Bu kupa hepimizin.`, 2);

    p.history.push({
      year: s.season.year, age: p.age, club: Game.teamName(), league: compName, pos,
      apps: ss.apps, goals: ss.goals, assists: ss.assists, avg: Math.round(avg * 100) / 100, motm: ss.motm, ovr,
    });

    // dünya
    const prevLeague = Game.club().league;
    const rel = World.endSeason(s.world);
    // dönem yıldızları: yaşlanma, emeklilik, yeni yetenekler, transferler
    const lnews = Legends.season(s.world, s.season.year + 1);
    lnews.sort((a, b) => b.L.peak - a.L.peak).slice(0, 7).forEach((x) => {
      Game.news(x.t, 'world');
      Social.trend(x);
    });
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
          Social.post('transfer', `Yeni kulübüm ${Game.club().name}. Hedef şampiyonluk!`, 1.8);
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
    s.pendingCup = null;
    s.tournament = null;
    Cups.setup(s);
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
      <span class="hi-week">${s.season.year} · <b>${Math.min(s.season.round + 1, Game.rounds())}</b>/${Game.rounds()}. HAFTA</span>
      <span class="hi-money"><i class="hm-coin">${Icon('coin')}</i><span class="hm-t"><small>Bakiye</small><b>${U.money(p.money)}</b></span>${Game.weeklyIncome() > 0 ? `<em class="hm-inc">+${U.money(Game.weeklyIncome())}<small>/hf</small></em>` : ''}</span>`;
    U.$$('#tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === Game.tab));
    document.getElementById('status').innerHTML = UI.status();
    document.getElementById('side').innerHTML = Game.tab === 'player' ? '' : UI.playerCard();
    const main = document.getElementById('main');
    main.innerHTML = UI[Game.tab]();
    UI.drawFigure();
    Social.drawAvatar();
    UI.strip(main);
    UI.bind(main);
  },
};

// ---------- Ekranlar ----------
const UI = {
  // Uzun listeler sayfa içinde ayrı kaydırma yerine aç/kapa ile gösterilir
  more: {},
  // Son maçın raporu: ilişkiler, takipçi ve ün değişimi
  report() {
    const s = Game.state, r = s.lastReport;
    if (!r) return '';
    const sign = (v, f = (x) => x.toFixed(1)) => (v > 0.05 ? '+' : v < -0.05 ? '−' : '±') + f(Math.abs(v));
    const chip = (ic, l, v, fmt, big) => `<div class="rp-chip ${v > 0.05 ? 'up' : v < -0.05 ? 'down' : ''} ${big ? 'big' : ''}">${Icon(ic)}<span>${l}</span><b>${sign(v, fmt)}</b></div>`;
    return `<section class="card report res-${r.res}">
      <div class="card-h"><span>${Icon('whistle')} Maç Sonrası</span><small class="muted">${r.w}</small></div>
      <div class="rp-top">
        <div class="rp-score"><small>${U.esc(r.team)}</small><b>${r.gf} - ${r.ga}</b><small>${U.esc(r.opp)}</small></div>
        ${r.rating != null ? `<div class="rp-rt ${r.rating >= 7.5 ? 'hi' : r.rating < 6 ? 'lo' : 'mid'}"><small>Reyting</small><b>${r.rating.toFixed(1)}</b>${r.motm ? '<i>Maçın Adamı</i>' : ''}</div>` : ''}
      </div>
      <div class="rp-chips">
        ${chip('whistle', 'Hoca', r.d.coach)}${chip('team', 'Takım', r.d.team)}${chip('fans', 'Taraftar', r.d.fans)}
        ${chip('phone', 'Takipçi', r.d.fol, (x) => Social.fmt(Math.round(x)), true)}${chip('star', 'Ün', r.d.fame)}${chip('smile', 'Moral', r.d.morale, (x) => Math.round(x))}
      </div>
      ${r.why.length ? `<div class="rp-why">${r.why.map((x) => `<span>${U.esc(x)}</span>`).join('')}</div>` : ''}
    </section>`;
  },

  // Gazete görünümlü haberler
  paper() {
    const s = Game.state;
    const all = s.news.slice(0, UI.more.news ? 40 : 9);
    if (!all.length) return '';
    const kicker = (n) => (n.type === 'world' ? 'Dünya' : /transfer|imza|sözleşme/i.test(n.t) ? 'Transfer' : /madalya|kupa|Şampiyon|ödül/i.test(n.t) ? 'Ödül' : n.type === 'bad' ? 'Gündem' : n.type === 'good' ? 'Kulüp' : 'Haber');
    const leadI = Math.max(0, all.findIndex((n) => n.type !== 'world'));
    const lead = all[leadI];
    const rest = all.filter((_, i) => i !== leadI);
    const headline = (t) => {
      const plain = U.plain(t.replace(/<[^>]+>/g, ''));
      const cut = plain.search(/[.!?](\s|$)/);
      return cut > 20 && cut < 90 ? [plain.slice(0, cut + 1), plain.slice(cut + 1).trim()] : [plain, ''];
    };
    const [h1, sub] = headline(lead.t);
    const no = (s.season.year - (s.startYear || s.season.year)) * 40 + s.season.round + 1;
    return `<section class="card paper">
      <div class="pp-mast">
        <div class="pp-top"><span>${s.season.year} · ${Math.min(s.season.round + 1, Game.rounds())}. Hafta</span><span>Sayı ${no}</span></div>
        <h2>StarFoot Gazetesi</h2>
        <div class="pp-sub">Futbolun nabzı · Kulüpten dünyaya</div>
      </div>
      <article class="pp-lead"><span class="pp-k">${kicker(lead)}</span><h3>${U.esc(h1)}</h3>${sub ? `<p>${U.esc(sub)}</p>` : ''}<small>${lead.w || ''}</small></article>
      <div class="pp-cols">${rest.map((n) => `<article class="pp-item ${n.type}"><span class="pp-k">${kicker(n)}</span><p>${n.t}</p><small>${n.type === 'world' ? 'Dünya Servisi' : n.w || ''}</small></article>`).join('')}</div>
      ${s.news.length > 9 ? UI.moreBtn('news', 'Tüm haberler') : ''}
    </section>`;
  },

  moreBtn(k, label) {
    return `<button type="button" class="btn btn-ghost more-btn" data-more="${k}">${UI.more[k] ? 'Daha az göster' : label}</button>`;
  },
  // Metin düğümlerindeki emojileri temizler
  strip(root) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (w.nextNode()) nodes.push(w.currentNode);
    const emo = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}]/u;
    nodes.forEach((n) => { if (emo.test(n.nodeValue)) n.nodeValue = U.plain(n.nodeValue); });
  },

  // Her sekmede görünen durum şeridi
  status() {
    const s = Game.state, p = s.player;
    const lvl = (v) => (v < 30 ? 'low' : v < 55 ? 'mid' : 'ok');
    return `
      <div class="st-cell st-${lvl(p.energy)}">${Icon('bolt')}<div><span>Enerji</span>${UI.bar(p.energy, 'c-energy')}</div><b>${Math.round(p.energy)}</b></div>
      <div class="st-cell st-${lvl(p.morale)}">${Icon('smile')}<div><span>Moral</span>${UI.bar(p.morale, 'c-morale')}</div><b>${Math.round(p.morale)}</b></div>
      <div class="st-cell ${p.injuryWeeks ? 'st-low' : 'st-ok'}">${Icon('injury')}<div><span>Sağlık</span><em>${p.injuryWeeks ? `Sakat · ${p.injuryWeeks} hf` : 'Sağlam'}</em></div></div>
      <div class="st-cell st-ap"><div><span>Hafta hakkı</span><i class="ap">${Array.from({ length: 3 }, (_, i) => `<i class="${i < s.ap ? 'on' : ''}"></i>`).join('')}</i></div><b>${s.ap}/3</b></div>`;
  },

  player() { return UI.playerCard() + Social.render(true); },

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
    if (s.pendingCup && s.cups) {
      const cup = s.cups[s.pendingCup];
      const k = cup.alive.indexOf(s.clubId);
      const opp = cup.alive[k % 2 === 0 ? k + 1 : k - 1];
      next = `<div class="nm-vs"><div class="nm-team">${UI.shirt(Game.club(), 'big')}<b>${U.esc(Game.club().name)}${cup.youth ? ' U19' : ''}</b></div><span class="vs">VS</span><div class="nm-team">${UI.shirt(Game.club(opp), 'big')}<b>${U.esc(Game.club(opp).name)}${cup.youth ? ' U19' : ''}</b></div></div>
        <div class="nm-meta">${U.esc(cup.name.toLocaleUpperCase('tr'))} · ${STAGE_NAMES[cup.alive.length].toLocaleUpperCase('tr')} · Tek maç, kaybeden elenir</div>`;
    } else if (Game.inStreet() && s.street.trials) {
      next = `<div class="nm-vs"><div class="nm-team">${UI.shirt(Game.club(), 'big')}<b>Seçme Günü</b></div></div>
        <div class="nm-meta">ALTYAPI SEÇMELERİ · 3 istasyon: ${({ FW: 'bitiricilik, sürat, slalom', MF: 'pas, top sektirme, slalom', DF: 'ikili mücadele, omuz omuza, kafa' })[p.position] || ''}. Tribünde kulüplerin scoutları var!</div>`;
    } else if (Game.inStreet()) {
      next = `<div class="nm-vs"><div class="nm-team">${UI.shirt(Game.club(), 'big')}<b>Bizim Sokak</b></div><span class="vs">VS</span><div class="nm-team">${UI.shirt({ id: 'ARK', c1: '#2a6fdb', c2: '#ffffff' }, 'big')}<b>Arka Sokak</b></div></div>
        <div class="nm-meta">MAHALLE MAÇI · Kenarda bir scout izliyor. İyi oynarsan seni bir altyapıya götürecek!</div>`;
    }
    const crest = (name, club, sub) => `<div class="nm-team">${club ? UI.shirt(club, 'big') : `<span class="nat">${sub}</span>`}<b>${U.esc(name)}</b></div>`;
    if (s.pendingIntl) {
      const n = Game.nation(), o = Game.nat(s.pendingIntl);
      next = `<div class="nm-vs">${crest(n.name, null, n.code)}<span class="vs">VS</span>${crest(o.name, null, o.code)}</div>
        <div class="nm-meta">MİLLİ MAÇ · Rakip gücü ${o.rating} · Yıldızlar: ${U.esc(Game.natStars(o.code).slice(0, 2).join(', ') || '—')}</div>`;
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
    const focusL = STATS.find((x) => x.k === s.trainFocus).l;
    const keyTxt = '★ mevkin için önemli';
    const acts = [
      ['train', 'train', 'Antrenman', 'Normal gelişim', '−12 enerji'],
      ['intense', 'fire', 'Yoğun Antrenman', '×1.8 gelişim · sakatlık riski', '−24 enerji'],
      ['coach', 'coach', 'Özel Hoca', '×2.3 gelişim', U.money(Game.coachCost())],
      ['rest', 'rest', 'Dinlen', 'Moral de artar', '+20 enerji'],
      ['team', 'team', 'Takımla Takıl', 'Takım ilişkisi artar', '−5 enerji'],
      ['talk', 'talk', 'Hocayla Konuş', s.week.coachTalk ? 'Bu hafta konuştun' : 'Hoca ilişkisi artar', ''],
      ['fans', 'phone', 'Sosyal Medya', 'Paylaşım yap, takipçi kazan', '−3 enerji'],
    ];
    return `
      ${UI.report()}
      <div class="grid2">
        <section class="card next">
          <div class="card-h"><span>${Icon('whistle')} Maç Günü</span><span class="tag role-${roleK}">${role}</span></div>
          ${next}
          ${p.energy < 40 ? `<div class="warn">${Icon('bolt')} Enerjin düşük. Performansın düşer, sakatlık riski artar.</div>` : ''}
          <button class="btn btn-play" data-go="match">${Icon('play')} ${Game.inStreet() && s.street.trials ? 'Seçmelere Katıl' : 'Maça Çık'}</button>
          ${s.ap > 0 ? `<div class="hint">Bu hafta ${s.ap} aksiyon hakkın daha var.</div>` : ''}
        </section>
        <section class="card plan">
          <div class="card-h"><span>${Icon('train')} Haftalık Plan</span><span class="ap-pips ${s.ap ? '' : 'done'}" title="Aksiyon hakkı">${[0, 1, 2].map((i) => `<i class="${i < s.ap ? 'on' : ''}"></i>`).join('')}<b>${s.ap ? `${s.ap} hak` : 'Maç günü'}</b></span></div>
          <div class="lbl">Antrenman odağı <small>${keyTxt}</small></div>
          <div class="focus" role="radiogroup" aria-label="Antrenman odağı">${STATS.map((st) => {
            const v = p.stats[st.k];
            const key = (POSITIONS[p.position].w[st.k] || 0) >= 0.12;
            return `<button class="fc ${s.trainFocus === st.k ? 'on' : ''} ${key ? 'key' : ''}" data-focus="${st.k}" role="radio" aria-checked="${s.trainFocus === st.k}">
              <span>${st.l}${key ? '<i>★</i>' : ''}</span><b class="${UI.statColor(v)}">${Math.floor(v)}</b>${UI.bar(v, UI.statColor(v))}
            </button>`;
          }).join('')}</div>
          <label class="drill-tg"><input type="checkbox" id="drill-tg" ${s.drills !== false ? 'checked' : ''}><span><b>Antrenman mini oyunları</b><small>Odak statına göre çalışma oynanır. İyi oynarsan gelişim ×1,5'e kadar çıkar.</small></span></label>
          <div class="lbl">Antrenman <small>${focusL} odaklı · tahmini gelişim</small></div>
          <div class="tr-row">${acts.slice(0, 3).map(([k, ic, l, d, cost], i) => `<button class="tr-card tr-${k}" data-act="${k}" ${s.ap <= 0 ? 'disabled' : ''}>
            <span class="tr-ic">${Icon(ic)}</span>
            <b>${l}</b>
            <span class="tr-int" aria-label="Yoğunluk">${[0, 1, 2].map((j) => `<i class="${j <= i ? 'on' : ''}"></i>`).join('')}</span>
            <span class="tr-gain">+${Game.estGain([1, 1.8, 2.3][i]).toFixed(2)}</span>
            <em class="tr-cost ${cost.startsWith('−') ? 'neg' : ''}">${cost}</em>
            <small>${d}</small>
          </button>`).join('')}</div>
          <div class="lbl">Aktiviteler</div>
          <div class="ac-row">${acts.slice(3).map(([k, ic, l, d, cost]) => `<button class="ac-tile ac-${k}" data-act="${k}" ${s.ap <= 0 ? 'disabled' : ''}>
            <span class="ac-ic">${Icon(ic)}</span><span class="ac-t"><b>${l}</b><small>${d}</small></span>${cost ? `<em class="${cost.startsWith('−') ? 'neg' : ''}">${cost}</em>` : ''}
          </button>`).join('')}</div>
        </section>
      </div>
      ${s.offers.length ? `
      <section class="card">
        <div class="card-h"><span>${Icon('mail')} Transfer Teklifleri</span></div>
        ${s.offers.map((o, i) => UI.offerRow(o, i, 'mid')).join('')}
        <button class="btn btn-ghost" data-reject="1">Teklifleri Reddet</button>
      </section>` : ''}
      ${Social.render(false)}
${UI.paper()}`;
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
    if (Game.inStreet()) return `<section class="card"><div class="card-h"><span>${Icon('squad')} Henüz bir kulübün yok</span></div><p class="muted">Önce mahalle maçında kendini göster. Scout seni bir altyapıya götürünce takımın ve ligin burada görünecek.</p></section>`;
    const lg = Game.league();
    const tbl = World.sortedTable(lg);
    const name = (id) => Game.teamName(id);
    const clubOf = (id) => s.world.clubs[id];
    const myRes = lg.results.filter((r) => r.h === s.clubId || r.a === s.clubId).sort((x, y) => x.round - y.round);
    const res = (r, id) => { const gf = r.h === id ? r.hs : r.as, ga = r.h === id ? r.as : r.hs; return gf > ga ? 'W' : gf < ga ? 'L' : 'D'; };
    const form = (id) => lg.results.filter((r) => r.h === id || r.a === id).sort((x, y) => x.round - y.round).slice(-5).map((r) => res(r, id));
    const pill = (k) => `<i class="fm fm-${k}">${{ W: 'G', D: 'B', L: 'M' }[k]}</i>`;
    const pos = tbl.findIndex((r) => r.id === s.clubId) + 1;
    const me = tbl[pos - 1];
    const leader = tbl[0];
    const relegate = !Game.isYouth() && Game.club().league === 'TR1';
    const promote = !Game.isYouth() && Game.club().league === 'TR2';
    const zone = (i) => (i === 0 ? 'z-champ' : promote && i < 3 ? 'z-up' : relegate && i >= tbl.length - 3 ? 'z-down' : '');
    const nextFx = Game.nextFixture();
    const gap = leader.id === s.clubId ? (tbl[1] ? me.pts - tbl[1].pts : 0) : leader.pts - me.pts;
    const fxFrom = Math.max(0, Math.min(s.season.round - 3, Game.rounds() - 8));
    const fixtures = lg.fixtures.map((round, i) => {
      const f = round.find(([h, a]) => h === s.clubId || a === s.clubId);
      if (!f) return '';
      if (!UI.more.fix && (i < fxFrom || i >= fxFrom + 8)) return '';
      const r = myRes.find((x) => x.round === i);
      const k = r ? res(r, s.clubId) : null;
      return `<div class="mc ${i === s.season.round ? 'cur' : ''} ${r ? 'played' : ''}">
        <span class="wk">${i + 1}</span>
        <div class="mc-t h"><span class="nm-l">${U.esc(name(f[0]))}</span><span class="nm-s">${U.esc(clubOf(f[0]).short)}</span>${UI.shirt(clubOf(f[0]))}</div>
        <div class="mc-s ${k ? 'r-' + k : ''}">${r ? `${r.hs} - ${r.as}` : i === s.season.round ? 'SIRADA' : '-'}</div>
        <div class="mc-t">${UI.shirt(clubOf(f[1]))}<span class="nm-l">${U.esc(name(f[1]))}</span><span class="nm-s">${U.esc(clubOf(f[1]).short)}</span></div>
      </div>`;
    }).join('');
    const scorers = World.topScorers(lg, 10);
    const meName = Player.fullName(Game.p);
    const maxG = scorers.length ? scorers[0].g : 1;
    const nextOpp = nextFx ? (nextFx.home === s.clubId ? nextFx.away : nextFx.home) : null;
    return `
      <section class="card lg-head" style="--c1:${Game.club().c1}">
        <div class="sq-id">${Icon('table')}<div><h2>${U.esc(Game.leagueName())}</h2><small>${s.season.year} sezonu · ${Math.min(s.season.round + 1, Game.rounds())}. hafta / ${Game.rounds()}</small></div></div>
        <div class="sq-stats">
          <div><span>Sıran</span><b>${pos}.</b></div>
          <div><span>Puan</span><b>${me.pts}</b></div>
          <div><span>${leader.id === s.clubId ? 'Farkın (2. ile)' : 'Lidere fark'}</span><b>${leader.id === s.clubId ? '+' : '−'}${Math.abs(gap)}</b></div>
          <div><span>Son 5 maç</span><b class="form">${form(s.clubId).map(pill).join('') || '<small class="muted">—</small>'}</b></div>
        </div>
        ${nextOpp ? `<p class="muted sq-note">Sıradaki rakip: <b>${U.esc(name(nextOpp))}</b> (${tbl.findIndex((r) => r.id === nextOpp) + 1}. sırada)</p>` : ''}
      </section>
      ${Cups.render(s)}
      <section class="card">
        <div class="card-h"><span>${Icon('table')} Puan Durumu</span><small class="lg-legend"><i class="z-champ"></i>Şampiyonluk${promote ? '<i class="z-up"></i>Üst lig' : ''}${relegate ? '<i class="z-down"></i>Küme düşme' : ''}</small></div>
        <div class="tscroll"><table class="tbl lgt">
          <tr><th>#</th><th class="l">Takım</th><th>O</th><th>G</th><th>B</th><th>M</th><th class="hide-s">A</th><th class="hide-s">Y</th><th>AV</th><th class="hide-s">Form</th><th>P</th></tr>
          ${tbl.map((r, i) => `<tr class="${r.id === s.clubId ? 'hl' : ''} ${zone(i)}">
            <td><span class="rk">${i + 1}</span></td>
            <td class="l"><span class="tm">${UI.shirt(clubOf(r.id))}${U.esc(name(r.id))}</span></td>
            <td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td class="hide-s">${r.gf}</td><td class="hide-s">${r.ga}</td>
            <td class="${r.gf - r.ga > 0 ? 'pos' : r.gf - r.ga < 0 ? 'neg' : ''}">${r.gf - r.ga > 0 ? '+' : ''}${r.gf - r.ga}</td>
            <td class="hide-s"><span class="form">${form(r.id).map(pill).join('')}</span></td>
            <td><b class="pts">${r.pts}</b></td>
          </tr>`).join('')}
        </table></div>
      </section>
      <div class="grid2">
        <section class="card"><div class="card-h"><span>${Icon('whistle')} Fikstürün</span><small class="muted">${myRes.length}/${Game.rounds()} oynandı</small></div><div class="fixtures">${fixtures}</div>${UI.moreBtn('fix', 'Tüm fikstür')}</section>
        <section class="card"><div class="card-h"><span>${Icon('ball')} Gol Krallığı</span></div>
          ${scorers.length ? `<div class="scorers">${scorers.map((x, i) => `<div class="scr ${x.name === meName ? 'me' : ''}">
            <span class="rk">${i + 1}</span>${UI.shirt(clubOf(x.club))}
            <div class="scr-t"><b>${U.esc(x.name)}</b><small>${U.esc(name(x.club))}</small>${UI.bar((x.g / maxG) * 100, 'c-mid')}</div>
            <b class="g">${x.g}</b></div>`).join('')}</div>` : '<p class="muted">Henüz gol atılmadı.</p>'}
        </section>
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
    if (Game.inStreet()) return `<section class="card"><div class="card-h"><span>${Icon('squad')} Henüz bir kulübün yok</span></div><p class="muted">Önce mahalle maçında kendini göster. Scout seni bir altyapıya götürünce takımın ve ligin burada görünecek.</p></section>`;
    const club = Game.club();
    const me = { n: Player.fullName(p), pos: p.position, r: Player.overall(p), age: p.age, me: true, num: p.shirt };
    Shirt.map();
    const roster = Game.teamRoster(s.clubId).slice();
    const all = roster.concat([me]);
    const posL = { GK: 'Kaleci', DF: 'Defans', MF: 'Orta Saha', FW: 'Forvet' };
    const posS = { GK: 'KL', DF: 'DF', MF: 'OS', FW: 'FV' };
    // İlk 11: 4-3-3, her mevkide en güçlüler (sen ilk 11 adayıysan dahil)
    const role = Game.roleFor(Player.overall(p, true), Game.teamRating(s.clubId), Game.isYouth(), true);
    const need = { GK: 1, DF: 4, MF: 3, FW: 3 };
    const xi = {};
    Object.keys(need).forEach((k) => {
      let pool = roster.filter((x) => x.pos === k).sort((x, y) => y.r - x.r);
      if (k === p.position && role === 'starter') pool = [me].concat(pool);
      xi[k] = pool.slice(0, need[k]);
    });
    const inXi = new Set(Object.values(xi).flat());
    const bench = all.filter((x) => !inXi.has(x)).sort((x, y) => ({ GK: 0, DF: 1, MF: 2, FW: 3 }[x.pos] - { GK: 0, DF: 1, MF: 2, FW: 3 }[y.pos]) || y.r - x.r);
    const rows = { FW: 18, MF: 42, DF: 66, GK: 88 };
    const chip = (x, left, top) => `
      <div class="pp ${x.me ? 'me' : ''}" style="left:${left}%;top:${top}%">
        <div class="pp-shirt">${UI.shirt(club, 'big')}<i>${x.num}</i></div>
        <b>${U.esc(x.me ? 'SEN' : x.n.split(' ').slice(-1)[0])}${x.me && Captain.is() ? ' <i class="armband sm">C</i>' : ''}</b>
        <span class="${UI.statColor(x.r)}">${x.r}</span>
      </div>`;
    let pitch = '';
    Object.keys(xi).forEach((k) => {
      const list = xi[k];
      list.forEach((x, i) => { pitch += chip(x, ((i + 1) / (list.length + 1)) * 100, rows[k]); });
    });
    const sorted = all.slice().sort((x, y) => y.r - x.r);
    const myRank = sorted.indexOf(me) + 1;
    const avg = (arr) => Math.round(arr.reduce((t, x) => t + x.r, 0) / Math.max(1, arr.length));
    const lineAvg = (k) => avg(all.filter((x) => x.pos === k));
    const tbl = World.sortedTable(Game.league());
    const pos = tbl.findIndex((r) => r.id === s.clubId) + 1;
    const top = sorted.filter((x) => !x.me)[0];
    return `
      <section class="card sq-head" style="--c1:${club.c1};--c2:${club.c2}">
        <div class="sq-id">${UI.shirt(club, 'big')}<div><h2>${U.esc(Game.teamName())}</h2><small>${U.esc(Game.leagueName())}</small></div></div>
        <div class="sq-stats">
          <div><span>Takım gücü</span><b>${Game.teamRating(s.clubId)}</b></div>
          <div><span>Lig sırası</span><b>${pos}.</b></div>
          <div><span>Kadrodaki yerin</span><b>${myRank}/${all.length}</b></div>
          <div><span>Durumun</span><b class="role-${role}">${{ starter: "İlk 11", bench: 'Yedek', out: 'Kadro dışı' }[role]}</b></div>
        </div>
        <div class="sq-lines">${['FW', 'MF', 'DF', 'GK'].map((k) => `<div><span>${posL[k]}</span>${UI.bar(lineAvg(k), UI.statColor(lineAvg(k)))}<b>${lineAvg(k)}</b></div>`).join('')}</div>
        ${top ? `<p class="muted sq-note">Takımın en iyisi: <b>${U.esc(top.n)}</b> (${top.r})${top.star ? ' · yıldız oyuncu' : ''}</p>` : ''}
      </section>
      <div class="grid2">${Captain.card()}${Shirt.card()}</div>
      <div class="grid2 sq-grid">
        <section class="card">
          <div class="card-h"><span>${Icon('squad')} Muhtemel İlk 11</span><small class="muted">4-3-3</small></div>
          <div class="formation">${pitch}</div>
        </section>
        <section class="card">
          <div class="card-h"><span>${Icon('team')} Yedekler ve Rotasyon</span><small class="muted">${bench.length} oyuncu</small></div>
          <div class="bench">${bench.map((x) => `
            <div class="bc ${x.me ? 'me' : ''}">
              <div class="pp-shirt">${UI.shirt(club, 'big')}<i>${x.num}</i></div>
              <div class="bc-t"><b>${U.esc(x.me ? x.n + ' (SEN)' : x.n)}</b><small>${posL[x.pos]} · ${x.age || '-'} yaş${x.star ? ' · yıldız' : ''}</small></div>
              <span class="pos">${posS[x.pos]}</span>
              <b class="rt ${UI.statColor(x.r)}">${x.r}</b>
            </div>`).join('')}</div>
        </section>
      </div>`;
  },

  shop() {
    const p = Game.p;
    const ageBand = p.age <= 12 ? 'Çocuk' : p.age <= 17 ? 'Genç' : 'Profesyonel';
    const open = UI.shopOpen || (UI.shopOpen = { cons: true });
    const cats = [
      ['boots', 'boot', 'Kramponlar', 'Maçta statlarına bonus (en iyisi geçerli)'],
      ['gear', 'gear', 'Antrenman Ekipmanı', 'Antrenman gelişimini artırır (en iyisi geçerli)'],
      ['food', 'food', 'Beslenme', 'Haftalık enerji yenilenmesi (en iyisi geçerli)'],
      ['life', 'smile', 'Hobi ve Eğlence', 'Her hafta moral (hepsi birikir)'],
      ['ride', 'fast', 'Ulaşım', 'Moral ve ün (hepsi birikir)'],
      ['style', 'star', 'Stil ve Lüks', 'Ün ağırlıklı (hepsi birikir)'],
      ['balls', 'ball', 'Kozmetik Toplar', 'Maçta ve antrenmanda kullandığın top'],
    ];
    const card = (art, color, name, desc, right, cls = '', skin) => `
      <div class="sh-item ${cls}">
        <div class="sh-art">${skin ? `<img class="ball-thumb" alt="" src="${Balls.thumb(BALL_STYLES[skin], 96)}">` : ShopArt.svg(art, color)}</div>
        <div class="sh-t"><b>${U.esc(name)}</b><small>${U.esc(desc)}</small></div>
        <div class="sh-act">${right}</div>
      </div>`;
    const cons = CONSUMABLES.filter((c) => Shop.available(c)).map((c) => {
      const used = Shop.usedThisSeason(c);
      const price = Shop.price(c);
      return card(c.art, '#4fb3ff', c.name, c.desc, used ? '<span class="tag">Bu sezon kullandın</span>' : `<button class="btn btn-buy" data-use="${c.id}" ${p.money < price ? 'disabled' : ''}>${U.money(price)}</button>`);
    }).join('');
    const group = (id, ic, t, d, body, count) => `
      <details class="shop-cat" data-cat="${id}" ${open[id] ? 'open' : ''}>
        <summary>${Icon(ic)}<span class="sc-t"><b>${t}</b><small>${d}</small></span><span class="sc-n">${count}</span>${Icon('chevron', 'sc-chev')}</summary>
        <div class="sh-grid">${body}</div>
      </details>`;
    const sec = cats.map(([c, ic, t, d]) => {
      const list = ITEMS.filter((i) => i.cat === c && (p.items.includes(i.id) || (p.age >= i.minAge && (!i.maxAge || p.age <= i.maxAge))));
      const locked = ITEMS.filter((i) => i.cat === c && i.minAge > p.age && !p.items.includes(i.id)).sort((x, y) => x.minAge - y.minAge).slice(0, 2);
      if (!list.length && !locked.length) return '';
      const owned = list.filter((i) => p.items.includes(i.id)).length;
      const body = (c === 'balls' ? card(null, null, 'Lig Topu', 'Her ligin ve turnuvanın kendi topu', !p.ballSkin ? `<span class="tag own">${Icon('star')} Kullanılıyor</span>` : '<button class="btn btn-ghost btn-buy" data-ball="">Kullan</button>', !p.ballSkin ? 'own' : '', 'tr') : '') + list.map((it) => {
        const own = p.items.includes(it.id);
        let right = own ? `<span class="tag own">${Icon('star')} Sende</span>` : `<button class="btn btn-buy" data-buy="${it.id}" ${p.money < it.price ? 'disabled' : ''}>${U.money(it.price)}</button>`;
        if (own && it.skin) right = p.ballSkin === it.skin ? `<span class="tag own">${Icon('star')} Kullanılıyor</span>` : `<button class="btn btn-ghost btn-buy" data-ball="${it.skin}">Kullan</button>`;
        return card(it.art, ShopArt.tierColor(it.price), it.name, it.desc, right, own ? 'own' : '', it.skin);
      }).join('') + locked.map((it) => card(it.art, '#5d6878', it.name, `${it.minAge} yaşında açılır`, `<span class="tag">${U.money(it.price)}</span>`, 'locked', it.skin)).join('');
      return group(c, ic, t, d, body, `${owned}/${list.length}`);
    }).join('');
    return `
      <section class="card shop-head">
        <div class="card-h"><span>${Icon('shop')} Mağaza</span><span class="tag">${ageBand} reyonu · ${p.age} yaş</span></div>
        <div class="shop-wallet">${Icon('wallet')}<span><small>Bakiyen</small><b>${U.money(p.money)}</b></span><span><small>Eşyaların</small><b>${p.items.length}</b></span></div>
        <p class="muted">Yaşın büyüdükçe yeni ürünler açılır. Kategoriye dokunarak aç ya da kapat.</p>
      </section>
      ${group('cons', 'bolt', 'Tek Kullanımlık', 'Anında etki eder', cons, CONSUMABLES.filter((c) => Shop.available(c)).length)}
      ${sec}`;
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
      <section class="card">
        <div class="card-h"><span>${Icon('career')} Kupa Vitrini</span><small class="muted">${p.trophies.length} kupa ve ödül</small></div>
        <div class="cabinet">${p.trophies.length ? p.trophies.slice().reverse().map((x) => {
          const [yr, ...rest] = U.plain(x).split(':');
          const txt = rest.join(':').trim();
          return `<div class="trophy">${Trophy.svg(Trophy.kind(txt))}<b>${U.esc(txt.replace(/\s*\(\d+\)$/, ''))}</b><small>${U.esc(yr)}</small></div>`;
        }).join('') : '<div class="cab-empty">Vitrin şimdilik boş. İlk kupan burada parlayacak.</div>'}</div>
      </section>
      <section class="card">
        <div class="card-h"><span>${Icon('star')} Maçın Adamı Ödülleri</span><small class="muted">${p.totals.motm} ödül</small></div>
        ${(p.motmAwards || []).length ? `<div class="motm-shelf">${p.motmAwards.slice(-12).reverse().map((m) => `<div class="motm-mini">${Trophy.svg('motm')}<b>${m.r.toFixed(1)}</b><small>${m.y} · ${U.esc(m.opp)}</small><small>${m.g} gol · ${m.a} asist</small></div>`).join('')}</div>` : '<div class="cab-empty">Maçın adamı seçildiğinde yıldız kupan burada sergilenir.</div>'}
      </section>
      <section class="card">
        <div class="card-h"><span>${Icon('star')} Başarımlar</span><small class="muted">${Object.keys(p.ach || {}).length}/${ACHIEVEMENTS.length}</small></div>
        ${UI.bar((Object.keys(p.ach || {}).length / ACHIEVEMENTS.length) * 100, 'c-mid')}
        <div class="ach-cats">${ACH_CATS.map((c) => {
          const list = ACHIEVEMENTS.filter((a) => a.cat === c.id);
          const got = list.filter((a) => (p.ach || {})[a.id]).length;
          return `<details class="ach-cat"><summary><b>${c.l}</b><span class="muted">${got}/${list.length}</span><i class="ach-prog"><i style="width:${(got / list.length) * 100}%"></i></i></summary>
            <div class="medals">${list.map((a) => {
              const y = (p.ach || {})[a.id];
              return `<div class="medal ${y ? 'got' : ''}" title="${U.esc(a.desc)}">${Trophy.medal(a.tier, !!y)}<b>${U.esc(a.name)}</b><small>${y ? y : U.esc(a.desc)}</small></div>`;
            }).join('')}</div></details>`;
        }).join('')}</div>
      </section>
      <div class="card">
        <div class="card-h"><span>${Icon('save')} Oyun</span></div>
        <div class="row-btns">
          <div class="diff-row"><span class="muted">Zorluk</span><div class="seg">${Object.entries(DIFFS).map(([k, v]) => `<button data-setdiff="${k}" class="${k === (Game.state.difficulty || 'normal') ? 'on' : ''}">${v.l}</button>`).join('')}</div></div>
          <button class="btn btn-ghost" data-sys="save">${Icon('save')} Kaydet</button>
          <button class="btn btn-ghost" data-sys="menu">${Icon('exit')} Ana Menü</button>
          ${p.age >= 33 ? `<button class="btn btn-ghost" data-sys="retire">${Icon('wave')} Emekli Ol</button>` : ''}
          <button class="btn btn-danger" data-sys="delete">${Icon('trash')} Kariyeri Sil</button>
        </div>
      </div>`;
  },

  world() {
    const s = Game.state;
    const sel = UI.worldLeague || (s.world.leagues[Game.club().league] ? Game.club().league : 'TR1');
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
      <section class="card">
        <div class="card-h"><span>${Icon('star')} Dönemin Yıldızları</span><small class="muted">${s.season.year}</small></div>
        <div class="scorers">${Legends.active(s.world).sort((a, b) => b.r - a.r).slice(0, 15).map((x, i) => `<div class="scr"><span class="rk">${i + 1}</span>${UI.shirt(s.world.clubs[x.L.club] || Game.club())}<div class="scr-t"><b>${U.esc(x.n)}</b><small>${U.esc((s.world.clubs[x.L.club] || {}).name || '')} · ${x.age} yaş · ${{ GK: 'Kaleci', DF: 'Defans', MF: 'Orta Saha', FW: 'Forvet' }[x.pos]}</small></div><b class="g">${x.r}</b></div>`).join('')}</div>
      </section>
      <div class="card">
        <div class="card-h"><span>${Icon('shield')} Milli Takımlar</span></div>
        <table class="tbl"><tr><th class="l">Ülke</th><th>Güç</th><th class="l">Yıldızlar</th></tr>
        ${Game.nations().sort((a, b) => b.rating - a.rating).map((n) => `<tr class="${n.code === s.player.nation ? 'hl' : ''}"><td class="l"><span class="code">${n.code}</span> ${U.esc(n.name)}</td><td>${n.rating}</td><td class="l"><small>${U.esc(Game.natStars(n.code).join(', ') || '—')}</small></td></tr>`).join('')}
        </table>
      </div>`;
  },

  bind(root) {
    U.$$('[data-focus]', root).forEach((b) => (b.onclick = () => { Game.state.trainFocus = b.dataset.focus; Game.render(); }));
    U.$$('[data-act]', root).forEach((b) => (b.onclick = () => Game.act(b.dataset.act)));
    U.$$('[data-more]', root).forEach((b) => (b.onclick = () => { UI.more[b.dataset.more] = !UI.more[b.dataset.more]; Game.render(); }));
    const dtg = root.querySelector('#drill-tg');
    if (dtg) dtg.onchange = () => { Game.state.drills = dtg.checked; Game.save(); };
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
      if (it.skin) p.ballSkin = it.skin;
      if (['life', 'ride', 'style'].includes(it.cat) && it.price >= 1000) Social.post('life', `Kendime küçük bir hediye: ${it.name}.`, 1.2);
      if (it.fame) Player.addFame(p, it.fame);
      Ach.check();
      Game.toast(`${it.name} satın alındı`, 'good');
      Game.save();
      Game.render();
    }));
    U.$$('[data-setdiff]', root).forEach((b) => (b.onclick = () => { Game.state.difficulty = b.dataset.setdiff; Game.save(); Game.toast(`Zorluk: ${DIFFS[b.dataset.setdiff].l}`, 'good'); Game.render(); }));
    U.$$('[data-use]', root).forEach((b) => (b.onclick = () => Shop.use(b.dataset.use)));
    const nAsk = root.querySelector('#num-ask');
    if (nAsk) nAsk.onclick = () => Shirt.ask(root.querySelector('#num-sel').value);
    U.$$('[data-ball]', root).forEach((b) => (b.onclick = () => {
      Game.p.ballSkin = b.dataset.ball || null;
      Game.toast(Game.p.ballSkin ? `${BALL_STYLES[Game.p.ballSkin].name} artık maçlarda kullanılıyor` : 'Lig topları kullanılıyor', 'good');
      Game.save(); Game.render();
    }));
    U.$$('details.shop-cat', root).forEach((d) => d.addEventListener('toggle', () => { (UI.shopOpen = UI.shopOpen || {})[d.dataset.cat] = d.open; }));
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

  reset() { Events._mate = null; Events._amt = null; Events._senior = null; Events._legend = null; Events._tip = null; },

  roll() {
    const p = Game.p;
    Events.reset();
    const pool = Events.list.filter((e) => e.cond(p));
    const ev = pool.length ? U.weighted(pool, (e) => e.w || 1) : null;
    if (ev) Game.state.pendingEvent = ev.id;
    Events.reset();
  },

  show() {
    const s = Game.state;
    const ev = Events.list.find((e) => e.id === s.pendingEvent);
    if (!ev) { s.pendingEvent = null; return; }
    Events.reset();
    const text = ev.text();
    Game.modal(`<div class="ev-tag">Olay</div><h3>${U.esc(text)}</h3>`, ev.opts.map((o) => ({
      t: o.t,
      fn: () => {
        const res = o.fx(s.player);
        s.pendingEvent = null;
        Game.save();
        Game.render();
        Game.toast(res, 'good');
        Game.checkPending();
      },
    })));
  },
};

// ---------- Karakter oluşturma ----------
const Create = {
  alloc: {},
  points: 20,
  pos: 'FW',
  diff: 'normal',
  open() {
    Create.alloc = {};
    STATS.forEach((s) => (Create.alloc[s.k] = 0));
    Game.show('create');
    const el = document.getElementById('create');
    el.innerHTML = `
      <div class="cr-card card">
        <h1>Yeni Kariyer</h1>
        <p class="muted">Futbolcu olma hayalinin peşindesin. Hangi yılda ve kaç yaşında başlayacağını seç. Kulübünü sen seçmezsin: scoutlar seni keşfeder.</p>
        <div class="cr-grid">
          <label>Adın<input id="cr-name" maxlength="16" placeholder="Örn: Emre"></label>
          <label>Soyadın<input id="cr-sur" maxlength="18" placeholder="Örn: Yıldız"></label>
          <label>Uyruğun<select id="cr-nat">${NATIONS.map((n) => `<option value="${n.code}">${n.name}</option>`).join('')}</select></label>
          <label>Ayak<select id="cr-foot"><option value="R">Sağ</option><option value="L">Sol</option></select></label>
          <label>Başlangıç yılı<select id="cr-year">${Array.from({ length: 2026 - 1980 + 1 }, (_, i) => 2026 - i).map((y) => `<option value="${y}">${y}</option>`).join('')}</select>
            <small class="muted">O dönemin yıldızlarıyla oynarsın</small></label>
          <label>Başlangıç yaşı<select id="cr-age">${Array.from({ length: 11 }, (_, i) => 8 + i).map((a) => `<option value="${a}">${a} yaş</option>`).join('')}</select>
            <small class="muted" id="cr-age-note"></small></label>
        </div>
        <div class="lbl">Zorluk</div>
        <div class="seg big" id="cr-diff">
          ${Object.entries(DIFFS).map(([k, v]) => `<button data-diff="${k}" class="${k === Create.diff ? 'on' : ''}"><b>${v.l}</b></button>`).join('')}
        </div>
        <small class="muted cr-diff-note" id="cr-diff-note">${DIFFS[Create.diff].d}</small>
        <div class="lbl">Mevki</div>
        <div class="seg big" id="cr-pos">
          ${Object.entries(POSITIONS).map(([k, v]) => `<button data-pos="${k}" class="${k === Create.pos ? 'on' : ''}">${v.l}</button>`).join('')}
        </div>
        <div class="lbl">Yetenek puanlarını dağıt <b id="cr-pts"></b></div>
        <div class="cr-stats" id="cr-stats"></div>
        <div class="row-btns">
          <button class="btn btn-ghost" id="cr-back">Geri</button>
          <button class="btn btn-big" id="cr-go">Kariyere Başla</button>
        </div>
      </div>`;
    U.$$('#cr-diff button').forEach((b) => (b.onclick = () => {
      Create.diff = b.dataset.diff;
      U.$$('#cr-diff button').forEach((x) => x.classList.toggle('on', x === b));
      document.getElementById('cr-diff-note').textContent = DIFFS[Create.diff].d;
    }));
    U.$$('#cr-pos button').forEach((b) => (b.onclick = () => {
      Create.pos = b.dataset.pos;
      U.$$('#cr-pos button').forEach((x) => x.classList.toggle('on', x === b));
      Create.drawStats();
    }));
    document.getElementById('cr-back').onclick = () => Game.init();
    const ageSel = document.getElementById('cr-age');
    const updAge = () => {
      const a = +ageSel.value;
      document.getElementById('cr-age-note').textContent = a <= 12 ? 'İlk maçın bir mahalle maçı; scout seni izleyecek' : `Altyapı seçmelerine katılırsın (${ageGroupName(a)}); kulübünü scoutlar belirler`;
      Create.drawStats();
    };
    ageSel.onchange = updAge;
    updAge();
    document.getElementById('cr-go').onclick = () => {
      const name = document.getElementById('cr-name').value.trim() || 'Emre';
      const surname = document.getElementById('cr-sur').value.trim() || 'Yıldız';
      Game.newCareer({
        name, surname, nation: document.getElementById('cr-nat').value, foot: document.getElementById('cr-foot').value,
        position: Create.pos, alloc: Create.alloc, difficulty: Create.diff,
        year: +document.getElementById('cr-year').value, age: +document.getElementById('cr-age').value,
      });
    };
    Create.drawStats();
  },
  // Oyuncunun başlayacağı yaşa göre taban stat (Player.create ile aynı)
  base() {
    const el = document.getElementById('cr-age');
    const age = el ? +el.value : 8;
    return Math.max(12, Math.round(expectedAtAge(age) - 6));
  },
  left() { return Create.points - Object.values(Create.alloc).reduce((a, b) => a + b, 0); },
  drawStats() {
    const w = POSITIONS[Create.pos].w;
    document.getElementById('cr-pts').textContent = `(${Create.left()} puan kaldı · ${document.getElementById('cr-age').value} yaşındaki bir çocuğun ortalaması ${Create.base()})`;
    document.getElementById('cr-stats').innerHTML = STATS.map((s) => `
      <div class="cs ${w[s.k] >= 0.12 ? 'key' : ''}">
        <span title="${U.esc(s.d)}">${s.l}${w[s.k] >= 0.12 ? ' ★' : ''}</span>
        <button data-d="-1" data-k="${s.k}">−</button>
        <b>${Create.base() + Create.alloc[s.k]}</b>
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
