import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ACHIEVEMENTS, bump, dailyQuests, questDone, unlocked, weekKey } from '@/features/quests/quests';

describe('misiones y logros', () => {
  it('3 misiones al día, una de XP, iguales todo el día y distintas entre días', () => {
    const a = dailyQuests('2026-10-15');
    assert.equal(a.length, 3);
    assert.equal(new Set(a.map((q) => q.id)).size, 3);
    assert.equal(a.filter((q) => q.event === 'xp').length, 1);
    assert.deepEqual(dailyQuests('2026-10-15'), a);
    const week = ['2026-10-16', '2026-10-17', '2026-10-18', '2026-10-19'].map((d) => dailyQuests(d).map((q) => q.id).join());
    assert.ok(new Set(week).size > 1);
  });

  it('los contadores suman, y la racha de aciertos guarda el máximo', () => {
    let c = bump({}, 'xp', 10);
    c = bump(c, 'xp', 25);
    assert.equal(c.xp, 35);
    c = bump(c, 'combo', 7);
    c = bump(c, 'combo', 3);
    assert.equal(c.combo, 7);
    assert.ok(questDone({ id: 'x', icon: '', title: '', event: 'xp', target: 30, gems: 1 }, c));
  });

  it('la semana empieza el lunes', () => {
    assert.equal(weekKey(new Date(2026, 9, 15).getTime()), '2026-10-12'); // jueves → lunes 12
    assert.equal(weekKey(new Date(2026, 9, 18).getTime()), '2026-10-12'); // domingo
    assert.equal(weekKey(new Date(2026, 9, 19).getTime()), '2026-10-19'); // lunes
  });

  it('los logros se desbloquean con los contadores', () => {
    assert.equal(unlocked({ lifetime: {}, words: 0 }).length, 0);
    const ids = unlocked({ lifetime: { lesson: 1, streak: 8 }, words: 120 }).map((a) => a.id);
    assert.deepEqual(ids.sort(), ['first', 'streak7', 'words100'].sort());
    assert.equal(new Set(ACHIEVEMENTS.map((a) => a.id)).size, ACHIEVEMENTS.length);
  });
});
