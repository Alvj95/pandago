import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { TurnRequest } from '../../src/features/chat/engine/contract.ts';
import { alignTranscript, audioOf, cleanAnswer, coerceTurn, createWorkersAiTutor, extractJson } from '../src/providers/workersAi.ts';
import { createApp } from '../src/app.ts';

const req: TurnRequest = {
  scenario: { id: 'u1-ai', title: 'Saludos', goal: 'Preséntate', persona: 'bao', target_item_ids: ['h1-你好'], max_turns: 6 },
  learner: { hsk_level: 1, native_language: 'español', weaknesses: [], known_item_ids: [], session_target_p: 0.8 },
  history: [],
  input: null,
};

const good = {
  reply: { hanzi: '你好！你叫什么名字？', pinyin: 'Nǐ hǎo! Nǐ jiào shénme míngzi?', translation: '¡Hola! ¿Cómo te llamas?' },
  corrections: [], task_score: 1, bao_mood: 'happy', hint: null, explanation: '叫 = llamarse',
  next_task: { type: 'open_question' }, used_item_ids: [], scenario_complete: false,
};

describe('tutor gratis (Workers AI)', () => {
  it('extrae el JSON aunque venga con razonamiento y bloques de código', () => {
    const text = '<think>pienso…</think>\n```json\n' + JSON.stringify(good) + '\n```';
    assert.deepEqual(extractJson(text), good);
  });

  it('completa campos que faltan y descarta tareas mal formadas', () => {
    const t = coerceTurn({
      reply: { hanzi: '你好！' },
      bao_mood: 'feliz',
      task_score: 7,
      next_task: { type: 'fill_gap', template_hanzi: '我___茶', options: ['喝', '吃'], answer: '看' },
      corrections: [{ original: 'x', corrected: '我喝茶', error_tag: 'raro' }],
    });
    assert.equal(t.bao_mood, 'talking');
    assert.equal(t.task_score, 1);
    assert.deepEqual(t.next_task, { type: 'open_question' });
    assert.equal(t.corrections[0]?.error_tag, 'grammar:general');
    assert.equal(t.explanation, null);
    assert.throws(() => coerceTurn({ reply: {} }));
  });

  it('prueba el siguiente modelo si el primero falla', async () => {
    const calls: string[] = [];
    const ai = {
      run: async (model: string, input: Record<string, unknown>) => {
        calls.push(`${model}${input.response_format ? '+json' : ''}`);
        if (model === 'a') throw new Error('no existe');
        return { response: JSON.stringify(good) };
      },
    };
    const turn = await createWorkersAiTutor(ai, ['a', 'b'], 'asr').turn(req);
    assert.equal(turn.reply.hanzi, good.reply.hanzi);
    assert.deepEqual(calls, ['a+json', 'a', 'b+json']);
  });

  it('acepta la respuesta ya en objeto (JSON mode)', async () => {
    const ai = { run: async () => ({ response: good }) };
    assert.equal((await createWorkersAiTutor(ai, ['m'], 'asr').turn(req)).bao_mood, 'happy');
  });

  it('voz: prueba el siguiente reconocedor si el primero falla y rechaza audios vacíos', async () => {
    const calls: string[] = [];
    const ai = {
      run: async (model: string, input: Record<string, unknown>) => {
        calls.push(`${model}:${typeof input.audio}`);
        if (model === 'turbo-large-v3-turbo') throw new Error('formato no admitido');
        return { text: '你好' };
      },
    };
    const tutor = createWorkersAiTutor(ai, ['m'], 'turbo-large-v3-turbo, clasico');
    const r = await tutor.assess!(new ArrayBuffer(5000), '你好');
    assert.deepEqual(calls, ['turbo-large-v3-turbo:string', 'clasico:object']);
    assert.equal(r.transcript, '你好');
    await assert.rejects(tutor.assess!(new ArrayBuffer(10), '你好'));
  });

  it('voz: si un reconocedor devuelve romanización, prefiere el que escribe en chino', async () => {
    const ai = {
      run: async (model: string) => ({ text: model === 'a' ? 'Ni3,HeyO3' : '你好' }),
    };
    const r = await createWorkersAiTutor(ai, ['m'], 'a,b').assess!(new ArrayBuffer(5000), '你好');
    assert.equal(r.transcript, '你好');
    const solo = await createWorkersAiTutor(ai, ['m'], 'a').assess!(new ArrayBuffer(5000), '你好');
    assert.equal(solo.transcript, 'Ni3,HeyO3');
  });

  it('alinea la transcripción con la frase y aplica el cambio de tono', () => {
    const r = alignTranscript('你好吗', '你好！');
    assert.deepEqual(r.syllables.map((s) => s.tone), [2, 3]); // 你好 se dice 2+3
    const miss = alignTranscript('你', '你好');
    assert.equal(miss.syllables[1]?.tone, null);
    assert.ok(miss.syllables[1]!.gop < 0.5);
  });

  it('la API responde 502 si el motor falla (la app pasa a modo sin conexión) y 400 si la petición es mala', async () => {
    const app = createApp(() => ({ name: 'x', turn: async () => Promise.reject(new Error('cuota agotada')) }));
    const res = await app.request('/v1/tutor/turn', { method: 'POST', body: JSON.stringify(req), headers: { 'content-type': 'application/json' } });
    assert.equal(res.status, 502);
    const bad = await app.request('/v1/tutor/turn', { method: 'POST', body: '{}', headers: { 'content-type': 'application/json' } });
    assert.equal(bad.status, 400);
    const health = await app.request('/health');
    assert.deepEqual(await health.json(), { ok: true, tutor: 'x' });
  });

  it('semáforo: homófono con el mismo tono = bien; misma sílaba con otro tono = tono; otra cosa = fallo', () => {
    // 叫 jiào oído como 交 jiāo (tono cambiado); 宝 bǎo oído como 饱 bǎo (homófono); 我 oído como 他.
    const r = alignTranscript('你好，他交饱宝', '你好，我叫宝宝。');
    assert.deepEqual(r.syllables.map((s) => s.match), ['ok', 'ok', 'miss', 'tone', 'ok', 'ok']);
    assert.equal(r.syllables[3]!.heard, '交');
    assert.equal(r.syllables[3]!.heardPinyin, 'jiao1');
    assert.deepEqual(alignTranscript('', '你好').syllables.map((s) => s.match), ['miss', 'miss']);
  });

  it('voz de Bao (MeloTTS) y respuestas libres', async () => {
    assert.deepEqual([...new Uint8Array(audioOf({ audio: btoa('ID3') }))], [73, 68, 51]);
    assert.throws(() => audioOf({}));
    assert.equal(cleanAnswer('<think>hmm</think>**了** indica pasado.'), '了 indica pasado.');
    assert.equal(cleanAnswer('<think>sin cerrar...'), '');
    const ai = { run: async (model: string, input: Record<string, unknown>) => (model === 'tts' ? { audio: btoa('mp3') } : { response: `Bao: ${JSON.stringify(input).includes('了') ? 'sí' : 'no'}` }) };
    const tutor = createWorkersAiTutor(ai, ['m'], 'asr', 'tts');
    assert.equal((await tutor.ask!({ question: '¿Por qué 了?', hsk_level: 1 })).answer, 'Bao: sí');
    assert.equal((await tutor.tts!('你好')).byteLength, 3);
  });

  it('la API sirve la voz (GET, mp3 o wav) y las preguntas', async () => {
    const app = createApp(() => ({
      name: 'x',
      turn: async () => Promise.reject(new Error('no')),
      tts: async () => new Uint8Array([1, 2, 3]).buffer,
      ask: async (q) => ({ answer: `R: ${q.question} (${q.hsk_level})` }),
    }));
    const tts = await app.request(`/v1/speech/tts?text=${encodeURIComponent('你好')}`);
    assert.equal(tts.status, 200);
    assert.equal(tts.headers.get('content-type'), 'audio/mpeg');
    assert.equal((await tts.arrayBuffer()).byteLength, 3);
    const wavApp = createApp(() => ({ name: 'x', turn: async () => Promise.reject(new Error('no')), tts: async () => new TextEncoder().encode('RIFF....WAVE').buffer as ArrayBuffer }));
    assert.equal((await wavApp.request('/v1/speech/tts?text=好')).headers.get('content-type'), 'audio/wav');
    assert.equal((await app.request('/v1/speech/tts?text=')).status, 400);
    const ask = await app.request('/v1/tutor/ask', { method: 'POST', body: JSON.stringify({ question: '¿qué?', hsk_level: 2 }), headers: { 'content-type': 'application/json' } });
    assert.deepEqual(await ask.json(), { answer: 'R: ¿qué? (2)' });
    assert.equal((await app.request('/v1/tutor/ask', { method: 'POST', body: '{}' })).status, 400);
  });
});
