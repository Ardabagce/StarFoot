// App Store ürün sayfası başlığı (21:9, 3840x1646) ve arama sonucu görseli (3:2, 1920x1280), 1.0.11 sürümü
// Sağda yenilenmiş stadyumda kupa töreni, solda büyük başlık. Görsel (.jpg) + 8 sn döngülü video (.mp4)
// Kullanım: LANGS=tr,en node store/premium/header2.js   (NOVIDEO=1 yalnız görsel)
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { chromium, open, record } = require('../social/rec');
const OUT = path.join(__dirname, 'header');
const TMP = path.join(OUT, '_frames');
fs.mkdirSync(OUT, { recursive: true });
const T = {
  tr: { a: 'SOKAKTAN', b: 'EFSANEYE', sub: 'Kendi futbol kariyerini yaz: kritik anları sen oyna, kupaları sen kaldır.', pills: ['Maç radarı', 'Dünya Şampiyonası', 'Game Center'] },
  en: { a: 'FROM THE STREETS', b: 'TO LEGEND', sub: 'Write your own football career: play the big moments, lift the trophies.', pills: ['Match radar', 'World Championship', 'Game Center'] },
  es: { a: 'DE LA CALLE', b: 'A LA LEYENDA', sub: 'Escribe tu carrera de fútbol: juega los momentos clave y levanta los trofeos.', pills: ['Radar del partido', 'Campeonato Mundial', 'Game Center'] },
  de: { a: 'VOM BOLZPLATZ', b: 'ZUR LEGENDE', sub: 'Schreib deine eigene Fußballkarriere: spiel die großen Momente, stemm die Pokale.', pills: ['Spielradar', 'Weltmeisterschaft', 'Game Center'] },
};
const SIZES = [
  { id: 'header', w: 1920, h: 823, dpr: 2, W: 3840, H: 1646 },
  { id: 'search', w: 960, h: 640, dpr: 2, W: 1920, H: 1280 },
];

const overlay = (t, z) => {
  const wide = z.id === 'header';
  return `
  .ct-foot{display:none!important}
  body{background:#030818!important} .screen,#hub,.topbar,#tabs{visibility:hidden!important}
  ${wide ? '.cer-trophy{left:38%!important;background:#030818}' : '.cer-trophy{top:24%!important;background:#030818} #hd p{display:none}'}
  #hd{position:fixed;z-index:500;pointer-events:none;font-family:'Barlow Semi Condensed',sans-serif;color:#fff;
    ${wide ? 'left:0;top:0;bottom:0;width:56%;padding:0 0 0 120px;display:flex;flex-direction:column;justify-content:center;background:linear-gradient(90deg,#030818 0%,#050d28 66%,rgba(5,13,40,.7) 80%,rgba(5,13,40,0) 100%)'
      : 'left:0;right:0;top:0;padding:26px 30px 0;text-align:center;background:linear-gradient(180deg,#030818 0%,#030818 58%,rgba(3,8,24,.75) 78%,rgba(3,8,24,0) 100%);height:250px'}}
  #hd .lg{font-family:'Saira Condensed';font-weight:900;font-style:italic;font-size:${wide ? 44 : 30}px;transform:skewX(-8deg);display:inline-block;letter-spacing:.02em}
  #hd .lg span{color:#ffcf3f}
  #hd h1{font-family:'Saira Condensed';font-weight:900;font-style:italic;text-transform:uppercase;line-height:.9;margin:${wide ? 18 : 6}px 0 0;transform:skewX(-6deg);transform-origin:left}
  #hd h1 i{display:block;font-style:italic;font-size:${wide ? (t.a.length > 11 ? 112 : 136) : (t.a.length > 11 ? 62 : 74)}px;text-shadow:0 6px 30px rgba(0,0,0,.5)}
  #hd h1 em{display:block;font-style:italic;font-size:${wide ? (t.b.length > 11 ? 112 : 136) : (t.b.length > 11 ? 62 : 74)}px;background:linear-gradient(180deg,#fff3c2 0%,#ffcf3f 55%,#e39a12 100%);-webkit-background-clip:text;color:transparent;filter:drop-shadow(0 8px 24px rgba(0,0,0,.45))}
  #hd p{margin:${wide ? 22 : 10}px 0 0;max-width:${wide ? 760 : 900}px;font-size:${wide ? 30 : 19}px;line-height:1.3;color:#d4dcf5;${wide ? '' : 'margin-inline:auto;'}}
  #hd .pl{display:flex;gap:14px;margin-top:${wide ? 30 : 12}px;${wide ? '' : 'justify-content:center;'}}
  #hd .pl b{padding:${wide ? '12px 22px' : '7px 14px'};border-radius:999px;font-size:${wide ? 24 : 15}px;font-weight:700;letter-spacing:.04em;background:rgba(255,255,255,.1);border:2px solid rgba(255,207,63,.45);color:#ffe9a8;white-space:nowrap}
  ${wide ? '' : '#hd .pl{position:fixed;left:0;right:0;bottom:22px}'}`;
};

