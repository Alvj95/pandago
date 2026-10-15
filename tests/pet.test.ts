import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { askFor, bump, FOODS, freshPet, gameOfDay, HOUSE_WORDS, learn, lowestNeed, MIN_NEED, moodLine, tick } from '@/features/pet/pet';
import { petScenario } from '@/features/chat/scenarios';
import { syllablesOf } from '@/lib/pinyin';

const H = 3_600_000;
const HAN = /\p{Script=Han}/gu;

describe('casa de Bao', () => {
  it('las necesidades bajan con las horas pero Bao nunca llega a 0', () => {
    const p = tick(freshPet(0), 10 * H);
    assert.equal(p.needs.hunger, 30); // 70 − 4×10
    assert.equal(tick(freshPet(0), 1000 * H).needs.joy, MIN_NEED);
  });

  it('durmiendo recupera energía y lo demás baja más despacio', () => {
    const awake = tick(freshPet(0), 4 * H);
    const asleep = tick({ ...freshPet(0), sleepingSince: 0 }, 4 * H);
    assert.ok(asleep.needs.energy > awake.needs.energy);
    assert.ok(asleep.needs.hunger > awake.needs.hunger);
  });

  it('dice lo que más necesita y aprende palabras sin repetir', () => {
    const hungry = bump(freshPet(0), { hunger: -60 });
    assert.equal(lowestNeed(hungry.needs), 'hunger');
    assert.equal(moodLine(hungry, 12).hanzi, '我饿了！');
    assert.equal(moodLine({ ...hungry, sleepingSince: 1 }, 12).mood, 'sleep');
    const w = learn(learn(learn(freshPet(0), '包子'), '手'), '包子');
    assert.deepEqual(w.words, ['手', '包子']);
    assert.equal(askFor(FOODS.find((f) => f.hanzi === '茶')!).hanzi, '我想喝茶。');
    assert.ok(['numbers', 'colors', 'hide'].includes(gameOfDay(12345)));
  });

  it('cada palabra de la casa tiene una sílaba de pinyin por carácter', () => {
    for (const w of HOUSE_WORDS) assert.equal(syllablesOf(w.pinyin).length, (w.hanzi.match(HAN) ?? []).length, `${w.hanzi} / ${w.pinyin}`);
  });

  it('la charla con IA sabe cómo está Bao', () => {
    const s = petScenario(learn(bump(freshPet(0), { hunger: -60 }), '包子'), 12);
    assert.match(s.goal, /我饿了/);
    assert.match(s.goal, /包子/);
  });
});
