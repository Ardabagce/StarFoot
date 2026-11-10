// Teknik Direktör modu (1.0.19): kendi kaydı olan ayrı mod.
// Kulüp seç, ilk 11'i ve taktiği belirle, maçı canlı yönet (taktik, oyuncu değişikliği, devre arası konuşması),
// transfer yap, yönetimin hedefini tut. Kötü giderse kovulursun; iyi giderse büyük kulüpler seni ister.
// Futbolculuk kariyerinden geçilebilir (emeklilikte) ya da sıfırdan başlanır.

const CM_FORMS = {
  '4-4-2': { DF: 4, MF: 4, FW: 2, att: 0, def: 0 },
  '4-3-3': { DF: 4, MF: 3, FW: 3, att: 2, def: -1.5 },
  '4-2-3-1': { DF: 4, MF: 5, FW: 1, att: 0.5, def: 1 },
  '3-5-2': { DF: 3, MF: 5, FW: 2, att: 1.5, def: -1.5 },
  '5-3-2': { DF: 5, MF: 3, FW: 2, att: -2, def: 2.5 },
};
const CM_STYLES = {
  bal: { t: 'Dengeli', d: 'Ne çok açık ne çok kapalı.', att: 0, def: 0, tire: 1 },
  att: { t: 'Hücum', d: 'Çok gol arar, arkada boşluk bırakır.', att: 3, def: -3, tire: 1.1 },
  def: { t: 'Savunma', d: 'Önce kalesini korur, az pozisyon üretir.', att: -3, def: 3, tire: 0.95 },
  press: { t: 'Önde baskı', d: 'Rakibi kendi yarı alanında boğar ama oyuncuları çok yorar.', att: 2, def: 1.5, tire: 1.45 },
  counter: { t: 'Kontra', d: 'Hücum eden rakibe karşı çok etkilidir.', att: 0.5, def: 1.5, tire: 1, vsAtt: 2.5 },
};
const CM_TRAIN = {
  light: { t: 'Hafif', d: 'Oyuncular dinlenir, kondisyon hızlı toplanır.', fit: 30, grow: 0.4, inj: 0.4 },
  normal: { t: 'Normal', d: 'Dengeli yük.', fit: 23, grow: 1, inj: 1 },
  hard: { t: 'Yoğun', d: 'Gelişim hızlanır ama kondisyon yavaş toplanır, sakatlık riski artar.', fit: 16, grow: 1.9, inj: 1.8 },
};
const CM_POS = { GK: 'KL', DF: 'DF', MF: 'OS', FW: 'FV' };

