import { Platform } from 'react-native';

/** Redibuja los widgets de Bao (al abrir la app: racha, palabra y cara al día). Solo Android. */
export async function updateWidgets() {
  if (Platform.OS !== 'android') return;
  try {
    const { requestWidgetUpdate } = await import('react-native-android-widget');
    const { renderWidget, widgetProps } = await import('./taskHandler');
    const props = await widgetProps();
    for (const widgetName of ['Bao', 'BaoMini']) await requestWidgetUpdate({ widgetName, renderWidget: () => renderWidget(widgetName, props) });
  } catch {
    // Sin widgets añadidos (o en una versión sin el módulo nativo): nada que hacer.
  }
}
