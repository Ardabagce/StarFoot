#!/usr/bin/env python3
"""Gerçek futbolculara benzeyen isimler için kurgusal karşılıklar üretir (deterministik).
Girdi: src.json (extract.js), çıktı: map.json {eski: yeni}. Soyadı her zaman değişir; çok bilinen
yıldızlarda (güç >= 88) ad da değişir. Yeni soyadı eskisine benzemez (benzerlik < 0.5)."""
import json, os, re, hashlib, difflib, unicodedata
D = os.path.dirname(os.path.abspath(__file__)) + '/'

FAM = {}
for f, codes in {
    'ES': 'ESP ARG MEX URU COL ECU PAR PER CHI PAN CRC', 'PT': 'POR BRA CPV', 'IT': 'ITA', 'FR': 'FRA BEL SUI HAI',
    'DE': 'GER AUT', 'NL': 'NED CUW', 'EN': 'ENG USA SCO WAL IRL AUS NZL CAN JAM', 'NO': 'NOR DEN SWE',
    'SS': 'CRO SRB SVN', 'WS': 'CZE SVK POL', 'UA': 'UKR', 'GR': 'GRE', 'TR': 'TUR', 'AZ': 'AZE UZB',
    'AR': 'EGY MAR TUN ALG KSA QAT JOR IRQ', 'IR': 'IRN', 'KA': 'GEO', 'HU': 'HUN', 'RO': 'ROU', 'AL': 'ALB',
    'JP': 'JPN', 'KR': 'KOR', 'AF': 'NGA GHA CMR CIV SEN GUI GAB RSA',
}.items():
    for c in codes.split(): FAM[c] = f

