import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { fromDateKey, leadingBlanks, toDateKey, weekdayOrder } from '@/core/dates';
import { useCalendarPrefs } from '@/core/preferences/calendarPrefs';
import { useSetting } from '@/core/settings/useSetting';
import {
  AreaLine,
  Button,
  Columns,
  EmptyState,
  Surface,
  Heatmap,
  IconButton,
  Legend,
  Screen,
  SegmentedControl,
  Tag,
  Text,
  chartColors,
  listColors,
  radius,
  spacing,
  useBreakpoint,
  useCountUpText,
  useTheme,
  withAlpha,
} from '@/design-system';
import { CreatureArt } from '@/features/habits/components/CreatureArt';
import { useHabits } from '@/features/habits/hooks/queries';

import { useGamePrefs } from '../settings/prefs';
import { DAY_PARTS, periodOf, shiftPeriod, type Stats, type StatsMode } from './computeStats';
import { ConsistencyRing, consistency } from './ConsistencyCard';
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
/** "Ver mais detalhes": the charts beyond the essentials, remembered open or closed. */
const DETAILS_SETTING = 'stats.details';

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
 * Statistics for a week or a month (Fase 6, simple on purpose): the consistency as the main
 * number (how much of the planned got done), compared with the period before; what got done and
 * the longest streak; the period day by day; each habit and routine. The charts beyond that
 * (by day and kind, depth, weekdays, hours) wait under "Ver mais detalhes". Everything comes from
 * what was really marked in the app.
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
  const { showDepth } = useGamePrefs();
  const [details, setDetails] = useSetting<string>(DETAILS_SETTING, 'off');
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
  const best = habits.reduce<(typeof habits)[number] | null>(
    (top, h) => (h.streak > (top?.streak ?? 0) ? h : top),
    null,
  );
  const done = stats.totals.all > 0;
  const open = details === 'on';

  return (
    <View style={styles.body}>
      {/* Nothing done in the period: a line on what to do instead of a row of zeros. */}
      {done ? (
        <View style={[styles.top, wide && styles.topWide]}>
          <ConsistencyHero stats={stats} previous={previous} />
          <View style={[styles.kpis, wide && styles.kpisColumn]}>
            <Kpi
              label="Concluídos"
              value={String(stats.totals.all)}
              note="tarefas, hábitos e itens de rotina"
            />
            <Kpi
              label="Maior sequência"
              value={best ? plural(best.streak, 'dia', 'dias') : '—'}
              note={best ? best.name : 'marque um hábito hoje'}
            />
          </View>
        </View>
      ) : (
        <StartCard title={startTitle} />
      )}
      <View style={[styles.grid, wide && styles.gridWide]}>
        {done ? <DaysCard stats={stats} /> : null}
        {stats.habitRows.length > 0 ? <HabitsCard stats={stats} /> : null}
        {stats.routineRows.length > 0 ? <RoutinesCard stats={stats} /> : null}
      </View>
      {done ? (
        <>
          <View style={styles.more}>
            <Button
              label={open ? 'Esconder detalhes' : 'Ver mais detalhes'}
              variant="ghost"
              onPress={() => void setDetails(open ? 'off' : 'on')}
            />
          </View>
          {open ? (
            <View style={[styles.grid, wide && styles.gridWide]}>
              <ByDayCard stats={stats} wide={wide} />
              {showDepth ? <DepthCard stats={stats} wide={wide} /> : null}
              {!week ? <CalendarCard stats={stats} /> : null}
              <WeekdayCard stats={stats} />
              <HoursCard stats={stats} />
            </View>
          ) : null}
        </>
      ) : null}
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

const RING = 132;
const RING_PHONE = 104;

/**
 * The main number: how much of the planned habits and routine items got done in the period, as
 * a big ring, and how it compares with the period before, said in words. Never a scolding: a
 * lower number just says what the last one was.
 */
function ConsistencyHero({ stats, previous }: { stats: Stats; previous: Stats }) {
  const { colors } = useTheme();
  const wide = useBreakpoint() !== 'compact';
  const week = stats.period.mode === 'week';
  const rate = consistency(stats.planned);
  const before = consistency(previous.planned);
  const percent = rate === null ? null : Math.round(rate * 100);
  const last = before === null ? null : Math.round(before * 100);
  const title = week ? 'Consistência da semana' : 'Consistência do mês';
  const sentence =
    rate === null
      ? week
        ? 'Nada planejado ainda nesta semana'
        : 'Nada planejado ainda neste mês'
      : `${stats.planned.done} de ${stats.planned.due} hábitos e rotinas feitos`;
  // Short on the tag, whole for screen readers.
  const lastPeriod = week ? 'a semana passada' : 'o mês passado';
  const same = week ? 'Igual à semana passada' : 'Igual ao mês passado';
  const compare =
    percent === null || last === null
      ? null
      : percent > last
        ? {
            tag: `Subiu · era ${last}%`,
            said: `Melhor que ${lastPeriod}, que foi ${last}%`,
            up: true,
          }
        : percent === last
          ? { tag: same, said: same, up: false }
          : {
              tag: `${week ? 'Semana passada' : 'Mês passado'}: ${last}%`,
              said: `${week ? 'A semana passada' : 'O mês passado'} foi ${last}%`,
              up: false,
            };
  return (
    <View
      style={[styles.hero, wide && styles.heroWide, { backgroundColor: colors.surfaceRaised }]}
      accessible
      accessibilityLabel={[
        percent === null ? title : `${title}: ${percent}%`,
        sentence,
        compare?.said,
      ]
        .filter(Boolean)
        .join('. ')}
    >
      <ConsistencyRing rate={rate} size={wide ? RING : RING_PHONE} stroke={wide ? 11 : 9} big />
      <View style={styles.heroText}>
        <Text variant={wide ? 'title2' : 'headline'}>{title}</Text>
        <Text variant="callout" tone="secondary">
          {sentence}
        </Text>
        {compare ? (
          <View style={styles.heroTag}>
            <Tag label={compare.tag} tone={compare.up ? 'sand' : 'neutral'} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

const dayRate = (d: Stats['byDay'][number]) => (d.due > 0 ? Math.min(1, d.kept / d.due) : null);

function describeKept(d: Stats['byDay'][number]) {
  if (d.future) return `${dayTitle(d.day)}: ainda não chegou`;
  if (d.due === 0) return `${dayTitle(d.day)}: nada planejado`;
  return `${dayTitle(d.day)}: ${d.kept} de ${d.due} feitos`;
}

/**
 * The period day by day, in the same terms as the main number: how much of each day's plan got
 * done. A week as seven capsules, a month as a calendar. Days with everything done are sand.
 */
function DaysCard({ stats }: { stats: Stats }) {
  const week = stats.period.mode === 'week';
  const full = stats.byDay.filter((d) => !d.future && d.due > 0 && d.kept >= d.due).length;
  return (
    <Card title="Dia a dia" span>
      {week ? <WeekDays stats={stats} /> : <MonthDays stats={stats} />}
      <Text variant="footnote" tone="secondary">
        {full === 0
          ? 'Os dias com tudo feito ficam em areia.'
          : `${plural(full, 'dia', 'dias')} com tudo feito.`}
      </Text>
    </Card>
  );
}

function WeekDays({ stats }: { stats: Stats }) {
  const { colors } = useTheme();
  const today = toDateKey(new Date());
  return (
    <View style={styles.weekDays}>
      {stats.byDay.map((d) => {
        const rate = dayRate(d);
        const full = rate === 1;
        const rest = rate === null && !d.future;
        return (
          <View key={d.day} style={styles.weekDay} accessible accessibilityLabel={describeKept(d)}>
            <View
              style={[
                styles.capsule,
                {
                  backgroundColor: rest ? 'transparent' : colors.surfacePressed,
                  borderColor:
                    d.day === today ? colors.deepAccent : rest ? colors.border : 'transparent',
                  borderStyle: rest && d.day !== today ? 'dashed' : 'solid',
                  opacity: d.future ? 0.45 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.capsuleFill,
                  {
                    height: `${Math.round((rate ?? 0) * 100)}%`,
                    backgroundColor: full ? colors.deepAccent : colors.accent,
                  },
                ]}
              />
            </View>
            <Text variant="caption" tone={d.day === today ? 'primary' : 'tertiary'}>
              {LETTERS[fromDateKey(d.day).getDay()]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function MonthDays({ stats }: { stats: Stats }) {
  const { colors } = useTheme();
  const today = toDateKey(new Date());
  const offset = leadingBlanks(fromDateKey(stats.period.from).getDay(), stats.period.weekStart);
  const cells: (Stats['byDay'][number] | null)[] = [
    ...Array<null>(offset).fill(null),
    ...stats.byDay,
  ];
  return (
    <View>
      <View style={styles.calRow}>
        {weekdayOrder(stats.period.weekStart).map((d) => (
          <Text key={d} variant="caption" tone="tertiary" style={styles.calHead}>
            {LETTERS[d]}
          </Text>
        ))}
      </View>
      <View style={styles.calGrid}>
        {cells.map((d, i) => {
          if (!d) return <View key={`gap-${i}`} style={[styles.calCell, styles.calGap]} />;
          const rate = dayRate(d);
          const full = rate === 1;
          return (
            <View
              key={d.day}
              accessible
              accessibilityLabel={describeKept(d)}
              style={[
                styles.calCell,
                {
                  backgroundColor: d.future
                    ? withAlpha(colors.textSecondary, 0.05)
                    : full
                      ? colors.deepAccent
                      : rate === null
                        ? 'transparent'
                        : withAlpha(colors.accent, 0.14 + rate * 0.6),
                  borderColor: d.day === today ? colors.textPrimary : 'transparent',
                },
              ]}
            >
              <Text
                variant="caption"
                style={{
                  color: full
                    ? colors.onDeepAccent
                    : (rate ?? 0) > 0.6
                      ? colors.onAccent
                      : colors.textSecondary,
                }}
              >
                {fromDateKey(d.day).getDate()}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function Kpi({ label, value, note }: { label: string; value: string; note: string }) {
  const { colors } = useTheme();
  // The number counts up to its value (Fase 5); the label already says the final one.
  const shown = useCountUpText(value);
  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}. ${note}`}
      style={[styles.kpi, { backgroundColor: colors.surfaceRaised, borderColor: colors.border }]}
    >
      <Text variant="overline" tone="tertiary">
        {label}
      </Text>
      <Text variant="title1" style={styles.kpiValue}>
        {shown}
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
  const offset = leadingBlanks(fromDateKey(stats.period.from).getDay(), stats.period.weekStart);
  const full = stats.byDay.filter((d) => d.fullTide).length;
  const cells: (Stats['byDay'][number] | null)[] = [
    ...Array<null>(offset).fill(null),
    ...stats.byDay,
  ];
  return (
    <Card title={`Dias de maré cheia · ${full}`}>
      <View style={styles.calRow}>
        {weekdayOrder(stats.period.weekStart).map((d) => (
          <Text key={d} variant="caption" tone="tertiary" style={styles.calHead}>
            {LETTERS[d]}
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
                {d.fullTide ? ' · maré cheia' : ''}
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
  // In the order the person's week runs (Sunday or Monday first).
  const order = weekdayOrder(stats.period.weekStart);
  const rates = order.map((d) => stats.weekdayRate[d]!);
  const names = order.map((d) => DAY_NAMES[d]!);
  if (rates.every((r) => r === null)) return null;
  const pct = (r: number | null) => (r === null ? '—' : `${Math.round(r * 100)}%`);
  const best = rates.reduce<number>((b, r, i) => ((r ?? -1) > (rates[b] ?? -1) ? i : b), 0);
  return (
    <Card title="Do planejado, por dia da semana">
      <Columns
        data={rates.map((r, i) => ({ label: DAY_SHORT[order[i]!]!, values: [r ?? 0] }))}
        colors={[colors.accent]}
        max={1}
        hideAxis
        valueLabel={(i) => (i === best || i === selected ? pct(rates[i]!) : null)}
        selected={selected}
        onSelect={setSelected}
        describe={(i) =>
          rates[i] === null
            ? `${names[i]}: nada planejado`
            : `${names[i]}: ${pct(rates[i]!)} do planejado`
        }
        height={140}
      />
    </Card>
  );
}

function HoursCard({ stats }: { stats: Stats }) {
  const { scheme } = useTheme();
  if (stats.totals.all === 0) return null;
  const order = weekdayOrder(stats.period.weekStart);
  const values = stats.hours.map((row) => order.map((d) => row[d]!));
  return (
    <Card title="Quando você mais conclui">
      <Heatmap
        rows={DAY_PARTS.map((p) => p.label)}
        columns={order.map((d) => LETTERS[d]!)}
        values={values}
        color={listColors.lagoon[scheme]}
        describe={(r, c) =>
          `${DAY_NAMES[order[c]!]}, ${DAY_PARTS[r]!.label.toLowerCase()}: ${plural(values[r]![c]!, 'coisa', 'coisas')}`
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
  const router = useRouter();
  const { data: habits = [] } = useHabits();
  return (
    <Card title="Hábitos">
      {stats.habitRows.map((h) => (
        <Pressable
          key={h.id}
          onPress={() => router.push({ pathname: '/aquarium/habits/[id]', params: { id: h.id } })}
          accessibilityRole="button"
          accessibilityLabel={`${h.name}: ${h.done} de ${h.due} dias planejados${h.total > h.done ? `, ${h.total} no total` : ''}`}
          accessibilityHint="Abre o hábito"
          style={({ pressed }) => [
            styles.row,
            { borderBottomColor: colors.separator },
            pressed && styles.pressed,
          ]}
        >
          <View style={[styles.thumb, { backgroundColor: colors.selected }]}>
            <CreatureArt
              creature={h.creature}
              stage={habits.find((x) => x.id === h.id)?.stage ?? 'young'}
              size={30}
            />
          </View>
          <Text variant="callout" numberOfLines={1} style={styles.flex}>
            {h.name}
          </Text>
          <Text variant="footnote" tone="secondary" style={styles.num}>
            {h.done} de {h.due}
          </Text>
          <Meter ratio={h.due > 0 ? Math.min(1, h.done / h.due) : 0} />
        </Pressable>
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
  top: { gap: spacing.sm },
  topWide: { flexDirection: 'row' },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  heroWide: { flexGrow: 1.6, flexBasis: 0 },
  heroText: { flex: 1, gap: spacing.xxs },
  heroTag: { marginTop: spacing.xs },
  kpis: { flexDirection: 'row', gap: spacing.sm },
  kpisColumn: { flexDirection: 'column', flexGrow: 1, flexBasis: 0 },
  kpi: {
    flexBasis: 0,
    flexGrow: 1,
    justifyContent: 'center',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 2,
  },
  more: { alignItems: 'center' },
  weekDays: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.xs },
  weekDay: { flex: 1, alignItems: 'center', gap: spacing.xs },
  capsule: {
    width: '100%',
    maxWidth: 44,
    height: 76,
    borderRadius: radius.md,
    borderWidth: 2,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  capsuleFill: { width: '100%' },
  thumb: {
    width: 36,
    height: 36,
    borderRadius: radius.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.75 },
  start: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  startIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: { fontVariant: ['tabular-nums'] },
  grid: { gap: spacing.md },
  gridWide: { flexDirection: 'row', flexWrap: 'wrap' },
  card: { borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm },
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
