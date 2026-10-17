/**
 * Bao Asistente: respuestas cortas y útiles para el día a día (traducir,
 * explicar un texto o una foto, revisar un mensaje en chino). Devuelve JSON
 * con la explicación en español, la frase en chino para copiar y las palabras
 * clave para guardarlas.
 */
import { extractJson } from './workersAi.ts';

export interface AssistRequest {
  /** Lo que pregunta el estudiante (puede ir vacío si solo comparte un texto o una foto). */
  question: string;
  /** Texto que ha pegado o compartido. */
  text: string;
  /** Foto en base64 (JPEG), opcional. */
  image: string | null;
  hsk_level: number;
}

export interface AssistWord {
  hanzi: string;
  pinyin: string;
  es: string;
}

export interface AssistReply {
  /** Respuesta en español, corta (2-4 frases). */
  answer: string;
  /** Frase en chino lista para usar o copiar (si aplica). */
  hanzi: string | null;
  pinyin: string | null;
  /** Palabras clave para guardar. */
  words: AssistWord[];
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const HAN = /\p{Script=Han}/u;

export function assistSystemPrompt(level: number): string {
  return `Eres Bao, un panda rojo que hace de asistente de chino mandarín para un hispanohablante (nivel HSK ${level}). Le ayudas en su vida diaria: traducir, entender mensajes, carteles o menús, revisar lo que escribe y responder dudas.
Sé muy breve y práctico. Responde SOLO con JSON:
{"answer":"…","hanzi":"…","pinyin":"…","words":[{"hanzi":"…","pinyin":"…","es":"…"}]}
- "answer": EN ESPAÑOL, 1-4 frases cortas. Si hay un texto o foto en chino, di qué significa. Si pide revisar su chino, di si está bien y por qué.
- "hanzi": la frase en chino que debería usar o copiar (traducción, respuesta sugerida o versión corregida). null si no aplica.
- "pinyin": el pinyin con tonos de "hanzi" (null si "hanzi" es null).
- "words": 1-5 palabras clave en chino del texto o de tu respuesta, con pinyin y significado en español.
Usa vocabulario sencillo de nivel HSK ${level} cuando propongas frases.`;
}

export function assistUserTurn(req: AssistRequest): string {
  const parts: string[] = [];
  if (req.text) parts.push(`Texto que me han mandado o que he copiado:\n«${req.text.slice(0, 1500)}»`);
  if (req.image) parts.push('Te adjunto una foto.');
  parts.push(req.question ? `Mi pregunta: ${req.question.slice(0, 500)}` : req.text || req.image ? 'Explícame qué significa.' : '');
  return `${parts.filter(Boolean).join('\n')} /no_think`;
}

export function coerceAssist(raw: unknown): AssistReply {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const answer = str(r.answer);
  if (!answer) throw new Error('respuesta vacía');
  const hanzi = str(r.hanzi);
  const words = (Array.isArray(r.words) ? r.words : [])
    .filter((w): w is Record<string, unknown> => !!w && typeof w === 'object')
    .map((w) => ({ hanzi: str(w.hanzi), pinyin: str(w.pinyin), es: str(w.es) }))
    .filter((w) => HAN.test(w.hanzi) && w.hanzi.length <= 8 && w.es)
    .slice(0, 5);
  return {
    answer: answer.slice(0, 700),
    hanzi: HAN.test(hanzi) ? hanzi.slice(0, 200) : null,
    pinyin: HAN.test(hanzi) ? str(r.pinyin).slice(0, 300) || null : null,
    words,
  };
}

export function sanitizeAssist(body: unknown): AssistRequest | null {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const question = str(b.question).slice(0, 500);
  const text = str(b.text).slice(0, 1500);
  const image = typeof b.image === 'string' && b.image.length > 100 && b.image.length < 1_500_000 ? b.image.replace(/^data:image\/\w+;base64,/, '') : null;
  if (!question && !text && !image) return null;
  const level = Number(b.hsk_level);
  return { question, text, image, hsk_level: level >= 1 && level <= 6 ? Math.round(level) : 1 };
}

type Ai = { run: (model: string, input: Record<string, unknown>) => Promise<unknown> };

const parse = (out: unknown) => {
  const res = (out as { response?: unknown } | null)?.response ?? out;
  return coerceAssist(typeof res === 'string' ? extractJson(res) : res);
};

/** Texto con los modelos de chat; foto con los modelos de visión (Gemma 3 y, si falla, Llama 3.2 Vision). */
export function createAssist(ai: Ai, textModels: string[], visionModels: string[]) {
  return async (req: AssistRequest): Promise<AssistReply> => {
    const system = assistSystemPrompt(req.hsk_level);
    const user = assistUserTurn(req);
    let lastError: unknown = null;
    if (req.image) {
      const errors: string[] = [];
      const llamaInput = { messages: [{ role: 'system', content: system }, { role: 'user', content: user }], image: req.image, max_tokens: 600 };
      for (const model of visionModels) {
        const input = model.includes('llama-3.2')
          ? llamaInput
          : {
              messages: [
                { role: 'system', content: system },
                { role: 'user', content: [{ type: 'text', text: user }, { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${req.image}` } }] },
              ],
              max_tokens: 600,
            };
        try {
          return parse(await ai.run(model, input));
        } catch (err) {
          // Llama 3.2 Vision pide aceptar su licencia una vez por cuenta («agree»); la respuesta a eso es un «error».
          if (model.includes('llama-3.2') && /agree/i.test(String(err))) {
            await ai.run(model, { prompt: 'agree' }).catch(() => undefined);
            try {
              return parse(await ai.run(model, llamaInput));
            } catch (again) {
              err = again;
            }
          }
          errors.push(`${model.split('/').pop()}: ${String(err).slice(0, 140)}`);
        }
      }
      throw new Error(`asistente (foto): ${errors.join(' | ')}`);
    }
    const messages = [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ];
    for (const model of textModels) {
      for (const response_format of [{ type: 'json_object' }, undefined]) {
        try {
          return parse(await ai.run(model, { messages, max_tokens: 600, temperature: 0.3, ...(response_format ? { response_format } : {}) }));
        } catch (err) {
          lastError = err;
        }
      }
    }
    throw lastError instanceof Error ? lastError : new Error('asistente: sin respuesta');
  };
}
