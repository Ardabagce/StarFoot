// Ses efektleri (Web Audio ile üretilir, dosya yok) ve titreşim (Capacitor Haptics / navigator.vibrate)
const Sfx = {
  on: (() => { try { return localStorage.getItem('starfoot_sfx') !== '0'; } catch (e) { return true; } })(),
  hap: (() => { try { return localStorage.getItem('starfoot_haptics') !== '0'; } catch (e) { return true; } })(),
  ctx: null,
  mus: (() => { try { return localStorage.getItem('starfoot_music') !== '0'; } catch (e) { return true; } })(),
  setOn(v) { Sfx.on = !!v; try { localStorage.setItem('starfoot_sfx', v ? '1' : '0'); } catch (e) { /* yok */ } if (!v) Sfx.crowd(false); },
  setMusic(v) { Sfx.mus = !!v; try { localStorage.setItem('starfoot_music', v ? '1' : '0'); } catch (e) { /* yok */ } Music.update(); },
  // Gerçek kayıtlar (snd/): tribün ortamı, gol coşkusu, alkış. Yüklenemezse sentez sesler kullanılır.
  buf: {},
  loadSamples() {
    if (Sfx._loading || !Sfx.ctx || location.protocol === 'file:') return;
    Sfx._loading = true;
    ['crowd', 'goal', 'cheer'].forEach((k) => {
      fetch(`snd/${k}.mp3`).then((r) => r.arrayBuffer()).then((a) => new Promise((ok, no) => Sfx.ctx.decodeAudioData(a, ok, no)))
        .then((b) => { Sfx.buf[k] = b; if (k === 'crowd' && Sfx._cr && Sfx._cr.synth) Sfx.crowd(true, Sfx._cr.quiet); }).catch(() => {});
    });
  },
  // tribün yoğunluğu: oyuncunun yıldızlığına ve maçın önemine göre (0 boş, 1 dolu stadyum)
  lvl() { return typeof Sprites !== 'undefined' && Sprites.atmo ? U.clamp(Sprites.atmo.lvl, 0, 1) : 0.6; },
  sample(k, vol, rate = 1) {
    const b = Sfx.buf[k];
    if (!b) return false;
    const c = Sfx.ctx, src = c.createBufferSource(), g = c.createGain();
    src.buffer = b; src.playbackRate.value = rate; g.gain.value = vol;
    src.connect(g); g.connect(Sfx.out); src.start();
    return true;
  },
  setHap(v) { Sfx.hap = !!v; try { localStorage.setItem('starfoot_haptics', v ? '1' : '0'); } catch (e) { /* yok */ } },

  // iOS/Android ses bağlamını ancak bir dokunuştan sonra açar
  unlock() {
    if (Sfx.ctx || typeof window === 'undefined') return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      Sfx.ctx = new AC();
      Sfx.out = Sfx.ctx.createGain(); Sfx.out.gain.value = 0.8; Sfx.out.connect(Sfx.ctx.destination);
    } catch (e) { Sfx.ctx = null; }
    Sfx.loadSamples();
    Music.update();
  },
  ready() {
    if (!Sfx.on) return false;
    Sfx.unlock();
    if (!Sfx.ctx) return false;
    if (Sfx.ctx.state === 'suspended') Sfx.ctx.resume().catch(() => {});
    return true;
  },
  noise() {
    if (Sfx._nb) return Sfx._nb;
    const c = Sfx.ctx, len = c.sampleRate * 2, b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return (Sfx._nb = b);
  },
  env(g, t, a, peak, dcy) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + dcy);
  },
  // gürültü tabanlı ses (kalabalık, file, vuruş)
  burst(type, f0, f1, q, a, peak, dcy, delay = 0) {
    const c = Sfx.ctx, t = c.currentTime + delay;
    const src = c.createBufferSource(); src.buffer = Sfx.noise();
    const f = c.createBiquadFilter(); f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + a + dcy);
    const g = c.createGain(); Sfx.env(g, t, a, peak, dcy);
    src.connect(f); f.connect(g); g.connect(Sfx.out);
    src.start(t, Math.random()); src.stop(t + a + dcy + 0.05);
  },
  tone(wave, f0, f1, a, peak, dcy, delay = 0, vib) {
    const c = Sfx.ctx, t = c.currentTime + delay;
    const o = c.createOscillator(); o.type = wave;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + a + dcy);
    if (vib) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = vib[0]; lg.gain.value = vib[1]; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + a + dcy + 0.05); }
    const g = c.createGain(); Sfx.env(g, t, a, peak, dcy);
    o.connect(g); g.connect(Sfx.out);
    o.start(t); o.stop(t + a + dcy + 0.05);
  },

  play(name) {
    if (!Sfx.ready()) return;
    try {
      switch (name) {
        case 'whistle': Sfx.tone('sine', 2900, 2800, 0.02, 0.18, 0.25, 0, [32, 140]); break;
        case 'whistleLong': Sfx.tone('sine', 2900, 2850, 0.03, 0.18, 0.8, 0, [30, 150]); break;
        case 'whistleEnd': [0, 0.45, 0.9].forEach((d, i) => Sfx.tone('sine', 2900, 2850, 0.02, 0.18, i === 2 ? 0.9 : 0.3, d, [30, 150])); break;
        case 'kick':
          Sfx.tone('sine', 160, 45, 0.005, 0.7, 0.16);
          Sfx.burst('highpass', 1800, 1200, 0.7, 0.002, 0.25, 0.05);
          break;
        case 'net': Sfx.burst('highpass', 2500, 1200, 0.5, 0.01, 0.25, 0.35); break;
        case 'post': Sfx.tone('triangle', 920, 880, 0.002, 0.35, 0.7); Sfx.tone('sine', 1380, 1320, 0.002, 0.2, 0.5); break;
        case 'roar':
          if (Sfx.sample('goal', 0.35 + 0.75 * Sfx.lvl(), 0.97 + Math.random() * 0.06)) break;
          Sfx.burst('bandpass', 500, 900, 0.6, 0.25, 0.55, 2.6);
          Sfx.burst('bandpass', 1200, 1600, 0.8, 0.3, 0.3, 2.2, 0.05);
          break;
        case 'ooh': Sfx.burst('bandpass', 520, 280, 2.2, 0.18, 0.35, 1.1); break;
        case 'groan': Sfx.burst('bandpass', 380, 220, 1.6, 0.12, 0.22, 0.9); break;
        case 'save': Sfx.burst('lowpass', 900, 300, 0.7, 0.003, 0.4, 0.15); Sfx.play('ooh'); break;
        case 'cheer': if (Sfx.sample('cheer', 0.5 + 0.5 * Sfx.lvl(), 0.96 + Math.random() * 0.08)) break; Sfx.burst('bandpass', 900, 1300, 0.9, 0.2, 0.32, 1.8); break;
        case 'heart': [0, 0.16, 0.85, 1.01].forEach((d, i) => Sfx.tone('sine', i % 2 ? 50 : 62, 40, 0.01, 0.6, 0.14, d)); break;
        case 'coin': Sfx.tone('square', 1320, 1320, 0.005, 0.08, 0.09); Sfx.tone('square', 1760, 1760, 0.005, 0.08, 0.22, 0.08); break;
        case 'fanfare': [[523, 0], [659, 0.16], [784, 0.32], [1047, 0.5]].forEach(([f, d], i) => { Sfx.tone('sawtooth', f, f, 0.02, 0.07, i === 3 ? 1.1 : 0.22, d); Sfx.tone('sine', f, f, 0.02, 0.1, i === 3 ? 1.2 : 0.25, d); }); break;
        case 'shutter': Sfx.burst('highpass', 3000, 2500, 0.8, 0.002, 0.2, 0.06); break;
        case 'tick': Sfx.tone('sine', 1500, 1500, 0.002, 0.06, 0.04); break;
        default: break;
      }
    } catch (e) { /* ses çalınamadı */ }
  },

  // Maç boyunca tribün uğultusu (mahalle maçında çok hafif)
  crowd(onOff, quiet) {
    const stop = () => {
      if (!Sfx._cr) return;
      const { src, g } = Sfx._cr; Sfx._cr = null;
      setTimeout(() => Music.update(), 1200);
      try { g.gain.setTargetAtTime(0.0001, Sfx.ctx.currentTime, 0.4); src.stop(Sfx.ctx.currentTime + 1.5); } catch (e) { /* yok */ }
    };
    if (!onOff) return stop();
    if (!Sfx.ready()) return;
    stop();
    Music.update(true);
    if (Sfx.buf.crowd) {
      try {
        const c = Sfx.ctx, src = c.createBufferSource(), g = c.createGain();
        src.buffer = Sfx.buf.crowd; src.loop = true;
        g.gain.value = 0.0001; g.gain.setTargetAtTime(quiet ? 0.08 : 0.18 + 0.62 * Sfx.lvl(), c.currentTime, 0.8);
        src.connect(g); g.connect(Sfx.out); src.start(0, Math.random() * 20);
        Sfx._cr = { src, g, quiet };
      } catch (e) { /* yok */ }
      return;
    }
    try {
      const c = Sfx.ctx;
      const src = c.createBufferSource(); src.buffer = Sfx.noise(); src.loop = true;
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = quiet ? 1400 : 700; f.Q.value = 0.5;
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
      const g = c.createGain(); g.gain.value = 0.0001; g.gain.setTargetAtTime(quiet ? 0.015 : 0.07, c.currentTime, 0.8);
      const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.18; lg.gain.value = quiet ? 0.005 : 0.025; lfo.connect(lg); lg.connect(g.gain); lfo.start();
      src.connect(f); f.connect(lp); lp.connect(g); g.connect(Sfx.out); src.start();
      Sfx._cr = { src, g, quiet, synth: true };
    } catch (e) { /* yok */ }
  },

  // Titreşim: light / medium / heavy / success / warning
  buzz(kind = 'light') {
    if (!Sfx.hap) return;
    const C = window.Capacitor, H = C && C.isNativePlatform && C.isNativePlatform() && C.Plugins && C.Plugins.Haptics;
    try {
      if (H) {
        if (kind === 'success' || kind === 'warning') H.notification({ type: kind === 'success' ? 'SUCCESS' : 'WARNING' });
        else H.impact({ style: kind.toUpperCase() });
      } else if (navigator.vibrate) navigator.vibrate(kind === 'heavy' ? 60 : kind === 'success' ? [30, 40, 60] : kind === 'medium' ? 35 : 15);
    } catch (e) { /* desteklenmiyor */ }
  },
};

