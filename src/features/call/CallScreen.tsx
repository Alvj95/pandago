import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bao } from '@/components/mascot';
import { StarButton } from '@/components/learn/StarButton';
import { Button3D, Card, PressableScale } from '@/components/ui';
import { VOCAB } from '@/data/hsk/course';
import { hasServer } from '@/lib/api';
import { getAuthToken } from '@/lib/auth';
import { feedback } from '@/lib/haptics';
import { exitTo } from '@/lib/navigation';
import { speakChinese, stopSpeaking } from '@/lib/speech';
import { useLearnerStore } from '@/store/useLearnerStore';
import { useProgressStore } from '@/store/useProgressStore';
import { trackQuest } from '@/store/useQuestStore';
import { useTheme } from '@/theme';
import { requestTutorTurn } from '@/features/chat/engine/aiClient';
import { glossPieces } from '@/features/chat/engine/glossary';
import { buildTurnRequest, chatReducer, initChat } from '@/features/chat/engine/orchestrator';
import { callScenario } from '@/features/chat/scenarios';
import { useVoiceInput } from '@/features/chat/useVoiceInput';
import { callSummary } from './summary';

const CALL_BG = '#1B1F2A';
const ON_CALL = '#FFFFFF';
const ON_CALL_SOFT = '#A3A9BA';

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/** Llamada con Bao: conversación solo por voz, con subtítulos opcionales y resumen al colgar. */
export function CallScreen({ onAgain }: { onAgain: () => void }) {
  const { c, type, spacing } = useTheme();
  const router = useRouter();
  const completed = useProgressStore((s) => s.completedNodeIds);
  const awardXp = useProgressStore((s) => s.awardXp);
  const snapshot = useLearnerStore((s) => s.snapshot);
  const scenario = useMemo(() => callScenario(completed), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [state, dispatch] = useReducer(chatReducer, scenario, initChat);
  const voice = useVoiceInput();
  const [speaking, setSpeaking] = useState(false);
  const [subtitles, setSubtitles] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [lost, setLost] = useState(false);
  const [ended, setEnded] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const spokenId = useRef<string | null>(null);
  const rewarded = useRef(false);

  const send = useCallback(
    async (input: Parameters<typeof buildTurnRequest>[2], display?: string) => {
      if (input && display) {
        dispatch({ type: 'submit', input, display });
        trackQuest('chat_turn');
      } else dispatch({ type: 'start' });
      try {
        const turn = await requestTutorTurn(buildTurnRequest(state, snapshot(), input), await getAuthToken());
        dispatch({ type: 'tutor_reply', turn });
      } catch {
        setLost(true);
      }
    },
    [state, snapshot],
  );

  // Descolgar: Bao saluda.
  useEffect(() => {
    if (hasServer && state.phase === 'idle') void send(null);
  }, [state.phase, send]);

  // Contador de la llamada.
  useEffect(() => {
    if (ended || lost) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [ended, lost]);

  // Bao habla cada respuesta nueva (siempre en voz alta: es una llamada).
  const lastTutor = [...state.messages].reverse().find((m) => m.from === 'tutor');
  useEffect(() => {
    if (!lastTutor || lastTutor.from !== 'tutor' || spokenId.current === lastTutor.id || ended) return;
    spokenId.current = lastTutor.id;
    setSpeaking(true);
    speakChinese(lastTutor.turn.reply.hanzi, { force: true, onDone: () => setSpeaking(false) });
    // Por si el audio no avisa al terminar: el turno pasa al usuario igualmente.
    const t = setTimeout(() => setSpeaking(false), 12_000);
    return () => clearTimeout(t);
  }, [lastTutor, ended]);

  useEffect(
    () => () => {
      stopSpeaking();
      voice.cancel();
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const hangUp = () => {
    stopSpeaking();
    voice.cancel();
    setEnded(true);
    void feedback.tap();
  };

  // Bao se despide y la llamada termina sola tras su última frase.
  useEffect(() => {
    if (state.phase !== 'finished' || speaking) return;
    const t = setTimeout(() => setEnded(true), 1500);
    return () => clearTimeout(t);
  }, [state.phase, speaking]);

  useEffect(() => {
    if (ended && !rewarded.current && state.xpEarned > 0) {
      rewarded.current = true;
      awardXp(state.xpEarned);
      void feedback.levelUp();
    }
  }, [ended, state.xpEarned, awardXp]);

  const onMic = async () => {
    setNotice(null);
    if (voice.recording) {
      dispatch({ type: 'record_stop' });
      const target = state.task?.type === 'repeat_aloud' ? state.task.hanzi : '';
      const r = await voice.stop(target);
      if (!r.ok) {
        dispatch({ type: 'voice_failed', message: r.message });
        setNotice(r.message);
        return;
      }
      const ok = r.result.syllables.filter((s) => s.match !== 'miss' && s.gop >= 0.5).length;
      const score = r.result.syllables.length ? ok / r.result.syllables.length : 1;
      void send({ kind: 'voice', transcript: r.result.transcript, pronunciation_score: score }, r.result.transcript);
      return;
    }
    if (state.phase !== 'await_user') return;
    stopSpeaking();
    setSpeaking(false);
    const err = await voice.start();
    if (err) {
      setNotice(err);
      return;
    }
    dispatch({ type: 'record_start' });
  };

  if (!hasServer) {
    return (
      <SafeAreaView style={[styles.flex, styles.center, { backgroundColor: CALL_BG, padding: spacing.lg, gap: spacing.md }]}>
        <Bao mood="encourage" size={120} />
        <Text style={[type.title, { color: ON_CALL, textAlign: 'center' }]}>La llamada necesita conexión con el tutor IA</Text>
        <Button3D label="Volver" variant="ghost" onPress={() => exitTo(router)} />
      </SafeAreaView>
    );
  }

  if (ended) return <CallSummary state={state} seconds={seconds} onAgain={onAgain} onDone={() => exitTo(router)} />;

  const turn = lastTutor?.from === 'tutor' ? lastTutor.turn : null;
  const status = lost
    ? '📵 Se ha cortado la llamada'
    : voice.recording
      ? '🔴 Te escucho… toca ⏹ al terminar'
      : state.phase === 'assessing'
        ? 'Bao está escuchando…'
        : state.phase === 'tutor_typing' || state.phase === 'idle'
          ? 'Bao está pensando…'
          : speaking
            ? 'Bao está hablando…'
            : '🎙️ Tu turno: toca el micrófono';

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: CALL_BG }]}>
      <View style={[styles.flex, { padding: spacing.lg, gap: spacing.md }]}>
        <Text style={[type.caption, { color: ON_CALL_SOFT, textAlign: 'center' }]}>
          📞 {scenario.title} · <Text style={{ color: ON_CALL }}>{mmss(seconds)}</Text>
        </Text>
        <View style={[styles.center, { marginTop: spacing.md }]}>
          <View style={[styles.ring, { borderColor: speaking ? c.info : 'rgba(43,166,240,0.25)' }]}>
            <Bao mood={voice.recording ? 'idle' : speaking ? 'talking' : state.phase === 'tutor_typing' || state.phase === 'assessing' ? 'thinking' : state.mood} size={130} />
          </View>
        </View>
        <Text style={[type.title, { color: ON_CALL, textAlign: 'center' }]} accessibilityLiveRegion="polite">
          {status}
        </Text>

        {subtitles && turn && !lost ? (
          <View style={[styles.sub, { gap: 2, padding: spacing.sm }]}>
            <Text style={[type.hanzi, { color: ON_CALL, fontSize: 24, lineHeight: 32, textAlign: 'center' }]}>{turn.reply.hanzi}</Text>
            <Text style={[type.caption, { color: ON_CALL_SOFT, textAlign: 'center' }]}>{turn.reply.pinyin}</Text>
            <Text style={[type.caption, { color: ON_CALL_SOFT, textAlign: 'center' }]}>{turn.reply.translation}</Text>
            {state.task?.type === 'repeat_aloud' ? (
              <Text style={[type.caption, { color: c.xp, textAlign: 'center', marginTop: 4 }]}>
                Repite: {state.task.hanzi} · {state.task.pinyin}
              </Text>
            ) : null}
          </View>
        ) : null}
        {notice ? <Text style={[type.caption, { color: c.xp, textAlign: 'center' }]}>{notice}</Text> : null}
        {lost ? (
          <View style={{ gap: spacing.sm }}>
            <Text style={[type.body, { color: ON_CALL_SOFT, textAlign: 'center' }]}>Sin conexión con Bao o se acabó la cuota del día. Prueba de nuevo en un rato.</Text>
            <Button3D
              label="Volver a llamar"
              onPress={() => {
                setLost(false);
                void send(null);
              }}
            />
          </View>
        ) : null}

        <View style={styles.flex} />
        <View style={[styles.buttons, { gap: spacing.md }]}>
          <CallButton icon="💬" label={subtitles ? 'Ocultar texto' : 'Subtítulos'} onPress={() => setSubtitles((v) => !v)} />
          <CallButton
            icon={voice.recording ? '⏹' : '🎙️'}
            label={voice.recording ? 'Terminar' : 'Tu turno'}
            big
            color={voice.recording ? c.danger : c.info}
            disabled={!voice.recording && state.phase !== 'await_user'}
            onPress={() => void onMic()}
          />
          <CallButton icon="📵" label="Colgar" color={c.danger} onPress={hangUp} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function CallButton({ icon, label, onPress, big, color, disabled }: { icon: string; label: string; onPress: () => void; big?: boolean; color?: string; disabled?: boolean }) {
  const { type } = useTheme();
  const size = big ? 76 : 58;
  return (
    <PressableScale onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label} containerStyle={{ alignItems: 'center' }}>
      <View style={{ alignItems: 'center', gap: 6, opacity: disabled ? 0.45 : 1 }}>
        <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color ?? 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: big ? 32 : 24 }}>{icon}</Text>
        </View>
        <Text style={[type.caption, { color: ON_CALL }]}>{label}</Text>
      </View>
    </PressableScale>
  );
}

