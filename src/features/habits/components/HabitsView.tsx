import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { Text, radius, spacing, useBreakpoint, useTheme } from '@/design-system';

import type { HabitWithProgress } from '../domain/types';
import { HabitCard } from './HabitCard';
import { ReefHero } from './ReefHero';

const COLUMNS = { compact: 2, medium: 3, expanded: 3 } as const;
const GAP = spacing.md;

type HabitsViewProps = {
  habits: HabitWithProgress[];
  onToggle: (id: string, done: boolean) => void;
  onOpen: (id: string) => void;
  onCreate: () => void;
};

/** The reef on top, then today's habits first and resting ones after. */
export function HabitsView({ habits, onToggle, onOpen, onCreate }: HabitsViewProps) {
  const breakpoint = useBreakpoint();
  const [width, setWidth] = useState(0);
  const columns = COLUMNS[breakpoint];
  // Until the first layout (and in tests) tiles take the full width.
  const tileWidth = width > 0 ? (width - GAP * (columns - 1)) / columns : '100%';

  const today = habits.filter((h) => h.scheduledToday || h.doneToday);
  const resting = habits.filter((h) => !h.scheduledToday && !h.doneToday);

  const grid = (items: HabitWithProgress[], withNew: boolean) => (
    <View style={styles.grid} accessibilityRole="list">
      {items.map((habit) => (
        <View key={habit.id} style={{ width: tileWidth }}>
          <HabitCard
            habit={habit}
            onToggle={(done) => onToggle(habit.id, done)}
            onPress={() => onOpen(habit.id)}
          />
        </View>
      ))}
      {withNew ? (
        <View style={{ width: tileWidth }}>
          <NewHabitCard onPress={onCreate} />
        </View>
      ) : null}
    </View>
  );

  return (
    <View
      style={styles.root}
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
    >
      {habits.length > 0 ? <ReefHero habits={habits} /> : null}
      <Section title="Hoje">{grid(today, resting.length === 0)}</Section>
      {resting.length > 0 ? (
        <Section title="Descansando hoje">{grid(resting, true)}</Section>
      ) : null}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="overline" tone="tertiary" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function NewHabitCard({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Novo hábito"
      style={({ pressed }) => [
        styles.newCard,
        {
          borderColor: colors.border,
          backgroundColor: pressed ? colors.surfacePressed : 'transparent',
        },
      ]}
    >
      <View style={[styles.newBadge, { backgroundColor: colors.accentSoft }]}>
        <Plus size={26} color={colors.accent} strokeWidth={2.2} />
      </View>
      <Text variant="headline" tone="accent">
        Novo hábito
      </Text>
      <Text variant="footnote" tone="secondary" style={styles.center}>
        Escolha uma criatura para cuidar
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xl },
  section: { gap: spacing.sm },
  sectionTitle: { marginLeft: spacing.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  newCard: {
    minHeight: 196,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  newBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  center: { textAlign: 'center' },
});
