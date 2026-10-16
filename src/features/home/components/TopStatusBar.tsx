import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { PressableScale, StatPill } from '@/components/ui';
import { MAX_HEARTS, useProgressStore } from '@/store/useProgressStore';
import { useTheme } from '@/theme';

/** Barra superior fija: nivel HSK · racha · gemas · vidas. */
export function TopStatusBar({ onPressLevel }: { onPressLevel?: () => void }) {
  const { c, radius, type, spacing } = useTheme();
  const router = useRouter();
  const { hskLevel, streakDays, gems, hearts, xpToday: rawXp, dailyGoalXp, lastActiveDay } = useProgressStore();
  // xpToday es del último día con actividad: si fue otro día, hoy va por 0.
  const xpToday = lastActiveDay === new Date().toLocaleDateString('sv-SE') ? rawXp : 0;
  const streakActiveToday = xpToday > 0;
  const goalDone = xpToday >= dailyGoalXp;

  return (
    <View style={[styles.bar, { backgroundColor: c.background, borderBottomColor: c.border, paddingHorizontal: spacing.md }]}>
      <View style={[styles.level, { backgroundColor: c.primarySoft, borderRadius: radius.sm }]} onTouchEnd={onPressLevel}>
        <Text style={[type.caption, { color: c.primary }]}>🇨🇳 HSK {hskLevel}</Text>
      </View>
      <StatPill icon={streakActiveToday ? '🔥' : '🩶'} value={streakDays} color={streakActiveToday ? c.streak : c.textSecondary} label="Racha" />
      <StatPill icon="💎" value={gems} color={c.info} label="Gemas (toca para ir a la tienda de Bao)" onPress={() => router.push('/shop')} />
      <PressableScale onPress={() => router.push('/today')} accessibilityRole="button" accessibilityLabel={`Hoy: meta ${Math.min(xpToday, dailyGoalXp)} de ${dailyGoalXp} XP y misiones`} hitSlop={8}>
        <View style={[styles.goal, { borderColor: goalDone ? c.success : c.border, backgroundColor: goalDone ? c.successSoft : c.surface }]}>
          <Text style={[type.caption, { color: goalDone ? c.success : c.textPrimary }]}>🎯 {goalDone ? '✓' : `${Math.round((Math.min(xpToday, dailyGoalXp) / dailyGoalXp) * 100)}%`}</Text>
        </View>
      </PressableScale>
      <StatPill icon="❤️" value={hearts} color={c.danger} label={hearts < MAX_HEARTS ? 'Vidas (toca para ganar una con un reto)' : 'Vidas'} onPress={hearts < MAX_HEARTS ? () => router.push('/challenge') : undefined} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 56, borderBottomWidth: 2 },
  level: { paddingHorizontal: 10, paddingVertical: 6 },
  goal: { borderWidth: 2, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
});
