import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bao } from '@/components/mascot';
import { Card, PressableScale } from '@/components/ui';
import { ACHIEVEMENTS, unlocked } from '@/features/quests/quests';
import { useAchievementFacts } from '@/features/quests/AchievementsCard';
import { useProgressStore } from '@/store/useProgressStore';
import { useTheme } from '@/theme';

type Href = '/achievements' | '/leagues' | '/skills' | '/shop' | '/wardrobe' | '/mic-test' | '/settings';

/** Perfil: quién eres, 3 datos y una lista corta. Los ajustes van en su propia pantalla. */
export function ProfileScreen() {
  const router = useRouter();
  const { c, type, spacing } = useTheme();
  const p = useProgressStore();
  const facts = useAchievementFacts();
  const done = unlocked(facts).length;

  const rows: { icon: string; label: string; href: Href; extra?: string }[] = [
    { icon: '🏅', label: 'Logros', href: '/achievements', extra: `${done}/${ACHIEVEMENTS.length}` },
    { icon: '🏮', label: 'Ligas', href: '/leagues', extra: `Liga ${p.league}` },
    { icon: '📊', label: 'Mis habilidades', href: '/skills' },
    { icon: '🛍️', label: 'Tienda de Bao', href: '/shop', extra: `💎 ${p.gems}` },
    { icon: '👕', label: 'Vestir a Bao', href: '/wardrobe' },
    { icon: '🎙️', label: 'Probar micrófono', href: '/mic-test' },
  ];

  return (
    <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl }}>
        <View style={[styles.row, { gap: spacing.sm }]}>
          <Bao mood="happy" size={64} />
          <View style={styles.flex}>
            <Text style={[type.title, { color: c.textPrimary }]}>Estudiante</Text>
            <Text style={[type.caption, { color: c.textSecondary }]}>
              HSK {p.hskLevel} · Liga {p.league}
            </Text>
          </View>
          <PressableScale onPress={() => router.push('/settings')} accessibilityRole="button" accessibilityLabel="Ajustes" hitSlop={10}>
            <Text style={{ fontSize: 26 }}>⚙️</Text>
          </PressableScale>
        </View>

        <View style={[styles.row, { gap: spacing.sm }]}>
          {[
            { icon: '🔥', value: p.streakDays, label: 'racha' },
            { icon: '⚡', value: p.xpTotal, label: 'XP' },
            { icon: '⭐', value: p.completedNodeIds.length, label: 'lecciones' },
          ].map((s) => (
            <View key={s.label} style={styles.flex}>
              <Card>
                <Text style={[type.title, { color: c.textPrimary, textAlign: 'center' }]}>
                  {s.icon} {s.value}
                </Text>
                <Text style={[type.caption, { color: c.textSecondary, textAlign: 'center' }]}>{s.label}</Text>
              </Card>
            </View>
          ))}
        </View>

        <Card>
          {rows.map((r, i) => (
            <PressableScale key={r.href} onPress={() => router.push(r.href)} accessibilityRole="button" accessibilityLabel={r.label}>
              <View style={[styles.row, styles.listRow, { gap: spacing.sm, borderBottomColor: c.border, borderBottomWidth: i < rows.length - 1 ? 2 : 0 }]}>
                <Text style={styles.icon}>{r.icon}</Text>
                <Text style={[type.body, styles.flex, { color: c.textPrimary, fontFamily: 'Nunito_800ExtraBold' }]}>{r.label}</Text>
                {r.extra ? <Text style={[type.caption, { color: c.textSecondary }]}>{r.extra}</Text> : null}
                <Text style={[type.title, { color: c.textSecondary }]}>›</Text>
              </View>
            </PressableScale>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  listRow: { paddingVertical: 12 },
  icon: { fontSize: 22, width: 30, textAlign: 'center' },
});
