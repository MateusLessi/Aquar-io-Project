import { Folder, Home } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Sheet, Text, listColors, spacing, useTheme } from '@/design-system';

import type { FolderSummary } from '../domain/types';
import { MAX_FOLDER_DEPTH, ValidationError } from '../domain/validation';
import { useFolders } from '../hooks/queries';
import { useTodo } from '../hooks/todoContext';

export type MoveTarget =
  | { kind: 'list'; id: string; name: string; folderId: string | null }
  | { kind: 'folder'; id: string; name: string; folderId: string | null };

type MoveSheetProps = {
  target: MoveTarget | null;
  onClose: () => void;
};

/** Folders in tree order (each followed by its subfolders), with their depth. */
export function treeOrder(folders: FolderSummary[]): FolderSummary[] {
  const children = new Map<string | null, FolderSummary[]>();
  for (const folder of folders) {
    children.set(folder.parentId, [...(children.get(folder.parentId) ?? []), folder]);
  }
  const walk = (parent: string | null): FolderSummary[] =>
    (children.get(parent) ?? []).flatMap((f) => [f, ...walk(f.id)]);
  return walk(null);
}

/**
 * "Mover para…": the folder tree with the current place marked. A folder cannot go inside
 * itself, nor so deep that its own subfolders would pass the limit; those places are dimmed.
 */
export function MoveSheet({ target, onClose }: MoveSheetProps) {
  const todo = useTodo();
  const { colors, scheme } = useTheme();
  const { data: folders = [] } = useFolders();
  const ordered = treeOrder(folders);

  // For a folder: what is inside it, and how many levels it spans.
  const blocked = new Set<string>();
  let height = 0;
  if (target?.kind === 'folder') {
    const byParent = new Map<string | null, string[]>();
    for (const f of folders) byParent.set(f.parentId, [...(byParent.get(f.parentId) ?? []), f.id]);
    const mark = (id: string, level: number) => {
      blocked.add(id);
      height = Math.max(height, level);
      for (const child of byParent.get(id) ?? []) mark(child, level + 1);
    };
    mark(target.id, 1);
  }
  const allowed = (folder: FolderSummary) =>
    !blocked.has(folder.id) &&
    (target?.kind !== 'folder' || folder.depth + height <= MAX_FOLDER_DEPTH);

  const move = (folderId: string | null) => {
    if (!target) return;
    const done =
      target.kind === 'list'
        ? todo.moveList(target.id, folderId)
        : todo.moveFolder(target.id, folderId);
    done.then(onClose).catch((e: unknown) => {
      if (!(e instanceof ValidationError)) console.error(e);
    });
  };

  const option = (
    key: string,
    label: string,
    icon: React.ReactNode,
    level: number,
    folderId: string | null,
    enabled: boolean,
  ) => {
    const current = target?.folderId === folderId;
    return (
      <Pressable
        key={key}
        onPress={() => move(folderId)}
        disabled={!enabled || current}
        accessibilityRole="radio"
        accessibilityLabel={enabled ? label : `${label} (não dá para mover para cá)`}
        accessibilityState={{ checked: current, disabled: !enabled }}
        aria-checked={current}
        style={({ pressed }) => [
          styles.option,
          { paddingLeft: spacing.md + level * spacing.lg, opacity: enabled ? 1 : 0.4 },
          pressed && { backgroundColor: colors.surfacePressed },
        ]}
      >
        {icon}
        <Text variant="body" numberOfLines={1} style={styles.flex}>
          {label}
        </Text>
        <View
          style={[
            styles.radio,
            { borderColor: current ? colors.accent : colors.textTertiary },
            current && styles.radioOn,
          ]}
        />
      </Pressable>
    );
  };

  return (
    <Sheet visible={target !== null} onClose={onClose} title={`Mover “${target?.name ?? ''}”`}>
      <View>
        {option(
          'top',
          'Listas (início)',
          <Home size={18} color={colors.textSecondary} />,
          0,
          null,
          true,
        )}
        {ordered.map((folder) =>
          option(
            folder.id,
            folder.name,
            folder.emoji ? (
              <Text variant="headline">{folder.emoji}</Text>
            ) : (
              <Folder
                size={18}
                color={folder.color ? listColors[folder.color][scheme] : colors.accent}
              />
            ),
            folder.depth,
            folder.id,
            allowed(folder),
          ),
        )}
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingRight: spacing.md,
    borderRadius: 12,
  },
  flex: { flex: 1 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2 },
  radioOn: { borderWidth: 7 },
});
