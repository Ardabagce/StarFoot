// Gerçek hayat (1.0.19): ehliyet sınavı, açık öğretim üniversite, yabancı dil kursu, özel günler.
const LX_LANG = { 'Türkiye': 'tr', 'İngiltere': 'en', 'İskoçya': 'en', 'ABD': 'en', 'İspanya': 'es', 'Meksika': 'es', 'Arjantin': 'es', 'Brezilya': 'pt', 'Portekiz': 'pt', 'Almanya': 'de', 'Avusturya': 'de', 'İsviçre': 'de', 'Fransa': 'fr', 'Belçika': 'fr', 'İtalya': 'it', 'Hollanda': 'nl', 'Japonya': 'ja', 'Suudi Arabistan': 'ar', 'Yunanistan': 'el', 'Danimarka': 'da', 'Hırvatistan': 'hr', 'Çekya': 'cs', 'Polonya': 'pl', 'Ukrayna': 'uk' };
const LX_NAT_LANG = { USA: 'en', ENG: 'en', SCO: 'en', WAL: 'en', IRL: 'en', NIR: 'en', AUS: 'en', NZL: 'en', CAN: 'en', JAM: 'en', TRI: 'en', ESP: 'es', MEX: 'es', ARG: 'es', URU: 'es', COL: 'es', CHI: 'es', PER: 'es', ECU: 'es', PAR: 'es', VEN: 'es', BOL: 'es', CRC: 'es', PAN: 'es', HON: 'es', SLV: 'es', GUA: 'es', BRA: 'pt', POR: 'pt', ANG: 'pt', CPV: 'pt', GER: 'de', AUT: 'de', SUI: 'de', FRA: 'fr', BEL: 'fr', SEN: 'fr', CIV: 'fr', CMR: 'fr', MLI: 'fr', GUI: 'fr', GAB: 'fr', COD: 'fr', BFA: 'fr', BEN: 'fr', HAI: 'fr', LUX: 'fr', ITA: 'it', NED: 'nl', CUW: 'nl', JPN: 'ja', KSA: 'ar', EGY: 'ar', MAR: 'ar', ALG: 'ar', TUN: 'ar', QAT: 'ar', JOR: 'ar', IRQ: 'ar', UAE: 'ar', OMA: 'ar', BHR: 'ar', SYR: 'ar', LBN: 'ar', TUR: 'tr', GRE: 'el', DEN: 'da', CRO: 'hr', CZE: 'cs', POL: 'pl', UKR: 'uk' };
const LX_LNAME = { tr: 'Türkçe', en: 'İngilizce', es: 'İspanyolca', pt: 'Portekizce', de: 'Almanca', fr: 'Fransızca', it: 'İtalyanca', nl: 'Felemenkçe', ja: 'Japonca', ar: 'Arapça', el: 'Yunanca', da: 'Danca', hr: 'Hırvatça', cs: 'Çekçe', pl: 'Lehçe', uk: 'Ukraynaca' };
const LX_BAYRAM = ['TUR', 'KVX', 'PLE', 'LBY', 'MTN', 'SDN', 'KUW', 'TKM', 'YEM', 'AFG', 'MDV', 'BAN', 'PAK', 'MAS', 'BRU', 'COM', 'NIG', 'GAM', 'SLE', 'KSA', 'EGY', 'MAR', 'ALG', 'TUN', 'QAT', 'JOR', 'IRQ', 'UAE', 'OMA', 'BHR', 'SYR', 'LBN', 'IRN', 'AZE', 'IDN', 'SEN', 'MLI', 'GUI', 'ALB', 'BIH', 'KAZ', 'UZB', 'KGZ', 'TJK', 'BFA'];

