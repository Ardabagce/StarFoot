// Maç motoru: dakika dakika simülasyon + oyuncunun kritik anları

const MOMENT_WEIGHTS = {
  FW: { open: 40, dribble: 18, header: 12, freekick: 7, penalty: 5, tackle: 5, sprint: 9, onetwo: 7 },
  MF: { open: 30, dribble: 13, deep: 15, tackle: 17, freekick: 9, header: 4, onetwo: 12, sprint: 5 },
  DF: { tackle: 46, deep: 23, header: 14, open: 4, freekick: 4, sprint: 9 },
  GK: { gk_save: 40, gk_1v1: 18, gk_cross: 17, gk_pen: 5, deep: 12 },
};

const MOMENT_TITLES = {
  open: '⚡ Hücum Fırsatı',
  close: '🎯 Ceza Sahasında!',
  deep: '🧭 Oyun Kurma',
  freekick: '🎯 Serbest Vuruş',
  penalty: '⚪ Penaltı!',
  dribble: '💨 Çalım Fırsatı',
  tackle: '🛡️ Rakip Atakta!',
  header: '🤾 Korner - Hava Topu',
  sprint: 'Kontra Atak!',
  onetwo: 'Verkaç Fırsatı',
  gk_save: '🧤 Şut Geliyor!',
  gk_1v1: '🧤 Karşı Karşıya!',
  gk_cross: '🧤 Orta Geliyor!',
  gk_pen: '🧤 Rakip Penaltısı!',
};

const MOMENT_DESC = {
  open: 'Top ayağında! Parmağını geriye çekip bırakarak şut çek ya da arkadaşına dokunarak pas ver. Ofsayt çizgisinin gerisindeki arkadaşa pas verme! Rakipler üstüne geliyor, çabuk ol!',
  close: 'Rakibi geçtin, kaleciyle karşı karşıyasın! Geriye çek, köşeye nişan al ve bırak.',
  deep: 'Geride topu aldın. Hücumdaki bir arkadaşına dokunarak pas ver ya da geriye çekip bırakarak uzun top at.',
  freekick: 'Geriye kavisli çekerek barajın yanından dolandır ya da Yarım Yükseklik ile üstünden aşırt.',
  penalty: 'Penaltı noktasındasın. Geriye çek, bir köşeye nişan al ve bırak!',
  dribble: 'Rakip üstüne geliyor! Bir tarafa hamle yaptığı an topu ters tarafa çek (ekranın sol/sağına dokun ya da kaydır).',
  tackle: 'Rakip forvet topla geliyor. Halka yeşile girince dokun; sarı bölge faul demek.',
  header: 'Korner! Top kafana gelirken dokun; kale ağzında gezen nişangah neredeyse oraya vurursun.',
  sprint: 'Top boşta! Hızlı hızlı dokunarak rakibinden önce topa ulaş.',
  onetwo: 'Kısa paslarla savunmayı aç: parlayan arkadaşına süre dolmadan dokun.',
  gk_save: 'Forvet şut çekiyor! Bakışını oku, top ayaktan çıkınca doğru köşeye uç (sol, orta ya da sağa dokun).',
  gk_1v1: 'Forvet kaleye geliyor. Halka yeşile girince çık ve topu ayağından al; sarı bölge faul ve penaltı demek.',
  gk_cross: 'Ceza sahasına orta geliyor. Doğru anda çık ve topu havada yakala.',
  gk_pen: 'Rakip penaltı kullanıyor. Forvetin bakışını oku ve bir köşeye uç!',
};

