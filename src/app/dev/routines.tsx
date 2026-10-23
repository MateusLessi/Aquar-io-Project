// Development-only preview of the Routines design, with sample data (nothing is saved).
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { toDateKey } from '@/core/dates';
import { Screen } from '@/design-system';
import { RoutineEditorSheet } from '@/features/routines/components/RoutineEditorSheet';
import { RoutineTimeline } from '@/features/routines/components/RoutineTimeline';
import { RoutinesView } from '@/features/routines/components/RoutinesView';
import { routinePhase, toMinutes } from '@/features/routines/domain/schedule';
import type { RoutineToday } from '@/features/routines/domain/types';

const at = '2026-10-23T00:00:00.000Z';
const samples = [
  {
    name: 'Manhã',
    emoji: '🌅',
    color: 'sand',
    start: '06:00',
    end: '08:00',
    days: 0b1111111,
    items: ['Beber água', 'Alongar', 'Café da manhã', 'Revisar o dia'],
    done: [true, true, false, false],
  },
  {
    name: 'Trabalho',
    emoji: '💼',
    color: 'tide',
    start: '09:00',
    end: '18:00',
    days: 0b0111110,
    items: ['Responder e-mails', 'Bloco de foco'],
    done: [false, false],
  },
  {
    name: 'Academia',
    emoji: '🏋️',
    color: 'coral',
    start: '19:00',
    end: '20:00',
    days: 0b0101010,
    items: ['Aquecer', 'Treino', 'Alongar'],
    done: [false, false, false],
  },
  {
    name: 'Faxina',
    emoji: '🧹',
    color: 'kelp',
    start: '10:00',
    end: '12:00',
    days: 0b1000000,
    items: ['Cozinha', 'Banheiro'],
    done: [false, false],
  },
] as const;

function sampleRoutines(minutesNow: number): RoutineToday[] {
  const today = toDateKey(new Date(2026, 9, 23));
  return samples.map((s, i) => ({
    id: String(i),
    name: s.name,
    emoji: s.emoji,
    color: s.color,
    start: s.start,
    end: s.end,
    days: s.days,
    remind: true,
    sortOrder: i,
    createdAt: at,
    updatedAt: at,
    items: s.items.map((title, j) => ({
      id: `${i}-${j}`,
      routineId: String(i),
      title,
      sortOrder: j,
      done: s.done[j] ?? false,
    })),
    ...routinePhase(s, today, minutesNow),
  }));
}

export default function RoutinesPreview() {
  const { view } = useLocalSearchParams<{ view?: string }>();
  // A Friday at 07:20: the morning routine is happening now.
  const [routines, setRoutines] = useState(() => sampleRoutines(toMinutes('07:20')));
  const [editing, setEditing] = useState(view === 'editor');
  if (!__DEV__) return <Redirect href="/" />;

  return (
    <Screen title={view === 'list' ? 'Rotinas' : 'Hoje'} eyebrow="Prévia de design · sexta, 07:20">
      {view === 'list' ? (
        <RoutinesView
          routines={routines}
          onOpen={() => setEditing(true)}
          onCreate={() => setEditing(true)}
        />
      ) : (
        <RoutineTimeline
          routines={routines}
          onSeeAll={() => {}}
          onOpen={() => setEditing(true)}
          onToggleItem={(routineId, itemId, done) =>
            setRoutines((all) =>
              all.map((r) =>
                r.id !== routineId
                  ? r
                  : { ...r, items: r.items.map((i) => (i.id === itemId ? { ...i, done } : i)) },
              ),
            )
          }
        />
      )}
      <RoutineEditorSheet
        visible={editing}
        onClose={() => setEditing(false)}
        onSubmit={async () => {}}
      />
    </Screen>
  );
}
