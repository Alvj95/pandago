import Svg, { Circle, Path } from 'react-native-svg';
import type { Tone } from '@/features/chat/engine/tones';
import { TONE_COLORS } from '@/features/songs/toneColors';

const PATHS: Record<Exclude<Tone, 5>, string> = {
  1: 'M8 9 H52',
  2: 'M8 31 L52 7',
  3: 'M8 17 Q26 40 52 6',
  4: 'M8 6 L52 33',
};

/** Dibujo de la curva de un tono (altura de la voz en el tiempo), con su color. */
export function ToneCurve({ tone, width = 60, color }: { tone: Tone; width?: number; color?: string }) {
  const stroke = color ?? TONE_COLORS[tone];
  return (
    <Svg width={width} height={(width * 40) / 60} viewBox="0 0 60 40">
      {tone === 5 ? <Circle cx={30} cy={26} r={5} fill={stroke} /> : <Path d={PATHS[tone]} stroke={stroke} strokeWidth={6} strokeLinecap="round" fill="none" />}
    </Svg>
  );
}
