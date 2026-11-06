import { Fish } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { TankTag, spacing } from '@/design-system';

import type { HabitWithProgress } from '../domain/types';
import { HabitTank } from './HabitTank';

type ReefHeroProps = { habits: HabitWithProgress[] };

/**
 * Aquário → Hábitos: the aquarium, big. Every habit is a creature; checking a habit makes it
 * swim up toward the light. The picture is decorative: the label says the same thing.
 */
export function ReefHero({ habits }: ReefHeroProps) {
  const due = habits.filter((h) => h.scheduledToday || h.doneToday);
  const done = due.filter((h) => h.doneToday).length;
  const count = `${habits.length} ${habits.length === 1 ? 'criatura' : 'criaturas'}`;
  const today = due.length === 0 ? 'Descanso hoje' : `${done} de ${due.length} hoje`;

  return (
    <HabitTank
      habits={habits}
      height={232}
      level={due.length > 0 ? done / due.length : 0.4}
      accessibilityLabel={`Seu aquário: ${count}. ${today}.`}
      overlay={
        <View style={styles.top}>
          <TankTag icon={Fish} label={count} />
          <TankTag label={today} />
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    padding: spacing.md,
  },
});
