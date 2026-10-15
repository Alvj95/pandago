/** Catálogo de la tienda de Bao: ropa (se ve en toda la app) y ayudas. Lógica pura. */

export type Slot = 'head' | 'face' | 'neck';

export interface OutfitItem {
  id: string;
  name: string;
  slot: Slot;
  icon: string;
  /** Precio en gemas; las que se desbloquean con un logro son gratis. */
  price: number;
  unlock?: { kind: 'exam'; level: 1 | 2; label: string };
}

export const OUTFIT: OutfitItem[] = [
  { id: 'bamboo-hat', name: 'Sombrero de bambú', slot: 'head', icon: '🎋', price: 120 },
  { id: 'lantern-hat', name: 'Gorro farolillo', slot: 'head', icon: '🏮', price: 300 },
  { id: 'crown-hsk1', name: 'Corona HSK 1', slot: 'head', icon: '👑', price: 0, unlock: { kind: 'exam', level: 1, label: 'Aprueba el simulacro HSK 1' } },
  { id: 'crown-hsk2', name: 'Corona HSK 2', slot: 'head', icon: '💎', price: 0, unlock: { kind: 'exam', level: 2, label: 'Aprueba el simulacro HSK 2' } },
  { id: 'glasses', name: 'Gafas de estudio', slot: 'face', icon: '👓', price: 150 },
  { id: 'headphones', name: 'Auriculares', slot: 'face', icon: '🎧', price: 200 },
  { id: 'scarf', name: 'Bufanda roja', slot: 'neck', icon: '🧣', price: 250 },
  { id: 'bowtie', name: 'Pajarita', slot: 'neck', icon: '🎀', price: 100 },
];

export const SLOTS: { slot: Slot; label: string }[] = [
  { slot: 'head', label: 'Cabeza' },
  { slot: 'face', label: 'Cara' },
  { slot: 'neck', label: 'Cuello' },
];

export type Outfit = Partial<Record<Slot, string>>;

export const itemById = (id: string | undefined) => OUTFIT.find((i) => i.id === id);

export interface Helper {
  id: 'freeze' | 'refill' | 'double-xp';
  name: string;
  desc: string;
  icon: string;
  price: number;
}

export const HELPERS: Helper[] = [
  { id: 'freeze', name: 'Congelador de racha', desc: 'Salva tu racha si un día no practicas', icon: '🧊', price: 200 },
  { id: 'refill', name: 'Rellenar vidas', desc: 'Las 5 vidas al momento', icon: '❤️', price: 350 },
  { id: 'double-xp', name: 'Doble XP 15 min', desc: 'Todo lo que hagas vale el doble', icon: '⚡', price: 100 },
];

export const DOUBLE_XP_MS = 15 * 60 * 1000;

export const EARN_GEMS = [
  { icon: '🎯', text: 'Misiones diarias', gems: '15–25' },
  { icon: '🎁', text: 'Cofres del camino', gems: '12–60' },
  { icon: '👹', text: 'Jefes de unidad', gems: '30' },
  { icon: '🏅', text: 'Aprobar un simulacro', gems: '50' },
];

/** ¿Está desbloqueada una prenda de logro? `examBest` = mejores notas del simulacro (clave → nota). */
export function isUnlocked(item: OutfitItem, examBest: Record<string, number>, passScore: number): boolean {
  if (!item.unlock) return true;
  const keys = item.unlock.level === 1 ? ['hsk1', 'hsk1-short'] : ['hsk2', 'hsk2-short'];
  return keys.some((k) => (examBest[k] ?? 0) >= passScore);
}
