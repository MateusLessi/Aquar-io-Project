import { isDateKey, isTimeOfDay, weekdayOf } from '@/core/dates';

import { happensOn, toMinutes } from './schedule';
import type { AgendaEvent, EventRepeat, NewEvent, RoutineToday } from './types';
import { RoutineValidationError, validateRoutineColor } from './validation';

export const EVENT_LIMITS = { title: 80, notes: 500 } as const;
export const EVENT_REPEATS: EventRepeat[] = ['none', 'weekly', 'monthly', 'yearly'];

const text = (value: string) => value.trim().replace(/\s+/g, ' ');
const parts = (key: string) => key.split('-').map(Number) as [number, number, number];

/**
 * Whether an event happens on a day. A monthly event on the 31st happens on the last day of
 * shorter months, and a yearly one on 29 February on the 28th in other years: it is never
 * skipped for lack of a day.
 */
export function eventOccurs(event: Pick<AgendaEvent, 'date' | 'repeat'>, dateKey: string) {
  if (dateKey < event.date) return false;
  if (dateKey === event.date) return true;
  const [, month, day] = parts(event.date);
  const [year, m, d] = parts(dateKey);
  const lastDay = new Date(year, m, 0).getDate();
  switch (event.repeat) {
    case 'weekly':
      return weekdayOf(dateKey) === weekdayOf(event.date);
    case 'monthly':
      return d === Math.min(day, lastDay);
    case 'yearly':
      return m === month && d === Math.min(day, lastDay);
    default:
      return false;
  }
}

/** An event as an entry of the agenda, alongside routines. */
export function eventEntry(event: AgendaEvent): RoutineToday {
  const allDay = event.start === null;
  return {
    id: `event:${event.id}`,
    refId: event.id,
    source: 'event',
    name: event.title,
    emoji: event.emoji,
    color: event.color,
    start: event.start ?? '00:00',
    end: event.end ?? '23:59',
    allDay,
    days: 0b1111111,
    remind: event.remindBefore !== null,
    tag: null,
    sortOrder: 0,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
    items: [],
    phase: 'upcoming',
    minutesLeft: 0,
    occurs: (dateKey) => eventOccurs(event, dateKey),
  };
}

/** Validates and normalizes an event before it is stored. */
export function validateEvent(input: NewEvent) {
  const title = text(input.title);
  if (!title) throw new RoutineValidationError('Dê um nome para o evento.');
  if (title.length > EVENT_LIMITS.title) {
    throw new RoutineValidationError(`Use no máximo ${EVENT_LIMITS.title} caracteres.`);
  }
  if (!isDateKey(input.date)) throw new RoutineValidationError('Escolha uma data.');
  const start = input.start || null;
  const end = input.end || null;
  if ((start === null) !== (end === null)) {
    throw new RoutineValidationError('Escolha o começo e o fim, ou o dia todo.');
  }
  if (start !== null && end !== null) {
    if (!isTimeOfDay(start) || !isTimeOfDay(end)) {
      throw new RoutineValidationError('Horário inválido.');
    }
    if (toMinutes(end) <= toMinutes(start)) {
      throw new RoutineValidationError('O fim precisa ser depois do começo.');
    }
  }
  const repeat = input.repeat ?? 'none';
  if (!EVENT_REPEATS.includes(repeat)) throw new RoutineValidationError('Repetição inválida.');
  const remindBefore = input.remindBefore ?? null;
  if (remindBefore !== null && (!Number.isInteger(remindBefore) || remindBefore < 0)) {
    throw new RoutineValidationError('Lembrete inválido.');
  }
  const notes = input.notes ? input.notes.trim() : '';
  if (notes.length > EVENT_LIMITS.notes) {
    throw new RoutineValidationError(`As notas podem ter até ${EVENT_LIMITS.notes} caracteres.`);
  }
  return {
    title,
    emoji: input.emoji?.trim() || null,
    color: validateRoutineColor(input.color ?? 'coral'),
    date: input.date,
    start,
    end,
    repeat,
    remindBefore,
    notes: notes || null,
    listId: input.listId ?? null,
  };
}

/** Where an event or task entry stands today (routines get theirs from the repository). */
export function withPhase(entry: RoutineToday, todayKey: string, nowMinutes: number): RoutineToday {
  if (!happensOn(entry, todayKey)) return { ...entry, phase: 'rest', minutesLeft: 0 };
  if (entry.allDay) return { ...entry, phase: 'now', minutesLeft: 24 * 60 - nowMinutes };
  const start = toMinutes(entry.start);
  const end = toMinutes(entry.end);
  if (nowMinutes < start) return { ...entry, phase: 'upcoming', minutesLeft: start - nowMinutes };
  if (nowMinutes < end) return { ...entry, phase: 'now', minutesLeft: end - nowMinutes };
  return { ...entry, phase: 'past', minutesLeft: 0 };
}
