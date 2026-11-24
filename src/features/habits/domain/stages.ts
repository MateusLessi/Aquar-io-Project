import { catalogCreature, type CatalogCreature, type CreatureId } from './creatures';

/**
 * Creatures grow with consistency (total days done, ever), never with perfect streaks, and
 * never shrink back (docs/gamification-rules.md). Sharks and rays are born, not hatched.
 */
export type Stage = 'egg' | 'baby' | 'young' | 'adult';

const BORN_ALIVE: ReadonlySet<CatalogCreature> = new Set(['shark', 'ray']);

/** Days done needed to reach each stage. */
const THRESHOLDS: { stage: Stage; from: number }[] = [
  { stage: 'baby', from: 3 },
  { stage: 'young', from: 10 },
  { stage: 'adult', from: 30 },
];

/**
 * How each stage looks (Fase 6: one image per creature). It grows in size; the egg is small and
 * faint, and the adult gets a soft sand halo. `scale` is of the art's box.
 */
export const stageInfo: Record<
  Stage,
  { label: string; scale: number; opacity: number; glow: boolean }
> = {
  egg: { label: 'Ovo', scale: 0.55, opacity: 0.6, glow: false },
  baby: { label: 'Filhote', scale: 0.72, opacity: 1, glow: false },
  young: { label: 'Jovem', scale: 0.88, opacity: 1, glow: false },
  adult: { label: 'Adulto', scale: 1, opacity: 1, glow: true },
};

export function creatureStage(creature: CreatureId, daysDone: number): Stage {
  let stage: Stage = BORN_ALIVE.has(catalogCreature(creature)) ? 'baby' : 'egg';
  for (const threshold of THRESHOLDS) if (daysDone >= threshold.from) stage = threshold.stage;
  return stage;
}

/**
 * The stages a creature goes through, with the days done where each begins: an egg first, or a
 * baby for those born alive (sharks and rays).
 */
export function stagePath(creature: CreatureId): { stage: Stage; from: number }[] {
  const first = creatureStage(creature, 0);
  return [{ stage: first, from: 0 }, ...THRESHOLDS.filter((t) => t.stage !== first)];
}

/** The next stage and how many more days it takes, or null when fully grown. */
export function nextStage(
  creature: CreatureId,
  daysDone: number,
): { stage: Stage; daysLeft: number } | null {
  const current = creatureStage(creature, daysDone);
  const next = THRESHOLDS.find((t) => t.from > daysDone && t.stage !== current);
  return next ? { stage: next.stage, daysLeft: next.from - daysDone } : null;
}

/**
 * The creature's level (Fase 6, etapa 12c), from its XP. Levels 3, 6 and 10 fall where the stages
 * change (3, 10 and 30 planned days), so the level and the stage tell the same story; after level
 * 10 every 150 XP is one more level, so a grown creature keeps going. Never goes down by missing
 * a day; unmarking a day takes that day's XP back.
 */
const LEVELS = [0, 15, 45, 75, 110, 150, 200, 260, 340, 450];
const AFTER_TEN = 150;

export type Level = {
  level: number;
  xp: number;
  /** XP where this level began and where the next one begins. */
  from: number;
  to: number;
  /** 0–1 toward the next level. */
  progress: number;
};

export function levelFor(xp: number): Level {
  const start = (n: number) =>
    n <= LEVELS.length ? LEVELS[n - 1]! : LEVELS.at(-1)! + (n - LEVELS.length) * AFTER_TEN;
  let level = 1;
  while (xp >= start(level + 1)) level += 1;
  const from = start(level);
  const to = start(level + 1);
  return { level, xp, from, to, progress: (xp - from) / (to - from) };
}