const Match = {
  run(ctx, state) {
    return new Promise((resolve) => Match._run(ctx, state, resolve));
  },

  _run(ctx, state, resolve) {
    const p = state.player;
    const pname = Player.fullName(p);
    const own = ctx.side === 'home' ? ctx.home : ctx.away;
    const opp = ctx.side === 'home' ? ctx.away : ctx.home;
    const ovr = Player.overall(p, true);
    const st = Player.effStats(p);
    // Zorluk: seviye (yaş grubu / lig) arttıkça artar, rakip-oyuncu farkı da etkiler
    let skill = U.clamp((ctx.levelBase != null ? ctx.levelBase : 0.4) + (opp.rating - ovr) / 70, 0.03, 0.88);
    const street = ctx.lg === 'street';
    // Mahalle maçı: kum saha, herkes kendi kıyafetiyle
    const kits = street ? Sprites.streetKits() : Sprites.kits(own, opp);
    Sprites.surface = street ? 'sand' : null;
    // Atmosfer: tribün doluluğu, fotoğrafçılar ve pankart oyuncunun ününe, takımına ve maçın önemine göre
    {
      const youthM = state.contract && state.contract.type === 'youth' || /\bU(1\d|2[01])\b/.test(ctx.compName || '');
      const big = ['ucl', 'uel', 'uecl', 'wc', 'euro', 'intl', 'csa', 'acl', 'ccc'].includes(ctx.lg) ? 0.12 : 0;
      const fame = p.fame || 0;
      let lvl = street ? 0 : youthM ? 0.12 + (ctx.final ? 0.12 : 0) : U.clamp(0.3 + (own.rating - 55) / 60 + big + (ctx.derby ? 0.15 : 0) + (ctx.final ? 0.2 : 0) + fame / 400, 0.25, 1);
      const star = !street && !youthM && fame >= 40;
      Sprites.atmo = {
        lvl, star, youth: youthM,
        photogs: street ? 0 : youthM ? (ctx.final ? 1 : 0) : Math.round(U.clamp(1 + fame / 12 + (ctx.final ? 2 : 0) + (ctx.derby ? 1 : 0) + big * 10, 1, 8)),
        club: own.name || own.short || '',
      };
    }
    const narrow = () => window.innerWidth / window.innerHeight < 0.9;
    // Hava durumu ve maç topu
    const weather = ctx.weather = ctx.weather || Weather.pick(ctx, state);
    Weather.apply(weather);
    Sprites.curBall = Balls.forMatch(ctx, weather, state.season.year);
    const sb = Object.assign({}, SCOREBOARDS[ctx.lg] || SCOREBOARDS.youth, ctx.sbTag ? { tag: ctx.sbTag } : {});
    // Enerji maç boyunca canlı düşer; kondisyon anlık enerjiye göre hesaplanır
    let condAdj = 0;
    const calcCond = () => 1.25 - 0.35 * (M.energy / 100) - 0.15 * (p.morale / 100) + condAdj;
    let cond = 1.25 - 0.35 * (p.energy / 100) - 0.15 * (p.morale / 100);

    // Katılım
    let enterMin = null, leaveMin = null;
    if (ctx.role === 'starter') enterMin = 1;
    else if (ctx.role === 'bench' && U.chance(ctx.subChance || 0.65)) enterMin = U.randi(55, 78);
    const stamina = p.stats.stamina;

    // efor: maç içinde seçilir ve istenince değiştirilir (enerji tüketimi ve bundan sonraki pozisyon sayısı)
    const EFS = typeof EFFORTS !== 'undefined' ? EFFORTS : { mid: { drain: 1, mom: 0, l: 'Orta' } };
    let efKey = typeof Game !== 'undefined' && Game.effortKey ? Game.effortKey() : 'mid';
    const EF = () => EFS[efKey] || EFS.mid;
    // Anlar
    const moments = [];
    let hadPen = false;
    const addMoments = (n, from, to) => {
      const taken = new Set(moments.map((x) => x.min));
      for (let i = 0, tries = 0; i < n && tries < 200; tries++) {
        const m = U.randi(from, to);
        if (taken.has(m) || m === 45) continue;
        taken.add(m);
        const w = MOMENT_WEIGHTS[p.position];
        const type = U.weighted(Object.keys(w), (k) => ((k === 'penalty' || k === 'gk_pen') && hadPen ? 0 : w[k]));
        if (type === 'penalty' || type === 'gk_pen') hadPen = true;
        moments.push({ min: m, type });
        i++;
      }
      moments.sort((a, b) => a.min - b.min);
    };
    if (enterMin) {
      const span = 90 - enterMin + 1;
      const base = { FW: 5, MF: 5, DF: 4, GK: 4 }[p.position];
      addMoments(Math.max(1, Math.round((base + U.randi(-1, 1)) * span / 90)), enterMin, 89);
    }

    const M = {
      min: 0, hs: 0, as: 0, rating: 6.0, goals: 0, assists: 0, yellow: 0, red: false,
      feed: [], speed: 1, instant: typeof FF !== 'undefined' && FF.on, statsUsed: new Set(), shots: 0, keyPasses: 0, tackles: 0,
      ownScorers: [], oppScorers: [], teamBoost: 0, energySave: 0, gt: {}, saves: 0, penSaves: 0,
      energy: p.energy, e0: p.energy, tiredWarn: false,
    };
    const drain = (v) => { M.energy = Math.max(0, M.energy - v * EF().drain); cond = calcCond(); };
    const isHome = ctx.side === 'home';
    const addOwn = () => (isHome ? M.hs++ : M.as++);
    const addOpp = () => (isHome ? M.as++ : M.hs++);
    const onPitch = () => enterMin !== null && M.min >= enterMin && (leaveMin === null || M.min < leaveMin) && !M.red;

    // UI
    const ov = document.getElementById('match');
    ov.classList.remove('hidden');
    if (typeof Sfx !== 'undefined') { Sfx.crowd(true, street); Sfx.play('whistleLong'); }
    // turnuva teması (Şampiyonlar Kupası yıldızlı vb.)
    const theme = ctx.theme ? CompTheme.get(ctx.theme, ctx.side === 'home' ? ctx.home.id : ctx.away.id) : null;
    ov.className = `overlay ${CompTheme.cls(theme)} ${ctx.derby ? 'derby' : ''} ${ctx.final ? 'final' : ''}`;
    ov.setAttribute('style', CompTheme.vars(theme));
    ov.innerHTML = `
      <div class="mt-wrap">
        <div class="mt-top">
          <div class="mt-comp">${U.esc(ctx.compName)} <span class="mt-wx wx-${weather.id}">${U.esc(Weather.label(weather))}</span></div>
          <div class="mt-board">
            <div class="mt-team">${UI.shirt(ctx.home, 'big')}<span>${U.esc(ctx.home.name)}</span></div>
            <div class="mt-score"><span id="mt-hs">0</span><i></i><span id="mt-as">0</span></div>
            <div class="mt-team right"><span>${U.esc(ctx.away.name)}</span>${UI.shirt(ctx.away, 'big')}</div>
          </div>
          <div class="mt-time"><span id="mt-min">0'</span><div class="mt-prog"><div id="mt-bar"></div></div></div>
        </div>
        <div class="mt-body">
          <div class="mt-main"><div class="mt-radar"><canvas id="mt-rad"></canvas></div><div class="mt-feed" id="mt-feed"></div></div>
          <div class="mt-side">
            <div class="mt-me">
              <div class="me-id">
                <div class="me-num" style="--c1:${own.c1};--c2:${own.c2}">${p.shirt}</div>
                <div class="me-nm"><b>${U.esc(pname)}</b><small>${POSITIONS[p.position].l}${ctx.captain ? ' · <i class="armband sm">C</i> Kaptan' : ''}</small></div>
                <div class="me-rt" id="mt-rating">-</div>
              </div>
              <div class="me-st" id="mt-status"></div>
              <div class="me-chips">
                <div><span>Gol</span><b id="mt-g">0</b></div>
                <div><span>Asist</span><b id="mt-a">0</b></div>
                <div><span>Şut</span><b id="mt-sh">0</b></div>
              </div>
              <div class="me-en">
                <div class="me-en-h"><span>${Icon('bolt')} Enerji</span><b id="mt-en">${Math.round(p.energy)}</b></div>
                <div class="me-en-bar"><i id="mt-enb" style="width:${p.energy}%"></i></div>
              </div>
              ${ctx.role !== 'out' && EFS.low ? `<div class="me-ef"><div class="me-ef-h"><span>Efor</span><small>Maç sonu tahmini enerji</small></div><div class="ef-seg" id="mt-eff">${['low', 'mid', 'high'].map((k) => `<button data-e="${k}" class="${k === efKey ? 'on' : ''}"><b>${EFS[k].l}</b><small data-ee="${k}">≈ ${Math.round(p.energy)}</small></button>`).join('')}</div></div>` : ''}
            </div>
            <div class="mt-ctrl">
              <div class="seg" id="mt-speed">
                <button data-s="1" class="on">1x</button><button data-s="2">2x</button><button data-s="4">4x</button>
              </div>
              <button class="btn btn-ghost" id="mt-sim">${Icon('fast')} Maçı Simüle Et</button>
            </div>
          </div>
        </div>
        <div class="mt-moment hidden" id="mt-moment">
          <div class="mm-head">
            <div class="mm-min" id="mm-min"></div>
            <div class="mm-tt"><div class="mm-title" id="mm-title"></div><div class="mm-desc" id="mm-desc"></div></div>
            <button class="btn btn-ghost" id="mm-auto">${Icon('robot')}<span>Otomatik</span></button>
          </div>
          <div id="mm-host"></div>
          <div class="mm-sb" id="mm-sb" style="--sb1:${sb.c1};--sb2:${sb.c2}"></div>
        </div>
      </div>`;

    const $ = (id) => document.getElementById(id);
    // radar: ev sahibi soldan sağa hücum eder
    const hk = isHome ? kits.own : kits.opp, ak = isHome ? kits.opp : kits.own;
    const radar = typeof Radar !== 'undefined' ? Radar.start($('mt-rad'), {
      street, meSide: isHome ? 'H' : 'A', mePos: p.position, num: p.shirt,
      hc: hk.shirt, hr: hk.shorts,
      // renkler birbirine yakınsa deplasman takımı ikinci rengiyle ya da beyaz/lacivertle gösterilir
      ...(() => { const near = (x, y) => { try { return Sprites.colorDist(x, y) < 140; } catch (e) { return false; } }; let ac = ak.shirt, ar = ak.shorts; if (near(hk.shirt, ac)) { ac = !near(hk.shirt, ak.alt || '#fff') ? ak.alt : (near(hk.shirt, '#f4f4f4') ? '#16264f' : '#f4f4f4'); ar = near(ac, '#111111') ? '#f4f4f4' : '#111111'; } return { ac, ar }; })(),
      hk: isHome ? kits.gk.shirt : '#2b2b2b', ak: isHome ? '#2b2b2b' : kits.gk.shirt,
    }) : null;
    const ownSide = isHome ? 'H' : 'A', oppSide = isHome ? 'A' : 'H';
    const feed = (txt, cls = '') => {
      M.feed.push(txt);
      const d = document.createElement('div');
      d.className = 'fd ' + cls;
      const tag = { 'goal own': 'GOL', 'goal opp': 'GOL', info: 'BİLGİ', bad: 'KART' }[cls];
      d.innerHTML = (tag ? `<em class="ft">${tag}</em>` : '') + U.plain(txt);
      const f = $('mt-feed');
      f.prepend(d);
    };
    // seviyeye göre maç sonu tahmini enerji: kalan dakikalar × dakika başı tüketim + kritik anların ortalama payı
    const effortEnd = (k) => {
      const from = Math.max(M.min, enterMin || 91), left = leaveMin !== null ? Math.max(0, leaveMin - from) : Math.max(0, 90 - from);
      const per = (40 / 90) * (1.3 - stamina / 150) + 0.06;
      return Math.max(0, Math.round(M.energy - left * per * EFS[k].drain));
    };
    const efUi = () => { if (!$('mt-eff')) return; ['low', 'mid', 'high'].forEach((k) => { const e = document.querySelector(`[data-ee="${k}"]`); if (e) e.textContent = `≈ ${effortEnd(k)}`; }); };
    const setEffort = (k) => {
      if (k === efKey || !EFS[k]) return;
      efKey = k; state.effort = k;
      U.$$('#mt-eff [data-e]').forEach((b) => b.classList.toggle('on', b.dataset.e === k));
      feed(k === 'high' ? '🔥 Bugün çok efor veriyorsun: daha çok topla buluşacaksın ama çabuk yorulacaksın.' : k === 'low' ? '🧊 Bugün az efor veriyorsun: enerjini sonraki maça saklıyorsun.' : `⚖️ ${EFS.mid.d}`, 'info');
      efUi();
    };
    const refresh = () => {
      $('mt-hs').textContent = M.hs; $('mt-as').textContent = M.as;
      $('mt-min').textContent = Math.min(90, M.min) + "'";
      $('mt-bar').style.width = Math.min(100, (M.min / 90) * 100) + '%';
      const rt = enterMin && M.min >= enterMin ? M.rating : null;
      $('mt-rating').textContent = rt != null ? rt.toFixed(1) : '-';
      $('mt-rating').className = 'me-rt ' + (rt == null ? '' : rt >= 7.5 ? 'hi' : rt < 6 ? 'lo' : 'mid');
      $('mt-g').textContent = M.goals; $('mt-a').textContent = M.assists; $('mt-sh').textContent = M.shots;
      const en = Math.round(M.energy);
      $('mt-en').textContent = en;
      $('mt-enb').style.width = en + '%';
      $('mt-enb').className = en < 30 ? 'lo' : en < 55 ? 'mid' : '';
      efUi();
      $('mt-status').textContent = M.red ? 'Kırmızı kart' : leaveMin !== null && M.min >= leaveMin ? 'Oyundan çıktı' : onPitch() ? 'Sahada' : enterMin ? 'Yedek kulübesinde' : ctx.role === 'out' ? 'Kadro dışı' : 'Yedek kulübesinde';
    };
    U.$$('#mt-speed button').forEach((b) => (b.onclick = () => {
      M.speed = +b.dataset.s;
      U.$$('#mt-speed button').forEach((x) => x.classList.toggle('on', x === b));
    }));
    U.$$('#mt-eff [data-e]').forEach((b) => (b.onclick = () => setEffort(b.dataset.e)));
    $('mt-sim').onclick = () => { M.instant = true; if (MiniGame._abort) MiniGame._abort(); if (M.htSkip) M.htSkip(); };

    if (ctx.role === 'starter') feed(`📋 İlk 11'desin! Formanın sırtında ${p.shirt} numara.`, 'info');
    else if (ctx.role === 'bench') feed('📋 Bugün yedek kulübesinde başlıyorsun.', 'info');
    else feed('📋 Teknik direktör seni bu maçın kadrosuna almadı.', 'info');
    feed(`🏟️ ${U.esc(ctx.home.name)} - ${U.esc(ctx.away.name)} maçı başladı!`);
    if (weather.note) feed(`🌦️ Hava: ${U.esc(Weather.label(weather))}. ${weather.note}`, 'info');

    const homeR = () => ctx.home.rating + (isHome ? M.teamBoost : 0) + (isHome && onPitch() ? (ovr - ctx.home.rating) * 0.08 : 0);
    const awayR = () => ctx.away.rating + (!isHome ? M.teamBoost : 0) + (!isHome && onPitch() ? (ovr - ctx.away.rating) * 0.08 : 0);

    const pickOwn = () => World.pickScorer(own.roster);
    const pickOpp = () => World.pickScorer(opp.roster);

    const rate = (v) => { M.rating = U.clamp(M.rating + v, 3, 10); };

    const ownGoal = (scorerName, assistName, txt) => {
      addOwn();
      M.ownScorers.push(scorerName);
      if (scorerName === pname) (M.gmin = M.gmin || []).push(M.min);
      if (!M.instant && typeof Sfx !== 'undefined') { Sfx.play(street ? 'cheer' : 'roar'); Sfx.buzz('heavy'); }
      feed(`⚽ <b>${M.min}'</b> GOL! ${txt || `${U.esc(scorerName)} golü attı.`} <span class="sc">${M.hs}-${M.as}</span>`, 'goal own');
      if (radar) radar.goal(ownSide);
    };
    const oppGoal = (txt) => {
      const sc = pickOpp();
      addOpp();
      M.oppScorers.push(sc.n);
      if (!M.instant && typeof Sfx !== 'undefined') { Sfx.play('groan'); Sfx.buzz('warning'); }
      feed(`🥅 <b>${M.min}'</b> Gol ${U.esc(opp.name)}'dan. ${txt || `Golü ${U.esc(sc.n)} attı.`} <span class="sc">${M.hs}-${M.as}</span>`, 'goal opp');
      if (radar) radar.goal(oppSide);
    };

    // ---- An çözümleme ----
    const mateNames = own.roster.filter((x) => x.pos !== 'GK').map((x) => x.n);

    const mateChance = (mateY) => {
      const dist = mateY != null ? mateY : 14;
      return U.clamp(0.62 - dist * 0.018 + (own.rating - opp.rating) / 120, 0.06, 0.66);
    };
    const mateConvert = (mateName, mateY, forced) => {
      const goal = forced != null ? forced : U.chance(mateChance(mateY));
      if (goal) {
        M.assists++;
        M.keyPasses++;
        rate(0.8);
        ownGoal(mateName, pname, `${U.esc(pname)}'in harika pasında ${U.esc(mateName)} topu ağlara gönderdi! <i>(Asist)</i>`);
      } else {
        M.keyPasses++;
        rate(0.25);
        feed(`🎯 <b>${M.min}'</b> ${U.esc(pname)}'den güzel pas, ${U.esc(mateName)} vurdu ama gol olmadı.`);
      }
    };

    const canvasOutcome = (type, r) => {
      const o = r.outcome;
      M.statsUsed.add(type === 'deep' ? 'passing' : 'shooting'); M.statsUsed.add('technique');
      if (o === 'goal') {
        M.goals++; M.shots++;
        if (M.drama) { M.lateGoal = true; M.drama = false; }
        M.gt[type] = (M.gt[type] || 0) + 1;
        rate(type === 'penalty' ? 0.7 : type === 'freekick' ? 1.4 : 1.15);
        const msg = {
          penalty: `${U.esc(pname)} penaltıyı soğukkanlılıkla gole çevirdi!`,
          freekick: `${U.esc(pname)} frikikten nefis bir gol attı!`,
        }[type] || U.pick([`${U.esc(pname)} müthiş bir vuruşla ağları sarstı!`, `${U.esc(pname)} kaleciyi çaresiz bıraktı!`, `${U.esc(pname)} topu köşeye yerleştirdi!`]);
        ownGoal(pname, null, msg);
      } else if (o === 'received') {
        M.statsUsed.add('passing');
        mateConvert(r.mate, r.mateY, r.mateGoal);
      } else if (o === 'saved') {
        M.shots++; rate(-0.05);
        feed(`🧤 <b>${M.min}'</b> ${U.esc(pname)} vurdu, kaleci kurtardı.`);
      } else if (o === 'post' || o === 'bar') {
        M.shots++; rate(-0.05);
        feed(`😱 <b>${M.min}'</b> ${U.esc(pname)}'in şutu ${o === 'post' ? 'direkten' : 'üst direkten'} döndü!`);
      } else if (o === 'miss') {
        M.shots++; rate(-0.2);
        feed(`❌ <b>${M.min}'</b> ${U.esc(pname)}'in vuruşu auta gitti.`);
      } else if (o === 'blocked') {
        rate(-0.15);
        feed(`🧱 <b>${M.min}'</b> ${U.esc(pname)}'in vuruşu rakibe çarptı.`);
      } else if (o === 'offside') {
        rate(-0.1);
        feed(`🚩 <b>${M.min}'</b> ${U.esc(pname)} pası verdi ama ${U.esc((r.mate || 'arkadaşı').split(' ').slice(-1)[0])} ofsayttaydı. Yan hakem bayrağı kaldırdı.`);
      } else if (o === 'claimed') {
        rate(-0.1);
        feed(`🧤 <b>${M.min}'</b> Kaleci araya girip topu kontrol etti.`);
      } else {
        rate(-0.3);
        feed(`😬 <b>${M.min}'</b> ${U.esc(pname)} topu kaptırdı.`);
      }
    };

    const autoCanvas = (type) => {
      const k = type === 'deep' ? 'pass' : type === 'freekick' ? 'freekick' : type === 'penalty' ? 'penalty' : 'shot';
      const rel = (Player.skillFor(p, k) - opp.rating) / 20 - (cond - 0.8) - (skill - 0.4) * 1.2;
      if (type === 'penalty') return { outcome: U.chance(U.sigmoid(rel * 0.5 + 1.2)) ? 'goal' : U.pick(['saved', 'miss']) };
      if (type === 'freekick') return { outcome: U.chance(U.sigmoid(rel - 1.4)) ? 'goal' : U.pick(['saved', 'blocked', 'miss']) };
      const passPref = type === 'deep' ? 0.9 : p.position === 'FW' ? 0.3 : 0.55;
      if (U.chance(passPref)) {
        const prel = (Player.skillFor(p, 'pass') - opp.rating) / 15;
        if (U.chance(U.sigmoid(prel + 0.6))) return { outcome: 'received', mate: U.pick(mateNames), mateY: type === 'deep' ? U.rand(14, 22) : U.rand(6, 14) };
        return { outcome: 'blocked' };
      }
      const pg = U.sigmoid(rel - (type === 'close' ? 0.4 : 1.2));
      const r = Math.random();
      if (r < pg) return { outcome: 'goal' };
      if (r < pg + 0.4) return { outcome: 'saved' };
      return { outcome: U.pick(['miss', 'blocked', 'miss', 'post']) };
    };

    const timingCfg = (k, extra) => {
      const rel = Player.skillFor(p, k) - opp.rating;
      return Object.assign({
        green: U.clamp(0.15 + rel / 220 + (0.45 - skill) * 0.16, 0.06, 0.36),
        yellow: 0.07,
        speed: (0.75 + 0.75 * skill) * Math.sqrt(cond / 0.8),
        kits, number: p.shirt,
      }, extra);
    };
    const autoTiming = (k, bonus = 0) => {
      const rel = (Player.skillFor(p, k) - opp.rating) / 20 - (cond - 0.8);
      const ps = U.sigmoid(rel + bonus);
      const r = Math.random();
      return r < ps ? 'success' : r < ps + (1 - ps) * 0.4 ? 'partial' : 'fail';
    };

    // TV skorbordu: lig etiketi, forma renkli takım kısaltmaları, skor ve canlı dakika
    const updateSB = (label) => {
      const ab = (t) => U.esc((t.short || t.name.slice(0, 3)).toLocaleUpperCase('tr'));
      const kit = (t) => `<i style="--k1:${t.c1};--k2:${t.c2}"></i>`;
      $('mm-sb').innerHTML = `<span class="sb-tag">${sb.tag}</span>
        <span class="sb-t">${kit(ctx.home)}${ab(ctx.home)}</span>
        <span class="sb-s"><b>${M.hs}</b><em></em><b>${M.as}</b></span>
        <span class="sb-t">${ab(ctx.away)}${kit(ctx.away)}</span>
        <span class="sb-m">${label ? '' : '<i class="live"></i>'}${label || `${Math.min(90, M.min)}'`}</span>`;
    };
    const showMoment = (type) => {
      $('mt-moment').classList.remove('hidden');
      $('mt-moment').classList.toggle('drama', !!M.drama);
      updateSB();
      $('mm-min').textContent = `${M.min}'`;
      $('mm-title').textContent = M.drama ? 'SON DAKİKA!' : U.plain(MOMENT_TITLES[type]);
      $('mm-desc').textContent = M.drama ? 'Son şans! Bu vuruş maçın kaderini belirleyebilir.' : MOMENT_DESC[type];
    };
    // Kendi golünden sonra seçtiğin gol sevinci (dokununca geçilir)
    const celebrate = async () => {
      if (M.instant || typeof Celebrate === 'undefined') return;
      $('mt-moment').classList.remove('hidden');
      updateSB();
      $('mm-min').textContent = `${M.min}'`;
      $('mm-title').textContent = 'GOL!';
      $('mm-desc').textContent = 'Sevinç zamanı! Geçmek için dokun.';
      $('mm-auto').style.display = 'none';
      try {
        if (typeof Sfx !== 'undefined') Sfx.play('cheer');
        await Celebrate.goal($('mm-host'), { kit: kits.own, c1: own.c1, c2: own.c2, short: own.short, number: p.shirt, type: Celebrate.pick(p), name: pname, min: M.min, score: `${M.hs}-${M.as}` });
      } catch (e) { console.error(e); }
      $('mm-auto').style.display = '';
      $('mm-host').onclick = null;
      hideMoment();
    };
    const hideMoment = () => { $('mt-moment').classList.add('hidden'); $('mt-moment').classList.remove('drama'); $('mm-host').innerHTML = ''; $('mm-host').style.overflowY = ''; MiniGame._abort = null; };

    const playCanvas = async (type) => {
      if (M.instant) return autoCanvas(type);
      showMoment(type);
      let auto = false;
      $('mm-auto').onclick = () => { auto = true; if (MiniGame._abort) MiniGame._abort(); };
      // mahalle maçında ofsayt yok
      const sk = typeof Traits !== 'undefined' ? Traits.adj(skill, type, ctx, M) : skill;
      const mkScene = () => { const sc = Scenes.make(type, { skill: sk, mates: mateNames, position: p.position, pace: st.pace, narrow: narrow() }); if (street) sc.offside = null; return sc; };
      const opts = { stats: st, skill: sk, cond, kits, number: p.shirt, mateChance, captain: !!ctx.captain, weather };
      let r = await MiniGame.play($('mm-host'), mkScene(), opts);
      // Ödüllü reklam: kaçan şutu bir kez daha oyna (maç başına bir kez teklif edilir)
      if (!auto && ['saved', 'post', 'bar', 'miss', 'blocked'].includes(r.outcome) && !M.retryOffered) {
        M.retryOffered = true;
        if (await askRetry()) r = await MiniGame.play($('mm-host'), mkScene(), opts);
      }
      hideMoment();
      if (auto || r.outcome === 'auto') return autoCanvas(type);
      if (r.outcome === 'goal') M.liveGoal = true;
      return r;
    };

    const askRetry = () => new Promise((res) => {
      const host = $('mm-host');
      host.innerHTML = `<div class="retry-ad"><b>Kaçırdın!</b><p>${typeof Premium !== 'undefined' && Premium.active ? 'Premium ile bu anı bir kez daha oyna.' : 'Reklam izle, bu anı bir kez daha oyna.'}</p>
        <button class="btn btn-play" data-retry="1">${Icon('play')} ${typeof Premium !== 'undefined' ? Premium.lbl() : 'Reklam izle'} · Tekrar dene</button>
        <button class="btn btn-ghost" data-retry="0">Devam et</button><small>Maç başına bir kez</small></div>`;
      $('mm-auto').onclick = () => res(false);
      host.querySelector('[data-retry="0"]').onclick = () => res(false);
      host.querySelector('[data-retry="1"]').onclick = (e) => { e.currentTarget.disabled = true; Ads.show().then((ok) => res(!!ok)); };
    });

    const playTiming = async (type, k, cfg, bonus) => {
      if (M.instant) return autoTiming(k, bonus);
      showMoment(type);
      let auto = false;
      $('mm-auto').onclick = () => { auto = true; if (MiniGame._abort) MiniGame._abort(); };
      const r = await MiniGame.timing($('mm-host'), timingCfg(k, cfg));
      hideMoment();
      if (auto || r.result === 'auto') return autoTiming(k, bonus);
      return r.result;
    };

    let lastAuto = false;
    const autoUsed = () => lastAuto;
    const playMini = async (type, fn, k, bonus, extra) => {
      if (M.instant) { lastAuto = true; return autoTiming(k, bonus); }
      showMoment(type);
      let auto = false;
      $('mm-auto').onclick = () => { auto = true; if (MiniGame._abort) MiniGame._abort(); };
      lastAuto = false;
      const r = await MiniGame[fn]($('mm-host'), Object.assign({ skill: typeof Traits !== 'undefined' ? Traits.adj(skill, type, ctx, M) : skill, kits, number: p.shirt, pace: st.pace, passing: st.passing, mates: mateNames, cond }, extra));
      hideMoment();
      if (auto || r.result === 'auto') { lastAuto = true; return autoTiming(k, bonus); }
      return r.result;
    };

    // Devre arası: oyuncunun ikinci yarı için seçimi
    const halfTime = () => new Promise((res) => {
      const benchWait = enterMin === null || enterMin > 45;
      if (street || M.instant || M.red || ctx.role === 'out' || p.injuryWeeks > 0 || (leaveMin !== null)) return res();
      const opts = benchWait
        ? [
          ['warm', 'fire', 'Isın ve hocaya görün', 'İkinci yarıda oyuna girme şansın artar'],
          ['cheer', 'fans', 'Takımı destekle', 'Takım ilişkisi artar, takım biraz güçlenir'],
          ['sit', 'rest', 'Yedek kulübesinde bekle', 'Enerjini korursun'],
        ]
        : [
          ['tactic', 'whistle', 'Hocayla taktik konuş', 'İkinci yarıda daha çok pozisyon gelir'],
          ['motivate', 'fans', 'Takımı ateşle', 'Takım ikinci yarıda daha güçlü oynar'],
          ['recover', 'bolt', 'Soyunma odasında toparlan', 'Vuruşların daha isabetli olur, enerji korunur'],
          ['scout', 'shield', 'Rakip kaleciyi incele', 'Kaleci ve savunma biraz daha kolaylaşır'],
        ];
      $('mt-moment').classList.remove('hidden');
      updateSB('DA');
      $('mm-min').textContent = 'İY';
      $('mm-title').textContent = 'Devre Arası';
      $('mm-desc').textContent = 'İkinci yarı için ne yapacağını seç.';
      $('mm-auto').style.display = 'none';
      $('mm-host').innerHTML = `
        <div class="ht">
          <h3>Devre Arası</h3>
          <div class="ht-score">${U.esc(ctx.home.name)} ${M.hs} - ${M.as} ${U.esc(ctx.away.name)}${onPitch() ? ` · Reytingin ${M.rating.toFixed(1)}` : ''}</div>
          <div class="ht-opts">${opts.map(([k, ic, l, d]) => `<button class="act" data-ht="${k}">${Icon(ic)}<span><b>${l}</b><small>${d}</small></span></button>`).join('')}</div>
        </div>`;
      U.$$('[data-ht]', $('mm-host')).forEach((b) => (b.onclick = () => {
        const k = b.dataset.ht;
        if (k === 'tactic') { addMoments(U.randi(1, 2), 47, 88); Player.addRel(p, 'coach', 1.5); feed(`<b>45'</b> ${U.esc(pname)} hocayla taktik konuştu. İkinci yarıda daha çok topla buluşacak.`, 'info'); }
        if (k === 'motivate') { M.teamBoost = 3; Player.addRel(p, 'team', 1.5); feed(`<b>45'</b> ${U.esc(pname)} soyunma odasında takımı ateşledi!`, 'info'); }
        if (k === 'recover') { condAdj -= 0.1; M.energy = Math.min(100, M.energy + 8); cond = calcCond(); feed(`<b>45'</b> ${U.esc(pname)} devre arasında toparlandı.`, 'info'); }
        if (k === 'scout') { skill = Math.max(0.02, skill - 0.07); feed(`<b>45'</b> ${U.esc(pname)} rakip kalecinin zayıf yönlerini inceledi.`, 'info'); }
        if (k === 'warm') {
          if (U.chance(0.65)) { enterMin = U.randi(46, 62); addMoments(Math.max(1, Math.round(({ FW: 5, MF: 5, DF: 4, GK: 4 }[p.position]) * (90 - enterMin) / 90)), enterMin, 89); feed(`<b>45'</b> Hoca ısınmanı beğendi, ikinci yarıda oyuna gireceksin!`, 'info'); }
          else feed(`<b>45'</b> Isındın ama hoca şimdilik değişiklik düşünmüyor.`, 'info');
        }
        if (k === 'cheer') { M.teamBoost = 1.5; Player.addRel(p, 'team', 2.5); feed(`<b>45'</b> Kenardan takımını coşkuyla destekledin.`, 'info'); }
        if (k === 'sit') { M.energy = Math.min(100, M.energy + 5); }
        $('mt-moment').classList.add('hidden');
        $('mm-host').innerHTML = '';
        $('mm-auto').style.display = '';
        M.htSkip = null;
        res();
      }));
      // maç simüle edilirse devre arası seçimi beklenmez
      M.htSkip = () => { M.htSkip = null; $('mt-moment').classList.add('hidden'); $('mm-host').innerHTML = ''; $('mm-auto').style.display = ''; res(); };
    });

    const resolveMoment = async (mo) => {
      if (radar) radar.moment(mo.type === 'tackle' ? oppSide : ownSide);
      const type = mo.type;
      M.drama = !!mo.drama;
      if (M.drama) {
        feed(`⏱️ <b>${M.min}'</b> SON DAKİKALAR! Skoru değiştirecek son şans ${U.esc(pname)}'de...`, 'info');
        if (typeof Sfx !== 'undefined') { Sfx.play('heart'); Sfx.buzz('warning'); }
      }
      if (type === 'sprint') {
        M.statsUsed.add('pace');
        drain(2.5);
        const r = await playMini('sprint', 'sprint', 'dribble', 0.3);
        if (p.position === 'DF') {
          if (r === 'success') { M.tackles++; rate(0.45); feed(`<b>${M.min}'</b> ${U.esc(pname)} müthiş bir geri koşuyla rakibe yetişti ve topu kaptı!`); }
          else { rate(-0.3); feed(`<b>${M.min}'</b> Rakip kontra atakta ${U.esc(pname)}'den hızlı çıktı!`); if (U.chance(0.3 + skill * 0.15)) oppGoal(); }
        } else if (r === 'success') {
          rate(0.3);
          feed(`<b>${M.min}'</b> ${U.esc(pname)} kontra atakta rakibini geride bıraktı!`);
          canvasOutcome('close', await playCanvas('close'));
        } else { rate(-0.15); feed(`<b>${M.min}'</b> Kontra atakta rakip topa önce ulaştı.`); }
        refresh();
        return;
      }
      if (type === 'onetwo') {
        M.statsUsed.add('passing');
        const r = await playMini('onetwo', 'onetwo', 'pass', 0.4);
        if (r === 'success') {
          rate(0.35); M.keyPasses++;
          feed(`<b>${M.min}'</b> ${U.esc(pname)} şık bir verkaçla savunmayı yardı!`);
          canvasOutcome('close', await playCanvas('close'));
        } else if (r === 'partial') {
          feed(`<b>${M.min}'</b> Pas trafiği yarıda kaldı ama top hâlâ sende.`);
          canvasOutcome('open', await playCanvas('open'));
        } else { rate(-0.2); feed(`<b>${M.min}'</b> Verkaç denemesi rakibe takıldı.`); }
        refresh();
        return;
      }
      if (type === 'gk_save' || type === 'gk_pen') {
        M.statsUsed.add('pace'); M.statsUsed.add('technique');
        const penM = type === 'gk_pen';
        if (penM) feed(`⚪ <b>${M.min}'</b> Rakip lehine penaltı! ${U.esc(pname)} kalede...`, 'info');
        const r = await playMini(type, 'keeper', 'save', penM ? -0.9 : 0.15, { mode: penM ? 'pen' : 'shot', reflex: st.pace, handling: st.technique });
        if (r === 'success') {
          M.saves++; if (penM) M.penSaves++;
          rate(penM ? 1.1 : 0.5);
          feed(penM ? `🧤 <b>${M.min}'</b> ${U.esc(pname)} PENALTIYI KURTARDI!` : `🧤 <b>${M.min}'</b> ${U.esc(pname)} köşeden müthiş bir kurtarış yaptı!`, 'goal own');
        } else if (r === 'partial') {
          if (U.chance(0.3)) { rate(-0.3); oppGoal('Dönen topu ağlara gönderdiler.'); } else { M.saves++; rate(0.15); feed(`🧤 <b>${M.min}'</b> ${U.esc(pname)} topu çeldi, savunma uzaklaştırdı.`); }
        } else { rate(penM ? -0.15 : -0.4); oppGoal(penM ? 'Penaltıdan gol.' : undefined); }
        refresh();
        return;
      }
      if (type === 'gk_1v1' || type === 'gk_cross') {
        M.statsUsed.add(type === 'gk_cross' ? 'heading' : 'pace'); M.statsUsed.add('physical');
        const one = type === 'gk_1v1';
        const r = await playTiming(type, 'save', one
          ? { title: 'Karşı karşıya!', kind: 'tackle', desc: 'Forvet topu açtığı an çık. Yeşil alan temiz kurtarış, sarı alan faul demek.', button: 'ÇIK!', okText: 'AYAĞINDAN ALDIN!', partialText: 'FAUL!', failText: 'FORVET SENİ GEÇTİ!' }
          : { title: 'Ortayı yakala!', kind: 'header', desc: 'Top havadayken doğru anda çık ve yakala. Sarı alanda ancak yumruklayabilirsin.', button: 'YAKALA!', okText: 'TOPU KUCAKLADIN!', partialText: 'YUMRUKLA UZAKLAŞTIRDIN', failText: 'TOPU KAÇIRDIN!' }, 0.1);
        if (r === 'success') {
          M.saves++; rate(one ? 0.6 : 0.3);
          feed(one ? `🧤 <b>${M.min}'</b> ${U.esc(pname)} karşı karşıya pozisyonda forvetin ayağından aldı!` : `🧤 <b>${M.min}'</b> ${U.esc(pname)} ortayı havada güvenle kontrol etti.`);
        } else if (r === 'partial') {
          if (one) {
            rate(-0.2);
            if (U.chance(0.35)) { M.yellow++; feed(`🟨 <b>${M.min}'</b> ${U.esc(pname)} forveti düşürdü, sarı kart.`, 'bad'); }
            feed(`😨 <b>${M.min}'</b> Penaltı!`, 'bad');
            const r2 = await playMini('gk_pen', 'keeper', 'save', -0.9, { mode: 'pen', reflex: st.pace, handling: st.technique });
            if (r2 === 'success') { M.saves++; M.penSaves++; rate(1.1); feed(`🧤 <b>${M.min}'</b> ${U.esc(pname)} hatasını penaltıyı kurtararak telafi etti!`, 'goal own'); } else oppGoal('Penaltıdan gol.');
          } else { rate(0.05); feed(`👊 <b>${M.min}'</b> ${U.esc(pname)} ortayı yumrukla uzaklaştırdı.`); }
        } else {
          rate(-0.3);
          if (U.chance(one ? 0.72 : 0.38)) oppGoal(one ? undefined : 'Kafayla gol.');
          else feed(`😮‍💨 <b>${M.min}'</b> Şans bizden yana: top auta gitti.`);
        }
        refresh();
        return;
      }
      if (['open', 'deep', 'freekick', 'penalty'].includes(type)) {
        if (type === 'penalty') feed(`⚪ <b>${M.min}'</b> Penaltı! Topun başına ${U.esc(pname)} geçiyor...`, 'info');
        if (type === 'freekick') feed(`🎯 <b>${M.min}'</b> Tehlikeli bölgede serbest vuruş. ${U.esc(pname)} topun başında.`, 'info');
        canvasOutcome(type, await playCanvas(type));
      } else if (type === 'dribble') {
        M.statsUsed.add('dribbling'); M.statsUsed.add('pace');
        const r = await playMini('dribble', 'dribble', 'dribble', 0.3, { rounds: skill < 0.25 ? 1 : skill < 0.6 ? 2 : 3, dribbling: st.dribbling });
        if (r === 'success') {
          rate(0.3);
          M.dribbles = (M.dribbles || 0) + 1;
          feed(`💨 <b>${M.min}'</b> ${U.esc(pname)} rakiplerini çalımlarla geçti!`);
          canvasOutcome('close', await playCanvas('close'));
        } else if (r === 'partial') {
          feed(`↩️ <b>${M.min}'</b> ${U.esc(pname)} çalım denedi, top taca çıktı.`);
        } else {
          rate(-0.25);
          feed(`😬 <b>${M.min}'</b> ${U.esc(pname)} çalım denerken topu kaptırdı.`);
        }
      } else if (type === 'tackle') {
        M.statsUsed.add('defending'); M.statsUsed.add('physical');
        drain(1.2);
        const r = await playTiming('tackle', 'tackle', {
          title: 'Topu kap!', kind: 'tackle', desc: 'Yeşil alan temiz müdahale, sarı alan faul demek. Doğru anda bas!',
          button: 'MÜDAHALE!', okText: 'TERTEMİZ MÜDAHALE!', partialText: 'FAUL!', failText: 'RAKİP SENİ GEÇTİ!',
        }, 0.6);
        if (r === 'success') {
          M.tackles++; rate(0.45);
          feed(`🛡️ <b>${M.min}'</b> ${U.esc(pname)} kusursuz bir müdahaleyle topu kaptı!`);
        } else if (r === 'partial') {
          rate(-0.2);
          if (U.chance(0.35)) {
            M.yellow++;
            if (M.yellow >= 2) {
              M.red = true; rate(-1.5);
              feed(`🟥 <b>${M.min}'</b> İkinci sarıdan KIRMIZI KART! ${U.esc(pname)} oyun dışı.`, 'bad');
            } else feed(`🟨 <b>${M.min}'</b> ${U.esc(pname)} sert müdahale sonrası sarı kart gördü.`, 'bad');
          } else feed(`⚠️ <b>${M.min}'</b> ${U.esc(pname)} faul yaptı.`);
          if (U.chance(0.1)) {
            feed(`😨 <b>${M.min}'</b> Faul ceza sahası içinde! Penaltı!`, 'bad');
            if (U.chance(0.76)) { rate(-0.5); oppGoal('Penaltıdan gol.'); } else feed(`🧤 <b>${M.min}'</b> Kalecimiz penaltıyı kurtardı!`);
          }
        } else {
          rate(-0.35);
          feed(`💥 <b>${M.min}'</b> Rakip ${U.esc(pname)}'i geçti ve tehlikeli bölgeye girdi!`);
          if (U.chance(0.28 + skill * 0.15)) { rate(-0.25); oppGoal(); } else feed(`😮‍💨 <b>${M.min}'</b> Neyse ki şut isabetsiz.`);
        }
      } else if (type === 'header') {
        M.statsUsed.add('heading');
        const viaGame = !M.instant;
        const r = await playMini('header', 'header', 'header', 0, { heading: st.heading, physical: st.physical });
        if (r === 'success') {
          // mini oyunda başarı zaten gol demek; otomatikte olasılıkla
          const pg = viaGame && !autoUsed() ? 1 : U.clamp(U.sigmoid((Player.skillFor(p, 'header') - opp.rating) / 12 - 0.2), 0.15, 0.72);
          if (U.chance(pg)) {
            M.goals++; rate(1.1);
            if (viaGame && !autoUsed()) M.liveGoal = true;
            M.gt.header = (M.gt.header || 0) + 1;
            ownGoal(pname, null, `${U.esc(pname)} yükseldi ve kafayla ağları buldu!`);
          } else { rate(0.1); feed(`🧤 <b>${M.min}'</b> ${U.esc(pname)}'in kafa vuruşunu kaleci son anda çıkardı.`); }
        } else if (r === 'partial') {
          rate(-0.05); feed(`🙄 <b>${M.min}'</b> ${U.esc(pname)}'in kafa vuruşu az farkla dışarıda.`);
        } else {
          rate(-0.1); feed(`☁️ <b>${M.min}'</b> Korner rakip savunmada kaldı.`);
        }
      }
      refresh();
    };

    // ---- Ana döngü ----
    const tickDelay = () => (M.instant ? 0 : [0, 240, 120, 45, 30][M.speed]);
    let stoppage = U.randi(1, 5);
    let busy = false;

    const tick = async () => {
      if (busy) return;
      busy = true;
      M.min++;
      if (onPitch()) {
        drain((40 / 90) * (1.3 - stamina / 150));
        if (M.energy < 30 && !M.tiredWarn) { M.tiredWarn = true; feed(`🥵 <b>${M.min}'</b> ${U.esc(pname)} yorulmaya başladı. Vuruşların isabeti düşüyor.`, 'info'); }
      }
      if (M.min === enterMin && enterMin > 1) {
        feed(`🔁 <b>${M.min}'</b> Oyuna giriyorsun! Hoca sana güveniyor.`, 'info');
      }
      // oyundan çıkma (kötü performans/yorgunluk)
      if (onPitch() && M.min === 70 && leaveMin === null && enterMin === 1) {
        const tired = M.energy < 35 || stamina < 25;
        if (M.rating < 5.6 || (tired && U.chance(0.5))) {
          leaveMin = 71;
          feed(`🔁 <b>${M.min}'</b> ${U.esc(pname)} oyundan alındı.`, 'info');
          // kalan anları iptal et
          for (let i = moments.length - 1; i >= 0; i--) if (moments[i].min > 70) moments.splice(i, 1);
        }
      }
      if (radar) { radar.speed = M.speed; radar.minute(homeR(), awayR(), onPitch()); if (!M.instant && U.chance(0.05)) radar.chance(U.chance(0.5 + (homeR() - awayR()) / 80) ? 'H' : 'A'); }
      // arka plan golleri
      const [lh, la] = World.lambdas(homeR(), awayR());
      const gk = p.position === 'GK';
      const ownL = (isHome ? lh : la) / 90 * (onPitch() && !gk ? 0.72 : 1);
      // kaleci sahadaysa: rakip gollerinin bir kısmı anlarda oynanır, gücüne göre bazılarını kendiliğinden kurtarır
      const oppL = (isHome ? la : lh) / 90 * (onPitch() && gk ? U.clamp(0.72 - (Player.skillFor(p, 'save') - opp.rating) / 160, 0.5, 0.85) : 1);
      if (U.chance(ownL)) {
        const sc = pickOwn();
        ownGoal(sc.n);
        if (onPitch()) rate(0.1);
      }
      if (U.chance(oppL)) {
        oppGoal();
        if (onPitch() && p.position === 'GK') rate(-0.3);
        else if (onPitch() && p.position !== 'FW') rate(-0.12);
      }
      // Son dakika dramı: berabere ya da bir farkla gerideyken son şans anı
      if (M.min === 85 && !M.dramaDone && onPitch() && !M.instant && !street) {
        M.dramaDone = true;
        const gf = isHome ? M.hs : M.as, ga = isHome ? M.as : M.hs;
        if ((gf === ga || ga - gf === 1) && !moments.some((x) => x.min > 85)) moments.push({ min: U.randi(87, 90), type: U.chance(0.25) ? 'freekick' : 'open', drama: true });
      }
      // efor: çok eforda ara ara ek pozisyon gelir, az eforda bazı pozisyonlar hiç oluşmaz (90 dakikada ortalama ±2)
      if (onPitch() && M.min < 88 && efKey === 'high' && !moments.some((x) => x.min === M.min + 1) && U.chance(2 / 80)) addMoments(1, M.min + 1, M.min + 1);
      for (const mo of moments.filter((x) => x.min === M.min)) {
        if (!onPitch()) break;
        if (efKey === 'low' && !mo.drama && U.chance(0.4)) continue;
        M.momPlayed = (M.momPlayed || 0) + 1;
        await resolveMoment(mo);
        M.drama = false;
        if (M.liveGoal) { M.liveGoal = false; await celebrate(); }
      }
      if (M.min === 45) { feed(street ? 'Kısa bir su molası, maç devam ediyor.' : 'İlk yarı sona erdi.', 'info'); await halfTime(); }
      refresh();
      busy = false;
      if (M.min >= 90) {
        if (stoppage > 0) { stoppage--; if (stoppage === 0) return end(); return schedule(); }
        return end();
      }
      schedule();
    };
    const schedule = () => {
      const d = tickDelay();
      if (d === 0) tick(); else setTimeout(tick, d);
    };

    const end = () => {
      const gf = isHome ? M.hs : M.as, ga = isHome ? M.as : M.hs;
      const res = gf > ga ? 'W' : gf < ga ? 'L' : 'D';
      const played = enterMin !== null;
      let minutes = 0;
      if (played) minutes = (M.red ? Math.min(M.min, 90) : leaveMin || 91) - enterMin;
      if (played) {
        rate(res === 'W' ? 0.3 : res === 'L' ? -0.3 : 0);
        if (p.position === 'DF') rate(ga === 0 ? 0.5 : -0.12 * ga);
        if (p.position === 'GK') rate(ga === 0 && minutes >= 60 ? 0.8 : -0.1 * ga);
        if (p.position === 'MF' && ga === 0) rate(0.2);
        if (minutes < 30 && M.goals === 0 && M.assists === 0) M.rating = U.clamp(M.rating, 5.5, 7);
      }
      const rating = Math.round(M.rating * 10) / 10;
      const motm = played && rating >= 8.3;
      feed(`🏁 Maç sona erdi: ${U.esc(ctx.home.name)} ${M.hs} - ${M.as} ${U.esc(ctx.away.name)}`, 'info');
      if (radar) setTimeout(() => radar.stop(), 3000);
      refresh();
      const summary = {
        gf, ga, res, hs: M.hs, as: M.as, played, energySave: 0, energyStart: M.e0, energyEnd: M.energy, moments: M.momPlayed || 0, effort: EF().l, minutes: Math.max(0, minutes), rating: played ? rating : null,
        goals: M.goals, assists: M.assists, yellow: M.yellow, red: M.red, motm, lateGoal: !!M.lateGoal, dribbles: M.dribbles || 0,
        ownScorers: M.ownScorers, oppScorers: M.oppScorers, statsUsed: [...M.statsUsed], goalTypes: M.gt, goalMins: M.gmin || [], saves: M.saves, penSaves: M.penSaves, ga: isHome ? M.as : M.hs, shots: M.shots, keyPasses: M.keyPasses, tackles: M.tackles,
      };
      const resTxt = { W: 'GALİBİYET', D: 'BERABERLİK', L: 'MAĞLUBİYET' }[res];
      $('mt-moment').classList.remove('hidden');
      $('mm-sb').innerHTML = '';
      $('mm-min').textContent = 'MS';
      $('mm-title').textContent = `Maç Sonu · ${resTxt}`;
      $('mm-desc').textContent = `${ctx.home.name} ${M.hs} - ${M.as} ${ctx.away.name}`;
      $('mm-auto').style.display = 'none';
      $('mm-host').innerHTML = `
        <div class="ms">
          ${motm ? `<div class="motm-card" style="--c1:${own.c1};--c2:${own.c2}">
            <div class="motm-rays"></div>
            <div class="motm-confetti">${Array.from({ length: 24 }, (_, i) => `<i style="--x:${(i * 37) % 100}%;--d:${(i % 7) * 0.35}s;--c:${['#ffcf3f', '#ffffff', own.c1, '#ff7a1a'][i % 4]}"></i>`).join('')}</div>
            <div class="motm-kicker">${U.esc(ctx.compName)}</div>
            <div class="motm-title">Maçın Oyuncusu</div>
            <div class="motm-stage">
              <svg class="motm-laurel" viewBox="0 0 120 120" aria-hidden="true">${Array.from({ length: 7 }, (_, i) => { const a = 200 + i * 18, r = 50, x = 60 + Math.cos(a * Math.PI / 180) * r, y = 62 + Math.sin(a * Math.PI / 180) * r; return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="9" ry="4" transform="rotate(${a + 60} ${x.toFixed(1)} ${y.toFixed(1)})" fill="#e3b341"/><ellipse cx="${(120 - x).toFixed(1)}" cy="${y.toFixed(1)}" rx="9" ry="4" transform="rotate(${-(a + 60)} ${(120 - x).toFixed(1)} ${y.toFixed(1)})" fill="#e3b341"/>`; }).join('')}</svg>
              <canvas class="motm-av" width="200" height="200"></canvas>
              <div class="motm-trophy">${Trophy.svg('motm')}</div>
            </div>
            <div class="motm-name">${U.esc(pname)}</div>
            <div class="motm-club"><span>${U.esc(own.name)}</span></div>
            <div class="motm-stats">
              <div><b>${rating.toFixed(1)}</b><span>Reyting</span></div>
              <div><b>${M.goals}</b><span>Gol</span></div>
              <div><b>${M.assists}</b><span>Asist</span></div>
              <div><b>${M.shots}</b><span>Şut</span></div>
            </div>
            <small>Ödül vitrinine eklendi · kariyerindeki ${p.totals.motm + 1}. ödül</small>
          </div>` : ''}
          ${played ? `
          <div class="ms-hero">
            <div class="ms-ring ${rating >= 7.5 ? 'hi' : rating < 6 ? 'lo' : 'mid'}" style="--p:${Math.round(rating * 10)}"><b>${rating.toFixed(1)}</b><small>Reyting</small></div>
            <div class="ms-res res-${res}"><span>${resTxt}</span><b>${M.hs} - ${M.as}</b><small>${U.esc(ctx.home.name)} · ${U.esc(ctx.away.name)}</small></div>
          </div>
          <div class="ms-stats">
            ${(p.position === 'GK' ? [['whistle', 'Süre', `${summary.minutes}'`, 0], ['shield', 'Kurtarış', M.saves, M.saves], ['ball', 'Yenen gol', ga, 0], ['star', 'Penaltı kurtarışı', M.penSaves, M.penSaves], ['team', 'Kilit Pas', M.keyPasses, M.keyPasses], ['boot', 'Asist', M.assists, M.assists]] : [['whistle', 'Süre', `${summary.minutes}'`, 0], ['ball', 'Gol', M.goals, M.goals], ['boot', 'Asist', M.assists, M.assists], ['fire', 'Şut', M.shots, 0], ['team', 'Kilit Pas', M.keyPasses, M.keyPasses], ['shield', 'Top Kapma', M.tackles, M.tackles]])
              .map(([ic, l, v, hl]) => `<div class="mst ${hl ? 'hl' : ''}"><i>${Icon(ic)}</i><b>${v}</b><span>${l}</span></div>`).join('')}
          </div>
          <div class="ms-energy">
            <div class="mse-h"><span>${Icon('bolt')} Enerji</span><b>${Math.round(M.e0)} → ${Math.round(M.energy)} <small>−${Math.round(M.e0 - M.energy)}</small></b></div>
            <div class="mse-bar"><i class="was" style="width:${M.e0}%"></i><i class="now ${M.energy < 30 ? 'lo' : M.energy < 55 ? 'mid' : ''}" style="width:${M.energy}%"></i></div>
          </div>

          ` : '<div class="ms-none">Bu maçta forma giymedin.</div>'}
          <button class="btn btn-big" id="ms-done">Devam</button>
        </div>`;
      UI.strip($('mm-host'));
      $('mm-host').style.overflowY = 'auto';
      const av = document.querySelector('.motm-av');
      if (av) {
        const c = av.getContext('2d');
        Sprites.figure(c, 100, 190, 170, { kit: kits.own, look: Sprites.me(), facing: 'down', number: p.shirt, t: 0 });
      }
      if (typeof Sfx !== 'undefined') { Sfx.play('whistleEnd'); setTimeout(() => Sfx.crowd(false), 1600); if (res === 'W') Sfx.buzz('success'); }
      $('ms-done').onclick = () => {
        ov.classList.add('hidden');
        ov.innerHTML = '';
        Weather.reset();
        Sprites.curBall = null;
        Sprites.surface = null;
        // Android'de belirli aralıklarla maç sonu geçiş reklamı (hızlı ilerlemede yok)
        const ad = !(typeof FF !== 'undefined' && FF.on) && window.StarfootAds && window.StarfootAds.afterMatch ? window.StarfootAds.afterMatch() : null;
        Promise.resolve(ad).catch(() => {}).then(() => resolve(summary));
      };
      if (typeof FF !== 'undefined' && FF.on) setTimeout(() => $('ms-done') && $('ms-done').onclick(), 0);
    };

    refresh();
    setTimeout(tick, 600);
  },
};
