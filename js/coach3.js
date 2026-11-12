// Teknik Direktör 1.0.20: 3 kariyer yuvası ve yeni giriş ekranı, 3 maçlık ücretsiz deneme,
// oluştururken dış görünüş seçimi, fotoğraflı sosyal medya, taraftar / oyuncular / yönetim
// barları ve haftalık 3 aksiyon hakkı (antrenman, dinlenme, takım etkinliği...).

const CM_SLOTS = 3;
const CM_TRIAL = 3; // paketi olmayanlar için ücretsiz maç sayısı
const CM_NEUTRAL = { id: 'X', name: '', short: '', c1: '#24324f', c2: '#ffcf3f' };

// haftalık aksiyonlar: [anahtar, simge, başlık, açıklama, grup]
const CM_ACTS = [
  ['train', '🏋️', 'Antrenman', 'Gelişim ve maç hazırlığı. Enerji düşer.', 'team'],
  ['rest', '😴', 'Dinlenme', 'Enerji toplanır, sakatlar hızlı iyileşir.', 'team'],
  ['bond', '🎳', 'Takım etkinliği', 'Kimya ve oyuncuların sana güveni artar.', 'team'],
  ['fans', '📣', 'Taraftar buluşması', 'İmza günü ve antrenman izletme. Taraftar desteği artar.', 'rel'],
  ['board', '🤝', 'Yönetimle toplantı', 'Projeni anlat, yönetimin güveni artar.', 'rel'],
  ['talk', '🗣️', 'Birebir görüşme', 'Mutsuz oyuncularla konuş, soyunma odası rahatlar.', 'rel'],
];
const CM_BOND = [
  ['🍽️', 'Takım yemeği', 'Uzun bir masada şakalar, anılar... Takım kaynaştı.'],
  ['🎳', 'Bowling gecesi', 'Kaptan iki strike attı, soyunma odası hâlâ onu konuşuyor.'],
  ['🎯', 'Paintball', 'Savunmacılar hücumculara karşı. Herkes boyaya bulandı ama çok güldü.'],
  ['🎤', 'Karaoke gecesi', 'Kalecinin şarkısı takımın yeni marşı oldu.'],
  ['🔥', 'Mangal partisi', 'Tesislerde mangal yakıldı, gençler ile tecrübeliler kaynaştı.'],
  ['⛵', 'Tekne turu', 'Deniz kenarında bir gün: herkes dinlendi ve kafa dağıttı.'],
];

