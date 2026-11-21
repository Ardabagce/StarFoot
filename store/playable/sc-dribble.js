// Çalım: 3 rakibi geç (en fazla 3 deneme)
(function () {
  var host = document.getElementById('host'), tries = 0;
  var kits = { own: { shirt: '#d62839', alt: '#ffcf3f', pattern: 'plain', shorts: '#ffffff', socks: '#d62839' }, opp: { shirt: '#1f5fd6', alt: '#ffffff', pattern: 'plain', shorts: '#13306e', socks: '#1f5fd6' }, gk: GK_KITS[0] };
  var SKILL = [0.15, 0.05, 0.0];
  function next() {
    if (AD.over()) return;
    MiniGame.dribble(host, { rounds: 3, dribbling: 88, kits: kits, number: 10, skill: SKILL[Math.min(tries, 2)] }).then(function (r) {
      if (AD.over()) return;
      tries++;
      var res = r && r.result;
      if (res === 'success') return setTimeout(function () { AD.end(true); }, 400);
      if (tries >= 3) return AD.end(false);
      AD.say(tries === 1 ? AD.T.again1 : AD.T.again2, 1800);
      setTimeout(next, 400);
    });
  }
  next();
})();
