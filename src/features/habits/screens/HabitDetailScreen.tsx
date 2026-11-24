import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, Minus, Pencil, SearchX, Sparkles, Waves } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { addDays, startOfWeek, toDateKey, weekdayOf } from '@/core/dates';
import { useCalendarPrefs } from '@/core/preferences/calendarPrefs';
import {
  Button,
  Checkbox,
  Chip,
  EmptyState,
  IconButton,
  Screen,
  Surface,
  Tag,
  Text,
  listColors,
  radius,
  spacing,
  useCountUpText,
  usePop,
  useTheme,
  withAlpha,
} from '@/design-system';

import { CreatureHero } from '../components/CreatureHero';
import { GrowthBar, days } from '../components/GrowthBar';
import { HabitControl, streakLabel, useLiveAmount } from '../components/HabitCard';
import { HabitCalendar } from '../components/HabitCalendar';
import { HabitDive } from '../components/HabitDive';
import { HabitEditorSheet } from '../components/HabitEditorSheet';
import { PondTag } from '../components/HabitPond';
import { ReefMap } from '../components/ReefMap';
import { amountLabel, clockLabel } from '../domain/amount';
import { creatures } from '../domain/creatures';
import { daysLabel, isScheduled, weekdayInitial, weekdayShort } from '../domain/progress';
import { creatureStage, stageInfo, stagePath } from '../domain/stages';
import type { HabitWithProgress } from '../domain/types';
import { useHabitSources } from '../hooks/habitSources';
import { useHabitsRepository } from '../hooks/habitsContext';
import { useHabit } from '../hooks/queries';
import { useHabitActions, type HabitActions } from '../hooks/useHabitActions';

/**
 * A habit's page, as its creature (Fase 6): the creature big on the water, its stage and how far
 * the next one is, the evolution in steps, this week and today's action. The details (numbers,
 * reef and calendar) follow below.
 */
