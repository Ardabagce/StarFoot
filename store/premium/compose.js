// Play Store tanıtım görselleri (1080x1920): node store/premium/compose.js
// Önce node store/premium/capture.js ile ham ekranlar alınır.
const { chromium } = require('playwright');
const path = require('path');
const D = __dirname;
const F = 'file://' + path.join(D, 'fonts');

const POSTERS = [
  {
    id: 'moment', accent: '#ffcf3f', glow: 'rgba(255,207,63,.45)', tilt: -3,
    tr: { tag: 'CANLI MAÇ MOTORU', h1: 'KRİTİK ANLARI', h2: 'SEN OYNA', sub: 'Şut, pas, çalım, frikik, penaltı: maçın kaderi senin elinde.', chips: [['Kaydır & vur', 'left', 1040], ['Gerçek zamanlı maç', 'right', 1500]] },
    en: { tag: 'LIVE MATCH ENGINE', h1: 'PLAY THE', h2: 'BIG MOMENTS', sub: 'Shots, passes, dribbles, free kicks, penalties: the match is in your hands.', chips: [['Swipe & shoot', 'left', 1040], ['Real-time matches', 'right', 1500]] },
  },
  {
    id: 'matchday', accent: '#8fb8ff', glow: 'rgba(120,170,255,.5)', tilt: 3, stars: true,
    tr: { tag: 'LİGLER VE KUPALAR', h1: 'DEVLERİN', h2: 'SAHNESİNE ÇIK', sub: 'Şampiyonlar Kupası, Dünya Kupası ve 16 ülkenin ligleri.', chips: [['400+ kulüp', 'right', 1000], ['16 ülke ligi', 'left', 1460]] },
    en: { tag: 'LEAGUES & CUPS', h1: 'STEP ONTO', h2: 'THE BIG STAGE', sub: 'Champions Cup, World Cup and leagues from 16 countries.', chips: [['400+ clubs', 'right', 1000], ['16 national leagues', 'left', 1460]] },
  },
  {
    id: 'summary', accent: '#ffd36b', glow: 'rgba(255,190,60,.5)', tilt: -3,
    tr: { tag: 'KARİYER', h1: 'MAÇIN', h2: 'YILDIZI OL', sub: 'Reytingini yükselt, ödülleri topla, efsaneler arasına adını yazdır.', chips: [['Maçın oyuncusu ödülü', 'left', 1080], ['~100 başarım', 'right', 1520]] },
    en: { tag: 'CAREER', h1: 'BE THE', h2: 'MAN OF THE MATCH', sub: 'Raise your rating, collect awards and write your name among the legends.', chips: [['Man of the Match awards', 'left', 1080], ['~100 achievements', 'right', 1520]] },
  },
  {
    id: 'trophy', accent: '#ffcf3f', glow: 'rgba(255,200,60,.55)', tilt: 3, confetti: true,
    tr: { tag: 'ŞAMPİYONLUK', h1: 'KUPAYI', h2: 'HAVAYA KALDIR', sub: 'Ligler, kupalar ve şampiyonluk törenleri seni bekliyor.', chips: [['Kupa töreni', 'right', 1060], ['Gol sevinçleri', 'left', 1500]] },
    en: { tag: 'GLORY', h1: 'LIFT THE', h2: 'TROPHY', sub: 'Leagues, cups and title celebrations are waiting for you.', chips: [['Trophy ceremonies', 'right', 1060], ['Goal celebrations', 'left', 1500]] },
  },
  {
    id: 'social', accent: '#ff6fb5', glow: 'rgba(214,80,220,.5)', tilt: -3, ig: true,
    tr: { tag: 'SAHA DIŞI HAYAT', h1: 'SAHA DIŞINDA', h2: 'DA YILDIZ OL', sub: 'Takipçi topla, sponsorluk imzala, transfer tekliflerini değerlendir.', chips: [['Milyonlarca takipçi', 'right', 1040], ['Sponsorluk & menajer', 'left', 1500]] },
    en: { tag: 'LIFE OFF THE PITCH', h1: 'A STAR', h2: 'OFF THE PITCH', sub: 'Grow your followers, sign sponsorships and weigh transfer offers.', chips: [['Millions of followers', 'right', 1040], ['Sponsors & agent', 'left', 1500]] },
  },
];

