import { useLocalSearchParams, useRouter } from 'expo-router';
import { Minus, Pencil, SearchX, Waves } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { toDateKey } from '@/core/dates';
import {
  Button,
  Checkbox,
  Chip,
  EmptyState,
  IconButton,
  Screen,
  Surface,
  Text,
  listColors,
  spacing,
  useTheme,
  withAlpha,
} from '@/design-system';

import { HabitCapsule } from '../components/HabitCapsule';
import { HabitControl, streakLabel, useLiveAmount } from '../components/HabitCard';
import { HabitCalendar } from '../components/HabitCalendar';
import { HabitDive } from '../components/HabitDive';
import { HabitEditorSheet } from '../components/HabitEditorSheet';
import { ReefMap } from '../components/ReefMap';
import { amountLabel, clockLabel, fillRatio } from '../domain/amount';
import { creatures } from '../domain/creatures';
import { daysLabel } from '../domain/progress';
import { creatureStage, nextStage, stageInfo, type Stage } from '../domain/stages';
import type { HabitWithProgress } from '../domain/types';
import { useHabitsRepository } from '../hooks/habitsContext';
import { useHabit } from '../hooks/queries';
import { useHabitActions, type HabitActions } from '../hooks/useHabitActions';

const STAGES: Stage[] = ['egg', 'baby', 'young', 'adult'];
/** Days done where each stage begins (mirrors domain/stages). */
const STAGE_FROM: Record<Stage, number> = { egg: 0, baby: 3, young: 10, adult: 30 };

