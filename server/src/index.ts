/**
 * Servidor local (Node) para desarrollo: `npm run dev`.
 * Usa Claude si hay ANTHROPIC_API_KEY. El despliegue gratuito es src/worker.ts.
 */
import { serve } from '@hono/node-server';
import { createApp } from './app.ts';
import { createClaudeTutor } from './providers/claude.ts';

const key = process.env.ANTHROPIC_API_KEY;
if (!key) {
  console.error('Falta ANTHROPIC_API_KEY. Para el tutor gratis usa Cloudflare: `npm run cf:dev` (ver server/README.md).');
  process.exit(1);
}
const tutor = createClaudeTutor(key, process.env.CLAUDE_MODEL);
const app = createApp(() => tutor);

serve({ fetch: app.fetch, port: Number(process.env.PORT ?? 8787) });
console.log(`PandaGO! tutor (${tutor.name}) en http://localhost:${process.env.PORT ?? 8787}`);
