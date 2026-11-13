import { addDays, atTime, toDateKey } from '@/core/dates';
import type { Reminder } from '@/core/notifications';
import { goalOf } from '@/features/habits/domain/amount';
import { isScheduled } from '@/features/habits/domain/progress';
import type { HabitWithProgress } from '@/features/habits/domain/types';
import { eventOccurs } from '@/features/routines/domain/agenda';
import { isRoutineDay } from '@/features/routines/domain/schedule';
import type { AgendaEvent, Routine, RoutineOverride } from '@/features/routines/domain/types';
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
  events = [],
  now,
}: {
  habits: HabitWithProgress[];
  tasks: TaskReminder[];
  /** Routines that ring when they start (with their one-day changes). */
  routines?: (Routine & { overrides?: Record<string, RoutineOverride> })[];
  /** Events with a reminder. */
  events?: AgendaEvent[];
  now: Date;
}): Reminder[] {
  const todayKey = toDateKey(now);
  const lastKey = addDays(todayKey, HORIZON_DAYS - 1);
  const plan: Reminder[] = [];

  for (let offset = 0; offset < HORIZON_DAYS; offset++) {
    const day = addDays(todayKey, offset);
    for (const habit of habits) {
      if (!isScheduled(habit.days, day) || (offset === 0 && habit.doneToday)) continue;
      for (const time of habit.reminderTimes) {
        plan.push({
          id: `habit:${habit.id}:${day}T${time}`,
          at: atTime(day, time),
          title: habit.name,
          body: 'Hora de cuidar deste hábito. Toque para abrir.',
          url: `/aquarium/habits/${habit.id}`,
        });
      }
    }
  }

  // A running timer rings when it reaches the day's goal, even with the app closed.
  for (const habit of habits) {
    const startedAt = habit.today.timerStartedAt;
    if (habit.kind !== 'time' || !startedAt || habit.doneToday) continue;
    const left = goalOf(habit) - habit.today.amount;
    plan.push({
      id: `timer:${habit.id}:${startedAt}`,
      at: new Date(new Date(startedAt).getTime() + left * 1000),
      title: `Meta de ${habit.name} alcançada!`,
      body: `${habit.target} min hoje. Toque para parar o cronômetro.`,
      url: `/aquarium/habits/${habit.id}?dive=1`,
    });
  }

  for (let offset = 0; offset < HORIZON_DAYS; offset++) {
    const day = addDays(todayKey, offset);
    for (const routine of routines) {
      if (!routine.remind) continue;
      // Skipped that day, at another time that day only, or moved there from another day.
      const change = routine.overrides?.[day];
      if (change?.skip) continue;
      if (!isRoutineDay(routine.days, day) && !change?.start) continue;
      const start = change?.start ?? routine.start;
      const end = change?.end ?? routine.end;
      plan.push({
        id: `routine:${routine.id}:${day}T${start}`,
        at: atTime(day, start),
        title: routine.name,
        body: `Começa agora, até ${end}.`,
        url: '/aquarium?tab=routines',
      });
    }
  }

  // Events ring some time before; one the day before rings on that day, so look a day further.
  for (let offset = 0; offset <= HORIZON_DAYS; offset++) {
    const day = addDays(todayKey, offset);
    for (const event of events) {
      if (event.remindBefore === null || !eventOccurs(event, day)) continue;
      // A whole-day event rings at 09:00 that day, or at 20:00 the evening before.
      const at = event.start
        ? new Date(atTime(day, event.start).getTime() - event.remindBefore * 60_000)
        : event.remindBefore >= 1440
          ? atTime(addDays(day, -1), '20:00')
          : atTime(day, '09:00');
      const body = event.start
        ? event.remindBefore === 0
          ? `Agora, até ${event.end}.`
          : `${event.remindBefore >= 1440 ? 'Amanhã' : 'Hoje'} às ${event.start}.`
        : event.remindBefore >= 1440
          ? 'Amanhã, o dia todo.'
          : 'Hoje, o dia todo.';
      plan.push({
        id: `event:${event.id}:${day}`,
        at,
        title: event.title,
        body,
        url: `/aquarium?tab=routines&view=agenda`,
      });
    }
  }

  for (const task of tasks) {
    if (task.dueDate > lastKey) continue;
    plan.push({
      id: `task:${task.id}:${task.dueDate}T${task.remindAt}`,
      at: atTime(task.dueDate, task.remindAt),
      title: task.title,
      body: [task.listEmoji, task.listName].filter(Boolean).join(' '),
      url: `/aquarium/lists/${task.listId}`,
    });
  }

  return plan
    .filter((reminder) => reminder.at.getTime() > now.getTime())
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, MAX_SCHEDULED);
}

/** "22:00-07:00": no reminder rings in this window (it may cross midnight). */
export type QuietHours = { from: string; to: string };

export function parseQuietHours(value: string | null | undefined): QuietHours | null {
  const match = /^(\d{2}:\d{2})-(\d{2}:\d{2})$/.exec(value ?? '');
  return match && match[1] !== match[2] ? { from: match[1]!, to: match[2]! } : null;
}

/** Whether a moment falls in the quiet hours (start included, end excluded). */
export function inQuietHours(at: Date, quiet: QuietHours): boolean {
  const minutes = at.getHours() * 60 + at.getMinutes();
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
  const from = toMin(quiet.from);
  const to = toMin(quiet.to);
  return from < to ? minutes >= from && minutes < to : minutes >= from || minutes < to;
}
