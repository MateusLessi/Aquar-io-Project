import type { DataChanges } from '@/core/database/changes';
import type { Database } from '@/core/database/types';
import { addDays, toDateKey, weekdayOf } from '@/core/dates';
import type { DomainEvent } from '@/core/events/events';
import type { EventLog } from '@/core/events/eventLog';

import { fillRatio, goalOf } from '../domain/amount';
import { isCreatureId } from '../domain/creatures';
import { habitProgress, isScheduled } from '../domain/progress';
import { creatureStage } from '../domain/stages';
import {
  EVERY_DAY,
  habitKinds,
  type Habit,
  type HabitKind,
  type HabitPatch,
  type HabitStep,
  type HabitToday,
  type HabitWithProgress,
  type NewHabit,
} from '../domain/types';
import {
  HabitValidationError,
  validateCreature,
  validateDays,
  validateHabitName,
  validateKind,
  validateReminderTimes,
  validateStepTitles,
  validateTarget,
  validateUnit,
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
  reminder_times: string | null;
  kind: string;
  target: number;
  unit: string | null;
  steps: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

const HABIT_COLUMNS =
  'id, name, creature, days, reminder_times, kind, target, unit, steps, sort_order, created_at, updated_at';

type DayProgress = { amount: number; stepsDone: string[] };

function parseSteps(text: string | null): HabitStep[] {
  if (!text) return [];
  try {
    const value: unknown = JSON.parse(text);
    return Array.isArray(value)
      ? value.filter(
          (s): s is HabitStep =>
            typeof s === 'object' &&
            s !== null &&
            typeof s.id === 'string' &&
            typeof s.title === 'string',
        )
      : [];
  } catch {
    return [];
  }
}

function parseIds(text: string | null): string[] {
  if (!text) return [];
  try {
    const value: unknown = JSON.parse(text);
    return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function toHabit(row: HabitRow): Habit {
  return {
    id: row.id,
    name: row.name,
    // A creature added by a newer app version falls back to the turtle here.
    creature: isCreatureId(row.creature) ? row.creature : 'turtle',
    days: row.days,
    reminderTimes: row.reminder_times ? row.reminder_times.split(',') : [],
    // A kind added by a newer app version behaves as a yes/no habit here.
    kind: (habitKinds as readonly string[]).includes(row.kind) ? (row.kind as HabitKind) : 'check',
    target: row.target,
    unit: row.unit,
    steps: parseSteps(row.steps),
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

  /** Partial progress per habit and day, between two days (inclusive). */
  async function progressBetween(
    habitIds: string[],
    from: string,
    to: string,
  ): Promise<Map<string, Map<string, DayProgress>>> {
    const byHabit = new Map(habitIds.map((id) => [id, new Map<string, DayProgress>()]));
    if (habitIds.length === 0) return byHabit;
    const rows = await db.all<{
      habit_id: string;
      date: string;
      amount: number;
      steps_done: string | null;
    }>(
      `SELECT habit_id, date, amount, steps_done FROM habit_progress
       WHERE deleted_at IS NULL AND date BETWEEN ? AND ?
         AND habit_id IN (${habitIds.map(() => '?').join(', ')})`,
      [from, to, ...habitIds],
    );
    for (const row of rows) {
      byHabit
        .get(row.habit_id)
        ?.set(row.date, { amount: row.amount, stepsDone: parseIds(row.steps_done) });
    }
    return byHabit;
  }

  async function runningTimers(): Promise<Map<string, { date: string; startedAt: string }>> {
    const rows = await db.all<{ habit_id: string; date: string; started_at: string }>(
      'SELECT habit_id, date, started_at FROM habit_timers',
    );
    return new Map(rows.map((r) => [r.habit_id, { date: r.date, startedAt: r.started_at }]));
  }

  /** A checklist's amount is the steps done that still exist, whatever the row says. */
  function amountOf(habit: Habit, progress: DayProgress | undefined): number {
    if (!progress) return 0;
    if (habit.kind !== 'checklist') return progress.amount;
    const ids = new Set(habit.steps.map((s) => s.id));
    return progress.stepsDone.filter((id) => ids.has(id)).length;
  }

  function withProgress(
    habit: Habit,
    done: Set<string>,
    todayKey: string,
    progress: Map<string, DayProgress> = new Map(),
    timer?: { date: string; startedAt: string },
  ): HabitWithProgress {
    const created = toDateKey(new Date(habit.createdAt));
    // A check-in from before creation (synced from a clock that was off) still counts.
    const startKey = [created, ...done].sort()[0]!;
    const base = habitProgress({ days: habit.days, done, startKey, todayKey });
    const amount = amountOf(habit, progress.get(todayKey));
    const today: HabitToday = {
      amount,
      stepsDone: progress.get(todayKey)?.stepsDone ?? [],
      ratio: fillRatio(habit, amount, base.doneToday),
      timerStartedAt: timer?.startedAt ?? null,
    };
    const sunday = addDays(todayKey, -weekdayOf(todayKey));
    const weekRatios = Array.from({ length: 7 }, (_, i) => {
      const key = addDays(sunday, i);
      return fillRatio(habit, amountOf(habit, progress.get(key)), done.has(key));
    });
    return {
      ...habit,
      ...base,
      stage: creatureStage(habit.creature, done.size),
      today,
      weekRatios,
    };
  }

  async function getHabitRow(id: string): Promise<Habit | null> {
    const row = await db.get<HabitRow>(
      `SELECT ${HABIT_COLUMNS} FROM habits WHERE id = ? AND deleted_at IS NULL`,
      [id],
    );
    return row ? toHabit(row) : null;
  }

  async function requireHabit(id: string): Promise<Habit> {
    const habit = await getHabitRow(id);
    if (!habit) throw new HabitValidationError('Este hábito não existe mais.');
    return habit;
  }

  /**
   * The columns that depend on the kind, validated together. Steps keep their id when the
   * caller passes it, so a renamed step stays checked today.
   */
  function shape(
    kind: HabitKind,
    input: Pick<NewHabit, 'target' | 'unit' | 'steps'>,
    existing?: Habit,
  ): { target: number; unit: string | null; steps: HabitStep[] } {
    switch (kind) {
      case 'count':
        return {
          target: validateTarget('count', input.target ?? existing?.target ?? 1),
          unit: validateUnit(input.unit !== undefined ? input.unit : existing?.unit),
          steps: [],
        };
      case 'time':
        return {
          target: validateTarget('time', input.target ?? existing?.target ?? 10),
          unit: null,
          steps: [],
        };
      case 'checklist': {
        const given = input.steps ?? existing?.steps ?? [];
        const titles = validateStepTitles(given.map((s) => s.title));
        const known = new Set(existing?.steps.map((s) => s.id));
        const kept = given.filter((s) => s.title.trim());
        const steps = titles.map((title, i) => {
          const id = kept[i]?.id;
          return { id: id && known.has(id) ? id : newId(), title };
        });
        return { target: steps.length, unit: null, steps };
      }
      default:
        return { target: 1, unit: null, steps: [] };
    }
  }

  async function readProgress(habitId: string, date: string): Promise<DayProgress | undefined> {
    const row = await db.get<{ amount: number; steps_done: string | null }>(
      'SELECT amount, steps_done FROM habit_progress WHERE id = ? AND deleted_at IS NULL',
      [checkId(habitId, date)],
    );
    return row ? { amount: row.amount, stepsDone: parseIds(row.steps_done) } : undefined;
  }

  async function writeProgress(habitId: string, date: string, progress: DayProgress) {
    const at = timestamp();
    await db.run(
      `INSERT INTO habit_progress
         (id, habit_id, date, amount, steps_done, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
       ON CONFLICT(id) DO UPDATE SET amount = excluded.amount,
         steps_done = excluded.steps_done, updated_at = excluded.updated_at, deleted_at = NULL`,
      [
        checkId(habitId, date),
        habitId,
        date,
        progress.amount,
        progress.stepsDone.length ? JSON.stringify(progress.stepsDone) : null,
        at,
        at,
      ],
    );
  }

  /** Marks a day done or not in habit_checks. Setting the state it already has does nothing. */
  async function markDone(habitId: string, date: string, done: boolean): Promise<void> {
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
    if (event) events.publish(event);
  }

  /** Stores a day's progress and keeps "done" in step with the goal. */
  async function saveProgress(habit: Habit, date: string, progress: DayProgress) {
    await writeProgress(habit.id, date, progress);
    await markDone(habit.id, date, amountOf(habit, progress) >= goalOf(habit));
    changes.notify('habits');
  }

  return {
    /**
     * For statistics: every habit, and each day one was done between `from` and `to`
     * (inclusive) with when it was marked.
     */
    async statsFacts(
      from: string,
      to: string,
    ): Promise<{ habits: Habit[]; done: { habitId: string; day: string; at: string }[] }> {
      const rows = await db.all<HabitRow>(
        `SELECT ${HABIT_COLUMNS} FROM habits WHERE deleted_at IS NULL ORDER BY sort_order`,
      );
      const done = await db.all<{ habit_id: string; date: string; updated_at: string }>(
        `SELECT c.habit_id, c.date, c.updated_at FROM habit_checks c
         JOIN habits h ON h.id = c.habit_id AND h.deleted_at IS NULL
         WHERE c.deleted_at IS NULL AND c.date BETWEEN ? AND ?`,
        [from, to],
      );
      return {
        habits: rows.map(toHabit),
        done: done.map((r) => ({ habitId: r.habit_id, day: r.date, at: r.updated_at })),
      };
    },

    async listHabits(todayKey: string = toDateKey(now())): Promise<HabitWithProgress[]> {
      const rows = await db.all<HabitRow>(
        `SELECT ${HABIT_COLUMNS} FROM habits WHERE deleted_at IS NULL ORDER BY sort_order`,
      );
      const habits = rows.map(toHabit);
      const ids = habits.map((h) => h.id);
      const done = await doneDays(ids);
      const sunday = addDays(todayKey, -weekdayOf(todayKey));
      const progress = await progressBetween(ids, sunday, addDays(sunday, 6));
      const timers = await runningTimers();
      return habits.map((h) =>
        withProgress(h, done.get(h.id)!, todayKey, progress.get(h.id), timers.get(h.id)),
      );
    },

    /**
     * What gamification needs from habits: every check-in with whether it fell on a scheduled
     * day, and per day how many habits were due and done.
     */
    async progressFacts(todayKey: string = toDateKey(now())): Promise<{
      checks: { day: string; scheduled: boolean }[];
      due: { day: string; total: number; done: number }[];
    }> {
      const rows = await db.all<HabitRow>(
        `SELECT ${HABIT_COLUMNS} FROM habits WHERE deleted_at IS NULL`,
      );
      const habits = rows.map(toHabit);
      const doneByHabit = await doneDays(habits.map((h) => h.id));
      const checks: { day: string; scheduled: boolean }[] = [];
      const due = new Map<string, { day: string; total: number; done: number }>();
      for (const habit of habits) {
        const done = doneByHabit.get(habit.id)!;
        for (const day of done) {
          if (day <= todayKey) checks.push({ day, scheduled: isScheduled(habit.days, day) });
        }
        for (
          let day = toDateKey(new Date(habit.createdAt));
          day <= todayKey;
          day = addDays(day, 1)
        ) {
          if (!isScheduled(habit.days, day)) continue;
          const entry = due.get(day) ?? { day, total: 0, done: 0 };
          entry.total += 1;
          if (done.has(day)) entry.done += 1;
          due.set(day, entry);
        }
      }
      return { checks, due: [...due.values()] };
    },

    /**
     * One habit with its progress, every day it was done (for the calendar) and how full each
     * day was (for the reef map).
     */
    async getHabit(
      id: string,
      todayKey: string = toDateKey(now()),
    ): Promise<{
      habit: HabitWithProgress;
      doneDays: string[];
      dayRatios: Record<string, number>;
    } | null> {
      const habit = await getHabitRow(id);
      if (!habit) return null;
      const done = (await doneDays([id])).get(id)!;
      const progress = (await progressBetween([id], '0000-00-00', todayKey)).get(id)!;
      const dayRatios: Record<string, number> = {};
      for (const [day, p] of progress) dayRatios[day] = fillRatio(habit, amountOf(habit, p), false);
      for (const day of done) dayRatios[day] = 1;
      const timer = (await runningTimers()).get(id);
      return {
        habit: withProgress(habit, done, todayKey, progress, timer),
        doneDays: [...done].sort(),
        dayRatios,
      };
    },

    async createHabit(input: NewHabit): Promise<string> {
      const name = validateHabitName(input.name);
      const creature = validateCreature(input.creature);
      const days = validateDays(input.days ?? EVERY_DAY);
      const times = validateReminderTimes(input.reminderTimes ?? []);
      const kind = validateKind(input.kind ?? 'check');
      const { target, unit, steps } = shape(kind, input);
      const id = newId();
      const at = timestamp();
      const max = await db.get<{ max: number | null }>(
        'SELECT MAX(sort_order) AS max FROM habits WHERE deleted_at IS NULL',
      );
      await db.run(
        `INSERT INTO habits
           (id, name, creature, days, reminder_times, kind, target, unit, steps,
            sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          name,
          creature,
          days,
          times.join(',') || null,
          kind,
          target,
          unit,
          steps.length ? JSON.stringify(steps) : null,
          (max?.max ?? 0) + 1,
          at,
          at,
        ],
      );
      changes.notify('habits');
      return id;
    },

    async updateHabit(id: string, patch: HabitPatch): Promise<void> {
      const existing = await requireHabit(id);
      const sets: string[] = [];
      const params: (string | number | null)[] = [];
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
      if (patch.reminderTimes !== undefined) {
        sets.push('reminder_times = ?');
        params.push(validateReminderTimes(patch.reminderTimes).join(',') || null);
      }
      const reshaped =
        patch.kind !== undefined ||
        patch.target !== undefined ||
        patch.unit !== undefined ||
        patch.steps !== undefined;
      let next: Habit = existing;
      if (reshaped) {
        const kind = validateKind(patch.kind ?? existing.kind);
        const { target, unit, steps } = shape(kind, patch, existing);
        sets.push('kind = ?', 'target = ?', 'unit = ?', 'steps = ?');
        params.push(kind, target, unit, steps.length ? JSON.stringify(steps) : null);
        next = { ...existing, kind, target, unit, steps };
      }
      if (sets.length === 0) return;
      await db.run(
        `UPDATE habits SET ${sets.join(', ')}, updated_at = ? WHERE id = ? AND deleted_at IS NULL`,
        [...params, timestamp(), id],
      );
      // A new goal can finish (or reopen) today, when today already has progress.
      const todayKey = toDateKey(now());
      const progress = reshaped ? await readProgress(id, todayKey) : undefined;
      if (progress && next.kind !== 'check') {
        await markDone(id, todayKey, amountOf(next, progress) >= goalOf(next));
      }
      changes.notify('habits');
    },

    /** Soft-deletes the habit; its check-ins stay for history but are no longer read. */
    async deleteHabit(id: string): Promise<void> {
      const at = timestamp();
      await db.run(
        'UPDATE habits SET deleted_at = ?, updated_at = ? WHERE id = ? AND deleted_at IS NULL',
        [at, at, id],
      );
      await db.run('DELETE FROM habit_timers WHERE habit_id = ?', [id]);
      changes.notify('habits');
    },

    /**
     * Marks a day done or not. For habits done in parts, done fills the day up to the goal and
     * not done empties it, so the capsule and the check always agree.
     */
    async setChecked(habitId: string, date: string, done: boolean): Promise<void> {
      const habit = await requireHabit(habitId);
      if (habit.kind !== 'check') {
        const current = await readProgress(habitId, date);
        const amount = amountOf(habit, current);
        if (done && amount < goalOf(habit)) {
          await writeProgress(habitId, date, {
            amount: goalOf(habit),
            stepsDone: habit.kind === 'checklist' ? habit.steps.map((s) => s.id) : [],
          });
        } else if (!done && current) {
          await writeProgress(habitId, date, { amount: 0, stepsDone: [] });
        }
      }
      await markDone(habitId, date, done);
      changes.notify('habits');
    },

    /** Sets a count (units) or time (seconds) habit's progress for a day. */
    async setAmount(habitId: string, date: string, amount: number): Promise<void> {
      const habit = await requireHabit(habitId);
      if (habit.kind !== 'count' && habit.kind !== 'time') {
        throw new HabitValidationError('Este hábito não usa quantidade.');
      }
      await saveProgress(habit, date, { amount: Math.max(0, Math.round(amount)), stepsDone: [] });
    },

    /** Adds to (or, with a negative delta, takes from) a day's progress. Never below zero. */
    async addAmount(habitId: string, date: string, delta: number): Promise<void> {
      const current = await readProgress(habitId, date);
      await this.setAmount(habitId, date, (current?.amount ?? 0) + delta);
    },

    async setStep(habitId: string, date: string, stepId: string, done: boolean): Promise<void> {
      const habit = await requireHabit(habitId);
      if (!habit.steps.some((s) => s.id === stepId)) {
        throw new HabitValidationError('Este passo não existe mais.');
      }
      const current = new Set((await readProgress(habitId, date))?.stepsDone ?? []);
      if (done) current.add(stepId);
      else current.delete(stepId);
      const stepsDone = habit.steps.map((s) => s.id).filter((id) => current.has(id));
      await saveProgress(habit, date, { amount: stepsDone.length, stepsDone });
    },

    /**
     * Starts a time habit's timer. Only the start is stored, so it keeps counting with the app
     * closed; stopping adds the elapsed time to that day.
     */
    async startTimer(habitId: string, date: string): Promise<void> {
      const habit = await requireHabit(habitId);
      if (habit.kind !== 'time') throw new HabitValidationError('Este hábito não usa tempo.');
      await db.run(
        `INSERT INTO habit_timers (habit_id, date, started_at) VALUES (?, ?, ?)
         ON CONFLICT(habit_id) DO NOTHING`,
        [habitId, date, timestamp()],
      );
      changes.notify('habits');
    },

    /** Stops the timer and returns the seconds it added (0 when none was running). */
    async stopTimer(habitId: string): Promise<number> {
      const row = await db.get<{ date: string; started_at: string }>(
        'SELECT date, started_at FROM habit_timers WHERE habit_id = ?',
        [habitId],
      );
      if (!row) return 0;
      await db.run('DELETE FROM habit_timers WHERE habit_id = ?', [habitId]);
      const seconds = Math.max(
        0,
        Math.floor((now().getTime() - new Date(row.started_at).getTime()) / 1000),
      );
      if (seconds > 0 && (await getHabitRow(habitId))) {
        await this.addAmount(habitId, row.date, seconds);
      } else {
        changes.notify('habits');
      }
      return seconds;
    },
  };
}

export type HabitsRepository = ReturnType<typeof createHabitsRepository>;
