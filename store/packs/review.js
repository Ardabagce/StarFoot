// Satın alma ürünlerinin App Store inceleme görselleri (1290x2796): node store/packs/review.js [coach]
// Oyunun gerçek satın alma penceresini, metadata.json'daki fiyatla gösterir. Yerel sunucu gerekir: python3 -m http.server 8765
const { chromium } = require('playwright');
const path = require('path');
const meta = require('../asc/metadata.json');
const ONLY = process.argv[2];
const ITEMS = { coach: 'starfoot_coach', wc: 'starfoot_wc', legends: 'starfoot_legends' };
(async () => {
  const b = await chromium.launch();
  for (const [k, id] of Object.entries(ITEMS)) {
    if (ONLY && ONLY !== k) continue;
    const pg = await b.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3 });
    await pg.goto('http://localhost:8765/oyna-r8k4tq.html');
    await pg.evaluate(() => { localStorage.clear(); localStorage.setItem('starfoot_lang', 'en'); localStorage.setItem('sf_v19', '1'); localStorage.setItem('starfoot_tut', 'done'); localStorage.setItem('starfoot_whatsnew', '99'); });
    await pg.reload(); await pg.waitForTimeout(900);
    await pg.evaluate(([k, price]) => {
      Premium.available = () => true;
      Packs.price[k] = { s: '$' + price, n: +price, c: 'USD' };
      Packs.offer(k);
    }, [k, meta.packs[id].price]);
    await pg.waitForTimeout(500);
    await pg.screenshot({ path: path.join(__dirname, `${k}-review.png`) });
    console.log(k, meta.packs[id].price);
    await pg.close();
  }
  await b.close();
})();
