# ⭐ StarFoot

New Star Soccer'dan esinlenen, tarayıcıda çalışan bir futbol kariyer oyunu. 8 yaşında bir kulübün altyapısına katılıyor, statlarını geliştiriyor ve maçlarda kritik anları kendin oynuyorsun.

> Tüm kulüp ve oyuncu isimleri kurgusaldır. Lisans gerektirmemesi için gerçek isimlere benzeyen isimler kullanıldı (ör. *Lionel Mezzi*, *Kylian Mbappo*, *Arda Güner*, *Galata Aslanları*, *Real Madrigal*).

## Nasıl oynanır?

Kurulum gerekmez. `index.html` dosyasını tarayıcıda açman yeterli.

İstersen yerel bir sunucuyla da açabilirsin:

```bash
python3 -m http.server 8000
# http://localhost:8000
```

Oyun otomatik olarak tarayıcının `localStorage` alanına kaydedilir.

### Telefona uygulama olarak kurma (PWA)

Oyunu bir web sunucusundan (ör. GitHub Pages) açıp tarayıcı menüsünden **Ana ekrana ekle** dersen tam ekran bir uygulama gibi çalışır ve internet olmadan da açılır. Çift dokunma ve kıstırma ile yakınlaşma kapalıdır.

## Dil / Language

Oyun **Türkçe** ve **İngilizce** oynanır. İlk açılışta telefonun diline göre seçilir; başlık ekranındaki **TR / EN** düğmesinden ya da *Profil › Kariyer › Oyun* kartındaki **Dil / Language** seçiminden değiştirilir. Kodda metinler Türkçe yazılır; İngilizce seçiliyse `js/i18n.js` ekrana çıkan metni (sayfa, canvas çizimleri, başlıklar) `js/lang-en.js` sözlüğüyle çevirir. Kayıtlar dilden bağımsızdır. Sözlüğü güncellemek için: `tools/i18n/README.md`.

## Google Play

Oyun Google Play'e TWA (Trusted Web Activity) olarak çıkacak şekilde hazırlandı: manifest, maskable ikonlar, gizlilik politikası (`privacy.html`), `.well-known/assetlinks.json`, mağaza görselleri ve metinleri (`store/`). Adım adım yapılacaklar: **[GOOGLE_PLAY.md](GOOGLE_PLAY.md)**.

## Özellikler

