import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, PressableScale, ProgressBar } from '@/components/ui';
import { exitTo } from '@/lib/navigation';
import { DIMENSIONS, levelDifficulty, pCorrect, topWeaknesses, type Dimension } from '@/features/learning/adaptive/learnerModel';
import { AchievementsCard } from '@/features/quests/AchievementsCard';
import { useLearnerStore } from '@/store/useLearnerStore';
import { useTheme } from '@/theme';

export const DIM_LABEL: Record<Dimension, { label: string; icon: string }> = {
  vocab: { label: 'Vocabulario', icon: '📚' },
  grammar: { label: 'Gramática', icon: '🧩' },
  listening: { label: 'Comprensión oral', icon: '👂' },
  tones: { label: 'Tonos', icon: '🎵' },
  writing: { label: 'Escritura', icon: '✍️' },
  speaking: { label: 'Conversación', icon: '💬' },
};

/** "grammar:jiao-name" → "Gramática · jiao name" */
const humanizeTag = (tag: string) => {
  const [dim, pattern] = tag.split(':');
  return `${DIM_LABEL[dim as Dimension]?.label ?? dim} · ${(pattern ?? '').replace(/-/g, ' ')}`;
};

/** Mis habilidades (modelo del estudiante) o Logros, según `show`. */
export function SkillsScreen({ show }: { show: 'skills' | 'achievements' }) {
  const router = useRouter();
  const { c, type, spacing } = useTheme();
  const model = useLearnerStore((s) => s.model);
  const weaknesses = topWeaknesses(model);

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: c.background }]}>
      <View style={[styles.row, { padding: spacing.md, gap: spacing.sm }]}>
        <PressableScale onPress={() => exitTo(router)} accessibilityRole="button" accessibilityLabel="Volver" hitSlop={10}>
          <Text style={[type.title, { color: c.textSecondary }]}>✕</Text>
        </PressableScale>
        <Text style={[type.title, { color: c.textPrimary }]}>{show === 'skills' ? '📊 Mis habilidades' : '🏅 Logros'}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingTop: 0, gap: spacing.md, paddingBottom: spacing.xxl }}>
        {show === 'achievements' ? <AchievementsCard index={0} /> : null}
        {show === 'skills' ? (
          <>
        <Card index={4}>
          <Text style={[type.title, { color: c.textPrimary, marginBottom: spacing.xs }]}>Tus habilidades en HSK {model.level}</Text>
          <Text style={[type.caption, { color: c.textSecondary, marginBottom: spacing.sm }]}>
            Probabilidad estimada de acertar un ejercicio típico del nivel
          </Text>
          <View style={{ gap: spacing.sm }}>
            {DIMENSIONS.map((d) => {
              const value = pCorrect(model.theta[d], levelDifficulty(model.level));
              return (
                <View key={d} style={{ gap: 4 }}>
                  <View style={styles.between}>
                    <Text style={[type.body, { color: c.textPrimary }]}>
                      {DIM_LABEL[d].icon} {DIM_LABEL[d].label}
                    </Text>
                    <Text style={[type.caption, { color: c.textSecondary }]}>{Math.round(value * 100)}%</Text>
                  </View>
                  <ProgressBar progress={value} color={value >= 0.8 ? c.success : value >= 0.5 ? c.xp : c.danger} height={10} />
                </View>
              );
            })}
          </View>
        </Card>

        {weaknesses.length > 0 && (
          <Card index={5}>
            <Text style={[type.title, { color: c.textPrimary, marginBottom: spacing.xs }]}>Bao te ayudará con…</Text>
            {weaknesses.map((w) => (
              <Text key={w} style={[type.body, { color: c.textSecondary }]}>
                • {humanizeTag(w)}
              </Text>
            ))}
          </Card>
        )}

          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
