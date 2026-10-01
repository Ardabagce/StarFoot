// Madalyalar, kupa vitrini, tek kullanımlık ürünler, sürpriz paketler ve ek olaylar

// ---------- Madalyalar (başarımlar) ----------
const ACHIEVEMENTS = [
  { id: 'debut', name: 'İlk Maç', desc: 'İlk resmi maçına çıktın', tier: 'bronze', check: (p) => p.totals.apps >= 1 },
  { id: 'goal1', name: 'İlk Gol', desc: 'Kariyerinin ilk golünü attın', tier: 'bronze', check: (p) => p.totals.goals >= 1 },
  { id: 'motm1', name: 'Maçın Adamı', desc: 'İlk kez maçın adamı seçildin', tier: 'bronze', check: (p) => p.totals.motm >= 1 },
  { id: 'hat', name: 'Hat-trick', desc: 'Bir maçta 3 gol attın', tier: 'silver', check: (p) => (p.flags || {}).hattrick },
  { id: 'goal50', name: '50 Gol', desc: 'Kariyerinde 50 gole ulaştın', tier: 'silver', check: (p) => p.totals.goals >= 50 },
  { id: 'assist50', name: 'Pas Ustası', desc: '50 asist yaptın', tier: 'silver', check: (p) => p.totals.assists >= 50 },
  { id: 'apps100', name: '100 Maç', desc: '100 maçta forma giydin', tier: 'silver', check: (p) => p.totals.apps >= 100 },
  { id: 'pro', name: 'Profesyonel', desc: 'İlk profesyonel sözleşmeni imzaladın', tier: 'silver', check: () => !Game.isYouth() },
  { id: 'cap1', name: 'Milli Forma', desc: 'Milli takımda forma giydin', tier: 'silver', check: (p) => p.intl.caps >= 1 },
  { id: 'trophy1', name: 'İlk Kupa', desc: 'İlk şampiyonluğunu yaşadın', tier: 'silver', check: (p) => p.trophies.some((t) => /Şampiyon/.test(t)) },
  { id: 'abroad', name: 'Gurbetçi', desc: 'Yurt dışında bir kulübe transfer oldun', tier: 'silver', check: () => !Game.isYouth() && !Game.club().league.startsWith('TR') },
  { id: 'goal150', name: '150 Gol', desc: 'Kariyerinde 150 gole ulaştın', tier: 'gold', check: (p) => p.totals.goals >= 150 },
  { id: 'ovr80', name: 'Dünya Yıldızı', desc: 'Genel gücün 80\'e ulaştı', tier: 'gold', check: (p) => Player.overall(p) >= 80 },
  { id: 'million', name: 'İlk Milyon', desc: 'Hesabında 1 milyon ₺ birikti', tier: 'gold', check: (p) => p.money >= 1e6 },
  { id: 'fame75', name: 'Herkes Seni Tanıyor', desc: 'Ünün 75\'e ulaştı', tier: 'gold', check: (p) => p.fame >= 75 },
  { id: 'cap50', name: 'Milli Takım Efsanesi', desc: '50 milli maça çıktın', tier: 'gold', check: (p) => p.intl.caps >= 50 },
  { id: 'ballon', name: 'Altın Top', desc: 'Yılın futbolcusu seçildin', tier: 'gold', check: (p) => p.trophies.some((t) => /Altın Top/.test(t)) },
];

const Ach = {
  check() {
    const p = Game.p;
    p.ach = p.ach || {};
    const got = [];
    ACHIEVEMENTS.forEach((a) => {
      if (p.ach[a.id]) return;
      let ok = false;
      try { ok = a.check(p); } catch (e) { ok = false; }
      if (ok) { p.ach[a.id] = Game.state.season.year; got.push(a); }
    });
    got.forEach((a) => {
      Game.news(`Yeni madalya: <b>${a.name}</b> · ${a.desc}`, 'good');
      Game.toast(`Yeni madalya: ${a.name}`, 'good');
    });
    return got;
  },
};

