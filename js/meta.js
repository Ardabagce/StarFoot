// Oyuncuyu uzun süre bağlayan sistemler: büyük maçlar (derbi/final), basın toplantısı,
// günlük seri ve görevler, ezeli rakip, Altın Yıldız, özel yetenekler, rekorlar, nesil modu, senaryolar.

// ---------- Derbiler ----------
const DERBIES = [
  ['GAL', 'FNK', 'Kıtalararası Derbi'], ['GAL', 'BJK', 'İstanbul Derbisi'], ['FNK', 'BJK', 'İstanbul Derbisi'], ['TRB', 'FNK', 'Karadeniz Derbisi'],
  ['MCS', 'MUN', 'Manchester Derbisi'], ['ARS', 'TOT', 'Kuzey Londra Derbisi'], ['LIV', 'EVE', 'Merseyside Derbisi'], ['LIV', 'MUN', 'Kuzeyin Klasiği'], ['ARS', 'CHE', 'Londra Derbisi'],
  ['RMA', 'BAR', 'El Klasiko'], ['RMA', 'ATM', 'Madrid Derbisi'], ['BET', 'SEV', 'Sevilya Derbisi'],
  ['BAY', 'BVB', 'Der Klassiker'],
  ['INT', 'MIL', 'Milano Derbisi'], ['ROM', 'LAZ', 'Roma Derbisi'], ['JUV', 'INT', 'İtalya Derbisi'], ['JUV', 'TOR', 'Torino Derbisi'],
  ['PSG', 'ASM', 'Fransa Zirvesi'], ['PSG', 'PFC', 'Paris Derbisi'],
  ['AJX', 'FEY', 'Hollanda Klasiği'], ['AJX', 'PSV', 'Hollanda Zirvesi'],
  ['BEN', 'SPL', 'Lizbon Derbisi'], ['BEN', 'FCP', 'Portekiz Klasiği'],
  ['FLA', 'FLU', 'Fla-Flu'], ['CRN', 'PLM', 'Paulista Derbisi'], ['RIV', 'BJR', 'Süper Klasik'],
  ['CLT', 'RNG', 'Glazgov Derbisi'], ['CLB', 'AND', 'Belçika Klasiği'],
  ['LAG', 'LAF', 'Los Anjeles Derbisi'], ['AME', 'GDL', 'Meksika Klasiği'], ['HIL', 'NSR', 'Riyad Derbisi'], ['URW', 'KSM', 'Japonya Klasiği'],
];

const Big = {
  derby(a, b) {
    const d = DERBIES.find(([x, y]) => (x === a && y === b) || (x === b && y === a));
    return d ? d[2] : null;
  },
  // Maç öncesi: derbi/final etiketi, atmosfer ve gerekirse basın toplantısı
  async prepare(ctx, stage) {
    const s = Game.state;
    if (!s || Game.inStreet() || Game.isYouth()) return;
    const derby = Big.derby(ctx.home.id, ctx.away.id);
    const final = stage === 'Final';
    if (derby) { ctx.derby = derby; ctx.compName = `${derby} · ${ctx.compName}`; ctx.levelBase = (ctx.levelBase || 0) + 0.02; ctx.sbTag = derby.toLocaleUpperCase('tr'); }
    if (final) { ctx.final = true; ctx.levelBase = (ctx.levelBase || 0) + 0.02; }
    const big = derby || final || stage === 'Yarı Final' || stage === 'Çeyrek Final' || stage === 'Son 16';
    if (big && ctx.role !== 'out') await Press.ask(ctx, derby ? 'derby' : final ? 'final' : 'ko');
  },
};

// ---------- Basın toplantısı ----------
const PRESS_Q = {
  derby: [
    { q: '{opp} hocası "Bizim için sıradan bir maç" dedi. Ne cevap verirsin?', a: ['Sahada konuşuruz, saygı duyuyoruz.', 'Sıradan mı? Pazar günü göreceğiz!', 'Onları kendi sahalarında ezeceğiz!'] },
    { q: 'Derbi haftasında taraftar senden ne bekliyor?', a: ['Takım için ne gerekiyorsa yapacağım.', 'Gol bekliyorlar, gol atacağım.', 'Bu derbiyi ben bitireceğim.'] },
    { q: '{opp} savunmasının seni durduracağını söylüyorlar. Ne dersin?', a: ['İyi bir savunmaları var, hazırlandık.', 'Söylemek kolay, durdurmak zor.', 'Kimse beni durduramaz!'] },
  ],
  final: [
    { q: 'Finalden önce nasıl hissediyorsun?', a: ['Sakinim, plana odaklandım.', 'Bu kupayı çok istiyorum.', 'Kupa zaten bizim, sadece kaldırmaya gidiyoruz.'] },
    { q: 'Kariyerinin en büyük maçı mı bu?', a: ['Her maç önemli, adım adım.', 'Evet, bu gece tarih yazacağız.', 'Asıl büyük maçlarım daha gelecek, ben buyum.'] },
  ],
  ko: [
    { q: 'Eleme turunda baskı hissediyor musun?', a: ['Baskı bizi daha güçlü yapıyor.', 'Tur atlamak için buradayız.', 'Baskı rakipte, biz favoriyiz.'] },
    { q: '{opp} karşısında favori siz misiniz?', a: ['Futbolda favori yoktur.', 'Kendimize güveniyoruz.', 'Elbette, aradaki fark çok büyük.'] },
  ],
};
// cevap etkileri: [moral, taraftar, hoca, ün, maç zorluğu]
const PRESS_FX = [[3, 1, 2, 0.2, 0], [2, 4, 0, 0.6, 0.01], [1, 7, -3, 1.2, 0.03]];
const Press = {
  ask(ctx, kind) {
    const s = Game.state, p = s.player;
    const opp = ctx.side === 'home' ? ctx.away.name : ctx.home.name;
    const q = U.pick(PRESS_Q[kind] || PRESS_Q.ko);
    return new Promise((res) => {
      const m = Game.modal(`<div class="press">
          <div class="ev-tag">${kind === 'derby' ? `${U.esc(ctx.derby)} · Basın Toplantısı` : kind === 'final' ? 'Final · Basın Toplantısı' : 'Basın Toplantısı'}</div>
          <div class="press-mics"><i></i><i></i><i></i></div>
          <h3>${U.esc(q.q.replace('{opp}', opp))}</h3>
          <div class="press-opts">${q.a.map((t, i) => `<button class="btn btn-ghost press-a" data-pa="${i}"><small>${['Sakin', 'Kendinden emin', 'İddialı'][i]}</small>${U.esc(t)}</button>`).join('')}</div>
        </div>`, [{ t: 'Yorum yapmadan geç', cls: 'btn-ghost', fn: res }]);
      U.$$('[data-pa]', m).forEach((b) => (b.onclick = () => {
        const i = +b.dataset.pa, fx = PRESS_FX[i];
        m.classList.add('hidden'); m.innerHTML = '';
        Player.addMorale(p, fx[0]); Player.addRel(p, 'fans', fx[1]); Player.addRel(p, 'coach', fx[2]); Player.addFame(p, fx[3]);
        ctx.levelBase = (ctx.levelBase || 0) + fx[4];
        ctx.pressBold = i === 2;
        Game.news(`🎙️ Basın toplantısı: "${q.a[i]}"${i === 2 ? ` Sözlerin ${U.esc(opp)} cephesinde tepki çekti.` : ''}`, 'me');
        if (typeof Sfx !== 'undefined') Sfx.play('shutter');
        res();
      }));
    });
  },
};

