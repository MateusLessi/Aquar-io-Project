import { useEffect } from 'react';

import { useSetting } from '@/core/settings/useSetting';
import { configureFeedback, defaultFeedbackPrefs, type SoundGroup } from '@/design-system';

type OnOff = 'on' | 'off';
const on = (v: boolean): OnOff => (v ? 'on' : 'off');
const d = defaultFeedbackPrefs;

/** The stored Sons e toque choices (per device), with setters. */
export function useFeedbackSettings() {
  const [sound, setSound] = useSetting<OnOff>('feedback.sound', on(d.sound));
  const [volume, setVolume] = useSetting<string>('feedback.volume', String(d.volume * 100));
  const [completions, setCompletions] = useSetting<OnOff>(
    'feedback.completions',
    on(d.groups.completions),
  );
  const [celebrations, setCelebrations] = useSetting<OnOff>(
    'feedback.celebrations',
    on(d.groups.celebrations),
  );
  const [connect, setConnect] = useSetting<OnOff>('feedback.connect', on(d.groups.connect));
  const [haptics, setHaptics] = useSetting<OnOff>('feedback.haptics', on(d.haptics));

  const parsed = Number(volume);
  const prefs = {
    sound: sound === 'on',
    volume: Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) / 100 : d.volume,
    groups: {
      completions: completions === 'on',
      celebrations: celebrations === 'on',
      connect: connect === 'on',
    } satisfies Record<SoundGroup, boolean>,
    haptics: haptics === 'on',
  };
  const setGroup: Record<SoundGroup, (v: boolean) => void> = {
    completions: (v) => void setCompletions(on(v)),
    celebrations: (v) => void setCelebrations(on(v)),
    connect: (v) => void setConnect(on(v)),
  };
  return {
    prefs,
    setSound: (v: boolean) => void setSound(on(v)),
    setVolume: (v: number) => void setVolume(String(Math.round(v * 100))),
    setGroup,
    setHaptics: (v: boolean) => void setHaptics(on(v)),
  };
}

/** Keeps sound.play and haptics.* in line with the stored choices. Mount once, in the shell. */
export function useFeedbackSync() {
  const { prefs } = useFeedbackSettings();
  const { sound, volume, haptics } = prefs;
  const { completions, celebrations, connect } = prefs.groups;
  useEffect(() => {
    configureFeedback({ sound, volume, haptics, groups: { completions, celebrations, connect } });
  }, [sound, volume, haptics, completions, celebrations, connect]);
}
