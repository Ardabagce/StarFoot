// Nasıl Oynanır: maçın akışı ve tüm mini oyunların kısa eğitimi.
// Mini oyun açıklamaları maçtakiyle aynı (MOMENT_DESC). Ana menüden her zaman açılır; yeni oyunculara ilk maçtan önce bir kez önerilir (atlanabilir).
const TUT_KEY = 'starfoot_tut';
const TUT_STEPS = [
  { id: 'match', icon: 'whistle', t: 'Maç nasıl oynanır?', d: 'Maçlar dakika dakika simülasyonla akar. Kritik anlarda oyun durur ve top senin ayağına gelir: o anı sen oynarsın. Maç sırasında efor seviyeni seç, istediğin an değiştir: az efor enerjini korur, çok efor daha çok pozisyon getirir ama seni yorar.' },
  { id: 'shot', icon: 'ball', t: 'Şut çekmek', d: 'Parmağını geriye doğru çek ve bırak: ne kadar çekersen o kadar sert vurursun, top çektiğin yönün tersine gider. Alttan Yerden, Yarım ya da Aşırtma vuruşu seç.', play: { kind: 'shot', scene: 'close' } },
  { id: 'pass', icon: 'boot', t: 'Pas ve hücum', d: MOMENT_DESC.open, play: { kind: 'shot', scene: 'open' } },
  { id: 'dribble', icon: 'fast', t: 'Çalım atmak', d: MOMENT_DESC.dribble, play: { kind: 'mini', fn: 'dribble', rounds: 2 } },
  { id: 'onetwo', icon: 'team', t: 'Verkaç', d: MOMENT_DESC.onetwo, play: { kind: 'mini', fn: 'onetwo' } },
  { id: 'header', icon: 'star', t: 'Kafa topu', d: MOMENT_DESC.header, play: { kind: 'mini', fn: 'header' } },
  { id: 'freekick', icon: 'fire', t: 'Frikik', d: MOMENT_DESC.freekick, play: { kind: 'shot', scene: 'freekick' } },
  { id: 'penalty', icon: 'coach', t: 'Penaltı', d: MOMENT_DESC.penalty, play: { kind: 'shot', scene: 'penalty' } },
  { id: 'tackle', icon: 'shield', t: 'Top kapmak', d: MOMENT_DESC.tackle, play: { kind: 'timing' } },
  { id: 'sprint', icon: 'bolt', t: 'Hız koşusu', d: MOMENT_DESC.sprint, play: { kind: 'mini', fn: 'sprint' } },
];

