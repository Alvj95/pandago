import { useLocalSearchParams, useRouter } from 'expo-router';
import { findNode } from '@/features/lesson/content';
import { rollChest } from '@/features/rewards/chest';
import { ChestScreen } from '@/features/rewards/ChestScreen';
import { exitTo } from '@/lib/navigation';
import { useProgressStore } from '@/store/useProgressStore';

/** Cofre de un nodo del camino (`u3-c`) o de la meta diaria (`daily`). */
export default function Chest() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const node = findNode(id);

  const open = () => {
    const store = useProgressStore.getState();
    // El cofre diario solo se abre si de verdad hay uno pendiente.
    const allowed = node ? !store.completedNodeIds.includes(node.id) : store.consumePendingChest();
    const reward = allowed ? rollChest(Math.random, store.streakFreezes) : { gems: 0, freeze: false };
    if (allowed) {
      store.claimReward(reward);
      if (node) store.completeNode(node);
    }
    return reward;
  };

  return <ChestScreen title={node ? '¡Un cofre en el camino!' : '¡Meta diaria cumplida!'} onOpen={open} onDone={() => exitTo(router)} />;
}
