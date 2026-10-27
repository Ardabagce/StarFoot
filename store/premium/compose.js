// Play Store tanıtım görselleri (1080x1920): node store/premium/compose.js
// Önce node store/premium/capture.js ile ham ekranlar alınır.
const { chromium } = require('playwright');
const path = require('path');
const D = __dirname;
const F = 'file://' + path.join(D, 'fonts');

const POSTERS = [
  {
    id: 'moment', accent: '#ffcf3f', glow: 'rgba(255,207,63,.45)', tilt: -3,
    tr: { tag: 'CANLI MAÇ MOTORU', h1: 'KRİTİK ANLARI', h2: 'SEN OYNA', sub: 'Şut, pas, çalım, frikik, penaltı: maçın kaderi senin elinde.', chips: [['Kaydır & vur', 'left', 1040], ['Gerçek zamanlı maç', 'right', 1500]] },
    en: { tag: 'LIVE MATCH ENGINE', h1: 'PLAY THE', h2: 'BIG MOMENTS', sub: 'Shots, passes, dribbles, free kicks, penalties: the match is in your hands.', chips: [['Swipe & shoot', 'left', 1040], ['Real-time matches', 'right', 1500]] },
    es: { tag: "MOTOR DE PARTIDO EN VIVO", h1: "JUEGA LOS", h2: "MOMENTOS CLAVE", sub: "Disparos, pases, regates, tiros libres, penaltis: el partido está en tus manos.", chips: [["Desliza y dispara", 'left', 1040], ["Partidos en tiempo real", 'right', 1500]] },
    pt: { tag: "MOTOR DE JOGO AO VIVO", h1: "JOGUE OS", h2: "LANCES DECISIVOS", sub: "Chutes, passes, dribles, faltas, pênaltis: a partida está nas suas mãos.", chips: [["Deslize e chute", 'left', 1040], ["Partidas em tempo real", 'right', 1500]] },
    de: { tag: "LIVE-SPIELMODUS", h1: "SPIEL DIE", h2: "GROSSEN MOMENTE", sub: "Schüsse, Pässe, Dribblings, Freistöße, Elfmeter: Das Spiel liegt in deiner Hand.", chips: [["Wischen & schießen", 'left', 1040], ["Spiele in Echtzeit", 'right', 1500]] },
    fr: { tag: "MATCH EN DIRECT", h1: "JOUE LES", h2: "MOMENTS CLÉS", sub: "Frappes, passes, dribbles, coups francs, penalties : le match est entre tes mains.", chips: [["Glisse et frappe", 'left', 1040], ["Matchs en temps réel", 'right', 1500]] },
    it: { tag: "PARTITA LIVE", h1: "GIOCA I", h2: "MOMENTI DECISIVI", sub: "Tiri, passaggi, dribbling, punizioni, rigori: la partita è nelle tue mani.", chips: [["Scorri e tira", 'left', 1040], ["Partite in tempo reale", 'right', 1500]] },
    ind: { tag: "LAGA LANGSUNG", h1: "MAINKAN", h2: "MOMEN PENTING", sub: "Tembakan, umpan, dribel, tendangan bebas, penalti: laga ada di tanganmu.", chips: [["Geser & tembak", 'left', 1040], ["Laga real-time", 'right', 1500]] },
    ar: { tag: "محرك مباريات مباشر", h1: "العب", h2: "اللحظات الحاسمة", sub: "التسديد والتمرير والمراوغة والركلات الحرة وركلات الجزاء: المباراة بين يديك.", chips: [["اسحب وسدد", 'left', 1040], ["مباريات مباشرة", 'right', 1500]] },
    ja: { tag: "リアルタイム試合エンジン", h1: "決定的な", h2: "瞬間を操れ", sub: "シュート、パス、ドリブル、FK、PK：試合の行方はあなた次第。", chips: [["引いてシュート", 'left', 1040], ["リアルタイムの試合", 'right', 1500]] },
  },
  {
    id: 'matchday', accent: '#8fb8ff', glow: 'rgba(120,170,255,.5)', tilt: 3, stars: true,
    tr: { tag: 'LİGLER VE KUPALAR', h1: 'DEVLERİN', h2: 'SAHNESİNE ÇIK', sub: 'Şampiyonlar Kupası, Dünya Şampiyonası ve 16 ülkenin ligleri.', chips: [['400+ kulüp', 'right', 1180], ['16 ülke ligi', 'left', 1500]] },
    en: { tag: 'LEAGUES & CUPS', h1: 'STEP ONTO', h2: 'THE BIG STAGE', sub: 'Champions Cup, World Championship and leagues from 16 countries.', chips: [['400+ clubs', 'right', 1180], ['16 national leagues', 'left', 1500]] },
    es: { tag: "LIGAS Y COPAS", h1: "SALTA AL", h2: "GRAN ESCENARIO", sub: "Copa de Campeones, Campeonato Mundial y 30 ligas de todo el mundo.", chips: [["400+ clubes", 'right', 1180], ["30 ligas", 'left', 1500]] },
    pt: { tag: "LIGAS E COPAS", h1: "SUBA AO", h2: "GRANDE PALCO", sub: "Copa dos Campeões, Campeonato Mundial e 30 ligas pelo mundo.", chips: [["400+ clubes", 'right', 1180], ["30 ligas", 'left', 1500]] },
    de: { tag: "LIGEN & POKALE", h1: "BETRITT DIE", h2: "GROSSE BÜHNE", sub: "Meisterpokal, Weltmeisterschaft und 30 Ligen weltweit.", chips: [["400+ Vereine", 'right', 1180], ["30 Ligen", 'left', 1500]] },
    fr: { tag: "CHAMPIONNATS & COUPES", h1: "MONTE SUR", h2: "LA GRANDE SCÈNE", sub: "Coupe des Champions, Championnat du monde et 30 championnats.", chips: [["400+ clubs", 'right', 1180], ["30 championnats", 'left', 1500]] },
    it: { tag: "CAMPIONATI E COPPE", h1: "SALI SUL", h2: "GRANDE PALCO", sub: "Coppa dei Campioni, Campionato Mondiale e 30 campionati.", chips: [["400+ club", 'right', 1180], ["30 campionati", 'left', 1500]] },
    ind: { tag: "LIGA & PIALA", h1: "NAIK KE", h2: "PANGGUNG BESAR", sub: "Piala Champions, Kejuaraan Dunia, dan 30 liga dunia.", chips: [["400+ klub", 'right', 1180], ["30 liga", 'left', 1500]] },
    ar: { tag: "الدوريات والكؤوس", h1: "اصعد إلى", h2: "المسرح الكبير", sub: "كأس الأبطال وبطولة العالم و30 دوريًا حول العالم.", chips: [["أكثر من 400 نادٍ", 'right', 1180], ["30 دوريًا", 'left', 1500]] },
    ja: { tag: "リーグ＆カップ", h1: "大舞台へ", h2: "駆け上がれ", sub: "チャンピオンズカップ、世界選手権、世界30リーグ。", chips: [["400以上のクラブ", 'right', 1180], ["30リーグ", 'left', 1500]] },
  },
  {
    id: 'summary', accent: '#ffd36b', glow: 'rgba(255,190,60,.5)', tilt: -3,
    tr: { tag: 'KARİYER', h1: 'MAÇIN', h2: 'YILDIZI OL', sub: 'Reytingini yükselt, ödülleri topla, efsaneler arasına adını yazdır.', chips: [['Maçın oyuncusu ödülü', 'left', 1080], ['~100 başarım', 'right', 1520]] },
    en: { tag: 'CAREER', h1: 'BE THE', h2: 'MAN OF THE MATCH', sub: 'Raise your rating, collect awards and write your name among the legends.', chips: [['Man of the Match awards', 'left', 1080], ['~100 achievements', 'right', 1520]] },
    es: { tag: "CARRERA", h1: "SÉ EL", h2: "JUGADOR DEL PARTIDO", sub: "Sube tu valoración, colecciona premios y escribe tu nombre entre las leyendas.", chips: [["Premios al mejor jugador", 'left', 1080], ["~100 logros", 'right', 1520]] },
    pt: { tag: "CARREIRA", h1: "SEJA O", h2: "CRAQUE DO JOGO", sub: "Suba sua nota, colecione prêmios e escreva seu nome entre as lendas.", chips: [["Prêmios de craque do jogo", 'left', 1080], ["~100 conquistas", 'right', 1520]] },
    de: { tag: "KARRIERE", h1: "WERDE", h2: "SPIELER DES SPIELS", sub: "Steigere deine Note, sammle Preise und schreib deinen Namen unter die Legenden.", chips: [["Spieler-des-Spiels-Preise", 'left', 1080], ["~100 Erfolge", 'right', 1520]] },
    fr: { tag: "CARRIÈRE", h1: "DEVIENS", h2: "L'HOMME DU MATCH", sub: "Monte ta note, collectionne les récompenses et inscris ton nom parmi les légendes.", chips: [["Trophées d'homme du match", 'left', 1080], ["~100 succès", 'right', 1520]] },
    it: { tag: "CARRIERA", h1: "DIVENTA IL", h2: "MIGLIORE IN CAMPO", sub: "Alza il tuo voto, colleziona premi e scrivi il tuo nome tra le leggende.", chips: [["Premi migliore in campo", 'left', 1080], ["~100 traguardi", 'right', 1520]] },
    ind: { tag: "KARIER", h1: "JADILAH", h2: "PEMAIN TERBAIK", sub: "Naikkan nilaimu, kumpulkan penghargaan, dan tulis namamu di antara legenda.", chips: [["Penghargaan pemain terbaik", 'left', 1080], ["~100 pencapaian", 'right', 1520]] },
    ar: { tag: "المسيرة", h1: "كن", h2: "رجل المباراة", sub: "ارفع تقييمك واجمع الجوائز واكتب اسمك بين الأساطير.", chips: [["جوائز رجل المباراة", 'left', 1080], ["قرابة 100 إنجاز", 'right', 1520]] },
    ja: { tag: "キャリア", h1: "目指せ", h2: "試合の主役", sub: "評価を上げ、賞を集め、伝説の仲間入りを果たそう。", chips: [["マン・オブ・ザ・マッチ賞", 'left', 1080], ["約100の実績", 'right', 1520]] },
  },
  {
    id: 'trophy', accent: '#ffcf3f', glow: 'rgba(255,200,60,.55)', tilt: 3, confetti: true,
    tr: { tag: 'ŞAMPİYONLUK', h1: 'KUPAYI', h2: 'HAVAYA KALDIR', sub: 'Ligler, kupalar ve şampiyonluk törenleri seni bekliyor.', chips: [['Kupa töreni', 'right', 1060], ['Gol sevinçleri', 'left', 1500]] },
    en: { tag: 'GLORY', h1: 'LIFT THE', h2: 'TROPHY', sub: 'Leagues, cups and title celebrations are waiting for you.', chips: [['Trophy ceremonies', 'right', 1060], ['Goal celebrations', 'left', 1500]] },
    es: { tag: "GLORIA", h1: "LEVANTA EL", h2: "TROFEO", sub: "Ligas, copas y celebraciones de títulos te esperan.", chips: [["Ceremonias de trofeos", 'right', 1060], ["Celebraciones de gol", 'left', 1500]] },
    pt: { tag: "GLÓRIA", h1: "LEVANTE A", h2: "TAÇA", sub: "Ligas, copas e festas de título esperam por você.", chips: [["Cerimônias de taça", 'right', 1060], ["Comemorações de gol", 'left', 1500]] },
    de: { tag: "RUHM", h1: "STEMM DEN", h2: "POKAL", sub: "Ligen, Pokale und Meisterfeiern warten auf dich.", chips: [["Pokalzeremonien", 'right', 1060], ["Torjubel", 'left', 1500]] },
    fr: { tag: "GLOIRE", h1: "SOULÈVE LE", h2: "TROPHÉE", sub: "Championnats, coupes et célébrations de titres t'attendent.", chips: [["Cérémonies de trophées", 'right', 1060], ["Célébrations de but", 'left', 1500]] },
    it: { tag: "GLORIA", h1: "ALZA IL", h2: "TROFEO", sub: "Campionati, coppe e feste per il titolo ti aspettano.", chips: [["Cerimonie del trofeo", 'right', 1060], ["Esultanze", 'left', 1500]] },
    ind: { tag: "KEJAYAAN", h1: "ANGKAT", h2: "TROFINYA", sub: "Liga, piala, dan perayaan gelar menantimu.", chips: [["Upacara trofi", 'right', 1060], ["Selebrasi gol", 'left', 1500]] },
    ar: { tag: "المجد", h1: "ارفع", h2: "الكأس", sub: "الدوريات والكؤوس واحتفالات الألقاب بانتظارك.", chips: [["حفلات التتويج", 'right', 1060], ["احتفالات الأهداف", 'left', 1500]] },
    ja: { tag: "栄光", h1: "トロフィーを", h2: "掲げろ", sub: "リーグ、カップ、優勝セレモニーが待っている。", chips: [["優勝セレモニー", 'right', 1060], ["ゴールセレブレーション", 'left', 1500]] },
  },
  {
    id: 'social', accent: '#ff6fb5', glow: 'rgba(214,80,220,.5)', tilt: -3, ig: true,
    tr: { tag: 'SAHA DIŞI HAYAT', h1: 'SAHA DIŞINDA', h2: 'DA YILDIZ OL', sub: 'Takipçi topla, sponsorluk imzala, transfer tekliflerini değerlendir.', chips: [['Milyonlarca takipçi', 'right', 1040], ['Sponsorluk & menajer', 'left', 1500]] },
    en: { tag: 'LIFE OFF THE PITCH', h1: 'A STAR', h2: 'OFF THE PITCH', sub: 'Grow your followers, sign sponsorships and weigh transfer offers.', chips: [['Millions of followers', 'right', 1040], ['Sponsors & agent', 'left', 1500]] },
    es: { tag: "VIDA FUERA DEL CAMPO", h1: "UNA ESTRELLA", h2: "FUERA DEL CAMPO", sub: "Gana seguidores, firma patrocinios y valora ofertas de fichaje.", chips: [["Millones de seguidores", 'right', 1040], ["Patrocinios y agente", 'left', 1500]] },
    pt: { tag: "VIDA FORA DE CAMPO", h1: "UMA ESTRELA", h2: "FORA DE CAMPO", sub: "Ganhe seguidores, feche patrocínios e avalie propostas.", chips: [["Milhões de seguidores", 'right', 1040], ["Patrocínios e empresário", 'left', 1500]] },
    de: { tag: "LEBEN NEBEN DEM PLATZ", h1: "EIN STAR", h2: "AUCH ABSEITS", sub: "Gewinne Follower, unterschreib Sponsorings und prüfe Transferangebote.", chips: [["Millionen Follower", 'right', 1040], ["Sponsoren & Berater", 'left', 1500]] },
    fr: { tag: "VIE HORS DU TERRAIN", h1: "UNE STAR", h2: "HORS DU TERRAIN", sub: "Gagne des abonnés, signe des sponsors et étudie les offres de transfert.", chips: [["Des millions d'abonnés", 'right', 1040], ["Sponsors & agent", 'left', 1500]] },
    it: { tag: "VITA FUORI DAL CAMPO", h1: "UNA STELLA", h2: "FUORI DAL CAMPO", sub: "Conquista follower, firma sponsorizzazioni e valuta le offerte.", chips: [["Milioni di follower", 'right', 1040], ["Sponsor e agente", 'left', 1500]] },
    ind: { tag: "HIDUP DI LUAR LAPANGAN", h1: "BINTANG", h2: "DI LUAR LAPANGAN", sub: "Kumpulkan pengikut, teken sponsor, dan timbang tawaran transfer.", chips: [["Jutaan pengikut", 'right', 1040], ["Sponsor & agen", 'left', 1500]] },
    ar: { tag: "الحياة خارج الملعب", h1: "نجم", h2: "خارج الملعب", sub: "اجمع المتابعين ووقّع عقود الرعاية وادرس عروض الانتقال.", chips: [["ملايين المتابعين", 'right', 1040], ["رعاة ووكيل", 'left', 1500]] },
    ja: { tag: "ピッチ外のライフ", h1: "ピッチの外でも", h2: "スターに", sub: "フォロワーを集め、スポンサー契約を結び、移籍オファーを検討しよう。", chips: [["数百万のフォロワー", 'right', 1040], ["スポンサーと代理人", 'left', 1500]] },
  },
];

