// AdMob ayarları. Yalnız Android uygulamasında (Capacitor) gerçek reklam gösterilir;
// web sürümünde temsili reklam ekranı kullanılır.
// Kimlikleri AdMob panelinden (Uygulamalar › Reklam birimleri) kopyala.
// Boş bırakılan birimler için Google'ın TEST reklamları gösterilir.
const AD_CONFIG = {
  rewarded: '',            // Ödüllü reklam birimi, ör. 'ca-app-pub-1234567890123456/1234567890'
  interstitial: '',        // Geçiş reklamı birimi
  testing: true,           // Yayına çıkmadan önce false yap (gerçek kimliklerle birlikte)
  interstitialEvery: 3,    // Kaç maçta bir geçiş reklamı (0 = hiç)
  interstitialGapSec: 180, // İki geçiş reklamı arasında en az kaç saniye
  energyReward: 25,        // "Reklam izle, enerji kazan" ödülü (haftada bir)
};
