import type { ListColorName } from '@/design-system';

/**
 * Every habit is a sea creature (docs/gamification.md). Each creature brings its own color, so
 * creating a habit is one choice, not two. Drawn by `CreatureArt` (placeholder art for now).
 */
export const creatures = {
  turtle: { name: 'Tartaruga', color: 'kelp' },
  fish: { name: 'Peixe', color: 'sand' },
  octopus: { name: 'Polvo', color: 'anemone' },
  dolphin: { name: 'Golfinho', color: 'tide' },
  whale: { name: 'Baleia', color: 'tide' },
  crab: { name: 'Caranguejo', color: 'coral' },
  blowfish: { name: 'Baiacu', color: 'sand' },
  shark: { name: 'Tubarão', color: 'lagoon' },
  squid: { name: 'Lula', color: 'coral' },
  seal: { name: 'Foca', color: 'lagoon' },
  lobster: { name: 'Lagosta', color: 'coral' },
  shrimp: { name: 'Camarão', color: 'anemone' },
} as const satisfies Record<string, { name: string; color: ListColorName }>;

export type CreatureId = keyof typeof creatures;
export const creatureIds = Object.keys(creatures) as CreatureId[];

export function isCreatureId(value: string): value is CreatureId {
  return value in creatures;
}

/** Ajustes → Hábitos e jogo: the creature new habits start with. */
export const DEFAULT_CREATURE_SETTING = 'habits.creature';
