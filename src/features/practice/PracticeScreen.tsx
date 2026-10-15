import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BaoBubble } from '@/components/mascot';
import { Card, PressableScale } from '@/components/ui';
import { ALL_SCENARIOS } from '@/features/chat/scenarios';
import { dueItems } from '@/features/learning/adaptive/srs';
import { useLearnerStore } from '@/store/useLearnerStore';
import { MAX_HEARTS, useProgressStore } from '@/store/useProgressStore';
import { useTheme } from '@/theme';

/** Pestaña "Hablar": todas las conversaciones con IA + repaso inteligente. Aquí nunca se gastan vidas. */
export function PracticeScreen() {
  const { c, type, spacing, radius } = useTheme();
  const router = useRouter();
  const model = useLearnerStore((s) => s.model);
  const due = dueItems(model).length;
  const hearts = useProgressStore((s) => s.hearts);
  const left = useProgressStore((s) => s.challengeHeartsLeft());

  return (
    <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl }}>
        <Text style={[type.display, { color: c.textPrimary }]}>Hablar</Text>
        <BaoBubble mood="talking" message="Aquí practicamos sin miedo: equivocarte no cuesta vidas. ¡Habla todo lo que puedas!" hanzi="我们聊天吧！" pinyin="wǒmen liáotiān ba" />

        <PressableScale onPress={() => router.push('/review')} accessibilityRole="button" accessibilityLabel="Repaso inteligente">
          <Card index={0} tint={c.success} style={{ borderColor: c.successLip }}>
            <View style={[styles.row, { gap: spacing.sm }]}>
              <Text style={styles.icon}>🧠</Text>
              <View style={styles.flex}>
                <Text style={[type.title, styles.onBrand]}>Repaso inteligente</Text>
                <Text style={[type.body, styles.onBrand]}>
                  {due ? `${due} palabras a punto de olvidarse` : 'Ejercicios adaptados a tus puntos débiles'}
                </Text>
              </View>
              <Text style={[type.title, styles.onBrand]}>›</Text>
            </View>
          </Card>
        </PressableScale>

        <PressableScale onPress={() => router.push('/challenge')} accessibilityRole="button" accessibilityLabel="Retos">
          <Card index={1} tint={c.primary} style={{ borderColor: c.primaryLip }}>
            <View style={[styles.row, { gap: spacing.sm }]}>
              <Text style={styles.icon}>⚡</Text>
              <View style={styles.flex}>
                <Text style={[type.title, styles.onBrand]}>Retos rápidos</Text>
                <Text style={[type.body, styles.onBrand]}>
                  {hearts < MAX_HEARTS && left > 0 ? `Gana vidas: te quedan ${left} hoy (${hearts}/${MAX_HEARTS} ❤️)` : 'Relámpago, escucha, verdadero o falso… +5 XP'}
                </Text>
              </View>
              <Text style={[type.title, styles.onBrand]}>›</Text>
            </View>
          </Card>
        </PressableScale>

        <Text style={[type.caption, { color: c.textSecondary, marginTop: spacing.sm }]}>CONVERSACIONES CON IA</Text>
        {ALL_SCENARIOS.map(({ scenario, icon, unitTitle }, i) => (
          <PressableScale
            key={scenario.id}
            accessibilityRole="button"
            accessibilityLabel={scenario.title}
            onPress={() =>
              router.push(scenario.id === 'voice-drill' ? { pathname: '/chat', params: { mode: 'voice' } } : { pathname: '/chat', params: { nodeId: scenario.id } })
            }
          >
            <Card index={i + 2}>
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
