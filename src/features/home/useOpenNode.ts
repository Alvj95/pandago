import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { UNITS } from '@/data/hsk/course';
import type { LessonNode } from '@/data/hsk/types';
import { STORIES } from '@/data/stories';
import { feedback } from '@/lib/haptics';
import { useStoryStore } from '@/store/useStoryStore';

/** El primer nodo sin completar del camino (el «actual»). */
export const currentNode = (completed: string[]): LessonNode | undefined => UNITS.flatMap((u) => u.nodes).find((n) => !completed.includes(n.id));

/** Abre un nodo del camino en su pantalla (lección, cofre, historia o conversación). */
export function useOpenNode() {
  const router = useRouter();
  const storiesDone = useStoryStore((s) => s.done);
  return useCallback(
    (node: LessonNode) => {
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
    },
    [router, storiesDone],
  );
}
