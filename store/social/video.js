// TikTok / Reels tanıtım videosu (1080x1920, 30 fps, ~22 sn)
// Önce: node store/social/clips.js <dil> <work>   Sonra: node store/social/video.js <dil> <work>
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { fontCss } = require('./rec');
const lang = process.argv[2] || 'tr';
const WORK = process.argv[3] || path.join(__dirname, 'work', lang);
const OUT = path.join(__dirname, `starfoot-tanitim-${lang}.mp4`);
const ICON = path.join(__dirname, '../../app/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png');

const T = {
  tr: {
    hook: ['BU FUTBOL OYUNUNDA', 'KARİYERİNİ SEN YAZIYORSUN'],
    caps: ['KRİTİK ANLARI <em>SEN OYNA</em>', 'GOLÜ AT, <em>SEVİNCİNİ SEÇ</em>', 'ŞAMPİYONLAR KUPASI <em>GECELERİ</em>', 'TRANSFER OL, <em>TARAFTAR SENİ KARŞILASIN</em>', 'İMZAYI AT, <em>FORMAYI GİY</em>', 'KUPAYI <em>HAVAYA KALDIR</em>'],
    end: { title: 'StarFoot: Futbol Kariyeri', tag: 'Sokaktan efsaneye.<br>Kariyerini sen yaz.', badge: 'APP STORE\'DA ÜCRETSİZ', cta: 'Profildeki linkten indir' },
  },
  en: {
    hook: ['IN THIS FOOTBALL GAME', 'YOU WRITE YOUR CAREER'],
    caps: ['PLAY THE <em>BIG MOMENTS</em>', 'SCORE & <em>PICK YOUR CELEBRATION</em>', 'CHAMPIONS CUP <em>NIGHTS</em>', 'GET TRANSFERRED, <em>FANS GREET YOU</em>', 'SIGN & <em>WEAR THE SHIRT</em>', 'LIFT <em>THE TROPHY</em>'],
    end: { title: 'StarFoot: Football Career', tag: 'From the streets to legend.<br>Write your own career.', badge: 'FREE ON THE APP STORE', cta: 'Download via the link in bio' },
  },
}[lang];

const base = `${fontCss}*{margin:0;padding:0;box-sizing:border-box}body{width:1080px;height:1920px;overflow:hidden;position:relative;font-family:'Barlow Semi Condensed',sans-serif;color:#fff}`;
// Alt yazı: TikTok/Reels arayüzüne denk gelmeyen orta-alt bölge
const capHtml = (txt) => `<!doctype html><html><head><meta charset="utf-8"><style>${base}body{background:transparent}
.band{position:absolute;left:0;right:0;top:1120px;height:520px;background:linear-gradient(180deg,rgba(2,5,15,0) 0%,rgba(2,5,15,.78) 38%,rgba(2,5,15,.78) 70%,rgba(2,5,15,0) 100%)}
.cap{position:absolute;left:70px;right:150px;top:1270px;font-family:'Saira Condensed';font-weight:900;font-style:italic;font-size:92px;line-height:.98;text-transform:uppercase;transform:skewX(-6deg);text-shadow:0 6px 24px rgba(0,0,0,.6)}
.cap em{display:block;font-style:italic;color:#ffcf3f}
.bar{position:absolute;left:70px;top:1236px;width:120px;height:10px;border-radius:5px;background:#ffcf3f;transform:skewX(-20deg)}
.wm{position:absolute;left:70px;top:1180px;font-family:'Saira Condensed';font-weight:900;font-style:italic;font-size:34px;letter-spacing:.04em;opacity:.9}.wm span{color:#ffcf3f}
</style></head><body><div class="band"></div><div class="wm">STAR<span>FOOT</span></div><div class="bar"></div><div class="cap">${txt}</div></body></html>`;
const hookHtml = (a, b) => `<!doctype html><html><head><meta charset="utf-8"><style>${base}body{background:transparent}
.band{position:absolute;left:0;right:0;top:0;height:900px;background:linear-gradient(180deg,rgba(2,5,15,.92) 0%,rgba(2,5,15,.85) 55%,rgba(2,5,15,0) 100%)}
.h{position:absolute;left:60px;right:60px;top:300px;text-align:center;font-family:'Saira Condensed';font-weight:900;font-style:italic;text-transform:uppercase;transform:skewX(-6deg)}
.h .a{display:block;font-size:76px;color:#fff;letter-spacing:.02em}
.h .b{display:block;font-size:112px;line-height:.95;margin-top:10px;background:linear-gradient(180deg,#fff3c2,#ffcf3f 55%,#e39a12);-webkit-background-clip:text;color:transparent;filter:drop-shadow(0 8px 24px rgba(0,0,0,.5))}
</style></head><body><div class="band"></div><div class="h"><span class="a">${a}</span><span class="b">${b}</span></div></body></html>`;
const endHtml = (e, icon) => `<!doctype html><html><head><meta charset="utf-8"><style>${base}
body{background:radial-gradient(120% 70% at 50% 30%,#1b3a8a 0%,#0d1f4f 40%,#070f2a 72%,#040817 100%);text-align:center}
.beam{position:absolute;top:-200px;width:520px;height:1600px;background:linear-gradient(180deg,rgba(255,244,214,.18),rgba(255,244,214,0) 70%);filter:blur(18px);transform-origin:top center}
.beam.l{left:-140px;transform:rotate(-22deg)}.beam.r{right:-140px;transform:rotate(22deg)}
.pitch{position:absolute;left:-10%;right:-10%;bottom:-120px;height:700px;background:repeating-linear-gradient(90deg,rgba(60,170,90,.18) 0 90px,rgba(60,170,90,.08) 90px 180px);transform:perspective(900px) rotateX(58deg);transform-origin:bottom;-webkit-mask:linear-gradient(0deg,#000 40%,transparent)}
.icon{position:absolute;left:50%;top:360px;width:380px;height:380px;margin-left:-190px;border-radius:86px;box-shadow:0 30px 90px rgba(0,0,0,.6),0 0 120px rgba(255,207,63,.35)}
.logo{position:absolute;left:0;right:0;top:800px;font-family:'Saira Condensed';font-weight:900;font-style:italic;font-size:150px;letter-spacing:.01em;transform:skewX(-8deg)}.logo span{color:#ffcf3f}
.t{position:absolute;left:0;right:0;top:990px;font-size:46px;font-weight:600;color:#cdd7f4}
.tag{position:absolute;left:80px;right:80px;top:1080px;font-family:'Saira Condensed';font-weight:800;font-style:italic;font-size:74px;line-height:1.05;text-transform:uppercase}
.badge{position:absolute;left:50%;top:1330px;transform:translateX(-50%);padding:26px 54px;border-radius:999px;background:#ffcf3f;color:#0a1530;font-family:'Saira Condensed';font-weight:900;font-size:54px;letter-spacing:.04em;white-space:nowrap;box-shadow:0 20px 60px rgba(255,207,63,.35)}
.cta{position:absolute;left:0;right:0;top:1470px;font-size:40px;font-weight:600;color:#cdd7f4}
</style></head><body><div class="beam l"></div><div class="beam r"></div><div class="pitch"></div>
<img class="icon" src="${icon}"><div class="logo">STAR<span>FOOT</span></div><div class="t">${e.title}</div><div class="tag">${e.tag}</div><div class="badge">${e.badge}</div><div class="cta">${e.cta}</div></body></html>`;