// ---------- Ortak yardımcılar ----------
const Meta = {
  today(off = 0) { const d = new Date(Date.now() + off * 864e5); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; },
  get(k, def) { try { const v = U.renameOld(localStorage.getItem(k)); return v ? JSON.parse(v) : def; } catch (e) { return def; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* yok */ } },
  // maaşa göre ölçeklenen para ödülü
  cash(mult) {
    const s = Game.state;
    const base = Game.inStreet() || Game.isYouth() ? 300 : Math.max(800, Math.round((s.contract.wage || 0) * 0.15));
    return Math.round(base * mult / 50) * 50;
  },
  trainBoost(v) { const s = Game.state; const k = s.trainFocus || 'shooting'; s.player.stats[k] = Math.min(99, s.player.stats[k] + v); return STATS.find((x) => x.k === k).l; },
};

// ---------- Günlük giriş serisi (7 gün) ----------
const DAILY_REW = [
  { ic: '💰', l: (n) => U.money(n), m: 1 },
  { ic: '⚡', l: () => '+25 enerji', e: 25 },
  { ic: '💰', l: (n) => U.money(n), m: 1.5 },
  { ic: '😊', l: () => '+15 moral', mo: 15 },
  { ic: '💰', l: (n) => U.money(n), m: 2 },
  { ic: '📈', l: () => '+1 odak statı', st: 1 },
  { ic: '🎁', l: (n) => `Büyük sandık: ${U.money(n)} + 1 stat`, m: 4, st: 1, big: true },
];
const Daily = {
  state() { return Meta.get('sf_daily', { last: null, day: 0 }); },
  streak() { const d = Daily.state(); return d.last === Meta.today() || d.last === Meta.today(-1) ? d.day : 0; },
  // Hub'a girince: bugün alınmadıysa ödül penceresi
  check() {
    const s = Game.state;
    if (!s || s.seasonEnd || document.getElementById('modal').classList.contains('hidden') === false) return false;
    const d = Daily.state(), t = Meta.today();
    if (d.last === t) return false;
    const cont = d.last === Meta.today(-1);
    const day = cont ? (d.day % 7) + 1 : 1;
    const broken = !cont && d.last && d.day > 1;
    const tiles = DAILY_REW.map((r, i) => {
      const n = r.m ? Meta.cash(r.m) : 0;
      const k = i + 1;
      return `<div class="dl-t ${k < day ? 'got' : k === day ? 'now' : ''} ${r.big ? 'big' : ''}"><small>${k}. gün</small><i>${r.ic}</i><b>${r.l(n)}</b></div>`;
    }).join('');
    Game.modal(`<div class="daily">
        <div class="ev-tag">Günlük Ödül</div>
        <h2>🔥 ${day}. gün</h2>
        <p class="muted">${broken ? 'Serin bozuldu, yeniden başlıyorsun. ' : ''}Her gün gir, 7. günde büyük sandık seni bekliyor!</p>
        <div class="dl-grid">${tiles}</div>
      </div>`, [{ t: 'Ödülü Al', cls: 'btn-big', fn: () => Daily.claim(day) }]);
    return true;
  },
  claim(day) {
    const s = Game.state, p = s.player, r = DAILY_REW[day - 1];
    const parts = [];
    if (r.m) { const n = Meta.cash(r.m); p.money += n; parts.push(U.money(n)); }
    if (r.e) { Player.addEnergy(p, r.e); parts.push(`+${r.e} enerji`); }
    if (r.mo) { Player.addMorale(p, r.mo); parts.push(`+${r.mo} moral`); }
    if (r.st) parts.push(`+${r.st} ${Meta.trainBoost(r.st)}`);
    Meta.set('sf_daily', { last: Meta.today(), day });
    if (typeof Sfx !== 'undefined') { Sfx.play(r.big ? 'fanfare' : 'coin'); Sfx.buzz('success'); }
    Game.toast(`🎁 Günlük ödül: ${parts.join(' · ')}`, 'good');
    Game.save(); Game.render();
    // ilk ödülden sonra bildirim izni (kendi akışında, oyun açılışında değil)
    if (typeof Notify !== 'undefined') setTimeout(() => Notify.askOnce(), 900);
  },
};

