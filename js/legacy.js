// Nesil modu + Efsaneler Salonu, senaryolar ve paylaşılabilir kartlar

// ---------- Efsaneler Salonu (tüm kariyerler, cihazda) ----------
const Legacy = {
  KEY: 'sf_hof',
  list() { return Meta.get(Legacy.KEY, []); },
  score(p) {
    const t = p.totals;
    return Math.round(t.goals * 1 + t.assists * 0.6 + p.trophies.length * 8 + p.intl.caps * 1.5 + p.fame * 2 + (p.ballon || 0) * 40);
  },
  title(sc) { return sc > 900 ? 'Efsane' : sc > 500 ? 'Süperstar' : sc > 250 ? 'Saygın Profesyonel' : sc > 100 ? 'Emektar Futbolcu' : 'Sıradan Bir Kariyer'; },
  // emeklilikte salona eklenir; en iyi 20 kariyer saklanır
  record(s) {
    const p = s.player, sc = Legacy.score(p);
    const clubs = [...new Set(p.history.filter((h) => h.apps).map((h) => h.club))];
    const e = {
      n: Player.fullName(p), nat: p.nation, pos: p.position, gen: s.gen || 1,
      y0: s.startYear, y1: s.season.year, goals: p.totals.goals, assists: p.totals.assists, apps: p.totals.apps,
      tr: p.trophies.length, ballon: p.ballon || 0, caps: p.intl.caps, sc, clubs: clubs.slice(-3), at: Date.now(),
    };
    const L = Legacy.list();
    L.push(e);
    L.sort((a, b) => b.sc - a.sc);
    Meta.set(Legacy.KEY, L.slice(0, 20));
    return { e, rank: L.indexOf(e) + 1 };
  },
  show() {
    const L = Legacy.list();
    const nat = (c) => (NATIONS.find((n) => n.code === c) || {}).name || c;
    Game.modal(`<div class="ev-tag">Tüm kariyerlerin</div><h2>🏛️ Efsaneler Salonu</h2>
      ${L.length ? `<div class="hof">${L.map((x, i) => `<div class="hof-r ${i < 3 ? 'top' : ''}"><span class="rk">${i + 1}</span><div class="hof-t"><b>${U.esc(x.n)}${x.gen > 1 ? ` <em>${x.gen}. nesil</em>` : ''}</b><small>${U.esc(nat(x.nat))} · ${x.y0}–${x.y1} · ${x.goals} gol · ${x.assists} asist · ${x.tr} kupa${x.ballon ? ` · ${x.ballon} Altın Top` : ''}</small></div><b class="g">${x.sc}</b></div>`).join('')}</div>`
        : '<p class="muted">Salon henüz boş. Bir kariyeri emeklilikle tamamladığında burada yer alırsın.</p>'}`, [{ t: 'Kapat', cls: 'btn-ghost' }], { wide: true });
  },
  // emeklilik ekranından "oğlunla devam et": soyadı ve köken aynı, babanın mirasından bonus
  heirOf(s) {
    const p = s.player, sc = Legacy.score(p);
    return {
      surname: p.surname, nation: p.nation, mother: (p.parents && p.parents.m) || p.nation, position: p.position, foot: p.foot,
      father: Player.fullName(p), gen: (s.gen || 1) + 1, year: Math.min(2026, s.season.year + 1),
      fame: Math.min(12, Math.round(sc / 80)), stat: Math.min(4, 1 + Math.floor(sc / 300)), money: Math.min(50000, Math.round(p.money * 0.05)),
    };
  },
  continueWith(heir) {
    Create.heir = heir;
    const slot = Legacy.freeSlot(Game.slot);
    if (slot < 0) return Game.toast('Boş kariyer slotu yok. Ana menüden bir kariyeri silebilirsin.', 'bad');
    Game.slot = slot;
    Create.open();
  },
  freeSlot(pref) {
    if (pref != null && !Game.load(pref)) return pref;
    for (let i = 0; i < 5; i++) if (!Game.load(i)) return i;
    return -1;
  },
  // yeni kariyer oluşturulurken mirası uygular
  apply(s, heir) {
    const p = s.player;
    s.gen = heir.gen;
    p.father = heir.father;
    p.fame = Math.max(p.fame, heir.fame);
    STATS.forEach((st) => (p.stats[st.k] += heir.stat));
    p.money += heir.money;
    p.potential = Math.min(98, p.potential + 2);
    Game.news(`Efsane ${heir.father}'in oğlu ${Player.fullName(p)} sahalarda! Herkes babasının izinden gidip gitmeyeceğini merak ediyor.`, 'good');
  },
};

