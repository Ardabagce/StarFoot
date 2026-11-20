# 1.0.26: Türkiye ASO (alt başlık + anahtar kelimeler) ve tüm diller için "Yenilikler" ile tanıtım metni.
# Çalıştır: python3 store/asc/aso_1026.py  (store/asc/metadata.json güncellenir; sınırlar denetlenir)
import json, os, re
P = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'metadata.json')
m = json.load(open(P))
L = m['locales']

# Türkiye: ad aynı kalır ("starfoot" ve "futbolcu kariyer" aramalarında üstteyiz).
# Alt başlık "futbolcu", "futbolcu ol(ma)", "hayat simülasyonu" aramalarını hedefler;
# anahtar kelimeler ad/alt başlıkta geçen kelimeleri tekrar etmez (Apple ikisini birleştirir: "futbol menajer", "teknik direktör oyunu" vb.)
ASO = {
 'tr': dict(
  subtitle='Futbolcu Ol: Hayat Simülasyonu',
  keywords='menajer,teknik,direktör,simülatör,yaşam,transfer,penaltı,kaleci,efsane,altyapı,lig,kupa,maç'),
}

WN = {
 'tr': ("Yeni: Penaltı atışları, gol tekrarı ve menajerle transfer görüşmesi!\n\n• Kupada eşitlik: uzatma ve penaltı atışları. Atışını sen kullan; kaleciysen kalede sen dur.\n• Gol tekrarı: attığın golü ağır çekimde izle.\n• Menajerinle masaya otur: maaş, süre, imza parası, ilk 11 sözü, serbest kalma maddesi.\n• Deplasman formaları, daha canlı maç anlatımı, duraklat ve 0.5x hız.\n• Maç sonu istatistikleri; altyapı ve profesyonel istatistikler ayrı.\n• Adını ve görünümünü ücretsiz değiştir.\n• StarDeğer telefonda, Avrupa Altın Ayakkabı ve denge iyileştirmeleri.",
        "Yeni: Penaltı atışları, gol tekrarı, menajerle transfer görüşmesi ve deplasman formaları! Sokaktan dünya yıldızlığına futbol kariyerini yaz."),
 'en': ("New: penalty shootouts, goal replays and contract talks with your agent!\n\n• Cup draws go to extra time and penalties. Take your own kick, or stand in goal as a keeper.\n• Goal replay: watch your goal again in slow motion.\n• Sit down with your agent: salary, length, signing bonus, a starting-place promise and a release clause.\n• Away kits, livelier match commentary, pause and 0.5x speed.\n• Post-match stats; academy and professional stats shown separately.\n• Change your name and look for free.\n• StarValue on your phone, the European Golden Boot and balance improvements.",
        "New: penalty shootouts, goal replays, contract talks with your agent and away kits! Write your football career from the streets to world stardom."),
 'es': ("Novedades: tandas de penaltis, repeticiones de goles y negociación con tu agente.\n\n• Los empates de copa van a la prórroga y a los penaltis. Lanza tu penalti o, si eres portero, defiende la portería.\n• Repetición del gol a cámara lenta.\n• Negocia con tu agente: sueldo, duración, prima de fichaje, titularidad y cláusula de rescisión.\n• Equipaciones de visitante, narración más viva, pausa y velocidad 0.5x.\n• Estadísticas del partido; cantera y profesional por separado.\n• Cambia tu nombre y aspecto gratis.\n• StarValor en el móvil, Bota de Oro Europea y mejoras de equilibrio.",
        "Novedades: tandas de penaltis, repeticiones de goles, negociación con tu agente y equipaciones de visitante. ¡Escribe tu carrera de la calle al estrellato!"),
 'pt': ("Novidades: disputa de pênaltis, replay dos gols e negociação com seu empresário!\n\n• Empates nas copas vão para a prorrogação e os pênaltis. Cobre o seu ou, como goleiro, fique no gol.\n• Replay do gol em câmera lenta.\n• Negocie com seu empresário: salário, duração, luvas, titularidade e multa rescisória.\n• Uniformes de visitante, narração mais viva, pausa e velocidade 0.5x.\n• Estatísticas da partida; base e profissional separadas.\n• Mude seu nome e visual de graça.\n• StarValor no celular, Chuteira de Ouro Europeia e ajustes de equilíbrio.",
        "Novidades: disputa de pênaltis, replay dos gols, negociação com seu empresário e uniformes de visitante. Escreva sua carreira das ruas ao estrelato!"),
 'de': ("Neu: Elfmeterschießen, Tor-Wiederholungen und Vertragsgespräche mit deinem Berater!\n\n• Unentschieden im Pokal gehen in die Verlängerung und ins Elfmeterschießen. Schieß selbst oder steh als Torwart im Tor.\n• Tor-Wiederholung in Zeitlupe.\n• Verhandle mit deinem Berater: Gehalt, Laufzeit, Handgeld, Stammplatzgarantie und Ausstiegsklausel.\n• Auswärtstrikots, lebendigere Kommentare, Pause und 0.5x Tempo.\n• Spielstatistiken; Jugend- und Profistatistik getrennt.\n• Name und Aussehen kostenlos ändern.\n• StarWert auf dem Handy, Europäischer Goldener Schuh und Balance-Verbesserungen.",
        "Neu: Elfmeterschießen, Tor-Wiederholungen, Vertragsgespräche mit deinem Berater und Auswärtstrikots! Schreib deine Karriere vom Bolzplatz bis zum Weltstar."),
 'fr': ("Nouveau : tirs au but, ralentis des buts et négociations avec ton agent !\n\n• Les nuls en coupe vont aux prolongations puis aux tirs au but. Tire toi-même ou garde les buts.\n• Ralenti de ton but.\n• Négocie avec ton agent : salaire, durée, prime à la signature, titularisation et clause libératoire.\n• Maillots extérieur, commentaires plus vivants, pause et vitesse 0.5x.\n• Statistiques du match ; formation et pro séparées.\n• Change ton nom et ton apparence gratuitement.\n• StarValeur sur ton téléphone, Soulier d'or européen et équilibrage.",
        "Nouveau : tirs au but, ralentis des buts, négociations avec ton agent et maillots extérieur ! Écris ta carrière, de la rue à la gloire mondiale."),
 'nl': ("Nieuw: strafschoppenseries, herhalingen van doelpunten en contractgesprekken met je zaakwaarnemer!\n\n• Gelijkspel in de beker gaat naar verlenging en strafschoppen. Neem je eigen penalty of sta als keeper in het doel.\n• Herhaling van je doelpunt in slow motion.\n• Onderhandel met je zaakwaarnemer: salaris, looptijd, tekengeld, basisplaats en afkoopclausule.\n• Uittenues, levendiger commentaar, pauze en 0.5x snelheid.\n• Wedstrijdstatistieken; jeugd en profs apart.\n• Verander gratis je naam en uiterlijk.\n• StarWaarde op je telefoon, de Europese Gouden Schoen en balansverbeteringen.",
        "Nieuw: strafschoppenseries, herhalingen, contractgesprekken met je zaakwaarnemer en uittenues! Schrijf je carrière van straatvoetbal tot wereldster."),
 'ja': ("新機能：PK戦、ゴールリプレイ、代理人との契約交渉！\n\n・カップ戦の引き分けは延長戦とPK戦へ。自分でキック、GKならゴールを守る。\n・自分のゴールをスローで再生。\n・代理人と交渉：年俸、期間、契約金、先発の約束、契約解除条項。\n・アウェーユニフォーム、臨場感ある実況、一時停止と0.5倍速。\n・試合後スタッツ、ユースとプロの成績を分けて表示。\n・名前と見た目を無料で変更。\n・StarValueがスマホに、欧州ゴールデンシュー、バランス調整。",
        "新機能：PK戦、ゴールリプレイ、代理人との契約交渉、アウェーユニフォーム！路上からワールドスターへ、君のサッカー人生を描こう。"),
}
LANG = {'tr': 'tr', 'en-US': 'en', 'en-GB': 'en', 'es-ES': 'es', 'es-MX': 'es', 'pt-BR': 'pt', 'pt-PT': 'pt', 'de-DE': 'de', 'fr-FR': 'fr', 'nl-NL': 'nl', 'ja': 'ja'}

for loc, d in ASO.items():
    x = L[loc]
    x.update(d)
    used = set(w.lower() for w in re.findall(r"\w+", x['name'] + ' ' + x['subtitle']))
    rep = [k for k in x['keywords'].split(',') if k.lower() in used]
    assert not rep, (loc, rep)
    assert len(x['subtitle']) <= 30, (loc, len(x['subtitle']))
    assert len(x['keywords'].encode()) <= 100, (loc, len(x['keywords'].encode()))
for loc, lang in LANG.items():
    wn, promo = WN[lang]
    assert len(wn) <= 4000 and len(promo) <= 170, (loc, len(wn), len(promo))
    L[loc]['whatsNew'] = wn
    L[loc]['promotionalText'] = promo
json.dump(m, open(P, 'w'), ensure_ascii=False, indent=2)
print('tamam', {k: (len(L[k]['subtitle']), len(L[k]['keywords'].encode())) for k in ASO}, {k: len(v[1]) for k, v in WN.items()})
