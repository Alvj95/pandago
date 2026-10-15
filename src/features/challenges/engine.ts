/**
 * Retos cortos para recuperar vidas (y practicar). Lógica pura: generar el
 * reto a partir de las palabras que el alumno ya ha visto y avanzar la partida
 * respuesta a respuesta. La pantalla solo pinta el estado.
 */
import type { SampleSentence, VocabItem } from '@/data/hsk/types';
import type { LearnerModel } from '@/features/learning/adaptive/learnerModel';
import { type Rng, sample, shuffle } from '@/features/lesson/engine/random';

export type ChallengeKind = 'lightning' | 'listen' | 'truefalse' | 'fill' | 'mistakes';

export interface ChallengeQuestion {
  /** Texto grande de la pregunta (hanzi o frase con hueco). */
  prompt: string;
  promptSub?: string;
  /** Si existe, la pregunta se escucha (TTS) y el prompt puede ser solo 🔊. */
  speak?: string;
  options: string[];
  answerIndex: number;
  /** Explicación breve tras responder. */
  explain: string;
  itemId?: string;
}

export interface Challenge {
  kind: ChallengeKind;
  icon: string;
  title: string;
  rules: string;
  questions: ChallengeQuestion[];
  /** Aciertos necesarios (seguidos si `streak`). */
  need: number;
  streak: boolean;
  timeLimitSec?: number;
}

export const MAX_CHALLENGE_HEARTS_PER_DAY = 3;

/** Palabras ya vistas: lo practicado en el modelo y lo de los nodos completados; mínimo, la unidad 1. */
export function seenVocab(vocab: VocabItem[], model: LearnerModel, completedSkillIds: string[], fallback: VocabItem[]): VocabItem[] {
  const ids = new Set([...Object.keys(model.items), ...completedSkillIds]);
  const seen = vocab.filter((v) => ids.has(v.id));
  return seen.length >= 8 ? seen : [...seen, ...fallback.filter((v) => !ids.has(v.id))].slice(0, Math.max(8, seen.length));
}

/** Palabras falladas: practicadas y con dominio bajo, de la más floja a la menos. */
export function weakVocab(vocab: VocabItem[], model: LearnerModel): VocabItem[] {
  return vocab
    .filter((v) => (model.items[v.id]?.attempts ?? 0) > 0 && (model.items[v.id]?.mastery ?? 1) < 0.5)
    .sort((a, b) => (model.items[a.id]?.mastery ?? 0) - (model.items[b.id]?.mastery ?? 0));
}

const others = (item: VocabItem, pool: VocabItem[], all: VocabItem[], n: number, rng: Rng) => {
  const bad = (v: VocabItem) => v.id === item.id || v.meaning === item.meaning || v.hanzi === item.hanzi;
  const picked = sample(pool.filter((v) => !bad(v)), n, rng);
  return picked.length >= n ? picked : [...picked, ...sample(all.filter((v) => !bad(v) && !picked.includes(v)), n - picked.length, rng)];
};

const explainWord = (v: VocabItem) => `${v.hanzi} (${v.pinyin}) = ${v.meaning}`;

function meaningQuestion(item: VocabItem, pool: VocabItem[], all: VocabItem[], rng: Rng): ChallengeQuestion {
  const options = shuffle([item, ...others(item, pool, all, 3, rng)], rng);
  return { prompt: item.hanzi, promptSub: item.pinyin, options: options.map((o) => o.meaning), answerIndex: options.indexOf(item), explain: explainWord(item), itemId: item.id };
}

function hanziQuestion(item: VocabItem, pool: VocabItem[], all: VocabItem[], rng: Rng, listen: boolean): ChallengeQuestion {
  const options = shuffle([item, ...others(item, pool, all, 3, rng)], rng);
  return {
    prompt: listen ? '🔊' : `«${item.meaning}»`,
    speak: listen ? item.hanzi : undefined,
    options: options.map((o) => o.hanzi),
    answerIndex: options.indexOf(item),
    explain: explainWord(item),
    itemId: item.id,
  };
}

export const TRUE_FALSE = ['✔ Sí', '✘ No'];

