import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PressableScale } from '@/components/ui';
import { dueItems } from '@/features/learning/adaptive/srs';
import { useLearnerStore } from '@/store/useLearnerStore';
import { MAX_HEARTS, useProgressStore } from '@/store/useProgressStore';
import { useTheme } from '@/theme';

type Href =
  | '/review' | '/free-chat' | '/assistant' | '/challenge' | '/call' | '/pronunciation' | '/conversations' | '/tones' | '/shadowing' | '/sing'
  | '/stories' | '/phrases' | '/characters' | '/exam' | '/dictionary';

const ITEMS: { icon: string; label: string; href: Href }[] = [
  { icon: '💬', label: 'Chat Bao', href: '/free-chat' },
  { icon: '🪄', label: 'Asistente', href: '/assistant' },
  { icon: '🧠', label: 'Repaso', href: '/review' },
  { icon: '⚡', label: 'Retos', href: '/challenge' },
  { icon: '📞', label: 'Llamada', href: '/call' },
  { icon: '🚦', label: 'Pronunciar', href: '/pronunciation' },
  { icon: '🎭', label: 'Situaciones', href: '/conversations' },
  { icon: '🎵', label: 'Tonos', href: '/tones' },
  { icon: '🗣️', label: 'Sombra', href: '/shadowing' },
  { icon: '🎤', label: 'Cantar', href: '/sing' },
  { icon: '📖', label: 'Historias', href: '/stories' },
  { icon: '🧳', label: 'Frases', href: '/phrases' },
  { icon: '🈶', label: 'Hanzi', href: '/characters' },
  { icon: '📕', label: 'Palabras', href: '/dictionary' },
  { icon: '📝', label: 'Examen', href: '/exam' },
];

/** Pestaña «Practicar»: iconos como en el móvil. Aquí nunca se gastan vidas. */
export function PracticeScreen() {
  const { c, type, spacing, radius } = useTheme();
  const router = useRouter();
  const model = useLearnerStore((s) => s.model);
  const due = dueItems(model).length;
  const hearts = useProgressStore((s) => s.hearts);
  const left = useProgressStore((s) => s.challengeHeartsLeft());
  const badge = (href: Href) => (href === '/review' && due ? String(due) : href === '/challenge' && hearts < MAX_HEARTS && left > 0 ? '❤️' : null);

  return (
    <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl }}>
        <Text style={[type.display, { color: c.textPrimary }]}>Practicar</Text>
        <Text style={[type.caption, { color: c.textSecondary }]}>Aquí equivocarte no cuesta vidas.</Text>
        <View style={styles.grid}>
          {ITEMS.map((it) => {
            const b = badge(it.href);
            return (
              <PressableScale key={it.href} onPress={() => router.push(it.href)} accessibilityRole="button" accessibilityLabel={it.label} containerStyle={styles.cell}>
                <View style={styles.item}>
                  <View style={[styles.circle, { backgroundColor: c.surface, borderColor: c.border, borderRadius: radius.lg }]}>
                    <Text style={styles.icon}>{it.icon}</Text>
                    {b ? (
                      <View style={[styles.badge, { backgroundColor: c.danger }]}>
                        <Text style={[type.caption, { color: '#fff', fontSize: 10, lineHeight: 14 }]}>{b}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={[type.caption, { color: c.textPrimary, textAlign: 'center' }]} numberOfLines={1}>
                    {it.label}
                  </Text>
                </View>
              </PressableScale>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 18 },
  cell: { width: '25%' },
  item: { alignItems: 'center', gap: 6 },
  circle: { width: 62, height: 62, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderBottomWidth: 4 },
  icon: { fontSize: 30 },
  badge: { position: 'absolute', top: -6, right: -8, minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
});
