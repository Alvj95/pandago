import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInRight, ZoomIn } from 'react-native-reanimated';
import * as Speech from 'expo-speech';
import { Bao } from '@/components/mascot';
import { Button3D, ProgressBar } from '@/components/ui';
import type { VocabItem } from '@/data/hsk/types';
import type { Song } from '@/data/songs';
import { ChoiceTile, type TileState } from '@/features/lesson/components/ChoiceTile';
import { createRng } from '@/features/lesson/engine/random';
import { feedback } from '@/lib/haptics';
import { useTheme } from '@/theme';
import { buildLyricQuiz, starsFor } from '../songVocab';

interface Props {
  song: Song;
  vocab: VocabItem[];
  onDone: (stars: number, correct: number, total: number) => void;
}

/** Reto «completa la letra»: huecos de palabras del curso dentro de la canción. */
export function LyricQuiz({ song, vocab, onDone }: Props) {
  const { c, type, spacing } = useTheme();
  const [seed, setSeed] = useState(() => Date.now());
  const quiz = useMemo(() => buildLyricQuiz(song, vocab, createRng(seed)), [song, vocab, seed]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const q = quiz[index];

  if (done || !q) {
    const stars = starsFor(correct, quiz.length);
    return (
      <View style={[styles.center, { gap: spacing.md, paddingVertical: spacing.xl }]}>
        <Bao mood={stars >= 2 ? 'celebrate' : 'encourage'} size={110} />
        <Animated.Text entering={ZoomIn.springify()} style={styles.stars}>
          {'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}
        </Animated.Text>
        <Text style={[type.title, { color: c.textPrimary }]}>
          {correct} de {quiz.length} correctas
        </Text>
        <View style={{ alignSelf: 'stretch' }}>
          <Button3D
            label="Otra vez"
            onPress={() => {
              setSeed(Date.now());
              setIndex(0);
              setCorrect(0);
              setPicked(null);
              setDone(false);
            }}
          />
        </View>
      </View>
    );
  }

  const answer = (o: string) => {
    if (picked) return;
    setPicked(o);
    const ok = o === q.answer.hanzi;
    void (ok ? feedback.correct() : feedback.wrong());
    if (ok) setCorrect((n) => n + 1);
    Speech.speak(q.line.syllables.map((s) => s.hanzi).join(''), { language: 'zh-CN', rate: 0.8 });
  };

  const next = () => {
    if (index + 1 >= quiz.length) {
      setDone(true);
      onDone(starsFor(correct, quiz.length), correct, quiz.length);
    } else {
      setIndex(index + 1);
      setPicked(null);
    }
  };

  const state = (o: string): TileState => (!picked ? 'idle' : o === q.answer.hanzi ? 'correct' : o === picked ? 'wrong' : 'disabled');

  return (
    <View style={{ gap: spacing.lg }}>
      <ProgressBar progress={(index + (picked ? 1 : 0)) / quiz.length} />
      <Text style={[type.title, { color: c.textPrimary }]}>Completa la letra</Text>
      <Animated.View key={index} entering={FadeInRight} style={{ gap: spacing.xs }}>
        <Text style={[type.hanzi, { color: c.textPrimary, fontSize: 30, lineHeight: 40, textAlign: 'center' }]}>
          {picked ? q.template.split('___').join(q.answer.hanzi) : q.template}
        </Text>
        <Text style={[type.body, { color: c.textSecondary, textAlign: 'center' }]}>«{q.line.es}»</Text>
        {picked && (
          <Text style={[type.caption, { color: c.textSecondary, textAlign: 'center' }]}>
            {q.answer.hanzi} {q.answer.pinyin} · {q.answer.meaning}
          </Text>
        )}
      </Animated.View>
      <View style={[styles.row, { gap: spacing.sm, justifyContent: 'center' }]}>
        {q.options.map((o) => (
          <ChoiceTile key={o} hanzi label={o} state={state(o)} onPress={() => answer(o)} />
        ))}
      </View>
      {picked && <Button3D label={index + 1 >= quiz.length ? 'Ver resultado' : 'Siguiente'} variant={picked === q.answer.hanzi ? 'success' : 'danger'} onPress={next} />}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  stars: { fontSize: 44 },
});