export function buildChallenge(
  kind: ChallengeKind,
  ctx: { pool: VocabItem[]; all: VocabItem[]; sentences: SampleSentence[]; weak: VocabItem[] },
  rng: Rng,
): Challenge {
  const { pool, all } = ctx;
  const cycle = (n: number) => Array.from({ length: n }, (_, i) => shuffle(pool, rng)[i % pool.length] as VocabItem);
  switch (kind) {
    case 'lightning':
      return {
        kind, icon: '⚡', title: 'Reto relámpago', streak: true, need: 5, timeLimitSec: 60,
        rules: 'Acierta 5 seguidas antes de que se acabe el minuto. Si fallas, el contador vuelve a 0.',
        questions: cycle(30).map((v) => meaningQuestion(v, pool, all, rng)),
      };
    case 'listen':
      return {
        kind, icon: '👂', title: '¿Qué has oído?', streak: false, need: 5,
        rules: 'Bao dice una palabra: elige sus caracteres. Acierta 5 de 6.',
        questions: sample(pool, 6, rng).map((v) => hanziQuestion(v, pool, all, rng, true)),
      };
    case 'truefalse': {
      const items = sample(pool, 10, rng);
      return {
        kind, icon: '✅', title: '¿Verdadero o falso?', streak: false, need: 8,
        rules: '¿La palabra significa eso? Responde rápido. Acierta 8 de 10.',
        questions: items.map((v, i) => {
          const truthful = i % 2 === 0 ? rng() < 0.7 : rng() < 0.4;
          const shown = truthful ? v : (others(v, pool, all, 1, rng)[0] ?? v);
          const isTrue = shown.meaning === v.meaning;
          return {
            prompt: v.hanzi, promptSub: `${v.pinyin} = «${shown.meaning}»?`, options: TRUE_FALSE, answerIndex: isTrue ? 0 : 1,
            explain: explainWord(v), itemId: v.id,
          };
        }),
      };
    }
    case 'fill': {
      const byHanzi = new Map(all.map((v) => [v.hanzi, v]));
      const poolIds = new Set(pool.map((v) => v.id));
      const usable = ctx.sentences.filter((s) => s.tokens.length >= 2 && s.tokens.some((t) => poolIds.has(byHanzi.get(t)?.id ?? '')));
      const questions = sample(usable, 3, rng).flatMap((s): ChallengeQuestion[] => {
        const answer = s.tokens.map((t) => byHanzi.get(t)).find((v) => v && poolIds.has(v.id));
        if (!answer) return [];
        const opts = shuffle([answer, ...others(answer, pool.filter((v) => v.hanzi.length === answer.hanzi.length), all, 2, rng)], rng);
        return [{
          prompt: s.tokens.map((t) => (t === answer.hanzi ? '＿＿' : t)).join(''),
          promptSub: s.meaning,
          options: opts.map((o) => o.hanzi),
          answerIndex: opts.indexOf(answer),
          explain: `${s.tokens.join('')} · ${s.pinyin}`,
          itemId: answer.id,
        }];
      });
      if (questions.length < 2) return buildChallenge('truefalse', ctx, rng);
      return { kind, icon: '🧩', title: 'Completa la frase', streak: false, need: questions.length, rules: 'Elige la palabra que falta en cada frase. Sin fallar ninguna.', questions };
    }
    case 'mistakes': {
      const items = ctx.weak.slice(0, 5);
      if (items.length < 3) return buildChallenge('lightning', ctx, rng);
      return {
        kind, icon: '🔁', title: 'Repara tus errores', streak: false, need: items.length,
        rules: 'Son palabras que has fallado. Aciértalas todas y además quedarán repasadas.',
        questions: items.map((v, i) => (i % 2 ? hanziQuestion(v, pool, all, rng, false) : meaningQuestion(v, pool, all, rng))),
      };
    }
  }
}

/** Elige un tipo de reto al azar; «Repara tus errores» solo si hay al menos 3 palabras flojas. */
export function pickKind(weakCount: number, rng: Rng, avoid?: ChallengeKind): ChallengeKind {
  const kinds: ChallengeKind[] = ['lightning', 'listen', 'truefalse', 'fill'];
  if (weakCount >= 3) kinds.push('mistakes', 'mistakes');
  const options = kinds.filter((k) => k !== avoid);
  return options[Math.floor(rng() * options.length)] ?? 'lightning';
}

// ---------------------------------------------------------------- Partida

export interface ChallengeRun {
  index: number;
  correct: number;
  streak: number;
  answered: number;
  result: 'playing' | 'won' | 'lost';
}

export const startRun = (): ChallengeRun => ({ index: 0, correct: 0, streak: 0, answered: 0, result: 'playing' });

/** Progreso hacia la meta (0..1): la racha en el relámpago, los aciertos en los demás. */
export const progressOf = (ch: Challenge, run: ChallengeRun) => Math.min(1, (ch.streak ? run.streak : run.correct) / Math.max(1, ch.need));

export function answer(ch: Challenge, run: ChallengeRun, choice: number): ChallengeRun {
  if (run.result !== 'playing') return run;
  const q = ch.questions[run.index];
  if (!q) return { ...run, result: 'lost' };
  const ok = choice === q.answerIndex;
  const next: ChallengeRun = {
    index: run.index + 1,
    correct: run.correct + (ok ? 1 : 0),
    streak: ok ? run.streak + 1 : 0,
    answered: run.answered + 1,
    result: 'playing',
  };
  const remaining = ch.questions.length - next.index;
  const score = ch.streak ? next.streak : next.correct;
  if (score >= ch.need) next.result = 'won';
  else if (ch.streak ? next.streak + remaining < ch.need : next.correct + remaining < ch.need) next.result = 'lost';
  return next;
}

export const timeUp = (run: ChallengeRun): ChallengeRun => (run.result === 'playing' ? { ...run, result: 'lost' } : run);
