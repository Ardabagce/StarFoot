// StarFoot Diamond 1.0.21: yalnız Diamond'da olanlar. Hiçbiri maçta ya da kariyerde güç avantajı vermez;
// ücretsiz oyuncudan hiçbir şey alınmaz.
//  • Teknik Direktör meydan okumaları (yıldızlı görevler; ilki herkese açık)
//  • Erken erişim (yeni özellikler herkese açılmadan önce): Haftanın Meydan Okuması
//  • Diamond gol sevinçleri (6 animasyon)
//  • HD kariyer posteri (oyuncu ve teknik direktör, 3 tasarım)
//  • Teknik Direktör'de 6 kariyer yuvası ve ekran temaları
//  • Kurucu Destekçi rozeti (çıkış döneminde Diamond alanlara, kalıcı)

const FOUNDER_END = Date.UTC(2027, 2, 1); // bu tarihten önce Diamond alanlar kurucu destekçi

// ---------- Kurucu Destekçi ----------
(() => {
  const FK = 'starfoot_founder';
  Diamond.founder = () => { try { return localStorage.getItem(FK) === '1'; } catch (e) { return false; } };
  Diamond.markFounder = (when) => {
    const t = when ? new Date(when).getTime() : Date.now();
    if (!(t < FOUNDER_END)) return;
    try { localStorage.setItem(FK, '1'); } catch (e) { /* yok */ }
  };
  // geri yüklemede satın alma tarihi bilinir (RevenueCat); bilinmiyorsa ve dönem sürüyorsa bugünkü tarih
  const own0 = Diamond.owned;
  Diamond.owned = (list) => {
    const ok = own0(list);
    if (ok) {
      const t = (list || []).find((x) => x && DIA_ALL.includes(x.productIdentifier));
      Diamond._date = t && t.date ? t.date : null;
    }
    return ok;
  };
  const set0 = Diamond.set;
  Diamond.set = (v) => { set0(v); if (v && !Diamond.founder()) Diamond.markFounder(Diamond._date); };
  // açılışta zaten Diamond'sa (dönem içinde) rozet verilir
  if (Diamond.active && !Diamond.founder()) Diamond.markFounder();
  Diamond.founderTag = () => (Diamond.founder() ? `<span class="fnd-tag">${Diamond.gem(14)} Kurucu Destekçi</span>` : '');
})();

