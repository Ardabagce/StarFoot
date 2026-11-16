// 1.0.24 yenilikleri (oyuncu geri bildirimleri):
//  - Teknik Direktör: dizilişte sürükle-bırak (ilk 11 ↔ yedek/rezerv, ilk 11 içinde yer değiştirme), yedekler ve rezervler sahanın altında
//  - Teknik Direktör: oyuncuya gelişim planı (yoğun bireysel, yük yönetimi, tarz eğitimi)
//  - Teknik Direktör: oyuncu tarzları (top tutan orta saha, hedef santrfor vb.) ve takım oyun anlayışıyla uyum
//  - Kariyer: evlilikten sonra çocuklar; yaşa göre çocuklarla aktiviteler ve küçük aile olayları
// Mevcut fonksiyonlar sarmalanır; eski kayıtlar olduğu gibi çalışır (yeni alanlar ilk kullanımda eklenir).
(function () {
  // ======================= TEKNİK DİREKTÖR =======================
  if (typeof Coach === 'undefined') return;

  // ---------- oyuncu tarzları ----------
  // bonus: ilk 11'deki oyuncunun hücum/savunmaya katkısı; fit: bu oyun anlayışlarında ek uyum
  const STY = {
    sweeper: { pos: 'GK', t: 'Libero kaleci', d: 'Ceza sahası dışına çıkar, savunmanın arkasını süpürür.', def: 0.4, fit: ['press', 'att'] },
    line: { pos: 'GK', t: 'Çizgi kalecisi', d: 'Kalesinde kalır, refleksleriyle kurtarır.', def: 0.4, fit: ['def', 'counter', 'bal'] },
    stopper: { pos: 'DF', t: 'Sert stoper', d: 'Hava toplarında güçlü, ikili mücadelede sert.', def: 0.5, fit: ['def', 'counter'] },
    ballplay: { pos: 'DF', t: 'Oyun kuran defans', d: 'Geriden pasla oyunu başlatır.', att: 0.25, def: 0.2, fit: ['bal', 'press'] },
    wingback: { pos: 'DF', t: 'Hücumcu bek', d: 'Kanattan sürekli hücuma çıkar.', att: 0.45, def: -0.1, fit: ['att', 'press'] },
    anchor: { pos: 'MF', t: 'Top kesici', d: 'Savunmanın önünde top kapar.', def: 0.5, fit: ['def', 'counter'] },
    playmaker: { pos: 'MF', t: 'Top tutan orta saha', d: 'Topu ayağında tutar, oyunun temposunu belirler.', att: 0.45, fit: ['bal', 'att'] },
    b2b: { pos: 'MF', t: 'İki yönlü orta saha', d: 'Hem savunmaya hem hücuma koşar.', att: 0.25, def: 0.25, fit: ['press', 'bal'] },
    poacher: { pos: 'FW', t: 'Fırsatçı golcü', d: 'Ceza sahasında doğru yerde durur.', att: 0.5, fit: ['att', 'bal'] },
    target: { pos: 'FW', t: 'Hedef santrfor', d: 'Sırtı dönük top saklar, hava toplarında etkili.', att: 0.4, fit: ['def', 'counter'] },
    pace: { pos: 'FW', t: 'Hızlı forvet', d: 'Savunma arkasına koşularla tehlike yaratır.', att: 0.4, fit: ['counter', 'press'] },
  };
  window.CM_STY = STY;
  const stylesFor = (pos) => Object.keys(STY).filter((k) => STY[k].pos === pos);
  // eski kayıtlardaki oyunculara tarz: oyuncu kimliğinden belirlenir (her açılışta aynı), %70'inde bir tarz olur
  Coach.styOf = (p) => {
    if (!p) return null;
    if (p.sty === undefined) {
      const list = stylesFor(p.pos);
      const h = ((p.id || 0) * 2654435761) >>> 0;
      p.sty = list.length && h % 10 < 7 ? list[h % list.length] : null;
    }
    return p.sty && STY[p.sty] && STY[p.sty].pos === p.pos ? p.sty : null;
  };
  const mk0 = Coach.mkPlayer;
  Coach.mkPlayer = function (o) {
    const p = mk0.apply(this, arguments);
    if (p && p.sty === undefined) { const list = stylesFor(p.pos); p.sty = list.length && U.chance(0.7) ? U.pick(list) : null; }
    return p;
  };
  // tarz katkısı: ilk 11'deki tarzlı oyuncular; takımın oyun anlayışına uyan tarz +%40. Toplam etki ±2,5 ile sınırlı.
  Coach.styBonus = (list, style) => {
    let att = 0, def = 0;
    (list || []).forEach((p) => {
      const k = Coach.styOf(p); if (!k) return;
      const x = STY[k], m = x.fit.includes(style) ? 1.4 : 1;
      att += (x.att || 0) * m; def += (x.def || 0) * m;
    });
    return { att: U.clamp(att, -2.5, 2.5), def: U.clamp(def, -2.5, 2.5) };
  };
  const str0 = Coach.strength;
  Coach.strength = function (list, form, style, mods) {
    const r = str0.apply(this, arguments);
    try { const b = Coach.styBonus(list, style); r.att += b.att; r.def += b.def; } catch (e) { /* tarz hesaplanamazsa etkisiz */ }
    return r;
  };

  // ---------- gelişim planı ----------
  const PLANS = {
    std: { t: 'Standart', d: 'Takımla normal antrenman.' },
    fast: { t: 'Yoğun bireysel', d: 'Gelişim %60 hızlanır; kondisyon her hafta biraz düşer, sakatlık riski artar. 24 yaş ve altı.' },
    rest: { t: 'Yük yönetimi', d: 'Kondisyon daha hızlı toplanır, gelişim yavaşlar. Tecrübeli oyuncular için.' },
    style: { t: 'Tarz eğitimi', d: '8 hafta sonra seçtiğin oyun tarzını öğrenir. Bu sürede gelişim biraz yavaşlar.' },
  };
  window.CM_PLANS = PLANS;
  const week0 = Coach.week;
  Coach.week = function () {
    const s = Coach.s;
    const before = {};
    (s.squad || []).forEach((p) => { before[p.id] = p.r; });
    const out = week0.apply(this, arguments);
    try {
      (Coach.s.squad || []).forEach((p) => {
        const plan = p.plan || 'std';
        if (plan === 'std' || p.loan) return;
        const r0 = before[p.id], gained = r0 != null ? p.r - r0 : 0;
        if (plan === 'fast') {
          if (p.age > 24) { p.plan = 'std'; return; }
          if (gained > 0) p.r = Math.min(p.pot, p.r + gained * 0.6);
          p.fit = U.clamp(p.fit - 3, 0, 100);
          if (!p.inj && U.chance(0.003)) { p.inj = U.randi(1, 2); Coach.news(`🤕 ${Coach.pa(p.pos)} ${p.n} yoğun bireysel çalışmada sakatlandı (${p.inj} hafta).`, 'bad'); }
        } else if (plan === 'rest') {
          if (gained > 0) p.r = Math.max(r0, p.r - gained * 0.5);
          p.fit = U.clamp(p.fit + 4, 0, 100);
        } else if (plan === 'style') {
          if (gained > 0) p.r = Math.max(r0, p.r - gained * 0.2);
          if (!p.planSty || !STY[p.planSty] || STY[p.planSty].pos !== p.pos) { p.plan = 'std'; p.planSty = null; p.planW = 0; return; }
          p.planW = (p.planW || 0) + 1;
          if (p.planW >= 8) {
            p.sty = p.planSty; p.plan = 'std'; p.planSty = null; p.planW = 0;
            Coach.news(`🎓 ${p.n} yeni oyun tarzını öğrendi: ${STY[p.sty].t}.`, 'good');
          }
        }
      });
    } catch (e) { /* plan etkisi atlanır, hafta yine ilerler */ }
    return out;
  };

  // ---------- elle diziliş korunur ----------
  // Elle değiştirilen ilk 11, oyuncu sakatlanınca/cezalanınca tamamen baştan dizilmez: yalnız oynayamayan çıkar, yerine aynı mevkiden en iyisi girer.
  const auto0 = Coach.autoPick;
  Coach.autoPick = function () {
    const s = Coach.s;
    // boş ilk 11 (yeni kulüp, meydan okuma) her zaman sıfırdan dizilir; elle diziliş bayrağı da sıfırlanır
    if (s && (!Array.isArray(s.xi) || !s.xi.length)) s.xiManual = false;
    if (!s || !s.xiManual) return auto0.apply(this, arguments);
    try {
      const seen = new Set();
      // oynayabilenler yerinde kalır (sıra sahadaki yerini belirler)
      const xi = s.xi.map((id) => (!seen.has(id) && Coach.available(Coach.P(id)) && seen.add(id) ? id : null));
      const pool = s.squad.filter((p) => Coach.available(p) && !seen.has(p.id)).sort((a, b) => b.r - a.r);
      const take = (fn) => { const k = pool.findIndex(fn); return k < 0 ? null : pool.splice(k, 1)[0].id; };
      // çıkanın yerine aynı mevkiden en iyisi
      s.xi.forEach((id, i) => { if (xi[i] != null) return; const gone = Coach.P(id); if (gone) xi[i] = take((p) => p.pos === gone.pos); });
      const out = xi.filter((x) => x != null).slice(0, 11);
      // hâlâ eksik varsa önce dizilişin ihtiyaç duyduğu mevkiler, sonra kaleci dışı en iyiler
      const f = CM_FORMS[s.form] || { DF: 4, MF: 4, FW: 2 }, need = { GK: 1, DF: f.DF, MF: f.MF, FW: f.FW };
      const cnt = (pos) => out.filter((id) => { const p = Coach.P(id); return p && p.pos === pos; }).length;
      ['GK', 'DF', 'MF', 'FW'].forEach((pos) => { while (out.length < 11 && cnt(pos) < need[pos]) { const id = take((p) => p.pos === pos); if (id == null) break; out.push(id); } });
      while (out.length < 11) { const id = take((p) => p.pos !== 'GK'); if (id == null) break; out.push(id); }
      if (out.length < 11) return auto0.apply(this, arguments); // kadro yetmiyorsa eski yöntem
      s.xi = out;
    } catch (e) { return auto0.apply(this, arguments); }
    return undefined;
  };
  // ilk 11 ↔ diğer oyuncu ya da ilk 11 içinde yer değiştirme
  Coach.swapXI = (a, b) => {
    const s = Coach.s, P = Coach.P;
    if (a === b) return false;
    const ia = s.xi.indexOf(a), ib = s.xi.indexOf(b);
    if (ia < 0 && ib < 0) return false;
    if (ia >= 0 && ib >= 0) { s.xi[ia] = b; s.xi[ib] = a; }
    else {
      const inId = ia >= 0 ? b : a, idx = ia >= 0 ? ia : ib;
      const pin = P(inId);
      if (!Coach.available(pin)) { Game.toast('Bu oyuncu şu an oynayamaz.', 'bad'); return false; }
      s.xi[idx] = inId;
    }
    s.xiManual = true;
    Coach.save();
    return true;
  };

  // saha: sürüklenebilir oyuncular + altında yedekler ve rezervler
  const pitch0 = Coach.pitch;
  Coach.pitch = function () {
    const s = Coach.s;
    let html = pitch0.apply(this, arguments);
    // sahadaki noktalar sürüklenebilir
    html = html.replace(/<button class="cm-dot([^"]*)" style="([^"]*)" data-pinfo="(\d+)">/g, (m, c, st, id) => `<button class="cm-dot cm-dnd${c}" style="${st}" data-pinfo="${id}" data-dnd="${id}">`);
    const xiSet = new Set(s.xi);
    const rest = s.squad.filter((p) => !p.loan && !xiSet.has(p.id));
    const ok = rest.filter((p) => Coach.available(p)).sort((a, b) => b.r - a.r);
    const bench = ok.slice(0, 7), res = ok.slice(7).concat(rest.filter((p) => !Coach.available(p)));
    const chip = (p) => {
      const k = Coach.styOf(p);
      const off = !Coach.available(p);
      return `<button class="cm-bchip cm-dnd ${off ? 'off' : ''}" data-pinfo="${p.id}" data-dnd="${p.id}"><span class="cm-pos ${p.pos}">${CM_POS[p.pos]}</span><b>${Coach.ovr(p)}</b><span class="cm-cn">${U.esc(p.n.split(' ').slice(-1)[0])}</span>${off ? `<em>${p.inj ? `${p.inj} hf` : p.sus ? 'Ceza' : ''}</em>` : k ? `<small>${U.esc(STY[k].t)}</small>` : ''}</button>`;
    };
    html += `<p class="cm-dndh">${Icon('squad')} Oyuncuyu sürükleyip başka bir oyuncunun üstüne bırak: yer değiştirirler. Yedekleri sürüklemek için kısa basılı tut. Dokunursan bilgi kartı açılır.</p>`;
    html += `<div class="lbl">Yedekler</div><div class="cm-bchips">${bench.map(chip).join('') || '<small class="muted">–</small>'}</div>`;
    if (res.length) html += `<div class="lbl">Rezervler</div><div class="cm-bchips">${res.map(chip).join('')}</div>`;
    if (s.xiManual) html += '<p class="cm-desc">İlk 11 elle dizildi. Oynayamayan oyuncu olursa yalnız onun yerine değişiklik yapılır. "Otomatik diz" en güçlü 11\'e döner.</p>';
    return html;
  };
  // diziliş sekmesine "Otomatik diz" düğmesi (kadro sekmesindekinin aynısı)
  const tac0 = Coach.vTactic;
  Coach.vTactic = function () {
    return tac0.apply(this, arguments).replace('</small></div>', '</small><button class="btn btn-ghost cm-autob" id="cm-auto2">Otomatik diz</button></div>');
  };

  // sürükle-bırak (dokunmatik ve fare): Pointer Events
  // Sahadaki oyuncu hemen sürüklenir. Yedek kartı dokunmatikte kısa basılı tutunca sürüklenir (yoksa sayfa normal kayar).
  // Sürüklerken ekranın üst/alt kenarına gelince sayfa kendiliğinden kayar (saha ile yedekler aynı anda ekrana sığmayabilir).
  Coach.dnd = (root) => {
    U.$$('.cm-dnd', root).forEach((el) => {
      const chip = el.classList.contains('cm-bchip');
      let armed = false;
      // basılı tutup sürüklerken sayfa kaymasın (iOS/Android)
      el.addEventListener('touchmove', (te) => { if (armed && te.cancelable) te.preventDefault(); }, { passive: false });
      el.addEventListener('contextmenu', (ce) => ce.preventDefault());
      el.addEventListener('pointerdown', (e) => {
        if (e.button > 0) return;
        const id = +el.dataset.dnd, x0 = e.clientX, y0 = e.clientY;
        const hold = chip && e.pointerType === 'touch';
        let ghost = null, over = null, moved = false, lx = x0, ly = y0, raf = 0, dead = false;
        // üstte sabit duran başlık varsa kaydırma bölgesi onun altından başlar
        let top0 = 0;
        try {
          let t = document.elementFromPoint(window.innerWidth / 2, 4);
          while (t && t !== document.body) { const ps = getComputedStyle(t).position; if (ps === 'fixed' || ps === 'sticky') { top0 = Math.max(0, Math.min(t.getBoundingClientRect().bottom, window.innerHeight / 3)); break; } t = t.parentElement; }
        } catch (x) { top0 = 0; }
        // altta sabit menü çubuğu varsa kaydırma bölgesi onun üstünden başlar
        let bot0 = 0;
        try {
          let t = document.elementFromPoint(window.innerWidth / 2, window.innerHeight - 4);
          while (t && t !== document.body) { const ps = getComputedStyle(t).position; if (ps === 'fixed' || ps === 'sticky') { bot0 = Math.max(0, Math.min(window.innerHeight - t.getBoundingClientRect().top, window.innerHeight / 3)); break; } t = t.parentElement; }
        } catch (x) { bot0 = 0; }
        armed = !hold;
        const timer = hold ? setTimeout(() => { if (dead) return; armed = true; el.classList.add('cm-armed'); try { if (navigator.vibrate) navigator.vibrate(12); } catch (x) { /* yok */ } }, 200) : 0;
        const pick = (x, y) => { const t = document.elementFromPoint(x, y); return t && t.closest ? t.closest('.cm-dnd') : null; };
        const hover = () => {
          if (!ghost) return;
          ghost.style.left = lx + 'px'; ghost.style.top = ly + 'px';
          const t = pick(lx, ly);
          if (over && over !== t) over.classList.remove('cm-over');
          over = t && t !== el ? t : null;
          if (over) over.classList.add('cm-over');
        };
        const edge = () => {
          raf = 0;
          if (dead || !moved) return;
          const h = window.innerHeight - bot0, z = 70, zt = top0 + z;
          // yalnız parmak o kenara doğru gerçekten ilerlediyse kayar (kenara yakın başlayan sürükleme sayfayı kendiliğinden kaydırmasın)
          const v = ly < zt && ly < y0 - 24 ? -Math.ceil(Math.min(zt - ly, 90) / 5) : ly > h - z && ly > y0 + 24 ? Math.ceil(Math.min(ly - (h - z), 90) / 5) : 0;
          if (v) { window.scrollBy(0, v); hover(); }
          raf = requestAnimationFrame(edge);
        };
        const end = () => {
          dead = true; clearTimeout(timer); if (raf) cancelAnimationFrame(raf);
          document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up);
          el.classList.remove('cm-armed', 'cm-dragging');
          if (ghost) ghost.remove();
          if (over) over.classList.remove('cm-over');
        };
        const move = (ev) => {
          lx = ev.clientX; ly = ev.clientY;
          const dist = Math.hypot(lx - x0, ly - y0);
          if (!armed) { if (dist >= 9) { end(); armed = false; } return; } // basılı tutmadan kaydırdı: normal sayfa kaydırma
          if (!moved && dist < 9) return;
          if (!moved) {
            moved = true;
            ghost = el.cloneNode(true); ghost.classList.add('cm-ghost'); ghost.classList.remove('cm-armed');
            ghost.style.cssText = `position:fixed;left:0;top:0;pointer-events:none;z-index:9999;width:${el.offsetWidth}px;margin:0;transform:translate(-50%,-50%)`;
            document.body.appendChild(ghost); el.classList.add('cm-dragging');
            raf = requestAnimationFrame(edge);
          }
          hover();
          if (ev.cancelable) ev.preventDefault();
        };
        const up = (ev) => {
          const wasMoved = moved, t = wasMoved && ev.type === 'pointerup' ? pick(ev.clientX, ev.clientY) : null;
          end(); armed = false;
          if (!wasMoved) return; // dokunma: onclick bilgi kartını açar
          // sürüklemenin ardından gelen tıklama bilgi kartını açmasın
          const stop = (ce) => { ce.stopPropagation(); ce.preventDefault(); };
          el.addEventListener('click', stop, { capture: true, once: true });
          setTimeout(() => el.removeEventListener('click', stop, { capture: true }), 400);
          if (t && t !== el && t.dataset.dnd && Coach.swapXI(id, +t.dataset.dnd)) Coach.render();
        };
        document.addEventListener('pointermove', move, { passive: false });
        document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
      });
    });
  };
  const bind0 = Coach.bind;
  Coach.bind = function (el) {
    bind0.apply(this, arguments);
    try {
      const s = Coach.s;
      // listedeki onay kutusuyla elle seçim de "elle dizildi" sayılır
      U.$$('[data-xi]', el).forEach((b) => { const f = b.onclick; b.onclick = (ev) => { const cs = Coach.s; if (cs) cs.xiManual = true; if (f) f.call(b, ev); }; });
      U.$$('#cm-auto, #cm-auto2', el).forEach((b) => (b.onclick = () => { const cs = Coach.s; if (!cs) return; cs.xiManual = false; Coach.autoPick(); Coach.save(); Coach.render(); }));
      Coach.dnd(el);
    } catch (e) { /* sürükle-bırak kurulamazsa eski davranış */ }
  };

  // oyuncu kartı: tarz ve gelişim planı
  const info0 = Coach.playerInfo;
  Coach.playerInfo = function (id) {
    info0.apply(this, arguments);
    try {
      const s = Coach.s, p = Coach.P(id), m = document.getElementById('modal');
      if (!p || !m || p.loan) return;
      const k = Coach.styOf(p), plan = p.plan || 'std';
      const young = p.age <= 24;
      const opts = Object.keys(PLANS).filter((x) => x !== 'fast' || young);
      const styleOpts = stylesFor(p.pos).filter((x) => x !== k);
      const box = document.createElement('div');
      box.className = 'cm-plan';
      box.innerHTML = `<div class="cm-kv"><div><span>Oyun tarzı</span><b>${k ? U.esc(STY[k].t) : '—'}</b></div><div><span>Gelişim planı</span><b>${PLANS[plan].t}${plan === 'style' && p.planSty ? ` · ${U.esc(STY[p.planSty].t)} (${p.planW || 0}/8)` : ''}</b></div></div>
        ${k ? `<p class="muted cm-pd">${U.esc(STY[k].d)}</p>` : ''}
        <div class="lbl">Gelişim planı</div>
        <div class="cm-seg sm">${opts.map((x) => `<button class="${plan === x ? 'on' : ''}" data-plan="${x}">${PLANS[x].t}</button>`).join('')}</div>
        <p class="cm-desc" id="cm-plan-d">${PLANS[plan].d}</p>
        <div class="cm-seg sm cm-stysel ${plan === 'style' ? '' : 'hidden'}">${styleOpts.map((x) => `<button class="${p.planSty === x ? 'on' : ''}" data-psty="${x}">${U.esc(STY[x].t)}</button>`).join('')}</div>`;
      const anchor = m.querySelector('.cm-pd') || m.querySelector('.cm-kv.four');
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(box, anchor.nextSibling); else (m.querySelector('.modal-box') || m).appendChild(box);
      const refresh = () => { Coach.save(); Coach.render(); m.classList.add('hidden'); m.innerHTML = ''; Coach.playerInfo(id); };
      U.$$('[data-plan]', box).forEach((b) => (b.onclick = () => {
        const v = b.dataset.plan;
        if (v === 'style') { p.plan = 'style'; if (!p.planSty || !styleOpts.includes(p.planSty)) p.planSty = styleOpts[0] || null; p.planW = 0; if (!p.planSty) p.plan = 'std'; }
        else { p.plan = v; p.planSty = null; p.planW = 0; }
        refresh();
      }));
      U.$$('[data-psty]', box).forEach((b) => (b.onclick = () => { p.plan = 'style'; p.planSty = b.dataset.psty; p.planW = 0; refresh(); }));
    } catch (e) { /* kart eski haliyle kalır */ }
  };
})();

