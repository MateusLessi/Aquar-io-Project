import { CloudAlert } from 'lucide-react-native';
import { useState } from 'react';

import { EmptyState } from '@/design-system';

import { HabitEditorSheet } from '../components/HabitEditorSheet';
import { HabitsView } from '../components/HabitsView';
import { useHabitsRepository } from '../hooks/habitsContext';
import { useHabits } from '../hooks/queries';
import { useHabitActions } from '../hooks/useHabitActions';

/** Habits inside the Aquarium: the reef, today's cards and the ones resting today. */
export function HabitsPanel() {
  const repository = useHabitsRepository();
  const { data: habits, error, todayKey } = useHabits();
  const actions = useHabitActions(todayKey);
  const [creating, setCreating] = useState(false);

  return (
    <>
      {error ? (
        <EmptyState
          icon={CloudAlert}
          title="Não foi possível carregar"
          message="Seus hábitos continuam salvos. Tente abrir o app de novo."
        />
      ) : habits ? (
        <HabitsView habits={habits} actions={actions} onCreate={() => setCreating(true)} />
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
