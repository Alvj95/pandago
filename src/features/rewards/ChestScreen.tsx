import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bao } from '@/components/mascot';
import { Button3D, PressableScale } from '@/components/ui';
import { feedback } from '@/lib/haptics';
import { useTheme } from '@/theme';
import type { ChestReward } from './chest';

interface Props {
  title: string;
  /** Se llama una sola vez, al abrir: calcula y aplica la recompensa. */
  onOpen: () => ChestReward;
  onDone: () => void;
}

/**
 * Apertura de cofre: el cofre tiembla esperando el toque; al tocarlo da un
 * salto, se abre con un destello y las recompensas suben una a una.
 */
export function ChestScreen({ title, onOpen, onDone }: Props) {
  const { c, type, spacing, radius } = useTheme();
  const [reward, setReward] = useState<ChestReward | null>(null);
  const wiggle = useSharedValue(0);
  const lift = useSharedValue(0);
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  useEffect(() => {
    // Tiembla cada poco para invitar a tocarlo.
    wiggle.set(
      withRepeat(withSequence(...[-10, 10, -8, 8, 0].map((d) => withTiming(d, { duration: 70 })), withTiming(0, { duration: 900 })), -1),
    );
  }, [wiggle]);

  const open = () => {
    if (reward) return;
    void feedback.levelUp();
    wiggle.set(withTiming(0, { duration: 80 }));
    lift.set(withSequence(withTiming(-40, { duration: 160, easing: Easing.out(Easing.quad) }), withSpring(0, { damping: 14, stiffness: 220, mass: 1 })));
    scale.set(withSequence(withTiming(1.25, { duration: 160 }), withSpring(1, { damping: 12, stiffness: 200, mass: 1 })));
    glow.set(withSequence(withTiming(1, { duration: 200 }), withDelay(300, withRepeat(withTiming(0.6, { duration: 900 }), -1, true))));
    setReward(onOpen());
  };

  const chestStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.get() }, { rotate: `${wiggle.get()}deg` }, { scale: scale.get() }],
  }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.get() * 0.7, transform: [{ scale: 0.55 + glow.get() * 0.35 }] }));

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: c.background }]}>
      <View style={[styles.center, styles.flex, { padding: spacing.lg, gap: spacing.lg }]}>
        <Text style={[type.display, { color: c.textPrimary, textAlign: 'center' }]}>{reward ? '¡Premio!' : title}</Text>

        <PressableScale onPress={open} disabled={!!reward} accessibilityRole="button" accessibilityLabel="Abrir cofre" style={styles.center}>
          <Animated.View style={[styles.glow, { backgroundColor: c.xp }, glowStyle]} />
          <Animated.Text style={[styles.chest, chestStyle]}>{reward ? '🎉' : '🎁'}</Animated.Text>
        </PressableScale>

        {!reward ? (
          <Text style={[type.body, { color: c.textSecondary }]}>Toca el cofre para abrirlo</Text>
        ) : (
          <View style={{ gap: spacing.sm, alignSelf: 'stretch' }}>
            <Animated.View
              entering={ZoomIn.delay(250).springify()}
              style={[styles.row, styles.prize, { backgroundColor: c.surfaceRaised, borderColor: c.border, borderRadius: radius.lg, padding: spacing.md }]}
            >
              <Text style={styles.prizeIcon}>💎</Text>
              <Text style={[type.title, { color: c.info }]}>+{reward.gems} gemas</Text>
            </Animated.View>
            {reward.freeze && (
              <Animated.View
                entering={ZoomIn.delay(550).springify()}
                style={[styles.row, styles.prize, { backgroundColor: c.surfaceRaised, borderColor: c.border, borderRadius: radius.lg, padding: spacing.md }]}
              >
                <Text style={styles.prizeIcon}>🧊</Text>
                <Text style={[type.title, { color: c.info }]}>¡Protector de racha!</Text>
              </Animated.View>
            )}
            <Animated.View entering={FadeInUp.delay(800)} style={[styles.row, { gap: spacing.sm, justifyContent: 'center' }]}>
              <Bao mood="celebrate" size={64} />
              <Text style={[type.body, { color: c.textSecondary, flexShrink: 1 }]}>¡Sigue así! Las gemas sirven para recargar vidas.</Text>
            </Animated.View>
          </View>
        )}
      </View>
      {reward && (
        <View style={{ padding: spacing.md }}>
          <Button3D label="Continuar" onPress={onDone} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  chest: { fontSize: 140 },
  glow: { position: 'absolute', width: 200, height: 200, borderRadius: 100 },
  prize: { gap: 12, borderWidth: 2, borderBottomWidth: 6 },
  prizeIcon: { fontSize: 34 },
});
