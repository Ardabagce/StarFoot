// Dünya Kupası Rüyası: 18 yaşında seçtiğin milli takımla tek bir Dünya Kupası (satın alınabilir paket).
// Kulüp maçı yok: hazırlık kampı, hazırlık maçları, 48 takımlı turnuva (12 grup + son 32), maçlar arası günler.
// Ana kariyerden ayrı kaydedilir (slot 'wc').

// Ana oyunda olmayan, yalnız bu modda oynanan milli takımlar. Yıldız isimleri kurgusaldır.
const WC_NATIONS = [
  { code: 'CAN', name: 'Kanada', rating: 76, flag: '🇨🇦', pool: 'EN', c: ['#d52b1e', '#ffffff'], stars: ['Alphonso Deyvis', 'Jonathan Deyvid', 'Tajon Bukanan'] },
  { code: 'MAR', name: 'Fas', rating: 82, flag: '🇲🇦', pool: 'AR', c: ['#c1272d', '#006233'], stars: ['Achraf Hakimy', 'Brahim Diyaz', 'Yassine Bunuu', 'Nayef Agerdd'] },
  { code: 'TUN', name: 'Tunus', rating: 72, flag: '🇹🇳', pool: 'AR', c: ['#e70013', '#ffffff'], stars: ['Hannibal Mecbiri', 'Ellyes Skirii'] },
  { code: 'ALG', name: 'Cezayir', rating: 75, flag: '🇩🇿', pool: 'AR', c: ['#ffffff', '#006233'], stars: ['Riyad Mahres', 'Rami Bensebayni', 'Amine Guviry'] },
  { code: 'GHA', name: 'Gana', rating: 73, flag: '🇬🇭', pool: 'AF', c: ['#ffffff', '#111111'], stars: ['Mohammed Kudüs', 'Thomas Partay', 'Inaki Wiliyams'] },
  { code: 'SEN', name: 'Senegal', rating: 79, flag: '🇸🇳', pool: 'SN', c: ['#ffffff', '#00853f'], stars: ['Sadio Manee', 'Nikolas Cekson', 'Kalidou Kulibalii', 'Ismaila Sarr'] },
  { code: 'CIV', name: 'Fildişi Sahili', rating: 77, flag: '🇨🇮', pool: 'SN', c: ['#ff8200', '#ffffff'], stars: ['Franck Kessiye', 'Sebastien Halleri', 'Simon Adingraa'] },
  { code: 'NGA', name: 'Nijerya', rating: 77, flag: '🇳🇬', pool: 'AF', c: ['#008751', '#ffffff'], stars: ['Victor Osimen', 'Ademola Lukmen', 'Samuel Çukvueze'] },
  { code: 'CMR', name: 'Kamerun', rating: 74, flag: '🇨🇲', pool: 'SN', c: ['#007a5e', '#ce1126'], stars: ['Bryan Mbömo', 'Andre Onanah', 'Vincent Abubakarr'] },
  { code: 'RSA', name: 'Güney Afrika', rating: 70, flag: '🇿🇦', pool: 'AF', c: ['#ffb81c', '#007749'], stars: ['Percy Tauu', 'Ronwen Wiliyams'] },
  { code: 'CPV', name: 'Yeşil Burun Adaları', rating: 68, flag: '🇨🇻', pool: 'PT', c: ['#003893', '#ffffff'], stars: ['Rayan Mendez', 'Bebe Tavaris'] },
  { code: 'URU', name: 'Uruguay', rating: 83, flag: '🇺🇾', pool: 'ES', c: ['#7bafd4', '#ffffff'], stars: ['Federico Valverdi', 'Darwin Nunyez', 'Ronald Arauco'] },
  { code: 'COL', name: 'Kolombiya', rating: 82, flag: '🇨🇴', pool: 'ES', c: ['#fcd116', '#003893'], stars: ['Luis Diyaz', 'James Rodrigez', 'Jhon Durran'] },
  { code: 'ECU', name: 'Ekvador', rating: 79, flag: '🇪🇨', pool: 'ES', c: ['#ffdd00', '#034ea2'], stars: ['Moises Kaysedo', 'Piero Hinkapie', 'Enner Valensiya'] },
  { code: 'PAR', name: 'Paraguay', rating: 75, flag: '🇵🇾', pool: 'ES', c: ['#ffffff', '#d52b1e'], stars: ['Miguel Almiran', 'Julio Ensiso'] },
  { code: 'CHI', name: 'Şili', rating: 73, flag: '🇨🇱', pool: 'ES', c: ['#d52b1e', '#0039a6'], stars: ['Alexis Sançez', 'Arturo Vidall'] },
  { code: 'PER', name: 'Peru', rating: 70, flag: '🇵🇪', pool: 'ES', c: ['#ffffff', '#d91023'], stars: ['Paolo Gerreru', 'Gianluca Lapadulla'] },
  { code: 'IRN', name: 'İran', rating: 76, flag: '🇮🇷', pool: 'IR', c: ['#ffffff', '#239f40'], stars: ['Mehdi Taremy', 'Sardar Azmunn'] },
  { code: 'KOR', name: 'Güney Kore', rating: 79, flag: '🇰🇷', pool: 'KR', c: ['#c60c30', '#ffffff'], stars: ['Son Heung-mon', 'Kim Min-jee', 'Lee Kang-inn'] },
  { code: 'AUS', name: 'Avustralya', rating: 74, flag: '🇦🇺', pool: 'EN', c: ['#ffcd00', '#00843d'], stars: ['Mathew Rayen', 'Jackson Ervin'] },
  { code: 'QAT', name: 'Katar', rating: 70, flag: '🇶🇦', pool: 'AR', c: ['#8a1538', '#ffffff'], stars: ['Akram Afiff', 'Almoez Alii'] },
  { code: 'UZB', name: 'Özbekistan', rating: 71, flag: '🇺🇿', pool: 'UZ', c: ['#0099b5', '#ffffff'], stars: ['Eldor Şomurodov', 'Abdukodir Husanovv'] },
  { code: 'JOR', name: 'Ürdün', rating: 69, flag: '🇯🇴', pool: 'AR', c: ['#ffffff', '#ce1126'], stars: ['Musa Al-Tamary', 'Yazan Al-Naimatt'] },
  { code: 'IRQ', name: 'Irak', rating: 69, flag: '🇮🇶', pool: 'AR', c: ['#ffffff', '#007a3d'], stars: ['Aymen Hüseyn'] },
  { code: 'NZL', name: 'Yeni Zelanda', rating: 67, flag: '🇳🇿', pool: 'EN', c: ['#ffffff', '#111111'], stars: ['Chris Vudd'] },
  { code: 'PAN', name: 'Panama', rating: 70, flag: '🇵🇦', pool: 'MX', c: ['#da121a', '#ffffff'], stars: ['Adalberto Karaskiya'] },
  { code: 'CRC', name: 'Kosta Rika', rating: 70, flag: '🇨🇷', pool: 'MX', c: ['#002b7f', '#ce1126'], stars: ['Keylor Navass'] },
  { code: 'JAM', name: 'Jamaika', rating: 69, flag: '🇯🇲', pool: 'EN', c: ['#fed100', '#009b3a'], stars: ['Leon Beyli', 'Mikail Antonyo'] },
  { code: 'HAI', name: 'Haiti', rating: 65, flag: '🇭🇹', pool: 'SN', c: ['#00209f', '#d21034'], stars: ['Duckens Nazonn'] },
  { code: 'CUW', name: 'Curaçao', rating: 64, flag: '🇨🇼', pool: 'NL', c: ['#002b7f', '#f9e814'], stars: ['Juninho Bakunaa', 'Tahith Çongg'] },
  { code: 'SRB', name: 'Sırbistan', rating: 78, flag: '🇷🇸', pool: 'HR', c: ['#c6363c', '#ffffff'], stars: ['Dusan Vlahoviç', 'Aleksandar Mitroviç', 'Sergej Milinkoviç'] },
  { code: 'SWE', name: 'İsveç', rating: 77, flag: '🇸🇪', pool: 'DK', c: ['#ffcd00', '#006aa7'], stars: ['Alexander Isakk', 'Viktor Gyökeris', 'Dejan Kuluseviski'] },
  { code: 'WAL', name: 'Galler', rating: 73, flag: '🏴', pool: 'EN', c: ['#c8102e', '#ffffff'], stars: ['Brennan Conson', 'Harry Wilsın'] },
  { code: 'HUN', name: 'Macaristan', rating: 75, flag: '🇭🇺', pool: 'HU', c: ['#ce2939', '#ffffff'], stars: ['Dominik Soboslay', 'Roland Şalay'] },
  { code: 'ROU', name: 'Romanya', rating: 73, flag: '🇷🇴', pool: 'RO', c: ['#fcd116', '#002b7f'], stars: ['Radu Draguşin', 'Nicolae Stançiu'] },
  { code: 'SVK', name: 'Slovakya', rating: 73, flag: '🇸🇰', pool: 'CZ', c: ['#ffffff', '#0b4ea2'], stars: ['Milan Şkriniyar', 'Stanislav Lobodka'] },
  { code: 'IRL', name: 'İrlanda', rating: 72, flag: '🇮🇪', pool: 'EN', c: ['#169b62', '#ffffff'], stars: ['Evan Ferguzon', 'Caoimhin Kelleer'] },
  { code: 'SVN', name: 'Slovenya', rating: 72, flag: '🇸🇮', pool: 'HR', c: ['#ffffff', '#005da4'], stars: ['Jan Oblakk', 'Benjamin Şeşkoo'] },
  { code: 'ALB', name: 'Arnavutluk', rating: 70, flag: '🇦🇱', pool: 'XX', c: ['#e41e20', '#111111'], stars: ['Armando Brocca', 'Kristjan Aslanii'] },
];

