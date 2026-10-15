import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bao } from '@/components/mascot';
import { Button3D, PressableScale } from '@/components/ui';
import { feedback } from '@/lib/haptics';
import { exitTo } from '@/lib/navigation';
import { useShopStore } from '@/store/useShopStore';
import { useTheme } from '@/theme';
import { OUTFIT, SLOTS } from './items';

/** Vestidor: elegir qué prenda lleva Bao en cada hueco (cabeza, cara, cuello). */
export function WardrobeScreen() {
  const { c, type, spacing, radius } = useTheme();
  const router = useRouter();
  const { owned, outfit, wear } = useShopStore();

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: c.background }]}>
      <View style={[styles.row, { padding: spacing.md, gap: spacing.sm }]}>
        <PressableScale onPress={() => exitTo(router)} accessibilityRole="button" accessibilityLabel="Salir" hitSlop={10}>
          <Text style={[type.title, { color: c.textSecondary }]}>✕</Text>
        </PressableScale>
        <Text style={[type.title, { color: c.textPrimary }]}>👕 Vestir a Bao</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingTop: 0, gap: spacing.md, paddingBottom: spacing.xxl }}>
        <View style={[styles.stage, { backgroundColor: c.surfaceSunken, borderRadius: radius.lg }]}>
          <Bao mood="happy" size={170} />
        </View>
        {SLOTS.map(({ slot, label }) => {
          const mine = OUTFIT.filter((i) => i.slot === slot && owned.includes(i.id));
          return (
            <View key={slot} style={{ gap: spacing.xs }}>
              <Text style={[type.caption, { color: c.textSecondary }]}>{label.toUpperCase()}</Text>
              <View style={[styles.row, { flexWrap: 'wrap', gap: spacing.xs }]}>
                {[null, ...mine].map((item) => {
                  const on = (outfit[slot] ?? null) === (item?.id ?? null);
                  return (
                    <PressableScale
                      key={item?.id ?? 'none'}
                      onPress={() => {
                        wear(slot, item?.id ?? null);
                        void feedback.tap();
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={`${label}: ${item?.name ?? 'nada'}`}
                    >
                      <View style={[styles.chip, { borderColor: on ? c.primary : c.border, backgroundColor: on ? c.primarySoft : c.surface, borderRadius: radius.md }]}>
                        <Text style={[type.caption, { color: c.textPrimary }]}>{item ? `${item.icon} ${item.name}` : 'Nada'}</Text>
                      </View>
                    </PressableScale>
                  );
                })}
                {!mine.length ? <Text style={[type.caption, { color: c.textSecondary, alignSelf: 'center' }]}>Aún no tienes nada para la {label.toLowerCase()}.</Text> : null}
              </View>
            </View>
          );
        })}
        <Text style={[type.body, { color: c.textSecondary }]}>Bao lleva su ropa en el inicio, las lecciones, el chat y las celebraciones.</Text>
        <Button3D label="🛍️ Ir a la tienda" onPress={() => router.replace('/shop')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  stage: { height: 200, alignItems: 'center', justifyContent: 'center' },
  chip: { borderWidth: 2, paddingHorizontal: 12, paddingVertical: 8 },
});
