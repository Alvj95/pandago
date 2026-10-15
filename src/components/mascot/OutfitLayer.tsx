import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import type { Outfit } from '@/features/shop/items';

const INK = '#2A1A14';

/** Dibujo de cada prenda en el mismo lienzo de 120×120 que la cara de Bao. */
const DRAW: Record<string, () => React.ReactElement> = {
  'bamboo-hat': () => (
    <G>
      <Path d="M8 34 L60 4 L112 34 Q60 44 8 34Z" fill="#D9A441" />
      <Path d="M8 34 Q60 44 112 34" stroke="#9C6B1E" strokeWidth={3} fill="none" />
      <Path d="M34 19 L60 4 L86 19" stroke="#9C6B1E" strokeWidth={2} fill="none" />
    </G>
  ),
  'lantern-hat': () => (
    <G>
      <Path d="M34 28 Q60 4 86 28 L90 36 Q60 44 30 36Z" fill="#E8453C" />
      <Path d="M30 36 Q60 44 90 36" stroke="#FFC21A" strokeWidth={3} fill="none" />
      <Rect x={54} y={6} width={12} height={8} rx={3} fill="#FFC21A" />
    </G>
  ),
  'crown-hsk1': () => <Crown gem="#E8453C" />,
  'crown-hsk2': () => <Crown gem="#2BA6F0" />,
  glasses: () => (
    <G>
      <Circle cx={42} cy={64} r={11} fill="rgba(43,166,240,0.22)" stroke={INK} strokeWidth={3.5} />
      <Circle cx={78} cy={64} r={11} fill="rgba(43,166,240,0.22)" stroke={INK} strokeWidth={3.5} />
      <Path d="M53 63 Q60 58 67 63" stroke={INK} strokeWidth={3.5} fill="none" />
      <Path d="M31 62 L14 58 M89 62 L106 58" stroke={INK} strokeWidth={3} strokeLinecap="round" />
    </G>
  ),
  headphones: () => (
    <G>
      <Path d="M14 66 Q14 16 60 16 Q106 16 106 66" stroke="#2BA6F0" strokeWidth={7} fill="none" strokeLinecap="round" />
      <Rect x={4} y={56} width={16} height={26} rx={7} fill="#2BA6F0" />
      <Rect x={100} y={56} width={16} height={26} rx={7} fill="#2BA6F0" />
    </G>
  ),
  scarf: () => (
    <G>
      <Path d="M22 98 Q60 114 98 98 L98 107 Q60 123 22 107Z" fill="#E8453C" />
      <Path d="M74 108 L86 119 L68 119Z" fill="#C2342C" />
      <Path d="M32 103 L32 110 M46 107 L46 115 M60 108 L60 116" stroke="#FFC21A" strokeWidth={2.5} />
    </G>
  ),
  bowtie: () => (
    <G>
      <Path d="M60 108 L44 100 L44 116Z M60 108 L76 100 L76 116Z" fill="#8B5CF6" />
      <Circle cx={60} cy={108} r={4} fill="#6D3FD8" />
    </G>
  ),
};

function Crown({ gem }: { gem: string }) {
  return (
    <G>
      <Path d="M34 30 L38 8 L50 20 L60 4 L70 20 L82 8 L86 30Z" fill="#FFC21A" stroke="#946500" strokeWidth={2} />
      <Circle cx={60} cy={20} r={3.5} fill={gem} />
    </G>
  );
}

/** Capa de ropa encima de la cara de Bao (se mueve con su cuerpo). */
export function OutfitLayer({ outfit, size }: { outfit: Outfit; size: number }) {
  const ids = [outfit.neck, outfit.face, outfit.head].filter((id): id is string => !!id && !!DRAW[id]);
  if (!ids.length) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={size} height={size} viewBox="0 0 120 120">
        {ids.map((id) => (
          <G key={id}>{DRAW[id]!()}</G>
        ))}
      </Svg>
    </View>
  );
}
