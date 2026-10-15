import { useLocalSearchParams } from 'expo-router';
import { ComingSoon } from '@/components/ComingSoon';
import { findSong } from '@/data/songs';
import { SongScreen } from '@/features/songs/SongScreen';

export default function SongRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const song = findSong(id);
  return song ? <SongScreen song={song} /> : <ComingSoon title="Canción" />;
}
