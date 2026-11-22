import { createContext, useContext, type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { radius } from '../tokens';
import type { ThemeColors } from '../tokens';

/** The panel's corner radius; the sidebar reaches this far under it, so no gap shows. */
export const PANEL_RADIUS = radius.xl * 1.4;

const PanelContext = createContext(false);

/** Inside the content panel: screens draw no ocean of their own (the panel is the surface). */
export const useInPanel = () => useContext(PanelContext);

/** The panel's color: the active sidebar item takes it, so the two read as one piece. */
export function panelColor(colors: ThemeColors): string {
  return colors.surfaceBase;
}

/**
 * Wider screens (Fase 5): the content sits on one large rounded panel beside the glass
 * sidebar, in a solid tone of the theme, like the reference.
 */
export function ContentPanel({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.panel, { backgroundColor: panelColor(colors) }, style]}>
      <PanelContext.Provider value>{children}</PanelContext.Provider>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { flex: 1, borderRadius: PANEL_RADIUS, overflow: 'hidden' },
});
