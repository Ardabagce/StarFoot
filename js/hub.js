// Kaydırmasız ana ekranlar (1.0.27): Merkez, Lig, Kadro ve Profil tek ekrana sığan bir özet gösterir;
// ayrıntılı bölümler alttan açılan panellerde açılır. Paneller eski ekranların aynı içeriğini kullanır,
// böylece bütün düğmeler (reklam, teklif, görev, ayarlar vb.) aynen çalışmaya devam eder.
const Hub = {
  orig: {},
  sheet: null, // açık panel: { tab, key, title }
  el: null,
  pend: null, // son denenen aksiyon (hafta kutularına yazmak için)

  on() { const s = Game.state; return !!(s && s.player && s.mode !== 'wc'); },
  wk() { const s = Game.state; return `${s.season.year}-${s.season.round}`; },

  // HTML'yi üst düzey bölümlere ayırır (grid2 gibi sarmalayıcılar açılır)
  frag(html) {
    const t = document.createElement('template');
    t.innerHTML = html;
    const out = [];
    const walk = (root) => {
      [...root.children].forEach((c) => {
        if (c.tagName === 'DIV' && (c.classList.contains('grid2') || (!c.className && c.querySelector('section')))) walk(c);
        else out.push(c);
      });
    };
    walk(t.content);
    return out;
  },
  title(el) {
    if (el.classList.contains('report')) return 'Son Maç';
    if (el.classList.contains('paper')) return 'Gazete';
    const ch = el.querySelector('.card-h');
    if (!ch && el.querySelector('.ig-top, .ig-prof, .ig-grid')) return 'Sosyal Medya';
    let t = '';
    if (ch) {
      const c = (ch.querySelector(':scope > span') || ch).cloneNode(true);
      c.querySelectorAll('small, .tag, em, button, .muted, .badge, .armband').forEach((x) => x.remove());
      t = c.textContent.replace(/\s+/g, ' ').trim();
    } else { const h = el.querySelector('h3, h2'); t = h ? h.textContent.replace(/\s+/g, ' ').trim() : ''; }
    return t.length > 26 ? t.slice(0, 24) + '…' : t;
  },
  icon(el) {
    const ic = el.querySelector('.card-h svg');
    if (ic) return ic.outerHTML;
    if (el.classList.contains('report')) return Icon('whistle');
    if (el.classList.contains('paper')) return Icon('mail');
    return Icon('star');
  },
  sub(el) {
    if (el.classList.contains('report')) { const b = el.querySelector('.rpm-s b'), o = el.querySelector('.rpm-s small'); return b ? `${b.textContent}${o ? ' · ' + o.textContent : ''}` : ''; }
    if (!el.querySelector('.card-h') && el.querySelector('.ig-top b')) { const f = el.querySelector('.ig-top small'); return f ? f.textContent.trim() : ''; }
    const n = el.querySelectorAll('.offers > *').length;
    if (n) return `${n} teklif`;
    const sm = el.querySelector('.card-h small, .card-h .tag, .card-h em');
    return sm ? sm.textContent.replace(/\s+/g, ' ').trim().slice(0, 30) : '';
  },
  key(el) {
    const cls = [...el.classList].filter((c) => !/^(card|mini|tab-anim|res-[A-Z]|on|ct-.*|hidden)$/.test(c)).sort().join('.');
    return (cls || el.tagName.toLowerCase()) + '|' + Hub.title(el).slice(0, 18);
  },
  // kutucuk listesi: başlıksız parçalar "Diğer" altında toplanır
  items(secs) {
    const list = [];
    let misc = null;
    secs.forEach((el) => {
      const t = Hub.title(el);
      if (!t || el.matches('nav.vnav')) {
        if (el.matches('nav.vnav') || !el.textContent.trim()) return;
        if (!misc) { misc = { key: 'misc|', title: 'Diğer', icon: Icon('star'), sub: '', els: [] }; list.push(misc); }
        misc.els.push(el);
        return;
      }
      const k = Hub.key(el);
      const same = list.find((x) => x.key === k);
      if (same) { same.els.push(el); return; }
      list.push({ key: k, title: t, icon: Hub.icon(el), sub: Hub.sub(el), els: [el], hot: !!el.querySelector('.offers > *, .ms-claim, [data-claim], .badge') });
    });
    return list;
  },
  tiles(tab, list) {
    if (!list.length) return '';
    return `<div class="hub-tiles${list.length > 4 ? ' many' : ''}">${list.map((x) => `<button type="button" class="hub-tile${x.hot ? ' hot' : ''}" data-hubopen="${tab}" data-hubkey="${U.esc(x.key)}">
      <span class="ht-ic">${x.icon}</span><span class="ht-t"><b>${U.esc(x.title)}</b>${x.sub ? `<small>${U.esc(x.sub)}</small>` : ''}</span></button>`).join('')}</div>`;
  },

  // ---------- Merkez ----------
  ACTS: { train: ['train', 'Antrenman'], intense: ['fire', 'Yoğun antrenman'], coach: ['coach', 'Özel hoca'], rest: ['rest', 'Dinlen'], team: ['team', 'Takımla takıl'], talk: ['talk', 'Hocayla konuş'], fans: ['phone', 'Sosyal medya'] },
  rec() {
    const s = Game.state, p = s.player;
    if (s.ap <= 0) return null;
    const lbl = (STATS.find((x) => x.k === s.trainFocus) || { l: '' }).l;
    if (p.injuryWeeks > 0) return ['rest', 'Sakatsın. Dinlenirsen enerjin ve moralin toparlanır.'];
    if (p.energy < 40) return ['rest', 'Enerjin düşük. Bu hafta dinlenmen maçta işine yarar.'];
    if (!s.week.coachTalk && p.rel.coach < 40 && !Game.inStreet()) return ['talk', 'Hocayla aran soğuk. Konuşmak ilk 11 şansını artırır.'];
    return ['train', `${lbl} antrenmanı yap, gelişimini sürdür.`];
  },
  week(plan) {
    if (!plan) return '';
    const s = Game.state;
    const log = (s.week && s.week.hub) || [];
    const n = Math.min(5, log.length + Math.max(0, s.ap));
    const slots = [];
    for (let i = 0; i < n; i++) {
      const k = log[i];
      if (k) {
        const a = Hub.ACTS[k] || ['star', k];
        slots.push(`<button type="button" class="hw-slot done" data-hubopen="home" data-hubkey="@plan"><span class="hw-ic">${Icon(a[0])}</span><b>${U.esc(a[1])}</b><small>Yapıldı</small></button>`);
      } else slots.push(`<button type="button" class="hw-slot empty" data-hubopen="home" data-hubkey="@plan"><span class="hw-plus">+</span><b>Aksiyon seç</b></button>`);
    }
    const r = Hub.rec();
    const ad = s.ap <= 0 ? (UI.adAp() + UI.adEnergy()) : '';
    return `<section class="hub-week">
      <div class="hw-h"><b>Bu Hafta</b><span>${s.ap > 0 ? `${s.ap} aksiyon hakkın var` : 'Haklar bitti · maça hazırsın'}</span></div>
      ${n ? `<div class="hw-slots" style="--n:${n}">${slots.join('')}</div>` : ''}
      ${r ? `<div class="hw-rec"><span class="hw-av">${Icon('whistle')}</span><span class="hw-tx"><small>Hocanın önerisi</small><b>${U.esc(r[1])}</b></span><button type="button" class="hw-go" data-act="${r[0]}">${U.esc((Hub.ACTS[r[0]] || ['', 'Uygula'])[1])}</button></div>` : ''}
      ${ad ? `<div class="hw-ad">${ad}</div>` : ''}
    </section>`;
  },
  home() {
    const secs = Hub.frag(Hub.orig.home());
    const next = secs.find((e) => e.classList.contains('next'));
    const plan = secs.find((e) => e.classList.contains('plan'));
    const rest = secs.filter((e) => e !== next && e !== plan);
    let nextH = '';
    if (next) {
      next.classList.add('hub-next');
      // maça çık, hızlı ilerle ve geri al yan yana
      const cta = document.createElement('div');
      cta.className = 'hub-cta';
      next.querySelectorAll('.btn-play, .ff-btn, .undo-btn').forEach((b) => cta.appendChild(b));
      const hint = next.querySelector('.hint'); if (hint) hint.remove();
      next.appendChild(cta);
      nextH = next.outerHTML;
    }
    return `<div class="hub hub-home">${nextH}${Hub.week(plan)}${Hub.tiles('home', Hub.items(rest))}</div>`;
  },

  // ---------- Lig ----------
  LG: [['table', 'table', 'Puan Durumu'], ['fix', 'whistle', 'Fikstür'], ['kings', 'ball', 'Gol Krallığı'], ['cups', 'career', 'Kupalar'], ['world', 'globe', 'Dünya']],
  league() {
    const s = Game.state;
    if (Game.inStreet()) return Hub.orig.league();
    const lg = Game.league();
    if (!lg || !lg.table) return Hub.orig.league();
    const tbl = World.sortedTable(lg);
    const pos = tbl.findIndex((r) => r.id === s.clubId) + 1;
    const me = tbl[pos - 1] || { pts: 0, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 };
    const res = (r, id) => { const gf = r.h === id ? r.hs : r.as, ga = r.h === id ? r.as : r.hs; return gf > ga ? 'W' : gf < ga ? 'L' : 'D'; };
    const form = lg.results.filter((r) => r.h === s.clubId || r.a === s.clubId).sort((x, y) => x.round - y.round).slice(-5).map((r) => res(r, s.clubId));
    const lead = tbl[0];
    const gap = lead && lead.id !== s.clubId ? `Lidere ${lead.pts - me.pts} puan` : tbl[1] ? `Zirvede · ${me.pts - tbl[1].pts} puan önde` : 'Zirvede';
    const from = Math.max(0, Math.min(pos - 3, tbl.length - 5));
    const rows = tbl.slice(from, from + 5).map((r, i) => `<div class="hl-row${r.id === s.clubId ? ' me' : ''}"><i>${from + i + 1}</i><span>${UI.shirt(Game.club(r.id))}${U.esc(Game.teamName(r.id))}</span><em>${r.p}</em><b>${r.pts}</b></div>`).join('');
    const fx = Game.nextFixture();
    const nx = fx ? `${U.esc(Game.teamName(fx.home === s.clubId ? fx.away : fx.home))} · ${fx.home === s.clubId ? 'İç saha' : 'Deplasman'}` : '';
    return `<div class="hub hub-league">
      <section class="hub-hero hl-hero">
        <div class="hl-top"><div class="hl-pos"><b>${pos || '-'}</b><small>SIRA</small></div>
          <div class="hl-info"><b>${U.esc(Game.leagueName())}</b><span>${me.pts} puan · ${me.p} maç · ${me.w}G ${me.d}B ${me.l}M</span><span class="hl-gap">${gap}</span></div>
          <div class="hl-form" aria-label="Son 5 maç">${form.map((k) => `<i class="fm fm-${k}">${{ W: 'G', D: 'B', L: 'M' }[k]}</i>`).join('')}</div></div>
        <button type="button" class="hl-table" data-hubopen="league" data-hubkey="table" aria-label="Puan durumunun tamamı">
          <div class="hl-row hl-hd"><i>#</i><span>Takım</span><em>O</em><b>P</b></div>${rows}</button>
        ${nx ? `<div class="hl-next">${Icon('whistle')}<span>Sıradaki: <b>${nx}</b></span></div>` : ''}
      </section>
      ${Hub.tiles('league', Hub.LG.map(([k, ic, t]) => ({ key: k, title: t, icon: Icon(ic), sub: '' })))}
    </div>`;
  },

  // ---------- Kadro ----------
  squad() {
    if (Game.inStreet()) return Hub.orig.squad();
    const secs = Hub.frag(Hub.orig.squad());
    const head = secs.find((e) => e.classList.contains('sq-head'));
    const rest = secs.filter((e) => e !== head);
    return `<div class="hub hub-squad">${head ? head.outerHTML : ''}${Hub.tiles('squad', Hub.items(rest))}</div>`;
  },

  // ---------- Profil ----------
  profile() {
    const s = Game.state, p = s.player;
    const ovr = Player.overall(p), club = Game.club();
    const meter = (l, v, c) => `<div class="hp-m"><span>${l}</span><b>${Math.round(v)}</b><i><em style="width:${U.clamp(v, 0, 100)}%;background:${c}"></em></i></div>`;
    const top = STATS.slice().sort((a, b) => p.stats[b.k] - p.stats[a.k]).slice(0, 3);
    const secs = Hub.frag(UI.player()).filter((e) => !e.classList.contains('pc'));
    const list = [{ key: '@card', title: 'Özellikler', icon: Icon('star'), sub: `Güç ${ovr}` }, { key: '@career', title: 'Kariyer', icon: Icon('career'), sub: `${p.totals.goals} gol` }].concat(Hub.items(secs));
    return `<div class="hub hub-prof">
      <section class="hub-hero hp-hero" style="--c1:${club.c1};--c2:${club.c2}">
        <canvas class="pc-fig hp-fig" aria-hidden="true"></canvas>
        <div class="hp-id"><small>${p.shirt} · ${POSITIONS[p.position].l.toUpperCase()} · ${p.age} YAŞ</small><b>${U.esc(p.name)} <span>${U.esc(p.surname)}</span></b><small>${U.esc(Game.teamName())}</small>
          <div class="hp-top">${top.map((st) => `<span>${st.l} <b>${Math.floor(p.stats[st.k])}</b></span>`).join('')}</div></div>
        <div class="hp-ovr ${UI.statColor(ovr)}"><b>${ovr}</b><small>GÜÇ</small></div>
        <div class="hp-ms">${meter('Enerji', p.energy, '#45c8ff')}${meter('Moral', p.morale, '#ffcf3f')}${meter('Ün', p.fame, '#c9a6ff')}</div>
      </section>
      ${Hub.tiles('profile', list)}
    </div>`;
  },

  // ---------- Panel ----------
  content(tab, key) {
    if (tab === 'league') {
      UI.lgView = key;
      const t = document.createElement('template'); t.innerHTML = Hub.orig.league();
      t.content.querySelectorAll('nav.vnav').forEach((n) => n.remove());
      const d = document.createElement('div'); d.appendChild(t.content); return d.innerHTML;
    }
    if (tab === 'profile' && key === '@card') return UI.playerCard();
    if (tab === 'profile' && key === '@career') return UI.career();
    if (tab === 'home' && key === '@plan') {
      const plan = Hub.frag(Hub.orig.home()).find((e) => e.classList.contains('plan'));
      return plan ? plan.outerHTML : null;
    }
    const src = tab === 'home' ? Hub.orig.home() : tab === 'squad' ? Hub.orig.squad() : UI.player();
    let secs = Hub.frag(src);
    if (tab === 'profile') secs = secs.filter((e) => !e.classList.contains('pc'));
    const it = Hub.items(secs).find((x) => x.key === key);
    return it ? it.els.map((e) => e.outerHTML).join('') : null;
  },
  titleOf(tab, key) {
    if (key === '@plan') return 'Haftalık Plan';
    if (key === '@card') return 'Özellikler';
    if (key === '@career') return 'Kariyer';
    if (tab === 'league') return (Hub.LG.find((x) => x[0] === key) || [0, 0, ''])[2];
    return null;
  },
  build() {
    if (Hub.el) return Hub.el;
    const el = document.createElement('div');
    el.className = 'hub-sheet';
    el.innerHTML = `<div class="hs-bg" data-hsx></div><div class="hs-panel" role="dialog" aria-modal="true" aria-labelledby="hs-t">
      <div class="hs-h"><button type="button" class="hs-back" data-hsx aria-label="Geri"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button>
      <b id="hs-t" class="hs-t"></b><button type="button" class="hs-x" data-hsx aria-label="Kapat"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
      <div class="hs-body"></div></div>`;
    document.body.appendChild(el);
    el.addEventListener('click', (e) => { if (e.target.closest('[data-hsx]')) Hub.close(); });
    // başlıktan aşağı çekince kapanır
    const h = el.querySelector('.hs-h'), panel = el.querySelector('.hs-panel');
    let y0 = null, dy = 0;
    h.addEventListener('touchstart', (e) => { y0 = e.touches[0].clientY; dy = 0; panel.style.transition = 'none'; }, { passive: true });
    h.addEventListener('touchmove', (e) => { if (y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); panel.style.transform = `translateY(${dy}px)`; }, { passive: true });
    h.addEventListener('touchend', () => { panel.style.transition = ''; panel.style.transform = ''; if (dy > 90) Hub.close(); y0 = null; });
    Hub.el = el;
    return el;
  },
  open(tab, key, title) {
    const html = Hub.content(tab, key);
    if (html == null) return;
    Hub.build();
    Hub.sheet = { tab, key, title: Hub.titleOf(tab, key) || title || '' };
    Hub.el.querySelector('.hs-t').textContent = Hub.sheet.title;
    Hub.fill(html, true);
    document.body.classList.add('hs-on');
    requestAnimationFrame(() => Hub.el.classList.add('on'));
    // Android geri tuşu ve tarayıcı geri: paneli kapatır
    try { if (!Hub.hist) { history.pushState({ hub: 1 }, ''); Hub.hist = true; } } catch (e) { /* yok */ }
    if (typeof Sfx !== 'undefined' && Sfx.play) try { Sfx.play('tap'); } catch (e) { /* yok */ }
  },
  fill(html, top) {
    const body = Hub.el && Hub.el.querySelector('.hs-body');
    if (!body || !Hub.sheet) return;
    if (html == null) html = Hub.content(Hub.sheet.tab, Hub.sheet.key);
    if (html == null || (Hub.sheet.key === '@plan' && Game.state.ap <= 0 && !top)) { Hub.close(); return; }
    const y = top ? 0 : body.scrollTop;
    body.innerHTML = html;
    try { UI.drawFigure(); Social.drawAvatar(); UI.paintPaper(); UI.strip(body); UI.bind(body); } catch (e) { console.error(e); }
    body.scrollTop = y;
  },
  isOpen() { return !!(Hub.el && Hub.el.classList.contains('on')); },
  close(fromPop) {
    if (!Hub.el || !Hub.sheet) return;
    Hub.sheet = null;
    Hub.el.classList.remove('on');
    document.body.classList.remove('hs-on');
    setTimeout(() => { if (!Hub.sheet && Hub.el) Hub.el.querySelector('.hs-body').innerHTML = ''; }, 260);
    if (Hub.hist && !fromPop) { Hub.hist = false; try { history.back(); } catch (e) { /* yok */ } }
    Hub.hist = false;
  },
};

