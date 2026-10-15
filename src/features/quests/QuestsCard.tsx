import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, PressableScale, ProgressBar } from '@/components/ui';
import { feedback } from '@/lib/haptics';
import { useProgressStore } from '@/store/useProgressStore';
import { useQuestStore } from '@/store/useQuestStore';
import { useTheme } from '@/theme';
import { ALL_DONE_BONUS, dailyQuests, type Quest, questDone, questProgress, WEEKLY_QUEST } from './quests';

/** Tarjeta de la Home: 3 misiones del día + misión semanal, con premio en gemas y cofre. */
export function QuestsCard({ index = 0 }: { index?: number }) {
  const { c, type, spacing, radius } = useTheme();
  const { day, today, thisWeek, claimed, weekClaimed, claim, claimWeekly, roll } = useQuestStore();
  const earnGems = useProgressStore((s) => s.earnGems);
  const addPendingChest = useProgressStore((s) => s.addPendingChest);

  useEffect(() => roll(), [roll]);
  const quests = dailyQuests(day || new Date().toLocaleDateString('sv-SE'));
  const allClaimed = quests.every((q) => claimed.includes(q.id));

  const collect = (q: Quest) => {
    if (!claim(q.id)) return;
    earnGems(q.gems);
    void feedback.levelUp();
  };

  const row = (q: Quest, counts: typeof today, isClaimed: boolean, onClaim: () => void) => {
    const done = questDone(q, counts);
    return (
      <View key={q.id} style={[styles.row, { gap: spacing.sm }]}>
        <Text style={styles.icon}>{q.icon}</Text>
        <View style={[styles.flex, { gap: 4 }]}>
          <Text style={[type.body, { color: c.textPrimary }]}>{q.title}</Text>
          {!isClaimed && <ProgressBar progress={questProgress(q, counts) / q.target} height={10} color={done ? c.success : c.xp} />}
        </View>
        {isClaimed ? (
          <Text style={[type.caption, { color: c.success }]}>✅ +{q.gems} 💎</Text>
        ) : done ? (
          <PressableScale onPress={onClaim} accessibilityRole="button" accessibilityLabel={`Reclamar ${q.gems} gemas`} style={[styles.claim, { backgroundColor: c.success, borderRadius: radius.sm }]}>
            <Text style={[type.caption, { color: c.textOnBrand }]}>+{q.gems} 💎</Text>
          </PressableScale>
        ) : (
          <Text style={[type.caption, { color: c.textSecondary, fontVariant: ['tabular-nums'] }]}>
            {questProgress(q, counts)}/{q.target}
          </Text>
        )}
      </View>
    );
  };

  return (
    <Card index={index}>
      <View style={{ gap: spacing.sm }}>
        <Text style={[type.title, { color: c.textPrimary }]}>🎯 Misiones de hoy</Text>
        {quests.map((q) => row(q, today, claimed.includes(q.id), () => collect(q)))}
        {allClaimed && !claimed.includes('bonus') ? (
          <PressableScale
            onPress={() => {
              if (!claim('bonus')) return;
              earnGems(ALL_DONE_BONUS.gems);
              addPendingChest();
              void feedback.levelUp();
            }}
            accessibilityRole="button"
            style={[styles.bonus, { backgroundColor: c.xp, borderRadius: radius.sm, padding: spacing.sm }]}
          >
            <Text style={[type.body, { color: '#5A3B00', textAlign: 'center' }]}>🎉 ¡Las 3 hechas! Reclamar cofre + {ALL_DONE_BONUS.gems} 💎</Text>
          </PressableScale>
        ) : (
          !allClaimed && <Text style={[type.caption, { color: c.textSecondary }]}>Completa las 3 y gana un cofre 🎁</Text>
        )}
        <View style={[styles.sep, { backgroundColor: c.border }]} />
        {row(WEEKLY_QUEST, thisWeek, weekClaimed, () => {
          if (!claimWeekly()) return;
          earnGems(WEEKLY_QUEST.gems);
          void feedback.levelUp();
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  icon: { fontSize: 24, width: 30, textAlign: 'center' },
  claim: { paddingHorizontal: 10, paddingVertical: 6 },
  bonus: {},
  sep: { height: 2, marginVertical: 2 },
});
