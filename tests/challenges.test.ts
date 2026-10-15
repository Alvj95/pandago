import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SENTENCES, UNITS, VOCAB } from '@/data/hsk/course';
import { answer, buildChallenge, type ChallengeKind, MAX_CHALLENGE_HEARTS_PER_DAY, pickKind, seenVocab, startRun, timeUp, weakVocab } from '@/features/challenges/engine';
import { createLearner } from '@/features/learning/adaptive/learnerModel';
import { createRng } from '@/features/lesson/engine/random';

const unit1 = new Set(UNITS[0]!.nodes.flatMap((n) => n.skillIds));
const pool = VOCAB.filter((v) => unit1.has(v.id));
const ctx = { pool, all: VOCAB, sentences: SENTENCES, weak: pool.slice(0, 4) };
const KINDS: ChallengeKind[] = ['lightning', 'listen', 'truefalse', 'fill', 'mistakes'];

describe('retos para recuperar vidas', () => {
  it('cada tipo genera preguntas válidas y alcanzables', () => {
    for (const kind of KINDS) {
      for (let seed = 1; seed <= 20; seed++) {
        const ch = buildChallenge(kind, ctx, createRng(seed));
        assert.ok(ch.questions.length >= ch.need && ch.need > 0, `${kind} ${seed}`);
        for (const q of ch.questions) {
          assert.ok(q.options[q.answerIndex], kind);
          assert.equal(new Set(q.options).size, q.options.length, `${kind}: opciones repetidas ${q.options.join()}`);
        }
      }
    }
  });

  it('solo usa palabras ya vistas', () => {
    const ids = new Set(pool.map((v) => v.id));
    const ch = buildChallenge('listen', ctx, createRng(4));
    assert.ok(ch.questions.every((q) => ids.has(q.itemId!)));
  });

  it('relámpago: 5 seguidas ganan, un fallo reinicia la racha, el tiempo pierde', () => {
    const ch = buildChallenge('lightning', ctx, createRng(7));
    let run = startRun();
    for (let i = 0; i < 4; i++) run = answer(ch, run, ch.questions[run.index]!.answerIndex);
    run = answer(ch, run, (ch.questions[run.index]!.answerIndex + 1) % 4);
    assert.equal(run.streak, 0);
    assert.equal(run.result, 'playing');
    for (let i = 0; i < 5; i++) run = answer(ch, run, ch.questions[run.index]!.answerIndex);
    assert.equal(run.result, 'won');
    assert.equal(timeUp(startRun()).result, 'lost');
  });

  it('se pierde en cuanto ya no se puede llegar a la meta', () => {
    const ch = buildChallenge('listen', ctx, createRng(2)); // 5 de 6
    let run = startRun();
    run = answer(ch, run, (ch.questions[0]!.answerIndex + 1) % 4);
    assert.equal(run.result, 'playing');
    run = answer(ch, run, (ch.questions[1]!.answerIndex + 1) % 4);
    assert.equal(run.result, 'lost');
  });

  it('«Repara tus errores» solo aparece con palabras flojas', () => {
    const rng = createRng(1);
    for (let i = 0; i < 50; i++) assert.notEqual(pickKind(0, rng), 'mistakes');
    const model = createLearner(1);
    model.items[pool[0]!.id] = { mastery: 0.1, attempts: 3, lastSeen: 0, stability: 1 };
    assert.deepEqual(weakVocab(VOCAB, model).map((v) => v.id), [pool[0]!.id]);
    assert.ok(seenVocab(VOCAB, model, [], pool).length >= 8);
  });

  it('máximo de vidas por retos al día', () => {
    assert.equal(MAX_CHALLENGE_HEARTS_PER_DAY, 3);
  });
});
