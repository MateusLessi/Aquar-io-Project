import { useRouter } from 'expo-router';
import { useMemo } from 'react';

import { haptics } from '@/design-system';

import { goalOf } from '../domain/amount';
import type { HabitWithProgress } from '../domain/types';
import { useHabitsRepository } from './habitsContext';

/** What a person can do to a habit from a card, the dashboard or the detail screen. */
export type HabitActions = {
  /** Marks today done or not (every kind). */
  toggle: (habit: HabitWithProgress, done: boolean) => void;
  /** Adds units (count) or seconds (time) to today. */
  add: (habit: HabitWithProgress, delta: number) => void;
  setStep: (habit: HabitWithProgress, stepId: string, done: boolean) => void;
  /** Starts the timer and opens the dive, or stops a running timer. */
  toggleTimer: (habit: HabitWithProgress) => void;
  /** Starts the timer without leaving the screen. */
  startTimer: (habit: HabitWithProgress) => void;
  open: (habit: HabitWithProgress, options?: { dive?: boolean }) => void;
};

/** Reaching the goal deserves the success buzz; any other change, a light tick. */
function feel(completes: boolean) {
  if (completes) haptics.success();
  else haptics.selection();
}

export function useHabitActions(todayKey: string): HabitActions {
  const router = useRouter();
  const repository = useHabitsRepository();

  return useMemo(() => {
    const report = (e: unknown) => console.error(e);
    const open: HabitActions['open'] = (habit, options) =>
      router.push({
        pathname: '/aquarium/habits/[id]',
        params: options?.dive ? { id: habit.id, dive: '1' } : { id: habit.id },
      });
    return {
      toggle: (habit, done) => {
        feel(done);
        repository.setChecked(habit.id, todayKey, done).catch(report);
      },
      add: (habit, delta) => {
        const goal = goalOf(habit);
        feel(!habit.doneToday && habit.today.amount < goal && habit.today.amount + delta >= goal);
        repository.addAmount(habit.id, todayKey, delta).catch(report);
      },
      setStep: (habit, stepId, done) => {
        feel(done && !habit.doneToday && habit.today.stepsDone.length + 1 >= habit.steps.length);
        repository.setStep(habit.id, todayKey, stepId, done).catch(report);
      },
      startTimer: (habit) => {
        haptics.selection();
        repository.startTimer(habit.id, todayKey).catch(report);
      },
      toggleTimer: (habit) => {
        haptics.selection();
        if (habit.today.timerStartedAt) {
          repository.stopTimer(habit.id).catch(report);
        } else {
          repository.startTimer(habit.id, todayKey).catch(report);
          open(habit, { dive: true });
        }
      },
      open,
    };
  }, [repository, router, todayKey]);
}
