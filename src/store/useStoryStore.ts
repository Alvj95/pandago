import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface StoryState {
  /** Mejor resultado por historia: preguntas acertadas. */
  done: Record<string, { correct: number; total: number }>;
  finish: (id: string, correct: number, total: number) => void;
}

export const useStoryStore = create<StoryState>()(
  persist(
    (set) => ({
      done: {},
      finish: (id, correct, total) =>
        set((s) => ({ done: { ...s.done, [id]: { correct: Math.max(s.done[id]?.correct ?? 0, correct), total } } })),
    }),
    { name: 'pandago-stories', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
