import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemePreference = 'system' | 'light' | 'dark';

interface SettingsState {
  theme: ThemePreference;
  haptics: boolean;
  /** Bao lee en voz alta sus mensajes en chino. */
  voice: boolean;
  setTheme: (t: ThemePreference) => void;
  setHaptics: (on: boolean) => void;
  setVoice: (on: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      haptics: true,
      voice: true,
      setTheme: (theme) => set({ theme }),
      setHaptics: (haptics) => set({ haptics }),
      setVoice: (voice) => set({ voice }),
    }),
    { name: 'pandago-settings', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
