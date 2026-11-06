/**
 * The water of each depth zone. Every mode (Escuro, Claro, Crystal) takes its colors from the
 * zone the person is in: sunlit and turquoise near the surface, blue and violet in the deep,
 * lit only by bioluminescence at the bottom. The ids match `ZONES` in core/progress.
 */
export type ZoneId =
  'surface' | 'coastal' | 'reef' | 'open' | 'twilight' | 'midnight' | 'abyss' | 'hadal' | 'mariana';

export type ZoneWater = {
  /** Tank water, from the waterline down. */
  top: string;
  mid: string;
  bottom: string;
  sand: string;
  kelp: string;
  /** Strength of the sun rays inside the tank (0–1). */
  rays: number;
  /** The light the tank gives off in Escuro: a halo around it and particles in the water. */
  lamp: string;
  /** Escuro: the room the tank lights up. */
  room: string;
};

export const zoneWater: Record<ZoneId, ZoneWater> = {
  surface: {
    top: '#7FD6E0',
    mid: '#36A9BD',
    bottom: '#16697D',
    sand: '#E8D6A6',
    kelp: '#6FBF73',
    rays: 0.22,
    lamp: '#8BE8EE',
    room: '#0F2D36',
  },
  coastal: {
    top: '#5CC8D4',
    mid: '#2496AD',
    bottom: '#0F5F74',
    sand: '#DCC795',
    kelp: '#66B874',
    rays: 0.2,
    lamp: '#6FE0E4',
    room: '#0E2A33',
  },
  reef: {
    top: '#2EA3B3',
    mid: '#16788C',
    bottom: '#0B4658',
    sand: '#CDB68A',
    kelp: '#5FAE74',
    rays: 0.16,
    lamp: '#46CFC4',
    room: '#0C242C',
  },
  open: {
    top: '#1F86A8',
    mid: '#125F86',
    bottom: '#0A3A5A',
    sand: '#A99C80',
    kelp: '#4C9A7C',
    rays: 0.12,
    lamp: '#4FB6E6',
    room: '#0B1F2E',
  },
  twilight: {
    top: '#24557E',
    mid: '#173C66',
    bottom: '#0D2446',
    sand: '#6E6A74',
    kelp: '#3D6F78',
    rays: 0.08,
    lamp: '#7A9CF0',
    room: '#0B172A',
  },
  midnight: {
    top: '#173A5A',
    mid: '#0D2440',
    bottom: '#060F1F',
    sand: '#3C4A5C',
    kelp: '#2F5C66',
    rays: 0.05,
    lamp: '#7D92FF',
    room: '#0A1226',
  },
  abyss: {
    top: '#16244A',
    mid: '#0D173A',
    bottom: '#050A1E',
    sand: '#2C3346',
    kelp: '#2A4A5C',
    rays: 0.03,
    lamp: '#A48AFF',
    room: '#0B0F22',
  },
  hadal: {
    top: '#221C48',
    mid: '#140F32',
    bottom: '#08061A',
    sand: '#2A2638',
    kelp: '#3A3A62',
    rays: 0.02,
    lamp: '#C68AF2',
    room: '#0F0B20',
  },
  mariana: {
    top: '#2E1A40',
    mid: '#1A0E2A',
    bottom: '#0B0614',
    sand: '#2E2233',
    kelp: '#4A3060',
    rays: 0.02,
    lamp: '#FF9CC2',
    room: '#140C1A',
  },
};

export const zoneIds = Object.keys(zoneWater) as ZoneId[];

export function isZoneId(value: unknown): value is ZoneId {
  return typeof value === 'string' && value in zoneWater;
}
