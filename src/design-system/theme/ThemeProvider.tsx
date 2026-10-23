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
import { ReduceMotion, ReducedMotionConfig } from 'react-native-reanimated';

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
  /** Effective "Reduce Transparency": the person's choice, or the OS setting. Glass becomes solid. */
  reduceTransparency: boolean;
  /** Effective "Reduce Motion": the person's choice, or the OS setting. Applies to all animations. */
  reduceMotion: boolean;
  /** The person's own choices; null follows the OS. */
  accessibility: AccessibilityChoices;
  setAccessibility: (key: keyof AccessibilityChoices, value: boolean | null) => void;
  /** Real backdrop blur is available on this platform. */
  supportsBlur: boolean;
};

export type AccessibilityChoices = {
  reduceMotion: boolean | null;
  reduceTransparency: boolean | null;
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
  initialAccessibility?: Partial<AccessibilityChoices>;
  /** Called when the user changes an accessibility choice, so the app can persist it. */
  onAccessibilityChange?: (key: keyof AccessibilityChoices, value: boolean | null) => void;
};

export function ThemeProvider({
  children,
  initialPreference = 'system',
  onPreferenceChange,
  initialAccessibility,
  onAccessibilityChange,
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
  const [accessibility, setAccessibilityState] = useState<AccessibilityChoices>({
    reduceMotion: initialAccessibility?.reduceMotion ?? null,
    reduceTransparency: initialAccessibility?.reduceTransparency ?? null,
  });
  const onAccessibilityRef = useRef(onAccessibilityChange);
  useEffect(() => {
    onAccessibilityRef.current = onAccessibilityChange;
  });
  const setAccessibility = useCallback((key: keyof AccessibilityChoices, value: boolean | null) => {
    setAccessibilityState((current) => ({ ...current, [key]: value }));
    onAccessibilityRef.current?.(key, value);
  }, []);
  const systemReduceTransparency = useAccessibilitySetting(
    AccessibilityInfo.isReduceTransparencyEnabled,
    'reduceTransparencyChanged',
    IOS_ONLY,
  );
  const systemReduceMotion = useAccessibilitySetting(
    AccessibilityInfo.isReduceMotionEnabled,
    'reduceMotionChanged',
    ALL_PLATFORMS,
  );
  const reduceMotion = accessibility.reduceMotion ?? systemReduceMotion;
  const reduceTransparency = accessibility.reduceTransparency ?? systemReduceTransparency;

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
      accessibility,
      setAccessibility,
      // Android blur needs a BlurTargetView behind each glass surface; not worth it yet.
      supportsBlur: Platform.OS === 'ios' || Platform.OS === 'web',
    }),
    [
      scheme,
      preference,
      setPreference,
      reduceTransparency,
      reduceMotion,
      accessibility,
      setAccessibility,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>
      {/* Every animation that follows the system setting follows the person's choice instead. */}
      <ReducedMotionConfig
        mode={
          accessibility.reduceMotion === null
            ? ReduceMotion.System
            : accessibility.reduceMotion
              ? ReduceMotion.Always
              : ReduceMotion.Never
        }
      />
      {children}
    </ThemeContext.Provider>
  );
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
