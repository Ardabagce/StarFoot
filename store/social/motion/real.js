// Gerçek görüntülü reklam videosu: Mixkit (Free License, reklamda kullanılabilir, atıf gerekmez)
// futbol klipleri + oyunun gerçek ekran kaydı (telefonda) + kapanış kartı.
// Kullanım: node real.js <klip klasörü> <çıktı.mp4>
//  klip klasöründe Mixkit kimlikleriyle: 43490.mp4 43483.mp4 43501.mp4 43494.mp4 43495.mp4 43479.mp4 (720p)
//  indirme: https://assets.mixkit.co/videos/<id>/<id>-720.mp4
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const [, , CLIPS, OUT = path.join(__dirname, '../ads/gercek-hayal.mp4')] = process.argv;
const TMP = path.join(path.dirname(OUT), '_real');
const GAME = path.join(__dirname, '../work/tr-bjk-pen/moment'); // oyundaki penaltı anı (f0000.jpg…)
const ff = (args) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args]);
const ENC = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', '30'];
const GRADE = 'eq=contrast=1.1:saturation=1.15:brightness=-0.03,unsharp=5:5:0.7,vignette=PI/4.5';

// Sahneler: klip, başlangıç, süre, hız, yatay kırpma konumu (0..1), yazı, beyaz flaşla giriş
const SCENES = [
  { id: '43490', ss: 0.3, d: 2.6, sp: 1, x: 0.5, txt: 'hayal' },
  { id: '43483', ss: 0.5, d: 0.9, sp: 1, x: 0.35 },
  { id: '43501', ss: 2.0, d: 2.0, sp: 0.7, x: 0.58, txt: 'hala' },
  { id: '43494', ss: 0.0, d: 2.3, sp: 1, x: 0.33, txt: 'penalti' },
  { id: '43495', ss: 3.0, d: 1.1, sp: 0.8, x: 0.5, flash: true },
  { phone: true, d: 4.3, flash: true, txt: 'senvur' },
  { id: '43479', ss: 0.2, d: 1.7, sp: 0.8, x: 0.5, txt: 'kupa' },
];
const TEXTS = {
  hayal: ['ÇOCUKKEN HAYALİN', 'FUTBOLCU OLMAKTI.', 330],
  hala: ['', 'HÂLÂ ÖYLE.', 330],
  penalti: ['SON DAKİKA.', 'PENALTI SENDE.', 330],
  senvur: ['', 'ŞİMDİ SEN VUR', 260],
  kupa: ['BU SEFER', 'KUPAYI SEN KALDIR', 330],
};

