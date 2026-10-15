import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { bump, dayKey, type QuestEvent, weekKey } from '@/features/quests/quests';

type Counts = Partial<Record<QuestEvent, number>>;

interface QuestState {
  day: string;
  today: Counts;
  week: string;
  thisWeek: Counts;
  lifetime: Counts;
  /** Misiones (y bonus) ya cobradas hoy / esta semana. */
  claimed: string[];
  weekClaimed: boolean;
  track: (event: QuestEvent, amount?: number, now?: number) => void;
  /** Marca una misión como cobrada; devuelve false si ya lo estaba. */
  claim: (id: string, now?: number) => boolean;
  claimWeekly: (now?: number) => boolean;
  /** Reinicia los contadores si cambió el día o la semana (llamar al leer). */
  roll: (now?: number) => void;
}

function rolled(s: QuestState, now: number): Partial<QuestState> {
  const patch: Partial<QuestState> = {};
  const day = dayKey(now);
  const week = weekKey(now);
  if (s.day !== day) Object.assign(patch, { day, today: {}, claimed: [] });
  if (s.week !== week) Object.assign(patch, { week, thisWeek: {}, weekClaimed: false });
  return patch;
}

export const useQuestStore = create<QuestState>()(
  persist(
    (set, get) => ({
      day: '',
      today: {},
      week: '',
      thisWeek: {},
      lifetime: {},
      claimed: [],
      weekClaimed: false,

      track: (event, amount = 1, now = Date.now()) =>
        set((s) => {
          const base = { ...s, ...rolled(s, now) };
          return {
            ...rolled(s, now),
            today: bump(base.today, event, amount),
            thisWeek: bump(base.thisWeek, event, amount),
            lifetime: bump(base.lifetime, event, amount),
          };
        }),

      claim: (id, now = Date.now()) => {
        get().roll(now);
        if (get().claimed.includes(id)) return false;
        set((s) => ({ claimed: [...s.claimed, id] }));
        return true;
      },

      claimWeekly: (now = Date.now()) => {
        get().roll(now);
        if (get().weekClaimed) return false;
        set({ weekClaimed: true });
        return true;
      },

      roll: (now = Date.now()) => {
        const patch = rolled(get(), now);
        if (Object.keys(patch).length) set(patch);
      },
    }),
    { name: 'pandago-quests', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

/** Atajo para registrar eventos desde cualquier sitio (fuera de React también). */
export const trackQuest = (event: QuestEvent, amount = 1) => useQuestStore.getState().track(event, amount);