const fontCss = [['Saira Condensed', 'saira-condensed', [800, 900]], ['Barlow Semi Condensed', 'barlow-semi-condensed', [500, 600, 700]]]
  .flatMap(([fam, f, ws]) => ws.flatMap((w) => ['latin', 'latin-ext'].map((s) => `@font-face{font-family:'${fam}';font-weight:${w};src:url('${F}/${f}-${s}-${w}-normal.woff2') format('woff2');}`))).join('\n');

const RTL = new Set(['ar']);
const AR_RANGE = 'U+0600-06FF, U+0750-077F, U+08A0-08FF, U+200C-200E, U+FB50-FDFF, U+FE70-FEFC';
const arCss = ['Saira Condensed', 'Barlow Semi Condensed'].flatMap((fam) => [500, 600, 700, 800, 900].map((w) => `@font-face{font-family:'${fam}';font-weight:${w};src:url('file://${path.join(D, '../../fonts')}/cairo-arabic-${w === 500 ? 600 : w === 800 ? 900 : w}-normal.woff2') format('woff2');unicode-range:${AR_RANGE}}`)).join('\n');
// Japonca: Noto Sans JP (SIL OFL). JA_CSS = Google Fonts CSS dosyası (font yolları dosyaya göre)
const jaCss = (() => { const f = process.env.JA_CSS; if (!f) return ''; const dir = path.dirname(f); return require('fs').readFileSync(f, 'utf8').replace(/url\((?!['"]?(?:https?|file):)['"]?([^)'"]+)['"]?\)/g, (m, u) => `url(file://${path.join(dir, u)})`) + "\nbody{font-family:'Barlow Semi Condensed','Noto Sans JP',sans-serif} h1,.logo{font-family:'Saira Condensed','Noto Sans JP',sans-serif}"; })();
const html = (p, l, img, F = { H: 1920, pw: 600, top: 640, shift: 0 }) => {
  const t = p[l === 'id' ? 'ind' : l];
  const conf = p.confetti ? Array.from({ length: 90 }, (_, i) => {
    const x = (i * 137) % 1080, y = (i * 263) % 1500, r = (i * 47) % 180, c = ['#ffcf3f', '#ffffff', '#ff5a5a', '#ffb02e'][i % 4];
    if (y < 640 && x > 120 && x < 960) return ''; // başlığın üstüne binmesin
    return `<i style="left:${x}px;top:${y}px;transform:rotate(${r}deg);background:${c};opacity:${0.35 + (i % 5) * 0.1}"></i>`;
  }).join('') : '';
  const stars = p.stars ? Array.from({ length: 60 }, (_, i) => `<b style="left:${(i * 173) % 1080}px;top:${(i * 311) % 1300}px;opacity:${0.3 + (i % 6) * 0.1};transform:scale(${0.5 + (i % 4) * 0.3})"></b>`).join('') : '';
  const chips = t.chips.map(([txt, side, y], i) => `<div class="chip ${side}" style="top:${Math.round(F.top + (y - 640) * (F.cs || 1) + F.shift)}px"><span class="dot"></span>${txt}</div>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${fontCss}
${arCss}
${l === 'ja' ? jaCss : ''}
${l === 'ja' ? '.tag{letter-spacing:.08em!important} h1{letter-spacing:0!important;line-height:1.05} .chip{font-size:34px}' : ''}
*{margin:0;padding:0;box-sizing:border-box}
${RTL.has(l) ? 'header,.chip{direction:rtl} .tag,h1,.logo{letter-spacing:0!important} h1 .a,h1 .b{line-height:1.15}' : ''}
body{width:1080px;height:${F.H}px;overflow:hidden;position:relative;font-family:'Barlow Semi Condensed',sans-serif;color:#fff;
  background:radial-gradient(120% 70% at 50% 8%, #1b3a8a 0%, #0d1f4f 38%, #070f2a 70%, #040817 100%)}
.beam{position:absolute;top:-200px;width:520px;height:1500px;background:linear-gradient(180deg,rgba(255,244,214,.20),rgba(255,244,214,0) 70%);filter:blur(18px);transform-origin:top center}
.beam.l{left:-120px;transform:rotate(-24deg)} .beam.r{right:-120px;transform:rotate(24deg)}
.pitch{position:absolute;left:-10%;right:-10%;bottom:-120px;height:760px;background:
  repeating-linear-gradient(90deg,rgba(60,170,90,.16) 0 90px,rgba(60,170,90,.08) 90px 180px);
  transform:perspective(900px) rotateX(58deg);transform-origin:bottom;border-top:4px solid rgba(255,255,255,.18);
  -webkit-mask:linear-gradient(0deg,#000 40%,transparent)}
.halo{position:absolute;left:50%;top:${F.top + 540}px;width:980px;height:980px;margin-left:-490px;margin-top:-490px;border-radius:50%;background:radial-gradient(circle,${p.glow} 0%,transparent 62%)}
.stars b{position:absolute;width:10px;height:10px;background:#fff;clip-path:polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)}
.conf i{position:absolute;width:14px;height:26px;border-radius:2px}
header{position:absolute;left:0;right:0;top:92px;text-align:center;padding:0 70px}
.logo{font-family:'Saira Condensed';font-weight:900;font-style:italic;font-size:46px;letter-spacing:.02em;transform:skewX(-8deg);display:inline-block}
.logo span{color:#ffcf3f}
.tag{display:inline-block;margin:26px auto 0;padding:10px 26px;border-radius:999px;font-weight:700;font-size:26px;letter-spacing:.22em;color:${p.accent};
  border:2px solid ${p.accent}55;background:${p.accent}14}
h1{font-family:'Saira Condensed';font-weight:900;font-style:italic;text-transform:uppercase;line-height:.92;margin-top:26px;letter-spacing:-.005em;transform:skewX(-6deg)}
h1 .a{display:block;font-size:${t.h1.length > 11 ? 112 : 126}px;color:#fff;text-shadow:0 6px 30px rgba(0,0,0,.45)}
h1 .b{display:block;font-size:${t.h2.length > 13 ? 104 : 126}px;background:linear-gradient(180deg,#fff3c2 0%,${p.accent} 55%,#e39a12 100%);-webkit-background-clip:text;color:transparent;filter:drop-shadow(0 8px 24px rgba(0,0,0,.45))}
.sub{margin:26px auto 0;max-width:${F.subW || 860}px;font-size:${F.subFs || 37}px;font-weight:500;line-height:1.3;color:#cdd7f4}
.phone{position:absolute;left:50%;top:${F.top}px;width:${F.pw}px;height:${Math.round(F.pw * 2400 / 1170)}px;margin-left:-${F.pw / 2}px;border-radius:72px;padding:16px;
  background:linear-gradient(145deg,#2a3555,#0b1020 40%,#1d2742);box-shadow:0 0 0 3px rgba(255,255,255,.08),0 50px 120px rgba(0,0,0,.65),0 0 140px ${p.glow};
  transform:rotate(${p.tilt}deg)}
.phone .scr{width:100%;height:100%;border-radius:58px;overflow:hidden;background:#000;position:relative}
.phone img{width:100%;height:100%;object-fit:cover;object-position:top;display:block}
.phone .notch{position:absolute;top:22px;left:50%;width:120px;height:34px;margin-left:-60px;border-radius:20px;background:#05070d}
.chip{position:absolute;z-index:5;display:flex;align-items:center;gap:16px;padding:22px 34px;border-radius:26px;font-weight:700;font-size:38px;white-space:nowrap;
  background:linear-gradient(135deg,rgba(255,255,255,.18),rgba(255,255,255,.06));border:2px solid rgba(255,255,255,.28);backdrop-filter:blur(14px);
  box-shadow:0 20px 50px rgba(0,0,0,.45)}
.chip.left{left:38px} .chip.right{right:38px}
.chip .dot{width:20px;height:20px;border-radius:50%;background:${p.accent};box-shadow:0 0 18px ${p.accent}}
${p.ig ? `.chip .dot{background:linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)}` : ''}
.foot{position:absolute;left:0;right:0;bottom:0;height:200px;background:linear-gradient(0deg,rgba(4,8,23,.85),transparent)}
</style></head><body>
<div class="beam l"></div><div class="beam r"></div><div class="pitch"></div><div class="halo"></div>
<div class="stars">${stars}</div><div class="conf">${conf}</div>
<header><div class="logo">STAR<span>FOOT</span></div><br><div class="tag">${t.tag}</div>
<h1><span class="a">${t.h1}</span><span class="b">${t.h2}</span></h1><p class="sub">${t.sub}</p></header>
<div class="phone"><div class="scr"><img src="${img}"></div></div>
${chips}
<div class="foot"></div>
</body></html>`;
};

(async () => {
  const b = await chromium.launch();
  const fs = require('fs');
  // Google Play: 1080x1920 · App Store (iPhone 6.7"/6.9"): 1290x2796
  const FORMATS = [
    { dir: '', W: 1080, H: 1920, F: { H: 1920, pw: 600, top: 640, shift: 0 } },
    { dir: 'ios', W: 1290, H: 2796, F: { H: 2341, pw: 720, top: 700, shift: 230 } },
    // iPhone Duo (katlanabilir): dış ekran 1398x2034, iç ekran 2007x2853
    { dir: 'duo-outer', W: 1398, H: 2034, F: { H: 1571, pw: 470, top: 590, shift: 0, cs: 0.78, subFs: 31, subW: 960 }, jpg: true },
    { dir: 'duo-inner', W: 2007, H: 2853, F: { H: 1535, pw: 455, top: 590, shift: 0, cs: 0.76, subFs: 31, subW: 960 }, jpg: true },
  ];
  if (process.argv[2] === 'duo') FORMATS.splice(0, 2);
  const LANGS = (process.env.LANGS || 'tr,en').split(',');
  if (process.env.LANGS) FORMATS.splice(2);
  for (const fm of FORMATS) {
    const pg = await b.newPage({ viewport: { width: 1080, height: fm.F.H }, deviceScaleFactor: fm.W / 1080 });
    const outDir = path.join(D, fm.dir);
    fs.mkdirSync(outDir, { recursive: true });
    for (const l of LANGS) {
      for (const [i, p] of POSTERS.entries()) {
        const tmp = path.join(D, '_tmp.html');
        fs.writeFileSync(tmp, html(p, l, 'raw/' + `${l}-${p.id}.png`, fm.F));
        await pg.goto('file://' + tmp, { waitUntil: 'load' });
        await pg.evaluate(() => document.fonts.ready);
        await pg.waitForTimeout(200);
        const out = path.join(outDir, `${l}-${i + 1}-${p.id}.png`);
        await pg.screenshot({ path: out, clip: { x: 0, y: 0, width: 1080, height: fm.H / (fm.W / 1080) } });
        // Tam ölçü ve şeffaflıksız (App Store bunu ister); ImageMagick varsa
        try { require('child_process').execSync(`convert "${out}" -resize ${fm.W}x${fm.H}! -background "#0a1530" -alpha remove -alpha off "${out}"`); } catch (e) { /* convert yok */ }
        if (fm.jpg) { try { require('child_process').execSync(`convert "${out}" -quality 92 "${out.replace(/\.png$/, '.jpg')}" && rm "${out}"`); } catch (e) { /* yok */ } }
      }
    }
    await pg.close();
  }
  if (!process.env.KEEP) fs.unlinkSync(path.join(D, '_tmp.html'));
  await b.close();
  console.log('ok');
})();
