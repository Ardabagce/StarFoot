// Milli takım elemeleri (1.0.27): Dünya Şampiyonası ve kıta şampiyonalarından bir yıl önce oyuncunun ülkesi,
// kendi kıtasından 4 takımlı bir grupta 3 maç oynar (sezondaki 3 milli maç haftasında). İlk 2 takım turnuvaya katılır.
// Oyuncu kadroya çağrılırsa eleme maçını kendisi oynar; çağrılmazsa maç sonucu simüle edilir.
// Güney Amerika ve Okyanusya şampiyonalarında eleme yoktur (bütün kıta katılır).
const Quals = {
  NOQ: ['sacup', 'occup', 'nl'],
  FX: [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]],

  target(s) {
    const t = Cups.tourTypeFor(s.season.year + 1);
    return t && !Quals.NOQ.includes(t) ? t : null;
  },
  label(q) { return `${q.ty} ${Cups.tourName(q.t)} Elemeleri`; },
  pool(t, nat) {
    const cf = Cups.confed(nat);
    const list = t === 'wc' ? (cf === 'UEFA' ? EURO_NATIONS : CONFEDS[cf] || []) : Cups.contiPool(t).map((n) => n.code);
    return Game.nations().filter((n) => list.includes(n.code) && n.code !== nat);
  },
  ensure(s) {
    const p = s && s.player;
    if (!p || s.mode === 'wc' || !p.nation) return null;
    const t = Quals.target(s);
    if (!t) return null;
    const nat = p.nation;
    const me = Game.nat(nat);
    if (!me) return null;
    let q = s.quals;
    if (q && q.y === s.season.year && q.nat === nat && q.t === t) return q;
    const others = Quals.pool(t, nat);
    if (others.length < 3) return null;
    // kura: güce göre 4 torba, kendi torban dışındaki her torbadan bir rakip
    const all = others.concat([me]).sort((a, b) => b.rating - a.rating);
    const pots = [0, 1, 2, 3].map((i) => all.filter((_, j) => Math.floor((j * 4) / all.length) === i));
    const myPot = pots.findIndex((pt) => pt.some((n) => n.code === nat));
    const grp = [nat];
    pots.forEach((pt, i) => { if (i === myPot) return; const c = U.pick(pt.filter((n) => n.code !== nat)); if (c) grp.push(c.code); });
    while (grp.length < 4) { const c = U.pick(others.filter((n) => !grp.includes(n.code))); if (!c) break; grp.push(c.code); }
    if (grp.length < 4) return null;
    const tbl = {};
    grp.forEach((c) => (tbl[c] = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }));
    q = { y: s.season.year, ty: s.season.year + 1, t, nat, grp, tbl, md: 0, log: [], done: false, ok: null, pend: null, mine: 0 };
    s.quals = q;
    Game.news(`${Quals.label(q)} kurası çekildi: ${me.name}, ${grp.slice(1).map((c) => Game.nat(c).name).join(', ')} ile aynı grupta. İlk 2 turnuvaya gider.`, 'world');
    return q;
  },
  // berabere kalabilen maç (grup aşaması)
  sim(a, b) {
    const ra = Game.nat(a).rating, rb = Game.nat(b).rating;
    const lam = (x, y) => U.clamp(1.25 * (1 + (x - y) / 32), 0.25, 3.2);
    const pois = (l) => { let k = 0, pr = Math.exp(-l), sm = pr; const u = Math.random(); while (u > sm && k < 7) { k++; pr *= l / k; sm += pr; } return k; };
    return [pois(lam(ra, rb)), pois(lam(rb, ra))];
  },
  record(s, q, a, b, ga, gb) {
    const A = q.tbl[a], B = q.tbl[b];
    if (!A || !B) return;
    A.p++; B.p++; A.gf += ga; A.ga += gb; B.gf += gb; B.ga += ga;
    if (ga > gb) { A.w++; B.l++; A.pts += 3; } else if (ga < gb) { B.w++; A.l++; B.pts += 3; } else { A.d++; B.d++; A.pts++; B.pts++; }
    q.log.push({ md: q.md, a, b, ga, gb });
  },
  table(q) {
    return q.grp.map((c) => Object.assign({ code: c }, q.tbl[c])).sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf || Game.nat(y.code).rating - Game.nat(x.code).rating);
  },
  played(q, a, b) { return q.log.some((m) => (m.a === a && m.b === b) || (m.a === b && m.b === a)); },
  // eksik kalan maçları oynat (ör. sezona elemeler başladıktan sonra girildiyse)
  catchUp(s, q, upto) {
    for (let md = 0; md < upto; md++) {
      Quals.FX[md].forEach(([i, j]) => {
        const a = q.grp[i], b = q.grp[j];
        if (Quals.played(q, a, b)) return;
        const r = Quals.sim(a, b); q.md = md; Quals.record(s, q, a, b, r[0], r[1]);
      });
    }
  },
  weekStart(s) {
    const q = Quals.ensure(s);
    if (!q || q.done) return;
    const md = Game.intlWeeks().indexOf(s.season.round);
    if (md < 0) return;
    Quals.catchUp(s, q, md);
    q.md = md;
    const [mine, other] = Quals.FX[md];
    const a = q.grp[other[0]], b = q.grp[other[1]];
    if (!Quals.played(q, a, b)) { const r = Quals.sim(a, b); Quals.record(s, q, a, b, r[0], r[1]); }
    const opp = q.grp[mine[1]];
    q.pend = Quals.played(q, q.nat, opp) ? null : { md, opp };
  },
  weekEnd(s) {
    const q = s && s.quals;
    if (!q || !q.pend) return;
    if (s.pendingIntl === q.pend.opp && !s.pendingIntlCat) { s.qualMatch = { md: q.pend.md, opp: q.pend.opp }; q.pend = null; return; }
    // oyuncu çağrılmadı: maç simüle edilir
    const opp = q.pend.opp;
    const r = Quals.sim(q.nat, opp);
    q.md = q.pend.md;
    Quals.record(s, q, q.nat, opp, r[0], r[1]);
    q.pend = null;
    Game.news(`${Quals.label(q)}: ${Game.nat(q.nat).name} ${r[0]}-${r[1]} ${Game.nat(opp).name}.`, r[0] > r[1] ? 'good' : r[0] < r[1] ? 'bad' : '');
    Quals.after(s, q);
  },
  after(s, q) {
    if (q.done || q.log.length < 6) return;
    q.done = true;
    const tb = Quals.table(q);
    const pos = tb.findIndex((r) => r.code === q.nat) + 1;
    q.ok = pos > 0 && pos <= 2;
    const nm = Game.nat(q.nat).name;
    if (q.ok && q.mine > 0 && s.player) s.player.qualOk = true;
    if (q.ok) Game.news(`${Quals.label(q)} tamamlandı: ${nm} grubu ${pos}. sırada bitirdi ve ${q.ty} ${Cups.tourName(q.t)} biletini aldı!`, 'good');
    else Game.news(`${Quals.label(q)} tamamlandı: ${nm} grubu ${pos}. sırada bitirdi ve turnuvaya katılamayacak.`, 'bad');
    if (q.ok && q.mine > 0 && typeof Social !== 'undefined') { try { Social.post('daily', `${q.ty} ${Cups.tourName(q.t)} biletini aldık! Bu yolculuğun parçası olmak gurur verici.`, 2, Social.natOpts()); } catch (e) { /* yok */ } }
  },
  // turnuva başlarken elemelerin sonucu uygulanır
  finalize(s, q) {
    if (q.done) return;
    Quals.catchUp(s, q, 3);
    Quals.after(s, q);
  },
  card(s) {
    const q = s.quals;
    if (!q || q.y < s.season.year - 1) return '';
    const tb = Quals.table(q);
    const flag = (c) => U.esc(Game.nat(c).name);
    const st = q.done ? (q.ok ? 'Turnuvaya katılıyor' : 'Elendi') : `${Math.min(3, Math.floor(q.log.length / 2))}/3 maç günü`;
    return `<section class="card qual-card">
      <div class="card-h"><span>${Icon('shield')} ${U.esc(Quals.label(q))}</span><small class="muted">${st}</small></div>
      <table class="tbl qtbl"><tr><th>#</th><th class="l">Grup</th><th>O</th><th>AV</th><th>P</th></tr>
      ${tb.map((r, i) => `<tr class="${r.code === q.nat ? 'hl' : ''} ${i < 2 ? 'z-up' : ''}"><td>${i + 1}</td><td class="l">${flag(r.code)}</td><td>${r.p}</td><td>${r.gf - r.ga > 0 ? '+' : ''}${r.gf - r.ga}</td><td><b>${r.pts}</b></td></tr>`).join('')}</table>
      ${q.log.length ? `<div class="q-log">${q.log.map((m) => `<div class="${m.a === q.nat || m.b === q.nat ? 'me' : ''}"><span>${flag(m.a)}</span><b>${m.ga}-${m.gb}</b><span>${flag(m.b)}</span></div>`).join('')}</div>` : ''}
      <p class="muted q-note">Milli maç haftalarında oynanır. İlk 2 takım ${q.ty} ${U.esc(Cups.tourName(q.t))} için bilet alır.</p>
    </section>`;
  },
  status(s) {
    const q = s.quals;
    if (!q || q.y < s.season.year - 1) return '';
    if (q.done) return q.ok ? 'Turnuvaya katılıyor' : 'Elemelerde kaldı';
    const pos = Quals.table(q).findIndex((r) => r.code === q.nat) + 1;
    return `Eleme grubunda ${pos}.`;
  },
};

