import { useRouter } from 'expo-router';
import { Fish } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { TankTag, spacing } from '@/design-system';

import type { HabitWithProgress } from '../domain/types';
import { useAquariumView } from '../hooks/aquariumView';
import { HabitPond, PondTag } from './HabitPond';
import { HabitTank } from './HabitTank';

type ReefHeroProps = { habits: HabitWithProgress[] };

/**
 * Aquário → Hábitos: the aquarium, big. Every habit is a creature; checking a habit makes it
 * swim up toward the light. The pond opens to explore it (Seu aquário); the label says what it
 * shows.
 */
export function ReefHero({ habits }: ReefHeroProps) {
  const due = habits.filter((h) => h.scheduledToday || h.doneToday);
  const done = due.filter((h) => h.doneToday).length;
  const count = `${habits.length} ${habits.length === 1 ? 'criatura' : 'criaturas'}`;
  const today = due.length === 0 ? 'Descanso hoje' : `${done} de ${due.length} hoje`;
  const [view] = useAquariumView();
  const router = useRouter();

  if (view === 'pond') {
    return (
      <Pressable
        onPress={() => router.push('/pond')}
        accessibilityRole="button"
        accessibilityLabel={`Explorar o aquário: ${count}. ${today}.`}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <HabitPond
          habits={habits}
          height={232}
          accessibilityLabel=""
          overlay={
            <View style={styles.overlay} pointerEvents="none">
              <View style={styles.row}>
                <PondTag label={count} />
                <PondTag label={today} />
              </View>
              <View style={[styles.row, styles.end]}>
                <PondTag label="Explorar ›" />
              </View>
            </View>
          }
        />
      </Pressable>
    );
  }

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
  pressed: { opacity: 0.9 },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  end: { justifyContent: 'flex-end' },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    padding: spacing.md,
  },
});
