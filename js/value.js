// Maaş artışı talebi (ücretsiz), StarDeğer piyasa değeri sayfası (Premium) ve destekçi programı.
// Hepsi oyun içi ve kurgusal verilerle çalışır; dışarıdan veri çekilmez.

// ---------- Maaş artışı talebi ----------
const PayRise = {
  // Kulübün güncel teklif seviyesi (transfer tekliflerindeki formülün aynısı)
  fair() {
    const s = Game.state, p = s.player, c = Game.club();
    const ovr = Player.overall(p, true);
    return Math.round(Game.wageFor(c.rating, ovr) * ((typeof LEAGUE_PAY !== 'undefined' && LEAGUE_PAY[c.league]) || 1) * (1 + Life.mgrQ() * 0.06) / 100) * 100;
  },
  // Kulüp büyüklüğüne göre en fazla artış oranı
  cap(c) { return c.rating >= 80 ? 0.4 : c.rating >= 72 ? 0.2 : U.clamp(0.05 + (c.rating - 55) * 0.004, 0.05, 0.12); },
  strong(ss, pos) {
    if (ss.apps < 8) return false;
    const avg = ss.ratingSum / ss.apps, ga = ss.goals + ss.assists;
    if (avg >= 7) return true;
    if (pos === 'FW') return ga >= ss.apps * 0.6;
    if (pos === 'AM' || pos === 'MF' || pos === 'W') return ga >= ss.apps * 0.4;
    return (ss.cs || 0) >= ss.apps * 0.4 && avg >= 6.7;
  },
  // Açılmıyorsa sebebi, açılıyorsa null
  why() {
    const s = Game.state, p = s.player, c = s.contract;
    if (Game.inStreet() || Game.isYouth() || !c || c.type !== 'pro') return 'Maaş artışı profesyonel sözleşmeyle istenebilir.';
    if (s.payReq && s.payReq.y === s.season.year) return s.payReq.ok ? 'Bu sezon maaşın zaten arttı.' : 'Bu sezon yönetim talebini reddetti. Gelecek sezon tekrar dene.';
    const R = Game.rounds();
    if (s.season.round < Math.ceil(R / 3)) return `Sezonun ilk üçte biri bitmeden istenemez (${Math.ceil(R / 3)}. haftadan sonra).`;
    if (c.since) {
      const gone = (s.season.year - c.since.y) * R + s.season.round - c.since.r;
      if (gone < R / 2) return 'Yeni sözleşme imzaladın. İlk yarım sezon dolmadan istenemez.';
    }
    if (!PayRise.strong(s.season.stats, p.position)) return 'Önce performansını göster: en az 8 maçta ortalama 7,0 reyting ya da mevkine göre güçlü istatistik.';
    if (c.wage > PayRise.fair() * 0.85) return 'Maaşın zaten piyasa değerine yakın.';
    return null;
  },
  open() {
    const s = Game.state, p = s.player, c = Game.club(), con = s.contract;
    const no = PayRise.why();
    const ss = s.season.stats;
    const avg = ss.apps ? (ss.ratingSum / ss.apps).toFixed(2) : '-';
    const info = `<div class="ms-grid"><div><span>Şu anki maaş</span><b>${U.money(con.wage || 0)}</b></div><div><span>Sezon reytingi</span><b>${avg}</b></div><div><span>Maç</span><b>${ss.apps}</b></div><div><span>Gol + asist</span><b>${ss.goals + ss.assists}</b></div></div>`;
    if (no) return Game.modal(`<h3>${Icon('wallet')} Maaş artışı</h3>${info}<p>${no}</p><p class="muted">Sezonda bir kez istenebilir.</p>`, [{ t: 'Tamam', cls: 'btn-big' }]);
    const fair = PayRise.fair(), gap = fair - con.wage, cap = PayRise.cap(c);
    const r100 = (x) => Math.max(100, Math.round(x / 100) * 100);
    const lo = r100(Math.min(gap * 0.5, con.wage * cap * 0.6)), hi = r100(Math.min(gap * 0.9, con.wage * cap));
    const ask = (amt, high) => {
      const rel = p.rel.coach || 50;
      let ch = 0.45 + ((ss.ratingSum / ss.apps) - 6.8) * 0.3 + (rel - 50) / 200 + Life.mgrQ() * 0.05 - (high ? 0.25 : 0);
      ch = U.clamp(ch, 0.1, 0.9);
      s.payReq = { y: s.season.year, ok: false };
      if (!U.chance(ch)) {
        p.rel.coach = U.clamp(rel - (high ? 6 : 3), 0, 100);
        Game.news(`💼 ${c.name} yönetimi maaş artışı talebini reddetti.`, 'bad');
        Game.save(); Game.render();
        return Game.modal(`<h3>${Icon('wallet')} Talep reddedildi</h3><p>${c.name} yönetimi şu an maaşını artırmak istemiyor. Bu sezon tekrar istenemez.</p><p class="muted">Hocanla ilişkin biraz düştü.</p>`, [{ t: 'Tamam', cls: 'btn-big' }]);
      }
      const done = (w, ext) => {
        con.wage += w;
        if (ext) con.years += 1;
        s.payReq.ok = true;
        Game.news(ext ? `💼 ${c.name} maaşını artırdı: haftalık ${U.money(con.wage)} (+${U.money(w)}). Sözleşmen 1 yıl uzadı.` : `💼 ${c.name} maaşını artırdı: haftalık ${U.money(con.wage)} (+${U.money(w)}).`, 'good');
        Game.toast(`Maaşın arttı: +${U.money(w)}/hafta`, 'good');
        Game.save(); Game.render();
      };
      // Kulüp bazen karşılığında sözleşme uzatması ister
      if (con.years <= 3 && U.chance(0.4)) {
        const part = r100(amt * 0.6);
        return Game.modal(`<h3>${Icon('contract')} Kulübün şartı var</h3><p>${c.name} haftalık +${U.money(amt)} artışa razı, karşılığında sözleşmeni 1 yıl uzatmak istiyor.</p><p class="muted">Uzatmayı kabul etmezsen artış +${U.money(part)} olur.</p>`, [
          { t: `Uzatmadan · +${U.money(part)}`, cls: 'btn-ghost', fn: () => done(part, false) },
          { t: 'Kabul et', cls: 'btn-big', fn: () => done(amt, true) },
        ]);
      }
      done(amt, false);
    };
    Game.modal(`<h3>${Icon('wallet')} Maaş artışı iste</h3>${info}
      <p>Bu performansla kulübün sana haftalık ${U.money(fair)} civarı ödeyebilir. Yönetimle görüşmeye hazırsın.</p>
      <p class="muted">Fazla istersen reddedilme ihtimali artar. Reddedilirse bu sezon tekrar istenemez ve hocanla ilişkin düşer.</p>`, [
      { t: 'Vazgeç', cls: 'btn-ghost' },
      { t: `Makul · +${U.money(lo)}`, cls: 'btn-ghost', fn: () => ask(lo, false) },
      { t: `Yüksek · +${U.money(hi)}`, cls: 'btn-big', fn: () => ask(hi, true) },
    ]);
  },
};

