import { ChevronRight, Folder } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { Glyph, TabCard, Text, listColors, spacing, useTheme, withAlpha } from '@/design-system';

import type { FolderSummary } from '../domain/types';

const CARD_HEIGHT = 156;

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
 * A folder as the brand shape (Fase 6, "a aba"): a card in the folder's color that rises into a
 * tab, its icon in a dark circle and the number of open tasks as the biggest thing on it. Lists
 * stay plain cards, so the tab always means "a folder".
 */
export function FolderCard({ folder, onPress, onLongPress }: FolderCardProps) {
  const { colors, scheme } = useTheme();
  const tone = folder.color ? listColors[folder.color][scheme] : colors.accent;
  // Dark text on the folder's color (at least 6.7:1 on every list color).
  const ink = colors.surfaceBase;
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
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.97 : 1 }] })}
    >
      <TabCard color={tone} style={styles.folder}>
        <View style={styles.inside}>
          <View style={[styles.circle, { backgroundColor: ink }]}>
            {folder.emoji ? (
              <Glyph name={folder.emoji} size={20} color={tone} />
            ) : (
              <Folder size={18} color={tone} />
            )}
          </View>
          <View>
            <View style={styles.countRow}>
              <Text style={[styles.count, { color: ink }]}>
                {folder.openCount > 0 ? folder.openCount : '✓'}
              </Text>
              <Text variant="caption" style={{ color: ink }}>
                {folder.openCount === 0
                  ? 'tudo em dia'
                  : folder.openCount === 1
                    ? 'aberta'
                    : 'abertas'}
              </Text>
            </View>
            <Text variant="bodyStrong" numberOfLines={1} style={{ color: ink }}>
              {folder.name}
            </Text>
            <Text variant="caption" numberOfLines={1} style={[styles.contents, { color: ink }]}>
              {folderContentsLabel(folder)}
            </Text>
          </View>
        </View>
      </TabCard>
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
          Pasta · {folderContentsLabel(folder)} · {progressLabel(folder)}
        </Text>
      </View>
      <ChevronRight size={18} color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  folder: { height: CARD_HEIGHT },
  inside: { flex: 1, padding: spacing.md, paddingTop: spacing.sm, justifyContent: 'space-between' },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  count: { fontSize: 30, lineHeight: 34, fontWeight: '800' },
  contents: { opacity: 0.8 },
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
