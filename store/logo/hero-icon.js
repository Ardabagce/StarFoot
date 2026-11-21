const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 400, height: 400 } });
  const errs = []; pg.on('pageerror', (e) => errs.push(e.message));
  await pg.goto('http://localhost:8765/oyna-r8k4tq.html'); await pg.waitForTimeout(1200);
  const variants = JSON.parse(process.argv[3] || '[]');
  for (const v of variants) {
    const data = await pg.evaluate((v) => {
      const S = 1024, cv = document.createElement('canvas'); cv.width = cv.height = S; const c = cv.getContext('2d');
      // arka plan: koyu lacivert + spot ışığı
      const g = c.createRadialGradient(S / 2, S * 0.18, 40, S / 2, S * 0.45, S * 0.9);
      g.addColorStop(0, v.bg1 || '#2b56c8'); g.addColorStop(0.55, v.bg2 || '#0d1f5c'); g.addColorStop(1, '#050b24');
      c.fillStyle = g; c.fillRect(0, 0, S, S);
      c.save(); c.globalAlpha = 0.22; c.fillStyle = '#9ec2ff';
      c.beginPath(); c.moveTo(S * 0.38, 0); c.lineTo(S * 0.62, 0); c.lineTo(S * 0.95, S); c.lineTo(S * 0.05, S); c.closePath(); c.fill(); c.restore();
      // konfeti
      if (v.conf) { const cols = ['#ffcf3f', '#ffffff', '#ff5a5a']; for (let i = 0; i < 40; i++) { c.save(); c.translate((i * 197) % S, (i * 331) % (S * 0.6)); c.rotate(i); c.fillStyle = cols[i % 3]; c.globalAlpha = 0.85; c.fillRect(-9, -4, 18, 8); c.restore(); } }
      const kit = { shirt: v.shirt || '#d7263d', shorts: v.shorts || '#ffffff', socks: v.socks || '#d7263d', trim: '#ffcf3f', number: '#ffffff', sleeve: v.shirt || '#d7263d' };
      const look = Object.assign({}, Sprites.me ? Sprites.me() : {}, v.look || {});
      const h = v.h || 1500, px = S / 2, py = v.py || S * 1.42;
      Celebrate.fig(c, px, py, h, { kit, look, number: 10, armA: 2.85 });
      const ty = py - h * (v.ty || 1.12), cs = h * (v.cs || 0.19);
      SocialArt.glow(c, px, ty, h * 0.45, 'rgba(255,220,120,0.6)', 1);
      SocialArt.trophyCup(c, px, ty, cs);
      return cv.toDataURL('image/png');
    }, v);
    require('fs').writeFileSync(process.argv[2] + '/' + v.name + '.png', Buffer.from(data.split(',')[1], 'base64'));
  }
  console.log('ERR', JSON.stringify(errs)); await b.close();
})();
