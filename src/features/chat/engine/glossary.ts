import type { VocabItem } from '@/data/hsk/types';

type Entry = Pick<VocabItem, 'hanzi' | 'pinyin' | 'meaning'>;

export interface Gloss {
  hanzi: string;
  /** Palabra del vocabulario, si se reconoce. */
  word?: Entry;
}

/** Palabras frecuentes fuera de HSK 1-2 que aparecen en el chat y las frases del curso. */
export const EXTRA_GLOSSARY: Entry[] = [
  { hanzi: '练习', pinyin: 'liànxí', meaning: 'practicar' },
  { hanzi: '说', pinyin: 'shuō', meaning: 'hablar, decir' },
  { hanzi: '一下', pinyin: 'yíxià', meaning: 'un momento, un poco (suaviza el verbo)' },
  { hanzi: '一点儿', pinyin: 'yìdiǎnr', meaning: 'un poco' },
  { hanzi: '难', pinyin: 'nán', meaning: 'difícil' },
  { hanzi: '等', pinyin: 'děng', meaning: 'esperar' },
  { hanzi: '对', pinyin: 'duì', meaning: 'correcto; para, hacia' },
  { hanzi: '上课', pinyin: 'shàngkè', meaning: 'ir a clase, dar clase' },
  { hanzi: '王', pinyin: 'Wáng', meaning: 'Wang (apellido)' },
  { hanzi: '足球', pinyin: 'zúqiú', meaning: 'fútbol' },
  { hanzi: '重要', pinyin: 'zhòngyào', meaning: 'importante' },
  { hanzi: '骑', pinyin: 'qí', meaning: 'montar (bici, caballo)' },
  { hanzi: '条', pinyin: 'tiáo', meaning: '(clasificador de cosas largas: calles, ríos)' },
  { hanzi: '杯', pinyin: 'bēi', meaning: 'vaso, taza (clasificador de bebidas)' },
  { hanzi: '天', pinyin: 'tiān', meaning: 'día; cielo' },
  { hanzi: '前', pinyin: 'qián', meaning: 'delante, adelante' },
  { hanzi: '你们', pinyin: 'nǐmen', meaning: 'vosotros' },
  { hanzi: '他们', pinyin: 'tāmen', meaning: 'ellos' },
  { hanzi: '这里', pinyin: 'zhèlǐ', meaning: 'aquí' },
  { hanzi: '那里', pinyin: 'nàlǐ', meaning: 'allí' },
  { hanzi: '哪里', pinyin: 'nǎlǐ', meaning: '¿dónde?' },
  { hanzi: '为什么', pinyin: 'wèishénme', meaning: '¿por qué?' },
  { hanzi: '真棒', pinyin: 'zhēn bàng', meaning: '¡genial!' },
  { hanzi: '太棒了', pinyin: 'tài bàng le', meaning: '¡genial!, ¡estupendo!' },
  { hanzi: '加油', pinyin: 'jiāyóu', meaning: '¡ánimo!' },
  { hanzi: '没问题', pinyin: 'méi wèntí', meaning: 'no hay problema' },
  { hanzi: '一样', pinyin: 'yíyàng', meaning: 'igual' },
];

const HAN = /\p{Script=Han}/u;

/**
 * Desglose «palabra por palabra» de una frase en hanzi: segmentación por la
 * palabra más larga del vocabulario (máx. 4 caracteres). Lo que no es hanzi
 * (puntuación, letras) se ignora.
 */
export function glossSentence(hanzi: string, vocab: Entry[]): Gloss[] {
  const byHanzi = new Map<string, Entry>([...EXTRA_GLOSSARY, ...vocab].map((v) => [v.hanzi, v]));
  const chars = [...hanzi];
  const out: Gloss[] = [];
  for (let i = 0; i < chars.length; ) {
    if (!HAN.test(chars[i]!)) {
      i++;
      continue;
    }
    let len = Math.min(4, chars.length - i);
    for (; len > 1; len--) if (byHanzi.has(chars.slice(i, i + len).join(''))) break;
    const piece = chars.slice(i, i + len).join('');
    out.push({ hanzi: piece, word: byHanzi.get(piece) });
    i += len;
  }
  return out;
}
