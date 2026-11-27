// Menü animasyonlarını (js/sfa.js) oyunun gerçek ekranlarına bağlar (1.0.30):
// sekme göstergesi ve yönlü geçiş, kartların sırayla girişi, maç kartı (süpürme, VS nabzı, geri sayım çipi),
// basınca yaylanan düğmeler ve dalga. Ayarlar'dan ya da "Hareketi azalt" ile kapanır (SFA.enabled()).
(function () {
  if (typeof SFA === 'undefined' || typeof Game === 'undefined') return;
  const snd = (n) => () => { try { if (typeof Sfx !== 'undefined' && Sfx.on) Sfx.play(n); } catch (e) { /* yok */ } };
  SFA.hooks.tick = snd('tick');
  SFA.hooks.pop = snd('tick');
  SFA.hooks.success = snd('coin');
  // düşük performans modunda (Perf.low) sonsuz efektler kapalı
  const lite = () => { try { if (typeof Perf !== 'undefined' && document.body) document.body.classList.toggle('lite', !!Perf.low); } catch (e) { /* yok */ } };
  try { SFA.press(document); } catch (e) { /* yok */ }

  let lastTab = null, lastKey = '';
  const after = () => {
    const s = Game.state;
    const nav = document.getElementById('tabs');
    if (!s || !s.player) { lastTab = null; return; }
    lite();
    if (nav) { if (!nav._sfa) nav._sfa = SFA.tabs(nav); else nav._sfa.place(); }
    const main = document.getElementById('main');
    const key = `${Game.tab}|${Game.slot}`;
    if (main && key !== lastKey) {
      let dir = 0;
      if (nav && lastTab) {
        const ids = [...nav.querySelectorAll('button')].map((b) => b.dataset.tab);
        const a = ids.indexOf(lastTab), b = ids.indexOf(Game.tab);
        dir = a < 0 || b < 0 ? 0 : b > a ? 1 : b < a ? -1 : 0;
      }
      if (SFA.enabled()) main.classList.remove('tab-anim'); // eski giriş animasyonuyla çakışmasın
      SFA.enter(main, { dir });
      lastKey = key; lastTab = Game.tab;
    }
    const card = main && main.querySelector('.hub-next');
    if (card) { if (!card._sfa) { card._sfa = 1; SFA.matchCard(card, { ap: s.ap }); } else SFA.chip(card, s.ap); }
  };
  const r0 = Game.render;
  Game.render = function () {
    const out = r0.apply(this, arguments);
    try { after(); } catch (e) { /* animasyon olmadan devam */ }
    return out;
  };
})();
