import type { CreatureId } from '@/features/habits/domain/creatures';
import type { HabitWithProgress } from '@/features/habits/domain/types';
import type { ListColorName } from '@/design-system';
import type { TaskWithList } from '@/features/todo/domain/types';

/** A timer running anywhere in the app: a time habit, or a time item of a list. */
export type RunningTimer =
  | {
      kind: 'habit';
      id: string;
      name: string;
      creature: CreatureId;
      startedAt: string;
      /** Seconds done before this run started (today). */
      before: number;
      goal: number;
      habit: HabitWithProgress;
    }
  | {
      kind: 'task';
      id: string;
      name: string;
      /** The list it belongs to ("Treino A"). */
      listName: string;
      listId: string;
      color: ListColorName | null;
      startedAt: string;
      before: number;
      goal: number;
    };

/** Every running timer, the one started first first. */
export function runningTimers(
  habits: readonly HabitWithProgress[],
  tasks: readonly TaskWithList[],
): RunningTimer[] {
  const fromHabits: RunningTimer[] = habits
    .filter((h) => h.kind === 'time' && h.today.timerStartedAt)
    .map((h) => ({
      kind: 'habit',
      id: h.id,
      name: h.name,
      creature: h.creature,
      startedAt: h.today.timerStartedAt!,
      before: h.today.amount,
      goal: h.target * 60,
      habit: h,
    }));
  const fromTasks: RunningTimer[] = tasks
    .filter((t) => t.kind === 'time' && t.timerStartedAt && !t.completedAt)
    .map((t) => ({
      kind: 'task',
      id: t.id,
      name: t.title,
      listName: t.listName,
      listId: t.listId,
      color: t.listColor,
      startedAt: t.timerStartedAt!,
      before: t.amount,
      goal: (t.target ?? 0) * 60,
    }));
  return [...fromHabits, ...fromTasks].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
}

/** Seconds on the clock now: what was done before plus this run. */
export function elapsedOf(timer: RunningTimer, now: number): number {
  return timer.before + Math.max(0, Math.floor((now - new Date(timer.startedAt).getTime()) / 1000));
}

/** "7:32", "1:02:09". */
export function clock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rest = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${rest}` : `${m}:${rest}`;
}
