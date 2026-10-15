import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { TutorTurn, type TurnRequest } from '../../../src/features/chat/engine/contract.ts';
import { buildSystemPrompt, buildUserTurn } from '../promptBuilder.ts';
import { type Tutor, TutorRefusedError, withLevelGuard } from '../tutor.ts';

/**
 * Motor de pago: Claude (API de Anthropic). Se usa solo si el servidor tiene
 * ANTHROPIC_API_KEY; si no, el tutor gratuito es Workers AI.
 */
export function createClaudeTutor(apiKey: string, model = 'claude-opus-5-5'): Tutor {
  const client = new Anthropic({ apiKey });
  const call = (req: TurnRequest, extra?: string) => callModel(client, model, req, extra);
  return { name: `claude:${model}`, turn: (req) => withLevelGuard(call, req) };
}

async function callModel(client: Anthropic, model: string, req: TurnRequest, extraInstruction?: string): Promise<TutorTurn> {
  const userContent = buildUserTurn(req) + (extraInstruction ? `\n\n## Nota del sistema\n${extraInstruction}` : '');

  const response = await client.beta.messages.parse({
    model,
    max_tokens: 4000,
    // Chat en tiempo real: esfuerzo bajo = menor latencia; el razonamiento difícil
    // (evaluar tonos, planificar niveles) lo hace código determinista, no el LLM.
    output_config: { effort: 'low', format: betaZodOutputFormat(TutorTurn) },
    // Si el filtro de seguridad rechaza un turno, la API lo reintenta en un modelo alternativo.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: [
      {
        type: 'text',
        text: buildSystemPrompt(req.scenario.persona, req.learner.hsk_level, req.learner.native_language),
        cache_control: { type: 'ephemeral', ttl: '1h' },
      },
    ],
    messages: [{ role: 'user', content: userContent }],
  });

  if (response.stop_reason === 'refusal') throw new TutorRefusedError(response.stop_details?.category ?? 'refusal');
  if (!response.parsed_output) throw new Error(`Salida no válida (stop_reason=${response.stop_reason})`);
  return response.parsed_output;
}
