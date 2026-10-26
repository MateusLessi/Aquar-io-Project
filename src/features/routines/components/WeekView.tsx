import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewInstance,
} from 'react-native';

import { addDays, fromDateKey } from '@/core/dates';
import {
  Button,
  IconButton,
  Text,
  listColors,
  radius,
  spacing,
  useBreakpoint,
  useTheme,
  withAlpha,
} from '@/design-system';

import { hourRange, routinesOn, toMinutes, weekDays, weekStartOf } from '../domain/schedule';
import type { RoutineToday } from '../domain/types';
import { useRoutineDone } from '../hooks/queries';

const DAY_SHORT = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const DAY_NAMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const RAIL = 40;

/** What a block offers to find where it is on screen. */
export type Measurable = {
  measureInWindow: (
    callback: (x: number, y: number, width: number, height: number) => void,
  ) => void;
};

/** Lets the app shell turn week blocks into drop targets (dragging habits and lists in). */
export type WeekDropTarget = {
  /** The routine under the finger, lit up. */
  highlight: string | null;
  /** Something is picked: tapping a block places it there instead of opening the routine. */
  armed: boolean;
  register: (key: string, routineId: string, view: Measurable | null) => void;
  onPick: (routine: RoutineToday) => void;
};

export type WeekViewProps = {
  routines: RoutineToday[];
  todayKey: string;
  /** Minutes since midnight, for the "now" line. */
  nowMinutes: number;
  day: string;
  onDay: (day: string) => void;
  onOpen: (routine: RoutineToday, day: string) => void;
  /** What sits inside a block (the habits and lists placed in the routine). */
  renderBlockExtra?: (routine: RoutineToday, day: string) => React.ReactNode;
  dropTarget?: WeekDropTarget;
  /** Under the grid (the tray of things to drag in). */
  footer?: React.ReactNode;
};

