// Firebase kullanıcı özellikleri (1.0.29): raporları kullanıcı türüne göre ayırabilmek için.
// Değer değişince bir kez yazılır; kişisel bilgi içermez.
const AProps = {
  last: {},
  F() { const C = window.Capacitor; return C && C.Plugins && C.Plugins.FirebaseAnalytics; },
  tier() {
    try {
      if (typeof Diamond !== 'undefined' && Diamond.active) return 'diamond';
      if (typeof Plus !== 'undefined' && Plus.active) return 'premium_plus';
      if (typeof Premium !== 'undefined' && Premium.active) return 'premium';
    } catch (e) { /* yok */ }
    return 'free';
  },
  stage() {
    try {
      const s = typeof Game !== 'undefined' && Game.state;
      if (!s || !s.player) return typeof Coach !== 'undefined' && Coach.state ? 'manager' : 'menu';
      if (Game.inStreet()) return 'street';
      if (Game.isYouth()) return 'academy';
      return s.player.position === 'GK' ? 'pro_keeper' : 'pro';
    } catch (e) { return ''; }
  },
  sync() {
    const F = AProps.F();
    if (!F || !F.setUserProperty) return;
    const v = {
      app_version: typeof APP_VER !== 'undefined' ? APP_VER : '',
      game_language: (typeof I18N !== 'undefined' && I18N.lang) || 'tr',
      buyer_tier: AProps.tier(),
      career_stage: AProps.stage(),
      home_layout: typeof Hub !== 'undefined' && Hub.classic && Hub.classic() ? 'classic' : 'hub',
    };
    Object.entries(v).forEach(([key, value]) => {
      if (AProps.last[key] === value) return;
      AProps.last[key] = value;
      try { F.setUserProperty({ key, value: String(value).slice(0, 36) }).catch(() => {}); } catch (e) { /* yok */ }
    });
  },
};
setTimeout(() => AProps.sync(), 4000);
setInterval(() => AProps.sync(), 60000);
