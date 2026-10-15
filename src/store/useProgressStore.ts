import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { HskLevel, LessonNode } from '@/data/hsk/types';
import { MAX_FREEZES, type ChestReward } from '@/features/rewards/chest';
import { MAX_CHALLENGE_HEARTS_PER_DAY } from '@/features/challenges/engine';
import { trackQuest } from './useQuestStore';
import { DOUBLE_XP_MS } from '@/features/shop/items';
import type { League } from '@/features/leagues/leaderboard';

export const MAX_HEARTS = 5;
const HEART_REGEN_MS = 30 * 60 * 1000; // 1 vida cada 30 min
const DAY_MS = 24 * 60 * 60 * 1000;


export interface ProgressState {
  hskLevel: HskLevel;
  xpTotal: number;
  xpToday: number;
  dailyGoalXp: number;
  streakDays: number;
  streakFreezes: number;
  lastActiveDay: string | null; // "2026-10-14" (zona local)
  hearts: number;
  heartsUpdatedAt: number;
  gems: number;
  league: League;
  leagueWeeklyXp: number;
  completedNodeIds: string[];
  /** Cofres ganados pendientes de abrir. */
  pendingChests: number;
  /** Vidas ganadas hoy con retos (máx. MAX_CHALLENGE_HEARTS_PER_DAY). */
  challengeHearts: { day: string; count: number };
  /** Hasta cuándo dura el «Doble XP» comprado en la tienda (ms). */
  doubleXpUntil: number;

  awardXp: (amount: number) => void;
  setDailyGoal: (xp: number) => void;
  loseHeart: () => void;
  refillHearts: () => void;
  /** Devuelve false si no hay gemas suficientes. */
  spendGems: (amount: number) => boolean;
  completeNode: (node: LessonNode) => void;
  /** Abre un cofre pendiente (p.ej. el de la meta diaria); devuelve false si no hay. */
  consumePendingChest: () => boolean;
  claimReward: (reward: ChestReward) => void;
  earnGems: (amount: number) => void;
  /** Suma un cofre pendiente de abrir (premio de misiones). */
  addPendingChest: () => void;
  /** Vidas que aún se pueden ganar hoy con retos. */
  challengeHeartsLeft: (now?: number) => number;
  /** Suma 1 vida por reto superado si quedan hoy y no estás al máximo; devuelve si se sumó. */
  winChallengeHeart: (now?: number) => boolean;
  /** Compra una ayuda de la tienda; false si no hay gemas o no tiene sentido ahora. */
  buyHelper: (id: 'freeze' | 'refill' | 'double-xp', price: number, now?: number) => boolean;
  /** Llamar al abrir la app: regenera vidas y rompe/conserva la racha. */
  tick: (now?: number) => void;
}

