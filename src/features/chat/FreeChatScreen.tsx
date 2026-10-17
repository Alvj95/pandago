import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StarButton } from '@/components/learn/StarButton';
import { Bao } from '@/components/mascot';
import { Button3D, PressableScale } from '@/components/ui';
import { VOCAB } from '@/data/hsk/course';
import { checkServer, hasServer } from '@/lib/api';
import { feedback } from '@/lib/haptics';
import { exitTo } from '@/lib/navigation';
import { speakChinese, stopSpeaking } from '@/lib/speech';
import { type FreeMessage, type HelpLevel, msgId, useFreeChatStore } from '@/store/useFreeChatStore';
import { useProgressStore } from '@/store/useProgressStore';
import { trackQuest } from '@/store/useQuestStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useTheme } from '@/theme';
import { sendFreeChat } from './engine/aiClient';
import { glossPieces } from './engine/glossary';
import { useVoiceInput } from './useVoiceInput';

const GREETING = { hanzi: '你好！我是宝宝。你今天怎么样？', pinyin: 'nǐ hǎo! wǒ shì Bǎobao. nǐ jīntiān zěnmeyàng?', translation: '¡Hola! Soy Bao. ¿Qué tal tu día?' };
const STARTERS = ['你好！', '¿Qué comes hoy?', 'Cuéntame un chiste', '¿Cómo se dice «gracias»?', '你喜欢什么？'];
const HELP: { value: HelpLevel; icon: string; title: string; desc: string }[] = [
  { value: 'full', icon: '🌱', title: 'Con ayuda', desc: 'Chino sencillo + pinyin + traducción en cada mensaje.' },
  { value: 'balanced', icon: '🌿', title: 'Equilibrado', desc: 'Chino + pinyin; la traducción, al tocar el mensaje.' },
  { value: 'chinese', icon: '🌳', title: 'Solo chino', desc: 'Como con un amigo nativo. Toca el mensaje o una palabra si no la sabes.' },
];