// ======================= KARİYER: ÇOCUKLAR =======================
(function () {
  if (typeof Life === 'undefined') return;
  const BOY = ['Can', 'Ali', 'Deniz', 'Emir', 'Arda', 'Kerem', 'Leo', 'Luca', 'Mateo', 'Noah', 'Elias', 'Yusuf', 'Aras', 'Kaan'];
  const GIRL = ['Ada', 'Defne', 'Elif', 'Mila', 'Lina', 'Sofia', 'Zeynep', 'Ela', 'Nehir', 'Emma', 'Lea', 'Asya', 'Duru', 'Mia'];
  const kids = (L) => (L.kids = Array.isArray(L.kids) ? L.kids : []);
  const ageOf = (k) => Math.max(0, Game.state.season.year - k.by);
  // yaşa göre aktiviteler: [anahtar, başlık, sonuç mesajları]
  const ACTS = (a) => (a <= 2 ? [['hug', 'Kucağına al, oyna', ['Kahkahaları bütün evi doldurdu.', 'İlk kez "baba" dedi!', 'Kucağında uyuyakaldı.']], ['walk', 'Bebek arabasıyla yürüyüş', ['Parkta güzel bir yürüyüş yaptınız.', 'Güvercinleri görünce çok heyecanlandı.']]]
    : a <= 6 ? [['park', 'Parka götür', ['Kaydıraktan defalarca kaydı.', 'Salıncakta "daha yüksek!" diye bağırdı.']], ['story', 'Masal oku', ['Masalın sonunu sen uydurdun, çok sevdi.', 'Uyumadan önce "bir tane daha" dedi.']], ['ball', 'Bahçede top oyna', ['İlk golünü sana attı!', 'Topa senin gibi vurmaya çalıştı.']]]
      : a <= 12 ? [['ball', 'Birlikte top oyna', ['Sol ayağıyla harika bir gol attı.', 'Sana çalım attı ve çok gurur duydu.']], ['homework', 'Ödevine yardım et', ['Matematik ödevini birlikte bitirdiniz.', 'Proje ödevi sınıfın en iyisi seçildi.']], ['match', 'Maçına götür', ['Tribünde formanı giydi, hiç susmadı.', 'Maçtan sonra soyunma odasına götürdün, çok mutlu oldu.']]]
        : a <= 17 ? [['talk', 'Uzun bir sohbet', ['Okul ve arkadaşları hakkında konuştunuz.', 'Gelecek hayallerini anlattı.']], ['watch', 'Onun maçını izle', ['Tribünde seni görünce daha iyi oynadı.', 'Takımının en iyisiydi.']], ['trip', 'Hafta sonu gezisi', ['Kampta güzel bir hafta sonu geçirdiniz.', 'Birlikte yeni bir şehir gezdiniz.']]]
          : [['dinner', 'Birlikte yemek', ['Eski günleri konuşup çok güldünüz.', 'Sana iş hayatından bahsetti.']], ['talk', 'Hayatı hakkında konuş', ['Kararlarında sana danıştı.', 'Senin gibi olmak istediğini söyledi.']]]);
  const bar = (v, c) => `<div class="lf-bar"><i style="width:${U.clamp(v, 0, 100)}%;background:${c}"></i></div>`;

  // haftalık: bağ azalır, evliyken bebek haberi gelebilir, küçük olaylar
  const week0 = Life.week;
  Life.week = function (s) {
    const out = week0.apply(this, arguments);
    try {
      const p = s && s.player; if (!p || !p.life) return out;
      const L = p.life, K = kids(L), gf = L.gf, y = s.season.year;
      K.forEach((k) => { k.bond = U.clamp((k.bond == null ? 60 : k.bond) - 0.5, 0, 100); });
      // evlilik yılı (eski kayıtlarda bilinmiyor: ilk görüldüğü yıl sayılır)
      if (gf && gf.married && gf.wedY == null) gf.wedY = y;
      // bebek: evlilikten en az bir yıl sonra; isim Yaşam sekmesinde seçilir (başka pencerelerle çakışmasın)
      if (!L.babyNew && gf && gf.married && K.length < 3 && p.age >= 21 && p.age <= 42 && y > gf.wedY && U.chance(K.length ? 0.012 : 0.02)) {
        const sex = U.chance(0.5) ? 'b' : 'g';
        const names = U.shuffle((sex === 'b' ? BOY : GIRL).filter((n) => !K.some((k) => k.n === n))).slice(0, 3);
        L.babyNew = { sex, by: y, names };
        p.rel.family = U.clamp(p.rel.family + 10, 0, 100); Player.addMorale(p, 15);
        Game.news(sex === 'b' ? '👶 Bir oğlun oldu! Yaşam sekmesinden ona bir isim ver.' : '👶 Bir kızın oldu! Yaşam sekmesinden ona bir isim ver.', 'good');
      }
      // yılda bir: çocuğun doğum günü
      K.forEach((k) => {
        if (k.bday !== y && s.season.round === ((k.by * 7) % 30) + 3) { k.bday = y; const a = ageOf(k); if (a >= 1) Game.news(`🎂 ${k.n} ${a} yaşına girdi!`, 'good'); }
      });
    } catch (e) { /* çocuk olayları atlanır */ }
    return out;
  };
  Life.nameBaby = (n) => {
    const p = Game.state && Game.state.player; if (!p) return;
    const L = Life.ensure(p), K = kids(L), b = L.babyNew;
    if (!b || !n) return;
    K.push({ n, sex: b.sex, by: b.by, bond: 70 });
    L.babyNew = null;
    Game.news(`👶 ${Player.fullName(p)} baba oldu! Bebeğin adı ${n}.`, 'good');
    try { Social.post('family', `Hoş geldin ${n}! Hayatımın en güzel golü.`, 2.2); } catch (e) { /* yok */ }
    Game.save(); Game.render();
  };
  // çocuklarla vakit: 1 aksiyon hakkı
  Life.kidAct = (i, key) => {
    const s = Game.state, p = s && s.player; if (!p) return;
    const L = Life.ensure(p), k = kids(L)[i];
    if (!k) return;
    if (s.ap <= 0) return Game.toast('Bu hafta için aksiyon hakkın kalmadı. Maça çık!', 'bad');
    const a = ageOf(k), act = ACTS(a).find((x) => x[0] === key);
    if (!act) return;
    s.ap--;
    const g = U.randi(8, 14);
    k.bond = U.clamp((k.bond == null ? 60 : k.bond) + g, 0, 100);
    p.rel.family = U.clamp(p.rel.family + 4, 0, 100);
    Player.addMorale(p, 4);
    Player.addEnergy(p, key === 'trip' ? -6 : key === 'ball' || key === 'park' ? -3 : 2);
    if (key === 'ball') k.ball = (k.ball || 0) + 1;
    Game.toast(`${k.n} · ${U.pick(act[2])} Bağınız +${g}`, 'good');
    // top oynamayı seven çocuk futbolcu olmak ister
    if (key === 'ball' && a >= 6 && k.ball >= 3 && !k.dream) { k.dream = true; Game.toast(`${k.n} · "Ben de senin gibi futbolcu olacağım!"`, 'good'); }
    if (U.chance(0.3)) try { Social.post('family', U.pick([`${k.n} ile güzel bir gün.`, `${k.n} ile vakit geçirmek gibisi yok.`, `Benim en büyük taraftarım: ${k.n}.`]), 1.3); } catch (e) { /* yok */ }
    Game.save(); Game.render();
  };
  const screen0 = Life.screen;
  Life.screen = function () {
    const html = screen0.apply(this, arguments);
    try {
      const p = Game.state.player, L = Life.ensure(p), K = kids(L), b = L.babyNew;
      const married = L.gf && L.gf.married;
      if (!K.length && !b && !married) return html;
      const nb = b ? `<div class="lf-kid lf-baby"><div class="lf-kid-h"><b>👶 <span>${b.sex === 'b' ? 'Bir oğlun oldu!' : 'Bir kızın oldu!'}</span></b></div><p class="muted">Anne ve bebek çok iyi. Ona hangi adı vereceksiniz?</p>
          <div class="lf-kacts" data-noi18n>${b.names.map((n) => `<button class="btn" data-kname="${U.esc(n)}">${U.esc(n)}</button>`).join('')}</div></div>` : '';
      const rows = K.map((k, i) => {
        const a = ageOf(k);
        return `<div class="lf-kid"><div class="lf-kid-h"><b data-noi18n>${k.sex === 'b' ? '👦' : '👧'} ${U.esc(k.n)}</b><small>${a} yaş${k.dream ? ' · futbolcu olmak istiyor ⚽' : ''}</small></div>
          <div class="lf-row"><span>Bağınız</span>${bar(k.bond == null ? 60 : k.bond, '#7fb2ff')}<b>${Math.round(k.bond == null ? 60 : k.bond)}</b></div>
          <div class="lf-kacts">${ACTS(a).map(([key, t]) => `<button class="btn btn-ghost" data-kid="${i}" data-kact="${key}">${t}</button>`).join('')}</div></div>`;
      }).join('');
      const body = nb + rows || '<p class="muted">Henüz çocuğunuz yok. Evliliğinizin ilk yılından sonra güzel bir haber gelebilir.</p>';
      const card = `<section class="card lf-kids"><div class="card-h"><span>${Icon('home')} Çocuklar</span>${K.length ? '<small class="muted">Her biri 1 aksiyon hakkı</small>' : ''}</div>${body}</section>`;
      const i = html.indexOf('</section>');
      return i < 0 ? html + card : html.slice(0, i + 10) + card + html.slice(i + 10);
    } catch (e) { return html; }
  };
  const bindL0 = Life.bind;
  Life.bind = function (root) {
    bindL0.apply(this, arguments);
    U.$$('[data-kact]', root).forEach((b) => (b.onclick = () => Life.kidAct(+b.dataset.kid, b.dataset.kact)));
    U.$$('[data-kname]', root).forEach((b) => (b.onclick = () => Life.nameBaby(b.dataset.kname)));
  };
})();

