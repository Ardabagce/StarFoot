// Maç günü videoları: gerçek maçın oyundaki karşılığını StarFoot'ta "önceden oynar" (1080x1920, 30 fps)
// node store/social/matchday.js probe <id> [tohum]   skoru görmek için kayıtsız dener
// node store/social/matchday.js rec <id> <tohum>     sahneleri kaydeder
// node store/social/matchday.js make <id>            yazı, ses ve kapanışla videoyu birleştirir
const { chromium, open, record, fontCss } = require('./rec');
const { endHtml } = require('./tpl');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const [MODE = 'probe', ID = 'fb-alanya', SEED = '7'] = process.argv.slice(2);
const ROOT = path.join(__dirname, '../..');
const WORK = path.join(__dirname, 'work', 'matchday', ID);
const OUT = path.join(__dirname, 'matchday');
const ICON = path.join(ROOT, 'app/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png');

// oyundaki karşılıklar: Fenerköy SK, Alanya Güneşi, Trabzon Fırtınası, Beşiktepe JK
const M = {
  'fb-alanya': {
    home: 'FNK', away: 'ALN', me: 'FNK', name: ['Emre', 'Yıldız'], shirt: 10,
    seed: 6, g: 1,
    // [ilk kare, kare sayısı, yazı]
    cut: [[0, 66, 'hook'], [66, 20, 'live'], [300, 107, ''], [407, 73, 'goal'], [500, 34, 'sim'], [1279, 76, 'res']],
    txt: {
      hook: ['BU AKŞAM <em>FENER 🆚 ALANYA</em>', 'Maçı StarFoot\'ta önceden oynadık 🔮 Bakalım sonuç ne çıktı...'],
      live: ['MAÇ <em>BAŞLADI!</em> ⚽', 'Kritik anları ben oynuyorum, gerisi dakika dakika simülasyon.'],
      goal: ['', '15. dakika, serbest vuruş... Falsolu vurdum, GOOOL! 🚀'],
      sim: ['', 'Maç akarken her pozisyon canlı anlatımla düşüyor ⏱️'],
      res: ['STARFOOT <em>TAHMİNİ: 3-1</em>', 'Bu akşam gerçekte ne olacak? Bakalım tutacak mı... 👀'],
    },
    end: { tag: 'SENİN SKOR TAHMİNİN NE? 👇', cta: 'Yorumlara yaz! Maçı kendin oynamak için App Store\'da StarFoot\'u ara.' },
  },
  'ts-bjk': {
    home: 'TRB', away: 'BJK', me: 'TRB', name: ['Emre', 'Yıldız'], shirt: 61, big: 'Dev Maç',
    seed: 3, g: 2,
    cut: [[0, 66, 'hook'], [66, 41, 'press'], [107, 37, 'live'], [470, 88, ''], [558, 72, 'goal'], [640, 20, 'sim'], [1197, 76, 'res']],
    txt: {
      hook: ['PAZARTESİ <em>TRABZON 🆚 BEŞİKTAŞ</em>', 'Dev maçı StarFoot\'ta önceden oynadık 🔮 Bakalım sonuç ne çıktı...'],
      press: ['', 'Maç öncesi basın toplantısı: iddialı cevabı seçtim 🎙️🔥'],
      live: ['DEV MAÇ <em>BAŞLADI!</em> 🔥', 'Kritik anları ben oynuyorum, gerisi dakika dakika simülasyon.'],
      goal: ['', '46. dakika, penaltı... Soğukkanlı vuruş, GOOOL! 🎯'],
      sim: ['', 'Maç akarken her pozisyon canlı anlatımla düşüyor ⏱️'],
      res: ['STARFOOT <em>TAHMİNİ: 2-1</em>', 'Pazartesi gerçekte ne olacak? Bakalım tutacak mı... 👀'],
    },
    end: { tag: 'SENİN SKOR TAHMİNİN NE? 👇', cta: 'Yorumlara yaz! Derbiyi kendin oynamak için App Store\'da StarFoot\'u ara.' },
  },
  // Galata Aslanları - Fenerköy SK (Kıtalararası Derbi)
  'gs-fb': {
    home: 'GAL', away: 'FNK', me: 'FNK', name: ['Emre', 'Yıldız'], shirt: 10, big: 'Kıtalararası Derbi',
    seed: 2, g: 2,
    // 4. alan: o kareyi bu kadar kare dondur (skor tabelası çok kısa görünüyor)
    cut: [[0, 66, 'hook'], [66, 41, 'press'], [107, 18, 'live'], [140, 70, ''], [210, 50, 'goal'], [580, 1, 'come', 42], [1075, 1, 'eq', 54], [1473, 76, 'res']],
    txt: {
      hook: ['PAZARTESİ <em>DERBİ GÜNÜ!</em> 🔥', 'Galatasaray - Fenerbahçe derbisini StarFoot\'ta önceden oynadık 🔮'],
      press: ['', 'Maç öncesi basın toplantısı: iddialı cevabı seçtim 🎙️🔥'],
      live: ['DERBİ <em>BAŞLADI!</em> ⚽', 'Kritik anları ben oynuyorum, gerisi dakika dakika simülasyon.'],
      goal: ['', '2. dakika, penaltı... Soğukkanlı vuruş, GOOOL! 🎯'],
      come: ['', 'Ama Galata Aslanları geri döndü: 2-1 😱'],
      eq: ['', '69. dakika... Fenerköy eşitliği buldu: 2-2! 🔥'],
      res: ['STARFOOT <em>TAHMİNİ: 2-2</em>', 'Pazartesi gerçekte ne olacak? Bakalım tutacak mı... 👀'],
    },
    end: { tag: 'SENİN SKOR TAHMİNİN NE? 👇', cta: 'Yorumlara yaz! Derbiyi kendin oynamak için App Store\'da StarFoot\'u ara.' },
  },
}[ID];
if (!M) throw new Error('bilinmeyen maç: ' + ID);

