// Instagram Reels serisi (1080x1920, 30 fps, 10-15 sn)
// 1) CLUB=FNK node store/social/clips.js tr <work>-fnk · CLUB=RMA ... <work>-rma · CLUB=BJK MOMENT=penalty DX=0 DY=150 ... <work>-bjk-pen moment
// 2) node store/social/reels.js rec <work>          (videoya özel oyun sahneleri)
// 3) node store/social/reels.js make <work> [çıktı] (yazılar, ses efektleri, kapanış)
const { chromium, open, record, fontCss } = require('./rec');
const { endHtml } = require('./tpl');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const MODE = process.argv[2] || 'make';
const ONLY = process.env.ONLY || '';
const WORK = process.argv[3] || path.join(__dirname, 'work', 'tr');
const OUT = process.argv[4] || path.join(__dirname, 'reels');
const ST = path.join(WORK, 'rl');
const ROOT = path.join(__dirname, '../..');
const ICON = path.join(ROOT, 'app/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png');

// ---------- kayıt yardımcıları ----------
const OFF = 125; // üst yazı bandının altında kalsın diye hedef öğe bu kadar aşağıda durur (css px)
async function career(pg, o) {
  await pg.clock.runFor(500);
  await pg.click('[data-new="0"]');
  await pg.fill('#cr-name', 'Emre'); await pg.fill('#cr-sur', 'Yıldız');
  await pg.selectOption('#cr-age', '17'); await pg.click('#cr-go'); await pg.clock.runFor(300); await pg.click('.modal-btns button');
  await pg.evaluate((o) => {
    const s = Game.state; s.street.done = true; Game.joinClub(o.club, o.wage || 600000, 4);
    const p = Game.p; p.age = o.age; p.position = 'FW'; Object.keys(p.stats).forEach((k) => (p.stats[k] = o.st));
    p.energy = 100; p.morale = 80; p.fame = o.fame || 30; p.money = o.money || 2e6; s.ap = 3; p.shirt = o.shirt || 10; s.news = [];
    const st = document.createElement('style'); st.textContent = '#toasts{top:132px!important}.ct-foot{display:none!important}'; document.head.appendChild(st);
    const top = (el, off) => (el ? el.getBoundingClientRect().top + window.scrollY - off : 0);
    window.__el = (q) => (typeof q === 'string' ? document.querySelector(q) : q);
    window.__txt = (t) => [...document.querySelectorAll('body *')].find((e) => e.children.length === 0 && e.textContent.trim() === t);
    const pick = (q) => (!q ? null : typeof q !== 'string' ? q : q.startsWith('=') ? __txt(q.slice(1)) : document.querySelector(q));
    window.__go = (tab, q, off = 125) => { const keep = q && typeof q !== 'string' ? [...document.querySelectorAll(q.tagName)].indexOf(q) : -1; Game.tab = tab; Game.render(); document.querySelectorAll('#toasts > *').forEach((t) => t.remove()); const el = keep >= 0 ? document.querySelectorAll(q.tagName)[keep] : pick(q); window.scrollTo(0, Math.max(0, top(el, off))); return window.scrollY; };
    window.__y = (q, off = 125) => Math.max(0, top(pick(q), off));
  }, o);
}
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
// a karesinden b karesine y0 -> y1 yumuşak kaydırma
function scroll(acts, pg, a, b, y0, y1, extra) {
  for (let i = a; i <= b; i++) {
    const prev = acts[i];
    acts[i] = async () => { if (prev) await prev(); await pg.evaluate(([y, ex]) => { window.scrollTo(0, y); if (ex) eval(ex); }, [Math.round(y0 + (y1 - y0) * ease((i - a) / (b - a))), extra || '']); };
  }
  return acts;
}
const dir = (v, s) => path.join(ST, String(v), s);

