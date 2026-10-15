import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HanziTones, PinyinText } from '@/components/learn';
import { ToneCurve } from '@/components/learn/ToneCurve';
import { Bao } from '@/components/mascot';
import { Button3D, Card, PressableScale, ProgressBar } from '@/components/ui';
import { SENTENCES, UNITS } from '@/data/hsk/course';
import type { SampleSentence } from '@/data/hsk/types';
import { hasServer } from '@/lib/api';
import { feedback } from '@/lib/haptics';
import { exitTo } from '@/lib/navigation';
import { speakChinese, stopSpeaking } from '@/lib/speech';
import { useLearnerStore } from '@/store/useLearnerStore';
import { useProgressStore } from '@/store/useProgressStore';
import { trackQuest } from '@/store/useQuestStore';
import { useTheme } from '@/theme';
import { useVoiceInput } from '@/features/chat/useVoiceInput';
import { type GradedSyllable, gradeScore, gradeSyllables, gradeTips, type Light, starsFor } from './grade';

const PER_ROUND = 8;
const MAX_TRIES = 3;

/** Frases de la unidad en la que vas (y de las anteriores si faltan). */
export function practiceSentences(completed: string[], count = PER_ROUND): SampleSentence[] {
  const ui = Math.max(0, UNITS.findIndex((u) => u.nodes.some((n) => !completed.includes(n.id))));
  const out: SampleSentence[] = [];
  for (let i = ui; i >= 0 && out.length < count; i--) {
    const unit = UNITS[i]!;
    out.push(...SENTENCES.filter((s) => s.id.startsWith(`${unit.id}-`) && s.tokens.length >= 2).slice(0, count - out.length));
  }
  return out;
}

interface Attempt {
  graded: GradedSyllable[];
  score: number;
  transcript: string;
}

