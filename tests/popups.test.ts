import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { UNITS } from '@/data/hsk/course';
import { freshMemory, MAX_POPUPS, nextPopup, tipFrom } from '@/features/lesson/popups';

const rng = () => 0;

describe('Bao aparece en las lecciones', () => {
  it('felicita con 3 seguidas, anima tras 2 fallos y no sale más de 2 veces', () => {
    let mem = freshMemory();
    let r = nextPopup(mem, { correct: true, combo: 3, index: 2, total: 12, tip: null, rng });
    assert.equal(r.line?.kind, 'praise');
    assert.match(r.line!.text, /3 seguidas/);
    mem = r.mem;
    r = nextPopup(mem, { correct: false, combo: 0, index: 3, total: 12, tip: null, rng });
    assert.equal(r.line, null); // nunca en dos ejercicios seguidos
    mem = r.mem;
    r = nextPopup(mem, { correct: false, combo: 0, index: 4, total: 12, tip: null, rng });
    assert.equal(r.line?.kind, 'encourage');
    mem = r.mem;
    assert.equal(mem.shown, MAX_POPUPS);
    r = nextPopup(mem, { correct: true, combo: 5, index: 8, total: 12, tip: null, rng });
    assert.equal(r.line, null);
  });

  it('avisa a mitad de lección y da consejos de la gramática de la unidad', () => {
    const r = nextPopup(freshMemory(), { correct: true, combo: 1, index: 5, total: 12, tip: null, rng });
    assert.equal(r.line?.kind, 'half');
    const note = UNITS.find((u) => u.guide?.notes.length)!.guide!.notes[0]!;
    const tip = tipFrom(note)!;
    assert.match(tip.text, /^💡 /);
    const t = nextPopup(freshMemory(), { correct: true, combo: 1, index: 2, total: 12, tip, rng });
    assert.equal(t.line?.kind, 'tip');
  });
});
