// Reels 12 için oyun ekranları: telefon yenilikleri (Ek İş, Banka hareketleri, Arabalar + Garajım, Evim Emlak, Vitrin,
// Seyahat, Magazin, Yatırım, Mesajlar, Miras) ve Efsaneler Salonu Starpedia sayfası.
// Kullanım: (oyun sunucusu localhost:8765'te açıkken) node store/social/motion/capture12.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const OUT = path.join(__dirname, 'assets12', 'shots');
fs.mkdirSync(OUT, { recursive: true });
const shot = (pg, n) => pg.screenshot({ path: path.join(OUT, n + '.jpg'), type: 'jpeg', quality: 92 });
const clearToasts = (pg) => pg.evaluate(() => { document.getElementById('toasts').innerHTML = ''; });
const closeModals = async (pg) => { for (let i = 0; i < 8; i++) { const open = await pg.evaluate(() => { const m = document.getElementById('modal'); if (!m || m.classList.contains('hidden')) return false; const bb = m.querySelector('.modal-btns button:last-child'); if (bb) bb.click(); else { m.classList.add('hidden'); m.innerHTML = ''; } return true; }); if (!open) break; await pg.waitForTimeout(350); } };
const app = async (pg, k, sub, n, scroll) => {
  await pg.evaluate(([k, sub]) => { if (Phone.open) Phone.close(); Phone.show(k); if (sub) { Phone.sub = sub; Phone.render(); } }, [k, sub]);
  await pg.waitForTimeout(900);
  if (scroll) await pg.evaluate((y) => { const b = document.querySelector('.ph-body'); if (b) b.scrollTop = y; }, scroll);
  await pg.waitForTimeout(500); await clearToasts(pg); await shot(pg, n);
};