/** Pronunciación con semáforo: Bao dice la frase, la repites y cada sílaba sale en verde, amarillo o rojo. */
export function PronunciationScreen() {
  const { c, type, spacing, radius } = useTheme();
  const router = useRouter();
  const completed = useProgressStore((s) => s.completedNodeIds);
  const awardXp = useProgressStore((s) => s.awardXp);
  const record = useLearnerStore((s) => s.record);
  const voice = useVoiceInput();

  const [round, setRound] = useState<SampleSentence[]>(() => practiceSentences(completed));
  const [index, setIndex] = useState(0);
  const [tries, setTries] = useState(0);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [best, setBest] = useState<Record<string, Attempt>>({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const rewarded = useRef(false);

  const s = round[index];
  const hanzi = s?.tokens.join('') ?? '';
  const done = index >= round.length && round.length > 0;

  useEffect(() => {
    if (s) speakChinese(hanzi, { force: true, rate: 0.8 });
  }, [s, hanzi]);

  useEffect(() => () => {
    stopSpeaking();
    voice.cancel();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const results = useMemo(() => round.map((r) => best[r.id]).filter((a): a is Attempt => !!a), [round, best]);
  const total = results.reduce((a, r) => a + r.score, 0) / Math.max(1, results.length);
  const stars = starsFor(total);
  const xp = 5 + stars * 5;

  useEffect(() => {
    if (!done || rewarded.current) return;
    rewarded.current = true;
    awardXp(xp);
    void feedback.levelUp();
  }, [done, awardXp, xp]);

  const onMic = async () => {
    setNotice(null);
    if (!s) return;
    if (!voice.recording) {
      const err = await voice.start();
      if (err) setNotice(err);
      return;
    }
    setBusy(true);
    const r = await voice.stop(hanzi);
    setBusy(false);
    if (!r.ok) {
      setNotice(r.message);
      return;
    }
    const graded = gradeSyllables(hanzi, s.pinyin, r.result);
    const score = gradeScore(graded);
    const a = { graded, score, transcript: r.result.transcript };
    setAttempt(a);
    setTries((t) => t + 1);
    setBest((b) => (b[s.id] && b[s.id]!.score >= score ? b : { ...b, [s.id]: a }));
    trackQuest('pronounce');
    void (score >= 0.85 ? feedback.correct() : feedback.wrong());
    // Las sílabas en amarillo o rojo pasan a los puntos débiles del estudiante.
    for (const g of graded) {
      if (g.light === 'green') continue;
      record({
        itemId: `tones:${g.hanzi}`,
        dimension: g.light === 'yellow' ? 'tones' : 'speaking',
        score: g.light === 'yellow' ? 0.4 : 0,
        difficulty: 0,
        errorTags: [g.light === 'yellow' ? 'tones:contour' : 'speaking:unclear'],
      });
    }
  };

  const next = () => {
    stopSpeaking();
    setAttempt(null);
    setTries(0);
    setNotice(null);
    setIndex((i) => i + 1);
  };

  const restartWith = (list: SampleSentence[]) => {
    rewarded.current = false;
    setBest({});
    setRound(list);
    setIndex(0);
    setTries(0);
    setAttempt(null);
  };

  if (!hasServer) {
    return (
      <SafeAreaView style={[styles.flex, styles.center, { backgroundColor: c.background, padding: spacing.lg, gap: spacing.md }]}>
        <Bao mood="encourage" size={110} />
        <Text style={[type.title, { color: c.textPrimary, textAlign: 'center' }]}>El reconocimiento de voz necesita internet</Text>
        <Text style={[type.body, { color: c.textSecondary, textAlign: 'center' }]}>Mientras tanto, prueba «Sombra»: funciona sin conexión.</Text>
        <Button3D label="Ir a Sombra" onPress={() => router.replace('/shadowing')} />
        <Button3D label="Volver" variant="ghost" onPress={() => exitTo(router)} />
      </SafeAreaView>
    );
  }

  if (done) {
    const counts = { green: 0, yellow: 0, red: 0 } as Record<Light, number>;
    for (const r of results) for (const g of r.graded) counts[g.light]++;
    const toneCounts = new Map<number, number>();
    for (const r of results) for (const g of r.graded) if (g.light === 'yellow') toneCounts.set(g.tone, (toneCounts.get(g.tone) ?? 0) + 1);
    const worstTone = [...toneCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const withRed = round.filter((r) => best[r.id]?.graded.some((g) => g.light === 'red'));
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: c.background }]}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, alignItems: 'center' }}>
          <Bao mood={stars >= 2 ? 'celebrate' : 'encourage'} size={110} />
          <Text style={[type.display, { color: c.textPrimary }]}>¡Práctica terminada!</Text>
          <Text style={[type.display, { color: c.success, fontSize: 44, lineHeight: 50 }]}>{Math.round(total * 100)}%</Text>
          <Text style={{ fontSize: 28 }}>{'⭐'.repeat(stars) || '💪'}</Text>
          <Card style={{ alignSelf: 'stretch' }}>
            <Text style={[type.body, { color: c.textPrimary }]}>🟢 {counts.green} sílabas claras</Text>
            <Text style={[type.body, { color: c.textPrimary }]}>
              🟡 {counts.yellow} con el tono cambiado{worstTone ? ` · sobre todo el ${worstTone === 5 ? 'neutro' : `${worstTone}.º`}` : ''}
            </Text>
            <Text style={[type.body, { color: c.textPrimary }]}>🔴 {counts.red} que no se oyeron</Text>
          </Card>
          <Text style={[type.body, { color: c.xpText }]}>+{xp} XP</Text>
          <View style={{ alignSelf: 'stretch', gap: spacing.sm }}>
            <Button3D label="Continuar" variant="success" onPress={() => exitTo(router)} />
            {withRed.length ? <Button3D label={`Repasar las rojas (${withRed.length})`} variant="ghost" onPress={() => restartWith(withRed)} /> : null}
            <Button3D label="Otra ronda" variant="ghost" onPress={() => restartWith(practiceSentences(completed))} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!s) return null;
  const tips = attempt ? gradeTips(attempt.graded) : [];
  const lightColor = (l: Light) => (l === 'green' ? c.success : l === 'yellow' ? c.xp : c.danger);
  const lightSoft = (l: Light) => (l === 'green' ? c.successSoft : l === 'yellow' ? 'rgba(255,194,26,0.18)' : c.dangerSoft);

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: c.background }]}>
      <View style={[styles.row, { padding: spacing.md, gap: spacing.sm }]}>
        <PressableScale onPress={() => exitTo(router)} accessibilityRole="button" accessibilityLabel="Salir" hitSlop={10}>
          <Text style={[type.title, { color: c.textSecondary }]}>✕</Text>
        </PressableScale>
        <View style={styles.flex}>
          <ProgressBar progress={index / round.length} />
        </View>
        <Text style={[type.caption, { color: c.textSecondary }]}>
          {index + 1}/{round.length}
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl }}>
        <Card>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <HanziTones hanzi={hanzi} pinyin={s.pinyin} style={[type.hanzi, { fontSize: 30, lineHeight: 42, textAlign: 'center' }]} />
            <PinyinText pinyin={s.pinyin} style={[type.title, { textAlign: 'center' }]} />
            <Text style={[type.body, { color: c.textSecondary, textAlign: 'center' }]}>{s.meaning}</Text>
          </View>
        </Card>
        <View style={[styles.row, { justifyContent: 'center', gap: spacing.sm }]}>
          <Button3D label="🔊 Escuchar a Bao" variant="ghost" onPress={() => speakChinese(hanzi, { force: true, rate: 0.8 })} />
          <Button3D label="🐢" variant="ghost" onPress={() => speakChinese(hanzi, { force: true, rate: 0.5 })} />
        </View>

        {attempt ? (
          <View style={{ gap: spacing.sm }}>
            <View style={[styles.row, { justifyContent: 'center', flexWrap: 'wrap', gap: 6 }]} accessibilityLabel="Resultado por sílaba">
              {attempt.graded.map((g, i) => (
                <View
                  key={i}
                  style={[styles.syl, { borderColor: lightColor(g.light), backgroundColor: lightSoft(g.light), borderRadius: radius.md }]}
                  accessibilityLabel={`${g.hanzi}: ${g.light === 'green' ? 'bien' : g.light === 'yellow' ? 'tono cambiado' : 'no se oyó'}`}
                >
                  <Text style={[type.hanzi, { fontSize: 24, lineHeight: 30, color: c.textPrimary }]}>{g.hanzi}</Text>
                  <Text style={[type.caption, { color: c.textSecondary }]}>{g.pinyin}</Text>
                </View>
              ))}
            </View>
            <Card>
              <Text style={[type.body, { color: c.textPrimary }]}>
                <Text style={{ fontFamily: 'Nunito_800ExtraBold' }}>Bao oyó: </Text>
                {attempt.transcript}
              </Text>
              {tips.map((t, i) => (
                <View key={i} style={[styles.tip, { backgroundColor: lightSoft(t.light), borderRadius: radius.sm, marginTop: spacing.xs }]}>
                  <Text style={[type.body, { color: c.textPrimary }]}>
                    {t.light === 'yellow' ? '🟡 ' : '🔴 '}
                    {t.text}
                  </Text>
                  {t.tone && t.tone !== 5 ? (
                    <View style={{ alignItems: 'center', marginTop: 4 }}>
                      <ToneCurve tone={t.tone} width={90} />
                    </View>
                  ) : null}
                </View>
              ))}
              {!tips.length ? <Text style={[type.body, { color: c.success, marginTop: spacing.xs }]}>🎉 ¡Perfecto! Todas las sílabas se entendieron.</Text> : null}
            </Card>
          </View>
        ) : null}

        {notice ? <Text style={[type.body, { color: c.danger, textAlign: 'center' }]}>{notice}</Text> : null}

        <View style={{ alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm }}>
          {tries < MAX_TRIES || voice.recording ? (
            <PressableScale onPress={() => void onMic()} disabled={busy} accessibilityRole="button" accessibilityLabel={voice.recording ? 'Terminar de grabar' : 'Grabar tu voz'}>
              <View style={[styles.mic, { backgroundColor: voice.recording ? c.danger : c.info, opacity: busy ? 0.5 : 1 }]}>
                <Text style={{ fontSize: 38 }}>{busy ? '⏳' : voice.recording ? '⏹' : '🎙️'}</Text>
              </View>
            </PressableScale>
          ) : null}
          <Text style={[type.caption, { color: voice.recording ? c.danger : c.textSecondary, textAlign: 'center' }]}>
            {busy
              ? 'Bao está escuchando…'
              : voice.recording
                ? '🔴 Grabando… toca ⏹ al terminar'
                : attempt
                  ? tries < MAX_TRIES
                    ? `Toca 🎙️ para repetir (se queda el mejor de ${MAX_TRIES})`
                    : 'Ya has hecho 3 intentos: ¡a por la siguiente!'
                  : 'Toca 🎙️ y repite la frase'}
          </Text>
        </View>
        {attempt && !voice.recording && !busy ? <Button3D label={index + 1 < round.length ? 'Siguiente' : 'Ver resultado'} variant={tries >= MAX_TRIES || attempt.score >= 0.85 ? 'success' : 'ghost'} onPress={next} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  syl: { minWidth: 48, paddingHorizontal: 6, paddingVertical: 6, borderWidth: 2, borderBottomWidth: 4, alignItems: 'center' },
  tip: { padding: 10 },
  mic: { width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center' },
});
