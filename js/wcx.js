// Dünya Şampiyonası paketi genişlemesi:
// birden çok turnuvalı kariyer, rakip analizi ve taktik, turnuva hedefleri ve çıkartma albümü,
// ülke coşkusu, kamp dramaları, ödül gecesi ve paylaşılabilir turnuva kartı.

const WC_MAX_CUPS = 4;
const WC_HOSTS = { 2026: ['USA', 'MEX', 'CAN'], 2030: ['ESP', 'POR', 'MAR'], 2034: ['KSA'] };
const WC_HOST_BIDS = [['BRA', 'ARG'], ['ENG', 'SCO'], ['ITA', 'TUR'], ['NED', 'BEL'], ['JPN', 'KOR'], ['AUS', 'NZL'], ['GER', 'AUT']];

// Rakip oyun tarzları ve en uygun taktik
const WC_STYLES = [
  { id: 'high', t: 'Savunma çizgisi yüksek, arkası boş kalıyor.', best: 'att' },
  { id: 'slow', t: 'Savunması ağır, hızlı hücumlara açık.', best: 'att' },
  { id: 'block', t: 'Kalabalık savunup kontra atak arıyor.', best: 'bal' },
  { id: 'set', t: 'Duran toplarda tehlikeli, yorulunca açılıyor.', best: 'bal' },
  { id: 'star', t: 'Her şey yıldızına bağlı, onu durdurmak gerek.', best: 'def' },
  { id: 'power', t: 'Fiziksel ve agresif oynuyor, baskı kuruyor.', best: 'def' },
];
const WC_TACS = { att: 'Hücum', bal: 'Denge', def: 'Savunma' };

// Çıkartma albümü: her biri bir turnuva hedefi
const WC_STK = [
  { id: 'debut', ic: 'shield', t: 'İlk forma', d: 'Dünya Şampiyonası\'nda ilk kez sahaya çık' },
  { id: 'first', ic: 'ball', t: 'İlk gol', d: 'Dünya Şampiyonası\'nda ilk golünü at' },
  { id: 'brace', ic: 'ball', t: 'Çifte vuruş', d: 'Bir maçta 2 gol at' },
  { id: 'hat', ic: 'fire', t: 'Hat-trick', d: 'Bir maçta 3 gol at' },
  { id: 'assist2', ic: 'boot', t: 'Oyun kurucu', d: 'Bir maçta 2 asist yap' },
  { id: 'motm', ic: 'star', t: 'Maçın adamı', d: 'Bir turnuva maçında maçın adamı seçil' },
  { id: 'r9', ic: 'star', t: 'Kusursuz gece', d: 'Bir maçta 9.0 ve üstü reyting al' },
  { id: 'giant', ic: 'shield', t: 'Dev avcısı', d: 'Senden en az 8 puan güçlü bir takımı yen' },
  { id: 'clean', ic: 'shield', t: 'Kale kilitli', d: 'Defans ya da kaleci olarak gol yemeden kazan' },
  { id: 'kogoal', ic: 'fire', t: 'Eleme golü', d: 'Eleme turlarında gol at' },
  { id: 'pens', ic: 'whistle', t: 'Soğukkanlı', d: 'Penaltı atışlarında penaltını gole çevir' },
  { id: 'fgoal', ic: 'star', t: 'Finalde gol', d: 'Dünya Şampiyonası finalinde gol at' },
  { id: 'unbeat', ic: 'table', t: 'Namağlup', d: 'Grup aşamasını yenilgisiz tamamla' },
  { id: 'gtop', ic: 'table', t: 'Grup lideri', d: 'Grubunu birinci bitir' },
  { id: 'qf', ic: 'globe', t: 'Son 8', d: 'Çeyrek finale yüksel' },
  { id: 'final', ic: 'globe', t: 'Finalist', d: 'Finale yüksel' },
  { id: 'champ', ic: 'star', t: 'Dünya şampiyonu', d: 'Dünya Şampiyonası\'nı kazan' },
  { id: 'fairy', ic: 'heart', t: 'Masal', d: 'Gücü 73\'ün altındaki bir ülkeyle yarı finale çık' },
  { id: 'boot', ic: 'boot', t: 'Gol kralı', d: 'Turnuvanın gol kralı ol' },
  { id: 'gstar', ic: 'star', t: 'Altın Yıldız', d: 'Turnuvanın en iyi oyuncusu seçil' },
  { id: 'young', ic: 'fire', t: 'Geleceğin yıldızı', d: 'En iyi genç oyuncu ödülünü kazan' },
  { id: 'g5', ic: 'ball', t: 'Golcü', d: 'Bir turnuvada 5 gol at' },
  { id: 'cap', ic: 'team', t: 'Kaptan', d: 'Kaptanlık bandını tak' },
  { id: 'hype', ic: 'fans', t: 'Ülke ayakta', d: 'Ülkedeki coşkuyu 100\'e çıkar' },
  { id: 'cups4', ic: 'globe', t: 'Dört turnuva', d: '4 Dünya Şampiyonası\'nda forma giy' },
  { id: 'titles2', ic: 'star', t: 'Çifte zafer', d: '2 kez dünya şampiyonu ol' },
];

