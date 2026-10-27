import type { DataChanges } from '@/core/database/changes';
import type { Database } from '@/core/database/types';
import { addDays, toDateKey } from '@/core/dates';
import type { DomainEvent } from '@/core/events/events';
import type { EventLog } from '@/core/events/eventLog';
import type { ListColorName } from '@/design-system';

import { isRoutineDay, routinePhase } from '../domain/schedule';
import type { NewRoutine, Routine, RoutineItem, RoutineToday } from '../domain/types';
import {
  RoutineValidationError,
  validateRoutineColor,
  validateRoutineDays,
  validateRoutineItems,
  validateRoutineName,
  validateRoutineTag,
  validateRoutineTimes,
} from '../domain/validation';

export type RoutinesDeps = {
  db: Database;
  changes: DataChanges;
  events: EventLog;
  newId: () => string;
  now: () => Date;
};

type RoutineRow = {
  id: string;
  name: string;
  emoji: string | null;
  color: string;
  start_time: string;
  end_time: string;
  days: number;
  remind: number;
  tag: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};
type ItemRow = { id: string; routine_id: string; title: string; sort_order: number };

const ROUTINE_COLUMNS =
  'id, name, emoji, color, start_time, end_time, days, remind, tag, sort_order, created_at, updated_at';

function toRoutine(row: RoutineRow): Routine {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    color: row.color as ListColorName,
    start: row.start_time,
    end: row.end_time,
    days: row.days,
    remind: row.remind === 1,
    tag: row.tag,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const toItem = (row: ItemRow): RoutineItem => ({
  id: row.id,
  routineId: row.routine_id,
  title: row.title,
  sortOrder: row.sort_order,
});

/** One check per item and day; the id makes it the same row on every device. */
export const routineCheckId = (itemId: string, date: string) => `${itemId}:${date}`;

const minutesOf = (date: Date) => date.getHours() * 60 + date.getMinutes();

/**
 * All Routines reads and writes. Writes validate, stamp `updated_at` and announce the change;
 * checking an item records ROUTINE_ITEM_CHECKED / UNCHECKED in the same transaction.
 */
export function createRoutinesRepository({ db, changes, events, newId, now }: RoutinesDeps) {
  const timestamp = () => now().toISOString();

  async function listRoutines(): Promise<Routine[]> {
    const rows = await db.all<RoutineRow>(
      `SELECT ${ROUTINE_COLUMNS} FROM routines WHERE deleted_at IS NULL
       ORDER BY start_time, sort_order`,
    );
    return rows.map(toRoutine);
  }

  async function itemsOf(routineIds: string[]): Promise<Map<string, RoutineItem[]>> {
    const byRoutine = new Map(routineIds.map((id) => [id, [] as RoutineItem[]]));
    if (routineIds.length === 0) return byRoutine;
    const rows = await db.all<ItemRow>(
      `SELECT id, routine_id, title, sort_order FROM routine_items
       WHERE deleted_at IS NULL AND routine_id IN (${routineIds.map(() => '?').join(', ')})
       ORDER BY sort_order`,
      routineIds,
    );
    for (const row of rows) byRoutine.get(row.routine_id)?.push(toItem(row));
    return byRoutine;
  }

  async function checkedOn(date: string): Promise<Set<string>> {
    const rows = await db.all<{ item_id: string }>(
      'SELECT item_id FROM routine_checks WHERE date = ? AND deleted_at IS NULL',
      [date],
    );
    return new Set(rows.map((r) => r.item_id));
  }

  /** Makes the routine's items match `titles`: keeps matches, adds new ones, removes the rest. */
  async function syncItems(routineId: string, titles: string[], at: string) {
    const existing = (await itemsOf([routineId])).get(routineId) ?? [];
    const unused = [...existing];
    for (const [index, title] of titles.entries()) {
      const match = unused.findIndex((item) => item.title === title);
      if (match >= 0) {
        const [item] = unused.splice(match, 1);
        if (item!.sortOrder !== index) {
          await db.run('UPDATE routine_items SET sort_order = ?, updated_at = ? WHERE id = ?', [
            index,
            at,
            item!.id,
          ]);
        }
      } else {
        await db.run(
          `INSERT INTO routine_items (id, routine_id, title, sort_order, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [newId(), routineId, title, index, at, at],
        );
      }
    }
    for (const item of unused) {
      await db.run('UPDATE routine_items SET deleted_at = ?, updated_at = ? WHERE id = ?', [
        at,
        at,
        item.id,
      ]);
    }
  }

  function validate(input: NewRoutine) {
    return {
      name: validateRoutineName(input.name),
      emoji: input.emoji?.trim() || null,
      color: validateRoutineColor(input.color ?? 'lagoon'),
      ...validateRoutineTimes(input.start, input.end),
      days: validateRoutineDays(input.days ?? 0b1111111),
      remind: input.remind ? 1 : 0,
      tag: validateRoutineTag(input.tag),
      items: validateRoutineItems(input.items ?? []),
    };
  }

  return {
    listRoutines,

    /** Every routine as it stands at `at`: phase, time left and today's checklist. */
    async listToday(at: Date = now()): Promise<RoutineToday[]> {
      const todayKey = toDateKey(at);
      const routines = await listRoutines();
      const items = await itemsOf(routines.map((r) => r.id));
      const checked = await checkedOn(todayKey);
      return routines.map((routine) => ({
        ...routine,
        items: (items.get(routine.id) ?? []).map((item) => ({
          ...item,
          done: checked.has(item.id),
        })),
        ...routinePhase(routine, todayKey, minutesOf(at)),
      }));
    },

    async getRoutine(id: string): Promise<(Routine & { items: RoutineItem[] }) | null> {
      const row = await db.get<RoutineRow>(
        `SELECT ${ROUTINE_COLUMNS} FROM routines WHERE id = ? AND deleted_at IS NULL`,
        [id],
      );
      if (!row) return null;
      return { ...toRoutine(row), items: (await itemsOf([id])).get(id) ?? [] };
    },

    async createRoutine(input: NewRoutine): Promise<string> {
      const v = validate(input);
      const id = newId();
      const at = timestamp();
      await db.transaction(async () => {
        const max = await db.get<{ max: number | null }>(
          'SELECT MAX(sort_order) AS max FROM routines WHERE deleted_at IS NULL',
        );
        await db.run(
          `INSERT INTO routines (id, name, emoji, color, start_time, end_time, days, remind, tag,
             sort_order, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            v.name,
            v.emoji,
            v.color,
            v.start,
            v.end,
            v.days,
            v.remind,
            v.tag,
            (max?.max ?? 0) + 1,
            at,
            at,
          ],
        );
        await syncItems(id, v.items, at);
      });
      changes.notify('routines');
      return id;
    },

    /** Replaces the routine's fields and checklist (the editor always sends the whole thing). */
    async updateRoutine(id: string, input: NewRoutine): Promise<void> {
      const v = validate(input);
      const at = timestamp();
      await db.transaction(async () => {
        const { changes: updated } = await db.run(
          `UPDATE routines SET name = ?, emoji = ?, color = ?, start_time = ?, end_time = ?,
             days = ?, remind = ?, tag = ?, updated_at = ?
           WHERE id = ? AND deleted_at IS NULL`,
          [v.name, v.emoji, v.color, v.start, v.end, v.days, v.remind, v.tag, at, id],
        );
        if (updated === 0) throw new RoutineValidationError('Esta rotina não existe mais.');
        await syncItems(id, v.items, at);
      });
      changes.notify('routines');
    },

    async deleteRoutine(id: string): Promise<void> {
      const at = timestamp();
      await db.run(
        'UPDATE routines SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL',
        [at, at, id],
      );
      changes.notify('routines');
    },

    /** Checks or unchecks an item for a day. Setting the state it already has does nothing. */
    async setItemChecked(
      routineId: string,
      itemId: string,
      date: string,
      done: boolean,
    ): Promise<void> {
      const id = routineCheckId(itemId, date);
      const existing = await db.get<{ deleted_at: string | null }>(
        'SELECT deleted_at FROM routine_checks WHERE id = ?',
        [id],
      );
      if ((existing !== null && existing.deleted_at === null) === done) return;
      const at = timestamp();
      let event: DomainEvent | null = null;
      await db.transaction(async () => {
        await db.run(
          `INSERT INTO routine_checks (id, item_id, routine_id, date, created_at, updated_at, deleted_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET deleted_at = excluded.deleted_at,
             updated_at = excluded.updated_at`,
          [id, itemId, routineId, date, at, at, done ? null : at],
        );
        event = await events.record(
          done ? 'ROUTINE_ITEM_CHECKED' : 'ROUTINE_ITEM_UNCHECKED',
          { type: 'routine', id: routineId },
          { routineId, itemId, date },
        );
      });
      changes.notify('routines');
      if (event) events.publish(event);
    },

    /**
     * For statistics: every routine with its current number of items, and each item checked
     * between `from` and `to` (inclusive) with when it was marked.
     */
    async statsFacts(
      from: string,
      to: string,
    ): Promise<{
      routines: (Routine & { itemCount: number })[];
      checks: { routineId: string; day: string; at: string }[];
    }> {
      const routines = await listRoutines();
      const items = await itemsOf(routines.map((r) => r.id));
      const checks = await db.all<{ routine_id: string; date: string; updated_at: string }>(
        `SELECT c.routine_id, c.date, c.updated_at FROM routine_checks c
         JOIN routine_items i ON i.id = c.item_id AND i.deleted_at IS NULL
         WHERE c.deleted_at IS NULL AND c.date BETWEEN ? AND ?`,
        [from, to],
      );
      return {
        routines: routines.map((r) => ({ ...r, itemCount: items.get(r.id)?.length ?? 0 })),
        checks: checks.map((c) => ({ routineId: c.routine_id, day: c.date, at: c.updated_at })),
      };
    },

    /**
     * How many of each routine's items were checked on each day from `from` to `to` (inclusive),
     * keyed `<routine id>:<day>`. Items removed since then don't count.
     */
    async doneBetween(from: string, to: string): Promise<Map<string, number>> {
      const rows = await db.all<{ routine_id: string; day: string; done: number }>(
        `SELECT c.routine_id, c.date AS day, COUNT(*) AS done FROM routine_checks c
         JOIN routine_items i ON i.id = c.item_id AND i.deleted_at IS NULL
         WHERE c.deleted_at IS NULL AND c.date BETWEEN ? AND ?
         GROUP BY c.routine_id, c.date`,
        [from, to],
      );
      return new Map(rows.map((r) => [`${r.routine_id}:${r.day}`, r.done]));
    },

    /**
     * What gamification needs: checked items per day, and per scheduled day how many items
     * were due (today's checklist is used for past days) and done.
     */
    async progressFacts(todayKey: string = toDateKey(now())): Promise<{
      checks: { day: string }[];
      due: { day: string; total: number; done: number }[];
    }> {
      const checks = await db.all<{ day: string; routine_id: string }>(
        `SELECT c.date AS day, c.routine_id FROM routine_checks c
         JOIN routine_items i ON i.id = c.item_id
         WHERE c.deleted_at IS NULL AND c.date <= ?`,
        [todayKey],
      );
      const routines = await listRoutines();
      const items = await itemsOf(routines.map((r) => r.id));
      const doneByDay = new Map<string, number>();
      for (const check of checks)
        doneByDay.set(
          `${check.routine_id}:${check.day}`,
          (doneByDay.get(`${check.routine_id}:${check.day}`) ?? 0) + 1,
        );
      const due = new Map<string, { day: string; total: number; done: number }>();
      for (const routine of routines) {
        const count = items.get(routine.id)?.length ?? 0;
        if (count === 0) continue;
        for (
          let day = toDateKey(new Date(routine.createdAt));
          day <= todayKey;
          day = addDays(day, 1)
        ) {
          if (!isRoutineDay(routine.days, day)) continue;
          const entry = due.get(day) ?? { day, total: 0, done: 0 };
          entry.total += count;
          entry.done += Math.min(count, doneByDay.get(`${routine.id}:${day}`) ?? 0);
          due.set(day, entry);
        }
      }
      return { checks: checks.map((c) => ({ day: c.day })), due: [...due.values()] };
    },

    /** Routines that ring at their start, for scheduling notifications. */
    async listReminders(): Promise<Routine[]> {
      return (await listRoutines()).filter((r) => r.remind);
    },
  };
}

export type RoutinesRepository = ReturnType<typeof createRoutinesRepository>;
