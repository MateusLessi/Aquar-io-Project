import { useEffect } from 'react';

import { isZoneId, useTheme } from '@/design-system';

import { useProgress } from '../progress/useProgress';

/**
 * Keeps the zone the person reached. Since the redesign (one look) only the tank's water follows
 * it, until the depths are rethought.
 */
export function ZoneTheme() {
  const { setZone } = useTheme();
  const { data } = useProgress();
  const zoneId = data?.depth.zone.id;
  useEffect(() => {
    if (isZoneId(zoneId)) setZone(zoneId);
  }, [zoneId, setZone]);
  return null;
}
