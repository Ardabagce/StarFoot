// Teknik Direktör 1.0.20: yaşayan dünya. Bütün ligler her hafta oynanır (puan durumu, form, kimya,
// sezon sonu küme düşme / çıkma); rakipler maça kendi kondisyon ve kimyasıyla girer, maç içinde yorulur
// ve değişiklik yapar; iş tekliflerinde kulüp incelenebilir.

(() => {
  // ---------- kulüp kimyası (her takımın) ----------
  Coach.cChem = (id) => {
    const s = Coach.s;
    const h0 = () => { let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 997; return 50 + (h % 21); };
    if (!s) return h0();
    if (id === s.clubId) return s.chem;
    const c = (s.cl[id] = s.cl[id] || {});
    if (c.chem == null) { let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 997; c.chem = 50 + (h % 21); }
    return c.chem;
  };
  Coach.cChemRes = (id, r) => {
    const s = Coach.s;
    if (id === s.clubId) return;
    const v = Coach.cChem(id);
    s.cl[id].chem = Math.round(U.clamp(v + (r === 'G' ? 2.5 : r === 'M' ? -2.5 : 0.5) + (62 - v) * 0.06, 25, 95) * 10) / 10;
  };
  // simülasyonlarda kullanılan güç: kimya ±2
  Coach.simR = (id) => Coach.rating(id) + (Coach.cChem(id) - 55) / 12;

  // kendi ligimizdeki diğer maçlar: kimya dahil
  Coach.simRound = (r, all) => {
    const s = Coach.s;
    (s.lg.fixtures[r] || []).forEach(([h, a]) => {
      if (!all && (h === s.clubId || a === s.clubId)) return;
      const [hs, as] = World.simScore(Coach.simR(h), Coach.simR(a));
      World.record(s.lg, h, a, hs, as);
      const rh = hs > as ? 'G' : hs < as ? 'M' : 'B', ra = as > hs ? 'G' : as < hs ? 'M' : 'B';
      Coach.form(h, rh); Coach.form(a, ra); Coach.cChemRes(h, rh); Coach.cChemRes(a, ra);
    });
  };

  // ---------- diğer ligler ----------
  // her lig için yalnız puan tablosu tutulur; her hafta herkes rastgele bir rakiple oynar (sezon boyunca 2×(n-1) maç)
  Coach.worldSetup = () => {
    const s = Coach.s;
    s.wl = {};
    LEAGUES.forEach((L) => {
      if (L.id === s.lg.id) return;
      const ids = Coach.leagueClubs(L.id).filter((id) => id !== s.clubId);
      if (ids.length < 4) return;
      const t = {}; ids.forEach((id) => (t[id] = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }));
      s.wl[L.id] = { t, done: 0, F: (ids.length - 1) * 2 };
    });
    s.wlY = s.year;
  };
  Coach.worldTick = () => {
    const s = Coach.s;
    if (!s.wl || s.wlY !== s.year) Coach.worldSetup();
    const N = Coach.rounds();
    Object.values(s.wl).forEach((W) => {
      const target = Math.min(W.F, Math.floor((s.round / N) * W.F));
      while (W.done < target) {
        const ids = U.shuffle(Object.keys(W.t));
        for (let i = 0; i + 1 < ids.length; i += 2) {
          const [h, a] = [ids[i], ids[i + 1]];
          const [hs, as] = World.simScore(Coach.simR(h) + 1, Coach.simR(a));
          const rec = (x, f, g) => { x.p++; x.gf += f; x.ga += g; if (f > g) { x.w++; x.pts += 3; } else if (f === g) { x.d++; x.pts++; } else x.l++; };
          rec(W.t[h], hs, as); rec(W.t[a], as, hs);
          const rh = hs > as ? 'G' : hs < as ? 'M' : 'B', ra = as > hs ? 'G' : as < hs ? 'M' : 'B';
          Coach.form(h, rh); Coach.form(a, ra); Coach.cChemRes(h, rh); Coach.cChemRes(a, ra);
        }
        W.done++;
      }
    });
  };
  Coach.worldTable = (lg) => {
    const s = Coach.s;
    if (!s) return [];
    if (s.lg && lg === s.lg.id) return Coach.table();
    if (!s.wl || !s.wl[lg]) return [];
    return Object.entries(s.wl[lg].t).map(([id, r]) => Object.assign({ id }, r)).sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);
  };
  const sl0 = Coach.setupLeague;
  Coach.setupLeague = (lg, upto) => { sl0(lg, upto); try { Coach.worldSetup(); Coach.worldTick(); } catch (e) { /* yok */ } };
  const wk6 = Coach.week;
  Coach.week = () => { wk6(); try { if (Coach.s && Coach.s.lg) Coach.worldTick(); } catch (e) { /* yok */ } };
  // sezon sonu: diğer ülkelerde de küme düşme / çıkma (bizim ligin olduğu ülke zaten işleniyor)
  const se6 = Coach.seasonEnd;
  Coach.seasonEnd = (...a) => {
    const s = Coach.s, myC = Coach.lgInfo(s.lg.id).country;
    try { Coach.worldTick(); } catch (e) { /* yok */ }
    const r = se6(...a);
    try {
      Object.entries(LEAGUE_DOWN).forEach(([up, down]) => {
        if (Coach.lgInfo(up).country === myC) return;
        const tu = Coach.worldTable(up), td = Coach.worldTable(down);
        if (tu.length < 8 || td.length < 6) return;
        tu.slice(-3).forEach((x) => Coach.setClub(x.id, 'league', down));
        td.slice(0, 3).forEach((x) => Coach.setClub(x.id, 'league', up));
      });
      // şampiyonlar haberi
      ['ENG', 'ESP', 'GER', 'ITA', 'FRA'].filter((lg) => lg !== s.lg.id).forEach((lg) => { const t = Coach.worldTable(lg); if (t[0]) Coach.news(`🌍 ${Coach.lgName(lg)} şampiyonu: ${Coach.club(t[0].id).name}.`, ''); });
      Coach.save();
    } catch (e) { /* yok */ }
    return r;
  };

  // ---------- lig sekmesi: lig seçici ----------
  Coach.viewLg = null;
  const vl0 = Coach.vLeague;
  Coach.vLeague = () => {
    const s = Coach.s;
    if (!s.wl || s.wlY !== s.year) { try { Coach.worldTick(); } catch (e) { /* yok */ } }
    const cur = Coach.viewLg && Coach.viewLg !== s.lg.id && s.wl && s.wl[Coach.viewLg] ? Coach.viewLg : s.lg.id;
    const sel = `<div class="wl-sel"><select id="cm-lgsel">${LEAGUES.filter((L) => L.id === s.lg.id || (s.wl && s.wl[L.id])).map((L) => `<option value="${L.id}" ${L.id === cur ? 'selected' : ''}>${L.flag} ${U.esc(L.name)}${L.id === s.lg.id ? ' ★' : ''}</option>`).join('')}</select></div>`;
    if (cur === s.lg.id) return sel + vl0();
    const t = Coach.worldTable(cur), n = t.length;
    const L = Coach.lgInfo(cur), down = LEAGUE_DOWN[cur], up = LEAGUE_UP[cur];
    const rows = t.map((r, i) => { const c = Coach.club(r.id); const eu = typeof Cups !== 'undefined' && L.level === 1 ? Cups.qualifies(cur, i + 1) : null;
      return `<tr class="${down && i >= n - 3 ? 'rel' : ''} ${up && i < 3 ? 'up' : ''} ${eu ? 'eu' : ''}" data-ci="${r.id}"><td>${i + 1}</td><td class="tn">${UI.shirt(c)}${U.esc(c.name)}</td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf - r.ga}</td><td><b>${r.pts}</b></td></tr>`; }).join('');
    return `${sel}<section class="card"><div class="card-h"><span>${Icon('table')} ${U.esc(L.name)}</span><small class="muted">${U.esc(L.country)}</small></div>
      <div class="tbl-wrap"><table class="tbl cm-tbl wl-tbl"><tr><th>#</th><th>Takım</th><th>O</th><th>G</th><th>B</th><th>M</th><th>Av</th><th>P</th></tr>${rows}</table></div>
      <p class="muted wl-hint">Kulübü incelemek için satıra dokun.</p></section>`;
  };
  const bind6 = Coach.bind;
  Coach.bind = (el) => {
    bind6(el);
    const sel = el.querySelector('#cm-lgsel');
    if (sel) sel.onchange = () => { Coach.viewLg = sel.value; Coach.render(); };
    U.$$('[data-ci]', el).forEach((r) => (r.onclick = () => Coach.clubInfo(r.dataset.ci)));
    Coach.addInspect(el);
  };

  // ---------- kulüp inceleme (iş teklifleri ve tablolar) ----------
  Coach.clubInfo = (id, back) => {
    const s = Coach.s || { rep: (Coach.pending && Coach.pending.rep) || 30 }, c = Coach.club(id) || Coach.base(id), lg = c.league, L = Coach.lgInfo(lg);
    const t = Coach.worldTable(lg), pos = t.findIndex((r) => r.id === id) + 1, row = t.find((r) => r.id === id);
    const byR = Coach.leagueClubs(lg).sort((a, b) => Coach.club(b).rating - Coach.club(a).rating), rank = byR.indexOf(id) + 1, n = byR.length || 1;
    const tgt = U.clamp(rank + (rank <= 2 ? 0 : 1), 1, Math.max(1, n - 3));
    const budget = Math.round(Coach.value(c.rating + 3, 26) * (2.2 + s.rep / 60) * 0.45 / 1e5) * 1e5;
    const cap = Math.round((6000 + (c.rating - 45) * 1300) / 100) * 100;
    const ch = Coach.cChem(id);
    const eu = typeof Cups !== 'undefined' && pos ? Cups.qualifies(lg, pos) : null;
    Game.modal(`<div class="ev-tag">Kulüp incelemesi</div><div class="ci-h">${UI.shirt(c, 'big')}<span><b>${U.esc(c.name)}</b><small>${L.flag || ''} ${U.esc(Coach.lgName(lg))}</small></span></div>
      <div class="cm-kv four"><div><span>Sıra</span><b>${pos ? `${pos}./${t.length}` : '–'}</b></div><div><span>Puan</span><b>${row ? row.pts : '–'}</b></div><div><span>Güç</span><b>${c.rating}</b></div><div><span>Kimya</span><b>${Math.round(ch)}</b></div></div>
      ${Coach.s ? `<div class="lbl">Son maçlar</div><p>${Coach.formDots(id)}</p>` : ''}
      <div class="cm-sr"><span>Kadro gücü sıralaması</span><b>${rank}./${n}</b></div>
      <div class="cm-sr"><span>Yönetimin beklentisi</span><b>${tgt <= 1 ? 'Şampiyonluk' : tgt <= 4 ? 'İlk 4' : tgt <= Math.ceil(n / 2) ? 'İlk yarı' : tgt <= n - 4 ? 'Orta sıralar' : 'Ligde kalmak'}</b></div>
      <div class="cm-sr"><span>Tahmini transfer bütçesi</span><b>${U.money(budget)}</b></div>
      <div class="cm-sr"><span>Stadyum</span><b>${cap.toLocaleString('tr')} kişi</b></div>
      ${eu ? `<div class="cm-sr"><span>Şu anki sırayla Avrupa</span><b>${U.esc(eu.name)}</b></div>` : ''}
      ${Coach.palOf && Coach.palOf(id) ? `<p class="muted">Hocası eski takım arkadaşın ${U.esc(Coach.palOf(id))}.</p>` : ''}`, back ? [{ t: 'Tekliflere dön', cls: 'btn-big', fn: () => setTimeout(back, 80) }] : [{ t: 'Kapat', cls: 'btn-ghost' }], { wide: true });
  };
  // teklif listelerine "İncele" düğmesi; incelemeden sonra "Tekliflere dön" ile listeye dönülür
  let lastOffer = null;
  Coach.addInspect = (root) => {
    if (!root) return;
    U.$$('.cm-offer[data-club], .cm-offer[data-job]', root).forEach((b) => {
      if (b.parentNode.classList.contains('ci-w')) return;
      const id = b.dataset.club || b.dataset.job;
      const w = document.createElement('div'); w.className = 'ci-w';
      b.parentNode.insertBefore(w, b); w.appendChild(b);
      const i = document.createElement('button'); i.className = 'ci-b'; i.type = 'button'; i.textContent = 'İncele';
      const inModal = !!b.closest('#modal');
      i.onclick = (e) => { e.stopPropagation(); Coach.clubInfo(id, inModal ? lastOffer : null); };
      w.appendChild(i);
    });
  };
  const op0 = Coach.offerPicker;
  Coach.offerPicker = (ids, tag, txt, fn, noClose) => { lastOffer = () => Coach.offerPicker(ids, tag, txt, fn, noClose); op0(ids, tag, txt, fn, noClose); Coach.addInspect(document.getElementById('modal')); };
  const sse6 = Coach.showSeasonEnd;
  Coach.showSeasonEnd = () => {
    const r = sse6();
    const m = document.getElementById('modal');
    if (m && !m.classList.contains('hidden') && m.querySelector('.cer-pos')) {
      lastOffer = () => { Coach._seShown = null; Coach.showSeasonEnd(); };
      Coach.addInspect(m);
    }
    return r;
  };

  // ---------- canlı maç: rakibin kondisyonu, değişiklikleri ve kimyası ----------
  const fitK = (f) => Coach.fitK(f);
  Live.oppNow = () => {
    const L = Live.m;
    if (L.oFit == null) { L.oFit = U.clamp(Math.round(U.rand(84, 99)), 0, 100); L.oChem = Coach.cChem(L.match.opp); L.oSubs = 5; L.oLast = 0; }
    const k = fitK(L.oFit), ch = (L.oChem - 50) / 25;
    return { att: L.opp.att * k + ch, def: L.opp.def * k + ch };
  };
  const tick0 = Live.tick;
  Live.tick = () => {
    const L = Live.m;
    if (L.oFit == null) Live.oppNow();
    const r = tick0();
    const tire = (CM_STYLES[L.opp.style] || CM_STYLES.bal).tire;
    L.oFit = Math.max(20, L.oFit - 0.45 * tire);
    // rakip hoca: 55. dakikadan sonra yorulan oyuncularını değiştirir (5 hak, en fazla 3 durakta)
    if (L.min >= 55 && L.oSubs > 0 && L.oFit < 76 && L.min - L.oLast >= 9) {
      const n = Math.min(L.oSubs, L.oFit < 62 ? 2 : 1);
      L.oSubs -= n; L.oLast = L.min; L.oFit = Math.min(100, L.oFit + n * 3.6); L.opp.att -= n * 0.33; L.opp.def -= n * 0.33;
      if (!L.quick) { const nm = U.esc((L.oc && L.oc.name) || ''); Live.log(n > 1 ? `🔄 ${nm} iki oyuncu değişikliği yaptı.` : `🔄 ${nm} oyuncu değişikliği yaptı.`, 'info'); }
    }
    return r;
  };
  // maç ekranında rakip kondisyonu
  const draw6 = Live.draw;
  Live.draw = () => {
    draw6();
    const L = Live.m, el = document.getElementById('cm-live');
    if (!L || !el) return;
    if (L.oFit == null) Live.oppNow();
    let o = el.querySelector('#lv-oe');
    if (!o) {
      const st = el.querySelector('.cm-lstat');
      if (!st) return;
      const sp = document.createElement('span'); sp.innerHTML = 'Rakip kondisyonu <b id="lv-oe"></b>';
      st.appendChild(sp); UI.strip(sp);
      o = el.querySelector('#lv-oe');
    }
    o.textContent = `${Math.round(L.oFit)}%`;
    o.style.color = L.oFit > 70 ? '#46e08f' : L.oFit > 52 ? '#ffcf3f' : '#ff6b6b';
  };
  // bizim maç sonucuna göre rakibin kimyası da değişir
  const am6 = Coach.afterMatch;
  Coach.afterMatch = (m, res) => {
    const r = am6(m, res);
    try { const win = res.pens ? res.pens.win : res.gf > res.ga, loss = !res.pens && res.gf < res.ga; Coach.cChemRes(m.opp, win ? 'M' : loss ? 'G' : 'B'); } catch (e) { /* yok */ }
    return r;
  };
  // rakip analizinde kimya
  const pm6 = Coach.planModal;
  Coach.planModal = () => {
    pm6();
    const m = Coach.nextMatch(), md = document.getElementById('modal');
    if (!m || !m.opp || !md) return;
    const kv = md.querySelector('.cm-kv');
    if (kv && !md.querySelector('.ci-chem')) {
      const d = document.createElement('p'); d.className = 'muted ci-chem';
      d.textContent = `Takım kimyası: ${Math.round(Coach.cChem(m.opp))} · Bizim kimyamız: ${Math.round(Coach.s.chem)}`;
      kv.after(d); UI.strip(d);
    }
  };
})();
