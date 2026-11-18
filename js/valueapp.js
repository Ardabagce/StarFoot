// StarDeğer telefon uygulaması: piyasa değeri, dünya listesi, kulüp kadro değerleri, söylentiler ve kıyaslamalar.
// Mevcut StarDeğer verisini (Market) kullanır; telefonda siyah-altın, finans uygulaması görünümünde.
(() => {
  if (typeof Phone === 'undefined' || typeof Market === 'undefined' || typeof Game === 'undefined') return;
  const esc = (x) => U.esc(x);
  const money = (n) => U.money(n);
  const TABS = [['val', 'Değerim'], ['top', 'Dünya'], ['club', 'Kulüp'], ['buzz', 'Söylenti'], ['cmp', 'Kıyasla']];
  const full = () => typeof Star === 'undefined' || Star.has();
  const on = () => { try { return !!(Game.state && Game.state.player && !Game.inStreet() && (!Game.isYouth() || Market.now())); } catch (e) { return false; } };
  const shirt = (cid) => { const c = Game.state.world.clubs[cid]; return c ? UI.shirt(c) : ''; };
  // ana kart: değer, değişim, dünya sırası, mevki sırası
  function hero(all) {
    const p = Game.p, d = Market.delta(), me = all.findIndex((x) => x.me), posL = all.filter((x) => x.pos === p.position);
    const pr = posL.findIndex((x) => x.me);
    const mv = p.mv || [];
    let spark = '';
    if (mv.length >= 2) {
      const pts = mv.slice(-40), W = 300, H = 56, max = Math.max(...pts.map((x) => x[2])) || 1, min = Math.min(...pts.map((x) => x[2]));
      const X = (i) => (i / (pts.length - 1)) * W, Y = (v) => H - 4 - ((v - min) / Math.max(1, max - min)) * (H - 10);
      const line = pts.map((x, i) => `${X(i).toFixed(1)},${Y(x[2]).toFixed(1)}`).join(' ');
      spark = `<svg class="sv-spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="svg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8c36a" stop-opacity=".45"/><stop offset="1" stop-color="#e8c36a" stop-opacity="0"/></linearGradient></defs><polygon points="0,${H} ${line} ${W},${H}" fill="url(#svg1)"/><polyline points="${line}" fill="none" stroke="#e8c36a" stroke-width="2.4" stroke-linejoin="round"/></svg>`;
    }
    return `<div class="sv-hero">
      <div class="sv-k"><span>Piyasa değerin</span>${d ? `<em class="${d > 0 ? 'up' : 'dn'}">${d > 0 ? '▲' : '▼'} ${money(Math.abs(d))}</em>` : ''}</div>
      <b class="sv-v">${money(Market.now())}</b>
      ${spark}
      <div class="sv-ranks"><div><small>Dünya</small><b>${me >= 0 ? `#${me + 1}` : '—'}</b></div><div><small>${esc(POS_TR[p.position] || p.position)}</small><b>${pr >= 0 ? `#${pr + 1}` : '—'}</b></div><div><small>Yaş</small><b>${p.age}</b></div></div>
    </div>`;
  }
  const row = (x, i, top) => `<div class="sv-row ${x.me ? 'me' : ''}"><i>${i + 1}</i>${x.cid ? `<span class="sv-sh">${shirt(x.cid)}</span>` : ''}<div class="sv-n"><b>${esc(x.n)}</b><small>${esc(x.club || '')}${x.pos ? ` · ${esc(x.pos)}` : ''}${x.age ? ` · ${x.age}` : ''}</small><span class="sv-bar"><i style="width:${Math.max(3, Math.round(x.v / Math.max(1, top) * 100))}%"></i></span></div><b class="sv-m">${money(x.v)}</b></div>`;
  function body(tab, all) {
    const s = Game.state, p = s.player, c = Game.isYouth() ? null : Game.club();
    if (tab === 'val') {
      const tr = (p.transfers || []).slice().reverse();
      return `<div class="sv-card"><div class="sv-h">Kariyer grafiği</div>${Market.chart(p)}</div>
        <div class="sv-card"><div class="sv-h">Zirveler</div><ul class="sv-peaks">${Market.peaks(p) || '<li class="muted">Henüz yok</li>'}</ul></div>
        <div class="sv-card"><div class="sv-h">Transfer geçmişi</div>${tr.length ? tr.map((x) => `<div class="sv-tr"><em>${x.y}</em><div><b>${esc(x.to)}</b><small>${esc(x.from || '')}</small></div><b>${x.type === 'free' ? 'Serbest' : x.type === 'loan' ? 'Kiralık' : x.type === 'youth' ? 'Altyapı' : money(x.fee || 0)}</b></div>`).join('') : '<p class="muted">Henüz transfer yok.</p>'}</div>
        <button class="sv-btn" data-mv="share" type="button">${Icon('share')} StarFeed'de paylaş</button>`;
    }
    if (tab === 'top') {
      const top = all[0] ? all[0].v : 1, mi = all.findIndex((x) => x.me);
      const rec = (p.transfers || []).filter((x) => x.fee).sort((a, b) => b.fee - a.fee).slice(0, 3);
      return `${mi >= 0 && mi >= 25 ? `<div class="sv-card"><div class="sv-h">Senin yerin</div>${row(all[mi], mi, top)}</div>` : ''}
        <div class="sv-card"><div class="sv-h">Dünyanın en değerlileri</div>${all.slice(0, 25).map((x, i) => row(x, i, top)).join('')}</div>
        ${rec.length ? `<div class="sv-card"><div class="sv-h">Kariyer rekorların</div>${rec.map((x, i) => `<div class="sv-tr"><em>${i + 1}</em><div><b>${esc(x.from || '')} → ${esc(x.to)}</b><small>${x.y}</small></div><b>${money(x.fee)}</b></div>`).join('')}</div>` : ''}`;
    }
    if (tab === 'club') {
      if (!c) return '<p class="muted">Profesyonel sözleşmeyle açılır.</p>';
      const sq = {};
      all.forEach((x) => { if (x.lg === c.league) sq[x.cid] = (sq[x.cid] || 0) + x.v; });
      const ord = Object.entries(sq).sort((a, b) => b[1] - a[1]);
      const pos = ord.findIndex(([id]) => id === s.clubId) + 1, topSq = ord[0] ? ord[0][1] : 1;
      const mine = all.filter((x) => x.cid === s.clubId).slice(0, 11), topM = mine[0] ? mine[0].v : 1;
      return `<div class="sv-duo"><div><small>Kadro değeri</small><b>${money(sq[s.clubId] || 0)}</b></div><div><small>Ligdeki sıra</small><b>${pos}.</b></div></div>
        <div class="sv-card"><div class="sv-h">${esc(c.name)} · en değerliler</div>${mine.map((x, i) => row(x, i, topM)).join('')}</div>
        <div class="sv-card"><div class="sv-h">Ligin en değerli kadroları</div>${ord.slice(0, 6).map(([id, v], i) => row({ n: s.world.clubs[id].name, cid: id, v, me: id === s.clubId }, i, topSq)).join('')}</div>
        <p class="muted sv-note">Sözleşmende ${s.contract.years} yıl kaldı.</p><button class="sv-btn" data-mv="pay" type="button">${Icon('wallet')} Maaş artışı iste</button>`;
    }
    if (tab === 'buzz') {
      const offs = (s.offers || []).filter((o) => o.clubId && s.world.clubs[o.clubId]);
      const big = Object.values(s.world.clubs).filter((x) => x.rating >= (c ? c.rating : 70) && x.id !== s.clubId);
      const seed = s.season.year * 100 + s.season.round, pick = (arr, k) => (arr.length ? arr[(seed * 7 + k * 13) % arr.length] : null);
      const items = offs.map((o) => [o.clubId, `${s.world.clubs[o.clubId].name} senin için ${o.fee ? money(o.fee) : 'bonservissiz'} teklifini masaya koydu.`, 'Resmi teklif']);
      if (Market.delta() > 0) items.push([null, `Son haftalardaki formun değerini ${money(Market.delta())} artırdı. Gözlemciler tribünde not alıyor.`, 'Form']);
      const b1 = pick(big, 1), b2 = pick(big, 2);
      if (b1) items.push([b1.id, `${b1.name} gelecek dönem için seni listesine yazdı.`, 'Kulis']);
      if (b2 && b2 !== b1 && p.fame >= 30) items.push([b2.id, `${b2.name} başkanının seni sorduğu konuşuluyor. Kulüpten yalanlama gelmedi.`, 'Kulis']);
      const t1 = all.find((x) => !x.me);
      if (t1) items.push([t1.cid, `${t1.n} dünyanın en değerli oyuncusu: ${money(t1.v)}. ${t1.club} satmaya niyetli değil.`, 'Dünya']);
      return `${items.map(([cid, t, k]) => `<div class="sv-news">${cid ? `<span class="sv-sh">${shirt(cid)}</span>` : '<span class="sv-dot"></span>'}<div><small>${k}</small><p>${esc(t)}</p></div></div>`).join('')}<p class="muted sv-note">Söylentiler oyun içi kurgudur.</p>`;
    }
    // kıyasla
    const same = all.filter((x) => x.age === p.age && !x.me).slice(0, 5);
    const L = (s.world.legends || []).filter((x) => x.peak).map((x) => ({ n: x.n, v: Market.npc(legendRating(x.peak, p.age), p.age, true) })).sort((a, b) => b.v - a.v).slice(0, 5);
    const me = { n: Player.fullName(p), club: c ? c.name : '', cid: s.clubId, v: Market.now(), me: true }, topA = Math.max(me.v, same[0] ? same[0].v : 1);
    return `<div class="sv-card"><div class="sv-h">${p.age} yaşındaki en değerliler</div>${[me].concat(same).sort((a, b) => b.v - a.v).map((x, i) => row(x, i, topA)).join('')}</div>
      <div class="sv-card"><div class="sv-h">Efsaneler ${p.age} yaşındayken</div>${L.length ? L.map((x, i) => row(Object.assign({ club: 'Efsane' }, x), i, Math.max(L[0].v, me.v))).join('') : '<p class="muted">Yok</p>'}</div>`;
  }
  function view() {
    const tab = TABS.some(([k]) => k === Phone.sub) ? Phone.sub : 'val';
    const all = Market.everyone();
    const nav = `<div class="sv-tabs">${TABS.map(([k, l]) => `<button type="button" class="${k === tab ? 'on' : ''}" data-sv="${k}">${l}</button>`).join('')}</div>`;
    const lock = !full() ? `<div class="sv-lock"><b>${Icon('star')} StarDeğer Premium ile açılır</b><small>Kariyer grafiği, dünya listeleri, kadro değerleri, söylentiler ve efsanelerle kıyas.</small><button class="sv-btn gold" data-sv="unlock" type="button">${typeof Star !== 'undefined' && Star.free('value') ? 'Bir kez ücretsiz dene' : 'Premium ile aç'}</button></div>` : '';
    return `<div class="ph-appv sv">${Phone.ui.top('<span class="sv-logo"><span>Star</span>Değer</span>')}<div class="ph-body">
      ${hero(all)}${lock || nav + `<div class="sv-body">${body(tab, all)}</div>`}
    </div></div>`;
  }
  const svg = (inner) => `<svg viewBox="0 0 24 24" fill="none" stroke="#1a1408" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
  Phone.ext = Phone.ext || [];
  Phone.views = Phone.views || {};
  Phone.ext.push({ k: 'value', n: 'StarDeğer', bg: 'linear-gradient(145deg,#f4d98b,#c99a3b 55%,#8a6420)', ic: svg('<path d="M3 17l5-5 4 4 8-8"/><path d="M15 8h5v5"/>'), on });
  Phone.views.value = view;
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('[data-sv]');
    if (!b || !Phone.open) return;
    const k = b.dataset.sv;
    if (k === 'unlock') { Phone.close(); setTimeout(() => Market.open('val'), 60); return; }
    Phone.sub = k === 'val' ? null : k;
    Phone.render();
  });
})();
