import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { weekdayOf } from '@/core/dates';
import {
  SegmentedControl,
  Text,
  haptics,
  listColors,
  spacing,
  useBreakpoint,
  useTheme,
  withAlpha,
} from '@/design-system';
import { creatures } from '@/features/habits/domain/creatures';
import {
  WeekView,
  type Measurable,
  type WeekViewProps,
} from '@/features/routines/components/WeekView';
import { weekStartOf } from '@/features/routines/domain/schedule';
import type { RoutineToday } from '@/features/routines/domain/types';

import { useConnect, type ConnectItem } from './ConnectProvider';
import { DraggableChip } from './DraggableChip';
import { useConnections, type Connected } from './useConnected';

type Tray = 'habits' | 'lists' | 'folders';
type Rect = { routineId: string; x: number; y: number; width: number; height: number };

/**
 * The week with what is linked into each routine drawn inside its blocks, and, on wide
 * screens, a tray to drag habits, lists and folders onto a block (or tap one, then a block).
 */
export function ConnectedWeek(week: WeekViewProps) {
  const wide = useBreakpoint() !== 'compact';
  const connections = useConnections();
  const { connect, accepts } = useConnect();
  const [held, setHeld] = useState<ConnectItem | null>(null);
  const [selected, setSelected] = useState<ConnectItem | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const blocks = useRef(new Map<string, { routineId: string; view: Measurable }>());
  const rects = useRef<Rect[]>([]);
  const active = held ?? selected;

  const routineName = (id: string) => week.routines.find((r) => r.id === id)?.name ?? '';
  const fits = (item: ConnectItem, routineId: string) =>
    accepts(item, { kind: 'routine', id: routineId, name: routineName(routineId) });
  const place = (item: ConnectItem, routineId: string) => {
    if (fits(item, routineId))
      connect(item, { kind: 'routine', id: routineId, name: routineName(routineId) });
  };

  const measure = () => {
    const next: Rect[] = [];
    for (const { routineId, view } of blocks.current.values())
      view.measureInWindow((x, y, width, height) => next.push({ routineId, x, y, width, height }));
    rects.current = next;
  };
  const hit = (x: number, y: number) =>
    rects.current.find((r) => x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height)
      ?.routineId ?? null;

  return (
    <WeekView
      {...week}
      renderBlockExtra={(routine, day) => (
        <BlockExtras
          inside={connections.inside('routine', routine.id)}
          routine={routine}
          day={day}
          todayKey={week.todayKey}
          narrow={wide}
        />
      )}
      dropTarget={
        wide
          ? {
              highlight: active && hover && fits(active, hover) ? hover : null,
              armed: selected !== null,
              register: (key, routineId, view) => {
                if (view) blocks.current.set(key, { routineId, view });
                else blocks.current.delete(key);
              },
              onPick: (routine) => {
                if (selected) place(selected, routine.id);
                setSelected(null);
              },
            }
          : undefined
      }
      footer={
        wide ? (
          <WeekTray
            selected={selected}
            held={held}
            onSelect={(item) => setSelected(selected?.id === item.id ? null : item)}
            onLift={(item) => {
              haptics.selection();
              measure();
              setSelected(null);
              setHeld(item);
            }}
            onMove={(x, y) => {
              const id = hit(x, y);
              if (id !== hover) setHover(id);
            }}
            onRelease={(item, x, y) => {
              const id = hit(x, y);
              if (id) place(item, id);
              setHeld(null);
              setHover(null);
            }}
          />
        ) : null
      }
    />
  );
}

