import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui';
import { UNITS } from '@/data/hsk/course';
import { useProgressStore } from '@/store/useProgressStore';
import { useQuestStore } from '@/store/useQuestStore';
import { useTheme } from '@/theme';
import { achievementProgress, ACHIEVEMENTS, type AchievementFacts } from './quests';

/** Contadores con los que se calculan los logros. */
export function useAchievementFacts(): AchievementFacts {
  const lifetime = useQuestStore((s) => s.lifetime);
  const completed = useProgressStore((s) => s.completedNodeIds);
  const streak = useProgressStore((s) => s.streakDays);
  const words = new Set(UNITS.flatMap((u) => u.nodes).filter((n) => n.kind === 'lesson' && completed.includes(n.id)).flatMap((n) => n.skillIds)).size;
  return { lifetime: { ...lifetime, streak: Math.max(lifetime.streak ?? 0, streak) }, words };
}

/** Logros: desbloqueados a color, el resto en gris con su progreso. */
export function AchievementsCard({ index = 0 }: { index?: number }) {
  const { c, type, spacing, radius } = useTheme();
  const facts = useAchievementFacts();
  const done = ACHIEVEMENTS.filter((a) => a.value(facts) >= a.target).length;

  return (
    <Card index={index}>
      <View style={{ gap: spacing.sm }}>
        <Text style={[type.title, { color: c.textPrimary }]}>
          🏅 Logros · {done}/{ACHIEVEMENTS.length}
        </Text>
        <View style={[styles.grid, { gap: spacing.xs }]}>
          {ACHIEVEMENTS.map((a) => {
            const value = achievementProgress(a, facts);
            const ok = value >= a.target;
            return (
              <View
                key={a.id}
                accessibilityLabel={`${a.title}: ${a.desc}. ${ok ? 'Conseguido' : `${value} de ${a.target}`}`}
                style={[styles.cell, { borderRadius: radius.sm, borderColor: ok ? c.xp : c.border, backgroundColor: ok ? c.surface : c.surfaceSunken }]}
              >
                <Text style={[styles.icon, { opacity: ok ? 1 : 0.3 }]}>{a.icon}</Text>
                <Text style={[type.caption, { color: ok ? c.textPrimary : c.textSecondary, textAlign: 'center' }]} numberOfLines={2}>
                  {a.title}
                </Text>
                <Text style={[type.caption, { color: c.textSecondary, fontSize: 11, textAlign: 'center' }]} numberOfLines={2}>
                  {ok ? a.desc : `${value}/${a.target}`}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '32%', alignItems: 'center', padding: 6, borderWidth: 1.5, minHeight: 104 },
  icon: { fontSize: 28 },
});
