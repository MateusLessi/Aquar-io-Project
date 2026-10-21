// Development-only preview of the Habits design, with sample data (nothing is saved).
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { addDays, toDateKey } from '@/core/dates';
import { Screen } from '@/design-system';
import { HabitEditorSheet } from '@/features/habits/components/HabitEditorSheet';
import { HabitsView } from '@/features/habits/components/HabitsView';
import type { CreatureId } from '@/features/habits/domain/creatures';
import { habitProgress } from '@/features/habits/domain/progress';
import { EVERY_DAY, type HabitWithProgress } from '@/features/habits/domain/types';

const today = toDateKey(new Date());
const daysAgo = (n: number) => addDays(today, -n);
const range = (from: number, to: number) =>
  Array.from({ length: to - from + 1 }, (_, i) => daysAgo(from + i));

const samples: { name: string; creature: CreatureId; days: number; done: string[] }[] = [
  { name: 'Beber água', creature: 'fish', days: EVERY_DAY, done: [today, ...range(1, 11)] },
  { name: 'Academia', creature: 'turtle', days: 0b0111110, done: range(1, 6) },
  { name: 'Ler 10 páginas', creature: 'octopus', days: EVERY_DAY, done: range(2, 4) },
  { name: 'Meditar', creature: 'whale', days: EVERY_DAY, done: [today, daysAgo(1)] },
  { name: 'Faxina', creature: 'crab', days: 0b1000000, done: [daysAgo(4)] },
];

function sampleHabits(): HabitWithProgress[] {
  return samples.map((sample, i) => ({
    id: String(i),
    name: sample.name,
    creature: sample.creature,
    days: sample.days,
    reminderTimes: [],
    sortOrder: i,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(30),
    ...habitProgress({
      days: sample.days,
      done: new Set(sample.done),
      startKey: daysAgo(30),
      todayKey: today,
    }),
  }));
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
