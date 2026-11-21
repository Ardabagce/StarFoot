// Penaltı: en fazla 3 şut, gol olunca biter
(function () {
  var kits = { own: { shirt: '#d62839', alt: '#ffcf3f', pattern: 'plain', shorts: '#ffffff', socks: '#d62839' }, opp: { shirt: '#1f5fd6', alt: '#ffffff', pattern: 'plain', shorts: '#13306e', socks: '#1f5fd6' }, gk: GK_KITS[0] };
  var stats = { shooting: 82, technique: 80, pace: 78, passing: 72, dribbling: 76, physical: 70, vision: 70, heading: 60, defending: 40, stamina: 80 };
  var TYPE = window.AD_SC === 'freekick' ? 'freekick' : 'penalty';
  var SKILL = TYPE === 'freekick' ? [0.12, 0.04, 0.0] : [0.32, 0.14, 0.0];
  var shot = 0, host = document.getElementById('host');
  function next() {
    if (AD.over()) return;
    var sk = SKILL[Math.min(shot, SKILL.length - 1)];
    var scene = Scenes.make(TYPE, { skill: sk, mates: [], position: 'FV', pace: stats.pace, narrow: window.innerWidth / window.innerHeight < 0.9 });
    MiniGame.play(host, scene, { stats: stats, skill: sk, cond: 1, kits: kits, number: 10, mateChance: function () { return 0.5; } }).then(function (r) {
      if (AD.over()) return;
      shot++;
      if (r && r.outcome === 'goal') { var sc = document.getElementById('score'); if (sc) sc.textContent = '2 - 1'; return setTimeout(function () { AD.end(true); }, 900); }
      if (shot >= 3) return AD.end(false);
      AD.say(shot === 1 ? AD.T.again1 : AD.T.again2, 1800);
      setTimeout(next, 500);
    });
  }
  next();
})();
