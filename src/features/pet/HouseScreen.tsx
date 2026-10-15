import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { type BaoAction, BaoFull, FULL_RATIO } from '@/components/mascot';
import { Button3D, Card, PressableScale } from '@/components/ui';
import { feedback } from '@/lib/haptics';
import { speakChinese } from '@/lib/speech';
import { usePetStore } from '@/store/usePetStore';
import { useTheme } from '@/theme';
import {
  askFor,
  BODY,
  bump,
  COLORS,
  FOODS,
  gameOfDay,
  houseWord,
  learn,
  moodLine,
  type Game,
  type Need,
  NUMBERS,
  pickN,
  PLACES,
  type Word,
} from './pet';

type Mode = 'home' | 'feed' | 'bath' | 'play';
type Line = { hanzi: string; pinyin: string; es: string };
type Mood = 'happy' | 'encourage' | 'talking' | 'sleep' | 'idle';

const NEEDS: { key: Need; icon: string; label: string; color: string }[] = [
  { key: 'hunger', icon: '🍜', label: 'Hambre', color: '#FF4B5C' },
  { key: 'clean', icon: '🛁', label: 'Limpieza', color: '#2BA6F0' },
  { key: 'energy', icon: '⚡', label: 'Energía', color: '#FFC21A' },
  { key: 'joy', icon: '💛', label: 'Alegría', color: '#3CCB6F' },
];

