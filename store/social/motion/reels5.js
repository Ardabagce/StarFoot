// Reels 5: "App Store Türkiye'de en çok oynanan oyunlar listesinde 8. sıradayız"
// Kanca (ilk 3 sn): liste yükselir → 8. sıra StarFoot parlar. Diğer oyunlar isimsiz/bulanık (marka yok).
// Render: cd store/social/motion && PAGE=reels5.html ASSETS=$PWD/assets4 COVER=60 node render_any.js r5_top8 ../reels5

// Sıralama listesi (App Store "En Çok Oynanan Oyunlar" görünümü)
const ROW = { x: 80, w: W - 160, h: 104, gap: 12 };
function chartList(t, top, hiK, zoom) {
  c.save();
  const cx = W / 2, cy = top + 4.5 * (ROW.h + ROW.gap);
  c.translate(cx, cy); c.scale(zoom, zoom); c.translate(-cx, -cy);
  // kart
  c.fillStyle = 'rgba(255,255,255,.96)'; rr(ROW.x - 30, top - 140, ROW.w + 60, 10 * (ROW.h + ROW.gap) + 170, 40); c.fill();
  txt('En Çok Oynanan Oyunlar', ROW.x, top - 76, 50, { align: 'left', color: '#111827', font: FONT_B, weight: 700, skew: 0, shadow: 0 });
  for (let i = 0; i < 10; i++) {
    const k = E.out(seg(t, 0.05 + i * 0.07, 0.35 + i * 0.07));
    if (k <= 0) continue;
    const y = top + i * (ROW.h + ROW.gap) + (1 - k) * 60;
    const me = i === 7;
    c.save(); c.globalAlpha *= k * (me ? 1 : 1 - 0.6 * hiK);
    if (me) {
      const p = 0.5 + 0.5 * Math.sin(t * 8);
      c.shadowColor = `rgba(255,190,40,${0.5 + 0.4 * hiK * p})`; c.shadowBlur = 30 + 40 * hiK;
      c.fillStyle = '#fff4cc'; rr(ROW.x - 14, y - 8, ROW.w + 28, ROW.h + 16, 26); c.fill();
      c.shadowBlur = 0; c.lineWidth = 6; c.strokeStyle = '#ffb703'; c.stroke();
    }
    txt(String(i + 1), ROW.x + 30, y + ROW.h / 2, 46, { color: me ? '#b45309' : '#6b7280', font: FONT_B, weight: 700, skew: 0, shadow: 0 });
    const ix = ROW.x + 80, is = 96, iy = y + (ROW.h - is) / 2;
    if (me && icon.complete) { c.save(); rr(ix, iy, is, is, 22); c.clip(); c.drawImage(icon, ix, iy, is, is); c.restore(); }
    else {
      // isimsiz, bulanık uygulama ikonu ve yazı çubukları
      const hue = (i * 47 + 12) % 360;
      const g = c.createLinearGradient(ix, iy, ix + is, iy + is); g.addColorStop(0, `hsl(${hue},70%,62%)`); g.addColorStop(1, `hsl(${(hue + 40) % 360},70%,45%)`);
      c.save(); c.filter = 'blur(6px)'; c.fillStyle = g; rr(ix, iy, is, is, 22); c.fill(); c.restore();
      c.fillStyle = '#d1d5db'; rr(ix + is + 30, y + 30, 260 + hash(i) * 200, 26, 13); c.fill();
      c.fillStyle = '#e5e7eb'; rr(ix + is + 30, y + 70, 150 + hash(i + 3) * 120, 20, 10); c.fill();
    }
    if (me) {
      txt('StarFoot: Futbol Kariyeri', ix + is + 30, y + 44, 46, { align: 'left', color: '#111827', font: FONT_B, weight: 700, skew: 0, shadow: 0 });
      txt('Türkiye’den bir indie oyun', ix + is + 30, y + 88, 34, { align: 'left', color: '#6b7280', font: FONT_B, weight: 600, skew: 0, shadow: 0 });
    }
    c.restore();
  }
  c.restore();
}
function chartBg(t) {
  const g = c.createRadialGradient(W / 2, H * 0.35, 80, W / 2, H * 0.5, H * 0.85);
  g.addColorStop(0, '#1d3f95'); g.addColorStop(0.5, '#0d1f4f'); g.addColorStop(1, '#030714');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  flashes(t, 4, 0.05, 0.25, 6);
}
// Yıldız puanı
function stars(x, y, s, n, alpha) {
  for (let i = 0; i < 5; i++) {
    const k = seg(alpha, i * 0.12, i * 0.12 + 0.3); if (k <= 0) continue;
    c.save(); c.globalAlpha = k; c.translate(x + (i - 2) * s * 1.15, y); c.scale(0.6 + 0.4 * E.back(k), 0.6 + 0.4 * E.back(k));
    c.beginPath(); for (let j = 0; j < 10; j++) { const r = j % 2 ? s * 0.22 : s * 0.5, a = -Math.PI / 2 + j * Math.PI / 5; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath();
    c.fillStyle = i < Math.floor(n) ? '#ffcf3f' : '#7a6a2a'; c.shadowColor = 'rgba(255,207,63,.6)'; c.shadowBlur = 24; c.fill(); c.restore();
  }
}

const vTop8 = timeline([
  // 0–1.6 sn: liste yükselir, kanca
  [1.6, (lt, d) => { chartBg(lt); chartList(lt, 740, 0, 1); chip('APP STORE · TÜRKİYE', 200, seg(lt, 0, 0.2)); txt('EN ÇOK OYNANAN', W / 2, 330, 104, { alpha: seg(lt, 0.05, 0.3), scale: 0.7 + 0.3 * E.back(seg(lt, 0.05, 0.4)) }); txt('OYUNLAR', W / 2, 450, 118, { grad: GOLD, alpha: seg(lt, 0.15, 0.4), scale: 0.7 + 0.3 * E.back(seg(lt, 0.15, 0.5)) }); }],
  // 1.6–3.2 sn: 8. sıra parlar, "8. SIRADAYIZ"
  [1.7, (lt, d) => {
    chartBg(lt + 1.6);
    chartList(2 + lt, 740, seg(lt, 0, 0.3), 1);
    flash(lt, 0.05, 0.2, 0.6); confetti(lt, 0.05, 120, ['#ffd84a', '#ffffff', '#ffb02e', '#7fb2ff']);
    const k = seg(lt, 0.1, 0.4);
    txt('8.', W / 2, 250, 240, { grad: GOLD, alpha: k, scale: 0.5 + 0.5 * E.back(k), stroke: 12, strokeColor: 'rgba(0,0,0,.35)' });
    txt('SIRADAYIZ!', W / 2, 455, 118, { alpha: seg(lt, 0.25, 0.5), scale: 0.7 + 0.3 * E.back(seg(lt, 0.25, 0.6)) });
  }],
  // Neden? Oyunun ekranları
  [2.3, (lt, d) => { darkBg(GOLDP, 'KARİYER', lt); whoosh(lt); phoneShot('mv_val', lt, d, { sy: 0.3, zoom0: 1.0, zoom1: 1.08 }); cap(lt, d, 'NEDEN Mİ?', 'KARİYERİ SEN YAZIYORSUN', 230, 86, 104); }],
  [2.2, (lt, d) => { darkBg(BLUE, 'STARFEED', lt); whoosh(lt); phoneShot('post_trophy', lt, d, { sy: 0.3, zoom0: 1.04, zoom1: 1.1 }); cap(lt, d, 'KUPALAR, ŞÖHRET', 'VE MİLYONLARCA TAKİPÇİ', 230, 86, 104); }],
  [2.4, (lt, d) => {
    chartBg(lt); confetti(lt, -0.4, 50, ['#ffd84a', '#ffffff', '#7fb2ff']);
    const k = seg(lt, 0, 0.35);
    txt('TEŞEKKÜRLER!', W / 2, 640, 150, { grad: GOLD, alpha: k, scale: 0.7 + 0.3 * E.back(k) });
    stars(W / 2, 880, 120, 5, seg(lt, 0.25, 1.2));
    txt('4,75 puan · App Store', W / 2, 1020, 60, { font: FONT_B, weight: 700, skew: 0, alpha: seg(lt, 0.7, 1.0) });
    txt('Bu başarı oynayan herkesin', W / 2, 1220, 62, { font: FONT_B, weight: 700, skew: 0, alpha: seg(lt, 1.0, 1.3) });
    txt('SİZİN SAYENİZDE', W / 2, 1320, 100, { alpha: seg(lt, 1.2, 1.5), scale: 0.8 + 0.2 * E.back(seg(lt, 1.2, 1.6)) });
  }],
  [3.4, (lt) => endBio4(lt, 'SEN DE ARAMIZA KATIL')],
]);

Object.assign(VIDEOS, { r5_top8: { dur: vTop8.dur, f: vTop8 } });
['r4_deger', 'r4_roportaj', 'r4_profil'].forEach((k) => delete VIDEOS[k]);
const _pre4 = window.preload;
window.preload = () => _pre4().then(() => new Promise((r) => (icon.complete ? r() : (icon.onload = r))));
