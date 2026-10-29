// Tanıtım görselleri için ham oyun ekranlarını yakalar: node store/premium/capture.js
const { chromium } = require('playwright');
const path = require('path');
const ROOT = path.join(__dirname, '../..');
// VIEW=ipad: iPad 13" (1032x1376 nokta, 2x) için ham ekranlar raw-ipad klasörüne
const IPAD = process.env.VIEW === 'ipad';
const OUT = path.join(__dirname, IPAD ? 'raw-ipad' : 'raw');
(async () => {
  require('fs').mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  for (const l of (process.env.LANGS || 'tr,en').split(',')) {
    const pg = await b.newPage(IPAD ? { viewport: { width: 1032, height: 1376 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true } : { viewport: { width: 390, height: 800 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
    const errs = []; pg.on('pageerror', (e) => errs.push(e.message));
    // Oyunun yazı tipleri (internet olmadan da): store/premium/fonts
    const FD = 'file://' + path.join(__dirname, 'fonts');
    const css = [['Saira Condensed', 'saira-condensed', [600, 800, 900]], ['Barlow Semi Condensed', 'barlow-semi-condensed', [400, 500, 600, 700]]]
      .flatMap(([fam, f, ws]) => ws.flatMap((w) => ['latin', 'latin-ext'].map((sub) => `@font-face{font-family:'${fam}';font-weight:${w};font-style:normal;src:url('${FD}/${f}-${sub}-${w}-normal.woff2') format('woff2');}`))).join('');
    // Japonca: Noto Sans JP (JA_CSS = Google Fonts CSS dosyası; oyunun yazı tipi listesinde zaten var)
    const ja = l === 'ja' && process.env.JA_CSS ? require('fs').readFileSync(process.env.JA_CSS, 'utf8').replace(/url\((?!['"]?(?:https?|file):)['"]?([^)'"]+)['"]?\)/g, (m, u) => `url(file://${path.join(path.dirname(process.env.JA_CSS), u)})`) : '';
    await pg.addInitScript((css) => { document.addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); }); }, css + ja);
    await pg.goto('file://' + path.join(ROOT, 'oyna-r8k4tq.html'));
    await pg.evaluate((l) => { localStorage.clear(); localStorage.setItem('starfoot_lang', l); }, l); await pg.reload();
    await pg.waitForTimeout(400);
    await pg.click('[data-new="0"]');
    const [fn, sn] = l === 'tr' ? ['Emre', 'Yıldız'] : l === 'en' ? ['Alex', 'Stone'] : await pg.evaluate(() => I18N.defName());
    await pg.fill('#cr-name', fn); await pg.fill('#cr-sur', sn);
    await pg.selectOption('#cr-age', '17'); await pg.click('#cr-go'); await pg.click('.modal-btns button');
    const setup = () => {
      const s = Game.state; s.street.done = true;
      Game.joinClub('GAL', 185000, 4);
      const p = Game.p; p.age = 23;
      Object.keys(p.stats).forEach((k) => (p.stats[k] = 92 + ((k.length * 7) % 7)));
      p.money = 8.6e6; p.social.followers = 4.2e6; p.totals.goals = 118; p.totals.apps = 196; p.totals.assists = 57;
      p.energy = 96; p.morale = 88; s.ap = 3;
      for (let i = 0; i < 7; i++) { try { World.simRound(Game.league(), i, (id) => s.world.clubs[id].roster, (id) => s.world.clubs[id].rating, []); } catch (e) {} }
      if (Social.post) { try { ['goal', 'trophy', 'training', 'goal', 'fans', 'goal'].forEach((k) => Social.post(k)); } catch (e) {} }
    };
    await pg.evaluate(setup);
    await pg.evaluate(() => { if (typeof Press !== 'undefined') Press.ask = () => Promise.resolve(); });
    const shot = async (n, fn, wait = 500) => { if (fn) await pg.evaluate(fn); await pg.evaluate(() => document.querySelectorAll('.toast, #toasts > *').forEach((t) => t.remove())); await pg.waitForTimeout(wait); await pg.screenshot({ path: path.join(OUT, `${l}-${n}.png`) }); };
    // 1) Şampiyonlar Kupası maç günü (yıldızlı tema)
    await shot('matchday', () => {
      const s = Game.state; try { Cups.setup(s); } catch (e) {}
      if (s.cups && s.cups.ucl && !s.cups.ucl.teams.includes(s.clubId)) s.cups.ucl.teams[0] = s.clubId;
      s.pendingCup = 'ucl'; Game.tab = 'home'; Game.render(); window.scrollTo(0, 0);
    });
    // 2) Maçta kritik an (şut sahnesi) ve 2b) maçın oyuncusu ekranı (çıkana kadar tekrar)
    let momentDone = false;
    for (let tries = 0; tries < 8; tries++) {
      await pg.evaluate(() => { const s = Game.state; s.ap = 0; s.pendingEvent = null; s.pendingGift = null; s.pendingCup = s.pendingCup || null; Game.p.energy = 100; Game.playNext(); });
      // araya giren pencereleri (olay, kupa kurası, basın toplantısı) kapat
      for (let k = 0; k < 60; k++) {
        if (await pg.evaluate(() => { const m = document.getElementById('mt-sim'); return !!(m && m.offsetParent); })) break;
        await pg.evaluate(() => { const b = document.querySelector('#modal:not(.hidden) .modal-btns button'); if (b) b.click(); });
        await pg.waitForTimeout(250);
      }
      await pg.waitForSelector('#mt-sim', { timeout: 15000 });
      if (!momentDone) {
        let got = false;
        for (let i = 0; i < 200 && !got; i++) {
          got = await pg.evaluate(() => { const m = document.getElementById('mt-moment'); return m && !m.classList.contains('hidden') && !!m.querySelector('.mg-canvas'); });
          if (!got) await pg.waitForTimeout(150);
        }
        await pg.waitForTimeout(900);
        await shot('moment', null, 200);
        momentDone = true;
      }
      await pg.evaluate(() => document.getElementById('mt-sim').click());
      await pg.waitForSelector('#ms-done', { timeout: 30000 }).catch(() => {});
      await pg.waitForTimeout(400);
      const motm = await pg.evaluate(() => !!document.querySelector('.motm-av'));
      if (motm) { await shot('summary', () => { const h = document.getElementById('mm-host'); if (h) h.scrollTop = 0; }, 900); }
      await pg.click('#ms-done').catch(() => {});
      await pg.waitForTimeout(500);
      await pg.evaluate(() => { document.querySelectorAll('.cer-trophy').forEach((e) => e.remove()); const m = document.getElementById('modal'); if (m && !m.classList.contains('hidden')) m.classList.add('hidden'); Game.state.pendingEvent = null; Game.state.pendingGift = null; Game.state.seasonEnd = null; });
      if (motm) break;
    }
    // 3) Kupalar / lig tablosu
    await shot('cups', () => { Game.tab = 'league'; UI.lgView = 'cups'; UI.cupSel = 'ucl'; Game.render(); window.scrollTo(0, 0); });
    await shot('table', () => { Game.tab = 'league'; UI.lgView = 'table'; Game.render(); window.scrollTo(0, 0); });
    // 4) Sosyal medya profili
    await shot('social', () => { Game.tab = 'profile'; UI.profView = 'profile'; Game.render(); const ig = document.querySelector('.ig-prof, .ig, .social'); window.scrollTo(0, ig ? ig.getBoundingClientRect().top + window.scrollY - 120 : 0); });
    // 5) Saha dışı hayat
    await shot('life', () => { Game.tab = 'life'; UI.lifeView = 'life'; Game.render(); window.scrollTo(0, 0); });
    // 6) Kupa töreni
    await pg.evaluate((l) => { const c = Game.club(); Celebrate.trophy({ title: l === 'en' ? 'CHAMPIONS!' : 'ŞAMPİYON!', sub: l === 'en' ? 'European Champions Cup' : 'Avrupa Şampiyonlar Kupası', c1: c.c1, c2: c.c2, short: c.short, kit: Sprites.kits(c, { id: 'X', c1: '#1d4ed8', c2: '#fff' }).own }); }, l);
    await pg.waitForTimeout(4200);
    await shot('trophy', null, 0);
    console.log(l, errs.slice(0, 3));
    await pg.close();
  }
  await b.close();
})();
