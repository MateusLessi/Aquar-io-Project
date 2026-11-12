import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { addDays, fromDateKey, leadingBlanks, toDateKey, weekdayOrder } from '@/core/dates';
import { useCalendarPrefs } from '@/core/preferences/calendarPrefs';
import {
  Button,
  IconButton,
  Text,
  listColors,
  radius,
  spacing,
  useBreakpoint,
  useTheme,
  withAlpha,
} from '@/design-system';

import { routinesOn } from '../domain/schedule';
import type { RoutineToday } from '../domain/types';
import { AgendaRow } from './AgendaView';

const DAY_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];
const DAY_NAMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

export type MonthViewProps = {
  routines: RoutineToday[];
  todayKey: string;
  /** The chosen day: its month is shown, and its list below. */
  day: string;
  onDay: (day: string) => void;
  onOpen: (routine: RoutineToday, day: string) => void;
};

/** The month a few steps away from the month of `key`, on the same day where it exists. */
function shiftMonth(key: string, by: number): string {
  const d = fromDateKey(key);
  const target = new Date(d.getFullYear(), d.getMonth() + by, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d.getDate(), last));
  return toDateKey(target);
}

/**
 * The month as a calendar: each day shows what is on it (dots on a phone, names on wider
 * screens). Tapping a day lists it below.
 */
export function MonthView({ routines, todayKey, day, onDay, onOpen }: MonthViewProps) {
  const wide = useBreakpoint() !== 'compact';
  const { colors, scheme } = useTheme();
  const { weekStart } = useCalendarPrefs();
  const chosen = fromDateKey(day);
  const first = toDateKey(new Date(chosen.getFullYear(), chosen.getMonth(), 1));
  const length = new Date(chosen.getFullYear(), chosen.getMonth() + 1, 0).getDate();
  const blanks = leadingBlanks(fromDateKey(first).getDay(), weekStart);
  const cells: (string | null)[] = [
    ...Array.from({ length: blanks }, () => null),
    ...Array.from({ length }, (_, i) => addDays(first, i)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
  const thisMonth = todayKey.slice(0, 7) === day.slice(0, 7);
  const selected = routinesOn(routines, day);

  return (
    <View style={styles.root}>
      <View style={styles.nav}>
        <IconButton
          icon={ChevronLeft}
          label="Mês anterior"
          onPress={() => onDay(shiftMonth(day, -1))}
        />
        <Text variant="headline" style={styles.title} accessibilityRole="header">
          {MONTHS[chosen.getMonth()]} {chosen.getFullYear()}
        </Text>
        <IconButton
          icon={ChevronRight}
          label="Próximo mês"
          onPress={() => onDay(shiftMonth(day, 1))}
        />
        {!thisMonth || day !== todayKey ? (
          <Button label="Hoje" variant="ghost" onPress={() => onDay(todayKey)} />
        ) : null}
      </View>

      <View style={styles.row}>
        {weekdayOrder(weekStart).map((w) => (
          <Text key={w} variant="caption" tone="tertiary" style={styles.weekday}>
            {DAY_SHORT[w]}
          </Text>
        ))}
      </View>
      {weeks.map((week, i) => (
        <View key={i} style={styles.row}>
          {week.map((key, j) => {
            if (!key) return <View key={`blank-${j}`} style={[styles.cell, styles.blank]} />;
            const on = routinesOn(routines, key);
            const isToday = key === todayKey;
            const isChosen = key === day;
            const date = fromDateKey(key);
            return (
              <Pressable
                key={key}
                onPress={() => onDay(key)}
                accessibilityRole="button"
                accessibilityState={{ selected: isChosen }}
                accessibilityLabel={`${DAY_NAMES[date.getDay()]}, ${date.getDate()} de ${MONTHS[date.getMonth()]!.toLowerCase()}, ${
                  on.length === 0
                    ? 'nada marcado'
                    : `${on.length} ${on.length === 1 ? 'compromisso' : 'compromissos'}`
                }`}
                style={({ pressed }) => [
                  styles.cell,
                  wide && styles.wideCell,
                  {
                    backgroundColor: isChosen
                      ? colors.accentSoft
                      : pressed
                        ? colors.surfacePressed
                        : 'transparent',
                    borderColor: isToday ? colors.accent : 'transparent',
                  },
                ]}
              >
                <Text
                  variant={wide ? 'footnote' : 'body'}
                  tone={isToday || isChosen ? 'accent' : key < todayKey ? 'tertiary' : 'primary'}
                  style={wide && styles.wideNumber}
                >
                  {date.getDate()}
                </Text>
                {wide ? (
                  <View style={styles.names}>
                    {on.slice(0, 3).map((entry) => (
                      <Text
                        key={entry.id}
                        variant="caption"
                        numberOfLines={1}
                        style={[
                          styles.name,
                          {
                            backgroundColor: withAlpha(
                              listColors[entry.color][scheme],
                              scheme === 'dark' ? 0.28 : 0.18,
                            ),
                          },
                        ]}
                      >
                        {entry.name}
                      </Text>
                    ))}
                    {on.length > 3 ? (
                      <Text variant="caption" tone="tertiary">
                        +{on.length - 3}
                      </Text>
                    ) : null}
                  </View>
                ) : (
                  <View style={styles.dots}>
                    {on.slice(0, 4).map((entry) => (
                      <View
                        key={entry.id}
                        style={[styles.dot, { backgroundColor: listColors[entry.color][scheme] }]}
                      />
                    ))}
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      ))}

      <View style={styles.list}>
        <Text variant="overline" tone="tertiary" accessibilityRole="header">
          {day === todayKey ? 'Hoje' : `${DAY_NAMES[chosen.getDay()]}, ${chosen.getDate()}`}
        </Text>
        {selected.length === 0 ? (
          <Text variant="footnote" tone="secondary">
            Nada marcado neste dia.
          </Text>
        ) : (
          selected.map((entry) => (
            <AgendaRow
              key={entry.id}
              routine={entry}
              today={day === todayKey}
              extras={[]}
              onPress={() => onOpen(entry, day)}
            />
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  nav: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  title: { flex: 1, textAlign: 'center' },
  row: { flexDirection: 'row', gap: spacing.xs },
  weekday: { flex: 1, textAlign: 'center' },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs,
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  blank: { borderColor: 'transparent' },
  wideCell: { alignItems: 'stretch', minHeight: 92, paddingHorizontal: 4 },
  wideNumber: { alignSelf: 'flex-end', paddingRight: 2 },
  names: { gap: 2 },
  name: { borderRadius: radius.sm, paddingHorizontal: 4, overflow: 'hidden' },
  dots: { flexDirection: 'row', gap: 2, height: 5, marginTop: 4 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  list: { gap: spacing.sm, marginTop: spacing.lg },
});
