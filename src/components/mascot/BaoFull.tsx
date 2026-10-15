import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Ellipse, Path, Rect } from 'react-native-svg';
import type { Outfit } from '@/features/shop/items';
import { useSettingsStore } from '@/store/useSettingsStore';
import { Bao } from './Bao';
import { FUR } from './BaoFace';
import type { BaoMood } from './types';

/** Lo que hace el cuerpo de Bao (la cara la marca `mood`). */
export type BaoAction = 'idle' | 'wave' | 'walk' | 'hop' | 'eat' | 'sleep' | 'bath';

interface Props {
  mood?: BaoMood;
  action?: BaoAction;
  /** Ancho; el alto es 170/120 del ancho. */
  size?: number;
  outfit?: Outfit;
}

const DARK = '#3A1F14';
const BELLY = '#5A2A18';
const RING = '#9C3A1A';
const SOFT = Easing.inOut(Easing.sin);
const soft = (to: number, duration: number) => withTiming(to, { duration, easing: SOFT });

/** Lienzo de 120×170: la cabeza (la de siempre) ocupa el cuadrado de arriba. */
export const FULL_RATIO = 170 / 120;

/**
 * Bao de cuerpo entero: cola de anillos, patas, brazos y la cabeza animada de
 * siempre. Cada parte se mueve por separado (saludar, andar, saltar, comer,
 * dormir, bañarse). Movimientos suaves; con «Reducir movimiento» se queda quieto.
 */
export function BaoFull({ mood = 'idle', action = 'idle', size = 120, outfit }: Props) {
  const systemReduce = useReducedMotion();
  const userReduce = useSettingsStore((s) => s.reduceMotion);
  const still = systemReduce || userReduce;
  const k = size / 120;
  const h = size * FULL_RATIO;

  const y = useSharedValue(0);
  const rot = useSharedValue(0);
  const breathe = useSharedValue(1);
  const tail = useSharedValue(0);
  const armL = useSharedValue(18);
  const armR = useSharedValue(-10);
  const legL = useSharedValue(0);
  const legR = useSharedValue(0);

  useEffect(() => {
    const all = [y, rot, breathe, tail, armL, armR, legL, legR];
    all.forEach((v) => cancelAnimation(v));
    y.set(0);
    rot.set(0);
    breathe.set(1);
    legL.set(0);
    legR.set(0);
    armL.set(action === 'eat' ? -128 : 18);
    armR.set(action === 'eat' ? 128 : -10);
    tail.set(0);
    if (still) return;

    tail.set(withRepeat(soft(action === 'sleep' ? -4 : -10, action === 'sleep' ? 2600 : 1400), -1, true));
    breathe.set(withRepeat(soft(action === 'sleep' ? 1.035 : 1.02, action === 'sleep' ? 2600 : 1600), -1, true));

    switch (action) {
      case 'wave':
        armR.set(withSequence(soft(-140, 300), withRepeat(withSequence(soft(-115, 240), soft(-160, 240)), 3), soft(-10, 360)));
        break;
      case 'walk':
        legL.set(withRepeat(withSequence(soft(16, 260), soft(-16, 260)), -1));
        legR.set(withRepeat(withSequence(soft(-16, 260), soft(16, 260)), -1));
        armL.set(withRepeat(withSequence(soft(4, 260), soft(30, 260)), -1));
        armR.set(withRepeat(withSequence(soft(4, 260), soft(-24, 260)), -1));
        y.set(withRepeat(soft(-3 * k, 260), -1, true));
        break;
      case 'hop':
        y.set(withRepeat(withSequence(withTiming(0, { duration: 120 }), soft(-16 * k, 280), soft(0, 280)), 2));
        armL.set(withRepeat(withSequence(soft(60, 280), soft(18, 280)), 2));
        armR.set(withRepeat(withSequence(soft(-60, 280), soft(-10, 280)), 2));
        break;
      case 'eat':
        // Patas a la boca y mordisquitos.
        armL.set(withRepeat(withSequence(soft(-120, 220), soft(-132, 220)), -1, true));
        armR.set(withRepeat(withSequence(soft(120, 220), soft(132, 220)), -1, true));
        break;
      case 'bath':
        // Se sacude el agua, suave.
        rot.set(withRepeat(withSequence(soft(-4, 160), soft(4, 160)), 4, true));
        break;
      case 'sleep':
      case 'idle':
        // De vez en cuando mueve una pata, para parecer vivo.
        armR.set(withRepeat(withSequence(withDelay(4200, soft(-24, 300)), soft(-10, 400)), -1));
        break;
    }
  }, [action, still, k, y, rot, breathe, tail, armL, armR, legL, legR]);

  const whole = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }, { rotate: `${rot.get()}deg` }] }));
  const bodyBreath = useAnimatedStyle(() => ({ transform: [{ scaleY: breathe.get() }] }));
  const tailStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${tail.get()}deg` }] }));
  const armLStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${armL.get()}deg` }] }));
  const armRStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${armR.get()}deg` }] }));
  const legLStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${legL.get()}deg` }] }));
  const legRStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${legR.get()}deg` }] }));

  const layer = (d: React.ReactNode) => (
    <Svg width={size} height={h} viewBox="0 0 120 170">
      {d}
    </Svg>
  );

  const arms = (
    <>
      <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: [32 * k, 110 * k, 0] }, armLStyle]}>{layer(<Rect x={25} y={106} width={14} height={32} rx={7} fill={DARK} />)}</Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: [88 * k, 110 * k, 0] }, armRStyle]}>{layer(<Rect x={81} y={106} width={14} height={32} rx={7} fill={DARK} />)}</Animated.View>
    </>
  );

  return (
    <View style={{ width: size, height: h }} accessibilityRole="image" accessibilityLabel={`Bao, el panda rojo, de cuerpo entero (${action})`}>
      <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: ['50%', '100%', 0] }, whole]}>
        <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: [86 * k, 142 * k, 0] }, tailStyle]}>
          {layer(
            <>
              <Path d="M84 146 C114 142 122 110 106 90 C100 106 94 118 78 128 Z" fill={FUR} />
              <Path d="M110 100 L98 108 M114 114 L99 118 M110 130 L93 130" stroke={RING} strokeWidth={5} strokeLinecap="round" />
            </>,
          )}
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: [48 * k, 144 * k, 0] }, legLStyle]}>{layer(<Rect x={40} y={140} width={16} height={28} rx={8} fill={DARK} />)}</Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: [72 * k, 144 * k, 0] }, legRStyle]}>{layer(<Rect x={64} y={140} width={16} height={28} rx={8} fill={DARK} />)}</Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: ['50%', '90%', 0] }, bodyBreath]}>
          {layer(
            <>
              <Ellipse cx={60} cy={128} rx={30} ry={27} fill={FUR} />
              <Ellipse cx={60} cy={133} rx={17} ry={19} fill={BELLY} />
            </>,
          )}
        </Animated.View>
        {action !== 'eat' && arms}
        <View style={styles.head}>
          <Bao mood={action === 'sleep' ? 'sleep' : action === 'eat' ? 'talking' : mood} size={size} outfit={outfit} />
        </View>
        {/* Al comer, las patas van delante de la cara. */}
        {action === 'eat' && arms}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { position: 'absolute', left: 0, top: 0 },
});
