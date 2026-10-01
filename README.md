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

## Özellikler

- **Kariyer:** 8 yaşında U10 takımında başlarsın. Sırasıyla U12, U14, U16 ve U19 takımlarında oynarsın. 17-18 yaşında profesyonel sözleşme imzalar, 33 yaşından sonra istediğin zaman emekli olabilirsin.
- **9 stat:** Hız, Şut, Pas, Top Sürme, Teknik, Kafa, Savunma, Güç, Dayanıklılık. Mevkine göre (Forvet / Orta Saha / Defans) genel gücün hesaplanır.
- **Haftalık aksiyonlar (haftada 3 hak):** antrenman, yoğun antrenman, özel hoca, dinlenme, takım arkadaşlarıyla vakit geçirme, hocayla konuşma, taraftarlarla etkileşim.
- **Maçlar:** Maç dakika dakika simüle edilir. Kritik anlarda oyun durur ve sen oynarsın:
  - **Şut:** Parmağını (ya da fareyi) topu göndermek istediğin yere doğru **kaydır**. Kaydırma ne kadar uzunsa vuruş o kadar sert olur. Yolu **kavisli** çizersen top falso alır ve kavisle hedefe döner (Score! Hero / Soccer Hero tarzı). Kaydırırken topun izleyeceği yol önizlenir; Teknik statın yükseldikçe önizleme uzar.
  - **Pas:** Takım arkadaşına **dokun**; top isabetli bir pasla ona gider (isabet Pas statına bağlı).
  - **Vuruş tipi:** Yerden, Yarım Yükseklik veya Aşırtma (klavyede 1 / 2 / 3).
  - Gole yaklaşan şutlarda ağır çekim, gollerde konfeti efekti var.
  - **Zamanlama anları (çalım, top kapma, kafa vuruşu):** Küçülen halka yeşil bölgeye girdiğinde ekranın herhangi bir yerine dokun ya da Boşluk tuşuna bas. İlgili statın yüksekse yeşil bölge genişler.
  - Her an **Otomatik** çözülebilir ya da maçın tamamı simüle edilebilir.
- **Reyting, maçın adamı, gol/asist istatistikleri** ve sezon sonu ödülleri (şampiyonluk, gol krallığı, sezonun oyuncusu, Altın Top...).
- **İlişkiler:** Hoca (ilk 11 şansı), takım arkadaşları ve taraftarlar.
- **Enerji, moral, ün ve sakatlıklar.**
- **Rastgele olaylar:** parti daveti, röportaj, sınav haftası, sponsorluk teklifleri...
- **Transferler:** altyapılar arası transfer, profesyonel sözleşme, ara transfer dönemi ve sezon sonu teklifleri.
- **7 lig ve 70 kulüp:** Türkiye (2 lig, küme düşme/çıkma ile), İngiltere, İspanya, Almanya, İtalya ve Fransa.
- **Milli takım:** Yeterince iyiysen milli maçlara çağrılırsın.
- **Mağaza:** krampon, antrenman ekipmanı, beslenme ve yaşam tarzı eşyaları.

## Dosya yapısı

```
index.html       Sayfa iskeleti
css/style.css    Görünüm
js/util.js       Yardımcı fonksiyonlar
js/data.js       Ülkeler, ligler, kulüpler, kurgusal yıldızlar, isim havuzları, mağaza
js/player.js     Statlar, genel güç, antrenman, yaşlanma
js/league.js     Kadrolar, fikstür, lig simülasyonu, altyapı ligleri
js/minigame.js   Şut/pas fizik sahnesi ve zamanlama barı
js/match.js      Maç motoru
js/game.js       Kariyer akışı, ekranlar, olaylar, sezon sonu
```
