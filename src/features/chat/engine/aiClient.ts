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
export async function assessPronunciation(audioUri: string, expectedHanzi: string, authToken: string, lang: 'zh' | 'auto' = 'zh'): Promise<PronunciationResult> {
  const form = new FormData();
  form.append('expected', expectedHanzi);
  form.append('lang', lang);
  if (Platform.OS === 'web') {
    // En la web la grabación es una URL blob: hay que adjuntar el archivo real.
    const blob = await (await fetch(audioUri)).blob();
    form.append('audio', blob, 'take.webm');
  } else {
    form.append('audio', { uri: audioUri, name: 'take.m4a', type: 'audio/m4a' } as unknown as Blob);
  }
  const { status, body } = await postForm(`${API_URL}/v1/speech/assess`, form, authToken, 25_000);
  if (status < 200 || status >= 300) {
    const err = parseJson(body) as { error?: string; detail?: string } | null;
    throw new TutorUnavailableError(`HTTP ${status}${err?.detail ? `: ${err.detail.slice(0, 120)}` : err?.error ? `: ${err.error}` : ''}`);
  }
  return parseJson(body) as PronunciationResult;
}

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

/**
 * Envía un formulario con archivo. Se usa XMLHttpRequest y no fetch: el fetch de
 * Expo (el global en SDK 57) no admite las partes `{ uri, name, type }` de React
 * Native y fallaba con «Unsupported FormDataPart implementation»; el
 * XMLHttpRequest de React Native sí lee el archivo del móvil.
 */
function postForm(url: string, form: FormData, authToken: string, timeoutMs: number): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('authorization', `Bearer ${authToken}`);
    xhr.timeout = timeoutMs;
    xhr.onload = () => resolve({ status: xhr.status, body: xhr.responseText ?? '' });
    xhr.onerror = () => reject(new TutorUnavailableError('sin conexión'));
    xhr.ontimeout = () => reject(new TutorUnavailableError(`sin respuesta en ${Math.round(timeoutMs / 1000)} s`));
    xhr.send(form);
  });
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

export interface FreeChatReply {
  hanzi: string;
  pinyin: string;
  translation: string;
  note: string | null;
  correction: { corrected: string; explanation: string } | null;
  remember: string | null;
}

/** Chat libre con Bao: charla sin guion. */
export async function sendFreeChat(
  messages: { role: 'user' | 'bao'; text: string }[],
  opts: { hskLevel: number; memory: string[]; corrections: boolean },
): Promise<FreeChatReply> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  let res: Response;
  try {
    res = await fetch(`${API_URL}/v1/chat/free`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages, hsk_level: opts.hskLevel, memory: opts.memory, corrections: opts.corrections }),
      signal: controller.signal,
    });
  } catch {
    throw new TutorUnavailableError(controller.signal.aborted ? 'sin respuesta' : 'sin conexión');
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new TutorUnavailableError(`chat ${res.status}`);
  return (await res.json()) as FreeChatReply;
}

export interface AssistReply {
  answer: string;
  hanzi: string | null;
  pinyin: string | null;
  words: { hanzi: string; pinyin: string; es: string }[];
  /** Texto chino que Bao leyó en la foto. */
  read?: string;
}

/** Bao Asistente: traducir, explicar un texto o una foto, revisar un mensaje. */
export async function askAssistant(req: { question: string; text?: string; image?: string | null; hskLevel: number }): Promise<AssistReply> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), req.image ? 40_000 : 20_000);
  let res: Response;
  try {
    res = await fetch(`${API_URL}/v1/assist`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question: req.question, text: req.text ?? '', image: req.image ?? null, hsk_level: req.hskLevel }),
      signal: controller.signal,
    });
  } catch {
    throw new TutorUnavailableError(controller.signal.aborted ? 'sin respuesta' : 'sin conexión');
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new TutorUnavailableError(`asistente ${res.status}`);
  return (await res.json()) as AssistReply;
}