(async () => {
  const b = await chromium.launch();
  for (const lang of (process.env.LANGS || 'tr,en,es,de').split(',')) {
    const t = T[lang];
    if (!t) continue;
    for (const z of SIZES) {
      const pg = await open(b, lang, 11, z);
      await pg.clock.runFor(500);
      // tören oyuncu bilgisini kariyerden okur: arka planda bir kariyer aç
      await pg.click('[data-new="0"]'); await pg.click('#cr-go'); await pg.clock.runFor(400);
      await pg.evaluate(() => { const m = document.getElementById('modal'); if (m) m.classList.add('hidden'); Game.p.surname = 'STAR'; });
      await pg.evaluate(({ css, t }) => {
        const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
        Sprites.atmo = { lvl: 1, star: true, youth: false, photogs: 8, club: 'STARFOOT' };
        const d = document.createElement('div'); d.id = 'hd';
        d.innerHTML = `<div class="lg">STAR<span>FOOT</span></div><h1><i>${t.a}</i><em>${t.b}</em></h1><p>${t.sub}</p><div class="pl">${t.pills.map((x) => `<b>${x}</b>`).join('')}</div>`;
        d.setAttribute('data-noi18n', '');
        document.body.appendChild(d);
        Celebrate.trophy({ big: ' ', year: '', title: '', sub: '', c1: '#1d3f94', c2: '#ffcf3f', short: 'STARFOOT', kit: { shirt: '#1d3f94', alt: '#ffcf3f', pattern: 'band', shorts: '#ffffff', socks: '#1d3f94' }, number: 10 });
      }, { css: overlay(t, z), t });
      // kupa kaldırılmış hal başlangıç kabul edilir
      await pg.clock.runFor(2300);
      const dir = path.join(TMP, `${lang}-${z.id}`);
      const base = path.join(OUT, `${lang}-${z.id}`);
      if (process.env.NOVIDEO) {
        await record(pg, dir, 1.2);
        execSync(`convert "${dir}/f0030.jpg" -resize ${z.W}x${z.H}! -quality 93 "${base}.jpg"`);
      } else {
        await record(pg, dir, 8);
        execSync(`convert "${dir}/f0090.jpg" -resize ${z.W}x${z.H}! -quality 93 "${base}.jpg"`);
        execSync(`ffmpeg -loglevel error -y -framerate 30 -i "${dir}/f%04d.jpg" -vf "scale=${z.W}:${z.H},setsar=1" -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -r 30 -an -movflags +faststart "${base}.mp4"`);
      }
      try { fs.unlinkSync(base + '.png'); } catch (e) { /* yok */ }
      console.log(lang, z.id, pg.errs);
      await pg.close();
    }
  }
  fs.rmSync(TMP, { recursive: true, force: true });
  await b.close();
})();
