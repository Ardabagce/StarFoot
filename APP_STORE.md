# StarFoot'u App Store'da yayınlama rehberi

iPhone uygulaması `app/ios/` klasöründe (Capacitor). Android ile aynı oyun dosyalarını, aynı AdMob reklam düzenini kullanır. Derleme Mac gerektirmez: **GitHub Actions › iOS** iş akışı GitHub'ın Mac sunucularında derleyip **TestFlight'a** yükler.

## Depoda hazır olanlar

| Ne | Nerede |
| --- | --- |
| iOS projesi (Bundle ID `app.vercel.starfoot.twa`, yalnız iPhone, dikey, sürüm 1.0.2) | `app/ios/App/` |
| Uygulama simgesi 1024×1024 (şeffaflıksız) ve açılış ekranı | `app/ios/App/App/Assets.xcassets/` |
| İzleme izni (ATT) metni, AdMob uygulama kimliği, SKAdNetwork listesi, şifreleme beyanı | `app/ios/App/App/Info.plist` |
| iOS reklam birimleri (boşken test reklamları) | `js/ads-config.js` › `ios` |
| Derleme + TestFlight'a yükleme | `.github/workflows/ios.yml` |
| Ekran görüntüleri 1290×2796 (5 TR + 5 EN) | `store/premium/ios/` |
| Ad, alt başlık, tanıtım metni, anahtar kelimeler | `store/app-store-tr-en.md` |
| Açıklama metinleri | `store/listing-tr.md`, `store/listing-en.md` |
| Gizlilik politikası (ATT bölümü dahil) | https://starfoot.vercel.app/privacy.html |

## Senin yapacakların (sırayla)

### 1. Bundle ID'yi kaydet
<https://developer.apple.com/account/resources/identifiers/list> › **+** › *App IDs* › *App* › Açıklama `StarFoot`, **Explicit Bundle ID**: `app.vercel.starfoot.twa` › Continue › Register.

### 2. App Store Connect'te uygulamayı oluştur
<https://appstoreconnect.apple.com/apps> › **+** › *Yeni Uygulama*: Platform **iOS**, Ad `StarFoot: Futbol Kariyeri`, Ana dil **Türkçe**, Bundle ID `app.vercel.starfoot.twa`, SKU `starfoot`, Tam erişim.

### 3. GitHub Actions için App Store Connect API anahtarı
Var olan "[Expo] EAS Submit" anahtarının `.p8` dosyası Expo'da kaldığı için **yeni bir anahtar** oluştur:
1. App Store Connect › *Kullanıcılar ve Erişim* › *Entegrasyonlar* › *App Store Connect API* › **Team Keys** › **+**
2. Ad: `GitHub Actions`, Erişim: **Admin** (imzalama sertifikasını otomatik oluşturabilmesi için).
3. **Download API Key** ile `.p8` dosyasını indir. **Yalnızca bir kez indirilebilir**, güvenli yerde sakla.
4. Yeni anahtarın **Key ID**'sini not et.

### 4. Team ID
<https://developer.apple.com/account> › *Membership details* › **Team ID** (10 karakter, ör. `AB12CD34EF`).

### 5. GitHub sırlarını ekle
<https://github.com/Ardabagce/StarFoot/settings/secrets/actions> › **New repository secret**:

| Name | Value |
| --- | --- |
| `APPSTORE_API_KEY_P8` | `.p8` dosyasını Not Defteri/TextEdit ile aç, `-----BEGIN PRIVATE KEY-----` dahil **tüm içeriği** yapıştır |
| `APPSTORE_KEY_ID` | 3. adımdaki Key ID |
| `APPSTORE_ISSUER_ID` | `8d89245c-7ab7-4025-a288-8b1f9a59c683` |
| `APPLE_TEAM_ID` | 4. adımdaki Team ID |

