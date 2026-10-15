/**
 * Motor gratuito: Cloudflare Workers AI (modelos abiertos, cuota gratis diaria).
 *
 * Los modelos abiertos siguen peor un formato estricto que Claude, así que:
 * 1. Se pide JSON con `response_format` (si el modelo no lo admite, se repite sin él).
 * 2. Se extrae el JSON del texto (quitando bloques <think> y ```).
 * 3. Se completan los campos que falten con valores seguros y se valida con el
 *    mismo esquema que usa la app. Si nada funciona, el servidor responde 502 y la
 *    app sigue con el tutor sin conexión.
 */
import { z } from 'zod';
import { applySandhi, type Tone } from '../../../src/features/chat/engine/tones.ts';
import { TutorTurn, type TurnRequest } from '../../../src/features/chat/engine/contract.ts';
import { buildSystemPrompt, buildUserTurn } from '../promptBuilder.ts';
import { type PronunciationResult, type Tutor, withLevelGuard } from '../tutor.ts';
import { vocabForLevel } from '../vocab.ts';

/** Lo mínimo que usamos del binding `env.AI` de Workers. */
export interface AiBinding {
  run: (model: string, input: Record<string, unknown>) => Promise<unknown>;
}

const TURN_SCHEMA = z.toJSONSchema(TutorTurn);

const FORMAT = `
# Formato de respuesta (OBLIGATORIO)
Responde SOLO con un objeto JSON válido, sin texto antes ni después, con esta forma:
{"reply":{"hanzi":"…","pinyin":"…","translation":"…"},
 "corrections":[{"original":"lo que escribió el estudiante","corrected":"la frase correcta","explanation":"por qué, en una frase","error_tag":"grammar:…","severity":"minor"}],
 "task_score":0.8,"bao_mood":"happy","hint":null,"explanation":"mini-lección sobre la palabra o estructura clave",
 "next_task":{"type":"open_question"},"used_item_ids":["h1-…"],"scenario_complete":false}
(Los «…» son marcadores: escribe tu propio contenido, no copies este ejemplo.)
- "bao_mood" es uno de: happy, celebrate, encourage, talking.
- "next_task" es {"type":"open_question"} o {"type":"fill_gap","template_hanzi":"我___茶","options":["喝","吃","看"],"answer":"喝"} o {"type":"repeat_aloud","hanzi":"…","pinyin":"…"}.
- "corrections" puede ser [] si no hay errores. "hint" y "explanation" pueden ser null.`;

/** Saca el primer objeto JSON de un texto (quita razonamientos <think> y bloques de código). */
export function extractJson(text: string): unknown {
  const clean = text.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/```(?:json)?/g, '');
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('sin JSON');
  return JSON.parse(clean.slice(start, end + 1));
}

const MOODS = ['happy', 'celebrate', 'encourage', 'talking'] as const;
const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);

/** Completa y corrige lo que falte en la salida del modelo y la valida con el contrato de la app. */
export function coerceTurn(raw: unknown): TutorTurn {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const reply = (r.reply && typeof r.reply === 'object' ? r.reply : {}) as Record<string, unknown>;
  if (!str(reply.hanzi)) throw new Error('respuesta sin hanzi');

  const task = (r.next_task && typeof r.next_task === 'object' ? r.next_task : {}) as Record<string, unknown>;
  let next_task: TutorTurn['next_task'] = { type: 'open_question' };
  if (task.type === 'fill_gap') {
    const options = Array.isArray(task.options) ? task.options.filter((o): o is string => typeof o === 'string') : [];
    const answer = str(task.answer);
    if (str(task.template_hanzi).includes('___') && options.includes(answer) && options.length >= 2) {
      next_task = { type: 'fill_gap', template_hanzi: str(task.template_hanzi), options, answer };
    }
  } else if (task.type === 'repeat_aloud' && str(task.hanzi) && str(task.pinyin)) {
    next_task = { type: 'repeat_aloud', hanzi: str(task.hanzi), pinyin: str(task.pinyin) };
  }

  const corrections = (Array.isArray(r.corrections) ? r.corrections : [])
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .filter((x) => str(x.corrected))
    .slice(0, 2)
    .map((x) => ({
      original: str(x.original),
      corrected: str(x.corrected),
      explanation: str(x.explanation),
      error_tag: /^(vocab|grammar|tones|speaking):/.test(str(x.error_tag)) ? str(x.error_tag) : 'grammar:general',
      severity: x.severity === 'major' ? ('major' as const) : ('minor' as const),
    }));

  const score = typeof r.task_score === 'number' && Number.isFinite(r.task_score) ? Math.min(1, Math.max(0, r.task_score)) : 0.7;
  return TutorTurn.parse({
    reply: { hanzi: str(reply.hanzi), pinyin: str(reply.pinyin), translation: str(reply.translation) },
    corrections,
    task_score: score,
    bao_mood: MOODS.includes(r.bao_mood as (typeof MOODS)[number]) ? r.bao_mood : 'talking',
    hint: str(r.hint) || null,
    explanation: str(r.explanation) || null,
    next_task,
    used_item_ids: Array.isArray(r.used_item_ids) ? r.used_item_ids.filter((x): x is string => typeof x === 'string') : [],
    scenario_complete: r.scenario_complete === true,
  });
}

/** Texto o JSON que devuelve `env.AI.run` para un modelo de chat. */
function responseOf(out: unknown): unknown {
  const r = (out as { response?: unknown } | null)?.response ?? out;
  return typeof r === 'string' ? extractJson(r) : r;
}

export function createWorkersAiTutor(ai: AiBinding, models: string[], asrModel: string): Tutor {
  const call = async (req: TurnRequest, extra?: string) => {
    const messages = [
      { role: 'system', content: buildSystemPrompt(req.scenario.persona, req.learner.hsk_level, req.learner.native_language) + FORMAT },
      { role: 'user', content: buildUserTurn(req) + (extra ? `\n\n## Nota del sistema\n${extra}` : '') },
    ];
    let lastError: unknown = null;
    for (const model of models) {
      // Primero con salida estructurada; si el modelo no la admite o falla, sin ella.
      for (const response_format of [{ type: 'json_schema', json_schema: TURN_SCHEMA }, undefined]) {
        try {
          const out = await ai.run(model, { messages, max_tokens: 900, temperature: 0.4, ...(response_format ? { response_format } : {}) });
          return coerceTurn(responseOf(out));
        } catch (err) {
          lastError = err;
        }
      }
    }
    throw lastError instanceof Error ? lastError : new Error('workers-ai: sin respuesta válida');
  };

  return {
    name: `workers-ai:${models[0] ?? '?'}`,
    turn: (req) => withLevelGuard(call, req),
    assess: async (audio, expected) => {
      const out = (await ai.run(asrModel, { audio: [...new Uint8Array(audio)] })) as { text?: string };
      return alignTranscript(str(out?.text), expected);
    },
  };
}

