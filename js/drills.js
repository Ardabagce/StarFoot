// Antrenman mini oyunları: odak statına göre kısa bir çalışma oynanır, başarı gelişimi etkiler

const DRILLS = {
  shooting: { t: 'Bitiricilik Çalışması', d: 'Ceza sahasında 3 şut. Geriye çekip bırak, köşelere vur.', kind: 'shots', scenes: ['close', 'close', 'penalty'] },
  technique: { t: 'Top Sektirme', d: 'Topu yere düşürmeden 10 kez sektir. Top yeşil bölgeye inince dokun.', kind: 'mini', fn: 'juggle', k: 'dribble' },
  passing: { t: 'Pas Çalışması', d: 'Verkaç istasyonu: parlayan arkadaşına süre dolmadan pas ver.', kind: 'mini', fn: 'onetwo', k: 'pass' },
  dribbling: { t: 'Slalom Çalışması', d: 'Hunilerin ve rakiplerin arasından geç. Halka yeşildeyken dokun.', kind: 'timing', tk: 'dribble', k: 'dribble', cfg: { title: 'Çalım at!', button: 'ÇALIM!', okText: 'MÜKEMMEL!', partialText: 'Fena değil', failText: 'Huniye takıldın', rounds: 3 } },
  heading: { t: 'Kafa Vuruşu Çalışması', d: 'Hoca ortalar yapıyor. Doğru anda yüksel.', kind: 'timing', tk: 'header', k: 'header', cfg: { title: 'Kafayı vur!', button: 'KAFA!', okText: 'TAM ZAMANINDA!', partialText: 'Biraz erken', failText: 'Kaçtı', rounds: 2 } },
  defending: { t: 'İkili Mücadele', d: 'Hücum oyuncusunu durdur. Yeşil alan temiz müdahale.', kind: 'timing', tk: 'tackle', k: 'tackle', cfg: { title: 'Topu kap!', button: 'MÜDAHALE!', okText: 'TERTEMİZ!', partialText: 'Faul olurdu', failText: 'Geçildin', rounds: 2 } },
  physical: { t: 'Omuz Omuza', d: 'Basılı tut, güç dolsun; yeşil bantta bırakıp rakibi it.', kind: 'mini', fn: 'shoulder', k: 'tackle' },
  pace: { t: 'Sürat Koşusu', d: 'Rakibinden önce topa ulaş: hızlı hızlı dokun.', kind: 'mini', fn: 'sprint', k: 'dribble' },
  stamina: { t: 'Mekik Koşusu', d: 'Yorulsan da tempoyu düşürme: hızlı hızlı dokun.', kind: 'mini', fn: 'sprint', k: 'dribble' },
};

const Drill = {
  // Kalite (0-1) → gelişim çarpanı
  mult(q) { return 0.6 + q * 0.9; },

  host() {
    let el = document.getElementById('drill');
    if (!el) {
      el = document.createElement('div');
      el.id = 'drill';
      el.className = 'mt-moment drill hidden';
      document.body.appendChild(el);
    }
    return el;
  },

  // Bir antrenman çalışması oynatır. Sonuç: { q, auto }
  async run(focus, opts = {}) {
    const s = Game.state, p = s.player;
    const D = DRILLS[focus] || DRILLS.shooting;
    const el = Drill.host();
    el.innerHTML = `
      <div class="mm-head">
        <div class="mm-min dr-tag">${opts.tag || 'ANTRENMAN'}</div>
        <div class="mm-tt"><div class="mm-title">${D.t}</div><div class="mm-desc" id="dr-desc">${D.d}</div></div>
        <button class="btn btn-ghost" id="dr-skip">${Icon('fast')}<span>Atla</span></button>
      </div>
      <div class="dr-host" id="dr-host"></div>`;
    el.classList.remove('hidden');
    Weather.reset();
    Sprites.curBall = Balls.forTraining();
    const hostEl = el.querySelector('#dr-host');
    let auto = false;
    el.querySelector('#dr-skip').onclick = () => { auto = true; if (MiniGame._abort) MiniGame._abort(); };

    let q = 0.5, played = false;
    const score = { success: 1, partial: 0.5, fail: 0.15 };
    try {
      const st = Player.effStats(p);
      const skill = U.clamp(Game.levelBase(false) - 0.06, 0.03, 0.8);
      const own = s.world.clubs[s.clubId] || { id: 'X', c1: '#1f6feb', c2: '#ffffff' };
      const bibs = { id: 'BIB', c1: '#ff7a1a', c2: '#ff7a1a' };
      const kits = Sprites.kits(own, bibs);
      const mates = (Game.teamRoster(s.clubId) || []).filter((x) => x.pos !== 'GK').map((x) => x.n);
      const cond = 1.25 - 0.35 * (p.energy / 100) - 0.15 * (p.morale / 100);
      const narrow = window.innerWidth / window.innerHeight < 0.9;
      if (D.kind === 'shots') {
        let sum = 0;
        for (let i = 0; i < D.scenes.length && !auto; i++) {
          el.querySelector('#dr-desc').textContent = `${D.d} (${i + 1}/${D.scenes.length})`;
          const scene = Scenes.make(D.scenes[i], { skill, mates, position: p.position, pace: st.pace, narrow });
          const r = await MiniGame.play(hostEl, scene, { stats: st, skill, cond, kits, number: p.shirt, mateChance: () => 0.5 });
          if (r.outcome === 'auto') { auto = true; break; }
          sum += { goal: 1, post: 0.5, bar: 0.5, saved: 0.35, received: 0.4, claimed: 0.2 }[r.outcome] || 0.1;
          q = sum / (i + 1);
          played = true;
        }
      } else if (D.kind === 'timing') {
        const rel = Player.skillFor(p, D.k) - expectedAtAge(Math.min(p.age, 24));
        const cfg = Object.assign({
          kind: D.tk, desc: D.d,
          green: U.clamp(0.2 + rel / 220 - skill * 0.1, 0.08, 0.36), yellow: 0.07,
          speed: (0.75 + 0.6 * skill) * Math.sqrt(cond / 0.8), kits, number: p.shirt,
        }, D.cfg);
        const r = await MiniGame.timing(hostEl, cfg);
        if (r.result === 'auto') auto = true; else q = score[r.result] ?? 0.3;
      } else {
        const r = await MiniGame[D.fn](hostEl, { skill, kits, number: p.shirt, pace: st.pace, passing: st.passing, technique: st.technique, physical: st.physical, mates, cond });
        if (r.result === 'auto') auto = true; else q = score[r.result] ?? 0.3;
      }
    } catch (e) {
      console.error(e);
      auto = true;
    }
    Drill.close();
    // Atlanan çalışma ortalama sayılır
    if (auto && !played) q = 0.45;
    return { q: U.clamp(q, 0, 1), auto: auto && !played };
  },

  close() {
    MiniGame._abort = null;
    Sprites.curBall = null;
    const el = document.getElementById('drill');
    if (el) { el.classList.add('hidden'); el.innerHTML = ''; }
  },

  grade(q) {
    if (q >= 0.85) return 'Mükemmel çalışma';
    if (q >= 0.6) return 'İyi çalışma';
    if (q >= 0.35) return 'Ortalama çalışma';
    return 'Zayıf çalışma';
  },
};
