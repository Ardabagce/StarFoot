#!/usr/bin/env python3
"""StarFoot blog: tools/blog/posts/*.json -> blog/<dil>/<slug>/index.html

Kullanım:  python3 tools/blog/build.py
Ayrıca üretir: blog/<dil>/index.html (dil ana sayfası), sitemap.xml, robots.txt, llms.txt, blog/<dil>/feed.xml
Eksik alan, uzun özet, alt yazısız görsel ya da kırık iç bağlantıda hata verip durur.
"""
import html
import json
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = Path(__file__).resolve().parent / 'posts'
OUT = ROOT / 'blog'
SITE = 'https://starfoot.bagce.dev'
APP_URL = 'https://apps.apple.com/app/id6819292902'
PLAY_URL = 'https://play.google.com/store/apps/details?id=app.vercel.starfoot.twa'
PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.6 2.3 13.4 12l-9.8 9.7c-.4-.2-.6-.7-.6-1.2V3.5c0-.5.2-1 .6-1.2zm11 10.9 2.6 2.6-11 6.3 8.4-8.9zm3.8-3.8 2.5 1.4c.7.4.7 1.4 0 1.8l-2.5 1.4-2.8-2.3 2.8-2.3zM6.2 1.9l11 6.3-2.6 2.6-8.4-8.9z"/></svg>'
APP_ID = '6819292902'

REQ = ['slug', 'lang', 'group', 'title', 'meta_description', 'cluster', 'is_hub', 'author', 'date_published',
       'date_updated', 'tldr', 'sections', 'faq', 'cta']

UI = {
    'tr': {'home': 'Ana sayfa', 'blog': 'Blog', 'by': 'Yazan', 'upd': 'Son güncelleme', 'tldr': 'Kısaca', 'faq': 'Sık sorulan sorular',
           'rel': 'Bunlar da ilgini çekebilir', 'dl1': "App Store'dan", 'dl3': "Google Play'den", 'dl2': 'İndir', 'free': 'Ücretsiz · İnternetsiz oynanır · Abonelik yok',
           'own': 'Bu blog StarFoot\'u geliştiren ekip tarafından yazılır; kendi oyunumuzdan söz ettiğimiz yerlerde bunu açıkça belirtiriz.',
           'fic': 'Oyundaki tüm kulüp ve oyuncu adları hayalidir.', 'priv': 'Gizlilik', 'src': 'Kaynaklar', 'all': 'Tüm yazılar',
           'idx_t': 'StarFoot Blog: futbol kariyeri, altyapı ve oyun rehberleri', 'idx_d': 'Futbol kariyeri, altyapı, teknik direktörlük ve internetsiz futbol oyunları üzerine rehberler.', 'hub': 'Rehber'},
    'en': {'home': 'Home', 'blog': 'Blog', 'by': 'By', 'upd': 'Last updated', 'tldr': 'TL;DR', 'faq': 'FAQ',
           'rel': 'You might also like', 'dl1': 'Download on the', 'dl3': 'Get it on', 'dl2': 'App Store', 'free': 'Free · Plays offline · No subscription',
           'own': 'This blog is written by the team behind StarFoot. Where we mention our own game, we say so.',
           'fic': 'All club and player names in the game are fictional.', 'priv': 'Privacy', 'src': 'Sources', 'all': 'All posts',
           'idx_t': 'StarFoot Blog: football career, academy and game guides', 'idx_d': 'Guides on football careers, academies, managing and offline football games.', 'hub': 'Guide'},
    'de': {'home': 'Startseite', 'blog': 'Blog', 'by': 'Von', 'upd': 'Zuletzt aktualisiert', 'tldr': 'Kurz gesagt', 'faq': 'Häufige Fragen',
           'rel': 'Das könnte dich auch interessieren', 'dl1': 'Laden im', 'dl3': 'Jetzt bei', 'dl2': 'App Store', 'free': 'Kostenlos · Offline spielbar · Kein Abo',
           'own': 'Dieser Blog wird vom Team hinter StarFoot geschrieben. Wenn wir unser eigenes Spiel erwähnen, sagen wir das.',
           'fic': 'Alle Vereins- und Spielernamen im Spiel sind fiktiv.', 'priv': 'Datenschutz', 'src': 'Quellen', 'all': 'Alle Beiträge',
           'idx_t': 'StarFoot Blog: Fußballkarriere, Jugend und Spiel-Guides', 'idx_d': 'Guides zu Fußballkarriere, Nachwuchs, Trainerjob und Offline-Fußballspielen.', 'hub': 'Guide'},
    'nl': {'home': 'Home', 'blog': 'Blog', 'by': 'Door', 'upd': 'Laatst bijgewerkt', 'tldr': 'In het kort', 'faq': 'Veelgestelde vragen',
           'rel': 'Misschien ook interessant', 'dl1': 'Download in de', 'dl3': 'Ontdek het op', 'dl2': 'App Store', 'free': 'Gratis · Offline speelbaar · Geen abonnement',
           'own': 'Deze blog wordt geschreven door het team achter StarFoot. Waar we ons eigen spel noemen, zeggen we dat.',
           'fic': 'Alle club- en spelersnamen in het spel zijn fictief.', 'priv': 'Privacy', 'src': 'Bronnen', 'all': 'Alle berichten',
           'idx_t': 'StarFoot Blog: voetbalcarrière, jeugdopleiding en spelgidsen', 'idx_d': 'Gidsen over voetbalcarrières, jeugdopleidingen, trainen en offline voetbalspellen.', 'hub': 'Gids'},
}

