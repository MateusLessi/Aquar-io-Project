import { addDays, atTime, toDateKey } from '@/core/dates';
import type { Reminder } from '@/core/notifications';
import { creatures } from '@/features/habits/domain/creatures';
import { isScheduled } from '@/features/habits/domain/progress';
import type { HabitWithProgress } from '@/features/habits/domain/types';
import { isRoutineDay } from '@/features/routines/domain/schedule';
import type { Routine } from '@/features/routines/domain/types';
import type { TaskReminder } from '@/features/todo/domain/types';

/** How far ahead reminders are scheduled; the plan is redone whenever the app opens. */
export const HORIZON_DAYS = 7;
/** iOS keeps at most 64 scheduled notifications per app; leave some room. */
export const MAX_SCHEDULED = 60;

/**
 * Turns habits and tasks into the notifications for the coming days. Pure, so it is easy to
 * test: habit reminders on scheduled days (skipping today once it is done) and task reminders
 * on their due date. Only future moments, soonest first, at most MAX_SCHEDULED.
 */
export function planReminders({
  habits,
  tasks,
  routines = [],
  now,
}: {
  habits: HabitWithProgress[];
  tasks: TaskReminder[];
  /** Routines that ring when they start. */
  routines?: Routine[];
  now: Date;
}): Reminder[] {
  const todayKey = toDateKey(now);
  const lastKey = addDays(todayKey, HORIZON_DAYS - 1);
  const plan: Reminder[] = [];

  for (let offset = 0; offset < HORIZON_DAYS; offset++) {
    const day = addDays(todayKey, offset);
    for (const habit of habits) {
      if (!isScheduled(habit.days, day) || (offset === 0 && habit.doneToday)) continue;
      const creature = creatures[habit.creature];
      for (const time of habit.reminderTimes) {
        plan.push({
          id: `habit:${habit.id}:${day}T${time}`,
          at: atTime(day, time),
          title: `${creature.emoji} ${habit.name}`,
          body: 'Hora de cuidar deste hábito. Toque para abrir.',
          url: `/habits/${habit.id}`,
        });
      }
    }
  }

  for (let offset = 0; offset < HORIZON_DAYS; offset++) {
    const day = addDays(todayKey, offset);
    for (const routine of routines) {
      if (!routine.remind || !isRoutineDay(routine.days, day)) continue;
      plan.push({
        id: `routine:${routine.id}:${day}T${routine.start}`,
        at: atTime(day, routine.start),
        title: `${routine.emoji ?? '⏱️'} ${routine.name}`,
        body: `Começa agora, até ${routine.end}.`,
        url: '/routines',
      });
    }
  }

  for (const task of tasks) {
    if (task.dueDate > lastKey) continue;
    plan.push({
      id: `task:${task.id}:${task.dueDate}T${task.remindAt}`,
      at: atTime(task.dueDate, task.remindAt),
      title: `⏰ ${task.title}`,
      body: [task.listEmoji, task.listName].filter(Boolean).join(' '),
      url: `/lists/${task.listId}`,
    });
  }

  return plan
    .filter((reminder) => reminder.at.getTime() > now.getTime())
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, MAX_SCHEDULED);
}
