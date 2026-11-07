#!/usr/bin/env python3
"""Google Play yükleme aracı (androidpublisher v3).

Kimlik: PLAY_SERVICE_ACCOUNT_JSON ortam değişkeni (servis hesabı JSON anahtarının içeriği).

  play.py upload --aab X.aab --track internal [--status completed|draft] [--version 1.0.17]
  play.py products            # store/play/products.json'daki tek seferlik ürünleri oluşturur/günceller
  play.py check               # erişimi ve izi listeler

Üretim (production) izi yalnız açıkça --track production verilirse kullanılır.
"""
import argparse, json, os, sys
import requests
from google.oauth2 import service_account
from google.auth.transport.requests import Request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
API = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications'
UP = 'https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications'
CFG = json.load(open(os.path.join(ROOT, 'store/play/products.json')))
PKG = CFG['package']
# App Store yerel kodu -> Play dil kodu
LOC = {'tr': 'tr-TR', 'en-US': 'en-US', 'de-DE': 'de-DE', 'es-ES': 'es-ES', 'fr-FR': 'fr-FR',
       'pt-BR': 'pt-BR', 'it': 'it-IT', 'id': 'id', 'ja': 'ja-JP'}


def session():
    raw = os.environ.get('PLAY_SERVICE_ACCOUNT_JSON', '').strip()
    if not raw:
        sys.exit('PLAY_SERVICE_ACCOUNT_JSON sırrı yok.')
    cred = service_account.Credentials.from_service_account_info(
        json.loads(raw), scopes=['https://www.googleapis.com/auth/androidpublisher'])
    cred.refresh(Request())
    s = requests.Session()
    s.headers['Authorization'] = 'Bearer ' + cred.token
    return s


def ok(r, what):
    if r.status_code >= 300:
        print(f'HATA {what}: {r.status_code} {r.text[:1500]}')
        sys.exit(1)
    return r.json() if r.text else {}


def notes(version):
    """metadata.json whatsNew -> Play sürüm notları (en çok 500 karakter)."""
    meta = json.load(open(os.path.join(ROOT, 'store/asc/metadata.json')))
    out = []
    for k, v in meta['locales'].items():
        if k in LOC and v.get('whatsNew'):
            out.append({'language': LOC[k], 'text': v['whatsNew'][:500]})
    return out


def upload(a):
    s = session()
    if a.track == 'production' and os.environ.get('PLAY_ALLOW_PROD') != '1':
        sys.exit('Üretim izi için PLAY_ALLOW_PROD=1 gerekir (sahibinin onayı).')
    e = ok(s.post(f'{API}/{PKG}/edits'), 'edit')['id']
    print('edit', e)
    with open(a.aab, 'rb') as f:
        b = ok(s.post(f'{UP}/{PKG}/edits/{e}/bundles?uploadType=media', data=f,
                      headers={'Content-Type': 'application/octet-stream'}, timeout=900), 'bundle')
    vc = b['versionCode']
    print('yüklendi, versionCode', vc)
    rel = {'versionCodes': [str(vc)], 'status': a.status, 'releaseNotes': notes(a.version)}
    if a.version:
        rel['name'] = f'{a.version} ({vc})'
    if a.status == 'inProgress':
        rel['userFraction'] = a.fraction
    ok(s.put(f'{API}/{PKG}/edits/{e}/tracks/{a.track}', json={'track': a.track, 'releases': [rel]}), 'track')
    r = s.post(f'{API}/{PKG}/edits/{e}:commit')
    if r.status_code >= 300 and 'changesNotSentForReview' in r.text:
        # Play bazen değişikliklerin ayrıca incelemeye gönderilmesini ister
        r = s.post(f'{API}/{PKG}/edits/{e}:commit?changesNotSentForReview=true')
    ok(r, 'commit')
    print(f'TAMAM: {vc} -> {a.track} ({a.status})')


def products(a):
    s = session()
    have = {p['sku'] for p in ok(s.get(f'{API}/{PKG}/inappproducts'), 'liste').get('inappproduct', [])}
    for p in CFG['products']:
        listings = {lang: {'title': v['title'][:55], 'description': (v['description'] or v['title'])[:200]}
                    for lang, v in p['listings'].items()}
        body = {
            'packageName': PKG, 'sku': p['sku'], 'status': 'active', 'purchaseType': 'managedUser',
            'defaultLanguage': 'en-US', 'listings': listings,
            'defaultPrice': {'priceMicros': str(round(float(p['price']) * 1e6)), 'currency': 'USD'},
        }
        q = 'autoConvertMissingPrices=true'
        if p['sku'] in have:
            r = s.put(f'{API}/{PKG}/inappproducts/{p["sku"]}?{q}', json=body)
            what = 'güncellendi'
        else:
            r = s.post(f'{API}/{PKG}/inappproducts?{q}', json=body)
            what = 'oluşturuldu'
        if r.status_code >= 300:
            print(f'HATA {p["sku"]}: {r.status_code} {r.text[:800]}')
        else:
            print(f'{p["sku"]} {what} ({p["price"]} USD)')


def check(a):
    s = session()
    e = ok(s.post(f'{API}/{PKG}/edits'), 'edit')['id']
    for t in ok(s.get(f'{API}/{PKG}/edits/{e}/tracks'), 'tracks').get('tracks', []):
        for r in t.get('releases', []):
            print(t['track'], r.get('name'), r.get('status'), r.get('versionCodes'))
    s.delete(f'{API}/{PKG}/edits/{e}')
    n = ok(s.get(f'{API}/{PKG}/inappproducts'), 'liste').get('inappproduct', [])
    print('ürünler:', [p['sku'] for p in n])


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest='cmd', required=True)
    u = sub.add_parser('upload')
    u.add_argument('--aab', required=True)
    u.add_argument('--track', default='internal')
    u.add_argument('--status', default='completed', choices=['completed', 'draft', 'inProgress'])
    u.add_argument('--fraction', type=float, default=0.2)
    u.add_argument('--version', default='')
    sub.add_parser('products')
    sub.add_parser('check')
    a = ap.parse_args()
    {'upload': upload, 'products': products, 'check': check}[a.cmd](a)