# soyadı = kök hece(ler) + son ek
ON = {
    'ES': ['Bel', 'Cas', 'Dur', 'Fer', 'Gal', 'Lor', 'Mar', 'Nav', 'Or', 'Pal', 'Quin', 'Ros', 'San', 'Tor', 'Val', 'Vi', 'Al', 'Bar', 'Cor', 'Mon', 'Re', 'Sol', 'Tam', 'Ur', 'Ze', 'Ar', 'Cal', 'Es', 'Mol', 'Pi'],
    'PT': ['Bar', 'Cal', 'Dor', 'Fon', 'Gou', 'Lou', 'Mar', 'Nas', 'Pe', 'Quei', 'Ri', 'Sam', 'Ta', 'Val', 'Vi', 'Al', 'Bra', 'Cor', 'Fa', 'Mo', 'Par', 'Ro', 'Sil', 'Te', 'Ar'],
    'IT': ['Bel', 'Ca', 'Del', 'Fa', 'Gal', 'Lu', 'Mar', 'Nar', 'Or', 'Pa', 'Ros', 'Sar', 'Tor', 'Ver', 'Zan', 'Bon', 'Cas', 'Fio', 'Gri', 'Lom', 'Mon', 'Pel', 'Riz', 'Sca', 'Vi'],
    'FR': ['Bel', 'Ca', 'Du', 'Fon', 'Gar', 'La', 'Mar', 'Mo', 'Pe', 'Ri', 'Ro', 'Sau', 'Ta', 'Ver', 'Vi', 'Bou', 'Char', 'Dé', 'Fa', 'Gi', 'Le', 'Mi', 'Pi', 'Ser', 'Tou'],
    'DE': ['Bau', 'Brand', 'Eck', 'Fahr', 'Gol', 'Hart', 'Kel', 'Lind', 'Mer', 'Neu', 'Ost', 'Rie', 'Schu', 'Stein', 'Wal', 'Wei', 'Al', 'Berg', 'Dorn', 'Hel', 'Kro', 'Lo', 'Rau', 'Sie', 'Vo'],
    'NL': ['Bak', 'Bos', 'Dek', 'Grie', 'Hoe', 'Jan', 'Kui', 'Lan', 'Meu', 'Noor', 'Oost', 'Rui', 'Smit', 'Ver', 'Wou', 'Brou', 'Ha', 'Kla', 'Mol', 'Ste'],
    'EN': ['Ash', 'Brad', 'Carl', 'Dal', 'Ell', 'Fair', 'Gar', 'Hal', 'Kings', 'Lang', 'Mor', 'Nor', 'Pem', 'Ram', 'Stan', 'Thorn', 'Wal', 'Whit', 'Brom', 'Chal', 'Dun', 'Fen', 'Hart', 'Mid', 'Red'],
    'NO': ['Aas', 'Berg', 'Dahl', 'Eng', 'Fjel', 'Holm', 'Lund', 'Moe', 'Ny', 'Ro', 'Skov', 'Strand', 'Tor', 'Vik', 'Ås', 'Bre', 'Gul', 'Hau', 'Lie', 'Sol'],
    'SS': ['Ba', 'Bo', 'Dra', 'Gr', 'Ja', 'Ko', 'Lu', 'Ma', 'Ni', 'Pe', 'Ra', 'Sto', 'Vu', 'Ze', 'Bla', 'Kr', 'Mi', 'Pa', 'Sa', 'To'],
    'WS': ['Bro', 'Dvo', 'Ha', 'Ja', 'Ko', 'Kra', 'Le', 'Ma', 'No', 'Pa', 'Ro', 'Sko', 'Vla', 'Wo', 'Za', 'Ce', 'Hu', 'Mi', 'Pr', 'Sta'],
    'UA': ['Bo', 'Da', 'Ha', 'Kor', 'Lev', 'Ma', 'Pa', 'Ro', 'Sa', 'Te', 'Vo', 'Za', 'Hry', 'Kli', 'Ost'],
    'GR': ['Ana', 'Chri', 'Di', 'Ge', 'Ka', 'Lam', 'Ma', 'Ni', 'Pa', 'Sta', 'Theo', 'Va', 'Xe', 'Zo', 'Ko'],
    'AR': ['Ab', 'Bak', 'Fa', 'Ha', 'Ja', 'Ka', 'Ma', 'Na', 'Ra', 'Sa', 'Ta', 'Za', 'Ou', 'El', 'Be'],
    'IR': ['Ba', 'Da', 'Fa', 'Ka', 'Ma', 'Na', 'Ra', 'Sa', 'Ta', 'Za'],
    'KA': ['Bo', 'Da', 'Gi', 'Ka', 'Lo', 'Ma', 'No', 'Sa', 'Tsi', 'Kve'],
    'HU': ['Ba', 'Fe', 'Ho', 'Ki', 'Ko', 'Mé', 'Ne', 'Sza', 'To', 'Vé'],
    'RO': ['Ba', 'Co', 'Dra', 'Flo', 'Ia', 'Mi', 'Po', 'Ra', 'Stă', 'Vla'],
    'AL': ['Be', 'Do', 'Ga', 'Ha', 'Ke', 'Le', 'Mu', 'Ra', 'Sha', 'Ze'],
    'JP': ['Aki', 'Fuji', 'Hira', 'Ishi', 'Kawa', 'Kita', 'Mae', 'Mori', 'Naka', 'Oga', 'Sato', 'Tani', 'Uchi', 'Yasu', 'Hama'],
    'KR': ['Ahn', 'Baek', 'Cha', 'Han', 'Ju', 'Ko', 'Moon', 'Nam', 'Shin', 'Yoo', 'Woo', 'Seo'],
    'AZ': ['Al', 'Ba', 'Ga', 'Is', 'Ka', 'Ma', 'Na', 'Ra', 'Sa', 'Ta'],
    'AF': ['Ada', 'Ba', 'Chi', 'Da', 'Eke', 'Fo', 'Ka', 'Mba', 'Nwo', 'Oko', 'Sa', 'Ta', 'Wa', 'Yo', 'Ze', 'Ndo', 'Kou', 'Ama'],
    'XX': ['Al', 'Bo', 'Da', 'Ka', 'Le', 'Ma', 'No', 'Ra', 'Sa', 'Ve'],
}
MID = {'ES': ['', 'ra', 'ri', 'do', 'li', 'ta'], 'PT': ['', 'ra', 'ri', 'do', 'li'], 'IT': ['', 'ri', 'na', 'to', 'li', 'de'], 'FR': ['', 'ri', 'la', 'no'],
       'SS': ['', 'r', 'n', 'l', 'k', 'v'], 'WS': ['', 'r', 'l', 'w', 'n'], 'UA': ['', 'r', 'l', 'n'], 'GR': ['', 'ko', 'ri', 'no', 'pa'],
       'AR': ['', 'li', 'mi', 'ri', 'di'], 'IR': ['', 'ra', 'mi', 'ri'], 'KA': ['', 'la', 'ri', 'ta'], 'HU': ['', 'r', 'l', 'n'], 'RO': ['', 'r', 'n', 'l'],
       'AL': ['', 'r', 'l', 'n'], 'AZ': ['', 'li', 'ra', 'mi'], 'AF': ['', 'ri', 'nu', 'ko', 'le', 'ma'], 'XX': ['', 'r', 'n', 'l']}
