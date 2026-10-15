/**
 * Tutor sin conexión: cuando el backend de IA no responde (sin internet, o la
 * web/APK sin servidor), Bao sigue practicando con frases de la unidad. Produce
 * los mismos `TutorTurn` que el LLM, así que la pantalla de chat no cambia.
 * Solo usa tareas de hueco (fill_gap), que se corrigen sin IA.
 */
import type { SampleSentence, VocabItem } from '@/data/hsk/types';
import type { Rng } from '@/features/lesson/engine/random';
import { sample, shuffle } from '@/features/lesson/engine/random';
import type { NextTask, Scenario, TutorTurn, UserInput } from './contract';

interface Gap {
  sentence: SampleSentence;
  answer: VocabItem;
  task: Extract<NextTask, { type: 'fill_gap' }>;
}

export interface OfflineTutor {
  opening: () => TutorTurn;
  reply: (input: UserInput) => TutorTurn;
}

const ROUNDS = 4;

export function createOfflineTutor(scenario: Scenario, sentences: SampleSentence[], vocab: VocabItem[], rng: Rng): OfflineTutor {
  const byId = new Map(vocab.map((v) => [v.id, v]));
  const targets = new Set(scenario.target_item_ids);
  // Prioridad: frases de la propia unidad (ids "u3-s1" para la conversación "u3-ai"),
  // luego las que usan su vocabulario y, si faltan, cualquiera.
  const unitPrefix = /^u\d+-/.exec(scenario.id)?.[0] ?? 'u1-';
  const ownUnit = sentences.filter((s) => s.id.startsWith(unitPrefix));
  const related = sentences.filter((s) => !ownUnit.includes(s) && s.itemIds.some((id) => targets.has(id)));
  const rest = sentences.filter((s) => !ownUnit.includes(s) && !related.includes(s));
  const pool = [...shuffle(ownUnit, rng), ...shuffle(related, rng), ...rest].slice(0, ROUNDS);

  const gaps: Gap[] = pool.flatMap((sentence) => {
    const candidates = sentence.tokens.map((t) => vocab.find((v) => v.hanzi === t)).filter((v): v is VocabItem => !!v);
    const answer = candidates.find((v) => targets.has(v.id)) ?? candidates[0];
    if (!answer) return [];
    const others = sample(
      vocab.filter((v) => v.hanzi !== answer.hanzi && v.hanzi.length === answer.hanzi.length && v.level <= answer.level),
      2,
      rng,
    );
    const template = sentence.tokens.map((t) => (t === answer.hanzi ? '___' : t)).join('');
    return [{ sentence, answer, task: { type: 'fill_gap', template_hanzi: template, options: shuffle([answer.hanzi, ...others.map((o) => o.hanzi)], rng), answer: answer.hanzi } }];
  });

  let round = 0;
  const base = (over: Partial<TutorTurn> & Pick<TutorTurn, 'reply'>): TutorTurn => ({
    corrections: [], task_score: 1, bao_mood: 'talking', hint: null, explanation: null,
    next_task: gaps[round]?.task ?? { type: 'open_question' }, used_item_ids: [], scenario_complete: false, ...over,
  });

  return {
    opening: () =>
      base({
        reply: {
          hanzi: '你好！我们一起练习吧。',
          pinyin: 'Nǐ hǎo! Wǒmen yìqǐ liànxí ba.',
          translation: `¡Hola! Practiquemos juntos: ${scenario.goal.charAt(0).toLowerCase()}${scenario.goal.slice(1)}. Completa las frases.`,
        },
        hint: gaps[0] ? `Pista: «${gaps[0].sentence.meaning}»` : null,
        explanation:
          'Te leo cada frase en voz alta. Elige la palabra que falta: la pista te dice qué significa la frase. ' +
          'Después te explico la palabra y puedes ver la frase palabra por palabra. Toca mis mensajes para volver a oírlos.',
      }),

    reply: (input) => {
      const gap = gaps[round];
      const choice = input.kind === 'gap_choice' ? input.choice : input.kind === 'text' ? input.text : input.transcript;
      if (!gap) return base({ reply: { hanzi: '再见！', pinyin: 'Zàijiàn!', translation: '¡Hasta pronto!' }, scenario_complete: true });
      const correct = choice.trim() === gap.answer.hanzi;
      round += 1;
      const done = round >= gaps.length;
      const full = gap.sentence.tokens.join('');
      const next = gaps[round];
      const word = `«${gap.answer.hanzi}» (${gap.answer.pinyin}) significa «${gap.answer.meaning}».${gap.answer.note ? ` ${gap.answer.note}` : ''}`;
      const picked = vocab.find((v) => v.hanzi === choice.trim());
      return base({
        reply: { hanzi: full, pinyin: gap.sentence.pinyin, translation: gap.sentence.meaning },
        corrections: correct
          ? []
          : [{
              original: gap.task.template_hanzi.replace('___', choice),
              corrected: full,
              explanation: picked
                ? `Elegiste «${picked.hanzi}» (${picked.pinyin}), que significa «${picked.meaning}»: no encaja. Aquí va «${gap.answer.hanzi}».`
                : `Aquí va «${gap.answer.hanzi}» (${gap.answer.pinyin}): ${gap.answer.meaning}.`,
              error_tag: `vocab:${gap.answer.hanzi}`,
              severity: 'minor',
            }],
        explanation: correct ? `¡Correcto! ${word}` : word,
        task_score: correct ? 1 : 0.3,
        bao_mood: done ? 'celebrate' : correct ? 'happy' : 'encourage',
        hint: next ? `Siguiente: «${next.sentence.meaning}»` : null,
        used_item_ids: correct ? gap.sentence.itemIds.filter((id) => byId.has(id)) : [],
        scenario_complete: done,
      });
    },
  };
}
