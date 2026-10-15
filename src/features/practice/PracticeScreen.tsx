import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BaoBubble } from '@/components/mascot';
import { Card, PressableScale } from '@/components/ui';
import { ALL_SCENARIOS } from '@/features/chat/scenarios';
import { dueItems } from '@/features/learning/adaptive/srs';
import { useLearnerStore } from '@/store/useLearnerStore';
import { MAX_HEARTS, useProgressStore } from '@/store/useProgressStore';
import { useWordsStore } from '@/store/useWordsStore';
import { isDue } from '@/features/dictionary/cards';
import { useTheme } from '@/theme';

/** Pestaña «Practicar»: repaso, retos, historias, tonos, diccionario y conversaciones con IA. Aquí nunca se gastan vidas. */
export function PracticeScreen() {
  const { c, type, spacing, radius } = useTheme();
  const router = useRouter();
  const model = useLearnerStore((s) => s.model);
  const due = dueItems(model).length;
  const hearts = useProgressStore((s) => s.hearts);
  const left = useProgressStore((s) => s.challengeHeartsLeft());
  const cards = useWordsStore((s) => s.cards);
  const saved = Object.keys(cards).length;
  const savedDue = Object.values(cards).filter((card) => isDue(card, Date.now())).length;

  return (
    <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl }}>
        <Text style={[type.display, { color: c.textPrimary }]}>Practicar</Text>
        <BaoBubble mood="talking" message="Aquí practicamos sin miedo: equivocarte no cuesta vidas. ¡Habla todo lo que puedas!" hanzi="我们聊天吧！" pinyin="wǒmen liáotiān ba" />

        <Text style={[type.caption, { color: c.textSecondary, marginTop: spacing.sm }]}>REPASAR Y GANAR VIDAS</Text>
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

        <PressableScale onPress={() => router.push('/dictionary')} accessibilityRole="button" accessibilityLabel="Diccionario y Mis palabras">
          <Card index={2}>
            <View style={[styles.row, { gap: spacing.sm }]}>
              <Text style={styles.icon}>📕</Text>
              <View style={styles.flex}>
                <Text style={[type.title, { color: c.textPrimary }]}>Diccionario y Mis palabras</Text>
                <Text style={[type.body, { color: c.textSecondary }]}>
                  {saved ? `${saved} palabras guardadas${savedDue ? ` · ${savedDue} para repasar` : ''}` : 'Busca en español, pinyin o caracteres y guarda con ⭐'}
                </Text>
              </View>
              <Text style={[type.title, { color: c.textSecondary }]}>›</Text>
            </View>
          </Card>
        </PressableScale>

        <Text style={[type.caption, { color: c.textSecondary, marginTop: spacing.sm }]}>LEER Y ESCUCHAR</Text>
        <PressableScale onPress={() => router.push('/stories')} accessibilityRole="button" accessibilityLabel="Historias con Bao">
          <Card index={3} tint={c.league} style={{ borderColor: c.league }}>
            <View style={[styles.row, { gap: spacing.sm }]}>
              <Text style={styles.icon}>📖</Text>
              <View style={styles.flex}>
                <Text style={[type.title, styles.onBrand]}>Historias con Bao</Text>
                <Text style={[type.body, styles.onBrand]}>16 mini cuentos con audio: toca las palabras y responde</Text>
              </View>
              <Text style={[type.title, styles.onBrand]}>›</Text>
            </View>
          </Card>
        </PressableScale>

        <PressableScale onPress={() => router.push('/phrases')} accessibilityRole="button" accessibilityLabel="Frases de supervivencia">
          <Card index={4}>
            <View style={[styles.row, { gap: spacing.sm }]}>
              <Text style={styles.icon}>🧳</Text>
              <View style={styles.flex}>
                <Text style={[type.title, { color: c.textPrimary }]}>Frases de supervivencia</Text>
                <Text style={[type.body, { color: c.textSecondary }]}>Restaurante, taxi, hotel, emergencias… listas para usar en China</Text>
              </View>
              <Text style={[type.title, { color: c.textSecondary }]}>›</Text>
            </View>
          </Card>
        </PressableScale>

        <Text style={[type.caption, { color: c.textSecondary, marginTop: spacing.sm }]}>PRONUNCIAR</Text>
        <PressableScale onPress={() => router.push('/tones')} accessibilityRole="button" accessibilityLabel="Entrenador de tonos">
          <Card index={5} tint={c.info} style={{ borderColor: c.info }}>
            <View style={[styles.row, { gap: spacing.sm }]}>
              <Text style={styles.icon}>🎵</Text>
              <View style={styles.flex}>
                <Text style={[type.title, styles.onBrand]}>Entrenador de tonos</Text>
                <Text style={[type.body, styles.onBrand]}>Escucha y reconoce los 4 tonos, parejas y el tono neutro</Text>
              </View>
              <Text style={[type.title, styles.onBrand]}>›</Text>
            </View>
          </Card>
        </PressableScale>

        <PressableScale onPress={() => router.push('/shadowing')} accessibilityRole="button" accessibilityLabel="Sombra">
          <Card index={6}>
            <View style={[styles.row, { gap: spacing.sm }]}>
              <Text style={styles.icon}>🗣️</Text>
              <View style={styles.flex}>
                <Text style={[type.title, { color: c.textPrimary }]}>Sombra: repite como un nativo</Text>
                <Text style={[type.body, { color: c.textSecondary }]}>Escucha, grábate y compara tu voz con la de Bao</Text>
              </View>
              <Text style={[type.title, { color: c.textSecondary }]}>›</Text>
            </View>
          </Card>
        </PressableScale>

        <Text style={[type.caption, { color: c.textSecondary, marginTop: spacing.sm }]}>CARACTERES Y EXAMEN</Text>
        <PressableScale onPress={() => router.push('/characters')} accessibilityRole="button" accessibilityLabel="Caracteres con historia">
          <Card index={7}>
            <View style={[styles.row, { gap: spacing.sm }]}>
              <Text style={styles.icon}>🈶</Text>
              <View style={styles.flex}>
                <Text style={[type.title, { color: c.textPrimary }]}>Caracteres con historia</Text>
                <Text style={[type.body, { color: c.textSecondary }]}>Sus partes, una historia para recordarlos y practicar trazos</Text>
              </View>
              <Text style={[type.title, { color: c.textSecondary }]}>›</Text>
            </View>
          </Card>
        </PressableScale>

        <PressableScale onPress={() => router.push('/exam')} accessibilityRole="button" accessibilityLabel="Simulacro HSK">
          <Card index={8}>
            <View style={[styles.row, { gap: spacing.sm }]}>
              <Text style={styles.icon}>📝</Text>
              <View style={styles.flex}>
                <Text style={[type.title, { color: c.textPrimary }]}>Simulacro HSK</Text>
                <Text style={[type.body, { color: c.textSecondary }]}>Examen con el formato oficial de HSK 1 y HSK 2, con nota sobre 200</Text>
              </View>
              <Text style={[type.title, { color: c.textSecondary }]}>›</Text>
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
