// Oynanabilir reklam derleyici: node store/playable/build.js
// Çıktı: dist/<ağ>-<dil>/index.html (+ .zip). Ağlar: google (ExitApi), mraid (AppLovin/Unity/ironSource), web (önizleme)
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const D = __dirname, R = path.resolve(D, '../..');
const rd = (p) => fs.readFileSync(path.join(R, p), 'utf8');
const b64 = (p) => fs.readFileSync(path.join(R, p)).toString('base64');

// oyunun kendi kodu: util (U, Perf), ses, çizimler, mini oyun / vitrin
const util = rd('js/util.js').split('\n');
const perfEnd = util.findIndex((l) => l.startsWith('Perf.init();'));
const UTIL = rd('js/compat.js') + '\n' + util.slice(0, perfEnd + 1).join('\n');
const SPRITES = rd('js/sprites.js').replace("im.src = 'img/grass.jpg'", () => "im.src = 'data:image/jpeg;base64," + b64('img/grass.jpg') + "'");
const MG = [UTIL, rd('js/sfx.js'), SPRITES, 'const Weather = { draw() {} };', rd('js/minigame.js')].join('\n;\n');
const SHOP = (l) => [UTIL, `const I18N = { lang: '${l === 'zh' ? 'en' : l}' }; const Game = { state: null, p: null };`, rd('js/sfx.js'), rd('js/mallart.js'), rd('js/mall.js')].join('\n;\n');

// İngilizce: oyunun sözlüğünden metinler
global.window = global;
eval(rd('js/lang-en.js') + ';global.__EN = LANG_EN;');
eval(rd('js/lang-zh.js') + ';global.__ZH = LANG_ZH;');
const DICT = { en: global.__EN.exact, zh: global.__ZH.exact };
const FIX = {
  en: [['pill(`GÜÇ ', 'pill(`POWER '], [' RAKİP`', ' BEATEN`'], ["'<i></i>TEKRAR · 0.75x'", "'<i></i>REPLAY · 0.75x'"],
    ["'Rakip hamle yapınca <b>topu ters tarafa çek</b> · ekranın sol/sağına dokun ya da kaydır · <kbd>←</kbd> <kbd>→</kbd>'", "'When the defender commits, <b>pull the ball the other way</b> · tap or swipe left / right'"]],
  zh: [['pill(`GÜÇ ', 'pill(`力量 '], [' RAKİP`', ' 已过人`'], ["'<i></i>TEKRAR · 0.75x'", "'<i></i>回放 · 0.75x'"],
    ["'Rakip hamle yapınca <b>topu ters tarafa çek</b> · ekranın sol/sağına dokun ya da kaydır · <kbd>←</kbd> <kbd>→</kbd>'", "'对手出脚时，<b>把球拨向另一侧</b> · 点击或滑动屏幕左/右侧'"]],
};
// oyun kodundaki Türkçe metinleri oyunun kendi sözlüğüyle çevirir
const toLang = (l, src) => {
  if (!DICT[l]) return src;
  const EX = DICT[l];
  FIX[l].forEach(([a, b]) => { src = src.replace(a, () => b); });
  return src.replace(/'((?:[^'\\\n]|\\.)*)'/g, (m, s) => {
    if (!/[A-ZÇĞİÖŞÜçğıöşü ]/.test(s) || !EX[s] || /^[a-z0-9_.-]+$/.test(s)) return m;
    return "'" + EX[s].replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
  });
};

