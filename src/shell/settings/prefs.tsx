import { router, usePathname, type Href } from 'expo-router';
import { useContext, useEffect, useRef, type ReactNode } from 'react';

import { CalendarPrefsContext } from '@/core/preferences/calendarPrefs';
import { SettingsContext, useSetting } from '@/core/settings/useSetting';
import {
  DEFAULT_CREATURE_SETTING,
  isCreatureId,
  type CreatureId,
} from '@/features/habits/domain/creatures';

/** Stored keys of Ajustes (per device). */
export const SETTINGS = {
  weekStart: 'calendar.weekStart',
  clock: 'calendar.clock',
  startTab: 'start.tab',
  dashboardCards: 'dashboard.cards',
  showDepth: 'game.depth',
  celebrations: 'game.celebrations',
  defaultCreature: DEFAULT_CREATURE_SETTING,
} as const;

/** Feeds the calendar choices to every screen (week start, 12/24 h). */
export function CalendarPrefsProvider({ children }: { children: ReactNode }) {
  const [weekStart] = useSetting<'0' | '1'>(SETTINGS.weekStart, '0');
  const [clock] = useSetting<'24' | '12'>(SETTINGS.clock, '24');
  return (
    <CalendarPrefsContext.Provider
      value={{ weekStart: weekStart === '1' ? 1 : 0, clock24: clock !== '12' }}
    >
      {children}
    </CalendarPrefsContext.Provider>
  );
}

export type StartTab = 'home' | 'habits' | 'routines' | 'lists';
export const startTabs: { value: StartTab; label: string }[] = [
  { value: 'home', label: 'Início' },
  { value: 'habits', label: 'Hábitos' },
  { value: 'routines', label: 'Rotinas' },
  { value: 'lists', label: 'Listas' },
];

export function useStartTab() {
  const [value, set] = useSetting<StartTab>(SETTINGS.startTab, 'home');
  return [startTabs.some((t) => t.value === value) ? value : 'home', set] as const;
}

/** Dashboard cards that can be moved and hidden (the day's tide always leads). */
export const DASHBOARD_CARDS = [
  { id: 'depth', label: 'Profundidade' },
  { id: 'weekStats', label: 'Esta semana' },
  { id: 'routines', label: 'Rotinas e Sua semana' },
  { id: 'habits', label: 'Hábitos de hoje' },
  { id: 'tasks', label: 'Tarefas de hoje' },
  { id: 'folders', label: 'Pastas fixadas' },
  { id: 'week', label: 'Marés da semana' },
  { id: 'calendar', label: 'Calendário das marés (tablet e PC)' },
] as const;
export type DashboardCardId = (typeof DASHBOARD_CARDS)[number]['id'];
export type DashboardCardPref = { id: DashboardCardId; visible: boolean };

/**
 * "depth,-folders,weekStats…": the order, with "-" for hidden cards. Unknown ids are dropped
 * and cards added in later versions join at the end, visible.
 */
export function parseDashboardCards(value: string | null | undefined): DashboardCardPref[] {
  const known = new Set<string>(DASHBOARD_CARDS.map((c) => c.id));
  const out: DashboardCardPref[] = [];
  for (const raw of (value ?? '').split(',')) {
    const visible = !raw.startsWith('-');
    const id = raw.replace(/^-/, '');
    if (known.has(id) && !out.some((c) => c.id === id))
      out.push({ id: id as DashboardCardId, visible });
  }
  for (const card of DASHBOARD_CARDS)
    if (!out.some((c) => c.id === card.id)) out.push({ id: card.id, visible: true });
  return out;
}

export const serializeDashboardCards = (cards: DashboardCardPref[]) =>
  cards.map((c) => (c.visible ? c.id : `-${c.id}`)).join(',');

export function useDashboardCards() {
  const [value, set] = useSetting<string>(SETTINGS.dashboardCards, '');
  const cards = parseDashboardCards(value);
  return [cards, (next: DashboardCardPref[]) => set(serializeDashboardCards(next))] as const;
}

type OnOff = 'on' | 'off';

/** Hábitos e jogo: depth and points shown, celebration banners, default creature. */
export function useGamePrefs() {
  const [depth, setDepth] = useSetting<OnOff>(SETTINGS.showDepth, 'on');
  const [celebrations, setCelebrations] = useSetting<OnOff>(SETTINGS.celebrations, 'on');
  const [creature, setCreature] = useSetting<string>(SETTINGS.defaultCreature, 'turtle');
  return {
    showDepth: depth !== 'off',
    setShowDepth: (v: boolean) => void setDepth(v ? 'on' : 'off'),
    celebrations: celebrations !== 'off',
    setCelebrations: (v: boolean) => void setCelebrations(v ? 'on' : 'off'),
    defaultCreature: isCreatureId(creature) ? creature : ('turtle' as CreatureId),
    setDefaultCreature: (c: CreatureId) => void setCreature(c),
  };
}

const START_ROUTES: Record<Exclude<StartTab, 'home'>, Href> = {
  habits: { pathname: '/aquarium', params: { tab: 'habits' } },
  routines: { pathname: '/aquarium', params: { tab: 'routines' } },
  lists: { pathname: '/aquarium', params: { tab: 'lists' } },
};

/**
 * Opens the tab chosen in Ajustes → Início when the app starts on the dashboard (not when a
 * link or a notification opened another screen). Runs once per launch.
 */
export function useOpenStartTab() {
  const settings = useContext(SettingsContext);
  const pathname = usePathname();
  const first = useRef(pathname);
  useEffect(() => {
    if (!settings || first.current !== '/') return;
    let active = true;
    settings
      .get(SETTINGS.startTab)
      .then((tab) => {
        if (active && tab && tab !== 'home' && tab in START_ROUTES)
          router.replace(START_ROUTES[tab as keyof typeof START_ROUTES]);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [settings]);
}
