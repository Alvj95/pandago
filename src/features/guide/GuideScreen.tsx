import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GrammarNoteCard, HanziTones, PinyinText } from '@/components/learn';
import { Bao } from '@/components/mascot';
import { Button3D, PressableScale } from '@/components/ui';
import { VOCAB } from '@/data/hsk/course';
import type { Unit } from '@/data/hsk/types';
import { exitTo } from '@/lib/navigation';
import { speakChinese } from '@/lib/speech';
import { useTheme } from '@/theme';

/** Guía de la unidad: qué vas a aprender, gramática explicada con ejemplos, cultura y vocabulario completo. */
export function GuideScreen({ unit }: { unit: Unit }) {
  const { c, type, spacing, radius } = useTheme();
  const router = useRouter();
  const ids = new Set(unit.nodes.find((n) => n.kind === 'boss')?.skillIds ?? []);
  const words = VOCAB.filter((v) => ids.has(v.id));
  const face = c[unit.color];

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: c.background }]}>
      <View style={[styles.header, { padding: spacing.sm, borderBottomColor: c.border }]}>
        <PressableScale onPress={() => exitTo(router)} accessibilityRole="button" accessibilityLabel="Cerrar" hitSlop={12}>
          <Text style={[type.title, { color: c.textSecondary, paddingHorizontal: spacing.sm }]}>✕</Text>
        </PressableScale>
        <Text style={[type.title, styles.flex, { color: c.textPrimary }]}>📘 Guía de la unidad</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: spacing.lg * 2 }}>
        <View style={[styles.row, { gap: spacing.sm, backgroundColor: face, borderRadius: radius.md, padding: spacing.md }]}>
          <Bao mood="talking" size={64} />
          <View style={styles.flex}>
            <Text style={[type.caption, styles.onBrand]}>HSK {unit.level} · UNIDAD {unit.index}</Text>
            <Text style={[type.title, styles.onBrand]}>{unit.title}</Text>
            <Text style={[type.body, styles.onBrand]}>{unit.guide.intro}</Text>
          </View>
        </View>

        <Text style={[type.display, { color: c.textPrimary, fontSize: 22 }]}>Gramática</Text>
        {unit.guide.notes.map((n, i) => (
          <GrammarNoteCard key={n.title} note={n} index={i} />
        ))}

        <View style={{ backgroundColor: c.surfaceSunken, borderRadius: radius.md, padding: spacing.md, gap: 4 }}>
          <Text style={[type.title, { color: c.textPrimary }]}>🏮 Cultura</Text>
          <Text style={[type.body, { color: c.textPrimary }]}>{unit.guide.culture}</Text>
        </View>

        <Text style={[type.display, { color: c.textPrimary, fontSize: 22 }]}>Vocabulario ({words.length})</Text>
        <Text style={[type.caption, { color: c.textSecondary }]}>Colores de los tonos: 1.º rojo · 2.º naranja · 3.º verde · 4.º azul · neutro gris. Toca una palabra para oírla.</Text>
        {words.map((w) => (
          <PressableScale
            key={w.id}
            onPress={() => speakChinese(w.hanzi, { force: true })}
            accessibilityRole="button"
            accessibilityLabel={`${w.pinyin}: ${w.meaning}`}
            style={[styles.word, { gap: spacing.sm, padding: spacing.sm, borderRadius: radius.sm, borderColor: c.border, backgroundColor: c.surfaceRaised }]}
          >
            <HanziTones hanzi={w.hanzi} pinyin={w.pinyin} style={[type.hanzi, { fontSize: 26, lineHeight: 34, minWidth: 64 }]} />
            <View style={styles.flex}>
              <PinyinText pinyin={w.pinyin} style={type.title} />
              <Text style={[type.body, { color: c.textPrimary }]}>{w.meaning}</Text>
              {w.note && <Text style={[type.caption, { color: c.textSecondary }]}>💡 {w.note}</Text>}
              {w.example && (
                <Text style={[type.caption, { color: c.textSecondary }]}>
                  {w.example.hanzi} — {w.example.meaning}
                </Text>
              )}
            </View>
          </PressableScale>
        ))}

        <Button3D label="¡Entendido!" variant="success" onPress={() => exitTo(router)} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2 },
  onBrand: { color: '#FFFFFF' },
  word: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5 },
});
