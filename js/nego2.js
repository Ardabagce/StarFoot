// Transfer görüşmesi: menajerinle birlikte kulübün sportif direktörüyle masaya otur.
// Kalemler: haftalık maaş, sözleşme süresi, imza parası, rol sözü (ilk 11), serbest kalma maddesi.
// Kulübün gizli sınırları oyuncunun gücüne, ününe ve menajerin kalitesine göre belirlenir; direktörün sabrı tükenirse masadan kalkar.
(() => {
  if (typeof Nego === 'undefined' || typeof Game === 'undefined') return;
  const DIRS = ['Hakan Ersoy', 'Martin Keller', 'Luca Benedetti', 'Javier Molina', 'Pierre Lambert', 'Tom Whitaker', 'Ruud de Vries', 'Rui Carvalho', 'Kemal Aksoy', 'Stefan Brandt'];
  const r100 = (x) => Math.round(x / 100) * 100;
  const r1000 = (x) => Math.round(x / 1000) * 1000;
  const mgr = () => { const L = Game.p && Game.p.life; return L && L.manager ? L.manager : null; };
  let N = null; // açık görüşme
  let H = null; // pencerenin tıklama dinleyicisi (pencere paylaşımlı: her açılışta yenisiyle değiştirilir)

  function limits(o, c) {
    const p = Game.p, ovr = Player.overall(p, true), q = Life.mgrQ();
    // pazarlık gücü: kulübe göre ne kadar iyisin, ne kadar ünlüsün, menajerin ne kadar iyi
    const lev = (ovr - c.rating) / 20 + (p.fame || 0) / 250 + q * 0.05;
    const yPref = p.age <= 25 ? 4 : p.age <= 29 ? 3 : 2;
    return {
      lev,
      wMax: r100(o.wage * (1 + U.clamp(0.06 + lev * 0.45, 0.02, 0.45))),
      sMax: r1000(Math.max(o.sign || 0, o.wage * 4) * (1 + U.clamp(0.5 + lev * 1.5, 0.2, 2.5))),
      starter: Game.roleFor(ovr, c.rating, false, true) === 'starter' || lev > 0.15,
      rcOk: lev > 0.05,
      yPref,
    };
  }
  // teklif ne kadar sınırların dışında (0 = kabul edilebilir)
  function over(T, L) {
    let v = Math.max(0, T.wage / L.wMax - 1) * 3 + Math.max(0, (T.sign || 0) / Math.max(1, L.sMax) - 1) * 0.8;
    if (T.promise && !L.starter) v += 0.3;
    if (T.rc && !L.rcOk) v += 0.25;
    v += Math.max(0, Math.abs(T.years - L.yPref) - 1) * 0.06;
    return v;
  }
  function tip() {
    const T = N.T, L = N.L, m = mgr();
    const vague = !m || m.q < 1;
    if (N.state === 'deal') return m ? 'Güzel iş çıkardık. İmzayı at, gerisini ben hallederim.' : 'Anlaştınız. Bir menajerin olsaydı belki biraz daha alabilirdin.';
    const room = L.wMax / Math.max(1, T.wage);
    if (vague) return m ? 'Kulüp bütçesini tam bilmiyorum. Fazla zorlamayalım derim.' : 'Menajerin yok, pazarlığı kendin yapıyorsun. Kulübün sınırını tahmin etmek zor.';
    if (room > 1.12) return 'Maaşta hâlâ ciddi yer var, biraz daha isteyebiliriz.';
    if (room > 1.03) return 'Maaş sınıra yakın. Gerekirse imza parasına yüklenelim.';
    if (T.promise && !L.starter) return 'İlk 11 sözü vermekte zorlanıyorlar. Bu maddeyi bırakırsak anlaşma kolaylaşır.';
    if (T.rc && !L.rcOk) return 'Serbest kalma maddesi onları rahatsız ediyor.';
    return 'Bu teklif kulübün sınırında. Daha fazlası masayı riske atar.';
  }
  const fmtW = (v) => U.money(v);
  function view() {
    const o = N.o, c = N.c, T = N.T, m = mgr();
    const pat = Math.max(0, N.pat);
    const row = (k, label, val, sub) => `<div class="ng-row"><div class="ng-l"><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</div>
      <div class="ng-step"><button type="button" data-ng="${k}:-" ${N.state !== 'talk' ? 'disabled' : ''}>−</button><em>${val}</em><button type="button" data-ng="${k}:+" ${N.state !== 'talk' ? 'disabled' : ''}>+</button></div></div>`;
    const tog = (k, label, sub, a, b) => `<div class="ng-row"><div class="ng-l"><b>${label}</b><small>${sub}</small></div>
      <div class="ng-tog"><button type="button" class="${!T[k] ? 'on' : ''}" data-ng="${k}:0" ${N.state !== 'talk' ? 'disabled' : ''}>${a}</button><button type="button" class="${T[k] ? 'on' : ''}" data-ng="${k}:1" ${N.state !== 'talk' ? 'disabled' : ''}>${b}</button></div></div>`;
    const bubble = (who, cls, txt) => `<div class="ng-b ${cls}"><span>${who}</span><p>${U.esc(txt)}</p></div>`;
    return `<div class="ng" style="--c1:${c.c1};--c2:${c.c2}">
      <div class="ng-hero">
        ${UI.shirt(c, 'big')}
        <div class="ng-id"><small>Transfer görüşmesi</small><b>${U.esc(c.name)}</b><span><span>Sportif direktör</span> ${U.esc(N.dir)}</span></div>
        <div class="ng-pat"><small>Sabır</small><div class="ng-pb"><i class="${pat < 35 ? 'lo' : pat < 65 ? 'mid' : ''}" style="width:${pat}%"></i></div></div>
      </div>
      <div class="ng-seat"><div><b>${U.esc(Player.fullName(Game.p))}</b><small>Sen</small></div><div><b>${m ? U.esc(m.name) : '—'}</b><small>${m ? 'Menajerin' : 'Menajerin yok'}</small></div><div class="r"><b>${U.esc(N.dir)}</b><small>${U.esc(c.short || c.name)}</small></div></div>
      <div class="ng-chat">${bubble(N.dir, 'dir', N.say)}${bubble(m ? m.name : 'İç sesin', 'agent', tip())}</div>
      <div class="ng-terms">
        ${row('wage', 'Haftalık maaş', fmtW(T.wage), `<span>İlk teklif</span> ${fmtW(o.wage)}`)}
        ${row('years', 'Sözleşme süresi', `${T.years} <span>yıl</span>`, '')}
        ${row('bonus', 'İmza parası', fmtW(T.sign || 0), `<span>İlk teklif</span> ${fmtW(o.sign || 0)}`)}
        ${tog('promise', 'Rol', 'İlk 11 sözü ilk sezon geçerli', 'Rekabet', 'İlk 11 sözü')}
        ${tog('rc', 'Serbest kalma maddesi', 'Büyük kulüp gelirse ayrılmak kolaylaşır', 'Yok', 'Olsun')}
      </div>
      <div class="ng-btns">
        ${N.state === 'talk' ? `<button class="btn btn-ghost" type="button" data-ng="leave">Masadan kalk</button><button class="btn btn-big" type="button" data-ng="send">Teklifi sun</button>` : N.state === 'deal' ? `<button class="btn btn-ghost" type="button" data-ng="close">Sonra imzala</button><button class="btn btn-big" type="button" data-ng="sign">${o.own ? 'Sözleşmeyi imzala' : 'İmzala'}</button>` : '<button class="btn btn-big" type="button" data-ng="close">Kapat</button>'}
      </div>
    </div>`;
  }
  function paint() { const box = N && N.m && N.m.querySelector('.ng-host'); if (box) { box.innerHTML = view(); try { UI.strip(box); } catch (e) { /* yok */ } } }
  function step(k, dir) {
    const T = N.T, o = N.o;
    if (k === 'wage') T.wage = U.clamp(r100(T.wage + (dir === '+' ? 1 : -1) * o.wage * 0.05), r100(o.wage * 0.9), r100(o.wage * 1.8));
    else if (k === 'years') T.years = U.clamp(T.years + (dir === '+' ? 1 : -1), 1, 5);
    else if (k === 'bonus') { const st = Math.max(1000, r1000(Math.max(o.sign || 0, o.wage * 4) * 0.25)); T.sign = U.clamp((T.sign || 0) + (dir === '+' ? st : -st), 0, r1000(Math.max(o.sign || 0, o.wage * 4) * 4)); }
    else if (k === 'promise' || k === 'rc') T[k] = dir === '1';
    paint();
  }
  function send() {
    const T = N.T, L = N.L, c = N.c;
    N.round++;
    const v = over(T, L);
    if (v <= 0.001) {
      N.state = 'deal';
      N.say = U.pick(['Tamam, anlaştık. Kulübümüze hoş geldin!', 'Bu şartlar bizim için uygun. El sıkışalım.', 'Zorlu bir pazarlıktı ama anlaştık.']);
      if (typeof Sfx !== 'undefined') Sfx.buzz('success');
    } else if (v <= 0.3 && N.pat > 25) {
      // karşı teklif: sınırlara çeker
      N.pat -= 15 + Math.round(v * 40);
      T.wage = Math.min(T.wage, L.wMax); T.sign = Math.min(T.sign || 0, L.sMax);
      if (T.promise && !L.starter) T.promise = false;
      if (T.rc && !L.rcOk) T.rc = false;
      N.say = `Bu kadarını veremeyiz. Son önerimiz: haftalık ${fmtW(T.wage)}, imza parası ${fmtW(T.sign || 0)}${!T.promise && N.asked.promise ? ', ilk 11 sözü yok' : ''}.`;
    } else {
      N.pat -= 20 + Math.round(Math.min(v, 1.5) * 25);
      N.say = U.pick(['Bu rakamlar bizim için çok yüksek.', 'Bütçemizi aşıyor, tekrar düşünün.', 'Böyle bir teklifi yönetime götüremem.']);
    }
    if (N.state === 'talk' && N.pat <= 0) {
      N.state = 'walk';
      N.say = 'Bence bu görüşmeden bir şey çıkmayacak. İyi günler.';
      const o = N.o;
      if (!o.own) { const Lst = Nego.list(N.ctx), k = Lst.indexOf(o); if (k >= 0) Lst.splice(k, 1); Game.news(`🚪 ${c.name} görüşmeden çekildi, teklifini geri aldı.`, 'bad'); }
      else o.neg = 'no';
      Game.save();
    }
    paint();
  }
  function commit() {
    const o = N.o, T = N.T;
    o.wage = T.wage; o.years = T.years; o.sign = T.sign || 0; o.promise = !!T.promise; o.rc = !!T.rc; o.neg = 'ok';
    Game.save();
  }
  function close() { const m = N && N.m; N = null; if (m) { m.classList.add('hidden'); m.innerHTML = ''; } }

  Nego.btn = (o, i, ctx) => {
    if (o.neg === 'ok') return `<small class="nego-done good">Görüşme tamam: ${U.money(o.wage)}/hafta${o.promise ? ' · ilk 11 sözü' : ''}${o.rc ? ' · serbest kalma maddesi' : ''}</small>`;
    if (o.neg === 'no') return '<small class="nego-done">Kulüp son teklifinde ısrarcı</small>';
    return `<button class="btn btn-ghost nego-btn" data-nego="${i}" data-ctx="${ctx}">${Icon('contract')} Menajerinle masaya otur</button>`;
  };
  Nego.open = (i, ctx) => {
    const o = Nego.list(ctx)[i];
    if (!o || o.neg) return;
    if (typeof Deal !== 'undefined' && Deal.decorate) Deal.decorate(o);
    const c = Game.club(o.clubId);
    const L = limits(o, c);
    N = { o, c, ctx, i, L, T: { wage: o.wage, years: o.years || 3, sign: o.sign || 0, promise: false, rc: false }, pat: 100, round: 0, state: 'talk', asked: {}, dir: DIRS[(c.id.charCodeAt(0) + c.id.length) % DIRS.length], say: `${Player.fullName(Game.p)}, seni kadromuzda görmek istiyoruz. Teklifimiz masada, şartlarını dinliyorum.` };
    const m = Game.modal('<div class="ng-host"></div>', [], { wide: true });
    N.m = m;
    paint();
    if (H) m.removeEventListener('click', H);
    H = (e) => {
      const b = e.target.closest && e.target.closest('[data-ng]');
      if (!b || !N) return;
      const [k, a] = b.dataset.ng.split(':');
      if (k === 'send') send();
      else if (k === 'leave') { const c2 = ctx; close(); setTimeout(() => Nego.back(c2), 60); }
      else if (k === 'close') { if (N.state === 'deal') commit(); const c2 = ctx; close(); setTimeout(() => Nego.back(c2), 60); }
      else if (k === 'sign') {
        commit();
        const c2 = ctx, idx = Nego.list(c2).indexOf(o);
        close();
        setTimeout(() => {
          const btn = document.querySelector(`[data-offer="${idx}"][data-ctx="${c2}"]`);
          if (btn) btn.click(); else Nego.back(c2);
        }, 80);
      } else { if (k === 'promise' && a === '1') N.asked.promise = true; step(k, a); }
    };
    m.addEventListener('click', H);
  };

  // anlaşılan rol sözü ve serbest kalma maddesi sözleşmeye işlenir
  const mark = (o) => {
    const s = Game.state;
    if (!o || !s || !s.contract) return;
    if (o.promise) s.contract.promise = { y: s.season.year, clubId: s.clubId };
    if (o.rc) s.contract.rc = true; else if (o.neg === 'ok') delete s.contract.rc;
  };
  const ao = Game.acceptOffer.bind(Game);
  Game.acceptOffer = (i) => { const o = Game.state && Game.state.offers && Game.state.offers[i]; const r = ao(i); try { mark(o); } catch (e) { /* yok */ } return r; };
  const sns = Game.startNewSeason;
  Game.startNewSeason = function (choice) {
    const r = sns.apply(this, arguments);
    try { if (choice && choice.pro && !choice.youth) { mark(choice); if (choice.promise && Game.state.contract.promise) Game.state.contract.promise.y = Game.state.season.year; } } catch (e) { /* yok */ }
    return r;
  };
  // ilk 11 sözü: o sezon (kulüpte kaldığın sürece) yedek kalmazsın; çok geride değilsen
  const rf = Game.roleFor.bind(Game);
  Game.roleFor = (ovr, teamR, youth, preview) => {
    const r = rf(ovr, teamR, youth, preview), s = Game.state, pr = s && s.contract && s.contract.promise;
    if (r === 'bench' && pr && !youth && pr.clubId === s.clubId && pr.y === s.season.year && !s.pendingIntl && Math.abs(teamR - Game.teamRating(s.clubId)) < 0.01) return 'starter';
    return r;
  };
  // serbest kalma maddesi: transfer dönemlerinde bir teklif daha gelir
  const oc = Game.offerCount.bind(Game);
  Game.offerCount = (lo, hi) => oc(lo, hi) + (Game.state && Game.state.contract && Game.state.contract.rc ? 1 : 0);
})();
