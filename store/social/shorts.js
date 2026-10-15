// TikTok / Reels / Shorts için farklı kancalı kısa videolar (1080x1920, 30 fps, 10-14 sn)
// Önce: node store/social/clips.js <dil> <work>   Sonra: node store/social/shorts.js <dil> <work> [çıktı klasörü]
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { capHtml, hookHtml, endHtml } = require('./tpl');
const lang = process.argv[2] || 'tr';
const WORK = process.argv[3] || path.join(__dirname, 'work', lang);
const OUT = process.argv[4] || path.join(__dirname, 'shorts');
const ICON = path.join(__dirname, '../../app/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png');

// Her video: kanca (ilk 2 sn), sahneler [klasör, başlangıç karesi, kare sayısı, alt yazı] ve kapanış çağrısı
const V = {
  tr: [
    { id: 'son-dakika', hook: ['SKOR 1-1, SON DAKİKA', 'ŞUTU SEN ÇEKİYORSUN'], segs: [['moment', 0, 78, 'H'], ['moment', 78, 96, 'GOL! <em>SEVİNCİNİ SEÇ</em>'], ['trophy', 0, 90, 'VE KUPA <em>SENİN</em>']], cta: 'Sen olsan atar mıydın? 👇' },
    { id: 'transfer', hook: ['17 YAŞINDA', 'DEV KULÜBE TRANSFER'], segs: [['airport', 0, 60, 'H'], ['airport', 60, 66, 'TARAFTAR SENİ <em>HAVALİMANINDA KARŞILIYOR</em>'], ['signing', 0, 102, 'İMZAYI AT, <em>10 NUMARAYI AL</em>']], cta: 'Hangi kulübe gitmek isterdin? 👇' },
    { id: 'kupa', hook: ['MAHALLE MAÇINDAN', 'ŞAMPİYONLAR KUPASI\'NA'], segs: [['matchday', 0, 75, 'H'], ['moment', 42, 78, 'FİNALDE <em>GOLÜ SEN AT</em>'], ['trophy', 0, 102, 'KUPAYI <em>HAVAYA KALDIR</em>']], cta: 'Kaç sezonda şampiyon olursun? 👇' },
    { id: 'altin-top', hook: ['21 YAŞINDA', 'ALTIN TOP KAZANDIM'], segs: [['ballon', 0, 60, 'H'], ['ballon', 60, 48, 'DÜNYANIN <em>EN İYİSİ OL</em>'], ['moment', 42, 78, 'HER KRİTİK ANI <em>SEN OYNA</em>']], cta: 'Senin rekorun kaç gol? 👇' },
    { id: 'meydan-okuma', hook: ['BU OYUNDA', 'KAÇ SEZONDA EFSANE OLURSUN?'], segs: [['moment', 0, 78, 'H'], ['moment', 78, 60, 'GOLÜ AT, <em>SEVİNCİNİ SEÇ</em>'], ['airport', 20, 70, 'TRANSFER OL, <em>YILDIZ OL</em>'], ['trophy', 0, 80, 'KUPAYI <em>KALDIR</em>']], cta: 'Rekorunu yorumlara yaz 👇' },
  ],
  en: [
    { id: 'last-minute', hook: ['1-1, LAST MINUTE', 'YOU TAKE THE SHOT'], segs: [['moment', 0, 78, 'H'], ['moment', 78, 96, 'GOAL! <em>PICK YOUR CELEBRATION</em>'], ['trophy', 0, 90, 'AND THE CUP <em>IS YOURS</em>']], cta: 'Would you score it? 👇' },
    { id: 'transfer', hook: ['17 YEARS OLD', 'TRANSFER TO A GIANT'], segs: [['airport', 0, 60, 'H'], ['airport', 60, 66, 'FANS GREET YOU <em>AT THE AIRPORT</em>'], ['signing', 0, 102, 'SIGN & <em>TAKE THE NO. 10</em>']], cta: 'Which club would you join? 👇' },
    { id: 'cup', hook: ['FROM STREET FOOTBALL', 'TO THE CHAMPIONS CUP'], segs: [['matchday', 0, 75, 'H'], ['moment', 42, 78, 'SCORE <em>IN THE FINAL</em>'], ['trophy', 0, 102, 'LIFT <em>THE TROPHY</em>']], cta: 'How many seasons to win it? 👇' },
    { id: 'ballon', hook: ['21 YEARS OLD', 'I WON THE BALLON D\'OR'], segs: [['ballon', 0, 60, 'H'], ['ballon', 60, 48, 'BE THE <em>BEST IN THE WORLD</em>'], ['moment', 42, 78, 'PLAY EVERY <em>BIG MOMENT</em>']], cta: 'What\'s your goal record? 👇' },
    { id: 'challenge', hook: ['IN THIS GAME', 'HOW FAST CAN YOU BE A LEGEND?'], segs: [['moment', 0, 78, 'H'], ['moment', 78, 60, 'SCORE & <em>CELEBRATE</em>'], ['airport', 20, 70, 'GET TRANSFERRED, <em>GO PRO</em>'], ['trophy', 0, 80, 'LIFT <em>THE CUP</em>']], cta: 'Drop your record below 👇' },
  ],
}[lang];
const END = {
  tr: { title: 'StarFoot: Futbol Kariyeri', tag: 'Sokaktan efsaneye.<br>Kariyerini sen yaz.', badge: 'APP STORE\'DA ÜCRETSİZ' },
  en: { title: 'StarFoot: Football Career', tag: 'From the streets to legend.<br>Write your own career.', badge: 'FREE ON THE APP STORE' },
}[lang];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const tmp = path.join(WORK, '_s'); fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp, { recursive: true });
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const shot = async (html, file, transparent = true) => {
    const f = path.join(tmp, '_p.html'); fs.writeFileSync(f, html);
    await pg.goto('file://' + f); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(100);
    await pg.screenshot({ path: file, omitBackground: transparent });
  };
  const enc = '-c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p -r 30 -an';
  for (const [vi, v] of V.entries()) {
    const d = path.join(tmp, v.id); fs.mkdirSync(d, { recursive: true });
    await shot(hookHtml(...v.hook), path.join(d, 'H.png'));
    for (const [i, sg] of v.segs.entries()) if (sg[3] !== 'H') await shot(capHtml(sg[3]), path.join(d, `c${i}.png`));
    await shot(endHtml({ ...END, cta: v.cta }, 'file://' + ICON), path.join(d, 'end.png'), false);
    const parts = [];
    v.segs.forEach(([dir, st, n, cap], i) => {
      const o = path.join(d, `s${i}.mp4`);
      const img = path.join(d, cap === 'H' ? 'H.png' : `c${i}.png`);
      const fade = cap === 'H' ? 'fade=in:st=0:d=0.01:alpha=1' : 'fade=in:st=0:d=0.2:alpha=1';
      execSync(`ffmpeg -loglevel error -y -framerate 30 -start_number ${st} -i "${path.join(WORK, dir)}/f%04d.jpg" -loop 1 -t ${n / 30} -i "${img}" -filter_complex "[0]scale=1080:1920,setsar=1[v];[1]format=rgba,${fade}[c];[v][c]overlay=0:0:shortest=1" -frames:v ${n} ${enc} "${o}"`);
      parts.push(o);
    });
    const eo = path.join(d, 'end.mp4');
    execSync(`ffmpeg -loglevel error -y -loop 1 -t 2.6 -i "${path.join(d, 'end.png')}" -vf "scale=2160:3840,zoompan=z='1+0.0006*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=78:s=1080x1920:fps=30,fade=in:st=0:d=0.25" -frames:v 78 ${enc} "${eo}"`);
    parts.push(eo);
    fs.writeFileSync(path.join(d, 'list.txt'), parts.map((p) => `file '${p}'`).join('\n'));
    const out = path.join(OUT, `${lang}-${vi + 1}-${v.id}.mp4`);
    // sessiz ses kanalı: müziği TikTok/Instagram içinden ekle (telifsiz ve trend sesler orada)
    execSync(`ffmpeg -loglevel error -y -f concat -safe 0 -i "${path.join(d, 'list.txt')}" -f lavfi -i anullsrc=r=44100:cl=stereo -c:v copy -c:a aac -shortest -movflags +faststart "${out}"`);
    console.log('ok', out);
  }
  await b.close();
})();
