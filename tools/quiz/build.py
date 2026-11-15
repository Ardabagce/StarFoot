#!/usr/bin/env python3
"""Mevki testi sayfaları: /mevki-testi/ (tr), /position-quiz/ (en), /positionstest/ (de).
Kullanım: python3 tools/quiz/build.py   (test mantığı: quiz/quiz.js)"""
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SITE = 'https://starfoot.bagce.dev'
URLS = {'tr': '/mevki-testi/', 'en': '/position-quiz/', 'de': '/positionstest/'}

P = {
    'tr': {
        'title': 'Hangi mevkiye uygunsun? Futbol mevki testi (8 soru)',
        'desc': 'Kaleci mi, stoper mi, on numara mı, santrfor mu? 8 soruluk ücretsiz futbol mevki testiyle sana en uygun mevkiyi öğren ve sonucu paylaş.',
        'h1': 'Hangi mevkiye uygunsun?',
        'lead': '8 kısa soruya cevap ver; oyun tarzına ve karakterine en uygun futbol mevkisini söyleyelim. Ücretsiz, kayıt yok, 1 dakika sürer.',
        'pos_h': 'Futbolda mevkiler ve görevleri',
        'pos': [
            ('Kaleci', 'Kaleyi korur, savunmayı yönetir ve oyunu geriden başlatır. Refleks, cesaret ve iletişim en önemli özellikleridir.'),
            ('Stoper', 'Savunmanın ortasında forvetleri durdurur. Hava topu, zamanlama ve liderlik ister.'),
            ('Bek', 'Kanatta hem savunur hem hücuma katılır. Dayanıklılık, hız ve orta yapma becerisi önemlidir.'),
            ('Ön libero', 'Savunmanın önünde top kapar ve oyunu dengeler. Pozisyon bilgisi ve sade pas oyunu ister.'),
            ('Merkez orta saha', 'Takımın motorudur; savunmaya da hücuma da katılır, oyunun temposunu belirler.'),
            ('On numara', 'Rakip ceza sahası önünde yaratıcılıkla son pası verir ya da golü atar.'),
            ('Kanat', 'Hız ve çalımla rakibi bire birde geçer, orta yapar ya da içeri kat edip şut çeker.'),
            ('Santrfor', 'Ceza sahasında gol arar; doğru yerde durmak ve tek dokunuşla bitirmek işidir.'),
        ],
        'faq_h': 'Sık sorulan sorular',
        'faq': [
            ('Bu test gerçek bir değerlendirme mi?', 'Hayır, eğlence amaçlı bir testtir. Gerçek mevkini antrenörün, oynadıkça gördüğü güçlü yönlerine göre belirler. Yine de hangi rollerde keyif aldığını düşünmek için iyi bir başlangıçtır.'),
            ('Sonucumu nasıl paylaşırım?', 'Sonuç ekranındaki "Sonucu paylaş" düğmesine dokun. Telefonda paylaşım menüsü açılır, bilgisayarda bağlantı kopyalanır.'),
            ('Mevkimi oyunda deneyebilir miyim?', 'Evet. Bizim geliştirdiğimiz StarFoot\'ta kaleci, defans, orta saha ya da forvet olarak 8 yaşında başlayıp kariyer yapabilirsin. iPhone ve Android\'de ücretsiz.'),
        ],
        'more': 'Daha fazlası: [futbolda mevkiler ve görevleri](/blog/tr/futbolda-mevkiler-ve-gorevleri/) · [futbol altyapısına nasıl girilir](/blog/tr/futbol-altyapisina-nasil-girilir/)',
        'own': 'Bu sayfa StarFoot ekibi tarafından hazırlanmıştır.', 'priv': 'Gizlilik',
    },
    'en': {
        'title': 'Which football position suits you? Free quiz (8 questions)',
        'desc': 'Goalkeeper, centre-back, number 10 or striker? Take this free 8-question football position quiz, find your best position and share the result.',
        'h1': 'Which football position suits you?',
        'lead': 'Answer 8 quick questions and we will tell you the football position that fits your style and personality. Free, no sign-up, takes a minute.',
        'pos_h': 'Football positions explained',
        'pos': [
            ('Goalkeeper', 'Protects the goal, organises the defence and starts play from the back. Reflexes, courage and communication matter most.'),
            ('Centre-back', 'Stops strikers in the middle of the defence. Needs aerial strength, timing and leadership.'),
            ('Full-back', 'Defends and attacks down the flank. Stamina, pace and crossing are key.'),
            ('Defensive midfielder', 'Wins the ball in front of the defence and keeps the team balanced. Needs positioning and simple passing.'),
            ('Central midfielder', 'The engine of the team: helps in defence and attack and sets the tempo.'),
            ('Number 10', 'Creates in front of the box, playing the final pass or scoring.'),
            ('Winger', 'Beats defenders one-on-one with pace and dribbling, then crosses or cuts inside to shoot.'),
            ('Striker', 'Hunts goals in the box: being in the right place and finishing first time.'),
        ],
        'faq_h': 'FAQ',
        'faq': [
            ('Is this a real assessment?', 'No, it is a fun quiz. Your real position is decided by your coach based on your strengths. It is still a good way to think about which roles you enjoy.'),
            ('How do I share my result?', 'Tap "Share result" on the result screen. On a phone the share menu opens; on a computer the link is copied.'),
            ('Can I try my position in a game?', 'Yes. In StarFoot, the game we make, you can start a career aged 8 as a goalkeeper, defender, midfielder or forward. Free on iPhone and Android.'),
        ],
        'more': 'More: [offline football career game for iPhone](/blog/en/offline-football-career-game-iphone/)',
        'own': 'This page is made by the StarFoot team.', 'priv': 'Privacy',
    },
    'de': {
        'title': 'Welche Position passt zu dir? Fußball-Positionstest (8 Fragen)',
        'desc': 'Torwart, Innenverteidiger, Zehner oder Mittelstürmer? Finde mit dem kostenlosen Fußball-Positionstest in 8 Fragen deine Position und teile dein Ergebnis.',
        'h1': 'Welche Position passt zu dir?',
        'lead': 'Beantworte 8 kurze Fragen und wir sagen dir, welche Fußballposition zu deinem Stil und Charakter passt. Kostenlos, ohne Anmeldung, dauert eine Minute.',
        'pos_h': 'Die Positionen im Fußball',
        'pos': [
            ('Torwart', 'Hält das Tor sauber, dirigiert die Abwehr und eröffnet das Spiel. Reflexe, Mut und Kommunikation sind am wichtigsten.'),
            ('Innenverteidiger', 'Stoppt Stürmer im Abwehrzentrum. Braucht Kopfballstärke, Timing und Führungsqualität.'),
            ('Außenverteidiger', 'Verteidigt und greift über die Flügel an. Ausdauer, Tempo und Flanken sind entscheidend.'),
            ('Defensiver Mittelfeldspieler', 'Erobert Bälle vor der Abwehr und hält das Team im Gleichgewicht.'),
            ('Zentraler Mittelfeldspieler', 'Der Motor des Teams: hilft hinten und vorne und bestimmt das Tempo.'),
            ('Zehner', 'Der kreative Spielmacher vor dem Strafraum, der den letzten Pass spielt oder selbst trifft.'),
            ('Flügelspieler', 'Geht mit Tempo und Dribbling ins Eins-gegen-eins, flankt oder zieht nach innen.'),
            ('Mittelstürmer', 'Sucht im Strafraum das Tor: richtig stehen und direkt abschließen.'),
        ],
        'faq_h': 'Häufige Fragen',
        'faq': [
            ('Ist das ein echter Test?', 'Nein, es ist ein Spaß-Quiz. Deine echte Position bestimmt dein Trainer anhand deiner Stärken. Trotzdem ein guter Start, um zu überlegen, welche Rolle dir Spaß macht.'),
            ('Wie teile ich mein Ergebnis?', 'Tippe auf dem Ergebnisbildschirm auf "Ergebnis teilen". Auf dem Handy öffnet sich das Teilen-Menü, am Computer wird der Link kopiert.'),
            ('Kann ich meine Position in einem Spiel ausprobieren?', 'Ja. In StarFoot, unserem eigenen Spiel, startest du mit 8 Jahren als Torwart, Verteidiger, Mittelfeldspieler oder Stürmer. Kostenlos auf iPhone und Android.'),
        ],
        'more': 'Mehr: [Fußballpositionen erklärt](/blog/de/fussball-positionen-erklaert/) · [Fußball-Karrierespiel offline](/blog/de/fussball-karriere-spiel-offline-iphone/)',
        'own': 'Diese Seite wurde vom StarFoot-Team erstellt.', 'priv': 'Datenschutz',
    },
}

