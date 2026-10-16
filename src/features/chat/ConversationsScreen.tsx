import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, PressableScale } from '@/components/ui';
import { exitTo } from '@/lib/navigation';
import { useTheme } from '@/theme';
import { ALL_SCENARIOS } from './scenarios';

/** Todas las conversaciones con IA (libre, pronunciación y las de cada unidad). */
export function ConversationsScreen() {
  const { c, type, spacing, radius } = useTheme();
  const router = useRouter();
  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: c.background }]}>
      <View style={[styles.row, { padding: spacing.md, gap: spacing.sm }]}>
        <PressableScale onPress={() => exitTo(router)} accessibilityRole="button" accessibilityLabel="Volver" hitSlop={10}>
          <Text style={[type.title, { color: c.textSecondary }]}>✕</Text>
        </PressableScale>
        <Text style={[type.title, { color: c.textPrimary }]}>🎭 Situaciones con IA</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingTop: 0, gap: spacing.md, paddingBottom: spacing.xxl }}>
        {ALL_SCENARIOS.map(({ scenario, icon, unitTitle }, i) => (
          <PressableScale
            key={scenario.id}
            accessibilityRole="button"
            accessibilityLabel={scenario.title}
            onPress={() =>
              router.push(scenario.id === 'voice-drill' ? { pathname: '/chat', params: { mode: 'voice' } } : { pathname: '/chat', params: { nodeId: scenario.id } })
            }
          >
            <Card index={Math.min(i + 4, 8)}>
              <View style={[styles.row, { gap: spacing.sm }]}>
                <View style={[styles.badge, { backgroundColor: scenario.persona === 'bao' ? c.primarySoft : c.successSoft, borderRadius: radius.md }]}>
                  <Text style={styles.icon}>{icon}</Text>
                </View>
                <View style={styles.flex}>
                  <Text style={[type.caption, { color: c.textSecondary }]}>{unitTitle.toUpperCase()}</Text>
                  <Text style={[type.title, { color: c.textPrimary }]}>{scenario.title}</Text>
                  <Text style={[type.body, { color: c.textSecondary }]} numberOfLines={2}>
                    {scenario.goal}
                  </Text>
                  <Text style={[type.caption, { color: scenario.persona === 'bao' ? c.primary : c.success, marginTop: 4 }]}>
                    {scenario.persona === 'bao' ? '🐼 Con Bao' : `🧑 Con un nativo · ${scenario.role ?? ''}`}
                  </Text>
                </View>
              </View>
            </Card>
          </PressableScale>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { fontSize: 30 },
  badge: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  onBrand: { color: '#FFFFFF' },
});
