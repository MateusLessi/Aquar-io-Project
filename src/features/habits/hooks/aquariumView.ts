import { useSetting } from '@/core/settings/useSetting';

/** How the aquarium is drawn: the pond seen from above (Fase 6) or the old tank, while testing. */
export type AquariumView = 'pond' | 'tank';

export const AQUARIUM_VIEW_SETTING = 'aquarium.view';

/** Ajustes → Início: the pond by default; the old tank stays one switch away while we test. */
export function useAquariumView() {
  const [value, set] = useSetting<AquariumView>(AQUARIUM_VIEW_SETTING, 'pond');
  return [value === 'tank' ? 'tank' : 'pond', set] as const;
}
