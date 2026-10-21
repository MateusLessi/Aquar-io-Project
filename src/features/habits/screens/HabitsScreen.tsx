import { useRouter } from 'expo-router';
import { CloudAlert } from 'lucide-react-native';
import { useState } from 'react';

import { EmptyState, Screen } from '@/design-system';

import { HabitEditorSheet } from '../components/HabitEditorSheet';
import { HabitsView } from '../components/HabitsView';
import { useHabitsRepository } from '../hooks/habitsContext';
import { useHabits } from '../hooks/queries';

export function HabitsScreen() {
  const router = useRouter();
  const repository = useHabitsRepository();
  const { data: habits, error, todayKey } = useHabits();
  const [creating, setCreating] = useState(false);

  const open = (id: string) => router.push({ pathname: '/habits/[id]', params: { id } });
  const due = (habits ?? []).filter((h) => h.scheduledToday || h.doneToday);
  const done = due.filter((h) => h.doneToday).length;

  return (
    <Screen
      title="Hábitos"
      eyebrow={due.length > 0 ? `${done} de ${due.length} feitos hoje` : undefined}
    >
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
    </Screen>
  );
}
