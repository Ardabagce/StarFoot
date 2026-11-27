/* =====================================================================
   StarFoot · SFA (StarFoot Anim) — menü/ekran animasyon yardımcıları
   Bağımlılık yok, tek global: window.SFA. anim.css ile birlikte kullanılır.
   - Yalnız transform/opacity (WAAPI veya CSS sınıfı). Layout okuması her
     efekt başında tek sefer (getBoundingClientRect), kare içinde okuma yok.
   - SFA.enabled() false ise (Ayarlar'dan kapalı, prefers-reduced-motion)
     her fonksiyon son durumu anında uygular.
   - SFA.lite() true ise (body.lite = oyunun Perf.low modu) sonsuz/idle
     efektler eklenmez, parçacık sayıları düşer.
   - Ses kancaları: SFA.hooks.tick/pop/slam/success/whoosh/sign = fn
     (oyunda: SFA.hooks.tick = () => Sfx.play('tick')).
   ===================================================================== */
(function () {
  'use strict';
  const KEY = 'starfoot_anim_off';
  const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  const raf = window.requestAnimationFrame.bind(window);
  const caf = window.cancelAnimationFrame.bind(window);
  const timers = new Set();
  const loops = new Set();

  const SFA = {
    version: '0.1',
    hooks: { tick: null, pop: null, slam: null, success: null, whoosh: null, sign: null },

    // ---------- genel ----------
    off() { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } },
    setOff(v) {
      try { if (v) localStorage.setItem(KEY, '1'); else localStorage.removeItem(KEY); } catch (e) { /* yok */ }
      document.documentElement.classList.toggle('sfa-off', !!v);
    },
    enabled() { return !SFA.off() && !mq.matches && !document.documentElement.classList.contains('sfa-off'); },
    lite() { return !!(document.body && document.body.classList.contains('lite')); },
    emit(name, a) { const f = SFA.hooks[name]; if (f) try { f(a); } catch (e) { /* ses yok */ } },
    later(fn, ms) { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); return id; },
    loop(fn) { // fn(dt, t) false dönerse durur
      let last = performance.now(), t = 0, id;
      const h = { stop() { caf(id); loops.delete(h); } };
      const step = (now) => { const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt; if (fn(dt, t) === false) return h.stop(); id = raf(step); };
      id = raf(step); loops.add(h); return h;
    },
    // sahne değişiminde bekleyen her şeyi iptal eder
    cancelAll() { timers.forEach(clearTimeout); timers.clear(); loops.forEach((h) => h.stop()); loops.clear(); },
    anim(el, kf, o) { if (!el || !el.animate) return null; return el.animate(kf, Object.assign({ fill: 'both' }, o)); },
    // sınıfı yeniden tetikler (animasyonu baştan oynatır)
    replay(el, cls) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); },
    // ekran dışına çıkan idle animasyonları durdurur (pil)
    watchIdle(root) {
      if (!('IntersectionObserver' in window) || !root) return;
      const io = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('sfa-paused', !e.isIntersecting)));
      io.observe(root);
      document.addEventListener('visibilitychange', () => root.classList.toggle('sfa-paused', document.hidden));
    },

    // ---------- yay fiziği (yarı-örtük Euler, sabit adım) ----------
    // {from, to, v (birim/sn), k (sertlik), c (sönüm), onUpdate(x), onDone()}
    spring(o) {
      const k = o.k || 380, c = o.c == null ? 2 * Math.sqrt(k) * 0.72 : o.c;
      let x = o.from, v = o.v || 0;
      const to = o.to, eps = o.eps || 0.4;
      if (!SFA.enabled()) { o.onUpdate(to); if (o.onDone) o.onDone(); return { stop() {} }; }
      return SFA.loop((dt) => {
        const n = Math.ceil(dt / (1 / 240)), h = dt / n;
        for (let i = 0; i < n; i++) { const a = -k * (x - to) - c * v; v += a * h; x += v * h; }
        if (Math.abs(x - to) < eps && Math.abs(v) < eps * 4) { o.onUpdate(to); if (o.onDone) o.onDone(); return false; }
        o.onUpdate(x);
        return true;
      });
    },

    // =====================================================================
    // 1. Giriş: kartlar sırayla yükselir; hub-tiles içindekiler tek tek
    //    root: #main (oyunda Game.render sonrası, sekme değişince)
    // =====================================================================
    enter(root, o) {
      o = o || {};
      if (!root || !SFA.enabled()) return;
      const cls = o.dir > 0 ? 'sfa-rise sfa-rise-r' : o.dir < 0 ? 'sfa-rise sfa-rise-l' : 'sfa-rise';
      let i = 0;
      const items = [];
      const visit = (el) => [...el.children].forEach((c) => {
        if (c.matches('.hub, .grid2')) return visit(c);
        if (c.matches('.hub-tiles, .hw-slots')) { [...c.children].forEach((t) => items.push([t, 'sfa-pop'])); return; }
        if (c.matches('.hub-week')) { items.push([c, cls]); [...c.querySelectorAll('.hw-slot, .hw-rec')].forEach((t) => items.push([t, 'sfa-pop'])); return; }
        items.push([c, cls]);
      });
      visit(root);
      root.classList.add('sfa-clipx'); // yatay kayma sayfayı genişletmesin (mobil viewport zoom)
      items.forEach(([el, c]) => {
        el.style.setProperty('--sfa-i', String(i++));
        c.split(' ').forEach((k) => el.classList.remove(k));
        void el.offsetWidth; // tek seferlik reflow (giriş başında), karelerde yok
        c.split(' ').forEach((k) => el.classList.add(k));
      });
      const max = i * 55 + 700;
      SFA.later(() => { root.classList.remove('sfa-clipx'); items.forEach(([el, c]) => c.split(' ').forEach((k) => el.classList.remove(k))); }, max);
    },

    // maç günü kartı: süpürme, formalar, VS nabzı, geri sayım çipi
    matchCard(card, o) {
      o = o || {};
      if (!card) return;
      if (o.chip !== false) SFA.chip(card, o.ap == null ? 3 : o.ap);
      if (!SFA.enabled()) return;
      const vs = card.querySelector('.vs');
      if (!SFA.lite()) {
        card.classList.add('sfa-sweep', 'sfa-idle');
        if (vs) vs.classList.add('sfa-vs', 'sfa-idle');
      }
      if (!SFA.lite()) card.classList.add('sfa-kitdrop', 'sfa-idle');
      const cta = card.querySelector('.btn-play');
      if (cta) SFA.shimmer(cta);
      SFA.watchIdle(card);
    },
    // geri sayım çipi: "Maça N aksiyon" / "Maç zamanı!"
    chip(card, n) {
      let c = card.querySelector('.sfa-cd');
      const txt = (k) => (k > 0 ? ['Maça', String(k), 'aksiyon kaldı'] : ['', 'Maç zamanı!', '']);
      if (!c) {
        c = document.createElement('div');
        c.className = 'sfa-cd';
        c.innerHTML = '<span class="sfa-cd-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M10 2h4"/><path class="sfa-hand" d="M12 13V8"/></svg></span><span class="a"></span><b class="sfa-roll"><span></span></b><span class="z"></span>';
        const at = card.querySelector('.hub-cta') || card.lastElementChild;
        card.insertBefore(c, at);
        const t = txt(n);
        c.querySelector('.a').textContent = t[0]; c.querySelector('.sfa-roll span').textContent = t[1]; c.querySelector('.z').textContent = t[2];
        c.classList.toggle('zero', n <= 0);
        c.dataset.n = n;
        return c;
      }
      if (+c.dataset.n === n) return c;
      c.dataset.n = n;
      const t = txt(n);
      c.querySelector('.a').textContent = t[0]; c.querySelector('.z').textContent = t[2];
      c.classList.toggle('zero', n <= 0);
      SFA.roll(c.querySelector('.sfa-roll'), t[1]);
      return c;
    },
    // rakam/metin yuvarlama (eski yukarı, yeni alttan)
    roll(box, text) {
      if (!box) return;
      if (!SFA.enabled()) { box.innerHTML = ''; const s = document.createElement('span'); s.textContent = text; box.appendChild(s); return; }
      [...box.children].forEach((s) => { if (s.classList.contains('out')) s.remove(); else { s.classList.remove('in'); s.classList.add('out'); SFA.later(() => s.remove(), 380); } });
      const s = document.createElement('span'); s.className = 'in'; s.textContent = text; box.appendChild(s);
      SFA.emit('tick');
    },
    // hafta kutusu dolar (aksiyon yapıldı)
    fillSlot(slot, html) {
      if (!slot) return;
      slot.className = 'hw-slot done';
      slot.innerHTML = html;
      if (SFA.enabled()) { SFA.replay(slot, 'sfa-slotfill'); SFA.emit('pop'); }
    },

    // =====================================================================
    // 2. Sekmeler: kayan gösterge + ikon zıplaması; içerik yönlü giriş
    // =====================================================================
    tabs(nav, onPick) {
      if (!nav) return null;
      nav.classList.add('sfa-tabs');
      if (getComputedStyle(nav).position === 'static') nav.style.position = 'relative';
      let bar = nav.querySelector('.sfa-tabbar');
      if (!bar) { bar = document.createElement('i'); bar.className = 'sfa-tabbar'; nav.appendChild(bar); }
      const place = (instant) => {
        const on = nav.querySelector('button.on:not(.ph-off), button.tab-phone.on') || nav.querySelector('button.on');
        if (!on) { bar.style.opacity = '0'; return; }
        bar.style.opacity = '1';
        const nr = nav.getBoundingClientRect(), r = on.getBoundingClientRect();
        if (instant || !SFA.enabled()) bar.style.transition = 'none';
        bar.style.width = '1px'; // genişlik sabit; ölçek transform ile
        bar.style.transform = `translate3d(${r.left - nr.left + r.width * 0.2}px,0,0) scaleX(${r.width * 0.6})`;
        if (instant || !SFA.enabled()) { void bar.offsetWidth; bar.style.transition = ''; }
      };
      place(true);
      nav.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b || !nav.contains(b)) return;
        const btns = [...nav.querySelectorAll('button')];
        const from = btns.findIndex((x) => x.classList.contains('on')), to = btns.indexOf(b);
        if (SFA.enabled()) { b.classList.remove('sfa-tap'); void b.offsetWidth; b.classList.add('sfa-tap'); SFA.later(() => b.classList.remove('sfa-tap'), 460); }
        if (onPick) onPick(b, to > from ? 1 : to < from ? -1 : 0);
        place();
      });
      window.addEventListener('resize', () => place(true));
      return { place };
    },

    // ---------- alttan açılan panel: yay ile aç/kapa, sürükle-kapat, lastik bant ----------
    // root: .hub-sheet (içinde .hs-bg, .hs-panel, .hs-h, .hs-body). Oyundaki Hub.open/close yerine:
    //   const sh = SFA.sheet(Hub.el, { onClosed: () => Hub.close() }); sh.open(); sh.close();
    sheet(root, o) {
      o = o || {};
      const panel = root.querySelector('.hs-panel'), bg = root.querySelector('.hs-bg'), head = root.querySelector('.hs-h'), body = root.querySelector('.hs-body');
      root.classList.add('sfa-sheet');
      let y = 0, H = 0, sp = null, isOpen = false;
      const set = (v) => {
        y = v;
        panel.style.transform = `translate3d(0,${v.toFixed(2)}px,0)`;
        bg.style.opacity = String(Math.max(0, Math.min(1, 1 - v / H)));
      };
      const measure = () => { H = panel.getBoundingClientRect().height + 24 || 800; };
      const go = (to, v0, done, soft) => {
        if (sp) sp.stop();
        sp = SFA.spring({ from: y, to, v: v0 || 0, k: soft ? 300 : 420, c: soft ? 2 * Math.sqrt(300) : 2 * Math.sqrt(420) * 0.8, eps: 0.5, onUpdate: set, onDone: () => { sp = null; if (done) done(); } });
      };
      const api = {
        get isOpen() { return isOpen; },
        open() {
          root.classList.add('on');
          measure(); set(H); isOpen = true;
          if (SFA.enabled()) { [...body.children].forEach((c, i) => c.style.setProperty('--sfa-i', i)); }
          go(0, -900); SFA.emit('whoosh');
        },
        close(v0) {
          if (!isOpen) return; isOpen = false;
          measure();
          go(H, v0 || 0, () => { root.classList.remove('on'); panel.style.transform = ''; bg.style.opacity = ''; if (o.onClosed) o.onClosed(); }, true);
        },
      };
      // sürükleme: başlıktan her zaman, gövdeden yalnız en üstteyken aşağı
      let drag = null;
      const down = (e, fromBody) => {
        if (!isOpen || (e.button != null && e.button !== 0)) return;
        if (fromBody && body.scrollTop > 0) return;
        drag = { y0: e.clientY, y: e.clientY, t: performance.now(), v: 0, base: y, fromBody, live: !fromBody };
        if (sp) { sp.stop(); sp = null; }
        if (!fromBody) { try { head.setPointerCapture(e.pointerId); } catch (er) { /* yok */ } }
      };
      const move = (e) => {
        if (!drag) return;
        const now = performance.now(), dyRaw = e.clientY - drag.y0;
        if (drag.fromBody && !drag.live) { if (dyRaw > 6 && body.scrollTop <= 0) { drag.live = true; drag.y0 = e.clientY; root.classList.add('sfa-drag'); } else if (dyRaw < -4) { drag = null; } return; }
        root.classList.add('sfa-drag');
        const dt = Math.max(1, now - drag.t);
        drag.v = 0.8 * ((e.clientY - drag.y) / dt) + 0.2 * drag.v; drag.y = e.clientY; drag.t = now;
        let ny = drag.base + (e.clientY - drag.y0);
        if (ny < 0) ny = -(1 - 1 / (1 + (-ny) * 0.55 / H)) * H * 0.22; // lastik bant: yukarı direnç
        set(ny);
        if (e.cancelable && drag.fromBody) e.preventDefault();
      };
      const up = () => {
        if (!drag) return;
        const d = drag; drag = null; root.classList.remove('sfa-drag');
        if (!d.live) return;
        if (performance.now() - d.t > 90) d.v = 0; // parmak durduysa fırlatma yok
        const vpx = d.v * 1000; // px/sn
        if (y > H * 0.28 || (d.v > 0.75 && y > 20)) api.close(vpx);
        else go(0, vpx);
      };
      head.addEventListener('pointerdown', (e) => { if (e.target.closest('button')) return; down(e, false); });
      body.addEventListener('pointerdown', (e) => down(e, true));
      window.addEventListener('pointermove', move, { passive: false });
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
      root.addEventListener('click', (e) => { if (e.target.closest('[data-hsx]')) api.close(); });
      return api;
    },

    // =====================================================================
    // 3. Butonlar: basınca ezilme, bırakınca yaylanma, dalga
    // =====================================================================
    PRESS: '.btn, .hw-go, .hw-slot, .hub-tile, .chip, .act, .ph-app, .ph-wg, .hs-x, .hs-back, .notif-btn, [data-sfa-press]',
    press(root) {
      root = root || document;
      if (root._sfaPress) return; root._sfaPress = true;
      let cur = null;
      root.addEventListener('pointerdown', (e) => {
        const el = e.target.closest(SFA.PRESS);
        if (!el || el.disabled || !SFA.enabled()) return;
        cur = el;
        const r = el.getBoundingClientRect();
        const wide = r.width / Math.max(1, r.height);
        const sx = wide > 2.5 ? 0.97 : 0.94, sy = wide > 2.5 ? 0.9 : 0.92;
        el.style.setProperty('--sfa-sx', sx); el.style.setProperty('--sfa-sy', sy);
        el.classList.remove('sfa-boing');
        el.style.transition = 'transform 90ms ease-out';
        el.style.transform = `scale(${sx},${sy})`;
        if (!el.matches('.ph-app, .hs-x, .hs-back, .notif-btn')) SFA.ripple(el, e.clientX - r.left, e.clientY - r.top, r);
      }, { passive: true });
      const rel = () => {
        const el = cur; if (!el) return; cur = null;
        el.style.transition = ''; el.style.transform = '';
        void el.offsetWidth; el.classList.add('sfa-boing');
        SFA.later(() => el.classList.remove('sfa-boing'), 480);
      };
      root.addEventListener('pointerup', rel); root.addEventListener('pointercancel', rel); root.addEventListener('pointerleave', rel, true);
    },
    ripple(el, x, y, r) {
      if (!SFA.enabled()) return;
      r = r || el.getBoundingClientRect();
      if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
      let c = el.querySelector(':scope > .sfa-ripc');
      if (!c) { c = document.createElement('span'); c.className = 'sfa-ripc'; el.appendChild(c); }
      const s = Math.max(r.width, r.height) * 2.2;
      const d = document.createElement('i'); d.className = 'sfa-rip';
      d.style.cssText = `width:${s}px;height:${s}px;left:${x - s / 2}px;top:${y - s / 2}px`;
      c.appendChild(d);
      SFA.later(() => d.remove(), 650);
    },
    shimmer(btn) { if (btn && SFA.enabled() && !SFA.lite()) btn.classList.add('sfa-shine', 'sfa-idle'); },
    // başarı: etiket kaybolur, kısa dönen halka, sonra onay işareti çizilir
    success(btn, o) {
      o = o || {};
      if (!btn) return Promise.resolve();
      if (!btn.querySelector(':scope > .sfa-lbl')) {
        const l = document.createElement('span'); l.className = 'sfa-lbl';
        while (btn.firstChild) l.appendChild(btn.firstChild);
        btn.appendChild(l);
        const k = document.createElement('span'); k.className = 'sfa-chk';
        k.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M7.5 12.5l3 3 6-6.5"/></svg>';
        btn.appendChild(k);
        btn.classList.add('sfa-okb');
      }
      const w = btn.getBoundingClientRect().width; btn.style.minWidth = w + 'px';
      return new Promise((res) => {
        if (!SFA.enabled()) { btn.classList.add('sfa-ok'); SFA.later(() => { btn.classList.remove('sfa-ok'); res(); }, o.hold || 900); return; }
        btn.classList.add('sfa-busy');
        SFA.later(() => { btn.classList.remove('sfa-busy'); btn.classList.add('sfa-ok'); SFA.emit('success'); }, o.wait || 380);
        SFA.later(() => { btn.classList.remove('sfa-ok'); btn.style.minWidth = ''; res(); }, (o.wait || 380) + (o.hold || 1100));
      });
    },

    // =====================================================================
    // 4. Sayılar
    // =====================================================================
    // sayaç: textContent günceller, ~70ms'de bir tick kancası
    count(el, to, o) {
      o = o || {};
      if (!el) return;
      const fmt = o.fmt || ((v) => Math.round(v).toLocaleString('tr-TR'));
      const from = o.from != null ? o.from : (+el.dataset.sfaV || parseFloat(String(el.textContent).replace(/\./g, '').replace(',', '.')) || 0);
      el.dataset.sfaV = to; el.classList.add('sfa-num');
      if (!SFA.enabled() || from === to) { el.textContent = fmt(to); return; }
      const dur = o.dur || Math.min(1400, 450 + Math.log10(Math.abs(to - from) + 1) * 260);
      let t = 0, lastTick = 0;
      const ease = (x) => 1 - Math.pow(1 - x, 3);
      if (el._sfaC) el._sfaC.stop();
      el._sfaC = SFA.loop((dt) => {
        t += dt * 1000;
        const k = Math.min(1, t / dur), v = from + (to - from) * ease(k);
        el.textContent = fmt(v);
        if (t - lastTick > 70 && k < 1) { lastTick = t; SFA.emit('tick', v); }
        if (k >= 1) { el._sfaC = null; if (o.bump !== false) SFA.replay(el, 'sfa-bump'); if (o.done) o.done(); return false; }
        return true;
      });
    },
    // çubuk: son genişlik bir kez yazılır, dolum transform: scaleX ile (aşma payıyla)
    bar(fill, pct, o) {
      o = o || {};
      if (!fill) return;
      const old = o.from != null ? o.from : parseFloat(fill.style.width) || 0;
      fill.style.transition = 'none';
      fill.style.width = pct + '%';
      if (!SFA.enabled() || !pct) return;
      fill.classList.add('sfa-bar');
      const r = Math.max(0.001, old / pct);
      const over = pct >= old ? 1 + Math.min(0.06, 6 / pct) : 1 - Math.min(0.04, 4 / pct);
      SFA.anim(fill, [{ transform: `scaleX(${r})` }, { transform: `scaleX(${over})`, offset: 0.72 }, { transform: 'scaleX(1)' }], { duration: o.dur || 820, delay: o.delay || 0, easing: 'cubic-bezier(.3,.7,.3,1)' });
    },
    // yüzen çip: "+1 Şut", "+2.857 $" vb.
    float(anchor, text, o) {
      o = o || {};
      if (!anchor || !SFA.enabled()) return;
      const r = anchor.getBoundingClientRect();
      const d = document.createElement('div');
      d.className = 'sfa-float ' + (o.cls || '');
      d.textContent = text;
      d.style.setProperty('--x', Math.round(r.left + r.width / 2) + 'px');
      d.style.setProperty('--y', Math.round((r.top < 64 ? r.bottom + 40 : r.top - 4) + (o.dy || 0)) + 'px'); // ekran üstündeyse altta doğar
      d.style.marginLeft = '-999px'; // ölçülene kadar ekran dışı
      (o.host || document.body).appendChild(d);
      const w = d.offsetWidth; d.style.marginLeft = -w / 2 + 'px';
      if (o.delay) d.style.animationDelay = o.delay + 'ms';
      SFA.later(() => d.remove(), 1300 + (o.delay || 0));
      SFA.emit('pop');
    },
    levelUp(el) { if (!el || !SFA.enabled()) return; SFA.replay(el, 'sfa-lvl'); SFA.replay(el, 'sfa-bump'); },

    // =====================================================================
    // 5. Maç sonu: başlık düşer, skor çakılır, reyting halkası dolar,
    //    yıldızlar dolar, Maçın Oyuncusu kartı çevrilir (holografik parıltı)
    // =====================================================================
    result(host, o) {
      o = o || {};
      const on = SFA.enabled();
      const ms = host.querySelector('.ms');
      const head = host.closest('.mt-moment') ? host.closest('.mt-moment').querySelector('.mm-head') : null;
      const ring = host.querySelector('.ms-ring'), res = host.querySelector('.ms-res');
      const rating = ring ? parseFloat(ring.querySelector('b').textContent) : 0;
      // yıldızlar (reyting / 2)
      if (res && !res.querySelector('.sfa-stars')) {
        const st = document.createElement('i'); st.className = 'sfa-stars'; st.setAttribute('aria-label', `${(rating / 2).toFixed(1)} yıldız`);
        const star = '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="%c" d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>';
        const full = rating / 2;
        for (let i = 0; i < 5; i++) {
          const f = Math.max(0, Math.min(1, full - i));
          st.insertAdjacentHTML('beforeend', `<i class="sfa-star${f > 0 ? ' on' : ''}" style="--sfa-d:${(on ? 1.25 + i * 0.12 : 0).toFixed(2)}s">${star.replace('%c', 'bg')}<i class="clip" style="width:${Math.round(f * 100)}%">${star.replace('%c', 'fg')}</i></i>`);
        }
        const b = res.querySelector('b'); b.after(st);
      }
      // MOTM kartı çevirme sarmalayıcısı
      const card = host.querySelector('.motm-card');
      let wrap = card && card.parentElement.classList.contains('sfa-flipw') ? card.parentElement : null;
      if (card && !wrap) {
        wrap = document.createElement('div'); wrap.className = 'sfa-flipw';
        card.before(wrap); wrap.appendChild(card);
        const back = document.createElement('div'); back.className = 'sfa-back';
        back.innerHTML = '<small>' + (o.kicker || 'Maç sonu ödülü') + '</small><div class="q">?</div><b>Maçın Oyuncusu</b><small>Kim olacak?</small><div class="sfa-holo auto"></div>';
        wrap.appendChild(back);
        const holo = document.createElement('div'); holo.className = 'sfa-holo' + (SFA.lite() ? '' : ' auto');
        card.appendChild(holo);
        SFA.tilt(wrap, card, holo);
      }
      if (!on) { if (ring) ring.style.setProperty('--p', Math.round(rating * 10)); if (wrap) wrap.querySelector('.sfa-back').style.display = 'none'; return; }
      if (head) head.classList.add('sfa-ms-head');
      if (ms) SFA.anim(ms, [{ opacity: 0, transform: 'translate3d(0,40px,0)' }, { opacity: 1, transform: 'none' }], { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' });
      let t0 = 0;
      if (wrap) {
        const back = wrap.querySelector('.sfa-back');
        const flip = (el, a, b) => SFA.anim(el, [{ transform: `rotateY(${a}deg)` }, { transform: `rotateY(${b}deg)` }], { duration: 900, delay: 900, easing: 'cubic-bezier(.3,1.35,.45,1)' });
        SFA.anim(wrap, [{ opacity: 0, transform: 'scale(.85)' }, { opacity: 1, transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.2,1.3,.4,1)' });
        flip(back, 0, -180); flip(card, 180, 0);
        SFA.later(() => SFA.emit('whoosh'), 950);
        t0 = 1500;
      }
      // skor çakma
      const sc = res && res.querySelector('b');
      if (sc) {
        sc.classList.add('sfa-slam'); sc.style.setProperty('--sfa-d', (t0 + 200) / 1000 + 's');
        SFA.later(() => {
          SFA.emit('slam');
          const hero = res.closest('.ms-hero') || res;
          if (getComputedStyle(hero).position === 'static') hero.style.position = 'relative';
          const sh = document.createElement('i'); sh.className = 'sfa-shock'; const hr = hero.getBoundingClientRect(), sr = sc.getBoundingClientRect(); sh.style.left = (sr.left - hr.left + sr.width / 2) + 'px'; sh.style.top = (sr.top - hr.top + sr.height / 2) + 'px'; hero.appendChild(sh);
          SFA.later(() => sh.remove(), 650);
          if (ms) SFA.anim(ms, [{ transform: 'translate3d(0,0,0)' }, { transform: 'translate3d(-5px,3px,0)' }, { transform: 'translate3d(4px,-2px,0)' }, { transform: 'translate3d(-2px,1px,0)' }, { transform: 'none' }], { duration: 260, fill: 'none' });
        }, t0 + 200 + 340);
      }
      // reyting halkası (küçük eleman, --p ile conic-gradient)
      if (ring) {
        const b = ring.querySelector('b'), target = rating;
        ring.style.setProperty('--p', 0); b.textContent = '0.0';
        SFA.later(() => {
          let t = 0; const dur = 1100;
          SFA.loop((dt) => {
            t += dt * 1000; const k = Math.min(1, t / dur), e = 1 - Math.pow(1 - k, 3), v = target * e;
            ring.style.setProperty('--p', Math.round(v * 10)); b.textContent = v.toFixed(1);
            if (k >= 1) { SFA.replay(b, 'sfa-bump'); return false; }
            if ((t | 0) % 90 < 17) SFA.emit('tick');
            return true;
          });
        }, t0 + 350);
        [...res.querySelectorAll('.sfa-star')].forEach((s) => s.style.setProperty('--sfa-d', ((t0 + 700) / 1000 + [...s.parentNode.children].indexOf(s) * 0.12).toFixed(2) + 's'));
      }
      // istatistik kutuları
      [...host.querySelectorAll('.mst')].forEach((m, i) => SFA.anim(m, [{ opacity: 0, transform: 'translate3d(0,16px,0) scale(.92)' }, { opacity: 1, transform: 'none' }], { duration: 520, delay: t0 + 900 + i * 60, easing: 'cubic-bezier(.2,1.3,.4,1)' }));
      const nowBar = host.querySelector('.mse-bar .now');
      if (nowBar) { const w = parseFloat(nowBar.style.width) || 0; SFA.bar(nowBar, w, { from: parseFloat((host.querySelector('.mse-bar .was') || {}).style ? host.querySelector('.mse-bar .was').style.width : 100) || 100, delay: t0 + 1300, dur: 900 }); }
      [...host.querySelectorAll('.msx-b i')].forEach((f, i) => SFA.bar(f, parseFloat(f.style.width) || 0, { from: 0, delay: t0 + 1500 + i * 120 }));
    },
    // parmak/fare ile eğme + parıltı kayması (tek transform yazımı, rAF ile birleştirilir)
    tilt(wrap, card, holo) {
      let pend = null;
      const apply = () => { const p = pend; pend = null; if (!p) return; card.style.transform = `rotateX(${p.ry}deg) rotateY(${p.rx}deg)`; holo.style.setProperty('--sfa-hx', p.hx); };
      wrap.addEventListener('pointermove', (e) => {
        if (!SFA.enabled()) return;
        const r = wrap.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
        if (!pend) raf(apply);
        pend = { rx: (nx * 10).toFixed(2), ry: (-ny * 8).toFixed(2), hx: (nx * 50).toFixed(1) };
        card.classList.add('sfa-tilt'); holo.classList.remove('auto');
      });
      wrap.addEventListener('pointerleave', () => { card.style.transform = ''; if (!SFA.lite()) holo.classList.add('auto'); });
    },

    // =====================================================================
    // 6. Kupa töreni (DOM katmanı): ışık huzmeleri önceden bir kez
    //    küçük canvas'a çizilir → dataURL; sahnede yalnız döndürülür.
    // =====================================================================
    _rays: null,
    rays() {
      if (SFA._rays) return SFA._rays;
      const S = 256, c = document.createElement('canvas'); c.width = c.height = S;
      const g = c.getContext('2d');
      g.translate(S / 2, S / 2);
      const n = 18;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2, w = Math.PI / n * 0.55;
        const gr = g.createRadialGradient(0, 0, 0, 0, 0, S / 2);
        gr.addColorStop(0, 'rgba(255,236,170,.55)'); gr.addColorStop(0.5, 'rgba(255,214,110,.18)'); gr.addColorStop(1, 'rgba(255,214,110,0)');
        g.fillStyle = gr;
        g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, S / 2, a - w, a + w); g.closePath(); g.fill();
      }
      SFA._rays = c.toDataURL('image/png');
      return SFA._rays;
    },
    CUP: '<svg viewBox="0 0 170 210" aria-hidden="true"><defs>'
      + '<linearGradient id="sfaG1" x1="0" x2="1"><stop offset="0" stop-color="#8a5a00"/><stop offset=".28" stop-color="#ffe9a0"/><stop offset=".5" stop-color="#ffcf3f"/><stop offset=".78" stop-color="#d49a12"/><stop offset="1" stop-color="#7a4d00"/></linearGradient>'
      + '<linearGradient id="sfaG2" x1="0" x2="1"><stop offset="0" stop-color="#5a3a00"/><stop offset=".5" stop-color="#c88f14"/><stop offset="1" stop-color="#4a2f00"/></linearGradient>'
      + '<linearGradient id="sfaGl" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>'
      + '<clipPath id="sfaCc"><path d="M35 14h100c0 0 4 56-12 82-9 15-22 22-38 24-16-2-29-9-38-24C31 70 35 14 35 14z"/><rect x="72" y="118" width="26" height="30"/><path d="M50 148h70l8 22H42z"/></clipPath></defs>'
      + '<path d="M36 24c-30 0-32 46 4 52" fill="none" stroke="url(#sfaG2)" stroke-width="9" stroke-linecap="round"/><path d="M134 24c30 0 32 46-4 52" fill="none" stroke="url(#sfaG2)" stroke-width="9" stroke-linecap="round"/>'
      + '<path d="M35 14h100c0 0 4 56-12 82-9 15-22 22-38 24-16-2-29-9-38-24C31 70 35 14 35 14z" fill="url(#sfaG1)"/>'
      + '<ellipse cx="85" cy="14" rx="50" ry="6" fill="#ffe9a0"/><ellipse cx="85" cy="15" rx="44" ry="3.6" fill="#a36d06"/>'
      + '<rect x="72" y="118" width="26" height="30" fill="url(#sfaG1)"/><path d="M50 148h70l8 22H42z" fill="url(#sfaG1)"/>'
      + '<rect x="34" y="170" width="102" height="28" rx="3" fill="#1d2233"/><rect x="34" y="170" width="102" height="4" fill="#ffcf3f"/><rect x="58" y="179" width="54" height="11" rx="2" fill="#c9a24a" opacity=".9"/>'
      + '<path d="M85 40l6 12 13 2-9 9 2 13-12-6-12 6 2-13-9-9 13-2z" fill="#fff6d6" opacity=".9"/>'
      + '<g clip-path="url(#sfaCc)"><rect class="sfa-gleam" x="0" y="0" width="34" height="210" fill="url(#sfaGl)"/></g></svg>',
    // container: .cer-trophy ya da demo sahnesi. o: {bg, title, sub, year, onDone}
    trophy(container, o) {
      o = o || {};
      const L = SFA.lite();
      const wrap = document.createElement('div'); wrap.className = 'sfa-cer';
      const title = (o.big || 'ŞAMPİYON!').split('').map((ch, i) => `<span style="--i:${i}">${ch === ' ' ? '&nbsp;' : ch}</span>`).join('');
      const sparks = L ? '' : Array.from({ length: 14 }, (_, i) => `<i style="--a:${Math.round(i * 360 / 14 + (i % 2) * 9)}deg;--d:${(i % 3) * 0.04}s"></i>`).join('');
      wrap.innerHTML = `<div class="sfa-cer-bg"${o.bg ? ` style="background-image:url(${o.bg})"` : ''}></div><div class="sfa-cer-dim"></div>
        <div class="sfa-cer-rays" style="background-image:url(${SFA.rays()})"></div><div class="sfa-cer-glow"></div>
        <div class="sfa-cer-sparks">${sparks}</div><div class="sfa-cer-cup">${SFA.CUP}</div>
        <div class="sfa-cer-title" aria-label="${o.big || 'ŞAMPİYON!'}">${title}</div>${o.year ? `<div class="sfa-cer-year">${o.year}</div>` : ''}`;
      container.prepend(wrap);
      const foot = container.querySelector('.ct-foot'); if (foot) foot.classList.add('sfa-cer-foot');
      if (SFA.enabled()) { SFA.later(() => SFA.emit('slam'), 1150); SFA.later(() => SFA.confetti(wrap, { n: L ? 18 : 46 }), 1200); }
      else SFA.confetti(wrap, { n: 0 });
      return wrap;
    },
    // CSS konfeti: n parça, yalnız transform; birkaç turdan sonra kendiliğinden durur
    confetti(host, o) {
      o = o || {};
      const n = o.n == null ? 40 : o.n;
      if (!n || !SFA.enabled()) return null;
      const cols = o.colors || ['#ffd84a', '#ffffff', '#4fb3ff', '#ff8a1f', '#46e08f', '#ff5a6a'];
      const c = document.createElement('div'); c.className = 'sfa-conf';
      let h = '';
      for (let i = 0; i < n; i++) {
        const x = (i * 61.8) % 100, dx = ((i * 37) % 80) - 40, r = 360 + ((i * 97) % 540), t = 2.6 + ((i * 13) % 17) / 10, d = ((i * 7) % 23) / 10 * (o.spread || 1), w = 6 + (i % 4) * 2;
        h += `<i style="--x:${x.toFixed(1)}%;--dx:${dx}px;--r:${r}deg;--t:${t}s;--d:${d}s;--w:${w}px;--n:${o.loops || 2};--c:${cols[i % cols.length]}"></i>`;
      }
      c.innerHTML = h; host.appendChild(c);
      SFA.later(() => c.remove(), ((o.loops || 2) * 4.3 + 2.4 * (o.spread || 1)) * 1000);
      return c;
    },

    // =====================================================================
    // 7. Transfer imzası: sözleşme kartı kayar, imza çizilir, mühür, forma
    // =====================================================================
    SIG: 'M6 58c10-26 18-44 22-40 4 4-10 40-6 42 5 2 12-26 18-24 4 1-2 16 2 16 5 0 9-14 14-13 4 1 0 11 4 11 6 0 10-20 16-30 3-5 5 1 2 8-4 10-8 28-3 28 6 0 13-20 18-20 3 0 1 9 5 9 5 0 7-8 11-8 4 0 2 7 6 7 7 0 12-14 18-14 3 0 0 8 4 8 6 0 10-9 16-10M30 70c40-8 90-10 150-6',
    // o.prep: yalnız imzayı gizler (kart açılırken çağır)
    sign(box, o) {
      o = o || {};
      const svg = box.querySelector('svg'), path = svg.querySelector('path'), pen = box.querySelector('.sfa-pen');
      const L = path.getTotalLength();
      path.style.strokeDasharray = L; path.style.strokeDashoffset = L;
      if (o.prep) return Promise.resolve();
      return new Promise((res) => {
        if (!SFA.enabled()) { path.style.strokeDashoffset = 0; return res(); }
        const dur = o.dur || 1500;
        const vb = svg.viewBox.baseVal, br = box.getBoundingClientRect(), sx = br.width / vb.width, sy = br.height / vb.height;
        let t = 0; if (pen) pen.classList.add('on');
        SFA.emit('sign');
        SFA.loop((dt) => {
          t += dt * 1000; const k = Math.min(1, t / dur), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          path.style.strokeDashoffset = L * (1 - e);
          if (pen) { const p = path.getPointAtLength(L * e); pen.style.transform = `translate3d(${(p.x * sx).toFixed(1)}px,${(p.y * sy).toFixed(1)}px,0)`; }
          if (k >= 1) { if (pen) pen.classList.remove('on'); res(); return false; }
          return true;
        });
      });
    },

    // =====================================================================
    // 8. Telefon: ikondan büyüyerek uygulama açılışı (FLIP), geri küçülme
    //    screen: .ph-screen, icon: .ph-ic, home: .ph-home, app: açılan .ph-appv
    // =====================================================================
    zoomOpen(screen, icon, home, app) {
      if (!SFA.enabled()) return Promise.resolve();
      const S = screen.getBoundingClientRect(), r = icon.getBoundingClientRect();
      const sx = r.width / S.width, sy = r.height / S.height, tx = r.left - S.left, ty = r.top - S.top;
      const z = document.createElement('div'); z.className = 'sfa-zoom';
      z.style.cssText = `width:${S.width}px;height:${S.height}px;`;
      const ic = icon.cloneNode(true); ic.removeAttribute('style');
      z.innerHTML = `<div class="sfa-zc" style="background:${icon.style.background || '#334'}"></div><div class="sfa-zi"></div>`;
      const svg = icon.querySelector('svg'); if (svg) { const g = svg.cloneNode(true); g.style.cssText = `width:${S.width * 0.52}px;height:${S.height * 0.52}px`; z.querySelector('.sfa-zi').appendChild(g); }
      screen.appendChild(z);
      const rad = 15;
      const ease = 'cubic-bezier(.2,.9,.25,1)';
      const D = 420;
      SFA.anim(z, [{ transform: `translate3d(${tx}px,${ty}px,0) scale(${sx},${sy})`, borderRadius: `${rad / sx}px / ${rad / sy}px` }, { transform: 'none', borderRadius: '0px' }], { duration: D, easing: ease });
      SFA.anim(z.querySelector('.sfa-zi'), [{ opacity: 1 }, { opacity: 0 }], { duration: 130, easing: 'linear' });
      icon.style.visibility = 'hidden';
      if (home) SFA.anim(home, [{ transform: 'none', opacity: 1 }, { transform: 'scale(1.14)', opacity: 0 }], { duration: 360, easing: 'cubic-bezier(.3,.6,.3,1)', fill: 'none' });
      SFA.emit('whoosh');
      return new Promise((res) => SFA.later(() => {
        if (app) SFA.anim(app, [{ opacity: 0, transform: 'scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 220, easing: 'ease-out', fill: 'none' });
        SFA.anim(z, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: 'linear' }).onfinish = () => z.remove();
        icon.style.visibility = '';
        res();
      }, D - 90));
    },
    zoomClose(screen, icon, home, app) {
      if (!SFA.enabled() || !icon) return Promise.resolve();
      const S = screen.getBoundingClientRect(), r = icon.getBoundingClientRect();
      const sx = r.width / S.width, sy = r.height / S.height, tx = r.left - S.left, ty = r.top - S.top;
      const z = document.createElement('div'); z.className = 'sfa-zoom';
      z.style.cssText = `width:${S.width}px;height:${S.height}px;`;
      z.innerHTML = `<div class="sfa-zc" style="background:${icon.style.background || '#334'}"></div><div class="sfa-zi" style="opacity:0"></div>`;
      const svg = icon.querySelector('svg'); if (svg) { const g = svg.cloneNode(true); g.style.cssText = `width:${S.width * 0.52}px;height:${S.height * 0.52}px`; z.querySelector('.sfa-zi').appendChild(g); }
      screen.appendChild(z);
      icon.style.visibility = 'hidden';
      const D = 380;
      SFA.anim(z.querySelector('.sfa-zc'), [{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 1 }], { duration: D });
      SFA.anim(z.querySelector('.sfa-zi'), [{ opacity: 0 }, { opacity: 0, offset: 0.55 }, { opacity: 1 }], { duration: D });
      SFA.anim(z, [{ transform: 'none', borderRadius: '0px' }, { transform: `translate3d(${tx}px,${ty}px,0) scale(${sx},${sy})`, borderRadius: `${15 / sx}px / ${15 / sy}px` }], { duration: D, easing: 'cubic-bezier(.3,.8,.25,1.08)' });
      if (home) SFA.anim(home, [{ transform: 'scale(1.14)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: D + 40, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'none' });
      return new Promise((res) => SFA.later(() => { z.remove(); icon.style.visibility = ''; SFA.anim(icon, [{ transform: 'scale(.92)' }, { transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.2,1.4,.4,1)', fill: 'none' }); res(); }, D));
    },
    // telefon açılışında ikonlar dalga hâlinde belirir (merkezden uzaklığa göre gecikme)
    appsIn(home) {
      if (!home || !SFA.enabled()) return;
      const items = [...home.querySelectorAll('.ph-wg, .ph-app')];
      const hr = home.getBoundingClientRect(), cx = hr.width / 2;
      items.forEach((el) => { const r = el.getBoundingClientRect(); const d = Math.hypot(r.left + r.width / 2 - hr.left - cx, r.top - hr.top); el.style.setProperty('--sfa-i', Math.round(d / 28)); });
      SFA.replay(home, 'sfa-apps-in');
      SFA.later(() => home.classList.remove('sfa-apps-in'), 1300);
    },

    init() {
      if (SFA.off()) document.documentElement.classList.add('sfa-off');
      if (mq.addEventListener) mq.addEventListener('change', () => { /* enabled() her çağrıda okur */ });
    },
  };
  window.SFA = SFA;
  SFA.init();
})();
