import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { assistUserTurn, coerceAssist, createAssist, sanitizeAssist } from '../src/providers/assist.ts';
import { createApp } from '../src/app.ts';

describe('Bao Asistente', () => {
  it('acepta texto, pregunta o foto y rechaza lo vacío', () => {
    assert.equal(sanitizeAssist({}), null);
    assert.equal(sanitizeAssist({ question: '  ' }), null);
    const r = sanitizeAssist({ text: '你周末有空吗？', image: `data:image/jpeg;base64,${'A'.repeat(200)}` })!;
    assert.equal(r.image, 'A'.repeat(200));
    assert.match(assistUserTurn(r), /你周末有空吗/);
    assert.match(assistUserTurn(r), /Explícame/);
  });

  it('limpia la respuesta: palabras en chino con significado, frase solo si es china', () => {
    const r = coerceAssist({ answer: 'Significa «¿estás libre?».', hanzi: '好啊！', pinyin: 'hǎo a', words: [{ hanzi: '有空', pinyin: 'yǒu kòng', es: 'estar libre' }, { hanzi: 'hola', es: 'x' }] });
    assert.deepEqual(r.words.map((w) => w.hanzi), ['有空']);
    assert.equal(r.hanzi, '好啊！');
    assert.equal(coerceAssist({ answer: 'ok', hanzi: 'none' }).hanzi, null);
    assert.throws(() => coerceAssist({}));
  });

  it('usa el modelo de visión para las fotos y el de texto para lo demás', async () => {
    const calls: string[] = [];
    const ai = {
      run: async (model: string, input: Record<string, unknown>) => {
        calls.push(`${model}:${JSON.stringify(input).includes('image_url') ? 'foto' : 'texto'}`);
        return { response: '{"answer":"Es pollo Kung Pao.","hanzi":null,"pinyin":null,"words":[{"hanzi":"鸡","pinyin":"jī","es":"pollo"}]}' };
      },
    };
    const assist = createAssist(ai, ['chat'], ['vision']);
    await assist({ question: '', text: '', image: 'x'.repeat(200), hsk_level: 1 });
    await assist({ question: '¿cómo se dice gracias?', text: '', image: null, hsk_level: 1 });
    assert.deepEqual(calls, ['vision:foto', 'chat:texto']);
    const app = createApp(() => ({ name: 'x', turn: async () => Promise.reject(new Error('no')), assist }));
    const res = await app.request('/v1/assist', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: 'hola' }) });
    assert.equal(res.status, 200);
    assert.equal((await app.request('/v1/assist', { method: 'POST', body: '{}' })).status, 400);
  });
});
