import re, json, sys, glob
import os
D = os.path.dirname(os.path.abspath(__file__)) + '/'
ROOT = os.path.abspath(D + '../../') + '/'
# Basit JS tarayıcı: string ve template literal'leri çıkarır (iç içe ${} ve template destekli)
def scan(src):
    out = []  # list of (kind, parts) parts: list of str with None as placeholder
    i, n = 0, len(src)
    def skip_regex_or_div(i):
        return i
    prev_sig = ''
    def read_str(i, q):
        j = i + 1; buf = []
        while j < n:
            c = src[j]
            if c == '\\': buf.append(src[j:j+2]); j += 2; continue
            if c == q: return j + 1, ''.join(buf)
            buf.append(c); j += 1
        return j, ''.join(buf)
    def read_tpl(i):
        # src[i] == '`'
        j = i + 1; parts = []; cur = []
        while j < n:
            c = src[j]
            if c == '\\': cur.append(src[j:j+2]); j += 2; continue
            if c == '`':
                parts.append(''.join(cur)); return j + 1, parts
            if c == '$' and j + 1 < n and src[j+1] == '{':
                parts.append(''.join(cur)); cur = []
                j = read_expr(j + 2)
                parts.append(None)
                continue
            cur.append(c); j += 1
        return j, parts
    def read_expr(j):
        depth = 0
        while j < n:
            c = src[j]
            if c in '"\'':
                k, s = read_str(j, c); out.append(('s', [s])); j = k; continue
            if c == '`':
                k, parts = read_tpl(j); out.append(('t', parts)); j = k; continue
            if c == '{': depth += 1
            elif c == '}':
                if depth == 0: return j + 1
                depth -= 1
            j += 1
        return j
    while i < n:
        c = src[i]
        if src.startswith('//', i):
            k = src.find('\n', i); i = n if k < 0 else k; continue
        if src.startswith('/*', i):
            k = src.find('*/', i); i = n if k < 0 else k + 2; continue
        if c in '"\'':
            k, s = read_str(i, c); out.append(('s', [s])); i = k; continue
        if c == '`':
            k, parts = read_tpl(i); out.append(('t', parts)); i = k; continue
        if c == '/' and prev_sig in '(,=:[!&|?{};' :
            # regex literal
            j = i + 1; inclass = False
            while j < n:
                d = src[j]
                if d == '\\': j += 2; continue
                if d == '[': inclass = True
                elif d == ']': inclass = False
                elif d == '/' and not inclass: break
                elif d == '\n': break
                j += 1
            i = j + 1; continue
        if not c.isspace(): prev_sig = c
        i += 1
    return out

TR = re.compile(r'[çğışöüÇĞİŞÖÜ]')
WORD = re.compile(r'[A-Za-zÇĞİŞÖÜçğışöü]{2,}')
def frags(parts):
    # parçaları birleştir; yer tutucu {} ; HTML etiketlerinde böl
    s = ''.join('\x00' if p is None else p for p in parts)
    s = s.replace('\\n', '\n')
    pieces = re.split(r'<[^>]*>|\n', s)
    res = []
    for pc in pieces:
        t = pc.strip()
        if not t: continue
        res.append(t)
    return res

def looks_text(t):
    plain = t.replace('\x00', '')
    if not WORD.search(plain): return False
    if re.fullmatch(r'[a-z0-9_\-\.#:\[\]=\'" ]+', plain) and ' ' not in plain.strip(): return False  # id/sınıf
    if re.search(r'^[\w\-]+(\s[\w\-]+)*$', plain) and plain == plain.lower() and not TR.search(plain) and ' ' in plain:
        return False  # css sınıf listesi
    if re.match(r'^(rgba?|#|url\(|M\d|translate|data-|https?:)', plain): return False
    if re.search(r'[{};]\s*$', plain) and ':' in plain: return False  # css
    return True

all_ = {}
files = sorted(glob.glob(ROOT + 'js/*.js'))
for f in files:
    src = open(f).read()
    for kind, parts in scan(src):
        for t in frags(parts):
            if looks_text(t):
                key = t.replace('\x00', '{}')
                all_.setdefault(key, set()).add(f.split('/')[-1])
html = open(ROOT + 'index.html').read()
for t in re.split(r'<[^>]*>|\n', re.sub(r'<script.*?</script>|<style.*?</style>', '', html, flags=re.S)):
    t = t.strip()
    if t and WORD.search(t): all_.setdefault(t, set()).add('index.html')
keys = sorted(all_)
json.dump({k: sorted(v) for k, v in all_.items()}, open(D + 'src_strings.json', 'w'), ensure_ascii=False, indent=0)
tr_like = [k for k in keys if TR.search(k) or re.search(r'\b(ve|ile|bir|için|maç|gol|hafta|sezon|takım|kulüp|lig|sen|bu|da|de)\b', k, re.I)]
print(len(keys), 'fragments;', len(tr_like), 'turkish-looking')
