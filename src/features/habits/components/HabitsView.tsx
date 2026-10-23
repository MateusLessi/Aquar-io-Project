import { Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Grid, Text, radius, spacing, useBreakpoint, useTheme } from '@/design-system';

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
  const columns = COLUMNS[breakpoint];

  const today = habits.filter((h) => h.scheduledToday || h.doneToday);
  const resting = habits.filter((h) => !h.scheduledToday && !h.doneToday);

  const grid = (items: HabitWithProgress[], withNew: boolean) => (
    <Grid columns={columns} gap={GAP} accessibilityRole="list">
      {items.map((habit) => (
        <HabitCard
          key={habit.id}
          habit={habit}
          onToggle={(done) => onToggle(habit.id, done)}
          onPress={() => onOpen(habit.id)}
        />
      ))}
      {withNew ? <NewHabitCard onPress={onCreate} /> : null}
    </Grid>
  );

  return (
    <View style={styles.root}>
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
