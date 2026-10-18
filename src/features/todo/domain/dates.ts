/**
 * Due dates are calendar days (`YYYY-MM-DD`), not instants: "due on the 20th" must not
 * move when the user travels to another time zone.
 */

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export function isDateKey(value: string): boolean {
  if (!DATE_KEY.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number) as [number, number, number];
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

/** The local calendar day of `date`. */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
}

export function addDays(key: string, days: number): string {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

export type DueStatus = 'overdue' | 'today' | 'tomorrow' | 'later';

export function dueStatus(dueDate: string, todayKey: string): DueStatus {
  if (dueDate < todayKey) return 'overdue';
  if (dueDate === todayKey) return 'today';
  if (dueDate === addDays(todayKey, 1)) return 'tomorrow';
  return 'later';
}

/** Short, friendly label: "Hoje", "Amanhã", "Ontem" or e.g. "seg., 20 de out.". */
export function dueLabel(dueDate: string, todayKey: string): string {
  if (dueDate === todayKey) return 'Hoje';
  if (dueDate === addDays(todayKey, 1)) return 'Amanhã';
  if (dueDate === addDays(todayKey, -1)) return 'Ontem';
  const date = fromDateKey(dueDate);
  const sameYear = date.getFullYear() === fromDateKey(todayKey).getFullYear();
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  }).format(date);
}

/** Quick picks offered when setting a due date. */
export function quickDueDates(todayKey: string) {
  return [
    { label: 'Hoje', value: todayKey },
    { label: 'Amanhã', value: addDays(todayKey, 1) },
    { label: 'Próxima semana', value: addDays(todayKey, 7) },
  ];
}
