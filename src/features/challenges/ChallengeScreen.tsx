import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bao } from '@/components/mascot';
import { Button3D, PressableScale, ProgressBar } from '@/components/ui';
import { SENTENCES, UNITS, VOCAB } from '@/data/hsk/course';
import { createRng } from '@/features/lesson/engine/random';
import { feedback } from '@/lib/haptics';
import { exitTo } from '@/lib/navigation';
import { speakChinese } from '@/lib/speech';
import { useLearnerStore } from '@/store/useLearnerStore';
import { MAX_HEARTS, useProgressStore } from '@/store/useProgressStore';
import { useTheme } from '@/theme';
import { trackQuest } from '@/store/useQuestStore';
import { answer, buildChallenge, MAX_CHALLENGE_HEARTS_PER_DAY, type Challenge, type ChallengeKind, pickKind, progressOf, seenVocab, startRun, timeUp, weakVocab } from './engine';

const WIN_XP = 5;

/** Reto corto: intro → partida rápida (sin botón «Comprobar») → resultado con vida ganada. */
export function ChallengeScreen() {
  const { c, type, spacing, radius } = useTheme();
  const router = useRouter();
  const model = useLearnerStore((s) => s.model);
  const record = useLearnerStore((s) => s.record);
  const completed = useProgressStore((s) => s.completedNodeIds);
  const hearts = useProgressStore((s) => s.hearts);
  const left = useProgressStore((s) => s.challengeHeartsLeft());
  const winChallengeHeart = useProgressStore((s) => s.winChallengeHeart);
  const awardXp = useProgressStore((s) => s.awardXp);

  const newChallenge = useCallback(
    (avoid?: ChallengeKind) => {
      const rng = createRng(Date.now());
      const skillIds = UNITS.flatMap((u) => u.nodes).filter((n) => completed.includes(n.id)).flatMap((n) => n.skillIds);
      const firstUnit = new Set(UNITS[0]?.nodes.flatMap((n) => n.skillIds));
      const pool = seenVocab(VOCAB, model, skillIds, VOCAB.filter((v) => firstUnit.has(v.id)));
      const weak = weakVocab(VOCAB, model);
      return buildChallenge(pickKind(weak.length, rng, avoid), { pool, all: VOCAB, sentences: SENTENCES, weak }, rng);
    },
    [completed, model],
  );

  const [challenge, setChallenge] = useState<Challenge>(() => newChallenge());
  const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro');
  const [run, setRun] = useState(startRun);
  const [picked, setPicked] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(challenge.timeLimitSec ?? 0);
  const [heartWon, setHeartWon] = useState(false);
  const rewarded = useRef(false);

  const q = challenge.questions[run.index];

  // Cronómetro del relámpago.
  useEffect(() => {
    if (phase !== 'play' || !challenge.timeLimitSec) return;
    const t = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [phase, challenge.timeLimitSec]);
  useEffect(() => {
    if (phase === 'play' && challenge.timeLimitSec && seconds === 0) setRun((r) => timeUp(r));
  }, [seconds, phase, challenge.timeLimitSec]);

  // Pregunta de escuchar: Bao la dice al aparecer.
  useEffect(() => {
    if (phase === 'play' && q?.speak && picked === null) speakChinese(q.speak, { force: true });
  }, [phase, q, picked]);

  // Fin de partida → premio una sola vez.
  useEffect(() => {
    if (run.result === 'playing' || phase !== 'play') return;
    const t = setTimeout(() => {
      setPhase('done');
      if (run.result === 'won' && !rewarded.current) {
        rewarded.current = true;
        setHeartWon(winChallengeHeart());
        awardXp(WIN_XP);
        trackQuest('challenge_won');
        void feedback.levelUp();
      }
    }, 700);
    return () => clearTimeout(t);
  }, [run.result, phase, winChallengeHeart, awardXp]);

  const choose = (i: number) => {
    if (!q || picked !== null || run.result !== 'playing') return;
    setPicked(i);
    const ok = i === q.answerIndex;
    void (ok ? feedback.correct() : feedback.wrong());
    if (q.itemId) record({ itemId: q.itemId, dimension: q.speak ? 'listening' : 'vocab', score: ok ? 1 : 0, difficulty: 0 });
    setTimeout(
      () => {
        setPicked(null);
        setRun((r) => answer(challenge, r, i));
      },
      ok ? 450 : 1300,
    );
  };

  const restart = () => {
    const next = newChallenge(challenge.kind);
    setChallenge(next);
    setRun(startRun());
    setSeconds(next.timeLimitSec ?? 0);
    setPicked(null);
    setHeartWon(false);
    rewarded.current = false;
    setPhase('intro');
  };

  const heartsRow = useMemo(() => Array.from({ length: MAX_HEARTS }, (_, i) => (i < hearts ? '❤️' : '🤍')).join(''), [hearts]);
  const canWinHeart = hearts < MAX_HEARTS && left > 0;

  if (phase === 'intro') {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: c.background }]}>
        <ScrollView contentContainerStyle={[styles.center, { padding: spacing.lg, gap: spacing.md, flexGrow: 1 }]}>
          <Bao mood="talking" size={110} />
          <Text style={[type.display, { color: c.textPrimary, textAlign: 'center' }]}>
            {challenge.icon} {challenge.title}
          </Text>
          <Text style={[type.body, { color: c.textSecondary, textAlign: 'center', fontSize: 17, lineHeight: 24 }]}>{challenge.rules}</Text>
          <Text style={styles.hearts}>{heartsRow}</Text>
          <Text style={[type.caption, { color: canWinHeart ? c.success : c.textSecondary, textAlign: 'center' }]}>
            {canWinHeart
              ? `Premio: +1 ❤️ y +${WIN_XP} XP · te quedan ${left} vidas por retos hoy`
              : hearts >= MAX_HEARTS
                ? `Tienes todas las vidas: juega por +${WIN_XP} XP`
                : `Hoy ya ganaste las ${MAX_CHALLENGE_HEARTS_PER_DAY} vidas de los retos. Juega por +${WIN_XP} XP o vuelve mañana.`}
          </Text>
        </ScrollView>
        <View style={[styles.footer, { padding: spacing.md, gap: spacing.sm, borderTopColor: c.border }]}>
          <Button3D label="¡Empezar!" variant="success" onPress={() => setPhase('play')} />
          <Button3D label="Otro reto" variant="ghost" onPress={restart} />
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'done') {
    const won = run.result === 'won';
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: c.background }]}>
        <View style={[styles.flex, styles.center, { padding: spacing.lg, gap: spacing.md }]}>
          <Bao mood={won ? 'celebrate' : 'encourage'} size={130} />
          <Text style={[type.display, { color: won ? c.successLip : c.textPrimary, textAlign: 'center' }]}>{won ? '¡Reto superado!' : '¡Casi!'}</Text>
          <Text style={styles.hearts}>{heartsRow}</Text>
          <Text style={[type.body, { color: c.textSecondary, textAlign: 'center' }]}>
            {won
              ? `${heartWon ? '+1 ❤️ · ' : ''}+${WIN_XP} XP${heartWon ? ` · te quedan ${left} vidas por retos hoy` : ''}`
              : challenge.streak
                ? `Necesitabas ${challenge.need} seguidas y se acabó el tiempo. Acertaste ${run.correct} de ${run.answered}. ¡Prueba otra vez!`
                : `Has acertado ${run.correct} de ${run.answered}. Necesitabas ${challenge.need}. ¡Prueba otra vez!`}
          </Text>
        </View>
        <View style={[styles.footer, { padding: spacing.md, gap: spacing.sm, borderTopColor: c.border }]}>
          <Button3D label={won ? 'Seguir aprendiendo' : 'Intentar otro reto'} variant="success" onPress={won ? () => exitTo(router) : restart} />
          <Button3D label={won ? (canWinHeart ? 'Otro reto (+1 ❤️)' : 'Otro reto') : 'Salir'} variant="ghost" onPress={won ? restart : () => exitTo(router)} />
        </View>
      </SafeAreaView>
    );
  }

  if (!q) return null;
  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: c.background }]}>
      <View style={[styles.row, { padding: spacing.sm, gap: spacing.sm }]}>
        <PressableScale onPress={() => exitTo(router)} accessibilityRole="button" accessibilityLabel="Salir" hitSlop={12}>
          <Text style={[type.title, { color: c.textSecondary, paddingHorizontal: spacing.xs }]}>✕</Text>
        </PressableScale>
        <View style={styles.flex}>
          <ProgressBar progress={progressOf(challenge, run)} color={c.success} />
        </View>
        <Text style={[type.title, { color: challenge.timeLimitSec && seconds <= 10 ? c.danger : c.primary, fontVariant: ['tabular-nums'] }]}>
          {challenge.timeLimitSec ? `0:${String(seconds).padStart(2, '0')}` : `${run.correct}/${challenge.need}`}
        </Text>
      </View>
      <Text style={[type.caption, { color: c.textSecondary, textAlign: 'center' }]}>
        {challenge.icon} {challenge.title.toUpperCase()}
        {challenge.streak ? ` · RACHA ${run.streak}/${challenge.need}` : ''}
      </Text>

      <View style={[styles.flex, { padding: spacing.md, gap: spacing.md, justifyContent: 'center' }]}>
        <PressableScale
          disabled={!q.speak}
          onPress={() => q.speak && speakChinese(q.speak, { force: true })}
          style={[styles.card, { backgroundColor: c.surfaceRaised, borderColor: c.border, borderRadius: radius.md, padding: spacing.md }]}
        >
          <Text style={[type.hanzi, { color: c.textPrimary, fontSize: q.prompt.length > 6 ? 28 : 48, lineHeight: q.prompt.length > 6 ? 38 : 62, textAlign: 'center' }]}>
            {q.prompt}
          </Text>
          {q.promptSub && <Text style={[type.title, { color: c.textSecondary, textAlign: 'center' }]}>{q.promptSub}</Text>}
          {q.speak && <Text style={[type.caption, { color: c.info }]}>Toca para volver a oír</Text>}
        </PressableScale>

        <View style={[styles.grid, { gap: spacing.sm }]}>
          {q.options.map((opt, i) => {
            const state = picked === null ? 'idle' : i === q.answerIndex ? 'right' : i === picked ? 'wrong' : 'idle';
            const bg = state === 'right' ? c.successSoft : state === 'wrong' ? c.dangerSoft : c.surface;
            const border = state === 'right' ? c.success : state === 'wrong' ? c.danger : c.border;
            return (
              <PressableScale
                key={`${run.index}-${i}`}
                onPress={() => choose(i)}
                accessibilityRole="button"
                accessibilityLabel={opt}
                containerStyle={styles.half}
                style={[styles.opt, { backgroundColor: bg, borderColor: border, borderRadius: radius.md, padding: spacing.sm }]}
              >
                <Text style={[q.options.every((o) => /\p{Script=Han}/u.test(o)) ? type.hanzi : type.title, { color: c.textPrimary, fontSize: 20, lineHeight: 28, textAlign: 'center' }]}>
                  {opt}
                </Text>
              </PressableScale>
            );
          })}
        </View>
        <Text style={[type.body, { color: picked === q.answerIndex ? c.successLip : c.danger, textAlign: 'center', minHeight: 24 }]}>
          {picked === null ? '' : picked === q.answerIndex ? `✓ ${q.explain}` : `✗ ${q.explain}`}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  footer: { borderTopWidth: 2 },
  hearts: { fontSize: 26, textAlign: 'center' },
  card: { alignItems: 'center', borderWidth: 2, borderBottomWidth: 4, gap: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  half: { width: '48.5%' },
  opt: { minHeight: 64, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderBottomWidth: 4 },
});
