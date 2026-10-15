import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SENTENCES, VOCAB } from '@/data/hsk/course';
import { STORIES } from '@/data/stories';
import { buildExam, EXAMS, PICTURES, replyPairs, scoreExam } from '@/features/exam/exam';
import { createRng } from '@/features/lesson/engine/random';

const ctx = { vocab: VOCAB, sentences: SENTENCES, stories: STORIES };

describe('simulacro HSK', () => {
  it('genera el número de preguntas de cada examen, mitad audición y mitad lectura', () => {
    for (const [key, spec] of Object.entries(EXAMS)) {
      for (let seed = 1; seed <= 5; seed++) {
        const qs = buildExam(spec, ctx, createRng(seed));
        assert.equal(qs.length, spec.perSection * 2, `${key} ${seed}`);
        assert.equal(qs.filter((q) => q.section === 'listening').length, spec.perSection);
        for (const q of qs) {
          assert.ok(q.options[q.answer], `${key}: ${q.type}`);
          assert.equal(new Set(q.options.map((o) => o.label)).size, q.options.length, `${key}: opciones repetidas en ${q.type}`);
        }
      }
    }
  });

  it('HSK 1 solo usa palabras de HSK 1 en las imágenes', () => {
    const lvl1 = new Set(VOCAB.filter((v) => v.level === 1).map((v) => v.hanzi));
    const qs = buildExam(EXAMS['hsk1'], ctx, createRng(9));
    for (const q of qs.filter((x) => x.type === 'read_tf')) assert.ok(lvl1.has(q.text!), q.text ?? '');
  });

  it('las imágenes son emojis de un solo símbolo y de palabras del curso', () => {
    const words = new Set(VOCAB.map((v) => v.hanzi));
    for (const [w, e] of Object.entries(PICTURES)) {
      assert.ok(words.has(w), w);
      assert.ok(!e.includes('‍'), `${w}: emoji compuesto`);
    }
    assert.ok(replyPairs(STORIES).length >= 20);
  });

  it('puntúa como el HSK: 100 por sección, aprobado con 120', () => {
    const qs = buildExam(EXAMS['hsk1-short'], ctx, createRng(2));
    const perfect = scoreExam(qs, qs.map((q) => q.answer));
    assert.deepEqual([perfect.listening, perfect.reading, perfect.total, perfect.passed], [100, 100, 200, true]);
    const none = scoreExam(qs, qs.map(() => undefined));
    assert.equal(none.passed, false);
    const half = scoreExam(qs, qs.map((q, i) => (i % 2 ? q.answer : undefined)));
    assert.equal(half.total, 100);
  });
});