export function HabitDetailScreen({
  habitId,
  footer,
}: {
  habitId: string;
  /** Extra section after the growth path (the app shell's "Conectado a"). */
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
  const startKey = [toDateKey(new Date(habit.createdAt)), ...doneDays].sort()[0]!;
  const toggle = (date: string, done: boolean) =>
    repository.setChecked(habit.id, date, done).catch((e: unknown) => console.error(e));
  // Opening the dive lives in the URL (?dive=1), so a notification can open it directly.
  const openDive = () => router.setParams({ dive: '1' });
  const closeDive = () => router.setParams({ dive: undefined });

  return (
    <Screen
      title={habit.name}
      eyebrow={`${creature.name} · ${daysLabel(habit.days)}`}
      onBack={back}
      actions={<IconButton icon={Pencil} label="Editar hábito" onPress={() => setEditing(true)} />}
    >
      <Hero habit={habit} tone={tone} actions={actions} onDive={openDive} />

      {habit.kind === 'checklist' ? (
        <Surface style={styles.steps}>
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
        </Surface>
      ) : null}

      <View style={styles.stats}>
        <Stat label="Seguidos" value={String(habit.streak)} />
        <Stat label="Melhor" value={String(habit.bestStreak)} />
        <Stat
          label="30 dias"
          value={habit.consistency === null ? '—' : `${Math.round(habit.consistency * 100)}%`}
        />
        <Stat label="Total" value={String(habit.daysDone)} />
      </View>

      <Growth habit={habit} tone={tone} />
      {footer?.({ id: habit.id, name: habit.name })}

      <Surface style={styles.card}>
        <Text variant="headline">Recife</Text>
        <Text variant="footnote" tone="secondary">
          Cada quadradinho é um dia: mais forte quanto mais você fez.
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
        Esqueceu de marcar? Toque num dia que já passou para corrigir.
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

/** The big capsule with today's amount and the controls for the habit's kind. */
function Hero({
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
  const amount = useLiveAmount(habit);
  const running = habit.today.timerStartedAt !== null;
  const ratio = running ? fillRatio(habit, amount, habit.doneToday) : habit.today.ratio;
  const headline =
    habit.kind === 'time'
      ? clockLabel(amount)
      : habit.kind === 'check'
        ? habit.doneToday
          ? 'Feito hoje!'
          : habit.scheduledToday
            ? 'Ainda dá tempo'
            : 'Dia de descanso'
        : amountLabel({ ...habit, unit: null }, amount);
  const sub =
    habit.kind === 'count'
      ? `${habit.unit ?? 'hoje'}${habit.doneToday ? ' · meta batida!' : ''}`
      : habit.kind === 'time'
        ? `de ${habit.target} min${running ? ' · rodando' : ''}`
        : habit.kind === 'checklist'
          ? 'feitos hoje'
          : streakLabel(habit);

  return (
    <Surface style={[styles.hero, { borderColor: withAlpha(tone, 0.3) }]} accessible={false}>
      <HabitCapsule
        creature={habit.creature}
        stage={habit.stage}
        ratio={ratio}
        done={habit.doneToday}
        resting={!habit.scheduledToday && !habit.doneToday}
        width={112}
        height={150}
      />
      <View style={styles.heroBody}>
        <Text variant="title1" style={styles.amount} accessibilityRole="header">
          {headline}
        </Text>
        <Text variant="callout" tone="secondary">
          {sub}
        </Text>
        <View style={styles.controls}>
          {habit.kind === 'count' ? (
            <>
              <IconButton
                icon={Minus}
                label={`${habit.name}: tirar 1`}
                onPress={() => actions.add(habit, -1)}
                disabled={amount <= 0}
              />
              <HabitControl habit={habit} tone={tone} actions={actions} />
            </>
          ) : habit.kind === 'time' ? (
            <>
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
              <Button label="Mergulho" variant="secondary" icon={Waves} onPress={onDive} />
            </>
          ) : habit.kind === 'check' ? (
            <HabitControl habit={habit} tone={tone} actions={actions} />
          ) : null}
        </View>
        {habit.kind === 'time' ? (
          <View style={styles.quick}>
            {[5, 15, 30].map((minutes) => (
              <Chip
                key={minutes}
                label={`+${minutes} min`}
                onPress={() => actions.add(habit, minutes * 60)}
              />
            ))}
          </View>
        ) : null}
      </View>
    </Surface>
  );
}

function Growth({ habit, tone }: { habit: HabitWithProgress; tone: string }) {
  const next = nextStage(habit.creature, habit.daysDone);
  // Mammals and sharks are born, not hatched: their path starts at baby.
  const path = STAGES.slice(STAGES.indexOf(creatureStage(habit.creature, 0)));
  return (
    <Surface style={styles.card}>
      <Text variant="headline">Crescimento</Text>
      <Text variant="footnote" tone="secondary">
        {stageInfo[habit.stage].label} ·{' '}
        {next
          ? `${next.daysLeft === 1 ? 'falta 1 dia' : `faltam ${next.daysLeft} dias`} para ${stageInfo[next.stage].label.toLowerCase()}`
          : 'totalmente crescido!'}
      </Text>
      <View style={styles.path} accessible={false}>
        {path.map((stage, i) => {
          const following = path[i + 1];
          const span = following ? STAGE_FROM[following] - STAGE_FROM[stage] : 0;
          const progress = following
            ? Math.min(1, Math.max(0, (habit.daysDone - STAGE_FROM[stage]) / span))
            : 0;
          return (
            <View key={stage} style={[styles.pathStep, following ? styles.flex : null]}>
              <Text style={{ opacity: STAGE_FROM[stage] <= habit.daysDone ? 1 : 0.4 }}>
                {stageInfo[stage].emoji}
              </Text>
              {following ? (
                <View style={[styles.bar, { backgroundColor: withAlpha(tone, 0.15) }]}>
                  <View
                    style={[styles.barFill, { width: `${progress * 100}%`, backgroundColor: tone }]}
                  />
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </Surface>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Surface style={styles.stat}>
      <Text variant="title2">{value}</Text>
      <Text variant="caption" tone="tertiary" numberOfLines={1}>
        {label}
      </Text>
    </Surface>
  );
}

const styles = StyleSheet.create({
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    borderWidth: 1,
  },
  heroBody: { flex: 1, gap: 2 },
  amount: { fontVariant: ['tabular-nums'] },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    flexWrap: 'wrap',
  },
  quick: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm, flexWrap: 'wrap' },
  steps: { padding: spacing.md, gap: spacing.xs },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 6 },
  flex: { flex: 1 },
  stats: { flexDirection: 'row', gap: spacing.sm },
  stat: { flex: 1, padding: spacing.md, gap: 2, alignItems: 'center' },
  card: { padding: spacing.md, gap: spacing.sm },
  path: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  pathStep: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  bar: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  note: { marginLeft: spacing.xs },
});