(() => {
  ['home', 'league', 'squad', 'profile'].forEach((t) => {
    Hub.orig[t] = UI[t];
    UI[t] = function () { if (!Hub.on()) return Hub.orig[t].apply(this, arguments); try { return Hub[t](); } catch (e) { console.error(e); return Hub.orig[t].apply(this, arguments); } };
  });
  // Profil kahramanında ve Özellikler panelinde aynı anda iki oyuncu çizimi olabilir
  const df = UI.drawFigure;
  UI.drawFigure = function () {
    const all = [...document.querySelectorAll('.pc-fig')];
    if (all.length <= 1) return df.apply(this, arguments);
    all.forEach((cv) => {
      cv.classList.add('pc-fig'); const keep = [...document.querySelectorAll('.pc-fig')].filter((x) => x !== cv);
      keep.forEach((x) => x.classList.remove('pc-fig'));
      try { df.apply(this, arguments); } finally { keep.forEach((x) => x.classList.add('pc-fig')); }
    });
  };
  // yapılan aksiyonlar hafta kutularına yazılır
  const act0 = Game.act;
  Game.act = function (kind) {
    const s = Game.state;
    if (s) Hub.pend = { kind, ap: s.ap, wk: Hub.wk(), st: s };
    return act0.apply(this, arguments);
  };
  const r0 = Game.render;
  Game.render = function () {
    const s = Game.state;
    const want = Game.tab === 'career' ? ['profile', '@career'] : Game.tab === 'world' ? ['league', 'world'] : null;
    try {
      const P = Hub.pend;
      if (P && s && P.st === s && P.wk === Hub.wk() && s.ap < P.ap) {
        s.week.hub = (s.week.hub || []).concat(Array(Math.min(3, P.ap - s.ap)).fill(P.kind));
        Hub.pend = null;
      } else if (P && (!s || P.st !== s || P.wk !== Hub.wk())) Hub.pend = null;
      if (Hub.sheet && (Hub.sheet.tab !== Game.tab || !Hub.on())) Hub.close();
    } catch (e) { console.error(e); }
    const out = r0.apply(this, arguments);
    try {
      U.$$('[data-hubopen]', document.getElementById('main')).forEach((b) => (b.onclick = () => Hub.open(b.dataset.hubopen, b.dataset.hubkey, (b.querySelector('b') || b).textContent)));
      if (Hub.sheet) Hub.fill();
      else if (want && Hub.on() && Game.tab === want[0]) Hub.open(want[0], want[1]);
    } catch (e) { console.error(e); }
    return out;
  };
  window.addEventListener('popstate', () => { if (Hub.sheet) { Hub.hist = false; Hub.close(true); } });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && Hub.sheet) Hub.close(); });
  // alttaki sekmeye dokununca panel kapanır (aynı sekme dahil)
  document.addEventListener('click', (e) => { if (Hub.sheet && e.target.closest && e.target.closest('#tabs button')) Hub.close(); }, true);
  // menüye dönüş, yeni kariyer vb.
  const tm = Game.toMenu;
  if (tm) Game.toMenu = function () { Hub.close(); return tm.apply(this, arguments); };
})();

// Ekranı doldur: özet ve kutucuklar alttaki sekme çubuğuna kadar uzanır (telefon düzeni)
(() => {
  const fit = () => {
    const hub = document.querySelector('#main > .hub');
    if (!hub) return;
    const tabs = document.getElementById('tabs');
    const fixed = tabs && getComputedStyle(tabs).position === 'fixed';
    if (!fixed) { hub.style.minHeight = ''; return; }
    const bottom = tabs.getBoundingClientRect().top;
    const h = Math.floor(bottom - hub.getBoundingClientRect().top - window.scrollY * 0 - 12);
    hub.style.minHeight = h > 300 ? h + 'px' : '';
  };
  Hub.fit = fit;
  const r1 = Game.render;
  Game.render = function () { const out = r1.apply(this, arguments); try { fit(); requestAnimationFrame(fit); } catch (e) { /* yok */ } return out; };
  window.addEventListener('resize', () => { try { fit(); } catch (e) { /* yok */ } });
})();
