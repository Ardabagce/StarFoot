// Detaylı kariyer istatistikleri (Premium+ ile görüntülenir; kayıt herkes için tutulur)
// p.cs = { since, m, w, d, l, min, sh, kp, tk, y, r, hat, brace, home: [m,g], away: [m,g],
//          gm: [6 dakika dilimi], vs: { id: [n, m, g, a, w, d, l] }, comp: { key: [ad, m, g, a] } }
const CStats = {
  GT: [['header', 'Kafa'], ['penalty', 'Penaltı'], ['freekick', 'Serbest vuruş'], ['close', 'Kaleciyle karşı karşıya'], ['open', 'Açık oyundan şut'], ['dribble', 'Çalım sonrası'], ['sprint', 'Kontra atak'], ['onetwo', 'Verkaç'], ['deep', 'Uzaktan']],
  BUCKETS: ['1-15', '16-30', '31-45', '46-60', '61-75', '76-90+'],
  ensure(p) {
    const s = Game.state;
    return (p.cs = p.cs || { since: s ? s.season.year : 0, m: 0, w: 0, d: 0, l: 0, min: 0, sh: 0, kp: 0, tk: 0, y: 0, r: 0, hat: 0, brace: 0, home: [0, 0], away: [0, 0], gm: [0, 0, 0, 0, 0, 0], vs: {}, comp: {} });
  },
  record(p, sum, ctx, comp) {
    try {
      const c = CStats.ensure(p);
      const g = sum.goals || 0, a = sum.assists || 0;
      c.m++; c[{ W: 'w', D: 'd', L: 'l' }[sum.res] || 'd']++;
      c.min += sum.minutes || 0; c.sh += sum.shots || 0; c.kp += sum.keyPasses || 0; c.tk += sum.tackles || 0;
      c.y += sum.yellow ? 1 : 0; c.r += sum.red ? 1 : 0;
      if (g >= 3) c.hat++; else if (g === 2) c.brace++;
      if (p.position === 'GK') {
        c.sv = (c.sv || 0) + (sum.saves || 0); c.ps = (c.ps || 0) + (sum.penSaves || 0); c.gc = (c.gc || 0) + (sum.ga || 0);
        if (!sum.ga && (sum.minutes || 0) >= 60) c.cs = (c.cs || 0) + 1;
      }
      const hs = ctx.side === 'home' ? c.home : c.away; hs[0]++; hs[1] += g;
      (sum.goalMins || []).forEach((mn) => { c.gm[Math.min(5, Math.floor((Math.max(1, mn) - 1) / 15))]++; });
      const opp = ctx.side === 'home' ? ctx.away : ctx.home;
      if (opp) {
        const id = String(opp.id || opp.code || opp.name);
        const v = (c.vs[id] = c.vs[id] || [opp.name || id, 0, 0, 0, 0, 0, 0]);
        v[0] = opp.name || v[0]; v[1]++; v[2] += g; v[3] += a;
        v[{ W: 4, D: 5, L: 6 }[sum.res] || 5]++;
      }
      const label = String(ctx.compName || '').split(/ [·•] /)[0] || comp;
      const key = comp === 'league' ? 'lg:' + (ctx.lg || '') : comp === 'intl' ? 'intl:' + (ctx.intlCat || ctx.lg || 'A') : 'cup:' + label;
      const cp = (c.comp[key] = c.comp[key] || [label, 0, 0, 0]);
      cp[0] = comp === 'league' ? (Game.leagueName ? Game.leagueName() : label) : label; cp[1]++; cp[2] += g; cp[3] += a;
    } catch (e) { /* istatistik oyunu bozmasın */ }
  },
  // rakip adı: kulüpse editördeki güncel adıyla
  oppName(id, v) {
    const s = Game.state;
    return s && s.world && s.world.clubs[id] ? Game.teamName(id) : v[0];
  },
  bar(v, max, cls) { return `<i class="cs-bar ${cls || ''}"><i style="width:${max ? Math.round((v / max) * 100) : 0}%"></i></i>`; },
  html() {
    const p = Game.p, t = p.totals, c = CStats.ensure(p), gt = p.gt || {};
    const f2 = (x) => (Number.isFinite(x) ? x.toFixed(2) : '-');
    const typed = CStats.GT.reduce((n, [k]) => n + (gt[k] || 0), 0);
    const types = CStats.GT.map(([k, l]) => [l, gt[k] || 0]).concat([['Diğer', Math.max(0, t.goals - typed)]]).filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1]);
    const tmax = Math.max(1, ...types.map((x) => x[1]));
    const gmax = Math.max(1, ...c.gm);
    const vs = Object.entries(c.vs).map(([id, v]) => ({ id, n: CStats.oppName(id, v), m: v[1], g: v[2], a: v[3], w: v[4], d: v[5], l: v[6] }));
    const fav = vs.filter((x) => x.g > 0).sort((a, b) => b.g - a.g || a.m - b.m)[0];
    const bogey = vs.filter((x) => x.l > 0).sort((a, b) => b.l - a.l || a.w - b.w)[0];
    const top = vs.slice().sort((a, b) => b.g - a.g || b.a - a.a || b.m - a.m).slice(0, 12);
    const comps = Object.values(c.comp).sort((a, b) => b[1] - a[1]);
    const box = (l, v) => `<div><span>${l}</span><b>${v}</b></div>`;
    const best = (p.history || []).filter((h) => h.apps).slice().sort((a, b) => b.goals - a.goals)[0];
    return `<div class="cstats">
      <h2>${Icon('table')} Kariyer İstatistikleri</h2>
      <div class="ms-grid big">
        ${box('Maç', t.apps)}${box('Gol', t.goals)}${box('Asist', t.assists)}
        ${box('Maç başına gol', f2(t.goals / Math.max(1, t.apps)))}${box('Gol + asist / maç', f2((t.goals + t.assists) / Math.max(1, t.apps)))}${box('Maçın adamı', t.motm)}
        ${box('Hat-trick', c.hat)}${box('Maçta 2 gol', c.brace)}${box('En çok gol (maç)', (p.best && p.best.g) || 0)}
        ${box('En uzun gol serisi', ((p.best && p.best.streak) || 0) + ' maç')}${best ? box('En golcü sezon', `${best.year} · ${best.goals}`) : ''}${box('Galibiyet / B / M', `${c.w} / ${c.d} / ${c.l}`)}
      </div>
      ${p.position === 'GK' ? `<div class="cs-sec"><h3>Kalecilik</h3><div class="ms-grid">
        ${box('Gol yemeden biten maç', c.cs || 0)}${box('Kurtarış', c.sv || 0)}${box('Penaltı kurtarışı', c.ps || 0)}${box('Yenen gol', c.gc || 0)}
        ${box('Maç başına yenen', f2((c.gc || 0) / Math.max(1, c.m)))}${box('Gol yememe oranı', c.m ? Math.round(((c.cs || 0) / c.m) * 100) + '%' : '-')}
      </div></div>` : ''}
      <div class="cs-sec"><h3>Gol türleri</h3>${types.length ? types.map(([l, v]) => `<div class="cs-row"><span>${l}</span>${CStats.bar(v, tmax)}<b>${v}</b></div>`).join('') : '<p class="muted">Henüz gol yok.</p>'}</div>
      <div class="cs-sec"><h3>Gol dakikaları</h3><div class="cs-min">${CStats.BUCKETS.map((l, i) => `<div><i style="height:${Math.round((c.gm[i] / gmax) * 100)}%"></i><b>${c.gm[i]}</b><span>${l}</span></div>`).join('')}</div></div>
      ${fav || bogey ? `<div class="cs-pair">${fav ? `<div class="cs-hl good"><small>En sevdiğin rakip</small><b>${U.esc(fav.n)}</b><span>${fav.m} maçta ${fav.g} gol</span></div>` : ''}${bogey ? `<div class="cs-hl bad"><small>Kâbusun</small><b>${U.esc(bogey.n)}</b><span>${bogey.m} maçta ${bogey.l} yenilgi</span></div>` : ''}</div>` : ''}
      <div class="cs-sec"><h3>Rakiplere göre</h3>${top.length ? `<table class="cs-t"><tr><th>Rakip</th><th>M</th><th>G</th><th>A</th><th>G-B-M</th></tr>${top.map((x) => `<tr><td>${U.esc(x.n)}</td><td>${x.m}</td><td>${x.g}</td><td>${x.a}</td><td>${x.w}-${x.d}-${x.l}</td></tr>`).join('')}</table>` : '<p class="muted">Maç oynadıkça dolacak.</p>'}</div>
      <div class="cs-sec"><h3>Turnuvalara göre</h3>${comps.length ? `<table class="cs-t"><tr><th>Turnuva</th><th>M</th><th>G</th><th>A</th></tr>${comps.map((x) => `<tr><td>${U.esc(x[0])}</td><td>${x[1]}</td><td>${x[2]}</td><td>${x[3]}</td></tr>`).join('')}</table>` : '<p class="muted">Maç oynadıkça dolacak.</p>'}</div>
      <div class="cs-sec"><h3>Ayrıntılar</h3><div class="ms-grid">
        ${box('İç saha', `${c.home[0]} maç · ${c.home[1]} gol`)}${box('Deplasman', `${c.away[0]} maç · ${c.away[1]} gol`)}
        ${box('Dakika', c.min)}${box('Dakika başına gol', c.min && t.goals ? Math.round(c.min / Math.max(1, t.goals)) + ' dk' : '-')}
        ${box('Şut', c.sh)}${box('Kilit pas', c.kp)}${box('Top kapma', c.tk)}${box('Sarı / kırmızı kart', `${c.y} / ${c.r}`)}
      </div></div>
      ${c.since ? `<p class="muted cs-note">Rakip, turnuva ve dakika istatistikleri ${c.since} sezonundan itibaren tutuluyor.</p>` : ''}
    </div>`;
  },
  open() {
    if (typeof Plus !== 'undefined' && !Plus.has()) return Plus.pitch('Detaylı kariyer istatistikleri', 'stats', 'Kafa, penaltı ve frikik golleri, hangi takıma kaç gol attığın, gol dakikaların ve daha fazlası. İstatistiklerin şimdiden kaydediliyor; Premium+ ile hepsini aç.');
    Game.modal(CStats.html(), [{ t: 'Kapat' }], { wide: true });
  },
  // Kariyer sekmesindeki giriş kartı
  card() {
    if (typeof Plus === 'undefined' || !Plus.on()) return '';
    const p = Game.p, gt = p.gt || {};
    const lock = !Plus.has();
    return `<button class="card cs-card ${lock ? 'locked' : ''}" data-cstats>
      <span class="cs-ic">${Icon('table')}</span><span class="cs-t2"><b>Detaylı İstatistikler</b><small>${(gt.header || 0)} kafa · ${(gt.penalty || 0)} penaltı · ${(gt.freekick || 0)} frikik golü ve daha fazlası</small></span>
      ${lock ? '<i class="cs-lk">Premium+</i>' : Icon('chevron')}
    </button>`;
  },
};
document.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('[data-cstats]') && Game.state) CStats.open(); });
