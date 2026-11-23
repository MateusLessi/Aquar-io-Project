import { useEffect, useRef, useState } from 'react';
import {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '../theme/ThemeProvider';
import { springs } from '../tokens';

/**
 * A little jump when something is done (Fase 5, "poppy"): it swells for an instant and settles
 * back with a spring. Fires each time `trigger` changes while `when` holds, never on the first
 * render, and never with "Reduzir movimento".
 */
export function usePop(trigger: unknown, when = true) {
  const { reduceMotion } = useTheme();
  const scale = useSharedValue(1);
  const previous = useRef(trigger);
  useEffect(() => {
    if (Object.is(previous.current, trigger)) return;
    previous.current = trigger;
    if (!when || reduceMotion) return;
    scale.set(
      withSequence(
        withTiming(1.18, { duration: 110, easing: Easing.out(Easing.quad) }),
        withSpring(1, springs.buoyant),
      ),
    );
  }, [trigger, when, reduceMotion, scale]);
  return useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
}

/** Items after this one enter together, so a long list never waits. */
const CASCADE_MAX = 8;
const CASCADE_STEP = 45;

/**
 * Lists and blocks come in one after another, quickly (the `entering` of an Animated.View).
 * Undefined with "Reduzir movimento", so they simply show.
 */
export function cascade(index: number, reduceMotion: boolean) {
  if (reduceMotion) return undefined;
  return FadeInDown.delay(Math.min(index, CASCADE_MAX) * CASCADE_STEP)
    .springify()
    .damping(18)
    .stiffness(220);
}

const COUNT_MS = 650;
/**
 * A steady step (about 60 a second) rather than the next frame: where frames come instantly
 * (tests, some web views) the count would otherwise re-render thousands of times.
 */
const FRAME_MS = 16;
/**
 * Unit tests show the final number at once: each step of the count would be a state update
 * outside the test's act(), and dozens of those slow every test that follows.
 */
const STILL = process.env.NODE_ENV === 'test';
const easeOut = (t: number) => 1 - (1 - t) ** 3;

/**
 * A number that counts up (or down) to its value when it shows up or changes, easing out.
 * With "Reduzir movimento" it is simply the value.
 */
export function useCountUp(target: number): number {
  const { reduceMotion: reduce } = useTheme();
  const reduceMotion = reduce || STILL;
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (reduceMotion) return;
    const start = from.current;
    // Counted in steps, not by the clock: a frozen or jumping clock can't stall it.
    const steps = Math.ceil(COUNT_MS / FRAME_MS);
    let done = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const step = () => {
      done += 1;
      const t = Math.min(1, done / steps);
      const value = start + (target - start) * easeOut(t);
      from.current = value;
      setShown(value);
      if (t < 1) timer = setTimeout(step, FRAME_MS);
    };
    timer = setTimeout(step, FRAME_MS);
    return () => clearTimeout(timer);
  }, [target, reduceMotion]);
  return reduceMotion ? target : shown;
}

/**
 * The first number in a text and how to write the text with another value in its place, in
 * the same style (separator, decimals). Null when there is no number.
 */
export function numberIn(
  text: string,
): { target: number; write: (value: number) => string } | null {
  const match = /-?\d+(?:[.,]\d+)?/.exec(text);
  if (!match) return null;
  const raw = match[0];
  const separator = raw.includes(',') ? ',' : '.';
  const decimals = raw.split(separator)[1]?.length ?? 0;
  const before = text.slice(0, match.index);
  const after = text.slice(match.index + raw.length);
  return {
    target: Number(raw.replace(',', '.')),
    write: (value) =>
      before +
      (decimals > 0 ? value.toFixed(decimals).replace('.', separator) : String(Math.round(value))) +
      after,
  };
}

/**
 * Text whose first number counts up to its value: "12", "45%", "+30 m", "3 dias". Whole
 * numbers stay whole along the way.
 */
export function useCountUpText(text: string): string {
  const parts = numberIn(text);
  const value = useCountUp(parts?.target ?? 0);
  return parts ? parts.write(value) : text;
}
