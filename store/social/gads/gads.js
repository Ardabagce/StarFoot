// Google Ads uygulama kampanyası görselleri: yatay 1200x628, kare 1200x1200, dikey 960x1200 (EN + TR)
// node store/social/gads/gads.js  (ham ekranlar store/premium/raw2/<dil>-<sahne>.png)
const { chromium } = require('playwright');
const path = require('path');
const R = path.resolve(__dirname, '../..');
const F = 'file://' + path.join(R, 'premium/fonts');
const SIZES = { land: [1200, 628], sq: [1200, 1200], port: [960, 1200] };
const T = {
  street: { a: '#ffb45c', en: ['FROM THE STREET', 'TO LEGEND', 'Start as a kid, get scouted, turn pro.'], tr: ['SOKAKTAN', 'EFSANEYE', 'Çocukken başla, keşfedil, profesyonel ol.'] },
  goal: { a: '#ffcf3f', en: ['YOU TAKE', 'THE SHOT', 'Play the big moments yourself.'], tr: ['GOLÜ', 'SEN AT', 'Kritik anları sen oyna.'] },
  trophy: { a: '#ffcf3f', en: ['LIFT THE', 'TROPHY', 'Leagues, cups and the Golden Star.'], tr: ['KUPAYI', 'HAVAYA KALDIR', 'Lig, kupa ve Altın Yıldız.'] },
  coach: { a: '#46e08f', en: ['BECOME THE', 'MANAGER', 'Retire and run your own club.'], tr: ['TEKNİK', 'DİREKTÖR OL', 'Emekli ol, kendi takımını yönet.'] },
};
const CTA = { en: 'PLAY FREE', tr: 'ÜCRETSİZ OYNA' };
const html = (k, l, sz, shot) => {
  const [w, h] = SIZES[sz], t = T[k], [h1, h2, sub] = t[l];
  const land = sz === 'land';
  const ph = land ? h - 70 : Math.round(h * 0.56);
  const hs = land ? 74 : sz === 'sq' ? 96 : 84;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:S;src:url(${F}/saira-condensed-latin-ext-800-normal.woff2)}@font-face{font-family:S;src:url(${F}/saira-condensed-latin-800-normal.woff2)}
@font-face{font-family:B;src:url(${F}/barlow-semi-condensed-latin-ext-600-normal.woff2)}@font-face{font-family:B;src:url(${F}/barlow-semi-condensed-latin-600-normal.woff2)}
*{margin:0;box-sizing:border-box}body{width:${w}px;height:${h}px;overflow:hidden;color:#f3f1ea;font-family:B;
background:radial-gradient(90% 80% at ${land ? '75% 40%' : '50% 75%'},${t.a}55 0%,transparent 55%),radial-gradient(120% 90% at 50% 0%,#1d3b8f 0%,#0b1736 55%,#060d24 100%)}
.w{display:flex;${land ? 'flex-direction:row;align-items:center;padding:0 56px;gap:40px' : 'flex-direction:column;align-items:center;padding:' + (sz === 'sq' ? 48 : 44) + 'px 40px 0'};height:100%}
.tx{${land ? 'flex:1' : 'text-align:center'}}
.top{display:flex;align-items:center;gap:14px;${land ? '' : 'justify-content:center'}}
.top img{width:${land ? 64 : 72}px;height:${land ? 64 : 72}px;border-radius:16px;box-shadow:0 6px 18px rgba(0,0,0,.5)}
.logo{font-family:S;font-style:italic;font-size:${land ? 46 : 52}px}.logo span{color:#ffcf3f}
h1{font-family:S;font-style:italic;text-transform:uppercase;line-height:.92;font-size:${hs}px;margin:${land ? 26 : 22}px 0 12px}
h1 em{font-style:inherit;color:${t.a};display:block}
.sub{font-size:${land ? 30 : 34}px;color:#c9d4f2}
.btn{display:inline-block;margin-top:${land ? 26 : 20}px;background:#ffcf3f;color:#1a1400;font-family:S;font-style:italic;font-size:${land ? 38 : 40}px;padding:8px 34px;transform:skewX(-8deg)}
.ph{${land ? '' : 'margin-top:28px;'}height:${ph}px;aspect-ratio:1170/2532;border-radius:${land ? 30 : 36}px;border:8px solid #0d1325;background:#000;overflow:hidden;
box-shadow:0 24px 50px rgba(0,0,0,.6),0 0 0 2px rgba(255,255,255,.14),0 0 80px ${t.a}66;transform:rotate(${land ? 3 : 0}deg)${land ? '' : ';border-bottom:0;border-radius:36px 36px 0 0'}}
.ph img{width:100%;height:100%;object-fit:cover;object-position:top}
</style></head><body><div class="w"><div class="tx">
<div class="top"><img src="file://${R}/icon-512.png"><div class="logo">STAR<span>FOOT</span></div></div>
<h1>${h1}<em>${h2}</em></h1><div class="sub">${sub}</div><div class="btn">${CTA[l]}</div></div>
<div class="ph"><img src="file://${shot}"></div></div></body></html>`;
};
(async () => {
  const b = await chromium.launch();
  for (const l of ['en', 'tr']) for (const k of Object.keys(T)) for (const sz of Object.keys(SIZES)) {
    const [w, h] = SIZES[sz];
    const pg = await b.newPage({ viewport: { width: w, height: h } });
    const tmp = path.join(require('os').tmpdir(), 'gads.html');
    require('fs').writeFileSync(tmp, html(k, l, sz, path.join(R, 'premium/raw2', `${l}-${k}.png`)));
    await pg.goto('file://' + tmp, { waitUntil: 'load' });
    await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(150);
    await pg.screenshot({ path: path.join(__dirname, `${l}-${k}-${sz}-${w}x${h}.jpg`), type: 'jpeg', quality: 88 });
    await pg.close();
  }
  await b.close();
})();
