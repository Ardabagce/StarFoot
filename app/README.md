# StarFoot Android (Capacitor + AdMob)

```bash
npm install          # bir kez
npm run sync         # oyunun dosyalarını www/ içine kopyalar ve Android projesine aktarır
npm run open         # Android Studio'da açar
node make-icons.js   # ikon/açılış ekranlarını ../icons'tan yeniden üretir (Playwright gerekir)
```

- Paket adı (Play): `app.vercel.starfoot.twa` (`capacitor.config.json`, `android/app/build.gradle` › applicationId; Java paketi `com.ardabagce.starfoot` olarak kalır)
- AdMob uygulama kimliği: `android/app/src/main/res/values/strings.xml` → `admob_app_id`
- Reklam birimleri ve sıklık: `../js/ads-config.js`
- İmzalama: `android/keystore.properties.example` dosyasını `keystore.properties` olarak kopyala
- Ayrıntılı yayın rehberi: `../GOOGLE_PLAY.md`
