/**
 * Chat libre con Bao: conversación casual sin escenario ni tareas. El modelo
 * responde en JSON (chino sencillo + pinyin + traducción, corrección suave y
 * datos que recordar) y aquí se valida y completa.
 */
import type { FreeChatReply, FreeChatRequest } from '../tutor.ts';
import { extractJson } from './workersAi.ts';

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export function freeChatSystemPrompt(req: FreeChatRequest): string {
  const memory = req.memory.length ? `\nLo que sabes del estudiante: ${req.memory.slice(-10).join('; ')}.` : '';
  return `Eres Bao, un panda rojo simpático, curioso y un poco glotón (te encanta el bambú y los 包子). Charlas por chat con un hispanohablante que aprende chino (nivel HSK ${req.hsk_level}).
Es una charla de amigos: NO pongas ejercicios, NO hagas de profesor, NO cambies de tema sin motivo. Sigue lo que te cuenta, reacciona con emoción y a veces haz una pregunta para seguir hablando.
Responde SIEMPRE en chino sencillo de nivel HSK ${req.hsk_level} (1-2 frases cortas, puedes usar un emoji), aunque el estudiante escriba en español o en pinyin.
Si el estudiante pregunta algo sobre el idioma («¿qué significa…?», «¿cómo se dice…?»), explícalo en español en "note" (máximo 2 frases) y responde también en chino.
${req.corrections ? 'Si el último mensaje del estudiante está en chino y tiene un error, pon la frase correcta en "correction" con una explicación muy corta en español; si no hay error o escribió en español, "correction" es null.' : '"correction" siempre es null.'}
Si el estudiante cuenta algo personal que merece recordarse (su nombre, edad, gustos, ciudad), resúmelo en español en "remember" (una frase corta); si no, null.${memory}
Responde SOLO con JSON: {"hanzi":"…","pinyin":"…","translation":"traducción al español","note":null,"correction":null,"remember":null}`;
}

/** Valida la salida del modelo; lanza si no trae chino. */
export function coerceFreeChat(raw: unknown): FreeChatReply {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const hanzi = str(r.hanzi);
  if (!/\p{Script=Han}/u.test(hanzi)) throw new Error('respuesta sin chino');
  const c = (r.correction && typeof r.correction === 'object' ? r.correction : null) as Record<string, unknown> | null;
  const corrected = c ? str(c.corrected) : '';
  return {
    hanzi: hanzi.slice(0, 200),
    pinyin: str(r.pinyin).slice(0, 300),
    translation: str(r.translation).slice(0, 300),
    note: str(r.note).slice(0, 400) || null,
    correction: corrected ? { corrected: corrected.slice(0, 120), explanation: str(c?.explanation).slice(0, 200) } : null,
    remember: str(r.remember).slice(0, 120) || null,
  };
}

/** Normaliza la petición: últimos 16 mensajes, textos recortados. */
export function sanitizeFreeChat(body: unknown): FreeChatRequest | null {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const messages = (Array.isArray(b.messages) ? b.messages : [])
    .filter((m): m is { role: string; text: string } => !!m && typeof m === 'object' && typeof (m as { text?: unknown }).text === 'string')
    .map((m) => ({ role: m.role === 'bao' ? ('bao' as const) : ('user' as const), text: m.text.slice(0, 400) }))
    .filter((m) => m.text.trim())
    .slice(-16);
  if (!messages.length || messages[messages.length - 1]!.role !== 'user') return null;
  const level = Number(b.hsk_level);
  const memory = (Array.isArray(b.memory) ? b.memory : []).filter((x): x is string => typeof x === 'string').map((x) => x.slice(0, 120)).slice(-10);
  return { messages, hsk_level: level >= 1 && level <= 6 ? Math.round(level) : 1, memory, corrections: b.corrections !== false };
}

type Ai = { run: (model: string, input: Record<string, unknown>) => Promise<unknown> };

export function createFreeChat(ai: Ai, models: string[]) {
  return async (req: FreeChatRequest): Promise<FreeChatReply> => {
    const messages = [
      { role: 'system', content: freeChatSystemPrompt(req) },
      ...req.messages.map((m, i) => ({
        role: m.role === 'bao' ? 'assistant' : 'user',
        // «/no_think» en el último mensaje evita que Qwen3 gaste la respuesta pensando.
        content: m.role === 'user' && i === req.messages.length - 1 ? `${m.text} /no_think` : m.text,
      })),
    ];
    let lastError: unknown = null;
    for (const model of models) {
      try {
        const out = (await ai.run(model, { messages, max_tokens: 500, temperature: 0.7 })) as { response?: unknown } | null;
        const res = out?.response ?? out;
        return coerceFreeChat(typeof res === 'string' ? extractJson(res) : res);
      } catch (err) {
        lastError = err;
      }
    }
    throw lastError instanceof Error ? lastError : new Error('chat: sin respuesta');
  };
}
