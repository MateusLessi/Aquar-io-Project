import { useRouter } from 'expo-router';
import { ChevronRight, Folder } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  Chip,
  Glyph,
  Surface,
  Text,
  listColors,
  spacing,
  useTheme,
  withAlpha,
} from '@/design-system';

import { dueLabel, toDateKey } from '../domain/dates';
import type { FolderSummary } from '../domain/types';
import { useFolders, useFolderTasks } from '../hooks/queries';
import { folderContentsLabel, ProgressRing } from './FolderCard';

const NEXT = 3;

/** The folders pinned to the dashboard: progress and the next tasks of each. */
export function PinnedFolders({ bare = false }: { bare?: boolean } = {}) {
  const { data: folders = [] } = useFolders();
  const pinned = folders.filter((f) => f.pinned);
  if (pinned.length === 0) {
    return bare ? (
      <View style={styles.root}>
        <Text variant="overline" tone="tertiary">
          Pastas fixadas
        </Text>
        <Text variant="footnote" tone="secondary">
          Fixe uma pasta (segure nela, em Listas) para ver aqui o que vence nela.
        </Text>
      </View>
    ) : null;
  }
  return (
    <View style={styles.root}>
      {bare ? (
        <Text variant="overline" tone="tertiary">
          Pastas fixadas
        </Text>
      ) : null}
      {pinned.map((folder) => (
        <PinnedFolder
          key={folder.id}
          folder={folder}
          subfolders={folders.filter((f) => f.parentId === folder.id)}
          bare={bare}
        />
      ))}
    </View>
  );
}

function PinnedFolder({
  folder,
  subfolders,
  bare,
}: {
  folder: FolderSummary;
  /** Shown as chips that open them. */
  subfolders: FolderSummary[];
  bare: boolean;
}) {
  const Card = bare ? View : Surface;
  const router = useRouter();
  const { colors, scheme } = useTheme();
  const { data: tasks = [] } = useFolderTasks(folder.id);
  const tone = folder.color ? listColors[folder.color][scheme] : colors.accent;
  // Only what has a date: the dashboard is about the days ahead, not the backlog.
  const next = tasks
    .filter((t) => !t.completedAt && t.dueDate)
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
    .slice(0, NEXT);
  const total = folder.openCount + folder.doneCount;

  return (
    <Card style={bare ? styles.bareCard : [styles.card, { borderColor: withAlpha(tone, 0.35) }]}>
      <Pressable
        onPress={() =>
          router.push({ pathname: '/aquarium/folders/[id]', params: { id: folder.id } })
        }
        accessibilityRole="button"
        accessibilityLabel={`Pasta ${folder.name}: ${folder.openCount} pendentes. Abrir`}
        style={styles.head}
      >
        <View style={[styles.badge, { backgroundColor: withAlpha(tone, 0.24) }]}>
          {folder.emoji ? (
            <Glyph name={folder.emoji} size={19} color={tone} />
          ) : (
            <Folder size={18} color={tone} />
          )}
        </View>
        <View style={styles.flex}>
          <Text variant="headline" numberOfLines={1}>
            {folder.name}
          </Text>
          <Text variant="footnote" tone="secondary" numberOfLines={1}>
            {folderContentsLabel(folder)} · {folder.openCount} pendentes
          </Text>
        </View>
        <ProgressRing value={folder.doneCount} total={total} tone={tone} size={36} />
        {bare ? null : <ChevronRight size={18} color={colors.textTertiary} />}
      </Pressable>
      {subfolders.length > 0 ? (
        <View style={styles.chips}>
          {subfolders.map((sub) => (
            <Chip
              key={sub.id}
              label={sub.openCount > 0 ? `${sub.name} · ${sub.openCount}` : sub.name}
              onPress={() =>
                router.push({ pathname: '/aquarium/folders/[id]', params: { id: sub.id } })
              }
            />
          ))}
        </View>
      ) : null}
      {next.length > 0 ? (
        <View style={styles.tasks}>
          {next.map((task) => (
            <View key={task.id} style={styles.task}>
              <View style={[styles.dot, { backgroundColor: tone }]} />
              <Text variant="callout" numberOfLines={1} style={styles.flex}>
                {task.title}
              </Text>
              <Text variant="caption" tone="tertiary" numberOfLines={1}>
                {dueLabel(task.dueDate!, toDateKey(new Date()))}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text variant="footnote" tone="tertiary">
          {folder.openCount > 0 ? 'Nada com prazo nesta pasta.' : 'Tudo em dia nesta pasta.'}
        </Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  card: { padding: spacing.lg, gap: spacing.md },
  bareCard: { gap: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  badge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  tasks: { gap: spacing.sm },
  task: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
