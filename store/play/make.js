// Google Play mağaza görselleri: node store/play/make.js
// - store/play/icon-512.png (yeni 10 numaralı forma simgesi)
// - store/play/feature-<dil>.png (1024x500 öne çıkan görsel)
// - store/play/shots/<dil>-N.png (App Store görsellerinden, Play'in en fazla 2:1 oranına uygun 1290x2580)
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '../..');
const OUT = __dirname;
const IOS = path.join(ROOT, 'store/premium/ios');
const LANGS = ['tr', 'en', 'es'];
// Game Center / iCloud görseli (7) Play'de kullanılmaz
const PICK = ['1-goal', '2-life', '3-coach', '4-match', '5-trophy', '6-street'];
const TXT = {
  tr: { sub: 'Mahalleden zirveye futbol kariyeri', chips: ['Kritik anları sen oyna', 'Teknik direktör modu', 'Saha dışında da yıldız ol'], free: 'ÜCRETSİZ' },
  en: { sub: 'From street football to the top', chips: ['Play the key moments', 'Manager mode', 'Be a star off the pitch'], free: 'FREE' },
  es: { sub: 'Del barrio a la cima', chips: ['Juega los momentos clave', 'Modo entrenador', 'Sé una estrella fuera del campo'], free: 'GRATIS' },
};

(async () => {
  fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });
  // simge: 512x512, köşesiz (Play kendisi yuvarlar)
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(ROOT, 'app/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png'), '-vf', 'scale=512:512:flags=lanczos', path.join(OUT, 'icon-512.png')]);
  // ekran görüntüleri: bulanık arka planla 1290x2580'e sığdır
  for (const l of LANGS) {
    PICK.forEach((p, i) => {
      const src = path.join(IOS, `${l}-${p}.png`);
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-filter_complex',
        '[0]scale=1290:2580,boxblur=40:2[bg];[0]scale=-1:2580:flags=lanczos[fg];[bg][fg]overlay=(W-w)/2:0', path.join(OUT, 'shots', `${l}-${i + 1}.png`)]);
    });
  }
  // öne çıkan görsel
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const FD = 'file://' + path.join(ROOT, 'store/premium/fonts');
  const font = (fam, f, w) => `@font-face{font-family:'${fam}';font-weight:${w};src:url('${FD}/${f}-latin-${w}-normal.woff2')}@font-face{font-family:'${fam}';font-weight:${w};src:url('${FD}/${f}-latin-ext-${w}-normal.woff2');unicode-range:U+0100-024F}`;
  for (const l of LANGS) {
    const T = TXT[l];
    const shot = (n) => 'file://' + path.join(IOS, `${l}-${n}.png`);
    const icon = 'file://' + path.join(OUT, 'icon-512.png');
    const html = `<!doctype html><html><head><style>
      ${font('Saira Condensed', 'saira-condensed', 900)}${font('Saira Condensed', 'saira-condensed', 800)}${font('Barlow Semi Condensed', 'barlow-semi-condensed', 600)}${font('Barlow Semi Condensed', 'barlow-semi-condensed', 700)}
      *{margin:0;box-sizing:border-box}
      body{width:1024px;height:500px;overflow:hidden;position:relative;font-family:'Barlow Semi Condensed';
        background:radial-gradient(ellipse at 72% 10%,#2a5bd6 0%,#123084 35%,#071436 70%,#030817 100%)}
      .beam{position:absolute;top:-60px;width:180px;height:700px;background:linear-gradient(rgba(255,240,200,.22),rgba(255,240,200,0));transform-origin:top}
      .left{position:absolute;left:52px;top:0;bottom:0;width:520px;display:flex;flex-direction:column;justify-content:center}
      .row{display:flex;align-items:center;gap:22px}
      .ic{width:118px;height:118px;border-radius:26px;box-shadow:0 10px 40px rgba(255,207,63,.35)}
      .logo{font-family:'Saira Condensed';font-weight:900;font-style:italic;font-size:104px;line-height:.85;color:#fff;letter-spacing:-1px;text-shadow:0 6px 24px rgba(0,0,0,.5)}
      .logo span{color:#ffcf3f}
      .sub{color:#f3f1ea;font-size:31px;font-weight:700;margin:20px 0 18px;text-shadow:0 2px 12px rgba(0,0,0,.6)}
      .chips{display:flex;flex-wrap:wrap;gap:10px}
      .chip{border:2px solid rgba(255,207,63,.55);background:rgba(5,10,30,.55);color:#ffdf7a;border-radius:30px;padding:6px 16px;font-size:21px;font-weight:700}
      .free{position:absolute;left:52px;bottom:30px;font-family:'Saira Condensed';font-weight:800;font-size:28px;color:#05261a;background:#3ddc84;border-radius:30px;padding:3px 22px;font-style:italic}
      .ph{position:absolute;width:290px;height:628px;background-size:cover;background-position:center 22%;border-radius:36px;box-shadow:0 30px 60px rgba(0,0,0,.6)}
      </style></head><body>
      <div class="beam" style="left:560px;transform:rotate(-24deg)"></div><div class="beam" style="left:900px;transform:rotate(22deg)"></div>
      <div class="ph" style="left:590px;top:60px;transform:rotate(-7deg);background-image:url('${shot('2-life')}');background-size:100% 100%"></div>
      <div class="ph" style="left:780px;top:30px;transform:rotate(6deg);background-image:url('${shot('1-goal')}');background-size:100% 100%"></div>
      <div class="left"><div class="row"><img class="ic" src="${icon}"><div class="logo">STAR<span>FOOT</span></div></div>
        <div class="sub">${T.sub}</div><div class="chips">${T.chips.map((x) => `<div class="chip">${x}</div>`).join('')}</div></div>
      <div class="free">${T.free}</div>
      </body></html>`;
    const f = path.join(OUT, `_fg_${l}.html`);
    fs.writeFileSync(f, html);
    const pg = await b.newPage({ viewport: { width: 1024, height: 500 } });
    await pg.goto('file://' + f); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(300);
    await pg.screenshot({ path: path.join(OUT, `feature-${l}.png`) });
    await pg.close(); fs.unlinkSync(f);
  }
  await b.close();
  console.log('tamam');
})();
