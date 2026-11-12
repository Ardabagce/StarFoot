// Kariyer 1.0.19: seçilen kulübe transfer talebi (kabul / şartlı / ret), imza parası, forma satışından pay,
// transfer dönemlerinde teklif garantisi, kişilik sistemi ve kiralık gönderilme.

const C2 = {
  feat() { return typeof FEAT_V19 !== 'undefined' && FEAT_V19; },
  on() { return C2.feat() && !!Game.state && !Game.inStreet() && !Game.isYouth(); },
  lgOf(c) { return (c && LEAGUES.find((l) => l.id === c.league)) || { fame: 1, name: '', flag: '' }; },
  ovr() { return Player.overall(Game.p, true); },
};

// ---------- Transfer talebi: oyuncu kulübü seçer, kulüp şartlara göre karar verir ----------
const TReq = {
  REASON: {
    budget: 'Kulübün istediği bonservisi karşılayamayız.',
    squad: 'Kadromuzda bu mevkide yeterince oyuncu var.',
    level: 'Şu an aradığımız seviyede değilsin.',
    age: 'Daha genç bir oyuncu arıyoruz.',
  },
  win() { return Game.tWindow(Game.state.season.round); },
  star() { return typeof Star !== 'undefined' && Star.has(); },
  key() { const s = Game.state, w = TReq.win(); return w ? `${s.season.year}-${w.id}` : ''; },
  left() {
    const s = Game.state;
    if (!TReq.win()) return 0;
    if (TReq.star()) return 99;
    return s.treqUsed === TReq.key() ? 0 : 1;
  },
  // Kendi kulübünün isteyeceği bonservis
  fee() {
    const s = Game.state, p = s.player, ovr = C2.ovr();
    const key = ovr >= Game.club().rating + 2;
    return Math.round(Game.marketValue(p, ovr) * (s.contract.years >= 2 ? 1.25 : 1) * (key ? 1.15 : 1) / 50000) * 50000;
  },
  maxFee(c) { return Game.marketValue({ age: 26, fame: 30 }, c.rating + 5) * 1.6 * Math.max(0.5, C2.lgOf(c).fame); },
  // Kulübün kararı: 'yes' | 'cond' | 'no'
  evalClub(c) {
    const p = Game.p, ovr = C2.ovr();
    const better = (c.roster || []).filter((x) => x.pos === p.position && x.r >= ovr).length;
    const young = p.age <= 21 ? Math.min(3, (22 - p.age) * 0.75) : 0;
    const fr = FrTeam.at(c.id).length ? 1.5 : 0;
    const sc = fr + (ovr - c.rating) + 2 + young + Math.min(4, (p.fame || 0) / 20) - Math.min(4, Math.max(0, better - 2) * 0.8) - (p.age > 31 ? (p.age - 31) * 1.5 : 0) + (Pers.is('lead') || Pers.is('amb') ? 0.5 : 0);
    if (TReq.fee() > TReq.maxFee(c)) return { res: 'no', why: 'budget', sc };
    if (p.age >= 33 && c.rating >= 80) return { res: 'no', why: 'age', sc };
    if (sc >= 0) return { res: 'yes', sc };
    if (sc >= -6) return { res: 'cond', target: Math.min(99, ovr + Math.ceil(-sc) + 1), sc };
    return { res: 'no', why: better >= 4 ? 'squad' : 'level', sc };
  },
  hint(c) {
    const e = TReq.evalClub(c);
    return e.res === 'yes' ? ['hi', 'Yüksek ilgi'] : e.res === 'cond' ? ['mid', 'Belki'] : ['lo', 'Düşük ihtimal'];
  },
  offerFor(c) {
    const s = Game.state, ovr = C2.ovr();
    const pay = (typeof LEAGUE_PAY !== 'undefined' && LEAGUE_PAY[c.league]) || 1;
    const fee = TReq.fee();
    const o = {
      clubId: c.id, years: U.randi(3, 5), fee, feeType: fee ? 'fee' : 'free', req: true, picked: true, exp: Math.min(s.season.round + 2, (TReq.win() || { to: s.season.round }).to),
      wage: Math.round(Game.wageFor(c.rating, ovr) * pay * 1.05 / 100) * 100,
    };
    Deal.decorate(o);
    return o;
  },
  card() {
    if (!C2.on()) return '';
    const s = Game.state, p = s.player, w = TReq.win();
    const pend = (s.treqs || []).map((x) => `<div class="tq-row"><span>⏳</span><b>${U.esc(Game.club(x.id).name)}</b><small>Talebin değerlendiriliyor</small></div>`).join('');
    const goals = (p.tGoals || []).map((g) => `<div class="tq-row"><span>🎯</span><b>${U.esc(Game.club(g.id).name)}</b><small>Güç ${g.ovr} olursa (şu an ${C2.ovr()})</small></div>`).join('');
    const loan = Loan.card();
    if (loan) return loan;
    if (s.loan) return `<section class="card tq-card"><div class="card-h"><span>${Icon('mail')} Kiralık</span></div><p class="muted">${U.esc(Game.club(s.loan.parent).name)} kulübünden sezon sonuna kadar kiralıksın.</p></section>`;
    if (!w && !pend && !goals) return '';
    const left = TReq.left();
    return `<section class="card tq-card"><div class="card-h"><span>${Icon('mail')} Transfer talebi</span><small class="muted">${w ? w.name : 'Transfer dönemi kapalı'}</small></div>
      <p class="muted">İstediğin kulübe talep gönder. Kulüp gücüne, bütçesine ve kadro ihtiyacına göre karar verir.</p>
      ${pend}${goals}
      ${w ? `<button class="btn ${left ? 'btn-big' : 'btn-ghost'}" data-treq="1">${Icon('globe')} Kulüp seç <small>${left >= 99 ? '· Premium: sınırsız' : left ? '· 1 hak' : '· hakkın bitti'}</small></button>` : ''}
    </section>`;
  },
  bind(root) {
    U.$$('[data-treq]', root).forEach((b) => (b.onclick = () => TReq.open()));
    U.$$('[data-loan]', root).forEach((b) => (b.onclick = () => (b.dataset.loan === 'yes' ? Loan.accept() : Loan.decline())));
  },
  open() {
    const s = Game.state;
    if (!TReq.win()) return Game.toast('Transfer dönemi kapalı.', 'info');
    if (s.loan) return Game.toast('Kiralıkken transfer talebi gönderemezsin.', 'info');
    if (!TReq.left()) return typeof Star !== 'undefined' ? Star.pitch('Transfer talebi', 'transfer') : Game.toast('Bu dönem için talep hakkın bitti.', 'info');
    if ((s.treqs || []).length >= 3) return Game.toast('Aynı anda en fazla 3 talep bekleyebilir.', 'info');
    const cur = Game.club().league;
    const lgs = LEAGUES.filter((l) => l.level === 1 || l.id === cur);
    const m = Game.modal(`<h3>${Icon('globe')} Hangi ligde oynamak istersin?</h3><div class="tq-lgs">${lgs.map((l) => `<button class="tq-lg" data-lg="${l.id}"><span data-emo>${l.flag || ''}</span><b>${U.esc(l.name)}</b><small>${U.esc(l.country || '')}</small></button>`).join('')}</div>`, [{ t: 'Vazgeç', cls: 'btn-ghost' }], { wide: true });
    U.$$('[data-lg]', m).forEach((b) => (b.onclick = () => TReq.clubs(b.dataset.lg)));
  },
  clubs(lgId) {
    const s = Game.state;
    const taken = new Set([s.clubId].concat((s.treqs || []).map((x) => x.id)).concat((s.offers || []).map((o) => o.clubId)));
    const list = Object.values(s.world.clubs).filter((c) => c.league === lgId && !taken.has(c.id)).sort((a, b) => (FrTeam.at(b.id).length - FrTeam.at(a.id).length) || b.rating - a.rating);
    const l = LEAGUES.find((x) => x.id === lgId) || {};
    const m = Game.modal(`<h3>${U.esc(l.name || '')}</h3><p class="muted">Gücün ${C2.ovr()} · Kulübünün istediği bonservis: ${U.money(TReq.fee())}</p>
      <div class="tq-clubs">${list.map((c) => { const [k, t] = TReq.hint(c); const fr = FrTeam.at(c.id)[0]; return `<button class="tq-club" data-tc="${c.id}">${UI.shirt(c)}<span><b>${U.esc(c.name)}</b><small>Güç ${c.rating}</small>${fr ? `<small class="tq-fr">🤝 Arkadaşın ${U.esc(fr.n)} burada</small>` : ''}</span><em class="tq-h ${k}">${t}</em></button>`; }).join('')}</div>`,
    [{ t: 'Geri', cls: 'btn-ghost', fn: () => setTimeout(() => TReq.open(), 30) }], { wide: true });
    U.$$('[data-tc]', m).forEach((b) => (b.onclick = () => { m.classList.add('hidden'); m.innerHTML = ''; TReq.send(b.dataset.tc); }));
  },
  send(id) {
    const s = Game.state, c = Game.club(id), w = TReq.win();
    if (!w || !c) return;
    if (!TReq.star()) s.treqUsed = TReq.key();
    s.treqs = (s.treqs || []).concat([{ id, r: s.season.round }]);
    Player.addRel(Game.p, 'coach', -3);
    if (s.season.round >= w.to) TReq.week(s.season.round + 1);
    else Game.news(`📨 Transfer talebin ${c.name} kulübüne iletildi. Cevap gelecek hafta.`, '');
    Game.save(); Game.render();
  },
  // Bekleyen talepleri sonuçlandır (haftalık)
  week(r) {
    const s = Game.state, p = s.player;
    const due = (s.treqs || []).filter((x) => x.r < r);
    if (!due.length) return;
    s.treqs = (s.treqs || []).filter((x) => x.r >= r);
    const moved = s.moved && s.moved.y === s.season.year;
    due.forEach((x) => {
      const c = Game.club(x.id);
      if (!c || moved) return;
      const e = TReq.evalClub(c);
      if (e.res === 'yes') {
        s.offers = (s.offers || []).filter((o) => o.clubId !== c.id).concat([TReq.offerFor(c)]);
        Game.news(`✅ ${c.name} transfer talebini kabul etti! Teklif masanda, transfer dönemi bitene kadar geçerli.`, 'good');
        const fr = FrTeam.at(c.id)[0];
        if (fr) { fr.rel = U.clamp(fr.rel + 5, 0, 100); Game.news(`🤝 ${fr.n}: "Hocayla ben de konuştum, gel aynı formayı giyelim!"`, 'good'); }
        Game.toast(`✅ ${c.name} teklif yaptı!`, 'good');
      } else if (e.res === 'cond') {
        p.tGoals = (p.tGoals || []).filter((g) => g.id !== c.id).concat([{ id: c.id, ovr: e.target, y: s.season.year }]);
        Game.news(`🤔 ${c.name}: "Gücün ${e.target} olursa seninle tekrar görüşmek isteriz."`, '');
      } else {
        Game.news(`❌ ${c.name} transfer talebini reddetti: "${TReq.REASON[e.why] || TReq.REASON.level}"`, 'bad');
      }
    });
  },
  // Şartlı hedefler tutunca kulüp kendisi teklif yapar
  goals(w) {
    const s = Game.state, p = s.player;
    if (!p.tGoals || !p.tGoals.length) return;
    const ovr = C2.ovr();
    p.tGoals = p.tGoals.filter((g) => s.season.year - g.y <= 2);
    p.tGoals.slice().forEach((g) => {
      if (ovr < g.ovr || g.id === s.clubId) return;
      const c = Game.club(g.id);
      p.tGoals = p.tGoals.filter((x) => x !== g);
      if (!c) return;
      s.offers = (s.offers || []).filter((o) => o.clubId !== c.id).concat([Object.assign(TReq.offerFor(c), { exp: w.to })]);
      Game.news(`🎯 ${c.name} sözünü tuttu: hedef gücü yakaladın, resmi teklif geldi!`, 'good');
    });
  },
};

