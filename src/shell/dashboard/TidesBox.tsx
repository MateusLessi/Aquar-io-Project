import { StyleSheet, View } from 'react-native';

import { useSetting } from '@/core/settings/useSetting';
import { SegmentedControl, spacing } from '@/design-system';
import { TideCalendar } from './TideCalendar';
import { WeekChart } from './WeekChart';

type ByDay = Parameters<typeof WeekChart>[0]['byDay'];

type TidesView = 'week' | 'month';

/**
 * Início on computers (Fase 5): the tides as a week or as a month, in one box under the tank.
 * The choice is remembered.
 */
export function TidesBox({
  todayKey,
  byDay,
  initial,
  onDay,
}: {
  todayKey: string;
  byDay: ByDay;
  /** The view shown until the person picks one (the block they kept in Ajustes). */
  initial: TidesView;
  onDay: (day: string) => void;
}) {
  const [view, setView] = useSetting<TidesView>('dashboard.tides', initial);
  return (
    <View style={styles.root}>
      <View style={styles.switch}>
        <SegmentedControl
          compact
          accessibilityLabel="Ver as marés da"
          options={[
            { value: 'week', label: 'Semana' },
            { value: 'month', label: 'Mês' },
          ]}
          value={view === 'month' ? 'month' : 'week'}
          onChange={(value) => void setView(value)}
        />
      </View>
      {view === 'month' ? (
        <TideCalendar bare todayKey={todayKey} byDay={byDay} onDay={onDay} />
      ) : (
        <WeekChart bare todayKey={todayKey} byDay={byDay} barHeight={96} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  // Clear of the block's corner arrow.
  switch: { marginRight: 40 },
});
