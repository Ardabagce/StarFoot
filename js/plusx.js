// Premium+ oyun özellikleri: geri al (son maç) ve hızlı ilerleme
// ---------- Geri al ----------
// Her maçtan önce kaydın bellekte bir kopyası tutulur (oyun kapanınca silinir).
// Premium+ sahibi sezonda bir kez son maçı geri alıp yeniden oynayabilir.
const Undo = {
  snap: null, // { slot, y, json }
  last: null, // { slot, y, res, opp } son oynanan maç
  take() {
    const s = Game.state;
    if (!s || s.mode === 'wc' || Game.inStreet() || typeof Plus === 'undefined' || !Plus.has()) return;
    if (Undo.used(s)) { Undo.snap = null; return; }
    try { Undo.snap = { slot: Game.slot, y: s.season.year, json: JSON.stringify(s, Game.packRoster) }; } catch (e) { Undo.snap = null; }
  },
  used(s) { return s.undoY === s.season.year; },
  // maç bitti: sonuç not edilir (tanıtım yalnız yenilgide gösterilir)
  played(sum, ctx) {
    const s = Game.state;
    if (!s || !sum || !sum.played) return;
    const opp = ctx && (ctx.side === 'home' ? ctx.away : ctx.home);
    Undo.last = { slot: Game.slot, y: s.season.year, res: sum.res, opp: opp ? opp.name : '' };
  },
  can() {
    const s = Game.state, u = Undo.snap;
    return !!(s && u && u.slot === Game.slot && u.y === s.season.year && Undo.last && Undo.last.slot === Game.slot && !Undo.used(s));
  },
  // ana ekrandaki düğme: Premium+'ta kullanılabilir hak, yoksa yalnız yenilgiden sonra kilitli tanıtım
  button() {
    const s = Game.state, L = Undo.last;
    if (!s || !L || L.slot !== Game.slot || L.y !== s.season.year || s.mode === 'wc') return '';
    if (typeof Plus !== 'undefined' && Plus.has()) {
      if (!Undo.can()) return '';
      return `<button class="btn btn-ghost undo-btn" data-undo>↶ Son maçı geri al <small>sezonda 1 hak</small></button>`;
    }
    if (L.res !== 'L' || typeof Plus === 'undefined' || !Plus.on()) return '';
    return `<button class="btn btn-ghost undo-btn locked" data-undo>↶ Son maçı geri al <small>Premium+</small></button>`;
  },
  run() {
    if (typeof Plus !== 'undefined' && !Plus.has()) return Plus.pitch('Geri al', 'undo', 'Kötü giden maçı geri al ve yeniden oyna. Premium+ ile her sezon bir kez son maçını geri alabilirsin.');
    if (!Undo.can()) return Game.toast('Geri alınacak maç yok.', 'info');
    const L = Undo.last;
    Game.modal(`<h3>↶ Son maç geri alınsın mı?</h3><p>${L.opp ? `<b>${U.esc(L.opp)}</b> maçı ve ` : ''}maçtan sonra olan her şey silinir; maç öncesine dönersin. Bu sezon için tek hakkın.</p>`, [
      { t: 'Vazgeç', cls: 'btn-ghost' },
      { t: 'Geri al', cls: 'btn-big', fn: () => {
        try {
          const st = JSON.parse(Undo.snap.json, Game.unpackRoster);
          st.undoY = st.season.year;
          Game.state = st; Undo.snap = null; Undo.last = null;
          Game.save(); Game.render();
          Premium.track('plus_undo');
          Game.toast('↶ Maç geri alındı. Yeniden oynayabilirsin.', 'good');
        } catch (e) { Game.toast('Geri alma yapılamadı.', 'bad'); }
      } },
    ]);
  },
};
document.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('[data-undo]') && Game.state) Undo.run(); });

