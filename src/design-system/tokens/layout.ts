/** 4-point spacing scale. */
export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const radius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/** Minimum touch target (Apple HIG 44pt, Material 48dp: we use 44 + hitSlop). */
export const touchTarget = 44;

/** Sizes of the app chrome (navigation surfaces). */
export const chrome = {
  /** Floating tab bar on phones: tall enough to feel substantial and easy to hit. */
  tabBarHeight: 72,
  /** Gap between the tab bar and the bottom safe area. */
  tabBarOffset: 12,
  /** Sidebar on tablets and desktop. */
  sidebarWidth: 280,
  /** Slim navigation rail on tablets in portrait and unfolded foldables. */
  railWidth: 104,
  /** Compact header that appears when a screen scrolls past its large title. */
  compactHeaderHeight: 52,
  /** Max width of reading content on wide screens. */
  contentMaxWidth: 760,
  /** Dashboards on tablets and desktop. */
  contentMaxWidthWide: 1240,
} as const;

/**
 * Width breakpoints.
 * compact: phones · medium: small tablets / landscape phones · expanded: tablets, desktop web.
 */
export const breakpoints = {
  medium: 600,
  expanded: 1024,
} as const;

export type Breakpoint = 'compact' | 'medium' | 'expanded';

export function breakpointForWidth(width: number): Breakpoint {
  if (width >= breakpoints.expanded) return 'expanded';
  if (width >= breakpoints.medium) return 'medium';
  return 'compact';
}

/**
 * Depth levels of the ocean metaphor: the deeper a layer, the more material it uses.
 * 0 content · 1 bars · 2 sheets · 3 modals/menus · 4 gamification (future).
 */
export const depth = {
  0: { blurIntensity: 0, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
  1: { blurIntensity: 60, shadowOpacity: 0.14, shadowRadius: 14, elevation: 4 },
  2: { blurIntensity: 70, shadowOpacity: 0.18, shadowRadius: 22, elevation: 8 },
  3: { blurIntensity: 85, shadowOpacity: 0.24, shadowRadius: 30, elevation: 12 },
} as const;

export type DepthLevel = keyof typeof depth;
