import { addDays, fromDateKey } from '@/core/dates';

// Due dates are calendar-day keys; the helpers live in core, shared with habits.
export { addDays, fromDateKey, isDateKey, toDateKey } from '@/core/dates';

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
