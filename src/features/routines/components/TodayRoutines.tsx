import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/design-system';

import { useRoutinesRepository } from '../hooks/routinesContext';
import type { RoutineToday } from '../domain/types';
import { useRoutinesToday } from '../hooks/queries';
import { RoutineTimeline } from './RoutineTimeline';
import { WeekRibbon } from './WeekRibbon';

/**
 * Routines on the Today screen: the week at a glance, then today's timeline (hidden when none
 * is scheduled today).
 */
export function TodayRoutines({
  renderExtra,
}: {
  renderExtra?: (routine: RoutineToday) => React.ReactNode;
} = {}) {
  const router = useRouter();
  const repository = useRoutinesRepository();
  const { data: routines = [], todayKey, nowMinutes } = useRoutinesToday();
  return (
    <View style={styles.root}>
      <WeekRibbon
        routines={routines}
        todayKey={todayKey}
        nowMinutes={nowMinutes}
        onDay={(day) =>
          router.navigate({ pathname: '/aquarium', params: { tab: 'routines', view: 'week', day } })
        }
        onSeeAll={() => router.navigate({ pathname: '/aquarium', params: { tab: 'routines' } })}
      />
      <RoutineTimeline
        routines={routines}
        renderExtra={renderExtra}
        onSeeAll={() => router.navigate({ pathname: '/aquarium', params: { tab: 'routines' } })}
        onOpen={(id) =>
          router.navigate({ pathname: '/aquarium', params: { tab: 'routines', edit: id } })
        }
        onToggleItem={(routineId, itemId, done) =>
          repository
            .setItemChecked(routineId, itemId, todayKey, done)
            .catch((e: unknown) => console.error(e))
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({ root: { gap: spacing.lg } });
