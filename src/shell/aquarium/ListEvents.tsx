import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { toDateKey } from '@/core/dates';
import { Text, spacing } from '@/design-system';
import { AgendaRow } from '@/features/routines/components/AgendaView';
import { longDate } from '@/features/routines/components/EventEditorSheet';
import { eventEntry, nextOccurrence } from '@/features/routines/domain/agenda';
import { useAgendaEvents } from '@/features/routines/hooks/queries';

/** A list's events still to come ("Prova" in Cálculo 3), soonest first. Hidden when none. */
export function ListEvents({ listId }: { listId: string }) {
  const router = useRouter();
  const { data: events = [] } = useAgendaEvents();
  const todayKey = toDateKey(new Date());
  const coming = events
    .filter((e) => e.listId === listId)
    .map((e) => ({ event: e, next: nextOccurrence(e, todayKey) }))
    .filter((e): e is { event: (typeof events)[number]; next: string } => e.next !== null)
    .sort((a, b) => a.next.localeCompare(b.next));
  if (coming.length === 0) return null;
  return (
    <View style={styles.root}>
      <Text variant="overline" tone="tertiary" accessibilityRole="header" style={styles.title}>
        Na agenda
      </Text>
      {coming.map(({ event, next }) => (
        <AgendaRow
          key={event.id}
          routine={eventEntry(event)}
          today={false}
          extras={[next === todayKey ? 'Hoje' : longDate(next)]}
          onPress={() =>
            router.navigate({ pathname: '/aquarium', params: { tab: 'routines', event: event.id } })
          }
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  title: { marginLeft: spacing.xs },
});
