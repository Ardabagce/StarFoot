#!/usr/bin/env python3
"""App Store anahtar kelime sırası (iTunes Search API, ilk 200 sonuç).
store/aso/keywords.json'daki her ülke ve kelime için sırayı ölçer, store/aso/ranks.json'a bugünün tarihiyle ekler.
Not: Search API, App Store uygulamasındaki aramaya çok yakın ama birebir aynı değildir."""
import json, os, sys, time, datetime, urllib.request, urllib.parse
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CFG = os.path.join(ROOT, 'store/aso/keywords.json')
OUT = os.path.join(ROOT, 'store/aso/ranks.json')

def rank(app, term, cc):
    u = 'https://itunes.apple.com/search?' + urllib.parse.urlencode({'term': term, 'country': cc, 'entity': 'software', 'limit': 200})
    for wait in (0, 20, 60):
        time.sleep(wait)
        try:
            req = urllib.request.Request(u, headers={'User-Agent': 'aso-rank/1.0'})
            r = json.load(urllib.request.urlopen(req, timeout=30))['results']
            ids = [x.get('trackId') for x in r]
            return (ids.index(app) + 1 if app in ids else None), len(r)
        except Exception as e:
            err = e
    print('HATA', cc, term, err, file=sys.stderr)
    return 'err', 0

def chart(app, cc, genre, kind):
    """Kategori listesi sırası (Apple RSS, ilk 100)."""
    u = f'https://itunes.apple.com/{cc}/rss/{kind}/limit=200/genre={genre}/json'
    for wait in (0, 10, 30):
        time.sleep(wait)
        try:
            req = urllib.request.Request(u, headers={'User-Agent': 'aso-rank/1.0'})
            e = json.load(urllib.request.urlopen(req, timeout=30))['feed'].get('entry', [])
            ids = [int(x['id']['attributes']['im:id']) for x in e]
            return (ids.index(app) + 1 if app in ids else None), len(ids)
        except Exception as ex:
            err = ex
    print('HATA', cc, genre, kind, err, file=sys.stderr)
    return 'err', 0

def main():
    cfg = json.load(open(CFG, encoding='utf-8'))
    data = json.load(open(OUT, encoding='utf-8')) if os.path.exists(OUT) else {'runs': []}
    day = datetime.datetime.utcnow().strftime('%Y-%m-%d')
    only = sys.argv[1:]  # isteğe bağlı: yalnız bu ülkeler
    run = {'date': day, 'ranks': {}}
    for cc, terms in cfg['countries'].items():
        if only and cc not in only: continue
        run['ranks'][cc] = {}
        for t in terms:
            pos, n = rank(cfg['app_id'], t, cc)
            if pos == 'err': continue
            run['ranks'][cc][t] = [pos, n]
            print(f'{cc} {t:28} {("#" + str(pos)) if pos else "200+":>6} ({n})')
            time.sleep(3)
    run['charts'] = {}
    for cc in cfg.get('chart_countries', []):
        if only and cc not in only: continue
        run['charts'][cc] = {}
        for name, genre in cfg.get('charts', {}).items():
            for kind, k in (('topfreeapplications', 'free'), ('topgrossingapplications', 'grossing')):
                pos, n = chart(cfg['app_id'], cc, genre, kind)
                if pos == 'err': continue
                run['charts'][cc][f'{name}_{k}'] = [pos, n]
                print(f'{cc} {name}_{k:9} {("#" + str(pos)) if pos else "liste dışı":>10} ({n})')
                time.sleep(1)
    # aynı gün ikinci çalışma: o günün kaydını günceller
    old = next((r for r in data['runs'] if r['date'] == day), None)
    if old:
        for key in ('ranks', 'charts'):
            for cc, v in run.get(key, {}).items(): old.setdefault(key, {}).setdefault(cc, {}).update(v)
    else:
        data['runs'].append(run)
    data['runs'].sort(key=lambda r: r['date'])
    json.dump(data, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))

if __name__ == '__main__':
    main()
