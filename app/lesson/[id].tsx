import { useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ComingSoon } from '@/components/ComingSoon';
import { LessonScreen } from '@/features/lesson/LessonScreen';
import { findNode, LOCAL_CONTENT, unitOfNode } from '@/features/lesson/content';
import { buildBossLesson, buildLesson } from '@/features/lesson/engine/exerciseFactory';
import { createRng } from '@/features/lesson/engine/random';
import { useProgressStore } from '@/store/useProgressStore';

export default function Lesson() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const level = useProgressStore((s) => s.hskLevel);
  const node = findNode(id);
  // Nueva semilla cada vez que se abre: misma lección, distinto orden y distractores.
  const [seed] = useState(() => Date.now());
  const exercises = useMemo(() => {
    if (!node) return [];
    const build = node.kind === 'boss' ? buildBossLesson : buildLesson;
    return build(node.skillIds, LOCAL_CONTENT, createRng(seed), unitOfNode(node.id)?.id);
  }, [node, seed]);

  // Las lecciones del camino enseñan primero sus palabras; la primera de cada unidad, también su gramática.
  const intro = useMemo(() => {
    if (node?.kind !== 'lesson') return undefined;
    const unit = unitOfNode(node.id);
    const words = node.skillIds.map((sid) => LOCAL_CONTENT.vocab.find((v) => v.id === sid)).filter((v) => v !== undefined);
    return { words, unit: unit?.nodes.find((n) => n.kind === 'lesson')?.id === node.id ? unit : undefined };
  }, [node]);

  if (!node || !exercises.length) return <ComingSoon title="Lección" />;
  return <LessonScreen exercises={exercises} node={node} level={level} intro={intro} />;
}
