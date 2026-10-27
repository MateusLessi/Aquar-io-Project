import { useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';

import { useTheme } from '../theme/ThemeProvider';
import { radius, spacing } from '../tokens';
import { withAlpha } from '../utils/color';
import { Text } from './Text';

/**
 * Small charts drawn with react-native-svg, following the dataviz rules: thin marks with a
 * rounded data end on a flat base, a 2px gap between stacked parts, recessive grid, text in
 * text colors (never the series color), and a hit area per mark larger than the mark. Each
 * chart reports the touched/hovered index so the screen can show its numbers in words.
 */

const AXIS = 26;
const LABELS = 16;

/** Width of the parent, measured once laid out. */
function useWidth() {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => {
    const next = Math.round(e.nativeEvent.layout.width);
    if (next !== width) setWidth(next);
  };
  return { width, onLayout };
}

/** A bar with a rounded top (the data end) and a square base. */
function barPath(x: number, y: number, w: number, h: number, round: boolean) {
  if (h <= 0) return '';
  const r = round ? Math.min(4, h, w / 2) : 0;
  return `M${x},${y + h} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${y + h} Z`;
}

/** "0, 5, 10" style ticks for a maximum. */
function ticksFor(max: number): number[] {
  if (max <= 0) return [0];
  const step = max <= 4 ? 1 : max <= 10 ? 5 : max <= 30 ? 10 : Math.ceil(max / 3 / 10) * 10;
  const out: number[] = [];
  for (let v = 0; v <= max; v += step) out.push(v);
  return out;
}

export type ColumnsProps = {
  /** One entry per column; `values` are the stacked parts, bottom first. */
  data: { label: string; values: number[] }[];
  colors: string[];
  height?: number;
  /** Fixed maximum (e.g. 1 for rates); defaults to the tallest column. */
  max?: number;
  /** A column drawn as "today" (its label in the accent color). */
  highlight?: number;
  /** Shown above a column instead of numbers on every bar. */
  valueLabel?: (index: number) => string | null;
  selected: number | null;
  onSelect: (index: number | null) => void;
  /** Read aloud for a column. */
  describe: (index: number) => string;
  /** Hide the value axis (e.g. when a label shows the value). */
  hideAxis?: boolean;
};

/** Columns, stacked when there are several values per column. */
export function Columns({
  data,
  colors: series,
  height = 150,
  max,
  highlight,
  valueLabel,
  selected,
  onSelect,
  describe,
  hideAxis,
}: ColumnsProps) {
  const { colors } = useTheme();
  const { width, onLayout } = useWidth();
  const top = valueLabel ? 14 : 4;
  const left = hideAxis ? 0 : AXIS;
  const plot = height - LABELS - top;
  const tallest = Math.max(0, ...data.map((d) => d.values.reduce((a, b) => a + b, 0)));
  const ticks = max === undefined ? ticksFor(tallest) : [];
  const ceiling = max ?? Math.max(1, ticks.at(-1) ?? 1, tallest);
  const slot = data.length > 0 ? (width - left) / data.length : 0;
  const bar = Math.max(3, Math.min(26, slot * 0.6));
  const y = (v: number) => top + plot - (v / ceiling) * plot;

  return (
    <View onLayout={onLayout} style={{ height }}>
      {width > 0 ? (
        <>
          <Svg width={width} height={height}>
            {ticks.map((t) => (
              <Line
                key={t}
                x1={left}
                x2={width}
                y1={y(t)}
                y2={y(t)}
                stroke={colors.separator}
                strokeWidth={1}
              />
            ))}
            {data.map((d, i) => {
              const x = left + i * slot + (slot - bar) / 2;
              const parts = d.values
                .map((v, s) => ({ v, color: series[s]! }))
                .filter((p) => p.v > 0);
              let base = top + plot;
              return (
                <G key={i}>
                  {selected === i ? (
                    <Rect
                      x={x - 3}
                      y={top}
                      width={bar + 6}
                      height={plot}
                      rx={6}
                      fill={withAlpha(colors.textPrimary, 0.06)}
                    />
                  ) : null}
                  {parts.map((p, j) => {
                    const h = (p.v / ceiling) * plot;
                    base -= h;
                    // 2px gap under every part but the first.
                    return (
                      <Path
                        key={`${i}-${j}`}
                        d={barPath(x, base, bar, h - (j > 0 ? 2 : 0), j === parts.length - 1)}
                        fill={p.color}
                      />
                    );
                  })}
                </G>
              );
            })}
          </Svg>
          {ticks.length > 1 && !hideAxis
            ? ticks.map((t) => (
                <Text
                  key={t}
                  variant="caption"
                  tone="tertiary"
                  style={[styles.tick, { top: y(t) - 8 }]}
                >
                  {t}
                </Text>
              ))
            : null}
          {data.map((d, i) => {
            const value = valueLabel?.(i);
            const total = d.values.reduce((a, b) => a + b, 0);
            return (
              <Pressable
                key={i}
                onPress={() => onSelect(selected === i ? null : i)}
                onHoverIn={() => onSelect(i)}
                accessibilityRole="button"
                accessibilityLabel={describe(i)}
                accessibilityState={{ selected: selected === i }}
                style={[styles.hit, { left: left + i * slot, width: slot, height }]}
              >
                {value ? (
                  <Text
                    variant="caption"
                    tone="secondary"
                    style={[styles.valueLabel, { top: y(total) - 15, left: slot / 2 - 24 }]}
                  >
                    {value}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
          {data.map((d, i) =>
            d.label ? (
              <Text
                key={`label-${i}`}
                variant="caption"
                tone={highlight === i ? 'accent' : 'tertiary'}
                pointerEvents="none"
                style={[styles.label, { left: left + i * slot + slot / 2 - 20 }]}
              >
                {d.label}
              </Text>
            ) : null,
          )}
        </>
      ) : null}
    </View>
  );
}

export type HeatmapProps = {
  rows: string[];
  columns: string[];
  values: number[][];
  color: string;
  describe: (row: number, column: number) => string;
};

/** A grid of cells, darker for more (one hue). */
export function Heatmap({ rows, columns, values, color, describe }: HeatmapProps) {
  const { colors } = useTheme();
  const max = Math.max(1, ...values.flat());
  return (
    <View style={styles.heat}>
      {rows.map((row, r) => (
        <View key={row} style={styles.heatRow}>
          <Text variant="caption" tone="tertiary" style={styles.heatLabel} numberOfLines={1}>
            {row}
          </Text>
          {columns.map((column, c) => {
            const v = values[r]?.[c] ?? 0;
            return (
              <View
                key={c}
                accessible
                accessibilityLabel={describe(r, c)}
                style={[
                  styles.cell,
                  {
                    backgroundColor:
                      v === 0
                        ? withAlpha(colors.textSecondary, 0.08)
                        : withAlpha(color, 0.2 + (v / max) * 0.8),
                  },
                ]}
              />
            );
          })}
        </View>
      ))}
      <View style={styles.heatRow}>
        <View style={styles.heatLabel} />
        {columns.map((column, c) => (
          <Text key={c} variant="caption" tone="tertiary" style={styles.heatColumn}>
            {column}
          </Text>
        ))}
      </View>
    </View>
  );
}

export type AreaLineProps = {
  values: number[];
  labels: string[];
  color: string;
  height?: number;
  unit?: string;
  selected: number | null;
  onSelect: (index: number | null) => void;
  describe: (index: number) => string;
};

/** One series over time: a 2px line over a light area, with a crosshair on the touched point. */
export function AreaLine({
  values,
  labels,
  color,
  height = 170,
  unit = '',
  selected,
  onSelect,
  describe,
}: AreaLineProps) {
  const { colors } = useTheme();
  const { width, onLayout } = useWidth();
  const left = 44;
  const top = 8;
  const plot = height - LABELS - top;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = Math.max(1, hi - lo);
  const min = Math.max(0, lo - span * 0.1);
  const max = hi + span * 0.1;
  const x = (i: number) =>
    left + (values.length <= 1 ? 0 : (i / (values.length - 1)) * (width - left - 6));
  const y = (v: number) => top + plot - ((v - min) / Math.max(1, max - min)) * plot;
  const line = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join(' ');
  const slot = values.length > 0 ? (width - left) / values.length : 0;

  return (
    <View onLayout={onLayout} style={{ height }}>
      {width > 0 && values.length > 0 ? (
        <>
          <Svg width={width} height={height}>
            {[min, (min + max) / 2, max].map((v) => (
              <Line
                key={v}
                x1={left}
                x2={width}
                y1={y(v)}
                y2={y(v)}
                stroke={colors.separator}
                strokeWidth={1}
              />
            ))}
            <Path
              d={`${line} L${x(values.length - 1)},${top + plot} L${x(0)},${top + plot} Z`}
              fill={withAlpha(color, 0.14)}
            />
            <Path d={line} stroke={color} strokeWidth={2} fill="none" strokeLinejoin="round" />
            {selected !== null && values[selected] !== undefined ? (
              <>
                <Line
                  x1={x(selected)}
                  x2={x(selected)}
                  y1={top}
                  y2={top + plot}
                  stroke={withAlpha(colors.textPrimary, 0.35)}
                  strokeDasharray="3 3"
                />
                <Circle
                  cx={x(selected)}
                  cy={y(values[selected]!)}
                  r={5}
                  fill={color}
                  stroke={colors.surfaceRaised}
                  strokeWidth={2}
                />
              </>
            ) : (
              <Circle cx={x(values.length - 1)} cy={y(values.at(-1)!)} r={4} fill={color} />
            )}
          </Svg>
          {[min, max].map((v) => (
            <Text
              key={v}
              variant="caption"
              tone="tertiary"
              style={[styles.tick, { top: y(v) - 8 }]}
            >
              {Math.round(v)}
              {unit}
            </Text>
          ))}
          {values.map((_, i) => (
            <Pressable
              key={i}
              onPress={() => onSelect(selected === i ? null : i)}
              onHoverIn={() => onSelect(i)}
              accessibilityRole="button"
              accessibilityLabel={describe(i)}
              style={[styles.hit, { left: left + i * slot, width: slot, height }]}
            />
          ))}
          {labels.map((label, i) =>
            label ? (
              <Text
                key={`label-${i}`}
                variant="caption"
                tone="tertiary"
                pointerEvents="none"
                style={[styles.label, { left: left + i * slot + slot / 2 - 20 }]}
              >
                {label}
              </Text>
            ) : null,
          )}
        </>
      ) : null}
    </View>
  );
}

/** A tiny trend line without axes, for summary cards. Decorative: the card says the numbers. */
export function Sparkline({
  values,
  color,
  width = 120,
  height = 40,
}: {
  values: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (values.length < 2) return null;
  const max = Math.max(1, ...values);
  const x = (i: number) => 4 + (i / (values.length - 1)) * (width - 8);
  const y = (v: number) => height - 4 - (v / max) * (height - 8);
  const line = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(v)}`).join(' ');
  return (
    <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      <Svg width={width} height={height}>
        <Path d={line} stroke={color} strokeWidth={2} fill="none" strokeLinejoin="round" />
        <Circle cx={x(values.length - 1)} cy={y(values.at(-1)!)} r={3.5} fill={color} />
      </Svg>
    </View>
  );
}

/** Colored key for two or more series: identity is never color alone. */
export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <View style={styles.legend}>
      {items.map((item) => (
        <View key={item.label} style={styles.legendItem}>
          <View style={[styles.swatch, { backgroundColor: item.color }]} />
          <Text variant="caption" tone="secondary">
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tick: { position: 'absolute', left: 0, fontVariant: ['tabular-nums'] },
  hit: { position: 'absolute', top: 0, overflow: 'visible' },
  // Wider than a thin column, so day numbers never get cut.
  label: { position: 'absolute', bottom: 0, width: 40, textAlign: 'center' },
  valueLabel: {
    position: 'absolute',
    width: 48,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  heat: { gap: 3 },
  heatRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  heatLabel: { width: 74 },
  cell: { flex: 1, height: 22, borderRadius: radius.sm },
  heatColumn: { flex: 1, textAlign: 'center' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  swatch: { width: 9, height: 9, borderRadius: 3 },
});
