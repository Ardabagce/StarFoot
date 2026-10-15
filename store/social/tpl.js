// Ortak video katmanları: kanca, alt yazı ve kapanış kartı (1080x1920 HTML)
const { fontCss } = require('./rec');
const base = `${fontCss}*{margin:0;padding:0;box-sizing:border-box}body{width:1080px;height:1920px;overflow:hidden;position:relative;font-family:'Barlow Semi Condensed',sans-serif;color:#fff}`;
// Alt yazı: TikTok/Reels arayüzüne denk gelmeyen orta-alt bölge
const capHtml = (txt) => `<!doctype html><html><head><meta charset="utf-8"><style>${base}body{background:transparent}
.band{position:absolute;left:0;right:0;top:1120px;height:520px;background:linear-gradient(180deg,rgba(2,5,15,0) 0%,rgba(2,5,15,.78) 38%,rgba(2,5,15,.78) 70%,rgba(2,5,15,0) 100%)}
.cap{position:absolute;left:70px;right:150px;top:1270px;font-family:'Saira Condensed';font-weight:900;font-style:italic;font-size:92px;line-height:.98;text-transform:uppercase;transform:skewX(-6deg);text-shadow:0 6px 24px rgba(0,0,0,.6)}
.cap em{display:block;font-style:italic;color:#ffcf3f}
.bar{position:absolute;left:70px;top:1236px;width:120px;height:10px;border-radius:5px;background:#ffcf3f;transform:skewX(-20deg)}
.wm{position:absolute;left:70px;top:1180px;font-family:'Saira Condensed';font-weight:900;font-style:italic;font-size:34px;letter-spacing:.04em;opacity:.9}.wm span{color:#ffcf3f}
</style></head><body><div class="band"></div><div class="wm">STAR<span>FOOT</span></div><div class="bar"></div><div class="cap">${txt}</div></body></html>`;
const hookHtml = (a, b) => `<!doctype html><html><head><meta charset="utf-8"><style>${base}body{background:transparent}
.band{position:absolute;left:0;right:0;top:0;height:900px;background:linear-gradient(180deg,rgba(2,5,15,.92) 0%,rgba(2,5,15,.85) 55%,rgba(2,5,15,0) 100%)}
.h{position:absolute;left:60px;right:60px;top:300px;text-align:center;font-family:'Saira Condensed';font-weight:900;font-style:italic;text-transform:uppercase;transform:skewX(-6deg)}
.h .a{display:block;font-size:76px;color:#fff;letter-spacing:.02em}
.h .b{display:block;font-size:112px;line-height:.95;margin-top:10px;background:linear-gradient(180deg,#fff3c2,#ffcf3f 55%,#e39a12);-webkit-background-clip:text;color:transparent;filter:drop-shadow(0 8px 24px rgba(0,0,0,.5))}
</style></head><body><div class="band"></div><div class="h"><span class="a">${a}</span><span class="b">${b}</span></div></body></html>`;
const endHtml = (e, icon) => `<!doctype html><html><head><meta charset="utf-8"><style>${base}
body{background:radial-gradient(120% 70% at 50% 30%,#1b3a8a 0%,#0d1f4f 40%,#070f2a 72%,#040817 100%);text-align:center}
.beam{position:absolute;top:-200px;width:520px;height:1600px;background:linear-gradient(180deg,rgba(255,244,214,.18),rgba(255,244,214,0) 70%);filter:blur(18px);transform-origin:top center}
.beam.l{left:-140px;transform:rotate(-22deg)}.beam.r{right:-140px;transform:rotate(22deg)}
.pitch{position:absolute;left:-10%;right:-10%;bottom:-120px;height:700px;background:repeating-linear-gradient(90deg,rgba(60,170,90,.18) 0 90px,rgba(60,170,90,.08) 90px 180px);transform:perspective(900px) rotateX(58deg);transform-origin:bottom;-webkit-mask:linear-gradient(0deg,#000 40%,transparent)}
.icon{position:absolute;left:50%;top:360px;width:380px;height:380px;margin-left:-190px;border-radius:86px;box-shadow:0 30px 90px rgba(0,0,0,.6),0 0 120px rgba(255,207,63,.35)}
.logo{position:absolute;left:0;right:0;top:800px;font-family:'Saira Condensed';font-weight:900;font-style:italic;font-size:150px;letter-spacing:.01em;transform:skewX(-8deg)}.logo span{color:#ffcf3f}
.t{position:absolute;left:0;right:0;top:990px;font-size:46px;font-weight:600;color:#cdd7f4}
.tag{position:absolute;left:80px;right:80px;top:1080px;font-family:'Saira Condensed';font-weight:800;font-style:italic;font-size:74px;line-height:1.05;text-transform:uppercase}
.badge{position:absolute;left:50%;top:1330px;transform:translateX(-50%);padding:26px 54px;border-radius:999px;background:#ffcf3f;color:#0a1530;font-family:'Saira Condensed';font-weight:900;font-size:54px;letter-spacing:.04em;white-space:nowrap;box-shadow:0 20px 60px rgba(255,207,63,.35)}
.cta{position:absolute;left:0;right:0;top:1470px;font-size:40px;font-weight:600;color:#cdd7f4}
</style></head><body><div class="beam l"></div><div class="beam r"></div><div class="pitch"></div>
<img class="icon" src="${icon}"><div class="logo">STAR<span>FOOT</span></div><div class="t">${e.title}</div><div class="tag">${e.tag}</div><div class="badge">${e.badge}</div><div class="cta">${e.cta}</div></body></html>`;

module.exports = { capHtml, hookHtml, endHtml };
