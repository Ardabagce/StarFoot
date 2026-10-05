// Android ikon ve açılış ekranı görsellerini oyunun ikonundan üretir: node make-icons.js (Playwright gerekir)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const RES = path.join(__dirname, 'android/app/src/main/res');
const svg = (f) => fs.readFileSync(path.join(__dirname, '..', 'icons', f), 'utf8');
const page = (inner, w, h, bg = 'transparent') => `<!doctype html><html><body style="margin:0;width:${w}px;height:${h}px;background:${bg};overflow:hidden">${inner}</body></html>`;
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage();
  const render = async (html, w, h, out) => {
    await pg.setViewportSize({ width: w, height: h });
    await pg.setContent(html); await pg.waitForTimeout(150);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await pg.screenshot({ path: out, omitBackground: true });
  };
  const full = svg('icon.svg').replace('<svg ', '<svg width="100%" height="100%" style="display:block" ');
  const mask = svg('icon-maskable.svg').replace('<svg ', '<svg width="100%" height="100%" style="display:block" ');
  const dens = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
  for (const [d, k] of Object.entries(dens)) {
    const s = Math.round(48 * k), f = Math.round(108 * k);
    await render(page(full, s, s), s, s, path.join(RES, `mipmap-${d}/ic_launcher.png`));
    await render(page(`<div style="width:${s}px;height:${s}px;border-radius:50%;overflow:hidden">${mask}</div>`, s, s), s, s, path.join(RES, `mipmap-${d}/ic_launcher_round.png`));
    await render(page(mask, f, f), f, f, path.join(RES, `mipmap-${d}/ic_launcher_foreground.png`));
    // açılış ekranı
    for (const [o, w, h] of [['port', 320, 480], ['land', 480, 320]]) {
      const W = Math.round(w * k), H = Math.round(h * k), z = Math.min(W, H);
      const logo = `<div style="display:flex;align-items:center;justify-content:center;flex-direction:column;width:${W}px;height:${H}px;font:italic 900 ${z * 0.16}px/1 'Arial Black',Arial,sans-serif;color:#f3f1ea;letter-spacing:-.02em"><div style="width:${z * 0.34}px;height:${z * 0.34}px;margin-bottom:${z * 0.05}px">${full}</div><div>STAR<span style="color:#ffcf3f">FOOT</span></div></div>`;
      await render(page(logo, W, H, '#0a1530'), W, H, path.join(RES, `drawable-${o}-${d}/splash.png`));
    }
  }
  // iOS: 1024 uygulama simgesi (köşesiz kare, şeffaflık yok) ve 2732 açılış ekranı
  const IOS = path.join(__dirname, 'ios/App/App/Assets.xcassets');
  if (fs.existsSync(IOS)) {
    const sq = svg('icon.svg').replace(' rx="112"', '').replace('<svg ', '<svg width="100%" height="100%" style="display:block" ');
    await render(page(sq, 1024, 1024, '#0a1530'), 1024, 1024, path.join(IOS, 'AppIcon.appiconset/AppIcon-512@2x.png'));
    const Z = 2732, logo = `<div style="display:flex;align-items:center;justify-content:center;flex-direction:column;width:${Z}px;height:${Z}px;font:italic 900 ${Z * 0.07}px/1 'Arial Black',Arial,sans-serif;color:#f3f1ea"><div style="width:${Z * 0.16}px;height:${Z * 0.16}px;margin-bottom:${Z * 0.025}px">${full}</div><div>STAR<span style="color:#ffcf3f">FOOT</span></div></div>`;
    for (const n of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']) await render(page(logo, Z, Z, '#0a1530'), Z, Z, path.join(IOS, 'Splash.imageset', n));
  }
  await render(page(`<div style="display:flex;align-items:center;justify-content:center;width:480px;height:320px;font:italic 900 64px 'Arial Black',Arial;color:#f3f1ea">STAR<span style="color:#ffcf3f">FOOT</span></div>`, 480, 320, '#0a1530'), 480, 320, path.join(RES, 'drawable/splash.png'));
  await b.close();
  console.log('ikonlar ve açılış ekranları üretildi');
})();