// ---------- Senaryolar ----------
const SCEN = [
  { id: 'rescue', ic: '🛟', name: 'Kurtarıcı', d: 'Ligin en zayıf takımına 28 yaşında yıldız golcü olarak geldin. Takımı küme düşmekten kurtar.', goal: 'Sezonu küme düşmeden bitir', age: 28, pos: 'FW', pick: (cl) => cl[cl.length - 1], ovr: (c) => c.rating + 9, fame: 25, ok: (se) => !se.relegated },
  { id: 'last', ic: '🕯️', name: 'Son Dans', d: '33 yaşındasın ve ligin devinde son sezonun olabilir. Kariyerini bir şampiyonlukla taçlandır.', goal: 'Ligi şampiyon bitir', age: 33, pos: 'FW', pick: (cl) => cl[0], ovr: () => 82, fame: 60, ok: (se) => se.pos === 1 },
  { id: 'rising', ic: '🌠', name: 'Yükselen Yıldız', d: '18 yaşında orta sıra bir takımda ilk profesyonel sezonun. Herkes senden gol bekliyor.', goal: 'Sezonda 15 gol at', age: 18, pos: 'FW', pick: (cl) => cl[Math.floor(cl.length / 2)], ovr: () => 68, fame: 6, ok: (se) => se.stats.goals >= 15, prog: (s) => [s.season.stats.goals, 15] },
  { id: 'comeback', ic: '🩹', name: 'Büyük Dönüş', d: 'Ağır bir sakatlıktan çıkıyorsun, hoca sana güvenmiyor, moralin dipte. Herkese yanıldıklarını göster.', goal: 'En az 20 maç ve 7.0+ ortalama', age: 26, pos: 'MF', pick: (cl) => cl[3], ovr: () => 79, fame: 30, inj: 8, ok: (se) => se.stats.apps >= 20 && se.avg >= 7, prog: (s) => [s.season.stats.apps, 20] },
  { id: 'europe', ic: '✈️', name: 'Avrupa Rüyası', d: 'Hiç Avrupa\'ya gitmemiş mütevazı bir kulübün kaptanısın. Taraftarın tek hayali var.', goal: 'Takımını Avrupa kupalarına taşı', age: 25, pos: 'MF', pick: (cl) => cl[Math.min(cl.length - 1, 11)], ovr: (c) => c.rating + 7, fame: 15, ok: (se) => !!se.europe },
];
const Scenario = {
  badges() { return Meta.get('sf_badges', {}); },
  def(id) { return SCEN.find((x) => x.id === id); },
  menu() {
    const b = Scenario.badges();
    const m = Game.modal(`<div class="ev-tag">Meydan okumalar</div><h2>🎯 Senaryolar</h2><p class="muted">Hazır bir durumla başla, sezon sonunda hedefi tuttur ve rozetini kazan.</p>
      <div class="scn">${SCEN.map((x) => `<button type="button" class="scn-r ${b[x.id] ? 'got' : ''}" data-scn="${x.id}"><i>${x.ic}</i><span><b>${x.name}${b[x.id] ? ' ✓' : ''}</b><small>${x.d}</small><em>🎯 ${x.goal}</em></span></button>`).join('')}</div>`, [{ t: 'Kapat', cls: 'btn-ghost' }], { wide: true });
    U.$$('[data-scn]', m).forEach((el) => (el.onclick = () => Scenario.ask(el.dataset.scn)));
  },
  ask(id) {
    const slot = Legacy.freeSlot();
    if (slot < 0) return Game.modal('<h3>Boş slot yok</h3><p>Senaryo başlatmak için önce ana menüden bir kariyeri silmelisin.</p>');
    const x = Scenario.def(id), en = I18N.lang === 'en';
    const m = Game.modal(`<div class="ev-tag">${x.ic} ${x.name}</div><h2>Oyuncunun adı</h2><p>${x.d}</p>
      <div class="cr-row2"><label class="cr-f"><span>Adın</span><input id="sc-name" maxlength="16" value="${en ? 'Alex' : 'Emre'}" autocomplete="off"></label><label class="cr-f"><span>Soyadın</span><input id="sc-sur" maxlength="18" value="${en ? 'Stone' : 'Yıldız'}" autocomplete="off"></label></div>`,
    [{ t: 'Vazgeç', cls: 'btn-ghost' }, { t: 'Başla', keep: true, fn: () => {
      const n = (document.getElementById('sc-name').value.trim() || 'Emre').slice(0, 16), sn = (document.getElementById('sc-sur').value.trim() || 'Yıldız').slice(0, 18);
      m.classList.add('hidden'); m.innerHTML = '';
      Game.slot = slot;
      Scenario.start(id, n, sn);
    } }]);
  },
  start(id, name, surname) {
    const x = Scenario.def(id), en = I18N.lang === 'en';
    const nation = en ? 'ENG' : 'TUR', lgId = en ? 'ENG' : 'TR1';
    Create.heir = null;
    Game.newCareer({ name, surname, nation, mother: nation, foot: 'R', position: x.pos, alloc: {}, difficulty: 'normal', year: 2026, age: x.age });
    const s = Game.state, p = s.player;
    const cl = Object.values(s.world.clubs).filter((c) => c.league === lgId).sort((a, b) => b.rating - a.rating);
    const club = x.pick(cl);
    const target = Math.round(U.clamp(x.ovr(club), 50, 92));
    STATS.forEach((st) => (p.stats[st.k] = target));
    for (let i = 0; i < 6; i++) { const d = target - Player.overall(p); if (!d) break; STATS.forEach((st) => (p.stats[st.k] = U.clamp(p.stats[st.k] + d, 10, 99))); }
    p.age = x.age;
    p.potential = Math.max(target + 3, p.potential);
    p.fame = x.fame;
    p.money = 20000 + x.age * 4000;
    p.rel.fans = 40 + x.fame * 0.4;
    s.street.done = true;
    delete s.world.clubs.STREET;
    s.youth = null;
    s.news = [];
    Game.joinClub(club.id, Game.wageFor(club.rating, target), x.id === 'last' ? 1 : 3);
    if (x.inj) { p.injuryWeeks = x.inj; p.morale = 35; p.rel.coach = 35; }
    s.scenario = { id, year: s.season.year, res: null };
    Cups.setup(s);
    Game.news(`${x.ic} Senaryo: ${x.name}. Hedef: ${x.goal}.`, 'good');
    Game.save();
    Game._fresh = true;
    Game.tab = 'home';
    Game.enterHub();
    Game.modal(`<div class="ev-tag">${x.ic} Senaryo</div><h2>${x.name}</h2><p>${x.d}</p><p><b>${U.esc(club.name)}</b> · ${x.age} yaş · Güç ${Player.overall(p)}</p><div class="scn-goal">🎯 ${x.goal}</div>`, [{ t: 'Başlayalım!', cls: 'btn-big' }]);
  },
  card() {
    const s = Game.state, sc = s && s.scenario;
    if (!sc || sc.res || sc.year !== s.season.year) return '';
    const x = Scenario.def(sc.id);
    if (!x) return '';
    const pr = x.prog ? x.prog(s) : null;
    return `<section class="card scn-card"><div class="card-h"><span>${x.ic} Senaryo: ${x.name}</span><small class="muted">sezon sonu</small></div>
      <div class="scn-goal">🎯 ${x.goal}${pr ? ` <b>${Math.min(pr[0], pr[1])}/${pr[1]}</b>` : ''}</div>${pr ? `<div class="msn-bar"><i style="width:${Math.min(100, (pr[0] / pr[1]) * 100)}%"></i></div>` : ''}</section>`;
  },
  // sezon sonunda değerlendirme (ilk sezon)
  async result() {
    const s = Game.state, sc = s.scenario, se = s.seasonEnd;
    if (!sc || sc.res || !se || sc.year !== se.year) return;
    const x = Scenario.def(sc.id);
    const ok = !!x.ok(se);
    sc.res = ok ? 'win' : 'lose';
    if (ok) {
      const b = Scenario.badges(); b[x.id] = se.year; Meta.set('sf_badges', b);
      s.player.trophies.push(`${se.year}: 🎯 Senaryo: ${x.name}`);
      Game.news(`🎯 Senaryo başarıldı: ${x.name}! Rozet kazandın.`, 'good');
      if (typeof Sfx !== 'undefined') { Sfx.play('fanfare'); Sfx.buzz('success'); }
    } else Game.news(`Senaryo hedefi tutmadı: ${x.name}. Kariyerin devam ediyor.`, 'bad');
    Game.save();
    await new Promise((res) => Game.modal(`<div class="ev-tag">${x.ic} Senaryo sonucu</div><h2>${ok ? 'Başardın! 🏅' : 'Olmadı...'}</h2><div class="scn-goal">🎯 ${x.goal}</div><p>${ok ? `<b>${x.name}</b> rozeti artık senin. Kariyerine istediğin kadar devam edebilirsin.` : 'Hedefi tutturamadın ama hikâyen bitmedi. Kariyerine devam edebilir ya da senaryoyu yeniden deneyebilirsin.'}</p>`, [{ t: 'Devam', fn: res }]));
  },
};

