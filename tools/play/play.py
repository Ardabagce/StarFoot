#!/usr/bin/env python3
"""Google Play yükleme aracı (androidpublisher v3).

Kimlik: PLAY_SERVICE_ACCOUNT_JSON ortam değişkeni (servis hesabı JSON anahtarının içeriği).

  play.py upload --aab X.aab --track internal [--status completed|draft] [--version 1.0.17]
  play.py sale                # SALE='30:sku1,sku2' ile süreli indirim (geri almak: products)
  play.py products            # store/play/products.json'daki tek seferlik ürünleri oluşturur/günceller
  play.py check               # erişimi ve izi listeler
  play.py datasafety          # store/play/data_safety.csv'yi Veri güvenliği formuna yazar

Üretim (production) izi yalnız açıkça --track production verilirse kullanılır.
"""
import argparse, json, os, re, sys
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
       'pt-BR': 'pt-BR', 'it': 'it-IT', 'id': 'id', 'ja': 'ja-JP',
       'en-GB': 'en-GB', 'es-MX': 'es-419', 'pt-PT': 'pt-PT', 'zh-Hans': 'zh-CN'}


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
            w = v['whatsNew']
            if len(w) > 500:  # satır sonundan kes, cümle yarım kalmasın
                w = w[:500]
                w = w[:w.rfind('\n')] if '\n' in w else w
            out.append({'language': LOC[k], 'text': w.strip()})
    return out


def upload(a):
    s = session()
    if a.track == 'production' and os.environ.get('PLAY_ALLOW_PROD') != '1':
        sys.exit('Üretim izi için PLAY_ALLOW_PROD=1 gerekir (sahibinin onayı).')
    e = ok(s.post(f'{API}/{PKG}/edits'), 'edit')['id']
    print('edit', e)
    with open(a.aab, 'rb') as f:
        r = s.post(f'{UP}/{PKG}/edits/{e}/bundles?uploadType=media', data=f,
                   headers={'Content-Type': 'application/octet-stream'}, timeout=900)
    m = re.search(r'Version code (\d+) has already been used', r.text) if r.status_code >= 300 else None
    if m:
        # paket başka bir ize zaten yüklenmiş: aynı sürüm kodunu bu ize taşı
        vc = int(m.group(1))
        print('zaten yüklü, taşınıyor: versionCode', vc)
    else:
        vc = ok(r, 'bundle')['versionCode']
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


RV = 'regionsVersion.version=2025/03'


def money(m):
    """{'currencyCode','units','nanos'} sözlüğünü olduğu gibi döndürür (convertRegionPrices çıktısı)."""
    return {k: m[k] for k in ('currencyCode', 'units', 'nanos') if k in m}


def products(a, sale=None):
    """Yeni tek seferlik ürün API'si (monetization.onetimeproducts).
    sale = (yüzde, [sku]) verilirse yalnız o ürünler indirimli fiyatla güncellenir; 'products' tekrar çalışınca
    products.json'daki normal fiyatlar geri gelir."""
    s = session()
    base = f'{API}/{PKG}/oneTimeProducts'
    for p in CFG['products']:
        price = p['price']
        if sale:
            pct, skus = sale
            if p['sku'] not in skus:
                continue
            v = float(price) * (1 - pct / 100)
            price = f'{max(0.49, int(v * 10) / 10 + 0.09):.2f}'  # 1.99 -> 1.39, 3.99 -> 2.79, 7.99 -> 5.59
            print(f"{p['sku']}: {p['price']} -> {price} USD (%{pct:g} indirim)")
        u, c = price.split('.')
        usd = {'currencyCode': 'USD', 'units': u, 'nanos': int(c.ljust(9, '0'))}
        conv = ok(s.post(f'{API}/{PKG}/pricing:convertRegionPrices', json={'price': usd}), 'fiyat çevirme')
        regions = [{'regionCode': rc, 'price': money(v['price']), 'availability': 'AVAILABLE'}
                   for rc, v in conv.get('convertedRegionPrices', {}).items()]
        body = {
            'packageName': PKG, 'productId': p['sku'],
            'listings': [{'languageCode': lang, 'title': v['title'][:55],
                          'description': (v['description'] or v['title'])[:200]}
                         for lang, v in p['listings'].items()],
            'purchaseOptions': [{
                'purchaseOptionId': 'buy',
                'buyOption': {'legacyCompatible': True, 'multiQuantityEnabled': False},
                'regionalPricingAndAvailabilityConfigs': regions,
            }],
        }
        mask = 'listings,purchaseOptions'
        rv = conv.get('regionVersion', {}).get('version', '2025/03')
        r = s.patch(f'{API}/{PKG}/onetimeproducts/{p["sku"]}?allowMissing=true&updateMask={mask}&regionsVersion.version={rv}', json=body)
        if r.status_code >= 300:
            print(f'HATA {p["sku"]}: {r.status_code} {r.text[:1500]}')
            continue
        r2 = s.post(f'{base}/{p["sku"]}/purchaseOptions:batchUpdateStates', json={'requests': [
            {'activatePurchaseOptionRequest': {'packageName': PKG, 'productId': p['sku'], 'purchaseOptionId': 'buy'}}]})
        st = 'etkin' if r2.status_code < 300 else f'etkinleştirilemedi {r2.status_code} {r2.text[:400]}'
        print(f'{p["sku"]} hazır ({price} USD, {len(regions)} ülke) — {st}')