const Tutorial = {
  get() { try { return localStorage.getItem(TUT_KEY); } catch (e) { return 'done'; } },
  set(v) { try { localStorage.setItem(TUT_KEY, v); } catch (e) { /* depolama yok */ } },
  // Bu sürümden önce kariyeri olan oyuncular "eski" sayılır: onlara eğitim önerilmez
  init() {
    if (Tutorial.get()) return;
    let old = false;
    try {
      for (let i = 0; i < 5 && !old; i++) old = !!localStorage.getItem('starfoot_slot_' + i);
      if (!old) old = !!localStorage.getItem('starfoot_save_v1');
    } catch (e) { old = true; }
    if (old) Tutorial.set('old');
  },
  // Yalnız yeni oyuncuya, ilk maçından önce bir kez
  shouldOffer() { return !Tutorial.get(); },

  // İlk maçtan önce: eğitim mi, kendin mi öğreneceksin?
  offer() {
    return new Promise((res) => {
      Game.modal(`<div class="ev-tag">Nasıl Oynanır</div><h3>İlk maçından önce kısa bir eğitim ister misin?</h3><p>Şut, pas, çalım, verkaç, kafa topu ve diğer kritik anların nasıl oynandığını 1-2 dakikada öğren, istersen her birini dene. Ana menüden istediğin zaman tekrar açabilirsin.</p>`, [
        { t: 'Kendim öğrenirim', cls: 'btn-ghost', fn: () => { Tutorial.set('skipped'); res(); } },
        { t: `${Icon('play')} Eğitime başla`, cls: 'btn-big', fn: () => { Tutorial.open().then(res); } },
      ]);
    });
  },

  el() {
    let el = document.getElementById('tut');
    if (!el) {
      el = document.createElement('div');
      el.id = 'tut';
      el.className = 'overlay tut hidden';
      document.body.appendChild(el);
    }
    return el;
  },

  // Eğitim ekranı. Kapanınca çözülür.
  open(start = 0) {
    return new Promise((res) => {
      const el = Tutorial.el();
      let i = start;
      const done = new Set();
      const close = (v) => { el.classList.add('hidden'); el.innerHTML = ''; Tutorial.set(v); res(); };
      const draw = () => {
        const s = TUT_STEPS[i], last = i === TUT_STEPS.length - 1;
        el.innerHTML = `
          <div class="tut-box">
            <div class="tut-top">
              <span class="tut-tag"><span>Nasıl Oynanır</span> · <b>${i + 1}/${TUT_STEPS.length}</b></span>
              <button class="btn btn-ghost tut-skip" data-tut="skip">Tümünü atla</button>
            </div>
            <div class="tut-dots">${TUT_STEPS.map((x, k) => `<i class="${k === i ? 'on' : ''} ${done.has(x.id) ? 'ok' : ''}" data-dot="${k}"></i>`).join('')}</div>
            <div class="tut-ic">${Icon(s.icon)}</div>
            <h3 class="tut-t">${s.t}</h3>
            <p class="tut-d">${s.d}</p>
            ${s.play ? `<button class="btn btn-play tut-try" data-tut="try">${Icon('play')} ${done.has(s.id) ? 'Tekrar dene' : 'Dene'}</button>` : ''}
            <div class="tut-nav">
              <button class="btn btn-ghost" data-tut="prev" ${i ? '' : 'disabled'}>‹ <span>Geri</span></button>
              <button class="btn ${last ? 'btn-big' : ''}" data-tut="next">${last ? 'Oynamaya başla' : '<span>Sonraki</span> ›'}</button>
            </div>
          </div>`;
        el.querySelector('[data-tut="skip"]').onclick = () => close('skipped');
        el.querySelector('[data-tut="prev"]').onclick = () => { if (i) { i--; draw(); } };
        el.querySelector('[data-tut="next"]').onclick = () => { if (last) close('done'); else { i++; draw(); } };
        U.$$('[data-dot]', el).forEach((d) => (d.onclick = () => { i = +d.dataset.dot; draw(); }));
        const t = el.querySelector('[data-tut="try"]');
        if (t) t.onclick = async () => {
          const r = await Tutorial.practice(s);
          if (r) done.add(s.id);
          draw();
        };
      };
      el.classList.remove('hidden');
      draw();
    });
  },

  // Tek bir mini oyunu alıştırma olarak oynatır (sonuç kariyeri etkilemez). Oynandıysa true.
  async practice(step) {
    const P = step.play;
    const el = document.createElement('div');
    el.className = 'mt-moment drill tut-play';
    el.innerHTML = `
      <div class="mm-head">
        <div class="mm-min dr-tag">ALIŞTIRMA</div>
        <div class="mm-tt"><div class="mm-title">${step.t}</div><div class="mm-desc">${step.d}</div></div>
        <button class="btn btn-ghost" data-x>${Icon('fast')}<span>Atla</span></button>
      </div>
      <div class="dr-host"></div>`;
    document.body.appendChild(el);
    const host = el.querySelector('.dr-host');
    let skipped = false;
    el.querySelector('[data-x]').onclick = () => { skipped = true; if (MiniGame._abort) MiniGame._abort(); };
    Weather.reset();
    Sprites.curBall = Balls.forTraining();
    const s = Game.state, p = s && s.player;
    const st = p ? Player.effStats(p) : { pace: 60, shooting: 60, passing: 60, dribbling: 60, technique: 60, heading: 60, defending: 60, physical: 60, stamina: 60 };
    const own = (s && s.world && s.world.clubs[s.clubId]) || { id: 'X', c1: '#1f6feb', c2: '#ffffff' };
    const kits = Sprites.kits(own, { id: 'BIB', c1: '#ff7a1a', c2: '#ff7a1a' });
    const mates = ['Kerem', 'Arda', 'Barış', 'Mert'];
    const skill = 0.12, cond = 0.8, number = p ? p.shirt : 10;
    const narrow = window.innerWidth / window.innerHeight < 0.9;
    let good = false;
    try {
      if (P.kind === 'shot') {
        const scene = Scenes.make(P.scene, { skill, mates, position: 'FW', pace: st.pace, narrow });
        scene.offside = P.scene === 'open' ? scene.offside : null;
        const r = await MiniGame.play(host, scene, { stats: st, skill, cond, kits, number, mateChance: () => 0.6 });
        good = r.outcome === 'goal' || r.outcome === 'received';
      } else if (P.kind === 'timing') {
        const r = await MiniGame.timing(host, { kind: 'tackle', title: 'Topu kap!', desc: step.d, button: 'MÜDAHALE!', okText: 'TERTEMİZ!', partialText: 'Faul olurdu', failText: 'Geçildin', green: 0.3, yellow: 0.07, speed: 0.75, kits, number });
        good = r.result === 'success';
      } else {
        const r = await MiniGame[P.fn](host, { skill, kits, number, pace: st.pace, passing: st.passing, technique: st.technique, physical: st.physical, heading: st.heading, stamina: st.stamina, dribbling: st.dribbling, rounds: P.rounds, mates, cond });
        good = r.result === 'success';
      }
    } catch (e) { console.error(e); skipped = true; }
    MiniGame._abort = null;
    Sprites.curBall = null;
    el.remove();
    if (!skipped && typeof Game !== 'undefined' && Game.toast) Game.toast(good ? 'Harika! Maçta da böyle yap.' : 'Olsun! Maçta tekrar şansın olacak.', good ? 'good' : 'info');
    return !skipped;
  },
};
Tutorial.init();
