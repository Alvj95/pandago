import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { StarButton } from '@/components/learn/StarButton';
import { Bao } from '@/components/mascot';
import { PressableScale } from '@/components/ui';
import { VOCAB } from '@/data/hsk/course';
import { checkServer, hasServer } from '@/lib/api';
import { feedback } from '@/lib/haptics';
import { speakChinese, stopSpeaking } from '@/lib/speech';
import { useProgressStore } from '@/store/useProgressStore';
import { customId, useWordsStore } from '@/store/useWordsStore';
import { useTheme } from '@/theme';
import { askAssistant, type AssistReply } from '@/features/chat/engine/aiClient';
import { useVoiceInput } from '@/features/chat/useVoiceInput';

export interface AssistantStart {
  /** Empezar escuchando (botón «Hablar» del widget, ajustes rápidos…). */
  voice?: boolean;
  /** Texto compartido o seleccionado en otra app. */
  text?: string;
  /** Foto compartida desde otra app. */
  imageUri?: string;
  /** Abrir la cámara directamente. */
  camera?: boolean;
}

interface Exchange {
  id: number;
  question: string;
  context?: string;
  thumb?: string;
  reply?: AssistReply;
  error?: string;
}

const QUICK = ['¿Cómo se dice…?', '¿Qué significa?', 'Revisa mi chino', 'Tradúcelo al chino'];

/** Encoge la foto (1024 px, JPEG) y la devuelve en base64 para enviarla a la IA. */
async function toJpegBase64(uri: string): Promise<string> {
  const r = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1024 } }], { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true });
  if (!r.base64) throw new Error('sin imagen');
  return r.base64;
}

