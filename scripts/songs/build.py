"""
Generador de «Aprende cantando» de PandaGO!.

  python3 scripts/songs/build.py

Lee songs.src.json (letras + partitura), sintetiza para cada canción dos pistas
MP3 (con voz guía y solo música para karaoke) con numpy + ffmpeg, y escribe:
  - assets/songs/<id>-guide.mp3, assets/songs/<id>-karaoke.mp3
  - src/data/songs/songs.generated.json  (sílabas con su tiempo exacto)
  - src/data/songs/audio.ts              (require() de los MP3 para Metro)
Una sílaba = una o varias notas, así el karaoke ilumina cada sílaba a tiempo.
"""
import json, os, re, subprocess, sys, tempfile, unicodedata
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
SR = 22050
NOTE_RE = re.compile(r'^([A-G])(#|b)?(\d)$')
SEMITONE = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
CHORDS = {'C': (0, 4, 7), 'F': (5, 9, 12), 'G': (7, 11, 14), 'Am': (9, 12, 16), 'Dm': (2, 5, 9), 'Em': (4, 7, 11), 'G7': (7, 11, 14, 17)}
MARKS = {'āēīōūǖ': 1, 'áéíóúǘ': 2, 'ǎěǐǒǔǚ': 3, 'àèìòùǜ': 4}


def midi(note):
    m = NOTE_RE.match(note)
    if not m: raise ValueError(f'nota inválida: {note}')
    acc = {'#': 1, 'b': -1}.get(m.group(2) or '', 0)
    return 12 * (int(m.group(3)) + 1) + SEMITONE[m.group(1)] + acc


def hz(m): return 440.0 * 2 ** ((m - 69) / 12)


def tone_of(syl):
    for chars, t in MARKS.items():
        if any(c in syl for c in chars): return t
    return 5


def parse(song):
    lines, beat, problems = [], float(song['meter']), []  # 1 compás de cuenta atrás
    count_in = beat
    for li, line in enumerate(song['lines']):
        pin = line['pinyin'].split()
        tokens = line['notes'].split()
        if len(pin) != len(tokens): problems.append(f"{song['id']} línea {li+1}: {len(tokens)} sílabas y {len(pin)} pinyin")
        syls, start = [], beat
        for ti, tok in enumerate(tokens):
            hanzi, spec = tok.split('=')
            notes = []
            for part in spec.split('+'):
                n, _, b = part.partition('/')
                notes.append({'midi': midi(n), 'beats': float(b or 1)})
            dur = sum(n['beats'] for n in notes)
            p = pin[ti] if ti < len(pin) else '?'
            syls.append({'hanzi': hanzi, 'pinyin': p, 'tone': tone_of(p), 'start': round(beat, 4), 'beats': dur, 'notes': notes})
            beat += dur
        chords = []
        cb = 0.0
        for c in line['chords'].split():
            name, b = c.split(':')
            if name not in CHORDS: problems.append(f'acorde desconocido {name}')
            chords.append({'chord': name, 'start': round(start + cb, 4), 'beats': float(b)}); cb += float(b)
        if abs(cb - (beat - start)) > 1e-6: problems.append(f"{song['id']} línea {li+1}: acordes {cb} ≠ notas {beat - start}")
        lines.append({'es': line['es'], 'start': round(start, 4), 'end': round(beat, 4), 'syllables': syls, 'chords': chords})
    return {'countIn': count_in, 'total': beat + 2, 'lines': lines}, problems


# ---------------- síntesis ----------------
def env(n, attack, release, decay=None):
    e = np.ones(n)
    a = max(1, int(attack * SR)); r = max(1, int(release * SR))
    e[:a] = np.linspace(0, 1, a)
    if decay: e *= np.exp(-np.arange(n) / (decay * SR))
    e[-r:] *= np.linspace(1, 0, r)
    return e


def flute(f, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * t) * np.clip((t - 0.15) * 4, 0, 1)
    ph = 2 * np.pi * f * np.cumsum(vib) / SR
    w = np.sin(ph) + 0.28 * np.sin(2 * ph) + 0.08 * np.sin(3 * ph)
    return w * env(n, 0.03, min(0.09, dur / 3)) * 0.8


