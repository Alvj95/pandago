import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SENTENCES, UNITS, VOCAB } from '@/data/hsk/course';
import strokes from '@/data/strokes/hsk.strokes.json';
import { createOfflineTutor } from '@/features/chat/engine/offlineTutor';
import { scenarioForNode } from '@/features/chat/scenarios';
import { buildBossLesson, pickSentences } from '@/features/lesson/engine/exerciseFactory';
import { createRng } from '@/features/lesson/engine/random';
import { MAX_FREEZES, rollChest } from '@/features/rewards/chest';

const content = { vocab: VOCAB, sentences: SENTENCES, strokeChars: new Set(Object.keys(strokes)) };
const nodes = UNITS.flatMap((u) => u.nodes);

describe('curso HSK 1-2', () => {
  it('cubre las 297 palabras oficiales (+你好) sin duplicados', () => {
    assert.equal(VOCAB.length, 298);
    assert.equal(new Set(VOCAB.map((v) => v.id)).size, VOCAB.length);
    assert.equal(VOCAB.filter((v) => v.level === 1).length, 151);
    assert.equal(VOCAB.filter((v) => v.level === 2).length, 147);
  });

  it('cada palabra tiene pinyin, significado y un tono por sílaba', () => {
    for (const v of VOCAB) {
      assert.ok(v.pinyin && v.meaning, v.hanzi);
      assert.equal(v.tones.length, [...v.hanzi].length, `${v.hanzi} ${v.tones}`);
      assert.ok(v.tones.every((t) => t >= 1 && t <= 5));
    }
  });

  it('nodos con ids únicos y habilidades existentes; toda palabra se enseña en alguna lección', () => {
    assert.equal(new Set(nodes.map((n) => n.id)).size, nodes.length);
    const ids = new Set(VOCAB.map((v) => v.id));
    for (const n of nodes) for (const s of n.skillIds) assert.ok(ids.has(s), `${n.id}: ${s}`);
    const taught = new Set(nodes.filter((n) => n.kind === 'lesson').flatMap((n) => n.skillIds));
    assert.equal(taught.size, VOCAB.length);
  });

  it('cada unidad termina en conversación + desafío y tiene un cofre', () => {
    for (const u of UNITS) {
      const kinds = u.nodes.map((n) => n.kind);
      assert.deepEqual(kinds.slice(-2), ['conversation', 'boss'], u.id);
      assert.ok(kinds.includes('chest'), u.id);
      assert.ok(u.nodes.find((n) => n.kind === 'conversation')?.scenario?.goal, u.id);
    }
  });

  it('hay datos de trazos para todos los caracteres del curso', () => {
    const chars = new Set(VOCAB.flatMap((v) => [...v.hanzi]));
    for (const ch of chars) assert.ok(content.strokeChars.has(ch), ch);
  });

  it('las frases referencian vocabulario existente', () => {
    const ids = new Set(VOCAB.map((v) => v.id));
    for (const s of SENTENCES) {
      assert.ok(s.itemIds.length > 0, s.id);
      for (const id of s.itemIds) assert.ok(ids.has(id), `${s.id}: ${id}`);
    }
  });
});

describe('desafío de unidad', () => {
  it('mezcla tipos y repasa vocabulario de toda la unidad', () => {
    for (const boss of nodes.filter((n) => n.kind === 'boss')) {
      const ex = buildBossLesson(boss.skillIds, content, createRng(3));
      assert.ok(ex.length >= 9, `${boss.id}: ${ex.length}`);
      const kinds = new Set(ex.map((e) => e.kind));
      assert.ok(kinds.has('multiple_choice') && kinds.has('match_pairs') && kinds.has('sentence_order'), boss.id);
    }
  });
});

describe('selección de frases', () => {
  it('nunca usa frases con vocabulario de un nivel superior', () => {
    const levelOf = new Map(VOCAB.map((v) => [v.id, v.level]));
    for (const n of nodes.filter((x) => x.kind !== 'chest' && UNITS.find((u) => u.nodes.includes(x))?.level === 1)) {
      for (const s of pickSentences(n.skillIds, content, 5, createRng(1))) {
        assert.ok(s.itemIds.every((id) => levelOf.get(id) === 1), `${n.id}: ${s.meaning}`);
      }
    }
  });

  it('el desafío de una unidad usa sus propias frases', () => {
    for (const u of UNITS) {
      const boss = u.nodes.find((n) => n.kind === 'boss');
      assert.ok(boss);
      const picked = pickSentences(boss.skillIds, content, 3, createRng(4), u.id);
      assert.ok(picked.every((s) => s.id.startsWith(`${u.id}-`)), `${u.id}: ${picked.map((s) => s.id).join(',')}`);
    }
  });
});

describe('cofres', () => {
  it('siempre dan gemas y respetan el máximo de protectores', () => {
    const rng = createRng(11);
    for (let i = 0; i < 200; i++) {
      const r = rollChest(rng, MAX_FREEZES);
      assert.ok(r.gems >= 12);
      assert.equal(r.freeze, false);
    }
    assert.ok(Array.from({ length: 200 }, () => rollChest(rng, 0)).some((r) => r.freeze));
  });
});

describe('tutor sin conexión', () => {
  it('completa una conversación de unidad con huecos corregidos localmente', () => {
    const scenario = scenarioForNode('u4-ai');
    assert.equal(scenario.id, 'u4-ai');
    const tutor = createOfflineTutor(scenario, SENTENCES, VOCAB, createRng(5));
    let turn = tutor.opening();
    let rounds = 0;
    while (!turn.scenario_complete && rounds < 10) {
      assert.equal(turn.next_task.type, 'fill_gap');
      if (turn.next_task.type !== 'fill_gap') break;
      assert.ok(turn.next_task.options.includes(turn.next_task.answer));
      assert.ok(turn.next_task.template_hanzi.includes('___'));
      // Primera ronda mal a propósito: debe corregir con empatía.
      const choice = rounds === 0 ? turn.next_task.options.find((o) => o !== (turn.next_task as { answer: string }).answer) ?? '' : turn.next_task.answer;
      turn = tutor.reply({ kind: 'gap_choice', choice });
      if (rounds === 0) {
        assert.equal(turn.corrections.length, 1);
        assert.equal(turn.bao_mood, 'encourage');
      }
      rounds++;
    }
    assert.equal(turn.scenario_complete, true);
    assert.equal(rounds, 4);
  });

  it('usa primero las frases de su propia unidad', () => {
    const tutor = createOfflineTutor(scenarioForNode('u1-ai'), SENTENCES, VOCAB, createRng(2));
    let turn = tutor.opening();
    const meanings: string[] = [];
    for (let i = 0; i < 4 && turn.next_task.type === 'fill_gap'; i++) {
      turn = tutor.reply({ kind: 'gap_choice', choice: turn.next_task.answer });
      meanings.push(turn.reply.translation);
    }
    const unit1 = new Set(SENTENCES.filter((s) => s.id.startsWith('u1-')).map((s) => s.meaning));
    assert.ok(meanings.every((m) => unit1.has(m)), meanings.join(' | '));
  });
});
