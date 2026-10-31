// Reklam videolarını kare kare çizip MP4 yapar.
// Kullanım: node render.js <id|all> <çıktı klasörü> [önizleme saniyeleri: 0.5,2,4]
// id: ig | yas | penalti
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

const FPS = 30;
const [, , which = 'all', outDir = path.join(__dirname, 'out'), preview] = process.argv;

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const errs = [];
  pg.on('pageerror', (e) => errs.push(e.message));
  pg.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await pg.goto('file://' + path.join(__dirname, process.env.PAGE || 'ads.html'));
  await pg.evaluate(() => window.ready());
  const ids = which === 'all' ? Object.keys(await pg.evaluate(() => Object.fromEntries(Object.entries(window.VIDEOS).map(([k, v]) => [k, v.dur])))) : [which];
  for (const id of ids) {
    const dur = await pg.evaluate((id) => window.VIDEOS[id].dur, id);
    if (preview) {
      for (const s of preview.split(',').map(Number)) {
        const data = await pg.evaluate(([id, s]) => { window.frame(id, s); return document.getElementById('cv').toDataURL('image/jpeg', 0.85); }, [id, s]);
        fs.writeFileSync(path.join(outDir, `${id}_${String(s).replace('.', '_')}.jpg`), Buffer.from(data.split(',')[1], 'base64'));
      }
      continue;
    }
    const fdir = path.join(outDir, id + '_frames');
    fs.rmSync(fdir, { recursive: true, force: true }); fs.mkdirSync(fdir);
    const n = Math.round(dur * FPS);
    for (let f = 0; f < n; f++) {
      const data = await pg.evaluate(([id, t]) => { window.frame(id, t); return document.getElementById('cv').toDataURL('image/jpeg', 0.92); }, [id, f / FPS]);
      fs.writeFileSync(path.join(fdir, String(f).padStart(4, '0') + '.jpg'), Buffer.from(data.split(',')[1], 'base64'));
    }
    const mp4 = path.join(outDir, id + '.mp4');
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(fdir, '%04d.jpg'),
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4]);
    // kapak: kanca karesi
    fs.copyFileSync(path.join(fdir, '0024.jpg'), path.join(outDir, id + '-kapak.jpg'));
    fs.rmSync(fdir, { recursive: true, force: true });
    console.log(id, n, 'kare ->', mp4);
  }
  if (errs.length) console.log('HATALAR:', [...new Set(errs)].slice(0, 10));
  await b.close();
})();
