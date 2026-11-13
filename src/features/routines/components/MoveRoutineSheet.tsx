import { CalendarCheck, Repeat } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { fromDateKey } from '@/core/dates';
import { useCalendarPrefs } from '@/core/preferences/calendarPrefs';
import { Button, Sheet, Text, spacing } from '@/design-system';

import type { RoutineToday } from '../domain/types';
import { longDate } from './EventEditorSheet';

/** "Só nesta quarta" / "Todas as quartas": Portuguese weekdays are feminine but two. */
const WEEKDAYS = [
  { one: 'neste domingo', all: 'Todos os domingos' },
  { one: 'nesta segunda', all: 'Todas as segundas' },
  { one: 'nesta terça', all: 'Todas as terças' },
  { one: 'nesta quarta', all: 'Todas as quartas' },
  { one: 'nesta quinta', all: 'Todas as quintas' },
  { one: 'nesta sexta', all: 'Todas as sextas' },
  { one: 'neste sábado', all: 'Todos os sábados' },
];

/** A routine dropped at another time or day. */
export type PendingMove = {
  routine: RoutineToday;
  fromDay: string;
  toDay: string;
  start: string;
  end: string;
};

/** After dragging a routine: only that day, or every week from now on. */
export function MoveRoutineSheet({
  move,
  onClose,
  onOnlyThisDay,
  onEveryWeek,
}: {
  move: PendingMove | null;
  onClose: () => void;
  onOnlyThisDay: (move: PendingMove) => Promise<void>;
  onEveryWeek: (move: PendingMove) => Promise<void>;
}) {
  const { showTime } = useCalendarPrefs();
  const [busy, setBusy] = useState(false);
  const run = (action: (m: PendingMove) => Promise<void>) => async () => {
    if (!move) return;
    setBusy(true);
    try {
      await action(move);
      onClose();
    } finally {
      setBusy(false);
    }
  };
  const to = move ? WEEKDAYS[fromDateKey(move.toDay).getDay()]! : null;
  const from = move ? WEEKDAYS[fromDateKey(move.fromDay).getDay()]! : null;
  const otherDay = move !== null && move.toDay !== move.fromDay;
  return (
    <Sheet
      visible={move !== null}
      onClose={onClose}
      title={move ? `${move.routine.name} às ${showTime(move.start)}` : undefined}
    >
      {move && to && from ? (
        <View style={styles.root}>
          <Text variant="body" tone="secondary">
            {otherDay
              ? `De ${longDate(move.fromDay)} para ${longDate(move.toDay)}.`
              : `${longDate(move.toDay).replace(/^./, (c) => c.toUpperCase())}.`}
          </Text>
          <Button
            label={`Só ${to.one}`}
            icon={CalendarCheck}
            block
            loading={busy}
            onPress={run(onOnlyThisDay)}
          />
          <Button
            label={otherDay ? `${from.all} → ${to.all.split(' ').pop()}` : to.all}
            icon={Repeat}
            variant="secondary"
            block
            loading={busy}
            onPress={run(onEveryWeek)}
          />
          <Button label="Cancelar" variant="ghost" block onPress={onClose} />
        </View>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({ root: { gap: spacing.sm } });
