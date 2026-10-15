/**
 * Utilidades de pinyin: separar en sílabas y saber el tono de cada una a partir
 * de las marcas (ā á ǎ à). Sirve para colorear el pinyin por tonos en fichas,
 * guías y chat.
 */

export type Tone = 1 | 2 | 3 | 4 | 5;

const MARKS: Record<string, [string, Tone]> = {};
for (const [base, marked] of [
  ['a', 'āáǎà'], ['e', 'ēéěè'], ['i', 'īíǐì'], ['o', 'ōóǒò'], ['u', 'ūúǔù'], ['ü', 'ǖǘǚǜ'],
  ['A', 'ĀÁǍÀ'], ['E', 'ĒÉĚÈ'], ['I', 'ĪÍǏÌ'], ['O', 'ŌÓǑÒ'], ['U', 'ŪÚǓÙ'],
] as const) {
  [...marked].forEach((ch, i) => (MARKS[ch] = [base, (i + 1) as Tone]));
}

const INITIAL = '(?:zh|ch|sh|[bpmfdtnlgkhjqxrzcsyw])';
const FINAL = '(?:iang|iong|uang|ueng|ang|eng|ing|ong|ian|iao|uai|uan|üan|van|ai|ei|ao|ou|an|en|in|un|ün|ia|ie|iu|ua|uo|ui|üe|ue|ve|er|a|o|e|i|u|ü|v)';
/** Sílaba válida: con inicial, o sin ella empezando por a/o/e (las demás llevan y/w). */
const SYLLABLE = new RegExp(`^(?:${INITIAL}${FINAL}|(?:a|o|e)(?:i|o|n|ng|r|u)?)r?$`);

const LETTERS = `a-zA-Zü${Object.keys(MARKS).join('')}`;
const LETTER = new RegExp(`[${LETTERS}]`);
const NON_LETTERS = new RegExp(`([^${LETTERS}]+)`);

const plain = (s: string) => [...s].map((ch) => MARKS[ch]?.[0] ?? ch).join('').toLowerCase();

/**
 * Divide una palabra sin espacios ("Hànyǔ", "fànguǎn", "kěnéng") en sílabas
 * válidas. Si hay varias divisiones posibles, prefiere la que deja menos
 * sílabas sin consonante inicial en medio (kě·néng, no kěn·éng), igual que
 * haría el apóstrofo del pinyin estándar.
 */
function segmentWord(word: string): string[] | null {
  const chars = [...word];
  const base = [...plain(word)];
  const memo = new Map<number, { parts: string[]; cost: number } | null>();
  const go = (i: number): { parts: string[]; cost: number } | null => {
    if (i === chars.length) return { parts: [], cost: 0 };
    if (memo.has(i)) return memo.get(i) ?? null;
    let best: { parts: string[]; cost: number } | null = null;
    for (let len = Math.min(7, chars.length - i); len >= 1; len--) {
      const syl = base.slice(i, i + len).join('');
      if (!SYLLABLE.test(syl)) continue;
      const rest = go(i + len);
      if (!rest) continue;
      const cost = rest.cost + (i > 0 && /^[aoe]/.test(syl) ? 10 : 0) + 1;
      if (!best || cost < best.cost) best = { parts: [chars.slice(i, i + len).join(''), ...rest.parts], cost };
    }
    memo.set(i, best);
    return best;
  };
  return go(0)?.parts ?? null;
}

export const toneOf = (syllable: string): Tone => {
  for (const ch of syllable) {
    const m = MARKS[ch];
    if (m) return m[1];
  }
  return 5;
};

export interface PinyinSegment {
  text: string;
  /** null = espacio o puntuación. */
  tone: Tone | null;
}

/** Trocea un texto en pinyin (palabra o frase) en sílabas con su tono, conservando espacios y puntuación. */
export function pinyinSegments(text: string): PinyinSegment[] {
  const out: PinyinSegment[] = [];
  for (const part of text.split(NON_LETTERS)) {
    if (!part) continue;
    if (!LETTER.test(part)) {
      out.push({ text: part, tone: null });
      continue;
    }
    const syllables = segmentWord(part);
    if (!syllables) out.push({ text: part, tone: toneOf(part) });
    else for (const s of syllables) out.push({ text: s, tone: toneOf(s) });
  }
  return out;
}

/** Sílabas (sin espacios ni puntuación) de un pinyin. */
export const syllablesOf = (text: string) => pinyinSegments(text).filter((s) => s.tone !== null);
