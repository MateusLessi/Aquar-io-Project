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

/** What a chart shows for the touched or hovered mark: a title and a few rows. */
export type TooltipContent = {
  title: string;
  rows: { label: string; value: string; color?: string }[];
};

const TIP = 208;

/**
 * The numbers of one mark, floating over the chart near it. It enhances, never gates: every
 * value is also in the chart's table view and in the mark's spoken label. Text stays in text
 * colors; a small key beside each row carries the series color.
 */
function Tooltip({ content, x, width }: { content: TooltipContent; x: number; width: number }) {
  const { colors } = useTheme();
  const left = Math.max(0, Math.min(width - TIP, x - TIP / 2));
  return (
    <View
      pointerEvents="none"
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[
        styles.tooltip,
        { left, backgroundColor: colors.surfacePressed, borderColor: colors.border },
      ]}
    >
      <Text variant="caption" tone="secondary">
        {content.title}
      </Text>
      {content.rows.map((row) => (
        <View key={row.label} style={styles.tipRow}>
          {row.color ? <View style={[styles.tipKey, { backgroundColor: row.color }]} /> : null}
          <Text variant="caption" tone="secondary" style={styles.tipLabel} numberOfLines={1}>
            {row.label}
          </Text>
          <Text variant="caption" style={styles.tipValue}>
            {row.value}
          </Text>
        </View>
      ))}
    </View>
  );
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
  /** The numbers shown over the chart for the touched or hovered column. */
  tooltip?: (index: number) => TooltipContent;
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
  tooltip,
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
          {selected !== null && tooltip && data[selected] ? (
            <Tooltip
              content={tooltip(selected)}
              x={left + selected * slot + slot / 2}
              width={width}
            />
          ) : null}
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
                  strokeWidth={1}
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

export type TrendLineProps = {
  /** One value per slot of the period; null where there is nothing to draw (nothing planned, or still ahead). */
  values: (number | null)[];
  /** The period before, slot by slot: a quiet line to compare with. */
  compare?: (number | null)[];
  labels: string[];
  color: string;
  /** The scale runs from 0 to `max`, with a hairline at each tick. */
  max: number;
  ticks: number[];
  format: (value: number) => string;
  height?: number;
  selected: number | null;
  onSelect: (index: number | null) => void;
  describe: (index: number) => string;
  tooltip?: (index: number) => TooltipContent;
};

/** Index runs of consecutive non-null values (a line breaks where there is nothing). */
function runsOf(values: (number | null | undefined)[]): number[][] {
  const runs: number[][] = [];
  let run: number[] = [];
  values.forEach((v, i) => {
    if (v === null || v === undefined) {
      if (run.length) runs.push(run);
      run = [];
    } else run.push(i);
  });
  if (run.length) runs.push(run);
  return runs;
}

/**
 * A measure over the period on a fixed scale (e.g. 0–100%): a 2px line over a light wash, the
 * period before as a quiet gray line, the latest value labeled at its end, and a hairline
 * crosshair with the numbers on the touched day.
 */