/** The habits (with today's fill) and lists placed in a routine, as small rows in its block. */
function BlockExtras({
  inside,
  routine,
  day,
  todayKey,
  narrow,
}: {
  /** Seven columns side by side: no room for the time. */
  narrow: boolean;
  inside: Connected[];
  routine: RoutineToday;
  day: string;
  todayKey: string;
}) {
  const { colors, scheme } = useTheme();
  if (inside.length === 0) return null;
  const tone = listColors[routine.color][scheme];
  const shown = inside.slice(0, 2);
  // Only this week's days up to today have a real fill; other days show the plan.
  const known = weekStartOf(day) === weekStartOf(todayKey) && day <= todayKey;
  return (
    <View style={styles.extras}>
      {shown.map((c) => {
        const label =
          c.kind === 'habit'
            ? `${creatures[c.habit.creature].emoji} ${c.habit.name}`
            : c.kind === 'list'
              ? `${c.list.emoji ?? '📋'} ${c.list.name}`
              : `${c.folder.emoji ?? '📁'} ${c.folder.name}`;
        const ratio =
          c.kind === 'habit' && known ? (c.habit.weekRatios[weekdayOf(day)] ?? 0) : null;
        return (
          <View
            key={c.link.id}
            style={[styles.mini, { backgroundColor: withAlpha(colors.surfaceDeep, 0.25) }]}
          >
            {c.kind === 'habit' ? (
              <View
                style={[
                  styles.ring,
                  {
                    borderColor: tone,
                    backgroundColor:
                      ratio === null
                        ? 'transparent'
                        : withAlpha(tone, ratio >= 1 ? 1 : ratio * 0.6),
                  },
                ]}
              />
            ) : null}
            <Text variant="caption" numberOfLines={1} style={styles.flex}>
              {label}
            </Text>
            {c.link.at && !narrow ? (
              <Text variant="caption" tone="tertiary">
                {c.link.at}
              </Text>
            ) : null}
          </View>
        );
      })}
      {inside.length > shown.length ? (
        <Text variant="caption" tone="tertiary">
          +{inside.length - shown.length}
        </Text>
      ) : null}
    </View>
  );
}

function WeekTray({
  selected,
  held,
  onSelect,
  onLift,
  onMove,
  onRelease,
}: {
  selected: ConnectItem | null;
  held: ConnectItem | null;
  onSelect: (item: ConnectItem) => void;
  onLift: (item: ConnectItem) => void;
  onMove: (x: number, y: number) => void;
  onRelease: (item: ConnectItem, x: number, y: number) => void;
}) {
  const { habits, lists, folders } = useConnections();
  const [tray, setTray] = useState<Tray>('habits');
  const items: { item: ConnectItem; label: string }[] =
    tray === 'habits'
      ? habits.map((h) => ({
          item: { kind: 'habit', id: h.id, name: h.name },
          label: `${creatures[h.creature].emoji} ${h.name}`,
        }))
      : tray === 'lists'
        ? lists.map((l) => ({
            item: { kind: 'list', id: l.id, name: l.name },
            label: `${l.emoji ?? '📋'} ${l.name}`,
          }))
        : folders.map((f) => ({
            item: { kind: 'folder', id: f.id, name: f.name },
            label: `${f.emoji ?? '📁'} ${f.name}`,
          }));
  const active = held ?? selected;
  return (
    <View style={styles.tray}>
      <View style={styles.trayHead}>
        <Text variant="footnote" tone="secondary" style={styles.flex}>
          {active
            ? `Solte “${active.name}” num bloco, ou toque no bloco.`
            : 'Arraste para um bloco, ou toque no item e depois no bloco:'}
        </Text>
        <View style={styles.traySwitch}>
          <SegmentedControl
            accessibilityLabel="Bandeja"
            options={[
              { value: 'habits', label: 'Hábitos' },
              { value: 'lists', label: 'Listas' },
              { value: 'folders', label: 'Pastas' },
            ]}
            value={tray}
            onChange={(value) => setTray(value as Tray)}
          />
        </View>
      </View>
      <View style={styles.chips}>
        {items.length === 0 ? (
          <Text variant="footnote" tone="tertiary">
            Nada aqui ainda.
          </Text>
        ) : (
          items.map(({ item, label }) => (
            <DraggableChip
              key={`${item.kind}:${item.id}`}
              label={label}
              selected={selected?.id === item.id}
              lifted={held?.id === item.id}
              onSelect={() => onSelect(item)}
              onLift={() => onLift(item)}
              onMove={onMove}
              onRelease={(x, y) => onRelease(item, x, y)}
            />
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  extras: { gap: 3, marginTop: 3 },
  mini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  ring: { width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
  tray: { gap: spacing.sm, userSelect: 'none' },
  trayHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  traySwitch: { width: 300 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
