# Kurgusal isimler

Oyundaki oyuncu ve kulüp isimleri gerçek kişi ve kulüplerle karıştırılmasın diye kurgusaldır.

- `extract.js`: oyun verisindeki isim listelerini (`src.json`) çıkarır.
- `gen.py`: her isim için benzemeyen, deterministik kurgusal karşılık üretir (`map.json`). `fixed.json` elle verilenler (Efsanelerin İzinde karakterleri).
- `clubs.json`: yeniden adlandırılan kulüpler `[yeni ad, kısaltma, İngilizce]`.
- `apply.py`: değişiklikleri `js/` ve `tools/i18n/` kaynaklarına uygular, eski kayıtları taşımak için `js/namefix.js` üretir. Ardından `python3 tools/i18n/build.py` çalıştırılır.

Yeni gerçek bir isim eklenmemeli; oyuncular isimleri oyundaki Editör ile kendileri değiştirebilir.