- **5 kariyer slotu:** Aynı anda 5 farklı kariyer; istediğini silebilirsin.
- **Başlangıç yılı ve yaşı:** 1980'den 2026'ya kadar istediğin yılda, 8-18 yaş arasında başlarsın. Kulübünü sen seçmezsin: 8-12 yaşında ilk maçın bir **mahalle maçı**, 13 yaş ve üstünde **altyapı seçmeleri** (mevkine göre 3 istasyon) olur; performansına göre scoutlar teklif getirir. Oluşturma ekranındaki statlar seçtiğin yaşa göre gösterilir.
- **Dönem yıldızları:** Milli takımlar ve Türkiye ligi de döneme göre değişir (ör. 1980'lerde Tanju Çolakoğulları, 1990'larda Hakan Şükürlü). Hırvatistan gibi ülkeler kuruldukları yıldan sonra çıkar.
- **Dönem yıldızları (dünya):** Seçtiğin yılın kurgusal yıldızları sahadadır (1980'ler: Maradoni, Platinni, van Bastın... 2000'ler: Ronaldinyo, Anri... bugün: Mbappo, Halland, Yamel...). Oyuncular yaşlanır, emekli olur, gençler sırası gelince profesyonel olur; liste bittikten sonra yeni nesil yıldızlar üretilir. Emeklilikler, yeni yıldızlar ve büyük transferler haberlerde ve sosyal medya gündeminde çıkar.
- **Kariyer:** U10, U12, U14, U16 ve U19 takımlarında oynarsın. 17-18 yaşında profesyonel sözleşme imzalar, 33 yaşından sonra istediğin zaman emekli olabilirsin.
- **20 takımlı ligler:** Tüm ligler 20 takım, 38 hafta.
- **Avrupa Gelişim Ligi (U19):** U19 takımındayken kulübün Avrupa'nın en güçlü altyapılarıyla 16 takımlı eleme turnuvasında yarışır; maçları sen oynarsın.
- **Ülke kupaları:** Her ülkenin kendi kupası var (Türkiye Kupası 32 takım, İngiltere Kupası, Kral Kupası, Almanya, İtalya ve Fransa kupaları 16 takım). Tek maç eleme, Avrupa kupalarıyla çakışmayan takvim.
- **Avrupa kupaları (güncel format):** Şampiyonlar ve Federasyon kupaları 32 takımlı lig aşamasıyla başlar (8 maç, tek puan tablosu). İlk 8 doğrudan son 16'ya kalır, 9-24 arası play-off oynar, 25-32 elenir. Konferans Kupası 16 takımlı eleme. Lig ekranındaki **Kupalar** sekmesinde kupa seçip puan durumu, maçların, eleme turları ve kupa gol/asist krallığı takip edilir.
- **Milli takım sıralaması:** Milli maçlar ve turnuvalarla değişen puanlı dünya sıralaması (yükselen/düşen oklarıyla). Dünya Kupası, Avrupa Şampiyonası ve tek yıllarda sıralamadaki en iyi 4 Avrupa takımının oynadığı Uluslar Ligi finalleri.
- **Gol ve asist krallığı:** Lig ve kupalarda sekmeli gol/asist krallığı, lider kartı ve çubuk grafikli sıralama.
- **Dünya Kupası ve Avrupa Şampiyonası:** Gerçek takvimle (Dünya Kupası 1986, 1990... 2026, 2030; Avrupa Şampiyonası 1984, 1988... 2024, 2028) sezon sonunda oynanır. Milli takıma çağrılırsan maçlarına çıkarsın.
- **9 stat:** Hız, Şut, Pas, Top Sürme, Teknik, Kafa, Savunma, Güç, Dayanıklılık. Mevkine göre (Forvet / Orta Saha / Defans) genel gücün hesaplanır.
- **Haftalık aksiyonlar (haftada 3 hak):** antrenman, yoğun antrenman, özel hoca, dinlenme, takım arkadaşlarıyla vakit geçirme, hocayla konuşma, taraftarlarla etkileşim.
- **Maçlar:** Maç dakika dakika simüle edilir. Kritik anlarda oyun durur ve sen oynarsın:
  - **Şut (sapan gibi):** Parmağını (ya da fareyi) ekranda bir yere koy ve topun gitmesini istediğin yönün **tersine geri çek**, sonra bırak. Ne kadar geri çekersen vuruş o kadar sert olur. Geri çekerken yolu **kavisli** çizersen top falso alır. Parmağın topun arkasında kaldığı için topun izleyeceği yol ve hedef halkası net görünür; Teknik statın yükseldikçe önizleme uzar.
  - **Pas:** Takım arkadaşına **dokun**; top isabetli bir pasla ona gider (isabet Pas statına bağlı). **Aşırtma** seçiliyse pas yüksek bir yayla savunmanın üstünden geçer.
  - **Ofsayt:** Sahada ofsayt çizgisi gösterilir. Son savunmacının gerisindeki arkadaşına pas verirsen yan hakem bayrağı kaldırır.
  - **Kaleci:** Şutlara doğru havalanarak uçar, iki eliyle topa uzanır ve yere iner.
  - **Çalım:** Rakip üstüne koşar ve bir tarafa hamle yapar; tam o anda ekranın sol/sağına dokunarak ya da kaydırarak topu ters tarafa çekersin. Erken davranırsan rakip okur.
  - **Kafa vuruşu:** Kornerden gelen topa doğru anda yükselirsin; kale ağzında gidip gelen nişangah neredeyse oraya vurursun. Kötü zamanlamada savunmacı önce davranır.
  - **Frikik:** Uzak frikiklerde vuruş daha güçlü, falso daha fazla; mesafe ekranda yazar.
  - **Vuruş tipi:** Yerden, Yarım Yükseklik veya Aşırtma (klavyede 1 / 2 / 3).
  - Gole yaklaşan şutlarda ağır çekim, gollerde konfeti efekti var.
  - **Zamanlama anları (çalım, top kapma, kafa vuruşu):** Küçülen halka yeşil bölgeye girdiğinde ekranın herhangi bir yerine dokun ya da Boşluk tuşuna bas. İlgili statın yüksekse yeşil bölge genişler.
  - Her an **Otomatik** çözülebilir ya da maçın tamamı simüle edilebilir.
  - Pozisyon geldiğinde saha **tam ekran** açılır; kamera ekran oranına göre topa ve kaleye yakınlaşır. Oyuncular kulüplerinin formalarıyla (çizgili, yarım, düz…) görünür ve koşma/vuruş animasyonları vardır.
  - **Zorluk seviyeyle artar:** U10'da kaleci yavaş, savunma az ve nişan yardımı güçlüdür; U12 → U19 → Anadolu Ligi → Yıldızlar Ligi → Avrupa ligleri → Milli takım sırasıyla kaleci, savunma ve isabet zorlaşır.
