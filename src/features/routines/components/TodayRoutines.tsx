import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Text, spacing } from '@/design-system';

import { eventEntry, withPhase } from '../domain/agenda';
import { routinesOn } from '../domain/schedule';
import { useRoutinesRepository } from '../hooks/routinesContext';
import type { RoutineToday } from '../domain/types';
import { useAgendaEvents, useRoutinesToday } from '../hooks/queries';
import { AgendaRow } from './AgendaView';
import { RoutineTimeline } from './RoutineTimeline';
import { WeekRibbon } from './WeekRibbon';

/**
 * The agenda on the Today screen: the week at a glance, today's events, then today's routine
 * timeline (each part hidden when there is nothing for today).
 */
export function TodayRoutines({
  renderExtra,
}: {
  renderExtra?: (routine: RoutineToday) => React.ReactNode;
} = {}) {
  const router = useRouter();
  const repository = useRoutinesRepository();
  const { data: routines = [], todayKey, nowMinutes } = useRoutinesToday();
  const { data: events = [] } = useAgendaEvents();
  const eventsToday = routinesOn(
    events.map((e) => withPhase(eventEntry(e), todayKey, nowMinutes)),
    todayKey,
  );
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
      {eventsToday.length > 0 ? (
        <View style={styles.events}>
          <Text variant="overline" tone="tertiary" style={styles.title}>
            Eventos de hoje
          </Text>
          {eventsToday.map((entry) => (
            <AgendaRow
              key={entry.id}
              routine={entry}
              today
              extras={[]}
              onPress={() =>
                router.navigate({
                  pathname: '/aquarium',
                  params: { tab: 'routines', event: entry.refId },
                })
              }
            />
          ))}
        </View>
      ) : null}
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

const styles = StyleSheet.create({
  root: { gap: spacing.lg },
  events: { gap: spacing.sm },
  title: { marginLeft: spacing.xs },
});