async function setup(pg) {
  await pg.clock.runFor(500);
  await pg.click('[data-new="0"]');
  await pg.fill('#cr-name', M.name[0]); await pg.fill('#cr-sur', M.name[1]);
  await pg.selectOption('#cr-age', '17'); await pg.click('#cr-go'); await pg.clock.runFor(300); await pg.click('.modal-btns button');
  await pg.evaluate((m) => {
    const s = Game.state; s.street.done = true; Game.joinClub(m.me, 3e6, 4);
    const p = Game.p; p.age = 23; p.position = 'FW'; Object.keys(p.stats).forEach((k) => (p.stats[k] = m.st || 76));
    p.energy = 100; p.morale = 90; p.fame = 45; s.ap = 0; p.money = 2.4e6; p.shirt = m.shirt; s.news = []; p.celeb = 'siu';
    // bu haftanın maçı: ev sahibi - deplasman
    const lg = Game.league(), fx = lg.fixtures[s.season.round];
    const opp = m.home === m.me ? m.away : m.home;
    const i = fx.findIndex((f) => f.includes(m.me)), j = fx.findIndex((f) => f.includes(opp));
    if (i !== j) { const a = fx[i][0] === m.me ? fx[i][1] : fx[i][0], b = fx[j][0] === opp ? fx[j][1] : fx[j][0]; fx[j] = [a, b]; }
    fx[i] = [m.home, m.away];
    if (m.big) DERBIES.push([m.home, m.away, m.big]);
    else if (typeof Press !== 'undefined') Press.ask = () => Promise.resolve();
    // kısa video için yalnız serbest vuruş ve penaltı anları (tek hareketle oynanır)
    Object.keys(MOMENT_WEIGHTS.FW).forEach((k) => (MOMENT_WEIGHTS.FW[k] = k === 'freekick' || k === 'penalty' ? 1 : 0));
    Game.roleFor = () => 'starter';
    const st = document.createElement('style'); st.textContent = '#toasts{top:132px!important}.ct-foot{display:none!important}'; document.head.appendChild(st);
    Game.tab = 'home'; Game.render(); window.scrollTo(0, 0);
    document.querySelectorAll('#toasts > *').forEach((t) => t.remove());
  }, M);
}

