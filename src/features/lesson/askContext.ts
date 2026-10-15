import type { VocabItem } from '@/data/hsk/types';
import type { Exercise } from './engine/types';

export interface AskContext {
  hanzi: string;
  pinyin?: string;
  translation?: string;
}

/** Frase o palabra del ejercicio sobre la que se le pregunta a Bao. */
export function askContextOf(ex: Exercise, vocab: VocabItem[]): AskContext | undefined {
  switch (ex.kind) {
    case 'multiple_choice': {
      const v = vocab.find((x) => x.id === ex.itemId);
      return v ? { hanzi: v.hanzi, pinyin: v.pinyin, translation: v.meaning } : undefined;
    }
    case 'sentence_order':
      return { hanzi: ex.solution.join(''), pinyin: ex.pinyin, translation: ex.meaning };
    case 'match_pairs':
      return { hanzi: ex.pairs.map((p) => p.hanzi).join('、'), pinyin: ex.pairs.map((p) => p.pinyin).join(', '), translation: ex.pairs.map((p) => p.meaning).join(', ') };
    case 'stroke_writing':
      return { hanzi: ex.word, pinyin: ex.pinyin, translation: ex.meaning };
  }
}

/** Preguntas rápidas según el ejercicio. */
export function quickQuestions(ex: Exercise, ctx: AskContext | undefined): string[] {
  const one = ctx ? [...ctx.hanzi].length <= 2 : true;
  return [
    ex.kind === 'sentence_order' ? '¿Por qué va en este orden?' : one ? '¿Cómo se usa?' : '¿Por qué se dice así?',
    'Dame otro ejemplo',
    '¿Cómo se pronuncia?',
    '¿Qué significa cada carácter?',
  ];
}

/** Respuesta sin conexión: lo que la app ya sabe de la palabra (nota, ejemplo y pinyin). */
export function offlineAnswer(question: string, ctx: AskContext | undefined, vocab: VocabItem[]): string {
  if (!ctx) return 'Ahora no puedo conectarme. ¡Pregúntamelo luego! 🐼';
  const v = vocab.find((x) => x.hanzi === ctx.hanzi);
  if (/pronuncia/i.test(question) && ctx.pinyin) return `${ctx.hanzi} se pronuncia ${ctx.pinyin}. Toca 🔊 para oírlo.`;
  if (/ejemplo/i.test(question) && v?.example) return `${v.example.hanzi} (${v.example.pinyin}) «${v.example.meaning}».`;
  if (v?.note) return v.note;
  return `${ctx.hanzi}${ctx.pinyin ? ` (${ctx.pinyin})` : ''}${ctx.translation ? ` significa «${ctx.translation}»` : ''}. Sin conexión no puedo contarte más ahora.`;
}
