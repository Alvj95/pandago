/**
 * Despliegue gratuito en Cloudflare Workers.
 * Motor: Workers AI (cuota gratis diaria). Si se configura el secreto
 * ANTHROPIC_API_KEY, usa Claude en su lugar.
 */
import { createApp } from './app.ts';
import { createClaudeTutor } from './providers/claude.ts';
import { type AiBinding, createWorkersAiTutor } from './providers/workersAi.ts';
import type { Tutor } from './tutor.ts';

export interface Env {
  AI: AiBinding;
  /** Modelos de chat separados por comas, en orden de preferencia. */
  TUTOR_MODELS: string;
  /** Modelo de reconocimiento de voz. */
  ASR_MODEL: string;
  /** Modelo de voz de Bao (texto a voz). */
  TTS_MODEL?: string;
  ANTHROPIC_API_KEY?: string;
  CLAUDE_MODEL?: string;
}

let cached: { key: string; tutor: Tutor } | null = null;

function tutorFor(env: Env): Tutor {
  const key = `${env.ANTHROPIC_API_KEY ? 'claude' : 'ai'}|${env.TUTOR_MODELS}|${env.CLAUDE_MODEL ?? ''}`;
  if (cached?.key === key) return cached.tutor;
  const models = env.TUTOR_MODELS.split(',').map((m) => m.trim()).filter(Boolean);
  const free = createWorkersAiTutor(env.AI, models, env.ASR_MODEL, env.TTS_MODEL);
  const tutor: Tutor = env.ANTHROPIC_API_KEY
    ? { ...createClaudeTutor(env.ANTHROPIC_API_KEY, env.CLAUDE_MODEL), assess: free.assess, tts: free.tts, ask: free.ask }
    : free;
  cached = { key, tutor };
  return tutor;
}

export default createApp<Env>(tutorFor);
