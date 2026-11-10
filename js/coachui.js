// Teknik Direktör — ekranlar: merkez (rakip analizi, kararlar), kadro (roller, oyuncu kartı), taktik,
// transfer (gözlemci, pazarlık, sözleşme), kulüp (finans, tesisler), lig, kariyer.

Object.assign(Coach, {
  render() {
    const s = Coach.s;
    const el = document.getElementById('coach');
    if (!s || !el) return;
    const c = Coach.my();
    const tabs = [['home', 'home', 'Merkez'], ['squad', 'squad', 'Kadro'], ['tactic', 'coach', 'Taktik'], ['market', 'contract', 'Transfer'], ['club', 'shield', 'Kulüp'], ['league', 'table', 'Lig'], ['career', 'career', 'Kariyer']];
    const body = { home: Coach.vHome, squad: Coach.vSquad, tactic: Coach.vTactic, market: Coach.vMarket, club: Coach.vClub, league: Coach.vLeague, career: Coach.vCareer }[Coach.view] || Coach.vHome;
    const bar = (v) => `<i class="cm-bar"><i style="width:${v}%;background:${v > 55 ? '#46e08f' : v > 30 ? '#ffcf3f' : '#ff6b6b'}"></i></i>`;
    el.innerHTML = `<div class="cm-top">
        <div class="cm-hd">${UI.shirt(c)}<div><b>${U.esc(c.name)}</b><small>${U.esc(Coach.fullName())} · ${s.year} · ${Math.min(s.round + 1, Coach.rounds())}. hafta</small></div>
          <button class="notif-btn" id="cm-menu" aria-label="Menü">${Icon('exit')}</button></div>
        <div class="cm-stat"><span>Kasa <b class="${s.money < 0 ? 'neg' : ''}">${U.money(s.money)}</b></span><span>Yönetim ${bar(s.conf)}</span><span>Taraftar ${bar(s.fans)}</span></div>
      </div>
      <nav class="cm-tabs">${tabs.map(([k, ic, t]) => `<button data-cmv="${k}" class="${Coach.view === k ? 'on' : ''}">${Icon(ic)}<span>${t}</span></button>`).join('')}</nav>
      <main class="cm-main">${body()}</main>`;
    U.$$('[data-cmv]', el).forEach((b) => (b.onclick = () => { Coach.view = b.dataset.cmv; Coach.render(); window.scrollTo(0, 0); }));
    el.querySelector('#cm-menu').onclick = () => Game.modal('<h3>Ana menüye dönülsün mü?</h3><p>İlerlemen kaydedildi.</p>', [{ t: 'Vazgeç', cls: 'btn-ghost' }, { t: 'Ana menü', fn: () => Coach.exit() }]);
    Coach.bind(el);
    UI.strip(el);
    if (s.phase === 'end') Coach.showSeasonEnd();
    else if (s.pend && s.pend.length && document.getElementById('modal').classList.contains('hidden')) setTimeout(() => { if (Coach.s && document.getElementById('modal').classList.contains('hidden') && !document.getElementById('cm-live')) Coach.showPending(); }, 250);
  },
  bind(el) {
    const s = Coach.s;
    const on = (sel, fn) => U.$$(sel, el).forEach((b) => (b.onclick = () => fn(b)));
    on('#cm-play', () => Coach.play(false));
    on('#cm-quick', () => Coach.play(true));
    on('[data-xi]', (b) => {
      const id = +b.dataset.xi;
      if (s.xi.includes(id)) s.xi = s.xi.filter((x) => x !== id);
      else if (s.xi.length < 11) { const p = Coach.P(id); if (!Coach.available(p)) return Game.toast('Bu oyuncu şu an oynayamaz.', 'bad'); s.xi.push(id); } else return Game.toast('İlk 11 dolu. Önce birini çıkar.', 'bad');
      Coach.save(); Coach.render();
    });
    on('[data-pinfo]', (b) => Coach.playerInfo(+b.dataset.pinfo));
    on('#cm-auto', () => { Coach.autoPick(); Coach.save(); Coach.render(); });
    on('[data-form]', (b) => { s.form = b.dataset.form; Coach.save(); Coach.render(); });
    on('[data-style]', (b) => { s.style = b.dataset.style; Coach.save(); Coach.render(); });
    on('[data-train]', (b) => { s.train = b.dataset.train; Coach.save(); Coach.render(); });
    on('[data-focus]', (b) => { s.focus = b.dataset.focus; Coach.save(); Coach.render(); });
    on('[data-rot]', (b) => { s.rot = b.dataset.rot === 'on'; Coach.save(); Coach.render(); });
    on('[data-km]', (b) => { s.keyMom = b.dataset.km === 'on'; Coach.save(); Coach.render(); });
    on('[data-job]', (b) => { const id = b.dataset.job; s.jobless = null; Coach.joinClub(id, false); Coach.save(); Coach.render(); });
    on('[data-spos]', (b) => { Coach.sq = Object.assign(Coach.sq || {}, { pos: b.dataset.spos }); Coach.render(); });
    on('[data-sage]', (b) => { Coach.sq = Object.assign(Coach.sq || {}, { age: +b.dataset.sage }); Coach.render(); });
    on('[data-smax]', (b) => { Coach.sq = Object.assign(Coach.sq || {}, { max: +b.dataset.smax }); Coach.render(); });
    on('#cm-search', () => { const q = Coach.sq || {}; Coach.scoutSearch({ pos: q.pos || 'all', age: q.age || 33, max: q.max ? Math.round(s.budget * q.max) : 0 }); Coach.render(); });
    on('[data-watch]', (b) => { Coach.scoutWatch(+b.dataset.watch); Coach.render(); });
    on('[data-bid]', (b) => Coach.negotiate(+b.dataset.bid));
    on('[data-free]', (b) => { const p = s.mk.find((x) => x.id === +b.dataset.free); if (p) Coach.contract(p, 0); });
    on('[data-build]', (b) => { Coach.build(b.dataset.build); Coach.render(); });
    on('#cm-pend', () => Coach.showPending());
    on('#cm-retire', () => Game.modal('<h3>Teknik direktörlüğü bırakmak istediğine emin misin?</h3><p>Kariyerin sona erecek.</p>', [{ t: 'Vazgeç', cls: 'btn-ghost' }, { t: 'Emekli ol', cls: 'btn-danger', fn: () => Coach.retire() }]));
  },
  formDots(id) { return `<span class="cm-fd">${(Coach.s.cf[id] || '').split('').map((r) => `<i class="${r}">${r}</i>`).join('') || '<small class="muted">–</small>'}</span>`; },

  // ---------- merkez ----------
  vHome() {
    const s = Coach.s, m = Coach.nextMatch();
    if (s.jobless) {
      return `<section class="card"><div class="card-h"><span>${Icon('contract')} İş teklifleri</span></div><p>Şu an bir kulübün yok. Yeni takımını seç:</p>
        <div class="cm-offers">${s.jobless.map((id) => { const o = Coach.club(id); return `<button class="cm-offer" data-job="${id}">${UI.shirt(o, 'big')}<span><b>${U.esc(o.name)}</b><small>${U.esc(Coach.lgName(o.league))} · Güç ${o.rating}</small></span>${Icon('chevron')}</button>`; }).join('')}</div></section>`;
    }
    let mh = '';
    if (m && m.comp !== 'bye') {
      const o = Coach.club(m.opp), me = Coach.my();
      const [h, a] = m.home ? [me, o] : [o, me];
      const star = Coach.starOf(m.opp), ost = CM_STYLES[Coach.oppStyle(m.opp)];
      const lgPos = Coach.table().findIndex((r) => r.id === m.opp) + 1;
      mh = `<section class="card cm-next"><div class="card-h"><span>${Icon('whistle')} Sıradaki maç</span><small class="muted">${U.esc(m.name)}</small></div>
        <div class="cm-vs"><div>${UI.shirt(h, 'big')}<b>${U.esc(h.name)}</b><small>Güç ${Coach.rating(h.id)}</small></div><em>VS</em><div>${UI.shirt(a, 'big')}<b>${U.esc(a.name)}</b><small>Güç ${Coach.rating(a.id)}</small></div></div>
        <div class="cm-scout"><div class="lbl">Rakip analizi</div>
          <div class="cm-sr"><span>Form</span>${Coach.formDots(m.opp)}</div>
          <div class="cm-sr"><span>Oyun anlayışı</span><b>${ost.t}</b></div>
          <div class="cm-sr"><span>Dikkat edilecek oyuncu</span><b>${CM_POS[star[1]]} ${U.esc(star[0])}</b></div>
          ${lgPos ? `<div class="cm-sr"><span>Ligdeki sırası</span><b>${lgPos}.</b></div>` : ''}
          <p class="muted cm-tip">${Coach.oppTip(Coach.oppStyle(m.opp))}</p></div>
        <div class="cm-play"><button class="btn btn-big" id="cm-play">${Icon('play')} Maçı yönet</button><button class="btn btn-ghost" id="cm-quick">${Icon('fast')} Hızlı sonuç</button></div>
        <p class="muted">${s.form} · ${CM_STYLES[s.style].t} · Antrenman: ${CM_FOCUS[s.focus].t} · İlk 11: ${Coach.xiPlayers().length}/11</p></section>`;
    } else if (m && m.comp === 'bye') {
      mh = `<section class="card"><p>Bu hafta maç yok.</p><button class="btn btn-big" id="cm-play">Haftayı geç</button></section>`;
    }
    const pos = Coach.myPos();
    const last = s.last ? `<p class="cm-last">Son maç: ${U.esc(Coach.club(s.last.opp).name)} ${s.last.gf}-${s.last.ga}${s.last.motm ? ` · ⭐ ${U.esc(s.last.motm)}` : ''}</p>` : '';
    const pend = (s.pend || []).length;
    return `${pend ? `<button class="card cm-pendc" id="cm-pend">${Icon('mail')}<span><b>Bekleyen kararlar: ${pend}</b><small>Oyuncuların ve yönetim senden cevap bekliyor</small></span>${Icon('chevron')}</button>` : ''}${mh}
      <section class="card"><div class="card-h"><span>${Icon('shield')} Yönetim</span><small class="muted">Hedef: ${Coach.targetText(s.target)}</small></div>
        <div class="lf-rows"><div class="lf-row"><span>Güven</span><div class="lf-bar"><i style="width:${s.conf}%;background:${s.conf > 55 ? '#46e08f' : s.conf > 30 ? '#ffcf3f' : '#ff6b6b'}"></i></div><b>${Math.round(s.conf)}</b></div>
        <div class="lf-row"><span>Takım uyumu</span><div class="lf-bar"><i style="width:${s.chem}%;background:#7fb2ff"></i></div><b>${Math.round(s.chem)}</b></div></div>
        <p class="muted">${[`Ligde ${pos}. sıradasın`, `${s.stint.w}G ${s.stint.d}B ${s.stint.l}M`, s.cup && !s.cup.out && !s.cup.done ? `Kupa hedefi: ${Coach.cupStageName(s.cupTarget)}` : '', s.conf < 30 ? 'Yönetim sabırsızlanıyor!' : ''].filter(Boolean).join(' · ')}</p>${last}</section>
      ${Coach.window() ? `<section class="card cm-win">${Icon('contract')} Transfer dönemi açık. Transfer sekmesinde oyuncu arayabilirsin.</section>` : ''}
      <section class="card"><div class="card-h"><span>${Icon('news')} Haberler</span></div><ul class="cm-news">${s.news.slice(0, 10).map((n) => `<li class="${n.type}">${U.esc(n.t)}</li>`).join('')}</ul></section>`;
  },
  oppTip(st) {
    return { att: 'Rakip hücum ediyor: kontra oyunla arkalarındaki boşluğu kullanabilirsin.', def: 'Rakip geride bekleyecek: hücum ya da önde baskı ile zorla.', press: 'Rakip önde baskı yapıyor: çabuk yorulurlar, ikinci yarıda hücuma kalk.', counter: 'Rakip kontraya yatacak: çok açılmadan dengeli oyna.', bal: 'Rakip dengeli oynuyor: kadronun gücüne güven.' }[st];
  },

  // ---------- kadro ----------
  prow(p, opts) {
    const s = Coach.s, inXi = s.xi.includes(p.id);
    const form = p.form.length ? (p.form.reduce((a, b) => a + b, 0) / p.form.length).toFixed(1) : '–';
    const roles = `${p.id === s.cap ? '<i class="cm-role c">C</i>' : ''}${p.id === s.pk ? '<i class="cm-role">P</i>' : ''}${p.id === s.fk ? '<i class="cm-role">F</i>' : ''}`;
    const mood = p.happy >= 70 ? '😀' : p.happy >= 45 ? '🙂' : p.happy >= 25 ? '😕' : '😠';
    const buy = opts && opts.buy;
    const info = buy
      ? [`${p.age} yaş`, p.free ? 'Serbest' : U.esc((Coach.base(p.club) || {}).name || ''), `Potansiyel ${Coach.potStars(p)}`]
      : [`${p.age} yaş`, p.loan ? `Kiralık: ${U.esc((Coach.base(p.loanClub) || {}).name || '')}` : '', p.inj ? `Sakat: ${p.inj} hafta` : '', p.sus ? 'Cezalı' : '', `Form ${form}`, `${p.g} gol`];
    return `<div class="cm-p ${buy ? 'buy' : ''} ${inXi ? 'xi' : ''} ${!Coach.available(p) && !buy ? 'out' : ''}">
      ${buy ? '' : `<button class="cm-x" data-xi="${p.id}" aria-label="İlk 11">${inXi ? '✓' : ''}</button>`}
      <span class="cm-pos ${p.pos}">${CM_POS[p.pos]}</span>
      <button class="cm-pn" ${buy ? '' : `data-pinfo="${p.id}"`}><b>${U.esc(p.n)}${roles}</b><small>${info.filter(Boolean).join(' · ')}</small></button>
      ${buy ? '' : `<span class="cm-mood">${mood}</span><i class="cm-fit"><i style="width:${p.fit}%"></i></i>`}
      <b class="cm-r">${Coach.ovr(p)}</b>
      ${buy ? `<div class="cm-acts"><span class="cm-pr">${p.free ? 'Bedelsiz' : U.money(p.price)}</span>${p.free ? `<button class="btn cm-buy" data-free="${p.id}">Sözleşme teklif et</button>` : `${p.known === 1 ? '' : `<button class="btn btn-ghost cm-buy" data-watch="${p.id}" ${p.known ? 'disabled' : ''}>${p.known ? 'Gözlemci izliyor' : 'Gözlemle'}</button>`}<button class="btn cm-buy" data-bid="${p.id}">Teklif ver</button>`}</div>` : ''}</div>`;
  },
  vSquad() {
    const s = Coach.s, xi = Coach.xiPlayers();
    const st = Coach.strength(xi, s.form, s.style);
    const sq = s.squad.filter((p) => !p.loan), loans = s.squad.filter((p) => p.loan);
    const grp = ['GK', 'DF', 'MF', 'FW'].map((pos) => `<div class="lbl">${POSITIONS[pos].l}</div>${sq.filter((p) => p.pos === pos).sort((a, b) => b.r - a.r).map((p) => Coach.prow(p)).join('')}`).join('');
    const nm = (id) => { const p = Coach.P(id); return p ? U.esc(p.n) : '–'; };
    return `<section class="card"><div class="card-h"><span>${Icon('squad')} Kadro (${sq.length})</span><button class="btn btn-ghost" id="cm-auto">Otomatik diz</button></div>
      <p class="muted">İlk 11: ${xi.length}/11 · Hücum ${Math.round(st.att)} · Savunma ${Math.round(st.def)}</p>
      <div class="cm-roles"><span><i class="cm-role c">C</i> Kaptan: <b>${nm(s.cap)}</b></span><span><i class="cm-role">P</i> Penaltı: <b>${nm(s.pk)}</b></span><span><i class="cm-role">F</i> Frikik: <b>${nm(s.fk)}</b></span></div>
      <p class="muted">Soldaki kutu ile 11'e al ya da çıkar. Kaptan, penaltıcı, sözleşme ve satış için oyuncunun adına dokun.</p>${grp}
      ${loans.length ? `<div class="lbl">Kiralıktakiler</div>${loans.map((p) => Coach.prow(p)).join('')}` : ''}</section>`;
  },
  playerInfo(id) {
    const s = Coach.s, p = Coach.P(id);
    if (!p) return;
    const v = Coach.value(p.r, p.age);
    const avg = p.apps ? (p.rs / p.apps).toFixed(2) : '–';
    const btns = [{ t: 'Kapat', cls: 'btn-ghost' }];
    if (!p.loan) {
      if (s.cap !== id) btns.push({ t: 'Kaptan yap', fn: () => { s.cap = id; s.chem = U.clamp(s.chem + (p.pers === 'lead' ? 2 : 0), 0, 100); Coach.news(`🅲 ${p.n} takımın yeni kaptanı.`, 'good'); Coach.save(); Coach.render(); } });
      if (p.pos !== 'GK' && s.pk !== id) btns.push({ t: 'Penaltıcı yap', fn: () => { s.pk = id; Coach.save(); Coach.render(); } });
      if (p.pos !== 'GK' && s.fk !== id) btns.push({ t: 'Frikikçi yap', fn: () => { s.fk = id; Coach.save(); Coach.render(); } });
      if (p.yrs <= 2) btns.push({ t: 'Sözleşme uzat', fn: () => Coach.renew(p) });
      if (Coach.window() && p.age <= 22 && !p.loan) btns.push({ t: 'Kiralık gönder', fn: () => Coach.loanOut(p) || Coach.render() });
      if (Coach.window()) btns.push({ t: 'Satışa çıkar', fn: () => Coach.sell(id) });
    }
    Game.modal(`<h3>${U.esc(p.n)}</h3><p>${POSITIONS[p.pos].l} · ${p.age} yaş · <span data-emo>${Coach.natFlag(p.nat)}</span> · ${CM_PERS[p.pers].t}</p><p class="muted">${CM_PERS[p.pers].d}</p>
      <div class="ms-grid"><div><span>Güç</span><b>${Coach.ovr(p)}</b></div><div><span>Potansiyel</span><b>${Coach.potStars(p)}</b></div><div><span>Kondisyon</span><b>${Math.round(p.fit)}</b></div><div><span>Moral</span><b>${Math.round(p.mor)}</b></div><div><span>Mutluluk</span><b>${Math.round(p.happy)}</b></div><div><span>Maaş</span><b>${U.money(p.wage)}/hf</b></div><div><span>Sözleşme</span><b>${p.yrs} yıl</b></div><div><span>Değer</span><b>${U.money(v)}</b></div><div><span>Maç</span><b>${p.apps}</b></div><div><span>Gol</span><b>${p.g}</b></div><div><span>Asist</span><b>${p.a}</b></div><div><span>Ort. puan</span><b>${avg}</b></div></div>`, btns, { wide: true });
  },
  sell(id) {
    const s = Coach.s, p = Coach.P(id);
    if (!p) return;
    if (!Coach.window()) return Game.toast('Transfer dönemi kapalı.', 'bad');
    if (s.squad.filter((x) => !x.loan).length <= 18) return Game.toast('Kadroda en az 18 oyuncu kalmalı.', 'bad');
    const fee = Math.round(Coach.value(p.r, p.age) * U.rand(0.8, 1.1) / 25000) * 25000;
    const buyers = CLUB_LIST.filter((x) => x[0] !== s.clubId && Math.abs(x[4] - p.r) < 10);
    const buyer = (buyers.length ? U.pick(buyers) : U.pick(CLUB_LIST))[0];
    Game.modal(`<h3>${U.esc(Coach.club(buyer).name)} teklif yaptı</h3><p>${U.esc(p.n)} için önerdikleri bonservis: <b>${U.money(fee)}</b></p>`, [
      { t: 'Reddet', cls: 'btn-ghost' },
      { t: 'Sat', cls: 'btn-big', fn: () => { Coach.sellTo(p, buyer, fee); Coach.render(); } },
    ]);
  },
  renew(p) {
    const s = Coach.s;
    const ask = Math.round(Coach.wageOf(p.r) * (p.r >= Coach.teamRating() ? 1.2 : 1.05) / 100) * 100;
    Game.modal(`<div class="ev-tag">Sözleşme</div><h3>${U.esc(p.n)} yeni sözleşme için ${U.money(ask)}/hafta istiyor.</h3><p class="muted">Şu anki maaşı ${U.money(p.wage)}/hafta · Maaş bütçesi: ${U.money(Coach.wageBill())} / ${U.money(s.wbudget)}</p>`, [
      { t: 'Vazgeç', cls: 'btn-ghost' },
      { t: 'Pazarlık et (−10%)', fn: () => { if (U.chance(p.pers === 'amb' ? 0.3 : 0.55)) { Coach.doRenew(p, Math.round(ask * 0.9 / 100) * 100); } else { p.happy = U.clamp(p.happy - 10, 0, 100); Game.toast(`${p.n} teklifi reddetti.`, 'bad'); Coach.save(); Coach.render(); } } },
      { t: 'Kabul et', cls: 'btn-big', fn: () => Coach.doRenew(p, ask) },
    ]);
  },
  doRenew(p, wage) {
    const s = Coach.s;
    if (Coach.wageBill() - p.wage + wage > s.wbudget * 1.05) return Game.toast('Bu maaş, yönetimin verdiği maaş bütçesini aşıyor.', 'bad');
    p.wage = wage; p.yrs += 3; p.happy = U.clamp(p.happy + 15, 0, 100); p.renewAsk = 0;
    Coach.news(`📝 ${p.n} ile sözleşme ${p.yrs} yıl olarak yenilendi (${U.money(wage)}/hafta).`, 'good');
    Coach.save(); Coach.render();
  },

  // ---------- taktik ----------
  vTactic() {
    const s = Coach.s, st = Coach.strength(Coach.xiPlayers(), s.form, s.style);
    const chip = (attr, k, t, d, on) => `<button class="cm-chip ${on ? 'on' : ''}" data-${attr}="${k}"><b>${t}</b>${d ? `<small>${d}</small>` : ''}</button>`;
    return `<section class="card"><div class="card-h"><span>${Icon('coach')} Diziliş</span></div><div class="cm-chips">${Object.keys(CM_FORMS).map((k) => chip('form', k, k, '', s.form === k)).join('')}</div>${Coach.pitch()}</section>
      <section class="card"><div class="card-h"><span>${Icon('bolt')} Oyun anlayışı</span></div><div class="cm-chips col">${Object.entries(CM_STYLES).map(([k, x]) => chip('style', k, x.t, x.d, s.style === k)).join('')}</div></section>
      <section class="card"><div class="card-h"><span>${Icon('train')} Haftalık antrenman</span></div><div class="lbl">Odak</div><div class="cm-chips col">${Object.entries(CM_FOCUS).map(([k, x]) => chip('focus', k, x.t, x.d, s.focus === k)).join('')}</div>
        <div class="lbl">Yoğunluk</div><div class="cm-chips col">${Object.entries(CM_TRAIN).map(([k, x]) => chip('train', k, x.t, x.d, s.train === k)).join('')}</div></section>
      <section class="card"><div class="card-h"><span>${Icon('rest')} Otomatik rotasyon</span></div><div class="cm-chips">${chip('rot', 'on', 'Açık', 'Kondisyonu düşen oyuncu maç öncesi dinç yedekle değişir.', s.rot !== false)}${chip('rot', 'off', 'Kapalı', "İlk 11'i her zaman sen belirlersin.", s.rot === false)}</div></section>
      <section class="card"><div class="card-h"><span>${Icon('ball')} Kritik anlar</span></div><div class="cm-chips">${chip('km', 'on', 'Ben oynayayım', 'Penaltı, frikik ve net fırsatlarda topu sen vurursun.', s.keyMom !== false)}${chip('km', 'off', 'Otomatik', 'Kritik anlar oyuncunun gücüne göre sonuçlanır.', s.keyMom === false)}</div></section>
      <p class="muted">Takım gücü: Hücum ${Math.round(st.att)} · Savunma ${Math.round(st.def)}</p>`;
  },
  pitch() {
    const s = Coach.s, a = Coach.assign(Coach.xiPlayers(), s.form), f = CM_FORMS[s.form];
    const rows = [['FW', f.FW, 18], ['MF', f.MF, 45], ['DF', f.DF, 72], ['GK', 1, 90]];
    const dots = rows.map(([slot, n, y]) => a.filter((x) => x.slot === slot).map((x, i, arr) => {
      const xp = ((i + 1) / (arr.length + 1)) * 100;
      return `<div class="cm-dot ${x.pen ? 'bad' : ''}" style="left:${xp}%;top:${y}%"><i>${Coach.ovr(x.p)}</i><span>${x.p.id === s.cap ? '(C) ' : ''}${U.esc(x.p.n.split(' ').slice(-1)[0])}</span></div>`;
    }).join('')).join('');
    return `<div class="cm-pitch">${dots}</div>`;
  },

  // ---------- transfer ----------
  vMarket() {
    const s = Coach.s, q = Coach.sq || {};
    const head = `<section class="card"><div class="card-h"><span>${Icon('contract')} Transfer</span><small class="muted">${Coach.window() ? 'Dönem açık' : 'Dönem kapalı'}</small></div>
      <div class="cm-fin"><div><span>Transfer bütçesi</span><b>${U.money(s.budget)}</b></div><div><span>Maaş gideri</span><b>${U.money(Coach.wageBill())}/hf</b></div><div><span>Maaş bütçesi</span><b>${U.money(s.wbudget)}/hf</b></div></div></section>`;
    if (!Coach.window()) return `${head}<section class="card"><p>Transfer dönemi kapalı. Yaz dönemi sezonun ilk 5 haftası, kış dönemi sezonun ortasında 4 hafta sürer.</p><p class="muted">Kapalıyken de oyuncularının sözleşmelerini yenileyebilirsin.</p></section>`;
    const chips = (attr, list, cur) => list.map(([v, t]) => `<button class="cm-chip sm ${String(cur) === String(v) ? 'on' : ''}" data-${attr}="${v}">${t}</button>`).join('');
    const res = s.scout.res || [];
    return `${head}
      <section class="card"><div class="card-h"><span>${Icon('globe')} Gözlemci ağı</span></div>
        <div class="lbl">Mevki</div><div class="cm-chips">${chips('spos', [['all', 'Hepsi'], ['GK', 'KL'], ['DF', 'DF'], ['MF', 'OS'], ['FW', 'FV']], q.pos || 'all')}</div>
        <div class="lbl">En fazla yaş</div><div class="cm-chips">${chips('sage', [[21, '21'], [25, '25'], [29, '29'], [33, 'Hepsi']], q.age || 33)}</div>
        <div class="lbl">En fazla bonservis</div><div class="cm-chips">${chips('smax', [[0.25, '%25'], [0.5, '%50'], [1, 'Tüm bütçe'], [0, 'Sınırsız']], q.max == null ? 0 : q.max)}</div>
        <button class="btn btn-big cm-sbtn" id="cm-search">${Icon('globe')} Oyuncu ara</button>
        ${res.length ? `<p class="muted">Gözlemle: 1 hafta sonra gerçek potansiyeli ve maaş beklentisi netleşir.</p>${res.map((p) => Coach.prow(p, { buy: true })).join('')}` : '<p class="muted">Kriterleri seçip arama yap.</p>'}</section>
      ${s.mk.length ? `<section class="card"><div class="card-h"><span>${Icon('mail')} Serbest oyuncular</span></div><p class="muted">Sözleşmesi bitmiş oyuncular: bonservis yok, sadece maaş.</p>${s.mk.map((p) => Coach.prow(p, { buy: true })).join('')}</section>` : ''}
      <p class="muted">Oyuncu satmak ya da kiralık göndermek için Kadro sekmesinde oyuncunun adına dokun.</p>`;
  },
  negotiate(id) {
    const s = Coach.s, p = s.scout.res.find((x) => x.id === id);
    if (!p) return;
    if (s.squad.length >= 30) return Game.toast('Kadro dolu (en fazla 30 oyuncu). Önce oyuncu sat.', 'bad');
    const opts = [0.8, 0.9, 1, 1.1].map((k) => Math.round(p.price * k / 25000) * 25000);
    const club = Coach.club(p.club);
    Game.modal(`<div class="ev-tag">Pazarlık · ${U.esc(club.name)}</div><h3>${U.esc(p.n)} için teklifin ne olacak?</h3>
      <p>${CM_POS[p.pos]} · ${p.age} yaş · Güç ${Coach.ovr(p)} · Potansiyel ${Coach.potStars(p)}</p>
      <p class="muted">Kulübün istediği: ${U.money(p.price)} · Bütçen: ${U.money(s.budget)}</p>`, opts.map((v, i) => ({ t: `${['−20%', '−10%', 'İstenen', '+10%'][i]} · ${U.money(v)}`, cls: i === 2 ? 'btn-big' : 'btn-ghost', fn: () => Coach.offer(p, v) })).concat([{ t: 'Vazgeç', cls: 'btn-ghost' }]), { wide: true });
  },
  offer(p, v) {
    const s = Coach.s;
    if (v > s.budget) return Game.toast('Bütçe yetmiyor.', 'bad');
    const club = Coach.club(p.club);
    const r = Coach.clubReply(p, v);
    if (r === 'yes') return Coach.contract(p, v);
    if (r === 'no') { Game.toast(`${club.name} teklifi reddetti.`, 'bad'); return; }
    const counter = Math.round((v + p.price) / 2 / 25000) * 25000;
    Game.modal(`<div class="ev-tag">Karşı teklif</div><h3>${U.esc(club.name)}: "${U.money(counter)} olursa anlaşırız."</h3>`, [
      { t: 'Vazgeç', cls: 'btn-ghost' },
      { t: `Kabul et · ${U.money(counter)}`, cls: 'btn-big', fn: () => (counter > s.budget ? Game.toast('Bütçe yetmiyor.', 'bad') : Coach.contract(p, counter)) },
    ]);
  },
  // oyuncuyla sözleşme görüşmesi
  contract(p, fee) {
    const s = Coach.s;
    p.ask = p.ask || Coach.wageAsk(p);
    let yrs = p.age >= 31 ? 1 : 3;
    const draw = () => {
      const opts = [0.9, 1, 1.15].map((k) => Math.round(p.ask * k / 100) * 100);
      const m = Game.modal(`<div class="ev-tag">Sözleşme görüşmesi</div><h3>${U.esc(p.n)} haftalık ${U.money(p.ask)} maaş istiyor.</h3>
        <p class="muted">Maaş gideri: ${U.money(Coach.wageBill())} / bütçe ${U.money(s.wbudget)}</p>
        <div class="lbl">Sözleşme süresi</div><div class="cm-chips">${[1, 2, 3, 4, 5].map((y) => `<button class="cm-chip sm ${y === yrs ? 'on' : ''}" data-yrs="${y}">${y} yıl</button>`).join('')}</div>
        <div class="lbl">Maaş teklifin</div>`, opts.map((w, i) => ({ t: `${U.money(w)}/hf · ${Math.round(Coach.willSign(p, w) * 100)}%`, cls: i === 1 ? 'btn-big' : 'btn-ghost', fn: () => {
        if (Coach.wageBill() + w > s.wbudget * 1.05) return Game.toast('Bu maaş, yönetimin verdiği maaş bütçesini aşıyor.', 'bad');
        if (U.chance(Coach.willSign(p, w))) { Coach.sign(p, fee, w, yrs); Game.modal(`<div class="ev-tag">Transfer</div><h3>✍️ ${U.esc(p.n)} imzayı attı!</h3><p>${yrs} yıllık sözleşme · ${U.money(w)}/hafta${fee ? ` · Bonservis ${U.money(fee)}` : ''}</p>`, [{ t: 'Harika!', cls: 'btn-big', fn: () => Coach.render() }]); }
        else { p.ask = Math.round(p.ask * 1.05 / 100) * 100; Game.toast(`${p.n} teklifi az buldu. Beklentisi biraz arttı.`, 'bad'); setTimeout(draw, 60); }
      } })).concat([{ t: 'Vazgeç', cls: 'btn-ghost' }]), { wide: true });
      U.$$('[data-yrs]', m).forEach((b) => (b.onclick = () => { yrs = +b.dataset.yrs; draw(); }));
    };
    draw();
  },

  // ---------- kulüp ----------
  vClub() {
    const s = Coach.s, c = Coach.my();
    const net = Coach.sponsorWeekly() - Coach.wageBill();
    const fac = Object.entries(CM_FAC).map(([k, f]) => {
      const lv = s.fac[k], building = s.build && s.build.k === k;
      return `<div class="cm-fac"><span class="cm-fi">${Icon(f.ic)}</span><span class="cm-ft"><b>${f.t}</b><small>${f.d}</small><i class="cm-stars">${'★'.repeat(lv)}${'☆'.repeat(5 - lv)}</i></span>
        ${building ? `<em class="cm-bld">${s.build.w} hf</em>` : lv >= 5 ? '<em class="cm-bld">MAX</em>' : `<button class="btn cm-buy" data-build="${k}" ${s.build ? 'disabled' : ''}>${U.money(Coach.facCost(k))}</button>`}</div>`;
    }).join('');
    return `<section class="card"><div class="card-h"><span>${Icon('coin')} Finans</span><small class="muted">${U.esc(c.name)}</small></div>
        <div class="cm-fin"><div><span>Kasa</span><b class="${s.money < 0 ? 'neg' : ''}">${U.money(s.money)}</b></div><div><span>Transfer bütçesi</span><b>${U.money(s.budget)}</b></div>
        <div><span>Sponsor geliri</span><b>${U.money(Coach.sponsorWeekly())}/hf</b></div><div><span>Maaş gideri</span><b>${U.money(Coach.wageBill())}/hf</b></div>
        <div><span>Haftalık net</span><b class="${net < 0 ? 'neg' : ''}">${U.money(net)}</b></div><div><span>Son bilet geliri</span><b>${s.lastGate ? U.money(s.lastGate) : '–'}</b></div>
        <div><span>Stadyum</span><b>${Coach.capacity().toLocaleString('tr')} kişi</b></div><div><span>Maaş bütçesi</span><b>${U.money(s.wbudget)}/hf</b></div></div>
        ${s.money < 0 ? '<p class="cm-warn">Kasa ekside! Yönetim sezon sonunda bunu hesaba katacak. Oyuncu satmayı ya da maaşları düşürmeyi düşün.</p>' : ''}</section>
      <section class="card"><div class="card-h"><span>${Icon('shield')} Tesisler</span><small class="muted">Aynı anda bir inşaat</small></div>${fac}</section>
      <section class="card"><div class="card-h"><span>${Icon('fans')} Taraftar ve soyunma odası</span></div>
        <div class="lf-rows"><div class="lf-row"><span>Taraftar</span><div class="lf-bar"><i style="width:${s.fans}%;background:#ffcf3f"></i></div><b>${Math.round(s.fans)}</b></div>
        <div class="lf-row"><span>Takım uyumu</span><div class="lf-bar"><i style="width:${s.chem}%;background:#7fb2ff"></i></div><b>${Math.round(s.chem)}</b></div></div>
        <p class="muted">Taraftar memnuniyeti stadın doluluğunu, takım uyumu sahadaki gücü etkiler. Uyum sabit ilk 11, taktik antrenmanı ve lider bir kaptanla artar.</p></section>`;
  },

  // ---------- lig ----------
  vLeague() {
    const s = Coach.s, t = Coach.table(), n = t.length;
    const rows = t.map((r, i) => { const c = Coach.club(r.id); return `<tr class="${r.id === s.clubId ? 'me' : ''} ${i >= n - 3 ? 'rel' : ''}"><td>${i + 1}</td><td class="tn">${UI.shirt(c)}${U.esc(c.name)}</td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf - r.ga}</td><td><b>${r.pts}</b></td></tr>`; }).join('');
    const cup = s.cup ? `<section class="card"><div class="card-h"><span>${Icon('star')} ${U.esc(s.cup.name)}</span><small class="muted">Hedef: ${Coach.cupStageName(s.cupTarget)}</small></div><p class="muted">${s.cup.done ? `Şampiyon: ${U.esc(Coach.club(s.cup.winner).name)}` : s.cup.out ? 'Kupadan elendik.' : `${Coach.cupStageName(s.cup.alive.length)} · ${s.cup.weeks[s.cup.stage]}. hafta`}</p></section>` : '';
    const sc = s.squad.filter((p) => p.g || p.a).sort((a, b) => b.g - a.g || b.a - a.a).slice(0, 5);
    return `<section class="card"><div class="card-h"><span>${Icon('table')} ${U.esc(Coach.lgName(s.lg.id))}</span><small class="muted">Hedef: ${Coach.targetText(s.target)}</small></div>
      <div class="tbl-wrap"><table class="tbl cm-tbl"><tr><th>#</th><th>Takım</th><th>O</th><th>G</th><th>B</th><th>M</th><th>Av</th><th>P</th></tr>${rows}</table></div></section>${cup}
      ${sc.length ? `<section class="card"><div class="card-h"><span>${Icon('ball')} Takımımızın golcüleri</span></div>${sc.map((p) => `<div class="cm-sr"><span>${CM_POS[p.pos]} ${U.esc(p.n)}</span><b>${p.g} gol · ${p.a} asist</b></div>`).join('')}</section>` : ''}`;
  },

  // ---------- kariyer ----------
  vCareer() {
    const s = Coach.s, t = s.rec;
    return `<section class="card"><div class="card-h"><span>${Icon('career')} ${U.esc(Coach.fullName())}</span><small class="muted">${s.age} yaş · <span data-emo>${Coach.natFlag(s.nat)}</span></small></div>
      <div class="ms-grid"><div><span>Maç</span><b>${t.w + t.d + t.l}</b></div><div><span>G-B-M</span><b>${t.w}-${t.d}-${t.l}</b></div><div><span>Gol</span><b>${t.gf}:${t.ga}</b></div><div><span>Kupa</span><b>${s.trophies.length}</b></div><div><span>İtibar</span><b>${Math.round(s.rep)}</b></div><div><span>Taktik zekası</span><b>${Math.round(s.iq)}</b></div></div>
      ${s.trophies.length ? `<ul class="trophies">${s.trophies.map((x) => `<li>🏆 ${U.esc(x)}</li>`).join('')}</ul>` : ''}
      ${s.awards.length ? `<ul class="trophies">${s.awards.slice(-6).map((x) => `<li>🏅 ${U.esc(x)}</li>`).join('')}</ul>` : ''}</section>
      <section class="card"><div class="card-h"><span>${Icon('globe')} Kariyer geçmişi</span></div>
      <div class="cm-hist">${(s.seasons || []).slice().reverse().map((x) => `<div><span>${x.y}</span><b>${U.esc(Coach.club(x.club).name)}</b><small>${U.esc(Coach.lgName(x.lg))} · ${x.pos}./${x.n}</small></div>`).join('') || '<p class="muted">İlk sezonun devam ediyor.</p>'}</div></section>
      <button class="btn btn-ghost" id="cm-retire">Teknik direktörlüğü bırak</button>`;
  },

  // ---------- bekleyen kararlar ----------
  showPending() {
    const s = Coach.s;
    if (!s || !s.pend || !s.pend.length || s.phase === 'end') return;
    const ev = s.pend.shift();
    const p = ev.id ? Coach.P(ev.id) : null;
    const next = (msg, type) => { Coach.save(); if (msg) Game.toast(msg, type || 'good'); Coach.render(); };
    if (ev.id && !p) return next('');
    const tag = (t) => `<div class="ev-tag">${t}</div>`;
    if (ev.k === 'unhappy') {
      return Game.modal(`${tag('Oyuncu görüşmesi')}<h3>${U.esc(p.n)} kapını çaldı: "Hocam, daha çok forma şansı istiyorum."</h3><p class="muted">${CM_POS[p.pos]} · Güç ${Coach.ovr(p)} · ${CM_PERS[p.pers].t}</p>`, [
        { t: '🤝 Söz veriyorum, oynayacaksın', fn: () => { p.promise = { w: 3, ok: 0 }; p.happy = U.clamp(p.happy + 20, 0, 100); next('Önümüzdeki 3 haftada en az 2 maç oynatmalısın.', 'info'); } },
        { t: '⏳ Sabırlı olmalısın', fn: () => { p.happy = U.clamp(p.happy - 5, 0, 100); if (p.pers === 'amb' || p.pers === 'rebel') s.chem = U.clamp(s.chem - 2, 0, 100); next(`${p.n} bu cevaptan memnun kalmadı.`, ''); } },
        { t: '📤 Satış listesine koy', fn: () => { p.listed = 1; p.happy = U.clamp(p.happy + 5, 0, 100); if (Coach.window()) s.pend.push({ k: 'bid', id: p.id, club: U.pick(CLUB_LIST.filter((c) => c[0] !== s.clubId))[0], fee: Math.round(Coach.value(p.r, p.age) * U.rand(0.75, 1.05) / 25000) * 25000 }); next(`${p.n} satış listesinde.`, ''); } },
      ]);
    }
    if (ev.k === 'rebel') {
      return Game.modal(`${tag('Soyunma odası')}<h3>${U.esc(p.n)} antrenmanda bir takım arkadaşıyla tartıştı.</h3>`, [
        { t: '💸 Para cezası ver', fn: () => { p.mor = U.clamp(p.mor - 8, 0, 100); s.chem = U.clamp(s.chem + 2, 0, 100); next('Takım disiplinli tavrını takdir etti.'); } },
        { t: '💬 Konuşarak çöz', fn: () => { p.happy = U.clamp(p.happy + 6, 0, 100); s.chem = U.clamp(s.chem - 1, 0, 100); next('Ortam yumuşadı ama bazıları daha sert bir tepki bekliyordu.', ''); } },
        { t: '🚫 Bir maç kadro dışı', fn: () => { p.sus = (p.sus || 0) + 1; s.xi = s.xi.filter((x) => x !== p.id); if (s.xi.length < 11) Coach.autoPick(); s.chem = U.clamp(s.chem + 3, 0, 100); p.happy = U.clamp(p.happy - 10, 0, 100); next(`${p.n} bir maç kadroda olmayacak.`, ''); } },
      ]);
    }
    if (ev.k === 'renew') {
      const ask = Math.round(Coach.wageOf(p.r) * 1.15 / 100) * 100;
      return Game.modal(`${tag('Sözleşme')}<h3>${U.esc(p.n)} yeni sözleşme istiyor: ${U.money(ask)}/hafta.</h3><p class="muted">Sözleşmesinin bitmesine ${p.yrs} yıl kaldı. Yenilemezsen sezon sonunda bedelsiz ayrılır.</p>`, [
        { t: 'Sonra konuşalım', cls: 'btn-ghost', fn: () => { p.happy = U.clamp(p.happy - 4, 0, 100); next(''); } },
        { t: 'Pazarlık et (−10%)', fn: () => { if (U.chance(0.55)) Coach.doRenew(p, Math.round(ask * 0.9 / 100) * 100); else { p.happy = U.clamp(p.happy - 10, 0, 100); next(`${p.n} teklifi reddetti.`, 'bad'); } } },
        { t: 'Kabul et', cls: 'btn-big', fn: () => Coach.doRenew(p, ask) },
      ]);
    }
    if (ev.k === 'bid') {
      const club = Coach.club(ev.club);
      return Game.modal(`${tag('Transfer teklifi')}<h3>${U.esc(club.name)}, ${U.esc(p.n)} için ${U.money(ev.fee)} teklif etti.</h3><p class="muted">${CM_POS[p.pos]} · ${p.age} yaş · Güç ${Coach.ovr(p)} · Değeri ${U.money(Coach.value(p.r, p.age))}</p>`, [
        { t: 'Reddet', cls: 'btn-ghost', fn: () => { if (p.pers === 'amb' && club.rating > Coach.my().rating) { p.happy = U.clamp(p.happy - 15, 0, 100); next(`${p.n} büyük bir kulübe gidememekten üzgün.`, 'bad'); } else next('Teklifi reddettin.', ''); } },
        { t: 'Daha fazlasını iste (+20%)', fn: () => { if (s.squad.filter((x) => !x.loan).length <= 18) return next('Kadroda en az 18 oyuncu kalmalı.', 'bad'); if (U.chance(0.5)) { Coach.sellTo(p, ev.club, Math.round(ev.fee * 1.2 / 25000) * 25000); next('Pazarlık başarılı, satış tamam!'); } else next(`${club.name} geri çekildi.`, ''); } },
        { t: `Sat · ${U.money(ev.fee)}`, cls: 'btn-big', fn: () => { if (s.squad.filter((x) => !x.loan).length <= 18) return next('Kadroda en az 18 oyuncu kalmalı.', 'bad'); Coach.sellTo(p, ev.club, ev.fee); next(''); } },
      ]);
    }
    if (ev.k === 'board') {
      return Game.modal(`${tag('Yönetim kurulu')}<h3>Başkan seni odasına çağırdı: "Sonuçlar beklediğimiz gibi değil."</h3>`, [
        { t: '🤝 Söz veriyorum, düzelteceğiz', fn: () => { s.conf = U.clamp(s.conf + 3, 0, 100); next('Yönetim sana biraz daha zaman tanıdı.'); } },
        { t: '💰 Transfer bütçesi istiyorum', fn: () => { if (U.chance(0.4) && s.money > 0) { const add = Math.round(s.money * 0.15 / 1e5) * 1e5; s.budget += add; next(`Yönetim bütçeye ${U.money(add)} ekledi.`); } else { s.conf = U.clamp(s.conf - 2, 0, 100); next('Yönetim bu talebi hoş karşılamadı.', 'bad'); } } },
      ]);
    }
    next('');
  },

  // ---------- sezon sonu ----------
  showSeasonEnd() {
    const s = Coach.s, x = s.lastSeason;
    if (!x || Coach._seShown === x.year) return;
    Coach._seShown = x.year;
    const c = Coach.club(x.club);
    const good = x.pos <= x.target;
    let offers = Coach.jobOffers(s.rep, s.clubId, 2).filter((id) => Coach.base(id).rating > c.rating - 2);
    const fired = s.conf < 25 && x.pos > x.target + 1;
    if (fired && !offers.length) offers = Coach.jobOffers(Math.max(5, s.rep - 10), s.clubId, 2);
    const msg = x.champ ? 'Şampiyonluk! Taraftarlar adını tezahürat yapıyor.' : good ? 'Yönetim hedefin tutturulmasından çok memnun.' : fired ? 'Yönetim hedefin çok uzağında kaldığın için sözleşmeni uzatmıyor.' : 'Hedefin gerisinde kaldın. Yönetim gelecek sezon daha iyisini bekliyor.';
    const aw = [x.top ? `⚽ Gol kralımız: ${U.esc(x.top[0])} (${x.top[1]})` : '', x.best ? `⭐ Sezonun oyuncusu: ${U.esc(x.best[0])} (${x.best[1]})` : '', x.young ? `🌱 Sezonun genci: ${U.esc(x.young)}` : ''].filter(Boolean);
    const html = `<div class="ev-tag">${x.year} sezonu bitti</div><h2>${U.esc(c.name)}</h2>
      <div class="cer-pos ${x.pos <= 3 ? ['gold', 'silver', 'bronze'][x.pos - 1] : ''}"><b>${x.pos}.</b><span>Lig sıralaması</span></div>
      ${x.moved === 'down' ? '<div class="cer-tag down">Küme düştük</div>' : x.moved === 'up' ? '<div class="cer-tag up">Üst lige yükseldik!</div>' : ''}
      <p>Hedef: <b>${Coach.targetText(x.target)}</b> · ${x.w}G ${x.d}B ${x.l}M</p><p>${msg}</p>
      ${x.prize ? `<p class="muted">Sezon sonu ödül ve yayın geliri: ${U.money(x.prize)}</p>` : ''}
      ${aw.length ? `<ul class="cm-aw">${aw.map((t) => `<li>${t}</li>`).join('')}</ul>` : ''}
      ${offers.length ? `<p class="muted">${fired ? 'Seninle ilgilenen kulüpler:' : 'Başka kulüpler de seninle ilgileniyor:'}</p><div class="cm-offers">${offers.map((id) => { const o = Coach.base(id); return `<button class="cm-offer" data-club="${id}">${UI.shirt(o, 'big')}<span><b>${U.esc(o.name)}</b><small>${U.esc(Coach.lgName(o.league))} · Güç ${o.rating}</small></span>${Icon('chevron')}</button>`; }).join('')}</div>` : ''}`;
    const btns = [];
    if (!fired) btns.push({ t: 'Kulübümde kal', cls: 'btn-big', fn: () => Coach.newSeason(null) });
    if (s.age >= 60) btns.push({ t: 'Emekli ol', cls: 'btn-ghost', fn: () => Coach.retire() });
    const m = Game.modal(html, btns, { wide: true });
    U.$$('[data-club]', m).forEach((b) => (b.onclick = () => { m.classList.add('hidden'); m.innerHTML = ''; Coach.newSeason(b.dataset.club); }));
    UI.strip(m);
  },
});
