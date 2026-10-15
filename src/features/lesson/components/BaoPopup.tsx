import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { BaoFull } from '@/components/mascot';
import { PressableScale } from '@/components/ui';
import { speakChinese } from '@/lib/speech';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTheme } from '@/theme';
import type { PopupLine } from '../popups';

const SIZE = 104;
const SHOW_MS = 4200;

/** Bao asoma por la derecha, saluda, dice algo en chino y se va solo (o al tocarlo). */
export function BaoPopup({ line, onDone }: { line: PopupLine | null; onDone: () => void }) {
  const { c, type, radius, spacing } = useTheme();
  const reduce = useReducedMotion() || useSettingsStore.getState().reduceMotion;
  const x = useSharedValue(SIZE + 40);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));

  useEffect(() => {
    if (!line) return;
    const ease = { duration: reduce ? 0 : 520, easing: Easing.out(Easing.cubic) };
    x.set(withTiming(0, ease));
    speakChinese(line.hanzi.replace(/[💡]/gu, ''));
    const t = setTimeout(() => {
      x.set(withTiming(SIZE + 40, { duration: reduce ? 0 : 380 }));
      setTimeout(onDone, reduce ? 0 : 400);
    }, SHOW_MS);
    return () => clearTimeout(t);
  }, [line, x, reduce, onDone]);

  if (!line) return null;
  const tint = line.kind === 'encourage' ? c.info : line.kind === 'tip' ? c.xp : c.primary;
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <Animated.View style={[styles.row, style]} pointerEvents="box-none">
        <View style={[styles.bubble, { backgroundColor: c.surfaceRaised, borderColor: tint, borderRadius: radius.md, padding: spacing.sm }]} accessibilityLiveRegion="polite">
          <Text style={[type.hanzi, { color: tint, fontSize: 20, lineHeight: 26 }]}>{line.hanzi}</Text>
          {line.pinyin ? <Text style={[type.caption, { color: c.textSecondary }]}>{line.pinyin}</Text> : null}
          <Text style={[type.caption, { color: c.textPrimary }]}>{line.text}</Text>
        </View>
        <PressableScale onPress={onDone} accessibilityRole="button" accessibilityLabel="Bao. Toca para que se vaya">
          <BaoFull size={SIZE} action={line.kind === 'encourage' ? 'idle' : line.kind === 'tip' ? 'wave' : 'hop'} mood={line.kind === 'encourage' ? 'encourage' : 'happy'} />
        </PressableScale>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', right: 0, bottom: 200, left: 0, alignItems: 'flex-end' },
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  bubble: { maxWidth: 220, borderWidth: 2, marginBottom: 60, marginRight: -6 },
});
