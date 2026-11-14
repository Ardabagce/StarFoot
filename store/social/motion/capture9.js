// Hikâye serisi ("8 yaşındaki çocuk") için oyun ekranları: hoş geldin, mahalle maçı, kritik an, scout raporu, altyapı, sınav.
// Kullanım: (oyun sunucusu localhost:8765'te açıkken) node store/social/motion/capture9.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const OUT = path.join(__dirname, 'assets8', 'shots');
fs.mkdirSync(OUT, { recursive: true });
const shot = (pg, n) => pg.screenshot({ path: path.join(OUT, n + '.jpg'), type: 'jpeg', quality: 92 });

(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 3 });
  const errs = []; pg.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));
  await pg.goto('http://localhost:8765/oyna-r8k4tq.html');
  await pg.evaluate(() => { localStorage.clear(); localStorage.setItem('sf_v19', '1'); localStorage.setItem('starfoot_lang', 'tr'); localStorage.setItem('starfoot_tut', 'done'); localStorage.setItem('starfoot_whatsnew', '99'); localStorage.setItem('starfoot_diamond', '1'); });
  await pg.reload(); await pg.waitForTimeout(900);
  await pg.evaluate(() => Create.open()); await pg.waitForTimeout(300);
  await pg.fill('#cr-name', 'Emir'); await pg.selectOption('#cr-age', '8');
  await pg.click('#cr-go'); await pg.waitForTimeout(1200);
  await shot(pg, 'e_welcome');
  await pg.evaluate(() => { const m = document.getElementById('modal'); m.classList.add('hidden'); m.innerHTML = ''; });
  await pg.waitForTimeout(300);
  await shot(pg, 'e_street_hub');
  // mahalle maçı: maç ekranı, kritik an, ardından scout raporu
  pg.evaluate(() => Game.playNext()).catch(() => {});
  let gotMatch = false, gotMg = 0, gotScout = false;
  for (let i = 0; i < 160 && !gotScout; i++) {
    await pg.waitForTimeout(400);
    const st = await pg.evaluate(() => {
      const m = document.getElementById('modal');
      if (!m.classList.contains('hidden')) {
        const tag = (m.querySelector('.ev-tag') || {}).textContent || '';
        if (/Scout raporu|Seçme raporu/.test(tag)) return 'scout';
        const bb = m.querySelector('.modal-btns button:last-child'); if (bb) bb.click(); return 'modal';
      }
      if (document.querySelector('.mg canvas')) return 'mg';
      const mt = document.getElementById('match');
      return mt && !mt.classList.contains('hidden') ? 'match' : 'x';
    });
    if (st === 'match' && !gotMatch && i > 3) { await shot(pg, 'e_street_match'); gotMatch = true; }
    if (st === 'mg') {
      if (!gotMg) { await pg.waitForTimeout(900); await shot(pg, 'e_street_mg'); }
      gotMg++;
      // vuruşu yap: topu geri çekip bırak
      const r = await pg.evaluate(() => { const d = MiniGame.dbg, cv = document.querySelector('.mg canvas'); if (!d || !cv) return null; const rc = cv.getBoundingClientRect(); return { x: rc.left + ((d.ball.x - d.view.x0) * d.PX) / d.dpr, y: rc.top + ((d.ball.y - d.view.y0) * d.PX) / d.dpr }; });
      if (r) { await pg.mouse.move(r.x, r.y); await pg.mouse.down(); for (let k = 1; k <= 6; k++) await pg.mouse.move(r.x + (Math.random() - 0.5) * 30, r.y + 22 * k); await pg.mouse.up(); await pg.waitForTimeout(2500); }
    }
    if (st === 'scout') { await pg.waitForTimeout(500); await shot(pg, 'e_scout'); gotScout = true; }
  }
  // altyapıya geç (teklifi kabul et) ve okul sınavı
  await pg.evaluate(() => { const m = document.getElementById('modal'); const bb = m.querySelector('[data-club], .modal-btns .btn-big, .modal-btns button:last-child'); if (bb) bb.click(); });
  await pg.waitForTimeout(1200);
  for (let i = 0; i < 6; i++) { const open = await pg.evaluate(() => { const m = document.getElementById('modal'); if (m.classList.contains('hidden')) return false; const bb = m.querySelector('.modal-btns button:last-child'); if (bb) bb.click(); else m.classList.add('hidden'); return true; }); if (!open) break; await pg.waitForTimeout(500); }
  await shot(pg, 'e_academy_hub');
  await pg.evaluate(() => { try { School.exam('mid'); } catch (e) { console.log(e); } }); await pg.waitForTimeout(800);
  await shot(pg, 'e_exam');
  // scout raporu (iyi geçen mahalle maçının sonucu) ve altyapıya giriş: yeni kariyerde doğrudan
  const p2 = await b.newPage({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 3 });
  await p2.goto('http://localhost:8765/oyna-r8k4tq.html');
  await p2.evaluate(() => { localStorage.clear(); localStorage.setItem('sf_v19', '1'); localStorage.setItem('starfoot_lang', 'tr'); localStorage.setItem('starfoot_tut', 'done'); localStorage.setItem('starfoot_whatsnew', '99'); });
  await p2.reload(); await p2.waitForTimeout(900);
  await p2.evaluate(() => Create.open()); await p2.waitForTimeout(300);
  await p2.fill('#cr-name', 'Emir'); await p2.selectOption('#cr-age', '8');
  await p2.click('#cr-go'); await p2.waitForTimeout(1200);
  await p2.evaluate(() => { const m = document.getElementById('modal'); m.classList.add('hidden'); m.innerHTML = ''; Game.scoutOffers(8.6, 8.6); });
  await p2.waitForTimeout(900);
  await shot(p2, 'e_scout');
  await p2.evaluate(() => { const m = document.getElementById('modal'); const bb = m.querySelector('[data-club], [data-offer], .offer, .modal-btns .btn-big'); if (bb) bb.click(); });
  await p2.waitForTimeout(1200);
  for (let i = 0; i < 6; i++) { const open = await p2.evaluate(() => { const m = document.getElementById('modal'); if (m.classList.contains('hidden')) return false; const bb = m.querySelector('.modal-btns button:last-child'); if (bb) bb.click(); else m.classList.add('hidden'); return true; }); if (!open) break; await p2.waitForTimeout(500); }
  await shot(p2, 'e_academy_hub');
  console.log('ok', { gotMatch, gotMg, gotScout }, errs);
  await b.close();
})();