// Ek isim havuzları (yalnız bu moddaki takımların kadroları için)
const WC_POOLS = {
  KR: { f: ['Min-jae', 'Hee-chan', 'Kang-in', 'Jae-sung', 'Woo-young', 'Gue-sung', 'Seung-ho', 'Young-gwon', 'Jin-su', 'Hyun-jun'], l: ['Kim', 'Lee', 'Park', 'Hwang', 'Jung', 'Cho', 'Kwon', 'Seol', 'Oh', 'Bae'] },
  IR: { f: ['Ali', 'Mehdi', 'Saman', 'Alireza', 'Morteza', 'Ehsan', 'Milad', 'Saeid', 'Ramin', 'Hossein'], l: ['Ghoddos', 'Jahanbakhsh', 'Pouraliganji', 'Hajsafi', 'Karimi', 'Rezaei', 'Kanaani', 'Mohammadi', 'Ezatolahi', 'Beiranvand'] },
  UZ: { f: ['Jaloliddin', 'Otabek', 'Abbosbek', 'Khojimat', 'Rustam', 'Oston', 'Igor', 'Sherzod', 'Dostonbek', 'Azizbek'], l: ['Masharipov', 'Shukurov', 'Fayzullaev', 'Erkinov', 'Ashurmatov', 'Urunov', 'Sergeev', 'Nasrullaev', 'Khamdamov', 'Turgunboev'] },
  HU: { f: ['Ádám', 'Bendegúz', 'Willi', 'Attila', 'Péter', 'Milos', 'Barnabás', 'Dénes', 'Zsolt', 'Kevin'], l: ['Nagy', 'Bolla', 'Orbán', 'Fiola', 'Gulácsi', 'Kerkez', 'Varga', 'Sallai', 'Schäfer', 'Kalmár'] },
  RO: { f: ['Ianis', 'Răzvan', 'Dennis', 'Andrei', 'Florin', 'Valentin', 'Nicușor', 'Darius', 'Marius', 'Alexandru'], l: ['Hagi', 'Marin', 'Man', 'Rațiu', 'Tănase', 'Mihăilă', 'Bancu', 'Olaru', 'Drăgușin', 'Mitriță'] },
  AF: { f: ['Kwame', 'Emmanuel', 'Joseph', 'Samuel', 'Ibrahim', 'Daniel', 'Kelechi', 'Wilfred', 'Ola', 'Tariq'], l: ['Mensah', 'Boateng', 'Ayew', 'Ndidi', 'Iheanacho', 'Aina', 'Semenyo', 'Salisu', 'Onyeka', 'Lamptey'] },
  SN: { f: ['Moussa', 'Ibrahima', 'Cheikhou', 'Pape', 'Idrissa', 'Lamine', 'Habib', 'Krépin', 'Seko', 'Abdou'], l: ['Diallo', 'Ndiaye', 'Sarr', 'Gueye', 'Koné', 'Diatta', 'Fofana', 'Traoré', 'Camara', 'Mendy'] },
};

// Turnuva aşamaları: [anahtar, ad, sıra puanı]
const WC_STAGES = { g: 'Grup Aşaması', 32: 'Son 32', 16: 'Son 16', 8: 'Çeyrek Final', 4: 'Yarı Final', 2: 'Final' };
const WC_RANK = { g: 1, 32: 2, 16: 3, 8: 4, 4: 5, 2: 6, win: 7 };
const WC_GROUPS = 'ABCDEFGHIJKL';

// Gün aksiyonları: maliyet (enerji) ve etkiler
const WC_ACTS = [
  { id: 'train', ic: 'train', t: 'Antrenman', d: 'Bir mini oyunla seçtiğin özelliği geliştir. İyi çalışırsan hoca da fark eder.', en: -12 },
  { id: 'tactic', ic: 'coach', t: 'Taktik toplantısı', d: 'Hocanın planını öğren: hoca güveni artar, bir sonraki maçta işin biraz kolaylaşır.', en: -4 },
  { id: 'rest', ic: 'rest', t: 'Dinlen', d: 'Enerji toplar, kafanı dinlendirirsin.', en: 26 },
  { id: 'team', ic: 'team', t: 'Takımla vakit geçir', d: 'Kamp arkadaşlarınla bağ kur: takım uyumu ve moral artar.', en: -5 },
  { id: 'media', ic: 'phone', t: 'Röportaj ver', d: 'Basına konuş: doğru cevaplarla ünün ve taraftar sevgin artar.', en: -3 },
  { id: 'physio', ic: 'injury', t: 'Fizyoterapi', d: 'Sakatlığı hızlandırır, yorgunluğu atar.', en: 14 },
];

// Kamp ve turnuva olayları
const WC_EVENTS = [
  { id: 'captain', t: 'Takım kaptanı {} antrenman sonrası yanına geldi: "Ne zaman istersen yanındayım, ilk turnuva herkes için zor."', o: [
    { t: 'Tavsiyelerini dinle', fx: (p) => { Player.addRel(p, 'team', 5); Player.addMorale(p, 5); return 'Kaptanla aranızda güçlü bir bağ oluştu.'; } },
    { t: 'Teşekkür et, kendi işine odaklan', fx: (p) => { Player.addRel(p, 'coach', 2); return 'Odaklı tavrın hocanın gözünden kaçmadı.'; } },
  ] },
  { id: 'mom', t: 'Annen arıyor: "Bütün mahalle seni izleyecek oğlum. Bizi gururlandır."', o: [
    { t: 'Uzun uzun konuş', fx: (p) => { Player.addMorale(p, 9); return 'Ailenle konuşmak sana çok iyi geldi.'; } },
    { t: 'Kısa tut, uyumak lazım', fx: (p) => { Player.addEnergy(p, 6); Player.addMorale(p, 2); return 'Erken yattın, sabah dinç uyandın.'; } },
  ] },
  { id: 'critic', t: 'Ünlü bir yorumcu televizyonda "Bu çocuk daha bu turnuvaya hazır değil" dedi. Sosyal medyada konuşuluyor.', o: [
    { t: 'Cevap verme, sahada konuş', fx: (p) => { Player.addRel(p, 'coach', 3); Player.addMorale(p, -1); return 'Sessiz kaldın. Hoca olgunluğunu beğendi.'; } },
    { t: 'Sert bir cevap paylaş', fx: (p) => { Player.addRel(p, 'fans', 6); Player.addRel(p, 'coach', -4); Player.addFame(p, 1); return 'Taraftarlar arkanda ama hoca bu tartışmadan hoşlanmadı.'; } },
  ] },
  { id: 'knock', t: 'Antrenmanda sert bir müdahale yedin, ayak bileğin sızlıyor.', o: [
    { t: 'Doktora git, bir gün dinlen', fx: (p, s) => { s.wc.injDays = Math.max(s.wc.injDays || 0, 1); Player.addEnergy(p, 8); return 'Doktor bir gün dinlenmeni istedi. Ciddi bir şey yok.'; } },
    { t: 'Önemsiz, devam et', fx: (p, s) => { if (U.chance(0.35)) { s.wc.injDays = 3; return 'Kötü haber: ağrı geçmedi, 3 gün sahalardan uzaksın.'; } Player.addRel(p, 'coach', 2); return 'Dişini sıktın ve antrenmanı tamamladın. Hoca etkilendi.'; } },
  ] },
  { id: 'star', t: 'Takımın yıldızı {} serbest vuruş çalışmasına seni de çağırdı.', o: [
    { t: 'Hemen katıl', fx: (p) => { p.stats.technique = Math.min(99, p.stats.technique + 1); p.stats.shooting = Math.min(99, p.stats.shooting + 1); Player.addEnergy(p, -6); return 'Ondan çok şey öğrendin: Teknik +1, Şut +1.'; } },
    { t: 'Yorgunum, başka sefere', fx: (p) => { Player.addEnergy(p, 5); return 'Dinlendin ama güzel bir fırsatı kaçırdın.'; } },
  ] },
  { id: 'night', t: 'Birkaç takım arkadaşın gece gizlice otelden çıkıp şehri gezmeyi planlıyor. Seni de çağırıyorlar.', o: [
    { t: 'Katıl', fx: (p, s) => { Player.addRel(p, 'team', 4); Player.addEnergy(p, -14); if (U.chance(0.4)) { Player.addRel(p, 'coach', -10); return 'Yakalandınız! Hoca çok kızgın.'; } return 'Kimse fark etmedi, çok eğlendiniz.'; } },
    { t: 'Otelde kal', fx: (p) => { Player.addRel(p, 'coach', 2); Player.addEnergy(p, 4); return 'Kurallara uydun. Akıllıca bir karar.'; } },
  ] },
  { id: 'fans', t: 'Otelin önünde yüzlerce taraftar toplandı, senin adını bağırıyorlar.', o: [
    { t: 'Aşağı inip imza dağıt', fx: (p) => { Player.addRel(p, 'fans', 7); Player.addEnergy(p, -4); Social.ensure(p).followers += 1500; return 'Taraftarlar seni çok sevdi. Takipçilerin arttı.'; } },
    { t: 'Pencereden el salla', fx: (p) => { Player.addRel(p, 'fans', 2); return 'Taraftarlar seni görünce coştu.'; } },
  ] },
  { id: 'coachtalk', t: 'Hoca seni odasına çağırdı: "Senden ne bekliyorum biliyor musun?"', o: [
    { t: 'Takım için her şeyi yapacağım', fx: (p) => { Player.addRel(p, 'coach', 6); return 'Hoca gülümsedi: "Tam da bunu duymak istiyordum."'; } },
    { t: 'İlk 11\'de oynamak istiyorum', fx: (p) => { Player.addRel(p, 'coach', U.chance(0.5) ? 4 : -3); Player.addMorale(p, 3); return 'Hoca isteğini not etti. Sahada kanıtlaman gerek.'; } },
  ] },
  { id: 'rivalstar', t: 'Bir sonraki rakibin yıldızı {} röportajında seni hiç tanımadığını söyledi.', o: [
    { t: 'Maçta tanıştırırız', fx: (p) => { Player.addMorale(p, 6); Player.addFame(p, 0.6); return 'Sözlerin manşet oldu. Şimdi sahada kanıtlama zamanı.'; } },
    { t: 'Saygı duyuyorum', fx: (p) => { Player.addRel(p, 'coach', 2); return 'Sakin tavrın takdir topladı.'; } },
  ] },
];

