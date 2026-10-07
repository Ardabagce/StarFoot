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
  // Piyasa değeri: güç ve yaşa göre (genç ve iyi oyuncu çok pahalı)
  marketValue(p, ovr) {
    const o = ovr != null ? ovr : Player.overall(p, true);
    const af = p.age <= 21 ? 1.4 : p.age <= 24 ? 1.2 : p.age <= 28 ? 1 : p.age <= 30 ? 0.7 : p.age <= 32 ? 0.45 : 0.25;
    const fame = 1 + U.clamp(p.fame || 0, 0, 100) / 200;
    return Math.round((900000 * Math.exp((o - 65) / 6.5) * af * fame) / 50000) * 50000;
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
  news(txt, type = '', extra) {
    const s = Game.state;
    s.news.unshift(Object.assign({ t: txt, type, w: `${s.season.year} H${s.season.round + 1}` }, extra || {}));
    s.news = s.news.slice(0, 40);
  },
  toast(msg, type = '') {
    Notifs.push(msg, type);
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
    U.$$('#lang-sw [data-lang]').forEach((b) => { b.classList.toggle('on', b.dataset.lang === I18N.lang); b.onclick = () => { if (b.dataset.lang !== I18N.lang) I18N.set(b.dataset.lang); }; });
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
    Game._fresh = true;
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
    const natLg = { TUR: 'TR', ENG: 'ENG', ESP: 'ESP', GER: 'GER', ITA: 'ITA', FRA: 'FRA', NED: 'NED', POR: 'POR', BRA: 'BRA', ARG: 'ARG', BEL: 'BEL', SCO: 'SCO', USA: 'USA', MEX: 'MEX', KSA: 'KSA', JPN: 'JPN' }[p.nation] || 'TR';
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
      Game.news(st.trials ? `${s.player.name}, seçmelerdeki performansıyla ${Game.club().name} altyapısına katıldı! ${s.youth.group} takımında sezon başlıyor.` : `${s.player.name}, scout sayesinde ${Game.club().name} altyapısına katıldı! ${s.youth.group} takımında sezon başlıyor.`, 'good');
      Social.post('transfer', `Artık ${Game.club().name} altyapısındayım! Hayalim gerçek oluyor.`, 1.5);
      Game.save();
      Game.tab = 'home';
      Game.render();
    }));
  },

  blankSeason() { return { apps: 0, goals: 0, assists: 0, ratingSum: 0, motm: 0, minutes: 0 }; },

  enterHub() {
    const st = Game.state;
    if (st && st.world && World.ensureLeagues(st.world, st.season.year, st.season.round)) Game.save();
    Game.show('hub');
    Game.tab = 'home';
    Game.render();
    Game.checkPending();
    // yeni kariyerde hoş geldin penceresiyle çakışmasın; günlük ödül sonraki girişte
    if (typeof Daily !== 'undefined' && !Game._fresh) setTimeout(() => { if (Game.state && !document.getElementById('hub').classList.contains('hidden')) Daily.check(); }, 450);
    Game._fresh = false;
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
    p.injAdUsed = false;
    Player.addMorale(p, -6);
    Game.news(`🤕 ${where} sakatlandın. ${weeks} hafta sahalardan uzak kalacaksın.`, 'bad');
    Game.toast(`🤕 Sakatlandın! (${weeks} hafta)`, 'bad');
    // İpucu: mağazadaki fizyoterapi seansı sakatlığı kısaltır
    setTimeout(() => Game.toast('Yaşam › Mağaza\'dan Fizyoterapi Seansı alırsan sakatlığın 2 hafta kısalır.', 'info'), 900);
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
    return LEAGUE_DIFF[lg] != null ? LEAGUE_DIFF[lg] : 0.52;
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
    if (p.injuryWeeks > 0 || Life.banned()) {
      ctx.role = 'out';
      Game.toast(Life.banned() ? 'FIFA cezalı olduğun için bu maçta oynayamıyorsun.' : 'Sakat olduğun için bu maçta oynayamıyorsun.', 'bad');
    } else {
      ctx.role = Game.roleFor(ovr, Game.teamRating(s.clubId), youth);
      ctx.subChance = youth ? 0.85 : 0.6;
    }
    if (typeof Big !== 'undefined') await Big.prepare(ctx);
    const sum = await Match.run(ctx, s);
    Game.applyMatch(sum, ctx, 'league');
    // ligin geri kalanı
    const lg = Game.league();
    World.record(lg, fx.home, fx.away, sum.hs, sum.as);
    lg.results.push({ round: s.season.round, h: fx.home, a: fx.away, hs: sum.hs, as: sum.as });
    const ownId = s.clubId, oppId = ctx.side === 'home' ? fx.away : fx.home;
    sum.ownScorers.forEach((n) => World.addScorer(lg, n, ownId));
    sum.oppScorers.forEach((n) => World.addScorer(lg, n, oppId));
    // asistler: oyuncunun kendi asistleri + takım arkadaşlarının asistleri
    const meName = Player.fullName(s.player);
    for (let i = 0; i < (sum.assists || 0); i++) World.addAssist(lg, meName, ownId);
    const ownRoster = youth ? s.youth.rosters[ownId] : s.world.clubs[ownId].roster;
    const oppRoster = youth ? s.youth.rosters[oppId] : s.world.clubs[oppId].roster;
    sum.ownScorers.slice(sum.assists || 0).forEach((n) => { if (U.chance(0.65)) { const a = World.pickAssister(ownRoster.concat(n === meName ? [] : [{ n: meName, pos: s.player.position, r: Player.overall(s.player) }]), n); if (a) World.addAssist(lg, a.n, ownId); } });
    sum.oppScorers.forEach((n) => { if (U.chance(0.7)) { const a = World.pickAssister(oppRoster, n); if (a) World.addAssist(lg, a.n, oppId); } });
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
      levelBase: Game.levelBase(true), lg: 'intl', theme: 'intl',
    };
    ctx.role = p.injuryWeeks > 0 ? 'out' : Game.roleFor(Player.overall(p, true), nat.rating, false);
    if (ctx.role === 'out' && p.injuryWeeks === 0) ctx.role = 'bench';
    ctx.subChance = 0.7;
    const sum = await Match.run(ctx, s);
    s.pendingIntl = null;
    // milli maç sonucu sıralamaya yansır
    { const gf = ctx.side === 'home' ? sum.hs : sum.as, ga = ctx.side === 'home' ? sum.as : sum.hs; const d = gf > ga ? 12 : gf < ga ? -8 : 3; Nations.add(s, nat.code, d); Nations.add(s, oppNat.code, -d); }
    Game.applyMatch(sum, ctx, 'intl');
    Game.advanceWeek(true);
  },

  applyMatch(sum, ctx, comp) {
    const s = Game.state, p = s.player;
    const youth = Game.isYouth() && comp !== 'intl';
    const lg = LEAGUES.find((l) => l.id === Game.club().league);
    const fameMult = (comp === 'intl' ? 2 : youth ? 0.15 : comp === 'cup' ? lg.fame * 1.6 : lg.fame) * (ctx.derby || ctx.final ? 1.5 : 1);
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
      const wb = Player.wearBoot(p);
      if (wb && wb.gone) Game.news(`${wb.gone.name} eskidi ve artık giyilemiyor. Mağazadan yenisini alabilirsin.`, 'bad');
      else if (wb && wb.warn) Game.news(`${wb.warn.name} için son 5 maç: krampon yıpranmaya başladı.`, '');

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
      if (bonus > 0) Game.news(`Maç primi: ${U.money(bonus)}`, 'me');
    } else {
      Player.addMorale(p, -3);
      if (p.injuryWeeks === 0) Player.addRel(p, 'coach', 0.5);
      Game.news(`${teamTxt}, ${oppName} karşısında ${sum.gf}-${sum.ga} ${resTxt}. (Forma giymedin)`, sum.res === 'W' ? 'good' : sum.res === 'L' ? 'bad' : '');
    }
    // derbi, basın toplantısı sözleri ve son dakika golü
    if (ctx.derby && sum.res === 'W') { Player.addRel(p, 'fans', 4); Game.news(`🔥 ${ctx.derby} bizim! Şehir bu gece senin adını konuşuyor.`, 'good'); }
    else if (ctx.derby && sum.res === 'L') { Player.addMorale(p, -4); Game.news(`${ctx.derby} kaybedildi. Taraftar öfkeli.`, 'bad'); }
    if (ctx.pressBold && sum.played) {
      if (sum.res === 'W') { Player.addFame(p, 1); Game.news('🎙️ Basın toplantısındaki iddialı sözlerinin arkasında durdun!', 'good'); }
      else if (sum.res === 'L') { Player.addRel(p, 'fans', -6); Game.news('🎙️ Maç öncesi iddialı sözlerin ters tepti, taraftar tepkili.', 'bad'); }
    }
    if (sum.lateGoal && sum.played) {
      Player.addFame(p, 1.2 * (lg ? lg.fame : 1)); Player.addRel(p, 'fans', 5);
      p.flags = p.flags || {}; p.flags.lateGoal = (p.flags.lateGoal || 0) + 1;
      Game.news(`⏱️ SON DAKİKA! ${Player.fullName(p)} maçın son anlarında sahneye çıktı!`, 'good');
      Social.post('goal', 'Son dakika! Bu his paha biçilemez.', 1.6);
    }
    if (typeof Missions !== 'undefined') Missions.afterMatch(sum);
    Social.afterMatch(sum, teamTxt);
    if (comp !== 'intl') Captain.afterMatch(sum.played);
    const so1 = Social.ensure(p);
    if (!sum.played) why.push(p.injuryWeeks ? 'Sakatlık nedeniyle oynamadın' : 'Forma giymedin');
    s.lastReport = {
      w: `${s.season.year} H${s.season.round + 1}`, opp: oppName, team: teamTxt, gf: sum.gf, ga: sum.ga, res: sum.res, rating: sum.played ? sum.rating : null,
      goals: sum.goals, assists: sum.assists, motm: sum.motm,
      fol0: before.fol,
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

    if (!intl && typeof Life !== 'undefined') Life.week(s);
    if (!intl) {
      const r = s.season.round;
      // milli takım
      if (Game.intlWeeks().includes(r)) Game.checkCallup();
      Game.transferWeek(r);
      if (!Game.inStreet()) Cups.week(s, r);
      if (r === Math.floor(Game.rounds() / 2)) setTimeout(() => Game.seasonAd('midSeason'), 400);
      if (r >= Game.rounds()) {
        Game.save();
        return Game.endSeason();
      }
    }
    if (!s.pendingEvent && U.chance(0.2)) Events.roll();
    Social.week();
    // maç raporundaki takipçi farkı, haftalık değişim dahil gerçek farkı göstersin
    if (s.lastReport && s.lastReport.fol0 != null && !s.lastReport.folDone) { s.lastReport.d.fol = Social.ensure(p).followers - s.lastReport.fol0; s.lastReport.folDone = true; }
    if (!intl && U.chance(0.7)) WorldNews.roll();
    if (!intl && !Game.inStreet()) WorldNews.starStory();
    Ach.check();
    Game.save();
    Game.render();
    Game.checkPending();
  },

  // Oynayabileceği milli takımlar (anne-baba memleketi; ilk resmi davetten sonra kilitlenir)
  eligibleNats() {
    const p = Game.p;
    if (p.natLocked || !p.parents || p.parents.f === p.parents.m) return [p.nation];
    return [p.parents.f, p.parents.m];
  },

  checkCallup() {
    const s = Game.state, p = s.player;
    const ovr = Player.overall(p, true);
    if (p.age < 17 || p.injuryWeeks > 0 || Life.banned()) return;
    const needOf = (n) => n.rating - 7 - (p.fame > 40 ? 2 : 0);
    const want = Game.eligibleNats().map((c) => Game.nat(c)).filter((n) => n && ovr >= needOf(n));
    if (!want.length) return;
    const call = (code) => {
      p.nation = code; p.natLocked = true;
      Game.callup(code);
      Game.save(); Game.render();
    };
    if (!p.natLocked && Game.eligibleNats().length > 1) {
      // iki ülkeden de davet: seçim kalıcıdır
      const btns = want.map((n) => ({ t: `${n.name} formasını seç`, fn: () => call(n.code) }));
      btns.push({ t: 'Şimdilik bekle', cls: 'btn-ghost', fn: () => Game.news('Milli takım davetini şimdilik bekletiyorsun.', '') });
      Game.modal(`<div class="ev-tag">Milli Takım Daveti</div><h3>${want.length > 1 ? 'İki ülke de seni istiyor!' : `${want[0].name} seni çağırdı`}</h3><p>${want.length > 1 ? `Hem baba memleketin ${U.esc(Game.nat(p.parents.f).name)} hem anne memleketin ${U.esc(Game.nat(p.parents.m).name)} milli takımı seni kadroya davet etti.` : `Anne-baba memleketlerinden ${U.esc(want[0].name)} seni kadroya çağırdı.`} Bir ülkeyi seçersen artık diğeri için oynayamazsın.</p>`, btns);
      return;
    }
    Game.callup(want[0].code);
  },

  callup(code) {
    const s = Game.state, p = s.player;
    const nat = Game.nat(code);
    {
      const opp = U.pick(Game.nations().filter((n) => n.code !== nat.code));
      s.pendingIntl = opp.code;
      Game.news(`${nat.flag} MİLLİ TAKIMA ÇAĞRILDIN! ${opp.flag} ${opp.name} maçı seni bekliyor.`, 'good');
      Game.toast(`${nat.flag} Milli takıma çağrıldın!`, 'good');
      Player.addMorale(p, 8);
      Player.addFame(p, 1.5);
    }
  },

  makeOffers(n, mandatory, exclude = []) {
    const s = Game.state, p = s.player;
    const ovr = Player.overall(p, true);
    const cur = s.clubId;
    const ok = (c, lo, hi) => {
      if (c.id === cur || exclude.includes(c.id) || !LEAGUES.find((l) => l.id === c.league)) return false;
      const lf = LEAGUES.find((l) => l.id === c.league).fame;
      if (lf > 1.05 && p.fame < 12 && ovr < c.rating - 1) return false;
      return c.rating >= ovr - lo && c.rating <= ovr + hi + p.fame / 15;
    };
    let cands = Object.values(s.world.clubs).filter((c) => ok(c, 10, 5));
    // az aday varsa aralığı genişlet (farklı ülkelerden de teklif gelsin)
    if (cands.length < n * 3) cands = Object.values(s.world.clubs).filter((c) => ok(c, 15, 8));
    if (mandatory && cands.length < 2) {
      cands = Object.values(s.world.clubs).filter((c) => c.id !== cur).sort((a, b) => Math.abs(a.rating - ovr) - Math.abs(b.rating - ovr)).slice(0, 4);
    }
    // aynı ligden en fazla iki teklif; güçlü kulüpler biraz daha olası
    const picks = [];
    const perLg = {};
    U.shuffle(cands).sort((a, b) => (b.rating + U.rand(0, 8)) - (a.rating + U.rand(0, 8))).forEach((c) => {
      if (picks.length >= n || (perLg[c.league] || 0) >= 2) return;
      perLg[c.league] = (perLg[c.league] || 0) + 1;
      picks.push(c);
    });
    picks.sort((a, b) => b.rating - a.rating);
    // bonservis: sözleşmesi biten serbest, altyapıdan çıkan için yetiştirme bedeli
    const val = Game.marketValue(p, ovr);
    const free = mandatory && !Game.isYouth();
    return picks.map((c) => ({
      clubId: c.id,
      wage: Math.round(Game.wageFor(c.rating, ovr) * ((typeof LEAGUE_PAY !== 'undefined' && LEAGUE_PAY[c.league]) || 1) * (1 + Life.mgrQ() * 0.06) / 100) * 100,
      years: U.randi(2, 5),
      fee: free ? 0 : Math.round((Game.isYouth() ? val * U.rand(0.1, 0.2) : val * U.rand(0.85, 1.3) * (1 + (s.contract.years || 0) * 0.05)) / 50000) * 50000,
      feeType: free ? 'free' : Game.isYouth() ? 'youth' : 'fee',
    }));
  },

  // Transfer dönemleri: yaz (sezonun ilk haftaları) ve kış (devre arası)
  tWindow(r) {
    const n = Game.rounds(), mid = Math.floor(n / 2);
    if (r >= 1 && r <= 4) return { id: 'yaz', name: 'Yaz Transfer Dönemi', from: 1, to: 4 };
    if (r >= mid && r <= mid + 3) return { id: 'kis', name: 'Kış Transfer Dönemi', from: mid, to: mid + 3 };
    return null;
  },

  // Formuna göre kaç teklif gelir
  offerCount(lo, hi) {
    const ss = Game.state.season.stats;
    const avg = ss.apps ? ss.ratingSum / ss.apps : 6.6;
    const bonus = avg >= 7.4 ? 2 : avg >= 6.9 ? 1 : avg < 6.2 && ss.apps > 3 ? -1 : 0;
    return U.clamp(U.randi(lo, hi) + bonus + Life.mgrQ(), 0, 6);
  },

  transferWeek(r) {
    const s = Game.state;
    if (Game.isYouth() || Game.inStreet()) return;
    const w = Game.tWindow(r), prev = Game.tWindow(r - 1);
    if (!w) {
      if (prev && s.offers.length) { s.offers = []; Game.news(`${prev.name} kapandı. Bekleyen teklifler geçersiz oldu.`, ''); }
      return;
    }
    if (s.moved && s.moved.y === s.season.year && s.moved.w === w.id) return;
    if (r === w.from) {
      const offers = Game.makeOffers(Game.offerCount(2, 4), false);
      s.offers = offers;
      Game.news(offers.length ? `📨 ${w.name} açıldı! ${offers.length} kulüp seni istiyor. Teklifler ${w.to - r + 1} hafta geçerli.` : `${w.name} açıldı. Şimdilik teklif yok; iyi oynarsan kapı çalınabilir.`, offers.length ? 'good' : '');
    } else if (s.offers.length < 5 && U.chance(0.4)) {
      const more = Game.makeOffers(1, false, s.offers.map((o) => o.clubId));
      if (more.length) { s.offers.push(more[0]); Game.news(`📨 Yeni teklif: ${Game.club(more[0].clubId).name} de transfer yarışına girdi!`, 'good'); }
    }
  },

  acceptOffer(i) {
    const s = Game.state;
    const o = s.offers[i];
    if (!o) return;
    const w = Game.tWindow(s.season.round);
    s.moved = { y: s.season.year, w: w ? w.id : 'x' };
    const old = Game.club().name;
    Game.joinClub(o.clubId, o.wage, o.years);
    Game.recordTransfer(old, o);
    s.offers = [];
    Game.news(`✍️ ${old}'dan ${Game.club().name}'a ${Game.feeText(o)} transfer oldun! Haftalık maaş: ${U.money(o.wage)}`, 'good');
    Social.post('transfer', `Yeni bir sayfa: ${Game.club().name}! Heyecanlıyım.`, 1.8);
    Game.toast(`✍️ ${Game.club().name} ile sözleşme imzaladın!`, 'good');
    Game.save();
    Game.render();
    if (typeof Welcome !== 'undefined') Welcome.show({ club: Game.club(), wage: o.wage, years: o.years, feeText: Game.feeShort(o), number: s.player.shirt });
  },

  // Tören ekranı için kısa bonservis metni
  feeShort(o) {
    if (!o || o.feeType === 'free' || !o.fee) return 'Bonservissiz';
    return `${o.feeType === 'youth' ? 'Yetiştirme bedeli' : 'Bonservis'} ${U.money(o.fee)}`;
  },

  feeText(o) {
    if (!o || o.feeType === 'free' || !o.fee) return 'bonservissiz olarak';
    return `${U.money(o.fee)} ${o.feeType === 'youth' ? 'yetiştirme bedeliyle' : 'bonservis bedeliyle'}`;
  },

  recordTransfer(from, o) {
    const s = Game.state, p = s.player;
    p.transfers = p.transfers || [];
    p.transfers.push({ y: s.season.year, from, to: Game.club(o.clubId).name, fee: o.fee || 0, type: o.feeType || 'fee' });
    if (o.fee) {
      p.best = p.best || {};
      p.best.fee = Math.max(p.best.fee || 0, o.fee);
      if (o.fee >= 20000000) Social.post('transfer', `${U.money(o.fee)}! Bu güvenin karşılığını sahada vereceğim.`, 2.2);
    }
  },

  // Sezon ortasında kulüp değişimi: lig fikstürü farklı olabilir, tur sayısı aynı.
  joinClub(id, wage, years) {
    const s = Game.state, p = s.player;
    s.clubId = id;
    s.contract = { type: 'pro', clubId: id, wage, years };
    p.rel.coach = 50; p.rel.team = 45; p.rel.fans = Math.max(25, p.rel.fans * 0.5);
    Shirt.onJoin();
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
    Nations.season(s);
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
    // sıralama primi ve Avrupa bileti
    const myLid = youth ? null : Game.club().league;
    const europe = youth ? null : Cups.qualifies(myLid, pos);
    let prize = 0;
    if (!youth) {
      const wage = s.contract.wage || 0;
      prize = Math.round((pos === 1 ? 8 : pos === 2 ? 5 : pos === 3 ? 3 : pos <= 6 ? 1.5 : pos <= 10 ? 0.5 : 0) * wage / 100) * 100;
      if (prize) { p.money += prize; Game.news(`Sezonu ${pos}. sırada bitirdik: kulüpten ${U.money(prize)} başarı primi!`, 'good'); }
      if (pos === 2 || pos === 3) Player.addFame(p, pos === 2 ? 1.5 : 0.8);
      if (europe) {
        p.flags = p.flags || {}; p.flags.europe = true;
        Game.news(`${pos}. sıra ile gelecek sezon <b>${europe.name}</b>'na katılma hakkı kazandık!`, 'good');
        Social.post('trophy', `Gelecek sezon ${europe.name}! Bu taraftar bunu hak ediyor.`, 1.6);
      }
    }
    if (trophies.length) Social.post('trophy', `${U.plain(trophies[0])}! Bu kupa hepimizin.`, 2);

    p.history.push({
      year: s.season.year, age: p.age, club: Game.teamName(), league: compName, pos,
      apps: ss.apps, goals: ss.goals, assists: ss.assists, avg: Math.round(avg * 100) / 100, motm: ss.motm, ovr,
      europe: europe ? europe.name : null,
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
        msg.push(`<b>${own.name} sana A takım profesyonel sözleşmesi teklif ediyor!</b>`);
      }
      if (p.age >= 18) {
        mandatory = true;
        offers = Game.makeOffers(U.randi(3, 4), true).map((o) => Object.assign(o, { pro: true }));
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
        offers = Game.makeOffers(Math.max(3, Game.offerCount(2, 4)), true).map((o) => Object.assign(o, { pro: true }));
        msg.push('Sözleşmen sona erdi! Yeni bir sözleşme imzalamalısın.');
      } else {
        offers = Game.makeOffers(Game.offerCount(2, 4), false).map((o) => Object.assign(o, { pro: true }));
        if (offers.length) msg.push(`Sözleşmenin bitmesine ${s.contract.years} yıl var. Gelen teklifleri değerlendirebilirsin.`);
      }
    }
    if (ownOffer) offers.unshift(ownOffer);

    s.seasonEnd = {
      year: s.season.year, pos, compName, stats: ss, avg, trophies, changes, ageBefore, ovrBefore: ovr, ovrAfter, europe: europe ? { id: europe.id, name: europe.name } : null, prize,
      cupWins: p.trophies.filter((t) => t.startsWith(`${s.season.year}:`) && /Kupa|Gelişim|Şampiyonası|Uluslar/.test(t) && !trophies.some((x) => t.endsWith(x))).map((t) => t.split(': ').slice(1).join(': ')),
      offers, mandatory, msg, relegated: rel.down.includes(s.clubId) && !youth, promoted: rel.up.includes(s.clubId) && !youth,
      prevLeague, canRetire: p.age >= 33, forceRetire: p.age >= 40 || (p.age >= 34 && ovrAfter < 50),
    };
    Game.save();
    // lig şampiyonluğunda önce kupa kaldırma töreni
    if (pos === 1 && typeof Celebrate !== 'undefined') Celebrate.champion(`${compName} Şampiyonu`, Game.teamName()).then(() => SeasonEnd.show());
    else SeasonEnd.show();
  },

  startNewSeason(choice) {
    const s = Game.state, p = s.player;
    const se = s.seasonEnd;
    let welcome = null;
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
          const old = Game.club().name;
          Game.joinClub(choice.clubId, choice.wage, choice.years);
          Game.recordTransfer(old, choice);
          welcome = { club: Game.club(), wage: choice.wage, years: choice.years, feeText: Game.feeShort(choice), number: p.shirt };
          s.moved = { y: se.year + 1, w: 'yaz' };
          Social.post('transfer', `Yeni kulübüm ${Game.club().name}. Hedef şampiyonluk!`, 1.8);
          Game.news(`✍️ ${Game.club().name} ile ${choice.years} yıllık profesyonel sözleşme imzaladın (${Game.feeText(choice)})! Haftalık ${U.money(choice.wage)}`, 'good');
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
    s.pendingCup = null; s.cupQueue = null;
    s.tournament = null;
    Cups.setup(s);
    s.ap = 3;
    p.energy = 100;
    Game.save();
    Game.tab = 'home';
    Game.render();
    const shown = welcome && typeof Welcome !== 'undefined' ? Welcome.show(welcome) : Promise.resolve();
    shown.then(() => Game.seasonAd('seasonStart'));
  },

  // Geçiş reklamı: yalnız sezon başında ve sezon ortasında birer kez (kariyerin ilk sezonunda hiç)
  seasonAd(kind) {
    const s = Game.state, A = window.StarfootAds;
    const at = (typeof AD_CONFIG !== 'undefined' && AD_CONFIG.interstitialAt) || {};
    if (!s || !A || typeof A.interstitial !== 'function' || !at[kind] || Game.inStreet()) return Promise.resolve(false);
    if (typeof Premium !== 'undefined' && Premium.active) return Promise.resolve(false);
    if (!at.firstSeason && s.season.year === (s.startYear || s.season.year)) return Promise.resolve(false);
    s.adSeen = s.adSeen && s.adSeen.y === s.season.year ? s.adSeen : { y: s.season.year };
    if (s.adSeen[kind]) return Promise.resolve(false);
    s.adSeen[kind] = true;
    Game.save();
    return Promise.resolve(A.interstitial()).catch(() => false);
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
        <button class="btn btn-big" onclick="Game.toMenu()">Ana Menü</button>
      </div>`;
    UI.strip(el);
    Game.show('end');
  },

  // ---------- Arayüz ----------
  render() {
    const s = Game.state, p = s.player;
    Notifs.badge();
    document.getElementById('hdr-info').innerHTML = `
      <span class="hi-club">${UI.shirt(Game.club())}${U.esc(Game.teamName())}</span>
      <span class="hi-week"><em>${s.season.year}</em><em>HAFTA</em><b>${Math.min(s.season.round + 1, Game.rounds())}<small>/${Game.rounds()}</small></b></span>
      <span class="hi-money"><i class="hm-coin">${Icon('coin')}</i><span class="hm-t"><small>Bakiye</small><b>${U.money(p.money)}</b></span>${Game.weeklyIncome() > 0 ? `<em class="hm-inc">+${U.money(Game.weeklyIncome())}<small>/hf</small></em>` : ''}</span>`;
    // eski sekme adları yeni yapıya taşınır
    const alias = { player: 'profile', career: 'profile', world: 'league', shop: 'life' };
    if (alias[Game.tab]) {
      if (Game.tab === 'world') UI.lgView = 'world';
      if (Game.tab === 'shop') UI.lifeView = 'shop';
      if (Game.tab === 'career') UI.profView = 'career';
      if (Game.tab === 'player') UI.profView = 'profile';
      Game.tab = alias[Game.tab];
    }
    U.$$('#tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === Game.tab));
    const lt = document.querySelector('#tabs [data-tab="life"]');
    if (lt) lt.classList.toggle('badge', !!(p.life && p.life.offers && p.life.offers.length));
    document.getElementById('status').innerHTML = UI.status();
    document.getElementById('side').innerHTML = Game.tab === 'profile' ? '' : UI.playerCard();
    const main = document.getElementById('main');
    main.innerHTML = UI[Game.tab]();
    UI.drawFigure();
    Social.drawAvatar();
    UI.paintPaper();
    UI.strip(main);
    UI.bind(main);
  },
};

// ---------- Ekranlar ----------
const UI = {
  // Uzun listeler sayfa içinde ayrı kaydırma yerine aç/kapa ile gösterilir
  more: {},
  // Kariyer tablosu için devam eden sezonun satırı
  liveSeason() {
    const s = Game.state, p = s.player;
    if (Game.inStreet()) return null;
    const ss = s.season.stats;
    const lg = Game.league();
    const pos = lg ? World.sortedTable(lg).findIndex((r) => r.id === s.clubId) + 1 : 0;
    return { live: true, year: s.season.year, age: p.age, club: Game.teamName(), league: Game.leagueName(), pos, apps: ss.apps, goals: ss.goals, assists: ss.assists, avg: ss.apps ? ss.ratingSum / ss.apps : 0, ovr: Player.overall(p) };
  },

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
  // Kişisel bildirimler (prim, bahis, kumarhane, sponsor bitişi): gazeteden ayrı
  inbox() {
    const s = Game.state;
    const me = s.news.filter((n) => n.type === 'me').slice(0, 5);
    if (!me.length) return '';
    return `<section class="card inbox"><div class="card-h"><span>${Icon('wallet')} Bildirimler</span></div>
      <ul>${me.map((n) => `<li><span>${U.esc(U.plain(n.t))}</span><small>${n.w || ''}</small></li>`).join('')}</ul></section>`;
  },

  paper() {
    const s = Game.state;
    const items = s.news.filter((n) => n.type !== 'me' && !/Maç primi/.test(n.t));
    if (!items.length) return '';
    const kicker = (n) => (n.star ? 'Yıldızlar' : n.type === 'world' ? (/Magazin/.test(n.t) ? 'Magazin' : 'Dünya') : /transfer|imza|sözleşme/i.test(n.t) ? 'Transfer' : /madalya|kupa|Şampiyon|ödül/i.test(n.t) ? 'Ödül' : /FIFA|ceza/i.test(n.t) ? 'Son Dakika' : /karşısında|kazandı|kaybetti|berabere/.test(n.t) ? 'Maç' : n.type === 'bad' ? 'Gündem' : 'Kulüp');
    const big = /ŞAMPİYON|Şampiyon|transfer oldun|MİLLİ TAKIMA|Hat-trick|FIFA|evlendi|sözleşme imzaladın/;
    const top = items.slice(0, 8);
    const lead = top.find((n) => n.type !== 'world' && big.test(n.t)) || top.find((n) => n.star) || items[0];
    const rest = items.filter((n) => n !== lead).slice(0, UI.more.news ? 30 : 6);
    const clean = (t) => U.plain(t.replace(/<[^>]+>/g, ''));
    const split = (t) => {
      const plain = I18N.t(clean(t));
      const cut = plain.search(/[.!?:](\s|$)/);
      return cut > 14 && cut < 95 ? [plain.slice(0, cut + 1), plain.slice(cut + 1).trim()] : [plain, ''];
    };
    const [h1, sub] = split(lead.t);
    UI.paperLead = lead;
    const no = (s.season.year - (s.startYear || s.season.year)) * 40 + s.season.round + 1;
    // kısa kısa: kendi liginin son hafta sonuçları
    const lg = Game.isYouth() || Game.inStreet() ? null : Game.league();
    const lastR = lg ? Math.max(0, ...lg.results.map((r) => r.round)) : 0;
    const briefs = lg ? lg.results.filter((r) => r.round === lastR).slice(0, 7) : [];
    const sn = (id) => U.esc((s.world.clubs[id] || {}).short || id);
    const tbl = lg ? World.sortedTable(lg).slice(0, 5) : [];
    const sc = lg ? World.topScorers(lg, 1)[0] : null;
    const cap = lead.star ? `${lead.star.n} · ${(s.world.clubs[lead.star.club] || {}).name || ''}` : Player.fullName(s.player);
    return `<section class="card paper">
      <div class="pp-mast">
        <div class="pp-top"><span>${s.season.year} · ${Math.min(s.season.round + 1, Game.rounds())}. Hafta</span><span>Sayı ${no}</span></div>
        <h2>StarFoot Gazetesi</h2>
        <div class="pp-sub">Futbolun nabzı · Kulüpten dünyaya</div>
      </div>
      <div class="pp-front">
        <article class="pp-lead">
          <figure class="pp-fig"><canvas class="pp-photo" aria-hidden="true"></canvas><figcaption>${U.esc(cap)} · Foto: StarFoot Ajans</figcaption></figure>
          <span class="pp-k">${kicker(lead)}</span><h3>${U.esc(h1)}</h3>${sub ? `<p>${U.esc(sub)}</p>` : ''}<small>${lead.w || ''}</small>
        </article>
        ${lg ? `<aside class="pp-side">
          ${briefs.length ? `<div class="pp-box"><h4>Kısa Kısa · ${lastR + 1}. Hafta</h4><ul>${briefs.map((r) => `<li><span>${sn(r.h)}</span><b>${r.hs}-${r.as}</b><span>${sn(r.a)}</span></li>`).join('')}</ul></div>` : ''}
          <div class="pp-box"><h4>Zirve</h4><ol>${tbl.map((r) => `<li class="${r.id === s.clubId ? 'me' : ''}"><span>${sn(r.id)}</span><b>${r.pts}</b></li>`).join('')}</ol>${sc ? `<p class="pp-sc">Gol kralı: <b>${U.esc(sc.name)}</b> (${sc.g})</p>` : ''}</div>
        </aside>` : ''}
      </div>
      <div class="pp-cols">${rest.map((n) => { const [a, b] = split(n.t); return `<article class="pp-item ${n.type}"><span class="pp-k">${kicker(n)}</span><h5>${U.esc(a)}</h5>${b ? `<p>${U.esc(b)}</p>` : ''}<small>${n.type === 'world' ? 'StarFoot Dünya Servisi' : n.w || ''}</small></article>`; }).join('')}</div>
      ${items.length > 7 ? UI.moreBtn('news', 'Tüm haberler') : ''}
    </section>`;
  },

  // Manşet fotoğrafı (yıldız haberi ya da senin haberin)
  paintPaper() {
    const cv = document.querySelector('.pp-photo');
    const lead = UI.paperLead;
    if (!cv || !lead || typeof SocialArt === 'undefined') return;
    const s = Game.state;
    let hsh = 0; for (const ch of lead.t) hsh = (hsh * 31 + ch.charCodeAt(0)) >>> 0;
    let post;
    if (lead.star) {
      const c = s.world.clubs[lead.star.club] || Game.club();
      let ls = 0; for (const ch of lead.star.n) ls = (ls * 31 + ch.charCodeAt(0)) % 9973;
      const scene = /kaybetti|kayıp|açamadı|kurtaramadı/.test(lead.t) ? 'europe' : 'goal';
      post = { id: 'np' + hsh, seed: hsh, kind: 'goal', scene, cid: c.id, c1: c.c1, c2: c.c2, short: c.short, num: 7 + (ls % 5), lookSeed: ls + 1 };
    } else {
      const c = Game.club() || { c1: '#c8102e', c2: '#fff', short: '' };
      const scene = /ŞAMPİYON|Şampiyon/.test(lead.t) ? 'trophy' : /transfer|imza/i.test(lead.t) ? 'transfer' : /MİLLİ/.test(lead.t) ? 'camp' : /FIFA|ceza/.test(lead.t) ? 'studio' : 'goal';
      post = { id: 'np' + hsh, seed: hsh, kind: 'goal', scene, cid: c.id, c1: c.c1, c2: c.c2, short: c.short, num: s.player.shirt };
    }
    const img = SocialArt.get(post);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = cv.clientWidth || 300, h = Math.round(w * 0.62);
    cv.width = w * dpr; cv.height = h * dpr;
    const sy = SocialArt.H * 0.12, shh = SocialArt.W * 0.62;
    const g = cv.getContext('2d');
    g.filter = 'grayscale(0.35) contrast(1.05)';
    g.drawImage(img, 0, sy, SocialArt.W, shh, 0, 0, cv.width, cv.height);
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

  // Sakatken: fizyoterapi önerisi ve tek dokunuşla satın alma
  physioTip() {
    const p = Game.p;
    if (!p.injuryWeeks || typeof CONSUMABLES === 'undefined') return '';
    const c = CONSUMABLES.find((x) => x.id === 'physio');
    if (!c || !Shop.available(c)) return '';
    const used = Shop.usedThisSeason(c), price = Shop.price(c);
    return `<div class="physio-tip">${Icon('injury')}<span><b>Sakatsın · ${p.injuryWeeks} hafta</b><small>Fizyoterapi Seansı sakatlığı 2 hafta kısaltır.</small></span>
      ${used ? '<em>Bu sezon kullandın</em>' : `<button class="btn btn-buy" data-physio ${p.money < price ? 'disabled' : ''}>${U.money(price)}</button>`}</div>`;
  },

  // Ödüllü reklam: sakatlığı 1 hafta kısalt (her sakatlıkta bir kez)
  adInjury() {
    const p = Game.p;
    if (!p.injuryWeeks || p.injAdUsed || Game.inStreet()) return '';
    return `<button class="ad-energy" data-adreward="injury">${Icon('play')}<span><b>${typeof Premium !== 'undefined' ? Premium.lbl() : 'Reklam izle'} · Sakatlık −1 hafta</b><small>Her sakatlıkta bir kez</small></span></button>`;
  },

  // Ödüllü reklam: aksiyon hakkı bitince +1 hak (haftada bir)
  adAp() {
    const s = Game.state;
    if (s.ap > 0 || Game.inStreet() || s.adAp === `${s.season.year}-${s.season.round}`) return '';
    return `<button class="ad-energy" data-adreward="ap">${Icon('play')}<span><b>${typeof Premium !== 'undefined' ? Premium.lbl() : 'Reklam izle'} · +1 aksiyon hakkı</b><small>Haftada bir kez</small></span></button>`;
  },

  // Haftada bir: reklam izle, enerji kazan
  adEnergy() {
    const s = Game.state, p = s.player;
    const wk = `${s.season.year}-${s.season.round}`;
    if (Game.inStreet() || p.energy >= 85 || s.adEnergy === wk) return '';
    const v = (typeof AD_CONFIG !== 'undefined' && AD_CONFIG.energyReward) || 25;
    return `<button class="ad-energy" data-adenergy>${Icon('play')}<span><b>${typeof Premium !== 'undefined' ? Premium.lbl() : 'Reklam izle'} · +${v} enerji</b><small>Haftada bir kez</small></span></button>`;
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

  player() { return UI.playerCard() + UI.celebCard() + Social.render(true); },

  // Profil: oyuncu kartı, sosyal medya ve kariyer tek sekmede
  profile() {
    const nav = UI.viewNav('profView', [['profile', 'star', 'Profil'], ['career', 'career', 'Kariyer'], ['settings', 'cog', 'Ayarlar']]);
    const v = UI.profView || 'profile';
    return nav + (v === 'career' ? UI.career() : v === 'settings' ? UI.settings() : UI.player());
  },

  // Yaşam: aile, ilişkiler, menajer, sponsorlar, gece hayatı ve mağaza
  life() {
    const nav = UI.viewNav('lifeView', [['life', 'heart', 'Yaşam'], ['shop', 'shop', 'Mağaza']]);
    return nav + ((UI.lifeView || 'life') === 'shop' ? UI.shop() : Life.screen());
  },

  // Gol sevinci seçimi: kariyer golleriyle yenileri açılır
  celebCard() {
    const p = Game.p, cur = p.celeb || 'arms';
    return `<section class="card celeb">
      <div class="card-h"><span>${Icon('fire')} Gol Sevincin</span><small class="muted">${p.totals.goals} kariyer golü</small></div>
      <div class="cb-grid">${CELEBRATIONS.concat([{ id: 'random', name: 'Rastgele', desc: 'Açık sevinçlerden biri', goals: 0 }]).map((c) => {
        const lock = p.totals.goals < c.goals;
        return `<button class="cb ${cur === c.id ? 'on' : ''} ${lock ? 'lock' : ''}" data-celeb="${c.id}" ${lock ? 'disabled' : ''}><b>${c.name}</b><small>${lock ? `${c.goals} golde açılır` : c.desc}</small></button>`;
      }).join('')}</div>
    </section>`;
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
    if (s.pendingCup && s.cups && s.cups[s.pendingCup] && Cups.opponent(s, s.cups[s.pendingCup])) {
      const cup = s.cups[s.pendingCup];
      const op = Cups.opponent(s, cup);
      const opp = op.opp;
      const lp = cup.fmt === 'swiss' && cup.phase === 'league';
      next = `<div class="nm-vs"><div class="nm-team">${UI.shirt(Game.club(), 'big')}<b>${U.esc(Game.club().name)}${cup.youth ? ' U19' : ''}</b></div><span class="vs">VS</span><div class="nm-team">${UI.shirt(Game.club(opp), 'big')}<b>${U.esc(Game.club(opp).name)}${cup.youth ? ' U19' : ''}</b></div></div>
        <div class="nm-meta">${U.esc(cup.name.toLocaleUpperCase('tr'))} · ${U.esc(op.stage.toLocaleUpperCase('tr'))} · ${lp ? 'Puan tablosu için oynanır' : 'Tek maç, kaybeden elenir'}</div>`;
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
    } else if (fx && !next) {
      const opp = fx.home === s.clubId ? fx.away : fx.home;
      const oppC = Game.club(opp);
      const tbl = World.sortedTable(Game.league());
      const oppPos = tbl.findIndex((r) => r.id === opp) + 1;
      const star = !Game.isYouth() && (oppC.roster.find((x) => x.star) || null);
      next = `<div class="nm-vs">${crest(Game.teamName(fx.home), Game.club(fx.home))}<span class="vs">VS</span>${crest(Game.teamName(fx.away), Game.club(fx.away))}</div>
        <div class="nm-meta">${U.esc(Game.leagueName())} · ${s.season.round + 1}. HAFTA · ${fx.home === s.clubId ? 'İÇ SAHA' : 'DEPLASMAN'}</div>
        <div class="nm-meta">Rakip ${oppPos}. sırada · Güç ${Game.teamRating(opp)} / Senin takımın ${Game.teamRating(s.clubId)}${star ? ` · Yıldızı: ${U.esc(star.n)}` : ''}</div>`;
    }
    let nTheme = null;
    if (s.pendingIntl) nTheme = CompTheme.get('intl', p.nation);
    else if (s.pendingCup && s.cups && s.cups[s.pendingCup]) { const c = s.cups[s.pendingCup]; nTheme = CompTheme.get(c.youth ? 'ygl' : c.dom ? 'dom' : c.id); }
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
        <section class="card next ${CompTheme.cls(nTheme)}" style="${CompTheme.vars(nTheme)}">
          <div class="card-h"><span>${Icon('whistle')} Maç Günü</span><span class="tag role-${roleK}">${role}</span></div>
          ${nTheme ? `<div class="ct-badge">${nTheme.fx === 'stars' ? '<i class="ct-star"></i>' : ''}${U.esc(nTheme.l)}</div>` : ''}
          ${next}
          ${p.energy < 40 ? `<div class="warn">${Icon('bolt')} Enerjin düşük. Performansın düşer, sakatlık riski artar.</div>` : ''}
          ${UI.physioTip()}
          ${UI.adInjury()}
          <button class="btn btn-play" data-go="match">${Icon('play')} ${Game.inStreet() && s.street.trials ? 'Seçmelere Katıl' : 'Maça Çık'}</button>
          ${s.ap > 0 ? `<div class="hint">Bu hafta ${s.ap} aksiyon hakkın daha var.</div>` : ''}
        </section>
        ${typeof Missions !== 'undefined' ? Missions.card() : ''}
        <section class="card plan">
          <div class="card-h"><span>${Icon('train')} Haftalık Plan</span><span class="ap-pips ${s.ap ? '' : 'done'}" title="Aksiyon hakkı">${[0, 1, 2].map((i) => `<i class="${i < s.ap ? 'on' : ''}"></i>`).join('')}<b>${s.ap ? `${s.ap} hak` : 'Maç günü'}</b></span></div>
          ${UI.adAp()}
          ${UI.adEnergy()}
          <div class="lbl">Antrenman odağı <small>${keyTxt}</small></div>
          <div class="focus" role="radiogroup" aria-label="Antrenman odağı">${STATS.map((st) => {
            const v = p.stats[st.k];
            const key = (POSITIONS[p.position].w[st.k] || 0) >= 0.12;
            return `<button class="fc ${s.trainFocus === st.k ? 'on' : ''} ${key ? 'key' : ''}" data-focus="${st.k}" role="radio" aria-checked="${s.trainFocus === st.k}">
              <span>${st.l}${key ? '<i>★</i>' : ''}</span><b class="${UI.statColor(v)}">${Math.floor(v)}</b>${UI.bar(v, UI.statColor(v))}
            </button>`;
          }).join('')}</div>
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
      ${typeof Life !== 'undefined' ? Life.homeCard() : ''}
      ${s.offers.length ? `
      <section class="card">
        <div class="card-h"><span>${Icon('mail')} Transfer Teklifleri</span>${Game.tWindow(s.season.round) ? `<span class="tw-tag">${Game.tWindow(s.season.round).name} · ${Game.tWindow(s.season.round).to - s.season.round + 1} hafta kaldı</span>` : ''}</div>
        <div class="offers">${s.offers.map((o, i) => UI.offerRow(o, i, 'mid')).join('')}</div>
        <button class="btn btn-ghost" data-reject="1">Teklifleri Reddet</button>
      </section>` : ''}
      ${Social.render(false)}
      ${UI.inbox()}
${UI.paper()}`;
  },

  offerRow(o, i, ctx) {
    const st = Game.state, p = st.player;
    const c = Game.club(o.clubId);
    const lg = LEAGUES.find((l) => l.id === c.league) || { name: '', flag: '' };
    const ovr = Player.overall(p, true);
    const role = Game.roleFor(ovr, c.rating, false, true);
    const roleL = { starter: 'İlk 11 adayı', bench: 'Rotasyon oyuncusu', out: 'Yedek, şans bekler' }[role];
    const tbl = st.world.leagues[c.league] ? World.sortedTable(st.world.leagues[c.league]) : [];
    const pos = tbl.findIndex((r) => r.id === c.id) + 1;
    const eu = pos ? Cups.qualifies(c.league, pos) : null;
    const curWage = st.contract && st.contract.wage ? st.contract.wage : 0;
    const diff = !o.youth && curWage ? Math.round(((o.wage - curWage) / curWage) * 100) : null;
    const bar = (v) => `<i style="width:${U.clamp(v, 0, 99)}%"></i>`;
    return `<div class="ofc ${o.own ? 'own' : ''}" style="--c1:${c.c1};--c2:${c.c2}">
      <div class="ofc-band"></div>
      <div class="ofc-head">
        ${UI.shirt(c, 'big')}
        <div class="ofc-id"><b>${U.esc(c.name)}</b><small>${U.esc(lg.name)}${pos ? ` · ${pos}. sırada` : ''}</small>
          ${o.own ? '<span class="ofc-tag">Mevcut kulübün</span>' : eu ? `<span class="ofc-tag eu z-${eu.id}">${U.esc(eu.name.replace('Avrupa ', ''))} yolunda</span>` : ''}</div>
      </div>
      <div class="ofc-bars">
        <div><span>Kulüp gücü</span><em>${bar(c.rating)}</em><b>${c.rating}</b></div>
        <div><span>Senin gücün</span><em class="me">${bar(ovr)}</em><b>${ovr}</b></div>
      </div>
      <div class="ofc-terms">
        ${o.youth ? '<div><span>Teklif</span><b>Altyapı transferi</b></div><div><span>Tesisler</span><b>Daha iyi</b></div>' : `<div><span>Haftalık maaş</span><b>${U.money(o.wage)}</b>${diff != null ? `<small class="${diff >= 0 ? 'up' : 'down'}">${diff >= 0 ? '+' : ''}${diff}%</small>` : ''}</div><div><span>Süre</span><b>${o.years} yıl</b></div>`}
        ${!o.own && !o.youth && o.feeType ? `<div class="ofc-fee ${o.feeType}"><span>${o.feeType === 'free' ? 'Bonservis' : o.feeType === 'youth' ? 'Yetiştirme bedeli' : 'Bonservis bedeli'}</span><b>${o.feeType === 'free' ? 'Serbest' : U.money(o.fee)}</b></div>` : ''}
        <div><span>Rolün</span><b class="role-${role}">${roleL}</b></div>
      </div>
      <button class="btn btn-big ofc-btn" data-offer="${i}" data-ctx="${ctx}">${o.own ? 'Sözleşmeyi İmzala' : 'Teklifi Kabul Et'}</button>
    </div>`;
  },

  league() {
    const s = Game.state;
    const nav = UI.viewNav('lgView', [['table', 'table', 'Puan'], ['fix', 'whistle', 'Fikstür'], ['kings', 'ball', 'Krallık'], ['cups', 'career', 'Kupalar'], ['world', 'globe', 'Dünya']]);
    if (UI.lgView === 'world') return nav + UI.world();
    if (Game.inStreet()) return nav.replace(/data-vnav="lgView:(table|fix|kings|cups)"/g, 'disabled') + `<section class="card"><div class="card-h"><span>${Icon('squad')} Henüz bir kulübün yok</span></div><p class="muted">Önce mahalle maçında kendini göster. Scout seni bir altyapıya götürünce takımın ve ligin burada görünecek.</p></section>`;
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
    const myLid = Game.club().league;
    const relegate = !Game.isYouth() && !!LEAGUE_DOWN[myLid];
    const promote = !Game.isYouth() && !!LEAGUE_UP[myLid];
    const euro = (i) => (Game.isYouth() ? null : Cups.qualifies(myLid, i + 1));
    const zone = (i) => {
      if (i === 0) return 'z-champ';
      if (promote && i < 3) return 'z-up';
      if (relegate && i >= tbl.length - 3) return 'z-down';
      const q = euro(i);
      return q ? `z-${q.id}` : '';
    };
    const view = UI.lgView || 'table';
    const zonesUsed = new Set(tbl.map((_, i) => euro(i)).filter(Boolean).map((d) => d.id));
    const nextFx = Game.nextFixture();
    const gap = leader.id === s.clubId ? (tbl[1] ? me.pts - tbl[1].pts : 0) : leader.pts - me.pts;
    const fxFrom = Math.max(0, Math.min(s.season.round - 3, Game.rounds() - 8));
    const cupRows = UI.cupFixtures();
    const fixtures = lg.fixtures.map((round, i) => {
      const f = round.find(([h, a]) => h === s.clubId || a === s.clubId);
      if (!f) return '';
      if (!UI.more.fix && (i < fxFrom || i >= fxFrom + 8)) return '';
      return (cupRows[i] || []).join('') + UI.fxRow(round, i, f, myRes, res, name, clubOf);
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
      ${nav}
      ${view === 'cups' ? Cups.screen(s) : ''}
      ${view === 'kings' ? UI.kings(lg, name, clubOf, Game.leagueName()) : ''}
      ${view === 'table' ? `<section class="card">
        <div class="card-h"><span>${Icon('table')} Puan Durumu</span><small class="lg-legend"><i class="z-champ"></i>Şampiyonluk${zonesUsed.has('ucl') ? '<i class="z-ucl"></i>Şampiyonlar K.' : ''}${zonesUsed.has('uel') ? '<i class="z-uel"></i>Federasyon K.' : ''}${zonesUsed.has('uecl') ? '<i class="z-uecl"></i>Konferans K.' : ''}${zonesUsed.has('csa') ? '<i class="z-csa"></i>G. Amerika K.' : ''}${zonesUsed.has('ccc') ? '<i class="z-ccc"></i>K. Amerika K.' : ''}${zonesUsed.has('acl') ? '<i class="z-acl"></i>Asya K.' : ''}${promote ? '<i class="z-up"></i>Üst lig' : ''}${relegate ? '<i class="z-down"></i>Küme düşme' : ''}</small></div>
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
      </section>` : ''}
      ${view === 'fix' ? `<section class="card"><div class="card-h"><span>${Icon('whistle')} Fikstürün</span><small class="muted">${myRes.length}/${Game.rounds()} oynandı</small></div><div class="fixtures">${fixtures}</div>${UI.moreBtn('fix', 'Tüm fikstür')}</section>` : ''}`;
  },

  // Lig fikstür satırı
  fxRow(round, i, f, myRes, res, name, clubOf) {
    const s = Game.state;
    const r = myRes.find((x) => x.round === i);
    const k = r ? res(r, s.clubId) : null;
    return `<div class="mc ${i === s.season.round ? 'cur' : ''} ${r ? 'played' : ''}">
        <span class="wk">${i + 1}</span>
        <div class="mc-t h"><span class="nm-l">${U.esc(name(f[0]))}</span><span class="nm-s">${U.esc(clubOf(f[0]).short)}</span>${UI.shirt(clubOf(f[0]))}</div>
        <div class="mc-s ${k ? 'r-' + k : ''}">${r ? `${r.hs} - ${r.as}` : i === s.season.round ? (s.pendingCup ? 'SONRA' : 'SIRADA') : '-'}</div>
        <div class="mc-t">${UI.shirt(clubOf(f[1]))}<span class="nm-l">${U.esc(name(f[1]))}</span><span class="nm-s">${U.esc(clubOf(f[1]).short)}</span></div>
      </div>`;
  },

  // Avrupa ve ülke kupası maçların: oynandığı haftanın lig maçından önce gösterilir
  cupFixtures() {
    const s = Game.state, me = s.clubId, out = {};
    if (!s.cups || Game.inStreet()) return out;
    const w = s.world;
    const nm = (cup, id) => (w.clubs[id] ? w.clubs[id].name : id) + (cup.youth ? ' U19' : '');
    const sh = (id) => (w.clubs[id] ? w.clubs[id].short : id);
    const abbr = (cup) => ({ ucl: 'ŞK', uel: 'FK', uecl: 'KK', csa: 'GA', ccc: 'KA', acl: 'AŞ', ygl: 'U19' }[cup.id] || 'KUP');
    Object.values(s.cups).forEach((cup) => {
      if (!!cup.youth !== Game.isYouth() || !Cups.everIn(s, cup)) return;
      const wk = Cups.weeks(Game.rounds(), cup);
      const th = CompTheme.get(cup.youth ? 'ygl' : cup.dom ? 'dom' : cup.id);
      const swiss = cup.fmt === 'swiss', mds = cup.mds || 8;
      // eleme turlarının adları (lig aşamasından sonra)
      const koNames = swiss ? (mds === 8 ? ['Play-off', 'Son 16', 'Çeyrek Final', 'Yarı Final', 'Final'] : ['Çeyrek Final', 'Yarı Final', 'Final']) : null;
      const swissIdx = (st) => (typeof st === 'string' && st.startsWith('md') ? +st.slice(2) - 1 : st === 'po' ? 8 : mds === 8 ? 9 + Math.round(Math.log2(16 / st)) : 6 + Math.round(Math.log2(8 / st)));
      const row = (idx, h, a, score, kls, stage) => {
        const at = wk[idx];
        if (at == null) return;
        const team = (id) => (id ? `<span class="nm-l">${U.esc(nm(cup, id))}</span><span class="nm-s">${U.esc(sh(id))}</span>` : '<span class="nm-l">Kura</span><span class="nm-s">?</span>');
        const shirt = (id) => (id ? UI.shirt(w.clubs[id] || Game.club()) : '<span class="tbd-shirt">?</span>');
        (out[at] = out[at] || []).push(`<div class="mc cupfx ${kls}" style="${CompTheme.vars(th)}">
          <span class="wk ck">${abbr(cup)}</span>
          <div class="mc-t h">${team(h)}${shirt(h)}</div>
          <div class="mc-s ${kls}">${score}</div>
          <div class="mc-t">${shirt(a)}${team(a)}</div>
          <small class="mc-cup">${U.esc(cup.name.replace('Avrupa ', ''))} · ${U.esc(stage)}</small>
        </div>`);
      };
      const mine = cup.log.filter((m) => m.h === me || m.a === me);
      mine.forEach((m, i) => {
        const idx = swiss ? swissIdx(m.stage) : i;
        const gf = m.h === me ? m.hs : m.as, ga = m.h === me ? m.as : m.hs;
        const k = m.w ? (m.w === me ? 'W' : 'L') : gf > ga ? 'W' : gf < ga ? 'L' : 'D';
        const stage = typeof m.stage === 'string' && m.stage.startsWith('md') ? `Lig aşaması ${m.stage.slice(2)}. maç` : m.stage === 'po' ? 'Play-off' : STAGE_NAMES[m.stage] || '';
        row(idx, m.h, m.a, `${m.hs} - ${m.as}${m.pens ? ' (p)' : ''}`, `played r-${k}`, stage);
      });
      if (cup.winner) return;
      const waitR16 = swiss && cup.phase === 'po' && cup.direct.includes(me);
      if (!Cups.inCup(s, cup) && !waitR16) return;
      const cur = s.pendingCup === cup.id;
      let from;
      if (waitR16) from = cup.stage + 1;
      else if (swiss && cup.phase === 'league') {
        // lig aşamasının kalan bütün maçları baştan belli
        for (let k = cup.md; k < mds; k++) {
          const f = (cup.fx[k] || []).find(([h, a]) => h === me || a === me);
          if (f) row(k, f[0], f[1], cur && k === cup.md ? 'SIRADA' : '-', cur && k === cup.md ? 'cur' : 'next', `Lig aşaması ${k + 1}. maç`);
        }
        from = mds;
      } else {
        const op = Cups.opponent(s, cup);
        if (op) row(cup.stage, op.h, op.a, cur ? 'SIRADA' : '-', cur ? 'cur' : 'next', op.stage);
        from = cup.stage + 1;
      }
      // sonraki eleme turları: rakip henüz belli değil
      for (let idx = from; idx < wk.length; idx++) {
        const stage = swiss ? koNames[idx - mds] : STAGE_NAMES[cup.alive.length >> (idx - cup.stage)];
        if (!stage) continue;
        row(idx, me, null, '-', 'tbd', `${stage} · tur atlarsan`);
      }
    });
    return out;
  },

  // Sekme içi görünüm seçici (premium segment)
  viewNav(key, items) {
    const cur = UI[key] || items[0][0];
    return `<nav class="vnav" role="tablist">${items.map(([k, ic, l]) => `<button role="tab" class="${k === cur ? 'on' : ''}" data-vnav="${key}:${k}">${Icon(ic)}<span>${l}</span></button>`).join('')}</nav>`;
  },

  // Gol ve asist krallığı (tek kart, sekmeli)
  kings(lg, name, clubOf, title) {
    const me = Player.fullName(Game.p);
    const tab = UI.kingTab || 'g';
    const list = tab === 'g' ? World.topScorers(lg, 10) : World.topAssists(lg, 10);
    const unit = tab === 'g' ? 'gol' : 'asist';
    const max = list.length ? list[0].g : 1;
    const lead = list[0];
    return `<section class="card kings">
      <div class="card-h"><span>${Icon(tab === 'g' ? 'ball' : 'boot')} ${tab === 'g' ? 'Gol Krallığı' : 'Asist Krallığı'}</span>
        <div class="seg kseg"><button class="${tab === 'g' ? 'on' : ''}" data-king="g">Gol</button><button class="${tab === 'a' ? 'on' : ''}" data-king="a">Asist</button></div></div>
      <small class="muted">${U.esc(title || '')}</small>
      ${lead ? `<div class="k-lead ${lead.name === me ? 'me' : ''}" style="--c1:${clubOf(lead.club).c1};--c2:${clubOf(lead.club).c2}">
        <div class="k-crown">1</div>${UI.shirt(clubOf(lead.club), 'big')}
        <div class="k-id"><b>${U.esc(lead.name)}</b><small>${U.esc(name(lead.club))}</small></div>
        <div class="k-num"><b>${lead.g}</b><small>${unit}</small></div>
      </div>
      <div class="k-list">${list.slice(1).map((x, i) => `<div class="k-row ${x.name === me ? 'me' : ''}">
        <span class="k-rk r${i + 2}">${i + 2}</span>${UI.shirt(clubOf(x.club))}
        <div class="k-t"><b>${U.esc(x.name)}</b><small>${U.esc(name(x.club))}</small><i class="k-bar"><i style="width:${(x.g / max) * 100}%"></i></i></div>
        <b class="k-v">${x.g}</b></div>`).join('')}</div>` : `<p class="muted">Henüz ${unit} yok.</p>`}
    </section>`;
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
    const top = sorted[0];
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
        ${top ? `<p class="muted sq-note">Takımın en iyisi: <b>${top.me ? `Sen (${U.esc(top.n)})` : U.esc(top.n)}</b> (${top.r})${top.star ? ' · yıldız oyuncu' : ''}</p>` : ''}
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
      ['boots', 'boot', 'Kramponlar', 'Tek krampon giyilir (en iyisi) · 30-40 maçta eskir'],
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
      const list = ITEMS.filter((i) => i.cat === c && (p.items.includes(i.id) || (p.age >= i.minAge && (!i.maxAge || p.age <= i.maxAge)))).sort((a, b) => a.price - b.price);
      const locked = ITEMS.filter((i) => i.cat === c && i.minAge > p.age && !p.items.includes(i.id)).sort((x, y) => x.minAge - y.minAge).slice(0, 2);
      if (!list.length && !locked.length) return '';
      const owned = list.filter((i) => p.items.includes(i.id)).length;
      const body = (c === 'balls' ? card(null, null, 'Lig Topu', 'Her ligin ve turnuvanın kendi topu', !p.ballSkin ? `<span class="tag own">${Icon('star')} Kullanılıyor</span>` : '<button class="btn btn-ghost btn-buy" data-ball="">Kullan</button>', !p.ballSkin ? 'own' : '', 'tr') : '') + list.map((it) => {
        const own = p.items.includes(it.id);
        let right = own ? `<span class="tag own">${Icon('star')} Sende</span>` : `<button class="btn btn-buy" data-buy="${it.id}" ${p.money < it.price ? 'disabled' : ''}>${U.money(it.price)}</button>`;
        if (own && it.cat === 'boots') {
          const life = Player.bootLife(p, it.id);
          const on = Player.activeBoot(p) === it;
          right = `<span class="tag own ${life <= 5 ? 'warn' : ''}">${on ? Icon('star') + ' Giyiliyor' : 'Yedek'} · ${life} maç</span>`;
        }
        const desc = it.cat === 'boots' && !own ? `${it.desc} · 30-40 maç dayanır` : it.desc;
        if (own && it.skin) right = p.ballSkin === it.skin ? `<span class="tag own">${Icon('star')} Kullanılıyor</span>` : `<button class="btn btn-ghost btn-buy" data-ball="${it.skin}">Kullan</button>`;
        return card(it.art, ShopArt.tierColor(it.price), it.name, desc, right, own ? 'own' : '', it.skin);
      }).join('') + locked.map((it) => card(it.art, '#5d6878', it.name, `${it.minAge} yaşında açılır`, `<span class="tag">${U.money(it.price)}</span>`, 'locked', it.skin)).join('');
      return group(c, ic, t, d, body, `${owned}/${list.length}`);
    }).join('');
    return `${typeof Premium !== 'undefined' ? Premium.card() : ''}
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
          ${Game.inStreet() ? '' : `<div><span>Piyasa Değeri</span><b>${U.money(Game.marketValue(p))}</b></div>`}
          ${p.best && p.best.fee ? `<div><span>Rekor Bonservis</span><b>${U.money(p.best.fee)}</b></div>` : ''}
        </div>
      </div>
      <div class="card">
        <div class="card-h"><span>${Icon('table')} Sezonlar</span></div>
        <div class="seasons">${[UI.liveSeason()].concat(hist).filter(Boolean).map((h) => {
          const tro = p.trophies.filter((t) => t.startsWith(`${h.year}:`)).map((t) => U.plain(t.split(': ').slice(1).join(': ')).replace(/\s*\(\d+\)$/, ''));
          const tr = (p.transfers || []).filter((x) => x.y === h.year);
          return `<div class="sn ${h.live ? 'live' : ''}">
            <div class="sn-y"><b>${h.year}</b><small>${h.age} yaş</small>${h.live ? '<small class="live-dot">canlı</small>' : ''}</div>
            <div class="sn-c"><b>${U.esc(h.club)}</b><small>${U.esc(h.league)}${h.pos ? ` · <em>${h.pos}.</em>` : ''}</small></div>
            <div class="sn-st"><span><b>${h.apps}</b><small>Maç</small></span><span><b>${h.goals}</b><small>Gol</small></span><span><b>${h.assists}</b><small>Asist</small></span><span><b>${h.avg ? h.avg.toFixed(1) : '-'}</b><small>Ort.</small></span><span class="ovr"><b>${h.ovr}</b><small>Güç</small></span></div>
            ${tro.length || h.europe || tr.length ? `<div class="hist-tro">${tro.map((t) => `<span>${U.esc(t)}</span>`).join('')}${h.europe ? `<span class="eu">${U.esc(h.europe)} bileti</span>` : ''}${tr.map((x) => `<span class="tf">${U.esc(x.to)} · ${x.fee ? U.money(x.fee) : 'bonservissiz'}</span>`).join('')}</div>` : ''}
          </div>`;
        }).join('')}</div>
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
`;
  },

  // Profil › Ayarlar: dil, zorluk, oynanış, Premium, gizlilik, oyun yönetimi
  settings() {
    const s = Game.state, p = s.player;
    const row = (label, sub, ctrl) => `<div class="set-row"><span><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</span>${ctrl}</div>`;
    const appVer = (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) ? 'StarFoot 1.0.3' : 'StarFoot (web)';
    return `
      ${typeof Premium !== 'undefined' ? Premium.card() : ''}
      <section class="card settings">
        <div class="card-h"><span>${Icon('cog')} Genel</span></div>
        ${row('Dil / Language', '', `<div class="seg" data-noi18n><button data-setlang="tr" class="${I18N.lang === 'tr' ? 'on' : ''}">Türkçe</button><button lang="en" data-setlang="en" class="${I18N.lang === 'en' ? 'on' : ''}">English</button></div>`)}
        ${row('Zorluk', DIFFS[s.difficulty || 'normal'].d, `<div class="seg">${Object.entries(DIFFS).map(([k, v]) => `<button data-setdiff="${k}" class="${k === (s.difficulty || 'normal') ? 'on' : ''}">${v.l}</button>`).join('')}</div>`)}
      </section>
      <section class="card settings">
        <div class="card-h"><span>${Icon('train')} Oynanış</span></div>
        <label class="drill-tg"><input type="checkbox" id="drill-tg" ${s.drills !== false ? 'checked' : ''}><span><b>Antrenman mini oyunları</b><small>Odak statına göre çalışma oynanır. İyi oynarsan gelişim ×1,5'e kadar çıkar.</small></span></label>
        <label class="drill-tg"><input type="checkbox" id="sfx-tg" ${typeof Sfx !== 'undefined' && Sfx.on ? 'checked' : ''}><span><b>Ses efektleri</b><small>Tribün, düdük, vuruş ve gol sesleri.</small></span></label>
        ${typeof Notify !== 'undefined' && Notify.plugin() ? `<label class="drill-tg"><input type="checkbox" id="notif-tg" ${Notify.on() ? 'checked' : ''}><span><b>Bildirimler</b><small>Günlük ödül ve enerji hatırlatmaları.</small></span></label>` : ''}
        <label class="drill-tg"><input type="checkbox" id="hap-tg" ${typeof Sfx !== 'undefined' && Sfx.hap ? 'checked' : ''}><span><b>Titreşim</b><small>Golde, vuruşta ve kritik anlarda telefon titrer.</small></span></label>
      </section>
      <section class="card settings">
        <div class="card-h"><span>${Icon('shield')} Gizlilik</span></div>
        <div class="set-links">
          ${window.StarfootAds && window.StarfootAds.privacyRequired && window.StarfootAds.privacyRequired() ? `<button class="btn btn-ghost" data-adprivacy>${Icon('shield')} Reklam gizlilik seçenekleri</button>` : ''}
          <a class="btn btn-ghost" href="https://starfoot.vercel.app/privacy.html" target="_blank" rel="noopener">Gizlilik Politikası</a>
          <a class="btn btn-ghost" href="mailto:ardabagce@gmail.com?subject=StarFoot">Destek: ardabagce@gmail.com</a>
        </div>
      </section>
      <section class="card settings">
        <div class="card-h"><span>${Icon('save')} Kariyer</span><small class="muted">Oyun her hafta otomatik kaydedilir</small></div>
        <div class="row-btns">
          <button class="btn btn-ghost" data-sys="menu">${Icon('exit')} Ana Menü</button>
          ${p.age >= 33 ? `<button class="btn btn-ghost" data-sys="retire">${Icon('wave')} Emekli Ol</button>` : ''}
          <button class="btn btn-danger" data-sys="delete">${Icon('trash')} Kariyeri Sil</button>
        </div>
        <p class="set-ver">${appVer}</p>
      </section>`;
  },

  world() {
    const s = Game.state;
    const sel = UI.worldLeague || (s.world.leagues[Game.club().league] ? Game.club().league : 'TR1');
    const lg = s.world.leagues[sel];
    const selL = LEAGUES.find((l) => l.id === sel);
    const name = (id) => s.world.clubs[id].name;
    return `
      ${UI.viewNav('wView', [['league', 'table', 'Ligler'], ['nations', 'shield', 'Milli Takımlar'], ['stars', 'star', 'Yıldızlar']])}
      ${(UI.wView || 'league') === 'league' ? `
      ${UI.leaguePicker(sel)}
      <div class="grid2">
        <div class="card"><div class="card-h"><span>${Icon('table')} Puan Durumu</span><small class="muted">${U.esc(selL.name)}</small></div>${UI.table(World.sortedTable(lg), name, Game.isYouth() ? null : s.clubId)}</div>
        ${UI.kings(lg, name, (id) => s.world.clubs[id], selL.name)}
      </div>` : ''}
      ${UI.wView === 'nations' ? Nations.screen(s) : ''}
      ${UI.wView === 'stars' ? `
      <section class="card">
        <div class="card-h"><span>${Icon('star')} Dönemin Yıldızları</span><small class="muted">${s.season.year}</small></div>
        <div class="scorers">${UI.topPlayers(25).map((x, i) => `<div class="scr ${x.me ? 'me' : ''}"><span class="rk">${i + 1}</span>${UI.shirt(s.world.clubs[x.club] || Game.club())}<div class="scr-t"><b>${U.esc(x.n)}${x.me ? ' (sen)' : ''}</b><small>${U.esc((s.world.clubs[x.club] || {}).name || '')} · ${x.age} yaş · ${{ GK: 'Kaleci', DF: 'Defans', MF: 'Orta Saha', FW: 'Forvet' }[x.pos]}</small></div><b class="g">${x.r}</b></div>`).join('')}</div>
      </section>` : ''}`;
  },

  // Dönemin en iyileri: efsaneler, kulüp kadrolarındaki en güçlü oyuncular ve sen
  topPlayers(n) {
    const s = Game.state, w = s.world;
    const out = Legends.active(w).map((x) => ({ n: x.n, r: x.r, club: x.L.club, age: x.age, pos: x.pos }));
    const seen = new Set(out.map((x) => x.n));
    Object.values(w.clubs).forEach((c) => {
      if (!LEAGUES.find((l) => l.id === c.league)) return;
      (c.roster || []).forEach((pl) => { if (pl.r >= 76 && !seen.has(pl.n)) { seen.add(pl.n); out.push({ n: pl.n, r: pl.r, club: c.id, age: pl.age, pos: pl.pos }); } });
    });
    if (!Game.inStreet() && !Game.isYouth()) out.push({ n: Player.fullName(s.player), r: Player.overall(s.player), club: s.clubId, age: s.player.age, pos: s.player.position, me: true });
    return out.sort((a, b) => b.r - a.r).slice(0, n);
  },

  // Lig seçici: varsayılan kapalı, ülkelere göre gruplu
  leaguePicker(sel) {
    const L = LEAGUES.find((l) => l.id === sel);
    const groups = {};
    LEAGUES.forEach((l) => { (groups[l.country] = groups[l.country] || []).push(l); });
    return `<details class="lpick" ${UI.lpickOpen ? 'open' : ''}>
      <summary><span class="lp-flag">${LEAGUE_CC[L.id]}</span><span class="lp-t"><small>${U.esc(L.country)}${L.level === 2 ? ' · 2. lig' : ''}</small><b>${U.esc(L.name)}</b></span><span class="lp-btn">Lig değiştir ${Icon('chevron')}</span></summary>
      <div class="lp-grid">${Object.entries(groups).map(([c, ls]) => `<div class="lp-c"><span><i class="lp-cc">${LEAGUE_CC[ls[0].id]}</i>${U.esc(c)}</span>${ls.map((l) => `<button class="${l.id === sel ? 'on' : ''}" data-wl="${l.id}">${U.esc(l.name)}${l.level === 2 ? ' <small>2. lig</small>' : ''}</button>`).join('')}</div>`).join('')}</div>
    </details>`;
  },

  bind(root) {
    if (typeof Life !== 'undefined') Life.bind(root);
    U.$$('[data-focus]', root).forEach((b) => (b.onclick = () => { Game.state.trainFocus = b.dataset.focus; Game.render(); }));
    U.$$('[data-act]', root).forEach((b) => (b.onclick = () => Game.act(b.dataset.act)));
    U.$$('[data-more]', root).forEach((b) => (b.onclick = () => { UI.more[b.dataset.more] = !UI.more[b.dataset.more]; Game.render(); }));
    const dtg = root.querySelector('#drill-tg');
    if (dtg) dtg.onchange = () => { Game.state.drills = dtg.checked; Game.save(); };
    const stg = root.querySelector('#sfx-tg'), htg = root.querySelector('#hap-tg');
    if (stg) stg.onchange = () => { Sfx.setOn(stg.checked); if (stg.checked) Sfx.play('whistle'); };
    if (htg) htg.onchange = () => { Sfx.setHap(htg.checked); if (htg.checked) Sfx.buzz('medium'); };
    U.$$('[data-go=match]', root).forEach((b) => (b.onclick = () => {
      const s = Game.state;
      if (s.ap > 0) {
        Game.modal(`<h3>Maça çıkılsın mı?</h3><p>Bu hafta kullanılmamış <b>${s.ap}</b> aksiyon hakkın var. Maça çıkarsan bu haklar kaybolacak.</p>`, [
          { t: 'Vazgeç', cls: 'btn-ghost' },
          { t: 'Maça Çık', fn: () => Game.playNext() },
        ]);
      } else Game.playNext();
    }));
    U.$$('[data-celeb]', root).forEach((b) => (b.onclick = () => { Game.p.celeb = b.dataset.celeb; Game.save(); Game.toast('Gol sevincin seçildi', 'good'); Game.render(); }));
    U.$$('[data-post]', root).forEach((b) => (b.onclick = () => Social.open(b.dataset.post)));
    U.$$('[data-offer]', root).forEach((b) => (b.onclick = () => Game.acceptOffer(+b.dataset.offer)));
    U.$$('[data-reject]', root).forEach((b) => (b.onclick = () => { Game.state.offers = []; Game.save(); Game.render(); }));
    U.$$('[data-buy]', root).forEach((b) => (b.onclick = () => {
      const it = ITEMS.find((i) => i.id === b.dataset.buy);
      const p = Game.p;
      if (p.money < it.price) return;
      p.money -= it.price;
      p.items.push(it.id);
      if (it.cat === 'boots') { p.wear = p.wear || {}; p.wear[it.id] = U.randi(30, 40); }
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
    U.$$('[data-wl]', root).forEach((b) => (b.onclick = () => { UI.worldLeague = b.dataset.wl; UI.lpickOpen = false; Game.render(); }));
    U.$$('details.lpick', root).forEach((d) => d.addEventListener('toggle', () => { UI.lpickOpen = d.open; }));
    U.$$('[data-vnav]', root).forEach((b) => (b.onclick = () => { const [k, v] = b.dataset.vnav.split(':'); UI[k] = v; Game.render(); }));
    U.$$('[data-king]', root).forEach((b) => (b.onclick = () => { UI.kingTab = b.dataset.king; Game.render(); }));
    U.$$('[data-cupsel]', root).forEach((b) => (b.onclick = () => { UI.cupSel = b.dataset.cupsel; Game.render(); }));
    U.$$('[data-physio]', root).forEach((b) => (b.onclick = () => { Shop.use('physio'); Game.render(); }));
    U.$$('[data-adenergy]', root).forEach((b) => (b.onclick = () => {
      b.disabled = true;
      Ads.show().then((ok) => {
        const s = Game.state;
        if (ok) {
          const v = (typeof AD_CONFIG !== 'undefined' && AD_CONFIG.energyReward) || 25;
          s.adEnergy = `${s.season.year}-${s.season.round}`;
          Player.addEnergy(Game.p, v); Game.save();
          Game.toast(`+${v} enerji`, 'good');
        }
        Game.render();
      });
    }));
    U.$$('[data-mission-claim]', root).forEach((b) => (b.onclick = () => Missions.claim()));
    const ntg = root.querySelector('#notif-tg');
    if (ntg) ntg.onchange = () => Notify.setOn(ntg.checked);
    U.$$('[data-prem-buy]', root).forEach((b) => (b.onclick = () => { b.disabled = true; Premium.buy(); }));
    U.$$('[data-prem-restore]', root).forEach((b) => (b.onclick = () => { b.disabled = true; Premium.restore(); }));
    U.$$('[data-adreward]', root).forEach((b) => (b.onclick = () => {
      b.disabled = true;
      const kind = b.dataset.adreward;
      Ads.show().then((ok) => {
        const s = Game.state, p = Game.p;
        if (ok && kind === 'ap') {
          s.adAp = `${s.season.year}-${s.season.round}`;
          s.ap = Math.min(3, s.ap + 1);
          Game.toast('+1 aksiyon hakkı', 'good');
        } else if (ok && kind === 'injury' && p.injuryWeeks > 0) {
          p.injAdUsed = true;
          p.injuryWeeks = Math.max(0, p.injuryWeeks - 1);
          if (p.injuryWeeks === 0) Game.news('💪 Sakatlığın geçti, tekrar sahalara dönebilirsin!', 'good');
          Game.toast(p.injuryWeeks ? `Sakatlık kısaldı: ${p.injuryWeeks} hafta kaldı` : 'Sakatlığın geçti!', 'good');
        }
        if (ok) Game.save();
        Game.render();
      });
    }));
    U.$$('[data-adprivacy]', root).forEach((b) => (b.onclick = () => window.StarfootAds.privacyOptions()));
    U.$$('[data-setlang]', root).forEach((b) => (b.onclick = () => { if (b.dataset.setlang !== I18N.lang) { Game.save(); I18N.set(b.dataset.setlang); } }));
    U.$$('[data-sys]', root).forEach((b) => (b.onclick = () => {
      const k = b.dataset.sys;
      if (k === 'save') { Game.save(); Game.toast('💾 Kaydedildi', 'good'); }
      if (k === 'menu') Game.toMenu();
      if (k === 'retire') Game.modal('<h3>Emekli olmak istediğine emin misin?</h3><p>Kariyerin sona erecek.</p>', [{ t: 'Vazgeç', cls: 'btn-ghost' }, { t: 'Emekli Ol', fn: () => Game.retire() }]);
      if (k === 'delete') Game.modal('<h3>Kariyer silinsin mi?</h3><p>Bu işlem geri alınamaz.</p>', [{ t: 'Vazgeç', cls: 'btn-ghost' }, { t: 'Sil', cls: 'btn-danger', fn: () => { Game.wipe(); Game.state = null; Game.toMenu(); } }]);
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
    const awards = (se.trophies || []).concat(se.cupWins || []);
    const medal = se.pos <= 3 && !Game.isYouth() ? ['gold', 'silver', 'bronze'][se.pos - 1] : se.pos === 1 ? 'gold' : null;
    const relTag = se.relegated ? '<div class="cer-tag down">Küme düştük</div>' : se.promoted ? '<div class="cer-tag up">Üst lige yükseldik!</div>' : '';
    const html = `
      <div class="ceremony">
        <div class="cer-rays"></div>
        <div class="cer-kicker">${se.year} Sezonu · ${U.esc(se.compName)}</div>
        <h2 class="cer-title">${awards.length ? 'Ödül Töreni' : 'Sezon Sona Erdi'}</h2>
        <div class="cer-pos ${medal || ''}"><b>${se.pos}.</b><span>Lig sıralaması</span></div>
        ${relTag}
        ${se.europe ? `<div class="cer-ticket z-${se.europe.id}">${Icon('globe')}<span><small>Gelecek sezon</small><b>${U.esc(se.europe.name)}</b></span></div>` : ''}
        ${awards.length ? `<div class="cer-awards">${awards.map((t, i) => { const txt = U.plain(t).replace(/\s*\(\d+\)$/, ''); return `<div class="cer-aw" style="animation-delay:${0.25 + i * 0.25}s">${Trophy.svg(Trophy.kind(txt))}<b>${U.esc(txt)}</b></div>`; }).join('')}</div>` : '<p class="muted cer-none">Bu sezon kupa yok. Gelecek sezon vitrine bir şey koyalım!</p>'}
        ${se.prize ? `<div class="cer-prize">${Icon('coin')} Başarı primi <b>${U.money(se.prize)}</b></div>` : ''}
      </div>
      <div class="ms-stats se-stats">
        ${[['table', 'Sıra', `${se.pos}.`], ['whistle', 'Maç', ss.apps], ['ball', 'Gol', ss.goals], ['boot', 'Asist', ss.assists], ['star', 'Ort. Reyting', se.avg ? se.avg.toFixed(2) : '-'], ['train', 'Güç', `${se.ovrBefore}→${se.ovrAfter}`]].map(([ic, l, v]) => `<div class="mst"><i>${Icon(ic)}</i><b>${v}</b><span>${l}</span></div>`).join('')}
      </div>
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
  foot: 'R',
  POS_INFO: {
    FW: { ic: 'ball', num: 9, d: 'Gol atar, şutlarla maçın kaderini belirler.' },
    MF: { ic: 'team', num: 8, d: 'Oyunu kurar, pas ve asistlerle parlar.' },
    DF: { ic: 'shield', num: 4, d: 'Savunmanın lideri; top kapar, kafa toplarında söz sahibi.' },
  },
  open() {
    Create.alloc = {};
    STATS.forEach((s) => (Create.alloc[s.k] = 0));
    Create.manual = false;
    Create.auto();
    Game.show('create');
    window.scrollTo(0, 0);
    const el = document.getElementById('create');
    const natOpts = NATIONS.map((n) => `<option value="${n.code}">${n.name}</option>`).join('');
    el.innerHTML = `
      <div class="cr-wrap">
        <header class="cr-hero">
          <div class="cr-hero-bg" aria-hidden="true"><i></i><i></i></div>
          <div class="cr-hero-t">
            <span class="cr-kicker">Kariyer modu</span>
            <h1>Yeni <span>Kariyer</span></h1>
            <p>Mahalle maçından Dünya Kupası finaline. Hikâyeni yaz, scoutların gözüne gir, efsane ol.</p>
          </div>
        </header>
        <div class="cr-layout">
          <aside class="cr-pv">
            <div class="cr-card-fx">
              <div class="pv-top"><b class="pv-ovr" id="pv-ovr">--</b><span class="pv-pos" id="pv-pos"></span><span class="pv-flag" id="pv-flag"></span></div>
              <canvas id="pv-art" width="300" height="300" aria-hidden="true"></canvas>
              <div class="pv-name" id="pv-name">EMRE YILDIZ</div>
              <div class="pv-meta" id="pv-meta"></div>
            </div>
          </aside>
          <div class="cr-steps">
            <section class="cr-step">
              <div class="cr-step-h"><i>1</i><div><b>Kimliğin</b><small>Formanın arkasında yazacak isim</small></div></div>
              <div class="cr-row2">
                <label class="cr-f"><span>Adın</span><input id="cr-name" maxlength="16" placeholder="Örn: Emre" autocomplete="off"></label>
                <label class="cr-f"><span>Soyadın</span><input id="cr-sur" maxlength="18" placeholder="Örn: Yıldız" autocomplete="off"></label>
              </div>
            </section>
            <section class="cr-step">
              <div class="cr-step-h"><i>2</i><div><b>Kökenin</b><small>Farklıysa iki milli takımdan da davet alabilirsin</small></div></div>
              <div class="cr-row2">
                <label class="cr-f"><span>Baba memleketi</span><select id="cr-nat">${natOpts}</select></label>
                <label class="cr-f"><span>Anne memleketi</span><select id="cr-mom">${natOpts}</select></label>
              </div>
            </section>
            <section class="cr-step">
              <div class="cr-step-h"><i>3</i><div><b>Başlangıç</b><small id="cr-era">O dönemin yıldızlarıyla oynarsın</small></div></div>
              <div class="cr-row2">
                <label class="cr-f"><span>Başlangıç yılı</span><select id="cr-year">${Array.from({ length: 2026 - 1980 + 1 }, (_, i) => 2026 - i).map((y) => `<option value="${y}">${y}</option>`).join('')}</select></label>
                <label class="cr-f"><span>Başlangıç yaşı</span><select id="cr-age">${Array.from({ length: 11 }, (_, i) => 8 + i).map((a) => `<option value="${a}">${a} yaş</option>`).join('')}</select></label>
              </div>
              <p class="cr-note" id="cr-age-note"></p>
              <div class="cr-f"><span>Kullandığın ayak</span>
                <div class="cr-toggle" id="cr-foot">${[['L', 'Sol'], ['R', 'Sağ']].map(([k, l]) => `<button type="button" data-foot="${k}" class="${k === Create.foot ? 'on' : ''}">${l}</button>`).join('')}</div>
              </div>
            </section>
            <section class="cr-step">
              <div class="cr-step-h"><i>4</i><div><b>Mevkin</b><small>Antrenmanda öne çıkan yetenekleri belirler</small></div></div>
              <div class="cr-cards" id="cr-pos">
                ${Object.entries(POSITIONS).map(([k, v]) => `<button type="button" data-pos="${k}" class="cr-opt ${k === Create.pos ? 'on' : ''}">${Icon(Create.POS_INFO[k].ic)}<b>${v.l}</b><small>${Create.POS_INFO[k].d}</small></button>`).join('')}
              </div>
            </section>
            <section class="cr-step">
              <div class="cr-step-h"><i>5</i><div><b>Zorluk</b><small>İstediğin zaman Kariyer sekmesinden değiştirebilirsin</small></div></div>
              <div class="cr-cards" id="cr-diff">
                ${Object.entries(DIFFS).map(([k, v]) => `<button type="button" data-diff="${k}" class="cr-opt d-${k} ${k === Create.diff ? 'on' : ''}"><b>${v.l}</b><small>${v.d}</small></button>`).join('')}
              </div>
            </section>
            <section class="cr-step">
              <div class="cr-step-h"><i>6</i><div><b>Yeteneklerin</b><small id="cr-pts-note"></small></div><span class="cr-pts" id="cr-pts"></span></div>
              <div class="cr-auto"><button type="button" class="btn btn-ghost" id="cr-auto">${Icon('bolt')} Otomatik dağıt</button><button type="button" class="btn btn-ghost" id="cr-reset">Sıfırla</button></div>
              <div class="cr-stats" id="cr-stats"></div>
            </section>
            <div class="cr-cta">
              <button class="btn btn-ghost" id="cr-back">Geri</button>
              <button class="btn btn-big" id="cr-go">${Icon('play')} Kariyere Başla</button>
            </div>
          </div>
        </div>
      </div>`;
    const pick = (sel, attr, fn) => U.$$(`${sel} [data-${attr}]`).forEach((b) => (b.onclick = () => {
      U.$$(`${sel} [data-${attr}]`).forEach((x) => x.classList.toggle('on', x === b));
      fn(b.dataset[attr]);
    }));
    pick('#cr-diff', 'diff', (v) => { Create.diff = v; });
    pick('#cr-pos', 'pos', (v) => { Create.pos = v; if (!Create.manual) Create.auto(); Create.drawStats(); });
    pick('#cr-foot', 'foot', (v) => { Create.foot = v; Create.preview(); });
    document.getElementById('cr-back').onclick = () => Game.init();
    ['cr-name', 'cr-sur'].forEach((id) => (document.getElementById(id).oninput = () => Create.preview()));
    ['cr-nat', 'cr-mom'].forEach((id) => (document.getElementById(id).onchange = () => Create.preview()));
    const ageSel = document.getElementById('cr-age'), yearSel = document.getElementById('cr-year');
    const updAge = () => {
      const a = +ageSel.value;
      document.getElementById('cr-age-note').textContent = a <= 12 ? 'İlk maçın bir mahalle maçı; scout seni izleyecek' : `Altyapı seçmelerine katılırsın (${ageGroupName(a)}); kulübünü scoutlar belirler`;
      Create.drawStats();
    };
    const updYear = () => {
      const y = +yearSel.value;
      document.getElementById('cr-era').textContent = y < 1990 ? '80\'ler: efsanelerin dönemi' : y < 2000 ? '90\'lar: Avrupa\'nın altın yılları' : y < 2010 ? '2000\'ler: yıldızlar çağı' : y < 2020 ? '2010\'lar: modern futbol' : 'Bugünün yıldızlarıyla oynarsın';
      Create.preview();
    };
    ageSel.onchange = updAge; yearSel.onchange = updYear;
    updAge(); updYear();
    document.getElementById('cr-go').onclick = () => {
      const name = document.getElementById('cr-name').value.trim() || 'Emre';
      const surname = document.getElementById('cr-sur').value.trim() || 'Yıldız';
      Game.newCareer({
        name, surname, nation: document.getElementById('cr-nat').value, mother: document.getElementById('cr-mom').value, foot: Create.foot,
        position: Create.pos, alloc: Create.alloc, difficulty: Create.diff,
        year: +yearSel.value, age: +ageSel.value,
      });
    };
  },
  // Oyuncunun başlayacağı yaşa göre taban stat (Player.create ile aynı)
  base() {
    const el = document.getElementById('cr-age');
    const age = el ? +el.value : 8;
    return Math.max(12, Math.round(expectedAtAge(age) - 6));
  },
  left() { return Create.points - Object.values(Create.alloc).reduce((a, b) => a + b, 0); },
  // Puanları mevkinin önemli yeteneklerine göre otomatik dağıtır (her yetenekte en fazla 8)
  auto() {
    const w = POSITIONS[Create.pos].w;
    STATS.forEach((st) => (Create.alloc[st.k] = 0));
    const ks = STATS.map((st) => st.k).sort((a, b) => (w[b] || 0) - (w[a] || 0));
    const sum = ks.reduce((a, k) => a + (w[k] || 0), 0) || 1;
    ks.forEach((k) => (Create.alloc[k] = Math.min(8, Math.floor(Create.points * (w[k] || 0) / sum))));
    for (let i = 0; Create.left() > 0 && i < 200; i++) {
      const k = ks[i % ks.length];
      if (Create.alloc[k] < 8 && (w[k] || 0) > 0) Create.alloc[k]++;
      else if (i >= ks.length && Create.alloc[k] < 8) Create.alloc[k]++;
    }
  },
  ovr() {
    const w = POSITIONS[Create.pos].w, b = Create.base();
    let t = 0, sw = 0;
    Object.entries(w).forEach(([k, x]) => { t += (b + Create.alloc[k]) * x; sw += x; });
    return Math.round(t / sw);
  },
  // Canlı oyuncu kartı
  preview() {
    const g = (id) => document.getElementById(id);
    if (!g('pv-art')) return;
    const name = (g('cr-name').value.trim() || (I18N.lang === 'en' ? 'Alex' : 'Emre'));
    const sur = (g('cr-sur').value.trim() || (I18N.lang === 'en' ? 'Stone' : 'Yıldız'));
    const nat = g('cr-nat').value, mom = g('cr-mom').value;
    const natName = (c) => (NATIONS.find((n) => n.code === c) || {}).name || c;
    g('pv-name').textContent = `${name} ${sur}`.toLocaleUpperCase(I18N.lang === 'en' ? 'en' : 'tr');
    g('pv-ovr').textContent = Create.ovr();
    g('pv-pos').textContent = POSITIONS[Create.pos].short;
    g('pv-flag').textContent = nat === mom ? natName(nat) : `${natName(nat)} / ${natName(mom)}`;
    g('pv-meta').innerHTML = `<span>${g('cr-age').value} yaş</span><span>${Create.foot === 'L' ? 'Sol ayak' : 'Sağ ayak'}</span><span>${g('cr-year').value}</span>`;
    const cv = g('pv-art'), c = cv.getContext('2d');
    c.clearRect(0, 0, cv.width, cv.height);
    const cols = (typeof NAT_COLORS !== 'undefined' && NAT_COLORS[nat]) || ['#c8102e', '#ffffff'];
    const kit = Sprites.kits({ id: 'NAT' + nat, c1: cols[0], c2: cols[1] }, { id: 'X', c1: '#111', c2: '#fff' }).own;
    let seed = 0; for (const ch of name + sur) seed = (seed * 31 + ch.charCodeAt(0)) % 9973;
    Sprites.figure(c, 150, 286, 250, { kit, look: Sprites.look(seed + 1), facing: 'down', number: Create.POS_INFO[Create.pos].num, t: 0, noShadow: false });
  },
  drawStats() {
    const w = POSITIONS[Create.pos].w, base = Create.base();
    const left = Create.left();
    document.getElementById('cr-pts').innerHTML = `<b>${left}</b><small>puan</small>`;
    document.getElementById('cr-pts').classList.toggle('done', left === 0);
    document.getElementById('cr-pts-note').textContent = `${document.getElementById('cr-age').value} yaşındaki bir çocuğun ortalaması ${base} · ★ mevkin için önemli`;
    document.getElementById('cr-stats').innerHTML = STATS.map((s) => {
      const v = base + Create.alloc[s.k], key = w[s.k] >= 0.12;
      return `<div class="cs ${key ? 'key' : ''}">
        <span class="cs-l" title="${U.esc(s.d)}">${s.l}${key ? ' <i>★</i>' : ''}</span>
        <div class="cs-bar"><i style="width:${Math.min(100, v)}%"></i><em style="width:${Create.alloc[s.k] * 1}%;left:${base}%"></em></div>
        <button type="button" data-d="-1" data-k="${s.k}" ${Create.alloc[s.k] <= 0 ? 'disabled' : ''}>−</button>
        <b>${v}</b>
        <button type="button" data-d="1" data-k="${s.k}" ${Create.alloc[s.k] >= 8 || left <= 0 ? 'disabled' : ''}>+</button>
      </div>`;
    }).join('');
    U.$$('#cr-stats button').forEach((b) => (b.onclick = () => {
      const k = b.dataset.k, d = +b.dataset.d;
      const v = Create.alloc[k] + d;
      if (v < 0 || v > 8 || (d > 0 && Create.left() <= 0)) return;
      Create.alloc[k] = v;
      Create.manual = true;
      Create.drawStats();
    }));
    const au = document.getElementById('cr-auto'), rs = document.getElementById('cr-reset');
    if (au) au.onclick = () => { Create.manual = false; Create.auto(); Create.drawStats(); };
    if (rs) rs.onclick = () => { Create.manual = true; STATS.forEach((st) => (Create.alloc[st.k] = 0)); Create.drawStats(); };
    Create.preview();
  },
};

// Ana menüye dönüş: sayfayı yenilemeden (iOS uygulamasında yenileme siyah ekran bırakıyordu)
Game.toMenu = function () {
  if (Game.state) Game.save();
  ['match', 'modal'].forEach((id) => { const e = document.getElementById(id); if (e) e.classList.add('hidden'); });
  Game.init();
  window.scrollTo(0, 0);
  window.dispatchEvent(new Event('resize'));
};
// ---------- Bildirim merkezi: kısa süreli bildirimlerin geçmişi ----------
const Notifs = {
  push(msg, type) {
    const s = Game.state;
    if (!s) return;
    s.notifs = s.notifs || [];
    s.notifs.unshift({ t: U.plain(String(msg)), type: type || '', w: `${s.season.year} · ${Math.min(s.season.round + 1, Game.rounds())}. Hafta` });
    s.notifs = s.notifs.slice(0, 60);
    s.notifUnread = Math.min(99, (s.notifUnread || 0) + 1);
    Notifs.badge();
  },
  badge() {
    const n = document.getElementById('notif-n');
    if (!n) return;
    const c = (Game.state && Game.state.notifUnread) || 0;
    n.textContent = c > 9 ? '9+' : c;
    n.classList.toggle('hidden', !c);
  },
  open() {
    const s = Game.state;
    if (!s) return;
    const list = s.notifs || [];
    s.notifUnread = 0; Notifs.badge(); Game.save();
    Game.modal(`<div class="nf-head"><h3>Bildirimler</h3><small class="muted">Son ${list.length} bildirim</small></div>
      <div class="nf-list">${list.length ? list.map((x) => `<div class="nf-item ${x.type}"><i></i><span>${U.esc(x.t)}</span><small>${U.esc(x.w)}</small></div>`).join('') : '<p class="muted">Henüz bildirim yok.</p>'}</div>`,
    [...(list.length ? [{ t: 'Temizle', cls: 'btn-ghost', fn: () => { s.notifs = []; Game.save(); } }] : []), { t: 'Kapat' }]);
  },
};

// Dil değişince açık ekranı yeniden çiz
I18N.onChange = () => {
  const vis = (id) => !document.getElementById(id).classList.contains('hidden');
  if (Game.state && vis('hub')) Game.render();
  else if (vis('create')) Create.open();
  else if (!Game.state) Game.init();
  window.dispatchEvent(new Event('resize'));
};

window.addEventListener('DOMContentLoaded', () => {
  U.$$('#tabs button').forEach((b) => (b.onclick = () => { Game.tab = b.dataset.tab; Game.render(); window.scrollTo(0, 0); }));
  document.getElementById('logo').onclick = () => { if (Game.state) { Game.tab = 'home'; Game.render(); } };
  document.getElementById('notif-btn').onclick = () => Notifs.open();
  Game.init();
});
