import { useRouter } from 'expo-router';
import { CloudAlert } from 'lucide-react-native';
import { useState } from 'react';

import { EmptyState } from '@/design-system';

import { HabitEditorSheet } from '../components/HabitEditorSheet';
import { HabitsView } from '../components/HabitsView';
import { useHabitsRepository } from '../hooks/habitsContext';
import { useHabits } from '../hooks/queries';

/** Habits inside the Aquarium: the reef, today's cards and the ones resting today. */
export function HabitsPanel() {
  const router = useRouter();
  const repository = useHabitsRepository();
  const { data: habits, error, todayKey } = useHabits();
  const [creating, setCreating] = useState(false);

  const open = (id: string) => router.push({ pathname: '/aquarium/habits/[id]', params: { id } });

  return (
    <>
      {error ? (
        <EmptyState
          icon={CloudAlert}
          title="Não foi possível carregar"
          message="Seus hábitos continuam salvos. Tente abrir o app de novo."
        />
      ) : habits ? (
        <HabitsView
          habits={habits}
          onToggle={(id, checked) =>
            repository.setChecked(id, todayKey, checked).catch((e: unknown) => console.error(e))
          }
          onOpen={open}
          onCreate={() => setCreating(true)}
        />
      ) : null}

      <HabitEditorSheet
        visible={creating}
        onClose={() => setCreating(false)}
        onSubmit={async (input) => {
          await repository.createHabit(input);
        }}
      />
    </>
  );
}
