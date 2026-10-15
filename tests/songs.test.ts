import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { describe, it } from 'node:test';
import { VOCAB } from '@/data/hsk/course';
import { SONGS } from '@/data/songs';
import { createRng } from '@/features/lesson/engine/random';
import { lineWindow, positionAt, secondsPerBeat } from '@/features/songs/karaoke';
import { buildLyricQuiz, songVocab, starsFor, wordsIn } from '@/features/songs/songVocab';

describe('canciones', () => {
  it('cada sílaba tiene un hanzi, su pinyin y tiempos crecientes sin solaparse', () => {
    assert.ok(SONGS.length >= 5);
    for (const song of SONGS) {
      let prevEnd = song.countIn;
      for (const line of song.lines) {
        assert.ok(line.syllables.length > 0, song.id);
        for (const s of line.syllables) {
          assert.equal([...s.hanzi].length, 1, `${song.id}: ${s.hanzi}`);
          assert.match(s.pinyin, /^[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]+$/i, `${song.id}: ${s.pinyin}`);
          assert.ok(Math.abs(s.start - prevEnd) < 1e-6, `${song.id}: hueco antes de ${s.hanzi}`);
          prevEnd = s.start + s.beats;
        }
        assert.ok(Math.abs(line.end - prevEnd) < 1e-6);
      }
      assert.ok(Math.abs(song.durationSec - song.totalBeats * secondsPerBeat(song)) < 0.01);
    }
  });

  it('cada canción tiene sus dos pistas de audio', () => {
    for (const song of SONGS) {
      for (const kind of ['guide', 'karaoke']) assert.ok(existsSync(`assets/songs/${song.id}-${kind}.mp3`), `${song.id}-${kind}`);
    }
  });

  it('las canciones usan vocabulario del curso', () => {
    for (const song of SONGS) assert.ok(songVocab(song, VOCAB).length >= 3, song.id);
    assert.deepEqual(wordsIn('你好你好', VOCAB).map((v) => v.hanzi), ['你好', '你好']);
  });
});

describe('karaoke', () => {
  const song = SONGS.find((s) => s.id === 'liang-zhi-laohu');
  assert.ok(song);
  const spb = secondsPerBeat(song);

  it('cuenta atrás antes de empezar', () => {
    const p = positionAt(song, 0.1);
    assert.equal(p.syllable, -1);
    assert.equal(p.countdown, song.countIn);
    assert.equal(positionAt(song, (song.countIn - 0.5) * spb).countdown, 1);
  });

  it('ilumina la sílaba correcta en cada instante', () => {
    for (const [li, line] of song.lines.entries()) {
      for (const [si, s] of line.syllables.entries()) {
        const p = positionAt(song, (s.start + s.beats / 2) * spb);
        assert.deepEqual([p.line, p.syllable, p.countdown], [li, si, 0], `${s.hanzi}`);
      }
    }
  });

  it('termina al final y la ventana de línea es coherente', () => {
    assert.equal(positionAt(song, song.durationSec + 0.1).finished, true);
    const [a, b] = lineWindow(song, 1);
    assert.ok(b > a && a >= song.countIn * spb);
  });
});

describe('reto de la letra', () => {
  it('genera huecos con la respuesta entre las opciones', () => {
    for (const song of SONGS) {
      const quiz = buildLyricQuiz(song, VOCAB, createRng(3));
      assert.ok(quiz.length >= 3, `${song.id}: ${quiz.length}`);
      for (const q of quiz) {
        assert.ok(q.template.includes('___'));
        assert.ok(!q.template.includes(q.answer.hanzi), `${song.id}: la respuesta se ve en «${q.template}»`);
        assert.ok(q.options.includes(q.answer.hanzi));
        assert.equal(new Set(q.options).size, q.options.length);
      }
    }
    assert.equal(starsFor(5, 5), 3);
    assert.equal(starsFor(3, 5), 2);
    assert.equal(starsFor(1, 5), 1);
  });
});
