import type { VocabItem } from '@/data/hsk/types';
import type { ChatMessage } from '@/features/chat/engine/orchestrator';
import type { Correction } from '@/features/chat/engine/contract';
import type { Piece } from '@/features/chat/engine/glossary';

type Gloss = (hanzi: string, vocab: VocabItem[]) => Piece[];

export interface CallSummary {
  turns: number;
  /** Frases del usuario que Bao no tuvo que corregir. */
  good: string[];
  fixes: Correction[];
  /** Palabras del curso que salieron en la llamada (para guardarlas con ⭐). */
  words: VocabItem[];
}

const HAN = /\p{Script=Han}/u;

/** Resumen que se enseña al colgar: lo dicho bien, lo que corregir y las palabras usadas. */
export function callSummary(messages: ChatMessage[], vocab: VocabItem[], gloss: Gloss): CallSummary {
  const good: string[] = [];
  const fixes: Correction[] = [];
  let turns = 0;
  messages.forEach((m, i) => {
    if (m.from === 'user') {
      turns++;
      const reply = messages.slice(i + 1).find((n) => n.from === 'tutor');
      const corrected = reply?.from === 'tutor' && reply.turn.corrections.length > 0;
      if (!corrected && HAN.test(m.text) && !good.includes(m.text)) good.push(m.text);
    }
    if (m.from === 'tutor') for (const c of m.turn.corrections) if (!fixes.some((f) => f.corrected === c.corrected)) fixes.push(c);
  });
  const byHanzi = new Map(vocab.map((v) => [v.hanzi, v]));
  const words: VocabItem[] = [];
  for (const m of messages) {
    if (m.from !== 'tutor') continue;
    for (const p of gloss(m.turn.reply.hanzi, vocab)) {
      const v = p.word && byHanzi.get(p.word.hanzi);
      if (v && !words.includes(v)) words.push(v);
    }
  }
  // Primero las palabras más largas (suelen ser las nuevas): 饺子 antes que 我.
  words.sort((a, b) => [...b.hanzi].length - [...a.hanzi].length);
  return { turns, good: good.slice(-3), fixes: fixes.slice(0, 3), words: words.slice(0, 6) };
}
