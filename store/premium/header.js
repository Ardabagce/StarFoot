// App Store ürün sayfası başlığı (21:9, 3840x1646) ve arama sonucu görseli (3:2, 1920x1280): görsel + döngülü video
// Kullanım: node store/premium/header.js
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { chromium, open, record } = require('../social/rec');
const OUT = path.join(__dirname, 'header');
const TMP = path.join(OUT, '_frames');
fs.mkdirSync(OUT, { recursive: true });
const T = { tr: { big: 'SOKAKTAN EFSANEYE', sub: 'STARFOOT · FUTBOL KARİYERİ' }, en: { big: 'FROM STREETS TO LEGEND', sub: 'STARFOOT · FOOTBALL CAREER' } };
const SIZES = [
  { id: 'header', w: 1920, h: 823, dpr: 2, W: 3840, H: 1646 },
  { id: 'search', w: 960, h: 640, dpr: 2, W: 1920, H: 1280 },
];

(async () => {
  const b = await chromium.launch();
  for (const lang of ['tr', 'en']) {
    for (const z of SIZES) {
      const pg = await open(b, lang, 11, z);
      await pg.clock.runFor(500);
      await pg.evaluate(() => {
        const st = document.createElement('style'); st.textContent = '.ct-foot{display:none!important}'; document.head.appendChild(st);
        Game.newGame ? null : null;
      });
      // kariyer kurmadan: kulüp renkleriyle tören
      await pg.evaluate((t) => {
        Celebrate.trophy({ big: t.big, year: t.sub, title: '', sub: '', c1: '#1d3f94', c2: '#ffcf3f', short: 'STAR', kit: { shirt: '#1d3f94', alt: '#ffcf3f', pattern: 'band', shorts: '#ffffff', socks: '#1d3f94' }, number: 10 });
      }, T[lang]);
      // törenin kupa kaldırılmış hali (2,2 sn sonra) başlangıç kabul edilir
      await pg.clock.runFor(2200);
      const dir = path.join(TMP, `${lang}-${z.id}`);
      await record(pg, dir, 8);
      const base = path.join(OUT, `${lang}-${z.id}`);
      execSync(`convert "${dir}/f0090.jpg" -resize ${z.W}x${z.H}! -quality 93 "${base}.jpg"`);
      execSync(`ffmpeg -loglevel error -y -framerate 30 -i "${dir}/f%04d.jpg" -vf "scale=${z.W}:${z.H},setsar=1" -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -r 30 -an -movflags +faststart "${base}.mp4"`);
      console.log(lang, z.id, pg.errs);
      await pg.close();
    }
  }
  fs.rmSync(TMP, { recursive: true, force: true });
  await b.close();
})();