(async () => {
  fs.rmSync(TMP, { recursive: true, force: true }); fs.mkdirSync(TMP, { recursive: true });
  // 1) yazı katmanları, telefon çerçevesi ve kapanış kartı (oyunun yazı tipleriyle canvas)
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await pg.goto('file://' + path.join(__dirname, 'ads.html'));
  await pg.evaluate(() => window.ready());
  const save = (f, data) => fs.writeFileSync(path.join(TMP, f), Buffer.from(data.split(',')[1], 'base64'));
  // iki satır: beyaz + altın; tek satır: büyük altın yazı
  for (const [k, [a, bb, y]] of Object.entries(TEXTS)) {
    save(`t_${k}.png`, await pg.evaluate(([a, bb, y]) => (a ? window.textLayer(a, bb, y) : window.textLayer(bb, null, y, 92, 150)), [a, bb, y]));
  }
  save('phone.png', await pg.evaluate(() => window.phoneLayer()));
  const PH = await pg.evaluate(() => window.PHONE);
  const ed = path.join(TMP, 'end'); fs.mkdirSync(ed);
  const endN = Math.round(3.4 * 30);
  for (let f = 0; f < endN; f++) save(`end/${String(f).padStart(4, '0')}.jpg`, await pg.evaluate((t) => { window.frame('end', t); return document.getElementById('cv').toDataURL('image/jpeg', 0.92); }, f / 30));
  await b.close();

  // 2) sahneler
  const parts = [];
  SCENES.forEach((s, i) => {
    const out = path.join(TMP, `s${i}.mp4`);
    const inTxt = s.txt ? ['-loop', '1', '-t', String(s.d), '-i', path.join(TMP, `t_${s.txt}.png`)] : [];
    const tf = s.txt ? `[1:v]format=rgba,fade=in:st=0.08:d=0.18:alpha=1,fade=out:st=${(s.d - 0.2).toFixed(2)}:d=0.18:alpha=1[tx];` : '';
    const fl = s.flash ? `,fade=in:st=0:d=0.22:color=white` : '';
    if (s.phone) {
      // arka plan: filenin arkasından bulanık gece sahası; ekranda oyunun penaltı anı
      const bgIn = ['-ss', '4.0', '-t', String(s.d / 0.8), '-i', path.join(CLIPS, '43495.mp4')];
      const gIn = ['-framerate', '30', '-i', path.join(GAME, 'f%04d.jpg')];
      const ph = ['-loop', '1', '-t', String(s.d), '-i', path.join(TMP, 'phone.png')];
      const sw = Math.round(PH.h * 1080 / 1920);
      const fc = `[0:v]setpts=PTS/0.8,fps=30,crop=405:720:(iw-405)*0.5:0,scale=1080:1920,boxblur=18:2,eq=brightness=-0.18:saturation=1.1,vignette=PI/4[bg];`
        + `[1:v]select='between(n\\,0\\,62)+between(n\\,118\\,184)',setpts=N/30/TB,scale=${sw}:${PH.h},crop=${PH.w}:${PH.h}[gm];`
        + `[bg][gm]overlay=${PH.x}:${PH.y}:shortest=1[a];[a][2:v]overlay=0:0[b];`
        + `[3:v]format=rgba,fade=in:st=0.15:d=0.2:alpha=1,fade=out:st=${(s.d - 0.25).toFixed(2)}:d=0.2:alpha=1[tx];[b][tx]overlay=0:0,trim=duration=${s.d}${fl}[v]`;
      ff([...bgIn, ...gIn, ...ph, '-loop', '1', '-t', String(s.d), '-i', path.join(TMP, `t_${s.txt}.png`), '-filter_complex', fc, '-map', '[v]', ...ENC, out]);
    } else {
      const src = path.join(CLIPS, `${s.id}.mp4`);
      const vert = s.id === '42541' || s.id === '2915';
      const crop = vert ? 'scale=1080:1920' : `crop=405:720:(iw-405)*${s.x}:0,scale=1080:1920:flags=lanczos`;
      const fc = `${tf}[0:v]setpts=PTS/${s.sp},fps=30,${crop},${GRADE},trim=duration=${s.d}${fl}[bv];` + (s.txt ? `[bv][tx]overlay=0:0,trim=duration=${s.d}[v]` : `[bv]null[v]`);
      ff(['-ss', String(s.ss), '-t', String(s.d / s.sp + 0.3), '-i', src, ...inTxt, '-filter_complex', fc, '-map', '[v]', ...ENC, out]);
    }
    parts.push(out);
  });
  const endMp4 = path.join(TMP, 'end.mp4');
  ff(['-framerate', '30', '-i', path.join(ed, '%04d.jpg'), '-vf', 'fade=in:st=0:d=0.25:color=white', ...ENC, endMp4]);
  parts.push(endMp4);

  // 3) birleştir
  const list = path.join(TMP, 'list.txt');
  fs.writeFileSync(list, parts.map((p) => `file '${p}'`).join('\n'));
  ff(['-f', 'concat', '-safe', '0', '-i', list, ...ENC, '-movflags', '+faststart', OUT]);
  ff(['-ss', '1.2', '-i', OUT, '-frames:v', '1', OUT.replace(/\.mp4$/, '-kapak.jpg')]);
  if (!process.env.KEEP) fs.rmSync(TMP, { recursive: true, force: true });
  console.log('->', OUT);
})();
