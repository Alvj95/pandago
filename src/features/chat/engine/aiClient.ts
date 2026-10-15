/**
 * Cliente HTTP del backend de PandaGO!. La app NUNCA habla directamente con el
 * proveedor del LLM: la API key vive en el servidor, que además aplica límites
 * de uso, moderación y caché.
 */
import { Platform } from 'react-native';
import { API_URL } from '@/lib/api';
import { TutorTurn, type TurnRequest } from './contract';

export class TutorUnavailableError extends Error {}

/** Sin respuesta en este tiempo, la app pasa al modo sin conexión. */
const TIMEOUT_MS = 15_000;

export async function requestTutorTurn(req: TurnRequest, authToken: string): Promise<TutorTurn> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const res = await fetch(`${API_URL}/v1/tutor/turn`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${authToken}` },
    body: JSON.stringify(req),
    signal: controller.signal,
  }).finally(() => clearTimeout(timer));
  if (!res.ok) throw new TutorUnavailableError(`tutor ${res.status}`);
  // Validamos también en el cliente: si el backend cambia de forma, fallamos con claridad.
  return TutorTurn.parse(await res.json());
}

export interface PronunciationResult {
  transcript: string;
  syllables: {
    hanzi: string;
    tone: 1 | 2 | 3 | 4 | 5 | null;
    toneConfidence: number;
    gop: number;
    /** ok = se entendió · tone = misma sílaba con otro tono · miss = no se oyó (servidores antiguos no lo envían). */
    match?: 'ok' | 'tone' | 'miss';
    heard?: string;
    heardPinyin?: string;
  }[];
}

/**
 * Sube la grabación (m4a en el móvil, webm en la web) al servicio de voz, que
 * la transcribe en mandarín y la compara con la frase esperada (si la hay).
 */
export async function assessPronunciation(audioUri: string, expectedHanzi: string, authToken: string): Promise<PronunciationResult> {
  const form = new FormData();
  form.append('expected', expectedHanzi);
  if (Platform.OS === 'web') {
    // En la web la grabación es una URL blob: hay que adjuntar el archivo real.
    const blob = await (await fetch(audioUri)).blob();
    form.append('audio', blob, 'take.webm');
  } else {
    form.append('audio', { uri: audioUri, name: 'take.m4a', type: 'audio/m4a' } as unknown as Blob);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  let res: Response;
  try {
    res = await fetch(`${API_URL}/v1/speech/assess`, {
      method: 'POST',
      headers: { authorization: `Bearer ${authToken}` },
      body: form,
      signal: controller.signal,
    });
  } catch (err) {
    throw new TutorUnavailableError(controller.signal.aborted ? 'sin respuesta en 25 s' : `sin conexión (${String(err).slice(0, 80)})`);
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string; detail?: string } | null;
    throw new TutorUnavailableError(`HTTP ${res.status}${body?.detail ? `: ${body.detail.slice(0, 120)}` : body?.error ? `: ${body.error}` : ''}`);
  }
  return (await res.json()) as PronunciationResult;
}

/** «Pregúntale a Bao»: duda libre sobre una frase; respuesta en español. */
export async function askBao(
  question: string,
  context: { hanzi: string; pinyin?: string; translation?: string } | undefined,
  hskLevel: number,
  noSpoilers = false,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  const res = await fetch(`${API_URL}/v1/tutor/ask`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ question, context, hsk_level: hskLevel, no_spoilers: noSpoilers }),
    signal: controller.signal,
  }).finally(() => clearTimeout(timer));
  if (!res.ok) throw new TutorUnavailableError(`ask ${res.status}`);
  const { answer } = (await res.json()) as { answer?: string };
  if (!answer) throw new TutorUnavailableError('ask: vacío');
  return answer;
}
