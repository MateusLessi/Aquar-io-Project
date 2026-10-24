import { useRouter } from 'expo-router';
import { ChevronRight, Pencil, SearchX } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { EmptyState, IconButton, Screen, Text, useTheme } from '@/design-system';

import { FolderEditorSheet } from '../components/FolderEditorSheet';
import { ListsBrowser, type ConnectableItem } from '../components/ListsBrowser';
import type { FolderCrumb } from '../domain/types';
import { useFolderContents } from '../hooks/queries';

export function FolderScreen({
  folderId,
  onConnect,
}: {
  folderId: string;
  onConnect?: (item: ConnectableItem) => void;
}) {
  const router = useRouter();
  const { data, loading } = useFolderContents(folderId);
  const [editing, setEditing] = useState(false);
  const toLists = () => router.navigate({ pathname: '/aquarium', params: { tab: 'lists' } });
  const back = () => (router.canGoBack() ? router.back() : toLists());

  if (loading) return <Screen title="" onBack={back} />;

  if (!data?.folder) {
    return (
      <Screen title="Pasta" onBack={back}>
        <EmptyState
          icon={SearchX}
          title="Esta pasta não existe mais"
          message="Ela pode ter sido apagada em outro aparelho."
          action={{ label: 'Ver listas', onPress: toLists }}
        />
      </Screen>
    );
  }

  const folder = data.folder;
  return (
    <Screen
      title={`${folder.emoji ? `${folder.emoji} ` : ''}${folder.name}`}
      onBack={back}
      actions={<IconButton icon={Pencil} label="Editar pasta" onPress={() => setEditing(true)} />}
    >
      <Crumbs path={data.path} onTop={toLists} />
      <ListsBrowser folderId={folderId} onConnect={onConnect} />
      <FolderEditorSheet
        visible={editing}
        folder={folder}
        onClose={() => setEditing(false)}
        onDeleted={() => {
          const parent = data.path.at(-2);
          if (parent)
            router.replace({ pathname: '/aquarium/folders/[id]', params: { id: parent.id } });
          else toLists();
        }}
      />
    </Screen>
  );
}

/** "Listas › UnB › Semestre 3": every step but the last opens that level. */
export function Crumbs({ path, onTop }: { path: FolderCrumb[]; onTop: () => void }) {
  const router = useRouter();
  const { colors } = useTheme();
  const steps = [{ id: null, name: 'Listas' }, ...path];
  return (
    <View style={styles.crumbs} accessibilityRole="toolbar" accessibilityLabel="Caminho">
      {steps.map((step, index) => {
        const last = index === steps.length - 1;
        return (
          <View key={step.id ?? 'top'} style={styles.step}>
            {index > 0 ? <ChevronRight size={14} color={colors.textTertiary} /> : null}
            {last ? (
              <Text variant="footnote" tone="secondary" numberOfLines={1}>
                {step.name}
              </Text>
            ) : (
              <Pressable
                onPress={() =>
                  step.id
                    ? router.navigate({
                        pathname: '/aquarium/folders/[id]',
                        params: { id: step.id },
                      })
                    : onTop()
                }
                accessibilityRole="link"
                accessibilityLabel={`Ir para ${step.name}`}
                hitSlop={8}
              >
                <Text variant="footnote" tone="accent" style={styles.link} numberOfLines={1}>
                  {step.name}
                </Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  crumbs: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  link: { fontWeight: '700' },
});
