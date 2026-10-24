import { useLocalSearchParams } from 'expo-router';
import { CloudAlert } from 'lucide-react-native';
import { useState } from 'react';

import { EmptyState } from '@/design-system';

import { RoutineEditorSheet } from '../components/RoutineEditorSheet';
import { RoutinesView } from '../components/RoutinesView';
import { useRoutinesRepository } from '../hooks/routinesContext';
import type { RoutineToday } from '../domain/types';
import { useRoutine, useRoutinesToday } from '../hooks/queries';

/** Routines inside the Aquarium: today's and the other days', with the editor. */
export function RoutinesPanel({
  renderRoutine,
}: {
  renderRoutine?: (routine: RoutineToday, onEdit: () => void) => React.ReactNode;
} = {}) {
  const repository = useRoutinesRepository();
  const params = useLocalSearchParams<{ edit?: string }>();
  const { data: routines, error } = useRoutinesToday();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(params.edit ?? null);
  const { data: editing } = useRoutine(editingId);

  // Opening from the dashboard (`/aquarium?tab=routines&edit=<id>`) goes straight to that routine, also when the
  // screen is already open (React's "adjust state when a prop changes" pattern).
  const [lastEdit, setLastEdit] = useState(params.edit);
  if (params.edit !== lastEdit) {
    setLastEdit(params.edit);
    if (params.edit) setEditingId(params.edit);
  }

  return (
    <>
      {error ? (
        <EmptyState
          icon={CloudAlert}
          title="Não foi possível carregar"
          message="Suas rotinas continuam salvas. Tente abrir o app de novo."
        />
      ) : routines ? (
        <RoutinesView
          routines={routines}
          onOpen={setEditingId}
          onCreate={() => setCreating(true)}
          renderRoutine={renderRoutine}
        />
      ) : null}

      <RoutineEditorSheet
        visible={creating}
        onClose={() => setCreating(false)}
        onSubmit={async (input) => {
          await repository.createRoutine(input);
        }}
      />
      <RoutineEditorSheet
        visible={Boolean(editingId && editing)}
        routine={editing}
        onClose={() => setEditingId(null)}
        onSubmit={(input) => repository.updateRoutine(editingId!, input)}
        onDelete={() => repository.deleteRoutine(editingId!)}
      />
    </>
  );
}
