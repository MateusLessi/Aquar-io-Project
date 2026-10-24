import { Pressable, StyleSheet, View } from 'react-native';

import {
  Button,
  Checkbox,
  Text,
  listColors,
  radius,
  spacing,
  useTheme,
  withAlpha,
} from '@/design-system';

import { durationLabel } from '../domain/schedule';
import type { RoutineToday } from '../domain/types';

type RoutineTimelineProps = {
  routines: RoutineToday[];
  onToggleItem: (routineId: string, itemId: string, done: boolean) => void;
  onOpen: (routineId: string) => void;
  onSeeAll: () => void;
  /** Extra content under a routine (the app shell shows the habits and lists placed in it). */
  renderExtra?: (routine: RoutineToday) => React.ReactNode;
};

/**
 * Today's routines on a timeline. The one happening now opens up with its checklist; the
 * next ones say when they start; the past ones fade with how much got done.
 */
export function RoutineTimeline({
  routines,
  onToggleItem,
  onOpen,
  onSeeAll,
  renderExtra,
}: RoutineTimelineProps) {
  const today = routines.filter((r) => r.phase !== 'rest');
  if (today.length === 0) return null;
  const done = today.filter((r) => r.items.length > 0 && r.items.every((i) => i.done)).length;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text variant="overline" tone="tertiary" style={styles.title}>
          Rotinas · {done} de {today.length}
        </Text>
        <Button label="Ver todas" variant="ghost" onPress={onSeeAll} />
      </View>
      <View>
        {today.map((routine, index) => (
          <TimelineRow
            key={routine.id}
            routine={routine}
            last={index === today.length - 1}
            onToggleItem={(itemId, checked) => onToggleItem(routine.id, itemId, checked)}
            onOpen={() => onOpen(routine.id)}
            extra={renderExtra?.(routine)}
          />
        ))}
      </View>
    </View>
  );
}

function TimelineRow({
  routine,
  last,
  onToggleItem,
  onOpen,
  extra,
}: {
  routine: RoutineToday;
  last: boolean;
  onToggleItem: (itemId: string, done: boolean) => void;
  onOpen: () => void;
  extra?: React.ReactNode;
}) {
  const { colors, scheme } = useTheme();
  const tone = listColors[routine.color][scheme];
  const now = routine.phase === 'now';
  const past = routine.phase === 'past';
  const doneCount = routine.items.filter((i) => i.done).length;
  const status = now
    ? `Agora · faltam ${durationLabel(routine.minutesLeft)}`
    : past
      ? `${doneCount} de ${routine.items.length} feitos`
      : `Em ${durationLabel(routine.minutesLeft)}`;

  return (
    <View style={[styles.row, past && styles.past]}>
      {/* The timeline: time, a dot, and the line down to the next routine. */}
      <View style={styles.rail}>
        <Text variant="caption" tone={now ? 'primary' : 'tertiary'} style={styles.time}>
          {routine.start}
        </Text>
        <View
          style={[
            styles.dot,
            { borderColor: tone, backgroundColor: now || past ? tone : colors.surfaceBase },
            now && styles.dotNow,
          ]}
        />
        {!last ? <View style={[styles.line, { backgroundColor: colors.border }]} /> : null}
      </View>

      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={`${routine.name}, ${routine.start} às ${routine.end}, ${status}`}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: now
              ? withAlpha(tone, scheme === 'dark' ? 0.28 : 0.16)
              : colors.surfaceRaised,
            borderColor: withAlpha(tone, now ? 0.7 : 0.25),
            transform: [{ scale: pressed ? 0.99 : 1 }],
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text variant={now ? 'title2' : 'headline'} numberOfLines={1} style={styles.flex}>
            {routine.emoji ? `${routine.emoji}  ` : ''}
            {routine.name}
          </Text>
          <Text variant="footnote" tone="secondary">
            {routine.start}–{routine.end}
          </Text>
        </View>
        <Text variant="footnote" style={{ color: now ? tone : colors.textSecondary }}>
          {status}
        </Text>

        {now && routine.items.length > 0 ? (
          <View style={styles.items}>
            {routine.items.map((item) => (
              <View key={item.id} style={styles.item}>
                <Checkbox
                  checked={item.done}
                  label={item.title}
                  onChange={(checked) => onToggleItem(item.id, checked)}
                />
                <Text variant="body" struck={item.done} style={styles.flex}>
                  {item.title}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {extra}

        {routine.items.length > 0 ? (
          <View style={[styles.track, { backgroundColor: withAlpha(tone, 0.18) }]}>
            <View
              style={[
                styles.fill,
                { width: `${(doneCount / routine.items.length) * 100}%`, backgroundColor: tone },
              ]}
            />
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { marginLeft: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.md },
  past: { opacity: 0.6 },
  rail: { width: 48, alignItems: 'center' },
  time: { marginTop: spacing.md, fontVariant: ['tabular-nums'] },
  dot: { width: 14, height: 14, borderRadius: 7, borderWidth: 2, marginTop: spacing.xs },
  dotNow: { width: 18, height: 18, borderRadius: 9 },
  line: { width: 2, flex: 1, marginTop: spacing.xs, borderRadius: 1 },
  card: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  items: { gap: spacing.sm, marginTop: spacing.sm },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  track: { height: 6, borderRadius: radius.pill, overflow: 'hidden', marginTop: spacing.sm },
  fill: { height: '100%', borderRadius: radius.pill },
});
