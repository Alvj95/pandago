import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bao } from '@/components/mascot';
import { Button3D, Card, PressableScale, ProgressBar } from '@/components/ui';
import { SENTENCES, VOCAB } from '@/data/hsk/course';
import { STORIES } from '@/data/stories';
import { createRng } from '@/features/lesson/engine/random';
import { feedback } from '@/lib/haptics';
import { exitTo } from '@/lib/navigation';
import { speakChinese } from '@/lib/speech';
import { useExamStore } from '@/store/useExamStore';
import { useProgressStore } from '@/store/useProgressStore';
import { trackQuest } from '@/store/useQuestStore';
import { useTheme } from '@/theme';
import { buildExam, type ExamQuestion, EXAMS, PASS_SCORE, scoreExam, TYPE_LABEL } from './exam';

type ExamKey = keyof typeof EXAMS;
const EXAM_XP = 20;
const MEDAL_GEMS = 50;

/** Simulacro HSK: elegir examen → responder con tiempo (sin corrección inmediata, como en el real) → nota y repaso. */
export function ExamScreen() {
  const { c, type, spacing, radius } = useTheme();
  const router = useRouter();
  const best = useExamStore((s) => s.best);
  const recordBest = useExamStore((s) => s.record);
  const awardXp = useProgressStore((s) => s.awardXp);
  const earnGems = useProgressStore((s) => s.earnGems);

  const [key, setKey] = useState<ExamKey | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<(number | undefined)[]>([]);
  const [index, setIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showPinyin, setShowPinyin] = useState(true);
  const rewarded = useRef(false);

  const q = questions[index];
  const result = useMemo(() => (finished ? scoreExam(questions, answers) : null), [finished, questions, answers]);

  useEffect(() => {
    if (!key || finished) return;
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [key, finished]);
  useEffect(() => {
    if (key && !finished && seconds === 0 && questions.length) setFinished(true);
  }, [seconds, key, finished, questions.length]);

  // Audición: cada pregunta se oye al aparecer (se puede repetir, como mucho, tocando 🔊).
  useEffect(() => {
    if (q?.speak && !finished) speakChinese(q.speak, { force: true, rate: 0.8 });
  }, [q, finished]);

  useEffect(() => {
    if (!result || !key || rewarded.current) return;
    rewarded.current = true;
    const firstPass = result.passed && (best[key] ?? 0) < PASS_SCORE;
    recordBest(key, result.total);
    awardXp(EXAM_XP);
    if (result.passed) trackQuest('exam_pass');
    if (firstPass) earnGems(MEDAL_GEMS);
    void feedback.levelUp();
  }, [result, key, best, recordBest, awardXp, earnGems]);

  const start = (k: ExamKey) => {
    const qs = buildExam(EXAMS[k], { vocab: VOCAB, sentences: SENTENCES, stories: STORIES }, createRng(Date.now()));
    setQuestions(qs);
    setAnswers(qs.map(() => undefined));
    setIndex(0);
    setSeconds(EXAMS[k].minutes * 60);
    setFinished(false);
    rewarded.current = false;
    setKey(k);
  };

  // ---------- Menú
  if (!key) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: c.background }]}>
        <Header onClose={() => exitTo(router)} />
        <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
          <View style={[styles.row, { gap: spacing.sm }]}>
            <Bao mood="talking" size={64} />
            <Text style={[type.body, styles.flex, { color: c.textSecondary }]}>
              Practica con el formato del examen oficial HSK: una parte de escuchar y otra de leer. Cada parte vale 100 puntos; se aprueba con {PASS_SCORE} de 200. No verás si aciertas hasta el final.
            </Text>
          </View>
          {(Object.keys(EXAMS) as ExamKey[]).map((k, i) => {
            const e = EXAMS[k];
            const b = best[k];
            return (
              <PressableScale key={k} onPress={() => start(k)} accessibilityRole="button" accessibilityLabel={e.title}>
                <Card index={i}>
                  <View style={[styles.row, { gap: spacing.sm }]}>
                    <Text style={styles.icon}>{b !== undefined && b >= PASS_SCORE ? '🏅' : '📝'}</Text>
                    <View style={styles.flex}>
                      <Text style={[type.title, { color: c.textPrimary }]}>{e.title}</Text>
                      <Text style={[type.body, { color: c.textSecondary }]}>{e.desc}</Text>
                      <Text style={[type.caption, { color: b !== undefined ? (b >= PASS_SCORE ? c.success : c.danger) : c.textSecondary }]}>
                        {b !== undefined ? `Mejor nota: ${b}/200 ${b >= PASS_SCORE ? '· aprobado' : ''}` : 'Sin hacer todavía'}
                      </Text>
                    </View>
                    <Text style={[type.title, { color: c.textSecondary }]}>›</Text>
                  </View>
                </Card>
              </PressableScale>
            );
          })}
          <Text style={[type.caption, { color: c.textSecondary }]}>
            Las imágenes del examen real aquí son emojis. Al aprobar por primera vez ganas una medalla 🏅 y {MEDAL_GEMS} 💎.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---------- Resultado
  if (result) {
    const wrong = questions.map((qq, i) => ({ qq, a: answers[i] })).filter((x) => x.a !== x.qq.answer);
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: c.background }]}>
        <Header onClose={() => exitTo(router)} />
        <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
          <View style={[styles.center, { gap: spacing.xs }]}>
            <Bao mood={result.passed ? 'celebrate' : 'encourage'} size={110} />
            <Text style={[type.display, { color: result.passed ? c.successLip : c.danger }]}>{result.total}/200</Text>
            <Text style={[type.title, { color: c.textPrimary }]}>{result.passed ? '¡Aprobado! 🏅' : `Necesitas ${PASS_SCORE} para aprobar`}</Text>
            <Text style={[type.caption, { color: c.textSecondary }]}>+{EXAM_XP} XP</Text>
          </View>
          {(['listening', 'reading'] as const).map((s) => (
            <View key={s} style={{ gap: 4 }}>
              <Text style={[type.body, { color: c.textPrimary }]}>
                {s === 'listening' ? '👂 Comprensión auditiva' : '📖 Lectura'}: {result[s]}/100
              </Text>
              <ProgressBar progress={result[s] / 100} color={result[s] >= 60 ? c.success : c.danger} height={10} />
            </View>
          ))}
          <View style={{ gap: 4 }}>
            <Text style={[type.caption, { color: c.textSecondary }]}>POR TIPO DE PREGUNTA</Text>
            {Object.entries(result.byType).map(([t, v]) => (
              <Text key={t} style={[type.body, { color: v.right / v.total >= 0.6 ? c.textPrimary : c.danger }]}>
                {v.right / v.total >= 0.6 ? '✓' : '✗'} {TYPE_LABEL[t as keyof typeof TYPE_LABEL]}: {v.right}/{v.total}
              </Text>
            ))}
          </View>
          {wrong.length > 0 && (
            <View style={{ gap: spacing.xs }}>
              <Text style={[type.caption, { color: c.textSecondary }]}>REPASA TUS ERRORES ({wrong.length})</Text>
              {wrong.map(({ qq, a }, i) => (
                <PressableScale
                  key={i}
                  onPress={() => speakChinese(qq.speak ?? qq.text ?? '', { force: true })}
                  style={[styles.review, { backgroundColor: c.surfaceRaised, borderColor: c.border, borderRadius: radius.sm, padding: spacing.sm }]}
                >
                  <Text style={[type.caption, { color: c.textSecondary }]}>{TYPE_LABEL[qq.type]}</Text>
                  <Text style={[type.body, { color: c.textPrimary }]}>{qq.explain}</Text>
                  <Text style={[type.caption, { color: c.danger }]}>
                    Tu respuesta: {a === undefined ? '(sin responder)' : qq.options[a]?.label} · Correcta: {qq.options[qq.answer]?.label}
                  </Text>
                </PressableScale>
              ))}
            </View>
          )}
          <Button3D label="Otro simulacro" variant="success" onPress={() => start(key)} />
          <Button3D label="Elegir examen" variant="ghost" onPress={() => setKey(null)} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!q) return null;
  const mm = Math.floor(seconds / 60);
  const ss = String(seconds % 60).padStart(2, '0');
  const picked = answers[index];
  const isPictures = q.options.every((o) => o.emoji);
  const last = index === questions.length - 1;

  // ---------- Pregunta
  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: c.background }]}>
      <View style={[styles.row, { padding: spacing.sm, gap: spacing.sm }]}>
        <PressableScale onPress={() => setFinished(true)} accessibilityRole="button" accessibilityLabel="Terminar examen" hitSlop={12}>
          <Text style={[type.caption, { color: c.danger, paddingHorizontal: spacing.xs }]}>TERMINAR</Text>
        </PressableScale>
        <View style={styles.flex}>
          <ProgressBar progress={(index + 1) / questions.length} />
        </View>
        <Text style={[type.title, { color: seconds < 60 ? c.danger : c.primary, fontVariant: ['tabular-nums'] }]}>
          {mm}:{ss}
        </Text>
      </View>
      <View style={[styles.row, { paddingHorizontal: spacing.md, gap: spacing.xs }]}>
        <Text style={[type.caption, styles.flex, { color: c.textSecondary }]}>
          {q.section === 'listening' ? '👂 AUDICIÓN' : '📖 LECTURA'} · PREGUNTA {index + 1} DE {questions.length}
        </Text>
        <Text style={[type.caption, { color: c.textSecondary }]}>Pinyin</Text>
        <Switch value={showPinyin} onValueChange={setShowPinyin} trackColor={{ true: c.success, false: c.locked }} accessibilityLabel="Mostrar pinyin" />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
        <Text style={[type.title, { color: c.textPrimary }]}>{q.instruction}</Text>
        <View style={[styles.prompt, { backgroundColor: c.surfaceRaised, borderColor: c.border, borderRadius: radius.md, padding: spacing.md, gap: spacing.xs }]}>
          {q.speak && (
            <PressableScale onPress={() => speakChinese(q.speak!, { force: true, rate: 0.8 })} accessibilityRole="button" accessibilityLabel="Volver a escuchar">
              <Text style={styles.speaker}>🔊</Text>
            </PressableScale>
          )}
          {q.emoji && <Text style={styles.bigEmoji}>{q.emoji}</Text>}
          {q.text && <Text style={[type.hanzi, { fontSize: q.text.length > 8 ? 24 : 34, lineHeight: q.text.length > 8 ? 34 : 46, color: c.textPrimary, textAlign: 'center' }]}>{q.text}</Text>}
          {q.text && q.pinyin && showPinyin && <Text style={[type.caption, { color: c.textSecondary, textAlign: 'center' }]}>{q.pinyin}</Text>}
        </View>

        <View style={[isPictures || q.options.length === 2 ? styles.grid : null, { gap: spacing.sm }]}>
          {q.options.map((o, i) => (
            <PressableScale
              key={i}
              onPress={() => {
                void feedback.tap();
                setAnswers((a) => a.map((x, k) => (k === index ? i : x)));
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: picked === i }}
              accessibilityLabel={o.sub ? `${o.label} ${o.sub}` : o.label}
              containerStyle={isPictures ? styles.third : q.options.length === 2 ? styles.half : undefined}
              style={[
                styles.option,
                { borderRadius: radius.md, padding: spacing.sm, borderColor: picked === i ? c.info : c.border, backgroundColor: picked === i ? c.surfaceRaised : c.surface },
              ]}
            >
              <Text style={[isPictures ? styles.optEmoji : type.hanzi, !isPictures && { fontSize: 20, lineHeight: 28, color: c.textPrimary, textAlign: 'center' }]}>
                {String.fromCharCode(65 + i)}
                {'  '}
                {o.label}
              </Text>
              {o.sub && (showPinyin || q.options.length === 2) && <Text style={[type.caption, { color: c.textSecondary, textAlign: 'center' }]}>{o.sub}</Text>}
            </PressableScale>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, styles.row, { padding: spacing.md, gap: spacing.sm, borderTopColor: c.border }]}>
        {index > 0 && (
          <View style={styles.back}>
            <Button3D label="Atrás" variant="ghost" onPress={() => setIndex((n) => n - 1)} />
          </View>
        )}
        <View style={styles.flex}>
          <Button3D
            label={last ? 'Entregar examen' : picked === undefined ? 'Saltar' : 'Siguiente'}
            variant={last ? 'success' : 'primary'}
            onPress={() => (last ? setFinished(true) : setIndex((n) => n + 1))}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function Header({ onClose }: { onClose: () => void }) {
  const { c, type, spacing } = useTheme();
  return (
    <View style={[styles.row, { padding: spacing.sm, borderBottomWidth: 2, borderBottomColor: c.border }]}>
      <PressableScale onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar" hitSlop={12}>
        <Text style={[type.title, { color: c.textSecondary, paddingHorizontal: spacing.sm }]}>✕</Text>
      </PressableScale>
      <Text style={[type.title, { color: c.textPrimary }]}>📝 Simulacro HSK</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  center: { alignItems: 'center' },
  footer: { borderTopWidth: 2 },
  back: { width: 110 },
  icon: { fontSize: 32 },
  prompt: { alignItems: 'center', borderWidth: 2, borderBottomWidth: 4 },
  speaker: { fontSize: 44 },
  bigEmoji: { fontSize: 72, lineHeight: 86 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  third: { width: '31.5%' },
  half: { width: '48.5%' },
  option: { alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderBottomWidth: 4, minHeight: 64 },
  optEmoji: { fontSize: 40, lineHeight: 52 },
  review: { borderWidth: 1.5, gap: 2 },
});
