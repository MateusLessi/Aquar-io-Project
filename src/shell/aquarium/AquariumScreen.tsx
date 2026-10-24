import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Link2 } from 'lucide-react-native';

import { Button, Screen, SegmentedControl } from '@/design-system';
import { HabitsPanel } from '@/features/habits/screens/HabitsPanel';
import { RoutinesPanel } from '@/features/routines/screens/RoutinesPanel';
import { ListsPanel } from '@/features/todo/screens/ListsPanel';

import { useConnect } from '../connections/ConnectProvider';
import { ConnectedRoutinePiece } from '../connections/ConnectedRoutinePiece';

export type AquariumTab = 'habits' | 'routines' | 'lists';

export const aquariumTabs: { value: AquariumTab; label: string }[] = [
  { value: 'habits', label: 'Hábitos' },
  { value: 'routines', label: 'Rotinas' },
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
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const tab = aquariumTab(params.tab);
  const { open, startMode } = useConnect();

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
    </Screen>
  );
}

const styles = StyleSheet.create({ switch: { flex: 1 } });
