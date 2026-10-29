// Logo konseptlerini PNG olarak çıkarır: node render.js <çıktı klasörü>
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
(async () => {
  const out = process.argv[2] || path.join(__dirname, 'out');
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const pg = await b.newPage({ viewport: { width: 1024, height: 1024 } });
  const errs = []; pg.on('pageerror', (e) => errs.push(e.message));
  await pg.goto('file://' + path.join(__dirname, 'logo.html'));
  await pg.evaluate(() => window.ready());
  const ids = await pg.evaluate(() => window.CONCEPTS);
  for (const id of ids) {
    const data = await pg.evaluate((id) => { window.draw(id); return document.getElementById('cv').toDataURL('image/png'); }, id);
    fs.writeFileSync(path.join(out, id + '.png'), Buffer.from(data.split(',')[1], 'base64'));
    console.log('•', id);
  }
  if (errs.length) console.log('HATALAR', errs);
  await b.close();
})();
