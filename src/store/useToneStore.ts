import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Tone } from '@/features/chat/engine/tones';
import type { ToneLevel, ToneStats } from '@/features/tones/trainer';

interface ToneState {
  /** Aciertos/fallos por tono (por sílaba), para saber cuál se confunde más. */
  stats: Partial<Record<Tone, ToneStats>>;
  /** Mejor resultado (sobre 10) por nivel. */
  best: Partial<Record<ToneLevel, number>>;
  recordSyllables: (results: { tone: Tone; ok: boolean }[]) => void;
  finishRound: (level: ToneLevel, score: number) => void;
}

export const useToneStore = create<ToneState>()(
  persist(
    (set) => ({
      stats: {},
      best: {},
      recordSyllables: (results) =>
        set((s) => {
          const stats = { ...s.stats };
          for (const { tone, ok } of results) {
            const prev = stats[tone] ?? { right: 0, wrong: 0 };
            stats[tone] = { right: prev.right + (ok ? 1 : 0), wrong: prev.wrong + (ok ? 0 : 1) };
          }
          return { stats };
        }),
      finishRound: (level, score) => set((s) => ({ best: { ...s.best, [level]: Math.max(s.best[level] ?? 0, score) } })),
    }),
    { name: 'pandago-tones', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
