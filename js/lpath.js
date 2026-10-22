// Efsanelerin İzinde: futbol tarihinin büyük yıldızlarından esinlenen kurgusal kariyerler (satın alınabilir paket).
// İsimler ve kulüpler oyundaki diğer her şey gibi kurgusaldır. Oyuncu efsanenin doğduğu yılda, onun altyapısında,
// onun yetenekleriyle başlar; hikâye bölümleri (transferler, dönüm noktaları) ve efsanenin başarılarına göre hedefler vardır.

// stat eğilimi: tüm statlara eklenen fark (0 = ortalama)
const LP_LIST = [
  {
    id: 'mezzi', name: 'Lionel', surname: 'Mezzi', nick: 'Küçük Büyücü', nat: 'ARG', pos: 'FW', foot: 'L', by: 1987,
    year: 2000, age: 13, club: 'BAR', traits: ['drib'],
    shape: { pace: 8, dribbling: 15, technique: 10, shooting: 7, passing: 6, physical: -12, heading: -12, defending: -14, stamina: 0 },
    intro: 'Rosario\'da doğdun. Herkes topla yaptıklarına hayran ama boyun yaşıtlarından çok kısa ve büyüme tedavisi gerekiyor. Barcelova FC tedavini üstlendi ve seni 13 yaşında okyanusun öbür yanına, akademisine getirdi.',
    era: '2000 · Barcelova FC altyapısı',
    story: [
      { y: 2001, t: 'Büyüme tedavisi işe yarıyor! Akademide herkes seni konuşuyor.', fx: (p) => { p.stats.physical = Math.min(99, p.stats.physical + 4); } },
      { y: 2006, t: 'İlk büyük turnuvan yaklaşıyor. Ülkenin efsane 10 numarası seni "varisim" diye tanıttı.', fx: (p) => { Player.addFame(p, 4); Player.addMorale(p, 8); } },
      { y: 2021, move: 'PSG', t: 'Yıllarca oynadığın kulüp mali krizde. Paris Saint-Gilles kapında: yeni bir macera mı?' },
      { y: 2023, move: 'MIA', t: 'Kariyerinin son yıllarında okyanusun öbür yakasından, Maymi\'den sürpriz bir teklif var.' },
    ],
    goals: [['ballon', 5], ['ucl', 2], ['wc', 1], ['league', 6], ['season', 50], ['goals', 500]],
  },
  {
    id: 'ronalda', name: 'Cristiano', surname: 'Ronalda', nick: 'Madeira Fırtınası', nat: 'POR', pos: 'FW', foot: 'R', by: 1985,
    year: 1997, age: 12, club: 'SPL', traits: ['head'],
    shape: { shooting: 12, pace: 11, heading: 10, physical: 7, stamina: 7, dribbling: 7, technique: 3, passing: -3, defending: -14 },
    intro: 'Madeira adasında doğdun. Mahallede herkesten çok antrenman yapan, kaybedince ağlayan o çocuk sendin. 12 yaşında tek başına ana karaya, Sporting Lizbon akademisine geldin.',
    era: '1997 · Sporting Lizbon altyapısı',
    story: [
      { y: 1999, t: 'Kalp ritminde bir sorun çıktı ama küçük bir ameliyatla atlattın. Artık hiçbir şey seni durduramaz.', fx: (p) => { p.stats.stamina = Math.min(99, p.stats.stamina + 3); Player.addMorale(p, 6); } },
      { y: 2003, move: 'MUN', t: 'Hazırlık maçında Manchester Kızılları\'nın savunmasını perişan ettin. Teknik direktörleri hemen seni istiyor!' },
      { y: 2009, move: 'RMA', t: 'Real Madrigal dünya rekoru bir bonservisle seni istiyor. Beyaz formayı giymenin zamanı geldi mi?' },
      { y: 2018, move: 'JUV', t: 'Juventa Torino yeni bir meydan okuma sunuyor: İtalya\'yı da fethet.' },
      { y: 2023, move: 'NSR', t: 'Riyad Nasrları kariyerinin en büyük maaş teklifiyle kapında.' },
    ],
    goals: [['ballon', 4], ['ucl', 3], ['euro', 1], ['league', 5], ['season', 50], ['goals', 600]],
  },
  {
    id: 'ronaldinyo', name: 'Ronaldinyo', surname: 'Gauço', nick: 'Gülen Sihirbaz', nat: 'BRA', pos: 'MF', foot: 'R', by: 1980,
    year: 1993, age: 13, club: 'GRM', traits: ['drib'],
    shape: { dribbling: 16, technique: 14, passing: 10, shooting: 6, pace: 4, physical: -4, heading: -10, defending: -14, stamina: -2 },
    intro: 'Porto Alegre sokaklarında, plajda ve salonda top oynayarak büyüdün. 13 yaşındayken bir maçta 23 gol attığın konuşuluyor. Gremio akademisi seni çoktan kaptı.',
    era: '1993 · Gremio altyapısı',
    story: [
      { y: 1999, t: 'Eyalet finalinde ülkenin efsanesini çalımlarla dans ettirdin. Bütün Brezilya adını öğrendi.', fx: (p) => { Player.addFame(p, 5); } },
      { y: 2001, move: 'PSG', t: 'Paris Saint-Gilles Avrupa kapılarını sana açıyor.' },
      { y: 2003, move: 'BAR', t: 'Barcelova FC yeni projesinin yüzü olarak seni istiyor. Camp Nou seni bekliyor!' },
      { y: 2008, move: 'MIL', t: 'Milano Rossoneri\'den teklif: İtalya\'da yeni bir sayfa.' },
      { y: 2011, move: 'FLA', t: 'Flamengo seni memleketine geri çağırıyor.' },
    ],
    goals: [['ballon', 1], ['ucl', 1], ['wc', 1], ['league', 2], ['assists', 150]],
  },
  {
    id: 'zidan', name: 'Zinedin', surname: 'Zidan', nick: 'Usta', nat: 'FRA', pos: 'MF', foot: 'R', by: 1972,
    year: 1986, age: 14, club: 'NIC', traits: ['play'],
    shape: { technique: 15, passing: 13, dribbling: 11, physical: 4, shooting: 4, heading: 2, pace: -4, defending: -8, stamina: 0 },
    intro: 'Marsilya\'nın La Castellane mahallesinde büyüdün. Top ayağındayken zaman yavaşlıyor gibi. Güney sahilindeki bir akademi seni 14 yaşında keşfetti.',
    era: '1986 · Nis Kartalları altyapısı',
    story: [
      { y: 1992, move: 'BDX', t: 'Bordo Girondenler seni profesyonel sahnede yıldızlaştırmak istiyor.' },
      { y: 1996, move: 'JUV', t: 'Juventa Torino Avrupa\'nın en iyi orta sahasını kurmak için seni seçti.' },
      { y: 1998, t: 'Ev sahibi olduğunuz Dünya Kupası\'nın yılı. Bütün ülke umudunu sana bağladı.', fx: (p) => { Player.addMorale(p, 10); Player.addFame(p, 3); } },
      { y: 2001, move: 'RMA', t: 'Real Madrigal dünyanın en pahalı transferi için kapında.' },
    ],
    goals: [['wc', 1], ['euro', 1], ['ucl', 1], ['ballon', 1], ['league', 2]],
  },
  {
    id: 'nazario', name: 'Ronaldu', surname: 'Nazario', nick: 'Fenomen', nat: 'BRA', pos: 'FW', foot: 'R', by: 1976,
    year: 1990, age: 14, club: 'CRU', traits: ['fin'],
    shape: { pace: 15, shooting: 14, dribbling: 12, physical: 6, technique: 6, heading: 2, passing: -2, defending: -16, stamina: -3 },
    intro: 'Rio\'nun banliyölerinde, otobüs parası bulamadığın günlerde bile antrenmana koştun. Kruzeyro seni 14 yaşında akademisine aldı. Hızın ve bitiriciliğin şimdiden efsane.',
    era: '1990 · Kruzeyro altyapısı',
    story: [
      { y: 1994, move: 'PSV', t: 'Eyndhoven Işıkları seni Avrupa\'ya götürmek istiyor. Henüz 18 yaşındasın.' },
      { y: 1996, move: 'BAR', t: 'Barcelova FC ile bir sezon: herkes senin durdurulamaz koşularını izlemek istiyor.' },
      { y: 1997, move: 'INT', t: 'Inter Milanello dünya rekoru bir teklif yaptı.' },
      { y: 1999, t: 'Dizinde ağır bir sakatlık! Doktorlar uzun bir tedavi süreci öngörüyor.', fx: (p, s) => { if (!s.lpath.injured) { s.lpath.injured = true; p.injuryWeeks = Math.max(p.injuryWeeks, 18); Player.addMorale(p, -15); } } },
      { y: 2002, move: 'RMA', t: 'Muhteşem dönüşünün ardından Real Madrigal seni Galaktikler\'e katmak istiyor.' },
    ],
    goals: [['wc', 2], ['ballon', 2], ['league', 2], ['season', 40], ['goals', 350]],
  },
  {
    id: 'hakan', name: 'Hakan', surname: 'Şükürlü', nick: 'Boğa', nat: 'TUR', pos: 'FW', foot: 'R', by: 1971,
    year: 1984, age: 13, club: 'SAK', traits: ['head'],
    shape: { heading: 16, shooting: 12, physical: 10, technique: 2, stamina: 2, pace: -2, dribbling: -4, passing: -2, defending: -10 },
    intro: 'Adapazarı\'nda doğdun. Uzun boyun ve kafa vuruşlarınla mahallede herkesten farklısın. Sakarya Ağaçları altyapısı seni 13 yaşında kadrosuna kattı.',
    era: '1984 · Sakarya Ağaçları altyapısı',
    story: [
      { y: 1989, move: 'BUR', t: 'Bursa Timsahları seni bir üst seviyeye taşımak istiyor.' },
      { y: 1992, move: 'GAL', t: 'Galata Aslanları\'ndan teklif! Bu formayla tarih yazmaya hazır mısın?' },
      { y: 2000, move: 'INT', t: 'Avrupa\'da kazandığınız kupanın ardından Inter Milanello kapında.' },
      { y: 2002, t: 'Dünya Kupası yılı. Ülkenin dev bir kuşağı var, sen de onun kaptanı gibisin.', fx: (p) => { Player.addMorale(p, 8); Player.addRel(p, 'fans', 6); } },
      { y: 2003, move: 'GAL', t: 'Galata Aslanları seni evine geri çağırıyor.' },
    ],
    goals: [['league', 6], ['uel', 1], ['goals', 300], ['intl', 40]],
  },
  {
    id: 'mbappo', name: 'Kylian', surname: 'Mbappo', nick: 'Kaplumbağa', nat: 'FRA', pos: 'FW', foot: 'R', by: 1998,
    year: 2012, age: 14, club: 'ASM', traits: ['fin'],
    shape: { pace: 18, shooting: 12, dribbling: 10, technique: 5, physical: 3, stamina: 2, passing: 0, heading: -6, defending: -14 },
    intro: 'Paris\'in banliyösü Bondy\'de büyüdün. Odanın duvarları idollerinin posterleriyle dolu. Monako Prensleri seni 14 yaşında akademisine aldı: hızın inanılmaz.',
    era: '2012 · Monako Prensleri altyapısı',
    story: [
      { y: 2017, move: 'PSG', t: 'Paris Saint-Gilles memleketine dönmen için rekor bir teklif yaptı.' },
      { y: 2018, t: '19 yaşında Dünya Kupası\'na gidiyorsun. Dünya senin hızını konuşmaya hazırlanıyor.', fx: (p) => { Player.addMorale(p, 8); Player.addFame(p, 3); } },
      { y: 2024, move: 'RMA', t: 'Çocukluk hayalin Real Madrigal sonunda kapında.' },
    ],
    goals: [['wc', 1], ['ucl', 1], ['ballon', 1], ['league', 5], ['goals', 400]],
  },
];

