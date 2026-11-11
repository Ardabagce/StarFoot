// Reels 6 ("Bu ___ bir futbolcuya ait… O futbolcu sensin" kalıbının devamı): kupa vitrini, rekor transfer.
// Görseller: capture6.js (cabinet, ceremony, offers, career_sum) + assets4'ten post_trophy, wiki, mv_buzz.
// Render: cd store/social/motion && PAGE=reels6.html ASSETS=$PWD/assets6 COVER=75 node render_any.js r6_kupa ../reels6  (r6_transfer)

// 1) KUPA: "Bu kupa dolabı bir futbolcuya ait… O futbolcu sensin"
const vKupa = timeline([
  [1.6, (lt, d) => { full('cabinet', 1.18 + lt * 0.05, 0.5, 0.42); hook(lt, 'BU KUPA DOLABI', 'BİR FUTBOLCUYA AİT', 0.0, d - 0.05, 1480, 96, 116); }],
  [1.6, (lt, d) => { full('cabinet', 1.38 + lt * 0.07, 0.5, 0.45); flash(lt, 0, 0.18, 0.5); hook(lt, 'O FUTBOLCU', 'SENSİN', 0.0, d - 0.1, 1480, 96, 170); }],
  [2.5, (lt, d) => { darkBg(GOLDP, 'ŞAMPİYON', lt); whoosh(lt); confetti(lt, 0.2, 60, ['#ffd84a', '#ffffff', '#ffb02e']); phoneShot('ceremony', lt, d, { sy: 0.15, zoom0: 1.0, zoom1: 1.06 }); cap(lt, d, 'ŞAMPİYONLUK GECESİ', 'ÖDÜLLER SENİN', 230, 86, 120); }],
  [2.2, (lt, d) => { darkBg(BLUE, 'STARFEED', lt); whoosh(lt); phoneShot('post_trophy', lt, d, { sy: 0.3, zoom0: 1.04, zoom1: 1.1 }); cap(lt, d, 'KUPAYI KALDIR', 'TÜM DÜNYA GÖRSÜN', 230, 86, 116); }],
  [2.2, (lt, d) => { darkBg(BLUE, 'STARPEDIA', lt); whoosh(lt); phoneShot('wiki', lt, d, { sy: 0.1, zoom0: 1.0, zoom1: 1.06 }); cap(lt, d, 'ADIN', 'TARİHE YAZILSIN', 230, 86, 124); }],
  [3.4, (lt) => endBio4(lt, 'VİTRİNİNİ SEN DOLDUR')],
]);

// 2) TRANSFER: "Bu rekor transfer bir futbolcuya ait… O futbolcu sensin"
const vTransfer = timeline([
  [1.6, (lt, d) => { full('offers', 1.3 + lt * 0.05, 0.5, 0.58); hook(lt, 'BU REKOR TRANSFER', 'BİR FUTBOLCUYA AİT', 0.0, d - 0.05, 1480, 96, 116); }],
  [1.6, (lt, d) => { full('offers', 1.55 + lt * 0.08, 0.5, 0.58); flash(lt, 0, 0.18, 0.5); hook(lt, 'O FUTBOLCU', 'SENSİN', 0.0, d - 0.1, 1480, 96, 170); }],
  [2.4, (lt, d) => { darkBg(RED, 'TRANSFER', lt); whoosh(lt); phoneShot('offers', lt, d, { sy: 0.2, zoom0: 1.0, zoom1: 1.06 }); cap(lt, d, 'DEV KULÜPLER', 'KAPINDA SIRAYA GİRER', 230, 86, 112); }],
  [2.2, (lt, d) => { darkBg(BLUE, 'SÖYLENTİ', lt); whoosh(lt); phoneShot('mv_buzz', lt, d, { sy: 0.4, zoom0: 1.04, zoom1: 1.1 }); cap(lt, d, 'MANŞETLER', 'SENİ KONUŞUR', 230, 86, 124); }],
  [2.2, (lt, d) => { darkBg(GOLDP, 'KARİYER', lt); whoosh(lt); phoneShot('career_sum', lt, d, { sy: 0.15, zoom0: 1.0, zoom1: 1.06 }); cap(lt, d, 'REKOR BONSERVİS', 'SENİN ADINLA ANILIR', 230, 86, 112); }],
  [3.4, (lt) => endBio4(lt, 'REKOR TRANSFERİ SEN YAP')],
]);

Object.assign(VIDEOS, { r6_kupa: { dur: vKupa.dur, f: vKupa }, r6_transfer: { dur: vTransfer.dur, f: vTransfer } });
['r4_deger', 'r4_roportaj', 'r4_profil'].forEach((k) => delete VIDEOS[k]);
window.preload = () => {
  const list = ['cabinet', 'ceremony', 'offers', 'career_sum', 'post_trophy', 'wiki', 'mv_buzz'].map(shot);
  return Promise.all(list.map((i) => (i.complete && i.naturalWidth ? 1 : new Promise((r) => { i.onload = r; i.onerror = r; }))));
};
