// Premium "Yıldız gibi yaşa" ayrıcalıkları: altın onay rozeti, Starpedia sayfası, kariyer belgeseli,
// transfer talebi, görünüm stüdyosu ve lüks yaşam vitrini. Premium olmayanlar tanıtımı görür.

// Lüks yaşam vitrini: oyun parasıyla alınır, alınca sosyal medyada paylaşılır
const LUX = [
  { id: 'watch', n: 'Altın kronograf saat', price: 450000, art: 'watch', scene: 'city', post: 'Bileğime yeni bir dost ⌚ Zaman kıymetli.' },
  { id: 'suv', n: 'Siyah lüks SUV', price: 1800000, art: 'suv', scene: 'car', post: 'Yeni araba, yeni yolculuklar 🚙' },
  { id: 'sport', n: 'Kırmızı spor araba', price: 6500000, art: 'sport', scene: 'car', post: 'Kırmızı her zaman yakışır 🏎️ Yeni araba geldi!' },
  { id: 'villa', n: 'Deniz manzaralı villa', price: 15000000, art: 'villa', scene: 'home', post: 'Yeni Villa, yeni başlangıç 🏡 Manzaraya bakın!' },
  { id: 'hyper', n: 'Hiper araba', price: 24000000, art: 'hyper', scene: 'car', post: '0-100 sadece 2,4 saniye ⚡ Garajın yeni yıldızı bu araba.' },
  { id: 'mansion', n: 'Tepedeki malikâne', price: 48000000, art: 'mansion', scene: 'home', post: 'Ailemle yeni yuvamız: tepedeki Villa 🏰' },
  { id: 'yacht', n: 'Lüks yat', price: 85000000, art: 'yacht', scene: 'yacht', post: 'Sezon arası yat keyfi 🛥️ Mavi her yerde.' },
  { id: 'jet', n: 'Özel jet', price: 160000000, art: 'jet', scene: 'city', post: 'Deplasmanlara artık kendi jetimle ✈️' },
];