// ---------- Sözleşme ekleri: imza parası ve forma satışından pay ----------
const Deal = {
  decorate(o) {
    if (!o || o.youth || o.sign != null) return o;
    const p = Game.p;
    o.sign = Math.round(o.wage * U.randi(6, 14) * (o.feeType === 'free' ? 2 : 1) * (o.own ? 0.5 : 1) / 1000) * 1000;
    o.shirt = U.clamp(Math.round(2 + (p.fame || 0) / 10 + (C2.lgOf(Game.club(o.clubId)).fame - 1) * 4 + U.rand(0, 2)), 2, 15);
    return o;
  },
  rows(o) {
    if (!o || (!o.sign && !o.shirt)) return '';
    return `<div><span>İmza parası</span><b>${U.money(o.sign || 0)}</b></div><div><span>Forma satış payı</span><b>${I18N.lang === 'tr' ? '%' + (o.shirt || 0) : (o.shirt || 0) + '%'}</b></div>`;
  },
  apply(o) {
    const s = Game.state, p = s.player;
    if (!o) return;
    if (o.sign) { p.money += o.sign; Game.news(`✍️ İmza parası ${U.money(o.sign)} hesabına yattı.`, 'good'); }
    if (s.contract) s.contract.shirt = o.shirt || 0;
  },
  // Sezon sonu forma satışı
  shirts() {
    const s = Game.state, p = s.player, c = Game.club();
    const pct = (s.contract && s.contract.shirt) || 0;
    const sold = Math.round((100 + Math.pow(Math.max(0, p.fame || 0), 1.6) * 60) * Math.pow(c.rating / 70, 3) * C2.lgOf(c).fame * U.rand(0.85, 1.15) / 100) * 100;
    const inc = Math.round(sold * 2800 * pct / 100 / 1000) * 1000;
    return { sold, pct, inc };
  },
};

