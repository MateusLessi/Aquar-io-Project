import { useLocalSearchParams } from 'expo-router';
import {
  CalendarClock,
  CalendarPlus,
  CheckSquare,
  CloudAlert,
  Plus,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useSetting } from '@/core/settings/useSetting';
import {
  EmptyState,
  IconButton,
  ListItem,
  SegmentedControl,
  Sheet,
  spacing,
  useTheme,
} from '@/design-system';

import { AgendaView } from '../components/AgendaView';
import { EventEditorSheet, longDate } from '../components/EventEditorSheet';
import { MonthView } from '../components/MonthView';
import { RoutineDaySheet } from '../components/RoutineDaySheet';
import { RoutineEditorSheet } from '../components/RoutineEditorSheet';
import { RoutinesView } from '../components/RoutinesView';
import { WeekView, type WeekViewProps } from '../components/WeekView';
import { useRoutinesRepository } from '../hooks/routinesContext';
import { eventEntry, withPhase } from '../domain/agenda';
import { onDay, routinesOn, tagsOf } from '../domain/schedule';
import type { RoutineToday } from '../domain/types';
import { useAgendaEvent, useAgendaEvents, useRoutine, useRoutinesToday } from '../hooks/queries';

export type RoutinesViewMode = 'timeline' | 'week' | 'month' | 'agenda';
export const ROUTINES_VIEW_SETTING = 'routines.view';
const NO_ENTRIES: RoutineToday[] = [];

