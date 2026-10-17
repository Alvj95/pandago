import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { VOCAB } from '@/data/hsk/course';
import { startFrom } from '@/features/assistant/startParams';
import { baoSvg } from '@/features/widget/baoSvg';
import { ASSIST, widgetMood, wordOfDay } from '@/features/widget/widgetData';

describe('Bao Asistente y widget', () => {
  it('sabe cómo se abrió: voz, cámara, texto o foto compartidos', () => {
    assert.deepEqual(startFrom({ uri: ASSIST.voice }), { voice: true, camera: false, text: undefined, imageUri: undefined });
    assert.equal(startFrom({ uri: ASSIST.camera }).camera, true);
    assert.equal(startFrom({ uri: ASSIST.word('熊猫') }).text, '¿Qué significa 熊猫 y cómo se usa?');
    const shared = startFrom({ uri: '', text: '你周末有空吗？' });
    assert.equal(shared.text, '你周末有空吗？');
    assert.equal(shared.voice, false);
    assert.equal(startFrom({ uri: '', image: 'content://foto' }).imageUri, 'content://foto');
  });

  it('palabra del día estable durante el día y cara de Bao según cómo está', () => {
    const a = wordOfDay(VOCAB, 20000);
    assert.equal(wordOfDay(VOCAB, 20000).id, a.id);
    assert.notEqual(wordOfDay(VOCAB, 20001).id, a.id);
    assert.ok(a.level <= 2);
    assert.equal(widgetMood({ hunger: 30, joy: 90 }, 12), 'hungry');
    assert.equal(widgetMood({ hunger: 90 }, 12), 'happy');
    assert.equal(widgetMood(null, 2), 'sleep');
    for (const m of ['happy', 'hungry', 'sleep'] as const) assert.match(baoSvg(m), /^<svg[\s\S]*<\/svg>$/);
  });
});