async function recAll() {
  const b = await chromium.launch();
  const page = async (o) => { const pg = await open(b, 'tr'); await career(pg, o); return pg; };

  // ---------- 3: 8 yaşından Altın Top'a ----------
  if (!ONLY || ONLY === '3') {
    // a) yeni kariyer ekranı (8 yaş, mahalle maçı)
    const p0 = await open(b, 'tr');
    await p0.clock.runFor(500);
    await p0.click('[data-new="0"]'); await p0.clock.runFor(300);
    await record(p0, dir(3, 'a'), 2.6, scroll({}, p0, 20, 70, 0, 380));
    await p0.close();
    // b) yaş ve güç artışı (profil kartı)
    const pg = await page({ club: 'BUR', age: 8, st: 30, wage: 90000, fame: 2 });
    await pg.evaluate(() => __go('profile'));
    const up = {};
    for (let i = 0; i <= 72; i += 3) up[i] = () => pg.evaluate((k) => { const p = Game.p; p.age = 8 + Math.floor(k * 16 / 24); Object.keys(p.stats).forEach((s) => (p.stats[s] = Math.round(30 + 64 * k / 24))); Game.render(); window.scrollTo(0, 0); }, i / 3);
    await record(pg, dir(3, 'b'), 2.6, up);
    console.log('3', pg.errs); await pg.close();
  }

  // ---------- 4: Oyunda kendi Instagram'ın ----------
  if (!ONLY || ONLY === '4') {
    const pg = await page({ club: 'TRB', age: 22, st: 86, wage: 3e6, fame: 70, shirt: 61 });
    await pg.evaluate(() => {
      const p = Game.p; Social.ensure(p); p.social.followers = 120000; Social.target = () => 2e7; Social.cap = () => 3e7;
      ['goal', 'trophy', 'training', 'goal', 'fans', 'goal', 'trophy'].forEach((k) => { try { Social.post(k); } catch (e) { /* yok */ } });
    });
    const y = await pg.evaluate(() => __go('profile', '.ig', 130));
    const acts = {};
    for (let i = 0; i <= 90; i += 2) acts[i] = () => pg.evaluate(([k, y]) => { Game.p.social.followers = Math.round(120000 * Math.pow(10.4 * 1000000 / 120000, Math.min(1, k / 80))); Game.render(); window.scrollTo(0, y); }, [i, y]);
    await record(pg, dir(4, 'a'), 3.2, acts);
    const y2 = await pg.evaluate(() => __y('.ig .ig-grid, .ig .ig-post, .ig', 130));
    await record(pg, dir(4, 'b'), 3.4, scroll({}, pg, 6, 96, y2, y2 + 900));
    console.log('4', pg.errs); await pg.close();
  }

  // ---------- 5: Milli takım ve Dünya Kupası ----------
  if (!ONLY || ONLY === '5') {
    const pg = await page({ club: 'BJK', age: 24, st: 90, wage: 3e6, fame: 70 });
    await pg.evaluate(() => { Game.p.nation = 'TUR'; Game.state.news = []; __go('home'); });
    await record(pg, dir(5, 'a'), 2.6, { 6: () => pg.evaluate(() => { Game.news('🇹🇷 MİLLİ TAKIMA ÇAĞRILDIN! Dünya Kupası kadrosuna seçildin.', 'good'); Game.toast('🇹🇷 Milli takıma çağrıldın!', 'good'); Game.render(); window.scrollTo(0, 0); }) });
    await pg.evaluate(() => document.querySelectorAll('#toasts > *').forEach((t) => t.remove()));
    await record(pg, dir(5, 'b'), 3.8, { 0: () => pg.evaluate(() => { const c = NAT_COLORS.TUR; const team = { id: 'TUR', c1: c[0], c2: c[1], short: 'TUR' }; Celebrate.trophy({ kit: Sprites.kit(team, false), c1: c[0], c2: c[1], short: 'TUR', number: 10, big: 'ŞAMPİYON!', title: '', sub: '' }); }) });
    console.log('5', pg.errs); await pg.close();
  }
  await b.close();
}

