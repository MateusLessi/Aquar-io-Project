import type { Habit, HabitKind } from './types';

/** Kind names and how each is shown, for pickers and labels. */
export const kindInfo: Record<HabitKind, { label: string; hint: string }> = {
  check: { label: 'Sim/não', hint: 'Um toque e pronto' },
  count: { label: 'Contador', hint: 'Some até a meta' },
  time: { label: 'Tempo', hint: 'Cronômetro até a meta' },
  checklist: { label: 'Checklist', hint: 'Passo a passo' },
};

/**
 * The day's goal in the units progress is stored in: units for `count`, seconds for `time`
 * (the target is in minutes), steps for `checklist`, 1 for `check`.
 */
export function goalOf(habit: Pick<Habit, 'kind' | 'target' | 'steps'>): number {
  switch (habit.kind) {
    case 'time':
      return habit.target * 60;
    case 'checklist':
      return Math.max(1, habit.steps.length);
    case 'count':
      return Math.max(1, habit.target);
    default:
      return 1;
  }
}

/** How full the capsule is, 0–1. A day marked done is full whatever the amount says. */
export function fillRatio(
  habit: Pick<Habit, 'kind' | 'target' | 'steps'>,
  amount: number,
  done: boolean,
): number {
  if (done) return 1;
  if (habit.kind === 'check') return 0;
  return Math.max(0, Math.min(1, amount / goalOf(habit)));
}

/** Whole minutes for display; time below a minute shows as 0. */
export const minutesOf = (seconds: number) => Math.floor(seconds / 60);

/** "3/8 copos", "12/20 min", "2/4 passos"; null for a yes/no habit. */
export function amountLabel(
  habit: Pick<Habit, 'kind' | 'target' | 'steps' | 'unit'>,
  amount: number,
): string | null {
  switch (habit.kind) {
    case 'count':
      return `${amount}/${habit.target}${habit.unit ? ` ${habit.unit}` : ''}`;
    case 'time':
      return `${minutesOf(amount)}/${habit.target} min`;
    case 'checklist':
      return `${amount}/${habit.steps.length} ${habit.steps.length === 1 ? 'passo' : 'passos'}`;
    default:
      return null;
  }
}

/** "12:04" from seconds; hours appear only when needed ("1:02:09"). */
export function clockLabel(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}
