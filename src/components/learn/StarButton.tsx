import { Text } from 'react-native';
import { PressableScale } from '@/components/ui';
import { feedback } from '@/lib/haptics';
import { useWordsStore } from '@/store/useWordsStore';

/** ⭐ Guardar / quitar una palabra de «Mis palabras». */
export function StarButton({ id, size = 24 }: { id: string; size?: number }) {
  const saved = useWordsStore((s) => !!s.cards[id]);
  const toggle = useWordsStore((s) => s.toggle);
  return (
    <PressableScale
      onPress={() => {
        toggle(id);
        void feedback.tap();
      }}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityState={{ selected: saved }}
      accessibilityLabel={saved ? 'Quitar de Mis palabras' : 'Guardar en Mis palabras'}
    >
      <Text style={{ fontSize: size, opacity: saved ? 1 : 0.35 }}>{saved ? '⭐' : '☆'}</Text>
    </PressableScale>
  );
}
