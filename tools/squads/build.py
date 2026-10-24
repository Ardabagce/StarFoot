#!/usr/bin/env python3
"""Wikidata ham verisinden yıla göre 18 kişilik kadro seçer ve isimleri oyunun tarzında değiştirir.

Kullanım: python3 tools/squads/build.py <ham klasör> <KOD:YIL,YIL ...>
Örnek:   python3 tools/squads/build.py raw GAL:1988,2000 FNK:2008 RMA:2002
"""
import difflib
import json
import os
import re
import sys
import unicodedata

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
NOW = 2026
# Oyunda asla yer almayacak isimler (gerçek adın içinde geçerse oyuncu tamamen atlanır)
BANNED = ['hakan sukur', 'arif erdem']

QUOTA = {'GK': 2, 'DF': 6, 'MF': 6, 'FW': 4}


def fold(s):
    s = s.replace('ı', 'i').replace('İ', 'I')
    return ''.join(ch for ch in unicodedata.normalize('NFKD', s) if not unicodedata.combining(ch)).lower()


def pos_of(labels):
    t = ' '.join(labels).lower()
    if re.search(r'kaleci|goalkeeper', t): return 'GK'
    if re.search(r'orta ?saha|midfield|wing half|playmaker', t): return 'MF'
    if re.search(r'forvet|santrfor|forward|striker|kanat|winger', t) and not re.search(r'wing-back|kanat bek', t): return 'FW'
    if re.search(r'savunma|defans|bek|stoper|libero|defender|back|sweeper', t): return 'DF'
    return None


# ---------- isim değiştirme ----------
TR_VOWELS = 'aıoueiöü'


def harmony(word):
    for ch in reversed(word.lower()):
        if ch in 'aı': return 'ı'
        if ch in 'ou': return 'u'
        if ch in 'ei': return 'i'
        if ch in 'öü': return 'ü'
    return 'i'


def translit(s):
    rep = [('sch', 'ş'), ('tsch', 'ç'), ('sh', 'ş'), ('ch', 'ç'), ('ph', 'f'), ('th', 't'), ('ck', 'k'), ('qu', 'k'), ('q', 'k'),
           ('w', 'v'), ('x', 'ks'), ('ć', 'ç'), ('č', 'ç'), ('š', 'ş'), ('ž', 'j'), ('đ', 'c'), ('ñ', 'ny'), ('ł', 'l'), ('ø', 'ö'), ('å', 'o'), ('æ', 'e')]
    out = s
    for a, b in rep:
        out = out.replace(a, b).replace(a.capitalize(), b.upper() if len(b) == 1 else b.capitalize())
    keep = set('çşğüöıİÇŞĞÜÖ')
    return ''.join(ch if ch in keep else ''.join(c for c in unicodedata.normalize('NFKD', ch) if not unicodedata.combining(c)) for ch in out)


def mutate_word(w):
    """Yabancı soyadında küçük bir değişiklik (son ünlü)."""
    m = re.search(r'([aeiou])([^aeiou]*)$', w)
    if not m: return w + 'e'
    v = m.group(1)
    nv = {'o': 'u', 'a': 'o', 'e': 'o', 'i': 'y', 'u': 'o'}[v]
    if v == 'i' and m.end(1) == len(w): nv = 'y'
    return w[:m.start(1)] + nv + w[m.end(1):]


def short(name):
    name = re.sub(r'\s*\(.*?\)', '', name).strip()
    parts = [w for w in name.split() if w.lower() not in ('de', 'da', 'dos', 'das', 'do', 'del', 'van', 'von', 'der', 'y')] or name.split()
    if len(parts) > 2 and not re.search(r'-', name): parts = [parts[0], parts[-1]]
    return ' '.join(parts)


def alter(name, nats):
    name = short(name)
    parts = name.split()
    if 'TUR' in nats:
        if len(parts) == 1: return parts[0] + 'l' + harmony(parts[0])
        sur = parts[-1]
        if sur.lower().endswith('oğlu'):
            sur = sur[:-4] + 'oğulları'
        elif sur[-1].lower() in TR_VOWELS:
            sur = sur + 'l' + harmony(sur)
        else:
            sur = sur + 'l' + harmony(sur)
        return ' '.join(parts[:-1] + [sur])
    t = translit(name)
    tp = t.split()
    tp[-1] = mutate_word(tp[-1]) if fold(t) == fold(name) or len(tp) == 1 else tp[-1]
    out = ' '.join(tp)
    if fold(out) == fold(name):
        tp[-1] = mutate_word(tp[-1]); out = ' '.join(tp)
    return out


