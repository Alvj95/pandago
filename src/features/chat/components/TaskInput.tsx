import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { Button3D, PressableScale } from '@/components/ui';
import { useTheme } from '@/theme';
import type { NextTask } from '../engine/contract';

interface Props {
  task: NextTask | null;
  disabled: boolean;
  recording: boolean;
  onText: (text: string) => void;
  onGap: (choice: string) => void;
  /** Un toque empieza a grabar; otro toque termina. */
  onMic: () => void;
}

/** La zona de entrada cambia según la tarea que pidió la IA: pregunta abierta, hueco o repetir en voz alta. */
export function TaskInput({ task, disabled, recording, onText, onGap, onMic }: Props) {
  const { c, radius, type, spacing } = useTheme();
  const [text, setText] = useState('');
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.set(recording ? withRepeat(withTiming(1.25, { duration: 500 }), -1, true) : withTiming(1));
  }, [recording, pulse]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }));

  const mic = (
    <PressableScale
      onPress={onMic}
      disabled={disabled && !recording}
      accessibilityRole="button"
      accessibilityLabel={recording ? 'Terminar de grabar' : 'Grabar tu voz'}
    >
      <Animated.View style={[styles.mic, { backgroundColor: recording ? c.danger : c.info }, pulseStyle]}>
        <Text style={styles.micIcon}>{recording ? '⏹' : '🎙️'}</Text>
      </Animated.View>
    </PressableScale>
  );

  if (task?.type === 'fill_gap') {
    return (
      <View style={{ gap: spacing.sm }}>
        <Text style={[type.hanzi, { color: c.textPrimary, fontSize: 22, textAlign: 'center' }]}>{task.template_hanzi}</Text>
        <View style={[styles.row, { gap: spacing.xs, justifyContent: 'center' }]}>
          {task.options.map((o) => (
            <Button3D key={o} label={o} variant="ghost" disabled={disabled} onPress={() => onGap(o)} />
          ))}
        </View>
      </View>
    );
  }

  if (task?.type === 'repeat_aloud') {
    return (
      <View style={[styles.center, { gap: spacing.xs }]}>
        <Text style={[type.hanzi, { color: c.primary }]}>{task.hanzi}</Text>
        <Text style={[type.caption, { color: c.textSecondary }]}>{task.pinyin}</Text>
        {mic}
        <Text style={[type.caption, { color: recording ? c.danger : c.textSecondary }]}>
          {recording ? '🔴 Grabando… toca ⏹ al terminar' : 'Toca 🎙️ y repite la frase'}
        </Text>
      </View>
    );
  }

  if (recording) {
    return (
      <View style={[styles.row, { gap: spacing.sm, justifyContent: 'center' }]}>
        <Text style={[type.body, { color: c.danger }]}>🔴 Grabando… habla en chino y toca ⏹</Text>
        {mic}
      </View>
    );
  }

  return (
    <View style={[styles.row, { gap: spacing.xs }]}>
      <TextInput
        value={text}
        onChangeText={setText}
        editable={!disabled}
        placeholder="Escribe en chino (o pinyin)…"
        placeholderTextColor={c.textSecondary}
        style={[type.body, styles.input, { color: c.textPrimary, backgroundColor: c.surfaceSunken, borderRadius: radius.pill }]}
        onSubmitEditing={() => {
          if (text.trim()) onText(text.trim());
          setText('');
        }}
        returnKeyType="send"
      />
      {mic}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  center: { alignItems: 'center' },
  input: { flex: 1, paddingHorizontal: 16, height: 48 },
  mic: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  micIcon: { fontSize: 26 },
});
