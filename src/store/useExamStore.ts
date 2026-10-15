import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface ExamState {
  /** Mejor nota (sobre 200) por tipo de examen. */
  best: Record<string, number>;
  record: (key: string, total: number) => void;
}

export const useExamStore = create<ExamState>()(
  persist(
    (set) => ({
      best: {},
      record: (key, total) => set((s) => ({ best: { ...s.best, [key]: Math.max(s.best[key] ?? 0, total) } })),
    }),
    { name: 'pandago-exams', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