const Coach = {
  KEY: 'starfoot_coach',
  s: null,
  view: 'home',

  // ---------- kayıt ----------
  enabled() { return typeof FEAT_V19 !== 'undefined' && FEAT_V19; },
  saved() { try { const r = Store.read(Coach.KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; } },
  save() { try { if (Coach.s) Store.write(Coach.KEY, JSON.stringify(Coach.s)); } catch (e) { /* depolama yok */ } },
  wipe() { try { Store.remove(Coach.KEY); } catch (e) { /* yok */ } },

  // ---------- kulüpler ----------
  base(id) { const c = CLUB_LIST.find((x) => x[0] === id); return c ? { id: c[0], name: c[1], short: c[2], league: c[3], rating: c[4], c1: c[5], c2: c[6], pool: c[7] } : null; },
  club(id) {
    const s = Coach.s, b = Coach.base(id);
    if (!b) return null;
    const o = (s && s.cl && s.cl[id]) || {};
    return Object.assign(b, o);
  },
  setClub(id, k, v) { const s = Coach.s; s.cl[id] = s.cl[id] || {}; s.cl[id][k] = v; },
  my() { return Coach.club(Coach.s.clubId); },
  leagueOf(id) { return Coach.club(id).league; },
  leagueClubs(lg) { return CLUB_LIST.map((c) => c[0]).filter((id) => Coach.leagueOf(id) === lg); },
  lgName(id) { const l = LEAGUES.find((x) => x.id === id); return l ? l.name : ''; },
  lgInfo(id) { return LEAGUES.find((x) => x.id === id) || { level: 1, fame: 1 }; },

  // ---------- oyuncular ----------
  // oyuncu kariyerindeki piyasa değeriyle aynı ölçek
  value(r, age) {
    const f = age <= 21 ? 1.4 : age <= 24 ? 1.2 : age <= 28 ? 1 : age <= 30 ? 0.7 : age <= 32 ? 0.45 : 0.25;
    const v = 900000 * Math.exp((r - 65) / 6.5) * f;
    const m = v > 2e7 ? 1e6 : v > 2e6 ? 1e5 : 25000;
    return Math.max(25000, Math.round(v / m) * m);
  },
  mkPlayer(o) {
    const s = Coach.s;
    s.pid = (s.pid || 0) + 1;
    const age = o.age || U.randi(18, 33);
    return { id: s.pid, n: o.n, pos: o.pos, r: Math.round(o.r), age, pot: o.pot || Math.round(U.clamp(o.r + Math.max(0, 27 - age) * U.rand(0.6, 1.6), o.r, 94)), nat: o.nat || '', fit: 100, mor: 70, inj: 0, g: 0, a: 0, apps: 0, rs: 0, form: [] };
  },
  genSquad(club, year) {
    const ro = World.genRoster(club, year);
    return ro.map((p) => Coach.mkPlayer({ n: p.n, pos: p.pos, r: U.clamp(p.r, 35, 92), age: p.age || U.randi(19, 33), nat: p.nat }));
  },
  ovr(p) { return Math.round(p.r); },
  avg(list) { return list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0; },
  teamRating() {
    const sq = Coach.s.squad.slice().sort((a, b) => b.r - a.r).slice(0, 14);
    return Math.round(Coach.avg(sq.map((p) => p.r)));
  },
  natFlag(code) { const n = Game.nat(code); return n ? n.flag : ''; },

  // ---------- başlatma ----------
  // o: { name, surname, nat, age, rep, iq, from: 'player'|'new', past }
  begin(o) {
    Coach.pending = o;
    Coach.offerPicker(Coach.jobOffers(o.rep, null, 3), 'İlk iş teklifleri', 'Kulüpler seninle görüşmek istiyor. İlk takımını seç:', (id) => Coach.start(o, id));
  },
  start(o, clubId) {
    const year = o.year || 2026;
    Coach.s = {
      v: 1, name: o.name, surname: o.surname, nat: o.nat, age: o.age || 38, rep: o.rep, iq: o.iq || 50, from: o.from || 'new', past: o.past || null,
      year, round: 0, clubId, cl: {}, squad: [], xi: [], subs: 3, form: '4-4-2', style: 'bal', train: 'normal',
      budget: 0, conf: 65, target: 0, news: [], hist: [], trophies: [], rec: { w: 0, d: 0, l: 0, gf: 0, ga: 0 },
      mk: [], cup: null, pid: 0, sacked: 0,
    };
    Coach.joinClub(clubId, true);
    Coach.save();
    Coach.enter();
    const c = Coach.my();
    Game.modal(`<div class="ev-tag">Teknik Direktör</div><h2>${U.esc(c.name)}'a hoş geldin!</h2>
      <p>Yönetim kurulu seni basına tanıttı. Bu sezonki hedef: <b>${Coach.targetText(Coach.s.target)}</b>.</p>
      <ul class="tips">
        <li>Kadro sekmesinden ilk 11'i seç, Taktik sekmesinden dizilişi ve oyun anlayışını belirle.</li>
        <li>Maçları canlı yönet: taktik değiştir, oyuncu değiştir, devre arasında takıma konuş.</li>
        <li>Transfer dönemlerinde bütçenle oyuncu al ya da sat.</li>
        <li>Yönetimin güveni çok düşerse kovulursun. Başarılı olursan büyük kulüpler kapını çalar.</li>
      </ul>`, [{ t: 'Başlayalım!', cls: 'btn-big' }], { wide: true });
  },
  // kulübe geçiş: kadro, lig, kupa, bütçe ve hedef
  joinClub(id, fresh) {
    const s = Coach.s, c = Coach.club(id);
    s.clubId = id;
    s.squad = Coach.genSquad(c, s.year);
    s.xi = []; Coach.autoPick();
    s.budget = Math.round(Coach.value(c.rating + 2, 26) * (1.2 + s.rep / 120) / 1e5) * 1e5;
    s.conf = 65; s.mk = [];
    Coach.setupLeague(c.league, fresh ? 0 : s.round);
    s.target = Coach.calcTarget();
    s.joined = { y: s.year, r: s.round };
    s.stint = { club: id, from: s.year, w: 0, d: 0, l: 0 };
    Coach.news(`${Coach.fullName()}, ${c.name} teknik direktörlüğüne getirildi.`, 'good');
  },
  fullName() { const s = Coach.s; return `${s.name} ${s.surname}`; },

  // ---------- lig ----------
  setupLeague(lg, upto) {
    const s = Coach.s;
    const ids = Coach.leagueClubs(lg);
    if (!ids.includes(s.clubId)) ids.push(s.clubId);
    s.lg = World.newLeagueSeason(ids);
    s.lg.id = lg;
    // sezon ortasında gelinen ligde önceki haftalar oynanmış sayılır (yeni lig daha kısaysa son 4 hafta bırakılır)
    if (upto) { upto = Math.max(0, Math.min(upto, s.lg.fixtures.length - 4)); s.round = upto; }
    for (let r = 0; r < Math.min(upto || 0, s.lg.fixtures.length); r++) Coach.simRound(r, true);
    Coach.setupCup(upto || 0);
  },
  rounds() { return Coach.s.lg ? Coach.s.lg.fixtures.length : 34; },
  rating(id) { return id === Coach.s.clubId ? Coach.teamRating() : Coach.club(id).rating; },
  simRound(r, all) {
    const s = Coach.s;
    (s.lg.fixtures[r] || []).forEach(([h, a]) => {
      if (!all && (h === s.clubId || a === s.clubId)) return;
      const [hs, as] = World.simScore(Coach.rating(h), Coach.rating(a));
      World.record(s.lg, h, a, hs, as);
    });
  },
  table() { return World.sortedTable(Coach.s.lg); },
  myPos() { return Coach.table().findIndex((r) => r.id === Coach.s.clubId) + 1; },
  // hedef: güç sırasına göre
  calcTarget() {
    const s = Coach.s;
    const ids = s.lg.ids.slice().sort((a, b) => Coach.rating(b) - Coach.rating(a));
    const rank = ids.indexOf(s.clubId) + 1;
    return U.clamp(rank + (rank <= 2 ? 0 : 1), 1, ids.length - 3);
  },
  targetText(t) {
    const n = Coach.s.lg ? Coach.s.lg.ids.length : 18;
    if (t <= 1) return 'Şampiyonluk';
    if (t <= 4) return 'İlk 4';
    if (t <= Math.ceil(n / 2)) return 'İlk yarı';
    if (t <= n - 4) return 'Orta sıralar';
    return 'Ligde kalmak';
  },

  // ---------- kupa ----------
  setupCup(fromRound) {
    const s = Coach.s, n = Coach.rounds();
    // kupa 16 (küçük liglerde 8) takımlı
    const size = s.lg.ids.length >= 16 ? 16 : 8;
    const others = U.shuffle(s.lg.ids.filter((x) => x !== s.clubId)).slice(0, size - 1);
    const weeks = (size === 16 ? [0.18, 0.36, 0.56, 0.78] : [0.3, 0.55, 0.8]).map((f) => Math.max(2, Math.round(n * f)));
    if (fromRound > weeks[0]) { s.cup = null; return; }
    s.cup = { alive: U.shuffle(others.concat(s.clubId)), weeks, stage: 0, done: false, out: false, name: `${(LEAGUES.find((l) => l.id === s.lg.id) || {}).country || ''} Kupası`.trim() };
  },
  cupStageName(n) { return { 16: 'Son 16', 8: 'Çeyrek Final', 4: 'Yarı Final', 2: 'Final' }[n] || ''; },
  cupDue() { const c = Coach.s.cup; return !!(c && !c.done && !c.out && c.weeks[c.stage] === Coach.s.round + 1 && !c.played); },
  cupOpp() { const c = Coach.s.cup, i = c.alive.indexOf(Coach.s.clubId); return c.alive[i % 2 ? i - 1 : i + 1]; },
  // kupa turunu tamamla (bizim sonucumuz verilmişse onu kullan)
  cupAdvance(ourWin) {
    const s = Coach.s, c = s.cup, next = [];
    for (let i = 0; i < c.alive.length; i += 2) {
      const h = c.alive[i], a = c.alive[i + 1];
      let w;
      if (h === s.clubId || a === s.clubId) w = ourWin ? s.clubId : (h === s.clubId ? a : h);
      else { const r = Cups.tie(Coach.rating(h), Coach.rating(a)); w = r.win === 0 ? h : a; }
      next.push(w);
    }
    if (!next.includes(s.clubId)) c.out = true;
    c.alive = next; c.stage++; c.played = false;
    if (c.alive.length === 1) {
      c.done = true; c.winner = c.alive[0];
      if (c.winner === s.clubId) { s.trophies.push(`${s.year} ${c.name}`); s.rep = U.clamp(s.rep + 5, 0, 100); s.conf = U.clamp(s.conf + 15, 0, 100); Coach.news(`🏆 ${c.name} şampiyonu olduk!`, 'good'); }
      else Coach.news(`${c.name}: şampiyon ${Coach.club(c.winner).name}.`, '');
    }
  },

  // ---------- ilk 11 ve güç ----------
  autoPick() {
    const s = Coach.s, f = CM_FORMS[s.form];
    const ok = s.squad.filter((p) => !p.inj && !p.sus);
    const score = (p) => p.r * (0.8 + 0.2 * p.fit / 100);
    const by = (pos) => ok.filter((p) => p.pos === pos).sort((a, b) => score(b) - score(a));
    const xi = [];
    const take = (pos, n) => by(pos).filter((p) => !xi.includes(p.id)).slice(0, n).forEach((p) => xi.push(p.id));
    take('GK', 1); take('DF', f.DF); take('MF', f.MF); take('FW', f.FW);
    // eksik kalırsa en iyilerden tamamla
    ok.filter((p) => !xi.includes(p.id) && p.pos !== 'GK').sort((a, b) => score(b) - score(a)).forEach((p) => { if (xi.length < 11) xi.push(p.id); });
    s.xi = xi.slice(0, 11);
  },
  rotate() {
    const s = Coach.s;
    if (s.rot === false) return;
    s.xi.slice().forEach((id) => {
      const p = s.squad.find((x) => x.id === id);
      if (!p || p.fit >= 62) return;
      const b = s.squad.filter((x) => x.pos === p.pos && !s.xi.includes(x.id) && !x.inj && !x.sus && x.fit >= 80 && x.r >= p.r - 7).sort((a, c) => c.r - a.r)[0];
      if (b) s.xi = s.xi.map((x) => (x === id ? b.id : x));
    });
  },
  xiPlayers() { const s = Coach.s; return s.xi.map((id) => s.squad.find((p) => p.id === id)).filter(Boolean); },
  // oyuncuları dizilişteki yerlere yerleştirir; yeri olmayan oyuncu cezalı oynar
  assign(list, form) {
    const f = CM_FORMS[form], need = { GK: 1, DF: f.DF, MF: f.MF, FW: f.FW };
    const out = [], rest = [];
    list.forEach((p) => { if (need[p.pos] > 0) { need[p.pos]--; out.push({ p, slot: p.pos, pen: 0 }); } else rest.push(p); });
    rest.forEach((p) => {
      const slot = Object.keys(need).find((k) => need[k] > 0) || p.pos;
      if (need[slot] > 0) need[slot]--;
      const pen = slot === p.pos ? 0 : slot === 'GK' ? 25 : p.pos === 'GK' ? 20 : 6;
      out.push({ p, slot, pen });
    });
    return out;
  },
  eff(x) { const p = x.p; return (p.r - x.pen) * (0.9 + 0.1 * U.clamp(p.fit, 0, 100) / 100) * (0.98 + 0.04 * p.mor / 100); },
  strength(list, form, style, mods) {
    const a = Coach.assign(list, form);
    const g = (slot) => Coach.avg(a.filter((x) => x.slot === slot).map(Coach.eff)) || 40;
    const f = CM_FORMS[form], st = CM_STYLES[style];
    const short = Math.max(0, 11 - list.length) * 3.5;
    let att = g('FW') * 0.48 + g('MF') * 0.37 + g('DF') * 0.15 + f.att + st.att - short;
    let def = g('DF') * 0.45 + g('GK') * 0.25 + g('MF') * 0.3 + f.def + st.def - short;
    if (mods) { att += mods.att || 0; def += mods.def || 0; }
    return { att, def };
  },
  oppTeam(id) {
    const r = Coach.rating(id) + U.rand(-1.5, 1.5);
    const st = r > Coach.teamRating() + 3 ? 'att' : r < Coach.teamRating() - 4 ? U.pick(['def', 'counter']) : U.pick(['bal', 'bal', 'press', 'att']);
    const S = CM_STYLES[st];
    return { id, att: r + S.att, def: r + S.def, style: st };
  },

  // ---------- haftalık akış ----------
  nextMatch() {
    const s = Coach.s;
    if (s.jobless || s.round >= Coach.rounds()) return null;
    if (Coach.cupDue()) { const o = Coach.cupOpp(); return { comp: 'cup', opp: o, home: U.chance(0.5), name: `${s.cup.name} · ${Coach.cupStageName(s.cup.alive.length)}` }; }
    const fx = s.lg.fixtures[s.round].find((m) => m.includes(s.clubId));
    if (!fx) return { comp: 'bye' };
    return { comp: 'lg', opp: fx[0] === s.clubId ? fx[1] : fx[0], home: fx[0] === s.clubId, name: `${Coach.lgName(s.lg.id)} · ${s.round + 1}. hafta` };
  },
  // maç sonucu işlendikten sonra hafta ilerler
  afterMatch(m, res) {
    const s = Coach.s, my = s.clubId;
    const gf = res.gf, ga = res.ga;
    if (m.comp === 'lg') {
      const [h, a] = m.home ? [my, m.opp] : [m.opp, my];
      World.record(s.lg, h, a, m.home ? gf : ga, m.home ? ga : gf);
    }
    const win = res.pens ? res.pens.win : gf > ga, draw = !res.pens && gf === ga;
    s.rec.gf += gf; s.rec.ga += ga;
    if (win) { s.rec.w++; s.stint.w++; } else if (draw) { s.rec.d++; s.stint.d++; } else { s.rec.l++; s.stint.l++; }
    // yönetim güveni: beklentiye göre
    const diff = Coach.teamRating() - Coach.rating(m.opp) + (m.home ? 2 : -2);
    const exp = U.clamp(0.5 + diff / 30, 0.1, 0.9);
    const got = win ? 1 : draw ? 0.45 : 0;
    s.conf = U.clamp(s.conf + (got - exp) * (m.comp === 'cup' ? 6 : 9), 0, 100);
    s.rep = U.clamp(s.rep + (got - exp) * 0.6, 0, 100);
    s.squad.forEach((p) => { p.mor = U.clamp(p.mor + (win ? 3 : draw ? 0 : -3), 25, 100); });
    const opp = Coach.club(m.opp);
    const sc = `${gf}-${ga}${res.pens ? ` (pen. ${res.pens.a}-${res.pens.b})` : ''}`;
    Coach.news(`${win ? '✅' : draw ? '➖' : '❌'} ${m.comp === 'cup' ? `${m.name} · ` : ''}${opp.name} maçı: ${sc}`, win ? 'good' : draw ? '' : 'bad');
    s.last = { opp: m.opp, gf, ga, home: m.home, comp: m.comp, pens: res.pens || null };
    if (m.comp === 'cup') { s.cup.played = true; Coach.cupAdvance(win); }
    else Coach.week();
    Coach.save();
    if (Coach.checkSack()) return;
    Coach.render();
  },
  // bay haftası ya da lig maçı sonrası: diğer maçlar, iyileşme, gelişim, transfer dönemi
  week() {
    const s = Coach.s, T = CM_TRAIN[s.train];
    Coach.simRound(s.round, false);
    // kupa haftası oynanmadan geçildiyse (elendiysek) diğer eşleşmeler yine oynanır
    if (s.cup && !s.cup.done && !s.cup.out && s.cup.weeks[s.cup.stage] === s.round + 1 && !s.cup.played) Coach.cupAdvance(false);
    else if (s.cup && !s.cup.done && s.cup.out && s.cup.weeks[s.cup.stage] === s.round + 1) Coach.cupAdvance(false);
    s.round++;
    s.squad.forEach((p) => {
      p.fit = U.clamp(p.fit + T.fit, 0, 100);
      if (p.inj > 0) { p.inj--; if (!p.inj) Coach.news(`💪 ${p.n} sakatlığını atlattı.`, 'good'); }
      if (p.sus > 0) p.sus--;
      if (p.age <= 24 && p.r < p.pot) p.r = Math.min(p.pot, p.r + (p.pot - p.r) * 0.012 * T.grow * (1 + (s.iq - 50) / 200));
      if (!p.inj && U.chance(0.004 * T.inj)) { p.inj = U.randi(1, 3); Coach.news(`🤕 ${p.n} antrenmanda sakatlandı (${p.inj} hafta).`, 'bad'); }
      p.mor += (65 - p.mor) * 0.1;
    });
    if (s.xi.some((id) => { const p = s.squad.find((x) => x.id === id); return !p || p.inj || p.sus; })) Coach.autoPick();
    Coach.market();
    if (s.round >= Coach.rounds()) Coach.seasonEnd();
  },
  window() { const s = Coach.s, n = Coach.rounds(), mid = Math.floor(n / 2); return s.round < 5 || (s.round >= mid && s.round < mid + 4); },
  market() {
    const s = Coach.s;
    if (!Coach.window()) { s.mk = []; return; }
    const c = Coach.my(), tr = Coach.teamRating();
    // haftada birkaç yeni oyuncu; liste en fazla 12
    const add = s.mk.length ? 3 : 10;
    for (let i = 0; i < add; i++) {
      const pos = U.pick(['GK', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'FW', 'FW']);
      const fr = U.chance(0.45) ? World.foreign(c.pool) : null;
      const age = U.randi(18, 33);
      const r = Math.round(U.clamp(tr + U.randi(-9, 7) + (s.rep - 40) / 15, 40, 90));
      const p = Coach.mkPlayer({ n: World.genName(fr ? fr.pool : c.pool), pos, r, age, nat: fr ? fr.nat : POOL_NAT[c.pool] || '' });
      p.price = Math.round(Coach.value(r, age) * U.rand(0.9, 1.25) / 25000) * 25000;
      p.club = U.pick(CLUB_LIST.filter((x) => x[0] !== s.clubId))[0];
      s.mk.push(p);
    }
    s.mk = s.mk.slice(-12);
  },
  buy(id) {
    const s = Coach.s, p = s.mk.find((x) => x.id === id);
    if (!p) return;
    if (s.squad.length >= 30) return Game.toast('Kadro dolu (en fazla 30 oyuncu). Önce oyuncu sat.', 'bad');
    if (s.budget < p.price) return Game.toast('Bütçe yetmiyor.', 'bad');
    Game.modal(`<h3>${U.esc(p.n)} transferi</h3><p>${CM_POS[p.pos]} · ${p.age} yaş · Güç ${Coach.ovr(p)} · Potansiyel ~${Math.round(p.pot / 5) * 5}</p><p>Bonservis: <b>${U.money(p.price)}</b></p>`, [
      { t: 'Vazgeç', cls: 'btn-ghost' },
      { t: 'Transferi yap', cls: 'btn-big', fn: () => {
        // her teklif kabul edilmez: güçlü oyuncu küçük kulübe gelmek istemeyebilir
        const want = U.clamp(0.85 - (p.r - Coach.teamRating() - 4) * 0.06 + s.rep / 300, 0.15, 0.97);
        if (!U.chance(want)) { s.mk = s.mk.filter((x) => x.id !== id); Coach.save(); Coach.render(); return Game.toast(`${p.n} teklifini reddetti: daha büyük bir kulüp istiyor.`, 'bad'); }
        s.budget -= p.price; s.mk = s.mk.filter((x) => x.id !== id);
        delete p.price; delete p.club; p.mor = 80;
        s.squad.push(p);
        Coach.news(`✍️ ${p.n} kadromuza katıldı (${U.money(Coach.value(p.r, p.age))}).`, 'good');
        Coach.save(); Coach.render();
      } },
    ]);
  },
  sell(id) {
    const s = Coach.s, p = s.squad.find((x) => x.id === id);
    if (!p) return;
    if (!Coach.window()) return Game.toast('Transfer dönemi kapalı.', 'bad');
    if (s.squad.length <= 18) return Game.toast('Kadroda en az 18 oyuncu kalmalı.', 'bad');
    const fee = Math.round(Coach.value(p.r, p.age) * U.rand(0.8, 1.1) / 25000) * 25000;
    const buyer = Coach.club(U.pick(CLUB_LIST.filter((x) => x[0] !== s.clubId && Math.abs(x[4] - p.r) < 10).concat([CLUB_LIST[0]]))[0]);
    Game.modal(`<h3>${U.esc(buyer.name)} teklif yaptı</h3><p>${U.esc(p.n)} için önerdikleri bonservis: <b>${U.money(fee)}</b></p>`, [
      { t: 'Reddet', cls: 'btn-ghost' },
      { t: 'Sat', cls: 'btn-big', fn: () => {
        s.budget += fee; s.squad = s.squad.filter((x) => x.id !== id); s.xi = s.xi.filter((x) => x !== id);
        if (s.xi.length < 11) Coach.autoPick();
        Coach.news(`👋 ${p.n}, ${U.money(fee)} karşılığında ${buyer.name}'a satıldı.`, '');
        Coach.save(); Coach.render();
      } },
    ]);
  },

  // ---------- yönetim ----------
  checkSack() {
    const s = Coach.s;
    if (s.conf > 12 || s.round < 6 || s.phase === 'end' || s.jobless || Coach.myPos() <= s.target + 2) return false;
    s.sacked++;
    s.rep = U.clamp(s.rep - 8, 0, 100);
    Coach.closeStint('Kovuldu');
    Coach.news(`📰 ${Coach.my().name} yönetimi ${Coach.fullName()} ile yollarını ayırdı.`, 'bad');
    s.jobless = Coach.jobOffers(s.rep, s.clubId, 3);
    Coach.save();
    Coach.view = 'home';
    Coach.render();
    Game.modal(`<div class="ev-tag">Kovuldun</div><h2>Yönetim güvenini kaybettin</h2><p>Kötü sonuçlar sonrası ${U.esc(Coach.my().name)} ile yolların ayrıldı. Ama futbol dünyası seni unutmadı.</p>`, [
      { t: 'Teklifleri gör', cls: 'btn-big', fn: () => Coach.offerPicker(s.jobless, 'Yeni iş teklifleri', 'Bu kulüpler seninle görüşmek istiyor:', (id) => { s.jobless = null; Coach.joinClub(id, false); Coach.save(); Coach.render(); }, true) },
    ]);
    return true;
  },
  closeStint(why) {
    const s = Coach.s, st = s.stint;
    if (!st) return;
    s.hist.unshift({ club: st.club, from: st.from, to: s.year, w: st.w, d: st.d, l: st.l, why: why || '' });
  },
  // itibara göre kulüp teklifleri
  jobOffers(rep, exclude, n) {
    const lvl = 46 + rep * 0.36;
    const all = CLUB_LIST.filter((c) => c[0] !== exclude && LEAGUES.some((l) => l.id === c[3]));
    const near = all.filter((c) => c[4] <= lvl + 3 && c[4] >= lvl - 8);
    const pool = near.length >= n ? near : all.slice().sort((a, b) => Math.abs(a[4] - lvl) - Math.abs(b[4] - lvl)).slice(0, 12);
    return U.shuffle(pool.slice()).slice(0, n).map((c) => c[0]).sort((a, b) => Coach.base(b).rating - Coach.base(a).rating);
  },
  offerPicker(ids, tag, txt, fn, noClose) {
    const html = `<div class="ev-tag">${tag}</div><h3>${txt}</h3><div class="cm-offers">${ids.map((id) => {
      const c = Coach.club(id) || Coach.base(id), L = LEAGUES.find((l) => l.id === c.league);
      return `<button class="cm-offer" data-club="${id}">${UI.shirt(c, 'big')}<span><b>${U.esc(c.name)}</b><small>${L ? `${L.flag} ${U.esc(L.name)}` : ''} · Güç ${c.rating}</small></span>${Icon('chevron')}</button>`;
    }).join('')}</div>`;
    const m = Game.modal(html, noClose ? [] : [{ t: 'Vazgeç', cls: 'btn-ghost' }], { wide: true });
    if (noClose) { const b = m.querySelector('.modal-btns'); if (b) b.remove(); }
    U.$$('[data-club]', m).forEach((b) => (b.onclick = () => { m.classList.add('hidden'); m.innerHTML = ''; fn(b.dataset.club); }));
  },

  // ---------- sezon sonu ----------
  seasonEnd() {
    const s = Coach.s, pos = Coach.myPos(), n = s.lg.ids.length, c = Coach.my(), L = Coach.lgInfo(c.league);
    const champ = pos === 1;
    if (champ) { s.trophies.push(`${s.year} ${Coach.lgName(c.league)}`); Coach.news(`🏆 ${Coach.lgName(c.league)} şampiyonu olduk!`, 'good'); }
    const beat = s.target - pos;
    s.rep = U.clamp(s.rep + beat * 1.6 + (champ ? 8 * L.fame : 0) - (pos > n - 3 ? 4 : 0), 0, 100);
    s.conf = U.clamp(s.conf + beat * 7 + (champ ? 20 : 0), 0, 100);
    // küme düşme / çıkma (aynı ülkenin diğer ligi varsa)
    const down = LEAGUES.find((l) => l.country === L.country && l.level === L.level + 1);
    const up = LEAGUES.find((l) => l.country === L.country && l.level === L.level - 1);
    const tbl = Coach.table().map((r) => r.id);
    let moved = '';
    if (down && pos > n - 3) {
      tbl.slice(-3).forEach((id) => Coach.setClub(id, 'league', down.id));
      Coach.leagueClubs(down.id).filter((id) => !tbl.includes(id)).sort((a, b) => Coach.rating(b) - Coach.rating(a)).slice(0, 3).forEach((id) => Coach.setClub(id, 'league', L.id));
      moved = 'down';
    } else if (up && pos <= 2) {
      tbl.slice(0, 2).forEach((id) => Coach.setClub(id, 'league', up.id));
      Coach.leagueClubs(up.id).filter((id) => !tbl.includes(id)).sort((a, b) => Coach.rating(a) - Coach.rating(b)).slice(0, 2).forEach((id) => Coach.setClub(id, 'league', L.id));
      moved = 'up';
    }
    s.lastSeason = { year: s.year, pos, n, target: s.target, champ, club: s.clubId, lg: c.league, moved, w: s.stint.w, d: s.stint.d, l: s.stint.l };
    s.seasons = (s.seasons || []).concat([{ y: s.year, club: s.clubId, lg: c.league, pos, n }]).slice(-30);
    s.phase = 'end';
    Coach.save();
  },
  // sezon sonu ekranından yeni sezona geçiş
  newSeason(moveTo) {
    const s = Coach.s;
    if (moveTo && moveTo !== s.clubId) { Coach.closeStint('Ayrıldı'); }
    s.year++; s.age++; s.round = 0; s.phase = null; s.cup = null;
    // diğer kulüplerin gücü biraz değişir
    CLUB_LIST.forEach((x) => { if (x[0] !== s.clubId && U.chance(0.35)) Coach.setClub(x[0], 'rating', U.clamp(Coach.club(x[0]).rating + U.randi(-2, 2), 38, 90)); });
    if (moveTo && moveTo !== s.clubId) {
      Coach.joinClub(moveTo, true);
    } else {
      // yaşlanma, gelişim, emeklilik, altyapıdan gençler
      const gone = [];
      s.squad.forEach((p) => {
        p.age++;
        const d = p.age <= 23 ? U.randi(1, 4) : p.age <= 29 ? U.randi(-1, 2) : p.age <= 32 ? U.randi(-3, 0) : U.randi(-5, -1);
        p.r = U.clamp(Math.min(p.r + d, Math.max(p.pot, p.r)), 30, 94);
        p.g = 0; p.a = 0; p.apps = 0; p.rs = 0; p.form = []; p.fit = 100; p.inj = 0; p.sus = 0;
        if (p.age >= 34 && U.chance(0.35 + (p.age - 34) * 0.2)) gone.push(p);
      });
      gone.forEach((p) => Coach.news(`👋 ${p.n} ${p.age} yaşında futbolu bıraktı.`, ''));
      s.squad = s.squad.filter((p) => !gone.includes(p));
      const c = Coach.my();
      for (let i = 0; i < Math.max(2, 20 - s.squad.length); i++) {
        const yp = Coach.mkPlayer({ n: World.genName(c.pool), pos: U.pick(['DF', 'MF', 'FW', 'MF']), r: Coach.teamRating() - U.randi(9, 16), age: 17, nat: POOL_NAT[c.pool] || '' });
        yp.pot = U.randi(Coach.teamRating() - 2, Coach.teamRating() + 12);
        s.squad.push(yp);
      }
      Coach.news(`🌱 Altyapıdan ${s.squad.filter((p) => p.age === 17 && !p.apps).map((p) => p.n).join(', ')} A takıma yükseldi.`, 'good');
      s.budget = Math.round((s.budget * 0.4 + Coach.value(c.rating + 2, 26) * (1.2 + s.rep / 120)) / 1e5) * 1e5;
      Coach.setupLeague(c.league, 0);
      s.target = Coach.calcTarget();
      s.conf = U.clamp(s.conf * 0.5 + 35, 30, 85);
      s.stint.from = s.stint.from || s.year;
      Coach.autoPick();
    }
    s.mk = []; Coach.market();
    Coach.news(`📅 ${s.year} sezonu başladı. Hedef: ${Coach.targetText(s.target)}.`, '');
    Coach.save();
    Coach.render();
  },
  retire() {
    const s = Coach.s;
    Coach.closeStint('Emekli');
    const t = s.rec;
    const html = `<div class="ev-tag">Veda</div><h2>${U.esc(Coach.fullName())}</h2><p>${s.age} yaşında teknik direktörlük kariyerini noktaladın.</p>
      <div class="ms-grid big"><div><span>Maç</span><b>${t.w + t.d + t.l}</b></div><div><span>Galibiyet</span><b>${t.w}</b></div><div><span>Beraberlik</span><b>${t.d}</b></div><div><span>Mağlubiyet</span><b>${t.l}</b></div><div><span>Kupa</span><b>${s.trophies.length}</b></div></div>
      <ul class="trophies">${s.trophies.map((x) => `<li>🏆 ${U.esc(x)}</li>`).join('') || '<li>Kupa yok</li>'}</ul>`;
    Coach.wipe();
    Coach.s = null;
    Game.modal(html, [{ t: 'Ana menü', cls: 'btn-big', fn: () => Coach.exit() }], { wide: true });
  },

  // ---------- canlı maç ----------
  play(quick) {
    const s = Coach.s, m = Coach.nextMatch();
    if (!m) return;
    if (m.comp === 'bye') { Coach.week(); Coach.save(); return Coach.render(); }
    if (Coach.xiPlayers().length < 11) Coach.autoPick();
    Coach.rotate();
    Live.start(m, quick);
  },
  news(t, type) { const s = Coach.s; s.news.unshift({ t, type: type || '', y: s.year, r: s.round }); s.news = s.news.slice(0, 30); },

  // ---------- ekranlar ----------
  enter() {
    Game.state = null;
    Game.show('coach');
    Coach.view = 'home';
    Coach.render();
  },
  exit() {
    Coach.save();
    Coach.s = null;
    document.getElementById('coach').classList.add('hidden');
    Game.toMenu();
  },
  menu() {
    if (!Packs.owns('coach')) return Packs.offer('coach');
    const sv = Coach.saved();
    const btns = [{ t: 'Kapat', cls: 'btn-ghost' }];
    if (sv) btns.push({ t: 'Yeni kariyer', cls: 'btn-ghost', fn: () => Game.modal('<h3>Mevcut teknik direktör kariyerin silinsin mi?</h3>', [{ t: 'Vazgeç', cls: 'btn-ghost' }, { t: 'Sil ve başla', cls: 'btn-danger', fn: () => { Coach.wipe(); Coach.create(); } }]) });
    btns.push(sv ? { t: 'Devam et', cls: 'btn-big', fn: () => { Coach.s = sv; Coach.enter(); } } : { t: 'Başla', cls: 'btn-big', fn: () => Coach.create() });
    Game.modal(`<div class="ev-tag">Teknik Direktör</div><h2>${Icon('whistle')} Teknik Direktör</h2>
      ${sv ? `<p><b>${U.esc(sv.name)} ${U.esc(sv.surname)}</b> · ${U.esc((Coach.base(sv.clubId) || {}).name || '')} · ${sv.year}</p>` : '<p>Kulübün başına geç: kadroyu kur, taktiği seç, maçı kenardan yönet.</p>'}`, btns);
  },
  create() {
    const natOpts = Game.allNations().map((n) => `<option value="${n.code}">${n.name}</option>`).join('');
    const m = Game.modal(`<div class="ev-tag">Teknik Direktör</div><h3>Yeni teknik direktör</h3>
      <label class="cr-f"><span>Adın</span><input id="cm-n" maxlength="16" placeholder="Örn: Emre"></label>
      <label class="cr-f"><span>Soyadın</span><input id="cm-s" maxlength="18" placeholder="Örn: Yıldız"></label>
      <label class="cr-f"><span>Ülke</span><select id="cm-nat">${natOpts}</select></label>
      <label class="cr-f"><span>Geçmişin</span><select id="cm-bg"><option value="pro">Eski futbolcu (itibar yüksek)</option><option value="school">Antrenörlük okulu (taktik zekası yüksek)</option><option value="amateur">Amatörden yükselen (alt ligden başlar)</option></select></label>`, [
      { t: 'Vazgeç', cls: 'btn-ghost' },
      { t: 'Devam', cls: 'btn-big', keep: true, fn: () => {
        const n = document.getElementById('cm-n').value.trim(), sn = document.getElementById('cm-s').value.trim();
        if (!n || !sn) return Game.toast('Adını ve soyadını yaz.', 'bad');
        const bg = document.getElementById('cm-bg').value;
        const o = { name: n, surname: sn, nat: document.getElementById('cm-nat').value, age: bg === 'pro' ? 38 : 34, rep: bg === 'pro' ? 30 : bg === 'school' ? 22 : 12, iq: bg === 'school' ? 72 : 55, from: 'new' };
        document.getElementById('modal').classList.add('hidden');
        Coach.begin(o);
      } },
    ]);
    const hm = I18N.home(); const sel = m.querySelector('#cm-nat'); if (sel && Game.allNations().some((x) => x.code === hm)) sel.value = hm;
  },
  // futbolculuk kariyerinden geçiş (emeklilik ekranı)
  fromPlayer(p, legend) {
    const o = { name: p.name, surname: p.surname, nat: p.nation, age: p.age + 1, rep: U.clamp(Math.round(18 + legend / 25 + (p.iq || 50) / 10 + (p.uni && p.uni.done ? 6 : 0)), 15, 75), iq: p.iq || 55, from: 'player', past: { trophies: (p.trophies || []).length, apps: p.totals ? p.totals.apps : 0 } };
    Coach.begin(o);
  },

  render() {
    const s = Coach.s;
    const el = document.getElementById('coach');
    if (!s || !el) return;
    const c = Coach.my();
    const tabs = [['home', 'home', 'Merkez'], ['squad', 'squad', 'Kadro'], ['tactic', 'coach', 'Taktik'], ['league', 'table', 'Lig'], ['market', 'contract', 'Transfer'], ['club', 'career', 'Kariyer']];
    const body = { home: Coach.vHome, squad: Coach.vSquad, tactic: Coach.vTactic, league: Coach.vLeague, market: Coach.vMarket, club: Coach.vClub }[Coach.view] || Coach.vHome;
    el.innerHTML = `<div class="cm-top">
        <div class="cm-hd">${UI.shirt(c)}<div><b>${U.esc(c.name)}</b><small>${U.esc(Coach.fullName())} · ${s.year} · ${Math.min(s.round + 1, Coach.rounds())}. hafta</small></div>
          <button class="notif-btn" id="cm-menu" aria-label="Menü">${Icon('exit')}</button></div>
        <div class="cm-stat"><span>Bütçe <b>${U.money(s.budget)}</b></span><span>Güven <i class="cm-bar"><i style="width:${s.conf}%;background:${s.conf > 55 ? '#46e08f' : s.conf > 30 ? '#ffcf3f' : '#ff6b6b'}"></i></i></span><span>İtibar <b>${Math.round(s.rep)}</b></span></div>
      </div>
      <nav class="cm-tabs">${tabs.map(([k, ic, t]) => `<button data-cmv="${k}" class="${Coach.view === k ? 'on' : ''}">${Icon(ic)}<span>${t}</span></button>`).join('')}</nav>
      <main class="cm-main">${body()}</main>`;
    U.$$('[data-cmv]', el).forEach((b) => (b.onclick = () => { Coach.view = b.dataset.cmv; Coach.render(); window.scrollTo(0, 0); }));
    el.querySelector('#cm-menu').onclick = () => Game.modal('<h3>Ana menüye dönülsün mü?</h3><p>İlerlemen kaydedildi.</p>', [{ t: 'Vazgeç', cls: 'btn-ghost' }, { t: 'Ana menü', fn: () => Coach.exit() }]);
    Coach.bind(el);
    UI.strip(el);
    if (s.phase === 'end') Coach.showSeasonEnd();
  },
  bind(el) {
    const s = Coach.s;
    const on = (sel, fn) => U.$$(sel, el).forEach((b) => (b.onclick = () => fn(b)));
    on('#cm-play', () => Coach.play(false));
    on('#cm-quick', () => Coach.play(true));
    on('[data-xi]', (b) => {
      const id = +b.dataset.xi;
      if (s.xi.includes(id)) s.xi = s.xi.filter((x) => x !== id);
      else if (s.xi.length < 11) { const p = s.squad.find((x) => x.id === id); if (p.inj || p.sus) return Game.toast('Bu oyuncu şu an oynayamaz.', 'bad'); s.xi.push(id); } else return Game.toast('İlk 11 dolu. Önce birini çıkar.', 'bad');
      Coach.save(); Coach.render();
    });
    on('[data-pinfo]', (b) => Coach.playerInfo(+b.dataset.pinfo));
    on('#cm-auto', () => { Coach.autoPick(); Coach.save(); Coach.render(); });
    on('[data-form]', (b) => { s.form = b.dataset.form; Coach.save(); Coach.render(); });
    on('[data-style]', (b) => { s.style = b.dataset.style; Coach.save(); Coach.render(); });
    on('[data-train]', (b) => { s.train = b.dataset.train; Coach.save(); Coach.render(); });
    on('[data-rot]', (b) => { s.rot = b.dataset.rot === 'on'; Coach.save(); Coach.render(); });
    on('[data-job]', (b) => { const id = b.dataset.job; s.jobless = null; Coach.joinClub(id, false); Coach.save(); Coach.render(); });
    on('[data-buy]', (b) => Coach.buy(+b.dataset.buy));
    on('#cm-retire', () => Game.modal('<h3>Teknik direktörlüğü bırakmak istediğine emin misin?</h3><p>Kariyerin sona erecek.</p>', [{ t: 'Vazgeç', cls: 'btn-ghost' }, { t: 'Emekli ol', cls: 'btn-danger', fn: () => Coach.retire() }]));
  },
  vHome() {
    const s = Coach.s, m = Coach.nextMatch();
    let mh = '';
    if (s.jobless) {
      return `<section class="card"><div class="card-h"><span>${Icon('contract')} İş teklifleri</span></div><p>Şu an bir kulübün yok. Yeni takımını seç:</p>
        <div class="cm-offers">${s.jobless.map((id) => { const o = Coach.club(id); return `<button class="cm-offer" data-job="${id}">${UI.shirt(o, 'big')}<span><b>${U.esc(o.name)}</b><small>${U.esc(Coach.lgName(o.league))} · Güç ${o.rating}</small></span>${Icon('chevron')}</button>`; }).join('')}</div></section>`;
    }
    if (m && m.comp !== 'bye') {
      const o = Coach.club(m.opp), me = Coach.my();
      const [h, a] = m.home ? [me, o] : [o, me];
      mh = `<section class="card cm-next"><div class="card-h"><span>${Icon('whistle')} Sıradaki maç</span><small class="muted">${U.esc(m.name)}</small></div>
        <div class="cm-vs"><div>${UI.shirt(h, 'big')}<b>${U.esc(h.name)}</b><small>Güç ${Coach.rating(h.id)}</small></div><em>VS</em><div>${UI.shirt(a, 'big')}<b>${U.esc(a.name)}</b><small>Güç ${Coach.rating(a.id)}</small></div></div>
        <div class="cm-play"><button class="btn btn-big" id="cm-play">${Icon('play')} Maçı yönet</button><button class="btn btn-ghost" id="cm-quick">${Icon('fast')} Hızlı sonuç</button></div>
        <p class="muted">${CM_FORMS[s.form] ? s.form : ''} · ${CM_STYLES[s.style].t} · İlk 11: ${Coach.xiPlayers().length}/11</p></section>`;
    } else if (m && m.comp === 'bye') {
      mh = `<section class="card"><p>Bu hafta maç yok.</p><button class="btn btn-big" id="cm-play">Haftayı geç</button></section>`;
    }
    const pos = Coach.myPos();
    const last = s.last ? `<p class="cm-last">Son maç: ${U.esc(Coach.club(s.last.opp).name)} ${s.last.gf}-${s.last.ga}</p>` : '';
    return `${mh}
      <section class="card"><div class="card-h"><span>${Icon('shield')} Yönetim</span><small class="muted">Hedef: ${Coach.targetText(s.target)}</small></div>
        <div class="lf-rows"><div class="lf-row"><span>Güven</span><div class="lf-bar"><i style="width:${s.conf}%;background:${s.conf > 55 ? '#46e08f' : s.conf > 30 ? '#ffcf3f' : '#ff6b6b'}"></i></div><b>${Math.round(s.conf)}</b></div></div>
        <p class="muted">${[`Ligde ${pos}. sıradasın`, `${s.stint.w}G ${s.stint.d}B ${s.stint.l}M`, s.conf < 30 ? 'Yönetim sabırsızlanıyor!' : ''].filter(Boolean).join(' · ')}</p>${last}</section>
      ${Coach.window() ? `<section class="card cm-win">${Icon('contract')} Transfer dönemi açık. Transfer sekmesinde yeni oyuncular var.</section>` : ''}
      <section class="card"><div class="card-h"><span>${Icon('news')} Haberler</span></div><ul class="cm-news">${s.news.slice(0, 8).map((n) => `<li class="${n.type}">${U.esc(n.t)}</li>`).join('')}</ul></section>`;
  },
  prow(p, opts) {
    const s = Coach.s, inXi = s.xi.includes(p.id);
    const form = p.form.length ? (p.form.reduce((a, b) => a + b, 0) / p.form.length).toFixed(1) : '–';
    return `<div class="cm-p ${inXi ? 'xi' : ''} ${p.inj || p.sus ? 'out' : ''}">
      ${opts && opts.buy ? '' : `<button class="cm-x" data-xi="${p.id}" aria-label="İlk 11">${inXi ? '✓' : ''}</button>`}
      <span class="cm-pos ${p.pos}">${CM_POS[p.pos]}</span>
      <button class="cm-pn" ${opts && opts.buy ? '' : `data-pinfo="${p.id}"`}><b>${U.esc(p.n)}</b><small>${[`${p.age} yaş`, p.inj ? `Sakat: ${p.inj} hafta` : '', p.sus ? 'Cezalı' : '', opts && opts.buy ? U.esc((Coach.base(p.club) || {}).name || '') : `Form ${form}`, opts && opts.buy ? '' : `${p.g} gol`].filter(Boolean).join(' · ')}</small></button>
      ${opts && opts.buy ? `<span class="cm-pr">${U.money(p.price)}</span><button class="btn cm-buy" data-buy="${p.id}">Al</button>` : `<i class="cm-fit"><i style="width:${p.fit}%"></i></i>`}
      <b class="cm-r">${Coach.ovr(p)}</b></div>`;
  },
  vSquad() {
    const s = Coach.s, xi = Coach.xiPlayers();
    const st = Coach.strength(xi, s.form, s.style);
    const grp = ['GK', 'DF', 'MF', 'FW'].map((pos) => `<div class="lbl">${POSITIONS[pos].l}</div>${s.squad.filter((p) => p.pos === pos).sort((a, b) => b.r - a.r).map((p) => Coach.prow(p)).join('')}`).join('');
    return `<section class="card"><div class="card-h"><span>${Icon('squad')} Kadro (${s.squad.length})</span><button class="btn btn-ghost" id="cm-auto">Otomatik diz</button></div>
      <p class="muted">İlk 11: ${xi.length}/11 · Hücum ${Math.round(st.att)} · Savunma ${Math.round(st.def)} · Soldaki kutuya dokunarak oyuncuyu 11'e al ya da çıkar.</p>${grp}</section>`;
  },
  playerInfo(id) {
    const s = Coach.s, p = s.squad.find((x) => x.id === id);
    if (!p) return;
    const v = Coach.value(p.r, p.age);
    const btns = [{ t: 'Kapat', cls: 'btn-ghost' }];
    if (Coach.window()) btns.push({ t: 'Satışa çıkar', fn: () => Coach.sell(id) });
    Game.modal(`<h3>${U.esc(p.n)}</h3><p>${POSITIONS[p.pos].l} · ${p.age} yaş · ${Coach.natFlag(p.nat)}</p>
      <div class="ms-grid"><div><span>Güç</span><b>${Coach.ovr(p)}</b></div><div><span>Potansiyel</span><b>~${Math.round(p.pot / 5) * 5}</b></div><div><span>Kondisyon</span><b>${Math.round(p.fit)}</b></div><div><span>Moral</span><b>${Math.round(p.mor)}</b></div><div><span>Maç</span><b>${p.apps}</b></div><div><span>Gol</span><b>${p.g}</b></div><div><span>Asist</span><b>${p.a}</b></div><div><span>Değer</span><b>${U.money(v)}</b></div></div>`, btns);
  },
  vTactic() {
    const s = Coach.s, st = Coach.strength(Coach.xiPlayers(), s.form, s.style);
    const chip = (attr, k, t, d, on) => `<button class="cm-chip ${on ? 'on' : ''}" data-${attr}="${k}"><b>${t}</b>${d ? `<small>${d}</small>` : ''}</button>`;
    return `<section class="card"><div class="card-h"><span>${Icon('coach')} Diziliş</span></div><div class="cm-chips">${Object.keys(CM_FORMS).map((k) => chip('form', k, k, '', s.form === k)).join('')}</div>${Coach.pitch()}</section>
      <section class="card"><div class="card-h"><span>${Icon('bolt')} Oyun anlayışı</span></div><div class="cm-chips col">${Object.entries(CM_STYLES).map(([k, x]) => chip('style', k, x.t, x.d, s.style === k)).join('')}</div></section>
      <section class="card"><div class="card-h"><span>${Icon('rest')} Otomatik rotasyon</span></div><div class="cm-chips">${chip('rot', 'on', 'Açık', 'Kondisyonu düşen oyuncu maç öncesi dinç yedekle değişir.', s.rot !== false)}${chip('rot', 'off', 'Kapalı', 'İlk 11\'i her zaman sen belirlersin.', s.rot === false)}</div></section>
      <section class="card"><div class="card-h"><span>${Icon('train')} Antrenman yoğunluğu</span></div><div class="cm-chips col">${Object.entries(CM_TRAIN).map(([k, x]) => chip('train', k, x.t, x.d, s.train === k)).join('')}</div></section>
      <p class="muted">Takım gücü: Hücum ${Math.round(st.att)} · Savunma ${Math.round(st.def)}</p>`;
  },
  // dizilişi küçük bir saha üzerinde gösterir
  pitch() {
    const s = Coach.s, a = Coach.assign(Coach.xiPlayers(), s.form), f = CM_FORMS[s.form];
    const rows = [['FW', f.FW, 18], ['MF', f.MF, 45], ['DF', f.DF, 72], ['GK', 1, 90]];
    const dots = rows.map(([slot, n, y]) => a.filter((x) => x.slot === slot).map((x, i, arr) => {
      const xp = ((i + 1) / (arr.length + 1)) * 100;
      return `<div class="cm-dot ${x.pen ? 'bad' : ''}" style="left:${xp}%;top:${y}%"><i>${Coach.ovr(x.p)}</i><span>${U.esc(x.p.n.split(' ').slice(-1)[0])}</span></div>`;
    }).join('')).join('');
    return `<div class="cm-pitch">${dots}</div>`;
  },
  vLeague() {
    const s = Coach.s, t = Coach.table(), n = t.length;
    const rows = t.map((r, i) => { const c = Coach.club(r.id); return `<tr class="${r.id === s.clubId ? 'me' : ''} ${i >= n - 3 ? 'rel' : ''}"><td>${i + 1}</td><td class="tn">${UI.shirt(c)}${U.esc(c.name)}</td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf - r.ga}</td><td><b>${r.pts}</b></td></tr>`; }).join('');
    const cup = s.cup ? `<section class="card"><div class="card-h"><span>${Icon('star')} ${U.esc(s.cup.name)}</span></div><p class="muted">${s.cup.done ? `Şampiyon: ${U.esc(Coach.club(s.cup.winner).name)}` : s.cup.out ? 'Kupadan elendik.' : `${Coach.cupStageName(s.cup.alive.length)} · ${s.cup.weeks[s.cup.stage]}. hafta`}</p></section>` : '';
    return `<section class="card"><div class="card-h"><span>${Icon('table')} ${U.esc(Coach.lgName(s.lg.id))}</span><small class="muted">Hedef: ${Coach.targetText(s.target)}</small></div>
      <div class="tbl-wrap"><table class="tbl cm-tbl"><tr><th>#</th><th>Takım</th><th>O</th><th>G</th><th>B</th><th>M</th><th>Av</th><th>P</th></tr>${rows}</table></div></section>${cup}`;
  },
  vMarket() {
    const s = Coach.s;
    if (!Coach.window()) return `<section class="card"><div class="card-h"><span>${Icon('contract')} Transfer</span></div><p>Transfer dönemi kapalı. Yaz dönemi sezonun ilk 5 haftası, kış dönemi sezonun ortasında 4 hafta sürer.</p><p class="muted">Bütçe: ${U.money(s.budget)}</p></section>`;
    return `<section class="card"><div class="card-h"><span>${Icon('contract')} Transfer listesi</span><small class="muted">Bütçe: ${U.money(s.budget)}</small></div>
      <p class="muted">Oyuncu satmak için Kadro sekmesinde oyuncunun adına dokun.</p>
      ${s.mk.slice().sort((a, b) => b.r - a.r).map((p) => Coach.prow(p, { buy: true })).join('') || '<p class="muted">Bu hafta yeni oyuncu yok.</p>'}</section>`;
  },
  vClub() {
    const s = Coach.s, t = s.rec;
    return `<section class="card"><div class="card-h"><span>${Icon('career')} ${U.esc(Coach.fullName())}</span><small class="muted">${s.age} yaş · ${Coach.natFlag(s.nat)}</small></div>
      <div class="ms-grid"><div><span>Maç</span><b>${t.w + t.d + t.l}</b></div><div><span>G-B-M</span><b>${t.w}-${t.d}-${t.l}</b></div><div><span>Gol</span><b>${t.gf}:${t.ga}</b></div><div><span>Kupa</span><b>${s.trophies.length}</b></div><div><span>İtibar</span><b>${Math.round(s.rep)}</b></div><div><span>Taktik zekası</span><b>${Math.round(s.iq)}</b></div></div>
      ${s.trophies.length ? `<ul class="trophies">${s.trophies.map((x) => `<li>🏆 ${U.esc(x)}</li>`).join('')}</ul>` : ''}</section>
      <section class="card"><div class="card-h"><span>${Icon('globe')} Kariyer geçmişi</span></div>
      <div class="cm-hist">${(s.seasons || []).slice().reverse().map((x) => `<div><span>${x.y}</span><b>${U.esc(Coach.club(x.club).name)}</b><small>${U.esc(Coach.lgName(x.lg))} · ${x.pos}./${x.n}</small></div>`).join('') || '<p class="muted">İlk sezonun devam ediyor.</p>'}</div></section>
      <button class="btn btn-ghost" id="cm-retire">Teknik direktörlüğü bırak</button>`;
  },
  showSeasonEnd() {
    const s = Coach.s, x = s.lastSeason;
    if (!x || Coach._seShown === x.year) return;
    Coach._seShown = x.year;
    const c = Coach.club(x.club);
    const good = x.pos <= x.target;
    const offers = Coach.jobOffers(s.rep, s.clubId, 2).filter((id) => Coach.base(id).rating > c.rating - 2);
    const fired = s.conf < 25 && x.pos > x.target + 1;
    const msg = x.champ ? 'Şampiyonluk! Taraftarlar adını tezahürat yapıyor.' : good ? 'Yönetim hedefin tutturulmasından çok memnun.' : fired ? 'Yönetim hedefin çok uzağında kaldığın için sözleşmeni uzatmıyor.' : 'Hedefin gerisinde kaldın. Yönetim gelecek sezon daha iyisini bekliyor.';
    const html = `<div class="ev-tag">${x.year} sezonu bitti</div><h2>${U.esc(c.name)}</h2>
      <div class="cer-pos ${x.pos <= 3 ? ['gold', 'silver', 'bronze'][x.pos - 1] : ''}"><b>${x.pos}.</b><span>Lig sıralaması</span></div>
      ${x.moved === 'down' ? '<div class="cer-tag down">Küme düştük</div>' : x.moved === 'up' ? '<div class="cer-tag up">Üst lige yükseldik!</div>' : ''}
      <p>Hedef: <b>${Coach.targetText(x.target)}</b> · ${x.w}G ${x.d}B ${x.l}M</p><p>${msg}</p>
      ${offers.length ? `<p class="muted">Başka kulüpler de seninle ilgileniyor:</p><div class="cm-offers">${offers.map((id) => { const o = Coach.base(id); return `<button class="cm-offer" data-club="${id}">${UI.shirt(o, 'big')}<span><b>${U.esc(o.name)}</b><small>${U.esc(Coach.lgName(o.league))} · Güç ${o.rating}</small></span>${Icon('chevron')}</button>`; }).join('')}</div>` : ''}`;
    const btns = [];
    if (!fired) btns.push({ t: 'Kulübümde kal', cls: 'btn-big', fn: () => Coach.newSeason(null) });
    else if (!offers.length) offers.push(...Coach.jobOffers(Math.max(5, s.rep - 10), s.clubId, 2));
    if (s.age >= 60) btns.push({ t: 'Emekli ol', cls: 'btn-ghost', fn: () => Coach.retire() });
    const m = Game.modal(html, btns, { wide: true });
    if (fired && !m.querySelector('[data-club]')) {
      m.querySelector('.modal-card').insertAdjacentHTML('beforeend', `<div class="cm-offers">${offers.map((id) => { const o = Coach.base(id); return `<button class="cm-offer" data-club="${id}">${UI.shirt(o, 'big')}<span><b>${U.esc(o.name)}</b><small>${U.esc(Coach.lgName(o.league))} · Güç ${o.rating}</small></span>${Icon('chevron')}</button>`; }).join('')}</div>`);
    }
    U.$$('[data-club]', m).forEach((b) => (b.onclick = () => { m.classList.add('hidden'); m.innerHTML = ''; Coach.newSeason(b.dataset.club); }));
    UI.strip(m);
  },
};

// ---------- canlı maç yönetimi ----------
const Live = {
  m: null,
  start(match, quick) {
    const s = Coach.s;
    const opp = Coach.oppTeam(match.opp);
    const me = Coach.my(), oc = Coach.club(match.opp);
    const on = Coach.xiPlayers().map((p) => p.id);
    Live.m = { match, opp, min: 0, gf: 0, ga: 0, on, bench: s.squad.filter((p) => !on.includes(p.id) && !p.inj && !p.sus).map((p) => p.id), subs: 3, style: s.style, talk: null, feed: [], red: 0, oppRed: 0, speed: 1, paused: false, ht: false, done: false, me, oc, rates: {}, mods: { att: 0, def: 0 } };
    on.forEach((id) => (Live.m.rates[id] = 6.4));
    if (quick) { Live.sim(true); return Live.finish(); }
    Live.draw();
    Live.loop();
  },
  P(id) { return Coach.s.squad.find((p) => p.id === id); },
  onField() { return Live.m.on.map(Live.P).filter(Boolean); },
  lambdas() {
    const L = Live.m, s = Coach.s;
    const st = Coach.strength(Live.onField(), s.form, L.style, L.mods);
    let oppAtt = L.opp.att - L.oppRed * 4, oppDef = L.opp.def - L.oppRed * 4;
    if (L.style === 'counter' && L.opp.style === 'att') st.att += CM_STYLES.counter.vsAtt;
    const h = L.match.home ? 1 : -1;
    const lf = 1.3 * Math.exp((st.att - oppDef + h * 1.5) / 25), la = 1.3 * Math.exp((oppAtt - st.def - h * 1.5) / 25);
    return [lf / 90, la / 90];
  },
  // bir dakika oynat; olay olursa metin döndürür
  tick() {
    const L = Live.m, s = Coach.s;
    L.min++;
    const [pf, pa] = Live.lambdas();
    const tire = CM_STYLES[L.style].tire;
    Live.onField().forEach((p) => (p.fit = Math.max(5, p.fit - 0.15 * tire * (p.age > 31 ? 1.2 : 1))));
    // rakip ikinci yarı skora göre oyununu değiştirir
    if (L.min === 60 && L.ga < L.gf) { L.opp.att += 2; L.opp.def -= 2; Live.log('Rakip skoru değiştirmek için öne çıkıyor.', 'info'); }
    if (U.chance(pf)) {
      L.gf++;
      const sc = Live.pickScorer(), as = U.chance(0.75) ? Live.pickAssist(sc) : null;
      sc.g++; L.rates[sc.id] = (L.rates[sc.id] || 6.4) + 1;
      if (as) { as.a++; L.rates[as.id] = (L.rates[as.id] || 6.4) + 0.6; }
      Live.log(as ? `GOL! ${sc.n} (asist: ${as.n})` : `GOL! ${sc.n}`, 'gf');
      if (typeof Sfx !== 'undefined') try { Sfx.play('net'); } catch (e) { /* yok */ }
    }
    if (U.chance(pa)) {
      L.ga++;
      Live.log(`Gol yedik. ${U.esc(L.oc.name)} skoru ${L.match.home ? `${L.gf}-${L.ga}` : `${L.ga}-${L.gf}`} yaptı.`, 'ga');
      Live.onField().filter((p) => p.pos === 'DF' || p.pos === 'GK').forEach((p) => (L.rates[p.id] = (L.rates[p.id] || 6.4) - 0.25));
      if (typeof Sfx !== 'undefined') try { Sfx.play('groan'); } catch (e) { /* yok */ }
    }
    // kart ve sakatlık
    if (U.chance(0.0009)) {
      const p = U.pick(Live.onField().filter((x) => x.pos !== 'GK'));
      if (p) { L.on = L.on.filter((x) => x !== p.id); L.red++; p.sus = 1; L.rates[p.id] -= 1.5; Live.log(`KIRMIZI KART! ${p.n} oyundan atıldı.`, 'bad'); }
    }
    if (U.chance(0.0006)) { L.oppRed++; Live.log('Rakipten bir oyuncu kırmızı kart gördü!', 'good'); }
    if (U.chance(0.0007)) {
      const p = U.pick(Live.onField());
      if (p) { p.inj = U.randi(1, 4); Live.log(`${p.n} sakatlandı (${p.inj} hafta).`, 'bad'); L.injured = p.id; }
    }
  },
  log(t, cls) { Live.m.feed.unshift({ m: Live.m.min, t, cls }); },
  pickScorer() {
    const w = { FW: 5, MF: 2.4, DF: 0.6, GK: 0.02 };
    return U.weighted(Live.onField(), (p) => w[p.pos] * Math.pow(p.r / 70, 3));
  },
  pickAssist(sc) {
    const w = { FW: 2, MF: 4, DF: 1.2, GK: 0.1 };
    const pool = Live.onField().filter((p) => p !== sc);
    return pool.length ? U.weighted(pool, (p) => w[p.pos] * Math.pow(p.r / 70, 2)) : null;
  },
  sim(all) {
    const L = Live.m;
    while (L.min < 90) {
      Live.tick();
      if (all && L.min === 45) Live.aiTalk();
      // hızlı sonuçta sakatlanan oyuncu yedekle değişir
      if (all && L.injured) { const p = Live.P(L.injured); L.injured = null; Live.autoSub(p); }
      if (all && L.min === 70) Live.autoSubs();
    }
  },
  aiTalk() { /* hızlı sonuçta devre arası konuşması yapılmaz */ },
  autoSub(out) {
    const L = Live.m;
    if (!out || L.subs <= 0 || !L.on.includes(out.id)) return;
    const b = L.bench.map(Live.P).filter((p) => p && !p.inj).sort((a, c) => (c.pos === out.pos) - (a.pos === out.pos) || c.r - a.r)[0];
    if (b) Live.sub(out.id, b.id);
  },
  autoSubs() {
    const L = Live.m;
    Live.onField().filter((p) => p.fit < 45 && p.pos !== 'GK').sort((a, b) => a.fit - b.fit).slice(0, 2).forEach((p) => Live.autoSub(p));
  },
  sub(outId, inId) {
    const L = Live.m, o = Live.P(outId), i = Live.P(inId);
    L.on = L.on.map((x) => (x === outId ? inId : x));
    L.bench = L.bench.filter((x) => x !== inId).concat([outId]);
    L.subs--;
    L.rates[inId] = L.rates[inId] || 6.3;
    Live.log(`Oyuncu değişikliği: ${i.n} girdi, ${o.n} çıktı.`, 'info');
  },
  loop() {
    const L = Live.m;
    clearTimeout(Live._t);
    if (!L || L.done) return;
    if (L.paused) return;
    if (L.min >= 90) { Live.draw(); return Live.end(); }
    Live.tick();
    if (L.min === 45 && !L.ht) { L.ht = true; Live.draw(); return Live.halftime(); }
    if (L.injured) { const p = Live.P(L.injured); L.injured = null; Live.draw(); if (L.subs > 0) { L.paused = true; return Live.subMenu(p.id, 'Sakatlık! Yerine kimi alalım?'); } }
    Live.draw();
    Live._t = setTimeout(Live.loop, [140, 70, 25][L.speed - 1] || 140);
  },
  halftime() {
    const L = Live.m;
    L.paused = true;
    const lead = L.gf - L.ga;
    Game.modal(`<div class="ev-tag">Devre arası</div><h3>Skor ${L.gf}-${L.ga}. Soyunma odasında takıma ne diyeceksin?</h3>`, [
      { t: '😌 Sakin olun, plana sadık kalın', fn: () => { L.mods.def += lead > 0 ? 1.5 : 0.5; Live.onField().forEach((p) => (p.mor = U.clamp(p.mor + 3, 0, 100))); Live.resume('Takım sakinleşti.'); } },
      { t: '🔥 Daha fazlasını istiyorum!', fn: () => { L.mods.att += lead <= 0 ? 2.5 : 1; Live.onField().forEach((p) => (p.mor = U.clamp(p.mor + 5, 0, 100))); Live.resume('Oyuncular hırslandı!'); } },
      { t: '😠 Bu oyun kabul edilemez!', fn: () => { const ok = U.chance(lead < 0 ? 0.6 : 0.35); L.mods.att += ok ? 3.5 : -1.5; L.mods.def += ok ? 1 : -1; Live.onField().forEach((p) => (p.mor = U.clamp(p.mor + (ok ? 6 : -8), 0, 100))); Live.resume(ok ? 'Sert sözler işe yaradı, takım ateşlendi!' : 'Oyuncular sert sözlerden etkilendi, moraller bozuk.'); } },
    ]);
  },
  resume(msg) { const L = Live.m; if (msg) Live.log(msg, 'info'); L.paused = false; Live.draw(); Live.loop(); },
  subMenu(outId, title) {
    const L = Live.m;
    L.paused = true;
    const out = outId ? [Live.P(outId)] : Live.onField().sort((a, b) => a.fit - b.fit);
    const bench = L.bench.map(Live.P).filter((p) => p && !p.inj && !p.sus).sort((a, b) => b.r - a.r);
    let pick = outId || null;
    const m = Game.modal(`<div class="ev-tag">Oyuncu değişikliği · ${L.subs} hak</div><h3>${title || 'Kimi çıkaralım?'}</h3>
      ${outId ? '' : `<div class="cm-sublist" id="cm-out">${out.map((p) => `<button class="cm-sb" data-o="${p.id}"><span class="cm-pos ${p.pos}">${CM_POS[p.pos]}</span><b>${U.esc(p.n)}</b><i class="cm-fit"><i style="width:${p.fit}%"></i></i><em>${Coach.ovr(p)}</em></button>`).join('')}</div><div class="lbl">Yerine</div>`}
      <div class="cm-sublist" id="cm-in">${bench.map((p) => `<button class="cm-sb" data-i="${p.id}"><span class="cm-pos ${p.pos}">${CM_POS[p.pos]}</span><b>${U.esc(p.n)}</b><i class="cm-fit"><i style="width:${p.fit}%"></i></i><em>${Coach.ovr(p)}</em></button>`).join('') || '<p class="muted">Yedekte uygun oyuncu yok.</p>'}</div>`,
    [{ t: 'Vazgeç', cls: 'btn-ghost', fn: () => Live.resume() }], { wide: true });
    U.$$('[data-o]', m).forEach((b) => (b.onclick = () => { pick = +b.dataset.o; U.$$('[data-o]', m).forEach((x) => x.classList.toggle('on', x === b)); }));
    U.$$('[data-i]', m).forEach((b) => (b.onclick = () => {
      if (!pick) return Game.toast('Önce çıkacak oyuncuyu seç.', 'bad');
      m.classList.add('hidden'); m.innerHTML = '';
      Live.sub(pick, +b.dataset.i);
      Live.resume();
    }));
  },
  draw() {
    const L = Live.m;
    let el = document.getElementById('cm-live');
    const [h, a] = L.match.home ? [L.me, L.oc] : [L.oc, L.me];
    if (!el) {
      // iskelet bir kez kurulur; her dakika yalnız değişen parçalar güncellenir (dokunuşlar kaçmasın)
      el = document.createElement('div'); el.id = 'cm-live'; el.className = 'cm-live'; document.body.appendChild(el);
      el.innerHTML = `<div class="cm-sb-top"><small>${U.esc(L.match.name)}</small>
          <div class="cm-score">${UI.shirt(h)}<b>${U.esc(h.short || h.name)}</b><em id="lv-sc">0 - 0</em><b>${U.esc(a.short || a.name)}</b>${UI.shirt(a)}</div>
          <div class="cm-min"><i id="lv-bar"></i><span id="lv-min">0'</span></div></div>
        <div class="cm-ctrl">
          <div class="cm-chips">${Object.entries(CM_STYLES).map(([k, x]) => `<button class="cm-chip sm" data-lst="${k}">${x.t}</button>`).join('')}</div>
          <div class="cm-row"><button class="btn btn-ghost" id="lv-sub">${Icon('squad')} <span>Değişiklik</span> <em id="lv-subn"></em></button>
          <button class="btn btn-ghost" id="lv-speed"></button>
          <button class="btn btn-ghost" id="lv-skip">${Icon('fast')} Sona atla</button></div>
        </div>
        <ul class="cm-feed" id="lv-feed"></ul>
        <button class="btn btn-big hidden" id="lv-done">Devam</button>`;
      U.$$('[data-lst]', el).forEach((b) => (b.onclick = () => { const M = Live.m; if (!M || M.done) return; M.style = b.dataset.lst; Live.log(`Taktik: ${CM_STYLES[M.style].t}`, 'info'); Live.draw(); }));
      el.querySelector('#lv-sub').onclick = () => { const M = Live.m; if (!M || M.done || M.subs <= 0) return; clearTimeout(Live._t); Live.subMenu(null); };
      el.querySelector('#lv-speed').onclick = () => { const M = Live.m; if (!M) return; M.speed = (M.speed % 3) + 1; Live.draw(); };
      el.querySelector('#lv-skip').onclick = () => {
        const M = Live.m; if (!M || M.done) return;
        clearTimeout(Live._t); M.paused = false;
        while (M.min < 90) { Live.tick(); if (M.min === 45 && !M.ht) M.ht = true; if (M.injured) { const p = Live.P(M.injured); M.injured = null; Live.autoSub(p); } }
        Live.draw(); Live.end();
      };
      el.querySelector('#lv-done').onclick = () => Live.finish();
      UI.strip(el);
    }
    const [hs, as] = L.match.home ? [L.gf, L.ga] : [L.ga, L.gf];
    const tired = Live.onField().filter((p) => p.fit < 40).length;
    el.querySelector('#lv-sc').textContent = `${hs} - ${as}`;
    el.querySelector('#lv-bar').style.width = `${(L.min / 90) * 100}%`;
    el.querySelector('#lv-min').textContent = `${L.min}'`;
    U.$$('[data-lst]', el).forEach((b) => b.classList.toggle('on', b.dataset.lst === L.style));
    el.querySelector('#lv-subn').textContent = `(${L.subs})${tired ? ` · ${tired} yorgun` : ''}`;
    el.querySelector('#lv-sub').disabled = L.subs <= 0 || L.done;
    el.querySelector('#lv-skip').disabled = L.done;
    el.querySelector('#lv-speed').textContent = ['1x', '2x', '4x'][L.speed - 1];
    el.querySelector('#lv-done').classList.toggle('hidden', !L.done);
    const fd = el.querySelector('#lv-feed');
    if (fd.childElementCount !== Math.min(L.feed.length, 40) || L.done) {
      fd.innerHTML = L.feed.slice(0, 40).map((f) => `<li class="${f.cls}"><b>${f.m}'</b> ${f.t}</li>`).join('');
      UI.strip(fd);
    }
  },
  end() {
    const L = Live.m;
    if (L.done) return;
    // kupada beraberlik: penaltılar
    if (L.match.comp === 'cup' && L.gf === L.ga) {
      const st = Coach.strength(Live.onField(), Coach.s.form, L.style);
      const pw = U.clamp(0.5 + (st.att - L.opp.att) / 60, 0.3, 0.7);
      let a = 0, b = 0;
      for (let i = 0; i < 5; i++) { if (U.chance(0.72 + (pw - 0.5) * 0.3)) a++; if (U.chance(0.72 - (pw - 0.5) * 0.3)) b++; }
      while (a === b) { if (U.chance(0.7)) a++; if (U.chance(0.7)) b++; }
      L.pens = { a, b, win: a > b };
      Live.log(`Penaltılar: ${a}-${b} · ${a > b ? 'Turu geçtik!' : 'Elendik.'}`, a > b ? 'gf' : 'ga');
    }
    L.done = true;
    Live.log(`Maç bitti: ${L.gf}-${L.ga}`, 'info');
    Live.draw();
  },
  // sonucu kadroya ve kariyere işle
  finish() {
    const L = Live.m, s = Coach.s;
    if (!L.done) Live.end();
    const el = document.getElementById('cm-live'); if (el) el.remove();
    const win = L.pens ? L.pens.win : L.gf > L.ga;
    const played = new Set(L.on.concat(Object.keys(L.rates).map(Number)));
    played.forEach((id) => {
      const p = Live.P(id); if (!p) return;
      p.apps++;
      const r = U.clamp((L.rates[id] || 6.3) + (win ? 0.5 : L.gf === L.ga ? 0 : -0.4) + U.rand(-0.4, 0.4), 4, 10);
      p.form = p.form.concat([+r.toFixed(1)]).slice(-5);
    });
    const res = { gf: L.gf, ga: L.ga, pens: L.pens || null };
    Live.m = null;
    Coach.afterMatch(L.match, res);
    if (!document.getElementById('modal').classList.contains('hidden')) return;
    Game.toast(`${win ? 'Galibiyet' : L.gf === L.ga && !L.pens ? 'Beraberlik' : 'Mağlubiyet'} · ${L.gf}-${L.ga}`, win ? 'good' : '');
  },
};
