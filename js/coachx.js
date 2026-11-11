// Teknik Direktör 1.0.19: dış görünüş (eşofman / takım elbise / casual), Starpedia sayfası,
// sosyal medya hesabı ve daha çeşitli devre arası / maç sonu konuşmaları.

const CM_OUTFITS = {
  track: { t: 'Eşofman', d: 'Kulüp renklerinde antrenman eşofmanı' },
  suit: { t: 'Takım elbise', d: 'Kravatlı, şık ve otoriter' },
  casual: { t: 'Casual', d: 'Kazak ve kot, rahat bir hoca' },
};
const CM_SUITS = ['#1d2433', '#0d0f14', '#4a4f5a', '#24324f', '#5b4636'];
const CM_KNITS = ['#2b3a55', '#7a2e2e', '#2f5d50', '#d9d2c3', '#3a3a3a'];

Object.assign(Coach, {
  look() {
    const s = Coach.s;
    if (!s.look) {
      const r = (s.name || 'x').length + (s.surname || 'y').length;
      s.look = { outfit: 'track', col: CM_SUITS[0], skin: SKINS[r % 3], hair: HAIRS[r % 4], style: 'short', beard: r % 3 === 0 ? 'stubble' : '0' };
    }
    return s.look;
  },
  kitFor(look, club) {
    const o = look.outfit || 'track';
    if (o === 'suit') return { shirt: look.col || CM_SUITS[0], alt: club.c2, pattern: 'plain', shorts: look.col || CM_SUITS[0], socks: look.col || CM_SUITS[0], pants: look.col || CM_SUITS[0], coat: 'suit', tie: club.c1 };
    if (o === 'casual') return { shirt: look.col || CM_KNITS[0], alt: club.c1, pattern: 'plain', shorts: '#34507a', socks: '#34507a', pants: '#34507a', coat: 'casual' };
    const dark = Sprites.shade(club.c1, -0.35);
    return { shirt: club.c1, alt: club.c2, pattern: 'plain', shorts: dark, socks: dark, pants: dark, coat: 'track' };
  },
  drawMe(cv, bg) {
    const c = cv.getContext('2d'), W = cv.width, H = cv.height, club = Coach.my();
    const lk = Coach.look();
    c.clearRect(0, 0, W, H);
    if (bg === 'wiki') {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#dfe7f2'); g.addColorStop(1, '#b8c6da'); c.fillStyle = g;
    } else {
      const g = c.createRadialGradient(W / 2, H * 0.35, 10, W / 2, H / 2, H); g.addColorStop(0, Sprites.shade(club.c1, -0.15)); g.addColorStop(1, '#0b1020'); c.fillStyle = g;
    }
    c.fillRect(0, 0, W, H);
    const look = { skin: lk.skin, hair: lk.hair, style: lk.style, beard: lk.beard === '0' ? 0 : lk.beard, boots: lk.outfit === 'casual' ? '#e9e6df' : lk.outfit === 'suit' ? '#111' : '#f2f2f2' };
    Sprites.figure(c, W / 2, H * 0.96, H * 0.9, { kit: Coach.kitFor(lk, club), look, facing: 'down', number: null, t: 0, longSleeve: true, noShadow: bg === 'wiki' });
  },
  // görünüm seçimi
  studio(first) {
    const s = Coach.s, cur = Object.assign({}, Coach.look());
    const chips = (k, list) => list.map(([v, l]) => `<button class="chip ${String(cur[k]) === String(v) ? 'on' : ''}" data-k="${k}" data-v="${v}">${l}</button>`).join('');
    const sw = (k, list) => list.map((v) => `<button class="stu-sw ${cur[k] === v ? 'on' : ''}" data-k="${k}" data-v="${v}" style="background:${v}"></button>`).join('');
    const cols = () => (cur.outfit === 'suit' ? CM_SUITS : cur.outfit === 'casual' ? CM_KNITS : []);
    const m = Game.modal(`<h3>${Icon('coach')} ${first ? 'Teknik direktörünü oluştur' : 'Görünüm'}</h3>
      <div class="stu-wrap"><canvas class="stu-cv cm-stu" width="260" height="320"></canvas></div>
      <div class="lbl">Kıyafet</div><div class="cm-outs">${Object.entries(CM_OUTFITS).map(([k, v]) => `<button class="cm-out ${cur.outfit === k ? 'on' : ''}" data-k="outfit" data-v="${k}"><b>${v.t}</b><small>${v.d}</small></button>`).join('')}</div>
      <div class="cm-cols"><div class="lbl">Renk</div><div class="stu-row" id="cm-cols"></div></div>
      <div class="lbl">Ten rengi</div><div class="stu-row">${sw('skin', SKINS)}</div>
      <div class="lbl">Saç rengi</div><div class="stu-row">${sw('hair', HAIRS.concat(['#9aa0a6', '#e8e8e8']))}</div>
      <div class="lbl">Saç modeli</div><div class="chip-row">${chips('style', [['short', 'Kısa'], ['buzz', 'Asker'], ['slick', 'Geriye taranmış'], ['side', 'Yana yatık'], ['long', 'Uzun']])}<button class="chip ${cur.bald ? 'on' : ''}" data-k="bald" data-v="1">Kel</button></div>
      <div class="lbl">Sakal</div><div class="chip-row">${chips('beard', [['0', 'Yok'], ['stubble', 'Kirli sakal'], ['full', 'Tam sakal'], ['goatee', 'Keçi sakal'], ['mustache', 'Bıyık']])}</div>`,
    [{ t: 'Kaydet', cls: 'btn-big', fn: () => { s.look = cur; Coach.save(); Coach.render(); Game.toast('Görünümün kaydedildi.', 'good'); } }].concat(first ? [] : [{ t: 'Vazgeç', cls: 'btn-ghost' }]), { wide: true });
    const cv = m.querySelector('.cm-stu');
    const draw = () => {
      const keep = s.look; s.look = cur; Coach.drawMe(cv); s.look = keep;
      const box = m.querySelector('#cm-cols'), cl = cols();
      box.parentNode.style.display = cl.length ? '' : 'none';
      box.innerHTML = cl.map((v) => `<button class="stu-sw ${cur.col === v ? 'on' : ''}" data-k="col" data-v="${v}" style="background:${v}"></button>`).join('');
      U.$$('[data-k="col"]', box).forEach(bind);
      U.$$('[data-k]', m).forEach((b) => { const k = b.dataset.k, v = b.dataset.v; b.classList.toggle('on', k === 'bald' ? !!cur.bald : String(cur[k]) === v); });
    };
    const bind = (b) => (b.onclick = () => {
      const k = b.dataset.k, v = b.dataset.v;
      if (k === 'bald') cur.bald = !cur.bald;
      else { cur[k] = v; if (k === 'style') cur.bald = false; }
      if (k === 'outfit') cur.col = v === 'suit' ? CM_SUITS[0] : v === 'casual' ? CM_KNITS[0] : null;
      draw();
    });
    U.$$('[data-k]', m).forEach(bind);
    draw();
  },

  // ---------- sosyal medya ----------
  fol() { const s = Coach.s; return Math.round(800 + Math.pow(s.rep, 2.15) * 40 + (s.fBoost || 0)); },
  post(kind, text, boost) {
    const s = Coach.s;
    s.feed = s.feed || [];
    const base = Coach.fol() * U.rand(0.015, 0.04) * (boost || 1);
    const likes = Math.round(base), com = Math.round(base * U.rand(0.02, 0.06));
    const c = Coach.my();
    s.feed.unshift({ k: kind, t: text, y: s.year, r: s.round, l: likes, c: com, cl: c.id, sc: kind === 'match' && s.last ? `${s.last.gf}-${s.last.ga}` : '' });
    s.feed = s.feed.slice(0, 40);
    s.fBoost = (s.fBoost || 0) + likes * 0.05;
  },
  feedHtml() {
    const s = Coach.s, f = s.feed || [];
    const me = U.esc(Coach.fullName()), handle = `@${(s.name + s.surname).toLowerCase().replace(/[^a-z0-9ğüşıöç]/gi, '').slice(0, 20)}`;
    const fmt = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : n);
    const card = (x) => {
      const c = Coach.club(x.cl);
      const pic = x.k === 'match' ? `<div class="cmf-pic" style="--c1:${c.c1};--c2:${c.c2}"><b>${x.sc}</b><small>${U.esc(c.name)}</small></div>`
        : x.k === 'trophy' ? `<div class="cmf-pic gold"><b>🏆</b><small>${U.esc(c.name)}</small></div>`
          : x.k === 'sign' || x.k === 'club' ? `<div class="cmf-pic" style="--c1:${c.c1};--c2:${c.c2}"><b>${x.k === 'club' ? 'YENİ SAYFA' : 'HOŞ GELDİN'}</b><small>${U.esc(c.name)}</small></div>` : '';
      return `<div class="cmf-post"><div class="cmf-h"><canvas class="cmf-av" width="64" height="64"></canvas><span><b>${me}</b><small>${x.y} · ${x.r}. hafta</small></span></div>
        ${pic}<p>${U.esc(x.t)}</p><div class="cmf-f" data-emo><span>❤️ ${fmt(x.l)}</span><span>💬 ${fmt(x.c)}</span></div></div>`;
    };
    return `<div class="cmf-prof"><canvas class="cmf-big" width="120" height="120"></canvas><div><b>${me}</b><small data-noi18n>${handle}</small>
      <div class="cmf-n"><span><b>${f.length}</b> gönderi</span><span><b>${fmt(Coach.fol())}</b> takipçi</span></div></div></div>
      <div class="cmf-list">${f.map(card).join('') || '<p class="muted">Henüz gönderi yok. Maçlardan sonra paylaşımların burada görünür.</p>'}</div>`;
  },
  social() {
    const m = Game.modal(`<div class="cmf">${Coach.feedHtml()}</div>`, [{ t: 'Kapat', cls: 'btn-ghost' }], { wide: true });
    U.$$('canvas.cmf-av, canvas.cmf-big', m).forEach((cv) => Coach.drawHead(cv));
  },
  drawHead(cv) {
    const c = cv.getContext('2d'), W = cv.width, lk = Coach.look(), club = Coach.my();
    c.save(); c.beginPath(); c.arc(W / 2, W / 2, W / 2, 0, Math.PI * 2); c.clip();
    c.fillStyle = Sprites.shade(club.c1, -0.2); c.fillRect(0, 0, W, W);
    const look = { skin: lk.skin, hair: lk.hair, style: lk.style, bald: lk.bald, beard: lk.beard === '0' ? 0 : lk.beard };
    Sprites.figure(c, W / 2, W * 2.15, W * 2.3, { kit: Coach.kitFor(lk, club), look, facing: 'down', number: null, t: 0, longSleeve: true, noShadow: true });
    c.restore();
  },

  // ---------- Starpedia ----------
  wiki() {
    const s = Coach.s, t = s.rec, full = U.esc(Coach.fullName());
    const n = Game.nat(s.nat) || { name: '' };
    const games = t.w + t.d + t.l, pct = games ? Math.round((t.w / games) * 100) : 0;
    const stints = (s.hist || []).slice().reverse().concat(s.stint ? [{ club: s.stint.club, from: s.stint.from, to: null, w: s.stint.w, d: s.stint.d, l: s.stint.l }] : []);
    const birth = s.year - s.age;
    const fName = { '4-4-2': '4-4-2', '4-3-3': '4-3-3', '4-2-3-1': '4-2-3-1', '3-5-2': '3-5-2', '5-3-2': '5-3-2' }[s.form] || s.form;
    const styleS = {
      bal: '{}, takımlarını çoğunlukla {} dizilişiyle ve dengeli bir oyun anlayışıyla sahaya sürer.',
      att: '{}, takımlarını çoğunlukla {} dizilişiyle ve hücum odaklı bir oyun anlayışıyla sahaya sürer.',
      def: '{}, takımlarını çoğunlukla {} dizilişiyle ve savunma ağırlıklı bir oyun anlayışıyla sahaya sürer.',
      press: '{}, takımlarını çoğunlukla {} dizilişiyle ve önde baskıya dayalı bir oyun anlayışıyla sahaya sürer.',
      counter: '{}, takımlarını çoğunlukla {} dizilişiyle ve kontra atağa dayalı bir oyun anlayışıyla sahaya sürer.',
    }[s.style] || '{}, takımlarını çoğunlukla {} dizilişiyle ve dengeli bir oyun anlayışıyla sahaya sürer.';
    const best = (s.seasons || []).slice().sort((a, b) => a.pos - b.pos)[0];
    const lead = `<b data-noi18n>${full}</b> <span>(${birth} doğumlu), ${U.esc(n.name)} uyruklu futbol teknik direktörüdür.</span> ${s.stint ? `<span>Halen ${U.esc(Coach.my().name)} takımını çalıştırmaktadır.</span> ` : ''}<span>Kariyerinde ${games} maçta ${t.w} galibiyet aldı (%${pct}).</span>`;
    const styleP = `<span>${styleS.replace('{}', full).replace('{}', fName)}</span> <span>${s.iq >= 70 ? 'Taktik zekâsıyla tanınır.' : 'Oyuncularıyla kurduğu yakın ilişkiyle bilinir.'}</span>`;
    const el = document.createElement('div');
    el.id = 'spedia'; el.className = 'sp';
    el.innerHTML = `<div class="sp-bar"><button class="sp-x" id="cmw-x" aria-label="Kapat">${Icon('close')}</button>
        <div class="sp-logo"><b>STARPEDIA</b><small>Özgür futbol ansiklopedisi</small></div><span></span></div>
      <article class="sp-body">
        <h1 class="sp-title" data-noi18n>${full}</h1>
        <div class="sp-from">Starpedia, özgür futbol ansiklopedisi</div>
        <table class="sp-info"><caption data-noi18n>${full}</caption>
          <tr><td colspan="2" class="sp-img"><canvas class="sp-fig" width="300" height="300"></canvas><div class="sp-cap"><span data-noi18n>${full}</span> · ${s.year}</div></td></tr>
          <tr><th colspan="2" class="sp-h">Kişisel bilgiler</th></tr>
          <tr><th>Tam adı</th><td data-noi18n>${full}</td></tr><tr><th>Doğum tarihi</th><td>${birth} <small>(${s.age} yaşında)</small></td></tr><tr><th>Uyruğu</th><td>${U.esc(n.name)}</td></tr>
          ${s.stint ? `<tr><th colspan="2" class="sp-h">Kulüp bilgileri</th></tr><tr><th>Şu anki takımı</th><td>${U.esc(Coach.my().name)}</td></tr><tr><th>Görevi</th><td>Teknik direktör</td></tr>` : ''}
          <tr><th colspan="2" class="sp-h">Teknik direktörlük kariyeri</th></tr>
          <tr><td colspan="2" class="sp-sub"><table class="sp-ct"><tr><th>Yıllar</th><th>Takım</th><th>G-B-M</th></tr>${stints.map((x) => `<tr><td>${x.to ? (x.from === x.to ? x.from : `${x.from}–${x.to}`) : `${x.from}–`}</td><td>${U.esc(Coach.club(x.club).name)}</td><td>${x.w}-${x.d}-${x.l}</td></tr>`).join('')}</table></td></tr>
        </table>
        <p>${lead}</p>
        <h2>Teknik direktörlük kariyeri</h2>
        ${stints.map((x) => `<h3>${U.esc(Coach.club(x.club).name)} (${x.to ? (x.from === x.to ? x.from : `${x.from}–${x.to}`) : `${x.from}–`})</h3><p><span>${x.w + x.d + x.l} maçta ${x.w} galibiyet, ${x.d} beraberlik ve ${x.l} mağlubiyet aldı.</span>${x.why === 'Kovuldu' ? ' <span>Kötü sonuçların ardından görevinden alındı.</span>' : x.why === 'Ayrıldı' ? ' <span>Başka bir kulübün teklifini kabul ederek ayrıldı.</span>' : ''}</p>`).join('')}
        <h2>Oyun anlayışı</h2><p>${styleP}</p>
        <h2>Sezonlar</h2>
        <div class="sp-scroll"><table class="sp-tbl"><tr><th>Sezon</th><th>Kulüp</th><th>Lig</th><th>Sıra</th></tr>${(s.seasons || []).map((x) => `<tr><td>${x.y}</td><td>${U.esc(Coach.club(x.club).name)}</td><td>${U.esc(Coach.lgName(x.lg))}</td><td>${x.pos}./${x.n}</td></tr>`).join('') || '<tr><td colspan="4">İlk sezonu devam ediyor.</td></tr>'}</table></div>
        <h2>Başarılar</h2>${s.trophies.length || s.awards.length ? `<ul>${s.trophies.map((x) => `<li>🏆 ${U.esc(x)}</li>`).join('')}${s.awards.map((x) => `<li>🏅 ${U.esc(x)}</li>`).join('')}</ul>` : '<p><span>Henüz bir kupa kazanmamıştır.</span></p>'}
        <h2>Rekorlar</h2><ul><li><span>Toplam maç: <b>${games}</b></span></li><li><span>Galibiyet yüzdesi: <b>%${pct}</b></span></li><li><span>Atılan / yenilen gol: <b>${t.gf} / ${t.ga}</b></span></li>${best ? `<li><span>En iyi lig sırası: <b>${best.pos}.</b> (${best.y}, ${U.esc(Coach.club(best.club).name)})</span></li>` : ''}</ul>
        <div class="sp-foot">İçerik StarFoot evreninde geçer; tüm kişi ve kulüpler kurgusaldır.</div>
      </article>`;
    Star.cover(el, 'sp-open');
    UI.strip(el);
    Coach.drawMe(el.querySelector('.sp-fig'), 'wiki');
    el.querySelector('#cmw-x').onclick = () => { Star.uncover(el, 'sp-open'); Coach.render(); };
    el.scrollTop = 0;
  },
  // Kariyer ekranındaki profil kartı
  profileCard() {
    return `<section class="card cm-prof"><canvas class="cm-pcv" width="150" height="190"></canvas>
      <div class="cm-pbtn"><button class="btn btn-ghost" id="cm-look">${Icon('smile')} Görünüm</button><button class="btn btn-ghost" id="cm-wiki">${Icon('news')} Starpedia</button><button class="btn btn-ghost" id="cm-soc">${Icon('heart')} Sosyal medya <small>${(() => { const n = Coach.fol(); return n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : n; })()}</small></button></div></section>`;
  },
});

