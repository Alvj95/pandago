import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HanziTones, PinyinText } from '@/components/learn';
import { PressableScale } from '@/components/ui';
import { type Phrase, SITUATIONS } from '@/data/phrases';
import { exitTo } from '@/lib/navigation';
import { speakChinese } from '@/lib/speech';
import { useTheme } from '@/theme';

/** Frases para viajar por situación, con audio normal y lento y un modo «mostrar en grande» para enseñar el móvil. */
export function PhrasebookScreen() {
  const { c, type, spacing, radius } = useTheme();
  const router = useRouter();
  const [sid, setSid] = useState(SITUATIONS[0]!.id);
  const [big, setBig] = useState<Phrase | null>(null);
  const situation = SITUATIONS.find((s) => s.id === sid) ?? SITUATIONS[0]!;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: c.background }]}>
      <View style={[styles.row, { padding: spacing.sm, borderBottomWidth: 2, borderBottomColor: c.border }]}>
        <PressableScale onPress={() => exitTo(router)} accessibilityRole="button" accessibilityLabel="Cerrar" hitSlop={12}>
          <Text style={[type.title, { color: c.textSecondary, paddingHorizontal: spacing.sm }]}>✕</Text>
        </PressableScale>
        <Text style={[type.title, { color: c.textPrimary }]}>🧳 Frases de supervivencia</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsBar} contentContainerStyle={{ padding: spacing.sm, gap: spacing.xs }}>
        {SITUATIONS.map((s) => {
          const active = s.id === sid;
          return (
            <PressableScale
              key={s.id}
              onPress={() => setSid(s.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[styles.tab, { borderRadius: radius.pill, borderColor: active ? c.primary : c.border, backgroundColor: active ? c.primarySoft : c.surface }]}
            >
              <Text style={[type.caption, { color: active ? c.primary : c.textSecondary }]}>
                {s.icon} {s.title}
              </Text>
            </PressableScale>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xl }}>
        {situation.note && (
          <View style={{ backgroundColor: c.primarySoft, borderRadius: radius.sm, padding: spacing.sm }}>
            <Text style={[type.body, { color: c.textPrimary }]}>💡 {situation.note}</Text>
          </View>
        )}
        {situation.phrases.map((p) => (
          <View key={p.hanzi} style={[styles.card, { backgroundColor: c.surfaceRaised, borderColor: c.border, borderRadius: radius.md, padding: spacing.sm, gap: 4 }]}>
            <Pressable onPress={() => speakChinese(p.hanzi, { force: true })} accessibilityRole="button" accessibilityLabel={`Escuchar: ${p.es}`}>
              <HanziTones hanzi={p.hanzi} pinyin={p.pinyin} style={[type.hanzi, { fontSize: 24, lineHeight: 34 }]} />
              <PinyinText pinyin={p.pinyin} style={[type.caption, { fontSize: 14 }]} />
              <Text style={[type.body, { color: c.textPrimary }]}>{p.es}</Text>
              {p.tip && <Text style={[type.caption, { color: c.textSecondary }]}>💡 {p.tip}</Text>}
            </Pressable>
            <View style={[styles.row, { gap: spacing.xs, marginTop: 4 }]}>
              <Action label="🔊 Escuchar" onPress={() => speakChinese(p.hanzi, { force: true })} />
              <Action label="🐢 Lento" onPress={() => speakChinese(p.hanzi, { force: true, rate: 0.5 })} />
              <Action label="🔍 En grande" onPress={() => setBig(p)} />
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={!!big} animationType="fade" onRequestClose={() => setBig(null)} supportedOrientations={['portrait', 'landscape']}>
        <Pressable onPress={() => setBig(null)} style={[styles.flex, styles.center, { backgroundColor: c.surface, padding: spacing.lg, gap: spacing.md }]} accessibilityLabel="Cerrar">
          {big && (
            <>
              <Text style={[type.hanzi, { fontSize: 64, lineHeight: 84, color: c.textPrimary, textAlign: 'center' }]}>{big.hanzi}</Text>
              <PinyinText pinyin={big.pinyin} style={[type.display, { fontSize: 26, textAlign: 'center' }]} />
              <Text style={[type.title, { color: c.textSecondary, textAlign: 'center' }]}>{big.es}</Text>
              <Text style={[type.caption, { color: c.textSecondary }]}>Toca para cerrar</Text>
            </>
          )}
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function Action({ label, onPress }: { label: string; onPress: () => void }) {
  const { c, type, radius } = useTheme();
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" style={[styles.action, { borderColor: c.border, borderRadius: radius.sm, backgroundColor: c.surface }]}>
      <Text style={[type.caption, { color: c.textPrimary }]}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  tabsBar: { flexGrow: 0 },
  tab: { borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 6 },
  card: { borderWidth: 2, borderBottomWidth: 4 },
  action: { borderWidth: 1.5, paddingHorizontal: 10, paddingVertical: 6 },
});
