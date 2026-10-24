import { useRouter } from 'expo-router';
import { CloudAlert, FolderPlus, ListPlus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useSetting } from '@/core/settings/useSetting';
import {
  Button,
  EmptyState,
  Grid,
  SegmentedControl,
  Sheet,
  Surface,
  Text,
  radius,
  spacing,
  useBreakpoint,
  useTheme,
} from '@/design-system';

import type { FolderSummary, TaskList } from '../domain/types';
import { MAX_FOLDER_DEPTH } from '../domain/validation';
import { useFolderContents } from '../hooks/queries';
import { useTodo } from '../hooks/todoContext';
import { FolderCard, FolderRow } from './FolderCard';
import { FolderEditorSheet } from './FolderEditorSheet';
import { FolderTasksView } from './FolderTasksView';
import { ListCard, ListRow, NewListCard } from './ListCard';
import { ListEditorSheet } from './ListEditorSheet';
import { MoveSheet, type MoveTarget } from './MoveSheet';

export type ListsView = 'grid' | 'rows' | 'all';
const VIEW_SETTING = 'lists.view';
const COLUMNS = { compact: 2, medium: 3, expanded: 4 } as const;

type Item = { kind: 'folder'; folder: FolderSummary } | { kind: 'list'; list: TaskList };

/**
 * The lists of one folder (or of the top level, `folderId = null`): folders first, then
 * lists, as a grid, as rows, or every task together. The + asks whether to create a list or
 * a folder here; holding an item offers to move, edit or pin it.
 */
export type ConnectableItem = { kind: 'list' | 'folder'; id: string; name: string };