// ---------- Kişilik ----------
const PERS = {
  agr: { t: 'Agresif', d: 'İkili mücadelede sertsin; taraftar sever ama kart riskin yüksek.' },
  lead: { t: 'Lider', d: 'Takım arkadaşların sana bakar; soyunma odasında sözün geçer, kaptanlık yolu kısalır.' },
  calm: { t: 'Sakin', d: 'Baskı altında soğukkanlısın; kötü sonuçlar moralini az etkiler, kart görmezsin.' },
  pro: { t: 'Profesyonel', d: 'Disiplinlisin; antrenmanlardan daha çok gelişirsin.' },
  rebel: { t: 'Asi', d: 'Kurallara meydan okursun; taraftar sever, hocalar zorlanır.' },
  amb: { t: 'Hırslı', d: 'Hep daha fazlasını istersin; hızlı gelişirsin ama yedek kalınca moralin çöker.' },
};
const Pers = {
  get() { const p = Game.state && Game.p; return C2.feat() && p && p.pers ? p.pers : null; },
  is(k) { return Pers.get() === k; },
  init(k) {
    const p = Game.p;
    if (!p || !PERS[k]) return;
    p.pers = k;
    p.persPts = { agr: 0, lead: 0, calm: 0, pro: 0, rebel: 0, amb: 0 };
    p.persPts[k] = 8;
  },
  note(k, v) {
    const p = Game.p;
    if (!Pers.get() || !PERS[k]) return;
    p.persPts = p.persPts || {};
    p.persPts[k] = (p.persPts[k] || 0) + v;
  },
  trainK() { const k = Pers.get(); return k === 'pro' ? 1.07 : k === 'amb' ? 1.05 : k === 'rebel' ? 0.95 : 1; },
  moraleK(v) { const k = Pers.get(); if (v >= 0 || !k) return 1; return k === 'calm' ? 0.6 : k === 'amb' ? 1.25 : 1; },
  cardK() { const k = Pers.get(); return k === 'agr' ? 1.6 : k === 'rebel' ? 1.3 : k === 'calm' ? 0.6 : 1; },
  afterMatch(sum) {
    if (!Pers.get() || !sum || !sum.played) return;
    if (sum.red) { Pers.note('rebel', 1.5); Pers.note('agr', 1); }
    else if (sum.yellow) Pers.note('agr', 0.6 * sum.yellow);
    else Pers.note('pro', 0.15);
    if (sum.rating >= 8) Pers.note('lead', 0.3);
    if (sum.goals >= 2) Pers.note('amb', 0.3);
  },
  // röportaj tonu: 0 mütevazı, 1 kendinden emin, 2 iddialı
  tone(k) {
    if (k === 0) { Pers.note('calm', 0.8); Pers.note('pro', 0.4); }
    else if (k === 1) { Pers.note('lead', 0.8); Pers.note('amb', 0.4); }
    else if (k === 2) { Pers.note('agr', 0.6); Pers.note('rebel', 0.6); }
  },
  week() {
    const k = Pers.get();
    if (!k) return;
    const p = Game.p, s = Game.state;
    if (k === 'lead') { Player.addRel(p, 'team', 0.4); Player.addRel(p, 'coach', 0.15); }
    if (k === 'rebel') { Player.addRel(p, 'coach', -0.25); Player.addRel(p, 'fans', 0.25); }
    if (k === 'agr') Player.addRel(p, 'fans', 0.15);
    // kişiliğe özel küçük olaylar
    if (U.chance(0.04)) {
      const ev = {
        agr: ['Antrenmanda sert müdahalen tartışma yarattı.', () => Player.addRel(p, 'team', -2), 'bad'],
        lead: ['Genç oyunculara verdiğin tavsiyeler soyunma odasında konuşuluyor.', () => Player.addRel(p, 'team', 3), 'good'],
        calm: ['Kötü giden bir haftada sakinliğin takımı toparladı.', () => Player.addMorale(p, 3), 'good'],
        pro: ['Ekstra antrenmanların hocanın dikkatini çekti.', () => Player.addRel(p, 'coach', 3), 'good'],
        rebel: ['Hocanın kararını sosyal medyada eleştirdin. Taraftar seni destekliyor.', () => { Player.addRel(p, 'coach', -4); Player.addRel(p, 'fans', 3); }, 'bad'],
        amb: ['Daha büyük hedeflerin olduğunu açıkça söyledin. Kulüpler kulak kabarttı.', () => { Player.addRel(p, 'fans', -2); Player.addFame(p, 0.5); }, ''],
      }[k];
      ev[1](); Game.news(`🧠 ${ev[0]}`, ev[2]);
    }
    // kişilik oyunla şekillenir
    const pts = p.persPts || {};
    Object.keys(pts).forEach((x) => (pts[x] *= 0.993));
    const top = Object.keys(PERS).sort((a, b) => (pts[b] || 0) - (pts[a] || 0))[0];
    if (top !== k && (pts[top] || 0) >= 8 && (pts[top] || 0) > (pts[k] || 0) + 3) {
      p.pers = top;
      Game.news(`🧠 Davranışların kişiliğini değiştirdi: artık ${PERS[top].t} biri olarak görülüyorsun.`, 'good');
      Social.post('daily', `${PERS[top].t} biri olduğumu söylüyorlar. Belki de haklılar.`, 1.1);
    }
    void s;
  },
  card() {
    const k = Pers.get();
    if (!k) return '';
    const pts = Game.p.persPts || {};
    const tot = Object.values(pts).reduce((a, b) => a + Math.max(0, b), 0) || 1;
    const bars = Object.entries(PERS).map(([x, v]) => `<div class="ps-r ${x === k ? 'on' : ''}"><span>${v.t}</span><i><i style="width:${Math.round(Math.max(0, pts[x] || 0) / tot * 100)}%"></i></i></div>`).join('');
    return `<section class="card ps-card"><div class="card-h"><span>${Icon('smile')} Kişiliğin</span><b class="ps-k">${PERS[k].t}</b></div><p class="muted">${PERS[k].d}</p>
      <div class="ps-bars">${bars}</div><p class="muted ps-n">Röportaj cevapların, kartların ve sahadaki tavrın kişiliğini zamanla değiştirir.</p></section>`;
  },
  createStep() {
    if (!C2.feat()) return '';
    return `<section class="cr-step">
      <div class="cr-step-h"><i>★</i><div><b>Kişiliğin</b><small>Kariyerin boyunca davranışlarınla değişebilir</small></div></div>
      <div class="cr-cards" id="cr-pers">${Object.entries(PERS).map(([k, v]) => `<button type="button" data-pers="${k}" class="cr-opt ${k === (Create.pers || 'pro') ? 'on' : ''}"><b>${v.t}</b><small>${v.d}</small></button>`).join('')}</div>
    </section>`;
  },
  bindCreate() {
    if (!C2.feat()) return;
    Create.pers = Create.pers || 'pro';
    U.$$('[data-pers]').forEach((b) => (b.onclick = () => { Create.pers = b.dataset.pers; U.$$('[data-pers]').forEach((x) => x.classList.toggle('on', x === b)); }));
  },
};

