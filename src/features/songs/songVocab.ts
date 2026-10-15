/**
 * Vocabulario del curso que aparece en la letra y reto de "completa la letra".
 */
import type { VocabItem } from '@/data/hsk/types';
import type { Song, SongLine } from '@/data/songs';
import { sample, shuffle, type Rng } from '@/features/lesson/engine/random';

const lineText = (l: SongLine) => l.syllables.map((s) => s.hanzi).join('');

/** Palabras del curso dentro de un texto, eligiendo siempre la más larga (你好 antes que 你). */
export function wordsIn(text: string, vocab: VocabItem[]): VocabItem[] {
  const byHanzi = new Map(vocab.map((v) => [v.hanzi, v]));
  const maxLen = Math.max(...vocab.map((v) => v.hanzi.length));
  const out: VocabItem[] = [];
  for (let i = 0; i < text.length; ) {
    let found: VocabItem | undefined;
    for (let n = Math.min(maxLen, text.length - i); n >= 1 && !found; n--) found = byHanzi.get(text.slice(i, i + n));
    if (found) {
      out.push(found);
      i += found.hanzi.length;
    } else i += 1;
  }
  return out;
}

export function songVocab(song: Song, vocab: VocabItem[]): VocabItem[] {
  const seen = new Map<string, VocabItem>();
  for (const l of song.lines) for (const w of wordsIn(lineText(l), vocab)) seen.set(w.id, w);
  return [...seen.values()];
}

export interface LyricGap {
  line: SongLine;
  /** Letra con la palabra sustituida por ___ */
  template: string;
  answer: VocabItem;
  options: string[];
}

/** Reto: completar huecos de la letra (líneas distintas, palabras del curso). */
export function buildLyricQuiz(song: Song, vocab: VocabItem[], rng: Rng, count = 5): LyricGap[] {
  // Candidatos: cada palabra del curso de cada línea distinta (las canciones repiten estrofas).
  const uniqueLines = song.lines.filter((l, i, all) => all.findIndex((x) => lineText(x) === lineText(l)) === i);
  const candidates = uniqueLines.flatMap((line) => {
    const text = lineText(line);
    return wordsIn(text, vocab)
      .filter((w, i, all) => all.findIndex((x) => x.id === w.id) === i)
      .map((answer) => ({ line, text, answer }));
  });
  // Primero una palabra por línea (variedad) y luego el resto.
  const firstPerLine = shuffle(uniqueLines, rng).flatMap((l) => shuffle(candidates.filter((c) => c.line === l), rng).slice(0, 1));
  const rest = shuffle(candidates.filter((c) => !firstPerLine.includes(c)), rng);
  return [...firstPerLine, ...rest].slice(0, count).map(({ line, text, answer }) => {
    const others = sample(
      vocab.filter((v) => v.hanzi !== answer.hanzi && v.hanzi.length === answer.hanzi.length && v.level <= Math.max(answer.level, 1) && !text.includes(v.hanzi)),
      2,
      rng,
    );
    // Todas las apariciones (las canciones repiten): si no, la respuesta se vería en la misma línea.
    const template = text.split(answer.hanzi).join('___');
    return { line, template, answer, options: shuffle([answer.hanzi, ...others.map((o) => o.hanzi)], rng) };
  });
}

/** Estrellas del reto según aciertos. */
export const starsFor = (correct: number, total: number) => (total === 0 ? 0 : correct === total ? 3 : correct / total >= 0.6 ? 2 : correct > 0 ? 1 : 0);
