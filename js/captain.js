// Kaptanlık: hedefleri tamamlayan oyuncu pazubandını takar, maçta arkadaşlarını yönlendirir

const Captain = {
  ensure() {
    const s = Game.state;
    const pro = !Game.isYouth();
    if (!s.cap || s.cap.club !== s.clubId || s.cap.pro !== pro) s.cap = { club: s.clubId, pro, apps: 0, is: false };
    return s.cap;
  },

  is() {
    const s = Game.state;
    return !!(s && !Game.inStreet() && s.cap && s.cap.is && s.cap.club === s.clubId);
  },

  goals() {
    const s = Game.state, p = s.player;
    const c = Captain.ensure();
    const youth = Game.isYouth();
    const ss = s.season.stats;
    const avg = ss.apps ? ss.ratingSum / ss.apps : 0;
    const teamR = Game.teamRating(s.clubId);
    return [
      { l: `Bu takımda ${youth ? 12 : 25} maç`, cur: c.apps, need: youth ? 12 : 25 },
      { l: `En az ${youth ? 14 : 22} yaş`, cur: p.age, need: youth ? 14 : 22 },
      { l: 'Hoca ilişkisi 75', cur: Math.round(p.rel.coach), need: 75 },
      { l: 'Takım ilişkisi 75', cur: Math.round(p.rel.team), need: 75 },
      { l: `Genel güç ${teamR + 3} (takım ${teamR})`, cur: Player.overall(p), need: teamR + 3 },
      { l: 'Sezon reyting ortalaması 7.0 (en az 5 maç)', cur: ss.apps >= 5 ? +avg.toFixed(1) : 0, need: 7, fmt: ss.apps >= 5 ? avg.toFixed(1) : `${ss.apps}/5 maç` },
    ].map((g) => Object.assign(g, { ok: g.cur >= g.need }));
  },

  // Kulüp maçından sonra çağrılır
  afterMatch(played) {
    if (Game.inStreet()) return;
    const s = Game.state, p = s.player;
    const c = Captain.ensure();
    if (played) c.apps++;
    if (!c.is) {
      if (Captain.goals().every((g) => g.ok)) {
        c.is = true;
        c.since = s.season.year;
        p.captaincies = (p.captaincies || 0) + 1;
        Player.addMorale(p, 12);
        Player.addFame(p, Game.isYouth() ? 0.5 : 2);
        const t = `${Game.teamName()} kaptanlığına seçildin! Pazubant artık sende. Maçlarda arkadaşlarını sürükleyerek yerleştirebilirsin.`;
        Game.news(t, 'good');
        Game.toast('Kaptan oldun!', 'good');
        Social.post('trophy', `${Game.teamName()} kaptanı olmak gurur verici. Bu pazubandı hak etmeye devam edeceğim.`, 2);
      }
    } else if (p.rel.coach < 40 || p.rel.team < 40) {
      c.is = false;
      Game.news('Hocayla ve takımla ilişkilerin bozuldu; kaptanlık pazubandı senden alındı.', 'bad');
    }
  },

  card() {
    const c = Captain.ensure();
    if (c.is) {
      return `<section class="card cap-card on">
        <div class="card-h"><span><i class="armband">C</i> Takım Kaptanısın</span><small class="muted">${c.since || ''} sezonundan beri</small></div>
        <p>Maçta pozisyon geldiğinde arkadaşına <b>basılı tutup sürükleyerek</b> onu istediğin yere koşturabilirsin. Dokunursan pas verirsin.</p>
        <p class="muted">Hoca ya da takımla ilişkin 40'ın altına düşerse pazubant elinden alınır.</p>
      </section>`;
    }
    const gs = Captain.goals();
    const done = gs.filter((g) => g.ok).length;
    return `<section class="card cap-card">
      <div class="card-h"><span><i class="armband off">C</i> Kaptanlık Yolu</span><small class="muted">${done}/${gs.length} hedef</small></div>
      <div class="cap-goals">${gs.map((g) => `<div class="cg ${g.ok ? 'ok' : ''}"><span class="cg-i">${g.ok ? '✓' : ''}</span><span class="cg-l">${g.l}</span><b>${g.fmt || g.cur} / ${g.need}</b></div>`).join('')}</div>
      <p class="muted">Tüm hedefleri tamamladığın maçtan sonra kaptan seçilirsin. Kaptanken maçlarda arkadaşlarını sürükleyerek yönlendirirsin.</p>
    </section>`;
  },
};