// ---------- Teknik Direktör: 6 yuva ve temalar ----------
const CM_THEMES = [
  ['classic', 'Klasik', '#ffcf3f', false],
  ['diamond', 'Elmas', '#7fdcff', true],
  ['gold', 'Altın Gece', '#e3b341', true],
  ['pitch', 'Çim', '#46e08f', true],
  ['retro', 'Retro', '#ff7a59', true],
];
(() => {
  if (typeof Coach === 'undefined') return;
  Coach.nSlots = () => (Diamond.active ? 6 : CM_SLOTS);
  Coach.theme = () => {
    let t = 'classic';
    try { t = localStorage.getItem('starfoot_cm_theme') || 'classic'; } catch (e) { /* yok */ }
    const d = CM_THEMES.find((x) => x[0] === t);
    return d && (!d[3] || Diamond.active) ? t : 'classic';
  };
  const paint = () => { const el = document.getElementById('coach'); if (el) el.dataset.th = Coach.theme(); };
  const r0 = Coach.render.bind(Coach);
  Coach.render = () => { paint(); return r0(); };
  const h0 = Coach.hub;
  Coach.hub = () => {
    const r = h0();
    paint();
    const el = document.getElementById('coach');
    if (!el) return r;
    // Diamond yoksa küçük bir tanıtım: +3 yuva
    const box = el.querySelector('.ch-slots');
    if (box && !Diamond.active && Diamond.enabled()) {
      const b = U.el(`<button class="ch-slot empty dia-lock" data-dialock="slots"><i>${Diamond.gem(22)}</i><span><b>+3 kariyer yuvası</b><small>Diamond ile 6 yuva</small></span></button>`);
      box.appendChild(b);
    }
    // meydan okumalar kartı
    const lbl = el.querySelector('.ch-lbl');
    if (lbl) {
      const run = (() => { try { const r = Store.read(TDCh.KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; } })();
      if (run && run.scn && !run.scnDone && TDCh.def(run.scn.id)) {
        const x = TDCh.def(run.scn.id);
        const rb = U.el(`<button class="ch-chal run" id="ch-run"><span class="ch-ci" data-emo>${x.ic}</span><span><b>Devam eden meydan okuma</b><small>${x.name}</small></span>${Icon('play')}</button>`);
        lbl.parentNode.insertBefore(rb, lbl);
        rb.onclick = () => { Coach.slot = 'scn'; Coach.KEY = TDCh.KEY; Coach.s = run; Coach.enter(); };
      }
      const best = TDCh.stars();
      const card = U.el(`<button class="ch-chal" id="ch-chal"><span class="ch-ci" data-emo>🎯</span><span><b>Meydan okumalar</b><small>Hazır durumlar, zor hedefler: ${TDCh.LIST.length} görev · ${best}/${TDCh.LIST.length * 3} ⭐</small></span>${Diamond.active ? '' : '<em class="dia-pill">💎</em>'}${Icon('chevron')}</button>`);
      lbl.parentNode.insertBefore(card, lbl);
      card.onclick = () => TDCh.menu();
    }
    U.$$('[data-dialock]', el).forEach((b) => (b.onclick = () => Diamond.pitch(b.dataset.dialock)));
    UI.strip(el);
    return r;
  };
  // ayarlar: tema
  const st0 = Coach.settings;
  Coach.settings = () => {
    st0();
    const m = document.getElementById('modal');
    const host = m && m.querySelector('.set-row');
    if (!host) return;
    const cur = Coach.theme();
    const row = U.el(`<div class="set-row th-row"><span><b>Ekran teması</b><small>${Diamond.active ? 'Teknik direktör ekranının renkleri' : 'Klasik dışındaki temalar Diamond ile açılır'}</small></span>
      <div class="th-chips">${CM_THEMES.map(([k, n, col, dia]) => `<button class="th-chip ${cur === k ? 'on' : ''} ${dia && !Diamond.active ? 'lock' : ''}" data-cmth="${k}" style="--th:${col}"><i></i>${n}${dia && !Diamond.active ? ' 💎' : ''}</button>`).join('')}</div></div>`);
    host.parentNode.insertBefore(row, host);
    UI.strip(row);
    U.$$('[data-cmth]', row).forEach((b) => (b.onclick = () => {
      const d = CM_THEMES.find((x) => x[0] === b.dataset.cmth);
      if (d[3] && !Diamond.active) { m.classList.add('hidden'); return setTimeout(() => Diamond.pitch('theme'), 120); }
      try { localStorage.setItem('starfoot_cm_theme', d[0]); } catch (e) { /* yok */ }
      U.$$('[data-cmth]', row).forEach((x) => x.classList.toggle('on', x === b));
      paint();
    }));
  };
})();

// ---------- Teknik Direktör meydan okumaları ----------
// kind 'match': belli bir dakika ve skordan maçı devral; kind 'season': sezonun son haftalarını oyna.
// stars(r): 0-3 yıldız. İlk görev herkese açık; gerisi Diamond.
const TDCH = [
  { id: 'comeback', ic: '🔥', free: true, kind: 'match', name: 'Büyük Dönüş', d: 'Deplasmanda 55. dakikada 0-2 gerisin. Soyunma odası sessiz, tribünler seni izliyor.',
    tiers: ['Farkı bire indir', 'Berabere bitir', 'Kazan'], club: (L) => L.mid, opp: (L) => L.weak, home: false, pre: { min: 55, gf: 0, ga: 2 },
    stars: (r) => (r.gf > r.ga ? 3 : r.gf === r.ga ? 2 : r.ga - r.gf === 1 ? 1 : 0) },
  { id: 'ten', ic: '🟥', kind: 'match', name: '10 Kişi', d: '25. dakikada stoperin kırmızı kart gördü. Skor 0-0, rakip baskı kuruyor.',
    tiers: ['Kaybetme', 'Kazan', 'Gol yemeden kazan'], club: (L) => L.mid, opp: (L) => L.near, home: true, pre: { min: 25, gf: 0, ga: 0, red: 1 },
    stars: (r) => (r.gf > r.ga && r.ga === 0 ? 3 : r.gf > r.ga ? 2 : r.gf === r.ga ? 1 : 0) },
  { id: 'giant', ic: '🗿', kind: 'match', name: 'Devi Devir', d: 'Ligin en güçlüsü stadına geliyor. Kâğıt üstünde hiç şansın yok.',
    tiers: ['Berabere bitir', 'Kazan', '2 farkla kazan'], club: (L) => L.low, opp: (L) => L.top, home: true, pre: { min: 0, gf: 0, ga: 0 },
    stars: (r) => (r.gf - r.ga >= 2 ? 3 : r.gf > r.ga ? 2 : r.gf === r.ga ? 1 : 0) },
  { id: 'final', ic: '🏆', kind: 'match', name: 'Son Düdük', d: 'Kupa finali, 78. dakika, skor 1-1. Uzatma yok: berabere biterse penaltılar.',
    tiers: ['Kupayı kaldır (penaltılarla)', 'Normal sürede kazan', '2 farkla kazan'], club: (L) => L.mid, opp: (L) => L.near, home: true, comp: 'cup', pre: { min: 78, gf: 1, ga: 1 },
    stars: (r) => (r.gf - r.ga >= 2 ? 3 : r.gf > r.ga ? 2 : r.pens && r.pens.win ? 1 : 0) },
  { id: 'remontada', ic: '🌙', kind: 'match', name: 'Avrupa Gecesi', d: 'İlk maçı 0-3 kaybettin. Rövanş evinde, stat dolu. Mucize için en az 3 gol lazım.',
    tiers: ['Maçı kazan', '3 farkla kazan', '4 farkla kazan (turu geç)'], club: (L) => L.upper, opp: (L) => L.near, home: true, comp: 'eu', pre: { min: 0, gf: 0, ga: 0 },
    stars: (r) => (r.gf - r.ga >= 4 ? 3 : r.gf - r.ga >= 3 ? 2 : r.gf > r.ga ? 1 : 0) },
  { id: 'rescue', ic: '🛟', kind: 'season', name: 'Kurtarma Operasyonu', d: 'Son 10 hafta. Takım düşme hattında, güvenli bölgenin 5 puan gerisinde. Yönetim sana son şansı verdi.',
    tiers: ['Ligde kal', 'Düşme hattının 2 sıra üstünde bitir', 'Düşme hattının 4 sıra üstünde bitir'], club: (L) => L.low, weeks: 10, setup: 'rescue',
    stars: (r) => (r.pos <= r.n - 7 ? 3 : r.pos <= r.n - 5 ? 2 : r.pos <= r.n - 3 ? 1 : 0) },
  { id: 'race', ic: '🏁', kind: 'season', name: 'Şampiyonluk Yarışı', d: 'Son 6 hafta. İkincisin, lider 3 puan önde. Her maç final.',
    tiers: ['İlk 2’de bitir', 'Şampiyon ol', 'Yenilmeden şampiyon ol'], club: (L) => L.second, weeks: 6, setup: 'race',
    stars: (r) => (r.pos === 1 && r.l === 0 ? 3 : r.pos === 1 ? 2 : r.pos <= 2 ? 1 : 0) },
  { id: 'dream', ic: '✈️', kind: 'season', name: 'Avrupa Hayali', d: 'Son 12 hafta. Mütevazı kulübün 7. sırada; taraftar Avrupa’yı hayal ediyor.',
    tiers: ['İlk 6’da bitir', 'İlk 5’te bitir', 'İlk 4’te bitir'], club: (L) => L.mid, weeks: 12, setup: 'dream',
    stars: (r) => (r.pos <= 4 ? 3 : r.pos <= 5 ? 2 : r.pos <= 6 ? 1 : 0) },
];

const TDCh = {
  LIST: TDCH,
  KEY: 'starfoot_coach_scn',
  def(id) { return TDCH.find((x) => x.id === id) || (TDCh.wk && TDCh.wk.id === id ? TDCh.wk : null); },
  best() { return Meta.get('sf_tdch', {}); },
  stars() { const b = TDCh.best(); return TDCH.reduce((t, x) => t + (b[x.id] || 0), 0); },
  open(x) { return x.free || Diamond.active || (x.weekly && TDCh.weeklyOpen()); },
  star(n) { return [1, 2, 3].map((i) => `<i class="${i <= n ? 'on' : ''}">★</i>`).join(''); },
  // lig ve kulüpler: telefonun ülkesinin 1. ligi (yoksa İngiltere)
  pool(rng) {
    const R = rng || Math.random;
    const h = I18N.home(), id = h === 'TUR' ? 'TR1' : h;
    const lg = LEAGUES.some((l) => l.id === id && l.level === 1) ? id : 'ENG';
    const ids = CLUB_LIST.filter((c) => c[3] === lg).sort((a, b) => b[4] - a[4]).map((c) => c[0]);
    const n = ids.length, pk = (a, b) => ids[Math.min(n - 1, a + Math.floor(R() * (b - a + 1)))];
    return { lg, ids, top: ids[0], second: pk(1, 2), upper: pk(2, 4), mid: pk(Math.floor(n * 0.35), Math.floor(n * 0.6)), low: pk(n - 4, n - 1), near: null, rng: R };
  },
  who() {
    for (let i = 1; i <= 6; i++) { const sv = Coach.readSlot(i); if (sv && sv.name) return { name: sv.name, surname: sv.surname, nat: sv.nat, look: sv.look }; }
    const dn = I18N.defName();
    return { name: dn[0], surname: dn[1], nat: I18N.home(), look: null };
  },

  // ---------- liste ----------
  menu() {
    const b = TDCh.best();
    const row = (x) => {
      const ok = TDCh.open(x), n = x.weekly ? (TDCh.weekBest() || 0) : (b[x.id] || 0);
      return `<button type="button" class="tdc-r ${ok ? '' : 'lock'} ${x.weekly ? 'wk' : ''}" data-tdc="${x.id}"><i data-emo>${x.ic}</i>
        <span><b>${x.name}${x.free && !Diamond.active ? ' <em class="free-pill">Ücretsiz</em>' : ''}${x.weekly ? ' <em class="ea-pill">Erken erişim</em>' : ''}</b><small>${x.d}</small>
        <em class="tdc-k">${x.kind === 'match' ? `⏱️ ${x.pre.min ? `${x.pre.min}. dakikadan` : 'Maçın tamamı'}` : `📅 Son ${x.weeks} hafta`}</em></span>
        <span class="tdc-s">${ok ? `<span class="stars">${TDCh.star(n)}</span>` : Diamond.gem(22)}</span></button>`;
    };
    const wk = Diamond.enabled() ? TDCh.weekly() : null;
    const m = Game.modal(`<div class="ev-tag">Teknik Direktör</div><h2>🎯 Meydan okumalar</h2>
      <p class="muted">Hazır bir durumu devral, hedefi tuttur, yıldızları topla. Kariyer yuvalarını etkilemez.</p>
      ${wk ? `<div class="lbl">Haftanın meydan okuması</div><div class="tdc">${row(wk)}</div>` : ''}
      <div class="lbl">Görevler · ${TDCh.stars()}/${TDCH.length * 3} ⭐</div>
      <div class="tdc">${TDCH.map(row).join('')}</div>
      ${Diamond.active ? '' : `<p class="muted tdc-note">${Diamond.gem(14)} İlk görev herkese açık. Diğerleri StarFoot Diamond ile.</p>`}`, [{ t: 'Kapat', cls: 'btn-ghost' }], { wide: true });
    U.$$('[data-tdc]', m).forEach((el) => (el.onclick = () => {
      const x = TDCh.def(el.dataset.tdc);
      if (!TDCh.open(x)) { m.classList.add('hidden'); return setTimeout(() => Diamond.pitch(x.weekly ? 'early' : 'challenge'), 120); }
      TDCh.brief(x);
    }));
  },
  brief(x) {
    Game.modal(`<div class="ev-tag">${x.ic} Meydan okuma</div><h2>${x.name}</h2><p>${x.d}</p>
      <div class="tdc-tiers">${x.tiers.map((t, i) => `<div><span class="stars">${TDCh.star(i + 1)}</span><b>${t}</b></div>`).join('')}</div>`,
    [{ t: 'Vazgeç', cls: 'btn-ghost' }, { t: 'Başla', cls: 'btn-big', fn: () => setTimeout(() => TDCh.start(x), 120) }], { wide: true });
  },

  // ---------- kurulum ----------
  start(x, rng) {
    const P = TDCh.pool(rng || x.rng);
    const clubId = x.club(P);
    // yakın güçte rakip: kendi kulübünden ±3 güç
    const myR = Coach.base(clubId).rating;
    const others = P.ids.filter((id) => id !== clubId);
    // kulüplerin kadro gücü kâğıttaki güçten ~3 düşük: "yakın" rakip gerçekten denk olsun
    P.near = others.slice().sort((a, b) => Math.abs(Coach.base(a).rating - (myR - 2)) - Math.abs(Coach.base(b).rating - (myR - 2)))[Math.floor(P.rng() * 2)];
    P.weak = others.slice().sort((a, b) => Math.abs(Coach.base(a).rating - (myR - 6)) - Math.abs(Coach.base(b).rating - (myR - 6)))[Math.floor(P.rng() * 2)];
    if (x.opp && x.opp(P) === clubId) P.top = others[0];
    const w = TDCh.who();
    Coach.slot = 'scn'; Coach.KEY = TDCh.KEY;
    Coach.s = {
      v: 2, name: w.name, surname: w.surname, nat: w.nat || 'TUR', age: 40, rep: 45, iq: 60, from: 'new', past: null, look: w.look || undefined,
      year: 2026, round: 0, clubId, cl: {}, squad: [], xi: [], form: '4-4-2', style: 'bal', train: 'normal', focus: 'tac',
      budget: 0, money: 0, conf: 65, fans: 55, chem: 55, target: 0, news: [], hist: [], trophies: [], rec: { w: 0, d: 0, l: 0, gf: 0, ga: 0 },
      fac: { train: 1, youth: 1, stadium: 1, medical: 1 }, cf: {}, scout: { res: [], watch: [] }, bids: [], pend: [], month: { w: 0, d: 0, l: 0 }, awards: [], keyMom: true,
      mk: [], cup: null, pid: 0, sacked: 0,
    };
    Coach.joinClub(clubId, true);
    const s = Coach.s;
    if (!s.look) s.look = Coach.defLook(s);
    s.eu = null; s.cup = null; s.nt = null; s.ntDue = 0; s.news = []; s.feed = []; s.pend = [];
    s.scn = { id: x.id, kind: x.kind, w: 0, d: 0, l: 0 };
    if (x.kind === 'match') {
      const opp = x.opp(P) === clubId ? P.top : x.opp(P);
      s.round = 20;
      for (let r = 0; r < 20; r++) Coach.simRound(r, true);
      const nm = x.comp === 'cup' ? 'Kupa finali' : x.comp === 'eu' ? 'Avrupa · Rövanş' : `${Coach.lgName(P.lg)} · ${x.name}`;
      s.scn.match = { comp: x.comp || 'lg', opp, home: x.home, name: nm, ko: x.comp === 'cup', scn: true };
      s.scn.pre = x.pre;
      Coach.news(`${x.ic} Meydan okuma: ${x.name}. ${x.d}`, 'good');
    } else {
      const n = Coach.rounds(), r0 = n - x.weeks;
      for (let r = 0; r < r0; r++) Coach.simRound(r, true);
      s.round = r0;
      TDCh.shape(x.setup);
      s.target = x.setup === 'race' ? 1 : x.setup === 'dream' ? 4 : s.lg.ids.length - 3;
      s.conf = 50;
      Coach.news(`${x.ic} Meydan okuma: ${x.name}. ${x.d}`, 'good');
    }
    s.xi = []; Coach.autoPick(); Coach.autoRoles();
    Coach.save();
    Coach.enter();
    if (typeof Premium !== 'undefined') Premium.track('td_challenge_start', { id: x.id });
    Game.modal(`<div class="ev-tag">${x.ic} Meydan okuma</div><h2>${x.name}</h2><p><b>${U.esc(Coach.my().name)}</b>: ${x.d}</p>
      <div class="tdc-tiers">${x.tiers.map((t, i) => `<div><span class="stars">${TDCh.star(i + 1)}</span><b>${t}</b></div>`).join('')}</div>
      <p class="muted">İlk 11'ini ve taktiğini ayarla, sonra maça çık.</p>`, [{ t: 'Hazırım', cls: 'btn-big' }], { wide: true });
  },
  // puan tablosunu senaryoya göre ayarla
  shape(kind) {
    const s = Coach.s, lg = s.lg, me = s.clubId, T = lg.table;
    const tbl = () => World.sortedTable(lg);
    const setPts = (id, pts) => {
      const t = T[id], p = t.p;
      pts = U.clamp(Math.round(pts), 0, p * 3);
      let w = Math.min(p, Math.floor(pts / 3)), d = pts - w * 3;
      while (w + d > p && w > 0) { w--; d += 3; }
      if (w + d > p) { d = p - w; }
      t.w = w; t.d = d; t.l = p - w - d; t.pts = w * 3 + d;
      if (t.gf < t.ga && pts > p * 1.6) [t.gf, t.ga] = [t.ga, t.gf];
    };
    if (kind === 'rescue') {
      const others = tbl().filter((r) => r.id !== me), n = lg.ids.length;
      const safe = others[n - 4]; // ilk güvenli sıra (son 3 düşer)
      setPts(me, safe.pts - 5);
      if (tbl()[n - 1].id !== me && Coach.myPos() < n - 2) setPts(me, others[n - 2].pts - 1);
    } else if (kind === 'race') {
      const others = tbl().filter((r) => r.id !== me);
      const lead = others[0];
      setPts(me, lead.pts - 3);
      others.slice(1).forEach((r) => { if (r.pts >= T[me].pts) setPts(r.id, T[me].pts - 1 - Math.floor(Math.random() * 4)); });
    } else if (kind === 'dream') {
      const others = tbl().filter((r) => r.id !== me);
      setPts(me, others[5].pts - 1);
      others.slice(2, 5).forEach((r, i) => { if (T[r.id].pts - T[me].pts > 2 + i) setPts(r.id, T[me].pts + 2 + i); });
    }
    s.cf = s.cf || {};
  },
  // ---------- sonuç ----------
  finishRun(res) {
    const s = Coach.s, x = TDCh.def(s.scn.id);
    const n = x ? x.stars(res) : 0;
    s.scnDone = { n, res };
    Coach.save();
  },
  result() {
    const s = Coach.s, d = s.scnDone, x = TDCh.def(s.scn.id);
    const n = d.n;
    if (x.weekly) TDCh.weekSet(n);
    else { const b = TDCh.best(); if (n > (b[x.id] || 0)) { b[x.id] = n; Meta.set('sf_tdch', b); } }
    if (typeof Premium !== 'undefined') Premium.track('td_challenge_end', { id: x.id, stars: n });
    if (n && typeof Sfx !== 'undefined') try { Sfx.play('fanfare'); } catch (e) { /* yok */ }
    const r = d.res;
    const line = x.kind === 'match' ? `${U.esc(Coach.my().name)} ${r.gf}-${r.ga} ${U.esc(Coach.club(s.scn.match.opp).name)}${r.pens ? ` (pen. ${r.pens.a}-${r.pens.b})` : ''}` : `${r.pos}. sıra · ${r.w}G ${r.d}B ${r.l}M`;
    const done = () => { try { Store.remove(TDCh.KEY); } catch (e) { /* yok */ } Coach.s = null; Coach.useSlot(1); Coach.hub(); setTimeout(() => TDCh.menu(), 200); };
    Game.modal(`<div class="ev-tag">${x.ic} ${x.name}</div><h2>${n ? (n === 3 ? 'Kusursuz!' : 'Başardın!') : 'Bu sefer olmadı'}</h2>
      <div class="tdc-big stars">${TDCh.star(n)}</div><p class="tdc-line">${line}</p>
      <div class="tdc-tiers">${x.tiers.map((t, i) => `<div class="${i < n ? 'ok' : ''}"><span class="stars">${TDCh.star(i + 1)}</span><b>${t}</b></div>`).join('')}</div>`,
    [{ t: 'Görevler', cls: 'btn-ghost', fn: done }, { t: 'Tekrar dene', cls: 'btn-big', fn: () => { try { Store.remove(TDCh.KEY); } catch (e) { /* yok */ } Coach.s = null; setTimeout(() => TDCh.start(x, x.weekly ? TDCh.rngWeek() : null), 150); } }], { wide: true });
  },

  // ---------- Haftanın Meydan Okuması (erken erişim) ----------
  weekNo() { return Math.floor((Date.now() / 864e5 + 3) / 7); },
  rngWeek(salt) {
    let a = (TDCh.weekNo() * 2654435761 + (salt || 0)) >>> 0;
    return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  },
  weeklyOpen() { return Diamond.active; },
  weekly() {
    const R = TDCh.rngWeek(7);
    const kinds = [
      { min: 70, gf: 0, ga: 1 }, { min: 55, gf: 1, ga: 3 }, { min: 30, gf: 0, ga: 0, red: 1 }, { min: 80, gf: 2, ga: 2 }, { min: 46, gf: 0, ga: 2 }, { min: 65, gf: 1, ga: 1, red: 1 },
    ];
    const pre = kinds[Math.floor(R() * kinds.length)], home = R() < 0.5;
    const need = pre.ga - pre.gf;
    const tiers = need > 0 ? ['Berabere bitir', 'Kazan', '2 farkla kazan'] : ['Kaybetme', 'Kazan', '2 farkla kazan'];
    const txt = `${pre.min}. dakika, skor ${pre.gf}-${pre.ga}${pre.red ? ', 10 kişisin' : ''}. ${home ? 'İç sahadasın.' : 'Deplasmandasın.'} Herkes aynı görevi oynuyor; bu haftanın en iyisi ol.`;
    TDCh.wk = { id: `wk${TDCh.weekNo()}`, ic: '📆', weekly: true, kind: 'match', name: 'Haftanın Meydan Okuması', d: txt, tiers, pre, home, rng: TDCh.rngWeek(11),
      club: (L) => L.mid, opp: (L) => L.near,
      stars: (r) => (r.gf - r.ga >= 2 ? 3 : r.gf > r.ga ? 2 : r.gf === r.ga ? 1 : 0) };
    return TDCh.wk;
  },
  weekBest() { const b = Meta.get('sf_tdwk', {}); return b.w === TDCh.weekNo() ? b.n : 0; },
  weekSet(n) { if (n >= TDCh.weekBest()) Meta.set('sf_tdwk', { w: TDCh.weekNo(), n }); },
};

// meydan okuma sırasında oyunun akışı
(() => {
  if (typeof Coach === 'undefined') return;
  const on = () => Coach.s && Coach.s.scn;
  // ücretsiz deneme hakkını harcamaz, paket gerekmez
  const ow0 = Coach.owned;
  Coach.owned = () => !!on() || ow0();
  const cs0 = Coach.checkSack;
  Coach.checkSack = () => (on() ? false : cs0());
  const nm0 = Coach.nextMatch;
  Coach.nextMatch = () => {
    const s = Coach.s;
    if (s && s.scn && s.scn.kind === 'match') return s.scnDone ? null : Object.assign({}, s.scn.match);
    return nm0();
  };
  const am0 = Coach.afterMatch;
  Coach.afterMatch = (m, res) => {
    const s = Coach.s;
    if (!s || !s.scn) return am0(m, res);
    const win = res.pens ? res.pens.win : res.gf > res.ga, draw = !res.pens && res.gf === res.ga;
    if (win) s.scn.w++; else if (draw) s.scn.d++; else s.scn.l++;
    if (s.scn.kind === 'match') return TDCh.finishRun(res);
    am0(m, res);
  };
  const se0 = Coach.seasonEnd;
  Coach.seasonEnd = (...a) => {
    const s = Coach.s;
    if (!s || !s.scn) return se0(...a);
    TDCh.finishRun({ pos: Coach.myPos(), n: s.lg.ids.length, w: s.scn.w, d: s.scn.d, l: s.scn.l });
  };
  const rd0 = Coach.render;
  Coach.render = () => {
    const s = Coach.s;
    if (s && s.scn && s.scnDone) { const el = document.getElementById('coach'); if (el && !el.innerHTML.trim()) Coach.hub(); return TDCh.result(); }
    const r = rd0();
    if (s && s.scn) {
      const x = TDCh.def(s.scn.id), el = document.getElementById('coach');
      const main = el && el.querySelector('.cm-main');
      if (x && main && Coach.view === 'home') {
        const left = x.kind === 'season' ? Coach.rounds() - s.round : 0;
        const ban = U.el(`<section class="card tdc-ban"><div><span data-emo>${x.ic}</span><b>${x.name}</b>${x.kind === 'season' ? `<em>${left} hafta kaldı · ${Coach.myPos()}. sıra</em>` : ''}</div>
          <div class="tdc-tiers sm">${x.tiers.map((t, i) => `<div><span class="stars">${TDCh.star(i + 1)}</span><b>${t}</b></div>`).join('')}</div>
          <button class="btn btn-ghost" id="tdc-quit">Meydan okumadan çık</button></section>`);
        main.insertBefore(ban, main.firstChild);
        UI.strip(ban);
        ban.querySelector('#tdc-quit').onclick = () => Game.modal('<h3>Meydan okumadan çıkılsın mı?</h3><p>Bu deneme kaydedilmez.</p>', [{ t: 'Vazgeç', cls: 'btn-ghost' }, { t: 'Çık', cls: 'btn-danger', fn: () => { try { Store.remove(TDCh.KEY); } catch (e) { /* yok */ } Coach.s = null; Coach.useSlot(1); Coach.hub(); } }]);
      }
    }
    return r;
  };
  // ana menüye dönüş: denemeyi silmeden giriş ekranına (devam edilebilir)
  const ex0 = Coach.exit;
  Coach.exit = () => { if (on()) { Coach.save(); Coach.s = null; Coach.useSlot(1); return Coach.hub(); } return ex0(); };
  // maç sonu konuşma ve basın toplantısı meydan okumada atlanır
  const tt0 = Live.teamTalk, pr0 = Live.press;
  Live.teamTalk = function (L, next) { if (Coach.s && Coach.s.scnDone) return next(); return tt0.call(this, L, next); };
  Live.press = function (L, next) { if (Coach.s && Coach.s.scnDone) return next(); return pr0.call(this, L, next); };
  // maçı belli dakika ve skordan başlat
  const apply = (pre) => {
    const L = Live.m;
    if (!L || !pre || L.scnApplied) return;
    L.scnApplied = true;
    const k = pre.min / 90;
    L.min = pre.min; L.gf = pre.gf; L.ga = pre.ga;
    if (pre.min >= 45) L.ht = true;
    Live.onField().forEach((p) => { p.fit = Math.max(30, p.fit - pre.min * 0.33); L.mins[p.id] = pre.min; });
    if (L.oFit != null) L.oFit = Math.max(40, L.oFit - pre.min * 0.3);
    L.st.sh = [Math.round(9 * k) + pre.gf * 2, Math.round(9 * k) + pre.ga * 2];
    L.st.ot = [pre.gf + Math.round(3 * k), pre.ga + Math.round(3 * k)];
    L.st.pos = [Math.max(1, Math.round(pre.min * 0.48)), Math.max(1, Math.round(pre.min * 0.52))];
    L.st.cor = [Math.round(4 * k), Math.round(4 * k)];
    for (let i = 0; i < pre.gf; i++) { const sc = Live.pickScorer(); if (sc) { sc.g++; L.scorers.push(sc.n); L.rates[sc.id] = (L.rates[sc.id] || 6.4) + 1; } }
    if (pre.red) {
      const out = Live.onField().filter((p) => p.pos === 'DF').sort((a, b) => b.r - a.r)[0] || Live.onField().find((p) => p.pos !== 'GK');
      if (out) { L.on = L.on.filter((id) => id !== out.id); L.red = (L.red || 0) + 1; L.st.yel[0]++; L.rates[out.id] = 5.2; Live.log(`🟥 ${Live.nm(out)} kırmızı kart gördü. 10 kişisin.`, 'bad'); }
    }
    if (L.match.comp === 'eu') Live.log('İlk maç: 0-3. Turu geçmek için 4 farklı galibiyet lazım.', 'info');
    Live.log(`⏱️ Maçı ${pre.min ? `${pre.min}. dakikada, ${pre.gf}-${pre.ga}` : 'baştan'} devraldın.`, 'info');
  };
  const ls0 = Live.start;
  Live.start = (match, quick) => {
    const s = Coach.s, pre = s && s.scn && s.scn.kind === 'match' ? s.scn.pre : null;
    if (!pre) return ls0(match, quick);
    if (quick) {
      const sim = Live.sim;
      Live.sim = () => { Live.sim = sim; apply(pre); return sim(); };
      try { return ls0(match, quick); } finally { Live.sim = sim; }
    }
    const lp = Live.loop;
    Live.loop = () => {};
    try { ls0(match, quick); } finally { Live.loop = lp; }
    apply(pre);
    Live.draw();
    Live.loop();
    return undefined;
  };
})();

// başlık ekranındaki Senaryolar penceresine Teknik Direktör bölümü
(() => {
  if (typeof Scenario === 'undefined') return;
  const m0 = Scenario.menu;
  Scenario.menu = () => {
    m0();
    if (typeof Coach === 'undefined' || !Coach.enabled()) return;
    const m = document.getElementById('modal');
    const box = m && m.querySelector('.scn');
    if (!box) return;
    const b = U.el(`<button type="button" class="scn-r tdc-link"><i>🎯</i><span><b>Teknik Direktör meydan okumaları</b><small>Maçı belli bir dakikadan devral ya da sezonun son haftalarında takımı kurtar. ${TDCh.stars()}/${TDCH.length * 3} ⭐</small><em>${Diamond.active ? `💎 ${TDCH.length} görev açık` : '1 görev ücretsiz · gerisi Diamond'}</em></span></button>`);
    box.appendChild(b);
    UI.strip(b);
    b.onclick = () => { m.classList.add('hidden'); setTimeout(() => TDCh.menu(), 120); };
  };
})();

// ---------- Diamond gol sevinçleri ----------
(() => {
  if (typeof CELEBRATIONS === 'undefined') return;
  CELEBRATIONS.push(
    { id: 'd_gems', ic: '💎', dia: true, goals: 0, name: 'Elmas Yağmuru', desc: 'Kollar havada, gökten elmaslar yağar.' },
    { id: 'd_crown', ic: '👑', dia: true, goals: 0, name: 'Taç Giyme', desc: 'Durur, ellerini başına götürür; altın taç iner.' },
    { id: 'd_fire', ic: '🎆', dia: true, goals: 0, name: 'Havai Fişek', desc: 'Dizlerinin üstünde kayar, gökyüzü aydınlanır.' },
    { id: 'd_robot', ic: '🤖', dia: true, goals: 0, name: 'Robot Dansı', desc: 'Köşe bayrağında kesik kesik robot hareketleri.' },
    { id: 'd_sleep', ic: '😴', dia: true, goals: 0, name: 'Uyku Vakti', desc: 'Çimlere uzanır ve rakibe ninni söyler.' },
    { id: 'd_bolt', ic: '⚡', dia: true, goals: 0, name: 'Şimşek', desc: 'Havaya sıçrar, arkasında şimşekler çakar.' },
  );
  const gem = (c, x, y, s, rot, a) => {
    c.save(); c.translate(x, y); c.rotate(rot); c.globalAlpha = a;
    const g = c.createLinearGradient(-s, -s, s, s); g.addColorStop(0, '#e8fbff'); g.addColorStop(0.5, '#7fdcff'); g.addColorStop(1, '#3a8dff');
    c.fillStyle = g; c.beginPath(); c.moveTo(-s * 0.6, -s * 0.55); c.lineTo(s * 0.6, -s * 0.55); c.lineTo(s, -s * 0.1); c.lineTo(0, s); c.lineTo(-s, -s * 0.1); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = Math.max(1, s * 0.08); c.stroke();
    c.restore();
  };
  const spark = (c, x, y, r, a) => { c.save(); c.globalAlpha = a; c.strokeStyle = '#fff'; c.lineWidth = Math.max(1, r * 0.2); c.beginPath(); c.moveTo(x - r, y); c.lineTo(x + r, y); c.moveTo(x, y - r); c.lineTo(x, y + r); c.stroke(); c.restore(); };
  const crown = (c, x, y, s) => {
    c.save(); c.translate(x, y);
    c.shadowColor = '#ffd76a'; c.shadowBlur = s * 0.8;
    const g = c.createLinearGradient(0, -s, 0, s * 0.4); g.addColorStop(0, '#fff3b0'); g.addColorStop(1, '#d99a00');
    c.fillStyle = g; c.beginPath();
    c.moveTo(-s, s * 0.35); c.lineTo(-s, -s * 0.2); c.lineTo(-s * 0.5, s * 0.1); c.lineTo(0, -s * 0.6); c.lineTo(s * 0.5, s * 0.1); c.lineTo(s, -s * 0.2); c.lineTo(s, s * 0.35); c.closePath(); c.fill();
    c.shadowBlur = 0; c.fillStyle = '#ff3d6e'; c.beginPath(); c.arc(0, s * 0.12, s * 0.13, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#7fdcff'; [-0.62, 0.62].forEach((k) => { c.beginPath(); c.arc(s * k, s * 0.15, s * 0.09, 0, Math.PI * 2); c.fill(); });
    c.restore();
  };
  const burst = (c, x, y, r, col, a) => {
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a * 1.3); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = Math.max(2.5, r * 0.07); c.lineCap = 'round'; c.shadowColor = col; c.shadowBlur = r * 0.35;
    for (let i = 0; i < 18; i++) {
      const an = (i / 18) * Math.PI * 2, ex = x + Math.cos(an) * r, ey = y + Math.sin(an) * r + r * 0.12 * (1 - a);
      c.beginPath(); c.moveTo(x + Math.cos(an) * r * 0.45, y + Math.sin(an) * r * 0.45); c.lineTo(ex, ey); c.stroke();
      c.beginPath(); c.arc(ex, ey, Math.max(2.5, r * 0.06), 0, Math.PI * 2); c.fill();
    }
    c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y, r * 0.12 * a, 0, Math.PI * 2); c.fill();
    c.restore();
  };
  const bolt = (c, x, y, len, a, dpr) => {
    c.save(); c.globalAlpha = a; c.strokeStyle = '#e9f6ff'; c.lineWidth = 4 * dpr; c.shadowColor = '#7fdcff'; c.shadowBlur = 24 * dpr;
    c.beginPath(); c.moveTo(x, y); let px = x, py = y;
    for (let i = 0; i < 7; i++) { px += (i % 2 ? 1 : -1) * len * 0.09; py += len / 7; c.lineTo(px, py); }
    c.stroke(); c.restore();
  };
  // her biri: (c, t, o) => { x, y, h, rot, sx } ; o.fx sevinç boyunca kalıcı durum
  Celebrate.DIA = {
    d_gems(c, t, o) {
      const { W, H, dpr, fx, f } = o;
      if (!fx.g) { fx.g = Array.from({ length: 34 }, () => ({ x: Math.random() * W, y: -Math.random() * H * 0.9, v: (0.35 + Math.random() * 0.4) * H, s: (6 + Math.random() * 10) * dpr, r: Math.random() * 6, w: (Math.random() - 0.5) * 3 })); fx.title = 'ELMAS GOL!'; }
      if (t > 0.9) { f.dive = 1; f.speed = 0; }
      fx.front = (cc, tt) => {
        if (tt < 0.7) return;
        fx.g.forEach((g) => { const y = g.y + (tt - 0.7) * g.v; if (y < o.H * 1.05) { gem(cc, g.x + Math.sin(tt * 2 + g.r) * 10 * dpr, y, g.s, g.r + tt * g.w, 0.95); if (Math.sin(tt * 9 + g.r * 3) > 0.92) spark(cc, g.x, y, g.s * 1.4, 0.9); } });
      };
      return t > 0.9 ? { x: W * 0.5, y: o.ground - Math.abs(Math.sin((t - 0.9) * 6)) * o.h * 0.05 } : null;
    },
    d_crown(c, t, o) {
      const { W, f, fx } = o;
      fx.title = 'KRAL!';
      if (t > 0.9) { f.speed = 0; f.armA = Math.min(2.9, (t - 0.9) * 5); }
      const x = W * (0.18 + 0.32 * Math.min(1, t / 0.9));
      fx.front = (cc, tt, px, py, ph) => {
        if (tt < 1.1) return;
        const k = Math.min(1, (tt - 1.1) / 0.8), e = 1 - Math.pow(1 - k, 3);
        const top = py - ph * 1.12, cy = -ph * 0.2 + (top + ph * 0.2) * e;
        SocialArt && SocialArt.glow && k >= 1 && SocialArt.glow(cc, px, top, ph * 0.5, 'rgba(255,215,106,0.35)', 1);
        crown(cc, px, cy, ph * 0.11);
      };
      return { x };
    },
    d_fire(c, t, o) {
      const { W, H, dpr, f, fx } = o;
      if (!fx.b) { fx.b = [0.4, 0.7, 0.95, 1.25, 1.5, 1.8, 2.05, 2.35, 2.6].map((s, i) => ({ s, x: W * (0.12 + Math.random() * 0.76), y: H * (0.1 + Math.random() * 0.32), col: ['#ffcf3f', '#ff5a4f', '#7fdcff', '#b394ff', '#46e08f'][i % 5], r: (60 + Math.random() * 60) * dpr })); fx.title = 'HAVAİ FİŞEK!'; }
      fx.b.forEach((b) => { if (t > b.s && t < b.s + 1.1) { const k = (t - b.s) / 1.1; burst(c, b.x, b.y, b.r * (0.35 + Math.sqrt(k) * 0.9), b.col, 1 - k * k); } });
      let x = W * (0.18 + 0.32 * Math.min(1, t / 0.7)), y = o.ground, rot = 0;
      if (t > 0.7) { const s = Math.min(1, (t - 0.7) / 0.7); x = W * (0.5 + 0.08 * s); rot = -0.25 * Math.min(1, s * 3); y = o.ground + o.h * 0.06; f.speed = 0; f.dive = 1; }
      return { x, y, rot };
    },
    d_robot(c, t, o) {
      const { W, f, fx } = o;
      fx.title = 'BEEP BOOP!';
      if (t < 0.8) return null;
      f.speed = 0;
      const step = Math.floor((t - 0.8) / 0.22);
      f.armA = [0, 1.6, 0.8, 2.6, 1.6, 0.3][step % 6];
      f.facing = step % 4 === 3 ? 'up' : 'down';
      return { x: W * 0.46 + ((step % 3) - 1) * o.h * 0.08, y: o.ground - (step % 2) * o.h * 0.02 };
    },
    d_sleep(c, t, o) {
      const { W, dpr, f, fx } = o;
      fx.title = 'ZZZ...'; fx.noMates = true;
      if (t < 0.9) return null;
      f.speed = 0;
      const h = o.h0 * 0.72;
      fx.front = (cc, tt, px, py, ph) => {
        if (tt < 1.3) return;
        // baş solda: gövde ortası (px, py - ph/2), baş ~ph*0.4 solda
        const hx = px - ph * 0.38, hy = py - ph * 0.5;
        cc.save(); cc.fillStyle = '#e8f1ff'; cc.strokeStyle = 'rgba(0,0,0,.45)'; cc.lineWidth = 3 * dpr; cc.textAlign = 'center';
        for (let i = 0; i < 3; i++) { const k = ((tt - 1.3) * 0.6 + i / 3) % 1; cc.globalAlpha = 1 - k * k; cc.font = `900 ${Math.round((18 + k * 22) * dpr)}px "Saira Condensed", sans-serif`; const zx = hx + ph * (0.05 + k * 0.35), zy = hy - ph * (0.18 + k * 0.6); cc.strokeText('Z', zx, zy); cc.fillText('Z', zx, zy); }
        cc.restore();
      };
      const k = Math.min(1, (t - 0.9) / 0.4);
      return { h, x: W * 0.52, rot: -Math.PI / 2 * k, y: o.ground - h * 0.1 * k + h * 0.5 * k };
    },
    d_bolt(c, t, o) {
      const { W, H, dpr, f, fx } = o;
      fx.title = 'ŞİMŞEK!';
      if (!fx.z) fx.z = [0.85, 1.1, 1.4, 1.65, 1.95, 2.25, 2.55, 2.85].map((s, i) => ({ s, x: W * (i % 2 ? 0.62 + Math.random() * 0.3 : 0.08 + Math.random() * 0.3) }));
      fx.z.forEach((z) => { const d = 0.32; if (t > z.s && t < z.s + d) { const a = 1 - (t - z.s) / d; bolt(c, z.x, 0, H * 0.72, a, dpr); c.save(); c.globalAlpha = 0.22 * a * a; c.fillStyle = '#dff3ff'; c.fillRect(0, 0, W, H); c.restore(); } });
      if (t > 0.8) {
        // oyuncunun çevresinde elektrik halesi
        const ax = W * 0.5, ay = o.ground - o.h * 0.55, R = o.h * 0.62;
        const g = c.createRadialGradient(ax, ay, R * 0.2, ax, ay, R);
        g.addColorStop(0, 'rgba(127,220,255,0.35)'); g.addColorStop(1, 'rgba(127,220,255,0)');
        c.fillStyle = g; c.fillRect(ax - R, ay - R, R * 2, R * 2);
      }
      if (t < 0.8) return null;
      f.speed = 0; f.armA = 1.6;
      let y = o.ground;
      if (t < 1.4) y -= Math.sin(((t - 0.8) / 0.6) * Math.PI) * o.h * 0.3;
      return { x: W * 0.5, y };
    },
  };
})();

