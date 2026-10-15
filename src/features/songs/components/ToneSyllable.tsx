import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import type { SongSyllable } from '@/data/songs';
import { useTheme } from '@/theme';
import { TONE_COLORS } from '../toneColors';


export type SyllableState = 'idle' | 'sung' | 'active' | 'upcoming';

interface Props {
  syllable: SongSyllable;
  state: SyllableState;
  size?: number;
}

/** Sílaba de la letra: pinyin coloreado por tono encima del hanzi. La activa da un salto. */
export function ToneSyllable({ syllable, state, size = 30 }: Props) {
  const { c, type } = useTheme();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (state === 'active') scale.set(withSequence(withTiming(1.3, { duration: 90 }), withSpring(1.12, { damping: 12, stiffness: 260, mass: 1 })));
    else scale.set(withTiming(1, { duration: 120 }));
  }, [state, scale]);
  const pop = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  const hanziColor = state === 'active' ? c.primary : state === 'sung' ? c.primary : state === 'upcoming' ? c.textSecondary : c.textPrimary;

  return (
    <Animated.View style={[styles.col, pop]}>
      <Text style={[type.caption, { color: TONE_COLORS[syllable.tone], fontSize: Math.max(11, size * 0.42), opacity: state === 'upcoming' ? 0.6 : 1 }]}>
        {syllable.pinyin}
      </Text>
      <Text style={[type.hanzi, { color: hanziColor, fontSize: size, lineHeight: size * 1.25, opacity: state === 'upcoming' ? 0.55 : 1 }]}>{syllable.hanzi}</Text>
      <View style={[styles.bar, { backgroundColor: state === 'active' ? c.primary : 'transparent' }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  col: { alignItems: 'center', marginHorizontal: 2 },
  bar: { height: 4, width: '70%', borderRadius: 2, marginTop: 2 },
});
