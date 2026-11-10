// Okul (8-18 yaş): sezon içinde "okula git / antrenmana katıl" ikilemi, sınıfta görselli sorular,
// ara dönem ve sezon sonu sınavı (derste çıkan sorular sınavda tekrar sorulur), karne ve Zeka puanı.
// 1.0.19 özellikleri: uygulamada (iOS/Android) açık; web'de yayına kadar kapalı (localStorage sf_v19=1 ile açılır, =0 ile kapanır).
const FEAT_V19 = (() => {
  try {
    const v = localStorage.getItem('sf_v19');
    if (v === '0') return false;
    if (v === '1') return true;
  } catch (e) { /* yok */ }
  const C = window.Capacitor;
  return !!(C && C.isNativePlatform && C.isNativePlatform());
})();

const School = {
  // ---------- durum ----------
  enabled() { return FEAT_V19; },
  on(p) {
    const s = Game.state;
    p = p || (s && s.player);
    return FEAT_V19 && !!s && !!p && s.mode !== 'wc' && p.age >= 8 && p.age <= 18;
  },
  iq(p) {
    if (p.iq == null) p.iq = U.randi(42, 58);
    return p.iq;
  },
  addIq(p, v) { p.iq = U.clamp(School.iq(p) + v, 1, 100); },
  // antrenman verimine etkisi: Zeka 50 → x1, 90 → x1.1, 10 → x0.9
  trainF(p) { return FEAT_V19 && p && p.iq != null ? 1 + (p.iq - 50) / 400 : 1; },
  ensure(s) {
    const p = s.player;
    School.iq(p);
    if (!s.school || s.school.y !== s.season.year) s.school = { y: s.season.year, age: p.age, l: [], ex: {}, hist: (s.school && s.school.hist) || [] };
    if (!s.school.plan) {
      // ders haftaları rastgele: her dönemde 3 ders
      const n = Game.rounds(), mid = School.mid();
      const pick = (a, b) => U.shuffle(Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i)).slice(0, 3);
      s.school.plan = pick(1, mid - 1).concat(pick(mid + 1, n - 2)).sort((a, b) => a - b);
    }
    return s.school;
  },
  mid() { return Math.max(3, Math.floor(Game.rounds() / 2)); },
  isLessonWeek(r) { const sc = Game.state.school; return !!(sc && sc.plan && sc.plan.includes(r)); },
  // advanceWeek'ten (lig haftası) çağrılır
  week(s, r) {
    if (!School.on()) return;
    const sc = School.ensure(s);
    if (r === School.mid() && !sc.ex.mid) s.pendingSchool = 'mid';
    else if (School.isLessonWeek(r) && !s.pendingSchool) s.pendingSchool = 'lesson';
  },
  show() {
    const s = Game.state, k = s.pendingSchool;
    s.pendingSchool = null;
    if (!School.on()) return Game.checkPending();
    if (k === 'mid') return School.exam('mid').then(() => { Game.save(); Game.render(); Game.checkPending(); });
    return School.lesson();
  },

  // ---------- soru üreticileri ----------
  SH: {
    circle: { n: 0, d: '<circle cx="20" cy="20" r="14"/>' },
    tri: { n: 3, d: '<polygon points="20,5 35,33 5,33"/>' },
    sq: { n: 4, d: '<rect x="7" y="7" width="26" height="26"/>' },
    pent: { n: 5, d: '<polygon points="20,4 36,16 30,35 10,35 4,16"/>' },
    hex: { n: 6, d: '<polygon points="11,5 29,5 38,20 29,35 11,35 2,20"/>' },
  },
  icon(k, col) { return `<svg class="sc-ic" viewBox="0 0 40 40"><g fill="none" stroke="${col || '#fff'}" stroke-width="3" stroke-linejoin="round">${School.SH[k].d}</g></svg>`; },
  seq(arr) { return `<span class="sc-seq">${arr.map((k) => School.icon(k, '#ffd25a')).join('')}</span>`; },
  // tahta üzerinde ortalanmış şekil dizisi
  boardShapes(arr, extra) {
    const w = 46, x0 = 160 - (arr.length * w) / 2;
    return arr.map((k, i) => (k === '?' ? `<text x="${x0 + i * w + 23}" y="102" class="ch-t" text-anchor="middle" font-size="34">?</text>`
      : `<g transform="translate(${x0 + i * w + 3},62)"><g fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round">${School.SH[k].d}</g></g>`)).join('') + (extra || '');
  },
  // seçenekleri karıştırıp doğru cevabın yerini bulur
  pack(k, q, v, right, wrong) {
    const o = U.shuffle([right].concat(wrong.filter((x, i, a) => x !== right && a.indexOf(x) === i)).slice(0, 4));
    return { k, q, v, o, a: o.indexOf(right) };
  },
  gen(age, kind) {
    const G = School.G;
    const ks = Object.keys(G).filter((x) => !G[x].min || age >= G[x].min);
    const k = kind && G[kind] ? kind : U.pick(ks);
    return G[k].f(age);
  },
  G: {
    // köşe sayısına göre sıralama
    corners: { f(age) {
      const pool = U.shuffle(['circle', 'tri', 'sq', 'pent', 'hex']).slice(0, age < 11 ? 3 : 4);
      const right = pool.slice().sort((a, b) => School.SH[a].n - School.SH[b].n);
      const wr = [];
      for (let i = 0; i < 12 && wr.length < 3; i++) { const x = U.shuffle(pool.slice()); if (x.join() !== right.join() && !wr.some((w) => w.join() === x.join())) wr.push(x); }
      return School.pack('corners', 'Şekilleri köşe sayısına göre azdan çoğa sırala.', School.boardShapes(U.shuffle(pool.slice())), School.seq(right), wr.map((x) => School.seq(x)));
    } },
    // dört işlem / denklem
    math: { f(age) {
      let t, ans;
      if (age <= 9) { const a = U.randi(3, 15), b = U.randi(2, 12); if (U.chance(0.5)) { t = `${a} + ${b} = ?`; ans = a + b; } else { const x = Math.max(a, b), y = Math.min(a, b); t = `${x} − ${y} = ?`; ans = x - y; } }
      else if (age <= 12) { const a = U.randi(3, 12), b = U.randi(3, 12); if (U.chance(0.6)) { t = `${a} × ${b} = ?`; ans = a * b; } else { t = `${a * b} ÷ ${a} = ?`; ans = b; } }
      else if (age <= 15) { const x = U.randi(2, 12), a = U.randi(2, 7), b = U.randi(1, 15); t = `${a}x + ${b} = ${a * x + b}`; ans = x; }
      else { const pc = U.pick([10, 20, 25, 50, 75]), base = U.pick([40, 60, 80, 120, 200, 240]); t = `%${pc} × ${base} = ?`; ans = (pc * base) / 100; }
      const wr = [ans + 1, ans - 1, ans + 2, ans - 2, ans + 10, ans * 2].filter((x) => x >= 0 && x !== ans);
      const q = age >= 13 && age <= 15 ? 'Denklemi çöz: x kaç?' : 'İşlemin sonucu kaç?';
      return School.pack('math', q, `<text x="160" y="100" class="ch-t" text-anchor="middle" font-size="34">${t}</text>`, String(ans), U.shuffle(wr).slice(0, 3).map(String));
    } },
    // örüntü: sıradaki şekil
    pattern: { f(age) {
      const ks = U.shuffle(['circle', 'tri', 'sq', 'pent']);
      const unit = age < 11 ? ks.slice(0, 2) : U.chance(0.5) ? ks.slice(0, 3) : [ks[0], ks[0], ks[1]];
      const seq = []; for (let i = 0; i < 6; i++) seq.push(unit[i % unit.length]);
      const right = unit[6 % unit.length];
      const opts = ks.slice(0, 4).map((k) => School.icon(k, '#ffd25a'));
      return School.pack('pattern', 'Sıradaki şekil hangisi?', School.boardShapes(seq.concat('?')), School.icon(right, '#ffd25a'), opts.filter((x) => x !== School.icon(right, '#ffd25a')).slice(0, 3));
    } },
    // sayı örüntüsü
    numseq: { min: 10, f(age) {
      let a, step, seq, nx;
      if (age < 14) { a = U.randi(1, 9); step = U.randi(2, 9); seq = [0, 1, 2, 3].map((i) => a + i * step); nx = a + 4 * step; }
      else { a = U.randi(1, 4); step = U.pick([2, 3]); seq = [0, 1, 2, 3].map((i) => a * step ** i); nx = a * step ** 4; }
      return School.pack('numseq', 'Sıradaki sayı kaç?', `<text x="160" y="100" class="ch-t" text-anchor="middle" font-size="30">${seq.join(', ')}, ?</text>`, String(nx), [nx + step, nx - step, nx + 1, nx * 2].map(String));
    } },
    // bayrak: hangi ülke?
    flag: { f(age) {
      // küçük yaşta yalnız tanınmış ülkeler
      const all = (age < 13 ? NATIONS : Game.allNations()).filter((n) => n.flag && n.flag !== '🏴');
      const pick = U.shuffle(all.slice()).slice(0, 4);
      return School.pack('flag', 'Bu bayrak hangi ülkenin?', `<text x="160" y="118" text-anchor="middle" font-size="76" data-emo="1">${pick[0].flag}</text>`, pick[0].name, pick.slice(1).map((n) => n.name));
    } },
    // kesir: pastanın boyalı kısmı
    fraction: { min: 9, f(age) {
      const d = U.pick(age < 12 ? [2, 3, 4] : [3, 4, 5, 6, 8]), n = U.randi(1, d - 1);
      const r = 42, cx = 160, cy = 82;
      let sl = '';
      for (let i = 0; i < d; i++) {
        const a0 = (i / d) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / d) * 2 * Math.PI - Math.PI / 2;
        const p = (a) => `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
        sl += `<path d="M${cx},${cy} L${p(a0)} A${r},${r} 0 0 1 ${p(a1)} Z" fill="${i < n ? '#ffd25a' : 'none'}" stroke="#fff" stroke-width="2.5"/>`;
      }
      const wr = [`${d - n}/${d}`, `${n}/${d + 1}`, `${n + 1}/${d}`, `1/${d}`, `${n}/${d * 2}`].filter((x) => x !== `${n}/${d}`);
      return School.pack('fraction', 'Pastanın boyalı kısmı ne kadar?', sl, `${n}/${d}`, U.shuffle(wr).slice(0, 3));
    } },
    // sayma
    count: { f(age) {
      const tgt = U.pick(['tri', 'sq', 'circle']), others = ['tri', 'sq', 'circle'].filter((x) => x !== tgt);
      const n = U.randi(age < 11 ? 2 : 4, age < 11 ? 5 : 8), tot = n + U.randi(3, 6);
      const items = U.shuffle(Array.from({ length: tot }, (_, i) => (i < n ? tgt : U.pick(others))));
      const svg = items.map((k, i) => `<g transform="translate(${30 + (i % 7) * 38},${32 + Math.floor(i / 7) * 42}) scale(.8)"><g fill="none" stroke="#fff" stroke-width="3.5" stroke-linejoin="round">${School.SH[k].d}</g></g>`).join('');
      const q = { tri: 'Tahtada kaç tane üçgen var?', sq: 'Tahtada kaç tane kare var?', circle: 'Tahtada kaç tane daire var?' }[tgt];
      return School.pack('count', q, svg, String(n), [n + 1, n - 1, n + 2, n - 2].filter((x) => x > 0).map(String));
    } },
    // saat okuma
    clock: { f(age) {
      const h = U.randi(1, 12), m = age < 11 ? U.pick([0, 30]) : U.pick([0, 15, 30, 45]);
      const cx = 160, cy = 82, ha = ((h % 12) + m / 60) * 30 * Math.PI / 180, ma = m * 6 * Math.PI / 180;
      const ticks = Array.from({ length: 12 }, (_, i) => { const a = i * 30 * Math.PI / 180; return `<line x1="${cx + 38 * Math.sin(a)}" y1="${cy - 38 * Math.cos(a)}" x2="${cx + 44 * Math.sin(a)}" y2="${cy - 44 * Math.cos(a)}" stroke="#fff" stroke-width="2.5"/>`; }).join('');
      const svg = `<circle cx="${cx}" cy="${cy}" r="48" fill="none" stroke="#fff" stroke-width="3"/>${ticks}
        <line x1="${cx}" y1="${cy}" x2="${(cx + 24 * Math.sin(ha)).toFixed(1)}" y2="${(cy - 24 * Math.cos(ha)).toFixed(1)}" stroke="#ffd25a" stroke-width="5" stroke-linecap="round"/>
        <line x1="${cx}" y1="${cy}" x2="${(cx + 38 * Math.sin(ma)).toFixed(1)}" y2="${(cy - 38 * Math.cos(ma)).toFixed(1)}" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;
      const f = (hh, mm) => `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')}`;
      return School.pack('clock', 'Saat kaç?', svg, f(h, m), [f(h + 1, m), f(h, (m + 30) % 60), f(m / 5 || 12, h * 5 % 60), f(h - 1, m)]);
    } },
  },

  // ---------- görsel ----------
  board(q, tag) {
    return `<div class="sc-room"><svg class="sc-svg" viewBox="0 0 320 200" role="img" aria-label="">
      <rect width="320" height="200" fill="#f1dfb8"/><rect y="168" width="320" height="32" fill="#a8743f"/>
      <rect x="14" y="10" width="292" height="150" rx="6" fill="#7a4a24"/><rect x="22" y="17" width="276" height="136" rx="3" fill="#2f5d46"/>
      <rect x="40" y="153" width="240" height="7" fill="#5b371b"/><rect x="70" y="149" width="18" height="5" fill="#fff"/><rect x="230" y="148" width="26" height="7" rx="2" fill="#e8c14a"/>
      <g>${q.v}</g>
    </svg>${tag ? `<span class="sc-tag">${tag}</span>` : ''}</div>
    <p class="sc-q">${q.q}</p>
    <div class="sc-opts">${q.o.map((o, i) => `<button class="btn sc-o" data-ans="${i}">${o}</button>`).join('')}</div>`;
  },
  // tek soru sorar; cevabın doğru olup olmadığını döndürür
  ask(q, head, tag, feedback) {
    return new Promise((res) => {
      const m = Game.modal(`${head}${School.board(q, tag)}<div class="sc-fb"></div>`, [], { wide: true });
      m.querySelector('.modal-btns').remove();
      U.$$('.sc-o', m).forEach((b) => (b.onclick = () => {
        const ok = +b.dataset.ans === q.a;
        U.$$('.sc-o', m).forEach((x) => { x.disabled = true; if (+x.dataset.ans === q.a) x.classList.add('ok'); });
        if (!ok) b.classList.add('bad');
        if (typeof Sfx !== 'undefined' && Sfx.play) try { Sfx.play(ok ? 'coin' : 'groan'); } catch (e) { /* ses yok */ }
        const done = () => { m.classList.add('hidden'); m.innerHTML = ''; res(ok); };
        if (!feedback) return setTimeout(done, 650);
        const fb = m.querySelector('.sc-fb');
        fb.innerHTML = `<p class="sc-res ${ok ? 'ok' : 'bad'}">${ok ? feedback[0] : feedback[1]}</p>`;
        const btn = U.el(`<button class="btn btn-big">Devam</button>`);
        btn.onclick = done;
        fb.appendChild(btn);
        UI.strip(fb);
      }));
    });
  },

  // ---------- ders ----------
  lesson() {
    const s = Game.state, p = s.player, sc = School.ensure(s);
    const term = s.season.round <= School.mid() ? 'mid' : 'fin';
    const head = '<div class="ev-tag">Okul</div>';
    const intro = U.pick([
      'Sabah okul zili çaldı ama hoca da ekstra antrenman koydu. Hangisine gideceksin?',
      'Bugün okulda önemli bir ders var, öğretmen sınavda çıkacak bir konu işleyecek. Antrenman da aynı saatte.',
      'Annen okula gitmeni istiyor, takım arkadaşların antrenmana çağırıyor.',
    ]);
    Game.modal(`${head}<h3>${intro}</h3><p class="muted">Zeka <b>${Math.round(School.iq(p))}</b> · Derste işlenen konular dönem sınavında çıkar.</p>`, [
      { t: '🏫 Okula git', fn: () => {
        const q = School.gen(p.age);
        sc.l.push(Object.assign({ t: term, seen: 1 }, q));
        Player.addEnergy(p, 4);
        School.ask(q, `${head}<h3>Ders zamanı</h3>`, 'Ders', ['Doğru! Öğretmenin seni tebrik etti. Bu soru sınavda çıkabilir.', 'Yanlış ama sorun değil, doğru cevabı gördün. Sınava kadar unutma!']).then((ok) => {
          School.addIq(p, ok ? 1.2 : 0.5);
          if (typeof Friends !== 'undefined') Friends.maybeSchool();
          Player.addMorale(p, ok ? 2 : 0);
          p.rel.family = U.clamp((p.rel.family || 60) + 2, 0, 100);
          Game.save(); Game.render();
          Game.toast(ok ? 'Zeka +1 · Ailen mutlu' : 'Zeka +0.5 · Konuyu öğrendin', 'good');
          Game.checkPending();
        });
      } },
      { t: '⚽ Antrenmana katıl', cls: 'btn-ghost', fn: () => {
        sc.l.push(Object.assign({ t: term, seen: 0 }, School.gen(p.age)));
        const k = U.pick(STATS).k, g = Player.train(p, k, 1, Game.facility());
        Player.addRel(p, 'coach', 1);
        p.rel.family = U.clamp((p.rel.family || 60) - 3, 0, 100);
        Game.save(); Game.render();
        Game.toast(`${STATS.find((x) => x.k === k).l} +${g.toFixed(2)} · Dersi kaçırdın, sınavda o konu sana yeni gelecek.`, '');
        Game.checkPending();
      } },
    ]);
  },

  // ---------- sınav ----------
  exam(term) {
    const s = Game.state, p = s.player, sc = School.ensure(s);
    if (sc.ex[term]) return Promise.resolve(sc.ex[term]);
    const taught = U.shuffle(sc.l.filter((x) => x.t === term));
    const qs = taught.slice(0, 3).map((x) => Object.assign({}, x, { o: null }));
    // seçenekleri yeniden karıştır (cevabın yeri ezberlenmesin)
    qs.forEach((q, i) => { const src = taught[i]; const right = src.o[src.a]; q.o = U.shuffle(src.o.slice()); q.a = q.o.indexOf(right); });
    while (qs.length < 3) qs.push(School.gen(sc.age || p.age));
    const name = term === 'mid' ? 'Ara dönem sınavı' : 'Sezon sonu sınavı';
    let score = 0;
    const run = (i) => {
      if (i >= qs.length) return Promise.resolve();
      return School.ask(qs[i], `<div class="ev-tag">${name}</div><h3>Soru ${i + 1}/${qs.length}</h3>`, 'Sınav').then((ok) => { if (ok) score++; return run(i + 1); });
    };
    return new Promise((res) => {
      Game.modal(`<div class="ev-tag">Okul</div><h3>${name} başlıyor!</h3><p>${qs.length} soru var. Derste işlediğiniz konular çıkacak. Başarılı olursan ailen ve hocan çok mutlu olur.</p>`, [{ t: 'Sınava gir', cls: 'btn-big', fn: () => run(0).then(() => {
        const r = School.result(p, score, qs.length);
        sc.ex[term] = { score, of: qs.length };
        Game.save();
        Game.modal(`<div class="ev-tag">${name}</div><div class="sc-grade g${r.g}"><b>${score}/${qs.length}</b><span>${r.label}</span></div><p>${r.msg}</p><div class="chgs">${r.chg}</div>`, [{ t: 'Tamam', fn: () => res(sc.ex[term]) }]);
      }) }]);
    });
  },
  result(p, score, of) {
    const g = score === of ? 5 : score >= Math.ceil(of * 0.6) ? 4 : score >= 1 ? 2 : 1;
    const chg = [];
    const tag = (t, up) => chg.push(`<span class="chg ${up ? 'up' : 'down'}">${up ? '▲' : '▼'} ${t}</span>`);
    if (g >= 4) {
      School.addIq(p, g === 5 ? 4 : 2.5); tag(`Zeka +${g === 5 ? 4 : 2.5}`, 1);
      Player.addMorale(p, g === 5 ? 10 : 6); tag('Moral', 1);
      p.rel.family = U.clamp((p.rel.family || 60) + (g === 5 ? 10 : 6), 0, 100); tag('Aile', 1);
      Player.addRel(p, 'coach', g === 5 ? 4 : 2); tag('Hoca', 1);
    } else {
      Player.addMorale(p, g === 2 ? -2 : -5); tag('Moral', 0);
      p.rel.family = U.clamp((p.rel.family || 60) - (g === 2 ? 3 : 6), 0, 100); tag('Aile', 0);
    }
    const label = { 5: 'Pekiyi', 4: 'İyi', 2: 'Geçer', 1: 'Zayıf' }[g];
    const msg = g === 5 ? 'Tam puan! Ailen gururdan ağladı, hocan da "Sahada da böyle akıllı oyna" dedi.'
      : g === 4 ? 'Güzel bir sınav geçirdin. Ailen ve hocan senden memnun.'
        : g === 2 ? 'Zar zor geçtin. Annen biraz daha ders çalışmanı istiyor.'
          : 'Sınav kötü geçti. Ailen üzgün, bir dahakine derslere daha çok katılmalısın.';
    return { g, label, msg, chg: chg.join('') };
  },
  // sezon sonu: sınav + karne (Game.endSeason zincirinden çağrılır)
  yearEnd() {
    const s = Game.state;
    if (!FEAT_V19 || !s.school || s.school.y !== s.season.year || s.mode === 'wc') return Promise.resolve();
    const sc = s.school, p = s.player;
    if (sc.done) return Promise.resolve();
    return School.exam('fin').then(() => {
      const mid = sc.ex.mid, fin = sc.ex.fin;
      const pts = (mid ? mid.score : 0) + fin.score, of = (mid ? mid.of : 0) + fin.of;
      const avg = of ? (pts / of) * 4 + 1 : 1;
      const belge = avg >= 4.5 ? 'Takdir Belgesi' : avg >= 3.5 ? 'Teşekkür Belgesi' : '';
      sc.done = 1;
      sc.hist.unshift({ y: sc.y, age: sc.age, avg: +avg.toFixed(1), b: belge });
      sc.hist = sc.hist.slice(0, 12);
      if (belge) { Player.addMorale(p, 5); Game.news(`📜 Karne günü: ${belge} aldın! Ailen seninle gurur duyuyor.`, 'good'); }
      const grad = sc.age >= 18;
      if (grad) { School.addIq(p, 2); Game.news(`🎓 Liseden mezun oldun! Karne ortalaman ${avg.toFixed(1)}.`, 'good'); }
      Game.save();
      return new Promise((res) => Game.modal(`<div class="ev-tag">Karne</div>
        <div class="sc-card"><h3>${grad ? '🎓 Mezuniyet' : `${sc.age} yaş · Karne`}</h3>
          <div class="sc-rows"><div><span>Ara dönem</span><b>${mid ? `${mid.score}/${mid.of}` : '–'}</b></div><div><span>Sezon sonu</span><b>${fin.score}/${fin.of}</b></div><div><span>Ortalama</span><b>${avg.toFixed(1)}</b></div><div><span>Zeka</span><b>${Math.round(p.iq)}</b></div></div>
          ${belge ? `<div class="sc-belge">📜 ${belge}</div>` : ''}</div>`, [{ t: 'Devam', fn: res }]));
    });
  },

  // Yaşam sekmesindeki okul kartı
  card() {
    const s = Game.state, p = s.player;
    if (!School.on()) return '';
    const sc = School.ensure(s);
    const seen = sc.l.filter((x) => x.seen).length;
    const last = sc.hist[0];
    const next = sc.ex.mid ? 'Sıradaki: Sezon sonu sınavı' : `Ara dönem sınavı: ${School.mid()}. hafta`;
    return `<section class="card sc-life">
      <div class="card-h"><span>${Icon('star')} Okul</span><small class="muted">${p.age} yaş</small></div>
      <div class="lf-rows"><div class="lf-row"><span>Zeka</span><div class="lf-bar"><i style="width:${U.clamp(School.iq(p), 0, 100)}%;background:#7fb2ff"></i></div><b>${Math.round(p.iq)}</b></div></div>
      <div class="sc-info"><span>Katıldığın dersler: ${seen}/${sc.l.length}</span><span>${next}</span>${sc.ex.mid ? `<span>Ara dönem notu: ${sc.ex.mid.score}/${sc.ex.mid.of}</span>` : ''}${last ? `<span>Geçen yılın ortalaması: ${last.avg}</span>` : ''}${last && last.b ? `<span>📜 ${last.b}</span>` : ''}</div>
      <p class="muted">Zeka antrenman verimini artırır.</p>
    </section>`;
  },
};
