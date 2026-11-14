// Hikâye serisi: çocuk oyuncunun altyapı maçı (maç akışı ve kritik an), yüksek çözünürlük.
const { chromium } = require('playwright');
const path = require('path');
const OUT = path.join(__dirname, 'assets8', 'shots');
const shot = (pg, n) => pg.screenshot({ path: path.join(OUT, n + '.jpg'), type: 'jpeg', quality: 92 });
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 3 });
  await pg.goto('http://localhost:8765/oyna-r8k4tq.html');
  await pg.evaluate(() => { localStorage.clear(); localStorage.setItem('sf_v19', '1'); localStorage.setItem('starfoot_lang', 'tr'); localStorage.setItem('starfoot_tut', 'done'); localStorage.setItem('starfoot_whatsnew', '99'); });
  await pg.reload(); await pg.waitForTimeout(900);
  await pg.evaluate(() => Create.open()); await pg.waitForTimeout(300);
  await pg.fill('#cr-name', 'Emir'); await pg.selectOption('#cr-age', '9');
  await pg.click('#cr-go'); await pg.waitForTimeout(1000);
  await pg.evaluate(() => { const m = document.getElementById('modal'); m.classList.add('hidden'); m.innerHTML = ''; const s = Game.state; s.street.done = true; const id = Object.keys(s.world.clubs).find((k) => s.world.clubs[k].league === 'TR1'); s.clubId = id; s.contract = { type: 'youth', clubId: id, wage: 0, years: 0 }; delete s.world.clubs.STREET; s.youth = Youth.create(s.world, id, s.player.age); Game.render(); });
  await pg.waitForTimeout(500);
  pg.evaluate(() => Game.playNext()).catch(() => {});
  let gm = false, n = 0;
  for (let i = 0; i < 120 && n < 2; i++) {
    await pg.waitForTimeout(400);
    const st = await pg.evaluate(() => { const m = document.getElementById('modal'); if (!m.classList.contains('hidden')) { const bb = m.querySelector('.modal-btns button:last-child'); if (bb) bb.click(); return 'modal'; } if (document.querySelector('.mg canvas')) return 'mg'; const mt = document.getElementById('match'); return mt && !mt.classList.contains('hidden') ? 'match' : 'x'; });
    if (st === 'match' && !gm && i > 6) { await shot(pg, 'e_kid_match'); gm = true; }
    if (st === 'mg') {
      await pg.waitForTimeout(900); await shot(pg, n ? 'e_kid_mg2' : 'e_kid_mg'); n++;
      const r = await pg.evaluate(() => { const d = MiniGame.dbg, cv = document.querySelector('.mg canvas'); if (!d || !cv) return null; const rc = cv.getBoundingClientRect(); return { x: rc.left + ((d.ball.x - d.view.x0) * d.PX) / d.dpr, y: rc.top + ((d.ball.y - d.view.y0) * d.PX) / d.dpr }; });
      if (r) { await pg.mouse.move(r.x, r.y); await pg.mouse.down(); for (let k = 1; k <= 6; k++) await pg.mouse.move(r.x, r.y + 24 * k); await pg.mouse.up(); await pg.waitForTimeout(2600); }
    }
  }
  console.log('ok', gm, n);
  await b.close();
})();
