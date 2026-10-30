#!/usr/bin/env python3
"""Tüm kulüpler: yer adı (şehir/semt) + kurgusal, tarafsız lakap. Gerçek lakap, hayvan ve renk kullanılmaz.
Çıktı: clubs.json {id: [ad, kısaltma|null, İngilizce]}."""
import json, os, re, hashlib, subprocess
D = os.path.dirname(os.path.abspath(__file__)) + '/'
ROOT = os.path.abspath(D + '../../') + '/'
PLACE = {
 'GAL': 'Beyoğlu', 'FNK': 'Kadıköy', 'BJK': 'Dolmabahçe', 'BSK': 'İkitelli', 'GOZ': 'Konak', 'KAY': 'Kayseri', 'ANT': 'Antalya', 'GNC': 'Çankaya',
 'ANK': 'Ulus', 'MAN': 'Manisa', 'MAL': 'Malatya', 'HAT': 'Hatay', 'ORD': 'Ordu', 'AYD': 'Aydın',
 'MCS': 'Manchester', 'MUN': 'Trafford', 'LIV': 'Mersey', 'EVE': 'Walton', 'ARS': 'Islington', 'TOT': 'Haringey', 'WHU': 'Stratford', 'NEW': 'Tyneside',
 'FUL': 'Putney', 'CRY': 'Croydon', 'QPR': 'White City',
 'RMA': 'Madrid', 'ATM': 'Manzanares', 'BAR': 'Barselona', 'ESY': 'Kornelya', 'VIL': 'Vilyareal', 'BET': 'Triana', 'SEV': 'Sevilya', 'GET': 'Getafe',
 'ALA': 'Vitorya', 'LEV2': 'Levante', 'MLG': 'Malaga', 'BRG': 'Burgos', 'ELD': 'Elda',
 'STP': 'Altona', 'FCU': 'Köpenik', 'S04': 'Gelzenkirhen', 'DRE': 'Drezden', 'STR': 'Strazburk',
 'INT': 'Milano', 'MIL': 'Brera', 'LAZ': 'Flaminio', 'JUV': 'Piemonte', 'TOR': 'Torino', 'SMP': 'Liguriya', 'NAP': 'Napoli', 'CAG': 'Kalyari', 'JST': 'Kastellammare',
 'CRR': 'Karrara', 'RGG': 'Rejyo', 'PFC': 'Montmartre', 'AJA': 'Oser', 'CAE': 'Kaen',
 'FEY': 'Rotterdam', 'TWE': 'Enshede',
 'SPL': 'Alvalade', 'BOA': 'Bessa', 'RAV': 'Vila do Konde', 'SNT': 'Ponta Delgada', 'AVS': 'Vila das Aves',
 'FLA': 'Gávea', 'FLU': 'Laranjeiras', 'VAS': 'São Cristóvão', 'BOT': 'Rio', 'CRN': 'Tatuapé', 'SAO': 'Morumbi', 'IBR': 'Guaíba', 'CRU': 'Pampulha',
 'BAH': 'Salvador', 'VTB': 'Barradas', 'CEA': 'Iracema', 'RBB': 'Bragança', 'SPT': 'Resife',
 'RIV': 'Núñez', 'IND': 'Gerli', 'BEL': 'Alberdi', 'RCE': 'Arroyito', 'TIG': 'Tigre',
 'CEB': 'Sent Andris', 'OHL': 'Löven', 'CLT': 'Parkhead', 'RNG': 'Govan', 'HRT': 'Gorgie', 'HIB': 'Leith', 'DUF': 'Tay',
 'LAG': 'Carson', 'NYB': 'Hudson', 'SHB': 'Malaz', 'RYD': 'Diriye', 'OKH': 'Suveydi', 'NSR': 'Necid', 'AHL': 'Hicaz', 'NJM': 'Ras Tannura', 'AKD': 'Necran',
 'CAZ': 'Koyoakan', 'PUM': 'Pedregal', 'ATS': 'Zapopan', 'COS2': 'Sakai',
 'AWI': 'Favoriten', 'GAK': 'Liebenau', 'BWL': 'Urfahr', 'GCZ': 'Limmat', 'STG2': 'Sen Galen',
 'AEK': 'Nea Filadelfiya', 'PNT': 'Kallitea', 'ARI': 'Kalamarya', 'BIF': 'Vestegnen', 'LOK': 'Treşnyevka', 'SLA': 'Vrşovitse', 'BOH': 'Vinohradi',
 'CRA': 'Podgurze', 'OBO': 'Podil', 'KAR': 'Galiçya', 'SLO2': 'Uherske Hradişte', 'MBO': 'Mlada Boleslav',
}
POOL = [('Rüzgarı', 'Wind'), ('Yıldızları', 'Stars'), ('Dalgaları', 'Waves'), ('Kıvılcımları', 'Sparks'), ('Öncüleri', 'Pioneers'), ('Kalesi', 'Fortress'),
        ('Ufku', 'Horizon'), ('Zirvesi', 'Summit'), ('Pusulası', 'Compass'), ('Meteorları', 'Meteors'), ('Kometleri', 'Comets'), ('Gücü', 'Power'),
        ('Fırtınası', 'Storm'), ('Çınarları', 'Plane Trees'), ('Akıncıları', 'Raiders'), ('Dorukları', 'Peaks'), ('Esintisi', 'Breeze'), ('Işıkları', 'Lights'),
        ('Kanatları', 'Wings'), ('Kayaları', 'Rocks'), ('Yıldırımı', 'Thunder'), ('Yolcuları', 'Voyagers'), ('Ateşi', 'Flame')]
