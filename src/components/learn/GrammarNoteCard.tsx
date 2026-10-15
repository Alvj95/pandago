import { Text, View } from 'react-native';
import type { GrammarNote } from '@/data/hsk/types';
import { useTheme } from '@/theme';
import { ExampleRow } from './ToneText';

/** Explicación de gramática: título, esquema, explicación y ejemplos con audio. */
export function GrammarNoteCard({ note, index }: { note: GrammarNote; index?: number }) {
  const { c, type, spacing, radius } = useTheme();
  return (
    <View style={{ gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 2, borderBottomWidth: 4, borderColor: c.border, backgroundColor: c.surfaceRaised }}>
      <Text style={[type.title, { color: c.textPrimary }]}>
        {index !== undefined ? `${index + 1}. ` : ''}
        {note.title}
      </Text>
      <View style={{ alignSelf: 'flex-start', backgroundColor: c.primarySoft, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4 }}>
        <Text style={[type.body, { color: c.primary }]}>{note.pattern}</Text>
      </View>
      <Text style={[type.body, { color: c.textPrimary }]}>{note.body}</Text>
      {note.examples.map((e, i) => (
        <ExampleRow key={i} example={e} size={20} />
      ))}
    </View>
  );
}
