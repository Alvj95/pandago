import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SITUATIONS } from '@/data/phrases';
import { syllablesOf } from '@/lib/pinyin';

const HAN = /\p{Script=Han}/gu;

describe('frases de supervivencia', () => {
  it('8 situaciones con frases y pinyin alineado (erhua incluida)', () => {
    assert.equal(SITUATIONS.length, 8);
    for (const s of SITUATIONS) {
      assert.ok(s.phrases.length >= 6, s.id);
      for (const p of s.phrases) {
        const syl = syllablesOf(p.pinyin);
        // 儿 de erhua (yìdiǎnr, zhèr) no es una sílaba aparte.
        const erhua = syl.filter((x) => /[^e]r$/i.test(x.text)).length;
        assert.equal(syl.length, (p.hanzi.match(HAN) ?? []).length - erhua, `${p.hanzi} / ${p.pinyin}`);
      }
    }
  });
});
