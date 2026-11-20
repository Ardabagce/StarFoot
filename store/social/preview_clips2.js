// App Store tanıtım videosu için ek sahneler (1.0.26): penaltı atışları tablosu ve telefon (StarDeğer)
// Kullanım: PREVIEW=1 node store/social/preview_clips2.js <dil> <klasör> [pso|phone]
const { chromium, open, record } = require('./rec');
const path = require('path');
const lang = process.argv[2] || 'tr';
const OUT = process.argv[3] || path.join(__dirname, 'work', 'pv-' + lang);
const ONLY = process.argv[4] || '';

async function career(pg) {
  await pg.clock.runFor(500);
  await pg.evaluate(() => { window.SF_PLUS_PREVIEW = true; window.SF_PREVIEW = true; });
  await pg.click('[data-new="0"]');
  await pg.fill('#cr-name', lang === 'en' ? 'Alex' : 'Emre'); await pg.fill('#cr-sur', lang === 'en' ? 'Stone' : 'Yıldız');
  await pg.selectOption('#cr-age', '17'); await pg.click('#cr-go'); await pg.clock.runFor(300); await pg.click('.modal-btns button');
  await pg.evaluate(() => {
    const s = Game.state; s.street.done = true; Game.joinClub('RMA', 385000, 4);
    const p = Game.p; p.age = 24; p.position = 'FW'; Object.keys(p.stats).forEach((k) => (p.stats[k] = 95));
    p.energy = 100; p.morale = 90; p.money = 48.6e6; p.fame = 92; s.ap = 3; p.shirt = 10; p.totals.goals = 214;
    Premium.active = true; localStorage.setItem('starfoot_tut', 'done');
    document.querySelectorAll('.toast, #toasts > *').forEach((t) => t.remove());
  });
}

(async () => {
  const b = await chromium.launch();
  if (!ONLY || ONLY === 'pso') {
    const pg = await open(b, lang);
    await career(pg);
    await pg.evaluate(() => {
      const opp = Game.club('BAY') || Object.values(Game.state.clubs || {})[1] || { name: 'Rakip', short: 'RKP' };
      const ui = Shootout.board({ home: Game.club(), away: opp }, Game.club(), opp, 'h');
      window.__pso = ui;
    });
    // 4-3: son atışı oyuncu kullanır
    const seq = [['h', 1, 1, 0], ['a', 1, 1, 0], ['h', 2, 1, 0], ['a', 2, 0, 0], ['h', 3, 1, 0], ['a', 3, 1, 0], ['h', 4, 0, 0], ['a', 4, 1, 0], ['h', 5, 1, 1]];
    const acts = {}; const sc = { h: 0, a: 0 };
    seq.forEach(([s, k, g, me], i) => {
      if (g) sc[s]++;
      const h = sc.h, a = sc.a, f = 4 + i * 9;
      acts[f] = () => pg.evaluate(([s, k, g, me, h, a]) => { const u = window.__pso; u.mark(s, k, !!g, !!me); u.score(h, a); u.say(g ? 'GOL!' : 'KAÇTI!'); }, [s, k, g, me, h, a]);
    });
    acts[4 + seq.length * 9 + 4] = () => pg.evaluate(() => { const u = window.__pso; u.say('KAZANDIK!'); u.finish(true); });
    await record(pg, path.join(OUT, 'pso'), 3.6, acts);
    console.log('pso', pg.errs);
    await pg.close();
  }
  if (!ONLY || ONLY === 'phone') {
    const pg = await open(b, lang);
    await career(pg);
    await pg.evaluate(() => { Phone.show(); });
    await pg.clock.runFor(400);
    await record(pg, path.join(OUT, 'phone'), 2.8);
    console.log('phone', pg.errs);
    await pg.close();
  }
  await b.close();
})();
