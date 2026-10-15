import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bao } from '@/components/mascot';
import { Button3D, Card, PressableScale, Segmented } from '@/components/ui';
import { PASS_SCORE } from '@/features/exam/exam';
import { MAX_FREEZES } from '@/features/rewards/chest';
import { feedback } from '@/lib/haptics';
import { exitTo } from '@/lib/navigation';
import { useExamStore } from '@/store/useExamStore';
import { MAX_HEARTS, useProgressStore } from '@/store/useProgressStore';
import { useShopStore } from '@/store/useShopStore';
import { useTheme } from '@/theme';
import { EARN_GEMS, HELPERS, isUnlocked, itemById, OUTFIT, type OutfitItem } from './items';

/** Tienda de Bao: ropa que se ve en toda la app y ayudas (congelador, vidas, doble XP). */
export function ShopScreen() {
  const { c, type, spacing, radius } = useTheme();
  const router = useRouter();
  const gems = useProgressStore((s) => s.gems);
  const hearts = useProgressStore((s) => s.hearts);
  const freezes = useProgressStore((s) => s.streakFreezes);
  const doubleXpUntil = useProgressStore((s) => s.doubleXpUntil);
  const buyHelper = useProgressStore((s) => s.buyHelper);
  const examBest = useExamStore((s) => s.best);
  const { owned, outfit, buy, wear } = useShopStore();
  const [tab, setTab] = useState<'outfit' | 'helpers'>('outfit');
  const [selected, setSelected] = useState<string>(OUTFIT[0]!.id);
  const [message, setMessage] = useState<string | null>(null);

  const item = itemById(selected)!;
  const has = owned.includes(item.id);
  const unlocked = isUnlocked(item, examBest, PASS_SCORE);
  const wearing = outfit[item.slot] === item.id;
  const doubleLeft = Math.max(0, Math.ceil((doubleXpUntil - Date.now()) / 60_000));

  const onBuy = () => {
    if (buy(item.id)) {
      void feedback.levelUp();
      setMessage(`¡${item.name} es tuyo! Bao ya lo lleva puesto.`);
    } else {
      void feedback.wrong();
      setMessage(`Te faltan ${item.price - gems} 💎. ¡Haz misiones y abre cofres para ganar más!`);
    }
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: c.background }]}>
      <View style={[styles.row, { padding: spacing.md, gap: spacing.sm }]}>
        <PressableScale onPress={() => exitTo(router)} accessibilityRole="button" accessibilityLabel="Salir" hitSlop={10}>
          <Text style={[type.title, { color: c.textSecondary }]}>✕</Text>
        </PressableScale>
        <Text style={[type.title, styles.flex, { color: c.textPrimary }]}>🛍️ Tienda de Bao</Text>
        <Text style={[type.title, { color: c.info }]}>💎 {gems}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingTop: 0, gap: spacing.md, paddingBottom: spacing.xxl }}>
        <Segmented
          accessibilityLabel="Sección de la tienda"
          value={tab}
          onChange={(v) => {
            setTab(v);
            setMessage(null);
          }}
          options={[
            { value: 'outfit', label: '👕 Ropa' },
            { value: 'helpers', label: '🧰 Ayudas' },
          ]}
        />

        {tab === 'outfit' ? (
          <>
            <Card>
              <View style={[styles.row, { gap: spacing.md }]}>
                <View style={[styles.stage, { backgroundColor: c.surfaceSunken, borderRadius: radius.md }]}>
                  <Bao mood="happy" size={110} outfit={{ ...outfit, [item.slot]: item.id }} />
                </View>
                <View style={[styles.flex, { gap: spacing.xs }]}>
                  <Text style={[type.title, { color: c.textPrimary }]}>
                    {item.icon} {item.name}
                  </Text>
                  {has ? (
                    <Button3D label={wearing ? 'Quitársela' : 'Ponérsela'} variant={wearing ? 'ghost' : 'success'} onPress={() => wear(item.slot, wearing ? null : item.id)} />
                  ) : !unlocked ? (
                    <Text style={[type.body, { color: c.textSecondary }]}>🔒 {item.unlock?.label}</Text>
                  ) : (
                    <Button3D label={item.price ? `Comprar · 💎 ${item.price}` : '¡Gratis! Reclamar'} onPress={onBuy} />
                  )}
                </View>
              </View>
              {message ? <Text style={[type.body, { color: c.textSecondary, marginTop: spacing.sm }]}>{message}</Text> : null}
            </Card>
            <View style={styles.grid}>
              {OUTFIT.map((it) => (
                <ItemTile
                  key={it.id}
                  item={it}
                  owned={owned.includes(it.id)}
                  locked={!isUnlocked(it, examBest, PASS_SCORE)}
                  selected={it.id === selected}
                  onPress={() => {
                    setSelected(it.id);
                    setMessage(null);
                  }}
                />
              ))}
            </View>
            <Button3D label="👕 Vestir a Bao" variant="ghost" onPress={() => router.push('/wardrobe')} />
          </>
        ) : (
          <>
            {HELPERS.map((h) => {
              const state =
                h.id === 'freeze'
                  ? `tienes ${freezes} de ${MAX_FREEZES}`
                  : h.id === 'refill'
                    ? `tienes ${hearts} de ${MAX_HEARTS} ❤️`
                    : doubleLeft
                      ? `activo: quedan ${doubleLeft} min`
                      : '';
              const blocked = (h.id === 'freeze' && freezes >= MAX_FREEZES) || (h.id === 'refill' && hearts >= MAX_HEARTS) || (h.id === 'double-xp' && doubleLeft > 0);
              return (
                <Card key={h.id}>
                  <View style={[styles.row, { gap: spacing.sm }]}>
                    <Text style={{ fontSize: 30 }}>{h.icon}</Text>
                    <View style={styles.flex}>
                      <Text style={[type.title, { color: c.textPrimary }]}>{h.name}</Text>
                      <Text style={[type.caption, { color: c.textSecondary }]}>
                        {h.desc}
                        {state ? ` · ${state}` : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={{ marginTop: spacing.sm }}>
                    <Button3D
                      label={blocked ? (h.id === 'double-xp' ? 'Activo ⚡' : 'Ya al máximo') : `Comprar · 💎 ${h.price}`}
                      disabled={blocked}
                      onPress={() => {
                        if (buyHelper(h.id, h.price)) {
                          void feedback.levelUp();
                          setMessage(`✅ ${h.name}: ¡hecho!`);
                        } else {
                          void feedback.wrong();
                          setMessage(`Te faltan ${h.price - gems} 💎.`);
                        }
                      }}
                    />
                  </View>
                </Card>
              );
            })}
            {message ? <Text style={[type.body, { color: c.textSecondary, textAlign: 'center' }]}>{message}</Text> : null}
            <Card>
              <Text style={[type.title, { color: c.textPrimary }]}>¿Cómo gano gemas?</Text>
              {EARN_GEMS.map((e) => (
                <Text key={e.text} style={[type.body, { color: c.textPrimary, marginTop: 4 }]}>
                  {e.icon} {e.text} · {e.gems} 💎
                </Text>
              ))}
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ItemTile({ item, owned, locked, selected, onPress }: { item: OutfitItem; owned: boolean; locked: boolean; selected: boolean; onPress: () => void }) {
  const { c, type, radius } = useTheme();
  return (
    <PressableScale onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={`${item.name}${owned ? ', tuya' : locked ? ', bloqueada' : `, ${item.price} gemas`}`} containerStyle={styles.cell}>
      <View
        style={[
          styles.tile,
          {
            backgroundColor: c.surface,
            borderColor: selected ? c.primary : owned ? c.success : c.border,
            borderRadius: radius.md,
            opacity: locked ? 0.55 : 1,
          },
        ]}
      >
        <Bao size={64} outfit={{ [item.slot]: item.id }} />
        <Text style={[type.caption, { color: c.textPrimary, textAlign: 'center' }]} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={[type.caption, { color: owned ? c.success : c.info }]}>{owned ? '✓ Tuya' : locked ? '🔒 Logro' : item.price ? `💎 ${item.price}` : 'Gratis'}</Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  stage: { width: 130, height: 130, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: { width: '31%', flexGrow: 1 },
  tile: { borderWidth: 2, borderBottomWidth: 4, padding: 8, alignItems: 'center', gap: 2 },
});
