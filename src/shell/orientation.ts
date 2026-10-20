import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

/** Phones have a short side under 600 pt; tablets, unfolded foldables and desktops don't. */
export function isPhoneScreen(screen = Dimensions.get('screen')): boolean {
  return Math.min(screen.width, screen.height) < 600;
}

/**
 * Phones stay in portrait: the tab bar keeps its physical place and only icons turn
 * (see useDeviceTilt). Tablets, foldables and desktops rotate freely and adapt their layout.
 */
export function useOrientationPolicy() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let phone: boolean | undefined;
    const apply = () => {
      // Foldables switch screens when opened or closed, so re-check on every change.
      const next = isPhoneScreen();
      if (next === phone) return;
      phone = next;
      Promise.resolve(
        next
          ? ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP)
          : ScreenOrientation.unlockAsync(),
      ).catch((error: unknown) => console.warn('Could not apply orientation policy.', error));
    };
    apply();
    const subscription = Dimensions.addEventListener('change', apply);
    return () => subscription.remove();
  }, []);
}
