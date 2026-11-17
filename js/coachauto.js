// Teknik direktör: haftalık aksiyonların otomatik kullanımı
// Oyuncu bir plan seçerse "Maça çık" ve "Hızlı sonuç"ta kalan aksiyon hakları plana göre kendiliğinden kullanılır.
(() => {
  if (typeof Coach === 'undefined') return;
  const PLANS = [
    ['off', 'Kapalı', 'Aksiyonları her hafta kendin seçersin.'],
    ['bal', 'Dengeli', 'Enerji düşükse dinlenme, zayıf ilişkiler için görüşme, gerisi antrenman.'],
    ['prep', 'Maç hazırlığı', 'Antrenman ağırlıklı; enerji düşünce dinlenme.'],
    ['rel', 'İlişkiler', 'Taraftar, oyuncular, yönetim ve kimyadan en zayıfı güçlendirilir.'],
  ];
  const LBL = { train: 'Antrenman', rest: 'Dinlenme', bond: 'Takım etkinliği', fans: 'Taraftar buluşması', board: 'Yönetimle toplantı', talk: 'Birebir görüşme' };
  const plan = () => { const s = Coach.s; return s && s.autoAct && s.autoAct !== 'off' ? s.autoAct : null; };
  function choose(p) {
    const s = Coach.s, en = Coach.energy();
    const weakest = () => [['fans', s.fans], ['talk', s.trust], ['board', s.conf], ['bond', s.chem]].sort((a, b) => a[1] - b[1])[0];
    if (p === 'prep') return en < 50 ? 'rest' : (s.trainB || 0) < 2 ? 'train' : en < 70 ? 'rest' : 'bond';
    if (p === 'rel') return en < 40 ? 'rest' : weakest()[0];
    // dengeli
    if (en < 55) return 'rest';
    const w = weakest();
    if (w[1] < 40) return w[0];
    return (s.trainB || 0) < 2 ? 'train' : w[0];
  }
  // kalan hakları sessizce kullan (her aksiyonun kendi penceresi gösterilmez)
  function spend() {
    const s = Coach.s, p = plan();
    if (!s || !p || s.jobless || !(s.ap > 0)) return [];
    const done = [], m0 = Game.modal;
    Game.modal = function () { return document.createElement('div'); };
    try {
      for (let i = 0; i < 3 && s.ap > 0; i++) { const k = choose(p), ap0 = s.ap; Coach.act(k); if (s.ap >= ap0) break; done.push(LBL[k]); }
    } catch (e) { console.error(e); } finally { Game.modal = m0; }
    return done;
  }
  const play0 = Coach.play;
  Coach.play = function () {
    const d = spend();
    if (d.length) Game.toast(`🤖 Otomatik aksiyonlar: ${d.join(', ')}`, 'info');
    return play0.apply(this, arguments);
  };
  // "Sana bakış" kartına plan seçimi
  const pulse0 = Coach.vPulse;
  Coach.vPulse = function () {
    const h = pulse0.apply(this, arguments), s = Coach.s;
    if (!h || !s || s.jobless) return h;
    const cur = s.autoAct || 'off', d = (PLANS.find((x) => x[0] === cur) || PLANS[0])[2];
    const row = `<div class="lbl">Otomatik aksiyon</div><div class="cp-auto">${PLANS.map(([k, l]) => `<button class="${k === cur ? 'on' : ''}" data-cmauto="${k}" type="button">${l}</button>`).join('')}</div><p class="muted cp-autod">${d}</p>`;
    const i = h.lastIndexOf('</section>');
    return i >= 0 ? h.slice(0, i) + row + h.slice(i) : h;
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('[data-cmauto]');
    if (!b || !Coach.s) return;
    Coach.s.autoAct = b.dataset.cmauto;
    Coach.save();
    Coach.render();
  });
  Coach.autoPlans = PLANS;
  Coach.autoSpend = spend;
})();
