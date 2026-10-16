import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PressableScale } from '@/components/ui';
import { QuestsCard } from '@/features/quests/QuestsCard';
import { exitTo } from '@/lib/navigation';
import { useProgressStore } from '@/store/useProgressStore';
import { useTheme } from '@/theme';
import { DailyGoalCard } from './components/DailyGoalCard';
import { LeagueChestRow } from './components/LeagueChestRow';

/** «Hoy»: meta diaria, misiones, liga y cofres (antes ocupaban el inicio). */
export function TodayScreen() {
  const { c, type, spacing } = useTheme();
  const router = useRouter();
  const pendingChests = useProgressStore((s) => s.pendingChests);
  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: c.background }]}>
      <View style={[styles.row, { padding: spacing.md, gap: spacing.sm }]}>
        <PressableScale onPress={() => exitTo(router)} accessibilityRole="button" accessibilityLabel="Volver" hitSlop={10}>
          <Text style={[type.title, { color: c.textSecondary }]}>✕</Text>
        </PressableScale>
        <Text style={[type.title, { color: c.textPrimary }]}>🎯 Hoy</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingTop: 0, gap: spacing.md, paddingBottom: spacing.xxl }}>
        <DailyGoalCard />
        <QuestsCard index={1} />
        <LeagueChestRow
          onOpenLeague={() => router.push('/leagues')}
          onOpenChest={() => {
            if (pendingChests > 0) router.push({ pathname: '/chest/[id]', params: { id: 'daily' } });
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
});
