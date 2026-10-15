import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bao } from '@/components/mascot';
import { useRouter } from 'expo-router';
import { Button3D, Card, ProgressBar, Segmented } from '@/components/ui';
import { DIMENSIONS, levelDifficulty, pCorrect, topWeaknesses, type Dimension } from '@/features/learning/adaptive/learnerModel';
import { useLearnerStore } from '@/store/useLearnerStore';
import { useProgressStore } from '@/store/useProgressStore';
import { speakChinese } from '@/lib/speech';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTheme } from '@/theme';
import { AchievementsCard } from '@/features/quests/AchievementsCard';

const DIM_LABEL: Record<Dimension, { label: string; icon: string }> = {
  vocab: { label: 'Vocabulario', icon: '📚' },
  grammar: { label: 'Gramática', icon: '🧩' },
  listening: { label: 'Comprensión oral', icon: '👂' },
  tones: { label: 'Tonos', icon: '🎵' },
  writing: { label: 'Escritura', icon: '✍️' },
  speaking: { label: 'Conversación', icon: '💬' },
};

/** "grammar:jiao-name" → "Gramática · jiao name" */
const humanizeTag = (tag: string) => {
  const [dim, pattern] = tag.split(':');
  return `${DIM_LABEL[dim as Dimension]?.label ?? dim} · ${(pattern ?? '').replace(/-/g, ' ')}`;
};

export function ProfileScreen() {
  const router = useRouter();
  const { c, type, spacing, preference, setPreference } = useTheme();
  const p = useProgressStore();
  const model = useLearnerStore((s) => s.model);
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
  const weaknesses = topWeaknesses(model);

  const stats = [
    { icon: '🔥', value: p.streakDays, label: 'Días de racha', color: c.streak },
    { icon: '⚡', value: p.xpTotal, label: 'XP total', color: c.xpText },
    { icon: '⭐', value: p.completedNodeIds.length, label: 'Lecciones', color: c.success },
    { icon: '🧊', value: p.streakFreezes, label: 'Protectores', color: c.info },
  ];

  return (
    <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl }}>
        <View style={[styles.center, { gap: spacing.xs }]}>
          <Bao mood="happy" size={96} />
          <Text style={[type.display, { color: c.textPrimary }]}>Estudiante</Text>
          <Text style={[type.caption, { color: c.textSecondary }]}>
            HSK {p.hskLevel} · Liga {p.league}
          </Text>
        </View>

        <View style={[styles.grid, { gap: spacing.sm }]}>
          <View style={styles.cell}>
            <Button3D label="👕 Vestir a Bao" variant="ghost" onPress={() => router.push('/wardrobe')} />
          </View>
          <View style={styles.cell}>
            <Button3D label="🛍️ Tienda" onPress={() => router.push('/shop')} />
          </View>
        </View>

        <View style={[styles.grid, { gap: spacing.sm }]}>
          {stats.map((s, i) => (
            <View key={s.label} style={styles.cell}>
              <Card index={i}>
                <Text style={[type.title, { color: s.color }]}>
                  {s.icon} {s.value}
                </Text>
                <Text style={[type.caption, { color: c.textSecondary }]}>{s.label}</Text>
              </Card>
            </View>
          ))}
        </View>

        <Card index={4}>
          <Text style={[type.title, { color: c.textPrimary, marginBottom: spacing.xs }]}>Tus habilidades en HSK {model.level}</Text>
          <Text style={[type.caption, { color: c.textSecondary, marginBottom: spacing.sm }]}>
            Probabilidad estimada de acertar un ejercicio típico del nivel
          </Text>
          <View style={{ gap: spacing.sm }}>
            {DIMENSIONS.map((d) => {
              const value = pCorrect(model.theta[d], levelDifficulty(model.level));
              return (
                <View key={d} style={{ gap: 4 }}>
                  <View style={styles.between}>
                    <Text style={[type.body, { color: c.textPrimary }]}>
                      {DIM_LABEL[d].icon} {DIM_LABEL[d].label}
                    </Text>
                    <Text style={[type.caption, { color: c.textSecondary }]}>{Math.round(value * 100)}%</Text>
                  </View>
                  <ProgressBar progress={value} color={value >= 0.8 ? c.success : value >= 0.5 ? c.xp : c.danger} height={10} />
                </View>
              );
            })}
          </View>
        </Card>

        {weaknesses.length > 0 && (
          <Card index={5}>
            <Text style={[type.title, { color: c.textPrimary, marginBottom: spacing.xs }]}>Bao te ayudará con…</Text>
            {weaknesses.map((w) => (
              <Text key={w} style={[type.body, { color: c.textSecondary }]}>
                • {humanizeTag(w)}
              </Text>
            ))}
          </Card>
        )}

        <AchievementsCard index={6} />

        <Card index={7}>
          <Text style={[type.title, { color: c.textPrimary, marginBottom: spacing.sm }]}>Ajustes</Text>
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
            <Button3D label="🎙️ Probar micrófono" variant="ghost" onPress={() => router.push('/mic-test')} />
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
  center: { alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '48%', flexGrow: 1 },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
