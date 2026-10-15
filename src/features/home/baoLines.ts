/**
 * Bao vivo en el inicio: lo que dice al tocarlo, según la hora, la racha, la
 * meta del día, los repasos pendientes y el progreso. Funciona sin internet.
 */
export interface BaoLine {
  message: string;
  hanzi?: string;
  pinyin?: string;
  mood: 'talking' | 'happy' | 'encourage';
  action?: { label: string; route: '/review' | '/challenge' | '/chest/daily' | '/call' | '/pronunciation' };
}

export interface BaoFacts {
  hour: number;
  /** Día del año: rota las curiosidades. */
  day: number;
  streakDays: number;
  xpToday: number;
  dailyGoalXp: number;
  dueCount: number;
  pendingChests: number;
  hearts: number;
  maxHearts: number;
  wordsPracticed: number;
}

const FUN_FACTS: { hanzi: string; pinyin: string; message: string }[] = [
  { hanzi: '熊猫', pinyin: 'xióngmāo', message: '¿Sabías que 熊猫 (panda) es literalmente «oso-gato»? 🐻🐱' },
  { hanzi: '电脑', pinyin: 'diànnǎo', message: 'Ordenador en chino es 电脑: «cerebro eléctrico». ⚡🧠' },
  { hanzi: '火车', pinyin: 'huǒchē', message: 'El tren es 火车: «coche de fuego», por las antiguas locomotoras de vapor. 🚂' },
  { hanzi: '手机', pinyin: 'shǒujī', message: 'Móvil es 手机: «máquina de mano». 📱' },
  { hanzi: '东西', pinyin: 'dōngxi', message: '东西 (este + oeste) significa «cosa». ¡Las cosas vienen de todas partes!' },
  { hanzi: '马上', pinyin: 'mǎshàng', message: '马上 es «sobre el caballo» y significa «enseguida». 🐎' },
  { hanzi: '中国', pinyin: 'Zhōngguó', message: 'China es 中国: «el país del centro». 🇨🇳' },
  { hanzi: '你好', pinyin: 'ní hǎo', message: 'Truco: dos 3.er tonos seguidos → el primero se dice como 2.º. Por eso 你好 suena «ní hǎo».' },
];

export function greeting(hour: number): { hanzi: string; pinyin: string; es: string } {
  if (hour >= 5 && hour < 12) return { hanzi: '早上好！', pinyin: 'zǎoshang hǎo', es: '¡Buenos días!' };
  if (hour >= 12 && hour < 19) return { hanzi: '下午好！', pinyin: 'xiàwǔ hǎo', es: '¡Buenas tardes!' };
  return { hanzi: '晚上好！', pinyin: 'wǎnshang hǎo', es: '¡Buenas noches!' };
}

/** Frases de Bao en orden: la primera es el saludo; al tocarlo pasa a la siguiente. */
export function baoLines(f: BaoFacts): BaoLine[] {
  const g = greeting(f.hour);
  const lines: BaoLine[] = [];
  const left = Math.max(0, f.dailyGoalXp - f.xpToday);
  lines.push({
    hanzi: g.hanzi,
    pinyin: g.pinyin,
    mood: 'happy',
    message:
      f.streakDays > 0
        ? `${g.es} Llevas ${f.streakDays} ${f.streakDays === 1 ? 'día' : 'días'} de racha 🔥${left ? ` ¿${f.hour >= 21 ? 'Una lección antes de dormir' : 'Seguimos'}?` : ''}`
        : `${g.es} ¿Empezamos hoy una racha? 🔥`,
  });
  if (f.pendingChests > 0) lines.push({ mood: 'happy', message: `¡Tienes ${f.pendingChests === 1 ? 'un cofre' : `${f.pendingChests} cofres`} sin abrir! 🎁`, action: { label: 'Abrir', route: '/chest/daily' } });
  lines.push(
    left
      ? { mood: 'talking', message: `Te faltan ${left} XP para la meta de hoy. ¡Tú puedes! 💪` }
      : { mood: 'happy', message: '¡Meta de hoy cumplida! 🎉 Todo lo que hagas ahora es extra.' },
  );
  if (f.dueCount > 0) lines.push({ mood: 'talking', message: `${f.dueCount} ${f.dueCount === 1 ? 'palabra está' : 'palabras están'} a punto de olvidarse. ¿Las repasamos?`, action: { label: 'Repasar', route: '/review' } });
  if (f.hearts < f.maxHearts) lines.push({ mood: 'encourage', message: `Te quedan ${f.hearts} ❤️. Un reto rápido te devuelve una vida.`, action: { label: 'Reto', route: '/challenge' } });
  if (f.wordsPracticed >= 10) lines.push({ mood: 'happy', message: `¡Ya has practicado ${f.wordsPracticed} palabras conmigo! 🎋` });
  const fact = FUN_FACTS[f.day % FUN_FACTS.length]!;
  lines.push({ mood: 'talking', ...fact });
  lines.push({ mood: 'talking', message: '¿Me llamas? Hablamos solo con la voz, como por teléfono. 📞', hanzi: '我们聊天吧！', pinyin: 'wǒmen liáotiān ba', action: { label: 'Llamar', route: '/call' } });
  lines.push({ mood: 'talking', message: 'Repite frases y te digo qué sílabas suenan bien: 🟢🟡🔴', action: { label: 'Probar', route: '/pronunciation' } });
  return lines;
}
