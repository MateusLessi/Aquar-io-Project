import {
  dayPoints,
  depthFor,
  emptyDay,
  isFullTide,
  rawPoints,
  totalDepth,
  type DayFacts,
  type Depth,
} from '@/core/progress/rules';

type TaskFacts = {
  completions: { day: string; subtask: boolean }[];
  due: { day: string; total: number; done: number }[];
};
type HabitFacts = {
  checks: { day: string; scheduled: boolean }[];
  due: { day: string; total: number; done: number }[];
};
type RoutineFacts = {
  checks: { day: string }[];
  due: { day: string; total: number; done: number }[];
};

export type Progress = {
  depth: Depth;
  /** Points (capped) and high tide per day, for the week chart and the calendar. */
  byDay: Record<string, { points: number; fullTide: boolean }>;
  today: { points: number; raw: number; fullTide: boolean; capped: boolean };
};

/** Joins what tasks and habits report into one fact sheet per day, then applies the rules. */
export function computeProgress(
  tasks: TaskFacts,
  habits: HabitFacts,
  routines: RoutineFacts,
  todayKey: string,
): Progress {
  const days = new Map<string, DayFacts>();
  const day = (key: string) => {
    let facts = days.get(key);
    if (!facts) days.set(key, (facts = emptyDay()));
    return facts;
  };

  for (const c of tasks.completions) {
    if (c.subtask) day(c.day).subtasks += 1;
    else day(c.day).tasks += 1;
  }
  for (const c of habits.checks) {
    if (c.scheduled) day(c.day).habitsScheduled += 1;
    else day(c.day).habitsRestDay += 1;
  }
  for (const c of routines.checks) day(c.day).routineItems += 1;
  for (const d of [...tasks.due, ...habits.due, ...routines.due]) {
    day(d.day).due += d.total;
    day(d.day).dueDone += d.done;
  }

  const today = days.get(todayKey) ?? emptyDay();
  const raw = rawPoints(today);
  const byDay: Progress['byDay'] = {};
  for (const [key, facts] of days) {
    byDay[key] = { points: dayPoints(facts), fullTide: isFullTide(facts) };
  }
  return {
    depth: depthFor(totalDepth(days.values())),
    byDay,
    today: {
      points: dayPoints(today),
      raw,
      fullTide: isFullTide(today),
      capped: raw > dayPoints(today),
    },
  };
}