// ---------- kurgu ----------
// clips.js klipleri (kulübe göre ayrı klasörler: CLUB=FNK ... node clips.js tr <work>-fnk)
const F = (d) => path.join(WORK + '-fnk', d); // Fenerköy SK
const R = (d) => path.join(WORK + '-rma', d); // Real Madrigal
const P = (d) => path.join(WORK + '-bjk-pen', d); // Beşiktepe JK, penaltı
const S = (v, s) => dir(v, s);
const END = { title: 'StarFoot: Futbol Kariyeri', badge: 'APP STORE\'DA ÜCRETSİZ' };
const V = [
  {
    id: 'nss-ozleyenler',
    scenes: [
      ['NSS\'Yİ ÖZLEYEN <em>VAR MI?</em> 👀', 'Kendi futbolcunu yaratıp kariyerini yazdığın o oyunları sevdiysen, bu sana göre.'],
      ['KRİTİK ANI <em>SEN OYNA</em> ⚽', 'Maçın kilit anlarında şutu, pası, frikiği sen çekiyorsun.'],
      ['TRANSFER, KUPA, <em>EFSANE</em> 🏆', 'Dev kulüplere transfer ol, kupaları kaldır. Hem de tamamen Türkçe.'],
    ],
    segs: [[F('matchday'), 0, 75, 0], [F('moment'), 22, 120, 1], [F('airport'), 6, 60, 2], [F('trophy'), 0, 84, 2]],
    end: { tag: 'NSS SEVENLER BURAYA ⚽👇', cta: 'App Store\'da StarFoot\'u ara, ücretsiz indir!' },
    sfx: [['boom', 0], ['whoosh', 2.5], ['whoosh', 6.5], ['whoosh', 8.5], ['boom', 8.6], ['chime', 11.3]],
  },
  {
    id: 'penalti-nereye-vurursun',
    scenes: [
      ['<em>PENALTI!</em> 😰', 'Maçın kaderi senin ayağında. Kaleci karşında...'],
      ['SOL MU? SAĞ MI? <em>ORTA MI?</em> 🤔', 'Cevabını yoruma yaz, sonra izle 👇'],
      ['StarFoot\'ta <em>PENALTIYI SEN ATARSIN</em> 🎯', 'Çek, nişan al, bırak. Gerisi senin soğukkanlılığın.'],
    ],
    segs: [[P('moment'), 0, 13, 0], [P('moment'), 12, 1, 0, 45], [P('moment'), 12, 1, 1, 66], [P('moment'), 13, 110, 2]],
    end: { tag: 'SEN NEREYE VURURDUN? 👇', cta: 'Yoruma yaz! Penaltıyı kendin atmak için App Store\'da StarFoot\'u ara.' },
    sfx: [['boom', 0], ['whoosh', 1.85], ['whoosh', 4.05], ['boom', 4.95], ['chime', 7.85]],
  },
  {
    id: '8-yasindan-altin-topa',
    scenes: [
      ['8 YAŞINDA <em>MAHALLEDE BAŞLA</em> 🏘️', 'Kariyerin sokak maçında başlıyor. Kenarda bir scout seni izliyor.'],
      ['ANTRENMAN, MAÇ, <em>GELİŞİM</em> 📈', 'Her hafta antrenman yap, oyna, güçlen. Yaşın ilerledikçe yıldızın parlıyor.'],
      ['ŞAMPİYONLAR KUPASI <em>GECESİ</em> ✨', 'Avrupa\'nın en büyük sahnesinde forma giy.'],
      ['VE <em>ALTIN TOP!</em> 🥇', 'Sen kaç yaşında Altın Top kazanırsın?'],
    ],
    segs: [[S(3, 'a'), 0, 78, 0], [S(3, 'b'), 0, 78, 1], [R('matchday'), 0, 60, 2], [R('ballon'), 0, 96, 3]],
    end: { tag: 'REKORUNU YORUMA YAZ 👇', cta: 'Kendi efsaneni yaz: StarFoot App Store\'da ücretsiz!' },
    sfx: [['boom', 0], ['whoosh', 2.6], ['whoosh', 5.2], ['whoosh', 7.2], ['boom', 7.3], ['chime', 10.5]],
  },
  {
    id: 'oyunda-kendi-instagramin',
    scenes: [
      ['OYUNDA KENDİ <em>INSTAGRAM\'IN</em> VAR 📱', 'Her golün, her kupan sosyal medyada paylaşılıyor.'],
      ['TAKİPÇİN <em>MİLYONLARA</em> ÇIKIYOR 🚀', 'İyi oynadıkça takipçin artıyor, sponsorlar kapını çalıyor.'],
    ],
    segs: [[S(4, 'a'), 0, 96, 0], [S(4, 'b'), 0, 102, 1]],
    end: { tag: 'KAÇ TAKİPÇİYE ULAŞIRSIN? 👇', cta: 'Yoruma yaz! StarFoot App Store\'da ücretsiz.' },
    sfx: [['boom', 0], ['cash', 2.2], ['whoosh', 3.2], ['chime', 6.6]],
  },
  {
    id: 'turkiyeyi-sampiyon-yap',
    scenes: [
      ['🇹🇷 MİLLİ TAKIMA <em>ÇAĞRILDIN!</em>', 'Sezon boyunca parladın, ay-yıldızlı forma seni bekliyor.'],
      ['TÜRKİYE <em>DÜNYA ŞAMPİYONU!</em> 🏆', 'Bu hayali StarFoot\'ta gerçekleştir.'],
    ],
    segs: [[S(5, 'a'), 0, 78, 0], [S(5, 'b'), 0, 114, 1]],
    end: { tag: 'BU HAYALİ GERÇEKLEŞTİR 🇹🇷', cta: 'App Store\'da StarFoot\'u ara, Türkiye\'yi şampiyon yap!' },
    sfx: [['boom', 0], ['chime', 0.3], ['whoosh', 2.5], ['boom', 2.6], ['chime', 6.4]],
  },
];