// Röportajda kişiliğe özel cevap: [moral, taraftar, hoca, takım, ün], manşet tonu (0-2) ve kategoriye göre cevap
const PERS_IV = {
  agr: { fx: [3, 5, -2, -1, 0.8], tone: 2, me: 'Sahada kimseye geçit vermem, bugün de vermedim!', res: 'Rakip bugün sertliğimizi hissetti, böyle devam!', fut: 'Kim karşımıza çıkarsa çıksın, ezip geçeceğiz!' },
  lead: { fx: [3, 2, 2, 4, 0.5], tone: 1, me: 'Takımı sırtlamak benim görevim, arkadaşlarıma güveniyorum.', res: 'Sonuç ne olursa olsun bu takım birlikte ayakta kalır.', fut: 'Takımın her bireyine ihtiyacımız var, hedefe birlikte yürüyeceğiz.' },
  calm: { fx: [3, 1, 3, 2, 0.2], tone: 0, me: 'Ne iyi günde şımarırım ne kötü günde yıkılırım.', res: 'Sonuçlar gelip geçer, önemli olan doğru yolda olmak.', fut: 'Adım adım gideceğiz, panik yok.' },
  pro: { fx: [2, 1, 4, 2, 0.3], tone: 0, me: 'Antrenmanda ne yaparsam maçta da o çıkar, disiplin her şey.', res: 'Planı uyguladık, şimdi dinlenip bir sonraki maça hazırlanacağız.', fut: 'Uyku, beslenme, antrenman. Gerisi kendiliğinden gelir.' },
  rebel: { fx: [3, 6, -5, -2, 1.2], tone: 2, me: 'Ne düşündüğümü söylerim: bana daha çok özgürlük verilmeli.', res: 'Bazı kararları hiç anlamadım, söyleyeceklerim var ama şimdi değil.', fut: 'Kuralları başkaları koysun, ben sahada konuşurum.' },
  amb: { fx: [4, 2, -1, -1, 0.9], tone: 2, me: 'Bu sadece başlangıç, gözüm çok daha büyük hedeflerde.', res: 'Bu sonuç bana yetmez, her maç kazanmak istiyorum.', fut: 'Bir gün dünyanın en iyisi olacağım, bunu herkes bilsin.' },
};
Pers.ivOpt = (cat) => {
  const k = Pers.get();
  if (!k || !PERS_IV[k]) return null;
  const x = PERS_IV[k];
  return { k, t: x[cat] || x.me, fx: x.fx, tone: x.tone, lab: PERS[k].t };
};

