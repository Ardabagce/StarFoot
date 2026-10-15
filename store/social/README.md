# StarFoot sosyal medya paketi

| Dosya | Ne için |
| --- | --- |
| `starfoot-tanitim-tr.mp4` / `starfoot-tanitim-en.mp4` | TikTok ve Instagram Reels videosu (1080x1920, 22 sn, sessiz) |
| `instagram/profil-fotografi.png` | Instagram profil fotoğrafı (1080x1080) |
| `instagram/grid-tr-1.jpg`, `-2.jpg`, `-3.jpg` | Profilde yan yana tek görsel oluşturan 3 gönderi (1080x1440, 3:4) |
| `instagram/grid-tr-panorama.png` | Üçünün birleşik hali (kontrol için) |
| `instagram/grid-en-*` | Aynı gönderilerin İngilizcesi |

Yeniden üretmek için: `node store/social/clips.js tr <klasör>`, ardından `node store/social/video.js tr <klasör>` ve `node store/social/instagram.js tr <klasör>`.

## Instagram profili

- **Kullanıcı adı önerileri:** `@starfoot.game`, `@starfootgame`, `@starfoot.tr`
- **Ad alanı** (aramada çıkar): `StarFoot ⚽ Futbol Kariyeri`
- **Kategori:** Profesyonel hesaba geç (ücretsiz) › Kategori: *Video Oyunu*
- **Biyografi** (150 karakter sınırı içinde):

```
⚽ Sokaktan efsaneye: futbol kariyerini sen yaz
🏆 Ligler, Şampiyonlar Kupası, transferler
📲 App Store'da ücretsiz, link aşağıda 👇
```

- **Bağlantı:** Oyun yayınlanınca App Store linki. O zamana kadar `https://starfoot.bagce.dev`
- **Öne çıkanlar (highlights):** `Oyun`, `Goller`, `Transfer`, `Kupalar`, `Güncelleme`

İngilizce biyografi istersen:

```
⚽ From the streets to legend: write your football career
🏆 Leagues, Champions Cup, transfers
📲 Free on the App Store 👇
```

## 3'lü gönderiyi paylaşma sırası

Instagram'da en son paylaşılan en solda görünür. Bu yüzden **ters sırayla** paylaş:
1. Önce `grid-tr-3.jpg` (sağ: simge ve "App Store'da ücretsiz")
2. Sonra `grid-tr-2.jpg` (orta: telefonlar)
3. En son `grid-tr-1.jpg` (sol: "Sokaktan Efsaneye")

Üçünü art arda paylaş. Arada başka gönderi olursa görüntü kayar. Paylaşırken kırpma ekranında görseli **3:4 (dikey)** bırak.

**Gönderi açıklamaları:**
- 3: `StarFoot şimdi App Store'da! Ücretsiz indir, kariyerine başla. Link profilde 👆 #starfoot #futboloyunu`
- 2: `Kritik anı sen oyna, golü at, kupayı kaldır 🏆 #starfoot #mobiloyun`
- 1: `Sokaktan efsaneye ⚽ 17 yaşında mahalle maçında başlıyorsun; gerisi senin elinde. #starfoot #futbol`

## Video paylaşımı (TikTok ve Reels)

- Video **sessiz**. Paylaşırken TikTok/Instagram'ın kendi müzik kütüphanesinden o an **trend olan bir ses** ekle. Trend sesler daha çok kişiye gösterilir ve telif sorunu olmaz.
- **Kapak:** Videonun 0. saniyesi ("Bu futbol oyununda kariyerini sen yazıyorsun") ya da kupa sahnesi.
- **Açıklama (TR):**

```
Sokaktan Şampiyonlar Kupası'na ⚽🏆 Kariyerini sen yaz! StarFoot App Store'da ücretsiz, link profilde.
#futbol #futboloyunu #mobiloyun #oyun #kariyermodu #şampiyonlarligi #starfoot #fyp #keşfet
```

- **Açıklama (EN):**

```
From the streets to the Champions Cup ⚽🏆 Write your own football career. StarFoot is free on the App Store!
#football #soccer #footballgame #mobilegame #careermode #starfoot #fyp
```

## Düzenli içerik fikirleri

- **Gol derlemesi:** Oyunu oynarken ekran kaydı al, en güzel 3 golü 10–15 sn'lik videoda birleştir.
- **"Hangi sevinç?" anketi:** Gol sevinçlerini göster, yorumda seçtir.
- **Transfer serisi:** "Mahalleden Real Madrid'e 1. bölüm": her gün bir sezon.
- **Güncellemeler:** Her yeni özelliği 10 sn'lik bir videoyla göster.
- Haftada 3–4 video, aynı saatlerde (akşam 19:00–22:00) paylaş. İlk saatlerde gelen yorumlara cevap ver.

## Kısa videolar (TikTok · Reels · Shorts)

Üretmek: `node store/social/clips.js <dil> <work>` (frikik golü için `DX=-36`, varsayılan) ve `node store/social/shorts.js <dil> <work> <çıktı>`.
Her video 9–12 sn, 1080x1920, sessiz. **Müziği platformun içinden ekle** (trend sesler erişimi artırır, telif sorunu olmaz).

| # | Dosya | Açıklama metni (TR) | Caption (EN) |
| --- | --- | --- | --- |
| 1 | `tr-1-frikik` / `en-1-free-kick` | Barajın üstünden… GOOOL! ⚽ Sen kaç denemede atarsın? | Over the wall… GOAL! ⚽ How many tries would you need? |
| 2 | `*-2-transfer` | 17 yaşında dev kulübe transfer, havalimanında 9.000 taraftar 🛫 Hangi kulübe giderdin? | Transferred to a giant at 17, 9,000 fans at the airport 🛫 Which club would you join? |
| 3 | `tr-3-kupa` / `en-3-cup` | Mahalle maçından Şampiyonlar Kupası'na 🏆 Kaç sezonda şampiyon olursun? | From street football to the Champions Cup 🏆 How many seasons would it take you? |
| 4 | `tr-4-altin-top` / `en-4-ballon` | 21 yaşında Altın Top 🥇 Senin rekorun kaç gol? | Ballon d'Or at 21 🥇 What's your goal record? |
| 5 | `tr-5-meydan-okuma` / `en-5-challenge` | Bu oyunda kaç sezonda efsane olursun? Rekorunu yaz 👇 | How fast can you become a legend? Drop your record 👇 |

**Etiketler (TR):** `#starfoot #futbol #futboloyunu #mobiloyun #kariyermodu #frikik #galatasaray #fenerbahçe #beşiktaş #oyun`
**Hashtags (EN):** `#starfoot #football #soccer #mobilegame #careermode #freekick #soccergame #indiegame #gaming`

**Paylaşım düzeni:** Günde 1 video, akşam 19:00–22:00 arası. Aynı videoyu TikTok, Instagram Reels, YouTube Shorts ve Facebook Reels'e yükle. 5 video bitince sırayı tekrar et; en çok izleneni Spark Ads ile öne çıkar.
**İlk yorum:** "Oyun App Store'da ücretsiz, link profilde 🔗" (TikTok'ta 1.000 takipçiden önce profile link konamaz; o zamana kadar "App Store'da StarFoot ara" yaz).
