import { ChevronRight, Folder } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Text, listColors, radius, specular, spacing, useTheme, withAlpha } from '@/design-system';

import type { FolderSummary } from '../domain/types';

const CARD_HEIGHT = 148;

type FolderCardProps = {
  folder: FolderSummary;
  onPress: () => void;
  onLongPress?: () => void;
};

/** "2 pastas · 1 lista": what a folder holds. */
export function folderContentsLabel(folder: FolderSummary): string {
  const parts: string[] = [];
  if (folder.folderCount > 0) {
    parts.push(`${folder.folderCount} ${folder.folderCount === 1 ? 'pasta' : 'pastas'}`);
  }
  parts.push(`${folder.listCount} ${folder.listCount === 1 ? 'lista' : 'listas'}`);
  return parts.join(' · ');
}

function progressLabel(folder: FolderSummary): string {
  const total = folder.openCount + folder.doneCount;
  if (total === 0) return 'vazia';
  return folder.openCount === 0 ? 'tudo em dia' : `${folder.doneCount}/${total}`;
}

/**
 * A folder as a glass block with its lists peeking out behind it, like stacked cards. The
 * ring shows how much of everything inside is done.
 */
export function FolderCard({ folder, onPress, onLongPress }: FolderCardProps) {
  const { colors, scheme } = useTheme();
  const tone = folder.color ? listColors[folder.color][scheme] : colors.accent;
  const total = folder.openCount + folder.doneCount;
  const label = `Pasta ${folder.name}, ${folderContentsLabel(folder)}, ${progressLabel(folder)}`;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Abre a pasta. Segure para mover, editar ou fixar."
      accessibilityActions={onLongPress ? [{ name: 'longpress', label: 'Mais opções' }] : []}
      onAccessibilityAction={onLongPress}
      style={({ pressed }) => [styles.root, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}
    >
      {/* The cards behind: lists inside the folder. */}
      <View
        style={[
          styles.back,
          styles.backLeft,
          { backgroundColor: withAlpha(tone, scheme === 'dark' ? 0.32 : 0.28) },
        ]}
      />
      <View
        style={[
          styles.back,
          styles.backRight,
          { backgroundColor: withAlpha(tone, scheme === 'dark' ? 0.5 : 0.42) },
        ]}
      />
      <View
        style={[
          styles.front,
          {
            backgroundColor: colors.surfaceRaised,
            borderColor: withAlpha(tone, 0.5),
            shadowColor: colors.shadow,
          },
        ]}
      >
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: withAlpha(tone, scheme === 'dark' ? 0.22 : 0.14) },
          ]}
        />
        <View style={[styles.tab, { backgroundColor: tone }]} />
        <View
          style={[
            styles.shine,
            { backgroundColor: withAlpha(specular, scheme === 'dark' ? 0.1 : 0.6) },
          ]}
        />
        <View style={styles.head}>
          <View style={[styles.badge, { backgroundColor: withAlpha(tone, 0.28) }]}>
            {folder.emoji ? (
              <Text variant="title2">{folder.emoji}</Text>
            ) : (
              <Folder size={22} color={tone} />
            )}
          </View>
          <ProgressRing value={folder.doneCount} total={total} tone={tone} size={42} />
        </View>
        <View>
          <Text variant="headline" numberOfLines={1}>
            {folder.name}
          </Text>
          <Text variant="footnote" tone="secondary" numberOfLines={1}>
            {folderContentsLabel(folder)} · {progressLabel(folder)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

/** A folder as a compact row, for the "Lista" view. */
export function FolderRow({
  folder,
  onPress,
  onLongPress,
  separator,
}: FolderCardProps & { separator?: boolean }) {
  const { colors, scheme } = useTheme();
  const tone = folder.color ? listColors[folder.color][scheme] : colors.accent;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={`Pasta ${folder.name}, ${folderContentsLabel(folder)}, ${progressLabel(folder)}`}
      accessibilityActions={onLongPress ? [{ name: 'longpress', label: 'Mais opções' }] : []}
      onAccessibilityAction={onLongPress}
      style={({ pressed }) => [
        styles.row,
        separator && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator },
        pressed && { backgroundColor: colors.surfacePressed },
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: withAlpha(tone, 0.24) }]}>
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
          Pasta · {folderContentsLabel(folder)} · {progressLabel(folder)}
        </Text>
      </View>
      <ChevronRight size={18} color={colors.textTertiary} />
    </Pressable>
  );
}

export function ProgressRing({
  value,
  total,
  tone,
  size,
}: {
  value: number;
  total: number;
  tone: string;
  size: number;
}) {
  const { colors } = useTheme();
  const stroke = 4;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const ratio = total > 0 ? value / total : 0;
  return (
    <View style={{ width: size, height: size }} accessible={false}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={withAlpha(colors.textPrimary, 0.1)}
          strokeWidth={stroke}
          fill="none"
        />
        {ratio > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={tone}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={circumference * (1 - ratio)}
            fill="none"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { height: CARD_HEIGHT + 16, paddingTop: 16 },
  back: { position: 'absolute', height: 60, borderRadius: radius.lg },
  backLeft: { top: 2, left: 8, right: 16, transform: [{ rotate: '-4deg' }] },
  backRight: { top: 6, left: 20, right: 4, transform: [{ rotate: '3deg' }] },
  front: {
    height: CARD_HEIGHT,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  tab: {
    position: 'absolute',
    top: 0,
    left: spacing.lg,
    width: 48,
    height: 5,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
  },
  shine: { position: 'absolute', top: 0, left: 0, right: 0, height: 1 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: { flex: 1 },
});
