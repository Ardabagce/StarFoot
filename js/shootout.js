// Kupa eleme maçlarında uzatma ve penaltı atışları.
// Uzatma (2x15 dk) güçlere göre simüle edilir. Penaltılarda oyuncu sahadaysa:
//  - oyuncu (kaleci değil) kendi atışını mini oyunla kullanır,
//  - kaleci ise rakibin bütün atışlarında kalede o vardır.
// Diğer atışlar güce göre simüle edilir; 5 atıştan sonra eşitlikte seri tek tek devam eder.
const Shootout = {
  // Uzatma: her takım için yaklaşık 0,3 gol beklentisi, güç farkıyla değişir
  extra(ctx) {
    const rh = ctx.home.rating || 60, ra = ctx.away.rating || 60;
    const lam = (a, b) => U.clamp(0.3 * (1 + (a - b) / 45), 0.08, 0.6);
    const pois = (l) => { let k = 0, p = Math.exp(-l), s = p; const u = Math.random(); while (u > s && k < 4) { k++; p *= l / k; s += p; } return k; };
    return { h: pois(lam(rh + 2, ra)), a: pois(lam(ra, rh + 2)) };
  },
  ff() { return typeof FF !== 'undefined' && FF.on; },
  // Simüle edilen atışın gol olma olasılığı
  pGoal(shooterR, keeperR) { return U.clamp(0.76 + (shooterR - keeperR) / 220, 0.62, 0.88); },

  // sonuç: { hs, as, homeWon, seq: [{side, goal, me}] }
  async run(ctx, sum, s) {
    const p = s.player;
    const my = ctx.side === 'home' ? 'h' : 'a';
    const own = ctx.side === 'home' ? ctx.home : ctx.away, opp = ctx.side === 'home' ? ctx.away : ctx.home;
    const canPlay = !Shootout.ff() && sum && sum.played && (sum.onEnd !== undefined ? sum.onEnd : !sum.red) && ctx.role !== 'out';
    const gk = p.position === 'GK';
    const rt = { h: ctx.home.rating || 60, a: ctx.away.rating || 60 };
    const seq = [], sc = { h: 0, a: 0 }, n = { h: 0, a: 0 };
    let ui = null;
    if (!Shootout.ff()) ui = Shootout.board(ctx, own, opp, my);
    const decided = () => {
      if (n.h <= 5 && n.a <= 5 && (n.h < 5 || n.a < 5)) {
        const leftH = 5 - n.h, leftA = 5 - n.a;
        return sc.h > sc.a + leftA || sc.a > sc.h + leftH;
      }
      return n.h === n.a && sc.h !== sc.a;
    };
    let myKickDone = false;
    for (let guard = 0; guard < 40 && !decided(); guard++) {
      const side = n.h <= n.a ? 'h' : 'a';
      const other = side === 'h' ? 'a' : 'h';
      let goal, me = false;
      if (canPlay && side === my && !gk && !myKickDone) {
        myKickDone = true; me = true;
        if (ui) ui.say(`Sıra sende: ${U.esc(Player.fullName(p))} topun başında`);
        goal = await Shootout.myKick(ctx, s, own, opp);
      } else if (canPlay && side !== my && gk) {
        me = true;
        if (ui) ui.say(`${U.esc(opp.name)} atışı kullanıyor, kalede sen varsın`);
        goal = !(await Shootout.mySave(ctx, s, own, opp));
        if (!goal && typeof CStats !== 'undefined') { try { const c = CStats.ensure(p); c.sv = (c.sv || 0) + 1; c.ps = (c.ps || 0) + 1; } catch (e) { /* yok */ } }
      } else {
        if (ui) { ui.say(`${U.esc((side === 'h' ? ctx.home : ctx.away).name)} atışı kullanıyor...`); await Shootout.wait(750); }
        goal = U.chance(Shootout.pGoal(rt[side], rt[other]));
      }
      n[side]++; if (goal) sc[side]++;
      seq.push({ side, goal, me });
      if (ui) { ui.mark(side, n[side], goal, me); ui.score(sc.h, sc.a); ui.say(goal ? 'GOL!' : me && side !== my ? 'KURTARDIN!' : 'KAÇTI!'); await Shootout.wait(me ? 600 : 650); }
    }
    const homeWon = sc.h > sc.a;
    if (ui) {
      const won = homeWon === (my === 'h');
      ui.say(won ? 'KAZANDIK!' : 'KAYBETTİK');
      await ui.finish(won);
    }
    return { hs: sc.h, as: sc.a, homeWon, seq };
  },
  wait(ms) { return new Promise((r) => setTimeout(r, ms)); },

  // Skor tabelası: iki sıra 5 nokta (seri uzarsa yenileri eklenir)
  board(ctx, own, opp, my) {
    const el = document.createElement('div');
    el.className = 'pso-ov';
    const nm = (t) => U.esc(t.short || t.name);
    el.innerHTML = `<div class="pso-card">
      <div class="pso-tag">PENALTI ATIŞLARI</div>
      <div class="pso-rows">
        <div class="pso-r" data-r="h"><b class="${my === 'h' ? 'me' : ''}">${nm(ctx.home)}</b><span class="pso-dots">${'<i></i>'.repeat(5)}</span><em>0</em></div>
        <div class="pso-r" data-r="a"><b class="${my === 'a' ? 'me' : ''}">${nm(ctx.away)}</b><span class="pso-dots">${'<i></i>'.repeat(5)}</span><em>0</em></div>
      </div>
      <div class="pso-say" aria-live="polite"></div>
      <div class="pso-btns"></div>
    </div>`;
    document.body.appendChild(el);
    const row = (s) => el.querySelector(`[data-r="${s}"]`);
    return {
      el,
      say(t) { el.querySelector('.pso-say').innerHTML = t; },
      mark(side, k, goal, me) {
        const dots = row(side).querySelector('.pso-dots');
        while (dots.children.length < k) dots.insertAdjacentHTML('beforeend', '<i></i>');
        const d = dots.children[k - 1];
        d.className = (goal ? 'g' : 'x') + (me ? ' me' : '');
      },
      score(h, a) { row('h').querySelector('em').textContent = h; row('a').querySelector('em').textContent = a; },
      finish(won) {
        return new Promise((res) => {
          el.classList.add(won ? 'won' : 'lost');
          const b = document.createElement('button');
          b.className = 'btn btn-big'; b.type = 'button'; b.textContent = 'Devam';
          b.onclick = () => { el.remove(); res(); };
          el.querySelector('.pso-btns').appendChild(b);
        });
      },
      hide(v) { el.style.display = v ? 'none' : ''; },
    };
  },

  // Mini oyun kabı (maç ekranındaki an kutusuyla aynı görünüm)
  host(title, desc) {
    const el = document.createElement('div');
    el.className = 'mt-moment drill pso-mg';
    el.innerHTML = `<div class="mm-head"><div class="mm-min dr-tag">PEN</div><div class="mm-tt"><div class="mm-title">${U.esc(title)}</div><div class="mm-desc">${U.esc(desc)}</div></div><button class="btn btn-ghost mm-auto" type="button">Otomatik</button></div><div class="dr-host"></div>`;
    document.body.appendChild(el);
    el.querySelector('.mm-auto').onclick = () => { if (MiniGame._abort) MiniGame._abort(); };
    return el;
  },
  kits(ctx, own, opp) { return Sprites.kits(own, opp, ctx.side === 'away'); },
  skill(ctx, s, opp) {
    const ovr = Player.overall(s.player, true);
    return U.clamp((ctx.levelBase != null ? ctx.levelBase : 0.4) + (opp.rating - ovr) / 70, 0.05, 0.85);
  },
  async myKick(ctx, s, own, opp) {
    const p = s.player, st = Player.effStats(p);
    const ov = document.querySelector('.pso-ov'); if (ov) ov.style.display = 'none';
    const el = Shootout.host('Penaltı atışı', 'Kaleciyi oku, köşeyi seç ve vur!');
    try {
      const skill = Shootout.skill(ctx, s, opp);
      const scene = Scenes.make('penalty', { skill, mates: [], position: p.position, pace: st.pace, narrow: window.innerWidth / window.innerHeight < 0.9 });
      const r = await MiniGame.play(el.querySelector('.dr-host'), scene, { stats: st, skill, cond: 1, kits: Shootout.kits(ctx, own, opp), number: p.shirt, mateChance: () => 0.5 });
      if (!r || r.outcome === 'auto') return U.chance(U.clamp(0.72 + (st.shooting - 60) / 200, 0.6, 0.9));
      return r.outcome === 'goal';
    } catch (e) {
      return U.chance(0.75);
    } finally {
      MiniGame._abort = null; el.remove(); if (ov) ov.style.display = '';
    }
  },
  // true: kurtarıldı
  async mySave(ctx, s, own, opp) {
    const p = s.player, st = Player.effStats(p);
    const ov = document.querySelector('.pso-ov'); if (ov) ov.style.display = 'none';
    const el = Shootout.host('Penaltı: kalede sensin', 'Forvetin bakışını oku ve vuruş anında bir köşeye uç!');
    try {
      const r = await MiniGame.keeper(el.querySelector('.dr-host'), { mode: 'pen', reflex: st.pace, handling: st.technique, skill: Shootout.skill(ctx, s, opp), kits: Shootout.kits(ctx, own, opp), number: p.shirt });
      const res = r && r.result;
      if (!res || res === 'auto') return U.chance(0.26);
      if (res === 'success') return true;
      if (res === 'partial') return U.chance(0.5);
      return false;
    } catch (e) {
      return U.chance(0.25);
    } finally {
      MiniGame._abort = null; el.remove(); if (ov) ov.style.display = '';
    }
  },
};
