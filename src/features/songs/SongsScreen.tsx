import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BaoBubble } from '@/components/mascot';
import { Card, PressableScale } from '@/components/ui';
import { SONGS } from '@/data/songs';
import { useSongStore } from '@/store/useSongStore';
import { useTheme } from '@/theme';

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

/** Pestaña «Cantar»: canciones para aprender la letra, cantar en karaoke y hacer el reto. */
export function SongsScreen() {
  const { c, type, spacing, radius } = useTheme();
  const router = useRouter();
  const progress = useSongStore((s) => s.progress);

  return (
    <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl }}>
        <Text style={[type.display, { color: c.textPrimary }]}>Aprende cantando 🎶</Text>
        <BaoBubble
          mood="happy"
          message="Las canciones ayudan a recordar las palabras y los tonos. Aprende la letra, canta en karaoke y supera el reto."
          hanzi="我们唱歌吧！"
          pinyin="wǒmen chàng gē ba"
        />
        {SONGS.map((song, i) => {
          const p = progress[song.id];
          const tint = c[song.color];
          return (
            <PressableScale key={song.id} onPress={() => router.push({ pathname: '/song/[id]', params: { id: song.id } })} accessibilityRole="button" accessibilityLabel={`${song.es}, ${song.title}`}>
              <Card index={i}>
                <View style={[styles.row, { gap: spacing.md }]}>
                  <View style={[styles.cover, { backgroundColor: tint, borderRadius: radius.md }]}>
                    <Text style={styles.coverEmoji}>{song.emoji}</Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={[type.hanzi, { color: c.textPrimary, fontSize: 24, lineHeight: 30 }]}>{song.title}</Text>
                    <Text style={[type.caption, { color: c.textSecondary }]}>{song.pinyin}</Text>
                    <Text style={[type.body, { color: c.textPrimary }]}>{song.es}</Text>
                    <View style={[styles.row, { gap: spacing.sm, marginTop: 4 }]}>
                      <Text style={[type.caption, { color: song.origin === 'original' ? c.primary : c.success }]}>
                        {song.origin === 'original' ? '✨ Original' : '🏮 Tradicional'}
                      </Text>
                      <Text style={[type.caption, { color: c.textSecondary }]}>⏱ {mmss(song.durationSec)}</Text>
                      {p?.sung ? <Text style={[type.caption, { color: c.textSecondary }]}>🎤 ×{p.sung}</Text> : null}
                    </View>
                  </View>
                  <Text style={styles.stars}>{p?.stars ? '⭐'.repeat(p.stars) : '☆'}</Text>
                </View>
              </Card>
            </PressableScale>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  cover: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  coverEmoji: { fontSize: 34 },
  stars: { fontSize: 14 },
});
