import { useLocalSearchParams } from 'expo-router';
import { ChatScreen } from '@/features/chat/ChatScreen';
import { petScenario, PRONUNCIATION_DRILL, scenarioForNode } from '@/features/chat/scenarios';
import { usePetStore } from '@/store/usePetStore';
import { findNode } from '@/features/lesson/content';

export default function Chat() {
  const { nodeId, mode } = useLocalSearchParams<{ nodeId?: string; mode?: string }>();
  const scenario =
    mode === 'voice' ? PRONUNCIATION_DRILL : mode === 'pet' ? petScenario(usePetStore.getState().pet, new Date().getHours()) : scenarioForNode(nodeId);
  return <ChatScreen scenario={scenario} node={nodeId ? findNode(nodeId) : undefined} />;
}