const Star = {
  has() { return typeof Premium !== 'undefined' && Premium.active; },
  // Ayrıcalıklar yalnız Premium'un satın alınabildiği yerde (iOS) ya da Premium sahiplerine görünür
  on() { return Star.has() || (typeof Premium !== 'undefined' && Premium.available()) || !!window.SF_PREVIEW; },

  // Premium olmayanlara ayrıcalıkların tanıtımı
  pitch(feat, src, after) {
    const can = typeof Premium !== 'undefined' && Premium.available();
    src = src || 'perks';
    if (typeof Premium !== 'undefined') Premium.track('premium_view', { source: src });
    const btns = [{ t: 'Kapat', cls: 'btn-ghost' }];
    if (can) btns.push({ t: `${Icon('star')} Premium al${Premium.price ? ` · ${U.esc(Premium.price)}` : ''}`, cls: 'btn-big', fn: () => { Premium.src = src; Premium.buy(); } });
    Game.modal(`<div class="ev-tag">Premium ayrıcalığı</div><h2>${Icon('star')} Yıldız gibi yaşa</h2>
      ${after ? `<p>${after}</p>` : feat ? `<p><b>${U.esc(feat)}</b> StarFoot Premium'a özel.</p>` : ''}
      ${Star.perksHtml()}
      <p class="muted">${can ? 'Tek seferlik satın alma, tüm kariyerlerinde geçerli.' : 'StarFoot Premium App Store uygulamasında satın alınabilir.'}</p>`, btns, { wide: true });
  },

  // Tadımlık: Premium olmayan oyuncu Starpedia'yı ve belgeseli bir kez tam açabilir
  TASTE: 'starfoot_taste',
  tasted(k) { try { return !!JSON.parse(localStorage.getItem(Star.TASTE) || '{}')[k]; } catch (e) { return true; } },
  taste(k) {
    let t = {};
    try { t = JSON.parse(localStorage.getItem(Star.TASTE) || '{}'); } catch (e) { /* yok */ }
    t[k] = Date.now();
    try { localStorage.setItem(Star.TASTE, JSON.stringify(t)); } catch (e) { /* yok */ }
    if (typeof Premium !== 'undefined') Premium.track('premium_taste', { feature: k });
  },
  // Premium yoksa: tadımlık hakkı varsa kullanır (true), yoksa tanıtımı açar (false)
  gate(k, feat) {
    if (Star.has()) return 'full';
    if (!Star.tasted(k)) { Star.taste(k); return 'taste'; }
    Star.pitch(feat, k);
    return '';
  },
  free(k) { return !Star.has() && !Star.tasted(k); },

  // Tam ekran katmanlar (Starpedia, belgesel): açarken arka planın kaydırmasını kilitler,
  // kapatırken katmanı önce gizleyip kaldırır ve oyunu yeniden çizdirir.
  // iOS WebView'da kaydırılabilir sabit katman doğrudan silinince ekranda beyaz bir iz kalabiliyor.
  cover(el, cls) {
    Star._y = window.scrollY || 0;
    document.body.appendChild(el);
    document.body.classList.add('ov-open', cls);
  },
  uncover(el, cls) {
    if (el) { el.style.display = 'none'; el.remove(); }
    document.body.classList.remove(cls);
    if (!document.querySelector('.sp, .doc')) document.body.classList.remove('ov-open');
    try { if (Game.state && !document.getElementById('hub').classList.contains('hidden')) Game.render(); } catch (e) { /* çizim yok */ }
    window.scrollTo(0, Star._y || 0);
    const h = document.getElementById('hub');
    if (h) {
      h.style.opacity = '0.999';
      requestAnimationFrame(() => requestAnimationFrame(() => { h.style.opacity = ''; }));
    }
  },

  perksHtml() {
    return `<ul class="prem-l star-perks">
      <li><b>Altın onay rozeti ve Starpedia</b><small>Kendi ansiklopedi sayfan</small></li>
      <li><b>Lüks yaşam vitrini</b><small>Süper arabalar, villalar, yat ve özel jet</small></li>
      <li><b>Transfer talebi</b><small>İstediğin an kulüplerden teklif iste</small></li>
      <li><b>Görünüm stüdyosu ve kariyer belgeseli</b><small>Tarzını seç, hikâyeni izle</small></li>
      <li><b>Reklamsız</b><small>Geçiş reklamı yok, ödüller reklam izlemeden</small></li>
    </ul>`;
  },

  // Oyun içi Instagram rozeti: Premium'da altın, ünlüyken mavi
  badge(verified) {
    if (Star.has()) return Star.gold();
    return verified && typeof IG !== 'undefined' ? IG.verified() : '';
  },
  gold() {
    return '<svg class="igv igv-gold" viewBox="0 0 40 40"><defs><linearGradient id="igvg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe27a"/><stop offset=".55" stop-color="#f5b400"/><stop offset="1" stop-color="#c98a00"/></linearGradient></defs><path fill="url(#igvg)" d="M19.998 3.094 14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094Z"/><path fill="#fff" d="m17.2 27.7-7-6.9 2.5-2.5 4.5 4.4 9.6-9.6 2.5 2.5z"/></svg>';
  },

  // Profil sekmesindeki ayrıcalık kartı
  hubCard() {
    if (!Game.p || !Star.on()) return '';
    const on = Star.has();
    const lock = on ? '' : `<i class="st-lock">${Icon('star')}</i>`;
    const tile = (k, ic, t, d) => {
      const fr = k === 'studio' ? !on : (k === 'wiki' || k === 'doc') && Star.free(k);
      return `<button class="st-tile ${on ? '' : 'locked'} ${fr ? 'free' : ''}" data-star="${k}"><span class="st-ic">${Icon(ic)}</span><span class="st-t"><b>${t}</b><small>${d}</small></span>${fr ? `<i class="st-free">${k === 'studio' ? 'Dene' : '1 kez ücretsiz'}</i>` : lock}</button>`;
    };
    return `<section class="card star-hub ${on ? 'on' : ''}">
      <div class="card-h"><span>${Icon('star')} Yıldız Ayrıcalıkları</span>${on ? `<span class="st-badge">${Star.gold()} Premium</span>` : '<small class="muted">Premium</small>'}</div>
      <div class="st-grid">
        ${tile('wiki', 'news', 'Starpedia', 'Ansiklopedideki sayfan')}
        ${tile('doc', 'play', 'Belgesel', 'Kariyerinin hikâyesi')}
        ${tile('studio', 'smile', 'Görünüm', 'Saç, sakal, krampon')}
        ${tile('transfer', 'mail', 'Transfer talebi', 'Kulüplerden teklif iste')}
      </div>
    </section>`;
  },

  // ---------- Görünüm stüdyosu ----------
  STYLES: [['short', 'Kısa'], ['buzz', 'Asker tıraşı'], ['side', 'Yana tarama'], ['long', 'Uzun'], ['curly', 'Kıvırcık'], ['mohawk', 'Mohikan'], ['bun', 'Topuz'], ['bald', 'Kel']],
  HAIRX: ['#e6dcc4', '#b5482c'],
  BOOTS: ['#16181d', '#f4f4f4', '#ff3b30', '#ffd60a', '#30d158', '#0a84ff', '#ff6ec7', '#f5b400'],
  studio() {
    const p = Game.p;
    const on = Star.has();
    if (!on && typeof Premium !== 'undefined') Premium.track('premium_taste', { feature: 'studio' });
    const cur = Object.assign({ boots: '#16181d' }, Sprites.me(p));
    const sw = (k, list) => list.map((c) => `<button class="stu-sw ${cur[k] === c ? 'on' : ''}" data-k="${k}" data-v="${c}" style="background:${c}" aria-label="${c}"></button>`).join('');
    const m = Game.modal(`<div class="studio">
      <h2>${Icon('smile')} Görünüm Stüdyosu</h2>
      ${on ? '' : `<p class="stu-try">${Icon('star')} Dilediğin kadar dene. Kaydetmek Premium'a özel.</p>`}
      <div class="stu-wrap"><canvas class="stu-cv" width="320" height="400"></canvas>
      <div class="stu-opts">
        <div class="lbl">Ten rengi</div><div class="stu-row">${sw('skin', SKINS)}</div>
        <div class="lbl">Saç modeli</div><div class="chip-row">${Star.STYLES.map(([k, l]) => `<button class="chip ${cur.style === k ? 'on' : ''}" data-k="style" data-v="${k}">${l}</button>`).join('')}</div>
        <div class="lbl">Saç rengi</div><div class="stu-row">${sw('hair', HAIRS.concat(Star.HAIRX))}</div>
        <div class="lbl">Sakal</div><div class="chip-row"><button class="chip ${cur.beard ? '' : 'on'}" data-k="beard" data-v="0">Yok</button><button class="chip ${cur.beard ? 'on' : ''}" data-k="beard" data-v="1">Var</button></div>
        <div class="lbl">Krampon</div><div class="stu-row">${sw('boots', Star.BOOTS)}</div>
      </div></div></div>`, [
      { t: 'Varsayılan', cls: 'btn-ghost', keep: true, fn: () => { Object.assign(cur, Sprites.look(7), { boots: '#16181d' }); sync(); } },
      { t: 'Vazgeç', cls: 'btn-ghost' },
      { t: on ? 'Kaydet' : `${Icon('star')} Kaydet`, cls: 'btn-big', fn: () => { if (!on) return setTimeout(() => Star.pitch('Görünüm stüdyosu', 'studio', 'Yeni görünümün çok yakıştı! Kaydetmek ve maçlarda, Instagram\'da bu görünümle çıkmak için Premium gerekir.'), 60); p.look = Object.assign({}, cur); if (typeof SocialArt !== 'undefined') SocialArt.cache.clear(); Game.save(); Game.render(); Game.toast('Yeni görünümün kaydedildi.', 'good'); } },
    ], { wide: true });
    const cv = m.querySelector('.stu-cv');
    const draw = () => {
      const c = cv.getContext('2d');
      c.clearRect(0, 0, cv.width, cv.height);
      const club = Game.inStreet() ? { id: 'X', c1: '#2a6fdb', c2: '#ffffff' } : Game.club();
      const g = c.createRadialGradient(160, 140, 20, 160, 160, 260);
      g.addColorStop(0, Sprites.shade(club.c1, -0.1)); g.addColorStop(1, '#0b1020');
      c.fillStyle = g; c.fillRect(0, 0, cv.width, cv.height);
      Sprites.figure(c, 160, 380, 340, { kit: Sprites.kit(club, false), look: cur, facing: 'down', number: p.shirt, t: 0 });
    };
    const sync = () => {
      U.$$('[data-k]', m).forEach((b) => {
        const k = b.dataset.k, v = b.dataset.v;
        b.classList.toggle('on', k === 'beard' ? String(cur.beard ? 1 : 0) === v : cur[k] === v);
      });
      draw();
    };
    U.$$('[data-k]', m).forEach((b) => (b.onclick = () => {
      const k = b.dataset.k, v = b.dataset.v;
      if (k === 'beard') cur.beard = v === '1';
      else cur[k] = v;
      if (k === 'style') cur.bald = v === 'bald';
      sync();
    }));
    draw();
  },

  // ---------- Transfer talebi ----------
  transferReq() {
    const s = Game.state, p = Game.p;
    if (!Star.has()) return Star.pitch('Transfer talebi', 'transfer');
    if (Game.inStreet() || Game.isYouth()) return Game.toast('Transfer talebi profesyonel sözleşmeyle açılır.', 'info');
    const half = s.season.round < Game.rounds() / 2 ? 1 : 2;
    if (s.tReq && s.tReq.y === s.season.year && s.tReq.h === half) return Game.toast('Bu devre için zaten transfer talebinde bulundun.', 'info');
    if (s.offers && s.offers.some((o) => o.req)) return Game.toast('Menajerinin getirdiği teklifler hâlâ masada.', 'info');
    Game.modal(`<h3>${Icon('mail')} Transfer talebi</h3><p>Menajerin kulüplerle görüşüp sana teklif toplayacak. Teklifler 2 hafta geçerli olur.</p><p class="muted">Kulübünden ayrılmak istediğini duyurmak hocanı ve taraftarı biraz kırabilir.</p>`, [
      { t: 'Vazgeç', cls: 'btn-ghost' },
      { t: 'Talep et', cls: 'btn-big', fn: () => {
        const offers = Game.makeOffers(Math.max(3, Game.offerCount(3, 5)), false, (s.offers || []).map((o) => o.clubId))
          .map((o) => Object.assign(o, { req: true, exp: s.season.round + 2 }));
        if (!offers.length) return Game.toast('Şu an seninle ilgilenen bir kulüp bulunamadı. Biraz form tut, tekrar dene.', 'info');
        s.tReq = { y: s.season.year, h: half };
        s.offers = (s.offers || []).concat(offers);
        p.rel.coach = U.clamp(p.rel.coach - 6, 0, 100);
        p.rel.fans = U.clamp(p.rel.fans - 3, 0, 100);
        Game.news(`📨 Transfer talebin kulüplere ulaştı: ${offers.length} kulüp teklif yaptı! Teklifler 2 hafta geçerli.`, 'good');
        Game.toast(`📨 ${offers.length} kulüp teklif yaptı!`, 'good');
        Game.save();
        Game.tab = 'home'; Game.render(); window.scrollTo(0, 0);
      } },
    ]);
  },

  // ---------- Kariyer verileri (Starpedia ve belgesel) ----------
  data(p, s) {
    p = p || Game.p; s = s || Game.state;
    const year = s.season.year;
    const birth = year - p.age;
    const nat = Game.nat(p.nation) || { name: p.nation };
    const hist = (p.history || []).slice();
    const youthRe = /\bU\d{2}\b|Sokak|Mahalle/;
    const groups = [];
    hist.forEach((h) => {
      const g = groups[groups.length - 1];
      if (g && g.club === h.club) { g.to = h.year; g.apps += h.apps; g.goals += h.goals; g.assists += h.assists; g.n++; }
      else groups.push({ club: h.club, from: h.year, to: h.year, apps: h.apps, goals: h.goals, assists: h.assists, n: 1, youth: youthRe.test(h.club) || youthRe.test(h.league || '') });
    });
    const pro = groups.filter((g) => !g.youth);
    const youth = groups.filter((g) => g.youth);
    const firstPro = hist.find((h) => !youthRe.test(h.club) && !youthRe.test(h.league || ''));
    const clubByName = (n) => Object.values(s.world.clubs).find((c) => c.name === String(n).replace(/\s+U\d{2}$/, ''));
    const tro = (p.trophies || []).map((t) => { const [y, ...r] = U.plain(t).split(':'); return { y: +y, t: r.join(':').trim() }; });
    const stars = tro.filter((x) => /Altın Yıldız/.test(x.t)).length;
    const bestG = hist.filter((h) => !youthRe.test(h.club)).sort((a, b) => b.goals - a.goals)[0];
    const bestA = hist.filter((h) => !youthRe.test(h.club)).sort((a, b) => b.assists - a.assists)[0];
    const bestR = hist.filter((h) => h.apps >= 10).sort((a, b) => b.avg - a.avg)[0];
    const bigT = (p.transfers || []).filter((x) => x.fee).sort((a, b) => b.fee - a.fee)[0];
    const top = STATS.slice().sort((a, b) => p.stats[b.k] - p.stats[a.k]);
    return { p, s, year, birth, nat, hist, groups, pro, youth, firstPro, clubByName, tro, stars, bestG, bestA, bestR, bigT, top };
  },

  // ---------- Starpedia ----------
  wikiAuto(d, key) {
    const p = d.p, t = p.totals, S = (x) => `<span>${x}</span>`;
    const full = U.esc(Player.fullName(p));
    const pos = POSITIONS[p.position].l.toLocaleLowerCase('tr');
    const club = Game.inStreet() ? '' : U.esc(Game.teamName());
    if (key === 'lead') {
      const out = [];
      out.push(S(Game.inStreet() ? `<b>${full}</b> (${d.birth}, ${U.esc(d.nat.name)}), mahalle maçlarında adını duyurmaya başlayan genç bir futbolcudur.`
        : Game.isYouth() ? `<b>${full}</b> (${d.birth}, ${U.esc(d.nat.name)}), ${club} altyapısında ${pos} olarak forma giyen genç futbolcudur.`
          : `<b>${full}</b> (${d.birth}, ${U.esc(d.nat.name)}), ${club} takımında ${pos} olarak forma giyen profesyonel futbolcudur.`));
      if (t.apps) out.push(S(`Kariyerinde ${t.apps} maçta ${t.goals} gol ve ${t.assists} asist kaydetmiştir.`));
      if (d.tro.length) out.push(S(`Kariyeri boyunca ${d.tro.length} kupa ve bireysel ödül kazanmıştır.`));
      if (p.intl.caps) out.push(S(`${U.esc(d.nat.name)} millî takımında ${p.intl.caps} maça çıkıp ${p.intl.goals} gol atmıştır.`));
      if (d.stars) out.push(S(`${d.stars} kez Altın Yıldız ödülüne layık görülmüştür.`));
      return out.join(' ');
    }
    if (key === 'early') {
      const out = [S(`${d.birth} yılında doğdu. Futbola ${U.esc(d.nat.name)} sokaklarında, mahalle maçlarında başladı.`)];
      if (p.parents && p.parents.m && p.parents.m !== p.nation) { const m = Game.nat(p.parents.m); if (m) out.push(S(`Annesi ${U.esc(m.name)} kökenlidir.`)); }
      if (d.youth.length) out.push(S(`Altyapı yıllarını ${U.esc(d.youth[0].club.replace(/\s+U\d{2}$/, ''))} bünyesinde geçirdi.`));
      if (d.firstPro) out.push(S(`${d.firstPro.age} yaşında ${U.esc(d.firstPro.club)} ile ilk profesyonel sözleşmesini imzaladı.`));
      return out.join(' ');
    }
    if (key === 'style') {
      const a = d.top[0], b = d.top[1];
      const out = [S(`${p.foot === 'L' ? 'Sol' : 'Sağ'} ayaklı bir ${pos} oyuncusudur. En güçlü yönleri: ${a.l} (${Math.floor(p.stats[a.k])}) ve ${b.l} (${Math.floor(p.stats[b.k])}).`)];
      const tr = (p.traits || []).map((x) => (typeof TRAITS !== 'undefined' ? (TRAITS.find((q) => q.id === (x.id || x)) || {}).name : null)).filter(Boolean);
      if (tr.length) out.push(S(`Özel yetenekleri: ${tr.map(U.esc).join(', ')}.`));
      return out.join(' ');
    }
    if (key === 'personal') {
      const L = p.life || {}, out = [];
      if (L.gf) out.push(S(L.gf.married ? `${U.esc(L.gf.name)} ile evlidir.` : `${L.gf.since} yılından beri ${U.esc(L.gf.name)} ile birliktedir.`));
      if (L.sponsors && L.sponsors.length) out.push(S(`${L.sponsors.length} sponsorluk anlaşması bulunmaktadır.`));
      const lux = (p.lux || []).map((id) => (LUX.find((x) => x.id === id) || {}).n).filter(Boolean);
      if (lux.length) out.push(`<span>Koleksiyonu:</span> ${lux.map((x) => `<span>${U.esc(x)}</span>`).join(', ')}.`);
      const so = p.social;
      if (so && so.followers) out.push(S(`Sosyal medyada ${Social.fmt(so.followers)} takipçisi vardır.`));
      if (!out.length) out.push(S('Özel hayatını gözlerden uzak yaşamayı tercih etmektedir.'));
      return out.join(' ');
    }
    return '';
  },

  wikiSec(d, key, title) {
    const w = (d.p.wiki || {})[key];
    return `<h2 id="sp-${key}">${title}<a class="sp-edit" data-star="wiki-edit" data-key="${key}">[değiştir]</a></h2>
      ${w ? `<p class="sp-own" data-noi18n>${U.esc(w).replace(/\n/g, '<br>')}</p>` : `<p>${Star.wikiAuto(d, key)}</p>`}`;
  },

  wiki(p, s) {
    const mode = document.getElementById('spedia') ? (Star.has() ? 'full' : 'taste') : Star.gate('wiki', 'Starpedia sayfası');
    if (!mode) return;
    const d = Star.data(p, s);
    p = d.p; s = d.s;
    const t = p.totals;
    const full = U.esc(Player.fullName(p));
    const cur = Game.inStreet() ? null : Game.club();
    const height = 168 + (((p.name.length * 7 + p.surname.length * 13) % 19)) + (p.position === 'DF' ? 4 : p.position === 'FW' ? 1 : 0);
    const infoRows = (rows) => rows.filter(Boolean).map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('');
    const careerRows = d.pro.map((g) => `<tr><td>${g.from === g.to ? g.from : `${g.from}–${g.to}`}</td><td>${U.esc(g.club)}</td><td>${g.apps}</td><td>(${g.goals})</td></tr>`).join('');
    const intl = [p.intl.caps ? [U.esc(d.nat.name), p.intl.caps, p.intl.goals] : null].concat(['U21', 'U19'].map((c) => (p.intlY && p.intlY[c] ? [`${U.esc(d.nat.name)} ${c}`, p.intlY[c].caps, p.intlY[c].goals] : null))).filter(Boolean);
    const secs = [['early', 'Erken yaşamı'], ['club', 'Kulüp kariyeri'], ['intl', 'Uluslararası kariyeri'], ['style', 'Oyun tarzı'], ['personal', 'Kişisel yaşamı'], ['stats', 'Kariyer istatistikleri'], ['honours', 'Başarılar'], ['records', 'Rekorlar'], ['matches', 'Önemli maçlar']];
    const clubSec = d.pro.length ? d.pro.map((g) => {
      const tr = (p.transfers || []).find((x) => x.to === g.club);
      const ts = d.tro.filter((x) => x.y >= g.from && x.y <= g.to).map((x) => x.t.replace(/\s*\(\d+\)$/, ''));
      return `<h3>${U.esc(g.club)} (${g.from === g.to ? g.from : `${g.from}–${g.to}`})</h3><p>
        ${tr ? `<span>${tr.fee ? `${U.esc(tr.from)} kulübünden ${U.money(tr.fee)} bonservisle transfer oldu.` : `${U.esc(tr.from)} kulübünden bonservissiz olarak katıldı.`}</span> ` : ''}
        <span>${g.n} sezonda ${g.apps} maça çıktı, ${g.goals} gol ve ${g.assists} asist üretti.</span>
        ${ts.length ? ` <span>Bu dönemde kazandığı başarılar:</span> ${ts.map((x) => `<span>${U.esc(x)}</span>`).join(', ')}.` : ''}</p>`;
    }).join('') : '<p><span>Henüz profesyonel kariyerine başlamamıştır.</span></p>';
    const intlSec = intl.length ? `<p>${intl.map(([n, c, g]) => `<span>${n} formasıyla ${c} maçta ${g} gol attı.</span>`).join(' ')}</p>` : '<p><span>Henüz millî takım formasıyla sahaya çıkmamıştır.</span></p>';
    const live = typeof UI !== 'undefined' && UI.liveSeason ? UI.liveSeason() : null;
    const statRows = d.hist.concat(live && live.apps ? [Object.assign({}, live, { club: live.club || Game.teamName() })] : []).map((h) => `<tr><td>${h.year}${h.live ? '*' : ''}</td><td>${U.esc(h.club)}</td><td>${U.esc(h.league || '')}</td><td>${h.apps}</td><td>${h.goals}</td><td>${h.assists}</td><td>${h.avg ? Number(h.avg).toFixed(2) : '-'}</td></tr>`).join('');
    const honours = d.tro.length ? `<ul>${d.tro.slice().reverse().map((x) => `<li>${U.esc(x.t)} <small>(${x.y})</small></li>`).join('')}</ul>` : '<p><span>Henüz bir kupa kazanmamıştır.</span></p>';
    const rec = [
      d.bestG && d.bestG.goals ? `<li><span>Bir sezonda en çok gol: <b>${d.bestG.goals}</b> (${d.bestG.year}, ${U.esc(d.bestG.club)})</span></li>` : '',
      d.bestA && d.bestA.assists ? `<li><span>Bir sezonda en çok asist: <b>${d.bestA.assists}</b> (${d.bestA.year})</span></li>` : '',
      d.bestR ? `<li><span>En yüksek sezon reytingi: <b>${Number(d.bestR.avg).toFixed(2)}</b> (${d.bestR.year})</span></li>` : '',
      d.bigT ? `<li><span>Rekor bonservis: <b>${U.money(d.bigT.fee)}</b> (${U.esc(d.bigT.to)}, ${d.bigT.y})</span></li>` : '',
      t.motm ? `<li><span>Maçın adamı ödülü: <b>${t.motm}</b></span></li>` : '',
    ].join('');
    const mm = (p.motmAwards || []).slice().sort((a, b) => b.r - a.r).slice(0, 6);
    const matches = mm.length ? `<table class="sp-tbl"><tr><th>Yıl</th><th>Rakip</th><th>Gol</th><th>Asist</th><th>Reyting</th></tr>${mm.map((m) => `<tr><td>${m.y}</td><td>${U.esc(m.opp)}</td><td>${m.g}</td><td>${m.a}</td><td><b>${m.r.toFixed(1)}</b></td></tr>`).join('')}</table>` : '<p><span>Maçın adamı seçildiği maçlar burada listelenir.</span></p>';
    const cats = [`${d.birth} doğumlular`, `${d.nat.name} futbolcuları`, `${POSITIONS[p.position].l} oyuncuları`].concat(d.pro.map((g) => `${g.club} futbolcuları`)).concat(d.stars ? ['Altın Yıldız sahipleri'] : []);
    const el = document.createElement('div');
    el.id = 'spedia';
    el.className = 'sp';
    if (mode === 'taste') el.dataset.taste = '1';
    el.innerHTML = `
      <div class="sp-bar"><button class="sp-x" data-star="wiki-close" aria-label="Kapat">${Icon('close')}</button>
        <div class="sp-logo"><b>STARPEDIA</b><small>Özgür futbol ansiklopedisi</small></div>
        <span class="sp-glass" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="m15 15 6 6" stroke="currentColor" stroke-width="2"/></svg></span></div>
      <article class="sp-body">
        <h1 class="sp-title" data-noi18n>${full}</h1>
        <div class="sp-from">Starpedia, özgür futbol ansiklopedisi</div>
        <div class="sp-tabs"><span class="on">Madde</span><span>Tartışma</span><i></i><span class="on">Oku</span><span>Değiştir</span><span>Geçmiş</span></div>
        <table class="sp-info">
          <caption data-noi18n>${full}</caption>
          <tr><td colspan="2" class="sp-img"><canvas class="sp-fig" width="300" height="300"></canvas><div class="sp-cap"><span data-noi18n>${full}</span> · ${d.year}${cur ? ` · ${U.esc(cur.name)}` : ''}</div></td></tr>
          <tr><th colspan="2" class="sp-h">Kişisel bilgiler</th></tr>
          ${infoRows([['Tam adı', `<span data-noi18n>${full}</span>`], ['Doğum tarihi', `${d.birth} <small>(${p.age} yaşında)</small>`], ['Doğum yeri', U.esc(d.nat.name)], ['Boyu', `1,${String(height).slice(1)} m`], ['Mevkii', POSITIONS[p.position].l], ['Ayağı', p.foot === 'L' ? 'Sol' : 'Sağ']])}
          ${cur ? `<tr><th colspan="2" class="sp-h">Kulüp bilgileri</th></tr>${infoRows([['Şu anki takımı', U.esc(Game.teamName())], ['Forma numarası', p.shirt]])}` : ''}
          ${d.youth.length ? `<tr><th colspan="2" class="sp-h">Altyapı kariyeri</th></tr>${d.youth.map((g) => `<tr><td>${g.from === g.to ? g.from : `${g.from}–${g.to}`}</td><td>${U.esc(g.club)}</td></tr>`).join('')}` : ''}
          ${d.pro.length ? `<tr><th colspan="2" class="sp-h">Profesyonel kariyeri*</th></tr><tr><td colspan="2" class="sp-sub"><table class="sp-ct"><tr><th>Yıllar</th><th>Takım</th><th>M</th><th>(G)</th></tr>${careerRows}</table></td></tr>` : ''}
          ${intl.length ? `<tr><th colspan="2" class="sp-h">Millî takım kariyeri</th></tr><tr><td colspan="2" class="sp-sub"><table class="sp-ct">${intl.map(([n, c, g]) => `<tr><td>${n}</td><td>${c}</td><td>(${g})</td></tr>`).join('')}</table></td></tr>` : ''}
          ${d.pro.length ? '<tr><td colspan="2" class="sp-note">* Yalnızca lig maçları ve golleri</td></tr>' : ''}
        </table>
        ${(p.wiki || {}).lead ? `<p class="sp-own" data-noi18n>${U.esc(p.wiki.lead)}</p><p><a class="sp-edit" data-star="wiki-edit" data-key="lead">[girişi değiştir]</a></p>` : `<p>${Star.wikiAuto(d, 'lead')} <a class="sp-edit" data-star="wiki-edit" data-key="lead">[değiştir]</a></p>`}
        <div class="sp-toc"><b>İçindekiler</b><ol>${secs.map(([k, l]) => `<li><a data-star="wiki-go" data-key="${k}">${l}</a></li>`).join('')}</ol></div>
        ${Star.wikiSec(d, 'early', 'Erken yaşamı')}
        <h2 id="sp-club">Kulüp kariyeri</h2>${clubSec}
        <h2 id="sp-intl">Uluslararası kariyeri</h2>${intlSec}
        ${Star.wikiSec(d, 'style', 'Oyun tarzı')}
        ${Star.wikiSec(d, 'personal', 'Kişisel yaşamı')}
        <h2 id="sp-stats">Kariyer istatistikleri</h2>
        <div class="sp-scroll"><table class="sp-tbl"><tr><th>Sezon</th><th>Kulüp</th><th>Lig</th><th>Maç</th><th>Gol</th><th>Asist</th><th>Ort.</th></tr>${statRows}
          <tr class="tot"><td colspan="3">Toplam</td><td>${t.apps}</td><td>${t.goals}</td><td>${t.assists}</td><td>${t.apps ? (t.ratingSum / t.apps).toFixed(2) : '-'}</td></tr></table></div>
        <h2 id="sp-honours">Başarılar</h2>${honours}
        <h2 id="sp-records">Rekorlar</h2>${rec ? `<ul>${rec}</ul>` : '<p><span>Rekorlar kariyer ilerledikçe burada yer alır.</span></p>'}
        <h2 id="sp-matches">Önemli maçlar</h2>${matches}
        <div class="sp-doc"><button class="btn" data-star="doc">${Icon('play')} Kariyer belgeselini izle</button></div>
        <div class="sp-cats"><b>Kategoriler:</b> ${cats.map((c) => `<a>${U.esc(c)}</a>`).join(' | ')}</div>
        <div class="sp-foot">Bu sayfa en son ${d.year} sezonunda, ${s.season.round + 1}. haftada değiştirildi. İçerik StarFoot evreninde geçer; tüm kişi ve kulüpler kurgusaldır.</div>
      </article>`;
    if (mode === 'taste') {
      const tb = document.createElement('div');
      tb.className = 'sp-taste';
      tb.innerHTML = `${Icon('star')}<span><b>Ücretsiz önizleme</b> Starpedia sayfanı bir kez görüyorsun. Premium ile her zaman açık.</span><button class="btn" data-star="pitch" data-src="wiki_banner">Premium</button>`;
      el.insertBefore(tb, el.children[1] || null);
    }
    Star.cover(el, 'sp-open');
    if (typeof UI !== 'undefined' && UI.strip) UI.strip(el);
    const cv = el.querySelector('.sp-fig');
    const c = cv.getContext('2d');
    const club = cur || { id: 'X', c1: '#2a6fdb', c2: '#ffffff' };
    const g = c.createLinearGradient(0, 0, 0, 300);
    g.addColorStop(0, '#dfe7f2'); g.addColorStop(1, '#b8c6da');
    c.fillStyle = g; c.fillRect(0, 0, 300, 300);
    Sprites.figure(c, 150, 288, 268, { kit: Sprites.kit(club, false), look: Sprites.me(p), facing: 'down', number: p.shirt, t: 0 });
    el.scrollTop = 0;
  },
  wikiClose(quiet) {
    const el = document.getElementById('spedia');
    const taste = el && el.dataset.taste && !quiet;
    Star.uncover(el, 'sp-open');
    if (taste) Star.pitch('Starpedia sayfası', 'wiki_taste', 'Starpedia sayfana göz attın! Premium ile sayfan her zaman açık, her sezon kendiliğinden güncellenir ve bölümlerini sen yazabilirsin.');
  },
  wikiEdit(key) {
    if (!Star.has()) { return Star.pitch('Starpedia sayfası', 'wiki_edit', 'Sayfanı kendin yazmak Premium\'a özel. Premium ile giriş, erken yaşamı, oyun tarzı ve kişisel yaşamı bölümlerini dilediğin gibi yazabilirsin.'); }
    const p = Game.p, d = Star.data();
    p.wiki = p.wiki || {};
    const names = { lead: 'Giriş', early: 'Erken yaşamı', style: 'Oyun tarzı', personal: 'Kişisel yaşamı' };
    const auto = U.plain(Star.wikiAuto(d, key).replace(/<[^>]+>/g, ''));
    let val = p.wiki[key] || '';
    const m = Game.modal(`<h3>${Icon('news')} ${names[key] || ''} bölümünü değiştir</h3>
      <p class="muted">Kendi hikâyeni yaz. Boş bırakırsan Starpedia metni otomatik oluşturur.</p>
      <textarea class="sp-ta" maxlength="1200" rows="8" data-noi18n placeholder="${U.esc(auto)}">${U.esc(p.wiki[key] || '')}</textarea>`, [
      { t: 'Otomatik metin', cls: 'btn-ghost', fn: () => { delete p.wiki[key]; Game.save(); Star.reopen(); } },
      { t: 'Vazgeç', cls: 'btn-ghost' },
      { t: 'Kaydet', cls: 'btn-big', fn: () => { const v = val.trim(); if (v) p.wiki[key] = v.slice(0, 1200); else delete p.wiki[key]; Game.save(); Star.reopen(); } },
    ], { wide: true });
    const ta = m.querySelector('.sp-ta');
    ta.oninput = () => { val = ta.value; };
    setTimeout(() => ta.focus(), 50);
  },
  reopen() {
    const el = document.getElementById('spedia');
    const y = el ? el.scrollTop : 0;
    Star.wikiClose(true);
    Star.wiki();
    const n = document.getElementById('spedia');
    if (n) n.scrollTop = y;
  },

  // ---------- Kariyer belgeseli ----------
  chapters(p, s) {
    const d = Star.data(p, s);
    p = d.p;
    const col = (name) => { const c = name ? d.clubByName(name) : null; return c ? { c1: c.c1, c2: c.c2, short: c.short, cid: c.id } : null; };
    const nc = (typeof NAT_COLORS !== 'undefined' && NAT_COLORS[p.nation]) || ['#c8102e', '#ffffff'];
    const ch = [];
    const add = (scene, kicker, title, text, c) => ch.push({ scene, kicker, title, text, c: c || { c1: '#2a6fdb', c2: '#ffffff', short: 'STARFOOT' } });
    add('street', `${d.birth}`, 'Bir yıldız doğuyor', `${d.nat.name}. Bir çocuk, bir top ve bitmeyen mahalle maçları.`);
    if (d.youth.length) { const y = d.youth[0]; add('training', `${y.from}`, 'Akademi yılları', `${y.club.replace(/\s+U\d{2}$/, '')} altyapısında her gün biraz daha büyüdü.`, col(y.club)); }
    if (d.firstPro) add('number', `${d.firstPro.year}`, 'İlk profesyonel imza', `${d.firstPro.age} yaşında ${d.firstPro.club} ile ilk profesyonel sözleşmesi.`, col(d.firstPro.club));
    if (d.bigT) add('transfer', `${d.bigT.y}`, 'Dev transfer', `${d.bigT.to} ${U.money(d.bigT.fee)} ödedi. Bütün gözler artık onun üzerindeydi.`, col(d.bigT.to));
    if (d.bestG && d.bestG.goals >= 5) add('goal', `${d.bestG.year}`, 'Zirve sezonu', `${d.bestG.club} formasıyla ${d.bestG.goals} gol, ${d.bestG.assists} asist.`, col(d.bestG.club));
    if (d.tro.length) add('trophy', `${d.tro.length} kupa ve ödül`, 'Şampiyonluk anları', d.tro.slice(-3).map((x) => x.t.replace(/\s*\(\d+\)$/, '')).join(' · '), col(Game.inStreet() ? null : Game.club().name));
    if (p.intl.caps) add('europe', `${p.intl.caps} maç · ${p.intl.goals} gol`, 'Millî formayla', `${d.nat.name} formasını giymek her şeyin üstündeydi.`, { c1: nc[0], c2: nc[1], short: p.nation });
    const t = p.totals;
    add('legend', `${t.apps} maç · ${t.goals} gol · ${t.assists} asist`, Player.fullName(p), d.stars ? `${d.stars} kez Altın Yıldız. Hikâyesi hâlâ anlatılıyor.` : 'Ve hikâye burada bitmiyor.', col(Game.inStreet() ? null : Game.club().name));
    return ch;
  },
  doc(p, s) {
    const mode = Star.gate('doc', 'Kariyer belgeseli');
    if (!mode) return;
    p = p || Game.p;
    const ch = Star.chapters(p, s);
    let i = 0, timer = 0;
    const el = document.createElement('div');
    el.className = 'doc';
    el.innerHTML = `<div class="doc-bars">${ch.map(() => '<i><b></b></i>').join('')}</div>
      <button class="doc-x" aria-label="Kapat">${Icon('close')}</button>
      <canvas class="doc-cv"></canvas><div class="doc-shade"></div>
      <div class="doc-txt"><small class="doc-k"></small><h2 class="doc-t"></h2><p class="doc-p"></p></div>
      <div class="doc-end hidden"><button class="btn btn-ghost doc-share">${Icon('share')} Paylaş</button><button class="btn btn-big doc-close">Kapat</button></div>
      <div class="doc-tap l"></div><div class="doc-tap r"></div>`;
    Star.cover(el, 'doc-open');
    const cv = el.querySelector('.doc-cv');
    const close = () => {
      clearTimeout(timer); Star.uncover(el, 'doc-open');
      if (mode === 'taste') Star.pitch('Kariyer belgeseli', 'doc_taste', 'Belgeselin hazır! Premium ile kariyerin ilerledikçe belgeselini istediğin zaman yeniden izleyip paylaşabilirsin.');
    };
    const show = (k) => {
      i = U.clamp(k, 0, ch.length - 1);
      const x = ch[i];
      const post = { id: 'doc' + i, seed: 4242 + i * 97 + (p.name.length * 31), kind: 'doc', scene: x.scene, text: '', c1: x.c.c1, c2: x.c.c2, short: x.c.short, cid: x.c.cid, num: p.shirt };
      cv.width = SocialArt.W; cv.height = SocialArt.H;
      try { SocialArt.draw(cv.getContext('2d'), post); } catch (e) { /* çizim yok */ }
      el.querySelector('.doc-k').textContent = `BÖLÜM ${i + 1} · ${x.kicker}`;
      el.querySelector('.doc-t').textContent = x.title;
      el.querySelector('.doc-p').textContent = x.text;
      U.$$('.doc-bars i', el).forEach((b, j) => { b.className = j < i ? 'done' : j === i ? 'run' : ''; });
      el.querySelector('.doc-end').classList.toggle('hidden', i < ch.length - 1);
      el.classList.remove('in'); void el.offsetWidth; el.classList.add('in');
      clearTimeout(timer);
      if (i < ch.length - 1) timer = setTimeout(() => show(i + 1), 5200);
    };
    el.querySelector('.doc-x').onclick = close;
    el.querySelector('.doc-close').onclick = close;
    el.querySelector('.doc-tap.l').onclick = () => show(i - 1);
    el.querySelector('.doc-tap.r').onclick = () => (i < ch.length - 1 ? show(i + 1) : null);
    el.querySelector('.doc-share').onclick = () => {
      if (typeof ShareCard !== 'undefined') ShareCard.preview(cv, `${Player.fullName(p)}: kariyer belgeseli 🎬 #StarFoot`);
    };
    show(0);
  },

  // ---------- Lüks yaşam vitrini ----------
  luxArt(k) {
    const P = {
      watch: '<circle cx="32" cy="32" r="14" fill="none" stroke="currentColor" stroke-width="4"/><path d="M32 24v9l6 4" stroke="currentColor" stroke-width="3" fill="none"/><rect x="26" y="6" width="12" height="11" rx="2"/><rect x="26" y="47" width="12" height="11" rx="2"/>',
      suv: '<path d="M8 40v-9l7-9h26l9 9h6v9z"/><circle cx="18" cy="42" r="5" fill="#0b1020" stroke="currentColor" stroke-width="3"/><circle cx="46" cy="42" r="5" fill="#0b1020" stroke="currentColor" stroke-width="3"/>',
      sport: '<path d="M4 40c2-6 8-9 16-10l8-6h12l10 6c6 1 10 3 10 10z"/><circle cx="17" cy="41" r="5" fill="#0b1020" stroke="currentColor" stroke-width="3"/><circle cx="48" cy="41" r="5" fill="#0b1020" stroke="currentColor" stroke-width="3"/>',
      hyper: '<path d="M2 41c3-4 9-7 18-8l10-7h10l14 7c4 1 8 3 8 8z"/><path d="M50 30l10-4v4z"/><circle cx="16" cy="42" r="5" fill="#0b1020" stroke="currentColor" stroke-width="3"/><circle cx="49" cy="42" r="5" fill="#0b1020" stroke="currentColor" stroke-width="3"/>',
      villa: '<path d="M6 30 32 12l26 18v24H6z"/><rect x="14" y="36" width="10" height="10" fill="#0b1020"/><rect x="40" y="36" width="10" height="18" fill="#0b1020"/><path d="M2 58h60" stroke="currentColor" stroke-width="3"/>',
      mansion: '<path d="M4 54V28l14-8 14 8 14-8 14 8v26z"/><path d="M28 54V40h8v14z" fill="#0b1020"/><rect x="10" y="32" width="8" height="8" fill="#0b1020"/><rect x="46" y="32" width="8" height="8" fill="#0b1020"/><path d="M32 6v10" stroke="currentColor" stroke-width="3"/>',
      yacht: '<path d="M4 40h56l-8 12H12z"/><path d="M14 40l6-12h24l8 12z"/><rect x="22" y="31" width="18" height="4" fill="#0b1020"/><path d="M2 58c6-3 10-3 15 0s10 3 15 0 10-3 15 0 10 3 15 0" stroke="currentColor" stroke-width="2.5" fill="none"/>',
      jet: '<path d="M4 34l22-4 16-18h6l-8 18 18-2 4-6h4l-2 10 2 10h-4l-4-6-18-2 8 18h-6L26 34z"/>',
    }[k] || '';
    return `<svg viewBox="0 0 64 64" fill="currentColor" aria-hidden="true">${P}</svg>`;
  },
  luxCard() {
    const p = Game.p;
    if (!p || Game.inStreet() || !Star.on()) return '';
    const on = Star.has();
    const own = p.lux || [];
    const worth = LUX.filter((x) => own.includes(x.id)).reduce((a, x) => a + x.price, 0);
    return `<section class="card lux ${on ? '' : 'locked'}">
      <div class="card-h"><span>${Icon('star')} Lüks Yaşam Vitrini</span><small class="muted">${on ? `${own.length}/${LUX.length} · ${U.money(worth)}` : 'Premium'}</small></div>
      <div class="lux-grid">${LUX.map((x) => {
        const has = own.includes(x.id), afford = p.money >= x.price;
        return `<button class="lux-tile ${has ? 'own' : ''} ${on && !has && !afford ? 'poor' : ''}" data-star="lux" data-id="${x.id}">
          <span class="lux-art a-${x.art}">${Star.luxArt(x.art)}</span><b>${x.n}</b><small>${has ? 'Koleksiyonunda' : U.money(x.price)}</small></button>`;
      }).join('')}</div>
      ${on ? '' : `<button class="btn btn-play" data-star="pitch">${Icon('star')} Yıldız gibi yaşa</button>`}
    </section>`;
  },
  buyLux(id) {
    const p = Game.p, x = LUX.find((q) => q.id === id);
    if (!x) return;
    if (!Star.has()) return Star.pitch('Lüks yaşam vitrini', 'lux');
    p.lux = p.lux || [];
    if (p.lux.includes(id)) return Game.toast(`${x.n} zaten koleksiyonunda.`, 'info');
    if (p.money < x.price) return Game.toast(`Bunun için ${U.money(x.price - p.money)} daha biriktirmelisin.`, 'bad');
    Game.modal(`<div class="lux-buy"><span class="lux-art big a-${x.art}">${Star.luxArt(x.art)}</span><h3>${x.n}</h3><p class="lux-price"><b>${U.money(x.price)}</b></p><p class="muted">Satın aldığında sosyal medyada paylaşırsın.</p></div>`, [
      { t: 'Vazgeç', cls: 'btn-ghost' },
      { t: 'Satın al', cls: 'btn-big', fn: () => {
        p.money -= x.price;
        p.lux.push(id);
        Player.addMorale(p, 6);
        Player.addFame(p, x.price >= 20000000 ? 1.2 : 0.6);
        Social.post('life', x.post, 2.4);
        const so = Social.ensure(p);
        if (so.posts[0]) so.posts[0].scene = x.scene;
        Game.toast(`✨ ${x.n} artık senin! Gönderin beğeni topluyor.`, 'good');
        Game.save(); Game.render();
      } },
    ]);
  },
};

