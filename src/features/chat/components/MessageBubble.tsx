import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { HanziTones, PinyinText } from '@/components/learn';
import { VOCAB } from '@/data/hsk/course';
import { speakChinese } from '@/lib/speech';
import { useTheme } from '@/theme';
import { glossSentence } from '../engine/glossary';
import type { ChatMessage } from '../engine/orchestrator';

/**
 * Burbuja de chat. Las del tutor muestran hanzi (por tonos), pinyin y
 * traducción; tocar = volver a escuchar. Debajo: explicación de Bao y un
 * desglose «palabra por palabra» desplegable.
 */
export function MessageBubble({ message }: { message: ChatMessage }) {
  const { c, radius, type, spacing } = useTheme();
  const [showWords, setShowWords] = useState(false);

  if (message.from === 'system') {
    return <Text style={[type.caption, { color: c.textSecondary, textAlign: 'center' }]}>{message.text}</Text>;
  }

  if (message.from === 'user') {
    const s = message.pronunciationScore;
    return (
      <Animated.View entering={FadeInUp.springify()} style={[styles.user, { backgroundColor: c.primary, borderRadius: radius.md, padding: spacing.sm }]}>
        <Text style={[type.body, { color: c.textOnBrand }]}>{message.text}</Text>
        {s !== undefined && (
          <Text style={[type.caption, { color: c.textOnBrand, opacity: 0.9 }]}>🎙️ Pronunciación {Math.round(s * 100)}%</Text>
        )}
      </Animated.View>
    );
  }

  const { reply, corrections, hint, explanation } = message.turn;
  const glosses = glossSentence(reply.hanzi, VOCAB);
  return (
    <Animated.View entering={FadeInUp.springify()} style={{ gap: spacing.xs, maxWidth: '90%' }}>
      <Pressable
        onPress={() => speakChinese(reply.hanzi, { force: true })}
        accessibilityRole="button"
        accessibilityHint="Toca para volver a escuchar"
        style={[styles.tutor, { backgroundColor: c.surfaceRaised, borderColor: c.border, borderRadius: radius.md, padding: spacing.sm }]}
      >
        <HanziTones hanzi={`${reply.hanzi} 🔊`} pinyin={reply.pinyin} style={[type.hanzi, { color: c.textPrimary, fontSize: 24, lineHeight: 32 }]} />
        <PinyinText pinyin={reply.pinyin} style={[type.caption, { fontSize: 14 }]} />
        <Text style={[type.body, { color: c.textSecondary, marginTop: 4 }]}>{reply.translation}</Text>
      </Pressable>

      {explanation && (
        <View style={[styles.box, { backgroundColor: c.primarySoft, borderRadius: radius.sm, padding: spacing.sm }]}>
          <Text style={[type.caption, { color: c.primary }]}>📖 BAO TE EXPLICA</Text>
          <Text style={[type.body, { color: c.textPrimary }]}>{explanation}</Text>
        </View>
      )}

      {glosses.length > 1 && (
        <Pressable onPress={() => setShowWords((v) => !v)} accessibilityRole="button" hitSlop={6}>
          <Text style={[type.caption, { color: c.info }]}>{showWords ? '▾ Ocultar palabra por palabra' : '▸ Ver palabra por palabra'}</Text>
        </Pressable>
      )}
      {showWords && (
        <View style={[styles.box, { borderColor: c.border, borderWidth: 1.5, borderRadius: radius.sm, padding: spacing.sm, gap: 4 }]}>
          {glosses.map((g, i) => (
            <Pressable key={i} onPress={() => speakChinese(g.hanzi, { force: true })} style={[styles.glossRow, { gap: spacing.sm }]}>
              {g.word ? (
                <HanziTones hanzi={g.hanzi} pinyin={g.word.pinyin} style={[type.hanzi, { fontSize: 20, lineHeight: 28, minWidth: 48 }]} />
              ) : (
                <Text style={[type.hanzi, { fontSize: 20, lineHeight: 28, minWidth: 48, color: c.textPrimary }]}>{g.hanzi}</Text>
              )}
              <Text style={[type.body, { color: c.textPrimary, flex: 1 }]}>
                {g.word ? (
                  <>
                    <PinyinText pinyin={g.word.pinyin} /> · {g.word.meaning}
                  </>
                ) : (
                  <Text style={{ color: c.textSecondary }}>(fuera del vocabulario HSK 1-2)</Text>
                )}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {corrections.map((corr, i) => (
        <View key={i} style={[styles.correction, { backgroundColor: c.successSoft, borderColor: c.success, borderRadius: radius.sm, padding: spacing.xs }]}>
          <Text style={[type.caption, { color: c.textSecondary, textDecorationLine: 'line-through' }]}>{corr.original}</Text>
          <Text style={[type.body, { color: c.successLip }]}>✓ {corr.corrected}</Text>
          <Text style={[type.caption, { color: c.textPrimary }]}>{corr.explanation}</Text>
        </View>
      ))}

      {hint && <Text style={[type.caption, { color: c.info }]}>💡 {hint}</Text>}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  user: { alignSelf: 'flex-end', maxWidth: '80%' },
  tutor: { borderWidth: 2, borderBottomWidth: 4 },
  correction: { borderWidth: 1.5 },
  box: { gap: 2 },
  glossRow: { flexDirection: 'row', alignItems: 'center' },
});
