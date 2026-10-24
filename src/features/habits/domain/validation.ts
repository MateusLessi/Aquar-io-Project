import { isTimeOfDay } from '@/core/dates';

import { isCreatureId, type CreatureId } from './creatures';
import { habitKinds, type HabitKind, type WeekdayMask } from './types';

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

export const STEPS_MAX = 12;
export const UNIT_MAX = 20;
/** Upper bounds for a day's goal: units for `count`, minutes for `time`. */
export const TARGET_MAX = { count: 999, time: 600 } as const;

export function validateKind(kind: string): HabitKind {
  if (!(habitKinds as readonly string[]).includes(kind)) {
    throw new HabitValidationError('Escolha um tipo de hábito.');
  }
  return kind as HabitKind;
}

/** A whole number of units or minutes the day needs; `check` and `checklist` derive theirs. */
export function validateTarget(kind: 'count' | 'time', target: number): number {
  const max = TARGET_MAX[kind];
  if (!Number.isInteger(target) || target < 1 || target > max) {
    throw new HabitValidationError(
      kind === 'time' ? `Escolha entre 1 e ${max} minutos.` : `Escolha uma meta entre 1 e ${max}.`,
    );
  }
  return target;
}

export function validateUnit(unit: string | null | undefined): string | null {
  const text = (unit ?? '').trim().replace(/\s+/g, ' ');
  if (text.length > UNIT_MAX) throw new HabitValidationError(`Use no máximo ${UNIT_MAX} letras.`);
  return text || null;
}

export function validateStepTitles(titles: string[]): string[] {
  const clean = titles.map((t) => t.trim().replace(/\s+/g, ' ')).filter(Boolean);
  if (clean.length === 0) throw new HabitValidationError('Adicione pelo menos um passo.');
  if (clean.length > STEPS_MAX) {
    throw new HabitValidationError(`Use no máximo ${STEPS_MAX} passos.`);
  }
  if (clean.some((t) => t.length > HABIT_NAME_MAX)) {
    throw new HabitValidationError(`Cada passo pode ter até ${HABIT_NAME_MAX} caracteres.`);
  }
  return clean;
}