const fontCss = [['Saira Condensed', 'saira-condensed', [800, 900]], ['Barlow Semi Condensed', 'barlow-semi-condensed', [500, 600, 700]]]
  .flatMap(([fam, f, ws]) => ws.flatMap((w) => ['latin', 'latin-ext'].map((s) => `@font-face{font-family:'${fam}';font-weight:${w};src:url('${F}/${f}-${s}-${w}-normal.woff2') format('woff2');}`))).join('\n');

const html = (p, l, img) => {
  const t = p[l];
  const conf = p.confetti ? Array.from({ length: 90 }, (_, i) => {
    const x = (i * 137) % 1080, y = (i * 263) % 1500, r = (i * 47) % 180, c = ['#ffcf3f', '#ffffff', '#ff5a5a', '#ffb02e'][i % 4];
    if (y < 640 && x > 120 && x < 960) return ''; // başlığın üstüne binmesin
    return `<i style="left:${x}px;top:${y}px;transform:rotate(${r}deg);background:${c};opacity:${0.35 + (i % 5) * 0.1}"></i>`;
  }).join('') : '';
  const stars = p.stars ? Array.from({ length: 60 }, (_, i) => `<b style="left:${(i * 173) % 1080}px;top:${(i * 311) % 1300}px;opacity:${0.3 + (i % 6) * 0.1};transform:scale(${0.5 + (i % 4) * 0.3})"></b>`).join('') : '';
  const chips = t.chips.map(([txt, side, y], i) => `<div class="chip ${side}" style="top:${y}px"><span class="dot"></span>${txt}</div>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${fontCss}
*{margin:0;padding:0;box-sizing:border-box}
body{width:1080px;height:1920px;overflow:hidden;position:relative;font-family:'Barlow Semi Condensed',sans-serif;color:#fff;
  background:radial-gradient(120% 70% at 50% 8%, #1b3a8a 0%, #0d1f4f 38%, #070f2a 70%, #040817 100%)}
.beam{position:absolute;top:-200px;width:520px;height:1500px;background:linear-gradient(180deg,rgba(255,244,214,.20),rgba(255,244,214,0) 70%);filter:blur(18px);transform-origin:top center}
.beam.l{left:-120px;transform:rotate(-24deg)} .beam.r{right:-120px;transform:rotate(24deg)}
.pitch{position:absolute;left:-10%;right:-10%;bottom:-120px;height:760px;background:
  repeating-linear-gradient(90deg,rgba(60,170,90,.16) 0 90px,rgba(60,170,90,.08) 90px 180px);
  transform:perspective(900px) rotateX(58deg);transform-origin:bottom;border-top:4px solid rgba(255,255,255,.18);
  -webkit-mask:linear-gradient(0deg,#000 40%,transparent)}
.halo{position:absolute;left:50%;top:1180px;width:980px;height:980px;margin-left:-490px;margin-top:-490px;border-radius:50%;background:radial-gradient(circle,${p.glow} 0%,transparent 62%)}
.stars b{position:absolute;width:10px;height:10px;background:#fff;clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)}
.conf i{position:absolute;width:14px;height:26px;border-radius:2px}
header{position:absolute;left:0;right:0;top:92px;text-align:center;padding:0 70px}
.logo{font-family:'Saira Condensed';font-weight:900;font-style:italic;font-size:46px;letter-spacing:.02em;transform:skewX(-8deg);display:inline-block}
.logo span{color:#ffcf3f}
.tag{display:inline-block;margin:26px auto 0;padding:10px 26px;border-radius:999px;font-weight:700;font-size:26px;letter-spacing:.22em;color:${p.accent};
  border:2px solid ${p.accent}55;background:${p.accent}14}
h1{font-family:'Saira Condensed';font-weight:900;font-style:italic;text-transform:uppercase;line-height:.92;margin-top:26px;letter-spacing:-.005em;transform:skewX(-6deg)}
h1 .a{display:block;font-size:${t.h1.length > 11 ? 112 : 126}px;color:#fff;text-shadow:0 6px 30px rgba(0,0,0,.45)}
h1 .b{display:block;font-size:${t.h2.length > 13 ? 104 : 126}px;background:linear-gradient(180deg,#fff3c2 0%,${p.accent} 55%,#e39a12 100%);-webkit-background-clip:text;color:transparent;filter:drop-shadow(0 8px 24px rgba(0,0,0,.45))}
.sub{margin:26px auto 0;max-width:860px;font-size:37px;font-weight:500;line-height:1.3;color:#cdd7f4}
.phone{position:absolute;left:50%;top:640px;width:600px;height:1231px;margin-left:-300px;border-radius:72px;padding:16px;
  background:linear-gradient(145deg,#2a3555,#0b1020 40%,#1d2742);box-shadow:0 0 0 3px rgba(255,255,255,.08),0 50px 120px rgba(0,0,0,.65),0 0 140px ${p.glow};
  transform:rotate(${p.tilt}deg)}
.phone .scr{width:100%;height:100%;border-radius:58px;overflow:hidden;background:#000;position:relative}
.phone img{width:100%;height:100%;object-fit:cover;object-position:top;display:block}
.phone .notch{position:absolute;top:22px;left:50%;width:120px;height:34px;margin-left:-60px;border-radius:20px;background:#05070d}
.chip{position:absolute;z-index:5;display:flex;align-items:center;gap:16px;padding:22px 34px;border-radius:26px;font-weight:700;font-size:38px;white-space:nowrap;
  background:linear-gradient(135deg,rgba(255,255,255,.18),rgba(255,255,255,.06));border:2px solid rgba(255,255,255,.28);backdrop-filter:blur(14px);
  box-shadow:0 20px 50px rgba(0,0,0,.45)}
.chip.left{left:38px} .chip.right{right:38px}
.chip .dot{width:20px;height:20px;border-radius:50%;background:${p.accent};box-shadow:0 0 18px ${p.accent}}
${p.ig ? `.chip .dot{background:linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)}` : ''}
.foot{position:absolute;left:0;right:0;bottom:0;height:200px;background:linear-gradient(0deg,rgba(4,8,23,.85),transparent)}
</style></head><body>
<div class="beam l"></div><div class="beam r"></div><div class="pitch"></div><div class="halo"></div>
<div class="stars">${stars}</div><div class="conf">${conf}</div>
<header><div class="logo">STAR<span>FOOT</span></div><br><div class="tag">${t.tag}</div>
<h1><span class="a">${t.h1}</span><span class="b">${t.h2}</span></h1><p class="sub">${t.sub}</p></header>
<div class="phone"><div class="scr"><img src="${img}"></div></div>
${chips}
<div class="foot"></div>
</body></html>`;
};

(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  for (const l of ['tr', 'en']) {
    for (const [i, p] of POSTERS.entries()) {
      const tmp = path.join(D, '_tmp.html');
      require('fs').writeFileSync(tmp, html(p, l, 'raw/' + `${l}-${p.id}.png`));
      await pg.goto('file://' + tmp, { waitUntil: 'load' });
      await pg.evaluate(() => document.fonts.ready);
      await pg.waitForTimeout(200);
      await pg.screenshot({ path: path.join(D, `${l}-${i + 1}-${p.id}.png`) });
    }
  }
  require('fs').unlinkSync(path.join(D, '_tmp.html'));
  await b.close();
  console.log('ok');
})();
