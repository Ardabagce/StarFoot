// Reels 13: 15 sn sessiz tanıtım (Instagram animasyon dizisinin reklam arası için; seslendirmeyi yayıncı yapar).
// Akış: sokak → kritik an → penaltı → transfer teklifi → ödül töreni → telefon (garaj, Vitrin, tatil, magazin) → Starpedia → kapanış.
// Render: cd store/social/motion && PAGE=reels13.html ASSETS=$PWD/assets13 COVER=20 node render_any.js all ../reels13
// Tam ekran oyun görüntüsü + üstte başlık
function gm(name, label, a, b, o = {}) {
  return (lt, d) => {
    cutF(lt);
    full(name, lerp(o.z0 || 1.04, o.z1 || 1.12, E.io(seg(lt, 0, d))), o.fx || 0.5, o.fy || 0.5);
    vignette(0.45);
    cap(lt, d, a, b, o.y || 300, o.s1 || 80, o.s2 || 112);
    if (o.after) o.after(lt, d);
  };
}
// Telefon uygulamaları: art arda hızlı geçiş
function phoneMontage(list, P, a, b) {
  return (lt, d) => {
    const n = list.length, i = Math.min(n - 1, Math.floor(lt / (d / n))), li = lt - i * (d / n);
    darkBg(P, list[i][1], lt);
    if (li < 0.12) flash(li, 0, 0.12, 0.45);
    phoneFocus(list[i][0], li, d / n, list[i][2] || 0.15, 1.08, 1.13);
    cap(lt, d, a, b, 230, 80, 108);
    chip(list[i][1], 1760, seg(li, 0.05, 0.2));
  };
}
const v13 = timeline([
  [1.8, gm('e_street_mg', 'SOKAK', 'SOKAKTAN BAŞLA,', 'YILDIZ OL', { fy: 0.6, z0: 1.12, z1: 1.2 })],
  [1.7, gm('moment17', 'MAÇ', 'KRİTİK ANLARI', 'SEN OYNA', { fy: 0.55, z0: 1.1, z1: 1.18 })],
  [1.6, gm('e_kid_mg', 'PENALTI', 'PENALTIDA', 'GOLÜ SEN AT', { fy: 0.5, z0: 1.12, z1: 1.22, after: (lt) => confetti(lt, 0.9, 50, ['#ffd84a', '#ffffff']) })],
  [1.7, ph('offers', BLUE, 'TRANSFER', 'DEV KULÜPLER', 'SENİ İSTİYOR', 'TRANSFER TEKLİFLERİ', { sy: 0.2, z0: 1.06, z1: 1.12, s1: 80, s2: 108 })],
  [1.6, ph('ceremony', GOLDP, 'ÖDÜL', 'KUPALAR VE', 'ALTIN YILDIZ', 'ŞAMPİYONLUK · GOL KRALLIĞI', { sy: 0.15, z0: 1.04, z1: 1.1, s1: 80, s2: 108, after: (lt) => confetti(lt, 0.1, 70, ['#ffd84a', '#ffffff', '#ffb02e']) })],
  [2.4, phoneMontage([['garage', 'GARAJIM', 0.15], ['shop', 'VİTRİN', 0.2], ['travel', 'TATİL', 0.1], ['mag', 'MAGAZİN', 0.1]], PNK, 'TELEFONUNDA', 'KOCA BİR HAYAT')],
  [1.6, ph('hofwiki', BLUE, 'STARPEDIA', 'EFSANE OLUNCA', 'STARPEDIA SAYFAN', null, { sy: 0.2, z0: 1.05, z1: 1.12, s1: 80, s2: 108 })],
  [2.6, (lt) => endBoth(lt, 'FUTBOL KARİYER OYUNU')],
]);
Object.keys(VIDEOS).forEach((k) => delete VIDEOS[k]);
VIDEOS.r13_tanitim = { dur: v13.dur, f: v13 };
window.preload = () => {
  const list = ['e_street_mg', 'moment17', 'e_kid_mg', 'offers', 'ceremony', 'garage', 'shop', 'travel', 'mag', 'hofwiki'].map(shot);
  list.push(icon);
  return Promise.all(list.map((i) => (i.complete && i.naturalWidth ? 1 : new Promise((r) => { i.onload = r; i.onerror = r; }))));
};
