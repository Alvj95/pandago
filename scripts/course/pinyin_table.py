"""
Tabla carácter → lecturas en pinyin (con número de tono) para el servidor:
permite saber si el reconocedor de voz oyó la misma sílaba con otro tono.

  python3 scripts/course/pinyin_table.py   → server/src/data/charPinyin.ts

Las lecturas salen de Make Me a Hanzi (github.com/skishore/makemeahanzi,
dictionary.txt, LGPL); ver server/src/data/LICENSE.md.
"""
import json, os, unicodedata, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
CACHE = os.path.join(HERE, '.cache', 'makemeahanzi-dictionary.txt')
OUT = os.path.join(ROOT, 'server', 'src', 'data', 'charPinyin.ts')

if not os.path.exists(CACHE):
    os.makedirs(os.path.dirname(CACHE), exist_ok=True)
    urllib.request.urlretrieve('https://raw.githubusercontent.com/skishore/makemeahanzi/master/dictionary.txt', CACHE)

MARKS = {'̄': 1, '́': 2, '̌': 3, '̀': 4}

def numbered(py):
    """nǐ → ni3, lǜ → lv4, ma → ma5."""
    tone = 5
    out = ''
    for ch in unicodedata.normalize('NFD', py.lower().strip()):
        if ch in MARKS: tone = MARKS[ch]
        elif ch == '̈': out += ':'
        elif ch.isalpha(): out += ch
    out = out.replace('u:', 'v')
    return f'{out}{tone}' if out.isalpha() else None

entries = []
with open(CACHE, encoding='utf-8') as f:
    for line in f:
        d = json.loads(line)
        c = d['character']
        if not ('一' <= c <= '鿿'): continue
        readings = []
        for p in d.get('pinyin') or []:
            n = numbered(p)
            if n and n not in readings: readings.append(n)
        if readings: entries.append(c + '|'.join(readings))

with open(OUT, 'w', encoding='utf-8') as f:
    f.write('// Generado por scripts/course/pinyin_table.py a partir de Make Me a Hanzi (LGPL, ver LICENSE.md). No editar a mano.\n')
    f.write('export const CHAR_PINYIN = ' + json.dumps(' '.join(entries), ensure_ascii=False) + ';\n')
print(len(entries), 'caracteres →', OUT)