def existing_names():
    """Oyunda zaten var olan değiştirilmiş isimler (efsaneler + 2026 yıldızları), kulübe göre."""
    res = {}
    lg = open(os.path.join(ROOT, 'js', 'legends.js'), encoding='utf-8').read()
    for n, club in re.findall(r"\['([^']+)', '[A-Z]{2}', \d+, '[A-Z]{2,3}', \d{4}, '([A-Z]{3})'\]", lg):
        res.setdefault(club, []).append(n)
    dt = open(os.path.join(ROOT, 'js', 'data.js'), encoding='utf-8').read()
    st = dt[dt.index('const STARS = {'):dt.index('const NAME_POOLS')]
    for club, body in re.findall(r"\n  ([A-Z]{3}): \[(.*?)\],?\n", st):
        res.setdefault(club, []).extend(re.findall(r"\['([^']+)', '[A-Z]{2}'", body))
    return res


def toks(x):
    return [t for t in re.split(r'[\s\-]+', fold(x)) if t]


def ratio(a, b):
    return difflib.SequenceMatcher(None, a, b).ratio()


def name_score(real, c):
    R, C = toks(translit(short(real))), toks(c)
    if not R or not C: return 0
    r = ratio(' '.join(R), ' '.join(C))
    F = toks(translit(re.sub(r'\s*\(.*?\)', '', real)))  # kısaltılmamış tam ad
    if len(F) >= 2 and len(C) >= 2 and ratio(F[0], C[0]) >= 0.85:
        b = C[-1]
        for a in F[1:]:
            k = max(4, min(len(a), len(b)) - 1)
            if a[:k] == b[:k] or ratio(a, b) >= 0.72: r = max(r, 0.9)
    # tek kelimelik takma adlar: yalnız çok yakınsa (Ronaldo ≠ Ronaldinyo)
    if len(C) == 1:
        t = max(ratio(x, C[0]) for x in R)
        if t >= 0.88: r = max(r, t)
    if len(R) == 1:
        t = max(ratio(R[0], x) for x in C)
        if t >= 0.88: r = max(r, t)
    return r


def match_existing(real, cands, glob=()):
    """Oyunda zaten var olan isim: önce aynı kulüpte, sonra tüm efsanelerde (daha sıkı)."""
    best, score = None, 0
    for c in cands:
        r = name_score(real, c)
        if r > score: best, score = c, r
    if score >= 0.85: return best
    for c in glob:
        r = name_score(real, c)
        if r >= 0.9 and r > score: best, score = c, r
    return best if score >= 0.9 else None


def spell_end(p, s, e):
    """Bitişi girilmemiş dönem: sonraki kulübe geçtiği yıl, yoksa yakın tarihliyse güncel, değilse 3 yıl."""
    if e is not None: return e
    nxt = [y for y, lab in p.get('moves', []) if y > s]
    if nxt: return max(s, min(nxt) - 1)
    return NOW if s >= NOW - 3 else s + 3


def squad(players, yr, exist, glob=()):
    pool = []
    for p in players:
        if any(b in fold(p['name']) for b in BANNED): continue
        if not p['birth'] or not re.search(r'[A-Za-zÇŞĞÜÖİçşğüöı]', p['name']) or re.match(r'^Q\d+$', p['name']): continue
        age = yr - p['birth']
        if age < 17 or age > 37: continue
        on = False
        for s, e in p['spells']:
            if s is None: continue
            e = spell_end(p, s, e)
            if s <= yr <= e: on = True
        if not on: continue
        pos = pos_of(p['pos'])
        score = p['links'] * 2 + min(p['apps'], 400) / 8
        pool.append((score, pos, p))
    pool.sort(key=lambda x: -x[0])
    pick, used = [], set()
    for k, n in QUOTA.items():
        for sc, pos, p in pool:
            if len([1 for q in pick if q[1] == k]) >= n: break
            if pos == k and p['id'] not in used: pick.append((sc, k, p)); used.add(p['id'])
    for sc, pos, p in pool:
        if len(pick) >= 18: break
        if p['id'] not in used: pick.append((sc, pos or 'MF', p)); used.add(p['id'])
    out = []
    for sc, pos, p in pick:
        ex = match_existing(p['name'], exist, glob)
        out.append({'id': p['id'], 'pos': pos, 'real': p['name'], 'game': ex or alter(p['name'], p['nat']), 'kept': bool(ex), 'nat': (p['nat'] or ['?'])[0], 'age': yr - p['birth'], 'score': round(sc)})
    order = {'GK': 0, 'DF': 1, 'MF': 2, 'FW': 3}
    out.sort(key=lambda x: (order.get(x['pos'], 4), -x['score']))
    return out


def main():
    raw = sys.argv[1]
    ex = existing_names()
    for spec in sys.argv[2:]:
        code, yrs = spec.split(':')
        data = json.load(open(os.path.join(raw, code + '.json'), encoding='utf-8'))
        for y in map(int, yrs.split(',')):
            sq = squad(data['players'], y, ex.get(code, []))
            print(f'\n## {code} {y} ({len(sq)})')
            for r in sq:
                print(f"  {r['pos']}  {r['game']:<28} ← {r['real']:<30} {r['nat']} {r['age']}{'  (oyunda var)' if r['kept'] else ''}")


if __name__ == '__main__':
    main()
