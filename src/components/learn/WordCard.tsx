import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PressableScale } from '@/components/ui';
import { VOCAB } from '@/data/hsk/course';
import type { VocabItem } from '@/data/hsk/types';
import { speakChinese } from '@/lib/speech';
import { CHARS, explain } from '@/features/characters/chars';
import { useTheme } from '@/theme';
import { StarButton } from './StarButton';
import { ExampleRow, HanziTones, PinyinText } from './ToneText';

const SINGLE = new Map(VOCAB.filter((v) => [...v.hanzi].length === 1).map((v) => [v.hanzi, v]));

/** Ficha didáctica de una palabra: pronunciación por tonos, significado, caracteres, nota de uso y ejemplo. */
export function WordCard({ word }: { word: VocabItem }) {
  const { c, type, spacing, radius } = useTheme();
  const chars = [...word.hanzi];
  const router = useRouter();
  const parts = chars.map((ch) => ({ ch, v: SINGLE.get(ch), info: CHARS[ch] }));
  // Pista corta del primer carácter con historia, como gancho para abrir su ficha.
  const hook = parts.map((p) => (p.info ? explain(p.ch, p.info) : null)).find((e) => e?.story || e?.sound);

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
        <StarButton id={word.id} size={28} />
      </View>

      {parts.some((p) => p.info) && (
        <View style={{ gap: spacing.xs }}>
          <Text style={[type.caption, { color: c.textSecondary }]}>CARÁCTER A CARÁCTER · TOCA PARA VER SU HISTORIA</Text>
          <View style={[styles.wrap, { gap: spacing.xs }]}>
            {parts.map(({ ch, v, info }, i) => (
              <PressableScale
                key={i}
                disabled={!info}
                onPress={() => router.push({ pathname: '/character/[c]', params: { c: ch } })}
                accessibilityRole="button"
                accessibilityLabel={`Historia de ${ch}`}
                style={[styles.chip, { borderColor: info ? c.primary : c.border, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4 }]}
              >
                <Text style={[type.hanzi, { fontSize: 20, lineHeight: 28, color: c.textPrimary }]}>{ch}</Text>
                <Text style={[type.caption, { color: c.textSecondary, flexShrink: 1 }]}>
                  {v ? `${v.pinyin} · ${v.meaning}` : info ? `${info.py} ·` : ''} 🈶
                </Text>
              </PressableScale>
            ))}
          </View>
          {hook && <Text style={[type.caption, { color: c.textPrimary }]}>🈶 {hook.story ?? hook.sound}</Text>}
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