// Forma numarası talebi: hoca performansa, ilişkiye ve numaranın sahibine göre karar verir
const Shirt = {
  // Kadrodaki numaraları kalıcı hale getirir ve numara → oyuncu eşlemesi döner
  map() {
    const s = Game.state;
    const roster = Game.teamRoster(s.clubId) || [];
    const used = new Set([s.player.shirt]);
    roster.forEach((x, i) => {
      if (!x.num) {
        let n = ((i * 7) % 30) + 2;
        while (used.has(n)) n = (n % 98) + 1;
        x.num = n;
      }
      used.add(x.num);
    });
    const m = {};
    roster.forEach((x) => (m[x.num] = x));
    return m;
  },

  // Yeni kulübe gelince: büyük yıldız değilsen 1-11 ve ikonik numaralar hemen verilmez
  onJoin() {
    const s = Game.state, p = s.player;
    const roster = Game.teamRoster(s.clubId) || [];
    const ovr = Player.overall(p, true), teamR = Game.teamRating(s.clubId);
    const big = p.fame >= 45 || ovr >= teamR + 7;
    const want = p.shirt;
    const used = new Set();
    roster.forEach((x, i) => {
      if (!x.num) { let n = ((i * 7) % 30) + 2; while (used.has(n)) n = (n % 98) + 1; x.num = n; }
      used.add(x.num);
    });
    const holder = roster.find((x) => x.num === want);
    let num;
    if (big && (!holder || (!holder.star && holder.r < ovr))) {
      num = want;
      if (holder) { let n = 30; while (used.has(n) || n === want) n++; holder.num = n; }
    } else {
      const free = Array.from({ length: 28 }, (_, i) => i + 13).filter((n) => !used.has(n));
      num = free.length ? U.pick(free) : want;
    }
    p.shirt = num;
    p.numReq = null;
    if (num !== want) Game.news(`Yeni kulübünde ${num} numaralı formayı giyeceksin. ${want} numara için sahada kendini kanıtlayıp talepte bulunabilirsin.`, '');
    else Game.news(`Yıldız transferi! ${want} numaralı formanı yeni kulübünde de giyeceksin.`, 'good');
  },

  canAsk() {
    const s = Game.state;
    return !Game.inStreet() && s.player.numReq !== `${s.season.year}-${s.clubId}`;
  },

  ask(n) {
    const s = Game.state, p = s.player;
    n = +n;
    if (!(n >= 1 && n <= 99) || n === p.shirt) return;
    const holder = Shirt.map()[n];
    const ovr = Player.overall(p);
    const teamR = Game.teamRating(s.clubId);
    const c = Captain.ensure();
    let score = (ovr - teamR) / 4 + (p.rel.coach - 50) / 10 + (p.rel.team - 50) / 15 + p.fame / 25 + Math.min(3, c.apps / 10) + (Captain.is() ? 2 : 0);
    const ss = s.season.stats;
    if (ss.apps >= 3) score += (ss.ratingSum / ss.apps - 6.8) * 1.5;
    let need = -1;
    if (holder) need = 1.5 + (holder.r - ovr) / 3 + (holder.star ? 2 : 0);
    if ([10, 7, 9].includes(n)) need += 1;
    if (n === 1 && p.position !== 'GK') need += 3; // 1 numara kalecilerindir
    p.numReq = `${s.season.year}-${s.clubId}`;
    const ok = score >= need;
    const coach = 'Teknik direktör';
    let msg;
    if (ok) {
      const old = p.shirt;
      p.shirt = n;
      if (holder) holder.num = old;
      Player.addMorale(p, 6);
      msg = holder
        ? `${coach}: "${n} numara artık senin. ${holder.n} senin ${old} numaranı alacak; performansınla bunu hak ettin."`
        : `${coach}: "Tamam, ${n} numara senin. Formayı terlet!"`;
      Game.news(`Forma numaran değişti: artık ${n} numarayı giyiyorsun.`, 'good');
      Social.post('daily', `Yeni numara, yeni hedefler: ${n}!`, 1.3);
    } else {
      Player.addMorale(p, -3);
      msg = holder
        ? `${coach}: "${n} numara şu an ${holder.n}'da. ${holder.star ? 'O takımın yıldızı. ' : ''}Önce sahada daha çok kendini göster, gelecek sezon tekrar konuşuruz."`
        : `${coach}: "Şimdilik ${p.shirt} numarayla devam. Performansın artınca tekrar konuşalım."`;
    }
    Game.save();
    Game.modal(`<div class="ev-tag">${ok ? 'Talep onaylandı' : 'Talep reddedildi'}</div><div class="num-big ${ok ? 'ok' : 'no'}">${ok ? n : p.shirt}</div><p>${U.esc(msg)}</p>`, [{ t: 'Tamam', fn: () => Game.render() }]);
  },

  card() {
    const s = Game.state, p = s.player;
    if (Game.inStreet()) return '';
    const m = Shirt.map();
    const can = Shirt.canAsk();
    const opts = Array.from({ length: 99 }, (_, i) => i + 1).filter((n) => n !== p.shirt)
      .map((n) => `<option value="${n}">${n}${m[n] ? ` · ${U.esc(m[n].n)}${m[n].star ? ' ★' : ''}` : ' · boş'}</option>`).join('');
    return `<section class="card num-card">
      <div class="card-h"><span>${Icon('contract')} Forma Numarası</span><small class="muted">Sezonda bir talep</small></div>
      <div class="num-row">
        <div class="num-big">${p.shirt}</div>
        <div class="num-form">
          <select id="num-sel" ${can ? '' : 'disabled'}>${opts}</select>
          <button class="btn" id="num-ask" ${can ? '' : 'disabled'}>Talep Et</button>
          <small class="muted">${can ? 'Hoca performansına, ilişkine ve numaranın şu anki sahibine bakarak karar verir. 10, 9 ve 7 gibi numaralar daha zordur.' : 'Bu sezon talebini ilettin. Gelecek sezon tekrar deneyebilirsin.'}</small>
        </div>
      </div>
    </section>`;
  },
};
