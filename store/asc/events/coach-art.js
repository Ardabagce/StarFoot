// "Teknik Direktör" uygulama içi etkinliği görselleri (yazısız): node store/asc/events/coach-art.js
// coach-card.jpg 1920x1080 ve coach-details.jpg 1080x1920. Yerel sunucu gerekir: python3 -m http.server 8765
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  for (const [name, W, H] of [['coach-card', 1920, 1080], ['coach-details', 1080, 1920]]) {
    const pg = await b.newPage({ viewport: { width: W, height: H } });
    await pg.goto('http://localhost:8765/oyna-r8k4tq.html');
    await pg.waitForTimeout(700);
    const data = await pg.evaluate(([W, H]) => {
      document.body.innerHTML = `<canvas id="cv" width="${W}" height="${H}"></canvas>`;
      const c = document.getElementById('cv').getContext('2d');
      const P = { c1: '#c8102e', c2: '#ffcf3f' };
      SocialArt.stadium(c, W, H, SocialArt.rng(19), P, false);
      const wide = W > H;
      // akşam ışığı ve hafif bulanık derinlik
      const g = c.createRadialGradient(W * 0.5, H * 0.15, 40, W * 0.5, H * 0.4, Math.max(W, H));
      g.addColorStop(0, 'rgba(255,240,200,.18)'); g.addColorStop(1, 'rgba(0,0,0,.35)');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      // teknik alan çizgisi
      const gy = H * (wide ? 0.97 : 0.9);
      c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 6; c.setLineDash([26, 22]);
      c.beginPath(); c.moveTo(0, gy - H * 0.06); c.lineTo(W, gy - H * 0.06); c.stroke(); c.setLineDash([]);
      // arka planda oyuncular (bulanık)
      c.save(); c.filter = 'blur(3px)'; c.globalAlpha = 0.85;
      const pk = Sprites.kit({ id: 'X', c1: P.c1, c2: P.c2 }, false), ok = Sprites.kit({ id: 'Y', c1: '#1e5bd8', c2: '#ffffff' }, false);
      [[0.84, 0.66, pk, 1.2], [0.93, 0.6, ok, 2.4]].forEach(([x, y, k, run], i) => {
        if (!wide && x < 0.5) return;
        Sprites.figure(c, W * (wide ? x : x - 0.05), H * y, H * (wide ? 0.22 : 0.13), { kit: k, look: Sprites.look(i + 3), facing: 'down', number: 7 + i, run, speed: 0.9, t: 0 });
      });
      c.restore();
      // taktik tahtası
      const bw = wide ? 560 : 520, bh = bw * 0.68, bx = wide ? W * 0.07 : W * 0.5 - bw / 2, by = wide ? H * 0.3 : H * 0.07;
      c.save(); c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 40; c.fillStyle = '#1f6b3e'; c.fillRect(bx, by, bw, bh); c.restore();
      c.strokeStyle = '#e8eef5'; c.lineWidth = 10; c.strokeRect(bx, by, bw, bh);
      c.lineWidth = 4; c.strokeStyle = 'rgba(255,255,255,.8)';
      c.beginPath(); c.moveTo(bx + bw / 2, by); c.lineTo(bx + bw / 2, by + bh); c.stroke();
      c.beginPath(); c.arc(bx + bw / 2, by + bh / 2, bh * 0.16, 0, Math.PI * 2); c.stroke();
      c.strokeRect(bx, by + bh * 0.28, bw * 0.12, bh * 0.44); c.strokeRect(bx + bw * 0.88, by + bh * 0.28, bw * 0.12, bh * 0.44);
      const dots = [[0.12, 0.5], [0.27, 0.2], [0.27, 0.4], [0.27, 0.6], [0.27, 0.8], [0.45, 0.3], [0.45, 0.5], [0.45, 0.7], [0.65, 0.22], [0.68, 0.5], [0.65, 0.78]];
      dots.forEach(([x, y]) => { c.fillStyle = '#ffcf3f'; c.beginPath(); c.arc(bx + bw * x, by + bh * y, 13, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#0b1020'; c.lineWidth = 3; c.stroke(); });
      // ok: hücum yönü
      c.strokeStyle = '#ffffff'; c.lineWidth = 6; c.beginPath(); c.moveTo(bx + bw * 0.45, by + bh * 0.5); c.quadraticCurveTo(bx + bw * 0.6, by + bh * 0.35, bx + bw * 0.8, by + bh * 0.42); c.stroke();
      c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(bx + bw * 0.83, by + bh * 0.43); c.lineTo(bx + bw * 0.78, by + bh * 0.36); c.lineTo(bx + bw * 0.77, by + bh * 0.47); c.closePath(); c.fill();
      // takım elbiseli teknik direktör
      const kit = { shirt: '#1d2433', alt: '#ffffff', pattern: 'plain', shorts: '#1d2433', socks: '#1d2433', pants: '#1d2433', coat: 'suit', tie: P.c1 };
      const look = { skin: SKINS[2], hair: HAIRS[1], style: 'short', beard: 'stubble', boots: '#111' };
      const fh = wide ? H * 0.8 : H * 0.52, fx = wide ? W * 0.6 : W * 0.5;
      Sprites.figure(c, fx, gy, fh, { kit, look, facing: 'down', number: null, t: 0, longSleeve: true });
      return document.getElementById('cv').toDataURL('image/jpeg', 0.92);
    }, [W, H]);
    fs.writeFileSync(path.join(__dirname, name + '.jpg'), Buffer.from(data.split(',')[1], 'base64'));
    console.log(name);
    await pg.close();
  }
  await b.close();
})();
