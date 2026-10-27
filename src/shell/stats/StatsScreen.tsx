import { router } from 'expo-router';
import { BarChart3, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { fromDateKey, toDateKey } from '@/core/dates';
import { useSetting } from '@/core/settings/useSetting';
import {
  AreaLine,
  Button,
  Columns,
  EmptyState,
  Heatmap,
  IconButton,
  Legend,
  Screen,
  SegmentedControl,
  Text,
  chartColors,
  listColors,
  radius,
  spacing,
  useBreakpoint,
  useTheme,
  withAlpha,
} from '@/design-system';
import { creatures } from '@/features/habits/domain/creatures';
import { useHabits } from '@/features/habits/hooks/queries';

import { DAY_PARTS, periodOf, shiftPeriod, type Stats, type StatsMode } from './computeStats';
import { useStats } from './useStats';

const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];
const LETTERS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const DAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MODE_SETTING = 'stats.mode';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function periodLabel(mode: StatsMode, from: string, to: string) {
  const a = fromDateKey(from);
  const b = fromDateKey(to);
  if (mode === 'month')
    return `${MONTHS[a.getMonth()]![0]!.toUpperCase()}${MONTHS[a.getMonth()]!.slice(1)} de ${a.getFullYear()}`;
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()} – ${b.getDate()} de ${MONTHS[a.getMonth()]}`
    : `${a.getDate()} de ${MONTHS[a.getMonth()]} – ${b.getDate()} de ${MONTHS[b.getMonth()]}`;
}

const dayTitle = (key: string) => {
  const d = fromDateKey(key);
  return `${DAY_NAMES[d.getDay()]}, ${d.getDate()}`;
};

/**
 * Statistics for a week or a month: what got done (tasks, habits, routine items), how much of
 * the planned, when in the day, by weekday, depth over time, and a table per habit and routine.
 * Everything comes from what was really marked in the app.
 */
export function StatsScreen() {
  const [storedMode, setMode] = useSetting<StatsMode>(MODE_SETTING, 'week');
  const mode: StatsMode = storedMode === 'month' ? 'month' : 'week';
  const [anchor, setAnchor] = useState(() => toDateKey(new Date()));
  const period = periodOf(mode, anchor);
  const { data } = useStats(period);
  const today = toDateKey(new Date());
  const current = period.from <= today && today <= period.to;
  const back = () => (router.canGoBack() ? router.back() : router.replace('/profile'));

  return (
    <Screen
      title="Estatísticas"
      onBack={back}
      wide
      accessory={
        <View style={styles.accessory}>
          <SegmentedControl
            accessibilityLabel="Período"
            options={[
              { value: 'week', label: 'Semana' },
              { value: 'month', label: 'Mês' },
            ]}
            value={mode}
            onChange={(value) => void setMode(value)}
          />
          <View style={styles.nav}>
            <IconButton
              icon={ChevronLeft}
              label={mode === 'week' ? 'Semana anterior' : 'Mês anterior'}
              onPress={() => setAnchor(shiftPeriod(period, -1).from)}
            />
            <Text variant="headline" style={styles.navLabel} accessibilityRole="header">
              {periodLabel(mode, period.from, period.to)}
            </Text>
            <IconButton
              icon={ChevronRight}
              label={mode === 'week' ? 'Próxima semana' : 'Próximo mês'}
              onPress={() => setAnchor(shiftPeriod(period, 1).from)}
            />
            {!current ? (
              <Button label="Hoje" variant="ghost" onPress={() => setAnchor(today)} />
            ) : null}
          </View>
        </View>
      }
    >
      {data ? <StatsBody stats={data.current} previous={data.previous} /> : null}
    </Screen>
  );
}

function StatsBody({ stats, previous }: { stats: Stats; previous: Stats }) {
  const wide = useBreakpoint() !== 'compact';
  const { data: habits = [] } = useHabits();
  const nothing =
    stats.totals.all === 0 &&
    stats.planned.due === 0 &&
    stats.habitRows.length === 0 &&
    stats.routineRows.length === 0;
  if (nothing) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Seus números aparecem aqui"
        message="Conclua tarefas, marque hábitos e itens de rotina: a cada dia, este mar de gráficos se enche com o que você fez de verdade."
      />
    );
  }
  const unit = stats.period.mode === 'week' ? 'semana passada' : 'mês passado';
  const delta = stats.totals.all - previous.totals.all;
  const best = habits.reduce<(typeof habits)[number] | null>(
    (top, h) => (h.streak > (top?.streak ?? 0) ? h : top),
    null,
  );
  const rate =
    stats.planned.due > 0 ? Math.round((stats.planned.done / stats.planned.due) * 100) : null;
  const gained = stats.depth.end - stats.depth.start;

  return (
    <View style={styles.body}>
      <View style={[styles.kpis, wide && styles.kpisWide]}>
        <Kpi
          label="Concluídos"
          value={String(stats.totals.all)}
          note={`${delta > 0 ? '▲' : delta < 0 ? '▼' : '='} ${Math.abs(delta)} vs. ${unit}`}
          wide={wide}
        />
        <Kpi
          label="Do planejado"
          value={rate === null ? '—' : `${rate}%`}
          note={
            stats.planned.due > 0
              ? `${stats.planned.done} de ${stats.planned.due} de hábitos e rotinas`
              : 'nada planejado ainda'
          }
          wide={wide}
        />
        <Kpi
          label="Maior sequência"
          value={best ? plural(best.streak, 'dia', 'dias') : '—'}
          note={best ? `${creatures[best.creature].emoji} ${best.name}` : 'marque um hábito hoje'}
          wide={wide}
        />
        <Kpi
          label="Profundidade"
          value={`+${gained} m`}
          note={`agora ${stats.depth.end} m`}
          wide={wide}
        />
      </View>
      <View style={[styles.grid, wide && styles.gridWide]}>
        <ByDayCard stats={stats} wide={wide} />
        <DepthCard stats={stats} wide={wide} />
        {stats.period.mode === 'month' ? <CalendarCard stats={stats} /> : null}
        <WeekdayCard stats={stats} />
        <HoursCard stats={stats} />
        {stats.habitRows.length > 0 ? <HabitsCard stats={stats} /> : null}
        {stats.routineRows.length > 0 ? <RoutinesCard stats={stats} /> : null}
      </View>
    </View>
  );
}

function Kpi({
  label,
  value,
  note,
  wide,
}: {
  label: string;
  value: string;
  note: string;
  wide: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}. ${note}`}
      style={[
        styles.kpi,
        wide && styles.kpiWide,
        { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
      ]}
    >
      <Text variant="overline" tone="tertiary">
        {label}
      </Text>
      <Text variant="title1" style={styles.kpiValue}>
        {value}
      </Text>
      <Text variant="caption" tone="secondary" numberOfLines={2}>
        {note}
      </Text>
    </View>
  );
}

