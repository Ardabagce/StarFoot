# StarFoot'u Google Play'de yayınlama rehberi (AdMob reklamlı)

StarFoot Android'e **Capacitor** ile paketlenir: oyunun dosyaları uygulamanın içine gömülür, reklamlar Google'ın **AdMob** SDK'sıyla gösterilir. Uygulama internet olmadan da açılır (reklamlar için internet gerekir).

## Depoda hazır olanlar

| Ne | Nerede |
| --- | --- |
| Android projesi (paket adı `com.ardabagce.starfoot`, dikey ekran, ikonlar, açılış ekranı) | `app/android/` |
| AdMob eklentisi, uygulama kimliği yeri (`admob_app_id`) | `app/android/app/src/main/res/values/strings.xml` |
| Reklam ayarları (reklam birimi kimlikleri, test modu, sıklık) | `js/ads-config.js` |
| Reklam köprüsü: GDPR onay formu, ödüllü ve geçiş reklamları | `js/admob.js` |
| Otomatik derleme (APK + AAB) | `.github/workflows/android.yml` → GitHub › Actions |
| Gizlilik politikası (TR + EN, AdMob bölümü dahil) | `privacy.html` → <https://starfoot.vercel.app/privacy.html> |
| app-ads.txt (yayıncı kimliği sende doldurulacak) | `app-ads.txt` → <https://starfoot.vercel.app/app-ads.txt> |
| Mağaza ikonu, öne çıkan görsel, ekran görüntüleri, mağaza metinleri | `store/` |

### Oyundaki reklamlar
- **Hediye paketi:** Maçtan sonra bazen çıkar; reklam izlersen ödül ×2 ya da ×3 olur (isteğe bağlı).
- **Haftalık enerji:** Enerjin 85'in altındaysa Haftalık Plan kartında "Reklam izle · +25 enerji" düğmesi çıkar; haftada bir kez kullanılabilir (isteğe bağlı).
- **Geçiş reklamı:** Varsayılan olarak **3 maçta bir**, maç sonu ekranında "Devam"a basınca; iki geçiş reklamı arasında en az 3 dakika olur. Oyun sırasında asla çıkmaz.
- Sıklık ve ödül miktarı `js/ads-config.js` içinden değiştirilebilir. Web sürümünde (Vercel) gerçek reklam yoktur; orada temsili reklam ekranı kalır.
- AB ülkelerinde ilk açılışta Google'ın onay formu çıkar. Gerekirse *Profil › Kariyer › Oyun* kartında **Reklam gizlilik seçenekleri** düğmesi görünür.

## Senin yapacakların (sırayla)

### 1. Google Play geliştirici hesabı
1. <https://play.google.com/console/signup> adresinden hesap aç (tek seferlik **25 USD**), kimlik doğrulamasını tamamla.
2. Kişisel hesaplarda üretime çıkmadan önce **kapalı test** zorunlu: en az **12 test kullanıcısı**, **14 gün** boyunca.

