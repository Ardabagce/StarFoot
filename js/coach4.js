// Teknik Direktör 1.0.20: Avrupa (ve diğer kıta) kupaları, milli takım teklifleri, eleme maçları ve turnuvalar.
// Avrupa kupası: lig sırasına göre katılım, 4 maçlık lig aşaması, ilk 8 çeyrek finale, tek maç eleme.
// Milli takım: itibar yükselince teklif gelir; sezonda iki milli ara (2'şer eleme maçı), turnuva yıllarında sezon sonu turnuva.

const CM_EU_STAGE = ['Lig aşaması', 'Lig aşaması', 'Lig aşaması', 'Lig aşaması', 'Çeyrek Final', 'Yarı Final', 'Final'];
const CM_NT_APP = {
  att: { t: '⚔️ Hücum', d: 'Çok gol arar, arkada boşluk bırakır.', me: 0.35, op: 0.3 },
  bal: { t: '⚖️ Dengeli', d: 'Kadronun gücüne güvenir.', me: 0, op: 0 },
  def: { t: '🧱 Savunma', d: 'Önce gol yememek, kontra ile vurmak.', me: -0.3, op: -0.4 },
};

(() => {
  // ---------- Avrupa kupası ----------
  Coach.euDef = (lid, pos) => (typeof Cups !== 'undefined' ? Cups.qualifies(lid, pos) : null);
  // güce göre sıra (ilk sezon ya da yeni kulüp)
  Coach.rankByRating = (id) => {
    const lg = Coach.leagueOf(id);
    return Coach.leagueClubs(lg).sort((a, b) => Coach.rating(b) - Coach.rating(a)).indexOf(id) + 1;
  };
  Coach.setupEu = (def) => {
    const s = Coach.s;
    s.eu = null;
    if (!def) return;
    const n = Coach.rounds();
    const leagues = Object.keys(def.quota);
    const pool = CLUB_LIST.filter((c) => leagues.includes(Coach.leagueOf(c[0])) && c[0] !== s.clubId).map((c) => c[0]).sort((a, b) => Coach.rating(b) - Coach.rating(a));
    const band = def.id === 'ucl' ? [0, 34] : def.id === 'uel' ? [14, 64] : def.id === 'uecl' ? [40, 130] : [0, 40];
    const cand = pool.slice(band[0], band[1]);
    const others = U.shuffle(cand.length >= 15 ? cand : pool.slice(0, 40)).slice(0, 15);
    if (others.length < 15) return;
    const ids = others.concat(s.clubId);
    let last = 0;
    const weeks = [0.1, 0.2, 0.3, 0.42, 0.58, 0.72, 0.86].map((f) => { last = Math.max(last + 1, Math.round(n * f)); return last; });
    const opps = U.shuffle(others).slice(0, 4);
    const tbl = {}; ids.forEach((id) => (tbl[id] = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }));
    s.eu = { id: def.id, name: def.name, fame: def.fame || 1, ids, opps, tbl, weeks, stage: 0, played: false, out: false, done: false, alive: null, res: [] };
    Coach.news(`🌍 ${def.name} kurası çekildi! Lig aşamasında rakiplerimiz: ${opps.map((id) => { const n = Coach.club(id).name; return typeof I18N !== 'undefined' && I18N.t ? I18N.t(n) : n; }).join(', ')}.`, 'good');
  };
  Coach.euDue = () => { const s = Coach.s, e = s && s.eu; return !!(e && !e.done && !e.out && !s.jobless && e.weeks[e.stage] === s.round + 1 && !e.played); };
  Coach.euOpp = () => {
    const e = Coach.s.eu;
    if (e.stage < 4) return e.opps[e.stage];
    const i = e.alive.indexOf(Coach.s.clubId);
    return e.alive[i % 2 ? i - 1 : i + 1];
  };
  Coach.euTable = () => {
    const e = Coach.s.eu;
    return Object.entries(e.tbl).map(([id, r]) => Object.assign({ id }, r)).sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);
  };
  const rec = (t, a, b) => { t.p++; t.gf += a; t.ga += b; if (a > b) { t.w++; t.pts += 3; } else if (a === b) { t.d++; t.pts++; } else t.l++; };
  Coach.euAdvance = (gf, ga, win) => {
    const s = Coach.s, e = s.eu, me = s.clubId;
    const fame = e.fame;
    if (e.stage < 4) {
      const opp = e.opps[e.stage];
      rec(e.tbl[me], gf, ga); rec(e.tbl[opp], ga, gf);
      // diğer maçlar
      const rest = U.shuffle(e.ids.filter((id) => id !== me && id !== opp));
      for (let i = 0; i + 1 < rest.length; i += 2) {
        const [a, b] = World.simScore(Coach.rating(rest[i]) + 1, Coach.rating(rest[i + 1]));
        rec(e.tbl[rest[i]], a, b); rec(e.tbl[rest[i + 1]], b, a);
      }
      if (gf > ga) { s.money += Math.round(Coach.value(Coach.my().rating, 26) * 0.05 * fame / 1e4) * 1e4; s.rep = U.clamp(s.rep + 0.5 * fame, 0, 100); }
      e.stage++;
      if (e.stage === 4) {
        const t = Coach.euTable(), top = t.slice(0, 8).map((r) => r.id), pos = t.findIndex((r) => r.id === me) + 1;
        if (pos <= 8) {
          e.alive = [top[0], top[7], top[3], top[4], top[1], top[6], top[2], top[5]];
          s.money += Math.round(Coach.value(Coach.my().rating, 26) * 0.15 * fame / 1e5) * 1e5;
          s.fans = U.clamp(s.fans + 5, 0, 100); s.conf = U.clamp(s.conf + 4, 0, 100);
          Coach.news(`🌍 ${e.name}: lig aşamasını ${pos}. bitirdik ve çeyrek finale yükseldik!`, 'good');
        } else {
          e.out = true; e.outAt = 'league';
          Coach.news(`🌍 ${e.name}: lig aşamasını ${pos}. sırada bitirip elendik.`, 'bad');
        }
      }
    } else {
      const next = [];
      for (let i = 0; i < e.alive.length; i += 2) {
        const h = e.alive[i], a = e.alive[i + 1];
        let w;
        if (h === me || a === me) w = win ? me : (h === me ? a : h);
        else { const r = Cups.tie(Coach.rating(h), Coach.rating(a)); w = r.win === 0 ? h : a; }
        next.push(w);
      }
      if (!next.includes(me)) { e.out = true; e.outAt = e.alive.length; Coach.news(`🌍 ${e.name} ${CM_EU_STAGE[e.stage]} turunda elendik.`, 'bad'); }
      else {
        s.money += Math.round(Coach.value(Coach.my().rating, 26) * 0.12 * fame / 1e5) * 1e5;
        s.rep = U.clamp(s.rep + fame, 0, 100); s.fans = U.clamp(s.fans + 4, 0, 100); s.conf = U.clamp(s.conf + 3, 0, 100);
      }
      e.alive = next; e.stage++;
      if (e.alive.length === 1) {
        e.done = true; e.winner = e.alive[0];
        if (e.winner === me) {
          s.trophies.push(`${s.year} ${e.name}`);
          s.rep = U.clamp(s.rep + 6 * fame, 0, 100); s.conf = U.clamp(s.conf + 20, 0, 100); s.fans = U.clamp(s.fans + 20, 0, 100);
          s.money += Math.round(Coach.value(Coach.my().rating, 26) * 1.2 * fame / 1e5) * 1e5;
          Coach.news(`🏆 ${e.name} şampiyonu olduk! Kıtanın zirvesindeyiz!`, 'good');
          try { Coach.post('trophy', `KITANIN ZİRVESİNDEYİZ! ${s.year} ${e.name}. Bu gece tarihe geçtik!`, 3.5); } catch (er) { /* yok */ }
        } else Coach.news(`🌍 ${e.name}: şampiyon ${Coach.club(e.winner).name}.`, '');
      }
    }
    e.played = false;
  };
  const nm0 = Coach.nextMatch.bind(Coach);
  Coach.nextMatch = () => {
    const m = nm0();
    if (m && (m.comp === 'lg' || m.comp === 'bye') && Coach.euDue()) {
      const e = Coach.s.eu, opp = Coach.euOpp();
      const name = e.stage < 4 ? `${e.name} · Lig aşaması ${e.stage + 1}/4` : `${e.name} · ${CM_EU_STAGE[e.stage]}`;
      return { comp: 'eu', opp, home: e.stage === 6 ? true : ((e.stage + Coach.s.year) % 2) === 0, name, ko: e.stage >= 4 };
    }
    return m;
  };
  const am1 = Coach.afterMatch;
  Coach.afterMatch = (m, res) => {
    if (m.comp !== 'eu') return am1(m, res);
    const wk = Coach.week;
    Coach.week = () => {};
    try { am1(m, res); } finally { Coach.week = wk; }
    const win = res.pens ? res.pens.win : res.gf > res.ga;
    Coach.euAdvance(res.gf, res.ga, win);
    Coach.save();
  };
  // ilk sezon / yeni kulüp: güç sırasına göre kupa
  const jc1 = Coach.joinClub;
  Coach.joinClub = (id, fresh) => {
    const r = jc1(id, fresh);
    try { Coach.s.eu = null; if (fresh) Coach.setupEu(Coach.euDef(Coach.leagueOf(id), Coach.rankByRating(id))); } catch (e) { /* yok */ }
    return r;
  };
  const se1 = Coach.seasonEnd;
  Coach.seasonEnd = (...a) => {
    const s = Coach.s;
    const pos = Coach.myPos(), lg = Coach.my().league;
    const r = se1(...a);
    try {
      const x = s.lastSeason;
      // küme değiştirdiyse yeni ligdeki yerine göre değil, bu sezonki sıraya göre (üst ligde değilse kupa yok)
      s.euNext = { club: s.clubId, def: x && x.moved ? null : Coach.euDef(lg, pos) };
      if (s.eu && x) x.eu = { name: s.eu.name, res: s.eu.done && s.eu.winner === s.clubId ? 'Şampiyon' : s.eu.out ? (s.eu.outAt === 'league' ? 'Lig aşamasında elendi' : `${CM_EU_STAGE[Math.max(4, s.eu.stage - 1)]} turunda elendi`) : '' };
      if (s.euNext.def && x) x.euNext = s.euNext.def.name;
      Coach.save();
    } catch (e) { /* yok */ }
    return r;
  };
  const ns1 = Coach.newSeason;
  Coach.newSeason = (moveTo) => {
    const s = Coach.s, nx = s.euNext;
    const r = ns1(moveTo);
    try {
      if (!moveTo || moveTo === (nx && nx.club)) { if (nx && nx.club === s.clubId) Coach.setupEu(nx.def); }
      s.euNext = null;
      s.ntSeason = { qp: 0, gp: 0, done: {} };
      Coach.save();
      setTimeout(() => Coach.ntOffer(), 600);
    } catch (e) { /* yok */ }
    return r;
  };

  // ---------- milli takım ----------
  Coach.natR = (code) => { const n = Game.nat(code); return n ? n.rating : 60; };
  Coach.ntBreaks = () => { const n = Coach.rounds(); return [Math.round(n * 0.33), Math.round(n * 0.66)]; };
  Coach.ntOffer = (force) => {
    const s = Coach.s;
    if (!s || s.nt || s.phase === 'end') return;
    if (!force && (s.rep < 42 || !U.chance(0.3 + (s.rep - 42) / 90))) return;
    const maxR = 52 + s.rep * 0.42;
    const all = Game.allNations().filter((n) => n.rating <= maxR && n.rating >= maxR - 16);
    const own = all.find((n) => n.code === s.nat);
    const list = (own ? [own] : []).concat(U.shuffle(all.filter((n) => n.code !== s.nat)).slice(0, own ? 1 : 2));
    if (!list.length) return;
    const html = `<div class="ev-tag">Milli takım teklifi</div><h2>${Icon('globe')} Federasyon seni arıyor!</h2>
      <p>Başarıların dikkat çekti. Kulübündeki görevine devam ederken milli takımı da çalıştırabilirsin.</p>
      <div class="cm-offers">${list.map((n) => `<button class="cm-offer" data-nt="${n.code}"><span class="cm-nflag" data-emo>${Coach.natFlag(n.code)}</span><span><b>${U.esc(n.name)}</b><small>Güç ${n.rating}</small>${n.code === s.nat ? '<small>Kendi ülken</small>' : ''}</span>${Icon('chevron')}</button>`).join('')}</div>`;
    const m = Game.modal(html, [{ t: 'Teşekkürler, şimdilik hayır', cls: 'btn-ghost' }], { wide: true });
    U.$$('[data-nt]', m).forEach((b) => (b.onclick = () => {
      m.classList.add('hidden'); m.innerHTML = '';
      const n = Game.nat(b.dataset.nt);
      s.nt = { code: n.code, since: s.year, w: 0, d: 0, l: 0, conf: 60 };
      s.ntSeason = s.ntSeason || { qp: 0, gp: 0, done: {} };
      Coach.news(`🌐 ${n.name} milli takımının teknik direktörü oldun!`, 'good');
      s.rep = U.clamp(s.rep + 2, 0, 100);
      try { Coach.post('club', `Ülkemi temsil etmek... ${n.name} milli takımının başındayım. Hep birlikte!`, 2); } catch (e) { /* yok */ }
      Coach.save(); Coach.render();
      Game.toast(`${n.name} milli takımı seninle!`, 'good');
    }));
  };
  const wk1 = Coach.week;
  Coach.week = () => {
    wk1();
    const s = Coach.s;
    if (!s || !s.nt || s.phase === 'end') return;
    s.ntSeason = s.ntSeason || { qp: 0, gp: 0, done: {} };
    if (Coach.ntBreaks().includes(s.round) && !s.ntSeason.done[s.round]) { s.ntSeason.done[s.round] = 1; s.ntDue = 2; Coach.news(`🌐 Milli maç arası: ${Game.nat(s.nt.code).name} 2 eleme maçına çıkacak.`, ''); }
  };
  // milli maç: yaklaşım seçimi, sonuç simülasyonu
  Coach.ntSim = (myR, opR, app, ko) => {
    const A = CM_NT_APP[app] || CM_NT_APP.bal, s = Coach.s;
    const edge = (myR - opR) / 11 + (s.iq - 50) / 120;
    const pois = (l) => { let k = 0, p = Math.exp(-l), t = p, u = Math.random(); while (u > t && k < 8) { k++; p *= l / k; t += p; } return k; };
    const a = pois(U.clamp(1.25 + edge * 0.55 + A.me, 0.25, 3.6)), b = pois(U.clamp(1.1 - edge * 0.5 + A.op, 0.2, 3.4));
    let pens = null;
    if (ko && a === b) { const w = U.chance(U.clamp(0.5 + (myR - opR) / 60, 0.3, 0.7)); pens = { win: w }; }
    return { a, b, pens };
  };
  Coach.ntStep = (o) => {
    // o: { kind: 'q'|'t', opp: code, label, ko, done(res) }
    const s = Coach.s, me = Game.nat(s.nt.code), op = Game.nat(o.opp);
    const html = `<div class="ev-tag">${U.esc(o.label)}</div><h3><span data-emo>${Coach.natFlag(me.code)}</span> ${U.esc(me.name)} <small class="muted">${me.rating}</small> – <span data-emo>${Coach.natFlag(op.code)}</span> ${U.esc(op.name)} <small class="muted">${op.rating}</small></h3>
      <p>Maç planını seç:</p><div class="cm-offers">${Object.entries(CM_NT_APP).map(([k, v]) => `<button class="cm-offer" data-app="${k}"><span><b>${v.t}</b><small>${v.d}</small></span>${Icon('chevron')}</button>`).join('')}</div>`;
    const m = Game.modal(html, [], { wide: true });
    const b0 = m.querySelector('.modal-btns'); if (b0) b0.remove();
    U.$$('[data-app]', m).forEach((b) => (b.onclick = () => {
      m.classList.add('hidden'); m.innerHTML = '';
      const r = Coach.ntSim(me.rating, op.rating, b.dataset.app, o.ko);
      const win = r.pens ? r.pens.win : r.a > r.b, draw = !r.pens && r.a === r.b;
      const exp = U.clamp(0.5 + (me.rating - op.rating) / 30, 0.15, 0.85), got = win ? 1 : draw ? 0.45 : 0;
      s.nt.conf = U.clamp(s.nt.conf + (got - exp) * 14, 0, 100);
      s.rep = U.clamp(s.rep + (got - exp) * 0.8, 0, 100);
      if (win) s.nt.w++; else if (draw) s.nt.d++; else s.nt.l++;
      const sc = `${r.a}-${r.b}${r.pens ? ` (pen. ${r.pens.win ? 'kazandık' : 'kaybettik'})` : ''}`;
      Coach.news(`🌐 ${me.name} ${sc} ${op.name}`, win ? 'good' : draw ? '' : 'bad');
      Game.modal(`<div class="ev-tag">${U.esc(o.label)}</div><h2>${U.esc(me.name)} ${r.a} - ${r.b} ${U.esc(op.name)}</h2>${r.pens ? `<p>Penaltılar: ${r.pens.win ? 'Turu geçtik!' : 'Elendik.'}</p>` : ''}
        <p>${win ? U.pick(['Ülke sokaklara döküldü, tebrik mesajları yağıyor!', 'Planın mükemmel işledi.', 'Oyuncuların sahayı terk etmeden tribünleri selamladı.']) : draw ? U.pick(['Zorlu bir maçtan bir puanla döndük.', 'Kazanabilirdik ama mücadele iyiydi.']) : U.pick(['Taraftarlar hayal kırıklığı içinde.', 'Basın kadro tercihlerini sorguluyor.', 'Bu yenilgiden ders çıkarmamız gerek.'])}</p>`,
      [{ t: 'Devam', cls: 'btn-big', fn: () => setTimeout(() => o.done(r, win, draw), 120) }]);
    }));
  };
  Coach.ntOpp = (minR, maxR) => {
    const s = Coach.s, list = Game.allNations().filter((n) => n.code !== s.nt.code && n.rating >= minR && n.rating <= maxR);
    return (list.length ? U.pick(list) : U.pick(Game.allNations().filter((n) => n.code !== s.nt.code))).code;
  };
  Coach.ntQualifier = () => {
    const s = Coach.s, R = Coach.natR(s.nt.code);
    Coach.ntStep({ label: `Milli takım · Eleme maçı ${(s.ntSeason.gp % 4) + 1}/4`, opp: Coach.ntOpp(R - 12, R + 6), ko: false, done: (r, win, draw) => {
      s.ntSeason.gp++; s.ntSeason.qp += win ? 3 : draw ? 1 : 0;
      s.ntDue = Math.max(0, (s.ntDue || 1) - 1);
      if (s.nt.conf < 18) {
        Coach.news(`🌐 Federasyon, ${Game.nat(s.nt.code).name} milli takımındaki görevine son verdi.`, 'bad');
        s.rep = U.clamp(s.rep - 3, 0, 100); s.nt = null; s.ntDue = 0;
        Game.modal('<div class="ev-tag">Milli takım</div><h3>Federasyon görevine son verdi</h3><p>Kötü sonuçlar sonrası milli takımdaki görevin sona erdi. Kulübündeki görevin devam ediyor.</p>', [{ t: 'Tamam', cls: 'btn-big' }]);
      }
      Coach.save(); Coach.render();
      if (s.ntDue > 0) setTimeout(() => Coach.ntQualifier(), 250);
    } });
  };
  const play2 = Coach.play;
  Coach.play = (quick) => {
    const s = Coach.s;
    if (s && s.nt && s.ntDue > 0) {
      if (!Coach.owned() && Coach.trialLeft() <= 0) return Coach.trialEnd();
      return Coach.ntQualifier();
    }
    return play2(quick);
  };
  // turnuva: sezon sonu ekranından önce
  Coach.ntTourStart = () => {
    const s = Coach.s, t = Cups.tourType(s.year);
    const need = t === 'nl' ? 9 : 6;
    const qual = (s.ntSeason && s.ntSeason.qp >= need) || Coach.natR(s.nt.code) >= 84;
    const name = Cups.tourName(t);
    if (!qual) {
      s.nt.conf = U.clamp(s.nt.conf - 15, 0, 100);
      Object.assign(s.ntTour, { done: true });
      Coach.news(`🌐 ${Game.nat(s.nt.code).name} ${name}'na katılamadı.`, 'bad');
      return Game.modal(`<div class="ev-tag">${name}</div><h3>Turnuvaya katılamadık</h3><p>Eleme maçlarında yeterli puanı toplayamadık (${(s.ntSeason && s.ntSeason.qp) || 0} puan). Federasyon sabırsızlanıyor.</p>`, [{ t: 'Devam', cls: 'btn-big', fn: () => setTimeout(() => Coach.showSeasonEnd(), 150) }]);
    }
    const ko = t === 'wc' ? ['Son 16', 'Çeyrek Final', 'Yarı Final', 'Final'] : t === 'euro' ? ['Çeyrek Final', 'Yarı Final', 'Final'] : ['Yarı Final', 'Final'];
    Object.assign(s.ntTour, { t, name, group: t === 'nl' ? 3 : 0, gpts: 0, ko, stage: 0, done: false });
    Coach.ntTourNext();
  };
  Coach.ntTourNext = () => {
    const s = Coach.s, T = s.ntTour, R = Coach.natR(s.nt.code);
    const finish = (msg, champ) => {
      T.done = true;
      if (champ) {
        s.trophies.push(`${s.year} ${T.name}`); s.rep = U.clamp(s.rep + 10, 0, 100); s.nt.conf = 100;
        Coach.news(`🏆 ${Game.nat(s.nt.code).name} ile ${T.name} şampiyonu olduk!`, 'good');
        try { Coach.post('trophy', `DÜNYANIN ZİRVESİNDEYİZ! ${s.year} ${T.name}. Ülkemize armağan olsun!`, 4); } catch (e) { /* yok */ }
      }
      Coach.save();
      Game.modal(`<div class="ev-tag">${T.name}</div><h2>${champ ? '🏆 Şampiyon!' : 'Turnuva bitti'}</h2><p>${msg}</p>`, [{ t: 'Devam', cls: 'btn-big', fn: () => setTimeout(() => Coach.showSeasonEnd(), 150) }]);
    };
    if (T.group < 3) {
      const opR = [R - 10, R - 4, R + 2][T.group];
      return Coach.ntStep({ label: `${T.name} · Grup maçı ${T.group + 1}/3`, opp: Coach.ntOpp(opR - 6, opR + 6), ko: false, done: (r, win, draw) => {
        T.group++; T.gpts += win ? 3 : draw ? 1 : 0;
        if (T.group === 3) {
          const through = T.gpts >= 5 || (T.gpts >= 4 && U.chance(0.75)) || (T.gpts === 3 && U.chance(0.3));
          if (!through) { s.nt.conf = U.clamp(s.nt.conf - 12, 0, 100); return finish(`Grupta ${T.gpts} puan topladık ve elendik.`, false); }
          Coach.news(`🌐 ${T.name}: gruptan çıktık (${T.gpts} puan)!`, 'good');
        }
        Coach.save(); setTimeout(() => Coach.ntTourNext(), 150);
      } });
    }
    const st = T.ko[T.stage];
    const opR = R - 4 + T.stage * 3;
    Coach.ntStep({ label: `${T.name} · ${st}`, opp: Coach.ntOpp(opR - 5, opR + 8), ko: true, done: (r, win) => {
      if (!win) { s.nt.conf = U.clamp(s.nt.conf + (T.stage >= 2 ? 8 : -4), 0, 100); s.rep = U.clamp(s.rep + T.stage, 0, 100); return finish(`${st} turunda elendik.`, false); }
      T.stage++;
      if (T.stage >= T.ko.length) return finish('Bütün ülke sokaklarda! Milli takımı zirveye taşıdın.', true);
      Coach.save(); setTimeout(() => Coach.ntTourNext(), 150);
    } });
  };
  const sse = Coach.showSeasonEnd;
  Coach.showSeasonEnd = () => {
    const s = Coach.s, x = s.lastSeason;
    if (x && s.nt && Cups.tourType(x.year)) {
      if (!s.ntTour || s.ntTour.y !== x.year) s.ntTour = { y: x.year };
      const T = s.ntTour;
      if (!T.done) {
        if (Coach._ntRun === x.year || !document.getElementById('modal').classList.contains('hidden')) return;
        Coach._ntRun = x.year;
        if (T.t) Coach.ntTourNext(); else Coach.ntTourStart();
        return;
      }
    }
    return sse();
  };

  // ---------- merkez kartı: Avrupa ve milli takım ----------
  Coach.vComps = () => {
    const s = Coach.s, e = s.eu;
    if (s.jobless) return '';
    let h = '';
    if (e) {
      const t = Coach.euTable(), pos = t.findIndex((r) => r.id === s.clubId) + 1, me = e.tbl[s.clubId];
      const st = e.done ? (e.winner === s.clubId ? '🏆 Şampiyon' : `Şampiyon: ${U.esc(Coach.club(e.winner).name)}`) : e.out ? 'Elendik' : e.stage < 4 ? `Lig aşaması · ${pos}. sıra · ${me.pts} puan` : CM_EU_STAGE[e.stage];
      const nx = !e.done && !e.out ? `<small>Sıradaki maç: ${e.weeks[e.stage]}. hafta</small>` : '';
      h += `<div class="cc-row"><i data-emo>🌍</i><span><b>${U.esc(e.name)}</b><small>${st}</small>${nx}</span>${e.stage < 4 || e.out ? `<button class="cm-link" data-eutbl>Tablo ${Icon('chevron')}</button>` : ''}</div>`;
    }
    if (s.nt) {
      const n = Game.nat(s.nt.code), q = s.ntSeason || { qp: 0, gp: 0 };
      const t = Cups.tourType(s.year);
      const br = Coach.ntBreaks().find((r) => r > s.round);
      h += `<div class="cc-row"><i data-emo>${Coach.natFlag(n.code)}</i><span><b>${U.esc(n.name)} milli takımı</b><small>Elemeler: ${q.gp} maç · ${q.qp} puan${t ? ` · Sezon sonu: ${Cups.tourName(t)}` : ''}</small>${s.ntDue ? '<small class="cc-due">Milli maçlar seni bekliyor!</small>' : br ? `<small>Milli ara: ${br}. hafta</small>` : ''}</span><b class="cc-conf" style="color:${s.nt.conf > 55 ? '#46e08f' : s.nt.conf > 30 ? '#ffcf3f' : '#ff6b6b'}">${Math.round(s.nt.conf)}</b></div>`;
    }
    if (!h) return '';
    return `<section class="card cc"><div class="card-h"><span>${Icon('globe')} Kupalar ve milli takım</span></div>${h}${s.ntDue ? `<button class="btn btn-big cc-nt" id="cm-nt">${Icon('play')} Milli maça çık</button>` : ''}</section>`;
  };
  Coach.euTableModal = () => {
    const s = Coach.s, e = s.eu;
    const rows = Coach.euTable().map((r, i) => { const c = Coach.club(r.id); return `<tr class="${r.id === s.clubId ? 'me' : ''} ${i < 8 ? 'q' : ''}"><td>${i + 1}</td><td class="tn">${UI.shirt(c)}${U.esc(c.name)}</td><td>${r.p}</td><td>${r.gf - r.ga}</td><td><b>${r.pts}</b></td></tr>`; }).join('');
    Game.modal(`<div class="ev-tag">${U.esc(e.name)}</div><h3>Lig aşaması</h3><p class="muted">İlk 8 çeyrek finale yükselir.</p><div class="tbl-wrap"><table class="tbl cm-tbl"><tr><th>#</th><th>Takım</th><th>O</th><th>Av</th><th>P</th></tr>${rows}</table></div>`, [{ t: 'Kapat', cls: 'btn-ghost' }], { wide: true });
  };
  const vHome1 = Coach.vHome;
  Coach.vHome = () => {
    const h = vHome1();
    const c = Coach.vComps();
    if (!c) return h;
    const k = h.indexOf('<section class="card cp');
    if (k < 0) return c + h;
    const j = h.indexOf('</section>', k);
    return h.slice(0, j + 10) + c + h.slice(j + 10);
  };
  const bind1 = Coach.bind;
  Coach.bind = (el) => {
    bind1(el);
    const nt = el.querySelector('#cm-nt'); if (nt) nt.onclick = () => Coach.play(false);
    U.$$('[data-eutbl]', el).forEach((b) => (b.onclick = () => Coach.euTableModal()));
  };
})();
