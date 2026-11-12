import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Link2 } from 'lucide-react-native';

import { Button, Screen, SegmentedControl } from '@/design-system';
import { useCalendarPrefs } from '@/core/preferences/calendarPrefs';
import { HabitsPanel } from '@/features/habits/screens/HabitsPanel';
import { RoutinesPanel } from '@/features/routines/screens/RoutinesPanel';
import { QuickAddSheet } from '@/features/todo/components/QuickAddSheet';
import { useFolderTasks } from '@/features/todo/hooks/queries';
import { ListsPanel } from '@/features/todo/screens/ListsPanel';

import { useConnect } from '../connections/ConnectProvider';
import { ConnectedRoutinePiece } from '../connections/ConnectedRoutinePiece';
import { ConnectedWeek } from '../connections/ConnectedWeek';
import { useConnections } from '../connections/useConnected';
import { taskEntries } from './taskEntries';

export type AquariumTab = 'habits' | 'routines' | 'lists';

export const aquariumTabs: { value: AquariumTab; label: string }[] = [
  { value: 'habits', label: 'Hábitos' },
  { value: 'routines', label: 'Agenda' },
  { value: 'lists', label: 'Listas' },
];

export function aquariumTab(value: string | undefined): AquariumTab {
  return aquariumTabs.find((t) => t.value === value)?.value ?? 'habits';
}

/**
 * The Aquarium: where everything is managed in detail. A switch at the top picks the module;
 * future modules join it here. The tab lives in the URL (`?tab=`), so links can open any of them.
 */
export function AquariumScreen() {
  const { showTime } = useCalendarPrefs();
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const tab = aquariumTab(params.tab);
  const { open, startMode } = useConnect();
  const { inside } = useConnections();
  const { data: tasks } = useFolderTasks(null);
  const dated = useMemo(() => taskEntries(tasks ?? []), [tasks]);
  const [newTaskDay, setNewTaskDay] = useState<string | null>(null);

  return (
    <Screen
      title="Aquário"
      actions={<Button label="Conectar" variant="secondary" icon={Link2} onPress={startMode} />}
      accessory={
        <View style={styles.switch}>
          <SegmentedControl
            accessibilityLabel="Seção do Aquário"
            options={aquariumTabs}
            value={tab}
            onChange={(value) => router.setParams({ tab: value })}
          />
        </View>
      }
    >
      {tab === 'habits' ? <HabitsPanel /> : null}
      {tab === 'routines' ? (
        <RoutinesPanel
          extraEntries={dated}
          onOpenEntry={(entry) => {
            const task = tasks?.find((t) => t.id === entry.refId);
            if (task) router.push({ pathname: '/aquarium/lists/[id]', params: { id: task.listId } });
          }}
          onNewTask={setNewTaskDay}
          renderWeek={(week) => <ConnectedWeek {...week} />}
          describe={(routine) =>
            inside('routine', routine.id).map((c) =>
              c.kind === 'habit'
                ? `${c.habit.name}${c.link.at ? ` ${showTime(c.link.at)}` : ''}`
                : c.kind === 'list'
                  ? c.list.name
                  : c.folder.name,
            )
          }
          renderRoutine={(routine, onEdit) => (
            <ConnectedRoutinePiece
              routine={routine}
              onEdit={onEdit}
              initiallyOpen={routine.phase === 'now'}
            />
          )}
        />
      ) : null}
      {tab === 'lists' ? <ListsPanel onConnect={(item) => open({ from: item })} /> : null}
      <QuickAddSheet
        visible={newTaskDay !== null}
        dueDate={newTaskDay ?? undefined}
        onClose={() => setNewTaskDay(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({ switch: { flex: 1 } });
