import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SENTENCES, UNITS, VOCAB } from '@/data/hsk/course';
import { createOfflineTutor } from '@/features/chat/engine/offlineTutor';
import { glossSentence } from '@/features/chat/engine/glossary';
import { scenarioForNode } from '@/features/chat/scenarios';
import { buildLesson, grade } from '@/features/lesson/engine/exerciseFactory';
import { createRng } from '@/features/lesson/engine/random';
import { syllablesOf } from '@/lib/pinyin';
import strokes from '@/data/strokes/hsk.strokes.json';

const HAN = /\p{Script=Han}/gu;

describe('contenido explicativo', () => {
  it('cada unidad tiene guía con introducción, ≥3 notas de gramática con ejemplos y cultura', () => {
    for (const u of UNITS) {
      assert.ok(u.guide.intro.length > 40, u.title);
      assert.ok(u.guide.culture.length > 40, u.title);
      assert.ok(u.guide.notes.length >= 3, u.title);
      for (const n of u.guide.notes) {
        assert.ok(n.pattern && n.body.length > 40 && n.examples.length >= 1, `${u.title}: ${n.title}`);
      }
    }
  });

  it('todas las palabras tienen frase de ejemplo que las contiene', () => {
    for (const v of VOCAB) {
      assert.ok(v.example, `${v.hanzi} sin ejemplo`);
      assert.ok(v.example.hanzi.includes(v.hanzi), `${v.hanzi}: ${v.example.hanzi}`);
    }
  });

  it('el pinyin de frases y ejemplos tiene una sílaba por carácter (salvo 儿 de erhua)', () => {
    const all = [
      ...SENTENCES.map((s) => ({ hanzi: s.tokens.join(''), pinyin: s.pinyin })),
      ...UNITS.flatMap((u) => u.guide.notes.flatMap((n) => n.examples)),
    ];
    for (const e of all) {
      const chars = (e.hanzi.match(HAN) ?? []).filter((ch, i, arr) => !(ch === '儿' && i === arr.length - 1));
      assert.equal(syllablesOf(e.pinyin).length, chars.length, `${e.hanzi} / ${e.pinyin}`);
    }
  });

  it('las correcciones explican la palabra (pinyin y significado)', () => {
    const content = { vocab: VOCAB, sentences: SENTENCES, strokeChars: new Set(Object.keys(strokes)) };
    const lesson = buildLesson(UNITS[0]!.nodes[0]!.skillIds, content, createRng(3), 'u1');
    const mc = lesson.find((e) => e.kind === 'multiple_choice');
    assert.ok(mc && mc.kind === 'multiple_choice');
    assert.match(grade(mc, { kind: 'choice', index: -1 }).explain ?? '', /\(.+\) = /);
    const so = lesson.find((e) => e.kind === 'sentence_order');
    assert.ok(so);
    assert.match(grade(so, { kind: 'order', tokens: [] }).explain ?? '', /«.+»/);
  });
});

describe('chat explicativo', () => {
  it('desglosa una frase palabra por palabra con el vocabulario', () => {
    const g = glossSentence('你叫什么名字？', VOCAB);
    assert.deepEqual(g.map((x) => x.hanzi), ['你', '叫', '什么', '名字']);
    assert.ok(g.every((x) => x.word));
    assert.equal(glossSentence('我们一起练习吧。', VOCAB).find((x) => x.hanzi === '练习')?.word?.meaning, 'practicar');
  });

  it('el tutor sin conexión explica cada respuesta', () => {
    const node = UNITS[0]!.nodes.find((n) => n.kind === 'conversation')!;
    const tutor = createOfflineTutor(scenarioForNode(node.id), SENTENCES, VOCAB, createRng(1));
    assert.ok(tutor.opening().explanation);
    const t = tutor.reply({ kind: 'gap_choice', choice: '???' });
    assert.match(t.explanation ?? '', /significa/);
    assert.ok(t.corrections[0]?.explanation);
  });
});
