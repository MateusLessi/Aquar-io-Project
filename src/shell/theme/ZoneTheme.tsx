import { useEffect } from 'react';

import { isZoneId, useTheme } from '@/design-system';

import { useProgress } from '../progress/useProgress';

/** Keeps the app's colors on the zone the person reached: the whole app dives with them. */
export function ZoneTheme() {
  const { setZone } = useTheme();
  const { data } = useProgress();
  const zoneId = data?.depth.zone.id;
  useEffect(() => {
    if (isZoneId(zoneId)) setZone(zoneId);
  }, [zoneId, setZone]);
  return null;
}
