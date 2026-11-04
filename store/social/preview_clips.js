// App Store tanıtım videosu için ek sahneler: kaleci kurtarışı, Instagram profili, Starpedia
// Kullanım: PREVIEW=1 node store/social/preview_clips.js <dil> <klasör> [gk|ig|wiki]
const { chromium, open, record } = require('./rec');
const path = require('path');
const lang = process.argv[2] || 'tr';
const OUT = process.argv[3] || path.join(__dirname, 'work', 'pv-' + lang);
const ONLY = process.argv[4] || '';
const SIDE = +(process.env.SIDE || 0.5); // kaleci: dokunulacak yatay konum (0-1)
const TAP = +(process.env.TAP || 40);   // kaleci: dokunma karesi

async function career(pg, pos) {
  await pg.clock.runFor(500);
  await pg.evaluate(() => { window.SF_PLUS_PREVIEW = true; window.SF_PREVIEW = true; });
  await pg.click('[data-new="0"]');
  await pg.fill('#cr-name', lang === 'en' ? 'Alex' : 'Emre'); await pg.fill('#cr-sur', lang === 'en' ? 'Stone' : 'Yıldız');
  await pg.selectOption('#cr-age', '17'); await pg.click('#cr-go'); await pg.clock.runFor(300); await pg.click('.modal-btns button');
  await pg.evaluate(([pos]) => {
    const s = Game.state; s.street.done = true; Game.joinClub('RMA', 385000, 4);
    const p = Game.p; p.age = 24; p.position = pos; Object.keys(p.stats).forEach((k) => (p.stats[k] = 95));
    p.energy = 100; p.morale = 90; p.money = 8.6e6; p.fame = 92; s.ap = 3; p.shirt = pos === 'GK' ? 1 : 10; p.totals.goals = pos === 'GK' ? 0 : 214;
    Premium.active = true; localStorage.setItem('starfoot_tut', 'done');
  }, [pos]);
}

(async () => {
  const b = await chromium.launch();
  if (!ONLY || ONLY === 'gk') {
    const pg = await open(b, lang);
    await career(pg, 'GK');
    await pg.evaluate(() => { if (typeof Press !== 'undefined') Press.ask = () => Promise.resolve(); Object.keys(MOMENT_WEIGHTS.GK).forEach((k) => (MOMENT_WEIGHTS.GK[k] = k === 'gk_save' ? 1 : 0)); Game.roleFor = () => 'starter'; Game.state.ap = 0; Game.playNext(); });
    for (let i = 0; i < 400; i++) {
      await pg.clock.runFor(250);
      const st = await pg.evaluate(() => { const ht = document.querySelector('[data-ht]'); if (ht) { ht.click(); return 'ht'; } const m = document.getElementById('mt-moment'); return m && !m.classList.contains('hidden') && m.querySelector('canvas') ? 'mom' : ''; });
      if (st === 'mom') break;
    }
    console.log('dbg', await pg.evaluate(() => ({ pos: Game.p.position, plus: Plus.has(), match: !document.getElementById('match').classList.contains('hidden'), mom: (document.getElementById('mt-moment') || {}).className, txt: (document.getElementById('match') || {}).innerText.slice(0, 200), modal: document.getElementById('modal').innerText.slice(0, 120) })));
    const box = await pg.evaluate(() => { const c = document.querySelector('#mt-moment canvas'); const r = c.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; });
    const acts = {};
    acts[TAP] = async () => { await pg.mouse.click(box[0] + box[2] * SIDE, box[1] + box[3] * 0.4); };
    await record(pg, path.join(OUT, 'gk'), 5.5, acts);
    console.log('gk', pg.errs);
    await pg.close();
  }
  if (!ONLY || ONLY === 'ig' || ONLY === 'wiki') {
    const pg = await open(b, lang);
    await career(pg, 'FW');
    await pg.evaluate((en) => {
      const p = Game.p; const so = Social.ensure(p); so.followers = 1204;
      const T = en ? ['Hat-trick in the derby!', 'New chapter. New shirt.', 'CHAMPIONS!', 'Matchday.', 'Thank you fans!', 'Golden Ball night.', 'Training hard.', 'Captain.', 'Back home.'] : ['Derbide hat-trick!', 'Yeni sayfa, yeni forma.', 'ŞAMPİYON!', 'Maç günü.', 'Teşekkürler taraftar!', 'Altın Top gecesi.', 'Antrenman.', 'Kaptan.', 'Memleket.'];
      const K = ['goal', 'transfer', 'trophy', 'daily', 'goal', 'trophy', 'daily', 'goal', 'daily'];
      for (let i = 8; i >= 0; i--) Social.post(K[i], T[i], 3);
      so.followers = 1204; Game.tab = 'profile'; Game.render();
    }, lang === 'en');
    if (!ONLY || ONLY === 'ig') {
      // Instagram bölümüne kay, takipçi sayısı hızla artar
      const y = await pg.evaluate(() => { const e = document.querySelector('.ig-tabs') || document.querySelector('.ig-grid'); const h = e && e.closest('section'); return h ? h.getBoundingClientRect().top + window.scrollY - 10 : 0; });
      const acts = {};
      for (let i = 0; i < 105; i++) acts[i] = () => pg.evaluate(([i, y]) => {
        window.scrollTo(0, Math.round(y * Math.min(1, i / 20)));
        const so = Game.p.social, k = Math.min(1, Math.max(0, (i - 25) / 60));
        so.followers = Math.round(1204 * Math.pow(10400000 / 1204, k * k * (3 - 2 * k)));
        if (i % 3 === 0) { const sy = window.scrollY; Game.render(); window.scrollTo(0, sy); }
      }, [i, y]);
      await record(pg, path.join(OUT, 'ig'), 3.5, acts);
    }
    if (!ONLY || ONLY === 'wiki') {
      await pg.evaluate(() => { window.scrollTo(0, 0); const p = Game.p; p.totals.goals = 612; p.totals.assists = 248; p.ballon = 5; Star.wiki(); });
      await pg.clock.runFor(400);
      const acts = {};
      for (let i = 0; i < 105; i++) acts[i] = () => pg.evaluate((i) => { const m = document.querySelector('#modal .modal-card, #modal .card, #modal > div'); const el = document.querySelector('#modal'); const sc = [...document.querySelectorAll('#modal *')].find((e) => e.scrollHeight > e.clientHeight + 40) || el; sc.scrollTop = Math.max(0, i - 20) * 9; }, i);
      await record(pg, path.join(OUT, 'wiki'), 3.5, acts);
    }
    console.log('ig/wiki', pg.errs);
    await pg.close();
  }
  await b.close();
})();
