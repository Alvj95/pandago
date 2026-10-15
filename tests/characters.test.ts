import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { VOCAB } from '@/data/hsk/course';
import { CHARS, explain, familyOf, meaningOf } from '@/features/characters/chars';

describe('caracteres con historia', () => {
  it('todos los caracteres del curso tienen ficha con partes y explicación', () => {
    const all = new Set(VOCAB.flatMap((v) => [...v.hanzi]));
    for (const ch of all) {
      const info = CHARS[ch];
      assert.ok(info, ch);
      const e = explain(ch, info);
      assert.ok(e.story || e.sound || info.parts.length <= 1, `${ch} sin explicación`);
      assert.ok(meaningOf(info), `${ch} sin significado`);
    }
  });

  it('explica la parte de significado y la de sonido', () => {
    const e = explain('妈', CHARS['妈']!);
    assert.match(e.sound ?? '', /女 \(mujer\).*马 \(mǎ\).*mā/);
    assert.match(explain('好', CHARS['好']!).story ?? '', /mujer.*niño/);
  });

  it('familias por radical', () => {
    const fam = familyOf('妈');
    assert.ok(fam.includes('她') && fam.includes('姐'));
  });
});
