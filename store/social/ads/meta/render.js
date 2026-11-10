const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const v of ['mgr', 'pen']) for (const f of ['feed', 'story']) {
    const pg = await b.newPage({ viewport: { width: 1080, height: f === 'story' ? 1920 : 1350 } });
    await pg.goto(`http://localhost:8766/ad.html?v=${v}&f=${f}`); await pg.waitForLoadState('networkidle'); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(800);
    await pg.screenshot({ path: `${v}_${f}.jpg`, type: 'jpeg', quality: 90 }); await pg.close();
  }
  await b.close();
})();