// ---------------------------------------------------------------- Pronunciación (aproximada)

const HAN = /\p{Script=Han}/u;

/** Tonos de cada carácter de una frase, buscando las palabras más largas del vocabulario. */
export function charTones(hanzi: string): (Tone | null)[] {
  const words = new Map(vocabForLevel(6).map((v) => [v.hanzi, v.tones as Tone[]]));
  const chars = [...hanzi];
  const out: (Tone | null)[] = [];
  for (let i = 0; i < chars.length; ) {
    let len = Math.min(4, chars.length - i);
    for (; len > 1; len--) if (words.has(chars.slice(i, i + len).join(''))) break;
    const tones = words.get(chars.slice(i, i + len).join(''));
    for (let k = 0; k < len; k++) out.push(tones?.[k] ?? null);
    i += len;
  }
  return out;
}

/**
 * Compara lo que entendió el reconocedor de voz con la frase esperada. No mide
 * el contorno de tono: si el carácter se reconoce, se da por bien dicho (con
 * confianza media), porque un tono equivocado suele hacer que el reconocedor
 * entienda otra palabra. Es una aproximación honesta hasta tener un modelo de tonos.
 */
export function alignTranscript(transcript: string, expected: string): PronunciationResult {
  const exp = [...expected].filter((ch) => HAN.test(ch));
  const got = [...transcript].filter((ch) => HAN.test(ch));
  // LCS para saber qué caracteres esperados aparecen, en orden, en la transcripción.
  const dp = Array.from({ length: exp.length + 1 }, () => new Array<number>(got.length + 1).fill(0));
  for (let i = exp.length - 1; i >= 0; i--)
    for (let j = got.length - 1; j >= 0; j--) dp[i]![j] = exp[i] === got[j] ? dp[i + 1]![j + 1]! + 1 : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
  const matched = new Set<number>();
  for (let i = 0, j = 0; i < exp.length && j < got.length; ) {
    if (exp[i] === got[j]) {
      matched.add(i);
      i++;
      j++;
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) i++;
    else j++;
  }
  const lexical = charTones(exp.join(''));
  const spoken = applySandhi(exp, lexical.map((t) => t ?? 5));
  return {
    transcript,
    syllables: exp.map((hanzi, i) =>
      matched.has(i)
        ? { hanzi, tone: lexical[i] === null ? null : (spoken[i] ?? null), toneConfidence: 0.7, gop: 0.9 }
        : { hanzi, tone: null, toneConfidence: 0, gop: 0.2 },
    ),
  };
}