// ---------- Günlük görevler ----------
const MISSIONS = [
  { id: 'play', l: 'Bir maçta forma giy', n: 1 },
  { id: 'win', l: 'Bir maç kazan', n: 1 },
  { id: 'shots', l: 'Maçlarda toplam 3 şut çek', n: 3, att: true },
  { id: 'goal', l: 'Gol at', n: 1, att: true },
  { id: 'assist', l: 'Asist yap', n: 1 },
  { id: 'rating', l: '7.5 ve üzeri reyting al', n: 1 },
  { id: 'tackle', l: 'Maçlarda 3 top kap', n: 3, def: true },
  { id: 'train', l: '2 antrenman yap', n: 2 },
  { id: 'activity', l: 'Bir aktivite yap (dinlen, takım, hoca, sosyal medya)', n: 1 },
];
const Missions = {
  get() {
    const s = Game.state, t = Meta.today();
    if (!s) return null;
    if (!s.daily || s.daily.d !== t) {
      const p = s.player;
      const pool = MISSIONS.filter((m) => (p.position === 'DF' ? !m.att : !m.def));
      let h = 0; for (const ch of t + p.name) h = (h * 31 + ch.charCodeAt(0)) % 100003;
      const pick = [];
      const arr = pool.slice();
      while (pick.length < 3 && arr.length) { h = (h * 7 + 13) % 100003; pick.push(arr.splice(h % arr.length, 1)[0]); }
      s.daily = { d: t, list: pick.map((m) => ({ id: m.id, prog: 0 })), claimed: false };
    }
    return s.daily;
  },
  add(id, v = 1) {
    const d = Missions.get();
    if (!d || !Game.state || Game.inStreet()) return;
    d.list.forEach((x) => {
      if (x.id !== id) return;
      const m = MISSIONS.find((k) => k.id === id);
      const was = x.prog >= m.n;
      x.prog = Math.min(m.n, x.prog + v);
      if (!was && x.prog >= m.n) { Game.toast(`✅ Görev tamam: ${m.l}`, 'good'); if (typeof Sfx !== 'undefined') Sfx.play('tick'); }
    });
  },
  done() { const d = Missions.get(); return d ? d.list.every((x) => x.prog >= MISSIONS.find((m) => m.id === x.id).n) : false; },
  afterMatch(sum) {
    if (!sum.played) return;
    Missions.add('play');
    if (sum.res === 'W') Missions.add('win');
    if (sum.shots) Missions.add('shots', sum.shots);
    if (sum.goals) Missions.add('goal', sum.goals);
    if (sum.assists) Missions.add('assist', sum.assists);
    if (sum.rating >= 7.5) Missions.add('rating');
    if (sum.tackles) Missions.add('tackle', sum.tackles);
  },
  claim() {
    const d = Missions.get(), s = Game.state, p = s.player;
    if (!d || d.claimed || !Missions.done()) return;
    d.claimed = true;
    const n = Meta.cash(2.5);
    p.money += n; Player.addEnergy(p, 20);
    const stat = Meta.trainBoost(0.6);
    if (typeof Sfx !== 'undefined') { Sfx.play('fanfare'); Sfx.buzz('success'); }
    Game.toast(`🎁 Görev sandığı: ${U.money(n)} · +20 enerji · +0.6 ${stat}`, 'good');
    Game.save(); Game.render();
  },
  card() {
    const s = Game.state;
    if (!s || Game.inStreet()) return '';
    const d = Missions.get(), all = Missions.done(), st = Daily.streak();
    if (d.claimed) {
      return `<section class="card missions done"><div class="ms-mini"><i>✓</i><span><b>Günün görevleri tamamlandı</b><small>Yarın yeni görevler gelecek</small></span>${st ? `<span class="ms-streak">🔥 ${st} gün</span>` : ''}</div></section>`;
    }
    return `<section class="card missions">
      <div class="card-h"><span>${Icon('star')} Günün Görevleri</span>${st ? `<span class="ms-streak">🔥 ${st} gün</span>` : ''}</div>
      ${d.list.map((x) => {
        const m = MISSIONS.find((k) => k.id === x.id), ok = x.prog >= m.n;
        return `<div class="ms-row ${ok ? 'ok' : ''}"><i>${ok ? '✓' : ''}</i><span>${m.l}</span><b>${x.prog}/${m.n}</b><em style="width:${(x.prog / m.n) * 100}%"></em></div>`;
      }).join('')}
      ${d.claimed ? '<p class="ms-done">Sandık alındı. Yarın yeni görevler gelecek!</p>' : `<button class="btn ${all ? 'btn-play' : 'btn-ghost'}" data-mission-claim ${all ? '' : 'disabled'}>🎁 ${all ? 'Görev sandığını aç' : 'Üç görevi bitir, sandığı aç'}</button>`}
    </section>`;
  },
};
// aksiyonlar: hak azaldıysa işlem yapılmıştır
(function () {
  const act = Game.act;
  Game.act = function (kind) {
    const s = Game.state, ap0 = s ? s.ap : 0;
    const r = act.apply(this, arguments);
    if (s && s.ap < ap0) Missions.add(['train', 'intense', 'coach'].includes(kind) ? 'train' : 'activity');
    return r;
  };
})();

