import { Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Grid, Text, radius, spacing, useBreakpoint, useTheme } from '@/design-system';

import type { HabitWithProgress } from '../domain/types';
import type { HabitActions } from '../hooks/useHabitActions';
import { HabitCard } from './HabitCard';
import { ReefHero } from './ReefHero';

const COLUMNS = { compact: 1, medium: 2, expanded: 3 } as const;
const GAP = spacing.md;

type HabitsViewProps = {
  habits: HabitWithProgress[];
  actions: HabitActions;
  onCreate: () => void;
};

/** The reef on top, then today's habits first and resting ones after. */
export function HabitsView({ habits, actions, onCreate }: HabitsViewProps) {
  const breakpoint = useBreakpoint();
  const columns = COLUMNS[breakpoint];

  const today = habits.filter((h) => h.scheduledToday || h.doneToday);
  const resting = habits.filter((h) => !h.scheduledToday && !h.doneToday);

  const grid = (items: HabitWithProgress[], withNew: boolean) => (
    <Grid columns={columns} gap={GAP} accessibilityRole="list">
      {items.map((habit) => (
        <HabitCard key={habit.id} habit={habit} actions={actions} />
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
        <Plus size={24} color={colors.accent} strokeWidth={2.2} />
      </View>
      <View style={styles.newTexts}>
        <Text variant="headline" tone="accent">
          Novo hábito
        </Text>
        <Text variant="footnote" tone="secondary">
          Escolha uma criatura para cuidar
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xl },
  section: { gap: spacing.sm },
  sectionTitle: { marginLeft: spacing.xs },
  newCard: {
    minHeight: 104,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  newBadge: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newTexts: { flex: 1, gap: 2 },
});
