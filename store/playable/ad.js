// Oynanabilir reklam akışı: giriş → en fazla 3 penaltı (gol olunca biter) → bitiş kartı → mağaza
(function () {
  var T = window.AD_T, NET = window.AD_NET;
  var IOS = 'https://apps.apple.com/app/id6819292902';
  var AND = 'https://play.google.com/store/apps/details?id=app.vercel.starfoot.twa&referrer=utm_source%3Dplayable%26utm_medium%3Dad%26utm_campaign%3Dpenalty';
  var isIOS = /iPhone|iPad|iPod|Macintosh/i.test(navigator.userAgent) && !/android/i.test(navigator.userAgent);
  function store() {
    var url = isIOS ? IOS : AND;
    try {
      if (NET === 'google' && window.ExitApi) return ExitApi.exit();
      if (NET === 'mraid' && window.mraid) return mraid.open(url);
    } catch (e) { /* yok */ }
    window.open(url, '_blank');
  }
  window.AD_STORE = store;
  window.AD_END = function (w) { end(w); };
  document.getElementById('dl').onclick = function (e) { e.stopPropagation(); store(); };

  // Ses: gömülü kayıtlar (ağ isteği yok)
  Sfx.loadSamples = function () {
    if (Sfx._loading || !Sfx.ctx || !window.AD_SND) return;
    Sfx._loading = true;
    Object.keys(AD_SND).forEach(function (k) {
      var bin = atob(AD_SND[k]), a = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
      try {
        var p = Sfx.ctx.decodeAudioData(a.buffer, function (b) { Sfx.buf[k] = b; }, function () {});
        if (p && p.catch) p.catch(function () {});
      } catch (e) { /* yok */ }
    });
  };

  var kits = {
    own: { shirt: '#d62839', alt: '#ffcf3f', pattern: 'plain', shorts: '#ffffff', socks: '#d62839' },
    opp: { shirt: '#1f5fd6', alt: '#ffffff', pattern: 'plain', shorts: '#13306e', socks: '#1f5fd6' },
    gk: GK_KITS[0],
  };
  var stats = { shooting: 82, technique: 80, pace: 78, passing: 72, dribbling: 76, physical: 70, vision: 70, heading: 60, defending: 40, stamina: 80 };
  var SKILL = [0.32, 0.14, 0.0];
  var shot = 0, over = false, t0 = Date.now();
  var host = document.getElementById('host');
  var msg = document.getElementById('msg');
  function say(s, ms) { msg.textContent = s; msg.classList.remove('go'); clearTimeout(say.t); say.t = setTimeout(function () { msg.classList.add('go'); }, ms || 1600); }

  function end(won) {
    if (over) return; over = true;
    if (MiniGame._abort) try { MiniGame._abort(); } catch (e) { /* yok */ }
    var d = document.createElement('div');
    d.id = 'end';
    d.innerHTML = '<img src="' + window.AD_ICON + '" alt=""><div class="lg">STAR<span>FOOT</span></div>' +
      '<div class="h">' + (won ? T.winH1 : T.loseH1) + '<em>' + (won ? T.winH2 : T.loseH2) + '</em></div>' +
      '<div class="s">' + T.endSub + '</div><div class="ch"><span>' + T.c1 + '</span><span>' + T.c2 + '</span><span>' + T.c3 + '</span></div>' +
      '<button class="cta">' + T.cta + '</button><div class="st">' + T.free + '</div>';
    d.onclick = store;
    document.body.appendChild(d);
  }

  function next() {
    if (over) return;
    var sk = SKILL[Math.min(shot, SKILL.length - 1)];
    var scene = Scenes.make('penalty', { skill: sk, mates: [], position: 'FV', pace: stats.pace, narrow: window.innerWidth / window.innerHeight < 0.9 });
    MiniGame.play(host, scene, { stats: stats, skill: sk, cond: 1, kits: kits, number: 10, mateChance: function () { return 0.5; } }).then(function (r) {
      if (over) return;
      shot++;
      if (r && r.outcome === 'goal') { document.getElementById('score').textContent = '2 - 1'; return setTimeout(function () { end(true); }, 900); }
      if (shot >= 3) return end(false);
      say(shot === 1 ? T.again1 : T.again2, 1800);
      setTimeout(next, 500);
    });
  }

  var intro = document.getElementById('intro'), hand = document.getElementById('hand');
  var started = false;
  function start() {
    if (started) return; started = true;
    intro.classList.add('go');
    setTimeout(function () { hand.classList.add('go'); }, 2600);
    document.addEventListener('pointerdown', function () { hand.classList.add('go'); }, { once: true, capture: true });
  }
  intro.addEventListener('pointerdown', start);
  setTimeout(start, 2200);
  next();
  // süre sınırı: oyuncu bırakırsa 35 sn'de bitiş kartı
  setTimeout(function () { end(false); }, 35000);
})();
