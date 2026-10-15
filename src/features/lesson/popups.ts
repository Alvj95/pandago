/**
 * Bao aparece mientras estudias: decide cuándo sale y qué dice (lógica pura).
 * Como mucho 2 veces por lección y nunca en dos ejercicios seguidos.
 */
import type { GrammarNote } from '@/data/hsk/types';

export interface PopupLine {
  kind: 'praise' | 'encourage' | 'half' | 'tip';
  hanzi: string;
  pinyin: string;
  text: string;
}

export interface PopupMemory {
  shown: number;
  lastIndex: number;
  half: boolean;
  tip: boolean;
  wrongStreak: number;
}

export const MAX_POPUPS = 2;
export const freshMemory = (): PopupMemory => ({ shown: 0, lastIndex: -9, half: false, tip: false, wrongStreak: 0 });

const PRAISE = [
  { hanzi: '你真棒！', pinyin: 'nǐ zhēn bàng', text: '¡Eres genial!' },
  { hanzi: '太好了！', pinyin: 'tài hǎo le', text: '¡Genial!' },
  { hanzi: '很好！', pinyin: 'hěn hǎo', text: '¡Muy bien!' },
  { hanzi: '厉害！', pinyin: 'lìhai', text: '¡Qué crack!' },
];
const ENCOURAGE = [
  { hanzi: '慢慢来。', pinyin: 'màn man lái', text: 'Poco a poco. Equivocarse es aprender 💚' },
  { hanzi: '没关系！', pinyin: 'méi guānxi', text: '¡No pasa nada! Lo repasamos al final.' },
  { hanzi: '加油！', pinyin: 'jiāyóu', text: '¡Ánimo, tú puedes!' },
  { hanzi: '别担心。', pinyin: 'bié dānxīn', text: 'No te preocupes, vas mejorando.' },
];

/** Consejo de la unidad a partir de su gramática: «💡 Sujeto + 很 + Adjetivo» y la primera frase. */
export function tipFrom(note: GrammarNote | undefined): PopupLine | null {
  if (!note) return null;
  const ex = note.examples[0];
  const first = note.body.split(/(?<=[.!?])\s/)[0] ?? note.body;
  return { kind: 'tip', hanzi: ex?.hanzi ?? note.pattern, pinyin: ex?.pinyin ?? '', text: `💡 ${note.pattern}: ${first}` };
}

export interface PopupInput {
  correct: boolean;
  combo: number;
  /** Índice del ejercicio recién respondido y total de la cola. */
  index: number;
  total: number;
  tip: PopupLine | null;
  rng: () => number;
}

/** Tras cada respuesta: la frase que dice Bao (o null) y la memoria actualizada. */
export function nextPopup(mem: PopupMemory, input: PopupInput): { line: PopupLine | null; mem: PopupMemory } {
  const wrongStreak = input.correct ? 0 : mem.wrongStreak + 1;
  const m = { ...mem, wrongStreak };
  if (m.shown >= MAX_POPUPS || input.index - m.lastIndex < 2) return { line: null, mem: m };
  const pick = <T,>(list: T[]) => list[Math.floor(input.rng() * list.length) % list.length]!;
  let line: PopupLine | null = null;
  if (!input.correct && wrongStreak >= 2) line = { kind: 'encourage', ...pick(ENCOURAGE) };
  else if (input.correct && (input.combo === 3 || input.combo === 5)) {
    const p = pick(PRAISE);
    line = { kind: 'praise', ...p, text: `${p.text} ${input.combo} seguidas 🔥` };
  } else if (!m.half && input.total >= 6 && input.index + 1 >= Math.ceil(input.total / 2)) {
    line = { kind: 'half', hanzi: '一半了！', pinyin: 'yíbàn le', text: '¡Ya vas por la mitad! 加油！' };
    m.half = true;
  } else if (!m.tip && input.tip && input.index >= 2 && input.rng() < 0.35) {
    line = input.tip;
    m.tip = true;
  }
  if (!line) return { line: null, mem: m };
  return { line, mem: { ...m, shown: m.shown + 1, lastIndex: input.index, ...(line.kind === 'half' ? { half: true } : {}) } };
}
