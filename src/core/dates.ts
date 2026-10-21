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
