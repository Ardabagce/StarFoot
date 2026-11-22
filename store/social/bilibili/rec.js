// Çince oynanabilir sahneleri otomatik oynayıp kaydeder; kazanılan çekimi saklar.
// node rec.js <sahne> <deneme>
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const D = __dirname;
const [sc, maxTry = '6'] = process.argv.slice(2);
const VW = 390, VH = 844;

async function take(i) {
  const b = await chromium.launch();
  const dir = path.join(D, 'raw', `${sc}-${i}`);
  fs.mkdirSync(dir, { recursive: true });
  const ctx = await b.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 2, hasTouch: false, recordVideo: { dir, size: { width: VW * 2, height: VH * 2 } } });
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('pageerror', (e) => errs.push(e.message));
  await pg.goto('file://' + path.join(D, 'rec', sc + '.html'));
  await pg.waitForTimeout(2600);
  const ballPos = () => pg.evaluate(() => { const d = MiniGame.dbg, cv = document.querySelector('canvas'), r = cv.getBoundingClientRect(); const v = d.view; return [(d.ball.x - v.x0) * d.PX / d.dpr + r.left, (d.ball.y - v.y0) * d.PX / d.dpr + r.top]; });
  const ended = () => pg.evaluate(() => (document.getElementById('end') ? document.querySelector('#end .h').innerText : ''));
  if (sc === 'penalty' || sc === 'freekick') {
    for (let k = 0; k < 3 && !(await ended()); k++) {
      await pg.waitForTimeout(700);
      const [bx, by] = await ballPos();
      const dx = sc === 'penalty' ? (Math.random() < 0.5 ? -38 : 38) : (Math.random() * 60 - 30);
      const dy = sc === 'penalty' ? 115 : 95 + Math.random() * 30;
      await pg.mouse.move(bx, by); await pg.mouse.down();
      await pg.mouse.move(bx + dx * 0.4, by + dy * 0.4, { steps: 8 });
      await pg.waitForTimeout(250);
      await pg.mouse.move(bx + dx, by + dy, { steps: 14 });
      await pg.waitForTimeout(450);
      await pg.mouse.up();
      await pg.waitForTimeout(7000);
    }
  } else if (sc === 'dribble') {
    const t0 = Date.now();
    let handled = null;
    while (!(await ended()) && Date.now() - t0 < 30000) {
      const st = await pg.evaluate(() => { const d = MiniGame._dd && MiniGame._dd(); return d ? { s: d.state, side: d.side, n: d.num, d: d.d } : null; });
      if (st && st.s === 'lunge' && handled !== st.n + ':' + st.d.toFixed(0)) {
        handled = st.n + ':' + st.d.toFixed(0);
        await pg.waitForTimeout(140 + Math.random() * 80);
        const dir = -st.side;
        await pg.mouse.click(dir < 0 ? VW * 0.18 : VW * 0.82, VH * 0.6);
      }
      await pg.waitForTimeout(40);
    }
  } else if (sc === 'shop') {
    await pg.waitForTimeout(600);
    for (const i of [0, 3, 5]) {
      const c = (await pg.$$('.sh-card'))[i];
      await c.scrollIntoViewIfNeeded(); await pg.waitForTimeout(500);
      await c.click(); await pg.waitForTimeout(1300);
    }
  }
  await pg.waitForTimeout(3500);
  const res = await ended();
  await ctx.close(); await b.close();
  const vid = fs.readdirSync(dir).find((f) => f.endsWith('.webm'));
  return { res, file: vid && path.join(dir, vid), errs };
}

(async () => {
  for (let i = 0; i < +maxTry; i++) {
    const r = await take(i);
    console.log(sc, i, JSON.stringify(r.res), r.errs.join('|') || 'ok');
    const win = { penalty: '冠军', freekick: '神级', dribble: '过掉', shop: '巨星' }[sc];
    if (r.res.includes(win)) { fs.copyFileSync(r.file, path.join(D, `${sc}.webm`)); console.log('KAZANDI ->', sc + '.webm'); return; }
  }
  console.log('kazanan çekim yok');
})();
