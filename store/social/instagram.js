// Instagram: profil fotoğrafı + yan yana tek görsel oluşturan 3 gönderi (her biri 1080x1440, 3:4)
// Önce clips.js ile sahne kareleri alınmış olmalı: node store/social/instagram.js <dil> <work>
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { fontCss } = require('./rec');
const lang = process.argv[2] || 'tr';
const WORK = process.argv[3] || path.join(__dirname, 'work', lang);
const OUT = path.join(__dirname, 'instagram');
fs.mkdirSync(OUT, { recursive: true });
const ICON = 'file://' + path.join(__dirname, '../../app/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png');
const fr = (dir, n) => 'file://' + path.join(WORK, dir, `f${String(n).padStart(4, '0')}.jpg`);

const T = {
  tr: {
    kicker: 'FUTBOL KARİYERİ OYUNU', h1: 'SOKAKTAN', h2: 'EFSANEYE', sub: 'Mahalle maçından Şampiyonlar Kupası finaline kadar kariyerini sen yaz.',
    chips: ['Gol at', 'Transfer ol', 'Kupayı kaldır'], stats: [['400+', 'kulüp'], ['16', 'ülke ligi'], ['~100', 'başarım']],
    feats: [['⚽', 'Kritik anları sen oyna'], ['🏆', 'Ligler, kupalar, Dünya Kupası'], ['✈️', 'Transferler ve imza törenleri'], ['📈', 'Antrenman, sponsor, şöhret']],
    badge: 'APP STORE\'DA ÜCRETSİZ', cta: 'Linki profilde 👆',
  },
  en: {
    kicker: 'FOOTBALL CAREER GAME', h1: 'FROM THE', h2: 'STREETS TO LEGEND', sub: 'From the neighbourhood pitch to the Champions Cup final, you write your career.',
    chips: ['Score goals', 'Get transferred', 'Lift trophies'], stats: [['400+', 'clubs'], ['16', 'leagues'], ['~100', 'achievements']],
    feats: [['⚽', 'Play the big moments'], ['🏆', 'Leagues, cups, World Cup'], ['✈️', 'Transfers & signing ceremonies'], ['📈', 'Training, sponsors, fame']],
    badge: 'FREE ON THE APP STORE', cta: 'Link in bio 👆',
  },
}[lang];

