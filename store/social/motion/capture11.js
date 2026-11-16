// Reels 11 için oyun ekranları: çocuklar (bebek ismi, "ben de futbolcu olacağım"), emeklilik/oğlunla devam,
// Teknik Direktör sürükle-bırak diziliş, gelişim planı, tarz öğrenme haberi.
// Kullanım: (oyun sunucusu localhost:8765'te açıkken) node store/social/motion/capture11.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const OUT = path.join(__dirname, 'assets11', 'shots');
fs.mkdirSync(OUT, { recursive: true });
const shot = (pg, n, full) => pg.screenshot({ path: path.join(OUT, n + '.jpg'), type: 'jpeg', quality: 92, fullPage: !!full });
const clearModal = (pg) => pg.evaluate(() => { const m = document.getElementById('modal'); m.classList.add('hidden'); m.innerHTML = ''; });
const clearToasts = (pg) => pg.evaluate(() => { document.getElementById('toasts').innerHTML = ''; });
const fresh = async (b, extra) => {
  const pg = await b.newPage({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 3 });
  pg.on('pageerror', (e) => console.log('ERR', String(e).slice(0, 160)));
  await pg.goto('http://localhost:8765/oyna-r8k4tq.html');
  await pg.evaluate((x) => { localStorage.clear(); localStorage.setItem('sf_v19', '1'); localStorage.setItem('starfoot_lang', 'tr'); localStorage.setItem('starfoot_tut', 'done'); localStorage.setItem('starfoot_whatsnew', '99'); if (x) localStorage.setItem(x, '1'); }, extra);
  await pg.reload(); await pg.waitForTimeout(900);
  return pg;
};

