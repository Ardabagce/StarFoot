// Tanıtım videosu için oyundan sahne kayıtları (kare kare, 1080x1920, 30 fps)
// Kullanım: node store/social/clips.js tr /cikti/klasoru
const { chromium, open, record } = require('./rec');
const path = require('path');
const lang = process.argv[2] || 'tr';
const OUT = process.argv[3] || path.join(__dirname, 'work', lang);
const hideFoot = () => { const st = document.createElement('style'); st.textContent = '.ct-foot{display:none!important}'; document.head.appendChild(st); };

async function career(pg) {
  await pg.clock.runFor(500);
  await pg.click('[data-new="0"]');
  await pg.fill('#cr-name', lang === 'en' ? 'Alex' : 'Emre'); await pg.fill('#cr-sur', lang === 'en' ? 'Stone' : 'Yıldız');
  await pg.selectOption('#cr-age', '17'); await pg.click('#cr-go'); await pg.clock.runFor(300); await pg.click('.modal-btns button');
  await pg.evaluate(() => {
    const s = Game.state; s.street.done = true; Game.joinClub('GAL', 185000, 4);
    const p = Game.p; p.age = 24; p.position = 'FW'; Object.keys(p.stats).forEach((k) => (p.stats[k] = 95));
    p.energy = 100; p.morale = 90; p.money = 8.6e6; p.fame = 55; s.ap = 3; p.celeb = 'siu'; p.totals.goals = 80; p.shirt = 10;
  });
}

(async () => {
  const b = await chromium.launch();

  // Altın Top töreni (kısa videolar için). "node clips.js tr <klasör> ballon" yalnız bunu kaydeder.
  {
    const pg = await open(b, lang);
    await career(pg);
    await pg.evaluate(hideFoot);
    await record(pg, path.join(OUT, 'ballon'), 3.6, { 0: () => pg.evaluate((en) => { const c = Game.club(); Celebrate.trophy({ big: en ? 'BALLON D\'OR!' : 'ALTIN TOP!', title: '', sub: '', c1: '#b8860b', c2: '#ffe08a', short: c.short, kit: Sprites.kit(c, false), number: 10 }); }, lang === 'en') });
    await pg.close();
    if (process.argv[4] === 'ballon') { await b.close(); return; }
  }

  // 1) Maç anı: şut, gol ve oyundaki gol sevinci (sabit tohum; nişan noktaları bu tohuma göre)
  {
    const pg = await open(b, lang);
    await career(pg);
    await pg.evaluate(() => { if (typeof Press !== 'undefined') Press.ask = () => Promise.resolve(); Object.keys(MOMENT_WEIGHTS.FW).forEach((k) => (MOMENT_WEIGHTS.FW[k] = k === 'open' ? 1 : 0)); Game.roleFor = () => 'starter'; Game.state.ap = 0; Game.playNext(); });
    for (let i = 0; i < 400; i++) {
      await pg.clock.runFor(250);
      const st = await pg.evaluate(() => { const ht = document.querySelector('[data-ht]'); if (ht) { ht.click(); return 'ht'; } const m = document.getElementById('mt-moment'); return m && !m.classList.contains('hidden') && m.querySelector('.mg-canvas') ? 'mom' : ''; });
      if (st === 'mom') break;
    }
    await pg.clock.runFor(300);
    const acts = {}, x0 = 225, y0 = 480, dx = -10, dy = 140;
    acts[14] = async () => { await pg.mouse.move(x0, y0); await pg.mouse.down(); };
    for (let k = 1; k <= 12; k++) acts[14 + k] = async () => { await pg.mouse.move(x0 + dx * k / 12, y0 + dy * k / 12); };
    acts[30] = async () => { await pg.mouse.up(); };
    await record(pg, path.join(OUT, 'moment'), 6.5, acts);
    console.log('moment', await pg.evaluate(() => (document.getElementById('mt-hs') || {}).innerText + '-' + (document.getElementById('mt-as') || {}).innerText), pg.errs);
    await pg.close();
  }

  const pg = await open(b, lang);
  await career(pg);
  await pg.evaluate(hideFoot);

  // 3) Şampiyonlar Kupası maç günü (ana ekran, yavaş kaydırma)
  await pg.evaluate(() => {
    const s = Game.state; Cups.setup(s);
    if (!s.cups.ucl.teams.includes(s.clubId)) { s.cups.ucl.teams[0] = s.clubId; }
    s.pendingCup = 'ucl'; Game.tab = 'home'; Game.render(); window.scrollTo(0, 0);
    document.querySelectorAll('.toast, #toasts > *').forEach((t) => t.remove());
  });
  const scrollActs = {};
  for (let i = 0; i < 75; i++) scrollActs[i] = () => pg.evaluate((y) => window.scrollTo(0, y), Math.round(Math.max(0, i - 15) * 3.2));
  await record(pg, path.join(OUT, 'matchday'), 2.5, scrollActs);

  // 4-5) Havalimanı karşılaması ve imza töreni
  await pg.evaluate(() => { window.scrollTo(0, 0); Welcome.show({ club: Game.club(), wage: 185000, years: 4, feeText: 'Bonservis ₺45,0 Mn', number: 10 }); });
  await record(pg, path.join(OUT, 'airport'), 4.2);
  await pg.evaluate(() => document.querySelector('.wel .ct-foot button').click());
  await record(pg, path.join(OUT, 'signing'), 3.4, { 3: () => pg.evaluate(() => document.querySelector('.wel .ct-foot button').click()) });
  await pg.evaluate(() => document.querySelectorAll('.wel').forEach((e) => e.remove()));

  // 6) Kupa töreni
  await record(pg, path.join(OUT, 'trophy'), 3.4, { 0: () => pg.evaluate((en) => { const c = Game.club(); Celebrate.trophy({ big: en ? 'CHAMPIONS!' : 'ŞAMPİYON!', title: '', sub: '', c1: c.c1, c2: c.c2, short: c.short, kit: Sprites.kit(c, false), number: 10 }); }, lang === 'en') });
  console.log('clips', pg.errs);
  await b.close();
})();
