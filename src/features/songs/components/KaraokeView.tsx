import { useEffect, useRef } from 'react';
import { StyleSheet, Switch, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { Bao } from '@/components/mascot';
import { Button3D, PressableScale, ProgressBar } from '@/components/ui';
import type { Song } from '@/data/songs';
import { useTheme } from '@/theme';
import { positionAt } from '../karaoke';
import { ToneSyllable, type SyllableState } from './ToneSyllable';

interface Props {
  song: Song;
  time: number;
  playing: boolean;
  withGuide: boolean;
  onToggleGuide: (on: boolean) => void;
  onPlay: () => void;
  onPause: () => void;
  onRestart: () => void;
  /** Se llama una vez cuando la canción termina entera. */
  onFinished: () => void;
  /** XP ganado al terminar (para mostrarlo). */
  rewardXp: number;
}

/**
 * Karaoke: la línea actual en grande con la sílaba que toca iluminada al ritmo,
 * la siguiente debajo, cuenta atrás al empezar y Bao bailando.
 */
export function KaraokeView({ song, time, playing, withGuide, onToggleGuide, onPlay, onPause, onRestart, onFinished, rewardXp }: Props) {
  const { c, type, spacing, radius } = useTheme();
  const pos = positionAt(song, time);
  const line = song.lines[pos.line];
  const next = song.lines[pos.line + 1];
  const finishedOnce = useRef(false);
  const { width } = useWindowDimensions();
  // Tamaño de sílaba para que la línea quepa en una fila (pantalla − márgenes − relleno de la tarjeta).
  const fit = (count: number, max: number) => Math.max(18, Math.min(max, Math.floor((Math.min(width, 520) - 72) / (count * 1.25))));

  useEffect(() => {
    if (pos.finished && !finishedOnce.current) {
      finishedOnce.current = true;
      onFinished();
    }
    if (time < 1) finishedOnce.current = false;
  }, [pos.finished, time, onFinished]);

  const stateOf = (si: number): SyllableState => (pos.syllable < 0 ? 'idle' : si < pos.syllable ? 'sung' : si === pos.syllable ? 'active' : 'idle');

  if (pos.finished) {
    return (
      <View style={[styles.center, { gap: spacing.lg, paddingVertical: spacing.xl }]}>
        <Bao mood="celebrate" size={130} />
        <Animated.Text entering={ZoomIn.springify()} style={[type.display, { color: c.primary }]}>¡Bravo! 👏</Animated.Text>
        <Text style={[type.title, { color: c.xpText }]}>+{rewardXp} XP</Text>
        <View style={{ alignSelf: 'stretch', gap: spacing.sm }}>
          <Button3D label="Cantar otra vez" onPress={onRestart} />
          <Text style={[type.caption, { color: c.textSecondary, textAlign: 'center' }]}>Prueba sin la voz guía para cantarla tú solo 🎤</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={[styles.center, { minHeight: 120 }]}>
        <Bao mood={playing ? (pos.syllable >= 0 ? 'talking' : 'happy') : 'idle'} size={96} />
        {pos.countdown > 0 && playing && (
          <Animated.Text key={pos.countdown} entering={ZoomIn.duration(200)} style={[styles.countdown, type.display, { color: c.primary }]}>
            {pos.countdown}
          </Animated.Text>
        )}
      </View>

      {/* Línea actual */}
      <View style={[styles.lineCard, { backgroundColor: c.surfaceRaised, borderColor: playing ? c.primary : c.border, borderRadius: radius.lg, padding: spacing.md }]}>
        {line && (
          <Animated.View key={pos.line} entering={FadeIn.duration(180)} style={styles.center}>
            <View style={[styles.wrap, styles.center]}>
              {line.syllables.map((s, si) => (
                <ToneSyllable key={si} syllable={s} size={fit(line.syllables.length, 40)} state={stateOf(si)} />
              ))}
            </View>
            <Text style={[type.body, { color: c.textSecondary, textAlign: 'center', marginTop: spacing.xs }]}>{line.es}</Text>
          </Animated.View>
        )}
      </View>

      {/* Siguiente línea */}
      {next && (
        <View style={[styles.wrap, styles.center, { opacity: 0.8 }]}>
          {next.syllables.map((s, si) => (
            <ToneSyllable key={si} syllable={s} size={fit(next.syllables.length, 22)} state="upcoming" />
          ))}
        </View>
      )}

      <ProgressBar progress={pos.progress} color={c.primary} height={10} />

      <View style={[styles.row, { justifyContent: 'center', gap: spacing.lg }]}>
        <PressableScale onPress={onRestart} accessibilityRole="button" accessibilityLabel="Desde el principio" style={[styles.small, { backgroundColor: c.surfaceSunken }]}>
          <Text style={styles.smallIcon}>⏮️</Text>
        </PressableScale>
        <PressableScale
          onPress={playing ? onPause : onPlay}
          accessibilityRole="button"
          accessibilityLabel={playing ? 'Pausar' : 'Cantar'}
          style={[styles.big, { backgroundColor: c.primary, borderBottomColor: c.primaryLip }]}
        >
          <Text style={styles.bigIcon}>{playing ? '⏸️' : '🎤'}</Text>
        </PressableScale>
        <View style={[styles.small, styles.center]}>
          <Switch value={withGuide} onValueChange={onToggleGuide} trackColor={{ true: c.success, false: c.locked }} accessibilityLabel="Voz guía" />
        </View>
      </View>
      <Text style={[type.caption, { color: c.textSecondary, textAlign: 'center' }]}>
        {withGuide ? '🎵 Con voz guía (la melodía suena)' : '🎤 Solo música: ¡la melodía la pones tú!'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  lineCard: { borderWidth: 2, borderBottomWidth: 6, minHeight: 150, justifyContent: 'center' },
  countdown: { position: 'absolute', fontSize: 64, lineHeight: 72 },
  big: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 5 },
  bigIcon: { fontSize: 38 },
  small: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  smallIcon: { fontSize: 24 },
});
