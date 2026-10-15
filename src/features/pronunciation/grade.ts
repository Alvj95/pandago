/**
 * Semáforo de pronunciación: convierte lo que entendió el reconocedor de voz en
 * un color por sílaba. Lógica pura (se prueba sin micrófono).
 */
import { syllablesOf, type Tone } from '@/lib/pinyin';
import type { PronunciationResult } from '@/features/chat/engine/aiClient';

export type Light = 'green' | 'yellow' | 'red';

export interface GradedSyllable {
  hanzi: string;
  pinyin: string;
  tone: Tone;
  light: Light;
  /** Lo que oyó el reconocedor en ese lugar (si oyó otra cosa). */
  heard?: string;
}

const HAN = /\p{Script=Han}/u;
const VALUE: Record<Light, number> = { green: 1, yellow: 0.5, red: 0 };

export const TONE_SHAPES: Record<Tone, string> = {
  1: 'alto y plano, como cantando una nota',
  2: 'sube, como cuando preguntas «¿eh?»',
  3: 'baja y vuelve a subir un poco',
  4: 'cae fuerte de arriba abajo, como un «¡no!» seco',
  5: 'corto y suave, sin fuerza',
};

/** Color de cada sílaba de `hanzi` según el resultado del servidor. */
export function gradeSyllables(hanzi: string, pinyin: string, result: PronunciationResult): GradedSyllable[] {
  const chars = [...hanzi].filter((ch) => HAN.test(ch));
  const syl = syllablesOf(pinyin);
  return chars.map((ch, i) => {
    const r = result.syllables[i];
    // Servidores antiguos no envían `match`: se usa la calidad (gop).
    const match = r?.match ?? (r && r.gop >= 0.5 ? 'ok' : 'miss');
    const light: Light = match === 'ok' ? 'green' : match === 'tone' ? 'yellow' : 'red';
    return {
      hanzi: ch,
      pinyin: syl[i]?.text ?? '',
      tone: syl[i]?.tone ?? 5,
      light,
      ...(r?.heard && r.heard !== ch ? { heard: r.heard } : {}),
    };
  });
}

/** Nota de 0 a 1: verde cuenta entero, amarillo medio. */
export const gradeScore = (g: GradedSyllable[]) => (g.length ? g.reduce((a, s) => a + VALUE[s.light], 0) / g.length : 0);

export const starsFor = (score: number) => (score >= 0.85 ? 3 : score >= 0.6 ? 2 : score >= 0.3 ? 1 : 0);

/** Consejos de Bao: el primer tono cambiado y la primera sílaba que no se oyó. */
export function gradeTips(g: GradedSyllable[]): { light: Light; text: string; tone?: Tone }[] {
  const tips: { light: Light; text: string; tone?: Tone }[] = [];
  const y = g.find((s) => s.light === 'yellow');
  if (y) tips.push({ light: 'yellow', tone: y.tone, text: `${y.hanzi} ${y.pinyin} es ${y.tone === 5 ? 'tono neutro' : `${y.tone}.º tono`}: ${TONE_SHAPES[y.tone]}.` });
  const r = g.find((s) => s.light === 'red');
  if (r) tips.push({ light: 'red', text: `${r.hanzi} ${r.pinyin} no se oyó bien${r.heard ? ` (sonó a ${r.heard})` : ''}. Prueba más despacio y vocaliza.` });
  return tips;
}

/** «🟢你 🟢好 🟡叫 🔴宝» para enseñarlo en el chat. */
export const lightsLine = (g: GradedSyllable[]) => g.map((s) => `${s.light === 'green' ? '🟢' : s.light === 'yellow' ? '🟡' : '🔴'}${s.hanzi}`).join(' ');