// ---------- konuşmalar: duruma göre değişen, daha çeşitli seçenekler ----------
const CM_HT = {
  // [metin, saldırı, savunma, moral, başarı olasılığı(sert sözler için)]
  ahead: [['😌 Sakin olun, plana sadık kalın', 0.5, 1.5, 3], ['🧱 Arkayı kapatın, skoru koruyalım', -0.5, 2.5, 1], ['🎯 Bir gol daha atıp maçı bitirin', 2, 0, 4], ['👏 Harika oynuyorsunuz, devam!', 0.5, 0.5, 5], ['⚠️ Rehavete kapılmayın', 0.5, 1, 1], ['🧠 Topu ayağınızda tutun, oyunu yavaşlatın', 0, 1.5, 2]],
  level: [['🔥 Daha fazlasını istiyorum!', 2.5, 0, 5], ['📋 Sabırlı olun, fırsat gelecek', 1, 1, 3], ['⚡ Kanatları daha çok kullanın', 2, -0.5, 3], ['🧱 Önce gol yemeyelim', 0, 2, 2], ['💪 Bu maçı kazanabilecek tek takım biziz', 2, 0.5, 4], ['😠 Uyanın artık!', 3.5, 1, 6, 0.4]],
  behind: [['🔥 Hâlâ şansımız var, saldırın!', 3, -1, 4], ['😠 Bu oyun kabul edilemez!', 3.5, 1, 6, 0.55], ['📋 Panik yok, adım adım', 1.5, 0.5, 3], ['💪 Size inanıyorum, geri döneceğiz', 2, 0, 5], ['🎯 Ceza sahasına daha çok adam taşıyın', 3, -1.5, 2], ['🤫 Bir şey demiyorum, sessizce bakıyorum', 1, 1, 0, 0.5]],
};
const CM_FT = {
  bigwin: [['👏 Mükemmel bir performanstı!', 5, 1], ['🍾 Bu galibiyeti hak ettiniz, keyfini çıkarın', 6, 0], ['🙂 Güzel ama ayaklar yere bassın', 2, 2], ['📸 Taraftarla birlikte kutlayın', 5, 1]],
  win: [['👏 Harika iş çıkardınız!', 4, 1], ['🙂 İyiydi ama daha fazlası var', 2, 1], ['😐 Rehavete kapılmayın', -1, 2], ['🛡️ Savunmanızla gurur duyuyorum', 3, 2], ['💪 Böyle maçları kazanmak şampiyonluk getirir', 4, 1]],
  draw: [['🤝 Bir puan da puandır', 2, 0], ['📋 Kazanabileceğimiz bir maçtı', 0, 2], ['😠 Bu performans yetmez!', 3, 1, 0.5], ['🙂 Mücadelenizi beğendim', 2, 1], ['🔁 Önümüzdeki maça odaklanalım', 1, 1]],
  loss: [['🤝 Başımızı kaldıralım', 2, 0], ['📋 Hatalarımızı konuşalım', 0, 2], ['😠 Bu kabul edilemez!', 4, 1, 0.5], ['🫡 Sorumluluk bende', 3, 1], ['🔥 Bu yenilginin acısını çıkaracağız', 3, 1]],
  heavy: [['😠 Utanç verici bir performans!', 5, 1, 0.45], ['🫡 Sorumluluk bende, birlikte düzelteceğiz', 3, 2], ['🤐 Bugün konuşmayacağım, yarın analiz', 0, 1], ['📋 Herkes kendine dürüstçe baksın', 1, 2]],
};

