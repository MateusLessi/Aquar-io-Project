import { Pause, Play, Plus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text, fontFamily, haptics, radius, spacing, useTheme, withAlpha } from '@/design-system';

import type { Task } from '../domain/types';
import { useTodo } from '../hooks/todoContext';

/** `m:ss` (or `h:mm:ss`). */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rest = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${rest}` : `${m}:${rest}`;
}

/** Seconds done so far, counting a running timer. */
export function elapsedOf(task: Task, now = Date.now()): number {
  const running = task.timerStartedAt
    ? Math.max(0, (now - new Date(task.timerStartedAt).getTime()) / 1000)
    : 0;
  return task.amount + running;
}

/** What the row says about a counter or timer item: "2 de 4 séries", "0:40 de 1:00". */
export function amountLabel(task: Task, now = Date.now()): string | null {
  if (task.kind === 'count' && task.target) {
    return `${task.amount} de ${task.target}${task.unit ? ` ${task.unit}` : ''}`;
  }
  if (task.kind === 'time' && task.target) {
    return `${clock(elapsedOf(task, now))} de ${clock(task.target * 60)}`;
  }
  return null;
}

/**
 * The control at the end of a counter or timer item: "+1" for a counter, play/pause for a
 * timer. Reaching the goal completes the item (and the habit it feeds).
 */
export function TaskAmountControl({ task, tone }: { task: Task; tone: string }) {
  const todo = useTodo();
  const { colors } = useTheme();
  const running = Boolean(task.timerStartedAt);
  const [, tick] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  if (task.kind === 'check' || !task.target) return null;
  const fail = (error: unknown) => console.warn('Could not update the item.', error);

  if (task.kind === 'count') {
    return (
      <Pressable
        onPress={() => {
          haptics.light();
          todo.addAmount(task.id, 1).catch(fail);
        }}
        onLongPress={() => todo.addAmount(task.id, -1).catch(fail)}
        accessibilityRole="button"
        accessibilityLabel={`${task.title}: ${amountLabel(task)}. Somar 1`}
        accessibilityHint="Segure para tirar 1"
        hitSlop={8}
        style={[styles.pill, { backgroundColor: withAlpha(tone, 0.16) }]}
      >
        <Text style={[styles.value, { color: colors.textPrimary }]}>
          <Text style={[styles.value, { color: tone }]}>{task.amount}</Text>/{task.target}
        </Text>
        <View style={[styles.plus, { backgroundColor: tone }]}>
          <Plus size={14} strokeWidth={3} color={colors.surfaceBase} />
        </View>
      </Pressable>
    );
  }

  const Icon = running ? Pause : Play;
  return (
    <Pressable
      onPress={() => {
        haptics.light();
        (running ? todo.stopTimer(task.id) : todo.startTimer(task.id)).catch(fail);
      }}
      accessibilityRole="button"
      accessibilityLabel={`${task.title}: ${amountLabel(task)}. ${running ? 'Pausar' : 'Começar'}`}
      hitSlop={8}
      style={[styles.pill, { backgroundColor: withAlpha(tone, running ? 0.3 : 0.16) }]}
    >
      <Icon size={14} color={tone} fill={running ? tone : 'transparent'} />
      <Text style={[styles.value, { color: colors.textPrimary }]}>
        {clock(Math.max(0, task.target * 60 - elapsedOf(task)))}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs + 2,
    paddingVertical: spacing.xs + 1,
    borderRadius: radius.pill,
    minHeight: 34,
  },
  value: { fontFamily: fontFamily.textBold, fontSize: 14, fontVariant: ['tabular-nums'] },
  plus: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
