#!/usr/bin/env python3
"""Ham Wikidata verisinden oyunun kadro dosyasını (js/squads.js) üretir.

Kullanım: python3 tools/squads/make.py <ham klasör>
Her kulüp için, 1976-2026 arasında herhangi bir yılın 18 kişilik kadrosuna giren gerçek oyuncular
dönemleriyle yazılır. Oyun yılına göre kadroda olanları seçer, ayrılış yılı gelince çıkarır.
Kayıt: [oyundaki ad, mevki, [[geliş, ayrılış], ...], doğum yılı, uyruk, zirve gücü]
ayrılış 0 = bitmemiş (güncel).
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(__file__))
import build  # noqa: E402

ROOT = build.ROOT
FIRST, LAST = 1976, build.NOW
CODE_MAP = {'MCI': 'MCS', 'POR': 'FCP'}  # Wikidata aracındaki kod -> oyundaki kulüp kodu
ISO = {'DEU': 'GER', 'PRT': 'POR', 'URY': 'URU', 'NLD': 'NED', 'HRV': 'CRO', 'CHE': 'SUI', 'DNK': 'DEN', 'GRC': 'GRE', 'SVN': 'SVN',
       'ZAF': 'RSA', 'CHL': 'CHI', 'PRY': 'PAR', 'CRI': 'CRC', 'HTI': 'HAI', 'IRN': 'IRN', 'SAU': 'KSA', 'DZA': 'ALG', 'NGA': 'NGA',
       'CIV': 'CIV', 'CMR': 'CMR', 'GHA': 'GHA', 'SEN': 'SEN', 'MAR': 'MAR', 'TUN': 'TUN', 'EGY': 'EGY', 'CPV': 'CPV', 'KOR': 'KOR',
       'JPN': 'JPN', 'AUS': 'AUS', 'USA': 'USA', 'MEX': 'MEX', 'CAN': 'CAN', 'COL': 'COL', 'ECU': 'ECU', 'PER': 'PER', 'ARG': 'ARG',
       'BRA': 'BRA', 'FRA': 'FRA', 'ESP': 'ESP', 'ITA': 'ITA', 'BEL': 'BEL', 'NOR': 'NOR', 'SWE': 'SWE', 'POL': 'POL', 'CZE': 'CZE',
       'SVK': 'SVK', 'AUT': 'AUT', 'HUN': 'HUN', 'ROU': 'ROU', 'SRB': 'SRB', 'IRL': 'IRL', 'ALB': 'ALB', 'GEO': 'GEO', 'UKR': 'UKR',
       'AZE': 'AZE', 'TUR': 'TUR', 'URS': 'XX', 'GBR': 'ENG', 'ENG': 'ENG', 'SCO': 'SCO', 'WAL': 'WAL', 'NZL': 'NZL', 'JAM': 'JAM',
       'QAT': 'QAT', 'UZB': 'UZB', 'JOR': 'JOR', 'IRQ': 'IRQ', 'PAN': 'PAN', 'CUW': 'CUW'}
NAT_POOL = {'TR': 'TUR', 'EN': 'ENG', 'ES': 'ESP', 'DE': 'GER', 'IT': 'ITA', 'FR': 'FRA', 'NL': 'NED', 'PT': 'POR'}


def club_ratings():
    dt = open(os.path.join(ROOT, 'js', 'data.js'), encoding='utf-8').read()
    return {m[0]: (int(m[1]), m[2]) for m in re.findall(r"\['([A-Z]{3})', '[^']*', '[^']*', '[A-Z0-9]+', (\d+), '#[0-9a-f]{6}', '#[0-9a-f]{6}', '([A-Z]{2})'\]", dt)}


def legend_names():
    lg = open(os.path.join(ROOT, 'js', 'legends.js'), encoding='utf-8').read()
    return set(re.findall(r"\['([^']+)', '[A-Z]{2}', \d+, '[A-Z]{2,3}', \d{4}, '[A-Z]{3}'\]", lg))


def nat_of(p, pool):
    for n in p['nat']:
        if n in ISO: return ISO[n]
    if p['nat'] and len(p['nat'][0]) == 3: return 'XX'
    return NAT_POOL.get(pool, 'XX')


def spells_of(p):
    out = []
    for s, e in p['spells']:
        if s is None: continue
        e2 = build.spell_end(p, s, e)
        out.append([s, 0 if e is None and e2 == LAST and not [y for y, _ in p.get('moves', []) if y > s] else e2])
    out.sort()
    merged = []
    for s, e in out:
        if merged and (merged[-1][1] == 0 or s <= merged[-1][1] + 1):
            if merged[-1][1] != 0: merged[-1][1] = 0 if e == 0 else max(merged[-1][1], e)
        else:
            merged.append([s, e])
    return merged


def main():
    raw = sys.argv[1]
    ratings = club_ratings()
    legends = legend_names()
    exist = build.existing_names()
    names_by_id = {}  # aynı gerçek oyuncu farklı kulüplerde aynı adla
    out, total = {}, 0
    for f in sorted(os.listdir(raw)):
        if not f.endswith('.json'): continue
        data = json.load(open(os.path.join(raw, f), encoding='utf-8'))
        code = CODE_MAP.get(data['code'], data['code'])
        if code not in ratings: print('kulüp yok:', code); continue
        base, pool = ratings[code]
        chosen = {}
        for y in range(FIRST, LAST + 1):
            for r in build.squad(data['players'], y, exist.get(code, []), legends):
                chosen.setdefault(r['id'], r)
        players = {p['id']: p for p in data['players']}
        rows = []
        for pid, r in chosen.items():
            p = players[pid]
            name = names_by_id.get(pid) or r['game']
            names_by_id[pid] = name
            if name in legends: continue  # efsaneler kendi sistemiyle oyunda
            if any(b in build.fold(name) for b in build.BANNED): continue
            sp = spells_of(p)
            if not sp: continue
            rows.append([name, r['pos'], sp, p['birth'], nat_of(p, pool), r['score']])
        # zirve gücü: kulüp içindeki tanınırlık sırasına göre (kulübün gücü ± )
        rows.sort(key=lambda x: -x[5])
        n = len(rows)
        for i, row in enumerate(rows):
            pct = 1 - i / max(1, n - 1)
            row[5] = int(round(min(95, max(55, base - 7 + pct ** 1.4 * 14))))
        rows.sort(key=lambda x: (x[2][0][0], x[0]))
        out[code] = rows
        total += len(rows)
        print(code, len(rows))
    js = ['// Gerçek dönem kadroları (Wikidata, CC0; isimler oyun için değiştirildi). tools/squads/make.py ile üretilir.',
          '// [ad, mevki, [[geliş, ayrılış(0=güncel)]...], doğum yılı, uyruk, zirve gücü]',
          'const SQUADS = {']
    for code, rows in out.items():
        js.append(f'  {code}: {json.dumps(rows, ensure_ascii=False, separators=(",", ":"))},')
    js.append('};')
    open(os.path.join(ROOT, 'js', 'squads.js'), 'w', encoding='utf-8').write('\n'.join(js) + '\n')
    print('toplam', total)


if __name__ == '__main__':
    main()
