import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HanziTones, PinyinText } from '@/components/learn';
import { Button3D, PressableScale } from '@/components/ui';
import strokes from '@/data/strokes/hsk.strokes.json';
import { StrokeWriting } from '@/features/lesson/components/StrokeWriting';
import { exitTo } from '@/lib/navigation';
import { speakChinese } from '@/lib/speech';
import { useTheme } from '@/theme';
import { CHARS, explain, familyOf, KIND_LABEL, meaningOf, wordsWith } from './chars';

const STROKE_CHARS = new Set(Object.keys(strokes));

/** Ficha de un carácter: partes, historia para recordarlo, familia, palabras y práctica de trazos. */
export function CharacterScreen({ ch }: { ch: string }) {
  const { c, type, spacing, radius } = useTheme();
  const router = useRouter();
  const [writing, setWriting] = useState(false);
  const [written, setWritten] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);
  const info = CHARS[ch];
  if (!info) return null;
  const { story, sound } = explain(ch, info);
  const family = familyOf(ch);
  const words = wordsWith(ch).slice(0, 6);
  const kind = KIND_LABEL[info.kind];
  const open = (other: string) => CHARS[other] && router.push({ pathname: '/character/[c]', params: { c: other } });

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: c.background }]}>
      <View style={[styles.row, { padding: spacing.sm, borderBottomWidth: 2, borderBottomColor: c.border }]}>
        <PressableScale onPress={() => exitTo(router)} accessibilityRole="button" accessibilityLabel="Cerrar" hitSlop={12}>
          <Text style={[type.title, { color: c.textSecondary, paddingHorizontal: spacing.sm }]}>✕</Text>
        </PressableScale>
        <Text style={[type.title, { color: c.textPrimary }]}>🈶 Carácter con historia</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl }}>
        <View style={[styles.row, { gap: spacing.md }]}>
          <PressableScale
            onPress={() => speakChinese(ch, { force: true })}
            accessibilityRole="button"
            accessibilityLabel={`Escuchar ${info.py}`}
            style={[styles.hero, { backgroundColor: c.surfaceRaised, borderColor: c.border, borderRadius: radius.md }]}
          >
            <HanziTones hanzi={ch} pinyin={info.py} style={[type.hanzi, { fontSize: 88, lineHeight: 110 }]} />
            <Text style={[type.caption, { color: c.textSecondary }]}>🔊</Text>
          </PressableScale>
          <View style={[styles.flex, { gap: 4 }]}>
            <PinyinText pinyin={info.py} style={[type.display, { fontSize: 30 }]} />
            <Text style={[type.title, { color: c.textPrimary }]}>{meaningOf(info)}</Text>
            <View style={[styles.kind, { backgroundColor: c.primarySoft, borderRadius: radius.sm }]}>
              <Text style={[type.caption, { color: c.primary }]}>{kind.title.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {info.parts.length > 0 && (
          <View style={{ gap: spacing.xs }}>
            <Text style={[type.caption, { color: c.textSecondary }]}>SUS PARTES</Text>
            <View style={[styles.wrap, { gap: spacing.sm }]}>
              {info.parts.map((p, i) => (
                <PressableScale
                  key={i}
                  onPress={() => open(p.c)}
                  disabled={!CHARS[p.c]}
                  accessibilityRole="button"
                  accessibilityLabel={`${p.c}: ${p.es ?? ''}`}
                  style={[styles.part, { borderColor: p.c === info.sem ? c.success : p.c === info.pho ? c.info : c.border, borderRadius: radius.md, backgroundColor: c.surface }]}
                >
                  <Text style={[type.hanzi, { fontSize: 36, lineHeight: 46, color: c.textPrimary }]}>{p.c}</Text>
                  {p.py && <Text style={[type.caption, { color: c.textSecondary }]}>{p.py}</Text>}
                  <Text style={[type.caption, { color: c.textPrimary, textAlign: 'center' }]}>{p.es ?? '—'}</Text>
                  {p.c === info.sem && <Text style={[type.caption, { color: c.success }]}>significado</Text>}
                  {p.c === info.pho && <Text style={[type.caption, { color: c.info }]}>sonido</Text>}
                </PressableScale>
              ))}
            </View>
          </View>
        )}

        <View style={{ backgroundColor: c.primarySoft, borderRadius: radius.md, padding: spacing.md, gap: 6 }}>
          <Text style={[type.caption, { color: c.primary }]}>💡 PARA RECORDARLO</Text>
          {story && <Text style={[type.body, { color: c.textPrimary, fontSize: 17, lineHeight: 24 }]}>{story}</Text>}
          {sound && <Text style={[type.body, { color: c.textPrimary }]}>🔉 {sound}</Text>}
          <Text style={[type.caption, { color: c.textSecondary }]}>
            {kind.title}: {kind.desc}
          </Text>
        </View>

        {words.length > 0 && (
          <View style={{ gap: spacing.xs }}>
            <Text style={[type.caption, { color: c.textSecondary }]}>PALABRAS CON {ch}</Text>
            {words.map((w) => (
              <PressableScale
                key={w.id}
                onPress={() => speakChinese(w.hanzi, { force: true })}
                accessibilityRole="button"
                accessibilityLabel={`${w.hanzi}: ${w.meaning}`}
                style={[styles.row, styles.word, { gap: spacing.sm, borderColor: c.border, borderRadius: radius.sm, backgroundColor: c.surfaceRaised }]}
              >
                <HanziTones hanzi={w.hanzi} pinyin={w.pinyin} style={[type.hanzi, { fontSize: 22, lineHeight: 30 }]} />
                <PinyinText pinyin={w.pinyin} style={type.caption} />
                <Text style={[type.body, styles.flex, { color: c.textPrimary }]} numberOfLines={1}>
                  {w.meaning}
                </Text>
                <Text>🔊</Text>
              </PressableScale>
            ))}
          </View>
        )}

        {family.length > 0 && (
          <View style={{ gap: spacing.xs }}>
            <Text style={[type.caption, { color: c.textSecondary }]}>SU FAMILIA (MISMO RADICAL {info.radical})</Text>
            <View style={[styles.wrap, { gap: spacing.xs }]}>
              {family.map((f) => (
                <PressableScale
                  key={f}
                  onPress={() => open(f)}
                  accessibilityRole="button"
                  accessibilityLabel={`${f}, ${CHARS[f]?.py ?? ''}`}
                  style={[styles.fam, { borderColor: c.border, borderRadius: radius.sm, backgroundColor: c.surface }]}
                >
                  <Text style={[type.hanzi, { fontSize: 26, lineHeight: 34, color: c.textPrimary }]}>{f}</Text>
                  <Text style={[type.caption, { color: c.textSecondary }]}>{CHARS[f]?.py}</Text>
                </PressableScale>
              ))}
            </View>
          </View>
        )}

        {STROKE_CHARS.has(ch) &&
          (writing ? (
            <View style={{ gap: spacing.sm }}>
              <StrokeWriting
                key={attempt}
                exercise={{ kind: 'stroke_writing', id: `char-${ch}`, itemId: `char:${ch}`, instruction: 'Escribe el carácter', char: ch, word: ch, position: 0, pinyin: info.py, meaning: meaningOf(info) }}
                onComplete={(score) => setWritten(score)}
              />
              {written !== null && (
                <Text style={[type.title, { color: written >= 0.6 ? c.successLip : c.danger, textAlign: 'center' }]}>
                  {written >= 0.6 ? '¡Muy bien escrito! ✍️' : 'Casi. ¡Inténtalo otra vez!'}
                </Text>
              )}
              <Button3D
                label={written !== null ? 'Otra vez' : 'Ocultar'}
                variant="ghost"
                onPress={() => {
                  if (written === null) return setWriting(false);
                  setWritten(null);
                  setAttempt((n) => n + 1);
                }}
              />
            </View>
          ) : (
            <Button3D label="✍️ Trazarlo" onPress={() => setWriting(true)} />
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  hero: { alignItems: 'center', borderWidth: 2, borderBottomWidth: 4, paddingHorizontal: 18, paddingVertical: 6 },
  kind: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3 },
  part: { alignItems: 'center', borderWidth: 2, borderBottomWidth: 4, padding: 8, minWidth: 84, maxWidth: 130 },
  word: { borderWidth: 1.5, padding: 8 },
  fam: { alignItems: 'center', borderWidth: 1.5, paddingHorizontal: 10, paddingVertical: 4 },
});
