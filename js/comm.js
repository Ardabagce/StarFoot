// Maç anlatımı: arka planda oynanan dakikalara renk katan cümleler.
// Şut istatistiğiyle bağlantılı (şut → kaçtı/kurtarıldı) ve genel akış cümleleri; skor ve dakikaya göre değişir.
const Comm = {
  last: (n) => String(n || '').split(' ').slice(-1)[0],
  pick(team, pos) {
    const r = (team && team.roster) || [];
    const pool = pos ? r.filter((x) => pos.includes(x.pos)) : r.filter((x) => x.pos !== 'GK');
    const x = pool.length ? U.pick(pool) : null;
    return x ? Comm.last(x.n) : (team && (team.short || team.name)) || '';
  },
  gk(team) { const r = (team && team.roster) || []; const g = r.find((x) => x.pos === 'GK'); return g ? Comm.last(g.n) : 'Kaleci'; },
  // Şut: isabetsiz ya da kurtarılan
  shot(att, def, onTarget, min) {
    const X = U.esc(Comm.pick(att, ['FW', 'MF'])), K = U.esc(Comm.gk(def)), T = U.esc(att.name);
    const m = `<b>${min}'</b> `;
    if (onTarget) return m + U.pick([
      `${X} sert vurdu, ${K} köşede topu çıkardı!`,
      `${X} kafayla buluştu, ${K} gole izin vermedi.`,
      `${T} hızlı geldi, ${X} vurdu, ${K} iki hamlede topu kontrol etti.`,
      `${X} ceza sahası dışından denedi, ${K} parmak uçlarıyla kornere çeldi!`,
      `${X} plase vurdu, ${K} son anda bacağıyla kurtardı!`,
    ]);
    return m + U.pick([
      `${X} ceza sahası dışından şansını denedi, top üstten auta gitti.`,
      `${X} direğin hemen yanından kaçırdı! ${T} için büyük fırsattı.`,
      `${T} kontraya çıktı, ${X} son vuruşta dengesini kaybetti.`,
      `${X} kafa vuruşunda topu çerçeveye gönderemedi.`,
      `${X} vurdu, top savunmaya çarpıp kornere gitti.`,
      `${X} vole denedi, top tribünlere gitti.`,
    ]);
  },
  // Genel akış cümlesi (dakika başı küçük olasılıkla)
  flow(o) {
    const { home, away, hs, as, min, homeR, awayR } = o;
    const attHome = U.chance(U.clamp(0.5 + (homeR - awayR) / 80, 0.25, 0.75));
    const att = attHome ? home : away, def = attHome ? away : home;
    const X = U.esc(Comm.pick(att)), D = U.esc(Comm.pick(def, ['DF', 'MF'])), K = U.esc(Comm.gk(def)), A = U.esc(att.name), B = U.esc(def.name);
    const lead = hs === as ? null : hs > as ? home : away, trail = hs === as ? null : hs > as ? away : home;
    const m = `<b>${min}'</b> `;
    const pool = [
      `${A} topu ayağında tutuyor, sabırlı bir oyun kuruyor.`,
      `${X} sağ kanattan ortaladı, ${D} kafayla uzaklaştırdı.`,
      `${X} sol kanatta rakibini geçti ama ortası savunmaya takıldı.`,
      `${D} son anda araya girip tehlikeyi önledi.`,
      `${K} uzun topu rahatça kontrol etti.`,
      `Korner ${A} için. Kafa vuruşu üstten auta.`,
      `${X} ofsayta yakalandı, yan hakem bayrağını kaldırdı.`,
      `Orta sahada sert bir ikili mücadele, hakem faul kararı verdi.`,
      `${B} geriye çekildi, ${A} baskıyı artırıyor.`,
      `${X} ile ${U.esc(Comm.pick(att))} verkaç denedi, son pas uzun kaldı.`,
      `${A} serbest vuruş kazandı, top barajdan döndü.`,
    ];
    if (U.chance(0.18)) pool.push(`🟨 ${U.esc(Comm.pick(def, ['DF', 'MF']))} taktik faul yaptı ve sarı kart gördü.`);
    if (min < 12) pool.push(`İki takım da temkinli başladı, oyun daha çok orta sahada.`, `${A} ilk dakikalarda oyunun kontrolünü almak istiyor.`);
    if (min > 30 && min < 45) pool.push(`İlk yarının sonuna doğru tempo yükseldi.`);
    if (min > 55 && min < 75) pool.push(`Kenarda hareketlilik var, değişiklik yapılabilir.`, `${A} teknik direktörü kenardan talimat veriyor.`);
    if (lead && min > 70) pool.push(`${U.esc(lead.name)} skoru korumaya çalışıyor, oyunu yavaşlatıyor.`, `${U.esc(trail.name)} her şeyini ortaya koydu, öne yüklendi.`);
    if (!lead && min > 75) pool.push(`Skor eşit, iki takım da galibiyet golünü arıyor.`);
    if (min >= 86) pool.push(`Son dakikalara girildi, tribünlerde nefesler tutuldu.`, `Hakem uzatma için dördüncü hakemle konuşuyor.`);
    if (o.crowd) pool.push(`Tribünler ${U.esc(home.name)} için tek ses!`, `Taraftar ayakta, stadyum inliyor.`);
    return m + U.pick(pool);
  },
};