// ---------- Telefon bildirimleri (yerel; sunucu yok) ----------
const Notify = {
  on() { return Meta.get('sf_notif', true); },
  plugin() { const C = window.Capacitor; return C && C.isNativePlatform && C.isNativePlatform() && C.Plugins && C.Plugins.LocalNotifications ? C.Plugins.LocalNotifications : null; },
  async askOnce() {
    const P = Notify.plugin();
    if (!P || Meta.get('sf_notif_asked', false)) return;
    Meta.set('sf_notif_asked', true);
    try { await P.requestPermissions(); } catch (e) { /* yok */ }
  },
  async setOn(v) {
    Meta.set('sf_notif', !!v);
    if (v) { Meta.set('sf_notif_asked', false); await Notify.askOnce(); } else Notify.cancel();
  },
  cancel() { const P = Notify.plugin(); if (P) P.cancel({ notifications: [{ id: 101 }, { id: 102 }, { id: 103 }] }).catch(() => {}); },
  // uygulama arka plana geçince hatırlatmaları kur
  async schedule() {
    const P = Notify.plugin();
    if (!P || !Notify.on() || !Game.state) return;
    try {
      const perm = await P.checkPermissions();
      if (perm.display !== 'granted') return;
      const t = (s) => (typeof I18N !== 'undefined' ? I18N.t(s) : s);
      const at = (d, h) => { const x = new Date(); x.setDate(x.getDate() + d); x.setHours(h, 0, 0, 0); return x; };
      const day = (Daily.state().day % 7) + 1;
      const n = [
        { id: 101, title: 'StarFoot', body: t('⚡ Enerjin doldu! Haftalık plan ve maç seni bekliyor.'), schedule: { at: new Date(Date.now() + 4 * 3600e3) } },
        { id: 102, title: 'StarFoot', body: t(`🎁 Günlük ödülün hazır! ${day}. gün serini kaybetme.`), schedule: { at: at(1, 19) } },
        { id: 103, title: 'StarFoot', body: t('⚽ Takımın seni bekliyor. Kariyerine kaldığın yerden devam et!'), schedule: { at: at(3, 19) } },
      ];
      await P.cancel({ notifications: n.map((x) => ({ id: x.id })) }).catch(() => {});
      await P.schedule({ notifications: n });
    } catch (e) { /* yok */ }
  },
};
document.addEventListener('visibilitychange', () => { if (document.hidden) Notify.schedule(); else Notify.cancel(); });

// ---------- Ezeli rakip ----------
const RIVAL_NATS = [['BRA', 'BR'], ['ARG', 'AR'], ['FRA', 'FR'], ['ESP', 'ES'], ['ENG', 'EN'], ['POR', 'PT'], ['GER', 'DE'], ['ITA', 'IT'], ['NED', 'NL'], ['TUR', 'TR']];
const Rival = {
  // rakip senin liginden: varsa derbi rakibi kulüpten, yoksa güç olarak yakın bir takımdan
  pickClub() {
    const s = Game.state, me = Game.club();
    const same = Object.values(s.world.clubs).filter((c) => c.league === me.league && c.id !== s.clubId);
    if (!same.length) return null;
    const der = same.filter((c) => Big.derby(c.id, s.clubId));
    if (der.length) return U.pick(der);
    const near = same.filter((c) => Math.abs(c.rating - me.rating) <= 5);
    return U.pick(near.length ? near : same.sort((a, b) => Math.abs(a.rating - me.rating) - Math.abs(b.rating - me.rating)).slice(0, 3));
  },
  ensure() {
    const s = Game.state;
    if (!s || Game.inStreet()) return null;
    if (s.rival) {
      // eski kayıtlar: başka ülkedeki rakip senin ligine taşınır
      if (!s.rival.v2) { const c = Rival.pickClub(); if (c) s.rival.club = c.id; s.rival.v2 = true; s.rival.form = 1; }
      return s.rival;
    }
    const p = s.player, club = Rival.pickClub();
    if (!club) return null;
    const [nat, pool] = U.chance(0.5) ? [p.nation, (RIVAL_NATS.find(([n]) => n === p.nation) || [0, 'XX'])[1]] : U.pick(RIVAL_NATS.filter(([n]) => n !== p.nation));
    const ovr = Math.round(Player.overall(p) + U.randi(-1, 3));
    s.rival = { name: NAME_POOLS[pool] ? World.genName(pool) : World.genName('XX'), nat, pos: p.position, age: p.age, ovr, club: club.id, look: U.randi(20, 900), season: { g: 0, a: 0, apps: 0 }, totals: { g: 0, a: 0, apps: 0, titles: 0, ballon: 0 }, passed: false, v2: true, form: U.rand(0.9, 1.1) };
    const der = Big.derby(club.id, s.clubId);
    Game.news(`👀 ${der ? `${der} rakibi ${club.name}'da` : `Ligdeki rakip ${club.name}'da`} senin yaşında, senin mevkinde bir yıldız adayı var: ${s.rival.name}. Basın ikinizi şimdiden kıyaslıyor. Ezeli rakibin bu!`, 'me');
    return s.rival;
  },
  club() { const s = Game.state, r = s.rival; return r && s.world.clubs[r.club]; },
  // her hafta rakibin maçı: üretimi senin sezon performansına yakın tutulur, yarış hep çekişmeli kalır
  week() {
    const s = Game.state, r = Rival.ensure();
    if (!r) return;
    const ss = s.season.stats;
    const base = { FW: [0.42, 0.18], MF: [0.18, 0.27], DF: [0.06, 0.08] }[r.pos] || [0.3, 0.2];
    const k = U.clamp(1 + (r.ovr - Player.overall(s.player)) / 20, 0.75, 1.25) * (r.form || 1);
    const myG = ss.apps >= 3 ? ss.goals / ss.apps : base[0], myA = ss.apps >= 3 ? ss.assists / ss.apps : base[1];
    const lamG = U.clamp((0.3 * base[0] + 0.75 * myG) * k, 0.03, 1.6), lamA = U.clamp((0.3 * base[1] + 0.75 * myA) * k, 0.03, 1.1);
    const pois = (l) => { let n = 0, t = Math.exp(-l), pp = 1; do { n++; pp *= Math.random(); } while (pp > t); return n - 1; };
    const g = pois(lamG), a = pois(lamA);
    r.season.apps++; r.season.g += g; r.season.a += a;
    r.totals.apps++; r.totals.g += g; r.totals.a += a;
    if (g >= 3) Game.news(`📰 Ezeli rakibin ${r.name} hat-trick yaptı! Gazeteler "${Player.fullName(s.player)} cevap verebilecek mi?" diye soruyor.`, 'world');
    const mine = ss.goals + ss.assists, his = r.season.g + r.season.a;
    if (!r.passed && mine > his && s.season.round > 5) { r.passed = true; Game.news(`📈 Bu sezon skor katkında ezeli rakibin ${r.name}'i geçtin!`, 'good'); }
    else if (r.passed && his > mine + 1) { r.passed = false; Game.news(`📉 Ezeli rakibin ${r.name} skor katkında seni geçti (${his} - ${mine})!`, 'bad'); }
  },
  // sezon sonu: gelişim, transfer, sezon karşılaştırması
  season() {
    const s = Game.state, r = s.rival;
    if (!r) return;
    const ss = s.season.stats;
    const mine = ss.goals + ss.assists, his = r.season.g + r.season.a;
    Game.news(mine >= his ? `🏁 Sezonu ezeli rakibin ${r.name}'in önünde bitirdin (${mine} - ${his} skor katkısı).` : `🏁 Ezeli rakibin ${r.name} bu sezon önde bitirdi (${his} - ${mine}). Seneye intikam!`, mine >= his ? 'good' : 'bad');
    r.age++;
    // gelişimi seninkine yakın: güç farkı açılmaz
    const myO = Player.overall(s.player);
    r.ovr = U.clamp(Math.round(r.ovr + (myO - r.ovr) * 0.5 + U.randi(-1, 2)), 30, 94);
    r.form = U.rand(0.9, 1.12);
    const c = Rival.club(), me = Game.club();
    // sen başka bir lige geçtiysen rakip de peşinden gelir
    if (c && me && c.league !== me.league) {
      const to = Rival.pickClub();
      if (to) { r.club = to.id; Game.news(`✈️ Ezeli rakibin ${r.name} de senin ligine geldi: ${to.name}!`, 'world'); }
    } else if (c && r.ovr > c.rating + 5) {
      const big = Object.values(s.world.clubs).filter((x) => x.league === c.league && x.rating > c.rating && x.id !== s.clubId).sort((a, b) => b.rating - a.rating);
      const to = big[Math.min(big.length - 1, U.randi(0, 2))];
      if (to) { r.club = to.id; Game.news(`✈️ Ezeli rakibin ${r.name}, ${to.name}'a transfer oldu!`, 'world'); }
    }
    r.season = { g: 0, a: 0, apps: 0 };
    r.passed = false;
  },
  card() {
    const s = Game.state, r = Rival.ensure();
    if (!r) return '';
    const c = Rival.club() || Game.club(), p = s.player, ss = s.season.stats;
    const myO = Player.overall(p), bar = (a, b) => `<i class="rv-bar"><i style="width:${(a / Math.max(1, a + b)) * 100}%"></i></i>`;
    const der = Big.derby(c.id, s.clubId);
    return `<section class="card rival">
      <div class="card-h"><span>${Icon('fire')} Ezeli Rakibin</span><small class="muted">${der ? U.esc(der) : 'aynı lig · aynı mevki'}</small></div>
      <div class="rv-top">
        <div class="rv-p me"><b>${U.esc(p.surname)}</b><small>${U.esc(Game.teamName())}</small><em>${myO}</em></div>
        <span class="rv-vs">VS</span>
        <div class="rv-p">${UI.shirt(c)}<b>${U.esc(r.name.split(' ').slice(-1)[0])}</b><small>${U.esc(c.name)} · ${r.age} yaş</small><em>${r.ovr}</em></div>
      </div>
      <div class="rv-row"><span>${ss.goals}</span><label>Sezon golü</label><span>${r.season.g}</span></div>${bar(ss.goals, r.season.g)}
      <div class="rv-row"><span>${ss.assists}</span><label>Sezon asisti</label><span>${r.season.a}</span></div>${bar(ss.assists, r.season.a)}
      <div class="rv-row"><span>${p.totals.goals}</span><label>Kariyer golü</label><span>${r.totals.g}</span></div>${bar(p.totals.goals, r.totals.g)}
    </section>`;
  },
};

