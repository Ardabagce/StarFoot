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

const { capHtml, hookHtml, endHtml } = require('./tpl');

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
