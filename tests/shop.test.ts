import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { HELPERS, isUnlocked, itemById, OUTFIT, SLOTS } from '@/features/shop/items';

describe('tienda de Bao', () => {
  it('cada prenda tiene hueco válido, id único y precio o logro', () => {
    assert.equal(new Set(OUTFIT.map((i) => i.id)).size, OUTFIT.length);
    for (const i of OUTFIT) {
      assert.ok(SLOTS.some((s) => s.slot === i.slot), i.id);
      assert.ok(i.price > 0 || i.unlock, `${i.id} sin precio ni logro`);
    }
    assert.ok(HELPERS.every((h) => h.price > 0));
    assert.equal(itemById('scarf')?.slot, 'neck');
  });

  it('las coronas se desbloquean aprobando el simulacro', () => {
    const crown = itemById('crown-hsk1')!;
    assert.equal(isUnlocked(crown, {}, 120), false);
    assert.equal(isUnlocked(crown, { 'hsk1-short': 119 }, 120), false);
    assert.equal(isUnlocked(crown, { 'hsk1-short': 150 }, 120), true);
    assert.equal(isUnlocked(itemById('crown-hsk2')!, { hsk1: 200 }, 120), false);
    assert.equal(isUnlocked(itemById('glasses')!, {}, 120), true);
  });
});

import { baoLines, greeting } from '@/features/home/baoLines';

describe('Bao vivo en el inicio', () => {
  const base = { hour: 22, day: 0, streakDays: 6, xpToday: 0, dailyGoalXp: 30, dueCount: 0, pendingChests: 0, hearts: 5, maxHearts: 5, wordsPracticed: 0 };
  it('saluda según la hora y menciona la racha', () => {
    assert.equal(greeting(8).hanzi, '早上好！');
    assert.equal(greeting(15).hanzi, '下午好！');
    assert.equal(greeting(2).hanzi, '晚上好！');
    const [first] = baoLines(base);
    assert.match(first!.message, /Buenas noches! Llevas 6 días de racha 🔥 ¿Una lección antes de dormir\?/);
  });
  it('propone acciones según lo pendiente', () => {
    const lines = baoLines({ ...base, dueCount: 3, pendingChests: 1, hearts: 2, xpToday: 40 });
    const routes = lines.map((l) => l.action?.route).filter(Boolean);
    assert.deepEqual(routes.slice(0, 3), ['/chest/daily', '/review', '/challenge']);
    assert.ok(lines.some((l) => /Meta de hoy cumplida/.test(l.message)));
  });
});

import { VOCAB } from '@/data/hsk/course';
import { askContextOf, offlineAnswer, quickQuestions } from '@/features/lesson/askContext';

describe('Pregúntale a Bao', () => {
  it('saca la frase del ejercicio y responde sin conexión con lo que sabe la app', () => {
    const ctx = askContextOf({ kind: 'sentence_order', id: 'x', itemIds: [], instruction: '', meaning: 'Ya he comido.', pinyin: 'wǒ chī le fàn', solution: ['我', '吃', '了', '饭'], bank: [] }, VOCAB);
    assert.deepEqual(ctx, { hanzi: '我吃了饭', pinyin: 'wǒ chī le fàn', translation: 'Ya he comido.' });
    assert.equal(quickQuestions({ kind: 'sentence_order', id: 'x', itemIds: [], instruction: '', meaning: '', pinyin: '', solution: [], bank: [] }, ctx)[0], '¿Por qué va en este orden?');
    assert.match(offlineAnswer('¿Cómo se pronuncia?', ctx, VOCAB), /wǒ chī le fàn/);
    const v = VOCAB.find((x) => x.example)!;
    assert.match(offlineAnswer('Dame otro ejemplo', { hanzi: v.hanzi }, VOCAB), new RegExp(v.example!.hanzi));
  });
});
