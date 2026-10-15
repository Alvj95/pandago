/**
 * Tarjetas de «Mis palabras»: un repaso tipo Leitner muy simple. Cada
 * respuesta fija cuándo vuelve la tarjeta: Difícil (hoy otra vez), Bien
 * (doble del intervalo), Fácil (triple).
 */
export interface CardState {
  addedAt: number;
  /** Próximo repaso (ms). */
  due: number;
  /** Intervalo actual en días. */
  interval: number;
}

export type Grade = 'hard' | 'good' | 'easy';

const DAY = 24 * 60 * 60 * 1000;

export const newCard = (now: number): CardState => ({ addedAt: now, due: now, interval: 0 });

export function review(card: CardState, grade: Grade, now: number): CardState {
  const interval = grade === 'hard' ? 0 : grade === 'good' ? Math.max(1, card.interval * 2) : Math.max(3, card.interval * 3);
  // «Difícil» vuelve a salir en 10 minutos (en la misma sesión si se sigue repasando).
  return { ...card, interval, due: now + (interval === 0 ? 10 * 60 * 1000 : interval * DAY) };
}

export const isDue = (card: CardState, now: number) => card.due <= now;

export const nextReviewLabel = (card: CardState, now: number) => {
  const days = Math.round((card.due - now) / DAY);
  return card.due <= now ? 'para hoy' : days <= 0 ? 'en unos minutos' : days === 1 ? 'mañana' : `en ${days} días`;
};