FIX = {'GAL': 'Rüzgarı', 'FNK': 'Fırtınası', 'BJK': 'Gücü'}
AVOID = {'TRB': {'Fırtınası'}, 'LAG': {'Yıldızları'}, 'RED': {'Yıldızları'}, 'BOT': {'Yıldızları'}, 'PSV': {'Işıkları'}, 'MCS': {'Gücü'}, 'RAY': {'Yıldırımı', 'Kıvılcımları'},
         'TKD': {'Rüzgarı'}, 'ALN': {'Gücü'}}
ROOT_TOK = json.load(open(ROOT + 'tools/i18n/clubtok.json'))
ROOT_TOK.update({'Münih': 'Munich', 'Barselona': 'Barcelona', 'Kornelya': 'Cornellà', 'Vilyareal': 'Villarreal', 'Vitorya': 'Vitoria', 'Gelzenkirhen': 'Gelsenkirchen',
    'Köpenik': 'Köpenick', 'Drezden': 'Dresden', 'Strazburk': 'Strasbourg', 'Liguriya': 'Liguria', 'Kalyari': 'Cagliari', 'Kastellammare': 'Castellammare',
    'Karrara': 'Carrara', 'Rejyo': 'Reggio', 'Oser': 'Auxerre', 'Kaen': 'Caen', 'Enshede': 'Enschede', 'Konde': 'Conde', 'Resife': 'Recife',
    'Treşnyevka': 'Trešnjevka', 'Vrşovitse': 'Vršovice', 'Vinohradi': 'Vinohrady', 'Podgurze': 'Podgórze', 'Galiçya': 'Galicia', 'Necid': 'Najd',
    'Hicaz': 'Hejaz', 'Necran': 'Najran', 'Diriye': 'Diriyah', 'Suveydi': 'Suwaidi', 'Tannura': 'Tanura', 'Koyoakan': 'Coyoacán', 'Filadelfiya': 'Filadelfeia',
    'Kallitea': 'Kallithea', 'Kalamarya': 'Kalamaria', 'Andris': 'Andries', 'Sen': 'Saint', 'Löven': 'Leuven', 'Galen': 'Gallen', 'Hradişte': 'Hradiště',
    'Uherske': 'Uherské', 'Mlada': 'Mladá', 'Piemonte': 'Piedmont', 'Milano': 'Milan', 'Torino': 'Turin', 'Napoli': 'Naples', 'Sevilya': 'Sevilla'})
