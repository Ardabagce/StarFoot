#!/usr/bin/env python3
"""map.json (oyuncular) ve clubs.json (kulüpler) değişikliklerini oyun kaynaklarına ve çeviri kaynaklarına uygular,
js/namefix.js (eski kayıtların taşınması için eski→yeni tablo) üretir. Tekrar çalıştırmak zararsızdır."""
import json, os, re, glob, base64
D = os.path.dirname(os.path.abspath(__file__)) + '/'
ROOT = os.path.abspath(D + '../../') + '/'
players = json.load(open(D + 'map.json'))
clubs = json.load(open(D + 'clubs.json'))
extra = json.load(open(D + 'extra_map.json')) if os.path.exists(D + 'extra_map.json') else {}

data = open(ROOT + 'js/data.js', encoding='utf-8').read()
old_club = {}
def fix_club(m):
    cid, name, short = m.group(1), m.group(2), m.group(3)
    if cid in clubs:
        nn, ns, _ = clubs[cid]
        if name != nn: old_club[name] = nn
        return f"['{cid}', '{nn}', '{ns or short}'"
    return m.group(0)
data = re.sub(r"\['([A-Z0-9]+)', '([^']+)', '([^']+)'(?=, '[A-Z0-9]+', \d+, '#)", fix_club, data)
open(ROOT + 'js/data.js', 'w', encoding='utf-8').write(data)
hist = json.load(open(D + 'clubs_old.json')) if os.path.exists(D + 'clubs_old.json') else {}
hist.update(old_club)
json.dump(hist, open(D + 'clubs_old.json', 'w'), ensure_ascii=False, indent=0, sort_keys=True)

M = {}
M.update({k: v for k, v in players.items() if k != v})
M.update(hist)
M.update(extra)
keys = sorted(M, key=len, reverse=True)
RX = re.compile(r'(?<![\w])(' + '|'.join(re.escape(k) for k in keys) + r')(?![\w])')
def sub(t): return RX.sub(lambda m: M[m.group(1)], t)

files = [f for f in glob.glob(ROOT + 'js/*.js') if not re.search(r'lang-|lz-string|namefix', f)]
I = ROOT + 'tools/i18n/'
files += [I + f for f in ('keys.json', 'extra.json', 'names.json', 'src_en.json')] + glob.glob(I + 't[0-9].json') + glob.glob(I + '*/*.txt')
n = 0
for f in files:
    t = open(f, encoding='utf-8').read(); u = sub(t)
    if u != t: open(f, 'w', encoding='utf-8').write(u); n += 1
# kulüp çevirileri: eski anahtarları kaldır, yenilerini ekle
ce = json.load(open(I + 'clubs_en.json'))
for o in hist: ce.pop(o, None)
for cid, (nn, ns, en) in clubs.items(): ce[nn] = en
json.dump(ce, open(I + 'clubs_en.json', 'w'), ensure_ascii=False, indent=0)
# kayıt taşıma tablosu (oyun açılırken eski kayıtlardaki isimleri günceller)
open(ROOT + 'js/namefix.js', 'w', encoding='utf-8').write(
    '// Eski sürüm kayıtlarındaki oyuncu/kulüp isimlerinin yeni (kurgusal) karşılıkları. tools/names/apply.py üretir.\n'
    'const NAME_FIX = ' + json.dumps([[base64.b64encode(k.encode()).decode(), v] for k, v in M.items() if k != v], ensure_ascii=False, separators=(',', ':')) + ';\n')
print('değişen dosya', n, 'eşleme', len(M))
