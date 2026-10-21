import type { ListColorName } from '@/design-system';

/**
 * Every habit is a sea creature (docs/gamification.md). Each creature brings its own color, so
 * creating a habit is one choice, not two. Emoji for now; illustrations arrive in Etapa 11.
 */
export const creatures = {
  turtle: { emoji: '🐢', name: 'Tartaruga', color: 'kelp' },
  fish: { emoji: '🐠', name: 'Peixe', color: 'sand' },
  octopus: { emoji: '🐙', name: 'Polvo', color: 'anemone' },
  dolphin: { emoji: '🐬', name: 'Golfinho', color: 'tide' },
  whale: { emoji: '🐳', name: 'Baleia', color: 'tide' },
  crab: { emoji: '🦀', name: 'Caranguejo', color: 'coral' },
  blowfish: { emoji: '🐡', name: 'Baiacu', color: 'sand' },
  shark: { emoji: '🦈', name: 'Tubarão', color: 'lagoon' },
  squid: { emoji: '🦑', name: 'Lula', color: 'coral' },
  seal: { emoji: '🦭', name: 'Foca', color: 'lagoon' },
  lobster: { emoji: '🦞', name: 'Lagosta', color: 'coral' },
  shrimp: { emoji: '🦐', name: 'Camarão', color: 'anemone' },
} as const satisfies Record<string, { emoji: string; name: string; color: ListColorName }>;

export type CreatureId = keyof typeof creatures;
export const creatureIds = Object.keys(creatures) as CreatureId[];

export function isCreatureId(value: string): value is CreatureId {
  return value in creatures;
}
