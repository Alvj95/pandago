/**
 * Búsqueda del diccionario: en español (sin tildes), en pinyin (con o sin
 * tonos, con o sin espacios, también «ni3 hao3») o en caracteres.
 */
import type { VocabItem } from '@/data/hsk/types';

const strip = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** Pinyin a forma comparable: sin tonos, espacios ni apóstrofos; ü y v → u (se puede escribir «nuer» o «nver»). Quita números de tono (ni3hao3). */
export const plainPinyin = (s: string) => strip(s).replace(/v/g, 'u').replace(/[\s'’·\-0-9]/g, '');

const HAN = /\p{Script=Han}/u;

export interface Hit {
  item: VocabItem;
  /** Menor = mejor. */
  rank: number;
}

export function searchVocab(query: string, vocab: VocabItem[], limit = 40): VocabItem[] {
  const q = query.trim();
  if (!q) return [];
  const hits: Hit[] = [];
  if (HAN.test(q)) {
    for (const item of vocab) {
      if (item.hanzi === q) hits.push({ item, rank: 0 });
      else if (item.hanzi.startsWith(q)) hits.push({ item, rank: 1 });
      else if (item.hanzi.includes(q) || [...q].some((ch) => item.hanzi.includes(ch))) hits.push({ item, rank: 2 + item.hanzi.length });
    }
  } else {
    const es = strip(q);
    const py = plainPinyin(q);
    for (const item of vocab) {
      const ip = plainPinyin(item.pinyin);
      const words = strip(item.meaning).split(/[^a-zñ]+/).filter(Boolean);
      const meaning = strip(item.meaning);
      let rank = Infinity;
      if (py && ip === py) rank = 0;
      else if (words.includes(es)) rank = 1;
      else if (py.length >= 2 && ip.startsWith(py)) rank = 2;
      else if (es.length >= 3 && words.some((w) => w.startsWith(es))) rank = 3;
      else if (es.length >= 3 && meaning.includes(es)) rank = 4;
      if (rank < Infinity) hits.push({ item, rank: rank * 10 + item.level });
    }
  }
  return hits.sort((a, b) => a.rank - b.rank).slice(0, limit).map((h) => h.item);
}