### 2. AdMob hesabı ve reklam birimleri
1. <https://admob.google.com> adresinden aynı Google hesabıyla kaydol; ödeme ve vergi bilgilerini doldur (ödemeler bunlarsız yapılmaz).
2. **Uygulamalar › Uygulama ekle › Android** → "Uygulama henüz bir mağazada yayınlanmadı mı?" sorusuna **Hayır** de, adı `StarFoot` yaz. (Play'de yayınlandıktan sonra AdMob'da uygulamayı mağaza girişine **bağla**.)
3. Oluşan **Uygulama kimliğini** (`ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`, içinde **~** var) kopyala.
4. **Reklam birimleri** oluştur:
   - **Ödüllü** (Rewarded): adı `odullu`, ödül 1 adet.
   - **Geçiş** (Interstitial): adı `gecis`.
   Her birinin kimliğini kopyala (`ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ`, içinde **/** var).
5. **Gizlilik ve mesajlar** bölümünde **GDPR** (Avrupa) mesajı ve **ABD eyalet yasaları** mesajı oluştur ve yayınla. Gizlilik politikası adresi: `https://starfoot.vercel.app/privacy.html`.
6. Bu üç kimliği ve yayıncı kimliğini (`pub-XXXXXXXXXXXXXXXX`, AdMob › Ayarlar › Hesap bilgileri) bana gönder; ben yerleştireyim. İstersen kendin de yapabilirsin:
   - `app/android/app/src/main/res/values/strings.xml` → `admob_app_id` = uygulama kimliği
   - `js/ads-config.js` → `rewarded`, `interstitial` = birim kimlikleri, `testing: false`
   - `app-ads.txt` → `pub-...` satırını yaz, başındaki `#` işaretini kaldır

> Kendi reklamlarına **asla tıklama**, testleri test reklamlarıyla yap (şu anki ayar zaten test modunda). Geçersiz tıklamalar AdMob hesabını kapattırabilir.

### 3. Yükleme anahtarı (upload key)
Bilgisayarında (Java kuruluysa) bir kez çalıştır:
```bash
keytool -genkeypair -v -keystore starfoot-upload.jks -alias starfoot -keyalg RSA -keysize 2048 -validity 10000
```
Şifreleri ve `starfoot-upload.jks` dosyasını güvenli bir yerde, yedekli sakla; depoya koyma.

Derlemeyi GitHub'da yaptırmak için GitHub deposunda **Settings › Secrets and variables › Actions › New repository secret** ile şu 4 sırrı ekle:
- `ANDROID_KEYSTORE_BASE64`: dosyanın base64 hali (`base64 -w0 starfoot-upload.jks` çıktısı; Windows'ta `certutil -encode`)
- `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` (`starfoot`), `ANDROID_KEY_PASSWORD`

### 4. Uygulamayı derle
**Kolay yol (GitHub Actions):** GitHub › **Actions › Android › Run workflow**. Bitince çalışmanın altındaki **Artifacts** bölümünden:
- `starfoot-debug-apk`: telefona kurup denemek için (test reklamlarını göreceksin)
- `starfoot-release-aab`: Play Console'a yüklenecek dosya (sırlar eklendiyse imzalı)

**Android Studio ile:** `cd app && npm install && npm run sync && npm run open` → Android Studio'da **Build › Generate Signed App Bundle**.

Her yeni sürümde `app/android/app/build.gradle` içindeki `versionCode`'u 1 artır (`versionName`'i de istersen 1.0.1 gibi yap). Oyunu güncelledikten sonra mağazaya yeni AAB yüklemen gerekir; uygulama dosyaları cihazın içinde olduğu için güncellemeler kendiliğinden gelmez.

### 5. Play Console'da uygulamayı oluştur
1. **Uygulama oluştur** → `StarFoot: Futbol Kariyeri`, varsayılan dil Türkçe, **Oyun**, **Ücretsiz**.
2. **Ana mağaza girişi:** `store/listing-tr.md` ve İngilizce çeviri için `store/listing-en.md`; ikon `store/icon-512.png`; öne çıkan görsel `store/feature-graphic-tr.png` / `-en.png`; ekran görüntüleri `store/screens/`.
3. **Uygulama içeriği** formları:
   - **Gizlilik politikası:** `https://starfoot.vercel.app/privacy.html`
   - **Reklamlar:** **Evet, uygulamam reklam içeriyor.**
   - **Reklam kimliği:** **Evet, kullanılıyor** → amaç: *Reklam veya pazarlama* (ve *Analiz*).
   - **Uygulama erişimi:** Tüm işlevler kısıtlamasız.
   - **İçerik derecelendirmesi (IARC):** Kategori *Oyun*. **Simüle kumar: Evet** (kumarhane, bahis; gerçek para yok). Alkol/gece hayatı göndermeleri: var (hafif). Kullanıcılar arası etkileşim: yok. Dijital satın alma: yok. **Reklam: var.**
   - **Hedef kitle:** **18 ve üzeri** (simüle kumar yüzünden çocukları seçme; çocuk seçilirse AdMob ayarları ve Aileler politikası da değişir).
   - **Veri güvenliği** (AdMob nedeniyle "veri toplanıyor"):
     - Veri toplanıyor mu? **Evet**. Paylaşılıyor mu? **Evet** (reklam ağıyla).
     - Aktarım sırasında şifreleniyor: **Evet**. Kullanıcı silme isteyebilir: uygulama verisi cihazda; reklam kimliği Android ayarlarından sıfırlanır.
     - **Konum › Yaklaşık konum** (IP'den): toplanıyor ve paylaşılıyor, amaç: Reklam, Dolandırıcılık önleme.
     - **Uygulama etkinliği › Uygulama etkileşimleri**: toplanıyor ve paylaşılıyor, amaç: Reklam, Analiz.
     - **Uygulama bilgileri ve performans › Kilitlenme günlükleri, Teşhis**: toplanıyor ve paylaşılıyor, amaç: Analiz.
     - **Cihaz veya diğer kimlikler** (reklam kimliği): toplanıyor ve paylaşılıyor, amaç: Reklam, Analiz, Dolandırıcılık önleme.
     - Hepsi için "isteğe bağlı mı?" → **Hayır** (reklam SDK'sı otomatik toplar).
     - Ayrıntı: <https://developers.google.com/admob/android/privacy/play-data-disclosure>
4. **Mağaza ayarları:** Web sitesi olarak `https://starfoot.vercel.app` gir (app-ads.txt bu adreste aranır), iletişim e-postası `ardabagce@gmail.com`.

### 6. Test ve yayın
1. **Test › Kapalı test** → yeni sürüm → AAB'yi yükle, **Play Uygulama İmzalama**'yı kabul et.
2. En az **12 kişiyi** test listesine ekle, katılım bağlantısını gönder; **14 gün** yüklü tutsunlar.
3. Süre dolunca **Üretime erişim başvurusu** yap, onaydan sonra **Üretim** sürümünü incelemeye gönder (genelde 1–7 gün).
4. Yayından sonra AdMob'da uygulamayı Play girişine bağla ve `app-ads.txt` durumunun **Doğrulandı** olduğunu kontrol et (birkaç gün sürebilir).

## Gerçek reklamlara geçiş kontrol listesi
- [ ] `strings.xml` → `admob_app_id` gerçek uygulama kimliği
- [ ] `js/ads-config.js` → `rewarded`, `interstitial` gerçek birim kimlikleri ve `testing: false`
- [ ] `app-ads.txt` → yayıncı kimliği yazılı, `#` kaldırıldı
- [ ] AdMob'da GDPR ve ABD eyalet mesajları yayınlandı
- [ ] `versionCode` artırıldı, yeni AAB derlendi

## Bilmen gereken riskler
- **Gerçek isimlere benzeyen isimler:** Bazı kulüp ve oyuncu adları gerçeğe çok yakın (ör. *Kylian Mbappo*, *Liverpul FC*). Şikâyet olursa Google uygulamayı kaldırabilir; istersen isimleri biraz daha uzaklaştırırız.
- **Simüle kumar + reklam:** Yaş derecelendirmesi yükselir; AdMob'da reklam içerik sınırı "Teen" olarak ayarlı (`js/admob.js`).
- **Geçersiz trafik:** Kendi reklamlarına tıklama, arkadaşlarından tıklamalarını isteme.
