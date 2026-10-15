/**
 * Interfaz común de los «motores» del tutor (Claude de pago, Workers AI
 * gratis) y el guardián de nivel que se aplica a cualquiera de ellos.
 */
import type { TurnRequest, TutorTurn } from '../../src/features/chat/engine/contract.ts';
import { MAX_OUT_OF_LEVEL, outOfLevelRatio } from './levelGuard.ts';

export interface PronunciationResult {
  transcript: string;
  syllables: {
    hanzi: string;
    tone: 1 | 2 | 3 | 4 | 5 | null;
    toneConfidence: number;
    gop: number;
    /** ok = se entendió · tone = misma sílaba con otro tono · miss = no se oyó o sonó a otra cosa. */
    match?: 'ok' | 'tone' | 'miss';
    /** Carácter que oyó el reconocedor en ese lugar y su pinyin numerado (p.ej. «jiao1»). */
    heard?: string;
    heardPinyin?: string;
  }[];
}

export interface Tutor {
  /** Nombre del motor (se muestra en /health). */
  name: string;
  turn: (req: TurnRequest) => Promise<TutorTurn>;
  /** Evaluación de pronunciación (opcional según el motor). */
  assess?: (audio: ArrayBuffer, expectedHanzi: string) => Promise<PronunciationResult>;
  /** Voz natural de Bao: frase china → audio mp3. */
  tts?: (text: string) => Promise<ArrayBuffer>;
  /** «Pregúntale a Bao»: duda libre sobre una frase, respondida en español. */
  ask?: (req: AskRequest) => Promise<{ answer: string }>;
}

export interface AskRequest {
  question: string;
  /** Frase de la lección sobre la que se pregunta (opcional). */
  context?: { hanzi: string; pinyin?: string; translation?: string };
  hsk_level: number;
}

export class TutorRefusedError extends Error {}

/** Una llamada al modelo; `extraInstruction` se añade al turno para pedir una reescritura. */
export type ModelCall = (req: TurnRequest, extraInstruction?: string) => Promise<TutorTurn>;

/**
 * Comprobación determinista tras la respuesta del modelo: si usa demasiados
 * caracteres fuera del nivel, se pide UNA reescritura; si vuelve a pasarse se
 * acepta (la app muestra el desglose palabra por palabra).
 */
export async function withLevelGuard(call: ModelCall, req: TurnRequest): Promise<TutorTurn> {
  const turn = await call(req);
  const { ratio, unknown } = outOfLevelRatio(turn.reply.hanzi, req.learner.hsk_level);
  if (ratio <= MAX_OUT_OF_LEVEL) return turn;
  return call(
    req,
    `Tu respuesta anterior usó caracteres fuera del nivel HSK ${req.learner.hsk_level}: ${unknown.join(' ')}. Reescribe el turno usando solo vocabulario permitido.`,
  ).catch(() => turn);
}
