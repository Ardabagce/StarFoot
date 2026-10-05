# StarFoot'u Google Play'de yayınlama rehberi

StarFoot bir web oyunu (PWA). Google Play'e **TWA (Trusted Web Activity)** olarak çıkar: Android uygulaması, `https://starfoot.vercel.app` adresindeki oyunu tam ekran açan ince bir kabuktur. Oyunu güncellediğinde (bu dala push) uygulama da kendiliğinden güncellenir; mağazaya yeni sürüm yüklemen yalnız ikon/ad/paket ayarı değişince gerekir.

## Depoda hazır olanlar

| Ne | Dosya |
| --- | --- |
| Uygulama manifesti (ad, ikonlar, maskable ikon, ekran görüntüleri, dikey yön, kategori) | `manifest.webmanifest` |
| Maskable ikonlar (Android uyarlanabilir ikon) | `icons/icon-maskable-192.png`, `icons/icon-maskable-512.png` |
| Çevrimdışı çalışma (service worker) | `sw.js` |
| Gizlilik politikası (TR + EN) | `privacy.html` → `https://starfoot.vercel.app/privacy.html` |
| Digital Asset Links dosyası (parmak izi sende doldurulacak) | `.well-known/assetlinks.json` |
| Doğru içerik türü başlıkları | `vercel.json` |
| Mağaza ikonu 512×512 | `store/icon-512.png` |
| Öne çıkan görsel 1024×500 | `store/feature-graphic-tr.png`, `store/feature-graphic-en.png` |
| Telefon ekran görüntüleri 1080×1920 (6 TR + 6 EN) | `store/screens/` |
| Mağaza metinleri (ad, kısa ve uzun açıklama) | `store/listing-tr.md`, `store/listing-en.md` |
| Görselleri yeniden üretme | `node store/make.js` (Playwright gerekir) |
| İngilizce dil | Oyun telefonun diline göre açılır; başlık ekranındaki TR/EN düğmesi ve Kariyer › Oyun kartındaki seçimle değişir |

## Senin yapacakların (sırayla)

### 1. Google Play geliştirici hesabı
1. <https://play.google.com/console/signup> adresinden hesap aç (tek seferlik **25 USD**).
2. Hesap türünü seç: **Kişisel** ya da **Kuruluş**. Kimlik doğrulamasını (kimlik belgesi, adres, telefon) tamamla. Onay birkaç gün sürebilir.
3. Hesaba bir iletişim e-postası ve (kişisel hesapta) bir telefon ekle.

> Önemli: 13 Kasım 2023'ten sonra açılan **kişisel** hesaplarda üretime çıkmadan önce **kapalı test** zorunlu: en az **12 test kullanıcısı** uygulamayı **14 gün boyunca** yüklü tutmalı. Bunu planına ekle (aile, arkadaşlar, Yasin…). Kuruluş hesabında bu şart yok ama D-U-N-S numarası gerekir.

### 2. Gizlilik politikasındaki e-postayı doldur
`privacy.html` içindeki iki `CONTACT_EMAIL` yazısını, mağazada göstereceğin iletişim e-postasıyla değiştir (veya bana hangi adresi kullanacağını söyle, ben ekleyeyim). Push'tan sonra <https://starfoot.vercel.app/privacy.html> adresinin açıldığını kontrol et.

### 3. Sitenin herkese açık olduğundan emin ol
TWA, `https://starfoot.vercel.app` adresini açar. Vercel projesinde **Settings › Deployment Protection** bölümünde üretim alan adının şifre/Vercel girişi istemediğini kontrol et (gizli sekmede adresi açıp test et). İstersen kendi alan adını (ör. `starfoot.app`) bağlayabilirsin; o zaman aşağıdaki adımlarda o adresi kullan.

### 4. Android paketini oluştur (PWABuilder ile, kod yazmadan)
1. <https://www.pwabuilder.com> → adres olarak `https://starfoot.vercel.app` yaz → **Start**.
2. Rapor ekranında manifest ve service worker'ın yeşil olduğunu gör → **Package for stores** → **Android** → **Generate Package**.
3. Seçenekler:
   - **Package ID:** `app.vercel.starfoot.twa` (değiştirirsen aynı değeri aşağıda assetlinks'e de yazmalısın; sonradan değiştirilemez).
   - **App name:** `StarFoot: Football Career`, **Short name:** `StarFoot`
   - **Version:** `1.0.0`, **Version code:** `1` (her yeni yüklemede 1 artır)
   - **Display mode:** Standalone (ya da Fullscreen), **Orientation:** Portrait
   - **Signing key:** *Create new* (PWABuilder senin için anahtar üretir).
4. İndirdiğin zip'te: `.aab` (Play'e yüklenecek), `.apk` (telefonda deneme için), **signing.keystore** ve şifrelerin yazdığı **signing-key-info.txt** var.
   **Keystore dosyasını ve şifreleri güvenli bir yerde (birden fazla yedekle) sakla.** Kaybedersen güncelleme yükleyemezsin. Bu dosyaları depoya koyma.

> Alternatif: Google'ın Bubblewrap aracı (`npm i -g @bubblewrap/cli`, `bubblewrap init --manifest https://starfoot.vercel.app/manifest.webmanifest`, `bubblewrap build`). Sonuç aynıdır.