// Menü müziği (snd/menu.mp3, CC0): akış olarak çalınır, maçta tribün sesi açılınca kısılır.
const Music = {
  el: null, node: null, g: null,
  update(duck) {
    const want = Sfx.mus && !document.hidden && !(duck || Sfx._cr);
    if (!want) { if (Music.el) Music.fade(0, () => Music.el.pause()); return; }
    if (!Sfx.ctx || location.protocol === 'file:') return;
    try {
      if (!Music.el) {
        Music.el = new Audio('snd/menu.mp3'); Music.el.loop = true; Music.el.preload = 'auto';
        Music.node = Sfx.ctx.createMediaElementSource(Music.el);
        Music.g = Sfx.ctx.createGain(); Music.g.gain.value = 0.0001;
        Music.node.connect(Music.g); Music.g.connect(Sfx.ctx.destination);
      }
      if (Sfx.ctx.state === 'suspended') Sfx.ctx.resume().catch(() => {});
      const p = Music.el.play(); if (p && p.catch) p.catch(() => {});
      Music.fade(0.22);
    } catch (e) { /* yok */ }
  },
  fade(v, done) {
    if (!Music.g) return done && done();
    const t = Sfx.ctx.currentTime;
    Music.g.gain.cancelScheduledValues(t); Music.g.gain.setTargetAtTime(Math.max(0.0001, v), t, 0.5);
    clearTimeout(Music._t); if (done) Music._t = setTimeout(done, 1600);
  },
};
['pointerdown', 'touchstart', 'keydown'].forEach((ev) => window.addEventListener(ev, () => Sfx.unlock(), { once: true, passive: true }));
document.addEventListener('visibilitychange', () => { Music.update(); if (Sfx.ctx) { if (document.hidden) Sfx.ctx.suspend().catch(() => {}); else if (Sfx.on) Sfx.ctx.resume().catch(() => {}); } });
