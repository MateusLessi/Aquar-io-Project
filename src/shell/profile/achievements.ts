import { ZONES } from '@/core/progress/rules';
import type { GlyphKey } from '@/design-system';
import { creatures, type CreatureId } from '@/features/habits/domain/creatures';
import { stageInfo, type Stage } from '@/features/habits/domain/stages';

/** What the profile's badges and showcase are computed from. */
export type AchievementFacts = {
  fullTides: number;
  meters: number;
  tasksDone: number;
  /** The longest streak ever, and whose. */
  bestStreak: { days: number; habitName: string; creature: CreatureId } | null;
  habits: { id: string; name: string; creature: CreatureId; stage: Stage }[];
  links: number;
  /** First day with anything in the app (YYYY-MM-DD), if any. */
  firstDay: string | null;
  todayKey: string;
};

export type Badge = {
  id: string;
  icon: GlyphKey;
  title: string;
  earned: boolean;
  /** What is left, for locked badges ("faltam 3 marés cheias"). */
  hint: string;
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const left = (target: number, have: number, one: string, many: string) =>
  `Faltam ${plural(Math.max(0, target - have), one, many)}`;

/** Fourteen badges, all earned from what was really done. Never lost once earned (depth only grows). */
export function badgesFor(f: AchievementFacts): Badge[] {
  const streak = f.bestStreak?.days ?? 0;
  const grown = f.habits.some((h) => h.stage === 'adult');
  const tide = (id: string, n: number, title: string): Badge => ({
    id,
    icon: 'waves',
    title,
    earned: f.fullTides >= n,
    hint: `Faltam ${Math.max(0, n - f.fullTides)}`,
  });
  const run = (id: string, n: number, icon: GlyphKey): Badge => ({
    id,
    icon,
    title: `${n} dias seguidos`,
    earned: streak >= n,
    hint: `Faltam ${Math.max(0, n - streak)}`,
  });
  const zone = (zoneId: string): Badge => {
    const z = ZONES.find((x) => x.id === zoneId)!;
    return {
      id: `zone-${zoneId}`,
      icon: z.icon,
      title: z.name,
      earned: f.meters >= z.from,
      hint: `Faltam ${new Intl.NumberFormat('pt-BR').format(Math.max(0, z.from - f.meters))} m`,
    };
  };
  return [
    tide('tide-1', 1, 'Primeira maré cheia'),
    tide('tide-10', 10, '10 marés cheias'),
    tide('tide-50', 50, '50 marés cheias'),
    run('streak-7', 7, 'flame'),
    run('streak-30', 30, 'moon'),
    run('streak-100', 100, 'gem'),
    zone('coastal'),
    zone('reef'),
    zone('open'),
    zone('twilight'),
    zone('midnight'),
    {
      id: 'tasks-100',
      icon: 'check',
      title: '100 tarefas',
      earned: f.tasksDone >= 100,
      hint: left(100, f.tasksDone, 'tarefa', 'tarefas'),
    },
    {
      id: 'grown',
      icon: 'star',
      title: 'Primeira criatura adulta',
      earned: grown,
      hint: 'Um hábito feito 30 dias',
    },
    {
      id: 'link',
      icon: 'link',
      title: 'Primeira conexão',
      earned: f.links > 0,
      hint: 'Coloque um hábito ou lista numa rotina',
    },
  ];
}

export type ShowcaseItem = {
  pick: string;
  icon: GlyphKey;
  /** A habit's creature, drawn instead of the icon. */
  creature?: CreatureId;
  label: string;
  value: string;
  detail: string;
};

/** The showcase options available now (favorites per habit, badges already earned). */
export function showcaseOptions(f: AchievementFacts, badges: Badge[]): ShowcaseItem[] {
  return [
    'streak',
    'tides',
    'tasks',
    'days',
    ...f.habits.map((h) => `favorite:${h.id}`),
    ...badges.filter((b) => b.earned).map((b) => `badge:${b.id}`),
  ]
    .map((pick) => showcaseItem(pick, f, badges))
    .filter((item): item is ShowcaseItem => item !== null);
}

/** One showcase pick as a tile; null when it no longer applies (a deleted habit…). */
export function showcaseItem(
  pick: string,
  f: AchievementFacts,
  badges: Badge[],
): ShowcaseItem | null {
  if (pick === 'streak')
    return f.bestStreak
      ? {
          pick,
          icon: 'flame',
          label: 'Sequência',
          value: plural(f.bestStreak.days, 'dia', 'dias'),
          detail: f.bestStreak.habitName,
        }
      : null;
  if (pick === 'tides')
    return {
      pick,
      icon: 'waves',
      label: 'Marés cheias',
      value: String(f.fullTides),
      detail: 'dias',
    };
  if (pick === 'tasks')
    return {
      pick,
      icon: 'check',
      label: 'Tarefas',
      value: String(f.tasksDone),
      detail: 'concluídas',
    };
  if (pick === 'days') {
    if (!f.firstDay) return null;
    const days =
      Math.round(
        (new Date(`${f.todayKey}T12:00:00`).getTime() -
          new Date(`${f.firstDay}T12:00:00`).getTime()) /
          86_400_000,
      ) + 1;
    return {
      pick,
      icon: 'calendar',
      label: 'No Aquar.io',
      value: plural(days, 'dia', 'dias'),
      detail: '',
    };
  }
  if (pick.startsWith('favorite:')) {
    const habit = f.habits.find((h) => h.id === pick.slice(9));
    return habit
      ? {
          pick,
          icon: 'star',
          creature: habit.creature,
          label: 'Favorita',
          value: creatures[habit.creature].name,
          detail: `${stageInfo[habit.stage].label} · ${habit.name}`,
        }
      : null;
  }
  if (pick.startsWith('badge:')) {
    const badge = badges.find((b) => b.id === pick.slice(6) && b.earned);
    return badge ? { pick, icon: badge.icon, label: 'Selo', value: badge.title, detail: '' } : null;
  }
  return null;
}
