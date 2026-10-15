import { UNITS } from '@/data/hsk/course';
import type { Scenario } from './engine/contract';
import { moodLine, type PetState } from '@/features/pet/pet';

const ids = (...hanzi: string[]) => hanzi.map((h) => `h1-${h}`);

/** Escenario libre con Bao (también se abre desde la Home sin nodo concreto). */
export const FREE_TALK: Scenario = {
  id: 'free-bao',
  title: 'Charla con Bao',
  goal: 'Preséntate y pregunta su nombre a Bao',
  persona: 'bao',
  target_item_ids: ['h1-你好', ...ids('叫', '什么', '名字')],
  max_turns: 8,
};

/** Práctica de pronunciación: Bao propone frases y pide repetirlas (repeat_aloud). */
export const PRONUNCIATION_DRILL: Scenario = {
  id: 'voice-drill',
  title: 'Taller de tonos',
  goal: 'Repite en voz alta las frases de Bao cuidando los tonos',
  persona: 'bao',
  target_item_ids: ['h1-你好', ...ids('谢谢', '很', '水')],
  max_turns: 6,
};

/** Escenario de un nodo de conversación del camino (los datos viven en el curso). */
export function scenarioForNode(nodeId: string | undefined): Scenario {
  for (const unit of UNITS) {
    const node = unit.nodes.find((n) => n.id === nodeId);
    if (node?.scenario) {
      return { id: node.id, title: unit.title, target_item_ids: node.skillIds, max_turns: 8, ...node.scenario };
    }
  }
  return FREE_TALK;
}

export const ALL_SCENARIOS: { scenario: Scenario; icon: string; unitTitle: string; nodeId?: string }[] = [
  { scenario: FREE_TALK, icon: '🐼', unitTitle: 'Libre' },
  { scenario: PRONUNCIATION_DRILL, icon: '🎙️', unitTitle: 'Pronunciación' },
  ...UNITS.flatMap((u) =>
    u.nodes
      .filter((n) => n.kind === 'conversation')
      .map((n) => ({ scenario: scenarioForNode(n.id), icon: n.scenario?.persona === 'native' ? '🧑' : '🐼', unitTitle: `HSK ${u.level} · Unidad ${u.index}`, nodeId: n.id })),
  ),
];

/**
 * Llamada con Bao: charla solo por voz sobre el tema de la unidad en la que vas
 * (la primera con nodos sin completar).
 */
export function callScenario(completedIds: string[]): Scenario {
  const unit = UNITS.find((u) => u.nodes.some((n) => !completedIds.includes(n.id))) ?? UNITS[UNITS.length - 1]!;
  const node = unit.nodes.find((n) => n.kind === 'conversation');
  const base = node ? scenarioForNode(node.id) : FREE_TALK;
  return {
    ...base,
    id: `call-${unit.id}`,
    title: `Llamada · ${unit.title}`,
    persona: 'bao',
    role: undefined,
    goal: `Llamada de voz con Bao (frases cortas y naturales, como al teléfono). Tema: ${base.goal}`,
    max_turns: 8,
  };
}

/** «Hablar» en la casa de Bao: charla casual que sabe cómo está Bao y qué habéis hecho. */
export function petScenario(pet: PetState, hour: number): Scenario {
  const feel = moodLine(pet, hour);
  const recent = pet.words.slice(-3).join('、');
  return {
    id: 'pet-talk',
    title: 'Charla en casa de Bao',
    goal: `Charla casual en casa de Bao. Bao ahora mismo dice «${feel.hanzi}» (${feel.es}).${recent ? ` Hoy habéis practicado: ${recent}.` : ''} Pregunta al estudiante por su día con frases muy sencillas.`,
    persona: 'bao',
    target_item_ids: ['h1-你好', ...ids('吃', '喝', '喜欢', '今天')],
    max_turns: 8,
  };
}
