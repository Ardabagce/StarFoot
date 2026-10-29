// Yaşam: aile, ilişkiler, gece hayatı, menajer ve sponsorluklar

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
    // kumarhane ve bahis kaldırıldı: eski kayıtlardaki soruşturma/bahis durumları temizlenir
    if (p.life.heat || p.life.probe || (p.life.bets && p.life.bets.length)) { p.life.heat = 0; p.life.probe = 0; p.life.bets = []; }
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
    // ayrılık/boşanma sonrası kalp kırıklığı: birkaç hafta moral düşer
    if (L.heartbreak > 0) { L.heartbreak--; Player.addMorale(p, -2); }
    if (L.gf) {
      L.gf.rel = U.clamp(L.gf.rel - (L.gf.married ? 0.4 : 0.9), 0, 100);
      if (L.gf.rel > 70) Player.addMorale(p, 0.6);
      if (L.gf.rel < 12 && L.gf.married) Life.divorce(p, true);
      else if (L.gf.rel < 12 && !L.gf.married) {
        L.heartbreak = 2;
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
      if (L.ban === 0) Game.news('Federasyon cezan sona erdi. Yeniden sahalara dönebilirsin.', 'good');
    }
  },

  // Boşanma: servetin bir kısmı gider, moral ve aile ilişkisi düşer, magazin konuşur. byPartner: eş boşanma davası açtı
  divorce(p, byPartner) {
    const L = Life.ensure(p);
    if (!L.gf || !L.gf.married) return;
    const name = L.gf.name;
    const loss = Math.max(0, Math.round(Math.max(0, p.money) * U.rand(0.3, 0.5)));
    p.money -= loss;
    Player.addMorale(p, -18);
    p.rel.family = U.clamp(p.rel.family - 5, 0, 100);
    L.gf = null; L.exes++; L.divorces = (L.divorces || 0) + 1; L.heartbreak = 4;
    if (byPartner) Game.news(`${name}, boşanma davası açtı. Evliliğiniz sona erdi; boşanma ${U.money(loss)} değerinde servetine mal oldu.`, 'bad');
    else Game.news(`${Player.fullName(p)} ile ${name} boşandı. Boşanma ${U.money(loss)} değerinde servetine mal oldu.`, 'bad');
    return loss;
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
      if (!Life.adult(p)) return Game.toast('Evlilik için 18 yaşını doldurmalısın.', 'bad');
      if (U.chance(0.85)) {
        L.gf.married = true; L.gf.rel = 100;
        p.rel.family = U.clamp(p.rel.family + 10, 0, 100);
        Player.addMorale(p, 20); Player.addFame(p, 2);
        msg = `${L.gf.name} "Evet!" dedi! Düğün tarihi belli oldu.`;
        Game.news(`${Player.fullName(p)} ile ${L.gf.name} evlendi! Futbol dünyası mutlu çifti kutluyor.`, 'good');
        Social.post('life', `Hayatımın en güzel günü. ${L.gf.name}, iyi ki varsın.`, 2.5);
      } else { L.gf.rel -= 10; Player.addMorale(p, -6); msg = `${L.gf.name} "Biraz daha zamana ihtiyacım var" dedi.`; type = 'bad'; }
    } else if (kind === 'divorce') {
      if (!L.gf || !L.gf.married) return;
      Game.modal(`<h2>${Icon('heart')} Boşan</h2><p>Boşanmak pahalıya patlayabilir: servetinin bir kısmını kaybedebilirsin ve moralin bir süre düşük kalır. Emin misin?</p>`,
        [{ t: 'Vazgeç', cls: 'btn-ghost' }, { t: 'Boşan', cls: 'btn-big', fn: () => { Life.divorce(p, false); Game.toast('Zor bir dönem. Kafanı toplamak birkaç hafta sürebilir.', 'bad'); Game.save(); Game.render(); } }]);
      return;
    } else if (kind === 'breakup') {
      if (!L.gf) return;
      Game.news(`${Player.fullName(p)} ile ${L.gf.name} ayrıldı.`, 'world');
      Player.addMorale(p, -6); L.gf = null; L.exes++; L.heartbreak = 2;
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
      ${L.ban > 0 ? `<div class="lf-ban">${Icon('whistle')}<div><b>Federasyon men cezası: ${L.ban} hafta</b><small>Ceza bitene kadar maçlarda forma giyemezsin.</small></div></div>` : ''}
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
        ${gf && !gf.married && gf.rel >= 85 && s.season.year > gf.since && adult ? act('propose', 'star', 'Evlilik teklif et', `${gf.name} hazır olabilir`) : ''}
        ${act('night', 'fire', 'Gece hayatı', adult ? 'Moral +10, enerji -18 · paparazzi riski' : '18 yaşından sonra', !adult)}
        ${gf && !gf.married ? `<button class="btn btn-ghost lf-break" data-life="breakup">Ayrıl</button>` : ''}
        ${gf && gf.married ? `<button class="btn btn-ghost lf-break" data-life="divorce">Boşan</button>` : ''}
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
    return parts.join('');
  },

  bind(root) {
    U.$$('[data-life]', root).forEach((b) => (b.onclick = () => Life.act(b.dataset.life)));
    U.$$('[data-mgr]', root).forEach((b) => (b.onclick = () => Life.hireManager(+b.dataset.mgr)));
    U.$$('[data-mgr-fire]', root).forEach((b) => (b.onclick = () => Life.fireManager()));
    U.$$('[data-sp-ok]', root).forEach((b) => (b.onclick = () => Life.acceptSponsor(+b.dataset.spOk)));
    U.$$('[data-sp-no]', root).forEach((b) => (b.onclick = () => Life.rejectSponsor(+b.dataset.spNo)));
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
      id: 'marriage_crisis', cond: (p) => p.life && p.life.gf && p.life.gf.married && p.life.gf.rel < 40,
      text: () => `Eşin ${Game.p.life.gf.name} ile aranız iyi değil. Evliliğiniz zor bir dönemden geçiyor.`,
      opts: [
        { t: 'Evlilik danışmanına gidin', fx: (p) => { const c = Math.max(500, Math.round(Game.weeklyIncome() * 0.3)); p.money -= c; p.life.gf.rel = U.clamp(p.life.gf.rel + 22, 0, 100); Player.addMorale(p, 4); return `Konuştunuz, aranız düzelmeye başladı. (${U.money(c)})`; } },
        { t: 'Bir süre ayrı kalın', fx: (p) => { p.life.gf.rel = U.clamp(p.life.gf.rel - 12, 0, 100); Player.addMorale(p, -4); return 'Aranızdaki mesafe büyüdü.'; } },
      ],
    },
    {
      id: 'gf_leaves', cond: (p) => p.life && p.life.gf && !p.life.gf.married && p.life.gf.rel < 35,
      text: () => `${Game.p.life.gf.name}, ilişkinizin artık yürümediğini söyledi ve ayrılmak istiyor.`,
      opts: [
        { t: 'Bir şans daha iste', fx: (p) => { if (U.chance(0.5)) { p.life.gf.rel = U.clamp(p.life.gf.rel + 15, 0, 100); return 'Bir şans daha verdi ama dikkatli olmalısın.'; } const n = p.life.gf.name; p.life.gf = null; p.life.exes++; p.life.heartbreak = 3; Player.addMorale(p, -10); Game.news(`${Player.fullName(p)} ile ${n} ayrıldı.`, 'world'); return 'Yolunuzu ayırdınız.'; } },
        { t: 'Ayrılığı kabul et', fx: (p) => { const n = p.life.gf.name; p.life.gf = null; p.life.exes++; p.life.heartbreak = 2; Player.addMorale(p, -6); Game.news(`${Player.fullName(p)} ile ${n} ayrıldı.`, 'world'); return 'Yolunuzu ayırdınız.'; } },
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
