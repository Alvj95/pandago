/** Datos del widget de Bao (lógica pura): palabra del día y cara de Bao. */
import type { VocabItem } from '@/data/hsk/types';

export type WidgetMood = 'happy' | 'hungry' | 'sleep';

/** Una palabra distinta cada día (de HSK 1-2, la misma para todo el día). */
export function wordOfDay(vocab: VocabItem[], day: number): VocabItem {
  const pool = vocab.filter((v) => v.level <= 2 && [...v.hanzi].length <= 3);
  return pool[((day * 7919) % pool.length + pool.length) % pool.length]!;
}

/** Dormido de noche; con hambre si alguna necesidad está baja; si no, contento. */
export function widgetMood(needs: Record<string, number> | null, hour: number): WidgetMood {
  if (hour >= 23 || hour < 7) return 'sleep';
  if (needs && Object.values(needs).some((v) => v < 45)) return 'hungry';
  return 'happy';
}

/** Enlaces que abren el asistente (ventana transparente de Android). */
export const ASSIST = {
  voice: 'pandago-bao://assistant?voice=1',
  camera: 'pandago-bao://assistant?camera=1',
  write: 'pandago-bao://assistant',
  word: (hanzi: string) => `pandago-bao://assistant?text=${encodeURIComponent(`¿Qué significa ${hanzi} y cómo se usa?`)}`,
};
