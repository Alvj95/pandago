import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import type { Outfit } from '@/features/shop/items';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useShopStore } from '@/store/useShopStore';
import { BaoFace, CREAM, FUR, INK } from './BaoFace';
import { OutfitLayer } from './OutfitLayer';
import type { BaoMood } from './types';

interface Props {
  mood?: BaoMood;
  size?: number;
  /** Ropa a mostrar; por defecto, la que el usuario le ha puesto en la tienda. */
  outfit?: Outfit;
}

/** Curva suave (seno) para todo: sin rebotes ni resortes, que marean. */
const SOFT = Easing.inOut(Easing.sin);
const soft = (to: number, duration: number) => withTiming(to, { duration, easing: SOFT });

const OPEN_EYES: Record<BaoMood, { cx: number; cy: number; r: number } | null> = {
  idle: { cx: 42, cy: 64, r: 7 },
  talking: { cx: 42, cy: 64, r: 7 },
  encourage: { cx: 42, cy: 64, r: 7 },
  thinking: { cx: 44, cy: 60, r: 6 },
  happy: null,
  celebrate: null,
  sleep: null,
};

/**
 * Bao animado por capas: cuerpo (salto, balanceo, respiración), orejas,
 * párpados y boca. Movimientos pequeños y lentos, sin giros ni sacudidas, y
 * ninguno se repite durante la lección salvo respirar y parpadear. Con
 * «Reducir movimiento» (en Perfil o en el sistema) solo cambia la expresión.
 */
