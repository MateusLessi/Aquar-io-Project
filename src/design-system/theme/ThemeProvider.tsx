import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
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
  initialPreference?: ThemePreference;
  /** Called when the user picks a theme, so the app can persist it. */
  onPreferenceChange?: (preference: ThemePreference) => void;
};

export function ThemeProvider({
  children,
  initialPreference = 'system',
  onPreferenceChange,
}: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>(initialPreference);
  const onChangeRef = useRef(onPreferenceChange);
  useEffect(() => {
    onChangeRef.current = onPreferenceChange;
  });
  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    onChangeRef.current?.(next);
  }, []);
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
      // Android blur needs a BlurTargetView behind each glass surface; not worth it yet.
      supportsBlur: Platform.OS === 'ios' || Platform.OS === 'web',
    }),
    [scheme, preference, setPreference, reduceTransparency, reduceMotion],
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
