import { BackHandler, Linking, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black } from '@expo-google-fonts/nunito';
import { NotoSansSC_700Bold } from '@expo-google-fonts/noto-sans-sc';
import { ThemeProvider } from '@/theme';
import { AssistantPanel } from './AssistantPanel';
import { startFrom } from './startParams';

/**
 * Raíz de la ventana transparente de Android (AssistantActivity): Bao aparece
 * encima de la app en la que estés. Al cerrarlo, se cierra solo esa ventana.
 */
export function AssistantRoot(props: { uri?: string; text?: string; image?: string }) {
  const [loaded] = useFonts({ Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black, NotoSansSC_700Bold });
  if (!loaded) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: 'transparent' }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <StatusBar translucent backgroundColor="transparent" />
          <AssistantPanel
            start={startFrom(props)}
            onClose={() => BackHandler.exitApp()}
            onOpenChat={() => {
              void Linking.openURL('pandago://free-chat');
              BackHandler.exitApp();
            }}
          />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