def listing(a):
    """Mağaza sayfası: başlık, kısa/tam açıklama, simge, öne çıkan görsel, telefon ekran görüntüleri."""
    s = session()
    cfg = json.load(open(os.path.join(ROOT, 'store/play/listing.json')))
    meta = json.load(open(os.path.join(ROOT, 'store/asc/metadata.json')))['locales']
    D = os.path.join(ROOT, 'store/play')
    e = ok(s.post(f'{API}/{PKG}/edits'), 'edit')['id']
    have = [x['language'] for x in ok(s.get(f'{API}/{PKG}/edits/{e}/listings'), 'listeler').get('listings', [])]
    print('Play\'deki diller:', have)
    langs = list(dict.fromkeys(list(cfg['listings']) + have))

    def up(lang, kind, path):
        with open(path, 'rb') as f:
            ok(s.post(f'{UP}/{PKG}/edits/{e}/listings/{lang}/{kind}?uploadType=media', data=f,
                      headers={'Content-Type': 'image/png'}, timeout=300), f'{lang} {kind}')

    for lang in langs:
        c = cfg['listings'].get(lang)
        if c:
            m = meta[c['asc']]
            body = {'language': lang, 'title': m['name'][:30], 'shortDescription': c['short'][:80],
                    'fullDescription': m['description'][:4000]}
            ok(s.put(f'{API}/{PKG}/edits/{e}/listings/{lang}', json=body), f'{lang} metin')
        img = c['img'] if c else cfg['other_img']
        for kind in ('icon', 'featureGraphic', 'phoneScreenshots'):
            ok(s.delete(f'{API}/{PKG}/edits/{e}/listings/{lang}/{kind}'), f'{lang} {kind} sil')
        up(lang, 'icon', os.path.join(D, 'icon-512.png'))
        up(lang, 'featureGraphic', os.path.join(D, f'feature-{img}.png'))
        for i in range(1, 7):
            up(lang, 'phoneScreenshots', os.path.join(D, 'shots', f'{img}-{i}.png'))
        print(f'{lang}: {"metin + " if c else ""}görseller ({img})')
    r = s.post(f'{API}/{PKG}/edits/{e}:commit')
    if r.status_code >= 300 and 'changesNotSentForReview' in r.text:
        r = s.post(f'{API}/{PKG}/edits/{e}:commit?changesNotSentForReview=true')
    ok(r, 'commit')
    print('TAMAM: mağaza sayfası güncellendi')


def sale(a):
    """SALE='30:sku1,sku2' -> o ürünlerin fiyatını yüzde kadar indirir (normal fiyata dönüş: products)."""
    spec = os.environ.get('SALE', '').strip()
    pct, skus = spec.split(':', 1)
    products(a, (float(pct), [x.strip() for x in skus.split(',') if x.strip()]))


def check(a):
    # hangi servis hesabıyla girildiğini göster (e-posta gizli değildir; anahtarın kendisi yazdırılmaz)
    try:
        info = json.loads(os.environ.get('PLAY_SERVICE_ACCOUNT_JSON', '{}'))
        em = info.get('client_email', '?')
        print('Servis hesabı:', em.replace('@', ' [at] '), '| proje:', info.get('project_id', '?'))
    except Exception as e:
        print('Anahtar okunamadı (JSON değil):', type(e).__name__)
    s = session()
    e = ok(s.post(f'{API}/{PKG}/edits'), 'edit')['id']
    for t in ok(s.get(f'{API}/{PKG}/edits/{e}/tracks'), 'tracks').get('tracks', []):
        for r in t.get('releases', []):
            print(t['track'], r.get('name'), r.get('status'), r.get('versionCodes'))
    s.delete(f'{API}/{PKG}/edits/{e}')
    r = s.get(f'{API}/{PKG}/oneTimeProducts')
    print('ürünler:', [p['productId'] for p in r.json().get('oneTimeProducts', [])] if r.ok else r.text[:500])
    if r.ok:
        # her ürünün satın alma seçenekleri: durum ve eski sürümlerle uyumluluk (RevenueCat/Billing bunları görür)
        for p in r.json().get('oneTimeProducts', []):
            opts = [(o.get('purchaseOptionId'), o.get('state'), (o.get('buyOption') or {}).get('legacyCompatible'), len(o.get('regionalPricingAndAvailabilityConfigs') or [])) for o in p.get('purchaseOptions', [])]
            print(' ', p['productId'], opts)


def datasafety(a):
    s = session()
    csv = open(os.path.join(ROOT, 'store/play/data_safety.csv'), encoding='utf-8').read()
    ok(s.post(f'{API}/{PKG}/dataSafety', json={'safetyLabels': csv}), 'veri güvenliği')
    print('TAMAM: Veri güvenliği formu güncellendi')


