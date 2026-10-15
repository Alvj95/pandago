import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { type CardState, type Grade, newCard, review } from '@/features/dictionary/cards';

interface WordsState {
  /** Palabras guardadas con ⭐ y su estado de repaso. */
  cards: Record<string, CardState>;
  toggle: (id: string, now?: number) => void;
  grade: (id: string, grade: Grade, now?: number) => void;
}

export const useWordsStore = create<WordsState>()(
  persist(
    (set) => ({
      cards: {},
      toggle: (id, now = Date.now()) =>
        set((s) => {
          const cards = { ...s.cards };
          if (cards[id]) delete cards[id];
          else cards[id] = newCard(now);
          return { cards };
        }),
      grade: (id, g, now = Date.now()) =>
        set((s) => (s.cards[id] ? { cards: { ...s.cards, [id]: review(s.cards[id], g, now) } } : s)),
    }),
    { name: 'pandago-words', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