// ---------- Hızlı ilerleme ----------
// Seçilen hedefe kadar maçlar simüle edilir; aksiyon hakları seçilen plana göre kullanılır.
// Karar gerektiren bir pencere, yeni transfer teklifi ya da sezon sonu gelince durur.
const FF = {
  on: false, stop: false,
  TARGETS: [
    ['eu', 'Sonraki Avrupa maçı', 'Kıta kupası maçına kadar ilerle, o maçı sen oyna'],
    ['cup', 'Sonraki kupa maçı', 'Kupa ya da Avrupa maçına kadar'],
    ['derby', 'Sonraki derbi', 'Derbiye kadar ilerle'],
    ['tw', 'Transfer dönemi', 'Transfer dönemi açılana kadar'],
    ['w2', '2 hafta', ''], ['w4', '4 hafta', ''], ['w8', '8 hafta', ''],
    ['season', 'Sezon sonu', 'Son lig maçına kadar'],
  ],
  PLANS: [
    ['bal', 'Dengeli', 'Enerjin iyiyse antrenman, düşükse dinlenme'],
    ['train', 'Antrenman', 'Her hak antrenman (enerji çok düşükse dinlen)'],
    ['intense', 'Yoğun antrenman', 'Daha hızlı gelişim, daha çok yorgunluk ve sakatlık riski'],
    ['rest', 'Dinlen', 'Hakları dinlenmeye harca, enerjini yüksek tut'],
  ],
  euCup(id) { const c = Game.state.cups && Game.state.cups[id]; return !!(c && !c.dom && !c.youth); },
  inEu() { const s = Game.state; return Object.values(s.cups || {}).some((c) => c && !c.dom && !c.youth && !c.winner && typeof Cups !== 'undefined' && Cups.inCup(s, c)); },
  button() {
    const s = Game.state;
    if (!s || s.mode === 'wc' || Game.inStreet() || typeof Plus === 'undefined' || !Plus.on()) return '';
    return `<button class="btn btn-ghost ff-btn ${Plus.has() ? '' : 'locked'}" data-ff>⏩ Hızlı ilerle${Plus.has() ? '' : ' <small>Premium+</small>'}</button>`;
  },
  open() {
    if (!Plus.has()) return Plus.pitch('Hızlı ilerleme', 'ff', 'Önemli maçlara kadar haftaları simüle et: Avrupa gecesine, derbiye ya da transfer dönemine kadar ilerle; aksiyon haklarını nasıl kullanacağını sen seç.');
    const s = Game.state, p = s.player;
    const ok = (k) => (k === 'eu' ? FF.inEu() : k === 'derby' ? !Game.isYouth() : true);
    const tg = FF.TARGETS.filter(([k]) => ok(k));
    const pick = FF.last && tg.some(([k]) => k === FF.last.t) ? FF.last.t : tg[0][0];
    const plan = (FF.last && FF.last.p) || 'bal';
    const focusL = STATS.find((x) => x.k === s.trainFocus).l;
    const chips = (list, name, cur) => list.map(([k, l, d]) => `<label class="ff-chip"><input type="radio" name="${name}" value="${k}" ${k === cur ? 'checked' : ''}><span><b>${l}</b>${d ? `<small>${d}</small>` : ''}</span></label>`).join('');
    const m = Game.modal(`<div class="ff"><h2>⏩ Hızlı ilerle</h2>
      <div class="lbl">Nereye kadar?</div><div class="ff-grid">${chips(tg, 'fft', pick)}</div>
      <div class="lbl">Atlanan haftalarda aksiyon hakların <small>antrenman odağı: ${focusL}</small></div><div class="ff-grid">${chips(FF.PLANS, 'ffp', plan)}</div>
      <p class="muted">Maçlar otomatik oynanır. Karar vermen gereken bir şey olursa (teklif, olay, sezon sonu) ilerleme durur.</p></div>`, [
      { t: 'Vazgeç', cls: 'btn-ghost' },
      { t: '⏩ Başlat', cls: 'btn-big', fn: () => {} },
    ], { wide: true });
    const go = m.querySelector('.modal-btns .btn-big');
    go.onclick = () => {
      const t = (m.querySelector('input[name="fft"]:checked') || {}).value || pick;
      const pl = (m.querySelector('input[name="ffp"]:checked') || {}).value || 'bal';
      FF.last = { t, p: pl };
      m.classList.add('hidden'); m.innerHTML = '';
      FF.run(t, pl);
    };
  },
  // bir aksiyon hakkını plana göre kullanır
  useAp(plan, tally) {
    const s = Game.state, p = s.player;
    const train = (k, cost) => {
      Player.addEnergy(p, -cost);
      tally.gain += Player.train(p, s.trainFocus, k * 0.85, Game.facility()) || 0;
      tally.train++;
      if (k > 1.5 && U.chance(Player.injuryChance(p, 0.035))) Game.injure(U.randi(1, 3), 'yoğun antrenmanda');
    };
    const rest = () => { Player.addEnergy(p, 20); Player.addMorale(p, 2); tally.rest++; };
    if (p.injuryWeeks > 0 || plan === 'rest') rest();
    else if (plan === 'intense') { if (p.energy >= 55) train(1.8, 24); else rest(); }
    else if (plan === 'train') { if (p.energy >= 30) train(1, 12); else rest(); }
    else { if (p.energy >= 55) train(1, 12); else rest(); }
    s.ap--;
  },
  // sıradaki maçtan önce durulacak mı
  why(t, start, weeks) {
    const s = Game.state;
    if (FF.stop) return 'Durduruldu.';
    if (s.pendingCup) {
      if (t === 'cup') return 'Kupa maçı geldi.';
      if (t === 'eu' && FF.euCup(s.pendingCup)) return 'Avrupa maçı geldi.';
    }
    if (!s.pendingCup && !s.pendingIntl) {
      const fx = Game.nextFixture();
      if (!fx) return 'Sezonun son maçı oynandı.';
      if (t === 'derby' && typeof Big !== 'undefined' && Big.derby(fx.home, fx.away)) return 'Derbi haftası geldi.';
    }
    if (t === 'tw' && Game.tWindow(s.season.round) && !start.tw) return 'Transfer dönemi açıldı.';
    const n = { w2: 2, w4: 4, w8: 8 }[t];
    if (n && weeks >= n) return `${n} hafta tamamlandı.`;
    if ((s.offers || []).length > start.offers) return 'Yeni transfer teklifi geldi.';
    return '';
  },
  // açık pencere: tek düğmeli bilgi penceresiyse kapatılır, seçim gerekiyorsa ilerleme durur
  modalGate() {
    const m = document.getElementById('modal');
    if (!m || m.classList.contains('hidden')) return 'ok';
    const bs = m.querySelectorAll('.modal-btns button');
    const extra = m.querySelectorAll('[data-offer], [data-street], input, select, .ev-opts button, .press-a button');
    if (bs.length <= 1 && !extra.length) { if (bs[0]) bs[0].click(); else { m.classList.add('hidden'); m.innerHTML = ''; } return 'ok'; }
    return 'stop';
  },
  ov(txt) {
    let el = document.getElementById('ffov');
    if (txt === null) { if (el) el.remove(); return; }
    if (!el) {
      el = U.el('<div id="ffov"><div class="ffov-c"><i class="busy-s"></i><b></b><small></small><button class="btn btn-ghost" id="ff-stop">Durdur</button></div></div>');
      document.body.appendChild(el);
      el.querySelector('#ff-stop').onclick = () => { FF.stop = true; el.querySelector('small').textContent = 'Bu maçtan sonra duracak…'; };
    }
    el.querySelector('b').textContent = txt;
  },
  async run(t, plan) {
    const s0 = Game.state;
    if (!s0 || FF.on) return;
    FF.on = true; FF.stop = false;
    const start = { tw: !!Game.tWindow(s0.season.round), offers: (s0.offers || []).length, y: s0.season.year };
    const tally = { m: 0, g: 0, a: 0, r: 0, w: 0, d: 0, l: 0, train: 0, rest: 0, gain: 0 };
    const t0 = { g: s0.player.totals.goals, a: s0.player.totals.assists, apps: s0.player.totals.apps, rs: s0.player.totals.ratingSum };
    let weeks = 0, reason = '', lastRound = s0.season.round, guard = 0;
    Premium.track('plus_ff', { target: t, plan });
    try {
      while (guard++ < 80) {
        const s = Game.state;
        if (FF.modalGate() === 'stop') { reason = 'Karar vermen gereken bir durum var.'; break; }
        if (s.season.year !== start.y) { reason = 'Yeni sezon başladı.'; break; }
        reason = FF.why(t, start, weeks);
        if (reason) break;
        FF.ov(`⏩ ${s.season.year} · ${Math.min(s.season.round + 1, Game.rounds())}. hafta simüle ediliyor`);
        while (s.ap > 0) FF.useAp(plan, tally);
        await Promise.race([Game.playNext(), new Promise((r) => setTimeout(r, 15000))]);
        await new Promise((r) => setTimeout(r, 60));
        const s2 = Game.state;
        if (s2.season.round !== lastRound) { weeks += Math.max(1, s2.season.round - lastRound); lastRound = s2.season.round; }
        Undo.snap = null; // hızlı ilerlemede geri al yok
      }
    } catch (e) { reason = 'Bir hata oluştu, ilerleme durdu.'; console.error(e); }
    FF.on = false; FF.ov(null);
    const p = Game.p, T = p.totals;
    const apps = T.apps - t0.apps, g = T.goals - t0.g, a = T.assists - t0.a, avg = apps ? (T.ratingSum - t0.rs) / apps : 0;
    Game.save(); Game.render();
    const res = `<div class="ff-sum"><h3>⏩ Hızlı ilerleme bitti</h3><p>${reason || ''}</p>
      <div class="ms-grid"><div><span>Hafta</span><b>${weeks}</b></div><div><span>Maç</span><b>${apps}</b></div><div><span>Gol</span><b>${g}</b></div><div><span>Asist</span><b>${a}</b></div><div><span>Ort. reyting</span><b>${apps ? avg.toFixed(2) : '-'}</b></div><div><span>Antrenman / dinlenme</span><b>${tally.train} / ${tally.rest}</b></div></div>
      ${tally.gain ? `<p class="muted">${STATS.find((x) => x.k === Game.state.trainFocus).l} +${tally.gain.toFixed(2)}</p>` : ''}</div>`;
    const m = document.getElementById('modal');
    if (m && !m.classList.contains('hidden')) {
      // karar penceresi açık: özeti bildirim olarak göster
      Game.toast(`⏩ ${weeks} hafta · ${apps} maç · ${g} gol · ${a} asist. ${reason}`, 'info');
    } else Game.modal(res, [{ t: 'Tamam' }]);
  },
};
document.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('[data-ff]') && Game.state) FF.open(); });