// hedef türleri: [metin, ilerleme]
const LP_GOALS = {
  ballon: { t: (n) => (n > 1 ? `${n} kez Altın Top kazan` : 'Altın Top kazan'), v: (p) => p.trophies.filter((t) => /Altın Top/.test(t)).length },
  ucl: { t: (n) => (n > 1 ? `${n} kez Avrupa Şampiyonlar Kupası kazan` : 'Avrupa Şampiyonlar Kupası kazan'), v: (p) => p.trophies.filter((t) => /Avrupa Şampiyonlar Kupası Şampiyonu/.test(t)).length },
  uel: { t: (n) => (n > 1 ? `${n} kez Avrupa Federasyon Kupası kazan` : 'Avrupa Federasyon Kupası kazan'), v: (p) => p.trophies.filter((t) => /Avrupa Federasyon Kupası Şampiyonu/.test(t)).length },
  wc: { t: (n) => (n > 1 ? `${n} kez Dünya Kupası kazan` : 'Dünya Kupası kazan'), v: (p) => p.trophies.filter((t) => /Dünya Kupası Şampiyonu/.test(t)).length },
  euro: { t: () => 'Avrupa Şampiyonası kazan', v: (p) => p.trophies.filter((t) => /Avrupa Şampiyonası Şampiyonu/.test(t)).length },
  league: { t: (n) => `${n} lig şampiyonluğu yaşa`, v: (p) => p.trophies.filter((t) => /Lig(i)? Şampiyonu/.test(t) && !/U1\d|U2\d/.test(t)).length },
  season: { t: (n) => `Bir sezonda ${n} gol at`, v: (p) => Math.max(0, ...p.history.map((h) => h.goals || 0)) },
  goals: { t: (n) => `Kariyerinde ${n} gol at`, v: (p) => p.totals.goals },
  assists: { t: (n) => `Kariyerinde ${n} asist yap`, v: (p) => p.totals.assists },
  intl: { t: (n) => `Milli takımda ${n} gol at`, v: (p) => p.intl.goals },
};

