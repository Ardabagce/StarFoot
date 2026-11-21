// Oynanabilir reklam ortak akış: mağaza yönlendirme, ses, giriş, mesaj, bitiş kartı, süre sınırı
(function () {
  var T = window.AD_T, NET = window.AD_NET;
  var IOS = 'https://apps.apple.com/app/id6819292902';
  var AND = 'https://play.google.com/store/apps/details?id=app.vercel.starfoot.twa&referrer=utm_source%3Dplayable%26utm_medium%3Dad%26utm_campaign%3D' + window.AD_SC;
  var isIOS = /iPhone|iPad|iPod|Macintosh/i.test(navigator.userAgent) && !/android/i.test(navigator.userAgent);
  function store() {
    var url = isIOS ? IOS : AND;
    try {
      if (NET === 'google' && window.ExitApi) return ExitApi.exit();
      if (NET === 'mraid' && window.mraid) return mraid.open(url);
    } catch (e) { /* yok */ }
    window.open(url, '_blank');
  }
  document.getElementById('dl').onclick = function (e) { e.stopPropagation(); store(); };

  if (typeof Sfx !== 'undefined') Sfx.loadSamples = function () {
    if (Sfx._loading || !Sfx.ctx || !window.AD_SND) return;
    Sfx._loading = true;
    Object.keys(AD_SND).forEach(function (k) {
      var bin = atob(AD_SND[k]), a = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
      try { var p = Sfx.ctx.decodeAudioData(a.buffer, function (b) { Sfx.buf[k] = b; }, function () {}); if (p && p.catch) p.catch(function () {}); } catch (e) { /* yok */ }
    });
  };

  var msg = document.getElementById('msg'), over = false;
  function say(s, ms) { msg.textContent = s; msg.classList.remove('go'); clearTimeout(say.t); say.t = setTimeout(function () { msg.classList.add('go'); }, ms || 1600); }
  function end(won) {
    if (over) return; over = true;
    if (typeof MiniGame !== 'undefined' && MiniGame._abort) try { MiniGame._abort(); } catch (e) { /* yok */ }
    var d = document.createElement('div');
    d.id = 'end';
    d.innerHTML = '<img src="' + window.AD_ICON + '" alt=""><div class="lg">STAR<span>FOOT</span></div>' +
      '<div class="h">' + (won ? T.winH1 : T.loseH1) + '<em>' + (won ? T.winH2 : T.loseH2) + '</em></div>' +
      '<div class="s">' + T.endSub + '</div><div class="ch"><span>' + T.c1 + '</span><span>' + T.c2 + '</span><span>' + T.c3 + '</span></div>' +
      '<button class="cta">' + T.cta + '</button><div class="st">' + T.free + '</div>';
    d.onclick = store;
    document.body.appendChild(d);
  }
  window.AD = { T: T, store: store, say: say, end: end, over: function () { return over; } };
  window.AD_END = end;

  var intro = document.getElementById('intro'), hand = document.getElementById('hand'), started = false;
  function start() {
    if (started) return; started = true;
    intro.classList.add('go');
    setTimeout(function () { hand.classList.add('go'); }, 2600);
    document.addEventListener('pointerdown', function () { hand.classList.add('go'); }, { once: true, capture: true });
  }
  intro.addEventListener('pointerdown', start);
  setTimeout(start, 2200);
  if (window.AD_HAND) { hand.style.left = AD_HAND[0]; hand.style.top = AD_HAND[1]; if (AD_HAND[2]) hand.style.animationName = AD_HAND[2]; }
  setTimeout(function () { end(false); }, 35000);
})();