// ---------- Arkadaşla aynı takım ----------
const FrTeam = {
  at(clubId) {
    const p = Game.p;
    return (p && p.friends || []).filter((f) => f.job === 'pro' && f.club === clubId && f.rel >= 50);
  },
};

// ---------- Kiralık gönderilme ----------
const Loan = {
  // yaz transfer döneminin ilk haftası: az süre alan genç oyuncuya kulübü kiralık önerir
  maybe(r, w) {
    const s = Game.state, p = s.player;
    if (!w || w.id !== 'yaz' || r !== w.from || s.loan || s.loanOffer || p.age > 21 || (s.contract.years || 0) < 2) return;
    const last = p.history[p.history.length - 1];
    const own = Game.club(), ovr = C2.ovr();
    const benched = (last && last.apps < 15) || ovr < own.rating - 5;
    if (!benched || !U.chance(0.7)) return;
    const cands = Object.values(s.world.clubs).filter((c) => c.id !== own.id && c.league !== 'NONE' && c.rating < own.rating && LEAGUES.some((l) => l.id === c.league))
      .sort((a, b) => Math.abs(a.rating - ovr - 2) - Math.abs(b.rating - ovr - 2)).slice(0, 8);
    if (!cands.length) return;
    const same = cands.filter((c) => c.league === own.league || C2.lgOf(c).country === C2.lgOf(own).country);
    const c = U.pick(same.length && U.chance(0.6) ? same : cands);
    s.loanOffer = { id: c.id, y: s.season.year, to: w.to };
    Game.news(`🔁 ${own.name}, düzenli forma şansı bulman için seni bir sezon ${c.name} kulübüne kiralık göndermek istiyor.`, '');
  },
  card() {
    const s = Game.state;
    const o = s.loanOffer;
    if (!o || o.y !== s.season.year || s.season.round > o.to) return '';
    const c = Game.club(o.id);
    return `<section class="card tq-card loan"><div class="card-h"><span>${Icon('mail')} Kiralık teklifi</span><small class="muted">${o.to - s.season.round + 1} hafta</small></div>
      <div class="tq-row">${UI.shirt(c)}<b>${U.esc(c.name)}</b><small>${U.esc(C2.lgOf(c).name)} · Güç ${c.rating}</small></div>
      <p class="muted">Bir sezon ${U.esc(c.name)} formasını giyersin. Maaşın aynı kalır, sezon sonunda kulübüne dönersin. İyi oynarsan satın alma opsiyonunu kullanabilirler.</p>
      <div class="tq-acts"><button class="btn btn-ghost" data-loan="no">Kal ve forma için savaş</button><button class="btn btn-big" data-loan="yes">Kiralık git</button></div></section>`;
  },
  accept() {
    const s = Game.state, p = s.player, o = s.loanOffer;
    if (!o) return;
    const parent = s.clubId, c = Game.club(o.id), from = Game.club().name;
    s.loan = { parent, wage: s.contract.wage, years: s.contract.years, shirt: s.contract.shirt || 0, y: s.season.year, buy: Math.round(Game.marketValue(p) * 1.3 / 50000) * 50000 };
    s.loanOffer = null;
    Game.joinClub(c.id, s.loan.wage, s.loan.years);
    s.contract.loan = true;
    s.offers = []; s.treqs = [];
    s.moved = { y: s.season.year, w: 'yaz' };
    Game.news(`🔁 ${from} seni sezon sonuna kadar ${c.name} kulübüne kiraladı. Satın alma opsiyonu: ${U.money(s.loan.buy)}.`, 'good');
    Social.post('transfer', `Bir sezonluk yeni macera: ${c.name}! Forma şansını değerlendireceğim.`, 1.5);
    Game.save(); Game.render();
  },
  decline() {
    const s = Game.state;
    s.loanOffer = null;
    Player.addRel(s.player, 'coach', -2);
    Player.addMorale(s.player, 2);
    Game.news('Kiralık teklifini reddettin. Hocaya kendini kanıtlaman gerekecek.', '');
    Game.save(); Game.render();
  },
};

