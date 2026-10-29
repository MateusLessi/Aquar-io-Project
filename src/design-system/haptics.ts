import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { feedbackPrefs } from './feedback';

const off = () => Platform.OS === 'web' || !feedbackPrefs().haptics;

/**
 * Haptic feedback, used sparingly: completions and important actions only.
 * Failures are ignored: haptics are a nicety, never a requirement. Off when the person turns
 * vibration off in Sons e toque.
 */
export const haptics = {
  /** A light tap, e.g. checking a task. */
  light() {
    if (off()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  /** Confirms a meaningful success, e.g. finishing a whole list. */
  success() {
    if (off()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
  /** Something lands in place, e.g. dropping an item into a routine. */
  medium() {
    if (off()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  },
  /** A new depth zone: one firm pulse, then two soft ones. */
  dive() {
    if (off()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {}), 180);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {}), 320);
  },
  /** Selection changes, e.g. a segmented control. */
  selection() {
    if (off()) return;
    Haptics.selectionAsync().catch(() => {});
  },
};
