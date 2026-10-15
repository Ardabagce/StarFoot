// Senaryolu TikTok / Reels videoları (1080x1920, 30 fps, 15-20 sn)
// 1) node store/social/clips.js tr <work>          (gol, Altın Top, havalimanı, kupa klipleri)
// 2) node store/social/stories.js rec <work>        (senaryoya özel oyun sahneleri)
// 3) node store/social/stories.js make <work> [çıktı] (yazılar, altyazılar, ses efektleri)
const { chromium, open, record, fontCss } = require('./rec');
const { endHtml } = require('./tpl');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const MODE = process.argv[2] || 'make';
const WORK = process.argv[3] || path.join(__dirname, 'work', 'tr');
const OUT = process.argv[4] || path.join(__dirname, 'stories');
const ST = path.join(WORK, 'st');
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

  // ---------- 1: Parayı mı seçtin, kariyeri mi? ----------
  {
    const pg = await page({ club: 'BSK', age: 18, st: 76, wage: 600000 });
    await pg.evaluate(() => { Game.state.offers = [{ clubId: 'NSR', wage: 12100000, years: 4, feeType: 'paid', fee: 900e6 }, { clubId: 'ARS', wage: 970000, years: 5, feeType: 'paid', fee: 700e6 }]; });
    const y0 = await pg.evaluate(() => __go('home', '.ofc'));
    const y1 = await pg.evaluate(() => __y(document.querySelectorAll('.ofc')[1]));
    await record(pg, dir(1, 'a'), 3.4, scroll({}, pg, 44, 62, y0, y1));
    // NSR teklifini kabul et -> havalimanı karşılaması
    await pg.evaluate(() => window.scrollTo(0, __y(document.querySelector('[data-offer="0"]'), 330)));
    await record(pg, dir(1, 'b1'), 3.0, { 12: () => pg.evaluate(() => document.querySelector('[data-offer="0"]').click()) });
    // gece hayatı + paparazzi
    await pg.evaluate(() => { document.querySelectorAll('.wel').forEach((e) => e.remove()); __go('life', '[data-life="night"]', 300); });
    await record(pg, dir(1, 'b2'), 2.4, { 10: () => pg.evaluate(() => { const c = U.chance; U.chance = () => true; Life.act('night'); U.chance = c; window.scrollTo(0, __y('[data-life="night"]', 300)); }) });
    // 23 yaşında düşüş: güç ve hoca ilişkisi
    await pg.evaluate(() => __go('profile'));
    const yr = await pg.evaluate(() => __y('=İlişkiler', 300));
    const acts = { 18: () => pg.evaluate(() => { const p = Game.p; p.age = 23; Object.keys(p.stats).forEach((k) => (p.stats[k] = 66)); p.rel.coach = 50; Game.render(); window.scrollTo(0, 0); }) };
    scroll(acts, pg, 36, 54, 0, yr);
    for (let i = 58; i <= 84; i++) acts[i] = () => pg.evaluate(([v, y]) => { Game.p.rel.coach = v; Game.p.rel.team = Math.min(Game.p.rel.team, 30); Game.render(); window.scrollTo(0, y); }, [Math.round(50 - 42 * ease((i - 58) / 26)), yr]);
    await record(pg, dir(1, 'c1'), 3.0, acts);
    // gazete: milli takıma çağrılmadın
    await pg.evaluate(() => { Game.state.news = []; Game.news('Teknik direktör performansından memnun değil, forma şansın azaldı.', 'bad'); Game.news('Türkiye turnuvada ama kadroya çağrılmadın.', 'bad'); });
    const yp = await pg.evaluate(() => __go('home', '=StarFoot Gazetesi', 140));
    await record(pg, dir(1, 'c2'), 2.4, scroll({}, pg, 0, 71, yp, yp + 60));
    console.log('1', pg.errs); await pg.close();
  }

  // ---------- 2: Sıfırdan Altın Top'a ----------
  {
    const pg = await page({ club: 'BUR', age: 17, st: 58, wage: 90000, fame: 2 });
    await pg.evaluate(() => __go('profile'));
    await record(pg, dir(2, 'a'), 3.0, scroll({}, pg, 0, 89, 0, 30));
    const yt = await pg.evaluate(() => __go('home', '.tr-row', 300));
    await record(pg, dir(2, 'b1'), 1.8, { 8: () => pg.evaluate((y) => { document.querySelector('[data-act="intense"]').click(); window.scrollTo(0, y); }, yt) });
    await pg.evaluate(() => __go('profile'));
    const up = {};
    for (let i = 0; i <= 45; i += 3) up[i] = () => pg.evaluate((k) => { const p = Game.p; p.age = 17 + Math.floor(k * 7 / 15); Object.keys(p.stats).forEach((s) => (p.stats[s] = Math.round(58 + 32 * k / 15))); Game.render(); window.scrollTo(0, 0); }, i / 3);
    await record(pg, dir(2, 'b2'), 1.7, up);
    await pg.evaluate(() => { Game.joinClub('RMA', 9e6, 5); Game.p.age = 24; window.scrollTo(0, 0); Welcome.show({ club: Game.club(), wage: 9e6, years: 5, feeText: 'Bonservis 95 Mn $', number: 10 }); });
    await record(pg, dir(2, 'c1'), 1.8);
    console.log('2', pg.errs); await pg.close();
  }

  // ---------- 3: Gece kulübü mü, antrenman mı? ----------
  {
    const pg = await page({ club: 'GAL', age: 21, st: 80, wage: 2e6, fame: 35 });
    await pg.evaluate(() => __go('home'));
    await record(pg, dir(3, 'a'), 3.0, { 4: () => pg.evaluate(() => Game.modal('<div class="ev-tag">Olay</div><h3>Yarın derbi var ama arkadaşların seni gece kulübüne çağırıyor.</h3>', [{ t: '🎉 Partiye git', fn: () => {} }, { t: '😴 Erken yat', fn: () => {} }])) });
    await record(pg, dir(3, 'b1'), 1.8, {
      3: () => pg.evaluate(() => document.querySelector('.modal-btns button').click()),
      7: () => pg.evaluate(() => { Player.addRel(Game.p, 'coach', -6); Game.news(`Magazin: ${Player.fullName(Game.p)} maç haftası gece kulübünde görüntülendi!`, 'bad'); Game.toast('Şehrin en popüler kulübünde harika bir gece! Ama paparazziler seni sabaha karşı yakaladı. Hoca hiç memnun değil.', 'bad'); }),
    });
    await pg.evaluate(() => { document.querySelectorAll('#toasts > *').forEach((t) => t.remove()); if (typeof Press !== 'undefined') Press.ask = () => Promise.resolve(); Game.roleFor = () => 'out'; Game.state.ap = 0; Game.playNext(); });
    for (let i = 0; i < 40; i++) { await pg.clock.runFor(100); if (await pg.evaluate(() => /kadrosuna almadı/.test(document.body.innerText))) break; }
    await pg.clock.runFor(400);
    await record(pg, dir(3, 'b2'), 2.6);
    await pg.close();
    const pg2 = await page({ club: 'GAL', age: 21, st: 80, wage: 2e6, fame: 35 });
    await pg2.evaluate(() => { Game.p.rel.coach = 22; });
    const ya = await pg2.evaluate(() => __go('home', '.ac-row', 300));
    await record(pg2, dir(3, 'c'), 3.0, { 14: () => pg2.evaluate((y) => { document.querySelector('[data-act="talk"]').click(); window.scrollTo(0, y); }, ya) });
    console.log('3', pg2.errs); await pg2.close();
  }

  // ---------- 4: Karmaşık grafik şart değil ----------
  {
    const pg = await page({ club: 'GAL', age: 22, st: 82, wage: 2e6, fame: 60, money: 3e7 });
    await pg.evaluate(() => { const p = Game.p, L = Life.ensure(p); Life.newSponsorOffer(p); Life.newSponsorOffer(p); Game.state.offers = [{ clubId: 'BAR', wage: 6.5e6, years: 5, feeType: 'paid', fee: 1.4e9 }]; Game.state.news = []; });
    const yw = await pg.evaluate(() => __go('home', document.querySelector('.tr-row').closest('.card'), 125));
    await record(pg, dir(4, 'a'), 4.0, scroll({}, pg, 6, 114, yw, yw + 330));
    const yo = await pg.evaluate(() => __go('home', '.ofc'));
    await record(pg, dir(4, 'b1'), 2.0, scroll({}, pg, 4, 56, yo, yo + 170));
    const yl = await pg.evaluate(() => __go('life', '=Menajer', 140));
    await record(pg, dir(4, 'b2'), 2.0, scroll({}, pg, 4, 56, yl, yl + 200));
    await pg.evaluate(() => __go('league'));
    await record(pg, dir(4, 'b3'), 2.0, scroll({}, pg, 4, 56, 0, 120));
    console.log('4', pg.errs); await pg.close();
  }

  // ---------- 5: Yerli yapım (kod ekranı + açılış ekranı) ----------
  {
    const src = fs.readFileSync(path.join(ROOT, 'js/game.js'), 'utf8').split('\n');
    const at = src.findIndex((l) => l.startsWith('const Events = {'));
    const code = src.slice(at - 1, at + 70).join('\n');
    const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const hl = (t) => esc(t)
      .replace(/(\/\/[^\n]*)/g, '<i class="c">$1</i>')
      .replace(/('[^'\n]*'|`[^`\n]*`)/g, '<i class="s">$1</i>')
      .replace(/\b(const|return|if|else|let|true|false|=&gt;)\b/g, '<i class="k">$1</i>');
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}body{margin:0;width:1080px;background:#0b1020;color:#c9d4f2;font:500 30px/1.5 'DejaVu Sans Mono',monospace}
      .bar{height:110px;background:#121933;display:flex;align-items:center;gap:18px;padding:0 36px;font:600 30px 'Barlow Semi Condensed',sans-serif;color:#8ea0d6}.bar b{width:22px;height:22px;border-radius:50%;background:#ff5f57}.bar b+b{background:#febc2e}.bar b+b+b{background:#28c840}
      pre{margin:0;padding:30px 36px;white-space:pre-wrap;word-break:break-all}i{font-style:normal}.c{color:#6b7aa8}.s{color:#ffcf3f}.k{color:#ff7ab0}</style></head>
      <body><div class="bar"><b></b><b></b><b></b><span>starfoot / js / game.js</span></div><pre>${hl(code)}</pre></body></html>`;
    const tmp = path.join(ST, '5'); fs.mkdirSync(tmp, { recursive: true });
    const f = path.join(tmp, 'code.html'); fs.writeFileSync(f, html);
    const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
    await p.goto('file://' + f); await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: path.join(tmp, 'code.png'), fullPage: true }); await p.close();
    const d = dir(5, 'a1'); fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true });
    execSync(`ffmpeg -loglevel error -y -loop 1 -i "${path.join(tmp, 'code.png')}" -vf "crop=1080:1920:0:'min(ih-1920,t*260)'" -t 1.6 -r 30 -q:v 3 -start_number 0 "${d}/f%04d.jpg"`);
    const pg = await open(b, 'tr');
    await pg.clock.runFor(400);
    await record(pg, dir(5, 'a2'), 1.4);
    await pg.close();
  }
  await b.close();
}

// ---------- kurgu ----------
const W = (d) => path.join(WORK, d); // clips.js klipleri
const S = (v, s) => dir(v, s);
const END = { title: 'StarFoot: Futbol Kariyeri', badge: 'APP STORE\'DA ÜCRETSİZ' };
// sahne: [kare klasörü, başlangıç, kare sayısı, sahne no]; sahne no -> yazılar
const V = [
  {
    id: 'para-mi-kariyer-mi',
    scenes: [
      ['18 YAŞINDA <em>SEÇİM ANI!</em> 😱', 'Futbol kariyerini tek bir imzayla mahveden o adam sen olmak ister miydin?'],
      ['PARA MI? 🤑 <em>KARAKTER Mİ?</em> 🏆', 'StarFoot\'ta 18 yaşında harika bir sezon geçirdim. Parayı seçip Suudi Arabistan\'a gittim...'],
      ['KARİYER <em>DÜŞÜŞTE!</em> 📉', '23 yaşında formumu kaybettim ve milli takımdan kesildim. Ama bir şansım daha var...'],
    ],
    segs: [[S(1, 'a'), 0, 102, 0], [S(1, 'b1'), 0, 90, 1], [S(1, 'b2'), 0, 72, 1], [S(1, 'c1'), 0, 90, 2], [S(1, 'c2'), 0, 72, 2]],
    end: { tag: 'KENDİ HİKAYENİ YAZ! ⚽👇', cta: 'Sen olsan hangisini seçerdin? App Store\'da StarFoot\'u ara, kendi hikayeni yaz!' },
    sfx: [['boom', 0], ['whoosh', 3.4], ['cash', 3.8], ['whoosh', 6.4], ['fail', 6.7], ['whoosh', 8.8], ['fail', 10.7], ['whoosh', 11.8], ['chime', 14.2]],
  },
  {
    id: 'sifirdan-altin-topa',
    scenes: [
      ['17 YAŞ → <em>GÜÇ: 58</em> 🇹🇷', 'Mobilde sıfırdan Altın Top kazanan bir Türk futbolcu çıkarmak ne kadar sürer?'],
      ['SIKI ÇALIŞMA + <em>DOĞRU KARARLAR</em> 💪', 'StarFoot\'ta alt ligde başladım. Doğru kararlar verdim, antrenmanı hiç aksatmadım.'],
      ['24 YAŞ → <em>DÜNYA STARI!</em> 🏆', '6. sezonda Şampiyonlar Kupası\'nı kaldırdım ve Altın Top\'u kazandım.'],
    ],
    segs: [[S(2, 'a'), 0, 90, 0], [S(2, 'b1'), 0, 54, 1], [S(2, 'b2'), 0, 51, 1], [W('moment'), 22, 96, 1], [S(2, 'c1'), 0, 54, 2], [W('trophy'), 0, 48, 2], [W('ballon'), 0, 78, 2]],
    end: { tag: 'APP STORE\'DA ÜCRETSİZ! 📲', cta: 'Kendi efsaneni yaratmaya hazırsan, StarFoot App Store\'da ücretsiz!' },
    sfx: [['boom', 0], ['whoosh', 3.0], ['whoosh', 4.8], ['whoosh', 6.5], ['boom', 7.6], ['whoosh', 9.7], ['chime', 11.5], ['boom', 13.1], ['chime', 15.7]],
  },
  {
    id: 'gece-kulubu-vs-antrenman',
    scenes: [
      ['DERBİ ÖNCESİ <em>GECE 02:00</em> 💀', 'Yarın derbi var ama arkadaşlar mekanı kapatmış...'],
      ['<em>KADRO DIŞI!</em> 🛑', 'Tabii ki gittik... Ve teknik direktör beni kadro dışı bıraktı.'],
      ['HER SEÇİM <em>BİR SONUÇTUR</em> ⚖️', 'StarFoot\'ta saha dışındaki her kararın bir bedeli var.'],
    ],
    segs: [[S(3, 'a'), 0, 90, 0], [S(3, 'b1'), 0, 54, 1], [S(3, 'b2'), 0, 78, 1], [S(3, 'c'), 0, 90, 2]],
    end: { tag: 'STARFOOT\'U İNDİR! ⚽', cta: 'Sen daha iyi yönetirim diyorsan StarFoot\'u hemen indir!' },
    sfx: [['boom', 0], ['whoosh', 3.0], ['fail', 3.25], ['whoosh', 4.8], ['fail', 5.1], ['whoosh', 7.4], ['cash', 7.9], ['chime', 10.4]],
  },
  {
    id: 'grafik-degil-futbol-akli',
    scenes: [
      ['GRAFİK DEĞİL, <em>FUTBOL AKLI!</em> 🧠', 'İyi bir futbol oyunu için 50 GB grafik şart değil.'],
      ['GERÇEK <em>KARİYER SİMÜLASYONU</em> 📋', 'StarFoot tamamen senin kararlarınla şekillenen saf bir kariyer simülasyonu.'],
    ],
    segs: [[S(4, 'a'), 0, 120, 0], [S(4, 'b1'), 0, 60, 1], [S(4, 'b2'), 0, 60, 1], [S(4, 'b3'), 0, 60, 1]],
    end: { tag: 'APP STORE: STARFOOT ⚽', cta: 'Aradığın o derinliği mobilde yaşamak için App Store\'da StarFoot\'u ara!' },
    sfx: [['boom', 0], ['whoosh', 4.0], ['whoosh', 6.0], ['whoosh', 8.0], ['chime', 10.0]],
  },
  {
    id: 'tek-basima-yaptim',
    scenes: [
      ['TEK BAŞIMA <em>YAPTIM!</em> 🇹🇷', 'Tek başıma geliştirdiğim mobil futbol kariyer simülasyonu sonunda yayınlandı!'],
      ['%100 TÜRKÇE <em>KARİYER SİMÜLASYONU</em> 🇹🇷', 'Saha içi heyecanından saha dışı kararlarına kadar tamamen Türkçe, mobil odaklı bir deneyim.'],
    ],
    segs: [[S(5, 'a1'), 0, 48, 0], [S(5, 'a2'), 0, 42, 0], [W('moment'), 22, 90, 1], [W('airport'), 6, 45, 1], [W('trophy'), 0, 78, 1]],
    end: { tag: 'APP STORE\'DAN ÜCRETSİZ İNDİR! 📲', cta: 'Deneyip geri bildirimlerinle bana destek olmak istersen StarFoot App Store\'da seni bekliyor! ⭐' },
    sfx: [['boom', 0], ['whoosh', 1.6], ['whoosh', 3.0], ['boom', 4.1], ['whoosh', 6.0], ['whoosh', 7.5], ['chime', 10.1]],
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
  cash: `aevalsrc='0.32*(sin(2*PI*1975*t)+0.7*sin(2*PI*2637*t))*exp(-t*7)*(t>0.09)+0.3*(sin(2*PI*1568*t))*exp(-t*12)':s=44100:d=0.9`,
  fail: `aevalsrc='0.28*sgn(sin(2*PI*(220-60*t)*t))*exp(-t*2.6)*(t<0.32 || t>0.38)':s=44100:d=0.75`,
  whoosh: `anoisesrc=d=0.45:c=pink:a=0.5:r=44100,bandpass=f=1400:w=1800,afade=in:d=0.22,afade=out:st=0.22:d=0.23`,
  chime: `aevalsrc='0.22*(sin(2*PI*1047*t)*exp(-t*3)+sin(2*PI*1319*t)*exp(-(t-0.12)*3)*(t>0.12)+sin(2*PI*1568*t)*exp(-(t-0.24)*3)*(t>0.24)+sin(2*PI*2093*t)*exp(-(t-0.36)*2.5)*(t>0.36))':s=44100:d=1.8`,
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
    const d = path.join(tmp, v.id); fs.mkdirSync(d, { recursive: true });
    for (const [i, [t, s]] of v.scenes.entries()) await shot(overlay(t, s), path.join(d, `o${i}.png`));
    await shot(endHtml({ ...END, ...v.end }, 'file://' + ICON), path.join(d, 'end.png'), false);
    const parts = [];
    v.segs.forEach(([fd, st, n, sc], i) => {
      const o = path.join(d, `s${i}.mp4`);
      const first = i === 0 || v.segs[i - 1][3] !== sc;
      const fade = first && i > 0 ? 'fade=in:st=0:d=0.15:alpha=1' : 'fade=in:st=0:d=0.01:alpha=1';
      execSync(`ffmpeg -loglevel error -y -framerate 30 -start_number ${st} -i "${fd}/f%04d.jpg" -loop 1 -t ${n / 30} -i "${path.join(d, `o${sc}.png`)}" -filter_complex "[0]scale=1080:1920,setsar=1[v];[1]format=rgba,${fade}[c];[v][c]overlay=0:0:shortest=1" -frames:v ${n} ${enc} "${o}"`);
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
    console.log('ok', out, dur.toFixed(1) + 's');
  }
  await b.close();
}

(MODE === 'rec' ? recAll() : make()).catch((e) => { console.error(e); process.exit(1); });
