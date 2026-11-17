// Reels 12: telefon yenilikleri tek hikâyede (~33 sn). 15 yaşında cebinde 0 ₺ olan çocuk → ilk maaş → ilk araba → garaj →
// villa → Vitrin → tatil → magazin → kendi markası → heykel → emeklilik → Efsaneler Salonu'nda Starpedia sayfası.
// Render: cd store/social/motion && PAGE=reels12.html ASSETS=$PWD/assets12 COVER=45 node render_any.js all ../reels12
// Ses: node sfx12.js ../reels12
const ORG = { id: 'ORG', c1: '#e2611a', c2: '#ffffff' };
const GRN = { id: 'GRN', c1: '#0b6b49', c2: '#ffffff' };
const PNK = { id: 'PNK', c1: '#b0124a', c2: '#ffffff' };
const SKY = { id: 'SKY', c1: '#0a6fb5', c2: '#ffffff' };
// Sahne: koyu arka plan + telefonda ekran + üstte iki satır başlık + altta bilgi çipi
function ph(name, P, label, a, b, chipTxt, o = {}) {
  return (lt, d) => {
    cutF(lt); darkBg(P, label, lt);
    phoneFocus(name, lt, d, o.sy || 0, o.z0 || 1.08, o.z1 || 1.14);
    cap(lt, d, a, b, 230, o.s1 || 84, o.s2 || 116);
    if (chipTxt) chip(chipTxt, 1760, seg(lt, 0.45, 0.75));
    if (o.after) o.after(lt, d);
  };
}
const vHayat = timeline([
  // KANCA: cebinde 0 ₺
  [3.0, (lt, d) => {
    darkBg(ORG, 'EK İŞ', lt); phoneFocus('jobs', lt, d, 0, 1.12, 1.2);
    hook(lt, '15 YAŞINDAYDIM,', 'CEBİMDE 0 ₺ VARDI', 0.0, d - 0.1, 1420, 86, 124);
    chip('TELEFONUM HER ŞEYİ HATIRLIYOR', 1720, seg(lt, 1.0, 1.3));
  }],
  [2.3, ph('jobs', ORG, 'EK İŞ', 'ÖNCE EK İŞLERLE', 'HARÇLIĞIMI ÇIKARDIM', 'KAFE · KARGO · FUTBOL DERSİ', { sy: 0.2, z0: 1.15, z1: 1.2 })],
  [2.5, ph('bank_tx', BLUE, 'BANKA', 'SONRA 18\'İMDE', 'İLK MAAŞIM YATTI', 'HER KURUŞ HESAP HAREKETLERİNDE', { sy: 0.25, z0: 1.12, z1: 1.18 })],
  [2.2, ph('cars', RED, 'ARABALAR', 'İLK ARABAMI', 'ALDIM', null, { sy: 0.1, z0: 1.1, z1: 1.16 })],
  [2.4, ph('garage', RED, 'GARAJIM', 'AMA BİR ARABA', 'YETMEDİ', 'GARAJIM: 8 ARAÇ · JET · YAT', { sy: 0.15, z0: 1.05, z1: 1.12 })],
  [2.2, ph('emlak', SKY, 'EVİM EMLAK', 'KİRADAN', 'VİLLAYA TAŞINDIM', null, { sy: 0.15, z0: 1.08, z1: 1.14 })],
  [2.2, ph('shop', PNK, 'VİTRİN', 'VİTRİN\'DE', 'YÜZLERCE ÜRÜN', 'SAAT · AYAKKABI · TEKNOLOJİ', { sy: 0.2, z0: 1.08, z1: 1.14 })],
  [2.4, ph('travel', SKY, 'SEYAHAT', 'SEZON BİTTİ:', 'TATİL ZAMANI', 'MALDİVLER · KAPADOKYA · EGE', { sy: 0.1, z0: 1.1, z1: 1.16 })],
  [3.0, ph('mag', PNK, 'MAGAZİN', 'AMA MAGAZİN', 'PEŞİMİ BIRAKMADI', null, { sy: 0.1, z0: 1.1, z1: 1.16, after: (lt, d) => shareAsk(lt - 0.5, d - 0.5, 'BUNU ÜNLÜ OLACAK', 'ARKADAŞINA GÖNDER', 1520) })],
  [2.4, ph('biz', GRN, 'YATIRIM', 'BU YÜZDEN', 'KENDİ MARKAMI KURDUM', 'GİYİM MARKASI · KAFE · DAİRELER', { sy: 0.15, z0: 1.1, z1: 1.16, s2: 104 })],
  [2.3, ph('legacy', GOLDP, 'MİRAS', 'KULÜBÜN ÖNÜNE', 'HEYKELİM DİKİLECEK', null, { sy: 0.4, z0: 1.12, z1: 1.18, s2: 104 })],
  [2.2, (lt, d) => { cutF(lt); full('hof', 1.05 + lt * 0.03, 0.5, 0.5); hook(lt, 'VE BİR GÜN', 'EMEKLİ OLDUM', 0.0, d - 0.05, 1500, 88, 124); }],
  [2.8, ph('hofwiki', BLUE, 'STARPEDIA', 'AMA HİKÂYEM', 'SİLİNMEDİ', 'EFSANELER SALONU\'NDA STARPEDIA SAYFAM', { sy: 0.2, z0: 1.05, z1: 1.12, after: (lt) => confetti(lt, 0.3, 60, ['#ffd84a', '#ffffff']) })],
  [3.6, (lt) => endBoth(lt, 'HAYATINI SEN YAZ')],
]);
Object.keys(VIDEOS).forEach((k) => delete VIDEOS[k]);
VIDEOS.r12_hayat = { dur: vHayat.dur, f: vHayat };
window.preload = () => {
  const list = ['jobs', 'bank_tx', 'cars', 'garage', 'emlak', 'shop', 'travel', 'mag', 'biz', 'legacy', 'hof', 'hofwiki'].map(shot);
  list.push(icon);
  return Promise.all(list.map((i) => (i.complete && i.naturalWidth ? 1 : new Promise((r) => { i.onload = r; i.onerror = r; }))));
};
