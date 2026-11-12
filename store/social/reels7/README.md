# StarFoot – Reels 7 (gerçek çekim + gerçek oynanış + ses)

En çok izlenen kalıp ("gizemli cümle → O FUTBOLCU SENSİN") korunarak üretim kalitesi yükseltildi:
ilk 3 saniye gerçek çekim, ortada oyunun gerçek penaltı kaydı (şut, gol, gol sevinci), videoya gömülü ses tasarımı.
1080x1920, 30 fps, ~15,5 sn. Kapak: `-kapak.jpg`. `-sessiz.mp4`: aynı videonun sessiz hali (yalnız trend müzik kullanmak istersen).

| Dosya | İlk 3-5 saniye | Sonrası |
|---|---|---|
| r7_penalti.mp4 | "SKOR 0-0 · PENALTI!" → "TOPUN BAŞINDA BİR FUTBOLCU VAR" → "O FUTBOLCU SENSİN" | Telefonda gerçek penaltı: "ŞİMDİ SEN VUR" → "VE GOOOL!" · gol sevinci · Link profilde |
| r7_cocuk.mp4 | "BU ÇOCUK BİR GÜN DÜNYA YILDIZI OLACAK" → "O ÇOCUK SENSİN" | Sahaya çık · dev kulüpler · kupalar · Starpedia · Link profilde |
| r7_stadyum.mp4 | "BU STADYUM BİR İSMİ HAYKIRIYOR" → "O İSİM SENİN" | Gol sevinci · takipçiler · piyasa değeri · kupa vitrini · Link profilde |

## Açıklamalar (kopyala-yapıştır)

**r7_penalti.mp4**
```
Skor 0-0. Penaltı. Topun başında bir futbolcu var… O futbolcu sensin. ⚽🔥
Köşeyi sen seç, şutu sen çek, sevinci sen yaşa.
Sen olsan nereye vururdun: sağ mı, sol mu, orta mı? 👇
📲 Link profilde, App Store ve Google Play'de ücretsiz.
#starfoot #futbol #penaltı #futboloyunu #mobiloyun #kariyermodu #keşfet #reels
```
İlk yorumu sen yazıp sabitle: `Sağ mı, sol mu, orta mı? 👇`

**r7_cocuk.mp4**
```
Bu çocuk bir gün dünya yıldızı olacak… O çocuk sensin. 🌟⚽
Mahalleden başla, dev kulüplere transfer ol, kupaları kaldır, adını tarihe yazdır.
Çocukken hangi takımda oynamayı hayal ediyordun? 👇
📲 Link profilde, App Store ve Google Play'de ücretsiz.
#starfoot #futbol #hayal #futboloyunu #mobiloyun #kariyermodu #keşfet #reels
```

**r7_stadyum.mp4**
```
Bu stadyum bir ismi haykırıyor… O isim senin. 🏟️⚽
Golünü at, milyonlar seni takip etsin, değerin her maç katlansın.
Formanın arkasında hangi numara olurdu? 👇
📲 Link profilde, App Store ve Google Play'de ücretsiz.
#starfoot #futbol #stadyum #futboloyunu #mobiloyun #kariyermodu #keşfet #reels
```

## Paylaşım
- Sıra: önce `r7_penalti` (en güçlü kanca ve gerçek oynanış), 2-3 gün sonra `r7_cocuk`, sonra `r7_stadyum`. Akşam 19:00–22:00.
- Videonun kendi sesi var. Trend müzik eklemek istersen Instagram'da müziği ekleyip "orijinal ses"i %30-40'a indir; böylece gol anındaki tribün sesi kalır.
- Öne çıkarırken en iyi sonuç veren ayar aynı: Türkiye, Türkçe.

## Yeniden üretmek
1. Çekimler: `https://assets.mixkit.co/videos/<id>/<id>-1080.mp4` (yoksa `-720.mp4`); kimlikler: 43494, 43495, 30312, 6652, 738, 736.
2. Oyun kaydı: `MOMENT=penalty node store/social/clips.js tr <klasör> moment`
3. `node store/social/motion/prep7.js <klipler> <klasör>/moment <assets7>`
4. `cd store/social/motion && PAGE=reels7.html ASSETS=<assets7> COVER=75 node render_any.js r7_penalti ../reels7` (r7_cocuk, r7_stadyum)
5. `node store/social/motion/sfx7.js store/social/reels7`

## Lisans
- Gerçek çekimler Mixkit'ten (Mixkit Free License: ticari kullanım ve reklam serbest, atıf gerekmez). Çekim dosyaları depoya eklenmedi.
- Oyun görüntüleri oyunun kendi ekranlarıdır; kulüp ve oyuncu adları kurgusaldır.
- Sesler ffmpeg ile sentezlenmiştir; hazır müzik ya da ses dosyası kullanılmadı.
