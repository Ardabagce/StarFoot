// Reels 8 için oyun ekranları (Türkçe): altyapı, maç, kritik an, okul ikilemi, hızlı ilerle, Altın Yıldız töreni.
// Kullanım: (oyun sunucusu localhost:8765'te açıkken) node store/social/motion/capture8.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const OUT = path.join(__dirname, 'assets8', 'shots');
fs.mkdirSync(OUT, { recursive: true });
const shot = (pg, n) => pg.screenshot({ path: path.join(OUT, n + '.jpg'), type: 'jpeg', quality: 92 });
const hide = (pg) => pg.evaluate(() => { const m = document.getElementById('modal'); m.classList.add('hidden'); m.innerHTML = ''; });

async function career(b, age, fast) {
  const pg = await b.newPage({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 3 });
  await pg.goto('http://localhost:8765/oyna-r8k4tq.html');
  await pg.evaluate(() => { localStorage.clear(); localStorage.setItem('sf_v19', '1'); localStorage.setItem('starfoot_lang', 'tr'); localStorage.setItem('starfoot_tut', 'done'); localStorage.setItem('starfoot_whatsnew', '99'); localStorage.setItem('starfoot_diamond', '1'); });
  await pg.reload(); await pg.waitForTimeout(900);
  await pg.evaluate(() => Create.open()); await pg.waitForTimeout(300);
  await pg.fill('#cr-name', 'Emir'); await pg.selectOption('#cr-age', String(age));
  if (fast) await pg.check('#cr-fast').catch(() => {});
  await pg.click('#cr-go'); await pg.waitForTimeout(1000);
  await pg.evaluate(() => { const m = document.getElementById('modal'); m.classList.add('hidden'); m.innerHTML = ''; const s = Game.state; s.street.done = true; const id = Object.keys(s.world.clubs).find((k) => s.world.clubs[k].league === 'TR1'); s.clubId = id; s.contract = { type: 'youth', clubId: id, wage: 0, years: 0 }; delete s.world.clubs.STREET; s.youth = Youth.create(s.world, id, s.player.age); Game.render(); });
  await pg.waitForTimeout(500);
  return pg;
}

(async () => {
  const b = await chromium.launch();
  // 1) çocuk altyapı + okul ikilemi
  let pg = await career(b, 10, true);
  await shot(pg, 'kid_hub');
  await pg.evaluate(() => School.lesson()); await pg.waitForTimeout(500);
  await shot(pg, 'dilemma');
  await hide(pg); await pg.close();
  // 2) 17 yaş: maç akışı ve kritik an
  pg = await career(b, 17, false);
  await shot(pg, 'hub17');
  pg.evaluate(() => Game.playNext()).catch(() => {});
  let gotMatch = false;
  for (let i = 0; i < 60; i++) {
    await pg.waitForTimeout(500);
    const st = await pg.evaluate(() => { const m = document.getElementById('modal'); if (!m.classList.contains('hidden')) { const bb = m.querySelector('.modal-btns button:last-child'); if (bb) bb.click(); return 'modal'; } const cv = document.querySelector('.mg canvas'); return cv ? 'mg' : (document.getElementById('match') && !document.getElementById('match').classList.contains('hidden') ? 'match' : 'x'); });
    if (st === 'match' && !gotMatch && i > 4) { await shot(pg, 'match17'); gotMatch = true; }
    if (st === 'mg') { await pg.waitForTimeout(900); await shot(pg, 'moment17'); break; }
  }
  await pg.close();
  // 3) hızlı ilerle ve Altın Yıldız töreni
  pg = await career(b, 17, false);
  await pg.evaluate(() => FF.open()); await pg.waitForTimeout(600);
  await shot(pg, 'ff');
  await hide(pg);
  pg.evaluate(() => { const p = Game.p, c = Game.club(); return Celebrate.trophy({ big: 'ALTIN YILDIZ!', title: '2031 Altın Yıldız', sub: 'Dünyanın en iyi futbolcusu', c1: c.c1, c2: c.c2, short: c.short, kit: Sprites.kit(c, false), number: p.shirt, year: Player.fullName(p) }); }).catch(() => {});
  await pg.waitForTimeout(2600);
  await shot(pg, 'gstar');
  await pg.close();
  await b.close();
  console.log('ok', fs.readdirSync(OUT));
})();
