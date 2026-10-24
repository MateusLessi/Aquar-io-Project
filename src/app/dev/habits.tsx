// Development-only preview of the Habits design, with sample data (nothing is saved).
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { addDays, toDateKey } from '@/core/dates';
import { Screen } from '@/design-system';
import { HabitEditorSheet } from '@/features/habits/components/HabitEditorSheet';
import { HabitsView } from '@/features/habits/components/HabitsView';
import type { CreatureId } from '@/features/habits/domain/creatures';
import { habitProgress } from '@/features/habits/domain/progress';
import { creatureStage } from '@/features/habits/domain/stages';
import { fillRatio } from '@/features/habits/domain/amount';
import {
  EVERY_DAY,
  type HabitKind,
  type HabitStep,
  type HabitWithProgress,
} from '@/features/habits/domain/types';

const today = toDateKey(new Date());
const daysAgo = (n: number) => addDays(today, -n);
const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => daysAgo(from + i));

type Sample = {
  name: string;
  creature: CreatureId;
  days: number;
  done: string[];
  kind?: HabitKind;
  target?: number;
  unit?: string;
  steps?: string[];
  /** Today's partial progress: units, seconds or steps. */
  amount?: number;
};

const samples: Sample[] = [
  { name: 'Meditar', creature: 'whale', days: EVERY_DAY, done: [today, ...range(1, 11)] },
  {
    name: 'Beber água',
    creature: 'dolphin',
    days: EVERY_DAY,
    done: range(1, 6),
    kind: 'count',
    target: 8,
    unit: 'copos',
    amount: 3,
  },
  {
    name: 'Ler',
    creature: 'fish',
    days: EVERY_DAY,
    done: range(2, 4),
    kind: 'time',
    target: 20,
    amount: 12 * 60,
  },
  {
    name: 'Skincare',
    creature: 'octopus',
    days: EVERY_DAY,
    done: [daysAgo(1)],
    kind: 'checklist',
    steps: ['Limpar', 'Tônico', 'Sérum', 'Hidratante'],
    amount: 2,
  },
  { name: 'Academia', creature: 'turtle', days: 0b0111110, done: range(1, 6) },
  { name: 'Faxina', creature: 'crab', days: 0b1000000, done: [daysAgo(4)] },
];

function sampleHabits(): HabitWithProgress[] {
  return samples.map((sample, i) => {
    const steps: HabitStep[] = (sample.steps ?? []).map((title, n) => ({ id: `s${n}`, title }));
    const kind = sample.kind ?? 'check';
    const shape = { kind, target: sample.target ?? (steps.length || 1), steps };
    const progress = habitProgress({
      days: sample.days,
      done: new Set(sample.done),
      startKey: daysAgo(30),
      todayKey: today,
    });
    const amount = sample.amount ?? 0;
    return {
      id: String(i),
      name: sample.name,
      creature: sample.creature,
      days: sample.days,
      reminderTimes: [],
      ...shape,
      target: kind === 'check' ? 1 : shape.target,
      unit: sample.unit ?? null,
      stage: creatureStage(sample.creature, sample.done.length),
      sortOrder: i,
      createdAt: daysAgo(30),
      updatedAt: daysAgo(30),
      ...progress,
      today: {
        amount,
        stepsDone: steps.slice(0, amount).map((s) => s.id),
        ratio: fillRatio(shape, amount, progress.doneToday),
        timerStartedAt: null,
      },
      weekRatios: progress.week.map((d, n) =>
        d === 'done' ? 1 : kind === 'check' ? 0 : [0.5, 0.25, 0.75, 0.4, 0.6, 0.3, 0.8][n]!,
      ),
    };
  });
}

export default function HabitsPreview() {
  const { editor } = useLocalSearchParams<{ editor?: string }>();
  const [habits, setHabits] = useState(sampleHabits);
  const [editing, setEditing] = useState(editor === '1');
  if (!__DEV__) return <Redirect href="/" />;

  const toggle = (id: string, done: boolean) =>
    setHabits((current) =>
      current.map((h) => {
        if (h.id !== id) return h;
        const sample = samples[Number(id)]!;
        const set = new Set(sample.done);
        if (done) set.add(today);
        else set.delete(today);
        sample.done = [...set];
        return {
          ...h,
          ...habitProgress({ days: h.days, done: set, startKey: daysAgo(30), todayKey: today }),
        };
      }),
    );

  return (
    <Screen title="Hábitos" eyebrow="Prévia de design">
      <HabitsView
        habits={habits}
        onToggle={toggle}
        onOpen={() => setEditing(true)}
        onCreate={() => setEditing(true)}
      />
      <HabitEditorSheet
        visible={editing}
        onClose={() => setEditing(false)}
        onSubmit={async () => {}}
      />
    </Screen>
  );
}