// ---------- Kupa vitrini çizimleri ----------
const Trophy = {
  kind(text) {
    if (/Altın Top/.test(text)) return 'ball';
    if (/Gol Kralı/.test(text)) return 'boot';
    if (/Şampiyon/.test(text)) return 'cup';
    if (/Genç/.test(text)) return 'young';
    return 'star';
  },
  svg(kind) {
    const gold = 'url(#tg)';
    const defs = '<defs><linearGradient id="tg" x1="0" x2="1"><stop offset="0" stop-color="#b8860b"/><stop offset=".45" stop-color="#ffe27a"/><stop offset="1" stop-color="#c99a1e"/></linearGradient><linearGradient id="ts" x1="0" x2="1"><stop offset="0" stop-color="#8a96a8"/><stop offset=".5" stop-color="#eef3f8"/><stop offset="1" stop-color="#9aa6b8"/></linearGradient></defs>';
    const base = '<rect x="18" y="56" width="28" height="6" fill="#3a2a14"/><rect x="22" y="50" width="20" height="7" fill="#5a4020"/>';
    const shapes = {
      cup: `<path d="M18 8h28v10c0 10-6 17-14 18-8-1-14-8-14-18z" fill="${gold}"/><path d="M18 11h-6c0 8 3 12 8 13M46 11h6c0 8-3 12-8 13" fill="none" stroke="${gold}" stroke-width="3"/><rect x="29" y="35" width="6" height="10" fill="${gold}"/><rect x="24" y="44" width="16" height="6" fill="${gold}"/>`,
      boot: `<path d="M14 40c0-5 3-8 8-8h6l4-18h8l2 18 10 4c3 1 3 4 3 6v4H14z" fill="${gold}"/><path d="M18 48v3M24 48v3M30 48v3M36 48v3M42 48v3" stroke="#3a2a14" stroke-width="2"/>`,
      ball: `<circle cx="32" cy="26" r="17" fill="${gold}"/><path d="M32 17l7 5-3 8h-8l-3-8z" fill="#8a6410"/><rect x="28" y="43" width="8" height="8" fill="${gold}"/>`,
      young: `<circle cx="32" cy="28" r="14" fill="url(#ts)"/><path d="M26 6l6 10 6-10" fill="none" stroke="#2f6fd6" stroke-width="5"/><path d="M32 22c-4 0-6 3-6 6M32 22c4 0 6 3 6 6M32 22v12" stroke="#2f8c45" stroke-width="3" fill="none"/>`,
      star: `<path d="M26 4l6 10 6-10" fill="none" stroke="#c8102e" stroke-width="5"/><circle cx="32" cy="30" r="15" fill="${gold}"/><path d="M32 20l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="#8a6410"/>`,
    };
    return `<svg viewBox="0 0 64 64" aria-hidden="true">${defs}${shapes[kind]}${kind === 'young' || kind === 'star' ? '' : base}</svg>`;
  },
  medal(tier, earned) {
    const col = { bronze: ['#8a4b1f', '#e0995a'], silver: ['#7d8794', '#eef3f8'], gold: ['#a77a0a', '#ffe27a'] }[tier];
    const id = 'm' + Math.random().toString(36).slice(2, 7);
    return `<svg viewBox="0 0 48 56" aria-hidden="true" class="${earned ? '' : 'locked'}"><defs><linearGradient id="${id}" x1="0" x2="1"><stop offset="0" stop-color="${col[0]}"/><stop offset=".5" stop-color="${col[1]}"/><stop offset="1" stop-color="${col[0]}"/></linearGradient></defs><path d="M14 2h8l4 14h-8zM34 2h-8l-4 14h8z" fill="#c8102e"/><path d="M22 2h4l-2 14z" fill="#f3f1ea"/><circle cx="24" cy="34" r="16" fill="url(#${id})"/><circle cx="24" cy="34" r="11" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="2"/><path d="M24 26l2.4 5 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4-3.9-3.8 5.4-.8z" fill="rgba(0,0,0,.28)"/></svg>`;
  },
};

