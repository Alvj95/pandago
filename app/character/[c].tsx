import { useLocalSearchParams } from 'expo-router';
import { ComingSoon } from '@/components/ComingSoon';
import { CharacterScreen } from '@/features/characters/CharacterScreen';
import { CHARS } from '@/features/characters/chars';

export default function CharacterRoute() {
  const { c } = useLocalSearchParams<{ c: string }>();
  if (!c || !CHARS[c]) return <ComingSoon title="Carácter" />;
  return <CharacterScreen key={c} ch={c} />;
}