const dayKey = (t: number) => new Date(t).toLocaleDateString('sv-SE'); // YYYY-MM-DD local

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      hskLevel: 1,
      xpTotal: 0,
      xpToday: 0,
      dailyGoalXp: 30,
      streakDays: 0,
      streakFreezes: 1,
      lastActiveDay: null,
      hearts: MAX_HEARTS,
      heartsUpdatedAt: Date.now(),
      gems: 100,
      league: 'Bambú',
      leagueWeeklyXp: 0,
      completedNodeIds: [],
      pendingChests: 0,
      challengeHearts: { day: '', count: 0 },
      doubleXpUntil: 0,

      awardXp: (base) => {
        const today = dayKey(Date.now());
        const s = get();
        const amount = Date.now() < s.doubleXpUntil ? base * 2 : base;
        const firstActivityToday = s.lastActiveDay !== today;
        const before = firstActivityToday ? 0 : s.xpToday;
        // Cumplir la meta diaria por primera vez hoy regala un cofre.
        const reachedGoal = before < s.dailyGoalXp && before + amount >= s.dailyGoalXp;
        set({
          pendingChests: s.pendingChests + (reachedGoal ? 1 : 0),
          xpTotal: s.xpTotal + amount,
          xpToday: (firstActivityToday ? 0 : s.xpToday) + amount,
          leagueWeeklyXp: s.leagueWeeklyXp + amount,
          // La racha cuenta el primer día con actividad; `tick` ya decidió si continúa o se rompió.
          streakDays: firstActivityToday ? s.streakDays + 1 : s.streakDays,
          lastActiveDay: today,
        });
        trackQuest('xp', amount);
        trackQuest('streak', get().streakDays);
      },

      setDailyGoal: (xp) => set({ dailyGoalXp: xp }),

      loseHeart: () => set((s) => ({ hearts: Math.max(0, s.hearts - 1), heartsUpdatedAt: s.hearts === MAX_HEARTS ? Date.now() : s.heartsUpdatedAt })),

      refillHearts: () => set({ hearts: MAX_HEARTS, heartsUpdatedAt: Date.now() }),

      spendGems: (amount) => {
        if (get().gems < amount) return false;
        set((s) => ({ gems: s.gems - amount }));
        return true;
      },

      completeNode: (node) =>
        set((s) => {
          if (s.completedNodeIds.includes(node.id)) return s;
          return { completedNodeIds: [...s.completedNodeIds, node.id] };
        }),

      consumePendingChest: () => {
        if (get().pendingChests === 0) return false;
        set((s) => ({ pendingChests: s.pendingChests - 1 }));
        return true;
      },

      claimReward: (reward) =>
        set((s) => ({
          gems: s.gems + reward.gems,
          streakFreezes: Math.min(MAX_FREEZES, s.streakFreezes + (reward.freeze ? 1 : 0)),
        })),

      earnGems: (amount) => set((s) => ({ gems: s.gems + amount })),

      buyHelper: (id, price, now = Date.now()) => {
        const s = get();
        if (id === 'freeze' && s.streakFreezes >= MAX_FREEZES) return false;
        if (id === 'refill' && s.hearts >= MAX_HEARTS) return false;
        if (id === 'double-xp' && now < s.doubleXpUntil) return false;
        if (!s.spendGems(price)) return false;
        if (id === 'freeze') set({ streakFreezes: s.streakFreezes + 1 });
        if (id === 'refill') set({ hearts: MAX_HEARTS, heartsUpdatedAt: now });
        if (id === 'double-xp') set({ doubleXpUntil: now + DOUBLE_XP_MS });
        return true;
      },

      addPendingChest: () => set((s) => ({ pendingChests: s.pendingChests + 1 })),

      challengeHeartsLeft: (now = Date.now()) => {
        const { day, count } = get().challengeHearts;
        return MAX_CHALLENGE_HEARTS_PER_DAY - (day === dayKey(now) ? count : 0);
      },

      winChallengeHeart: (now = Date.now()) => {
        const s = get();
        if (s.hearts >= MAX_HEARTS || s.challengeHeartsLeft(now) <= 0) return false;
        const today = dayKey(now);
        const used = s.challengeHearts.day === today ? s.challengeHearts.count : 0;
        set({ hearts: s.hearts + 1, challengeHearts: { day: today, count: used + 1 } });
        return true;
      },

      tick: (now = Date.now()) => {
        const s = get();
        const patch: Partial<ProgressState> = {};

        if (s.hearts < MAX_HEARTS) {
          const regenerated = Math.floor((now - s.heartsUpdatedAt) / HEART_REGEN_MS);
          if (regenerated > 0) {
            patch.hearts = Math.min(MAX_HEARTS, s.hearts + regenerated);
            patch.heartsUpdatedAt = s.heartsUpdatedAt + regenerated * HEART_REGEN_MS;
          }
        }

        if (s.lastActiveDay) {
          const today = dayKey(now);
          if (s.lastActiveDay !== today) {
            patch.xpToday = 0;
            const missedDays = Math.round((Date.parse(today) - Date.parse(s.lastActiveDay)) / DAY_MS) - 1;
            if (missedDays > 0) {
              if (missedDays <= s.streakFreezes) {
                patch.streakFreezes = s.streakFreezes - missedDays;
                // Marcamos ayer como activo para que la racha continúe hoy.
                patch.lastActiveDay = dayKey(now - DAY_MS);
              } else {
                patch.streakDays = 0;
              }
            }
          }
        }

        if (Object.keys(patch).length) set(patch);
      },
    }),
    { name: 'pandago-progress', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
