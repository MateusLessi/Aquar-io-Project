/** Which sounds may play. Each group can be turned off on its own. */
export type SoundGroup = 'completions' | 'celebrations' | 'connect';

export type FeedbackPrefs = {
  sound: boolean;
  /** 0–1. */
  volume: number;
  groups: Record<SoundGroup, boolean>;
  haptics: boolean;
};

export const defaultFeedbackPrefs: FeedbackPrefs = {
  sound: true,
  volume: 0.6,
  groups: { completions: true, celebrations: true, connect: true },
  haptics: true,
};

let current: FeedbackPrefs = defaultFeedbackPrefs;

/**
 * The person's sound and vibration choices, set by the app shell from the stored settings so
 * that `sound.play` and `haptics.*` can be called from anywhere without a hook.
 */
export function configureFeedback(prefs: FeedbackPrefs) {
  current = prefs;
}

export function feedbackPrefs(): FeedbackPrefs {
  return current;
}