(function wireCoach() {
  if (typeof Coach === 'undefined' || typeof Live === 'undefined') return;
  const pick = (arr, n) => U.shuffle(arr.slice()).slice(0, n);

  Live.halftime = function () {
    const L = Live.m;
    L.paused = true;
    const lead = L.gf - L.ga, ctx = lead > 0 ? 'ahead' : lead < 0 ? 'behind' : 'level';
    const opts = pick(CM_HT[ctx], 3);
    const ons = Live.onField();
    const star = ons.slice().sort((a, b) => (L.rates[b.id] || 6) - (L.rates[a.id] || 6) || b.r - a.r)[0];
    const weak = ons.slice().sort((a, b) => (L.rates[a.id] || 6) - (L.rates[b.id] || 6) || a.fit - b.fit)[0];
    const btns = opts.map(([t, att, def, mor, chance]) => ({ t, fn: () => {
      const ok = chance == null || U.chance(chance);
      L.mods.att += ok ? att : -1.5; L.mods.def += ok ? def : -1;
      ons.forEach((p) => (p.mor = U.clamp(p.mor + (ok ? mor : -7), 0, 100)));
      Live.resume(ok ? (chance != null ? 'Sözlerin işe yaradı, takım ateşlendi!' : 'Takım mesajı aldı.') : 'Oyuncular bu tavırdan etkilendi, moraller bozuk.');
    } }));
    if (star && star !== weak) btns.push({ t: `⭐ ${star.n.split(' ').slice(-1)[0]}: "Oyunu sen taşıyorsun"`, fn: () => { star.mor = U.clamp(star.mor + 10, 0, 100); L.mods.att += 1; Live.resume(`${Live.nm(star)} övgüyle coştu.`); } });
    if (weak && weak !== star && U.chance(0.7)) btns.push({ t: `👉 ${weak.n.split(' ').slice(-1)[0]}: "Senden daha fazlasını bekliyorum"`, fn: () => { const ok = weak.pers === 'calm' || U.chance(0.55); weak.mor = U.clamp(weak.mor + (ok ? 8 : -10), 0, 100); L.mods.att += ok ? 1 : 0; Live.resume(ok ? `${Live.nm(weak)} tepki gösterip hırslandı.` : `${Live.nm(weak)} eleştiriye bozuldu.`); } });
    Game.modal(`<div class="ev-tag">Devre arası</div><h3>Skor ${L.gf}-${L.ga}. Soyunma odasında takıma ne diyeceksin?</h3><p class="muted">Topa sahip olma %${Live.possPct()} · Şut ${L.st.sh[0]}-${L.st.sh[1]}</p>`, btns);
  };

  Live.teamTalk = function (L, next) {
    const win = L.pens ? L.pens.win : L.gf > L.ga, draw = !L.pens && L.gf === L.ga;
    const d = L.gf - L.ga;
    const ctx = win ? (d >= 3 ? 'bigwin' : 'win') : draw ? 'draw' : d <= -3 ? 'heavy' : 'loss';
    const sq = () => Coach.s.squad.filter((p) => L.final.some((x) => x.p === p));
    const mor = (v) => sq().forEach((p) => (p.mor = U.clamp(p.mor + v * (p.pers === 'calm' ? 0.5 : 1), 0, 100)));
    const chem = (v) => (Coach.s.chem = U.clamp(Coach.s.chem + v, 0, 100));
    const opts = pick(CM_FT[ctx], 3).map(([t, m, c, chance]) => ({ t, fn: () => {
      if (chance != null) { const ok = U.chance(chance); mor(ok ? m : -5); chem(ok ? c : -2); return ok ? 'Sert sözler takımı ateşledi.' : 'Soyunma odasında gerginlik var.'; }
      mor(m); chem(c); return m >= 4 ? 'Oyuncular sözlerinden çok mutlu oldu.' : c >= 2 ? 'Takım mesajı anladı.' : 'Oyuncular sözlerini dinledi.';
    } }));
    const top = L.final && L.final[0];
    if (top && top.p) opts.push({ t: `⭐ ${top.p.n.split(' ').slice(-1)[0]}: "Bugün farkı sen yarattın"`, fn: () => { top.p.mor = U.clamp(top.p.mor + 10, 0, 100); chem(1); return `${top.p.n} övgüden çok mutlu.`; } });
    const low = L.final && L.final.slice().sort((a, b) => a.r - b.r)[0];
    if (!win && low && low.p && low !== top && low.r < 6.2) opts.push({ t: `👉 ${low.p.n.split(' ').slice(-1)[0]}: "Bugün yeterli değildin"`, fn: () => { const ok = U.chance(0.5); low.p.mor = U.clamp(low.p.mor + (ok ? 6 : -10), 0, 100); return ok ? `${low.p.n} eleştiriyi kabul etti.` : `${low.p.n} eleştiriye bozuldu.`; } });
    const motm = L.motm ? `<p class="muted">⭐ Maçın oyuncusu: ${U.esc(L.motm.n)} (${L.final[0].r.toFixed(1)})</p>` : '';
    Game.modal(`<div class="ev-tag">Soyunma odası</div><h3>Skor ${L.gf}-${L.ga}. Takıma ne söyleyeceksin?</h3>${motm}`, opts.map((o) => ({ t: o.t, fn: () => { const msg = o.fn(); Coach.save(); Game.toast(msg, 'good'); setTimeout(next, 120); } })));
  };

  // sosyal medya paylaşımları
  const am = Coach.afterMatch.bind(Coach);
  Coach.afterMatch = (m, res) => {
    am(m, res);
    try {
      const s = Coach.s, opp = Coach.club(m.opp).name;
      const win = res.pens ? res.pens.win : res.gf > res.ga, draw = !res.pens && res.gf === res.ga;
      const t = win ? U.pick([`Önemli bir galibiyet. ${opp} karşısında oyuncularımla gurur duyuyorum!`, 'Üç puan bizim. Taraftarımıza teşekkürler!', `Planımız işledi. Sırada yeni hedefler var.`, 'Bu takım karakterini gösterdi. Tebrikler çocuklar!'])
        : draw ? U.pick([`${opp} maçı zordu, bir puanla yetindik.`, 'Kazanmak istiyorduk, çalışmaya devam.', 'Pes etmeyen bir takımımız var.'])
          : U.pick(['Bugün istediğimizi alamadık. Sorumluluk bende.', 'Kafaları kaldırıp önümüzdeki maça bakacağız.', 'Hatalarımızdan ders çıkaracağız.']);
      if (win || U.chance(0.6)) Coach.post('match', t, win ? (res.gf - res.ga >= 3 ? 1.8 : 1.2) : 0.7);
      void s;
    } catch (e) { /* paylaşım yok */ }
  };
  const sg = Coach.sign.bind(Coach);
  Coach.sign = (p, ...a) => { const r = sg(p, ...a); try { if (Coach.s.squad.includes(p)) Coach.post('sign', `${p.n} aramıza hoş geldin! Birlikte büyük işler başaracağız.`, 1.1); } catch (e) { /* yok */ } return r; };
  const jc = Coach.joinClub.bind(Coach);
  Coach.joinClub = (id, fresh) => { const r = jc(id, fresh); try { Coach.post('club', `Yeni bir sayfa: ${Coach.my().name}. Bu formayı taşıyan herkes için çalışacağım.`, 1.6); } catch (e) { /* yok */ } return r; };
  const se = Coach.seasonEnd.bind(Coach);
  Coach.seasonEnd = (...a) => {
    const before = Coach.s.trophies.length;
    const r = se(...a);
    try { Coach.s.trophies.slice(before).forEach((x) => Coach.post('trophy', `ŞAMPİYON! ${x}. Bu kupa hepimizin!`, 3)); } catch (e) { /* yok */ }
    return r;
  };
  const cup = Coach.cupAdvance.bind(Coach);
  Coach.cupAdvance = (w) => {
    const before = Coach.s.trophies.length;
    const r = cup(w);
    try { Coach.s.trophies.slice(before).forEach((x) => Coach.post('trophy', `KUPA BİZİM! ${x}. Bu gece kutlama var!`, 2.6)); } catch (e) { /* yok */ }
    return r;
  };

  // Kariyer ekranına profil kartı
  const vc = Coach.vCareer.bind(Coach);
  Coach.vCareer = () => Coach.profileCard() + vc();
  const bd = Coach.bind.bind(Coach);
  Coach.bind = (el) => {
    bd(el);
    const cv = el.querySelector('.cm-pcv');
    if (cv) Coach.drawMe(cv);
    const on = (id, fn) => { const b = el.querySelector(id); if (b) b.onclick = fn; };
    on('#cm-look', () => Coach.studio(false));
    on('#cm-wiki', () => Coach.wiki());
    on('#cm-soc', () => Coach.social());
  };
  // kadro güvenliği: serbest oyuncuyla 30 sınırı, kiralıkta en az 16 oyuncu, her sezon en az 2 kaleci
  const ct = Coach.contract.bind(Coach);
  Coach.contract = (p, fee) => {
    if (Coach.s.squad.length >= 30) return Game.toast('Kadro dolu (en fazla 30 oyuncu). Önce oyuncu sat.', 'bad');
    return ct(p, fee);
  };
  const lo = Coach.loanOut.bind(Coach);
  Coach.loanOut = (p) => {
    const s = Coach.s;
    if (s.squad.filter((x) => !x.loan).length <= 16) { Game.toast('Kadroda en az 16 oyuncu kalmalı.', 'bad'); return; }
    if (p.pos === 'GK' && s.squad.filter((x) => !x.loan && x.pos === 'GK').length <= 2) { Game.toast('En az 2 kaleci kadroda kalmalı.', 'bad'); return; }
    return lo(p);
  };
  const ns = Coach.newSeason.bind(Coach);
  Coach.newSeason = (...a) => {
    const r = ns(...a);
    const s = Coach.s;
    if (s && s.squad) {
      const c = Coach.my(), tr = Coach.teamRating();
      for (let k = s.squad.filter((x) => x.pos === 'GK').length; k < 2; k++) {
        const gk = Coach.mkPlayer({ n: World.genName(c.pool), pos: 'GK', r: tr - U.randi(6, 12), age: U.randi(19, 30), nat: POOL_NAT[c.pool] || '' });
        gk.wage = Coach.wageOf(gk.r); gk.yrs = 2;
        s.squad.push(gk);
        Coach.news(`🧤 Kaleci ${gk.n} kadroya katıldı.`, '');
      }
      Coach.save();
    }
    return r;
  };
  // ilk girişte görünüm seçimi
  const st = Coach.start.bind(Coach);
  Coach.start = (o, clubId) => { st(o, clubId); Coach.look(); Coach.save(); };
})();
