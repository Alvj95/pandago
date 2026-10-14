import { SENTENCES, UNITS, VOCAB } from '@/data/hsk/course';
import strokes from '@/data/strokes/hsk.strokes.json';
import type { Content } from './engine/exerciseFactory';

/** Contenido disponible en el dispositivo (en producción: paquete descargable por nivel HSK). */
export const LOCAL_CONTENT: Content = {
  vocab: VOCAB,
  sentences: SENTENCES,
  strokeChars: new Set(Object.keys(strokes)),
};

export const findNode = (id: string) => UNITS.flatMap((u) => u.nodes).find((n) => n.id === id);

/** Unidad a la que pertenece un nodo (para el desafío y las conversaciones). */
export const unitOfNode = (id: string) => UNITS.find((u) => u.nodes.some((n) => n.id === id));