// Tüm Premium düğmeleri tek yerden
document.addEventListener('click', (e) => {
  const b = e.target.closest && e.target.closest('[data-star]');
  if (!b || !Game.state) return;
  const k = b.dataset.star;
  if (k === 'wiki') Star.wiki();
  else if (k === 'wiki-close') Star.wikiClose();
  else if (k === 'wiki-edit') Star.wikiEdit(b.dataset.key);
  else if (k === 'wiki-go') { const t = document.getElementById('sp-' + b.dataset.key); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  else if (k === 'doc') Star.doc();
  else if (k === 'studio') Star.studio();
  else if (k === 'transfer') Star.transferReq();
  else if (k === 'lux') Star.buyLux(b.dataset.id);
  else if (k === 'pitch') Star.pitch(null, b.dataset.src || 'lux');
});

// ---------- Güncelleme duyurusu (her sürümde bir kez) ----------
const APP_VER = '1.0.11';
// Duyuru içeriğinin sürümü: yeni duyuru yazılınca güncellenir (yalnız sürüm atlamak tekrar göstermez)
const WN_VER = '1.0.11';
const WhatsNew = {
  KEY: 'starfoot_whatsnew',
  // Hub'a girişte bir kez gösterir; gösterdiyse true döner. done(): pencere kapanınca çalışır.
  check(done) {
    let seen = '';
    try { seen = localStorage.getItem(WhatsNew.KEY) || ''; } catch (e) { return false; }
    if (seen === WN_VER || !Game.state || Game.state.seasonEnd) return false;
    if (!document.getElementById('modal').classList.contains('hidden')) return false;
    try { localStorage.setItem(WhatsNew.KEY, WN_VER); } catch (e) { /* yok */ }
    // 1.0.9 tanıtımını görmemiş Premium açık oyunculara Yıldız gibi yaşa özellikleri de gösterilir
    const prem = Star.on() && seen !== '1.0.9', has = Star.has();
    const it = (ic, t, d) => `<li><i>${ic}</i><span><b>${t}</b><small>${d}</small></span></li>`;
    const ios = !!(window.Capacitor && window.Capacitor.getPlatform && window.Capacitor.getPlatform() === 'ios');
    const list = [
      it('🏟️', 'Gerçek stadyum sesi ve müzik', 'Tribün uğultusu ve gol coşkusu artık gerçek kayıt; ününe göre gürleşir. Menülerde müzik var, Ayarlar\'dan kapatabilirsin.'),
      it('📡', 'Maç radarı', 'Dakika dakika akışın üstünde canlı saha: top nerede, sen neredesin, gol nereden geldi.'),
      it('🏃', 'Yeni oyuncu animasyonları', 'Dizden bükülen koşu, sallanan kollar, daha gerçekçi futbolcular.'),
    ].concat(ios ? [
      it('☁️', 'iCloud yedeği', 'Kariyerlerin otomatik yedeklenir; telefon değiştirsen de kaldığın yerden devam.'),
      it('🏆', 'Game Center', '38 başarım ve dünya sıralamaları: gol, kupa, genel güç ve takipçi.'),
    ] : []).concat(prem ? [
      it('⭐', 'Yıldız transferi', 'Ünlü bir oyuncu olarak yeni takımına gittiğinde artık rotasyon yok: doğrudan ilk 11.'),
      it('📖', 'Starpedia', 'Kariyerinin ansiklopedi sayfası: istatistikler, rekorlar, önemli maçlar. Bölümlerini kendin yaz.'),
      it('🎬', 'Kariyer belgeseli', 'Mahalle maçlarından zirveye, hikâyen bölüm bölüm. İzle ve paylaş.'),
      it('🏎️', 'Lüks yaşam vitrini', 'Spor araba, villa, yat ve özel jet. Al, Instagram\'da paylaş.'),
      it('✂️', 'Görünüm stüdyosu', 'Saç, sakal, ten ve krampon rengi. Maçlarda da bu görünümle çık.'),
      it('📨', 'Transfer talebi', 'Menajerin istediğin an kulüplerden teklif toplasın.'),
      it('✅', 'Altın onay rozeti', 'Oyun içi Instagram\'da altın tik.'),
    ] : []).join('');
    const foot = !prem ? '' : has
      ? `<p class="wn-note ok">${Icon('star')} Premium'un var: hepsi senin için açık!</p>`
      : `<p class="wn-note">${Icon('star')} Yeni ayrıcalıklar Premium'a özel. Starpedia sayfanı ve belgeselini bir kez ücretsiz deneyebilirsin.</p>`;
    const end = () => { if (done) setTimeout(done, 300); };
    const btns = [{ t: prem ? 'Sonra' : 'Tamam', cls: 'btn-ghost', fn: end }];
    if (prem) btns.push({ t: has ? `${Icon('news')} Starpedia'mı aç` : `${Icon('news')} Ücretsiz dene`, cls: 'btn-big', fn: () => { if (typeof Premium !== 'undefined') Premium.track('whatsnew_try', { premium: has ? 1 : 0 }); setTimeout(() => Star.wiki(), 60); } });
    Game.modal(`<div class="wn"><div class="ev-tag">Yeni güncelleme · ${WN_VER}</div>
      <h2>Yenilikler</h2>
      <ul class="wn-l">${list}</ul>${foot}</div>`, btns, { wide: true });
    if (typeof Premium !== 'undefined') Premium.track('whatsnew_view', { ver: WN_VER, premium: has ? 1 : 0 });
    return true;
  },
};
