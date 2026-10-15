import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { TurnRequest } from '../../src/features/chat/engine/contract.ts';
import { type Tutor, TutorRefusedError } from './tutor.ts';

/** Turnos de chat por IP y hora: protege la cuota gratuita de usos abusivos. */
const TURNS_PER_HOUR = 120;
const usage = new Map<string, { hour: number; count: number }>();

function overLimit(ip: string, now = Date.now()) {
  const hour = Math.floor(now / 3_600_000);
  const u = usage.get(ip);
  if (!u || u.hour !== hour) {
    if (usage.size > 5000) usage.clear();
    usage.set(ip, { hour, count: 1 });
    return false;
  }
  u.count += 1;
  return u.count > TURNS_PER_HOUR;
}

/**
 * API del tutor, igual en Node (desarrollo) y en Cloudflare Workers
 * (producción gratis). `getTutor` elige el motor según el entorno.
 */
export function createApp<E extends object>(getTutor: (env: E) => Tutor) {
  const app = new Hono<{ Bindings: E }>();
  // La versión web (GitHub Pages) llama desde otro dominio.
  app.use('*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'OPTIONS'], allowHeaders: ['content-type', 'authorization'] }));

  app.post('/v1/tutor/turn', async (c) => {
    const ip = c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? 'local';
    if (overLimit(ip)) return c.json({ error: 'rate_limited' }, 429);
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

  app.get('/health', (c) => c.json({ ok: true, tutor: getTutor(c.env).name }));
  return app;
}
