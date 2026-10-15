import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BaoBubble } from '@/components/mascot';
import { UNITS } from '@/data/hsk/course';
import type { LessonNode } from '@/data/hsk/types';
import { feedback } from '@/lib/haptics';
import { dueItems } from '@/features/learning/adaptive/srs';
import { useLearnerStore } from '@/store/useLearnerStore';
import { useProgressStore } from '@/store/useProgressStore';
import { useStoryStore } from '@/store/useStoryStore';
import { STORIES } from '@/data/stories';
import { useTheme } from '@/theme';
import { QuestsCard } from '@/features/quests/QuestsCard';
import { DailyGoalCard } from './components/DailyGoalCard';
import { LearningPath } from './components/LearningPath';
import { LeagueChestRow } from './components/LeagueChestRow';
import { QuickActions } from './components/QuickActions';
import { TopStatusBar } from './components/TopStatusBar';

/** Tip del día de Bao (en producción lo genera el motor de IA según los errores recientes). */
const TIP = {
  message: 'Truco: cuando dos 3er tonos van juntos, el primero se pronuncia como 2º tono.',
  hanzi: '你好',
  pinyin: 'ní hǎo',
};

export function HomeScreen() {
  const { c, spacing } = useTheme();
  const router = useRouter();
  const tick = useProgressStore((s) => s.tick);
  const pendingChests = useProgressStore((s) => s.pendingChests);
  const storiesDone = useStoryStore((s) => s.done);
  const [showTip, setShowTip] = useState(true);
  const learner = useLearnerStore((s) => s.model);
  const [now] = useState(() => Date.now());
  const dueCount = dueItems(learner, now).length;

  // Regenera vidas / evalúa la racha cada vez que se monta la Home.
  useEffect(() => tick(), [tick]);

  const openNode = (node: LessonNode) => {
    void feedback.tap();
    if (node.kind === 'conversation') router.push({ pathname: '/chat', params: { nodeId: node.id } });
    else if (node.kind === 'chest') router.push({ pathname: '/chest/[id]', params: { id: node.id } });
    else if (node.kind === 'story') {
      // La primera historia de la unidad que aún no se ha leído (o la primera, para repasar).
      const unitId = node.id.replace(/-story$/, '');
      const own = STORIES.filter((s) => s.unitId === unitId);
      const next = own.find((s) => !storiesDone[s.id]) ?? own[0];
      if (next) router.push({ pathname: '/story/[id]', params: { id: next.id } });
    } else router.push({ pathname: '/lesson/[id]', params: { id: node.id } });
  };

  // Cofre de la meta diaria (los del camino se abren desde su nodo).
  const handleChest = () => {
    if (pendingChests > 0) router.push({ pathname: '/chest/[id]', params: { id: 'daily' } });
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: c.background }]}>
      <TopStatusBar />
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl * 2 }}
        showsVerticalScrollIndicator={false}
      >
        <DailyGoalCard />
        <QuickActions dueCount={dueCount} onPress={(key) => router.push(key === 'review' ? '/review' : { pathname: '/chat', params: { mode: key } })} />
        <LeagueChestRow onOpenLeague={() => router.push('/leagues')} onOpenChest={handleChest} />
        <QuestsCard index={3} />
        {showTip && (
          <View onTouchEnd={() => setShowTip(false)}>
            <BaoBubble {...TIP} mood="talking" />
          </View>
        )}
        <LearningPath units={UNITS} onOpenNode={openNode} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