const END = {
  en: { endSub: 'Start as a kid in street football, get scouted, turn pro and become a legend.', c1: 'Your whole career', c2: 'Transfers & trophies', c3: 'Manager mode', cta: 'PLAY FREE', free: 'Free · iOS & Android', install: 'Install', again1: 'One more chance!', again2: 'Last chance!' },
  tr: { endSub: 'Sokakta çocukken başla, scout seni keşfetsin, profesyonel ol ve efsane ol.', c1: 'Bütün kariyerin', c2: 'Transfer ve kupalar', c3: 'Teknik direktör modu', cta: 'ÜCRETSİZ OYNA', free: 'Ücretsiz · iOS ve Android', install: 'İndir', again1: 'Bir şansın daha var!', again2: 'Son şans!' },
  zh: { endSub: '从街头踢球的孩子开始，被球探发掘，成为职业球员，最终成为传奇。', c1: '完整职业生涯', c2: '转会与奖杯', c3: '主教练模式', cta: '免费开玩', free: '免费 · iOS 和 Android', install: '下载', again1: '再来一次！', again2: '最后一次机会！' },
};
const SCORE = `<span class="mn">90+4'</span><span>STR</span><b id="score">1 - 1</b><span>BCK</span>`;
const SC = {
  penalty: { code: 'sc-penalty.js', game: 'mg', bar: SCORE,
    en: { final: 'CUP FINAL · LAST MINUTE', h1: 'SCORE THE', h2: 'WINNER!', sub: 'Pull back and release to shoot.', winH1: 'CHAMPIONS!', winH2: 'THIS IS JUST THE START', loseH1: 'SO CLOSE!', loseH2: 'YOUR CAREER AWAITS' },
    zh: { final: '杯赛决赛 · 最后一分钟', h1: '罚进这个球', h2: '赢得冠军！', sub: '向后拉再松开：射门', winH1: '冠军！', winH2: '这只是开始', loseH1: '差一点！', loseH2: '你的职业生涯在等你' },
    tr: { final: 'KUPA FİNALİ · SON DAKİKA', h1: 'ŞAMPİYONLUK', h2: 'GOLÜNÜ AT!', sub: 'Geri çek ve bırak: şut!', winH1: 'ŞAMPİYONSUN!', winH2: 'BU DAHA BAŞLANGIÇ', loseH1: 'ÇOK YAKLAŞTIN!', loseH2: 'KARİYERİN SENİ BEKLİYOR' } },
  freekick: { code: 'sc-penalty.js', game: 'mg', bar: SCORE,
    en: { final: 'DERBY · LAST MINUTE FREE KICK', h1: 'CURL IT OVER', h2: 'THE WALL!', sub: 'Pull back and release. Swipe sideways to curl.', winH1: 'WHAT A FREE KICK!', winH2: 'THIS IS JUST THE START', loseH1: 'SO CLOSE!', loseH2: 'YOUR CAREER AWAITS' },
    zh: { final: '德比大战 · 最后一分钟任意球', h1: '绕过人墙', h2: '直挂死角！', sub: '向后拉再松开，侧向滑动可打出弧线', winH1: '神级任意球！', winH2: '这只是开始', loseH1: '差一点！', loseH2: '你的职业生涯在等你' },
    tr: { final: 'DERBİ · SON DAKİKA FRİKİĞİ', h1: 'BARAJIN ÜSTÜNDEN', h2: 'GOLÜ AT!', sub: 'Geri çek ve bırak. Falso için yana kaydır.', winH1: 'MÜTHİŞ FRİKİK!', winH2: 'BU DAHA BAŞLANGIÇ', loseH1: 'ÇOK YAKLAŞTIN!', loseH2: 'KARİYERİN SENİ BEKLİYOR' } },
  dribble: { code: 'sc-dribble.js', game: 'mg', bar: SCORE, hand: ['30%', '55%', 'tapside'],
    en: { final: 'LAST MINUTE · SOLO RUN', h1: 'BEAT ALL', h2: '3 DEFENDERS!', sub: 'When a defender lunges, tap the other side.', winH1: 'YOU BEAT THEM ALL!', winH2: 'THIS IS JUST THE START', loseH1: 'SO CLOSE!', loseH2: 'YOUR CAREER AWAITS' },
    zh: { final: '最后一分钟 · 单刀突破', h1: '连过', h2: '三名后卫！', sub: '对手出脚时，点击另一侧', winH1: '你过掉了所有人！', winH2: '这只是开始', loseH1: '差一点！', loseH2: '你的职业生涯在等你' },
    tr: { final: 'SON DAKİKA · SOLO AKIN', h1: '3 RAKİBİ DE', h2: 'ÇALIMLA GEÇ!', sub: 'Rakip hamle yapınca diğer tarafa dokun.', winH1: 'HEPSİNİ GEÇTİN!', winH2: 'BU DAHA BAŞLANGIÇ', loseH1: 'ÇOK YAKLAŞTIN!', loseH2: 'KARİYERİN SENİ BEKLİYOR' } },
  shop: { code: 'sc-shop.js', game: 'shop', bar: '', hand: ['28%', '42%', 'tap'],
    en: { final: 'FIRST PRO CONTRACT SIGNED ✍️', h1: 'SPEND YOUR', h2: 'SIGNING BONUS!', sub: 'Pick 3 items from the shop.', winH1: 'LIVE THE', winH2: 'STAR LIFE', loseH1: 'YOUR STAR LIFE', loseH2: 'IS WAITING',
      app: 'Showcase', balance: 'Balance', bonus: 'Signing bonus received! Buy any 3 items.', buy: 'Buy', bought: 'Yours', bag: 'My items', more2: 'Nice! 2 more to go', more1: 'Last one!', done: 'All yours! 😎',
      endSub: 'Win trophies on the pitch. Off it: shopping, cars, houses and holidays.', c1: '3,500+ items', c2: 'Cars & houses', c3: 'Your whole career' },
    zh: { final: '签下第一份职业合同 ✍️', h1: '花掉你的', h2: '签字费！', sub: '从商店里挑选 3 件商品', winH1: '像巨星一样', winH2: '生活', loseH1: '巨星生活', loseH2: '在等你',
      app: '精品橱窗', balance: '余额', bonus: '签字费已到账！任选 3 件商品。', buy: '购买', bought: '已拥有', bag: '我的物品', more2: '太棒了！还差 2 件', more1: '最后一件！', done: '全都是你的！😎',
      endSub: '在球场上赢得奖杯，在场外购物、买车、买房、去度假。', c1: '3500+ 件商品', c2: '豪车与豪宅', c3: '完整职业生涯' },
    tr: { final: 'İLK PROFESYONEL SÖZLEŞME ✍️', h1: 'İMZA PARANI', h2: 'HARCA!', sub: 'Mağazadan 3 ürün seç.', winH1: 'YILDIZ GİBİ', winH2: 'YAŞA', loseH1: 'YILDIZ HAYATI', loseH2: 'SENİ BEKLİYOR',
      app: 'Vitrin', balance: 'Bakiye', bonus: 'İmza paran yattı! İstediğin 3 ürünü al.', buy: 'Satın al', bought: 'Senin', bag: 'Eşyalarım', more2: 'Harika! 2 tane daha', more1: 'Son bir tane!', done: 'Hepsi senin! 😎',
      endSub: 'Sahada kupalar kazan; saha dışında alışveriş, arabalar, evler ve tatiller.', c1: '3.500+ ürün', c2: 'Araba ve evler', c3: 'Bütün kariyerin' } },
};
const SHOP_CSS = `.sh{flex:1;min-height:0;display:flex;flex-direction:column;background:#f4f5f8;color:#151b2b}
.sh-top{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#fff;border-bottom:1px solid #e3e6ee}
.sh-app{font:800 22px var(--display);letter-spacing:.02em}.sh-bal{text-align:right;line-height:1.05}.sh-bal small{display:block;color:#6b7590;font-size:12px}.sh-bal b{font:800 22px var(--display);color:#0d8a4f}
.sh-note{margin:10px 12px 0;padding:8px 12px;border-radius:10px;background:#fff6d6;color:#6b5200;font-weight:700;font-size:14px}
.sh-grid{flex:1;min-height:0;overflow:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;padding:10px 12px 12px;align-content:start}
.sh-card{position:relative;display:flex;flex-direction:column;align-items:stretch;text-align:left;background:#fff;border:1px solid #e3e6ee;border-radius:14px;padding:8px;font-family:inherit;color:inherit;cursor:pointer;box-shadow:0 2px 6px rgba(20,30,60,.06);transition:transform .12s}
.sh-card:active{transform:scale(.97)}.sh-card img{width:100%;aspect-ratio:1;border-radius:10px;background:#eef0f4}
.sh-b{margin-top:6px;font-size:11px;font-weight:800;color:#8a6d1f;text-transform:uppercase;letter-spacing:.06em}.sh-n{font-size:13px;font-weight:700;line-height:1.15;min-height:30px}
.sh-p{font:800 18px var(--display);margin-top:2px}.sh-buy{margin-top:6px;text-align:center;background:#151b2b;color:#fff;border-radius:9px;padding:6px;font-weight:800;font-size:14px}
.sh-card.own{outline:3px solid #0d8a4f}.sh-card.own .sh-buy{background:#0d8a4f}
.sh-bag{display:flex;align-items:center;gap:10px;padding:10px 14px;padding-bottom:max(10px,env(safe-area-inset-bottom));background:#151b2b;color:#fff;font-weight:800}
.sh-slots{display:flex;gap:8px;flex:1}.sh-slots i{width:46px;height:46px;border-radius:10px;border:2px dashed rgba(255,255,255,.35);background:center/cover no-repeat}.sh-slots i.on{border:2px solid #ffcf3f;animation:pop .35s}
@keyframes pop{50%{transform:scale(1.2)}}.sh-bag b{font:800 22px var(--display);color:#ffcf3f}
.sh-fly{position:fixed;z-index:40;border-radius:10px;transition:transform .5s cubic-bezier(.5,0,.3,1),opacity .5s;transform-origin:0 0;pointer-events:none}
@keyframes tap{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(.85)}}
@keyframes tapside{0%,40%{transform:translateX(0)}50%,90%{transform:translateX(150px)}}
#msg{top:auto;bottom:90px}`;
const NET_HEAD = {
  google: '<script src="https://tpc.googlesyndication.com/pagead/gadgets/html5/api/exitapi.js"></script>',
  mraid: '<script src="mraid.js"></script>',
  web: '',
};
const font = (fam, w, f) => `@font-face{font-family:"${fam}";font-weight:${w};src:url(data:font/woff2;base64,${b64('store/premium/fonts/' + f)}) format("woff2")}`;
const FONTS = [
  font('Saira Condensed', 800, 'saira-condensed-latin-800-normal.woff2'), font('Saira Condensed', 800, 'saira-condensed-latin-ext-800-normal.woff2'),
  font('Barlow Semi Condensed', 600, 'barlow-semi-condensed-latin-600-normal.woff2'), font('Barlow Semi Condensed', 600, 'barlow-semi-condensed-latin-ext-600-normal.woff2'),
  font('Barlow Semi Condensed', 800, 'barlow-semi-condensed-latin-700-normal.woff2'), font('Barlow Semi Condensed', 800, 'barlow-semi-condensed-latin-ext-700-normal.woff2'),
].join('\n') + '\n.mg-lift{display:none!important}';
const ICON = 'data:image/png;base64,' + b64('store/icon-512.png');
const SND = { goal: b64('snd/goal.mp3'), cheer: b64('snd/cheer.mp3'), crowd: b64('snd/crowd.mp3') };
const shell = fs.readFileSync(path.join(D, 'shell.html'), 'utf8');
const common = fs.readFileSync(path.join(D, 'common.js'), 'utf8');

