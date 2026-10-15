import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PinyinText } from '@/components/learn';
import { Bao } from '@/components/mascot';
import { Button3D, PressableScale, ProgressBar } from '@/components/ui';
import { VOCAB } from '@/data/hsk/course';
import { type Story, STORIES, STORY_NOTES, type StoryLine, type StoryQuestion } from '@/data/stories';
import { findNode } from '@/features/lesson/content';
import { trackQuest } from '@/store/useQuestStore';
import { glossPieces, type Piece } from '@/features/chat/engine/glossary';
import { feedback } from '@/lib/haptics';
import { exitTo } from '@/lib/navigation';
import { speakChinese } from '@/lib/speech';
import { useProgressStore } from '@/store/useProgressStore';
import { useStoryStore } from '@/store/useStoryStore';
import { useTheme } from '@/theme';

const STORY_XP = 10;

type Step = { kind: 'line'; line: StoryLine; index: number } | { kind: 'question'; q: StoryQuestion };

/** Las líneas en orden, con cada pregunta justo después de su línea. */
export function storySteps(story: Story): Step[] {
  return story.lines.flatMap((line, index): Step[] => [
    { kind: 'line', line, index },
    ...story.questions.filter((q) => q.after === index).map((q): Step => ({ kind: 'question', q })),
  ]);
}