def vitals(a):
    """Sürüme göre ANR ve çökme oranı (son 28 gün) + ANR/çökme kümeleri ve örnek yığın izleri (Play Developer Reporting API)."""
    import datetime as dt
    raw = os.environ.get('PLAY_SERVICE_ACCOUNT_JSON', '').strip()
    cred = service_account.Credentials.from_service_account_info(
        json.loads(raw), scopes=['https://www.googleapis.com/auth/playdeveloperreporting'])
    cred.refresh(Request())
    s = requests.Session()
    s.headers['Authorization'] = 'Bearer ' + cred.token
    R = f'https://playdeveloperreporting.googleapis.com/v1beta1/apps/{PKG}'
    ymd = lambda d: {'year': d.year, 'month': d.month, 'day': d.day}
    LA = {'id': 'America/Los_Angeles'}
    # oranlar: Play'in "kötü davranış eşiği" ANR %0.47, çökme %1.09 (kullanıcının algıladığı)
    for name, mets in (('anrRateMetricSet', ['anrRate', 'userPerceivedAnrRate', 'distinctUsers']),
                       ('crashRateMetricSet', ['crashRate', 'userPerceivedCrashRate', 'distinctUsers'])):
        info = s.get(f'{R}/{name}')
        if not info.ok:
            print('HATA', name, info.status_code, info.text[:500]); continue
        end = None
        for f in info.json().get('freshnessInfo', {}).get('freshnesses', []):
            if f.get('aggregationPeriod') == 'DAILY':
                e = f['latestEndTime']; end = dt.date(e['year'], e['month'], e['day'])
        end = end or (dt.date.today() - dt.timedelta(days=2))
        body = {'timelineSpec': {'aggregationPeriod': 'DAILY', 'startTime': {**ymd(end - dt.timedelta(days=28)), 'timeZone': LA},
                                 'endTime': {**ymd(end), 'timeZone': LA}},
                'dimensions': ['versionCode'], 'metrics': mets, 'pageSize': 1000}
        r = s.post(f'{R}/{name}:query', json=body)
        if not r.ok:
            print('HATA', name, r.status_code, r.text[:500]); continue
        agg = {}
        for row in r.json().get('rows', []):
            v = next((d.get('stringValue') or d.get('int64Value') for d in row.get('dimensions', [])), '?')
            m = {x['metric']: float(x.get('decimalValue', {}).get('value', 0) or 0) for x in row.get('metrics', [])}
            g = agg.setdefault(v, {'u': 0, 'w': {}})
            u = m.get('distinctUsers', 0); g['u'] += u
            for k in mets[:2]:
                g['w'][k] = g['w'].get(k, 0) + m.get(k, 0) * u
        print(f'== {name} ({end - dt.timedelta(days=28)} .. {end})')
        for v in sorted(agg, key=lambda x: int(x) if str(x).isdigit() else 0):
            g = agg[v]
            rates = ', '.join(f'{k}={g["w"][k] / g["u"] * 100:.2f}%' for k in mets[:2]) if g['u'] else '-'
            print(f'   versionCode {v}: kullanıcı-gün {int(g["u"])}, {rates}')
    today = dt.datetime.now(dt.timezone.utc).date()
    iv = {'interval.startTime.year': (today - dt.timedelta(days=30)).year, 'interval.startTime.month': (today - dt.timedelta(days=30)).month,
          'interval.startTime.day': (today - dt.timedelta(days=30)).day,
          'interval.endTime.year': today.year, 'interval.endTime.month': today.month, 'interval.endTime.day': today.day}
    for t in ('ANR', 'CRASH'):
        r = s.get(f'{R}/errorIssues:search', params={'filter': f'errorIssueType = {t}', 'pageSize': 15, **iv})
        if not r.ok:
            print('HATA', t, r.status_code, r.text[:800]); continue
        for i in r.json().get('errorIssues', []):
            print('==', t, i.get('errorReportCount'), i.get('distinctUsers'), i.get('cause'), '|', i.get('location'), i.get('lastAppVersion', {}))
    r = s.get(f'{R}/errorReports:search', params={'filter': 'errorIssueType = ANR', 'pageSize': 6, **iv})
    if not r.ok:
        print('HATA raporlar', r.status_code, r.text[:800]); return
    for x in r.json().get('errorReports', []):
        print('#### rapor', x.get('appVersion'), x.get('deviceModel', {}).get('marketingName'), x.get('osVersion'))
        print('\n'.join(x.get('reportText', '').splitlines()[:70]))

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
    sub.add_parser('sale')
    sub.add_parser('check')
    sub.add_parser('listing')
    sub.add_parser('datasafety')
    sub.add_parser('vitals')
    a = ap.parse_args()
    {'upload': upload, 'products': products, 'sale': sale, 'check': check, 'listing': listing, 'datasafety': datasafety, 'vitals': vitals}[a.cmd](a)