(() => {
  // milli maç haftası: eleme maç günü hazırlanır; çağrılırsa rakip eleme rakibidir
  const cc = Game.checkCallup;
  Game.checkCallup = function () {
    const s = Game.state;
    try { Quals.weekStart(s); } catch (e) { console.error(e); }
    const out = cc.apply(this, arguments);
    try { Quals.weekEnd(s); } catch (e) { console.error(e); }
    return out;
  };
  const cu = Game.callup;
  Game.callup = function (code) {
    const s = Game.state, q = s && s.quals;
    if (!q || !q.pend || code !== q.nat || !Game.nat(q.pend.opp)) return cu.apply(this, arguments);
    const p = s.player, nat = Game.nat(code), opp = Game.nat(q.pend.opp);
    s.pendingIntl = opp.code;
    s.pendingIntlCat = null;
    Game.news(`${nat.flag} MİLLİ TAKIMA ÇAĞRILDIN! ${Quals.label(q)}: ${opp.flag} ${opp.name} maçı seni bekliyor.`, 'good');
    Game.toast(`${nat.flag} Eleme maçı için milli takıma çağrıldın!`, 'good');
    Player.addMorale(p, 8);
    Player.addFame(p, 2);
    return undefined;
  };
  // maç ekranında eleme adı
  const mr = Match.run;
  Match.run = function (ctx, s) {
    try {
      const st = s || Game.state, qm = st && st.qualMatch, q = st && st.quals;
      if (ctx && qm && q && ctx.lg === 'intl' && !ctx.intlCat && [ctx.home.id, ctx.away.id].includes(qm.opp)) ctx.compName = `${Quals.label(q)} · ${qm.md + 1}. maç • ${ctx.home.name} - ${ctx.away.name}`;
    } catch (e) { /* yok */ }
    return mr.apply(this, arguments);
  };
  // oyuncunun oynadığı eleme maçının sonucu gruba yazılır
  const am = Game.applyMatch;
  Game.applyMatch = function (sum, ctx, comp) {
    const out = am.apply(this, arguments);
    try {
      const s = Game.state, qm = s && s.qualMatch, q = s && s.quals;
      if (qm && q && comp === 'intl' && ctx && !ctx.intlCat && [ctx.home.id, ctx.away.id].includes(qm.opp)) {
        const gf = ctx.side === 'home' ? sum.hs : sum.as, ga = ctx.side === 'home' ? sum.as : sum.hs;
        q.md = qm.md;
        if (!Quals.played(q, q.nat, qm.opp)) { Quals.record(s, q, q.nat, qm.opp, gf, ga); if (sum.played) q.mine++; }
        s.qualMatch = null;
        Quals.after(s, q);
      }
    } catch (e) { console.error(e); }
    return out;
  };
  // turnuva: elemeyi geçen ülke turnuvada, geçemeyen yok
  const stt = Cups.startTournament;
  Cups.startTournament = function (s) {
    const out = stt.apply(this, arguments);
    try {
      const q = s.quals, t = s.tournament, p = s.player;
      if (q && t && q.ty === s.season.year && q.t === t.type && q.nat === p.nation) {
        Quals.finalize(s, q);
        const nat = q.nat, inP = t.teams.includes(nat);
        const swap = (outC, inC) => { t.teams = t.teams.map((c) => (c === outC ? inC : c)); t.alive = t.alive.map((c) => (c === outC ? inC : c)); };
        if (q.ok && !inP) {
          const weak = t.teams.slice().sort((a, b) => Game.nat(a).rating - Game.nat(b).rating)[0];
          swap(weak, nat);
          t.inPool = true;
          const n = Game.nat(nat);
          t.called = p.age >= 17 && p.injuryWeeks === 0 && !Life.banned() && Player.overall(p, true) >= n.rating - 7 - (p.fame > 40 ? 2 : 0);
        } else if (!q.ok && inP) {
          const pool = t.type === 'wc' ? Game.nations() : Cups.contiPool(t.type);
          const rep = pool.filter((n) => !t.teams.includes(n.code) && n.code !== nat).sort((a, b) => b.rating - a.rating)[0];
          if (rep) { swap(nat, rep.code); t.inPool = false; t.called = false; }
        }
      }
    } catch (e) { console.error(e); }
    return out;
  };
})();
