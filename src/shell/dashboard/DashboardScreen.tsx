import { useRouter } from 'expo-router';
import { Settings } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { toDateKey } from '@/core/dates';
import { useProfile } from '@/core/profile/useProfile';
import { IconButton, Screen, cascade, spacing, useBreakpoint, useTheme } from '@/design-system';
import { TodayHabits } from '@/features/habits/components/TodayHabits';
import { useTodayHabitProgress } from '@/features/habits/hooks/queries';
import { TodayRoutines } from '@/features/routines/components/TodayRoutines';
import { useTodayRoutineProgress } from '@/features/routines/hooks/queries';
import { PinnedFolders } from '@/features/todo/components/PinnedFolders';
import { TodayTasks } from '@/features/todo/components/TodayTasks';
import { useToday } from '@/features/todo/hooks/queries';

import { RoutineExtras } from '../connections/RoutineExtras';
import { DepthGauge } from '../progress/DepthGauge';
import { useProgress } from '../progress/useProgress';
import { useDashboardCards, useGamePrefs, type DashboardCardId } from '../settings/prefs';
import { WeekStatsCard } from '../stats/WeekStatsCard';
import { InstallHint } from '../install/InstallHint';
import { fitBoard, fitShape, packBento } from './bento';
import { HomeTank } from './HomeTank';
import { MiniHabits, MiniNow } from './MiniTiles';
import { Tile } from './Tile';
import { TideCalendar } from './TideCalendar';
import { TidesBox } from './TidesBox';
import { WeekChart } from './WeekChart';

function greeting(date: Date, name: string): string {
  const hour = date.getHours();
  const hello =
    hour < 5 ? 'Boa noite' : hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
  return name ? `${hello}, ${name.split(' ')[0]}` : hello;
}

