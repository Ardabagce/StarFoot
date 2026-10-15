import json, re, html
import os
D = os.path.dirname(os.path.abspath(__file__)) + '/'
ROOT = os.path.abspath(D + '../../') + '/'
keys = json.load(open(D + 'keys.json'))
vals = []
for i in range(7): vals += json.load(open(D + f't{i}.json'))
assert len(keys) == len(vals)
names = json.load(open(D + 'names.json'))
clubs = json.load(open(D + 'clubs_en.json'))
extra = json.load(open(D + 'extra.json')) if __import__('os').path.exists(D + 'extra.json') else {}
EMO = re.compile('[\U0001F000-\U0001FAFF☀-➿⬀-⯿⌀-⏿️‍⃣\U0001F1E6-\U0001F1FF\U000E0020-\U000E007F]')
def plain(s):
    s = EMO.sub('', s); s = re.sub(r'^\s+', '', s); s = re.sub(r'\s{2,}', ' ', s); return s.strip()
def clean(s):
    s = s.replace("\\'", "'").replace('\\"', '"').replace('\\\\', '\\')
    s = html.unescape(s)
    return re.sub(r'\s+', ' ', s).strip()
LET = re.compile(r'[A-Za-zÇĞİŞÖÜçğışöü]')
def norm_ph(v):
    # {0}{1} -> keep; plain {} kept
    return v
exact, pats = {}, {}
def add(k, v, force=False):
    if v is None: return
    k, v = clean(k), clean(v)
    if not k or (k == v and not force): return
    if not LET.search(k.replace('{}', '')): return
    target = pats if '{}' in k else exact
    target.setdefault(k, v)
def addall(k, v):
    if v is None: return
    add(k, v)
    pk, pv = plain(k), plain(v)
    if pk != clean(k): add(pk, pv)
    # "{} X" (ikon öneki) -> "X"
    for kk, vv in ((clean(k), clean(v)), (pk, pv)):
        m = re.match(r'^\{\}\s+(.*)$', kk); mv = re.match(r'^\{\}\s+(.*)$', vv)
        if m and mv and not re.search(r'\{\d', mv.group(1)) and m.group(1).count('{}') == mv.group(1).count('{}'): add(m.group(1), mv.group(1))
SENT = re.compile(r'(?<=[.!?…])\s+(?=[A-ZÇĞİŞÖÜ"“0-9{])')
def sentences(k, v):
    if v is None: return
    ks, vs = SENT.split(clean(k)), SENT.split(clean(v))
    if len(ks) < 2 or len(ks) != len(vs) or re.search(r'\{\d', v): return
    if any(a.count('{}') != b.count('{}') for a, b in zip(ks, vs)): return
    for a, b in zip(ks, vs): addall(a, b)
def suffix(k, v):
    if v is None: return
    for kk, vv in ((clean(k), clean(v)), (plain(k), plain(v))):
        m = re.match(r'^(.*\S)\s+\{\}$', kk); mv = re.match(r'^(.*\S)\s+\{0?\}$', vv)
        if m and mv and '{' not in m.group(1) and '{' not in mv.group(1): add(m.group(1), mv.group(1))
for k, v in extra.items(): add(k, v, True); addall(k, v); sentences(k, v)
for k, v in zip(keys, vals): addall(k, v)
for k, v in zip(keys, vals): sentences(k, v); suffix(k, v)
# Kulüpler: yalnız takma ad içerenleri çevir (gerçek kulüp adı birebir oluşmasın)
DESC = re.compile(r'(ları|leri|lar|ler|sı|si|su|sü|ı|i|u|ü)$')
COL = {'Mavi','Sarı','Kızıl','Kara','Beyaz','Mor','Pembe','Yeşil','Kırmızı','Turuncu','Lacivert'}
FIX = {'Tijuana Köpekleri': 'Tijuana Dogs'}
nclub = 0
for tr, en in clubs.items():
    en = FIX.get(tr, en)
    toks = re.split(r'[\s]+', tr)
    if not any(DESC.search(t) or t in COL or '-' in t for t in toks): continue
    exact.setdefault(tr, en); nclub += 1