CSS = """
:root{--bg:#070f2a;--card:#0f1d47;--line:rgba(255,255,255,.1);--txt:#eef2ff;--mut:#a9b6dd;--gold:#ffcf3f}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--txt);font:17px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
a{color:var(--gold)}.wrap{max-width:680px;margin:0 auto;padding:0 16px}
header{display:flex;justify-content:space-between;align-items:center;padding:16px 0;border-bottom:1px solid var(--line)}
.logo{font-weight:900;font-style:italic;font-size:24px;color:var(--txt);text-decoration:none}.logo span{color:var(--gold)}
nav a{color:var(--mut);margin-left:12px;text-decoration:none;font-size:14px}
h1{font-size:clamp(30px,6vw,42px);line-height:1.1;margin:22px 0 8px}h2{font-size:24px;margin:34px 0 10px}
.lead{color:var(--mut)}.langs a{color:var(--mut);font-size:13px;margin-right:8px}
#quiz{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:20px;margin:20px 0;min-height:160px}
.qstart,.qa button,.qrow button{font:700 18px system-ui,sans-serif;border:0;border-radius:14px;cursor:pointer}
.qstart{display:block;width:100%;padding:18px;background:var(--gold);color:#0a1530;font-size:21px}
.qbar{height:6px;background:rgba(255,255,255,.1);border-radius:3px;overflow:hidden}.qbar i{display:block;height:100%;background:var(--gold)}
.qof{color:var(--mut);font-size:13px;text-transform:uppercase;letter-spacing:.06em;margin:12px 0 2px}.qq{font-size:22px;margin:4px 0 14px}
.qa{display:grid;gap:10px}.qa button{padding:14px 16px;text-align:left;background:rgba(255,255,255,.07);color:var(--txt);border:1px solid var(--line)}
.qa button:active{background:rgba(255,207,63,.25)}
.qres h3{font-size:38px;margin:0 0 6px;color:var(--gold)}.qsec{color:var(--mut)}
.qrow{display:flex;gap:10px;margin:14px 0}.qrow button{flex:1;padding:13px;background:rgba(255,255,255,.08);color:var(--txt)}.qrow .qshare{background:var(--gold);color:#0a1530}
.qcta{border-top:1px solid var(--line);margin-top:14px;padding-top:14px;text-align:center}.qcta p{color:var(--mut)}
.qbtns{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}
.qbtn{display:inline-flex;align-items:center;gap:10px;background:#000;color:#fff;text-decoration:none;border:1px solid #ffffff40;border-radius:12px;padding:8px 18px 8px 14px}
.qbtn svg{width:24px;height:24px;fill:#fff}.qbtn small{display:block;font-size:10px;opacity:.85}.qbtn b{display:block;font-size:18px;line-height:1.1}
.qshared{color:var(--mut);margin:0 0 12px}
.pos{display:grid;gap:10px}.pos div{background:var(--card);border-radius:12px;padding:12px 14px}.pos b{color:var(--gold)}
details{background:var(--card);border-radius:10px;padding:10px 14px;margin:8px 0}summary{cursor:pointer;font-weight:600}
footer{color:#8a96b5;font-size:13px;border-top:1px solid var(--line);margin-top:30px;padding:18px 0 40px}footer a{color:#8a96b5}
"""


