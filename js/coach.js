// Teknik Direktör modu (1.0.19) — çekirdek: veri, lig/kupa, kadro, finans, tesisler, transfer, yönetim.
// Ekranlar coachui.js, canlı maç coachlive.js içinde.

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
// haftalık antrenman odağı: sıradaki maça küçük artı ve uzun vadede takım uyumu
const CM_FOCUS = {
  tac: { t: 'Taktik', d: 'Takım uyumu artar.', chem: 3 },
  att: { t: 'Hücum', d: 'Sıradaki maçta hücum gücü +2.', att: 2 },
  def: { t: 'Savunma', d: 'Sıradaki maçta savunma gücü +2.', def: 2 },
  set: { t: 'Duran top', d: 'Penaltı ve frikiklerde başarı artar.', set: 1 },
  fit: { t: 'Kondisyon', d: 'Kondisyon daha hızlı toplanır, sakatlık riski azalır.', fit: 6 },
};
const CM_POS = { GK: 'KL', DF: 'DF', MF: 'OS', FW: 'FV' };
// oyuncu kişilikleri
const CM_PERS = {
  lead: { t: 'Lider', d: 'Kaptan olursa takımın morali ve uyumu artar.' },
  pro: { t: 'Profesyonel', d: 'Daha hızlı gelişir, forma için sorun çıkarmaz.' },
  amb: { t: 'Hırslı', d: 'Çok gelişir ama yedek kalınca çabuk mutsuz olur.' },
  calm: { t: 'Sakin', d: 'Sonuçlardan az etkilenir.' },
  rebel: { t: 'Asi', d: 'Yetenekli ama arada soyunma odasını karıştırır.' },
  norm: { t: 'Dengeli', d: 'Özel bir huyu yok.' },
};
const CM_FAC = {
  train: { t: 'Antrenman tesisi', d: 'Oyuncular daha hızlı gelişir.', ic: 'train' },
  youth: { t: 'Altyapı akademisi', d: 'Altyapıdan daha yetenekli gençler gelir.', ic: 'star' },
  stadium: { t: 'Stadyum', d: 'Kapasite ve bilet geliri artar.', ic: 'fans' },
  medical: { t: 'Sağlık merkezi', d: 'Sakatlıklar daha kısa sürer, daha az olur.', ic: 'injury' },
};

