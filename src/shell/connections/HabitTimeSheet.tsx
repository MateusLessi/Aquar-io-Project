import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Chip, Sheet, Slider, Text, spacing } from '@/design-system';
import { toMinutes } from '@/features/routines/domain/schedule';

export type HabitTimeRequest = {
  habitName: string;
  routineName: string;
  start: string;
  end: string;
  /** The time it has now, if any. */
  at: string | null;
};

const pad = (n: number) => String(n).padStart(2, '0');
const toTime = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

/** "When, inside this routine?": a slider between the routine's start and end, or no time. */
export function HabitTimeSheet({
  request,
  onClose,
  onConfirm,
}: {
  request: HabitTimeRequest | null;
  onClose: () => void;
  onConfirm: (at: string | null) => void;
}) {
  return (
    <Sheet
      visible={request !== null}
      onClose={onClose}
      title={request ? `${request.habitName} em ${request.routineName}` : undefined}
    >
      {request ? (
        <TimeForm key={`${request.start}-${request.at}`} request={request} onConfirm={onConfirm} />
      ) : null}
    </Sheet>
  );
}

function TimeForm({
  request,
  onConfirm,
}: {
  request: HabitTimeRequest;
  onConfirm: (at: string | null) => void;
}) {
  const start = toMinutes(request.start);
  const end = toMinutes(request.end);
  const [minutes, setMinutes] = useState(request.at ? toMinutes(request.at) : start);
  return (
    <View style={styles.form}>
      <Text variant="footnote" tone="secondary">
        Em que horário, dentro de {request.start}–{request.end}?
      </Text>
      <Text variant="display" style={styles.time} accessibilityLiveRegion="polite">
        {toTime(minutes)}
      </Text>
      <Slider
        label="Horário dentro da rotina"
        value={minutes}
        onChange={setMinutes}
        min={start}
        max={Math.max(start, end - 5)}
        step={5}
        valueText={toTime}
      />
      <View style={styles.ends}>
        <Text variant="caption" tone="tertiary">
          {request.start}
        </Text>
        <Text variant="caption" tone="tertiary">
          {request.end}
        </Text>
      </View>
      <View style={styles.chips}>
        <Chip label="No começo" onPress={() => setMinutes(start)} selected={minutes === start} />
        <Chip label="Sem horário" onPress={() => onConfirm(null)} />
      </View>
      <Button label="Colocar na rotina" block onPress={() => onConfirm(toTime(minutes))} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  time: { textAlign: 'center', fontVariant: ['tabular-nums'] },
  ends: { flexDirection: 'row', justifyContent: 'space-between' },
  chips: { flexDirection: 'row', gap: spacing.sm },
});