const out = path.join(D, 'dist');
fs.rmSync(out, { recursive: true, force: true });
const only = process.argv[2];
for (const [sc, cfg] of Object.entries(SC)) for (const net of Object.keys(NET_HEAD)) for (const l of ['en', 'tr', 'zh']) {
  if (only && only !== sc) continue;
  const t = Object.assign({}, END[l], cfg[l]);
  let game = cfg.game === 'shop' ? SHOP(l) : MG;
  game = toLang(l, game);
  const html = shell
    .replace('__LANG__', l).replace('__NETWORK_HEAD__', NET_HEAD[net]).replace('__FONTS__', () => FONTS).replace('__CSS__', () => (cfg.game === 'shop' ? SHOP_CSS : '')).replace('__ICON__', ICON)
    .replace('__BAR__', () => cfg.bar)
    .replace('__T_INSTALL__', t.install).replace('__T_FINAL__', t.final).replace('__T_H1__', t.h1).replace('__T_H2__', t.h2).replace('__T_SUB__', t.sub)
    .replace('__GAME__', () => game)
    .replace('__AD__', () => `window.AD_T=${JSON.stringify(t)};window.AD_NET=${JSON.stringify(net)};window.AD_SC=${JSON.stringify(sc)};window.AD_CUR=${JSON.stringify(l === 'tr' ? 'TRY' : 'USD')};window.AD_HAND=${JSON.stringify(cfg.hand || null)};window.AD_ICON=${JSON.stringify(ICON)};window.AD_SND=${JSON.stringify(cfg.game === 'shop' ? {} : SND)};\n${common}\n${fs.readFileSync(path.join(D, cfg.code), 'utf8')}`);
  const dir = path.join(out, `${sc}-${net}-${l}`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  if (net !== 'web') execSync(`cd "${dir}" && zip -q -9 ../starfoot-${sc}-${net}-${l}.zip index.html`);
  console.log(`${sc}-${net}-${l}: ${(html.length / 1048576).toFixed(2)} MB`);
}
