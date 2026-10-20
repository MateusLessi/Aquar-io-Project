import { Accelerometer } from 'expo-sensors';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

/** How the phone is physically held while the interface stays locked in portrait. */
export type Tilt = 'portrait' | 'landscapeLeft' | 'landscapeRight';

export type Acceleration = { x: number; y: number; z: number };

/** Gravity must clearly point sideways before we call it landscape (avoids flicker). */
const SIDEWAYS = 0.65;
/** Lying flat on a table: keep whatever we had. */
const FLAT = 0.8;

/**
 * Turns an accelerometer reading (in g) into a tilt, keeping `previous` when the phone is
 * flat or in between. `landscapeLeft` means the phone's top points to the user's left.
 */
export function tiltFromAcceleration({ x, y, z }: Acceleration, previous: Tilt): Tilt {
  if (Math.abs(z) > FLAT) return previous;
  if (Math.abs(x) > SIDEWAYS && Math.abs(x) > Math.abs(y)) {
    // iOS (Core Motion) reports gravity itself; Android reports the opposite reaction force.
    // Top to the left: iOS x ≈ -1, Android x ≈ +1.
    const sign = Platform.OS === 'android' ? 1 : -1;
    return x * sign > 0 ? 'landscapeLeft' : 'landscapeRight';
  }
  if (Math.abs(y) > SIDEWAYS) return 'portrait';
  return previous;
}

/** Degrees to rotate content so it reads upright for the current tilt. */
export function uprightRotation(tilt: Tilt): number {
  if (tilt === 'landscapeLeft') return 90;
  if (tilt === 'landscapeRight') return -90;
  return 0;
}

/** Follows the phone's physical orientation using the accelerometer (phones only). */
export function useDeviceTilt(enabled: boolean): Tilt {
  const [tilt, setTilt] = useState<Tilt>('portrait');

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;
    let current: Tilt = 'portrait';
    Accelerometer.setUpdateInterval(250);
    const subscription = Accelerometer.addListener((reading) => {
      const next = tiltFromAcceleration(reading, current);
      if (next !== current) {
        current = next;
        setTilt(next);
      }
    });
    return () => subscription.remove();
  }, [enabled]);

  return enabled ? tilt : 'portrait';
}