// ---------- Paylaşılabilir kartlar ----------
const ShareCard = {
  W: 1080, H: 1350,
  base(kicker) {
    const s = Game.state, p = s.player, club = Game.club() || { c1: '#c8102e', c2: '#ffffff', name: '' };
    const cv = document.createElement('canvas'); cv.width = ShareCard.W; cv.height = ShareCard.H;
    const c = cv.getContext('2d'), W = cv.width, H = cv.height;
    const g = c.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, club.c1); g.addColorStop(0.55, '#0d1424'); g.addColorStop(1, '#05070d');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.save(); c.globalAlpha = 0.09; c.fillStyle = club.c2;
    for (let i = -4; i < 14; i++) { c.beginPath(); c.moveTo(i * 130, 0); c.lineTo(i * 130 + 60, 0); c.lineTo(i * 130 + 60 - 500, H); c.lineTo(i * 130 - 500, H); c.fill(); }
    c.restore();
    const rg = c.createRadialGradient(W / 2, H * 0.42, 20, W / 2, H * 0.42, W * 0.6);
    rg.addColorStop(0, 'rgba(255,215,120,.28)'); rg.addColorStop(1, 'rgba(255,215,120,0)');
    c.fillStyle = rg; c.fillRect(0, 0, W, H);
    c.textAlign = 'left'; c.fillStyle = '#fff'; c.font = 'italic 900 64px "Saira Condensed", sans-serif';
    c.fillText('STAR', 64, 110); const w1 = c.measureText('STAR').width; c.fillStyle = '#ffc93a'; c.fillText('FOOT', 64 + w1, 110);
    c.textAlign = 'right'; c.fillStyle = 'rgba(255,255,255,.75)'; c.font = '700 34px "Saira Condensed", sans-serif';
    c.fillText(kicker.toLocaleUpperCase(I18N.lang === 'en' ? 'en' : 'tr'), W - 64, 104);
    return { cv, c, W, H, s, p, club };
  },
  figure(o, x, y, h) {
    const kit = Sprites.kit(o.club, false);
    Sprites.figure(o.c, x, y, h, { kit, look: Sprites.look(7), facing: 'down', number: o.p.shirt, t: 0 });
  },
  nameBlock(o, y) {
    const { c, W, p } = o;
    c.textAlign = 'center'; c.fillStyle = '#fff'; c.font = '900 92px "Saira Condensed", sans-serif';
    c.fillText(Player.fullName(p).toLocaleUpperCase(I18N.lang === 'en' ? 'en' : 'tr'), W / 2, y);
    c.fillStyle = 'rgba(255,255,255,.75)'; c.font = '600 38px "Saira Condensed", sans-serif';
    c.fillText(`${Game.teamName()} · ${p.age} yaş · ${POSITIONS[p.position].l}`, W / 2, y + 56);
  },
  stats(o, y, items) {
    const { c, W } = o, n = items.length, bw = (W - 128 - (n - 1) * 20) / n;
    items.forEach(([l, v], i) => {
      const x = 64 + i * (bw + 20);
      c.fillStyle = 'rgba(255,255,255,.08)'; ShareCard.rr(c, x, y, bw, 150, 22); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 2; c.stroke();
      c.textAlign = 'center'; c.fillStyle = '#ffc93a'; c.font = '900 72px "Saira Condensed", sans-serif'; c.fillText(String(v), x + bw / 2, y + 86);
      c.fillStyle = 'rgba(255,255,255,.7)'; c.font = '700 28px "Saira Condensed", sans-serif'; c.fillText(String(l).toLocaleUpperCase(I18N.lang === 'en' ? 'en' : 'tr'), x + bw / 2, y + 128);
    });
  },
  foot(o) {
    const { c, W, H } = o;
    c.textAlign = 'center'; c.fillStyle = 'rgba(255,255,255,.55)'; c.font = '600 30px "Saira Condensed", sans-serif';
    c.fillText('StarFoot · App Store & Google Play', W / 2, H - 50);
  },
  rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); },
  // sezon kartı
  season() {
    const s = Game.state, se = s.seasonEnd;
    const o = ShareCard.base(`${se ? se.year : s.season.year} sezonu`);
    ShareCard.figure(o, o.W / 2, 760, 560);
    ShareCard.nameBlock(o, 870);
    const ss = se ? se.stats : s.season.stats, avg = se ? se.avg : (ss.apps ? ss.ratingSum / ss.apps : 0);
    ShareCard.stats(o, 960, [['Maç', ss.apps], ['Gol', ss.goals], ['Asist', ss.assists], ['Reyting', avg ? avg.toFixed(1) : '-']]);
    const aw = se ? (se.trophies || []).concat(se.cupWins || []) : [];
    const { c, W } = o;
    c.textAlign = 'center'; c.fillStyle = '#fff'; c.font = '700 36px "Saira Condensed", sans-serif';
    c.fillText(aw.length ? '🏆 ' + aw.slice(0, 2).map((t) => U.plain(t).replace(/\s*\(\d+\)$/, '')).join(' · ') : se ? `${se.compName} · ${se.pos}.` : Game.teamName(), W / 2, 1185);
    ShareCard.foot(o);
    return o.cv;
  },
  // oyuncu kartı
  player() {
    const o = ShareCard.base('Oyuncu kartı'), { c, W, p } = o;
    const ovr = Player.overall(p);
    c.textAlign = 'left'; c.fillStyle = '#ffc93a'; c.font = '900 140px "Saira Condensed", sans-serif'; c.fillText(String(ovr), 70, 290);
    c.fillStyle = '#fff'; c.font = '800 44px "Saira Condensed", sans-serif'; c.fillText(POSITIONS[p.position].short, 76, 340);
    ShareCard.figure(o, W / 2, 780, 580);
    ShareCard.nameBlock(o, 880);
    const t = p.totals;
    ShareCard.stats(o, 970, [['Maç', t.apps], ['Gol', t.goals], ['Asist', t.assists], ['Kupa', p.trophies.length]]);
    c.textAlign = 'center'; c.fillStyle = 'rgba(255,255,255,.85)'; c.font = '700 36px "Saira Condensed", sans-serif';
    c.fillText(`${(p.traits || []).length ? '⚡ ' + p.traits.slice(0, 3).map((id) => (TRAITS.find((x) => x.id === id) || {}).name).filter(Boolean).join(' · ') : `⭐ Ün ${Math.round(p.fame)}`}`, W / 2, 1190);
    ShareCard.foot(o);
    return o.cv;
  },
  // kupa kartı
  trophy(title, sub) {
    const o = ShareCard.base('Kupa'), { c, W } = o;
    SocialArt.glow(c, W / 2, 360, 300, 'rgba(255,220,120,0.55)', 1);
    SocialArt.trophyCup(c, W / 2, 380, 120);
    ShareCard.figure(o, W / 2, 800, 380);
    c.textAlign = 'center'; c.fillStyle = '#ffc93a'; c.font = '900 96px "Saira Condensed", sans-serif';
    c.fillText(String(title).toLocaleUpperCase(I18N.lang === 'en' ? 'en' : 'tr'), W / 2, 930);
    c.fillStyle = '#fff'; c.font = '700 44px "Saira Condensed", sans-serif'; c.fillText(sub || '', W / 2, 995);
    ShareCard.nameBlock(o, 1110);
    ShareCard.foot(o);
    return o.cv;
  },
  async send(cv, text) {
    if (typeof Sfx !== 'undefined') Sfx.play('shutter');
    const url = cv.toDataURL('image/png');
    const name = `starfoot-${Date.now()}.png`;
    const C = window.Capacitor, native = C && C.isNativePlatform && C.isNativePlatform() && C.Plugins;
    try {
      if (native && C.Plugins.Filesystem && C.Plugins.Share) {
        const r = await C.Plugins.Filesystem.writeFile({ path: name, data: url.split(',')[1], directory: 'CACHE' });
        await C.Plugins.Share.share({ title: 'StarFoot', text, files: [r.uri], dialogTitle: 'Paylaş' });
        return;
      }
      const blob = await (await fetch(url)).blob();
      const file = new File([blob], name, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text }); return; }
    } catch (e) {
      if (e && (e.name === 'AbortError' || /cancel/i.test(e.message || ''))) return;
    }
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    Game.toast('Görsel indirildi.', 'good');
  },
  // önizleme + paylaş (açık modalı bozmamak için ayrı katman)
  preview(cv, text) {
    const el = U.el(`<div class="sh-ov"><div class="sh-box"><img alt="" src="${cv.toDataURL('image/png')}"><div class="sh-btns"><button class="btn btn-ghost" data-x>Kapat</button><button class="btn" data-s>${Icon('share')} Paylaş</button></div></div></div>`);
    document.body.appendChild(el);
    el.querySelector('[data-x]').onclick = () => el.remove();
    el.querySelector('[data-s]').onclick = () => ShareCard.send(cv, text);
    el.onclick = (e) => { if (e.target === el) el.remove(); };
    return el;
  },
  text() { return I18N.lang === 'en' ? 'My StarFoot career ⚽ #StarFoot' : 'StarFoot kariyerim ⚽ #StarFoot'; },
};

// ---------- Gizlilik politikası: uygulama içinde açılır ----------
// iPhone/Android uygulamasında target=_blank bağlantılar yeni pencere açamaz; politika bir katmanda gösterilir.
const PrivacyView = {
  open() {
    if (document.querySelector('.pv-ov')) return;
    const el = document.createElement('div');
    el.className = 'pv-ov';
    el.innerHTML = `<div class="pv-box"><div class="pv-bar"><b>${I18N.lang === 'en' ? 'Privacy Policy' : 'Gizlilik Politikası'}</b><button class="btn btn-ghost" data-x>${I18N.lang === 'en' ? 'Close' : 'Kapat'}</button></div><iframe src="privacy.html${I18N.lang === 'en' ? '#en' : ''}" title="Privacy Policy"></iframe></div>`;
    el.setAttribute('data-noi18n', '');
    document.body.appendChild(el);
    el.querySelector('[data-x]').onclick = () => el.remove();
  },
};
document.addEventListener('click', (e) => {
  const a = e.target.closest && e.target.closest('[data-privacy]');
  if (!a) return;
  e.preventDefault();
  PrivacyView.open();
});
