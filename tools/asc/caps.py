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


if __name__ == '__main__':
    main()
