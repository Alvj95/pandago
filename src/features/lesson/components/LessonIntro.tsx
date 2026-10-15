import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { GrammarNoteCard, WordCard } from '@/components/learn';
import { Bao } from '@/components/mascot';
import { Button3D, PressableScale, ProgressBar } from '@/components/ui';
import type { Unit, VocabItem } from '@/data/hsk/types';
import { speakChinese } from '@/lib/speech';
import { useTheme } from '@/theme';

interface Props {
  words: VocabItem[];
  /** En la primera lección de cada unidad se presenta además su gramática. */
  unit?: Unit;
  onDone: () => void;
  onClose: () => void;
}

type Page = { kind: 'unit' } | { kind: 'grammar'; index: number } | { kind: 'word'; word: VocabItem };

/** «Aprende antes de practicar»: Bao presenta la unidad, su gramática y cada palabra nueva con ejemplos. */
export function LessonIntro({ words, unit, onDone, onClose }: Props) {
  const { c, type, spacing } = useTheme();
  const pages: Page[] = [
    ...(unit ? [{ kind: 'unit' } as const, ...unit.guide.notes.map((_, index) => ({ kind: 'grammar', index }) as const)] : []),
    ...words.map((word) => ({ kind: 'word', word }) as const),
  ];
  const [i, setI] = useState(0);
  const page = pages[i];
  const last = i === pages.length - 1;

  useEffect(() => {
    if (page?.kind === 'word') speakChinese(page.word.hanzi);
  }, [page]);

  if (!page) return null;
  const wordIndex = page.kind === 'word' ? words.indexOf(page.word) : -1;
  const heading =
    page.kind === 'unit' ? `Unidad ${unit?.index}: ${unit?.title}` : page.kind === 'grammar' ? 'Gramática de la unidad' : `Palabra nueva ${wordIndex + 1} de ${words.length}`;

  return (
    <View style={styles.flex}>
      <View style={[styles.header, { padding: spacing.sm, gap: spacing.sm }]}>
        <PressableScale onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar" hitSlop={12}>
          <Text style={[type.title, { color: c.textSecondary, paddingHorizontal: spacing.xs }]}>✕</Text>
        </PressableScale>
        <View style={styles.flex}>
          <ProgressBar progress={(i + 1) / pages.length} />
        </View>
        <PressableScale onPress={onDone} accessibilityRole="button" hitSlop={12}>
          <Text style={[type.caption, { color: c.info }]}>SALTAR</Text>
        </PressableScale>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
        <View style={[styles.row, { gap: spacing.sm }]}>
          <Bao mood="talking" size={56} />
          <View style={styles.flex}>
            <Text style={[type.caption, { color: c.textSecondary }]}>APRENDE ANTES DE PRACTICAR</Text>
            <Text style={[type.title, { color: c.textPrimary }]}>{heading}</Text>
          </View>
        </View>

        <Animated.View key={i} entering={FadeInRight.duration(220)} style={{ gap: spacing.md }}>
          {page.kind === 'unit' && unit && (
            <>
              <Text style={[type.body, { color: c.textPrimary, fontSize: 17, lineHeight: 24 }]}>{unit.guide.intro}</Text>
              <Text style={[type.caption, { color: c.textSecondary }]}>EN ESTA UNIDAD APRENDERÁS</Text>
              {unit.guide.notes.map((n) => (
                <Text key={n.title} style={[type.body, { color: c.textPrimary }]}>
                  ✅ {n.title} <Text style={{ color: c.primary }}>({n.pattern})</Text>
                </Text>
              ))}
              <Text style={[type.body, { color: c.textSecondary }]}>🏮 {unit.guide.culture}</Text>
            </>
          )}
          {page.kind === 'grammar' && unit?.guide.notes[page.index] && <GrammarNoteCard note={unit.guide.notes[page.index]!} index={page.index} />}
          {page.kind === 'word' && <WordCard word={page.word} />}
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { padding: spacing.md, gap: spacing.sm, borderTopColor: c.border }]}>
        {i > 0 && (
          <View style={styles.back}>
            <Button3D label="Atrás" variant="ghost" onPress={() => setI(i - 1)} />
          </View>
        )}
        <View style={styles.flex}>
          <Button3D label={last ? '¡A practicar! 💪' : 'Siguiente'} variant={last ? 'success' : 'primary'} onPress={() => (last ? onDone() : setI(i + 1))} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center' },
  footer: { flexDirection: 'row', borderTopWidth: 2 },
  back: { width: 110 },
});
