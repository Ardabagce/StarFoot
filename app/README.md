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

## iOS
- `npm run sync` yerine `node copy-web.js && npx cap sync ios && node spm-extras.js` (Liftoff reklam adaptörünü ekler)
- Simge/açılış: `node make-icons.js` sonra simgeden şeffaflığı kaldır: `convert ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png -background '#0a1530' -alpha remove -alpha off <aynı dosya>`
- AdMob iOS uygulama kimliği: `ios/App/App/Info.plist` › `GADApplicationIdentifier`
- Derleme/TestFlight: `../.github/workflows/ios.yml`, rehber `../APP_STORE.md`