END = {
    'ES': ['ez', 'es', 'ado', 'ero', 'ino', 'ales', 'eda', 'illo', 'ón', 'ano', 'era', 'ez', 'oza'],
    'PT': ['eira', 'inho', 'ão', 'es', 'ado', 'oso', 'ela', 'ida', 'ares', 'ota'],
    'IT': ['ini', 'etti', 'elli', 'ano', 'one', 'ari', 'ucci', 'esi', 'otti', 'ese', 'enzi'],
    'FR': ['ard', 'et', 'ier', 'eau', 'in', 'on', 'ault', 'and', 'ot', 'el'],
    'DE': ['mann', 'er', 'berg', 'hoff', 'dorf', 'ling', 'ner', 'stein', 'haus', 'feld', 'hardt'],
    'NL': ['sen', 'ma', 'stra', 'huis', 'ink', 'veld', 'dijk', 'man', 'ers', 'hof'],
    'EN': ['ton', 'ley', 'son', 'well', 'field', 'ford', 'by', 'er', 'ham', 'wood', 'ridge', 'more'],
    'NO': ['sen', 'gaard', 'rud', 'holm', 'berg', 'strøm', 'vik', 'heim', 'by', 'stad'],
    'SS': ['ić', 'ović', 'ević', 'anić', 'inić'], 'WS': ['ski', 'czyk', 'ek', 'ák', 'ny', 'ík', 'owski'], 'UA': ['enko', 'uk', 'chuk', 'ko', 'ov'],
    'GR': ['poulos', 'idis', 'akis', 'ou', 'atos'], 'AR': ['i', 'ani', 'awi', 'ouri', 'ah'], 'IR': ['i', 'ani', 'zadeh', 'pour', 'ian'],
    'KA': ['shvili', 'dze', 'ia', 'uri'], 'HU': ['os', 'ai', 'ényi', 'as', 'ics'], 'RO': ['escu', 'eanu', 'aru', 'ache', 'iu'],
    'AL': ['aj', 'i', 'aku', 'ani', 'eri'], 'JP': ['moto', 'yama', 'da', 'kawa', 'shita', 'no', 'zaki', 'mura', 'ta', 'hara'],
    'KR': [''], 'AZ': ['ov', 'yev', 'li', 'zade', 'ev'], 'AF': ['ye', 'ka', 'la', 'ba', 'ou', 'ni', 'mbe', 'ngo', 'si', 'du'],
    'XX': ['an', 'er', 'is', 'o', 'el', 'ov', 'en'],
}
TR_A = ['Ak', 'Kara', 'Ay', 'Gün', 'Öz', 'Taş', 'Yıl', 'Kök', 'Bal', 'Demir', 'Tun', 'Sel', 'Ulu', 'Çakır', 'Tek', 'Gök', 'Kaya', 'Alp', 'Uçar', 'Bay',
        'Şen', 'Ateş', 'Duru', 'Erk', 'Tur', 'Bilge', 'Ilgaz', 'Yüce', 'Sarı', 'Çınar', 'Arı', 'Doğru', 'Karan', 'Oğuz', 'Toprak', 'Yağız', 'Bora', 'Tan', 'Uz', 'Akın']
