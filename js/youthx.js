// Altyapıda transfer isteği: istediğin kulübün altyapısına geçmek için başvur.
// - Sezonda bir başvuru; cevap ertesi hafta gelir (kabul / seçme davetine çağrı / ret)
// - Yurt dışı akademiler 14 yaşından itibaren ve yalnız uluslararası gençlik turnuvasındaki seçmelerle
// - Kabul edilirsen geçiş sezon sonunda olur (sezon sonu tekliflerinin başında gelir)
const YReq = (() => {
  const on = () => { try { const s = Game.state; return !!(s && s.player && !Game.inStreet() && Game.isYouth() && s.player.age <= 16 && !s.seasonEnd); } catch (e) { return false; } };
  const st = () => Game.state.yreq && Game.state.yreq.y === Game.state.season.year ? Game.state.yreq : null;
  const own = () => Game.club();
  const domestic = (c) => (LEAGUE_CC[c.league] || '') === (LEAGUE_CC[own().league] || '');
  // başvuru gücü: yaşına göre gücün, sezon reytingin, ünün ve kulüpler arası seviye farkı
  function score(c) {
    const s = Game.state, p = s.player, ss = s.season.stats || {};
    const rel = Player.overall(p) - expectedAtAge(p.age);
    const avg = ss.apps >= 3 ? ss.ratingSum / ss.apps : 6.5;
    const gap = c.rating - own().rating;
    return rel * 0.8 - Math.max(0, gap) * 0.35 + (avg - 6.5) * 2 + Math.min(3, (p.fame || 0) / 15) - (domestic(c) ? 0 : 2);
  }
  const trialChance = (sc) => U.clamp(0.35 + sc * 0.07, 0.1, 0.85);
  function hint(c) {
    const sc = score(c);
    if (!domestic(c)) return sc >= -5 ? ['mid', 'Seçmelere çağrılabilirsin'] : ['lo', 'Düşük ihtimal'];
    return sc >= 1 ? ['hi', 'Yüksek ilgi'] : sc >= -5 ? ['mid', 'Belki'] : ['lo', 'Düşük ihtimal'];
  }
  function open() {
    if (!on()) return;
    if (st()) return Game.toast('Bu sezon zaten bir altyapı başvurusu yaptın.', 'info');
    const p = Game.p, cur = own().league;
    const lgs = LEAGUES.filter((l) => l.level === 1 || l.id === cur);
    const abroadOk = p.age >= 14;
    const m = Game.modal(`<h3>${Icon('globe')} Hangi altyapıda yetişmek istersin?</h3>
      <p class="muted">${abroadOk ? 'Yurt dışı akademilere uluslararası gençlik turnuvasındaki seçmelerle girilir.' : 'Yurt dışı akademilere 14 yaşından itibaren başvurabilirsin.'}</p>
      <div class="tq-lgs">${lgs.filter((l) => abroadOk || (LEAGUE_CC[l.id] || '') === (LEAGUE_CC[cur] || '')).map((l) => `<button class="tq-lg" data-ylg="${l.id}"><span data-emo>${l.flag || ''}</span><b>${U.esc(l.name)}</b><small>${U.esc(l.country || '')}</small></button>`).join('')}</div>`, [{ t: 'Vazgeç', cls: 'btn-ghost' }], { wide: true });
    U.$$('[data-ylg]', m).forEach((b) => (b.onclick = () => clubs(b.dataset.ylg)));
  }
  function clubs(lgId) {
    const s = Game.state;
    const list = Object.values(s.world.clubs).filter((c) => c.league === lgId && c.id !== s.clubId).sort((a, b) => b.rating - a.rating);
    const l = LEAGUES.find((x) => x.id === lgId) || {};
    const m = Game.modal(`<h3>${U.esc(l.name || '')}</h3><p class="muted"><span>Gücün</span> ${Player.overall(Game.p)} · <span>Altyapın</span>: ${U.esc(own().name)}</p>
      <div class="tq-clubs">${list.map((c) => { const [k, t] = hint(c); return `<button class="tq-club" data-yc="${c.id}">${UI.shirt(c)}<span><b>${U.esc(c.name)}</b><small>Güç ${c.rating}</small></span><em class="tq-h ${k}">${t}</em></button>`; }).join('')}</div>`,
    [{ t: 'Geri', cls: 'btn-ghost', fn: () => setTimeout(open, 30) }], { wide: true });
    U.$$('[data-yc]', m).forEach((b) => (b.onclick = () => { m.classList.add('hidden'); m.innerHTML = ''; send(b.dataset.yc); }));
  }
  function send(id) {
    const s = Game.state, c = Game.club(id);
    if (!c || st() || !on()) return;
    s.yreq = { y: s.season.year, id, r: s.season.round, st: 'wait' };
    Player.addRel(Game.p, 'coach', -2);
    Game.news(`📨 ${c.name} altyapısına başvurdun. Cevap gelecek hafta.`, '');
    Game.save(); Game.render();
  }
  // haftalık: bekleyen başvuruyu sonuçlandır
  function week() {
    const s = Game.state, q = s.yreq;
    if (!q || q.st !== 'wait' || q.y !== s.season.year || s.season.round <= q.r) return;
    const c = Game.club(q.id);
    if (!c || !Game.isYouth()) { s.yreq = null; return; }
    const sc = score(c);
    if (!domestic(c)) {
      if (sc >= -5) { q.st = 'trial'; q.ch = trialChance(sc); Game.news(`✈️ ${c.name} seni uluslararası gençlik turnuvasındaki seçmelere davet etti!`, 'good'); }
      else { q.st = 'no'; Game.news(`📩 ${c.name}: "Şu an aradığımız seviyede değilsin. Gelişimini takip edeceğiz."`, 'bad'); }
    } else if (sc >= 1) { q.st = 'yes'; Game.news(`🎉 ${c.name} altyapısı başvurunu kabul etti! Sezon sonunda aramıza katılabilirsin.`, 'good'); }
    else if (sc >= -5) { q.st = 'trial'; q.ch = trialChance(sc); Game.news(`📋 ${c.name} seni deneme antrenmanına çağırdı.`, 'good'); }
    else { q.st = 'no'; Game.news(`📩 ${c.name}: "Şu an aradığımız seviyede değilsin. Gelişimini takip edeceğiz."`, 'bad'); }
  }
  function trial() {
    const s = Game.state, q = st(), p = Game.p;
    if (!q || q.st !== 'trial') return;
    if (p.energy < 15) return Game.toast('Seçmeler için enerjin yetmiyor.', 'bad');
    const c = Game.club(q.id);
    Player.addEnergy(p, -15);
    if (U.chance(q.ch)) {
      q.st = 'yes';
      Player.addMorale(p, 8);
      Game.news(`🎉 Seçmeleri geçtin! ${c.name} altyapısı seni sezon sonunda bekliyor.`, 'good');
      Game.modal(`<h3>🎉 Seçmeleri geçtin!</h3><p><b>${U.esc(c.name)}</b> altyapısı seni istiyor. Geçişin sezon sonunda olacak.</p>`);
    } else {
      q.st = 'no';
      Player.addMorale(p, -4);
      Game.news(`😔 ${c.name} seçmelerinde yeterince göze çarpamadın. Gelecek sezon yeniden dene!`, 'bad');
      Game.modal(`<h3>😔 Seçmeleri geçemedin</h3><p><b>${U.esc(c.name)}</b> bu sefer seni almadı. Gelişmeye devam et, gelecek sezon yeniden başvurabilirsin.</p>`);
    }
    Game.save(); Game.render();
  }
  function card() {
    if (!on()) return '';
    const q = st(), c = q && Game.club(q.id);
    let body;
    if (!q) body = `<p class="muted">İstediğin kulübün altyapısına başvurabilirsin. Sezonda bir başvuru hakkın var.</p><button class="btn" data-yreq="open">Kulüp seç</button>`;
    else if (q.st === 'wait') body = `<div class="tq-row"><span>⏳</span><b>${U.esc(c.name)}</b><small>Başvurun değerlendiriliyor</small></div>`;
    else if (q.st === 'trial') body = `<div class="tq-row"><span>📋</span><b>${U.esc(c.name)}</b><small><span>Geçme şansı</span> %${Math.round(q.ch * 100)}</small></div><button class="btn" data-yreq="trial">Seçmelere katıl <small>Enerji −15</small></button>`;
    else if (q.st === 'yes') body = `<div class="tq-row"><span>✅</span><b>${U.esc(c.name)}</b><small>Sezon sonunda geçiş</small></div>`;
    else body = `<div class="tq-row"><span>✖️</span><b>${U.esc(c.name)}</b><small>Başvurun kabul edilmedi</small></div><p class="muted">Gelecek sezon yeniden başvurabilirsin.</p>`;
    return `<section class="card tq-card"><div class="card-h"><span>${Icon('mail')} Altyapı transfer isteği</span></div>${body}</section>`;
  }
  function install() {
    const aw = Game.advanceWeek;
    Game.advanceWeek = function (intl) {
      const r = aw.apply(this, arguments);
      try { if (!intl && Game.state && Game.state.yreq) { const b = Game.state.yreq.st; week(); if (Game.state.yreq && Game.state.yreq.st !== b) { Game.save(); Game.render(); } } } catch (e) { console.error(e); }
      return r;
    };
    // sezon sonu: kabul edilen altyapı geçişi tekliflerin başına
    const es = Game.endSeason;
    Game.endSeason = function () {
      const s = Game.state, q = s && s.yreq, y = s && s.season.year;
      const r = es.apply(this, arguments);
      try {
        if (q && q.st === 'yes' && q.y === y && s.seasonEnd && s.seasonEnd.year === y && !q.done) {
          q.done = true;
          const se = s.seasonEnd, c = Game.club(q.id);
          if (c && s.player.age <= 17 && !se.offers.some((o) => o.clubId === q.id)) {
            se.offers.unshift({ clubId: q.id, youth: true, req: true });
            se.msg.unshift(`<b>${U.esc(c.name)} altyapısı seni bekliyor. Geçmek için teklifi seç.</b>`);
            Game.save();
          }
        }
      } catch (e) { console.error(e); }
      return r;
    };
    document.addEventListener('click', (e) => {
      const b = e.target.closest && e.target.closest('[data-yreq]');
      if (!b) return;
      if (b.dataset.yreq === 'open') open(); else if (b.dataset.yreq === 'trial') trial();
    });
  }
  install();
  return { on, card, open, send, week, trial, score, hint };
})();
