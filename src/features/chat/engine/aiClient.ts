/**
 * Cliente HTTP del backend de PandaGO!. La app NUNCA habla directamente con el
 * proveedor del LLM: la API key vive en el servidor, que además aplica límites
 * de uso, moderación y caché.
 */
import Constants from 'expo-constants';
import { TutorTurn, type TurnRequest } from './contract';

const API_URL: string = (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? 'http://localhost:8787';

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
  syllables: { hanzi: string; tone: 1 | 2 | 3 | 4 | 5 | null; toneConfidence: number; gop: number }[];
}

/**
 * Sube la grabación (m4a/16 kHz mono) al servicio de voz: ASR en mandarín +
 * alineamiento forzado contra la frase esperada + clasificación de tono por F0.
 */
export async function assessPronunciation(audioUri: string, expectedHanzi: string, authToken: string): Promise<PronunciationResult> {
  const form = new FormData();
  form.append('expected', expectedHanzi);
  form.append('audio', { uri: audioUri, name: 'take.m4a', type: 'audio/m4a' } as unknown as Blob);
  const res = await fetch(`${API_URL}/v1/speech/assess`, {
    method: 'POST',
    headers: { authorization: `Bearer ${authToken}` },
    body: form,
  });
  if (!res.ok) throw new TutorUnavailableError(`speech ${res.status}`);
  return (await res.json()) as PronunciationResult;
}