TR_B = ['han', 'soy', 'oğlu', 'kan', 'dağ', 'türk', 'kaya', 'taş', 'men', 'yürek', 'demir', 'sal', 'tekin', 'gül', 'bey', 'ışık', 'sever', 'er', 'can', 'el', 'göz', 'pınar', 'yol', 'alp', 'tepe']
BR_NICK = ['Tavinho', 'Dedé', 'Juca', 'Bebeto', 'Nenê', 'Zito', 'Pituca', 'Gersinho', 'Tonho', 'Didu', 'Lelo', 'Mazinho', 'Cacá', 'Dinei', 'Fabão', 'Nando', 'Pepão', 'Tuca', 'Zezé', 'Vavá', 'Bilu', 'Coca', 'Duda', 'Leléu', 'Paulão', 'Quinzinho', 'Rondi', 'Serginho', 'Tiquinho', 'Xandão']
FIRST = {
    'ES': ['Mateo', 'Sergio', 'Pablo', 'Diego', 'Álvaro', 'Iker', 'Marcos', 'Rubén', 'Hugo', 'Nicolás', 'Tomás', 'Joaquín'],
    'PT': ['Rafael', 'Tiago', 'Rodrigo', 'Gonçalo', 'Bruno', 'Caio', 'Murilo', 'Danilo', 'Vítor', 'Luan'],
    'IT': ['Matteo', 'Lorenzo', 'Andrea', 'Davide', 'Simone', 'Luca', 'Marco', 'Alessio'],
    'FR': ['Yanis', 'Enzo', 'Hugo', 'Lucas', 'Théo', 'Maxime', 'Nathan', 'Rayan'],
    'DE': ['Lukas', 'Jonas', 'Felix', 'Tobias', 'Niklas', 'Moritz', 'Jan', 'Florian'],
    'NL': ['Daan', 'Bram', 'Sem', 'Jesse', 'Luuk', 'Thijs', 'Ruben', 'Milan'],
    'EN': ['Jack', 'Harry', 'Oliver', 'George', 'Callum', 'Lewis', 'Mason', 'Reece', 'Tom', 'Sam'],
    'NO': ['Jonas', 'Magnus', 'Sander', 'Emil', 'Mathias', 'Oskar'], 'TR': ['Emre', 'Burak', 'Kaan', 'Efe', 'Mert', 'Kerem', 'Ozan', 'Berk', 'Tolga', 'Umut'],
    'AF': ['Kwame', 'Samuel', 'Ibrahim', 'Joseph', 'Daniel', 'Moussa'], 'AR': ['Youssef', 'Karim', 'Omar', 'Hamza', 'Bilal'],
    'XX': ['Leo', 'Adam', 'Noah', 'Elias', 'Daniel', 'Victor'],
}
BANNED = ['Şükür', 'Erdem']
PART = {'van', 'de', 'da', 'dos', 'di', 'del', 'el', 'le', 'la', 'der', 'den', 'ter', 'van der', 'van de', 'mac', 'mc', 'mak', 'ben', 'al', 'el-', 'dos'}


TRCH = re.compile('[şğıİŞĞ]')
TRPOOL = set()
TRF = {'Mehmet', 'Ahmet', 'Mustafa', 'Hakan', 'Emre', 'Burak', 'Arda', 'Kerem', 'Yusuf', 'Ömer', 'Hasan', 'Hüseyin', 'Ali', 'Veli', 'Selim', 'Serkan', 'Tolga', 'Volkan', 'Can', 'Cenk', 'Tuncay', 'Nihat', 'Okan', 'Tanju', 'Rıdvan', 'Metin', 'Feyyaz', 'Sergen', 'Tugay', 'Bülent', 'Rüştü', 'Alpay', 'Emre', 'Hamit', 'Halil', 'Kenan', 'Orkun', 'Ferdi', 'Mert', 'Altay', 'Zeki', 'Yasin', 'Gökhan', 'Umut', 'Caner', 'Arif', 'Semih', 'Uğur', 'Erol', 'Erhan', 'Ertuğrul', 'Fatih', 'Kaan'}


def h(s, salt=0):
    return int(hashlib.md5(f'{s}|{salt}'.encode()).hexdigest(), 16)


def fold(s):
    return ''.join(c for c in unicodedata.normalize('NFKD', s.lower()) if not unicodedata.combining(c)).replace('ı', 'i')


VOW = set('aeiouáéíóúâêôãõàèìòùäöüåøæăıAEIOU')


def join(a, e):
    if not e: return a
    if a[-1] in VOW and e[0] in VOW: a = a[:-1] if len(a) > 2 else a + 'r'
    elif a[-1] not in VOW and e[0] not in VOW and e[0] not in 'yh': a = a + 'e'
    return a + e


