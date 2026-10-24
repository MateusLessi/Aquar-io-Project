import { useRouter } from 'expo-router';
import { ChevronRight, Folder } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Surface, Text, listColors, spacing, useTheme, withAlpha } from '@/design-system';

import { dueLabel, toDateKey } from '../domain/dates';
import type { FolderSummary } from '../domain/types';
import { useFolders, useFolderTasks } from '../hooks/queries';
import { folderContentsLabel, ProgressRing } from './FolderCard';

const NEXT = 3;

/** The folders pinned to the dashboard: progress and the next tasks of each. */
export function PinnedFolders() {
  const { data: folders = [] } = useFolders();
  const pinned = folders.filter((f) => f.pinned);
  if (pinned.length === 0) return null;
  return (
    <View style={styles.root}>
      {pinned.map((folder) => (
        <PinnedFolder key={folder.id} folder={folder} />
      ))}
    </View>
  );
}

function PinnedFolder({ folder }: { folder: FolderSummary }) {
  const router = useRouter();
  const { colors, scheme } = useTheme();
  const { data: tasks = [] } = useFolderTasks(folder.id);
  const tone = folder.color ? listColors[folder.color][scheme] : colors.accent;
  const next = tasks.filter((t) => !t.completedAt).slice(0, NEXT);
  const total = folder.openCount + folder.doneCount;

  return (
    <Surface style={[styles.card, { borderColor: withAlpha(tone, 0.35) }]}>
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
            <Text variant="headline">{folder.emoji}</Text>
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
        <ChevronRight size={18} color={colors.textTertiary} />
      </Pressable>
      {next.length > 0 ? (
        <View style={styles.tasks}>
          {next.map((task) => (
            <View key={task.id} style={styles.task}>
              <View style={[styles.dot, { backgroundColor: tone }]} />
              <Text variant="callout" numberOfLines={1} style={styles.flex}>
                {task.title}
              </Text>
              <Text variant="caption" tone="tertiary" numberOfLines={1}>
                {task.dueDate ? dueLabel(task.dueDate, toDateKey(new Date())) : task.listName}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text variant="footnote" tone="tertiary">
          Tudo em dia nesta pasta.
        </Text>
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  card: { padding: spacing.lg, gap: spacing.md, borderWidth: 1 },
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