(async () => {
  const tmp = path.join(WORK, '_v'); fs.mkdirSync(tmp, { recursive: true });
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const shot = async (html, file, transparent = true) => {
    const f = path.join(tmp, '_p.html'); fs.writeFileSync(f, html);
    await pg.goto('file://' + f); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(100);
    await pg.screenshot({ path: file, omitBackground: transparent });
  };
  await shot(hookHtml(...T.hook), path.join(tmp, 'hook.png'));
  for (const [i, c] of T.caps.entries()) await shot(capHtml(c), path.join(tmp, `cap${i}.png`));
  await shot(endHtml(T.end, 'file://' + ICON), path.join(tmp, 'end.png'), false);
  await b.close();

  // [klasör, başlangıç karesi, kare sayısı, alt yazı]
  const segs = [
    ['moment', 0, 42, 'hook.png'],
    ['moment', 42, 36, 'cap0.png'],
    ['moment', 78, 90, 'cap1.png'],
    ['matchday', 0, 75, 'cap2.png'],
    ['airport', 0, 126, 'cap3.png'],
    ['signing', 0, 102, 'cap4.png'],
    ['trophy', 0, 102, 'cap5.png'],
  ];
  const parts = [];
  const enc = '-c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -r 30 -an';
  segs.forEach(([dir, st, n, cap], i) => {
    const o = path.join(tmp, `s${i}.mp4`);
    const fade = cap === 'hook.png' ? 'fade=in:st=0:d=0.01:alpha=1' : 'fade=in:st=0:d=0.25:alpha=1';
    execSync(`ffmpeg -loglevel error -y -framerate 30 -start_number ${st} -i "${path.join(WORK, dir)}/f%04d.jpg" -loop 1 -t ${n / 30} -i "${path.join(tmp, cap)}" -filter_complex "[0]scale=1080:1920,setsar=1[v];[1]format=rgba,${fade}[c];[v][c]overlay=0:0:shortest=1" -frames:v ${n} ${enc} "${o}"`);
    parts.push(o);
  });
  // kapanış kartı: hafif yakınlaşma
  const eo = path.join(tmp, 'end.mp4');
  execSync(`ffmpeg -loglevel error -y -loop 1 -t 3.2 -i "${path.join(tmp, 'end.png')}" -vf "scale=2160:3840,zoompan=z='1+0.0006*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=96:s=1080x1920:fps=30,fade=in:st=0:d=0.3" -frames:v 96 ${enc} "${eo}"`);
  parts.push(eo);
  fs.writeFileSync(path.join(tmp, 'list.txt'), parts.map((p) => `file '${p}'`).join('\n'));
  // sessiz ses kanalı: platformlar için; müziği TikTok/Instagram içinde ekle
  execSync(`ffmpeg -loglevel error -y -f concat -safe 0 -i "${path.join(tmp, 'list.txt')}" -f lavfi -i anullsrc=r=44100:cl=stereo -c:v copy -c:a aac -shortest -movflags +faststart "${OUT}"`);
  console.log('ok', OUT);
})();
