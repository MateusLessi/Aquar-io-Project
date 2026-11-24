import { useRouter } from 'expo-router';
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Equal,
  Sparkles,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { fromDateKey, leadingBlanks, toDateKey, weekdayOrder } from '@/core/dates';
import { useCalendarPrefs } from '@/core/preferences/calendarPrefs';
import { useSetting } from '@/core/settings/useSetting';
import {
  Button,
  Columns,
  EmptyState,
  Surface,
  Heatmap,
  IconButton,
  Legend,
  Screen,
  SegmentedControl,
  Sparkline,
  Text,
  TrendLine,
  chartColors,
  fontFamily,
  radius,
  spacing,
  useBreakpoint,
  useCountUpText,
  useTheme,
  withAlpha,
  type TooltipContent,
} from '@/design-system';
import { CreatureArt } from '@/features/habits/components/CreatureArt';
import { useHabits } from '@/features/habits/hooks/queries';

import { DAY_PARTS, periodOf, shiftPeriod, type Stats, type StatsMode } from './computeStats';
import { consistency } from './ConsistencyCard';
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
 * Statistics for a week or a month (Fase 6): the consistency leads, as one big number over its
 * line day by day, against the period before; then three figures, what got done by day and
 * kind, a table per habit and per routine, the weekdays and the hours. Every chart has a table
 * or a spoken label with its numbers. Everything comes from what was really marked in the app.
 */