export function TrendLine({
  values,
  compare,
  labels,
  color,
  max,
  ticks,
  format,
  height = 190,
  selected,
  onSelect,
  describe,
  tooltip,
}: TrendLineProps) {
  const { colors } = useTheme();
  const { width, onLayout } = useWidth();
  const left = 40;
  const right = 40;
  const top = 12;
  const plot = height - LABELS - top - 6;
  const n = values.length;
  const inner = Math.max(0, width - left - right);
  const x = (i: number) => left + (n <= 1 ? inner / 2 : (i / (n - 1)) * inner);
  const y = (v: number) => top + plot - (Math.max(0, Math.min(v, max)) / max) * plot;
  const pathOf = (vals: (number | null | undefined)[]) =>
    runsOf(vals)
      .map((run) => run.map((i, k) => `${k === 0 ? 'M' : 'L'}${x(i)},${y(vals[i]!)}`).join(' '))
      .join(' ');
  const runs = runsOf(values);
  const area = runs
    .filter((run) => run.length > 1)
    .map(
      (run) =>
        `M${x(run[0]!)},${top + plot} ${run.map((i) => `L${x(i)},${y(values[i]!)}`).join(' ')} L${x(run.at(-1)!)},${top + plot} Z`,
    )
    .join(' ');
  const last = runs.at(-1)?.at(-1);
  const hit = n <= 1 ? inner : inner / (n - 1);
  const ring = colors.surfaceRaised;

  return (
    <View onLayout={onLayout} style={{ height }}>
      {width > 0 && n > 0 ? (
        <>
          <Svg width={width} height={height}>
            {ticks.map((t) => (
              <Line
                key={t}
                x1={left}
                x2={width - right + 8}
                y1={y(t)}
                y2={y(t)}
                stroke={colors.separator}
                strokeWidth={1}
              />
            ))}
            {compare ? (
              <Path
                d={pathOf(compare)}
                stroke={withAlpha(colors.textSecondary, 0.5)}
                strokeWidth={1.5}
                fill="none"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ) : null}
            {area ? <Path d={area} fill={withAlpha(color, 0.1)} /> : null}
            <Path
              d={pathOf(values)}
              stroke={color}
              strokeWidth={2}
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {/* A day alone (no neighbor to join) still shows, as a dot. */}
            {runs
              .filter((run) => run.length === 1 && run[0] !== last)
              .map((run) => (
                <Circle key={run[0]} cx={x(run[0]!)} cy={y(values[run[0]!]!)} r={3} fill={color} />
              ))}
            {selected !== null ? (
              <>
                <Line
                  x1={x(selected)}
                  x2={x(selected)}
                  y1={top}
                  y2={top + plot}
                  stroke={withAlpha(colors.textPrimary, 0.3)}
                  strokeWidth={1}
                />
                {compare?.[selected] !== null && compare?.[selected] !== undefined ? (
                  <Circle
                    cx={x(selected)}
                    cy={y(compare[selected]!)}
                    r={4}
                    fill={colors.textTertiary}
                    stroke={ring}
                    strokeWidth={2}
                  />
                ) : null}
                {values[selected] !== null && values[selected] !== undefined ? (
                  <Circle
                    cx={x(selected)}
                    cy={y(values[selected]!)}
                    r={5}
                    fill={color}
                    stroke={ring}
                    strokeWidth={2}
                  />
                ) : null}
              </>
            ) : last !== undefined ? (
              <Circle
                cx={x(last)}
                cy={y(values[last]!)}
                r={5}
                fill={color}
                stroke={ring}
                strokeWidth={2}
              />
            ) : null}
          </Svg>
          {ticks.map((t) => (
            <Text
              key={t}
              variant="caption"
              tone="tertiary"
              style={[styles.tick, { top: y(t) - 8 }]}
            >
              {format(t)}
            </Text>
          ))}
          {/* The latest value, at the end of its line (only one number on the plot). */}
          {selected === null && last !== undefined ? (
            <Text
              variant="caption"
              pointerEvents="none"
              style={[styles.endLabel, { left: x(last) + 8, top: y(values[last]!) - 8 }]}
            >
              {format(values[last]!)}
            </Text>
          ) : null}
          {values.map((_, i) => (
            <Pressable
              key={i}
              onPress={() => onSelect(selected === i ? null : i)}
              onHoverIn={() => onSelect(i)}
              accessibilityRole="button"
              accessibilityLabel={describe(i)}
              accessibilityState={{ selected: selected === i }}
              style={[styles.hit, { left: x(i) - hit / 2, width: hit, height }]}
            />
          ))}
          {labels.map((label, i) =>
            label ? (
              <Text
                key={`label-${i}`}
                variant="caption"
                tone="tertiary"
                pointerEvents="none"
                style={[styles.label, { left: x(i) - 20 }]}
              >
                {label}
              </Text>
            ) : null,
          )}
          {selected !== null && tooltip ? (
            <Tooltip content={tooltip(selected)} x={x(selected)} width={width} />
          ) : null}
        </>
      ) : null}
    </View>
  );
}

/** A tiny trend line without axes, for summary cards. Decorative: the card says the numbers. */
export function Sparkline({
  values,
  color,
  dot,
  width = 120,
  height = 40,
}: {
  values: number[];
  color: string;
  /** The latest point's color (defaults to the line's). */
  dot?: string;
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
        <Circle cx={x(values.length - 1)} cy={y(values.at(-1)!)} r={3.5} fill={dot ?? color} />
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
  endLabel: { position: 'absolute', fontVariant: ['tabular-nums'] },
  tooltip: {
    position: 'absolute',
    top: 0,
    width: TIP,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    gap: 2,
  },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  tipKey: { width: 8, height: 8, borderRadius: 2 },
  tipLabel: { flex: 1, flexShrink: 1 },
  tipValue: { flexShrink: 0, fontVariant: ['tabular-nums'] },
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
