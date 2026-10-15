import { StyleSheet, Text, type StyleProp, type TextStyle, View } from 'react-native';
import { PressableScale } from '@/components/ui';
import type { Example } from '@/data/hsk/types';
import { speakChinese } from '@/lib/speech';
import { pinyinSegments, syllablesOf } from '@/lib/pinyin';
import { TONE_COLORS } from '@/features/songs/toneColors';
import { useTheme } from '@/theme';

const HAN = /\p{Script=Han}/u;

/** Pinyin con cada sílaba coloreada según su tono (1 rojo, 2 naranja, 3 verde, 4 azul, neutro gris). */
export function PinyinText({ pinyin, style }: { pinyin: string; style?: StyleProp<TextStyle> }) {
  return (
    <Text style={style}>
      {pinyinSegments(pinyin).map((s, i) => (
        <Text key={i} style={s.tone ? { color: TONE_COLORS[s.tone] } : undefined}>
          {s.text}
        </Text>
      ))}
    </Text>
  );
}

/** Hanzi coloreados por tono usando el pinyin de la misma frase (si las sílabas cuadran). */
export function HanziTones({ hanzi, pinyin, style }: { hanzi: string; pinyin: string; style?: StyleProp<TextStyle> }) {
  const tones = syllablesOf(pinyin).map((s) => s.tone);
  const chars = [...hanzi];
  const fits = chars.filter((ch) => HAN.test(ch)).length === tones.length;
  let k = 0;
  return (
    <Text style={style}>
      {chars.map((ch, i) => {
        const tone = fits && HAN.test(ch) ? tones[k++] : null;
        return (
          <Text key={i} style={tone ? { color: TONE_COLORS[tone] } : undefined}>
            {ch}
          </Text>
        );
      })}
    </Text>
  );
}

/** Frase de ejemplo: hanzi por tonos, pinyin, traducción y botón para escucharla. */
export function ExampleRow({ example, size = 22 }: { example: Example; size?: number }) {
  const { c, type, spacing, radius } = useTheme();
  return (
    <PressableScale
      onPress={() => speakChinese(example.hanzi, { force: true, rate: 0.75 })}
      accessibilityRole="button"
      accessibilityLabel={`Escuchar: ${example.meaning}`}
      style={[styles.row, { gap: spacing.sm, padding: spacing.sm, borderRadius: radius.sm, backgroundColor: c.surfaceSunken }]}
    >
      <View style={styles.flex}>
        <HanziTones hanzi={example.hanzi} pinyin={example.pinyin} style={[type.hanzi, { fontSize: size, lineHeight: size * 1.35, color: c.textPrimary }]} />
        <PinyinText pinyin={example.pinyin} style={[type.caption, { fontSize: 14 }]} />
        <Text style={[type.body, { color: c.textSecondary }]}>{example.meaning}</Text>
      </View>
      <Text style={styles.speaker}>🔊</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  speaker: { fontSize: 22 },
});