// ---------- Yaşıtların: benzer seviyedeki liglerde ±1 yaş, aynı mevki ----------
const Peers = {
  list() {
    const s = Game.state, p = s.player, me = Game.club();
    if (!s || Game.inStreet() || Game.isYouth() || !me) return [];
    const myL = LEAGUES.find((l) => l.id === me.league);
    if (!myL) return [];
    const leagues = LEAGUES.filter((l) => l.level === myL.level);
    const pick = (posOnly) => {
      const out = [];
      leagues.forEach((L) => {
        const lg = s.world.leagues[L.id];
        if (!lg) return;
        const ages = {};
        Object.values(s.world.clubs).forEach((c) => { if (c.league === L.id) (c.roster || []).forEach((pl) => (ages[pl.n + '|' + c.id] = pl)); });
        const as = lg.assists || {}, sc = lg.scorers || {};
        new Set(Object.keys(sc).concat(Object.keys(as))).forEach((k) => {
          const pl = ages[k];
          if (!pl || Math.abs(pl.age - p.age) > 1 || (posOnly && pl.pos !== p.position)) return;
          const [n, club] = k.split('|');
          if (n === Player.fullName(p)) return;
          out.push({ n, club, age: pl.age, g: sc[k] || 0, a: as[k] || 0, lg: L.id });
        });
      });
      return out;
    };
    let list = pick(true);
    if (list.length < 6) list = pick(false);
    const ss = s.season.stats;
    list.push({ n: Player.fullName(p), club: s.clubId, age: p.age, g: ss.goals, a: ss.assists, me: true, lg: me.league });
    const r = s.rival;
    if (r && Math.abs(r.age - p.age) <= 1 && !list.some((x) => x.n === r.name)) list.push({ n: r.name, club: r.club, age: r.age, g: r.season.g, a: r.season.a, rival: true });
    return list.sort((a, b) => (b.g + b.a) - (a.g + a.a) || b.g - a.g);
  },
  card() {
    const s = Game.state, L = Peers.list();
    if (L.length < 3) return '';
    const mi = L.findIndex((x) => x.me);
    const rows = L.slice(0, 5);
    if (mi >= 5) rows.push(L[mi]);
    const lvl = (LEAGUES.find((l) => l.id === Game.club().league) || {}).level === 2 ? '2. lig seviyesi' : 'üst ligler';
    return `<section class="card peers">
      <div class="card-h"><span>${Icon('team')} Yaşıtların</span><small class="muted">${s.player.age - 1}–${s.player.age + 1} yaş · ${lvl}</small></div>
      <p class="pr-sum">Yaşıtların arasında <b>${mi + 1}.</b> sıradasın <small>(${L.length} oyuncu)</small></p>
      <div class="scorers">${rows.map((x) => `<div class="scr ${x.me ? 'me' : ''} ${x.rival ? 'rv' : ''}"><span class="rk">${L.indexOf(x) + 1}</span>${UI.shirt(s.world.clubs[x.club] || Game.club())}<div class="scr-t"><b>${U.esc(x.n)}${x.me ? ' (sen)' : x.rival ? ' (ezeli rakip)' : ''}</b><small>${U.esc((s.world.clubs[x.club] || {}).name || '')} · ${x.age} yaş</small></div><b class="g">${x.g}<small>+${x.a}</small></b></div>`).join('')}</div>
    </section>`;
  },
};

