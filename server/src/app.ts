import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { TurnRequest } from '../../src/features/chat/engine/contract.ts';
import { sanitizeAssist } from './providers/assist.ts';
import { sanitizeFreeChat } from './providers/freeChat.ts';
import { type AskRequest, type Tutor, TutorRefusedError } from './tutor.ts';

/** Peticiones por IP y hora: protegen la cuota gratuita de usos abusivos. */
const LIMITS = { turn: 120, ask: 60, tts: 400, chat: 200, assist: 120 } as const;
const usage = new Map<string, { hour: number; count: number }>();

function overLimit(kind: keyof typeof LIMITS, ip: string, now = Date.now()) {
  const hour = Math.floor(now / 3_600_000);
  const key = `${kind}|${ip}`;
  const u = usage.get(key);
  if (!u || u.hour !== hour) {
    if (usage.size > 5000) usage.clear();
    usage.set(key, { hour, count: 1 });
    return false;
  }
  u.count += 1;
  return u.count > LIMITS[kind];
}

const ipOf = (header: (name: string) => string | undefined) => header('cf-connecting-ip') ?? header('x-forwarded-for') ?? 'local';

/** Caché de Cloudflare (solo existe en Workers): la misma frase no vuelve a gastar cuota. */
const edgeCache = () => (globalThis as { caches?: { default?: Cache } }).caches?.default;

/**
 * API del tutor, igual en Node (desarrollo) y en Cloudflare Workers
 * (producción gratis). `getTutor` elige el motor según el entorno.
 */
export function createApp<E extends object>(getTutor: (env: E) => Tutor) {
  const app = new Hono<{ Bindings: E }>();
  // La versión web (GitHub Pages) llama desde otro dominio.
  app.use('*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'OPTIONS'], allowHeaders: ['content-type', 'authorization'] }));

  app.post('/v1/tutor/turn', async (c) => {
    if (overLimit('turn', ipOf((n) => c.req.header(n)))) return c.json({ error: 'rate_limited' }, 429);
    const parsed = TurnRequest.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'bad_request', issues: parsed.error.issues }, 400);
    try {
      return c.json(await getTutor(c.env).turn(parsed.data));
    } catch (err) {
      if (err instanceof TutorRefusedError) return c.json({ error: 'refused' }, 422);
      console.error(err);
      // La app pasa a su tutor sin conexión con cualquier error.
      return c.json({ error: 'tutor_unavailable', detail: String(err).slice(0, 300) }, 502);
    }
  });

  app.post('/v1/speech/assess', async (c) => {
    const tutor = getTutor(c.env);
    if (!tutor.assess) return c.json({ error: 'not_supported' }, 501);
    try {
      const form = await c.req.formData();
      const audio = form.get('audio');
      // En la charla libre no hay frase esperada: solo se transcribe.
      const expected = form.get('expected');
      if (!audio || typeof audio === 'string') return c.json({ error: 'bad_request', detail: 'falta el audio' }, 400);
      return c.json(await tutor.assess(await audio.arrayBuffer(), typeof expected === 'string' ? expected : ''));
    } catch (err) {
      console.error(err);
      return c.json({ error: 'speech_unavailable', detail: String(err).slice(0, 300) }, 502);
    }
  });

  // Voz natural de Bao (WAV o MP3). Es un GET para que el reproductor del móvil pueda abrir la URL directamente.
  app.get('/v1/speech/tts', async (c) => {
    const text = (c.req.query('text') ?? '').trim();
    if (!text || text.length > 200) return c.json({ error: 'bad_request', detail: 'texto vacío o demasiado largo' }, 400);
    const tutor = getTutor(c.env);
    if (!tutor.tts) return c.json({ error: 'not_supported' }, 501);
    const cache = edgeCache();
    const key = new Request(new URL(`/v1/speech/tts?text=${encodeURIComponent(text)}`, c.req.url).toString());
    const hit = await cache?.match(key).catch(() => undefined);
    if (hit) return hit;
    if (overLimit('tts', ipOf((n) => c.req.header(n)))) return c.json({ error: 'rate_limited' }, 429);
    try {
      const audio = await tutor.tts(text);
      // MeloTTS devuelve WAV («RIFF…»); otros motores, MP3.
      const isWav = new TextDecoder().decode(new Uint8Array(audio, 0, Math.min(4, audio.byteLength))) === 'RIFF';
      const res = new Response(audio, {
        headers: { 'content-type': isWav ? 'audio/wav' : 'audio/mpeg', 'cache-control': 'public, max-age=2592000', 'access-control-allow-origin': '*' },
      });
      await cache?.put(key, res.clone()).catch(() => undefined);
      return res;
    } catch (err) {
      console.error(err);
      return c.json({ error: 'tts_unavailable', detail: String(err).slice(0, 300) }, 502);
    }
  });

  app.post('/v1/tutor/ask', async (c) => {
    if (overLimit('ask', ipOf((n) => c.req.header(n)))) return c.json({ error: 'rate_limited' }, 429);
    const tutor = getTutor(c.env);
    if (!tutor.ask) return c.json({ error: 'not_supported' }, 501);
    const body = (await c.req.json().catch(() => null)) as Partial<AskRequest> | null;
    const question = typeof body?.question === 'string' ? body.question.trim() : '';
    if (!question) return c.json({ error: 'bad_request', detail: 'falta la pregunta' }, 400);
    const ctx = body?.context;
    const context = ctx && typeof ctx.hanzi === 'string' ? { hanzi: ctx.hanzi.slice(0, 120), pinyin: String(ctx.pinyin ?? '').slice(0, 200), translation: String(ctx.translation ?? '').slice(0, 200) } : undefined;
    const level = Number(body?.hsk_level);
    try {
      return c.json(await tutor.ask({ question, context, hsk_level: level >= 1 && level <= 6 ? Math.round(level) : 1, no_spoilers: body?.no_spoilers === true }));
    } catch (err) {
      console.error(err);
      return c.json({ error: 'tutor_unavailable', detail: String(err).slice(0, 300) }, 502);
    }
  });

  app.post('/v1/chat/free', async (c) => {
    if (overLimit('chat', ipOf((n) => c.req.header(n)))) return c.json({ error: 'rate_limited' }, 429);
    const tutor = getTutor(c.env);
    if (!tutor.chat) return c.json({ error: 'not_supported' }, 501);
    const req = sanitizeFreeChat(await c.req.json().catch(() => null));
    if (!req) return c.json({ error: 'bad_request', detail: 'faltan mensajes (el último debe ser del estudiante)' }, 400);
    try {
      return c.json(await tutor.chat(req));
    } catch (err) {
      console.error(err);
      return c.json({ error: 'tutor_unavailable', detail: String(err).slice(0, 300) }, 502);
    }
  });

  app.post('/v1/assist', async (c) => {
    if (overLimit('assist', ipOf((n) => c.req.header(n)))) return c.json({ error: 'rate_limited' }, 429);
    const tutor = getTutor(c.env);
    if (!tutor.assist) return c.json({ error: 'not_supported' }, 501);
    const req = sanitizeAssist(await c.req.json().catch(() => null));
    if (!req) return c.json({ error: 'bad_request', detail: 'falta la pregunta, el texto o la foto' }, 400);
    try {
      return c.json(await tutor.assist(req));
    } catch (err) {
      console.error(err);
      return c.json({ error: 'tutor_unavailable', detail: String(err).slice(0, 300) }, 502);
    }
  });

  app.get('/health', (c) => c.json({ ok: true, tutor: getTutor(c.env).name }));
  return app;
}
