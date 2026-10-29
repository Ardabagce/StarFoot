// App Store uygulama içi etkinlik görselleri (yazısız, her dilde kullanılır): oyunun çizimleri.
for (const k in VIDEOS) delete VIDEOS[k];
const GOLDK = { id: 'STR', c1: '#0d1b4a', c2: '#ffcf3f' };
// 1) Yıldız gibi yaşa: takım elbiseli yıldız, foto flaşları, altın yıldız
function evStar(t) {
  drawBg(bgBackdrop({ id: 'GLD', c1: '#7a5a12', c2: '#ffffff' }, 'STARFOOT'), 1.08);
  c.fillStyle = 'rgba(3,6,18,.45)'; c.fillRect(0, 0, W, H);
  flashes(t, 22, 0.15, 0.75, 6);
  const g = c.createRadialGradient(W / 2, H * 0.36, 40, W / 2, H * 0.4, 700);
  g.addColorStop(0, 'rgba(255,207,63,.55)'); g.addColorStop(1, 'rgba(255,207,63,0)');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // altın yıldız (arka)
  c.save(); c.translate(W / 2, H * 0.33); c.fillStyle = '#ffcf3f'; c.shadowColor = 'rgba(255,190,40,.8)'; c.shadowBlur = 80;
  c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 150 : 360; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); c.restore();
  groundShadow(W / 2, H * 0.92, 240);
  fig(W / 2, H * 0.95, 1100, { kit: kitOf({ id: 'STR', c1: '#13235c', c2: '#ffcf3f' }), number: 10, armA: 2.5 });
  verified(W / 2 + 250, H * 0.47, 80, 1.1);
  confetti(t, 0, 90, ['#ffd84a', '#ffffff', '#ffb02e']);
  vignette(0.5);
}
// 2) Dünya Şampiyonası: milli formalı oyuncu kupayı kaldırıyor
function evWC(t) {
  drawBg(bgStadium(GOLDK, false, 6), 1.06);
  flashes(t, 14);
  const fx = W / 2, fy = H * 0.98, fh = 1050;
  groundShadow(fx, fy, 260);
  fig(fx, fy, fh, { kit: kitOf({ id: 'NAT', c1: '#ffffff', c2: '#c9a227' }), number: 10, dive: 1 });
  SocialArt.trophyCup(c, fx, fy - fh * 1.22, 160);
  confetti(t, 0, 160, ['#ffd84a', '#ffffff', '#febe10', '#ffb02e']);
  vignette(0.5);
}
VIDEOS.evstar = { dur: 2, f: evStar };
VIDEOS.evwc = { dur: 2, f: evWC };
window.preload = () => Promise.resolve();
