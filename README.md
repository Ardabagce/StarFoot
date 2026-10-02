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

## Özellikler

- **5 kariyer slotu:** Aynı anda 5 farklı kariyer; istediğini silebilirsin.
- **Başlangıç yılı ve yaşı:** 1980'den 2026'ya kadar istediğin yılda, 8-18 yaş arasında başlarsın. Kulübünü sen seçmezsin: 8-12 yaşında ilk maçın bir **mahalle maçı**, 13 yaş ve üstünde **altyapı seçmeleri** (mevkine göre 3 istasyon) olur; performansına göre scoutlar teklif getirir. Oluşturma ekranındaki statlar seçtiğin yaşa göre gösterilir.
- **Dönem yıldızları:** Milli takımlar ve Türkiye ligi de döneme göre değişir (ör. 1980'lerde Tanju Çolakoğulları, 1990'larda Hakan Şükürlü). Hırvatistan gibi ülkeler kuruldukları yıldan sonra çıkar.
- **Dönem yıldızları (dünya):** Seçtiğin yılın kurgusal yıldızları sahadadır (1980'ler: Maradoni, Platinni, van Bastın... 2000'ler: Ronaldinyo, Anri... bugün: Mbappo, Halland, Yamel...). Oyuncular yaşlanır, emekli olur, gençler sırası gelince profesyonel olur; liste bittikten sonra yeni nesil yıldızlar üretilir. Emeklilikler, yeni yıldızlar ve büyük transferler haberlerde ve sosyal medya gündeminde çıkar.
- **Kariyer:** U10, U12, U14, U16 ve U19 takımlarında oynarsın. 17-18 yaşında profesyonel sözleşme imzalar, 33 yaşından sonra istediğin zaman emekli olabilirsin.
- **20 takımlı ligler:** Tüm ligler 20 takım, 38 hafta. Türkiye'de 3 takım düşer, 3 takım çıkar.
- **Avrupa kupaları:** Her sezon Avrupa Şampiyonlar Kupası ve Avrupa Federasyon Kupası (16 takım, tek maç eleme). Kulübün katılırsa maçlarını sen oynarsın.
- **Dünya Kupası ve Avrupa Şampiyonası:** Gerçek takvimle (Dünya Kupası 1986, 1990... 2026, 2030; Avrupa Şampiyonası 1984, 1988... 2024, 2028) sezon sonunda oynanır. Milli takıma çağrılırsan maçlarına çıkarsın.
- **9 stat:** Hız, Şut, Pas, Top Sürme, Teknik, Kafa, Savunma, Güç, Dayanıklılık. Mevkine göre (Forvet / Orta Saha / Defans) genel gücün hesaplanır.
- **Haftalık aksiyonlar (haftada 3 hak):** antrenman, yoğun antrenman, özel hoca, dinlenme, takım arkadaşlarıyla vakit geçirme, hocayla konuşma, taraftarlarla etkileşim.
- **Maçlar:** Maç dakika dakika simüle edilir. Kritik anlarda oyun durur ve sen oynarsın:
  - **Şut (sapan gibi):** Parmağını (ya da fareyi) ekranda bir yere koy ve topun gitmesini istediğin yönün **tersine geri çek**, sonra bırak. Ne kadar geri çekersen vuruş o kadar sert olur. Geri çekerken yolu **kavisli** çizersen top falso alır. Parmağın topun arkasında kaldığı için topun izleyeceği yol ve hedef halkası net görünür; Teknik statın yükseldikçe önizleme uzar.
  - **Pas:** Takım arkadaşına **dokun**; top isabetli bir pasla ona gider (isabet Pas statına bağlı). **Aşırtma** seçiliyse pas yüksek bir yayla savunmanın üstünden geçer.
  - **Ofsayt:** Sahada ofsayt çizgisi gösterilir. Son savunmacının gerisindeki arkadaşına pas verirsen yan hakem bayrağı kaldırır.
  - **Kaleci:** Şutlara doğru uçar, köşelere uzanır, yüksek toplara sıçrar.
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
- **7 lig ve 140 kulüp:** Türkiye (2 lig, küme düşme/çıkma ile), İngiltere, İspanya, Almanya, İtalya ve Fransa.
- **Milli takım:** Yeterince iyiysen milli maçlara çağrılırsın.
- **Mağaza:** Görselli ürün kartları ve açılıp kapanan kategoriler (kramponlar, ekipman, beslenme, hobi, ulaşım, stil ve lüks, tek kullanımlık). Yaşa göre değişen reyonlar (çocukken futbolcu kartı albümü, idolünün forması, bahçe kalesi; gençken spor salonu, scooter; profesyonelken lüks saat, araba, villa, yat). Enerji içeceği, masaj, fizyoterapi, yaz kampı ve yıldız futbolcu kliniği gibi tek kullanımlık ürünler.
- **Kupa vitrini ve madalyalar:** Kazandığın kupalar raflarda sergilenir; ilk gol, hat-trick, 100 maç, milli forma, ilk milyon gibi 17 madalya.
- **Hediye paketi:** Arada bir hediye paketi çıkar. Kısa bir reklam izlersen ödül x2 ya da x3 olur, izlemezsen x1 alırsın. (Şimdilik temsili reklam gösterilir; gerçek bir reklam sağlayıcısı `window.StarfootAds` ile bağlanabilir.)
- **Kaptanlık:** Kadro sekmesinde kaptanlık hedefleri (maç sayısı, yaş, hoca ve takım ilişkisi, genel güç, reyting) görünür. Hepsini tamamlayınca kaptan olursun; kaptanken maçta arkadaşını basılı tutup sürükleyerek yerleştirebilirsin.
- **Maçın adamı:** Seçildiğinde özel bir ödül ekranı açılır; yıldız kupaların Kariyer sekmesindeki vitrinde sergilenir.
- **105 başarım:** Gol, asist, maç, özel goller, kupalar, milli takım, kariyer, yetenek, ün ve yaşam kategorilerinde.
- **Gerçekçi sürprizler:** Altyapıdayken A takımın yıldızları (dönemin gerçek oyuncularından esinlenen isimler) antrenmanını izlemeye gelir ve sana mevkisine göre bir şey öğretir; kulübün emekli efsaneleri tesisleri ziyaret eder, A takım hocası seni profesyonellerle antrenmana çağırır. Profesyonelken kaptanla ekstra çalışma, tecrübeli oyuncudan tavsiye, fizyoterapist programı gibi olaylar olur. Çok iyi maçlardan sonra başkandan prim ya da A takım antrenmanı daveti gelir.
- **Antrenman mini oyunları:** Antrenman, yoğun antrenman ve özel hocada odak statına göre bir çalışma oynanır: Şut → bitiricilik (3 şut), Teknik → top sektirme, Pas → verkaç istasyonu, Top Sürme → slalom, Kafa → orta karşılama, Savunma → ikili mücadele, Güç → omuz omuza (basılı tut, yeşil bantta bırak), Hız/Dayanıklılık → sürat koşusu. İyi oynarsan gelişim ×1,5'e kadar çıkar; atlayabilir ya da tamamen kapatabilirsin.
- **Zorluk:** Kolay, Orta ve Zor. Kariyer sekmesinden sonradan da değiştirilebilir.
- **Devre arası:** Hocayla taktik konuşmak, takımı ateşlemek, toparlanmak ya da rakip kaleciyi incelemek; yedekteysen ısınıp hocaya görünmek.
- **Yeni mini oyunlar:** Kontra atak sprinti (hızlı hızlı dokun) ve verkaç (parlayan arkadaşına süre dolmadan dokun).
- **Asist animasyonu:** Pas arkadaşına ulaşınca arkadaşın topu kontrol edip şut çeker; gol olursa ASİST yazar.
- **Sosyal medya:** Ününe göre büyüyen takipçi sayısı, gol, kupa, transfer ve eşya paylaşımları, beğeniler ve taraftar yorumları.
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
js/minigame.js   Şut/pas fizik sahnesi ve zamanlama barı
js/drills.js     Antrenman mini oyunları
js/shopart.js    Mağaza ürün çizimleri
js/captain.js    Kaptanlık hedefleri
js/extras.js     Madalyalar, mağaza, olaylar, mentorlar, sosyal medya, dünya haberleri
js/match.js      Maç motoru
js/game.js       Kariyer akışı, ekranlar, olaylar, sezon sonu
```