const LPath = {
  def(id) { return LP_LIST.find((x) => x.id === id); },
  cur() { const s = Game.state; return s && s.lpath ? LPath.def(s.lpath.id) : null; },
  badges() { return Meta.get('sf_lp', {}); },

  menu() {
    if (!Packs.owns('legends')) return Packs.offer('legends');
    const b = LPath.badges();
    const natName = (c) => (Game.nat(c) || { name: c }).name;
    const m = Game.modal(`<div class="ev-tag">Efsanelerin İzinde</div><h2>${Icon('fire')} Bir efsanenin hayatını yaşa</h2>
      <p class="muted">Efsanenin doğduğu yılda, onun altyapısında ve onun yetenekleriyle başla. Hikâyesindeki dönüm noktaları seni bekliyor; aynı yoldan mı gideceksin, yoksa kendi efsaneni mi yazacaksın?</p>
      <div class="lp-list">${LP_LIST.map((x) => `<button type="button" class="lp-r ${b[x.id] ? 'got' : ''}" data-lp="${x.id}">
        ${UI.shirt({ id: x.nat, c1: (NAT_COLORS[x.nat] || ['#1d3c8f'])[0], c2: (NAT_COLORS[x.nat] || ['#1d3c8f', '#fff'])[1] }, 'big')}
        <span><b>${U.esc(x.name + ' ' + x.surname)}</b><em>${U.esc(x.nick)} · ${U.esc(natName(x.nat))} · ${POSITIONS[x.pos].l}</em><small>${U.esc(x.era)}</small>${b[x.id] ? `<small class="lp-best">En iyi uyum: ${b[x.id]}%</small>` : ''}</span></button>`).join('')}</div>
      <p class="muted lp-note">Tüm isimler ve kulüpler kurgusaldır; gerçek kişilerle bağlantılı değildir.</p>`, [{ t: 'Kapat', cls: 'btn-ghost' }], { wide: true });
    U.$$('[data-lp]', m).forEach((el) => (el.onclick = () => LPath.ask(el.dataset.lp)));
  },
  ask(id) {
    const x = LPath.def(id);
    const slot = Legacy.freeSlot();
    if (slot < 0) return Game.modal('<h3>Boş slot yok</h3><p>Yeni bir efsane kariyeri için önce ana menüden bir kariyeri silmelisin.</p>');
    Game.modal(`<div class="ev-tag">${U.esc(x.nick)}</div><h2>${U.esc(x.name + ' ' + x.surname)}</h2><p>${U.esc(x.intro)}</p>
      <div class="lbl">Efsanenin hedefleri</div><ul class="lp-goals">${x.goals.map(([k, n]) => `<li>${U.esc(LP_GOALS[k].t(n))}</li>`).join('')}</ul>`,
    [{ t: 'Vazgeç', cls: 'btn-ghost' }, { t: `${Icon('play')} Hikâyeye başla`, cls: 'btn-big', fn: () => { Game.slot = slot; LPath.start(id); } }], { wide: true });
  },

  start(id) {
    const x = LPath.def(id);
    Create.heir = null;
    Game.newCareer({ name: x.name, surname: x.surname, nation: x.nat, mother: x.nat, foot: x.foot, position: x.pos, alloc: {}, difficulty: 'normal', year: x.year, age: x.age });
    const s = Game.state, p = s.player;
    // efsanenin dünyadaki "kopyası" sahaya çıkmaz: oyuncu odur
    const me = [Player.fullName(p), x.name];
    (s.world.legends || []).forEach((L) => { if (me.includes(L.n)) L.state = 'retired'; });
    Object.values(s.world.clubs).forEach((c) => { if (c.roster) c.roster = c.roster.filter((r) => !me.includes(r.n)); });
    // doğrudan efsanenin altyapısına
    s.street.done = true;
    delete s.world.clubs.STREET;
    s.clubId = x.club;
    s.contract = { type: 'youth', clubId: x.club, wage: 0, years: 0 };
    s.youth = Youth.create(s.world, x.club, p.age);
    Cups.setupYouth(s);
    // yaşıtlarından belirgin biçimde yetenekli, efsanenin oyun tarzıyla
    const base = Math.round(expectedAtAge(p.age) + 9);
    STATS.forEach((st) => (p.stats[st.k] = U.clamp(base + (x.shape[st.k] || 0), 10, 92)));
    p.potential = 99;
    p.traits = x.traits.slice();
    p.fame = 4;
    p.rel.coach = 58;
    p.shirt = { mezzi: 30, ronalda: 28, ronaldinyo: 10, zidan: 10, nazario: 9, hakan: 9, mbappo: 29 }[id] || p.shirt;
    s.lpath = { id, seen: [], done: {}, skipped: 0, taken: 0 };
    s.news = [];
    Game.news(`${x.era}: ${x.name} ${x.surname} hikâyesine başladı. "${x.nick}" lakabını hak edecek mi?`, 'good');
    Game.save();
    Game.render();
    Game.modal(`<div class="ev-tag">Efsanelerin İzinde · ${U.esc(x.nick)}</div><h2>${U.esc(x.name + ' ' + x.surname)}</h2><p>${U.esc(x.intro)}</p>
      <ul class="tips">
        <li>Hikâyenin dönüm noktalarında efsanenin yaptığı transferler sana da teklif edilir. Kabul edip aynı yoldan gidebilir ya da kendi yolunu çizebilirsin.</li>
        <li>Özel yeteneğin: <b>${p.traits.map((t) => (TRAITS.find((y) => y.id === t) || {}).name).join(', ')}</b>.</li>
        <li>Profil ve Merkez ekranında efsanenin hedeflerini takip edebilirsin. Emekli olduğunda kariyerin efsaneyle karşılaştırılır.</li>
      </ul>`, [{ t: 'Başlayalım!', cls: 'btn-big' }], { wide: true });
  },

  // Sezon başında: hikâye olayları ve hedef kontrolü (Game.startNewSeason sonunda çağrılır)
  seasonStart() {
    const s = Game.state, x = LPath.cur();
    if (!x) return;
    LPath.check();
    // efsanevi yetenek: genç yaşta güçlü yanları daha hızlı gelişir
    const p = s.player;
    if (p.age <= 24) STATS.forEach((st) => { const sh = x.shape[st.k] || 0; p.stats[st.k] = Math.min(99, p.stats[st.k] + (sh >= 8 ? 2 : sh >= 0 ? 1 : 0)); });
    const ev = x.story.find((e) => e.y === s.season.year && !e.move && !s.lpath.seen.includes(e.y + ':e'));
    if (ev) {
      s.lpath.seen.push(ev.y + ':e');
      if (ev.fx) ev.fx(s.player, s);
      Game.news(`Efsane yolu: ${ev.t}`, 'good');
      setTimeout(() => Game.modal(`<div class="ev-tag">${U.esc(x.nick)} · ${s.season.year}</div><h3>Hikâyenin dönüm noktası</h3><p>${U.esc(ev.t)}</p>`, [{ t: 'Devam', cls: 'btn-big', fn: () => Game.render() }]), 700);
    }
    // altyapıdayken hikâyedeki akademi değişimi doğrudan olur
    const mv = x.story.find((e) => e.y === s.season.year && e.move && !s.lpath.seen.includes(e.y + ':m'));
    if (mv && Game.isYouth() && s.world.clubs[mv.move]) {
      s.lpath.seen.push(mv.y + ':m');
      s.clubId = mv.move;
      s.contract = { type: 'youth', clubId: mv.move, wage: 0, years: 0 };
      s.youth = Youth.create(s.world, s.clubId, s.player.age);
      Game.news(`Efsane yolu: ${mv.t} ${Game.club().name} altyapısına geçtin.`, 'good');
      Game.save();
    }
  },
  // Transfer dönemi açılınca: hikâyedeki kulüpten özel teklif (Game.transferWeek içinden)
  windowOpen(w) {
    const s = Game.state, x = LPath.cur();
    if (!x || w.id !== 'yaz' || Game.isYouth()) return;
    const mv = x.story.find((e) => e.y === s.season.year && e.move && !s.lpath.seen.includes(e.y + ':m'));
    if (!mv || !s.world.clubs[mv.move] || mv.move === s.clubId) return;
    s.lpath.seen.push(mv.y + ':m');
    const c = s.world.clubs[mv.move], p = s.player;
    const ovr = Player.overall(p, true);
    const pay = (typeof LEAGUE_PAY !== 'undefined' && LEAGUE_PAY[c.league]) || 1;
    const val = Game.marketValue(p, ovr);
    const o = { clubId: c.id, wage: Math.round(Game.wageFor(Math.max(c.rating, ovr), ovr) * pay * 1.25 / 100) * 100, years: 4, fee: Math.round(val * 1.3 / 50000) * 50000, feeType: 'fee', story: true };
    s.offers = [o].concat((s.offers || []).filter((y) => y.clubId !== c.id)).slice(0, 5);
    Game.news(`Efsane yolu: ${mv.t}`, 'good');
    setTimeout(() => Game.modal(`<div class="ev-tag">${U.esc(x.nick)} · Efsane yolu</div><h3>${U.esc(c.name)} seni istiyor!</h3><p>${U.esc(mv.t)}</p><p class="muted">Teklif Merkez ekranındaki transfer tekliflerinde. Kabul edersen efsanenin yolundan gidersin, reddedersen kendi hikâyeni yazarsın.</p>`, [{ t: 'Tamam', cls: 'btn-big' }]), 600);
  },
  // teklif kabul edildiğinde (Game.acceptOffer içinden)
  accepted(o) {
    const s = Game.state;
    if (!s.lpath || !o || !o.story) return;
    s.lpath.taken++;
  },
  progress(p) {
    const x = LPath.cur();
    return x.goals.map(([k, n]) => ({ k, n, v: Math.min(n, LP_GOALS[k].v(p)), t: LP_GOALS[k].t(n) }));
  },
  // efsanenin başarılarına yakınlık (yüzde)
  score(p) {
    const pr = LPath.progress(p);
    return Math.round((pr.reduce((a, g) => a + g.v / g.n, 0) / pr.length) * 100);
  },
  check() {
    const s = Game.state, x = LPath.cur();
    if (!x) return;
    LPath.progress(s.player).forEach((g) => {
      if (g.v >= g.n && !s.lpath.done[g.k]) {
        s.lpath.done[g.k] = s.season.year;
        Game.news(`Efsane hedefi tamam: ${g.t}!`, 'good');
        setTimeout(() => Game.toast(`Efsane hedefi tamam: ${g.t}`, 'good'), 900);
      }
    });
  },
  card() {
    const s = Game.state, x = LPath.cur();
    if (!x) return '';
    const p = s.player;
    const pr = LPath.progress(p);
    const next = x.story.find((e) => e.y >= s.season.year && !s.lpath.seen.includes(e.y + (e.move ? ':m' : ':e')));
    return `<section class="card lp-card"><div class="card-h"><span>${Icon('fire')} Efsane yolu: ${U.esc(x.nick)}</span><small class="muted">uyum ${LPath.score(p)}%</small></div>
      ${next ? `<p class="muted">Sıradaki dönüm noktası: <b>${next.y}</b>${next.move && s.world.clubs[next.move] ? ` · ${U.esc(s.world.clubs[next.move].name)}` : ''}</p>` : ''}
      <div class="lp-gl">${pr.map((g) => `<div class="${g.v >= g.n ? 'ok' : ''}"><span>${U.esc(g.t)}</span><b>${Math.min(g.v, g.n)}/${g.n}</b><div class="msn-bar"><i style="width:${Math.min(100, (g.v / g.n) * 100)}%"></i></div></div>`).join('')}</div></section>`;
  },
  // emeklilikte kariyer sonu ekranına eklenir
  endHtml(s) {
    if (!s || !s.lpath) return '';
    const x = LPath.def(s.lpath.id);
    if (!x) return '';
    const sc = LPath.score(s.player);
    const b = LPath.badges();
    b[x.id] = Math.max(b[x.id] || 0, sc);
    Meta.set('sf_lp', b);
    const verdict = sc >= 90 ? 'Efsanenin ta kendisi oldun!' : sc >= 70 ? 'Efsaneye çok yaklaştın.' : sc >= 40 ? 'Kendi yolunu çizdin ama iz bıraktın.' : 'Bambaşka bir hikâye yazdın.';
    return `<div class="lp-end"><h3>${Icon('fire')} ${U.esc(x.nick)} ile karşılaştırma</h3><div class="end-title">Uyum ${sc}% · ${verdict}</div>
      <ul class="trophies">${LPath.progress(s.player).map((g) => `<li>${g.v >= g.n ? '✓' : '·'} ${U.esc(g.t)}: ${Math.min(g.v, g.n)}/${g.n}</li>`).join('')}</ul></div>`;
  },
};
