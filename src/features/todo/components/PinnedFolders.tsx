import { useRouter } from 'expo-router';
import { Folder } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import {
  Glyph,
  TAB_HEIGHT,
  TabCard,
  Text,
  haptics,
  listColors,
  radius,
  spacing,
  useTheme,
  withAlpha,
} from '@/design-system';

import { dueLabel, toDateKey } from '../domain/dates';
import type { FolderSummary } from '../domain/types';
import { useFolders, useFolderTasks } from '../hooks/queries';
import { folderContentsLabel } from './FolderCard';

const NEXT = 3;
/** How much of each folder behind shows above the one in front. */
const PEEK = 26;

/**
 * The folders pinned to the dashboard as a stack (Fase 6, "o maço"): the one in front shows
 * what comes due in it; the ones behind show their tab and name, and a tap brings one forward.
 */
export function PinnedFolders({ bare = false }: { bare?: boolean } = {}) {
  const { data: folders = [] } = useFolders();
  const pinned = folders.filter((f) => f.pinned);
  const [frontId, setFrontId] = useState<string | null>(null);
  const { reduceMotion } = useTheme();
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
  const front = pinned.find((f) => f.id === frontId) ?? pinned[0]!;
  const behind = pinned.filter((f) => f.id !== front.id);

  return (
    <View style={styles.root}>
      <Text variant="overline" tone="tertiary">
        Pastas fixadas
      </Text>
      <Animated.View layout={reduceMotion ? undefined : LinearTransition.springify().damping(20)}>
        {behind.map((folder, i) => (
          <BehindFolder
            key={folder.id}
            folder={folder}
            // Each tab a little further right, so none hides another.
            tabFrom={0.2 + ((i % 4) * 0.5) / 4}
            onPress={() => {
              haptics.selection();
              setFrontId(folder.id);
            }}
          />
        ))}
        <Animated.View key={front.id} entering={reduceMotion ? undefined : FadeIn.duration(220)}>
          <FrontFolder folder={front} subfolders={folders.filter((f) => f.parentId === front.id)} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

function useTone(folder: FolderSummary) {
  const { colors, scheme } = useTheme();
  return folder.color ? listColors[folder.color][scheme] : colors.accent;
}

/** A folder behind the front one: only its tab and name show. */
function BehindFolder({
  folder,
  tabFrom,
  onPress,
}: {
  folder: FolderSummary;
  tabFrom: number;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const tone = useTone(folder);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Mostrar a pasta ${folder.name}, ${folder.openCount} abertas`}
      style={styles.behind}
    >
      <TabCard color={tone} tabFrom={tabFrom} style={styles.behindCard}>
        <Text
          variant="caption"
          numberOfLines={1}
          style={[styles.behindLabel, { color: colors.surfaceBase }]}
        >
          {folder.name} · {folder.openCount}
        </Text>
      </TabCard>
    </Pressable>
  );
}

/** The folder in front: its name and open tasks, its subfolders and what comes due. */
function FrontFolder({
  folder,
  subfolders,
}: {
  folder: FolderSummary;
  /** Shown as small pills that open them. */
  subfolders: FolderSummary[];
}) {
  const router = useRouter();
  const { colors } = useTheme();
  const tone = useTone(folder);
  const ink = colors.surfaceBase;
  const { data: tasks = [] } = useFolderTasks(folder.id);
  // Only what has a date: the dashboard is about the days ahead, not the backlog.
  const next = tasks
    .filter((t) => !t.completedAt && t.dueDate)
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!))
    .slice(0, NEXT);
  const open = (id: string) => router.push({ pathname: '/aquarium/folders/[id]', params: { id } });

  return (
    <TabCard color={tone}>
      <View style={styles.front}>
        <Pressable
          onPress={() => open(folder.id)}
          accessibilityRole="button"
          accessibilityLabel={`Pasta ${folder.name}: ${folder.openCount} pendentes. Abrir`}
          style={styles.head}
        >
          <View style={[styles.circle, { backgroundColor: ink }]}>
            {folder.emoji ? (
              <Glyph name={folder.emoji} size={18} color={tone} />
            ) : (
              <Folder size={17} color={tone} />
            )}
          </View>
          <View style={styles.flex}>
            <Text variant="bodyStrong" numberOfLines={1} style={{ color: ink }}>
              {folder.name}
            </Text>
            <Text variant="caption" numberOfLines={1} style={[styles.soft, { color: ink }]}>
              {folderContentsLabel(folder)}
            </Text>
          </View>
          <Text style={[styles.count, { color: ink }]}>{folder.openCount}</Text>
        </Pressable>
        {subfolders.length > 0 ? (
          <View style={styles.pills}>
            {subfolders.map((sub) => (
              <Pressable
                key={sub.id}
                onPress={() => open(sub.id)}
                accessibilityRole="button"
                accessibilityLabel={`Pasta ${sub.name}, ${sub.openCount} abertas`}
                style={[styles.pill, { backgroundColor: withAlpha(ink, 0.12) }]}
              >
                <Text variant="caption" style={{ color: ink }} numberOfLines={1}>
                  {sub.openCount > 0 ? `${sub.name} · ${sub.openCount}` : sub.name}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        {next.length > 0 ? (
          <View style={styles.tasks}>
            {next.map((task) => (
              <View key={task.id} style={styles.task}>
                <View style={[styles.dot, { backgroundColor: ink }]} />
                <Text variant="callout" numberOfLines={1} style={[styles.flex, { color: ink }]}>
                  {task.title}
                </Text>
                <Text variant="caption" numberOfLines={1} style={[styles.soft, { color: ink }]}>
                  {dueLabel(task.dueDate!, toDateKey(new Date()))}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text variant="footnote" style={[styles.soft, { color: ink }]}>
            {folder.openCount > 0 ? 'Nada com prazo nesta pasta.' : 'Tudo em dia nesta pasta.'}
          </Text>
        )}
      </View>
    </TabCard>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  behind: { marginBottom: -(TAB_HEIGHT + spacing.lg) },
  behindCard: { height: TAB_HEIGHT + spacing.lg + PEEK },
  behindLabel: { marginHorizontal: spacing.md, marginTop: 4, fontWeight: '700' },
  front: { padding: spacing.md, paddingTop: spacing.xs, gap: spacing.sm },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
  soft: { opacity: 0.8 },
  count: { fontSize: 26, lineHeight: 30, fontWeight: '800' },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  pill: { borderRadius: radius.pill, paddingHorizontal: spacing.sm + 2, paddingVertical: 4 },
  tasks: { gap: spacing.sm },
  task: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
