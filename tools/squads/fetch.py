#!/usr/bin/env python3
"""Kulüp kadrolarını dönemleriyle Wikidata'dan (CC0) çeker.

Kullanım: python3 tools/squads/fetch.py <çıktı klasörü> [KULÜP_KODU ...]
Her kulüp için <klasör>/<KOD>.json: oyuncu, kulüpteki başlangıç/bitiş yılı, doğum yılı,
mevki, uyruk, maç sayısı ve tanınırlık (Wikipedia dil sayısı).
"""
import json
import os
import sys
import time
import urllib.parse
import urllib.request

UA = 'StarFootSquadTool/0.1 (https://starfoot.bagce.dev)'
SPARQL = 'https://query.wikidata.org/sparql'

# Oyundaki kulüp kodu -> Wikidata kimliği (futbol şubesi)
CLUBS = {
    'GAL': 'Q495299', 'FNK': 'Q6601875', 'BJK': 'Q172567', 'TRB': 'Q192641',
    'RMA': 'Q8682', 'BAR': 'Q7156', 'ATM': 'Q8701',
    'MUN': 'Q18656', 'LIV': 'Q1130849', 'ARS': 'Q9617', 'CHE': 'Q9616', 'MCI': 'Q50602',
    'BAY': 'Q15789', 'BVB': 'Q41420',
    'JUV': 'Q1422', 'MIL': 'Q1543', 'INT': 'Q631', 'NAP': 'Q2641', 'ROM': 'Q2739',
    'PSG': 'Q483020', 'AJX': 'Q81888', 'BEN': 'Q131499', 'POR': 'Q128446',
}


def get(url, params, accept='application/json', tries=6):
    q = url + '?' + urllib.parse.urlencode(params)
    for i in range(tries):
        try:
            req = urllib.request.Request(q, headers={'User-Agent': UA, 'Accept': accept})
            with urllib.request.urlopen(req, timeout=90) as r:
                return json.loads(r.read().decode('utf-8'))
        except Exception as e:  # sınırlama ya da geçici hata: bekle, tekrar dene
            wait = 4 * (i + 1)
            print(f'  tekrar ({e.__class__.__name__}), {wait} sn', file=sys.stderr)
            time.sleep(wait)
    raise RuntimeError('istek başarısız: ' + url)


QUERY = '''SELECT ?p ?pLabel ?start ?end ?birth ?posLabel ?apps ?natCode ?links WHERE {
  ?p p:P54 ?st . ?st ps:P54 wd:%s .
  ?p wdt:P106 wd:Q937857 .
  OPTIONAL { ?st pq:P580 ?start } OPTIONAL { ?st pq:P582 ?end } OPTIONAL { ?st pq:P1350 ?apps }
  OPTIONAL { ?p wdt:P569 ?birth } OPTIONAL { ?p wdt:P413 ?pos }
  OPTIONAL { ?p wdt:P1532 ?nat . ?nat wdt:P298 ?natCode }
  OPTIONAL { ?p wikibase:sitelinks ?links }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "tr,en". }
}'''


def year(b, k):
    v = b.get(k, {}).get('value')
    return int(v[:4]) if v and v[:4].lstrip('-').isdigit() else None


def fetch_club(qid):
    r = get(SPARQL, {'query': QUERY % qid, 'format': 'json'}, 'application/sparql-results+json')
    out = {}
    for b in r['results']['bindings']:
        pid = b['p']['value'].rsplit('/', 1)[1]
        e = out.setdefault(pid, {'id': pid, 'name': b['pLabel']['value'], 'birth': year(b, 'birth'), 'pos': set(), 'nat': set(), 'spells': set(), 'apps': 0, 'links': 0})
        if b.get('posLabel'):
            e['pos'].add(b['posLabel']['value'])
        if b.get('natCode'):
            e['nat'].add(b['natCode']['value'])
        e['spells'].add((year(b, 'start'), year(b, 'end')))
        if b.get('apps'):
            e['apps'] = max(e['apps'], int(float(b['apps']['value'])))
        if b.get('links'):
            e['links'] = int(b['links']['value'])
    res = []
    for e in out.values():
        e['pos'] = sorted(e['pos']); e['nat'] = sorted(e['nat'])
        e['spells'] = sorted([list(s) for s in e['spells']], key=lambda s: (s[0] or 0))
        res.append(e)
    return res


def main():
    outdir = sys.argv[1]
    codes = sys.argv[2:] or list(CLUBS)
    os.makedirs(outdir, exist_ok=True)
    for code in codes:
        qid, label = CLUBS[code], code
        print(code, qid)
        players = fetch_club(qid)
        json.dump({'code': code, 'qid': qid, 'label': label, 'players': players}, open(os.path.join(outdir, code + '.json'), 'w'), ensure_ascii=False)
        print('  oyuncu:', len(players))
        time.sleep(2)


if __name__ == '__main__':
    main()