// ---------- Altın Yıldız ----------
const BALLON_LEAGUES = ['ENG', 'ESP', 'GER', 'ITA', 'FRA', 'TR1', 'POR', 'NED', 'BRA', 'ARG', 'KSA', 'USA'];
const Ballon = {
  // Puan = gol×3 + asist×2 + lig seviyesi (0-5) + takım gücü (0-3) [+ maç reytingi, yalnız sen ve rakip için ölçülür]
  // Lig/takım etkisi bir golden azdır: daha çok gol atan neredeyse her zaman öndedir
  extra(c, L) { return U.clamp((L ? L.fame : 1) * 3, 0, 5) + U.clamp((c.rating - 65) * 0.15, 0, 3); },
  ranking() {
    const s = Game.state;
    if (!s || Game.inStreet()) return [];
    if (s.ballonFinal) return s.ballonFinal;
    const list = [];
    BALLON_LEAGUES.forEach((lid) => {
      const lg = s.world.leagues[lid], L = LEAGUES.find((l) => l.id === lid);
      if (!lg || !L) return;
      const as = {};
      World.topAssists(lg, 30).forEach((x) => (as[x.name + '|' + x.club] = x.g));
      World.topScorers(lg, 6).forEach((x) => {
        const c = s.world.clubs[x.club];
        if (!c || x.name === Player.fullName(s.player)) return;
        const pts = x.g * 3 + (as[x.name + '|' + x.club] || 0) * 2 + Ballon.extra(c, L);
        list.push({ n: x.name, club: x.club, g: x.g, a: as[x.name + '|' + x.club] || 0, pts });
      });
    });
    const p = s.player, ss = s.season.stats, L = LEAGUES.find((l) => l.id === Game.club().league) || { fame: 1 };
    if (!Game.isYouth()) {
      const avg = ss.apps ? ss.ratingSum / ss.apps : 6;
      list.push({ n: Player.fullName(p), club: s.clubId, g: ss.goals, a: ss.assists, me: true, pts: ss.goals * 3 + ss.assists * 2 + Ballon.extra(Game.club(), L) + U.clamp((avg - 7) * 4, -3, 4) + (p.position === 'DF' ? ss.apps * 0.4 : 0) });
    }
    const r = s.rival;
    if (r && r.age >= 17) {
      const c = s.world.clubs[r.club], RL = c && LEAGUES.find((l) => l.id === c.league);
      if (c) list.push({ n: r.name, club: r.club, g: r.season.g, a: r.season.a, rival: true, pts: r.season.g * 3 + r.season.a * 2 + Ballon.extra(c, RL) });
    }
    return list.sort((a, b) => b.pts - a.pts || b.g - a.g).slice(0, 30);
  },
  myRank() { const i = Ballon.ranking().findIndex((x) => x.me); return i >= 0 && i < 30 ? i + 1 : 0; },
  card() {
    const s = Game.state, top = Ballon.ranking();
    if (!top.length) return '';
    const mi = top.findIndex((x) => x.me);
    const rows = top.slice(0, 10);
    if (mi >= 10) rows.push(top[mi]);
    return `<section class="card ballon">
      <div class="card-h"><span>${Icon('star')} Altın Yıldız Yarışı</span><small class="muted">${s.season.year} · ${s.ballonFinal ? 'final' : 'canlı'}</small></div>
      <p class="bal-how">Puan: <b>gol ×3</b> + <b>asist ×2</b> + lig ve takım seviyesi (en fazla 8). Senin puanına maç reytingin de eklenir.</p>
      <div class="scorers">${rows.map((x) => `<div class="scr ${x.me ? 'me' : ''} ${x.rival ? 'rv' : ''}"><span class="rk">${top.indexOf(x) + 1}</span>${UI.shirt(s.world.clubs[x.club] || Game.club())}<div class="scr-t"><b>${U.esc(x.n)}${x.me ? ' (sen)' : x.rival ? ' (ezeli rakip)' : ''}</b><small>${U.esc((s.world.clubs[x.club] || {}).name || '')} · ${x.g} gol · ${x.a} asist</small></div><b class="g">${Math.round(x.pts)}</b></div>`).join('')}</div>
    </section>`;
  },
  // sezon sonu töreni
  async ceremony() {
    const s = Game.state, p = s.player;
    if (!s || Game.isYouth() || Game.inStreet() || p.age < 17) return;
    const top = Ballon.ranking();
    if (!top.length) return;
    const win = top[0], mi = top.findIndex((x) => x.me);
    s.ballonHist = s.ballonHist || [];
    s.ballonHist.unshift({ y: s.season.year, w: win.n, me: mi + 1 });
    if (win.rival && s.rival) s.rival.totals.ballon++;
    if (win.me) {
      p.trophies.push(`${s.season.year}: 🏅 Altın Yıldız`);
      p.ballon = (p.ballon || 0) + 1;
      Player.addFame(p, 10);
      Social.post('trophy', 'ALTIN YILDIZ! Dünyanın en iyisi seçildim. Bu ödül takım arkadaşlarımın, ailemin ve taraftarımızın.', 6);
      Game.news(`🏅 ${s.season.year} Altın Yıldız ${Player.fullName(p)}'in! Dünyanın en iyi futbolcusu seçildin!`, 'good');
      const c = Game.club();
      if (typeof Celebrate !== 'undefined') await Celebrate.trophy({ big: 'ALTIN YILDIZ!', title: `${s.season.year} Altın Yıldız`, sub: 'Dünyanın en iyi futbolcusu', c1: c.c1, c2: c.c2, short: c.short, kit: Sprites.kit(c, false), number: p.shirt, year: Player.fullName(p) });
      if (typeof Review !== 'undefined') Review.maybe();
      return;
    }
    Game.news(`🏅 ${s.season.year} Altın Yıldız: ${win.n}${win.rival ? ' (ezeli rakibin!)' : ''}. ${mi >= 0 ? `Sen ${mi + 1}. oldun.` : ''}`, win.rival ? 'bad' : 'world');
    if (mi >= 0 && mi < 10) {
      await new Promise((res) => Game.modal(`<div class="ev-tag">Altın Yıldız ${s.season.year}</div><h2>🏅 ${U.esc(win.n)}</h2>
        <ol class="bal-top">${top.slice(0, 3).map((x) => `<li class="${x.me ? 'me' : ''}">${U.esc(x.n)}<small>${U.esc((s.world.clubs[x.club] || {}).name || '')}</small></li>`).join('')}</ol>
        <p>${mi < 3 ? `Kürsüdesin: <b>${mi + 1}.</b> oldun!` : `Bu yıl <b>${mi + 1}.</b> oldun. Hedef zirve!`}</p>`, [{ t: 'Devam', fn: res }]));
    }
  },
};

