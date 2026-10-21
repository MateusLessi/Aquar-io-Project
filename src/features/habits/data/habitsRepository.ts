import type { DataChanges } from '@/core/database/changes';
import type { Database } from '@/core/database/types';
import { toDateKey } from '@/core/dates';
import type { DomainEvent } from '@/core/events/events';
import type { EventLog } from '@/core/events/eventLog';

import { isCreatureId } from '../domain/creatures';
import { habitProgress } from '../domain/progress';
import {
  EVERY_DAY,
  type Habit,
  type HabitPatch,
  type HabitWithProgress,
  type NewHabit,
} from '../domain/types';
import {
  HabitValidationError,
  validateCreature,
  validateDays,
  validateHabitName,
} from '../domain/validation';

export type HabitsDeps = {
  db: Database;
  changes: DataChanges;
  events: EventLog;
  newId: () => string;
  now: () => Date;
};

type HabitRow = {
  id: string;
  name: string;
  creature: string;
  days: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

const HABIT_COLUMNS = 'id, name, creature, days, sort_order, created_at, updated_at';

function toHabit(row: HabitRow): Habit {
  return {
    id: row.id,
    name: row.name,
    // A creature added by a newer app version falls back to the turtle here.
    creature: isCreatureId(row.creature) ? row.creature : 'turtle',
    days: row.days,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** One check-in per habit and day; the id makes it the same row on every device. */
export const checkId = (habitId: string, date: string) => `${habitId}:${date}`;

/**
 * All Habits reads and writes. Writes validate, stamp `updated_at`, and announce the change;
 * checking a habit records HABIT_CHECKED / HABIT_UNCHECKED in the same transaction.
 */
export function createHabitsRepository({ db, changes, events, newId, now }: HabitsDeps) {
  const timestamp = () => now().toISOString();

  async function doneDays(habitIds: string[]): Promise<Map<string, Set<string>>> {
    const byHabit = new Map(habitIds.map((id) => [id, new Set<string>()]));
    if (habitIds.length === 0) return byHabit;
    const rows = await db.all<{ habit_id: string; date: string }>(
      `SELECT habit_id, date FROM habit_checks
       WHERE deleted_at IS NULL AND habit_id IN (${habitIds.map(() => '?').join(', ')})`,
      habitIds,
    );
    for (const row of rows) byHabit.get(row.habit_id)?.add(row.date);
    return byHabit;
  }

  function withProgress(habit: Habit, done: Set<string>, todayKey: string): HabitWithProgress {
    const created = toDateKey(new Date(habit.createdAt));
    // A check-in from before creation (synced from a clock that was off) still counts.
    const startKey = [created, ...done].sort()[0]!;
    return {
      ...habit,
      ...habitProgress({ days: habit.days, done, startKey, todayKey }),
    };
  }

  async function getHabitRow(id: string): Promise<Habit | null> {
    const row = await db.get<HabitRow>(
      `SELECT ${HABIT_COLUMNS} FROM habits WHERE id = ? AND deleted_at IS NULL`,
      [id],
    );
    return row ? toHabit(row) : null;
  }

  return {
    async listHabits(todayKey: string = toDateKey(now())): Promise<HabitWithProgress[]> {
      const rows = await db.all<HabitRow>(
        `SELECT ${HABIT_COLUMNS} FROM habits WHERE deleted_at IS NULL ORDER BY sort_order`,
      );
      const habits = rows.map(toHabit);
      const done = await doneDays(habits.map((h) => h.id));
      return habits.map((h) => withProgress(h, done.get(h.id)!, todayKey));
    },

    /** One habit with its progress and every day it was done (for the calendar). */
    async getHabit(
      id: string,
      todayKey: string = toDateKey(now()),
    ): Promise<{ habit: HabitWithProgress; doneDays: string[] } | null> {
      const habit = await getHabitRow(id);
      if (!habit) return null;
      const done = (await doneDays([id])).get(id)!;
      return { habit: withProgress(habit, done, todayKey), doneDays: [...done].sort() };
    },

    async createHabit(input: NewHabit): Promise<string> {
      const name = validateHabitName(input.name);
      const creature = validateCreature(input.creature);
      const days = validateDays(input.days ?? EVERY_DAY);
      const id = newId();
      const at = timestamp();
      const max = await db.get<{ max: number | null }>(
        'SELECT MAX(sort_order) AS max FROM habits WHERE deleted_at IS NULL',
      );
      await db.run(
        `INSERT INTO habits (id, name, creature, days, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, name, creature, days, (max?.max ?? 0) + 1, at, at],
      );
      changes.notify('habits');
      return id;
    },

    async updateHabit(id: string, patch: HabitPatch): Promise<void> {
      const sets: string[] = [];
      const params: (string | number)[] = [];
      if (patch.name !== undefined) {
        sets.push('name = ?');
        params.push(validateHabitName(patch.name));
      }
      if (patch.creature !== undefined) {
        sets.push('creature = ?');
        params.push(validateCreature(patch.creature));
      }
      if (patch.days !== undefined) {
        sets.push('days = ?');
        params.push(validateDays(patch.days));
      }
      if (sets.length === 0) return;
      const { changes: updated } = await db.run(
        `UPDATE habits SET ${sets.join(', ')}, updated_at = ? WHERE id = ? AND deleted_at IS NULL`,
        [...params, timestamp(), id],
      );
      if (updated === 0) throw new HabitValidationError('Este hábito não existe mais.');
      changes.notify('habits');
    },

    /** Soft-deletes the habit; its check-ins stay for history but are no longer read. */
    async deleteHabit(id: string): Promise<void> {
      const at = timestamp();
      await db.run(
        'UPDATE habits SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL',
        [at, at, id],
      );
      changes.notify('habits');
    },

    /** Marks a day done or not. Setting the state it already has does nothing. */
    async setChecked(habitId: string, date: string, done: boolean): Promise<void> {
      if (!(await getHabitRow(habitId))) {
        throw new HabitValidationError('Este hábito não existe mais.');
      }
      const id = checkId(habitId, date);
      const existing = await db.get<{ deleted_at: string | null }>(
        'SELECT deleted_at FROM habit_checks WHERE id = ?',
        [id],
      );
      const isDone = existing !== null && existing.deleted_at === null;
      if (isDone === done) return;

      const at = timestamp();
      let event: DomainEvent | null = null;
      await db.transaction(async () => {
        await db.run(
          `INSERT INTO habit_checks (id, habit_id, date, created_at, updated_at, deleted_at)
           VALUES (?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET deleted_at = excluded.deleted_at,
             updated_at = excluded.updated_at`,
          [id, habitId, date, at, at, done ? null : at],
        );
        event = await events.record(
          done ? 'HABIT_CHECKED' : 'HABIT_UNCHECKED',
          { type: 'habit', id: habitId },
          { habitId, date },
        );
      });
      changes.notify('habits');
      if (event) events.publish(event);
    },
  };
}

export type HabitsRepository = ReturnType<typeof createHabitsRepository>;
