import { Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text, listColors, radius, spacing, useTheme, withAlpha } from '@/design-system';

import type { TaskList } from '../domain/types';

const CARD_HEIGHT = 132;

type ListCardProps = { list: TaskList; onPress: () => void };

/** A list as a colored tile: its color tints the whole card. */
export function ListCard({ list, onPress }: ListCardProps) {
  const { colors, scheme } = useTheme();
  const tone = list.color ? listColors[list.color][scheme] : colors.accent;
  const pending =
    list.pendingCount === 0
      ? 'Tudo em dia'
      : `${list.pendingCount} ${list.pendingCount === 1 ? 'pendente' : 'pendentes'}`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${list.name}, ${pending}`}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surfaceRaised,
          borderColor: withAlpha(tone, 0.35),
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: withAlpha(tone, 0.14) }]} />
      <View style={[styles.badge, { backgroundColor: withAlpha(tone, 0.22) }]}>
        {list.emoji ? (
          <Text variant="title2">{list.emoji}</Text>
        ) : (
          <View style={[styles.dot, { backgroundColor: tone }]} />
        )}
      </View>
      <View>
        <Text variant="headline" numberOfLines={1}>
          {list.name}
        </Text>
        <Text variant="footnote" tone="secondary">
          {pending}
        </Text>
      </View>
    </Pressable>
  );
}

/** The last tile of the grid: create a list. */
export function NewListCard({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Nova lista"
      style={({ pressed }) => [
        styles.card,
        styles.newCard,
        {
          borderColor: colors.border,
          backgroundColor: pressed ? colors.surfacePressed : 'transparent',
        },
      ]}
    >
      <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
        <Plus size={24} color={colors.accent} strokeWidth={2.2} />
      </View>
      <Text variant="headline" tone="accent">
        Nova lista
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: CARD_HEIGHT,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  newCard: { borderStyle: 'dashed', borderWidth: 1.5 },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 16, height: 16, borderRadius: 8 },
});
