// Maç sonu flaş röportaj: sponsor panosu önünde, mikrofonlu TV görüntüsü ve maça özel 3 soru.
// Kanal ve markalar kurgusal (SF Sport); gerçek yayıncıların logo ve tasarımı kullanılmaz.

// Sorular maçın verilerinden üretilir. c: { opp, own, score, res, goals, assists, rating, min, pos, next, derby, final, gk, saves, late }
// Her sorunun 3 cevabı: mütevazı, kendinden emin, iddialı
const IV_Q = [
  { id: 'hat', cat: 'me', when: (c) => c.goals >= 3, q: (c) => `Hat-trick yaptın! ${c.opp} karşısında topu eve götürüyorsun. Neler hissediyorsun?`,
    a: (c) => ['Bu top takım arkadaşlarımın, onlar olmasa olmazdı.', 'Hayalimdi, sonunda gerçekleşti.', 'Bu sezon kaç tane daha atacağımı göreceksiniz!'] },
  { id: 'goal1', cat: 'me', when: (c) => c.goals >= 1 && c.goals < 3, q: (c) => `${c.min}. dakikada attığın golü anlatır mısın?`,
    a: (c) => ['Arkadaşım çok iyi bir pas verdi, ben sadece dokundum.', 'Kaleciyi izledim, köşeyi seçtim ve vurdum.', 'O pozisyonda kimse beni durduramazdı!'] },
  { id: 'late', cat: 'me', when: (c) => c.late && c.goals > 0, q: () => 'Son dakikalarda gelen golle tribünler yıkıldı. O anı anlatır mısın?',
    a: () => ['Son ana kadar inandık, bu takımın karakteri bu.', 'Böyle anlar için çalışıyoruz, çok mutluyum.', 'Büyük oyuncular büyük anlarda ortaya çıkar.'] },
  { id: 'assist', cat: 'me', when: (c) => c.assists > 0 && c.goals === 0, q: (c) => `Bugün gol atamadın ama ${c.assists} asistle oynadın. Asist mi, gol mü?`,
    a: () => ['Takım kazansın yeter, kimin attığı önemli değil.', 'Asist de en az gol kadar güzel.', 'Bugün asist, bir sonraki maç gol de atarım.'] },
  { id: 'nogoal', cat: 'me', when: (c) => !c.gk && c.goals === 0 && c.assists === 0, q: (c) => `Bugün skor katkın olmadı. ${c.opp} savunması seni zorladı mı?`,
    a: (c) => ['Rakip iyi savundu, ben daha çok çalışmalıyım.', 'Takım için koştum, goller de gelecek.', 'Gelecek maç farkı göreceksiniz.'] },
  { id: 'rateHi', cat: 'me', when: (c) => c.rating >= 8, q: (c) => `Bugün ${c.rating.toFixed(1)} reyting aldın, sahanın en iyilerindendin. Sırrın ne?`,
    a: () => ['Hocamın ve takımın güveni beni rahatlatıyor.', 'Antrenmanda ne yapıyorsam sahada onu yapıyorum.', 'Bu benim normal seviyem, alışın.'] },
  { id: 'rateLo', cat: 'me', when: (c) => c.rating && c.rating < 6.2, q: () => 'Bugün istediğin gibi bir performans değildi. Ne oldu?',
    a: () => ['Kötü bir gündü, sorumluluğu alıyorum.', 'Her maç aynı olmuyor, hemen toparlanırım.', 'Herkes bana bakıyor, ben de insanım.'] },
  { id: 'gkSave', cat: 'me', when: (c) => c.gk && c.saves > 0, q: (c) => `${c.saves} kurtarışla takımını ayakta tuttun. En zor kurtarış hangisiydi?`,
    a: () => ['Savunmamız çok yardım etti, birlikte başardık.', 'Köşeye giden şutu çıkardığım an, çok zordu.', 'Bugün kaleyi kimse geçemezdi.'] },
  { id: 'win', cat: 'res', when: (c) => c.res === 'W', q: (c) => `${c.score} galibiyet! Maçın kırılma anı neydi?`,
    a: () => ['İlk golden sonra takım rahatladı.', 'Planımızı iyi uyguladık, kazanmayı hak ettik.', 'Sahaya çıktığımız an kazanacağımızı biliyordum.'] },
  { id: 'winBig', cat: 'res', when: (c) => c.res === 'W' && c.gd >= 3, q: (c) => `${c.opp} karşısında farklı kazandınız. Rakibe bir mesajın var mı?`,
    a: (c) => [`${c.opp} iyi bir takım, sadece bugün bizim günümüzdü.`, 'Bu skor çalışmamızın karşılığı.', 'Bu daha başlangıç, herkes bizden korksun.'] },
  { id: 'draw', cat: 'res', when: (c) => c.res === 'D', q: (c) => `${c.score} berabere kaldınız. Bu bir puan sevindirir mi?`,
    a: () => ['Bir puan da değerli, yolumuza devam ediyoruz.', 'Kazanabilirdik, biraz şanssızdık.', 'Bu sonuç bizi hiç memnun etmedi.'] },
  { id: 'loss', cat: 'res', when: (c) => c.res === 'L', q: (c) => `${c.opp} karşısında ${c.score} kaybettiniz. Soyunma odasında ne konuştunuz?`,
    a: () => ['Hepimiz sorumluyuz, hemen toparlanacağız.', 'Hatalarımızı konuştuk, ders çıkardık.', 'Bazı arkadaşların daha fazlasını vermesi gerek.'] },
  { id: 'derby', cat: 'res', when: (c) => c.derby, q: (c) => `${c.derby} hakkında ne söylemek istersin? Taraftar bu maçı haftalarca konuşacak.`,
    a: () => ['Taraftarımız için oynadık, bu atmosfer çok özeldi.', 'Derbi heyecanı başka, bu maçı hiç unutmayacağım.', 'Derbilerin adamı benim, herkes gördü.'] },
  { id: 'table', cat: 'fut', when: (c) => c.pos > 0, q: (c) => `Ligde ${c.pos}. sıradasınız. Sezon sonu hedefiniz ne?`,
    a: (c) => ['Maç maç gidiyoruz, hedefi sezon sonunda konuşuruz.', c.pos <= 4 ? 'Avrupa kupaları için savaşacağız.' : 'Daha yukarılarda olmayı hak ediyoruz.', 'Şampiyonluk! Başka bir hedefimiz yok.'] },
  { id: 'next', cat: 'fut', when: (c) => !!c.next, q: (c) => `Sıradaki maçınız ${c.next} ile. Nasıl hazırlanacaksınız?`,
    a: (c) => [`${c.next} saygı duyduğumuz bir takım, iyi hazırlanacağız.`, c.res === 'W' ? 'Bu galibiyet serisini sürdürmek istiyoruz.' : 'Hemen toparlanıp kazanmak istiyoruz.', `${c.next} maçında da gol atacağım, yazın bunu.`] },
  { id: 'fans', cat: 'fut', when: () => true, q: () => 'Tribünlerden destek nasıldı? Taraftara bir mesajın var mı?',
    a: () => ['Desteğiniz için teşekkürler, sizin için oynuyoruz.', 'Bu taraftarın önünde oynamak bir ayrıcalık.', 'Biz kazandıkça stadı daha da dolduracaksınız.'] },
  { id: 'coach', cat: 'fut', when: () => true, q: () => 'Hocanın sana verdiği görevi nasıl değerlendiriyorsun?',
    a: () => ['Hocam ne isterse onu yapmaya hazırım.', 'Bana güveniyor, ben de karşılığını veriyorum.', 'Bence daha fazla sorumluluk almalıyım.'] },
  { id: 'national', cat: 'fut', when: (c) => c.rating >= 7.5, q: () => 'Bu formla milli takım kapısı açılır mı?',
    a: () => ['Önce kulübüme odaklanıyorum, gerisi gelir.', 'Milli formayı giymek en büyük hayalim.', 'Hocalar beni izlemeye devam etsin.'] },
];
// cevap etkileri: [moral, taraftar, hoca, takım, ün]
const IV_FX = [[2, 1, 3, 3, 0.2], [3, 3, 0, 0, 0.5], [2, 5, -3, -3, 1]];

