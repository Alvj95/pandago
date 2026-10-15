import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { UNITS, VOCAB } from '@/data/hsk/course';
import { STORIES } from '@/data/stories';
import { glossPieces } from '@/features/chat/engine/glossary';
import { syllablesOf } from '@/lib/pinyin';

const HAN = /\p{Script=Han}/gu;

describe('historias', () => {
  it('tres historias por unidad, ordenadas, con ids únicos y preguntas válidas', () => {
    assert.deepEqual(STORIES.map((s) => s.unitId), UNITS.flatMap((u) => [u.id, u.id, u.id]));
    assert.equal(new Set(STORIES.map((s) => s.id)).size, STORIES.length);
    for (const u of UNITS) assert.ok(u.nodes.some((n) => n.id === `${u.id}-story` && n.kind === 'story'), `${u.id} sin nodo de historias`);
    for (const s of STORIES) {
      assert.ok(s.lines.length >= 5, s.id);
      for (const q of s.questions) {
        assert.ok(q.after >= 0 && q.after < s.lines.length, `${s.id}: after`);
        assert.ok(q.options[q.answer], `${s.id}: answer`);
      }
    }
  });

  it('el pinyin de cada línea tiene una sílaba por carácter', () => {
    for (const s of STORIES)
      for (const l of s.lines) assert.equal(syllablesOf(l.pinyin).length, (l.hanzi.match(HAN) ?? []).length, `${s.id}: ${l.hanzi} / ${l.pinyin}`);
  });

  it('todas las palabras se pueden tocar para ver su significado', () => {
    const unknown = STORIES.flatMap((s) => s.lines.flatMap((l) => glossPieces(l.hanzi, VOCAB).filter((p) => p.han && !p.word).map((p) => `${s.id}:${p.text}`)));
    assert.deepEqual(unknown, []);
  });

  it('las piezas reconstruyen la línea exacta', () => {
    for (const s of STORIES) for (const l of s.lines) assert.equal(glossPieces(l.hanzi, VOCAB).map((p) => p.text).join(''), l.hanzi);
  });
});
