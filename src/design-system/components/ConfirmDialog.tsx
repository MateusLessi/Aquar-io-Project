import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing } from '../tokens';
import { Button } from './Button';
import { Text } from './Text';

export type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  /** Destructive actions get the danger style. */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Asks before something that cannot be undone, such as deleting a list. */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { colors } = useTheme();
  if (!visible) return null;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Cancelar"
        />
        <View
          accessibilityViewIsModal
          accessibilityRole="alert"
          style={[
            styles.card,
            { backgroundColor: colors.surfaceRaised, shadowColor: colors.shadow },
          ]}
        >
          <Text variant="title2">{title}</Text>
          <Text variant="callout" tone="secondary" style={styles.message}>
            {message}
          </Text>
          <View style={styles.actions}>
            <Button label="Cancelar" variant="secondary" onPress={onCancel} block />
            <Button
              label={confirmLabel}
              variant={destructive ? 'danger' : 'primary'}
              onPress={onConfirm}
              block
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    shadowOpacity: 0.25,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  message: { marginTop: spacing.sm },
  actions: { marginTop: spacing.xxl, gap: spacing.sm },
});