const viewModes: { value: RoutinesViewMode; label: string }[] = [
  { value: 'timeline', label: 'Dia' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
  { value: 'agenda', label: 'Lista' },
];
const isViewMode = (value: string | undefined): value is RoutinesViewMode =>
  viewModes.some((m) => m.value === value);

/**
 * The agenda inside the Aquarium: routines, events and tasks with a date, seen four ways (the
 * day, the week in columns, the month, or a list of what comes), with their editors. The
 * chosen way is remembered.
 */
export function RoutinesPanel({
  renderRoutine,
  renderWeek,
  describe,
  extraEntries = NO_ENTRIES,
  onOpenEntry,
  onNewTask,
  lists,
}: {
  renderRoutine?: (routine: RoutineToday, onEdit: () => void) => React.ReactNode;
  /** Draws the week richer than the plain WeekView (the shell adds what is linked, and dragging). */
  renderWeek?: (week: WeekViewProps) => React.ReactNode;
  /** Short names of what is placed in a routine, for the agenda. */
  describe?: (routine: RoutineToday) => string[];
  /** Other things with a date, from the app shell (tasks due), as agenda entries. */
  extraEntries?: RoutineToday[];
  /** Opens one of `extraEntries`. */
  onOpenEntry?: (entry: RoutineToday, day: string) => void;
  /** "Novo na agenda → Tarefa": the shell's task sheet, due on `day`. */
  onNewTask?: (day: string) => void;
  /** Lists an event can belong to, from the app shell. */
  lists?: { id: string; name: string }[];
} = {}) {
  const repository = useRoutinesRepository();
  const params = useLocalSearchParams<{
    edit?: string;
    view?: string;
    day?: string;
    event?: string;
  }>();
  const { data: routines, error, todayKey, nowMinutes } = useRoutinesToday();
  const { data: events } = useAgendaEvents();
  // Everything on the agenda, in one shape; routines keep their own phase.
  const entries = [
    ...(routines ?? []),
    ...[...(events ?? []).map(eventEntry), ...extraEntries].map((e) =>
      withPhase(e, todayKey, nowMinutes),
    ),
  ];
  const othersToday = routinesOn(
    entries.filter((e) => e.source === 'event' || e.source === 'task'),
    todayKey,
  );
  const [choosing, setChoosing] = useState(false);
  const [newEvent, setNewEvent] = useState(false);
  const [eventId, setEventId] = useState<string | null>(params.event ?? null);
  // `?event=<id>` (from Início) opens that event, also when the screen is already open.
  const [lastEvent, setLastEvent] = useState(params.event);
  if (params.event !== lastEvent) {
    setLastEvent(params.event);
    if (params.event) setEventId(params.event);
  }
  const { data: event } = useAgendaEvent(eventId);
  const [dayOf, setDayOf] = useState<{ id: string; day: string } | null>(null);
  const dayRoutine = dayOf
    ? (() => {
        const r = routines?.find((x) => x.id === dayOf.id);
        return r ? onDay(r, dayOf.day) : null;
      })()
    : null;
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
    if (routine.source === 'event') setEventId(routine.refId ?? null);
    else if (routine.source === 'task') onOpenEntry?.(routine, on);
    else if (on === todayKey && renderRoutine) setPieceId(routine.id);
    else setDayOf({ id: routine.id, day: on });
  };
  // The day new things go on: the one chosen in Semana and Mês, today otherwise.
  const newDay = view === 'week' || view === 'month' ? day : todayKey;
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
          <View style={styles.bar}>
            <View style={styles.flex}>
              <SegmentedControl
                accessibilityLabel="Ver a agenda como"
                options={viewModes}
                value={view}
                onChange={(value) => void setView(value)}
              />
            </View>
            <IconButton icon={Plus} label="Novo na agenda" onPress={() => setChoosing(true)} />
          </View>
          {view === 'timeline' ? (
            <RoutinesView
              routines={routines}
              onOpen={(id) => setDayOf({ id, day: todayKey })}
              onCreate={() => setCreating(true)}
              renderRoutine={renderRoutine}
              others={othersToday}
              onOpenOther={(entry) => open(entry, todayKey)}
            />
          ) : null}
          {view === 'week'
            ? (() => {
                const week: WeekViewProps = {
                  routines: entries,
                  todayKey,
                  nowMinutes,
                  day,
                  onDay: setDay,
                  onOpen: open,
                };
                return renderWeek ? renderWeek(week) : <WeekView {...week} />;
              })()
            : null}
          {view === 'month' ? (
            <MonthView
              routines={entries}
              todayKey={todayKey}
              day={day}
              onDay={setDay}
              onOpen={open}
            />
          ) : null}
          {view === 'agenda' ? (
            <AgendaView routines={entries} todayKey={todayKey} onOpen={open} describe={describe} />
          ) : null}
        </View>
      ) : null}

      {renderRoutine ? (
        <Sheet visible={piece !== null} onClose={() => setPieceId(null)}>
          {piece
            ? renderRoutine(piece, () => {
                setPieceId(null);
                setDayOf({ id: piece.id, day: todayKey });
              })
            : null}
        </Sheet>
      ) : null}

      <Sheet visible={choosing} onClose={() => setChoosing(false)} title="Novo na agenda">
        <View>
          <ListItem
            title="Evento"
            subtitle={`Prova, consulta, aniversário · ${longDate(newDay)}`}
            leading={<ChoiceIcon icon={CalendarPlus} />}
            onPress={() => {
              setChoosing(false);
              setNewEvent(true);
            }}
          />
          <ListItem
            separator
            title="Rotina"
            subtitle="Um bloco que se repete na semana"
            leading={<ChoiceIcon icon={CalendarClock} />}
            onPress={() => {
              setChoosing(false);
              setCreating(true);
            }}
          />
          {onNewTask ? (
            <ListItem
              separator
              title="Tarefa"
              subtitle={`Algo para fazer · ${longDate(newDay)}`}
              leading={<ChoiceIcon icon={CheckSquare} />}
              onPress={() => {
                setChoosing(false);
                onNewTask(newDay);
              }}
            />
          ) : null}
        </View>
      </Sheet>

      <EventEditorSheet
        visible={newEvent}
        date={newDay}
        todayKey={todayKey}
        lists={lists}
        onClose={() => setNewEvent(false)}
        onSubmit={(input) => repository.createEvent(input)}
      />
      <EventEditorSheet
        visible={Boolean(eventId && event)}
        event={event}
        date={event?.date ?? todayKey}
        todayKey={todayKey}
        lists={lists}
        onClose={() => setEventId(null)}
        onSubmit={(input) => repository.updateEvent(eventId!, input)}
        onDelete={() => repository.deleteEvent(eventId!)}
      />

      <RoutineDaySheet
        routine={dayRoutine}
        day={dayOf?.day ?? todayKey}
        onClose={() => setDayOf(null)}
        onEditAll={() => dayOf && setEditingId(dayOf.id)}
        onSkip={() => repository.setOverride(dayOf!.id, dayOf!.day, { skip: true })}
        onMove={(start, end) => repository.setOverride(dayOf!.id, dayOf!.day, { start, end })}
        onReset={() => repository.clearOverride(dayOf!.id, dayOf!.day)}
      />

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

function ChoiceIcon({ icon: Icon }: { icon: LucideIcon }) {
  const { colors } = useTheme();
  return <Icon size={24} color={colors.accent} />;
}

const styles = StyleSheet.create({
  root: { gap: spacing.lg },
  bar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
});
