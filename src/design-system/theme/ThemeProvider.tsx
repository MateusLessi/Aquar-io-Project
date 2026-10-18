import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, useColorScheme, useWindowDimensions } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

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

function useReduceTransparency(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let mounted = true;
    AccessibilityInfo.isReduceTransparencyEnabled().then((value) => {
      if (mounted) setEnabled(value);
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setEnabled,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return enabled;
}

type ThemeProviderProps = {
  children: ReactNode;
  /** Initial preference. Persisting the user's choice comes with settings (TODO: Etapa 3+). */
  initialPreference?: ThemePreference;
};

export function ThemeProvider({ children, initialPreference = 'system' }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>(initialPreference);
  const reduceTransparency = useReduceTransparency();
  const reduceMotion = useReducedMotion();

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
      // Android needs a BlurTargetView per screen for real blur; evaluated in Etapa 3.
      supportsBlur: Platform.OS === 'ios' || Platform.OS === 'web',
    }),
    [scheme, preference, reduceTransparency, reduceMotion],
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