const W = 3240, H = 1440;
const phone = (x, y, w, img, rot) => `<div class="phone" style="left:${x}px;top:${y}px;width:${w}px;height:${Math.round(w * 1920 / 1080) + 28}px;transform:rotate(${rot}deg)"><div class="scr"><img src="${img}"></div></div>`;
const grid = `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}
*{margin:0;padding:0;box-sizing:border-box}
body{width:${W}px;height:${H}px;overflow:hidden;position:relative;font-family:'Barlow Semi Condensed',sans-serif;color:#fff;
  background:radial-gradient(60% 90% at 50% 15%,#1d3f94 0%,#0d1f4f 45%,#060d26 80%,#040817 100%)}
.beam{position:absolute;top:-300px;width:700px;height:2000px;background:linear-gradient(180deg,rgba(255,244,214,.16),rgba(255,244,214,0) 70%);filter:blur(24px);transform-origin:top center}
.pitch{position:absolute;left:-5%;right:-5%;bottom:-160px;height:620px;background:repeating-linear-gradient(90deg,rgba(60,170,90,.2) 0 120px,rgba(60,170,90,.09) 120px 240px);transform:perspective(1200px) rotateX(60deg);transform-origin:bottom;-webkit-mask:linear-gradient(0deg,#000 40%,transparent)}
.stripe{position:absolute;left:-200px;width:3700px;height:26px;background:linear-gradient(90deg,#ffcf3f,#ffb02e);transform:rotate(-7deg);box-shadow:0 0 40px rgba(255,207,63,.5)}
.stripe{transform:rotate(-3deg)}.stripe.t{top:1330px;opacity:.95}.stripe.t2{top:1375px;height:8px;opacity:.6}
.dots b{position:absolute;width:10px;height:10px;border-radius:50%;background:#fff}
/* sol kare */
.L{position:absolute;left:0;top:0;width:1080px;height:1440px;padding:150px 90px}
.logo{font-family:'Saira Condensed';font-weight:900;font-style:italic;font-size:70px;transform:skewX(-8deg);display:inline-block}.logo span{color:#ffcf3f}
.kick{margin-top:40px;display:inline-block;padding:12px 28px;border-radius:999px;border:2px solid #ffcf3f66;background:#ffcf3f18;color:#ffcf3f;font-weight:700;font-size:30px;letter-spacing:.2em}
h1{margin-top:44px;font-family:'Saira Condensed';font-weight:900;font-style:italic;text-transform:uppercase;line-height:.9;transform:skewX(-6deg)}
h1 .a{display:block;font-size:150px}
h1 .b{display:block;font-size:${T.h2.length > 10 ? 118 : 170}px;background:linear-gradient(180deg,#fff3c2,#ffcf3f 55%,#e39a12);-webkit-background-clip:text;color:transparent;filter:drop-shadow(0 10px 30px rgba(0,0,0,.5))}
.sub{margin-top:40px;font-size:42px;line-height:1.3;color:#cdd7f4;max-width:860px}
.stats{position:absolute;left:90px;right:90px;top:1010px;display:flex;gap:22px}
.stats div{flex:1;padding:22px 10px;border-radius:24px;background:#13224f;border:2px solid rgba(255,255,255,.14);text-align:center}
.stats b{display:block;font-family:'Saira Condensed';font-weight:900;font-style:italic;font-size:66px;color:#ffcf3f;line-height:1}
.stats small{display:block;margin-top:6px;font-size:28px;font-weight:600;color:#cdd7f4}
/* orta kare */
.phone{position:absolute;border-radius:70px;padding:14px;background:linear-gradient(145deg,#2a3555,#0b1020 40%,#1d2742);box-shadow:0 0 0 3px rgba(255,255,255,.08),0 50px 120px rgba(0,0,0,.65),0 0 160px rgba(255,207,63,.25)}
.phone .scr{width:100%;height:100%;border-radius:57px;overflow:hidden;background:#000}.phone img{width:100%;height:100%;object-fit:cover;display:block}
.chip{position:absolute;z-index:5;padding:18px 30px;border-radius:24px;font-weight:700;font-size:36px;white-space:nowrap;background:linear-gradient(135deg,rgba(255,255,255,.2),rgba(255,255,255,.07));border:2px solid rgba(255,255,255,.3);backdrop-filter:blur(12px);box-shadow:0 20px 50px rgba(0,0,0,.45)}
.chip i{display:inline-block;width:18px;height:18px;border-radius:50%;background:#ffcf3f;margin-right:14px;box-shadow:0 0 16px #ffcf3f}
/* sağ kare */
.R{position:absolute;left:2160px;top:0;width:1080px;height:1440px;padding:100px 90px;text-align:center}
.icon{width:250px;height:250px;border-radius:56px;box-shadow:0 30px 80px rgba(0,0,0,.6),0 0 120px rgba(255,207,63,.3)}
.R .logo{display:block;margin:26px auto 0;font-size:84px}
.feats{margin:30px auto 0;text-align:left;width:800px}
.feats div{display:flex;align-items:center;gap:26px;padding:18px 30px;margin-bottom:14px;border-radius:24px;background:#13224f;border:2px solid rgba(255,255,255,.14);font-size:38px;font-weight:600}
.feats span{font-size:44px}
.badge{display:inline-block;margin-top:26px;padding:24px 54px;border-radius:999px;background:#ffcf3f;color:#0a1530;font-family:'Saira Condensed';font-weight:900;font-size:52px;letter-spacing:.04em;box-shadow:0 20px 60px rgba(255,207,63,.35)}
.cta{margin-top:22px;font-size:36px;color:#cdd7f4;font-weight:600}
</style></head><body>
<div class="beam" style="left:300px;transform:rotate(-20deg)"></div><div class="beam" style="left:1280px;transform:rotate(4deg)"></div><div class="beam" style="left:2300px;transform:rotate(22deg)"></div>
<div class="pitch"></div><div class="stripe t"></div><div class="stripe t2"></div>
<div class="dots">${Array.from({ length: 70 }, (_, i) => `<b style="left:${(i * 467) % W}px;top:${(i * 211) % 900}px;opacity:${0.15 + (i % 5) * 0.1};transform:scale(${0.4 + (i % 3) * 0.4})"></b>`).join('')}</div>
<div class="L"><div class="logo">STAR<span>FOOT</span></div><br><div class="kick">${T.kicker}</div>
<h1><span class="a">${T.h1}</span><span class="b">${T.h2}</span></h1><p class="sub">${T.sub}</p>
<div class="stats">${T.stats.map(([n, l]) => `<div><b>${n}</b><small>${l}</small></div>`).join('')}</div></div>
${phone(1080 + 120, 230, 420, fr('moment', 120), -6)}${phone(1080 + 540, 170, 420, fr('trophy', 80), 5)}
<div class="chip" style="left:${1080 + 70}px;top:1000px"><i></i>${T.chips[0]}</div>
<div class="chip" style="left:${1080 + 560}px;top:110px"><i></i>${T.chips[2]}</div>
<div class="R"><img class="icon" src="${ICON}"><span class="logo">STAR<span>FOOT</span></span>
<div class="feats">${T.feats.map(([e, t]) => `<div><span>${e}</span>${t}</div>`).join('')}</div>
<div class="badge">${T.badge}</div><div class="cta">${T.cta}</div></div>
</body></html>`;

const avatar = `<!doctype html><html><head><meta charset="utf-8"><style>*{margin:0}body{width:1080px;height:1080px;background:#0b1733;display:grid;place-items:center}
img{width:1080px;height:1080px;display:block}</style></head><body><img src="${ICON}"></body></html>`;

(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: W, height: H } });
  const f = path.join(OUT, '_p.html');
  fs.writeFileSync(f, grid);
  await pg.goto('file://' + f); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(300);
  const pano = path.join(OUT, `grid-${lang}-panorama.png`);
  await pg.screenshot({ path: pano });
  // Instagram'da en son yüklenen en solda görünür: önce 3, sonra 2, en son 1 numarayı paylaş
  for (let i = 0; i < 3; i++) await pg.screenshot({ path: path.join(OUT, `grid-${lang}-${i + 1}.jpg`), type: 'jpeg', quality: 95, clip: { x: i * 1080, y: 0, width: 1080, height: 1440 } });
  if (lang === 'tr') {
    await pg.setViewportSize({ width: 1080, height: 1080 });
    fs.writeFileSync(f, avatar);
    await pg.goto('file://' + f); await pg.waitForTimeout(200);
    await pg.screenshot({ path: path.join(OUT, 'profil-fotografi.png') });
  }
  fs.unlinkSync(f);
  await b.close();
  console.log('ok');
})();
