import { useRouter } from 'expo-router';
import { CloudAlert } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { EmptyState, Screen, spacing, useBreakpoint } from '@/design-system';

import { ListCard, NewListCard } from '../components/ListCard';
import { ListEditorSheet } from '../components/ListEditorSheet';
import { useLists } from '../hooks/queries';

const COLUMNS = { compact: 2, medium: 3, expanded: 4 } as const;
const GAP = spacing.md;

export function ListsScreen() {
  const router = useRouter();
  const breakpoint = useBreakpoint();
  const { data: lists, error } = useLists();
  const [creating, setCreating] = useState(false);
  const [width, setWidth] = useState(0);

  const columns = COLUMNS[breakpoint];
  const tileWidth = width > 0 ? (width - GAP * (columns - 1)) / columns : 0;
  const open = (id: string) => router.push({ pathname: '/lists/[id]', params: { id } });

  return (
    <Screen title="Listas">
      {error ? (
        <EmptyState
          icon={CloudAlert}
          title="Não foi possível carregar"
          message="Suas listas continuam salvas. Tente abrir o app de novo."
        />
      ) : (
        <View
          style={styles.grid}
          onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
          accessibilityRole="list"
        >
          {tileWidth > 0
            ? [
                ...(lists ?? []).map((list) => (
                  <View key={list.id} style={{ width: tileWidth }}>
                    <ListCard list={list} onPress={() => open(list.id)} />
                  </View>
                )),
                <View key="new" style={{ width: tileWidth }}>
                  <NewListCard onPress={() => setCreating(true)} />
                </View>,
              ]
            : null}
        </View>
      )}

      <ListEditorSheet visible={creating} onClose={() => setCreating(false)} onCreated={open} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
});
