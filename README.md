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
  - **Şut / pas sahnesi:** Topun arkasına doğru sürükle ve bırak (sapan gibi). Ok uzadıkça vuruş sertleşir. Falso ve yükseklik ayarlanabilir. Kaleci, savunmacılar, baraj ve takım arkadaşların fiziksel olarak hareket eder. Statların vuruş gücünü, isabetini ve falsoyu belirler.
  - **Zamanlama anları:** çalım, top kapma ve kafa vuruşu. İlgili statın yüksekse yeşil alan genişler.
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
