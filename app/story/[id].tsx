import { useLocalSearchParams } from 'expo-router';
import { ComingSoon } from '@/components/ComingSoon';
import { STORIES } from '@/data/stories';
import { StoryScreen } from '@/features/stories/StoryScreen';

export default function StoryRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const story = STORIES.find((s) => s.id === id);
  if (!story) return <ComingSoon title="Historia" />;
  return <StoryScreen story={story} />;
}