function CallSummary({ state, seconds, onAgain, onDone }: { state: ReturnType<typeof initChat>; seconds: number; onAgain: () => void; onDone: () => void }) {
  const { c, type, spacing } = useTheme();
  const s = useMemo(() => callSummary(state.messages, VOCAB, glossPieces), [state.messages]);
  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl }}>
        <View style={[styles.center, { gap: spacing.xs }]}>
          <Bao mood="celebrate" size={96} />
          <Text style={[type.display, { color: c.textPrimary }]}>Resumen de la llamada</Text>
        </View>
        <Card>
          <Text style={[type.body, { color: c.textPrimary }]}>⏱️ {mmss(seconds)} · {s.turns} turnos</Text>
          <Text style={[type.body, { color: c.textPrimary }]}>🎯 {state.scenario.title.replace(/^Llamada · /, '')}</Text>
          <Text style={[type.body, { color: c.xpText }]}>⭐ +{state.xpEarned} XP</Text>
        </Card>
        {s.good.length ? (
          <Card>
            <Text style={[type.title, { color: c.success }]}>Lo que dijiste bien</Text>
            {s.good.map((g) => (
              <Text key={g} style={[type.hanzi, { color: c.textPrimary, fontSize: 20, lineHeight: 28 }]}>
                {g}
              </Text>
            ))}
          </Card>
        ) : null}
        {s.fixes.length ? (
          <Card>
            <Text style={[type.title, { color: c.primary }]}>Para mejorar</Text>
            {s.fixes.map((f, i) => (
              <View key={i} style={{ marginTop: spacing.xs }}>
                <Text style={[type.hanzi, { color: c.danger, fontSize: 18, lineHeight: 26, textDecorationLine: 'line-through' }]}>{f.original}</Text>
                <Text style={[type.hanzi, { color: c.success, fontSize: 18, lineHeight: 26 }]}>{f.corrected}</Text>
                <Text style={[type.caption, { color: c.textSecondary }]}>{f.explanation}</Text>
              </View>
            ))}
          </Card>
        ) : null}
        {s.words.length ? (
          <Card>
            <Text style={[type.title, { color: c.textPrimary }]}>Palabras de la llamada</Text>
            {s.words.map((w) => (
              <View key={w.id} style={[styles.row, { gap: spacing.sm, marginTop: spacing.xs }]}>
                <Text style={[type.hanzi, { color: c.textPrimary, fontSize: 20, lineHeight: 28 }]}>{w.hanzi}</Text>
                <View style={styles.flex}>
                  <Text style={[type.caption, { color: c.textSecondary }]}>{w.pinyin}</Text>
                  <Text style={[type.body, { color: c.textPrimary }]}>{w.meaning}</Text>
                </View>
                <StarButton id={w.id} />
              </View>
            ))}
          </Card>
        ) : null}
        <Button3D label="Terminar" variant="success" onPress={onDone} />
        <Button3D label="Llamar otra vez" variant="ghost" onPress={onAgain} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center' },
  ring: { width: 170, height: 170, borderRadius: 85, borderWidth: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(43,166,240,0.12)' },
  sub: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16 },
  buttons: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end' },
});
