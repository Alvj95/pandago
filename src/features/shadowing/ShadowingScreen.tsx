import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioPlayer, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HanziTones, PinyinText, ToneMelody } from '@/components/learn';
import { Bao } from '@/components/mascot';
import { Button3D, PressableScale, ProgressBar } from '@/components/ui';
import { SENTENCES, UNITS } from '@/data/hsk/course';
import { feedback } from '@/lib/haptics';
import { exitTo } from '@/lib/navigation';
import { speakChinese } from '@/lib/speech';
import { useProgressStore } from '@/store/useProgressStore';
import { useTheme } from '@/theme';

const PER_ROUND = 5;
const RECORDING = { ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true };

type Rating = 1 | 2 | 3;

/**
 * Sombra (shadowing): escuchar a Bao, grabarse imitándole y comparar
 * escuchando las dos voces seguidas. La melodía de tonos de la frase sirve de
 * guía y se ve el ritmo (volumen) de la propia grabación.
 */
export function ShadowingScreen() {
  const { c, type, spacing, radius } = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const awardXp = useProgressStore((s) => s.awardXp);
  const completed = useProgressStore((s) => s.completedNodeIds);

  const recorder = useAudioRecorder(RECORDING);
  const recState = useAudioRecorderState(recorder, 80);
  const player = useAudioPlayer(null);

  const defaultUnit = UNITS.find((u) => u.nodes.some((n) => !completed.includes(n.id)))?.id ?? 'u1';
  const [unitId, setUnitId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [uri, setUri] = useState<string | null>(null);
  const [levels, setLevels] = useState<number[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [denied, setDenied] = useState(false);
  const rewarded = useRef(false);

  const sentences = useMemo(() => (unitId ? SENTENCES.filter((s) => s.id.startsWith(`${unitId}-`) && s.tokens.length >= 2).slice(0, PER_ROUND) : []), [unitId]);
  const s = sentences[index];
  const hanzi = s?.tokens.join('') ?? '';
  const done = unitId !== null && index >= sentences.length && sentences.length > 0;

  // Guarda el volumen mientras se graba para dibujar el ritmo.
  useEffect(() => {
    if (recState.isRecording && recState.metering !== undefined) setLevels((l) => [...l, recState.metering ?? -60].slice(-60));
  }, [recState.isRecording, recState.metering, recState.durationMillis]);

  useEffect(() => {
    if (s) speakChinese(hanzi, { force: true, rate: 0.8 });
  }, [s, hanzi]);

  useEffect(() => {
    if (!done || rewarded.current) return;
    rewarded.current = true;
    awardXp(PER_ROUND * 2);
    void feedback.levelUp();
  }, [done, awardXp]);

  const startRec = async () => {
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) return setDenied(true);
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    setLevels([]);
    setUri(null);
    recorder.record();
  };
  const stopRec = async () => {
    await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    setUri(recorder.uri);
  };
  const playMine = () => {
    if (!uri) return;
    player.replace({ uri });
    player.play();
  };
  const compare = () => speakChinese(hanzi, { force: true, rate: 0.8, onDone: () => setTimeout(playMine, 300) });

  const next = (r: Rating) => {
    setRatings((x) => [...x, r]);
    setUri(null);
    setLevels([]);
    setIndex((n) => n + 1);
  };

  // ---------- Elegir unidad
  if (!unitId) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: c.background }]}>
        <Header onClose={() => exitTo(router)} />
        <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
          <View style={[styles.row, { gap: spacing.sm }]}>
            <Bao mood="talking" size={64} />
            <Text style={[type.body, styles.flex, { color: c.textSecondary }]}>
              Hacer «sombra» es repetir justo después de un nativo, imitando su melodía y su ritmo. Escucha, grábate y compara: es el truco más rápido para sonar natural.
            </Text>
          </View>
          <Text style={[type.caption, { color: c.textSecondary }]}>ELIGE LAS FRASES DE UNA UNIDAD</Text>
          <View style={[styles.wrap, { gap: spacing.xs }]}>
            {UNITS.map((u) => (
              <PressableScale
                key={u.id}
                onPress={() => {
                  setUnitId(u.id);
                  setIndex(0);
                  setRatings([]);
                  rewarded.current = false;
                }}
                accessibilityRole="button"
                containerStyle={styles.unitWrap}
                style={[styles.unit, { borderRadius: radius.md, borderColor: u.id === defaultUnit ? c.primary : c.border, backgroundColor: c.surfaceRaised }]}
              >
                <Text style={[type.caption, { color: c.textSecondary }]}>
                  HSK {u.level} · {u.index}
                </Text>
                <Text style={[type.body, { color: c.textPrimary }]}>{u.title}</Text>
              </PressableScale>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---------- Final
  if (done) {
    const avg = ratings.reduce((a, b) => a + b, 0) / Math.max(1, ratings.length);
    return (
      <SafeAreaView style={[styles.flex, styles.center, { backgroundColor: c.background, padding: spacing.lg, gap: spacing.md }]}>
        <Bao mood="celebrate" size={120} />
        <Text style={[type.display, { color: c.textPrimary }]}>¡Bien hecho!</Text>
        <Text style={[type.body, { color: c.textSecondary, textAlign: 'center' }]}>
          {avg >= 2.5 ? 'Te has puesto buena nota: ¡suenas cada vez más natural!' : 'Repite estas frases otro día: la sombra funciona con constancia.'} +{PER_ROUND * 2} XP
        </Text>
        <View style={{ alignSelf: 'stretch', gap: spacing.sm }}>
          <Button3D label="Otra unidad" variant="success" onPress={() => setUnitId(null)} />
          <Button3D label="Salir" variant="ghost" onPress={() => exitTo(router)} />
        </View>
      </SafeAreaView>
    );
  }

  if (!s) return null;
  const recording = recState.isRecording;

  // ---------- Frase
  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: c.background }]}>
      <View style={[styles.row, { padding: spacing.sm, gap: spacing.sm }]}>
        <PressableScale onPress={() => setUnitId(null)} accessibilityRole="button" accessibilityLabel="Salir" hitSlop={12}>
          <Text style={[type.title, { color: c.textSecondary, paddingHorizontal: spacing.xs }]}>✕</Text>
        </PressableScale>
        <View style={styles.flex}>
          <ProgressBar progress={index / sentences.length} />
        </View>
        <Text style={[type.title, { color: c.primary }]}>
          {index + 1}/{sentences.length}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
        <View style={[styles.card, { backgroundColor: c.surfaceRaised, borderColor: c.border, borderRadius: radius.md, padding: spacing.md, gap: 4 }]}>
          <HanziTones hanzi={hanzi} pinyin={s.pinyin} style={[type.hanzi, { fontSize: 30, lineHeight: 42, textAlign: 'center' }]} />
          <PinyinText pinyin={s.pinyin} style={[type.title, { textAlign: 'center' }]} />
          <Text style={[type.body, { color: c.textSecondary, textAlign: 'center' }]}>{s.meaning}</Text>
        </View>

        <View style={{ gap: 4 }}>
          <Text style={[type.caption, { color: c.textSecondary }]}>🎵 MELODÍA DE LA FRASE (TONOS)</Text>
          <ToneMelody pinyin={s.pinyin} width={width - spacing.md * 2} labelColor={c.textSecondary} />
        </View>

        <View style={[styles.row, { gap: spacing.sm }]}>
          <View style={styles.flex}>
            <Button3D label="🔊 Escuchar" onPress={() => speakChinese(hanzi, { force: true, rate: 0.8 })} />
          </View>
          <View style={styles.flex}>
            <Button3D label="🐢 Lento" variant="ghost" onPress={() => speakChinese(hanzi, { force: true, rate: 0.5 })} />
          </View>
        </View>

        <View style={{ gap: 4 }}>
          <Text style={[type.caption, { color: c.textSecondary }]}>🎙️ TU VOZ (RITMO Y VOLUMEN)</Text>
          <View style={[styles.wave, { backgroundColor: c.surfaceSunken, borderRadius: radius.sm }]}>
            {levels.length === 0 ? (
              <Text style={[type.caption, { color: c.textSecondary }]}>{recording ? 'Escuchando…' : 'Graba tu voz para verla aquí'}</Text>
            ) : (
              levels.map((db, i) => <View key={i} style={[styles.bar, { height: `${Math.max(6, Math.min(100, (db + 60) * 1.7))}%`, backgroundColor: recording ? c.danger : c.primary }]} />)
            )}
          </View>
        </View>
        {denied && <Text style={[type.caption, { color: c.danger }]}>Necesito permiso del micrófono para grabarte. Actívalo en los ajustes del móvil.</Text>}

        <Button3D label={recording ? '⏹ Parar' : uri ? '🎙️ Grabar otra vez' : '🎙️ Grabar'} variant={recording ? 'danger' : 'primary'} onPress={() => void (recording ? stopRec() : startRec())} />
        {uri && !recording && (
          <>
            <View style={[styles.row, { gap: spacing.sm }]}>
              <View style={styles.flex}>
                <Button3D label="▶️ Mi voz" variant="ghost" onPress={playMine} />
              </View>
              <View style={styles.flex}>
                <Button3D label="🔁 Bao y yo" variant="ghost" onPress={compare} />
              </View>
            </View>
            <Text style={[type.body, { color: c.textPrimary, textAlign: 'center' }]}>¿Cómo te ha salido?</Text>
            <View style={[styles.row, { gap: spacing.sm }]}>
              {([
                [1, '😕 Regular'],
                [2, '🙂 Bien'],
                [3, '😃 ¡Igual!'],
              ] as const).map(([r, label]) => (
                <View key={r} style={styles.flex}>
                  <Button3D label={label} variant={r === 3 ? 'success' : 'primary'} onPress={() => next(r)} />
                </View>
              ))}
            </View>
          </>
        )}
        {!uri && !recording && (
          <PressableScale onPress={() => next(1)} accessibilityRole="button">
            <Text style={[type.caption, { color: c.info, textAlign: 'center' }]}>Saltar esta frase</Text>
          </PressableScale>
        )}
      </ScrollView>
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
      <Text style={[type.title, { color: c.textPrimary }]}>🗣️ Sombra: repite como un nativo</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  unitWrap: { width: '48.5%' },
  unit: { borderWidth: 2, borderBottomWidth: 4, padding: 10 },
  card: { borderWidth: 2, borderBottomWidth: 4, alignItems: 'center' },
  wave: { height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, paddingHorizontal: 6 },
  bar: { flex: 1, maxWidth: 6, borderRadius: 2 },
});
