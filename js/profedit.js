// Profil düzenleme (ücretsiz): ad, soyad ve temel görünüm (ten, saç modeli, saç rengi, sakal).
// Görünüm stüdyosundaki ek öğeler (yeni saç modelleri, bant, içlik, krampon, altın koleksiyon) Premium'da kalır.
const ProfEdit = {
  card() {
    const s = Game.state;
    if (!s || !s.player) return '';
    return `<section class="card pe-card">
      <div class="card-h"><span>${Icon('smile')} Profil Ayarları</span><small class="muted">Ücretsiz</small></div>
      <p class="muted pe-sub">Adını, soyadını ve temel görünümünü istediğin zaman değiştirebilirsin.</p>
      <button class="btn btn-ghost" data-profedit>${Icon('smile')} Adını ve görünümünü düzenle</button>
    </section>`;
  },
  clean(v) { return String(v || '').replace(/\s+/g, ' ').trim().slice(0, 18); },
  open() {
    const p = Game.p;
    const cur = Object.assign({}, Sprites.me(p));
    delete cur.gk; delete cur.foot;
    const sw = (k, list) => list.map((c) => `<button class="stu-sw ${cur[k] === c ? 'on' : ''}" data-pk="${k}" data-v="${c}" style="background:${c}" aria-label="${c}"></button>`).join('');
    const basic = Star.STYLES.map((x) => x[0]);
    // pencere kapanırken içerik temizlendiği için alanlar yazıldıkça saklanır
    let nm = p.name, sn = p.surname;
    const m = Game.modal(`<div class="studio pe">
      <h2>${Icon('smile')} Profil Ayarları</h2>
      <div class="pe-names">
        <label class="cr-f"><span>Adın</span><input id="pe-name" maxlength="18" autocomplete="off" value="${U.esc(p.name)}"></label>
        <label class="cr-f"><span>Soyadın</span><input id="pe-sur" maxlength="18" autocomplete="off" value="${U.esc(p.surname)}"></label>
      </div>
      <div class="stu-wrap"><canvas class="stu-cv" width="320" height="400"></canvas>
      <div class="stu-opts">
        <div class="lbl">Ten rengi</div><div class="stu-row">${sw('skin', SKINS)}</div>
        <div class="lbl">Saç modeli</div><div class="chip-row">${Star.STYLES.map(([k, l]) => `<button class="chip ${cur.style === k ? 'on' : ''}" data-pk="style" data-v="${k}">${l}</button>`).join('')}</div>
        <div class="lbl">Saç rengi</div><div class="stu-row">${sw('hair', HAIRS)}</div>
        <div class="lbl">Sakal</div><div class="chip-row"><button class="chip ${cur.beard ? '' : 'on'}" data-pk="beard" data-v="0">Yok</button><button class="chip ${cur.beard ? 'on' : ''}" data-pk="beard" data-v="1">Var</button></div>
        <p class="muted pe-note">${Icon('star')} Yeni saç modelleri, saç bandı, içlik ve krampon renkleri Görünüm Stüdyosu'nda.</p>
      </div></div></div>`, [
      { t: 'Vazgeç', cls: 'btn-ghost' },
      { t: 'Kaydet', cls: 'btn-big', fn: () => {
        const name = ProfEdit.clean(nm), sur = ProfEdit.clean(sn);
        if (!name || !sur) { setTimeout(() => Game.toast('Ad ve soyad boş bırakılamaz.', 'bad'), 30); return; }
        const renamed = name !== p.name || sur !== p.surname;
        p.name = name; p.surname = sur;
        // temel görünüm kaydedilir; Premium öğeleri (bant, içlik, krampon, yeni saçlar) korunur
        const base = p.look || Sprites.look(7);
        const keepStyle = !basic.includes(cur.style) ? base.style : cur.style;
        p.look = Object.assign({}, base, { skin: cur.skin, hair: cur.hair, style: keepStyle, bald: keepStyle === 'bald', beard: cur.beard });
        if (typeof SocialArt !== 'undefined' && SocialArt.cache) SocialArt.cache.clear();
        Game.save(); Game.render();
        Game.toast(renamed ? `Artık ${Player.fullName(p)} olarak anılıyorsun.` : 'Görünümün kaydedildi.', 'good');
      } },
    ], { wide: true });
    m.querySelector('#pe-name').oninput = (e) => { nm = e.target.value; };
    m.querySelector('#pe-sur').oninput = (e) => { sn = e.target.value; };
    const cv = m.querySelector('.stu-cv');
    const draw = () => {
      const c = cv.getContext('2d');
      c.clearRect(0, 0, cv.width, cv.height);
      const club = Game.inStreet() ? { id: 'X', c1: '#2a6fdb', c2: '#ffffff' } : Game.club();
      const g = c.createRadialGradient(160, 140, 20, 160, 160, 260);
      g.addColorStop(0, Sprites.shade(club.c1, -0.1)); g.addColorStop(1, '#0b1020');
      c.fillStyle = g; c.fillRect(0, 0, cv.width, cv.height);
      Sprites.figure(c, 160, 380, 340, { kit: Sprites.kit(club, false), look: cur, facing: 'down', number: p.shirt, t: 0 });
    };
    U.$$('[data-pk]', m).forEach((b) => (b.onclick = () => {
      const k = b.dataset.pk, v = b.dataset.v;
      if (k === 'beard') cur.beard = v === '1';
      else cur[k] = v;
      if (k === 'style') cur.bald = v === 'bald';
      U.$$(`[data-pk="${k}"]`, m).forEach((x) => x.classList.toggle('on', x === b));
      draw();
    }));
    draw();
  },
};
document.addEventListener('click', (e) => {
  const b = e.target.closest && e.target.closest('[data-profedit]');
  if (b && typeof Game !== 'undefined' && Game.state) ProfEdit.open();
});
