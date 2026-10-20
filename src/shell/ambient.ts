import * as Battery from 'expo-battery';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import type { Tilt } from './tilt';

export const AMBIENT_SETTING = 'ambientMode';
export type AmbientSetting = 'on' | 'off';

export function isCharging(state: Battery.BatteryState): boolean {
  return state === Battery.BatteryState.CHARGING || state === Battery.BatteryState.FULL;
}

/**
 * Whether the phone is plugged in. Only watched where Modo Maré can appear: expo-battery's
 * own hook breaks on web, and tablets and desktops never need it.
 */
export function useCharging(enabled: boolean): boolean {
  const [charging, setCharging] = useState(false);

  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;
    let active = true;
    Battery.getBatteryStateAsync()
      .then((state) => active && setCharging(isCharging(state)))
      .catch((error: unknown) => console.warn('Could not read the battery state.', error));
    const subscription = Battery.addBatteryStateListener(({ batteryState }) =>
      setCharging(isCharging(batteryState)),
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, [enabled]);

  return enabled && charging;
}

/**
 * Modo Maré: a phone lying sideways while charging becomes an ambient display.
 * Tablets and desktops never enter it; they rotate and adapt their layout instead.
 */
export function shouldShowAmbient(input: {
  isPhone: boolean;
  tilt: Tilt;
  charging: boolean;
  setting: AmbientSetting;
  dismissed: boolean;
}): boolean {
  return (
    input.isPhone &&
    input.setting === 'on' &&
    input.charging &&
    input.tilt !== 'portrait' &&
    !input.dismissed
  );
}
