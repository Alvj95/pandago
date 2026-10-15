import { useLocalSearchParams } from 'expo-router';
import { ComingSoon } from '@/components/ComingSoon';
import { UNITS } from '@/data/hsk/course';
import { GuideScreen } from '@/features/guide/GuideScreen';

export default function Guide() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const unit = UNITS.find((u) => u.id === id);
  if (!unit) return <ComingSoon title="Guía" />;
  return <GuideScreen unit={unit} />;
}
