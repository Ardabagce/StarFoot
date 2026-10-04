// Yaşam: aile, ilişkiler, gece hayatı, kumarhane, bahis (FIFA cezası), menajer ve sponsorluklar

const GF_NAMES = ['Elif', 'Zeynep', 'Defne', 'Ece', 'Selin', 'Melis', 'Ada', 'Lara', 'Sofia', 'Camila', 'Emma', 'Mia', 'Chloe', 'Isabella', 'Lucía', 'Giulia', 'Hannah', 'Léa', 'Ana', 'Yuki', 'Nora', 'Asya', 'Derin', 'İrem'];
const GF_JOBS = ['model', 'dizi oyuncusu', 'şarkıcı', 'mimar', 'doktor', 'avukat', 'sosyal medya fenomeni', 'moda tasarımcısı', 'öğretmen', 'voleybolcu', 'spor muhabiri', 'yazılımcı'];
const BRANDS = [
  { id: 'strk', name: 'Strikr', kind: 'boot', l: 'krampon markası', c1: '#111111', c2: '#d7ff3a', fame: 10, m: 1 },
  { id: 'volt', name: 'VoltX', kind: 'drink', l: 'enerji içeceği', c1: '#1b1464', c2: '#00e5ff', fame: 14, m: 0.9 },
  { id: 'nova', name: 'Nova Mobil', kind: 'phone', l: 'telefon markası', c1: '#0b1f4d', c2: '#ff4fa3', fame: 22, m: 1.2 },
  { id: 'kron', name: 'Kronos', kind: 'watch', l: 'saat markası', c1: '#1d1d1b', c2: '#c9a063', fame: 35, m: 1.6 },
  { id: 'aero', name: 'Aero Ses', kind: 'phones', l: 'kulaklık markası', c1: '#f4f4f4', c2: '#e11d48', fame: 18, m: 1 },
  { id: 'trbo', name: 'Turbo Motors', kind: 'car', l: 'otomobil markası', c1: '#7a0a0a', c2: '#ffffff', fame: 45, m: 2 },
  { id: 'fitl', name: 'FitLife', kind: 'drink', l: 'sporcu gıdası', c1: '#2fbf71', c2: '#ffffff', fame: 8, m: 0.7 },
  { id: 'aurm', name: 'Aurum Bank', kind: 'card', l: 'banka', c1: '#0b2a5a', c2: '#ffd84a', fame: 55, m: 2.4 },
];
const MGR_NAMES = ['Ahmet "Tilki" Bulut', 'Jorge Mendoza', 'Mino Rayola', 'Pini Zahavo', 'Kerem Aksoy', 'Federico Pastorelli', 'Volkan Demirel', 'Jonathan Barnet', 'Rafaela Pimenta', 'Selim Kaplan'];
const SOCIAL_SPONSOR = ['Bu ürün olmadan antrenmana çıkmıyorum! #reklam', 'Yeni sezona yeni ortaklık. #işbirliği', 'Kalite bir yaşam tarzı. #reklam', 'Detaylar fark yaratır. #sponsor'];