// ---------- Özel yetenekler ----------
const TRAITS = [
  { id: 'fin', name: 'Bitirici', d: 'Açık oyun ve yakın mesafe şutlarında daha isabetlisin.', need: (p) => p.totals.goals >= 60, prog: (p) => [p.totals.goals, 60], types: ['open', 'close'] },
  { id: 'fk', name: 'Frikik Ustası', d: 'Frikiklerde kaleci daha zor uzanır, vuruşun daha isabetli.', need: (p) => ((p.gt || {}).freekick || 0) >= 6, prog: (p) => [(p.gt || {}).freekick || 0, 6], types: ['freekick'] },
  { id: 'pen', name: 'Penaltı Ustası', d: 'Penaltılarda kaleciyi kolay avlarsın.', need: (p) => ((p.gt || {}).penalty || 0) >= 6, prog: (p) => [(p.gt || {}).penalty || 0, 6], types: ['penalty'] },
  { id: 'head', name: 'Hava Hakimi', d: 'Kafa toplarında daha güçlüsün.', need: (p) => ((p.gt || {}).header || 0) >= 10, prog: (p) => [(p.gt || {}).header || 0, 10], types: ['header'] },
  { id: 'play', name: 'Oyun Kurucu', d: 'Pas ve verkaç anlarında daha başarılısın.', need: (p) => p.totals.assists >= 40, prog: (p) => [p.totals.assists, 40], types: ['deep', 'onetwo'] },
  { id: 'drib', name: 'Çalım Sihirbazı', d: 'Çalım anlarında rakipler seni zor durdurur.', need: (p) => (p.flags && p.flags.dribbles || 0) >= 30, prog: (p) => [(p.flags && p.flags.dribbles) || 0, 30], types: ['dribble', 'sprint'] },
  { id: 'wall', name: 'Duvar', d: 'Top kapma anlarında daha başarılısın.', need: (p) => (p.flags && p.flags.tackles || 0) >= 60, prog: (p) => [(p.flags && p.flags.tackles) || 0, 60], types: ['tackle'] },
  { id: 'iron', name: 'Demir Adam', d: 'Sakatlanma riskin %35 daha az.', need: (p) => p.totals.apps >= 150, prog: (p) => [p.totals.apps, 150], types: [] },
  { id: 'big', name: 'Büyük Maç Oyuncusu', d: 'Derbi ve finallerde her an biraz daha kolay.', need: (p) => (p.flags && p.flags.bigGoals || 0) >= 5, prog: (p) => [(p.flags && p.flags.bigGoals) || 0, 5], types: [] },
  { id: 'clutch', name: 'Son Dakika Canavarı', d: 'Son dakika anlarında daha soğukkanlısın.', need: (p) => (p.flags && p.flags.lateGoal || 0) >= 3, prog: (p) => [(p.flags && p.flags.lateGoal) || 0, 3], types: [] },
];
const Traits = {
  has(id) { const p = Game.state && Game.state.player; return !!(p && p.traits && p.traits.includes(id)); },
  // an zorluğunu yeteneğe göre azaltır (düşük = kolay)
  adj(skill, type, ctx, M) {
    let d = 0;
    TRAITS.forEach((t) => { if (Traits.has(t.id) && t.types.includes(type)) d += 0.07; });
    if (Traits.has('big') && ctx && (ctx.derby || ctx.final)) d += 0.04;
    if (Traits.has('clutch') && M && M.drama) d += 0.06;
    return U.clamp(skill - d, 0.02, 0.9);
  },
  afterMatch(sum, ctx) {
    const s = Game.state, p = s.player;
    if (!sum.played) return;
    p.flags = p.flags || {};
    p.flags.tackles = (p.flags.tackles || 0) + (sum.tackles || 0);
    p.flags.dribbles = (p.flags.dribbles || 0) + (sum.dribbles || 0);
    if ((ctx.derby || ctx.final) && sum.goals) p.flags.bigGoals = (p.flags.bigGoals || 0) + sum.goals;
    p.traits = p.traits || [];
    TRAITS.forEach((t) => {
      if (p.traits.includes(t.id) || !t.need(p)) return;
      p.traits.push(t.id);
      Game.news(`✨ Yeni özel yetenek: ${t.name}! ${t.d}`, 'good');
      setTimeout(() => {
        if (typeof Sfx !== 'undefined') { Sfx.play('fanfare'); Sfx.buzz('success'); }
        Game.toast(`✨ Yeni özel yetenek: ${t.name}`, 'good');
      }, 600);
    });
  },
  card() {
    const p = Game.state.player, own = p.traits || [];
    return `<section class="card traits">
      <div class="card-h"><span>${Icon('star')} Özel Yetenekler</span><small class="muted">${own.length}/${TRAITS.length}</small></div>
      <div class="tr-list">${TRAITS.map((t) => {
        const ok = own.includes(t.id), [v, n] = t.prog(p);
        return `<div class="trt ${ok ? 'got' : ''}"><span class="tic">${ok ? '★' : '☆'}</span><span class="ttx"><b>${t.name}</b><small>${t.d}</small></span>${ok ? '' : `<em>${Math.min(v, n)}/${n}</em>`}</div>`;
      }).join('')}</div>
    </section>`;
  },
};
// Demir Adam: sakatlanma riski azalır
(function () {
  const ic = Player.injuryChance;
  Player.injuryChance = function (p, base) { return ic.call(this, p, base) * (p.traits && p.traits.includes('iron') ? 0.65 : 1); };
})();

