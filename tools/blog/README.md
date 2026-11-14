# StarFoot blog

Yazılar `tools/blog/posts/*.json` dosyalarında. Sayfaları üretmek için:

    python3 tools/blog/build.py

Komut şunları yeniden yazar: `blog/<dil>/<slug>/index.html`, `blog/<dil>/index.html`, `blog/<dil>/feed.xml`, `sitemap.xml`, `robots.txt`, `llms.txt`.
Eksik alan, uzun başlık/özet, alt yazısız görsel ya da kırık iç bağlantıda hata verip durur.

## Yeni yazı
Var olan bir JSON'u kopyala ve değiştir. Önemli alanlar:
- `slug`: adres (küçük harf, tire). `lang`: tr / en / de / nl.
- `group`: aynı yazının farklı dillerdeki sürümleri aynı grubu kullanır (hreflang için).
- `cluster` + `is_hub`: bir konunun ana rehberi `is_hub: true`; aynı kümedeki diğer yazılar ona bağlanır.
- `tldr`: en üstte, soruyu 2-3 cümlede doğrudan cevaplayan özet (yapay zekâ cevapları bunu alıntılar).
- `sections[].md`: paragraflar boş satırla; `- ` liste, `1. ` sıralı liste, `> ` not kutusu, `**kalın**`, `[metin](/bağlantı)`.
- `faq`: soru/cevap çiftleri (Google'da SSS olarak görünebilir).

Kurallar: rakip oyun adı yok, gerçek kulüp/oyuncu adı yok, oyunun olmayan bir özelliği yazılmaz, kendi oyunumuzdan söz ederken bunu açıkça belirtiriz.

## Yayın
Site Coolify'dan yayınlanır ve `[skip ci]` içeren kayıtları atlar. Yalnız site dosyalarını değiştiren kayıtlar `[skip ci]` olmadan atılır (Android/iOS derlemeleri bu klasörleri izlemez).