export function HabitDetailScreen({
  habitId,
  footer,
}: {
  habitId: string;
  /** Extra section after the habit's numbers (the app shell's "Conectado a"). */
  footer?: (habit: { id: string; name: string }) => React.ReactNode;
}) {
  const router = useRouter();
  const { dive } = useLocalSearchParams<{ dive?: string }>();
  const repository = useHabitsRepository();
  const { scheme } = useTheme();
  const { data, loading, todayKey } = useHabit(habitId);
  const actions = useHabitActions(todayKey);
  const [editing, setEditing] = useState(false);
  const back = () =>
    router.canGoBack()
      ? router.back()
      : router.replace({ pathname: '/aquarium', params: { tab: 'habits' } });

  if (loading) return <Screen title="" onBack={back} />;

  if (!data) {
    return (
      <Screen title="Hábito" onBack={back}>
        <EmptyState
          icon={SearchX}
          title="Este hábito não existe mais"
          message="Ele pode ter sido apagado em outro aparelho."
          action={{
            label: 'Ver hábitos',
            onPress: () => router.replace({ pathname: '/aquarium', params: { tab: 'habits' } }),
          }}
        />
      </Screen>
    );
  }

  const { habit, doneDays, dayRatios } = data;
  const creature = creatures[habit.creature];
  const tone = listColors[creature.color][scheme];
  const stage = stageInfo[habit.stage].label;
  const startKey = [toDateKey(new Date(habit.createdAt)), ...doneDays].sort()[0]!;
  const toggle = (date: string, done: boolean) =>
    repository.setChecked(habit.id, date, done).catch((e: unknown) => console.error(e));
  // Opening the dive lives in the URL (?dive=1), so a notification can open it directly.
  const openDive = () => router.setParams({ dive: '1' });
  const closeDive = () => router.setParams({ dive: undefined });
  const resting = !habit.scheduledToday && !habit.doneToday;
  const status = habit.doneToday ? 'Feito hoje' : resting ? 'Descansa hoje' : 'Para hoje';

  return (
    // The creature comes first: the name is under it, and the title stays for screen readers.
    <Screen
      title={habit.name}
      titleHidden
      onBack={back}
      actions={<IconButton icon={Pencil} label="Editar hábito" onPress={() => setEditing(true)} />}
    >
      <View style={styles.top}>
        <CreatureHero
          creature={habit.creature}
          stage={habit.stage}
          accessibilityLabel={`${creature.name}, ${stage.toLowerCase()}, no lago. ${status}.`}
        >
          <PondTag label={status} />
          {habit.streak >= 2 ? <PondTag label={`${habit.streak} dias seguidos`} /> : null}
        </CreatureHero>

        <View style={styles.name}>
          <View style={styles.nameRow}>
            {/* Already read as the screen's title. */}
            <View
              style={styles.flex}
              aria-hidden
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <Text variant="title1" numberOfLines={2}>
                {habit.name}
              </Text>
            </View>
            <View>
              <Tag label={stage} />
            </View>
          </View>
          <Text variant="callout" tone="secondary">
            {creature.name} · {daysLabel(habit.days)}
          </Text>
          {habit.description ? (
            <Text variant="callout" tone="secondary" style={styles.why}>
              {habit.description}
            </Text>
          ) : null}
        </View>

        <GrowthBar habit={habit} style={styles.growth} />
        {/* Today's action before the evolution and the week: on a phone it shows unscrolled. */}
        <Today habit={habit} tone={tone} actions={actions} onDive={openDive} />
        <Evolution habit={habit} />
        <ThisWeek habit={habit} todayKey={todayKey} />
      </View>

      {/* Before the first day done, a line on what to do instead of "0 · 0 · — · 0". */}
      {habit.daysDone === 0 ? (
        <FirstDay habit={habit} tone={tone} />
      ) : (
        <View style={styles.stats}>
          <Stat label="Seguidos" value={String(habit.streak)} />
          <Stat label="Melhor" value={String(habit.bestStreak)} />
          <Stat
            label="30 dias"
            value={habit.consistency === null ? '—' : `${Math.round(habit.consistency * 100)}%`}
          />
          <Stat label="Total" value={String(habit.daysDone)} />
        </View>
      )}

      {footer?.({ id: habit.id, name: habit.name })}

      <Surface style={styles.card}>
        <Text variant="headline">Recife</Text>
        <Text variant="footnote" tone="secondary">
          Cada quadrado é um dia.
        </Text>
        <ReefMap dayRatios={dayRatios} todayKey={todayKey} startKey={startKey} tone={tone} />
      </Surface>

      <Surface style={styles.card}>
        <HabitCalendar
          done={new Set(doneDays)}
          days={habit.days}
          todayKey={todayKey}
          startKey={startKey}
          tone={tone}
          onToggle={toggle}
        />
      </Surface>
      <Text variant="footnote" tone="tertiary" style={styles.note}>
        Toque num dia passado para corrigir.
      </Text>

      <HabitEditorSheet
        visible={editing}
        habit={habit}
        onClose={() => setEditing(false)}
        onSubmit={(input) => repository.updateHabit(habit.id, input)}
        onDelete={async () => {
          await repository.deleteHabit(habit.id);
          back();
        }}
      />
      {habit.kind === 'time' ? (
        <HabitDive habit={habit} actions={actions} visible={dive === '1'} onClose={closeDive} />
      ) : null}
    </Screen>
  );
}

const STEP = 28;

