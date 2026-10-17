import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { VOCAB } from '@/data/hsk/course';
import { BaoMiniWidget, BaoWidget, type WidgetProps } from './BaoWidgets';
import { widgetMood, wordOfDay } from './widgetData';

/** Lee el estado guardado por la app (racha y necesidades de Bao) sin abrirla. */
export async function widgetProps(now = new Date()): Promise<WidgetProps> {
  const read = async (key: string) => {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw ? (JSON.parse(raw) as { state?: Record<string, unknown> }).state ?? null : null;
    } catch {
      return null;
    }
  };
  const [progress, pet] = await Promise.all([read('pandago-progress'), read('pandago-pet')]);
  const needs = ((pet?.pet as { needs?: Record<string, number> } | undefined)?.needs ?? null) as Record<string, number> | null;
  return {
    mood: widgetMood(needs, now.getHours()),
    streak: typeof progress?.streakDays === 'number' ? progress.streakDays : 0,
    word: wordOfDay(VOCAB, Math.floor(now.getTime() / 86_400_000)),
  };
}

export const renderWidget = (name: string, props: WidgetProps) => (name === 'BaoMini' ? <BaoMiniWidget {...props} /> : <BaoWidget {...props} />);

/** Android pide dibujar el widget al añadirlo, al cambiarlo de tamaño y cada 30 min. */
export async function widgetTaskHandler({ widgetInfo, widgetAction, renderWidget: render }: WidgetTaskHandlerProps) {
  if (widgetAction === 'WIDGET_DELETED' || widgetAction === 'WIDGET_CLICK') return;
  render(renderWidget(widgetInfo.widgetName, await widgetProps()));
}