APPLE = '<svg viewBox="0 0 384 512" aria-hidden="true"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/></svg>'

CSS = """
:root{--bg:#070f2a;--card:#0f1d47;--line:rgba(255,255,255,.1);--txt:#eef2ff;--mut:#a9b6dd;--gold:#ffcf3f}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--txt);font:17px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
a{color:var(--gold)}
.wrap{max-width:760px;margin:0 auto;padding:0 16px}
header.top{display:flex;align-items:center;justify-content:space-between;padding:16px 0;border-bottom:1px solid var(--line)}
.logo{font-weight:900;font-style:italic;font-size:24px;text-decoration:none;color:var(--txt)}.logo span{color:var(--gold)}
nav a{color:var(--mut);text-decoration:none;margin-left:14px;font-size:15px}
.crumb{font-size:13px;color:var(--mut);margin:18px 0 0}.crumb a{color:var(--mut)}
h1{font-size:clamp(28px,5vw,40px);line-height:1.15;margin:12px 0 10px;letter-spacing:-.4px}
h2{font-size:24px;line-height:1.25;margin:34px 0 10px}
h3{font-size:19px;margin:22px 0 6px}
.meta{color:var(--mut);font-size:14px;margin-bottom:18px}
.tldr{background:var(--card);border-left:4px solid var(--gold);border-radius:10px;padding:14px 16px;margin:18px 0}
.tldr b{display:block;color:var(--gold);font-size:13px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}
.cta{display:flex;flex-direction:column;align-items:center;gap:8px;background:linear-gradient(135deg,#13245a,#0f1d47);border:1px solid var(--line);border-radius:16px;padding:20px 16px;margin:26px 0;text-align:center}
.cta p{margin:0;color:var(--mut);font-size:15px}.cta h3{margin:0}
.btn{display:inline-flex;align-items:center;gap:12px;background:#000;color:#fff;text-decoration:none;border:1px solid #ffffff40;border-radius:14px;padding:10px 22px 10px 18px}
.btns{display:flex;flex-wrap:wrap;justify-content:center;gap:10px}.btn svg{width:28px;height:28px;fill:#fff}.btn small{display:block;font-size:11px;opacity:.85}.btn b{display:block;font-size:20px;line-height:1.1}
.callout{background:#1a2c63;border-radius:10px;padding:12px 14px;margin:16px 0}
table{width:100%;border-collapse:collapse;margin:14px 0;font-size:15px}th,td{border:1px solid var(--line);padding:8px;text-align:left;vertical-align:top}th{background:var(--card)}
img{max-width:100%;height:auto;border-radius:12px}
figure{margin:18px 0}figcaption{color:var(--mut);font-size:13px}
.faq details{background:var(--card);border-radius:10px;padding:10px 14px;margin:8px 0}.faq summary{cursor:pointer;font-weight:600}
.rel ul,.list ul{padding-left:18px}.list li{margin:10px 0}.list small{display:block;color:var(--mut)}
.author{display:flex;gap:12px;align-items:center;border-top:1px solid var(--line);margin-top:30px;padding-top:16px;color:var(--mut);font-size:14px}
.author img{width:44px;height:44px;border-radius:10px}
footer{color:#8a96b5;font-size:13px;border-top:1px solid var(--line);margin-top:30px;padding:18px 0 40px}footer a{color:#8a96b5}
.langs{font-size:13px;color:var(--mut)}.langs a{color:var(--mut);margin-right:8px}
"""


