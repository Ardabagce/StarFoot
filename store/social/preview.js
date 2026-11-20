// App Store tanıtım videosu (App Preview): 886x1920, 30 fps, ~28 sn, yalnız oyun görüntüsü + kısa yazılar.
// Önce: PREVIEW=1 node store/social/clips.js <dil> <work>  ve  PREVIEW=1 node store/social/preview_clips.js <dil> <work>
// Sonra: node store/social/preview.js <dil> <work>
// Apple kuralı: fiyat, "indir" çağrısı ya da başka cihaz görüntüsü yok; kapanışta yalnız ikon ve ad.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { fontCss } = require('./rec');
const lang = process.argv[2] || 'tr';
const WORK = process.argv[3] || path.join(__dirname, 'work', 'pv-' + lang);
const OUT = process.argv[4] || path.join(__dirname, `../asc/preview/preview-${lang}.mp4`);
const ICON = path.join(__dirname, '../../app/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png');
const W = 886, H = 1920;

const T = {
  tr: { caps: [['KRİTİK ANLARI', 'SEN OYNA'], ['GOL', 'TEKRARI'], ['PENALTILARDA', 'SEN VARSIN'], ['KALECİ OLARAK', 'DA OYNA'], ['TELEFONUNDA', 'KOCA HAYAT'], ['KENDİ', 'SOSYAL MEDYAN'], ['EFSANE', 'SAYFAN'], ['DEV', 'TRANSFERLER'], ['ALTIN YILDIZ', 'SENİN']], tag: 'Sokaktan efsaneye' },
  en: { caps: [['PLAY THE', 'BIG MOMENTS'], ['SLOW-MO', 'REPLAYS'], ['WIN THE', 'SHOOTOUT'], ['PLAY AS THE', 'GOALKEEPER'], ['A WHOLE LIFE', 'IN YOUR PHONE'], ['YOUR OWN', 'SOCIAL FEED'], ['YOUR LEGEND', 'PAGE'], ['RECORD', 'TRANSFERS'], ['WIN THE', 'GOLDEN STAR']], tag: 'From the streets to legend' },
}[lang];

const base = `${fontCss}*{margin:0;padding:0;box-sizing:border-box}body{width:${W}px;height:${H}px;overflow:hidden;position:relative;color:#fff}`;
// üstte koyu şerit ve iki satırlık büyük yazı (oyun arayüzünün üst çubuğunun altında)
const capHtml = ([a, b], top = 170) => `<!doctype html><html><head><meta charset="utf-8"><style>${base}body{background:transparent}
.band{position:absolute;left:0;right:0;top:${top - 80}px;height:420px;background:linear-gradient(180deg,rgba(2,5,15,0) 0%,rgba(2,5,15,.82) 25%,rgba(2,5,15,.82) 75%,rgba(2,5,15,0) 100%)}
.h{position:absolute;left:40px;right:40px;top:${top}px;text-align:center;font-family:'Saira Condensed';font-weight:900;font-style:italic;text-transform:uppercase;transform:skewX(-6deg)}
.h .a{display:block;font-size:72px;letter-spacing:.02em}
.h .b{display:block;font-size:118px;line-height:.95;margin-top:6px;background:linear-gradient(180deg,#fff3c2,#ffcf3f 55%,#e39a12);-webkit-background-clip:text;color:transparent;filter:drop-shadow(0 8px 24px rgba(0,0,0,.5))}
</style></head><body><div class="band"></div><div class="h"><span class="a">${a}</span><span class="b">${b}</span></div></body></html>`;
const endHtml = (icon) => `<!doctype html><html><head><meta charset="utf-8"><style>${base}
body{background:radial-gradient(120% 70% at 50% 35%,#1b3a8a 0%,#0d1f4f 45%,#050b1f 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:40px}
img{width:330px;height:330px;border-radius:74px;box-shadow:0 30px 90px rgba(255,207,63,.35)}
.n{font-family:'Saira Condensed';font-weight:900;font-style:italic;font-size:150px;transform:skewX(-6deg)}.n span{color:#ffcf3f}
.t{font-family:'Barlow Semi Condensed';font-weight:600;font-size:56px;color:#cdd7f4}
</style></head><body><img src="${icon}"><div class="n">STAR<span>FOOT</span></div><div class="t">${T.tag}</div></body></html>`;

