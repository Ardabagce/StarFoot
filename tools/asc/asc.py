#!/usr/bin/env python3
"""App Store Connect mağaza bilgilerini store/asc/metadata.json'dan doldurur.

Her dil için: ad, alt başlık, gizlilik URL'si (uygulama bilgisi) ve açıklama, anahtar kelimeler,
tanıtım metni, yenilikler, destek/pazarlama URL'si (düzenlenebilir sürüm). İstenirse ekran görüntüsü yükler.

Ortam değişkenleri: ASC_KEY_P8 (.p8 içeriği), ASC_KEY_ID, ASC_ISSUER_ID
Seçenekler: --version 1.0.6 (düzenlenebilir sürüm yoksa oluşturur), --screens (boş setlere görsel yükle),
            --replace-screens (mevcut görselleri silip yeniden yükle), --dry-run
"""
import argparse, hashlib, json, os, re, sys, time
from pathlib import Path

import jwt
import requests

BUNDLE = 'app.vercel.starfoot.twa'
API = 'https://api.appstoreconnect.apple.com'
ROOT = Path(__file__).resolve().parents[2]
EDITABLE = {'PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'REJECTED', 'METADATA_REJECTED', 'INVALID_BINARY'}
# ekran görüntüsü setleri: App Store görüntü türü -> klasör
SCREENS = {'APP_IPHONE_67': 'store/premium/ios', 'APP_IPHONE_61': 'store/premium/ios-1206x2622'}
# dil -> görsel dosya öneki (yoksa İngilizce)
SHOT_PREFIX = {'tr': 'tr', 'es-ES': 'es', 'es-MX': 'es', 'pt-BR': 'pt', 'pt-PT': 'pt', 'de-DE': 'de',
               'fr-FR': 'fr', 'it': 'it', 'id': 'id', 'ar-SA': 'ar', 'ja': 'ja'}


class ASC:
    def __init__(self, dry):
        self.dry = dry
        self.key = os.environ['ASC_KEY_P8']
        self.kid = os.environ['ASC_KEY_ID']
        self.iss = os.environ['ASC_ISSUER_ID']
        self._tok, self._exp = None, 0

    def token(self):
        if time.time() > self._exp - 60:
            self._exp = int(time.time()) + 15 * 60
            self._tok = jwt.encode({'iss': self.iss, 'exp': self._exp, 'aud': 'appstoreconnect-v1'}, self.key,
                                   algorithm='ES256', headers={'kid': self.kid, 'typ': 'JWT'})
        return self._tok

    def req(self, method, path, body=None, params=None, write=False):
        if write and self.dry:
            print(f'   [deneme] {method} {path} {json.dumps(body, ensure_ascii=False)[:160] if body else ""}')
            return {'data': {'id': 'DRY', 'attributes': {}}}
        # Apple'ın sunucusu zaman zaman bir dakikadan uzun yanıtsız kalıyor: birkaç kez yeniden dene
        # Apple'ın sunucusu zaman zaman yanıtsız kalıyor ya da 5xx dönüyor: artan aralıklarla yeniden dene
        for i in range(6):
            wait = 15 * (i + 1)
            try:
                r = requests.request(method, API + path, params=params, json=body, timeout=120,
                                     headers={'Authorization': 'Bearer ' + self.token(), 'Content-Type': 'application/json'})
            except (requests.Timeout, requests.ConnectionError) as err:
                if i == 5:
                    raise RuntimeError(f'{method} {path} -> yanıt yok ({err.__class__.__name__})')
                print(f'   … {method} yanıt vermedi, {wait} sn sonra yeniden deneniyor')
                time.sleep(wait)
                continue
            if r.status_code < 500 or i == 5:
                break
            print(f'   … {method} sunucu hatası {r.status_code}, {wait} sn sonra yeniden deneniyor')
            time.sleep(wait)
        if r.status_code >= 400:
            try:
                errs = r.json().get('errors', [])
                msg = '; '.join(f"{e.get('title')}: {e.get('detail')}" for e in errs)
            except Exception:
                msg = r.text[:500]
            raise RuntimeError(f'{method} {path} -> {r.status_code} {msg}')
        return r.json() if r.content else {}

    def get(self, path, **params):
        return self.req('GET', path, params=params)


def pick_version(asc, app_id, want):
    vs = asc.get(f'/v1/apps/{app_id}/appStoreVersions', **{'filter[platform]': 'IOS', 'limit': 20})['data']
    for v in vs:
        print(f"   sürüm {v['attributes']['versionString']}: {v['attributes']['appStoreState']}")
    ed = [v for v in vs if v['attributes']['appStoreState'] in EDITABLE]
    if ed:
        v = ed[0]
        # hiç yayınlanmamış düzenlenebilir sürüm farklı numaradaysa (ör. geri çekilen 1.0.7), istenen numaraya çevir
        if want and v['attributes']['versionString'] != want:
            print(f"   sürüm numarası değişiyor: {v['attributes']['versionString']} -> {want}")
            v = asc.req('PATCH', f"/v1/appStoreVersions/{v['id']}", write=True, body={'data': {
                'type': 'appStoreVersions', 'id': v['id'], 'attributes': {'versionString': want}}}).get('data', v)
        return v
    if not want:
        # uygulamadaki sürüm numarası (Xcode projesi): App Store sürümü bununla aynı olmalı
        m = re.search(r'MARKETING_VERSION = ([\d.]+);', (ROOT / 'app/ios/App/App.xcodeproj/project.pbxproj').read_text())
        want = m.group(1) if m else ''
    if any(v['attributes']['versionString'] == want for v in vs):
        sys.exit(f'{want} sürümü düzenlenebilir durumda değil (inceleniyor ya da yayında). Yeni bir sürüm numarasıyla çalıştır: --version 1.0.6')
    if not want:
        sys.exit('Düzenlenebilir sürüm yok; --version ile bir sürüm numarası ver.')
    print(f'   yeni sürüm oluşturuluyor: {want}')
    return asc.req('POST', '/v1/appStoreVersions', write=True, body={'data': {
        'type': 'appStoreVersions', 'attributes': {'platform': 'IOS', 'versionString': want},
        'relationships': {'app': {'data': {'type': 'apps', 'id': app_id}}}}})['data']


def pick_appinfo(asc, app_id):
    infos = asc.get(f'/v1/apps/{app_id}/appInfos')['data']
    for i in infos:
        st = i['attributes'].get('state') or i['attributes'].get('appStoreState')
        print(f"   uygulama bilgisi {i['id']}: {st}")
    live = {'READY_FOR_DISTRIBUTION', 'READY_FOR_SALE', 'REPLACED_WITH_NEW_INFO'}
    ed = [i for i in infos if (i['attributes'].get('state') or i['attributes'].get('appStoreState')) not in live]
    return (ed or infos)[0]


def upsert(asc, kind, parent_rel, parent_type, parent_id, existing, loc, attrs):
    if loc in existing:
        asc.req('PATCH', f'/v1/{kind}/{existing[loc]}', write=True,
                body={'data': {'type': kind, 'id': existing[loc], 'attributes': attrs}})
        return existing[loc], 'güncellendi'
    d = asc.req('POST', f'/v1/{kind}', write=True, body={'data': {
        'type': kind, 'attributes': dict(attrs, locale=loc),
        'relationships': {parent_rel: {'data': {'type': parent_type, 'id': parent_id}}}}})['data']
    return d['id'], 'eklendi'


def upload_shots(asc, vloc_id, loc, replace):
    sets = {s['attributes']['screenshotDisplayType']: s for s in
            asc.get(f'/v1/appStoreVersionLocalizations/{vloc_id}/appScreenshotSets', limit=50)['data']} if vloc_id != 'DRY' else {}
    pre = SHOT_PREFIX.get(loc, 'en')
    for dtype, folder in SCREENS.items():
        files = sorted((ROOT / folder).glob(f'{pre}-*.png')) or sorted((ROOT / folder).glob('en-*.png'))
        if not files:
            continue
        s = sets.get(dtype)
        if s:
            cur = asc.get(f"/v1/appScreenshotSets/{s['id']}/appScreenshots", limit=20)['data']
            # yarıda kalmış yükleme (eksik sayı ya da yüklenmemiş/başarısız görsel) varsa seti baştan yükle
            bad = [c for c in cur if ((c['attributes'].get('assetDeliveryState') or {}).get('state')) in ('AWAITING_UPLOAD', 'FAILED', None)]
            if cur and not replace and not bad and len(cur) >= len(files):
                print(f'      {dtype}: {len(cur)} görsel zaten var, atlandı')
                continue
            if cur and not replace:
                print(f'      {dtype}: yarım kalmış ({len(cur)}/{len(files)}, {len(bad)} sorunlu), yeniden yükleniyor')
            for c in cur:
                asc.req('DELETE', f"/v1/appScreenshots/{c['id']}", write=True)
            set_id = s['id']
        else:
            set_id = asc.req('POST', '/v1/appScreenshotSets', write=True, body={'data': {
                'type': 'appScreenshotSets', 'attributes': {'screenshotDisplayType': dtype},
                'relationships': {'appStoreVersionLocalization': {'data': {'type': 'appStoreVersionLocalizations', 'id': vloc_id}}}}})['data']['id']
        for f in files:
            blob = f.read_bytes()
            d = asc.req('POST', '/v1/appScreenshots', write=True, body={'data': {
                'type': 'appScreenshots', 'attributes': {'fileName': f.name, 'fileSize': len(blob)},
                'relationships': {'appScreenshotSet': {'data': {'type': 'appScreenshotSets', 'id': set_id}}}}})['data']
            if asc.dry:
                continue
            for op in d['attributes']['uploadOperations']:
                part = blob[op['offset']:op['offset'] + op['length']]
                r = requests.request(op['method'], op['url'], data=part, timeout=120,
                                     headers={h['name']: h['value'] for h in op.get('requestHeaders', [])})
                r.raise_for_status()
            asc.req('PATCH', f"/v1/appScreenshots/{d['id']}", write=True, body={'data': {
                'type': 'appScreenshots', 'id': d['id'],
                'attributes': {'uploaded': True, 'sourceFileChecksum': hashlib.md5(blob).hexdigest()}}})
        print(f'      {dtype}: {len(files)} görsel yüklendi ({files[0].name[:3]}…)')


def probe(asc, path, **params):
    # yalnız okur; her isteği bir kez dener ve durum kodunu yazar
    r = requests.get(API + path, params=params, timeout=120, headers={'Authorization': 'Bearer ' + asc.token()})
    print(f'   GET {path} -> {r.status_code}')
    return r.json().get('data', []) if r.status_code < 400 and r.content else []


def diagnose(asc, app_id):
    for v in probe(asc, f'/v1/apps/{app_id}/appStoreVersions', limit=20):
        print(f"• sürüm {v['attributes']['versionString']} {v['attributes']['appStoreState']} ({v['id']})")
        locs = probe(asc, f"/v1/appStoreVersions/{v['id']}/appStoreVersionLocalizations", limit=50,
                     **{'fields[appStoreVersionLocalizations]': 'locale'})
        if not locs:
            # liste açılmıyorsa dilleri tek tek dene
            for i in range(1, 4):
                probe(asc, f"/v1/appStoreVersions/{v['id']}/appStoreVersionLocalizations", limit=i)
        for l in locs:
            print(f"   dil {l['attributes']['locale']} ({l['id']})")
            probe(asc, f"/v1/appStoreVersionLocalizations/{l['id']}")
            probe(asc, f"/v1/appStoreVersionLocalizations/{l['id']}/appScreenshotSets")
        probe(asc, f"/v1/appStoreVersions/{v['id']}/build")
    for i in probe(asc, f'/v1/apps/{app_id}/appInfos'):
        print(f"• uygulama bilgisi {i['id']}")
        for l in probe(asc, f"/v1/appInfos/{i['id']}/appInfoLocalizations", limit=50):
            at = l['attributes']
            print(f"   dil {at['locale']}: {at.get('name')} | {at.get('subtitle')} ({l['id']})")


def audit(asc, app_id, meta):
    # yalnız okur: düzenlenebilir sürümde her dilin hangi alanı dolu, metin dosyadakiyle aynı mı, kaç görsel var
    vs = asc.get(f'/v1/apps/{app_id}/appStoreVersions', **{'filter[platform]': 'IOS', 'limit': 20})['data']
    ver = next((v for v in vs if v['attributes']['appStoreState'] in EDITABLE), None)
    if not ver:
        sys.exit('Düzenlenebilir sürüm yok')
    print(f"Sürüm {ver['attributes']['versionString']} {ver['attributes']['appStoreState']}")
    try:
        b = asc.get(f"/v1/appStoreVersions/{ver['id']}/build").get('data')
        print(f"   seçili build: {b['attributes']['version'] if b else 'YOK'}")
    except RuntimeError as err:
        print(f'   build okunamadı: {err}')
    fields = ['description', 'keywords', 'promotionalText', 'whatsNew', 'supportUrl', 'marketingUrl']
    locs = asc.get(f"/v1/appStoreVersions/{ver['id']}/appStoreVersionLocalizations", limit=50)['data']
    for l in sorted(locs, key=lambda x: x['attributes']['locale']):
        at, loc = l['attributes'], l['attributes']['locale']
        want = meta['locales'].get(loc, {})
        parts = []
        for f in fields:
            v = at.get(f) or ''
            src = want.get(f) if f in want else meta.get({'supportUrl': 'support_url', 'marketingUrl': 'marketing_url'}.get(f, ''), None)
            mark = 'BOŞ' if not v else ('=' if src is not None and v == src else ('≠' if src is not None else 'var'))
            parts.append(f'{f}:{len(v)}{mark}')
        try:
            sets = asc.get(f"/v1/appStoreVersionLocalizations/{l['id']}/appScreenshotSets", limit=50)['data']
            shots = []
            for st in sets:
                n = len(asc.get(f"/v1/appScreenshotSets/{st['id']}/appScreenshots", limit=50)['data'])
                shots.append(f"{st['attributes']['screenshotDisplayType']}={n}")
            shots = ', '.join(shots) or 'görsel yok'
        except RuntimeError as err:
            shots = f'görseller okunamadı ({err})'
        print(f'• {loc}: ' + ' '.join(parts))
        print(f'   {shots}')
    print('Dosyada olup sürümde olmayan diller:', ', '.join(sorted(set(meta['locales']) - {l['attributes']['locale'] for l in locs})) or '-')
    infos = asc.get(f'/v1/apps/{app_id}/appInfos')['data']
    for i in infos:
        st = i['attributes'].get('state') or i['attributes'].get('appStoreState')
        print(f'Uygulama bilgisi {st}:')
        for l in sorted(asc.get(f"/v1/appInfos/{i['id']}/appInfoLocalizations", limit=50)['data'], key=lambda x: x['attributes']['locale']):
            at = l['attributes']
            print(f"   {at['locale']}: {at.get('name')} | {at.get('subtitle')} | gizlilik: {'var' if at.get('privacyPolicyUrl') else 'BOŞ'}")


def remove_locales(asc, app_id, locs):
    # yalnız düzenlenebilir sürümden ve henüz yayınlanmamış uygulama bilgisinden siler; ana dile dokunmaz
    vs = asc.get(f'/v1/apps/{app_id}/appStoreVersions', **{'filter[platform]': 'IOS', 'limit': 20})['data']
    ver = next((v for v in vs if v['attributes']['appStoreState'] in EDITABLE), None)
    if ver:
        for l in asc.get(f"/v1/appStoreVersions/{ver['id']}/appStoreVersionLocalizations", limit=50)['data']:
            if l['attributes']['locale'] in locs:
                asc.req('DELETE', f"/v1/appStoreVersionLocalizations/{l['id']}", write=True)
                print(f"   sürüm {ver['attributes']['versionString']}: {l['attributes']['locale']} silindi")
    live = {'READY_FOR_DISTRIBUTION', 'READY_FOR_SALE', 'REPLACED_WITH_NEW_INFO'}
    for i in asc.get(f'/v1/apps/{app_id}/appInfos')['data']:
        if (i['attributes'].get('state') or i['attributes'].get('appStoreState')) in live:
            continue
        for l in asc.get(f"/v1/appInfos/{i['id']}/appInfoLocalizations", limit=50)['data']:
            if l['attributes']['locale'] in locs:
                asc.req('DELETE', f"/v1/appInfoLocalizations/{l['id']}", write=True)
                print(f"   uygulama bilgisi: {l['attributes']['locale']} silindi")
    print('Bitti.')


IAP_ID = 'starfoot_premium'


def iap_setup(asc, app_id, cfg):
    # Premium ürününün inceleme notu ve dillerdeki ad/açıklaması (fiyat, ülkeler ve görsel olduğu gibi kalır)
    items = [x for x in asc.get(f'/v1/apps/{app_id}/inAppPurchasesV2', limit=50)['data'] if x['attributes'].get('productId') == IAP_ID]
    if not items:
        sys.exit(f'{IAP_ID} bulunamadı')
    iid = items[0]['id']
    if cfg.get('reviewNote'):
        asc.req('PATCH', f'/v2/inAppPurchases/{iid}', write=True, body={'data': {'type': 'inAppPurchases', 'id': iid, 'attributes': {'reviewNote': cfg['reviewNote']}}})
        print('inceleme notu güncellendi')
    ex = {l['attributes']['locale']: l['id'] for l in asc.get(f'/v2/inAppPurchases/{iid}/inAppPurchaseLocalizations', limit=50)['data']}
    for loc, (name, desc) in (cfg.get('locales') or {}).items():
        try:
            if loc in ex:
                asc.req('PATCH', f'/v1/inAppPurchaseLocalizations/{ex[loc]}', write=True, body={'data': {'type': 'inAppPurchaseLocalizations', 'id': ex[loc], 'attributes': {'name': name, 'description': desc}}})
                print(f'   {loc}: güncellendi')
            else:
                asc.req('POST', '/v1/inAppPurchaseLocalizations', write=True, body={'data': {'type': 'inAppPurchaseLocalizations', 'attributes': {'locale': loc, 'name': name, 'description': desc}, 'relationships': {'inAppPurchaseV2': {'data': {'type': 'inAppPurchases', 'id': iid}}}}})
                print(f'   {loc}: eklendi')
        except RuntimeError as err:
            print(f'   ! {loc}: {err}')


def pack_setup(asc, app_id, packs, replace_shot=False):
    # İçerik paketleri: yoksa oluşturur; ad/açıklama, fiyat, ülkeler ve inceleme görselini tamamlar (tekrar çalıştırılabilir)
    def safe(path, **params):
        try:
            return asc.get(path, **params)
        except RuntimeError as err:
            return {'_err': str(err)}
    items = {x['attributes'].get('productId'): x for x in asc.get(f'/v1/apps/{app_id}/inAppPurchasesV2', limit=50)['data']}
    terr = None
    for pid, cfg in packs.items():
        print(f'• {pid}')
        if pid in items:
            iid = items[pid]['id']
            print(f"   zaten var (durum {items[pid]['attributes'].get('state')})")
            asc.req('PATCH', f'/v2/inAppPurchases/{iid}', write=True, body={'data': {'type': 'inAppPurchases', 'id': iid, 'attributes': {'name': cfg['refName'], 'reviewNote': cfg['reviewNote']}}})
        else:
            iid = asc.req('POST', '/v2/inAppPurchases', write=True, body={'data': {'type': 'inAppPurchases', 'attributes': {
                'name': cfg['refName'], 'productId': pid, 'inAppPurchaseType': 'NON_CONSUMABLE', 'reviewNote': cfg['reviewNote'], 'familySharable': False},
                'relationships': {'app': {'data': {'type': 'apps', 'id': app_id}}}}})['data']['id']
            print('   oluşturuldu')
        if iid == 'DRY':
            continue
        # diller
        ex = {l['attributes']['locale']: l['id'] for l in asc.get(f'/v2/inAppPurchases/{iid}/inAppPurchaseLocalizations', limit=50)['data']}
        for loc, (name, desc) in cfg['locales'].items():
            try:
                if loc in ex:
                    asc.req('PATCH', f'/v1/inAppPurchaseLocalizations/{ex[loc]}', write=True, body={'data': {'type': 'inAppPurchaseLocalizations', 'id': ex[loc], 'attributes': {'name': name, 'description': desc}}})
                else:
                    asc.req('POST', '/v1/inAppPurchaseLocalizations', write=True, body={'data': {'type': 'inAppPurchaseLocalizations', 'attributes': {'locale': loc, 'name': name, 'description': desc}, 'relationships': {'inAppPurchaseV2': {'data': {'type': 'inAppPurchases', 'id': iid}}}}})
            except RuntimeError as err:
                print(f'   ! {loc}: {err}')
        print(f"   {len(cfg['locales'])} dil tamam")
        # fiyat (ABD tabanlı, diğer ülkeler Apple'ın eşdeğer fiyatı)
        sch = safe(f'/v2/inAppPurchases/{iid}/iapPriceSchedule')
        if not sch.get('data'):
            pts, nxt = [], f'/v2/inAppPurchases/{iid}/pricePoints'
            params = {'filter[territory]': 'USA', 'limit': 200}
            while nxt:
                r = asc.get(nxt, **params)
                pts += r['data']
                nl = (r.get('links') or {}).get('next')
                nxt, params = (nl.replace(API, ''), {}) if nl else (None, {})
            pp = next((x for x in pts if x['attributes'].get('customerPrice') == cfg['price']), None)
            if not pp:
                print(f"   ! {cfg['price']} USD fiyat noktası bulunamadı")
            else:
                asc.req('POST', '/v1/inAppPurchasePriceSchedules', write=True, body={
                    'data': {'type': 'inAppPurchasePriceSchedules', 'relationships': {
                        'inAppPurchase': {'data': {'type': 'inAppPurchases', 'id': iid}},
                        'baseTerritory': {'data': {'type': 'territories', 'id': 'USA'}},
                        'manualPrices': {'data': [{'type': 'inAppPurchasePrices', 'id': '${p1}'}]}}},
                    'included': [{'type': 'inAppPurchasePrices', 'id': '${p1}', 'attributes': {'startDate': None},
                                  'relationships': {'inAppPurchaseV2': {'data': {'type': 'inAppPurchases', 'id': iid}},
                                                    'inAppPurchasePricePoint': {'data': {'type': 'inAppPurchasePricePoints', 'id': pp['id']}}}}]})
                print(f"   fiyat: {cfg['price']} USD")
        else:
            print('   fiyat zaten var')
        # satışta olduğu ülkeler: hepsi
        av = safe(f'/v2/inAppPurchases/{iid}/inAppPurchaseAvailability')
        if not av.get('data'):
            if terr is None:
                terr = [t['id'] for t in asc.get('/v1/territories', limit=200)['data']]
            asc.req('POST', '/v1/inAppPurchaseAvailabilities', write=True, body={'data': {'type': 'inAppPurchaseAvailabilities',
                'attributes': {'availableInNewTerritories': True},
                'relationships': {'inAppPurchase': {'data': {'type': 'inAppPurchases', 'id': iid}},
                                  'availableTerritories': {'data': [{'type': 'territories', 'id': t} for t in terr]}}}})
            print(f'   {len(terr)} ülkede satışta')
        else:
            print('   ülkeler zaten ayarlı')
        # inceleme görseli
        shot = safe(f'/v2/inAppPurchases/{iid}/appStoreReviewScreenshot').get('data')
        if shot and not replace_shot and ((shot['attributes'].get('assetDeliveryState') or {}).get('state')) == 'COMPLETE':
            print('   inceleme görseli zaten var')
        else:
            if shot:
                asc.req('DELETE', f"/v1/inAppPurchaseAppStoreReviewScreenshots/{shot['id']}", write=True)
            f = ROOT / cfg['screenshot']
            blob = f.read_bytes()
            d = asc.req('POST', '/v1/inAppPurchaseAppStoreReviewScreenshots', write=True, body={'data': {
                'type': 'inAppPurchaseAppStoreReviewScreenshots', 'attributes': {'fileName': f.name, 'fileSize': len(blob)},
                'relationships': {'inAppPurchaseV2': {'data': {'type': 'inAppPurchases', 'id': iid}}}}})['data']
            for op in d['attributes']['uploadOperations']:
                part = blob[op['offset']:op['offset'] + op['length']]
                r = requests.request(op['method'], op['url'], data=part, timeout=120, headers={h['name']: h['value'] for h in op.get('requestHeaders', [])})
                r.raise_for_status()
            asc.req('PATCH', f"/v1/inAppPurchaseAppStoreReviewScreenshots/{d['id']}", write=True, body={'data': {
                'type': 'inAppPurchaseAppStoreReviewScreenshots', 'id': d['id'],
                'attributes': {'uploaded': True, 'sourceFileChecksum': hashlib.md5(blob).hexdigest()}}})
            print('   inceleme görseli yüklendi')


def iap_report(asc, app_id):
    # yalnız okur: Premium satın alma ürününün durumu, dilleri, fiyatı, inceleme görseli ve ülkeleri
    def safe(path, **params):
        try:
            return asc.get(path, **params)
        except RuntimeError as err:
            print(f'   ! {err}')
            return {}
    items = safe(f'/v1/apps/{app_id}/inAppPurchasesV2', limit=50).get('data', [])
    print(f'Satın alma ürünleri: {len(items)}')
    for it in items:
        at = it['attributes']
        print(f"• {at.get('productId')} | {at.get('name')} | tür {at.get('inAppPurchaseType')} | durum {at.get('state')} | aile paylaşımı {at.get('familySharable')}")
        if at.get('reviewNote'):
            print(f"   inceleme notu: {at['reviewNote'][:200]}")
        for l in safe(f"/v2/inAppPurchases/{it['id']}/inAppPurchaseLocalizations", limit=50).get('data', []):
            la = l['attributes']
            print(f"   dil {la.get('locale')}: {la.get('name')} | {la.get('description')} | {la.get('state')}")
        sch = safe(f"/v2/inAppPurchases/{it['id']}/iapPriceSchedule").get('data')
        if sch:
            base = safe(f"/v1/inAppPurchasePriceSchedules/{sch['id']}/baseTerritory").get('data')
            print(f"   fiyat çizelgesi var, ana ülke: {base and base['id']}")
            mp = safe(f"/v1/inAppPurchasePriceSchedules/{sch['id']}/manualPrices", limit=5, include='inAppPurchasePricePoint,territory')
            for inc in mp.get('included', []):
                if inc['type'] == 'inAppPurchasePricePoints':
                    print(f"   fiyat noktası: {inc['attributes'].get('customerPrice')} (gelir {inc['attributes'].get('proceeds')})")
        else:
            print('   fiyat: YOK')
        shot = safe(f"/v2/inAppPurchases/{it['id']}/appStoreReviewScreenshot").get('data')
        print(f"   inceleme görseli: {'var (' + str(shot['attributes'].get('assetDeliveryState')) + ')' if shot else 'YOK'}")
        av = safe(f"/v2/inAppPurchases/{it['id']}/inAppPurchaseAvailability").get('data')
        if av:
            n = safe(f"/v1/inAppPurchaseAvailabilities/{av['id']}/availableTerritories", limit=200).get('data', [])
            print(f"   satıştaki ülke sayısı: {len(n)} · yeni ülkelere otomatik: {av['attributes'].get('availableInNewTerritories')} · Japonya: {'JPN' in [t['id'] for t in n]}")
        else:
            print('   ülkeler: YOK')


def submit_packs(asc, app_id, packs):
    # Açık inceleme başvurularını gösterir, sonra içerik paketlerini incelemeye gönderir (sürümle birlikte incelenir)
    try:
        subs = asc.get('/v1/reviewSubmissions', **{'filter[app]': app_id, 'limit': 10, 'include': 'items'})
        for s in subs.get('data', []):
            print(f"   başvuru {s['id']}: {s['attributes'].get('state')} ({s['attributes'].get('submittedDate')})")
        for it in subs.get('included', []):
            rel = {k: v.get('data') for k, v in it.get('relationships', {}).items() if v.get('data')}
            print(f"     öğe {it['id']}: {it['attributes'].get('state')} {list(rel)}")
    except RuntimeError as err:
        print(f'   ! başvurular okunamadı: {err}')
    items = {x['attributes'].get('productId'): x for x in asc.get(f'/v1/apps/{app_id}/inAppPurchasesV2', limit=50)['data']}
    for pid in packs:
        it = items.get(pid)
        if not it:
            print(f'• {pid}: yok'); continue
        st = it['attributes'].get('state')
        print(f'• {pid}: durum {st}')
        if st != 'READY_TO_SUBMIT':
            continue
        try:
            asc.req('POST', '/v1/inAppPurchaseSubmissions', write=True, body={'data': {'type': 'inAppPurchaseSubmissions',
                'relationships': {'inAppPurchaseV2': {'data': {'type': 'inAppPurchases', 'id': it['id']}}}}})
            print('   incelemeye gönderildi')
        except RuntimeError as err:
            print(f'   ! gönderilemedi: {err}')


def unsubmit_packs(asc, app_id):
    # Reddedilen (UNRESOLVED_ISSUES) başvurudaki satın alma ürünü öğelerini çıkarır: ürünlerin adı ve açıklaması
    # ancak başvurunun dışındayken değiştirilebiliyor. Sürüm öğesine dokunmaz. Ürünler sonra yeniden incelemeye eklenir.
    import base64
    subs = asc.get('/v1/reviewSubmissions', **{'filter[app]': app_id, 'filter[state]': 'UNRESOLVED_ISSUES', 'limit': 5, 'include': 'items'})
    for it in subs.get('included', []):
        try:
            kind = base64.urlsafe_b64decode(it['id'] + '=' * (-len(it['id']) % 4)).decode().split('|')[1]
        except Exception:
            kind = '?'
        print(f"   öğe {it['id'][:24]}… tür {kind} durum {it['attributes'].get('state')}")
        if kind == '17':
            try:
                asc.req('DELETE', f"/v1/reviewSubmissionItems/{it['id']}", write=True)
                print('     başvurudan çıkarıldı')
            except RuntimeError as err:
                print(f'     ! çıkarılamadı: {err}')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--metadata', default=str(ROOT / 'store/asc/metadata.json'))
    ap.add_argument('--version', default='')
    ap.add_argument('--screens', action='store_true')
    ap.add_argument('--replace-screens', action='store_true')
    ap.add_argument('--dry-run', action='store_true')
    ap.add_argument('--diagnose', action='store_true')
    ap.add_argument('--audit', action='store_true')
    ap.add_argument('--remove-locales', default='')
    ap.add_argument('--iap', action='store_true')
    ap.add_argument('--iap-setup', action='store_true')
    ap.add_argument('--packs', action='store_true')
    ap.add_argument('--submit-packs', action='store_true')
    ap.add_argument('--unsubmit-packs', action='store_true')
    a = ap.parse_args()
    meta = json.load(open(a.metadata, encoding='utf-8'))
    asc = ASC(a.dry_run)

    apps = asc.get('/v1/apps', **{'filter[bundleId]': BUNDLE})['data']
    if not apps:
        sys.exit(f'{BUNDLE} paket kimlikli uygulama bulunamadı')
    app = apps[0]
    print(f"Uygulama: {app['attributes']['name']} ({app['id']}), ana dil: {app['attributes'].get('primaryLocale')}")
    if a.diagnose:
        return diagnose(asc, app['id'])
    if a.audit:
        return audit(asc, app['id'], meta)
    if a.iap_setup:
        iap_setup(asc, app['id'], meta.get('premium') or {})
        return iap_report(asc, app['id'])
    if a.packs:
        pack_setup(asc, app['id'], meta.get('packs') or {}, a.replace_screens)
        return iap_report(asc, app['id'])
    if a.unsubmit_packs:
        unsubmit_packs(asc, app['id'])
        pack_setup(asc, app['id'], meta.get('packs') or {}, True)
        return iap_report(asc, app['id'])
    if a.submit_packs:
        submit_packs(asc, app['id'], meta.get('packs') or {})
        return iap_report(asc, app['id'])
    if a.iap:
        return iap_report(asc, app['id'])
    if a.remove_locales:
        return remove_locales(asc, app['id'], [x.strip() for x in a.remove_locales.split(',') if x.strip()])

    ver = pick_version(asc, app['id'], a.version)
    info = pick_appinfo(asc, app['id'])
    print(f"Düzenlenen sürüm: {ver['attributes'].get('versionString', a.version)}")

    ex_info = {} if info['id'] == 'DRY' else {x['attributes']['locale']: x['id'] for x in
                                              asc.get(f"/v1/appInfos/{info['id']}/appInfoLocalizations", limit=50,
                                                    **{'fields[appInfoLocalizations]': 'locale'})['data']}
    ex_ver = {} if ver['id'] == 'DRY' else {x['attributes']['locale']: x['id'] for x in
                                            asc.get(f"/v1/appStoreVersions/{ver['id']}/appStoreVersionLocalizations", limit=50,
                                                    **{'fields[appStoreVersionLocalizations]': 'locale'})['data']}
    fails = []
    for loc, e in meta['locales'].items():
        print(f'• {loc}')
        try:
            _, how = upsert(asc, 'appInfoLocalizations', 'appInfo', 'appInfos', info['id'], ex_info, loc,
                            {'name': e['name'], 'subtitle': e['subtitle'], 'privacyPolicyUrl': meta['privacy_url']})
            print(f'   ad ve alt başlık {how}')
        except RuntimeError as err:
            print(f'   ! ad/alt başlık: {err}'); fails.append(loc)
        if loc not in ex_ver and ver['id'] != 'DRY':
            # yeni dilin adı eklenince Apple sürüme boş bir dil kaydı açıyor: onu bul, yeniden oluşturma
            ex_ver = {x['attributes']['locale']: x['id'] for x in
                      asc.get(f"/v1/appStoreVersions/{ver['id']}/appStoreVersionLocalizations", limit=50,
                              **{'fields[appStoreVersionLocalizations]': 'locale'})['data']}
        attrs = {'description': e['description'], 'keywords': e['keywords'], 'promotionalText': e['promotionalText'],
                 'whatsNew': e['whatsNew'], 'supportUrl': meta['support_url'], 'marketingUrl': meta['marketing_url']}
        try:
            vid, how = upsert(asc, 'appStoreVersionLocalizations', 'appStoreVersion', 'appStoreVersions', ver['id'], ex_ver, loc, attrs)
        except RuntimeError as err:
            if 'whatsNew' in str(err):
                attrs.pop('whatsNew')
                try:
                    vid, how = upsert(asc, 'appStoreVersionLocalizations', 'appStoreVersion', 'appStoreVersions', ver['id'], ex_ver, loc, attrs)
                except RuntimeError as err2:
                    print(f'   ! açıklama: {err2}'); fails.append(loc); continue
            else:
                print(f'   ! açıklama: {err}'); fails.append(loc); continue
        print(f'   açıklama, anahtar kelimeler, tanıtım ve yenilikler {how}')
        if a.screens or a.replace_screens:
            try:
                upload_shots(asc, vid, loc, a.replace_screens)
            except Exception as err:
                print(f'   ! görseller: {err}'); fails.append(loc)
    if fails:
        sys.exit(f'Sorun çıkan diller: {", ".join(sorted(set(fails)))}')
    print('Bitti.')


if __name__ == '__main__':
    main()