### 5. Play Console'da uygulamayı oluştur
1. **Uygulama oluştur** → Ad: `StarFoot: Futbol Kariyeri`, varsayılan dil: Türkçe (tr-TR), **Oyun**, **Ücretsiz**, beyanları onayla.
2. **Ana mağaza girişi:**
   - Metinler: `store/listing-tr.md`. **Çeviri ekle → İngilizce (en-US)** ve `store/listing-en.md`.
   - Uygulama simgesi: `store/icon-512.png`
   - Öne çıkan görsel: `store/feature-graphic-tr.png` (İngilizce girişte `-en`)
   - Telefon ekran görüntüleri: `store/screens/tr-*.png` (İngilizce girişte `en-*.png`), en az 2, en fazla 8.
   - Kategori: **Oyun › Spor**, iletişim e-postası, (isteğe bağlı) web sitesi `https://starfoot.vercel.app`.
3. **Uygulama içeriği** bölümündeki formlar:
   - **Gizlilik politikası:** `https://starfoot.vercel.app/privacy.html`
   - **Reklamlar:** "Hayır, uygulamam reklam içermiyor" (oyundaki "Reklam izle" ekranı gerçek reklam değil, kurgusal sponsor; ileride gerçek reklam eklersen bunu "Evet" yap).
   - **Uygulama erişimi:** Tüm işlevler kısıtlama olmadan kullanılabilir.
   - **İçerik derecelendirmesi (IARC anketi):** Kategori *Oyun*. Şiddet: yok/çok hafif (spor çarpışmaları). **Kumar: simüle kumar VAR** (kumarhane: blackjack, rulet, at yarışı ve bahis; gerçek para yok). Alkol/gece hayatı göndermeleri: var (hafif). Kullanıcı etkileşimi/sohbet: yok. Konum paylaşımı: yok. Dijital satın alma: yok. Sonuçta büyük olasılıkla PEGI 12–18 / Teen–Mature çıkar; bu normal.
   - **Hedef kitle ve içerik:** Yaş grupları olarak **18 ve üzeri** (en az 16+) seç. 13 yaş altını seçme: simüle kumar yüzünden "Aileler" politikasına takılır.
   - **Veri güvenliği:** "Uygulamam kullanıcı verisi toplamıyor veya paylaşmıyor" → **Hayır** (veri toplanmıyor). Veriler yalnız cihazda saklanır.
   - **Haber uygulaması:** Hayır. **COVID / Devlet / Finans:** Hayır.
   - **Sağlık / reklam kimliği:** Reklam kimliği kullanılmıyor.
4. **Ülkeler:** Tüm ülkeler (veya istediklerin).

### 6. İlk yükleme ve asset links (adres çubuğunu gizlemek için şart)
1. **Test › Kapalı test** (kişisel hesapsan zorunlu) → yeni sürüm → `.aab` dosyasını yükle. İlk yüklemede **Play Uygulama İmzalama**'yı kabul et.
2. **Kurulum › Uygulama bütünlüğü › Uygulama imzalama** sayfasından **Uygulama imzalama anahtarı sertifikası**nın **SHA-256 parmak izini** kopyala. (PWABuilder'ın verdiği yükleme anahtarının parmak izini de ekleyebilirsin; ikisi birden olabilir.)
3. Bu değeri bana gönder ya da kendin `.well-known/assetlinks.json` içindeki `REPLACE_WITH_PLAY_APP_SIGNING_SHA256_FINGERPRINT` yerine yaz (`AA:BB:...` biçiminde, tırnak içinde). Paket adını değiştirdiysen `package_name`'i de güncelle. Push et.
4. <https://starfoot.vercel.app/.well-known/assetlinks.json> adresinin JSON olarak açıldığını kontrol et. Doğrulama: <https://developers.google.com/digital-asset-links/tools/generator>.
   Bu adım yapılmazsa uygulama açılınca üstte tarayıcı adres çubuğu görünür.

### 7. Test kullanıcıları ve üretime çıkış
1. Kapalı test kanalına en az **12 kişinin** Google hesabını (e-posta listesi veya Google Grubu) ekle, katılım bağlantısını gönder; uygulamayı **14 gün** yüklü tutsunlar.
2. 14 gün dolunca Play Console'da **Üretime erişim başvurusu** formunu doldur (test sürecinde ne öğrendin, hangi geri bildirimleri düzelttin).
3. Onaydan sonra **Üretim** kanalına sürüm oluştur → incelemeye gönder. İlk inceleme genelde 1–7 gün sürer.

### 8. Güncellemeler
- Oyundaki her değişiklik Vercel'e push edilince uygulamaya da gelir; mağazaya yeni sürüm gerekmez.
- `sw.js` içindeki `CACHE` adı her sürümde değişiyor; böylece oyuncular yeni dosyaları alır.
- Uygulama adı/ikonu/paket ayarı değişirse PWABuilder'da **aynı keystore** ile yeni paket üret, version code'u 1 artır ve yükle.

## Bilmen gereken riskler
- **Gerçek isimlere benzeyen isimler:** Kulüp ve oyuncu adları kurgusal ama bazıları gerçeğe çok yakın (ör. *Kylian Mbappo*, *Liverpul FC*). Google bu konuda şikâyet gelirse uygulamayı kaldırabilir. Daha güvenli olmak istersen isimleri biraz daha uzaklaştırabiliriz; söylemen yeterli.
- **Simüle kumar:** Yaş derecelendirmesini yükseltir; hedef kitlede 18+ seçmen önerilir.
- **Gerçek reklam eklemek istersen:** TWA içinde AdMob doğrudan çalışmaz; Google'ın web oyunları için **H5 Games Ads (Ad Placement API)** programına başvurmak gerekir. Oyunda `window.StarfootAds.show()` kancası hazır; reklam eklenirse mağazada "Reklam içerir" seçilmeli ve gizlilik politikası güncellenmeli.