/** Chat libre con Bao, como en una app de mensajes: sin guion, sin tareas. */
export function FreeChatScreen() {
  const { c, type, spacing, radius } = useTheme();
  const router = useRouter();
  const chat = useFreeChatStore();
  const level = useProgressStore((s) => s.hskLevel);
  const voice = useSettingsStore((s) => s.voice);
  const setVoice = useSettingsStore((s) => s.setVoice);
  const mic = useVoiceInput();
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [settings, setSettings] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const listRef = useRef<FlatList<FreeMessage>>(null);

  // Primera vez: Bao saluda (sin gastar IA).
  useEffect(() => {
    if (!useFreeChatStore.getState().messages.length) chat.add({ id: msgId(), from: 'bao', ...GREETING });
    return () => {
      stopSpeaking();
      mic.cancel();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const send = async (raw: string) => {
    const msg = raw.trim();
    if (!msg || typing) return;
    setText('');
    const userId = msgId();
    chat.add({ id: userId, from: 'user', text: msg });
    trackQuest('chat_turn');
    if (!hasServer) {
      chat.add({ id: msgId(), from: 'system', text: '📵 El chat con Bao necesita conexión con el servidor.' });
      return;
    }
    setTyping(true);
    try {
      const st = useFreeChatStore.getState();
      const history = st.messages
        .filter((m): m is Exclude<FreeMessage, { from: 'system' }> => m.from !== 'system')
        .slice(-16)
        .map((m) => (m.from === 'user' ? { role: 'user' as const, text: m.text } : { role: 'bao' as const, text: m.hanzi }));
      const r = await sendFreeChat(history, { hskLevel: level, memory: st.remember ? st.memory : [], corrections: st.corrections });
      // Solo se corrige lo escrito en chino (en español no hay nada que corregir).
      if (r.correction && st.corrections && /\p{Script=Han}/u.test(msg) && r.correction.corrected !== msg) chat.update(userId, { fix: r.correction });
      if (r.remember && st.remember) chat.addMemory(r.remember);
      chat.add({ id: msgId(), from: 'bao', hanzi: r.hanzi, pinyin: r.pinyin, translation: r.translation, note: r.note });
      void feedback.tap();
      if (useSettingsStore.getState().voice) speakChinese(r.hanzi);
    } catch (err) {
      const why = err instanceof Error ? err.message : String(err);
      const check = await checkServer();
      chat.add({ id: msgId(), from: 'system', text: `📵 Bao no ha podido contestar (${why}). Comprobación: ${check.detail}. Toca aquí para reintentar.|${msg}` });
    } finally {
      setTyping(false);
    }
  };

  const onMic = async () => {
    if (!mic.recording) {
      const err = await mic.start();
      if (err) chat.add({ id: msgId(), from: 'system', text: err });
      return;
    }
    const r = await mic.stop();
    if (!r.ok) chat.add({ id: msgId(), from: 'system', text: r.message });
    else void send(r.result.transcript);
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: c.background }]}>
      <View style={[styles.row, styles.head, { borderBottomColor: c.border, backgroundColor: c.surface, gap: spacing.sm }]}>
        <PressableScale onPress={() => exitTo(router)} accessibilityRole="button" accessibilityLabel="Volver" hitSlop={10}>
          <Text style={[type.title, { color: c.textSecondary }]}>‹</Text>
        </PressableScale>
        <Bao mood={typing ? 'thinking' : 'happy'} size={40} />
        <View style={styles.flex}>
          <Text style={[type.title, { color: c.textPrimary, fontSize: 17 }]}>Bao</Text>
          <Text style={[type.caption, { color: typing ? c.textSecondary : c.success }]}>{typing ? 'escribiendo…' : '● en línea'}</Text>
        </View>
        <PressableScale onPress={() => setVoice(!voice)} accessibilityRole="switch" accessibilityState={{ checked: voice }} accessibilityLabel="Bao lee sus mensajes en voz alta" hitSlop={8}>
          <Text style={{ fontSize: 22 }}>{voice ? '🔊' : '🔇'}</Text>
        </PressableScale>
        <PressableScale onPress={() => setSettings(true)} accessibilityRole="button" accessibilityLabel="Ajustes del chat" hitSlop={8}>
          <Text style={{ fontSize: 22 }}>⚙️</Text>
        </PressableScale>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <FlatList
          ref={listRef}
          data={chat.messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: spacing.sm, gap: spacing.xs }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) =>
            item.from === 'bao' ? (
              <BaoMessage m={item} help={chat.help} />
            ) : item.from === 'user' ? (
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <View style={[styles.bubble, { backgroundColor: c.primary, borderBottomRightRadius: 4 }]}>
                  <Text style={[type.body, { color: '#fff' }]}>{item.text}</Text>
                </View>
                {item.fix ? (
                  <View style={[styles.fix, { backgroundColor: c.successSoft, borderRadius: radius.sm }]}>
                    <Text style={[type.caption, { color: c.success }]}>
                      ✏️ Mejor así: {item.fix.corrected}
                      {item.fix.explanation ? ` · ${item.fix.explanation}` : ''}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <PressableScale
                onPress={() => {
                  const retry = item.text.split('|')[1];
                  if (retry) void send(retry);
                }}
                accessibilityRole="button"
                accessibilityLabel={item.text.split('|')[0]}
              >
                <Text style={[type.caption, styles.system, { color: c.textSecondary, backgroundColor: c.surfaceSunken, borderRadius: radius.sm }]}>{item.text.split('|')[0]}</Text>
              </PressableScale>
            )
          }
          ListFooterComponent={
            typing ? (
              <View style={[styles.bubble, styles.typing, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Text style={[type.title, { color: c.textSecondary, letterSpacing: 3 }]}>• • •</Text>
              </View>
            ) : null
          }
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: spacing.sm, paddingBottom: 6 }} style={{ flexGrow: 0 }}>
          {STARTERS.map((s) => (
            <PressableScale key={s} onPress={() => void send(s)} disabled={typing} accessibilityRole="button" accessibilityLabel={s}>
              <View style={[styles.starter, { borderColor: c.info, backgroundColor: c.surface }]}>
                <Text style={[type.caption, { color: c.info }]}>{s}</Text>
              </View>
            </PressableScale>
          ))}
        </ScrollView>

        <View style={[styles.row, styles.foot, { borderTopColor: c.border, backgroundColor: c.surface, gap: 6 }]}>
          {mic.recording ? (
            <Text style={[type.body, styles.flex, { color: c.danger }]}>🔴 Te escucho… habla en chino y toca ⏹</Text>
          ) : (
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Escribe en chino, pinyin o español…"
              placeholderTextColor={c.textSecondary}
              style={[type.body, styles.input, { color: c.textPrimary, backgroundColor: c.surfaceSunken }]}
              onSubmitEditing={() => void send(text)}
              returnKeyType="send"
              multiline={false}
            />
          )}
          <PressableScale onPress={() => void onMic()} disabled={typing} accessibilityRole="button" accessibilityLabel={mic.recording ? 'Terminar de grabar' : 'Mensaje de voz'}>
            <View style={[styles.round, { backgroundColor: mic.recording ? c.danger : c.info }]}>
              <Text style={{ fontSize: 18 }}>{mic.recording ? '⏹' : '🎙️'}</Text>
            </View>
          </PressableScale>
          {!mic.recording ? (
            <PressableScale onPress={() => void send(text)} disabled={!text.trim() || typing} accessibilityRole="button" accessibilityLabel="Enviar">
              <View style={[styles.round, { backgroundColor: text.trim() ? c.primary : c.locked }]}>
                <Text style={{ fontSize: 18, color: '#fff' }}>➤</Text>
              </View>
            </PressableScale>
          ) : null}
        </View>
      </KeyboardAvoidingView>

      <Modal visible={settings} transparent animationType="slide" onRequestClose={() => setSettings(false)}>
        <Pressable style={styles.backdrop} onPress={() => setSettings(false)} accessibilityLabel="Cerrar" />
        <View style={[styles.sheet, { backgroundColor: c.surface, borderColor: c.border, gap: spacing.sm, padding: spacing.md }]}>
          <Text style={[type.title, { color: c.textPrimary }]}>⚙️ Cómo te habla Bao</Text>
          {HELP.map((h) => (
            <PressableScale key={h.value} onPress={() => chat.setHelp(h.value)} accessibilityRole="radio" accessibilityState={{ checked: chat.help === h.value }} accessibilityLabel={h.title}>
              <View style={[styles.row, styles.level, { gap: spacing.sm, borderRadius: radius.md, borderColor: chat.help === h.value ? c.primary : c.border, backgroundColor: chat.help === h.value ? c.primarySoft : c.surface }]}>
                <Text style={{ fontSize: 22 }}>{h.icon}</Text>
                <View style={styles.flex}>
                  <Text style={[type.body, { color: c.textPrimary, fontFamily: 'Nunito_800ExtraBold' }]}>{h.title}</Text>
                  <Text style={[type.caption, { color: c.textSecondary }]}>{h.desc}</Text>
                </View>
              </View>
            </PressableScale>
          ))}
          <Toggle label="✏️ Correcciones suaves" value={chat.corrections} onChange={chat.setCorrections} />
          <Toggle label="🔊 Bao lee sus mensajes en voz alta" value={voice} onChange={setVoice} />
          <Toggle label={`🧠 Recordar lo que le cuento${chat.memory.length ? ` (${chat.memory.length})` : ''}`} value={chat.remember} onChange={chat.setRemember} />
          <Button3D
            label={confirmClear ? '¿Seguro? Toca otra vez para borrar' : '🗑️ Borrar la conversación'}
            variant="ghost"
            onPress={() => {
              if (!confirmClear) return setConfirmClear(true);
              chat.clear();
              chat.add({ id: msgId(), from: 'bao', ...GREETING });
              setConfirmClear(false);
              setSettings(false);
            }}
          />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const { c, type } = useTheme();
  return (
    <View style={[styles.row, { justifyContent: 'space-between' }]}>
      <Text style={[type.body, { color: c.textPrimary, flex: 1 }]}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: c.success, false: c.locked }} accessibilityLabel={label} />
    </View>
  );
}