const EMO = "'Noto Color Emoji'";
const base = `${fontCss}*{margin:0;padding:0;box-sizing:border-box}body{width:1080px;height:1920px;overflow:hidden;position:relative;background:transparent;color:#fff;font-family:'Barlow Semi Condensed',${EMO},sans-serif}`;
const overlay = (title, sub) => `<!doctype html><html><head><meta charset="utf-8"><style>${base}
.band{position:absolute;left:0;right:0;top:0;height:420px;background:linear-gradient(180deg,rgba(3,7,20,.97) 0%,rgba(3,7,20,.93) 62%,rgba(3,7,20,0) 100%)}
.t{position:absolute;left:50px;right:50px;top:96px;height:240px;display:flex;align-items:center;justify-content:center;text-align:center;font-family:'Saira Condensed',${EMO};font-weight:900;font-style:italic;font-size:92px;line-height:1;text-transform:uppercase;transform:skewX(-6deg);text-shadow:0 6px 24px rgba(0,0,0,.6)}
.t em{font-style:italic;color:#ffcf3f}
.wm{position:absolute;left:0;right:0;top:46px;text-align:center;font-family:'Saira Condensed';font-weight:900;font-style:italic;font-size:34px;letter-spacing:.06em;opacity:.85}.wm span{color:#ffcf3f}
.sub{position:absolute;left:56px;right:170px;bottom:300px;display:flex;justify-content:flex-start}
.sub p{background:rgba(3,7,20,.8);border-left:10px solid #ffcf3f;border-radius:14px;padding:20px 28px;font-weight:700;font-size:50px;line-height:1.2;box-shadow:0 12px 40px rgba(0,0,0,.45)}
</style></head><body><div class="band"></div><div class="wm">STAR<span>FOOT</span></div><div class="t"><div>${title}</div></div><div class="sub"><p>${sub}</p></div></body></html>`;

// ses efektleri: tamamı burada sentezlenir (telif yok)
const SFX = {
  boom: `aevalsrc='0.95*sin(2*PI*(42+90*exp(-t*14))*t)*exp(-t*3.2)+0.25*sin(2*PI*84*t)*exp(-t*9)':s=44100:d=1.4`,
  cash: `aevalsrc='0.32*(sin(2*PI*1975*t)+0.7*sin(2*PI*2637*t))*exp(-t*7)*gt(t,0.09)+0.3*(sin(2*PI*1568*t))*exp(-t*12)':s=44100:d=0.9`,
  fail: `aevalsrc='0.28*sgn(sin(2*PI*(220-60*t)*t))*exp(-t*2.6)*(lt(t,0.32)+gt(t,0.38))':s=44100:d=0.75`,
  whoosh: `anoisesrc=d=0.45:c=pink:a=0.5:r=44100,bandpass=f=1400:w=1800,afade=in:d=0.22,afade=out:st=0.22:d=0.23`,
  chime: `aevalsrc='0.22*(sin(2*PI*1047*t)*exp(-t*3)+sin(2*PI*1319*t)*exp(-(t-0.12)*3)*gt(t,0.12)+sin(2*PI*1568*t)*exp(-(t-0.24)*3)*gt(t,0.24)+sin(2*PI*2093*t)*exp(-(t-0.36)*2.5)*gt(t,0.36))':s=44100:d=1.8`,
};