def gen_sur(fam, key, salt):
    x = h(key, salt)
    if fam == 'TR':
        return TR_A[x % len(TR_A)] + TR_B[(x // 97) % len(TR_B)]
    on = ON.get(fam, ON['XX']); mid = MID.get(fam, ['']); end = END.get(fam, END['XX'])
    a = on[x % len(on)]
    if fam in ('SS', 'WS', 'UA', 'GR', 'AR', 'IR', 'KA', 'HU', 'RO', 'AL', 'AZ', 'AF', 'XX'):
        m = mid[(x // 31) % len(mid)]
        if m and not (a[-1] not in VOW and m[0] not in VOW): a = a + m
    s = join(a, end[(x // 977) % len(end)])
    s = re.sub(r'([aiu])\1', r'\1', s)
    if fam == 'AR' and (x // 7) % 3 == 0: s = 'El ' + s[0].upper() + s[1:]
    return s[0].upper() + s[1:]


def ok(new, old):
    a, b = fold(new), fold(old)
    if not b: return True
    if a[:3] == b[:3]: return False
    if any(w in new for w in BANNED): return False
    return difflib.SequenceMatcher(None, a, b).ratio() < 0.5


def main():
    import subprocess
    TRPOOL.update(json.loads(subprocess.check_output(['node', '-e', "const fs=require('fs');eval(fs.readFileSync('" + D + "../../js/data.js','utf8').replace(/^const /gm,'var '));console.log(JSON.stringify(NAME_POOLS.TR.f))"])))
    src = json.load(open(D + 'src.json'))
    best = {}
    for n, nat, r, kind in src:
        cur = best.get(n)
        pr = 0 if kind == 'squad' else 1
        if not cur: best[n] = (nat, r or 0, pr); continue
        nat2 = nat if (pr, nat != 'TUR') > (cur[2], cur[0] != 'TUR') else cur[0]
        best[n] = (nat2, max(r or 0, cur[1]), max(pr, cur[2]))
    fixed = json.load(open(D + 'fixed.json')) if os.path.exists(D + 'fixed.json') else {}
    used = set(fixed.values()) | set(best)
    out = {}
    for n in sorted(best):
        if n in fixed: out[n] = fixed[n]; continue
        nat, r, _ = best[n]
        fam = FAM.get(nat, 'XX')
        f0 = n.split(' ')[0]
        sl = n.split(' ')[-1]
        trn = f0 in TRF or f0 in TRPOOL or (nat == 'TUR' and (bool(re.search('[şğıçöüŞĞİÇÖÜ]', n)) and not re.search('yç$', n) or bool(re.search('(lı|li|lu|lü|oğlu|can|han|er)$', sl))))
        if trn: fam = 'TR'
        elif fam == 'TR':
            fam = 'SS' if re.search(r'(yç|iç|ić|ov|ev)$', n) else 'XX'
        toks = n.split(' ')
        # soyadı grubu: son kelime (+ önündeki ekler)
        i = len(toks) - 1
        while i > 1 and toks[i - 1].lower() in PART: i -= 1
        given, sur = toks[:i], toks[i:]
        salt = 0
        while True:
            if len(toks) == 1:
                new = join(ON['PT'][h(n, salt) % len(ON['PT'])], ['inho', 'ão', 'é', 'ito', 'ola', 'ico', 'ildo'][h(n, salt + 7) % 7]) if fam == 'PT' else gen_sur(fam, n, salt)
                cand = new
                good = ok(new, n)
            else:
                ns = gen_sur(fam, n, salt)
                parts = [t for t in sur[:-1] if t.lower() not in ('mak', 'mac', 'mc')]
                if fam == 'NL' and parts and parts[0].lower() == 'van': ns = ns  # 'van' kalır
                g = given
                if r >= 88:
                    fl = FIRST.get(fam, FIRST['XX'])
                    g = [fl[h(n, salt + 99) % len(fl)]]
                    if fold(g[0]) == fold(given[0]): g = [fl[(h(n, salt + 99) + 1) % len(fl)]]
                cand = ' '.join(g + parts + [ns])
                good = ok(ns, sur[-1])
            if good and cand not in used and cand not in out.values():
                break
            salt += 1
            if salt > 400: raise SystemExit('üretilemedi: ' + n)
        out[n] = cand
        used.add(cand)
    json.dump(out, open(D + 'map.json', 'w'), ensure_ascii=False, indent=0, sort_keys=True)
    print(len(out))


if __name__ == '__main__':
    main()
