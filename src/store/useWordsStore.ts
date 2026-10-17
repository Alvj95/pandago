import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { type CardState, type Grade, newCard, review } from '@/features/dictionary/cards';

/** Palabra guardada que no está en el curso (desde Bao Asistente o el chat). */
export interface CustomWord {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
}

export const customId = (hanzi: string) => `x-${hanzi}`;

interface WordsState {
  /** Palabras guardadas con ⭐ y su estado de repaso. */
  cards: Record<string, CardState>;
  /** Datos de las palabras guardadas que no son del curso (id «x-汉字»). */
  custom: Record<string, CustomWord>;
  toggle: (id: string, now?: number) => void;
  /** Guarda (o quita) una palabra que no está en el curso. */
  toggleCustom: (w: Omit<CustomWord, 'id'>, now?: number) => void;
  grade: (id: string, grade: Grade, now?: number) => void;
}

export const useWordsStore = create<WordsState>()(
  persist(
    (set) => ({
      cards: {},
      custom: {},
      toggleCustom: (w, now = Date.now()) =>
        set((s) => {
          const id = customId(w.hanzi);
          const cards = { ...s.cards };
          const custom = { ...s.custom };
          if (cards[id]) {
            delete cards[id];
            delete custom[id];
          } else {
            cards[id] = newCard(now);
            custom[id] = { id, ...w };
          }
          return { cards, custom };
        }),
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
