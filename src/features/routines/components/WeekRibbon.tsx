import { Pressable, StyleSheet, View } from 'react-native';

import { addDays, fromDateKey } from '@/core/dates';
import { Button, Text, listColors, radius, spacing, useTheme, withAlpha } from '@/design-system';

import {
  durationLabel,
  hourRange,
  routinesOn,
  toMinutes,
  weekDays,
  weekStartOf,
} from '../domain/schedule';
import type { RoutineToday } from '../domain/types';

const LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const DAY_NAMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const HEIGHT = 132;

type WeekRibbonProps = {
  routines: RoutineToday[];
  todayKey: string;
  nowMinutes: number;
  onDay: (day: string) => void;
  onSeeAll: () => void;
};

/** The next routine: later today, or the first one on the coming days. */
function nextRoutine(routines: RoutineToday[], todayKey: string) {
  const later = routines.find((r) => r.phase === 'upcoming');
  if (later) return { routine: later, when: `em ${durationLabel(later.minutesLeft)}` };
  for (let i = 1; i <= 7; i++) {
    const day = addDays(todayKey, i);
    const [first] = routinesOn(routines, day);
    if (first)
      return { routine: first, when: i === 1 ? 'amanhã' : DAY_NAMES[fromDateKey(day).getDay()] };
  }
  return null;
}

/**
 * "Sua semana" on the dashboard: the week's routines as a small map (one column per day, each
 * routine a bar at its hours), today lit with the "now" line, and what comes next.
 */
export function WeekRibbon({ routines, todayKey, nowMinutes, onDay, onSeeAll }: WeekRibbonProps) {
  const { colors, scheme } = useTheme();
  if (routines.length === 0) return null;
  const days = weekDays(weekStartOf(todayKey));
  const hours = hourRange(routines);
  const y = (minutes: number) =>
    ((minutes - hours.from * 60) / ((hours.to - hours.from) * 60)) * HEIGHT;
  const next = nextRoutine(routines, todayKey);

  return (
    <View
      style={[styles.card, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}
    >
      <View style={styles.header}>
        <Text variant="overline" tone="tertiary">
          Sua semana
        </Text>
        <Button label="Abrir Rotinas" variant="ghost" onPress={onSeeAll} />
      </View>
      <View style={styles.columns}>
        {days.map((day) => {
          const today = day === todayKey;
          const on = routinesOn(routines, day);
          const date = fromDateKey(day);
          return (
            <Pressable
              key={day}
              onPress={() => onDay(day)}
              accessibilityRole="button"
              accessibilityLabel={`${DAY_NAMES[date.getDay()]} ${date.getDate()}: ${
                on.length === 0
                  ? 'sem rotinas'
                  : on.map((r) => `${r.name} às ${r.start}`).join(', ')
              }`}
              style={styles.day}
            >
              <View
                style={[
                  styles.column,
                  {
                    backgroundColor: today
                      ? withAlpha(colors.accent, 0.12)
                      : withAlpha(colors.textPrimary, 0.04),
                    borderColor: today ? withAlpha(colors.accent, 0.5) : 'transparent',
                  },
                ]}
              >
                {on.map((r) => (
                  <View
                    key={r.id}
                    style={[
                      styles.bar,
                      {
                        top: y(toMinutes(r.start)),
                        height: Math.max(4, y(toMinutes(r.end)) - y(toMinutes(r.start)) - 1),
                        backgroundColor: listColors[r.color][scheme],
                        opacity: day < todayKey || (today && r.phase === 'past') ? 0.45 : 1,
                      },
                    ]}
                  />
                ))}
                {today && nowMinutes >= hours.from * 60 && nowMinutes <= hours.to * 60 ? (
                  <View
                    style={[styles.now, { top: y(nowMinutes), backgroundColor: colors.energy }]}
                  />
                ) : null}
              </View>
              <Text variant="caption" tone={today ? 'accent' : 'tertiary'}>
                {LETTERS[date.getDay()]}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {next ? (
        <View style={[styles.next, { borderTopColor: colors.separator }]}>
          <View
            style={[
              styles.emoji,
              { backgroundColor: withAlpha(listColors[next.routine.color][scheme], 0.22) },
            ]}
          >
            <Text variant="headline">{next.routine.emoji ?? '⏱️'}</Text>
          </View>
          <View style={styles.flex}>
            <Text variant="headline" numberOfLines={1}>
              Próxima: {next.routine.name}
            </Text>
            <Text variant="footnote" tone="secondary">
              {next.routine.start}–{next.routine.end} · {next.when}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  columns: { flexDirection: 'row', gap: spacing.xs },
  day: { flex: 1, alignItems: 'center', gap: spacing.xs },
  column: {
    alignSelf: 'stretch',
    height: HEIGHT,
    borderRadius: radius.sm,
    borderWidth: 1,
    overflow: 'hidden',
  },
  bar: { position: 'absolute', left: 3, right: 3, borderRadius: 3 },
  now: { position: 'absolute', left: 0, right: 0, height: 2 },
  next: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.md,
    marginTop: spacing.xs,
  },
  emoji: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
});
