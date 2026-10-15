/**
 * Entrenador de tonos: escuchar una palabra y reconocer sus tonos tal y como
 * SUENAN (con los cambios de tono aplicados: 你好 se escribe 3+3 y suena 2+3).
 * Lógica pura y determinista con la semilla.
 */
import type { VocabItem } from '@/data/hsk/types';
import { applySandhi, type Tone } from '@/features/chat/engine/tones';
import { type Rng, sample, shuffle } from '@/features/lesson/engine/random';

export type ToneLevel = 1 | 2 | 3;

export const LEVELS: Record<ToneLevel, { title: string; desc: string }> = {
  1: { title: 'Una sílaba', desc: 'Los 4 tonos por separado: 妈 mā · 麻 má · 马 mǎ · 骂 mà' },
  2: { title: 'Dos sílabas', desc: 'Parejas de tonos en palabras: 中国, 学习, 汉语…' },
  3: { title: 'Neutro y cambios', desc: 'Tono neutro (爸爸) y cambios de tono (你好, 不是, 一起)' },
};

/** Caracteres con varias lecturas o que el sintetizador lee distinto aislados: fuera del nivel 1. */
const AMBIGUOUS = new Set([...'得着了还长为要便觉重地和行乐都看系发只种喂']);

export interface ToneQuestion {
  hanzi: string;
  pinyin: string;
  meaning: string;
  /** Tonos que se oyen (lo que hay que elegir). */
  spoken: Tone[];
  /** Tonos del diccionario. */
  written: Tone[];
  options: Tone[][];
  answerIndex: number;
  /** Explicación cuando lo que suena no coincide con lo escrito. */
  note: string | null;
}

const NAMES: Record<Tone, string> = { 1: '1.º', 2: '2.º', 3: '3.º', 4: '4.º', 5: 'neutro' };
export const toneLabel = (tones: Tone[]) => tones.map((t) => NAMES[t]).join(' + ');

const same = (a: Tone[], b: Tone[]) => a.length === b.length && a.every((t, i) => t === b[i]);

function sandhiNote(v: VocabItem, spoken: Tone[], written: Tone[]): string | null {
  if (same(spoken, written)) return null;
  const chars = [...v.hanzi];
  if (chars.includes('不')) return `不 delante de un 4.º tono se dice bú: se escribe ${toneLabel(written)} pero suena ${toneLabel(spoken)}.`;
  if (chars.includes('一')) return `一 cambia de tono según el siguiente: aquí suena ${toneLabel(spoken)} (en el diccionario ${toneLabel(written)}).`;
  return `Dos 3.º tonos seguidos: el primero se dice en 2.º. Se escribe ${toneLabel(written)} pero suena ${toneLabel(spoken)}.`;
}

/** Distractores: cambiar un tono cada vez, para que haya que escuchar de verdad. */
function distractors(answer: Tone[], allowNeutral: boolean, rng: Rng): Tone[][] {
  const pool: Tone[] = allowNeutral ? [1, 2, 3, 4, 5] : [1, 2, 3, 4];
  const out: Tone[][] = [];
  const key = (t: Tone[]) => t.join('');
  const seen = new Set([key(answer)]);
  for (let guard = 0; out.length < 3 && guard < 200; guard++) {
    const t = [...answer];
    const i = Math.floor(rng() * t.length);
    t[i] = pool[Math.floor(rng() * pool.length)] as Tone;
    // A veces cambiar las dos sílabas.
    if (t.length > 1 && rng() < 0.3) t[1 - i] = pool[Math.floor(rng() * pool.length)] as Tone;
    // El neutro nunca va en la primera sílaba.
    if (t[0] === 5) continue;
    if (!seen.has(key(t))) {
      seen.add(key(t));
      out.push(t);
    }
  }
  return out;
}

export function candidates(level: ToneLevel, vocab: VocabItem[]): VocabItem[] {
  return vocab.filter((v) => {
    const chars = [...v.hanzi];
    if (chars.length !== v.tones.length) return false;
    const spoken = applySandhi(chars, v.tones as Tone[]);
    if (level === 1) return chars.length === 1 && v.tones[0] !== 5 && !AMBIGUOUS.has(v.hanzi);
    if (chars.length !== 2) return false;
    const special = spoken.includes(5) || !same(spoken, v.tones as Tone[]);
    return level === 2 ? !special : special;
  });
}

export function buildRound(level: ToneLevel, vocab: VocabItem[], rng: Rng, n = 10): ToneQuestion[] {
  return sample(candidates(level, vocab), n, rng).map((v) => {
    const written = v.tones as Tone[];
    const spoken = applySandhi([...v.hanzi], written);
    const options = shuffle([spoken, ...distractors(spoken, level === 3, rng)], rng);
    return {
      hanzi: v.hanzi, pinyin: v.pinyin, meaning: v.meaning, spoken, written,
      options, answerIndex: options.findIndex((o) => same(o, spoken)), note: sandhiNote(v, spoken, written),
    };
  });
}

/** Por sílaba: qué tono se esperaba y si se acertó (para las estadísticas de confusión). */
export function syllableResults(q: ToneQuestion, choice: number): { tone: Tone; ok: boolean }[] {
  const chosen = q.options[choice] ?? [];
  return q.spoken.map((tone, i) => ({ tone, ok: chosen[i] === tone }));
}

export interface ToneStats {
  right: number;
  wrong: number;
}

/** Tono con peor porcentaje (con al menos 3 intentos), para el consejo de la pantalla. */
export function weakestTone(stats: Partial<Record<Tone, ToneStats>>): Tone | null {
  let worst: Tone | null = null;
  let worstAcc = 1.01;
  for (const t of [1, 2, 3, 4, 5] as Tone[]) {
    const s = stats[t];
    if (!s || s.right + s.wrong < 3) continue;
    const acc = s.right / (s.right + s.wrong);
    if (acc < worstAcc) {
      worstAcc = acc;
      worst = t;
    }
  }
  return worstAcc < 0.9 ? worst : null;
}

export const TONE_TIPS: Record<Tone, string> = {
  1: 'El 1.º es alto y plano, como cantar una nota larga: mā.',
  2: 'El 2.º sube, como cuando preguntas «¿sí?»: má.',
  3: 'El 3.º baja y vuelve a subir; en la frase suele quedarse abajo: mǎ.',
  4: 'El 4.º cae con fuerza, como una orden: «¡ya!»: mà.',
  5: 'El neutro es corto y suave, sin fuerza: la segunda sílaba de 爸爸 (bàba).',
};