const LifeX = {
  on() { return typeof FEAT_V19 !== 'undefined' && FEAT_V19 && Game.state && Game.state.mode !== 'wc'; },
  // ---------- dil ----------
  native(p) { return LX_NAT_LANG[p.nation] || p.nation; },
  clubLang() {
    const c = Game.club(); const L = c && LEAGUES.find((l) => l.id === c.league);
    return L ? LX_LANG[L.country] || null : null;
  },
  langLvl(p, l) { return l === LifeX.native(p) ? 3 : ((p.langs || {})[l] || 0); },
  // ---------- haftalık ----------
  week(s) {
    if (!LifeX.on() || s.pendingLX) return;
    const p = s.player, n = Game.rounds(), r = s.season.round;
    s.lifex = s.lifex && s.lifex.y === s.season.year ? s.lifex : { y: s.season.year, done: {} };
    const D = s.lifex.done;
    if (p.bm == null) p.bm = U.randi(0, 11);
    // takvim: sezon Ağustos'ta başlar, Mayıs'ta biter
    const month = (7 + Math.floor((r / n) * 10)) % 12;
    const ev = (k) => { D[k] = 1; s.pendingLX = k; };
    if (p.age >= 18 && !p.license && !D.lic && !p.licAsked) { p.licAsked = 1; return ev('lic'); }
    if (p.age >= 18 && p.age <= 30 && !p.uni && !p.uniAsked && (!s.school || s.school.done || p.age > 18)) { p.uniAsked = 1; return ev('uni'); }
    if (month === 0 && !D.ny) return ev('ny');
    if (month === 4 && !D.md) return ev('md');
    if (month === p.bm && !D.bd) return ev('bd');
    if (LX_BAYRAM.includes(p.nation)) {
      if (s.lifex.bm == null) s.lifex.bm = U.pick([9, 10, 11, 1, 2, 3]);
      if (month === s.lifex.bm && !D.bay) return ev('bay');
    }
    // yabancı dil
    const cl = !Game.isYouth() && !Game.inStreet() ? LifeX.clubLang() : null;
    if (cl && LifeX.langLvl(p, cl) < 3) {
      p.rel.team = U.clamp(p.rel.team - 0.12, 0, 100);
      if (p.langFor !== cl) { p.langFor = cl; Game.news(`🗣️ Yeni ülkende henüz ${LX_LNAME[cl] || 'yerel dil'} bilmiyorsun. Dil kursu takım arkadaşlarınla anlaşmanı kolaylaştırır.`, ''); }
      if (U.chance(0.12)) return ev('lang');
    }
  },
  show() {
    const s = Game.state, k = s.pendingLX, p = s.player;
    s.pendingLX = null;
    if (!LifeX.on()) return Game.checkPending();
    const done = (msg, type) => { Game.save(); Game.render(); if (msg) Game.toast(msg, type || 'good'); Game.checkPending(); };
    const fam = (v) => (p.rel.family = U.clamp((p.rel.family || 60) + v, 0, 100));
    const tag = (t) => `<div class="ev-tag">${t}</div>`;
    const E = {
      lic: () => Game.modal(`${tag('Ehliyet')}<h3>18 yaşına girdin! Ehliyet sınavına girmek ister misin?</h3><p>Geçersen araba ve motosiklet alabilirsin.</p>`, [
        { t: '🚗 Sınava gir', fn: () => LifeX.licenseExam(() => done('')) },
        { t: 'Sonra', cls: 'btn-ghost', fn: () => done('Ehliyet sınavına istediğin zaman Yaşam sekmesinden girebilirsin.', '') },
      ]),
      uni: () => {
        const fee = 1500;
        Game.modal(`${tag('Üniversite')}<h3>Açık öğretimde Spor Yöneticiliği okumak ister misin?</h3><p>Futbolu bırakmadan okuyabilirsin. Her sezon sonunda bir sınav var, 4 yılda mezun olursun. Mezun olursan teknik direktörlükte işin kolaylaşır.</p><p class="muted">Yıllık harç: ${U.money(fee)}</p>`, [
          { t: '🎓 Kaydol', fn: () => { p.money -= fee; p.uni = { yr: 1, pass: 0 }; Game.news('🎓 Açık öğretimde Spor Yöneticiliği bölümüne kaydoldun!', 'good'); fam(6); done('Kaydın yapıldı. Sınav sezon sonunda.'); } },
          { t: 'Şimdilik değil', cls: 'btn-ghost', fn: () => done('', '') },
        ]);
      },
      ny: () => Game.modal(`${tag('Yılbaşı')}<h3>Yılbaşı gecesi! Yeni yıla nerede gireceksin?</h3>`, [
        { t: '🏠 Ailemle', fn: () => { fam(8); Player.addMorale(p, 4); done('Ailenle sıcacık bir yılbaşı geçirdin.'); } },
        { t: '🎉 Takım arkadaşlarımla', fn: () => { Player.addRel(p, 'team', 5); Player.addEnergy(p, -8); Player.addMorale(p, 3); done('Takımla eğlenceli bir gece geçirdin.'); } },
      ]),
      md: () => Game.modal(`${tag('Anneler Günü')}<h3>Bugün Anneler Günü! Annen için ne yapacaksın?</h3>`, [
        { t: '💐 Çiçek ve hediye gönder', fn: () => { const c = Math.max(100, Math.round(Game.weeklyIncome() * 0.08)); p.money -= c; fam(10); Player.addMorale(p, 4); done(`Annen çok duygulandı. (${U.money(c)})`); } },
        { t: '📞 Telefonla ara', fn: () => { fam(4); done('Annen sesini duyduğuna çok sevindi.'); } },
      ]),
      bd: () => {
        Player.addMorale(p, 6); Player.addRel(p, 'team', 3); fam(3);
        if (typeof Social !== 'undefined' && Social.post) try { Social.post('life', 'Bugün doğum günüm! Bütün mesajlar için teşekkürler.', 1.4); } catch (e) { /* yok */ }
        Game.modal(`${tag('Doğum günü')}<h3>🎂 Bugün doğum günün! Takım arkadaşların antrenmanda sürpriz pasta getirdi.</h3>`, [{ t: 'Teşekkürler!', cls: 'btn-big', fn: () => done('Moral +6') }]);
      },
      bay: () => Game.modal(`${tag('Bayram')}<h3>Bayram geldi! Ailenin yanına gitmek için hocandan izin isteyecek misin?</h3>`, [
        { t: '🏡 Ailemin yanına git', fn: () => { fam(12); Player.addMorale(p, 5); if (!Game.isYouth()) Player.addRel(p, 'coach', -2); done('Bayramı ailenle geçirdin, büyüklerinin elini öptün.'); } },
        { t: '⚽ Kalıp çalışacağım', cls: 'btn-ghost', fn: () => { fam(-4); Player.addRel(p, 'coach', 3); done('Hocan özverini fark etti. Ailen biraz buruk.', ''); } },
      ]),
      lang: () => {
        const l = LifeX.clubLang(); if (!l) return done('');
        const lv = LifeX.langLvl(p, l);
        Game.modal(`${tag('Dil kursu')}<h3>Kulüp ${LX_LNAME[l] || ''} kursu ayarladı. Bu hafta derse katılacak mısın?</h3><p class="muted">Seviye: ${lv}/3</p>`, [
          { t: '📖 Derse git', fn: () => {
            p.langs = p.langs || {}; p.langs[l] = lv + 1; Player.addEnergy(p, -4);
            if (lv + 1 >= 3) { Player.addRel(p, 'team', 8); Player.addRel(p, 'coach', 4); Game.news(`🗣️ Artık ${LX_LNAME[l] || 'yerel dili'} akıcı konuşuyorsun! Takım arkadaşlarınla iletişimin çok güçlendi.`, 'good'); done('Dil seviyesi 3/3'); }
            else done(`Dil seviyesi ${lv + 1}/3`);
          } },
          { t: 'Bu hafta değil', cls: 'btn-ghost', fn: () => done('', '') },
        ]);
      },
    };
    (E[k] || (() => done('')))();
  },
  // ---------- ehliyet sınavı (tahtada trafik levhaları) ----------
  SIGNS: {
    stop: { v: '<polygon points="140,40 180,40 200,62 200,102 180,124 140,124 120,102 120,62" fill="#d42a2a" stroke="#fff" stroke-width="4"/><text x="160" y="92" text-anchor="middle" font-size="22" font-weight="900" fill="#fff" font-family="Arial">STOP</text>', a: 'Dur' },
    noentry: { v: '<circle cx="160" cy="82" r="44" fill="#d42a2a" stroke="#fff" stroke-width="4"/><rect x="132" y="75" width="56" height="14" fill="#fff"/>', a: 'Girişi olmayan yol' },
    yield: { v: '<polygon points="116,44 204,44 160,122" fill="#fff" stroke="#d42a2a" stroke-width="9" stroke-linejoin="round"/>', a: 'Yol ver' },
    nopark: { v: '<circle cx="160" cy="82" r="44" fill="#1f5fbf" stroke="#d42a2a" stroke-width="9"/><line x1="130" y1="52" x2="190" y2="112" stroke="#d42a2a" stroke-width="9"/>', a: 'Park yasak' },
  },
  licQ() {
    const Q = [];
    const keys = Object.keys(LifeX.SIGNS);
    const k = U.pick(keys), S = LifeX.SIGNS[k];
    Q.push(School.pack('sign', 'Bu levha ne anlama gelir?', S.v, S.a, keys.filter((x) => x !== k).map((x) => LifeX.SIGNS[x].a)));
    const lim = U.pick([30, 50, 70, 90]);
    Q.push(School.pack('speed', 'Bu levhayı gördüğünde en fazla kaç km/s hızla gidebilirsin?', `<circle cx="160" cy="82" r="44" fill="#fff" stroke="#d42a2a" stroke-width="9"/><text x="160" y="96" text-anchor="middle" font-size="38" font-weight="900" fill="#111" font-family="Arial">${lim}</text>`, String(lim), [lim + 20, lim - 10, lim + 40, 120].map(String)));
    Q.push(U.chance(0.5)
      ? School.pack('light', 'Işık bu renkteyken ne yaparsın?', '<rect x="138" y="30" width="44" height="110" rx="10" fill="#222" stroke="#fff" stroke-width="3"/><circle cx="160" cy="52" r="13" fill="#ff3b30"/><circle cx="160" cy="85" r="13" fill="#4a3b00"/><circle cx="160" cy="118" r="13" fill="#0b3b18"/>', 'Dururum', ['Hızlanırım', 'Yavaşça geçerim', 'Korna çalarım'])
      : School.pack('zebra', 'Yaya geçidinde biri karşıya geçiyorsa ne yaparsın?', '<rect x="60" y="70" width="200" height="40" fill="#555"/>' + [0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${72 + i * 26}" y="72" width="14" height="36" fill="#fff"/>`).join('') + '<circle cx="160" cy="50" r="8" fill="#ffd25a"/><rect x="154" y="58" width="12" height="18" rx="4" fill="#ffd25a"/>', 'Durup yol veririm', ['Korna çalarım', 'Hızlanırım', 'Şerit değiştiririm']));
    return Q;
  },
  licenseExam(after) {
    const p = Game.p;
    const qs = LifeX.licQ();
    let ok = 0;
    const run = (i) => (i >= qs.length ? Promise.resolve() : School.ask(qs[i], `<div class="ev-tag">Ehliyet sınavı</div><h3>Soru ${i + 1}/${qs.length}</h3>`, 'Ehliyet').then((r) => { if (r) ok++; return run(i + 1); }));
    run(0).then(() => {
      const pass = ok >= 2;
      if (pass) { p.license = 1; Player.addMorale(p, 6); Game.news('🚗 Ehliyetini aldın! Artık araba kullanabilirsin.', 'good'); }
      Game.save();
      Game.modal(`<div class="ev-tag">Ehliyet sınavı</div><div class="sc-grade ${pass ? 'g5' : 'g1'}"><b>${ok}/${qs.length}</b><span>${pass ? 'Geçtin!' : 'Kaldın'}</span></div><p>${pass ? 'Tebrikler, ehliyetin hayırlı olsun!' : 'Üzülme, istediğin zaman tekrar girebilirsin.'}</p>`, [{ t: 'Tamam', fn: () => { if (after) after(pass); } }]);
    });
  },
  // araba/motor almadan önce ehliyet
  needLicense(it) { const p = Game.p; return LifeX.on() && it && (it.art === 'car' || it.art === 'moto') && !p.license && !(p.items || []).some((id) => { const x = ITEMS.find((i) => i.id === id); return x && (x.art === 'car' || x.art === 'moto'); }); },
  // ---------- üniversite sınavı (sezon sonu) ----------
  uniYear() {
    const s = Game.state, p = s && s.player;
    if (!LifeX.on() || !p || !p.uni || p.uni.done || p.uni.y === s.season.year) return Promise.resolve();
    p.uni.y = s.season.year;
    const qs = [0, 1, 2].map(() => School.gen(18));
    let ok = 0;
    const run = (i) => (i >= qs.length ? Promise.resolve() : School.ask(qs[i], `<div class="ev-tag">Açık öğretim · ${p.uni.yr}. sınıf</div><h3>Soru ${i + 1}/${qs.length}</h3>`, 'Sınav').then((r) => { if (r) ok++; return run(i + 1); }));
    return new Promise((res) => Game.modal(`<div class="ev-tag">Üniversite</div><h3>Açık öğretim yıl sonu sınavı</h3><p>${p.uni.yr}. sınıf · 3 soru, 2 doğru yeterli.</p>`, [{ t: 'Sınava gir', cls: 'btn-big', fn: () => run(0).then(() => {
      const pass = ok >= 2;
      let msg;
      if (pass) {
        p.uni.pass++; if (typeof School !== 'undefined') School.addIq(p, 1.5);
        if (p.uni.pass >= 4) { p.uni.done = s.season.year; School.addIq(p, 3); Game.news('🎓 Spor Yöneticiliği bölümünden mezun oldun! Diplomanı aldın.', 'good'); msg = 'Mezun oldun! Teknik direktörlük kariyerinde bu diploma işine yarayacak.'; }
        else { p.uni.yr++; msg = `Sınıfı geçtin! Sıradaki: ${p.uni.yr}. sınıf.`; }
        p.money -= 1500;
      } else msg = 'Bu yıl geçemedin. Gelecek yıl tekrar deneyeceksin.';
      Game.save();
      Game.modal(`<div class="ev-tag">Üniversite</div><div class="sc-grade ${pass ? 'g5' : 'g1'}"><b>${ok}/3</b><span>${pass ? 'Geçtin' : 'Kaldın'}</span></div><p>${msg}</p>`, [{ t: 'Devam', fn: res }]);
    }) }]));
  },
  // Yaşam sekmesi kartı
  card() {
    if (!LifeX.on()) return '';
    const p = Game.p, cl = LifeX.clubLang();
    const rows = [];
    if (p.age >= 18) rows.push(`<div class="lx-r"><span>🚗 Ehliyet</span><b>${p.license ? 'Var' : 'Yok'}</b>${p.license ? '' : '<button class="btn btn-ghost" onclick="LifeX.licenseExam(() => Game.render())">Sınava gir</button>'}</div>`);
    if (p.uni) rows.push(`<div class="lx-r"><span>🎓 Açık öğretim</span><b>${p.uni.done ? 'Mezun' : `${p.uni.yr}. sınıf`}</b></div>`);
    if (cl && cl !== LifeX.native(p)) rows.push(`<div class="lx-r"><span>🗣️ ${LX_LNAME[cl] || ''}</span><b>${LifeX.langLvl(p, cl)}/3</b></div>`);
    if (!rows.length) return '';
    return `<section class="card lx-card"><div class="card-h"><span>${Icon('life')} Belgeler ve beceriler</span></div>${rows.join('')}</section>`;
  },
  bind(root) {
    const b = root && root.querySelector('#lx-lic');
    if (b) b.onclick = () => LifeX.licenseExam(() => Game.render());
  },
};