COL = re.compile(r'^(Mavi|Sarı|Kızıl|Kara|Beyaz|Mor|Pembe|Yeşil|Kırmızı|Turuncu|Lacivert|Siyah|Bordo|Gri|Gök|Altın)')
GEN = {'SK', 'FK', 'FC', 'JK', 'Kulübü', 'Spor', '04', '1899', 'AVS', 'Futbol', 'Kasabası', 'Liman', 'Merkez', 'Ortak', 'Kuvvet', 'Sahil', 'Akdeniz', 'Erciyes', 'Başkent', 'Gençlik', 'Gediz', 'Defne', 'Vezüv', 'Elzas', 'Burgonya', 'Normandiya', 'Sardunya', 'Kastilya', 'Kayısıspor', 'Fındıkspor', 'İncirspor', 'Azulones', 'Babazoro', 'Granota', 'Vozão', 'Uhdud', 'Dinamo', 'Sky'}


def place_of(n):
    t = n.split(' ')
    keep = [w for i, w in enumerate(t) if i == 0 or not (w in GEN or COL.match(w) or '-' in w or re.search(r'(ları|leri|lar|ler|sı|si|su|sü|ı|i|u|ü)$', w))]
    return ' '.join(keep)


def main():
    base = json.loads(subprocess.check_output(['node', '-e', "const fs=require('fs');eval(fs.readFileSync('" + ROOT + "js/data.js','utf8').replace(/^const /gm,'var '));console.log(JSON.stringify(CLUB_LIST))"]))
    # ilk turda (1.0.12 öncesi) yeniden adlandırılan kulüplerin kısaltmaları da yer adından üretilir
    first = json.load(open(D + 'clubs_v1.json')) if os.path.exists(D + 'clubs_v1.json') else {}
    out, used = {}, {}
    global FIXED_IN
    FIXED_IN = {}
    for c in base:
        if c[0] in FIX: FIXED_IN.setdefault(c[3], set()).add(FIX[c[0]])
    shorts = {}
    RESHORT = set(first)
    for cid, name, short, lg, *_ in base:
        pl = PLACE.get(cid) or place_of(name)
        x = int(hashlib.md5(cid.encode()).hexdigest(), 16)
        order = [p for p in POOL if p[0] == FIX.get(cid)] + POOL[(x % len(POOL)):] + POOL[:(x % len(POOL))]
        for tr, en in order:
            if cid in FIX: break
            if tr in AVOID.get(cid, set()) or tr in used.get(lg, set()) or tr in name.split(' ') or tr in FIXED_IN.get(lg, set()):
                continue
            break
        used.setdefault(lg, set()).add(tr)
        pen = ' '.join(ROOT_TOK.get(w, w) for w in pl.split(' '))
        sh = None
        if cid in RESHORT or cid == 'GAL':
            up = pl.replace('i', 'İ').replace('ı', 'I').upper().replace("'", '')
            cand = re.sub(r'[^A-ZÇĞİÖŞÜ]', '', up)
            sh = cand[:3]
            if sh in shorts.get(lg, set()): sh = cand[0] + cand[2:4] if len(cand) > 3 else cand[:2] + 'X'
        shorts.setdefault(lg, set()).add(sh or short)
        out[cid] = [pl + ' ' + tr, sh, pen + ' ' + en]
    names = [v[0] for v in out.values()]
    dup = {n for n in names if names.count(n) > 1}
    assert not dup, dup
    json.dump(out, open(D + 'clubs.json', 'w'), ensure_ascii=False, indent=0)
    print(len(out))


if __name__ == '__main__':
    main()
