import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Bao } from '@/components/mascot';
import { PressableScale } from '@/components/ui';
import { VOCAB } from '@/data/hsk/course';
import { askBao } from '@/features/chat/engine/aiClient';
import { useProgressStore } from '@/store/useProgressStore';
import { useTheme } from '@/theme';
import { type AskContext, offlineAnswer } from '../askContext';

interface Props {
  visible: boolean;
  onClose: () => void;
  context?: AskContext;
  questions: string[];
  /** Aún no se ha respondido el ejercicio: Bao da pistas pero no la respuesta. */
  noSpoilers: boolean;
}

/** «Pregúntale a Bao»: dudas en mitad de una lección. No gasta vidas. */
export function AskBaoSheet({ visible, onClose, context, questions, noSpoilers }: Props) {
  const { c, type, spacing, radius } = useTheme();
  const level = useProgressStore((s) => s.hskLevel);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [qa, setQa] = useState<{ q: string; a: string }[]>([]);

  const ask = async (q: string) => {
    if (!q.trim() || busy) return;
    setText('');
    setBusy(true);
    let a: string;
    try {
      a = await askBao(q.trim(), context, level, noSpoilers);
    } catch {
      a = `📵 ${offlineAnswer(q, context, VOCAB)}`;
    }
    setQa((list) => [...list, { q: q.trim(), a }].slice(-4));
    setBusy(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Cerrar" />
      <KeyboardAvoidingView behavior="padding" style={styles.sheetWrap}>
        <View style={[styles.sheet, { backgroundColor: c.surface, borderColor: c.border, padding: spacing.md, gap: spacing.sm }]}>
          <View style={[styles.row, { gap: spacing.sm }]}>
            <Bao mood={busy ? 'thinking' : 'talking'} size={48} />
            <View style={styles.flex}>
              <Text style={[type.title, { color: c.textPrimary }]}>Pregúntale a Bao</Text>
              {context ? (
                <Text style={[type.caption, { color: c.textSecondary }]} numberOfLines={1}>
                  Sobre: {context.hanzi}
                </Text>
              ) : null}
            </View>
            <PressableScale onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar" hitSlop={10}>
              <Text style={[type.title, { color: c.textSecondary }]}>✕</Text>
            </PressableScale>
          </View>
          <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ gap: spacing.sm }}>
            {qa.map((x, i) => (
              <View key={i} style={{ gap: 4 }}>
                <Text style={[type.caption, { color: c.info, alignSelf: 'flex-end' }]}>{x.q}</Text>
                <View style={[styles.bubble, { backgroundColor: c.surfaceSunken, borderRadius: radius.md, padding: spacing.sm }]}>
                  <Text style={[type.body, { color: c.textPrimary }]}>{x.a}</Text>
                </View>
              </View>
            ))}
            {busy ? <Text style={[type.caption, { color: c.textSecondary }]}>Bao está pensando…</Text> : null}
            {!qa.length && !busy ? (
              <Text style={[type.caption, { color: c.textSecondary }]}>
                {noSpoilers ? 'Te doy pistas, pero la respuesta la pones tú 😉 ' : ''}Preguntar no gasta vidas.
              </Text>
            ) : null}
          </ScrollView>
          <View style={[styles.row, { flexWrap: 'wrap', gap: 6 }]}>
            {questions.map((q) => (
              <PressableScale key={q} onPress={() => void ask(q)} disabled={busy} accessibilityRole="button" accessibilityLabel={q}>
                <View style={[styles.chip, { borderColor: c.info, borderRadius: radius.pill }]}>
                  <Text style={[type.caption, { color: c.info }]}>{q}</Text>
                </View>
              </PressableScale>
            ))}
          </View>
          <TextInput
            value={text}
            onChangeText={setText}
            editable={!busy}
            placeholder="Escribe tu duda…"
            placeholderTextColor={c.textSecondary}
            returnKeyType="send"
            onSubmitEditing={() => void ask(text)}
            style={[type.body, styles.input, { color: c.textPrimary, backgroundColor: c.surfaceSunken, borderRadius: radius.pill }]}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 2, borderBottomWidth: 0, paddingBottom: 28 },
  bubble: {},
  chip: { borderWidth: 2, paddingHorizontal: 10, paddingVertical: 4 },
  input: { paddingHorizontal: 16, height: 44 },
});