// ---------- HD kariyer posteri ----------
const POSTER_TH = {
  gold: { n: 'Altın', bg: ['#2a1d05', '#0b0905'], acc: '#ffc93a', ink: '#fff6dc', line: 'rgba(255,201,58,.35)' },
  diamond: { n: 'Elmas', bg: ['#0b2b4a', '#040b18'], acc: '#7fdcff', ink: '#eefbff', line: 'rgba(127,220,255,.35)' },
  club: { n: 'Kulüp renkleri', bg: null, acc: '#ffffff', ink: '#ffffff', line: 'rgba(255,255,255,.3)' },
};
const Poster = {
  W: 1080, H: 1350, K: 2, // 2160x2700 (HD, baskıya uygun)
  canvas(th, c1, c2) {
    const cv = document.createElement('canvas'); cv.width = Poster.W * Poster.K; cv.height = Poster.H * Poster.K;
    const c = cv.getContext('2d'); c.scale(Poster.K, Poster.K);
    const W = Poster.W, H = Poster.H, T = POSTER_TH[th] || POSTER_TH.gold;
    const g = c.createLinearGradient(0, 0, W * 0.4, H);
    const b = T.bg || [c1 || '#c8102e', '#06080f'];
    g.addColorStop(0, b[0]); g.addColorStop(1, b[1]); c.fillStyle = g; c.fillRect(0, 0, W, H);
    // ışık huzmeleri ve ince çizgiler
    c.save(); c.globalAlpha = 0.1; c.fillStyle = T.bg ? T.acc : (c2 || '#fff');
    for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(W * 0.5 + (i - 2.5) * 90, -20); c.lineTo(W * 0.5 + (i - 2.5) * 90 + 40, -20); c.lineTo(W * 0.5 + (i - 2.5) * 30 + 10, H * 0.62); c.closePath(); c.fill(); }
    c.restore();
    c.strokeStyle = T.line; c.lineWidth = 3; c.strokeRect(28, 28, W - 56, H - 56);
    c.lineWidth = 1; c.strokeRect(40, 40, W - 80, H - 80);
    const rg = c.createRadialGradient(W / 2, H * 0.36, 30, W / 2, H * 0.36, W * 0.55);
    rg.addColorStop(0, 'rgba(255,255,255,.18)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = rg; c.fillRect(0, 0, W, H);
    return { cv, c, W, H, T };
  },
  head(o, kicker) {
    const { c, W, T } = o;
    c.textAlign = 'left'; c.fillStyle = '#fff'; c.font = 'italic 900 52px "Saira Condensed", sans-serif';
    c.fillText('STAR', 74, 110); const w1 = c.measureText('STAR').width; c.fillStyle = '#ffc93a'; c.fillText('FOOT', 74 + w1, 110);
    c.textAlign = 'right'; c.fillStyle = T.acc; c.font = '800 30px "Saira Condensed", sans-serif'; c.fillText(String(kicker).toLocaleUpperCase(I18N.lang), W - 74, 104);
  },
  name(o, name, sub, y) {
    const { c, W, T } = o;
    c.textAlign = 'center'; c.fillStyle = T.ink;
    let fs = 104; c.font = `900 ${fs}px "Saira Condensed", sans-serif`;
    const nm = String(name).toLocaleUpperCase(I18N.lang);
    while (c.measureText(nm).width > W - 160 && fs > 54) { fs -= 4; c.font = `900 ${fs}px "Saira Condensed", sans-serif`; }
    c.fillText(nm, W / 2, y);
    c.fillStyle = T.acc; c.font = '700 34px "Saira Condensed", sans-serif'; c.fillText(sub, W / 2, y + 50);
  },
  stats(o, y, items) {
    const { c, W, T } = o, n = items.length, bw = (W - 160 - (n - 1) * 16) / n;
    items.forEach(([l, v], i) => {
      const x = 80 + i * (bw + 16);
      c.fillStyle = 'rgba(255,255,255,.07)'; ShareCard.rr(c, x, y, bw, 132, 18); c.fill(); c.strokeStyle = T.line; c.lineWidth = 2; c.stroke();
      c.textAlign = 'center'; c.fillStyle = T.acc; c.font = '900 64px "Saira Condensed", sans-serif'; c.fillText(String(v), x + bw / 2, y + 74);
      c.fillStyle = 'rgba(255,255,255,.72)'; c.font = '700 24px "Saira Condensed", sans-serif'; c.fillText(String(l).toLocaleUpperCase(I18N.lang), x + bw / 2, y + 112);
    });
  },
  list(o, y, title, rows) {
    const { c, W, T } = o;
    if (!rows.length) return y;
    c.textAlign = 'left'; c.fillStyle = T.acc; c.font = '800 28px "Saira Condensed", sans-serif'; c.fillText(String(title).toLocaleUpperCase(I18N.lang), 80, y);
    c.fillStyle = T.line; c.fillRect(80, y + 12, W - 160, 2);
    c.fillStyle = T.ink; c.font = '600 28px "Barlow Semi Condensed", sans-serif';
    rows.forEach((r, i) => { const col = i % 2, row = Math.floor(i / 2); const tx = String(r); let s = tx; while (c.measureText(s).width > (W - 180) / 2 - 10 && s.length > 4) s = s.slice(0, -2); c.fillText(s === tx ? s : `${s}…`, 80 + col * ((W - 160) / 2 + 10), y + 52 + row * 38); });
    return y + 52 + Math.ceil(rows.length / 2) * 38;
  },
  foot(o) {
    const { c, W, H, T } = o;
    if (Diamond.founder()) {
      c.save(); c.textAlign = 'center'; c.fillStyle = T.acc; c.font = '800 26px "Saira Condensed", sans-serif';
      c.fillText(`◆ ${I18N.t('Kurucu Destekçi').toLocaleUpperCase(I18N.lang)} ◆`, W / 2, H - 96); c.restore();
    }
    c.textAlign = 'center'; c.fillStyle = 'rgba(255,255,255,.55)'; c.font = '600 26px "Saira Condensed", sans-serif';
    c.fillText('#StarFoot · starfoot.bagce.dev', W / 2, H - 62);
  },
  // oyuncu kariyeri
  player(th) {
    const s = Game.state, p = s.player, club = Game.club() || { c1: '#c8102e', c2: '#fff' };
    const o = Poster.canvas(th, club.c1, club.c2), { c, W } = o;
    Poster.head(o, I18N.t('Kariyer posteri'));
    SocialArt.glow(c, W / 2, 470, 280, 'rgba(255,255,255,0.18)', 1);
    Sprites.figure(c, W / 2, 700, 520, { kit: Sprites.kit(club, false), look: Sprites.me(p), facing: 'down', number: p.shirt, t: 0 });
    const y0 = s.startYear || (s.season.year - (p.age - 16));
    Poster.name(o, Player.fullName(p), `${(Game.nat(p.nation) || {}).flag || ''} ${POSITIONS[p.position].l} · ${y0 < s.season.year ? `${y0}–${s.season.year}` : s.season.year} · ${Game.teamName()}`, 800);
    const t = p.totals;
    Poster.stats(o, 880, [['Maç', t.apps], ['Gol', t.goals], ['Asist', t.assists], ['Kupa', p.trophies.length], ['Milli', p.intl ? p.intl.caps : 0]]);
    const clubs = [...new Set((p.history || []).filter((h) => h.apps).map((h) => h.club))].slice(-6);
    let y = Poster.list(o, 1068, I18N.t('Kulüpler'), clubs);
    const tr = (p.trophies || []).slice(-6).reverse().map((x) => `🏆 ${U.plain(x).replace(/\s*\(\d+\)$/, '')}`);
    y = Poster.list(o, y + 24, I18N.t('Kupalar'), tr.slice(0, Math.max(2, Math.floor((1220 - y) / 38) * 2)));
    if (y < 1100) Poster.quote(o, I18N.t('Hikâye daha yeni başlıyor.'));
    Poster.foot(o);
    return o.cv;
  },
  quote(o, t) {
    const { c, W, T } = o;
    c.textAlign = 'center'; c.fillStyle = T.acc; c.font = 'italic 700 40px "Saira Condensed", sans-serif';
    c.fillText(`“${t}”`, W / 2, 1150);
  },
  // teknik direktör kariyeri
  coach(th) {
    const s = Coach.s, club = Coach.my();
    const o = Poster.canvas(th, club.c1, club.c2), { c, W } = o;
    Poster.head(o, I18N.t('Teknik direktör'));
    SocialArt.glow(c, W / 2, 470, 280, 'rgba(255,255,255,0.18)', 1);
    const lk = s.look || Coach.defLook(s);
    Sprites.figure(c, W / 2, 700, 520, { kit: Coach.kitFor(lk, club), look: Coach.lookObj(lk), facing: 'down', number: null, t: 0, longSleeve: true });
    const r = s.rec || { w: 0, d: 0, l: 0 }, g = r.w + r.d + r.l;
    Poster.name(o, Coach.fullName(), `${Coach.natFlag(s.nat)} ${club.name} · ${s.year}`, 800);
    Poster.stats(o, 880, [['Maç', g], ['Galibiyet', r.w], ['Kazanma %', g ? Math.round((r.w / g) * 100) : 0], ['Kupa', (s.trophies || []).length]]);
    const clubs = [...new Set([s.clubId].concat((s.hist || []).map((h) => h.club)))].map((id) => (Coach.base(id) || {}).name).filter(Boolean).slice(0, 6);
    let y = Poster.list(o, 1068, I18N.t('Kulüpler'), clubs);
    const tr = (s.trophies || []).slice(-6).reverse().map((x) => `🏆 ${U.plain(x)}`).concat((s.awards || []).slice(-2).map((x) => `🏅 ${U.plain(x)}`));
    y = Poster.list(o, y + 24, I18N.t('Kupalar ve ödüller'), tr.slice(0, Math.max(2, Math.floor((1220 - y) / 38) * 2)));
    if (y < 1100 && !tr.length) Poster.quote(o, I18N.t('Hikâye daha yeni başlıyor.'));
    Poster.foot(o);
    return o.cv;
  },
  // önizleme: tasarım seçimi + paylaş
  open(kind) {
    if (!Diamond.active) return Diamond.pitch('poster');
    let th = 'gold';
    const draw = () => (kind === 'coach' ? Poster.coach(th) : Poster.player(th));
    let cv = draw();
    const el = U.el(`<div class="sh-ov"><div class="sh-box pst-box"><img alt="" src="${cv.toDataURL('image/jpeg', 0.9)}">
      <div class="pst-th">${Object.entries(POSTER_TH).map(([k, v]) => `<button class="chip ${k === th ? 'on' : ''}" data-pth="${k}">${I18N.t(v.n)}</button>`).join('')}</div>
      <div class="sh-btns"><button class="btn btn-ghost" data-x>${I18N.t('Kapat')}</button><button class="btn" data-s>${Icon('share')} ${I18N.t('Paylaş')}</button></div></div></div>`);
    document.body.appendChild(el);
    const img = el.querySelector('img');
    U.$$('[data-pth]', el).forEach((b) => (b.onclick = () => { th = b.dataset.pth; U.$$('[data-pth]', el).forEach((x) => x.classList.toggle('on', x === b)); cv = draw(); img.src = cv.toDataURL('image/jpeg', 0.9); }));
    el.querySelector('[data-x]').onclick = () => el.remove();
    el.querySelector('[data-s]').onclick = () => ShareCard.send(cv, ShareCard.text());
    el.onclick = (e) => { if (e.target === el) el.remove(); };
    if (typeof Premium !== 'undefined') Premium.track('poster_open', { kind });
  },
};