// maç ekranındaki durum: an (mini oyun), devre arası, bitiş
const state = (pg) => pg.evaluate(() => {
  if (!document.querySelector('.mg-canvas') && [...document.querySelectorAll('*')].some((x) => x.offsetParent && x.children.length === 0 && /^REYT[İI]NG$/i.test(x.textContent.trim()))) return 'end';
  const ht = document.querySelector('[data-ht]'); if (ht) return 'ht';
  const again = [...document.querySelectorAll('button')].find((x) => x.offsetParent && /^DEVAM ET$/i.test(x.innerText.trim()));
  if (again) return 'retry';
  const m = document.getElementById('mt-moment'); if (m && !m.classList.contains('hidden') && m.querySelector('.mg-canvas')) return 'mom';
  if (document.querySelector('.modal-btns button') && !document.getElementById('mt-sim')) return 'modal';
  const sim = document.getElementById('mt-sim'); if (!sim) return 'off';
  return 'run';
});
const score = (pg) => pg.evaluate(() => [(document.getElementById('mt-hs') || {}).innerText, (document.getElementById('mt-as') || {}).innerText, (document.getElementById('mt-min') || {}).innerText].join(' '));

// şut hareketi: top noktasından kaleye doğru sürükle
async function shoot(pg) {
  const r = await pg.evaluate(() => { const c = document.querySelector('#mt-moment .mg-canvas'); const b = c.getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; });
  const x0 = r[0] + r[2] * 0.5, y0 = r[1] + r[3] * 0.7;
  return { x0, y0, dx: (Math.random() - 0.5) * 60, dy: -r[3] * 0.45 };
}

async function probe() {
  const b = await chromium.launch();
  for (const seed of String(SEED).split(',').map(Number)) {
    const pg = await open(b, 'tr', seed);
    await setup(pg);
    await pg.evaluate(() => { Game.playNext(); });
    let moms = 0, last = '', seen = false;
    for (let i = 0; i < 2000; i++) {
      await pg.clock.runFor(200);
      const st = await state(pg);
      if (st === 'ht') await pg.evaluate(() => document.querySelector('[data-ht]').click());
      else if (st === 'mom') { moms++; await pg.evaluate(() => { if (MiniGame._abort) MiniGame._abort(); }); }
      else if (st === 'modal') { const t = await pg.evaluate(() => document.querySelector('.modal').innerText.slice(0, 60)); if (t !== last) { last = t; } await pg.evaluate(() => document.querySelector('.modal-btns button').click()); }
      else if (st === 'end') break;
      else if (st === 'off') { if (seen) break; }
      else seen = true;
      if (i === 5) await pg.evaluate(() => { const s = document.querySelector('#mt-speed [data-s="4"]'); if (s) s.click(); });
    }
    const r = await pg.evaluate(() => { const e = [...document.querySelectorAll('*')].find((x) => x.children.length === 0 && /^\d+ - \d+$/.test(x.textContent.trim())); return e ? e.textContent.trim() : 'yok'; });
    console.log('tohum', seed, 'an', moms, r, pg.errs.slice(0, 2));
    await pg.close();
  }
  await b.close();
}