/** Mensaje de Bao: chino con palabras que se pueden tocar; pinyin y traducción según el nivel de ayuda. */
function BaoMessage({ m, help }: { m: Extract<FreeMessage, { from: 'bao' }>; help: HelpLevel }) {
  const { c, type, radius } = useTheme();
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState<{ hanzi: string; pinyin: string; meaning: string } | null>(null);
  const showPinyin = help !== 'chinese' || open;
  const showEs = help === 'full' || open;
  const pieces = glossPieces(m.hanzi, VOCAB);
  const vocabId = word ? VOCAB.find((v) => v.hanzi === word.hanzi)?.id : undefined;

  return (
    <View style={{ alignItems: 'flex-start', gap: 4 }}>
      <Pressable onPress={() => setOpen((v) => !v)} accessibilityRole="button" accessibilityLabel={`Bao: ${m.hanzi}. ${m.translation}`}>
        <View style={[styles.bubble, { backgroundColor: c.surface, borderColor: c.border, borderWidth: 2, borderBottomLeftRadius: 4 }]}>
          <Text style={[type.hanzi, { fontSize: 19, lineHeight: 27, color: c.textPrimary }]}>
            {pieces.map((p, i) =>
              p.word ? (
                <Text
                  key={i}
                  onPress={() => {
                    setWord(p.word!);
                    speakChinese(p.word!.hanzi, { force: true });
                  }}
                  style={{ textDecorationLine: 'underline', textDecorationStyle: 'dotted', textDecorationColor: c.info }}
                >
                  {p.text}
                </Text>
              ) : (
                <Text key={i}>{p.text}</Text>
              ),
            )}
          </Text>
          {showPinyin && m.pinyin ? <Text style={[type.caption, { color: c.textSecondary }]}>{m.pinyin}</Text> : null}
          {showEs && m.translation ? <Text style={[type.body, { color: c.textPrimary, fontSize: 14, marginTop: 2 }]}>{m.translation}</Text> : null}
          {m.note ? <Text style={[type.body, { color: c.textPrimary, fontSize: 14, marginTop: 4 }]}>💡 {m.note}</Text> : null}
          <View style={[styles.row, { gap: 10, marginTop: 4 }]}>
            <Text onPress={() => speakChinese(m.hanzi, { force: true })} style={{ fontSize: 15 }} accessibilityLabel="Escuchar">
              🔊
            </Text>
            {help !== 'full' && !open ? <Text style={[type.caption, { color: c.textSecondary }]}>toca para traducir</Text> : null}
          </View>
        </View>
      </Pressable>
      {word ? (
        <View style={[styles.row, styles.pop, { backgroundColor: c.textPrimary, borderRadius: radius.sm, gap: 8 }]}>
          <Text style={[type.hanzi, { fontSize: 18, lineHeight: 24, color: c.background }]}>{word.hanzi}</Text>
          <Text style={[type.caption, { color: c.background, flexShrink: 1 }]}>
            {word.pinyin} · {word.meaning}
          </Text>
          {vocabId ? <StarButton id={vocabId} size={18} /> : null}
          <Text onPress={() => setWord(null)} style={{ color: c.background }} accessibilityLabel="Cerrar">
            ✕
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  head: { paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 2 },
  bubble: { maxWidth: '84%', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18 },
  typing: { borderWidth: 2, alignSelf: 'flex-start', marginTop: 6 },
  fix: { maxWidth: '84%', paddingHorizontal: 8, paddingVertical: 4 },
  system: { alignSelf: 'center', textAlign: 'center', paddingHorizontal: 10, paddingVertical: 4, maxWidth: '90%' },
  starter: { borderWidth: 2, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 },
  foot: { paddingHorizontal: 10, paddingTop: 8, paddingBottom: 12, borderTopWidth: 2 },
  input: { flex: 1, borderRadius: 99, paddingHorizontal: 14, height: 44 },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  pop: { maxWidth: '90%', paddingHorizontal: 10, paddingVertical: 6, marginLeft: 16 },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 2, paddingBottom: 32 },
  level: { borderWidth: 2, padding: 10 },
});
