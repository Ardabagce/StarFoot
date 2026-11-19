// Teknik Direktör — canlı maç: küçük saha (radar), dakika dakika akış, kritik anları oyuncu oynar,
// taktik/oyuncu değişikliği, devre arası, maç istatistikleri, oyuncu puanları, maçın oyuncusu,
// maç sonu takım konuşması ve basın toplantısı.

const Live = {
  m: null,
  SPEEDS: [900, 450, 180, 60], // dakika başına ms (1x yavaş, izlenebilir)
  start(match, quick) {
    const s = Coach.s;
    const opp = Coach.oppTeam(match.opp);
    const me = Coach.my(), oc = Coach.club(match.opp);
    const on = Coach.xiPlayers().map((p) => p.id);
    const b = s.boost || {};
    Live.m = {
      match, opp, min: 0, gf: 0, ga: 0, on, bench: s.squad.filter((p) => !on.includes(p.id) && Coach.available(p)).map((p) => p.id),
      subs: 5, style: s.style, feed: [], red: 0, oppRed: 0, speed: 1, paused: false, ht: false, done: false, me, oc, rates: {}, mins: {},
      mods: { att: b.att || 0, def: b.def || 0 }, set: b.set || 0, keyN: 0, scorers: [], yel: {}, quick: !!quick,
      st: { sh: [0, 0], ot: [0, 0], pos: [6, 6], cor: [0, 0], yel: [0, 0], fo: [0, 0] },
    };
    on.forEach((id) => { Live.m.rates[id] = 6.4; Live.m.mins[id] = 0; });
    if (quick) { Live.sim(); return Live.finish(); }
    Live.draw();
    Live.log(`Maç başladı! ${CM_STYLES[Live.m.style].t} oyunla başlıyoruz.`, 'info');
    Live.loop();
  },
  P(id) { return Coach.P(id); },
  onField() { return Live.m.on.map(Live.P).filter(Boolean); },
  str() { const L = Live.m, s = Coach.s; return Coach.strength(Live.onField(), s.form, L.style, L.mods); },
  lambdas() {
    const L = Live.m;
    const st = Live.str();
    // rakip de yorulur (kendi değişikliklerini yapar, daha az düşer)
    const oT = (L.min / 90) * 2;
    // rakibin anlık gücü: kondisyonu, değişiklikleri ve kimyası (coach6), yoksa basit yorgunluk
    const on = Live.oppNow ? Live.oppNow() : { att: L.opp.att - oT, def: L.opp.def - oT };
    const oppAtt = on.att - L.oppRed * 4, oppDef = on.def - L.oppRed * 4;
    if (L.style === 'counter' && L.opp.style === 'att') st.att += CM_STYLES.counter.vsAtt;
    const h = L.match.home ? 1 : -1;
    const lf = 1.3 * Math.exp((st.att - oppDef + h * 1.5) / 28), la = 1.3 * Math.exp((oppAtt - st.def - h * 1.5) / 28);
    return [lf / 90, la / 90, st];
  },
  // oyuncu adı pozisyonuyla
  nm(p) { return `${Coach.pa(p.pos)} ${p.n}`; },
  ourSide() { return Live.m.match.home ? 'H' : 'A'; },
  oppSide() { return Live.m.match.home ? 'A' : 'H'; },

  // bir dakika: olay olursa Promise döner (kritik an)
  tick() {
    const L = Live.m, s = Coach.s;
    L.min++;
    const [pf, pa, st] = Live.lambdas();
    const tire = CM_STYLES[L.style].tire;
    // yorgunluk: 90 dakikada yaklaşık 30 puan (yaşlılar ve önde baskı daha çok yorulur), değişiklik gerektirir
    Live.onField().forEach((p) => { p.fit = Math.max(5, p.fit - 0.45 * tire * (p.age > 31 ? 1.25 : p.age <= 21 ? 0.85 : 1)); L.mins[p.id] = (L.mins[p.id] || 0) + 1; });
    // topa sahip olma
    const share = U.clamp(0.5 + (st.att + st.def - L.opp.att - L.opp.def) / 90 + (L.style === 'press' ? 0.04 : L.style === 'counter' || L.style === 'def' ? -0.05 : 0), 0.28, 0.72);
    if (U.chance(share)) L.st.pos[0]++; else L.st.pos[1]++;
    if (L.R) L.R.minute(L.match.home ? st.att : L.opp.att, L.match.home ? L.opp.att : st.att, false);
    if (L.min === 60 && L.ga < L.gf) { L.opp.att += 2; L.opp.def -= 2; Live.log('Rakip skoru değiştirmek için öne çıkıyor.', 'info'); }
    // bizim penaltı
    if (U.chance(0.0026)) { L.st.sh[0]++; return Live.penalty(true); }
    if (U.chance(0.0022)) { L.st.sh[1]++; return Live.penalty(false); }
    // bizim şut
    if (U.chance(pf * 2.6)) {
      L.st.sh[0]++;
      const sc = Live.pickScorer();
      if (s.keyMom !== false && !L.quick && !L.auto && L.keyN < 2 && L.min > 4 && U.chance(0.32)) {
        L.keyN++;
        const r = Math.random(); // frikik daha seyrek: %15 frikik, %35 karşı karşıya, %50 gol fırsatı
        return Live.keyMoment(sc, r < 0.15 ? 'freekick' : r < 0.5 ? 'close' : 'open');
      }
      if (U.chance(1 / 2.6)) Live.goal(sc);
      else Live.miss(sc);
    } else if (U.chance(0.012)) L.st.cor[0]++;
    // rakip şut
    if (U.chance(pa * 2.6)) {
      L.st.sh[1]++;
      if (U.chance(1 / 2.6)) Live.conceded();
      else Live.saveOrMiss();
    } else if (U.chance(0.012)) L.st.cor[1]++;
    // kartlar
    if (U.chance(0.02 * (L.style === 'press' ? 1.3 : 1))) Live.card();
    if (U.chance(0.018)) { L.st.yel[1]++; if (U.chance(0.04)) { L.oppRed++; Live.log('Rakipten bir oyuncu kırmızı kart gördü!', 'good'); } }
    // sakatlık
    if (U.chance(0.0007 * (1 - 0.1 * (s.fac.medical - 1)))) {
      const p = U.pick(Live.onField());
      if (p) { p.inj = Math.max(1, Math.round(U.randi(1, 4) * (1 - 0.1 * (s.fac.medical - 1)))); Live.log(`🤕 ${Live.nm(p)} sakatlandı (${p.inj} hafta).`, 'bad'); L.injured = p.id; }
    }
    return null;
  },
  goal(sc, as) {
    const L = Live.m;
    L.gf++; L.st.ot[0]++;
    as = as === undefined ? (U.chance(0.75) ? Live.pickAssist(sc) : null) : as;
    sc.g++; L.rates[sc.id] = (L.rates[sc.id] || 6.4) + 1; L.scorers.push(sc.n);
    if (as) { as.a++; L.rates[as.id] = (L.rates[as.id] || 6.4) + 0.6; }
    Live.log(as ? `GOL! ${Live.nm(sc)} (asist: ${as.n})` : `GOL! ${Live.nm(sc)}`, 'gf');
    if (L.R) L.R.goal(Live.ourSide());
    if (typeof Sfx !== 'undefined') try { Sfx.play('net'); } catch (e) { /* yok */ }
  },
  miss(sc) {
    const L = Live.m;
    const on = U.chance(0.45);
    if (on) { L.st.ot[0]++; L.rates[sc.id] = (L.rates[sc.id] || 6.4) + 0.1; }
    Live.log(on ? `${Live.nm(sc)} şut çekti, kaleci kurtardı.` : `${Live.nm(sc)} şut çekti, top auta gitti.`, '');
    if (L.R) L.R.chance(Live.ourSide());
  },
  conceded() {
    const L = Live.m;
    L.ga++; L.st.ot[1]++;
    const star = Coach.starOf(L.match.opp);
    const who = U.chance(0.45) ? star[0] : World.genName(L.oc.pool);
    Live.log(`Gol yedik. ${who} (${L.oc.name}) skoru ${L.match.home ? `${L.gf}-${L.ga}` : `${L.ga}-${L.gf}`} yaptı.`, 'ga');
    Live.onField().filter((p) => p.pos === 'DF' || p.pos === 'GK').forEach((p) => (L.rates[p.id] = (L.rates[p.id] || 6.4) - 0.25));
    if (L.R) L.R.goal(Live.oppSide());
    if (typeof Sfx !== 'undefined') try { Sfx.play('groan'); } catch (e) { /* yok */ }
  },
  saveOrMiss() {
    const L = Live.m;
    const gk = Live.onField().find((p) => p.pos === 'GK');
    if (U.chance(0.45) && gk) { L.st.ot[1]++; L.rates[gk.id] = (L.rates[gk.id] || 6.4) + 0.3; Live.log(`${Live.nm(gk)} gole izin vermedi, harika kurtarış!`, 'good'); }
    else Live.log(`${L.oc.name} pozisyona girdi, top az farkla dışarıda.`, '');
    if (L.R) L.R.chance(Live.oppSide());
  },
  card() {
    const L = Live.m;
    const p = U.pick(Live.onField().filter((x) => x.pos !== 'GK'));
    if (!p) return;
    L.st.yel[0]++; L.st.fo[0]++;
    L.yel[p.id] = (L.yel[p.id] || 0) + 1;
    p.yel = (p.yel || 0) + 1;
    if (L.yel[p.id] >= 2 || U.chance(0.03)) {
      L.on = L.on.filter((x) => x !== p.id); L.red++; p.sus = (p.sus || 0) + 1; L.rates[p.id] = (L.rates[p.id] || 6.4) - 1.5;
      Live.log(`🟥 KIRMIZI KART! ${Live.nm(p)} oyundan atıldı.`, 'bad');
    } else {
      Live.log(`🟨 ${Live.nm(p)} sarı kart gördü.`, '');
      if (p.yel % 5 === 0) { p.sus = (p.sus || 0) + 1; Live.log(`${p.n} 5. sarı kartını gördü, sıradaki maçta cezalı.`, 'bad'); }
    }
  },
  penalty(ours) {
    const L = Live.m, s = Coach.s;
    if (!ours) {
      const gk = Live.onField().find((p) => p.pos === 'GK');
      Live.log(`${L.oc.name} penaltı kazandı!`, 'bad');
      if (U.chance(0.76 - (gk ? (gk.r - L.opp.att) / 200 : 0))) Live.conceded();
      else { L.st.ot[1]++; if (gk) L.rates[gk.id] = (L.rates[gk.id] || 6.4) + 0.8; Live.log(`${gk ? Live.nm(gk) : 'Kalecimiz'} penaltıyı kurtardı!`, 'gf'); }
      return null;
    }
    const tk = Live.onField().find((p) => p.id === s.pk) || Live.pickScorer();
    Live.log(`Penaltı kazandık! Topun başında ${Live.nm(tk)}.`, 'good');
    if (s.keyMom !== false && !L.quick && !L.auto) return Live.keyMoment(tk, 'penalty');
    if (U.chance(0.74 + (tk.r - 65) / 300 + L.set * 0.05)) Live.goal(tk, null);
    else { L.st.ot[0]++; Live.log(`${Live.nm(tk)} penaltıyı kaçırdı!`, 'bad'); }
    return null;
  },
  pickScorer() {
    const w = { FW: 5, MF: 2.4, DF: 0.6, GK: 0.02 };
    return U.weighted(Live.onField(), (p) => w[p.pos] * Math.pow(p.r / 70, 3));
  },
  pickAssist(sc) {
    const w = { FW: 2, MF: 4, DF: 1.2, GK: 0.1 };
    const pool = Live.onField().filter((p) => p !== sc);
    return pool.length ? U.weighted(pool, (p) => w[p.pos] * Math.pow(p.r / 70, 2)) : null;
  },
  log(t, cls) { if (Live.m) Live.m.feed.unshift({ m: Live.m.min, t, cls }); },

  // ---------- kritik an: topu oyuncu vurur ----------
  keyMoment(p, type) {
    const L = Live.m, s = Coach.s;
    if (type === 'freekick' && Coach.P(s.fk) && L.on.includes(s.fk)) p = Coach.P(s.fk);
    L.paused = true;
    Live.draw();
    const T = { penalty: ['PENALTI', `${p.n} penaltı noktasında`, 'Geriye çek, köşeyi seç ve bırak!'], freekick: ['FRİKİK', `${p.n} topun başında`, 'Duvarın üstünden ya da yanından kaleyi bul!'],
      close: ['KARŞI KARŞIYA', `${p.n} kaleciyle karşı karşıya`, 'Kaleciyi geç ya da köşeye yerleştir!'], open: ['GOL FIRSATI', `${p.n} ceza sahasında topla buluştu`, 'Şut çek ya da boştaki arkadaşına pas ver!'] }[type];
    return new Promise((res) => {
      Game.modal(`<div class="ev-tag">${T[0]} · ${L.min}'</div><h3>${U.esc(T[1])}!</h3><p class="muted">${Live.nm(p)} · Güç ${Coach.ovr(p)}</p>`, [
        { t: '⚡ Otomatik', cls: 'btn-ghost', fn: () => { Live.autoShot(p, type); res(); } },
        { t: '⚽ Sen oyna', cls: 'btn-big', fn: () => Live.playShot(p, type, T).then((r) => {
          if (Live.m !== L) return res(); // maç bu arada kapandıysa sonucu işleme
          if (r.goal) Live.goal(p, type === 'penalty' || type === 'freekick' ? null : undefined);
          else if (r.mate) {
            // pas verildi: arkadaşının şutu
            const mp = Live.onField().find((x) => x !== p && x.n.split(' ').slice(-1)[0] === r.mate) || Live.pickAssist(p) || p;
            if (r.mateGoal) Live.goal(mp, p);
            else { L.st.sh[0]++; if (U.chance(0.5)) L.st.ot[0]++; Live.log(`${Live.nm(p)} pas verdi, ${Live.nm(mp)} vurdu ama gol olmadı.`, ''); if (L.R) L.R.chance(Live.ourSide()); }
          } else { if (r.on) L.st.ot[0]++; Live.log(r.off ? `${Live.nm(p)} ofsayta yakalandı.` : type === 'penalty' ? `${Live.nm(p)} penaltıyı kaçırdı!` : `${Live.nm(p)} fırsatı değerlendiremedi.`, 'bad'); if (L.R) L.R.chance(Live.ourSide()); }
          res();
        }) },
      ]);
    }).then(() => { if (Live.m !== L) return; L.paused = false; Live.draw(); });
  },
  autoShot(p, type) {
    const L = Live.m;
    const base = { penalty: 0.74, freekick: 0.12, close: 0.45, open: 0.32 }[type] + (p.r - 65) / 250 + (type === 'penalty' || type === 'freekick' ? L.set * 0.05 : 0);
    if (U.chance(base)) Live.goal(p, type === 'penalty' || type === 'freekick' ? null : undefined);
    else { L.st.ot[0]++; Live.log(type === 'penalty' ? `${Live.nm(p)} penaltıyı kaçırdı!` : `${Live.nm(p)} şut çekti, kaleci kurtardı.`, ''); }
  },
  // oyuncu kariyerindeki şut sahnesi; oyuncunun gücü statlara çevrilir
  playShot(p, type, T) {
    const L = Live.m, s = Coach.s;
    return new Promise((res) => {
      const adj = { FW: 3, MF: -1, DF: -8, GK: -20 }[p.pos] || 0;
      const st = {};
      STATS.forEach((x) => (st[x.k] = U.clamp(Math.round(p.r + adj + (x.k === 'shooting' ? 2 : 0)), 20, 99)));
      const skill = U.clamp(0.34 + (L.opp.def - Live.str().att) / 60, 0.15, 0.7);
      const el = document.createElement('div');
      el.className = 'mt-moment drill cm-km';
      el.innerHTML = `<div class="mm-head"><div class="mm-min dr-tag">${T[0]}</div><div class="mm-tt"><div class="mm-title">${U.esc(T[1])}</div><div class="mm-desc">${T[2]}</div></div></div><div class="dr-host"></div>`;
      document.body.appendChild(el);
      UI.strip(el);
      // şut sahnesi bir futbolcu kariyeri bekler: geçici kimlik
      const prev = Game.state;
      Game.state = { _tmp: true, player: { name: p.n.split(' ')[0], surname: p.n.split(' ').slice(1).join(' '), look: Sprites.look(p.id), position: p.pos === 'GK' ? 'MF' : p.pos, shirt: 9, items: [], stats: st }, difficulty: 'normal' };
      let fin = false;
      const done = (r) => { if (fin) return; fin = true; Game.state = prev; el.remove(); MiniGame._abort = null; res(r); };
      try {
        const kits = Sprites.kits(L.me, L.oc, !L.match.home);
        const mates = Live.onField().filter((x) => x !== p && x.pos !== 'GK').slice(0, 3).map((x) => x.n.split(' ').slice(-1)[0]);
        const scene = Scenes.make(type, { skill, mates, position: p.pos === 'GK' ? 'MF' : p.pos, pace: st.pace, narrow: window.innerWidth / window.innerHeight < 0.9 });
        MiniGame.play(el.querySelector('.dr-host'), scene, { stats: st, skill, cond: 1.25 - 0.35 * (p.fit / 100), kits, number: 9, mateChance: () => 0.5 })
          .then((r) => {
            r = r || {};
            if (r.outcome === 'goal') return done({ goal: true });
            if (r.outcome === 'received' && r.mate) return done({ goal: false, mate: r.mate, mateGoal: !!r.mateGoal });
            if (r.outcome === 'auto') return done({ goal: U.chance(0.5) });
            done({ goal: false, on: r.outcome === 'saved' || r.outcome === 'claimed', off: r.outcome === 'offside' });
          })
          .catch(() => done({ goal: U.chance(0.4) }));
      } catch (e) { done({ goal: U.chance(0.4) }); }
    });
  },

  // ---------- akış ----------
  sim() {
    const L = Live.m;
    while (L.min < 90) {
      Live.tick();
      if (L.injured) { const p = Live.P(L.injured); L.injured = null; Live.autoSub(p); Live.injOff(p); }
      if (L.min === 70) Live.autoSubs();
    }
  },
  autoSub(out) {
    const L = Live.m;
    if (!out || L.subs <= 0 || !L.on.includes(out.id)) return;
    const b = L.bench.map(Live.P).filter((p) => p && Coach.available(p)).sort((a, c) => (c.pos === out.pos) - (a.pos === out.pos) || c.r - a.r)[0];
    if (b) Live.sub(out.id, b.id);
  },
  // değişiklik hakkı kalmadıysa sakatlanan oyuncu oyundan çıkar, takım eksik kalır
  injOff(p) {
    const L = Live.m;
    if (!p || !L.on.includes(p.id) || L.on.length <= 7) return;
    L.on = L.on.filter((x) => x !== p.id);
    Live.log(`${Live.nm(p)} devam edemedi, sahada bir kişi eksiğiz.`, 'bad');
  },
  autoSubs() { Live.onField().filter((p) => p.fit < 45 && p.pos !== 'GK').sort((a, b) => a.fit - b.fit).slice(0, 2).forEach((p) => Live.autoSub(p)); },
  sub(outId, inId) {
    const L = Live.m, o = Live.P(outId), i = Live.P(inId);
    // oyundan çıkan oyuncu aynı maçta tekrar giremez
    if (L.subs <= 0 || !L.on.includes(outId) || !L.bench.includes(inId)) return false;
    L.on = L.on.map((x) => (x === outId ? inId : x));
    L.bench = L.bench.filter((x) => x !== inId);
    L.off = (L.off || []).concat([outId]);
    L.subs--;
    L.rates[inId] = L.rates[inId] || 6.3; L.mins[inId] = L.mins[inId] || 0;
    Live.log(`🔄 Oyuncu değişikliği: ${Live.nm(i)} girdi, ${Live.nm(o)} çıktı.`, 'info');
  },
  loop() {
    const L = Live.m;
    clearTimeout(Live._t);
    if (!L || L.done || L.paused || !Coach.s) return;
    if (L.min >= 90) { Live.draw(); return Live.end(); }
    if (L.min >= 45 && !L.ht) { L.ht = true; Live.draw(); return Live.halftime(); }
    const ev = Live.tick();
    if (ev && ev.then) { Live.draw(); ev.then(() => { if (Live.m === L) Live.loop(); }); return; }
    if (L.injured) { const p = Live.P(L.injured); L.injured = null; Live.draw(); if (L.subs > 0 && L.bench.some((id) => Coach.available(Live.P(id)))) { L.paused = true; return Live.subMenu(p.id, `Sakatlık! ${Live.nm(p)} devam edemiyor. Yerine kimi alalım?`); } Live.injOff(p); }
    Live.draw();
    Live._t = setTimeout(Live.loop, Live.SPEEDS[L.speed - 1] || 900);
  },
  halftime() {
    const L = Live.m;
    L.paused = true;
    const lead = L.gf - L.ga;
    Game.modal(`<div class="ev-tag">Devre arası</div><h3>Skor ${L.gf}-${L.ga}. Soyunma odasında takıma ne diyeceksin?</h3><p class="muted">Topa sahip olma %${Live.possPct()} · Şut ${L.st.sh[0]}-${L.st.sh[1]}</p>`, [
      { t: '😌 Sakin olun, plana sadık kalın', fn: () => { L.mods.def += lead > 0 ? 1.5 : 0.5; Live.onField().forEach((p) => (p.mor = U.clamp(p.mor + 3, 0, 100))); Live.resume('Takım sakinleşti.'); } },
      { t: '🔥 Daha fazlasını istiyorum!', fn: () => { L.mods.att += lead <= 0 ? 2.5 : 1; Live.onField().forEach((p) => (p.mor = U.clamp(p.mor + 5, 0, 100))); Live.resume('Oyuncular hırslandı!'); } },
      { t: '😠 Bu oyun kabul edilemez!', fn: () => { const ok = U.chance(lead < 0 ? 0.6 : 0.35); L.mods.att += ok ? 3.5 : -1.5; L.mods.def += ok ? 1 : -1; Live.onField().forEach((p) => (p.mor = U.clamp(p.mor + (ok ? 6 : -8), 0, 100))); Live.resume(ok ? 'Sert sözler işe yaradı, takım ateşlendi!' : 'Oyuncular sert sözlerden etkilendi, moraller bozuk.'); } },
    ]);
  },
  resume(msg) { const L = Live.m; if (msg) Live.log(msg, 'info'); L.paused = false; Live.draw(); Live.loop(); },
  possPct() { const L = Live.m, t = L.st.pos[0] + L.st.pos[1]; return t ? Math.round((L.st.pos[0] / t) * 100) : 50; },
  subMenu(outId, title) {
    const L = Live.m;
    L.paused = true;
    const out = outId ? [Live.P(outId)] : Live.onField().sort((a, b) => a.fit - b.fit);
    const bench = L.bench.map(Live.P).filter((p) => p && Coach.available(p)).sort((a, b) => b.r - a.r);
    let pick = outId || null;
    const row = (p, k) => `<button class="cm-sb" data-${k}="${p.id}"><span class="cm-pos ${p.pos}">${CM_POS[p.pos]}</span><b>${U.esc(p.n)}</b><i class="cm-fit"><i style="width:${p.fit}%"></i></i><em>${Coach.ovr(p)}</em></button>`;
    const m = Game.modal(`<div class="ev-tag">Oyuncu değişikliği · ${L.subs} hak</div><h3>${title || 'Kimi çıkaralım?'}</h3>
      ${outId ? '' : `<div class="cm-sublist">${out.map((p) => row(p, 'o')).join('')}</div><div class="lbl">Yerine</div>`}
      <div class="cm-sublist">${bench.map((p) => row(p, 'i')).join('') || '<p class="muted">Yedekte uygun oyuncu yok.</p>'}</div>`,
    [{ t: outId ? '10 kişi devam et' : 'Vazgeç', cls: 'btn-ghost', fn: () => { if (outId) Live.injOff(Live.P(outId)); Live.resume(); } }], { wide: true });
    U.$$('[data-o]', m).forEach((b) => (b.onclick = () => { pick = +b.dataset.o; U.$$('[data-o]', m).forEach((x) => x.classList.toggle('on', x === b)); }));
    U.$$('[data-i]', m).forEach((b) => (b.onclick = () => {
      if (!pick) return Game.toast('Önce çıkacak oyuncuyu seç.', 'bad');
      m.classList.add('hidden'); m.innerHTML = '';
      Live.sub(pick, +b.dataset.i);
      Live.resume();
    }));
  },
  draw() {
    const L = Live.m;
    if (!L) return;
    let el = document.getElementById('cm-live');
    const [h, a] = L.match.home ? [L.me, L.oc] : [L.oc, L.me];
    if (!el) {
      el = document.createElement('div'); el.id = 'cm-live'; el.className = 'cm-live'; document.body.appendChild(el);
      el.innerHTML = `<div class="cm-sb-top"><small>${U.esc(L.match.name)}</small>
          <div class="cm-score">${UI.shirt(h)}<b>${U.esc(h.short || h.name)}</b><em id="lv-sc">0 - 0</em><b>${U.esc(a.short || a.name)}</b>${UI.shirt(a)}</div>
          <div class="cm-min"><i id="lv-bar"></i><span id="lv-min">0'</span></div></div>
        <canvas class="cm-rad" id="lv-rad"></canvas>
        <div class="cm-lstat"><span>Topa sahip olma <b id="lv-pos">50% - 50%</b></span><span>Şut <b id="lv-sh">0-0</b></span><span>İsabet <b id="lv-ot">0-0</b></span></div>
        <ul class="cm-feed" id="lv-feed"></ul>
        <div class="cm-ctrl">
          <div class="cm-chips">${Object.entries(CM_STYLES).map(([k, x]) => `<button class="cm-chip sm" data-lst="${k}">${x.t}</button>`).join('')}</div>
          <div class="cm-row"><button class="btn btn-ghost" id="lv-sub">${Icon('squad')} <span>Değişiklik</span> <em id="lv-subn"></em></button>
          <button class="btn btn-ghost" id="lv-speed"></button>
          <button class="btn btn-ghost" id="lv-skip">${Icon('fast')} Sona atla</button></div>
        </div>
        <div class="cm-done hidden" id="lv-donebox"></div>`;
      U.$$('[data-lst]', el).forEach((b) => (b.onclick = () => { const M = Live.m; if (!M || M.done) return; M.style = b.dataset.lst; Live.log(`Taktik: ${CM_STYLES[M.style].t}`, 'info'); Live.draw(); }));
      el.querySelector('#lv-sub').onclick = () => { const M = Live.m; if (!M || M.done || M.subs <= 0 || M.paused) return; clearTimeout(Live._t); Live.subMenu(null); };
      el.querySelector('#lv-speed').onclick = () => { const M = Live.m; if (!M) return; M.speed = (M.speed % Live.SPEEDS.length) + 1; Live.draw(); };
      el.querySelector('#lv-skip').onclick = () => {
        const M = Live.m; if (!M || M.done || M.paused) return;
        clearTimeout(Live._t);
        M.auto = true; // sona atlarken kritik anlar otomatik
        while (M.min < 90) { Live.tick(); if (M.min === 45 && !M.ht) M.ht = true; if (M.injured) { const p = Live.P(M.injured); M.injured = null; Live.autoSub(p); } if (M.min >= 55 && M.subs > 0 && M.min - (M.aLast || 0) >= 5) { M.aLast = M.min; Live.autoSubs(); } }
        Live.draw(); Live.end();
      };
      UI.strip(el);
      // küçük saha
      const kits = Sprites.kits(L.me, L.oc, !L.match.home);
      const hk = L.match.home ? kits.own : kits.opp, ak = L.match.home ? kits.opp : kits.own;
      // küçük sahada renkler karışmasın
      let ac = ak.shirt;
      const near = (x, y) => { try { return Sprites.colorDist(x, y) < 150; } catch (e) { return false; } };
      if (near(hk.shirt, ac)) ac = ak.alt && !near(hk.shirt, ak.alt) ? ak.alt : (near(hk.shirt, '#f4f4f4') ? '#1d2433' : '#f4f4f4');
      if (typeof Radar !== 'undefined') L.R = Radar.start(el.querySelector('#lv-rad'), { street: false, meSide: Live.ourSide(), mePos: null, num: 0, hc: hk.shirt, hr: hk.shorts, ac, ar: ak.shorts, hk: L.match.home ? kits.gk.shirt : '#2b2b2b', ak: L.match.home ? '#2b2b2b' : kits.gk.shirt });
    }
    const [hs, as] = L.match.home ? [L.gf, L.ga] : [L.ga, L.gf];
    const tired = Live.onField().filter((p) => p.fit < 40).length;
    el.querySelector('#lv-sc').textContent = `${hs} - ${as}`;
    el.querySelector('#lv-bar').style.width = `${(L.min / 90) * 100}%`;
    el.querySelector('#lv-min').textContent = `${L.min}'`;
    // istatistikler skor tabelası gibi: ev sahibi solda
    const ha = (x) => (L.match.home ? x : [x[1], x[0]]);
    const pp = Live.possPct();
    el.querySelector("#lv-pos").textContent = ha([pp, 100 - pp]).map((x) => `${x}%`).join(" - ");
    el.querySelector('#lv-sh').textContent = ha(L.st.sh).join('-');
    el.querySelector('#lv-ot').textContent = ha(L.st.ot).join('-');
    U.$$('[data-lst]', el).forEach((b) => b.classList.toggle('on', b.dataset.lst === L.style));
    el.querySelector('#lv-subn').textContent = `(${L.subs})${tired ? ` · ${tired} yorgun` : ''}`;
    el.querySelector('#lv-sub').disabled = L.subs <= 0 || L.done;
    el.querySelector('#lv-skip').disabled = L.done;
    el.querySelector('#lv-speed').textContent = ['1x', '2x', '4x', '8x'][L.speed - 1];
    if (L.R) L.R.speed = [1, 1.6, 2.6, 4][L.speed - 1];
    const fd = el.querySelector('#lv-feed');
    if (fd.childElementCount !== Math.min(L.feed.length, 50) || L.done) {
      fd.innerHTML = L.feed.slice(0, 50).map((f) => `<li class="${f.cls}"><b>${f.m}'</b> ${f.t}</li>`).join('');
      UI.strip(fd);
    }
  },
  end() {
    const L = Live.m;
    if (L.done) return;
    if ((L.match.comp === 'cup' || L.match.ko) && L.gf === L.ga) {
      const st = Live.str();
      const pw = U.clamp(0.5 + (st.att - L.opp.att) / 60 + L.set * 0.03, 0.3, 0.72);
      let a = 0, b = 0;
      for (let i = 0; i < 5; i++) { if (U.chance(0.72 + (pw - 0.5) * 0.3)) a++; if (U.chance(0.72 - (pw - 0.5) * 0.3)) b++; }
      while (a === b) { if (U.chance(0.7)) a++; if (U.chance(0.7)) b++; }
      L.pens = { a, b, win: a > b };
      Live.log(`Penaltılar: ${a}-${b} · ${a > b ? 'Turu geçtik!' : 'Elendik.'}`, a > b ? 'gf' : 'ga');
    }
    L.done = true;
    Live.log(`Maç bitti: ${L.gf}-${L.ga}`, 'info');
    Live.ratings();
    if (!L.quick) Live.summary();
  },
  // oyuncu puanları ve maçın oyuncusu
  ratings() {
    const L = Live.m;
    const win = L.pens ? L.pens.win : L.gf > L.ga, draw = !L.pens && L.gf === L.ga;
    const out = [];
    Object.keys(L.rates).map(Number).forEach((id) => {
      const p = Live.P(id); if (!p) return;
      const mins = L.mins[id] || 0; if (!mins) return;
      let r = L.rates[id] + (win ? 0.5 : draw ? 0 : -0.4) + U.rand(-0.45, 0.45);
      if ((p.pos === 'GK' || p.pos === 'DF') && L.ga === 0 && mins > 60) r += 0.6;
      r = +U.clamp(r, 4, 10).toFixed(1);
      out.push({ p, r, mins });
    });
    out.sort((a, b) => b.r - a.r);
    L.final = out;
    L.motm = out[0] ? out[0].p : null;
  },
  summary() {
    const L = Live.m, el = document.getElementById('cm-live');
    if (!el) return;
    const box = el.querySelector('#lv-donebox');
    const rows = L.final.slice(0, 14).map((x) => `<div class="cm-rt ${x.p === L.motm ? 'motm' : ''}"><span class="cm-pos ${x.p.pos}">${CM_POS[x.p.pos]}</span><b>${U.esc(x.p.n)}</b><small>${x.mins}'</small><em class="${x.r >= 7.5 ? 'hi' : x.r < 6 ? 'lo' : ''}">${x.r.toFixed(1)}</em></div>`).join('');
    const ha = (x) => (L.match.home ? x : [x[1], x[0]]);
    const pp = Live.possPct(), poss = ha([pp, 100 - pp]);
    const st = { sh: ha(L.st.sh), ot: ha(L.st.ot), cor: ha(L.st.cor), yel: ha(L.st.yel) };
    box.innerHTML = `<div class="cm-sumh"><b>Maç sonu</b>${L.motm ? `<span>⭐ Maçın oyuncusu: ${U.esc(L.motm.n)}</span>` : ''}</div>
      <div class="cm-stbl"><div><span>${poss[0]}%</span><small>Topa sahip olma</small><span>${poss[1]}%</span></div><div><span>${st.sh[0]}</span><small>Şut</small><span>${st.sh[1]}</span></div><div><span>${st.ot[0]}</span><small>İsabetli şut</small><span>${st.ot[1]}</span></div><div><span>${st.cor[0]}</span><small>Korner</small><span>${st.cor[1]}</span></div><div><span>${st.yel[0]}</span><small>Sarı kart</small><span>${st.yel[1]}</span></div></div>
      <div class="lbl">Oyuncu puanları</div><div class="cm-rts">${rows}</div>
      <button class="btn btn-big" id="lv-done">${Icon('team')} Soyunma odasına git</button>`;
    box.classList.remove('hidden');
    el.classList.add('done');
    box.querySelector('#lv-done').onclick = () => Live.finish();
    UI.strip(box);
  },
  // sonucu kadroya ve kariyere işle; ardından takım konuşması ve basın toplantısı
  finish() {
    const L = Live.m, s = Coach.s;
    if (!L.done) Live.end();
    if (L.R) L.R.stop();
    const el = document.getElementById('cm-live'); if (el) el.remove();
    const win = L.pens ? L.pens.win : L.gf > L.ga;
    L.final.forEach((x) => { x.p.apps++; x.p.rs += x.r; x.p.form = x.p.form.concat([x.r]).slice(-5); });
    if (L.motm) L.motm.motm = (L.motm.motm || 0) + 1;
    const res = { gf: L.gf, ga: L.ga, pens: L.pens || null, scorers: L.scorers, motm: L.motm ? L.motm.n : null };
    const quick = L.quick, match = L.match;
    Live.m = null;
    Coach.afterMatch(match, res);
    if (quick) {
      if (!Coach.checkSack()) Coach.render();
      Game.toast(`${win ? 'Galibiyet' : L.gf === L.ga && !L.pens ? 'Beraberlik' : 'Mağlubiyet'} · ${L.gf}-${L.ga}`, win ? 'good' : '');
      return;
    }
    Live.teamTalk(L, () => Live.press(L, () => { if (!Coach.checkSack()) Coach.render(); }));
    void s;
  },
  // maç sonu takım konuşması
  teamTalk(L, next) {
    const win = L.pens ? L.pens.win : L.gf > L.ga, draw = !L.pens && L.gf === L.ga;
    const sq = () => Coach.s.squad.filter((p) => L.final.some((x) => x.p === p));
    const mor = (v) => sq().forEach((p) => (p.mor = U.clamp(p.mor + v * (p.pers === 'calm' ? 0.5 : 1), 0, 100)));
    const chem = (v) => (Coach.s.chem = U.clamp(Coach.s.chem + v, 0, 100));
    const opts = win ? [
      { t: '👏 Harika iş çıkardınız!', fn: () => { mor(4); chem(1); return 'Oyuncular övgüden çok mutlu oldu.'; } },
      { t: '🙂 İyiydi ama daha fazlası var', fn: () => { mor(2); chem(1); return 'Takım ayakları yere basan mesajı anladı.'; } },
      { t: '😐 Rehavete kapılmayın', fn: () => { mor(-1); chem(2); return 'Bazı oyuncular sevinçlerinin bölünmesinden hoşlanmadı ama mesaj alındı.'; } },
    ] : draw ? [
      { t: '🤝 Bir puan da puandır', fn: () => { mor(2); return 'Takım moralini korudu.'; } },
      { t: '📋 Kazanabileceğimiz bir maçtı', fn: () => { mor(0); chem(2); return 'Oyuncular hatalarını konuştu.'; } },
      { t: '😠 Bu performans yetmez!', fn: () => { const ok = U.chance(0.5); mor(ok ? 3 : -4); chem(ok ? 1 : -2); return ok ? 'Sert sözler takımı ateşledi.' : 'Oyuncular sert sözlere bozuldu.'; } },
    ] : [
      { t: '🤝 Başımızı kaldıralım', fn: () => { mor(2); return 'Takım yenilgiyi geride bırakmaya çalışıyor.'; } },
      { t: '📋 Hatalarımızı konuşalım', fn: () => { mor(0); chem(2); return 'Video analizi yapıldı, eksikler not edildi.'; } },
      { t: '😠 Bu kabul edilemez!', fn: () => { const ok = U.chance(0.5); mor(ok ? 4 : -5); chem(ok ? 1 : -2); return ok ? 'Oyuncular tepki gösterdi ve hırslandı.' : 'Soyunma odasında gerginlik var.'; } },
    ];
    const motm = L.motm ? `<p class="muted">⭐ Maçın oyuncusu: ${U.esc(L.motm.n)} (${L.final[0].r.toFixed(1)})</p>` : '';
    Game.modal(`<div class="ev-tag">Soyunma odası</div><h3>Skor ${L.gf}-${L.ga}. Takıma ne söyleyeceksin?</h3>${motm}`, opts.map((o) => ({ t: o.t, fn: () => { const msg = o.fn(); Coach.save(); Game.toast(msg, 'good'); setTimeout(next, 120); } })));
  },
  // basın toplantısı: tek soru, üç cevap
  press(L, next) {
    const s = Coach.s;
    const win = L.pens ? L.pens.win : L.gf > L.ga, draw = !L.pens && L.gf === L.ga;
    const ctx = win ? 'win' : draw ? 'draw' : 'loss';
    const fx = (k) => {
      const t = { modest: { conf: 2, fans: 0, mor: 1 }, bold: { conf: 0, fans: 4, mor: 2 }, sharp: { conf: -2, fans: 3, mor: -1 } }[k];
      s.conf = U.clamp(s.conf + t.conf, 0, 100); s.fans = U.clamp(s.fans + t.fans, 0, 100);
      s.squad.forEach((p) => (p.mor = U.clamp(p.mor + t.mor, 0, 100)));
      if (k === 'sharp' && ctx === 'loss' && U.chance(0.3)) { const fine = Math.round(Coach.wageOf(Coach.my().rating) * 2 / 1000) * 1000; s.money -= fine; Coach.news(`⚖️ Hakem eleştirisi nedeniyle federasyon ${U.money(fine)} para cezası verdi.`, 'bad'); }
      Coach.save();
    };
    const Q = {
      win: [
        ['Bugünkü galibiyeti nasıl değerlendiriyorsunuz?', 'Oyuncularımı tebrik ediyorum, hepsi hak etti.', 'Bu takım her maçı kazanmak için sahaya çıkıyor!', 'Bizi küçümseyenlere cevabı sahada verdik.'],
        ['Taraftarlar şampiyonluk konuşmaya başladı. Ne dersiniz?', 'Önümüzde uzun bir yol var, maç maç bakıyoruz.', 'Neden olmasın? Bu takıma inanıyorum.', 'Bizi kimse durduramaz.'],
      ],
      draw: [
        ['Bir puan sizin için yeterli mi?', 'Zor bir rakipti, bu puana saygı duyuyorum.', 'Kazanmak için her şeyi yaptık, şanssızdık.', 'Hakem kararları olmasa kazanırdık.'],
      ],
      loss: [
        ['Bu mağlubiyetin sebebi neydi?', 'Sorumluluk bende, hatalarımızı düzelteceğiz.', 'Bir maç kaybettik, savaşı değil.', 'Hakem kararları maçın kaderini değiştirdi.'],
        ['Yönetimin size güveni sarsıldı mı?', 'Yönetimle her gün konuşuyoruz, birlikteyiz.', 'Sonuçlar gelecek, bundan şüphem yok.', 'Ben işimi yapıyorum, gerisi beni ilgilendirmez.'],
      ],
    };
    const q = U.pick(Q[ctx]);
    Game.modal(`<div class="ev-tag">Basın toplantısı</div><div class="iv-mic">🎙️</div><h3 class="cm-pq">${q[0]}</h3>`, [
      { t: q[1], fn: () => { fx('modest'); Game.toast('Yönetim sakin tavrını beğendi.', 'good'); setTimeout(next, 120); } },
      { t: q[2], fn: () => { fx('bold'); Game.toast('Taraftarlar bu sözlere bayıldı.', 'good'); setTimeout(next, 120); } },
      { t: q[3], fn: () => { fx('sharp'); Game.toast('Sözlerin manşet oldu.', ''); setTimeout(next, 120); } },
    ]);
  },
};
