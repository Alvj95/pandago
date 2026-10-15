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