def fail(msg):
    sys.exit(f'HATA: {msg}')


def esc(s):
    return html.escape(str(s), quote=True)


def inline(s):
    """**kalın**, *eğik*, [metin](bağlantı)"""
    s = esc(s)
    s = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', s)
    s = re.sub(r'(?<!\*)\*(?!\*)(.+?)\*', r'<i>\1</i>', s)

    def link(m):
        t, u = m.group(1), html.unescape(m.group(2))
        ext = u.startswith('http') and not u.startswith(SITE)
        rel = ' rel="noopener"' if ext else ''
        return f'<a href="{esc(u)}"{rel}>{t}</a>'
    return re.sub(r'\[([^\]]+)\]\(([^)]+)\)', link, s)


def md(text):
    """Basit blok biçimi: boş satırla ayrılmış paragraflar, '- ' listeler, '1. ' sıralı listeler, '> ' not kutusu."""
    out = []
    for block in re.split(r'\n\s*\n', text.strip()):
        lines = block.strip().split('\n')
        if all(re.match(r'^- ', l) for l in lines):
            out.append('<ul>' + ''.join(f'<li>{inline(l[2:])}</li>' for l in lines) + '</ul>')
        elif all(re.match(r'^\d+\. ', l) for l in lines):
            out.append('<ol>' + ''.join('<li>' + inline(re.sub(r'^\d+\. ', '', l)) + '</li>' for l in lines) + '</ol>')
        elif lines[0].startswith('> '):
            out.append('<div class="callout">' + ' '.join(inline(l[2:]) for l in lines) + '</div>')
        else:
            out.append('<p>' + ' '.join(inline(l) for l in lines) + '</p>')
    return '\n'.join(out)


def url(p):
    return f"/blog/{p['lang']}/{p['slug']}/"


def cta_html(p, title=None, sub=None):
    u = UI[p['lang']]
    t = title or p['cta'].get('title', '')
    s = sub or p['cta'].get('text', '')
    return f'''<div class="cta">{f"<h3>{esc(t)}</h3>" if t else ""}{f"<p>{esc(s)}</p>" if s else ""}
<div class="btns"><a class="btn" href="{APP_URL}" rel="noopener">{APPLE}<span><small>{u["dl1"]}</small><b>{u["dl2"]}</b></span></a><a class="btn" href="{PLAY_URL}" rel="noopener">{PLAY}<span><small>{u["dl3"]}</small><b>Google Play</b></span></a></div>
<p>{u["free"]}</p></div>'''


def validate(posts):
    seen = set()
    for f, p in posts:
        for k in REQ:
            if k not in p:
                fail(f'{f.name}: "{k}" alanı eksik')
        if p['lang'] not in UI:
            fail(f'{f.name}: desteklenmeyen dil {p["lang"]}')
        if (p['lang'], p['slug']) in seen:
            fail(f'{f.name}: aynı dilde aynı slug iki kez')
        seen.add((p['lang'], p['slug']))
        if not re.fullmatch(r'[a-z0-9-]+', p['slug']):
            fail(f'{f.name}: slug yalnız küçük harf, rakam ve tire içermeli')
        if len(p['title']) > 70:
            fail(f'{f.name}: başlık 70 karakteri geçiyor ({len(p["title"])})')
        if len(p['meta_description']) > 160:
            fail(f'{f.name}: meta açıklama 160 karakteri geçiyor ({len(p["meta_description"])})')
        if len(p['tldr']) > 330:
            fail(f'{f.name}: özet (tldr) 330 karakteri geçiyor ({len(p["tldr"])})')
        for s in p['sections']:
            if 'h' not in s or 'md' not in s:
                fail(f'{f.name}: her bölümde "h" ve "md" olmalı')
            for im in s.get('images', []):
                if not im.get('alt'):
                    fail(f'{f.name}: alt yazısız görsel ({im.get("src")})')


