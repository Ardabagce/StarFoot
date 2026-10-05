// AdMob ayarları. Yalnız Android uygulamasında (Capacitor) gerçek reklam gösterilir;
// web sürümünde temsili reklam ekranı kullanılır.
// Kimlikleri AdMob panelinden (Uygulamalar › Reklam birimleri) kopyala.
// Boş bırakılan birimler için Google'ın TEST reklamları gösterilir.
const AD_CONFIG = {
  rewarded: 'ca-app-pub-7675764460364294/1053737887', // Ödüllü reklam birimi
  rewardedFormat: 'rewardedInterstitial', // Birimin türü: 'rewarded' (Ödüllü) ya da 'rewardedInterstitial' (Ödüllü geçiş)
  interstitial: '',        // Geçiş reklamı birimi (boşsa maç sonu geçiş reklamı gösterilmez)
  testing: false,          // true: Google'ın test reklamları (geliştirme sırasında)
  interstitialEvery: 3,    // Kaç maçta bir geçiş reklamı (0 = hiç)
  interstitialGapSec: 180, // İki geçiş reklamı arasında en az kaç saniye
  energyReward: 25,        // "Reklam izle, enerji kazan" ödülü (haftada bir)
};
