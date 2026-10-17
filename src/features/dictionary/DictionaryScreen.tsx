import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HanziTones, PinyinText, StarButton, WordCard } from '@/components/learn';
import { Bao } from '@/components/mascot';
import { Button3D, PressableScale, Segmented } from '@/components/ui';
import { UNITS, VOCAB } from '@/data/hsk/course';
import type { VocabItem } from '@/data/hsk/types';
import { exitTo } from '@/lib/navigation';
import { speakChinese } from '@/lib/speech';
import { useProgressStore } from '@/store/useProgressStore';
import { type CustomWord, useWordsStore } from '@/store/useWordsStore';
import { tonesFromPinyin } from '@/features/chat/engine/tones';

/** Las palabras guardadas desde Bao Asistente se tratan como del curso (nivel = el actual). */
const customToVocab = (w: CustomWord): VocabItem => ({
  id: w.id,
  hanzi: w.hanzi,
  pinyin: w.pinyin,
  meaning: w.meaning,
  tones: tonesFromPinyin(w.pinyin, [...w.hanzi].length),
  level: 1,
  note: 'Guardada desde Bao Asistente.',
});
import { useTheme } from '@/theme';
import { isDue, nextReviewLabel } from './cards';
import { Flashcards } from './Flashcards';
import { searchVocab } from './search';

type Tab = 'search' | 'mine';

/** Diccionario de HSK 1-2 + «Mis palabras» (guardadas con ⭐) con tarjetas de repaso. */
export function DictionaryScreen() {
  const { c, type, spacing, radius } = useTheme();
  const router = useRouter();
  const cards = useWordsStore((s) => s.cards);
  const custom = useWordsStore((s) => s.custom);
  const completed = useProgressStore((s) => s.completedNodeIds);
  const [tab, setTab] = useState<Tab>('search');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [now] = useState(() => Date.now());

  // Sin búsqueda: las palabras de la unidad en curso.
  const suggested = useMemo(() => {
    const unit = UNITS.find((u) => u.nodes.some((n) => !completed.includes(n.id))) ?? UNITS[0];
    const ids = new Set(unit?.nodes.find((n) => n.kind === 'boss')?.skillIds);
    return { title: unit?.title ?? '', words: VOCAB.filter((v) => ids.has(v.id)) };
  }, [completed]);

  const results = useMemo(() => (query.trim() ? searchVocab(query, VOCAB) : suggested.words), [query, suggested]);
  const mine = useMemo(
    () =>
      [...VOCAB, ...Object.values(custom).map(customToVocab)]
        .filter((v) => cards[v.id])
        .sort((a, b) => (cards[a.id]?.due ?? 0) - (cards[b.id]?.due ?? 0)),
    [cards, custom],
  );
  const due = mine.filter((v) => cards[v.id] && isDue(cards[v.id]!, now));

  if (reviewing) return <Flashcards words={due.length ? due : mine.slice(0, 10)} onDone={() => setReviewing(false)} />;

  const row = ({ item }: { item: VocabItem }) => {
    const expanded = open === item.id;
    return (
      <View style={[styles.rowWrap, { borderColor: c.border, backgroundColor: c.surfaceRaised, borderRadius: radius.md, padding: spacing.sm }]}>
        <PressableScale
          onPress={() => {
            setOpen(expanded ? null : item.id);
            if (!expanded) speakChinese(item.hanzi, { force: true });
          }}
          accessibilityRole="button"
          accessibilityLabel={`${item.hanzi}, ${item.pinyin}: ${item.meaning}`}
          style={[styles.row, { gap: spacing.sm }]}
        >
          <HanziTones hanzi={item.hanzi} pinyin={item.pinyin} style={[type.hanzi, { fontSize: 26, lineHeight: 34, minWidth: 64 }]} />
          <View style={styles.flex}>
            <PinyinText pinyin={item.pinyin} style={type.title} />
            <Text style={[type.body, { color: c.textPrimary }]} numberOfLines={expanded ? undefined : 1}>
              {item.meaning}
            </Text>
            {tab === 'mine' && cards[item.id] && (
              <Text style={[type.caption, { color: isDue(cards[item.id]!, now) ? c.primary : c.textSecondary }]}>Repaso {nextReviewLabel(cards[item.id]!, now)}</Text>
            )}
          </View>
          <Text style={[type.caption, { color: c.textSecondary }]}>HSK {item.level}</Text>
          <StarButton id={item.id} />
        </PressableScale>
        {expanded && (
          <View style={{ marginTop: spacing.sm }}>
            <WordCard word={item} />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: c.background }]}>
      <View style={[styles.row, { padding: spacing.sm, borderBottomWidth: 2, borderBottomColor: c.border }]}>
        <PressableScale onPress={() => exitTo(router)} accessibilityRole="button" accessibilityLabel="Cerrar" hitSlop={12}>
          <Text style={[type.title, { color: c.textSecondary, paddingHorizontal: spacing.sm }]}>✕</Text>
        </PressableScale>
        <Text style={[type.title, { color: c.textPrimary }]}>📕 Diccionario</Text>
      </View>
      <View style={{ padding: spacing.md, gap: spacing.sm }}>
        <Segmented
          accessibilityLabel="Sección"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'search', label: '🔍 Buscar' },
            { value: 'mine', label: `⭐ Mis palabras (${mine.length})` },
          ]}
        />
        {tab === 'search' ? (
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Escribe en español, pinyin o caracteres…"
            placeholderTextColor={c.textSecondary}
            autoCorrect={false}
            autoCapitalize="none"
            accessibilityLabel="Buscar palabra"
            style={[type.body, styles.input, { color: c.textPrimary, backgroundColor: c.surface, borderColor: c.border, borderRadius: radius.md, paddingHorizontal: spacing.md }]}
          />
        ) : (
          mine.length > 0 && (
            <Button3D
              label={due.length ? `Repasar ${due.length} tarjeta${due.length === 1 ? '' : 's'}` : 'Repasar de todas formas'}
              variant={due.length ? 'success' : 'ghost'}
              onPress={() => setReviewing(true)}
            />
          )
        )}
      </View>
      <FlatList
        data={tab === 'search' ? results : mine}
        keyExtractor={(v) => v.id}
        renderItem={row}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xl, gap: spacing.xs }}
        ListHeaderComponent={
          tab === 'search' && !query.trim() ? (
            <Text style={[type.caption, { color: c.textSecondary, marginBottom: spacing.xs }]}>PALABRAS DE TU UNIDAD: {suggested.title.toUpperCase()}</Text>
          ) : null
        }
        ListEmptyComponent={
          <View style={[styles.empty, { gap: spacing.sm, padding: spacing.lg }]}>
            <Bao mood="thinking" size={80} />
            <Text style={[type.body, { color: c.textSecondary, textAlign: 'center' }]}>
              {tab === 'mine'
                ? 'Aún no has guardado palabras. Toca ☆ en cualquier palabra (aquí o en las fichas de las lecciones) para repasarla con tarjetas.'
                : 'No encuentro esa palabra en HSK 1-2. Prueba en pinyin (pengyou) o en español (amigo).'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowWrap: { borderWidth: 1.5 },
  input: { borderWidth: 2, height: 48 },
  empty: { alignItems: 'center' },
});