export function StatsScreen() {
  const [storedMode, setMode] = useSetting<StatsMode>(MODE_SETTING, 'week');
  const mode: StatsMode = storedMode === 'month' ? 'month' : 'week';
  const [anchor, setAnchor] = useState(() => toDateKey(new Date()));
  const { weekStart } = useCalendarPrefs();
  const period = periodOf(mode, anchor, weekStart);
  const { data } = useStats(period);
  const today = toDateKey(new Date());
  const current = period.from <= today && today <= period.to;

  return (
    <Screen
      title="Estatísticas"
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
  const week = stats.period.mode === 'week';
  // Nothing done yet, ever (as far as this and the last period and the habits tell).
  const firstTime =
    stats.totals.all === 0 && previous.totals.all === 0 && habits.every((h) => h.daysDone === 0);
  const startTitle = firstTime
    ? week
      ? 'Sua primeira semana começa agora'
      : 'Seu primeiro mês começa agora'
    : week
      ? 'Nada concluído nesta semana ainda'
      : 'Nada concluído neste mês ainda';
  if (nothing) {
    return (
      <EmptyState title={startTitle} message="Conclua algo hoje e os gráficos começam a encher." />
    );
  }
  const done = stats.totals.all > 0;

  return (
    <View style={styles.body}>
      {/* Nothing done in the period: a line on what to do instead of charts of zeros. */}
      {done ? <ProgressCard stats={stats} previous={previous} /> : <StartCard title={startTitle} />}
      {done ? <Figures stats={stats} previous={previous} /> : null}
      <View style={[styles.grid, wide && styles.gridWide]}>
        {done ? <DoneCard stats={stats} /> : null}
        {done && !week ? <MonthCard stats={stats} /> : null}
        {stats.habitRows.length > 0 ? <HabitsTable stats={stats} /> : null}
        {stats.routineRows.length > 0 ? <RoutinesTable stats={stats} /> : null}
        {done ? <WeekdayCard stats={stats} /> : null}
        {done ? <HoursCard stats={stats} /> : null}
      </View>
    </View>
  );
}

function StartCard({ title }: { title: string }) {
  const { colors } = useTheme();
  return (
    <Surface style={styles.start}>
      <View style={[styles.startIcon, { backgroundColor: colors.accentSoft }]}>
        <Sparkles size={22} strokeWidth={2} color={colors.accent} />
      </View>
      <View style={styles.flex}>
        <Text variant="headline">{title}</Text>
        <Text variant="callout" tone="secondary">
          Conclua algo hoje e os gráficos começam a encher.
        </Text>
      </View>
    </Surface>
  );
}

const pct = (v: number | null | undefined) =>
  v === null || v === undefined ? '—' : `${Math.round(v * 100)}%`;
const dayRate = (d: Stats['byDay'][number]) => (d.due > 0 ? Math.min(1, d.kept / d.due) : null);
/** Day numbers under a month's chart: the 1st, every 5th and the last. */
const monthLabel = (i: number, n: number) =>
  i === 0 || (i + 1) % 5 === 0 || i === n - 1 ? String(i + 1) : '';

/**
 * The lead: the period's consistency (how much of the planned habits and routine items got
 * done) as one big number, and its line day by day against the period before.
 */
function ProgressCard({ stats, previous }: { stats: Stats; previous: Stats }) {
  const { colors } = useTheme();
  const wide = useBreakpoint() !== 'compact';
  const [selected, setSelected] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const week = stats.period.mode === 'week';
  const rate = consistency(stats.planned);
  const before = consistency(previous.planned);
  const percent = rate === null ? null : Math.round(rate * 100);
  const last = before === null ? null : Math.round(before * 100);
  const shown = useCountUpText(percent === null ? '—' : `${percent}%`);
  const title = week ? 'Consistência da semana' : 'Consistência do mês';
  const now = week ? 'Esta semana' : 'Este mês';
  const then = week ? 'Semana passada' : 'Mês passado';
  const sentence =
    rate === null
      ? week
        ? 'Nada planejado ainda nesta semana'
        : 'Nada planejado ainda neste mês'
      : `${stats.planned.done} de ${stats.planned.due} hábitos e rotinas feitos`;
  const lastPeriod = week ? 'a semana passada' : 'o mês passado';
  const said =
    percent === null || last === null
      ? null
      : percent > last
        ? `Melhor que ${lastPeriod}, que foi ${last}%`
        : percent === last
          ? week
            ? 'Igual à semana passada'
            : 'Igual ao mês passado'
          : `${week ? 'A semana passada' : 'O mês passado'} foi ${last}%`;
  const values = stats.byDay.map((d) => (d.future ? null : dayRate(d)));
  const compare = stats.byDay.map((_, i) => {
    const d = previous.byDay[i];
    return d ? dayRate(d) : null;
  });
  const labels = stats.byDay.map((d, i) =>
    week ? LETTERS[fromDateKey(d.day).getDay()]! : monthLabel(i, stats.byDay.length),
  );
  const describe = (i: number) => {
    const d = stats.byDay[i]!;
    if (d.future) return `${dayTitle(d.day)}: ainda não chegou`;
    if (d.due === 0) return `${dayTitle(d.day)}: nada planejado`;
    return `${dayTitle(d.day)}: ${pct(values[i])}, ${d.kept} de ${d.due} feitos. ${then}: ${pct(compare[i])}`;
  };
  const tooltip = (i: number): TooltipContent => {
    const d = stats.byDay[i]!;
    return {
      title: dayTitle(d.day),
      rows: [
        {
          label: now,
          value: d.future
            ? '—'
            : d.due === 0
              ? 'nada planejado'
              : `${pct(values[i])} · ${d.kept}/${d.due}`,
          color: colors.accent,
        },
        { label: then, value: pct(compare[i]), color: colors.textTertiary },
      ],
    };
  };
  const Arrow =
    percent === null || last === null
      ? null
      : percent > last
        ? ArrowUp
        : percent < last
          ? ArrowDown
          : Equal;

  return (
    <View style={[styles.card, styles.lead, { backgroundColor: colors.surfaceRaised }]}>
      <View style={[styles.leadHead, wide && styles.leadHeadWide]}>
        <View
          style={styles.flex}
          accessible
          accessibilityLabel={[percent === null ? title : `${title}: ${percent}%`, sentence, said]
            .filter(Boolean)
            .join('. ')}
        >
          <Text variant="callout" tone="secondary">
            {title}
          </Text>
          <Text style={[styles.hero, { color: colors.textPrimary }]}>{shown}</Text>
          <Text variant="callout" tone="secondary">
            {sentence}
          </Text>
        </View>
        <View style={[styles.leadSide, wide && styles.leadSideWide]}>
          {Arrow && last !== null ? (
            <View style={styles.delta}>
              <Arrow
                size={14}
                strokeWidth={2.6}
                color={percent! > last ? colors.accent : colors.textTertiary}
              />
              <Text variant="footnote" tone="secondary">
                {then}: {last}%
              </Text>
            </View>
          ) : null}
          {/* The period before joins the legend only when it has a line to show. */}
          <Legend
            items={[
              { label: now, color: colors.accent },
              ...(compare.some((v) => v !== null)
                ? [{ label: then, color: withAlpha(colors.textSecondary, 0.5) }]
                : []),
            ]}
          />
        </View>
      </View>
      {table ? (
        <Table
          head={['Dia', 'Planejado', 'Feito', '%']}
          rows={stats.byDay
            .filter((d) => !d.future)
            .map((d) => [dayTitle(d.day), d.due, d.kept, pct(dayRate(d))])}
        />
      ) : (
        <TrendLine
          values={values}
          compare={compare}
          labels={labels}
          color={colors.accent}
          max={1}
          ticks={[0, 0.5, 1]}
          format={(v) => `${Math.round(v * 100)}%`}
          height={wide ? 220 : 190}
          selected={selected}
          onSelect={setSelected}
          describe={describe}
          tooltip={tooltip}
        />
      )}
      <View style={styles.cardFoot}>
        <TableToggle on={table} onChange={setTable} />
      </View>
    </View>
  );
}

/** Three figures under the lead: what got done, the days with everything done, the streak. */
function Figures({ stats, previous }: { stats: Stats; previous: Stats }) {
  const { colors } = useTheme();
  const wide = useBreakpoint() !== 'compact';
  const { data: habits = [] } = useHabits();
  const week = stats.period.mode === 'week';
  const delta = stats.totals.all - previous.totals.all;
  const daily = stats.byDay.filter((d) => !d.future).map((d) => d.tasks + d.habits + d.routines);
  const planned = stats.byDay.filter((d) => !d.future && d.due > 0);
  const full = planned.filter((d) => d.kept >= d.due).length;
  const best = habits.reduce<(typeof habits)[number] | null>(
    (top, h) => (h.streak > (top?.streak ?? 0) ? h : top),
    null,
  );
  return (
    <View style={[styles.figures, wide && styles.figuresWide]}>
      <Figure
        label="Concluídos"
        value={String(stats.totals.all)}
        note={`${delta > 0 ? '+' : delta < 0 ? '−' : '±'}${Math.abs(delta)} vs. ${week ? 'semana' : 'mês'} passad${week ? 'a' : 'o'}`}
      >
        <Sparkline
          values={daily}
          color={withAlpha(colors.textSecondary, 0.45)}
          dot={colors.accent}
          width={wide ? 120 : 84}
          height={30}
        />
      </Figure>
      <Figure
        label="Dias com tudo feito"
        value={String(full)}
        note={
          planned.length > 0
            ? `de ${plural(planned.length, 'dia', 'dias')} com plano`
            : 'nada planejado ainda'
        }
      />
      <Figure
        label="Maior sequência"
        value={best ? plural(best.streak, 'dia', 'dias') : '—'}
        note={best ? best.name : 'marque um hábito hoje'}
      />
    </View>
  );
}

function Figure({
  label,
  value,
  note,
  children,
}: {
  label: string;
  value: string;
  note: string;
  children?: React.ReactNode;
}) {
  const { colors } = useTheme();
  // The number counts up to its value (Fase 5); the label already says the final one.
  const shown = useCountUpText(value);
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}. ${note}`}
      style={[styles.figure, { backgroundColor: colors.surfaceRaised }]}
    >
      <Text variant="footnote" tone="secondary" numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.figureRow}>
        <Text style={[styles.figureValue, { color: colors.textPrimary }]} numberOfLines={1}>
          {shown}
        </Text>
        {children}
      </View>
      <Text variant="caption" tone="tertiary" numberOfLines={1}>
        {note}
      </Text>
    </View>
  );
}

function Card({
  title,
  subtitle,
  children,
  action,
  span,
}: {
  title: string;
  subtitle?: string;
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
        { backgroundColor: colors.surfaceRaised },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.flex}>
          <Text variant="headline" accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? (
            <Text variant="footnote" tone="tertiary">
              {subtitle}
            </Text>
          ) : null}
        </View>
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

/** What got done each day, stacked by kind, with each kind's total in the legend. */
function DoneCard({ stats }: { stats: Stats }) {
  const series = useSeries();
  const [selected, setSelected] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const today = toDateKey(new Date());
  const week = stats.period.mode === 'week';
  const totals = [stats.totals.tasks, stats.totals.habits, stats.totals.routines];
  return (
    <Card
      title="O que você concluiu"
      subtitle="Por dia, de cada tipo"
      span
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
          <Legend items={series.map((s, i) => ({ ...s, label: `${s.label} · ${totals[i]}` }))} />
          <Columns
            data={stats.byDay.map((d, i) => ({
              label: week
                ? LETTERS[fromDateKey(d.day).getDay()]!
                : monthLabel(i, stats.byDay.length),
              values: [d.tasks, d.habits, d.routines],
            }))}
            colors={series.map((s) => s.color)}
            highlight={stats.byDay.findIndex((d) => d.day === today)}
            selected={selected}
            onSelect={setSelected}
            describe={(i) => describeDay(stats.byDay[i]!)}
            tooltip={(i) => {
              const d = stats.byDay[i]!;
              return {
                title: dayTitle(d.day),
                rows: d.future
                  ? [{ label: 'Ainda não chegou', value: '' }]
                  : series.map((s, k) => ({
                      label: s.label,
                      value: String([d.tasks, d.habits, d.routines][k]),
                      color: s.color,
                    })),
              };
            }}
            height={190}
          />
        </>
      )}
    </Card>
  );
}

/** The month as a calendar, each day as strong as its plan was kept; all done in sand. */
function MonthCard({ stats }: { stats: Stats }) {
  const { colors } = useTheme();
  const today = toDateKey(new Date());
  const offset = leadingBlanks(fromDateKey(stats.period.from).getDay(), stats.period.weekStart);
  const cells: (Stats['byDay'][number] | null)[] = [
    ...Array<null>(offset).fill(null),
    ...stats.byDay,
  ];
  const full = stats.byDay.filter((d) => !d.future && d.due > 0 && d.kept >= d.due).length;
  return (
    <Card title="O mês em dias" subtitle={`${plural(full, 'dia', 'dias')} com tudo feito`}>
      <View style={styles.calRow}>
        {weekdayOrder(stats.period.weekStart).map((d) => (
          <Text key={d} variant="caption" tone="tertiary" style={styles.calHead}>
            {LETTERS[d]}
          </Text>
        ))}
      </View>
      <View style={styles.calGrid}>
        {cells.map((d, i) => {
          if (!d) return <View key={`gap-${i}`} style={styles.calCell} />;
          const rate = dayRate(d);
          const all = rate === 1;
          return (
            <View
              key={d.day}
              accessible
              accessibilityLabel={
                d.future
                  ? `${dayTitle(d.day)}: ainda não chegou`
                  : d.due === 0
                    ? `${dayTitle(d.day)}: nada planejado`
                    : `${dayTitle(d.day)}: ${d.kept} de ${d.due} feitos`
              }
              style={[
                styles.calCell,
                {
                  backgroundColor: d.future
                    ? 'transparent'
                    : all
                      ? colors.deepAccent
                      : rate === null
                        ? withAlpha(colors.textSecondary, 0.06)
                        : withAlpha(colors.accent, 0.16 + rate * 0.6),
                  borderColor: d.day === today ? colors.textPrimary : 'transparent',
                },
              ]}
            >
              <Text
                variant="caption"
                style={[
                  styles.calNumber,
                  {
                    color: all
                      ? colors.onDeepAccent
                      : (rate ?? 0) > 0.6
                        ? colors.onAccent
                        : d.future
                          ? colors.textTertiary
                          : colors.textSecondary,
                  },
                ]}
              >
                {fromDateKey(d.day).getDate()}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={styles.scale}>
        <View style={[styles.scaleKey, { backgroundColor: withAlpha(colors.accent, 0.22) }]} />
        <View style={[styles.scaleKey, { backgroundColor: withAlpha(colors.accent, 0.5) }]} />
        <View style={[styles.scaleKey, { backgroundColor: withAlpha(colors.accent, 0.76) }]} />
        <Text variant="caption" tone="tertiary">
          parte feita
        </Text>
        <View style={[styles.scaleKey, styles.scaleGap, { backgroundColor: colors.deepAccent }]} />
        <Text variant="caption" tone="tertiary">
          tudo feito
        </Text>
      </View>
    </Card>
  );
}

/** Each habit: its days in the period, the planned days done, the share and the streak. */
function HabitsTable({ stats }: { stats: Stats }) {
  const { colors } = useTheme();
  const router = useRouter();
  const wide = useBreakpoint() !== 'compact';
  const { data: habits = [] } = useHabits();
  const today = toDateKey(new Date());
  return (
    <Card title="Hábitos" subtitle="Os dias planejados que foram feitos">
      <View style={[styles.tr, styles.thead, { borderBottomColor: colors.separator }]}>
        <Text variant="caption" tone="tertiary" style={styles.colName}>
          Hábito
        </Text>
        <Text variant="caption" tone="tertiary" style={styles.colStrip}>
          Dias
        </Text>
        <Text variant="caption" tone="tertiary" style={[styles.colNum, styles.num]}>
          Feitos
        </Text>
        <Text variant="caption" tone="tertiary" style={[styles.colNum, styles.num]}>
          %
        </Text>
        {wide ? (
          <Text variant="caption" tone="tertiary" style={[styles.colNum, styles.num]}>
            Seguidos
          </Text>
        ) : null}
      </View>
      {stats.habitRows.map((h) => {
        const habit = habits.find((x) => x.id === h.id);
        return (
          <Pressable
            key={h.id}
            onPress={() => router.push({ pathname: '/aquarium/habits/[id]', params: { id: h.id } })}
            accessibilityRole="button"
            accessibilityLabel={`${h.name}: ${h.done} de ${h.due} dias planejados${h.total > h.done ? `, ${h.total} no total` : ''}`}
            accessibilityHint="Abre o hábito"
            style={({ pressed }) => [
              styles.tr,
              styles.trow,
              { borderBottomColor: colors.separator },
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.colName, styles.nameCell]}>
              <View style={[styles.thumb, { backgroundColor: colors.selected }]}>
                <CreatureArt creature={h.creature} stage={habit?.stage ?? 'young'} size={26} />
              </View>
              <Text variant="callout" numberOfLines={1} style={styles.flex}>
                {h.name}
              </Text>
            </View>
            <View style={[styles.colStrip, styles.strip]}>
              {h.days.map((state, i) => (
                <View
                  key={i}
                  style={[
                    styles.stripCell,
                    {
                      backgroundColor:
                        state === 'done'
                          ? colors.accent
                          : state === 'missed'
                            ? colors.surfacePressed
                            : state === 'rest'
                              ? withAlpha(colors.textSecondary, 0.08)
                              : // Still ahead: barely there, so the strip keeps its length.
                                withAlpha(colors.textSecondary, 0.03),
                      borderColor:
                        stats.period.days[i] === today ? colors.deepAccent : 'transparent',
                    },
                  ]}
                />
              ))}
            </View>
            <Text variant="footnote" tone="secondary" style={[styles.colNum, styles.num]}>
              {h.done}/{h.due}
            </Text>
            <Text variant="footnote" style={[styles.colNum, styles.num]}>
              {h.due > 0 ? pct(h.done / h.due) : '—'}
            </Text>
            {wide ? (
              <Text variant="footnote" tone="secondary" style={[styles.colNum, styles.num]}>
                {habit ? plural(habit.streak, 'dia', 'dias') : '—'}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
      <View style={styles.scale}>
        <View style={[styles.scaleKey, { backgroundColor: colors.accent }]} />
        <Text variant="caption" tone="tertiary">
          feito
        </Text>
        <View
          style={[styles.scaleKey, styles.scaleGap, { backgroundColor: colors.surfacePressed }]}
        />
        <Text variant="caption" tone="tertiary">
          não feito
        </Text>
        <View
          style={[
            styles.scaleKey,
            styles.scaleGap,
            { backgroundColor: withAlpha(colors.textSecondary, 0.06) },
          ]}
        />
        <Text variant="caption" tone="tertiary">
          sem plano
        </Text>
      </View>
    </Card>
  );
}

/** Each routine: its full days, its items and the share done, with a thin meter. */
function RoutinesTable({ stats }: { stats: Stats }) {
  const { colors, scheme } = useTheme();
  return (
    <Card title="Rotinas" subtitle="Os itens marcados nos dias de cada rotina">
      <View style={[styles.tr, styles.thead, { borderBottomColor: colors.separator }]}>
        <Text variant="caption" tone="tertiary" style={styles.colName}>
          Rotina
        </Text>
        <Text variant="caption" tone="tertiary" style={[styles.colNum, styles.num]}>
          Completos
        </Text>
        <Text variant="caption" tone="tertiary" style={[styles.colNum, styles.num]}>
          Itens
        </Text>
        <Text variant="caption" tone="tertiary" style={[styles.colMeter, styles.num]}>
          %
        </Text>
      </View>
      {stats.routineRows.map((r) => {
        const ratio = r.itemsDue > 0 ? r.itemsDone / r.itemsDue : 0;
        return (
          <View
            key={r.id}
            accessible
            accessibilityLabel={`${r.name}: ${r.itemsDone} de ${r.itemsDue} itens, ${r.fullDays} de ${r.days} dias completos`}
            style={[styles.tr, styles.trow, { borderBottomColor: colors.separator }]}
          >
            <View style={styles.colName}>
              <Text variant="callout" numberOfLines={1}>
                {r.name}
              </Text>
              {r.tag ? (
                <Text variant="caption" tone="tertiary" numberOfLines={1}>
                  {r.tag}
                </Text>
              ) : null}
            </View>
            <Text variant="footnote" tone="secondary" style={[styles.colNum, styles.num]}>
              {r.fullDays}/{r.days}
            </Text>
            <Text variant="footnote" tone="secondary" style={[styles.colNum, styles.num]}>
              {r.itemsDone}/{r.itemsDue}
            </Text>
            <View style={styles.colMeter}>
              <Text variant="footnote" style={styles.num}>
                {r.itemsDue > 0 ? pct(ratio) : '—'}
              </Text>
              <View style={[styles.meter, { backgroundColor: colors.surfacePressed }]}>
                <View
                  style={[
                    styles.meterFill,
                    {
                      width: `${Math.round(ratio * 100)}%`,
                      backgroundColor: chartColors.routines[scheme],
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        );
      })}
    </Card>
  );
}

function WeekdayCard({ stats }: { stats: Stats }) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<number | null>(null);
  // In the order the person's week runs (Sunday or Monday first).
  const order = weekdayOrder(stats.period.weekStart);
  const rates = order.map((d) => stats.weekdayRate[d]!);
  const names = order.map((d) => DAY_NAMES[d]!);
  if (rates.every((r) => r === null)) return null;
  const best = rates.reduce<number>((b, r, i) => ((r ?? -1) > (rates[b] ?? -1) ? i : b), 0);
  return (
    <Card title="Por dia da semana" subtitle="Quanto do planejado foi feito">
      <Columns
        data={rates.map((r, i) => ({ label: DAY_SHORT[order[i]!]!, values: [r ?? 0] }))}
        colors={[colors.accent]}
        max={1}
        hideAxis
        valueLabel={(i) => (i === best && selected === null ? pct(rates[i]) : null)}
        selected={selected}
        onSelect={setSelected}
        describe={(i) =>
          rates[i] === null
            ? `${names[i]}: nada planejado`
            : `${names[i]}: ${pct(rates[i])} do planejado`
        }
        tooltip={(i) => ({
          title: names[i]!,
          rows: [
            rates[i] === null
              ? { label: 'Nada planejado', value: '' }
              : { label: 'Feito', value: pct(rates[i]) },
          ],
        })}
        height={160}
      />
    </Card>
  );
}

function HoursCard({ stats }: { stats: Stats }) {
  const { colors } = useTheme();
  const order = weekdayOrder(stats.period.weekStart);
  const values = stats.hours.map((row) => order.map((d) => row[d]!));
  return (
    <Card title="Quando você conclui" subtitle="Coisas marcadas por parte do dia">
      <Heatmap
        rows={DAY_PARTS.map((p) => p.label)}
        columns={order.map((d) => LETTERS[d]!)}
        values={values}
        color={colors.accent}
        describe={(r, c) =>
          `${DAY_NAMES[order[c]!]}, ${DAY_PARTS[r]!.label.toLowerCase()}: ${plural(values[r]![c]!, 'coisa', 'coisas')}`
        }
      />
      <View style={styles.scale}>
        <Text variant="caption" tone="tertiary">
          menos
        </Text>
        {[0.2, 0.47, 0.73, 1].map((a) => (
          <View
            key={a}
            style={[styles.scaleKey, { backgroundColor: withAlpha(colors.accent, a) }]}
          />
        ))}
        <Text variant="caption" tone="tertiary">
          mais
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  accessory: { flex: 1, gap: spacing.sm },
  nav: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  navLabel: { flex: 1, textAlign: 'center' },
  body: { gap: spacing.md },
  flex: { flex: 1, minWidth: 0 },
  start: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  startIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: { borderRadius: radius.xl, padding: spacing.lg, gap: spacing.md },
  cardHalf: { flexBasis: '48%', flexGrow: 1 },
  cardFull: { flexBasis: '100%', flexGrow: 1 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, minHeight: 32 },
  cardFoot: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: -spacing.sm },
  lead: { gap: spacing.lg },
  leadHead: { gap: spacing.md },
  leadHeadWide: { flexDirection: 'row', alignItems: 'flex-end' },
  leadSide: { gap: spacing.sm },
  leadSideWide: { alignItems: 'flex-end' },
  // The one hero figure of the screen: big, the same sans, proportional digits.
  hero: { fontFamily: fontFamily.displayBold, fontSize: 56, lineHeight: 62, letterSpacing: -2 },
  delta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  figures: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  figuresWide: { flexWrap: 'nowrap', gap: spacing.md },
  figure: {
    flexBasis: '30%',
    flexGrow: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xxs,
    minWidth: 104,
  },
  figureRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  figureValue: {
    fontFamily: fontFamily.displaySemiBold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -0.8,
  },
  grid: { gap: spacing.md },
  gridWide: { flexDirection: 'row', flexWrap: 'wrap' },
  tr: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  thead: { paddingTop: 0 },
  trow: { paddingVertical: spacing.sm },
  td: { flex: 1 },
  num: { textAlign: 'right', fontVariant: ['tabular-nums'] },
  colName: { flex: 1.4, minWidth: 0 },
  nameCell: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  colStrip: { flex: 1.2 },
  colNum: { width: 58 },
  colMeter: { width: 72, gap: 4, alignItems: 'flex-end' },
  thumb: {
    width: 32,
    height: 32,
    borderRadius: radius.sm + 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  strip: { flexDirection: 'row', gap: 2, height: 18 },
  stripCell: { flex: 1, borderRadius: 3, borderWidth: 1.5, maxWidth: 16 },
  meter: { width: '100%', height: 4, borderRadius: 2, overflow: 'hidden' },
  meterFill: { height: '100%', borderRadius: 2 },
  pressed: { opacity: 0.75 },
  scale: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
  scaleKey: { width: 12, height: 12, borderRadius: 3 },
  scaleGap: { marginLeft: spacing.sm },
  calRow: { flexDirection: 'row' },
  calHead: { width: `${100 / 7}%`, textAlign: 'center' },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calCell: {
    width: `${100 / 7 - 1}%`,
    margin: '0.5%',
    aspectRatio: 1.25,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    padding: 4,
  },
  calNumber: { fontVariant: ['tabular-nums'] },
});
