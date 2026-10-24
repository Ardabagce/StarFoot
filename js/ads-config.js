// AdMob ayarları. Yalnız Android uygulamasında (Capacitor) gerçek reklam gösterilir;
// web sürümünde temsili reklam ekranı kullanılır.
// Kimlikleri AdMob panelinden (Uygulamalar › Reklam birimleri) kopyala.
// Boş bırakılan birimler için Google'ın TEST reklamları gösterilir.
const AD_CONFIG = {
  rewarded: 'ca-app-pub-7675764460364294/1053737887', // Ödüllü reklam birimi
  rewardedFormat: 'rewardedInterstitial', // Birimin türü: 'rewarded' (Ödüllü) ya da 'rewardedInterstitial' (Ödüllü geçiş)
  interstitial: 'ca-app-pub-7675764460364294/9140416356', // Android geçiş reklamı birimi
  testing: false,          // true: Google'ın test reklamları (geliştirme sırasında)
  interstitialEvery: 0,    // Maç sonu geçiş reklamı kapalı (0); yerine sezonda en fazla 2 kez gösterilir:
  interstitialAt: { seasonStart: true, midSeason: true, firstSeason: false }, // sezon başı, sezon ortası; kariyerin ilk sezonunda hiç
  interstitialGapSec: 180, // İki geçiş reklamı arasında en az kaç saniye
  energyReward: 25,        // "Reklam izle, enerji kazan" ödülü (haftada bir)
  // iPhone (App Store) için ayrı AdMob birimleri. Boşken iOS'ta test reklamları gösterilir.
  ios: {
    rewarded: 'ca-app-pub-7675764460364294/5931404906', // Ödüllü geçiş
    rewardedFormat: 'rewardedInterstitial',
    interstitial: 'ca-app-pub-7675764460364294/5663669377', // Geçiş
  },
};
