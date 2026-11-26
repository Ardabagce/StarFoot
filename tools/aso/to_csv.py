#!/usr/bin/env python3
"""store/aso/ranks.json -> store/aso/keywords.csv ve store/aso/charts.csv (takip panosu için)."""
import json, os, csv
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
d = json.load(open(os.path.join(ROOT, 'store/aso/ranks.json'), encoding='utf-8'))
with open(os.path.join(ROOT, 'store/aso/keywords.csv'), 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f); w.writerow(['date', 'country', 'keyword', 'rank', 'results'])
    for r in d['runs']:
        for cc, kw in r.get('ranks', {}).items():
            for k, (pos, n) in kw.items(): w.writerow([r['date'], cc, k, pos or '', n])
with open(os.path.join(ROOT, 'store/aso/charts.csv'), 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f); w.writerow(['date', 'country', 'chart', 'rank', 'size'])
    for r in d['runs']:
        for cc, ch in r.get('charts', {}).items():
            for k, (pos, n) in ch.items(): w.writerow([r['date'], cc, k, pos or '', n])
print('ok')