async function make() {
  fs.mkdirSync(OUT, { recursive: true });
  const tmp = path.join(WORK, '_st'); fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp, { recursive: true });
  for (const [k, src] of Object.entries(SFX)) execSync(`ffmpeg -loglevel error -y -f lavfi -i "${src}" -ac 2 "${path.join(tmp, k + '.wav')}"`);
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const shot = async (html, file, transparent = true) => {
    const f = path.join(tmp, '_p.html'); fs.writeFileSync(f, html);
    await pg.goto('file://' + f); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(100);
    await pg.screenshot({ path: file, omitBackground: transparent });
  };
  const enc = '-c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p -r 30 -an';
  for (const [vi, v] of V.entries()) {
    if (ONLY && String(vi + 1) !== ONLY) continue;
    const d = path.join(tmp, v.id); fs.mkdirSync(d, { recursive: true });
    for (const [i, [t, s]] of v.scenes.entries()) await shot(overlay(t, s), path.join(d, `o${i}.png`));
    await shot(endHtml({ ...END, ...v.end }, 'file://' + ICON), path.join(d, 'end.png'), false);
    const parts = [];
    v.segs.forEach(([fd, st, n, sc, hold], i) => {
      const o = path.join(d, `s${i}.mp4`);
      const first = i === 0 || v.segs[i - 1][3] !== sc;
      const fade = first && i > 0 ? 'fade=in:st=0:d=0.15:alpha=1' : 'fade=in:st=0:d=0.01:alpha=1';
      // hold: tek kareyi bu kadar kare dondur (soru anı)
      if (hold) n = hold;
      const src = hold ? `-loop 1 -t ${n / 30} -i "${fd}/f${String(st).padStart(4, '0')}.jpg"` : `-framerate 30 -start_number ${st} -i "${fd}/f%04d.jpg"`;
      execSync(`ffmpeg -loglevel error -y ${src} -loop 1 -t ${n / 30} -i "${path.join(d, `o${sc}.png`)}" -filter_complex "[0]scale=1080:1920,setsar=1[v];[1]format=rgba,${fade}[c];[v][c]overlay=0:0:shortest=1" -frames:v ${n} ${enc} "${o}"`);
      parts.push(o);
    });
    const eo = path.join(d, 'end.mp4');
    execSync(`ffmpeg -loglevel error -y -loop 1 -t 3.6 -i "${path.join(d, 'end.png')}" -vf "scale=2160:3840,zoompan=z='1+0.0006*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=108:s=1080x1920:fps=30,fade=in:st=0:d=0.25" -frames:v 108 ${enc} "${eo}"`);
    parts.push(eo);
    fs.writeFileSync(path.join(d, 'list.txt'), parts.map((p) => `file '${p}'`).join('\n'));
    const silent = path.join(d, 'v.mp4');
    execSync(`ffmpeg -loglevel error -y -f concat -safe 0 -i "${path.join(d, 'list.txt')}" -c copy "${silent}"`);
    const dur = parseFloat(execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${silent}"`).toString());
    const ins = v.sfx.map(([k]) => `-i "${path.join(tmp, k + '.wav')}"`).join(' ');
    const mix = v.sfx.map(([, t], i) => `[${i + 1}]adelay=${Math.round(t * 1000)}|${Math.round(t * 1000)}[a${i}]`).join(';');
    const out = path.join(OUT, `tr-${vi + 1}-${v.id}.mp4`);
    execSync(`ffmpeg -loglevel error -y -i "${silent}" ${ins} -f lavfi -t ${dur} -i anullsrc=r=44100:cl=stereo -filter_complex "${mix};[${v.sfx.length + 1}]${v.sfx.map((_, i) => `[a${i}]`).join('')}amix=inputs=${v.sfx.length + 1}:normalize=0:duration=first,volume=0.9[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 160k -t ${dur} -movflags +faststart "${out}"`);
    // kapak: ilk sahne + başlık
    execSync(`ffmpeg -loglevel error -y -i "${parts[0]}" -vf "select=eq(n\\,${Math.min(40, v.segs[0][4] || v.segs[0][2] - 1)})" -frames:v 1 "${out.replace('.mp4', '-kapak.jpg')}"`);
    console.log('ok', out, dur.toFixed(1) + 's');
  }
  await b.close();
}

(MODE === 'rec' ? recAll() : make()).catch((e) => { console.error(e); process.exit(1); });