- **Reyting, maçın adamı, gol/asist istatistikleri** ve sezon sonu ödülleri (şampiyonluk, gol krallığı, sezonun oyuncusu, Altın Top...).
- **İlişkiler:** Hoca (ilk 11 şansı), takım arkadaşları ve taraftarlar.
- **Enerji, moral, ün ve sakatlıklar.**
- **Rastgele olaylar:** parti daveti, röportaj, sınav haftası, sponsorluk teklifleri...
- **Transferler:** altyapılar arası transfer, profesyonel sözleşme, ara transfer dönemi ve sezon sonu teklifleri.
- **22 lig ve 420 kulüp:** Türkiye, İngiltere, İspanya, Almanya, İtalya ve Fransa'da birer üst ve alt lig (her sezon 3 takım düşer, 3 takım çıkar); ayrıca Hollanda, Portekiz, Belçika, İskoçya, Brezilya, Arjantin, ABD, Meksika, Suudi Arabistan ve Japonya ligleri. Suudi ve ABD kulüpleri daha yüksek maaş öder. Kuzey Amerika Kupası (ABD, Meksika) ve Asya Şampiyonlar Kupası (Suudi Arabistan, Japonya) eklendi; her ülkenin kendi kupası var.
- **Avrupa'ya katılım:** Lig sırası gelecek sezonun kupasını belirler (ör. İngiltere'de 1-3 Şampiyonlar, 4-5 Federasyon, 6-7 Konferans Kupası). Puan tablosunda bölgeler renkli gösterilir. Brezilya ve Arjantin kulüpleri Güney Amerika Kupası'nda yarışır.
- **Sezon sonu ödül töreni:** Lig sıran madalyayla, kazandığın kupa ve ödüller tek tek ekranda belirir; Avrupa bileti ve sıralama primi gösterilir.
- **Transfer dönemleri:** Yaz (sezonun ilk haftaları) ve kış (devre arası) transfer dönemlerinde formuna göre 2-4 kulüp teklif yapar, dönem boyunca yeni teklifler gelebilir; dönem kapanınca teklifler geçersiz olur. Sezon sonunda da birden çok kulüpten teklif gelir.
- **Transfer teklifleri:** Kulüp gücü ile senin gücünü karşılaştıran, maaş değişimi, süre, bonservis bedeli (sözleşmesi bitende serbest, altyapıdan çıkarken yetiştirme bedeli), beklenen rol ve kulübün Avrupa durumunu gösteren kartlar. Kariyer ekranında piyasa değerin, rekor bonservisin ve sezon kartlarında transferlerin görünür.
- **Kariyer geçmişi:** Devam eden sezon canlı satır olarak görünür; her sezonun yanında o sezon kazandığın kupa ve ödüller yazar.
- **Milli takım:** Yeterince iyiysen milli maçlara çağrılırsın.
- **Mağaza:** Kramponlar 30-40 maç dayanır, aynı anda tek krampon (en iyisi) giyilir; eskiyince yenisini almak gerekir. Görselli ürün kartları ve açılıp kapanan kategoriler (kramponlar, ekipman, beslenme, hobi, ulaşım, stil ve lüks, tek kullanımlık). Yaşa göre değişen reyonlar (çocukken futbolcu kartı albümü, idolünün forması, bahçe kalesi; gençken spor salonu, scooter; profesyonelken lüks saat, araba, villa, yat). Enerji içeceği, masaj, fizyoterapi, yaz kampı ve yıldız futbolcu kliniği gibi tek kullanımlık ürünler.
- **Kupa vitrini ve madalyalar:** Kazandığın kupalar raflarda sergilenir; ilk gol, hat-trick, 100 maç, milli forma, ilk milyon gibi 17 madalya.
- **Hediye paketi:** Arada bir hediye paketi çıkar. Kısa bir reklam izlersen ödül x2 ya da x3 olur, izlemezsen x1 alırsın. (Şimdilik temsili reklam gösterilir; gerçek bir reklam sağlayıcısı `window.StarfootAds` ile bağlanabilir.)
- **Hava durumu:** Her maçın havası var (açık, yağmurlu, karlı, sisli, rüzgarlı). Yağmurda top kayar, karda çabuk durur (turuncu kış topu), rüzgarda havadaki top sürüklenir, siste vuruş önizlemesi kısalır.
- **Toplar:** Her ligin ve turnuvanın kendi top tasarımı var (eski yıllarda klasik/deri top). Mağazadan neon, ateş, buz, galaksi, altın gibi kozmetik toplar alıp maçta ve antrenmanda kullanabilirsin.
- **Maç sonrası rapor:** Hoca, takım ve taraftar ilişkin; reytinge, gol, asist, kilit pas, top kapma, kart ve sonuca göre değişir. Ana sayfadaki rapor kartında hoca/takım/taraftar/takipçi/ün/moral değişimini ve nedenlerini görürsün.
- **Canlı enerji:** Enerji maç boyunca dakika dakika düşer; yorgunluk vuruş isabetini etkiler. Maç sonunda başlangıç ve bitiş enerjisi gösterilir.
- **Maç ekranı:** Premium oyuncu paneli (numara, reyting, gol/asist/şut, enerji çubuğu) ve pozisyon gelince lige özel TV skorbordu.
- **Forma numarası:** Kadro sekmesinden sezonda bir kez numara talep edebilirsin; hoca performansına, ilişkine ve numaranın sahibine göre onaylar ya da reddeder.
- **Kaptanlık:** Kadro sekmesinde kaptanlık hedefleri (maç sayısı, yaş, hoca ve takım ilişkisi, genel güç, reyting) görünür. Hepsini tamamlayınca kaptan olursun; kaptanken maçta arkadaşını basılı tutup sürükleyerek yerleştirebilirsin.
- **Maçın oyuncusu:** Seçildiğinde defne yapraklı, konfetili, formalı premium bir ödül ekranı açılır; yıldız kupaların Kariyer sekmesindeki vitrinde sergilenir.
- **105 başarım:** Gol, asist, maç, özel goller, kupalar, milli takım, kariyer, yetenek, ün ve yaşam kategorilerinde.
- **Gerçekçi sürprizler:** Altyapıdayken A takımın yıldızları (dönemin gerçek oyuncularından esinlenen isimler) antrenmanını izlemeye gelir ve sana mevkisine göre bir şey öğretir; kulübün emekli efsaneleri tesisleri ziyaret eder, A takım hocası seni profesyonellerle antrenmana çağırır. Profesyonelken kaptanla ekstra çalışma, tecrübeli oyuncudan tavsiye, fizyoterapist programı gibi olaylar olur. Çok iyi maçlardan sonra başkandan prim ya da A takım antrenmanı daveti gelir.
- **Antrenman mini oyunları:** Antrenman, yoğun antrenman ve özel hocada odak statına göre bir çalışma oynanır: Şut → bitiricilik (3 şut), Teknik → top sektirme, Pas → verkaç istasyonu, Top Sürme → çalım (rakibin hamlesine göre topu ters tarafa çek), Kafa → korner kafa vuruşu (zamanlama + nişangah), Savunma → ikili mücadele, Güç → omuz omuza (basılı tut, yeşil bantta bırak), Hız → sürat koşusu, Dayanıklılık → tempo koşusu (hız ibresini yeşil bantta tut). İyi oynarsan gelişim ×1,5'e kadar çıkar; atlayabilir ya da tamamen kapatabilirsin.
- **Zorluk:** Kolay, Orta ve Zor. Kariyer sekmesinden sonradan da değiştirilebilir.
- **Devre arası:** Hocayla taktik konuşmak, takımı ateşlemek, toparlanmak ya da rakip kaleciyi incelemek; yedekteysen ısınıp hocaya görünmek.
- **Yeni mini oyunlar:** Kontra atak sprinti (hızlı hızlı dokun) ve verkaç (parlayan arkadaşına süre dolmadan dokun).
- **Asist animasyonu:** Pas arkadaşına ulaşınca arkadaşın topu kontrol edip şut çeker; gol olursa ASİST yazar.
- **Anne-baba memleketi:** Kariyer başında baba ve anne memleketini seçersin. Farklıysa iki milli takımdan da davet alabilirsin; bir ülkeyi seçince karar kalıcıdır.
- **Yaşam sekmesi:** Ailenle vakit geçir, biriyle tanış, sevgilinle buluş, ilişki güçlenince evlilik teklif et (ayrılık da olabilir). Aile ve ilişki moralini etkiler; doğum günü, tatil, kıskançlık gibi olaylar çıkar.
- **18 yaş üstü:** Gece hayatı (moral artar, enerji düşer, paparazzi riski), kumarhanede blackjack, rulet ve at yarışı. Maçlara bahis oynanabilir ama yasaktır: her bahis FIFA'nın dikkatini çeker, kendi maçına oynamak çok risklidir; yakalanırsan soruşturma, uzun süreli men, para cezası ve sponsor kaybı.
- **Menajer ve sponsorluk:** 16 yaşından sonra menajer tutabilirsin (gelirinden pay alır; daha çok teklif, daha yüksek maaş, daha iyi sponsor bulur). Markalar ününe göre sponsorluk teklif eder; haftalık gelir ve sosyal medyada reklam paylaşımları.
- **Sekmeler:** Merkez, Lig (Dünya dahil), Kadro, Yaşam (Mağaza dahil) ve profil fotoğraflı Profil (Kariyer dahil).
- **Gazete:** Dünya yıldızlarından manşet ve fotoğraf, kısa kısa hafta sonuçları, zirve tablosu ve gol kralı; prim gibi kişisel bildirimler gazeteden ayrı bir kutuda.
- **Gol sevinçleri:** Kendi golünden sonra seçtiğin sevinç canlandırılır: kollar havada, diz kayması, uçak, kalp, köşe dansı, tribüne koşu, zıpla-dön, ters takla (bazıları kariyer golleriyle açılır). Takım arkadaşları koşup sana katılır.
- **Şampiyonluk töreni:** Lig, kupa ya da milli turnuva kazanınca takımınla sahnede kupayı kaldırırsın; konfeti, havai fişek ve flaşlar.
- **Oyuncu çeşitliliği:** Farklı ten renkleri dengeli dağılır; kısa, kazınmış, yana taralı, uzun, kıvırcık, mohikan, topuz saç ve sakal.
- **Sosyal medya:** Instagram düzeninde profil (hikâye halkası, onaylı rozet, öne çıkanlar, 3'lü gönderi ızgarası, dokununca açılan gönderi) ve ana sayfada akış kartı (konum, beğenme, yorumlar, zaman). Gönderi görselleri fotoğraf gibi çizilir: gece stadyumunda gol sevinci, konfetili kupa kaldırma, basın duvarı önünde atkıyla transfer, maçın oyuncusu röportajı, antrenman sahası, efsaneyle hatıra fotoğrafı, gün batımında araba, yat, villa, stüdyo; alan derinliği, renk filtresi, vinyet ve gren efektiyle. Ününe göre büyüyen takipçi sayısı, gol, kupa, transfer ve eşya paylaşımları, beğeniler ve taraftar yorumları.
- **Gazete:** Haberler gazete sayfası görünümünde; manşet, köşe yazıları ve dünya servisi.
- **Dünyadan haberler:** Gerçek maç sonuçlarından ve ara ara mizahi dille yazılmış, kendini tekrar etmeyen haberler.
- **Lig sekmesi:** Sıra, puan, lidere fark ve son 5 maç formu; formalı puan tablosu, şampiyonluk/küme bölgeleri, maç kartlı fikstür ve gol krallığı.
- **Tek kaydırma:** Sayfalarda iç içe kaydırma alanı yok. Uzun haber ve fikstür listeleri "Tüm haberler" / "Tüm fikstür" düğmesiyle açılır, tablolar telefon ekranına sığar.
- **Durum şeridi:** Enerji, moral ve sağlık her sekmede üstte görünür; telefonda oyuncu kartı ayrı bir sekmededir.

## Dosya yapısı

```
index.html       Sayfa iskeleti
css/style.css    Görünüm
js/util.js       Yardımcı fonksiyonlar
js/data.js       Ülkeler, ligler, kulüpler, kurgusal yıldızlar, isim havuzları, mağaza
js/player.js     Statlar, genel güç, antrenman, yaşlanma
js/league.js     Kadrolar, fikstür, lig simülasyonu, altyapı ligleri
js/legends.js    Dönem yıldızları, yaşlanma, emeklilik, yeni nesil
js/cups.js       Avrupa kupaları, Dünya Kupası, Avrupa Şampiyonası
js/socialart.js  Sosyal medya gönderi görselleri ve Instagram ikonları
js/celebrate.js  Gol sevinci animasyonları ve şampiyonluk kupa kaldırma töreni
js/life.js       Yaşam: aile, ilişkiler, gece hayatı, kumarhane, bahis, menajer, sponsorluk
js/minigame.js   Şut/pas fizik sahnesi ve zamanlama barı
js/drills.js     Antrenman mini oyunları
js/shopart.js    Mağaza ürün çizimleri
js/captain.js    Kaptanlık hedefleri ve forma numarası
js/weather.js    Hava durumu, maç topları, lig skorbordları
js/extras.js     Madalyalar, mağaza, olaylar, mentorlar, sosyal medya, dünya haberleri
js/match.js      Maç motoru
js/game.js       Kariyer akışı, ekranlar, olaylar, sezon sonu
```
