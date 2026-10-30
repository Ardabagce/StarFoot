// Editör: oyuncular kulüp ve oyuncu isimlerini kendileri değiştirebilir (New Star Soccer'daki gibi).
// Değişiklikler 'starfoot_edit' anahtarında tutulur, oyun açılırken veri listelerine uygulanır ve
// kayıtlı kariyerlere de işlenir. Düzenleme dosyası paylaşılabilir / içe aktarılabilir.
// NameFix: eski sürüm kayıtlarındaki isimleri yeni kurgusal isimlere çevirir (js/namefix.js).

const NameRx = {
  esc: (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
  // eşleşen kelimenin öncesi/sonrası harf olmamalı (Türkçe ekler: "Lirandi'nin" gibi kesme işaretiyle ayrılır)
  build(keys) {
    if (!keys.length) return null;
    const alt = keys.slice().sort((a, b) => b.length - a.length).map(NameRx.esc).join('|');
    try { return new RegExp('(^|[^\\p{L}\\p{N}_])(' + alt + ')(?![\\p{L}\\p{N}_])', 'gu'); } catch (e) { return new RegExp('(^|[^A-Za-z0-9_\\u00C0-\\u024F])(' + alt + ')(?![A-Za-z0-9_\\u00C0-\\u024F])', 'g'); }
  },
  run(text, rx, map) {
    if (!text || !rx) return text;
    // bitişik eşleşmeler için iki geçiş (ilk geçişte ayırıcı karakter tüketilir)
    const f = (m, pre, name) => pre + (map[name] !== undefined ? map[name] : name);
    return text.replace(rx, f).replace(rx, f);
  },
};

const NameFix = {
  map: null, rx: null,
  init() {
    if (NameFix.map) return;
    const m = {};
    const dec = (s) => { try { return decodeURIComponent(escape(atob(s))); } catch (e) { return ''; } };
    if (typeof NAME_FIX !== 'undefined') NAME_FIX.forEach(([a, b]) => { const k = dec(a); if (k) m[k] = b; });
    NameFix.map = m;
    NameFix.rx = NameRx.build(Object.keys(m));
  },
  text(t, skip) {
    if (!t || typeof t !== 'string') return t;
    NameFix.init();
    if (skip && NameFix.map[skip] !== undefined) {
      if (NameFix.skipKey !== skip) { NameFix.skipKey = skip; NameFix.skipRx = NameRx.build(Object.keys(NameFix.map).filter((k) => k !== skip)); }
      return NameRx.run(t, NameFix.skipRx, NameFix.map);
    }
    return NameRx.run(t, NameFix.rx, NameFix.map);
  },
};

const Edit = {
  KEY: 'starfoot_edit',
  base: null, // { clubs: {id: [name, short]}, players: [[isim, uyruk, güç, kulüp]] }
  get() { try { const d = JSON.parse(localStorage.getItem(Edit.KEY) || '{}'); return { c: d.c || {}, p: d.p || {} }; } catch (e) { return { c: {}, p: {} }; } },
  set(d) { try { localStorage.setItem(Edit.KEY, JSON.stringify({ c: d.c, p: d.p })); } catch (e) { /* yok */ } },
  clean(s, max) { return String(s || '').replace(/[<>"`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, max); },

  // veri listelerinin düzenlenmemiş halini sakla, sonra düzenlemeleri uygula (oyun açılışında bir kez)
  boot() {
    if (Edit.base) return;
    const players = new Map();
    // [isim, uyruk, güç, kulüp, mevki]
    const add = (n, nat, r, club, pos) => { const o = players.get(n); if (!o || r > o[2]) players.set(n, [n, nat, r, club || (o && o[3]) || '', pos || (o && o[4]) || '']); else if (o && !o[4] && pos) o[4] = pos; };
    const clubs = {};
    CLUB_LIST.forEach((c) => (clubs[c[0]] = [c[1], c[2]]));
    if (typeof LEGENDS !== 'undefined') LEGENDS.forEach(([n, pos, r, nat, , club]) => add(n, nat, r, club, pos));
    if (typeof STARS !== 'undefined') Object.entries(STARS).forEach(([club, a]) => a.forEach(([n, pos, r, nat]) => add(n, nat, r, club, pos)));
    if (typeof NATIONS !== 'undefined') NATIONS.forEach((x) => (x.stars || []).forEach((n, i) => add(n, x.code, x.rating - i, '', i < 2 ? 'FW' : '')));
    if (typeof WC_NATIONS !== 'undefined') WC_NATIONS.forEach((x) => (x.stars || []).forEach((n, i) => add(n, x.code, x.rating - i, '', i < 2 ? 'FW' : '')));
    if (typeof SQUADS !== 'undefined') Object.entries(SQUADS).forEach(([club, a]) => a.forEach(([n, pos, , , nat, r]) => add(n, nat, r, club, pos)));
    Edit.base = { clubs, players: [...players.values()].sort((a, b) => b[2] - a[2]) };
    Edit.applyData(Edit.get());
  },
  pn(d, n) { return (d.p && d.p[n]) || n; },
  // temel ad → editördeki ad (eski kayıtlar taşınırken kullanıcının düzenlemeleri de uygulanır)
  applyEdits(text, skip) {
    Edit.boot();
    const d = Edit.get(), m = {};
    Object.entries(d.p).forEach(([b, n]) => { if (n && n !== b && b !== skip) m[b] = n; });
    Object.entries(d.c).forEach(([id, v]) => { const b = Edit.base.clubs[id]; if (b && v[0] && v[0] !== b[0]) m[b[0]] = v[0]; });
    const keys = Object.keys(m);
    return keys.length ? NameRx.run(text, NameRx.build(keys), m) : text;
  },
  applyData(d) {
    const B = Edit.base;
    CLUB_LIST.forEach((c) => { const e = d.c[c[0]], b = B.clubs[c[0]]; c[1] = (e && e[0]) || b[0]; c[2] = (e && e[1]) || b[1]; });
    // oyuncu listeleri her zaman temel isimden yeniden kurulur
    if (!Edit.orig) {
      Edit.orig = {
        leg: typeof LEGENDS !== 'undefined' ? LEGENDS.map((x) => x[0]) : [],
        st: typeof STARS !== 'undefined' ? Object.fromEntries(Object.entries(STARS).map(([k, a]) => [k, a.map((x) => x[0])])) : {},
        nat: typeof NATIONS !== 'undefined' ? NATIONS.map((x) => (x.stars || []).slice()) : [],
        wc: typeof WC_NATIONS !== 'undefined' ? WC_NATIONS.map((x) => (x.stars || []).slice()) : [],
        sq: typeof SQUADS !== 'undefined' ? Object.fromEntries(Object.entries(SQUADS).map(([k, a]) => [k, a.map((x) => x[0])])) : {},
        lp: typeof LP_LIST !== 'undefined' ? LP_LIST.map((x) => [x.name, x.surname]) : [],
      };
    }
    const O = Edit.orig, f = (n) => Edit.pn(d, n);
    if (typeof LEGENDS !== 'undefined') LEGENDS.forEach((x, i) => (x[0] = f(O.leg[i])));
    if (typeof STARS !== 'undefined') Object.entries(STARS).forEach(([k, a]) => a.forEach((x, i) => (x[0] = f(O.st[k][i]))));
    if (typeof NATIONS !== 'undefined') NATIONS.forEach((x, i) => { if (x.stars) x.stars = O.nat[i].map(f); });
    if (typeof WC_NATIONS !== 'undefined') WC_NATIONS.forEach((x, i) => { if (x.stars) x.stars = O.wc[i].map(f); });
    if (typeof SQUADS !== 'undefined') Object.entries(SQUADS).forEach(([k, a]) => a.forEach((x, i) => (x[0] = f(O.sq[k][i]))));
    // Efsanelerin İzinde: karakter adı, dünyadaki ikiziyle aynı kalır
    if (typeof LP_LIST !== 'undefined') LP_LIST.forEach((x, i) => {
      const full = O.lp[i][0] + ' ' + O.lp[i][1], nn = f(full);
      if (nn === full) { [x.name, x.surname] = O.lp[i]; return; }
      const parts = nn.split(' ');
      x.name = parts.length > 1 ? parts.slice(0, -1).join(' ') : nn; x.surname = parts.length > 1 ? parts[parts.length - 1] : '';
    });
  },

  // sosyal medya gönderileri kulüp kısaltmasını ayrıca saklar: güncel kulüp bilgisiyle eşitle
  fixPosts(d) {
    const cl = d && d.world && d.world.clubs, so = d && d.player && d.player.social;
    if (!cl || !so || !Array.isArray(so.posts)) return;
    so.posts.forEach((x) => { const c = x.cid && cl[x.cid]; if (c) x.short = c.short; });
  },
  // kayıtlı kariyerleri yeni isimlere taşı: metin değişimi + kulüp kısaltmaları (kare kare, ekran donmasın)
  async migrateSaves(map, clubFix) {
    const keys = Object.keys(map), cf = Object.keys(clubFix).length;
    if (!keys.length && !cf) return;
    const rx = NameRx.build(keys);
    const tick = () => new Promise((r) => setTimeout(r, 16));
    if (Game.state) Game.save();
    for (const i of [0, 1, 2, 3, 4, 'wc', 'lp', 'legends']) {
      const k = Game.key(i);
      let raw = null;
      try { raw = Store.read(k); } catch (e) { /* yok */ }
      if (!raw) continue;
      const orig = raw;
      // henüz taşınmamış eski kayıt: önce isim taşıması (Game.load) yapılır
      if (!/"nf":3/.test(raw)) { try { const dd = Game.load(i); if (dd) raw = JSON.stringify(dd, Game.packRoster); } catch (e) { /* yok */ } }
      await tick();
      const nr = rx ? NameRx.run(raw, rx, map) : raw;
      let out = nr;
      if (cf) {
        await tick();
        try {
          const d = JSON.parse(nr);
          const cl = d && d.world && d.world.clubs;
          if (cl) Object.entries(clubFix).forEach(([id, [n, s]]) => { if (cl[id]) { cl[id].name = n; cl[id].short = s; } });
          Edit.fixPosts(d);
          out = JSON.stringify(d);
        } catch (e) { /* metin değişimi yeter */ }
      }
      if (out !== orig) { Store.write(k, out); try { localStorage.removeItem(Game.sumKey(i)); } catch (e) { /* yok */ } }
    }
    if (typeof SocialArt !== 'undefined' && SocialArt.cache) SocialArt.cache.clear();
    if (Game.state) Game.state = Game.load(Game.slot);
  },
  // yeni düzenlemeyi kaydet ve her yere uygula
  commit(nd) {
    const od = Edit.get(), B = Edit.base, map = {}, clubFix = {};
    Object.keys(B.clubs).forEach((id) => {
      const o = od.c[id] || B.clubs[id], n = nd.c[id] || B.clubs[id];
      if (o[0] !== n[0]) map[o[0]] = n[0];
      if (o[0] !== n[0] || o[1] !== n[1]) clubFix[id] = [n[0], n[1]];
    });
    new Set([...Object.keys(od.p), ...Object.keys(nd.p)]).forEach((b) => { const o = Edit.pn(od, b), n = Edit.pn(nd, b); if (o !== n) map[o] = n; });
    // temel isimle aynı olanları tutma
    Object.keys(nd.c).forEach((id) => { const b = B.clubs[id]; if (b && nd.c[id][0] === b[0] && nd.c[id][1] === b[1]) delete nd.c[id]; });
    Object.keys(nd.p).forEach((k) => { if (!nd.p[k] || nd.p[k] === k) delete nd.p[k]; });
    Edit.set(nd);
    Edit.applyData(nd);
    return Edit.migrateSaves(map, clubFix).then(() => Object.keys(map).length + Object.keys(clubFix).length);
  },

  // ---------- Paylaşım dosyası ----------
  exportText() { const d = Edit.get(); return JSON.stringify({ starfoot_edit: 1, c: d.c, p: d.p }); },
  parse(text) {
    let j;
    try { j = JSON.parse(String(text || '').trim()); } catch (e) { return null; }
    if (!j || j.starfoot_edit !== 1) return null;
    const B = Edit.base, out = { c: {}, p: {} }, known = new Set(B.players.map((x) => x[0]));
    Object.entries(j.c || {}).slice(0, 2000).forEach(([id, v]) => {
      if (!B.clubs[id] || !Array.isArray(v)) return;
      const n = Edit.clean(v[0], 28), s = Edit.clean(v[1], 4).toUpperCase();
      if (n.length >= 2) out.c[id] = [n, s.length >= 2 ? s : B.clubs[id][1]];
    });
    Object.entries(j.p || {}).slice(0, 20000).forEach(([b, v]) => { const n = Edit.clean(v, 32); if (known.has(b) && n.length >= 2) out.p[b] = n; });
    return out;
  },

  // ---------- Arayüz ----------
  el: null, tab: 'clubs', league: null, q: '', team: '', draft: null, shown: 40,
  POS: { GK: ['KL', 'Kaleci'], DF: ['DF', 'Defans'], MF: ['OS', 'Orta Saha'], FW: ['FV', 'Forvet'] },
  // oyuncunun şu anki kulübü: açık kariyerde dünyadaki kulübü, yoksa çıkış kulübü
  where() {
    const m = new Map(), w = Game.state && Game.state.world;
    if (w && w.clubs) Object.values(w.clubs).forEach((c) => (c.roster || []).forEach((pl) => { if (pl.star || pl.lid != null) m.set(pl.n, c.id); }));
    return m;
  },
  open() {
    Edit.boot();
    Edit.draft = JSON.parse(JSON.stringify(Edit.get()));
    Edit.league = Edit.league || (Game.state && Game.club && Game.club() ? Game.club().league : LEAGUES[0].id);
    if (!Edit.el) {
      const el = document.createElement('div');
      el.id = 'ed-sheet'; el.className = 'set-sheet ed-sheet';
      el.innerHTML = `<div class="ss-bg" data-edx></div><div class="ss-panel" role="dialog" aria-label="Editör"><div class="ss-h"><b>${Icon('pen')} Editör</b><button class="ss-x" data-edx aria-label="Kapat">✕</button></div><div class="ss-body" id="ed-body"></div><div class="ed-foot"><button class="btn btn-ghost" data-edx>Vazgeç</button><button class="btn" id="ed-save">Kaydet</button></div></div>`;
      document.body.appendChild(el);
      el.addEventListener('click', (e) => { if (e.target.closest('[data-edx]')) Edit.close(); });
      el.querySelector('#ed-save').onclick = () => Edit.save();
      Edit.el = el;
    }
    Edit.fill();
    requestAnimationFrame(() => Edit.el.classList.add('on'));
  },
  close() { if (Edit.el) Edit.el.classList.remove('on'); },
  async save() {
    const btn = document.getElementById('ed-save');
    if (btn) { if (btn.disabled) return; btn.disabled = true; btn.textContent = 'Uygulanıyor…'; }
    let n = 0;
    try { n = await Edit.commit(Edit.draft); } catch (e) { /* yok */ }
    if (btn) { btn.disabled = false; btn.textContent = 'Kaydet'; }
    Edit.close();
    Game.toast(n ? 'Değişiklikler kaydedildi ve kariyerlerine uygulandı.' : 'Değişiklik yok.', n ? 'good' : '');
    if (Game.state && Game.render) Game.render(); else if (!Game.state && Game.init) Game.init();
  },
  fill() {
    const body = document.getElementById('ed-body');
    if (!body) return;
    const t = (k, l) => `<button class="${Edit.tab === k ? 'on' : ''}" data-edtab="${k}">${l}</button>`;
    let h = `<p class="muted ed-note">Kulüp ve oyuncu isimlerini istediğin gibi değiştirebilirsin. Değişiklikler yeni ve kayıtlı kariyerlerinde görünür.</p>
      <div class="seg ed-tabs">${t('clubs', 'Kulüpler')}${t('players', 'Oyuncular')}${t('file', 'Paylaş')}</div>`;
    if (Edit.tab === 'clubs') h += Edit.clubsView();
    else if (Edit.tab === 'players') h += Edit.playersView();
    else h += Edit.fileView();
    body.innerHTML = h;
    Edit.bind(body);
  },
  clubsView() {
    const D = Edit.draft, B = Edit.base;
    const rows = CLUB_LIST.filter((c) => c[3] === Edit.league).map((c) => {
      const id = c[0], v = D.c[id] || B.clubs[id], ch = !!D.c[id];
      return `<div class="ed-row${ch ? ' ch' : ''}"><input class="ed-in" data-cn="${id}" value="${U.esc(v[0])}" maxlength="28" data-noi18n aria-label="Kulüp adı"><input class="ed-in ed-sh" data-cs="${id}" value="${U.esc(v[1])}" maxlength="4" data-noi18n aria-label="Kısaltma">${ch ? `<button class="ed-rs" data-crs="${id}" aria-label="Varsayılana dön">↺</button>` : ''}</div>`;
    }).join('');
    return `<div class="set-row"><span><b>Lig</b></span><select class="lang-sel" id="ed-lg">${LEAGUES.map((l) => `<option value="${l.id}"${l.id === Edit.league ? ' selected' : ''}>${U.esc(l.name)}</option>`).join('')}</select></div>
      <div class="ed-list">${rows}</div>`;
  },
  playersView() {
    const D = Edit.draft, q = Edit.q.toLocaleLowerCase('tr');
    const here = Edit.where(), clubOf = (x) => here.get(Edit.pn(Edit.get(), x[0])) || x[3];
    const all = Edit.base.players.filter((x) => (!Edit.team || clubOf(x) === Edit.team) && (!q || x[0].toLocaleLowerCase('tr').includes(q) || Edit.pn(D, x[0]).toLocaleLowerCase('tr').includes(q)));
    const list = all.slice(0, Edit.shown);
    const club = (id) => { const c = CLUB_LIST.find((x) => x[0] === id); return c ? c[1] : ''; };
    const natN = (c) => { const n = Game.nat(c); return n ? `${n.flag || ''} ${I18N.t ? I18N.t(n.name) : n.name}`.trim() : c; };
    const pos = (p) => (Edit.POS[p] ? `<b class="ed-pos" title="${Edit.POS[p][1]}">${Edit.POS[p][0]}</b>` : '');
    const rows = list.map((x) => {
      const [n, nat, r, , ps] = x, cl = clubOf(x);
      const ch = D.p[n] && D.p[n] !== n;
      return `<div class="ed-row ed-pr${ch ? ' ch' : ''}">${pos(ps)}<input class="ed-in" data-pn="${U.esc(n)}" value="${U.esc(Edit.pn(D, n))}" maxlength="32" data-noi18n aria-label="Oyuncu adı"><small><span>${U.esc(natN(nat))}</span> · ${r}${cl ? ` · <span data-noi18n>${U.esc(club(cl))}</span>` : ''}${ch ? ` · <span data-noi18n>${U.esc(n)}</span>` : ''}</small>${ch ? `<button class="ed-rs" data-prs="${U.esc(n)}" aria-label="Varsayılana dön">↺</button>` : ''}</div>`;
    }).join('');
    // takım filtresi: listede oyuncusu olan kulüpler, lige göre gruplu
    const has = new Set(Edit.base.players.map(clubOf).filter(Boolean));
    const opts = LEAGUES.map((l) => { const cs = CLUB_LIST.filter((c) => c[3] === l.id && has.has(c[0])); return cs.length ? `<optgroup label="${U.esc(l.name)}">${cs.map((c) => `<option value="${c[0]}"${c[0] === Edit.team ? ' selected' : ''}>${U.esc(c[1])}</option>`).join('')}</optgroup>` : ''; }).join('');
    return `<div class="set-row"><span><b>Takım</b></span><select class="lang-sel" id="ed-tm"><option value="">Tüm takımlar</option>${opts}</select></div>
      <input class="ed-in ed-q" id="ed-q" type="search" placeholder="Oyuncu ara" value="${U.esc(Edit.q)}">
      <div class="ed-list">${rows || '<p class="muted">Sonuç yok.</p>'}</div>
      ${all.length > list.length ? `<button class="btn btn-ghost" id="ed-more">Daha fazla göster (${all.length - list.length})</button>` : ''}`;
  },
  fileView() {
    const d = Edit.draft, nc = Object.keys(d.c).length, np = Object.keys(d.p).length;
    return `<section class="card settings"><div class="card-h"><span>Düzenleme dosyası</span></div>
      <p class="muted">Şu an ${nc} kulüp ve ${np} oyuncu değiştirilmiş. Düzenlemeni arkadaşlarınla paylaşabilir ya da başkasının dosyasını içe aktarabilirsin.</p>
      <div class="row-btns"><button class="btn btn-ghost" id="ed-exp">Paylaş / kopyala</button><button class="btn btn-ghost" id="ed-imp">İçe aktar</button></div>
      <textarea class="ed-ta" id="ed-ta" rows="5" placeholder="Düzenleme dosyasını buraya yapıştır" data-noi18n></textarea>
      <div class="row-btns"><button class="btn btn-danger" id="ed-reset">Tümünü varsayılana döndür</button></div></section>`;
  },
  bind(body) {
    U.$$('[data-edtab]', body).forEach((b) => (b.onclick = () => { Edit.tab = b.dataset.edtab; Edit.fill(); }));
    const D = Edit.draft, B = Edit.base;
    const lg = body.querySelector('#ed-lg'); if (lg) lg.onchange = () => { Edit.league = lg.value; Edit.fill(); };
    const tm = body.querySelector('#ed-tm'); if (tm) tm.onchange = () => { Edit.team = tm.value; Edit.shown = 40; Edit.fill(); };
    const setC = (id) => {
      const n = Edit.clean(body.querySelector(`[data-cn="${id}"]`).value, 28), s = Edit.clean(body.querySelector(`[data-cs="${id}"]`).value, 4).toUpperCase();
      D.c[id] = [n.length >= 2 ? n : B.clubs[id][0], s.length >= 2 ? s : B.clubs[id][1]];
    };
    U.$$('[data-cn]', body).forEach((i) => (i.onchange = () => setC(i.dataset.cn)));
    U.$$('[data-cs]', body).forEach((i) => (i.onchange = () => setC(i.dataset.cs)));
    U.$$('[data-crs]', body).forEach((b) => (b.onclick = () => { delete D.c[b.dataset.crs]; Edit.fill(); }));
    U.$$('[data-pn]', body).forEach((i) => (i.onchange = () => { const n = Edit.clean(i.value, 32); if (n.length >= 2 && n !== i.dataset.pn) D.p[i.dataset.pn] = n; else delete D.p[i.dataset.pn]; }));
    U.$$('[data-prs]', body).forEach((b) => (b.onclick = () => { delete D.p[b.dataset.prs]; Edit.fill(); }));
    const q = body.querySelector('#ed-q');
    if (q) { let tm = 0; q.oninput = () => { clearTimeout(tm); tm = setTimeout(() => { Edit.q = q.value; Edit.shown = 40; Edit.fill(); const nq = document.getElementById('ed-q'); if (nq) { nq.focus(); nq.setSelectionRange(nq.value.length, nq.value.length); } }, 250); }; }
    const more = body.querySelector('#ed-more'); if (more) more.onclick = () => { Edit.shown += 60; Edit.fill(); };
    const ta = body.querySelector('#ed-ta');
    const exp = body.querySelector('#ed-exp');
    if (exp) exp.onclick = async () => {
      const txt = JSON.stringify({ starfoot_edit: 1, c: D.c, p: D.p });
      ta.value = txt;
      try { if (navigator.share && window.Capacitor) { await navigator.share({ title: 'StarFoot düzenleme dosyası', text: txt }); return; } } catch (e) { /* kopyala */ }
      try { await navigator.clipboard.writeText(txt); Game.toast('Düzenleme dosyası kopyalandı.', 'good'); } catch (e) { ta.select(); }
    };
    const imp = body.querySelector('#ed-imp');
    if (imp) imp.onclick = () => {
      const d = Edit.parse(ta.value);
      if (!d) return Game.toast('Dosya okunamadı. Metnin tamamını yapıştırdığından emin ol.', 'bad');
      Edit.draft = d;
      Game.toast(`${Object.keys(d.c).length} kulüp ve ${Object.keys(d.p).length} oyuncu yüklendi. Uygulamak için Kaydet'e dokun.`, 'good');
      Edit.fill();
    };
    const rs = body.querySelector('#ed-reset');
    if (rs) rs.onclick = () => { Edit.draft = { c: {}, p: {} }; Game.toast('Tüm isimler varsayılana döndü. Uygulamak için Kaydet\'e dokun.'); Edit.fill(); };
  },
};

Edit.boot();
