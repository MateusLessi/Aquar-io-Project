import { useLocalSearchParams } from 'expo-router';
import { CloudAlert } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useSetting } from '@/core/settings/useSetting';
import { EmptyState, SegmentedControl, Sheet, spacing } from '@/design-system';

import { AgendaView } from '../components/AgendaView';
import { RoutineEditorSheet } from '../components/RoutineEditorSheet';
import { RoutinesView } from '../components/RoutinesView';
import { WeekView, type WeekViewProps } from '../components/WeekView';
import { useRoutinesRepository } from '../hooks/routinesContext';
import { tagsOf } from '../domain/schedule';
import type { RoutineToday } from '../domain/types';
import { useRoutine, useRoutinesToday } from '../hooks/queries';

export type RoutinesViewMode = 'timeline' | 'week' | 'agenda';
export const ROUTINES_VIEW_SETTING = 'routines.view';

const viewModes: { value: RoutinesViewMode; label: string }[] = [
  { value: 'timeline', label: 'Hoje' },
  { value: 'week', label: 'Semana' },
  { value: 'agenda', label: 'Agenda' },
];
const isViewMode = (value: string | undefined): value is RoutinesViewMode =>
  viewModes.some((m) => m.value === value);

/**
 * Routines inside the Aquarium, seen three ways (today's timeline, the week in columns, or the
 * agenda of the next days), with the editor. The chosen way is remembered.
 */
export function RoutinesPanel({
  renderRoutine,
  renderWeek,
  describe,
}: {
  renderRoutine?: (routine: RoutineToday, onEdit: () => void) => React.ReactNode;
  /** Draws the week richer than the plain WeekView (the shell adds what is linked, and dragging). */
  renderWeek?: (week: WeekViewProps) => React.ReactNode;
  /** Short names of what is placed in a routine, for the agenda. */
  describe?: (routine: RoutineToday) => string[];
} = {}) {
  const repository = useRoutinesRepository();
  const params = useLocalSearchParams<{ edit?: string; view?: string; day?: string }>();
  const { data: routines, error, todayKey, nowMinutes } = useRoutinesToday();
  const [storedView, setView] = useSetting<RoutinesViewMode>(ROUTINES_VIEW_SETTING, 'timeline');
  const view = isViewMode(storedView) ? storedView : 'timeline';
  const [day, setDay] = useState(params.day ?? todayKey);
  const [pieceId, setPieceId] = useState<string | null>(null);
  const piece = routines?.find((r) => r.id === pieceId) ?? null;

  // A link from the dashboard (`?view=week&day=2026-10-28`) opens that view on that day.
  const [lastLink, setLastLink] = useState(`${params.view}:${params.day}`);
  if (`${params.view}:${params.day}` !== lastLink) {
    setLastLink(`${params.view}:${params.day}`);
    if (params.day) setDay(params.day);
    if (isViewMode(params.view) && params.view !== view) void setView(params.view);
  }

  const open = (routine: RoutineToday, on: string) => {
    if (on === todayKey && renderRoutine) setPieceId(routine.id);
    else setEditingId(routine.id);
  };
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
        <View style={styles.root}>
          <SegmentedControl
            accessibilityLabel="Ver rotinas como"
            options={viewModes}
            value={view}
            onChange={(value) => void setView(value)}
          />
          {view === 'timeline' ? (
            <RoutinesView
              routines={routines}
              onOpen={setEditingId}
              onCreate={() => setCreating(true)}
              renderRoutine={renderRoutine}
            />
          ) : null}
          {view === 'week'
            ? (() => {
                const week: WeekViewProps = {
                  routines,
                  todayKey,
                  nowMinutes,
                  day,
                  onDay: setDay,
                  onOpen: open,
                };
                return renderWeek ? renderWeek(week) : <WeekView {...week} />;
              })()
            : null}
          {view === 'agenda' ? (
            <AgendaView routines={routines} todayKey={todayKey} onOpen={open} describe={describe} />
          ) : null}
        </View>
      ) : null}

      {renderRoutine ? (
        <Sheet visible={piece !== null} onClose={() => setPieceId(null)}>
          {piece
            ? renderRoutine(piece, () => {
                setPieceId(null);
                setEditingId(piece.id);
              })
            : null}
        </Sheet>
      ) : null}

      <RoutineEditorSheet
        visible={creating}
        tagSuggestions={tagsOf(routines)}
        onClose={() => setCreating(false)}
        onSubmit={async (input) => {
          await repository.createRoutine(input);
        }}
      />
      <RoutineEditorSheet
        visible={Boolean(editingId && editing)}
        routine={editing}
        tagSuggestions={tagsOf(routines)}
        onClose={() => setEditingId(null)}
        onSubmit={(input) => repository.updateRoutine(editingId!, input)}
        onDelete={() => repository.deleteRoutine(editingId!)}
      />
    </>
  );
}

const styles = StyleSheet.create({ root: { gap: spacing.lg } });
