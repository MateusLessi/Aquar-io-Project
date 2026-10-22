import type { CreatureId } from './creatures';

/**
 * Creatures grow with consistency (total days done, ever), never with perfect streaks, and
 * never shrink back (docs/gamification-rules.md). Mammals and sharks are born, not hatched.
 */
export type Stage = 'egg' | 'baby' | 'young' | 'adult';

const BORN_ALIVE: ReadonlySet<CreatureId> = new Set(['dolphin', 'whale', 'seal', 'shark']);

/** Days done needed to reach each stage. */
const THRESHOLDS: { stage: Stage; from: number }[] = [
  { stage: 'baby', from: 3 },
  { stage: 'young', from: 10 },
  { stage: 'adult', from: 30 },
];

export const stageInfo: Record<Stage, { label: string; emoji: string; scale: number }> = {
  egg: { label: 'Ovo', emoji: '🥚', scale: 0.7 },
  baby: { label: 'Filhote', emoji: '🍼', scale: 0.85 },
  young: { label: 'Jovem', emoji: '🌱', scale: 1 },
  adult: { label: 'Adulto', emoji: '⭐', scale: 1.15 },
};

export function creatureStage(creature: CreatureId, daysDone: number): Stage {
  let stage: Stage = BORN_ALIVE.has(creature) ? 'baby' : 'egg';
  for (const threshold of THRESHOLDS) if (daysDone >= threshold.from) stage = threshold.stage;
  return stage;
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
