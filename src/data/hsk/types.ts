export type HskLevel = 1 | 2 | 3 | 4 | 5 | 6;

export type ExerciseKind =
  | 'multiple_choice' // elegir significado / pinyin / audio
  | 'sentence_order' // ordenar fichas para formar la frase
  | 'match_pairs' // emparejar hanzi ↔ pinyin ↔ significado
  | 'stroke_writing' // trazar el carácter siguiendo el orden de trazos
  | 'ai_conversation'; // diálogo con Bao / nativo IA

export interface VocabItem {
  id: string; // "h1-你好" (nivel + hanzi)
  hanzi: string;
  pinyin: string; // con marcas de tono: "nǐ hǎo"
  tones: number[]; // [3, 3] — 5 = tono neutro
  meaning: string;
  level: HskLevel;
  /** Ids de gramática / palabras que conviene conocer antes. */
  prereqs?: string[];
  /** Nota de uso (gramática, cambios de tono, matices) para la ficha de la palabra. */
  note?: string;
  /** Frase de ejemplo del curso que usa la palabra. */
  example?: Example;
}

/** Frase de ejemplo lista para mostrar (hanzi con puntuación). */
export interface Example {
  hanzi: string;
  pinyin: string;
  meaning: string;
}

/** Explicación de gramática de una unidad. */
export interface GrammarNote {
  title: string;
  /** Esquema corto: "A + 是 + B". */
  pattern: string;
  body: string;
  examples: Example[];
}

export interface UnitGuide {
  intro: string;
  notes: GrammarNote[];
  /** Curiosidad cultural. */
  culture: string;
}

export interface ConversationSetup {
  /** Objetivo comunicativo, p.ej. "pide un té y pregunta el precio". */
  goal: string;
  persona: 'bao' | 'native';
  /** Rol del personaje nativo (camarero, taxista…). */
  role?: string;
}

export interface LessonNode {
  id: string;
  title: string;
  icon: string;
  kind: 'lesson' | 'chest' | 'story' | 'conversation' | 'boss';
  /** Ítems de vocabulario/gramática que la lección introduce o repasa. */
  skillIds: string[];
  /** Solo en nodos de conversación. */
  scenario?: ConversationSetup;
}

export interface SampleSentence {
  id: string;
  /** Fichas en el orden correcto. */
  tokens: string[];
  pinyin: string;
  meaning: string;
  /** Vocabulario que practica (para el modelo del estudiante). */
  itemIds: string[];
}

export interface Unit {
  id: string;
  level: HskLevel;
  index: number;
  title: string;
  description: string;
  color: 'primary' | 'success' | 'info' | 'league';
  guide: UnitGuide;
  nodes: LessonNode[];
}
