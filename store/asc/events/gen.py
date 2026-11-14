# App Store uygulama içi etkinliği + hafta sonu tanıtım metni (10 dil). Uzunluk sınırlarını denetler, md üretir.
# Çalıştır: python3 store/asc/events/gen.py
import json, os
D = os.path.dirname(os.path.abspath(__file__))
# dil: (etkinlik adı ≤30, kısa açıklama ≤50, uzun açıklama ≤120, tanıtım metni ≤170)
E = {
 'tr': ('Büyük Dönüş Meydan Okuması', '0-2 geridesin. Maçı çevirebilir misin?',
        '55. dakika, deplasmanda 0-2 geridesin. Değişiklikleri yap, taktiği kur, maçı çevir. Herkese ücretsiz!',
        "Hafta sonu özel: Teknik Direktör modunda 'Büyük Dönüş' meydan okuması herkese ücretsiz! 55. dakikada 0-2 gerideyken maçı çevirebilir misin?"),
 'en': ('The Comeback Challenge', 'Down 0-2. Can you turn it around?',
        '55th minute, 0-2 down away from home. Make your subs, set your tactics and turn it around. Free for everyone!',
        "Weekend special: The Comeback challenge in Manager mode is free for everyone! 0-2 down in the 55th minute. Can you turn it around?"),
 'de': ('Das Comeback: Challenge', '0:2 hinten. Drehst du das Spiel?',
        '55. Minute, 0:2 auswärts hinten. Wechsle, stell die Taktik um und dreh das Spiel. Für alle kostenlos!',
        "Wochenend-Special: Die Challenge „Das Comeback“ im Trainer-Modus ist für alle kostenlos! In der 55. Minute 0:2 hinten. Drehst du das Spiel?"),
 'es': ('Desafío: El gran regreso', 'Pierdes 0-2. ¿Puedes darle la vuelta?',
        'Minuto 55, pierdes 0-2 fuera de casa. Haz cambios, ajusta la táctica y remonta. ¡Gratis para todos!',
        "Especial fin de semana: ¡el desafío «El gran regreso» del modo Entrenador es gratis para todos! Pierdes 0-2 en el minuto 55. ¿Puedes darle la vuelta?"),
 'fr': ('Défi : Le grand retour', 'Mené 0-2. Peux-tu renverser le match ?',
        "55e minute, mené 0-2 à l'extérieur. Fais tes changements, règle ta tactique et renverse le match. Gratuit !",
        "Spécial week-end : le défi « Le grand retour » du mode Entraîneur est gratuit pour tous ! Mené 0-2 à la 55e minute, peux-tu renverser le match ?"),
 'pt': ('Desafio: A volta por cima', 'Perdendo de 0 a 2. Consegue virar?',
        'Minuto 55, perdendo de 0 a 2 fora de casa. Faça substituições, ajuste a tática e vire o jogo. Grátis!',
        "Especial de fim de semana: o desafio “A volta por cima” do modo Treinador é grátis para todos! Perdendo de 0 a 2 aos 55 minutos. Consegue virar?"),
 'it': ('Sfida: Il grande ritorno', 'Sotto 0-2. Riesci a ribaltarla?',
        '55° minuto, sotto 0-2 in trasferta. Fai i cambi, imposta la tattica e ribalta la partita. Gratis per tutti!',
        "Speciale weekend: la sfida «Il grande ritorno» della modalità Allenatore è gratis per tutti! Sotto 0-2 al 55°, riesci a ribaltarla?"),
 'id': ('Tantangan Kebangkitan', 'Tertinggal 0-2. Bisa membalikkan?',
        'Menit 55, tertinggal 0-2 di kandang lawan. Lakukan pergantian, atur taktik, balikkan laga. Gratis!',
        "Spesial akhir pekan: tantangan Kebangkitan di mode Manajer gratis untuk semua! Tertinggal 0-2 di menit 55, bisakah kamu membalikkan laga?"),
 'ar': ('تحدي العودة', 'متأخر 0-2. هل تقلب النتيجة؟',
        'الدقيقة 55 وأنت متأخر 0-2 خارج أرضك. أجرِ التبديلات واضبط الخطة واقلب المباراة. مجانًا للجميع!',
        "عرض نهاية الأسبوع: تحدي «العودة» في وضع المدير الفني مجاني للجميع! متأخر 0-2 في الدقيقة 55، هل تستطيع قلب المباراة؟"),
 'ja': ('カムバック・チャレンジ', '0-2のビハインド。逆転できるか？',
        'アウェーで後半55分、0-2。選手交代と戦術で試合をひっくり返せ。誰でも無料でプレイ！',
        '週末スペシャル：監督モードのチャレンジ「カムバック」が誰でも無料！55分で0-2のビハインド、試合をひっくり返せるか？'),
}
LIM = (30, 50, 120, 170)
bad = [(l, i, len(v[i])) for l, v in E.items() for i in range(4) if len(v[i]) > LIM[i]]
assert not bad, bad
out = ['# App Store uygulama içi etkinliği: Büyük Dönüş Meydan Okuması', '',
       '**Nerede:** App Store Connect → Uygulama → Uygulama İçi Etkinlikler → (+)', '',
       '| Alan | Değer |', '|---|---|',
       '| Rozet (Badge) | Challenge (Meydan Okuma) |',
       '| Etkinlik amacı | Yeni kullanıcı çekmek (Attract new users) + Aktif kullanıcıları bilgilendirmek |',
       '| Öncelik | Normal |',
       '| Başlangıç / bitiş | 1.0.22 yayına girdiği gün başlat, 4 hafta sürsün (en fazla 31 gün) |',
       '| Ön gösterim (Publish start) | Başlangıçtan 3–7 gün önce (etkinlik önceden "Yakında" olarak görünür) |',
       '| Derin bağlantı (Deep link) | `starfoot://comeback` (1.0.22 ve sonrası; doğrudan meydan okumayı açar) |',
       '| Satın alma gerekir mi | Hayır (ilk meydan okuma herkese ücretsiz) |',
       '| Kart görseli (16:9) | `event_card_1920x1080.png` |',
       '| Detay görseli (9:16) | `event_detail_1080x1920.png` |', '']
for l, (n, s, d, _) in E.items():
    out += [f'## {l}', f'- **Ad** ({len(n)}/30): {n}', f'- **Kısa açıklama** ({len(s)}/50): {s}', f'- **Uzun açıklama** ({len(d)}/120): {d}', '']
out += ['---', '', '# Hafta sonu tanıtım metni (Promotional Text, ≤170)', '',
        'Yeni sürüm göndermeden App Store Connect → Uygulama → sürüm sayfasında hemen değiştirilebilir. Meydan okuma 1.0.21’de de var.', '']
for l, v in E.items():
    out += [f'- **{l}** ({len(v[3])}/170): {v[3]}']
open(os.path.join(D, 'comeback.md'), 'w').write('\n'.join(out) + '\n')
json.dump({l: dict(zip(['name', 'short', 'long', 'promo'], v)) for l, v in E.items()}, open(os.path.join(D, 'comeback.json'), 'w'), ensure_ascii=False, indent=1)
print('ok', {l: [len(x) for x in v] for l, v in E.items()})