(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 3 });
  pg.on('pageerror', (e) => console.log('ERR', String(e).slice(0, 200)));
  await pg.goto('http://localhost:8765/oyna-r8k4tq.html');
  await pg.evaluate(() => { localStorage.clear(); localStorage.setItem('sf_v19', '1'); localStorage.setItem('starfoot_lang', 'tr'); localStorage.setItem('starfoot_tut', 'done'); localStorage.setItem('starfoot_whatsnew', '99'); localStorage.setItem('starfoot_premium', '1'); localStorage.setItem('starfoot_cur', 'TRY'); });
  await pg.reload(); await pg.waitForTimeout(900);
  await pg.evaluate(() => Create.open()); await pg.waitForTimeout(300);
  await pg.fill('#cr-name', 'Emir'); await pg.fill('#cr-sur', 'Kaya');
  await pg.selectOption('#cr-age', '15');
  await pg.click('#cr-go'); await pg.waitForTimeout(1200);
  await pg.evaluate(() => {
    const m = document.getElementById('modal'); m.classList.add('hidden'); m.innerHTML = '';
    const s = Game.state; const id = Object.keys(s.world.clubs).find((k) => k !== 'STREET' && s.world.clubs[k].league === 'TR1');
    if (s.street && !s.street.done) { s.street.done = true; s.clubId = id; s.contract = { type: 'youth', clubId: id, wage: 0, years: 0 }; delete s.world.clubs.STREET; s.youth = Youth.create(s.world, id, s.player.age); Cups.setupYouth(s); }
    s.player.energy = 100; s.ap = 3; Game.render();
  });
  await pg.waitForTimeout(400);
  // 1) 15 yaş: Ek İş
  await pg.evaluate(() => { Premium.active = false; });
  await app(pg, 'jobs', null, 'jobs');
  await pg.evaluate(() => { Premium.active = true; });

  // 2) 18 yaş: ilk profesyonel maaş, banka hareketleri
  await pg.evaluate(() => {
    const s = Game.state, p = s.player; p.age = 18; s.contract = { type: 'pro', clubId: s.clubId, wage: 85000, years: 3 };
    p.money = 40000; if (p.sl) delete p.sl.bk;
    const L = (t, a, sub) => { p.money += a; StarLife.ledger(t, a, sub); };
    L('Ek iş', 2400, 'Kafede garsonluk');
    L('İmza parası', 250000, Game.club().name);
    L('Maaş', 85000, Game.club().name);
    L('Alışveriş', -14000, 'Elektrikli Scooter');
    s.season.round = 6; L('Maaş', 85000, Game.club().name); L('Sponsor geliri', 42000, 'Krampon sponsoru'); L('Menajer payı', -12700);
    s.season.round = 7; L('Prim ve diğer gelirler', 60000); L('Maaş', 85000, Game.club().name);
    Game.render();
  });
  await app(pg, 'bank', null, 'bank');
  await app(pg, 'bank', null, 'bank_tx', 330);

  // 3) arabalar: ilk araba ve garaj
  await pg.evaluate(() => { const p = Game.p; p.age = 19; p.items = (p.items || []).concat(['scooter', 'hatch']); p.license = true; p.lic = true; });
  await app(pg, 'cars', null, 'cars', 0);
  await pg.evaluate(() => { const c = [...document.querySelectorAll('.ph-car')].find((x) => /İlk Araban/.test(x.innerText)); const b = document.querySelector('.ph-body'); if (c && b) b.scrollTop = c.offsetTop - 70; });
  await pg.waitForTimeout(400); await clearToasts(pg); await shot(pg, 'cars');
  await pg.evaluate(() => { const p = Game.p; p.age = 29; p.fame = 82; p.money = 420e6; p.items = (p.items || []).concat(['moto', 'suv', 'life4', 'classic', 'life6', 'jet']); });
  await app(pg, 'cars', 'garage', 'garage', 0);

  // 4) ev ve Vitrin
  await pg.evaluate(() => { Game.p.items.push('penthouse', 'life5'); });
  await app(pg, 'emlak', null, 'emlak', 0);
  await pg.evaluate(() => { const c = [...document.querySelectorAll('.ph-listing')].find((x) => /Burada yaşıyorsun/.test(x.innerText) && !/Eski evin/.test(x.innerText)); const b = document.querySelector('.ph-body'); if (c && b) b.scrollTop = c.offsetTop - 70; });
  await pg.waitForTimeout(400); await clearToasts(pg); await shot(pg, 'emlak');
  await pg.evaluate(() => { if (typeof Mall !== 'undefined') Mall.reset(); });
  await app(pg, 'shop', null, 'shop', 0);

  // 5) seyahat
  await pg.evaluate(() => { Game.state.ap = 3; });
  await app(pg, 'travel', null, 'travel', 0);
  await app(pg, 'travel', null, 'travel2', 520);

  // 6) magazin (kriz manşeti)
  await pg.evaluate(() => { const p = Game.p; p.sl = p.sl || {}; try { const m = p.sl.mg || (p.sl.mg = {}); m.cr = { i: 0, b: 'Kerem Aydın' }; } catch (e) { console.log(e.message); } });
  await app(pg, 'mag', null, 'mag', 0);

  // 7) yatırım: giyim markası ve kafe
  await pg.evaluate(() => { Phone.show('biz'); ['brand', 'cafe', 'flats'].forEach((k) => Phone.extClick({ dataset: { sl: 'bb:' + k } })); });
  await closeModals(pg);
  await pg.evaluate(() => { const d = Game.p.sl.bz; if (d && d.own) Object.values(d.own).forEach((o, i) => { o.last = [41000, 18500, 9200][i] || 5000; o.tot = [1.32e6, 410000, 260000][i] || 0; }); });
  await app(pg, 'biz', null, 'biz', 0);

  // 8) mesajlar
  await app(pg, 'msg', null, 'msg', 0);

  // 9) miras
  await pg.evaluate(() => { const p = Game.p; p.age = 34; p.totals = Object.assign(p.totals || {}, { goals: 388, assists: 171, apps: 590, ratingSum: 590 * 7.6 }); });
  await app(pg, 'legacy', null, 'legacy', 0);
  await app(pg, 'legacy', null, 'legacy2', 600);
  await pg.evaluate(() => Phone.close());

  // 10) emeklilik → Efsaneler Salonu → Starpedia
  await pg.evaluate(() => { const s = Game.state, p = s.player; p.age = 37; p.intl = Object.assign(p.intl || {}, { caps: 88, goals: 41 }); p.trophies = ['2029 Yıldızlar Ligi Şampiyonu', '2030 Gol Kralı', '2031 Altın Yıldız', '2032 Şampiyonlar Kupası', '2034 Dünya Şampiyonası']; try { Game.retire(); } catch (e) { console.log('retire', e.message); } });
  await pg.waitForTimeout(1200); await closeModals(pg);
  await pg.evaluate(() => { try { Game.menu ? Game.menu() : null; } catch (e) { /* yok */ } Legacy.show(); });
  await pg.waitForTimeout(700); await shot(pg, 'hof');
  const has = await pg.evaluate(() => { const b = document.querySelector('.hof-wiki'); if (b) b.click(); return !!b; });
  console.log('hof wiki button:', has);
  await pg.waitForTimeout(1200); await shot(pg, 'hofwiki');
  await pg.evaluate(() => { const el = document.getElementById('spedia'); if (el) el.scrollTop = 900; });
  await pg.waitForTimeout(500); await shot(pg, 'hofwiki2');
  await b.close();
})();