const dayLabel = (key: string) => {
  const d = fromDateKey(key);
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`;
};

/**
 * The week as columns of time, one per day, with each routine as a block at its hours (like a
 * planner). On a phone it is one day at a time, swiped like a carousel; wider screens show all
 * seven columns.
 */
export function WeekView(props: WeekViewProps) {
  const wide = useBreakpoint() !== 'compact';
  const { day, onDay, todayKey } = props;
  const start = weekStartOf(day);
  const days = weekDays(start);
  const first = fromDateKey(start);
  const last = fromDateKey(days[6]!);
  const range = `${first.getDate()} ${MONTHS[first.getMonth()]} – ${last.getDate()} ${MONTHS[last.getMonth()]}`;

  return (
    <View style={styles.root}>
      <View style={styles.nav}>
        <IconButton
          icon={ChevronLeft}
          label="Semana anterior"
          onPress={() => onDay(addDays(day, -7))}
        />
        <Text variant="headline" style={styles.range} accessibilityRole="header">
          {range}
        </Text>
        <IconButton
          icon={ChevronRight}
          label="Próxima semana"
          onPress={() => onDay(addDays(day, 7))}
        />
        {weekStartOf(todayKey) !== start || (!wide && day !== todayKey) ? (
          <Button label="Hoje" variant="ghost" onPress={() => onDay(todayKey)} />
        ) : null}
      </View>
      {wide ? <WideWeek {...props} days={days} /> : <DayCarousel {...props} days={days} />}
      {props.footer}
    </View>
  );
}

/** Tablet and PC: seven columns side by side. */
function WideWeek({ days, ...props }: WeekViewProps & { days: string[] }) {
  const { colors } = useTheme();
  const hours = hourRange(props.routines);
  const hour = 56;
  const { data: done } = useRoutineDone(days[0]!, days[6]!);
  return (
    <View>
      <View style={styles.headRow}>
        <View style={{ width: RAIL }} />
        {days.map((key) => {
          const today = key === props.todayKey;
          return (
            <Pressable
              key={key}
              onPress={() => props.onDay(key)}
              accessibilityRole="button"
              accessibilityLabel={dayLabel(key)}
              style={[styles.colHead, today && { backgroundColor: colors.accentSoft }]}
            >
              <Text variant="caption" tone={today ? 'accent' : 'secondary'}>
                {DAY_SHORT[fromDateKey(key).getDay()]}
              </Text>
              <Text variant="title2" tone={today ? 'accent' : 'primary'}>
                {fromDateKey(key).getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.gridRow}>
        <HourRail from={hours.from} to={hours.to} hour={hour} />
        {days.map((key) => (
          <DayColumn
            key={key}
            {...props}
            dayKey={key}
            hours={hours}
            hour={hour}
            done={done}
            compact
          />
        ))}
      </View>
    </View>
  );
}

/** Phone: a strip of days on top and one day below, swiped sideways to move between days. */
function DayCarousel({ days, ...props }: WeekViewProps & { days: string[] }) {
  const { colors, scheme } = useTheme();
  const hours = hourRange(props.routines);
  const hour = 44;
  const { data: done } = useRoutineDone(days[0]!, days[6]!);
  const [width, setWidth] = useState(0);
  const scroller = useRef<ScrollViewInstance>(null);
  const index = Math.max(0, days.indexOf(props.day));
  const week = days[0];

  // Keep the visible page on the chosen day (tapped in the strip, "Hoje", or a new week).
  useEffect(() => {
    if (width > 0) scroller.current?.scrollTo({ x: index * width, animated: false });
  }, [index, width, week]);

  const onLayout = (e: LayoutChangeEvent) => {
    const next = Math.round(e.nativeEvent.layout.width);
    if (next !== width) setWidth(next);
  };
  const onSettle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width === 0) return;
    const page = Math.round(e.nativeEvent.contentOffset.x / width);
    const key = days[page];
    if (key && key !== props.day) props.onDay(key);
  };

  return (
    <View style={styles.carousel}>
      <View style={styles.strip}>
        {days.map((key) => {
          const selected = key === props.day;
          const today = key === props.todayKey;
          const on = routinesOn(props.routines, key);
          return (
            <Pressable
              key={key}
              onPress={() => props.onDay(key)}
              accessibilityRole="tab"
              accessibilityLabel={`${dayLabel(key)}, ${on.length} ${on.length === 1 ? 'rotina' : 'rotinas'}`}
              accessibilityState={{ selected }}
              style={[
                styles.stripDay,
                {
                  backgroundColor: selected ? colors.accent : colors.surfacePressed,
                  borderColor: today && !selected ? colors.accent : 'transparent',
                },
              ]}
            >
              <Text variant="caption" tone={selected ? 'onAccent' : 'tertiary'}>
                {DAY_SHORT[fromDateKey(key).getDay()]}
              </Text>
              <Text variant="headline" tone={selected ? 'onAccent' : 'primary'}>
                {fromDateKey(key).getDate()}
              </Text>
              <View style={styles.dots}>
                {on.slice(0, 4).map((r) => (
                  <View
                    key={r.id}
                    style={[
                      styles.dot,
                      {
                        backgroundColor: selected ? colors.onAccent : listColors[r.color][scheme],
                      },
                    ]}
                  />
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>
      <View onLayout={onLayout}>
        {width > 0 ? (
          <ScrollView
            // A new week starts on its selected day.
            key={days[0]}
            ref={scroller}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: index * width, y: 0 }}
            onMomentumScrollEnd={onSettle}
            onScrollEndDrag={onSettle}
          >
            {days.map((key) => (
              <View key={key} style={[styles.page, { width }]}>
                <HourRail from={hours.from} to={hours.to} hour={hour} />
                <DayColumn {...props} dayKey={key} hours={hours} hour={hour} done={done} />
              </View>
            ))}
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
}

function HourRail({ from, to, hour }: { from: number; to: number; hour: number }) {
  const labels = [];
  for (let h = from; h <= to; h += 2) labels.push(h);
  return (
    <View style={[styles.rail, { height: (to - from) * hour }]} importantForAccessibility="no">
      {labels.map((h) => (
        <Text
          key={h}
          variant="caption"
          tone="tertiary"
          style={[styles.hourLabel, { top: (h - from) * hour - 8 }]}
        >
          {String(h).padStart(2, '0')}:00
        </Text>
      ))}
    </View>
  );
}

function DayColumn({
  dayKey,
  routines,
  todayKey,
  nowMinutes,
  hours,
  hour,
  done,
  compact,
  onOpen,
  renderBlockExtra,
  dropTarget,
}: WeekViewProps & {
  dayKey: string;
  hours: { from: number; to: number };
  hour: number;
  done: Map<string, number> | undefined;
  /** Narrow columns: smaller text, no extras on short blocks. */
  compact?: boolean;
}) {
  const { colors, scheme } = useTheme();
  const today = dayKey === todayKey;
  const y = (minutes: number) => ((minutes - hours.from * 60) / 60) * hour;
  const lines = [];
  for (let h = hours.from; h <= hours.to; h += 2) lines.push(h);
  const on = routinesOn(routines, dayKey);

  return (
    <View
      style={[
        styles.column,
        { height: (hours.to - hours.from) * hour },
        today && { backgroundColor: withAlpha(colors.accent, 0.06) },
      ]}
    >
      {lines.map((h) => (
        <View
          key={h}
          style={[styles.line, { top: y(h * 60), backgroundColor: colors.separator }]}
        />
      ))}
      {on.map((routine) => {
        const tone = listColors[routine.color][scheme];
        const top = y(toMinutes(routine.start));
        const height = Math.max(26, y(toMinutes(routine.end)) - top - 2);
        const total = routine.items.length;
        const doneCount = today
          ? routine.items.filter((i) => i.done).length
          : Math.min(total, done?.get(`${routine.id}:${dayKey}`) ?? 0);
        const past = dayKey < todayKey || (today && routine.phase === 'past');
        const now = today && routine.phase === 'now';
        const lit = dropTarget?.highlight === routine.id;
        const status = (past || today) && total > 0 ? `${doneCount} de ${total}` : null;
        const short = height < 44;
        const key = `${routine.id}:${dayKey}`;
        return (
          <Pressable
            key={routine.id}
            ref={
              dropTarget
                ? (view) => dropTarget.register(key, routine.id, view as Measurable | null)
                : undefined
            }
            onPress={() =>
              dropTarget?.armed ? dropTarget.onPick(routine) : onOpen(routine, dayKey)
            }
            accessibilityRole="button"
            accessibilityLabel={`${routine.name}, ${dayLabel(dayKey)}, ${routine.start} às ${routine.end}${
              routine.tag ? `, ${routine.tag}` : ''
            }${status ? `, ${status} feitos` : ''}`}
            style={({ pressed }) => [
              styles.block,
              {
                top,
                height,
                backgroundColor: lit
                  ? colors.accentSoft
                  : withAlpha(tone, now ? 0.3 : scheme === 'dark' ? 0.18 : 0.14),
                borderColor: lit ? colors.accent : withAlpha(tone, now ? 0.9 : 0.5),
                borderStyle: dropTarget?.armed && !lit ? 'dashed' : 'solid',
                opacity: past && !lit ? 0.6 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              },
            ]}
          >
            {short ? (
              <Text variant="caption" numberOfLines={1}>
                {routine.emoji ? `${routine.emoji} ` : ''}
                {routine.name} · {routine.start}
              </Text>
            ) : compact ? (
              // A narrow column: one fact per line.
              <>
                <Text variant="caption" numberOfLines={1}>
                  {routine.emoji ? `${routine.emoji} ` : ''}
                  {routine.name}
                </Text>
                <Text variant="caption" tone="secondary" numberOfLines={1} style={styles.small}>
                  {routine.start}–{routine.end}
                </Text>
                {height >= 64 && (routine.tag || status) ? (
                  <View style={styles.tagRow}>
                    {routine.tag ? <Tag label={routine.tag} tone={tone} /> : null}
                    {status ? (
                      <Text variant="caption" tone="secondary" style={styles.small}>
                        {status}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
                {height >= 92 ? renderBlockExtra?.(routine, dayKey) : null}
              </>
            ) : (
              <>
                <View style={styles.tagRow}>
                  <Text variant="headline" numberOfLines={1} style={styles.flex}>
                    {routine.emoji ? `${routine.emoji} ` : ''}
                    {routine.name}
                  </Text>
                  {routine.tag ? <Tag label={routine.tag} tone={tone} /> : null}
                </View>
                <Text variant="caption" tone="secondary" numberOfLines={1}>
                  {routine.start}–{routine.end}
                  {status ? ` · ${status}` : ''}
                </Text>
                {height >= 60 ? renderBlockExtra?.(routine, dayKey) : null}
              </>
            )}
          </Pressable>
        );
      })}
      {today && nowMinutes >= hours.from * 60 && nowMinutes <= hours.to * 60 ? (
        <View
          pointerEvents="none"
          style={[styles.now, { top: y(nowMinutes), backgroundColor: colors.energy }]}
        >
          <View style={[styles.nowDot, { backgroundColor: colors.energy }]} />
        </View>
      ) : null}
      {on.length === 0 && !compact ? (
        <Text variant="footnote" tone="tertiary" style={styles.rest}>
          Sem rotinas neste dia. Dia de descanso 🌊
        </Text>
      ) : null}
    </View>
  );
}

function Tag({ label, tone }: { label: string; tone: string }) {
  return (
    <View style={[styles.tag, { backgroundColor: withAlpha(tone, 0.3) }]}>
      <Text variant="caption" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  nav: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  range: { flex: 1, textAlign: 'center' },
  headRow: { flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.sm },
  colHead: { flex: 1, alignItems: 'center', paddingVertical: spacing.xs, borderRadius: radius.md },
  gridRow: { flexDirection: 'row', gap: spacing.xs, paddingTop: spacing.sm },
  carousel: { gap: spacing.md },
  strip: { flexDirection: 'row', gap: spacing.xs },
  stripDay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  dots: { flexDirection: 'row', gap: 2, height: 4, marginTop: 3 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  page: { flexDirection: 'row', gap: spacing.xs, paddingTop: spacing.sm },
  rail: { width: RAIL },
  hourLabel: { position: 'absolute', left: 0, fontVariant: ['tabular-nums'] },
  column: { flex: 1, borderRadius: radius.md },
  line: { position: 'absolute', left: 0, right: 0, height: StyleSheet.hairlineWidth },
  block: {
    position: 'absolute',
    left: 2,
    right: 2,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 6,
    paddingVertical: 4,
    overflow: 'hidden',
    gap: 1,
  },
  flex: { flex: 1 },
  small: { fontSize: 11 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  tag: {
    alignSelf: 'flex-start',
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    maxWidth: '100%',
  },
  now: { position: 'absolute', left: 0, right: 0, height: 2 },
  nowDot: { position: 'absolute', left: -4, top: -3, width: 8, height: 8, borderRadius: 4 },
  rest: { position: 'absolute', top: spacing.xl, left: spacing.md, right: spacing.md },
});
