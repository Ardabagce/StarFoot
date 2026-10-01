// Maç motoru: dakika dakika simülasyon + oyuncunun kritik anları

const MOMENT_WEIGHTS = {
  FW: { open: 45, dribble: 22, header: 14, freekick: 8, penalty: 5, tackle: 6 },
  MF: { open: 34, dribble: 15, deep: 16, tackle: 20, freekick: 10, header: 5 },
  DF: { tackle: 50, deep: 25, header: 15, open: 5, freekick: 5 },
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
};

const MOMENT_DESC = {
  open: 'Top ayağında! Kaleye kaydırarak şut çek ya da boştaki arkadaşına dokunarak pas ver. Rakipler üstüne geliyor, çabuk ol!',
  close: 'Rakibi geçtin, kaleciyle karşı karşıyasın! Köşeye kaydır.',
  deep: 'Geride topu aldın. Hücumdaki bir arkadaşına dokunarak pas ver ya da kaydırarak uzun top at.',
  freekick: 'Kavisli kaydırarak barajın yanından dolandır ya da Yarım Yükseklik ile üstünden aşırt.',
  penalty: 'Penaltı noktasındasın. Köşelerden birine kaydır, kaleciyi yanılt!',
  dribble: 'Halka yeşil bölgeye girdiğinde dokun ve rakipleri tek tek geç.',
  tackle: 'Rakip forvet topla geliyor. Halka yeşile girince dokun; sarı bölge faul demek.',
  header: 'Korner atılıyor. Halka yeşile girince dokun ve topa kafayı vur!',
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
    const skill = U.clamp((ctx.levelBase != null ? ctx.levelBase : 0.4) + (opp.rating - ovr) / 70, 0.03, 0.88);
    const kits = Sprites.kits(own, opp);
    const narrow = () => window.innerWidth / window.innerHeight < 0.9;
    const cond = 1.25 - 0.35 * (p.energy / 100) - 0.15 * (p.morale / 100);

    // Katılım
    let enterMin = null, leaveMin = null;
    if (ctx.role === 'starter') enterMin = 1;
    else if (ctx.role === 'bench' && U.chance(ctx.subChance || 0.65)) enterMin = U.randi(55, 78);
    const stamina = p.stats.stamina;

    // Anlar
    const moments = [];
    if (enterMin) {
      const span = 90 - enterMin + 1;
      const base = { FW: 5, MF: 5, DF: 4 }[p.position];
      const n = Math.max(1, Math.round((base + U.randi(-1, 1)) * span / 90));
      const mins = new Set();
      while (mins.size < n) mins.add(U.randi(enterMin, 89));
      let hadPen = false;
      [...mins].sort((a, b) => a - b).forEach((m) => {
        const w = MOMENT_WEIGHTS[p.position];
        let type = U.weighted(Object.keys(w), (k) => (k === 'penalty' && hadPen ? 0 : w[k]));
        if (type === 'penalty') hadPen = true;
        moments.push({ min: m, type });
      });
    }

    const M = {
      min: 0, hs: 0, as: 0, rating: 6.0, goals: 0, assists: 0, yellow: 0, red: false,
      feed: [], speed: 1, instant: false, statsUsed: new Set(), shots: 0, keyPasses: 0, tackles: 0,
      ownScorers: [], oppScorers: [],
    };
    const isHome = ctx.side === 'home';
    const addOwn = () => (isHome ? M.hs++ : M.as++);
    const addOpp = () => (isHome ? M.as++ : M.hs++);
    const onPitch = () => enterMin !== null && M.min >= enterMin && (leaveMin === null || M.min < leaveMin) && !M.red;

    // UI
    const ov = document.getElementById('match');
    ov.classList.remove('hidden');
    ov.innerHTML = `
      <div class="mt-wrap">
        <div class="mt-top">
          <div class="mt-comp">${U.esc(ctx.compName)}</div>
          <div class="mt-board">
            <div class="mt-team">${UI.shirt(ctx.home, 'big')}<span>${U.esc(ctx.home.name)}</span></div>
            <div class="mt-score"><span id="mt-hs">0</span><i></i><span id="mt-as">0</span></div>
            <div class="mt-team right"><span>${U.esc(ctx.away.name)}</span>${UI.shirt(ctx.away, 'big')}</div>
          </div>
          <div class="mt-time"><span id="mt-min">0'</span><div class="mt-prog"><div id="mt-bar"></div></div></div>
        </div>
        <div class="mt-body">
          <div class="mt-feed" id="mt-feed"></div>
          <div class="mt-side">
            <div class="mt-me">
              <div class="mt-me-name">${U.esc(pname)}</div>
              <div class="mt-me-row"><span>Durum</span><b id="mt-status"></b></div>
              <div class="mt-me-row"><span>Reyting</span><b id="mt-rating">-</b></div>
              <div class="mt-me-row"><span>Gol / Asist</span><b id="mt-ga">0 / 0</b></div>
              <div class="mt-me-row"><span>Enerji</span><b>${Math.round(p.energy)}</b></div>
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
        </div>
      </div>`;

    const $ = (id) => document.getElementById(id);
    const feed = (txt, cls = '') => {
      M.feed.push(txt);
      const d = document.createElement('div');
      d.className = 'fd ' + cls;
      const tag = { 'goal own': 'GOL', 'goal opp': 'GOL', info: 'BİLGİ', bad: 'KART' }[cls];
      d.innerHTML = (tag ? `<em class="ft">${tag}</em>` : '') + U.plain(txt);
      const f = $('mt-feed');
      f.prepend(d);
    };
    const refresh = () => {
      $('mt-hs').textContent = M.hs; $('mt-as').textContent = M.as;
      $('mt-min').textContent = Math.min(90, M.min) + "'";
      $('mt-bar').style.width = Math.min(100, (M.min / 90) * 100) + '%';
      $('mt-rating').textContent = enterMin && M.min >= enterMin ? M.rating.toFixed(1) : '-';
      $('mt-ga').textContent = `${M.goals} / ${M.assists}`;
      $('mt-status').textContent = M.red ? 'Kırmızı kart' : leaveMin !== null && M.min >= leaveMin ? 'Oyundan çıktı' : onPitch() ? 'Sahada' : enterMin ? 'Yedek kulübesinde' : ctx.role === 'out' ? 'Kadro dışı' : 'Yedek kulübesinde';
    };
    U.$$('#mt-speed button').forEach((b) => (b.onclick = () => {
      M.speed = +b.dataset.s;
      U.$$('#mt-speed button').forEach((x) => x.classList.toggle('on', x === b));
    }));
    $('mt-sim').onclick = () => { M.instant = true; if (MiniGame._abort) MiniGame._abort(); };

    if (ctx.role === 'starter') feed(`📋 İlk 11'desin! Formanın sırtında ${p.shirt} numara.`, 'info');
    else if (ctx.role === 'bench') feed('📋 Bugün yedek kulübesinde başlıyorsun.', 'info');
    else feed('📋 Teknik direktör seni bu maçın kadrosuna almadı.', 'info');
    feed(`🏟️ ${U.esc(ctx.home.name)} - ${U.esc(ctx.away.name)} maçı başladı!`);

    const homeR = () => ctx.home.rating + (isHome && onPitch() ? (ovr - ctx.home.rating) * 0.08 : 0);
    const awayR = () => ctx.away.rating + (!isHome && onPitch() ? (ovr - ctx.away.rating) * 0.08 : 0);

    const pickOwn = () => World.pickScorer(own.roster);
    const pickOpp = () => World.pickScorer(opp.roster);

    const rate = (v) => { M.rating = U.clamp(M.rating + v, 3, 10); };

    const ownGoal = (scorerName, assistName, txt) => {
      addOwn();
      M.ownScorers.push(scorerName);
      feed(`⚽ <b>${M.min}'</b> GOL! ${txt || `${U.esc(scorerName)} golü attı.`} <span class="sc">${M.hs}-${M.as}</span>`, 'goal own');
    };
    const oppGoal = (txt) => {
      const sc = pickOpp();
      addOpp();
      M.oppScorers.push(sc.n);
      feed(`🥅 <b>${M.min}'</b> Gol ${U.esc(opp.name)}'dan. ${txt || `Golü ${U.esc(sc.n)} attı.`} <span class="sc">${M.hs}-${M.as}</span>`, 'goal opp');
    };

    // ---- An çözümleme ----
    const mateNames = own.roster.filter((x) => x.pos !== 'GK').map((x) => x.n);

    const mateConvert = (mateName, mateY) => {
      const dist = mateY != null ? mateY : 14;
      const pr = U.clamp(0.62 - dist * 0.018 + (own.rating - opp.rating) / 120, 0.06, 0.66);
      if (U.chance(pr)) {
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
        rate(type === 'penalty' ? 0.7 : type === 'freekick' ? 1.4 : 1.15);
        const msg = {
          penalty: `${U.esc(pname)} penaltıyı soğukkanlılıkla gole çevirdi!`,
          freekick: `${U.esc(pname)} frikikten nefis bir gol attı!`,
        }[type] || U.pick([`${U.esc(pname)} müthiş bir vuruşla ağları sarstı!`, `${U.esc(pname)} kaleciyi çaresiz bıraktı!`, `${U.esc(pname)} topu köşeye yerleştirdi!`]);
        ownGoal(pname, null, msg);
      } else if (o === 'received') {
        M.statsUsed.add('passing');
        mateConvert(r.mate, r.mateY);
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
      if (type === 'freekick') return { outcome: U.chance(U.sigmoid(rel - 2)) ? 'goal' : U.pick(['saved', 'blocked', 'miss']) };
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

    const showMoment = (type) => {
      $('mt-moment').classList.remove('hidden');
      $('mm-min').textContent = `${M.min}'`;
      $('mm-title').textContent = U.plain(MOMENT_TITLES[type]);
      $('mm-desc').textContent = MOMENT_DESC[type];
    };
    const hideMoment = () => { $('mt-moment').classList.add('hidden'); $('mm-host').innerHTML = ''; MiniGame._abort = null; };

    const playCanvas = async (type) => {
      if (M.instant) return autoCanvas(type);
      showMoment(type);
      let auto = false;
      $('mm-auto').onclick = () => { auto = true; if (MiniGame._abort) MiniGame._abort(); };
      const scene = Scenes.make(type, { skill, mates: mateNames, position: p.position, pace: st.pace, narrow: narrow() });
      const r = await MiniGame.play($('mm-host'), scene, { stats: st, skill, cond, kits, number: p.shirt });
      hideMoment();
      if (auto || r.outcome === 'auto') return autoCanvas(type);
      return r;
    };

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

    const resolveMoment = async (mo) => {
      const type = mo.type;
      if (['open', 'deep', 'freekick', 'penalty'].includes(type)) {
        if (type === 'penalty') feed(`⚪ <b>${M.min}'</b> Penaltı! Topun başına ${U.esc(pname)} geçiyor...`, 'info');
        if (type === 'freekick') feed(`🎯 <b>${M.min}'</b> Tehlikeli bölgede serbest vuruş. ${U.esc(pname)} topun başında.`, 'info');
        canvasOutcome(type, await playCanvas(type));
      } else if (type === 'dribble') {
        M.statsUsed.add('dribbling'); M.statsUsed.add('pace');
        const r = await playTiming('dribble', 'dribble', {
          title: 'Çalım at!', kind: 'dribble', desc: 'İmleç yeşil alandayken bas. Her başarılı basış bir rakibi geçirir.',
          rounds: skill < 0.25 ? 1 : skill < 0.6 ? 2 : 3, button: 'ÇALIM!', okText: 'RAKİPLERİ GEÇTİN!', partialText: 'Top ayağından açıldı...', failText: 'TOPU KAPTIRDIN!',
        }, 0.3);
        if (r === 'success') {
          rate(0.3);
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
        const r = await playTiming('header', 'header', {
          title: 'Kafayı vur!', kind: 'header', desc: 'Top havada! Doğru anda yüksel.',
          button: 'KAFA!', okText: 'MÜKEMMEL ZAMANLAMA!', partialText: 'Topa iyi temas edemedin', failText: 'Topu kaçırdın',
        }, 0);
        if (r === 'success') {
          const pg = U.clamp(U.sigmoid((Player.skillFor(p, 'header') - opp.rating) / 12 - 0.2), 0.15, 0.72);
          if (U.chance(pg)) {
            M.goals++; rate(1.1);
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
      if (M.min === enterMin && enterMin > 1) {
        feed(`🔁 <b>${M.min}'</b> Oyuna giriyorsun! Hoca sana güveniyor.`, 'info');
      }
      // oyundan çıkma (kötü performans/yorgunluk)
      if (onPitch() && M.min === 70 && leaveMin === null && enterMin === 1) {
        const tired = p.energy < 45 || stamina < 25;
        if (M.rating < 5.6 || (tired && U.chance(0.5))) {
          leaveMin = 71;
          feed(`🔁 <b>${M.min}'</b> ${U.esc(pname)} oyundan alındı.`, 'info');
          // kalan anları iptal et
          for (let i = moments.length - 1; i >= 0; i--) if (moments[i].min > 70) moments.splice(i, 1);
        }
      }
      // arka plan golleri
      const [lh, la] = World.lambdas(homeR(), awayR());
      const ownL = (isHome ? lh : la) / 90 * (onPitch() ? 0.72 : 1);
      const oppL = (isHome ? la : lh) / 90;
      if (U.chance(ownL)) {
        const sc = pickOwn();
        ownGoal(sc.n);
        if (onPitch()) rate(0.1);
      }
      if (U.chance(oppL)) {
        oppGoal();
        if (onPitch() && p.position !== 'FW') rate(-0.12);
      }
      for (const mo of moments.filter((x) => x.min === M.min)) {
        if (!onPitch()) break;
        await resolveMoment(mo);
      }
      if (M.min === 45) feed('⏸️ İlk yarı sona erdi.', 'info');
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
        if (p.position === 'MF' && ga === 0) rate(0.2);
        if (minutes < 30 && M.goals === 0 && M.assists === 0) M.rating = U.clamp(M.rating, 5.5, 7);
      }
      const rating = Math.round(M.rating * 10) / 10;
      const motm = played && rating >= 8.3;
      feed(`🏁 Maç sona erdi: ${U.esc(ctx.home.name)} ${M.hs} - ${M.as} ${U.esc(ctx.away.name)}`, 'info');
      refresh();
      const summary = {
        gf, ga, res, hs: M.hs, as: M.as, played, minutes: Math.max(0, minutes), rating: played ? rating : null,
        goals: M.goals, assists: M.assists, yellow: M.yellow, red: M.red, motm,
        ownScorers: M.ownScorers, oppScorers: M.oppScorers, statsUsed: [...M.statsUsed],
      };
      const resTxt = { W: 'GALİBİYET', D: 'BERABERLİK', L: 'MAĞLUBİYET' }[res];
      $('mt-moment').classList.remove('hidden');
      $('mm-min').textContent = 'MS';
      $('mm-title').textContent = `Maç Sonu · ${resTxt}`;
      $('mm-desc').textContent = `${ctx.home.name} ${M.hs} - ${M.as} ${ctx.away.name}`;
      $('mm-auto').style.display = 'none';
      $('mm-host').innerHTML = `
        <div class="ms">
          ${played ? `
          <div class="ms-rating ${rating >= 7.5 ? 'good' : rating < 6 ? 'bad' : ''}">${rating.toFixed(1)}</div>
          <div class="ms-grid">
            <div><span>Süre</span><b>${summary.minutes}'</b></div>
            <div><span>Gol</span><b>${M.goals}</b></div>
            <div><span>Asist</span><b>${M.assists}</b></div>
            <div><span>Şut</span><b>${M.shots}</b></div>
            <div><span>Kilit Pas</span><b>${M.keyPasses}</b></div>
            <div><span>Top Kapma</span><b>${M.tackles}</b></div>
          </div>
          ${motm ? '<div class="ms-motm">⭐ MAÇIN ADAMI SEÇİLDİN!</div>' : ''}
          ` : '<div class="ms-none">Bu maçta forma giymedin.</div>'}
          <button class="btn btn-big" id="ms-done">Devam</button>
        </div>`;
      UI.strip($('mm-host'));
      $('ms-done').onclick = () => {
        ov.classList.add('hidden');
        ov.innerHTML = '';
        resolve(summary);
      };
    };

    refresh();
    setTimeout(tick, 600);
  },
};
