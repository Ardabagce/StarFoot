# Çeviri araçları (Türkçe → İngilizce)

Oyun metinleri kodda Türkçe yazılır. İngilizce seçiliyse `js/i18n.js` ekrana çıkan metni `js/lang-en.js` sözlüğüyle çevirir.

- `extract.py` — `js/*.js` ve `index.html` içindeki metinleri tarar (`src_strings.json`). Yeni metin eklediğinde çalıştır ve yeni anahtarları gör.
- `keys.json` + `t0.json`…`t6.json` — sırayla eşleşen anahtarlar ve İngilizce karşılıkları (`{}` = değişken, `{0}` = sıralı değişken, `null` = çevrilmez).
- `extra.json` — elle eklenen/öncelikli çeviriler. Yeni metinleri buraya eklemek en kolayı.
- `clubs_en.json` — yabancı kulüp adları (yalnız takma adı olanlar çevrilir).
- `build.py` — hepsini birleştirip `js/lang-en.js` dosyasını üretir: `python3 tools/i18n/build.py`
