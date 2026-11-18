import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Text, spacing } from '@/design-system';

import { eventEntry, withPhase } from '../domain/agenda';
import { onDay, routinesOn } from '../domain/schedule';
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
  bare = false,
  week = true,
}: {
  renderExtra?: (routine: RoutineToday) => React.ReactNode;
  /** The week at a glance on top. Off on Início on computers, which shows the week beside it. */
  week?: boolean;
  /**
   * Inside a dashboard block ("Agenda de hoje"): today only, under one title; the block itself
   * opens the agenda.
   */
  bare?: boolean;
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
      {bare ? (
        <Text variant="overline" tone="tertiary" style={styles.title}>
          Agenda de hoje
        </Text>
      ) : null}
      {/* On computers, only what comes next: the week sits beside it. */}
      <WeekRibbon
        nextOnly={!week}
        routines={routines}
        todayKey={todayKey}
        nowMinutes={nowMinutes}
        onDay={(day) =>
          router.navigate({
            pathname: '/aquarium',
            params: { tab: 'routines', view: 'week', day },
          })
        }
        onSeeAll={() => router.navigate({ pathname: '/aquarium', params: { tab: 'routines' } })}
      />
      {eventsToday.length > 0 ? (
        <View style={styles.events}>
          {bare ? null : (
            <Text variant="overline" tone="tertiary" style={styles.title}>
              Eventos de hoje
            </Text>
          )}
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
        // At today's time when it was changed for today only.
        routines={routines.map((r) => onDay(r, todayKey))}
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
        bare={bare}
      />
      {bare && eventsToday.length === 0 && !routines.some((r) => r.phase !== 'rest') ? (
        <Text variant="footnote" tone="secondary" style={styles.title}>
          Nada na agenda hoje. Toque para planejar.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.lg },
  events: { gap: spacing.sm },
  title: { marginLeft: spacing.xs },
});
