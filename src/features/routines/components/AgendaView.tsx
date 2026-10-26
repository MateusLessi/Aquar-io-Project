import { Pressable, StyleSheet, View } from 'react-native';

import { addDays, fromDateKey } from '@/core/dates';
import { Text, listColors, radius, spacing, useTheme } from '@/design-system';

import { durationLabel, routinesOn } from '../domain/schedule';
import type { RoutineToday } from '../domain/types';

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const DAY_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const DAYS_AHEAD = 7;

type AgendaViewProps = {
  routines: RoutineToday[];
  todayKey: string;
  onOpen: (routine: RoutineToday, day: string) => void;
  /** Short names of what is placed in a routine ("💧 Água", "📋 Cálculo 3"). */
  describe?: (routine: RoutineToday) => string[];
};

/** The next seven days as a list: what comes when. Today's past routines fade with how much got done. */
export function AgendaView({ routines, todayKey, onOpen, describe }: AgendaViewProps) {
  const days = Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(todayKey, i))
    .map((key) => ({ key, routines: routinesOn(routines, key) }))
    .filter((d) => d.routines.length > 0);

  if (days.length === 0) {
    return (
      <Text variant="body" tone="secondary" style={styles.empty}>
        Nenhuma rotina nos próximos dias.
      </Text>
    );
  }

  return (
    <View style={styles.root}>
      {days.map(({ key, routines: on }) => {
        const date = fromDateKey(key);
        const title =
          key === todayKey
            ? 'Hoje'
            : key === addDays(todayKey, 1)
              ? 'Amanhã'
              : DAY_NAMES[date.getDay()];
        return (
          <View key={key} style={styles.day}>
            <View style={styles.dayHeader} accessibilityRole="header">
              <Text variant="headline">{title}</Text>
              <Text variant="caption" tone="tertiary">
                {DAY_SHORT[date.getDay()]}, {date.getDate()} {MONTHS[date.getMonth()]}
              </Text>
            </View>
            {on.map((routine) => (
              <AgendaRow
                key={routine.id}
                routine={routine}
                today={key === todayKey}
                extras={describe?.(routine) ?? []}
                onPress={() => onOpen(routine, key)}
              />
            ))}
          </View>
        );
      })}
    </View>
  );
}

function AgendaRow({
  routine,
  today,
  extras,
  onPress,
}: {
  routine: RoutineToday;
  today: boolean;
  extras: string[];
  onPress: () => void;
}) {
  const { colors, scheme } = useTheme();
  const tone = listColors[routine.color][scheme];
  const total = routine.items.length;
  const done = routine.items.filter((i) => i.done).length;
  const past = today && routine.phase === 'past';
  const now = today && routine.phase === 'now';
  const meta = [
    past && total > 0 ? `${done} de ${total} feitos` : null,
    now ? `Agora · faltam ${durationLabel(routine.minutesLeft)}` : null,
    today && routine.phase === 'upcoming' ? `Em ${durationLabel(routine.minutesLeft)}` : null,
    routine.tag,
    ...extras,
    !today && total > 0 && extras.length === 0
      ? `${total} ${total === 1 ? 'item' : 'itens'}`
      : null,
  ].filter(Boolean);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${routine.name}, ${routine.start} às ${routine.end}${meta.length ? `, ${meta.join(', ')}` : ''}`}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: colors.surfaceRaised,
          borderColor: now ? tone : colors.border,
          opacity: past ? 0.6 : 1,
          transform: [{ scale: pressed ? 0.99 : 1 }],
        },
      ]}
    >
      <View style={[styles.bar, { backgroundColor: tone }]} />
      <View style={styles.time}>
        <Text variant="caption" tone="secondary">
          {routine.start}
        </Text>
        <Text variant="caption" tone="tertiary">
          {routine.end}
        </Text>
      </View>
      <View style={styles.flex}>
        <Text variant="headline" numberOfLines={1}>
          {routine.emoji ? `${routine.emoji}  ` : ''}
          {routine.name}
        </Text>
        {meta.length > 0 ? (
          <Text
            variant="footnote"
            numberOfLines={1}
            style={{ color: now ? tone : colors.textSecondary }}
          >
            {meta.join(' · ')}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.lg },
  empty: { textAlign: 'center', paddingVertical: spacing.xl },
  day: { gap: spacing.sm },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginHorizontal: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  bar: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
  time: { width: 44 },
  flex: { flex: 1, gap: 2 },
});