# Türk kulüpleri: takma adları çevir (Galata Aslanları → Galata Lions)
tok = json.load(open(D + 'clubtok.json'))
tok.update({'Aslanları': 'Lions', 'Fırtınası': 'Storm', 'Kartalları': 'Eagles', 'Timsahları': 'Crocodiles', 'Yiğitleri': 'Braves', 'Şimşekleri': 'Lightning', 'Horozları': 'Roosters', 'Şahinleri': 'Hawks', 'Güneşi': 'Sun', 'Çaycıları': 'Tea Growers', 'Denizcileri': 'Mariners', 'Körfezi': 'Bay', 'Surları': 'Walls', 'Gençlik': 'Youth', 'Rüzgarı': 'Wind', 'Gülleri': 'Roses', 'Ağaçları': 'Trees', 'Dadaşları': 'Dadash', 'Dağları': 'Mountains', 'Tepeleri': 'Hills', 'Elmaları': 'Apples', 'Madencileri': 'Miners', 'Mavileri': 'Blues', 'Sahili': 'Coast', 'Başkent': 'Capital', 'Pamukçular': 'Cotton Men', 'Akdeniz': 'Mediterranean', 'Karadeniz': 'Black Sea', 'Gölü': 'Lake'})
for tr in names['clubs']:
    if tr in exact or tr in clubs: continue
    toks = tr.split(' ')
    en = [tok.get(t, t) for t in toks]
    if en != toks and any(DESC.search(t) or t in COL for t, e in zip(toks, en) if e != t):
        exact.setdefault(tr, ' '.join(en)); nclub += 1
# Kişi adlarıyla çakışan kelimeler çevrilmez
nameset = set(names['names'])
keep = sorted(k for k in exact if k in nameset)
for k in keep: exact.pop(k)
# Kısa anahtarların BÜYÜK HARF hali
def up_tr(s): return s.replace('i', 'İ').replace('ı', 'I').upper()
plist = sorted(pats.items(), key=lambda kv: -len(re.sub(r'\{\}', '', kv[0])))

# İngilizce kaynak listesi: diğer diller İngilizceden çevrilir (src_en.json sırası sabittir, yeni metin sona eklenir)
SRC = D + 'src_en.json'
src = json.load(open(SRC)) if os.path.exists(SRC) else []
seen = set(src)
for v in list(exact.values()) + [v for _, v in plist]:
    if v not in seen: src.append(v); seen.add(v)
json.dump(src, open(SRC, 'w'), ensure_ascii=False, indent=0)

PH = re.compile(r'\{\d*\}')
def load_lang(code):
    # tools/i18n/<dil>/*.txt satırları: "sıra|çeviri" (sıra = src_en.json içindeki yeri)
    m, bad = {}, 0
    d = D + code + '/'
    if not os.path.isdir(d): return m, bad
    for f in sorted(os.listdir(d)):
        if not f.endswith('.txt'): continue
        for line in open(d + f, encoding='utf-8'):
            line = line.rstrip('\n')
            if '|' not in line: continue
            i, t = line.split('|', 1)
            if not i.strip().isdigit(): continue
            i = int(i)
            if i >= len(src): continue
            en = src[i]
            # yer tutucular birebir korunmalı; bozuksa İngilizce kalır
            if sorted(PH.findall(en)) != sorted(PH.findall(t)) or not t.strip(): bad += 1; continue
            m[en] = t.strip()
    return m, bad

LANGS = ['en', 'es', 'pt', 'de', 'fr', 'it', 'id']
for code in LANGS:
    T, bad = ({}, 0) if code == 'en' else load_lang(code)
    tr_ = (lambda v: v) if code == 'en' else (lambda v: T.get(v, v))
    ex = {k: tr_(v) for k, v in exact.items()}
    for k, v in list(exact.items()):
        if len(k) <= 40 and '{' not in k:
            uk = up_tr(k)
            if uk != k and uk not in ex: ex[uk] = tr_(v).upper()
    pl = [(k, tr_(v)) for k, v in plist]
    var = 'LANG_' + code.upper()
    out = f'// Otomatik üretildi (tools/i18n/build.py): Türkçe → {code} sözlük\nvar {var} = ' + json.dumps({'exact': ex, 'pats': pl}, ensure_ascii=False, separators=(',', ':')) + f';\n(window.LANGS = window.LANGS || {{}}).{code} = {var};\n'
    open(ROOT + f'js/lang-{code}.js', 'w').write(out)
    done = sum(1 for v in src if v in T)
    print(code, len(ex), 'exact', len(pl), 'patterns', f'{done}/{len(src)} çevrildi' if code != 'en' else '', f'{bad} bozuk' if bad else '', len(out)//1024, 'KB')
print(nclub, 'clubs', len(keep), 'name-collisions', keep[:30])
