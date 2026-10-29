// 1.0.11 mağaza görselleri için ham oyun ekranları: LANGS=tr,en node store/premium/capture2.js
// Sahneler: goal (kritik an), match (canlı maç + radar), trophy, street, wc, life, medals
// VIEW=ipad: iPad 13" ham ekranları raw2-ipad klasörüne
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '../..');
const IPAD = process.env.VIEW === 'ipad';
const OUT = path.join(__dirname, IPAD ? 'raw2-ipad' : 'raw2');
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const FD = 'file://' + path.join(__dirname, 'fonts');
  const css = [['Saira Condensed', 'saira-condensed', [600, 800, 900]], ['Barlow Semi Condensed', 'barlow-semi-condensed', [400, 500, 600, 700]]]
    .flatMap(([fam, f, ws]) => ws.flatMap((w) => ['latin', 'latin-ext'].map((sub) => `@font-face{font-family:'${fam}';font-weight:${w};font-style:normal;src:url('${FD}/${f}-${sub}-${w}-normal.woff2') format('woff2');}`))).join('')
    + '.toast,#toasts{display:none!important}';
  const want = (n) => !ONLY || ONLY.includes(n);

  for (const l of (process.env.LANGS || 'tr,en').split(',')) {
    const ja = l === 'ja' && process.env.JA_CSS ? fs.readFileSync(process.env.JA_CSS, 'utf8').replace(/url\((?!['"]?(?:https?|file):)['"]?([^)'"]+)['"]?\)/g, (m, u) => `url(file://${path.join(path.dirname(process.env.JA_CSS), u)})`) : '';
    const page = async () => {
      const pg = await b.newPage(IPAD ? { viewport: { width: 1032, height: 1376 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true } : { viewport: { width: 390, height: 800 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
      pg.errs = []; pg.on('pageerror', (e) => pg.errs.push(e.message));
      await pg.addInitScript((c) => { document.addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = c; document.head.appendChild(st); }); }, css + ja);
      await pg.goto('http://localhost:8765/oyna-r8k4tq.html');
      await pg.evaluate((l) => { localStorage.clear(); localStorage.setItem('starfoot_lang', l); localStorage.setItem('starfoot_tut', 'done'); localStorage.setItem('starfoot_whatsnew', '1.0.11'); localStorage.setItem('starfoot_premium', '1'); localStorage.setItem('starfoot_pack_wc', '1'); localStorage.setItem('starfoot_pack_legends', '1'); localStorage.setItem('starfoot_cur', { tr: 'TRY', en: 'USD', es: 'EUR', pt: 'EUR', de: 'EUR', fr: 'EUR', it: 'EUR', id: 'USD', ar: 'USD', ja: 'USD' }[l] || 'USD'); }, l);
      await pg.reload(); await pg.waitForTimeout(500);
      return pg;
    };
    const shot = async (pg, n, wait = 400) => { await pg.waitForTimeout(wait); await pg.screenshot({ path: path.join(OUT, `${l}-${n}.png`) }); };
    const closeModals = async (pg) => { for (let i = 0; i < 6; i++) { const bt = await pg.$('#modal:not(.hidden) .modal-btns button:last-child'); if (!bt) break; await bt.click().catch(() => {}); await pg.waitForTimeout(250); } };
    const newCareer = async (pg, age) => {
      await pg.click('[data-new="0"]');
      const [fn, sn] = l === 'tr' ? ['Emre', 'Yıldız'] : l === 'en' ? ['Alex', 'Stone'] : await pg.evaluate(() => I18N.defName());
      await pg.fill('#cr-name', fn); await pg.fill('#cr-sur', sn);
      if (age) await pg.selectOption('#cr-age', String(age));
      await pg.click('#cr-go'); await pg.waitForTimeout(300);
      await closeModals(pg);
    };
    // maçı başlat, araya giren pencereleri kapat
    const startMatch = async (pg) => {
      await pg.evaluate(() => { const s = Game.state; s.ap = 0; s.pendingEvent = null; s.pendingGift = null; Game.p.energy = 100; Game.playNext(); });
      for (let k = 0; k < 60; k++) {
        if (await pg.evaluate(() => { const m = document.getElementById('mt-sim'); return !!(m && m.offsetParent); })) break;
        await pg.evaluate(() => { const bt = document.querySelector('#modal:not(.hidden) .modal-btns button:last-child'); if (bt) bt.click(); });
        await pg.waitForTimeout(250);
      }
    };
    const waitMoment = async (pg) => {
      for (let i = 0; i < 260; i++) {
        if (await pg.evaluate(() => { const m = document.getElementById('mt-moment'); return m && !m.classList.contains('hidden') && !!m.querySelector('.mg-canvas'); })) return true;
        await pg.waitForTimeout(150);
      }
      return false;
    };

    // ---------- Yıldız kariyer ----------
    const pg = await page();
    await newCareer(pg, 17);
    await pg.evaluate(() => {
      const s = Game.state; s.street.done = true;
      Game.joinClub('GAL', 185000, 4);
      const p = Game.p; p.age = 24; p.fame = 88;
      Object.keys(p.stats).forEach((k) => (p.stats[k] = 90 + ((k.length * 7) % 8)));
      p.money = 46e6; p.social.followers = 6.4e6; p.totals.goals = 162; p.totals.apps = 231; p.totals.assists = 71; p.totals.motm = 31;
      p.trophies = ['2031: Süper Lig Şampiyonu', '2032: Avrupa Şampiyonlar Kupası Şampiyonu', '2032: Altın Yıldız', '2032: Gol Kralı', '2033: Türkiye Kupası Şampiyonu', '2033: Süper Lig Şampiyonu', '2033: Sezonun Oyuncusu'];
      p.lux = (typeof LUX !== 'undefined' ? LUX.slice(0, 4).map((x) => x.id) : []);
      p.energy = 96; p.morale = 92; s.ap = 3;
      p.intl = Object.assign(p.intl || {}, { caps: 54, goals: 29 });
      for (let i = 0; i < 7; i++) { try { World.simRound(Game.league(), i, (id) => s.world.clubs[id].roster, (id) => s.world.clubs[id].rating, []); } catch (e) { /* yok */ } }
      try { Ach.check(); } catch (e) { /* yok */ }
      try { ['goal', 'trophy', 'goal', 'fans', 'goal', 'training'].forEach((k) => Social.post(k)); } catch (e) { /* yok */ }
      if (typeof Press !== 'undefined') Press.ask = () => Promise.resolve();
      // ceza sahası pozisyonu gelsin (şut sahnesi)
      MOMENT_WEIGHTS.FW = { open: 100 };
      try { Cups.setup(s); } catch (e) { /* yok */ }
      if (s.cups && s.cups.ucl && !s.cups.ucl.teams.includes(s.clubId)) s.cups.ucl.teams[0] = s.clubId;
      s.pendingCup = 'ucl';
    });
    await closeModals(pg);
    if (want('match') || want('goal')) {
      await startMatch(pg);
      await pg.evaluate(() => document.querySelector('[data-s="4"]') && document.querySelector('[data-s="4"]').click());
      if (await waitMoment(pg)) { await pg.waitForTimeout(1100); if (want('goal')) await shot(pg, 'goal', 0); }
      if (want('match')) {
        // anı otomatik oynat, maç 15-44. dakika arasında akarken (kritik an ya da devre arası açık değilken) çek
        await pg.evaluate(() => { const a = document.getElementById('mm-auto'); if (a) a.click(); const s2 = document.querySelector('[data-s="2"]'); if (s2) s2.click(); });
        for (let i = 0; i < 160; i++) {
          await pg.waitForTimeout(120);
          const st = await pg.evaluate(() => { const m = document.getElementById('mt-moment'); const mn = parseInt((document.getElementById('mt-min') || {}).textContent, 10) || 0; return { open: m && !m.classList.contains('hidden'), mn }; });
          if (st.open) { await pg.evaluate(() => { const a = document.getElementById('mm-auto'); if (a) a.click(); const h = document.querySelector('#mt-moment .btn-big, #ht-go'); if (h && !document.getElementById('mm-auto').offsetParent) h.click(); }); continue; }
          if (st.mn >= 15 && st.mn <= 44) { await pg.evaluate(() => { const s1 = document.querySelector('[data-s="1"]'); if (s1) s1.click(); }); break; }
        }
        await shot(pg, 'match', 900);
      }
      await pg.evaluate(() => document.getElementById('mt-sim').click());
      await pg.waitForSelector('#ms-done', { timeout: 30000 }).catch(() => {});
      await pg.click('#ms-done').catch(() => {});
      await pg.waitForTimeout(600);
      await pg.evaluate(() => { document.querySelectorAll('.cer-trophy, .celebrate, .cel').forEach((e) => e.remove()); const m = document.getElementById('modal'); if (m) m.classList.add('hidden'); const mt = document.getElementById('match'); if (mt) mt.classList.add('hidden'); Game.state.pendingEvent = null; Game.state.seasonEnd = null; Game.render(); });
    }
    if (want('life')) {
      await pg.evaluate(() => { Game.p.money = 46e6; Game.tab = 'life'; UI.lifeView = 'life'; Game.render(); const c = document.querySelector('.card.lux'); window.scrollTo(0, c ? c.getBoundingClientRect().top + window.scrollY - 150 : 0); });
      await shot(pg, 'life', 700);
    }
    if (want('medals')) {
      await pg.evaluate(() => { Game.tab = 'profile'; UI.profView = 'career'; Game.render(); const d = document.querySelectorAll('.ach-cat'); if (d[5]) d[5].open = true; const c = d[5] || d[0]; window.scrollTo(0, c ? c.getBoundingClientRect().top + window.scrollY - 210 : 0); });
      await shot(pg, 'medals', 600);
    }
    if (want('trophy')) {
      await pg.evaluate((l) => { window.scrollTo(0, 0); const c = Game.club(); Celebrate.trophy({ title: I18N.t ? I18N.t('ŞAMPİYON!') : 'ŞAMPİYON!', sub: 'Avrupa Şampiyonlar Kupası', c1: c.c1, c2: c.c2, short: c.short, kit: Sprites.kits(c, { id: 'X', c1: '#1d4ed8', c2: '#fff' }).own, number: Game.p.shirt }); }, l);
      await shot(pg, 'trophy', 4300);
    }
    console.log(l, 'star', pg.errs.slice(0, 3));
    await pg.close();

    // ---------- Mahalle maçı ----------
    if (want('street')) {
      const p2 = await page();
      await newCareer(p2, 12);
      await p2.evaluate(() => { MOMENT_WEIGHTS.FW = { close: 80, open: 20 }; if (typeof Press !== 'undefined') Press.ask = () => Promise.resolve(); });
      await startMatch(p2);
      if (await waitMoment(p2)) await shot(p2, 'street', 1100);
      console.log(l, 'street', p2.errs.slice(0, 3));
      await p2.close();
    }

    // ---------- Dünya Şampiyonası ----------
    if (want('wc')) {
      const p3 = await page();
      const [fn, sn] = l === 'tr' ? ['Emre', 'Yıldız'] : l === 'en' ? ['Alex', 'Stone'] : await p3.evaluate(() => I18N.defName());
      await p3.evaluate(([fn, sn]) => WC.start({ nat: I18N.home(), name: fn, surname: sn, position: 'FW', foot: 'R' }), [fn, sn]);
      await p3.waitForTimeout(800);
      await closeModals(p3);
      await p3.evaluate(() => window.scrollTo(0, 0));
      await shot(p3, 'wc', 700);
      console.log(l, 'wc', p3.errs.slice(0, 3));
      await p3.close();
    }
  }
  await b.close();
})();