function Card({
  title,
  children,
  action,
  span,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  /** On wide screens, take the whole row. */
  span?: boolean;
}) {
  const { colors } = useTheme();
  const wide = useBreakpoint() !== 'compact';
  return (
    <View
      style={[
        styles.card,
        wide && (span ? styles.cardFull : styles.cardHalf),
        { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text variant="overline" tone="tertiary" accessibilityRole="header" style={styles.flex}>
          {title}
        </Text>
        {action}
      </View>
      {children}
    </View>
  );
}

function TableToggle({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  return (
    <Button
      label={on ? 'Ver gráfico' : 'Ver como tabela'}
      variant="ghost"
      onPress={() => onChange(!on)}
    />
  );
}

function Table({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  const { colors } = useTheme();
  return (
    <View>
      <View style={[styles.tr, { borderBottomColor: colors.separator }]}>
        {head.map((h, i) => (
          <Text key={h} variant="caption" tone="tertiary" style={[styles.td, i > 0 && styles.num]}>
            {h}
          </Text>
        ))}
      </View>
      {rows.map((row, r) => (
        <View key={r} style={[styles.tr, { borderBottomColor: colors.separator }]}>
          {row.map((cell, i) => (
            <Text
              key={i}
              variant="footnote"
              numberOfLines={1}
              style={[styles.td, i > 0 && styles.num]}
            >
              {cell}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function useSeries() {
  const { scheme } = useTheme();
  return [
    { label: 'Tarefas', color: chartColors.tasks[scheme] },
    { label: 'Hábitos', color: chartColors.habits[scheme] },
    { label: 'Rotinas', color: chartColors.routines[scheme] },
  ];
}

function describeDay(d: Stats['byDay'][number]) {
  if (d.future) return `${dayTitle(d.day)}: ainda não chegou`;
  return `${dayTitle(d.day)}: ${plural(d.tasks, 'tarefa', 'tarefas')}, ${plural(d.habits, 'hábito', 'hábitos')}, ${plural(d.routines, 'item de rotina', 'itens de rotina')}`;
}

function ByDayCard({ stats, wide }: { stats: Stats; wide: boolean }) {
  const series = useSeries();
  const [selected, setSelected] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const today = toDateKey(new Date());
  const week = stats.period.mode === 'week';
  const picked = selected !== null ? stats.byDay[selected] : undefined;
  return (
    <Card
      title="Concluídos por dia"
      span={!wide || !week}
      action={<TableToggle on={table} onChange={setTable} />}
    >
      {table ? (
        <Table
          head={['Dia', 'Tarefas', 'Hábitos', 'Rotinas']}
          rows={stats.byDay
            .filter((d) => !d.future)
            .map((d) => [dayTitle(d.day), d.tasks, d.habits, d.routines])}
        />
      ) : (
        <>
          <Legend items={series} />
          <Text variant="footnote" tone="secondary" accessibilityLiveRegion="polite">
            {picked ? describeDay(picked) : 'Toque numa coluna para ver os números.'}
          </Text>
          <Columns
            data={stats.byDay.map((d, i) => ({
              label: week
                ? LETTERS[fromDateKey(d.day).getDay()]!
                : i % 5 === 0 || i === stats.byDay.length - 1
                  ? String(i + 1)
                  : '',
              values: [d.tasks, d.habits, d.routines],
            }))}
            colors={series.map((s) => s.color)}
            highlight={stats.byDay.findIndex((d) => d.day === today)}
            selected={selected}
            onSelect={setSelected}
            describe={(i) => describeDay(stats.byDay[i]!)}
            height={170}
          />
        </>
      )}
    </Card>
  );
}

function DepthCard({ stats, wide }: { stats: Stats; wide: boolean }) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<number | null>(null);
  const points = stats.depth.byDay;
  const picked = selected !== null ? points[selected] : undefined;
  const week = stats.period.mode === 'week';
  if (points.length === 0) return null;
  return (
    <Card title="Profundidade" span={!wide || !week}>
      <Text variant="footnote" tone="secondary" accessibilityLiveRegion="polite">
        {picked
          ? `${dayTitle(picked.day)}: ${picked.meters} m`
          : `De ${stats.depth.start} m para ${stats.depth.end} m neste período.`}
      </Text>
      <AreaLine
        values={points.map((p) => p.meters)}
        labels={points.map((p, i) =>
          week
            ? LETTERS[fromDateKey(p.day).getDay()]!
            : i % 7 === 0
              ? String(fromDateKey(p.day).getDate())
              : '',
        )}
        color={colors.accent}
        unit=" m"
        selected={selected}
        onSelect={setSelected}
        describe={(i) => `${dayTitle(points[i]!.day)}: ${points[i]!.meters} metros`}
      />
    </Card>
  );
}

function CalendarCard({ stats }: { stats: Stats }) {
  const { colors } = useTheme();
  const today = toDateKey(new Date());
  const offset = fromDateKey(stats.period.from).getDay();
  const full = stats.byDay.filter((d) => d.fullTide).length;
  const cells: (Stats['byDay'][number] | null)[] = [
    ...Array<null>(offset).fill(null),
    ...stats.byDay,
  ];
  return (
    <Card title={`Dias de maré cheia · ${full}`}>
      <View style={styles.calRow}>
        {LETTERS.map((l, i) => (
          <Text key={i} variant="caption" tone="tertiary" style={styles.calHead}>
            {l}
          </Text>
        ))}
      </View>
      <View style={styles.calGrid}>
        {cells.map((d, i) =>
          d ? (
            <View
              key={d.day}
              accessible
              accessibilityLabel={`${dayTitle(d.day)}: ${d.future ? 'ainda não chegou' : `${d.points} pontos${d.fullTide ? ', maré cheia' : ''}`}`}
              style={[
                styles.calCell,
                {
                  backgroundColor: d.future
                    ? withAlpha(colors.textSecondary, 0.05)
                    : withAlpha(colors.accent, 0.12 + Math.min(1, d.points / 150) * 0.78),
                  borderColor: d.day === today ? colors.textPrimary : 'transparent',
                },
              ]}
            >
              <Text
                variant="caption"
                style={{ color: d.points > 80 ? colors.onAccent : colors.textSecondary }}
              >
                {fromDateKey(d.day).getDate()}
                {d.fullTide ? ' 🌊' : ''}
              </Text>
            </View>
          ) : (
            <View key={`gap-${i}`} style={[styles.calCell, styles.calGap]} />
          ),
        )}
      </View>
    </Card>
  );
}

function WeekdayCard({ stats }: { stats: Stats }) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<number | null>(null);
  const rates = stats.weekdayRate;
  if (rates.every((r) => r === null)) return null;
  const pct = (r: number | null) => (r === null ? '—' : `${Math.round(r * 100)}%`);
  const best = rates.reduce<number>((b, r, i) => ((r ?? -1) > (rates[b] ?? -1) ? i : b), 0);
  return (
    <Card title="Do planejado, por dia da semana">
      <Columns
        data={rates.map((r, i) => ({ label: DAY_SHORT[i]!, values: [r ?? 0] }))}
        colors={[colors.accent]}
        max={1}
        hideAxis
        valueLabel={(i) => (i === best || i === selected ? pct(rates[i]!) : null)}
        selected={selected}
        onSelect={setSelected}
        describe={(i) =>
          rates[i] === null
            ? `${DAY_NAMES[i]}: nada planejado`
            : `${DAY_NAMES[i]}: ${pct(rates[i]!)} do planejado`
        }
        height={140}
      />
    </Card>
  );
}

function HoursCard({ stats }: { stats: Stats }) {
  const { scheme } = useTheme();
  if (stats.totals.all === 0) return null;
  return (
    <Card title="Quando você mais conclui">
      <Heatmap
        rows={DAY_PARTS.map((p) => p.label)}
        columns={LETTERS}
        values={stats.hours}
        color={listColors.lagoon[scheme]}
        describe={(r, c) =>
          `${DAY_NAMES[c]}, ${DAY_PARTS[r]!.label.toLowerCase()}: ${plural(stats.hours[r]![c]!, 'coisa', 'coisas')}`
        }
      />
    </Card>
  );
}

function Meter({ ratio }: { ratio: number }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.meter, { backgroundColor: withAlpha(colors.accent, 0.18) }]}>
      <View
        style={[
          styles.meterFill,
          { width: `${Math.round(ratio * 100)}%`, backgroundColor: colors.accent },
        ]}
      />
    </View>
  );
}

function HabitsCard({ stats }: { stats: Stats }) {
  const { colors } = useTheme();
  return (
    <Card title="Hábitos">
      {stats.habitRows.map((h) => (
        <View
          key={h.id}
          accessible
          accessibilityLabel={`${h.name}: ${h.done} de ${h.due} dias planejados${h.total > h.done ? `, ${h.total} no total` : ''}`}
          style={[styles.row, { borderBottomColor: colors.separator }]}
        >
          <Text variant="callout" numberOfLines={1} style={styles.flex}>
            {creatures[h.creature].emoji} {h.name}
          </Text>
          <Text variant="footnote" tone="secondary" style={styles.num}>
            {h.done} de {h.due}
          </Text>
          <Meter ratio={h.due > 0 ? Math.min(1, h.done / h.due) : 0} />
        </View>
      ))}
    </Card>
  );
}

function RoutinesCard({ stats }: { stats: Stats }) {
  const { colors } = useTheme();
  return (
    <Card title="Rotinas">
      {stats.routineRows.map((r) => (
        <View
          key={r.id}
          accessible
          accessibilityLabel={`${r.name}: ${r.itemsDone} de ${r.itemsDue} itens, ${r.fullDays} de ${r.days} dias completos`}
          style={[styles.row, { borderBottomColor: colors.separator }]}
        >
          <View style={styles.flex}>
            <Text variant="callout" numberOfLines={1}>
              {r.emoji ? `${r.emoji} ` : ''}
              {r.name}
            </Text>
            <Text variant="caption" tone="tertiary" numberOfLines={1}>
              {[r.tag, `${r.fullDays} de ${r.days} dias completos`].filter(Boolean).join(' · ')}
            </Text>
          </View>
          <Text variant="footnote" tone="secondary" style={styles.num}>
            {r.itemsDone} de {r.itemsDue}
          </Text>
          <Meter ratio={r.itemsDue > 0 ? r.itemsDone / r.itemsDue : 0} />
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  accessory: { flex: 1, gap: spacing.sm },
  nav: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  navLabel: { flex: 1, textAlign: 'center' },
  body: { gap: spacing.lg },
  kpis: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  kpisWide: { flexWrap: 'nowrap' },
  kpi: {
    flexBasis: '48%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 2,
  },
  kpiWide: { flexBasis: 0 },
  kpiValue: { fontVariant: ['tabular-nums'] },
  grid: { gap: spacing.md },
  gridWide: { flexDirection: 'row', flexWrap: 'wrap' },
  card: { borderWidth: 1, borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm },
  cardHalf: { flexBasis: '48%', flexGrow: 1 },
  cardFull: { flexBasis: '100%', flexGrow: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', minHeight: 32 },
  flex: { flex: 1 },
  tr: {
    flexDirection: 'row',
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  td: { flex: 1 },
  num: { textAlign: 'right', fontVariant: ['tabular-nums'] },
  calRow: { flexDirection: 'row' },
  calHead: { width: `${100 / 7}%`, textAlign: 'center' },
  calGap: { borderColor: 'transparent' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: {
    width: `${100 / 7 - 1}%`,
    margin: '0.5%',
    aspectRatio: 1.3,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    padding: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  meter: { width: 64, height: 6, borderRadius: radius.pill, overflow: 'hidden' },
  meterFill: { height: '100%', borderRadius: radius.pill },
});
