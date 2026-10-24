# Instagram reklam videoları (animasyon)

Oyunun kendi çizimleriyle (oyuncu figürleri, stadyum, kupa) kare kare üretilir. 1080x1920, 30 fps, sessiz.
Yeniden üretmek: `node store/social/motion/render.js all store/social/ads`

Müziği Instagram'ın kendi kütüphanesinden ekle (trend bir ses; telif sorunu olmaz).

## 1. `ig.mp4`: Oyunda kendi Instagram'ın (13 sn)

```
Yıldız olunca telefonun susmaz 📱⚽
Transfer teklifleri, Altın Top adaylığı, milyonlarca takipçi… StarFoot'ta kendi futbolcunun Instagram'ı bile var. Kaç takipçiye ulaşırsın? 👇

App Store'da ücretsiz, link profilde 🔗
#starfoot #futbol #futboloyunu #mobiloyun #kariyermodu #instagram #futbolcu #keşfet
```

## 2. `yas.mp4`: 8 yaşından Altın Top'a (14 sn)

```
8 yaşında mahallede başla, 27'sinde Altın Top'u kaldır 🥇
Altyapı, ilk maç, dev transfer, kaptanlık… Futbol kariyerini baştan sona sen yaz. Sen kaç yaşında Altın Top alırsın? 👇

App Store'da ücretsiz, link profilde 🔗
#starfoot #futbol #altıntop #futboloyunu #mobiloyun #kariyermodu #nss #keşfet
```

## 3. `penalti.mp4`: 90+4' derbi penaltısı (12,5 sn)

```
Derbi, 90+4, skor 0-0… Penaltı sende 😰
Sol mu, sağ mı, orta mı? StarFoot'ta kritik anı sen oynuyorsun. Sen nereye vururdun? Yoruma yaz 👇

App Store'da ücretsiz, link profilde 🔗
#starfoot #futbol #penaltı #derbi #futboloyunu #mobiloyun #süperlig #keşfet
```

Kapak görselleri: `*-kapak.jpg` (videonun kanca karesi).

## 4. `gercek-hayal.mp4`: Gerçek görüntülü, "Çocukken hayalin futbolcu olmaktı" (18 sn)

Gerçek futbol görüntüleri (gece sahası, top sektirme, penaltı) → telefonda oyunun penaltı anı → kapanış.
Yeniden üretmek: Mixkit kliplerini indir (`43490 43483 43501 43494 43495 43479`, `https://assets.mixkit.co/videos/<id>/<id>-720.mp4`), sonra `node store/social/motion/real.js <klasör>`.

**Lisans:** Klipler Mixkit **Stock Video Free License** ile: reklam ve sosyal medya pazarlamasında ticari kullanım serbest, atıf gerekmez. ("Restricted" lisanslı klipler kullanılmadı; onlar yalnızca kişisel kullanım içindir.)

```
Çocukken hayalin futbolcu olmaktı ⚽ Hâlâ öyle, değil mi?
O son dakika penaltısını artık sen vuruyorsun. StarFoot'ta mahalleden Altın Top'a kariyerini sen yaz 🏆

App Store'da ücretsiz, link profilde 🔗
#starfoot #futbol #futboloyunu #hayal #mobiloyun #kariyermodu #penaltı #keşfet
```
