import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PressableScale, Segmented } from '@/components/ui';
import type { Song } from '@/data/songs';
import { LOCAL_CONTENT } from '@/features/lesson/content';
import { feedback } from '@/lib/haptics';
import { exitTo } from '@/lib/navigation';
import { useProgressStore } from '@/store/useProgressStore';
import { useSongStore } from '@/store/useSongStore';
import { useTheme } from '@/theme';
import { KaraokeView } from './components/KaraokeView';
import { LyricQuiz } from './components/LyricQuiz';
import { LyricsView } from './components/LyricsView';
import { songVocab } from './songVocab';
import { useSongPlayer } from './useSongPlayer';

type Mode = 'lyrics' | 'karaoke' | 'quiz';
const KARAOKE_XP = 5;

export function SongScreen({ song }: { song: Song }) {
  const { c, type, spacing } = useTheme();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('lyrics');
  const player = useSongPlayer(song.id);
  const vocab = useMemo(() => songVocab(song, LOCAL_CONTENT.vocab), [song]);
  const awardXp = useProgressStore((s) => s.awardXp);
  const recordSung = useSongStore((s) => s.recordSung);
  const recordQuiz = useSongStore((s) => s.recordQuiz);

  const changeMode = (m: Mode) => {
    player.pause();
    setMode(m);
  };

  const onFinished = useCallback(() => {
    recordSung(song.id);
    awardXp(KARAOKE_XP);
    void feedback.levelUp();
  }, [recordSung, awardXp, song.id]);

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: c.background }]}>
      <View style={[styles.header, { padding: spacing.md, gap: spacing.sm }]}>
        <PressableScale onPress={() => exitTo(router)} accessibilityLabel="Volver">
          <Text style={[type.title, { color: c.textSecondary }]}>✕</Text>
        </PressableScale>
        <Text style={styles.emoji}>{song.emoji}</Text>
        <View style={styles.flex}>
          <Text style={[type.hanzi, { color: c.textPrimary, fontSize: 24, lineHeight: 30 }]}>{song.title}</Text>
          <Text style={[type.caption, { color: c.textSecondary }]}>
            {song.pinyin} · {song.es}
          </Text>
        </View>
      </View>
      <View style={{ paddingHorizontal: spacing.md }}>
        <Segmented
          accessibilityLabel="Modo"
          value={mode}
          onChange={changeMode}
          options={[
            { value: 'lyrics', label: '📖 Letra' },
            { value: 'karaoke', label: '🎤 Karaoke' },
            { value: 'quiz', label: '⭐ Reto' },
          ]}
        />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
        {mode === 'lyrics' && <LyricsView song={song} vocab={vocab} time={player.time} segment={player.segment} onPlayLine={(a, b) => void player.playSegment(a, b)} />}
        {mode === 'karaoke' && (
          <KaraokeView
            song={song}
            time={player.time}
            playing={player.playing}
            withGuide={player.withGuide}
            onToggleGuide={(on) => void player.setWithGuide(on)}
            onPlay={player.play}
            onPause={player.pause}
            onRestart={() => void player.restart()}
            onFinished={onFinished}
            rewardXp={KARAOKE_XP}
          />
        )}
        {mode === 'quiz' && (
          <LyricQuiz
            song={song}
            vocab={vocab}
            onDone={(stars, correct) => {
              recordQuiz(song.id, stars);
              awardXp(correct * 2 + (stars === 3 ? 5 : 0));
            }}
          />
        )}
        <Text style={[type.caption, { color: c.textSecondary, textAlign: 'center', marginTop: spacing.lg }]}>{song.originNote}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center' },
  emoji: { fontSize: 34 },
});
