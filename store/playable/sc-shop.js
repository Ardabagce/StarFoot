// Vitrin: ilk profesyonel sözleşmenin imza parasıyla 3 ürün al, sonra oyuna yönlendir
(function () {
  var T = AD.T, host = document.getElementById('host');
  U.cur = function () { return window.AD_CUR; };
  var WANT = ['watch', 'sneaker', 'glasses', 'headphones', 'jacket', 'perfume', 'bag', 'necklace', 'suitcase', 'camera'];
  var all = Mall.build(), items = [];
  WANT.forEach(function (t) {
    var c = all.filter(function (x) { return x.t === t && !x.tag && (x.seg === 'lux' || x.seg === 'prem'); });
    var lux = c.filter(function (x) { return x.seg === 'lux'; });
    var it = (lux.length && t !== 'watch' && t !== 'necklace' ? lux : c)[0];
    if (it) items.push(it);
  });
  var top = items.map(function (x) { return x.price; }).sort(function (a, b) { return b - a; });
  var bal = top[0] + top[1] + top[2], start = bal, bought = [];
  var money = function (n) { return U.money(n); };
  host.innerHTML = '<div class="sh"><div class="sh-top"><div class="sh-app">🛍️ ' + T.app + '</div><div class="sh-bal"><small>' + T.balance + '</small><b id="bal">' + money(bal) + '</b></div></div>' +
    '<div class="sh-note">✍️ ' + T.bonus + '</div>' +
    '<div class="sh-grid">' + items.map(function (it, i) {
      return '<button class="sh-card" data-i="' + i + '"><img alt="" src="' + MallArt.url(it.art) + '"><div class="sh-b">' + it.bn + '</div><div class="sh-n">' + it.md + ' ' + it.tn + '</div><div class="sh-p">' + money(it.price) + '</div><span class="sh-buy">' + T.buy + '</span></button>';
    }).join('') + '</div>' +
    '<div class="sh-bag"><span>' + T.bag + '</span><div class="sh-slots"><i></i><i></i><i></i></div><b id="cnt">0 / 3</b></div></div>';
  var balEl = document.getElementById('bal'), cnt = document.getElementById('cnt'), slots = host.querySelectorAll('.sh-slots i');
  function tick(to) {
    var from = bal, t0 = performance.now();
    (function f(now) { var k = Math.min(1, (now - t0) / 500); balEl.textContent = money(from + (to - from) * k); if (k < 1) requestAnimationFrame(f); })(t0);
    bal = to;
  }
  host.querySelectorAll('.sh-card').forEach(function (b) {
    b.onclick = function () {
      if (AD.over() || b.classList.contains('own') || bought.length >= 3) return;
      var it = items[+b.dataset.i];
      b.classList.add('own'); b.querySelector('.sh-buy').textContent = '✓ ' + T.bought;
      // ürün sepete uçar
      var im = b.querySelector('img'), r = im.getBoundingClientRect(), s = slots[bought.length].getBoundingClientRect();
      var fly = im.cloneNode(); fly.className = 'sh-fly';
      fly.style.cssText = 'left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px';
      document.body.appendChild(fly);
      requestAnimationFrame(function () { fly.style.transform = 'translate(' + (s.left - r.left) + 'px,' + (s.top - r.top) + 'px) scale(' + (s.width / r.width) + ')'; fly.style.opacity = '.9'; });
      var slot = slots[bought.length];
      setTimeout(function () { fly.remove(); slot.style.backgroundImage = 'url("' + im.src + '")'; slot.classList.add('on'); }, 520);
      bought.push(it);
      tick(bal - it.price);
      cnt.textContent = bought.length + ' / 3';
      try { Sfx.play('coin'); } catch (e) { /* yok */ }
      if (bought.length < 3) AD.say(bought.length === 1 ? T.more2 : T.more1, 1400);
      else { AD.say(T.done, 1600); setTimeout(function () { AD.end(true); }, 1500); }
    };
  });
})();
