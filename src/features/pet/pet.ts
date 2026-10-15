/**
 * Casa de Bao (mascota tipo Tamagotchi). Lógica pura: necesidades que bajan con
 * el tiempo, cuidados que las suben y el vocabulario de cada actividad.
 * Bao nunca enferma ni muere: como mucho se pone triste y te echa de menos.
 */

export type Need = 'hunger' | 'clean' | 'energy' | 'joy';

export interface Needs {
  /** 0..100 (100 = lleno / limpio / descansado / contento). */
  hunger: number;
  clean: number;
  energy: number;
  joy: number;
}

export interface PetState {
  needs: Needs;
  updatedAt: number;
  /** Si duerme, desde cuándo. */
  sleepingSince: number | null;
  /** Comida en la despensa (se gana con lecciones). */
  food: number;
  /** Palabras aprendidas en casa (hanzi), la última al final. */
  words: string[];
}

export interface Word {
  hanzi: string;
  pinyin: string;
  es: string;
  icon: string;
}

export const MIN_NEED = 5;
const HOUR = 3_600_000;
/** Puntos que pierde cada necesidad por hora despierto. */
const DECAY: Needs = { hunger: 4, clean: 3, energy: 2.5, joy: 3 };
/** Energía que recupera por hora durmiendo. */
const SLEEP_GAIN = 15;

export const freshPet = (now: number): PetState => ({
  needs: { hunger: 70, clean: 80, energy: 80, joy: 75 },
  updatedAt: now,
  sleepingSince: null,
  food: 3,
  words: [],
});

const clamp = (v: number) => Math.max(MIN_NEED, Math.min(100, v));

/** Aplica el paso del tiempo (también con la app cerrada). Durmiendo solo sube la energía y lo demás baja a la mitad. */
export function tick(s: PetState, now: number): PetState {
  const hours = Math.max(0, (now - s.updatedAt) / HOUR);
  if (hours <= 0) return s;
  const asleep = s.sleepingSince !== null;
  const slow = asleep ? 0.5 : 1;
  const needs: Needs = {
    hunger: clamp(s.needs.hunger - DECAY.hunger * hours * slow),
    clean: clamp(s.needs.clean - DECAY.clean * hours * slow),
    energy: clamp(asleep ? s.needs.energy + SLEEP_GAIN * hours : s.needs.energy - DECAY.energy * hours),
    joy: clamp(s.needs.joy - DECAY.joy * hours * slow),
  };
  return { ...s, needs, updatedAt: now };
}

export const bump = (s: PetState, changes: Partial<Needs>): PetState => ({
  ...s,
  needs: {
    hunger: clamp(s.needs.hunger + (changes.hunger ?? 0)),
    clean: clamp(s.needs.clean + (changes.clean ?? 0)),
    energy: clamp(s.needs.energy + (changes.energy ?? 0)),
    joy: clamp(s.needs.joy + (changes.joy ?? 0)),
  },
});

export const learn = (s: PetState, hanzi: string): PetState => ({ ...s, words: [...s.words.filter((w) => w !== hanzi), hanzi].slice(-60) });

/** Lo que más necesita Bao ahora (o null si está bien). */
export function lowestNeed(n: Needs): Need | null {
  const [need, value] = (Object.entries(n) as [Need, number][]).sort((a, b) => a[1] - b[1])[0]!;
  return value < 45 ? need : null;
}

/** Qué dice Bao al entrar en casa según cómo está. */
export function moodLine(s: PetState, hour: number): { hanzi: string; pinyin: string; es: string; mood: 'happy' | 'encourage' | 'talking' | 'sleep' } {
  if (s.sleepingSince !== null) return { hanzi: 'Zzz… 呼…', pinyin: 'hū', es: 'Bao está durmiendo.', mood: 'sleep' };
  const avg = (s.needs.hunger + s.needs.clean + s.needs.energy + s.needs.joy) / 4;
  if (avg < 25) return { hanzi: '我想你了。', pinyin: 'wǒ xiǎng nǐ le', es: 'Te he echado de menos…', mood: 'encourage' };
  switch (lowestNeed(s.needs)) {
    case 'hunger':
      return { hanzi: '我饿了！', pinyin: 'wǒ è le', es: '¡Tengo hambre!', mood: 'encourage' };
    case 'clean':
      return { hanzi: '我要洗澡。', pinyin: 'wǒ yào xǐzǎo', es: 'Quiero bañarme.', mood: 'talking' };
    case 'energy':
      return hour >= 20 || hour < 7
        ? { hanzi: '我困了。', pinyin: 'wǒ kùn le', es: 'Tengo sueño.', mood: 'encourage' }
        : { hanzi: '我好累。', pinyin: 'wǒ hǎo lèi', es: 'Estoy muy cansado.', mood: 'encourage' };
    case 'joy':
      return { hanzi: '我们玩吧！', pinyin: 'wǒmen wán ba', es: '¡Vamos a jugar!', mood: 'talking' };
    default:
      return { hanzi: '我很开心！', pinyin: 'wǒ hěn kāixīn', es: '¡Estoy muy contento!', mood: 'happy' };
  }
}

// ---------------------------------------------------------------- Vocabulario de la casa