/** Casa de Bao: cuidarlo (comer, baño, jugar, dormir, hablar) practicando chino. */
export function HouseScreen() {
  const { c, type, spacing, radius, scheme } = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const pet = usePetStore((s) => s.pet);
  const refresh = usePetStore((s) => s.refresh);
  const update = usePetStore((s) => s.update);
  const [mode, setMode] = useState<Mode>('home');
  const [action, setAction] = useState<BaoAction>('idle');
  const [mood, setMood] = useState<Mood>('idle');
  const [line, setLine] = useState<Line | null>(null);
  const [showWords, setShowWords] = useState(false);
  const actionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Comer
  const [feed, setFeed] = useState<{ options: (typeof FOODS)[number][]; target: (typeof FOODS)[number]; wrong: string[]; done?: boolean } | null>(null);
  // Baño
  const [bath, setBath] = useState<{ parts: Word[]; step: number; found: string[] } | null>(null);
  // Jugar
  const [game, setGame] = useState<Game>('numbers');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [count, setCount] = useState(0);
  const [target, setTarget] = useState<Word | null>(null);
  const [colorOpts, setColorOpts] = useState<(typeof COLORS)[number][]>([]);
  const [hidden, setHidden] = useState(false);

  const asleep = pet.sleepingSince !== null;
  const baoSize = Math.min(150, width * 0.36);

  // El tiempo pasa también con la app cerrada.
  useEffect(() => {
    refresh();
    const t = setInterval(() => refresh(), 60_000);
    return () => clearInterval(t);
  }, [refresh]);

  const say = useCallback((l: Line, m: Mood = 'talking') => {
    setLine(l);
    setMood(m);
    speakChinese(l.hanzi.replace(/[…Zz呼]/g, '').trim() || l.hanzi, { force: true });
  }, []);

  /** Hace una acción unos segundos y vuelve a estar quieto. */
  const play = useCallback((a: BaoAction, ms = 2600) => {
    if (actionTimer.current) clearTimeout(actionTimer.current);
    setAction(a);
    actionTimer.current = setTimeout(() => setAction(asleepRef.current ? 'sleep' : 'idle'), ms);
  }, []);
  const asleepRef = useRef(asleep);
  asleepRef.current = asleep;

  // Al entrar en casa, Bao dice cómo está.
  useEffect(() => {
    const l = moodLine(usePetStore.getState().pet, new Date().getHours());
    setLine(l);
    setMood(l.mood);
    if (usePetStore.getState().pet.sleepingSince !== null) setAction('sleep');
    else play('wave');
    return () => {
      if (actionTimer.current) clearTimeout(actionTimer.current);
    };
  }, [play]);

  const backHome = () => {
    setMode('home');
    const l = moodLine(usePetStore.getState().pet, new Date().getHours());
    setLine(l);
    setMood(l.mood);
  };

  const wall = scheme === 'dark' ? (asleep ? '#1B2340' : '#3A2D25') : asleep ? '#232B4D' : '#FFE9D6';
  const floor = scheme === 'dark' ? (asleep ? '#2E2A3F' : '#4A3527') : asleep ? '#2E2A3F' : '#E9C9A6';
  const bathWall = scheme === 'dark' ? '#1E3442' : '#DDF3FF';

  return (
    <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl }}>
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <Text style={[type.display, { color: c.textPrimary }]}>🏠 Casa de Bao</Text>
          <Text style={[type.title, { color: c.textSecondary }]} accessibilityLabel={`Despensa: ${pet.food} comidas`}>
            🥟 {pet.food}
          </Text>
        </View>

        {/* Habitación */}
        <View style={[styles.room, { borderRadius: radius.lg, backgroundColor: floor }]}>
          <View style={[styles.wall, { backgroundColor: mode === 'bath' ? bathWall : wall }]} />
          <View style={[styles.window, { backgroundColor: asleep ? '#0E1430' : '#BFE6FF', borderColor: '#C98F5B' }]}>
            <Text style={{ fontSize: 20 }}>{asleep ? '🌙' : '☁️'}</Text>
          </View>
          {mode !== 'bath' ? <Text style={styles.plant}>🎋</Text> : <Text style={[styles.plant, { fontSize: 26 }]}>🫧</Text>}
          {asleep ? <Text style={[styles.zz, { color: '#A3B4FF' }]}>Z z z</Text> : null}
          {line ? (
            <PressableScale onPress={() => speakChinese(line.hanzi, { force: true })} accessibilityRole="button" accessibilityLabel={`Bao dice ${line.hanzi}. Toca para oírlo`} containerStyle={styles.sayWrap}>
              <View style={[styles.say, { borderRadius: radius.md }]}>
                <Text style={[type.hanzi, { fontSize: 18, lineHeight: 24, color: '#1B1F2A' }]}>{line.hanzi} 🔊</Text>
                <Text style={[type.caption, { color: '#5B6275' }]}>
                  {line.pinyin} · {line.es}
                </Text>
              </View>
            </PressableScale>
          ) : null}
          <View style={{ width: baoSize, height: baoSize * FULL_RATIO }}>
            {mode === 'play' && game === 'hide' && hidden ? (
              <Text style={{ fontSize: 40, textAlign: 'center', marginTop: baoSize * 0.5 }}>❓</Text>
            ) : <BaoFull size={baoSize} action={asleep ? 'sleep' : action} mood={mood === 'sleep' ? 'idle' : mood} />}
            {mode === 'bath' && bath ? <BathSpots size={baoSize} onTap={onBathTap} done={bath.found} /> : null}
          </View>
        </View>

        {mode === 'home' ? (
          <>
            <Card>
              <View style={[styles.needs, { gap: spacing.sm }]}>
                {NEEDS.map((n) => (
                  <View key={n.key} style={styles.need} accessibilityLabel={`${n.label}: ${Math.round(pet.needs[n.key])} de 100`}>
                    <Text style={[type.caption, { color: c.textPrimary }]}>
                      {n.icon} {n.label}
                    </Text>
                    <View style={[styles.bar, { backgroundColor: c.surfaceSunken }]}>
                      <View style={{ width: `${pet.needs[n.key]}%`, height: '100%', borderRadius: 99, backgroundColor: n.color }} />
                    </View>
                  </View>
                ))}
              </View>
            </Card>
            <View style={[styles.row, { gap: 6 }]}>
              <ActButton icon="🍜" label="Comer" disabled={asleep} onPress={() => startFeed()} />
              <ActButton icon="🛁" label="Bañar" disabled={asleep} onPress={() => startBath()} />
              <ActButton icon="🎾" label="Jugar" disabled={asleep} onPress={() => startPlay()} />
              <ActButton icon={asleep ? '☀️' : '🌙'} label={asleep ? 'Despertar' : 'Dormir'} onPress={() => toggleSleep()} />
              <ActButton
                icon="💬"
                label="Hablar"
                disabled={asleep}
                onPress={() => {
                  update((p) => bump(p, { joy: 8 }));
                  router.push({ pathname: '/chat', params: { mode: 'pet' } });
                }}
              />
            </View>
            {asleep ? <SleepReview words={pet.words} /> : null}
            <Card>
              <PressableScale onPress={() => setShowWords((v) => !v)} accessibilityRole="button" accessibilityLabel="Palabras de la casa">
                <Text style={[type.title, { color: c.textPrimary }]}>
                  📒 Palabras de la casa ({pet.words.length}) {showWords ? '▾' : '▸'}
                </Text>
              </PressableScale>
              {showWords ? (
                pet.words.length ? (
                  [...pet.words].reverse().map((h) => {
                    const w = houseWord(h);
                    return w ? <WordRow key={h} w={w} /> : null;
                  })
                ) : (
                  <Text style={[type.body, { color: c.textSecondary, marginTop: spacing.xs }]}>Cuida a Bao y aquí irán las palabras que aprendas.</Text>
                )
              ) : null}
            </Card>
            <Text style={[type.caption, { color: c.textSecondary, textAlign: 'center' }]}>
              Cada lección te da 🥟 comida (2 si es perfecta). Bao nunca enferma: si lo descuidas, solo te echa de menos.
            </Text>
          </>
        ) : null}

        {mode === 'feed' ? FeedPanel() : null}
        {mode === 'bath' ? BathPanel() : null}
        {mode === 'play' ? PlayPanel() : null}
      </ScrollView>
    </SafeAreaView>
  );

  // ------------------------------------------------------------ Comer

  function startFeed() {
    if (pet.food <= 0) {
      say({ hanzi: '没有吃的了…', pinyin: 'méiyǒu chī de le', es: '¡No queda comida! Haz una lección para conseguir más.' }, 'encourage');
      return;
    }
    const options = pickN(FOODS, 4, Math.random);
    const target = options[Math.floor(Math.random() * options.length)]!;
    setFeed({ options, target, wrong: [] });
    setMode('feed');
    say(askFor(target), 'talking');
  }

  function FeedPanel() {
    if (!feed) return null;
    return (
      <View style={{ gap: spacing.sm }}>
        <Text style={[type.body, { color: c.textPrimary, textAlign: 'center' }]}>
          <Text style={{ fontFamily: 'Nunito_800ExtraBold' }}>Escucha</Text> qué quiere y dáselo:
        </Text>
        <View style={[styles.row, { gap: 6 }]}>
          {feed.options.map((f) => (
            <PressableScale
              key={f.hanzi}
              containerStyle={styles.flex}
              disabled={feed.done || feed.wrong.includes(f.hanzi)}
              accessibilityRole="button"
              accessibilityLabel={`${f.hanzi} ${f.pinyin}`}
              onPress={() => {
                if (f.hanzi === feed.target.hanzi) {
                  void feedback.correct();
                  setFeed({ ...feed, done: true });
                  update((p) => learn(bump({ ...p, food: Math.max(0, p.food - 1) }, { hunger: 30, joy: 5 }), f.hanzi));
                  play('eat', 2800);
                  setTimeout(() => say({ hanzi: '好吃！谢谢！', pinyin: 'hǎochī! xièxie!', es: `¡Qué rico! Gracias. (${f.hanzi} = ${f.es})` }, 'happy'), 2800);
                } else {
                  void feedback.wrong();
                  setFeed({ ...feed, wrong: [...feed.wrong, f.hanzi] });
                  say({ hanzi: `不是${f.hanzi}。${askFor(feed.target).hanzi}`, pinyin: `bú shì ${f.pinyin}`, es: `Eso es «${f.es}». Escucha otra vez.` }, 'encourage');
                }
              }}
            >
              <View
                style={[
                  styles.tile,
                  {
                    borderRadius: radius.md,
                    backgroundColor: feed.done && f.hanzi === feed.target.hanzi ? c.successSoft : c.surface,
                    borderColor: feed.done && f.hanzi === feed.target.hanzi ? c.success : feed.wrong.includes(f.hanzi) ? c.danger : c.border,
                    opacity: feed.wrong.includes(f.hanzi) ? 0.5 : 1,
                  },
                ]}
              >
                <Text style={{ fontSize: 28 }}>{f.icon}</Text>
                <Text style={[type.hanzi, { fontSize: 17, lineHeight: 22, color: c.textPrimary }]}>{f.hanzi}</Text>
                <Text style={[type.caption, { color: c.textSecondary, fontSize: 11 }]}>{f.pinyin}</Text>
              </View>
            </PressableScale>
          ))}
        </View>
        {feed.done ? (
          <View style={{ gap: spacing.xs }}>
            {pet.food > 0 ? <Button3D label={`Darle otra cosa (🥟 ${pet.food})`} onPress={startFeed} /> : null}
            <Button3D label="Volver" variant="ghost" onPress={backHome} />
          </View>
        ) : (
          <Button3D label="Volver" variant="ghost" onPress={backHome} />
        )}
      </View>
    );
  }

  // ------------------------------------------------------------ Baño

  function startBath() {
    const parts = pickN(BODY, 3, Math.random);
    setBath({ parts, step: 0, found: [] });
    setMode('bath');
    play('bath', 1600);
    askPart(parts[0]!);
  }

  function askPart(w: Word) {
    say({ hanzi: `洗洗${w.hanzi}！`, pinyin: `xǐxi ${w.pinyin}`, es: `¡Lávame ${w.es === 'ojos' ? 'los ojos' : `${['oreja', 'mano', 'barriga', 'cabeza', 'nariz', 'cola'].includes(w.es) ? 'la' : 'el'} ${w.es}`}!` }, 'talking');
  }

  function onBathTap(i: number) {
    if (!bath || bath.step >= bath.parts.length) return;
    const tapped = BODY[i]!;
    const want = bath.parts[bath.step]!;
    if (tapped.hanzi !== want.hanzi) {
      void feedback.wrong();
      say({ hanzi: `这是${tapped.hanzi}。`, pinyin: `zhè shì ${tapped.pinyin}`, es: `Eso es «${tapped.es}». Busca: ${want.hanzi}` }, 'encourage');
      setTimeout(() => askPart(want), 1800);
      return;
    }
    void feedback.correct();
    play('bath', 1400);
    const step = bath.step + 1;
    setBath({ ...bath, step, found: [...bath.found, want.hanzi] });
    update((p) => learn(bump(p, { clean: step >= bath.parts.length ? 100 : 15 }), want.hanzi));
    if (step >= bath.parts.length) {
      update((p) => bump(p, { joy: 5 }));
      setTimeout(() => say({ hanzi: '好干净！', pinyin: 'hǎo gānjìng', es: '¡Qué limpio estoy!' }, 'happy'), 1400);
    } else setTimeout(() => askPart(bath.parts[step]!), 1300);
  }

  function BathPanel() {
    if (!bath) return null;
    const finished = bath.step >= bath.parts.length;
    return (
      <View style={{ gap: spacing.sm }}>
        <Text style={[type.body, { color: c.textPrimary, textAlign: 'center' }]}>
          {finished ? '✨ ¡Bao está limpísimo!' : `Toca en Bao la parte que te dice (${bath.step + 1}/${bath.parts.length}). Los círculos 🫧 son las zonas.`}
        </Text>
        {bath.found.length ? (
          <Text style={[type.caption, { color: c.textSecondary, textAlign: 'center' }]}>
            {bath.found.map((h) => `${h} ${houseWord(h)?.pinyin ?? ''}`).join(' · ')}
          </Text>
        ) : null}
        <Button3D label={finished ? 'Terminar' : 'Volver'} variant={finished ? 'success' : 'ghost'} onPress={backHome} />
      </View>
    );
  }

  // ------------------------------------------------------------ Jugar

  function startPlay() {
    const g = gameOfDay(Math.floor(Date.now() / 86_400_000));
    setGame(g);
    setRound(0);
    setScore(0);
    setMode('play');
    nextRound(g, 0);
  }

  function nextRound(g: Game, r: number) {
    setCount(0);
    if (r >= 4) {
      update((p) => bump(p, { joy: 15, energy: -10 }));
      play('hop', 1400);
      setHidden(false);
      say({ hanzi: '真好玩！', pinyin: 'zhēn hǎowán', es: '¡Qué divertido!' }, 'happy');
      setRound(r);
      return;
    }
    setRound(r);
    if (g === 'numbers') {
      const n = NUMBERS[Math.floor(Math.random() * NUMBERS.length)]!;
      setTarget(n);
      say({ hanzi: `${n.hanzi}个球！`, pinyin: `${n.pinyin} ge qiú`, es: `¡${n.es[0]!.toUpperCase()}${n.es.slice(1)} pelotas!` });
    } else if (g === 'colors') {
      const opts = pickN(COLORS, 4, Math.random);
      const t = opts[Math.floor(Math.random() * opts.length)]!;
      setColorOpts(opts);
      setTarget(t);
      say({ hanzi: `${t.hanzi}的气球！`, pinyin: `${t.pinyin} de qìqiú`, es: 'Toca el globo de ese color.' });
    } else {
      const t = PLACES[Math.floor(Math.random() * PLACES.length)]!;
      setTarget(t);
      setHidden(true);
      say({ hanzi: `我在${t.hanzi}。`, pinyin: `wǒ zài ${t.pinyin}`, es: '¿Dónde estoy? ¡Búscame!' });
    }
  }

  function hit(ok: boolean, w: Word) {
    if (ok) {
      void feedback.correct();
      setScore((s) => s + 1);
      update((p) => learn(bump(p, { joy: 6 }), w.hanzi));
      setHidden(false);
      play('hop', 1200);
      setTimeout(() => nextRound(game, round + 1), 1300);
    } else {
      void feedback.wrong();
      say({ hanzi: '不对，再试试！', pinyin: 'bú duì, zài shìshi', es: 'No, ¡prueba otra vez!' }, 'encourage');
      setTimeout(() => speakChinese(target?.hanzi ?? '', { force: true }), 1600);
    }
  }

  function PlayPanel() {
    const finished = round >= 4;
    if (finished) {
      return (
        <View style={{ gap: spacing.sm }}>
          <Text style={[type.title, { color: c.textPrimary, textAlign: 'center' }]}>🎉 {score}/4 · 💛 Bao está contento</Text>
          <Button3D label="Volver" variant="success" onPress={backHome} />
        </View>
      );
    }
    return (
      <View style={{ gap: spacing.sm }}>
        <Text style={[type.caption, { color: c.textSecondary, textAlign: 'center' }]}>
          {game === 'numbers' ? '🎾 Lanza tantas pelotas como dice Bao' : game === 'colors' ? '🎈 Toca el globo del color que dice Bao' : '🙈 ¿Dónde se ha escondido Bao?'} · {round + 1}/4
        </Text>
        {game === 'numbers' && target ? (
          <View style={{ gap: spacing.xs, alignItems: 'center' }}>
            <Text style={{ fontSize: 30, minHeight: 40 }}>{'🎾'.repeat(count)}</Text>
            <View style={[styles.row, { gap: spacing.sm }]}>
              <Button3D label="🎾 +1" variant="ghost" onPress={() => setCount((x) => Math.min(9, x + 1))} />
              <Button3D label="↺" variant="ghost" onPress={() => setCount(0)} />
              <Button3D label="¡Lanzar!" disabled={!count} onPress={() => hit(count === Number(target.icon), target)} />
            </View>
          </View>
        ) : null}
        {game === 'colors' && target ? (
          <View style={[styles.row, { gap: 6, justifyContent: 'center' }]}>
            {colorOpts.map((col) => (
              <PressableScale key={col.hanzi} onPress={() => hit(col.hanzi === target.hanzi, target)} accessibilityRole="button" accessibilityLabel={`Globo ${col.es}`}>
                <View style={[styles.balloon, { backgroundColor: col.color, borderColor: c.border }]} />
              </PressableScale>
            ))}
          </View>
        ) : null}
        {game === 'hide' && target ? (
          <View style={[styles.row, { gap: 6, flexWrap: 'wrap', justifyContent: 'center' }]}>
            {PLACES.map((p) => (
              <PressableScale key={p.hanzi} onPress={() => hit(p.hanzi === target.hanzi, target)} accessibilityRole="button" accessibilityLabel={p.es}>
                <View style={[styles.place, { borderColor: c.border, backgroundColor: c.surface, borderRadius: radius.md }]}>
                  <Text style={{ fontSize: 28 }}>{p.icon}</Text>
                  <Text style={[type.caption, { color: c.textSecondary }]}>{p.es}</Text>
                </View>
              </PressableScale>
            ))}
          </View>
        ) : null}
        <Button3D label="Volver" variant="ghost" onPress={backHome} />
      </View>
    );
  }

  // ------------------------------------------------------------ Dormir

  function toggleSleep() {
    if (asleep) {
      const slept = (Date.now() - (pet.sleepingSince ?? Date.now())) / 3_600_000;
      update((p) => ({ ...p, sleepingSince: null }));
      setAction('idle');
      say(slept < 1 && pet.needs.energy < 60 ? { hanzi: '我还想睡…', pinyin: 'wǒ hái xiǎng shuì', es: 'Aún quiero dormir… ¡pero vale!' } : { hanzi: '早上好！', pinyin: 'zǎoshang hǎo', es: '¡Buenos días! He dormido muy bien.' }, 'happy');
      play('wave');
    } else {
      update((p) => ({ ...p, sleepingSince: Date.now() }));
      setAction('sleep');
      say({ hanzi: '晚安！明天见。', pinyin: "wǎn'ān! míngtiān jiàn", es: '¡Buenas noches! Hasta mañana.' }, 'sleep');
    }
  }
}