(() => {
  // ---------- kayıt yuvaları ----------
  Coach.slot = 1;
  Coach.keyOf = (i) => (i <= 1 ? 'starfoot_coach' : `starfoot_coach_${i}`);
  Coach.useSlot = (i) => { Coach.slot = i; Coach.KEY = Coach.keyOf(i); };
  Coach.readSlot = (i) => { try { const r = Store.read(Coach.keyOf(i)); return r ? JSON.parse(r) : null; } catch (e) { return null; } };
  Coach.freeSlot = () => { for (let i = 1; i <= CM_SLOTS; i++) if (!Coach.readSlot(i)) return i; return 0; };

  // ---------- ücretsiz deneme ----------
  const TKEY = 'starfoot_coach_trial';
  Coach.owned = () => typeof Packs === 'undefined' || Packs.owns('coach');
  Coach.trialUsed = () => { try { return +(localStorage.getItem(TKEY) || 0); } catch (e) { return 0; } };
  Coach.trialLeft = () => (Coach.owned() ? 99 : Math.max(0, CM_TRIAL - Coach.trialUsed()));
  Coach.tileSub = () => (Coach.owned() ? 'Yeni mod' : Coach.trialLeft() > 0 ? `${Coach.trialLeft()} maç ücretsiz dene` : 'Yeni mod · kilitli');
  Coach.trialEnd = () => {
    const btns = [{ t: 'Sonra', cls: 'btn-ghost' }, { t: `${Icon('whistle')} Paketi aç`, cls: 'btn-big', fn: () => setTimeout(() => Packs.offer('coach'), 150) }];
    Game.modal(`<div class="ev-tag">Ücretsiz deneme bitti</div><h2>${Icon('whistle')} Kulübün seni bekliyor!</h2>
      <p>${CM_TRIAL} ücretsiz maçını oynadın. Kariyerin kayıtlı: Teknik Direktör paketini açınca kaldığın yerden devam edersin.</p>`, btns, { wide: true });
  };
  const play0 = Coach.play.bind(Coach);
  Coach.play = (quick) => {
    if (!Coach.owned() && Coach.trialLeft() <= 0) return Coach.trialEnd();
    return play0(quick);
  };
  const am0 = Coach.afterMatch.bind(Coach);
  Coach.afterMatch = (m, res) => {
    am0(m, res);
    const s = Coach.s;
    if (!s) return;
    // oyuncuların sana bakışı sonuçlarla değişir
    const win = res.pens ? res.pens.win : res.gf > res.ga, loss = !res.pens && res.gf < res.ga;
    s.trust = U.clamp((s.trust == null ? 60 : s.trust) + (win ? 1.5 : loss ? -1.5 : 0), 0, 100);
    if (!Coach.owned()) {
      try { localStorage.setItem(TKEY, String(Coach.trialUsed() + 1)); } catch (e) { /* yok */ }
      const left = Coach.trialLeft();
      if (typeof Premium !== 'undefined') Premium.track(left ? 'coach_trial_match' : 'coach_trial_end', { left });
      setTimeout(() => Game.toast(left ? `Ücretsiz deneme: ${left} maç kaldı` : 'Ücretsiz deneme maçların bitti', left ? '' : 'bad'), 400);
    }
    Coach.save();
  };

  // ---------- giriş ekranı (3 kariyer yuvası) ----------
  Coach.menu = () => Coach.hub();
  Coach.hub = () => {
    Coach.s = null;
    Game.show('coach');
    const el = document.getElementById('coach');
    const owned = Coach.owned(), left = Coach.trialLeft();
    const slots = [];
    for (let i = 1; i <= CM_SLOTS; i++) slots.push([i, Coach.readSlot(i)]);
    const card = ([i, sv]) => {
      if (!sv) return `<button class="ch-slot empty" data-new="${i}"><i>+</i><span><b>Yeni kariyer</b><small>Boş yuva ${i}</small></span></button>`;
      const c = (sv.clubId && Coach.base(sv.clubId)) || CM_NEUTRAL, r = sv.rec || { w: 0, d: 0, l: 0 };
      const lg = sv.lg ? sv.lg.id : c.league;
      const wk = sv.jobless ? 'İş arıyor' : `${Math.min((sv.round || 0) + 1, 99)}. hafta`;
      return `<div class="ch-slot" style="--c1:${c.c1};--c2:${c.c2}">
        <canvas class="ch-av" width="128" height="128" data-slot="${i}"></canvas>
        <div class="ch-si"><b data-noi18n>${U.esc(`${sv.name} ${sv.surname}`)}</b>
          <small>${sv.jobless ? 'Kulüpsüz' : U.esc(c.name)}</small>
          <small>${U.esc(Coach.lgName(lg) || '')} · ${sv.year} · ${wk}</small>
          <span class="ch-rec"><em>${r.w}G</em><em>${r.d}B</em><em>${r.l}M</em>${(sv.trophies || []).length ? `<em class="gold">🏆 ${sv.trophies.length}</em>` : ''}</span></div>
        <div class="ch-sb"><button class="btn btn-big" data-go="${i}">${Icon('play')} Devam</button><button class="ch-del" data-del="${i}" aria-label="Sil">${Icon('trash')}</button></div></div>`;
    };
    const trial = owned ? '' : left > 0
      ? `<div class="ch-trial"><span data-emo>🎁</span><div><b>${left} maç ücretsiz dene</b><small>Paketi almadan önce takımının başına geç. Kariyerin kaydedilir.</small></div><button class="btn btn-ghost" data-buy>Paketi aç</button></div>`
      : `<div class="ch-trial end"><span data-emo>🔒</span><div><b>Ücretsiz deneme bitti</b><small>Paketi açınca kariyerine kaldığın yerden devam edersin.</small></div><button class="btn btn-big" data-buy>Paketi aç</button></div>`;
    el.innerHTML = `<div class="ch">
      <header class="ch-top"><button class="cm-ib" id="ch-back" aria-label="Geri">${Icon('exit')}</button><span>Teknik Direktör</span><i></i></header>
      <section class="ch-hero"><canvas class="ch-art" width="860" height="440"></canvas>
        <div class="ch-ttl"><small>Yeni mod</small><h1>Teknik Direktör</h1><p>Kadronu kur, taktiğini seç ve maçı kenardan canlı yönet.</p></div></section>
      ${trial}
      <div class="lbl ch-lbl">Kariyerlerin</div>
      <div class="ch-slots">${slots.map(card).join('')}</div>
      <ul class="ch-feat">
        <li><i data-emo>📋</i><span>Taktik, diziliş ve oyuncu rolleri</span></li>
        <li><i data-emo>🏟️</i><span>Maçı kenardan canlı yönet, kritik anlarda topu sen vur</span></li>
        <li><i data-emo>💼</i><span>Gözlemci, pazarlık, transfer ve bütçe</span></li>
        <li><i data-emo>📈</i><span>Taraftar, oyuncular ve yönetimin gözünde yüksel</span></li>
      </ul>
      <p class="ch-note">Teknik Direktör modu yeni ve her güncellemede gelişmeye devam edecek. Fikirlerini bekliyoruz!</p>
    </div>`;
    UI.strip(el);
    Coach.heroArt(el.querySelector('.ch-art'));
    U.$$('canvas[data-slot]', el).forEach((cv) => {
      const sv = Coach.readSlot(+cv.dataset.slot);
      if (sv) Coach.drawHeadFor(cv, sv.look || Coach.defLook(sv), (sv.clubId && Coach.base(sv.clubId)) || CM_NEUTRAL);
    });
    el.querySelector('#ch-back').onclick = () => { el.classList.add('hidden'); Game.toMenu(); };
    U.$$('[data-buy]', el).forEach((b) => (b.onclick = () => Packs.offer('coach')));
    U.$$('[data-go]', el).forEach((b) => (b.onclick = () => {
      const i = +b.dataset.go, sv = Coach.readSlot(i);
      if (!sv) return;
      Coach.useSlot(i); Coach.s = sv; Coach.enter();
    }));
    U.$$('[data-new]', el).forEach((b) => (b.onclick = () => {
      if (!owned && left <= 0) return Coach.trialEnd();
      if (!owned && typeof Premium !== 'undefined') Premium.track('coach_trial_start', { left });
      Coach.useSlot(+b.dataset.new); Coach.create();
    }));
    U.$$('[data-del]', el).forEach((b) => (b.onclick = () => {
      const i = +b.dataset.del, sv = Coach.readSlot(i);
      Game.modal(`<h3>Kariyer silinsin mi?</h3><p><b data-noi18n>${U.esc(`${sv.name} ${sv.surname}`)}</b>: bu kariyer kalıcı olarak silinecek.</p>`, [
        { t: 'Vazgeç', cls: 'btn-ghost' },
        { t: 'Sil', cls: 'btn-danger', fn: () => { try { Store.remove(Coach.keyOf(i)); } catch (e) { /* yok */ } Coach.hub(); } },
      ]);
    }));
    window.scrollTo(0, 0);
  };
  // geri dönünce giriş ekranına
  Coach.exit = () => { Coach.save(); Coach.hub(); };

  // giriş görseli: gece stadyumu, taktik tahtası ve takım elbiseli hoca
  Coach.heroArt = (cv) => {
    if (!cv) return;
    const c = cv.getContext('2d'), W = cv.width, H = cv.height;
    const P = { c1: '#1f6b3e', c2: '#ffcf3f', short: 'STARFOOT' };
    try {
      SocialArt.blurred(c, W, H, 3, (b) => SocialArt.stadium(b, W, H, SocialArt.rng(31), P, false));
    } catch (e) { c.fillStyle = '#0b1020'; c.fillRect(0, 0, W, H); }
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(8,12,28,.15)'); g.addColorStop(0.6, 'rgba(8,12,28,.35)'); g.addColorStop(1, 'rgba(8,12,28,.95)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // taktik tahtası
    const bw = W * 0.34, bh = bw * 0.62, bx = W * 0.6, by = H * 0.16;
    c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 24; c.fillStyle = '#1f6b3e'; c.fillRect(bx, by, bw, bh); c.restore();
    c.strokeStyle = '#e8eef5'; c.lineWidth = 6; c.strokeRect(bx, by, bw, bh);
    c.lineWidth = 2.5; c.strokeStyle = 'rgba(255,255,255,.8)';
    c.beginPath(); c.moveTo(bx + bw / 2, by); c.lineTo(bx + bw / 2, by + bh); c.stroke();
    c.beginPath(); c.arc(bx + bw / 2, by + bh / 2, bh * 0.16, 0, Math.PI * 2); c.stroke();
    [[0.12, 0.5], [0.27, 0.2], [0.27, 0.4], [0.27, 0.6], [0.27, 0.8], [0.45, 0.3], [0.45, 0.5], [0.45, 0.7], [0.65, 0.22], [0.68, 0.5], [0.65, 0.78]].forEach(([x, y]) => {
      c.fillStyle = '#ffcf3f'; c.beginPath(); c.arc(bx + bw * x, by + bh * y, 8, 0, Math.PI * 2); c.fill();
    });
    c.strokeStyle = '#fff'; c.lineWidth = 4; c.beginPath(); c.moveTo(bx + bw * 0.45, by + bh * 0.5); c.quadraticCurveTo(bx + bw * 0.6, by + bh * 0.3, bx + bw * 0.82, by + bh * 0.4); c.stroke();
    const kit = { shirt: '#1d2433', alt: '#fff', pattern: 'plain', shorts: '#1d2433', socks: '#1d2433', pants: '#1d2433', coat: 'suit', tie: '#c8102e' };
    const look = { skin: SKINS[1], hair: HAIRS[0], style: 'slick', beard: 'stubble', boots: '#111' };
    Sprites.figure(c, W * 0.36, H * 1.0, H * 0.8, { kit, look, facing: 'down', number: null, t: 0, longSleeve: true });
  };

  // ---------- görünüm (oluştururken de seçilir) ----------
  Coach.defLook = (s) => {
    const r = ((s && s.name) || 'x').length + ((s && s.surname) || 'y').length;
    return { outfit: 'track', col: null, skin: SKINS[r % 3], hair: HAIRS[r % 4], style: 'short', beard: r % 3 === 0 ? 'stubble' : '0' };
  };
  Coach.lookObj = (lk) => ({ skin: lk.skin, hair: lk.hair, style: lk.style, bald: lk.bald, beard: lk.beard === '0' ? 0 : lk.beard, boots: lk.outfit === 'casual' ? '#e9e6df' : lk.outfit === 'suit' ? '#111' : '#f2f2f2' });
  Coach.drawFig = (cv, lk, club, bg) => {
    const c = cv.getContext('2d'), W = cv.width, H = cv.height;
    c.clearRect(0, 0, W, H);
    if (bg === 'wiki') { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#dfe7f2'); g.addColorStop(1, '#b8c6da'); c.fillStyle = g; }
    else { const g = c.createRadialGradient(W / 2, H * 0.35, 10, W / 2, H / 2, H); g.addColorStop(0, Sprites.shade(club.c1, -0.15)); g.addColorStop(1, '#0b1020'); c.fillStyle = g; }
    c.fillRect(0, 0, W, H);
    Sprites.figure(c, W / 2, H * 0.96, H * 0.9, { kit: Coach.kitFor(lk, club), look: Coach.lookObj(lk), facing: 'down', number: null, t: 0, longSleeve: true, noShadow: bg === 'wiki' });
  };
  Coach.drawMe = (cv, bg) => Coach.drawFig(cv, Coach.look(), Coach.my(), bg);
  // yuvarlak profil fotoğrafı: baş ve omuzlar ortalanır
  Coach.drawHeadFor = (cv, lk, club) => {
    const c = cv.getContext('2d'), W = cv.width;
    c.clearRect(0, 0, W, W);
    c.save(); c.beginPath(); c.arc(W / 2, W / 2, W / 2, 0, Math.PI * 2); c.clip();
    const g = c.createLinearGradient(0, 0, 0, W); g.addColorStop(0, Sprites.shade(club.c1, 0.05)); g.addColorStop(1, Sprites.shade(club.c1, -0.45));
    c.fillStyle = g; c.fillRect(0, 0, W, W);
    Sprites.figure(c, W / 2, W * 2.55, W * 2.6, { kit: Coach.kitFor(lk, club), look: Coach.lookObj(lk), facing: 'down', number: null, t: 0, longSleeve: true, noShadow: true });
    c.restore();
  };
  Coach.drawHead = (cv) => Coach.drawHeadFor(cv, Coach.look(), Coach.my());

  // görünüm stüdyosu: kariyer içinde ya da oluştururken (o.club ve o.done ile)
  Coach.lookPicker = (o) => {
    const cur = Object.assign({}, o.look);
    const club = o.club || CM_NEUTRAL;
    const chips = (k, list) => list.map(([v, l]) => `<button class="chip ${String(cur[k]) === String(v) ? 'on' : ''}" data-k="${k}" data-v="${v}">${l}</button>`).join('');
    const sw = (k, list) => list.map((v) => `<button class="stu-sw ${cur[k] === v ? 'on' : ''}" data-k="${k}" data-v="${v}" style="background:${v}"></button>`).join('');
    const cols = () => (cur.outfit === 'suit' ? CM_SUITS : cur.outfit === 'casual' ? CM_KNITS : []);
    const btns = [{ t: o.first ? 'Devam' : 'Kaydet', cls: 'btn-big', fn: () => o.done(cur) }];
    if (!o.first) btns.push({ t: 'Vazgeç', cls: 'btn-ghost' });
    const m = Game.modal(`${o.first ? '<div class="ev-tag">Teknik Direktör</div>' : ''}<h3>${Icon('coach')} ${o.first ? 'Dış görünüşünü seç' : 'Görünüm'}</h3>
      <div class="stu-wrap"><canvas class="stu-cv cm-stu" width="260" height="320"></canvas></div>
      <div class="lbl">Kıyafet</div><div class="cm-outs">${Object.entries(CM_OUTFITS).map(([k, v]) => `<button class="cm-out ${cur.outfit === k ? 'on' : ''}" data-k="outfit" data-v="${k}"><b>${v.t}</b><small>${v.d}</small></button>`).join('')}</div>
      <div class="cm-cols"><div class="lbl">Renk</div><div class="stu-row" id="cm-cols"></div></div>
      <div class="lbl">Ten rengi</div><div class="stu-row">${sw('skin', SKINS)}</div>
      <div class="lbl">Saç rengi</div><div class="stu-row">${sw('hair', HAIRS.concat(['#9aa0a6', '#e8e8e8']))}</div>
      <div class="lbl">Saç modeli</div><div class="chip-row">${chips('style', [['short', 'Kısa'], ['buzz', 'Asker'], ['slick', 'Geriye taranmış'], ['side', 'Yana yatık'], ['long', 'Uzun']])}<button class="chip ${cur.bald ? 'on' : ''}" data-k="bald" data-v="1">Kel</button></div>
      <div class="lbl">Sakal</div><div class="chip-row">${chips('beard', [['0', 'Yok'], ['stubble', 'Kirli sakal'], ['full', 'Tam sakal'], ['goatee', 'Keçi sakal'], ['mustache', 'Bıyık']])}</div>`, btns, { wide: true });
    const cv = m.querySelector('.cm-stu');
    const bind = (b) => (b.onclick = () => {
      const k = b.dataset.k, v = b.dataset.v;
      if (k === 'bald') cur.bald = !cur.bald;
      else { cur[k] = v; if (k === 'style') cur.bald = false; }
      if (k === 'outfit') cur.col = v === 'suit' ? CM_SUITS[0] : v === 'casual' ? CM_KNITS[0] : null;
      draw();
    });
    const draw = () => {
      Coach.drawFig(cv, cur, club);
      const box = m.querySelector('#cm-cols'), cl = cols();
      box.parentNode.style.display = cl.length ? '' : 'none';
      box.innerHTML = cl.map((v) => `<button class="stu-sw ${cur.col === v ? 'on' : ''}" data-k="col" data-v="${v}" style="background:${v}"></button>`).join('');
      U.$$('[data-k="col"]', box).forEach(bind);
      U.$$('[data-k]', m).forEach((b) => { const k = b.dataset.k, v = b.dataset.v; b.classList.toggle('on', k === 'bald' ? !!cur.bald : String(cur[k]) === v); });
    };
    U.$$('[data-k]', m).forEach(bind);
    draw();
  };
  Coach.studio = () => Coach.lookPicker({ look: Coach.look(), club: Coach.my(), done: (lk) => { Coach.s.look = lk; Coach.save(); Coach.render(); Game.toast('Görünümün kaydedildi.', 'good'); } });

  // oluşturma: ad ve geçmişten sonra görünüm, sonra iş teklifleri; yuvalar doluysa birini seçtir
  const begin0 = Coach.begin.bind(Coach);
  Coach.begin = (o) => {
    if (!Coach.pickedSlot) {
      const free = Coach.freeSlot();
      if (free) Coach.useSlot(free);
      else return Coach.slotPicker((i) => { Coach.useSlot(i); Coach.pickedSlot = true; Coach.begin(o); });
    }
    Coach.pickedSlot = false;
    if (!o.look) return Coach.lookPicker({ first: true, look: Coach.defLook(o), done: (lk) => { o.look = lk; begin0(o); } });
    return begin0(o);
  };
  Coach.slotPicker = (fn) => {
    const rows = [];
    for (let i = 1; i <= CM_SLOTS; i++) { const sv = Coach.readSlot(i); rows.push(`<button class="cm-offer" data-ps="${i}"><span><b>Yuva ${i}</b><small data-noi18n>${sv ? U.esc(`${sv.name} ${sv.surname} · ${(Coach.base(sv.clubId) || {}).name || ''} · ${sv.year}`) : ''}</small></span>${Icon('chevron')}</button>`); }
    const m = Game.modal(`<div class="ev-tag">Teknik Direktör</div><h3>Tüm kariyer yuvaların dolu</h3><p>Yeni kariyer seçtiğin yuvadakinin yerine geçecek.</p><div class="cm-offers">${rows.join('')}</div>`, [{ t: 'Vazgeç', cls: 'btn-ghost' }], { wide: true });
    U.$$('[data-ps]', m).forEach((b) => (b.onclick = () => { m.classList.add('hidden'); m.innerHTML = ''; fn(+b.dataset.ps); }));
  };
  // eski menü "Yeni kariyer" yerine giriş ekranı kullanılır; create() içindeki "Devam" begin'i çağırır
  const create0 = Coach.create.bind(Coach);
  Coach.create = () => { Coach.pickedSlot = true; create0(); };
  const start0 = Coach.start.bind(Coach);
  Coach.start = (o, clubId) => {
    start0(o, clubId);
    if (o.look) { Coach.s.look = o.look; Coach.save(); Coach.render(); }
  };
  // futbolculuktan teknik direktörlüğe geçişte yuva boşsa kullanılır, doluysa seçtirilir
  const fp0 = Coach.fromPlayer.bind(Coach);
  Coach.fromPlayer = (p, legend) => { Coach.pickedSlot = false; return fp0(p, legend); };

  // ---------- sosyal medya: fotoğraflı gönderiler ----------
  const post0 = Coach.post.bind(Coach);
  Coach.post = (kind, text, boost) => {
    post0(kind, text, boost);
    const s = Coach.s, x = s.feed[0];
    x.id = (s.pid2 = (s.pid2 || 0) + 1);
    x.seed = Math.floor(Math.random() * 1e6);
    if (kind === 'match' && s.last) { x.opp = s.last.opp; x.gf = s.last.gf; x.ga = s.last.ga; x.home = s.last.home; }
    if (kind === 'sign' && Coach.lastSigned) { x.pn = Coach.lastSigned.n; x.pp = Coach.lastSigned.pos; }
    x.lk = Object.assign({}, Coach.look());
  };
  const sign0 = Coach.sign;
  Coach.sign = (p, ...a) => { Coach.lastSigned = p; const r = sign0(p, ...a); Coach.lastSigned = null; return r; };

  Coach.artCache = new Map();
  Coach.art = (x) => {
    const key = `${x.id || x.t}|${x.seed || 0}`;
    if (Coach.artCache.has(key)) return Coach.artCache.get(key);
    const cv = document.createElement('canvas'); cv.width = SocialArt.W; cv.height = SocialArt.H;
    try { Coach.drawPost(cv.getContext('2d'), x); } catch (e) { console.error(e); }
    Coach.artCache.set(key, cv);
    if (Coach.artCache.size > 24) Coach.artCache.delete(Coach.artCache.keys().next().value);
    return cv;
  };
  Coach.drawPost = (c, x) => {
    const W = SocialArt.W, H = SocialArt.H, r = SocialArt.rng(x.seed || (x.t || '').length * 97);
    const club = Coach.club(x.cl) || CM_NEUTRAL;
    const P = { c1: club.c1, c2: club.c2, short: club.short || club.name };
    const lk = x.lk || Coach.look();
    const kit = Coach.kitFor(lk, club), look = Coach.lookObj(lk);
    const me = (sx, sy, h, o) => SocialArt.lit(c, (l) => Sprites.figure(l, sx, sy, h, Object.assign({ kit, look, facing: 'down', number: null, noShadow: true, t: 0, longSleeve: true }, o)));
    let sc = x.sc || '';
    let res = '';
    if (x.k === 'match') {
      const gf = x.gf != null ? x.gf : +(sc.split('-')[0] || 0), ga = x.ga != null ? x.ga : +(sc.split('-')[1] || 0);
      res = gf > ga ? 'w' : gf === ga ? 'd' : 'l';
      sc = `${gf}-${ga}`;
    }
    let tone = 'cool';
    if (x.k === 'match' || x.k === 'trophy') {
      SocialArt.blurred(c, W, H, 2.5, (b) => SocialArt.stadium(b, W, H, r, P, false));
      SocialArt.glow(c, W * 0.5, H * 0.45, W * 0.5, 'rgba(255,245,215,0.22)');
      if (x.k === 'trophy') {
        const h = H * 0.74, sx = W * 0.5, sy = H * 1.04;
        me(sx, sy, h, { dive: 1 });
        SocialArt.trophyCup(c, sx, sy - h * 1.18, h * 0.17);
        SocialArt.confetti(c, W, H, r, P);
        tone = 'warm';
      } else {
        me(W * 0.5, H * 1.06, H * 0.8, res === 'w' ? { dive: 1 } : {});
        // maç skoru bandı
        const opp = x.opp ? Coach.club(x.opp) : null;
        const L = x.home === false && opp ? opp : club, R = x.home === false ? club : opp;
        const [lg, rg] = x.home === false ? sc.split('-').reverse() : sc.split('-');
        const bw = W * 0.86, bh = H * 0.085, bx = (W - bw) / 2, by = H * 0.06;
        c.save(); c.shadowColor = 'rgba(0,0,0,.45)'; c.shadowBlur = 18;
        c.fillStyle = 'rgba(10,14,30,.88)'; c.fillRect(bx, by, bw, bh); c.restore();
        const team = (t, x0, al) => {
          if (!t) return;
          c.fillStyle = t.c1; c.fillRect(al === 'left' ? bx : bx + bw - bh * 0.18, by, bh * 0.18, bh);
          c.font = `800 ${Math.round(bh * 0.42)}px "Saira Condensed", "Arial Narrow", sans-serif`; c.textBaseline = 'middle'; c.textAlign = al; c.fillStyle = '#fff';
          c.fillText(String(t.short || t.name).toLocaleUpperCase('tr').slice(0, 12), x0, by + bh / 2, bw * 0.3);
        };
        team(L, bx + bh * 0.32, 'left'); team(R, bx + bw - bh * 0.32, 'right');
        c.fillStyle = res === 'w' ? '#2bb673' : res === 'l' ? '#d64545' : '#6b7486';
        c.fillRect(W / 2 - bw * 0.14, by, bw * 0.28, bh);
        c.font = `900 ${Math.round(bh * 0.62)}px "Saira Condensed", "Arial Narrow", sans-serif`; c.textAlign = 'center'; c.fillStyle = '#fff';
        c.fillText(`${lg} - ${rg}`, W / 2, by + bh / 2 + 1);
        c.textAlign = 'left';
        tone = res === 'w' ? 'warm' : 'cool';
      }
    } else if (x.k === 'club' || x.k === 'sign') {
      SocialArt.backdrop(c, W, H, P, String(P.short || '').toLocaleUpperCase('tr'));
      SocialArt.bokeh(c, W, H, r, ['rgba(255,255,255,0.9)'], 5, 0.1, 0.5);
      if (x.k === 'club') {
        // takım atkısıyla tanıtım
        const h = H * 0.8, sx = W * 0.5, sy = H * 1.08;
        me(sx, sy, h, { dive: 1 });
        const hy = sy - h * 1.13, sw = h * 0.62, sh = h * 0.085;
        c.fillStyle = P.c1; c.fillRect(sx - sw / 2, hy - sh / 2, sw, sh);
        c.fillStyle = P.c2; for (let i = 0; i < 6; i++) c.fillRect(sx - sw / 2 + i * sw / 6 + sw / 24, hy - sh / 2, sw / 24, sh);
        c.fillStyle = P.c1; c.fillRect(sx - sw * 0.28, hy - sh * 0.4, sw * 0.56, sh * 0.8);
        c.font = `800 ${Math.round(sh * 0.62)}px "Saira Condensed", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = Sprites.colorDist(P.c1, P.c2) < 90 ? '#fff' : P.c2; c.fillText(String(P.short || '').toLocaleUpperCase('tr'), sx, hy + 1); c.textAlign = 'left';
      } else {
        // yeni transferle forma tutarak
        let sd = 0; for (const ch of (x.pn || 'x')) sd = (sd * 31 + ch.charCodeAt(0)) % 9973;
        const pk = Sprites.kit(club, false);
        SocialArt.lit(c, (l) => Sprites.figure(l, W * 0.68, H * 1.06, H * 0.76, { kit: pk, look: Sprites.look(sd), facing: 'down', number: 7 + (sd % 20), noShadow: true, t: 0 }));
        me(W * 0.32, H * 1.07, H * 0.78, {});
        const fx = W * 0.5, fy = H * 0.6, fw = W * 0.2, fh = W * 0.22;
        c.save(); c.translate(fx, fy); c.rotate(-0.06);
        c.fillStyle = P.c1; c.beginPath(); c.moveTo(-fw / 2, -fh / 2); c.lineTo(fw / 2, -fh / 2); c.lineTo(fw / 2, fh / 2); c.lineTo(-fw / 2, fh / 2); c.fill();
        c.fillStyle = P.c2; c.fillRect(-fw / 2, -fh / 2, fw, fh * 0.1);
        c.font = `900 ${Math.round(fh * 0.5)}px "Saira Condensed", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillStyle = Sprites.colorDist(P.c1, P.c2) < 90 ? '#fff' : P.c2; c.fillText(String(7 + (sd % 20)), 0, fh * 0.08);
        c.restore(); c.textAlign = 'left';
      }
      tone = 'none';
    } else if (x.k === 'fans') {
      // taraftar buluşması: gündüz, dolu tribün önünde selam
      SocialArt.blurred(c, W, H, 2.5, (b) => SocialArt.stadium(b, W, H, r, P, true));
      me(W * 0.5, H * 1.06, H * 0.8, { armA: 1.4 });
      SocialArt.confetti(c, W, H * 0.6, r, P);
      tone = 'warm';
    } else {
      // antrenman sahası
      SocialArt.blurred(c, W, H, 2, (b) => {
        const sky = b.createLinearGradient(0, 0, 0, H * 0.5); sky.addColorStop(0, '#6aa8ea'); sky.addColorStop(1, '#d7ecfb');
        b.fillStyle = sky; b.fillRect(0, 0, W, H);
        b.fillStyle = '#2f5b33'; for (let i = 0; i < W; i += 26) { b.beginPath(); b.arc(i, H * 0.43, 24 + r() * 16, 0, Math.PI * 2); b.fill(); }
        for (let i = 0; i < 8; i++) { const y0 = H * 0.45 + (H * 0.55) * Math.pow(i / 8, 1.5), y1 = H * 0.45 + (H * 0.55) * Math.pow((i + 1) / 8, 1.5); b.fillStyle = i % 2 ? '#4caf50' : '#43a047'; b.fillRect(0, y0, W, y1 - y0 + 1); }
      });
      me(W * 0.5, H * 1.08, H * 0.82, {});
      tone = 'warm';
    }
    if (tone !== 'none') { c.save(); c.globalCompositeOperation = 'soft-light'; c.fillStyle = tone === 'warm' ? 'rgba(255,160,70,0.3)' : 'rgba(70,120,255,0.25)'; c.fillRect(0, 0, W, H); c.restore(); }
    const v = c.createRadialGradient(W / 2, H * 0.45, W * 0.35, W / 2, H * 0.5, W * 0.85);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.45)');
    c.fillStyle = v; c.fillRect(0, 0, W, H);
    SocialArt.grain(c, W, H, 0.1);
  };
  Coach.feedHtml = () => {
    const s = Coach.s, f = s.feed || [], c = Coach.my();
    const me = U.esc(Coach.fullName()), handle = `@${(s.name + s.surname).toLowerCase().replace(/[^a-z0-9ğüşıöç]/gi, '').slice(0, 20)}`;
    const fmt = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : n);
    const ver = s.rep >= 55 ? (typeof IG !== 'undefined' ? IG.verified() : '') : '';
    const loc = (x) => { const cl = Coach.club(x.cl) || c; return x.k === 'match' || x.k === 'trophy' || x.k === 'fans' ? `${cl.name} Stadyumu` : x.k === 'club' || x.k === 'sign' ? `${cl.name} Basın Salonu` : `${cl.name} Antrenman Merkezi`; };
    const card = (x, i) => `<div class="cmf-post"><div class="cmf-h"><canvas class="cmf-av" width="80" height="80"></canvas><span><b data-noi18n>${me}</b>${ver}<small>${U.esc(loc(x))}</small></span></div>
        <canvas class="cmf-img" data-fi="${i}"></canvas>
        <div class="cmf-f" data-emo><span>❤️ ${fmt(x.l)}</span><span>💬 ${fmt(x.c)}</span><small>${x.y} · ${x.r}. hafta</small></div>
        <p><b data-noi18n>${U.esc(handle.slice(1))}</b> ${U.esc(x.t)}</p></div>`;
    return `<div class="cmf-prof"><canvas class="cmf-big" width="160" height="160"></canvas><div><b data-noi18n>${me}</b>${ver}<small data-noi18n>${handle}</small>
      <div class="cmf-n"><span><b>${f.length}</b> gönderi</span><span><b>${fmt(Coach.fol())}</b> takipçi</span></div>
      <small class="cmf-bio">${s.jobless ? 'Teknik direktör' : `${U.esc(c.name)} teknik direktörü`}</small></div></div>
      <div class="cmf-list">${f.map(card).join('') || '<p class="muted">Henüz gönderi yok. Maçlardan sonra paylaşımların burada görünür.</p>'}</div>`;
  };
  Coach.social = () => {
    const m = Game.modal(`<div class="cmf">${Coach.feedHtml()}</div>`, [{ t: 'Kapat', cls: 'btn-ghost' }], { wide: true });
    U.$$('canvas.cmf-av, canvas.cmf-big', m).forEach((cv) => Coach.drawHead(cv));
    const f = Coach.s.feed || [];
    const paint = (cv) => {
      const x = f[+cv.dataset.fi];
      if (!x || cv.dataset.done) return;
      cv.dataset.done = '1';
      const img = Coach.art(x), dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(120, Math.round(cv.clientWidth || 300));
      cv.width = w * dpr; cv.height = Math.round(w * 1.25) * dpr;
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
    };
    const list = U.$$('canvas.cmf-img', m);
    // görünür olanlar hemen, diğerleri kaydırınca çizilir
    list.slice(0, 3).forEach(paint);
    const box = m.querySelector('.cmf-list');
    if (box) box.addEventListener('scroll', () => list.forEach((cv) => { if (cv.getBoundingClientRect().top < window.innerHeight + 200) paint(cv); }), { passive: true });
    setTimeout(() => list.slice(3, 8).forEach(paint), 250);
  };

  // ---------- ayarlar: dil ve para birimi (oyunun genel ayarlarıyla ortak) ----------
  Coach.setCur = (k) => { try { if (k) localStorage.setItem('starfoot_cur', k); else localStorage.removeItem('starfoot_cur'); } catch (e) { /* yok */ } };
  Coach.settings = () => {
    let cur = '';
    try { cur = localStorage.getItem('starfoot_cur') || ''; } catch (e) { /* yok */ }
    const m = Game.modal(`<h3>${Icon('cog')} Ayarlar</h3>
      <div class="set-row"><span><b>Para birimi</b><small>Otomatik: telefonun bölgesine göre (${U.CUR[U.curAuto()].sym})</small></span><div class="seg" data-noi18n>${[['', 'Oto'], ['TRY', '₺'], ['USD', '$'], ['EUR', '€'], ['GBP', '£']].map(([k, l]) => `<button data-cmcur="${k}" class="${cur === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
      <div class="set-row"><span><b>Dil / Language</b></span><select class="lang-sel" data-cmlang data-noi18n>${Object.entries(I18N.LANGS).map(([k, n]) => `<option value="${k}"${k === I18N.lang ? ' selected' : ''}>${n}</option>`).join('')}</select></div>`, [{ t: 'Kapat', cls: 'btn-ghost' }], { wide: true });
    U.$$('[data-cmcur]', m).forEach((b) => (b.onclick = () => {
      Coach.setCur(b.dataset.cmcur);
      U.$$('[data-cmcur]', m).forEach((x) => x.classList.toggle('on', x === b));
      Coach.render();
    }));
    const sel = m.querySelector('[data-cmlang]');
    if (sel) sel.onchange = () => { if (sel.value !== I18N.lang) { Coach.save(); I18N.set(sel.value); } };
  };
  // dil değişince teknik direktör ekranı yeniden çizilir (oyuncu kariyeri ekranına dönmeden)
  const onCh = I18N.onChange;
  I18N.onChange = (l) => {
    const el = document.getElementById('coach');
    if (el && !el.classList.contains('hidden')) { if (Coach.s) Coach.render(); else Coach.hub(); window.dispatchEvent(new Event('resize')); return; }
    if (typeof onCh === 'function') onCh(l);
  };

  // ---------- taraftar / oyuncular / yönetim, enerji, kimya ve haftalık aksiyonlar ----------
  const mig0 = Coach.migrate.bind(Coach);
  Coach.migrate = (s) => { mig0(s); if (s.trust == null) s.trust = 60; if (s.ap == null) s.ap = 3; return s; };
  Coach.energy = () => { const s = Coach.s, xi = Coach.xiPlayers(); const l = xi.length ? xi : s.squad.filter((p) => !p.loan); return Coach.avg(l.map((p) => p.fit)); };
  const week0 = Coach.week.bind(Coach);
  Coach.week = () => {
    week0();
    const s = Coach.s;
    s.ap = 3;
    s.trust = s.trust == null ? 60 : s.trust;
    s.trust += (58 - s.trust) * 0.07;
    s.trainB = 0;
    // oyuncuların güveni morali, düşük güven kimyayı etkiler
    s.squad.forEach((p) => { if (!p.loan) p.mor = U.clamp(p.mor + (s.trust - 55) * 0.03, 25, 100); });
    if (s.trust < 25) s.chem = U.clamp(s.chem - 1, 0, 100);
  };
  const gain = (v, base) => base * Math.pow(1 - U.clamp(v, 0, 100) / 105, 1.3);
  Coach.act = (k) => {
    const s = Coach.s;
    if (!s || s.jobless) return;
    if ((s.ap || 0) <= 0) return Game.toast('Bu hafta aksiyon hakkın kalmadı. Maça çık!', 'bad');
    const team = s.squad.filter((p) => !p.loan);
    let title = '', msg = '', ic = '';
    const snap = () => ({ en: Coach.energy(), chem: s.chem, trust: s.trust, fans: s.fans, conf: s.conf });
    const b4 = snap();
    const chem = (v) => { s.chem = U.clamp(s.chem + v, 0, 100); };
    s.boost = s.boost || { att: 0, def: 0, set: 0 };
    if (k === 'train') {
      s.trainB = (s.trainB || 0) + 1;
      // gelişim: haftada en fazla 2 antrenman sayılır, normal haftalık gelişimin yaklaşık üçte biri kadar
      team.forEach((p) => { p.fit = U.clamp(p.fit - 10, 15, 100); if (s.trainB <= 2 && p.age <= 24 && p.r < p.pot) p.r = Math.min(p.pot, p.r + (p.pot - p.r) * 0.006 * (1 + 0.1 * (s.fac.train - 1))); });
      if (s.trainB <= 2) { s.boost.att = (s.boost.att || 0) + 0.9; s.boost.def = (s.boost.def || 0) + 0.9; }
      ic = '🏋️'; title = 'Antrenman'; msg = 'Yoğun bir antrenman yapıldı. Takım maça daha hazır, gençler gelişti ama oyuncular yoruldu.';
    } else if (k === 'rest') {
      team.forEach((p) => { p.fit = U.clamp(p.fit + 14, 0, 100); if (p.inj > 1 && U.chance(0.3)) p.inj--; });
      s.trust = U.clamp(s.trust + gain(s.trust, 1), 0, 100);
      ic = '😴'; title = 'Dinlenme'; msg = 'Oyuncular dinlendi, enerji toplandı. Sakatların iyileşmesi hızlandı.';
    } else if (k === 'bond') {
      const [i2, t2, d2] = U.pick(CM_BOND);
      chem(gain(s.chem, 4)); s.trust = U.clamp(s.trust + gain(s.trust, 3), 0, 100);
      team.forEach((p) => { p.mor = U.clamp(p.mor + 4, 25, 100); p.fit = U.clamp(p.fit - 2, 15, 100); });
      ic = i2; title = t2; msg = d2;
    } else if (k === 'fans') {
      const g = gain(s.fans, 7); s.fans = U.clamp(s.fans + g, 0, 100);
      ic = '📣'; title = 'Taraftar buluşması'; msg = U.pick(['İmza gününde yüzlerce taraftarla fotoğraf çektirdin.', 'Açık antrenmanı binlerce taraftar izledi, tribünler şarkılarla inledi.', 'Taraftar derneğini ziyaret ettin, sözlerin sosyal medyada çok paylaşıldı.']);
      if (Coach.post) Coach.post('fans', U.pick(['Bugün taraftarlarımızla buluştuk. Bu destek bize güç veriyor!', 'Tribünlerimiz bizim en büyük gücümüz. Teşekkürler!']), 1.1);
    } else if (k === 'board') {
      const form = (s.cf[s.clubId] || '').slice(-3), w = (form.match(/G/g) || []).length, l = (form.match(/M/g) || []).length;
      const g = gain(s.conf, 3 + w * 1.5 - l * 1);
      s.conf = U.clamp(s.conf + Math.max(0.5, g), 0, 100);
      ic = '🤝'; title = 'Yönetimle toplantı';
      msg = l >= 2 ? 'Başkan projeni dinledi ama sonuç görmek istiyor.' : w >= 2 ? 'Başkan son sonuçlardan çok memnun, projene tam destek veriyor.' : 'Projeni anlattın, yönetim kurulu seni dikkatle dinledi.';
    } else if (k === 'talk') {
      const sad = team.slice().sort((a, b) => a.happy - b.happy).slice(0, 2);
      sad.forEach((p) => { p.happy = U.clamp(p.happy + 15, 0, 100); p.mor = U.clamp(p.mor + 5, 25, 100); });
      s.trust = U.clamp(s.trust + gain(s.trust, 4.5), 0, 100);
      ic = '🗣️'; title = 'Birebir görüşme'; msg = sad.length ? `${sad.map((p) => p.n).join(' ve ')} ile konuştun. Beklentilerini dinledin, içleri rahatladı.` : 'Oyuncularla tek tek konuştun.';
    } else return;
    s.ap--;
    Coach.save();
    const af = snap(), lbl = { en: 'Enerji', chem: 'Kimya', trust: 'Oyuncular', fans: 'Taraftar', conf: 'Yönetim' };
    const chips = Object.keys(lbl).map((k) => [k, Math.round((af[k] - b4[k]) * 10) / 10]).filter(([, d]) => Math.abs(d) >= 0.5)
      .map(([k, d]) => `<span class="cp-d ${d > 0 ? 'up' : 'dn'}">${d > 0 ? '+' : ''}${Math.round(d)} ${lbl[k]}</span>`).join('');
    const extra = k === 'train' ? (s.trainB <= 2 ? '<span class="cp-d up">Maç hazırlığı ↑</span>' : '<span class="cp-d">Hazırlık zaten en üstte</span>') : '';
    Game.modal(`<div class="ev-tag">Haftalık aksiyon · ${s.ap}/3 hak kaldı</div><h3><span data-emo>${ic}</span> ${title}</h3><p>${U.esc(msg)}</p>${chips || extra ? `<div class="cp-ds">${chips}${extra}</div>` : ''}`, [{ t: 'Tamam', cls: 'btn-big' }]);
    Coach.render();
  };
  Coach.vPulse = () => {
    const s = Coach.s;
    if (s.jobless) return '';
    const bar = (ic, l, v, col) => `<div class="cp-b"><span><i data-emo>${ic}</i>${l}</span><i class="cp-t"><i style="width:${Math.round(v)}%;background:${col}"></i></i><b>${Math.round(v)}</b></div>`;
    const tone = (v) => (v > 60 ? '#46e08f' : v > 35 ? '#ffcf3f' : '#ff6b6b');
    const en = Coach.energy();
    const acts = (grp) => CM_ACTS.filter((a) => a[4] === grp).map(([k, ic, t, d]) => `<button class="cp-a" data-act="${k}" ${s.ap <= 0 ? 'disabled' : ''}><i data-emo>${ic}</i><b>${t}</b><small>${d}</small></button>`).join('');
    return `<section class="card cp"><div class="card-h"><span>${Icon('fans')} Sana bakış</span><span class="ap-pips ${s.ap ? '' : 'done'}">${[0, 1, 2].map((i) => `<i class="${i < s.ap ? 'on' : ''}"></i>`).join('')}<b>${s.ap ? `${s.ap} hak` : 'Maç günü'}</b></span></div>
      <div class="cp-bars">${bar('📣', 'Taraftar', s.fans, tone(s.fans))}${bar('👕', 'Oyuncular', s.trust, tone(s.trust))}${bar('🏛️', 'Yönetim', s.conf, tone(s.conf))}</div>
      <div class="cp-team"><div><span><i data-emo>⚡</i> Takım enerjisi</span><b style="color:${tone(en)}">${Math.round(en)}</b></div><div><span><i data-emo>🧩</i> Takım kimyası</span><b style="color:${tone(s.chem)}">${Math.round(s.chem)}</b></div></div>
      ${s.ap > 0 ? `<div class="lbl">Takım</div><div class="cp-acts">${acts('team')}</div><div class="lbl">İlişkiler</div><div class="cp-acts">${acts('rel')}</div>` : '<p class="muted cp-done">Bu haftaki aksiyon haklarını kullandın. Sıra maçta!</p>'}</section>`;
  };
  const vHome0 = Coach.vHome.bind(Coach);
  Coach.vHome = () => {
    const h = vHome0();
    const s = Coach.s;
    if (s.jobless) return h;
    const i = h.indexOf('</section>');
    return i >= 0 ? h.slice(0, i + 10) + Coach.vPulse() + h.slice(i + 10) : Coach.vPulse() + h;
  };
  // kulüp durumu kartındaki eski üç bar yeni karta taşındı
  const vStatus0 = Coach.vStatus.bind(Coach);
  Coach.vStatus = () => vStatus0().replace(/<div class="cm-mts">[\s\S]*?<\/div><\/div>/, '');
  const bind0 = Coach.bind;
  Coach.bind = (el) => {
    bind0(el);
    U.$$('[data-act]', el).forEach((b) => (b.onclick = () => Coach.act(b.dataset.act)));
  };
  // maça çıkarken kullanılmamış hak varsa sor
  const play1 = Coach.play;
  Coach.play = (quick) => {
    const s = Coach.s;
    if (s && s.ap > 0 && !s.jobless && !Coach.apAsked) {
      return Game.modal(`<h3>Maça çıkılsın mı?</h3><p>Bu hafta kullanılmamış <b>${s.ap}</b> aksiyon hakkın var. Maça çıkarsan bu haklar kaybolacak.</p>`, [
        { t: 'Geri dön', cls: 'btn-ghost' },
        { t: 'Maça çık', cls: 'btn-big', fn: () => { Coach.apAsked = true; setTimeout(() => { play1(quick); Coach.apAsked = false; }, 120); } },
      ]);
    }
    return play1(quick);
  };
})();
