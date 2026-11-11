import { Minus, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  SegmentedControl,
  Text,
  TextInput,
  fontFamily,
  radius,
  spacing,
  useTheme,
} from '@/design-system';

import type { Task, TaskKind } from '../domain/types';

const KIND_OPTIONS: { value: TaskKind; label: string }[] = [
  { value: 'check', label: 'Marcar' },
  { value: 'count', label: 'Contador' },
  { value: 'time', label: 'Tempo' },
];

/** The default goal when switching kinds: 3 of something, or 5 minutes. */
const DEFAULT_GOAL: Record<TaskKind, number | null> = { check: null, count: 3, time: 5 };

type Patch = { kind: TaskKind; target: number | null; unit: string | null };

/**
 * How the item is done: a tap, a counter ("4 séries") or a timer ("1 min"). Counters and
 * timers fill up, and the habit the list feeds fills with them.
 */
export function TaskKindField({
  task,
  onChange,
}: {
  task: Task;
  onChange: (patch: Patch) => void;
}) {
  const [unit, setUnit] = useState(task.unit ?? '');
  const goal = task.target ?? DEFAULT_GOAL[task.kind] ?? 1;
  const step = (delta: number) =>
    onChange({ kind: task.kind, target: Math.max(1, goal + delta), unit: task.unit });

  return (
    <View style={styles.root}>
      <SegmentedControl
        accessibilityLabel="Tipo do item"
        options={KIND_OPTIONS}
        value={task.kind}
        onChange={(kind) =>
          onChange({
            kind,
            target: kind === task.kind ? task.target : DEFAULT_GOAL[kind],
            unit: task.unit,
          })
        }
      />
      {task.kind !== 'check' ? (
        <View style={styles.goal}>
          <Stepper
            value={goal}
            label={task.kind === 'time' ? 'min' : unit.trim() || 'vezes'}
            onStep={step}
            what={task.kind === 'time' ? 'minutos' : 'meta'}
          />
          {task.kind === 'count' ? (
            <TextInput
              label="O que conta"
              value={unit}
              onChangeText={setUnit}
              onBlur={() => onChange({ kind: 'count', target: goal, unit })}
              placeholder="séries, copos, páginas…"
              returnKeyType="done"
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function Stepper({
  value,
  label,
  what,
  onStep,
}: {
  value: number;
  label: string;
  what: string;
  onStep: (delta: number) => void;
}) {
  const { colors } = useTheme();
  const button = (delta: number, Icon: typeof Plus, name: string) => (
    <Pressable
      onPress={() => onStep(delta)}
      accessibilityRole="button"
      accessibilityLabel={`${name} ${what}`}
      hitSlop={6}
      style={({ pressed }) => [
        styles.round,
        { backgroundColor: pressed ? colors.surfacePressed : colors.waterline },
      ]}
    >
      <Icon size={18} color={colors.textPrimary} />
    </Pressable>
  );
  return (
    <View
      style={[styles.stepper, { backgroundColor: colors.surfacePressed }]}
      accessibilityLabel={`Meta: ${value} ${label}`}
    >
      {button(-1, Minus, 'Menos')}
      <View style={styles.center}>
        <Text style={[styles.value, { color: colors.textPrimary }]}>{value}</Text>
        <Text variant="footnote" tone="secondary">
          {label}
        </Text>
      </View>
      {button(1, Plus, 'Mais')}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  goal: { gap: spacing.md },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    borderRadius: radius.lg,
  },
  round: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { alignItems: 'center' },
  value: { fontFamily: fontFamily.displayBold, fontSize: 26, lineHeight: 30 },
});
