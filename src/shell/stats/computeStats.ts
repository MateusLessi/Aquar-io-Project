import { addDays, fromDateKey, toDateKey, weekdayOf } from '@/core/dates';
import type { CreatureId } from '@/features/habits/domain/creatures';
import { isScheduled } from '@/features/habits/domain/progress';
import { isRoutineDay } from '@/features/routines/domain/schedule';
import type { ListColorName } from '@/design-system';

export type StatsMode = 'week' | 'month';

export type Period = { mode: StatsMode; from: string; to: string; days: string[] };

/** The week (Sunday first) or the month that holds `anchor`. */
export function periodOf(mode: StatsMode, anchor: string): Period {
  let from: string;
  let to: string;
  if (mode === 'week') {
    from = addDays(anchor, -weekdayOf(anchor));
    to = addDays(from, 6);
  } else {
    const d = fromDateKey(anchor);
    from = toDateKey(new Date(d.getFullYear(), d.getMonth(), 1));
    to = toDateKey(new Date(d.getFullYear(), d.getMonth() + 1, 0));
  }
  const days: string[] = [];
  for (let day = from; day <= to; day = addDays(day, 1)) days.push(day);
  return { mode, from, to, days };
}

/** The period just before (or, with `step` 1, after) this one. */
export function shiftPeriod(period: Period, step: -1 | 1): Period {
  if (period.mode === 'week') return periodOf('week', addDays(period.from, 7 * step));
  const d = fromDateKey(period.from);
  return periodOf('month', toDateKey(new Date(d.getFullYear(), d.getMonth() + step, 1)));
}

export type StatsFacts = {
  /** When each task was completed (ISO instants). */
  taskTimes: string[];
  habits: { id: string; name: string; creature: CreatureId; days: number; createdAt: string }[];
  habitDone: { habitId: string; day: string; at: string }[];
  routines: {
    id: string;
    name: string;
    emoji: string | null;
    color: ListColorName;
    tag: string | null;
    days: number;
    createdAt: string;
    itemCount: number;
  }[];
  routineChecks: { routineId: string; day: string; at: string }[];
  /** Points per day, from the depth rules. */
  points: Record<string, { points: number; fullTide: boolean }>;
};

/** Parts of the day, for "when you finish things". */
export const DAY_PARTS = [
  { id: 'night', label: 'Madrugada', from: 0 },
  { id: 'morning', label: 'Manhã', from: 6 },
  { id: 'afternoon', label: 'Tarde', from: 12 },
  { id: 'evening', label: 'Noite', from: 18 },
] as const;

const partOf = (hour: number) => (hour < 6 ? 0 : hour < 12 ? 1 : hour < 18 ? 2 : 3);

export type DayStats = {
  day: string;
  tasks: number;
  habits: number;
  routines: number;
  points: number;
  fullTide: boolean;
  /** After today: nothing to show yet. */
  future: boolean;
};

export type Stats = {
  period: Period;
  byDay: DayStats[];
  totals: { tasks: number; habits: number; routines: number; all: number };
  /** Habits and routine items due on past and current days of the period, and how many were done. */
  planned: { due: number; done: number };
  /** Count of things marked per part of the day (rows) and weekday (columns, Sunday first). */
  hours: number[][];
  /** Share of the planned that got done, per weekday (Sunday first); null with nothing due. */
  weekdayRate: (number | null)[];
  depth: { start: number; end: number; byDay: { day: string; meters: number }[] };
  habitRows: {
    id: string;
    name: string;
    creature: CreatureId;
    /** Scheduled days done, out of `due`. */
    done: number;
    due: number;
    /** Every day it was done, rest days included. */
    total: number;
  }[];
  routineRows: {
    id: string;
    name: string;
    emoji: string | null;
    color: ListColorName;
    tag: string | null;
    itemsDone: number;
    itemsDue: number;
    fullDays: number;
    days: number;
  }[];
};

const dayOfInstant = (at: string) => toDateKey(new Date(at));
const createdDay = (createdAt: string) => toDateKey(new Date(createdAt));

/**
 * Statistics for a period, from what the app stored: completions with their time, scheduled
 * days of habits and routines (only from the day each one was created, never "missed" before
 * it existed) and the depth points. Days after today count nothing.
 */
