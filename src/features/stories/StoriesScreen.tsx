import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bao } from '@/components/mascot';
import { Card, PressableScale } from '@/components/ui';
import { UNITS } from '@/data/hsk/course';
import { STORIES } from '@/data/stories';
import { exitTo } from '@/lib/navigation';
import { useProgressStore } from '@/store/useProgressStore';
import { useStoryStore } from '@/store/useStoryStore';
import { useTheme } from '@/theme';

/** Lista de historias: una por unidad; se recomienda la de la unidad en curso. */
export function StoriesScreen() {
  const { c, type, spacing, radius } = useTheme();
  const router = useRouter();
  const done = useStoryStore((s) => s.done);
  const completed = useProgressStore((s) => s.completedNodeIds);
  const started = (unitId: string) => UNITS.find((u) => u.id === unitId)?.nodes.some((n) => completed.includes(n.id)) ?? false;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: c.background }]}>
      <View style={[styles.row, { padding: spacing.sm, borderBottomWidth: 2, borderBottomColor: c.border }]}>
        <PressableScale onPress={() => exitTo(router)} accessibilityRole="button" accessibilityLabel="Cerrar" hitSlop={12}>
          <Text style={[type.title, { color: c.textSecondary, paddingHorizontal: spacing.sm }]}>✕</Text>
        </PressableScale>
        <Text style={[type.title, { color: c.textPrimary }]}>📖 Historias con Bao</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}>
        <View style={[styles.row, { gap: spacing.sm, marginBottom: spacing.xs }]}>
          <Bao mood="talking" size={56} />
          <Text style={[type.body, styles.flex, { color: c.textSecondary }]}>
            Pequeñas historias con las palabras de cada unidad. Escúchalas, toca cualquier palabra para ver qué significa y responde a las preguntas.
          </Text>
        </View>
        {STORIES.map((s, i) => {
          const unit = UNITS.find((u) => u.id === s.unitId);
          const result = done[s.id];
          return (
            <PressableScale key={s.id} onPress={() => router.push({ pathname: '/story/[id]', params: { id: s.id } })} accessibilityRole="button" accessibilityLabel={s.title}>
              <Card index={Math.min(i, 6)}>
                <View style={[styles.row, { gap: spacing.sm }]}>
                  <View style={[styles.badge, { backgroundColor: result ? c.successSoft : c.primarySoft, borderRadius: radius.md }]}>
                    <Text style={styles.icon}>{s.icon}</Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={[type.caption, { color: c.textSecondary }]}>
                      HSK {unit?.level} · UNIDAD {unit?.index} · {unit?.title.toUpperCase()}
                    </Text>
                    <Text style={[type.title, { color: c.textPrimary }]}>{s.title}</Text>
                    <Text style={[type.caption, { color: result ? c.success : started(s.unitId) ? c.primary : c.textSecondary }]}>
                      {result ? `✅ Leída · ${result.correct}/${result.total} preguntas` : started(s.unitId) ? '⭐ Recomendada para ti' : `${s.lines.length} líneas · ${s.questions.length} preguntas`}
                    </Text>
                  </View>
                  <Text style={[type.title, { color: c.textSecondary }]}>›</Text>
                </View>
              </Card>
            </PressableScale>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  badge: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 28 },
});
