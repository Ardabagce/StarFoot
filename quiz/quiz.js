// "Hangi mevkiye uygunsun?" testi. Sayfa dili <html lang> ile seçilir (tr / en / de).
// Her cevap mevkilere puan verir; en yüksek puanlı mevki sonuçtur. Sonuç paylaşılabilir (?r=ST).
(function () {
  const APP = 'https://apps.apple.com/app/id6819292902';
  const PLAY = 'https://play.google.com/store/apps/details?id=app.vercel.starfoot.twa';
  const L = (document.documentElement.lang || 'tr').slice(0, 2);
  // [cevap metinleri tr/en/de, puanlar]
  const Q = [
    { q: ['Maçta en çok neyi seversin?', 'What do you love most in a match?', 'Was liebst du im Spiel am meisten?'], a: [
      [['Gol atmayı', 'Scoring goals', 'Tore schießen'], { ST: 3, W: 1 }],
      [['Gol pası vermeyi', 'Making the assist', 'Die Torvorlage geben'], { AM: 3, CM: 1 }],
      [['Rakipten topu kapmayı', 'Winning the ball back', 'Den Ball erobern'], { CB: 2, DM: 2 }],
      [['Golü kurtarmayı', 'Making a save', 'Einen Ball halten'], { GK: 4 }]] },
    { q: ['Takım arkadaşların seni nasıl anlatır?', 'How would your teammates describe you?', 'Wie beschreiben dich deine Mitspieler?'], a: [
      [['Çok hızlı', 'Very fast', 'Sehr schnell'], { W: 3, FB: 2 }],
      [['Sahada sesi en çok çıkan, lider', 'The loud leader on the pitch', 'Der laute Anführer auf dem Platz'], { CB: 2, GK: 1, DM: 1 }],
      [['Oyunu okuyan, akıllı', 'Smart, reads the game', 'Klug, liest das Spiel'], { CM: 2, AM: 2 }],
      [['Soğukkanlı bitirici', 'A cool finisher', 'Eiskalter Vollstrecker'], { ST: 3 }]] },
    { q: ['Top sana geldi, rakip üstüne geliyor. Ne yaparsın?', 'The ball comes to you under pressure. What do you do?', 'Der Ball kommt zu dir, der Gegner presst. Was tust du?'], a: [
      [['Çalımla geçerim', 'Dribble past him', 'Ich dribble vorbei'], { W: 2, AM: 2 }],
      [['Tek dokunuşla boştaki arkadaşa veririm', 'One-touch pass to a free teammate', 'Direktpass zum freien Mitspieler'], { CM: 2, DM: 2 }],
      [['Riske girmem, uzaklaştırırım', 'No risk, I clear it', 'Kein Risiko, ich kläre'], { CB: 2, GK: 1 }],
      [['Kaleye döner, şut çekerim', 'Turn and shoot', 'Aufdrehen und schießen'], { ST: 3 }]] },
    { q: ['En sevdiğin antrenman hangisi?', 'Your favourite training drill?', 'Deine Lieblingsübung im Training?'], a: [
      [['Şut çalışması', 'Shooting practice', 'Torschusstraining'], { ST: 2, AM: 1 }],
      [['Uzun koşular', 'Long runs', 'Lange Läufe'], { FB: 3, CM: 1 }],
      [['Pas oyunları', 'Passing games', 'Passspiele'], { CM: 3, DM: 1 }],
      [['Refleks ve sıçrama', 'Reflexes and jumping', 'Reflexe und Sprungkraft'], { GK: 3, CB: 1 }]] },
    { q: ['Seni en çok hangi an heyecanlandırır?', 'Which moment thrills you most?', 'Welcher Moment begeistert dich am meisten?'], a: [
      [['Son dakika golü', 'A last-minute winner', 'Ein Siegtor in letzter Minute'], { ST: 2, W: 1 }],
      [['Çizgiden top çıkarmak', 'A goal-line clearance', 'Ein Ball von der Linie geholt'], { CB: 2, GK: 2 }],
      [['Rakibi ters köşeye yatırmak', 'Sending a defender the wrong way', 'Einen Verteidiger ins Leere laufen lassen'], { W: 2, AM: 1 }],
      [['Maçın temposunu yönetmek', 'Controlling the tempo', 'Das Tempo bestimmen'], { DM: 2, CM: 2 }]] },
    { q: ['Fiziksel olarak hangisi sana daha uygun?', 'Physically, which fits you best?', 'Körperlich passt was am besten zu dir?'], a: [
      [['Uzun boylu ve güçlü', 'Tall and strong', 'Groß und kräftig'], { CB: 2, GK: 2, ST: 1 }],
      [['Çevik ve hızlı', 'Agile and quick', 'Wendig und schnell'], { W: 2, FB: 2 }],
      [['Dayanıklı, hiç yorulmayan', 'Tireless, never stops', 'Ausdauernd, nie müde'], { CM: 2, DM: 2, FB: 1 }],
      [['Dengeli ve teknik', 'Balanced and technical', 'Ballsicher und technisch'], { AM: 3 }]] },
    { q: ['Hata yaptığında ne yaparsın?', 'When you make a mistake, you...', 'Wenn du einen Fehler machst, ...'], a: [
      [['Hemen geri koşup telafi ederim', 'Sprint back to fix it', 'sprinte ich sofort zurück'], { FB: 2, DM: 2 }],
      [['Sakin kalırım, takımı da sakinleştiririm', 'Stay calm and calm the team', 'bleibe ich ruhig und beruhige das Team'], { GK: 2, CB: 1, CM: 1 }],
      [['Bir sonraki pozisyonda daha cesur olurum', 'Get even braver next time', 'werde ich beim nächsten Mal noch mutiger'], { W: 2, AM: 2 }],
      [['Golle cevap veririm', 'Answer with a goal', 'antworte ich mit einem Tor'], { ST: 3 }]] },
    { q: ['Takımda hangi rol senin?', 'Which role is yours in the team?', 'Welche Rolle hast du im Team?'], a: [
      [['Kaptan', 'Captain', 'Kapitän'], { CB: 2, DM: 1, GK: 1 }],
      [['Yıldız', 'Star', 'Star'], { ST: 2, AM: 2 }],
      [['Motor', 'Engine', 'Motor'], { CM: 2, FB: 2 }],
      [['Sürpriz silah', 'Secret weapon', 'Geheimwaffe'], { W: 3 }]] },
  ];
  const I = { tr: 0, en: 1, de: 2 }[L] || 0;
  // mevki sonuçları: ad, açıklama, oyunda hangi mevkide başlanır
  const R = {
    GK: [['Kaleci', 'Goalkeeper', 'Torwart'], ['Takımın son kalesi sensin. Refleksin, cesaretin ve soğukkanlılığın maçın kaderini değiştirir. Bir kurtarış, bir gol kadar değerli.', 'You are the last line. Reflexes, courage and calm decide matches. One save is worth as much as a goal.', 'Du bist die letzte Instanz. Reflexe, Mut und Ruhe entscheiden Spiele. Eine Parade ist so viel wert wie ein Tor.'], 'GK'],
    CB: [['Stoper', 'Centre-back', 'Innenverteidiger'], ['Hava toplarında güçlü, savunmanın lideri. Rakip forvetler maç boyunca seninle uğraşmak zorunda.', 'Strong in the air and the leader of the defence. Strikers have to deal with you all match.', 'Kopfballstark und Chef der Abwehr. Gegnerische Stürmer müssen sich das ganze Spiel mit dir herumschlagen.'], 'DF'],
    FB: [['Bek', 'Full-back', 'Außenverteidiger'], ['Hem savunur hem hücuma çıkarsın. Kanatta bitmeyen koşuların ve ortaların takıma nefes aldırır.', 'You defend and attack. Your endless runs and crosses down the flank keep the team alive.', 'Du verteidigst und greifst an. Deine Läufe und Flanken auf der Außenbahn tragen das Team.'], 'DF'],
    DM: [['Ön libero', 'Defensive midfielder', 'Defensiver Mittelfeldspieler'], ['Savunmanın önündeki kalkan. Top kapar, oyunu sakinleştirir, ilk pası doğru verirsin.', 'The shield in front of the defence. You win the ball, calm the game and play the first pass right.', 'Das Schutzschild vor der Abwehr. Du eroberst Bälle, beruhigst das Spiel und spielst den ersten Pass sauber.'], 'MF'],
    CM: [['Merkez orta saha', 'Central midfielder', 'Zentraler Mittelfeldspieler'], ['Takımın motoru. Her yerdesin: savunmaya yardım eder, hücumu başlatır, temposu sen belirlersin.', 'The engine of the team. You are everywhere: helping defend, starting attacks, setting the tempo.', 'Der Motor des Teams. Du bist überall: hilfst hinten, leitest Angriffe ein, bestimmst das Tempo.'], 'MF'],
    AM: [['On numara', 'Number 10', 'Zehner'], ['Yaratıcı oyun kurucu. Kimsenin görmediği pası görür, son pası ya da golü sen yaparsın.', 'The creative playmaker. You see the pass nobody else sees and make the final ball or the goal.', 'Der kreative Spielmacher. Du siehst den Pass, den sonst keiner sieht, und spielst den letzten Ball oder triffst selbst.'], 'MF'],
    W: [['Kanat', 'Winger', 'Flügelspieler'], ['Hızın ve çalımınla savunmaları dağıtırsın. Bire birde rakibi geçmek senin işin.', 'Your pace and dribbling tear defences apart. Beating your man one-on-one is your job.', 'Mit Tempo und Dribblings reißt du Abwehrreihen auf. Eins gegen eins ist dein Ding.'], 'FW'],
    ST: [['Santrfor', 'Striker', 'Mittelstürmer'], ['Golcü içgüdüsü sende. Ceza sahasında doğru yerde durur, tek dokunuşla bitirirsin.', 'You have a goalscorer’s instinct. Always in the right place in the box, finishing with one touch.', 'Du hast den Torriecher. Im Strafraum immer richtig stehen und mit einem Kontakt vollenden.'], 'FW'],
  };
  const T = {
    start: ['Teste başla', 'Start the quiz', 'Test starten'],
    of: ['Soru {a} / {b}', 'Question {a} of {b}', 'Frage {a} von {b}'],
    res: ['Senin mevkin', 'Your position', 'Deine Position'],
    pos2: ['İkinci uygun mevki: ', 'Second best: ', 'Zweitbeste Position: '],
    play: ['Bu kariyeri oyunda yaşa: StarFoot\'ta {p} olarak 8 yaşında başla, dünya yıldızı ol.', 'Live this career in the game: start as a {p} aged 8 in StarFoot and become a world star.', 'Erlebe diese Karriere im Spiel: Starte in StarFoot mit 8 Jahren als {p} und werde Weltstar.'],
    gp: { GK: ['kaleci', 'goalkeeper', 'Torwart'], DF: ['defans oyuncusu', 'defender', 'Verteidiger'], MF: ['orta saha', 'midfielder', 'Mittelfeldspieler'], FW: ['forvet', 'forward', 'Stürmer'] },
    share: ['Sonucu paylaş', 'Share result', 'Ergebnis teilen'],
    again: ['Tekrar çöz', 'Try again', 'Nochmal'],
    shareTxt: ['Mevki testinde sonucum: {p}! Sen hangi mevkiye uygunsun?', 'My football position quiz result: {p}! Which position suits you?', 'Mein Ergebnis im Fußball-Positionstest: {p}! Welche Position passt zu dir?'],
    copied: ['Bağlantı kopyalandı', 'Link copied', 'Link kopiert'],
    dl1: ["App Store'dan", 'Download on the', 'Laden im'], dl2: ['İndir', 'App Store', 'App Store'],
    gp1: ["Google Play'den", 'Get it on', 'Jetzt bei'], gp2: ['İndir', 'Google Play', 'Google Play'],
    shared: ['Arkadaşının sonucu: ', 'Your friend got: ', 'Ergebnis deines Freundes: '],
  };
  const tr = (k) => T[k][I];
  const root = document.getElementById('quiz');
  if (!root) return;
  const isAndroid = /android/i.test(navigator.userAgent);
  const btns = () => {
    const a = `<a class="qbtn" href="${APP}" rel="noopener"><svg viewBox="0 0 384 512" aria-hidden="true"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg><span><small>${tr('dl1')}</small><b>${tr('dl2')}</b></span></a>`;
    const g = `<a class="qbtn" href="${PLAY}" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.6 2.3 13.4 12l-9.8 9.7c-.4-.2-.6-.7-.6-1.2V3.5c0-.5.2-1 .6-1.2zm11 10.9 2.6 2.6-11 6.3 8.4-8.9zm3.8-3.8 2.5 1.4c.7.4.7 1.4 0 1.8l-2.5 1.4-2.8-2.3 2.8-2.3zM6.2 1.9l11 6.3-2.6 2.6-8.4-8.9z"/></svg><span><small>${tr('gp1')}</small><b>${tr('gp2')}</b></span></a>`;
    return `<div class="qbtns">${isAndroid ? g + a : a + g}</div>`;
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  let step = -1, score = {};
  function render() {
    if (step < 0) {
      const sh = new URLSearchParams(location.search).get('r');
      const pre = sh && R[sh] ? `<p class="qshared">${tr('shared')}<b>${esc(R[sh][0][I])}</b></p>` : '';
      root.innerHTML = `${pre}<button class="qstart">${tr('start')}</button>`;
      root.querySelector('.qstart').onclick = () => { step = 0; score = {}; render(); };
      return;
    }
    if (step < Q.length) {
      const q = Q[step];
      root.innerHTML = `<div class="qbar"><i style="width:${(step / Q.length) * 100}%"></i></div>
        <p class="qof">${tr('of').replace('{a}', step + 1).replace('{b}', Q.length)}</p>
        <h3 class="qq">${esc(q.q[I])}</h3>
        <div class="qa">${q.a.map((a, i) => `<button data-i="${i}">${esc(a[0][I])}</button>`).join('')}</div>`;
      root.querySelectorAll('.qa button').forEach((b) => (b.onclick = () => {
        const pts = q.a[+b.dataset.i][1];
        Object.keys(pts).forEach((k) => (score[k] = (score[k] || 0) + pts[k]));
        step++; render();
        root.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }));
      return;
    }
    const order = Object.keys(R).sort((a, b) => (score[b] || 0) - (score[a] || 0));
    const top = order[0], r = R[top], second = R[order[1]];
    const url = location.origin + location.pathname + '?r=' + top;
    root.innerHTML = `<div class="qres"><p class="qof">${tr('res')}</p><h3>${esc(r[0][I])}</h3><p>${esc(r[1][I])}</p>
      <p class="qsec">${tr('pos2')}<b>${esc(second[0][I])}</b></p></div>
      <div class="qrow"><button class="qshare">${tr('share')}</button><button class="qagain">${tr('again')}</button></div>
      <div class="qcta"><p>${esc(tr('play').replace('{p}', T.gp[r[2]][I]))}</p>${btns()}</div>`;
    root.querySelector('.qagain').onclick = () => { step = 0; score = {}; render(); };
    root.querySelector('.qshare').onclick = async () => {
      const text = tr('shareTxt').replace('{p}', r[0][I]);
      try { if (navigator.share) { await navigator.share({ title: 'StarFoot', text, url }); return; } } catch (e) { return; }
      try { await navigator.clipboard.writeText(text + ' ' + url); root.querySelector('.qshare').textContent = tr('copied'); } catch (e) { /* yok */ }
    };
    try { if (window.gtag) window.gtag('event', 'quiz_result', { position: top }); } catch (e) { /* yok */ }
  }
  render();
})();
