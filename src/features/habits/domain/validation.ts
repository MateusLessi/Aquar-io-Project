import { isTimeOfDay } from '@/core/dates';

import { isCreatureId, type CreatureId } from './creatures';
import type { WeekdayMask } from './types';

export const HABIT_NAME_MAX = 60;
export const MAX_REMINDERS = 5;

/** A user-facing validation problem, with a message ready to show. */
export class HabitValidationError extends Error {
  override name = 'HabitValidationError';
}

export function validateHabitName(name: string): string {
  const text = name.trim().replace(/\s+/g, ' ');
  if (!text) throw new HabitValidationError('Dê um nome para o hábito.');
  if (text.length > HABIT_NAME_MAX) {
    throw new HabitValidationError(`Use no máximo ${HABIT_NAME_MAX} caracteres.`);
  }
  return text;
}

export function validateCreature(creature: string): CreatureId {
  if (!isCreatureId(creature)) throw new HabitValidationError('Escolha uma criatura.');
  return creature;
}

export function validateDays(days: WeekdayMask): WeekdayMask {
  if (!Number.isInteger(days) || days < 1 || days > 0b1111111) {
    throw new HabitValidationError('Escolha pelo menos um dia da semana.');
  }
  return days;
}

/** Unique, sorted times; at most MAX_REMINDERS. */
export function validateReminderTimes(times: string[]): string[] {
  const unique = [...new Set(times)].sort();
  if (unique.some((t) => !isTimeOfDay(t))) throw new HabitValidationError('Horário inválido.');
  if (unique.length > MAX_REMINDERS) {
    throw new HabitValidationError(`Use no máximo ${MAX_REMINDERS} lembretes por hábito.`);
  }
  return unique;
}
