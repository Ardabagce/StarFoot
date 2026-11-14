# 1.0.22: İngiltere / ABD / Almanya ASO + tüm diller için "Yenilikler" ve tanıtım metni.
# Çalıştır: python3 store/asc/aso_1022.py  (store/asc/metadata.json güncellenir; sınırlar denetlenir)
import json, os, re
P = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'metadata.json')
m = json.load(open(P))
L = m['locales']

ASO = {
 'en-US': dict(
  name='StarFoot: Soccer Career Sim',
  subtitle='Pro Player Life & Club Manager',
  keywords='football,legend,superstar,rookie,striker,simulator,rpg,league,cup,goal,transfer,penalty,offline',
  hook="Live your soccer dream from a street kickabout to world legend, then take over a club as manager. Two careers in one game: play the moments that decide every match, sign contracts, win trophies and build your story.\n\nNo energy timers and no subscriptions: play at your own pace, with optional one-time purchases only."),
 'en-GB': dict(
  name='StarFoot: Football Career Sim',
  subtitle='Pro Player Life & Club Manager',
  keywords='soccer,legend,superstar,footballer,striker,simulator,rpg,league,cup,goal,transfer,penalty,offline',
  hook="Live your football dream from a street kickabout to world legend, then take over a club as manager. Two careers in one game: play the moments that decide every match, sign contracts, win trophies and build your story.\n\nNo energy timers and no subscriptions: play at your own pace, with optional one-time purchases only."),
 'de-DE': dict(
  name='StarFoot: Fußball Karriere',
  subtitle='Fußballspiel: Profi & Trainer',
  keywords='fussball,manager,simulator,spieler,legende,star,stürmer,liga,pokal,transfer,elfmeter,offline',
  hook="Lebe deinen Fußballtraum: vom Straßenkick bis zur Weltlegende und danach als Trainer an der Seitenlinie. Zwei Karrieren in einem Spiel: Spiele die entscheidenden Momente jedes Spiels selbst, unterschreibe Verträge, gewinne Titel und schreib deine Geschichte.\n\nKeine Energie-Timer und keine Abos: Spiel in deinem eigenen Tempo, nur mit optionalen Einmalkäufen."),
}

