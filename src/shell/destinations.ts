import {
  CalendarClock,
  Fish,
  ListTodo,
  Settings2,
  Sun,
  type LucideIcon,
} from 'lucide-react-native';
import type { Href } from 'expo-router';

export type Destination = {
  /** Route name inside src/app/(tabs). */
  name: string;
  href: Href;
  label: string;
  icon: LucideIcon;
  /** Whether the "new task" action is offered on this destination. */
  showsCreate: boolean;
  /** Left out of the phone tab bar (no room for five); reached from elsewhere. */
  notOnPhoneBar?: boolean;
};

/**
 * Top-level destinations. Only what exists appears here: modules join when they ship.
 * Plain Portuguese labels for now; brand names (docs/naming.md) come with more modules.
 */
export const destinations: Destination[] = [
  { name: 'index', href: '/', label: 'Hoje', icon: Sun, showsCreate: true },
  { name: 'habits', href: '/habits', label: 'Hábitos', icon: Fish, showsCreate: false },
  {
    name: 'routines',
    href: '/routines',
    label: 'Rotinas',
    icon: CalendarClock,
    showsCreate: false,
  },
  { name: 'lists', href: '/lists', label: 'Listas', icon: ListTodo, showsCreate: true },
  {
    name: 'settings',
    href: '/settings',
    label: 'Ajustes',
    icon: Settings2,
    showsCreate: false,
    // On phones, a gear on Today opens Settings.
    notOnPhoneBar: true,
  },
];