function dateLabel(date: Date): string {
  const label = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Início: the whole day at a glance, gathered from every module. Phones stack the blocks;
 * tablets and desktops lay them out as a bento of two or three columns.
 */
export function DashboardScreen() {
  const breakpoint = useBreakpoint();
  const { reduceMotion } = useTheme();
  const router = useRouter();
  const now = new Date();
  const todayKey = toDateKey(now);
  const { data: profile } = useProfile();
  const name = profile?.name ?? '';
  const { data: tasks = [] } = useToday();
  const habits = useTodayHabitProgress();
  const routines = useTodayRoutineProgress();
  const { data: progress } = useProgress();
  const [cards] = useDashboardCards();
  const { showDepth } = useGamePrefs();
  const byDay = progress?.byDay ?? {};

  const tasksDone = tasks.filter((t) => t.completedAt).length;
  const done = tasksDone + habits.completed + routines.completed;
  const total = tasks.length + habits.total + routines.total;
  const tide = <HomeTank done={done} total={total} />;
  const go = (href: Parameters<typeof router.navigate>[0]) => () => router.navigate(href);
  // Every block, bare inside its tile, with where the whole block goes.
  const blocks: Record<DashboardCardId, { node: ReactNode; label: string; open: () => void }> = {
    depth: { node: <DepthGauge />, label: 'Abrir o perfil', open: go('/profile') },
    weekStats: { node: <WeekStatsCard bare />, label: 'Abrir estatísticas', open: go('/stats') },
    routines: {
      node: (
        <TodayRoutines
          bare
          // On computers the week sits beside it, under the tank: only today here.
          week={breakpoint !== 'expanded'}
          renderExtra={(routine) => <RoutineExtras routine={routine} />}
        />
      ),
      label: 'Abrir a agenda',
      open: go({ pathname: '/aquarium', params: { tab: 'routines', view: 'timeline' } }),
    },
    habits: {
      node: <TodayHabits bare />,
      label: 'Abrir hábitos',
      open: go({ pathname: '/aquarium', params: { tab: 'habits' } }),
    },
    tasks: {
      node: <TodayTasks bare />,
      label: 'Abrir listas',
      open: go({ pathname: '/aquarium', params: { tab: 'lists' } }),
    },
    folders: {
      node: <PinnedFolders bare />,
      label: 'Abrir pastas',
      open: go({ pathname: '/aquarium', params: { tab: 'lists' } }),
    },
    week: {
      node: <WeekChart bare todayKey={todayKey} byDay={byDay} />,
      label: 'Abrir estatísticas',
      open: go('/stats'),
    },
    calendar: {
      node: (
        <TideCalendar
          bare
          todayKey={todayKey}
          byDay={byDay}
          onDay={(day) =>
            router.navigate({
              pathname: '/aquarium',
              params: { tab: 'routines', view: 'month', day },
            })
          }
        />
      ),
      label: 'Abrir a agenda do mês',
      open: go({ pathname: '/aquarium', params: { tab: 'routines', view: 'month' } }),
    },
  };
  // Ajustes → Início: the person's order, without the hidden blocks (and without
  // Profundidade when depth is off, or beside the tank on wider screens, which shows it).
  const wide = breakpoint === 'expanded';
  const visible = cards
    .filter((c) => c.visible && (c.id !== 'depth' || (showDepth && breakpoint === 'compact')))
    .filter((c) => c.id !== 'calendar' || breakpoint !== 'compact')
    .map((c) => c.id);
  const tile = (id: DashboardCardId, fill = false, scroll = false) => (
    <Tile
      key={id}
      label={blocks[id].label}
      onPress={blocks[id].open}
      plain={id === 'depth'}
      fill={fill}
      scroll={scroll}
    >
      {blocks[id].node}
    </Tile>
  );
  const tankTile = (fill = false) => (
    <Tile key="tank" label="Abrir o Aquário" onPress={go('/aquarium')} plain fill={fill}>
      {fill ? <FillingTank done={done} total={total} /> : tide}
    </Tile>
  );

  // Computers: the tides box (week or month), from whichever of the two the person kept.
  const tidesId: DashboardCardId | undefined = visible.includes('week')
    ? 'week'
    : visible.includes('calendar')
      ? 'calendar'
      : undefined;

  // Wider screens: a grid that fills every row (no column ends early, Fase 4).
  const columns = wide ? 3 : 2;
  const rows = packBento<DashboardCardId | 'tank'>(
    [{ id: 'tank', span: 1 }, ...visible.map((id) => ({ id, span: WIDE_BLOCKS.has(id) ? 2 : 1 }))],
    columns,
  );

  return (
    <Screen
      title={greeting(now, name)}
      eyebrow={dateLabel(now)}
      wide={wide}
      // Computers: the whole day in one window, no page scroll.
      fit={wide}
      // Wider screens reach Ajustes from the sidebar or the rail.
      actions={
        breakpoint === 'compact' ? (
          <IconButton
            icon={Settings}
            label="Ajustes"
            onPress={() => router.push('/profile/settings')}
          />
        ) : undefined
      }
    >
      <InstallHint />
      {breakpoint === 'compact' ? (
        <>
          {/* The blocks come in one after another (Fase 5). */}
          <Animated.View entering={cascade(0, reduceMotion)}>{tankTile()}</Animated.View>
          {/* The day in numbers, side by side, before the full blocks. */}
          <Animated.View entering={cascade(1, reduceMotion)} style={styles.row}>
            <MiniHabits />
            <MiniNow />
          </Animated.View>
          {visible.map((id, i) => (
            <Animated.View key={id} entering={cascade(i + 2, reduceMotion)}>
              {tile(id)}
            </Animated.View>
          ))}
        </>
      ) : wide ? (
        <FitGrid
          // The week and the month are one box with a switch, under the tank.
          ids={visible.filter((id) => id !== (tidesId === 'week' ? 'calendar' : 'week'))}
          under={tidesId}
          tank={tankTile(true)}
          tile={(id) =>
            id === tidesId ? (
              <Tile key={id} label="Abrir estatísticas" onPress={go('/stats')} fill scroll>
                <TidesBox
                  todayKey={todayKey}
                  byDay={byDay}
                  initial={id === 'calendar' ? 'month' : 'week'}
                  onDay={(day) =>
                    router.navigate({
                      pathname: '/aquarium',
                      params: { tab: 'routines', view: 'month', day },
                    })
                  }
                />
              </Tile>
            ) : (
              tile(id, true, true)
            )
          }
          reduceMotion={reduceMotion}
        />
      ) : (
        <View style={styles.grid}>
          {rows.map((row, r) => (
            <View key={r} style={styles.row}>
              {row.map((item, c) => (
                // The blocks come in one after another (Fase 5), row by row.
                <Animated.View
                  key={item.id}
                  entering={cascade(r * 2 + c, reduceMotion)}
                  style={[styles.cell, { flex: item.span }]}
                >
                  {item.id === 'tank' ? tankTile(true) : tile(item.id, true)}
                </Animated.View>
              ))}
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

/**
 * Computers (Fase 5): Início fills the window with no page scroll, whatever the screen,
 * from a laptop to a 27" monitor. The tank takes the first column, the day's agenda the last,
 * and the other blocks stack in the columns between, as many as fit, in the person's order
 * (Ajustes → Início). Each box keeps its size; what is taller scrolls inside it.
 */
function FitGrid({
  ids,
  under,
  tank,
  tile,
  reduceMotion,
}: {
  ids: DashboardCardId[];
  under?: DashboardCardId;
  tank: ReactNode;
  tile: (id: DashboardCardId) => ReactNode;
  reduceMotion: boolean;
}) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);
  // Until the window is measured, a laptop-sized guess (no empty first frame).
  const { width, height } = size ?? { width: 1100, height: 600 };
  const board = fitBoard(ids, fitShape(width, height), 'routines', under);
  let order = 0;
  return (
    <View
      style={styles.board}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (!size || Math.abs(size.width - width) > 1 || Math.abs(size.height - height) > 1)
          setSize({ width, height });
      }}
    >
      <>
        <View style={styles.column}>
          <Animated.View entering={cascade(order++, reduceMotion)} style={styles.tankBox}>
            {tank}
          </Animated.View>
          {board.underTank ? (
            <Animated.View entering={cascade(order++, reduceMotion)} style={styles.box}>
              {tile(board.underTank)}
            </Animated.View>
          ) : null}
        </View>
        {board.columns.map((column) => (
          <View key={column.join()} style={styles.column}>
            {column.map((id) => (
              // The blocks come in one after another (Fase 5).
              <Animated.View key={id} entering={cascade(order++, reduceMotion)} style={styles.box}>
                {tile(id)}
              </Animated.View>
            ))}
          </View>
        ))}
      </>
    </View>
  );
}

/** The tank as tall as its row, so a taller neighbor leaves no hole under it. */
function FillingTank({ done, total }: { done: number; total: number }) {
  const [height, setHeight] = useState(0);
  return (
    <View
      style={styles.fill}
      onLayout={(e) => {
        const next = Math.round(e.nativeEvent.layout.height);
        if (Math.abs(next - height) > 1) setHeight(next);
      }}
    >
      {/* Over the space, not in it: the row's height comes from the blocks beside it. */}
      <View style={StyleSheet.absoluteFill}>
        <HomeTank done={done} total={total} height={Math.max(TANK_MIN, height)} />
      </View>
    </View>
  );
}

const TANK_MIN = 318;

/** Blocks that want two columns on wider screens. */
const WIDE_BLOCKS = new Set<DashboardCardId>(['week', 'calendar']);

const styles = StyleSheet.create({
  grid: { gap: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.lg, alignItems: 'stretch' },
  cell: { minWidth: 0, flexBasis: 0 },
  fill: { flex: 1, minHeight: TANK_MIN },
  board: { flex: 1, flexDirection: 'row', gap: spacing.lg },
  column: { flex: 1, flexBasis: 0, minWidth: 0, gap: spacing.lg },
  box: { flex: 1, flexBasis: 0, minHeight: 0 },
  // The tank keeps two thirds of its column when the tides sit under it.
  tankBox: { flex: 2, flexBasis: 0, minHeight: 0 },
});
