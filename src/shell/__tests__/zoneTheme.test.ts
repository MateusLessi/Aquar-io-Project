import { ZONES } from '@/core/progress/rules';
import { isZoneId, zoneIds } from '@/design-system';

it('every depth zone has its water in the design system', () => {
  expect(ZONES.map((zone) => zone.id)).toEqual(zoneIds);
  for (const zone of ZONES) expect(isZoneId(zone.id)).toBe(true);
});