const Life = {
  ensure(p) {
    if (!p.life) p.life = { gf: null, exes: 0, manager: null, sponsors: [], offers: [], mgrCands: null, heat: 0, probe: 0, ban: 0, bans: 0, bets: [], nights: 0, casino: 0 };
    if (p.rel.family == null) p.rel.family = 72;
    return p.life;
  },
  adult(p) { return (p || Game.p).age >= 18; },
  banned() { const L = Game.p && Game.p.life; return !!(L && L.ban > 0); },

  // Aylık maaş yerine haftalık: sponsor geliri ve menajer payı
  sponsorIncome(p) { return Life.ensure(p).sponsors.reduce((t, x) => t + x.weekly, 0); },
  managerCut(p) {
    const L = Life.ensure(p);
    return L.manager ? Math.round((Game.weeklyIncome() + Life.sponsorIncome(p)) * L.manager.cut) : 0;
  },
  mgrQ() { const L = Game.p && Game.p.life; return L && L.manager ? L.manager.q : 0; },

  // ---------- haftalık akış ----------
  week(s) {
    const p = s.player, L = Life.ensure(p);
    // sponsor geliri ve menajer payı
    const sp = Life.sponsorIncome(p), cut = Life.managerCut(p);
    p.money += sp - cut;
    L.sponsors.forEach((x) => (x.weeks -= 1));
    L.sponsors.filter((x) => x.weeks <= 0).forEach((x) => Game.news(`${x.name} ile sponsorluk anlaşman sona erdi.`, 'me'));
    L.sponsors = L.sponsors.filter((x) => x.weeks > 0);
    if (L.sponsors.length && U.chance(0.12)) {
      const b = U.pick(L.sponsors);
      Social.post('sponsor', `${b.name}: ${U.pick(SOCIAL_SPONSOR)}`, 1.2, { c1: b.c1, c2: b.c2, short: b.name, loc: b.name, brand: b.kind });
    }
    // aile ve ilişki zamanla zayıflar
    p.rel.family = U.clamp(p.rel.family - 0.6, 0, 100);
    if (p.rel.family < 30) Player.addMorale(p, -1);
    else if (p.rel.family > 75) Player.addMorale(p, 0.5);
    if (L.gf) {
      L.gf.rel = U.clamp(L.gf.rel - (L.gf.married ? 0.4 : 0.9), 0, 100);
      if (L.gf.rel > 70) Player.addMorale(p, 0.6);
      if (L.gf.rel < 12 && !L.gf.married) {
        Game.news(`${L.gf.name} ile yollarınızı ayırdınız. Magazin basını bunu çoktan duydu.`, 'bad');
        Player.addMorale(p, -10);
        L.gf = null; L.exes++;
      }
    }
    // sponsor ve menajer teklifleri
    if (p.age >= 16 && p.fame >= 8 && L.offers.length < 2 && U.chance(0.05 + Life.mgrQ() * 0.05)) Life.newSponsorOffer(p);
    // ceza süresi
    if (L.ban > 0) {
      L.ban--;
      if (L.ban === 0) Game.news('FIFA cezan sona erdi. Yeniden sahalara dönebilirsin.', 'good');
    }
    // bahisler sonuçlanır
    Life.settleBets(s);
    // FIFA takibi: bahis oynadıkça risk artar
    if (L.probe > 0) {
      L.probe--;
      if (L.probe === 0) Life.verdict(p);
    } else if (L.heat > 0 && U.chance(Math.min(0.6, L.heat / 220))) {
      L.probe = 2;
      Game.news(`FIFA, ${Player.fullName(p)} hakkında yasa dışı bahis soruşturması başlattı! İddialar ciddi.`, 'bad');
      Player.addMorale(p, -10);
    } else L.heat = Math.max(0, L.heat - 1.5);
  },

  verdict(p) {
    const L = Life.ensure(p);
    const weeks = Math.round(U.clamp(8 + L.heat * 0.45 + L.bans * 10, 8, 80));
    const fine = Math.round(p.money * 0.3 / 100) * 100;
    L.ban = weeks; L.bans++; L.heat = 0; L.bets = [];
    p.money -= fine;
    Player.addFame(p, -8);
    Player.addRel(p, 'coach', -25); Player.addRel(p, 'fans', -18); Player.addRel(p, 'team', -10);
    Player.addMorale(p, -25);
    const lost = L.sponsors.map((x) => x.name);
    L.sponsors = []; L.offers = [];
    Game.news(`FIFA KARARI: ${Player.fullName(p)}, yasa dışı bahis nedeniyle ${weeks} hafta futboldan men edildi ve ${U.money(fine)} para cezasına çarptırıldı!${lost.length ? ` ${lost.join(', ')} sponsorluğu iptal etti.` : ''}`, 'bad');
    Game.modal(`<div class="ev-tag bad">FIFA Disiplin Kurulu</div><h3>${weeks} hafta men cezası</h3><p>Yasa dışı bahis oynadığın tespit edildi. ${U.money(fine)} para cezası ödedin${lost.length ? `, ${U.esc(lost.join(', '))} sponsorluğu iptal etti` : ''}. Ceza süresince hiçbir maçta forma giyemezsin.</p>`, [{ t: 'Tamam' }]);
  },

  newSponsorOffer(p) {
    const L = Life.ensure(p);
    const have = new Set(L.sponsors.map((x) => x.id).concat(L.offers.map((x) => x.id)));
    const kinds = new Set(L.sponsors.map((x) => x.kind));
    const pool = BRANDS.filter((b) => p.fame >= b.fame - Life.mgrQ() * 4 && !have.has(b.id) && !kinds.has(b.kind));
    if (!pool.length) return;
    const b = U.pick(pool);
    const base = Math.max(300, Game.weeklyIncome() * U.rand(0.08, 0.22)) * b.m * (1 + p.fame / 120) * (1 + Life.mgrQ() * 0.1);
    const seasons = U.randi(1, 3);
    L.offers.push(Object.assign({}, b, { weekly: Math.round(base / 50) * 50, weeks: seasons * Game.rounds(), seasons }));
    Game.news(`${b.name} (${b.l}) sana sponsorluk teklif ediyor! Yaşam sekmesinden inceleyebilirsin.`, 'good');
  },

  // ---------- aksiyonlar (haftalık hak harcar) ----------
  act(kind) {
    const s = Game.state, p = s.player, L = Life.ensure(p);
    if (kind === 'casino') return Casino.open();
    if (s.ap <= 0) return Game.toast('Bu hafta için aksiyon hakkın kalmadı. Maça çık!', 'bad');
    const cost = (k) => Math.max(k, Math.round(Game.weeklyIncome() * k / 2000));
    let msg = '', type = 'good';
    if (kind === 'family') {
      const g = U.randi(8, 13);
      p.rel.family = U.clamp(p.rel.family + g, 0, 100);
      Player.addMorale(p, 4); Player.addEnergy(p, 5);
      msg = U.pick(['Annenin yemekleri gibisi yok!', 'Babanla eski maçlarını izlediniz.', 'Kardeşinle sokakta top oynadın.', 'Ailenle güzel bir akşam yemeği.']) + ` Aile ilişkisi +${g}`;
    } else if (kind === 'meet') {
      if (L.gf) return;
      if (p.age < 16) return Game.toast('Önce okul ve futbol!', 'bad');
      Player.addEnergy(p, -4);
      if (U.chance(0.22 + p.fame / 180 + p.morale / 500)) {
        L.gf = { name: U.pick(GF_NAMES), job: U.pick(GF_JOBS), rel: 42, since: s.season.year, married: false };
        msg = `${L.gf.name} ile tanıştın! Kendisi ${L.gf.job}. İlk buluşma harika geçti.`;
        if (p.fame > 25) Game.news(`Magazin: ${Player.fullName(p)} ile ${L.gf.job} ${L.gf.name} birlikte görüntülendi!`, 'world');
      } else { msg = 'Bu hafta kimseyle tanışamadın. Belki bir dahaki sefere.'; type = ''; }
    } else if (kind === 'date') {
      if (!L.gf) return;
      const c = cost(150);
      if (p.money < c) return Game.toast('Yeterli paran yok.', 'bad');
      p.money -= c;
      const g = U.randi(7, 13);
      L.gf.rel = U.clamp(L.gf.rel + g, 0, 100);
      Player.addMorale(p, 6); Player.addEnergy(p, -4);
      msg = `${L.gf.name} ile ${U.pick(['romantik bir akşam yemeği', 'sahilde yürüyüş', 'sinema gecesi', 'hafta sonu kaçamağı'])}. İlişki +${g}`;
      if (U.chance(0.3)) Social.post('life', `${L.gf.name} ile güzel bir akşam.`, 1.3);
    } else if (kind === 'propose') {
      if (!L.gf || L.gf.married || L.gf.rel < 85) return;
      if (U.chance(0.85)) {
        L.gf.married = true; L.gf.rel = 100;
        p.rel.family = U.clamp(p.rel.family + 10, 0, 100);
        Player.addMorale(p, 20); Player.addFame(p, 2);
        msg = `${L.gf.name} "Evet!" dedi! Düğün tarihi belli oldu.`;
        Game.news(`${Player.fullName(p)} ile ${L.gf.name} evlendi! Futbol dünyası mutlu çifti kutluyor.`, 'good');
        Social.post('life', `Hayatımın en güzel günü. ${L.gf.name}, iyi ki varsın.`, 2.5);
      } else { L.gf.rel -= 10; Player.addMorale(p, -6); msg = `${L.gf.name} "Biraz daha zamana ihtiyacım var" dedi.`; type = 'bad'; }
    } else if (kind === 'breakup') {
      if (!L.gf) return;
      Game.news(`${Player.fullName(p)} ile ${L.gf.name} ayrıldı.`, 'world');
      Player.addMorale(p, -6); L.gf = null; L.exes++;
      msg = 'Ayrılık zor oldu ama yoluna devam ediyorsun.'; type = '';
      s.ap++;
    } else if (kind === 'night') {
      if (!Life.adult(p)) return Game.toast('Gece hayatı 18 yaşından sonra.', 'bad');
      const c = cost(250);
      if (p.money < c) return Game.toast('Yeterli paran yok.', 'bad');
      p.money -= c; L.nights++;
      Player.addMorale(p, 10); Player.addEnergy(p, -18);
      msg = U.pick(['Şehrin en popüler kulübünde harika bir gece!', 'Takım arkadaşlarınla eğlenceli bir gece.', 'Ünlü bir DJ performansı vardı, sabaha kadar dans!']);
      if (U.chance(0.2 + (p.fame > 30 ? 0.08 : 0))) {
        Player.addRel(p, 'coach', -6); Player.addRel(p, 'fans', -3);
        if (L.gf) { L.gf.rel -= 15; msg += ` Ama paparazziler seni yakaladı; ${L.gf.name} haberi görünce çok kızdı.`; }
        else msg += ' Ama paparazziler seni sabaha karşı yakaladı. Hoca hiç memnun değil.';
        Game.news(`Magazin: ${Player.fullName(p)} maç haftası gece kulübünde görüntülendi!`, 'bad');
        type = 'bad';
      } else if (!L.gf && U.chance(0.18)) {
        L.gf = { name: U.pick(GF_NAMES), job: U.pick(GF_JOBS), rel: 35, since: s.season.year, married: false };
        msg += ` Gece ${L.gf.name} ile tanıştın!`;
      }
      if (U.chance(0.25)) Social.post('life', 'Gece hayatı. Pazartesi yine antrenmandayız!', 1.1);
    } else if (kind === 'hireMgr' || kind === 'fireMgr') return;
    s.ap--;
    Game.toast(msg, type);
    Game.save();
    Game.render();
  },

  hireManager(i) {
    const p = Game.p, L = Life.ensure(p);
    const m = (L.mgrCands || [])[i];
    if (!m) return;
    L.manager = m; L.mgrCands = null;
    Game.news(`Yeni menajerin ${m.name}. Gelirinin %${Math.round(m.cut * 100)}'ini alacak; karşılığında daha iyi teklifler ve sponsorlar bulacak.`, 'good');
    Game.save(); Game.render();
  },
  fireManager() {
    const L = Life.ensure(Game.p);
    if (!L.manager) return;
    Game.news(`${L.manager.name} ile yollarını ayırdın.`, '');
    L.manager = null;
    Game.save(); Game.render();
  },
  mgrCandidates(p) {
    const L = Life.ensure(p);
    if (!L.mgrCands || L.mgrCands.y !== Game.state.season.year) {
      const names = U.shuffle(MGR_NAMES).slice(0, 3);
      const list = names.map((n, i) => {
        const q = U.clamp(i + 1 + (p.fame > 50 ? 1 : 0) - (p.fame < 15 && i === 2 ? 1 : 0), 1, 3);
        return { name: n, q, cut: [0, 0.05, 0.08, 0.12][q] + U.rand(0, 0.02), minFame: [0, 0, 15, 40][q] };
      });
      L.mgrCands = list; L.mgrCands.y = Game.state.season.year;
    }
    return L.mgrCands;
  },

  acceptSponsor(i) {
    const p = Game.p, L = Life.ensure(p);
    const o = L.offers[i];
    if (!o) return;
    L.offers.splice(i, 1);
    if (L.sponsors.some((x) => x.kind === o.kind)) return Game.toast('Aynı türde bir sponsorun zaten var.', 'bad');
    L.sponsors.push(o);
    Player.addFame(p, 1.5);
    Game.news(`${o.name} ile ${o.seasons} sezonluk sponsorluk anlaşması imzaladın: haftalık ${U.money(o.weekly)}.`, 'good');
    Social.post('sponsor', `${o.name} ailesine katıldım! ${U.pick(SOCIAL_SPONSOR)}`, 1.6, { c1: o.c1, c2: o.c2, short: o.name, loc: o.name, brand: o.kind });
    Game.save(); Game.render();
  },
  rejectSponsor(i) {
    const L = Life.ensure(Game.p);
    L.offers.splice(i, 1);
    Game.save(); Game.render();
  },

  // ---------- bahis ----------
  // Bu haftanın maçları (kendi ligin ve birkaç büyük lig)
  betFixtures() {
    const s = Game.state, r = s.season.round, w = s.world;
    if (Game.isYouth() || Game.inStreet()) return [];
    const myLg = Game.club().league;
    const lids = [myLg].concat(['ENG', 'ESP', 'ITA', 'GER', 'TR1'].filter((x) => x !== myLg)).slice(0, 4);
    const out = [];
    lids.forEach((lid) => {
      const lg = w.leagues[lid];
      if (!lg || !lg.fixtures[r]) return;
      const fx = lg.fixtures[r].slice().sort((x, y) => (y.includes(s.clubId) ? 1 : 0) - (x.includes(s.clubId) ? 1 : 0));
      fx.slice(0, lid === myLg ? 4 : 2).forEach(([h, a]) => out.push({ lid, h, a, r, mine: h === s.clubId || a === s.clubId }));
    });
    return out;
  },
  odds(h, a) {
    const w = Game.state.world;
    const [lh, la] = World.lambdas(w.clubs[h].rating + 1.5, w.clubs[a].rating);
    const pois = (l, k) => Math.exp(-l) * Math.pow(l, k) / [1, 1, 2, 6, 24, 120, 720, 5040, 40320][k];
    let ph = 0, pd = 0, pa = 0;
    for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) { const q = pois(lh, i) * pois(la, j); if (i > j) ph += q; else if (i === j) pd += q; else pa += q; }
    const o = (x) => Math.max(1.05, Math.round((0.92 / x) * 100) / 100);
    return { 1: o(ph), X: o(pd), 2: o(pa) };
  },
  bet(idx, pick, stake) {
    const s = Game.state, p = s.player, L = Life.ensure(p);
    if (!Life.adult(p)) return;
    const f = Life.betFixtures()[idx];
    if (!f || !(stake > 0) || p.money < stake) return Game.toast('Yeterli paran yok.', 'bad');
    if (L.bets.some((b) => b.h === f.h && b.a === f.a && b.r === f.r)) return Game.toast('Bu maça zaten bahis oynadın.', 'bad');
    const odd = Life.odds(f.h, f.a)[pick];
    p.money -= stake;
    const own = f.mine;
    const against = own && ((f.h === s.clubId && pick !== '1') || (f.a === s.clubId && pick !== '2'));
    L.heat += against ? 80 : own ? 35 : f.lid === Game.club().league ? 14 : 7;
    L.heat += Math.min(20, (stake / Math.max(1000, p.money + stake)) * 40);
    L.bets.push({ lid: f.lid, h: f.h, a: f.a, r: f.r, pick, stake, odd });
    Game.toast(`Bahis oynandı: ${U.money(stake)} · oran ${odd.toFixed(2)}`, '');
    Game.save(); Game.render();
  },
  settleBets(s) {
    const p = s.player, L = Life.ensure(p);
    const keep = [];
    L.bets.forEach((b) => {
      const lg = s.world.leagues[b.lid];
      const res = lg && lg.results.find((x) => x.round === b.r && x.h === b.h && x.a === b.a);
      if (!res) { if (b.r >= s.season.round) keep.push(b); return; }
      const out = res.hs > res.as ? '1' : res.hs < res.as ? '2' : 'X';
      const nm = (id) => s.world.clubs[id].name;
      if (out === b.pick) {
        const win = Math.round(b.stake * b.odd);
        p.money += win;
        Game.news(`Bahsin tuttu: ${nm(b.h)} ${res.hs}-${res.as} ${nm(b.a)} · +${U.money(win)}`, 'me');
      } else Game.news(`Bahsin yattı: ${nm(b.h)} ${res.hs}-${res.as} ${nm(b.a)} · -${U.money(b.stake)}`, 'me');
    });
    L.bets = keep;
  },

  // Merkezde bekleyen sponsorluk teklifleri (Yaşam sekmesine gitmeden görünsün)
  homeCard() {
    const p = Game.p, L = p.life;
    if (!L || !L.offers || !L.offers.length) return '';
    return `<section class="card sp-home">
      <div class="card-h"><span>${Icon('coin')} Sponsorluk Teklifi</span><small class="muted">${L.offers.length} marka seni istiyor</small></div>
      <div class="lf-sps">${L.offers.map((o, i) => `<div class="lf-sp offer" style="--b1:${o.c1};--b2:${o.c2}"><i>${U.esc(o.name.slice(0, 2).toUpperCase())}</i><div><b>${U.esc(o.name)}</b><small>${o.l} · ${o.seasons} sezon · haftalık ${U.money(o.weekly)}</small></div><span class="lf-sp-b"><button class="btn" data-sp-ok="${i}">Kabul</button><button class="btn btn-ghost" data-sp-no="${i}">Reddet</button></span></div>`).join('')}</div>
    </section>`;
  },

  // ---------- ekran ----------
  screen() {
    const s = Game.state, p = s.player, L = Life.ensure(p);
    const adult = Life.adult(p);
    const bar = (v, c) => `<div class="lf-bar"><i style="width:${U.clamp(v, 0, 100)}%;background:${c}"></i></div>`;
    const act = (k, ic, t, d, dis) => `<button class="act lf-act" data-life="${k}" ${dis ? 'disabled' : ''}>${Icon(ic)}<span><b>${t}</b><small>${d}</small></span></button>`;
    const gf = L.gf;
    const sp = Life.sponsorIncome(p), cut = Life.managerCut(p);
    const parts = [];
    // durum
    parts.push(`<section class="card lf-head">
      <div class="card-h"><span>${Icon('heart')} Hayatın</span><span class="tag">${s.ap} aksiyon hakkı</span></div>
      ${L.ban > 0 ? `<div class="lf-ban">${Icon('whistle')}<div><b>FIFA men cezası: ${L.ban} hafta</b><small>Ceza bitene kadar maçlarda forma giyemezsin.</small></div></div>` : ''}
      ${L.probe > 0 ? `<div class="lf-ban warn">${Icon('whistle')}<div><b>FIFA soruşturması sürüyor</b><small>Karar ${L.probe} hafta içinde açıklanacak.</small></div></div>` : ''}
      <div class="lf-rows">
        <div class="lf-row"><span>Aile</span>${bar(p.rel.family, '#46e08f')}<b>${Math.round(p.rel.family)}</b></div>
        <div class="lf-row"><span>${gf ? (gf.married ? 'Eşin' : 'Sevgilin') : 'İlişki'}</span>${gf ? bar(gf.rel, '#ff6f8a') : '<em class="muted">Yalnızsın</em>'}<b>${gf ? Math.round(gf.rel) : ''}</b></div>
      </div>
      ${gf ? `<p class="lf-gf"><b>${U.esc(gf.name)}</b> · ${U.esc(gf.job)} · ${gf.since}'den beri${gf.married ? ' · evlisiniz' : ''}</p>` : ''}
      ${p.parents ? `<p class="muted lf-orig">Baba memleketi: <b>${U.esc((Game.nat(p.parents.f) || {}).name || '')}</b> · Anne memleketi: <b>${U.esc((Game.nat(p.parents.m) || {}).name || '')}</b>${p.parents.f !== p.parents.m ? (p.natLocked ? ` · Milli tercihin: <b>${U.esc(Game.nation().name)}</b>` : ' · İki milli takıma da uygunsun') : ''}</p>` : ''}
      <div class="lf-money"><div><span>Maaş</span><b>${U.money(Game.weeklyIncome())}</b></div><div><span>Sponsor</span><b>${U.money(sp)}</b></div><div><span>Menajer payı</span><b>${cut ? '-' + U.money(cut) : '—'}</b></div></div>
    </section>`);
    // aksiyonlar
    parts.push(`<section class="card">
      <div class="card-h"><span>${Icon('life')} Bu Hafta</span><small class="muted">Her biri 1 aksiyon hakkı</small></div>
      <div class="lf-acts">
        ${act('family', 'home', 'Ailenle vakit geçir', 'Aile ilişkisi ve moral artar')}
        ${gf ? act('date', 'heart', `${gf.name} ile buluş`, 'İlişki güçlenir, moral artar') : act('meet', 'heart', 'Yeni biriyle tanış', p.age < 16 ? '16 yaşından sonra' : 'Ünün ve moralin şansını artırır', p.age < 16)}
        ${gf && !gf.married && gf.rel >= 85 && s.season.year > gf.since ? act('propose', 'star', 'Evlilik teklif et', `${gf.name} hazır olabilir`) : ''}
        ${act('night', 'fire', 'Gece hayatı', adult ? 'Moral +10, enerji -18 · paparazzi riski' : '18 yaşından sonra', !adult)}
        ${act('casino', 'coin', 'Kumarhane', adult ? 'Blackjack, rulet, at yarışı' : '18 yaşından sonra', !adult)}
        ${gf && !gf.married ? `<button class="btn btn-ghost lf-break" data-life="breakup">Ayrıl</button>` : ''}
      </div>
    </section>`);
    // menajer
    if (p.age >= 16 && !Game.inStreet()) {
      const cands = L.manager ? [] : Life.mgrCandidates(p);
      parts.push(`<section class="card">
        <div class="card-h"><span>${Icon('contract')} Menajer</span>${L.manager ? `<small class="muted">%${Math.round(L.manager.cut * 100)} pay</small>` : ''}</div>
        ${L.manager ? `<div class="lf-mgr"><div><b>${U.esc(L.manager.name)}</b><small>${'★'.repeat(L.manager.q)}${'☆'.repeat(3 - L.manager.q)} · daha çok teklif, daha yüksek maaş, daha iyi sponsorlar</small></div><button class="btn btn-ghost" data-mgr-fire="1">Ayrıl</button></div>`
          : `<p class="muted">Menajer, gelirinden pay alır; karşılığında transfer tekliflerini çoğaltır, maaşını artırır ve sponsor bulur.</p>
          <div class="lf-cands">${cands.map((m, i) => { const ok = p.fame >= m.minFame; return `<div class="lf-cand"><div><b>${U.esc(m.name)}</b><small>${'★'.repeat(m.q)}${'☆'.repeat(3 - m.q)} · gelirinin %${Math.round(m.cut * 100)}'i</small></div><button class="btn ${ok ? '' : 'btn-ghost'}" data-mgr="${i}" ${ok ? '' : 'disabled'}>${ok ? 'Anlaş' : `Ün ${m.minFame} gerekir`}</button></div>`; }).join('')}</div>`}
      </section>`);
    }
    // sponsorlar
    if (p.age >= 16 && !Game.inStreet()) {
      parts.push(`<section class="card">
        <div class="card-h"><span>${Icon('coin')} Sponsorluklar</span><small class="muted">${L.sponsors.length} aktif</small></div>
        ${L.offers.length ? `<div class="lbl">Teklifler</div><div class="lf-sps">${L.offers.map((o, i) => `<div class="lf-sp offer" style="--b1:${o.c1};--b2:${o.c2}"><i>${U.esc(o.name.slice(0, 2).toUpperCase())}</i><div><b>${U.esc(o.name)}</b><small>${o.l} · ${o.seasons} sezon · haftalık ${U.money(o.weekly)}</small></div><span class="lf-sp-b"><button class="btn" data-sp-ok="${i}">Kabul</button><button class="btn btn-ghost" data-sp-no="${i}">Reddet</button></span></div>`).join('')}</div>` : ''}
        ${L.sponsors.length ? `<div class="lf-sps">${L.sponsors.map((o) => `<div class="lf-sp" style="--b1:${o.c1};--b2:${o.c2}"><i>${U.esc(o.name.slice(0, 2).toUpperCase())}</i><div><b>${U.esc(o.name)}</b><small>${o.l} · ${o.weeks} hafta kaldı</small></div><b class="lf-sp-w">${U.money(o.weekly)}<small>/hf</small></b></div>`).join('')}</div>` : !L.offers.length ? `<p class="muted">${p.fame < 8 ? 'Sponsorlar için biraz daha tanınman gerekiyor.' : 'Şimdilik teklif yok. İyi oynadıkça ve ünün arttıkça markalar seni arayacak.'}</p>` : ''}
      </section>`);
    }
    // bahis
    if (adult && !Game.isYouth() && !Game.inStreet()) {
      const fx = Life.betFixtures();
      const stakes = [500, 2000, 10000, 50000, 250000].filter((x) => x <= Math.max(500, p.money));
      const nm = (id) => s.world.clubs[id].short || s.world.clubs[id].name;
      parts.push(`<section class="card bet">
        <div class="card-h"><span>${Icon('whistle')} İddaa Köşesi</span><small class="muted">${s.season.round + 1}. hafta</small></div>
        <div class="bet-warn"><b>Dikkat:</b> Futbolcuların bahis oynaması yasaktır. Her bahis FIFA'nın dikkatini çeker; kendi maçına oynamak çok risklidir. Yakalanırsan uzun süreli men cezası, para cezası ve sponsor kaybı yaşarsın.</div>
        ${L.ban > 0 ? '' : `<div class="bet-stake">Miktar: ${stakes.map((x) => `<button class="${(UI.betStake || stakes[0]) === x ? 'on' : ''}" data-stake="${x}">${U.money(x)}</button>`).join('')}</div>
        <div class="bet-list">${fx.map((f, i) => { const o = Life.odds(f.h, f.a); const done = L.bets.find((b) => b.h === f.h && b.a === f.a && b.r === f.r); return `<div class="bet-row ${f.mine ? 'mine' : ''}"><span class="bet-t">${U.esc(nm(f.h))} - ${U.esc(nm(f.a))}${f.mine ? ' <em>kendi maçın</em>' : ''}</span>${done ? `<span class="bet-done">${done.pick} · ${U.money(done.stake)}</span>` : ['1', 'X', '2'].map((k) => `<button data-bet="${i}:${k}">${k}<small>${o[k].toFixed(2)}</small></button>`).join('')}</div>`; }).join('')}</div>`}
      </section>`);
    }
    return parts.join('');
  },

  bind(root) {
    U.$$('[data-life]', root).forEach((b) => (b.onclick = () => Life.act(b.dataset.life)));
    U.$$('[data-mgr]', root).forEach((b) => (b.onclick = () => Life.hireManager(+b.dataset.mgr)));
    U.$$('[data-mgr-fire]', root).forEach((b) => (b.onclick = () => Life.fireManager()));
    U.$$('[data-sp-ok]', root).forEach((b) => (b.onclick = () => Life.acceptSponsor(+b.dataset.spOk)));
    U.$$('[data-sp-no]', root).forEach((b) => (b.onclick = () => Life.rejectSponsor(+b.dataset.spNo)));
    U.$$('[data-stake]', root).forEach((b) => (b.onclick = () => { UI.betStake = +b.dataset.stake; Game.render(); }));
    U.$$('[data-bet]', root).forEach((b) => (b.onclick = () => {
      const [i, k] = b.dataset.bet.split(':');
      const p = Game.p;
      const stake = Math.min(UI.betStake || 500, p.money);
      Game.modal(`<div class="ev-tag bad">Yasa dışı bahis</div><h3>Emin misin?</h3><p>${U.money(stake)} yatıracaksın. Futbolcuların bahis oynaması yasak; FIFA takibe alabilir ve uzun süreli ceza verebilir.</p>`, [
        { t: 'Vazgeç', cls: 'btn-ghost' },
        { t: 'Bahsi oyna', fn: () => Life.bet(+i, k, stake) },
      ]);
    }));
  },
};

// Aile ve ilişki olayları (haftalık rastgele olaylara eklenir)
if (typeof Events !== 'undefined') {
  const sp = Events.list.find((e) => e.id === 'sponsor');
  if (sp) sp.cond = () => false; // sponsorluklar artık Yaşam sekmesinde
  Events.list.push(
    {
      id: 'mom_bday', cond: () => true,
      text: () => 'Bu hafta annenin doğum günü. Ne yapacaksın?',
      opts: [
        { t: 'Sürpriz hediye al', fx: (p) => { const c = Math.max(200, Math.round(Game.weeklyIncome() * 0.1)); p.money -= c; p.rel.family = U.clamp(p.rel.family + 12, 0, 100); Player.addMorale(p, 5); return `Annen çok duygulandı. (${U.money(c)})`; } },
        { t: 'Telefonla ara', fx: (p) => { p.rel.family = U.clamp(p.rel.family + 3, 0, 100); return 'Annen sesini duyduğuna sevindi.'; } },
      ],
    },
    {
      id: 'dad_match', cond: () => !Game.inStreet(),
      text: () => 'Baban bu hafta maçını tribünden izlemek istiyor.',
      opts: [
        { t: 'Bilet ayarla', fx: (p) => { p.rel.family = U.clamp(p.rel.family + 8, 0, 100); Player.addMorale(p, 6); return 'Baban tribünde gururla izleyecek!'; } },
        { t: 'Bu hafta olmaz', fx: (p) => { p.rel.family = U.clamp(p.rel.family - 5, 0, 100); return 'Baban biraz kırıldı.'; } },
      ],
    },
    {
      id: 'gf_trip', cond: (p) => p.life && p.life.gf,
      text: () => `${Game.p.life.gf.name} milli ara için bir tatil planlamak istiyor.`,
      opts: [
        { t: 'Tatile çık', fx: (p) => { p.life.gf.rel = U.clamp(p.life.gf.rel + 15, 0, 100); Player.addEnergy(p, 15); Player.addMorale(p, 8); const c = Math.max(500, Math.round(Game.weeklyIncome() * 0.4)); p.money -= c; return `Harika bir tatil! (${U.money(c)})`; } },
        { t: 'Antrenmana odaklan', fx: (p) => { p.life.gf.rel = U.clamp(p.life.gf.rel - 10, 0, 100); return `${p.life.gf.name} biraz kırıldı.`; } },
      ],
    },
    {
      id: 'gf_jealous', cond: (p) => p.life && p.life.gf && !p.life.gf.married && p.fame > 15,
      text: () => `Bir hayranınla çekilen fotoğrafın sosyal medyada yayıldı. ${Game.p.life.gf.name} açıklama bekliyor.`,
      opts: [
        { t: 'Açıkça konuş', fx: (p) => { p.life.gf.rel = U.clamp(p.life.gf.rel + 4, 0, 100); return 'Konuştunuz ve sorun çözüldü.'; } },
        { t: 'Geçiştir', fx: (p) => { p.life.gf.rel = U.clamp(p.life.gf.rel - 14, 0, 100); return 'Aranızda soğuk rüzgarlar esiyor.'; } },
      ],
    },
  );
}

// ---------- Kumarhane: blackjack, rulet, at yarışı ----------
const SUITS = {
  s: '<svg viewBox="0 0 20 20"><path d="M10 1C7 5 2 8 2 12a4 4 0 0 0 7 2.5L8 19h4l-1-4.5A4 4 0 0 0 18 12c0-4-5-7-8-11z" fill="#111"/></svg>',
  h: '<svg viewBox="0 0 20 20"><path d="M10 18S2 12.5 2 7.5A4.3 4.3 0 0 1 10 5a4.3 4.3 0 0 1 8 2.5C18 12.5 10 18 10 18z" fill="#d10f2f"/></svg>',
  d: '<svg viewBox="0 0 20 20"><path d="M10 1 17 10 10 19 3 10z" fill="#d10f2f"/></svg>',
  c: '<svg viewBox="0 0 20 20"><circle cx="10" cy="6" r="3.6" fill="#111"/><circle cx="5.5" cy="11.5" r="3.6" fill="#111"/><circle cx="14.5" cy="11.5" r="3.6" fill="#111"/><path d="M9 11h2l1 8H8z" fill="#111"/></svg>',
};
const ROUL_RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
const HORSES = ['Rüzgarın Oğlu', 'Kara Şimşek', 'Altın Toz', 'Fırtına', 'Gece Yıldızı', 'Bozkır Prensi'];

const Casino = {
  st: null,
  open() {
    const s = Game.state, p = s.player;
    if (!Life.adult(p)) return Game.toast('Kumarhane 18 yaşından sonra.', 'bad');
    if (s.ap <= 0) return Game.toast('Bu hafta için aksiyon hakkın kalmadı.', 'bad');
    s.ap--;
    Life.ensure(p).casino++;
    Casino.st = { game: 'bj', net: 0, stake: 0 };
    Game.modal('<div class="casino" id="casino"></div>', [{ t: 'Kumarhaneden çık', cls: 'btn-ghost', fn: () => Casino.leave() }], { wide: true });
    Casino.draw();
  },
  leave() {
    const p = Game.p, net = Casino.st ? Casino.st.net : 0;
    if (net > 0) Player.addMorale(p, 5); else if (net < 0) Player.addMorale(p, -Math.min(10, 3 + Math.round(-net / Math.max(1000, Game.weeklyIncome()))));
    if (p.fame > 20 && U.chance(0.12)) { Player.addRel(p, 'coach', -4); Player.addRel(p, 'fans', -3); Game.news(`Magazin: ${Player.fullName(p)} kumarhanede görüntülendi. Taraftarlar tepkili.`, 'bad'); }
    if (net) Game.news(`Kumarhane: ${net > 0 ? '+' : '-'}${U.money(Math.abs(net))}`, 'me');
    Casino.st = null;
    Game.save(); Game.render();
  },
  stakes() {
    const m = Game.p.money;
    return [100, 500, 1000, 5000, 20000, 100000, 500000].filter((x) => x <= m);
  },
  take(amount) {
    const p = Game.p;
    if (p.money < amount || amount <= 0) { Game.toast('Yeterli paran yok.', 'bad'); return false; }
    p.money -= amount; Casino.st.net -= amount; return true;
  },
  pay(amount) { Game.p.money += amount; Casino.st.net += amount; },
  draw() {
    const el = document.getElementById('casino');
    if (!el || !Casino.st) return;
    const st = Casino.st, p = Game.p;
    const sk = Casino.stakes();
    if (!sk.includes(st.stake)) st.stake = sk[0] || 0;
    const tabs = [['bj', 'Blackjack'], ['rl', 'Rulet'], ['hr', 'At Yarışı']].map(([k, l]) => `<button class="${st.game === k ? 'on' : ''}" data-cg="${k}">${l}</button>`).join('');
    let body = '';
    if (st.game === 'bj') body = Casino.bjView();
    else if (st.game === 'rl') body = Casino.rlView();
    else body = Casino.hrView();
    el.innerHTML = `<div class="cs-top"><h3>Kumarhane</h3><span class="cs-bal">Bakiye <b>${U.money(p.money)}</b> · Bu gece <b class="${st.net >= 0 ? 'up' : 'down'}">${st.net >= 0 ? '+' : '-'}${U.money(Math.abs(st.net))}</b></span></div>
      <div class="cs-tabs">${tabs}</div>
      <div class="cs-stake">Bahis: ${sk.length ? sk.map((x) => `<button class="${st.stake === x ? 'on' : ''}" data-cs="${x}">${U.money(x)}</button>`).join('') : '<em>Paran kalmadı</em>'}</div>
      <div class="cs-body">${body}</div>`;
    U.$$('[data-cg]', el).forEach((b) => (b.onclick = () => { if (st.busy) return; st.game = b.dataset.cg; Casino.draw(); }));
    U.$$('[data-cs]', el).forEach((b) => (b.onclick = () => { if (st.busy) return; st.stake = +b.dataset.cs; Casino.draw(); }));
    U.$$('[data-bj]', el).forEach((b) => (b.onclick = () => Casino.bj(b.dataset.bj)));
    U.$$('[data-rl]', el).forEach((b) => (b.onclick = () => Casino.spin(b.dataset.rl)));
    U.$$('[data-hr]', el).forEach((b) => (b.onclick = () => Casino.race(+b.dataset.hr)));
  },

  // --- Blackjack ---
  card(c, hidden) {
    if (hidden) return '<div class="pc-card back"></div>';
    const red = c.s === 'h' || c.s === 'd';
    return `<div class="pc-card ${red ? 'red' : ''}"><b>${c.r}</b>${SUITS[c.s]}</div>`;
  },
  val(h) {
    let v = 0, a = 0;
    h.forEach((c) => { if (c.r === 'A') { a++; v += 11; } else v += ['J', 'Q', 'K'].includes(c.r) ? 10 : +c.r; });
    while (v > 21 && a) { v -= 10; a--; }
    return v;
  },
  deck() {
    const d = [];
    ['s', 'h', 'd', 'c'].forEach((s) => ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'].forEach((r) => d.push({ r, s })));
    return U.shuffle(d);
  },
  bjView() {
    const b = Casino.st.bj;
    if (!b || b.phase === 'bet') return `<div class="bj-table"><p class="muted">Krupiyeye karşı 21'e yaklaş. Blackjack 3:2 öder, krupiye 17'de durur.</p><button class="btn btn-big" data-bj="deal">Kartları dağıt</button>${b && b.msg ? `<p class="cs-msg ${b.win}">${b.msg}</p>` : ''}</div>`;
    const hide = b.phase === 'play';
    return `<div class="bj-table">
      <div class="bj-hand"><span>Krupiye ${hide ? '' : '· ' + Casino.val(b.d)}</span><div>${b.d.map((c, i) => Casino.card(c, hide && i === 1)).join('')}</div></div>
      <div class="bj-hand"><span>Sen · ${Casino.val(b.p)}</span><div>${b.p.map((c) => Casino.card(c)).join('')}</div></div>
      ${b.phase === 'play' ? '<div class="row-btns"><button class="btn" data-bj="hit">Kart çek</button><button class="btn btn-ghost" data-bj="stand">Dur</button></div>' : `<p class="cs-msg ${b.win}">${b.msg}</p><button class="btn btn-big" data-bj="deal">Yeni el</button>`}
    </div>`;
  },
  bj(a) {
    const st = Casino.st;
    if (a === 'deal') {
      if (!Casino.take(st.stake)) return;
      const d = Casino.deck();
      st.bj = { deck: d, p: [d.pop(), d.pop()], d: [d.pop(), d.pop()], phase: 'play', stake: st.stake };
      if (Casino.val(st.bj.p) === 21) return Casino.bjEnd(true);
    } else if (a === 'hit') {
      st.bj.p.push(st.bj.deck.pop());
      if (Casino.val(st.bj.p) > 21) return Casino.bjEnd();
    } else if (a === 'stand') return Casino.bjEnd();
    Casino.draw();
  },
  bjEnd(natural) {
    const b = Casino.st.bj;
    const pv = Casino.val(b.p);
    if (pv <= 21 && !natural) while (Casino.val(b.d) < 17) b.d.push(b.deck.pop());
    const dv = Casino.val(b.d);
    b.phase = 'done';
    if (natural) { Casino.pay(Math.round(b.stake * 2.5)); b.msg = `BLACKJACK! +${U.money(Math.round(b.stake * 1.5))}`; b.win = 'up'; }
    else if (pv > 21) { b.msg = `Battın (${pv}). -${U.money(b.stake)}`; b.win = 'down'; }
    else if (dv > 21 || pv > dv) { Casino.pay(b.stake * 2); b.msg = `Kazandın! ${pv} - ${dv} · +${U.money(b.stake)}`; b.win = 'up'; }
    else if (pv === dv) { Casino.pay(b.stake); b.msg = `Berabere (${pv}). Bahsin iade edildi.`; b.win = ''; }
    else { b.msg = `Krupiye kazandı: ${dv} - ${pv}. -${U.money(b.stake)}`; b.win = 'down'; }
    Casino.draw();
  },

  // --- Rulet ---
  rlView() {
    const r = Casino.st.rl || {};
    const opts = [['red', 'Kırmızı', '2x'], ['black', 'Siyah', '2x'], ['odd', 'Tek', '2x'], ['even', 'Çift', '2x'], ['low', '1-18', '2x'], ['high', '19-36', '2x'], ['d1', '1-12', '3x'], ['d2', '13-24', '3x'], ['d3', '25-36', '3x'], ['n7', '7', '36x'], ['n17', '17', '36x'], ['n0', '0', '36x']];
    return `<div class="rl">
      <div class="rl-wheel-w"><div class="rl-pin"></div><div class="rl-wheel" id="rl-wheel" style="transform:rotate(${r.rot || 0}deg)"></div><div class="rl-res ${r.n == null ? '' : r.n === 0 ? 'g' : ROUL_RED.has(r.n) ? 'r' : 'b'}">${r.n == null ? '?' : r.n}</div></div>
      ${r.msg ? `<p class="cs-msg ${r.win}">${r.msg}</p>` : '<p class="muted">Bir seçenek seç, çark dönsün.</p>'}
      <div class="rl-opts">${opts.map(([k, l, m]) => `<button class="rl-${k}" data-rl="${k}" ${Casino.st.busy ? 'disabled' : ''}><b>${l}</b><small>${m}</small></button>`).join('')}</div>
    </div>`;
  },
  spin(k) {
    const st = Casino.st;
    if (st.busy || !Casino.take(st.stake)) return;
    st.busy = true;
    const n = U.randi(0, 36);
    const prev = (st.rl && st.rl.rot) || 0;
    st.rl = { rot: prev, msg: '' };
    Casino.draw();
    const wheel = document.getElementById('rl-wheel');
    const rot = prev + 360 * 5 + U.randi(0, 359);
    requestAnimationFrame(() => { if (wheel) { wheel.style.transition = 'transform 2.6s cubic-bezier(.15,.7,.2,1)'; wheel.style.transform = `rotate(${rot}deg)`; } });
    setTimeout(() => {
      const hit = {
        red: n > 0 && ROUL_RED.has(n), black: n > 0 && !ROUL_RED.has(n), odd: n > 0 && n % 2 === 1, even: n > 0 && n % 2 === 0,
        low: n >= 1 && n <= 18, high: n >= 19, d1: n >= 1 && n <= 12, d2: n >= 13 && n <= 24, d3: n >= 25, n7: n === 7, n17: n === 17, n0: n === 0,
      }[k];
      const mult = k.startsWith('n') ? 36 : k.startsWith('d') ? 3 : 2;
      st.rl = { rot, n };
      if (hit) { Casino.pay(st.stake * mult); st.rl.msg = `${n}! Kazandın: +${U.money(st.stake * (mult - 1))}`; st.rl.win = 'up'; }
      else { st.rl.msg = `${n}. Kaybettin: -${U.money(st.stake)}`; st.rl.win = 'down'; }
      st.busy = false;
      Casino.draw();
    }, 2700);
  },

  // --- At yarışı ---
  hrView() {
    const st = Casino.st;
    if (!st.hr || st.hr.done) {
      const prev = st.hr;
      const str = HORSES.map(() => U.rand(0.8, 1.2));
      const tot = str.reduce((a, b) => a + Math.pow(b, 6), 0);
      st.hr = { str, odds: str.map((x) => Math.max(1.3, Math.round((0.88 / (Math.pow(x, 6) / tot)) * 10) / 10)), pos: HORSES.map(() => 0), done: false, msg: prev && prev.msg, win: prev && prev.win };
    }
    const h = st.hr;
    return `<div class="hr">
      <div class="hr-track">${HORSES.map((n, i) => `<div class="hr-lane"><span class="hr-n">${i + 1}</span><i class="hr-horse" id="hr-${i}" style="left:${h.pos[i] * 88}%;--hc:${['#e11d48', '#2563eb', '#f59e0b', '#16a34a', '#9333ea', '#0ea5e9'][i]}"></i></div>`).join('')}<div class="hr-finish"></div></div>
      ${h.msg ? `<p class="cs-msg ${h.win}">${h.msg}</p>` : '<p class="muted">Bir at seç; kazanırsa oranı kadar öder.</p>'}
      <div class="hr-opts">${HORSES.map((n, i) => `<button data-hr="${i}" ${st.busy ? 'disabled' : ''}><b>${i + 1}. ${n}</b><small>oran ${h.odds[i].toFixed(1)}</small></button>`).join('')}</div>
    </div>`;
  },
  race(i) {
    const st = Casino.st, h = st.hr;
    if (st.busy || !h || !Casino.take(st.stake)) return;
    st.busy = true; h.msg = null;
    Casino.draw();
    let last = performance.now(), winner = -1;
    const step = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      h.pos = h.pos.map((x, k) => Math.min(1, x + dt * (0.12 * h.str[k] + U.rand(-0.03, 0.07))));
      h.pos.forEach((x, k) => { const el = document.getElementById(`hr-${k}`); if (el) el.style.left = `${x * 88}%`; });
      const done = h.pos.findIndex((x) => x >= 1);
      if (done >= 0) {
        winner = done;
        const won = winner === i;
        if (won) { Casino.pay(Math.round(st.stake * h.odds[i])); h.msg = `${winner + 1}. ${HORSES[winner]} kazandı! +${U.money(Math.round(st.stake * (h.odds[i] - 1)))}`; h.win = 'up'; }
        else { h.msg = `${winner + 1}. ${HORSES[winner]} kazandı. -${U.money(st.stake)}`; h.win = 'down'; }
        h.done = true; st.busy = false;
        setTimeout(() => Casino.draw(), 600);
        return;
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },
};
