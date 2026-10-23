import { Fish, House, ShoppingBag, UserRound, type LucideIcon } from 'lucide-react-native';
import type { Href } from 'expo-router';

export type Destination = {
  /** Route name inside src/app/(tabs). */
  name: string;
  href: Href;
  label: string;
  icon: LucideIcon;
  /** Whether the "create" button is offered on this destination. */
  showsCreate: boolean;
};

/**
 * Top-level destinations (Checkpoint 027): the dashboard with the day at a glance, the
 * Aquarium where every module is managed, the shop, and the profile with all settings.
 */
export const destinations: Destination[] = [
  { name: 'index', href: '/', label: 'Início', icon: House, showsCreate: true },
  { name: 'aquarium', href: '/aquarium', label: 'Aquário', icon: Fish, showsCreate: true },
  { name: 'shop', href: '/shop', label: 'Loja', icon: ShoppingBag, showsCreate: false },
  { name: 'profile', href: '/profile', label: 'Perfil', icon: UserRound, showsCreate: false },
];