export function Bao({ mood = 'idle', size = 96, outfit }: Props) {
  const worn = useShopStore((s) => s.outfit);
  const systemReduce = useReducedMotion();
  const userReduce = useSettingsStore((s) => s.reduceMotion);
  const still = systemReduce || userReduce;

  const y = useSharedValue(0);
  const rotate = useSharedValue(0);
  const sx = useSharedValue(1);
  const sy = useSharedValue(1);
  const earL = useSharedValue(0);
  const earR = useSharedValue(0);
  const lid = useSharedValue(0);
  const mouth = useSharedValue(1);
  const sparkle = useSharedValue(0);

  useEffect(() => {
    const all: SharedValue<number>[] = [y, rotate, sx, sy, earL, earR, lid, mouth, sparkle];
    all.forEach((v) => cancelAnimation(v));
    [y, rotate, earL, earR, lid, sparkle].forEach((v) => v.set(0));
    [sx, sy, mouth].forEach((v) => v.set(1));
    if (still) return;

    const hop = (height: number) =>
      // Se agacha un poco, sube despacio y aterriza suave.
      withSequence(withTiming(0, { duration: 140 }), soft(-height, 300), soft(0, 300));
    const squash = () => {
      sx.set(withSequence(soft(1.04, 140), soft(0.98, 300), soft(1.03, 300), soft(1, 180)));
      sy.set(withSequence(soft(0.96, 140), soft(1.02, 300), soft(0.97, 300), soft(1, 180)));
    };
    const breathe = () => {
      sx.set(withRepeat(soft(1.02, 1600), -1, true));
      sy.set(withRepeat(soft(1.025, 1600), -1, true));
    };
    const blink = () => lid.set(withRepeat(withSequence(withDelay(3200, withTiming(1, { duration: 70 })), withTiming(0, { duration: 110 })), -1));

    switch (mood) {
      case 'idle':
        breathe();
        blink();
        // De vez en cuando mueve una oreja: parece vivo sin distraer.
        earR.set(withRepeat(withSequence(withDelay(5200, soft(10, 160)), soft(-4, 160), soft(0, 220)), -1));
        break;
      case 'talking':
        breathe();
        blink();
        // La boca se abre y cierra unos segundos (lo que dura una frase), no el cuerpo.
        mouth.set(withRepeat(withSequence(soft(0.35, 150), soft(1, 150)), 9));
        break;
      case 'thinking':
        blink();
        rotate.set(withRepeat(soft(-5, 1100), -1, true));
        break;
      case 'happy':
        y.set(hop(size * 0.08));
        squash();
        earL.set(withSequence(soft(-8, 240), soft(6, 260), soft(0, 260)));
        earR.set(withSequence(soft(8, 240), soft(-6, 260), soft(0, 260)));
        sparkle.set(withSequence(soft(1, 260), withDelay(300, soft(0, 500))));
        break;
      case 'celebrate':
        y.set(hop(size * 0.08));
        squash();
        rotate.set(withDelay(740, withSequence(soft(-5, 300), soft(5, 360), soft(-3, 320), soft(0, 280))));
        earL.set(withSequence(soft(-8, 300), soft(0, 300)));
        earR.set(withSequence(soft(8, 300), soft(0, 300)));
        sparkle.set(withSequence(soft(1, 300), withDelay(900, soft(0, 600))));
        break;
      case 'sleep':
        // Respira despacio y hondo.
        sx.set(withRepeat(soft(1.03, 2600), -1, true));
        sy.set(withRepeat(soft(1.04, 2600), -1, true));
        break;
      case 'encourage':
        // Inclina la cabeza despacio y baja las orejas: «no pasa nada».
        rotate.set(withSequence(soft(-7, 360), withDelay(420, soft(0, 440))));
        y.set(withSequence(soft(2, 360), withDelay(420, soft(0, 440))));
        earL.set(withSequence(soft(-18, 360), withDelay(420, soft(0, 440))));
        earR.set(withSequence(soft(18, 360), withDelay(420, soft(0, 440))));
        blink();
        break;
    }
  }, [mood, size, still, y, rotate, sx, sy, earL, earR, lid, mouth, sparkle]);

  const k = size / 120;
  const body = useAnimatedStyle(() => ({
    transform: [{ translateY: y.get() }, { rotate: `${rotate.get()}deg` }, { scaleX: sx.get() }, { scaleY: sy.get() }],
  }));
  const leftEar = useAnimatedStyle(() => ({ transform: [{ rotate: `${earL.get()}deg` }] }));
  const rightEar = useAnimatedStyle(() => ({ transform: [{ rotate: `${earR.get()}deg` }] }));
  const lids = useAnimatedStyle(() => ({ transform: [{ scaleY: lid.get() }] }));
  const mouthStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: mouth.get() }] }));
  const sparkles = useAnimatedStyle(() => ({ opacity: sparkle.get(), transform: [{ translateY: (1 - sparkle.get()) * 6 - sparkle.get() * 8 }] }));

  const eye = OPEN_EYES[mood];

  return (
    <View style={{ width: size, height: size }} accessibilityRole="image" accessibilityLabel={`Bao, el panda rojo (${mood})`}>
      <Animated.View style={[StyleSheet.absoluteFill, sparkles]} pointerEvents="none">
        {['✨', '⭐', '✨', '💫'].map((s, i) => (
          <Animated.Text
            key={i}
            style={[styles.abs, { left: size * (SPARKLE_POS[i]?.x ?? 0), top: size * (SPARKLE_POS[i]?.y ?? 0), fontSize: Math.max(14, size * 0.2) }]}
          >
            {s}
          </Animated.Text>
        ))}
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: ['50%', '92%', 0] }, body]}>
        <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: [33 * k, 34 * k, 0] }, leftEar]}>
          <Ear size={size} d={['M18 38 L26 8 L48 26 Z', 'M24 32 L28 16 L40 26 Z']} />
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: [87 * k, 34 * k, 0] }, rightEar]}>
          <Ear size={size} d={['M102 38 L94 8 L72 26 Z', 'M96 32 L92 16 L80 26 Z']} />
        </Animated.View>

        <BaoFace mood={mood} size={size} />

        {eye &&
          [eye.cx, 120 - eye.cx].map((cx) => (
            <Animated.View
              key={cx}
              pointerEvents="none"
              style={[
                styles.abs,
                {
                  left: (cx - eye.r - 1.5) * k,
                  top: (eye.cy - eye.r - 1.5) * k,
                  width: (eye.r + 1.5) * 2 * k,
                  height: (eye.r + 1.5) * 2 * k,
                  borderRadius: (eye.r + 1.5) * k,
                  backgroundColor: FUR,
                  transformOrigin: ['50%', '0%', 0],
                },
                lids,
              ]}
            />
          ))}

        {mood === 'talking' && (
          <Animated.View
            pointerEvents="none"
            style={[styles.abs, { left: 54 * k, top: 84 * k, width: 12 * k, height: 10 * k, borderRadius: 6 * k, backgroundColor: INK }, mouthStyle]}
          />
        )}

        <OutfitLayer outfit={outfit ?? worn} size={size} />
      </Animated.View>
    </View>
  );
}

function Ear({ size, d }: { size: number; d: [string, string] }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Path d={d[0]} fill={FUR} />
      <Path d={d[1]} fill={CREAM} />
    </Svg>
  );
}

/** Posiciones relativas al tamaño de Bao, alrededor de la cabeza. */
const SPARKLE_POS = [
  { x: -0.12, y: 0.05 },
  { x: 0.88, y: 0.0 },
  { x: -0.18, y: 0.55 },
  { x: 0.95, y: 0.5 },
] as const;

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
});
