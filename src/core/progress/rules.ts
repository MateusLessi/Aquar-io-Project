import type { GlyphKey } from '@/design-system';

/**
 * Gamification rules (docs/gamification-rules.md). Every number lives here so balancing
 * is a one-file change. Pure functions: progress is computed from facts, never stored.
 */

export const POINTS = {
  task: 10,
  subtask: 3,
  habitScheduled: 15,
  habitRestDay: 8,
  routineItem: 5,
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
  routineItems: number;
  /** Things due that day (top-level tasks, scheduled habits, routine items) and how many got done. */
  due: number;
  dueDone: number;
};

export function emptyDay(): DayFacts {
  return {
    tasks: 0,
    subtasks: 0,
    habitsScheduled: 0,
    habitsRestDay: 0,
    routineItems: 0,
    due: 0,
    dueDone: 0,
  };
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
    day.routineItems * POINTS.routineItem +
    (isFullTide(day) ? POINTS.fullTide : 0)
  );
}

export function dayPoints(day: DayFacts): number {
  return Math.min(DAILY_CAP, rawPoints(day));
}

/** `icon` is a glyph key from the design system. */
export type Zone = { id: string; name: string; icon: GlyphKey; from: number; about: string };

/**
 * The regions of the ocean (Fase 6, etapa 12): the day's points take the aquarium to new places,
 * and each one reached can be the scene of the pond. They replace the depth zones; the points and
 * their rules are the same (never going back). The 10.994 of the last one is the real trench's
 * depth, as a keepsake.
 */
export const ZONES: readonly Zone[] = [
  {
    id: 'lagoa',
    name: 'Lagoa',
    icon: 'palm',
    from: 0,
    about: 'Água verde e rasa, com vitórias-régias.',
  },
  {
    id: 'reef',
    name: 'Recife de Coral',
    icon: 'shell',
    from: 300,
    about: 'Corais coloridos e vida abundante.',
  },
  {
    id: 'kelp',
    name: 'Floresta de Kelp',
    icon: 'leaf',
    from: 1000,
    about: 'Florestas de kelp dourado.',
  },
  { id: 'open', name: 'Mar Aberto', icon: 'waves', from: 2500, about: 'Águas profundas e vastas.' },
  {
    id: 'bio',
    name: 'Fossa Bioluminescente',
    icon: 'sparkles',
    from: 5500,
    about: 'Criaturas e plantas que brilham.',
  },
  {
    id: 'mariana',
    name: 'Fossa das Marianas',
    icon: 'flag',
    from: 10994,
    about: 'O ponto mais fundo do oceano.',
  },
];

/** The regions reached with these points, in order. */
export function regionsReached(points: number): Zone[] {
  return ZONES.filter((z) => points >= z.from);
}

export type Depth = {
  meters: number;
  zone: Zone;
  next: Zone | null;
  /** 0–1 toward the next region. */
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
