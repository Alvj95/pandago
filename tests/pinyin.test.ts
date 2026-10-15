import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { VOCAB } from '@/data/hsk/course';
import { pinyinSegments, syllablesOf } from '@/lib/pinyin';

const split = (p: string) => syllablesOf(p).map((s) => s.text).join('·');

describe('pinyin', () => {
  it('separa sílabas difíciles', () => {
    assert.equal(split('fànguǎn'), 'fàn·guǎn');
    assert.equal(split('kěnéng'), 'kě·néng');
    assert.equal(split('píngguǒ'), 'píng·guǒ');
    assert.equal(split('xǐhuan'), 'xǐ·huan');
    assert.equal(split('zěnmeyàng'), 'zěn·me·yàng');
    assert.equal(split("nǚ'ér"), 'nǚ·ér');
  });

  it('detecta el tono de cada sílaba y respeta la puntuación', () => {
    const segs = pinyinSegments('Nǐ jiào shénme míngzi?');
    assert.deepEqual(segs.filter((s) => s.tone).map((s) => s.tone), [3, 4, 2, 5, 2, 5]);
    assert.equal(segs.map((s) => s.text).join(''), 'Nǐ jiào shénme míngzi?');
  });

  it('cada palabra del curso se divide en tantas sílabas como caracteres', () => {
    const bad = VOCAB.filter((v) => syllablesOf(v.pinyin).length !== [...v.hanzi].length).map((v) => `${v.hanzi}=${split(v.pinyin)}`);
    assert.deepEqual(bad, []);
  });
});
