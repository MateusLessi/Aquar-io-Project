import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';

import { feedbackPrefs, type SoundGroup } from './feedback';

/**
 * The app's sound effects (assets/sounds, synthesized by scripts/sounds/make_sounds.py).
 * Short and soft for everyday moments, longer and rarer for celebrations.
 */
const SOUNDS = {
  task: { source: require('../../assets/sounds/task.mp3'), group: 'completions' },
  habit: { source: require('../../assets/sounds/habit.mp3'), group: 'completions' },
  step: { source: require('../../assets/sounds/step.mp3'), group: 'completions' },
  connect: { source: require('../../assets/sounds/connect.mp3'), group: 'connect' },
  complete: { source: require('../../assets/sounds/complete.mp3'), group: 'celebrations' },
  timer: { source: require('../../assets/sounds/timer.mp3'), group: 'celebrations' },
  'full-tide': { source: require('../../assets/sounds/full-tide.mp3'), group: 'celebrations' },
  zone: { source: require('../../assets/sounds/zone.mp3'), group: 'celebrations' },
} satisfies Record<string, { source: number; group: SoundGroup }>;

export type SoundName = keyof typeof SOUNDS;

/** The same sound does not repeat closer than this: checking things fast is not a drum roll. */
const MIN_GAP_MS = 80;

const players = new Map<SoundName, AudioPlayer>();
const lastPlayed = new Map<SoundName, number>();
let modeSet = false;

function playerFor(name: SoundName): AudioPlayer {
  let player = players.get(name);
  if (!player) {
    player = createAudioPlayer(SOUNDS[name].source);
    players.set(name, player);
  }
  return player;
}

function setMode() {
  if (modeSet) return;
  modeSet = true;
  // Mix with the person's music or podcast; on iOS the silent switch mutes the effects.
  setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(
    () => {},
  );
}

export const sound = {
  /**
   * Plays a sound if the person allows it (sounds on, its group on). Never throws: sound is a
   * nicety. `preview` plays even with sounds off, for "Ouvir um exemplo".
   */
  play(name: SoundName, { preview = false }: { preview?: boolean } = {}) {
    const prefs = feedbackPrefs();
    if (!preview && (!prefs.sound || !prefs.groups[SOUNDS[name].group])) return;
    const now = Date.now();
    if (now - (lastPlayed.get(name) ?? 0) < MIN_GAP_MS) return;
    lastPlayed.set(name, now);
    try {
      if (Platform.OS !== 'web') setMode();
      const player = playerFor(name);
      player.volume = prefs.volume;
      player.seekTo(0).catch(() => {});
      player.play();
    } catch (error) {
      console.warn(`Could not play the "${name}" sound.`, error);
    }
  },
};
