import { listColorNames, type ListColorName } from '@/design-system';

import { isTimeOfDay } from '@/core/dates';

import { isDateKey } from './dates';
import type { Priority, TaskKind } from './types';

export const LIMITS = { listName: 60, taskTitle: 300, notes: 5000 } as const;
/** Folders nest at most this deep: UnB › Semestre 3 › Cálculo is three. */
export const MAX_FOLDER_DEPTH = 4;

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

export function validateFolderName(name: string): string {
  return requiredText(name, LIMITS.listName, 'a pasta');
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

/** Goals an item can have: up to 999 units, or up to 10 hours. */
export const TASK_GOAL_LIMITS = { count: 999, time: 600, unit: 20 } as const;

/**
 * An item's kind and goal, consistent: `check` has no goal; `count` and `time` need one
 * (units, or minutes).
 */
export function validateTaskGoal(
  kind: TaskKind,
  target: number | null | undefined,
  unit: string | null | undefined,
): { kind: TaskKind; target: number | null; unit: string | null } {
  if (kind === 'check') return { kind, target: null, unit: null };
  const max = TASK_GOAL_LIMITS[kind];
  const goal = Math.round(Number(target));
  if (!Number.isFinite(goal) || goal < 1 || goal > max) {
    throw new ValidationError(
      kind === 'count' ? `Escolha uma meta de 1 a ${max}.` : `Escolha de 1 a ${max} minutos.`,
    );
  }
  const text = kind === 'count' ? (unit ?? '').trim().slice(0, TASK_GOAL_LIMITS.unit) : '';
  return { kind, target: goal, unit: text || null };
}

/** Where an item stands toward its goal: 0–1. A `check` item is 0 or 1. */
export function taskRatio(task: {
  kind: TaskKind;
  target: number | null;
  amount: number;
  completedAt: string | null;
}): number {
  if (task.completedAt) return 1;
  if (task.kind === 'check' || !task.target) return 0;
  const goal = task.kind === 'time' ? task.target * 60 : task.target;
  return Math.min(1, task.amount / goal);
}