def piano(f, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    w = sum((1 / k ** 1.4) * np.sin(2 * np.pi * f * k * t) * np.exp(-t * (2.2 + 1.6 * k)) for k in range(1, 6))
    return w * env(n, 0.004, 0.05)


def bass(f, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    w = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)
    return w * env(n, 0.006, 0.06, decay=0.9)


def click(accent):
    n = int(0.06 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * (1600 if accent else 1100) * t) * np.exp(-t / 0.012) * 0.6


def shaker(rng):
    n = int(0.05 * SR)
    noise = np.diff(rng.standard_normal(n + 1))
    return noise * np.exp(-np.arange(n) / (0.008 * SR)) * 0.05


def add(buf, sig, at):
    i = int(round(at * SR)); j = min(len(buf), i + len(sig))
    if i < len(buf): buf[i:j] += sig[: j - i]


def render(song, data):
    spb = 60.0 / song['bpm']
    n = int((data['total'] + 1) * spb * SR)
    melody, acc, clicks = np.zeros(n), np.zeros(n), np.zeros(n)
    rng = np.random.default_rng(7)
    meter = song['meter']
    for b in range(int(data['countIn'])):
        add(clicks, click(b == 0), b * spb)
    for line in data['lines']:
        for s in line['syllables']:
            at = s['start']
            for note in s['notes']:
                add(melody, flute(hz(note['midi']), note['beats'] * spb * 0.97), at * spb)
                at += note['beats']
        for c in line['chords']:
            root = 48 + CHORDS[c['chord']][0]
            triad = [48 + iv for iv in CHORDS[c['chord']]]
            beat = c['start']
            while beat < c['start'] + c['beats'] - 1e-6:
                pos = int(round(beat - data['countIn'])) % meter
                if pos == 0:
                    add(acc, bass(hz(root - 12), spb * 0.95), beat * spb)
                elif meter == 4 and pos == 2:
                    add(acc, bass(hz(root - 12 + 7), spb * 0.95), beat * spb)
                else:
                    for m in triad:
                        add(acc, 0.32 * piano(hz(m), spb * 0.9), beat * spb)
                add(acc, shaker(rng), beat * spb + spb / 2)
                beat += 1
    # Acorde final de tónica
    end = data['lines'][-1]['end']
    for m in (48, 52, 55, 60):
        add(acc, 0.35 * piano(hz(m), spb * 2), end * spb)
    add(acc, bass(hz(36), spb * 2), end * spb)

    def master(x):
        x = x / max(1e-9, np.max(np.abs(x))) * 0.89
        fade = int(0.4 * SR); x[-fade:] *= np.linspace(1, 0, fade)
        return x
    guide = master(0.95 * melody + 0.55 * acc + 0.5 * clicks)
    karaoke = master(0.85 * acc + 0.6 * clicks)
    return guide, karaoke, melody


def to_mp3(x, path):
    pcm = (np.clip(x, -1, 1) * 32767).astype('<i2').tobytes()
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', 'pipe:0',
                    '-codec:a', 'libmp3lame', '-b:a', '64k', path], input=pcm, check=True)


def main():
    src = json.load(open(os.path.join(HERE, 'songs.src.json')))['songs']
    out_audio = os.path.join(ROOT, 'assets', 'songs'); os.makedirs(out_audio, exist_ok=True)
    out_data = os.path.join(ROOT, 'src', 'data', 'songs'); os.makedirs(out_data, exist_ok=True)
    songs, problems, report = [], [], []
    for song in src:
        data, p = parse(song); problems += p
        if p: continue
        guide, karaoke, melody = render(song, data)
        to_mp3(guide, os.path.join(out_audio, f"{song['id']}-guide.mp3"))
        to_mp3(karaoke, os.path.join(out_audio, f"{song['id']}-karaoke.mp3"))
        # Comprobación: la nota dominante de la melodía en el centro de cada sílaba es la escrita.
        spb = 60 / song['bpm']; ok = bad = 0
        for line in data['lines']:
            for s in line['syllables']:
                note = s['notes'][0]; mid = (s['start'] + note['beats'] / 2) * spb
                i0 = int((mid - 0.05) * SR); seg = melody[i0: i0 + int(0.1 * SR)]
                seg = seg * np.hanning(len(seg))
                spec = np.abs(np.fft.rfft(seg, 1 << 15)); freqs = np.fft.rfftfreq(1 << 15, 1 / SR)
                peak = freqs[np.argmax(spec)]
                if abs(12 * np.log2(peak / hz(note['midi']))) < 0.5: ok += 1
                else: bad += 1
        dur = data['total'] * spb
        report.append(f"{song['id']}: {sum(len(l['syllables']) for l in data['lines'])} sílabas, {dur:.1f}s, notas verificadas {ok}/{ok + bad}")
        songs.append({k: song[k] for k in ('id', 'title', 'pinyin', 'es', 'origin', 'originNote', 'bpm', 'meter', 'emoji', 'color')} |
                     {'countIn': data['countIn'], 'totalBeats': data['total'], 'durationSec': round(dur, 2),
                      'lines': [{**l, 'syllables': [{k: v for k, v in s.items() if k != 'notes'} for s in l['syllables']]} for l in data['lines']]})
    for p in problems: print('PROBLEMA', p)
    if problems: sys.exit(1)
    json.dump(songs, open(os.path.join(out_data, 'songs.generated.json'), 'w'), ensure_ascii=False, indent=1)
    ts = ['// Generado por scripts/songs/build.py — no editar a mano.', '/* eslint-disable */', 'export const SONG_AUDIO: Record<string, { guide: number; karaoke: number }> = {']
    for s in songs:
        ts.append(f"  '{s['id']}': {{ guide: require('../../../assets/songs/{s['id']}-guide.mp3'), karaoke: require('../../../assets/songs/{s['id']}-karaoke.mp3') }},")
    ts.append('};\n')
    open(os.path.join(out_data, 'audio.ts'), 'w').write('\n'.join(ts))
    print('\n'.join(report))


if __name__ == '__main__':
    main()
