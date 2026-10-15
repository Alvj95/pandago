/**
 * Simulacro HSK: genera un examen con el formato de HSK 1 / HSK 2 (comprensión
 * auditiva + lectura) a partir del vocabulario, las frases y las historias del
 * curso. Las «fotos» del examen oficial son emojis. Lógica pura.
 */
import type { HskLevel, SampleSentence, VocabItem } from '@/data/hsk/types';
import type { Story } from '@/data/stories';
import { type Rng, sample, shuffle } from '@/features/lesson/engine/random';

/** Palabras que se pueden «fotografiar» con un emoji (sin secuencias compuestas, que algunos móviles parten). */
export const PICTURES: Record<string, string> = {
  苹果: '🍎', 猫: '🐱', 狗: '🐶', 飞机: '✈️', 出租车: '🚕', 医院: '🏥', 茶: '🍵', 米饭: '🍚', 书: '📖', 电脑: '💻', 电视: '📺', 电影: '🎬',
  水: '💧', 衣服: '👕', 椅子: '🪑', 杯子: '🥤', 下雨: '🌧️', 热: '🥵', 冷: '🥶', 睡觉: '😴', 唱歌: '🎤', 跳舞: '💃', 游泳: '🏊', 跑步: '🏃',
  打篮球: '🏀', 鱼: '🐟', 鸡蛋: '🥚', 牛奶: '🥛', 咖啡: '☕', 西瓜: '🍉', 羊肉: '🍖', 手机: '📱', 手表: '⌚', 自行车: '🚲', 公共汽车: '🚌',
  船: '🚢', 火车站: '🚉', 机场: '🛫', 药: '💊', 生日: '🎂', 雪: '❄️', 晴: '☀️', 阴: '☁️', 眼睛: '👀', 笑: '😄', 门: '🚪', 报纸: '📰',
  票: '🎫', 水果: '🍇', 菜: '🥬', 商店: '🏪', 学校: '🏫', 家: '🏠', 钱: '💰', 写: '✍️', 听: '👂', 打电话: '📞', 学生: '🎒',
  吃: '🍜', 喝: '🧃', 月: '🌙', 考试: '📝', 工作: '💼', 旅游: '🧳', 洗: '🧼', 休息: '🛋️', 孩子: '👶', 男人: '👨', 女人: '👩', 朋友: '🤝',
  早上: '🌅', 晚上: '🌃', 生病: '🤒', 起床: '⏰', 运动: '🏋️', 踢: '⚽', 玩: '🧸', 天气: '🌤️', 红: '🔴', 白: '⚪', 黑: '⚫',
};

export type Section = 'listening' | 'reading';
export type QType = 'listen_tf' | 'listen_pick' | 'listen_reply' | 'read_tf' | 'read_pick' | 'read_reply' | 'read_gap';

export interface ExamOption {
  label: string;
  sub?: string;
  emoji?: string;
}

export interface ExamQuestion {
  section: Section;
  type: QType;
  /** Instrucción en español. */
  instruction: string;
  /** Lo que se escucha (sección de audición). */
  speak?: string;
  /** Texto en chino que se lee (sección de lectura). */
  text?: string;
  pinyin?: string;
  emoji?: string;
  options: ExamOption[];
  answer: number;
  /** Solución explicada (se muestra en la corrección). */
  explain: string;
}

export interface ExamSpec {
  level: HskLevel;
  /** Preguntas por sección. */
  perSection: number;
  minutes: number;
}

export const EXAMS: Record<'hsk1-short' | 'hsk1' | 'hsk2-short' | 'hsk2', ExamSpec & { title: string; desc: string }> = {
  'hsk1-short': { level: 1, perSection: 10, minutes: 12, title: 'HSK 1 · corto', desc: '20 preguntas · 12 minutos' },
  hsk1: { level: 1, perSection: 20, minutes: 35, title: 'HSK 1 · completo', desc: '40 preguntas · 35 minutos, como el examen real' },
  'hsk2-short': { level: 2, perSection: 10, minutes: 12, title: 'HSK 2 · corto', desc: '20 preguntas · 12 minutos' },
  hsk2: { level: 2, perSection: 25, minutes: 45, title: 'HSK 2 · completo', desc: '50 preguntas · 45 minutos' },
};

