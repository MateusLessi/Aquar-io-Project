import { addDays, fromDateKey, toDateKey, weekdayOf } from '@/core/dates';

/**
 * How a task repeats, stored as text: "daily", "weekly", "monthly" or "days:<mask>"
 * (weekday bitmask, bit 0 = Sunday), e.g. "days:62" for Monday to Friday.
 */
export type Repeat =
  { kind: 'daily' } | { kind: 'weekly' } | { kind: 'monthly' } | { kind: 'weekdays'; days: number };

export function parseRepeat(value: string | null): Repeat | null {
  if (value === 'daily' || value === 'weekly' || value === 'monthly') return { kind: value };
  const match = value?.match(/^days:(\d+)$/);
  if (match) {
    const days = Number(match[1]);
    if (days >= 1 && days <= 0b1111111) return { kind: 'weekdays', days };
  }
  return null;
}

export function formatRepeat(repeat: Repeat | null): string | null {
  if (!repeat) return null;
  return repeat.kind === 'weekdays' ? `days:${repeat.days}` : repeat.kind;
}

function addMonthsClamped(key: string, months: number, day: number): string {
  const date = fromDateKey(key);
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, last));
  return toDateKey(target);
}

/**
 * The next due date after completing a repeating task: the first occurrence after both the
 * current due date and today, so a task done late does not come back already overdue.
 */
export function nextDueDate(dueDate: string, repeat: Repeat, todayKey: string): string {
  const after = dueDate > todayKey ? dueDate : todayKey;
  switch (repeat.kind) {
    case 'daily':
      return addDays(after, 1);
    case 'weekly': {
      let next = addDays(dueDate, 7);
      while (next <= after) next = addDays(next, 7);
      return next;
    }
    case 'monthly': {
      // Keeps the original day of the month (the 31st falls back to the month's last day).
      const day = fromDateKey(dueDate).getDate();
      let months = 1;
      let next = addMonthsClamped(dueDate, months, day);
      while (next <= after) next = addMonthsClamped(dueDate, ++months, day);
      return next;
    }
    case 'weekdays': {
      let next = addDays(after, 1);
      while (!(repeat.days & (1 << weekdayOf(next)))) next = addDays(next, 1);
      return next;
    }
  }
}

export function repeatLabel(repeat: Repeat): string {
  switch (repeat.kind) {
    case 'daily':
      return 'Todo dia';
    case 'weekly':
      return 'Toda semana';
    case 'monthly':
      return 'Todo mês';
    case 'weekdays':
      return repeat.days === 0b0111110 ? 'Dias úteis' : 'Dias da semana';
  }
}