// ---------- Tek kullanımlık ürünler ----------
const Shop = {
  priceScale() {
    return Game.isYouth() ? 1 + (Game.p.age - 8) * 0.25 : Math.max(3, Game.weeklyIncome() / 400);
  },
  price(c) { return Math.round((c.base * Shop.priceScale()) / 10) * 10; },
  available(c) {
    const p = Game.p;
    return p.age >= c.minAge && (!c.maxAge || p.age <= c.maxAge);
  },
  usedThisSeason(c) {
    const u = Game.p.used || {};
    return (c.id === 'camp' || c.id === 'clinic') && u[c.id] === Game.state.season.year;
  },
  use(id) {
    const p = Game.p, s = Game.state;
    const c = CONSUMABLES.find((x) => x.id === id);
    const price = Shop.price(c);
    if (p.money < price) return Game.toast('Yeterli paran yok.', 'bad');
    if (Shop.usedThisSeason(c)) return Game.toast('Bunu bu sezon zaten kullandın.', 'bad');
    let msg = '';
    if (id === 'drink') { Player.addEnergy(p, 25); msg = 'Enerji +25'; }
    if (id === 'massage') { Player.addEnergy(p, 15); Player.addMorale(p, 6); msg = 'Enerji +15, moral +6'; }
    if (id === 'physio') {
      if (!p.injuryWeeks) return Game.toast('Sakat değilsin, fizyoterapiye gerek yok.', 'bad');
      p.injuryWeeks = Math.max(0, p.injuryWeeks - 2);
      msg = p.injuryWeeks ? `Sakatlık ${p.injuryWeeks} haftaya indi` : 'Sakatlığın tamamen geçti';
    }
    if (id === 'camp') {
      const ks = U.shuffle(STATS.map((x) => x.k)).slice(0, 3);
      msg = ks.map((k) => `${STATS.find((x) => x.k === k).l} +${Player.train(p, k, 3, 1.1).toFixed(1)}`).join(', ');
    }
    if (id === 'clinic') {
      const k = s.trainFocus;
      msg = `${STATS.find((x) => x.k === k).l} +${Player.train(p, k, 5, 1.15).toFixed(1)}`;
    }
    p.money -= price;
    p.used = p.used || {};
    p.used[id] = s.season.year;
    Game.toast(`${c.name}: ${msg}`, 'good');
    Game.save();
    Game.render();
  },
};

// ---------- Sürpriz paket (iyi maçlardan sonra) ----------
const Loot = {
  roll(rating) {
    if (rating == null) return;
    const p = Game.p;
    const chance = rating >= 8 ? 0.6 : rating >= 7.2 ? 0.3 : 0.08;
    if (!U.chance(chance)) return;
    Game.state.pendingLoot = { tier: rating >= 8.5 ? 'gold' : rating >= 7.5 ? 'silver' : 'bronze' };
  },
  show() {
    const s = Game.state, p = s.player;
    const L = s.pendingLoot;
    const tierName = { gold: 'Altın', silver: 'Gümüş', bronze: 'Bronz' }[L.tier];
    const mult = { gold: 3, silver: 2, bronze: 1 }[L.tier];
    const m = Game.modal(`
      <div class="loot">
        <div class="ev-tag">Sürpriz</div>
        <h3>${tierName} Sürpriz Paket</h3>
        <p>Harika oyunun sana bir hediye kazandırdı. Açmak için pakete dokun.</p>
        <button type="button" class="loot-box ${L.tier}" id="loot-open" aria-label="Paketi aç"><span></span></button>
        <div class="loot-res" id="loot-res"></div>
      </div>`, [{ t: 'Kapat', cls: 'btn-ghost' }]);
    const btn = m.querySelector('#loot-open');
    btn.onclick = () => {
      if (btn.classList.contains('open')) return;
      btn.classList.add('open');
      const scale = Game.isYouth() ? 60 + (p.age - 8) * 30 : Game.weeklyIncome() * 0.35;
      const prizes = [
        () => { const a = Math.round(scale * mult * U.rand(1, 2) / 10) * 10; p.money += a; return `${U.money(a)} para`; },
        () => { Player.addEnergy(p, 20 * mult); return `+${20 * mult} enerji`; },
        () => { const k = U.pick(STATS).k; const g = Player.train(p, k, 1.5 * mult, 1); return `${STATS.find((x) => x.k === k).l} +${g.toFixed(2)}`; },
        () => { Player.addMorale(p, 8 * mult); Player.addFame(p, 0.5 * mult); return `+${8 * mult} moral, ün artışı`; },
      ];
      const res = U.pick(prizes)();
      s.pendingLoot = null;
      setTimeout(() => {
        m.querySelector('#loot-res').innerHTML = `<b>${res}</b>`;
        Game.save();
        Game.render();
      }, 650);
    };
  },
};

