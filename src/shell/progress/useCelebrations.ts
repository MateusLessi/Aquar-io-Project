import { useCallback, useContext, useEffect, useState } from 'react';

import { ZONES } from '@/core/progress/rules';
import { SettingsContext } from '@/core/settings/useSetting';
import { creatures } from '@/features/habits/domain/creatures';
import { stageInfo, type Stage } from '@/features/habits/domain/stages';
import { useHabits } from '@/features/habits/hooks/queries';

import { useProgress } from './useProgress';

const ZONE_KEY = 'celebratedZone';
const STAGES_KEY = 'celebratedStages';
const STAGE_ORDER: Stage[] = ['egg', 'baby', 'young', 'adult'];

/**
 * Celebrates, once per device, reaching a new zone and a creature growing up. The first time
 * it runs it only records where things stand, so updating the app does not set off a burst of
 * old news.
 */
export function useCelebrations() {
  const settings = useContext(SettingsContext);
  const { data: progress } = useProgress();
  const { data: habits } = useHabits();
  const [queue, setQueue] = useState<string[]>([]);

  const zoneId = progress?.depth.zone.id;
  const stagesKey = habits?.map((h) => `${h.id}:${h.stage}`).join(',');

  useEffect(() => {
    if (!settings || !zoneId) return;
    let active = true;
    (async () => {
      const seen = await settings.get(ZONE_KEY);
      if (seen !== zoneId) await settings.set(ZONE_KEY, zoneId);
      const before = ZONES.findIndex((z) => z.id === seen);
      const now = ZONES.findIndex((z) => z.id === zoneId);
      if (seen !== null && now > before && active) {
        const zone = ZONES[now]!;
        setQueue((q) => [...q, `${zone.emoji} Você chegou: ${zone.name}!`]);
      }
    })().catch((error: unknown) => console.warn('Could not check zone celebrations.', error));
    return () => {
      active = false;
    };
  }, [settings, zoneId]);

  useEffect(() => {
    if (!settings || !habits) return;
    let active = true;
    (async () => {
      const raw = await settings.get(STAGES_KEY);
      const seen = raw ? (JSON.parse(raw) as Record<string, Stage>) : null;
      const messages: string[] = [];
      const next: Record<string, Stage> = { ...seen };
      for (const habit of habits) {
        const previous = seen?.[habit.id];
        if (previous && STAGE_ORDER.indexOf(habit.stage) > STAGE_ORDER.indexOf(previous)) {
          const info = stageInfo[habit.stage];
          messages.push(
            `${creatures[habit.creature].emoji} ${habit.name} evoluiu: ${info.label} ${info.emoji}`,
          );
        }
        next[habit.id] = habit.stage;
      }
      await settings.set(STAGES_KEY, JSON.stringify(next));
      if (active && seen && messages.length > 0) setQueue((q) => [...q, ...messages]);
    })().catch((error: unknown) => console.warn('Could not check creature celebrations.', error));
    return () => {
      active = false;
    };
    // stagesKey captures what matters in `habits`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, stagesKey]);

  const dismiss = useCallback(() => setQueue((q) => q.slice(1)), []);
  return { message: queue[0] ?? null, dismiss };
}
