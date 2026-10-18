import { render as rtlRender } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider, type ThemePreference } from '../theme/ThemeProvider';

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

/** Renders inside the providers every screen has: safe area + theme. */
export function renderWithTheme(ui: ReactElement, preference: ThemePreference = 'light') {
  return rtlRender(
    <SafeAreaProvider initialMetrics={metrics}>
      <ThemeProvider initialPreference={preference}>{ui}</ThemeProvider>
    </SafeAreaProvider>,
  );
}