// ======================= PENCERE AÇIKKEN ARKA SAYFA KAYMASIN =======================
// Modal ya da ayarlar paneli açıkken arka sayfa sabitlenir (iPhone'da da çalışan "body sabitleme" yöntemi);
// kapanınca kaldığı yere döner. Kilitliyken sayfayı başa alma istekleri (scrollTo) hatırlanır ve kapanışta uygulanır.
(function () {
  const root = document.documentElement;
  let locked = false, y = 0;
  const open = () => {
    const m = document.getElementById('modal');
    if (m && !m.classList.contains('hidden') && m.childElementCount > 0) return true;
    return !!document.querySelector('.set-sheet.on');
  };
  const scroll0 = window.scrollTo.bind(window);
  const lock = () => {
    if (locked) return;
    y = window.scrollY || window.pageYOffset || 0;
    const b = document.body;
    b.style.position = 'fixed'; b.style.top = `-${y}px`; b.style.left = '0'; b.style.right = '0'; b.style.width = '100%';
    root.classList.add('sf-lock');
    locked = true;
  };
  const unlock = () => {
    if (!locked) return;
    const b = document.body;
    b.style.position = ''; b.style.top = ''; b.style.left = ''; b.style.right = ''; b.style.width = '';
    root.classList.remove('sf-lock');
    locked = false;
    scroll0(0, y);
  };
  // kilitliyken sayfayı kaydırma istekleri: hedef konum kapanışta uygulanır
  window.scrollTo = function (a, b) {
    if (!locked) return scroll0.apply(window, arguments);
    if (a && typeof a === 'object') y = a.top != null ? a.top : y; else if (b != null) y = b;
    return undefined;
  };
  let raf = 0;
  const check = () => { raf = 0; if (open()) lock(); else unlock(); };
  const queue = () => { if (!raf) raf = requestAnimationFrame(check); };
  const start = () => {
    const mo = new MutationObserver(queue);
    mo.observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: true });
    const m = document.getElementById('modal');
    if (m) mo.observe(m, { childList: true }); // içeriği boşaltılarak kapatılan pencereler
    // güvenlik: her dokunuşta durum yeniden kontrol edilir (kilit asla takılı kalmasın)
    document.addEventListener('pointerdown', queue, { capture: true, passive: true });
    check();
  };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start, { once: true });
})();
