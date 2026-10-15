import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';

const icon = (emoji: string) =>
  function TabIcon({ focused }: { focused: boolean }) {
    return <Text style={{ fontSize: 26, opacity: focused ? 1 : 0.45, transform: [{ scale: focused ? 1.1 : 1 }] }}>{emoji}</Text>;
  };

export default function TabsLayout() {
  const { c, type } = useTheme();
  // La app dibuja bajo la barra de navegación del sistema (edge-to-edge): la barra de
  // pestañas suma ese hueco para que los botones no queden tapados por atrás/inicio.
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textSecondary,
        tabBarLabelStyle: { fontFamily: type.caption.fontFamily, fontSize: 11 },
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.border,
          borderTopWidth: 2,
          height: 66 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Aprender', tabBarIcon: icon('🏠') }} />
      <Tabs.Screen name="practice" options={{ title: 'Practicar', tabBarIcon: icon('🎯') }} />
      <Tabs.Screen name="sing" options={{ title: 'Cantar', tabBarIcon: icon('🎤') }} />
      <Tabs.Screen name="leagues" options={{ title: 'Ligas', tabBarIcon: icon('🏮') }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: icon('🐼') }} />
    </Tabs>
  );
}
