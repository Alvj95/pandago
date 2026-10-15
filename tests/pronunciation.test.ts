import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { VOCAB } from '@/data/hsk/course';
import { callSummary } from '@/features/call/summary';
import type { ChatMessage } from '@/features/chat/engine/orchestrator';
import { glossPieces } from '@/features/chat/engine/glossary';
import { callScenario } from '@/features/chat/scenarios';
import { gradeScore, gradeSyllables, gradeTips, lightsLine, starsFor } from '@/features/pronunciation/grade';

const syl = (hanzi: string, match: 'ok' | 'tone' | 'miss', heard?: string) => ({ hanzi, tone: null, toneConfidence: 0, gop: match === 'miss' ? 0.2 : 0.9, match, heard });

describe('semáforo de pronunciación', () => {
  it('colorea cada sílaba y da consejos', () => {
    const g = gradeSyllables('你好，我叫宝宝。', 'nǐ hǎo, wǒ jiào bǎobao', {
      transcript: '你好我交宝',
      syllables: [syl('你', 'ok'), syl('好', 'ok'), syl('我', 'ok'), syl('叫', 'tone', '交'), syl('宝', 'miss'), syl('宝', 'ok')],
    });
    assert.deepEqual(g.map((s) => s.light), ['green', 'green', 'green', 'yellow', 'red', 'green']);
    assert.equal(g[3]!.pinyin, 'jiào');
    assert.equal(g[3]!.tone, 4);
    assert.equal(g[3]!.heard, '交');
    assert.equal(lightsLine(g), '🟢你 🟢好 🟢我 🟡叫 🔴宝 🟢宝');
    assert.equal(gradeScore(g), 4.5 / 6);
    const tips = gradeTips(g);
    assert.match(tips[0]!.text, /4\.º tono: cae fuerte/);
    assert.match(tips[1]!.text, /宝 bǎo no se oyó/);
    assert.equal(starsFor(0.9), 3);
    assert.equal(starsFor(0.1), 0);
  });

  it('funciona con servidores antiguos sin «match»', () => {
    const g = gradeSyllables('你好', 'nǐ hǎo', { transcript: '你', syllables: [{ hanzi: '你', tone: 3, toneConfidence: 0.7, gop: 0.9 }, { hanzi: '好', tone: null, toneConfidence: 0, gop: 0.2 }] });
    assert.deepEqual(g.map((s) => s.light), ['green', 'red']);
  });
});

describe('llamada con Bao', () => {
  it('el tema sale de la unidad en la que vas', () => {
    const s = callScenario([]);
    assert.equal(s.persona, 'bao');
    assert.match(s.title, /^Llamada · /);
    assert.match(s.goal, /Llamada de voz/);
  });

  it('el resumen separa lo dicho bien, las correcciones y las palabras', () => {
    const turn = (hanzi: string, corrections: { original: string; corrected: string }[] = []) => ({
      reply: { hanzi, pinyin: '', translation: '' },
      corrections: corrections.map((c) => ({ ...c, explanation: 'x', error_tag: 'grammar:x', severity: 'minor' as const })),
      task_score: 1, bao_mood: 'happy' as const, hint: null, explanation: null, next_task: { type: 'open_question' as const }, used_item_ids: [], scenario_complete: false,
    });
    const messages: ChatMessage[] = [
      { id: '1', from: 'tutor', turn: turn('你想吃什么？') },
      { id: '2', from: 'user', text: '我要吃了米饭' },
      { id: '3', from: 'tutor', turn: turn('好！你喜欢喝茶吗？', [{ original: '我要吃了米饭', corrected: '我要吃米饭' }]) },
      { id: '4', from: 'user', text: '我喜欢喝茶。' },
      { id: '5', from: 'tutor', turn: turn('太好了！') },
    ];
    const s = callSummary(messages, VOCAB, glossPieces);
    assert.equal(s.turns, 2);
    assert.deepEqual(s.good, ['我喜欢喝茶。']);
    assert.deepEqual(s.fixes.map((f) => f.corrected), ['我要吃米饭']);
    assert.ok(s.words.some((w) => w.hanzi === '喜欢'));
    assert.ok(s.words.length <= 6);
  });
});
