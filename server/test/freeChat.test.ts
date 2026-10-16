import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { coerceFreeChat, createFreeChat, freeChatSystemPrompt, sanitizeFreeChat } from '../src/providers/freeChat.ts';
import { createApp } from '../src/app.ts';

describe('chat libre con Bao', () => {
  it('valida la petición: el último mensaje debe ser del estudiante', () => {
    assert.equal(sanitizeFreeChat({ messages: [] }), null);
    assert.equal(sanitizeFreeChat({ messages: [{ role: 'bao', text: '你好' }] }), null);
    const r = sanitizeFreeChat({ messages: [{ role: 'user', text: 'hola' }], hsk_level: 9, memory: ['Se llama Ana', 3] })!;
    assert.equal(r.hsk_level, 1);
    assert.deepEqual(r.memory, ['Se llama Ana']);
    assert.equal(r.corrections, true);
  });

  it('el prompt es de charla, recuerda datos y respeta las correcciones', () => {
    const p = freeChatSystemPrompt({ messages: [], hsk_level: 2, memory: ['Le gusta el té'], corrections: false });
    assert.match(p, /NO pongas ejercicios/);
    assert.match(p, /me llamo Ana/);
    assert.match(p, /Le gusta el té/);
    assert.match(p, /"correction": siempre null/);
  });

  it('completa la respuesta y rechaza la que no trae chino', () => {
    const r = coerceFreeChat({ hanzi: '我很好！你呢？', pinyin: 'wǒ hěn hǎo! nǐ ne?', translation: '¡Bien! ¿Y tú?', correction: { corrected: '我很累', explanation: 'sin 是' } });
    assert.equal(r.note, null);
    assert.deepEqual(r.correction, { corrected: '我很累', explanation: 'sin 是' });
    assert.throws(() => coerceFreeChat({ hanzi: 'hola' }));
    assert.throws(() => coerceFreeChat({ hanzi: '我累了', translation: '我累了' })); // traducción en chino
    assert.equal(coerceFreeChat({ hanzi: '一下', translation: 'un rato', note: '表示短暂的动作。' }).note, null);
  });

  it('prueba otro modelo si el primero falla y la API responde', async () => {
    const ai = {
      run: async (model: string) => {
        if (model === 'a') throw new Error('caído');
        return { response: '<think>…</think>{"hanzi":"我在吃竹子。","pinyin":"wǒ zài chī zhúzi","translation":"Como bambú.","remember":"Se llama Ana"}' };
      },
    };
    const chat = createFreeChat(ai, ['a', 'b']);
    const r = await chat({ messages: [{ role: 'user', text: '你在做什么？' }], hsk_level: 1, memory: [], corrections: true });
    assert.equal(r.hanzi, '我在吃竹子。');
    assert.equal(r.remember, 'Se llama Ana');
    const app = createApp(() => ({ name: 'x', turn: async () => Promise.reject(new Error('no')), chat }));
    const res = await app.request('/v1/chat/free', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', text: 'hola' }] }) });
    assert.equal(res.status, 200);
    assert.equal(((await res.json()) as { hanzi: string }).hanzi, '我在吃竹子。');
    const bad = await app.request('/v1/chat/free', { method: 'POST', body: '{}' });
    assert.equal(bad.status, 400);
  });
});