/** Puntuación como en el HSK oficial: 100 por sección, 200 en total; se aprueba con 120. */
export const PASS_SCORE = 120;

const TF: ExamOption[] = [{ label: '✔', sub: 'Sí, coincide' }, { label: '✘', sub: 'No coincide' }];

interface Ctx {
  vocab: VocabItem[];
  sentences: SampleSentence[];
  stories: Story[];
}

const hanziOf = (s: SampleSentence) => s.tokens.join('');

/** Parejas pregunta → respuesta sacadas de las historias (línea con «？» y la siguiente). */
export function replyPairs(stories: Story[]) {
  return stories.flatMap((st) =>
    st.lines.flatMap((l, i) => {
      const next = st.lines[i + 1];
      return /？/.test(l.hanzi) && next && next.who !== l.who ? [{ q: l, a: next }] : [];
    }),
  );
}

export function buildExam(spec: ExamSpec, ctx: Ctx, rng: Rng): ExamQuestion[] {
  const vocab = ctx.vocab.filter((v) => v.level <= spec.level);
  const levelIds = new Set(vocab.map((v) => v.id));
  const pictured = vocab.filter((v) => PICTURES[v.hanzi]);
  const sentences = ctx.sentences.filter((s) => s.itemIds.every((id) => levelIds.has(id)));
  const pictSentences = sentences
    .map((s) => ({ s, word: pictured.find((v) => s.tokens.includes(v.hanzi)) }))
    .filter((x): x is { s: SampleSentence; word: VocabItem } => !!x.word);
  const pairs = replyPairs(spec.level === 1 ? ctx.stories.slice(0, 8) : ctx.stories);
  const byHanzi = new Map(ctx.vocab.map((v) => [v.hanzi, v]));

  const otherPics = (w: VocabItem, n: number) => sample(pictured.filter((v) => PICTURES[v.hanzi] !== PICTURES[w.hanzi]), n, rng);
  const picOptions = (w: VocabItem): { options: ExamOption[]; answer: number } => {
    const opts = shuffle([w, ...otherPics(w, 2)], rng);
    return { options: opts.map((v) => ({ label: PICTURES[v.hanzi] ?? '', emoji: PICTURES[v.hanzi] })), answer: opts.indexOf(w) };
  };
  const tf = (w: VocabItem) => {
    const truthful = rng() < 0.5;
    const shown = truthful ? w : (otherPics(w, 1)[0] ?? w);
    return { emoji: PICTURES[shown.hanzi], answer: shown === w ? 0 : 1 };
  };
  const replyQ = (section: Section): ExamQuestion | null => {
    const pick = sample(pairs, 3, rng);
    const [right] = pick;
    if (!right) return null;
    const opts = shuffle(pick.map((p) => p.a), rng);
    return {
      section, type: section === 'listening' ? 'listen_reply' : 'read_reply',
      instruction: section === 'listening' ? 'Escucha la pregunta y elige la respuesta adecuada' : 'Lee la pregunta y elige la respuesta adecuada',
      speak: section === 'listening' ? right.q.hanzi : undefined,
      text: section === 'reading' ? right.q.hanzi : undefined,
      pinyin: section === 'reading' ? right.q.pinyin : undefined,
      options: opts.map((o) => ({ label: o.hanzi, sub: o.pinyin })),
      answer: opts.indexOf(right.a),
      explain: `${right.q.hanzi} (${right.q.es}) → ${right.a.hanzi} (${right.a.es})`,
    };
  };
  const gapQ = (): ExamQuestion | null => {
    const s = sample(sentences.filter((x) => x.tokens.length >= 3), 1, rng)[0];
    if (!s) return null;
    const answer = s.tokens.map((t) => byHanzi.get(t)).find((v) => v && levelIds.has(v.id) && v.hanzi.length <= 2);
    if (!answer) return null;
    const opts = shuffle([answer, ...sample(vocab.filter((v) => v.hanzi !== answer.hanzi && v.hanzi.length === answer.hanzi.length), 2, rng)], rng);
    return {
      section: 'reading', type: 'read_gap', instruction: 'Elige la palabra que falta',
      text: s.tokens.map((t) => (t === answer.hanzi ? '（　　）' : t)).join(''),
      options: opts.map((o) => ({ label: o.hanzi, sub: o.pinyin })),
      answer: opts.indexOf(answer),
      explain: `${hanziOf(s)} · ${s.pinyin} — ${s.meaning}`,
    };
  };

  // Cada sección se reparte en 4 partes, como el examen real.
  const part = (n: number, i: number) => Math.floor(n / 4) + (i < n % 4 ? 1 : 0);
  const N = spec.perSection;
  const listening: (ExamQuestion | null)[] = [
    ...sample(pictured, part(N, 0), rng).map((w): ExamQuestion => {
      const t = tf(w);
      return { section: 'listening', type: 'listen_tf', instruction: 'Escucha: ¿coincide con la imagen?', speak: w.hanzi, emoji: t.emoji, options: TF, answer: t.answer, explain: `${w.hanzi} (${w.pinyin}) = ${w.meaning} ${PICTURES[w.hanzi]}` };
    }),
    ...sample(pictSentences, part(N, 1), rng).map(({ s, word }): ExamQuestion => ({
      section: 'listening', type: 'listen_pick', instruction: 'Escucha y elige la imagen', speak: hanziOf(s), ...picOptions(word),
      explain: `${hanziOf(s)} · ${s.pinyin} — ${s.meaning}`,
    })),
    ...Array.from({ length: part(N, 2) + part(N, 3) }, () => replyQ('listening')),
  ];
  const reading: (ExamQuestion | null)[] = [
    ...sample(pictured, part(N, 0), rng).map((w): ExamQuestion => {
      const t = tf(w);
      return { section: 'reading', type: 'read_tf', instruction: '¿La palabra coincide con la imagen?', text: w.hanzi, pinyin: w.pinyin, emoji: t.emoji, options: TF, answer: t.answer, explain: `${w.hanzi} (${w.pinyin}) = ${w.meaning} ${PICTURES[w.hanzi]}` };
    }),
    ...sample(pictSentences, part(N, 1), rng).map(({ s, word }): ExamQuestion => ({
      section: 'reading', type: 'read_pick', instruction: 'Lee la frase y elige la imagen', text: hanziOf(s), pinyin: s.pinyin, ...picOptions(word),
      explain: `${hanziOf(s)} — ${s.meaning}`,
    })),
    ...Array.from({ length: part(N, 2) }, () => replyQ('reading')),
    ...Array.from({ length: part(N, 3) }, () => gapQ()),
  ];
  return [...listening, ...reading].filter((q): q is ExamQuestion => !!q);
}

