// Teknik Direktör 1.0.20: canlı maçta oyuncuların anlık reytingi ve kondisyonu, mini saha üzerinde
// oyuncu değişikliği, yapay zekâ için yorgunluğa göre otomatik değişiklik; sözleşme yenileme görüşmesi.

(() => {
  const rcol = (r) => (r >= 7.5 ? '#46e08f' : r >= 6.8 ? '#b6e35a' : r >= 6.2 ? '#ffcf3f' : '#ff6b6b');
  const fcol = (f) => (f > 70 ? '#46e08f' : f > 50 ? '#ffcf3f' : '#ff6b6b');
  const last = (n) => String(n).split(' ').slice(-1)[0];

  // ---------- otomatik değişiklik (hızlı sonuç ve sona atla) ----------
  Live.autoSubs = () => {
    const L = Live.m;
    // akıllı değişiklik: yedeğin bugünkü gücü, yorgun oyuncunun 8 dakika sonraki gücünden iyiyse
    const ahead = (p) => p.r * Coach.fitK(Math.max(5, p.fit - 3));
    let n = 0;
    Live.onField().filter((p) => p.pos !== 'GK' && p.fit < 80).sort((a, b) => a.fit - b.fit).forEach((p) => {
      if (n >= 2 || L.subs <= 0) return;
      const b = L.bench.map(Live.P).filter((x) => x && Coach.available(x)).sort((x, y) => (y.pos === p.pos) - (x.pos === p.pos) || y.r - x.r)[0];
      if (!b) return;
      const pen = b.pos === p.pos ? 0 : 6;
      if ((b.r - pen) * Coach.fitK(b.fit) >= ahead(p)) { Live.sub(p.id, b.id); n++; }
    });
  };
  const sim0 = Live.sim;
  Live.sim = () => {
    const L = Live.m;
    while (L.min < 90) {
      Live.tick();
      if (L.injured) { const p = Live.P(L.injured); L.injured = null; Live.autoSub(p); Live.injOff(p); }
      if (L.min >= 55 && L.subs > 0 && L.min - (L.aLast || 0) >= 5) { L.aLast = L.min; Live.autoSubs(); }
    }
    void sim0;
  };

  // ---------- mini sahada değişiklik ----------
  // oyuncuların sahadaki yerleri: dizilişteki bölgelere göre (GK altta, FW üstte)
  Live.layout = () => {
    const s = Coach.s, a = Coach.assign(Live.onField(), s.form);
    const rows = { FW: [], MF: [], DF: [], GK: [] };
    a.forEach((x) => (rows[x.slot] || rows.MF).push(x.p));
    const Y = { FW: 17, MF: 43, DF: 68, GK: 88 };
    const out = [];
    Object.entries(rows).forEach(([k, list]) => list.forEach((p, i) => out.push({ p, x: ((i + 1) / (list.length + 1)) * 100, y: Y[k] })));
    return out;
  };
  Live.subMenu = (outId, title, pre) => {
    const L = Live.m;
    L.paused = true;
    clearTimeout(Live._t);
    const injury = !!outId && !pre;
    let pick = outId || null;
    const bench = L.bench.map(Live.P).filter((p) => p && Coach.available(p)).sort((a, b) => b.r - a.r);
    const tok = ({ p, x, y }) => {
      const r = L.rates[p.id] || 6.4;
      return `<button class="sbp-t ${p.id === pick ? 'on' : ''} ${p.fit < 50 ? 'tired' : ''}" data-o="${p.id}" style="left:${x}%;top:${y}%">
        <i class="sbp-r" style="background:${rcol(r)}">${r.toFixed(1)}</i><b data-noi18n>${U.esc(last(p.n))}</b>
        <span class="lp-f"><i style="width:${Math.round(p.fit)}%;background:${fcol(p.fit)}"></i></span></button>`;
    };
    const card = (p) => `<button class="lp-b" data-i="${p.id}"><span class="cm-pos ${p.pos}">${CM_POS[p.pos]}</span><b data-noi18n>${U.esc(p.n)}</b>
      <span class="lp-f wide"><i style="width:${Math.round(p.fit)}%;background:${fcol(p.fit)}"></i></span><em>${Coach.ovr(p)}</em></button>`;
    const m = Game.modal(`<div class="ev-tag">Oyuncu değişikliği · ${L.subs} hak · ${L.min}'</div>
      <h3>${title ? U.esc(title) : 'Sahadan çıkacak oyuncuya dokun'}</h3>
      <div class="lp-pitch"><i class="lp-l1"></i><i class="lp-l2"></i><i class="lp-l3"></i>${Live.layout().map(tok).join('')}</div>
      <div class="lp-key"><span><i style="background:#46e08f"></i>Maç reytingi</span><span><i class="bar"></i>Kondisyon</span></div>
      <div class="lbl">Yedekler · girecek oyuncuya dokun</div>
      <div class="lp-bench">${bench.map(card).join('') || '<p class="muted">Yedekte uygun oyuncu yok.</p>'}</div>`,
    [{ t: injury ? '10 kişi devam et' : 'Vazgeç', cls: 'btn-ghost', fn: () => { if (injury) Live.injOff(Live.P(outId)); Live.resume(); } }], { wide: true });
    U.$$('[data-o]', m).forEach((b) => (b.onclick = () => {
      if (injury) return;
      pick = +b.dataset.o; U.$$('[data-o]', m).forEach((x) => x.classList.toggle('on', x === b));
    }));
    U.$$('[data-i]', m).forEach((b) => (b.onclick = () => {
      if (!pick) return Game.toast('Önce sahadan çıkacak oyuncuyu seç.', 'bad');
      m.classList.add('hidden'); m.innerHTML = '';
      Live.sub(pick, +b.dataset.i);
      Live.resume();
    }));
  };

  // ---------- maç ekranı: Anlatım / Oyuncular sekmeleri ----------
  Live.tab = 'feed';
  const draw0 = Live.draw;
  Live.draw = () => {
    draw0();
    const L = Live.m, el = document.getElementById('cm-live');
    if (!L || !el) return;
    let pl = el.querySelector('#lv-pl');
    if (!pl) {
      const feed = el.querySelector('#lv-feed');
      const tabs = document.createElement('div');
      tabs.className = 'lv-tabs';
      tabs.innerHTML = '<button data-lvt="feed" class="on">Anlatım</button><button data-lvt="pl">Oyuncular <em id="lv-tired"></em></button>';
      feed.parentNode.insertBefore(tabs, feed);
      pl = document.createElement('div'); pl.id = 'lv-pl'; pl.className = 'lv-pl hidden';
      feed.parentNode.insertBefore(pl, feed.nextSibling);
      UI.strip(tabs);
      U.$$('[data-lvt]', tabs).forEach((b) => (b.onclick = () => { Live.tab = b.dataset.lvt; Live.draw(); }));
      pl.onclick = (e) => {
        const b = e.target.closest('[data-lvp]'); const M = Live.m;
        if (!b || !M || M.done || M.subs <= 0 || M.paused) return;
        Live.subMenu(+b.dataset.lvp, null, true);
      };
    }
    const tired = Live.onField().filter((p) => p.fit < 55).length;
    el.querySelector('#lv-tired').textContent = tired ? `· ${tired} yorgun` : '';
    U.$$('[data-lvt]', el).forEach((b) => b.classList.toggle('on', b.dataset.lvt === Live.tab));
    el.querySelector('#lv-feed').classList.toggle('hidden', Live.tab !== 'feed');
    pl.classList.toggle('hidden', Live.tab !== 'pl');
    if (Live.tab === 'pl') {
      const rows = Live.layout().sort((a, b) => b.y - a.y || a.x - b.x).map(({ p }) => {
        const r = L.rates[p.id] || 6.4;
        return `<button class="lv-pr ${p.fit < 50 ? 'tired' : ''}" data-lvp="${p.id}"><span class="cm-pos ${p.pos}">${CM_POS[p.pos]}</span><b data-noi18n>${U.esc(p.n)}</b>
          <span class="lp-f wide"><i style="width:${Math.round(p.fit)}%;background:${fcol(p.fit)}"></i></span><small>${Math.round(p.fit)}%</small><i class="lp-r" style="background:${rcol(r)}">${r.toFixed(1)}</i></button>`;
      }).join('');
      pl.innerHTML = `${rows}<p class="muted lv-hint">${L.subs > 0 ? 'Değiştirmek için oyuncuya dokun.' : 'Değişiklik hakkın kalmadı.'}</p>`;
      UI.strip(pl);
    }
  };

  // ---------- sözleşme yenileme görüşmesi ----------
  Coach.renewAsk = (p) => {
    const tr = Coach.teamRating();
    const k = (p.r >= tr + 2 ? 1.25 : p.r >= tr - 2 ? 1.12 : 1.0) * (p.happy < 40 ? 1.1 : 1) * (p.age >= 32 ? 0.9 : 1);
    return Math.max(p.wage, Math.round(Coach.wageOf(p.r) * k / 100) * 100);
  };
  // oyuncunun tercih ettiği süre: tecrübeliler güvence ister, gelecek vaat eden gençler kısa ister
  Coach.prefYrs = (p) => (p.age >= 31 ? 3 : p.age <= 23 && p.pot >= p.r + 5 ? 2 : 4);
  Coach.renewChance = (p, w, yrs, ask) => {
    const s = Coach.s;
    return U.clamp(0.45 + (w / ask - 1) * 2.4 - Math.abs(yrs - Coach.prefYrs(p)) * 0.08 + (p.happy - 55) / 160 + (s.rep - 40) / 300 - (p.age >= 33 && yrs >= 3 ? -0.05 : 0), 0.03, 0.96);
  };
  Coach.renew = (p) => {
    const s = Coach.s;
    if (p.renewNo === s.year) return Game.toast(`${p.n} bu sezon sözleşme konuşmak istemiyor.`, 'bad');
    p.rAsk = p.rAsk || Coach.renewAsk(p);
    let yrs = Math.min(5, Math.max(1, Coach.prefYrs(p)));
    const draw = () => {
      const ask = p.rAsk;
      const opts = [0.9, 1, 1.12].map((k) => Math.round(ask * k / 100) * 100);
      const tries = 3 - (p.rTry || 0);
      const m = Game.modal(`<div class="ev-tag">Sözleşme yenileme</div><h3>${U.esc(p.n)} yeni sözleşme için ${U.money(ask)}/hafta istiyor.</h3>
        <p class="muted">${CM_POS[p.pos]} · ${p.age} yaş · Güç ${Coach.ovr(p)} · Kalan sözleşme ${p.yrs} yıl · Şu anki maaşı ${U.money(p.wage)}/hafta</p>
        <p class="muted">Maaş gideri: ${U.money(Coach.wageBill())} / bütçe ${U.money(s.wbudget)} · Kalan görüşme hakkı: ${tries}</p>
        <div class="lbl">Yeni sözleşme süresi (bugünden itibaren)</div><div class="cm-chips">${[1, 2, 3, 4, 5].map((y) => `<button class="cm-chip sm ${y === yrs ? 'on' : ''}" data-yrs="${y}">${y} yıl${y === Coach.prefYrs(p) ? ' ★' : ''}</button>`).join('')}</div>
        <p class="muted cm-pref">★ Oyuncunun tercih ettiği süre</p>
        <div class="lbl">Maaş teklifin</div>`, opts.map((w, i) => ({ t: `${U.money(w)}/hf · ${Math.round(Coach.renewChance(p, w, yrs, ask) * 100)}%`, cls: i === 1 ? 'btn-big' : 'btn-ghost', fn: () => {
        if (Coach.wageBill() - p.wage + w > s.wbudget * 1.05) { Game.toast('Bu maaş, yönetimin verdiği maaş bütçesini aşıyor.', 'bad'); return setTimeout(draw, 60); }
        if (U.chance(Coach.renewChance(p, w, yrs, ask))) {
          p.wage = w; p.yrs = yrs; p.happy = U.clamp(p.happy + 12, 0, 100); p.renewAsk = 0; p.rAsk = 0; p.rTry = 0;
          Coach.news(`📝 ${p.n} ile ${yrs} yıllık yeni sözleşme imzalandı (${U.money(w)}/hafta).`, 'good');
          Coach.save();
          Game.modal(`<div class="ev-tag">Sözleşme yenileme</div><h3>✍️ ${U.esc(p.n)} imzayı attı!</h3><p>${yrs} yıllık sözleşme · ${U.money(w)}/hafta</p>`, [{ t: 'Harika!', cls: 'btn-big', fn: () => Coach.render() }]);
        } else {
          p.rTry = (p.rTry || 0) + 1; p.happy = U.clamp(p.happy - 5, 0, 100);
          if (p.rTry >= 3) {
            p.renewNo = s.year; p.rTry = 0; p.rAsk = 0;
            Coach.news(`😠 ${p.n} sözleşme görüşmelerini bu sezonluk kesti.`, 'bad');
            Coach.save(); Coach.render();
            return Game.modal(`<div class="ev-tag">Sözleşme yenileme</div><h3>${U.esc(p.n)} görüşmeleri kesti</h3><p>Üç teklifin de reddedildi. Oyuncu bu sezon yeniden konuşmak istemiyor.${p.yrs <= 1 ? ' Sezon sonunda bedelsiz ayrılabilir.' : ''}</p>`, [{ t: 'Tamam', cls: 'btn-big' }]);
          }
          p.rAsk = Math.round(ask * 1.04 / 100) * 100;
          Game.toast(`${p.n} teklifi reddetti. Beklentisi biraz arttı.`, 'bad');
          Coach.save();
          setTimeout(draw, 60);
        }
      } })).concat([{ t: 'Vazgeç', cls: 'btn-ghost', fn: () => Coach.render() }]), { wide: true });
      U.$$('[data-yrs]', m).forEach((b) => (b.onclick = () => { yrs = +b.dataset.yrs; draw(); }));
    };
    draw();
  };
  Coach.doRenew = (p) => Coach.renew(p);
  // bekleyen kararlardaki "yeni sözleşme istiyor" da aynı görüşme ekranını açar
  const sp0 = Coach.showPending.bind(Coach);
  Coach.showPending = (idx) => {
    const s = Coach.s;
    const i = idx > 0 && s && s.pend && idx < s.pend.length ? idx : 0;
    const ev = s && s.pend && s.pend[i];
    if (ev && ev.k === 'renew' && s.phase !== 'end') {
      s.pend.splice(i, 1);
      const p = Coach.P(ev.id);
      Coach.save();
      if (p) return Coach.renew(p);
      return Coach.render();
    }
    return sp0(idx);
  };
  // sezon başında görüşme yasakları ve beklentiler sıfırlanır
  const ns2 = Coach.newSeason;
  Coach.newSeason = (...a) => { const r = ns2(...a); try { (Coach.s.squad || []).forEach((p) => { p.rTry = 0; p.rAsk = 0; }); } catch (e) { /* yok */ } return r; };
})();