function ActButton({ icon, label, onPress, disabled }: { icon: string; label: string; onPress: () => void; disabled?: boolean }) {
  const { c, type, radius } = useTheme();
  return (
    <PressableScale onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label} containerStyle={styles.flex}>
      <View style={[styles.act, { borderRadius: radius.md, borderColor: c.border, backgroundColor: c.surface, opacity: disabled ? 0.45 : 1 }]}>
        <Text style={{ fontSize: 24 }}>{icon}</Text>
        <Text style={[type.caption, { color: c.textPrimary, fontSize: 11 }]}>{label}</Text>
      </View>
    </PressableScale>
  );
}

function WordRow({ w }: { w: Word }) {
  const { c, type, spacing } = useTheme();
  return (
    <PressableScale onPress={() => speakChinese(w.hanzi, { force: true })} accessibilityRole="button" accessibilityLabel={`${w.hanzi}, ${w.es}. Toca para oírlo`}>
      <View style={[styles.row, { gap: spacing.sm, marginTop: spacing.xs }]}>
        <Text style={{ fontSize: 22 }}>{w.icon}</Text>
        <Text style={[type.hanzi, { fontSize: 20, lineHeight: 26, color: c.textPrimary }]}>{w.hanzi}</Text>
        <Text style={[type.caption, { color: c.textSecondary, flex: 1 }]}>
          {w.pinyin} · {w.es}
        </Text>
        <Text>🔊</Text>
      </View>
    </PressableScale>
  );
}

