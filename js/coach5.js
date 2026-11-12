// Teknik Direktör 1.0.20: maç planı ve rakip analizi, derbi, basında rakip hocaya laf sokma,
// yönetimin sezon hedefleri, yönetimle bütçe görüşmesi, altyapıdan cevher, gençlere süre ödülü,
// kulüp müzesi, oyuncu kariyerindeki arkadaşlar (yardımcı antrenör ve rakip hocalar).

const CM_BG = {
  youth: { t: 'En az 2 genç (21 yaş ve altı) 12+ maç oynasın' },
  wage: { t: 'Sezon sonunda maaş gideri {} altında kalsın' },
  cup: { t: 'Kupada yarı finale kal' },
  eu: { t: 'Avrupa’da çeyrek finale çık' },
  goals: { t: 'Ligde en az {} gol at' },
  home: { t: 'İç sahada en fazla {} maç kaybet' },
};
const CM_JABS = [
  'Rakip hocanın takımı kâğıt üstünde güçlü, sahada göreceğiz.',
  'Onların oyun anlayışı on yıl önce kaldı.',
  'Hafta sonu kimin daha iyi hoca olduğu belli olacak.',
];

(() => {
  const key = (m) => `${Coach.s.year}-${Coach.s.round}-${m.comp}-${m.opp}`;
  const fame = () => Coach.lgInfo(Coach.my().league).fame || 1;

  // ---------- derbi ----------
  Coach.derby = () => {
    const s = Coach.s;
    if (!s || !s.lg) return null;
    if (!s.dby || s.dby.lg !== s.lg.id || s.dby.c !== s.clubId) {
      const me = Coach.my().rating, ids = s.lg.ids.filter((id) => id !== s.clubId).sort((a, b) => Math.abs(Coach.club(a).rating - me) - Math.abs(Coach.club(b).rating - me)).slice(0, 3);
      let h = 0; for (const ch of s.clubId) h = (h * 31 + ch.charCodeAt(0)) % 997;
      s.dby = { lg: s.lg.id, c: s.clubId, id: ids.length ? ids[h % ids.length] : null };
    }
    return s.dby.id;
  };

  // ---------- eski takım arkadaşları ----------
  const fp1 = Coach.fromPlayer;
  Coach.fromPlayer = (p, legend) => {
    try { Coach._pals = (p.friends || []).filter((f) => f && f.n).map((f) => ({ n: f.n, job: f.job, rel: f.rel || 60 })).slice(0, 8); } catch (e) { Coach._pals = []; }
    return fp1(p, legend);
  };
  const st1 = Coach.start;
  Coach.start = (o, clubId) => {
    st1(o, clubId);
    const s = Coach.s, pals = Coach._pals || [];
    Coach._pals = null;
    if (!pals.length) return;
    s.pals = pals;
    // bazı arkadaşlar başka kulüplerde teknik direktör oldu
    const coaches = pals.filter((f) => ['coach', 'pro', 'other'].includes(f.job)).slice(0, 3);
    s.palClubs = {};
    coaches.forEach((f, i) => { const c = U.pick(CLUB_LIST.filter((x) => x[0] !== s.clubId && !s.palClubs[x[0]] && Coach.leagueOf(x[0]) === Coach.my().league)) || U.pick(CLUB_LIST); s.palClubs[c[0]] = f.n; void i; });
    const as = pals.slice().sort((a, b) => b.rel - a.rel)[0];
    if (as) {
      setTimeout(() => Game.modal(`<div class="ev-tag">Eski takım arkadaşın</div><h3>${U.esc(as.n)} yardımcı antrenörün olmak istiyor</h3><p>Futbol yıllarından tanıdığın ${U.esc(as.n)}, teknik ekibine katılmak için kapını çaldı. Oyuncular onu seviyor.</p>`, [
        { t: 'Şimdilik hayır', cls: 'btn-ghost' },
        { t: 'Ekibe katılsın', cls: 'btn-big', fn: () => { s.asst = as.n; s.iq = U.clamp(s.iq + 4, 0, 100); s.trust = U.clamp((s.trust || 60) + 6, 0, 100); Coach.news(`🤝 Eski takım arkadaşın ${as.n} yardımcı antrenörün oldu.`, 'good'); Coach.save(); Coach.render(); } },
      ]), 400);
    }
    Coach.save();
  };
  Coach.palOf = (clubId) => (Coach.s.palClubs && Coach.s.palClubs[clubId]) || null;

  // ---------- maç kartı: plan, derbi, laf sokma, rakip hoca ----------
  const vh2 = Coach.vHome;
  Coach.vHome = () => {
    let h = vh2();
    const s = Coach.s, m = Coach.nextMatch();
    if (!m || m.comp === 'bye' || !m.opp || s.jobless) return h;
    const k = key(m), der = m.comp === 'lg' && m.opp === Coach.derby(), pal = Coach.palOf(m.opp);
    const plan = s.plan && s.plan.k === k ? Coach.P(s.plan.mark) : null, jab = s.jab && s.jab.k === k;
    const tags = `${der ? '<span class="mp-tag der">🔥 DERBİ</span>' : ''}${pal ? `<span class="mp-tag pal">Rakip hoca: <b data-noi18n>${U.esc(pal)}</b> (eski takım arkadaşın)</span>` : ''}`;
    const row = `<div class="mp-row">${tags}<div class="mp-btns"><button class="btn btn-ghost" id="cm-plan">📋 ${plan ? `Markaj: <b data-noi18n>${U.esc(plan.n.split(' ').slice(-1)[0])}</b>` : 'Maç planı'}</button>
      <button class="btn btn-ghost" id="cm-jab" ${jab ? 'disabled' : ''}>🗯️ ${jab ? 'Laf sokuldu' : 'Rakip hocaya laf sok'}</button></div></div>`;
    const i = h.indexOf('<div class="cm-play">');
    return i >= 0 ? h.slice(0, i) + row + h.slice(i) : h;
  };
  Coach.planModal = () => {
    const s = Coach.s, m = Coach.nextMatch();
    if (!m || !m.opp) return;
    const o = Coach.club(m.opp), star = Coach.starOf(m.opp), ost = CM_STYLES[Coach.oppStyle(m.opp)];
    const t = Coach.table(), pos = t.findIndex((r) => r.id === m.opp) + 1, row = t.find((r) => r.id === m.opp);
    const markers = Coach.xiPlayers().filter((p) => p.pos === 'DF' || p.pos === 'MF').sort((a, b) => b.r - a.r).slice(0, 5);
    const cur = s.plan && s.plan.k === key(m) ? s.plan.mark : null;
    const md = Game.modal(`<div class="ev-tag">Rakip analizi</div><h3>${U.esc(o.name)}</h3>
      <div class="cm-kv four"><div><span>Güç</span><b>${Coach.rating(m.opp)}</b></div><div><span>Sıra</span><b>${pos || '–'}.</b></div><div><span>Gol</span><b>${row ? `${row.gf}:${row.ga}` : '–'}</b></div><div><span>Oyun</span><b>${ost.t}</b></div></div>
      <div class="lbl">Son 5 maç</div><p>${Coach.formDots(m.opp)}</p>
      <div class="lbl">En tehlikeli oyuncu</div><p><b>${Coach.pa(star[1])} ${U.esc(star[0])}</b></p>
      <p class="muted">${Coach.oppTip(Coach.oppStyle(m.opp))}</p>
      <div class="lbl">Adam adama markaj</div><p class="muted">Seçtiğin oyuncu ${U.esc(star[0])}'yi takip eder: rakibin hücumu zayıflar, bizim hücuma katkı biraz azalır.</p>
      <div class="cm-offers">${markers.map((p) => `<button class="cm-offer ${p.id === cur ? 'on' : ''}" data-mk="${p.id}"><span class="cm-pos ${p.pos}">${CM_POS[p.pos]}</span><span><b>${U.esc(p.n)}</b><small>Güç ${Coach.ovr(p)} · Kondisyon ${Math.round(p.fit)}</small></span>${Icon('chevron')}</button>`).join('')}</div>`,
    [{ t: 'Markaj yok', cls: 'btn-ghost', fn: () => { s.plan = null; Coach.save(); Coach.render(); } }, { t: 'Kapat', cls: 'btn-ghost' }], { wide: true });
    U.$$('[data-mk]', md).forEach((b) => (b.onclick = () => { s.plan = { k: key(m), mark: +b.dataset.mk }; md.classList.add('hidden'); md.innerHTML = ''; Coach.save(); Coach.render(); Game.toast('Maç planı hazır.', 'good'); }));
  };
  Coach.jabModal = () => {
    const s = Coach.s, m = Coach.nextMatch();
    if (!m || !m.opp) return;
    const pal = Coach.palOf(m.opp);
    const md = Game.modal(`<div class="ev-tag">Basın toplantısı</div><h3>${U.esc(Coach.club(m.opp).name)} maçı öncesi ne diyeceksin?</h3>
      <p class="muted">Laf sokarsan iki takım da maça daha hırslı çıkar. Kazanırsan taraftar coşar, kaybedersen faturası ağır olur.</p>
      <div class="cm-offers">${CM_JABS.map((t, i) => `<button class="cm-offer" data-jb="${i}"><span><b>"${U.esc(t)}"</b></span>${Icon('chevron')}</button>`).join('')}</div>${pal ? `<p class="muted">Rakip hoca ${U.esc(pal)} eski takım arkadaşın: bu söz aranızı biraz gerebilir.</p>` : ''}`, [{ t: 'Vazgeç', cls: 'btn-ghost' }], { wide: true });
    U.$$('[data-jb]', md).forEach((b) => (b.onclick = () => {
      s.jab = { k: key(m), opp: m.opp };
      md.classList.add('hidden'); md.innerHTML = '';
      Coach.news(`🗯️ Sözlerin manşette: "${CM_JABS[+b.dataset.jb]}"`, '');
      Coach.save(); Coach.render();
      Game.toast('Gözler bu maçta!', 'good');
    }));
  };
  const bind2 = Coach.bind;
  Coach.bind = (el) => {
    bind2(el);
    const a = el.querySelector('#cm-plan'); if (a) a.onclick = () => Coach.planModal();
    const b = el.querySelector('#cm-jab'); if (b) b.onclick = () => Coach.jabModal();
    U.$$('[data-bud]', el).forEach((x) => (x.onclick = () => Coach.budgetTalk(x.dataset.bud)));
    const mu = el.querySelector('#cm-mus'); if (mu) mu.onclick = () => Coach.museum();
  };
  // maç öncesi: plan, laf, derbi etkileri güce eklenir
  const ls0 = Live.start;
  Live.start = (match, quick) => {
    const s = Coach.s, k = key(match);
    s.boost = s.boost || { att: 0, def: 0, set: 0 };
    if (s.plan && s.plan.k === k && Coach.P(s.plan.mark) && s.xi.includes(s.plan.mark)) { s.boost.def += 1.3; s.boost.att -= 0.3; }
    if (s.jab && s.jab.k === k) { s.boost.att += 1.2; s.boost.def -= 0.8; }
    if (match.comp === 'lg' && match.opp === Coach.derby()) { s.boost.att += 0.4; s.boost.def += 0.4; }
    return ls0(match, quick);
  };
  const nm2 = Coach.nextMatch;
  Coach.nextMatch = () => { const m = nm2(); if (m && m.comp === 'lg' && m.opp && m.opp === Coach.derby()) m.name = `${m.name} · Derbi`; return m; };

  // ---------- maç sonrası: derbi, laf, müze, hedefler ----------
  const am2 = Coach.afterMatch;
  Coach.afterMatch = (m, res) => {
    const s = Coach.s, k = key(m), der = m.comp === 'lg' && m.opp === Coach.derby(), jab = s.jab && s.jab.k === k;
    const myId = s.clubId;
    am2(m, res);
    const S = Coach.s;
    if (!S) return;
    const win = res.pens ? res.pens.win : res.gf > res.ga, loss = !res.pens && res.gf < res.ga;
    const opp = Coach.club(m.opp).name;
    if (der) {
      S.fans = U.clamp(S.fans + (win ? 6 : loss ? -6 : 0), 0, 100); S.conf = U.clamp(S.conf + (win ? 3 : loss ? -3 : 0), 0, 100);
      if (win || loss) Coach.news(win ? `🔥 Derbi bizim! ${opp} karşısında şehir bizim renklerimize boyandı.` : `🔥 Derbide ${opp}'a kaybettik. Taraftar çok üzgün.`, win ? 'good' : 'bad');
    }
    if (jab) {
      if (win) { S.fans = U.clamp(S.fans + 4, 0, 100); S.rep = U.clamp(S.rep + 1, 0, 100); Coach.news('🗯️ Sözlerinin arkasında durdun! Basın seni konuşuyor.', 'good'); }
      else if (loss) { S.fans = U.clamp(S.fans - 6, 0, 100); S.conf = U.clamp(S.conf - 3, 0, 100); Coach.news('🗯️ Maç öncesi sözlerin sana geri döndü. Taraftar tepkili.', 'bad'); }
      else S.fans = U.clamp(S.fans - 1, 0, 100);
    }
    if (S.plan && S.plan.k === k) S.plan = null;
    // müze: en farklı galibiyet
    if (S.clubId === myId && win) {
      const mu = Coach.mus(myId), d = res.gf - res.ga;
      if (!mu.big || d > mu.big.gf - mu.big.ga) mu.big = { gf: res.gf, ga: res.ga, opp: m.opp, y: S.year };
    }
    if (m.home) { S.hl = S.hl || { y: S.year, l: 0 }; if (S.hl.y !== S.year) S.hl = { y: S.year, l: 0 }; if (loss && m.comp === 'lg') S.hl.l++; }
    Coach.save();
  };

  // ---------- kulüp müzesi ----------
  Coach.mus = (id) => { const s = Coach.s; s.musm = s.musm || {}; s.musm[id] = s.musm[id] || { tro: [], sc: {}, ap: {}, seasons: 0, best: null, big: null }; return s.musm[id]; };
  const sv0 = Coach.save;
  Coach.save = () => {
    const s = Coach.s;
    try {
      if (s && s.trophies && !s.jobless) {
        if (s.musT == null) s.musT = s.trophies.length;
        const nt = ['Dünya Şampiyonası', 'Avrupa Milletler Şampiyonası', 'Milletler Ligi Finalleri'];
        s.trophies.slice(s.musT).forEach((t) => { if (!nt.some((x) => t.includes(x))) Coach.mus(s.clubId).tro.push(t); });
        s.musT = s.trophies.length;
      }
    } catch (e) { /* yok */ }
    return sv0();
  };
  Coach.museum = () => {
    const s = Coach.s, c = Coach.my(), mu = Coach.mus(s.clubId);
    const top = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const sc = top(Object.assign({}, mu.sc, Object.fromEntries(s.squad.map((p) => [p.n, (mu.sc[p.n] || 0) + p.g]))));
    const ap = top(Object.assign({}, mu.ap, Object.fromEntries(s.squad.map((p) => [p.n, (mu.ap[p.n] || 0) + p.apps]))));
    const leg = ap.filter(([, n]) => n >= 100);
    Game.modal(`<div class="ev-tag">Kulüp müzesi</div><h2>🏛️ ${U.esc(c.name)}</h2>
      <p class="muted">Senin dönemin: ${mu.seasons + 1}. sezon${mu.best ? ` · En iyi lig sırası ${mu.best.pos}. (${mu.best.y})` : ''}</p>
      <div class="lbl">Kupa dolabı</div>${mu.tro.length ? `<ul class="trophies">${mu.tro.map((t) => `<li>🏆 ${U.esc(t)}</li>`).join('')}</ul>` : '<p class="muted">Henüz kupa yok. İlk kupayı müzeye koymak senin elinde!</p>'}
      <div class="lbl">Rekorlar</div>${mu.big ? `<div class="cm-sr"><span>En farklı galibiyet</span><b>${mu.big.gf}-${mu.big.ga} · ${U.esc(Coach.club(mu.big.opp).name)} (${mu.big.y})</b></div>` : ''}
      ${sc.filter(([, g]) => g).map(([n, g], i) => `<div class="cm-sr"><span>${i === 0 ? '👑 ' : ''}<span data-noi18n>${U.esc(n)}</span></span><b>${g} gol</b></div>`).join('') || '<p class="muted">Gol kayıtları sezon ilerledikçe dolacak.</p>'}
      <div class="lbl">Kulüp efsaneleri (100+ maç)</div>${leg.length ? leg.map(([n, a]) => `<div class="cm-sr"><span>⭐ <span data-noi18n>${U.esc(n)}</span></span><b>${a} maç</b></div>`).join('') : '<p class="muted">100 maça ulaşan oyuncular burada efsane olarak anılır.</p>'}`,
    [{ t: 'Kapat', cls: 'btn-ghost' }], { wide: true });
  };
  const vcl = Coach.vClub;
  Coach.vClub = () => vcl().replace('<div class="cm-seg top">', `<button class="btn btn-ghost cm-musb" id="cm-mus">🏛️ Kulüp müzesi</button><div class="cm-seg top">`);

  // ---------- sezon geçişleri: müze, cevher, hedefler ----------
  const ns3 = Coach.newSeason;
  Coach.newSeason = (moveTo) => {
    const s = Coach.s, club = s.clubId;
    try {
      const mu = Coach.mus(club);
      s.squad.forEach((p) => { mu.sc[p.n] = (mu.sc[p.n] || 0) + (p.g || 0); mu.ap[p.n] = (mu.ap[p.n] || 0) + (p.apps || 0); });
      mu.seasons++;
      const x = s.lastSeason; if (x && x.club === club && (!mu.best || x.pos < mu.best.pos)) mu.best = { pos: x.pos, y: x.year };
    } catch (e) { /* yok */ }
    const maxId = s.pid || 0;
    const r = ns3(moveTo);
    const S = Coach.s;
    try {
      if (!moveTo || moveTo === club) {
        const kids = S.squad.filter((p) => p.id > maxId && p.age <= 18);
        if (kids.length && U.chance(0.16 + (S.fac.youth - 1) * 0.06)) {
          const k = U.pick(kids), tr = Coach.teamRating();
          k.pot = Math.min(94, tr + U.randi(14, 22)); k.r = Math.max(k.r, tr - 9); k.wk = 1;
          Coach.news(`🌟 Altyapıdan bir cevher çıktı: ${Coach.pa(k.pos)} ${k.n} (17). Gözlemciler potansiyelinin çok yüksek olduğunu söylüyor!`, 'good');
          try { Coach.post('sign', `Altyapımızdan ${k.n} A takımda! Bu çocuğun adını not edin.`, 1.3); } catch (e) { /* yok */ }
        }
      }
      Coach.setGoals();
    } catch (e) { /* yok */ }
    return r;
  };
  const jc2 = Coach.joinClub;
  Coach.joinClub = (id, fresh) => { const r = jc2(id, fresh); try { Coach.setGoals(); } catch (e) { /* yok */ } return r; };

  // ---------- yönetimin sezon hedefleri ----------
  Coach.setGoals = () => {
    const s = Coach.s;
    const opts = ['youth', 'wage', 'goals', 'home'];
    if (s.cup) opts.push('cup');
    if (s.eu) opts.push('eu', 'eu');
    const pick = U.shuffle(opts).filter((k, i, a) => a.indexOf(k) === i).slice(0, 2);
    const n = Coach.rounds();
    s.bg = pick.map((k) => {
      if (k === 'wage') return { k, v: Math.round(s.wbudget * 0.95 / 1000) * 1000 };
      if (k === 'goals') return { k, v: Math.round(n * (s.target <= 2 ? 1.9 : s.target <= 6 ? 1.5 : 1.15)) };
      if (k === 'home') return { k, v: Math.max(2, Math.round(n / 2 * (s.target <= 4 ? 0.15 : 0.35))) };
      return { k };
    });
    s.bgY = s.year;
  };
  Coach.goalText = (g) => (CM_BG[g.k].t.includes('{}') ? CM_BG[g.k].t.replace('{}', g.k === 'wage' ? U.money(g.v) : g.v) : CM_BG[g.k].t);
  Coach.goalState = (g) => {
    const s = Coach.s;
    const me = (Coach.table().find((r) => r.id === s.clubId) || { gf: 0 });
    if (g.k === 'youth') { const n = s.squad.filter((p) => p.age <= 21 && p.apps >= 12).length; return [n >= 2, `${n}/2`]; }
    if (g.k === 'wage') return [Coach.wageBill() <= g.v, U.money(Coach.wageBill())];
    if (g.k === 'goals') return [me.gf >= g.v, `${me.gf}/${g.v}`];
    if (g.k === 'home') { const l = s.hl && s.hl.y === s.year ? s.hl.l : 0; return [l <= g.v, `${l}/${g.v}`]; }
    if (g.k === 'cup') { const c = s.cup; const ok = !!c && ((c.done && c.winner === s.clubId) || (!c.out && c.alive.length <= 4) || (c.out && c.outAt <= 4)); return [ok, c ? (c.out ? 'Elendik' : c.done ? 'Bitti' : Coach.cupStageName(c.alive.length)) : '–']; }
    if (g.k === 'eu') { const e = s.eu; const ok = !!e && e.stage >= 5 && !(e.out && (e.outAt === 'league' || e.outAt >= 8)); return [!!ok, e ? (e.out ? 'Elendik' : e.stage < 4 ? 'Lig aşaması' : CM_EU_STAGE[Math.min(e.stage, 6)]) : '–']; }
    return [false, ''];
  };
  Coach.vGoals = () => {
    const s = Coach.s;
    if (!s.bg || !s.bg.length || s.jobless) return '';
    return `<section class="card bgc"><div class="card-h"><span>${Icon('shield')} Yönetimin sezon hedefleri</span><small class="muted">Başarırsan bütçe ödülü</small></div>
      ${s.bg.map((g) => { const [ok, prog] = Coach.goalState(g); return `<div class="bg-row ${ok ? 'ok' : ''}"><i data-emo>${ok ? '✅' : '🎯'}</i><span>${Coach.goalText(g)}</span><b>${prog}</b></div>`; }).join('')}</section>`;
  };
  const vh3 = Coach.vHome;
  Coach.vHome = () => {
    const h = vh3(), g = Coach.vGoals();
    if (!g) return h;
    const k = h.indexOf('<section class="card cp');
    if (k < 0) return h + g;
    const j = h.indexOf('</section>', k);
    return h.slice(0, j + 10) + g + h.slice(j + 10);
  };
  const se2 = Coach.seasonEnd;
  Coach.seasonEnd = (...a) => {
    const s = Coach.s;
    const out = [];
    try {
      // gençlere süre
      const yn = s.squad.filter((p) => p.age <= 21 && p.apps >= 12).length;
      if (yn >= 2) { s.fans = U.clamp(s.fans + Math.min(8, yn * 2), 0, 100); s.conf = U.clamp(s.conf + 2, 0, 100); Coach.news(`🌱 ${yn} gence forma şansı verdin. Taraftar ve yönetim bu cesareti takdir ediyor.`, 'good'); }
      (s.bg || []).forEach((g) => {
        const [ok] = Coach.goalState(g);
        if (ok) {
          const bonus = Math.round(Coach.value(Coach.my().rating, 26) * 0.18 * fame() / 1e5) * 1e5;
          s.budget += bonus; s.money += bonus; s.conf = U.clamp(s.conf + 5, 0, 100);
          out.push(`✅ ${Coach.goalText(g)} · +${U.money(bonus)}`);
        } else { s.conf = U.clamp(s.conf - 3, 0, 100); out.push(`❌ ${Coach.goalText(g)}`); }
      });
      out.forEach((t) => Coach.news(`🎯 Hedef: ${t}`, t.startsWith('✅') ? 'good' : 'bad'));
    } catch (e) { /* yok */ }
    const r = se2(...a);
    try { if (s.lastSeason) s.lastSeason.bg = out; Coach.save(); } catch (e) { /* yok */ }
    return r;
  };
  const sse2 = Coach.showSeasonEnd;
  Coach.showSeasonEnd = () => {
    const r = sse2();
    try {
      const x = Coach.s.lastSeason, m = document.getElementById('modal');
      if (x && x.bg && x.bg.length && !m.classList.contains('hidden') && !m.querySelector('.bg-end') && m.querySelector('.cer-pos')) {
        const d = document.createElement('div'); d.className = 'bg-end';
        d.innerHTML = `<div class="lbl">Yönetimin hedefleri</div>${x.bg.map((t) => `<p>${U.esc(t)}</p>`).join('')}`;
        const p = m.querySelector('.cm-aw') || m.querySelector('.cer-pos'); p.after(d); UI.strip(d);
      }
    } catch (e) { /* yok */ }
    return r;
  };

  // ---------- yönetimle bütçe görüşmesi ----------
  Coach.budCap = () => {
    const s = Coach.s;
    return {
      tr: Math.max(0, Math.round(Math.max(0, s.money) * 0.8 / 1e5) * 1e5), // transfer bütçesi kasanın %80'ini geçemez
      wg: Math.round((Coach.sponsorWeekly() + Coach.ticketIncome() / 2) * 1.15 / 1000) * 1000, // maaş bütçesi gelirleri çok aşamaz
    };
  };
  Coach.budChance = (kind, k) => {
    const s = Coach.s;
    const form = (s.cf[s.clubId] || '').slice(-5), w = (form.match(/G/g) || []).length, l = (form.match(/M/g) || []).length;
    return U.clamp(0.2 + (s.conf - 50) / 55 + (w - l) * 0.04 - (k - 1) * (kind === 'wg' ? 1.6 : 0.9) + (s.money > 0 ? 0.05 : -0.2), 0.03, 0.95);
  };
  Coach.budgetTalk = (kind) => {
    const s = Coach.s;
    s.budReq = s.budReq || {};
    const wait = 6 - (s.round - (s.budReq[kind] == null ? -99 : s.budReq[kind]));
    if (s.budReq[kind] != null && s.budReq[kind] <= s.round && wait > 0 && s.budReq.y === s.year) return Game.toast(`Yönetim bu konuyu ${wait} hafta sonra yeniden konuşmak istiyor.`, 'bad');
    const cap = Coach.budCap();
    const cur = kind === 'tr' ? s.budget : s.wbudget;
    const base = kind === 'tr' ? Math.max(cur, Math.round(Math.max(0, s.money) * 0.15 / 1e5) * 1e5) : cur;
    const opts = (kind === 'tr' ? [1.15, 1.35, 1.6] : [1.05, 1.12, 1.2]).map((k) => {
      const want = Math.round(base * k / (kind === 'tr' ? 1e5 : 1000)) * (kind === 'tr' ? 1e5 : 1000);
      return { k, want, over: want > (kind === 'tr' ? cap.tr : cap.wg) };
    });
    const title = kind === 'tr' ? 'Transfer bütçesi' : 'Maaş bütçesi';
    const md = Game.modal(`<div class="ev-tag">Yönetimle görüşme</div><h3>${title} artışı iste</h3>
      <p class="muted">Şu an: ${U.money(cur)}${kind === 'wg' ? '/hf' : ''} · Yönetimin güveni ${Math.round(s.conf)} · Kasa ${U.money(s.money)}</p>
      <p class="muted">${kind === 'tr' ? `Yönetim kasanın %80'inden (${U.money(cap.tr)}) fazlasını transfere ayırmaz.` : `Yönetim maaş bütçesini gelirlerin çok üstüne (${U.money(cap.wg)}/hf) çıkarmaz.`}</p>
      <div class="cm-offers">${opts.map((o, i) => `<button class="cm-offer" data-bq="${i}"><span><b>${U.money(o.want)}${kind === 'wg' ? '/hf' : ''}</b><small>${o.over ? 'Sınırın üstünde: yönetim kabul etmez' : `Kabul olasılığı %${Math.round(Coach.budChance(kind, o.k) * 100)}`}</small></span>${Icon('chevron')}</button>`).join('')}</div>
      ${kind === 'wg' && s.budget >= 1e5 ? `<button class="btn btn-ghost bud-mv" id="bud-mv">Transfer bütçesinden ${U.money(Math.round(s.budget * 0.2 / 1e5) * 1e5)} maaşa aktar</button>` : ''}`, [{ t: 'Vazgeç', cls: 'btn-ghost' }], { wide: true });
    const done = (msg, type) => { md.classList.add('hidden'); md.innerHTML = ''; s.budReq[kind] = s.round; s.budReq.y = s.year; Coach.save(); Coach.render(); Game.modal(`<div class="ev-tag">Yönetimle görüşme</div><h3>${msg}</h3>`, [{ t: 'Tamam', cls: type === 'good' ? 'btn-big' : 'btn-ghost' }]); };
    U.$$('[data-bq]', md).forEach((b) => (b.onclick = () => {
      const o = opts[+b.dataset.bq];
      if (o.over) return done('Başkan: "Kasada bu kadar para yok. Kulübü batıramayız."', 'bad');
      if (U.chance(Coach.budChance(kind, o.k))) {
        if (kind === 'tr') s.budget = o.want; else s.wbudget = o.want;
        s.conf = U.clamp(s.conf - 1, 0, 100);
        Coach.news(`🤝 Yönetim ${title.toLowerCase()} artışını onayladı: ${U.money(o.want)}${kind === 'wg' ? '/hf' : ''}.`, 'good');
        return done(`Başkan: "Tamam, sana güveniyoruz. Ama sonuç bekliyoruz." ${title}: ${U.money(o.want)}${kind === 'wg' ? '/hf' : ''}`, 'good');
      }
      if (s.conf >= 45 && U.chance(0.5)) {
        const half = Math.round((cur + (o.want - cur) / 2) / (kind === 'tr' ? 1e5 : 1000)) * (kind === 'tr' ? 1e5 : 1000);
        if (kind === 'tr') s.budget = Math.max(s.budget, half); else s.wbudget = Math.max(s.wbudget, half);
        Coach.news(`🤝 Yönetim ${title.toLowerCase()} için orta yolu buldu: ${U.money(half)}${kind === 'wg' ? '/hf' : ''}.`, '');
        return done(`Başkan: "İstediğinin hepsini veremem ama yarı yolda buluşalım." ${title}: ${U.money(half)}${kind === 'wg' ? '/hf' : ''}`, 'good');
      }
      if (s.conf < 40) s.conf = U.clamp(s.conf - 2, 0, 100);
      return done(s.conf < 40 ? 'Başkan: "Önce sonuç, sonra para."' : 'Başkan: "Şu an bütçeyi artıramayız, mevcut kadroyla devam."', 'bad');
    }));
    const mv = md.querySelector('#bud-mv');
    if (mv) mv.onclick = () => {
      const amt = Math.round(s.budget * 0.2 / 1e5) * 1e5, wk = Math.round(amt / 40 / 1000) * 1000;
      if (s.wbudget + wk > cap.wg * 1.05) return done('Başkan: "Maaşlar zaten gelirlerimizi zorluyor. Bu aktarımı yapamayız."', 'bad');
      s.budget -= amt; s.wbudget += wk;
      Coach.news(`🔁 Transfer bütçesinden ${U.money(amt)} maaş bütçesine aktarıldı (+${U.money(wk)}/hf).`, '');
      done(`Aktarım onaylandı: maaş bütçesi +${U.money(wk)}/hf`, 'good');
    };
  };
  const vf = Coach.vFinance;
  Coach.vFinance = () => `<section class="card bud"><div class="card-h"><span>${Icon('contract')} Yönetimle bütçe görüşmesi</span></div>
      <p class="muted">Yönetimle aran iyiyse ve kasa elveriyorsa bütçe artışına "tamam" diyebilir.</p>
      <div class="bud-btns"><button class="btn btn-ghost" data-bud="tr">Transfer bütçesi iste</button><button class="btn btn-ghost" data-bud="wg">Maaş bütçesi iste</button></div></section>${vf()}`;
})();
