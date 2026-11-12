import {
  ChartColumn,
  Fish,
  House,
  ShoppingBag,
  UserRound,
  type LucideIcon,
} from 'lucide-react-native';
import type { Href } from 'expo-router';

export type Destination = {
  /** Route name inside src/app/(tabs). */
  name: string;
  href: Href;
  label: string;
  icon: LucideIcon;
  /** Whether the "create" button is offered on this destination. */
  showsCreate: boolean;
  /** Left out of the phone's tab bar (still reachable from the profile). */
  notOnPhone?: boolean;
};

/**
 * Top-level destinations (Checkpoints 027 and 076): the dashboard with the day at a glance,
 * the Aquarium where every module is managed, the statistics, the shop and the profile. On
 * phones the shop leaves the bar (a tile in the profile) until it sells something.
 */
export const destinations: Destination[] = [
  { name: 'index', href: '/', label: 'Início', icon: House, showsCreate: true },
  { name: 'aquarium', href: '/aquarium', label: 'Aquário', icon: Fish, showsCreate: true },
  {
    name: 'stats',
    href: '/stats',
    label: 'Estatísticas',
    icon: ChartColumn,
    showsCreate: false,
  },
  {
    name: 'shop',
    href: '/shop',
    label: 'Loja',
    icon: ShoppingBag,
    showsCreate: false,
    notOnPhone: true,
  },
  { name: 'profile', href: '/profile', label: 'Perfil', icon: UserRound, showsCreate: false },
];

/** The destinations in the phone's tab bar. */
export const phoneDestinations = destinations.filter((d) => !d.notOnPhone);