// ---------- Transfer ve sözleşme tekliflerinde maaş pazarlığı (teklif başına bir kez) ----------
const Nego = {
  list(ctx) { const s = Game.state; return ctx === 'end' ? (s.seasonEnd && s.seasonEnd.offers) || [] : s.offers || []; },
  btn(o, i, ctx) {
    if (o.neg === 'ok') return '<small class="nego-done good">Pazarlık kabul edildi</small>';
    if (o.neg === 'no') return '<small class="nego-done">Kulüp son teklifinde ısrarcı</small>';
    return `<button class="btn btn-ghost nego-btn" data-nego="${i}" data-ctx="${ctx}">${Icon('wallet')} Maaş için pazarlık et</button>`;
  },
  back(ctx) { if (ctx === 'end' && typeof SeasonEnd !== 'undefined') SeasonEnd.show(); else Game.render(); },
  open(i, ctx) {
    const o = Nego.list(ctx)[i];
    if (!o || o.neg) return;
    const c = Game.club(o.clubId), p = Game.p;
    const r100 = (x) => Math.round(x / 100) * 100;
    const ask = (pct) => {
      // oyuncu kulübe göre ne kadar iyiyse ve ünlüyse o kadar pazarlık gücü var
      const lev = (Player.overall(p, true) - c.rating) / 20 + (p.fame || 0) / 250 + Life.mgrQ() * 0.05;
      const ch = U.clamp((pct === 10 ? 0.62 : 0.36) + lev, 0.12, 0.9);
      if (U.chance(ch)) {
        const add = r100(o.wage * pct / 100);
        o.wage += add; o.neg = 'ok';
        Game.toast(`${c.name} kabul etti: haftalık +${U.money(add)}`, 'good');
      } else if (pct === 20 && U.chance(0.25) && !o.own) {
        const L = Nego.list(ctx), k = L.indexOf(o);
        if (k >= 0) L.splice(k, 1);
        Game.toast(`${c.name} masadan kalktı, teklifini geri çekti.`, 'bad');
      } else {
        o.neg = 'no';
        Game.toast(`${c.name} teklifinde ısrarcı. İstersen ilk teklifi kabul edebilirsin.`, 'info');
      }
      Game.save();
      setTimeout(() => Nego.back(ctx), 60);
    };
    Game.modal(`<h3>${Icon('wallet')} Maaş pazarlığı</h3><p>${c.name} sana haftalık ${U.money(o.wage)} teklif ediyor. Ne kadar istiyorsun?</p>
      <p class="muted">Her teklifte yalnız bir kez pazarlık yapabilirsin. Fazla istersen kulüp masadan kalkabilir.</p>`, [
      { t: 'Vazgeç', cls: 'btn-ghost', fn: () => setTimeout(() => Nego.back(ctx), 60) },
      { t: `+%10 · ${U.money(r100(o.wage * 1.1))}`, cls: 'btn-ghost', fn: () => ask(10) },
      { t: `+%20 · ${U.money(r100(o.wage * 1.2))}`, cls: 'btn-big', fn: () => ask(20) },
    ]);
  },
};

