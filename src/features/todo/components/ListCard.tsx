import { ChevronRight, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text, listColors, radius, spacing, useTheme, withAlpha } from '@/design-system';

import type { TaskList } from '../domain/types';

const CARD_HEIGHT = 148;

type ListCardProps = { list: TaskList; onPress: () => void; onLongPress?: () => void };

/**
 * A list as a bold colored tile: the list's color fills the card, its emoji sits in a bubble
 * and the number of open tasks is the biggest thing on it.
 */
export function ListCard({ list, onPress, onLongPress }: ListCardProps) {
  const { colors, scheme } = useTheme();
  const tone = list.color ? listColors[list.color][scheme] : colors.accent;
  const pending =
    list.pendingCount === 0
      ? 'Tudo em dia'
      : `${list.pendingCount} ${list.pendingCount === 1 ? 'pendente' : 'pendentes'}`;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={`${list.name}, ${pending}`}
      accessibilityActions={onLongPress ? [{ name: 'longpress', label: 'Mais opções' }] : []}
      onAccessibilityAction={onLongPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surfaceRaised,
          borderColor: withAlpha(tone, 0.45),
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: withAlpha(tone, scheme === 'dark' ? 0.26 : 0.18) },
        ]}
      />
      {/* A wave of the list's color along the bottom. */}
      <View style={[styles.wave, { backgroundColor: withAlpha(tone, 0.22) }]} />
      <View style={styles.top}>
        <View style={[styles.badge, { backgroundColor: withAlpha(tone, 0.28) }]}>
          {list.emoji ? (
            <Text variant="title2">{list.emoji}</Text>
          ) : (
            <View style={[styles.dot, { backgroundColor: tone }]} />
          )}
        </View>
        {list.pendingCount > 0 ? (
          <Text variant="title1" style={{ color: tone }}>
            {list.pendingCount}
          </Text>
        ) : (
          <Text variant="title2">✓</Text>
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

/** A list as a compact row, for the "Lista" view. */
export function ListRow({
  list,
  onPress,
  onLongPress,
  separator,
}: ListCardProps & { separator?: boolean }) {
  const { colors, scheme } = useTheme();
  const tone = list.color ? listColors[list.color][scheme] : colors.accent;
  const pending =
    list.pendingCount === 0
      ? 'Tudo em dia'
      : `${list.pendingCount} ${list.pendingCount === 1 ? 'pendente' : 'pendentes'}`;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={`${list.name}, ${pending}`}
      accessibilityActions={onLongPress ? [{ name: 'longpress', label: 'Mais opções' }] : []}
      onAccessibilityAction={onLongPress}
      style={({ pressed }) => [
        styles.row,
        separator && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator },
        pressed && { backgroundColor: colors.surfacePressed },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: withAlpha(tone, 0.24) }]}>
        {list.emoji ? (
          <Text variant="headline">{list.emoji}</Text>
        ) : (
          <View style={[styles.dot, { backgroundColor: tone }]} />
        )}
      </View>
      <View style={styles.flex}>
        <Text variant="headline" numberOfLines={1}>
          {list.name}
        </Text>
        <Text variant="footnote" tone="secondary">
          Lista · {pending}
        </Text>
      </View>
      <ChevronRight size={18} color={colors.textTertiary} />
    </Pressable>
  );
}

/** The last tile of the grid: create a list or a folder. */
export function NewListCard({
  onPress,
  label = 'Nova lista',
}: {
  onPress: () => void;
  label?: string;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
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
        {label}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  wave: {
    position: 'absolute',
    left: -20,
    right: -20,
    bottom: -46,
    height: 80,
    borderRadius: 999,
  },
});
