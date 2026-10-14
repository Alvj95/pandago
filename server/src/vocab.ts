import { VOCAB } from '../../src/data/hsk/course.ts';
import type { VocabItem } from '../../src/data/hsk/types.ts';

/** HSK 1-2 desde el curso de la app; para HSK 3-6 conviene una tabla en base de datos. */
const ALL: VocabItem[] = VOCAB;

export function vocabForLevel(level: number): VocabItem[] {
  return ALL.filter((v) => v.level <= level);
}

/** Conjunto de caracteres "conocidos" hasta un nivel, para el guardián de nivel. */
export function charsUpToLevel(level: number): Set<string> {
  return new Set(vocabForLevel(level).flatMap((v) => [...v.hanzi]));
}
