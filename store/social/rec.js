// Ortak: oyunu 1080x1920 (9:16) telefon görünümünde açar ve CDP screencast ile kare kaydeder
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '../..');
const FD = 'file://' + path.join(ROOT, 'store/premium/fonts');
const fontCss = [['Saira Condensed', 'saira-condensed', [600, 800, 900]], ['Barlow Semi Condensed', 'barlow-semi-condensed', [400, 500, 600, 700]]]
  .flatMap(([fam, f, ws]) => ws.flatMap((w) => ['latin', 'latin-ext'].map((sub) => `@font-face{font-family:'${fam}';font-weight:${w};font-style:normal;src:url('${FD}/${f}-${sub}-${w}-normal.woff2') format('woff2');}`))).join('');
const VW = 390, VH = 693, DPR = 1080 / 390;

async function open(b, lang, seed = 7, size) {
  const sz = size || { w: VW, h: VH, dpr: DPR };
  const pg = await b.newPage({ viewport: { width: sz.w, height: sz.h }, deviceScaleFactor: sz.dpr, hasTouch: false, isMobile: false });
  pg.errs = []; pg.on('pageerror', (e) => pg.errs.push(e.message));
  await pg.clock.install();
  // tekrarlanabilir sahneler için sabit tohumlu rastgele sayı
  await pg.addInitScript((seed) => { let a = seed; Math.random = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }, seed);
  await pg.addInitScript((css) => { document.addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); }); }, fontCss);
  await pg.goto('file://' + path.join(ROOT, 'oyna-r8k4tq.html'));
  await pg.evaluate((l) => { localStorage.clear(); localStorage.setItem('starfoot_lang', l); }, lang); await pg.reload();
  await pg.evaluate(() => document.fonts.ready);
  // saat yalnız runFor ile ilerlesin (gerçek zaman akmasın)
  await pg.clock.pauseAt(Date.now() + 2000);
  return pg;
}

// Sanal saatle kare kare kayıt: her karede oyun saati 1/30 sn ilerletilir ve yüksek çözünürlüklü ekran görüntüsü alınır.
// acts: { kareNo: async () => {...} } kayıt sırasında o karede çalışır.
async function record(pg, dir, dur, acts = {}) {
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const n = Math.round(dur * 30);
  // requestAnimationFrame'i elle sürüyoruz: ekran görüntüsü alırken fazladan kare çalışıp animasyon hızlanmasın
  await pg.evaluate(() => {
    if (window.__flush) return;
    let q = [];
    window.requestAnimationFrame = (cb) => { q.push(cb); return q.length; };
    window.cancelAnimationFrame = () => {};
    window.__flush = () => { const c = q; q = []; const now = performance.now(); c.forEach((f) => { try { f(now); } catch (e) { console.error(e); } }); };
  });
  for (let i = 0; i < n; i++) {
    if (acts[i]) await acts[i]();
    await pg.clock.runFor(1000 / 60); await pg.evaluate(() => window.__flush());
    await pg.clock.runFor(1000 / 60); await pg.evaluate(() => window.__flush());
    await pg.screenshot({ path: path.join(dir, `f${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 92 });
  }
  return n;
}

module.exports = { chromium, open, record, ROOT, fontCss, VW, VH };