(async () => {
  const tmp = path.join(WORK, '_pv'); fs.mkdirSync(tmp, { recursive: true }); fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: W, height: H } });
  const shot = async (html, file, transparent = true) => {
    const f = path.join(tmp, '_p.html'); fs.writeFileSync(f, html);
    await pg.goto('file://' + f); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(100);
    await pg.screenshot({ path: file, omitBackground: transparent });
  };
  const TOPS = [1360, 1360, 1330, 760, 170, 1330, 170, 170, 170];
  for (const [i, c] of T.caps.entries()) await shot(capHtml(c, TOPS[i]), path.join(tmp, `cap${i}.png`));
  await shot(endHtml('file://' + ICON), path.join(tmp, 'end.png'), false);
  await b.close();

  // [klasör, başlangıç karesi, kare sayısı, yazı]
  // [klasör, başlangıç karesi, kare sayısı, yazı (-1: yazısız)]
  // açılış: penaltı golü, ağır çekim tekrar ve sevinç; ardından 1.0.26 ile gelen yenilikler
  const segs = [
    ['moment', 12, 62, 0],
    ['moment', 112, 30, 1],
    ['moment', 200, 48, -1],
    ['pso', 0, 108, 2],
    ['gk', 25, 75, 3],
    ['phone', 0, 75, 4],
    ['ig', 0, 90, 5],
    ['wiki', 0, 80, 6],
    ['airport', 0, 90, 7],
    ['ballon', 0, 100, -1],
  ];
  const parts = [];
  const enc = '-c:v libx264 -preset medium -crf 17 -pix_fmt yuv420p -r 30 -an';
  segs.forEach(([dir, st, n, ci], i) => {
    const o = path.join(tmp, `s${i}.mp4`);
    if (ci < 0) { execSync(`ffmpeg -loglevel error -y -framerate 30 -start_number ${st} -i "${path.join(WORK, dir)}/f%04d.jpg" -vf "scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1" -frames:v ${n} ${enc} "${o}"`); parts.push(o); return; }
    execSync(`ffmpeg -loglevel error -y -framerate 30 -start_number ${st} -i "${path.join(WORK, dir)}/f%04d.jpg" -loop 1 -t ${n / 30} -i "${path.join(tmp, `cap${ci}.png`)}" -filter_complex "[0]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1[v];[1]format=rgba,fade=in:st=0:d=0.2:alpha=1[c];[v][c]overlay=0:0:shortest=1" -frames:v ${n} ${enc} "${o}"`);
    parts.push(o);
  });
  const eo = path.join(tmp, 'end.mp4');
  execSync(`ffmpeg -loglevel error -y -loop 1 -t 2.5 -i "${path.join(tmp, 'end.png')}" -vf "fade=in:st=0:d=0.3" -frames:v 75 ${enc} "${eo}"`);
  parts.push(eo);
  fs.writeFileSync(path.join(tmp, 'list.txt'), parts.map((p) => `file '${p}'`).join('\n'));
  const silent = path.join(tmp, 'v.mp4');
  execSync(`ffmpeg -loglevel error -y -f concat -safe 0 -i "${path.join(tmp, 'list.txt')}" -c copy "${silent}"`);
  // ses: geçişlerde hafif whoosh, golde ve kurtarışta tribün, kapanışta chime (sentez, telif yok)
  const cuts = []; let acc = 0; segs.forEach(([, , n]) => { cuts.push(acc / 30); acc += n; }); cuts.push(acc / 30);
  const dur = acc / 30 + 2.5;
  const S = {
    whoosh: 'anoisesrc=d=0.45:c=pink:a=0.35:r=48000,bandpass=f=1400:w=1800,afade=in:d=0.22,afade=out:st=0.22:d=0.23',
    crowd: 'anoisesrc=d=2.6:c=pink:a=0.3:r=48000,bandpass=f=900:w=1400,afade=in:d=0.25,afade=out:st=1.2:d=1.4',
    hum: `anoisesrc=d=${dur}:c=brown:a=0.08:r=48000,lowpass=f=500`,
    chime: "aevalsrc='0.2*(sin(2*PI*1047*t)*exp(-t*3)+sin(2*PI*1319*t)*exp(-(t-0.12)*3)*gt(t,0.12)+sin(2*PI*1568*t)*exp(-(t-0.24)*3)*gt(t,0.24))':s=48000:d=1.8",
  };
  const cues = [['hum', 0], ['crowd', 1.4], ...cuts.slice(3, -1).map((t) => ['whoosh', t - 0.1]), ['crowd', cuts[2]], ['crowd', cuts[3] + 2.4], ['crowd', cuts[4] + 0.6], ['crowd', cuts[9] + 0.2], ['chime', cuts[10] + 0.2]];
  const ins = cues.map(([k]) => `-f lavfi -i "${S[k]}"`).join(' ');
  const mix = cues.map(([, t], i) => `[${i + 1}]aformat=channel_layouts=stereo,adelay=${Math.round(Math.max(0, t) * 1000)}|${Math.round(Math.max(0, t) * 1000)}[a${i}]`).join(';');
  execSync(`ffmpeg -loglevel error -y -i "${silent}" ${ins} -filter_complex "${mix};${cues.map((_, i) => `[a${i}]`).join('')}amix=inputs=${cues.length}:normalize=0:duration=longest,atrim=0:${dur},alimiter=limit=0.9[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 256k -ar 48000 -ac 2 -t ${dur} -movflags +faststart "${OUT}"`);
  console.log('ok', OUT, dur.toFixed(1) + ' sn');
})();