// Kamp dramaları (kariyerin ilerleyen turnuvalarında farklı olaylar)
WC_EVENTS.push(
  { id: 'armband', t: 'Hoca seni odasına çağırdı ve kaptanlık bandını uzattı: "Bu takımı sahada sen taşıyabilir misin?"',
    cond: (p, s) => !s.wc.captain && s.wc.phase === 'camp' && ((s.wc.cupNo || 1) >= 2 || p.fame >= 30), o: [
    { t: 'Bandı tak', fx: (p, s) => { s.wc.captain = true; Player.addRel(p, 'coach', 5); Player.addRel(p, 'team', 4); Player.addMorale(p, 6); WC.stick('cap'); return 'Artık takımın kaptanısın! Soyunma odası sana bakıyor.'; } },
    { t: 'Henüz hazır değilim', fx: (p) => { Player.addRel(p, 'team', 2); return 'Alçakgönüllülüğün takdir topladı. Bant tecrübeli bir arkadaşında kaldı.'; } },
  ] },
  { id: 'fight', mate: true, t: 'Antrenmanda {} ile pozisyon yüzünden tartıştınız. Soyunma odası gergin.', o: [
    { t: 'Özür dile, barış', fx: (p) => { Player.addRel(p, 'team', 5); Player.addMorale(p, -1); return 'Tokalaştınız. Takımda hava yumuşadı.'; } },
    { t: 'Geri adım atma', fx: (p) => { Player.addRel(p, 'team', -6); Player.addRel(p, 'coach', 2); Player.addMorale(p, 3); return 'Hırsın hocanın hoşuna gitti ama bazı arkadaşların sana küs.'; } },
  ] },
  { id: 'scare', t: 'Sabah uyandığında dizinde bir şişlik var. Doktorlar emin değil.', o: [
    { t: 'Taramaya gir, risk alma', fx: (p, s) => { if (U.chance(0.5)) { s.wc.injDays = Math.max(s.wc.injDays || 0, 1); return 'Küçük bir ödem çıktı: bir gün dinlenmen gerekiyor.'; } Player.addEnergy(p, 4); return 'Temiz çıktı! İçin rahatladı.'; } },
    { t: 'Kimseye söyleme, oyna', fx: (p, s) => { if (U.chance(0.3)) { s.wc.injDays = Math.max(s.wc.injDays || 0, 2); return 'Ağrı arttı: 2 gün sahalardan uzaksın.'; } Player.addRel(p, 'coach', 3); return 'Dişini sıktın, ağrı da geçti.'; } },
  ] },
  { id: 'rumor', cond: (p) => p.fame >= 15, t: 'Bir gazete, büyük bir kulübün seninle ilgilendiğini yazdı. Kamp bu haberi konuşuyor.', o: [
    { t: 'Tek odağım turnuva', fx: (p) => { Player.addRel(p, 'coach', 4); return 'Hoca sözlerini takımın önünde örnek gösterdi.'; } },
    { t: 'Gülümse, yorum yapma', fx: (p) => { Player.addFame(p, 1.5); Social.ensure(p).followers += 3000; Player.addRel(p, 'coach', -2); return 'Sosyal medyada adın gündem oldu.'; } },
  ] },
  { id: 'kid', t: 'Hastanede tedavi gören küçük bir taraftar sana mektup yazmış: "Bir gol de benim için at."', o: [
    { t: 'Görüntülü ara', fx: (p, s) => { Player.addMorale(p, 8); Player.addRel(p, 'fans', 5); WC.hypeAdd(4); return 'Çocuğun yüzündeki gülümseme sana güç verdi.'; } },
    { t: 'İmzalı forma gönder', fx: (p) => { Player.addRel(p, 'fans', 3); WC.hypeAdd(2); return 'Formanı alınca sevinçten havalara uçmuş.'; } },
  ] },
  { id: 'leak', cond: (p, s) => s.wc.phase !== 'camp', t: 'Takımın taktik planı sosyal medyaya sızdı! Hoca sızdıranı arıyor.', o: [
    { t: 'Sessiz kal', fx: (p) => { Player.addRel(p, 'coach', 1); return 'Fırtına bir gün sonra dindi.'; } },
    { t: 'Takımı topla, odağı geri getir', fx: (p, s) => { Player.addRel(p, 'team', 4); Player.addRel(p, 'coach', 3); s.wc.boost = Math.min(0.03, (s.wc.boost || 0) + 0.01); return 'Liderliğin takımı bir araya getirdi.'; } },
  ] },
  { id: 'oldmate', opp: true, cond: (p, s) => s.wc.phase !== 'camp', t: 'Sıradaki rakipte eski bir takım arkadaşın {} var. Sana mesaj attı: "Sahada acımak yok!"', o: [
    { t: 'Şakayla karşılık ver', fx: (p) => { Player.addMorale(p, 4); return 'Maç öncesi atışma sosyal medyada çok güldürdü.'; } },
    { t: '"Görüşürüz sahada"', fx: (p) => { Player.addMorale(p, 2); WC.hypeAdd(2); return 'Mesajın manşetlere taşındı.'; } },
  ] },
  { id: 'boots', cond: (p) => p.fame >= 20, t: 'Bir krampon markası turnuva için sana özel tasarım krampon göndermek istiyor.', o: [
    { t: 'Kabul et', fx: (p) => { p.money += 150000; Player.addFame(p, 1); return 'Yeni kramponların turnuvanın en çok konuşulanı oldu.'; } },
    { t: 'Turnuvada dikkat dağıtmasın', fx: (p) => { Player.addRel(p, 'coach', 3); return 'Hoca profesyonelliğini beğendi.'; } },
  ] },
);