# Yenilikler (1.0.22) ve tanıtım metni
WN = {
 'tr': ("Yeni vuruş tarzı ve Teknik Direktör zorluk seviyeleri!\n\n• Dokunuş: Ayarlar'dan seç. Geri çekip nişan al, sonra topun bir noktasına dokun. Yanlar falso, alt kısım aşırtma verir.\n• Teknik Direktör: Kolay, Orta ve Zor seviyeleri.\n• Hızlı altyapı: küçük yaşta oluştururken seç, altyapı sezonları 14 maç sürer.\n• Altyapıda oyuncun artık çocuk gibi görünür.\n• Maç ekranında ve meydan okumalarda iyileştirmeler.",
        "Yeni: Dokunuş vuruş tarzıyla gerçek falso, Teknik Direktör'de Kolay/Orta/Zor ve hızlı altyapı seçeneği. Hayalindeki futbol kariyerini yaz!"),
 'en': ("A new shooting style and Manager difficulty levels!\n\n• Touch: pick it in Settings. Pull back to aim, then tap a spot on the ball. The sides add curl, the bottom chips it.\n• Manager mode: Easy, Medium and Hard levels.\n• Fast academy: choose it when creating a young player, academy seasons last 14 matches.\n• Your player now looks like a kid in the academy.\n• Improvements to the match screen and challenges.",
        "New: Touch shooting with real curl, Easy/Medium/Hard Manager mode and a fast academy option. Write your own football story!"),
 'de': ("Neuer Schussstil und Schwierigkeitsstufen im Trainer-Modus!\n\n• Touch: in den Einstellungen wählen. Zum Zielen zurückziehen, dann auf eine Stelle am Ball tippen. Seiten geben Effet, unten wird es ein Lupfer.\n• Trainer-Modus: Leicht, Mittel und Schwer.\n• Schnelle Jugend: beim Erstellen eines jungen Spielers wählbar, Jugendsaisons dauern 14 Spiele.\n• In der Jugend sieht dein Spieler jetzt wie ein Kind aus.\n• Verbesserungen am Spielbildschirm und an den Challenges.",
        "Neu: Touch-Schüsse mit echtem Effet, Trainer-Modus in Leicht/Mittel/Schwer und schnelle Jugend. Schreib deine eigene Fußballgeschichte!"),
 'es': ("¡Nuevo estilo de tiro y niveles de dificultad en el modo Entrenador!\n\n• Toque: elígelo en Ajustes. Tira hacia atrás para apuntar y toca un punto del balón. Los lados dan efecto, la parte baja hace vaselina.\n• Modo Entrenador: niveles Fácil, Medio y Difícil.\n• Cantera rápida: elígela al crear un jugador joven, las temporadas duran 14 partidos.\n• En la cantera tu jugador ahora parece un niño.\n• Mejoras en la pantalla de partido y en los desafíos.",
        "Nuevo: tiros con efecto real en el estilo Toque, modo Entrenador Fácil/Medio/Difícil y cantera rápida. ¡Escribe tu propia historia!"),
 'fr': ("Nouveau style de tir et niveaux de difficulté en mode Entraîneur !\n\n• Touche : à choisir dans les Réglages. Tire vers l'arrière pour viser, puis touche un point du ballon. Les côtés donnent de l'effet, le bas fait un lob.\n• Mode Entraîneur : niveaux Facile, Moyen et Difficile.\n• Formation rapide : à choisir en créant un jeune joueur, les saisons durent 14 matchs.\n• En formation, ton joueur a maintenant l'air d'un enfant.\n• Améliorations de l'écran de match et des défis.",
        "Nouveau : tirs avec un vrai effet en style Touche, mode Entraîneur Facile/Moyen/Difficile et formation rapide. Écris ta propre histoire !"),
 'pt': ("Novo estilo de chute e níveis de dificuldade no modo Treinador!\n\n• Toque: escolha em Ajustes. Puxe para trás para mirar e toque num ponto da bola. Os lados dão efeito, a parte de baixo faz cavadinha.\n• Modo Treinador: níveis Fácil, Médio e Difícil.\n• Base rápida: escolha ao criar um jogador jovem, as temporadas duram 14 jogos.\n• Na base, seu jogador agora parece uma criança.\n• Melhorias na tela de partida e nos desafios.",
        "Novo: chutes com efeito de verdade no estilo Toque, modo Treinador Fácil/Médio/Difícil e base rápida. Escreva sua própria história!"),
 'ja': ("新しいシュート操作と監督モードの難易度！\n\n• タッチ：設定で選択。引いて狙い、ボールの一点をタップ。横はカーブ、下はループ。\n• 監督モード：やさしい・ふつう・むずかしい。\n• 高速ユース：若い選手の作成時に選択、ユースのシーズンは14試合。\n• ユースでは子どもらしい見た目に。\n• 試合画面とチャレンジを改善。",
        "新登場：本物のカーブが打てるタッチ操作、監督モードの3段階の難易度、高速ユース。自分だけのサッカー人生を！"),
}
LANG = {'tr': 'tr', 'en-US': 'en', 'en-GB': 'en', 'es-ES': 'es', 'es-MX': 'es', 'pt-BR': 'pt', 'pt-PT': 'pt', 'de-DE': 'de', 'fr-FR': 'fr', 'ja': 'ja'}

def kw_ok(loc, d):
    # anahtar kelimeler ad/alt başlıkta geçen kelimeleri tekrar etmesin (Apple zaten indeksliyor)
    used = set(w.lower() for w in re.findall(r"[\wäöüßÄÖÜ]+", d['name'] + ' ' + d['subtitle']))
    rep = [k for k in d['keywords'].split(',') if k.lower() in used]
    assert not rep, (loc, 'tekrar', rep)

for loc, d in ASO.items():
    assert len(d['name']) <= 30 and len(d['subtitle']) <= 30 and len(d['keywords'].encode()) <= 100, (loc, len(d['name']), len(d['subtitle']), len(d['keywords'].encode()))
    assert ' ' not in d['keywords'], loc
    kw_ok(loc, d)
    x = L[loc]
    x['name'], x['subtitle'], x['keywords'] = d['name'], d['subtitle'], d['keywords']
    # açıklamanın ilk paragrafını daha güçlü bir girişle değiştir (gerisi aynen kalır)
    desc = x['description']
    # önceki çalıştırmanın kancasını ya da özgün ilk paragrafı çıkar
    rest = desc.split('\n\n', 1)[1]
    if rest.startswith('No energy timers') or rest.startswith('Keine Energie-Timer'):
        rest = rest.split('\n\n', 1)[1]
    x['description'] = d['hook'] + '\n\n' + rest
    assert len(x['description']) <= 4000

for loc, lang in LANG.items():
    wn, promo = WN[lang]
    assert len(wn) <= 4000 and len(promo) <= 170, (loc, len(promo))
    L[loc]['whatsNew'] = wn
    L[loc]['promotionalText'] = promo

json.dump(m, open(P, 'w'), ensure_ascii=False, indent=2)
open(P, 'a').write('\n')
for loc, d in ASO.items():
    print(loc, len(d['name']), len(d['subtitle']), len(d['keywords'].encode()))
print('promo', {k: len(v[1]) for k, v in WN.items()})
