import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HanziTones, PinyinText, ToneCurve } from '@/components/learn';
import { Bao } from '@/components/mascot';
import { Button3D, Card, PressableScale, ProgressBar } from '@/components/ui';
import { VOCAB } from '@/data/hsk/course';
import type { Tone } from '@/features/chat/engine/tones';
import { createRng } from '@/features/lesson/engine/random';
import { TONE_COLORS } from '@/features/songs/toneColors';
import { feedback } from '@/lib/haptics';
import { exitTo } from '@/lib/navigation';
import { speakChinese } from '@/lib/speech';
import { useLearnerStore } from '@/store/useLearnerStore';
import { useProgressStore } from '@/store/useProgressStore';
import { useToneStore } from '@/store/useToneStore';
import { useTheme } from '@/theme';
import { buildRound, LEVELS, syllableResults, TONE_TIPS, type ToneLevel, type ToneQuestion, toneLabel, weakestTone } from './trainer';

const ROUND = 10;

/** Entrenador de tonos: menú de niveles con estadísticas → ronda de 10 → resultado. */
export function ToneTrainerScreen() {
  const { c, type, spacing, radius } = useTheme();
  const router = useRouter();
  const { stats, best, recordSyllables, finishRound } = useToneStore();
  const record = useLearnerStore((s) => s.record);
  const awardXp = useProgressStore((s) => s.awardXp);

  const [level, setLevel] = useState<ToneLevel | null>(null);
  const [questions, setQuestions] = useState<ToneQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const finished = useRef(false);

  const q = questions[index];
  const done = level !== null && index >= questions.length && questions.length > 0;

  useEffect(() => {
    if (q && picked === null) speakChinese(q.hanzi, { force: true, rate: 0.7 });
  }, [q, picked]);

  useEffect(() => {
    if (!done || !level || finished.current) return;
    finished.current = true;
    finishRound(level, score);
    if (score > 0) awardXp(score);
    void feedback.levelUp();
  }, [done, level, score, finishRound, awardXp]);

  const start = (l: ToneLevel) => {
    setQuestions(buildRound(l, VOCAB, createRng(Date.now()), ROUND));
    setLevel(l);
    setIndex(0);
    setPicked(null);
    setScore(0);
    finished.current = false;
  };

  const choose = (i: number) => {
    if (!q || picked !== null) return;
    setPicked(i);
    const ok = i === q.answerIndex;
    if (ok) setScore((s) => s + 1);
    void (ok ? feedback.correct() : feedback.wrong());
    recordSyllables(syllableResults(q, i));
    record({ itemId: `tones:${q.hanzi}`, dimension: 'tones', score: ok ? 1 : 0, difficulty: 0, errorTags: ok ? [] : ['tones:contour'] });
  };

  // ---------- Menú
  if (level === null) {
    const weak = weakestTone(stats);
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: c.background }]}>
        <Header title="🎵 Entrenador de tonos" onClose={() => exitTo(router)} />
        <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
          <View style={[styles.row, { gap: spacing.sm }]}>
            <Bao mood="talking" size={64} />
            <Text style={[type.body, styles.flex, { color: c.textPrimary }]}>
              En chino el tono cambia el significado: mā (madre) y mǎ (caballo) son palabras distintas. Escucha y elige la curva que oyes.
            </Text>
          </View>

          <View style={[styles.tones, { gap: spacing.xs }]}>
            {([1, 2, 3, 4, 5] as Tone[]).map((t) => {
              const s = stats[t];
              const total = (s?.right ?? 0) + (s?.wrong ?? 0);
              return (
                <View key={t} style={[styles.toneBox, { borderColor: c.border, borderRadius: radius.sm, backgroundColor: c.surface }]}>
                  <ToneCurve tone={t} width={44} />
                  <Text style={[type.caption, { color: TONE_COLORS[t] }]}>{t === 5 ? 'neutro' : `${t}.º`}</Text>
                  <Text style={[type.caption, { color: c.textSecondary }]}>{total ? `${Math.round(((s?.right ?? 0) / total) * 100)}%` : '—'}</Text>
                </View>
              );
            })}
          </View>
          {weak && (
            <View style={{ backgroundColor: c.primarySoft, borderRadius: radius.sm, padding: spacing.sm }}>
              <Text style={[type.caption, { color: c.primary }]}>TU TONO MÁS DIFÍCIL: {weak === 5 ? 'NEUTRO' : `${weak}.º`}</Text>
              <Text style={[type.body, { color: c.textPrimary }]}>{TONE_TIPS[weak]}</Text>
            </View>
          )}

          {([1, 2, 3] as ToneLevel[]).map((l, i) => (
            <PressableScale key={l} onPress={() => start(l)} accessibilityRole="button" accessibilityLabel={`Nivel ${l}: ${LEVELS[l].title}`}>
              <Card index={i}>
                <View style={[styles.row, { gap: spacing.sm }]}>
                  <View style={[styles.levelBadge, { backgroundColor: c.primary, borderRadius: radius.sm }]}>
                    <Text style={[type.title, { color: c.textOnBrand }]}>{l}</Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={[type.title, { color: c.textPrimary }]}>{LEVELS[l].title}</Text>
                    <Text style={[type.body, { color: c.textSecondary }]}>{LEVELS[l].desc}</Text>
                    <Text style={[type.caption, { color: c.xpText }]}>{best[l] !== undefined ? `Mejor: ${best[l]}/${ROUND}` : 'Sin jugar todavía'}</Text>
                  </View>
                  <Text style={[type.title, { color: c.textSecondary }]}>›</Text>
                </View>
              </Card>
            </PressableScale>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---------- Resultado
  if (done) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: c.background }]}>
        <View style={[styles.flex, styles.center, { padding: spacing.lg, gap: spacing.md }]}>
          <Bao mood={score >= 8 ? 'celebrate' : score >= 5 ? 'happy' : 'encourage'} size={120} />
          <Text style={[type.display, { color: c.textPrimary }]}>
            {score}/{questions.length}
          </Text>
          <Text style={[type.body, { color: c.textSecondary, textAlign: 'center' }]}>
            {score >= 8 ? '¡Tienes muy buen oído! 耳朵很好！' : score >= 5 ? '¡Bien! Los tonos se entrenan escuchando mucho.' : 'Los tonos cuestan al principio. Repite el nivel 1 y escucha con calma.'}
            {score > 0 ? `\n+${score} XP` : ''}
          </Text>
        </View>
        <View style={[styles.footer, { padding: spacing.md, gap: spacing.sm, borderTopColor: c.border }]}>
          <Button3D label="Otra ronda" variant="success" onPress={() => start(level)} />
          <Button3D label="Elegir nivel" variant="ghost" onPress={() => setLevel(null)} />
        </View>
      </SafeAreaView>
    );
  }

  if (!q) return null;
  const ok = picked === q.answerIndex;
  // Primer tono que se confundió, para dar el consejo de ese tono.
  const missed = picked === null ? undefined : q.spoken.find((t, k) => q.options[picked]?.[k] !== t);

  // ---------- Pregunta
  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: c.background }]}>
      <View style={[styles.row, { padding: spacing.sm, gap: spacing.sm }]}>
        <PressableScale onPress={() => setLevel(null)} accessibilityRole="button" accessibilityLabel="Salir" hitSlop={12}>
          <Text style={[type.title, { color: c.textSecondary, paddingHorizontal: spacing.xs }]}>✕</Text>
        </PressableScale>
        <View style={styles.flex}>
          <ProgressBar progress={(index + (picked !== null ? 1 : 0)) / questions.length} />
        </View>
        <Text style={[type.title, { color: c.primary }]}>
          {index + 1}/{questions.length}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
        <Text style={[type.display, { color: c.textPrimary, fontSize: 22 }]}>¿Qué tonos oyes?</Text>
        <View style={[styles.row, { gap: spacing.sm, justifyContent: 'center' }]}>
          <PressableScale
            onPress={() => speakChinese(q.hanzi, { force: true, rate: 0.7 })}
            accessibilityRole="button"
            accessibilityLabel="Escuchar"
            style={[styles.listen, { backgroundColor: c.info, borderRadius: radius.md }]}
          >
            <Text style={styles.listenIcon}>🔊</Text>
          </PressableScale>
          <PressableScale
            onPress={() => speakChinese(q.hanzi, { force: true, rate: 0.4 })}
            accessibilityRole="button"
            accessibilityLabel="Escuchar despacio"
            style={[styles.listenSmall, { backgroundColor: c.surface, borderColor: c.border, borderRadius: radius.md }]}
          >
            <Text style={styles.slowIcon}>🐢</Text>
          </PressableScale>
        </View>

        <View style={[styles.grid, { gap: spacing.sm }]}>
          {q.options.map((opt, i) => {
            const state = picked === null ? 'idle' : i === q.answerIndex ? 'right' : i === picked ? 'wrong' : 'idle';
            return (
              <PressableScale
                key={i}
                onPress={() => choose(i)}
                accessibilityRole="button"
                accessibilityLabel={toneLabel(opt)}
                containerStyle={styles.half}
                style={[
                  styles.opt,
                  {
                    borderRadius: radius.md,
                    backgroundColor: state === 'right' ? c.successSoft : state === 'wrong' ? c.dangerSoft : c.surface,
                    borderColor: state === 'right' ? c.success : state === 'wrong' ? c.danger : c.border,
                  },
                ]}
              >
                <View style={[styles.row, { gap: 4 }]}>
                  {opt.map((t, k) => (
                    <ToneCurve key={k} tone={t} width={opt.length > 1 ? 44 : 64} />
                  ))}
                </View>
                <Text style={[type.caption, { color: c.textSecondary }]}>{toneLabel(opt)}</Text>
              </PressableScale>
            );
          })}
        </View>

        {picked !== null && (
          <View style={[styles.reveal, { backgroundColor: ok ? c.successSoft : c.dangerSoft, borderRadius: radius.md, padding: spacing.md, gap: 4 }]}>
            <Text style={[type.title, { color: ok ? c.successLip : c.danger }]}>{ok ? '¡Correcto!' : `Era ${toneLabel(q.spoken)}`}</Text>
            <View style={[styles.row, { gap: spacing.sm }]}>
              <HanziTones hanzi={q.hanzi} pinyin={q.pinyin} style={[type.hanzi, { fontSize: 36, lineHeight: 46 }]} />
              <View style={styles.flex}>
                <PinyinText pinyin={q.pinyin} style={type.title} />
                <Text style={[type.body, { color: c.textPrimary }]}>{q.meaning}</Text>
              </View>
            </View>
            {q.note && <Text style={[type.body, { color: c.textPrimary }]}>💡 {q.note}</Text>}
            {!ok && !q.note && missed && <Text style={[type.body, { color: c.textPrimary }]}>💡 {TONE_TIPS[missed]}</Text>}
          </View>
        )}
      </ScrollView>

      {picked !== null && (
        <View style={[styles.footer, { padding: spacing.md, borderTopColor: c.border }]}>
          <Button3D
            label="Continuar"
            variant={ok ? 'success' : 'danger'}
            onPress={() => {
              setPicked(null);
              setIndex((n) => n + 1);
            }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

function Header({ title, onClose }: { title: string; onClose: () => void }) {
  const { c, type, spacing } = useTheme();
  return (
    <View style={[styles.row, { padding: spacing.sm, borderBottomWidth: 2, borderBottomColor: c.border }]}>
      <PressableScale onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar" hitSlop={12}>
        <Text style={[type.title, { color: c.textSecondary, paddingHorizontal: spacing.sm }]}>✕</Text>
      </PressableScale>
      <Text style={[type.title, { color: c.textPrimary }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  footer: { borderTopWidth: 2 },
  tones: { flexDirection: 'row' },
  toneBox: { flex: 1, alignItems: 'center', borderWidth: 1.5, paddingVertical: 6 },
  levelBadge: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  listen: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center' },
  listenIcon: { fontSize: 44 },
  listenSmall: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  slowIcon: { fontSize: 28 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  half: { width: '48.5%' },
  opt: { minHeight: 92, alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 2, borderBottomWidth: 4, padding: 8 },
  reveal: {},
});