export const FOODS: (Word & { drink?: boolean })[] = [
  { hanzi: '竹子', pinyin: 'zhúzi', es: 'bambú', icon: '🎋' },
  { hanzi: '包子', pinyin: 'bāozi', es: 'bollo al vapor', icon: '🥟' },
  { hanzi: '苹果', pinyin: 'píngguǒ', es: 'manzana', icon: '🍎' },
  { hanzi: '面条', pinyin: 'miàntiáo', es: 'fideos', icon: '🍜' },
  { hanzi: '米饭', pinyin: 'mǐfàn', es: 'arroz', icon: '🍚' },
  { hanzi: '鸡蛋', pinyin: 'jīdàn', es: 'huevo', icon: '🥚' },
  { hanzi: '水果', pinyin: 'shuǐguǒ', es: 'fruta', icon: '🍇' },
  { hanzi: '水', pinyin: 'shuǐ', es: 'agua', icon: '💧', drink: true },
  { hanzi: '茶', pinyin: 'chá', es: 'té', icon: '🍵', drink: true },
  { hanzi: '牛奶', pinyin: 'niúnǎi', es: 'leche', icon: '🥛', drink: true },
];

/** Partes del cuerpo y dónde están en el dibujo de cuerpo entero (fracción del ancho/alto). */
export const BODY: (Word & { x: number; y: number })[] = [
  { hanzi: '头', pinyin: 'tóu', es: 'cabeza', icon: '🙂', x: 0.5, y: 0.17 },
  { hanzi: '耳朵', pinyin: 'ěrduo', es: 'oreja', icon: '👂', x: 0.21, y: 0.11 },
  { hanzi: '眼睛', pinyin: 'yǎnjing', es: 'ojos', icon: '👀', x: 0.35, y: 0.36 },
  { hanzi: '鼻子', pinyin: 'bízi', es: 'nariz', icon: '👃', x: 0.5, y: 0.46 },
  { hanzi: '手', pinyin: 'shǒu', es: 'mano', icon: '✋', x: 0.74, y: 0.79 },
  { hanzi: '肚子', pinyin: 'dùzi', es: 'barriga', icon: '🫃', x: 0.5, y: 0.79 },
  { hanzi: '脚', pinyin: 'jiǎo', es: 'pie', icon: '🦶', x: 0.4, y: 0.95 },
  { hanzi: '尾巴', pinyin: 'wěiba', es: 'cola', icon: '🦝', x: 0.9, y: 0.6 },
];

export const NUMBERS: Word[] = ['一 yī uno', '二 èr dos', '三 sān tres', '四 sì cuatro', '五 wǔ cinco'].map((s, i) => {
  const [hanzi, pinyin, es] = s.split(' ') as [string, string, string];
  return { hanzi, pinyin, es, icon: String(i + 1) };
});

export const COLORS: (Word & { color: string })[] = [
  { hanzi: '红色', pinyin: 'hóngsè', es: 'rojo', icon: '🔴', color: '#E8453C' },
  { hanzi: '蓝色', pinyin: 'lánsè', es: 'azul', icon: '🔵', color: '#2BA6F0' },
  { hanzi: '绿色', pinyin: 'lǜsè', es: 'verde', icon: '🟢', color: '#3CCB6F' },
  { hanzi: '黄色', pinyin: 'huángsè', es: 'amarillo', icon: '🟡', color: '#FFC21A' },
  { hanzi: '白色', pinyin: 'báisè', es: 'blanco', icon: '⚪', color: '#FFFFFF' },
  { hanzi: '黑色', pinyin: 'hēisè', es: 'negro', icon: '⚫', color: '#1B1F2A' },
];

export const PLACES: Word[] = [
  { hanzi: '桌子下面', pinyin: 'zhuōzi xiàmiàn', es: 'debajo de la mesa', icon: '🪑' },
  { hanzi: '床上', pinyin: 'chuáng shang', es: 'encima de la cama', icon: '🛏️' },
  { hanzi: '门后面', pinyin: 'mén hòumiàn', es: 'detrás de la puerta', icon: '🚪' },
  { hanzi: '箱子里', pinyin: 'xiāngzi li', es: 'dentro de la caja', icon: '📦' },
];

export type Game = 'numbers' | 'colors' | 'hide';
/** El juego cambia cada día. */
export const gameOfDay = (day: number): Game => (['numbers', 'colors', 'hide'] as const)[day % 3]!;

/** Todas las palabras de la casa, para la lista «Palabras de la casa». */
export const HOUSE_WORDS: Word[] = [...FOODS, ...BODY, ...NUMBERS, ...COLORS, ...PLACES];
export const houseWord = (hanzi: string) => HOUSE_WORDS.find((w) => w.hanzi === hanzi);

/** Elige `n` elementos distintos al azar. */
export function pickN<T>(list: T[], n: number, rng: () => number): T[] {
  const copy = [...list];
  const out: T[] = [];
  while (out.length < n && copy.length) out.push(copy.splice(Math.floor(rng() * copy.length), 1)[0]!);
  return out;
}

/** Frase con la que Bao pide comida o bebida. */
export const askFor = (f: (typeof FOODS)[number]) => ({ hanzi: `我想${f.drink ? '喝' : '吃'}${f.hanzi}。`, pinyin: `wǒ xiǎng ${f.drink ? 'hē' : 'chī'} ${f.pinyin}`, es: `Quiero ${f.drink ? 'beber' : 'comer'} ${f.es}.` });
