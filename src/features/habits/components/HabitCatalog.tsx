import { Plus, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  Chip,
  Glyph,
  Grid,
  Text,
  TextInput,
  glyphs,
  listColors,
  radius,
  spacing,
  useBreakpoint,
  useTheme,
  withAlpha,
} from '@/design-system';

import { daysLabel } from '../domain/progress';
import {
  CATEGORIES,
  POPULAR,
  PRESETS,
  searchPresets,
  type CategoryId,
  type HabitPreset,
} from '../domain/catalog';
import { creatures } from '../domain/creatures';

/** "8 copos · todo dia", "10 min · dias úteis", "4 passos · todo dia". */
function presetLine(p: HabitPreset): string {
  const option = p.units?.find((u) => u.unit === p.unit);
  const goal =
    p.kind === 'count'
      ? `${p.target} ${p.unit ?? ''}${option?.ml ? ` de ${option.ml} ml` : ''}`.trim()
      : p.kind === 'time'
        ? `${p.target} min`
        : p.kind === 'checklist'
          ? `${p.steps?.length ?? 0} passos`
          : null;
  return [p.description ?? goal, daysLabel(p.days).toLowerCase()].filter(Boolean).join(' · ');
}

/**
 * "Novo hábito": ready-made models by category, with a search, and starting from scratch.
 * Picking a model only fills the editor.
 */
export function HabitCatalog({ onPick }: { onPick: (preset: HabitPreset | null) => void }) {
  const wide = useBreakpoint() !== 'compact';
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryId | 'popular'>('popular');
  const shown = query.trim()
    ? searchPresets(query)
    : category === 'popular'
      ? POPULAR.map((id) => PRESETS.find((p) => p.id === id)!).filter(Boolean)
      : PRESETS.filter((p) => p.category === category);

  return (
    <View style={styles.root}>
      <TextInput
        label="Buscar um modelo"
        value={query}
        onChangeText={setQuery}
        placeholder="Água, leitura, oração…"
        returnKeyType="search"
      />
      {query.trim() ? null : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <Chip
            label="Populares"
            icon={Sparkles}
            selected={category === 'popular'}
            onPress={() => setCategory('popular')}
          />
          {CATEGORIES.map((c) => (
            <Chip
              key={c.id}
              label={c.label}
              icon={glyphs[c.glyph]}
              selected={category === c.id}
              onPress={() => setCategory(c.id)}
            />
          ))}
        </ScrollView>
      )}
      {shown.length === 0 ? (
        <Text variant="footnote" tone="secondary" style={styles.empty}>
          {`Nenhum modelo com “${query.trim()}”. Comece do zero e dê o nome que quiser.`}
        </Text>
      ) : (
        <Grid columns={wide ? 3 : 2} gap={spacing.sm}>
          {shown.map((preset) => (
            <PresetCard key={preset.id} preset={preset} onPress={() => onPick(preset)} />
          ))}
        </Grid>
      )}
      <Pressable
        onPress={() => onPick(null)}
        accessibilityRole="button"
        accessibilityLabel="Começar do zero"
        style={({ pressed }) => [
          styles.zero,
          { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Plus size={20} color={colors.accent} />
        <Text variant="headline" tone="accent">
          Começar do zero
        </Text>
      </Pressable>
    </View>
  );
}

function PresetCard({ preset, onPress }: { preset: HabitPreset; onPress: () => void }) {
  const { colors, scheme } = useTheme();
  const tone = listColors[creatures[preset.creature].color][scheme];
  const line = presetLine(preset);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${preset.name}: ${line}`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surfaceRaised, transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: withAlpha(tone, 0.2) }]}>
        <Glyph name={preset.glyph} size={20} color={tone} />
      </View>
      <Text variant="headline" numberOfLines={2}>
        {preset.name}
      </Text>
      <Text variant="caption" tone="secondary" numberOfLines={2}>
        {line}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  chips: { gap: spacing.sm, paddingRight: spacing.lg },
  empty: { marginHorizontal: spacing.xs },
  card: { borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs, minHeight: 118 },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxs,
  },
  zero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    padding: spacing.md,
  },
});