(async () => {
  const b = await chromium.launch();
  // ================= KARİYER: ÇOCUKLAR =================
  const pg = await fresh(b);
  await pg.evaluate(() => Create.open()); await pg.waitForTimeout(300);
  await pg.fill('#cr-name', 'Emir'); await pg.fill('#cr-sur', 'Kaya');
  await pg.selectOption('#cr-age', '16');
  await pg.click('#cr-go'); await pg.waitForTimeout(1200);
  await pg.evaluate(() => {
    const m = document.getElementById('modal'); m.classList.add('hidden'); m.innerHTML = '';
    const s = Game.state; const id = Object.keys(s.world.clubs).find((k) => k !== 'STREET' && s.world.clubs[k].league === 'TR1');
    if (s.street && !s.street.done) { s.street.done = true; s.clubId = id; s.contract = { type: 'youth', clubId: id, wage: 0, years: 0 }; delete s.world.clubs.STREET; s.youth = Youth.create(s.world, id, s.player.age); Cups.setupYouth(s); }
    const p = s.player; p.age = 31; p.fame = 74; p.money = 18e6; p.rel.family = 92; p.morale = 95;
    const L = Life.ensure(p);
    L.gf = { name: 'Defne', job: 'Mimar', rel: 96, since: s.season.year - 7, married: true, wedY: s.season.year - 6 };
    L.kids = [];
    L.babyNew = { sex: 'b', by: s.season.year, names: ['Arda', 'Kerem', 'Aras'] };
    s.ap = 3; Game.tab = 'life'; UI.lifeView = 'life'; Game.render(); window.scrollTo(0, 0);
  });
  await pg.waitForTimeout(500);
  await pg.evaluate(() => { const k = document.querySelector('.lf-kids'); window.scrollTo(0, k.getBoundingClientRect().top + scrollY - 150); });
  await pg.waitForTimeout(300); await shot(pg, 'k_baby');
  // isim seç, 8 yıl sonrası: top oyna -> "Ben de senin gibi futbolcu olacağım!"
  await pg.evaluate(() => {
    const s = Game.state, L = s.player.life;
    Life.nameBaby('Arda'); s.player.age = 39;
    L.kids[0].by = s.season.year - 8; L.kids[0].bond = 88; L.kids[0].ball = 2;
    L.kids.push({ n: 'Ela', sex: 'g', by: s.season.year - 4, bond: 93 });
    s.ap = 3; Game.render();
  });
  await clearToasts(pg); await pg.waitForTimeout(300);
  await pg.evaluate(() => { const k = document.querySelector('.lf-kids'); window.scrollTo(0, k.getBoundingClientRect().top + scrollY - 150); });
  await pg.waitForTimeout(200);
  await clearToasts(pg);
  await pg.evaluate(() => { document.querySelector('[data-kact="ball"]').click(); });
  await pg.waitForTimeout(250);
  await pg.evaluate(() => { const k = document.querySelector('.lf-kids'); window.scrollTo(0, k.getBoundingClientRect().top + scrollY - 150); });
  await pg.waitForTimeout(250); await shot(pg, 'k_dream');
  await clearToasts(pg); await pg.waitForTimeout(100); await shot(pg, 'k_card');
  // Starpedia (kariyer sayfası) ve emeklilik ekranı (oğlunla devam et)
  await pg.evaluate(() => { const s = Game.state, p = s.player; p.age = 38; p.totals = Object.assign(p.totals || {}, { goals: 412, assists: 188, apps: 640, ratingSum: 640 * 7.68 }); p.intl = Object.assign(p.intl || {}, { caps: 96, goals: 44 }); p.money = 48.6e6; p.trophies = ['2029 Yıldızlar Ligi Şampiyonu', '2030 Gol Kralı', '2031 Altın Yıldız', '2032 Şampiyonlar Kupası', '2034 Dünya Şampiyonası']; try { Game.retire(); } catch (e) { console.log('retire', e.message); } });
  await pg.waitForTimeout(1200);
  for (let i = 0; i < 6; i++) { const open = await pg.evaluate(() => { const m = document.getElementById('modal'); if (m.classList.contains('hidden')) return false; const bb = m.querySelector('.modal-btns button:last-child'); if (bb) bb.click(); else m.classList.add('hidden'); return true; }); if (!open) break; await pg.waitForTimeout(500); }
  await pg.evaluate(() => { const h = document.querySelector('.heir'); if (h) h.scrollIntoView({ block: 'center' }); }); await pg.waitForTimeout(300);
  await shot(pg, 'k_retire'); await shot(pg, 'k_retire_full', true);
  console.log('heir button:', await pg.evaluate(() => { const b = [...document.querySelectorAll('#end button')].map((x) => x.innerText.trim()); return b.join(' | '); }));
  await pg.close();

  // ================= TEKNİK DİREKTÖR =================
  const tp = await fresh(b, 'starfoot_pack_coach');
  await tp.evaluate(() => { Coach.start({ name: 'Fatih', surname: 'Demir', nat: 'TUR', rep: 35, age: 41 }, 'GAL'); });
  await tp.waitForTimeout(400); await clearModal(tp);
  await tp.click('[data-cmv="tactic"]'); await tp.waitForTimeout(400);
  await tp.evaluate(() => { const p = document.querySelector('.cm-pitch'); window.scrollTo(0, p.getBoundingClientRect().top + scrollY - 120); });
  await tp.waitForTimeout(300); await shot(tp, 't_lineup'); await shot(tp, 't_lineup_full', true);
  // sürükleme anı: genç yedek, sahadaki aynı mevki oyuncusunun üstünde
  const pair = await tp.evaluate(() => {
    const s = Coach.s; const bench = [...document.querySelector('.cm-bchips').querySelectorAll('[data-dnd]')].map((x) => +x.dataset.dnd);
    const cand = bench.map(Coach.P).filter((p) => p.pos !== 'GK').sort((a, c) => (c.pos === 'MF') - (a.pos === 'MF') || a.age - c.age);
    for (const p of cand) { const t = s.xi.map(Coach.P).find((x) => x.pos === p.pos); if (t) { p.age = 17; p.pot = Math.max(p.pot, 88); return [p.id, t.id]; } }
  });
  await tp.evaluate(() => Coach.render()); await tp.waitForTimeout(200);
  await tp.evaluate(() => { const p = document.querySelector('.cm-pitch'); window.scrollTo(0, p.getBoundingClientRect().top + scrollY - 130); });
  await tp.waitForTimeout(200);
  const a = await tp.$(`.cm-bchip[data-dnd="${pair[0]}"]`), c = await tp.$(`.cm-dot[data-dnd="${pair[1]}"]`);
  const ba = await a.boundingBox(), bc = await c.boundingBox();
  console.log('drag', JSON.stringify(ba), JSON.stringify(bc));
  await tp.mouse.move(ba.x + ba.width / 2, ba.y + ba.height / 2); await tp.mouse.down();
  await tp.mouse.move(ba.x + ba.width / 2 + 14, ba.y + ba.height / 2 - 6);
  const ex = bc.x + bc.width / 2, ey = bc.y + bc.height / 2 + 6;
  for (let i = 1; i <= 10; i++) await tp.mouse.move(ba.x + ba.width / 2 + (ex - ba.x - ba.width / 2) * i / 10, ba.y + ba.height / 2 + (ey - ba.y - ba.height / 2) * i / 10);
  await tp.waitForTimeout(150); await shot(tp, 't_drag');
  await tp.mouse.up(); await tp.waitForTimeout(400); await clearToasts(tp);
  await tp.evaluate(() => { const p = document.querySelector('.cm-pitch'); window.scrollTo(0, p.getBoundingClientRect().top + scrollY - 40); });
  await tp.waitForTimeout(200); await shot(tp, 't_after');
  // oyuncu kartı: gelişim planı (yoğun bireysel)
  await tp.evaluate((id) => { const p = Coach.P(id); p.plan = 'fast'; Coach.playerInfo(id); }, pair[0]);
  await tp.waitForTimeout(500); await shot(tp, 't_plan');
  await tp.evaluate((id) => { const box = document.querySelector('#modal .cm-plan'); const sc = document.querySelector('#modal .modal-card, #modal .modal-box') || document.getElementById('modal'); if (box) box.scrollIntoView({ block: 'center' }); }, pair[0]);
  await tp.waitForTimeout(300); await shot(tp, 't_plan2');
  await clearModal(tp);
  // tarz eğitimi: 8 hafta sonra haber
  await tp.evaluate((id) => {
    const s = Coach.s, p = Coach.P(id);
    const opts = Object.keys(CM_STY).filter((k) => CM_STY[k].pos === p.pos && k !== p.sty);
    p.plan = 'style'; p.planSty = opts.includes('playmaker') ? 'playmaker' : opts[0]; p.planW = 7;
    Coach.week(); Coach.view = 'home'; Coach.render(); window.scrollTo(0, 0);
  }, pair[0]);
  await tp.waitForTimeout(400); await clearToasts(tp);
  await tp.evaluate(() => { const n = [...document.querySelectorAll('.cm-msg')].find((x) => /tarz/.test(x.innerText)); if (n) window.scrollTo(0, n.getBoundingClientRect().top + scrollY - 300); });
  await tp.waitForTimeout(300); await shot(tp, 't_news');
  await tp.close();
  await b.close();
})();
