import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FlipInEasyX } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExampleRow, HanziTones, PinyinText } from '@/components/learn';
import { Bao } from '@/components/mascot';
import { Button3D, PressableScale, ProgressBar } from '@/components/ui';
import type { VocabItem } from '@/data/hsk/types';
import { feedback } from '@/lib/haptics';
import { speakChinese } from '@/lib/speech';
import { useLearnerStore } from '@/store/useLearnerStore';
import { useWordsStore } from '@/store/useWordsStore';
import { useTheme } from '@/theme';
import type { Grade } from './cards';

/** Sesión de tarjetas: ver el carácter, intentar recordar, girar y valorar. */
export function Flashcards({ words, onDone }: { words: VocabItem[]; onDone: () => void }) {
  const { c, type, spacing, radius } = useTheme();
  const grade = useWordsStore((s) => s.grade);
  const record = useLearnerStore((s) => s.record);
  const [queue, setQueue] = useState(words);
  const [flipped, setFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const card = queue[0];

  useEffect(() => {
    if (card && !flipped) speakChinese(card.hanzi, { force: true });
  }, [card, flipped]);

  const answer = (g: Grade) => {
    if (!card) return;
    grade(card.id, g);
    record({ itemId: card.id, dimension: 'vocab', score: g === 'hard' ? 0.2 : g === 'good' ? 0.8 : 1, difficulty: 0 });
    void (g === 'hard' ? feedback.wrong() : feedback.correct());
    setReviewed((n) => n + 1);
    setFlipped(false);
    // «Difícil» vuelve al final de la sesión.
    setQueue(([first, ...rest]) => (g === 'hard' && first ? [...rest, first] : rest));
  };

  if (!card) {
    return (
      <SafeAreaView style={[styles.flex, styles.center, { backgroundColor: c.background, padding: spacing.lg, gap: spacing.md }]}>
        <Bao mood="celebrate" size={120} />
        <Text style={[type.display, { color: c.textPrimary }]}>¡Repaso hecho!</Text>
        <Text style={[type.body, { color: c.textSecondary, textAlign: 'center' }]}>{reviewed} tarjetas. Las volverás a ver justo antes de olvidarlas.</Text>
        <View style={{ alignSelf: 'stretch' }}>
          <Button3D label="Volver" variant="success" onPress={onDone} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: c.background }]}>
      <View style={[styles.row, { padding: spacing.sm, gap: spacing.sm }]}>
        <PressableScale onPress={onDone} accessibilityRole="button" accessibilityLabel="Salir" hitSlop={12}>
          <Text style={[type.title, { color: c.textSecondary, paddingHorizontal: spacing.xs }]}>✕</Text>
        </PressableScale>
        <View style={styles.flex}>
          <ProgressBar progress={reviewed / Math.max(1, reviewed + queue.length)} />
        </View>
        <Text style={[type.title, { color: c.primary }]}>{queue.length}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, flexGrow: 1, justifyContent: 'center' }}>
        <PressableScale
          onPress={() => setFlipped(true)}
          accessibilityRole="button"
          accessibilityLabel={flipped ? card.meaning : 'Girar tarjeta'}
          style={[styles.card, { backgroundColor: c.surfaceRaised, borderColor: c.border, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm }]}
        >
          <HanziTones hanzi={card.hanzi} pinyin={flipped ? card.pinyin : ''} style={[type.hanzi, { fontSize: 72, lineHeight: 92, color: c.textPrimary }]} />
          {!flipped ? (
            <Text style={[type.caption, { color: c.textSecondary }]}>¿Qué significa? Piénsalo y toca para girar</Text>
          ) : (
            <Animated.View entering={FlipInEasyX.duration(300)} style={[styles.center, { gap: 6 }]}>
              <PinyinText pinyin={card.pinyin} style={[type.display, { fontSize: 28 }]} />
              <Text style={[type.title, { color: c.textPrimary, textAlign: 'center' }]}>{card.meaning}</Text>
              {card.note && <Text style={[type.body, { color: c.textSecondary, textAlign: 'center' }]}>💡 {card.note}</Text>}
            </Animated.View>
          )}
        </PressableScale>
        {flipped && card.example && <ExampleRow example={card.example} />}
      </ScrollView>

      <View style={[styles.footer, { padding: spacing.md, gap: spacing.sm, borderTopColor: c.border }]}>
        {flipped ? (
          <View style={[styles.row, { gap: spacing.sm }]}>
            <View style={styles.flex}>
              <Button3D label="😓 Difícil" variant="danger" onPress={() => answer('hard')} />
            </View>
            <View style={styles.flex}>
              <Button3D label="🙂 Bien" onPress={() => answer('good')} />
            </View>
            <View style={styles.flex}>
              <Button3D label="😎 Fácil" variant="success" onPress={() => answer('easy')} />
            </View>
          </View>
        ) : (
          <Button3D label="Girar tarjeta" onPress={() => setFlipped(true)} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  footer: { borderTopWidth: 2 },
  card: { alignItems: 'center', borderWidth: 2, borderBottomWidth: 5, minHeight: 280, justifyContent: 'center' },
});
