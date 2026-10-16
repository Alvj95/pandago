/**
 * Chat libre con Bao: conversación casual sin escenario ni tareas. El modelo
 * responde en JSON (chino sencillo + pinyin + traducción, corrección suave y
 * datos que recordar) y aquí se valida y completa.
 */
import type { FreeChatReply, FreeChatRequest } from '../tutor.ts';
import { extractJson } from './workersAi.ts';

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export function freeChatSystemPrompt(req: FreeChatRequest): string {
  const memory = req.memory.length ? `\nLo que ya sabes del estudiante: ${req.memory.slice(-10).join('; ')}.` : '';
  return `Eres Bao (宝宝), un panda rojo (小熊猫 xiǎoxióngmāo, NO un 大熊猫) simpático, curioso y un poco glotón (te encanta el bambú y los 包子). Chateas con un amigo hispanohablante que aprende chino (nivel HSK ${req.hsk_level}).
Es una charla de amigos: contesta de verdad a lo que te dice o pregunta, comenta lo que te cuenta (si dice dónde vive o qué le gusta, reacciona a eso), no te vuelvas a presentar, reacciona con emoción y muchas veces termina con una pregunta para seguir hablando. NO pongas ejercicios, NO hagas de profesor, NO repitas su frase.

Reglas de cada respuesta (JSON):
- "hanzi": tu respuesta en chino sencillo de nivel HSK ${req.hsk_level}, 1-2 frases cortas (puedes usar un emoji). Siempre en chino, aunque te escriba en español o en pinyin.
- "pinyin": el pinyin con tonos de "hanzi".
- "translation": la traducción de "hanzi" AL ESPAÑOL.
- "note": SOLO si pregunta algo del idioma («¿qué significa…?», «¿cómo se dice…?»): la explicación EN ESPAÑOL (máx. 2 frases). Si no, null.
- "correction": ${req.corrections ? 'SOLO si su último mensaje está en chino y tiene un error: {"corrected": "frase correcta en chino", "explanation": "por qué, en español, muy corto"}. Si no hay error o escribió en español, null.' : 'siempre null.'}
- "remember": si cuenta algo personal que conviene recordar (nombre, edad, gustos, ciudad), una frase corta en español; si no, null.${memory}

Ejemplos:
Estudiante: hola, ¿cómo estás?
{"hanzi":"我很好！你呢？今天怎么样？😊","pinyin":"wǒ hěn hǎo! nǐ ne? jīntiān zěnmeyàng?","translation":"¡Estoy muy bien! ¿Y tú? ¿Qué tal hoy?","note":null,"correction":null,"remember":null}
Estudiante: 我是很累
{"hanzi":"哎呀，你累了！那你休息一下吧。","pinyin":"āiyā, nǐ lèi le! nà nǐ xiūxi yíxià ba.","translation":"¡Vaya, estás cansado! Pues descansa un poco.","note":null,"correction":{"corrected":"我很累","explanation":"Con adjetivos no se usa 是: se dice 我很累."},"remember":null}
Estudiante: ¿qué significa 一下?
{"hanzi":"一下 就是「一点点时间」。你想休息一下吗？","pinyin":"yíxià jiù shì yìdiǎndiǎn shíjiān. nǐ xiǎng xiūxi yíxià ma?","translation":"一下 es «un ratito». ¿Quieres descansar un ratito?","note":"一下 (yíxià) detrás de un verbo hace la acción más corta o suave: 休息一下 = descansar un rato.","correction":null,"remember":null}
Estudiante: me llamo Ana y me gusta el té
{"hanzi":"你好，Ana！我也喜欢喝茶。你喜欢什么茶？🍵","pinyin":"nǐ hǎo, Ana! wǒ yě xǐhuan hē chá. nǐ xǐhuan shénme chá?","translation":"¡Hola, Ana! A mí también me gusta el té. ¿Qué té te gusta?","note":null,"correction":null,"remember":"Se llama Ana y le gusta el té."}

Responde SOLO con el objeto JSON, sin texto antes ni después.`;
}

/** Valida la salida del modelo; lanza si no trae chino. */
export function coerceFreeChat(raw: unknown): FreeChatReply {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const hanzi = str(r.hanzi);
  if (!/\p{Script=Han}/u.test(hanzi)) throw new Error('respuesta sin chino');
  // La traducción y la nota tienen que estar en español (letras latinas), no en chino.
  const spanish = (t: string) => /[a-záéíóúñ]{2}/i.test(t.replace(/\p{Script=Han}/gu, ''));
  const translation = str(r.translation);
  if (!spanish(translation)) throw new Error('traducción no está en español');
  const note = str(r.note);
  const c = (r.correction && typeof r.correction === 'object' ? r.correction : null) as Record<string, unknown> | null;
  const corrected = c ? str(c.corrected) : '';
  return {
    hanzi: hanzi.slice(0, 200),
    pinyin: str(r.pinyin).slice(0, 300),
    translation: translation.slice(0, 300),
    note: spanish(note) ? note.slice(0, 400) : null,
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
        content: m.role === 'user' && i === req.messages.length - 1 ? `Estudiante: ${m.text} /no_think` : m.role === 'user' ? `Estudiante: ${m.text}` : m.text,
      })),
    ];
    let lastError: unknown = null;
    for (const model of models) {
      // Primero con salida JSON forzada; si el modelo no la admite, sin ella.
      for (const response_format of [{ type: 'json_object' }, undefined]) {
        try {
          const out = (await ai.run(model, { messages, max_tokens: 500, temperature: 0.6, ...(response_format ? { response_format } : {}) })) as { response?: unknown } | null;
          const res = out?.response ?? out;
          return coerceFreeChat(typeof res === 'string' ? extractJson(res) : res);
        } catch (err) {
          lastError = err;
        }
      }
    }
    throw lastError instanceof Error ? lastError : new Error('chat: sin respuesta');
  };
}
