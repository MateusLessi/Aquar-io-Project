import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Button,
  Text,
  abyss,
  haptics,
  listColors,
  radius,
  spacing,
  specular,
  touchTarget,
  useTheme,
  withAlpha,
} from '@/design-system';

import { LevelBar } from '../components/GrowthBar';
import { CreatureTile, HabitControl } from '../components/HabitCard';
import { HabitPond } from '../components/HabitPond';
import { creatures } from '../domain/creatures';
import { stageInfo } from '../domain/stages';
import type { HabitWithProgress } from '../domain/types';
import { useHabits } from '../hooks/queries';
import { useHabitActions, type HabitActions } from '../hooks/useHabitActions';

/** The cards and the list stay this wide on big screens, under the middle of the pond. */
const PANEL_MAX = 560;
/** The creatures swim clear of the title and of the row of creatures at the bottom. */
const CLEAR_TOP = 64;
const CLEAR_BOTTOM = 110;

const resting = (h: HabitWithProgress) => !h.scheduledToday && !h.doneToday;
const statusOf = (h: HabitWithProgress) =>
  h.doneToday ? 'Feito hoje' : resting(h) ? 'Descansa hoje' : 'Para hoje';

/**
 * Seu aquário (Fase 6): the pond seen from above over the whole screen, every creature in it.
 * A tap on a creature shows its habit's card (its stage, how far the next one is, today's
 * action and the way to its page); a tap on the water lets it go. The creatures move, so the
 * same choice is also a row of buttons at the bottom, for screen readers and keyboards.
 */
export function PondScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  const { data: habits = [], todayKey } = useHabits();
  const actions = useHabitActions(todayKey);
  const [height, setHeight] = useState(window.height);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = habits.find((h) => h.id === selectedId) ?? null;

  const due = habits.filter((h) => !resting(h));
  const done = due.filter((h) => h.doneToday).length;
  const count = `${habits.length} ${habits.length === 1 ? 'criatura' : 'criaturas'}`;
  const today = due.length === 0 ? 'descanso hoje' : `${done} de ${due.length} hoje`;

  const select = (habit: HabitWithProgress | null) => {
    if (habit?.id === selectedId) return;
    haptics.selection();
    setSelectedId(habit?.id ?? null);
  };
  const close = () =>
    router.canGoBack()
      ? router.back()
      : router.replace({ pathname: '/aquarium', params: { tab: 'habits' } });

  return (
    <View
      style={[styles.root, { backgroundColor: abyss[950] }]}
      onLayout={(e) => setHeight(Math.round(e.nativeEvent.layout.height))}
    >
      <HabitPond
        habits={habits}
        height={height}
        radius="none"
        accessibilityLabel=""
        explore={{
          selectedId,
          onSelect: select,
          clear: { top: insets.top + CLEAR_TOP, bottom: insets.bottom + CLEAR_BOTTOM },
        }}
      />

      <View style={[styles.top, { paddingTop: insets.top + spacing.sm }]} pointerEvents="box-none">
        <Pressable
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Fechar o aquário"
          hitSlop={6}
          style={({ pressed }) => [
            styles.close,
            { backgroundColor: withAlpha(abyss[950], pressed ? 0.7 : 0.5) },
          ]}
        >
          <X size={22} color={specular} strokeWidth={2.4} />
        </Pressable>
        <View style={[styles.heading, { backgroundColor: withAlpha(abyss[950], 0.5) }]}>
          <Text variant="headline" accessibilityRole="header" style={{ color: specular }}>
            Seu aquário
          </Text>
          {habits.length > 0 ? (
            <Text variant="caption" style={{ color: specular }}>
              {count} · {today}
            </Text>
          ) : null}
        </View>
      </View>

      <View
        style={[styles.bottom, { paddingBottom: insets.bottom + spacing.md }]}
        pointerEvents="box-none"
      >
        <View style={styles.panel} pointerEvents="box-none">
          {habits.length === 0 ? (
            <Empty
              onCreate={() => router.replace({ pathname: '/aquarium', params: { tab: 'habits' } })}
            />
          ) : selected ? (
            <CreatureCard
              key={selected.id}
              habit={selected}
              actions={actions}
              onClose={() => setSelectedId(null)}
            />
          ) : (
            <View style={[styles.hint, { backgroundColor: withAlpha(abyss[950], 0.5) }]}>
              <Text variant="caption" style={{ color: specular }}>
                Toque numa criatura para ver o hábito dela
              </Text>
            </View>
          )}
          {habits.length > 0 ? (
            <Strip
              habits={habits}
              selectedId={selectedId}
              onSelect={(habit) => select(habit.id === selectedId ? null : habit)}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}

/** The chosen creature's habit: what it is, how it grows, today's action and its page. */
function CreatureCard({
  habit,
  actions,
  onClose,
}: {
  habit: HabitWithProgress;
  actions: HabitActions;
  onClose: () => void;
}) {
  const { colors, scheme, reduceMotion } = useTheme();
  const creature = creatures[habit.creature];
  const tone = listColors[creature.color][scheme];
  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.duration(220)}
      style={[styles.card, { backgroundColor: withAlpha(colors.surfaceRaised, 0.97) }]}
      accessibilityLabel={`Hábito ${habit.name}`}
    >
      <View style={styles.cardHead}>
        <CreatureTile habit={habit} size={56} resting={resting(habit)} />
        <View style={styles.flex}>
          <Text variant="headline" numberOfLines={1}>
            {habit.name}
          </Text>
          <Text variant="footnote" tone="secondary" numberOfLines={1}>
            {creature.name} · {stageInfo[habit.stage].label} · {statusOf(habit)}
          </Text>
        </View>
        <HabitControl habit={habit} tone={tone} actions={actions} />
      </View>
      <LevelBar habit={habit} />
      <View style={styles.cardActions}>
        <View style={styles.flex}>
          <Button
            label="Ver hábito"
            variant="secondary"
            block
            onPress={() => actions.open(habit)}
          />
        </View>
        <Button label="Fechar" variant="ghost" onPress={onClose} />
      </View>
    </Animated.View>
  );
}