// TD menüsüne poster
(() => {
  if (typeof Coach === 'undefined') return;
  const b0 = Coach.bind;
  Coach.bind = (el) => {
    b0(el);
    const mb = el.querySelector('#cm-menu');
    if (!mb || Coach.s && Coach.s.scn) return;
    const f0 = mb.onclick;
    mb.onclick = () => {
      f0();
      const m = document.getElementById('modal'), bx = m && m.querySelector('.modal-btns');
      if (!bx || !Diamond.enabled()) return;
      const b = U.el(`<button class="btn dia-btn2">${Diamond.gem(16)} ${I18N.t('Kariyer posteri')}</button>`);
      bx.insertBefore(b, bx.children[1] || null);
      b.onclick = () => { m.classList.add('hidden'); Poster.open('coach'); };
    };
  };
})();

// ---------- Erken erişim ----------
const EarlyAccess = {
  // şu an erken erişimde olanlar (herkese açılınca listeden çıkar)
  LIST: [
    { ic: '📆', t: 'Haftanın Meydan Okuması', d: 'Her hafta herkes için aynı Teknik Direktör görevi. Önce Diamond sahiplerinde, sonra herkese.', go: () => TDCh.menu() },
  ],
  open() {
    const m = Game.modal(`<div class="ev-tag">${Diamond.gem(14)} Diamond</div><h2>🧪 Erken erişim</h2>
      <p class="muted">Yeni özellikler herkese açılmadan önce Diamond sahiplerine açılır. Denediklerini bize yazarsan oyunu birlikte şekillendiririz.</p>
      <div class="tdc">${EarlyAccess.LIST.map((x, i) => `<button class="tdc-r" data-ea="${i}"><i data-emo>${x.ic}</i><span><b>${x.t} <em class="ea-pill">Erken erişim</em></b><small>${x.d}</small></span>${Icon('chevron')}</button>`).join('')}</div>`, [{ t: 'Kapat', cls: 'btn-ghost' }], { wide: true });
    U.$$('[data-ea]', m).forEach((b) => (b.onclick = () => { if (!Diamond.active) { m.classList.add('hidden'); return setTimeout(() => Diamond.pitch('early'), 120); } m.classList.add('hidden'); setTimeout(() => EarlyAccess.LIST[+b.dataset.ea].go(), 120); }));
  },
};

