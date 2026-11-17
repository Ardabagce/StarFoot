// Yıldız hayatı: telefona 4 uygulama
// - Seyahat: sezon sonu tatili (rezervasyon, sezon bitince yapılır) ve hafta sonu kaçamakları
// - Magazin: hakkındaki manşetler, davetler (gala, moda haftası, ödül gecesi...), ünlü sevgili, takım arkadaşı krizi
// - Yatırım: işletmeler (kafe, restoran, kiralık daire, giyim markası, imza kramponu...) haftalık gelir/gider, olaylar, satış
// - Miras: heykel, emekli forma numarası, jübile ilerlemesi; otobiyografi; TV yorumculuğu; emeklilik ekranında miras bölümü
// Eski kayıtlar etkilenmez: veriler (p.sl) yalnız ilk kullanımda oluşturulur.
const StarLife = (() => {
  const esc = (x) => U.esc(String(x == null ? '' : x));
  const money = (n) => U.money(n);
  const P = () => Game.p;
  // dolar cinsinden fiyat → oyun parası (görünen para biriminde yuvarlanmış)
  const price = (usd) => {
    const C = U.CUR[U.cur()] || U.CUR.TRY, v = (usd / U.CUR.USD.rate) * C.rate;
    const mag = Math.pow(10, Math.max(0, Math.floor(Math.log10(Math.max(1, v))) - 1));
    return (Math.round(v / mag) * mag) / C.rate;
  };
  const usdOf = (tl) => tl * U.CUR.USD.rate;
  const on = () => { try { const s = Game.state; return !!(s && s.player && s.contract && !Game.inStreet() && !Game.isYouth() && s.player.age >= 17); } catch (e) { return false; } };
  const D = () => { const p = P(); p.sl = p.sl || {}; const d = p.sl; d.tr = d.tr || { hist: [] }; d.mg = d.mg || { news: [] }; d.bz = d.bz || { own: {}, log: [] }; d.lg = d.lg || {}; return d; };
  const has = (k) => !!(P().sl && P().sl[k]);
  const wkKey = () => { const s = Game.state; return `${s.season.year}-${s.season.round}`; };
  const L = () => (P().life || {});
  const gf = () => L().gf || null;
  const useAp = () => {
    const s = Game.state;
    if (s.seasonEnd) { Game.toast('Sezon bitti, yeni sezonu bekle.', 'bad'); return false; }
    if (s.ap <= 0) { Game.toast('Bu hafta için aksiyon hakkın kalmadı. Maça çık!', 'bad'); return false; }
    s.ap -= 1;
    return true;
  };
  const rerender = () => { Game.save(); if (typeof Phone !== 'undefined' && Phone.open) Phone.render(); else Game.render(); };
  const fx = (o) => {
    const p = P(), out = [];
    if (o.m) { Player.addMorale(p, o.m); out.push(`Moral ${o.m > 0 ? '+' : ''}${o.m}`); }
    if (o.e) { Player.addEnergy(p, o.e); out.push(`Enerji ${o.e > 0 ? '+' : ''}${o.e}`); }
    if (o.fam) { Player.addRel(p, 'family', o.fam); out.push(`Aile ${o.fam > 0 ? '+' : ''}${o.fam}`); }
    if (o.coach) { Player.addRel(p, 'coach', o.coach); out.push(`Hoca ${o.coach > 0 ? '+' : ''}${o.coach}`); }
    if (o.team) { Player.addRel(p, 'team', o.team); out.push(`Takım ${o.team > 0 ? '+' : ''}${o.team}`); }
    if (o.fans) { Player.addRel(p, 'fans', o.fans); out.push(`Taraftar ${o.fans > 0 ? '+' : ''}${o.fans}`); }
    if (o.gf && gf()) { gf().rel = U.clamp(gf().rel + o.gf, 0, 100); out.push(`İlişki ${o.gf > 0 ? '+' : ''}${o.gf}`); }
    if (o.fame) { Player.addFame(p, o.fame); out.push(`Ün ${o.fame > 0 ? '+' : ''}${o.fame}`); }
    return out.join(' · ');
  };
  const chips = (o) => {
    const c = [];
    const add = (l, v, bad) => c.push(`<span class="sl-chip ${bad ? 'bad' : v > 0 ? 'pos' : 'neg'}"><i>${l}</i> <b>${v > 0 ? '+' : ''}${v}</b></span>`);
    if (o.m) add('Moral', o.m); if (o.e) add('Enerji', o.e); if (o.fam) add('Aile', o.fam); if (o.gf) add('İlişki', o.gf);
    if (o.coach) add('Hoca', o.coach); if (o.team) add('Takım', o.team); if (o.fans) add('Taraftar', o.fans); if (o.fame) add('Ün', o.fame);
    return c.join('');
  };
  const img = (k, o, cls = '') => `<img class="sl-img ${cls}" src="${SLArt.url(k, o)}" alt="" loading="lazy" decoding="async">`;
  const sec = (t, sub) => `<div class="sl-sh"><b>${t}</b>${sub ? `<small>${sub}</small>` : ''}</div>`;
  const headline = (t, tone = '') => { const d = D(), s = Game.state; d.mg.news.unshift({ y: s.season.year, r: s.season.round, t, tone }); d.mg.news = d.mg.news.slice(0, 14); d.mg.unread = (d.mg.unread || 0) + 1; };
  const fullName = () => Player.fullName(P());

  // =====================================================================
  // 1) SEYAHAT
  // =====================================================================
  const DEST = [
    { k: 'home', sc: 'home', n: 'Memleket ziyareti', d: 'Ailenle, eski arkadaşlarınla ve çocukluk sokaklarında sakin bir tatil.', usd: 900, fly: 0, fx: { m: 6, fam: 12, gf: 4 } },
    { k: 'cappa', sc: 'cappa', n: 'Kapadokya balon turu', d: 'Gün doğumunda balon, mağara otelde iki gece.', usd: 2600, fly: 0, fx: { m: 8, fam: 4, gf: 10 } },
    { k: 'bodrum', sc: 'bodrum', n: 'Ege koyları', d: 'Mavi yolculuk, koy koy deniz ve akşam balık.', usd: 5500, fly: 0, fx: { m: 9, fam: 5, gf: 8 } },
    { k: 'paris', sc: 'paris', n: 'Paris ve moda haftası', d: 'Butik otel, defileler ve galeri gezileri.', usd: 12000, fly: 1, fx: { m: 8, gf: 10, fame: 0.4 } },
    { k: 'camp', sc: 'camp', n: 'Özel antrenman kampı', d: 'Kişisel antrenör ve fizyoterapistle yaylada 2 hafta. Tatil değil, hazırlık.', usd: 9000, fly: 0, fx: { m: 2, coach: 10 }, camp: 1 },
    { k: 'alps', sc: 'alps', n: 'Alplerde kayak', d: 'Dağ evinde kar tatili. Kulüpler sakatlık riskinden hoşlanmaz.', usd: 16000, fly: 1, fx: { m: 10, gf: 8 }, risk: 0.18 },
    { k: 'dubai', sc: 'dubai', n: 'Çölde lüks şehir', d: 'Gökdelende süit, çöl safarisi ve alışveriş.', usd: 22000, fly: 1, fx: { m: 10, gf: 8, fame: 0.5 } },
    { k: 'party', sc: 'party', n: 'Parti adası', d: 'Ünlülerle dolu bir hafta. Fotoğraflar her yere düşer.', usd: 18000, fly: 1, fx: { m: 12, fame: 0.6 }, scandal: 0.45 },
    { k: 'yacht', sc: 'yacht', n: 'Kendi yatınla Akdeniz turu', d: 'Mürettebat hazır, rota senin. Yakıt ve liman giderleri dahil.', usd: 8000, fly: 0, fx: { m: 13, fam: 6, gf: 12, fame: 0.4 }, need: 'yacht' },
    { k: 'carib', sc: 'carib', n: 'Karayip adaları', d: 'Beyaz kum, palmiyeler, iki hafta telefonsuz.', usd: 30000, fly: 1, fx: { m: 12, fam: 6, gf: 12, fame: 0.3 } },
    { k: 'maldiv', sc: 'maldiv', n: 'Su üstü villa', d: 'Turkuaz lagünde özel villa, şef ve dalış.', usd: 38000, fly: 1, fx: { m: 14, fam: 8, gf: 15, fame: 0.4 } },
  ];
  const GETAWAY = [
    { k: 'city', sc: 'citybreak', n: 'Şehir kaçamağı', d: 'Bir gece otel, konser ya da tiyatro.', usd: 700, fx: { m: 4, e: 4, gf: 6 } },
    { k: 'spa', sc: 'spa', n: 'Termal ve spa', d: 'Masaj, sauna ve uzun bir uyku.', usd: 900, fx: { m: 3, e: 14 } },
    { k: 'vine', sc: 'vine', n: 'Bağ evi', d: 'Doğada sakin bir hafta sonu, ailece.', usd: 1200, fx: { m: 5, e: 6, fam: 6, gf: 6 } },
  ];
  const mallHas = (t) => { const p = P(); return !!(p.mall && Object.values(p.mall.own || {}).some((x) => x && typeof x === 'object' && (x.art === t || x.t === t))); };
  const ownsYacht = () => { const p = P(); return (p.items || []).includes('life6') || (p.lux || []).includes('yacht') || mallHas('yacht'); };
  const ownsJet = () => { const p = P(); return (p.items || []).includes('jet') || (p.lux || []).includes('jet') || mallHas('jet'); };
  const destCost = (x) => { const base = price(x.usd); return x.fly && ownsJet() ? Math.round(base * 0.7) : base; };
  const getawayLeft = () => { const t = D().tr, y = Game.state.season.year; return t.gw && t.gw.y === y ? Math.max(0, 2 - t.gw.n) : 2; };

  function book(k) {
    const x = DEST.find((d) => d.k === k), p = P(), s = Game.state, t = D().tr;
    if (!x) return;
    if (t.b && t.b.y === s.season.year) return Game.toast('Bu sezon için zaten bir tatil planın var.', 'bad');
    if (x.need === 'yacht' && !ownsYacht()) return Game.toast('Bu tur için kendi yatın olmalı.', 'bad');
    const c = destCost(x);
    if (p.money < c) return Game.toast('Yeterli paran yok.', 'bad');
    p.money -= c;
    t.b = { y: s.season.year, k, c };
    Game.toast(`${x.n}: rezervasyonun tamam. Sezon bitince yola çıkıyorsun!`, 'good');
    rerender();
  }
  function cancelTrip() {
    const p = P(), t = D().tr, s = Game.state;
    if (!t.b || t.b.y !== s.season.year) return;
    const back = Math.round(t.b.c * 0.8);
    p.money += back;
    t.b = null;
    Game.toast(`Rezervasyon iptal edildi. İade: ${money(back)}`, 'info');
    rerender();
  }
  function getaway(k) {
    const x = GETAWAY.find((d) => d.k === k), p = P(), s = Game.state, t = D().tr;
    if (!x) return;
    if (getawayLeft() <= 0) return Game.toast('Bu sezon hafta sonu kaçamağı hakkın doldu.', 'bad');
    const c = price(x.usd);
    if (p.money < c) return Game.toast('Yeterli paran yok.', 'bad');
    if (!useAp()) return;
    p.money -= c;
    t.gw = t.gw && t.gw.y === s.season.year ? t.gw : { y: s.season.year, n: 0 };
    t.gw.n++;
    const r = fx(x.fx);
    if (U.chance(0.35)) Social.post(gf() ? 'couple' : 'life', U.pick(['Kısa bir mola, şarj olduk.', 'Hafta sonu kaçamağı. Pazartesi antrenmandayız!', 'Biraz dinlenmek herkese iyi gelir.']), 1.1);
    Game.toast(`${x.n} · ${r}`, 'good');
    rerender();
  }
  // sezon sonu: rezervasyon yapılan tatil yeni sezon başlarken uygulanır
  function tripPending() { if (!has('tr')) return null; const t = P().sl.tr, s = Game.state; return t && t.b && s && s.seasonEnd && t.b.y === s.seasonEnd.year ? t.b : null; }
  function tripApply(b) {
    const x = DEST.find((d) => d.k === b.k), p = P(), t = D().tr, s = Game.state;
    t.b = null;
    if (!x) return;
    const ef = Object.assign({}, x.fx);
    let note = '';
    if (x.camp) {
      ['stamina', 'physical'].forEach((k) => { const v = p.stats[k]; if (v < Math.min(99, p.potential + 4)) p.stats[k] = Math.min(99, v + 1); });
      note = 'Dayanıklılık ve güç +1.';
    }
    let res = fx(ef);
    t.hist.unshift({ y: b.y, k: b.k });
    t.hist = t.hist.slice(0, 12);
    const who = gf() ? gf().name : null;
    if (x.risk && U.chance(x.risk)) {
      Game.injure(U.randi(2, 4), 'Kayakta');
      Player.addRel(p, 'coach', -8);
      headline(`${fullName()} kayak tatilinde sakatlandı! Kulüp çok kızgın.`, 'bad');
    } else if (x.scandal && U.chance(x.scandal)) {
      Player.addRel(p, 'coach', -10); Player.addRel(p, 'fans', -6); Player.addFame(p, 0.4);
      headline(`Tatil fotoğrafları olay oldu: ${fullName()} sabaha kadar partide!`, 'bad');
      Game.news(`Magazin: ${fullName()} parti adasındaki görüntüleriyle gündemde. Kulüp açıklama bekliyor.`, 'world');
      res += ' · Hoca -10 · Taraftar -6';
    } else if (x.fx.fame) {
      headline(who ? `${fullName()} ve ${who} tatilde: ${x.n}` : `${fullName()} tatilde: ${x.n}`, 'good');
    }
    const post = { home: 'Memlekette olmak gibisi yok.', cappa: 'Gün doğumunda balonla. Muhteşem!', bodrum: 'Koy koy tekne turu. Deniz harika!', paris: 'Paris akşamları.', camp: 'Tatil yok, yeni sezona hazırlık!', alps: 'Dağlarda kar keyfi.', dubai: 'Çöl ve gökdelenler.', party: 'Unutulmaz bir hafta!', yacht: 'Yatla Akdeniz turu. Rota belli değil!', carib: 'Ada hayatı. Şarj oluyoruz.', maldiv: 'Ada hayatı, turkuaz lagün.' }[x.k];
    try { Social.post(who && x.k !== 'camp' ? 'couple' : 'life', post, 1.4); } catch (e) { /* yok */ }
    Game.news(`🧳 Sezon arası tatil: ${x.n}. ${res}${note ? ' · ' + note : ''}`, 'good');
    setTimeout(() => { try { Game.toast(`🧳 ${x.n} · ${res}`, 'good'); } catch (e) { /* yok */ } }, 600);
  }

  function travelView() {
    const p = P(), s = Game.state, t = D().tr, b = t.b && t.b.y === s.season.year ? t.b : null, bx = b && DEST.find((d) => d.k === b.k);
    const jet = ownsJet();
    const card = (x) => {
      const c = destCost(x), lock = x.need === 'yacht' && !ownsYacht(), mine = b && b.k === x.k;
      const btn = mine ? '<span class="sl-tag own">Rezerve</span>' : lock ? '<span class="sl-tag lock">Yat gerekli</span>' : b ? '' : `<button class="sl-btn" data-sl="tr:${x.k}" type="button" ${p.money < c ? 'disabled' : ''}>Rezervasyon</button>`;
      return `<div class="sl-card ${mine ? 'on' : ''}">${img(x.sc)}<div class="sl-cb"><b>${x.n}</b><small>${x.d}</small><div class="sl-chips">${chips(x.fx)}${x.risk ? '<span class="sl-chip bad"><i>Sakatlık riski</i></span>' : ''}${x.scandal ? '<span class="sl-chip bad"><i>Skandal riski</i></span>' : ''}${x.camp ? '<span class="sl-chip pos"><i>Güç ve dayanıklılık</i> <b>+1</b></span>' : ''}</div>
        <div class="sl-pr">${x.fly && jet ? `<s>${money(price(x.usd))}</s>` : ''}<b>${money(c)}</b>${btn}</div></div></div>`;
    };
    const gw = (x) => `<div class="sl-mini">${img(x.sc, null, 'sm')}<div class="sl-cb"><b>${x.n}</b><small>${x.d}</small><div class="sl-chips">${chips(x.fx)}</div><div class="sl-pr"><b>${money(price(x.usd))}</b><button class="sl-btn" data-sl="gw:${x.k}" type="button" ${s.ap <= 0 || getawayLeft() <= 0 || p.money < price(x.usd) || s.seasonEnd ? 'disabled' : ''}>Git · 1 aksiyon</button></div></div></div>`;
    const hist = t.hist.length ? `${sec('Geçmiş tatillerin')}<div class="sl-hist">${t.hist.map((h) => { const x = DEST.find((d) => d.k === h.k); return x ? `<div><span>${h.y}</span><b>${x.n}</b></div>` : ''; }).join('')}</div>` : '';
    return `<div class="ph-appv sl sl-tr">${Phone.ui.top('Seyahat')}<div class="ph-body">
      <div class="sl-hero">${img(bx ? bx.sc : 'maldiv', null, 'hero')}<div class="sl-ht">${bx ? `<small>Sezon sonu tatilin</small><b>${bx.n}</b><span>Sezon bitince yola çıkıyorsun.</span><button class="sl-btn ghost" data-sl="trx" type="button">İptal et (%80 iade)</button>` : `<small>Sezon sonu tatili</small><b>Nereye gidiyorsun?</b><span>Şimdi rezervasyon yap, sezon bitince tatile çık.</span>`}</div></div>
      ${jet ? '<div class="sl-note">✈️ Özel jetin var: yurt dışı tatillerde uçuş masrafı yok (%30 indirim).</div>' : ''}
      ${sec('Sezon sonu tatili', 'Sezonda bir kez')}${DEST.map(card).join('')}
      ${sec('Hafta sonu kaçamağı', `Bu sezon kalan: ${getawayLeft()}`)}${GETAWAY.map(gw).join('')}
      ${hist}</div></div>`;
  }

  // =====================================================================
  // 2) MAGAZİN
  // =====================================================================
  const INV = [
    { k: 'gala', sc: 'gala', n: 'Film galası', d: 'Kırmızı halı, flaşlar ve ünlü konuklar.', min: 25, fx: { m: 4, fame: 0.35 }, meet: 1 },
    { k: 'fashion', sc: 'fashion', n: 'Moda haftası, ön sıra', d: 'Tasarımcı seni ön sıraya davet etti. Kıyafet masrafı senden.', min: 40, usd: 2500, fx: { m: 3, fame: 0.5 }, meet: 1 },
    { k: 'charity', sc: 'charity', n: 'Hayır gecesi', d: 'Çocuk hastanesi yararına gece. Bağış yapman bekleniyor.', min: 15, usd: 4000, fx: { fans: 6, fam: 3, fame: 0.25, m: 3 } },
    { k: 'party', sc: 'club', n: 'Ünlülerin partisi', d: 'Herkes orada olacak. Fotoğrafçılar da.', min: 30, fx: { m: 7, e: -10, fame: 0.3 }, scandal: 0.3 },
    { k: 'tv', sc: 'tv', n: 'Akşam şovu konuğu', d: 'Canlı yayında sohbet ve küçük bir yetenek gösterisi.', min: 35, fx: { fame: 0.45, fans: 3 }, gaffe: 0.15 },
    { k: 'award', sc: 'award', n: 'Spor ödülleri gecesi', d: 'Yılın sporcuları bir arada. Takım elbiseni hazırla.', min: 50, fx: { m: 5, fame: 0.6 }, meet: 1 },
    { k: 'podcast', sc: 'podcast', n: 'Popüler podcast', d: 'Kariyerini, aileni ve hayallerini anlatacaksın.', min: 20, fx: { fans: 4, fame: 0.25 } },
    { k: 'ad', sc: 'adshoot', n: 'Reklam çekimi', d: 'Bir günlük çekim, iyi bir ücret.', min: 45, fx: { e: -8, fame: 0.2 }, pay: 1 },
  ];
  const adPay = () => price(Math.round(2000 + P().fame * 160));
  const seedOf = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  function invites() {
    const p = P(), key = wkKey(), elig = INV.filter((x) => p.fame >= x.min);
    if (!elig.length) return [];
    let h = seedOf(key + '|' + (p.surname || '') + (p.name || ''));
    const list = elig.slice(), out = [];
    const n = p.fame >= 60 ? 3 : 2;
    while (list.length && out.length < n) { h = Math.imul(h ^ (h >>> 13), 1103515245) >>> 0; out.push(list.splice(h % list.length, 1)[0]); }
    return out;
  }
  function attend(k) {
    const x = INV.find((i) => i.k === k), p = P(), m = D().mg, key = wkKey();
    if (!x || !invites().some((i) => i.k === k)) return;
    if (m.went === key) return Game.toast('Bu hafta zaten bir davete katıldın.', 'bad');
    const c = x.usd ? price(x.usd) : 0;
    if (p.money < c) return Game.toast('Yeterli paran yok.', 'bad');
    if (!useAp()) return;
    p.money -= c;
    m.went = key;
    let res = fx(x.fx);
    if (x.pay) { const a = adPay(); p.money += a; res += ` · +${money(a)}`; }
    if (x.scandal && U.chance(x.scandal)) {
      Player.addRel(p, 'coach', -8); Player.addRel(p, 'fans', -4);
      headline(`${fullName()} partiden sabaha karşı çıkarken görüntülendi. Hoca memnun değil.`, 'bad');
      res += ' · Hoca -8 · Taraftar -4';
    } else if (x.gaffe && U.chance(x.gaffe)) {
      Player.addRel(p, 'team', -5);
      headline(`${fullName()} canlı yayında takım arkadaşlarına takıldı, soyunma odası karıştı!`, 'bad');
      res += ' · Takım -5';
    } else {
      headline({ gala: `${fullName()} film galasında kırmızı halıda`, fashion: `${fullName()} moda haftasında ön sıradaydı`, charity: `${fullName()} hayır gecesinde çocuklar için bağış yaptı`, party: `${fullName()} ünlülerin partisinde`, tv: `${fullName()} akşam şovunda: yetenek gösterisi alkış topladı`, award: `${fullName()} spor ödülleri gecesinde göz kamaştırdı`, podcast: `${fullName()} podcastte kariyerini anlattı`, ad: `${fullName()} yeni reklam yüzü oldu` }[x.k], 'good');
    }
    if (x.meet && !gf() && p.age >= 18 && p.fame >= 50 && U.chance(0.35)) { rerender(); return celebMeet(x); }
    Game.toast(`${x.n} · ${res}`, 'good');
    rerender();
  }
  // ünlü biriyle tanışma (yalnız sevgilisi yokken)
  function celebMeet(x) {
    const nm = U.pick(typeof GF_NAMES !== 'undefined' ? GF_NAMES : ['Deniz']), job = U.pick(['dizi oyuncusu', 'şarkıcı', 'model', 'moda tasarımcısı']);
    Game.modal(`<div class="sl-modal">${img(x.sc, null, 'hero')}<h3>Bir ünlüyle tanıştın</h3><p><b>${esc(nm)}</b> (${job}) gecenin sonunda yanına geldi. Sohbet çok iyi gitti.</p></div>`, [
      { t: 'Kibarca ayrıl', cls: 'btn-ghost', fn: () => { Game.toast(`${x.n} · güzel bir geceydi.`, 'good'); rerender(); } },
      { t: 'Numarasını al', cls: 'btn-big', fn: () => {
        const s = Game.state, Lf = L();
        if (Lf && !Lf.gf) {
          Lf.gf = { name: nm, job, rel: 45, since: s.season.year, married: false, celeb: 1 };
          headline(`Yeni aşk mı? ${fullName()} ve ${job} ${nm} aynı masada!`, 'good');
          Game.news(`Magazin: ${fullName()} ile ${job} ${nm} birlikte görüntülendi!`, 'world');
          Player.addFame(P(), 0.4); Player.addMorale(P(), 6);
          Game.toast(`${nm} ile tanıştın! Ün +0.4 · Moral +6`, 'good');
        }
        rerender();
      } },
    ]);
  }
  // takım arkadaşı krizi
  function mateName() {
    try { const r = Game.teamRoster(Game.state.clubId) || []; const me = fullName(); const c = r.filter((x) => x && x.n && x.n !== me); return c.length ? U.pick(c).n : null; } catch (e) { return null; }
  }
  const CRISIS = [
    (a, b) => `${a}, ${b} hakkında "takımın yükünü ben çekiyorum" dedi iddiası`,
    (a, b) => `Antrenmanda gerginlik: ${a} ile ${b} arasında sert tartışma`,
    (a, b) => `Sosyal medyada soğuk rüzgârlar: ${b}, ${a} hesabını takipten çıktı`,
  ];
  function crisisRoll() {
    const p = P(), d = D(), s = Game.state;
    if (d.mg.cr || p.fame < 35 || !U.chance(0.05)) return;
    const b = mateName();
    if (!b) return;
    const i = U.randi(0, CRISIS.length - 1);
    d.mg.cr = { i, b, y: s.season.year, r: s.season.round };
    headline(CRISIS[i](fullName(), b), 'bad');
  }
  function crisisAct(c) {
    const d = D(), cr = d.mg.cr, p = P();
    if (!cr) return;
    let r = '';
    if (c === 'talk') { r = fx({ team: 6, m: 2 }); headline(`${fullName()} ve ${cr.b} barıştı: "Biz bir aileyiz"`, 'good'); }
    else if (c === 'pr') { r = fx({ team: 3, fans: 3, fame: -0.1 }); headline(`${fullName()} açıklama yaptı: "Sözlerim çarpıtıldı"`, ''); }
    else { r = fx({ team: -6, fame: 0.2 }); headline(`${fullName()} sessizliğini koruyor, ${cr.b} ile buzlar erimedi`, 'bad'); }
    d.mg.cr = null;
    Game.toast(r, c === 'quiet' ? 'bad' : 'good');
    rerender();
  }
  // haftalık manşetler: oyuncunun hayatındaki değişikliklerden
  function magWeek() {
    const p = P(), d = D(), s = Game.state, ss = s.season.stats || {};
    const snap = { g: ss.goals || 0, gf: gf() ? gf().name : '', mar: gf() ? !!gf().married : false, sp: (p.mall && p.mall.spent) || 0, club: s.clubId, r: s.season.round };
    const o = d.mg.snap;
    d.mg.snap = snap;
    if (p.fame < 15 || !o) return;
    const n = fullName();
    if (snap.club !== o.club) return;
    if (snap.g - o.g >= 2 && snap.r !== o.r) headline(`${n} durdurulamıyor: bir haftada ${snap.g - o.g} gol!`, 'good');
    if (snap.gf && snap.gf !== o.gf) headline(`Kalbi çalındı: ${n} ve ${snap.gf} el ele görüntülendi`, '');
    else if (snap.mar && !o.mar) headline(`Yılın düğünü: ${n} ve ${snap.gf} evlendi!`, 'good');
    else if (!snap.gf && o.gf) headline(`Ayrılık: ${n} ve ${o.gf} yollarını ayırdı`, 'bad');
    const spent = usdOf(snap.sp - o.sp);
    if (spent >= 40000) headline(`${n} alışverişe doymuyor: bir haftada ${money(snap.sp - o.sp)} harcadı`, '');
    if (U.chance(p.fame >= 50 ? 0.3 : 0.15)) {
      headline(U.pick([
        `${n} yeni saç modeliyle dikkat çekti`, `${n} antrenman çıkışı hayranlarıyla tek tek fotoğraf çektirdi`,
        `${n} sevdiği restoranda ailesiyle akşam yemeğinde`, `${n} sabah koşusunda görüntülendi`,
        `${n} hayranının doğum gününe sürpriz yaptı`, `${n} mahallesindeki çocuklara forma dağıttı`,
        `${n} yeni dövme mi yaptırdı? Sosyal medya bunu konuşuyor`, `${n} ünlü bir şefin restoranında görüldü`,
      ]), '');
    }
    crisisRoll();
  }

  function magView() {
    const p = P(), d = D(), m = d.mg, key = wkKey(), s = Game.state;
    m.unread = 0;
    const list = invites();
    const inv = list.length ? list.map((x) => { const c = x.usd ? price(x.usd) : 0, done = m.went === key; return `<div class="sl-mini">${img(x.sc, null, 'sm')}<div class="sl-cb"><b>${x.n}</b><small>${x.d}</small><div class="sl-chips">${chips(x.fx)}${x.pay ? `<span class="sl-chip pos"><i>Ücret</i> <b>${money(adPay())}</b></span>` : ''}${x.scandal ? '<span class="sl-chip bad"><i>Skandal riski</i></span>' : ''}</div><div class="sl-pr">${c ? `<b>${money(c)}</b>` : '<b></b>'}<button class="sl-btn" data-sl="inv:${x.k}" type="button" ${done || s.ap <= 0 || p.money < c || s.seasonEnd ? 'disabled' : ''}>${done ? 'Bu hafta katıldın' : 'Katıl · 1 aksiyon'}</button></div></div></div>`; }).join('') : `<div class="sl-empty">Davetler ünün 15'i geçince gelmeye başlar.</div>`;
    const cr = m.cr ? `<div class="sl-crisis"><span class="sl-kick">Kriz</span><b>${esc(CRISIS[m.cr.i](fullName(), m.cr.b))}</b><small>Takım arkadaşınla aranızdaki haber manşetlerde. Ne yapacaksın?</small><div class="sl-crb"><button class="sl-btn" data-sl="cr:talk" type="button">Arayıp konuş</button><button class="sl-btn ghost" data-sl="cr:pr" type="button">Açıklama yap</button><button class="sl-btn ghost" data-sl="cr:quiet" type="button">Yorum yapma</button></div></div>` : '';
    const g = gf();
    const news = m.news.length ? m.news.map((x, i) => `<div class="sl-news ${x.tone} ${i === 0 ? 'top' : ''}"><span class="sl-kick">${x.tone === 'bad' ? 'Gündem' : x.tone === 'good' ? 'Magazin' : 'Paparazzi'}</span><b>${esc(x.t)}</b><small>${x.y} · ${x.r + 1}. hafta</small></div>`).join('') : '<div class="sl-empty">Henüz hakkında çıkan bir haber yok.</div>';
    return `<div class="ph-appv sl sl-mg">${Phone.ui.top('Magazin')}<div class="ph-body">
      <div class="sl-mast"><b>MAGAZİN</b><small>Ünlülerin dünyası · ${s.season.year}</small><div class="sl-fame"><span>Ün</span><i><em style="width:${U.clamp(p.fame, 0, 100)}%"></em></i><b>${Math.round(p.fame)}</b></div>${g && g.celeb ? `<div class="sl-note">💫 ${esc(g.name)} ile ilişkin magazinin gözdesi.</div>` : ''}</div>
      ${cr}${sec('Bu haftanın davetleri', 'Haftada bir davete katılabilirsin')}${inv}
      ${sec('Manşetler')}${news}</div></div>`;
  }

  // =====================================================================
  // 3) YATIRIM
  // =====================================================================
  const BIZ = [
    { k: 'cafe', sc: 'cafe', n: 'Kahve dükkânı', d: 'Mahallende küçük ve şık bir kafe. Gelir hava durumuna, sezona göre oynar.', usd: 60000, y: 0.0022, vol: 0.9 },
    { k: 'resto', sc: 'resto', n: 'Restoran', d: 'Şehir merkezinde akşam restoranı. İyi haftada çok kazandırır, kötü haftada zarar.', usd: 240000, y: 0.0025, vol: 1.2 },
    { k: 'flats', sc: 'flats', n: 'Kiralık daireler', d: 'Altı daireli bir apartman. Düzenli ve güvenli kira geliri.', usd: 480000, y: 0.0017, vol: 0.15 },
    { k: 'brand', sc: 'brand', n: 'Giyim markan', d: 'Adını taşıyan bir giyim serisi. Satışlar ününle birlikte artar.', usd: 750000, y: 0.0014, vol: 0.7, fameY: 0.0025, min: 40 },
    { k: 'boots', sc: 'boots', n: 'İmza kramponun', d: 'Bir spor markasıyla kendi krampon serin. Ancak çok ünlü oyunculara teklif edilir.', usd: 1400000, y: 0.0012, vol: 0.5, fameY: 0.0025, min: 60 },
    { k: 'resid', sc: 'resid', n: 'Rezidans projesi', d: 'Büyük bir konut projesine ortaklık. Yüksek getiri, yüksek risk.', usd: 3000000, y: 0.0026, vol: 1.6 },
    { k: 'academy', sc: 'academy', n: 'Memleket futbol akademisi', d: 'Memleketinde çocuklar için ücretsiz akademi. Para kazandırmaz, gönül kazandırır.', usd: 380000, y: -0.0008, vol: 0.1, fans: 0.25, fam: 0.2, legacy: 1 },
    { k: 'stake', sc: 'stadium', n: 'Çocukluk kulübünde hisse', d: 'Futbola başladığın kulübün hissedarı ol. Kulüp büyüdükçe hissen değerlenir.', usd: 1900000, y: 0.0008, vol: 0.4, fans: 0.15, legacy: 1, min: 30 },
  ];
  const bizV = (o) => o.v / U.CUR.USD.rate;
  function bizBuy(k) {
    const x = BIZ.find((b) => b.k === k), p = P(), d = D().bz, s = Game.state;
    if (!x || d.own[k]) return;
    if (x.min && p.fame < x.min) return Game.toast(`Bu yatırım için en az ${x.min} ün gerekiyor.`, 'bad');
    const c = price(x.usd);
    if (p.money < c) return Game.toast('Yeterli paran yok.', 'bad');
    p.money -= c;
    d.own[k] = { v: usdOf(c), since: s.season.year, last: 0, tot: 0 };
    bizLog(`${x.n}: satın aldın`, -c);
    headline(k === 'academy' ? `${fullName()} memleketinde çocuklar için futbol akademisi açtı` : k === 'brand' ? `${fullName()} kendi giyim markasını kurdu` : k === 'boots' ? `${fullName()} için imza krampon serisi geliyor` : k === 'stake' ? `${fullName()} çocukluk kulübüne ortak oldu` : `${fullName()} iş dünyasında: ${x.n}`, 'good');
    if (k === 'academy') Player.addRel(p, 'fans', 5);
    if (k === 'academy' || k === 'stake' || k === 'brand' || k === 'boots') try { Social.post('life', k === 'academy' ? 'Memleketimdeki çocuklar için akademimiz açıldı. Hayallerin peşinden koşun!' : k === 'stake' ? 'Futbola başladığım kulübe geri dönüyorum, bu kez ortak olarak.' : k === 'brand' ? 'Kendi markam yayında. İlk koleksiyon sizinle!' : 'İmza kramponum hazır. Sahalarda görüşürüz!', 1.4); } catch (e) { /* yok */ }
    Game.toast(`${x.n}: satın aldın`, 'good');
    rerender();
  }
  function bizSell(k) {
    const x = BIZ.find((b) => b.k === k), p = P(), d = D().bz, o = d.own[k];
    if (!x || !o) return;
    const amt = Math.round(bizV(o) * 0.9);
    Game.modal(`<h3>${x.n} satılsın mı?</h3><p>Alıcı teklifi: <b>${money(amt)}</b></p>`, [
      { t: 'Vazgeç', cls: 'btn-ghost' },
      { t: 'Sat', cls: 'btn-big', fn: () => {
        if (!d.own[k]) return;
        p.money += amt; delete d.own[k];
        bizLog(`${x.n}: sattın`, amt);
        Game.toast(`${x.n} satıldı: +${money(amt)}`, 'good');
        rerender();
      } },
    ]);
  }
  function bizLog(t, a) { const d = D().bz, s = Game.state; d.log.unshift({ y: s.season.year, r: s.season.round, t, a: Math.round(a) }); d.log = d.log.slice(0, 20); }
  const BEV = {
    cafe: [['Kafen sosyal medyada viral oldu, kuyruk kapıya dayandı', 1.6], ['Kafenin kahve makinesi bozuldu, tamir masrafı', -0.8]],
    resto: [['Restoranın ünlü bir yemek eleştirmeninden tam puan aldı', 1.8], ['Restoranında mutfak yangını: bir hafta kapalı', -1.4]],
    flats: [['Dairelerden birinde kiracı değişti, kira artışı', 0.5], ['Apartmanın çatısı onarıldı', -0.6]],
    brand: [['Markanın yeni koleksiyonu tükendi', 1.8], ['Markanın kargo deposunda sorun, iadeler arttı', -0.9]],
    boots: [['İmza kramponun gençlerin favorisi oldu', 1.6], ['Krampon serisinde üretim hatası, geri çağırma', -1.2]],
    resid: [['Rezidans projesinde satışlar patladı', 2], ['Rezidans projesinde inşaat durdu, ek maliyet', -1.8]],
    academy: [['Akademinden bir çocuk profesyonel sözleşme imzaladı!', 0], ['Akademiye yeni saha ve soyunma odası yapıldı', -0.5]],
    stake: [['Çocukluk kulübün bir üst lige yükseldi, hissen değerlendi', 0.8], ['Kulüp borçlarını kapatmak için sermaye artırdı', -0.5]],
  };
  // haftalık işletme hesabı (maç haftası ve milli ara dahil, her hafta)
  function bizWeek() {
    if (!has('bz')) return;
    const p = P(), d = p.sl.bz, ks = Object.keys(d.own || {});
    if (!ks.length) return;
    let net = 0;
    ks.forEach((k) => {
      const x = BIZ.find((b) => b.k === k), o = d.own[k];
      if (!x || !o) return;
      const fameY = x.fameY ? (x.fameY * U.clamp(p.fame, 0, 100)) / 100 : 0;
      let y = (x.y + fameY) * (1 + U.rand(-1, 1) * x.vol * 0.6);
      let ev = null;
      if (U.chance(0.035)) { ev = U.pick(BEV[k] || []); if (ev) y += (ev[1] * Math.abs(x.y || 0.003) * 4); }
      const inc = Math.round(bizV(o) * y);
      o.last = inc; o.tot = (o.tot || 0) + inc;
      net += inc;
      // değer: yavaşça dalgalanır; rezidans daha oynak
      o.v = Math.max(usdOf(price(x.usd)) * 0.45, o.v * (1 + U.rand(-0.006, 0.008) * (x.vol + 0.3)));
      if (k === 'academy' || k === 'stake') { if (x.fans) Player.addRel(p, 'fans', x.fans); if (x.fam) Player.addRel(p, 'family', x.fam); }
      if (ev) {
        bizLog(ev[0], inc);
        if (k === 'academy' && ev[1] === 0) { Player.addMorale(p, 4); Player.addRel(p, 'fans', 3); headline(`Akademiden ilk profesyonel çıktı: ${fullName()} gururlu`, 'good'); }
        try { Game.news(`💼 ${ev[0]}.`, ev[1] >= 0 ? 'good' : 'bad'); } catch (e) { /* yok */ }
      }
    });
    p.money += net;
    d.wk = net;
  }
  function bizView() {
    const p = P(), d = D().bz, ks = Object.keys(d.own);
    const val = ks.reduce((t, k) => t + bizV(d.own[k]), 0);
    const tot = ks.reduce((t, k) => t + (d.own[k].tot || 0), 0);
    const mine = ks.map((k) => { const x = BIZ.find((b) => b.k === k), o = d.own[k]; if (!x) return ''; return `<div class="sl-mini own">${img(x.sc, null, 'sm')}<div class="sl-cb"><b>${x.n}</b><small><span>Değer</span> ${money(bizV(o))}</small><div class="sl-kv"><span>Geçen hafta</span><b class="${o.last >= 0 ? 'pos' : 'neg'}">${o.last >= 0 ? '+' : ''}${money(o.last)}</b></div><div class="sl-kv"><span>Toplam kazanç</span><b class="${o.tot >= 0 ? 'pos' : 'neg'}">${o.tot >= 0 ? '+' : ''}${money(o.tot)}</b></div><div class="sl-pr"><span></span><button class="sl-btn ghost" data-sl="bs:${k}" type="button">Sat</button></div></div></div>`; }).join('');
    const market = BIZ.filter((x) => !d.own[x.k]).map((x) => { const c = price(x.usd), lock = x.min && p.fame < x.min; return `<div class="sl-card">${img(x.sc)}<div class="sl-cb"><b>${x.n}</b><small>${x.d}</small><div class="sl-chips">${x.legacy ? '<span class="sl-chip pos"><i>Miras</i></span>' : ''}${x.fans ? '<span class="sl-chip pos"><i>Taraftar sevgisi</i></span>' : ''}${x.fameY ? '<span class="sl-chip pos"><i>Ünle büyür</i></span>' : ''}${x.vol >= 1.2 ? '<span class="sl-chip bad"><i>Yüksek risk</i></span>' : x.vol <= 0.2 ? '<span class="sl-chip pos"><i>Düşük risk</i></span>' : ''}</div><div class="sl-pr"><b>${money(c)}</b>${lock ? `<span class="sl-tag lock">${x.min} ün gerekli</span>` : `<button class="sl-btn" data-sl="bb:${x.k}" type="button" ${p.money < c ? 'disabled' : ''}>Satın al</button>`}</div></div></div>`; }).join('');
    const log = d.log.length ? `${sec('Hareketler')}<div class="sl-log">${d.log.slice(0, 10).map((x) => `<div><span>${x.y} · ${x.r + 1}. hafta</span><b>${esc(x.t)}</b><em class="${x.a >= 0 ? 'pos' : 'neg'}">${x.a >= 0 ? '+' : ''}${money(x.a)}</em></div>`).join('')}</div>` : '';
    return `<div class="ph-appv sl sl-bz">${Phone.ui.top('Yatırım')}<div class="ph-body">
      ${ks.length ? `<div class="sl-port"><small>Portföy değeri</small><b>${money(val)}</b><div class="sl-kv"><span>Haftalık net</span><b class="${(d.wk || 0) >= 0 ? 'pos' : 'neg'}">${(d.wk || 0) >= 0 ? '+' : ''}${money(d.wk || 0)}</b></div><div class="sl-kv"><span>Toplam kazanç</span><b class="${tot >= 0 ? 'pos' : 'neg'}">${tot >= 0 ? '+' : ''}${money(tot)}</b></div></div>` : ''}
      ${ks.length ? sec('İşletmelerin') + mine : ''}
      ${market ? sec('Yatırım fırsatları', 'Gelir her hafta hesabına geçer') + market : ''}${log}</div></div>`;
  }

  // =====================================================================
  // 4) MİRAS
  // =====================================================================
  function clubStats() {
    const p = P(), s = Game.state, by = {};
    (p.history || []).forEach((h) => { if (!h.apps) return; const c = by[h.club] = by[h.club] || { club: h.club, se: 0, apps: 0, ga: 0 }; c.se++; c.apps += h.apps; c.ga += (h.goals || 0) + (h.assists || 0); });
    try {
      const ss = s.season.stats;
      if (ss && ss.apps && !s.seasonEnd) { const n = Game.teamName(); const c = by[n] = by[n] || { club: n, se: 0, apps: 0, ga: 0 }; c.se += 1; c.apps += ss.apps; c.ga += (ss.goals || 0) + (ss.assists || 0); c.cur = 1; }
    } catch (e) { /* yok */ }
    return Object.values(by);
  }
  const GOALS = {
    statue: { n: 'Kulüp heykeli', d: 'Bir kulüpte en az 7 sezon, 220 maç ve 90 gol+asist', f: (c) => Math.min(c.se / 7, 1) * 0.3 + Math.min(c.apps / 220, 1) * 0.35 + Math.min(c.ga / 90, 1) * 0.35, ok: (c) => c.se >= 7 && c.apps >= 220 && c.ga >= 90 },
    number: { n: 'Emekli forma numarası', d: 'Bir kulüpte en az 9 sezon ve 280 maç', f: (c) => Math.min(c.se / 9, 1) * 0.5 + Math.min(c.apps / 280, 1) * 0.5, ok: (c) => c.se >= 9 && c.apps >= 280 },
  };
  const bestFor = (g) => clubStats().map((c) => ({ c, v: GOALS[g].f(c) })).sort((a, b) => b.v - a.v)[0] || null;
  const testimonialOk = () => { const p = P(); return (p.totals && p.totals.apps >= 400) || (p.age >= 33 && p.fame >= 60); };
  const testimonialPct = () => { const p = P(); return Math.max(Math.min(1, ((p.totals && p.totals.apps) || 0) / 400), p.age >= 33 ? Math.min(1, p.fame / 60) : 0); };
  const BOOK = {
    honest: { n: 'Samimi', title: 'Sahadan Öte', d: 'Zor günler, ailen ve gerçek duyguların.', fx: { fans: 8, fam: 6, m: 4 }, mul: 1 },
    bold: { n: 'Sert ve olaylı', title: 'Susmayacağım', d: 'Soyunma odası sırları, eski hocalar, kavgalar. Çok satar, çok kızdırır.', fx: { fame: 1.2, coach: -10, team: -8 }, mul: 1.7 },
    humble: { n: 'Mütevazı', title: 'Mahalleden Zirveye', d: 'Takım arkadaşlarına teşekkür, gençlere öğütler.', fx: { team: 6, fans: 4, m: 3 }, mul: 0.8 },
  };
  const bookOpen = () => { const p = P(); return p.age >= 29 && p.fame >= 45; };
  const bookAdv = (t) => price(Math.round((15000 + P().fame * 1200) * BOOK[t].mul));
  function writeBook(t) {
    const p = P(), lg = D().lg, b = BOOK[t];
    if (!b || lg.book || !bookOpen()) return;
    if (!useAp()) return;
    const a = bookAdv(t);
    p.money += a;
    lg.book = { t, y: Game.state.season.year };
    const r = fx(b.fx);
    headline(`Otobiyografi raflarda: ${fullName()}, "${b.title}"`, t === 'bold' ? 'bad' : 'good');
    try { Social.post('life', `Kitabım "${b.title}" bugün raflarda. Her sayfasında ben varım.`, 1.5); } catch (e) { /* yok */ }
    Game.toast(`📖 ${b.title} · +${money(a)} · ${r}`, 'good');
    rerender();
  }
  const punditOpen = () => { const p = P(); return p.age >= 32 && p.fame >= 40; };
  function signPundit() {
    const lg = D().lg;
    if (lg.tv || !punditOpen()) return;
    lg.tv = { y: Game.state.season.year };
    headline(`${fullName()} emekli olunca ekranlara geliyor: TV yorumculuğu için anlaştı`, 'good');
    Game.toast('🎙️ Anlaşma imzalandı: emekli olunca TV yorumcusu olacaksın.', 'good');
    rerender();
  }
  function legView() {
    const p = P(), lg = D().lg, club = (() => { try { return Game.club(); } catch (e) { return null; } })();
    const bar = (v) => `<div class="sl-prog"><i style="width:${Math.round(U.clamp(v, 0, 1) * 100)}%"></i></div>`;
    const goal = (g, sc, o) => { const b = bestFor(g), G = GOALS[g], ok = b && G.ok(b.c); return `<div class="sl-card ${ok ? 'on' : ''}">${img(sc, o)}<div class="sl-cb"><b>${G.n}</b><small>${G.d}</small>${b ? `<div class="sl-kv"><span>${esc(b.c.club)}</span><b>${b.c.se} <i>sezon</i> · ${b.c.apps} <i>maç</i> · ${b.c.ga} <i>G+A</i></b></div>${bar(b.v)}` : '<small>Henüz maç yok.</small>'}${ok ? '<span class="sl-tag own">Hak ettin, emeklilikte gerçekleşir</span>' : ''}</div></div>`; };
    const tp = testimonialPct();
    const sc = typeof Legacy !== 'undefined' ? Legacy.score(p) : 0;
    const book = lg.book ? `<div class="sl-card on">${img('book')}<div class="sl-cb"><b>${BOOK[lg.book.t].title}</b><small>Otobiyografin · ${lg.book.y}</small><span class="sl-tag own">Raflarda</span></div></div>`
      : bookOpen() ? `<div class="sl-card">${img('book')}<div class="sl-cb"><b>Otobiyografi</b><small>Yayınevleri hikâyeni istiyor. Kitabın tonunu sen seç.</small>${Object.entries(BOOK).map(([k, b]) => `<div class="sl-opt"><div><b>${b.n}</b><small>${b.d}</small><div class="sl-chips">${chips(b.fx)}<span class="sl-chip pos"><i>Avans</i> <b>${money(bookAdv(k))}</b></span></div></div><button class="sl-btn" data-sl="bk:${k}" type="button" ${Game.state.ap <= 0 || Game.state.seasonEnd ? 'disabled' : ''}>Yaz · 1 aksiyon</button></div>`).join('')}</div></div>`
      : `<div class="sl-card dim">${img('book')}<div class="sl-cb"><b>Otobiyografi</b><small>29 yaşından sonra ve ünün 45'i geçince yayınevleri kapını çalar.</small></div></div>`;
    const tv = lg.tv ? `<div class="sl-card on">${img('pundit')}<div class="sl-cb"><b>TV yorumculuğu</b><small>Emekli olunca ekranlardasın.</small><span class="sl-tag own">İmzalandı</span></div></div>`
      : punditOpen() ? `<div class="sl-card">${img('pundit')}<div class="sl-cb"><b>TV yorumculuğu teklifi</b><small>Bir spor kanalı, emekli olunca seni maç yorumcusu yapmak istiyor.</small><div class="sl-pr"><span></span><button class="sl-btn" data-sl="tv" type="button">İmzala</button></div></div></div>`
      : `<div class="sl-card dim">${img('pundit')}<div class="sl-cb"><b>TV yorumculuğu</b><small>32 yaşından sonra ve ünün 40'ı geçince kanallar teklif getirir.</small></div></div>`;
    const bz = has('bz') ? Object.keys(P().sl.bz.own || {}).filter((k) => { const x = BIZ.find((b) => b.k === k); return x && x.legacy; }) : [];
    return `<div class="ph-appv sl sl-lg">${Phone.ui.top('Miras')}<div class="ph-body">
      <div class="sl-port lg"><small>Efsane puanı</small><b>${sc}</b><span>${typeof Legacy !== 'undefined' ? Legacy.title(sc) : ''}</span></div>
      ${sec('Kulüp mirası', 'Emekli olduğunda gerçekleşir')}${goal('statue', 'statue')}${goal('number', 'jersey', { c: club ? club.c1 : '#c8102e', c2: club ? club.c2 : '#fff', n: p.shirt || 10 })}
      <div class="sl-card ${testimonialOk() ? 'on' : ''}">${img('stadium')}<div class="sl-cb"><b>Jübile maçı</b><small>400 maç ya da 33 yaşında 60 ün: dolu tribünler önünde veda maçı.</small>${bar(tp)}${testimonialOk() ? '<span class="sl-tag own">Hak ettin</span>' : ''}</div></div>
      ${sec('Kariyer sonrası')}${book}${tv}
      ${bz.length ? `${sec('Bıraktığın izler')}${bz.map((k) => { const x = BIZ.find((b) => b.k === k); return `<div class="sl-mini">${img(x.sc, null, 'sm')}<div class="sl-cb"><b>${x.n}</b><small>Miras</small></div></div>`; }).join('')}` : ''}
      </div></div>`;
  }
  // emeklilik ekranına miras bölümü
  function retireBlock() {
    if (!has('lg') && !has('bz') && !(P().history || []).length) return '';
    const p = P(), out = [];
    const st = bestFor('statue'), nb = bestFor('number');
    if (st && GOALS.statue.ok(st.c)) out.push(`<li><b>🗿</b><span>${esc(st.c.club)} stadının önüne heykelin dikilecek</span></li>`);
    if (nb && GOALS.number.ok(nb.c)) out.push(`<li><b>👕</b><span>${p.shirt || 10} numaralı forma ${esc(nb.c.club)} kulübünde emekliye ayrıldı</span></li>`);
    if (testimonialOk()) out.push('<li><b>🏟️</b><span>Jübile maçı: dolu tribünler önünde son kez sahadaydın</span></li>');
    const lg = (p.sl && p.sl.lg) || {};
    if (lg.book && BOOK[lg.book.t]) out.push(`<li><b>📖</b><span>Otobiyografin: ${BOOK[lg.book.t].title}</span></li>`);
    if (lg.tv) out.push('<li><b>🎙️</b><span>Artık ekranlarda maç yorumcususun</span></li>');
    const own = (p.sl && p.sl.bz && p.sl.bz.own) || {};
    const ks = Object.keys(own);
    if (ks.length) out.push(`<li><b>💼</b><span class="sl-bzl">${ks.map((k) => (BIZ.find((b) => b.k === k) || {}).n).filter(Boolean).map((n) => `<span>${n}</span>`).join('')}</span></li>`);
    if (!out.length) return '';
    return `<div class="sl-end"><h3>Miras</h3><ul>${out.join('')}</ul></div>`;
  }

  // =====================================================================
  // telefon bağlantıları
  // =====================================================================
  const svg = (inner) => `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
  const APPS = [
    { k: 'travel', n: 'Seyahat', bg: 'linear-gradient(135deg,#27c4e8,#0a6fb5)', ic: svg('<path d="M3 15l18-7-4 10-5-3-3 4v-5"/><path d="M12 15l9-7"/>'), on, view: travelView },
    { k: 'mag', n: 'Magazin', bg: 'linear-gradient(135deg,#ff4f7b,#b0124a)', ic: svg('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/><circle cx="16" cy="16" r="1.4" fill="#fff"/>'), on: () => on() && P().fame >= 10, badge: () => { const m = has('mg') && P().sl.mg; return (m && m.unread ? Math.min(9, m.unread) : 0) + (m && m.cr ? 1 : 0); }, view: magView },
    { k: 'biz', n: 'Yatırım', bg: 'linear-gradient(135deg,#2bc48a,#0b6b49)', ic: svg('<path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/><path d="M4 9l6-4 6 7 5-5"/>'), on, view: bizView },
    { k: 'legacy', n: 'Miras', bg: 'linear-gradient(135deg,#d9b25a,#7a5416)', ic: svg('<path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19l1-5.8L3.5 9.2l5.9-.9z"/>'), on: () => on() && P().age >= 21, view: legView },
  ];
  function install() {
    if (typeof Phone === 'undefined' || typeof Game === 'undefined') return;
    Phone.ext = Phone.ext || [];
    Phone.views = Phone.views || {};
    APPS.forEach((a) => { Phone.ext.push({ k: a.k, n: a.n, bg: a.bg, ic: a.ic, on: a.on, badge: a.badge }); Phone.views[a.k] = () => a.view(); });
    const prevClick = Phone.extClick;
    Phone.extClick = (b) => {
      const v = b.dataset.sl || '';
      const [c, arg] = v.split(':');
      const map = { tr: () => book(arg), trx: cancelTrip, gw: () => getaway(arg), inv: () => attend(arg), cr: () => crisisAct(arg), bb: () => bizBuy(arg), bs: () => bizSell(arg), bk: () => writeBook(arg), tv: signPundit };
      if (map[c]) return map[c]();
      if (prevClick) return prevClick(b);
    };
    const prevBank = Phone.bankExtra;
    Phone.bankExtra = () => {
      let h = prevBank ? prevBank() : '';
      try {
        if (has('bz')) { const d = P().sl.bz; if (Object.keys(d.own || {}).length) h += `<div class="ph-inc sl-inc"><div><span>Yatırım geliri (geçen hafta)</span><b class="${(d.wk || 0) >= 0 ? 'pos' : 'neg'}">${(d.wk || 0) >= 0 ? '+' : ''}${money(d.wk || 0)}</b></div></div>`; }
      } catch (e) { /* yok */ }
      return h;
    };
    // haftalık: işletmeler her hafta; manşetler lig haftalarında
    const aw = Game.advanceWeek;
    Game.advanceWeek = function (intl) {
      try { if (on()) { bizWeek(); if (!intl && P().fame >= 10) magWeek(); } } catch (e) { console.error(e); }
      return aw.apply(this, arguments);
    };
    // sezon arası tatil
    const sns = Game.startNewSeason;
    Game.startNewSeason = function () {
      let b = null;
      try { b = tripPending(); } catch (e) { b = null; }
      const r = sns.apply(this, arguments);
      if (b) { try { tripApply(b); Game.save(); Game.render(); } catch (e) { console.error(e); } }
      return r;
    };
    // emeklilik ekranı
    const ret = Game.retire;
    Game.retire = function () {
      let blk = '';
      try { blk = retireBlock(); } catch (e) { blk = ''; }
      const r = ret.apply(this, arguments);
      if (blk) { try { const el = document.getElementById('end'), at = el && el.querySelector('.end-btns'); if (at) { at.insertAdjacentHTML('beforebegin', blk); UI.strip(el); } } catch (e) { console.error(e); } }
      return r;
    };
  }
  install();
  return { DEST, GETAWAY, INV, BIZ, BOOK, invites, tripApply, bizWeek, magWeek, retireBlock, clubStats, price, on };
})();