def jsonld(p, related_hub):
    u = UI[p['lang']]
    full = SITE + url(p)
    data = [
        {'@context': 'https://schema.org', '@type': 'Article', 'headline': p['title'], 'description': p['meta_description'],
         'inLanguage': p['lang'], 'datePublished': p['date_published'], 'dateModified': p['date_updated'],
         'author': {'@type': 'Organization' if p['author'].get('org') else 'Person', 'name': p['author']['name'], 'url': SITE + '/'},
         'publisher': {'@type': 'Organization', 'name': 'StarFoot', 'logo': {'@type': 'ImageObject', 'url': SITE + '/icons/icon-512.png'}},
         'mainEntityOfPage': full, 'image': SITE + p.get('image', '/site/en-1-moment.jpg')},
        {'@context': 'https://schema.org', '@type': 'SoftwareApplication', 'name': 'StarFoot', 'operatingSystem': 'iOS, Android',
         'applicationCategory': 'GameApplication', 'url': APP_URL, 'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'USD'}},
        {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': u['home'], 'item': SITE + '/'},
            {'@type': 'ListItem', 'position': 2, 'name': u['blog'], 'item': f"{SITE}/blog/{p['lang']}/"},
        ] + ([{'@type': 'ListItem', 'position': 3, 'name': related_hub['title'], 'item': SITE + url(related_hub)}] if related_hub and related_hub is not p else [])
          + [{'@type': 'ListItem', 'position': 4 if related_hub and related_hub is not p else 3, 'name': p['title'], 'item': full}]},
    ]
    if p['faq']:
        data.append({'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
            {'@type': 'Question', 'name': q['q'], 'acceptedAnswer': {'@type': 'Answer', 'text': q['a']}} for q in p['faq']]})
    return '\n'.join(f'<script type="application/ld+json">{json.dumps(d, ensure_ascii=False)}</script>' for d in data)


def page(lang, title, desc, canonical, body, extra_head='', alts=None, og_image='/site/en-1-moment.jpg'):
    u = UI[lang]
    hre = ''
    langs = ''
    if alts:
        hre = '\n'.join(f'<link rel="alternate" hreflang="{l}" href="{SITE}{h}">' for l, h in alts.items())
        hre += f'\n<link rel="alternate" hreflang="x-default" href="{SITE}{alts.get("en") or alts.get(lang)}">'
        langs = '<p class="langs">' + ''.join(f'<a href="{h}" hreflang="{l}">{l.upper()}</a>' for l, h in alts.items() if l != lang) + '</p>'
    return f'''<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{SITE}{canonical}">
{hre}
<meta name="apple-itunes-app" content="app-id={APP_ID}">
<meta property="og:type" content="article">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{SITE}{canonical}">
<meta property="og:image" content="{SITE}{og_image}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/icons/icon-192.png">
<link rel="alternate" type="application/rss+xml" href="/blog/{lang}/feed.xml" title="StarFoot Blog">
<style>{CSS}</style>
{extra_head}
</head>
<body>
<div class="wrap">
<header class="top"><a class="logo" href="/">STAR<span>FOOT</span></a><nav><a href="/blog/{lang}/">{u["blog"]}</a><a href="/ios">App Store</a></nav></header>
{langs}
{body}
<footer><p>{u["own"]}</p><p>{u["fic"]} · <a href="/privacy.html">{u["priv"]}</a> · <a href="/blog/{lang}/">{u["all"]}</a></p></footer>
</div>
</body>
</html>
'''


