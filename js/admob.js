// AdMob köprüsü (Android / Capacitor). Oyundaki Ads.show() bu nesneyi kullanır.
// Web'de Capacitor yoksa hiçbir şey yapmaz ve oyun temsili reklam ekranına düşer.
(function () {
  const Cap = window.Capacitor;
  if (!Cap || !Cap.isNativePlatform || !Cap.isNativePlatform() || !Cap.Plugins || !Cap.Plugins.AdMob) return;
  const AdMob = Cap.Plugins.AdMob;
  const ios = Cap.getPlatform && Cap.getPlatform() === 'ios';
  const base = typeof AD_CONFIG !== 'undefined' ? AD_CONFIG : {};
  const cfg = Object.assign({}, base, ios ? base.ios || {} : {});
  const testing = !!cfg.testing || !cfg.rewarded;
  const rwi = cfg.rewardedFormat === 'rewardedInterstitial';
  const TEST = ios
    ? { rewarded: rwi ? 'ca-app-pub-3940256099942544/6978759866' : 'ca-app-pub-3940256099942544/1712485313', interstitial: 'ca-app-pub-3940256099942544/4411468910' }
    : { rewarded: rwi ? 'ca-app-pub-3940256099942544/5354046379' : 'ca-app-pub-3940256099942544/5224354917', interstitial: 'ca-app-pub-3940256099942544/1033173712' };
  // Test modunda Google'ın test birimleri; gerçek modda boş birim kapalıdır
  const unit = (k) => (testing ? TEST[k] : cfg[k] || '');
  const st = { ready: false, canAds: false, privacy: false, rw: false, it: false, matches: 0, lastIt: 0 };

  const prepRewarded = () => {
    if (!st.canAds || st.rw || !unit('rewarded')) return Promise.resolve(st.rw);
    const prep = rwi ? AdMob.prepareRewardInterstitialAd : AdMob.prepareRewardVideoAd;
    return prep.call(AdMob, { adId: unit('rewarded'), isTesting: testing }).then(() => (st.rw = true)).catch(() => (st.rw = false));
  };
  const prepInter = () => {
    if (!st.canAds || st.it || !unit('interstitial')) return Promise.resolve(st.it);
    return AdMob.prepareInterstitial({ adId: unit('interstitial'), isTesting: testing }).then(() => (st.it = true)).catch(() => (st.it = false));
  };
  const withTimeout = (p, ms) => Promise.race([p, new Promise((r) => setTimeout(() => r(false), ms))]);

  // iOS: Apple'ın izleme izni (App Tracking Transparency) penceresi.
  // Reklam SDK'sı başlamadan ve hiçbir veri toplanmadan ÖNCE, uygulama ekranda ve etkinken istenir.
  // iOS, uygulama tam etkin olmadan gelen isteği sessizce yok sayar; bu yüzden kısa bir bekleme yapılır
  // ve durum hâlâ belirsizse uygulama öne geldiğinde bir kez daha denenir.
  const att = async () => {
    if (!ios || !AdMob.trackingAuthorizationStatus) return;
    const ask = async () => {
      try {
        const t = await AdMob.trackingAuthorizationStatus();
        if (t && t.status === 'notDetermined') await AdMob.requestTrackingAuthorization();
        const t2 = await AdMob.trackingAuthorizationStatus();
        return !(t2 && t2.status === 'notDetermined');
      } catch (e) { return true; }
    };
    const visible = () => new Promise((r) => {
      if (document.visibilityState === 'visible') return r();
      const on = () => { if (document.visibilityState === 'visible') { document.removeEventListener('visibilitychange', on); r(); } };
      document.addEventListener('visibilitychange', on);
    });
    await visible();
    await new Promise((r) => setTimeout(r, 900));
    if (await ask()) return;
    // ilk istek yok sayıldıysa: uygulama yeniden öne geldiğinde ya da 2 sn sonra tekrar dene
    await new Promise((r) => setTimeout(r, 2000));
    await visible();
    await ask();
  };
  const init = async () => {
    await att();
    try {
      await AdMob.initialize({ initializeForTesting: testing, maxAdContentRating: 'Teen' });
    } catch (e) { /* SDK başlatılamadı */ }
    try {
      // GDPR / ABD eyalet yasaları: Google UMP onay formu (AdMob › Gizlilik ve mesajlar'da oluşturulur)
      let info = await AdMob.requestConsentInfo();
      if (!info.canRequestAds && info.isConsentFormAvailable && info.status === 'REQUIRED') info = await AdMob.showConsentForm();
      st.canAds = !!info.canRequestAds;
      st.privacy = info.privacyOptionsRequirementStatus === 'REQUIRED';
    } catch (e) {
      st.canAds = true; // onay hizmetine ulaşılamadı: SDK kendi kurallarıyla devam eder
    }
    st.ready = true;
    prepRewarded(); prepInter();
  };

  window.StarfootAds = {
    native: true,
    // Ödüllü reklam: izlenip ödül kazanılırsa true döner
    async show() {
      if (!st.ready) await withTimeout(new Promise((r) => { const iv = setInterval(() => { if (st.ready) { clearInterval(iv); r(true); } }, 200); }), 6000);
      if (!st.canAds) return false;
      if (!st.rw) await withTimeout(prepRewarded(), 8000);
      if (!st.rw) { if (typeof Game !== 'undefined') Game.toast(I18N.t('Şu an reklam yok. Biraz sonra tekrar dene.'), 'bad'); return false; }
      st.rw = false;
      try {
        const item = await (rwi ? AdMob.showRewardInterstitialAd() : AdMob.showRewardVideoAd());
        return !!item;
      } catch (e) {
        return false;
      } finally {
        prepRewarded();
      }
    },
    // Maç sonu geçiş reklamı (sıklık sınırlı)
    async afterMatch() {
      if (!cfg.interstitialEvery || !st.canAds || !unit('interstitial')) return;
      st.matches++;
      const now = Date.now() / 1000;
      if (st.matches % cfg.interstitialEvery !== 0 || now - st.lastIt < (cfg.interstitialGapSec || 0)) return;
      if (!st.it) { prepInter(); return; }
      st.it = false;
      try { await AdMob.showInterstitial(); st.lastIt = Date.now() / 1000; } catch (e) { /* gösterilemedi */ }
      prepInter();
    },
    // Sezon başı / sezon ortası geçiş reklamı (oyun Game.seasonAd ile en fazla sezonda 2 kez çağırır)
    async interstitial() {
      if (!st.ready || !st.canAds || !unit('interstitial')) return false;
      if (Date.now() / 1000 - st.lastIt < (cfg.interstitialGapSec || 0)) return false;
      if (!st.it) await withTimeout(prepInter(), 4000);
      if (!st.it) return false;
      st.it = false;
      try { await AdMob.showInterstitial(); st.lastIt = Date.now() / 1000; return true; } catch (e) { return false; } finally { prepInter(); }
    },
    // Ayarlarda "Reklam gizlilik seçenekleri" düğmesi gerekiyor mu?
    privacyRequired: () => st.privacy,
    privacyOptions: () => AdMob.showPrivacyOptionsForm().catch(() => {}),
  };
  if (document.readyState === 'complete') init(); else window.addEventListener('load', init);
})();
