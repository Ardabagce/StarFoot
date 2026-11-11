// Reels 6 için oyun ekran görüntüleri (kupa vitrini, tören, transfer teklifleri): node store/social/motion/capture6.js <çıktı klasörü>
const path = require('path');
const fs = require('fs');
const { chromium, open } = require('../rec');
const OUT = path.resolve(process.argv[2] || path.join(__dirname, 'assets6'));
fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });
const shotPath = (n) => path.join(OUT, 'shots', n + '.jpg');

(async () => {
  const b = await chromium.launch();
  const pg = await open(b, 'tr', 11);
  await pg.clock.runFor(500);
  await pg.click('[data-new="0"]');
  await pg.fill('#cr-name', 'Emre'); await pg.fill('#cr-sur', 'Yıldız');
  await pg.selectOption('#cr-age', '17'); await pg.click('#cr-go'); await pg.clock.runFor(300); await pg.click('.modal-btns button');
  await pg.evaluate(() => {
    const s = Game.state; s.street.done = true;
    const big = Object.values(s.world.clubs).filter((c) => c.rating >= 80).sort((a, b) => b.rating - a.rating)[0];
    Game.joinClub(big.id, 9000000, 4);
    const p = Game.p; p.age = 26; p.position = 'FW'; Object.keys(p.stats).forEach((k) => (p.stats[k] = 90));
    p.energy = 100; p.morale = 90; p.fame = 92; p.money = 48e6; s.ap = 3; p.shirt = 10; s.news = [];
    Premium.active = true; Plus.active = true;
    const so = Social.ensure(p); so.posts = []; so.handle = '@emreyildiz10';
    const P = (k, t, b) => Social.post(k, t, b);
    P('daily', 'Antrenman bitti, şimdi dinlenme zamanı.', 1);
    P('family', 'Annem ve babamla pazar kahvaltısı. Her şey onlar sayesinde.', 1.4);
    P('couple', 'Bu akşam sadece ikimiz.', 1.3);
    P('team', 'Soyunma odasında galibiyet sevinci.', 1.2);
    P('coach', 'Hocamla yeni sezon planı üzerine konuştuk.', 1.1);
    P('goal', 'Hat-trick! Unutulmaz bir gece. Topu eve götürüyorum.', 2.2);
    P('trophy', 'Şampiyonuz! Bu kupa hepimizin.', 2.6);
    so.followers = 48200000; Social.cap = () => 1e9; so.following = 312;
    so.posts.forEach((x, i) => { x.likes = Math.round(so.followers * (0.04 + i * 0.006)); x.nc = Math.round(x.likes * 0.01); });
    document.querySelectorAll('#toasts > *').forEach((t) => t.remove());
    // piyasa değeri geçmişi: 17 yaştan 26 yaşa yükselen eğri
    const mv = []; let y = s.season.year - 9;
    for (let i = 0; i < 9 * 6; i++) { const k = i / 53; mv.push([y + Math.floor(i / 6), (i % 6) * 6, Math.round(400 + 179600 * Math.pow(k, 2.2) + Math.sin(i) * 1500 * k)]); }
    p.mv = mv; p.mvEv = [[y + 3, 12, 'Transfer'], [y + 5, 30, 'Şampiyonluk'], [y + 7, 18, 'Transfer'], [y + 8, 24, 'Hat-trick']];
    Game.marketValue = () => 180000000 * 42;
    const st = document.createElement('style'); st.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}'; document.head.appendChild(st);
  });
  await pg.clock.runFor(400);
  const errs = pg.errs;
  const shot = (n, el) => (el ? el.screenshot({ path: shotPath(n), type: 'jpeg', quality: 92 }) : pg.screenshot({ path: shotPath(n), type: 'jpeg', quality: 92 }));
  const close = () => pg.evaluate(() => { const m = document.getElementById('modal'); m.classList.add('hidden'); m.innerHTML = ''; });
  // kupa vitrini ve kariyer özeti
  await pg.evaluate(() => {
    const p = Game.p, y = Game.state.season.year;
    const L = ['Yıldızlar Ligi Şampiyonu', 'Altın Yıldız Ödülü', 'Şampiyonlar Kupası Şampiyonu', 'Gol Kralı (31)', 'Ülke Kupası Şampiyonu', 'Yılın Genç Oyuncusu', 'Yıldızlar Ligi Şampiyonu', 'Altın Yıldız Ödülü', 'Şampiyonlar Kupası Şampiyonu', 'Gol Kralı (28)', 'Süper Kupa Şampiyonu', 'Yıldızlar Ligi Şampiyonu'];
    p.trophies = L.map((t, i) => `${y - 9 + Math.floor(i * 0.8)}: ${t}`);
    Object.assign(p.totals, { apps: 412, goals: 318, assists: 141, motm: 96, ratingSum: 412 * 7.84 });
    p.intl.caps = 74; p.intl.goals = 41;
    p.best = { fee: 145000000 * 42, club: 'Real Madrigal' };
    Game.tab = 'profile'; UI.profView = 'career'; Game.render(); window.scrollTo(0, 0);
  });
  await pg.clock.runFor(600);
  await pg.evaluate(() => { const h = [...document.querySelectorAll('.card-h')].find((x) => /Kariyer Özeti/.test(x.textContent)); if (h) { h.closest('.card').scrollIntoView({ block: 'start' }); window.scrollBy(0, -110); } });
  await pg.clock.runFor(300);
  await shot('career_sum');
  const cab = await pg.$('.cabinet');
  if (cab) { await cab.evaluate((e) => { e.closest('section').scrollIntoView({ block: 'start' }); window.scrollBy(0, -110); }); await pg.clock.runFor(300); await shot('cabinet'); }
  // sezon sonu ödül töreni
  await pg.evaluate(() => {
    const s = Game.state, y = s.season.year;
    s.seasonEnd = { year: y, compName: (Game.league() && (Game.league().name || Game.league().n)) || 'İberya Ligi', pos: 1, trophies: [`Yıldızlar Ligi Şampiyonu`, `Altın Yıldız Ödülü`], cupWins: [`Şampiyonlar Kupası Şampiyonu`], changes: {}, stats: { apps: 38, goals: 34, assists: 15 }, avg: 8.12, ovrBefore: 90, ovrAfter: 91, msg: [], offers: [], prize: 0, mandatory: false, canRetire: false };
    SeasonEnd.show();
  });
  await pg.clock.runFor(2500);
  await shot('ceremony');
  await close();
  // transfer teklifleri
  await pg.evaluate(() => {
    const s = Game.state;
    s.offers = Game.makeOffers(3, false);
    s.offers.forEach((o, i) => { o.fee = ([165, 140, 120][i] || 100) * 1e6 * 42; o.feeType = 'fee'; o.wage = ([1.25, 1.1, 0.98][i] || 0.9) * 1e6 * 42; });
    Game.tab = 'home'; Game.render(); window.scrollTo(0, 0);
  });
  await pg.clock.runFor(600);
  const of = await pg.$('.offers');
  if (of) { await of.evaluate((e) => { e.closest('section').scrollIntoView({ block: 'start' }); window.scrollBy(0, -110); }); await pg.clock.runFor(300); await shot('offers'); }
  console.log('HATALAR', errs);
  await b.close();
})();