// ---------- Ek rastgele olaylar ----------
Events.list.push(
  {
    id: 'idolcamp', cond: (p) => p.age <= 16,
    text: () => `${Legends.idol(Game.state.world)}, şehrine gelip bir futbol okulu kampı düzenliyor. Seni de davet ettiler!`,
    opts: [
      { t: 'Kampa katıl', fx: (p) => { const a = Player.train(p, 'technique', 2, 1.1), b = Player.train(p, 'dribbling', 2, 1.1); Player.addEnergy(p, -15); Player.addMorale(p, 8); return `Hayatının günü! Teknik +${a.toFixed(1)}, Top Sürme +${b.toFixed(1)}`; } },
      { t: 'Katılamam', fx: () => 'Belki bir dahaki sefere.' },
    ],
  },
  {
    id: 'wallet', cond: () => true,
    text: () => 'Antrenman dönüşü yolda içi para dolu bir cüzdan buldun.',
    opts: [
      { t: 'Sahibine götür', fx: (p) => { Player.addRel(p, 'fans', 4); Player.addMorale(p, 5); Player.addFame(p, 0.5); if (U.chance(0.45)) { const a = Game.isYouth() ? 300 : Math.round(Game.weeklyIncome() * 0.3); p.money += a; return `Sahibi çok sevindi ve sana ${U.money(a)} ödül verdi!`; } return 'Dürüstlüğün haberlere çıktı, taraftarlar seni sevdi.'; } },
      { t: 'Cüzdanı al', fx: (p) => { const a = Game.isYouth() ? 200 : Math.round(Game.weeklyIncome() * 0.2); p.money += a; Player.addMorale(p, -6); if (U.chance(0.35)) { Player.addRel(p, 'fans', -8); return 'Kameralara yakalandın! Taraftarlar hayal kırıklığına uğradı.'; } return `+${U.money(a)} ama vicdanın rahat değil.`; } },
    ],
  },
  {
    id: 'birthday', cond: () => Game.state.season.round <= 2,
    text: () => 'Doğum günün kutlu olsun! Ailen ve arkadaşların sana sürpriz parti hazırladı.',
    opts: [{ t: 'Hediyeleri aç', fx: (p) => { const a = Game.isYouth() ? 250 + p.age * 30 : Math.round(Game.weeklyIncome() * 0.5); p.money += a; Player.addMorale(p, 10); return `Moral +10 ve ${U.money(a)} harçlık!`; } }],
  },
  {
    id: 'street', cond: (p) => p.age <= 15,
    text: () => 'Mahallede çocuklar maç yapıyor, seni de oynamaya çağırıyorlar.',
    opts: [
      { t: 'Oyna', fx: (p) => { const g = Player.train(p, 'dribbling', 1, 1); Player.addEnergy(p, -10); Player.addMorale(p, 5); return `Sokak futbolu gibisi yok! Top Sürme +${g.toFixed(2)}`; } },
      { t: 'Dinlenmem lazım', fx: (p) => { Player.addEnergy(p, 5); return 'Enerjini korudun.'; } },
    ],
  },
  {
    id: 'viral', cond: (p) => p.fame >= 4,
    text: () => 'Antrenmanda attığın röveşata golü sosyal medyada viral oldu!',
    opts: [{ t: 'Paylaşımları izle', fx: (p) => { Player.addFame(p, 2); Player.addRel(p, 'fans', 5); Player.addMorale(p, 5); return 'Ünün ve taraftar desteğin arttı.'; } }],
  },
  {
    id: 'mentor', cond: () => true,
    text: () => `Takımın kaptanı ${Events.mate()} sana mentorluk yapmayı teklif ediyor.`,
    opts: [
      { t: 'Kabul et', fx: (p) => { const k = U.pick(['passing', 'technique', 'defending', 'heading']); const g = Player.train(p, k, 1.4, 1); Player.addRel(p, 'team', 4); Player.addEnergy(p, -6); return `${STATS.find((x) => x.k === k).l} +${g.toFixed(2)}, takım ilişkisi arttı.`; } },
      { t: 'Gerek yok', fx: (p) => { Player.addRel(p, 'team', -2); return 'Kaptan biraz bozuldu.'; } },
    ],
  },
  {
    id: 'ballraffle', cond: () => true,
    text: () => `Kulübün çekilişinden ${Legends.idol(Game.state.world)} imzalı bir top kazandın!`,
    opts: [
      { t: 'Sat', fx: (p) => { const a = Game.isYouth() ? 800 : Math.round(Game.weeklyIncome() * 0.6); p.money += a; return `${U.money(a)} kazandın.`; } },
      { t: 'Odama koy', fx: (p) => { Player.addMorale(p, 8); return 'Her baktığında motive oluyorsun. Moral +8'; } },
    ],
  },
  {
    id: 'rain', cond: () => true,
    text: () => 'Bugünkü antrenman sağanak yağmur altında yapılacak.',
    opts: [
      { t: 'Yine de git', fx: (p) => { const g = Player.train(p, 'stamina', 1.2, 1); Player.addRel(p, 'coach', 3); Player.addEnergy(p, -10); if (U.chance(0.08)) Game.injure(1, 'Kaygan zeminde'); return `Hoca azmine hayran kaldı. Dayanıklılık +${g.toFixed(2)}`; } },
      { t: 'Evde kal', fx: (p) => { Player.addRel(p, 'coach', -2); Player.addEnergy(p, 6); return 'Kuru kaldın ama hoca not aldı.'; } },
    ],
  },
  {
    id: 'tvshow', cond: (p) => !Game.isYouth() && p.fame >= 15,
    text: () => 'Popüler bir spor programı seni canlı yayına konuk etmek istiyor.',
    opts: [
      { t: 'Programa çık', fx: (p) => { const a = Math.round(Game.weeklyIncome() * 0.4); p.money += a; Player.addFame(p, 3); Player.addEnergy(p, -8); return `Ün +3 ve ${U.money(a)} katılım ücreti.`; } },
      { t: 'Reddet', fx: () => 'Odağını futbola verdin.' },
    ],
  },
  {
    id: 'allstar', cond: (p) => !Game.isYouth() && p.fame >= 30,
    text: () => { const a = Legends.active(Game.state.world).sort((x, y) => y.r - x.r); return `${a[0] ? a[0].n : 'Dünya yıldızları'}${a[1] ? ' ve ' + a[1].n : ''} gibi yıldızların oynayacağı bir yardım maçına davet edildin!`; },
    opts: [
      { t: 'Katıl', fx: (p) => { Player.addFame(p, 4); Player.addRel(p, 'fans', 6); Player.addMorale(p, 8); Player.addEnergy(p, -15); return 'Efsanelerle aynı sahayı paylaştın!'; } },
      { t: 'Dinlenmeyi seç', fx: (p) => { Player.addEnergy(p, 5); return 'Bir sonraki maça odaklandın.'; } },
    ],
  },
);