// ---------- Diamond tanıtımı: yeni içerik ----------
(() => {
  const perks0 = Diamond.perks;
  Diamond.perks = () => {
    const li = (t, d) => `<li><b>${t}</b><small>${d}</small></li>`;
    const extra = `<ul class="prem-l star-perks dia-perks">
      ${li('🎯 Teknik Direktör meydan okumaları', `${TDCH.length} yıldızlı görev: 0-2 geriden dönüş, 10 kişi, kurtarma operasyonu, şampiyonluk yarışı...`)}
      ${li('🧪 Erken erişim', 'Yeni özellikler herkese açılmadan önce sende. İlki: Haftanın Meydan Okuması')}
      ${li('💎 6 özel gol sevinci', 'Elmas yağmuru, taç giyme, havai fişek, robot dansı, uyku vakti, şimşek')}
      ${li('🖼️ HD kariyer posteri', 'Oyuncu ve teknik direktör kariyerin için 3 tasarım, baskıya uygun çözünürlük')}
      ${li('🎨 TD temaları ve 6 kariyer yuvası', 'Teknik direktör ekranına 4 tema, 3 yerine 6 kariyer')}
      ${Date.now() < FOUNDER_END ? li('◆ Kurucu Destekçi rozeti', 'Çıkış döneminde Diamond alanlara özel, kalıcı rozet') : ''}
    </ul>`;
    return perks0().replace(/<\/ul>\s*$/, `</ul>${extra}`);
  };
  const pitch0 = Diamond.pitch;
  Diamond.pitch = (src) => {
    const m = pitch0(src);
    const md = document.getElementById('modal');
    if (Diamond.active && md) {
      const hero = md.querySelector('.dia-hero');
      if (hero && Diamond.founder()) hero.insertAdjacentHTML('beforeend', Diamond.founderTag());
      const bx = md.querySelector('.modal-btns');
      if (bx) {
        const b = U.el(`<button class="btn btn-ghost">🧪 ${I18N.t('Erken erişim')}</button>`);
        bx.insertBefore(b, bx.firstChild);
        b.onclick = () => { md.classList.add('hidden'); setTimeout(() => EarlyAccess.open(), 120); };
      }
    }
    if (md) UI.strip(md);
    return m;
  };
})();
