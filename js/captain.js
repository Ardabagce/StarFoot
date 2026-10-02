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