const Coach = {
  KEY: 'starfoot_coach',
  s: null,
  view: 'home',

  // ---------- kayıt ----------
  enabled() { return typeof FEAT_V19 !== 'undefined' && FEAT_V19; },
  saved() { try { const r = Store.read(Coach.KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; } },
  save() { try { if (Coach.s) Store.write(Coach.KEY, JSON.stringify(Coach.s)); } catch (e) { /* depolama yok */ } },
  wipe() { try { Store.remove(Coach.KEY); } catch (e) { /* yok */ } },
  // eski (ilk sürüm) kayıtlara yeni alanları ekler
  migrate(s) {
    s.v = 2;
    s.fac = s.fac || { train: 1, youth: 1, stadium: 1, medical: 1 };
    s.fans = s.fans == null ? 55 : s.fans;
    s.chem = s.chem == null ? 55 : s.chem;
    s.focus = s.focus || 'tac';
    s.cf = s.cf || {};
    s.scout = s.scout || { res: [], watch: [] };
    s.bids = s.bids || [];
    s.pend = s.pend || [];
    s.month = s.month || { w: 0, d: 0, l: 0 };
    s.awards = s.awards || [];
    if (s.keyMom == null) s.keyMom = true;
    if (s.money == null) s.money = Math.round((s.budget || 0) * 2.5 / 1e5) * 1e5;
    if (s.budget == null) s.budget = 0;
    (s.squad || []).forEach((p) => Coach.fillPlayer(p));
    if (!s.cap) Coach.autoRoles();
    if (s.wbudget == null) s.wbudget = Math.round(Coach.wageBill() * 1.15 / 1000) * 1000;
    return s;
  },

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
  // her kulübün tanınmış bir oyuncusu (rakip analizi için, kalıcı)
  starOf(id) {
    const s = Coach.s, c = Coach.club(id);
    if (!s.cl[id] || !s.cl[id].star) Coach.setClub(id, 'star', [World.genName(c.pool), U.pick(['FW', 'FW', 'MF', 'MF', 'DF'])]);
    return s.cl[id].star;
  },

  // ---------- oyuncular ----------
  value(r, age) {
    const f = age <= 21 ? 1.4 : age <= 24 ? 1.2 : age <= 28 ? 1 : age <= 30 ? 0.7 : age <= 32 ? 0.45 : 0.25;
    const v = 900000 * Math.exp((r - 65) / 6.5) * f;
    const m = v > 2e7 ? 1e6 : v > 2e6 ? 1e5 : 25000;
    return Math.max(25000, Math.round(v / m) * m);
  },
  // haftalık maaş (oyuncu kariyeriyle aynı ölçek)
  wageOf(r) { return Math.max(500, Math.round(1500 * Math.pow(1.13, r - 45) / 100) * 100); },
  wageBill() { return (Coach.s.squad || []).reduce((t, p) => t + (p.loan ? 0 : p.wage || 0), 0); },
  fillPlayer(p) {
    if (!p.pers) p.pers = U.weighted(Object.keys(CM_PERS), (k) => ({ norm: 5, pro: 2, amb: 2, calm: 2, lead: 1, rebel: 1 })[k]);
    if (p.wage == null) p.wage = Math.round(Coach.wageOf(p.r) * U.rand(0.85, 1.15) / 100) * 100;
    if (p.yrs == null) p.yrs = U.randi(1, 4);
    if (p.happy == null) p.happy = 65;
    if (p.yel == null) p.yel = 0;
    if (p.motm == null) p.motm = 0;
    return p;
  },
  mkPlayer(o) {
    const s = Coach.s;
    s.pid = (s.pid || 0) + 1;
    const age = o.age || U.randi(18, 33);
    return Coach.fillPlayer({ id: s.pid, n: o.n, pos: o.pos, r: Math.round(o.r), age, pot: o.pot || Math.round(U.clamp(o.r + Math.max(0, 27 - age) * U.rand(0.6, 1.6), o.r, 94)), nat: o.nat || '', fit: 100, mor: 70, inj: 0, g: 0, a: 0, apps: 0, rs: 0, form: [] });
  },
  genSquad(club, year) {
    const ro = World.genRoster(club, year);
    return ro.map((p) => Coach.mkPlayer({ n: p.n, pos: p.pos, r: U.clamp(p.r, 35, 92), age: p.age || U.randi(19, 33), nat: p.nat }));
  },
  ovr(p) { return Math.round(p.r); },
  // isimle birlikte yazılan mevki kısaltması (oyunun diline göre)
  pa(pos) { const t = CM_POS[pos] || pos; try { return typeof I18N !== 'undefined' && I18N.t ? I18N.t(t) : t; } catch (e) { return t; } },
  avg(list) { return list.length ? list.reduce((a, b) => a + b, 0) / list.length : 0; },
  teamRating() {
    const sq = Coach.s.squad.filter((p) => !p.loan).sort((a, b) => b.r - a.r).slice(0, 14);
    return Math.round(Coach.avg(sq.map((p) => p.r)));
  },
  natFlag(code) { const n = Game.nat(code); return n ? n.flag : ''; },
  P(id) { return Coach.s.squad.find((p) => p.id === id); },
  // kaptan ve duran top oyuncuları
  autoRoles() {
    const s = Coach.s, sq = s.squad.filter((p) => !p.loan);
    if (!sq.length) return;
    const cap = sq.slice().sort((a, b) => (b.pers === 'lead') - (a.pers === 'lead') || b.age - a.age || b.r - a.r)[0];
    s.cap = cap.id;
    const shooter = sq.filter((p) => p.pos !== 'GK').sort((a, b) => (b.pos === 'FW') - (a.pos === 'FW') || b.r - a.r)[0];
    s.pk = shooter ? shooter.id : cap.id;
    const fk = sq.filter((p) => p.pos === 'MF' || p.pos === 'FW').sort((a, b) => b.r - a.r)[0];
    s.fk = fk ? fk.id : s.pk;
  },

  // ---------- başlatma ----------
  begin(o) {
    Coach.pending = o;
    Coach.offerPicker(Coach.jobOffers(o.rep, null, 3), 'İlk iş teklifleri', 'Kulüpler seninle görüşmek istiyor. İlk takımını seç:', (id) => Coach.start(o, id));
  },
  start(o, clubId) {
    const year = o.year || 2026;
    Coach.s = {
      v: 2, name: o.name, surname: o.surname, nat: o.nat, age: o.age || 38, rep: o.rep, iq: o.iq || 50, from: o.from || 'new', past: o.past || null,
      year, round: 0, clubId, cl: {}, squad: [], xi: [], form: '4-4-2', style: 'bal', train: 'normal', focus: 'tac',
      budget: 0, money: 0, conf: 65, fans: 55, chem: 55, target: 0, news: [], hist: [], trophies: [], rec: { w: 0, d: 0, l: 0, gf: 0, ga: 0 },
      fac: { train: 1, youth: 1, stadium: 1, medical: 1 }, cf: {}, scout: { res: [], watch: [] }, bids: [], pend: [], month: { w: 0, d: 0, l: 0 }, awards: [], keyMom: true,
      mk: [], cup: null, pid: 0, sacked: 0,
    };
    Coach.joinClub(clubId, true);
    Coach.save();
    Coach.enter();
    const c = Coach.my();
    Game.modal(`<div class="ev-tag">Teknik Direktör</div><h2>${U.esc(c.name)}'a hoş geldin!</h2>
      <p>Yönetim kurulu seni basına tanıttı. Bu sezonki hedef:</p><p><b>${Coach.targetText(Coach.s.target)}</b></p>
      <ul class="tips">
        <li>Kadro sekmesinden ilk 11'i, kaptanı ve duran top oyuncularını seç.</li>
        <li>Maçları küçük sahadan canlı izle: taktik değiştir, oyuncu değiştir, kritik anlarda topu sen vur.</li>
        <li>Gözlemcilerinle oyuncu ara, pazarlık yap, sözleşme imzala.</li>
        <li>Kulüp sekmesinden bütçeyi, maaşları ve tesisleri yönet.</li>
        <li>Yönetimin güveni çok düşerse kovulursun. Başarılı olursan büyük kulüpler kapını çalar.</li>
      </ul>`, [{ t: 'Başlayalım!', cls: 'btn-big' }], { wide: true });
  },
  // kulübe geçiş: kadro, lig, kupa, bütçe ve hedef
  joinClub(id, fresh) {
    const s = Coach.s, c = Coach.club(id);
    s.clubId = id;
    s.squad = Coach.genSquad(c, s.year);
    s.xi = []; Coach.autoPick(); Coach.autoRoles();
    s.money = Math.round(Coach.value(c.rating + 3, 26) * (2.2 + s.rep / 60) / 1e5) * 1e5;
    s.budget = Math.round(s.money * 0.45 / 1e5) * 1e5;
    s.wbudget = Math.round(Coach.wageBill() * 1.12 / 1000) * 1000;
    s.fac = { train: U.clamp(Math.round((c.rating - 50) / 9), 1, 4), youth: U.clamp(Math.round((c.rating - 52) / 9), 1, 4), stadium: U.clamp(Math.round((c.rating - 50) / 9), 1, 4), medical: U.clamp(Math.round((c.rating - 55) / 9), 1, 4) };
    s.build = null;
    s.conf = 65; s.fans = 55; s.chem = 50; s.mk = []; s.bids = []; s.pend = []; s.scout = { res: [], watch: [] };
    Coach.setupLeague(c.league, fresh ? 0 : s.round);
    s.target = Coach.calcTarget();
    s.cupTarget = Coach.calcCupTarget();
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
    s.cf = {};
    if (upto) { upto = Math.max(0, Math.min(upto, s.lg.fixtures.length - 4)); s.round = upto; }
    for (let r = 0; r < Math.min(upto || 0, s.lg.fixtures.length); r++) Coach.simRound(r, true);
    Coach.setupCup(upto || 0);
  },
  rounds() { return Coach.s.lg ? Coach.s.lg.fixtures.length : 34; },
  rating(id) { return id === Coach.s.clubId ? Coach.teamRating() : Coach.club(id).rating; },
  form(id, res) { const s = Coach.s; s.cf[id] = ((s.cf[id] || '') + res).slice(-5); },
  simRound(r, all) {
    const s = Coach.s;
    (s.lg.fixtures[r] || []).forEach(([h, a]) => {
      if (!all && (h === s.clubId || a === s.clubId)) return;
      const [hs, as] = World.simScore(Coach.rating(h), Coach.rating(a));
      World.record(s.lg, h, a, hs, as);
      Coach.form(h, hs > as ? 'G' : hs < as ? 'M' : 'B'); Coach.form(a, as > hs ? 'G' : as < hs ? 'M' : 'B');
    });
  },
  table() { return World.sortedTable(Coach.s.lg); },
  myPos() { return Coach.table().findIndex((r) => r.id === Coach.s.clubId) + 1; },
  calcTarget() {
    const s = Coach.s;
    const ids = s.lg.ids.slice().sort((a, b) => Coach.rating(b) - Coach.rating(a));
    const rank = ids.indexOf(s.clubId) + 1;
    return U.clamp(rank + (rank <= 2 ? 0 : 1), 1, ids.length - 3);
  },
  calcCupTarget() { const r = Coach.s.target; return r <= 2 ? 4 : r <= 6 ? 8 : 16; },
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
    const size = s.lg.ids.length >= 16 ? 16 : 8;
    const others = U.shuffle(s.lg.ids.filter((x) => x !== s.clubId)).slice(0, size - 1);
    const weeks = (size === 16 ? [0.18, 0.36, 0.56, 0.78] : [0.3, 0.55, 0.8]).map((f) => Math.max(2, Math.round(n * f)));
    if (fromRound > weeks[0]) { s.cup = null; return; }
    s.cup = { alive: U.shuffle(others.concat(s.clubId)), weeks, stage: 0, done: false, out: false, name: `${(LEAGUES.find((l) => l.id === s.lg.id) || {}).country || ''} Kupası`.trim() };
  },
  cupStageName(n) { return { 16: 'Son 16', 8: 'Çeyrek Final', 4: 'Yarı Final', 2: 'Final' }[n] || ''; },
  cupDue() { const c = Coach.s.cup; return !!(c && !c.done && !c.out && c.weeks[c.stage] === Coach.s.round + 1 && !c.played); },
  cupOpp() { const c = Coach.s.cup, i = c.alive.indexOf(Coach.s.clubId); return c.alive[i % 2 ? i - 1 : i + 1]; },
  cupAdvance(ourWin) {
    const s = Coach.s, c = s.cup, next = [];
    for (let i = 0; i < c.alive.length; i += 2) {
      const h = c.alive[i], a = c.alive[i + 1];
      let w;
      if (h === s.clubId || a === s.clubId) w = ourWin ? s.clubId : (h === s.clubId ? a : h);
      else { const r = Cups.tie(Coach.rating(h), Coach.rating(a)); w = r.win === 0 ? h : a; }
      next.push(w);
    }
    if (!next.includes(s.clubId) && !c.out) { c.out = true; c.outAt = c.alive.length; }
    c.alive = next; c.stage++; c.played = false;
    if (c.alive.length === 1) {
      c.done = true; c.winner = c.alive[0];
      if (c.winner === s.clubId) { s.trophies.push(`${s.year} ${c.name}`); s.rep = U.clamp(s.rep + 5, 0, 100); s.conf = U.clamp(s.conf + 15, 0, 100); s.fans = U.clamp(s.fans + 15, 0, 100); s.money += Math.round(Coach.value(Coach.my().rating, 26) * 0.8 / 1e5) * 1e5; Coach.news(`🏆 ${c.name} şampiyonu olduk!`, 'good'); }
      else Coach.news(`${c.name}: şampiyon ${Coach.club(c.winner).name}.`, '');
    }
  },

  // ---------- ilk 11 ve güç ----------
  available(p) { return !!p && !p.inj && !p.sus && !p.loan; },
  autoPick() {
    const s = Coach.s, f = CM_FORMS[s.form];
    const ok = s.squad.filter(Coach.available);
    const score = (p) => p.r * (0.85 + 0.15 * p.fit / 100);
    const by = (pos) => ok.filter((p) => p.pos === pos).sort((a, b) => score(b) - score(a));
    const xi = [];
    const take = (pos, n) => by(pos).filter((p) => !xi.includes(p.id)).slice(0, n).forEach((p) => xi.push(p.id));
    take('GK', 1); take('DF', f.DF); take('MF', f.MF); take('FW', f.FW);
    ok.filter((p) => !xi.includes(p.id) && p.pos !== 'GK').sort((a, b) => score(b) - score(a)).forEach((p) => { if (xi.length < 11) xi.push(p.id); });
    s.xi = xi.slice(0, 11);
  },
  rotate() {
    const s = Coach.s;
    if (s.rot === false) return;
    s.xi.slice().forEach((id) => {
      const p = Coach.P(id);
      if (!p || p.fit >= 62) return;
      const b = s.squad.filter((x) => x.pos === p.pos && !s.xi.includes(x.id) && Coach.available(x) && x.fit >= 80 && x.r >= p.r - 7).sort((a, c) => c.r - a.r)[0];
      if (b) s.xi = s.xi.map((x) => (x === id ? b.id : x));
    });
  },
  xiPlayers() { return Coach.s.xi.map(Coach.P).filter(Boolean); },
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
  // kondisyon: 85 civarı nötr; dinç oyuncu biraz daha iyi, 55'in altı belirgin düşüş (değişiklik gerektirir)
  eff(x) { const p = x.p, f = U.clamp(p.fit, 0, 100); return (p.r - x.pen) * (1 + (f - 85) * 0.002 - (f < 55 ? (55 - f) * 0.004 : 0)) * (0.98 + 0.04 * p.mor / 100); },
  // takım uyumu ve kaptan etkisi dahil güç
  strength(list, form, style, mods) {
    const s = Coach.s;
    const a = Coach.assign(list, form);
    const g = (slot) => Coach.avg(a.filter((x) => x.slot === slot).map(Coach.eff)) || 40;
    const f = CM_FORMS[form], st = CM_STYLES[style];
    const short = Math.max(0, 11 - list.length) * 3.5;
    const chem = ((s.chem == null ? 50 : s.chem) - 50) / 25;
    const cp = Coach.P(s.cap);
    const cap = list.some((p) => p.id === s.cap) ? (cp && cp.pers === 'lead' ? 1 : 0.4) : 0;
    let att = g('FW') * 0.48 + g('MF') * 0.37 + g('DF') * 0.15 + f.att + st.att - short + chem + cap;
    let def = g('DF') * 0.45 + g('GK') * 0.25 + g('MF') * 0.3 + f.def + st.def - short + chem + cap;
    if (mods) { att += mods.att || 0; def += mods.def || 0; }
    return { att, def };
  },
  oppTeam(id) {
    const r = Coach.rating(id) + U.rand(-1.5, 1.5);
    const st = Coach.oppStyle(id);
    const S = CM_STYLES[st];
    return { id, att: r + S.att, def: r + S.def, style: st };
  },
  // rakibin oyun anlayışı (o hafta için sabit; rakip analizinde gösterilir)
  oppStyle(id) {
    const s = Coach.s, key = `${s.year}-${s.round}-${id}`;
    if (s.oppSt && s.oppSt.k === key) return s.oppSt.v;
    const r = Coach.rating(id), me = Coach.teamRating();
    const v = r > me + 3 ? U.pick(['att', 'press', 'att']) : r < me - 4 ? U.pick(['def', 'counter', 'def']) : U.pick(['bal', 'bal', 'press', 'att', 'counter']);
    s.oppSt = { k: key, v };
    return v;
  },

  // ---------- haftalık akış ----------
  nextMatch() {
    const s = Coach.s;
    if (s.jobless || s.round >= Coach.rounds()) return null;
    if (Coach.cupDue()) { const o = Coach.cupOpp(); return { comp: 'cup', opp: o, home: ((s.round + o.length) % 2) === 0, name: `${s.cup.name} · ${Coach.cupStageName(s.cup.alive.length)}` }; }
    const fx = s.lg.fixtures[s.round].find((m) => m.includes(s.clubId));
    if (!fx) return { comp: 'bye' };
    return { comp: 'lg', opp: fx[0] === s.clubId ? fx[1] : fx[0], home: fx[0] === s.clubId, name: `${Coach.lgName(s.lg.id)} · ${s.round + 1}. hafta` };
  },
  afterMatch(m, res) {
    const s = Coach.s, my = s.clubId;
    const gf = res.gf, ga = res.ga;
    if (m.comp === 'lg') {
      const [h, a] = m.home ? [my, m.opp] : [m.opp, my];
      World.record(s.lg, h, a, m.home ? gf : ga, m.home ? ga : gf);
      (res.scorers || []).forEach((n) => World.addScorer(s.lg, n, my));
    }
    const win = res.pens ? res.pens.win : gf > ga, draw = !res.pens && gf === ga;
    Coach.form(my, win ? 'G' : draw ? 'B' : 'M'); Coach.form(m.opp, win ? 'M' : draw ? 'B' : 'G');
    s.rec.gf += gf; s.rec.ga += ga;
    if (win) { s.rec.w++; s.stint.w++; s.month.w++; } else if (draw) { s.rec.d++; s.stint.d++; s.month.d++; } else { s.rec.l++; s.stint.l++; s.month.l++; }
    const diff = Coach.teamRating() - Coach.rating(m.opp) + (m.home ? 2 : -2);
    const exp = U.clamp(0.5 + diff / 30, 0.2, 0.8);
    const got = win ? 1 : draw ? 0.45 : 0;
    // FM gibi: maç sonucu küçük etki, asıl belirleyici ligdeki sıranın hedefe göre durumu
    const tgt = m.comp === 'lg' && s.round >= 6 ? U.clamp((s.target - Coach.myPos()) * 0.6, -2, 2) : 0;
    s.conf = U.clamp(s.conf + (got - exp) * (m.comp === 'cup' ? 4 : 5) + tgt + (60 - s.conf) * 0.03, 0, 100);
    s.fans = U.clamp(s.fans + (got - exp) * 5 + (gf >= 3 ? 1 : 0) + tgt * 0.5 + (55 - s.fans) * 0.04, 0, 100);
    s.rep = U.clamp(s.rep + (got - exp) * 0.6, 0, 100);
    s.squad.forEach((p) => { const k = p.pers === 'calm' ? 0.5 : 1; p.mor = U.clamp(p.mor + (win ? 3 : draw ? 0 : -3) * k, 25, 100); });
    if (m.home) { const t = Coach.ticketIncome(); s.money += t; s.lastGate = t; }
    const opp = Coach.club(m.opp);
    const sc = `${gf}-${ga}${res.pens ? ` (pen. ${res.pens.a}-${res.pens.b})` : ''}`;
    Coach.news(`${win ? '✅' : draw ? '➖' : '❌'} ${m.comp === 'cup' ? `${m.name} · ` : ''}${opp.name} maçı: ${sc}`, win ? 'good' : draw ? '' : 'bad');
    s.last = { opp: m.opp, gf, ga, home: m.home, comp: m.comp, pens: res.pens || null, motm: res.motm || null };
    s.boost = null;
    if (m.comp === 'cup') { s.cup.played = true; Coach.cupAdvance(win); }
    else Coach.week();
    Coach.save();
  },
  ticketIncome() {
    const s = Coach.s, c = Coach.my();
    const att = U.clamp(0.45 + s.fans / 200 + (Coach.myPos() <= 4 ? 0.08 : 0), 0.3, 1);
    const price = 8 + (c.rating - 45) * 0.9 * Coach.lgInfo(c.league).fame;
    return Math.round(Coach.capacity() * att * price / 1000) * 1000;
  },
  capacity() { const s = Coach.s, c = Coach.my(); return Math.round((6000 + (c.rating - 45) * 1300) * (1 + 0.15 * (s.fac.stadium - 1)) / 100) * 100; },
  sponsorWeekly() { const c = Coach.my(); return Math.round(Coach.wageOf(c.rating) * 3.5 * Coach.lgInfo(c.league).fame / 100) * 100; },
  week() {
    const s = Coach.s, T = CM_TRAIN[s.train], F = CM_FOCUS[s.focus] || {};
    Coach.simRound(s.round, false);
    if (s.cup && !s.cup.done && s.cup.weeks[s.cup.stage] === s.round + 1 && (s.cup.out || !s.cup.played)) Coach.cupAdvance(false);
    s.round++;
    s.money += Coach.sponsorWeekly() - Coach.wageBill();
    if (s.build) { s.build.w--; if (s.build.w <= 0) { s.fac[s.build.k]++; Coach.news(`🏗️ ${CM_FAC[s.build.k].t} seviye ${s.fac[s.build.k]} oldu!`, 'good'); s.build = null; } }
    const trainF = 1 + 0.12 * (s.fac.train - 1), medF = 1 - 0.1 * (s.fac.medical - 1);
    const xiSet = new Set(s.xi);
    const avgR = Coach.teamRating();
    s.squad.forEach((p) => {
      p.fit = U.clamp(p.fit + T.fit + (F.fit || 0), 0, 100);
      if (p.inj > 0) { p.inj--; if (!p.inj) Coach.news(`💪 ${Coach.pa(p.pos)} ${p.n} sakatlığını atlattı.`, 'good'); }
      if (p.sus > 0) p.sus--;
      const growK = (p.pers === 'pro' ? 1.25 : p.pers === 'amb' ? 1.15 : 1) * (p.loan ? 1.4 : 1);
      if (p.age <= 24 && p.r < p.pot) p.r = Math.min(p.pot, p.r + (p.pot - p.r) * 0.012 * T.grow * trainF * growK * (1 + (s.iq - 50) / 200));
      if (!p.inj && !p.loan && U.chance(0.004 * T.inj * medF * (s.focus === 'fit' ? 0.6 : 1))) { p.inj = Math.max(1, Math.round(U.randi(1, 3) * medF)); Coach.news(`🤕 ${Coach.pa(p.pos)} ${p.n} antrenmanda sakatlandı (${p.inj} hafta).`, 'bad'); }
      p.mor += (65 - p.mor) * 0.1;
      if (!p.loan) {
        const important = p.r >= avgR - 2;
        if (xiSet.has(p.id)) p.happy = U.clamp(p.happy + 2, 0, 100);
        else if (important && !p.inj) p.happy = U.clamp(p.happy - (p.pers === 'amb' ? 5 : p.pers === 'pro' ? 1 : 3), 0, 100);
        else p.happy += (60 - p.happy) * 0.05;
        if (p.promise && p.promise.w > 0) {
          p.promise.w--;
          if (xiSet.has(p.id)) p.promise.ok = (p.promise.ok || 0) + 1;
          if (!p.promise.w) { if ((p.promise.ok || 0) < 2) { p.happy = U.clamp(p.happy - 30, 0, 100); Coach.news(`😠 ${p.n} verdiğin forma sözünü tutmadığını düşünüyor.`, 'bad'); s.chem = U.clamp(s.chem - 4, 0, 100); } p.promise = null; }
        }
      }
    });
    const cp = Coach.P(s.cap);
    s.chem = U.clamp(s.chem + (F.chem || 0) * 0.3 + (s.xiPrev && s.xi.filter((x) => s.xiPrev.includes(x)).length >= 9 ? 0.35 : -0.4) + (cp && cp.pers === 'lead' ? 0.15 : 0) + (55 - s.chem) * 0.05, 0, 100);
    s.xiPrev = s.xi.slice();
    s.boost = { att: F.att || 0, def: F.def || 0, set: F.set || 0 };
    if (s.xi.some((id) => !Coach.available(Coach.P(id)))) Coach.autoPick();
    Coach.market();
    Coach.events();
    if (s.round % 4 === 0) {
      const m = s.month;
      // Ayın Teknik Direktörü: ligde son 4 haftanın en çok puan toplayan takımı (eşitlikte kura)
      const pts = (id) => (s.cf[id] || '').slice(-4).split('').reduce((t, r) => t + (r === 'G' ? 3 : r === 'B' ? 1 : 0), 0);
      const mine = m.w * 3 + m.d, rival = Math.max(0, ...s.lg.ids.filter((id) => id !== s.clubId).map(pts));
      if (mine >= 9 && m.l === 0 && (mine > rival || (mine === rival && U.chance(0.4)))) { const [mo, yr] = Coach.monthOf(s.round - 1); s.awards.push(`${mo} ${yr} · Ayın Teknik Direktörü`); s.rep = U.clamp(s.rep + 2, 0, 100); Coach.news(`🏅 ${mo} ${yr} ayının teknik direktörü seçildin!`, 'good'); }
      s.month = { w: 0, d: 0, l: 0 };
    }
    if (s.round >= Coach.rounds()) Coach.seasonEnd();
  },
  // sezon takvimi: Ağustos'tan Mayıs'a 10 ay; hafta → [ay adı, yıl]
  monthOf(r) {
    const s = Coach.s, M = ['Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs'];
    const i = U.clamp(Math.floor((Math.max(0, r) / Math.max(1, Coach.rounds())) * 10), 0, 9);
    return [M[i], i >= 5 ? s.year + 1 : s.year];
  },
  window() { const s = Coach.s, n = Coach.rounds(), mid = Math.floor(n / 2); return s.round < 5 || (s.round >= mid && s.round < mid + 4); },

  // ---------- haftalık olaylar (bekleyen kararlar) ----------
  events() {
    const s = Coach.s;
    s.pend = s.pend || [];
    const sad = s.squad.find((p) => !p.loan && p.happy < 25 && !p.promise && !p.asked);
    if (sad) { sad.asked = 1; s.pend.push({ k: 'unhappy', id: sad.id }); }
    const reb = s.squad.find((p) => p.pers === 'rebel' && !p.loan && U.chance(0.03));
    if (reb) s.pend.push({ k: 'rebel', id: reb.id });
    if (s.round > Coach.rounds() / 2) {
      const ex = s.squad.find((p) => !p.loan && p.yrs <= 1 && !p.renewAsk && p.r >= Coach.teamRating() - 6);
      if (ex && U.chance(0.35)) { ex.renewAsk = 1; s.pend.push({ k: 'renew', id: ex.id }); }
    }
    if (Coach.window() && U.chance(0.35) && s.squad.filter((p) => !p.loan).length > 19) {
      const cands = s.squad.filter((p) => !p.loan && p.r >= Coach.teamRating() - 3);
      if (cands.length) {
        const p = U.weighted(cands, (x) => Math.pow(x.r / 60, 4));
        const buyers = CLUB_LIST.filter((c) => c[0] !== s.clubId && c[4] >= p.r - 6);
        const buyer = buyers.length ? U.pick(buyers) : null;
        if (buyer) s.pend.push({ k: 'bid', id: p.id, club: buyer[0], fee: Math.round(Coach.value(p.r, p.age) * U.rand(0.85, 1.35) / 25000) * 25000 });
      }
    }
    if (s.conf < 30 && !s.warned) { s.warned = 1; s.pend.push({ k: 'board' }); }
    if (s.conf > 40) s.warned = 0;
    // cevapsız kalan kararlar: teklifler 2 hafta sonra ya da dönem kapanınca düşer, diğerleri 4 hafta sonra
    s.pend.forEach((e) => { if (e.w == null) e.w = s.round; });
    s.pend = s.pend.filter((e, i, a) => {
      const age = s.round - e.w;
      if (e.k === 'bid' && (!Coach.window() || age > 2)) return false;
      if (age > 4) { const p = e.id ? Coach.P(e.id) : null; if (p && e.k !== 'bid') p.happy = U.clamp(p.happy - 5, 0, 100); return false; }
      return a.findIndex((x) => x.k === e.k && x.id === e.id) === i;
    }).slice(-8);
  },

  // ---------- transfer: gözlemci ağı ----------
  scoutSearch(o) {
    const s = Coach.s, c = Coach.my(), tr = Coach.teamRating();
    const res = [];
    for (let i = 0; i < 8; i++) {
      const pos = o.pos && o.pos !== 'all' ? o.pos : U.pick(['GK', 'DF', 'DF', 'MF', 'MF', 'FW', 'FW']);
      const fr = U.chance(0.5) ? World.foreign(c.pool) : null;
      const maxAge = o.age || 33;
      const age = U.randi(17, Math.max(18, maxAge));
      const r = Math.round(U.clamp(tr + U.randi(-9, 8) + (s.rep - 40) / 15 - (age <= 20 ? 6 : 0), 40, 90));
      const p = Coach.mkPlayer({ n: World.genName(fr ? fr.pool : c.pool), pos, r, age, nat: fr ? fr.nat : POOL_NAT[c.pool] || '' });
      p.price = Math.round(Coach.value(r, age) * U.rand(0.9, 1.3) / 25000) * 25000;
      if (o.max && p.price > o.max) { p.price = Math.max(25000, Math.round(o.max * U.rand(0.6, 1) / 25000) * 25000); p.r = Math.max(40, p.r - U.randi(2, 6)); p.pot = Math.max(p.r, p.pot - 3); }
      p.club = U.pick(CLUB_LIST.filter((x) => x[0] !== s.clubId))[0];
      p.known = 0;
      res.push(p);
    }
    s.scout.res = res.sort((a, b) => b.r - a.r);
    Coach.save();
  },
  scoutWatch(id) {
    const s = Coach.s, p = s.scout.res.find((x) => x.id === id);
    if (!p || p.known) return;
    if (s.scout.watch.length >= 3) return Game.toast('Gözlemcilerin aynı anda en fazla 3 oyuncuyu izleyebilir.', 'bad');
    p.known = 0.5;
    s.scout.watch.push(id);
    Coach.news(`🔎 Gözlemcin ${p.n} için rapor hazırlıyor (1 hafta).`, '');
    Coach.save();
  },
  scoutTick() {
    const s = Coach.s;
    (s.scout.watch || []).forEach((id) => { const p = s.scout.res.find((x) => x.id === id); if (p) { p.known = 1; Coach.news(`📋 Gözlemci raporu hazır: ${p.n}`, 'good'); } });
    s.scout.watch = [];
  },
  potStars(p) {
    const st = (v) => Math.max(1, Math.min(5, Math.round((v - 50) / 9)));
    if (p.known === 1 || p.known == null) return '★'.repeat(st(p.pot)) + '☆'.repeat(5 - st(p.pot));
    const lo = st(Math.max(p.r, p.pot - 7)), hi = st(Math.min(99, p.pot + 7));
    return `${lo}–${hi} ★`;
  },
  market() {
    const s = Coach.s;
    Coach.scoutTick();
    if (!Coach.window()) { s.mk = []; return; }
    if (!s.mk.length) {
      const c = Coach.my(), tr = Coach.teamRating();
      for (let i = 0; i < 4; i++) {
        const age = U.randi(27, 34);
        const p = Coach.mkPlayer({ n: World.genName(World.foreign(c.pool).pool), pos: U.pick(['DF', 'MF', 'FW', 'GK']), r: U.clamp(tr + U.randi(-8, 2), 40, 85), age });
        p.price = 0; p.free = 1; p.club = null; p.known = 1;
        s.mk.push(p);
      }
    }
  },
  clubReply(p, offer) {
    const ratio = offer / Math.max(1, p.price);
    if (ratio >= 1) return 'yes';
    if (ratio >= 0.85) return U.chance(0.35 + (ratio - 0.85) * 3) ? 'yes' : 'counter';
    if (ratio >= 0.7) return U.chance(0.5) ? 'counter' : 'no';
    return 'no';
  },
  wageAsk(p) {
    const big = (p.r - Coach.teamRating()) * 0.03;
    return Math.round(Coach.wageOf(p.r) * U.clamp(1.05 + big, 0.9, 1.6) / 100) * 100;
  },
  willSign(p, wage) {
    const ask = p.ask || Coach.wageAsk(p);
    const s = Coach.s;
    const prestige = (Coach.my().rating - p.r + 4) * 0.05 + (s.rep - 40) / 150;
    return U.clamp(0.35 + (wage / ask - 1) * 2.2 + prestige, 0.05, 0.97);
  },
  sign(p, fee, wage, yrs) {
    const s = Coach.s;
    s.budget -= fee; s.money -= fee;
    p.wage = wage; p.yrs = yrs; p.mor = 80; p.happy = 75;
    delete p.price; delete p.club; delete p.known; delete p.ask; delete p.free;
    s.squad.push(p);
    s.scout.res = s.scout.res.filter((x) => x.id !== p.id);
    s.mk = s.mk.filter((x) => x.id !== p.id);
    s.chem = U.clamp(s.chem - 2, 0, 100);
    Coach.news(fee ? `✍️ ${Coach.pa(p.pos)} ${p.n} kadromuza katıldı (${U.money(fee)}).` : `✍️ ${Coach.pa(p.pos)} ${p.n} bedelsiz olarak kadromuza katıldı.`, 'good');
    Coach.save();
  },
  sellTo(p, club, fee) {
    const s = Coach.s;
    s.budget += Math.round(fee * 0.7 / 25000) * 25000; s.money += fee;
    s.squad = s.squad.filter((x) => x.id !== p.id); s.xi = s.xi.filter((x) => x !== p.id);
    if (s.xi.length < 11) Coach.autoPick();
    if ([s.cap, s.pk, s.fk].includes(p.id)) Coach.autoRoles();
    s.chem = U.clamp(s.chem - 1, 0, 100);
    Coach.news(`👋 ${Coach.pa(p.pos)} ${p.n}, ${U.money(fee)} karşılığında ${Coach.club(club).name}'a satıldı.`, '');
    Coach.save();
  },
  loanOut(p) {
    const s = Coach.s;
    const cands = CLUB_LIST.filter((c) => c[0] !== s.clubId && c[4] < Coach.my().rating);
    p.loan = 1; p.loanClub = (cands.length ? U.pick(cands) : U.pick(CLUB_LIST))[0];
    s.xi = s.xi.filter((x) => x !== p.id);
    if (s.xi.length < 11) Coach.autoPick();
    if ([s.cap, s.pk, s.fk].includes(p.id)) Coach.autoRoles();
    Coach.news(`🔁 ${p.n}, sezon sonuna kadar ${Coach.club(p.loanClub).name}'a kiralandı.`, '');
    Coach.save();
  },

  // ---------- tesisler ----------
  facCost(k) { const s = Coach.s; return Math.round(Coach.value(Coach.my().rating, 26) * 0.5 * s.fac[k] / 1e5) * 1e5; },
  build(k) {
    const s = Coach.s;
    if (s.build) return Game.toast('Zaten bir inşaat sürüyor.', 'bad');
    if (s.fac[k] >= 5) return Game.toast('Bu tesis en üst seviyede.', 'info');
    const cost = Coach.facCost(k);
    if (s.money < cost) return Game.toast('Kulübün kasasında yeterli para yok.', 'bad');
    s.money -= cost;
    s.build = { k, w: 3 + s.fac[k] * 2 };
    Coach.news(`🏗️ ${CM_FAC[k].t} genişletmesi başladı (${s.build.w} hafta).`, '');
    Coach.save();
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
    s.pend = [];
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
  jobOffers(rep, exclude, n) {
    const lvl = 46 + rep * 0.36;
    const all = CLUB_LIST.filter((c) => c[0] !== exclude && LEAGUES.some((l) => l.id === c[3]));
    const near = all.filter((c) => c[4] <= lvl + 3 && c[4] >= lvl - 8);
    const pool = near.length >= n ? near : all.slice().sort((a, b) => Math.abs(a[4] - lvl) - Math.abs(b[4] - lvl)).slice(0, 12);
    return U.shuffle(pool.slice()).slice(0, n).map((c) => c[0]).sort((a, b) => Coach.base(b).rating - Coach.base(a).rating);
  },

  // ---------- sezon sonu ----------
  seasonEnd() {
    const s = Coach.s, pos = Coach.myPos(), n = s.lg.ids.length, c = Coach.my(), L = Coach.lgInfo(c.league);
    const champ = pos === 1;
    if (champ) { s.trophies.push(`${s.year} ${Coach.lgName(c.league)}`); Coach.news(`🏆 ${Coach.lgName(c.league)} şampiyonu olduk!`, 'good'); }
    const beat = s.target - pos;
    const cupBeat = s.cup ? ((s.cup.done && s.cup.winner === s.clubId) ? 1 : (s.cup.outAt || 1) <= (s.cupTarget || 8) ? 0.5 : -0.5) : 0;
    s.rep = U.clamp(s.rep + beat * 1.6 + cupBeat + (champ ? 8 * L.fame : 0) - (pos > n - 3 ? 4 : 0), 0, 100);
    s.conf = U.clamp(s.conf + beat * 7 + cupBeat * 6 + (champ ? 20 : 0) + (s.money < 0 ? -12 : 0), 0, 100);
    const prize = Math.round(Coach.value(c.rating, 26) * (0.6 + (n - pos) / n) * L.fame / 1e5) * 1e5;
    s.money += prize;
    const sq = s.squad.filter((p) => p.apps >= 5);
    const avgOf = (p) => p.rs / Math.max(1, p.apps);
    const top = sq.slice().sort((a, b) => b.g - a.g)[0];
    const best = sq.slice().sort((a, b) => avgOf(b) - avgOf(a))[0];
    const young = sq.filter((p) => p.age <= 21).sort((a, b) => avgOf(b) - avgOf(a))[0];
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
    s.lastSeason = { year: s.year, pos, n, target: s.target, champ, club: s.clubId, lg: c.league, moved, w: s.stint.w, d: s.stint.d, l: s.stint.l, prize,
      top: top && top.g ? [top.n, top.g] : null, best: best ? [best.n, +avgOf(best).toFixed(2)] : null, young: young ? young.n : null };
    s.seasons = (s.seasons || []).concat([{ y: s.year, club: s.clubId, lg: c.league, pos, n }]).slice(-30);
    s.phase = 'end';
    s.pend = [];
    Coach.save();
  },
  newSeason(moveTo) {
    const s = Coach.s;
    if (moveTo && moveTo !== s.clubId) Coach.closeStint('Ayrıldı');
    s.year++; s.age++; s.round = 0; s.phase = null; s.cup = null;
    CLUB_LIST.forEach((x) => { if (x[0] !== s.clubId && U.chance(0.35)) Coach.setClub(x[0], 'rating', U.clamp(Coach.club(x[0]).rating + U.randi(-2, 2), 38, 90)); });
    if (moveTo && moveTo !== s.clubId) {
      Coach.joinClub(moveTo, true);
    } else {
      const gone = [];
      s.squad.forEach((p) => {
        p.age++;
        const d = p.age <= 23 ? U.randi(1, 4) : p.age <= 29 ? U.randi(-1, 2) : p.age <= 32 ? U.randi(-3, 0) : U.randi(-5, -1);
        p.r = U.clamp(Math.min(p.r + d, Math.max(p.pot, p.r)), 30, 94);
        p.g = 0; p.a = 0; p.apps = 0; p.rs = 0; p.form = []; p.fit = 100; p.inj = 0; p.sus = 0; p.yel = 0; p.motm = 0; p.asked = 0; p.renewAsk = 0;
        if (p.loan) { p.loan = 0; p.loanClub = null; Coach.news(`🔁 ${p.n} kiralıktan döndü (güç ${Math.round(p.r)}).`, ''); }
        p.yrs--;
        if (p.yrs <= 0) gone.push([p, 'free']);
        else if (p.age >= 34 && U.chance(0.35 + (p.age - 34) * 0.2)) gone.push([p, 'ret']);
      });
      gone.forEach(([p, w]) => Coach.news(w === 'free' ? `📄 ${p.n} sözleşmesi bittiği için kulüpten ayrıldı.` : `👋 ${p.n} ${p.age} yaşında futbolu bıraktı.`, ''));
      s.squad = s.squad.filter((p) => !gone.some((g) => g[0] === p));
      const c = Coach.my(), tr = Coach.teamRating();
      const yq = (s.fac.youth - 1) * 2.5;
      const nYouth = Math.max(2 + (s.fac.youth >= 4 ? 1 : 0), 20 - s.squad.length);
      const added = [];
      for (let i = 0; i < nYouth; i++) {
        const yp = Coach.mkPlayer({ n: World.genName(c.pool), pos: U.pick(['DF', 'MF', 'FW', 'MF', 'GK', 'DF']), r: tr - U.randi(9, 16) + yq * 0.5, age: 17, nat: POOL_NAT[c.pool] || '' });
        yp.pot = Math.round(U.randi(tr - 2, tr + 12) + yq);
        yp.wage = Math.round(Coach.wageOf(yp.r) * 0.5 / 100) * 100; yp.yrs = 3;
        s.squad.push(yp); added.push(yp.n);
      }
      Coach.news(`🌱 Altyapıdan ${added.join(', ')} A takıma yükseldi.`, 'good');
      s.budget = Math.max(0, Math.round(Math.max(0, s.money) * (0.35 + s.conf / 400) / 1e5) * 1e5);
      s.wbudget = Math.round(Math.max(Coach.wageBill(), Coach.wageBill() * (1 + (s.conf - 50) / 300)) * 1.1 / 1000) * 1000;
      Coach.setupLeague(c.league, 0);
      s.target = Coach.calcTarget();
      s.cupTarget = Coach.calcCupTarget();
      s.conf = U.clamp(s.conf * 0.5 + 35, 30, 85);
      s.stint.from = s.stint.from || s.year;
      Coach.autoPick();
      if (!Coach.P(s.cap)) Coach.autoRoles();
    }
    s.mk = []; s.scout = { res: [], watch: [] }; s.bids = []; s.pend = [];
    Coach.market();
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
  news(t, type) { const s = Coach.s; s.news.unshift({ t, type: type || '', y: s.year, r: s.round }); s.news = s.news.slice(0, 40); },

  // ---------- giriş/çıkış ----------
  enter() {
    Game.state = null;
    Coach.migrate(Coach.s);
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
  fromPlayer(p, legend) {
    const o = { name: p.name, surname: p.surname, nat: p.nation, age: p.age + 1, rep: U.clamp(Math.round(18 + legend / 25 + (p.iq || 50) / 10 + (p.uni && p.uni.done ? 6 : 0)), 15, 75), iq: p.iq || 55, from: 'player', past: { trophies: (p.trophies || []).length, apps: p.totals ? p.totals.apps : 0 } };
    Coach.begin(o);
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
  play(quick) {
    const m = Coach.nextMatch();
    if (!m) return;
    if (m.comp === 'bye') { Coach.week(); Coach.save(); return Coach.render(); }
    if (Coach.xiPlayers().length < 11) Coach.autoPick();
    Coach.rotate();
    Live.start(m, quick);
  },
};
