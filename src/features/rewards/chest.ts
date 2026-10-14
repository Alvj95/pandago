/**
 * Recompensa de cofre: variable (refuerzo intermitente) pero con suelo garantizado.
 * Pura y con RNG inyectable para poder probarla.
 */
export interface ChestReward {
  gems: number;
  /** Protector de racha extra (cubre un día sin practicar). */
  freeze: boolean;
}

export const MAX_FREEZES = 2;

export function rollChest(rnd: () => number = Math.random, currentFreezes = 0): ChestReward {
  const r = rnd();
  const gems = r > 0.92 ? 60 : r > 0.65 ? 30 : r > 0.3 ? 20 : 12;
  // 15% de protector, solo si aún cabe uno más.
  const freeze = currentFreezes < MAX_FREEZES && rnd() < 0.15;
  return { gems, freeze };
}

/** Gemas por superar el desafío de una unidad. */
export const BOSS_GEMS = 30;