const WC = {
  YEAR: 2026,
  KEY: 'wc',
  // Bu mod için seçilebilir milli takımlar (ana listedekiler + ek takımlar)
  pool() {
    const main = NATIONS.filter((n) => !NAT_FROM[n.code] || WC.YEAR >= NAT_FROM[n.code]);
    return main.concat(WC_NATIONS).map((n) => Object.assign({}, n, { rating: (Game.nat(n.code) || n).rating }));
  },
  natOf(code) { return Game.nat(code) || WC_NATIONS.find((n) => n.code === code); },
  poolOf(code) {
    const x = WC_NATIONS.find((n) => n.code === code);
    if (x) return x.pool;
    return { TUR: 'TR', ENG: 'EN', SCO: 'EN', USA: 'US', ESP: 'ES', ARG: 'ES', MEX: 'MX', BRA: 'BR', POR: 'PT', GER: 'DE', AUT: 'DE', SUI: 'DE', ITA: 'IT', FRA: 'FR', BEL: 'BE', NED: 'NL', KSA: 'SA', EGY: 'AR', JPN: 'JP', GRE: 'GR', DEN: 'DK', NOR: 'DK', CRO: 'HR', CZE: 'CZ', POL: 'PL', UKR: 'UA' }[code] || 'XX';
  },
  history() { return Meta.get('sf_wc', { runs: [], titles: 0, best: {} }); },
  saved() { const d = Game.load(WC.KEY); return d && d.wc && d.wc.phase !== 'done' ? d : null; },
  active() { const s = Game.state; return !!(s && s.mode === 'wc'); },

  // ---------- Giriş ----------
  menu() {
    if (!Packs.owns('wc')) return Packs.offer('wc');
    const sv = WC.saved();
    const h = WC.history();
    const runs = h.runs.slice(0, 5);
    const m = Game.modal(`<div class="ev-tag">Dünya Kupası Rüyası</div><h2>${Icon('star')} ${WC.YEAR} Dünya Kupası</h2>
      <p>18 yaşındasın ve milli takım kampına davet edildin. Hazırlık kampında kendini göster, hocanın güvenini kazan ve ülkeni dünya şampiyonluğuna taşı.</p>
      ${h.titles ? `<div class="scn-goal">${Icon('star')} Dünya şampiyonluğu: <b>${h.titles}</b></div>` : ''}
      ${runs.length ? `<div class="lbl">Son turnuvaların</div><div class="cup-hist">${runs.map((r) => `<div><small>${U.esc(WC.natOf(r.nat) ? WC.natOf(r.nat).name : r.nat)}</small><span>${U.esc(WC.stageText(r.stage))}</span><b>${r.g} gol</b></div>`).join('')}</div>` : ''}`,
    [{ t: 'Kapat', cls: 'btn-ghost' }].concat(sv ? [{ t: 'Yeni turnuva', cls: 'btn-ghost', fn: () => WC.confirmNew() }, { t: `${Icon('play')} Devam et`, cls: 'btn-big', fn: () => WC.resume() }] : [{ t: `${Icon('play')} Başla`, cls: 'btn-big', fn: () => WC.setup() }]), { wide: true });
    return m;
  },
  confirmNew() {
    Game.modal('<h3>Yeni turnuva başlasın mı?</h3><p>Devam eden Dünya Kupası macerası silinecek.</p>', [{ t: 'Vazgeç', cls: 'btn-ghost' }, { t: 'Yeni turnuva', fn: () => WC.setup() }]);
  },
  resume() {
    const d = Game.load(WC.KEY);
    if (!d) return WC.setup();
    Game.slot = WC.KEY;
    Game.state = d;
    WC.enter();
  },

  // Kurulum: ülke, isim, mevki, ayak
  setup() {
    const list = WC.pool().sort((a, b) => b.rating - a.rating);
    const tier = (r) => (r >= 85 ? 0 : r >= 79 ? 1 : r >= 73 ? 2 : 3);
    const tiers = ['Favoriler', 'Güçlü takımlar', 'Sürpriz adayları', 'Masal takımları'];
    const home = I18N.home();
    let sel = list.find((n) => n.code === home) ? home : 'TUR';
    const dn = I18N.defName();
    const m = Game.modal(`<div class="ev-tag">Dünya Kupası Rüyası</div><h2>Ülkeni seç</h2>
      <p class="muted">Güçlü bir takımda kadroya girmek zordur, küçük bir takımda ise her maç bir destan. Seçim senin.</p>
      <div class="wc-nats">${tiers.map((tn, ti) => {
        const xs = list.filter((n) => tier(n.rating) === ti);
        return xs.length ? `<div class="lbl">${tn}</div><div class="wc-grid">${xs.map((n) => `<button type="button" class="wc-nat ${n.code === sel ? 'on' : ''}" data-wcn="${n.code}">${UI.shirt({ id: n.code, c1: (NAT_COLORS[n.code] || ['#1d3c8f'])[0], c2: (NAT_COLORS[n.code] || ['#1d3c8f', '#fff'])[1] })}<b>${U.esc(n.name)}</b><small>${n.rating}</small></button>`).join('')}</div>` : '';
      }).join('')}</div>
      <div class="cr-row2"><label class="cr-f"><span>Adın</span><input id="wc-name" maxlength="16" value="${dn[0]}" autocomplete="off"></label><label class="cr-f"><span>Soyadın</span><input id="wc-sur" maxlength="18" value="${dn[1]}" autocomplete="off"></label></div>
      <div class="cr-row2"><label class="cr-f"><span>Mevki</span><select id="wc-pos">${Object.entries(POSITIONS).map(([k, v]) => `<option value="${k}">${v.l}</option>`).join('')}</select></label>
      <label class="cr-f"><span>Ayak</span><select id="wc-foot"><option value="R">Sağ</option><option value="L">Sol</option></select></label></div>`,
    [{ t: 'Vazgeç', cls: 'btn-ghost' }, { t: `${Icon('play')} Kampa katıl`, cls: 'btn-big', keep: true, fn: () => {
      const n = (document.getElementById('wc-name').value.trim() || dn[0]).slice(0, 16);
      const sn = (document.getElementById('wc-sur').value.trim() || dn[1]).slice(0, 18);
      const pos = document.getElementById('wc-pos').value, foot = document.getElementById('wc-foot').value;
      m.classList.add('hidden'); m.innerHTML = '';
      WC.start({ nat: sel, name: n, surname: sn, position: pos, foot });
    } }], { wide: true });
    U.$$('[data-wcn]', m).forEach((b) => (b.onclick = () => {
      sel = b.dataset.wcn;
      U.$$('[data-wcn]', m).forEach((x) => x.classList.toggle('on', x === b));
    }));
  },

  start(o) {
    const nat = WC.natOf(o.nat);
    const year = WC.YEAR;
    const world = World.create(year);
    const player = Player.create({ name: o.name, surname: o.surname, nation: o.nat, mother: o.nat, position: o.position, foot: o.foot, alloc: {}, age: 18 });
    // 18 yaşında umut vadeden bir oyuncu: takımın biraz altında, kendini kanıtlaması gerekiyor
    const target = Math.round(U.clamp(nat.rating - 6, 56, 84));
    const w = POSITIONS[o.position].w;
    STATS.forEach((st) => (player.stats[st.k] = U.clamp(Math.round(target + ((w[st.k] || 0) - 0.11) * 40 + U.randi(-2, 2)), 25, 95)));
    for (let i = 0; i < 8; i++) { const d = target - Player.overall(player); if (!d) break; STATS.forEach((st) => (player.stats[st.k] = U.clamp(player.stats[st.k] + d, 20, 97))); }
    player.potential = 95;
    player.fame = 6;
    player.money = 25000;
    player.rel = { coach: 48, team: 50, fans: 35 };
    player.shirt = U.pick([14, 17, 19, 20, 21, 23, 25]);
    // kulübü: ülkesinin liginden ya da gücüne yakın bir kulüp
    const lg = LEAGUES.find((l) => l.id === (o.nat === 'TUR' ? 'TR1' : o.nat));
    const clubs = Object.values(world.clubs).filter((c) => (lg ? c.league === lg.id : true) && LEAGUES.find((l) => l.id === c.league));
    const club = clubs.sort((a, b) => Math.abs(a.rating - target - 2) - Math.abs(b.rating - target - 2))[0];
    Game.slot = WC.KEY;
    Game.state = {
      v: 2, mode: 'wc', player, world, clubId: club.id,
      contract: { type: 'pro', clubId: club.id, wage: Game.wageFor(club.rating, target), years: 3 },
      season: { year, round: 0, stats: Game.blankSeason(), intlDone: [] },
      youth: null, street: { done: true }, startYear: year, difficulty: 'normal', ap: 3, week: { coachTalk: false },
      trainFocus: Object.keys(w)[0], news: [], offers: [], pendingIntl: null, pendingEvent: null, seasonEnd: null,
      wc: WC.blank(o.nat),
    };
    Game.news(`${Player.fullName(player)}, ${year} Dünya Kupası için ${nat.name} milli takım kampına davet edildi! 18 yaşındaki genç yetenek ilk kez A takım kampında.`, 'good');
    Game.save();
    WC.enter();
    Game.modal(`<div class="ev-tag">${WC.YEAR} Dünya Kupası</div><h2>Kampa hoş geldin!</h2>
      <p>${U.esc(nat.name)} hocası seni ilk kez A takım kampına çağırdı. Turnuvadan önce 6 günlük hazırlık kampı ve 2 hazırlık maçı var.</p>
      <ul class="tips">
        <li>Her gün 2 aksiyon hakkın var: antrenman, taktik, dinlenme, takımla vakit geçirmek...</li>
        <li>Hoca güveni yüksek ve formun iyiyse ilk 11'de oynarsın. Yedekteysen oyuna sonradan girebilirsin.</li>
        <li>Enerjini iyi yönet: turnuvada maçlar arası sadece birkaç gün var.</li>
        <li>Grupta iki sarı kart bir maç ceza demek. Eleme turlarında beraberlik penaltılarla biter ve penaltını sen atarsın!</li>
      </ul>`, [{ t: 'Başlayalım!', cls: 'btn-big' }], { wide: true });
  },

  blank(code) {
    const t = WC.draw(code);
    const camp = ['day', 'day', 'friendly', 'day', 'day', 'friendly', 'squad'];
    return {
      nat: code, phase: 'camp', step: 0, plan: camp, ap: 2, day: 1,
      groups: t.groups, teams: t.teams, myG: t.myG, fx: WC.groupFx(t.groups), md: 0, gl: [], ko: null,
      sc: {}, stats: { apps: 0, goals: 0, assists: 0, rs: 0, motm: 0, min: 0 }, yel: 0, sus: 0, injDays: 0,
      friendlies: WC.friendlyOpps(code, t.teams), fi: 0, boost: 0, stage: 'camp', elim: null, log: [], squadRole: null,
    };
  },

  // 48 takım: ev sahipleri + seçilen ülke + güce göre (biraz sürprizle) diğerleri; 4 torbadan 12 grup
  draw(code) {
    const all = WC.pool();
    const hosts = ['USA', 'MEX', 'CAN'];
    const must = hosts.concat(code).filter((c, i, a) => a.indexOf(c) === i);
    const rest = all.filter((n) => !must.includes(n.code)).map((n) => ({ c: n.code, k: n.rating + U.rand(-5, 5) })).sort((a, b) => b.k - a.k).map((x) => x.c);
    const teams = must.concat(rest).slice(0, 48);
    const rt = (c) => WC.natOf(c).rating;
    const seeded = teams.filter((c) => !hosts.includes(c)).sort((a, b) => rt(b) - rt(a));
    const pots = [hosts.concat(seeded.slice(0, 9)), seeded.slice(9, 21), seeded.slice(21, 33), seeded.slice(33, 45)];
    const groups = Array.from({ length: 12 }, () => []);
    pots.forEach((pot) => U.shuffle(pot.slice()).forEach((c, i) => groups[i].push(c)));
    const myG = groups.findIndex((g) => g.includes(code));
    return { teams, groups, myG };
  },
  // grup fikstürü: 3 maç günü, her gün iki maç
  groupFx(groups) {
    return groups.map((g) => [[[g[0], g[1]], [g[2], g[3]]], [[g[0], g[2]], [g[3], g[1]]], [[g[3], g[0]], [g[1], g[2]]]]);
  },
  friendlyOpps(code, teams) {
    const me = WC.natOf(code).rating;
    const others = WC.pool().filter((n) => n.code !== code);
    const weak = others.filter((n) => n.rating <= me - 2).sort((a, b) => b.rating - a.rating)[U.randi(0, 3)] || others[others.length - 1];
    const strong = others.filter((n) => n.rating >= me + 1 && n.code !== weak.code).sort((a, b) => a.rating - b.rating)[U.randi(0, 2)] || others[0];
    return [weak.code, strong.code];
  },

  enter() {
    document.body.classList.add('wc-mode');
    Game.show('hub');
    UI.wcView = 'day';
    WC.render();
  },
  askExit() {
    Game.modal('<h3>Ana menüye dönülsün mü?</h3><p>İlerlemen kaydedildi. Dünya Kupası\'na istediğin zaman ana menüden devam edebilirsin.</p>', [{ t: 'Vazgeç', cls: 'btn-ghost' }, { t: 'Ana menü', fn: () => WC.exit() }]);
  },
  exit() {
    document.body.classList.remove('wc-mode');
    Game.toMenu();
  },

  // ---------- Takımlar ve simülasyon ----------
  team(code) {
    const s = Game.state, n = WC.natOf(code), col = NAT_COLORS[code] || ['#1d3c8f', '#ffffff'];
    s.wc.ros = s.wc.ros || {};
    if (!s.wc.ros[code]) {
      const stars = (code === s.wc.nat ? Game.natStars(code) : (Game.nat(code) ? Game.natStars(code) : n.stars)).filter((x) => x !== Player.fullName(s.player)).slice(0, 4);
      const r = stars.map((name, i) => ({ n: name, pos: i < 2 ? 'FW' : 'MF', r: n.rating + 3 }));
      const pool = WC.poolOf(code);
      const need = ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'FW', 'FW', 'DF', 'MF', 'FW', 'GK'];
      need.slice(r.length).forEach((pos) => r.push({ n: World.genName(pool), pos, r: n.rating - U.randi(1, 6) }));
      s.wc.ros[code] = r;
    }
    return { id: code, name: n.name, short: code, rating: n.rating, c1: col[0], c2: col[1], roster: s.wc.ros[code] };
  },
  pois(l) { let k = 0, p = Math.exp(-l), sum = p; const u = Math.random(); while (u > sum && k < 9) { k++; p *= l / k; sum += p; } return k; },
  // iki takım arası maç simülasyonu (ko: beraberlikte penaltı)
  sim(h, a, ko) {
    const rh = WC.natOf(h).rating, ra = WC.natOf(a).rating;
    const d = (rh - ra) / 11;
    const gh = WC.pois(U.clamp(1.25 + d * 0.9, 0.25, 3.6)), ga = WC.pois(U.clamp(1.25 - d * 0.9, 0.25, 3.6));
    let win = gh > ga ? h : ga > gh ? a : null, pens = null;
    if (ko && !win) { pens = U.chance(0.5 + (rh - ra) / 90) ? [U.randi(4, 5), U.randi(2, 4)] : [U.randi(2, 4), U.randi(4, 5)]; if (pens[0] === pens[1]) pens[0]++; win = pens[0] > pens[1] ? h : a; }
    WC.scorers(h, gh); WC.scorers(a, ga);
    return { h, a, hs: gh, as: ga, win, pens };
  },
  // golleri kadrodan seçilen oyunculara yazar (forvetler daha olası)
  scorers(code, n, names) {
    const s = Game.state, ros = WC.team(code).roster;
    const wt = (x) => ({ FW: 5, MF: 2.4, DF: 0.7, GK: 0 }[x.pos] || 1) * (x.r > WC.natOf(code).rating ? 3 : 1);
    for (let i = 0; i < n; i++) {
      const nm = names && names[i] ? names[i] : U.weighted ? U.weighted(ros, wt).n : WC.wpick(ros, wt).n;
      const k = `${code}|${nm}`;
      s.wc.sc[k] = s.wc.sc[k] || { n: nm, t: code, g: 0 };
      s.wc.sc[k].g++;
    }
  },
  wpick(arr, w) { const tot = arr.reduce((a, x) => a + w(x), 0); let r = Math.random() * tot; for (const x of arr) { r -= w(x); if (r <= 0) return x; } return arr[0]; },

  table(g) {
    const s = Game.state, rows = {};
    s.wc.groups[g].forEach((c) => (rows[c] = { id: c, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0 }));
    s.wc.gl.filter((m) => m.g === g).forEach((m) => {
      const H = rows[m.h], A = rows[m.a];
      H.p++; A.p++; H.gf += m.hs; H.ga += m.as; A.gf += m.as; A.ga += m.hs;
      if (m.hs > m.as) { H.w++; A.l++; H.pts += 3; } else if (m.hs < m.as) { A.w++; H.l++; A.pts += 3; } else { H.d++; A.d++; H.pts++; A.pts++; }
    });
    return Object.values(rows).sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf || WC.natOf(y.id).rating - WC.natOf(x.id).rating);
  },
  // gruplar bitince son 32: 12 birinci, 12 ikinci, en iyi 8 üçüncü
  buildKO() {
    const s = Game.state;
    const tabs = WC_GROUPS.split('').map((_, g) => WC.table(g));
    const key = (r) => r.pts * 1000 + (r.gf - r.ga) * 30 + r.gf;
    const firsts = tabs.map((t, g) => ({ c: t[0].id, g, k: key(t[0]) + 3e6 }));
    const seconds = tabs.map((t, g) => ({ c: t[1].id, g, k: key(t[1]) + 2e6 }));
    const thirds = tabs.map((t, g) => ({ c: t[2].id, g, k: key(t[2]) })).sort((a, b) => b.k - a.k);
    const q = firsts.concat(seconds, thirds.slice(0, 8)).sort((a, b) => b.k - a.k);
    s.wc.thirdOut = thirds.slice(8).map((x) => x.c);
    // tohum sırasına göre klasik eleme ağacı (güçlüler finale kadar karşılaşmaz)
    const order = [1, 32, 16, 17, 9, 24, 8, 25, 5, 28, 12, 21, 13, 20, 4, 29, 3, 30, 14, 19, 11, 22, 6, 27, 7, 26, 10, 23, 15, 18, 2, 31];
    const alive = order.map((k) => q[k - 1].c);
    // aynı gruptan iki takım ilk turda karşılaşmasın
    const grp = (c) => s.wc.groups.findIndex((g) => g.includes(c));
    for (let i = 0; i < 32; i += 2) {
      if (grp(alive[i]) !== grp(alive[i + 1])) continue;
      for (let j = i + 3; j < 32; j += 2) if (grp(alive[j]) !== grp(alive[i]) && grp(alive[j - 1]) !== grp(alive[i + 1])) { [alive[i + 1], alive[j]] = [alive[j], alive[i + 1]]; break; }
    }
    s.wc.ko = { size: 32, alive, log: [] };
  },
  stageText(st) { return st === 'win' ? 'Dünya Şampiyonu' : st === 2 || st === '2' ? 'Finalist' : st === 'g' ? 'Grup Aşaması' : WC_STAGES[st] || ''; },

  // ---------- Akış ----------
  cur() { const w = Game.state.wc; return w.plan[w.step]; },
  next() {
    const s = Game.state, w = s.wc, p = s.player;
    w.step++;
    // plan bittiyse turnuva aşamasına göre devam
    if (w.step >= w.plan.length) WC.extend();
    if (WC.cur() === 'day') {
      w.ap = 2; w.day++;
      Player.addEnergy(p, 11 + p.stats.stamina / 20);
      Player.addMorale(p, p.morale < 55 ? 2 : -0.5);
      p.rel.coach += (50 - p.rel.coach) * 0.02;
      if (w.injDays > 0) { w.injDays--; if (!w.injDays) Game.news('Sakatlığın geçti, antrenmanlara döndün.', 'good'); }
      if (U.chance(w.phase === 'camp' ? 0.45 : 0.35)) setTimeout(() => WC.event(), 350);
    }
    Game.save();
    WC.render();
  },
  // planın devamı: grup maçları, eleme turları
  extend() {
    const w = Game.state.wc;
    if (w.phase === 'camp') { w.phase = 'group'; w.plan = ['match', 'day', 'day', 'match', 'day', 'day', 'match', 'gend']; w.step = 0; return; }
    if (w.phase === 'group' || w.phase === 'ko') { w.phase = 'ko'; w.plan = ['day', 'day', 'match']; w.step = 0; }
  },

  // ---------- Günlük aksiyonlar ----------
  async act(id) {
    const s = Game.state, w = s.wc, p = s.player;
    if (w.ap <= 0 || WC.busy) return;
    const A = WC_ACTS.find((a) => a.id === id);
    if (id === 'train') {
      if (w.injDays > 0) return Game.toast('Sakatken antrenman yapamazsın. Fizyoterapi ya da dinlenme seç.', 'bad');
      if (p.energy < 18) return Game.toast('Antrenman için çok yorgunsun. Önce dinlen.', 'bad');
      return WC.trainPick();
    }
    WC.busy = true;
    let msg = '';
    if (id === 'tactic') { Player.addRel(p, 'coach', 5); w.boost = Math.min(0.03, (w.boost || 0) + 0.015); msg = 'Hocanın planını öğrendin. Bir sonraki maçta işin biraz daha kolay.'; }
    if (id === 'rest') { Player.addMorale(p, 3); msg = 'Güzelce dinlendin.'; }
    if (id === 'team') { Player.addRel(p, 'team', 6); Player.addMorale(p, 5); msg = `${WC.mate()} ve diğerleriyle güzel vakit geçirdin. Takımla bağın güçlendi.`; }
    if (id === 'physio') { if (w.injDays > 0) { w.injDays = Math.max(0, w.injDays - 1); msg = w.injDays ? `Tedavi iyi gidiyor. ${w.injDays} gün kaldı.` : 'Tedavi işe yaradı, sahalara dönmeye hazırsın!'; } else msg = 'Kasların gevşedi, yorgunluğun azaldı.'; }
    if (id === 'media') { WC.busy = false; return WC.interview(); }
    Player.addEnergy(p, A.en);
    w.ap--;
    WC.busy = false;
    Game.toast(msg, 'good');
    Game.save();
    WC.render();
  },
  trainPick() {
    const s = Game.state, p = s.player;
    const keys = Object.entries(POSITIONS[p.position].w).sort((a, b) => b[1] - a[1]).map(([k]) => k).slice(0, 6);
    const m = Game.modal(`<div class="ev-tag">Antrenman</div><h3>Hangi özelliğini çalışmak istersin?</h3><p class="muted">Bir mini oyun oynayacaksın. Ne kadar iyi oynarsan o kadar gelişirsin.</p>
      <div class="wc-train">${keys.map((k) => { const st = STATS.find((x) => x.k === k); return `<button type="button" class="btn btn-ghost" data-wct="${k}"><b>${st.l}</b><small>${p.stats[k]}</small></button>`; }).join('')}</div>`, [{ t: 'Vazgeç', cls: 'btn-ghost' }]);
    U.$$('[data-wct]', m).forEach((b) => (b.onclick = async () => {
      m.classList.add('hidden'); m.innerHTML = '';
      const k = b.dataset.wct;
      WC.busy = true;
      const r = await Drill.run(k, { tag: 'KAMP' });
      const gain = r.auto ? 1 : r.q >= 0.85 ? 3 : r.q >= 0.6 ? 2 : r.q >= 0.35 ? 1 : 0;
      p.stats[k] = Math.min(99, p.stats[k] + gain);
      Player.addEnergy(p, -12);
      Player.addRel(p, 'coach', r.auto ? 1 : Math.round(r.q * 5));
      s.wc.ap--;
      WC.busy = false;
      const st = STATS.find((x) => x.k === k);
      Game.toast(`${Drill.grade(r.q)}: ${st.l} +${gain}`, gain ? 'good' : 'info');
      Game.save();
      WC.render();
    }));
  },
  interview() {
    const s = Game.state, w = s.wc, p = s.player;
    const qs = [
      { q: 'İlk Dünya Kupası\'nda neler hissediyorsun?', a: ['Burada olmak bir onur, takıma yardım etmek istiyorum.', 'Hazırım, fırsat verilirse göstereceğim.', 'Bu turnuva benim turnuvam olacak!'] },
      { q: 'Takımda kendini nerede görüyorsun?', a: ['Hoca nerede isterse orada oynarım.', 'İlk 11\'i hak ettiğimi düşünüyorum.', 'Takımın en iyisi olmak için buradayım.'] },
      { q: 'Ülkendeki taraftarlara ne mesaj vermek istersin?', a: ['Desteğiniz bizim için her şey.', 'Bizi gururlandıracağız.', 'Kupayı eve getireceğiz, söz!'] },
    ];
    const q = U.pick(qs);
    const fx = [[2, 1, 2, 0.3], [2, 4, 0, 0.7], [1, 7, -3, 1.4]];
    const m = Game.modal(`<div class="press"><div class="ev-tag">Röportaj</div><div class="press-mics"><i></i><i></i><i></i></div><h3>${U.esc(q.q)}</h3>
      <div class="press-opts">${q.a.map((t, i) => `<button class="btn btn-ghost press-a" data-wci="${i}"><small>${['Sakin', 'Kendinden emin', 'İddialı'][i]}</small>${U.esc(t)}</button>`).join('')}</div></div>`, [{ t: 'Vazgeç', cls: 'btn-ghost' }]);
    U.$$('[data-wci]', m).forEach((b) => (b.onclick = () => {
      const i = +b.dataset.wci, f = fx[i];
      m.classList.add('hidden'); m.innerHTML = '';
      Player.addMorale(p, f[0]); Player.addRel(p, 'fans', f[1]); Player.addRel(p, 'coach', f[2]); Player.addFame(p, f[3]);
      Player.addEnergy(p, -3);
      Social.ensure(p).followers += Math.round(400 * (i + 1) * (1 + p.fame / 20));
      w.ap--;
      Game.news(`Röportaj: "${q.a[i]}"`, 'me');
      Game.save();
      WC.render();
    }));
  },
  mate() { const r = WC.team(Game.state.wc.nat).roster; return U.pick(r.slice(0, 6)).n; },
  event() {
    const s = Game.state, w = s.wc, p = s.player;
    if (!WC.active() || !document.getElementById('modal').classList.contains('hidden')) return;
    const used = w.evUsed = w.evUsed || [];
    const pool = WC_EVENTS.filter((e) => !used.includes(e.id) && (e.id !== 'rivalstar' || w.phase !== 'camp'));
    if (!pool.length) return;
    const e = U.pick(pool);
    used.push(e.id);
    const nx = WC.nextOpp();
    const txt = e.t.replace('{}', e.id === 'rivalstar' ? (nx ? WC.team(nx).roster[0].n : '') : WC.team(w.nat).roster[0].n);
    const m = Game.modal(`<div class="ev-tag">Kamp hayatı</div><p>${U.esc(txt)}</p>`, e.o.map((o) => ({ t: o.t, fn: () => {
      const r = o.fx(p, s);
      Game.toast(r, 'info');
      Game.save();
      WC.render();
    } })));
    return m;
  },
  nextOpp() {
    const w = Game.state.wc;
    if (w.phase === 'camp') return w.friendlies[w.fi] || null;
    if (w.phase === 'group' && w.md < 3) { const f = w.fx[w.myG][w.md].find((x) => x.includes(w.nat)); return f ? (f[0] === w.nat ? f[1] : f[0]) : null; }
    if (w.ko) { const i = w.ko.alive.indexOf(w.nat); if (i < 0) return null; return w.ko.alive[i % 2 ? i - 1 : i + 1]; }
    return null;
  },

  // ---------- Maçlar ----------
  role() {
    const s = Game.state, w = s.wc, p = s.player;
    if (w.injDays > 0) return 'out';
    if (w.sus > 0) return 'sus';
    const r = Game.roleFor(Player.overall(p, true), WC.natOf(w.nat).rating, false, true);
    return r === 'out' ? 'bench' : r;
  },
  async play() {
    const s = Game.state, w = s.wc, p = s.player;
    if (WC.busy) return;
    const cur = WC.cur();
    const opp = WC.nextOpp();
    if (!opp) return;
    WC.busy = true;
    const friendly = cur === 'friendly';
    const ko = w.phase === 'ko';
    const stage = friendly ? 'Hazırlık Maçı' : ko ? WC_STAGES[w.ko.size] : `${WC_GROUPS[w.myG]} Grubu · ${w.md + 1}. Maç`;
    const homeFirst = friendly ? U.chance(0.5) : ko ? w.ko.alive.indexOf(w.nat) % 2 === 0 : (w.fx[w.myG][w.md].find((x) => x.includes(w.nat))[0] === w.nat);
    const me = WC.team(w.nat), them = WC.team(opp);
    const ctx = {
      home: homeFirst ? me : them, away: homeFirst ? them : me, side: homeFirst ? 'home' : 'away',
      compName: friendly ? `Hazırlık Maçı · ${me.name} - ${them.name}` : `${WC.YEAR} Dünya Kupası · ${stage}`,
      levelBase: Game.levelBase(true) + (friendly ? -0.03 : ko ? 0.02 + (w.ko.size <= 4 ? 0.02 : 0) : 0) - (w.boost || 0), lg: 'wc', theme: 'wc', sbTag: friendly ? 'HAZIRLIK' : 'DÜNYA KUPASI',
    };
    if (ko && w.ko.size === 2) ctx.final = true;
    let role = WC.role();
    if (role === 'sus') {
      ctx.role = 'out';
      Game.toast('Cezalı olduğun için bu maçta oynayamıyorsun.', 'bad');
    } else ctx.role = role;
    ctx.subChance = 0.75;
    // önemli maçlardan önce basın toplantısı
    if (!friendly && ctx.role !== 'out' && (ko || w.md === 0)) await Press.ask(ctx, ko && w.ko.size === 2 ? 'final' : 'ko');
    const sum = await Match.run(ctx, s);
    w.boost = 0;
    const before = p.intl.caps;
    Game.applyMatch(sum, ctx, 'intl');
    if (friendly) { p.intl.caps = before; } // hazırlık maçı resmi maç sayılmaz
    // sakatlık haftaları bu modda gün olarak sayılır
    if (p.injuryWeeks > 0) { w.injDays = Math.min(4, Math.max(w.injDays, p.injuryWeeks)); p.injuryWeeks = 0; Game.news(`Maçta sakatlandın: ${w.injDays} gün sahalardan uzaksın.`, 'bad'); }
    const gf = ctx.side === 'home' ? sum.hs : sum.as, ga = ctx.side === 'home' ? sum.as : sum.hs;
    if (sum.played && !friendly) {
      const T = w.stats;
      T.apps++; T.goals += sum.goals; T.assists += sum.assists; T.rs += sum.rating; T.min += sum.minutes; if (sum.motm) T.motm++;
    }
    // gol kayıtları (oyuncunun golleri kendi adına)
    if (!friendly) {
      const meName = Player.fullName(p);
      const own = (sum.ownScorers || []).slice(), oppN = (sum.oppScorers || []).slice();
      while (own.length < gf) own.push(null);
      while (oppN.length < ga) oppN.push(null);
      WC.scorers(w.nat, gf, own.map((n) => n || null).map((n) => (n === meName ? meName : n)));
      WC.scorers(opp, ga, oppN);
    }
    // kart cezası: grupta 2 sarı ya da kırmızı = 1 maç ceza (çeyrek finalden sonra sarılar silinir)
    if (w.sus > 0 && !friendly) w.sus--;
    if (!friendly && sum.played) {
      if (sum.red) { w.sus = 1; Game.news('Kırmızı kart: bir sonraki maçta cezalısın.', 'bad'); }
      else if (sum.yellow) { w.yel++; if (w.yel >= 2) { w.sus = 1; w.yel = 0; Game.news('İkinci sarı kart: bir sonraki maçta cezalısın.', 'bad'); } }
    }
    w.log.push({ stage: friendly ? 'f' : ko ? w.ko.size : 'g', opp, gf, ga, r: sum.played ? sum.rating : null, g: sum.goals, a: sum.assists });
    if (friendly) {
      w.fi++;
      Player.addRel(p, 'coach', sum.played ? (sum.rating - 6.5) * 3 : 0);
      Game.news(`Hazırlık maçı: ${me.name} ${gf}-${ga} ${them.name}.`, gf > ga ? 'good' : gf < ga ? 'bad' : '');
    } else if (!ko) {
      // grubun bu haftası
      const fx = w.fx[w.myG][w.md];
      fx.forEach(([h, a]) => {
        if (h === w.nat || a === w.nat) w.gl.push({ g: w.myG, h, a, hs: h === w.nat ? gf : ga, as: h === w.nat ? ga : gf });
        else { const r = WC.sim(h, a, false); w.gl.push({ g: w.myG, h, a, hs: r.hs, as: r.as }); }
      });
      w.fx.forEach((gfx, g) => { if (g !== w.myG) gfx[w.md].forEach(([h, a]) => { const r = WC.sim(h, a, false); w.gl.push({ g, h, a, hs: r.hs, as: r.as }); }); });
      w.md++;
      const rk = WC.table(w.myG).findIndex((r) => r.id === w.nat) + 1;
      Game.news(`Grup maçı: ${me.name} ${gf}-${ga} ${them.name}. ${WC_GROUPS[w.myG]} Grubu'nda ${rk}. sıradayız.`, gf > ga ? 'good' : gf < ga ? 'bad' : '');
    } else {
      let won = gf > ga;
      let pensTxt = '';
      if (gf === ga) {
        const r = await WC.shootout(ctx, sum, me, them);
        won = r.won; pensTxt = ` Penaltılarda ${r.a}-${r.b}.`;
      }
      WC.koRound({ h: ctx.home.id, a: ctx.away.id, hs: sum.hs, as: sum.as, win: won ? w.nat : opp, pens: pensTxt ? true : null });
      Game.news(`${stage}: ${me.name} ${gf}-${ga} ${them.name}.${pensTxt} ${won ? (w.ko.size === 1 ? 'DÜNYA ŞAMPİYONUYUZ!' : 'Tur atladık!') : 'Turnuvaya veda ettik.'}`, won ? 'good' : 'bad');
      if (!won) { w.elim = stage; w.result = w.log[w.log.length - 1].stage; }
    }
    WC.busy = false;
    Game.save();
    if (!friendly && ko && (w.elim || w.ko.size === 1)) return WC.finish();
    WC.next();
  },
  // grup sonu: tablolar, son 32 eşleşmeleri
  groupEnd() {
    const s = Game.state, w = s.wc;
    WC.buildKO();
    const t = WC.table(w.myG);
    const pos = t.findIndex((r) => r.id === w.nat) + 1;
    const through = w.ko.alive.includes(w.nat);
    w.yel = 0;
    if (!through) { w.elim = 'Grup Aşaması'; w.result = 'g'; Game.news(`${WC.natOf(w.nat).name} grubu ${pos}. sırada bitirdi ve turnuvaya veda etti.`, 'bad'); Game.save(); return WC.finish(); }
    Game.news(`${WC.natOf(w.nat).name} grubu ${pos}. sırada bitirdi ve Son 32'ye kaldı!`, 'good');
    Game.modal(`<div class="ev-tag">Grup aşaması bitti</div><h2>Son 32'deyiz!</h2><p>${U.esc(WC.natOf(w.nat).name)} grubu ${pos}. sırada bitirdi. Rakibimiz: ${U.esc(WC.natOf(WC.nextOpp()).name)}.</p><p class="muted">Bundan sonra kaybeden evine döner. Beraberlikte penaltılar!</p>`, [{ t: 'Devam', cls: 'btn-big', fn: () => WC.next() }]);
  },
  // eleme turu: oyuncunun maçı + diğer eşleşmeler
  koRound(mine) {
    const w = Game.state.wc, K = w.ko;
    const next = [];
    for (let i = 0; i < K.alive.length; i += 2) {
      const h = K.alive[i], a = K.alive[i + 1];
      const r = (h === mine.h && a === mine.a) || (h === mine.a && a === mine.h) ? mine : WC.sim(h, a, true);
      K.log.push({ size: K.size, h: r.h, a: r.a, hs: r.hs, as: r.as, w: r.win, pens: !!r.pens });
      next.push(r.win);
    }
    K.alive = next;
    K.size = next.length;
  },
  // turnuva oyuncu elendikten sonra kalan turlar hızlıca oynanır
  simRest() {
    const w = Game.state.wc;
    if (!w.ko) return;
    while (w.ko.alive.length > 1) WC.koRound({});
  },

  // ---------- Penaltı atışları ----------
  async shootout(ctx, sum, me, them) {
    const s = Game.state, p = s.player;
    const meT = me.name, thT = them.name;
    const myP = 0.76 + (me.rating - them.rating) / 200, opP = 0.76 + (them.rating - me.rating) / 200;
    const takers = me.roster.filter((x) => x.pos !== 'GK').slice(0, 6).map((x) => x.n);
    const meOn = sum.played && sum.minutes >= 1 && !sum.red;
    const mineIdx = meOn ? 2 : -1;
    const A = [], B = [];
    const draw = (msg) => `<div class="ev-tag">Penaltı atışları</div><h3>${U.esc(meT)} <b>${A.filter(Boolean).length}</b> - <b>${B.filter(Boolean).length}</b> ${U.esc(thT)}</h3>
      <div class="pso"><div><small>${U.esc(meT)}</small>${A.map((x) => `<i class="${x ? 'g' : 'm'}"></i>`).join('')}</div><div><small>${U.esc(thT)}</small>${B.map((x) => `<i class="${x ? 'g' : 'm'}"></i>`).join('')}</div></div><p>${msg}</p>`;
    const show = (msg) => new Promise((res) => Game.modal(draw(msg), [{ t: 'Devam', cls: 'btn-big', fn: res }]));
    await show(meOn ? 'Maç berabere bitti. Hoca seni 3. penaltıcı olarak seçti!' : 'Maç berabere bitti. Penaltılar başlıyor...');
    let k = 0;
    const decided = () => {
      const a = A.filter(Boolean).length, b = B.filter(Boolean).length;
      if (A.length <= 5 && B.length <= 5) {
        const leftA = 5 - A.length, leftB = 5 - B.length;
        return a + leftA < b || b + leftB < a;
      }
      return A.length === B.length && a !== b;
    };
    while (!decided() && k < 14) {
      // bizim atış
      let goal;
      if (k === mineIdx) goal = await WC.myPenalty();
      else goal = U.chance(myP);
      A.push(goal);
      if (k !== mineIdx) await show(`${U.esc(takers[k % takers.length] || 'Takım arkadaşın')}: ${goal ? 'GOL!' : 'Kaçtı!'}`);
      else await show(goal ? 'Sen attın: GOL! Soğukkanlılığın konuşuluyor.' : 'Senin penaltın kaçtı...');
      if (decided()) break;
      const g2 = U.chance(opP);
      B.push(g2);
      await show(`${U.esc(them.roster[k % them.roster.length].n)}: ${g2 ? 'gol.' : 'KAÇTI!'}`);
      k++;
    }
    const a = A.filter(Boolean).length, b = B.filter(Boolean).length;
    if (k > mineIdx && mineIdx >= 0) {
      const goal = A[mineIdx];
      p.gt = p.gt || {};
      if (goal) { Player.addFame(p, 1); Player.addRel(p, 'fans', 4); }
    }
    return { won: a > b, a, b };
  },
  myPenalty() {
    return new Promise((res) => {
      const el = document.createElement('div');
      el.className = 'mt-moment drill';
      el.innerHTML = `<div class="mm-head"><div class="mm-min dr-tag">PENALTI</div><div class="mm-tt"><div class="mm-title">Senin penaltın</div><div class="mm-desc">Herkes sana bakıyor. Geriye çek, köşeyi seç ve bırak!</div></div></div><div class="dr-host"></div>`;
      document.body.appendChild(el);
      const s = Game.state, p = s.player;
      const st = Player.effStats(p);
      const kits = Sprites.kits(WC.team(s.wc.nat), { id: 'GKX', c1: '#2bb673', c2: '#111111' });
      const scene = Scenes.make('penalty', { skill: 0.34, mates: [], position: p.position, pace: st.pace, narrow: window.innerWidth / window.innerHeight < 0.9 });
      MiniGame.play(el.querySelector('.dr-host'), scene, { stats: st, skill: 0.34, cond: 1.25 - 0.35 * (p.energy / 100), kits, number: p.shirt, mateChance: () => 0 })
        .then((r) => { el.remove(); MiniGame._abort = null; res(r.outcome === 'goal' || (r.outcome === 'auto' && U.chance(0.75))); })
        .catch(() => { el.remove(); res(U.chance(0.75)); });
    });
  },

  // ---------- Kamp sonu: kadro açıklanır ----------
  squad() {
    const s = Game.state, w = s.wc, p = s.player;
    const role = WC.role();
    w.squadRole = role;
    const ovr = Player.overall(p, true), nr = WC.natOf(w.nat).rating;
    const txt = role === 'starter'
      ? 'Hoca kamptaki performansından çok etkilendi: turnuvaya ilk 11\'de başlayacaksın!'
      : 'Kadrodasın ama şimdilik yedek kulübesinde başlayacaksın. Oyuna girdiğin her dakikayı değerlendir, hocanın fikrini değiştir!';
    Game.news(`${WC.natOf(w.nat).name} Dünya Kupası kadrosunu açıkladı: ${Player.fullName(p)} 26 kişilik kadroda!`, 'good');
    Social.post('daily', `Dünya Kupası kadrosundayım! Bu formayı giymek bir rüya.`, 2, Social.natOpts ? Social.natOpts() : undefined);
    Game.modal(`<div class="ev-tag">Kadro açıklandı</div><h2>26 kişilik kadrodasın!</h2><p>${txt}</p>
      <div class="ms-stats"><div class="mst"><i>${Icon('star')}</i><b>${ovr}</b><span>Gücün</span></div><div class="mst"><i>${Icon('shield')}</i><b>${nr}</b><span>Takım gücü</span></div><div class="mst"><i>${Icon('coach')}</i><b>${Math.round(p.rel.coach)}</b><span>Hoca güveni</span></div></div>
      <p class="muted">Grup rakiplerin:</p><div class="wc-grp">${w.groups[w.myG].filter((c) => c !== w.nat).map((c) => `<span>${UI.shirt(WC.team(c))}${U.esc(WC.natOf(c).name)}</span>`).join('')}</div>`, [{ t: 'Turnuva başlasın!', cls: 'btn-big', fn: () => WC.next() }], { wide: true });
  },

  // ---------- Turnuva sonu ----------
  finish() {
    const s = Game.state, w = s.wc, p = s.player;
    WC.simRest();
    w.phase = 'done';
    const champ = w.ko && w.ko.alive.length === 1 ? w.ko.alive[0] : null;
    const won = champ === w.nat;
    const result = won ? 'win' : w.result || 'g';
    w.result = result;
    // ödüller
    const list = Object.values(w.sc).sort((a, b) => b.g - a.g);
    const meName = Player.fullName(p);
    const myG = (w.sc[`${w.nat}|${meName}`] || { g: 0 }).g;
    const top = list[0] || { g: 0 };
    const avg = w.stats.apps ? w.stats.rs / w.stats.apps : 0;
    const aw = [];
    if (myG > 0 && myG >= top.g) aw.push(['boot', 'Altın Ayakkabı', `${myG} golle turnuvanın gol kralı oldun!`]);
    if (WC_RANK[result] >= 5 && avg >= 7.3 && w.stats.apps >= 4) aw.push(['star', 'Altın Top', 'Turnuvanın en iyi oyuncusu seçildin!']);
    if (w.stats.apps >= 3 && avg >= 6.8) aw.push(['fire', 'En İyi Genç Oyuncu', 'Turnuvanın en iyi genç oyuncusu ödülü senin!']);
    w.awards = aw.map((x) => x[1]);
    if (won) p.trophies.push(`${WC.YEAR}: Dünya Kupası Şampiyonu`);
    const h = WC.history();
    h.runs.unshift({ nat: w.nat, stage: result, g: w.stats.goals, a: w.stats.assists, avg: Math.round(avg * 10) / 10, y: Date.now() });
    h.runs = h.runs.slice(0, 20);
    if (won) h.titles = (h.titles || 0) + 1;
    h.best[w.nat] = Math.max(h.best[w.nat] || 0, WC_RANK[result]);
    Meta.set('sf_wc', h);
    Game.save();
    WC.render();
    const show = () => {
      Game.modal(`<div class="ev-tag">${WC.YEAR} Dünya Kupası</div><h2>${won ? 'DÜNYA ŞAMPİYONUSUN!' : WC.stageText(result)}</h2>
        <p>${won ? `${U.esc(WC.natOf(w.nat).name)} dünyanın zirvesinde! 18 yaşında tarih yazdın.` : `${U.esc(WC.natOf(w.nat).name)} için yolculuk ${U.esc(WC.stageText(result))} aşamasında bitti.`}</p>${won ? '' : `<p>Şampiyon: <b>${U.esc(champ ? WC.natOf(champ).name : '-')}</b></p>`}
        <div class="ms-stats"><div class="mst"><i>${Icon('shield')}</i><b>${w.stats.apps}</b><span>Maç</span></div><div class="mst"><i>${Icon('ball')}</i><b>${w.stats.goals}</b><span>Gol</span></div><div class="mst"><i>${Icon('boot')}</i><b>${w.stats.assists}</b><span>Asist</span></div><div class="mst"><i>${Icon('star')}</i><b>${avg ? avg.toFixed(1) : '-'}</b><span>Ortalama</span></div></div>
        ${aw.length ? `<div class="lbl">Ödüller</div>${aw.map(([ic, t, d]) => `<div class="wc-aw">${Icon(ic)}<span><b>${t}</b><small>${d}</small></span></div>`).join('')}` : ''}
        <p class="muted">Gol kralı: ${U.esc(top.n || '-')} (${top.g} gol)</p>`, [{ t: 'Ana menü', cls: 'btn-ghost', fn: () => WC.exit() }, { t: 'Yeni turnuva', cls: 'btn-big', fn: () => WC.setup() }], { wide: true });
    };
    if (won && typeof Celebrate !== 'undefined') Celebrate.champion('Dünya Kupası Şampiyonu', WC.natOf(w.nat).name, true).then(show);
    else show();
  },

  // ---------- Ekran ----------
  render() {
    const s = Game.state, w = s.wc, p = s.player;
    const nat = WC.natOf(w.nat);
    const me = WC.team(w.nat);
    Notifs.badge();
    const stage = w.phase === 'camp' ? 'Hazırlık Kampı' : w.phase === 'group' ? 'Grup Aşaması' : w.phase === 'ko' && w.ko ? WC_STAGES[w.ko.size] || 'Final' : 'Turnuva bitti';
    document.getElementById('hdr-info').innerHTML = `
      <span class="hi-club">${UI.shirt(me)}${U.esc(nat.name)}</span>
      <span class="hi-week"><em>${WC.YEAR}</em><em>GÜN</em><b>${w.day}</b></span>
      <span class="hi-money wc-stage"><span class="hm-t"><small>Dünya Kupası</small><b>${stage}</b></span></span>`;
    const lvl = (v) => (v < 30 ? 'low' : v < 55 ? 'mid' : 'ok');
    document.getElementById('status').innerHTML = `
      <div class="st-cell st-${lvl(p.energy)}">${Icon('bolt')}<div><span>Enerji</span>${UI.bar(p.energy, 'c-energy')}</div><b>${Math.round(p.energy)}</b></div>
      <div class="st-cell st-${lvl(p.morale)}">${Icon('smile')}<div><span>Moral</span>${UI.bar(p.morale, 'c-morale')}</div><b>${Math.round(p.morale)}</b></div>
      <div class="st-cell st-${lvl(p.rel.coach)}">${Icon('coach')}<div><span>Hoca güveni</span>${UI.bar(p.rel.coach)}</div><b>${Math.round(p.rel.coach)}</b></div>
`;
    document.getElementById('side').innerHTML = WC.side();
    const main = document.getElementById('main');
    const v = UI.wcView || 'day';
    const nav = UI.viewNav('wcView', [['day', 'home', 'Bugün'], ['group', 'table', 'Gruplar'], ['ko', 'star', 'Eleme'], ['kings', 'ball', 'Krallık'], ['news', 'news', 'Haberler']]);
    main.innerHTML = nav + (v === 'group' ? WC.groupsView() : v === 'ko' ? WC.koView() : v === 'kings' ? WC.kingsView() : v === 'news' ? WC.newsView() : WC.dayView());
    UI.strip(main);
    UI.strip(document.getElementById('side'));
    WC.bind(main);
    WC.bind(document.getElementById('side'));
  },
  side() {
    const s = Game.state, w = s.wc, p = s.player, T = w.stats;
    const ovr = Player.overall(p, true);
    const role = w.phase === 'done' ? null : WC.role();
    const roleTxt = { starter: 'İlk 11 adayı', bench: 'Yedek', out: 'Sakat', sus: 'Cezalı' }[role] || '';
    const keys = Object.entries(POSITIONS[p.position].w).sort((a, b) => b[1] - a[1]).map(([k]) => k).slice(0, 5);
    return `<section class="card wc-me">
      <div class="wc-me-h">${UI.shirt(WC.team(w.nat), 'big')}<div><b>${U.esc(Player.fullName(p))}</b><small>${POSITIONS[p.position].l} · 18 yaş · ${p.shirt} numara</small></div><span class="wc-ovr">${ovr}</span></div>
      ${roleTxt ? `<div class="wc-role ${role}">${roleTxt}</div>` : ''}
      <div class="wc-st">${keys.map((k) => `<div><span>${STATS.find((x) => x.k === k).l}</span>${UI.bar(p.stats[k])}<b>${p.stats[k]}</b></div>`).join('')}</div>
      <div class="ms-stats"><div class="mst"><b>${T.apps}</b><span>Maç</span></div><div class="mst"><b>${T.goals}</b><span>Gol</span></div><div class="mst"><b>${T.assists}</b><span>Asist</span></div><div class="mst"><b>${T.apps ? (T.rs / T.apps).toFixed(1) : '-'}</b><span>Ort.</span></div></div>
      <button class="btn btn-ghost" data-wc="menu">${Icon('exit')} Ana menü</button>
    </section>`;
  },
  dayView() {
    const s = Game.state, w = s.wc, p = s.player;
    const cur = WC.cur();
    const opp = WC.nextOpp();
    let top = '';
    if (w.phase === 'done') {
      const champ = w.ko && w.ko.alive.length === 1 ? w.ko.alive[0] : null;
      top = `<section class="card wc-next"><div class="card-h"><span>${Icon('star')} Turnuva bitti</span></div>
        <h3>${w.result === 'win' ? 'DÜNYA ŞAMPİYONUSUN!' : U.esc(WC.stageText(w.result))}</h3>
        <p>Şampiyon: <b>${U.esc(champ ? WC.natOf(champ).name : '-')}</b></p>${(w.awards || []).length ? `<p>Ödüller: <b>${w.awards.map(U.esc).join(', ')}</b></p>` : ''}
        <div class="wc-btns"><button class="btn btn-big" data-wc="new">${Icon('play')} Yeni turnuva</button><button class="btn btn-ghost" data-wc="menu">Ana menü</button></div></section>`;
    } else if (cur === 'match' || cur === 'friendly') {
      const role = WC.role();
      const them = WC.natOf(opp);
      const stage = cur === 'friendly' ? `Hazırlık maçı ${w.fi + 1}/2` : w.phase === 'ko' ? WC_STAGES[w.ko.size] : `${WC_GROUPS[w.myG]} Grubu · ${w.md + 1}. Maç`;
      top = `<section class="card wc-next"><div class="card-h"><span>${Icon('whistle')} Maç günü</span><small class="muted">${stage}</small></div>
        <div class="wc-vs">${UI.shirt(WC.team(w.nat), 'big')}<b>${U.esc(WC.natOf(w.nat).name)}</b><em>vs</em><b>${U.esc(them.name)}</b>${UI.shirt(WC.team(opp), 'big')}</div>
        <p class="muted">Rakip gücü ${them.rating} · Yıldızları: ${U.esc(WC.team(opp).roster.slice(0, 2).map((x) => x.n).join(', '))}</p>
        <div class="wc-role ${role}">${{ starter: 'Hoca seni ilk 11\'de düşünüyor.', bench: 'Yedek kulübesindesin: oyuna girersen fırsatı kaçırma!', out: 'Sakatsın, bu maçı tribünden izleyeceksin.', sus: 'Cezalısın, bu maçta oynayamazsın.' }[role]}</div>
        <button class="btn btn-big" data-wc="play">${Icon('play')} Maça çık</button></section>`;
    } else if (cur === 'squad') {
      top = `<section class="card wc-next"><div class="card-h"><span>${Icon('squad')} Kamp bitti</span></div><p>Hoca bugün Dünya Kupası kadrosunu açıklayacak. Kampta yaptıkların karşılığını bulacak mı?</p><button class="btn btn-big" data-wc="squad">Kadroyu öğren</button></section>`;
    } else if (cur === 'gend') {
      top = `<section class="card wc-next"><div class="card-h"><span>${Icon('table')} Grup aşaması bitti</span></div><p>Tüm gruplarda son maçlar oynandı. Son 32'ye kalan takımlar belli oluyor...</p><button class="btn btn-big" data-wc="gend">Sonuçları gör</button></section>`;
    } else {
      const acts = WC_ACTS.filter((a) => a.id !== 'physio' || w.injDays > 0 || p.energy < 60);
      top = `<section class="card wc-next"><div class="card-h"><span>${Icon('career')} ${w.phase === 'camp' ? 'Kamp günü' : 'Turnuva günü'} ${w.day}</span><small class="muted">Kalan hak: <b>${w.ap}/2</b></small></div>
        ${opp ? `<p class="muted">Sıradaki maç: <b>${U.esc(WC.natOf(opp).name)}</b>${w.phase === 'camp' ? ' (hazırlık maçı)' : ''}</p>` : ''}
        ${w.injDays ? `<div class="wc-role out">Sakatsın: ${w.injDays} gün</div>` : ''}${w.sus ? '<div class="wc-role sus">Bir sonraki maçta cezalısın</div>' : ''}
        <div class="wc-acts">${acts.map((a) => `<button type="button" class="wc-act" data-wca="${a.id}" ${w.ap <= 0 ? 'disabled' : ''}><i>${Icon(a.ic)}</i><span><b>${a.t}</b><small>${a.d}</small></span><em class="${a.en >= 0 ? 'up' : 'down'}">${a.en >= 0 ? '+' : ''}${a.en}</em></button>`).join('')}</div>
        <button class="btn ${w.ap <= 0 ? 'btn-big' : 'btn-ghost'}" data-wc="next">${w.ap > 0 ? 'Günü bitir' : 'Sonraki gün'} ›</button></section>`;
    }
    const tbl = w.phase !== 'camp' ? `<section class="card"><div class="card-h"><span>${Icon('table')} ${WC_GROUPS[w.myG]} Grubu</span></div>${WC.tableHtml(w.myG)}</section>` : `<section class="card"><div class="card-h"><span>${Icon('table')} ${WC_GROUPS[w.myG]} Grubu</span><small class="muted">kura çekildi</small></div><div class="wc-grp">${w.groups[w.myG].map((c) => `<span class="${c === w.nat ? 'me' : ''}">${UI.shirt(WC.team(c))}${U.esc(WC.natOf(c).name)} <small>${WC.natOf(c).rating}</small></span>`).join('')}</div></section>`;
    const news = (s.news || []).slice(0, 4);
    return top + `<div class="wc-side-m">${WC.side()}</div>` + tbl + (news.length ? `<section class="card"><div class="card-h"><span>${Icon('news')} Son haberler</span></div><div class="wc-news">${news.map((n) => `<p class="${n.type || ''}">${n.t}</p>`).join('')}</div></section>` : '');
  },
  tableHtml(g) {
    const w = Game.state.wc;
    const t = WC.table(g);
    return `<table class="tbl wc-tbl"><tr><th>#</th><th class="l">Takım</th><th>O</th><th>G</th><th>B</th><th>M</th><th>AV</th><th>P</th></tr>${t.map((r, i) => `<tr class="${r.id === w.nat ? 'hl' : ''} ${i < 2 ? 'z-r16' : i === 2 ? 'z-po' : ''}"><td>${i + 1}</td><td class="l"><span class="tm">${UI.shirt(WC.team(r.id))}${U.esc(WC.natOf(r.id).name)}</span></td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gf - r.ga > 0 ? '+' : ''}${r.gf - r.ga}</td><td><b>${r.pts}</b></td></tr>`).join('')}</table>`;
  },
  groupsView() {
    const w = Game.state.wc;
    return `<section class="card"><div class="card-h"><span>${Icon('table')} Gruplar</span><small class="muted">İlk 2 ve en iyi 8 üçüncü Son 32'ye kalır</small></div>
      <div class="wc-groups">${WC_GROUPS.split('').map((L, g) => `<div class="wc-g ${g === w.myG ? 'mine' : ''}"><div class="lbl">${L} Grubu</div>${WC.tableHtml(g)}</div>`).join('')}</div></section>`;
  },
  koView() {
    const w = Game.state.wc;
    if (!w.ko) return `<section class="card"><p class="muted">Eleme turları grup aşamasından sonra başlar. Son 32'ye 12 grup birincisi, 12 grup ikincisi ve en iyi 8 üçüncü kalır.</p></section>`;
    const nm = (c) => U.esc(WC.natOf(c).name);
    const row = (m) => `<div class="cm2 ${m.h === w.nat || m.a === w.nat ? 'me' : ''}"><span class="t h ${m.w === m.h ? 'w' : ''}"><em>${nm(m.h)}</em>${UI.shirt(WC.team(m.h))}</span><b>${m.hs}-${m.as}${m.pens ? '<small>p</small>' : ''}</b><span class="t a ${m.w === m.a ? 'w' : ''}">${UI.shirt(WC.team(m.a))}<em>${nm(m.a)}</em></span></div>`;
    let html = '';
    [32, 16, 8, 4, 2].forEach((sz) => {
      const ms = w.ko.log.filter((m) => m.size === sz);
      if (ms.length) html += `<div class="lbl">${WC_STAGES[sz]}</div><div class="cup-ko">${ms.map(row).join('')}</div>`;
    });
    if (w.ko.alive.length > 1) html += `<div class="lbl">${WC_STAGES[w.ko.size]} · eşleşmeler</div><div class="cup-ko">${Array.from({ length: w.ko.alive.length / 2 }, (_, i) => { const h = w.ko.alive[i * 2], a = w.ko.alive[i * 2 + 1]; return `<div class="cm2 next ${h === w.nat || a === w.nat ? 'me' : ''}"><span class="t h"><em>${nm(h)}</em>${UI.shirt(WC.team(h))}</span><b>vs</b><span class="t a">${UI.shirt(WC.team(a))}<em>${nm(a)}</em></span></div>`; }).join('')}</div>`;
    else html += `<div class="scn-goal">${Icon('star')} Şampiyon: <b>${nm(w.ko.alive[0])}</b></div>`;
    return `<section class="card cupscr">${html}</section>`;
  },
  kingsView() {
    const s = Game.state, w = s.wc;
    const meName = Player.fullName(s.player);
    const list = Object.values(w.sc).sort((a, b) => b.g - a.g).slice(0, 15);
    return `<section class="card"><div class="card-h"><span>${Icon('ball')} Gol Krallığı</span></div>${list.length ? `<table class="tbl"><tr><th>#</th><th class="l">Oyuncu</th><th class="l">Takım</th><th>Gol</th></tr>${list.map((x, i) => `<tr class="${x.n === meName && x.t === w.nat ? 'hl' : ''}"><td>${i + 1}</td><td class="l">${U.esc(x.n)}</td><td class="l">${U.esc(WC.natOf(x.t).name)}</td><td><b>${x.g}</b></td></tr>`).join('')}</table>` : '<p class="muted">Turnuvada henüz gol atılmadı.</p>'}</section>`;
  },
  newsView() {
    const s = Game.state;
    return `<section class="card"><div class="card-h"><span>${Icon('news')} Haberler</span></div><div class="wc-news">${(s.news || []).slice(0, 30).map((n) => `<p class="${n.type || ''}">${n.t}</p>`).join('') || '<p class="muted">Henüz haber yok.</p>'}</div></section>`;
  },
  bind(root) {
    U.$$('[data-vnav]', root).forEach((b) => (b.onclick = () => { const [k, v] = b.dataset.vnav.split(':'); UI[k] = v; WC.render(); }));
    U.$$('[data-wca]', root).forEach((b) => (b.onclick = () => WC.act(b.dataset.wca)));
    U.$$('[data-wc]', root).forEach((b) => (b.onclick = () => {
      const k = b.dataset.wc;
      if (k === 'play') WC.play();
      if (k === 'next') { if (Game.state.wc.ap > 0) Game.modal('<h3>Günü bitirmek istiyor musun?</h3><p>Kullanmadığın aksiyon hakların boşa gidecek.</p>', [{ t: 'Vazgeç', cls: 'btn-ghost' }, { t: 'Günü bitir', fn: () => WC.next() }]); else WC.next(); }
      if (k === 'squad') WC.squad();
      if (k === 'gend') WC.groupEnd();
      if (k === 'menu') { if (Game.state.wc.phase === 'done') WC.exit(); else WC.askExit(); }
      if (k === 'new') WC.setup();
    }));
  },
};

// ek takımların forma renkleri ve isim havuzları
WC_NATIONS.forEach((n) => { if (!NAT_COLORS[n.code]) NAT_COLORS[n.code] = n.c; });
Object.keys(WC_POOLS).forEach((k) => { if (!NAME_POOLS[k]) NAME_POOLS[k] = WC_POOLS[k]; });
