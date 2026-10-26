import { isTimeOfDay } from '@/core/dates';
import { listColorNames, type ListColorName } from '@/design-system';

import { toMinutes } from './schedule';

export const ROUTINE_LIMITS = { name: 60, item: 120, items: 20, tag: 20 } as const;

/** A user-facing validation problem, with a message ready to show. */
export class RoutineValidationError extends Error {
  override name = 'RoutineValidationError';
}

const text = (value: string) => value.trim().replace(/\s+/g, ' ');

export function validateRoutineName(name: string): string {
  const value = text(name);
  if (!value) throw new RoutineValidationError('Dê um nome para a rotina.');
  if (value.length > ROUTINE_LIMITS.name) {
    throw new RoutineValidationError(`Use no máximo ${ROUTINE_LIMITS.name} caracteres.`);
  }
  return value;
}

export function validateRoutineColor(color: string): ListColorName {
  if (!(listColorNames as string[]).includes(color)) {
    throw new RoutineValidationError('Cor inválida.');
  }
  return color as ListColorName;
}

export function validateRoutineTimes(start: string, end: string): { start: string; end: string } {
  if (!isTimeOfDay(start) || !isTimeOfDay(end)) {
    throw new RoutineValidationError('Horário inválido.');
  }
  if (toMinutes(end) <= toMinutes(start)) {
    throw new RoutineValidationError('O fim precisa ser depois do começo.');
  }
  return { start, end };
}

export function validateRoutineDays(days: number): number {
  if (!Number.isInteger(days) || days < 1 || days > 0b1111111) {
    throw new RoutineValidationError('Escolha pelo menos um dia da semana.');
  }
  return days;
}

export function validateRoutineItems(items: string[]): string[] {
  const titles = items.map(text).filter(Boolean);
  if (titles.length > ROUTINE_LIMITS.items) {
    throw new RoutineValidationError(`Use no máximo ${ROUTINE_LIMITS.items} itens.`);
  }
  if (titles.some((t) => t.length > ROUTINE_LIMITS.item)) {
    throw new RoutineValidationError(`Cada item pode ter até ${ROUTINE_LIMITS.item} caracteres.`);
  }
  return titles;
}

/** An optional label: blank means none. */
export function validateRoutineTag(tag: string | null | undefined): string | null {
  const value = text(tag ?? '');
  if (!value) return null;
  if (value.length > ROUTINE_LIMITS.tag) {
    throw new RoutineValidationError(`A etiqueta pode ter até ${ROUTINE_LIMITS.tag} caracteres.`);
  }
  return value;
}
