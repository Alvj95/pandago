import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import * as Speech from 'expo-speech';
import { Card, PressableScale } from '@/components/ui';
import type { VocabItem } from '@/data/hsk/types';
import type { Song } from '@/data/songs';
import { useTheme } from '@/theme';
import { lineWindow, positionAt } from '../karaoke';
import { TONE_COLORS } from '../toneColors';
import { ToneSyllable } from './ToneSyllable';

interface Props {
  song: Song;
  vocab: VocabItem[];
  time: number;
  /** Tramo que suena ahora con «escuchar línea» (null si ninguno). */
  segment: [number, number] | null;
  onPlayLine: (start: number, end: number) => void;
}

/**
 * «Aprende la letra»: palabras clave de la canción y cada línea con pinyin
 * coloreado por tono. Se puede escuchar la melodía de una línea (y se ilumina
 * al ritmo) o su pronunciación hablada, más lenta.
 */
export function LyricsView({ song, vocab, time, segment, onPlayLine }: Props) {
  const { c, type, spacing, radius } = useTheme();
  const pos = segment ? positionAt(song, time) : null;
  const { width } = useWindowDimensions();
  const fit = (count: number) => Math.max(16, Math.min(28, Math.floor((Math.min(width, 520) - 72) / (count * 1.25))));

  return (
    <View style={{ gap: spacing.md }}>
      <Card index={0}>
        <Text style={[type.caption, { color: c.textSecondary, marginBottom: spacing.xs }]}>PALABRAS DE LA CANCIÓN</Text>
        <View style={[styles.wrap, { gap: spacing.xs }]}>
          {vocab.map((v) => (
            <PressableScale
              key={v.id}
              onPress={() => Speech.speak(v.hanzi, { language: 'zh-CN', rate: 0.8 })}
              accessibilityLabel={`${v.hanzi}, ${v.pinyin}, ${v.meaning}`}
              style={[styles.chip, { backgroundColor: c.primarySoft, borderRadius: radius.pill }]}
            >
              <Text style={[type.hanzi, { fontSize: 18, lineHeight: 24, color: c.primary }]}>{v.hanzi}</Text>
              <Text style={[type.caption, { color: c.textSecondary }]}>{v.meaning}</Text>
            </PressableScale>
          ))}
        </View>
        <View style={[styles.wrap, { gap: spacing.sm, marginTop: spacing.sm }]}>
          {([1, 2, 3, 4] as const).map((t) => (
            <Text key={t} style={[type.caption, { color: TONE_COLORS[t] }]}>● tono {t}</Text>
          ))}
        </View>
      </Card>

      {song.lines.map((line, i) => {
        const [start, end] = lineWindow(song, i);
        const playingThis = segment !== null && Math.abs(segment[0] - start) < 1e-3;
        return (
          <Card key={i} index={Math.min(i + 1, 6)} style={playingThis ? { borderColor: c.primary } : undefined}>
            <View style={[styles.wrap, styles.center]}>
              {line.syllables.map((s, si) => (
                <ToneSyllable key={si} syllable={s} size={fit(line.syllables.length)} state={playingThis && pos?.line === i ? (si < pos.syllable ? 'sung' : si === pos.syllable ? 'active' : 'idle') : 'idle'} />
              ))}
            </View>
            <Text style={[type.body, { color: c.textSecondary, textAlign: 'center', marginTop: spacing.xs }]}>{line.es}</Text>
            <View style={[styles.row, { gap: spacing.sm, marginTop: spacing.sm, justifyContent: 'center' }]}>
              <PressableScale onPress={() => onPlayLine(start, end)} accessibilityRole="button" accessibilityLabel="Escuchar la melodía de esta línea" style={[styles.action, { backgroundColor: c.primary, borderRadius: radius.pill }]}>
                <Text style={[type.caption, { color: c.textOnBrand }]}>🎵 Melodía</Text>
              </PressableScale>
              <PressableScale
                onPress={() => Speech.speak(line.syllables.map((s) => s.hanzi).join(''), { language: 'zh-CN', rate: 0.7 })}
                accessibilityRole="button"
                accessibilityLabel="Escuchar la pronunciación hablada"
                style={[styles.action, { backgroundColor: c.info, borderRadius: radius.pill }]}
              >
                <Text style={[type.caption, { color: c.textOnBrand }]}>🗣️ Pronunciar</Text>
              </PressableScale>
            </View>
          </Card>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  center: { justifyContent: 'center' },
  row: { flexDirection: 'row' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center' },
  action: { paddingHorizontal: 14, paddingVertical: 8 },
});
