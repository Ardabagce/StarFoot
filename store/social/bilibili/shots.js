const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const out = __dirname + '/shots';
  require('fs').mkdirSync(out, { recursive: true });
  for (const sc of ['zh']) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
    const pg = await ctx.newPage();
    const errs = []; pg.on('pageerror', (e) => errs.push(e.message));
    await pg.goto(`http://127.0.0.1:8766/game.html#t-${sc}`);
    await pg.waitForTimeout(5000);
    await pg.evaluate(() => document.querySelectorAll('.upd-hint').forEach((x) => x.remove()));
    await pg.evaluate(() => { localStorage.setItem('starfoot_cur', 'USD'); const p = Game.p; p.name = 'Wei'; p.surname = 'Zhang'; p.money = 2.4e6 / 42; Game.save(); });
    const tabs = ['home', 'league', 'squad', 'profile'];
    for (const t of tabs) {
      await pg.evaluate((t) => { Game.tab = t; Game.render(); }, t);
      await pg.waitForTimeout(1200);
      await pg.evaluate(() => document.querySelectorAll('.upd-hint').forEach((x) => x.remove()));
      await pg.screenshot({ path: `${out}/${sc}-${t}.png` });
    }
    console.log(sc, errs.join('|') || 'ok');
    await ctx.close();
  }
  await b.close();
})();
