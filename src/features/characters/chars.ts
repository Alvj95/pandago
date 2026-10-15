/**
 * Caracteres con historia: datos (generados por scripts/course/chars.py) y
 * explicación en español de cómo se forma cada carácter.
 */
import raw from '@/data/chars/chars.json';
import { VOCAB } from '@/data/hsk/course';
import type { VocabItem } from '@/data/hsk/types';

export interface CharPart {
  c: string;
  es?: string;
  py?: string;
}

export interface CharInfo {
  py: string;
  es: string;
  words: string[];
  radical?: string | null;
  kind: 'pictographic' | 'ideographic' | 'pictophonetic' | 'other';
  parts: CharPart[];
  sem?: string;
  semEs?: string;
  pho?: string;
  phoPy?: string;
  story?: string;
}

export const CHARS = raw as Record<string, CharInfo>;
export const CHAR_LIST = Object.keys(CHARS);

export const KIND_LABEL: Record<CharInfo['kind'], { title: string; desc: string }> = {
  pictographic: { title: 'Pictograma', desc: 'Es un dibujo simplificado de lo que significa.' },
  ideographic: { title: 'Ideograma', desc: 'Junta varias ideas para formar una nueva.' },
  pictophonetic: { title: 'Significado + sonido', desc: 'Una parte da la pista del significado y otra la del sonido. ¡Así son 8 de cada 10 caracteres!' },
  other: { title: 'Carácter', desc: 'Se forma con estas partes.' },
};

/** Explicación de cómo recordarlo: la historia si existe; si no, una a partir de sus partes. */
export function explain(ch: string, info: CharInfo): { story: string | null; sound: string | null } {
  const sound =
    info.kind === 'pictophonetic' && info.pho && info.phoPy
      ? `${info.sem ?? ''}${info.semEs ? ` (${info.semEs})` : ''} da la pista del significado y ${info.pho} (${info.phoPy}) la del sonido: ${ch} se lee ${info.py}.`
      : null;
  const fromParts = info.parts.length > 1 ? `Se forma con ${info.parts.map((p) => (p.es ? `${p.c} (${p.es})` : p.c)).join(' + ')}.` : null;
  return { story: info.story ?? (sound ? null : fromParts), sound };
}

/** Significado del carácter: el suyo propio, o el de las palabras del curso que lo llevan. */
export function meaningOf(info: CharInfo): string {
  if (info.es) return info.es;
  const words = info.words.map((id) => VOCAB.find((v) => v.id === id)).filter((v): v is VocabItem => !!v);
  return words.length ? `aparece en ${words.map((w) => `${w.hanzi} (${w.meaning})`).join(', ')}` : '';
}

/** Otros caracteres del curso con el mismo radical (la «familia»). */
export function familyOf(ch: string, limit = 10): string[] {
  const r = CHARS[ch]?.radical;
  if (!r) return [];
  return CHAR_LIST.filter((c) => c !== ch && CHARS[c]?.radical === r).slice(0, limit);
}

/** Palabras del curso que contienen el carácter. */
export const wordsWith = (ch: string) => VOCAB.filter((v) => v.hanzi.includes(ch));
