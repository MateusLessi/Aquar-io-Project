import { useEffect, useState, type ReactNode } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';

import { BlurView } from 'expo-blur';
import type { LucideIcon } from 'lucide-react-native';

import { Text } from './Text';
import { useTheme } from '../theme/ThemeProvider';
import { useSvgId } from '../theme/useSvgId';
import {
  abyss,
  fontFamily,
  mixHex,
  radius as radii,
  specular,
  springs,
  type ZoneWater,
} from '../tokens';
import { withAlpha } from '../utils/color';
import { RisingBubbles } from './RisingBubbles';

export type TankScene = {
  width: number;
  height: number;
  /** Y of the water surface, in points from the top of the tank. */
  waterline: number;
  /** Y of the sand, where eggs rest and creatures stop. */
  sand: number;
};

export type AquariumTankProps = {
  height: number;
  /** How full the tank is, 0–1 (the day's tide). Some water always stays in. */
  level: number;
  /** Depth marks on the side: the ruler of your depth. */
  ruler?: boolean;
  /** Crystal: the aquarium is the whole screen behind, so the tank is only a window. */
  transparent?: boolean;
  radius?: keyof typeof radii;
  /** How tall the sand is, from the bottom. Taller when chips sit on it, so nothing hides. */
  floor?: number;
  /** The creatures: drawn inside the water, given the size of the scene. */
  children?: (scene: TankScene) => ReactNode;
  /** Labels and glass chips on top of the water. */
  overlay?: ReactNode;
  accessibilityLabel?: string;
  /** When the water means progress (the tide), screen readers hear it as a progress bar. */
  progress?: { now: number; max: number };
  style?: ViewStyle;
};

const MIN_LEVEL = 0.46;
const MAX_LEVEL = 0.92;

/** The waterline for a level, clamped so the tank never looks empty or overflows. */
export function tankWaterline(height: number, level: number): number {
  const clamped = Math.min(1, Math.max(0, Number.isFinite(level) ? level : 0));
  return height * (1 - (MIN_LEVEL + clamped * (MAX_LEVEL - MIN_LEVEL)));
}

/**
 * The heart of Aquar.io: a living aquarium. The water rises with the day's tide, light comes
 * in from the top, and the creatures of your habits swim inside. In Escuro the tank lights up
 * the room around it. Decorative: the label says what the picture shows.
 */
export function AquariumTank({
  height,
  level,
  ruler = false,
  transparent = false,
  radius = 'xl',
  floor = 18,
  children,
  overlay,
  accessibilityLabel,
  progress,
  style,
}: AquariumTankProps) {
  const { water, mode, colors } = useTheme();
  const [width, setWidth] = useState(0);
  const waterline = tankWaterline(height, level);
  const top = useSharedValue(waterline);

  useEffect(() => {
    top.set(withSpring(waterline, springs.gentle));
  }, [top, waterline]);

  const waterStyle = useAnimatedStyle(() => ({ top: top.get() }));
  const borderRadius = radii[radius];

  return (
    <View
      style={[{ height }, style]}
      accessible={Boolean(accessibilityLabel)}
      accessibilityRole={progress ? 'progressbar' : accessibilityLabel ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={
        progress
          ? { min: 0, max: Math.max(progress.max, 1), now: Math.min(progress.now, progress.max) }
          : undefined
      }
      onLayout={(event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width)}
    >
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.clip,
          { borderRadius },
          transparent
            ? null
            : {
                backgroundColor:
                  mode === 'light'
                    ? mixHex(water.top, specular, 0.5)
                    : mixHex(water.bottom, abyss[950], 0.3),
                boxShadow: `0px 14px 30px 0px ${withAlpha(colors.cardShadow, mode === 'light' ? 0.2 : 0.45)}`,
              },
        ]}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        {width > 0 ? (
          <>
            {transparent ? null : (
              <Animated.View style={[styles.water, waterStyle]} pointerEvents="none">
                <WaterBody width={width} height={height} water={water} />
              </Animated.View>
            )}
            <Floor
              width={width}
              height={height}
              sand={height - floor}
              water={water}
              transparent={transparent}
            />
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              {children?.({ width, height, waterline, sand: height - floor })}
            </View>
            {transparent ? null : <RisingBubbles height={height - waterline} count={7} />}
            {ruler ? <Ruler height={height} /> : null}
          </>
        ) : null}
      </View>
      {overlay ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          {overlay}
        </View>
      ) : null}
    </View>
  );
}

