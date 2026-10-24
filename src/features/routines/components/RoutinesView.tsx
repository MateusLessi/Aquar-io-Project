import { Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text, listColors, radius, spacing, useTheme, withAlpha } from '@/design-system';

import { durationLabel, toMinutes } from '../domain/schedule';
import type { RoutineToday } from '../domain/types';

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

type RoutinesViewProps = {
  routines: RoutineToday[];
  onOpen: (id: string) => void;
  onCreate: () => void;
  /**
   * Draws a routine richer than the plain card (the app shell's connected "piece", which also
   * shows the habits and lists placed in it). Defaults to RoutineCard.
   */
  renderRoutine?: (routine: RoutineToday, onEdit: () => void) => React.ReactNode;
};

/** All routines in time order: today's first, then the ones resting today. */
export function RoutinesView({ routines, onOpen, onCreate, renderRoutine }: RoutinesViewProps) {
  const draw = (r: RoutineToday) =>
    renderRoutine ? (
      <View key={r.id}>{renderRoutine(r, () => onOpen(r.id))}</View>
    ) : (
      <RoutineCard key={r.id} routine={r} onPress={() => onOpen(r.id)} />
    );
  const today = routines.filter((r) => r.phase !== 'rest');
  const resting = routines.filter((r) => r.phase === 'rest');
  return (
    <View style={styles.root}>
      <Section title="Hoje">
        {today.map(draw)}
        {resting.length === 0 ? <NewRoutineCard onPress={onCreate} /> : null}
      </Section>
      {resting.length > 0 ? (
        <Section title="Outros dias">
          {resting.map(draw)}
          <NewRoutineCard onPress={onCreate} />
        </Section>
      ) : null}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="overline" tone="tertiary" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}

export function RoutineCard({ routine, onPress }: { routine: RoutineToday; onPress: () => void }) {
  const { colors, scheme } = useTheme();
  const tone = listColors[routine.color][scheme];
  const length = durationLabel(toMinutes(routine.end) - toMinutes(routine.start));
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${routine.name}, ${routine.start} às ${routine.end}, ${routine.items.length} itens`}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surfaceRaised,
          borderColor: withAlpha(tone, 0.35),
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={[styles.stripe, { backgroundColor: tone }]} />
      <View style={[styles.badge, { backgroundColor: withAlpha(tone, 0.2) }]}>
        <Text variant="title2">{routine.emoji ?? '⏱️'}</Text>
      </View>
      <View style={styles.texts}>
        <Text variant="headline" numberOfLines={1}>
          {routine.name}
        </Text>
        <Text variant="footnote" tone="secondary">
          {routine.start}–{routine.end} · {length} · {routine.items.length}{' '}
          {routine.items.length === 1 ? 'item' : 'itens'}
        </Text>
        <View style={styles.days}>
          {WEEKDAYS.map((d, i) => {
            const on = (routine.days & (1 << i)) !== 0;
            return (
              <Text
                key={i}
                variant="caption"
                style={[
                  styles.day,
                  on
                    ? { color: colors.surfaceRaised, backgroundColor: tone }
                    : { color: colors.textTertiary },
                ]}
              >
                {d}
              </Text>
            );
          })}
        </View>
      </View>
    </Pressable>
  );
}

function NewRoutineCard({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Nova rotina"
      style={({ pressed }) => [
        styles.card,
        styles.newCard,
        {
          borderColor: colors.border,
          backgroundColor: pressed ? colors.surfacePressed : 'transparent',
        },
      ]}
    >
      <View style={[styles.badge, { backgroundColor: colors.accentSoft }]}>
        <Plus size={24} color={colors.accent} />
      </View>
      <View style={styles.texts}>
        <Text variant="headline" tone="accent">
          Nova rotina
        </Text>
        <Text variant="footnote" tone="secondary">
          Um bloco do seu dia, como manhã, trabalho ou academia
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xl },
  section: { gap: spacing.sm },
  sectionTitle: { marginLeft: spacing.xs },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  newCard: { borderStyle: 'dashed', borderWidth: 1.5 },
  stripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: 2 },
  days: { flexDirection: 'row', gap: 4, marginTop: spacing.xs },
  day: {
    width: 20,
    height: 20,
    borderRadius: 10,
    textAlign: 'center',
    lineHeight: 20,
    overflow: 'hidden',
  },
});
