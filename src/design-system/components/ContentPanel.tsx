import { createContext, useContext, type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { radius } from '../tokens';
import type { ThemeColors, ThemeMode } from '../tokens';

const PanelContext = createContext(false);

/** Inside the content panel: screens draw no ocean of their own (the panel is the surface). */
export const useInPanel = () => useContext(PanelContext);

/** The panel's color: the active sidebar item takes it, so the two read as one piece. */
export function panelColor(colors: ThemeColors, mode: ThemeMode): string {
  return mode === 'crystal' ? colors.surfaceRaised : colors.surfaceBase;
}

/**
 * Wider screens (Fase 5): the content sits on one large rounded panel beside the glass
 * sidebar, in a solid tone of the theme, like the reference.
 */
export function ContentPanel({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const { colors, mode } = useTheme();
  return (
    <View style={[styles.panel, { backgroundColor: panelColor(colors, mode) }, style]}>
      <PanelContext.Provider value>{children}</PanelContext.Provider>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { flex: 1, borderRadius: radius.xl * 1.4, overflow: 'hidden' },
});
