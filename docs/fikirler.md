# Sonraki güncellemeler için fikirler

## Maaş artışı talebi (oyuncu geri bildirimi, 1.0.12 · iPad)
Amaç: Sevdiğin kulüpte kalırken iyi performansın karşılığını alabilmek; sırf maaş düşük diye kulüp değiştirmek zorunda kalmamak.

Kurallar (suistimale kapalı):
- Sezonda en fazla 1 kez; sezonun ilk üçte biri geçmeden ve yeni sözleşme imzaladıktan sonraki ilk yarı sezonda açılmaz.
- Şart: en az 8 maçta ortalama reyting ≥ 7.0 YA DA mevkiye göre güçlü istatistik (forvet: gol+asist, kaleci: gol yememe vb.)
  VE mevcut maaş, oyuncunun piyasa değerine göre en az %15 düşük.
- Artış = piyasa değeriyle aradaki farkın bir kısmı; kulübün gücüne göre tavan:
  büyük kulüp ~%40'a kadar, orta ~%20, küçük kulüp ~%5-12 (kulübün maaş tavanını aşamaz).
- Kabul şansı performans, hoca/yönetim ilişkisi ve istenen miktara bağlı. Fazla istemek reddi ve ilişki düşüşünü getirir.
- Red: o sezon yeniden istenemez, yönetim ilişkisi biraz düşer. Kulüp karşılığında +1 yıl sözleşme uzatması isteyebilir.
- Ücretsiz özellik (Premium değil); Premium'daki "transfer talebi"nin yanında Kariyer ekranında durur.

## Piyasa değeri sayfası – Transfermarkt tarzı, telifsiz (KESİN YAPILACAK, 1.0.14)
Amaç: Premium'a Starpedia ve Instagram gibi ilgi çeken yeni ana özellik. Önce oynanabilir taslak (artifact), onaydan sonra oyuna.

Telif kuralları:
- İsim tamamen farklı: "StarDeğer" / "Futbol Borsası" / "Piyasa" (asla "Transfermarkt", "-markt", "TM").
- Kendi görsel dilimiz (StarFoot kartları); onların renk/düzen/ikonları taklit edilmez.
- Tüm veriler oyun içi ve kurgusal; dışarıdan veri çekilmez, gerçek kişi/değer yok.
- Mağaza ve reklamlarda gerçek siteye atıf yok.

Ücretsiz: kendi güncel piyasa değeri + son maçtan beri değişim (yeşil/kırmızı ok).
Premium:
- Kariyer boyunca değer grafiği; zirvelerin yanında sebebi (kupa, hat-trick, transfer).
- Transfer geçmişi (kulüp, yıl, bonservis; kiralık ve serbest transferler).
- Dünya listeleri: en değerli 100, lig/kulüp en değerlileri, rekor transferler.
- Kulübün toplam kadro değeri ve ligdeki sırası.
- Söylenti köşesi: oyundaki gerçek tekliflerle bağlantılı kurgusal dedikodular.
- Karşılaştırma: aynı yaştaki en iyiler ve efsanelerin aynı yaştaki değeri.
- Sözleşmesi biten oyuncular listesi (maaş artışı talebiyle bağlantılı).
Büyüme: değer artışları Instagram'a paylaşılabilir kart ("Piyasa değerim 80 M €"); Starpedia gibi bir kez ücretsiz deneme
(ör. ilk büyük transferde grafik bir kez tam açılır). Mağaza ekran görüntülerinden biri bu sayfaya ayrılır.

## Satış artırma notları (1.0.14 öncesi veri)
- Firebase'de `source` özel boyutunu ekle; premium_purchase'ı kaynağa göre ve premium_taste'i gün gün izle.
- Fikirler: dönen ücretsiz deneme (her birkaç günde farklı Premium özelliği), heyecan anlarında teklif (ilk kupa / büyük transfer),
  ilk günlere özel indirim, Premium+ fiyatını yanında göstermek. Günde en fazla 1 hatırlatma kuralı korunur.

## Bekleyen diğer işler
- Meta SDK + SKAdNetwork (Instagram reklam ölçümü) – 1.0.14.
- 1.0.13 (build 198) Apple incelemesinde; çizim belleği düzeltmesi dahil.

## Destekçi programı (VIP puanı + rütbeler) – tekrar alınabilir satın alma
Amaç: Oyunu seven oyuncuların istedikleri kadar destek olabilmesi. Pay-to-win yok: sadece rozet, görünüm ve gurur.

Ürünler (consumable): destek_kucuk 0,99 $ = 100 puan · destek_buyuk 4,99 $ = 550 puan · destek_dev 19,99 $ = 2.400 puan.
Rütbeler: Bronz 100 · Gümüş 500 · Altın 2.000 · Platin 5.000 · Efsane 10.000 puan. Ayarlar ve profilde "sonraki rütbeye X puan" çubuğu.
Ödüller (hepsi kozmetik): her rütbe rozeti profil/Instagram/Starpedia'da; Gümüş kart çerçevesi; Altın özel gol sevinci + krampon rengi;
Platin Starpedia "Kurucu Destekçi" bölümü + tema; Efsane "Efsane Destekçi" unvanı (haberlerde geçer). Her alımda teşekkür animasyonu.
Kurallar:
- Puanlar kariyere değil hesaba bağlı: iCloud meta + cihaz dosya yedeği (consumable'lar Apple'da geri yüklenmez).
- Premium otomatik verilmez (Apple, consumable ile kalıcı özellik açılmasını sorun edebilir); Premium ayrı kalır.
- Düğme Ayarlar'ın üstünde ve profilde; kendiliğinden açılan pencere yok (en fazla mutlu anlarda, ayda 1).
- "Bağış/yardım" ifadesi yok, "geliştiriciyi destekle". Ortak destekçi listesi şimdilik yok (sunucu gerekir).
- Firebase: tip_view / tip_purchase olayları.

## Android satın almaları (Play Console)
Kullanıcı: ödeme profili, test kanalında build, ürünleri iOS ile aynı kimliklerle aç (starfoot_premium, starfoot_plus2, starfoot_plus2_upg,
starfoot_wc, starfoot_legends), RevenueCat'e Google Play + hizmet hesabı JSON, lisans test kullanıcısı.
Kod: PREMIUM_PLATFORMS'a 'android', RevenueCat Android public key (goog_...), test build.
