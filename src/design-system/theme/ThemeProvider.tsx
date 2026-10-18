import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, useColorScheme, useWindowDimensions } from 'react-native';

import {
  breakpointForWidth,
  themeColors,
  type Breakpoint,
  type ColorScheme,
  type ThemeColors,
} from '../tokens';

export type ThemePreference = 'system' | ColorScheme;

export type Theme = {
  scheme: ColorScheme;
  colors: ThemeColors;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  /** OS "Reduce Transparency" (iOS). When true, glass becomes solid. */
  reduceTransparency: boolean;
  /** OS "Reduce Motion". Springs already respect it; use this for ambient effects. */
  reduceMotion: boolean;
  /** Real backdrop blur is available on this platform. */
  supportsBlur: boolean;
  /**
   * Android blur needs a BlurTargetView behind the glass. Off by default until
   * tested on real devices; toggled from Settings in development builds.
   */
  experimentalAndroidBlur: boolean;
  setExperimentalAndroidBlur: (enabled: boolean) => void;
};

const ThemeContext = createContext<Theme | null>(null);

/** Follows an OS accessibility setting and its changes. */
function useAccessibilitySetting(
  read: () => Promise<boolean>,
  event: 'reduceMotionChanged' | 'reduceTransparencyChanged',
  platforms: readonly (typeof Platform.OS)[],
): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!platforms.includes(Platform.OS)) return;
    let mounted = true;
    read().then((value) => {
      if (mounted) setEnabled(value);
    });
    const subscription = AccessibilityInfo.addEventListener(event, setEnabled);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [read, event, platforms]);

  return enabled;
}

const ALL_PLATFORMS = ['ios', 'android', 'web'] as const;
const IOS_ONLY = ['ios'] as const;

type ThemeProviderProps = {
  children: ReactNode;
  /** Initial preference. Persisting the user's choice comes with settings (TODO: Etapa 3+). */
  initialPreference?: ThemePreference;
};

export function ThemeProvider({ children, initialPreference = 'system' }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>(initialPreference);
  const [experimentalAndroidBlur, setExperimentalAndroidBlur] = useState(false);
  const reduceTransparency = useAccessibilitySetting(
    AccessibilityInfo.isReduceTransparencyEnabled,
    'reduceTransparencyChanged',
    IOS_ONLY,
  );
  const reduceMotion = useAccessibilitySetting(
    AccessibilityInfo.isReduceMotionEnabled,
    'reduceMotionChanged',
    ALL_PLATFORMS,
  );

  const scheme: ColorScheme =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo<Theme>(
    () => ({
      scheme,
      colors: themeColors[scheme],
      preference,
      setPreference,
      reduceTransparency,
      reduceMotion,
      // Android needs a BlurTargetView behind the glass; see `experimentalAndroidBlur`.
      supportsBlur: Platform.OS === 'ios' || Platform.OS === 'web',
      experimentalAndroidBlur,
      setExperimentalAndroidBlur,
    }),
    [scheme, preference, reduceTransparency, reduceMotion, experimentalAndroidBlur],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used inside <ThemeProvider>.');
  return theme;
}

export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions();
  return breakpointForWidth(width);
}