Object.assign(WC, {
  // ---------- Ev sahipleri ----------
  hostsFor(year, all) {
    const ok = (c) => all.some((n) => n.code === c);
    let h = WC_HOSTS[year];
    if (!h) h = U.pick(WC_HOST_BIDS);
    h = h.filter(ok);
    return h.length ? h : ['USA', 'MEX', 'CAN'].filter(ok);
  },

  // ---------- Ülke coşkusu ----------
  hypeAdd(v) {
    const w = Game.state.wc;
    const before = w.hype == null ? 40 : w.hype;
    w.hype = U.clamp(before + v, 0, 100);
    if (before < 80 && w.hype >= 80) Game.news(`Coşku zirvede! ${WC.natOf(w.nat).name} meydanlarına dev ekranlar kuruldu, sokaklar bayraklarla doldu.`, 'good');
    if (w.hype >= 100) WC.stick('hype');
  },
  hypeText(v) {
    return v >= 80 ? 'Ülke sokaklara döküldü! Herkes senin adını konuşuyor.'
      : v >= 55 ? 'Meydanlara dev ekranlar kuruldu, sokaklar bayraklarla dolu.'
        : v >= 30 ? 'Taraftarlar maçları kafelerde, evlerde heyecanla izliyor.'
          : 'Ülkede beklenti düşük, kimse pek umutlu değil.';
  },
  hypeCard() {
    const w = Game.state.wc;
    if (w.phase === 'done' || w.hype == null) return '';
    return `<section class="card wc-hype"><div class="card-h"><span>${Icon('fans')} Ülkede coşku</span><b class="wc-hv">${Math.round(w.hype)}</b></div>
      ${UI.bar(w.hype, 'c-morale')}<p class="muted">${WC.hypeText(w.hype)}</p></section>`;
  },

  // ---------- Rakip analizi ve taktik ----------
  styleOf(code) {
    let h = 0;
    for (const ch of code + (Game.state.wc.year || 0)) h = (h * 31 + ch.charCodeAt(0)) % 9973;
    return WC_STYLES[h % WC_STYLES.length];
  },
  form(code) {
    const w = Game.state.wc;
    const res = [];
    w.gl.forEach((m) => { if (m.h === code || m.a === code) { const f = m.h === code ? m.hs : m.as, a = m.h === code ? m.as : m.hs; res.push(f > a ? 'G' : f < a ? 'M' : 'B'); } });
    if (w.ko) w.ko.log.forEach((m) => { if (m.h === code || m.a === code) res.push(m.w === code ? 'G' : 'M'); });
    return res.slice(-3);
  },
  scout(opp, friendly) {
    const w = Game.state.wc;
    if (!opp) return '';
    const st = WC.styleOf(opp);
    const them = WC.team(opp), me = WC.natOf(w.nat);
    const form = WC.form(opp);
    const diff = them.rating - me.rating;
    const know = (w.boost || 0) > 0;
    return `<div class="wc-scout">
      <div class="lbl">Rakip analizi</div>
      <div class="sc-row"><span>Yıldızı</span><b>${U.esc(them.roster[0].n)}</b></div>
      <div class="sc-row"><span>Güç farkı</span><b class="${diff > 0 ? 'bad' : 'good'}">${diff > 0 ? '+' : ''}${diff}</b></div>
      ${form.length ? `<div class="sc-row"><span>Form</span><b class="sc-form">${form.map((x) => `<i class="f-${x}">${x}</i>`).join('')}</b></div>` : ''}
      <div class="sc-row"><span>Oyun tarzı</span><b>${st.t}</b></div>
      <p class="sc-tip">${know ? `${Icon('coach')} Hocanın önerisi: <b>${WC_TACS[st.best]}</b>` : `${Icon('coach')} Taktik toplantısına katılırsan hoca bu maç için önerisini söyler.`}</p>
      <div class="lbl">Taktiğin</div>
      <div class="seg wc-tac">${Object.entries(WC_TACS).map(([k, l]) => `<button type="button" data-wctac="${k}" class="${(w.tac || 'bal') === k ? 'on' : ''}">${l}</button>`).join('')}</div>
      <small class="muted">${{ att: 'Daha çok pozisyon, ama arkada boşluk kalır.', bal: 'Dengeli oyun, sürpriz yok.', def: 'Az gol yersin, ama hücumda daha az şansın olur.' }[w.tac || 'bal']}</small>
    </div>`;
  },
  applyTac(ctx, me, them, opp, friendly) {
    const w = Game.state.wc;
    const tac = w.tac || 'bal';
    if (tac === 'att') { me.rating += 2; them.rating += 1; ctx.levelBase -= 0.01; }
    if (tac === 'def') { me.rating -= 1; them.rating -= 3; ctx.levelBase += 0.01; }
    w.tacHit = WC.styleOf(opp).best === tac;
    if (w.tacHit) { me.rating += 2; if (!friendly) Game.toast(`Taktik rakibe uygun: ${WC_TACS[tac]}. Takımın daha güçlü!`, 'good'); }
  },

  // ---------- Maç sonrası: coşku ve çıkartmalar ----------
  afterMatch(o) {
    const s = Game.state, w = s.wc, p = s.player, sum = o.sum;
    if (o.friendly) { if (o.gf > o.ga) WC.hypeAdd(2); return; }
    const res = o.ko ? (o.won ? 'w' : 'l') : o.gf > o.ga ? 'w' : o.gf < o.ga ? 'l' : 'd';
    WC.hypeAdd((res === 'w' ? (o.ko ? 14 : 10) : res === 'd' ? 2 : -10) + (sum.played ? sum.goals * 3 : 0));
    Social.ensure(p).followers += Math.round(200 * (w.hype || 40) / 10 * (res === 'w' ? 2 : 1));
    if (!o.ko && res === 'l') w.gLoss = true;
    if (sum.played) {
      WC.stick('debut');
      if (sum.goals >= 1) WC.stick('first');
      if (sum.goals >= 2) WC.stick('brace');
      if (sum.goals >= 3) WC.stick('hat');
      if (sum.assists >= 2) WC.stick('assist2');
      if (sum.motm) WC.stick('motm');
      if (sum.rating >= 9) WC.stick('r9');
      if (o.ko && sum.goals) WC.stick('kogoal');
      if (o.final && sum.goals) WC.stick('fgoal');
      if (res === 'w' && o.ga === 0 && (p.position === 'DF' || p.position === 'GK')) WC.stick('clean');
    }
    if (res === 'w' && WC.natOf(o.opp).rating - WC.natOf(w.nat).rating >= 8) WC.stick('giant');
    if (w.penHero) { WC.stick('pens'); w.penHero = false; }
    if (w.stats.goals >= 5) WC.stick('g5');
  },

  // ---------- Albüm ----------
  albumData() { return Meta.get('sf_wc_album', {}); },
  stick(id) {
    const a = WC.albumData();
    if (a[id]) return false;
    const x = WC_STK.find((q) => q.id === id);
    if (!x) return false;
    a[id] = Date.now();
    Meta.set('sf_wc_album', a);
    const w = Game.state && Game.state.wc;
    if (w) (w.newStk = w.newStk || []).push(id);
    if (!WC._quiet) Game.toast(`📒 Yeni çıkartma: ${x.t}`, 'good');
    return true;
  },
  album() {
    const a = WC.albumData();
    const n = WC_STK.filter((x) => a[x.id]).length;
    Game.modal(`<div class="ev-tag">Dünya Şampiyonası</div><h2>${Icon('gift')} Çıkartma albümü</h2>
      <p class="muted">${n}/${WC_STK.length} çıkartma. Her çıkartma bir hedef: turnuvalarda başar, albümü doldur.</p>
      <div class="wc-album">${WC_STK.map((x, i) => {
        const on = !!a[x.id];
        return `<div class="wstk ${on ? 'on' : ''}"><small>#${i + 1}</small><i>${on ? Icon(x.ic) : '?'}</i><b>${x.t}</b><span>${x.d}</span></div>`;
      }).join('')}</div>`, [{ t: 'Kapat', cls: 'btn-big' }], { wide: true });
  },
  albumBtn() {
    const a = WC.albumData();
    return `${Icon('gift')} Albüm ${WC_STK.filter((x) => a[x.id]).length}/${WC_STK.length}`;
  },

  // ---------- Yan kart ve bitiş ekranı düğmeleri ----------
  sideExtra() {
    const w = Game.state.wc;
    return `<div class="wc-mini"><button class="btn btn-ghost" data-wc="album">${WC.albumBtn()}</button>${(w.career || []).length ? `<button class="btn btn-ghost" data-wc="career">${Icon('career')} Kariyerin</button>` : ''}</div>`;
  },
  canNext() {
    const s = Game.state, w = s.wc;
    return !w.retired && (w.cupNo || 1) < WC_MAX_CUPS && s.player.age + 4 <= 34;
  },
  doneExtra() {
    const w = Game.state.wc;
    const next = WC.canNext();
    return `<div class="wc-btns">
      ${next ? `<button class="btn btn-big" data-wc="nextcup">${Icon('play')} ${(w.year || WC.YEAR) + 4} turnuvasına devam</button>` : ''}
      <button class="btn ${next ? 'btn-ghost' : 'btn-big'}" data-wc="card">${Icon('share')} Turnuva kartı</button>
      ${next ? `<button class="btn btn-ghost" data-wc="retire">${Icon('wave')} Kariyeri bitir</button>` : `<button class="btn btn-ghost" data-wc="career">${Icon('career')} Kariyer özeti</button>`}
      <button class="btn btn-ghost" data-wc="new">Yeni kariyer</button>
      <button class="btn btn-ghost" data-wc="menu">Ana menü</button></div>`;
  },
  bindExtra(k) {
    if (k === 'album') WC.album();
    if (k === 'career') WC.careerView();
    if (k === 'card') WC.cardShare();
    if (k === 'nextcup') WC.nextCup();
    if (k === 'retire') WC.retire();
  },

  // ---------- Turnuva sonu: ödül gecesi, dönüş, özet ----------
  afterCup(r) {
    const s = Game.state, w = s.wc, p = s.player;
    const T = w.stats, rank = WC_RANK[r.result];
    w.awards = r.aw.map((x) => x[1]);
    // kariyer kaydı
    w.career = (w.career || []).filter((c) => c.y !== w.year);
    w.career.push({ y: w.year || WC.YEAR, age: p.age, stage: r.result, apps: T.apps, g: T.goals, a: T.assists, avg: Math.round(r.avg * 10) / 10, aw: w.awards.slice(), cap: !!w.captain });
    // turnuva hedefleri (bildirim yerine özet ekranında gösterilir)
    WC._quiet = true;
    const tbl = WC.table(w.myG);
    if (!w.gLoss && rank >= 2) WC.stick('unbeat');
    if (tbl[0] && tbl[0].id === w.nat) WC.stick('gtop');
    if (rank >= 4) WC.stick('qf');
    if (rank >= 6) WC.stick('final');
    if (r.won) WC.stick('champ');
    if (rank >= 5 && WC.natOf(w.nat).rating < 73) WC.stick('fairy');
    if (w.awards.includes('Gol Kralı Kupası')) WC.stick('boot');
    if (w.awards.includes('Altın Yıldız')) WC.stick('gstar');
    if (w.awards.includes('En İyi Genç Oyuncu')) WC.stick('young');
    if (w.career.length >= 4) WC.stick('cups4');
    if ((WC.history().titles || 0) >= 2) WC.stick('titles2');
    WC._quiet = false;
    // dönüşte coşku ve ün
    Player.addFame(p, rank * 1.5 + (r.won ? 8 : 0));
    const chain = () => WC.awardNight(r).then(() => WC.homecoming(r)).then(() => WC.summary(r));
    if (r.won && typeof Celebrate !== 'undefined') Celebrate.champion('Dünya Şampiyonası Şampiyonu', WC.natOf(w.nat).name, true).then(chain);
    else chain();
  },
  awardNight(r) {
    const s = Game.state, w = s.wc, p = s.player;
    const me = Player.fullName(p);
    const champT = r.champ ? WC.team(r.champ) : null;
    const pickOther = (code, i) => { const t = WC.team(code || w.nat); return `${t.roster[Math.min(i, t.roster.length - 1)].n} (${WC.natOf(t.id).name})`; };
    const has = (t) => w.awards.includes(t);
    const avg = r.avg;
    const xi = w.stats.apps >= 3 && avg >= 7.2;
    const rows = [
      ['boot', 'Gol Kralı Kupası', has('Gol Kralı Kupası') ? me : `${r.top.n || '-'} (${r.top.t ? WC.natOf(r.top.t).name : '-'})`, has('Gol Kralı Kupası')],
      ['star', 'Altın Yıldız', has('Altın Yıldız') ? me : pickOther(r.champ, 0), has('Altın Yıldız')],
      ['fire', 'En İyi Genç Oyuncu', has('En İyi Genç Oyuncu') ? me : pickOther(champT ? r.champ : w.nat, 3), has('En İyi Genç Oyuncu')],
      ['team', 'Turnuvanın 11\'i', xi ? me : 'Seçilmedin', xi],
    ];
    if (xi) WC.hypeAdd(3);
    return new Promise((res) => Game.modal(`<div class="ev-tag">${w.year || WC.YEAR} Dünya Şampiyonası</div><h2>${Icon('star')} Ödül gecesi</h2>
      <p class="muted">Turnuvanın en iyileri sahneye çağrılıyor...</p>
      <div class="wc-night">${rows.map(([ic, t, who, mine]) => `<div class="wn-row ${mine ? 'me' : ''}">${Icon(ic)}<span><small>${t}</small><b data-noi18n>${U.esc(who)}</b></span>${mine ? '<em>SEN!</em>' : ''}</div>`).join('')}</div>`,
    [{ t: 'Devam', cls: 'btn-big', fn: res }], { wide: true }));
  },
  homecoming(r) {
    const s = Game.state, w = s.wc, p = s.player;
    const rank = WC_RANK[r.result], hype = w.hype || 40, nat = WC.natOf(w.nat).name;
    let ic = '✈️', h = 'Eve dönüş', t;
    if (r.won) { ic = '🏆'; h = 'Kahramanlar evde!'; t = `Havalimanında yüz binlerce kişi! Kupayla üstü açık otobüste ${nat} sokaklarını dolaştınız. Bu gece kimse uyumayacak.`; }
    else if (rank >= 5) { ic = '🎉'; h = 'Kahraman karşılaması'; t = 'Havalimanında binlerce taraftar sizi alkışlarla karşıladı. Kupa gelmedi ama bu takım bir ülkeyi ayağa kaldırdı.'; }
    else if (rank >= 3) { t = hype >= 60 ? 'Taraftarlar gururlu: havalimanında "Başınız dik!" pankartları sizi bekliyordu.' : 'Sakin bir dönüş. Takım iyi mücadele etti, ama daha fazlası bekleniyordu.'; }
    else { ic = '🌧️'; t = hype >= 50 ? 'Hayal kırıklığı büyük. Yine de havalimanında küçük bir grup taraftar sizi yalnız bırakmadı.' : 'Sessiz bir dönüş. Eleştiriler sert, ama bu turnuvadan çıkarılacak çok ders var.'; }
    const fol = Math.round((rank * 1500 + hype * 120) * (r.won ? 3 : 1));
    Social.ensure(p).followers += fol;
    Social.post(r.won ? 'trophy' : 'daily', r.won ? 'DÜNYA ŞAMPİYONUYUZ! Bu kupa hepimizin. Teşekkürler!' : rank >= 5 ? 'Her şeyimizi verdik. Desteğiniz için teşekkürler, bu daha başlangıç.' : 'Bu formayı taşımak onurdu. Daha güçlü döneceğiz.', 2.4, Social.natOpts ? Social.natOpts() : undefined);
    return new Promise((res) => Game.modal(`<div class="wc-home"><div class="wh-ic">${ic}</div><div class="ev-tag">${U.esc(nat)}</div><h2>${h}</h2><p>${t}</p>
      <div class="ms-stats"><div class="mst"><i>${Icon('fans')}</i><b>${Math.round(hype)}</b><span>Coşku</span></div><div class="mst"><i>${Icon('phone')}</i><b>+${Social.fmt ? Social.fmt(fol) : fol}</b><span>Takipçi</span></div></div></div>`,
    [{ t: 'Devam', cls: 'btn-big', fn: res }], { wide: true }));
  },
  summary(r) {
    const s = Game.state, w = s.wc;
    const avg = r.avg, nat = WC.natOf(w.nat).name;
    const fresh = (w.newStk || []).map((id) => WC_STK.find((x) => x.id === id)).filter(Boolean);
    w.newStk = [];
    const next = WC.canNext();
    const btns = [{ t: `${Icon('share')} Turnuva kartı`, cls: 'btn-ghost', keep: true, fn: () => WC.cardShare() }];
    if (next) btns.push({ t: 'Kariyeri bitir', cls: 'btn-ghost', fn: () => WC.retire() }, { t: `${Icon('play')} ${(w.year || WC.YEAR) + 4} turnuvası`, cls: 'btn-big', fn: () => WC.nextCup() });
    else btns.push({ t: 'Kariyer özeti', cls: 'btn-big', fn: () => WC.retire() });
    Game.modal(`<div class="ev-tag">${w.year || WC.YEAR} Dünya Şampiyonası</div><h2>${r.won ? 'DÜNYA ŞAMPİYONUSUN!' : WC.stageText(r.result)}</h2>
      <p>${r.won ? `${U.esc(nat)} dünyanın zirvesinde! ${s.player.age} yaşında tarih yazdın.` : `${U.esc(nat)} için yolculuk ${U.esc(WC.stageText(r.result))} aşamasında bitti.`}</p>${r.won ? '' : `<p>Şampiyon: <b>${U.esc(r.champ ? WC.natOf(r.champ).name : '-')}</b></p>`}
      <div class="ms-stats"><div class="mst"><i>${Icon('shield')}</i><b>${w.stats.apps}</b><span>Maç</span></div><div class="mst"><i>${Icon('ball')}</i><b>${w.stats.goals}</b><span>Gol</span></div><div class="mst"><i>${Icon('boot')}</i><b>${w.stats.assists}</b><span>Asist</span></div><div class="mst"><i>${Icon('star')}</i><b>${avg ? avg.toFixed(1) : '-'}</b><span>Ortalama</span></div></div>
      ${r.aw.length ? `<div class="lbl">Ödüller</div>${r.aw.map(([ic, t, d]) => `<div class="wc-aw">${Icon(ic)}<span><b>${t}</b><small>${d}</small></span></div>`).join('')}` : ''}
      ${fresh.length ? `<div class="lbl">Yeni çıkartmalar</div><div class="wc-album mini">${fresh.map((x) => `<div class="wstk on"><i>${Icon(x.ic)}</i><b>${x.t}</b></div>`).join('')}</div>` : ''}
      ${next ? `<p class="muted">Bir sonraki turnuvada (${(w.year || WC.YEAR) + 4}) ${s.player.age + 4} yaşında olacaksın. Aynı oyuncuyla devam edebilirsin.</p>` : ''}`, btns, { wide: true });
  },

  // ---------- Paylaşılabilir turnuva kartı ----------
  cardShare() {
    const s = Game.state, w = s.wc, p = s.player;
    const o = ShareCard.base(`${w.year || WC.YEAR} Dünya Şampiyonası`), { c, W } = o;
    const team = WC.team(w.nat);
    c.save(); c.globalAlpha = 0.35; c.fillStyle = team.c1; c.fillRect(0, 150, W, 18); c.fillStyle = team.c2; c.fillRect(0, 168, W, 8); c.restore();
    Sprites.figure(c, W / 2, 760, 560, { kit: Sprites.kit(team, false), look: Sprites.me(p), facing: 'down', number: p.shirt, t: 0 });
    c.textAlign = 'center'; c.fillStyle = '#fff'; c.font = '900 92px "Saira Condensed", sans-serif';
    c.fillText(Player.fullName(p).toLocaleUpperCase(I18N.lang), W / 2, 870);
    c.fillStyle = 'rgba(255,255,255,.75)'; c.font = '600 38px "Saira Condensed", sans-serif';
    c.fillText(I18N.t(`${WC.natOf(w.nat).name} · ${p.age} yaş · ${POSITIONS[p.position].l}`), W / 2, 926);
    const T = w.stats;
    ShareCard.stats(o, 960, [[I18N.t('Maç'), T.apps], [I18N.t('Gol'), T.goals], [I18N.t('Asist'), T.assists], [I18N.t('Ortalama'), T.apps ? (T.rs / T.apps).toFixed(1) : '-']]);
    c.textAlign = 'center'; c.fillStyle = '#ffc93a'; c.font = '900 54px "Saira Condensed", sans-serif';
    const stage = w.phase === 'done' ? (w.result === 'win' ? 'DÜNYA ŞAMPİYONU' : WC.stageText(w.result)) : (w.phase === 'camp' ? 'Hazırlık Kampı' : w.phase === 'group' ? 'Grup Aşaması' : WC_STAGES[w.ko ? w.ko.size : 2]);
    c.fillText(I18N.t(stage).toLocaleUpperCase(I18N.lang), W / 2, 1180);
    if ((w.awards || []).length) { c.fillStyle = '#fff'; c.font = '700 34px "Saira Condensed", sans-serif'; c.fillText('🏆 ' + w.awards.map((x) => I18N.t(x)).join(' · '), W / 2, 1232); }
    ShareCard.foot(o);
    ShareCard.preview(o.cv, ShareCard.text());
  },

  // ---------- Sonraki turnuva ----------
  nextCup() {
    const s = Game.state, w = s.wc, p = s.player;
    if (!WC.canNext()) return;
    const age0 = p.age, ovr0 = Player.overall(p);
    const last = (w.career || [])[w.career.length - 1] || {};
    let d = age0 <= 18 ? U.randi(7, 10) : age0 <= 22 ? U.randi(3, 6) : age0 <= 26 ? U.randi(0, 2) : U.randi(-4, -1);
    if ((last.avg || 0) >= 7.2) d += 1;
    p.age += 4;
    STATS.forEach((st) => { p.stats[st.k] = U.clamp(p.stats[st.k] + d + U.randi(-1, 1) - (st.k === 'pace' && p.age >= 30 ? 2 : 0), 20, 97); });
    p.energy = 100; p.morale = 70; p.injuryWeeks = 0;
    p.rel = { coach: U.clamp(50 + (w.cupNo || 1) * 4 + (last.avg >= 7 ? 4 : 0), 0, 80), team: 55, fans: U.clamp(35 + (w.hype || 40) / 3, 0, 90) };
    WC._carry = { ovr0, age0, wasCap: !!w.captain };
    WC.start({ nat: w.nat, player: p, year: (w.year || WC.YEAR) + 4, cupNo: (w.cupNo || 1) + 1, career: w.career || [] });
  },
  welcomeBack() {
    const s = Game.state, w = s.wc, p = s.player, c = WC._carry || {};
    const ovr = Player.overall(p), d = ovr - (c.ovr0 || ovr);
    WC._carry = null;
    w.hype = U.clamp(40 + (w.career || []).reduce((a, x) => a + WC_RANK[x.stage] * 2, 0), 30, 70);
    WC.render();
    Game.modal(`<div class="ev-tag">${w.year} Dünya Şampiyonası</div><h2>4 yıl sonra...</h2>
      <p>${p.age} yaşındasın ve ${U.esc(WC.natOf(w.nat).name)} kampına ${w.cupNo}. kez geldin. Bu kez herkes senden çok şey bekliyor.</p>
      <div class="ms-stats"><div class="mst"><i>${Icon('star')}</i><b>${ovr}</b><span>Gücün</span></div><div class="mst"><i>${Icon('fire')}</i><b class="${d >= 0 ? 'up' : 'down'}">${d >= 0 ? '+' : ''}${d}</b><span>Değişim</span></div><div class="mst"><i>${Icon('shield')}</i><b>${p.intl.caps}</b><span>Milli maç</span></div></div>
      ${WC.careerRows()}
      <p class="muted"><span>Ev sahibi:</span> ${(w.hosts || []).map((x) => `<span>${U.esc(WC.natOf(x).name)}</span>`).join(', ')}. <span>Grup rakiplerin kura ile belli oldu.</span></p>`,
    [{ t: 'Kampa başla', cls: 'btn-big', fn: () => { if (!w.captain) setTimeout(() => WC.event('armband'), 500); } }], { wide: true });
  },

  // ---------- Kariyer özeti ----------
  careerRows() {
    const rows = (Game.state.wc.career || []);
    if (!rows.length) return '';
    return `<table class="tbl wc-car"><tr><th>Yıl</th><th class="l">Aşama</th><th>M</th><th>G</th><th>A</th></tr>${rows.map((x) => `<tr><td>${x.y}</td><td class="l">${U.esc(WC.stageText(x.stage))}${x.cap ? ' ©' : ''}${x.aw && x.aw.length ? ` <small>${x.aw.map((a) => `<span>${U.esc(a)}</span>`).join(', ')}</small>` : ''}</td><td>${x.apps}</td><td>${x.g}</td><td>${x.a}</td></tr>`).join('')}</table>`;
  },
  careerView() {
    const s = Game.state, w = s.wc;
    const rows = w.career || [];
    const tot = rows.reduce((a, x) => ({ apps: a.apps + x.apps, g: a.g + x.g, a: a.a + x.a, t: a.t + (x.stage === 'win' ? 1 : 0) }), { apps: 0, g: 0, a: 0, t: 0 });
    Game.modal(`<div class="ev-tag">Dünya Şampiyonası kariyerin</div><h2>${U.esc(Player.fullName(s.player))}</h2>
      <div class="ms-stats"><div class="mst"><i>${Icon('globe')}</i><b>${rows.length}</b><span>Turnuva</span></div><div class="mst"><i>${Icon('star')}</i><b>${tot.t}</b><span>Şampiyonluk</span></div><div class="mst"><i>${Icon('ball')}</i><b>${tot.g}</b><span>Gol</span></div><div class="mst"><i>${Icon('boot')}</i><b>${tot.a}</b><span>Asist</span></div></div>
      ${WC.careerRows() || '<p class="muted">İlk turnuvan devam ediyor.</p>'}`, [{ t: 'Kapat', cls: 'btn-big' }], { wide: true });
  },
  retire() {
    const s = Game.state, w = s.wc, p = s.player;
    w.retired = true;
    const rows = w.career || [];
    const tot = rows.reduce((a, x) => ({ apps: a.apps + x.apps, g: a.g + x.g, t: a.t + (x.stage === 'win' ? 1 : 0) }), { apps: 0, g: 0, t: 0 });
    const h = WC.history();
    h.legends = (h.legends || []);
    h.legends.unshift({ n: Player.fullName(p), nat: w.nat, cups: rows.length, t: tot.t, g: tot.g, y: Date.now() });
    h.legends = h.legends.slice(0, 10);
    Meta.set('sf_wc', h);
    Game.save();
    WC.render();
    const title = tot.t >= 2 ? 'Bir dünya efsanesi' : tot.t ? 'Dünya şampiyonu bir efsane' : tot.g >= 10 ? 'Unutulmaz bir golcü' : 'Milli takımın emektarı';
    Game.modal(`<div class="ev-tag">Milli takım kariyeri bitti</div><h2>${title}</h2>
      <p>${U.esc(Player.fullName(p))}, ${U.esc(WC.natOf(w.nat).name)} formasıyla ${rows.length} Dünya Şampiyonası'nda ${tot.apps} maça çıktı ve ${tot.g} gol attı.</p>
      ${WC.careerRows()}`, [{ t: `${Icon('share')} Turnuva kartı`, cls: 'btn-ghost', keep: true, fn: () => WC.cardShare() }, { t: 'Ana menü', cls: 'btn-ghost', fn: () => WC.exit() }, { t: 'Yeni kariyer', cls: 'btn-big', fn: () => WC.setup() }], { wide: true });
  },
});