// ---------- Sosyal medya (takipçi, paylaşım, beğeni) ----------
const SOCIAL_COMMENTS = {
  goal: ['Kral!', 'Bu çocuk ileride Mezzi olur', 'Gol makinesi çalışıyor', 'Kaleciye geçmiş olsun', 'Ben bunu çok önceden söylemiştim', 'Şu vuruşu 40 kez izledim', 'Rakip defans hâlâ seni arıyor', 'Formanı ver abi'],
  motm: ['Maçın adamı değil maçın kralı', 'Hoca bunu her maç oynat', 'Reyting değil roket', 'Bugün sahada tek kişi vardı'],
  trophy: ['Vitrine bir kupa daha!', 'Şampiyon olan kim? Biziz!', 'Bu daha başlangıç', 'Gözlerim doldu valla'],
  transfer: ['Yeni takımına hayırlı olsun', 'Eski takım üzgün yeni takım mutlu', 'Formanı şimdiden aldım', 'Bonservis kaç ya?'],
  life: ['Bu araba benim maaşımdan pahalı', 'Bir tur atalım mı?', 'Hak ettin kardeşim', 'Zenginlik yakışmış'],
  daily: ['Antrenmanda bile karizma', 'Takip edene takip', 'Bu selfie maç kazandırır', 'Saç modeli efsane', 'Beni de antrenmana götür', 'Annemle beraber hayranız'],
};

