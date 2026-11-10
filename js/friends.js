// Arkadaşlar (1.0.19): okulda ve takımda arkadaş edinme, doğum günleri, yardım istekleri,
// büyüyünce farklı yollara giden arkadaşlar (futbolcu, gazeteci, menajer) ve sürpriz anlar.
const FR_KIND = { school: 'Okul arkadaşı', team: 'Takım arkadaşı', street: 'Mahalle arkadaşı' };
const FR_JOB = { pro: 'Futbolcu', journalist: 'Spor gazetecisi', agent: 'Menajer', coach: 'Altyapı antrenörü', other: 'Mühendis', doctor: 'Doktor', chef: 'Aşçı', teacher: 'Öğretmen' };

const Friends = {
  MAX: 6,
  on() { return typeof FEAT_V19 !== 'undefined' && FEAT_V19 && Game.state && Game.state.mode !== 'wc'; },
  list(p) { p = p || Game.p; if (!p.friends) p.friends = []; return p.friends; },
  get(id) { return Friends.list().find((f) => f.id === id); },
  pool(p) { return World.natPool(p.nation); },
  add(kind, name) {
    const p = Game.p, L = Friends.list(p);
    if (L.length >= Friends.MAX) return null;
    const n = name || World.genName(Friends.pool(p));
    if (L.some((f) => f.n === n) || n === Player.fullName(p)) return null;
    const f = { id: Date.now() % 1e7 + Math.floor(Math.random() * 1000), n, kind, since: Game.state.season.year, rel: U.randi(55, 70), age: p.age, job: null, club: null };
    L.push(f);
    return f;
  },
  // okulda ders sonrası: yeni arkadaş
  maybeSchool() {
    if (!Friends.on() || !U.chance(0.3)) return;
    const f = Friends.add('school');
    if (f) Game.news(`🤝 Sınıfta yeni bir arkadaş edindin: ${f.n}.`, 'good');
  },
  // haftalık: olay, yaş ilerleyince meslek, takımdan arkadaş
  week(s) {
    if (!Friends.on()) return;
    const p = s.player, L = Friends.list(p);
    // ilk arkadaş: mahalleden
    if (!L.length && p.age <= 12) { const f = Friends.add('street'); if (f) Game.news(`🤝 Mahalleden en yakın arkadaşın ${f.n} her maçında tribünde.`, ''); }
    // takımdan arkadaş (altyapı ya da profesyonel)
    if (!Game.inStreet() && U.chance(0.025) && L.length < Friends.MAX) {
      const ro = (Game.teamRoster(s.clubId) || []).filter((x) => x.n && !L.some((f) => f.n === x.n) && !x.star);
      const m = ro.length ? U.pick(ro) : null;
      if (m) { const f = Friends.add('team', m.n); if (f) { f.club = s.clubId; f.job = 'pro'; Game.news(`🤝 Takım arkadaşın ${f.n} ile çok iyi anlaşıyorsunuz. Artık yakın arkadaşsınız.`, 'good'); } }
    }
    // yaşla birlikte arkadaşlar meslek seçer
    L.forEach((f) => {
      f.age = p.age;
      f.rel = U.clamp(f.rel - 0.15, 0, 100);
      if (!f.job && p.age >= 19) {
        f.job = U.pick(['pro', 'pro', 'journalist', 'agent', 'coach', 'other', 'doctor', 'chef', 'teacher']);
        if (f.job === 'pro') f.club = Friends.pickClub(s);
        Game.news(f.club && s.world.clubs[f.club] ? `${f.n} profesyonel futbolcu oldu · ${s.world.clubs[f.club].name}` : `${f.n} yeni mesleğine başladı: ${FR_JOB[f.job]}`, '');
      }
    });
    // rakip takımda eski arkadaş
    const fx = Game.nextFixture();
    if (fx) {
      const opp = fx.home === s.clubId ? fx.away : fx.home;
      const fr = L.find((f) => f.job === 'pro' && f.club === opp && f.kind !== 'team');
      if (fr && fr.lastVs !== `${s.season.year}-${s.season.round}`) { fr.lastVs = `${s.season.year}-${s.season.round}`; Game.news(`⚔️ Sıradaki maçta eski arkadaşın ${fr.n} karşı takımda! Maç öncesi birbirinize mesaj attınız.`, ''); Player.addMorale(p, 2); }
    }
    if (!s.pendingFriend && L.length && U.chance(0.07)) s.pendingFriend = Friends.rollEvent(s);
  },
  pickClub(s) {
    const ids = Object.keys(s.world.clubs).filter((id) => id !== s.clubId && id !== 'STREET');
    return ids.length ? U.pick(ids) : null;
  },
  // olay seçimi: { k, id }
  rollEvent(s) {
    const p = s.player, L = Friends.list(p);
    const f = U.pick(L);
    const opts = ['bday', 'bday', 'chat'];
    if (p.age <= 18) opts.push('study');
    if (p.age >= 20) opts.push('loan');
    if (f.job === 'journalist') opts.push('press');
    if (f.job === 'agent') opts.push('agent');
    if (f.job === 'pro' && f.club && f.club !== s.clubId && f.rel >= 70 && !Game.isYouth()) opts.push('join');
    return { k: U.pick(opts), id: f.id };
  },
  show() {
    const s = Game.state, ev = s.pendingFriend;
    s.pendingFriend = null;
    const f = ev && Friends.get(ev.id);
    if (!f || !Friends.on()) return Game.checkPending();
    const p = s.player;
    const done = (msg, type) => { Game.save(); Game.render(); if (msg) Game.toast(msg, type || 'good'); Game.checkPending(); };
    const rel = (v) => (f.rel = U.clamp(f.rel + v, 0, 100));
    const head = `<div class="ev-tag">Arkadaşın · ${U.esc(f.n)}</div>`;
    const E = {
      bday: () => Game.modal(`${head}<h3>${U.esc(f.n)} doğum günü partisi veriyor ve seni de çağırdı!</h3>`, [
        { t: '🎉 Partiye git', fn: () => { rel(10); Player.addMorale(p, 5); Player.addEnergy(p, -6); done('Harika bir geceydi. Arkadaşlığınız güçlendi.'); } },
        { t: '🎁 Hediye gönder', fn: () => { const c = Math.max(50, Math.round(Game.weeklyIncome() * 0.05)); p.money -= c; rel(5); done(`Hediyen çok beğenildi. (${U.money(c)})`); } },
        { t: 'Gidemem', cls: 'btn-ghost', fn: () => { rel(-8); done(`${f.n} biraz kırıldı.`, ''); } },
      ]),
      chat: () => Game.modal(`${head}<h3>${U.esc(f.n)} arayıp "Seni maçta izledim, harikaydın!" dedi.</h3>`, [
        { t: '😊 Uzun uzun sohbet et', fn: () => { rel(6); Player.addMorale(p, 4); done('İyi bir dostun olduğu için şanslısın.'); } },
        { t: 'Kısa tut', cls: 'btn-ghost', fn: () => { rel(1); done('', ''); } },
      ]),
      study: () => Game.modal(`${head}<h3>${U.esc(f.n)} yarınki sınav için birlikte ders çalışmayı teklif ediyor.</h3>`, [
        { t: '📚 Birlikte çalış', fn: () => { rel(8); if (typeof School !== 'undefined') School.addIq(p, 1); s.ap = Math.max(0, s.ap - 1); done('Hem ders çalıştınız hem eğlendiniz. Zeka +1 (1 aksiyon hakkı)'); } },
        { t: 'Antrenmanım var', cls: 'btn-ghost', fn: () => { rel(-4); done('', ''); } },
      ]),
      loan: () => {
        const amt = Math.max(500, Math.round(p.money * 0.04 / 100) * 100);
        Game.modal(`${head}<h3>${U.esc(f.n)} zor durumda ve senden ${U.money(amt)} borç istiyor.</h3>`, [
          { t: '🤝 Ver', fn: () => { p.money -= amt; rel(12); if (U.chance(0.6)) { f.debt = amt; } done('Arkadaşın sana minnettar.'); } },
          { t: 'Veremem', cls: 'btn-ghost', fn: () => { rel(-6); done(`${f.n} anlayışla karşıladı ama biraz bozuldu.`, ''); } },
        ]);
      },
      press: () => Game.modal(`${head}<h3>Gazeteci arkadaşın ${U.esc(f.n)} seninle özel bir röportaj yapmak istiyor.</h3>`, [
        { t: '🎙️ Kabul et', fn: () => { rel(6); Player.addFame(p, 1.5); Player.addRel(p, 'fans', 4); done('Röportaj çok okundu. Ünün arttı!'); } },
        { t: 'Şimdi değil', cls: 'btn-ghost', fn: () => { rel(-2); done('', ''); } },
      ]),
      agent: () => Game.modal(`${head}<h3>Menajer olan arkadaşın ${U.esc(f.n)}: "Senin için birkaç kulüple konuşabilirim."</h3>`, [
        { t: '👍 Konuş', fn: () => {
          rel(4);
          if (Game.isYouth() || Game.inStreet()) return done('Arkadaşın altyapıdan çıkınca seninle ilgileneceğini söyledi.');
          const offers = Game.makeOffers(2, false, (s.offers || []).map((o) => o.clubId)).map((o) => Object.assign(o, { req: true, exp: s.season.round + 2 }));
          if (!offers.length) return done('Arkadaşın aradı ama şu an ilgilenen kulüp çıkmadı.', '');
          s.offers = (s.offers || []).concat(offers);
          Game.news(`📨 Menajer arkadaşın ${f.n} sayesinde ${offers.length} kulüp teklif yaptı! Teklifler 2 hafta geçerli.`, 'good');
          done('Teklifler ana ekranda!');
        } },
        { t: 'Gerek yok', cls: 'btn-ghost', fn: () => done('', '') },
      ]),
      join: () => {
        const c = s.world.clubs[s.clubId];
        f.club = s.clubId; f.kind = f.kind === 'school' ? 'school' : f.kind;
        Player.addRel(p, 'team', 6); Player.addMorale(p, 8); rel(10);
        Game.news(`🎉 Eski arkadaşın ${f.n} takımımız ${c ? c.name : ''} ile anlaştı! Artık aynı formayı giyeceksiniz.`, 'good');
        Game.modal(`${head}<h3>Sürpriz! ${U.esc(f.n)} senin takımına transfer oldu!</h3><p>Yıllar önce birlikte top koşturduğunuz arkadaşınla artık aynı soyunma odasındasınız.</p>`, [{ t: 'Harika!', cls: 'btn-big', fn: () => done('') }]);
      },
    };
    (E[ev.k] || E.chat)();
    // borç geri dönüşü
    Friends.list(p).forEach((x) => { if (x.debt && U.chance(0.25) && x.id !== f.id) { p.money += x.debt; Game.news(`💸 ${x.n} borcunu teşekkürlerle geri ödedi: ${U.money(x.debt)}.`, 'good'); x.debt = 0; } });
  },
  // Yaşam sekmesindeki kart
  card() {
    if (!Friends.on()) return '';
    const L = Friends.list();
    if (!L.length) return '';
    const s = Game.state;
    const job = (f) => (f.job ? `${FR_JOB[f.job]}${f.job === 'pro' && f.club && s.world.clubs[f.club] ? ` · ${s.world.clubs[f.club].name}` : ''}` : FR_KIND[f.kind]);
    return `<section class="card fr-card"><div class="card-h"><span>${Icon('team')} Arkadaşların</span><small class="muted">${L.length}/${Friends.MAX}</small></div>
      ${L.map((f) => `<div class="fr-row"><i class="fr-av">${U.esc(f.n.trim()[0] || '?')}</i><span><b>${U.esc(f.n)}</b><small>${U.esc(job(f))}</small></span><div class="lf-bar"><i style="width:${Math.round(f.rel)}%;background:#7fb2ff"></i></div></div>`).join('')}
    </section>`;
  },
};
