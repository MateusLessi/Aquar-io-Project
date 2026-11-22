import type { ListColorName } from '@/design-system';

/**
 * Every habit is a sea creature (docs/gamification.md). Each creature brings its own color, so
 * creating a habit is one choice, not two.
 *
 * Fase 6 (the redesign): six creatures, seen from above, one color and shape each so two habits
 * never look alike. Their art lives in `components/creatureArt.ts` (one image each).
 */
const catalog = {
  fish: { name: 'Peixe', color: 'sand' },
  shark: { name: 'Tubarão', color: 'lagoon' },
  turtle: { name: 'Tartaruga', color: 'kelp' },
  jellyfish: { name: 'Água-viva', color: 'anemone' },
  octopus: { name: 'Polvo', color: 'coral' },
  ray: { name: 'Raia', color: 'tide' },
} as const satisfies Record<string, { name: string; color: ListColorName }>;

/**
 * The creatures before the redesign. Habits and profiles that chose them keep working: each one
 * shows as the closest of the six (name, color and art). Nothing is rewritten in the data, so
 * this can change while the new look is being tested.
 */
const legacy = {
  dolphin: 'shark',
  whale: 'ray',
  seal: 'turtle',
  blowfish: 'fish',
  shrimp: 'fish',
  crab: 'octopus',
  squid: 'octopus',
  lobster: 'octopus',
} as const satisfies Record<string, keyof typeof catalog>;

export type CatalogCreature = keyof typeof catalog;
export type CreatureId = CatalogCreature | keyof typeof legacy;

/** The six to choose from, in the order they are offered. */
export const creatureIds = Object.keys(catalog) as CatalogCreature[];

/** The creature as it shows now: itself, or the closest of the six for an old one. */
export function catalogCreature(id: CreatureId): CatalogCreature {
  return id in legacy ? legacy[id as keyof typeof legacy] : (id as CatalogCreature);
}

/** Name and color of any creature, old ones included (they show as their match). */
export const creatures = Object.fromEntries(
  [...creatureIds, ...(Object.keys(legacy) as (keyof typeof legacy)[])].map((id) => [
    id,
    catalog[catalogCreature(id)],
  ]),
) as Record<CreatureId, (typeof catalog)[CatalogCreature]>;

export function isCreatureId(value: string): value is CreatureId {
  return value in catalog || value in legacy;
}

/** Ajustes → Hábitos e jogo: the creature new habits start with. */
export const DEFAULT_CREATURE_SETTING = 'habits.creature';