### 6. Derle ve TestFlight'a yükle
GitHub › **Actions › iOS › Run workflow** (dal: `claude/nss-soccer-game-clone-wg55ca`). ~10-15 dakika sonra derleme App Store Connect › **TestFlight**'ta görünür (işlenmesi 5-30 dk). İlk seferde "Export Compliance" sorulursa: şifreleme **yok** (Info.plist'te zaten beyan edildi).

TestFlight › *Dahili Test* grubuna kendini ekle, iPhone'a **TestFlight** uygulamasını kurup oyunu dene.

### 7. AdMob iOS reklamları
1. AdMob › *Uygulamalar* › **Uygulama ekle** › **iOS** › "Uygulamanız App Store'da mı?" **Hayır** › ad `StarFoot`.
2. Bir **Ödüllü geçiş** reklam birimi (ve istersen bir **Geçiş** birimi) oluştur.
3. ✅ Yerleştirildi: uygulama kimliği `ca-app-pub-7675764460364294~6258707961` (`Info.plist`), ödüllü geçiş birimi `ca-app-pub-7675764460364294/5931404906` (`js/ads-config.js` › `ios`). Maç sonu geçiş reklamı için ayrı bir **Geçiş** birimi oluşturursan `ios.interstitial` alanına eklenir.
4. Yayından sonra AdMob'da iOS uygulamasını App Store kaydına bağla.

### 8. App Store Connect formları
- **Uygulama bilgileri:** Kategori *Oyunlar › Spor*, alt başlık ve diğer metinler `store/app-store-tr-en.md`. *Yerelleştirme* ekleyip İngilizce metinleri de gir.
- **Ekran görüntüleri:** *iPhone 6,9" / 6,7"* alanına `store/premium/ios/tr-*.png` (İngilizce yerelleştirmede `en-*.png`).
- **Yaş derecelendirmesi:** *Simüle kumar*: **Sık/Yoğun**; *Alkol, tütün veya uyuşturucu kullanımı ya da referansları*: **Seyrek/Hafif**; şiddet: yok; kullanıcı içeriği/sohbet: yok; gerçek parayla kumar: **Hayır**. Sonuç büyük olasılıkla 17+/18+ olur.
- **Uygulama gizliliği** (*Veri toplama*: **Evet**, AdMob nedeniyle). Her biri için *İzleme amacıyla kullanılır*: Evet (yalnız Tanımlayıcılar ve Kullanım Verileri), *Kullanıcıya bağlı*: Hayır:
  - **Tanımlayıcılar › Cihaz Kimliği** — Üçüncü taraf reklamcılığı
  - **Kullanım Verileri › Ürün Etkileşimi, Reklam Verileri** — Üçüncü taraf reklamcılığı, Analiz
  - **Teşhis › Kilitlenme Verileri, Performans Verileri** — Analiz
  - **Konum › Yaklaşık Konum** — Üçüncü taraf reklamcılığı
- **Fiyat:** Ücretsiz. **Uygun ülkeler:** tümü.
- **Uygulama incelemesi bilgileri:** Giriş gerekmez; not olarak yaz: *"Single-player offline football career game. Casino/betting sections are simulated, no real money. Ads via Google AdMob with ATT prompt."*

### 9. İncelemeye gönder
*Dağıtım* sekmesinde **+ Sürüm** › TestFlight'taki derlemeyi seç › **İncelemeye Gönder**. İnceleme genelde 1-3 gün.

## Güncellemeler
Oyunu güncelleyip push ettiğinde **iOS** iş akışı otomatik çalışır ve yeni bir derleme numarasıyla TestFlight'a yükler. App Store Connect'te yeni sürüm açıp o derlemeyi seçmen yeterli. Sürüm adını (1.0.2 gibi) değiştirmek için `app/ios/App/App.xcodeproj/project.pbxproj` › `MARKETING_VERSION`.

