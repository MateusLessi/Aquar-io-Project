import { useRouter } from 'expo-router';

import { useRoutinesRepository } from '../hooks/routinesContext';
import type { RoutineToday } from '../domain/types';
import { useRoutinesToday } from '../hooks/queries';
import { RoutineTimeline } from './RoutineTimeline';

/** Today's routines on the Today screen. Hidden when none is scheduled today. */
export function TodayRoutines({
  renderExtra,
}: {
  renderExtra?: (routine: RoutineToday) => React.ReactNode;
} = {}) {
  const router = useRouter();
  const repository = useRoutinesRepository();
  const { data: routines = [], todayKey } = useRoutinesToday();
  return (
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
  );
}