/** Reproductor de historia: líneas tipo chat que se escuchan, palabras tocables y preguntas de comprensión. */
export function StoryScreen({ story }: { story: Story }) {
  const { c, type, spacing, radius } = useTheme();
  const router = useRouter();
  const awardXp = useProgressStore((s) => s.awardXp);
  const finish = useStoryStore((s) => s.finish);
  const completeNode = useProgressStore((s) => s.completeNode);

  const steps = useMemo(() => storySteps(story), [story]);
  const [pos, setPos] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [listenOnly, setListenOnly] = useState(false);
  const [showEs, setShowEs] = useState(false);
  const [word, setWord] = useState<Piece | null>(null);
  const scroll = useRef<ScrollView>(null);
  const rewarded = useRef(false);

  const step = steps[pos];
  const ended = pos >= steps.length;
  const correct = steps.reduce((n, s, i) => (s.kind === 'question' && answers[i] === s.q.answer ? n + 1 : n), 0);

  useEffect(() => {
    if (step?.kind === 'line') speakChinese(step.line.hanzi, { force: true, rate: 0.8 });
  }, [step]);

  useEffect(() => {
    if (!ended || rewarded.current) return;
    rewarded.current = true;
    finish(story.id, correct, story.questions.length);
    awardXp(STORY_XP);
    // Leer cualquier historia de la unidad completa su nodo 📖 del camino.
    const node = findNode(`${story.unitId}-story`);
    if (node) completeNode(node);
    trackQuest('story');
    void feedback.levelUp();
  }, [ended, correct, finish, story, awardXp, completeNode]);

  // Siguiente historia de la misma unidad (en orden), para seguir leyendo.
  const siblings = STORIES.filter((s) => s.unitId === story.unitId);
  const nextStory = siblings[siblings.indexOf(story) + 1];

  const visible = steps.slice(0, Math.min(pos + 1, steps.length));
  const pendingQuestion = step?.kind === 'question' && answers[pos] === undefined;

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: c.background }]}>
      <View style={[styles.row, { padding: spacing.sm, gap: spacing.sm }]}>
        <PressableScale onPress={() => exitTo(router)} accessibilityRole="button" accessibilityLabel="Cerrar" hitSlop={12}>
          <Text style={[type.title, { color: c.textSecondary, paddingHorizontal: spacing.xs }]}>✕</Text>
        </PressableScale>
        <View style={styles.flex}>
          <ProgressBar progress={Math.min(1, (pos + 1) / steps.length)} />
        </View>
      </View>
      <View style={[styles.row, { paddingHorizontal: spacing.md, gap: spacing.xs, flexWrap: 'wrap' }]}>
        <Text style={[type.title, styles.flex, { color: c.textPrimary }]}>
          {story.icon} {story.title}
        </Text>
        <Toggle on={listenOnly} label="👂 Solo escuchar" onPress={() => setListenOnly((v) => !v)} />
        <Toggle on={showEs} label="🇪🇸 Traducción" onPress={() => setShowEs((v) => !v)} />
      </View>

      <ScrollView ref={scroll} contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}>
        {visible.map((s, i) =>
          s.kind === 'line' ? (
            <LineBubble key={i} line={s.line} story={story} listenOnly={listenOnly} showEs={showEs} onWord={setWord} />
          ) : (
            <QuestionCard key={i} q={s.q} picked={answers[i]} onPick={(k) => {
              if (answers[i] !== undefined) return;
              setAnswers((a) => ({ ...a, [i]: k }));
              void (k === s.q.answer ? feedback.correct() : feedback.wrong());
            }} />
          ),
        )}
        {ended && (
          <Animated.View entering={FadeInDown.duration(300)} style={[styles.center, { gap: spacing.sm, paddingVertical: spacing.md }]}>
            <Bao mood="celebrate" size={110} />
            <Text style={[type.display, { color: c.textPrimary, fontSize: 24 }]}>¡Historia terminada!</Text>
            <Text style={[type.body, { color: c.textSecondary }]}>
              Preguntas: {correct}/{story.questions.length} · +{STORY_XP} XP
            </Text>
            {STORY_NOTES[story.id] && (
              <View style={{ backgroundColor: c.primarySoft, borderRadius: radius.sm, padding: spacing.sm }}>
                <Text style={[type.body, { color: c.textPrimary }]}>💡 {STORY_NOTES[story.id]}</Text>
              </View>
            )}
          </Animated.View>
        )}
      </ScrollView>

      {word?.word && (
        <PressableScale
          onPress={() => speakChinese(word.text, { force: true })}
          accessibilityRole="button"
          accessibilityLabel={`Escuchar ${word.word.pinyin}`}
          style={[styles.wordPanel, { backgroundColor: c.surfaceRaised, borderColor: c.info, borderRadius: radius.md, marginHorizontal: spacing.md, padding: spacing.sm, gap: spacing.sm }]}
        >
          <Text style={[type.hanzi, { fontSize: 28, lineHeight: 36, color: c.textPrimary }]}>{word.text}</Text>
          <View style={styles.flex}>
            <PinyinText pinyin={word.word.pinyin} style={type.title} />
            <Text style={[type.body, { color: c.textPrimary }]}>{word.word.meaning}</Text>
          </View>
          <Text style={{ fontSize: 22 }}>🔊</Text>
        </PressableScale>
      )}

      <View style={[styles.footer, { padding: spacing.md, borderTopColor: c.border }]}>
        {ended ? (
          <View style={{ gap: spacing.sm }}>
            {nextStory && (
              <Button3D
                label={`Siguiente historia: ${nextStory.title}`}
                variant="success"
                onPress={() => router.replace({ pathname: '/story/[id]', params: { id: nextStory.id } })}
              />
            )}
            <Button3D label="Volver" variant={nextStory ? 'ghost' : 'success'} onPress={() => exitTo(router)} />
          </View>
        ) : (
          <Button3D
            label={pendingQuestion ? 'Elige una respuesta' : 'Continuar'}
            disabled={pendingQuestion}
            variant={step?.kind === 'question' ? (answers[pos] === step.q.answer ? 'success' : 'danger') : 'primary'}
            onPress={() => {
              setWord(null);
              setPos((p) => p + 1);
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function Toggle({ on, label, onPress }: { on: boolean; label: string; onPress: () => void }) {
  const { c, type, radius } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm, borderWidth: 1.5, borderColor: on ? c.info : c.border, backgroundColor: on ? c.surfaceRaised : 'transparent' }}
    >
      <Text style={[type.caption, { color: on ? c.info : c.textSecondary }]}>{label}</Text>
    </PressableScale>
  );
}

function LineBubble({ line, story, listenOnly, showEs, onWord }: { line: StoryLine; story: Story; listenOnly: boolean; showEs: boolean; onWord: (p: Piece) => void }) {
  const { c, type, spacing, radius } = useTheme();
  const [reveal, setReveal] = useState(false);
  const isBao = line.who === 'bao';
  const hidden = listenOnly && !reveal;
  const pieces = useMemo(() => glossPieces(line.hanzi, VOCAB), [line.hanzi]);

  return (
    <Animated.View entering={FadeInDown.duration(260)} style={[styles.lineRow, { gap: spacing.xs, flexDirection: isBao ? 'row' : 'row-reverse' }]}>
      <View style={styles.avatar}>{isBao ? <Bao mood="idle" size={40} /> : <Text style={styles.partner}>{story.partner.icon}</Text>}</View>
      <PressableScale
        onPress={() => (hidden ? setReveal(true) : speakChinese(line.hanzi, { force: true, rate: 0.8 }))}
        accessibilityRole="button"
        accessibilityHint={hidden ? 'Toca para ver el texto' : 'Toca para volver a escuchar'}
        containerStyle={styles.bubbleWrap}
        style={[
          styles.bubble,
          { backgroundColor: isBao ? c.primarySoft : c.surfaceRaised, borderColor: isBao ? c.primary : c.border, borderRadius: radius.md, padding: spacing.sm },
        ]}
      >
        <Text style={[type.caption, { color: c.textSecondary }]}>{isBao ? '宝宝 Bao' : line.who}</Text>
        {hidden ? (
          <Text style={[type.title, { color: c.textSecondary }]}>🔊 ··· (toca para ver)</Text>
        ) : (
          <>
            <Text style={[type.hanzi, { fontSize: 24, lineHeight: 34, color: c.textPrimary }]}>
              {pieces.map((p, i) =>
                p.han ? (
                  <Text key={i} onPress={() => onWord(p)} style={styles.tappable} suppressHighlighting={false}>
                    {p.text}
                  </Text>
                ) : (
                  <Text key={i}>{p.text}</Text>
                ),
              )}
            </Text>
            <PinyinText pinyin={line.pinyin} style={[type.caption, { fontSize: 14 }]} />
            {showEs && <Text style={[type.body, { color: c.textSecondary }]}>{line.es}</Text>}
          </>
        )}
      </PressableScale>
    </Animated.View>
  );
}

function QuestionCard({ q, picked, onPick }: { q: StoryQuestion; picked: number | undefined; onPick: (i: number) => void }) {
  const { c, type, spacing, radius } = useTheme();
  return (
    <Animated.View entering={FadeInDown.duration(260)} style={[styles.question, { backgroundColor: c.surface, borderColor: c.info, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm }]}>
      <Text style={[type.caption, { color: c.info }]}>❓ PREGUNTA</Text>
      <Text style={[type.title, { color: c.textPrimary }]}>{q.question}</Text>
      {q.options.map((opt, i) => {
        const state = picked === undefined ? 'idle' : i === q.answer ? 'right' : i === picked ? 'wrong' : 'idle';
        return (
          <PressableScale
            key={i}
            onPress={() => onPick(i)}
            accessibilityRole="button"
            accessibilityLabel={opt}
            style={[
              styles.option,
              {
                borderRadius: radius.sm,
                padding: spacing.sm,
                backgroundColor: state === 'right' ? c.successSoft : state === 'wrong' ? c.dangerSoft : c.surfaceRaised,
                borderColor: state === 'right' ? c.success : state === 'wrong' ? c.danger : c.border,
              },
            ]}
          >
            <Text style={[type.body, { color: c.textPrimary }]}>{opt}</Text>
          </PressableScale>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  center: { alignItems: 'center' },
  footer: { borderTopWidth: 2 },
  lineRow: { alignItems: 'flex-end' },
  avatar: { width: 44, alignItems: 'center' },
  partner: { fontSize: 32 },
  bubbleWrap: { maxWidth: '82%' },
  bubble: { borderWidth: 2, borderBottomWidth: 4, gap: 2 },
  tappable: { textDecorationLine: 'underline', textDecorationStyle: 'dotted' },
  question: { borderWidth: 2 },
  option: { borderWidth: 2, borderBottomWidth: 4 },
  wordPanel: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, marginBottom: 8 },
});
