import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bao } from '@/components/mascot';
import { Button3D, Card, PressableScale } from '@/components/ui';
import { API_URL, hasServer } from '@/lib/api';
import { exitTo } from '@/lib/navigation';
import { useTheme } from '@/theme';
import { SILENT_DB, useVoiceInput } from '@/features/chat/useVoiceInput';

type Step = { ok: boolean | null; label: string; detail?: string };

/** Prueba del micrófono paso a paso: permiso, volumen, conexión y reconocimiento. Sirve para saber qué falla. */
export function MicTestScreen() {
  const { c, type, spacing, radius } = useTheme();
  const router = useRouter();
  const mic = useVoiceInput();
  const [steps, setSteps] = useState<Step[]>([]);
  const [busy, setBusy] = useState(false);
  const started = useRef(0);

  const level = typeof mic.metering === 'number' ? Math.max(0, Math.min(1, (mic.metering + 60) / 60)) : 0;

  const run = async () => {
    if (!mic.recording) {
      setSteps([]);
      const err = await mic.start();
      if (err) return setSteps([{ ok: false, label: 'Micrófono', detail: err }]);
      started.current = Date.now();
      return;
    }
    setBusy(true);
    const seconds = (Date.now() - started.current) / 1000;
    const out: Step[] = [{ ok: true, label: 'Permiso del micrófono', detail: 'concedido' }];
    // ¿Llega el móvil al servidor?
    const t0 = Date.now();
    const health = await fetch(`${API_URL}/health`)
      .then((r) => (r.ok ? `OK en ${Date.now() - t0} ms` : `HTTP ${r.status}`))
      .catch((e: unknown) => `sin conexión (${String(e).slice(0, 60)})`);
    const r = await mic.stop('你好');
    out.push({ ok: seconds >= 0.8, label: 'Duración de la grabación', detail: `${seconds.toFixed(1)} s` });
    out.push({
      ok: r.level === undefined || r.level <= -160 ? null : r.level >= SILENT_DB,
      label: 'Volumen máximo',
      detail: r.level === undefined || r.level <= -160 ? 'este móvil no informa del volumen' : `${Math.round(r.level)} dB (hace falta más de ${SILENT_DB} dB)`,
    });
    out.push({ ok: !!mic.recorder.uri, label: 'Archivo de audio', detail: mic.recorder.uri ? mic.recorder.uri.split('/').slice(-1)[0] : 'no se guardó' });
    out.push({ ok: health.startsWith('OK'), label: 'Conexión con el servidor', detail: `${hasServer ? API_URL.replace(/^https?:\/\//, '') : 'sin servidor configurado'} · ${health}` });
    out.push(r.ok ? { ok: true, label: 'Reconocimiento de voz', detail: `Bao oyó: «${r.result.transcript}»` } : { ok: false, label: 'Reconocimiento de voz', detail: r.message });
    setSteps(out);
    setBusy(false);
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: c.background }]}>
      <View style={[styles.row, { padding: spacing.md, gap: spacing.sm }]}>
        <PressableScale onPress={() => exitTo(router)} accessibilityRole="button" accessibilityLabel="Salir" hitSlop={10}>
          <Text style={[type.title, { color: c.textSecondary }]}>✕</Text>
        </PressableScale>
        <Text style={[type.title, { color: c.textPrimary }]}>🎙️ Probar micrófono</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingTop: 0, gap: spacing.md, paddingBottom: spacing.xxl }}>
        <View style={{ alignItems: 'center', gap: spacing.xs }}>
          <Bao mood={mic.recording ? 'talking' : 'idle'} size={90} />
          <Text style={[type.body, { color: c.textPrimary, textAlign: 'center' }]}>
            Toca 🎙️, di <Text style={[type.hanzi, { fontSize: 18 }]}>你好</Text> (nǐ hǎo) y toca ⏹. Te enseño paso a paso qué funciona.
          </Text>
        </View>
        <View style={[styles.meter, { backgroundColor: c.surfaceSunken, borderRadius: radius.pill }]} accessibilityLabel="Volumen del micrófono">
          <View style={{ width: `${Math.round(level * 100)}%`, height: '100%', borderRadius: radius.pill, backgroundColor: level > 0.17 ? c.success : c.danger }} />
        </View>
        <View style={{ alignItems: 'center' }}>
          <PressableScale onPress={() => void run()} disabled={busy} accessibilityRole="button" accessibilityLabel={mic.recording ? 'Terminar' : 'Grabar'}>
            <View style={[styles.mic, { backgroundColor: mic.recording ? c.danger : c.info, opacity: busy ? 0.5 : 1 }]}>
              <Text style={{ fontSize: 38 }}>{busy ? '⏳' : mic.recording ? '⏹' : '🎙️'}</Text>
            </View>
          </PressableScale>
        </View>
        {steps.length ? (
          <Card>
            {steps.map((s, i) => (
              <View key={i} style={{ marginTop: i ? spacing.xs : 0 }}>
                <Text style={[type.body, { color: c.textPrimary }]}>
                  {s.ok === null ? '➖' : s.ok ? '✅' : '❌'} {s.label}
                </Text>
                {s.detail ? <Text style={[type.caption, { color: c.textSecondary }]}>{s.detail}</Text> : null}
              </View>
            ))}
          </Card>
        ) : null}
        {steps.length ? <Text style={[type.caption, { color: c.textSecondary, textAlign: 'center' }]}>Si algo sale con ❌, haz una captura y mándamela.</Text> : null}
        <Button3D label="Volver" variant="ghost" onPress={() => exitTo(router)} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  meter: { height: 14, overflow: 'hidden' },
  mic: { width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center' },
});