// ---------- StarDeğer: piyasa değeri sayfası ----------
const Market = {
  // Diğer oyuncuların değeri (oyuncununkiyle aynı formül, ün yerine yıldız çarpanı)
  npc(r, age, star) {
    const af = age <= 21 ? 1.4 : age <= 24 ? 1.2 : age <= 28 ? 1 : age <= 30 ? 0.7 : age <= 32 ? 0.45 : 0.25;
    return Math.round((900000 * Math.exp((r - 65) / 6.5) * af * (star ? 1.25 : 1)) / 50000) * 50000;
  },
  // Her maçtan sonra değer kaydı: [yıl, hafta, değer/1000]
  track(sum) {
    const s = Game.state, p = s && s.player;
    if (!p || Game.inStreet()) return;
    const v = Math.round(Game.marketValue(p) / 1000);
    p.mv = p.mv || [];
    const last = p.mv[p.mv.length - 1];
    if (last && last[0] === s.season.year && last[1] === s.season.round) last[2] = v;
    else p.mv.push([s.season.year, s.season.round, v]);
    // uzun kariyerlerde eski kayıtlar seyreltilir
    if (p.mv.length > 400) p.mv = p.mv.filter((x, i) => i % 2 === 0 || i > p.mv.length - 100);
    if (sum && sum.goals >= 3) Market.mark('Hat-trick');
    if (sum && sum.played && sum.ga === 0 && (p.position === 'GK' || p.position === 'DF')) s.season.stats.cs = (s.season.stats.cs || 0) + 1;
  },
  // Grafikteki olaylar (transfer, kupa, hat-trick)
  mark(t) {
    const s = Game.state, p = s.player;
    p.mvEv = p.mvEv || [];
    p.mvEv.push([s.season.year, s.season.round, t]);
    if (p.mvEv.length > 60) p.mvEv.shift();
  },
  now() { return Game.marketValue(Game.p); },
  delta() {
    const mv = Game.p.mv || [];
    if (mv.length < 2) return 0;
    return (mv[mv.length - 1][2] - mv[mv.length - 2][2]) * 1000;
  },
  arrow(d) { return d > 0 ? `<b class="mv-up">▲ ${U.money(d)}</b>` : d < 0 ? `<b class="mv-dn">▼ ${U.money(-d)}</b>` : '<b class="muted">=</b>'; },
  // Tüm dünyadaki oyuncular (kendisi dahil)
  everyone() {
    const s = Game.state, p = s.player, out = [];
    Object.values(s.world.clubs).forEach((c) => (c.roster || []).forEach((pl) => out.push({ n: pl.n, club: c.name, cid: c.id, lg: c.league, pos: pl.pos, age: pl.age || 26, v: Market.npc(pl.r, pl.age || 26, pl.star) })));
    if (!Game.inStreet() && !Game.isYouth()) {
      const me = out.find((x) => x.n === Player.fullName(p));
      if (me) out.splice(out.indexOf(me), 1);
      out.push({ n: Player.fullName(p), club: Game.club().name, cid: s.clubId, lg: Game.club().league, pos: p.position, age: p.age, v: Market.now(), me: true });
    }
    return out.sort((a, b) => b.v - a.v);
  },
  // Kurgusal sözleşme süresi (isimden sabit)
  yearsLeft(n) { let h = Game.state.season.year; for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0; return h % 5; },

  chart(p) {
    const mv = p.mv || [];
    if (mv.length < 2) return '<p class="muted">Grafik birkaç maç sonra oluşur.</p>';
    const W = 340, H = 150, max = Math.max(...mv.map((x) => x[2])) || 1;
    const X = (i) => 6 + (i / (mv.length - 1)) * (W - 12), Y = (v) => H - 18 - (v / max) * (H - 34);
    const pts = mv.map((x, i) => `${X(i).toFixed(1)},${Y(x[2]).toFixed(1)}`).join(' ');
    const idx = (y, r) => { let k = mv.findIndex((x) => x[0] > y || (x[0] === y && x[1] >= r)); return k < 0 ? mv.length - 1 : k; };
    const ev = (p.mvEv || []).map(([y, r, t]) => ({ i: idx(y, r), t }));
    const years = [...new Set(mv.map((x) => x[0]))];
    const step = Math.ceil(years.length / 6);
    return `<svg class="mv-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Piyasa değeri grafiği">
      <defs><linearGradient id="mvg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcf3f" stop-opacity=".45"/><stop offset="1" stop-color="#ffcf3f" stop-opacity="0"/></linearGradient></defs>
      <polygon points="${X(0)},${H - 18} ${pts} ${X(mv.length - 1)},${H - 18}" fill="url(#mvg)"/>
      <polyline points="${pts}" fill="none" stroke="#ffcf3f" stroke-width="2.2" stroke-linejoin="round"/>
      ${ev.map((e) => `<circle cx="${X(e.i).toFixed(1)}" cy="${Y(mv[e.i][2]).toFixed(1)}" r="3.6" fill="#3d8bff" stroke="#fff" stroke-width="1.2"><title>${U.esc(e.t)}</title></circle>`).join('')}
      ${years.filter((_, i) => i % step === 0).map((y) => `<text x="${X(idx(y, 0)).toFixed(1)}" y="${H - 4}" fill="#9fb0d8" font-size="10">${y}</text>`).join('')}
      <text x="${W - 6}" y="12" text-anchor="end" fill="#eef2ff" font-size="11">${U.esc(U.money(max * 1000))}</text>
    </svg>`;
  },
  // En yüksek üç değer ve o sezonun olayı
  peaks(p) {
    const mv = p.mv || [], ev = p.mvEv || [];
    const best = {};
    mv.forEach((x) => { if (!best[x[0]] || x[2] > best[x[0]][2]) best[x[0]] = x; });
    return Object.values(best).sort((a, b) => b[2] - a[2]).slice(0, 3).map((x) => {
      const e = ev.filter((q) => q[0] === x[0]).map((q) => q[2]);
      const tro = (p.trophies || []).filter((t) => +U.plain(t).split(':')[0] === x[0]).map((t) => U.plain(t).split(':').slice(1).join(':').trim());
      const why = [...new Set(tro.concat(e))].slice(0, 2).join(' · ');
      return `<li><b>${x[0]} · ${U.money(x[2] * 1000)}</b>${why ? `<small>${U.esc(why)}</small>` : ''}</li>`;
    }).join('');
  },
  row(x, i) { return `<div class="mv-row ${x.me ? 'me' : ''}"><i>${i + 1}</i><span><b>${U.esc(x.n)}</b><small>${U.esc(x.club)} · ${x.pos} · ${x.age}</small></span><b>${U.money(x.v)}</b></div>`; },

  open(tab) {
    const s = Game.state, p = s.player;
    if (Game.inStreet() || (Game.isYouth() && !Market.now())) return Game.toast('StarDeğer profesyonel kariyerde açılır.', 'info');
    const full = typeof Star === 'undefined' || Star.has();
    let taste = false;
    if (!full && tab) {
      const g = Star.gate('value', 'StarDeğer');
      if (!g) return;
      taste = g === 'taste';
    }
    const d = Market.delta();
    const head = `<div class="mv-head"><span><small>Piyasa değerin</small><b>${U.money(Market.now())}</b></span><span><small>Son maçtan beri</small>${Market.arrow(d)}</span></div>`;
    if (!full && !taste) {
      return Game.modal(`<div class="mv">${Market.brand()}${head}
        <ul class="prem-l star-perks"><li><b>Kariyer grafiği</b><small>Değerinin zirveleri ve sebepleri</small></li><li><b>Dünya listeleri</b><small>En değerli 100, rekor transferler</small></li><li><b>Kadro değeri, söylentiler, karşılaştırmalar</b><small>Aynı yaştaki en iyiler ve efsaneler</small></li></ul></div>`,
      [{ t: 'Kapat', cls: 'btn-ghost' }, { t: Star.free('value') ? 'Bir kez ücretsiz dene' : `${Icon('star')} Premium ile aç`, cls: 'btn-big', fn: () => setTimeout(() => Market.open('val'), 60) }], { wide: true });
    }
    tab = tab || 'val';
    const all = Market.everyone();
    const c = Game.isYouth() ? null : Game.club();
    const tabs = [['val', 'Değerim'], ['top', 'Dünya'], ['club', 'Kulüp'], ['buzz', 'Söylenti'], ['cmp', 'Kıyasla']];
    let body = '';
    if (tab === 'val') {
      const tr = (p.transfers || []).slice().reverse();
      body = `${Market.chart(p)}
        <div class="lbl">Zirveler</div><ul class="mv-peaks">${Market.peaks(p) || '<li class="muted">Henüz yok</li>'}</ul>
        <div class="lbl">Transfer geçmişi</div>
        ${tr.length ? tr.map((x) => `<div class="mv-row"><i>${x.y}</i><span><b>${U.esc(x.to)}</b><small>${U.esc(x.from || '')}</small></span><b>${x.type === 'free' ? 'Serbest' : x.type === 'loan' ? 'Kiralık' : x.type === 'youth' ? 'Altyapı' : U.money(x.fee || 0)}</b></div>`).join('') : '<p class="muted">Henüz transfer yok.</p>'}
        <button class="btn btn-ghost" data-mv="share">${Icon('share')} StarFeed'de paylaş</button>`;
    } else if (tab === 'top') {
      const myRank = all.findIndex((x) => x.me);
      body = `${myRank >= 0 ? `<p>Dünya sıralamandaki yerin: <b>${myRank + 1}.</b></p>` : ''}<div class="lbl">En değerli 100</div>${all.slice(0, 100).map(Market.row).join('')}
        ${(p.transfers || []).some((x) => x.fee) ? `<div class="lbl">Kariyer rekorun</div>${(p.transfers || []).filter((x) => x.fee).sort((a, b) => b.fee - a.fee).slice(0, 3).map((x, i) => `<div class="mv-row me"><i>${i + 1}</i><span><b>${U.esc(Player.fullName(p))}</b><small>${U.esc(x.from || '')} → ${U.esc(x.to)} · ${x.y}</small></span><b>${U.money(x.fee)}</b></div>`).join('')}` : ''}`;
    } else if (tab === 'club') {
      if (!c) body = '<p class="muted">Profesyonel sözleşmeyle açılır.</p>';
      else {
        const sq = {};
        all.forEach((x) => { if (x.lg === c.league) sq[x.cid] = (sq[x.cid] || 0) + x.v; });
        const ord = Object.entries(sq).sort((a, b) => b[1] - a[1]);
        const pos = ord.findIndex(([id]) => id === s.clubId) + 1;
        const mine = all.filter((x) => x.cid === s.clubId).slice(0, 11);
        const exp = all.filter((x) => x.lg === c.league && !x.me && Market.yearsLeft(x.n) === 0 && x.v >= 2e6).slice(0, 8);
        body = `<div class="mv-head"><span><small>Kadro değeri</small><b>${U.money(sq[s.clubId] || 0)}</b></span><span><small>Ligdeki sıra</small><b>${pos}.</b></span></div>
          <div class="lbl">${U.esc(c.name)} en değerliler</div>${mine.map(Market.row).join('')}
          <div class="lbl">Ligde en değerli kadrolar</div>${ord.slice(0, 5).map(([id, v], i) => `<div class="mv-row ${id === s.clubId ? 'me' : ''}"><i>${i + 1}</i><span><b>${U.esc(s.world.clubs[id].name)}</b></span><b>${U.money(v)}</b></div>`).join('')}
          <div class="lbl">Sözleşmesi bu sezon bitenler</div>${exp.length ? exp.map(Market.row).join('') : '<p class="muted">Yok</p>'}
          <p class="muted">Kendi sözleşmen: ${s.contract.years} yıl kaldı.</p><button class="btn btn-ghost" data-mv="pay">${Icon('wallet')} Maaş artışı iste</button>`;
      }
    } else if (tab === 'buzz') {
      const offs = (s.offers || []).filter((o) => o.clubId && s.world.clubs[o.clubId]);
      const big = Object.values(s.world.clubs).filter((x) => x.rating >= (c ? c.rating : 70) && x.id !== s.clubId);
      const seed = s.season.year * 100 + s.season.round;
      const pick = (arr, k) => arr.length ? arr[(seed * 7 + k * 13) % arr.length] : null;
      const lines = offs.map((o) => `${s.world.clubs[o.clubId].name} senin için ${o.fee ? U.money(o.fee) : 'bonservissiz'} teklifini masaya koydu. Menajerin "acelemiz yok" diyor.`);
      if (Market.delta() > 0) lines.push(`Son haftalardaki formun değerini ${U.money(Market.delta())} artırdı. Gözlemciler tribünde not alıyor.`);
      const b1 = pick(big, 1), b2 = pick(big, 2);
      if (b1) lines.push(`Kulis: ${b1.name} gelecek dönem için seni listesine yazdı.`);
      if (b2 && b2 !== b1 && p.fame >= 30) lines.push(`${b2.name} başkanının seni sorduğu konuşuluyor. Kulüpten yalanlama gelmedi.`);
      const top = all.find((x) => !x.me);
      if (top) lines.push(`${top.n} dünyanın en değerli oyuncusu: ${U.money(top.v)}. ${top.club} satmaya niyetli değil.`);
      body = `<div class="mv-buzz">${lines.map((t) => `<p>🗞️ ${U.esc(t)}</p>`).join('')}</div><p class="muted">Söylentiler oyun içi kurgudur.</p>`;
    } else if (tab === 'cmp') {
      const same = all.filter((x) => x.age === p.age && !x.me).slice(0, 5);
      const L = (s.world.legends || []).filter((x) => x.peak).map((x) => ({ n: x.n, v: Market.npc(legendRating(x.peak, p.age), p.age, true) })).sort((a, b) => b.v - a.v).slice(0, 5);
      body = `<div class="lbl">${p.age} yaşındaki en değerliler</div>${same.map(Market.row).join('') || '<p class="muted">Yok</p>'}
        <div class="lbl">Efsaneler ${p.age} yaşındayken</div>${L.map((x, i) => `<div class="mv-row"><i>${i + 1}</i><span><b>${U.esc(x.n)}</b><small>Efsane</small></span><b>${U.money(x.v)}</b></div>`).join('') || '<p class="muted">Yok</p>'}
        <p>Sen: <b>${U.money(Market.now())}</b></p>`;
    }
    const m = Game.modal(`<div class="mv">${Market.brand()}${head}
      <div class="seg mv-tabs">${tabs.map(([k, l]) => `<button data-mvtab="${k}" class="${k === tab ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div class="mv-body">${body}</div></div>`, [{ t: 'Kapat', cls: 'btn-ghost' }], { wide: true });
    Market._tab = tab; Market._taste = taste;
    return m;
  },
  brand() { return '<div class="mv-brand"><span>Star</span>Değer</div>'; },
  share() {
    const s = Game.state, p = s.player;
    if (s.mvShare === `${s.season.year}-${s.season.round}`) return Game.toast('Bu hafta zaten paylaştın.', 'info');
    s.mvShare = `${s.season.year}-${s.season.round}`;
    Social.post('motm', `Piyasa değerim ${U.money(Market.now())} oldu. Daha yolun başındayız!`, 1.2);
    Game.save(); Game.render();
    Game.toast("StarFeed'de paylaştın.", 'good');
  },
};

// ---------- Destekçi programı (tekrar alınabilir destek paketleri, yalnız kozmetik) ----------
const SUPPORT = {
  s: { id: 'starfoot_sup_100', pts: 100 },
  m: { id: 'starfoot_sup_550', pts: 550 },
  l: { id: 'starfoot_sup_2400', pts: 2400 },
};
const SUP_RANKS = [
  { k: 'bronze', n: 'Bronz', p: 100, c: '#cd7f32', r: 'Destekçi rozeti' },
  { k: 'silver', n: 'Gümüş', p: 500, c: '#c0c8d8', r: 'Gümüş kart çerçevesi' },
  { k: 'gold', n: 'Altın', p: 2000, c: '#ffcf3f', r: 'StarFeed profilinde altın unvan' },
  { k: 'plat', n: 'Platin', p: 5000, c: '#9fe6ff', r: "Starpedia'da Kurucu Destekçi bölümü" },
  { k: 'legend', n: 'Efsane', p: 10000, c: '#ff8ad8', r: 'Haberlerde Efsane Destekçi unvanı' },
];
const Support = {
  KEY: 'starfoot_vip',
  price: {},
  get() { try { const v = JSON.parse(localStorage.getItem(Support.KEY) || 'null'); if (v && typeof v.p === 'number') return v; } catch (e) { /* yok */ } return { p: 0, tx: [] }; },
  put(v) {
    try { localStorage.setItem(Support.KEY, JSON.stringify(v)); } catch (e) { /* yok */ }
    const F = typeof SaveBak !== 'undefined' && SaveBak.fs();
    if (F) F.writeFile({ path: 'saves/vip.txt', data: JSON.stringify(v), directory: SaveBak.DIR, encoding: 'utf8', recursive: true }).catch(() => {});
  },
  pts() { return Support.get().p; },
  rank(p) { p = p == null ? Support.pts() : p; let r = null; SUP_RANKS.forEach((x) => { if (p >= x.p) r = x; }); return r; },
  next(p) { p = p == null ? Support.pts() : p; return SUP_RANKS.find((x) => p < x.p) || null; },
  has(k) { const r = Support.rank(); return !!r && SUP_RANKS.indexOf(r) >= SUP_RANKS.findIndex((x) => x.k === k); },
  // Açılışta: dosya yedeğinden ve mağaza kayıtlarından puanları geri getir (aynı işlem iki kez sayılmaz)
  async restore() {
    let v = Support.get();
    const F = typeof SaveBak !== 'undefined' && SaveBak.fs();
    if (F) {
      try { const r = await F.readFile({ path: 'saves/vip.txt', directory: SaveBak.DIR, encoding: 'utf8' }); const b = JSON.parse(r.data); if (b && b.p > v.p) v = b; } catch (e) { /* yok */ }
    }
    try {
      const info = typeof RCStore !== 'undefined' && RCStore.info;
      ((info && info.nonSubscriptionTransactions) || []).forEach((t) => Support.add(v, t.productIdentifier, t.transactionIdentifier));
    } catch (e) { /* yok */ }
    Support.put(v);
  },
  add(v, pid, tid) {
    const x = Object.values(SUPPORT).find((q) => q.id === pid);
    if (!x) return false;
    v.tx = v.tx || [];
    if (tid && v.tx.includes(String(tid))) return false;
    if (tid) v.tx.push(String(tid));
    if (v.tx.length > 300) v.tx = v.tx.slice(-300);
    v.p += x.pts;
    return true;
  },
  async load() {
    const P = Premium.plugin();
    if (!P) return;
    try {
      const r = await P.getProducts({ productIdentifiers: Object.values(SUPPORT).map((x) => x.id), productType: 'inapp' });
      (r && r.products || []).forEach((pr) => { const k = Object.keys(SUPPORT).find((q) => SUPPORT[q].id === pr.identifier); if (k) Support.price[k] = { s: pr.priceString, n: Number(pr.price) || 0, c: pr.currencyCode || '' }; });
    } catch (e) { /* yok */ }
  },
  async buy(k) {
    const P = Premium.plugin(), x = SUPPORT[k];
    if (!P || Premium.busy) return;
    Premium.busy = true;
    try {
      Premium.track('tip_tap', { item_id: x.id });
      const t = await P.purchaseProduct({ productIdentifier: x.id, productType: 'inapp', quantity: 1 });
      if (t) {
        const v = Support.get(), before = Support.rank(v.p);
        Support.add(v, x.id, t.transactionId || ('l' + Date.now()));
        Support.put(v);
        const pr = Support.price[k] || {};
        const m = { item_id: x.id, item_name: 'StarFoot Support' };
        if (pr.n) m.value = pr.n;
        if (pr.c) m.currency = pr.c;
        if (t.transactionId) m.transaction_id = String(t.transactionId);
        Premium.track('tip_purchase', m);
        Premium.track('purchase', m);
        const after = Support.rank(v.p);
        Premium.busy = false;
        Support.thanks(x.pts, after && after !== before ? after : null);
        return;
      }
    } catch (e) {
      const msg = String((e && (e.message || e.code)) || e);
      if (!/cancel/i.test(msg)) { Premium.track('premium_fail', { reason: msg.slice(0, 90), item_id: x.id }); Game.toast('Satın alma tamamlanamadı. Biraz sonra tekrar dene.', 'bad'); }
    }
    Premium.busy = false;
  },
  thanks(pts, up) {
    if (typeof Celebrate !== 'undefined' && up) {
      try { Celebrate.trophy({ big: `${up.n.toLocaleUpperCase('tr')} DESTEKÇİ`, title: '', sub: '', c1: '#0d1f4f', c2: up.c, short: 'SF', kit: Sprites.kit(Game.club() || { c1: '#0d1f4f', c2: up.c }, false), number: Game.p ? Game.p.shirt : 10 }); } catch (e) { /* yok */ }
    }
    if (up && up.k === 'legend' && Game.state) { Game.news(`🌟 ${Player.fullName(Game.p)} artık bir Efsane Destekçi!`, 'good'); Game.save(); }
    Game.toast(up ? `Teşekkürler! +${pts} destek puanı. ${up.n} rütbesi açıldı!` : `Teşekkürler! +${pts} destek puanı`, 'good');
    if (Game.state) Game.render();
  },
  badge() {
    const r = Support.rank();
    return r ? `<span class="sup-badge" style="--sc:${r.c}" title="${U.esc(r.n)} destekçi">◆</span>` : '';
  },
  title() {
    if (Support.has('legend')) return 'Efsane Destekçi';
    if (Support.has('gold')) return `${Support.rank().n} Destekçi`;
    return '';
  },
  // Ayarlardaki satır
  row() {
    if (typeof Premium === 'undefined' || !Premium.available()) return '';
    const r = Support.rank();
    return `<div class="set-row"><span><b>Geliştiriciyi destekle</b><small>${r ? `${r.n} destekçi · ${Support.pts()} puan` : 'İsteğe bağlı. Yalnız rozet ve görünüm; oyunda avantaj vermez.'}</small></span><button class="btn btn-ghost" data-sup>${Icon('heart')} Aç</button></div>`;
  },
  open() {
    const p = Support.pts(), r = Support.rank(p), nx = Support.next(p);
    const can = typeof Premium !== 'undefined' && Premium.available();
    const pct = nx ? Math.round(((p - (r ? r.p : 0)) / (nx.p - (r ? r.p : 0))) * 100) : 100;
    const btns = [{ t: 'Kapat', cls: 'btn-ghost' }];
    if (can) Object.entries(SUPPORT).forEach(([k, x]) => btns.push({ t: `+${x.pts} puan${Support.price[k] ? ` · ${U.esc(Support.price[k].s)}` : ''}`, cls: k === 'm' ? 'btn-big' : 'btn-ghost', fn: () => Support.buy(k) }));
    Game.modal(`<div class="ev-tag">StarFoot destekçileri</div><h2>${Icon('heart')} Geliştiriciyi destekle</h2>
      <p>StarFoot'u sevdiysen geliştirmeye devam etmemize destek olabilirsin. Her destek puan kazandırır, puanlarla rütben yükselir.</p>
      <div class="sup-bar"><span>${r ? `<b style="color:${r.c}">${r.n}</b>` : '<b>Henüz rütbe yok</b>'} · ${p} puan</span>${nx ? `<small>${nx.n} rütbesine ${nx.p - p} puan kaldı</small>` : '<small>En yüksek rütbedesin!</small>'}<i><em style="width:${pct}%"></em></i></div>
      <ul class="sup-ranks">${SUP_RANKS.map((x) => `<li class="${p >= x.p ? 'on' : ''}"><b style="color:${x.c}">◆ ${x.n}</b><small>${x.p} puan · ${x.r}</small></li>`).join('')}</ul>
      <p class="muted">Ödüller yalnız görünüş içindir, oyunda avantaj sağlamaz. Puanlar bu cihazda saklanır ve yedeklenir.</p>`, btns, { wide: true });
    if (can && !Object.keys(Support.price).length) Support.load();
  },
};

document.addEventListener('click', (e) => {
  const b = e.target.closest && e.target.closest('[data-sup],[data-payrise],[data-mvopen],[data-mvtab],[data-mv],[data-nego]');
  if (!b || !Game.state) return;
  const close = () => { const m = document.getElementById('modal'); m.classList.add('hidden'); m.innerHTML = ''; };
  if (b.dataset.mvtab) {
    close();
    if (Market._taste && b.dataset.mvtab !== Market._tab) return setTimeout(() => Star.pitch('StarDeğer', 'value'), 60);
    return setTimeout(() => Market.open(b.dataset.mvtab), 30);
  }
  if (b.dataset.nego != null) return Nego.open(+b.dataset.nego, b.dataset.ctx);
  if (b.dataset.mv === 'share') { close(); return Market.share(); }
  if (b.dataset.mv === 'pay') { close(); return setTimeout(() => PayRise.open(), 30); }
  if (b.hasAttribute('data-sup')) { if (typeof SetSheet !== 'undefined' && document.body.classList.contains('ss-on')) SetSheet.close(); Support.open(); }
  else if (b.hasAttribute('data-payrise')) PayRise.open();
  else if (b.hasAttribute('data-mvopen')) Market.open();
});
setTimeout(() => { Support.restore(); }, 2500);
