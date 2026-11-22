// Bilibili için 1920x1080 kareler: başlık, bölüm altyazıları (telefon çerçevesi boş bırakılır), ekran slaytları, kapanış, kapaklar
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const D = __dirname, R = '/home/user/StarFoot';
const OUT = path.join(D, 'frames');
fs.mkdirSync(OUT, { recursive: true });
const ICON = 'file://' + R + '/store/icon-512.png';
const F = 'file://' + R + '/store/premium/fonts';
const css = `
<link rel="stylesheet" href="file://${D}/font/package/900.css"><link rel="stylesheet" href="file://${D}/font/package/500.css">
<style>
@font-face{font-family:S;src:url(${F}/saira-condensed-latin-800-normal.woff2)}
*{margin:0;box-sizing:border-box}
body{width:1920px;height:1080px;overflow:hidden;color:#f3f1ea;font-family:"Noto Sans SC",sans-serif;
background:radial-gradient(60% 70% at 72% 50%,rgba(255,207,63,.20),transparent 70%),radial-gradient(120% 100% at 30% 0%,#1d3b8f 0%,#0b1736 55%,#060d24 100%)}
.logo{display:flex;align-items:center;gap:18px}.logo img{width:86px;height:86px;border-radius:20px;box-shadow:0 8px 24px rgba(0,0,0,.5)}
.logo b{font:italic 800 64px S}.logo b span{color:#ffcf3f}
.ph{position:absolute;left:1240px;top:60px;width:459px;height:960px;border-radius:56px;border:14px solid #0d1325;background:#000;
box-shadow:0 40px 80px rgba(0,0,0,.6),0 0 0 2px rgba(255,255,255,.14),0 0 140px rgba(255,207,63,.25)}
.ph img{width:100%;height:100%;object-fit:cover;object-position:top;border-radius:42px}
.left{position:absolute;left:130px;top:0;bottom:0;width:980px;display:flex;flex-direction:column;justify-content:center;gap:26px}
.tag{display:inline-block;align-self:flex-start;background:#e1283e;color:#fff;font-weight:900;font-size:30px;padding:6px 18px;border-radius:10px;letter-spacing:.06em}
h1{font-weight:900;font-size:104px;line-height:1.08;letter-spacing:.02em}h1 em{font-style:normal;color:#ffcf3f}
p{font-weight:500;font-size:38px;line-height:1.5;color:#c9d4f2}
.n{position:absolute;left:130px;bottom:70px;font-weight:500;font-size:24px;color:#8fa0c8}
</style>`;
const page = (body) => `<!doctype html><html><head><meta charset="utf-8">${css}</head><body>${body}</body></html>`;
const PH = '<div class="ph" style="background:#000"></div>'; // video bu kutunun içine bindirilir
const SEG = [
  ['penalty', '关键时刻', '最后一分钟的点球，<br><em>由你来罚！</em>', '向后拉、瞄准、松开——射门的每一个细节都由你掌控。'],
  ['dribble', '单刀突破', '连过三人，<br><em>一条龙破门</em>', '对手扑上来的瞬间，把球拨向另一侧。'],
  ['freekick', '定位球', '任意球<em>直挂死角</em>', '绕过人墙，侧向滑动打出弧线。'],
  ['shop', '场外人生', '签下合同，<br><em>享受巨星生活</em>', '3500 多件商品、豪车、豪宅、度假——全在你的手机里。'],
];
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const shot = async (html, name) => {
    fs.writeFileSync(path.join(D, '_f.html'), html);
    await pg.goto('file://' + path.join(D, '_f.html'));
    await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(400);
    await pg.screenshot({ path: path.join(OUT, name) });
  };
  // başlık
  await shot(page(`<div class="left" style="width:1660px;align-items:center;text-align:center;left:130px">
    <div class="logo" style="justify-content:center"><img src="${ICON}"><b>STAR<span>FOOT</span></b></div>
    <h1 style="font-size:120px">从街头少年<br>到<em>足球传奇</em></h1>
    <p>一款由土耳其独立开发者一个人制作的足球职业生涯游戏</p></div>`), 'title.png');
  for (const [k, tag, h, s] of SEG) {
    await shot(page(`<div class="left"><span class="tag">${tag}</span><h1>${h}</h1><p>${s}</p></div>${PH}<div class="n">实机画面 · 简体中文版</div>`), `seg-${k}.png`);
  }
  // ekran slaytları: iki telefon
  const scr = (f) => 'file://' + D + '/shots/' + f;
  const two = (a, c, tag, h, s) => page(`<div class="left" style="width:860px"><span class="tag">${tag}</span><h1 style="font-size:88px">${h}</h1><p>${s}</p></div>
    <div class="ph" style="left:1010px;transform:rotate(-3deg)"><img src="${scr(a)}"></div><div class="ph" style="left:1380px;top:90px;transform:rotate(3deg)"><img src="${scr(c)}"></div>`);
  await shot(two('zh-home.png', 'zh-league.png', '完整职业生涯', '比赛、联赛、<br><em>转会与国家队</em>', '每周安排训练和行动，带领球队争夺联赛冠军和亚洲冠军杯。'), 'slide-1.png');
  await shot(two('zh-squad.png', 'zh-profile.png', '中文界面', '全新<em>简体中文</em><br>和巨龙联赛', '16 支球队的巨龙联赛和 14 支球队的甲级联赛，所有俱乐部和球员均为虚构。'), 'slide-2.png');
  // kapanış
  await shot(page(`<div class="left" style="width:1660px;align-items:center;text-align:center">
    <img src="${ICON}" style="width:180px;height:180px;border-radius:40px;box-shadow:0 12px 40px rgba(0,0,0,.6)">
    <div class="logo" style="justify-content:center"><b style="font-size:88px">STAR<span>FOOT</span></b></div>
    <h1 style="font-size:72px">免费下载 · <em>iOS / Android</em></h1>
    <p>在 App Store / Google Play 搜索 “StarFoot”（中国大陆地区暂未上架）<br>欢迎在评论区告诉我你的想法！</p></div>`), 'end.png');
  // kapaklar (16:9 ve 4:3)
  const cover = (w, h) => `<!doctype html><html><head><meta charset="utf-8">${css}<style>body{width:${w}px;height:${h}px}</style></head><body>
    <div style="position:absolute;left:70px;top:60px" class="logo"><img src="${ICON}" style="width:110px;height:110px"><b style="font-size:76px">STAR<span>FOOT</span></b></div>
    <h1 style="position:absolute;left:70px;top:${h * 0.3}px;font-size:${w > 1600 ? 150 : 128}px;line-height:1.05;text-shadow:0 6px 24px rgba(0,0,0,.6)">一个人做的<br><em>足球生涯</em><br>游戏</h1>
    <div class="tag" style="position:absolute;left:70px;bottom:70px;font-size:40px">点球 · 过人 · 任意球 · 转会</div>
    <div class="ph" style="left:${w - 560}px;top:${(h - 960) / 2}px;transform:rotate(4deg)"><img src="${D}/cover-shot.png"></div></body></html>`;
  fs.writeFileSync(path.join(D, '_c.html'), '');
  for (const [w, h, n] of [[1920, 1080, 'cover-16x9.jpg'], [1440, 1080, 'cover-4x3.jpg']]) {
    await pg.setViewportSize({ width: w, height: h });
    fs.writeFileSync(path.join(D, '_f.html'), cover(w, h));
    await pg.goto('file://' + path.join(D, '_f.html'));
    await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(400);
    await pg.screenshot({ path: path.join(D, n), type: 'jpeg', quality: 92 });
  }
  await b.close();
})();
