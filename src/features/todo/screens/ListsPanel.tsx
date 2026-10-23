import { useRouter } from 'expo-router';
import { CloudAlert } from 'lucide-react-native';
import { useState } from 'react';

import { EmptyState, Grid, Screen, spacing, useBreakpoint } from '@/design-system';

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

  const columns = COLUMNS[breakpoint];
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
        <Grid columns={columns} gap={GAP} accessibilityRole="list">
          {[
            ...(lists ?? []).map((list) => (
              <ListCard key={list.id} list={list} onPress={() => open(list.id)} />
            )),
            <NewListCard key="new" onPress={() => setCreating(true)} />,
          ]}
        </Grid>
      )}

      <ListEditorSheet visible={creating} onClose={() => setCreating(false)} onCreated={open} />
    </Screen>
  );
}
