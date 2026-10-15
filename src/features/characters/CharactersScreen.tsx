import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bao } from '@/components/mascot';
import { PressableScale } from '@/components/ui';
import { UNITS, VOCAB } from '@/data/hsk/course';
import { exitTo } from '@/lib/navigation';
import { useProgressStore } from '@/store/useProgressStore';
import { useTheme } from '@/theme';
import { CHARS } from './chars';

/** Los caracteres del curso agrupados por unidad: toca uno para ver su historia. */
export function CharactersScreen() {
  const { c, type, spacing, radius } = useTheme();
  const router = useRouter();
  const completed = useProgressStore((s) => s.completedNodeIds);
  const seen = new Set<string>();
  const groups = UNITS.map((u) => {
    const ids = new Set(u.nodes.find((n) => n.kind === 'boss')?.skillIds);
    const chars = VOCAB.filter((v) => ids.has(v.id))
      .flatMap((v) => [...v.hanzi])
      .filter((ch) => CHARS[ch] && !seen.has(ch) && (seen.add(ch), true));
    return { unit: u, chars, started: u.nodes.some((n) => completed.includes(n.id)) };
  });

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: c.background }]}>
      <View style={[styles.row, { padding: spacing.sm, borderBottomWidth: 2, borderBottomColor: c.border }]}>
        <PressableScale onPress={() => exitTo(router)} accessibilityRole="button" accessibilityLabel="Cerrar" hitSlop={12}>
          <Text style={[type.title, { color: c.textSecondary, paddingHorizontal: spacing.sm }]}>✕</Text>
        </PressableScale>
        <Text style={[type.title, { color: c.textPrimary }]}>🈶 Caracteres con historia</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl }}>
        <View style={[styles.row, { gap: spacing.sm }]}>
          <Bao mood="talking" size={56} />
          <Text style={[type.body, styles.flex, { color: c.textSecondary }]}>
            Cada carácter está hecho de piezas con significado. Conocerlas te ayuda a recordarlos: 好 = 女 (mujer) + 子 (niño).
          </Text>
        </View>
        {groups.map(({ unit, chars, started }) => (
          <View key={unit.id} style={{ gap: spacing.xs }}>
            <Text style={[type.caption, { color: started ? c.primary : c.textSecondary }]}>
              HSK {unit.level} · UNIDAD {unit.index} · {unit.title.toUpperCase()}
              {started ? ' · EN CURSO' : ''}
            </Text>
            <View style={[styles.grid, { gap: 6 }]}>
              {chars.map((ch) => (
                <PressableScale
                  key={ch}
                  onPress={() => router.push({ pathname: '/character/[c]', params: { c: ch } })}
                  accessibilityRole="button"
                  accessibilityLabel={`${ch}, ${CHARS[ch]?.py ?? ''}`}
                  style={[styles.cell, { borderRadius: radius.sm, borderColor: CHARS[ch]?.story ? c.primary : c.border, backgroundColor: c.surfaceRaised }]}
                >
                  <Text style={[type.hanzi, { fontSize: 26, lineHeight: 34, color: c.textPrimary }]}>{ch}</Text>
                  <Text style={[type.caption, { color: c.textSecondary, fontSize: 11 }]}>{CHARS[ch]?.py}</Text>
                </PressableScale>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: 58, height: 64, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderBottomWidth: 3 },
});