export interface ExamResult {
  listening: number;
  reading: number;
  total: number;
  passed: boolean;
  /** Aciertos por tipo de pregunta, para decir qué repasar. */
  byType: Partial<Record<QType, { right: number; total: number }>>;
}

export function scoreExam(questions: ExamQuestion[], answers: (number | undefined)[]): ExamResult {
  const sec = (s: Section) => {
    const qs = questions.map((q, i) => ({ q, a: answers[i] })).filter((x) => x.q.section === s);
    return qs.length ? Math.round((qs.filter((x) => x.a === x.q.answer).length / qs.length) * 100) : 0;
  };
  const byType: ExamResult['byType'] = {};
  questions.forEach((q, i) => {
    const t = byType[q.type] ?? { right: 0, total: 0 };
    byType[q.type] = { right: t.right + (answers[i] === q.answer ? 1 : 0), total: t.total + 1 };
  });
  const listening = sec('listening');
  const reading = sec('reading');
  return { listening, reading, total: listening + reading, passed: listening + reading >= PASS_SCORE, byType };
}

export const TYPE_LABEL: Record<QType, string> = {
  listen_tf: 'Escuchar una palabra',
  listen_pick: 'Escuchar frases',
  listen_reply: 'Escuchar preguntas',
  read_tf: 'Leer palabras',
  read_pick: 'Leer frases',
  read_reply: 'Preguntas y respuestas',
  read_gap: 'Completar huecos',
};
