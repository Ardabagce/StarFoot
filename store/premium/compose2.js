// 1.0.11 App Store görselleri (7 sahne, 10 dil): node store/premium/compose2.js [ipad]
// Önce: node store/premium/capture2.js (ham ekranlar raw2/, iPad için VIEW=ipad → raw2-ipad/)
const { chromium } = require('playwright');
const path = require('path');
const D = __dirname;
const F = 'file://' + path.join(D, 'fonts');
const P = (id, accent, glow, tilt, extra, T) => Object.assign({ id, accent, glow, tilt }, extra, T);
const POSTERS = [
  P('goal', '#ffcf3f', 'rgba(255,207,63,.45)', -3, {}, {
    tr: { tag: 'FUTBOL KARİYER OYUNU', h1: 'GOLÜ', h2: 'SEN AT', sub: 'Kritik anlarda top senin ayağında: geri çek, nişan al, vur!', chips: [['Gerçek stadyum sesi', 'left', 1060], ['Kaydır & vur', 'right', 1520]] },
    en: { tag: 'FOOTBALL CAREER GAME', h1: 'YOU TAKE', h2: 'THE SHOT', sub: 'In the big moments the ball is at your feet: pull back, aim, strike!', chips: [['Real stadium sound', 'left', 1060], ['Swipe & shoot', 'right', 1520]] },
    es: { tag: 'JUEGO DE CARRERA DE FÚTBOL', h1: 'TÚ METES', h2: 'EL GOL', sub: 'En los momentos clave el balón es tuyo: tira atrás, apunta y dispara.', chips: [['Sonido real de estadio', 'left', 1060], ['Desliza y dispara', 'right', 1520]] },
    pt: { tag: 'JOGO DE CARREIRA NO FUTEBOL', h1: 'VOCÊ FAZ', h2: 'O GOL', sub: 'Nos lances decisivos a bola é sua: puxe, mire e chute!', chips: [['Som real de estádio', 'left', 1060], ['Deslize e chute', 'right', 1520]] },
    de: { tag: 'FUSSBALL-KARRIERESPIEL', h1: 'DU SCHIESST', h2: 'DAS TOR', sub: 'In den großen Momenten liegt der Ball bei dir: zurückziehen, zielen, abziehen!', chips: [['Echter Stadionsound', 'left', 1060], ['Wischen & schießen', 'right', 1520]] },
    fr: { tag: 'JEU DE CARRIÈRE FOOT', h1: "C'EST TOI", h2: 'QUI MARQUES', sub: 'Dans les moments clés, le ballon est à toi : tire, vise, frappe !', chips: [['Vrai son de stade', 'left', 1060], ['Glisse et frappe', 'right', 1520]] },
    it: { tag: 'GIOCO DI CARRIERA CALCISTICA', h1: 'IL GOL', h2: 'LO FAI TU', sub: 'Nei momenti decisivi la palla è tua: tira indietro, mira e calcia!', chips: [['Vero suono da stadio', 'left', 1060], ['Scorri e tira', 'right', 1520]] },
    ind: { tag: 'GAME KARIER SEPAK BOLA', h1: 'KAMU YANG', h2: 'CETAK GOL', sub: 'Di momen penting bola ada di kakimu: tarik, bidik, tendang!', chips: [['Suara stadion asli', 'left', 1060], ['Geser & tendang', 'right', 1520]] },
    ar: { tag: 'لعبة مسيرة كرة القدم', h1: 'أنت من', h2: 'يسجل الهدف', sub: 'في اللحظات الحاسمة الكرة عند قدميك: اسحب، صوّب، سدّد!', chips: [['صوت ملعب حقيقي', 'left', 1060], ['اسحب وسدد', 'right', 1520]] },
    ja: { tag: 'サッカーキャリアゲーム', h1: 'ゴールを', h2: '決めるのは君', sub: '決定的な瞬間、ボールは君の足元に。引いて、狙って、蹴り込め！', chips: [['本物のスタジアム音', 'left', 1060], ['引いてシュート', 'right', 1520]] },
  }),
  P('match', '#8fb8ff', 'rgba(120,170,255,.5)', 3, { stars: true }, {
    tr: { tag: 'CANLI MAÇ', h1: 'MAÇI', h2: 'CANLI YAŞA', sub: 'Maç radarı, dakika dakika akış ve tribünün uğultusu.', chips: [['Maç radarı', 'right', 1000], ['Şampiyonlar Kupası geceleri', 'left', 1560]] },
    en: { tag: 'LIVE MATCHES', h1: 'LIVE EVERY', h2: 'MATCH', sub: 'Match radar, a minute-by-minute feed and the roar of the crowd.', chips: [['Match radar', 'right', 1000], ['Champions Cup nights', 'left', 1560]] },
    es: { tag: 'PARTIDOS EN VIVO', h1: 'VIVE CADA', h2: 'PARTIDO', sub: 'Radar del partido, minuto a minuto y el rugido de la grada.', chips: [['Radar del partido', 'right', 1000], ['Noches de Copa de Campeones', 'left', 1560]] },
    pt: { tag: 'JOGOS AO VIVO', h1: 'VIVA CADA', h2: 'PARTIDA', sub: 'Radar da partida, lance a lance e o grito da torcida.', chips: [['Radar da partida', 'right', 1000], ['Noites de Copa dos Campeões', 'left', 1560]] },
    de: { tag: 'LIVE-SPIELE', h1: 'ERLEBE JEDES', h2: 'SPIEL LIVE', sub: 'Spielradar, Minutenticker und das Brüllen der Fans.', chips: [['Spielradar', 'right', 1000], ['Meisterpokal-Nächte', 'left', 1560]] },
    fr: { tag: 'MATCHS EN DIRECT', h1: 'VIS CHAQUE', h2: 'MATCH', sub: 'Radar du match, minute par minute et la clameur des tribunes.', chips: [['Radar du match', 'right', 1000], ['Soirées de Coupe des Champions', 'left', 1560]] },
    it: { tag: 'PARTITE LIVE', h1: 'VIVI OGNI', h2: 'PARTITA', sub: 'Radar della partita, cronaca minuto per minuto e il boato del tifo.', chips: [['Radar della partita', 'right', 1000], ['Notti di Coppa dei Campioni', 'left', 1560]] },
    ind: { tag: 'LAGA LANGSUNG', h1: 'RASAKAN', h2: 'SETIAP LAGA', sub: 'Radar pertandingan, laporan menit demi menit, dan gemuruh penonton.', chips: [['Radar pertandingan', 'right', 1000], ['Malam Piala Champions', 'left', 1560]] },
    ar: { tag: 'مباريات مباشرة', h1: 'عِش كل', h2: 'مباراة', sub: 'رادار المباراة وتعليق دقيقة بدقيقة وهدير الجماهير.', chips: [['رادار المباراة', 'right', 1000], ['ليالي كأس الأبطال', 'left', 1560]] },
    ja: { tag: 'ライブ試合', h1: 'すべての試合を', h2: 'ライブで', sub: '試合レーダー、分刻みの実況、そしてスタジアムの大歓声。', chips: [['試合レーダー', 'right', 1000], ['チャンピオンズカップの夜', 'left', 1560]] },
  }),
  P('trophy', '#ffcf3f', 'rgba(255,200,60,.55)', -3, { confetti: true }, {
    tr: { tag: 'ŞAMPİYONLUK', h1: 'KUPAYI', h2: 'HAVAYA KALDIR', sub: 'Lig, kupa, Şampiyonlar Kupası ve Altın Yıldız seni bekliyor.', chips: [['Kupa töreni', 'right', 1040], ['Altın Yıldız ödülü', 'left', 1520]] },
    en: { tag: 'GLORY', h1: 'LIFT THE', h2: 'TROPHY', sub: 'Leagues, cups, the Champions Cup and the Golden Star await.', chips: [['Trophy ceremonies', 'right', 1040], ['Golden Star award', 'left', 1520]] },
    es: { tag: 'GLORIA', h1: 'LEVANTA EL', h2: 'TROFEO', sub: 'Ligas, copas, la Copa de Campeones y la Estrella de Oro te esperan.', chips: [['Ceremonias de trofeos', 'right', 1040], ['Estrella de Oro', 'left', 1520]] },
    pt: { tag: 'GLÓRIA', h1: 'LEVANTE A', h2: 'TAÇA', sub: 'Ligas, copas, a Copa dos Campeões e a Estrela de Ouro esperam por você.', chips: [['Cerimônias de taça', 'right', 1040], ['Estrela de Ouro', 'left', 1520]] },
    de: { tag: 'RUHM', h1: 'STEMM DEN', h2: 'POKAL', sub: 'Ligen, Pokale, der Meisterpokal und der Goldene Stern warten.', chips: [['Pokalzeremonien', 'right', 1040], ['Goldener Stern', 'left', 1520]] },
    fr: { tag: 'GLOIRE', h1: 'SOULÈVE LE', h2: 'TROPHÉE', sub: "Championnats, coupes, la Coupe des Champions et l'Étoile d'Or t'attendent.", chips: [['Cérémonies de trophées', 'right', 1040], ["Étoile d'Or", 'left', 1520]] },
    it: { tag: 'GLORIA', h1: 'ALZA IL', h2: 'TROFEO', sub: "Campionati, coppe, la Coppa dei Campioni e la Stella d'Oro ti aspettano.", chips: [['Cerimonie del trofeo', 'right', 1040], ["Stella d'Oro", 'left', 1520]] },
    ind: { tag: 'KEJAYAAN', h1: 'ANGKAT', h2: 'TROFINYA', sub: 'Liga, piala, Piala Champions, dan Bintang Emas menantimu.', chips: [['Upacara trofi', 'right', 1040], ['Bintang Emas', 'left', 1520]] },
    ar: { tag: 'المجد', h1: 'ارفع', h2: 'الكأس', sub: 'الدوريات والكؤوس وكأس الأبطال والنجمة الذهبية بانتظارك.', chips: [['حفلات التتويج', 'right', 1040], ['النجمة الذهبية', 'left', 1520]] },
    ja: { tag: '栄光', h1: 'トロフィーを', h2: '掲げろ', sub: 'リーグ、カップ、チャンピオンズカップ、そしてゴールデンスターが待っている。', chips: [['優勝セレモニー', 'right', 1040], ['ゴールデンスター', 'left', 1520]] },
  }),
  P('street', '#ffb45c', 'rgba(255,170,80,.45)', 3, {}, {
    tr: { tag: 'SIFIRDAN BAŞLA', h1: 'MAHALLEDEN', h2: 'ZİRVEYE', sub: 'Sokakta başla, scoutların gözüne gir, dünyanın en büyük kulüplerine yüksel.', chips: [['Scout teklifleri', 'left', 1060], ['400+ kulüp, 30 lig', 'right', 1520]] },
    en: { tag: 'START FROM ZERO', h1: 'FROM THE', h2: 'STREETS TO THE TOP', sub: "Start on the street, catch the scouts' eye and rise to the world's biggest clubs.", chips: [['Scout offers', 'left', 1060], ['400+ clubs, 30 leagues', 'right', 1520]] },
    es: { tag: 'EMPIEZA DE CERO', h1: 'DEL BARRIO', h2: 'A LA CIMA', sub: 'Empieza en la calle, llama la atención de los ojeadores y llega a los grandes clubes.', chips: [['Ofertas de ojeadores', 'left', 1060], ['400+ clubes, 30 ligas', 'right', 1520]] },
    pt: { tag: 'COMECE DO ZERO', h1: 'DA RUA', h2: 'AO TOPO', sub: 'Comece na rua, chame a atenção dos olheiros e chegue aos maiores clubes do mundo.', chips: [['Propostas de olheiros', 'left', 1060], ['400+ clubes, 30 ligas', 'right', 1520]] },
    de: { tag: 'STARTE BEI NULL', h1: 'VOM BOLZPLATZ', h2: 'NACH GANZ OBEN', sub: 'Starte auf der Straße, überzeuge die Scouts und steig zu den größten Klubs auf.', chips: [['Scout-Angebote', 'left', 1060], ['400+ Klubs, 30 Ligen', 'right', 1520]] },
    fr: { tag: 'PARS DE ZÉRO', h1: 'DU QUARTIER', h2: 'AU SOMMET', sub: 'Commence dans la rue, tape dans l’œil des recruteurs et rejoins les plus grands clubs.', chips: [['Offres de recruteurs', 'left', 1060], ['400+ clubs, 30 ligues', 'right', 1520]] },
    it: { tag: 'PARTI DA ZERO', h1: 'DAL QUARTIERE', h2: 'ALLA VETTA', sub: 'Inizia in strada, conquista gli osservatori e arriva ai club più grandi del mondo.', chips: [['Offerte degli osservatori', 'left', 1060], ['400+ club, 30 campionati', 'right', 1520]] },
    ind: { tag: 'MULAI DARI NOL', h1: 'DARI JALANAN', h2: 'KE PUNCAK', sub: 'Mulai di jalanan, curi perhatian pemandu bakat, dan naik ke klub terbesar dunia.', chips: [['Tawaran pemandu bakat', 'left', 1060], ['400+ klub, 30 liga', 'right', 1520]] },
    ar: { tag: 'ابدأ من الصفر', h1: 'من الحارة', h2: 'إلى القمة', sub: 'ابدأ في الشارع، ولفت أنظار الكشافين، واصعد إلى أكبر أندية العالم.', chips: [['عروض الكشافين', 'left', 1060], ['أكثر من 400 نادٍ و30 دوريًا', 'right', 1520]] },
    ja: { tag: 'ゼロから始めよう', h1: 'ストリートから', h2: '頂点へ', sub: '路地裏で始め、スカウトの目に留まり、世界のビッグクラブへ駆け上がれ。', chips: [['スカウトのオファー', 'left', 1060], ['400以上のクラブ、30リーグ', 'right', 1520]] },
  }),
  P('wc', '#7ee0a8', 'rgba(90,220,150,.45)', -3, { stars: true }, {
    tr: { tag: 'DÜNYA ŞAMPİYONASI RÜYASI', h1: 'ÜLKENİ', h2: 'ŞAMPİYON YAP', sub: '4 turnuvalık milli takım kariyeri: kamp, rakip analizi, taktik ve penaltılar.', chips: [['Milli takım kampı', 'right', 1060], ['Çıkartma albümü', 'left', 1520]] },
    en: { tag: 'WORLD CHAMPIONSHIP DREAM', h1: 'MAKE YOUR', h2: 'NATION CHAMPION', sub: 'A 4-tournament international career: camp, scouting, tactics and penalties.', chips: [['National team camp', 'right', 1060], ['Sticker album', 'left', 1520]] },
    es: { tag: 'SUEÑO DEL CAMPEONATO MUNDIAL', h1: 'HAZ CAMPEÓN', h2: 'A TU PAÍS', sub: 'Una carrera internacional de 4 torneos: concentración, rivales, tácticas y penaltis.', chips: [['Concentración nacional', 'right', 1060], ['Álbum de cromos', 'left', 1520]] },
    pt: { tag: 'SONHO DO CAMPEONATO MUNDIAL', h1: 'FAÇA SEU PAÍS', h2: 'CAMPEÃO', sub: 'Uma carreira de 4 torneios pela seleção: concentração, rivais, táticas e pênaltis.', chips: [['Concentração da seleção', 'right', 1060], ['Álbum de figurinhas', 'left', 1520]] },
    de: { tag: 'WELTMEISTERSCHAFTS-TRAUM', h1: 'MACH DEIN LAND', h2: 'ZUM WELTMEISTER', sub: 'Eine Nationalteam-Karriere über 4 Turniere: Camp, Gegneranalyse, Taktik, Elfmeter.', chips: [['Nationalteam-Camp', 'right', 1060], ['Stickeralbum', 'left', 1520]] },
    fr: { tag: 'RÊVE DU CHAMPIONNAT DU MONDE', h1: 'MÈNE TON PAYS', h2: 'AU TITRE', sub: 'Une carrière internationale sur 4 tournois : stage, analyse, tactique et tirs au but.', chips: [['Stage de la sélection', 'right', 1060], ['Album de vignettes', 'left', 1520]] },
    it: { tag: 'SOGNO DEL CAMPIONATO MONDIALE', h1: 'PORTA LA TUA', h2: 'NAZIONALE AL TITOLO', sub: 'Una carriera in nazionale su 4 tornei: ritiro, avversari, tattica e rigori.', chips: [['Ritiro della nazionale', 'right', 1060], ['Album di figurine', 'left', 1520]] },
    ind: { tag: 'MIMPI KEJUARAAN DUNIA', h1: 'JADIKAN NEGARAMU', h2: 'JUARA', sub: 'Karier timnas 4 turnamen: pemusatan latihan, analisis lawan, taktik, dan penalti.', chips: [['Pemusatan latihan timnas', 'right', 1060], ['Album stiker', 'left', 1520]] },
    ar: { tag: 'حلم بطولة العالم', h1: 'اجعل بلدك', h2: 'بطلًا', sub: 'مسيرة دولية في 4 بطولات: معسكر وتحليل خصوم وتكتيك وركلات ترجيح.', chips: [['معسكر المنتخب', 'right', 1060], ['ألبوم الملصقات', 'left', 1520]] },
    ja: { tag: '世界選手権ドリーム', h1: '祖国を', h2: '世界王者に', sub: '4大会にわたる代表キャリア：合宿、対戦相手分析、戦術、そしてPK戦。', chips: [['代表合宿', 'right', 1060], ['ステッカーアルバム', 'left', 1520]] },
  }),
  P('life', '#ff6fb5', 'rgba(214,80,220,.5)', 3, { ig: true }, {
    tr: { tag: 'SAHA DIŞI HAYAT', h1: 'SAHA DIŞINDA', h2: 'DA YILDIZ OL', sub: 'Süper arabalar, villalar, sponsorluklar ve milyonlarca takipçi.', chips: [['Lüks yaşam vitrini', 'right', 1040], ['Milyonlarca takipçi', 'left', 1520]] },
    en: { tag: 'LIFE OFF THE PITCH', h1: 'A STAR', h2: 'OFF THE PITCH', sub: 'Supercars, villas, sponsorships and millions of followers.', chips: [['Luxury showcase', 'right', 1040], ['Millions of followers', 'left', 1520]] },
    es: { tag: 'VIDA FUERA DEL CAMPO', h1: 'UNA ESTRELLA', h2: 'FUERA DEL CAMPO', sub: 'Superdeportivos, villas, patrocinios y millones de seguidores.', chips: [['Vida de lujo', 'right', 1040], ['Millones de seguidores', 'left', 1520]] },
    pt: { tag: 'VIDA FORA DE CAMPO', h1: 'UMA ESTRELA', h2: 'FORA DE CAMPO', sub: 'Supercarros, mansões, patrocínios e milhões de seguidores.', chips: [['Vida de luxo', 'right', 1040], ['Milhões de seguidores', 'left', 1520]] },
    de: { tag: 'LEBEN NEBEN DEM PLATZ', h1: 'EIN STAR', h2: 'AUCH ABSEITS', sub: 'Supersportwagen, Villen, Sponsorings und Millionen Follower.', chips: [['Luxus-Vitrine', 'right', 1040], ['Millionen Follower', 'left', 1520]] },
    fr: { tag: 'VIE HORS DU TERRAIN', h1: 'UNE STAR', h2: 'HORS DU TERRAIN', sub: 'Supercars, villas, sponsors et des millions d’abonnés.', chips: [['Vitrine de luxe', 'right', 1040], ["Des millions d'abonnés", 'left', 1520]] },
    it: { tag: 'VITA FUORI DAL CAMPO', h1: 'UNA STELLA', h2: 'FUORI DAL CAMPO', sub: 'Supercar, ville, sponsorizzazioni e milioni di follower.', chips: [['Vetrina di lusso', 'right', 1040], ['Milioni di follower', 'left', 1520]] },
    ind: { tag: 'HIDUP DI LUAR LAPANGAN', h1: 'BINTANG', h2: 'DI LUAR LAPANGAN', sub: 'Mobil super, vila, sponsor, dan jutaan pengikut.', chips: [['Etalase mewah', 'right', 1040], ['Jutaan pengikut', 'left', 1520]] },
    ar: { tag: 'الحياة خارج الملعب', h1: 'نجم', h2: 'خارج الملعب', sub: 'سيارات خارقة وفلل وعقود رعاية وملايين المتابعين.', chips: [['واجهة الحياة الفاخرة', 'right', 1040], ['ملايين المتابعين', 'left', 1520]] },
    ja: { tag: 'ピッチ外のライフ', h1: 'ピッチの外でも', h2: 'スターに', sub: 'スーパーカー、豪邸、スポンサー契約、そして数百万のフォロワー。', chips: [['ラグジュアリー', 'right', 1040], ['数百万のフォロワー', 'left', 1520]] },
  }),
  P('medals', '#ffd36b', 'rgba(255,190,60,.5)', -3, {}, {
    tr: { tag: 'BAŞARIMLAR', h1: '100+ MADALYA', h2: 'DÜNYA SIRALAMASI', sub: "Game Center'da dünyayla yarış; kariyerin iCloud'da güvende.", chips: [['Game Center', 'left', 1060], ['iCloud yedeği', 'right', 1520]] },
    en: { tag: 'ACHIEVEMENTS', h1: '100+ MEDALS', h2: 'WORLD RANKINGS', sub: 'Compete with the world on Game Center; your career is safe in iCloud.', chips: [['Game Center', 'left', 1060], ['iCloud backup', 'right', 1520]] },
    es: { tag: 'LOGROS', h1: '100+ MEDALLAS', h2: 'RANKING MUNDIAL', sub: 'Compite con el mundo en Game Center; tu carrera, a salvo en iCloud.', chips: [['Game Center', 'left', 1060], ['Copia en iCloud', 'right', 1520]] },
    pt: { tag: 'CONQUISTAS', h1: '100+ MEDALHAS', h2: 'RANKING MUNDIAL', sub: 'Dispute com o mundo no Game Center; sua carreira segura no iCloud.', chips: [['Game Center', 'left', 1060], ['Backup no iCloud', 'right', 1520]] },
    de: { tag: 'ERFOLGE', h1: '100+ MEDAILLEN', h2: 'WELTRANGLISTE', sub: 'Miss dich mit der Welt im Game Center; deine Karriere ist in iCloud sicher.', chips: [['Game Center', 'left', 1060], ['iCloud-Backup', 'right', 1520]] },
    fr: { tag: 'SUCCÈS', h1: '100+ MÉDAILLES', h2: 'CLASSEMENT MONDIAL', sub: 'Affronte le monde sur Game Center ; ta carrière est en sécurité sur iCloud.', chips: [['Game Center', 'left', 1060], ['Sauvegarde iCloud', 'right', 1520]] },
    it: { tag: 'OBIETTIVI', h1: '100+ MEDAGLIE', h2: 'CLASSIFICA MONDIALE', sub: 'Sfida il mondo su Game Center; la tua carriera è al sicuro su iCloud.', chips: [['Game Center', 'left', 1060], ['Backup iCloud', 'right', 1520]] },
    ind: { tag: 'PENCAPAIAN', h1: '100+ MEDALI', h2: 'PERINGKAT DUNIA', sub: 'Bersaing dengan dunia di Game Center; kariermu aman di iCloud.', chips: [['Game Center', 'left', 1060], ['Cadangan iCloud', 'right', 1520]] },
    ar: { tag: 'الإنجازات', h1: 'أكثر من 100 ميدالية', h2: 'الترتيب العالمي', sub: 'نافس العالم في Game Center؛ مسيرتك آمنة في iCloud.', chips: [['Game Center', 'left', 1060], ['نسخة iCloud', 'right', 1520]] },
    ja: { tag: '実績', h1: '100以上のメダル', h2: '世界ランキング', sub: 'Game Centerで世界と競い、キャリアはiCloudで安心。', chips: [['Game Center', 'left', 1060], ['iCloudバックアップ', 'right', 1520]] },
  }),
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
.phone.tab{height:${Math.round(F.pw * 1376 / 1032)}px;border-radius:46px;padding:18px} .phone.tab .scr{border-radius:30px}
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
<div class="phone${F.tablet ? ' tab' : ''}"><div class="scr"><img src="${img}"></div></div>
${chips}
<div class="foot"></div>
</body></html>`;
};

(async () => {
  const b = await chromium.launch();
  const fs = require('fs');
  const { execSync } = require('child_process');
  const IPAD = process.argv[2] === 'ipad';
  const FORMATS = IPAD
    ? [{ dir: 'ipad', raw: 'raw2-ipad', W: 2064, H: 2752, F: { H: 1440, pw: 600, top: 640, shift: 0, cs: 0.5, tablet: true, subW: 940 } }]
    : [{ dir: 'ios', raw: 'raw2', W: 1290, H: 2796, F: { H: 2341, pw: 720, top: 700, shift: 230 }, also: { dir: 'ios-1206x2622', W: 1206, H: 2622 } }];
  const LANGS = (process.env.LANGS || 'tr,en,es,pt,de,fr,it,id,ar,ja').split(',');
  for (const fm of FORMATS) {
    const pg = await b.newPage({ viewport: { width: 1080, height: fm.F.H }, deviceScaleFactor: fm.W / 1080 });
    const outDir = path.join(D, fm.dir);
    fs.mkdirSync(outDir, { recursive: true });
    const outs = [outDir].concat(fm.also ? [path.join(D, fm.also.dir)] : []);
    for (const l of LANGS) {
      // eski görselleri sil (yükleme aracı klasördeki <dil>-*.png dosyalarının hepsini alır)
      outs.forEach((d) => { fs.mkdirSync(d, { recursive: true }); fs.readdirSync(d).filter((f) => f.startsWith(l + '-') && f.endsWith('.png')).forEach((f) => fs.unlinkSync(path.join(d, f))); });
      for (const [i, p] of POSTERS.entries()) {
        const raw = path.join(D, fm.raw, `${l}-${p.id}.png`);
        if (!fs.existsSync(raw)) { console.log('ham yok', raw); continue; }
        const tmp = path.join(D, '_tmp2.html');
        fs.writeFileSync(tmp, html(p, l, fm.raw + '/' + `${l}-${p.id}.png`, fm.F));
        await pg.goto('file://' + tmp, { waitUntil: 'load' });
        await pg.evaluate(() => document.fonts.ready);
        await pg.waitForTimeout(150);
        const out = path.join(outDir, `${l}-${i + 1}-${p.id}.png`);
        await pg.screenshot({ path: out, clip: { x: 0, y: 0, width: 1080, height: fm.H / (fm.W / 1080) } });
        execSync(`convert "${out}" -resize ${fm.W}x${fm.H}! -background "#0a1530" -alpha remove -alpha off "${out}"`);
        if (fm.also) execSync(`convert "${out}" -resize ${fm.also.W}x${fm.also.H}! -alpha off "${path.join(D, fm.also.dir, path.basename(out))}"`);
      }
    }
    await pg.close();
  }
  try { fs.unlinkSync(path.join(D, '_tmp2.html')); } catch (e) { /* yok */ }
  await b.close();
  console.log('ok');
})();
