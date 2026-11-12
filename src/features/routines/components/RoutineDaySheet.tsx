import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useCalendarPrefs } from '@/core/preferences/calendarPrefs';
import {
  Button,
  Sheet,
  Text,
  TimePicker,
  listColors,
  radius,
  spacing,
  useTheme,
} from '@/design-system';

import { toMinutes } from '../domain/schedule';
import type { RoutineToday } from '../domain/types';
import { longDate } from './EventEditorSheet';

type RoutineDaySheetProps = {
  /** The routine as it is on `day` (already at that day's times). */
  routine: RoutineToday | null;
  day: string;
  onClose: () => void;
  /** Edit the routine itself, for every day. */
  onEditAll: () => void;
  onSkip: () => Promise<void>;
  onMove: (start: string, end: string) => Promise<void>;
  /** Back to its usual time on that day. */
  onReset: () => Promise<void>;
};

/**
 * A routine on one day: change it only there (another time, or skip it this once) without
 * touching the rest of the week, or go edit the routine itself.
 */
export function RoutineDaySheet({ routine, day, onClose, ...actions }: RoutineDaySheetProps) {
  return (
    <Sheet visible={routine !== null} onClose={onClose} title={routine?.name}>
      {routine ? <DayForm routine={routine} day={day} onClose={onClose} {...actions} /> : null}
    </Sheet>
  );
}

function DayForm({
  routine,
  day,
  onClose,
  onEditAll,
  onSkip,
  onMove,
  onReset,
}: Omit<RoutineDaySheetProps, 'routine'> & { routine: RoutineToday }) {
  const { colors, scheme } = useTheme();
  const { showTime } = useCalendarPrefs();
  const [moving, setMoving] = useState(false);
  const [start, setStart] = useState(routine.start);
  const [end, setEnd] = useState(routine.end);
  const [editing, setEditing] = useState<'start' | 'end'>('start');
  const [busy, setBusy] = useState(false);
  const changed = Boolean(routine.overrides?.[day]);
  const tone = listColors[routine.color][scheme];
  const badTime = toMinutes(end) <= toMinutes(start);

  const run = (action: () => Promise<void>) => async () => {
    setBusy(true);
    try {
      await action();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.form}>
      <Text variant="body" tone="secondary">
        {longDate(day)} · {showTime(routine.start)}–{showTime(routine.end)}
        {changed ? ' · mudada só neste dia' : ''}
      </Text>

      {moving ? (
        <View style={styles.group}>
          <View style={styles.times}>
            {(['start', 'end'] as const).map((which) => (
              <Pressable
                key={which}
                onPress={() => setEditing(which)}
                accessibilityRole="button"
                accessibilityLabel={`${which === 'start' ? 'Começa' : 'Termina'} às ${showTime(which === 'start' ? start : end)}`}
                style={[
                  styles.field,
                  {
                    borderColor: editing === which ? tone : colors.border,
                    backgroundColor: colors.surfaceRaised,
                  },
                ]}
              >
                <Text variant="caption" tone="secondary">
                  {which === 'start' ? 'Começa' : 'Termina'}
                </Text>
                <Text variant="title2">{showTime(which === 'start' ? start : end)}</Text>
              </Pressable>
            ))}
          </View>
          <TimePicker
            value={editing === 'start' ? start : end}
            onChange={editing === 'start' ? setStart : setEnd}
          />
          {badTime ? (
            <Text variant="footnote" tone="error">
              O fim precisa ser depois do começo.
            </Text>
          ) : null}
          <Button
            label="Salvar só neste dia"
            block
            loading={busy}
            disabled={badTime}
            onPress={run(() => onMove(start, end))}
          />
          <Button label="Cancelar" variant="ghost" block onPress={() => setMoving(false)} />
        </View>
      ) : (
        <View style={styles.group}>
          <Text variant="footnote" tone="secondary" style={styles.label}>
            Só neste dia
          </Text>
          <Button label="Mudar o horário" variant="secondary" block onPress={() => setMoving(true)} />
          <Button
            label="Pular este dia"
            variant="secondary"
            block
            loading={busy}
            onPress={run(onSkip)}
          />
          {changed ? (
            <Button
              label="Voltar ao normal"
              variant="ghost"
              block
              loading={busy}
              onPress={run(onReset)}
            />
          ) : null}
          <Text variant="footnote" tone="secondary" style={[styles.label, styles.gap]}>
            Todos os dias
          </Text>
          <Button
            label="Editar rotina"
            block
            onPress={() => {
              onClose();
              onEditAll();
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  group: { gap: spacing.sm },
  label: { marginLeft: spacing.xs },
  gap: { marginTop: spacing.md },
  times: { flexDirection: 'row', gap: spacing.md },
  field: { flex: 1, borderWidth: 2, borderRadius: radius.lg, padding: spacing.md, gap: 2 },
});
