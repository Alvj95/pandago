import { useEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UNITS } from '@/data/hsk/course';
import { useProgressStore } from '@/store/useProgressStore';
import { useTheme } from '@/theme';
import { LearningPath } from './components/LearningPath';
import { TopStatusBar } from './components/TopStatusBar';
import { useOpenNode } from './useOpenNode';

/** Pestaña «Camino»: solo el camino de unidades y lecciones. */
export function HomeScreen() {
  const { c, spacing } = useTheme();
  const tick = useProgressStore((s) => s.tick);
  const openNode = useOpenNode();

  // Regenera vidas / evalúa la racha al entrar.
  useEffect(() => tick(), [tick]);

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: c.background }]}>
      <TopStatusBar />
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl * 2 }} showsVerticalScrollIndicator={false}>
        <LearningPath units={UNITS} onOpenNode={openNode} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