const Social = {
  ensure(p) {
    if (!p.social) {
      const base = (p.name + p.surname).toLowerCase().replace(/[^a-zçğıöşü]/g, '').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u');
      p.social = { handle: '@' + base + p.shirt, followers: 40 + U.randi(0, 60), following: U.randi(80, 260), posts: [] };
    }
    return p.social;
  },
  target(p) {
    return Math.round(120 * Math.exp(p.fame * 0.145) * (Game.isYouth() ? 0.7 : 1));
  },
  fmt(n) {
    n = Math.round(n);
    if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace('.', ',') + ' Mn';
    if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace('.', ',') + ' B';
    return String(n);
  },
  // Dünya gündemi: yıldızların veda, ilk maç ve transfer paylaşımları
  trend(x) {
    const so = Social.ensure(Game.p);
    so.trends = so.trends || [];
    const handle = '@' + x.L.n.toLowerCase().replace(/[^a-zçğıöşü]/g, '').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u');
    const text = { retire: 'Teşekkürler futbol. Her şey için minnettarım. Şimdi yeni bir sayfa.', debut: 'İlk profesyonel sözleşmemi imzaladım! Hayaller gerçek oluyor.', transfer: 'Yeni maceraya hazırım. Yeni formam çok yakıştı mı?' }[x.kind];
    const likes = Math.round(Math.exp(x.L.peak * 0.19) * U.rand(0.6, 1.4));
    so.trends.unshift({ u: handle, n: x.L.n, kind: x.kind, text, likes, y: Game.state.season.year + 1 });
    so.trends = so.trends.slice(0, 8);
  },
  week() {
    const p = Game.p, so = Social.ensure(p);
    const tgt = Social.target(p);
    so.followers = Math.max(10, Math.round(so.followers + (tgt - so.followers) * 0.22 + so.followers * U.rand(-0.004, 0.01)));
  },
  post(kind, text, boost = 1) {
    const p = Game.p, so = Social.ensure(p), s = Game.state;
    const likes = Math.round(so.followers * U.rand(0.05, 0.12) * boost) + U.randi(1, 9);
    const pool = SOCIAL_COMMENTS[kind] || SOCIAL_COMMENTS.daily;
    const fans = ['futbolsever', 'tribunsesi', 'golkrali', 'altyapi_avcisi', 'mahallemizin_yildizi', 'sahakenari', 'cimbomkalbim', 'kanarya1907', 'kartalgozu', 'taraftar_ayse', 'deden_gururlu'];
    const comments = U.shuffle(pool).slice(0, 2).map((c) => ({ u: U.pick(fans) + U.randi(1, 99), t: c }));
    so.posts.unshift({ kind, text, likes, comments, w: `${s.season.year} H${s.season.round + 1}` });
    so.posts = so.posts.slice(0, 12);
    so.followers += Math.round(likes * 0.03 * boost);
  },
  afterMatch(sum, teamName) {
    if (!sum.played) return;
    if (sum.goals >= 3) Social.post('goal', `Hat-trick! ${teamName} formasıyla unutulmaz bir gece. Topu eve götürüyorum.`, 2.2);
    else if (sum.goals > 0) Social.post('goal', U.pick([`Golümü attım, 3 puanı aldık. Sıradaki maça!`, `Ağlar sallandı! Desteğiniz için teşekkürler.`, `Bu gol ailemize gelsin.`, `Çalıştık, kazandık. Gol bonusu da cabası.`]), 1.3);
    else if (sum.motm) Social.post('motm', `Maçın adamı ödülü takımımın. Birlikte daha güçlüyüz.`, 1.4);
    else if (sum.assists > 0 && U.chance(0.5)) Social.post('goal', `Asist de en az gol kadar güzel. Arkadaşımı tebrik ederim.`, 1.1);
  },
  render(full) {
    const p = Game.p, so = Social.ensure(p);
    const likes = so.posts.reduce((t, x) => t + x.likes, 0);
    const icon = { goal: 'ball', motm: 'star', trophy: 'career', transfer: 'contract', life: 'life', daily: 'phone' };
    const posts = so.posts.slice(0, full ? 8 : 2);
    return `
      <section class="card social">
        <div class="card-h"><span>${Icon('phone')} Sosyal Medya</span><small class="muted">${U.esc(so.handle)}</small></div>
        <div class="so-head">
          <canvas class="so-avatar" aria-hidden="true"></canvas>
          <div class="so-stats">
            <div><b>${so.posts.length}</b><span>Gönderi</span></div>
            <div><b>${Social.fmt(so.followers)}</b><span>Takipçi</span></div>
            <div><b>${Social.fmt(so.following)}</b><span>Takip</span></div>
            <div><b>${Social.fmt(likes)}</b><span>Beğeni</span></div>
          </div>
        </div>
        ${(so.trends || []).length ? `<div class="lbl">Gündem</div><div class="so-trends">${so.trends.slice(0, full ? 6 : 2).map((x) => `<div class="so-tr ${x.kind}"><b>${U.esc(x.u)}</b><span>${U.esc(x.text)}</span><small>${Icon('heart')}${Social.fmt(x.likes)} · ${x.y}</small></div>`).join('')}</div><div class="lbl">Paylaşımların</div>` : ''}
        ${posts.length ? `<div class="so-posts">${posts.map((x) => `
          <article class="so-post ${x.kind}">
            <div class="so-img">${Icon(icon[x.kind] || 'phone')}</div>
            <div class="so-body">
              <p>${U.esc(x.text)}</p>
              <div class="so-meta"><span class="heart">${Icon('heart')}${Social.fmt(x.likes)} beğeni</span><small>${x.w}</small></div>
              ${x.comments.map((c) => `<div class="so-c"><b>${U.esc(c.u)}</b> ${U.esc(c.t)}</div>`).join('')}
            </div>
          </article>`).join('')}</div>` : '<p class="muted">Henüz paylaşım yok. Gol at ya da haftalık planda "Sosyal Medya" ile paylaşım yap.</p>'}
      </section>`;
  },
  drawAvatar() {
    U.$$('.so-avatar').forEach((cv) => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = 72 * dpr; cv.height = 72 * dpr;
      const c = cv.getContext('2d');
      const club = Game.club();
      c.fillStyle = club.c1; c.beginPath(); c.arc(36 * dpr, 36 * dpr, 36 * dpr, 0, Math.PI * 2); c.fill();
      c.save(); c.beginPath(); c.arc(36 * dpr, 36 * dpr, 33 * dpr, 0, Math.PI * 2); c.clip();
      c.fillStyle = '#16244f'; c.fillRect(0, 0, 72 * dpr, 72 * dpr);
      Sprites.figure(c, 36 * dpr, 120 * dpr, 115 * dpr, { kit: Sprites.kit(club, false), look: Sprites.look(7), facing: 'down', t: 0 });
      c.restore();
    });
  },
};

