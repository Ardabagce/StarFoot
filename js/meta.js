// Oyuncuyu uzun süre bağlayan sistemler: büyük maçlar (derbi/final), basın toplantısı,
// günlük seri ve görevler, ezeli rakip, Altın Top, özel yetenekler, rekorlar, nesil modu, senaryolar.

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
  get(k, def) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } },
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
