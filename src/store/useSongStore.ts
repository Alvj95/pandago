import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { trackQuest } from './useQuestStore';

interface SongProgress {
  /** Mejor resultado del reto "completa la letra" (0-3). */
  stars: number;
  /** Veces que se ha cantado entera en karaoke. */
  sung: number;
}

interface SongState {
  progress: Record<string, SongProgress>;
  recordQuiz: (songId: string, stars: number) => void;
  recordSung: (songId: string) => void;
}

export const useSongStore = create<SongState>()(
  persist(
    (set) => ({
      progress: {},
      recordQuiz: (songId, stars) =>
        set((s) => {
          const prev = s.progress[songId] ?? { stars: 0, sung: 0 };
          return { progress: { ...s.progress, [songId]: { ...prev, stars: Math.max(prev.stars, stars) } } };
        }),
      recordSung: (songId) => {
        trackQuest('song');
        set((s) => {
          const prev = s.progress[songId] ?? { stars: 0, sung: 0 };
          return { progress: { ...s.progress, [songId]: { ...prev, sung: prev.sung + 1 } } };
        });
      },
    }),
    { name: 'pandago-songs', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
