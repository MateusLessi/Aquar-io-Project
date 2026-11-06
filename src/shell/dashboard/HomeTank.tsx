import { Anchor, Waves } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { TankChip, TankTag, spacing } from '@/design-system';
import { HabitTank } from '@/features/habits/components/HabitTank';
import { useHabits } from '@/features/habits/hooks/queries';

import { useProgress } from '../progress/useProgress';
import { useGamePrefs } from '../settings/prefs';

const meters = (value: number) => `${new Intl.NumberFormat('pt-BR').format(value)} m`;

type HomeTankProps = {
  done: number;
  total: number;
  height?: number;
};

/**
 * Início opens on your aquarium: the water is the day's tide, the ruler your depth, and the
 * creatures of your habits swim inside. The numbers sit on glass over the water.
 */
export function HomeTank({ done, total, height = 318 }: HomeTankProps) {
  const { data: habits = [] } = useHabits();
  const { data: progress } = useProgress();
  const { showDepth } = useGamePrefs();
  const level = total > 0 ? done / total : 0;
  const tide = Math.round(level * 100);
  const streak = Math.max(0, ...habits.map((h) => h.streak));
  const depth = progress?.depth;
  const todayMeters = progress?.today.points ?? 0;

  const summary = [
    total > 0 ? `Maré do dia: ${done} de ${total}` : 'Nada planejado para hoje',
    showDepth && depth ? `${meters(depth.meters)}, ${depth.zone.name}` : null,
    habits.length > 0
      ? `${habits.length} ${habits.length === 1 ? 'criatura' : 'criaturas'} no aquário`
      : null,
  ]
    .filter(Boolean)
    .join('. ');

  const chips = [
    { label: 'Maré do dia', value: String(done), unit: `de ${total}` },
    ...(habits.length > 0
      ? [{ label: 'Sequência', value: String(streak), unit: streak === 1 ? 'dia' : 'dias' }]
      : []),
    ...(showDepth ? [{ label: 'Hoje', value: `+${todayMeters}`, unit: 'm' }] : []),
  ];

  return (
    <HabitTank
      habits={habits}
      height={height}
      level={level}
      ruler={showDepth}
      accessibilityLabel={summary}
      progress={{ now: done, max: total }}
      overlay={
        <>
          <View style={styles.top}>
            {showDepth && depth ? (
              <TankTag icon={Anchor} label={`${meters(depth.meters)} · ${depth.zone.name}`} />
            ) : (
              <View />
            )}
            {total > 0 ? <TankTag icon={Waves} label={`Maré ${tide}%`} /> : null}
          </View>
          <View style={styles.chips}>
            {chips.map((chip) => (
              <TankChip key={chip.label} {...chip} />
            ))}
          </View>
        </>
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
  chips: {
    position: 'absolute',
    left: spacing.sm + 2,
    right: spacing.sm + 2,
    bottom: spacing.sm + 2,
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
