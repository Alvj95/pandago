import { StyleSheet, Text, View } from 'react-native';
import { PressableScale } from '@/components/ui';
import { VOCAB } from '@/data/hsk/course';
import type { VocabItem } from '@/data/hsk/types';
import { speakChinese } from '@/lib/speech';
import { useTheme } from '@/theme';
import { ExampleRow, HanziTones, PinyinText } from './ToneText';

const SINGLE = new Map(VOCAB.filter((v) => [...v.hanzi].length === 1).map((v) => [v.hanzi, v]));

/** Ficha didáctica de una palabra: pronunciación por tonos, significado, caracteres, nota de uso y ejemplo. */
export function WordCard({ word }: { word: VocabItem }) {
  const { c, type, spacing, radius } = useTheme();
  const chars = [...word.hanzi];
  const parts = chars.length > 1 ? chars.map((ch) => ({ ch, v: SINGLE.get(ch) })) : [];

  return (
    <View style={{ gap: spacing.md }}>
      <View style={[styles.row, { gap: spacing.md }]}>
        <PressableScale
          onPress={() => speakChinese(word.hanzi, { force: true })}
          accessibilityRole="button"
          accessibilityLabel={`Escuchar ${word.pinyin}`}
          style={[styles.hero, { backgroundColor: c.surfaceRaised, borderColor: c.border, borderRadius: radius.md, padding: spacing.md }]}
        >
          <HanziTones hanzi={word.hanzi} pinyin={word.pinyin} style={[type.hanzi, { fontSize: 64, lineHeight: 80, color: c.textPrimary }]} />
          <Text style={[type.caption, { color: c.textSecondary }]}>🔊 Toca para escuchar</Text>
        </PressableScale>
        <View style={[styles.flex, { gap: 4 }]}>
          <PinyinText pinyin={word.pinyin} style={[type.display, { fontSize: 30, lineHeight: 36 }]} />
          <Text style={[type.title, { color: c.textPrimary }]}>{word.meaning}</Text>
          <Text style={[type.caption, { color: c.textSecondary }]}>HSK {word.level} · tonos {word.tones.map((t) => (t === 5 ? '·' : t)).join(' ')}</Text>
        </View>
      </View>

      {parts.some((p) => p.v) && (
        <View style={{ gap: spacing.xs }}>
          <Text style={[type.caption, { color: c.textSecondary }]}>CARÁCTER A CARÁCTER</Text>
          <View style={[styles.wrap, { gap: spacing.xs }]}>
            {parts.map(({ ch, v }, i) => (
              <View key={i} style={[styles.chip, { borderColor: c.border, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4 }]}>
                <Text style={[type.hanzi, { fontSize: 20, lineHeight: 28, color: c.textPrimary }]}>{ch}</Text>
                <Text style={[type.caption, { color: c.textSecondary, flexShrink: 1 }]}>{v ? `${v.pinyin} · ${v.meaning}` : '—'}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {word.note && (
        <View style={[styles.note, { backgroundColor: c.primarySoft, borderRadius: radius.sm, padding: spacing.sm, gap: 2 }]}>
          <Text style={[type.caption, { color: c.primary }]}>💡 CÓMO SE USA</Text>
          <Text style={[type.body, { color: c.textPrimary }]}>{word.note}</Text>
        </View>
      )}

      {word.example && (
        <View style={{ gap: spacing.xs }}>
          <Text style={[type.caption, { color: c.textSecondary }]}>EJEMPLO</Text>
          <ExampleRow example={word.example} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  hero: { alignItems: 'center', borderWidth: 2, borderBottomWidth: 4, minWidth: 120 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, maxWidth: '100%' },
  note: {},
});
