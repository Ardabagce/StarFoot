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
               'fr-FR': 'fr', 'it': 'it', 'id': 'id', 'ar-SA': 'ar'}


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
        for i in range(4):
            try:
                r = requests.request(method, API + path, params=params, json=body, timeout=180,
                                     headers={'Authorization': 'Bearer ' + self.token(), 'Content-Type': 'application/json'})
                break
            except (requests.Timeout, requests.ConnectionError) as err:
                if i == 3:
                    raise RuntimeError(f'{method} {path} -> yanıt yok ({err.__class__.__name__})')
                print(f'   … {method} yanıt vermedi, {10 * (i + 1)} sn sonra yeniden deneniyor')
                time.sleep(10 * (i + 1))
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
        return ed[0]
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
            if cur and not replace:
                print(f'      {dtype}: {len(cur)} görsel zaten var, atlandı')
                continue
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


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--metadata', default=str(ROOT / 'store/asc/metadata.json'))
    ap.add_argument('--version', default='')
    ap.add_argument('--screens', action='store_true')
    ap.add_argument('--replace-screens', action='store_true')
    ap.add_argument('--dry-run', action='store_true')
    a = ap.parse_args()
    meta = json.load(open(a.metadata, encoding='utf-8'))
    asc = ASC(a.dry_run)

    apps = asc.get('/v1/apps', **{'filter[bundleId]': BUNDLE})['data']
    if not apps:
        sys.exit(f'{BUNDLE} paket kimlikli uygulama bulunamadı')
    app = apps[0]
    print(f"Uygulama: {app['attributes']['name']} ({app['id']}), ana dil: {app['attributes'].get('primaryLocale')}")

    ver = pick_version(asc, app['id'], a.version)
    info = pick_appinfo(asc, app['id'])
    print(f"Düzenlenen sürüm: {ver['attributes'].get('versionString', a.version)}")

    ex_info = {} if info['id'] == 'DRY' else {x['attributes']['locale']: x['id'] for x in
                                              asc.get(f"/v1/appInfos/{info['id']}/appInfoLocalizations", limit=50)['data']}
    ex_ver = {} if ver['id'] == 'DRY' else {x['attributes']['locale']: x['id'] for x in
                                            asc.get(f"/v1/appStoreVersions/{ver['id']}/appStoreVersionLocalizations", limit=50)['data']}
    fails = []
    for loc, e in meta['locales'].items():
        print(f'• {loc}')
        try:
            _, how = upsert(asc, 'appInfoLocalizations', 'appInfo', 'appInfos', info['id'], ex_info, loc,
                            {'name': e['name'], 'subtitle': e['subtitle'], 'privacyPolicyUrl': meta['privacy_url']})
            print(f'   ad ve alt başlık {how}')
        except RuntimeError as err:
            print(f'   ! ad/alt başlık: {err}'); fails.append(loc)
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
