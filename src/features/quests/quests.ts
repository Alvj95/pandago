/**
 * Misiones diarias, misión semanal y logros. Lógica pura: qué misiones tocan
 * cada día (deterministas por fecha), cuánto falta y qué logros están
 * desbloqueados a partir de contadores.
 */
import { createRng, sample } from '@/features/lesson/engine/random';

/** Cosas que pasan en la app y hacen avanzar misiones y logros. */
export type QuestEvent =
  | 'xp'
  | 'lesson'
  | 'perfect_lesson'
  | 'combo' // racha de aciertos seguidos en una lección (se guarda el máximo)
  | 'boss'
  | 'chat_turn'
  | 'song'
  | 'challenge_won'
  | 'tone_correct'
  | 'tone_perfect'
  | 'exam_pass'
  | 'story'
  | 'streak'; // días de racha (máximo)

/** Eventos que guardan el máximo en vez de sumar. */
export const MAX_EVENTS: QuestEvent[] = ['combo', 'streak'];

export interface Quest {
  id: string;
  icon: string;
  title: string;
  event: QuestEvent;
  target: number;
  gems: number;
}

export const QUEST_POOL: Quest[] = [
  { id: 'xp30', icon: '⚡', title: 'Gana 30 XP', event: 'xp', target: 30, gems: 15 },
  { id: 'xp60', icon: '⚡', title: 'Gana 60 XP', event: 'xp', target: 60, gems: 25 },
  { id: 'lessons2', icon: '📚', title: 'Completa 2 lecciones', event: 'lesson', target: 2, gems: 20 },
  { id: 'perfect', icon: '💯', title: 'Haz una lección sin fallos', event: 'perfect_lesson', target: 1, gems: 25 },
  { id: 'combo10', icon: '🔥', title: 'Acierta 10 seguidas', event: 'combo', target: 10, gems: 20 },
  { id: 'chat3', icon: '💬', title: 'Habla con Bao 3 turnos', event: 'chat_turn', target: 3, gems: 15 },
  { id: 'song1', icon: '🎤', title: 'Canta una canción', event: 'song', target: 1, gems: 15 },
  { id: 'challenge1', icon: '⚡', title: 'Supera un reto rápido', event: 'challenge_won', target: 1, gems: 15 },
  { id: 'tones8', icon: '🎵', title: 'Acierta 8 tonos', event: 'tone_correct', target: 8, gems: 15 },
  { id: 'story1', icon: '📖', title: 'Lee una historia con Bao', event: 'story', target: 1, gems: 15 },
];

export const WEEKLY_QUEST: Quest = { id: 'week300', icon: '🏆', title: 'Gana 300 XP esta semana', event: 'xp', target: 300, gems: 100 };

/** Gemas extra (y un cofre) por completar las 3 misiones del día. */
export const ALL_DONE_BONUS = { gems: 20, chest: 1 };

export const dayKey = (t: number) => new Date(t).toLocaleDateString('sv-SE');

/** Lunes de la semana (YYYY-MM-DD) en hora local. */
export function weekKey(t: number) {
  const d = new Date(t);
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
  return dayKey(monday.getTime());
}

/**
 * Las 3 misiones del día: siempre una de XP y dos variadas, deterministas
 * por fecha (todas las aperturas del mismo día ven las mismas).
 */
export function dailyQuests(day: string): Quest[] {
  const seed = [...day].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const rng = createRng(seed);
  const xp = QUEST_POOL.filter((q) => q.event === 'xp');
  const rest = QUEST_POOL.filter((q) => q.event !== 'xp');
  return [xp[Math.floor(rng() * xp.length)] as Quest, ...sample(rest, 2, rng)];
}

export const questProgress = (q: Quest, counts: Partial<Record<QuestEvent, number>>) => Math.min(q.target, counts[q.event] ?? 0);
export const questDone = (q: Quest, counts: Partial<Record<QuestEvent, number>>) => questProgress(q, counts) >= q.target;

export function bump(counts: Partial<Record<QuestEvent, number>>, event: QuestEvent, amount: number) {
  const prev = counts[event] ?? 0;
  return { ...counts, [event]: MAX_EVENTS.includes(event) ? Math.max(prev, amount) : prev + amount };
}

// ---------------------------------------------------------------- Logros

export interface AchievementFacts {
  lifetime: Partial<Record<QuestEvent, number>>;
  /** Palabras de lecciones completadas. */
  words: number;
}

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  desc: string;
  target: number;
  value: (f: AchievementFacts) => number;
}

const life = (e: QuestEvent) => (f: AchievementFacts) => f.lifetime[e] ?? 0;

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first', icon: '🌱', title: 'Primer paso', desc: 'Completa tu primera lección', target: 1, value: life('lesson') },
  { id: 'lessons25', icon: '📚', title: 'Estudiante constante', desc: 'Completa 25 lecciones', target: 25, value: life('lesson') },
  { id: 'streak7', icon: '🔥', title: 'Una semana seguida', desc: 'Llega a 7 días de racha', target: 7, value: life('streak') },
  { id: 'streak30', icon: '🐉', title: 'Dragón de la constancia', desc: 'Llega a 30 días de racha', target: 30, value: life('streak') },
  { id: 'words100', icon: '🈶', title: '100 palabras', desc: 'Aprende 100 palabras', target: 100, value: (f) => f.words },
  { id: 'words298', icon: '🎓', title: 'HSK 2 completo', desc: 'Aprende las 298 palabras de HSK 1-2', target: 298, value: (f) => f.words },
  { id: 'perfect5', icon: '💯', title: 'Perfeccionista', desc: '5 lecciones sin fallos', target: 5, value: life('perfect_lesson') },
  { id: 'boss1', icon: '🏆', title: 'Campeón de unidad', desc: 'Supera un desafío de unidad', target: 1, value: life('boss') },
  { id: 'chat50', icon: '💬', title: 'Charlatán', desc: 'Habla 50 turnos con Bao', target: 50, value: life('chat_turn') },
  { id: 'songs5', icon: '🎤', title: 'Estrella del karaoke', desc: 'Canta 5 canciones', target: 5, value: life('song') },
  { id: 'stories20', icon: '📚', title: 'Gran lector', desc: 'Lee 20 historias', target: 20, value: life('story') },
  { id: 'challenges10', icon: '⚡', title: 'Rayo', desc: 'Supera 10 retos rápidos', target: 10, value: life('challenge_won') },
  { id: 'tones', icon: '🎵', title: 'Oído de oro', desc: 'Haz 10/10 en el entrenador de tonos', target: 1, value: life('tone_perfect') },
  { id: 'exam', icon: '📜', title: 'Aprobado', desc: 'Aprueba un simulacro HSK', target: 1, value: life('exam_pass') },
];

export const achievementProgress = (a: Achievement, f: AchievementFacts) => Math.min(a.target, a.value(f));
export const unlocked = (f: AchievementFacts) => ACHIEVEMENTS.filter((a) => a.value(f) >= a.target);