def build():
    files = sorted(SRC.glob('*.json'))
    posts = []
    for f in files:
        try:
            posts.append((f, json.loads(f.read_text(encoding='utf-8'))))
        except json.JSONDecodeError as e:
            fail(f'{f.name}: JSON okunamadı: {e}')
    validate(posts)
    P = [p for _, p in posts]
    by_url = {url(p): p for p in P}
    groups = {}
    for p in P:
        groups.setdefault(p['group'], {})[p['lang']] = url(p)
    hubs = {(p['lang'], p['cluster']): p for p in P if p['is_hub']}

    # iç bağlantı kontrolü
    report, inlinks = [], {url(p): 0 for p in P}
    for p in P:
        text = ' '.join(s['md'] for s in p['sections']) + ' ' + ' '.join(q['a'] for q in p['faq'])
        links = re.findall(r'\]\((/[^)]+)\)', text)
        for l in links:
            if l.startswith('/blog/'):
                l2 = l if l.endswith('/') else l + '/'
                if l2 in {f'/blog/{x}/' for x in UI}:
                    continue
                if l2 not in by_url:
                    fail(f'{p["slug"]} ({p["lang"]}): kırık iç bağlantı {l}')
                inlinks[l2] += 1
        n_int = len([l for l in links if l.startswith('/')])
        if n_int < 3:
            report.append(f'uyarı: {p["lang"]}/{p["slug"]}: yalnız {n_int} iç bağlantı (en az 3 önerilir)')

    for p in P:
        lang, u = p['lang'], UI[p['lang']]
        hub = hubs.get((lang, p['cluster']))
        if hub and hub is not p:
            inlinks[url(hub)] += 1
        rel = [q for q in P if q is not p and q['lang'] == lang and q['cluster'] == p['cluster']][:4]
        if len(rel) < 3:
            rel += [q for q in P if q is not p and q['lang'] == lang and q not in rel][:4 - len(rel)]
        for q in rel:
            inlinks[url(q)] += 1
        crumb = f'<p class="crumb"><a href="/">{u["home"]}</a> › <a href="/blog/{lang}/">{u["blog"]}</a>'
        if hub and hub is not p:
            crumb += f' › <a href="{url(hub)}">{esc(hub["title"])}</a>'
        crumb += '</p>'
        secs = []
        mid = len(p['sections']) // 2
        for i, s in enumerate(p['sections']):
            imgs = ''
            for im in s.get('images', []):
                cap = '<figcaption>' + esc(im['caption']) + '</figcaption>' if im.get('caption') else ''
                imgs += '<figure><img src="' + esc(im['src']) + '" alt="' + esc(im['alt']) + '" loading="lazy">' + cap + '</figure>'
            table = ''
            if s.get('table'):
                t = s['table']
                table = '<table><thead><tr>' + ''.join(f'<th>{inline(c)}</th>' for c in t[0]) + '</tr></thead><tbody>' + ''.join('<tr>' + ''.join(f'<td>{inline(c)}</td>' for c in r) + '</tr>' for r in t[1:]) + '</tbody></table>'
            secs.append(f'<h2 id="s{i + 1}">{esc(s["h"])}</h2>\n{md(s["md"])}\n{table}{imgs}')
            if i == mid - 1 and len(p['sections']) >= 4:
                secs.append(cta_html(p, p['cta'].get('mid_title'), p['cta'].get('mid_text')))
        if p['is_hub']:
            kids = [q for q in P if q['lang'] == lang and q['cluster'] == p['cluster'] and q is not p]
            if kids:
                secs.append(f'<h2>{u["all"]}</h2><div class="list"><ul>' + ''.join(f'<li><a href="{url(q)}">{esc(q["title"])}</a><small>{esc(q["meta_description"])}</small></li>' for q in kids) + '</ul></div>')
                for q in kids:
                    inlinks[url(q)] += 1
        faq = ''
        if p['faq']:
            faq = f'<section class="faq"><h2>{u["faq"]}</h2>' + ''.join(f'<details><summary>{esc(q["q"])}</summary><p>{inline(q["a"])}</p></details>' for q in p['faq']) + '</section>'
        src = ''
        if p.get('sources'):
            src = f'<h2>{u["src"]}</h2><ul>' + ''.join(f'<li><a href="{esc(s["url"])}" rel="noopener">{esc(s["title"])}</a></li>' for s in p['sources']) + '</ul>'
        relh = ''
        if rel:
            relh = f'<section class="rel"><h2>{u["rel"]}</h2><ul>' + ''.join(f'<li><a href="{url(q)}">{esc(q["title"])}</a></li>' for q in rel) + '</ul></section>'
        a = p['author']
        body = f'''{crumb}
<article>
<h1>{esc(p["title"])}</h1>
<p class="meta">{u["by"]} {esc(a["name"])} · {u["upd"]}: <time datetime="{p["date_updated"]}">{p["date_updated"]}</time></p>
<div class="tldr"><b>{u["tldr"]}</b>{inline(p["tldr"])}</div>
{cta_html(p, p['cta'].get('top_title'), p['cta'].get('top_text'))}
{chr(10).join(secs)}
{faq}
{cta_html(p)}
{src}
<div class="author"><img src="/icons/icon-192.png" alt=""><div><b>{esc(a["name"])}</b><br>{esc(a.get("bio", ""))}</div></div>
</article>
{relh}'''
        alts = groups[p['group']] if len(groups[p['group']]) > 1 else None
        html_ = page(lang, p['title'], p['meta_description'], url(p), body, jsonld(p, hub), alts, p.get('image', '/site/en-1-moment.jpg'))
        d = OUT / lang / p['slug']
        d.mkdir(parents=True, exist_ok=True)
        (d / 'index.html').write_text(html_, encoding='utf-8')

    # dil ana sayfaları ve RSS
    for lang in sorted({p['lang'] for p in P}):
        u = UI[lang]
        lp = sorted([p for p in P if p['lang'] == lang], key=lambda p: (not p['is_hub'], p['date_published']), reverse=False)
        items = ''.join(f'<li><a href="{url(p)}">{esc(p["title"])}</a>{" · " + u["hub"] if p["is_hub"] else ""}<small>{esc(p["meta_description"])}</small></li>' for p in lp)
        body = f'<h1>{u["blog"]}</h1><p class="meta">{esc(u["idx_d"])}</p>{cta_html(lp[0], " ", " ")}<div class="list"><ul>{items}</ul></div>'
        idx_alts = {l: f'/blog/{l}/' for l in sorted({p["lang"] for p in P})}
        (OUT / lang / 'index.html').write_text(page(lang, u['idx_t'], u['idx_d'], f'/blog/{lang}/', body, '', idx_alts), encoding='utf-8')
        rss = ''.join(f'<item><title>{esc(p["title"])}</title><link>{SITE}{url(p)}</link><guid>{SITE}{url(p)}</guid><pubDate>{p["date_published"]}</pubDate><description>{esc(p["meta_description"])}</description></item>' for p in lp)
        (OUT / lang / 'feed.xml').write_text(f'<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>StarFoot Blog ({lang})</title><link>{SITE}/blog/{lang}/</link><description>{esc(u["idx_d"])}</description>{rss}</channel></rss>\n', encoding='utf-8')

    # site haritası, robots, llms.txt
    today = date.today().isoformat()
    urls = [(SITE + '/', today), (SITE + '/ios', today), (SITE + '/android', today)] + [(f'{SITE}/blog/{l}/', today) for l in sorted({p['lang'] for p in P})] + [(SITE + url(p), p['date_updated']) for p in P]
    (ROOT / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(f'<url><loc>{u}</loc><lastmod>{d}</lastmod></url>\n' for u, d in urls) + '</urlset>\n', encoding='utf-8')
    (ROOT / 'robots.txt').write_text('''# StarFoot: arama motorları ve yapay zekâ tarayıcıları hoş geldiniz
User-agent: *
Allow: /
Disallow: /app/
Disallow: /tools/
Disallow: /store/
Disallow: /docs/
Disallow: /oyna-r8k4tq.html

User-agent: GPTBot
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: Claude-SearchBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Google-Extended
Allow: /

Sitemap: https://starfoot.bagce.dev/sitemap.xml
''', encoding='utf-8')
    hubl = '\n'.join(f'- [{p["title"]}]({SITE}{url(p)}): {p["meta_description"]}' for p in P if p['is_hub'])
    rest = '\n'.join(f'- [{p["title"]}]({SITE}{url(p)}): {p["meta_description"]}' for p in P if not p['is_hub'])
    (ROOT / 'llms.txt').write_text(f'''# StarFoot

> StarFoot is a football (soccer) career game for iPhone, iPad and Android. You start as a child aged 8 to 18 in any year from 1980 to today, impress scouts in street matches, rise through the academy and play the key moments of every match yourself (shots, passes, free kicks, penalties, headers). A separate Manager mode lets you run a club. It is free to play with optional one-time purchases, has no energy timers and no subscriptions, and works fully offline. Available in 10 languages. All club and player names are fictional.

- App Store: {APP_URL}
- Google Play: {PLAY_URL}
- Website: {SITE}/
- Download page: {SITE}/ios

## Guides
{hubl}

## Posts
{rest}
''', encoding='utf-8')

    orphans = [u for u, n in inlinks.items() if n == 0]
    for o in orphans:
        report.append(f'uyarı: {o} sayfasına hiçbir yazıdan bağlantı yok (yalnız blog ana sayfasından)')
    print(f'{len(P)} yazı, {len(groups)} konu grubu, {len({p["lang"] for p in P})} dil üretildi.')
    for r in report:
        print(r)


if __name__ == '__main__':
    build()
