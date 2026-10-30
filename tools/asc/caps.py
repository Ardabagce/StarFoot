#!/usr/bin/env python3
"""Uygulama kimliğinde (bundle ID) iCloud ve Game Center yetkilerini açar; açıksa dokunmaz.
iOS derlemesinden önce çalışır. Ortam: ASC_KEY_P8, ASC_KEY_ID, ASC_ISSUER_ID"""
import sys
from asc import ASC, BUNDLE

WANT = {
    'ICLOUD': [{'key': 'ICLOUD_VERSION', 'options': [{'key': 'XCODE_6'}]}],
    'GAME_CENTER': None,
}


def main():
    asc = ASC(False)
    ids = [b for b in asc.get('/v1/bundleIds', **{'filter[identifier]': BUNDLE, 'limit': 20})['data']
           if b['attributes']['identifier'] == BUNDLE]
    if not ids:
        sys.exit(f'{BUNDLE} uygulama kimliği bulunamadı')
    bid = ids[0]['id']
    have = {c['attributes']['capabilityType'] for c in
            asc.get(f'/v1/bundleIds/{bid}/bundleIdCapabilities')['data']}
    print('Açık yetkiler:', ', '.join(sorted(have)) or '-')
    for cap, settings in WANT.items():
        if cap in have:
            continue
        attrs = {'capabilityType': cap}
        if settings:
            attrs['settings'] = settings
        asc.req('POST', '/v1/bundleIdCapabilities', write=True, body={'data': {
            'type': 'bundleIdCapabilities', 'attributes': attrs,
            'relationships': {'bundleId': {'data': {'type': 'bundleIds', 'id': bid}}}}})
        print('Açıldı:', cap)
    prune_certs(asc)


def prune_certs(asc):
    """Her CI derlemesi geçici bir imza sertifikası üretir; özel anahtarı derleme bitince silinir ve sertifika
    bir daha kullanılamaz. Sınır dolunca arşivleme düşer. Yalnız API ile (CI'ın) üretilmiş sertifikaları iptal eder;
    elle oluşturulan (Mac) sertifikalara ve yayındaki uygulamaya dokunmaz."""
    try:
        certs = asc.get('/v1/certificates', limit=200)['data']
    except RuntimeError as err:
        print('Sertifikalar okunamadı:', err); return
    for c in certs:
        a = c['attributes']
        name = a.get('displayName') or a.get('name') or ''
        if 'Created via API' not in name:
            continue
        try:
            asc.req('DELETE', f"/v1/certificates/{c['id']}", write=True)
            print('Geçici CI sertifikası iptal edildi:', a.get('certificateType'), (a.get('expirationDate') or '')[:10])
        except RuntimeError as err:
            print('İptal edilemedi:', err)


if __name__ == '__main__':
    main()