export function ListsBrowser({
  folderId,
  onConnect,
}: {
  folderId: string | null;
  /** "Conectar a…" in an item's options (the app shell's connection system). */
  onConnect?: (item: ConnectableItem) => void;
}) {
  const router = useRouter();
  const todo = useTodo();
  const breakpoint = useBreakpoint();
  const { colors } = useTheme();
  const [view, setView] = useSetting<ListsView>(VIEW_SETTING, 'grid');
  const { data, error } = useFolderContents(folderId);
  const [choosing, setChoosing] = useState(false);
  const [creating, setCreating] = useState<'list' | 'folder' | null>(null);
  const [actions, setActions] = useState<Item | null>(null);
  const [editingFolder, setEditingFolder] = useState<FolderSummary | null>(null);
  const [moving, setMoving] = useState<MoveTarget | null>(null);

  if (error) {
    return (
      <EmptyState
        icon={CloudAlert}
        title="Não foi possível carregar"
        message="Suas listas continuam salvas. Tente abrir o app de novo."
      />
    );
  }

  const folders = data?.folders ?? [];
  const lists = data?.lists ?? [];
  const here = data?.folder ?? null;
  const canNest = !here || here.depth < MAX_FOLDER_DEPTH;
  const openList = (id: string) =>
    router.push({ pathname: '/aquarium/lists/[id]', params: { id } });
  const openFolder = (id: string) =>
    router.push({ pathname: '/aquarium/folders/[id]', params: { id } });
  const create = () => (canNest ? setChoosing(true) : setCreating('list'));

  const grid = (
    <View style={styles.sections}>
      {folders.length > 0 ? (
        <Section title="Pastas">
          <Grid columns={COLUMNS[breakpoint]} gap={spacing.md} accessibilityRole="list">
            {folders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                onPress={() => openFolder(folder.id)}
                onLongPress={() => setActions({ kind: 'folder', folder })}
              />
            ))}
          </Grid>
        </Section>
      ) : null}
      <Section title={folders.length > 0 ? (here ? 'Listas' : 'Listas soltas') : null}>
        <Grid columns={COLUMNS[breakpoint]} gap={spacing.md} accessibilityRole="list">
          {[
            ...lists.map((list) => (
              <ListCard
                key={list.id}
                list={list}
                onPress={() => openList(list.id)}
                onLongPress={() => setActions({ kind: 'list', list })}
              />
            )),
            <NewListCard
              key="new"
              label={canNest ? 'Nova lista ou pasta' : 'Nova lista'}
              onPress={create}
            />,
          ]}
        </Grid>
      </Section>
    </View>
  );

  const rows = (
    <Surface style={styles.rows}>
      {folders.map((folder, index) => (
        <FolderRow
          key={folder.id}
          folder={folder}
          separator={index > 0}
          onPress={() => openFolder(folder.id)}
          onLongPress={() => setActions({ kind: 'folder', folder })}
        />
      ))}
      {lists.map((list, index) => (
        <ListRow
          key={list.id}
          list={list}
          separator={folders.length + index > 0}
          onPress={() => openList(list.id)}
          onLongPress={() => setActions({ kind: 'list', list })}
        />
      ))}
      {folders.length + lists.length === 0 ? (
        <Text variant="footnote" tone="secondary" style={styles.emptyRows}>
          Nada aqui ainda. Toque no + para criar uma lista ou uma pasta.
        </Text>
      ) : null}
    </Surface>
  );

  return (
    <View style={styles.root}>
      <SegmentedControl
        accessibilityLabel="Visualização"
        options={[
          { value: 'grid', label: 'Grade' },
          { value: 'rows', label: 'Lista' },
          { value: 'all', label: 'Tudo junto' },
        ]}
        value={view}
        onChange={(value) => void setView(value as ListsView)}
      />

      {view === 'all' ? <FolderTasksView folderId={folderId} /> : view === 'rows' ? rows : grid}

      {/* Create: a list or a folder, here. */}
      <Sheet
        visible={choosing}
        onClose={() => setChoosing(false)}
        title={here ? `Criar em ${here.name}` : 'Criar'}
      >
        <View style={styles.choices}>
          <Choice
            icon={<ListPlus size={28} color={colors.accent} />}
            title="Nova lista"
            hint="Tarefas com prazos, subtarefas e lembretes"
            onPress={() => {
              setChoosing(false);
              setCreating('list');
            }}
          />
          <Choice
            icon={<FolderPlus size={28} color={colors.accent} />}
            title="Nova pasta"
            hint="Para separar listas, como Semestre 4"
            onPress={() => {
              setChoosing(false);
              setCreating('folder');
            }}
          />
        </View>
      </Sheet>
      <ListEditorSheet
        visible={creating === 'list'}
        folderId={folderId}
        onClose={() => setCreating(null)}
        onCreated={openList}
      />
      <FolderEditorSheet
        visible={creating === 'folder' || editingFolder !== null}
        folder={editingFolder}
        parentId={folderId}
        parentName={here?.name ?? null}
        onClose={() => {
          setCreating(null);
          setEditingFolder(null);
        }}
      />

      {/* Hold an item: move, edit, pin. */}
      <Sheet
        visible={actions !== null}
        onClose={() => setActions(null)}
        title={actions?.kind === 'folder' ? actions.folder.name : actions?.list.name}
      >
        {actions ? (
          <View style={styles.actions}>
            <Button
              label="Abrir"
              variant="secondary"
              block
              onPress={() => {
                setActions(null);
                if (actions.kind === 'folder') openFolder(actions.folder.id);
                else openList(actions.list.id);
              }}
            />
            <Button
              label="Mover para…"
              variant="secondary"
              block
              onPress={() => {
                setActions(null);
                setMoving(
                  actions.kind === 'folder'
                    ? {
                        kind: 'folder',
                        id: actions.folder.id,
                        name: actions.folder.name,
                        folderId: actions.folder.parentId,
                      }
                    : {
                        kind: 'list',
                        id: actions.list.id,
                        name: actions.list.name,
                        folderId,
                      },
                );
              }}
            />
            {onConnect ? (
              <Button
                label="Conectar a…"
                variant="secondary"
                block
                onPress={() => {
                  setActions(null);
                  onConnect(
                    actions.kind === 'folder'
                      ? { kind: 'folder', id: actions.folder.id, name: actions.folder.name }
                      : { kind: 'list', id: actions.list.id, name: actions.list.name },
                  );
                }}
              />
            ) : null}
            {actions.kind === 'folder' ? (
              <>
                <Button
                  label={actions.folder.pinned ? 'Tirar do Início' : 'Mostrar no Início'}
                  variant="secondary"
                  block
                  onPress={() => {
                    todo
                      .updateFolder(actions.folder.id, { pinned: !actions.folder.pinned })
                      .catch((e: unknown) => console.error(e));
                    setActions(null);
                  }}
                />
                <Button
                  label="Editar ou apagar"
                  variant="ghost"
                  block
                  onPress={() => {
                    setEditingFolder(actions.folder);
                    setActions(null);
                  }}
                />
              </>
            ) : null}
          </View>
        ) : null}
      </Sheet>
      <MoveSheet target={moving} onClose={() => setMoving(null)} />
    </View>
  );
}

function Section({ title, children }: { title: string | null; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      {title ? (
        <Text variant="overline" tone="tertiary" style={styles.sectionTitle}>
          {title}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

function Choice({
  icon,
  title,
  hint,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${hint}`}
      style={({ pressed }) => [
        styles.choice,
        {
          borderColor: colors.border,
          backgroundColor: pressed ? colors.surfacePressed : colors.surfaceRaised,
        },
      ]}
    >
      {icon}
      <Text variant="headline">{title}</Text>
      <Text variant="footnote" tone="secondary">
        {hint}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  sections: { gap: spacing.xl },
  section: { gap: spacing.sm },
  sectionTitle: { marginLeft: spacing.xs },
  rows: { overflow: 'hidden' },
  emptyRows: { padding: spacing.lg },
  choices: { flexDirection: 'row', gap: spacing.md },
  choice: {
    flex: 1,
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
  },
  actions: { gap: spacing.sm },
});
