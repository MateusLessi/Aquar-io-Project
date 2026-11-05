/**
 * Calendar days as `YYYY-MM-DD` keys, in the device's local time. Due dates and habit check-ins
 * are days, not instants: "the 20th" must not move when the user travels to another time zone.
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

/** Day of the week of a key: 0 = Sunday … 6 = Saturday. */
export function weekdayOf(key: string): number {
  return fromDateKey(key).getDay();
}

const TIME_OF_DAY = /^([01]\d|2[0-3]):[0-5]\d$/;

/** A local time of day, `HH:MM` (24h), e.g. a reminder at "07:30". */
export function isTimeOfDay(value: string): boolean {
  return TIME_OF_DAY.test(value);
}

/** The local instant for a day key and a time of day. */
export function atTime(dateKey: string, time: string): Date {
  const date = fromDateKey(dateKey);
  const [h, m] = time.split(':').map(Number) as [number, number];
  date.setHours(h, m, 0, 0);
  return date;
}

/** The day a week starts on: 0 = Sunday, 1 = Monday. */
export type WeekStart = 0 | 1;

/** The first day of the week that holds `key`. */
export function startOfWeek(key: string, weekStart: WeekStart = 0): string {
  return addDays(key, -((weekdayOf(key) - weekStart + 7) % 7));
}

/** Weekday numbers (0 = Sunday) in display order. */
export function weekdayOrder(weekStart: WeekStart = 0): number[] {
  return Array.from({ length: 7 }, (_, i) => (i + weekStart) % 7);
}

/** Empty cells before day 1 in a month grid whose first column is `weekStart`. */
export function leadingBlanks(firstWeekday: number, weekStart: WeekStart = 0): number {
  return (firstWeekday - weekStart + 7) % 7;
}

/** "19:30" as the person reads time: unchanged in 24 h, "7:30 PM" in 12 h. */
export function formatTime(time: string, clock24 = true): string {
  if (clock24 || !isTimeOfDay(time)) return time;
  const [h, m] = time.split(':').map(Number) as [number, number];
  const suffix = h < 12 ? 'AM' : 'PM';
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${suffix}`;
}
