// Google Play görsellerini üretir: node store/make.js  (Playwright gerekir)
const { chromium } = require('playwright');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const url = (p) => 'file://' + path.join(ROOT, p);
(async () => {
  const b = await chromium.launch();
  // 1) Maskable ikon (192 ve 512) ve mağaza ikonu (köşesiz kare 512)
  for (const [file, size, svg] of [['icons/icon-maskable-512.png', 512, 'icons/icon-maskable.svg'], ['icons/icon-maskable-192.png', 192, 'icons/icon-maskable.svg'], ['store/icon-512.png', 512, 'store/icon-square.svg']]) {
    const pg = await b.newPage({ viewport: { width: size, height: size } });
    await pg.goto(url(svg)); await pg.screenshot({ path: path.join(ROOT, file), omitBackground: false });
    await pg.close();
  }
  // 2) Öne çıkan görsel 1024x500 (TR ve EN): başlık sahnesi + logo + oyuncu
  for (const l of ['tr', 'en']) {
    const pg = await b.newPage({ viewport: { width: 1024, height: 500 } });
    await pg.goto(url('index.html'));
    await pg.evaluate((l) => { localStorage.setItem('starfoot_lang', l); }, l); await pg.reload();
    await pg.waitForTimeout(700);
    await pg.evaluate((l) => {
      document.querySelector('.title-card').style.display = 'none';
      document.getElementById('lang-sw').style.display = 'none';
      const txt = l === 'en'
        ? { sub: 'From academy kid to football legend', chips: ['Play the key moments', 'Leagues & cups worldwide', 'Fame, life & transfers'] }
        : { sub: 'Altyapıdan efsaneliğe futbol kariyeri', chips: ['Kritik anları sen oyna', 'Dünya ligleri ve kupalar', 'Şöhret, yaşam ve transfer'] };
      const d = document.createElement('div');
      d.setAttribute('data-noi18n', '');
      d.style.cssText = 'position:fixed;inset:0;z-index:50;display:flex;align-items:center;padding:0 56px;font-family:"Barlow Semi Condensed",sans-serif';
      d.innerHTML = `<div style="max-width:560px"><div class="title-logo" style="font-size:104px;line-height:.9">STAR<span>FOOT</span></div>
        <div style="color:#f3f1ea;font-size:32px;font-weight:600;margin:14px 0 22px;text-shadow:0 2px 12px rgba(0,0,0,.7)">${txt.sub}</div>
        <div style="display:flex;flex-wrap:wrap;gap:10px">${txt.chips.map((c) => `<span style="background:rgba(255,207,63,.16);border:1px solid rgba(255,207,63,.6);color:#ffcf3f;font-weight:700;font-size:19px;padding:7px 14px;border-radius:999px">${c}</span>`).join('')}</div></div>
        <canvas id="fg-pl" width="900" height="1000" style="position:absolute;right:30px;bottom:0;width:360px;height:400px"></canvas>`;
      document.body.appendChild(d);
      const c = document.getElementById('fg-pl').getContext('2d');
      const kits = Sprites.kits({ id: 'GAL', c1: '#c8102e', c2: '#ffcf3f' }, { id: 'B', c1: '#1d4ed8', c2: '#fff' });
      Sprites.figure(c, 330, 960, 640, { kit: kits.own, look: Sprites.look(11), facing: 'down', number: 10, run: 1.2, speed: 1 });
      Sprites.figure(c, 640, 900, 520, { kit: kits.opp, look: Sprites.look(4), facing: 'down', number: 4, run: 2.6, speed: 0.8 });
      if (Sprites.ball) Sprites.ball(c, 470, 950, 34);
    }, l);
    await pg.waitForTimeout(500);
    await pg.screenshot({ path: path.join(ROOT, `store/feature-graphic-${l}.png`) });
    await pg.close();
  }
  // 3) Telefon ekran görüntüleri 1080x1920 (TR ve EN)
  for (const l of ['tr', 'en']) {
    const pg = await b.newPage({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
    const errs = []; pg.on('pageerror', (e) => errs.push(e.message));
    await pg.goto(url('index.html'));
    await pg.evaluate((l) => { localStorage.clear(); localStorage.setItem('starfoot_lang', l); }, l); await pg.reload();
    await pg.waitForTimeout(500);
    const shot = async (n) => { await pg.waitForTimeout(400); await pg.screenshot({ path: path.join(ROOT, `store/screens/${l}-${n}.png`) }); };
    await shot('1-title');
    await pg.click('[data-new="0"]'); await pg.fill('#cr-name', l === 'en' ? 'Alex' : 'Emre').catch(() => {}); await pg.fill('#cr-sur', l === 'en' ? 'Stone' : 'Yıldız').catch(() => {});
    await pg.selectOption('#cr-age', '17'); await pg.click('#cr-go'); await pg.click('.modal-btns button');
    await pg.evaluate(() => {
      if (Game.state.street) Game.state.street.done = true; Game.joinClub('GAL', 90000, 3); const p = Game.p; p.age = 22;
      Object.keys(p.stats).forEach((k) => (p.stats[k] = 78 + Math.round(Math.random() * 10)));
      p.money = 2.4e6; p.social.followers = 1.8e6; p.totals.goals = 64; p.totals.apps = 120; p.totals.assists = 31;
      Game.state.ap = 3; Game.tab = 'home'; Game.render(); window.scrollTo(0, 0);
    });
    await shot('2-home');
    await pg.evaluate(() => { Game.tab = 'league'; UI.lgView = 'table'; Game.render(); window.scrollTo(0, 0); }); await shot('3-league');
    await pg.evaluate(() => { Game.tab = 'life'; UI.lifeView = 'life'; Game.render(); window.scrollTo(0, 0); }); await shot('4-life');
    await pg.evaluate(() => { Game.tab = 'profile'; UI.profView = 'profile'; Game.render(); window.scrollTo(0, 0); }); await shot('5-profile');
    await pg.evaluate(() => { Game.state.pendingEvent = null; Game.state.pendingGift = null; Game.p.energy = 100; Game.state.ap = 0; Game.playNext(); });
    await pg.waitForSelector('#mt-sim', { timeout: 15000 }).catch(() => {});
    await pg.waitForTimeout(2500); await shot('6-match');
    console.log(l, errs);
    await pg.close();
  }
  await b.close();
})();
