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
  /** natural = voz de Bao generada en el servidor (necesita internet); device = voz del móvil. */
  voiceStyle: 'natural' | 'device';
  /** Bao habla más despacio en toda la app. */
  slowVoice: boolean;
  setTheme: (t: ThemePreference) => void;
  setHaptics: (on: boolean) => void;
  setVoice: (on: boolean) => void;
  setReduceMotion: (on: boolean) => void;
  setVoiceStyle: (style: 'natural' | 'device') => void;
  setSlowVoice: (on: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      haptics: true,
      voice: true,
      reduceMotion: false,
      voiceStyle: 'natural',
      slowVoice: false,
      setTheme: (theme) => set({ theme }),
      setHaptics: (haptics) => set({ haptics }),
      setVoice: (voice) => set({ voice }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      setVoiceStyle: (voiceStyle) => set({ voiceStyle }),
      setSlowVoice: (slowVoice) => set({ slowVoice }),
    }),
    { name: 'pandago-settings', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
