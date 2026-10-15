import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemePreference = 'system' | 'light' | 'dark';

interface SettingsState {
  theme: ThemePreference;
  haptics: boolean;
  /** Bao lee en voz alta sus mensajes en chino. */
  voice: boolean;
  /** Bao cambia de cara pero no se mueve (también si el sistema pide reducir movimiento). */
  reduceMotion: boolean;
  setTheme: (t: ThemePreference) => void;
  setHaptics: (on: boolean) => void;
  setVoice: (on: boolean) => void;
  setReduceMotion: (on: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      haptics: true,
      voice: true,
      reduceMotion: false,
      setTheme: (theme) => set({ theme }),
      setHaptics: (haptics) => set({ haptics }),
      setVoice: (voice) => set({ voice }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
    }),
    { name: 'pandago-settings', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