function SleepReview({ words }: { words: string[] }) {
  const { c, type } = useTheme();
  const last = words.slice(-3).reverse().map(houseWord).filter((w): w is Word => !!w);
  return (
    <Card>
      <Text style={[type.title, { color: c.textPrimary }]}>🌙 Antes de dormir: las palabras de hoy</Text>
      {last.length ? last.map((w) => <WordRow key={w.hanzi} w={w} />) : <Text style={[type.body, { color: c.textSecondary }]}>Hoy aún no habéis aprendido palabras en casa.</Text>}
      <Text style={[type.caption, { color: c.textSecondary, marginTop: 6 }]}>Mientras duerme recupera energía. Despiértalo cuando quieras.</Text>
    </Card>
  );
}

function BathSpots({ size, onTap, done }: { size: number; onTap: (i: number) => void; done: string[] }) {
  const { type } = useTheme();
  const h = size * FULL_RATIO;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {BODY.map((b, i) => {
        const found = done.includes(b.hanzi);
        return (
          <PressableScale
            key={b.hanzi}
            onPress={() => onTap(i)}
            accessibilityRole="button"
            accessibilityLabel={found ? `${b.hanzi} ${b.pinyin}` : 'Zona para lavar'}
            containerStyle={{ position: 'absolute', left: b.x * size - 17, top: b.y * h - 17 }}
          >
            <View style={[styles.spot, found && styles.spotFound]}>
              {found ? <Text style={[type.caption, { fontSize: 10, color: '#1C7FBF' }]}>{b.hanzi}</Text> : <Text style={{ fontSize: 12 }}>🫧</Text>}
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  room: { height: 290, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 10, overflow: 'hidden' },
  wall: { position: 'absolute', left: 0, right: 0, top: 0, height: '62%' },
  window: { position: 'absolute', top: 14, left: 14, width: 58, height: 48, borderRadius: 8, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  plant: { position: 'absolute', right: 16, bottom: 96, fontSize: 34 },
  zz: { position: 'absolute', top: 90, right: '28%', fontSize: 22, fontWeight: '900' },
  sayWrap: { position: 'absolute', top: 12, right: 12, maxWidth: '68%' },
  say: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#DCDFE8', paddingHorizontal: 10, paddingVertical: 6 },
  needs: { flexDirection: 'row', flexWrap: 'wrap' },
  need: { width: '47%', gap: 4 },
  bar: { height: 10, borderRadius: 99, overflow: 'hidden' },
  act: { alignItems: 'center', paddingVertical: 8, borderWidth: 2, borderBottomWidth: 4 },
  tile: { alignItems: 'center', paddingVertical: 8, borderWidth: 2, borderBottomWidth: 4 },
  balloon: { width: 54, height: 66, borderRadius: 30, borderWidth: 2 },
  place: { alignItems: 'center', padding: 8, borderWidth: 2, borderBottomWidth: 4, width: 92 },
  spot: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: 'rgba(43,166,240,0.55)', backgroundColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center' },
  spotFound: { backgroundColor: '#FFFFFF', borderColor: '#2BA6F0' },
});