const Interview = {
  // Ortalama 4-5 maçta bir: son röportajdan sonra en az 3 maç geçmeli (final ve hat-trick hariç)
  RATE: 0.35,
  GAP: 3,
  maybe(sum, ctx) {
    const s = Game.state;
    if (!s || Game.inStreet() || Game.isYouth() || !sum || !sum.played || (typeof FF !== 'undefined' && FF.on)) return Promise.resolve();
    s.ivGap = (s.ivGap || 0) + 1;
    const big = sum.goals >= 3 || ctx.final;
    const must = big || sum.motm || ctx.derby || (sum.res === 'L' && sum.ga - sum.gf >= 3);
    if (!big && s.ivGap <= Interview.GAP) return Promise.resolve();
    if (!must && !U.chance(Interview.RATE)) return Promise.resolve();
    s.ivGap = 0;
    return Interview.show(sum, ctx);
  },
  context(sum, ctx) {
    const s = Game.state, p = s.player;
    const home = ctx.side === 'home';
    const own = home ? ctx.home : ctx.away, opp = home ? ctx.away : ctx.home;
    let pos = 0, next = '';
    try {
      const lg = Game.league();
      if (lg) {
        pos = World.sortedTable(lg).findIndex((r) => r.id === s.clubId) + 1;
        const fx = lg.fixtures[s.season.round + 1];
        const f = fx && fx.find(([h, a]) => h === s.clubId || a === s.clubId);
        if (f) next = Game.teamName(f[0] === s.clubId ? f[1] : f[0]);
      }
    } catch (e) { /* yok */ }
    return {
      own: own.name, opp: opp.name, score: `${sum.gf}-${sum.ga}`, res: sum.res, gd: sum.gf - sum.ga,
      goals: sum.goals || 0, assists: sum.assists || 0, rating: sum.rating || 0, min: (sum.goalMins && sum.goalMins[0]) || 0,
      pos, next, derby: ctx.derby || '', final: !!ctx.final, gk: p.position === 'GK', saves: sum.saves || 0, late: !!sum.lateGoal,
    };
  },
  // 3 soru: kişisel, sonuç ve gelecek; son sorulanlar tekrar edilmez
  pick(c) {
    const s = Game.state;
    const used = s.ivUsed || [];
    const out = [];
    ['me', 'res', 'fut'].forEach((cat) => {
      const ok = IV_Q.filter((x) => x.cat === cat && x.when(c));
      const fresh = ok.filter((x) => !used.includes(x.id));
      const pool = fresh.length ? fresh : ok;
      if (pool.length) out.push(U.pick(pool));
    });
    while (out.length < 3) {
      const rest = IV_Q.filter((x) => x.when(c) && !out.includes(x));
      if (!rest.length) break;
      out.push(U.pick(rest));
    }
    s.ivUsed = used.concat(out.map((x) => x.id)).slice(-10);
    return out;
  },
  show(sum, ctx) {
    const s = Game.state, p = s.player;
    const c = Interview.context(sum, ctx);
    const qs = Interview.pick(c);
    if (!qs.length) return Promise.resolve();
    const home = ctx.side === 'home';
    const own = home ? ctx.home : ctx.away;
    const club = Game.club();
    const hs = home ? sum.gf : sum.ga, as = home ? sum.ga : sum.gf;
    const ab = (t) => U.esc((t.short || t.name.slice(0, 3)).toLocaleUpperCase('tr'));
    return new Promise((resolve) => {
      const el = U.el(`<div class="iv">
        <div class="iv-stage"><canvas class="iv-cv"></canvas>
          <div class="iv-bug"><span>${ab(ctx.home)}</span><b>${hs}-${as}</b><span>${ab(ctx.away)}</span></div>
          <div class="iv-live">CANLI</div>
          <div class="iv-l3"><i>SF SPORT</i><b>${U.esc(Player.fullName(p))}</b><small>${U.esc(own.name)} · Maç sonu</small></div>
        </div>
        <div class="iv-q"><div class="iv-dots"></div><h3></h3><div class="iv-opts"></div>
          <button class="iv-skip">Röportajı bitir</button></div>
      </div>`);
      document.body.appendChild(el);
      const cv = el.querySelector('.iv-cv');
      const draw = () => Interview.scene(cv, club || own, p);
      draw();
      const onR = () => draw();
      window.addEventListener('resize', onR);
      const tot = [0, 0, 0, 0, 0];
      let i = 0;
      const said = [];
      const end = () => {
        window.removeEventListener('resize', onR);
        el.classList.add('out');
        setTimeout(() => el.remove(), 220);
        if (said.length) {
          Player.addMorale(p, tot[0]); Player.addRel(p, 'fans', tot[1]); Player.addRel(p, 'coach', tot[2]); Player.addRel(p, 'team', tot[3]); Player.addFame(p, tot[4]);
          Game.news(`🎙️ Maç sonu: "${said[said.length - 1]}"`, 'me');
          Game.save();
        }
        resolve();
      };
      const ask = () => {
        if (i >= qs.length) return end();
        const q = qs[i], ans = q.a(c);
        el.querySelector('.iv-dots').innerHTML = qs.map((_, k) => `<i class="${k < i ? 'done' : k === i ? 'on' : ''}"></i>`).join('');
        el.querySelector('h3').textContent = q.q(c);
        el.querySelector('.iv-opts').innerHTML = ans.map((t, k) => `<button class="iv-a" data-k="${k}"><small>${['Mütevazı', 'Kendinden emin', 'İddialı'][k]}</small>${U.esc(t)}</button>`).join('');
        UI.strip && UI.strip(el);
        el.querySelector('.iv-q').classList.remove('in'); void el.offsetWidth; el.querySelector('.iv-q').classList.add('in');
        U.$$('.iv-a', el).forEach((b) => (b.onclick = () => {
          const k = +b.dataset.k;
          IV_FX[k].forEach((v, j) => (tot[j] += v * 0.6));
          said.push(ans[k]);
          if (typeof Sfx !== 'undefined') Sfx.play('shutter');
          i++;
          setTimeout(ask, 160);
        }));
      };
      el.querySelector('.iv-skip').onclick = end;
      ask();
    });
  },
  // TV görüntüsü: sponsor panosu, forma ile oyuncu, öne uzanan mikrofon ve kanal küpü
  scene(cv, club, p) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(200, cv.clientWidth), h = Math.max(160, cv.clientHeight);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    const c = cv.getContext('2d');
    if (!c) return;
    const W = cv.width, H = cv.height;
    const c1 = club.c1 || '#c8102e', c2 = club.c2 || '#ffffff';
    // sponsor panosu (arka planda hafif bulanık)
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#f2f4f8'); g.addColorStop(1, '#d6dbe6');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    const tw = W / 3.2, th = H / 4.2;
    const short = (club.short || 'SF').toLocaleUpperCase('tr');
    for (let r = -1; r < 6; r++) {
      for (let k = -1; k < 5; k++) {
        const x = k * tw + (r % 2 ? tw / 2 : 0), y = r * th;
        const kind = (r + k + 20) % 3;
        c.save(); c.translate(x + tw / 2, y + th / 2); c.globalAlpha = 0.85;
        if (kind === 0) { c.fillStyle = '#0d1f4f'; c.font = `italic 900 ${Math.round(th * 0.32)}px "Saira Condensed", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('STARFOOT', 0, 0); }
        else if (kind === 1) { c.fillStyle = c1; c.beginPath(); c.arc(0, 0, th * 0.26, 0, Math.PI * 2); c.fill(); c.fillStyle = c2; c.font = `900 ${Math.round(th * 0.2)}px "Saira Condensed", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(short, 0, 1); }
        else { c.fillStyle = '#e39a12'; Sprites.star(c, -th * 0.42, 0, th * 0.14, -Math.PI / 2); c.fillStyle = '#1b2333'; c.font = `800 ${Math.round(th * 0.22)}px "Barlow Semi Condensed", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('SF SPORT', th * 0.12, 0); }
        c.restore();
      }
    }
    c.globalAlpha = 1;
    // derinlik: arka plan hafif soluk, oyuncuya ışık
    c.fillStyle = 'rgba(230,236,248,0.35)'; c.fillRect(0, 0, W, H);
    const L = c.createRadialGradient(W * 0.5, H * 0.35, 0, W * 0.5, H * 0.45, W * 0.7);
    L.addColorStop(0, 'rgba(255,255,255,0.25)'); L.addColorStop(1, 'rgba(0,0,0,0.18)');
    c.fillStyle = L; c.fillRect(0, 0, W, H);
    // oyuncu: belden yukarısı kadrajda
    const fh = H * 1.3;
    const kit = Sprites.kit(club, false);
    c.save(); c.shadowColor = 'rgba(0,0,0,0.35)'; c.shadowBlur = 18 * dpr;
    Sprites.figure(c, W * 0.52, H + fh * 0.36, fh, { kit, look: Sprites.me(p), facing: 'down', number: p.shirt, noShadow: true, t: 0 });
    c.restore();
    // ter parlaması
    // mikrofon: alttan öne uzanan el ve kanal küpü
    const mx = W * 0.4, my = H * 0.5, mr = Math.min(W, H) * 0.06;
    c.save();
    c.fillStyle = '#e0ac69'; c.beginPath(); c.ellipse(W * 0.12, H * 1.02, W * 0.13, H * 0.12, -0.5, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#141519'; c.lineWidth = mr * 0.55; c.lineCap = 'round';
    c.beginPath(); c.moveTo(W * 0.14, H * 0.98); c.lineTo(mx, my + mr * 1.6); c.stroke();
    // küp
    const cs = mr * 1.9;
    c.translate(mx, my + mr * 0.9); c.rotate(-0.35);
    c.fillStyle = '#0d1f4f'; c.fillRect(-cs / 2, -cs / 2, cs, cs * 0.9);
    c.fillStyle = '#ffcf3f'; c.fillRect(-cs / 2, -cs / 2, cs, cs * 0.16);
    c.fillStyle = '#ffffff'; c.font = `italic 900 ${Math.round(cs * 0.3)}px "Saira Condensed", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('SF', 0, cs * 0.12);
    c.rotate(0.35);
    // mikrofon başlığı
    c.fillStyle = '#2b2d33'; c.beginPath(); c.arc(cs * 0.1, -cs * 0.95, mr, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = 1;
    for (let k = -3; k <= 3; k++) { c.beginPath(); c.moveTo(cs * 0.1 + k * mr * 0.28, -cs * 0.95 - mr * 0.9); c.lineTo(cs * 0.1 + k * mr * 0.28, -cs * 0.95 + mr * 0.9); c.stroke(); }
    c.restore();
    // kamera vinyeti
    const v = c.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.8);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.35)');
    c.fillStyle = v; c.fillRect(0, 0, W, H);
  },
};
