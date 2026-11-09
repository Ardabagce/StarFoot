# StarFoot tüm veritabanı (editör dosyası)

`starfoot-tum-veritabani.json`: oyundaki 518 kulübün ve 462 isimli oyuncunun kurgusal adları, editörün içe aktarma biçiminde.
`rehber.md`: hangi oyuncunun hangi kulüpte, hangi mevkide, kaç güçte olduğu (düzenlerken bakmak için).

## Nasıl düzenlenir
- `"c"` bölümü kulüpler: `"KİMLİK": ["Kulüp adı", "KISA"]`. Yalnız tırnak içindeki adı ve 2-4 harfli kısaltmayı değiştir; soldaki kimliğe dokunma.
- `"p"` bölümü oyuncular: `"Oyundaki ad": "Yeni ad"`. Yalnız sağdaki adı değiştir; soldaki ad oyunun oyuncuyu bulduğu anahtardır.
- Kulüp adı en fazla 28, oyuncu adı en fazla 32 karakter.

## Oyuna nasıl yüklenir
Ana menü › Editör › en altta metin kutusuna dosyanın tamamını yapıştır › "İçe aktar".
Varsayılana dönmek için aynı ekranda "Tümünü varsayılana döndür".

Not: Kadrodaki diğer oyuncular her kariyerde rastgele üretilir; onlar bu dosyada yer almaz.
