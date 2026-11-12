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
  colorsFor,
  highContrastColors,
  schemeOfMode,
  zoneWater,
  type Breakpoint,
  type ColorScheme,
  type ThemeColors,
  type ThemeMode,
  type ZoneId,
  type ZoneWater,
} from '../tokens';

export type ThemePreference = 'system' | ThemeMode;

export type Theme = {
  /** Text tone: 'dark' for Escuro and Crystal, 'light' for Claro. */
  scheme: ColorScheme;
  /** Escuro, Claro or Crystal. */
  mode: ThemeMode;
  colors: ThemeColors;
  /** The depth zone the person is in: the whole app takes its water and light. */
  zone: ZoneId;
  water: ZoneWater;
  setZone: (zone: ZoneId) => void;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  /** Effective "Reduce Transparency": the person's choice, or the OS setting. Glass becomes solid. */
  reduceTransparency: boolean;
  /** Effective "Reduce Motion": the person's choice, or the OS setting. Applies to all animations. */
  reduceMotion: boolean;
  /** Effective "Alto contraste": text and edges read more strongly. */
  highContrast: boolean;
  /** Text size multiplier chosen in Ajustes (1 = default), on top of the OS text size. */
  textScale: number;
  setTextScale: (scale: number) => void;
  /** The person's own choices; null follows the OS. */
  accessibility: AccessibilityChoices;
  setAccessibility: (key: keyof AccessibilityChoices, value: boolean | null) => void;
  /** Real backdrop blur is available on this platform. */
  supportsBlur: boolean;
};

/**
 * Whether this web page runs on Firefox's engine (Gecko). Its backdrop blur is slow enough to
 * make the whole app stutter, so glass surfaces fall back to a solid tint there.
 */
export function isGecko(userAgent: string | undefined = globalThis.navigator?.userAgent): boolean {
  return userAgent !== undefined && /\bGecko\/\d/.test(userAgent) && !/like Gecko/.test(userAgent);
}

export type AccessibilityChoices = {
  reduceMotion: boolean | null;
  reduceTransparency: boolean | null;
  highContrast: boolean | null;
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
  initialTextScale?: number;
  onTextScaleChange?: (scale: number) => void;
  initialZone?: ZoneId;
  /** Called when the zone changes, so the app can open in the right colors next time. */
  onZoneChange?: (zone: ZoneId) => void;
};

export function ThemeProvider({
  children,
  initialPreference = 'system',
  onPreferenceChange,
  initialAccessibility,
  onAccessibilityChange,
  initialTextScale = 1,
  onTextScaleChange,
  initialZone = 'surface',
  onZoneChange,
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
    highContrast: initialAccessibility?.highContrast ?? null,
  });
  const [textScale, setTextScaleState] = useState(initialTextScale);
  const onTextScaleRef = useRef(onTextScaleChange);
  useEffect(() => {
    onTextScaleRef.current = onTextScaleChange;
  });
  const setTextScale = useCallback((scale: number) => {
    setTextScaleState(scale);
    onTextScaleRef.current?.(scale);
  }, []);
  const [zone, setZoneState] = useState<ZoneId>(initialZone);
  const onZoneRef = useRef(onZoneChange);
  useEffect(() => {
    onZoneRef.current = onZoneChange;
  });
  const setZone = useCallback((next: ZoneId) => {
    setZoneState((current) => {
      if (current !== next) onZoneRef.current?.(next);
      return next;
    });
  }, []);
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
  const highContrast = accessibility.highContrast ?? false;

  const mode: ThemeMode =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;
  const scheme = schemeOfMode(mode);

  const colors = useMemo(() => {
    const base = colorsFor(mode, zone);
    return highContrast ? { ...base, ...highContrastColors[mode] } : base;
  }, [mode, zone, highContrast]);

  const value = useMemo<Theme>(
    () => ({
      scheme,
      mode,
      colors,
      zone,
      water: zoneWater[zone],
      setZone,
      preference,
      setPreference,
      reduceTransparency,
      reduceMotion,
      highContrast,
      textScale,
      setTextScale,
      accessibility,
      setAccessibility,
      // Android blur needs a BlurTargetView behind each glass surface; not worth it yet.
      // Firefox engines (Firefox, Floorp, LibreWolf…) draw backdrop blur slowly: no blur there.
      supportsBlur: Platform.OS === 'ios' || (Platform.OS === 'web' && !isGecko()),
    }),
    [
      scheme,
      mode,
      colors,
      zone,
      setZone,
      preference,
      setPreference,
      reduceTransparency,
      reduceMotion,
      highContrast,
      textScale,
      setTextScale,
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
