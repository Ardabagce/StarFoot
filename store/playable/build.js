// Oynanabilir reklam derleyici: node store/playable/build.js
// Çıktı: dist/<ağ>-<dil>/index.html (+ .zip). Ağlar: google (ExitApi), mraid (AppLovin/Unity/ironSource), web (önizleme)
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const D = __dirname, R = path.resolve(D, '../..');
const rd = (p) => fs.readFileSync(path.join(R, p), 'utf8');
const b64 = (p) => fs.readFileSync(path.join(R, p)).toString('base64');

// oyunun kendi kodu: util (U, Perf), ses, çizimler, mini oyun
const util = rd('js/util.js').split('\n');
const perfEnd = util.findIndex((l) => l.startsWith('Perf.init();'));
const GAME_SRC = [util.slice(0, perfEnd + 1).join('\n'), rd('js/sfx.js'), rd('js/sprites.js').replace("im.src = 'img/grass.jpg'", () => "im.src = 'data:image/jpeg;base64," + b64('img/grass.jpg') + "'"), 'const Weather = { draw() {} };', rd('js/minigame.js')].join('\n;\n');

// İngilizce: oyunun sözlüğünden mini oyun metinleri
global.window = global;
eval(rd('js/lang-en.js') + ';global.__L = LANG_EN;');
const EX = global.__L.exact;
const toEn = (src) => src.replace('pill(`GÜÇ ', 'pill(`POWER ').replace(/'((?:[^'\\\n]|\\.)*)'/g, (m, s) => {
  if (!/[A-ZÇĞİÖŞÜçğıöşü ]/.test(s) || !EX[s] || /^[a-z0-9_.-]+$/.test(s)) return m;
  return "'" + EX[s].replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
});

const T = {
  en: { final: 'CUP FINAL · LAST MINUTE', h1: 'SCORE THE', h2: 'WINNER!', sub: 'Pull back and release to shoot.', install: 'Install',
    again1: 'One more chance!', again2: 'Last chance!', winH1: 'CHAMPIONS!', winH2: 'THIS IS JUST THE START', loseH1: 'SO CLOSE!', loseH2: 'YOUR CAREER AWAITS',
    endSub: 'Start as a kid in street football, get scouted, turn pro and become a legend.', c1: 'Your whole career', c2: 'Transfers & trophies', c3: 'Manager mode',
    cta: 'PLAY FREE', free: 'Free · iOS & Android' },
  tr: { final: 'KUPA FİNALİ · SON DAKİKA', h1: 'ŞAMPİYONLUK', h2: 'GOLÜNÜ AT!', sub: 'Geri çek ve bırak: şut!', install: 'İndir',
    again1: 'Bir şansın daha var!', again2: 'Son şans!', winH1: 'ŞAMPİYONSUN!', winH2: 'BU DAHA BAŞLANGIÇ', loseH1: 'ÇOK YAKLAŞTIN!', loseH2: 'KARİYERİN SENİ BEKLİYOR',
    endSub: 'Sokakta çocukken başla, scout seni keşfetsin, profesyonel ol ve efsane ol.', c1: 'Bütün kariyerin', c2: 'Transfer ve kupalar', c3: 'Teknik direktör modu',
    cta: 'ÜCRETSİZ OYNA', free: 'Ücretsiz · iOS ve Android' },
};
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
const ad = fs.readFileSync(path.join(D, 'ad.js'), 'utf8');

const out = path.join(D, 'dist');
fs.rmSync(out, { recursive: true, force: true });
for (const net of Object.keys(NET_HEAD)) for (const l of ['en', 'tr']) {
  const t = T[l];
  const game = l === 'en' ? toEn(GAME_SRC) : GAME_SRC;
  const html = shell
    .replace('__LANG__', l).replace('__NETWORK_HEAD__', NET_HEAD[net]).replace('__FONTS__', () => FONTS).replace('__ICON__', ICON)
    .replace('__T_INSTALL__', t.install).replace('__T_FINAL__', t.final).replace('__T_H1__', t.h1).replace('__T_H2__', t.h2).replace('__T_SUB__', t.sub)
    .replace('__GAME__', () => game)
    .replace('__AD__', () => `window.AD_T=${JSON.stringify(t)};window.AD_NET=${JSON.stringify(net)};window.AD_ICON=${JSON.stringify(ICON)};window.AD_SND=${JSON.stringify(SND)};\n${ad}`);
  const dir = path.join(out, `${net}-${l}`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  if (net !== 'web') execSync(`cd "${dir}" && zip -q -9 ../starfoot-penalty-${net}-${l}.zip index.html`);
  console.log(`${net}-${l}: ${(html.length / 1048576).toFixed(2)} MB`);
}