/** Water from the surface down, with its sunlit top edge and rays of light. */
function WaterBody({ width, height, water }: { width: number; height: number; water: ZoneWater }) {
  const id = useSvgId('water');
  const rays = [0.16, 0.42, 0.7, 0.92];
  return (
    <Svg width={width} height={height} pointerEvents="none">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={water.top} />
          <Stop offset="0.55" stopColor={water.mid} />
          <Stop offset="1" stopColor={water.bottom} />
        </LinearGradient>
      </Defs>
      <Path
        d={`M0 6 Q${width * 0.25} -2 ${width * 0.5} 6 T${width} 6 V${height} H0Z`}
        fill={`url(#${id})`}
      />
      <Path
        d={`M0 6 Q${width * 0.25} -2 ${width * 0.5} 6 T${width} 6`}
        stroke={specular}
        strokeOpacity={0.55}
        strokeWidth={2}
        fill="none"
      />
      {rays.map((x) => (
        <Path
          key={x}
          d={`M${width * x - 14} 6 L${width * x + 16} 6 L${width * x - 40} ${height} L${width * x - 84} ${height}Z`}
          fill={specular}
          opacity={water.rays}
        />
      ))}
    </Svg>
  );
}

/** Kelp, sand and stones. In Crystal the floor is the background's, so only kelp shows. */
function Floor({
  width,
  height,
  sand,
  water,
  transparent,
}: {
  width: number;
  height: number;
  /** Y of the top of the sand. */
  sand: number;
  water: ZoneWater;
  transparent: boolean;
}) {
  const kelp: [number, number][] = [
    [0.07, 0.42],
    [0.13, 0.56],
    [0.86, 0.5],
    [0.93, 0.38],
  ];
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      {kelp.map(([x, h], k) => {
        const X = width * x;
        return (
          <Path
            key={x}
            d={`M${X} ${height} C${X - 14} ${height - height * h * 0.4} ${X + 14} ${height - height * h * 0.7} ${X - 4} ${height - height * h}`}
            stroke={water.kelp}
            strokeWidth={7 - (k % 2)}
            strokeLinecap="round"
            fill="none"
            opacity={0.9}
          />
        );
      })}
      {transparent ? null : (
        <>
          <Path
            d={`M0 ${sand + 2} Q${width * 0.3} ${sand - 10} ${width * 0.55} ${sand} T${width} ${sand - 4} V${height} H0Z`}
            fill={water.sand}
          />
          <Ellipse
            cx={width * 0.7}
            cy={sand - 2}
            rx={22}
            ry={10}
            fill={water.bottom}
            opacity={0.55}
          />
          <Ellipse
            cx={width * 0.26}
            cy={sand + 2}
            rx={14}
            ry={7}
            fill={water.bottom}
            opacity={0.5}
          />
        </>
      )}
    </Svg>
  );
}

function Ruler({ height }: { height: number }) {
  const marks = [0, 0.25, 0.5, 0.75, 1];
  return (
    <View style={[styles.ruler, { top: 56, height: height - 112 }]} pointerEvents="none">
      {marks.map((m) => (
        <View key={m} style={[styles.mark, { top: `${m * 100}%` }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  water: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  ruler: {
    position: 'absolute',
    left: 12,
    width: 2,
    borderRadius: 1,
    backgroundColor: withAlpha(specular, 0.22),
  },
  mark: {
    position: 'absolute',
    left: -3,
    width: 8,
    height: 2,
    backgroundColor: withAlpha(specular, 0.5),
  },
});

/** A dark pill on the water: depth, tide or a count. */
export function TankTag({ icon: Icon, label }: { icon?: LucideIcon; label: string }) {
  return (
    <View style={[tagStyles.tag, { backgroundColor: withAlpha(abyss[950], 0.36) }]}>
      {Icon ? <Icon size={14} color={specular} strokeWidth={2.2} /> : null}
      <Text variant="caption" style={tagStyles.tagText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** A number on frosted glass at the bottom of the tank. */
export function TankChip({ label, value, unit }: { label: string; value: string; unit: string }) {
  const { mode, colors, supportsBlur, reduceTransparency } = useTheme();
  const light = mode === 'light';
  const color = light ? colors.textPrimary : specular;
  const blur = supportsBlur && !reduceTransparency;
  return (
    <View style={tagStyles.chip}>
      {blur ? (
        <BlurView intensity={30} tint={light ? 'light' : 'dark'} style={StyleSheet.absoluteFill} />
      ) : null}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: light
              ? withAlpha(specular, blur ? 0.55 : 0.85)
              : withAlpha(abyss[950], blur ? 0.32 : 0.6),
          },
        ]}
      />
      <Text variant="caption" style={{ color, opacity: 0.85 }} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[tagStyles.value, { color }]} numberOfLines={1}>
        {value}
        <Text style={[tagStyles.unit, { color }]}> {unit}</Text>
      </Text>
    </View>
  );
}

const tagStyles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
    flexShrink: 1,
  },
  tagText: { color: specular, fontFamily: fontFamily.textBold, flexShrink: 1 },
  chip: {
    flex: 1,
    borderRadius: radii.lg - 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  value: { fontFamily: fontFamily.displayBold, fontSize: 19, letterSpacing: -0.4 },
  unit: { fontFamily: fontFamily.textMedium, fontSize: 11, opacity: 0.85 },
});