// ---------- Oyuna bağlama ----------
(function wire() {
  if (typeof Game === 'undefined') return;
  const mo = Game.makeOffers.bind(Game);
  Game.makeOffers = (...a) => { const r = mo(...a); if (C2.on()) r.forEach((o) => Deal.decorate(o)); return r; };

  const row = UI.offerRow.bind(UI);
  UI.offerRow = (o, i, ctx) => {
    const h = row(o, i, ctx);
    const extra = C2.feat() ? Deal.rows(o) : '';
    return extra ? h.replace('<div><span>Rolün</span>', `${extra}<div><span>Rolün</span>`) : h;
  };

  const acc = Game.acceptOffer.bind(Game);
  Game.acceptOffer = (i) => {
    const s = Game.state, o = s.offers && s.offers[i];
    acc(i);
    if (C2.feat() && o && s.clubId === o.clubId) {
      Deal.apply(o);
      const fr = FrTeam.at(o.clubId)[0];
      if (fr) { Player.addRel(s.player, 'team', 8); Player.addMorale(s.player, 6); fr.rel = U.clamp(fr.rel + 8, 0, 100); Game.news(`🤝 Çocukluk arkadaşın ${fr.n} ile artık aynı takımdasınız! Soyunma odasına hemen uyum sağladın.`, 'good'); }
      Game.save();
    }
  };

  const tw = Game.transferWeek.bind(Game);
  Game.transferWeek = (r) => {
    const s = Game.state;
    if (!C2.on()) return tw(r);
    if (s.loan) { s.offers = []; return; }
    tw(r);
    const w = Game.tWindow(r), p = s.player;
    if (s.loanOffer && (!w || r > s.loanOffer.to)) s.loanOffer = null;
    TReq.week(r);
    if (!w) { s.treqs = []; return; }
    if (s.moved && s.moved.y === s.season.year && s.moved.w === w.id) return;
    if (r === w.from) {
      TReq.goals(w);
      Loan.maybe(r, w);
      // teklif garantisi: iyi oynayan oyuncu boş kalmasın
      const ss = s.season.stats, avg = ss.apps ? ss.ratingSum / ss.apps : 6.6;
      if (!(s.offers || []).some((o) => !o.req)) {
        const more = avg >= 6.8 || (p.fame || 0) >= 25 ? Game.makeOffers(1, false, (s.offers || []).map((o) => o.clubId)) : [];
        if (more.length) { s.offers = (s.offers || []).concat(more); Game.news(`📨 ${Game.club(more[0].clubId).name} seninle ilgilendiğini resmen açıkladı!`, 'good'); }
        else { const c = U.pick(Object.values(s.world.clubs).filter((x) => x.id !== s.clubId && Math.abs(x.rating - C2.ovr()) <= 6)); if (c) Game.news(`🔎 ${c.name} gözlemcisi son maçında tribündeydi.`, ''); }
      }
    } else if (U.chance(0.2)) {
      const c = U.pick(Object.values(s.world.clubs).filter((x) => x.id !== s.clubId && Math.abs(x.rating - C2.ovr()) <= 5));
      if (c) Game.news(`🔎 ${c.name} gözlemcisi seni izlemeye devam ediyor.`, '');
    }
  };

  const es = Game.endSeason.bind(Game);
  Game.endSeason = () => {
    es();
    const s = Game.state, se = s && s.seasonEnd;
    if (!C2.feat() || !se || se.year !== s.season.year || se.c2 || Game.isYouth()) return;
    se.c2 = 1;
    se.offers.forEach((o) => Deal.decorate(o));
    // forma satışı
    if (s.contract && s.contract.shirt) {
      const f = Deal.shirts();
      if (f.inc) { s.player.money += f.inc; se.msg.unshift(`👕 Formanız bu sezon ${f.sold.toLocaleString('tr')} adet sattı. %${f.pct} payınla ${U.money(f.inc)} kazandın.`); Game.news(`👕 Forma satışından ${U.money(f.inc)} payın hesabına yattı.`, 'good'); }
    }
    // kiralık: dönüş ya da satın alma opsiyonu
    if (s.loan) {
      const L = s.loan, ss = se.stats, ovr = se.ovrAfter;
      se.offers = se.offers.filter((o) => !o.own);
      if (s.contract.years <= 0) {
        const par = Game.club(L.parent);
        se.offers.unshift(Deal.decorate({ clubId: L.parent, wage: Game.wageFor(par.rating, ovr), years: U.randi(2, 4), own: true, pro: true }));
      }
      if (se.avg >= 7.0 && ss.apps >= 15) {
        const lc = Game.club();
        se.offers.unshift(Deal.decorate({ clubId: lc.id, wage: Math.round(Game.wageFor(lc.rating, ovr) * 1.1 / 100) * 100, years: 4, fee: L.buy, feeType: 'fee', pro: true, loanBuy: true }));
        se.msg.unshift(`🔁 ${lc.name} kiralık sözleşmendeki satın alma opsiyonunu kullanmak istiyor (${U.money(L.buy)}).`);
      }
      se.msg.unshift(`🔁 Kiralık dönemin bitti. Bir teklif seçmezsen ${Game.club(L.parent).name} kulübüne dönersin.`);
    }
    Game.save();
  };

  const ns = Game.startNewSeason.bind(Game);
  Game.startNewSeason = (choice) => {
    const s = Game.state;
    let back = null;
    if (C2.feat() && s && s.loan) {
      const L = s.loan;
      s.clubId = L.parent;
      s.contract = Object.assign({}, s.contract, { clubId: L.parent, loan: false, shirt: L.shirt });
      s.loan = null;
      back = Game.club(L.parent).name;
    }
    ns(choice);
    if (!C2.feat()) return;
    if (choice && choice.pro && !choice.youth) { Deal.apply(choice); Game.save(); }
    if (back && (!choice || choice.own)) Game.news(`🔁 Kiralık dönemin bitti, ${back} kulübüne döndün.`, '');
  };

  const aw = Game.advanceWeek.bind(Game);
  Game.advanceWeek = (intl) => { const r = aw(intl); if (C2.on() && !intl) Pers.week(); return r; };

  if (typeof Player !== 'undefined') {
    const tm = Player.trainMult.bind(Player);
    Player.trainMult = (p) => tm(p) * (Game.state && p === Game.p ? Pers.trainK() : 1);
    const am = Player.addMorale.bind(Player);
    Player.addMorale = (p, v) => am(p, Game.state && p === Game.p ? v * Pers.moraleK(v) : v);
  }
  if (typeof Traits !== 'undefined' && Traits.afterMatch) {
    const ta = Traits.afterMatch.bind(Traits);
    Traits.afterMatch = (sum, ctx) => { ta(sum, ctx); Pers.afterMatch(sum); };
  }
  if (typeof Star !== 'undefined' && Star.transferReq) {
    const st = Star.transferReq.bind(Star);
    Star.transferReq = () => (Game.state && Game.state.loan ? Game.toast('Kiralıkken transfer talebi gönderemezsin.', 'info') : st());
  }
})();
