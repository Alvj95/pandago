import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, PressableScale, Segmented } from '@/components/ui';
import { exitTo } from '@/lib/navigation';
import { speakChinese } from '@/lib/speech';
import { useProgressStore } from '@/store/useProgressStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTheme } from '@/theme';

/** Ajustes: tema, meta diaria, voz de Bao, micrófono y accesibilidad. */
export function SettingsScreen() {
  const router = useRouter();
  const { c, type, spacing, preference, setPreference } = useTheme();
  const p = useProgressStore();
  const haptics = useSettingsStore((s) => s.haptics);
  const setHaptics = useSettingsStore((s) => s.setHaptics);
  const voice = useSettingsStore((s) => s.voice);
  const reduceMotion = useSettingsStore((s) => s.reduceMotion);
  const setReduceMotion = useSettingsStore((s) => s.setReduceMotion);
  const setVoice = useSettingsStore((s) => s.setVoice);
  const voiceStyle = useSettingsStore((s) => s.voiceStyle);
  const setVoiceStyle = useSettingsStore((s) => s.setVoiceStyle);
  const slowVoice = useSettingsStore((s) => s.slowVoice);
  const setSlowVoice = useSettingsStore((s) => s.setSlowVoice);
  const baoPopups = useSettingsStore((s) => s.baoPopups);
  const setBaoPopups = useSettingsStore((s) => s.setBaoPopups);

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: c.background }]}>
      <View style={[styles.row, { padding: spacing.md, gap: spacing.sm }]}>
        <PressableScale onPress={() => exitTo(router)} accessibilityRole="button" accessibilityLabel="Volver" hitSlop={10}>
          <Text style={[type.title, { color: c.textSecondary }]}>✕</Text>
        </PressableScale>
        <Text style={[type.title, { color: c.textPrimary }]}>⚙️ Ajustes</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingTop: 0, gap: spacing.md, paddingBottom: spacing.xxl }}>
        <Card index={7}>
          <View style={{ gap: spacing.md }}>
            <View style={{ gap: spacing.xs }}>
              <Text style={[type.caption, { color: c.textSecondary }]}>TEMA</Text>
              <Segmented
                accessibilityLabel="Tema"
                value={preference}
                onChange={setPreference}
                options={[
                  { value: 'system', label: '⚙️ Sistema' },
                  { value: 'light', label: '☀️ Claro' },
                  { value: 'dark', label: '🌙 Oscuro' },
                ]}
              />
            </View>
            <View style={{ gap: spacing.xs }}>
              <Text style={[type.caption, { color: c.textSecondary }]}>META DIARIA</Text>
              <Segmented
                accessibilityLabel="Meta diaria"
                value={p.dailyGoalXp}
                onChange={p.setDailyGoal}
                options={[
                  { value: 10, label: 'Relax' },
                  { value: 20, label: 'Normal' },
                  { value: 30, label: 'Serio' },
                  { value: 50, label: 'Intenso' },
                ]}
              />
            </View>
            <View style={styles.between}>
              <Text style={[type.body, { color: c.textPrimary }]}>🔊 Bao habla en voz alta</Text>
              <Switch value={voice} onValueChange={setVoice} trackColor={{ true: c.success, false: c.locked }} accessibilityLabel="Bao habla en voz alta" />
            </View>
            <View style={{ gap: spacing.xs }}>
              <Text style={[type.caption, { color: c.textSecondary }]}>VOZ DE BAO</Text>
              <Segmented
                accessibilityLabel="Voz de Bao"
                value={voiceStyle}
                onChange={(v) => {
                  setVoiceStyle(v);
                  speakChinese('你好，我是宝宝！', { force: true });
                }}
                options={[
                  { value: 'natural', label: '🐼 Natural' },
                  { value: 'device', label: '📱 Del móvil' },
                ]}
              />
              <Text style={[type.caption, { color: c.textSecondary }]}>
                {voiceStyle === 'natural' ? 'Suena como una persona. Necesita internet: sin conexión, Bao usa la voz del móvil.' : 'Funciona sin internet. Necesita la voz «Chino (China)» instalada en el móvil.'}
              </Text>
            </View>
            <View style={styles.between}>
              <Text style={[type.body, { color: c.textPrimary }]}>🐢 Bao habla más despacio</Text>
              <Switch value={slowVoice} onValueChange={setSlowVoice} trackColor={{ true: c.success, false: c.locked }} accessibilityLabel="Bao habla más despacio" />
            </View>
            <View style={styles.between}>
              <Text style={[type.body, { color: c.textPrimary }]}>🐼 Bao aparece mientras estudio</Text>
              <Switch value={baoPopups} onValueChange={setBaoPopups} trackColor={{ true: c.success, false: c.locked }} accessibilityLabel="Bao aparece mientras estudio" />
            </View>
            <View style={styles.between}>
              <Text style={[type.body, { color: c.textPrimary }]}>🧘 Reducir movimiento</Text>
              <Switch value={reduceMotion} onValueChange={setReduceMotion} trackColor={{ true: c.success, false: c.locked }} accessibilityLabel="Reducir movimiento" />
            </View>
            <View style={styles.between}>
              <Text style={[type.body, { color: c.textPrimary }]}>📳 Vibración</Text>
              <Switch value={haptics} onValueChange={setHaptics} trackColor={{ true: c.success, false: c.locked }} accessibilityLabel="Vibración" />
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
