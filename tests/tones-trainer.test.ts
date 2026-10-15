import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { VOCAB } from '@/data/hsk/course';
import { createRng } from '@/features/lesson/engine/random';
import { buildRound, candidates, syllableResults, weakestTone } from '@/features/tones/trainer';

describe('entrenador de tonos', () => {
  it('cada nivel tiene palabras suficientes y del tipo correcto', () => {
    assert.ok(candidates(1, VOCAB).every((v) => v.hanzi.length === 1 && v.tones[0] !== 5));
    assert.ok(candidates(2, VOCAB).every((v) => v.hanzi.length === 2 && !v.tones.includes(5)));
    for (const l of [1, 2, 3] as const) assert.ok(candidates(l, VOCAB).length >= 30, `nivel ${l}`);
  });

  it('las preguntas tienen 4 opciones distintas y la respuesta es lo que se oye', () => {
    for (const level of [1, 2, 3] as const) {
      for (const q of buildRound(level, VOCAB, createRng(level * 7), 10)) {
        assert.equal(q.options.length, 4);
        assert.equal(new Set(q.options.map((o) => o.join())).size, 4);
        assert.deepEqual(q.options[q.answerIndex], q.spoken);
        assert.ok(q.options.every((o) => o[0] !== 5), 'el neutro no va en la primera sílaba');
      }
    }
  });

  it('你好 se escribe 3+3 y suena 2+3, con explicación', () => {
    const nihao = VOCAB.filter((v) => v.hanzi === '你好');
    const [q] = buildRound(3, nihao, createRng(1), 1);
    assert.deepEqual(q?.written, [3, 3]);
    assert.deepEqual(q?.spoken, [2, 3]);
    assert.match(q?.note ?? '', /3\.º/);
  });

  it('estadísticas por sílaba y tono más difícil', () => {
    const [q] = buildRound(2, VOCAB, createRng(3), 1);
    const wrong = (q!.answerIndex + 1) % 4;
    const res = syllableResults(q!, wrong);
    assert.equal(res.length, 2);
    assert.ok(res.some((r) => !r.ok));
    assert.equal(weakestTone({ 3: { right: 1, wrong: 4 }, 1: { right: 5, wrong: 0 } }), 3);
    assert.equal(weakestTone({ 3: { right: 1, wrong: 1 } }), null);
  });
});