export function computeStats(period: Period, facts: StatsFacts, todayKey: string): Stats {
  const inPeriod = (day: string) => day >= period.from && day <= period.to;
  const counts = new Map(period.days.map((d) => [d, { tasks: 0, habits: 0, routines: 0 }]));
  const hours = DAY_PARTS.map(() => [0, 0, 0, 0, 0, 0, 0]);
  const mark = (at: string) => {
    const date = new Date(at);
    hours[partOf(date.getHours())]![date.getDay()]! += 1;
  };

  for (const at of facts.taskTimes) {
    const c = counts.get(dayOfInstant(at));
    if (!c) continue;
    c.tasks += 1;
    mark(at);
  }
  const habitIds = new Set(facts.habits.map((h) => h.id));
  const habitDone = new Map<string, Set<string>>();
  for (const d of facts.habitDone) {
    if (!habitIds.has(d.habitId) || !inPeriod(d.day)) continue;
    counts.get(d.day)!.habits += 1;
    mark(d.at);
    let set = habitDone.get(d.habitId);
    if (!set) habitDone.set(d.habitId, (set = new Set()));
    set.add(d.day);
  }
  const routineById = new Map(facts.routines.map((r) => [r.id, r]));
  const checked = new Map<string, number>();
  for (const c of facts.routineChecks) {
    if (!routineById.has(c.routineId) || !inPeriod(c.day)) continue;
    counts.get(c.day)!.routines += 1;
    mark(c.at);
    checked.set(`${c.routineId}:${c.day}`, (checked.get(`${c.routineId}:${c.day}`) ?? 0) + 1);
  }

  // What was planned, day by day, up to today.
  const weekdayDue = [0, 0, 0, 0, 0, 0, 0];
  const weekdayDone = [0, 0, 0, 0, 0, 0, 0];
  const plan = (day: string, due: number, done: number) => {
    weekdayDue[weekdayOf(day)]! += due;
    weekdayDone[weekdayOf(day)]! += done;
  };
  const pastDays = period.days.filter((d) => d <= todayKey);

  const habitRows = facts.habits.map((h) => {
    const set = habitDone.get(h.id) ?? new Set<string>();
    let due = 0;
    let done = 0;
    for (const day of pastDays) {
      if (day < createdDay(h.createdAt) || !isScheduled(h.days, day)) continue;
      due += 1;
      const hit = set.has(day) ? 1 : 0;
      done += hit;
      plan(day, 1, hit);
    }
    // Done on a rest day still counts in the total, but not as planned.
    return { id: h.id, name: h.name, creature: h.creature, done, due, total: set.size };
  });

  const routineRows = facts.routines.map((r) => {
    let itemsDue = 0;
    let itemsDone = 0;
    let fullDays = 0;
    let days = 0;
    for (const day of pastDays) {
      if (day < createdDay(r.createdAt) || !isRoutineDay(r.days, day)) continue;
      days += 1;
      const done = Math.min(r.itemCount, checked.get(`${r.id}:${day}`) ?? 0);
      itemsDue += r.itemCount;
      itemsDone += done;
      if (r.itemCount > 0 && done === r.itemCount) fullDays += 1;
      plan(day, r.itemCount, done);
    }
    return {
      id: r.id,
      name: r.name,
      emoji: r.emoji,
      color: r.color,
      tag: r.tag,
      itemsDone,
      itemsDue,
      fullDays,
      days,
    };
  });

  // Depth: everything before the period, then day by day.
  let meters = 0;
  for (const [day, p] of Object.entries(facts.points)) if (day < period.from) meters += p.points;
  const start = meters;
  const depthByDay: { day: string; meters: number }[] = [];
  for (const day of pastDays) {
    meters += facts.points[day]?.points ?? 0;
    depthByDay.push({ day, meters });
  }

  const byDay = period.days.map((day) => ({
    day,
    ...counts.get(day)!,
    points: facts.points[day]?.points ?? 0,
    fullTide: facts.points[day]?.fullTide ?? false,
    future: day > todayKey,
  }));
  const totals = byDay.reduce(
    (t, d) => ({
      tasks: t.tasks + d.tasks,
      habits: t.habits + d.habits,
      routines: t.routines + d.routines,
      all: t.all + d.tasks + d.habits + d.routines,
    }),
    { tasks: 0, habits: 0, routines: 0, all: 0 },
  );

  return {
    period,
    byDay,
    totals,
    planned: {
      due: weekdayDue.reduce((a, b) => a + b, 0),
      done: weekdayDone.reduce((a, b) => a + b, 0),
    },
    hours,
    weekdayRate: weekdayDue.map((due, i) => (due === 0 ? null : weekdayDone[i]! / due)),
    depth: { start, end: meters, byDay: depthByDay },
    habitRows,
    routineRows,
  };
}