## Bilmen gereken riskler
- **Gerçek isimlere benzeyen isimler (Kılavuz 5.2):** Apple bu konuda Google'dan daha katıdır. Ret gelirse kulüp/oyuncu adlarını biraz daha kurgusal yapabiliriz.
- **Simüle kumar (Kılavuz 5.3 / yaş derecelendirmesi):** Gerçek para yok, bu yüzden izinli; yaş derecelendirmesinde doğru işaretlemek şart.
- **ATT (Kılavuz 5.1.2):** İzin penceresi reklam isteğinden önce çıkıyor; izin metni Info.plist'te. Kullanıcı reddederse reklamlar kişiselleştirilmeden gösterilir.

## StarFoot Premium (uygulama içi satın alma) — 1.0.3 ile
1. App Store Connect › **İş (Business)** › **Ücretli Uygulamalar Sözleşmesi**'ni imzala; banka ve vergi bilgilerini doldur (durumu "Etkin" olmalı).
2. Uygulama › **Para Kazanma › Uygulama İçi Satın Almalar** › **+** › Tür: **Tüketilemez (Non-Consumable)**
   - Referans adı: `StarFoot Premium` · Ürün kimliği: **`starfoot_premium`** (kodla birebir aynı olmalı)
   - Fiyat: **99,99 ₺** fiyat basamağı (diğer ülkeler otomatik)
   - Yerelleştirme TR: Görünen ad `StarFoot Premium`, açıklama `Geçiş reklamlarını kaldırır, ödülleri reklamsız verir.` · EN: `Removes interstitial ads and grants rewards without ads.`
   - İnceleme için ekran görüntüsü: Yaşam › Mağaza'daki Premium kartı. İnceleme notu: `Premium card is in Life › Shop and Profile › Game. Restore button is under the purchase button.`
3. 1.0.3 sürümünü gönderirken sürüm sayfasındaki **Uygulama İçi Satın Almalar** bölümünden `starfoot_premium` ürününü sürüme ekle (ilk ürün sürümle birlikte incelenir).
4. Test: TestFlight derlemesinde satın alma ücretsiz "Sandbox" olarak çalışır.

## Ürün sayfası başlığı, arama sonucu görseli ve iPhone Duo (iOS 27)
Hazır dosyalar `store/premium/` altında:

| Alan (App Store Connect) | Ölçü | Dosya |
| --- | --- | --- |
| Ürün sayfası başlığı (Product page header) · görsel | 21:9, 3840×1646 | `header/tr-header.jpg`, `header/en-header.jpg` |
| Ürün sayfası başlığı · video (8 sn döngü, sessiz) | 21:9, 3840×1646, 30 fps | `header/tr-header.mp4`, `header/en-header.mp4` |
| Arama sonucu görseli (Search results) · görsel | 3:2, 1920×1280 | `header/tr-search.jpg`, `header/en-search.jpg` |
| Arama sonucu · video (8 sn döngü) | 3:2, 1920×1280, 30 fps | `header/tr-search.mp4`, `header/en-search.mp4` |
| iPhone Duo dış ekran ekran görüntüleri | 1398×2034 | `duo-outer/tr-*.jpg`, `duo-outer/en-*.jpg` |
| iPhone Duo iç ekran ekran görüntüleri | 2007×2853 | `duo-inner/tr-*.jpg`, `duo-inner/en-*.jpg` |

- Yükleme: Uygulama › Dağıtım › sürüm sayfası › **Ürün Sayfası Bilgileri** ya da **Varlık Kitaplığı (Asset Library)**. Başlık ve arama görseli sürümden bağımsız da onaya gönderilebilir.
- Başlık ve arama görselleri yalnız iOS 27 ve sonrası kullanan kullanıcılara gösterilir.
- iPhone Duo ekran görüntüleri şimdilik isteğe bağlı; Apple'a göre Nisan 2027'den itibaren zorunlu olacak.
- Yeniden üretmek: `node store/premium/header.js` (başlık/arama), `node store/premium/compose.js duo` (Duo ekranları).
