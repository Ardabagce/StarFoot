// Game Center başarım listesini (10 dil) ve 512x512 rozet görsellerini üretir: node store/asc/gc-gen.js
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const LOC = { tr: ['tr'], en: ['en-US', 'en-GB'], es: ['es-ES', 'es-MX'], pt: ['pt-BR'], de: ['de-DE'], fr: ['fr-FR'], it: ['it'], id: ['id'], ar: ['ar-SA'], ja: ['ja'] };
const LB = {
  'sf.lb.goals': { tr: 'Kariyer Golleri', en: 'Career Goals', es: 'Goles en la carrera', pt: 'Gols na carreira', de: 'Karrieretore', fr: 'Buts en carrière', it: 'Gol in carriera', id: 'Gol Karier', ar: 'أهداف المسيرة', ja: '通算ゴール' },
  'sf.lb.trophies': { tr: 'Kupa ve Ödüller', en: 'Trophies & Awards', es: 'Trofeos y premios', pt: 'Troféus e prêmios', de: 'Titel & Auszeichnungen', fr: 'Trophées et prix', it: 'Trofei e premi', id: 'Trofi & Penghargaan', ar: 'الألقاب والجوائز', ja: 'タイトルと個人賞' },
  'sf.lb.ovr': { tr: 'En Yüksek Genel Güç', en: 'Best Overall Rating', es: 'Mejor valoración general', pt: 'Melhor geral', de: 'Beste Gesamtstärke', fr: 'Meilleure note globale', it: 'Miglior valutazione', id: 'Rating Tertinggi', ar: 'أعلى تقييم عام', ja: '最高総合力' },
  'sf.lb.followers': { tr: 'Takipçi', en: 'Followers', es: 'Seguidores', pt: 'Seguidores', de: 'Follower', fr: 'Abonnés', it: 'Follower', id: 'Pengikut', ar: 'المتابعون', ja: 'フォロワー' },
};
(async () => {
  const src = fs.readFileSync(path.join(ROOT, 'js/cloud.js'), 'utf8');
  const GC_ACH = eval('(' + /const GC_ACH = (\{[\s\S]*?\});/.exec(src)[1] + ')');
  const total = Object.values(GC_ACH).reduce((a, b) => a + b, 0);
  if (total > 1000) throw new Error('Game Center puan toplamı 1000\'i aşıyor: ' + total);
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 512, height: 512 } });
  await pg.goto('file://' + path.join(ROOT, 'oyna-r8k4tq.html'));
  await pg.waitForTimeout(800);
  const out = { achievements: [], leaderboards: [] };
  const base = await pg.evaluate((ids) => ids.map((id) => { const a = ACHIEVEMENTS.find((x) => x.id === id); return a && { id, tier: a.tier, cat: a.cat, name: a.name, desc: a.desc }; }), Object.keys(GC_ACH));
  base.forEach((a, i) => { if (!a) throw new Error('yok: ' + Object.keys(GC_ACH)[i]); });
  const tx = {};
  for (const l of Object.keys(LOC)) {
    if (l === 'tr') await pg.evaluate(() => { I18N.lang = 'tr'; });
    else await pg.evaluate((l) => I18N.load(l).then(() => { I18N.lang = l; I18N.enable(); }), l);
    tx[l] = await pg.evaluate((list) => list.map((a) => [I18N.t(a.name), I18N.t(a.desc)]), base);
  }
  base.forEach((a, i) => {
    const loc = {};
    Object.entries(LOC).forEach(([l, codes]) => codes.forEach((c) => (loc[c] = { name: tx[l][i][0], desc: tx[l][i][1] })));
    out.achievements.push({ id: 'sf.ach.' + a.id, ref: a.name, points: GC_ACH[a.id], image: `store/asc/gc/${a.id}.jpg`, locales: loc });
  });
  Object.entries(LB).forEach(([id, names]) => {
    const loc = {};
    Object.entries(LOC).forEach(([l, codes]) => codes.forEach((c) => (loc[c] = { name: names[l] })));
    out.leaderboards.push({ id, ref: names.tr, locales: loc });
  });
  fs.writeFileSync(path.join(ROOT, 'store/asc/gamecenter.json'), JSON.stringify(out, null, 1));
  // rozetler
  for (const a of base) {
    const html = await pg.evaluate((a) => {
      const col = { bronze: ['#6e3a14', '#e0995a', '#3a1c08'], silver: ['#5d6774', '#f2f6fa', '#2a3038'], gold: ['#8a6208', '#ffe27a', '#4a3304'] }[a.tier];
      const kind = { trophy: Trophy.kind(a.name + (a.id === 'ballon' || a.id === 'ballon3' ? ' Altın Yıldız' : a.id === 'boot' ? ' Gol Kralı' : ' Şampiyon')), match: 'motm' }[a.cat];
      const num = (/(\d+)$/.exec(a.id) || [])[1];
      const label = { hat: '3', poker: '4', r10: '10', debut: '1', pro: 'PRO', abroad: '✈', captain: 'C', fame75: '75', apps100: '100', goal1: '1', goal50: '50', assist50: '50', cap1: '1', cap50: '50', ovr80: '80', ovr90: '90', motm1: '1', fk1: '1', pen1: '1', hd1: '1', trophy1: '1', tr10: '10' }[a.id] || num || '';
      const ico = ['goal', 'special', 'intl'].includes(a.cat) ? 'ball' : a.cat === 'assist' ? 'arrow' : a.cat === 'skill' ? 'bolt' : 'star';
      const glyph = { ball: `<circle cx="256" cy="356" r="26" fill="${col[2]}" opacity=".7"/><path d="M256 340l13 9-5 15h-16l-5-15z" fill="${col[1]}" opacity=".9"/>`,
        arrow: `<path d="M226 356h44M256 340l18 16-18 16" fill="none" stroke="${col[2]}" stroke-opacity=".7" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`,
        bolt: `<path d="M262 330l-24 30h18l-8 24 26-32h-18z" fill="${col[2]}" opacity=".7"/>`,
        star: `<path d="M256 332l7 15 16 2-12 11 3 16-14-8-14 8 3-16-12-11 16-2z" fill="${col[2]}" opacity=".7"/>` }[ico];
      const inner = (a.cat === 'trophy' && !['trophy1', 'tr10'].includes(a.id)) ? `<g transform="translate(136 130) scale(3.75)">${Trophy.svg(kind).replace(/^<svg[^>]*>|<\/svg>$/g, '')}</g>`
        : `<text x="256" y="300" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="${label.length > 2 ? 120 : 160}" fill="${col[2]}" opacity=".85">${label}</text>${glyph}`;
      return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
        <defs><radialGradient id="bg" cx=".5" cy=".38" r=".75"><stop offset="0" stop-color="#1d3a7a"/><stop offset="1" stop-color="#050b1f"/></radialGradient>
        <linearGradient id="m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${col[1]}"/><stop offset=".55" stop-color="${col[0]}"/><stop offset="1" stop-color="${col[1]}"/></linearGradient>
        <radialGradient id="sh" cx=".35" cy=".3" r=".7"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
        <rect width="512" height="512" fill="url(#bg)"/>
        ${Array.from({ length: 24 }, (_, i) => `<path d="M256 256 L${256 + 300 * Math.cos(i / 12 * Math.PI)} ${256 + 300 * Math.sin(i / 12 * Math.PI)} L${256 + 300 * Math.cos((i + 0.5) / 12 * Math.PI)} ${256 + 300 * Math.sin((i + 0.5) / 12 * Math.PI)}z" fill="#fff" opacity=".035"/>`).join('')}
        <circle cx="256" cy="262" r="196" fill="#000" opacity=".35"/>
        <circle cx="256" cy="256" r="196" fill="url(#m)"/>
        <circle cx="256" cy="256" r="166" fill="none" stroke="${col[2]}" stroke-opacity=".35" stroke-width="6"/>
        <circle cx="256" cy="256" r="150" fill="url(#m)" opacity=".7"/>
        ${inner}
        <circle cx="256" cy="256" r="196" fill="url(#sh)"/>
      </svg>`;
    }, a);
    await pg.setContent(`<html><body style="margin:0;background:#000">${html}</body></html>`);
    await pg.screenshot({ path: path.join(ROOT, `store/asc/gc/${a.id}.jpg`), type: 'jpeg', quality: 90, clip: { x: 0, y: 0, width: 512, height: 512 } });
  }
  console.log('başarım', out.achievements.length, 'puan', total, 'tablo', out.leaderboards.length);
  await b.close();
})();