// Maçı kare kare oynatır. dry: ekran görüntüsü almadan aynı adımlarla (aynı rastgele sayılarla) oynar.
async function play(pg, out, dry, gest) {
  if (!dry) { fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true }); }
  await pg.evaluate(() => {
    if (window.__flush) return;
    let q = [];
    window.requestAnimationFrame = (cb) => { q.push(cb); return q.length; };
    window.cancelAnimationFrame = () => {};
    window.__flush = () => { const c = q; q = []; const now = performance.now(); c.forEach((f) => { try { f(now); } catch (e) { console.error(e); } }); };
  });
  const log = [];
  let i = 0, stIn = 0, prev = '', endAt = -1, g = null, speedSet = false;
  const frame = async () => {
    await pg.clock.runFor(1000 / 60); await pg.evaluate(() => window.__flush());
    await pg.clock.runFor(1000 / 60); await pg.evaluate(() => window.__flush());
    if (!dry) await pg.screenshot({ path: path.join(out, `f${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 92 });
    i++;
  };
  // 1) ana ekran: maç günü kartı
  const y = await pg.evaluate(() => { const e = [...document.querySelectorAll('.card, section')].find((c) => /MAÇ GÜNÜ/i.test(c.innerText)); return e ? Math.max(0, e.getBoundingClientRect().top + scrollY - 140) : 0; });
  await pg.evaluate((y) => window.scrollTo(0, y), y);
  for (let k = 0; k < 66; k++) { await frame(); log.push({ i: i - 1, st: 'home' }); }
  await pg.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /MAÇA ÇIK/i.test(x.innerText)); b.click(); });
  // 2) maç
  while (i < (+process.env.MAXF || 4000)) {
    const st = await state(pg);
    if (st !== prev) { prev = st; stIn = 0; } else stIn++;
    if (!speedSet && st === 'run') { await pg.evaluate(() => { const s = document.querySelector('#mt-speed [data-s="4"]'); if (s) s.click(); }); speedSet = true; }
    if (st === 'modal' && stIn === 40) await pg.evaluate(() => { const a = document.querySelector('[data-pa="2"]') || document.querySelector('.modal-btns button'); a.click(); });
    if (st === 'retry' && stIn === 24) await pg.evaluate(() => [...document.querySelectorAll('button')].find((x) => x.offsetParent && /^DEVAM ET$/i.test(x.innerText.trim())).click());
    if (st === 'ht' && stIn === 18) await pg.evaluate(() => document.querySelector('[data-ht]').click());
    if (st === 'mom') {
      if (stIn === 40) { const r = await pg.evaluate(() => { const b = document.querySelector('#mt-moment .mg-canvas').getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; }); g = { x: r[0] + r[2] * 0.5, y: r[1] + r[3] * 0.64, dx: gest.dx, dy: gest.dy }; await pg.mouse.move(g.x, g.y); await pg.mouse.down(); }
      if (g && stIn > 40 && stIn <= 52) { const k = (stIn - 40) / 12; await pg.mouse.move(g.x + g.dx * k, g.y + g.dy * k); }
      if (g && stIn === 53) { await pg.mouse.up(); g = null; }
    }
    if (st === 'end' && endAt < 0) endAt = i;
    await frame();
    log.push({ i: i - 1, st, sc: await score(pg) });
    if (endAt >= 0 && i - endAt > 75) break;
  }
  const fin = await pg.evaluate(() => { const e = [...document.querySelectorAll('*')].find((x) => x.children.length === 0 && /^\d+ - \d+$/.test(x.textContent.trim())); return e ? e.textContent.trim() : '?'; });
  return { log, fin, n: i };
}

// ---------- kurgu ----------
const EMO = "'Noto Color Emoji'";
const base = `${fontCss}*{margin:0;padding:0;box-sizing:border-box}body{width:1080px;height:1920px;overflow:hidden;position:relative;background:transparent;color:#fff;font-family:'Barlow Semi Condensed',${EMO},sans-serif}`;
// başlıklı blok (ekranın ortası-altı) ya da yalnız alt yazı
const overlay = (title, sub) => `<!doctype html><html><head><meta charset="utf-8"><style>${base}
.band{position:absolute;left:0;right:0;top:960px;height:760px;background:linear-gradient(180deg,rgba(3,7,20,0) 0%,rgba(3,7,20,.9) 22%,rgba(3,7,20,.9) 78%,rgba(3,7,20,0) 100%)}
.t{position:absolute;left:50px;right:50px;top:1120px;text-align:center;font-family:'Saira Condensed',${EMO};font-weight:900;font-style:italic;font-size:96px;line-height:1;text-transform:uppercase;transform:skewX(-6deg);text-shadow:0 6px 24px rgba(0,0,0,.6)}
.t em{display:block;font-style:italic;color:#ffcf3f;margin-top:8px}
.wm{position:absolute;left:0;right:0;top:1050px;text-align:center;font-family:'Saira Condensed';font-weight:900;font-style:italic;font-size:36px;letter-spacing:.06em;opacity:.9}.wm span{color:#ffcf3f}
.s{position:absolute;left:80px;right:80px;top:${title ? 1390 : 1400}px;text-align:center;font-weight:700;font-size:50px;line-height:1.2}
.cap{position:absolute;left:60px;right:60px;top:1330px;display:flex;justify-content:center}
.cap p{background:rgba(3,7,20,.84);border-left:10px solid #ffcf3f;border-radius:16px;padding:22px 30px;font-weight:700;font-size:50px;line-height:1.2;box-shadow:0 12px 40px rgba(0,0,0,.45)}
</style></head><body>${title ? `<div class="band"></div><div class="wm">STAR<span>FOOT</span></div><div class="t">${title}</div><div class="s">${sub}</div>` : `<div class="cap"><p>${sub}</p></div>`}</body></html>`;
const SFX = {
  boom: `aevalsrc='0.95*sin(2*PI*(42+90*exp(-t*14))*t)*exp(-t*3.2)+0.25*sin(2*PI*84*t)*exp(-t*9)':s=44100:d=1.4`,
  whoosh: `anoisesrc=d=0.45:c=pink:a=0.5:r=44100,bandpass=f=1400:w=1800,afade=in:d=0.22,afade=out:st=0.22:d=0.23`,
  whistle: `aevalsrc='0.22*sin(2*PI*2850*t+2.5*sin(2*PI*32*t))*(lt(t,0.22)+gt(t,0.3))*lt(t,0.95)':s=44100:d=1.0`,
  kick: `aevalsrc='0.9*sin(2*PI*(70+160*exp(-t*40))*t)*exp(-t*22)':s=44100:d=0.35`,
  roar: `anoisesrc=d=2.6:c=pink:a=0.55:r=44100,lowpass=f=1500,highpass=f=180,afade=in:d=0.35,afade=out:st=1.6:d=1.0`,
  chime: `aevalsrc='0.22*(sin(2*PI*1047*t)*exp(-t*3)+sin(2*PI*1319*t)*exp(-(t-0.12)*3)*gt(t,0.12)+sin(2*PI*1568*t)*exp(-(t-0.24)*3)*gt(t,0.24)+sin(2*PI*2093*t)*exp(-(t-0.36)*2.5)*gt(t,0.36))':s=44100:d=1.8`,
};

async function make() {
  fs.mkdirSync(OUT, { recursive: true });
  const tmp = path.join(WORK, '_mk'); fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp, { recursive: true });
  for (const [k, src] of Object.entries(SFX)) execSync(`ffmpeg -loglevel error -y -f lavfi -i "${src}" -ac 2 "${path.join(tmp, k + '.wav')}"`);
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const shot = async (html, file, transparent = true) => {
    const f = path.join(tmp, '_p.html'); fs.writeFileSync(f, html);
    await pg.goto('file://' + f); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(100);
    await pg.screenshot({ path: file, omitBackground: transparent });
  };
  const enc = '-c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p -r 30 -an';
  const FR = path.join(WORK, 'match');
  for (const [k, [t, sub]] of Object.entries(M.txt)) await shot(overlay(t, sub), path.join(tmp, `o-${k}.png`));
  await shot(endHtml({ title: 'StarFoot: Futbol Kariyeri', badge: 'APP STORE\'DA ÜCRETSİZ', ...M.end }, 'file://' + ICON), path.join(tmp, 'end.png'), false);
  const parts = [], sfx = [];
  let t = 0;
  M.cut.forEach(([st, n, key, hold], i) => {
    const o = path.join(tmp, `s${i}.mp4`);
    const fade = i > 0 ? 'fade=in:st=0:d=0.15:alpha=1' : 'fade=in:st=0:d=0.01:alpha=1';
    if (hold) n = hold;
    const src = hold ? `-loop 1 -t ${n / 30} -i "${FR}/f${String(st).padStart(4, '0')}.jpg"` : `-framerate 30 -start_number ${st} -i "${FR}/f%04d.jpg"`;
    if (key) execSync(`ffmpeg -loglevel error -y ${src} -loop 1 -t ${n / 30} -i "${path.join(tmp, `o-${key}.png`)}" -filter_complex "[0]scale=1080:1920,setsar=1[v];[1]format=rgba,${fade}[c];[v][c]overlay=0:0:shortest=1" -frames:v ${n} ${enc} "${o}"`);
    else execSync(`ffmpeg -loglevel error -y -framerate 30 -start_number ${st} -i "${FR}/f%04d.jpg" -vf "scale=1080:1920,setsar=1" -frames:v ${n} ${enc} "${o}"`);
    parts.push(o);
    // ses: kesmelerde geçiş, maç başında düdük, an sırasında vuruş, golde tribün
    if (i === 0) sfx.push(['boom', 0]);
    else sfx.push(['whoosh', t - 0.12]);
    if (key === 'live') sfx.push(['whistle', t + 0.1]);
    if (key === '') { sfx.push(['kick', t + (M.big ? 1.5 : 0.3)]); }
    if (key === 'goal') sfx.push(['roar', t - 0.9]);
    if (key === 'eq') sfx.push(['roar', t + 0.1]);
    if (key === 'res') sfx.push(['whistle', t + 0.05]);
    t += n / 30;
  });
  const eo = path.join(tmp, 'end.mp4');
  execSync(`ffmpeg -loglevel error -y -loop 1 -t 3.6 -i "${path.join(tmp, 'end.png')}" -vf "scale=2160:3840,zoompan=z='1+0.0006*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=108:s=1080x1920:fps=30,fade=in:st=0:d=0.25" -frames:v 108 ${enc} "${eo}"`);
  parts.push(eo); sfx.push(['chime', t + 0.1]);
  fs.writeFileSync(path.join(tmp, 'list.txt'), parts.map((p) => `file '${p}'`).join('\n'));
  const silent = path.join(tmp, 'v.mp4');
  execSync(`ffmpeg -loglevel error -y -f concat -safe 0 -i "${path.join(tmp, 'list.txt')}" -c copy "${silent}"`);
  const dur = parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${silent}"`).toString());
  const ins = sfx.map(([k]) => `-i "${path.join(tmp, k + '.wav')}"`).join(' ');
  const mix = sfx.map(([, at], i) => `[${i + 1}]adelay=${Math.max(0, Math.round(at * 1000))}|${Math.max(0, Math.round(at * 1000))}[a${i}]`).join(';');
  const out = path.join(OUT, `tr-${ID}.mp4`);
  execSync(`ffmpeg -loglevel error -y -i "${silent}" ${ins} -f lavfi -t ${dur} -i anullsrc=r=44100:cl=stereo -filter_complex "${mix};[${sfx.length + 1}]${sfx.map((_, i) => `[a${i}]`).join('')}amix=inputs=${sfx.length + 1}:normalize=0:duration=first,volume=0.9[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 160k -t ${dur} -movflags +faststart "${out}"`);
  // kapak: sonuç ekranı + başlık
  execSync(`ffmpeg -loglevel error -y -i "${path.join(FR, `f${String(M.cut[0][0] + 40).padStart(4, '0')}.jpg`)}" -i "${path.join(tmp, 'o-hook.png')}" -filter_complex "[0]scale=1080:1920[v];[v][1]overlay=0:0" -frames:v 1 "${out.replace('.mp4', '-kapak.jpg')}"`);
  console.log('ok', out, dur.toFixed(1) + 's');
  await b.close();
}
if (MODE === 'make') make().catch((e) => { console.error(e); process.exit(1); });

module.exports = { M, setup, state, score, shoot, play, WORK, OUT, ICON, ROOT };
async function tryRun() {
  const b = await chromium.launch();
  const gs = [{ dx: -10, dy: 130 }, { dx: 18, dy: 125 }, { dx: -28, dy: 135 }];
  for (const seed of String(SEED).split(',').map(Number)) for (const [gi, gest] of gs.entries()) {
    if (process.env.G && +process.env.G !== gi) continue;
    const pg = await open(b, 'tr', seed);
    await setup(pg);
    const dry = MODE === 'dry';
    const r = await play(pg, path.join(WORK, 'match'), dry, gest);
    const goals = []; let last = '';
    r.log.forEach((x) => { const v = x.sc && x.sc.split(' ').slice(0, 2).join('-'); if (v && v !== last) { if (last) goals.push([x.i, x.st, v]); last = v; } });
    const moms = r.log.filter((x, k) => x.st === 'mom' && (k === 0 || r.log[k - 1].st !== 'mom')).map((x) => x.i);
    console.log(`tohum ${seed} hareket ${gi}: ${r.fin} | kare ${r.n} | anlar ${moms.join(',')} | skor değişimi ${goals.map((x) => x.join(':')).join(' ')}`, pg.errs.slice(0, 2));
    if (!dry) fs.writeFileSync(path.join(WORK, 'log.json'), JSON.stringify(r.log));
    await pg.close();
    if (!dry) break;
  }
  await b.close();
}

if (MODE === 'dry' || MODE === 'rec') tryRun().catch((e) => { console.error(e); process.exit(1); });
if (MODE === 'probe') probe().catch((e) => { console.error(e); process.exit(1); });
