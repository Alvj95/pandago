/**
 * Entrada de la app: Expo Router (pantalla principal) + la ventana transparente
 * de Bao Asistente + los widgets de Android.
 */
import 'expo-router/entry';
import { AppRegistry, Platform } from 'react-native';
import { AssistantRoot } from '@/features/assistant/AssistantRoot';

AppRegistry.registerComponent('assistant', () => AssistantRoot);

if (Platform.OS === 'android') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { registerWidgetTaskHandler } = require('react-native-android-widget') as typeof import('react-native-android-widget');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  registerWidgetTaskHandler((require('@/features/widget/taskHandler') as typeof import('@/features/widget/taskHandler')).widgetTaskHandler);
}