/** Bao Asistente: panel rápido para traducir, explicar textos o fotos y revisar mensajes. */
export function AssistantPanel({ start, onClose, onOpenChat }: { start: AssistantStart; onClose: () => void; onOpenChat: () => void }) {
  const { c, type, spacing, radius } = useTheme();
  const level = useProgressStore((s) => s.hskLevel);
  const mic = useVoiceInput();
  const [text, setText] = useState('');
  const [context, setContext] = useState<string | null>(null);
  const [clip, setClip] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [items, setItems] = useState<Exchange[]>([]);
  const seq = useRef(0);
  const scroll = useRef<ScrollView>(null);

  const ask = async (question: string, opts: { context?: string | null; image?: string; thumb?: string } = {}) => {
    const q = question.trim();
    const ctx = opts.context ?? context ?? undefined;
    if (!q && !ctx && !opts.image) return;
    setText('');
    setContext(null);
    setNotice(null);
    const id = ++seq.current;
    setItems((list) => [...list, { id, question: q, context: ctx, thumb: opts.thumb }]);
    if (!hasServer) {
      setItems((list) => list.map((x) => (x.id === id ? { ...x, error: 'El asistente necesita conexión con el servidor.' } : x)));
      return;
    }
    setBusy(true);
    try {
      const reply = await askAssistant({ question: q, text: ctx, image: opts.image, hskLevel: level });
      setItems((list) => list.map((x) => (x.id === id ? { ...x, reply } : x)));
      void feedback.tap();
      if (reply.hanzi) speakChinese(reply.hanzi);
    } catch (err) {
      // Motivo exacto + comprobación de la conexión con el servidor, para saber qué falla.
      const why = err instanceof Error ? err.message : String(err);
      setItems((list) => list.map((x) => (x.id === id ? { ...x, error: `📵 Bao no ha podido contestar (${why}). Comprobando la conexión…` } : x)));
      const check = await checkServer();
      setItems((list) =>
        list.map((x) =>
          x.id === id
            ? { ...x, error: `📵 Bao no ha podido contestar (${why}). Comprobación: ${check.detail}.${check.ok ? '' : ' Prueba con otra red (wifi ↔ datos).'} Toca aquí para reintentar.` }
            : x,
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  const sendPhoto = async (uri: string) => {
    try {
      setNotice('📷 Preparando la foto…');
      const b64 = await toJpegBase64(uri);
      setNotice(null);
      await ask(text || '¿Qué pone aquí?', { image: b64, thumb: uri });
    } catch {
      setNotice('📷 No he podido leer la foto.');
    }
  };

  const pick = async (from: 'camera' | 'gallery') => {
    try {
      if (from === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) return setNotice('📷 Necesito permiso para usar la cámara (Ajustes → Aplicaciones → PandaGO! → Permisos).');
      }
      const res =
        from === 'camera'
          ? await ImagePicker.launchCameraAsync({ quality: 0.8, mediaTypes: ['images'] })
          : await ImagePicker.launchImageLibraryAsync({ quality: 0.8, mediaTypes: ['images'] });
      if (!res.canceled && res.assets[0]) await sendPhoto(res.assets[0].uri);
    } catch {
      setNotice('📷 No he podido abrir la cámara.');
    }
  };

  const onMic = async () => {
    setNotice(null);
    if (!mic.recording) {
      const err = await mic.start();
      if (err) setNotice(err);
      return;
    }
    const r = await mic.stop('', { lang: 'auto' });
    if (!r.ok) setNotice(r.message);
    else void ask(r.result.transcript);
  };

  // Al abrirse: lo compartido, la cámara o el micrófono, y mira si hay algo copiado.
  useEffect(() => {
    if (start.text) void ask('', { context: start.text });
    else if (start.imageUri) void sendPhoto(start.imageUri);
    else if (start.camera) void pick('camera');
    else if (start.voice) void onMic();
    void Clipboard.getStringAsync()
      .then((s) => {
        const t = s.trim();
        if (t && t.length <= 1500 && t !== start.text) setClip(t);
      })
      .catch(() => undefined);
    return () => {
      stopSpeaking();
      mic.cancel();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={styles.fill}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Cerrar Bao Asistente" />
      <KeyboardAvoidingView behavior="padding" style={styles.sheetWrap} pointerEvents="box-none">
        <View style={[styles.sheet, { backgroundColor: c.surface, borderColor: c.border, padding: spacing.md, gap: spacing.sm }]}>
          <View style={[styles.grab, { backgroundColor: c.border }]} />
          <View style={[styles.row, { gap: spacing.sm }]}>
            <Bao mood={busy ? 'thinking' : mic.recording ? 'talking' : 'happy'} size={40} />
            <View style={styles.flex}>
              <Text style={[type.title, { color: c.textPrimary, fontSize: 17 }]}>Bao Asistente</Text>
              <Text style={[type.caption, { color: mic.recording ? c.danger : c.textSecondary }]}>
                {mic.recording ? '🔴 Te escucho… toca ⏹ al terminar' : busy ? 'Pensando…' : 'Pregunta en español o en chino'}
              </Text>
            </View>
            <PressableScale onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar" hitSlop={10}>
              <Text style={[type.title, { color: c.textSecondary }]}>✕</Text>
            </PressableScale>
          </View>

          {items.length ? (
            <ScrollView ref={scroll} style={{ maxHeight: 360 }} contentContainerStyle={{ gap: spacing.sm }} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}>
              {items.map((x) => (
                <View key={x.id} style={{ gap: 6 }}>
                  {x.question || x.context || x.thumb ? (
                    <View style={[styles.q, { backgroundColor: c.primary }]}>
                      {x.thumb ? <Image source={{ uri: x.thumb }} style={styles.thumb} /> : null}
                      {x.context ? (
                        <Text style={[type.caption, { color: '#fff', opacity: 0.85 }]} numberOfLines={3}>
                          📋 {x.context}
                        </Text>
                      ) : null}
                      {x.question ? <Text style={[type.body, { color: '#fff' }]}>{x.question}</Text> : null}
                    </View>
                  ) : null}
                  {x.reply ? (
                    <ReplyCard reply={x.reply} />
                  ) : x.error ? (
                    <Text
                      onPress={() => {
                        setItems((list) => list.filter((y) => y.id !== x.id));
                        void ask(x.question, { context: x.context ?? null });
                      }}
                      style={[type.caption, { color: c.textSecondary }]}
                    >
                      {x.error}
                    </Text>
                  ) : (
                    <ActivityIndicator color={c.primary} />
                  )}
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.row, { flexWrap: 'wrap', gap: 6 }]}>
              {QUICK.map((q) => (
                <PressableScale key={q} onPress={() => setText(q.replace('…', ' '))} accessibilityRole="button" accessibilityLabel={q}>
                  <View style={[styles.chip, { borderColor: c.info, backgroundColor: c.surface, borderRadius: radius.pill }]}>
                    <Text style={[type.caption, { color: c.info }]}>{q}</Text>
                  </View>
                </PressableScale>
              ))}
            </View>
          )}

          {clip && !context ? (
            <PressableScale
              onPress={() => {
                setContext(clip);
                setClip(null);
              }}
              accessibilityRole="button"
              accessibilityLabel="Usar el texto copiado"
            >
              <View style={[styles.row, styles.clip, { backgroundColor: c.surfaceSunken, borderRadius: radius.md, gap: 6 }]}>
                <Text style={{ fontSize: 16 }}>📋</Text>
                <Text style={[type.caption, { color: c.textPrimary, flex: 1 }]} numberOfLines={1}>
                  Usar lo copiado: «{clip}»
                </Text>
              </View>
            </PressableScale>
          ) : null}
          {context ? (
            <View style={[styles.row, styles.clip, { backgroundColor: c.primarySoft, borderRadius: radius.md, gap: 6 }]}>
              <Text style={[type.caption, { color: c.textPrimary, flex: 1 }]} numberOfLines={2}>
                📋 {context}
              </Text>
              <Text onPress={() => setContext(null)} style={{ color: c.textSecondary }} accessibilityLabel="Quitar texto">
                ✕
              </Text>
            </View>
          ) : null}
          {notice ? <Text style={[type.caption, { color: c.danger }]}>{notice}</Text> : null}

          <View style={[styles.row, { gap: 6 }]}>
            <RoundButton icon="📷" label="Hacer una foto" onPress={() => void pick('camera')} disabled={busy} color={c.surfaceSunken} />
            <RoundButton icon="🖼️" label="Elegir una foto" onPress={() => void pick('gallery')} disabled={busy} color={c.surfaceSunken} />
            {mic.recording ? (
              <Text style={[type.body, styles.flex, { color: c.danger }]}>🔴 Te escucho…</Text>
            ) : (
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder={context ? '¿Qué quieres saber de esto?' : 'Pregúntale a Bao…'}
                placeholderTextColor={c.textSecondary}
                style={[type.body, styles.input, { color: c.textPrimary, backgroundColor: c.surfaceSunken }]}
                onSubmitEditing={() => void ask(text)}
                returnKeyType="send"
              />
            )}
            <RoundButton icon={mic.recording ? '⏹' : '🎙️'} label={mic.recording ? 'Terminar' : 'Hablar'} onPress={() => void onMic()} disabled={busy} color={mic.recording ? c.danger : c.info} />
            {!mic.recording && (text.trim() || context) ? <RoundButton icon="➤" label="Enviar" onPress={() => void ask(text)} disabled={busy} color={c.primary} /> : null}
          </View>
          <Text onPress={onOpenChat} style={[type.caption, { color: c.primary, textAlign: 'center' }]} accessibilityRole="link">
            💬 Seguir charlando con Bao en la app ›
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function RoundButton({ icon, label, onPress, disabled, color }: { icon: string; label: string; onPress: () => void; disabled?: boolean; color: string }) {
  return (
    <PressableScale onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label}>
      <View style={[styles.round, { backgroundColor: color, opacity: disabled ? 0.5 : 1 }]}>
        <Text style={{ fontSize: 18, color: '#fff' }}>{icon}</Text>
      </View>
    </PressableScale>
  );
}

/** Respuesta: explicación, frase en chino para copiar o escuchar, y palabras para guardar. */
function ReplyCard({ reply }: { reply: AssistReply }) {
  const { c, type, radius, spacing } = useTheme();
  const cards = useWordsStore((s) => s.cards);
  const toggleCustom = useWordsStore((s) => s.toggleCustom);
  const [copied, setCopied] = useState(false);
  return (
    <View style={[styles.reply, { backgroundColor: c.surfaceSunken, borderRadius: radius.md, gap: 6, padding: spacing.sm }]}>
      {reply.read ? (
        <Text style={[type.caption, { color: c.textSecondary }]} numberOfLines={4}>
          👀 Bao leyó: {reply.read}
        </Text>
      ) : null}
      {reply.hanzi ? (
        <View>
          <Text style={[type.hanzi, { fontSize: 21, lineHeight: 28, color: c.textPrimary }]}>{reply.hanzi}</Text>
          {reply.pinyin ? <Text style={[type.caption, { color: c.textSecondary }]}>{reply.pinyin}</Text> : null}
        </View>
      ) : null}
      <Text style={[type.body, { color: c.textPrimary, fontSize: 14.5 }]}>{reply.answer}</Text>
      {reply.hanzi ? (
        <View style={[styles.row, { gap: spacing.sm }]}>
          <Chip
            label={copied ? '✓ Copiado' : '📋 Copiar'}
            onPress={() => {
              void Clipboard.setStringAsync(reply.hanzi!);
              setCopied(true);
            }}
          />
          <Chip label="🔊 Escuchar" onPress={() => speakChinese(reply.hanzi!, { force: true })} />
          <Chip label="🐢" onPress={() => speakChinese(reply.hanzi!, { force: true, rate: 0.5 })} />
        </View>
      ) : null}
      {reply.words.length ? (
        <View style={[styles.row, { flexWrap: 'wrap', gap: 6 }]}>
          {reply.words.map((w) => {
            const v = VOCAB.find((x) => x.hanzi === w.hanzi);
            const saved = v ? false : !!cards[customId(w.hanzi)];
            return (
              <View key={w.hanzi} style={[styles.row, styles.word, { borderColor: c.border, backgroundColor: c.surface, borderRadius: radius.pill, gap: 4 }]}>
                <Text onPress={() => speakChinese(w.hanzi, { force: true })} style={[type.caption, { color: c.textPrimary }]}>
                  <Text style={{ fontFamily: 'NotoSansSC_700Bold', fontSize: 15 }}>{w.hanzi}</Text> {w.pinyin} · {w.es}
                </Text>
                {v ? (
                  <StarButton id={v.id} size={16} />
                ) : (
                  <Text onPress={() => toggleCustom({ hanzi: w.hanzi, pinyin: w.pinyin, meaning: w.es })} style={{ fontSize: 16, opacity: saved ? 1 : 0.35 }} accessibilityRole="button" accessibilityLabel={saved ? 'Quitar de Mis palabras' : 'Guardar en Mis palabras'}>
                    {saved ? '⭐' : '☆'}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

function Chip({ label, onPress }: { label: string; onPress: () => void }) {
  const { c, type, radius } = useTheme();
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <View style={[styles.chip, { borderColor: c.border, backgroundColor: c.surface, borderRadius: radius.pill }]}>
        <Text style={[type.caption, { color: c.textPrimary }]}>{label}</Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 2, borderBottomWidth: 0, paddingBottom: 28 },
  grab: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center' },
  q: { alignSelf: 'flex-end', maxWidth: '88%', borderRadius: 16, borderBottomRightRadius: 4, paddingHorizontal: 12, paddingVertical: 8, gap: 4 },
  thumb: { width: 120, height: 90, borderRadius: 10 },
  reply: {},
  chip: { borderWidth: 2, paddingHorizontal: 10, paddingVertical: 4 },
  clip: { paddingHorizontal: 10, paddingVertical: 8 },
  input: { flex: 1, minWidth: 0, borderRadius: 99, paddingHorizontal: 14, height: 44 },
  round: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  word: { borderWidth: 2, paddingHorizontal: 10, paddingVertical: 3 },
});
