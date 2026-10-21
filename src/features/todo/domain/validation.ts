import { listColorNames, type ListColorName } from '@/design-system';

import { isTimeOfDay } from '@/core/dates';

import { isDateKey } from './dates';
import type { Priority } from './types';

export const LIMITS = { listName: 60, taskTitle: 300, notes: 5000 } as const;

/** A user-facing validation problem, with a message ready to show. */
export class ValidationError extends Error {
  override name = 'ValidationError';
}

function requiredText(value: string, max: number, what: string): string {
  const text = value.trim().replace(/\s+/g, ' ');
  if (!text) throw new ValidationError(`Dê um nome para ${what}.`);
  if (text.length > max) throw new ValidationError(`Use no máximo ${max} caracteres.`);
  return text;
}

export function validateListName(name: string): string {
  return requiredText(name, LIMITS.listName, 'a lista');
}

export function validateTaskTitle(title: string): string {
  return requiredText(title, LIMITS.taskTitle, 'a tarefa');
}

/** Empty notes are stored as null. */
export function validateNotes(notes: string | null | undefined): string | null {
  const text = notes?.trim() ?? '';
  if (!text) return null;
  if (text.length > LIMITS.notes) {
    throw new ValidationError(`As notas podem ter no máximo ${LIMITS.notes} caracteres.`);
  }
  return text;
}

export function validateDueDate(dueDate: string | null | undefined): string | null {
  if (dueDate == null) return null;
  if (!isDateKey(dueDate)) throw new ValidationError('Data inválida.');
  return dueDate;
}

export function validatePriority(priority: number | undefined): Priority {
  if (priority === undefined) return 0;
  if (priority === 0 || priority === 1 || priority === 2 || priority === 3) return priority;
  throw new ValidationError('Prioridade inválida.');
}

export function validateListColor(color: string | null | undefined): ListColorName | null {
  if (color == null) return null;
  if ((listColorNames as string[]).includes(color)) return color as ListColorName;
  throw new ValidationError('Cor inválida.');
}

export function validateRemindAt(time: string | null | undefined): string | null {
  if (time == null) return null;
  if (!isTimeOfDay(time)) throw new ValidationError('Horário inválido.');
  return time;
}

export const priorityLabels: Record<Priority, string> = {
  0: 'Nenhuma',
  1: 'Baixa',
  2: 'Média',
  3: 'Alta',
};
