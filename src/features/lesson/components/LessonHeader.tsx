import { StyleSheet, Text, View } from 'react-native';
import { PressableScale, ProgressBar } from '@/components/ui';
import { useTheme } from '@/theme';

export function LessonHeader({ progress, hearts, combo, onClose, onAsk }: { progress: number; hearts: number | null; combo: number; onClose: () => void; onAsk?: () => void }) {
  const { c, type, spacing } = useTheme();
  return (
    <View style={[styles.row, { gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm }]}>
      <PressableScale onPress={onClose} accessibilityLabel="Salir de la lección" style={styles.close}>
        <Text style={[type.title, { color: c.textSecondary }]}>✕</Text>
      </PressableScale>
      <View style={styles.flex}>
        <ProgressBar progress={progress} color={combo >= 3 ? c.streak : c.success} height={16} />
      </View>
      {onAsk ? (
        <PressableScale onPress={onAsk} accessibilityRole="button" accessibilityLabel="Pregúntale a Bao" hitSlop={8}>
          <Text style={[type.title, { color: c.info }]}>🐼❓</Text>
        </PressableScale>
      ) : null}
      <Text style={[type.title, { color: c.danger }]}>❤️ {hearts ?? '∞'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  close: { padding: 4 },
});
