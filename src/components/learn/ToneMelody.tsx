import Svg, { Path, Text as SvgText } from 'react-native-svg';
import type { Tone } from '@/features/chat/engine/tones';
import { syllablesOf } from '@/lib/pinyin';
import { TONE_COLORS } from '@/features/songs/toneColors';

/** Altura de la voz (1 = grave, 5 = aguda) al principio, centro y final de cada tono (escala de Chao). */
const CONTOUR: Record<Tone, [number, number, number]> = {
  1: [5, 5, 5],
  2: [3, 4, 5],
  3: [2, 1, 2.5],
  4: [5, 3, 1],
  5: [3, 3, 3],
};

/**
 * «Melodía» de una frase: la curva de tono de cada sílaba, una detrás de otra,
 * para imitar la entonación al hacer sombra.
 */
export function ToneMelody({ pinyin, width = 320, height = 90, labelColor = '#8A90A2' }: { pinyin: string; width?: number; height?: number; labelColor?: string }) {
  const syl = syllablesOf(pinyin);
  if (!syl.length) return null;
  const w = width / syl.length;
  const top = 8;
  const plot = height - 30;
  const y = (lvl: number) => top + plot - ((lvl - 1) / 4) * plot;
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {syl.map((s, i) => {
        const tone = (s.tone ?? 5) as Tone;
        const [a, b, c] = CONTOUR[tone];
        const x0 = i * w + w * 0.15;
        const x1 = i * w + w * 0.85;
        const xm = (x0 + x1) / 2;
        const d = tone === 5 ? `M${xm - w * 0.12} ${y(3)} L${xm + w * 0.12} ${y(3)}` : `M${x0} ${y(a)} Q${xm} ${y(b) + (tone === 3 ? 10 : 0)} ${x1} ${y(c)}`;
        return [
          <Path key={`p${i}`} d={d} stroke={TONE_COLORS[tone]} strokeWidth={5} strokeLinecap="round" fill="none" />,
          <SvgText key={`t${i}`} x={xm} y={height - 6} fontSize={Math.min(13, w / 3)} fill={labelColor} textAnchor="middle">
            {s.text}
          </SvgText>,
        ];
      })}
    </Svg>
  );
}
