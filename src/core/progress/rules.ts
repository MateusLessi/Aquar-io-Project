/**
 * Gamification rules (docs/gamification-rules.md). Every number lives here so balancing
 * is a one-file change. Pure functions: progress is computed from facts, never stored.
 */

export const POINTS = {
  task: 10,
  subtask: 3,
  habitScheduled: 15,
  habitRestDay: 8,
  fullTide: 25,
} as const;

/** At most this many points count per day, so inventing tasks cannot farm depth. */
export const DAILY_CAP = 150;
/** A full tide needs at least this many things due that day. */
export const FULL_TIDE_MIN_ITEMS = 3;

/** What happened on one day, from tasks and habits. */
export type DayFacts = {
  tasks: number;
  subtasks: number;
  habitsScheduled: number;
  habitsRestDay: number;
  /** Things due that day (top-level tasks due + habits scheduled) and how many got done. */
  due: number;
  dueDone: number;
};

export function emptyDay(): DayFacts {
  return { tasks: 0, subtasks: 0, habitsScheduled: 0, habitsRestDay: 0, due: 0, dueDone: 0 };
}

export function isFullTide(day: DayFacts): boolean {
  return day.due >= FULL_TIDE_MIN_ITEMS && day.dueDone >= day.due;
}

/** Points earned on one day before the cap. */
export function rawPoints(day: DayFacts): number {
  return (
    day.tasks * POINTS.task +
    day.subtasks * POINTS.subtask +
    day.habitsScheduled * POINTS.habitScheduled +
    day.habitsRestDay * POINTS.habitRestDay +
    (isFullTide(day) ? POINTS.fullTide : 0)
  );
}

export function dayPoints(day: DayFacts): number {
  return Math.min(DAILY_CAP, rawPoints(day));
}

export type Zone = { id: string; name: string; emoji: string; from: number };

/** 1 point = 1 meter. Depth never goes back up: it is the sum of every day. */
export const ZONES: readonly Zone[] = [
  { id: 'surface', name: 'Superfície', emoji: '🌤️', from: 0 },
  { id: 'coastal', name: 'Águas Costeiras', emoji: '🏝️', from: 100 },
  { id: 'reef', name: 'Recife de Coral', emoji: '🪸', from: 300 },
  { id: 'open', name: 'Mar Aberto', emoji: '🌊', from: 700 },
  { id: 'twilight', name: 'Zona do Crepúsculo', emoji: '🌆', from: 1500 },
  { id: 'midnight', name: 'Zona da Meia-Noite', emoji: '🌑', from: 3000 },
  { id: 'abyss', name: 'Abismo', emoji: '🕳️', from: 6000 },
  { id: 'hadal', name: 'Zona Hadal', emoji: '🔱', from: 8000 },
  { id: 'mariana', name: 'Fossa das Marianas', emoji: '🏁', from: 10994 },
];

export type Depth = {
  meters: number;
  zone: Zone;
  next: Zone | null;
  /** 0–1 through the current zone. */
  progress: number;
};

export function depthFor(meters: number): Depth {
  let index = 0;
  while (index + 1 < ZONES.length && meters >= ZONES[index + 1]!.from) index += 1;
  const zone = ZONES[index]!;
  const next = ZONES[index + 1] ?? null;
  const progress = next ? (meters - zone.from) / (next.from - zone.from) : 1;
  return { meters, zone, next, progress };
}

/** Total depth from every day's facts (each day capped). */
export function totalDepth(days: Iterable<DayFacts>): number {
  let meters = 0;
  for (const day of days) meters += dayPoints(day);
  return meters;
}
