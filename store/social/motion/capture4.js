// Reels 4 için oyun ekran görüntüleri: node store/social/motion/capture4.js <çıktı klasörü>
const path = require('path');
const fs = require('fs');
const { chromium, open } = require('../rec');
const OUT = path.resolve(process.argv[2] || path.join(__dirname, 'assets4'));
fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });
const shotPath = (n) => path.join(OUT, 'shots', n + '.png');

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
    Game.marketValue = () => 180000000;
    const st = document.createElement('style'); st.textContent = '*,*::before,*::after{animation:none!important;transition:none!important}'; document.head.appendChild(st);
  });
  await pg.clock.runFor(400);
  const errs = pg.errs;
  // 1) profil (StarFeed) tam sayfa
  await pg.evaluate(() => { Game.tab = 'profile'; Game.render(); window.scrollTo(0, 0); });
  await pg.clock.runFor(600);
  await pg.screenshot({ path: shotPath('profile_full'), fullPage: true });
  const ig = await pg.$('.card.ig');
  if (ig) await ig.screenshot({ path: shotPath('starfeed') });
  // 2) gönderi penceresi (aile)
  await pg.evaluate(() => { const x = Game.p.social.posts.find((q) => q.kind === 'family'); Social.open(x.id); });
  await pg.clock.runFor(500);
  await pg.screenshot({ path: shotPath('post_family') });
  await pg.evaluate(() => { const m = document.getElementById('modal'); m.classList.add('hidden'); m.innerHTML = ''; });
  await pg.evaluate(() => { const x = Game.p.social.posts.find((q) => q.kind === 'trophy'); Social.open(x.id); });
  await pg.clock.runFor(500);
  await pg.screenshot({ path: shotPath('post_trophy') });
  await pg.evaluate(() => { const m = document.getElementById('modal'); m.classList.add('hidden'); m.innerHTML = ''; });
  // 3) StarDeğer
  for (const t of ['val', 'top', 'buzz']) {
    await pg.evaluate((t) => { try { Market.open(t); } catch (e) { console.error(e.message); } }, t);
    await pg.clock.runFor(600);
    await pg.screenshot({ path: shotPath('mv_' + t) });
    await pg.evaluate(() => { const m = document.getElementById('modal'); m.classList.add('hidden'); m.innerHTML = ''; });
  }
  // 4) Starpedia
  await pg.evaluate(() => { try { Star.wiki(); } catch (e) { console.error(e.message); } });
  await pg.clock.runFor(800);
  await pg.screenshot({ path: shotPath('wiki') });
  await pg.evaluate(() => { Star.wikiClose(true); const m = document.getElementById('modal'); m.classList.add('hidden'); m.innerHTML = ''; });
  // 5) Maç sonu röportajı
  await pg.evaluate(() => {
    const c = Game.club(); const opp = Object.values(Game.state.world.clubs).find((x) => x.id !== c.id && x.rating >= 78);
    window.__iv = Interview.show({ played: true, res: 'W', gf: 3, ga: 1, goals: 3, assists: 0, rating: 9.4, goalMins: [12, 58, 89], motm: true }, { side: 'home', home: c, away: opp, derby: 'Derbi' });
  });
  await pg.clock.runFor(1500);
  await pg.screenshot({ path: shotPath('iv_q1') });
  // cevap seç
  const a = await pg.$('.iv-opts button');
  if (a) { await a.click(); await pg.clock.runFor(900); await pg.screenshot({ path: shotPath('iv_q2') }); }
  console.log('HATALAR', errs);
  await b.close();
})();
