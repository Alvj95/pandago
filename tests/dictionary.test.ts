import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { VOCAB } from '@/data/hsk/course';
import { isDue, newCard, review } from '@/features/dictionary/cards';
import { plainPinyin, searchVocab } from '@/features/dictionary/search';

const first = (q: string) => searchVocab(q, VOCAB)[0]?.hanzi;

describe('diccionario', () => {
  it('busca en español sin importar tildes', () => {
    assert.equal(first('amigo'), '朋友');
    assert.equal(first('medico'), '医生');
    assert.ok(searchVocab('té', VOCAB).some((v) => v.hanzi === '茶'));
  });

  it('busca en pinyin con o sin tonos y con números', () => {
    assert.equal(first('pengyou'), '朋友');
    assert.equal(first('péngyou'), '朋友');
    assert.equal(first('ni3 hao3'), '你好');
    assert.equal(plainPinyin("nǚ'ér"), 'nuer');
    assert.equal(plainPinyin('nver'), 'nuer');
  });

  it('busca por caracteres', () => {
    assert.equal(first('朋友'), '朋友');
    assert.ok(searchVocab('电', VOCAB).length >= 3);
  });

  it('las tarjetas se espacian según la respuesta', () => {
    const now = 0;
    const c0 = newCard(now);
    assert.ok(isDue(c0, now));
    const good = review(c0, 'good', now);
    assert.equal(good.interval, 1);
    assert.equal(review(good, 'good', now).interval, 2);
    assert.equal(review(c0, 'easy', now).interval, 3);
    const hard = review(good, 'hard', now);
    assert.equal(hard.interval, 0);
    assert.ok(!isDue(hard, now) && isDue(hard, now + 11 * 60 * 1000));
  });
});