/** Every creature as a button: the same choice as tapping it in the water. */
function Strip({
  habits,
  selectedId,
  onSelect,
}: {
  habits: HabitWithProgress[];
  selectedId: string | null;
  onSelect: (habit: HabitWithProgress) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.strip, { backgroundColor: withAlpha(abyss[950], 0.5) }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stripRow}
      >
        {habits.map((habit) => {
          const chosen = habit.id === selectedId;
          return (
            <Pressable
              key={habit.id}
              onPress={() => onSelect(habit)}
              accessibilityRole="button"
              accessibilityLabel={`${habit.name}: ${creatures[habit.creature].name}, ${stageInfo[habit.stage].label}. ${statusOf(habit)}.`}
              accessibilityState={{ selected: chosen }}
              style={({ pressed }) => [
                styles.stripItem,
                { borderColor: chosen ? colors.deepAccent : 'transparent' },
                pressed && styles.pressed,
              ]}
            >
              <CreatureTile habit={habit} size={44} resting={resting(habit)} />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function Empty({ onCreate }: { onCreate: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: withAlpha(colors.surfaceRaised, 0.97) }]}>
      <Text variant="headline">Seu aquário está vazio</Text>
      <Text variant="callout" tone="secondary">
        Cada hábito vira uma criatura que nada aqui e cresce quando você cumpre.
      </Text>
      <Button label="Criar um hábito" onPress={onCreate} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  flex: { flex: 1, minWidth: 0 },
  top: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  close: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: touchTarget / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  panel: { width: '100%', maxWidth: PANEL_MAX, gap: spacing.sm },
  hint: {
    alignSelf: 'center',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  card: { borderRadius: radius.xl, padding: spacing.md, gap: spacing.md },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  strip: { borderRadius: radius.lg, padding: 6 },
  stripRow: { gap: 6 },
  stripItem: { borderRadius: radius.lg - 4, borderWidth: 2.5, padding: 1 },
  pressed: { opacity: 0.75 },
});
