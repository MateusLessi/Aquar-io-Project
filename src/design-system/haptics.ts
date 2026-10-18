import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptic feedback, used sparingly: completions and important actions only.
 * Failures are ignored: haptics are a nicety, never a requirement.
 */
export const haptics = {
  /** A light tap, e.g. checking a task. */
  light() {
    if (Platform.OS === 'web') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  /** Confirms a meaningful success, e.g. finishing a whole list. */
  success() {
    if (Platform.OS === 'web') return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
  /** Selection changes, e.g. a segmented control. */
  selection() {
    if (Platform.OS === 'web') return;
    Haptics.selectionAsync().catch(() => {});
  },
};
