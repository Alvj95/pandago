"""
Generador del curso de PandaGO! (HSK 1-2).

  python3 scripts/course/build.py

Edita words.py (significados) o units.py (unidades, frases, conversaciones)
y vuelve a ejecutarlo: reescribe src/data/hsk/course.ts y
src/data/strokes/hsk.strokes.json. Después: npm test.
"""
import json, os, re, sys, unicodedata
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from words import W
from units import U
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
CACHE = os.path.join(HERE, '.cache')
DATA = os.path.join(CACHE, 'hsk')
HWD = os.path.join(CACHE, 'hanzi-writer-data', 'package')
OUT = os.path.join(ROOT, 'src', 'data')


def fetch_sources():
    """Descarga (una vez) las listas HSK oficiales y los datos de trazos."""
    import subprocess, tarfile, urllib.request
    os.makedirs(DATA, exist_ok=True)
    for lvl in (1, 2):
        dest = os.path.join(DATA, f'old{lvl}.json')
        if not os.path.exists(dest):
            url = f'https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/main/wordlists/exclusive/old/{lvl}.json'
            urllib.request.urlretrieve(url, dest)
    if not os.path.isdir(HWD):
        pkg = os.path.join(CACHE, 'hanzi-writer-data')
        os.makedirs(pkg, exist_ok=True)
        name = subprocess.check_output(['npm', 'pack', 'hanzi-writer-data@2.0.1', '--silent'], cwd=pkg, text=True).strip()
        with tarfile.open(os.path.join(pkg, name)) as t:
            t.extractall(pkg, filter='data')


fetch_sources()

def toneless(p):
    p = unicodedata.normalize('NFD', p.lower())
    return re.sub(r"[^a-zü]", '', ''.join(c for c in p if unicodedata.category(c) != 'Mn').replace('ü', 'ü'))

src = {}
for lvl in (1, 2):
    for w in json.load(open(os.path.join(DATA, f'old{lvl}.json'))):
        src[w['simplified']] = (lvl, w['forms'])

def tones_for(h, mine):
    if h not in src:  # extra (你好)
        return [3, 3]
    forms = src[h][1]
    cands = [f for f in forms if toneless(f['transcriptions']['pinyin']) == toneless(mine)] or forms
    exact = [f for f in cands if f['transcriptions']['pinyin'].replace(' ', '').lower() == mine.replace(' ', '').replace('-', '').lower()]
    f = (exact or cands)[0]
    return [int(s[-1]) if s[-1].isdigit() else 5 for s in f['transcriptions']['numeric'].split()]

# ---- Asignación de palabras a unidades ----
assigned, problems = {}, []
for i, u in enumerate(U):
    if u['words'] is None:
        continue
    for h in u['words']:
        if h in assigned: problems.append(f'duplicada {h} en {u["title"]} y {assigned[h]}')
        if h not in W: problems.append(f'sin significado: {h}')
        assigned[h] = u['title']
for lvl in (1, 2):
    rest = [h for h, (l, _) in src.items() if l == lvl and h not in assigned]
    target = [u for u in U if u['level'] == lvl and u['words'] is None][0]
    target['words'] = rest
    for h in rest: assigned[h] = target['title']
for h, (l, _) in src.items():
    if h not in assigned: problems.append(f'sin unidad: {h}')

level_of = {h: (src[h][0] if h in src else 1) for h in W}
vid = lambda h: f'h{level_of[h]}-{h}'
vocab = [dict(id=vid(h), hanzi=h, pinyin=W[h][0], tones=tones_for(h, W[h][0]), meaning=W[h][1], level=level_of[h])
         for u in U for h in u['words']]

# ---- Frases ----
sentences, unknown = [], set()
for ui, u in enumerate(U):
    for si, (tokens, py, es) in enumerate(u['sentences']):
        ids = [vid(t) for t in tokens if t in W]
        unknown |= {t for t in tokens if t not in W}
        sentences.append(dict(id=f'u{ui+1}-s{si+1}', tokens=tokens, pinyin=py, meaning=es, itemIds=list(dict.fromkeys(ids))))

# ---- Unidades y nodos del camino ----
def chunks(items, size=6):
    n = max(1, round(len(items) / size))
    k, m = divmod(len(items), n)
    out, i = [], 0
    for j in range(n):
        step = k + (1 if j < m else 0)
        out.append(items[i:i + step]); i += step
    return out

units, per_level = [], {1: 0, 2: 0}
for ui, u in enumerate(U):
    per_level[u['level']] += 1
    uid = f'u{ui+1}'
    nodes = []
    for li, group in enumerate(chunks(u['words'])):
        nodes.append(dict(id=f'{uid}-l{li+1}', title=group[0], icon=u['icons'][li % len(u['icons'])], kind='lesson', skillIds=[vid(h) for h in group]))
        if li == 1:
            nodes.append(dict(id=f'{uid}-c', title='Cofre', icon='🎁', kind='chest', skillIds=[]))
    chat = u['chat']
    nodes.append(dict(id=f'{uid}-ai', title='Conversación', icon='💬', kind='conversation', skillIds=[vid(h) for h in u['words'][:8]],
                      scenario={k: v for k, v in dict(goal=chat['goal'], persona=chat['persona'], role=chat.get('role')).items() if v}))
    nodes.append(dict(id=f'{uid}-boss', title='Desafío', icon='🏆', kind='boss', skillIds=[vid(h) for h in u['words']]))
    units.append(dict(id=uid, level=u['level'], index=per_level[u['level']], title=u['title'], description=u['desc'], color=u['color'], nodes=nodes))

# ---- Trazos ----
chars = sorted({c for v in vocab for c in v['hanzi'] if '一' <= c <= '鿿'})
strokes, missing = {}, []
for c in chars:
    p = os.path.join(HWD, c + '.json')
    if not os.path.exists(p): missing.append(c); continue
    j = json.load(open(p))
    strokes[c] = dict(strokes=j['strokes'], medians=j['medians'])

print('palabras', len(vocab), 'frases', len(sentences), 'unidades', len(units), 'nodos', sum(len(u['nodes']) for u in units))
print('caracteres', len(chars), 'sin trazos', missing)
print('fichas fuera del vocabulario:', ' '.join(sorted(unknown)))
for p in problems: print('PROBLEMA', p)
if problems: sys.exit(1)

js = lambda o: json.dumps(o, ensure_ascii=False, indent=2)
ts = f"""// Generado a partir de las listas oficiales HSK 2.0 (niveles 1-2) de
// github.com/drkameleon/complete-hsk-vocabulary (MIT). Significados en español,
// lecturas, unidades, frases y conversaciones curados para PandaGO!.
// No editar a mano la estructura: regenerar con el script del curso.
import type {{ SampleSentence, Unit, VocabItem }} from './types';

export const VOCAB: VocabItem[] = {js(vocab)};

export const SENTENCES: SampleSentence[] = {js(sentences)};

export const UNITS: Unit[] = {js(units)};
"""
open(os.path.join(OUT, 'hsk', 'course.ts'), 'w').write(ts)
json.dump(strokes, open(os.path.join(OUT, 'strokes', 'hsk.strokes.json'), 'w'), ensure_ascii=False, separators=(',', ':'))
print('course.ts', os.path.getsize(os.path.join(OUT, 'hsk', 'course.ts')) // 1024, 'KB; strokes', os.path.getsize(os.path.join(OUT, 'strokes', 'hsk.strokes.json')) // 1024, 'KB')