// ---------- Rekorlar ----------
const Records = {
  seedName(id, pool) {
    let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 9973;
    const P = NAME_POOLS[pool] || NAME_POOLS.XX;
    return `${P.f[h % P.f.length]} ${P.l[(h * 7) % P.l.length]}`;
  },
  club(id) {
    const s = Game.state, c = s.world.clubs[id];
    s.records = s.records || { club: {}, lg: {} };
    if (!s.records.club[id]) s.records.club[id] = { g: Math.round(70 + Math.max(0, c.rating - 50) * 6), holder: Records.seedName(id, c.pool || 'XX') };
    return s.records.club[id];
  },
  league(lid) {
    const s = Game.state, L = LEAGUES.find((l) => l.id === lid) || { fame: 1, level: 1 };
    s.records = s.records || { club: {}, lg: {} };
    if (!s.records.lg[lid]) s.records.lg[lid] = { g: Math.round(26 + L.fame * 6 - (L.level - 1) * 3), holder: Records.seedName(lid + 'R', 'XX'), y: s.season.year - U.randi(3, 30) };
    return s.records.lg[lid];
  },
  afterMatch(sum, comp) {
    const s = Game.state, p = s.player;
    if (!sum.played || comp === 'intl' || Game.inStreet() || Game.isYouth()) return;
    p.clubGoals = p.clubGoals || {};
    p.clubGoals[s.clubId] = (p.clubGoals[s.clubId] || 0) + (sum.goals || 0);
    p.recNote = p.recNote || {};
    const cr = Records.club(s.clubId), mine = p.clubGoals[s.clubId];
    const left = cr.g - mine;
    if (cr.holder !== Player.fullName(p)) {
      if (left <= 0) Records.broken(`${Game.club().name} tarihinin en golcü oyuncusu`, `${cr.holder}'in ${cr.g} gollük rekorunu geride bıraktın!`, () => { cr.g = mine; cr.holder = Player.fullName(p); });
      else [10, 5, 1].forEach((k) => { const key = `c${s.clubId}${k}`; if (left <= k && !p.recNote[key]) { p.recNote[key] = 1; Game.news(`📊 ${Game.club().name}'ın tüm zamanların golcüsü olmana ${left} gol kaldı! (Rekor: ${cr.holder}, ${cr.g})`, 'me'); } });
    } else cr.g = Math.max(cr.g, mine);
    const lid = Game.club().league, lr = Records.league(lid), sg = s.season.stats.goals;
    if (lr.holder !== Player.fullName(p) || lr.y !== s.season.year) {
      if (sg > lr.g) Records.broken(`${Game.leagueName()} tek sezon gol rekoru`, `${lr.holder}'in ${lr.g} gollük sezon rekorunu kırdın!`, () => { lr.g = sg; lr.holder = Player.fullName(p); lr.y = s.season.year; });
      else { const k2 = `l${s.season.year}`; if (lr.g - sg <= 3 && lr.g - sg > 0 && !p.recNote[k2]) { p.recNote[k2] = 1; Game.news(`📊 Lig sezon gol rekoruna ${lr.g - sg} gol kaldı! (${lr.holder}, ${lr.g})`, 'me'); } }
    } else lr.g = Math.max(lr.g, sg);
  },
  broken(title, txt, apply) {
    const p = Game.state.player;
    apply();
    p.trophies.push(`${Game.state.season.year}: 📊 Rekor: ${title}`);
    Player.addFame(p, 3);
    Game.news(`📊 REKOR! ${txt}`, 'good');
    Social.post('trophy', `Rekor! ${title}. Bu tarih hepimizin.`, 2.5);
    setTimeout(() => {
      if (typeof Sfx !== 'undefined') { Sfx.play('fanfare'); Sfx.play('roar'); Sfx.buzz('success'); }
      Game.modal(`<div class="ev-tag">Rekor Kırıldı</div><h2>📊 ${U.esc(title)}</h2><p>${U.esc(txt)}</p>`, [{ t: 'Muhteşem!', cls: 'btn-big' }]);
    }, 800);
  },
  card() {
    const s = Game.state, p = s.player;
    if (Game.inStreet() || Game.isYouth()) return '';
    const cr = Records.club(s.clubId), lr = Records.league(Game.club().league);
    const mine = (p.clubGoals || {})[s.clubId] || 0, sg = s.season.stats.goals;
    const row = (l, a, b, who) => `<div class="rec"><div class="rec-h"><b>${l}</b><small>${U.esc(who)}</small></div>${UI.bar(Math.min(100, (a / Math.max(1, b)) * 100), a >= b ? 'c-fame' : 'c-mid')}<div class="rec-v"><span>Sen: ${a}</span><span>Rekor: ${b}</span></div></div>`;
    return `<section class="card records">
      <div class="card-h"><span>${Icon('career')} Rekor Takibi</span></div>
      ${row(`${Game.club().name} tüm zamanlar golcüsü`, mine, cr.g, cr.holder)}
      ${row(`${Game.leagueName()} sezon gol rekoru`, sg, lr.g, `${lr.holder}${lr.y ? ` (${lr.y})` : ''}`)}
    </section>`;
  },
};