// ---------- Dünyadan haberler (tekrar etmeyen, ara ara mizahi) ----------
const WorldNews = {
  star() {
    const w = Game.state.world;
    const act = Legends.active(w);
    if (act.length) { const a = U.pick(act); return { n: a.n, club: (w.clubs[a.L.club] || {}).name || '' }; }
    const c = U.pick(Object.values(w.clubs).filter((x) => x.rating >= 75));
    const pl = c.roster.slice().sort((a, b) => b.r - a.r)[0];
    return { n: pl.n, club: c.name };
  },
  live(name) { return Game.state.world.legends && Game.state.world.legends.some((L) => L.n === name && L.state === 'active'); },
  bigClub() { return U.pick(Object.values(Game.state.world.clubs).filter((c) => c.rating >= 78)).name; },
  anyClub() { return U.pick(Object.values(Game.state.world.clubs)).name; },
  lastResults() {
    const s = Game.state, r = s.season.round - 1;
    const out = [];
    LEAGUES.forEach((l) => s.world.leagues[l.id].results.filter((x) => x.round === r).forEach((x) => out.push(Object.assign({ lg: l.name }, x))));
    return out;
  },
  templates: [
    { id: 'pajama', f: (W) => { const a = W.star(); return `${a.n} antrenmana pijamayla geldi. Teknik direktör: "En azından renkler kulübe uygundu."`; } },
    { id: 'hair', f: (W) => { const a = W.star(); return `Yeni saç modeliyle antrenmana gelen ${a.n} sosyal medyada gündem oldu. ${a.club} taraftarı ikiye bölündü.`; } },
    { id: 'icecream', f: (W) => { const a = W.star(); return `İddia: ${a.n} yeni sözleşmesine "her golden sonra bir dondurma" maddesi koydurdu.`; } },
    { id: 'radar', f: (W) => { const a = W.star(); return `${W.bigClub()}, ${a.n} için harekete geçti! Menajeri: "Telefonum o kadar çok çalıyor ki şarjım yetmiyor."`; } },
    { id: 'rewatch', f: (W) => { const a = W.star(); return `${a.n}, son golünü 47 kez izlediğini itiraf etti: "48. izleyişte daha da güzeldi."`; } },
    { id: 'president', f: (W) => `${W.anyClub()} başkanı transfer dönemi için konuştu: "Kasada para var, sadece anahtarı bulamadık."` },
    { id: 'mezzi', f: (W) => !W.live('Lionel Mezzi') ? null : 'Lionel Mezzi bu sezon maç başına ortalama 4 çalım atıyor. Rakip defanslar ortak bir terapiste gidiyor.' },
    { id: 'ronalda', f: (W) => !W.live('Cristiano Ronalda') ? null : 'Cristiano Ronalda yeni antrenman videosu paylaştı. Karın kaslarının ayrı bir hesap açacağı konuşuluyor.' },
    { id: 'lace', f: (W) => `${W.anyClub()} kalecisi bağcığını bağlarken gol yedi. Açıklaması kısa: "Bağcık bizim değildi."` },
    { id: 'watch', f: (W) => { const a = W.star(); return `${a.n} bu hafta maçta ${U.randi(12, 14)},${U.randi(1, 9)} km koştu. Akıllı saati "lütfen dur" uyarısı verdi.`; } },
    { id: 'emoji', f: (W) => { const a = W.star(), b = W.star(); return a.n === b.n ? null : `${a.n} ile ${b.n} arasında sosyal medyada "kim daha hızlı" tartışması çıktı. Yarış önerisi geldi.`; } },
    { id: 'mascot', f: (W) => `${W.anyClub()} maskotu devre arasında penaltıda 3'te 3 yaptı. Taraftarlar maskotun kadroya alınmasını istiyor.` },
    { id: 'lunch', f: (W) => { const a = W.star(); return `Transfer sorusuna ${a.n} kısa cevap verdi: "Şu an tek düşündüğüm öğle yemeği."`; } },
    { id: 'cat', f: (W) => { const a = W.star(); return `${a.n} hafif sakatlandı. Evde kedisine çalım atmaya çalışırken halıya takılmış.`; } },
    { id: 'mom', f: (W) => { const a = W.star(); return `${a.n} sahadayken annesi tribünde 90 dakika boyunca hakeme itiraz etti. Hakem: "Ben bile ikna oldum."`; } },
    { id: 'var', f: (W) => `${W.anyClub()} maçında VAR incelemesi 9 dakika sürdü. Seyirciler bu sürede çay demledi.` },
    { id: 'halland', f: (W) => !W.live('Erling Halland') ? null : 'Erling Halland kahvaltıda 14 yumurta yediğini açıkladı. Tavuk çiftlikleri vardiya ekledi.' },
    { id: 'yamel', f: (W) => !W.live('Lamin Yamel') ? null : 'Lamin Yamel ödevini yetiştirdikten sonra hat-trick yaptı. Öğretmeni ek puan verdi.' },
    { id: 'bigwin', f: (W) => { const r = W.lastResults().sort((a, b) => Math.abs(b.hs - b.as) - Math.abs(a.hs - a.as))[0]; if (!r || Math.abs(r.hs - r.as) < 3) return null; const c = Game.state.world.clubs; const win = r.hs > r.as ? c[r.h].name : c[r.a].name, lose = r.hs > r.as ? c[r.a].name : c[r.h].name; return `${r.lg}'nde haftanın farkı: ${win}, ${lose} karşısında ${Math.max(r.hs, r.as)}-${Math.min(r.hs, r.as)} kazandı. Kaybeden teknik direktör: "Çim çok kaygandı."`; } },
    { id: 'upset', f: (W) => { const c = Game.state.world.clubs; const r = W.lastResults().find((x) => (x.hs > x.as && c[x.a].rating - c[x.h].rating >= 8) || (x.as > x.hs && c[x.h].rating - c[x.a].rating >= 8)); if (!r) return null; const win = r.hs > r.as ? c[r.h].name : c[r.a].name, lose = r.hs > r.as ? c[r.a].name : c[r.h].name; return `Haftanın sürprizi ${r.lg}'nden: ${win}, favori rakibi ${lose} karşısında ${Math.max(r.hs, r.as)}-${Math.min(r.hs, r.as)} kazandı.`; } },
    { id: 'leader', f: () => { const l = U.pick(LEAGUES); const t = World.sortedTable(Game.state.world.leagues[l.id])[0]; if (!t || !t.p) return null; return `${l.name}'nde zirvede ${Game.state.world.clubs[t.id].name} var (${t.pts} puan). Rakipleri takvim yaprağı koparmaktan çekinir oldu.`; } },
    { id: 'scorer', f: () => { const l = U.pick(LEAGUES); const t = World.topScorers(Game.state.world.leagues[l.id], 1)[0]; if (!t || t.g < 3) return null; return `${t.name}, ${t.g} golle ${l.name} gol krallığı yarışında önde. Kaleciler geceleri onu rüyasında görüyor.`; } },
    { id: 'scout', f: (W) => (Game.p.fame >= 8 ? `${W.bigClub()} gözlemcileri genç yetenek ${Game.p.name} ${Game.p.surname} için not defterini doldurdu.` : null) },
    { id: 'myfollow', f: () => { const so = Social.ensure(Game.p); return so.followers >= 5000 ? `Sosyal medyada ${Social.fmt(so.followers)} takipçiye ulaşan ${Game.p.name} ${Game.p.surname} için mahalledeki berber "o benim müşterim" diyor.` : null; } },
    { id: 'referee', f: (W) => `${W.anyClub()} maçının hakemi kartlarını soyunma odasında unuttu. Sarı kartı "zihinden" gösterdi.` },
    { id: 'drone', f: (W) => `${W.anyClub()} antrenmanını izleyen dron, kaleci tarafından yumrukla uzaklaştırıldı. Kaleci: "Refleks."` },
  ],
  roll() {
    const s = Game.state;
    s.newsUsed = s.newsUsed || [];
    const pool = U.shuffle(WorldNews.templates.filter((t) => !s.newsUsed.includes(t.id)));
    for (const t of pool) {
      let txt = null;
      try { txt = t.f(WorldNews); } catch (e) { txt = null; }
      if (!txt) continue;
      s.newsUsed.push(t.id);
      s.newsUsed = s.newsUsed.slice(-16);
      Game.news(txt, 'world');
      return;
    }
  },
};