/** The stages in steps: the ones reached checked, the current one in sand, the rest ahead. */
function Evolution({ habit }: { habit: HabitWithProgress }) {
  const { colors } = useTheme();
  const path = stagePath(habit.creature);
  const now = Math.max(
    0,
    path.findIndex((p) => p.stage === habit.stage),
  );
  const said = path
    .map((p, i) =>
      i < now
        ? `${stageInfo[p.stage].label}, alcançado`
        : i === now
          ? `${stageInfo[p.stage].label}, agora`
          : `${stageInfo[p.stage].label}, com ${days(p.from)}`,
    )
    .join('; ');
  return (
    <View style={styles.section}>
      <Text variant="headline">Evolução</Text>
      <View style={styles.evolution} accessible accessibilityLabel={`Evolução: ${said}`}>
        {/* The line behind the steps, filled up to the current one. */}
        <View style={[styles.evoLine, { backgroundColor: colors.surfacePressed }]}>
          <View
            style={[
              styles.evoLineFill,
              { width: `${(now / (path.length - 1)) * 100}%`, backgroundColor: colors.accent },
            ]}
          />
        </View>
        {path.map((p, i) => {
          const reached = i < now;
          const current = i === now;
          return (
            <View key={p.stage} style={styles.evoStep}>
              <View
                style={[
                  styles.evoDot,
                  {
                    backgroundColor: reached
                      ? colors.accent
                      : current
                        ? colors.deepAccent
                        : colors.surfacePressed,
                  },
                  current && { boxShadow: `0px 0px 0px 4px ${colors.deepAccentSoft}` },
                ]}
              >
                {reached ? (
                  <Check size={15} strokeWidth={3.2} color={colors.surfaceBase} />
                ) : current ? (
                  <View style={[styles.evoNow, { backgroundColor: colors.surfaceBase }]} />
                ) : null}
              </View>
              <Text
                variant="caption"
                tone={current ? 'primary' : reached ? 'secondary' : 'tertiary'}
                style={current && styles.bold}
                numberOfLines={1}
              >
                {stageInfo[p.stage].label}
              </Text>
              {i > now ? (
                <Text variant="caption" tone="tertiary" style={styles.small} numberOfLines={1}>
                  {days(p.from)}
                </Text>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** This week, day by day: done in midnight green, today ringed in sand, rest days dashed. */
function ThisWeek({ habit, todayKey }: { habit: HabitWithProgress; todayKey: string }) {
  const { colors } = useTheme();
  const { weekStart } = useCalendarPrefs();
  const first = startOfWeek(todayKey, weekStart);
  const keys = habit.week.map((_, i) => addDays(first, i));
  const done = habit.week.filter((s) => s === 'done').length;
  // The days it was meant for this week (from its start), plus any done on a rest day.
  const planned = keys.filter(
    (key, i) =>
      habit.week[i] === 'done' || (habit.week[i] !== 'rest' && isScheduled(habit.days, key)),
  ).length;
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text variant="headline">Esta semana</Text>
        {planned > 0 ? (
          <Text variant="footnote" tone="secondary">
            {done} de {planned}
          </Text>
        ) : null}
      </View>
      <View
        style={styles.week}
        accessible
        accessibilityLabel={`Esta semana: ${keys
          .map((key, i) => {
            const state = habit.week[i];
            const day = weekdayShort[weekdayOf(key)];
            const what =
              state === 'done'
                ? 'feito'
                : state === 'missed'
                  ? 'não feito'
                  : state === 'pending'
                    ? 'hoje'
                    : state === 'rest'
                      ? 'descanso'
                      : isScheduled(habit.days, key)
                        ? 'a fazer'
                        : 'descanso';
            return `${day}, ${what}`;
          })
          .join('; ')}`}
      >
        {keys.map((key, i) => {
          const state = habit.week[i];
          const isDone = state === 'done';
          const today = key === todayKey;
          const rest = state === 'rest' || (state === 'future' && !isScheduled(habit.days, key));
          return (
            <View
              key={key}
              style={[
                styles.weekDay,
                {
                  backgroundColor: isDone
                    ? colors.selected
                    : rest
                      ? 'transparent'
                      : colors.surfaceRaised,
                  borderColor: today ? colors.deepAccent : rest ? colors.border : 'transparent',
                  borderStyle: rest && !today ? 'dashed' : 'solid',
                  opacity: state === 'future' ? 0.5 : 1,
                },
              ]}
            >
              <Text
                variant="caption"
                style={[
                  styles.weekLetter,
                  isDone && styles.bold,
                  {
                    color: isDone
                      ? colors.onSelected
                      : today
                        ? colors.textPrimary
                        : colors.textTertiary,
                  },
                ]}
              >
                {weekdayInitial[weekdayOf(key)]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/**
 * Today: where it stands and the action for the habit's kind. A one-tap habit gets the orange
 * "Marcar hoje" beside it; a counter gets −/+1, a timer ▶ and the dive, a checklist its steps, and
 * a habit done from a list or routine today's items.
 */
function Today({
  habit,
  tone,
  actions,
  onDive,
}: {
  habit: HabitWithProgress;
  tone: string;
  actions: HabitActions;
  onDive: () => void;
}) {
  const sources = useHabitSources();
  const amount = useLiveAmount(habit);
  const running = habit.today.timerStartedAt !== null;
  const day = habit.connected;
  const pop = usePop(habit.doneToday, habit.doneToday);
  const headline = day
    ? day.required === 0
      ? 'Dia de descanso'
      : day.done
        ? 'Feito hoje!'
        : `${day.doneCount} de ${day.required}`
    : habit.kind === 'time'
      ? clockLabel(amount)
      : habit.kind === 'check'
        ? habit.doneToday
          ? 'Feito hoje!'
          : habit.scheduledToday
            ? 'Ainda dá tempo'
            : 'Dia de descanso'
        : amountLabel({ ...habit, unit: null }, amount);
  const sub = day
    ? `${day.label} · hoje`
    : habit.kind === 'count'
      ? `${habit.unit ?? 'hoje'}${habit.doneToday ? ' · meta batida!' : ''}`
      : habit.kind === 'time'
        ? `de ${habit.target} min${running ? ' · rodando' : ''}`
        : habit.kind === 'checklist'
          ? 'feitos hoje'
          : habit.streak === 1 && !habit.doneToday
            ? '1 dia seguido'
            : streakLabel(habit);

  return (
    <Surface style={styles.today}>
      <View style={styles.todayHead}>
        <Animated.View style={[styles.flex, pop]}>
          <Text variant="overline" tone="tertiary">
            Hoje
          </Text>
          <Text variant="title2" style={styles.amount}>
            {headline}
          </Text>
          <Text variant="footnote" tone="secondary">
            {sub}
          </Text>
        </Animated.View>
        {day ? null : habit.kind === 'count' ? (
          <View style={styles.controls}>
            <IconButton
              icon={Minus}
              label={`${habit.name}: tirar 1`}
              onPress={() => actions.add(habit, -1)}
              disabled={amount <= 0}
            />
            <HabitControl habit={habit} tone={tone} actions={actions} />
          </View>
        ) : habit.kind === 'check' ? (
          <Button
            label={habit.doneToday ? 'Desmarcar' : 'Marcar hoje'}
            variant={habit.doneToday ? 'secondary' : 'primary'}
            icon={habit.doneToday ? undefined : Check}
            accessibilityHint={habit.doneToday ? 'Desfaz o de hoje' : undefined}
            onPress={() => actions.toggle(habit, !habit.doneToday)}
          />
        ) : habit.kind === 'time' ? (
          <HabitControl
            habit={habit}
            tone={tone}
            actions={{
              ...actions,
              // Already on the habit: start here and open the dive over it.
              toggleTimer: (h) => {
                if (running) actions.toggleTimer(h);
                else {
                  actions.startTimer(h);
                  onDive();
                }
              },
            }}
          />
        ) : null}
      </View>

      {!day && habit.kind === 'time' ? (
        <View style={styles.quick}>
          {[5, 15, 30].map((minutes) => (
            <Chip
              key={minutes}
              label={`+${minutes} min`}
              onPress={() => actions.add(habit, minutes * 60)}
            />
          ))}
          <Button label="Mergulho" variant="secondary" icon={Waves} onPress={onDive} />
        </View>
      ) : null}

      {!day && habit.kind === 'checklist' ? (
        <View>
          {habit.steps.map((step) => {
            const done = habit.today.stepsDone.includes(step.id);
            return (
              <View key={step.id} style={styles.step}>
                <Checkbox
                  checked={done}
                  label={step.title}
                  onChange={(checked) => actions.setStep(habit, step.id, checked)}
                />
                <Text variant="body" struck={done} style={styles.flex}>
                  {step.title}
                </Text>
              </View>
            );
          })}
          <Text variant="footnote" tone="tertiary">
            Os passos recomeçam todo dia.
          </Text>
        </View>
      ) : null}

      {day && sources ? (
        <View style={styles.connected}>
          <sources.DayView habitId={habit.id} />
          <Text variant="footnote" tone="tertiary">
            Marcar aqui marca no lugar de origem, e marcar lá também conta aqui.
          </Text>
        </View>
      ) : null}

      {day && day.required > 0 ? (
        <Button
          label={day.done ? 'Desmarcar tudo' : 'Marcar tudo'}
          variant={day.done ? 'secondary' : 'primary'}
          icon={day.done ? undefined : Check}
          block
          onPress={() => actions.toggle(habit, !day.done)}
        />
      ) : null}
    </Surface>
  );
}

/** The habit's first day: what to do, and when the numbers show up. */
function FirstDay({ habit, tone }: { habit: HabitWithProgress; tone: string }) {
  const hatches = creatureStage(habit.creature, 0) === 'egg';
  return (
    <Surface style={styles.first}>
      <View style={[styles.firstIcon, { backgroundColor: withAlpha(tone, 0.16) }]}>
        <Sparkles size={22} strokeWidth={2} color={tone} />
      </View>
      <View style={styles.flex}>
        <Text variant="headline">Seu primeiro dia com {habit.name}</Text>
        <Text variant="callout" tone="secondary">
          {hatches
            ? 'Marque hoje e o ovo começa a chocar.'
            : 'Marque hoje e o filhote começa a crescer.'}{' '}
          A sequência e o recorde aparecem a partir de amanhã.
        </Text>
      </View>
    </Surface>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  // The number counts up to its value (Fase 5).
  const shown = useCountUpText(value);
  return (
    <Surface style={styles.stat} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text variant="title2">{shown}</Text>
      <Text variant="caption" tone="tertiary" numberOfLines={1}>
        {label}
      </Text>
    </Surface>
  );
}

const styles = StyleSheet.create({
  top: { gap: spacing.lg },
  name: { gap: 2, marginTop: -spacing.xs, paddingHorizontal: spacing.xxs },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  growth: { marginTop: -spacing.xs, paddingHorizontal: spacing.xxs },
  why: { fontStyle: 'italic', marginTop: spacing.xs },
  flex: { flex: 1 },
  bold: { fontWeight: '700' },
  small: { fontSize: 10, lineHeight: 12 },
  section: { gap: spacing.sm, paddingHorizontal: spacing.xxs },
  sectionHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  evolution: { flexDirection: 'row', justifyContent: 'space-between' },
  evoLine: {
    position: 'absolute',
    left: 32,
    right: 32,
    top: STEP / 2 - 1.5,
    height: 3,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  evoLineFill: { height: '100%' },
  evoStep: { width: 64, alignItems: 'center', gap: 4 },
  evoDot: {
    width: STEP,
    height: STEP,
    borderRadius: STEP / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  evoNow: { width: 8, height: 8, borderRadius: 4 },
  week: { flexDirection: 'row', gap: 6 },
  weekDay: {
    flex: 1,
    height: 36,
    borderRadius: radius.sm + 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekLetter: { fontSize: 12 },
  today: { padding: spacing.md, gap: spacing.md, paddingVertical: spacing.sm + 4 },
  todayHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  amount: { fontVariant: ['tabular-nums'] },
  controls: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  quick: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap', alignItems: 'center' },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 6 },
  connected: { gap: spacing.xs },
  stats: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1, padding: spacing.md, gap: 2, alignItems: 'center' },
  first: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  firstIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: { padding: spacing.md, gap: spacing.sm },
  note: { marginLeft: spacing.xs },
});
