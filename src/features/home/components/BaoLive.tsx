import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Bao } from '@/components/mascot';
import { PressableScale } from '@/components/ui';
import { UNITS } from '@/data/hsk/course';
import { feedback } from '@/lib/haptics';
import { speakChinese } from '@/lib/speech';
import { MAX_HEARTS, useProgressStore } from '@/store/useProgressStore';
import { useTheme } from '@/theme';
import { baoLines } from '../baoLines';

/** Bao vivo en el inicio: al tocarlo dice otra cosa (según la hora, la racha, lo pendiente…). */
export function BaoLive({ dueCount }: { dueCount: number }) {
  const { c, radius, type, spacing } = useTheme();
  const router = useRouter();
  const p = useProgressStore();
  const [i, setI] = useState(0);
  const lines = useMemo(() => {
    const now = new Date();
    const skills = new Set(UNITS.flatMap((u) => u.nodes).filter((n) => p.completedNodeIds.includes(n.id)).flatMap((n) => n.skillIds));
    return baoLines({
      hour: now.getHours(),
      day: Math.floor(now.getTime() / 86_400_000),
      streakDays: p.streakDays,
      xpToday: p.lastActiveDay === now.toLocaleDateString('sv-SE') ? p.xpToday : 0,
      dailyGoalXp: p.dailyGoalXp,
      dueCount,
      pendingChests: p.pendingChests,
      hearts: p.hearts,
      maxHearts: MAX_HEARTS,
      wordsPracticed: skills.size,
    });
  }, [p.completedNodeIds, p.streakDays, p.xpToday, p.lastActiveDay, p.dailyGoalXp, p.pendingChests, p.hearts, dueCount]);
  const line = lines[i % lines.length]!;

  const tap = () => {
    const next = lines[(i + 1) % lines.length]!;
    setI((x) => x + 1);
    void feedback.tap();
    if (next.hanzi) speakChinese(next.hanzi.replace(/[！!]/g, ''));
  };

  return (
    <View style={[styles.row, { gap: spacing.sm }]}>
      <PressableScale onPress={tap} accessibilityRole="button" accessibilityLabel="Bao. Tócalo para que te diga otra cosa" hitSlop={8}>
        <Bao mood={line.mood} size={80} />
      </PressableScale>
      <Animated.View
        key={i}
        entering={ZoomIn.springify().damping(14)}
        style={[styles.bubble, { backgroundColor: c.surfaceRaised, borderColor: c.border, borderRadius: radius.md, padding: spacing.sm, gap: 4 }]}
      >
        {line.hanzi ? (
          <Text style={[type.hanzi, { color: c.primary, fontSize: 20, lineHeight: 26 }]} onPress={() => speakChinese(line.hanzi!, { force: true })}>
            {line.hanzi} <Text style={[type.caption, { color: c.textSecondary }]}>{line.pinyin} 🔊</Text>
          </Text>
        ) : null}
        <Text style={[type.body, { color: c.textPrimary }]}>{line.message}</Text>
        <View style={[styles.row, { justifyContent: 'space-between', gap: spacing.sm }]}>
          <Text style={[type.caption, { color: c.textSecondary }]}>👆 Toca a Bao</Text>
          {line.action ? (
            <PressableScale onPress={() => router.push(line.action!.route)} accessibilityRole="button" accessibilityLabel={line.action.label}>
              <View style={[styles.action, { backgroundColor: c.primary, borderRadius: radius.pill }]}>
                <Text style={[type.caption, { color: c.textOnBrand }]}>{line.action.label} ›</Text>
              </View>
            </PressableScale>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  bubble: { flex: 1, borderWidth: 2 },
  action: { paddingHorizontal: 12, paddingVertical: 4 },
});
