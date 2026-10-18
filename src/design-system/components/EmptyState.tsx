import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { spacing } from '../tokens';
import { Button } from './Button';
import { Text } from './Text';

const ICON_SIZE = 76;

export type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  message: string;
  action?: { label: string; onPress: () => void };
};

/** Shown when a screen has nothing to list yet: calm, specific, and pointing to the next step. */
export function EmptyState({ icon: Icon, title, message, action }: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.root}>
      <View style={[styles.halo, { borderColor: colors.accentSoft }]}>
        <View style={[styles.icon, { backgroundColor: colors.accentSoft }]}>
          <Icon size={32} strokeWidth={1.7} color={colors.accent} />
        </View>
      </View>
      <Text variant="title2" style={styles.center}>
        {title}
      </Text>
      <Text variant="callout" tone="secondary" style={[styles.center, styles.message]}>
        {message}
      </Text>
      {action ? (
        <View style={styles.action}>
          <Button label={action.label} variant="secondary" onPress={action.onPress} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', paddingVertical: spacing.huge, paddingHorizontal: spacing.xl },
  halo: {
    padding: 10,
    borderRadius: (ICON_SIZE + 20) / 2,
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { textAlign: 'center' },
  message: { marginTop: spacing.sm, maxWidth: 340 },
  action: { marginTop: spacing.xl },
});