def esc(s):
    return html.escape(s, quote=True)


def md_links(s):
    import re
    return re.sub(r'\[([^\]]+)\]\(([^)]+)\)', lambda m: f'<a href="{esc(m.group(2))}">{esc(m.group(1))}</a>', esc(s).replace('&#x27;', "'"))


for lang, d in P.items():
    url = URLS[lang]
    alts = '\n'.join(f'<link rel="alternate" hreflang="{l}" href="{SITE}{u}">' for l, u in URLS.items())
    alts += f'\n<link rel="alternate" hreflang="x-default" href="{SITE}{URLS["en"]}">'
    langs = ''.join(f'<a href="{u}" hreflang="{l}">{l.upper()}</a>' for l, u in URLS.items() if l != lang)
    ld = [
        {'@context': 'https://schema.org', '@type': 'WebPage', 'name': d['title'], 'description': d['desc'], 'inLanguage': lang, 'url': SITE + url,
         'publisher': {'@type': 'Organization', 'name': 'StarFoot', 'url': SITE + '/'}},
        {'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [{'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in d['faq']]},
    ]
    ldh = '\n'.join(f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>' for x in ld)
    pos = ''.join(f'<div><b>{esc(n)}:</b> {esc(t)}</div>' for n, t in d['pos'])
    faq = ''.join(f'<details><summary>{esc(q)}</summary><p>{esc(a)}</p></details>' for q, a in d['faq'])
    page = f'''<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{esc(d["title"])}</title>
<meta name="description" content="{esc(d["desc"])}">
<link rel="canonical" href="{SITE}{url}">
{alts}
<meta property="og:type" content="website">
<meta property="og:title" content="{esc(d["title"])}">
<meta property="og:description" content="{esc(d["desc"])}">
<meta property="og:url" content="{SITE}{url}">
<meta property="og:image" content="{SITE}/site/{'tr' if lang == 'tr' else 'en'}-1-moment.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="apple-itunes-app" content="app-id=6819292902">
<link rel="icon" href="/icons/icon-192.png">
<style>{CSS}</style>
{ldh}
</head>
<body>
<div class="wrap">
<header><a class="logo" href="/">STAR<span>FOOT</span></a><nav><a href="/blog/{lang}/">Blog</a><a href="/ios">App</a></nav></header>
<p class="langs">{langs}</p>
<h1>{esc(d["h1"])}</h1>
<p class="lead">{esc(d["lead"])}</p>
<div id="quiz"></div>
<h2>{esc(d["pos_h"])}</h2>
<div class="pos">{pos}</div>
<h2>{esc(d["faq_h"])}</h2>
{faq}
<p>{md_links(d["more"])}</p>
<footer>{esc(d["own"])} · <a href="/privacy.html">{esc(d["priv"])}</a></footer>
</div>
<script src="/quiz/quiz.js"></script>
</body>
</html>
'''
    out = ROOT / url.strip('/') / 'index.html'
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(page, encoding='utf-8')
    print('yazıldı', out.relative_to(ROOT))
