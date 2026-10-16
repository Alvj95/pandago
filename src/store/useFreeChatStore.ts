import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type HelpLevel = 'full' | 'balanced' | 'chinese';

export type FreeMessage =
  | { id: string; from: 'user'; text: string; fix?: { corrected: string; explanation: string } }
  | { id: string; from: 'bao'; hanzi: string; pinyin: string; translation: string; note?: string | null }
  | { id: string; from: 'system'; text: string };

interface FreeChatState {
  messages: FreeMessage[];
  /** Datos que Bao recuerda del estudiante. */
  memory: string[];
  help: HelpLevel;
  corrections: boolean;
  remember: boolean;
  add: (m: FreeMessage) => void;
  update: (id: string, patch: Partial<FreeMessage>) => void;
  addMemory: (fact: string) => void;
  setHelp: (h: HelpLevel) => void;
  setCorrections: (on: boolean) => void;
  setRemember: (on: boolean) => void;
  clear: () => void;
}

let seq = 0;
export const msgId = () => `f${Date.now().toString(36)}${(seq++).toString(36)}`;

export const useFreeChatStore = create<FreeChatState>()(
  persist(
    (set) => ({
      messages: [],
      memory: [],
      help: 'balanced',
      corrections: true,
      remember: true,
      add: (m) => set((s) => ({ messages: [...s.messages, m].slice(-150) })),
      update: (id, patch) => set((s) => ({ messages: s.messages.map((m) => (m.id === id ? ({ ...m, ...patch } as FreeMessage) : m)) })),
      addMemory: (fact) => set((s) => ({ memory: [...s.memory.filter((f) => f !== fact), fact].slice(-10) })),
      setHelp: (help) => set({ help }),
      setCorrections: (corrections) => set({ corrections }),
      setRemember: (remember) => set({ remember }),
      clear: () => set({ messages: [], memory: [] }),
    }),
    { name: 'pandago-free-chat', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
